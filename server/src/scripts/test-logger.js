/**
 * Test script for logger utility
 * 
 * This script demonstrates the conditional logging behavior
 * based on the REACT_APP_TEST environment variable.
 * 
 * Run with:
 * - Test mode: REACT_APP_TEST=true node test-logger.js
 * - Production mode: REACT_APP_TEST=false node test-logger.js
 */

const logger = require('../utils/logger');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check the test mode flag value
const isTestMode = process.env.REACT_APP_TEST === 'true';
console.log(`Current environment: ${isTestMode ? 'TEST' : 'PRODUCTION'}`);
console.log(`REACT_APP_TEST=${process.env.REACT_APP_TEST}`);
console.log('------------------------');

// Demonstrate different logging behaviors
console.log('Starting logger test...');

// Regular logs (only in test mode)
logger.log('This is a regular log message - should only appear in test mode');

// Warning logs (only in test mode)
logger.warn('This is a warning message - should only appear in test mode');

// Error logs (always appear)
logger.error('This is an error message - should appear in both test and production modes');

// Debug logs with data (only in test mode)
logger.debug('This is a debug message with data', { foo: 'bar', count: 42 });
logger.debug('This is a debug message without data');

console.log('------------------------');
console.log('Logger test completed'); 