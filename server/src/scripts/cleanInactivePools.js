/**
 * Script to clean inactive pools
 * This script checks for pools that have no transactions in the last 48 hours and were created more than 48 hours ago
 * If a pool meets these criteria, it is removed from the database along with all related data
 * 
 * Run this script with a cron job every 24 hours:
 * 0 0 * * * cd /path/to/server && node src/scripts/cleanInactivePools.js >> /var/log/lf0g/pool-cleanup.log 2>&1
 */

const { getDbConnection } = require('../db/init');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Function to get inactive pools (no transactions in the last 48 hours)
const getInactivePools = (db) => {
  const query = `
    SELECT p.id, p.name, p.symbol, p.contract_address, p.image_url 
    FROM pools p
    WHERE NOT EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.pool_id = p.id
      AND t.timestamp > datetime('now', '-48 hours')
    )
    AND p.created_at < datetime('now', '-48 hours')
  `;

  try {
    return db.prepare(query).all();
  } catch (error) {
    logger.error('Error finding inactive pools:', error);
    throw error;
  }
};

// Function to delete a pool and its related data
const deletePool = (db, poolId, poolDetails) => {
  try {
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();

    // Delete related transactions
    const deleteTransactionsResult = db.prepare('DELETE FROM transactions WHERE pool_id = ?').run(poolId);
    logger.log(`Deleted ${deleteTransactionsResult.changes} transactions for pool ${poolDetails.symbol} (${poolDetails.contract_address})`);

    // Delete related comments likes (we need to find comment ids first)
    const commentIds = db.prepare('SELECT id FROM comments WHERE pool_id = ?').all(poolId).map(row => row.id);
    
    if (commentIds.length > 0) {
      // SQLite doesn't support array parameters, so we need to build the query with placeholders
      const placeholders = commentIds.map(() => '?').join(',');
      const deleteLikesResult = db.prepare(`DELETE FROM comment_likes WHERE comment_id IN (${placeholders})`).run(...commentIds);
      logger.log(`Deleted ${deleteLikesResult.changes} comment likes for pool ${poolDetails.symbol}`);
    }

    // Delete related comments
    const deleteCommentsResult = db.prepare('DELETE FROM comments WHERE pool_id = ?').run(poolId);
    logger.log(`Deleted ${deleteCommentsResult.changes} comments for pool ${poolDetails.symbol}`);

    // Delete related price history if the table exists
    try {
      // Check if price_history table exists
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='price_history'").get();
      if (tableCheck) {
        const deletePriceHistoryResult = db.prepare('DELETE FROM price_history WHERE pool_id = ?').run(poolId);
        logger.log(`Deleted ${deletePriceHistoryResult.changes} price history entries for pool ${poolDetails.symbol}`);
      }
    } catch (error) {
      logger.error('Error deleting price history:', error);
      // Continue with other deletions even if this fails
    }

    // Delete pool image if it exists
    if (poolDetails.image_url) {
      try {
        const imagePath = path.join(__dirname, '../../uploads/pool-images', path.basename(poolDetails.image_url));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          logger.log(`Deleted image file for pool ${poolDetails.symbol}`);
        }
      } catch (imageError) {
        logger.error('Error deleting pool image:', imageError);
        // Continue with pool deletion even if image deletion fails
      }
    }

    // Finally delete the pool
    const deletePoolResult = db.prepare('DELETE FROM pools WHERE id = ?').run(poolId);
    
    // Commit transaction
    db.prepare('COMMIT').run();
    
    logger.log(`Successfully deleted pool ${poolDetails.symbol} (${poolDetails.contract_address})`);
    return true;
  } catch (error) {
    // Rollback in case of error
    db.prepare('ROLLBACK').run();
    logger.error(`Error deleting pool ${poolDetails.symbol} (${poolDetails.contract_address}):`, error);
    return false;
  }
};

// Main function
const cleanInactivePools = async () => {
  logger.log(`[${new Date().toISOString()}] Starting inactive pools cleanup process`);
  
  const db = getDbConnection();
  
  try {
    // Get all inactive pools
    const inactivePools = getInactivePools(db);
    logger.log(`Found ${inactivePools.length} inactive pools (no transactions and created more than 48 hours ago)`);
    
    if (inactivePools.length === 0) {
      logger.log('No pools to clean up');
      return;
    }
    
    // Delete each inactive pool
    let successCount = 0;
    let errorCount = 0;
    
    for (const pool of inactivePools) {
      logger.log(`Processing pool: ${pool.symbol} (${pool.contract_address})`);
      
      const success = deletePool(db, pool.id, pool);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    logger.log(`Cleanup completed. Successfully deleted: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    logger.error('Error during cleanup process:', error);
  } finally {
    // Always close the database connection
    db.close();
    logger.log(`[${new Date().toISOString()}] Pool cleanup process finished`);
  }
};

// Execute the cleanup
cleanInactivePools(); 