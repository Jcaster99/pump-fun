/**
 * Test script for logger utility in client
 * 
 * This script demonstrates the conditional logging behavior
 * based on the REACT_APP_TEST environment variable.
 * 
 * Run with:
 * - Test mode: REACT_APP_TEST=true npm run test-logger
 * - Production mode: REACT_APP_TEST=false npm run test-logger
 */

import logger from './logger';

// Check the test mode flag value
const isTestMode = process.env.REACT_APP_TEST === 'true';
console.log(`Current environment: ${isTestMode ? 'TEST' : 'PRODUCTION'}`);
console.log(`REACT_APP_TEST=${process.env.REACT_APP_TEST}`);
console.log('------------------------');

// Demonstrate different logging behaviors
console.log('Starting logger test for client...');

// Regular logs (only in test mode)
logger.log('This is a regular log message - should only appear in test mode');

// Warning logs (only in test mode)
logger.warn('This is a warning message - should only appear in test mode');

// Error logs (always appear)
logger.error('This is an error message - should appear in both test and production modes');

// Debug logs with data (only in test mode)
logger.debug('This is a debug message with data', { 
  userId: 42,
  address: '0x1234567890123456789012345678901234567890',
  timestamp: new Date().toISOString()
});
logger.debug('This is a debug message without data');

console.log('------------------------');
console.log('Logger test completed');

// Export a simple function to allow this to be run from package.json scripts
export const runTest = () => {
  if (process.env.REACT_APP_TEST === 'true') {
    console.log('Logger test executed via runTest()');
  }
}; 