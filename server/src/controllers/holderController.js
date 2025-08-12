const { getDbConnection } = require('../db/init');
const { updateHolderData } = require('../utils/updateHolders');
const logger = require('../utils/logger');

/**
 * @route GET /api/pools/:address/holders
 * @description Get holder distribution data for a specific pool from database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHolderDistribution = async (req, res) => {
  try {
    const { address } = req.params;
    const forceUpdate = req.query.forceUpdate === 'true';
    
    logger.log(`[holderController] Fetching holder distribution for address: ${address}, forceUpdate: ${forceUpdate}`);
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Pool address is required'
      });
    }
    
    // First check if the pool exists in our database
    const db = getDbConnection();
    
    try {
      const pool = db.prepare(`
        SELECT * FROM pools WHERE token_address = ?
      `).get(address);
      
      if (!pool) {
        logger.log(`[holderController] Pool not found in database for address: ${address}`);
        db.close();
        return res.status(404).json({
          success: false,
          error: 'Pool not found'
        });
      }
      
      logger.log(`[holderController] Pool found in database: ${pool.name}`);
      
      // Pobierz listę hodlers dla tej puli
      const holders = db.prepare(`
        SELECT * FROM hodlers WHERE pool_id = ? ORDER BY holder_amount DESC
      `).all(pool.id);
      
      db.close();
      
      if (!holders || holders.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No holders found for this pool'
        });
      }
      
      // Przygotuj dane do odpowiedzi
      // Oblicz total supply na podstawie wszystkich hodlers
      const totalSupply = holders.reduce((sum, holder) => sum + Number(holder.holder_amount), 0);
      
      // Przekształć dane dla odpowiedzi API
      const distribution = holders.map(holder => ({
        name: holder.holder_username,
        value: Number(holder.holder_amount) / totalSupply, // procent całkowitej podaży
        address: holder.holder_address,
        amount: holder.holder_amount
      }));
      
      return res.status(200).json({
        success: true,
        data: distribution,
        total_holders: pool.holders,
        refreshed: true
      });
    } catch (dbError) {
      db.close();
      throw dbError;
    }
  } catch (error) {
    logger.error('Error getting holder distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting holder distribution: ' + error.message
    });
  }
};

/**
 * @route GET /api/pools/:address/holders/list
 * @description Get list of all holders for a specific pool
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPoolHolders = async (req, res) => {
  try {
    const { address } = req.params;
    
    logger.log(`[holderController] Fetching holders list for address: ${address}`);
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Pool address is required'
      });
    }
    
    // Znajdź pulę w bazie danych
    const db = getDbConnection();
    
    try {
      const pool = db.prepare(`
        SELECT * FROM pools WHERE token_address = ?
      `).get(address);
      
      if (!pool) {
        logger.log(`[holderController] Pool not found in database for address: ${address}`);
        db.close();
        return res.status(404).json({
          success: false,
          error: 'Pool not found'
        });
      }
      
      // Pobierz wszystkich hodlers dla tej puli
      const holders = db.prepare(`
        SELECT * FROM hodlers WHERE pool_id = ? ORDER BY holder_amount DESC
      `).all(pool.id);
      
      db.close();
      
      // Oblicz total supply na podstawie wszystkich hodlers
      const totalSupply = holders.reduce((sum, holder) => sum + Number(holder.holder_amount), 0);
      
      // Przekształć dane dla odpowiedzi API
      const holdersList = holders.map(holder => ({
        username: holder.holder_username,
        address: holder.holder_address,
        amount: holder.holder_amount,
        percentage: (Number(holder.holder_amount) / totalSupply) * 100, // procent całkowitej podaży
        last_updated: holder.last_updated
      }));
      
      return res.status(200).json({
        success: true,
        pool: {
          id: pool.id,
          name: pool.name,
          symbol: pool.symbol,
          token_address: pool.token_address
        },
        total_supply: totalSupply,
        total_holders: holders.length,
        holders: holdersList
      });
    } catch (dbError) {
      db.close();
      throw dbError;
    }
  } catch (error) {
    logger.error('Error getting holders list:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting holders list: ' + error.message
    });
  }
};

module.exports = {
  getHolderDistribution,
  getPoolHolders
}; 