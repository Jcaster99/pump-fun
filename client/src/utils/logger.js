/**
 * Logger Utility for Client
 * 
 * Provides conditional logging based on environment settings.
 * Only logs messages when REACT_APP_TEST is set to 'true'.
 * Errors are logged only in test mode as well.
 */

// Check if we're in test mode
const isTestMode = process.env.REACT_APP_TEST === 'true';

/**
 * Logger utility object
 */
const logger = {
  /**
   * Log message only in test mode
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (isTestMode) {
      console.log(...args);
    }
  },

  /**
   * Log warning message only in test mode
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (isTestMode) {
      console.warn(...args);
    }
  },

  /**
   * Log error message only in test mode
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    // Only log errors in test mode
    if (isTestMode) {
      console.error(...args);
    }
  },

  /**
   * Log debug message only in test mode
   * @param {string} message - Debug message
   * @param {Object} data - Optional data to log
   */
  debug: (message, data = null) => {
    if (isTestMode) {
      if (data) {
        console.log(`[DEBUG] ${message}`, data);
      } else {
        console.log(`[DEBUG] ${message}`);
      }
    }
  },

  /**
   * Get the test mode status
   * @returns {boolean} - True if REACT_APP_TEST=true
   */
  isTestMode: () => isTestMode
};

export default logger; 