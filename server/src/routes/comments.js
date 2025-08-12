const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// GET /api/comments/pool/:address - Get comments for a pool
router.get('/pool/:address', commentController.getComments);

// POST /api/comments/pool/:address - Create a new comment for a pool
router.post('/pool/:address', commentController.createComment);

// POST /api/comments/like/:id - Like/unlike a comment
router.post('/like/:id', commentController.likeComment);

module.exports = router; 