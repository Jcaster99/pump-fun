const { getDbConnection } = require('../db/init');

class Comment {
  // Create a new comment
  static create(poolAddress, walletAddress, username, text) {
    const db = getDbConnection();
    
    try {
      // First get the pool ID based on token address
      const pool = db.prepare('SELECT id FROM pools WHERE token_address = ?').get(poolAddress);
      
      if (!pool) {
        db.close();
        throw new Error('Pool not found');
      }
      
      const result = db.prepare(`
        INSERT INTO comments (
          pool_id, wallet_address, username, text, created_at
        ) VALUES (?, ?, ?, ?, datetime('now'))
      `).run(pool.id, walletAddress, username, text);
      
      // Update comment count in the pool
      db.prepare('UPDATE pools SET replies = replies + 1 WHERE id = ?').run(pool.id);
      
      // Get the created comment
      const comment = db.prepare(`
        SELECT * FROM comments WHERE id = ?
      `).get(result.lastInsertRowid);
      
      db.close();
      return comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      db.close();
      throw error;
    }
  }
  
  // Get comments for a pool
  static getForPool(poolAddress, limit = 50, offset = 0) {
    const db = getDbConnection();
    
    try {
      // First get the pool ID based on token address
      const pool = db.prepare('SELECT id FROM pools WHERE token_address = ?').get(poolAddress);
      
      if (!pool) {
        db.close();
        throw new Error('Pool not found');
      }
      
      const comments = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
               (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND wallet_address = '') as is_liked
        FROM comments c
        WHERE c.pool_id = ?
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `).all(pool.id, limit, offset);
      
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM comments WHERE pool_id = ?
      `).get(pool.id);
      
      db.close();
      return {
        comments,
        totalCount: totalCount.count
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      db.close();
      throw error;
    }
  }
  
  // Like a comment
  static likeComment(commentId, walletAddress) {
    const db = getDbConnection();
    
    try {
      // Check if the user already liked this comment
      const existingLike = db.prepare(`
        SELECT * FROM comment_likes 
        WHERE comment_id = ? AND wallet_address = ?
      `).get(commentId, walletAddress);
      
      if (existingLike) {
        // Unlike
        db.prepare(`
          DELETE FROM comment_likes 
          WHERE comment_id = ? AND wallet_address = ?
        `).run(commentId, walletAddress);
      } else {
        // Like
        db.prepare(`
          INSERT INTO comment_likes (comment_id, wallet_address, created_at)
          VALUES (?, ?, datetime('now'))
        `).run(commentId, walletAddress);
      }
      
      // Get updated like count
      const likeCount = db.prepare(`
        SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?
      `).get(commentId);
      
      db.close();
      return {
        liked: !existingLike,
        likeCount: likeCount.count
      };
    } catch (error) {
      console.error('Error liking comment:', error);
      db.close();
      throw error;
    }
  }
}

module.exports = Comment; 