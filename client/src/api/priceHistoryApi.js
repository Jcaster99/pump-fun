import { API_URL } from '../utils/apiConfig';

/**
 * Fetch price history for a pool
 * @param {string} poolAddress - The pool contract address
 * @param {string} timeRange - Time range for price history (24h, 7d, 30d, all)
 * @returns {Promise<Object>} - Object containing array of price data points
 */
export const fetchPriceHistory = async (poolAddress, timeRange = '30d') => {
  try {
    const response = await fetch(
      `${API_URL}/pools/${poolAddress}/price-history?timeRange=${timeRange}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch price history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw error;
  }
}; 