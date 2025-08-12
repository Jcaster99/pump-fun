const Pool = require('../models/pool');
const { 
  sanitizeInput, 
  isValidEthereumAddress, 
  isValidContractAddress,
  isValidNumber,
  isValidURL
} = require('../utils/security');
const fs = require('fs');
const { getDbConnection } = require('../db/init');
const axios = require('axios');
const logger = require('../utils/logger');

// Helper to safely format price with 10 decimal places (hoisted)
function formatPrice(price) {
  const safe = price === null || price === undefined || isNaN(price) ? 0 : Number(price);
  return `$${safe.toFixed(10)}`;
}

// Get all pools with optional filtering and sorting
const getPools = (req, res) => {
  try {
    const { limit = 40, orderBy = 'created_at', order = 'DESC', page = 1, getTotalVolumeOnly = false } = req.query;
    
    // If only total volume is requested, return just that
    if (getTotalVolumeOnly === 'true') {
      const totalVolume = Pool.getTotalVolume();
      return res.status(200).json({
        success: true,
        totalVolume
      });
    }
    
    // Walidacja parametrów
    const parsedLimit = Math.min(parseInt(limit, 10) || 40, 100); // Limit maksymalnie 100
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1); // Minimum page 1
    
    // Get total count for pagination
    const totalCount = Pool.getTotalCount();
    const totalPages = Math.ceil(totalCount / parsedLimit);
    
    // Get pools from database
    const pools = Pool.getAll(parsedLimit, orderBy, order, parsedPage);
    
    // Format numeric values for frontend display
    const formattedPools = pools.map(pool => ({
      ...pool,
      price_formatted: formatPrice(pool.price),
      market_cap_formatted: formatCurrency(pool.market_cap),
      change_24h_formatted: `${pool.change_24h > 0 ? '+' : ''}${pool.change_24h.toFixed(2)}%`,
      positive: pool.change_24h > 0,
      // Format time without mocks
      created_at_formatted: formatTimeAgo(pool.created_at || new Date())
    }));
    
    res.status(200).json({
      success: true,
      data: formattedPools,
      pagination: {
        current_page: parsedPage,
        last_page: totalPages,
        total: totalCount,
        per_page: parsedLimit,
        has_more: parsedPage < totalPages
      }
    });
  } catch (error) {
    logger.error('Error in getPools controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching pools'
    });
  }
};

// Get trending pools
const getTrendingPools = (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Walidacja limitu
    const parsedLimit = Math.min(parseInt(limit, 10) || 5, 20); // Limit maksymalnie 20
    
    // Get trending pools from database
    const pools = Pool.getTrending(parsedLimit);
    
    // Format numeric values for frontend display
    const formattedPools = pools.map(pool => ({
      ...pool,
      price_formatted: formatPrice(pool.price),
      market_cap_formatted: formatCurrency(pool.market_cap),
      change_24h_formatted: `${pool.change_24h > 0 ? '+' : ''}${pool.change_24h.toFixed(2)}%`,
      positive: pool.change_24h > 0
    }));
    
    res.status(200).json({
      success: true,
      data: formattedPools
    });
  } catch (error) {
    logger.error('Error in getTrendingPools controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching trending pools'
    });
  }
};

// Get pool by contract address
const getPoolByAddress = (req, res) => {
  try {
    const { address } = req.params;
    
    // Walidacja adresu kontraktu
    if (!isValidContractAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract address format'
      });
    }
    
    // Get pool from database
    const pool = Pool.getByContractAddress(address);
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found'
      });
    }
    
    // Format numeric values for frontend display
    const formattedPool = {
      ...pool,
      price_formatted: formatPrice(pool.price_realtime || pool.price), // Use price_realtime, fallback to price
      market_cap_formatted: formatCurrency(pool.market_cap),
      liquidity_formatted: formatCurrency(pool.liquidity),
      volume_24h_formatted: formatCurrency(pool.volume_24h),
      change_24h_formatted: `${pool.change_24h > 0 ? '+' : ''}${pool.change_24h.toFixed(2)}%`,
      positive: pool.change_24h > 0
    };
    
    res.status(200).json({
      success: true,
      data: formattedPool
    });
  } catch (error) {
    logger.error('Error in getPoolByAddress controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching pool'
    });
  }
};

// Search pools by name or symbol
const searchPools = (req, res) => {
  try {
    const { term, limit = 10, symbolSearch = false } = req.query;
    
    // Walidacja parametrów
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 50); // Limit maksymalnie 50
    
    if (!term || term.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Search term must be at least 1 character'
      });
    }
    
    // Sanityzacja term przed wyszukiwaniem
    const sanitizedTerm = sanitizeInput(term).slice(0, 50); // Ogranicz długość term
    
    logger.log(`Searching pools for term: "${sanitizedTerm}", symbolSearch: ${symbolSearch}, limit: ${parsedLimit}`);
    
    // Search pools in database - use specialized method for short/symbol searches
    let pools;
    if (symbolSearch === 'true' || sanitizedTerm.length <= 4) {
      pools = Pool.searchBySymbol(sanitizedTerm, parsedLimit);
      logger.log(`Used symbol search for "${sanitizedTerm}", found ${pools.length} results`);
    } else {
      pools = Pool.search(sanitizedTerm, parsedLimit);
      logger.log(`Used regular search for "${sanitizedTerm}", found ${pools.length} results`);
    }
    
    // Format numeric values for frontend display
    const formattedPools = pools.map(pool => ({
      ...pool,
      price_formatted: formatPrice(pool.price),
      market_cap_formatted: formatCurrency(pool.market_cap),
      change_24h_formatted: `${pool.change_24h > 0 ? '+' : ''}${pool.change_24h.toFixed(2)}%`,
      positive: pool.change_24h > 0
    }));
    
    res.status(200).json({
      success: true,
      data: formattedPools
    });
  } catch (error) {
    logger.error('Error in searchPools controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error searching pools'
    });
  }
};

// Create a new pool
const createPool = async (req, res) => {
  try {
    const { 
      name, symbol, contract_address, description, creator_address, creator_name,
      token_address, price, market_cap, liquidity, holders, total_supply, total_supply_usdt,
      reserve_token, reserve_usdt, virtual_reserve_token, virtual_reserve_usdt,
      k_constant, creator_reserve, twitter_url, website_url
    } = req.body;
    
    // Basic validation - używamy token_address jeśli nie ma contract_address
    const effectiveTokenAddress = token_address || contract_address;
    
    if (!name || !symbol || !effectiveTokenAddress || !creator_address) {
      return res.status(400).json({
        success: false,
        error: 'Name, symbol, token address, and creator address are required'
      });
    }
    
    // Walidacja adresów
    if (!isValidContractAddress(effectiveTokenAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token address format'
      });
    }
    
    if (!isValidEthereumAddress(creator_address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid creator address format'
      });
    }
    
    // Walidacja URL dla Twittera i strony internetowej
    if (twitter_url && !isValidURL(twitter_url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Twitter URL format'
      });
    }
    
    if (website_url && !isValidURL(website_url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid website URL format'
      });
    }
    
    // Walidacja wartości liczbowych
    if (price && !isValidNumber(price)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid price value'
      });
    }
    
    if (market_cap && !isValidNumber(market_cap)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid market cap value'
      });
    }
    
    if (liquidity && !isValidNumber(liquidity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid liquidity value'
      });
    }
    
    if (holders && !isValidNumber(holders)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid holders value'
      });
    }
    
    // Walidacja nowych pól
    if (reserve_token && !isValidNumber(reserve_token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reserve_token value'
      });
    }
    
    if (reserve_usdt && !isValidNumber(reserve_usdt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reserve_usdt value'
      });
    }
    
    // Walidacja nowych pól dla tokenów lf0gfactory
    if (virtual_reserve_token && !isValidNumber(virtual_reserve_token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid virtual_reserve_token value'
      });
    }
    
    if (virtual_reserve_usdt && !isValidNumber(virtual_reserve_usdt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid virtual_reserve_usdt value'
      });
    }
    
    // W tym miejscu mamy zaufanie do adresu portfela - autentykacja 
    // już nastąpiła poprzez podpisanie transakcji przy łączeniu portfela

    // Check if pool with this token address already exists
    const existingPool = Pool.getByContractAddress(effectiveTokenAddress);
    if (existingPool) {
      return res.status(400).json({
        success: false,
        error: 'Pool with this token address already exists'
      });
    }
    
    // Handle image upload
    let image_url = `https://via.placeholder.com/32?text=${symbol}`;
    if (req.file) {
      // Używamy nazwy przetworzonego pliku
      image_url = `/uploads/pool-images/${req.file.filename}`;
      
      // Po zakończeniu przetwarzania możemy spróbować usunąć oryginalny plik (opcjonalnie)
      if (req.file.originalPath) {
        try {
          // Sprawdź czy plik istnieje przed próbą usunięcia
          if (fs.existsSync(req.file.originalPath)) {
            // Użyj unlink z timeoutem żeby uniknąć konfliktów dostępu do pliku
            setTimeout(() => {
              fs.unlink(req.file.originalPath, (err) => {
                if (err) {
                  logger.warn(`Nie można usunąć oryginalnego pliku: ${err.message}`);
                }
              });
            }, 1000); // dodaj 1 sekundę opóźnienia
          } else {
            logger.log(`Plik ${req.file.originalPath} nie istnieje, pomijam usuwanie`);
          }
        } catch (err) {
          logger.warn(`Błąd przy próbie usunięcia oryginalnego pliku: ${err.message}`);
        }
      } else {
        logger.log(`Plik ${req.file.originalPath} nie istnieje, pomijam usuwanie`);
      }
    }
    
    // Sanityzacja pól tekstowych
    const sanitizedName = sanitizeInput(name);
    const sanitizedSymbol = sanitizeInput(symbol);
    const sanitizedDescription = sanitizeInput(description || '');
    const sanitizedCreatorName = sanitizeInput(creator_name || '');
    
    // Create the pool with all available data
    const newPool = Pool.create({
      name: sanitizedName,
      symbol: sanitizedSymbol,
      token_address: effectiveTokenAddress,
      image_url,
      description: sanitizedDescription,
      creator_address,
      creator_name: sanitizedCreatorName,
      price: price ? parseFloat(price) : undefined,
      market_cap: 0, // Zawsze ustawiamy market_cap na 0 dla nowych tokenów
      liquidity: liquidity ? parseFloat(liquidity) : undefined,
      holders: holders ? parseInt(holders, 10) : undefined,
      total_supply,
      total_supply_usdt,
      reserve_token: reserve_token ? parseFloat(reserve_token) : undefined,
      reserve_usdt: reserve_usdt ? parseFloat(reserve_usdt) : undefined,
      virtual_reserve_token: virtual_reserve_token ? parseFloat(virtual_reserve_token) : undefined,
      virtual_reserve_usdt: virtual_reserve_usdt ? parseFloat(virtual_reserve_usdt) : undefined,
      k_constant,
      creator_reserve,
      twitter_url,
      website_url
    });
    
    // Format numeric values for frontend display like other pool endpoints
    const formattedPool = {
      ...newPool,
      price_formatted: formatPrice(newPool.price),
      market_cap_formatted: formatCurrency(newPool.market_cap),
      change_24h_formatted: `${newPool.change_24h > 0 ? '+' : ''}${newPool.change_24h.toFixed(2)}%`,
      positive: newPool.change_24h > 0
    };
    
    // Rozgłaszanie informacji o nowym poolu przez WebSocket
    try {
      logger.log('[poolController] Broadcasting new pool to WebSocket service:', formattedPool.name);
      // Transaction broadcast service expects POST /api/broadcast-pool with pool payload
      const response = await axios.post(`${process.env.REACT_APP_TRANSACTION_WEBSOCKET_URL}/api/broadcast-pool`, formattedPool);
      
      logger.log('[poolController] Pool broadcast success:', formattedPool.name, 'Response:', response.status);
    } catch (broadcastError) {
      // Logujemy błąd, ale nie przerywamy obsługi żądania
      logger.warn('[poolController] Failed to broadcast new pool:', broadcastError.message);
    }
    
    res.status(201).json({
      success: true,
      data: formattedPool
    });
  } catch (error) {
    logger.error('Error creating pool:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating pool: ' + error.message
    });
  }
};

// Get pools created by a specific user/address
const getPoolsByCreator = (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate the address format
    if (!isValidEthereumAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    // Get pools from database
    const pools = Pool.getByCreatorAddress(address);
    
    // Format numeric values for frontend display
    const formattedPools = pools.map(pool => ({
      ...pool,
      price_formatted: formatPrice(pool.price),
      market_cap_formatted: formatCurrency(pool.market_cap),
      change_24h_formatted: `${pool.change_24h > 0 ? '+' : ''}${pool.change_24h.toFixed(2)}%`,
      positive: pool.change_24h > 0
    }));
    
    res.status(200).json({
      success: true,
      data: formattedPools
    });
  } catch (error) {
    logger.error('Error in getPoolsByCreator controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching creator pools'
    });
  }
};

// Get top pools by Gravity Score
const getTopByGravityScore = (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Validate limit parameter
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 20); // Maximum 20 pools
    
    // Get pools with calculated gravity score
    const pools = Pool.getTopByGravityScore(parsedLimit);
    
    // Format numeric values for frontend display
    const formattedPools = pools.map(pool => ({
      ...pool,
      price_formatted: formatPrice(pool.price),
      market_cap_formatted: formatCurrency(pool.market_cap),
      change_24h_formatted: `${pool.change_24h > 0 ? '+' : ''}${pool.change_24h.toFixed(2)}%`,
      positive: pool.change_24h > 0,
      gravity_score_formatted: pool.gravity_score.toFixed(2)
    }));
    
    res.status(200).json({
      success: true,
      data: formattedPools
    });
  } catch (error) {
    logger.error('Error in getTopByGravityScore controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching top gravity pools'
    });
  }
};

// Helper function to format large currencies
const formatCurrency = (value) => {
  // Zabezpieczenie: null/undefined/NaN => 0
  if (value === null || value === undefined || isNaN(value)) {
    value = 0;
  }

  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  } else {
    return `$${Number(value).toFixed(2)}`;
  }
};

// Helper function to format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

/**
 * Inicjalizuje tabelę price_history dla wszystkich istniejących puli
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const initializePriceHistory = (req, res) => {
  try {
    const db = getDbConnection();
    
    // 1. Pobierz wszystkie istniejące pule
    const pools = db.prepare('SELECT id, price FROM pools').all();
    
    // 2. Dla każdej puli dodaj aktualną cenę do tabeli price_history
    let inserted = 0;
    const errors = [];
    
    for (const pool of pools) {
      try {
        db.prepare(`
          INSERT INTO price_history (pool_id, price)
          VALUES (?, ?)
        `).run(pool.id, pool.price);
        
        inserted++;
      } catch (error) {
        errors.push({
          pool_id: pool.id,
          error: error.message
        });
      }
    }
    
    db.close();
    
    res.status(200).json({
      success: true,
      message: `Successfully initialized price_history for ${inserted} pools`,
      total_pools: pools.length,
      inserted,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Error initializing price_history:', error);
    res.status(500).json({
      success: false,
      error: 'Server error initializing price_history'
    });
  }
};

/**
 * Graduate a pool token
 * Transitions a token from bonding curve pricing to liquidity pool trading
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const graduatePoolToken = async (req, res) => {
  try {
    const { address } = req.params;
    const { wallet_address } = req.body;
    const IS_TEST_ENV = process.env.REACT_APP_TEST === 'true';
    
    // Funkcja pomocnicza do logowania w trybie testowym
    const logDebug = (...args) => {
      if (IS_TEST_ENV) {
        logger.log(...args);
      }
    };
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Token address is required'
      });
    }
    
    logDebug(`Graduation request for token ${address} by wallet ${wallet_address}`);
    
    // Get the token details from the database
    const db = getDbConnection();
    const pool = db.prepare(`
      SELECT * FROM pools WHERE token_address = ?
    `).get(address);
    db.close();
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found'
      });
    }
    
    logDebug(`Found pool: ${pool.name} (${pool.symbol}), creator: ${pool.creator_address}`);
    
    // Verify the requester is the creator
    if (!wallet_address || wallet_address.toLowerCase() !== pool.creator_address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Only the token creator can perform graduation'
      });
    }
    
    // Check if the token is already graduated
    if (pool.graduated === 'yes') {
      logDebug(`Token ${address} is already graduated`);
      return res.status(400).json({
        success: false,
        error: 'Token is already graduated'
      });
    }
    
    // Validate graduation requirements
    const validationErrors = [];
    
    // In test environment, can optionally skip validation with query param
    const skipValidation = IS_TEST_ENV && req.query.skipValidation === 'true';
    
    if (!skipValidation) {
      // 1. Check if token meets bonding curve criteria (75% or more tokens sold)
      const totalSupply = pool.total_supply || 0;
      const totalSupplyAMM = pool.total_supply_tokenAMM || 0;
      const percentSold = totalSupply > 0 ? 100 - ((totalSupplyAMM / totalSupply) * 100) : 0;
      
      if (percentSold < 75) {
        validationErrors.push(`Bonding curve requirement not met: ${percentSold.toFixed(1)}% < 75% tokens sold`);
      }
      
      // 2. Check if token has minimum required holders
      const minRequiredHolders = 10;
      if ((pool.holders || 0) < minRequiredHolders) {
        validationErrors.push(`Minimum holders requirement not met: ${pool.holders || 0} < ${minRequiredHolders}`);
      }
      
      // 3. Check if token has been created at least 7 days ago
      const minRequiredDays = 7;
      const creationDate = new Date(pool.created_at);
      const daysSinceCreation = Math.floor((new Date() - creationDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreation < minRequiredDays) {
        validationErrors.push(`Token age requirement not met: ${daysSinceCreation} < ${minRequiredDays} days`);
      }
      
      // 4. Check if token has minimum gravity score
      const minRequiredGravityScore = 600;
      if ((pool.gravity_score || 0) < minRequiredGravityScore) {
        validationErrors.push(`Gravity Score requirement not met: ${pool.gravity_score || 0} < ${minRequiredGravityScore}`);
      }
    } else {
      logDebug(`Skipping validation for token ${address} in test environment`);
    }
    
    // If validation failed, return error with details
    if (validationErrors.length > 0) {
      logDebug(`Token ${address} graduation validation failed:`, validationErrors);
      return res.status(400).json({
        success: false,
        error: 'Token does not meet graduation requirements',
        validationErrors
      });
    }
    
    // Import the graduation module
    const { graduateToken } = require('../utils/graduateToken');
    
    // Execute graduation
    logDebug(`Executing graduation for token ${address}`);
    const result = await graduateToken(address);
    
    if (result.success) {
      logger.log(`Graduation successful for token ${address}`);
    } else {
      logger.error(`Graduation failed for token ${address}: ${result.message}`);
    }
    
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    logger.error('Error in graduatePoolToken:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during token graduation'
    });
  }
};

module.exports = {
  getPools,
  getTrendingPools,
  getPoolByAddress,
  searchPools,
  getPoolsByCreator,
  createPool,
  initializePriceHistory,
  getTopByGravityScore,
  graduatePoolToken
}; 