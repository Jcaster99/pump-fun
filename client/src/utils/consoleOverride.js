/**
 * Console Override Utility for Client
 * 
 * This file overrides the default console methods to only output logs when
 * REACT_APP_TEST is set to 'true'. This helps prevent leaking sensitive information
 * in production environments while still allowing debugging in development.
 * 
 * Import this file early in your application startup.
 */

// Check if we're in test mode
const isTestMode = process.env.REACT_APP_TEST === 'true';

// Save original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
  table: console.table
};

// For debugging - show the actual value of REACT_APP_TEST
originalConsole.log(`[consoleOverride] REACT_APP_TEST=${process.env.REACT_APP_TEST}, isTestMode=${isTestMode}`);

// Log cool ASCII art
originalConsole.log(`
╭──────────────────────────────╮
│    🪄  L F 0 G  –  O D E     │
╰──────────────────────────────╯
0G, Zer0 DEX, lf0g takes flight,
Memecoins on a mission, liquidity light.
The curve climbs wild—75 %? *Ping!*—
Graduation unlocked, LP pools sing.

AI lifeguards shuffle the splash,
Front-run bots face-plant and crash.
Digging for loopholes? Beware the stare:
the logger sees all, your stack lays bare.

// Ctrl-C to bail out,
// Ctrl-V to splash clout.
// HODL your bananas, apes,
// and may your candles stay green! 🕯️🚀
`);

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
export default originalConsole; 