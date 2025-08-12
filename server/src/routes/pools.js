/**
 * Pool Routes
 * 
 * This module defines all API routes related to liquidity pools.
 * It includes endpoints for creating, retrieving, and searching pools,
 * as well as handling image uploads for pool logos.
 * 
 * @module routes/pools
 */

const express = require('express');
const router = express.Router();
const poolController = require('../controllers/poolController');
const holderController = require('../controllers/holderController');
const priceHistoryController = require('../controllers/priceHistoryController');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');

/**
 * Create upload directory if it doesn't exist
 * This ensures the application can store uploaded pool images
 */
const uploadDir = path.join(__dirname, '../../uploads/pool-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Generates a secure filename for uploaded images
 * Prevents path traversal attacks and filename collisions
 * 
 * @param {string} originalName - Original filename from the upload
 * @returns {string} A secure randomized filename with original extension
 */
const generateSafeFilename = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const randomName = crypto.randomBytes(16).toString('hex');
  return `pool-${randomName}${ext}`;
};

/**
 * Configure multer storage for image uploads
 * Defines where files will be stored and how they'll be named
 */
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, generateSafeFilename(file.originalname));
  }
});

/**
 * Allowed file types for security
 * Restricts uploads to only image formats to prevent malicious file uploads
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * File filter for upload validation
 * Ensures only permitted image types can be uploaded
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - Uploaded file information
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Niedozwolony typ pliku. Akceptowane są tylko obrazy JPEG, PNG, GIF i WebP.'), false);
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Niedozwolone rozszerzenie pliku. Akceptowane są tylko .jpg, .jpeg, .png, .gif i .webp.'), false);
  }
  
  // File passed validation
  cb(null, true);
};

/**
 * Configure Multer upload middleware
 * Sets storage, file size limits, and validation
 */
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024, // 500KB limit
  },
  fileFilter: fileFilter
});

/**
 * Image processing middleware
 * Resizes images and validates they are valid image files
 * Prevents malicious file uploads disguised as images
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const processImage = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    // Get image metadata
    let metadata;
    try {
      metadata = await sharp(req.file.path).metadata();
    } catch (error) {
      console.error('Błąd odczytu metadanych obrazu:', error);
      return next(new Error('Przesłany plik nie jest prawidłowym obrazem lub jest uszkodzony.'));
    }
    
    // Verify it's a valid image
    if (!metadata.width || !metadata.height) {
      return next(new Error('Przesłany plik nie jest prawidłowym obrazem.'));
    }
    
    try {
      // Create new filename for processed image
      const extname = path.extname(req.file.path);
      const basename = path.basename(req.file.path, extname);
      const processedFilename = `${basename}-processed${extname}`;
      const processedPath = path.join(uploadDir, processedFilename);
      
      // Resize image to max 256x256 while maintaining aspect ratio
      await sharp(req.file.path)
        .resize({
          width: 256,
          height: 256,
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .toFile(processedPath);
      
      // Store original path and update path to processed image
      req.file.originalPath = req.file.path;
      req.file.path = processedPath;
      req.file.filename = processedFilename; // Important - update filename
      
      next();
    } catch (error) {
      console.error('Błąd przetwarzania obrazu:', error);
      next(new Error('Błąd podczas przetwarzania obrazu. Upewnij się, że przesyłasz prawidłowy plik graficzny.'));
    }
  } catch (error) {
    console.error('Błąd przetwarzania obrazu:', error);
    next(new Error('Błąd podczas przetwarzania obrazu. Upewnij się, że przesyłasz prawidłowy plik graficzny.'));
  }
};

/**
 * @route GET /api/pools
 * @description Get all pools with optional filtering and pagination
 * @access Public
 */
router.get('/', poolController.getPools);

/**
 * @route GET /api/pools/trending
 * @description Get trending pools based on recent activity
 * @access Public
 */
router.get('/trending', poolController.getTrendingPools);

/**
 * @route GET /api/pools/top-gravity
 * @description Get top pools ranked by Gravity Score metric
 * @access Public
 */
router.get('/top-gravity', poolController.getTopByGravityScore);

/**
 * @route GET /api/pools/search
 * @description Search pools by name, symbol, or address
 * @param {string} q - Query string
 * @access Public
 */
router.get('/search', poolController.searchPools);

/**
 * @route GET /api/pools/creator/:address
 * @description Get all pools created by a specific wallet address
 * @param {string} address - Creator's wallet address
 * @access Public
 */
router.get('/creator/:address', poolController.getPoolsByCreator);

/**
 * @route GET /api/pools/admin/initialize-price-history
 * @description Admin endpoint to initialize price history data
 * @access Private (should be protected in production)
 */
router.get('/admin/initialize-price-history', poolController.initializePriceHistory);

/**
 * @route GET /api/pools/admin/update-holders
 * @description Admin endpoint to update holder data for all pools or a specific pool
 * @access Private (should be protected in production)
 */
router.get('/admin/update-holders', async (req, res) => {
  try {
    const { poolId } = req.query;
    
    // Import the utility function
    const { updateAllHolderData } = require('../utils/updateHolders');
    
    // Run the update with optional poolId
    const result = await updateAllHolderData(poolId ? parseInt(poolId) : null);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in admin holder update route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/pools/admin/update-bonding-curve-percentages
 * @description Admin endpoint to update bonding curve percentages for all pools
 * @access Private (should be protected in production)
 */
router.get('/admin/update-bonding-curve-percentages', async (req, res) => {
  try {
    // Import the Pool model
    const Pool = require('../models/pool');
    
    // Run the update for all pools
    const result = Pool.updateAllBondingCurvePercentages();
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating bonding curve percentages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/pools
 * @description Create a new pool with optional image upload
 * @access Public - but should have rate limiting in production
 */
router.post('/', upload.single('image'), processImage, poolController.createPool);

/**
 * @route GET /api/pools/:address/price-history
 * @description Get historical price data for a specific pool
 * @param {string} address - Pool contract address
 * @access Public
 */
router.get('/:address/price-history', priceHistoryController.getPriceHistory);

/**
 * @route GET /api/pools/:address/holders
 * @description Get holder distribution data for a specific pool
 * @param {string} address - Pool contract address
 * @access Public
 */
router.get('/:address/holders', holderController.getHolderDistribution);

/**
 * @route GET /api/pools/:address/holders/list
 * @description Get detailed list of all holders for a specific pool
 * @param {string} address - Pool contract address
 * @access Public
 */
router.get('/:address/holders/list', holderController.getPoolHolders);

/**
 * @route GET /api/pools/:address
 * @description Get detailed information about a specific pool by address
 * @param {string} address - Pool contract address
 * @access Public
 */
router.get('/:address', poolController.getPoolByAddress);

/**
 * @route POST /api/pools/:address/graduate
 * @description Graduate a token from bonding curve to liquidity pool
 * @param {string} address - Token contract address
 * @access Private - Creator only (though validation is disabled for testing)
 */
router.post('/:address/graduate', poolController.graduatePoolToken);

module.exports = router; 