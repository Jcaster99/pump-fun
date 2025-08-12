const { getDbConnection } = require('../db/init');
const fetch = require('node-fetch');
const logger = require('./logger');

/**
 * Fetches holder distribution data from explorer API
 * @param {string} contractAddress - The contract address to fetch holders for
 * @returns {Promise<Object>} - Object containing holders array and total count
 */
const fetchRealHolderDistribution = async (contractAddress) => {
  try {
    logger.log(`[fetchRealHolderDistribution] Fetching holders for contract: ${contractAddress}`);
    // Start with the first page (skip=0)
    let skip = 0;
    const limit = 100;
    let allHolders = [];
    let hasMoreData = true;
    let totalHolders = 0;
    
    // Fetch data from all pages until there's no more data
    while (hasMoreData) {
      // NOTE: API URL updated to 0G-Galileo Testnet explorer
      // If your deployment requires a different endpoint, you can override it via the EXPLORER_API_URL env variable
      const EXPLORER_API_BASE = process.env.EXPLORER_API_URL || 'https://chainscan-galileo.0g.ai';
      const apiUrl = `${EXPLORER_API_BASE}/stat/tokens/holder-rank?address=${contractAddress}&limit=${limit}&orderBy=balance&reverse=true&skip=${skip}&tab=holders`;
      
      logger.log(`[fetchRealHolderDistribution] Fetching from API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      logger.log(`[fetchRealHolderDistribution] API response status: ${data.status}`);
      
      if (data.status !== "1") {
        throw new Error(`API error: ${data.message || 'Unknown error'}`);
      }
      
      const { result } = data;
      logger.log(`[fetchRealHolderDistribution] Result data:`, {
        listLimit: result.listLimit,
        total: result.total,
        listLength: result.list ? result.list.length : 0,
        skip: result.skip,
        limit: result.limit
      });
      
      const holders = result.list || [];
      
      // Set total holders count from the first API call
      if (skip === 0) {
        totalHolders = result.total;
        logger.log(`[fetchRealHolderDistribution] Total holders from API: ${totalHolders}`);
      }
      
      // Add holders from this page to our collection
      allHolders = [...allHolders, ...holders];
      logger.log(`[fetchRealHolderDistribution] Accumulated ${allHolders.length} holders so far`);
      
      // Check if we need to fetch more pages
      if (holders.length < limit || allHolders.length >= result.total) {
        hasMoreData = false;
        logger.log(`[fetchRealHolderDistribution] No more pages to fetch`);
      } else {
        skip += limit;
        logger.log(`[fetchRealHolderDistribution] Fetching next page with skip=${skip}`);
      }
    }
    
    logger.log(`[fetchRealHolderDistribution] Final result: ${allHolders.length} holders collected, total reported: ${totalHolders}`);
    
    return {
      holders: allHolders,
      total: totalHolders // Use the total from API, not the length of our array
    };
  } catch (error) {
    logger.error('[fetchRealHolderDistribution] Error:', error);
    throw error;
  }
};

/**
 * Processes holder data into distribution categories
 * @param {Object} holderData - Object containing holders array and total count
 * @returns {Array} - Distribution data for chart display
 */
const processHolderDistribution = (holderData) => {
  const { holders, total } = holderData;
  
  if (!holders || holders.length === 0) {
    return [];
  }
  
  // Calculate total supply from all balances
  const totalSupply = holders.reduce((sum, holder) => {
    // Convert balance string to BigInt for accurate calculation
    const balance = BigInt(holder.balance);
    return sum + balance;
  }, BigInt(0));
  
  // Helper to format address to "0x...1234" format
  const formatAddress = (address) => {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };
  
  // Helper to format large token amounts for display
  const formatTokenAmount = (balanceStr) => {
    if (!balanceStr) return '0';
    
    const balance = BigInt(balanceStr);
    
    // Convert to a more human-readable format (either trillion, billion, million, or thousand)
    const trillion = BigInt('1000000000000');
    const billion = BigInt('1000000000');
    const million = BigInt('1000000');
    const thousand = BigInt('1000');
    
    if (balance >= trillion) {
      return `${(Number(balance) / Number(trillion)).toFixed(2)}T`;
    } else if (balance >= billion) {
      return `${(Number(balance) / Number(billion)).toFixed(2)}B`;
    } else if (balance >= million) {
      return `${(Number(balance) / Number(million)).toFixed(2)}M`;
    } else if (balance >= thousand) {
      return `${(Number(balance) / Number(thousand)).toFixed(2)}K`;
    } else {
      return balance.toString();
    }
  };
  
  // No need to create groups if there are very few holders
  if (holders.length <= 5) {
    return holders.map((holder) => {
      const balance = BigInt(holder.balance);
      const percentage = Number((balance * BigInt(100000)) / totalSupply) / 1000;
      const shortAddress = formatAddress(holder.account.address);
      const formattedBalance = formatTokenAmount(holder.balance);
      
      return {
        name: shortAddress,
        value: percentage / 100, // Convert to decimal (0-1 range)
        address: holder.account.address,
        shortAddress: shortAddress,
        balance: holder.balance,
        formattedBalance: formattedBalance
      };
    });
  }
  
  // For larger holder counts, group into categories
  const top10 = holders.slice(0, 10);
  const top11to50 = holders.slice(10, 50);
  const top51to100 = holders.slice(50, 100);
  const top101to500 = holders.slice(100, 500);
  const remaining = holders.slice(500);
  
  // Calculate totals for each group
  const calculateGroupTotal = (group) => {
    return group.reduce((sum, holder) => sum + BigInt(holder.balance), BigInt(0));
  };
  
  const top10Total = calculateGroupTotal(top10);
  const top11to50Total = calculateGroupTotal(top11to50);
  const top51to100Total = calculateGroupTotal(top51to100);
  const top101to500Total = calculateGroupTotal(top101to500);
  const remainingTotal = calculateGroupTotal(remaining);
  
  // Create distribution data
  const distribution = [];
  
  // Helper to add category with additional holder information
  const addCategory = (name, total, holders, count) => {
    if (count > 0) {
      const percentage = Number((total * BigInt(100000)) / totalSupply) / 1000;
      
      // Format top holders for display
      const topHolders = holders.slice(0, Math.min(5, holders.length)).map(holder => ({
        address: holder.account.address,
        shortAddress: formatAddress(holder.account.address),
        balance: holder.balance,
        formattedBalance: formatTokenAmount(holder.balance),
        percentage: Number((BigInt(holder.balance) * BigInt(100000)) / totalSupply) / 1000
      }));
      
      distribution.push({
        name,
        value: percentage / 100, // Convert to decimal (0-1 range)
        topHolders,
        holdersCount: count
      });
    }
  };
  
  addCategory('Top 10 Holders', top10Total, top10, top10.length);
  addCategory('Top 11-50 Holders', top11to50Total, top11to50, top11to50.length);
  addCategory('Top 51-100 Holders', top51to100Total, top51to100, top51to100.length);
  addCategory('Top 101-500 Holders', top101to500Total, top101to500, top101to500.length);
  addCategory('Remaining Holders', remainingTotal, remaining, remaining.length);
  
  return distribution;
};

/**
 * Updates or creates holder data for a specific pool
 * @param {Object} pool - The pool object containing id, token_address
 * @returns {Promise<Object>} - Updated holder data
 */
const updateHolderData = async (pool) => {
  try {
    logger.log(`[updateHolderData] Updating holder data for pool: ${pool.name} (${pool.token_address})`);
    
    if (!pool.token_address) {
      logger.log(`[updateHolderData] No token_address found for pool: ${pool.name}`);
      throw new Error('No token address available for this pool');
    }
    
    logger.log(`[updateHolderData] Using token_address: ${pool.token_address} to fetch holders`);
    
    // Fetch holder data from external API
    const holderData = await fetchRealHolderDistribution(pool.token_address);
    
    logger.log(`[updateHolderData] Received holder data from API: ${holderData.total} holders`);
    
    // Process the data into distribution format
    const distribution = processHolderDistribution(holderData);
    logger.log(`[updateHolderData] Processed distribution with ${distribution.length} categories`);
    
    // Save data to the database
    const db = getDbConnection();
    
    try {
      // Begin transaction
      db.prepare('BEGIN').run();
      
      // Update the holders count in the pools table if it differs
      if (holderData.total !== pool.holders) {
        logger.log(`[updateHolderData] Updating holders count in pools table from ${pool.holders} to ${holderData.total}`);
        db.prepare(`
          UPDATE pools SET holders = ? WHERE id = ?
        `).run(holderData.total, pool.id);
      }
      
      // Check if a record already exists for this pool
      const existingRecord = db.prepare(`
        SELECT id FROM hodlers WHERE pool_id = ?
      `).get(pool.id);
      
      const holderDataJson = JSON.stringify({
        data: distribution,
        rawHolders: holderData.holders.slice(0, 500) // Store top 500 holders only to save space
      });
      
      if (existingRecord) {
        // Update existing record
        db.prepare(`
          UPDATE hodlers 
          SET holder_data = ?, total_holders = ?, last_updated = datetime('now')
          WHERE pool_id = ?
        `).run(holderDataJson, holderData.total, pool.id);
        logger.log(`[updateHolderData] Updated existing holder record for pool_id: ${pool.id}`);
      } else {
        // Insert new record
        db.prepare(`
          INSERT INTO hodlers (pool_id, holder_data, total_holders, last_updated)
          VALUES (?, ?, ?, datetime('now'))
        `).run(pool.id, holderDataJson, holderData.total);
        logger.log(`[updateHolderData] Created new holder record for pool_id: ${pool.id}`);
      }
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      logger.log(`[updateHolderData] Successfully saved holder data for pool: ${pool.name}`);
      
      return {
        distribution,
        total_holders: holderData.total
      };
      
    } catch (dbError) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      logger.error(`[updateHolderData] Database error: ${dbError.message}`);
      throw dbError;
    } finally {
      db.close();
    }
    
  } catch (error) {
    logger.error(`[updateHolderData] Error updating holder data: ${error.message}`);
    throw error;
  }
};

/**
 * Update holder data for all pools or a specific pool
 * @param {number|null} poolId - Optional specific pool ID to update
 * @returns {Promise<Object>} - Summary of update operation
 */
const updateAllHolderData = async (poolId = null) => {
  try {
    logger.log(`[updateAllHolderData] Starting holder data update${poolId ? ` for pool ID ${poolId}` : ' for all pools'}`);
    const db = getDbConnection();
    
    let pools;
    if (poolId) {
      // Get specific pool
      pools = [db.prepare(`
        SELECT * FROM pools WHERE id = ? AND token_address IS NOT NULL
      `).get(poolId)];
      
      if (!pools[0]) {
        db.close();
        logger.log(`[updateAllHolderData] Pool ID ${poolId} not found or has no token address`);
        return { success: false, message: 'Pool not found or has no token address' };
      }
    } else {
      // Get all pools with token addresses
      pools = db.prepare(`
        SELECT * FROM pools WHERE token_address IS NOT NULL
      `).all();
    }
    
    db.close();
    
    logger.log(`[updateAllHolderData] Found ${pools.length} pools to update`);
    
    const results = {
      total: pools.length,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    // Process each pool
    for (const pool of pools) {
      try {
        logger.log(`[updateAllHolderData] Processing pool: ${pool.name}`);
        await updateHolderData(pool);
        results.updated++;
      } catch (error) {
        logger.error(`[updateAllHolderData] Error updating pool ${pool.name}: ${error.message}`);
        results.failed++;
        results.errors.push({
          poolId: pool.id,
          poolName: pool.name,
          error: error.message
        });
      }
    }
    
    logger.log(`[updateAllHolderData] Completed holder data update. Updated: ${results.updated}, Failed: ${results.failed}`);
    
    return {
      success: true,
      results
    };
    
  } catch (error) {
    logger.error(`[updateAllHolderData] Error in update process: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  updateHolderData,
  updateAllHolderData,
  fetchRealHolderDistribution,
  processHolderDistribution
}; 