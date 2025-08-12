/**
 * Utility functions for the leaderboard component
 */

/**
 * Format a currency value with appropriate suffix (K, M, B)
 * @param {number} value - The currency value to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '0.00';
  
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  } else {
    return value.toFixed(2);
  }
};

/**
 * Calculate total trading volume from pool data
 * @param {Array} leaderboardData - Array of pool data
 * @returns {string} - Formatted total volume
 */
export const getFormattedTotalVolume = (leaderboardData) => {
  if (!leaderboardData || leaderboardData.length === 0) return '0';
  
  const totalVolume = leaderboardData.reduce((sum, pool) => {
    return sum + (parseFloat(pool.volume_24h || 0));
  }, 0);
  
  return formatCurrency(totalVolume);
};

/**
 * Calculate total unique holders from pool data
 * @param {Array} leaderboardData - Array of pool data
 * @returns {string} - Formatted total holders count
 */
export const getFormattedTotalHolders = (leaderboardData) => {
  if (!leaderboardData || leaderboardData.length === 0) return '0';
  
  const totalHolders = leaderboardData.reduce((sum, pool) => {
    return sum + (parseInt(pool.holders || 0));
  }, 0);
  
  return totalHolders.toLocaleString();
};

/**
 * Find highest token price from pool data
 * @param {Array} leaderboardData - Array of pool data
 * @returns {string} - Formatted highest price
 */
export const getHighestTokenPrice = (leaderboardData) => {
  if (!leaderboardData || leaderboardData.length === 0) return '0.00';
  
  const highestPrice = Math.max(...leaderboardData.map(pool => 
    parseFloat(pool.price_realtime || pool.price || 0)
  ));
  return highestPrice.toFixed(2);
}; 