/**
 * Centralized API configuration
 * Exports URLs based on environment variables with fallbacks
 */

// Main API URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const lf0gFactoryUrl = process.env.REACT_APP_LF0G_FACTORY_URL || 'http://localhost:5005';
// Leaderboard service URL - commented out
// export const LEADERBOARD_URL = process.env.REACT_APP_LEADERBOARD_API_URL || 'http://localhost:3004';

// Blog service URL - removed

// Transaction WebSocket service URL
export const TRANSACTION_WEBSOCKET_URL = process.env.REACT_APP_TRANSACTION_WEBSOCKET_URL || 'http://localhost:3005';

// Export default object with all URLs
export default {
  API_URL,
  // LEADERBOARD_URL, // Commented out
  // BLOG_URL, // Removed
  TRANSACTION_WEBSOCKET_URL
}; 