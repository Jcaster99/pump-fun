const { getDbConnection } = require('../db/init');
const Decimal = require('decimal.js');
const logger = require('../utils/logger');
Decimal.set({ precision: 40 });

// Dozwolone kolumny do sortowania
const ALLOWED_ORDER_COLUMNS = [
  'market_cap', 'volume_24h', 'price', 'change_24h', 'created_at', 'holders', 'liquidity', 'gravity_score', 'bonding_curve_percentage'
];

// Dozwolone kierunki sortowania
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];

class Pool {
  // Walidacja orderBy aby zabezpieczyć przed SQL Injection
  static validateOrderBy(orderBy) {
    return ALLOWED_ORDER_COLUMNS.includes(orderBy) ? orderBy : 'created_at';
  }
  
  // Walidacja order aby zabezpieczyć przed SQL Injection
  static validateOrder(order) {
    const upperOrder = order.toUpperCase();
    return ALLOWED_ORDER_DIRECTIONS.includes(upperOrder) ? upperOrder : 'DESC';
  }

  // Get all pools with optional limit, ordering and pagination
  static getAll(limit = 50, orderBy = 'market_cap', order = 'DESC', page = 1) {
    const db = getDbConnection();
    const offset = (page - 1) * limit;
    
    // Walidacja parametrów
    const validatedOrderBy = this.validateOrderBy(orderBy);
    const validatedOrder = this.validateOrder(order);
    
    // Bezpieczne zapytanie z parametrami
    const query = `
      SELECT * FROM pools
      ORDER BY ${validatedOrderBy} ${validatedOrder}
      LIMIT ? OFFSET ?
    `;
    
    try {
      const pools = db.prepare(query).all(limit, offset);
      db.close();
      return pools;
    } catch (error) {
      logger.error('Error fetching pools:', error);
      db.close();
      throw error;
    }
  }
  
  // Get total count of pools (for pagination)
  static getTotalCount() {
    const db = getDbConnection();
    
    const query = `
      SELECT COUNT(*) as count FROM pools
    `;
    
    try {
      const result = db.prepare(query).get();
      db.close();
      return result.count;
    } catch (error) {
      logger.error('Error counting pools:', error);
      db.close();
      throw error;
    }
  }
  
  // Get trending pools (high market cap and positive change)
  static getTrending(limit = 5) {
    const db = getDbConnection();
    
    const query = `
      SELECT * FROM pools
      WHERE change_24h > 0
      ORDER BY market_cap DESC
      LIMIT ?
    `;
    
    try {
      const pools = db.prepare(query).all(limit);
      db.close();
      return pools;
    } catch (error) {
      logger.error('Error fetching trending pools:', error);
      db.close();
      throw error;
    }
  }
  
  // Get a single pool by contract address
  static getByContractAddress(contractAddress) {
    const db = getDbConnection();
    
    const query = `
      SELECT * FROM pools
      WHERE token_address = ?
    `;
    
    try {
      const pool = db.prepare(query).get(contractAddress);
      db.close();
      return pool;
    } catch (error) {
      logger.error('Error fetching pool by token address:', error);
      db.close();
      throw error;
    }
  }
  
  // Get a single pool by id
  static getById(id) {
    const db = getDbConnection();
    
    const query = `
      SELECT * FROM pools
      WHERE id = ?
    `;
    
    try {
      const pool = db.prepare(query).get(id);
      db.close();
      return pool;
    } catch (error) {
      logger.error('Error fetching pool by id:', error);
      db.close();
      throw error;
    }
  }
  
  // Filter pools by name or symbol
  static search(searchTerm, limit = 10) {
    const db = getDbConnection();
    
    // Sanityzacja parametru wyszukiwania
    const sanitizedTerm = searchTerm.replace(/[^\w\s]/gi, '');
    
    const query = `
      SELECT * FROM pools
      WHERE name LIKE ? OR symbol LIKE ?
      ORDER BY market_cap DESC
      LIMIT ?
    `;
    
    try {
      const pools = db.prepare(query).all(`%${sanitizedTerm}%`, `%${sanitizedTerm}%`, limit);
      db.close();
      return pools;
    } catch (error) {
      logger.error('Error searching pools:', error);
      db.close();
      throw error;
    }
  }
  
  // Specialized search for symbol/tag matching (used for short searches)
  static searchBySymbol(searchTerm, limit = 3) {
    const db = getDbConnection();
    
    // Sanityzacja parametru wyszukiwania
    const sanitizedTerm = searchTerm.replace(/[^\w\s]/gi, '');
    
    // First try exact matches
    const exactQuery = `
      SELECT * FROM pools
      WHERE symbol = ?
      ORDER BY market_cap DESC
      LIMIT ?
    `;
    
    // Then try starts with
    const startsWithQuery = `
      SELECT * FROM pools
      WHERE symbol LIKE ?
      AND symbol != ?
      ORDER BY market_cap DESC
      LIMIT ?
    `;
    
    // Finally try contains
    const containsQuery = `
      SELECT * FROM pools
      WHERE symbol LIKE ?
      AND symbol NOT LIKE ?
      ORDER BY market_cap DESC
      LIMIT ?
    `;
    
    try {
      // Execute all three queries
      const exactMatches = db.prepare(exactQuery).all(sanitizedTerm, limit);
      const startsWithMatches = db.prepare(startsWithQuery).all(`${sanitizedTerm}%`, sanitizedTerm, limit);
      const containsMatches = db.prepare(containsQuery).all(`%${sanitizedTerm}%`, `${sanitizedTerm}%`, limit);
      
      // Combine results, prioritizing exact > starts with > contains
      const combinedResults = [
        ...exactMatches,
        ...startsWithMatches,
        ...containsMatches
      ].slice(0, limit);
      
      db.close();
      return combinedResults;
    } catch (error) {
      logger.error('Error searching pools by symbol:', error);
      db.close();
      throw error;
    }
  }
  
  // Create a new pool
  static create(poolData) {
    const db = getDbConnection();
    
    const {
      name,
      symbol,
      contract_address, // Zachowujemy w parametrach dla wstecznej kompatybilności API
      token_address,
      image_url,
      description,
      creator_address,
      creator_name,
      price: customPrice,
      market_cap: customMarketCap,
      liquidity: customLiquidity,
      holders: customHolders,
      total_supply: customTotalSupply,
      total_supply_usdt: customTotalSupplyUsdt,
      reserve_token: customReserveToken,
      reserve_usdt: customReserveUsdt,
      virtual_reserve_token: customVirtualReserveToken,
      virtual_reserve_usdt: customVirtualReserveUsdt,
      k_constant: customKConstant,
      creator_reserve: customCreatorReserve,
      twitter_url,
      website_url
    } = poolData;
    
    try {
      // Generate initial values for a new pool or use provided values
      const price = customPrice || (0.0000001 + (Math.random() * 0.0000009));
      // Holders zawsze startuje od 1
      const holders = customHolders || 1;
      
      // Dla tokenów z lf0gfactory market_cap startowo ZAWSZE 0
      // Wymuszamy wartość 0 niezależnie od customMarketCap
      const market_cap = 0;
      
      // Jeśli są przekazane wartości rezerw, używamy ich
      const reserve_token = customReserveToken || 0;
      const reserve_usdt = customReserveUsdt || 0;
      
      // Wartości dla nowych pól
      const total_supply = customTotalSupply || '1888888888';
      const total_supply_tokenAMM = total_supply; // Initialize with same value as total_supply
      const total_supply_usdtAMM = customTotalSupplyUsdt || '100000';
      
      // Wartości dla rezerw wirtualnych
      const virtual_reserve_token = customVirtualReserveToken || 1888888888000000000000000000;
      const virtual_reserve_usdt = customVirtualReserveUsdt || 100000000000000000000000;
      
      // Stała k = virtual_reserve_token * virtual_reserve_usdt
      const k_constant = customKConstant || (virtual_reserve_token * virtual_reserve_usdt).toString();
      
      // Rezerwa dla twórcy (5% całkowitej podaży)
      const creator_reserve = customCreatorReserve || (0.05 * virtual_reserve_token).toString();
      
      // Jeśli mamy customLiquidity, użyjmy go bezpośrednio
      // W przeciwnym razie używamy standardowej wartości 
      let liquidity;
      if (customLiquidity) {
        liquidity = customLiquidity;
      } else {
        // Używamy prostego mnożenia bez notacji naukowej
        // Używamy liczby całkowite jako wartość bazową - 1888888888 * 100000 = 188,888,888,800,000
        liquidity = parseFloat(total_supply) * parseFloat(total_supply_usdtAMM);
        
        // Ograniczamy wartość, żeby uniknąć zbyt dużych liczb
        if (liquidity > 1e12) {
          liquidity = 1e12;
        }
      }
      
      const volume_24h = 0;
      const change_24h = 0;
      
      const result = db.prepare(`
        INSERT INTO pools (
          name, symbol, token_address, image_url, description, price, price_realtime,
          market_cap, liquidity, volume_24h, holders, change_24h,
          creator_address, creator_name, total_supply, total_supply_tokenAMM, total_supply_usdtAMM, reserve_token, reserve_usdt, 
          virtual_reserve_token, virtual_reserve_usdt, k_constant, creator_reserve, creator_unlocked_reserve,
          twitter_url, website_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        name,
        symbol,
        token_address || (contract_address || null),
        image_url || `https://via.placeholder.com/32?text=${symbol}`,
        description || '',
        price,
        price,  // price_realtime initially set to the same as price
        market_cap,
        liquidity,
        volume_24h,
        holders,
        change_24h,
        creator_address,
        creator_name || '',
        total_supply,
        total_supply_tokenAMM,
        total_supply_usdtAMM,
        reserve_token,
        reserve_usdt,
        virtual_reserve_token,
        virtual_reserve_usdt,
        k_constant,
        creator_reserve,
        0, // creator_unlocked_reserve - na starcie zawsze 0
        twitter_url || null,
        website_url || null
      );
      
      // Get the inserted pool
      const newPool = db.prepare(`
        SELECT * FROM pools WHERE id = ?
      `).get(result.lastInsertRowid);
      
      // Dodaj wpis do tabeli hodlers dla bonding curve
      db.prepare(`
        INSERT INTO hodlers (
          pool_id, holder_username, holder_address, holder_amount, last_updated
        ) VALUES (?, ?, ?, ?, datetime('now'))
      `).run(
        newPool.id,
        "bonding_curve",
        newPool.token_address,
        total_supply,
        // Data aktualizacji jest ustawiana automatycznie przez wartość domyślną
      );
      
      db.close();
      return newPool;
    } catch (error) {
      logger.error('Error creating pool:', error);
      db.close();
      throw error;
    }
  }
  
  // Get pools created by a specific address
  static getByCreatorAddress(creatorAddress) {
    const db = getDbConnection();
    
    logger.log(`Looking for pools by creator: ${creatorAddress}`);
    
    const query = `
      SELECT * FROM pools
      WHERE creator_address = ?
      ORDER BY created_at DESC
    `;
    
    try {
      const pools = db.prepare(query).all(creatorAddress);
      
      logger.log(`Found ${pools.length} pools in database for creator ${creatorAddress}`);
      
      db.close();
      return pools;
    } catch (error) {
      logger.error('Error getting pools by creator:', error);
      db.close();
      throw error;
    }
  }

  // Get total volume across all pools
  static getTotalVolume() {
    const db = getDbConnection();
    
    const query = `
      SELECT SUM(volume_24h) as total_volume FROM pools
    `;
    
    try {
      const result = db.prepare(query).get();
      db.close();
      return result.total_volume || 0;
    } catch (error) {
      logger.error('Error calculating total volume:', error);
      db.close();
      throw error;
    }
  }
  
  // Calculate Gravity Score for a pool based on the new metric
  static calculateGravityScore(pool) {
    logger.warn('DEPRECATED: Pool.calculateGravityScore is deprecated. Use GravityScore class instead.');
    
    try {
      // Extract relevant data from pool
      const {
        liquidity,
        market_cap,
        volume_24h,
        price,
        holders,
        // We'll need to fetch other data that might not be directly available
      } = pool;
      
      // Calculate components of the gravity score
      
      // LR (Liquidity Ratio) = Płynność / Kapitalizacja rynkowa (normalizowane do skali 0-1)
      const liquidityRatio = market_cap > 0 ? Math.min(liquidity / market_cap, 1) : 0;
      
      // TI (Trading Intensity) - simplified version since we don't have all metrics
      const tradingIntensity = liquidity > 0 ? Math.min(volume_24h / liquidity, 1) : 0;
      
      // MS (Market Stability) - simplified without 7-day price standard deviation
      // We'll use change_24h as a proxy for stability (less change = more stable)
      const marketStability = pool.change_24h ? Math.max(1 - Math.abs(pool.change_24h / 100), 0) : 0.5;
      
      // HD (Holder Distribution) - simplified as we don't have top 10 wallets data
      // We'll use holders count as a proxy, normalized
      const holderDistribution = holders > 0 ? Math.min(holders / 1000, 1) : 0;
      
      // PS (Participation Score) - simplified version
      // Using holders as a proxy for participation
      const participationScore = holders > 0 ? Math.min(holders / 500, 1) : 0;
      
      // CR (Community Rating) - Using average rating from pool_ratings
      // This would require a separate query, so we'll use a placeholder default
      const communityRating = 0.7; // Default value, ideally would be calculated from actual ratings
      
      // Calculate the final Gravity Score
      // 0G Gravity Score = (LR × 0.25) + (TI × 0.15) + (MS × 0.15) + (HD × 0.15) + (PS × 0.15) + (CR × 0.15)
      const gravityScore = (
        (liquidityRatio * 0.25) +
        (tradingIntensity * 0.15) +
        (marketStability * 0.15) +
        (holderDistribution * 0.15) +
        (participationScore * 0.15) +
        (communityRating * 0.15)
      );
      
      return gravityScore;
    } catch (error) {
      logger.error('Error calculating gravity score:', error);
      return 0;
    }
  }
  
  // Get average rating for a pool
  static getAverageRating(poolId) {
    const db = getDbConnection();
    
    const query = `
      SELECT AVG(rating) as avg_rating 
      FROM pool_ratings 
      WHERE pool_id = ?
    `;
    
    try {
      const result = db.prepare(query).get(poolId);
      db.close();
      return result.avg_rating ? result.avg_rating / 5 : 0.5; // Normalize to 0-1 scale
    } catch (error) {
      logger.error('Error getting average rating:', error);
      db.close();
      return 0.5; // Default value if error
    }
  }
  
  // Get top pools by Gravity Score
  static getTopByGravityScore(limit = 10) {
    const db = getDbConnection();
    
    const query = `
      SELECT * FROM pools
      ORDER BY gravity_score DESC
      LIMIT ?
    `;
    
    try {
      const pools = db.prepare(query).all(limit);
      db.close();
      return pools;
    } catch (error) {
      logger.error('Error fetching top pools by gravity score:', error);
      db.close();
      throw error;
    }
  }

  // Obliczanie ceny tokenu na podstawie aktualnych rezerw
  static calculateTokenPrice(poolId) {
    const db = getDbConnection();
    
    try {
      const pool = this.getById(poolId);
      
      if (!pool) {
        db.close();
        return 0;
      }
      
      // Efektywne rezerwy (realne + wirtualne)
      const effectiveReserveUsdt = pool.reserve_usdt + pool.virtual_reserve_usdt;
      const effectiveReserveToken = pool.reserve_token + pool.virtual_reserve_token;
      
      // Cena z krzywej: rezerwy_usdt / rezerwy_tokenu
      if (effectiveReserveToken === 0) {
        db.close();
        return 0;
      }
      
      db.close();
      return effectiveReserveUsdt / effectiveReserveToken;
    } catch (error) {
      logger.error('Error calculating token price:', error);
      db.close();
      return 0;
    }
  }

  // Aktualizacja rezerw puli
  static updateReserves(poolId, newReserveToken, newReserveUsdt) {
    const db = getDbConnection();
    
    try {
      // Pobranie aktualnych danych puli
      const pool = this.getById(poolId);
      
      if (!pool) {
        db.close();
        throw new Error(`Pool with ID ${poolId} not found`);
      }
      
      // Aktualizacja rezerw
      db.prepare(`
        UPDATE pools 
        SET reserve_token = ?, reserve_usdt = ?
        WHERE id = ?
      `).run(newReserveToken, newReserveUsdt, poolId);
      
      // Aktualizacja ceny
      const effectiveReserveUsdt = newReserveUsdt + pool.virtual_reserve_usdt;
      const effectiveReserveToken = newReserveToken + pool.virtual_reserve_token;
      const newPrice = effectiveReserveToken > 0 ? effectiveReserveUsdt / effectiveReserveToken : 0;
      
      // Calculate price_realtime using total_supply_tokenAMM and total_supply_usdtAMM
      let price_realtime = 0;
      if (pool.total_supply_tokenAMM > 0) {
        price_realtime = pool.total_supply_usdtAMM / pool.total_supply_tokenAMM;
      }
      
      // Aktualizacja market_cap i liquidity
      // Dla tokenów z lf0gfactory utrzymujemy market_cap zawsze na 0
      const marketCap = 0; // Zawsze ustawiamy market_cap na 0
      
      // Liquidity to suma wartości obu stron rezerwy
      const liquidity = effectiveReserveUsdt + (effectiveReserveToken * newPrice);
      
      db.prepare(`
        UPDATE pools 
        SET price = ?, price_realtime = ?, market_cap = ?, liquidity = ?
        WHERE id = ?
      `).run(newPrice, price_realtime, marketCap, liquidity, poolId);
      
      // Zapis historii rezerw
      db.prepare(`
        INSERT INTO pool_reserves_history (
          pool_id, reserve_token, reserve_usdt, 
          virtual_reserve_token, virtual_reserve_usdt
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        poolId, 
        newReserveToken, 
        newReserveUsdt, 
        pool.virtual_reserve_token,
        pool.virtual_reserve_usdt
      );
      
      // Zapis w historii cen
      db.prepare(`
        INSERT INTO price_history (pool_id, price)
        VALUES (?, ?)
      `).run(poolId, newPrice);
      
      db.close();
      return {
        newPrice,
        marketCap,
        liquidity
      };
    } catch (error) {
      logger.error('Error updating pool reserves:', error);
      db.close();
      throw error;
    }
  }

  /**
   * Zapisuje transakcję do bazy danych
   * @param {Object} transactionData - Dane transakcji
   * @param {number} transactionData.poolId - ID pooli
   * @param {string} transactionData.type - Typ transakcji (buy/sell)
   * @param {string} transactionData.txHash - Hash transakcji
   * @param {string} transactionData.walletAddress - Adres portfela
   * @param {number|string} transactionData.tokenAmount - Ilość tokenów
   * @param {number|string} transactionData.usdtAmount - Ilość USDT
   * @param {number} transactionData.price - Cena tokena lub price_realtime
   * @param {number|string} [transactionData.feeAmount] - Kwota opłaty
   * @param {Object} [transactionData.reservesBefore] - Rezerwy przed transakcją
   * @param {Object} [transactionData.reservesAfter] - Rezerwy po transakcji
   * @returns {boolean} Wynik zapisania transakcji
   */
  static recordTransaction(transactionData) {
    const db = getDbConnection();
    
    try {
      const {
        poolId, 
        type, 
        txHash, 
        walletAddress, 
        tokenAmount, 
        usdtAmount, 
        feeAmount,
        reservesBefore, 
        reservesAfter,
        price
      } = transactionData;
      
      // Zachowujemy wartości dokładnie tak, jak zostały przekazane
      // Nie wykonujemy żadnych operacji, które mogłyby zmienić precyzję
      logger.log(`Zapisuję transakcję: typ=${type}, token=${tokenAmount}, usdt=${usdtAmount}, txHash=${txHash}`);
      
      // Obliczyć odpowiednią kwotę (amount) na podstawie typu transakcji
      const amount = type === 'buy' ? usdtAmount : tokenAmount;
      
      // Sprawdź czy mamy aktualną cenę (price_realtime) dla tego pool
      const pool = db.prepare('SELECT price_realtime, price FROM pools WHERE id = ?').get(poolId);
      const effectivePrice = pool && pool.price_realtime ? pool.price_realtime : (price || (pool ? pool.price : 0));
      
      // Wszystkie wartości przy INSERT mają zachowane oryginalne stringi
      const query = `
        INSERT INTO transactions (
          pool_id, type, tx_hash, wallet_address, price, amount,
          token_amount, usdt_amount, fee_amount,
          reserve_token_before, reserve_usdt_before,
          reserve_token_after, reserve_usdt_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = db.prepare(query).run(
        poolId,
        type,
        txHash,
        walletAddress,
        effectivePrice, // Używamy price_realtime zamiast price
        amount,
        tokenAmount,   // Oryginalna wartość (string lub liczba)
        usdtAmount,    // Oryginalna wartość (string lub liczba)
        feeAmount || 0,
        reservesBefore?.tokenReserve || null,
        reservesBefore?.usdtReserve || null,
        reservesAfter?.tokenReserve || null,
        reservesAfter?.usdtReserve || null
      );
      
      logger.log(`Zapisano transakcję: ID=${result.lastInsertRowid}`);
      db.close();
      
      // Update AMM reserves after transaction is recorded
      try {
        this.updateAmmReserves(poolId, type, tokenAmount, usdtAmount);
      } catch (error) {
        logger.error('Error updating AMM reserves after transaction:', error);
        // Continue even if AMM update fails
      }
      
      return true;
    } catch (error) {
      logger.error('Error recording transaction:', error);
      db.close();
      return false;
    }
  }

  // Obliczanie ilości tokenów przy zakupie za USDT
  static calculateBuyAmount(poolId, usdtAmount) {
    const db = getDbConnection();
    
    try {
      const pool = this.getById(poolId);
      
      if (!pool) {
        db.close();
        return { tokensOut: 0, tokensOutBeforeFee: 0, fee: 0, priceImpact: 0 };
      }
      
      // Efektywne rezerwy – używamy Decimal dla pełnej precyzji
      const effectiveReserveUsdt = new Decimal(pool.reserve_usdt).plus(pool.virtual_reserve_usdt);
      const effectiveReserveToken = new Decimal(pool.reserve_token).plus(pool.virtual_reserve_token);
      const k = effectiveReserveUsdt.times(effectiveReserveToken);

      // Opłata
      const feePercent = new Decimal(pool.trade_fee_percent || 0.1);
      const fee = new Decimal(usdtAmount).times(feePercent).div(100);
      const usdtAfterFee = new Decimal(usdtAmount).minus(fee);

      // Nowe rezerwy po zakupie (y = k/x)
      const newReserveUsdt = effectiveReserveUsdt.plus(usdtAfterFee);
      const newReserveToken = k.div(newReserveUsdt);
      const tokensOut = effectiveReserveToken.minus(newReserveToken);

      // NOWE: Oblicz ilość tokenów odpowiadającą wartości USDT PRZED opłatą
      const newReserveUsdtBeforeFee = effectiveReserveUsdt.plus(new Decimal(usdtAmount));
      const newReserveTokenBeforeFee = k.div(newReserveUsdtBeforeFee);
      const tokensOutBeforeFee = effectiveReserveToken.minus(newReserveTokenBeforeFee);

      // Wpływ na cenę
      const priceImpact = newReserveUsdt.div(effectiveReserveUsdt).minus(1).times(100);
      const newPrice = newReserveUsdt.div(newReserveToken);
      
      db.close();
      return { 
        tokensOut: tokensOut.toNumber(), 
        tokensOutBeforeFee: tokensOutBeforeFee.toNumber(), // Dodana wartość - ilość tokenów przed opłatą
        fee: fee.toNumber(), 
        priceImpact: priceImpact.toNumber(),
        newPrice: newPrice.toNumber(),
        currentPrice: pool.price,
        reservesBefore: {
          token: effectiveReserveToken.toNumber(),
          usdt: effectiveReserveUsdt.toNumber()
        },
        reservesAfter: {
          token: newReserveToken.toNumber(),
          usdt: newReserveUsdt.toNumber()
        }
      };
    } catch (error) {
      logger.error('Error calculating buy amount:', error);
      db.close();
      return { tokensOut: 0, tokensOutBeforeFee: 0, fee: 0, priceImpact: 0 };
    }
  }

  // Obliczanie ilości USDT przy sprzedaży tokenów
  static calculateSellAmount(poolId, tokenAmount) {
    const db = getDbConnection();
    
    try {
      const pool = this.getById(poolId);
      
      if (!pool) {
        db.close();
        return { usdtOut: 0, usdtOutBeforeFee: 0, fee: 0, priceImpact: 0 };
      }
      
      // Efektywne rezerwy – używamy Decimal
      const effectiveReserveUsdt = new Decimal(pool.reserve_usdt).plus(pool.virtual_reserve_usdt);
      const effectiveReserveToken = new Decimal(pool.reserve_token).plus(pool.virtual_reserve_token);
      const k = effectiveReserveUsdt.times(effectiveReserveToken);

      // Nowe rezerwy po sprzedaży
      const newReserveToken = effectiveReserveToken.plus(tokenAmount);
      const newReserveUsdt = k.div(newReserveToken);
      const usdtOutBeforeFee = effectiveReserveUsdt.minus(newReserveUsdt);

      // Opłata
      const feePercent = new Decimal(pool.trade_fee_percent || 0.1);
      const fee = usdtOutBeforeFee.times(feePercent).div(100);
      const usdtOut = usdtOutBeforeFee.minus(fee);

      // Wpływ na cenę
      const priceImpact = newReserveToken.div(effectiveReserveToken).minus(1).times(100);
      const newPrice = newReserveUsdt.div(newReserveToken);
      
      db.close();
      return { 
        usdtOut: usdtOut.toNumber(), 
        usdtOutBeforeFee: usdtOutBeforeFee.toNumber(), // Dodana wartość - ilość USDT przed opłatą
        fee: fee.toNumber(), 
        priceImpact: priceImpact.toNumber(),
        newPrice: newPrice.toNumber(),
        currentPrice: pool.price,
        reservesBefore: {
          token: effectiveReserveToken.toNumber(),
          usdt: effectiveReserveUsdt.toNumber()
        },
        reservesAfter: {
          token: newReserveToken.toNumber(),
          usdt: newReserveUsdt.toNumber()
        }
      };
    } catch (error) {
      logger.error('Error calculating sell amount:', error);
      db.close();
      return { usdtOut: 0, usdtOutBeforeFee: 0, fee: 0, priceImpact: 0 };
    }
  }

  // Pobranie historii rezerw dla puli
  static getReservesHistory(poolId, limit = 100) {
    const db = getDbConnection();
    
    try {
      const history = db.prepare(`
        SELECT * FROM pool_reserves_history
        WHERE pool_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(poolId, limit);
      
      db.close();
      return history;
    } catch (error) {
      logger.error('Error getting reserves history:', error);
      db.close();
      return [];
    }
  }
  
  // Update total_supply_tokenAMM using AMM formula and recalculate price_realtime
  static updateTotalSupplyTokenAMM(poolId, newTotalSupplyTokenAMM) {
    const db = getDbConnection();
    
    try {
      // Get the pool
      const pool = this.getById(poolId);
      
      if (!pool) {
        db.close();
        throw new Error(`Pool with ID ${poolId} not found`);
      }
      
      // Update total_supply_tokenAMM
      db.prepare(`
        UPDATE pools 
        SET total_supply_tokenAMM = ?
        WHERE id = ?
      `).run(newTotalSupplyTokenAMM, poolId);
      
      // Calculate price_realtime using AMM formula (x * y = k)
      let price_realtime = 0;
      if (newTotalSupplyTokenAMM > 0) {
        price_realtime = pool.total_supply_usdtAMM / newTotalSupplyTokenAMM;
      }
      
      // Calculate market_cap based on tokens in circulation and price_realtime
      const tokensInCirculation = Math.abs(pool.total_supply - newTotalSupplyTokenAMM);
      const market_cap = tokensInCirculation * price_realtime;
      
      // Update price_realtime and market_cap
      db.prepare(`
        UPDATE pools 
        SET price_realtime = ?,
            market_cap = ?
        WHERE id = ?
      `).run(price_realtime, market_cap, poolId);
      
      db.close();
      return {
        total_supply_tokenAMM: newTotalSupplyTokenAMM,
        price_realtime: price_realtime,
        market_cap: market_cap
      };
    } catch (error) {
      logger.error('Error updating total_supply_tokenAMM:', error);
      db.close();
      throw error;
    }
  }

  /**
   * Updates AMM reserves (total_supply_tokenAMM and total_supply_usdtAMM) after a transaction
   * and recalculates price_realtime
   * 
   * @param {number} poolId - Pool ID
   * @param {string} type - Transaction type ('buy' or 'sell')
   * @param {number|string} tokenAmount - Amount of tokens in the transaction
   * @param {number|string} usdtAmount - Amount of USDT in the transaction
   * @returns {Object} Updated values
   */
  static updateAmmReserves(poolId, type, tokenAmount, usdtAmount) {
    const db = getDbConnection();
    
    try {
      // Get the pool
      const pool = this.getById(poolId);
      
      if (!pool) {
        db.close();
        throw new Error(`Pool with ID ${poolId} not found`);
      }
      
      // Convert amounts to numbers to ensure proper calculation
      const tokenAmountNum = Number(tokenAmount);
      const usdtAmountNum = Number(usdtAmount);
      
      // Update the AMM reserves based on transaction type
      let newTotalSupplyTokenAMM = pool.total_supply_tokenAMM;
      let newTotalSupplyUsdtAMM = pool.total_supply_usdtAMM;
      
      if (type === 'buy') {
        // For buy: decrease tokenAMM, increase usdtAMM
        newTotalSupplyTokenAMM -= tokenAmountNum;
        newTotalSupplyUsdtAMM += usdtAmountNum;
      } else if (type === 'sell') {
        // For sell: increase tokenAMM, decrease usdtAMM
        newTotalSupplyTokenAMM += tokenAmountNum;
        newTotalSupplyUsdtAMM -= usdtAmountNum;
      } else {
        db.close();
        throw new Error(`Invalid transaction type: ${type}`);
      }
      
      // Ensure reserves don't go negative
      newTotalSupplyTokenAMM = Math.max(0, newTotalSupplyTokenAMM);
      newTotalSupplyUsdtAMM = Math.max(0, newTotalSupplyUsdtAMM);
      
      // Calculate price_realtime
      let price_realtime = 0;
      if (newTotalSupplyTokenAMM > 0) {
        price_realtime = newTotalSupplyUsdtAMM / newTotalSupplyTokenAMM;
      }
      
      // Calculate market_cap based on tokens in circulation and price_realtime
      const tokensInCirculation = Math.abs(pool.total_supply - newTotalSupplyTokenAMM);
      const market_cap = tokensInCirculation * price_realtime;
      
      // Calculate bonding curve percentage - percent of tokens sold from total supply
      const totalSupply = pool.total_supply || 1; // Avoid division by zero
      const percentSold = Math.min(Math.max(100 - (newTotalSupplyTokenAMM / totalSupply) * 100, 0), 100);
      
      // Update the pool in the database
      db.prepare(`
        UPDATE pools 
        SET total_supply_tokenAMM = ?, 
            total_supply_usdtAMM = ?, 
            price_realtime = ?,
            market_cap = ?,
            bonding_curve_percentage = ?
        WHERE id = ?
      `).run(
        newTotalSupplyTokenAMM,
        newTotalSupplyUsdtAMM,
        price_realtime,
        market_cap,
        percentSold,
        poolId
      );
      
      logger.log(`Updated AMM reserves for pool ${poolId}: tokenAMM=${newTotalSupplyTokenAMM}, usdtAMM=${newTotalSupplyUsdtAMM}, price_realtime=${price_realtime}, market_cap=${market_cap}, bonding_curve_percentage=${percentSold.toFixed(2)}%`);
      
      db.close();
      return {
        total_supply_tokenAMM: newTotalSupplyTokenAMM,
        total_supply_usdtAMM: newTotalSupplyUsdtAMM,
        price_realtime: price_realtime,
        market_cap: market_cap,
        bonding_curve_percentage: percentSold
      };
    } catch (error) {
      logger.error('Error updating AMM reserves:', error);
      db.close();
      throw error;
    }
  }

  /**
   * Aktualizuje zmianę procentową ceny w ciągu 24h (change_24h) dla podanej puli
   * @param {number} poolId - ID puli
   * @returns {Object} Wynik aktualizacji z wartością change_24h
   */
  static updatePriceChange24h(poolId) {
    const db = getDbConnection();
    
    try {
      // Pobierz aktualną pulę
      const pool = this.getById(poolId);
      
      if (!pool) {
        db.close();
        throw new Error(`Pool with ID ${poolId} not found`);
      }
      
      // Pobierz najstarszą transakcję z ostatnich 24h
      const oldestTransaction = db.prepare(`
        SELECT price 
        FROM transactions 
        WHERE pool_id = ? AND timestamp >= datetime('now', '-24 hours')
        ORDER BY timestamp ASC
        LIMIT 1
      `).get(poolId);
      
      // Jeśli nie ma transakcji w ciągu ostatnich 24h, change_24h pozostaje bez zmian
      if (!oldestTransaction) {
        db.close();
        return { change_24h: pool.change_24h };
      }
      
      // Aktualna cena - zawsze używamy price_realtime jeśli dostępna, z fallbackiem na price
      const currentPrice = pool.price_realtime !== undefined && pool.price_realtime !== null 
        ? pool.price_realtime 
        : pool.price;
      const oldPrice = oldestTransaction.price;
      
      // Oblicz procentową zmianę: ((currentPrice - oldPrice) / oldPrice) * 100
      let change_24h = 0;
      if (oldPrice > 0) {
        change_24h = ((currentPrice - oldPrice) / oldPrice) * 100;
      }
      
      // Aktualizuj change_24h w bazie danych
      db.prepare(`
        UPDATE pools 
        SET change_24h = ? 
        WHERE id = ?
      `).run(change_24h, poolId);
      
      logger.log(`Updated change_24h for pool ${poolId}: ${change_24h.toFixed(2)}% (old price: ${oldPrice}, current price: ${currentPrice})`);
      
      db.close();
      return { change_24h };
    } catch (error) {
      logger.error('Error updating price change 24h:', error);
      db.close();
      throw error;
    }
  }

  /**
   * Aktualizuje wartość bonding_curve_percentage dla wszystkich pul w bazie danych
   * @returns {Object} Rezultat aktualizacji
   */
  static updateAllBondingCurvePercentages() {
    const db = getDbConnection();
    
    try {
      // Pobierz wszystkie pule
      const pools = db.prepare('SELECT id, total_supply, total_supply_tokenAMM FROM pools').all();
      
      // Przygotuj statement dla aktualizacji
      const updateStmt = db.prepare('UPDATE pools SET bonding_curve_percentage = ? WHERE id = ?');
      
      let updated = 0;
      
      // Oblicz i zaktualizuj bonding_curve_percentage dla każdej puli
      for (const pool of pools) {
        const totalSupply = pool.total_supply || 1; // Unikaj dzielenia przez zero
        const totalSupplyTokenAMM = pool.total_supply_tokenAMM || 0;
        
        // Oblicz procent sprzedanych tokenów: 100 - (tokenAMM / totalSupply) * 100
        const percentSold = Math.min(Math.max(100 - (totalSupplyTokenAMM / totalSupply) * 100, 0), 100);
        
        // Aktualizuj wartość w bazie danych
        updateStmt.run(percentSold, pool.id);
        updated++;
      }
      
      logger.log(`Updated bonding_curve_percentage for ${updated} pools`);
      
      db.close();
      return { success: true, updated };
    } catch (error) {
      logger.error('Error updating bonding curve percentages:', error);
      db.close();
      throw error;
    }
  }
}

module.exports = Pool;