/**
 * Comment Controller
 * 
 * Handles all business logic related to comment functionality,
 * including retrieving, creating, and liking/unliking comments.
 * 
 * @module controllers/commentController
 */

const Comment = require('../models/comment');
const ethers = require('ethers');

/**
 * Get comments for a specific pool
 * 
 * @function getComments
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.address - Pool address to get comments for
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.limit=50] - Maximum number of comments to return
 * @param {number} [req.query.offset=0] - Number of comments to skip (for pagination)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with comments or error
 */
const getComments = (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Pool address is required'
      });
    }
    
    const result = Comment.getForPool(address, parseInt(limit), parseInt(offset));
    
    // Format timestamps
    const formattedComments = result.comments.map(comment => ({
      ...comment,
      isLiked: comment.is_liked > 0,
      likes: comment.like_count,
      // Format date for client-side display
      timestamp: comment.created_at
    }));
    
    res.status(200).json({
      success: true,
      data: formattedComments,
      pagination: {
        total: result.totalCount,
        offset: parseInt(offset),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting comments: ' + error.message
    });
  }
};

/**
 * Create a new comment for a pool
 * 
 * @function createComment
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.address - Pool address to comment on
 * @param {Object} req.body - Request body
 * @param {string} req.body.walletAddress - Commenter's wallet address
 * @param {string} req.body.username - Commenter's username
 * @param {string} req.body.text - Comment text content
 * @param {string} req.body.signature - Cryptographic signature
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created comment or error
 */
const createComment = (req, res) => {
  try {
    const { address } = req.params;
    const { walletAddress, username, text, signature } = req.body;
    
    if (!address || !walletAddress || !text || !username || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Pool address, wallet address, username, comment text, and signature are required'
      });
    }
    
    // Verify signature
    try {
      // Message format: "I am commenting on pool [address] with text: [commentText]"
      const message = `I am commenting on pool ${address} with text: ${text}`;
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      
      // Check if the recovered address matches the claimed address
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature'
        });
      }
    } catch (signatureError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature: ' + signatureError.message
      });
    }
    
    // Create the comment
    const comment = Comment.create(address, walletAddress, username, text);
    
    res.status(201).json({
      success: true,
      data: {
        id: comment.id,
        username: comment.username,
        text: comment.text,
        timestamp: comment.created_at,
        likes: 0,
        isLiked: false
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating comment: ' + error.message
    });
  }
};

/**
 * Like or unlike a comment
 * Toggles the like status if the user has already liked the comment
 * 
 * @function likeComment
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Comment ID to like/unlike
 * @param {Object} req.body - Request body
 * @param {string} req.body.walletAddress - User's wallet address
 * @param {string} req.body.signature - Cryptographic signature
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated like status or error
 */
const likeComment = (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress, signature } = req.body;
    
    if (!id || !walletAddress || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Comment ID, wallet address, and signature are required'
      });
    }
    
    // Verify signature
    try {
      // Message format: "I am liking comment [commentId]"
      const message = `I am liking comment ${id}`;
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      
      // Check if the recovered address matches the claimed address
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature'
        });
      }
    } catch (signatureError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature: ' + signatureError.message
      });
    }
    
    const result = Comment.likeComment(parseInt(id), walletAddress);
    
    res.status(200).json({
      success: true,
      data: {
        liked: result.liked,
        likeCount: result.likeCount
      }
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      error: 'Error liking comment: ' + error.message
    });
  }
};

module.exports = {
  getComments,
  createComment,
  likeComment
}; 