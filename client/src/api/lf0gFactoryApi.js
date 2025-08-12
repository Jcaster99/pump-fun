import { lf0gFactoryUrl } from '../utils/apiConfig';

/**
 * Get information about the token factory
 * @returns {Promise<Object>} Factory information
 */
export const getFactoryInfo = async () => {
  try {
    const response = await fetch(`${lf0gFactoryUrl}/factory-info`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch factory info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching factory info:', error);
    throw error;
  }
};

/**
 * Create a new token through lf0gFactory
 * @param {Object} tokenData - Token data
 * @param {string} tokenData.name - Token name
 * @param {string} tokenData.symbol - Token symbol
 * @param {string} tokenData.description - Token description (optional)
 * @param {string} tokenData.creatorAddress - Creator wallet address
 * @returns {Promise<Object>} Created token data
 */
export const createToken = async (tokenData) => {
  try {
    const response = await fetch(`${lf0gFactoryUrl}/create-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to create token';
      
      // Sprawdzanie konkretnych błędów z API i formatowanie przyjaznych komunikatów
      if (errorMessage.includes('Signer had insufficient balance')) {
        throw new Error('Insufficient funds in your wallet. Please add more 0G  to your wallet and try again.');
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}; 