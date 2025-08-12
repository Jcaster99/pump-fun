import { API_URL } from '../utils/apiConfig';

/**
 * Fetch holder distribution for a pool
 * @param {string} poolAddress - The pool contract address
 * @returns {Promise<Object>} - Object containing array of holder distribution data
 */
export const fetchHolderDistribution = async (poolAddress) => {
  try {
    const response = await fetch(
      `${API_URL}/pools/${poolAddress}/holders`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch holder distribution');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching holder distribution:', error);
    throw error;
  }
};

/**
 * Fetch detailed list of all holders for a pool
 * @param {string} poolAddress - The pool contract address
 * @returns {Promise<Object>} - Object containing detailed list of holders
 */
export const fetchPoolHoldersList = async (poolAddress) => {
  try {
    const response = await fetch(
      `${API_URL}/pools/${poolAddress}/holders/list`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch holders list');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching holders list:', error);
    throw error;
  }
}; 