/**
 * Console Override Utility
 * 
 * This file overrides the default console methods to only output logs when
 * REACT_APP_TEST is set to 'true'. This helps prevent leaking sensitive information
 * in production environments while still allowing debugging in test/development.
 * 
 * Include this file early in your application startup.
 */

// Load environment variables
require('dotenv').config();

// Check if we're in test mode
const isTestMode = process.env.REACT_APP_TEST === 'true';

// For debugging - show the actual value of REACT_APP_TEST
const originalLog = console.log;
originalLog(`[consoleOverride] REACT_APP_TEST=${process.env.REACT_APP_TEST}, isTestMode=${isTestMode}`);

// Save original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
  table: console.table
};

// Override console methods
if (!isTestMode) {
  // In production mode, disable all console output
  console.log = function() {};
  console.warn = function() {};
  console.error = function() {};
  console.info = function() {};
  console.debug = function() {};
  console.table = function() {};
} 

// Export original methods (useful if you need to bypass the override in specific cases)
module.exports = originalConsole; 