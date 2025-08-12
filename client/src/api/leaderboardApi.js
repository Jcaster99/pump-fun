import { API_URL } from '../utils/apiConfig';
import logger from '../utils/logger';

/**
 * Fetch top pools for the leaderboard with weighted score calculation
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of pools to fetch (max 100)
 * @param {string} options.timeframe - Time period for data ('weekly', 'monthly', 'all-time')
 * @returns {Promise<Object>} - Object containing array of pools with weighted scores
 */
export const fetchLeaderboardData = async (options = {}) => {
  const { limit = 100, timeframe = 'all-time' } = options;
  const parsedLimit = Math.min(parseInt(limit) || 100, 100); // Maximum 100 pools
  
  try {
    logger.debug(`[leaderboardApi] Fetching leaderboard data, limit: ${parsedLimit}, timeframe: ${timeframe}`);
    
    // Fetch pools ordered by market_cap
    let url = `${API_URL}/pools?limit=${parsedLimit}&orderBy=market_cap&order=DESC`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch pools for leaderboard');
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('Invalid API response format');
    }
    
    // Calculate weighted score for each pool (80% market cap, 20% gravity score)
    const poolsWithWeightedScore = data.data.map(pool => {
      // Ensure numeric values
      const gravityScore = parseFloat(pool.gravity_score || 0);
      const marketCap = parseFloat(pool.market_cap || 0);
      
      // Calculate weighted score
      const weightedScore = (0.8 * marketCap) + (0.2 * gravityScore);
      
      // Format values for display
      const formattedPool = {
        ...pool,
        weighted_score: weightedScore,
        // Ensure we have creator_name fallback to prevent anonymous
        creator_name: pool.creator_name || 'anonymous',
        // Use price_realtime if available, fallback to price
        price: pool.price_realtime || pool.price || 0
      };
      
      return formattedPool;
    });
    
    // Sort by weighted score
    poolsWithWeightedScore.sort((a, b) => b.weighted_score - a.weighted_score);
    
    return {
      success: true,
      data: poolsWithWeightedScore,
      pagination: data.pagination
    };
  } catch (error) {
    logger.error('Error fetching leaderboard data:', error);
    throw error;
  }
};

export default {
  fetchLeaderboardData
}; 