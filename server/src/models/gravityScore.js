/**
 * Gravity Score Model
 * 
 * This model handles the calculation and retrieval of gravity scores
 * for pools based on the Revised Gravity Score System methodology.
 * 
 * The Revised Gravity Score consists of two main components:
 * - Market Cap Component (70%) - 1 point for every $100 of market cap (capped at 700)
 * - Other Components (30%) - A combination of qualitative metrics
 *   - Curve Utilization (10%)
 *   - Holder Metrics (8%) 
 *   - Price Stability (5%)
 *   - Community Activity (7%)
 * 
 * Additional anti-manipulation safeguards:
 * - Minimum Activity Threshold: Requires at least 5 unique transactions in past 7 days
 * - Time-Weighted Market Cap: Uses 7-day average market cap
 * - Minimum Holder Requirement: Penalty for projects with fewer than 10 unique holders
 */

const { getDbConnection } = require('../db/init');
const logger = require('../utils/logger');

class GravityScore {
  /**
   * Calculate and store Gravity Score for a specific pool
   * @param {number} poolId - The ID of the pool
   */
  static async calculateForPool(poolId) {
    const db = getDbConnection();
    
    try {
      // Get pool data
      const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(poolId);
      
      if (!pool) {
        throw new Error(`Pool with ID ${poolId} not found`);
      }
      
      // Start transaction for atomic operation
      const transaction = db.transaction(() => {
        // Calculate time-weighted market cap (7-day average)
        const marketCapComponent = this.calculateMarketCapComponent(pool, db);
        
        // Calculate other components
        const curveUtilization = this.calculateCurveUtilization(pool);
        const holderMetrics = this.calculateHolderMetrics(pool, db);
        const priceStability = this.calculatePriceStability(pool, db);
        const communityActivity = this.calculateCommunityActivity(pool, db);
        
        // Calculate other components score (30% of total)
        const otherComponents = (curveUtilization * 0.10) + 
                               (holderMetrics * 0.08) + 
                               (priceStability * 0.05) + 
                               (communityActivity * 0.07);
        
        // Apply minimum activity and holder thresholds
        const penaltyMultiplier = this.calculatePenaltyMultiplier(pool, db);
        
        // Calculate raw score as weighted sum of components
        const rawScore = (marketCapComponent * 0.7) + (otherComponents * penaltyMultiplier);
        
        // Final score is raw score, capped at 1000
        const finalScore = Math.min(Math.round(rawScore), 1000);
        
        // Log calculation for debugging
        logger.log(`[GravityScore] Pool ID ${poolId} - Calculating Revised Gravity Score:`);
        logger.log(`  Market Cap Component:   ${marketCapComponent.toFixed(2)} (70% weight)`);
        logger.log(`  Curve Utilization:      ${curveUtilization.toFixed(2)} (10% weight)`);
        logger.log(`  Holder Metrics:         ${holderMetrics.toFixed(2)} (8% weight)`);
        logger.log(`  Price Stability:        ${priceStability.toFixed(2)} (5% weight)`);
        logger.log(`  Community Activity:     ${communityActivity.toFixed(2)} (7% weight)`);
        logger.log(`  Penalty Multiplier:     ${penaltyMultiplier.toFixed(2)}`);
        logger.log(`  Raw Score:              ${rawScore.toFixed(2)}`);
        logger.log(`  Final Score:            ${finalScore}`);
        
        // Insert into gravity_scores table
        db.prepare(`
          INSERT INTO gravity_scores (
            pool_id, 
            curve_utilization, 
            price_performance, 
            holder_metrics, 
            community_engagement, 
            activity_score,
            raw_score,
            bonus_multiplier,
            final_score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          poolId,
          curveUtilization,
          priceStability,
          holderMetrics,
          communityActivity,
          0, // Not used in new formula
          rawScore,
          penaltyMultiplier,
          finalScore
        );
        
        // Update gravity_score in pools table
        db.prepare('UPDATE pools SET gravity_score = ? WHERE id = ?').run(finalScore, poolId);
        
        return finalScore;
      });
      
      // Execute transaction
      const finalScore = transaction();
      
      db.close();
      return finalScore;
    } catch (error) {
      logger.error(`Error calculating gravity score for pool ${poolId}:`, error);
      db.close();
      throw error;
    }
  }
  
  /**
   * Calculate Market Cap Component (70%)
   * 1 point for every $100 of market cap, capped at 700 points
   */
  static calculateMarketCapComponent(pool, db) {
    // Get market cap data for past 7 days for time-weighted average
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get historical price data
    const priceHistory = db.prepare(`
      SELECT price FROM price_history 
      WHERE pool_id = ? AND timestamp >= datetime(?)
      ORDER BY timestamp DESC
    `).all(pool.id, sevenDaysAgo.toISOString());
    
    // Calculate time-weighted market cap
    let marketCap = pool.market_cap; // Default to current market cap
    
    if (priceHistory.length > 0) {
      // Calculate average price over 7 days
      const avgPrice = priceHistory.reduce((sum, record) => sum + record.price, 0) / priceHistory.length;
      
      // Calculate time-weighted market cap using average price
      marketCap = avgPrice * pool.total_supply;
    }
    
    // 1 point per $100 of market cap, capped at 700 points
    return Math.min(marketCap / 100, 700);
  }
  
  /**
   * Calculate Curve Utilization component (10%)
   */
  static calculateCurveUtilization(pool) {
    // Curve_Utilization = ((total_supply - total_supply_tokenAMM) / total_supply) * 100
    if (!pool.total_supply || pool.total_supply === 0) {
      return 0;
    }
    
    const utilization = ((pool.total_supply - pool.total_supply_tokenAMM) / pool.total_supply) * 100;
    
    // Ensure the result is between 0 and 100
    return Math.max(0, Math.min(100, utilization));
  }
  
  /**
   * Calculate Holder Metrics component (8%)
   */
  static calculateHolderMetrics(pool, db) {
    // Analyze holder distribution - count "real" holders (excluding bonding curve)
    const holders = db.prepare(`
      SELECT holder_address, holder_amount FROM hodlers WHERE pool_id = ? ORDER BY holder_amount DESC
    `).all(pool.id);
    
    // Ignore bonding curve as a holder
    let realHolderCount = 0;
    let totalTokens = 0;
    let tokensByCurve = 0;
    
    for (const holder of holders) {
      const amount = parseFloat(holder.holder_amount);
      totalTokens += amount;
      
      // Check if holder address is bonding curve contract (same as token_address)
      if (holder.holder_address.toLowerCase() === pool.token_address.toLowerCase()) {
        tokensByCurve += amount;
      } else {
        realHolderCount++;
      }
    }
    
    logger.log(`[GravityScore] Pool ID ${pool.id} - Holder Analysis:`);
    logger.log(`  Real holder count (excluding bonding curve): ${realHolderCount}`);
    
    // Use logarithmic scale for holder score: log10(holders) * 25
    // This gives ~50 points for 100 holders, ~75 for 1000 holders, ~100 for 10k+ holders
    return Math.min(Math.log10(Math.max(1, realHolderCount)) * 25, 100);
  }
  
  /**
   * Calculate Price Stability component (5%)
   */
  static calculatePriceStability(pool, db) {
    // Get price data for volatility calculation (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const priceHistory = db.prepare(`
      SELECT price FROM price_history 
      WHERE pool_id = ? AND timestamp >= datetime(?)
      ORDER BY timestamp ASC
    `).all(pool.id, sevenDaysAgo.toISOString());
    
    // Calculate price stability component
    let priceStability = 50; // Default value (neutral)
    
    if (priceHistory.length > 1) {
      const prices = priceHistory.map(record => record.price);
      
      // Calculate average price
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      if (avgPrice > 0) {
        // Calculate standard deviation (volatility)
        const squareDiffs = prices.map(price => {
          const diff = price - avgPrice;
          return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);
        
        // price_stability = (1 - (price_volatility_7d / average_price_7d)) * 100
        priceStability = (1 - (stdDev / avgPrice)) * 100;
        
        // Ensure the result is between 0 and 100
        priceStability = Math.max(0, Math.min(100, priceStability));
      }
    }
    
    return priceStability;
  }
  
  /**
   * Calculate Community Activity component (7%)
   */
  static calculateCommunityActivity(pool, db) {
    // Get comment and vote data
    const commentData = db.prepare(`
      SELECT COUNT(*) as count FROM comments WHERE pool_id = ?
    `).get(pool.id);
    
    const voteData = db.prepare(`
      SELECT COUNT(DISTINCT wallet_address) as unique_voters
      FROM pool_ratings WHERE pool_id = ?
    `).get(pool.id);
    
    // Get transaction count for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const txData = db.prepare(`
      SELECT COUNT(*) as count,
             COUNT(DISTINCT wallet_address) as unique_users
      FROM transactions 
      WHERE pool_id = ? AND timestamp >= datetime(?)
    `).get(pool.id, sevenDaysAgo.toISOString());
    
    // Calculate normalized activity metrics (0-100 each)
    const commentScore = Math.min(commentData.count * 2, 100);
    const voterScore = Math.min(voteData.unique_voters * 5, 100);
    const txScore = Math.min(txData.unique_users * 10, 100);
    
    // Weighted average of activity metrics
    return (commentScore * 0.3) + (voterScore * 0.3) + (txScore * 0.4);
  }
  
  /**
   * Calculate penalty multiplier for minimum activity and holder thresholds
   */
  static calculatePenaltyMultiplier(pool, db) {
    let penaltyMultiplier = 1.0;
    let penalties = [];
    
    // Check for minimum transaction activity (at least 5 unique transactions in 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const txData = db.prepare(`
      SELECT COUNT(DISTINCT wallet_address) as unique_users
      FROM transactions 
      WHERE pool_id = ? AND timestamp >= datetime(?)
    `).get(pool.id, sevenDaysAgo.toISOString());
    
    if (txData.unique_users < 5) {
      penaltyMultiplier *= 0.8; // 20% penalty for low activity
      penalties.push({ name: "Low Activity Penalty", value: 0.8, reason: `tylko ${txData.unique_users} unikalnych użytkowników transakcji w ciągu 7 dni` });
    }
    
    // Check for minimum real holder count (at least 10 unique holders)
    const holders = db.prepare(`
      SELECT COUNT(*) as count 
      FROM hodlers 
      WHERE pool_id = ? AND holder_address != ? AND holder_address != ?
    `).get(pool.id, pool.token_address, pool.creator_address);
    
    if (holders.count < 10) {
      penaltyMultiplier *= 0.5; // 50% penalty for too few holders
      penalties.push({ name: "Low Holder Count Penalty", value: 0.5, reason: `tylko ${holders.count} unikalnych posiadaczy tokenów` });
    }
    
    // Log applied penalties
    logger.log(`[GravityScore] Pool ID ${pool.id} - Penalties applied:`);
    if (penalties.length === 0) {
      logger.log('  No penalties applied');
    } else {
      penalties.forEach(penalty => {
        logger.log(`  ${penalty.name}: ${(penalty.value * 100).toFixed(0)}% (${penalty.reason})`);
      });
    }
    logger.log(`  Final penalty multiplier: ${penaltyMultiplier.toFixed(2)}`);
    
    return penaltyMultiplier;
  }
  
  /**
   * Calculate Gravity Scores for all pools
   */
  static async calculateForAllPools() {
    const db = getDbConnection();
    
    try {
      // Get all pool IDs
      const pools = db.prepare('SELECT id FROM pools').all();
      db.close();
      
      // Calculate score for each pool
      const results = [];
      for (const pool of pools) {
        try {
          const score = await this.calculateForPool(pool.id);
          results.push({ poolId: pool.id, score });
        } catch (error) {
          logger.error(`Error calculating score for pool ${pool.id}:`, error);
          results.push({ poolId: pool.id, error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error calculating gravity scores for all pools:', error);
      db.close();
      throw error;
    }
  }
  
  /**
   * Get the latest Gravity Score details for a pool
   * @param {number} poolId - The ID of the pool
   */
  static getLatestForPool(poolId) {
    const db = getDbConnection();
    
    try {
      const scoreDetails = db.prepare(`
        SELECT * FROM gravity_scores 
        WHERE pool_id = ? 
        ORDER BY calculation_date DESC 
        LIMIT 1
      `).get(poolId);
      
      db.close();
      return scoreDetails;
    } catch (error) {
      logger.error(`Error fetching gravity score for pool ${poolId}:`, error);
      db.close();
      throw error;
    }
  }
  
  /**
   * Get historical Gravity Scores for a pool
   * @param {number} poolId - The ID of the pool
   * @param {number} limit - Number of historical entries to return
   */
  static getHistoryForPool(poolId, limit = 30) {
    const db = getDbConnection();
    
    try {
      const scoreHistory = db.prepare(`
        SELECT final_score, calculation_date 
        FROM gravity_scores 
        WHERE pool_id = ? 
        ORDER BY calculation_date DESC 
        LIMIT ?
      `).all(poolId, limit);
      
      db.close();
      return scoreHistory;
    } catch (error) {
      logger.error(`Error fetching gravity score history for pool ${poolId}:`, error);
      db.close();
      throw error;
    }
  }
}

module.exports = GravityScore; 