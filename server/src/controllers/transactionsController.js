const { getDbConnection } = require('../db/init');
// TransactionListener jest teraz używany tylko jako fallback (legacy)
const TransactionListener = require('../utils/transactionListener');
const Pool = require('../models/pool');
const { broadcastPoolTransaction, broadcastPoolData } = require('../utils/wsBroadcaster');
const logger = require('../utils/logger');

/**
 * Funkcja do parsowania sformatowanych wartości jak "1.00B", "2.5M" itp.
 * @param {string} supplyString - Sformatowany string (np. "1.00B")
 * @returns {number} - Rozparsowana liczba
 */
function parseFormattedSupply(supplyString) {
  if (!supplyString) return 0;
  
  // Usuń wszystkie spacje i zamień na uppercase
  const cleanStr = supplyString.toString().trim().toUpperCase();
  
  // Sprawdź czy zawiera oznaczenia B, M, K
  const multipliers = {
    'B': 1000000000,  // Miliard
    'M': 1000000,     // Milion
    'K': 1000         // Tysiąc
  };
  
  let multiplier = 1;
  let numericPart = cleanStr;
  
  // Sprawdź sufiks i ustaw odpowiedni mnożnik
  Object.keys(multipliers).forEach(key => {
    if (cleanStr.endsWith(key)) {
      multiplier = multipliers[key];
      numericPart = cleanStr.substring(0, cleanStr.length - 1);
    }
  });
  
  // Konwertuj część liczbową i pomnóż przez mnożnik
  const numValue = parseFloat(numericPart) || 0;
  return numValue * multiplier;
}

/**
 * Get the most recent transaction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLatestTransaction = (req, res) => {
  try {
    const db = getDbConnection();
    
    const query = `
      SELECT 
        transactions.id,
        transactions.price,
        transactions.amount,
        transactions.type,
        transactions.tx_hash,
        transactions.wallet_address,
        transactions.timestamp,
        pools.symbol,
        pools.name,
        pools.token_address
      FROM transactions
      JOIN pools ON transactions.pool_id = pools.id
      ORDER BY transactions.timestamp DESC
      LIMIT 1
    `;
    
    try {
      const transaction = db.prepare(query).get();
      
      if (!transaction) {
        db.close();
        return res.status(404).json({
          success: false,
          error: 'No transactions found'
        });
      }
      
      db.close();
      return res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      db.close();
      throw error;
    }
  } catch (error) {
    logger.error('Error in getLatestTransaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Zapisuje transakcję bezpośrednio w bazie danych, z dokładnymi wartościami przesłanymi z frontendu
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const recordTransaction = async (req, res) => {
  try {
    const {
      contract_address: contractAddress,
      token_amount: tokenAmount,
      usdt_amount: usdtAmount,
      type,
      tx_hash: txHash,
      wallet_address: walletAddress
    } = req.body;

    logger.log('Transaction API received:', {
      type,
      contract_address: contractAddress,
      token_amount: tokenAmount,
      usdt_amount: usdtAmount,
      tx_hash: txHash
    });

    // Basic validation
    if (!contractAddress || !txHash || !walletAddress || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (contract_address, type, tx_hash, wallet_address)'
      });
    }

    // Weryfikacja wymaganych pól dla danego typu transakcji
    if (type === 'buy' || type === 'sell') {
      if (!tokenAmount || !usdtAmount) {
        return res.status(400).json({
          success: false,
          error: `token_amount and usdt_amount are required for ${type}`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction type. Expected "buy" or "sell".'
      });
    }

    // Bezpośredni zapis transakcji do bazy danych
    const db = getDbConnection();
    
    try {
      // Znajdź pool w bazie danych
      const pool = db.prepare(`
        SELECT * FROM pools WHERE token_address = ?
      `).get(contractAddress);
      
      if (!pool) {
        db.close();
        return res.status(404).json({
          success: false,
          error: `Pool not found for address: ${contractAddress}`
        });
      }
      
      // Sprawdź czy transakcja już istnieje
      const existingTx = db.prepare(`
        SELECT id FROM transactions WHERE tx_hash = ?
      `).get(txHash);
      
      if (existingTx) {
        db.close();
        logger.log(`Transaction ${txHash} already processed, skipping`);
        return res.status(200).json({ 
          success: true,
          message: 'Transaction already processed'
        });
      }
      
      logger.log(`Saving transaction with exact values from frontend: token=${tokenAmount}, usdt=${usdtAmount}`);
      
      // Przygotowanie wartości
      // Używamy String() dla zachowania dokładnej reprezentacji
      const tokenAmountStr = String(tokenAmount);
      const usdtAmountStr = String(usdtAmount);
      const feeAmount = 0.0015; // Standardowa wartość fee
      const amount = type === 'buy' ? usdtAmountStr : tokenAmountStr;
      
      // Zachowaj wartości rezerw dla spójności danych
      const reserveTokenBefore = pool.reserve_token;
      const reserveUsdtBefore = pool.reserve_usdt;
      
      // Aktualizuj rezerwy w bazie danych
      let newReserveToken, newReserveUsdt;
      if (type === 'buy') {
        newReserveToken = reserveTokenBefore - Number(tokenAmountStr);
        newReserveUsdt = reserveUsdtBefore + Number(usdtAmountStr);
      } else {
        newReserveToken = reserveTokenBefore + Number(tokenAmountStr);
        newReserveUsdt = reserveUsdtBefore - Number(usdtAmountStr);
      }
      
      // Aktualizuj rezerwy w bazie danych - ale nie przeliczaj ponownie ceny
      db.prepare(`
        UPDATE pools 
        SET reserve_token = ?, reserve_usdt = ?
        WHERE id = ?
      `).run(newReserveToken, newReserveUsdt, pool.id);
      
      // Oblicz efektywne rezerwy dla spójności zapisu (ale nie używamy tych wartości do nadpisania)
      const effectiveReserveTokenBefore = reserveTokenBefore + pool.virtual_reserve_token;
      const effectiveReserveUsdtBefore = reserveUsdtBefore + pool.virtual_reserve_usdt;
      const effectiveReserveTokenAfter = newReserveToken + pool.virtual_reserve_token;
      const effectiveReserveUsdtAfter = newReserveUsdt + pool.virtual_reserve_usdt;
      
      // Bezpośredni zapis transakcji do bazy danych
      const insertStmt = db.prepare(`
        INSERT INTO transactions (
          pool_id, type, tx_hash, wallet_address, price, amount,
          token_amount, usdt_amount, fee_amount,
          reserve_token_before, reserve_usdt_before,
          reserve_token_after, reserve_usdt_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insertStmt.run(
        pool.id,
        type,
        txHash,
        walletAddress,
        pool.price_realtime || pool.price, // Używamy price_realtime, z fallbackiem na price
        amount,
        tokenAmountStr, // Dokładna wartość string z frontendu
        usdtAmountStr,  // Dokładna wartość string z frontendu
        feeAmount,
        effectiveReserveTokenBefore,
        effectiveReserveUsdtBefore,
        effectiveReserveTokenAfter,
        effectiveReserveUsdtAfter
      );
      
      logger.log(`Transaction saved directly with ID ${result.lastInsertRowid}`);
      logger.log(`Final values saved: token=${tokenAmountStr}, usdt=${usdtAmountStr}`);
      
      // Aktualizacja volume_24h
      const newVolume = pool.volume_24h + Number(usdtAmountStr);
      db.prepare(`
        UPDATE pools SET volume_24h = ? WHERE id = ?
      `).run(newVolume, pool.id);
      
      // Aktualizacja change_24h na podstawie najstarszej transakcji z ostatnich 24h
      try {
        Pool.updatePriceChange24h(pool.id);
      } catch (change24hError) {
        logger.error('Error updating change_24h:', change24hError);
        // Nie przerywamy obsługi transakcji, jeśli aktualizacja change_24h się nie powiedzie
      }
      
      // Aktualizacja hodlers po transakcji
      if (type === 'buy') {
        // Sprawdź, czy hodler już istnieje
        const existingHolder = db.prepare(`
          SELECT * FROM hodlers WHERE pool_id = ? AND holder_address = ?
        `).get(pool.id, walletAddress);
        
        // Znajdź bonding curve dla tej puli
        const bondingCurve = db.prepare(`
          SELECT * FROM hodlers WHERE pool_id = ? AND holder_username = 'bonding_curve'
        `).get(pool.id);
        
        if (!bondingCurve) {
          logger.error('Bonding curve holder not found for pool', pool.id);
        } else {
          // Zmniejsz ilość tokenów bonding curve
          const newBondingCurveAmount = Number(bondingCurve.holder_amount) - Number(tokenAmountStr);
          db.prepare(`
            UPDATE hodlers SET holder_amount = ?, last_updated = datetime('now')
            WHERE id = ?
          `).run(newBondingCurveAmount, bondingCurve.id);
          
          // Dodaj lub zaktualizuj hodlera
          if (existingHolder) {
            // Aktualizuj istniejącego hodlera
            const newAmount = Number(existingHolder.holder_amount) + Number(tokenAmountStr);
            db.prepare(`
              UPDATE hodlers SET holder_amount = ?, last_updated = datetime('now')
              WHERE id = ?
            `).run(newAmount, existingHolder.id);
          } else {
            // Sprawdź, czy adres hodlera jest taki sam jak creator_address
            let username = '';
            if (walletAddress === pool.creator_address) {
              username = 'dev';
            } else {
              // Skrócona wersja adresu (0x...67A)
              username = `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 3)}`;
            }
            
            // Dodaj nowego hodlera
            db.prepare(`
              INSERT INTO hodlers (pool_id, holder_username, holder_address, holder_amount, last_updated)
              VALUES (?, ?, ?, ?, datetime('now'))
            `).run(pool.id, username, walletAddress, tokenAmountStr);
            
            // Inkrementuj liczbę hodlers w pools
            db.prepare(`
              UPDATE pools SET holders = holders + 1 WHERE id = ?
            `).run(pool.id);
          }
        }
      } else if (type === 'sell') {
        // Znajdź hodlera
        const existingHolder = db.prepare(`
          SELECT * FROM hodlers WHERE pool_id = ? AND holder_address = ?
        `).get(pool.id, walletAddress);
        
        // Znajdź bonding curve dla tej puli
        const bondingCurve = db.prepare(`
          SELECT * FROM hodlers WHERE pool_id = ? AND holder_username = 'bonding_curve'
        `).get(pool.id);
        
        if (!existingHolder) {
          logger.error('Holder not found for address', walletAddress);
        } else if (!bondingCurve) {
          logger.error('Bonding curve holder not found for pool', pool.id);
        } else {
          // Zwiększ ilość tokenów bonding curve
          const newBondingCurveAmount = Number(bondingCurve.holder_amount) + Number(tokenAmountStr);
          db.prepare(`
            UPDATE hodlers SET holder_amount = ?, last_updated = datetime('now')
            WHERE id = ?
          `).run(newBondingCurveAmount, bondingCurve.id);
          
          // Zmniejsz ilość tokenów hodlera
          const newAmount = Number(existingHolder.holder_amount) - Number(tokenAmountStr);
          
          if (newAmount <= 0) {
            // Jeśli holder_amount = 0, usuń hodlera
            db.prepare(`
              DELETE FROM hodlers WHERE id = ?
            `).run(existingHolder.id);
            
            // Dekrementuj liczbę hodlers w pools
            db.prepare(`
              UPDATE pools SET holders = holders - 1 WHERE id = ?
            `).run(pool.id);
          } else {
            // Aktualizuj istniejącego hodlera
            db.prepare(`
              UPDATE hodlers SET holder_amount = ?, last_updated = datetime('now')
              WHERE id = ?
            `).run(newAmount, existingHolder.id);
          }
        }
      }
      
      db.close();
      
      // Update AMM reserves after recording the transaction – keep result for later broadcast
      let ammResult = null;
      try {
        ammResult = Pool.updateAmmReserves(pool.id, type, tokenAmountStr, usdtAmountStr);
        logger.log(`Updated AMM reserves: price_realtime=${ammResult.price_realtime}`);
      } catch (ammError) {
        logger.error('Error updating AMM reserves:', ammError);
        // Don't fail the transaction if AMM update fails
      }
      
      // ---------------- WebSocket broadcast ----------------
      try {
        // 1) Push single transaction (regardless of AMM update outcome)
        const broadcastTx = {
          wallet_address: walletAddress,
          contract_address: pool.token_address,
          tx_hash: txHash,
          type,
          token_amount: tokenAmountStr,
          usdt_amount: usdtAmountStr,
          symbol: pool.symbol,
          timestamp: new Date().toISOString(),
        };
        broadcastPoolTransaction(pool.token_address, broadcastTx);

        // 2) Push updated pool metrics if AMM succeeded
        if (ammResult) {
          const metricsPayload = {
            priceRealtime: ammResult.price_realtime,
            marketCap: ammResult.market_cap,
            volume: newVolume,
            totalSupplyTokenAMM: ammResult.total_supply_tokenAMM,
          };
          broadcastPoolData(pool.token_address, metricsPayload);
        }
      } catch (broadcastErr) {
        logger.error('Broadcast error:', broadcastErr.message);
      }

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      if (db) db.close();
      throw error;
    }
  } catch (error) {
    logger.error('Error in recordTransaction:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Pobiera listę ostatnich transakcji dla określonego poola
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPoolTransactions = (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Pool address is required'
      });
    }
    
    const db = getDbConnection();
    
    try {
      // Znajdź pool o podanym adresie - używamy tylko token_address
      const pool = db.prepare(`
        SELECT id FROM pools WHERE token_address = ?
      `).get(address);
      
      if (!pool) {
        db.close();
        return res.status(404).json({
          success: false,
          error: `Pool not found for address: ${address}`
        });
      }
      
      // Pobierz ostatnie transakcje dla tego poola
      const query = `
        SELECT 
          transactions.id,
          transactions.price,
          transactions.amount,
          transactions.type,
          transactions.tx_hash,
          transactions.wallet_address,
          transactions.timestamp,
          transactions.token_amount,
          transactions.usdt_amount,
          pools.symbol,
          pools.name,
          pools.token_address,
          pools.creator_address
        FROM transactions
        JOIN pools ON transactions.pool_id = pools.id
        WHERE pools.id = ?
        ORDER BY transactions.timestamp DESC
        LIMIT ?
      `;
      
      const transactions = db.prepare(query).all(pool.id, limit);
      
      db.close();
      return res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      db.close();
      throw error;
    }
  } catch (error) {
    logger.error('Error in getPoolTransactions:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getLatestTransaction,
  recordTransaction,
  getPoolTransactions
};