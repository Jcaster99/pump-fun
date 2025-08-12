/**
 * Transaction Listener
 * 
 * Obsługuje powiadomienia o transakcjach i aktualizuje stan bazy danych
 * zgodnie z modelem AMM z wirtualnymi rezerwami
 */

const Pool = require('../models/pool');
const { getDbConnection } = require('../db/init');
const logger = require('./logger');

class TransactionListener {
  /**
   * Obsługuje powiadomienie o transakcji zakupu
   * 
   * @param {Object} transactionData - Dane transakcji
   * @param {string} transactionData.poolContractAddress - Adres kontraktu puli
   * @param {string} transactionData.txHash - Hash transakcji
   * @param {string} transactionData.walletAddress - Adres portfela wykonującego transakcję
   * @param {number} transactionData.usdtAmount - Ilość USDT wydana na zakup
   * @param {number} [transactionData.tokenAmount] - Opcjonalnie, jeśli znana jest dokładna ilość tokenów
   * @param {number} [transactionData.feeAmount] - Opcjonalnie, jeśli znana jest dokładna opłata
   * @returns {boolean} - Czy operacja się powiodła
   */
  static async handleBuyTransaction(transactionData) {
    try {
      const {
        poolContractAddress,
        txHash,
        walletAddress,
        usdtAmount,
        tokenAmount: providedTokenAmount,
        feeAmount: providedFeeAmount
      } = transactionData;
      
      logger.log(`Processing buy transaction for pool ${poolContractAddress}: ${txHash}`);
      logger.log(`Received from frontend: tokenAmount=${providedTokenAmount}, usdtAmount=${usdtAmount}`);
      
      // ★★★ UWAGA: Przekazujemy wartości jako dokładne stringi, bez konwersji
      logger.log(`EXACT VALUES: tokenAmount(string)=${String(providedTokenAmount)}, usdtAmount(string)=${String(usdtAmount)}`);
      
      // Znajdź pool w bazie danych
      const pool = Pool.getByContractAddress(poolContractAddress);
      if (!pool) {
        logger.error(`Pool not found for address: ${poolContractAddress}`);
        return false;
      }
      
      // Sprawdź czy transakcja już istnieje
      const db = getDbConnection();
      const existingTx = db.prepare(`
        SELECT id FROM transactions WHERE tx_hash = ?
      `).get(txHash);
      db.close();
      
      if (existingTx) {
        logger.log(`Transaction ${txHash} already processed, skipping`);
        return true;
      }
      
      // Jeśli nie znamy dokładnej ilości tokenów, oblicz ją na podstawie formuły bonding curve
      let tokenAmount = providedTokenAmount;
      let tokenAmountBeforeFee; // Nowa zmienna do przechowywania wartości przed opłatą
      let feeAmount = providedFeeAmount;
      let newReserveToken, newReserveUsdt;
      let reservesBefore, reservesAfter;
      let newPrice;
      
      if (!tokenAmount || !feeAmount) {
        // Oblicz ilość tokenów na podstawie formuły bonding curve
        const calculation = Pool.calculateBuyAmount(pool.id, usdtAmount);
        
        tokenAmount = calculation.tokensOut;
        tokenAmountBeforeFee = calculation.tokensOutBeforeFee; // Używamy nowej wartości
        feeAmount = calculation.fee;
        newPrice = calculation.newPrice;
        reservesBefore = calculation.reservesBefore;
        reservesAfter = calculation.reservesAfter;
        
        // Wyprowadź nowe realne rezerwy z reservesAfter (odejmij część wirtualną)
        newReserveToken = reservesAfter.token - pool.virtual_reserve_token;
        newReserveUsdt = reservesAfter.usdt - pool.virtual_reserve_usdt;
        
        // Fallback: jeśli tokenAmount wyszedł 0 (problem precyzji przy bardzo małym usdtAmount
        // względem ogromnych wirtualnych rezerw) – policz liniową proporcją.
        if (!tokenAmount || tokenAmount === 0) {
          const effectiveReserveUsdt = pool.reserve_usdt + pool.virtual_reserve_usdt;
          const effectiveReserveToken = pool.reserve_token + pool.virtual_reserve_token;

          // Przybliżenie: Δtoken ≈ usdtAfterFee / effectiveReserveUsdt * effectiveReserveToken
          const approxTokens = (usdtAmount / effectiveReserveUsdt) * effectiveReserveToken;

          // przyjmijmy 3 znaczące cyfry bezpieczeństwa
          tokenAmount = parseFloat(approxTokens.toFixed(6));
          
          // Obliczamy również wartość przed opłatą
          const feePercent = pool.trade_fee_percent || 0.1;
          feeAmount = (usdtAmount * feePercent) / 100;
          const usdtAfterFee = usdtAmount - feeAmount;
          
          // Szacujemy tokenAmountBeforeFee proporcjonalnie
          tokenAmountBeforeFee = tokenAmount / (1 - (feePercent / 100));
          
          newReserveUsdt = pool.reserve_usdt + usdtAmount;
          newReserveToken = pool.reserve_token - tokenAmount;

          // Efektywne rezerwy po transakcji
          const effectiveUsdtAfter = newReserveUsdt + pool.virtual_reserve_usdt;
          const effectiveTokenAfter = newReserveToken + pool.virtual_reserve_token;
          newPrice = effectiveUsdtAfter / effectiveTokenAfter;

          reservesBefore = {
            token: effectiveReserveToken,
            usdt: effectiveReserveUsdt
          };
          reservesAfter = {
            token: effectiveTokenAfter,
            usdt: effectiveUsdtAfter
          };
        }
      } else {
        // WAŻNA ZMIANA: Jeśli tokenAmount zostało dostarczone z frontendu,
        // to używamy DOKŁADNIE tej wartości, a nie przeliczamy jej ponownie
        logger.log(`Using provided token amount from frontend: ${tokenAmount}`);
        logger.log(`EXACT STRING VALUE: ${String(tokenAmount)}`);
        
        // Używamy dostarczonych wartości
        // ★★★ NIE KONWERTUJEMY String -> Number -> String, zachowujemy oryginalny format
        tokenAmountBeforeFee = tokenAmount;
        
        newReserveUsdt = pool.reserve_usdt + usdtAmount;
        newReserveToken = pool.reserve_token - tokenAmount;
        
        // Obliczamy rezerwy efektywne
        const effectiveReserveUsdtBefore = pool.reserve_usdt + pool.virtual_reserve_usdt;
        const effectiveReserveTokenBefore = pool.reserve_token + pool.virtual_reserve_token;
        
        const effectiveReserveUsdtAfter = newReserveUsdt + pool.virtual_reserve_usdt;
        const effectiveReserveTokenAfter = newReserveToken + pool.virtual_reserve_token;
        
        newPrice = effectiveReserveUsdtAfter / effectiveReserveTokenAfter;
        
        reservesBefore = {
          token: effectiveReserveTokenBefore,
          usdt: effectiveReserveUsdtBefore
        };
        
        reservesAfter = {
          token: effectiveReserveTokenAfter,
          usdt: effectiveReserveUsdtAfter
        };
      }
      
      // Sprawdź czy wartości są sensowne (tokenAmount musi być >0). 
      // Jeśli nowa rezerwa tokenów wychodzi ujemna (może się zdarzyć, gdy większość
      // tokenów pochodzi z części wirtualnej), przycinamy ją do zera – traktujemy to
      // jako kompletne wykorzystanie realnych rezerw.
      if (tokenAmount <= 0) {
        logger.error(`Invalid calculation results for transaction ${txHash}: tokenAmount=${tokenAmount}`);
        return false;
      }

      if (newReserveToken < 0) {
        logger.warn(`newReserveToken < 0 (${newReserveToken}). Clamping to 0 for tx ${txHash}`);
        newReserveToken = 0;
      }
      
      // Aktualizuj rezerwy w bazie danych
      const updateResult = Pool.updateReserves(pool.id, newReserveToken, newReserveUsdt);
      logger.log(`Updated reserves for pool ${poolContractAddress}: token=${newReserveToken}, usdt=${newReserveUsdt}, price=${updateResult.newPrice}`);
      
      // Zapisz transakcję
      logger.log(`About to record transaction with tokenAmount=${tokenAmount} (original from frontend: ${providedTokenAmount})`);
      logger.log(`EXACT VALUES FOR DB: token=${String(tokenAmount)}, usdt=${String(usdtAmount)}`);
      
      // Pobierz aktualną cenę realtime z bazy danych
      const currentPool = db.prepare('SELECT price_realtime, price FROM pools WHERE id = ?').get(pool.id);
      
      Pool.recordTransaction({
        poolId: pool.id,
        type: 'buy',
        txHash,
        walletAddress,
        tokenAmount, // Używamy oryginalnej wartości zamiast tokenAmountBeforeFee
        usdtAmount, // Oryginalna wartość USDT przed opłatą
        feeAmount,
        reservesBefore,
        reservesAfter,
        price: currentPool.price_realtime || newPrice || updateResult.newPrice
      });
      
      // Aktualizacja change_24h na podstawie najstarszej transakcji z ostatnich 24h
      try {
        Pool.updatePriceChange24h(pool.id);
      } catch (change24hError) {
        logger.error('Error updating change_24h:', change24hError);
        // Nie przerywamy obsługi transakcji, jeśli aktualizacja change_24h się nie powiedzie
      }
      
      logger.log(`Recorded buy transaction ${txHash} for pool ${poolContractAddress}`);
      return true;
    } catch (error) {
      logger.error('Error handling buy transaction:', error);
      return false;
    }
  }
  
  /**
   * Obsługuje powiadomienie o transakcji sprzedaży
   * 
   * @param {Object} transactionData - Dane transakcji
   * @param {string} transactionData.poolContractAddress - Adres kontraktu puli
   * @param {string} transactionData.txHash - Hash transakcji
   * @param {string} transactionData.walletAddress - Adres portfela wykonującego transakcję
   * @param {number} transactionData.tokenAmount - Ilość tokenów sprzedanych
   * @param {number} [transactionData.usdtAmount] - Opcjonalnie, jeśli znana jest dokładna ilość USDT
   * @param {number} [transactionData.feeAmount] - Opcjonalnie, jeśli znana jest dokładna opłata
   * @returns {boolean} - Czy operacja się powiodła
   */
  static async handleSellTransaction(transactionData) {
    try {
      const {
        poolContractAddress,
        txHash,
        walletAddress,
        tokenAmount,
        usdtAmount: providedUsdtAmount,
        feeAmount: providedFeeAmount
      } = transactionData;
      
      logger.log(`Processing sell transaction for pool ${poolContractAddress}: ${txHash}`);
      logger.log(`Received from frontend: tokenAmount=${tokenAmount}, usdtAmount=${providedUsdtAmount}`);
      
      // ★★★ UWAGA: Przekazujemy wartości jako dokładne stringi, bez konwersji
      logger.log(`EXACT VALUES: tokenAmount(string)=${String(tokenAmount)}, usdtAmount(string)=${String(providedUsdtAmount)}`);
      
      // Znajdź pool w bazie danych
      const pool = Pool.getByContractAddress(poolContractAddress);
      if (!pool) {
        logger.error(`Pool not found for address: ${poolContractAddress}`);
        return false;
      }
      
      // Sprawdź czy transakcja już istnieje
      const db = getDbConnection();
      const existingTx = db.prepare(`
        SELECT id FROM transactions WHERE tx_hash = ?
      `).get(txHash);
      db.close();
      
      if (existingTx) {
        logger.log(`Transaction ${txHash} already processed, skipping`);
        return true;
      }
      
      // Jeśli nie znamy dokładnej ilości USDT, oblicz ją na podstawie formuły bonding curve
      let usdtAmount = providedUsdtAmount;
      let usdtAmountBeforeFee; // Nowa zmienna do przechowywania wartości przed opłatą
      let feeAmount = providedFeeAmount;
      let newReserveToken, newReserveUsdt;
      let reservesBefore, reservesAfter;
      let newPrice;
      
      if (!usdtAmount || !feeAmount) {
        // Oblicz ilość USDT na podstawie formuły bonding curve
        const calculation = Pool.calculateSellAmount(pool.id, tokenAmount);
        
        usdtAmount = calculation.usdtOut;
        usdtAmountBeforeFee = calculation.usdtOutBeforeFee; // Używamy nowej wartości
        feeAmount = calculation.fee;
        newPrice = calculation.newPrice;
        reservesBefore = calculation.reservesBefore;
        reservesAfter = calculation.reservesAfter;
        // Wyprowadź nowe rezerwy z reservesAfter (odjęcie wirtualnych)
        newReserveToken = reservesAfter.token - pool.virtual_reserve_token;
        newReserveUsdt = reservesAfter.usdt - pool.virtual_reserve_usdt;
      } else {
        // WAŻNA ZMIANA: Jeśli usdtAmount zostało dostarczone z frontendu,
        // to używamy DOKŁADNIE tej wartości, a nie przeliczamy jej ponownie
        logger.log(`Using provided USDT amount from frontend: ${usdtAmount}`);
        logger.log(`EXACT STRING VALUE: ${String(usdtAmount)}`);
        
        // Używamy dostarczonych wartości
        // ★★★ NIE KONWERTUJEMY String -> Number -> String, zachowujemy oryginalny format
        usdtAmountBeforeFee = usdtAmount;
        
        newReserveToken = pool.reserve_token + tokenAmount;
        newReserveUsdt = pool.reserve_usdt - usdtAmount;
        
        // Obliczamy rezerwy efektywne
        const effectiveReserveUsdtBefore = pool.reserve_usdt + pool.virtual_reserve_usdt;
        const effectiveReserveTokenBefore = pool.reserve_token + pool.virtual_reserve_token;
        
        const effectiveReserveUsdtAfter = newReserveUsdt + pool.virtual_reserve_usdt;
        const effectiveReserveTokenAfter = newReserveToken + pool.virtual_reserve_token;
        
        newPrice = effectiveReserveUsdtAfter / effectiveReserveTokenAfter;
        
        reservesBefore = {
          token: effectiveReserveTokenBefore,
          usdt: effectiveReserveUsdtBefore
        };
        
        reservesAfter = {
          token: effectiveReserveTokenAfter,
          usdt: effectiveReserveUsdtAfter
        };
      }
      
      // Fallback / sanity checks
      if (usdtAmount <= 0) {
        logger.error(`Invalid calculation results for transaction ${txHash}: usdtAmount=${usdtAmount}`);
        return false;
      }
      
      if (newReserveUsdt < 0) {
        logger.warn(`newReserveUsdt < 0 (${newReserveUsdt}). Clamping to 0 for tx ${txHash}`);
        newReserveUsdt = 0;
      }
      
      // Aktualizuj rezerwy w bazie danych
      const updateResult = Pool.updateReserves(pool.id, newReserveToken, newReserveUsdt);
      logger.log(`Updated reserves for pool ${poolContractAddress}: token=${newReserveToken}, usdt=${newReserveUsdt}, price=${updateResult.newPrice}`);
      
      // Zapisz transakcję
      logger.log(`About to record sell transaction with usdtAmount=${usdtAmount} (original from frontend: ${providedUsdtAmount})`);
      logger.log(`EXACT VALUES FOR DB: token=${String(tokenAmount)}, usdt=${String(usdtAmount)}`);
      
      // Pobierz aktualną cenę realtime z bazy danych
      const currentPool = db.prepare('SELECT price_realtime, price FROM pools WHERE id = ?').get(pool.id);
      
      Pool.recordTransaction({
        poolId: pool.id,
        type: 'sell',
        txHash,
        walletAddress,
        tokenAmount, // Oryginalna wartość tokenów
        usdtAmount, // Używamy oryginalnej wartości zamiast usdtAmountBeforeFee
        feeAmount,
        reservesBefore,
        reservesAfter,
        price: currentPool.price_realtime || newPrice || updateResult.newPrice
      });
      
      // Aktualizacja change_24h na podstawie najstarszej transakcji z ostatnich 24h
      try {
        Pool.updatePriceChange24h(pool.id);
      } catch (change24hError) {
        logger.error('Error updating change_24h:', change24hError);
        // Nie przerywamy obsługi transakcji, jeśli aktualizacja change_24h się nie powiedzie
      }
      
      logger.log(`Recorded sell transaction ${txHash} for pool ${poolContractAddress}`);
      return true;
    } catch (error) {
      logger.error('Error handling sell transaction:', error);
      return false;
    }
  }
}

module.exports = TransactionListener; 