/**
 * Main Server Application
 * 
 * This is the main entry point for the lf0g.fun API server.
 * It handles setting up the Express server, middleware, routes,
 * and database connections.
 * 
 * @module server
 * @author lf0g.fun Team
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Override console methods based on REACT_APP_TEST environment variable
require('./utils/consoleOverride');

// Security middleware
// const { standardLimiter, authLimiter, createLimiter } = require('./middleware/rateLimit');
const { verifyToken } = require('./middleware/auth');
const logger = require('./utils/logger');

/**
 * Import route handlers for different API endpoints
 * Each route file contains handlers for a specific resource
 */
const poolRoutes = require('./routes/pools');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');
const transactionsRoutes = require('./routes/transactions');
const ratingsRoutes = require('./routes/ratings');
const gravityScoreRoutes = require('./routes/gravityScore');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy configuration for proper rate-limiter functionality with X-Forwarded-For header
// 1 means we trust the first proxy in front of our application
// app.set('trust proxy', 1);

/**
 * Define allowed CORS origins based on environment variables
 * This helps prevent unauthorized cross-origin requests in production
 * while allowing flexibility during development
 */
const allowedOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ['https://lf0g.fun', 'https://www.lf0g.fun', 'http://localhost:3000'];

// Diagnostyczny log pokazujący wartość CORS_ORIGINS
const originalConsole = require('./utils/consoleOverride');
originalConsole.log(process.env.CORS_ORIGINS ? `CORS ACTIVATED!` : `CORS NOT WORKIN FR!`);

/**
 * Initialize the database connection and schema
 * This ensures tables are created and migrations are applied
 */
const { initializeDatabase } = require('./db/init');
initializeDatabase();

// Add security headers via helmet middleware
app.use(helmet());

/**
 * Configure CORS based on the environment
 * - Test Mode (REACT_APP_TEST=true): Allow all origins for easier local testing
 * - Production/Default: Strict CORS policy with specific allowed origins
 */
const isTestMode = process.env.REACT_APP_TEST === 'true';

app.use(cors({
  origin: function(origin, callback) {
    // In test mode, allow requests without origin (e.g., from Postman, curl, etc.)
    // and requests from any environment
    if (isTestMode) {
      // During test mode, allow all requests
      callback(null, true);
    } else {
      // In production or when not in test mode, apply restrictive CORS policy
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies
  maxAge: 86400 // Cache CORS preflight requests for 24h
}));

/**
 * Configure JSON parsing middleware with size limit
 * This helps prevent potential DoS attacks via large JSON payloads
 */
app.use(express.json({ limit: '1mb' }));

/**
 * Rate limiting middleware (currently disabled)
 * Uncomment for production use to prevent API abuse
 */
// app.use(standardLimiter);

/**
 * Static file serving configuration
 * Carefully restricted to only serve pool images from specific directory
 * to prevent directory traversal vulnerabilities
 */
app.use('/uploads/pool-images', express.static(path.join(__dirname, '../uploads/pool-images')));

/**
 * API Routes Configuration
 * Each resource has its own dedicated router with appropriate security
 */

/**
 * User routes - handles authentication, registration, and user management
 * Should have stricter rate limiting in production
 */
// app.use('/api/users', authLimiter, userRoutes);
app.use('/api/users', userRoutes);

/**
 * Pool routes - handles CRUD operations for liquidity pools
 * Should have creation rate limiting in production
 */
// app.use('/api/pools', createLimiter, poolRoutes);
app.use('/api/pools', poolRoutes);

/**
 * Transaction routes - handles recording and retrieving blockchain transactions
 */
app.use('/api/transactions', transactionsRoutes);

/**
 * Rating routes - handles the gravity voting system for pools
 */
app.use('/api/ratings', ratingsRoutes);

/**
 * Gravity Score routes - handles gravity score calculations and retrieval
 */
app.use('/api/gravity-score', gravityScoreRoutes);

/**
 * AMM routes - handles Automated Market Maker functionality
 */
// Removed: app.use('/api/amm', ammRoutes);

/**
 * Comment routes - handles comments for pools
 * Authentication now happens via signature verification in the controller
 */
app.use('/api/comments', commentRoutes);

/**
 * Health check endpoint
 * Used for monitoring and service availability checks
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'lf0g.fun API is running' });
});

/**
 * Global error handling middleware
 * Catches all unhandled errors and provides appropriate response
 * Avoids leaking sensitive error details in production
 */
app.use((err, req, res, next) => {
  logger.error('Application error:', err);
  
  // Don't reveal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction ? 'Server error occurred' : err.message;
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: errorMessage
  });
});

/**
 * 404 handler for non-existent routes
 * Provides consistent response for invalid API endpoints
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false, 
    message: 'API endpoint does not exist'
  });
});

/**
 * Start the Express server
 * Log the port for debugging purposes
 */
app.listen(PORT, () => {
  // Always show the server start message, but additional details only in development
  logger.log(`Server running on port ${PORT}`);
  logger.debug('Server initialization complete, all routes and middleware configured');
}); 