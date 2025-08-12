/**
 * Gravity Score API Routes
 * 
 * API endpoints for retrieving and managing gravity scores
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const GravityScore = require('../models/gravityScore');
const Pool = require('../models/pool');

/**
 * @route   GET /api/gravity-score/pool/:poolId
 * @desc    Get the latest gravity score details for a specific pool
 * @access  Public
 */
router.get('/pool/:poolId', async (req, res) => {
  try {
    const poolId = parseInt(req.params.poolId);
    
    if (isNaN(poolId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid pool ID format' 
      });
    }
    
    // Check if pool exists
    const pool = Pool.getById(poolId);
    if (!pool) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pool not found' 
      });
    }
    
    // Get gravity score details
    const scoreDetails = GravityScore.getLatestForPool(poolId);
    
    if (!scoreDetails) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gravity score not found for this pool' 
      });
    }
    
    return res.status(200).json({
      success: true,
      gravityScore: scoreDetails
    });
  } catch (error) {
    console.error('Error fetching gravity score:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving gravity score' 
    });
  }
});

/**
 * @route   GET /api/gravity-score/pool/:poolId/history
 * @desc    Get historical gravity scores for a specific pool
 * @access  Public
 */
router.get('/pool/:poolId/history', async (req, res) => {
  try {
    const poolId = parseInt(req.params.poolId);
    const limit = parseInt(req.query.limit) || 30;
    
    if (isNaN(poolId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid pool ID format' 
      });
    }
    
    // Check if pool exists
    const pool = Pool.getById(poolId);
    if (!pool) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pool not found' 
      });
    }
    
    // Get gravity score history
    const scoreHistory = GravityScore.getHistoryForPool(poolId, limit);
    
    return res.status(200).json({
      success: true,
      history: scoreHistory
    });
  } catch (error) {
    console.error('Error fetching gravity score history:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving gravity score history' 
    });
  }
});

/**
 * @route   GET /api/gravity-score/top
 * @desc    Get pools with highest gravity scores
 * @access  Public
 */
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // This endpoint will use the pool model to get the pools
    // sorted by gravity_score
    const topPools = Pool.getAll(limit, 'gravity_score', 'DESC', 1);
    
    return res.status(200).json({
      success: true,
      count: topPools.length,
      pools: topPools
    });
  } catch (error) {
    console.error('Error fetching top gravity score pools:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving top gravity score pools' 
    });
  }
});

/**
 * @route   POST /api/gravity-score/recalculate/:poolId
 * @desc    Force recalculation of gravity score for a specific pool
 * @access  Admin
 */
router.post('/recalculate/:poolId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin (simplified - in real app would check user role)
    // This is a placeholder for proper admin role check
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Admin access required' 
      });
    }
    
    const poolId = parseInt(req.params.poolId);
    
    if (isNaN(poolId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid pool ID format' 
      });
    }
    
    // Check if pool exists
    const pool = Pool.getById(poolId);
    if (!pool) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pool not found' 
      });
    }
    
    // Recalculate gravity score
    const finalScore = await GravityScore.calculateForPool(poolId);
    
    return res.status(200).json({
      success: true,
      message: 'Gravity score recalculated successfully',
      gravityScore: finalScore
    });
  } catch (error) {
    console.error('Error recalculating gravity score:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during gravity score recalculation' 
    });
  }
});

/**
 * @route   POST /api/gravity-score/update-all
 * @desc    Trigger update of all gravity scores
 * @access  Admin
 */
router.post('/update-all', verifyToken, async (req, res) => {
  try {
    // Check if user is admin (simplified - in real app would check user role)
    // This is a placeholder for proper admin role check
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Admin access required' 
      });
    }
    
    // Queue the update as a background job to avoid timeout
    // In a real implementation, this would use a job queue system
    res.status(200).json({
      success: true,
      message: 'Gravity score update initiated'
    });
    
    // Run the update after response is sent
    const { main } = require('../scripts/updateGravityScore');
    main().catch(error => {
      console.error('Error in manual gravity score update:', error);
    });
  } catch (error) {
    console.error('Error triggering gravity score update:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error triggering gravity score update' 
    });
  }
});

module.exports = router; 