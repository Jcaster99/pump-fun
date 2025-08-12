import { API_URL } from '../utils/apiConfig';

/**
 * Fetch comments for a pool
 * @param {string} poolAddress - The pool contract address
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of comments to fetch
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Object>} - Object containing array of comments and pagination data
 */
export const fetchComments = async (poolAddress, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  
  try {
    const response = await fetch(
      `${API_URL}/comments/pool/${poolAddress}?limit=${limit}&offset=${offset}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

/**
 * Create a new comment
 * @param {string} poolAddress - The pool contract address
 * @param {Object} commentData - The comment data
 * @param {string} commentData.walletAddress - Wallet address of the commenter
 * @param {string} commentData.username - Username of the commenter
 * @param {string} commentData.text - Comment text
 * @param {string} commentData.signature - Cryptographic signature of the comment
 * @returns {Promise<Object>} - The created comment
 */
export const createComment = async (poolAddress, commentData) => {
  try {
    const response = await fetch(`${API_URL}/comments/pool/${poolAddress}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create comment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

/**
 * Like or unlike a comment
 * @param {number} commentId - ID of the comment to like/unlike
 * @param {string} walletAddress - Wallet address of the user
 * @param {string} signature - Cryptographic signature
 * @returns {Promise<Object>} - Object containing liked status and like count
 */
export const likeComment = async (commentId, walletAddress, signature) => {
  try {
    const response = await fetch(`${API_URL}/comments/like/${commentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress, signature })
    });
    
    if (!response.ok) {
      throw new Error('Failed to like comment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
}; 