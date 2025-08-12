const axios = require('axios');

// WebSocket broadcast service base URL from env or default
const WS_SERVICE_URL = process.env.TRANSACTION_WS_URL
  || process.env.REACT_APP_TRANSACTION_WEBSOCKET_URL
  || 'http://localhost:3005';

/**
 * Send HTTP POST to broadcast a single transaction for given pool.
 * @param {string} poolAddress
 * @param {object} transactionData - must be serializable JSON
 */
async function broadcastPoolTransaction(poolAddress, transactionData) {
  try {
    await axios.post(`${WS_SERVICE_URL}/api/pool-transaction-update`, {
      poolAddress,
      transaction: transactionData,
    }, {
      timeout: 3000,
    });
  } catch (err) {
    console.error('[wsBroadcaster] Failed to broadcast transaction', err.message);
  }
}

/**
 * Broadcast snapshot update for pool metrics (price, volume, etc.)
 * @param {string} poolAddress
 * @param {object} dataPartial - keys accepted by frontend (priceRealtime, marketCap, volume, holders, ...)
 */
async function broadcastPoolData(poolAddress, dataPartial) {
  try {
    await axios.post(`${WS_SERVICE_URL}/api/pool-data-update`, {
      poolAddress,
      ...dataPartial,
    }, { timeout: 3000 });
  } catch (err) {
    console.error('[wsBroadcaster] Failed to broadcast pool data', err.message);
  }
}

module.exports = {
  broadcastPoolTransaction,
  broadcastPoolData,
}; 