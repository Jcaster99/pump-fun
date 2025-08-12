# Pool Metrics Real-time Broadcast System

## Architecture Overview

The system provides real-time updates for pool metrics (price, market cap, volume, etc.) and transactions using Socket.io to create a WebSocket connection between the client and a dedicated broadcast service.

### Components

1. **Transaction Broadcast Service** (`transaction-broadcast-service/server.js`)
   - Standalone Socket.io server on port 3005
   - Handles WebSocket connections and room-based subscriptions
   - Maintains in-memory pool data storage
   - Exposes HTTP API endpoints for updates

2. **Backend Broadcaster** (`server/src/utils/wsBroadcaster.js`)
   - Utility for API services to send updates to the broadcast service
   - Posts data via HTTP to the broadcast service endpoints

3. **Frontend Socket Context** (`client/src/context/PoolDetailsSocketContext.js`)
   - Manages WebSocket connection and subscription
   - Provides React context for consuming components
   - Handles connection errors and fallbacks

## Kluczowe Pliki Implementacji

### Backend
1. **`transaction-broadcast-service/server.js`**
   - Socket.io serwer obsługujący WebSocket komunikację
   - Endpointy HTTP REST dla broadcastów
   - In-memory data storage (poolDataMap)

2. **`server/src/utils/wsBroadcaster.js`**
   - Funkcje utility do wysyłania broadcastów
   - `broadcastPoolTransaction()` - transakcje
   - `broadcastPoolData()` - metryki (price, market cap, etc.)

3. **`server/src/controllers/transactionsController.js`**
   - Integracja z broadcast systemem w `recordTransaction()`
   - Wywołania `broadcastPoolTransaction()` i `broadcastPoolData()`
   - Przygotowanie payload'ów z danymi do transmisji

4. **`server/src/models/pool.js`**
   - Funkcja `updateAmmReserves()` obliczająca aktualne metryki
   - Zwraca dane używane do broadcastu (price_realtime, market_cap)

### Frontend
5. **`client/src/context/PoolDetailsSocketContext.js`**
   - Centralny kontekst do zarządzania połączeniem WebSocket
   - Provider komponent współdzielący dane pomiędzy komponentami
   - Subskrypcje i obsługa eventów Socket.io

6. **`client/src/pages/PoolDetailsPage/PoolDetailsPage.Logic.js`**
   - Komponent łączący dane z real-time pool data
   - `useEffect` obsługujący aktualizacje metryki
   - Konwersja danych z `priceRealtime` na `price_realtime` etc.

7. **`client/src/components/pools/PoolTransactionHistory/PoolTransactionHistory.Logic.js`**
   - Real-time wyświetlanie transakcji dla poola
   - Deduplikacja i sortowanie nowych transakcji

8. **`client/src/utils/apiConfig.js`**
   - Konfiguracja URL dla WebSocketu
   - Funkcja `deriveSocketUrl()` dynamicznie wykrywająca właściwy URL

## Kluczowe Fragmenty Kodu

### Transmisja danych (backend)

```javascript
// server/src/controllers/transactionsController.js (linie ~375-390)
if (ammResult) {
  const metricsPayload = {
    priceRealtime: ammResult.price_realtime,
    marketCap: ammResult.market_cap,
    volume: newVolume,
    totalSupplyTokenAMM: ammResult.total_supply_tokenAMM,
  };
  broadcastPoolData(pool.token_address, metricsPayload);
}
```

### HTTP POST do broadcast service

```javascript
// server/src/utils/wsBroadcaster.js (linie ~30-40)
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
```

### Socket.io broadcast

```javascript
// transaction-broadcast-service/server.js (linie ~60-65)
app.post('/api/pool-data-update', (req, res) => {
  const { poolAddress, ...payload } = req.body;
  // merge & store data
  const current = poolDataMap[poolAddress] || {};
  const merged = mergePoolData(current, payload);
  poolDataMap[poolAddress] = merged;
  // broadcast to subscribers
  io.to(`pool_${poolAddress}`).emit('pool_data_update', { poolAddress, ...merged });
  res.json({ success: true });
});
```

### Socket.io subscriptions

```javascript
// transaction-broadcast-service/server.js (linie ~140-150)
socket.on('subscribe_pool', (addr) => {
  if (!addr) return;
  socket.join(`pool_${addr}`);
  // Send cached data immediately if available
  if (poolDataMap[addr]) {
    socket.emit('pool_data_update', { poolAddress: addr, ...poolDataMap[addr] });
  }
});
```

### Frontend context provider socket initialization

```javascript
// client/src/context/PoolDetailsSocketContext.js (linie ~35-40)
const s = io(TRANSACTION_WEBSOCKET_URL, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  // Default transports allow automatic fallback to polling if WebSocket blocked
});
```

### Frontend data handling

```javascript
// client/src/pages/PoolDetailsPage/PoolDetailsPage.Logic.js (linie ~125-140)
useEffect(() => {
  if (!pool || !address) return;

  const rt = poolData[address] || getPoolData(address);
  if (!rt || Object.keys(rt).length === 0) return;

  setPool((prev) => {
    if (!prev) return prev;
    const merged = { ...prev };
    if (rt.priceRealtime !== undefined) merged.price_realtime = rt.priceRealtime;
    if (rt.marketCap !== undefined) merged.market_cap = rt.marketCap;
    if (rt.volume !== undefined) merged.volume_24h = rt.volume;
    if (rt.holders !== undefined) merged.holders = rt.holders;
    if (rt.totalSupply !== undefined) merged.total_supply = rt.totalSupply;
    if (rt.totalSupplyTokenAMM !== undefined) merged.total_supply_tokenAMM = rt.totalSupplyTokenAMM;
    return merged;
  });
}, [poolData, address, pool]);
```

## Data Flow

1. **Transaction Flow**:
   ```
   User transaction → API controller → DB update → WS broadcast → Socket.io → Client updates
   ```

2. **Subscription Flow**:
   ```
   Client visits pool details → Connect to Socket.io → Subscribe to pool room → Receive updates
   ```

## Server Implementation

### Transaction Broadcast Service

The standalone service (`transaction-broadcast-service/server.js`) manages Socket.io connections and provides HTTP endpoints:

#### HTTP Endpoints:

- `/api/pool-data-update` - Updates pool metrics (price, market cap, etc.)
  ```javascript
  app.post('/api/pool-data-update', (req, res) => {
    const { poolAddress, ...payload } = req.body;
    // merge & store data
    const current = poolDataMap[poolAddress] || {};
    const merged = mergePoolData(current, payload);
    poolDataMap[poolAddress] = merged;
    // broadcast to subscribers
    io.to(`pool_${poolAddress}`).emit('pool_data_update', { poolAddress, ...merged });
    res.json({ success: true });
  });
  ```

- `/api/pool-transaction-update` - Broadcasts a single transaction
  ```javascript
  app.post('/api/pool-transaction-update', (req, res) => {
    const { poolAddress, transaction } = req.body;
    // store and dedupe
    const data = poolDataMap[poolAddress] || { transactions: [] };
    const existing = data.transactions || [];
    const filtered = existing.filter((tx) => tx.tx_hash !== transaction.tx_hash);
    const newTxs = [transaction, ...filtered].slice(0, 20);
    poolDataMap[poolAddress] = { ...data, transactions: newTxs };
    // broadcast
    io.to(`pool_${poolAddress}`).emit('pool_transaction_update', { poolAddress, transaction });
    res.json({ success: true });
  });
  ```

- `/api/broadcast-transaction` - Global transaction notification (header)
- `/api/broadcast-pool` - Broadcasts new pool creation
- `/api/update-price-change` - Updates price change percentage

#### Socket.io Event Handlers:

- `connection` - New client connects
  ```javascript
  io.on('connection', (socket) => {
    logger.log('[TransactionService] Client connected:', socket.id);
    // Send history on connect
    if (recentTransactions.length > 0) {
      socket.emit('recent_transactions', recentTransactions);
    }
    if (recentPools.length > 0) {
      socket.emit('recent_pools', recentPools);
    }
    // ...other handlers
  });
  ```

- `subscribe_pool` - Client subscribes to pool-specific updates
  ```javascript
  socket.on('subscribe_pool', (addr) => {
    if (!addr) return;
    socket.join(`pool_${addr}`);
    // Send cached data immediately if available
    if (poolDataMap[addr]) {
      socket.emit('pool_data_update', { poolAddress: addr, ...poolDataMap[addr] });
    }
  });
  ```

- `unsubscribe_pool` - Client leaves a pool room
  ```javascript
  socket.on('unsubscribe_pool', (addr) => {
    if (!addr) return;
    socket.leave(`pool_${addr}`);
  });
  ```

- `pool_data_update` - Emitted when pool metrics change
- `pool_transaction_update` - Emitted when new transaction is recorded

#### In-memory Data Storage:

```javascript
// In-memory store for pool data
const poolDataMap = {}; // { [address]: { ...data, transactions: [] } }

// Recent transactions and pools storage
const recentTransactions = [];
const MAX_TRANSACTIONS = 10;
const recentPools = [];
const MAX_POOLS = 10;
```

### Backend Integration

When a transaction is recorded in `server/src/controllers/transactionsController.js`:

```javascript
try {
  // Push transaction
  const broadcastTx = {
    wallet_address: walletAddress,
    contract_address: pool.token_address,
    tx_hash: txHash,
    type,
    token_amount: tokenAmountStr,
    usdt_amount: usdtAmountStr,
    symbol: pool.symbol,
    timestamp: new Date().toISOString(),
  };
  broadcastPoolTransaction(pool.token_address, broadcastTx);

  // Push metrics
  if (ammResult) {
    const metricsPayload = {
      priceRealtime: ammResult.price_realtime,
      marketCap: ammResult.market_cap,
      volume: newVolume,
      totalSupplyTokenAMM: ammResult.total_supply_tokenAMM,
    };
    broadcastPoolData(pool.token_address, metricsPayload);
  }
} catch (broadcastErr) {
  console.error('Broadcast error:', broadcastErr.message);
}
```

The `wsBroadcaster.js` utility sends HTTP POST requests to the broadcast service:

```javascript
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
```

## Frontend Implementation

### Socket Context Provider

Manages WebSocket connection lifecycle and data in `client/src/context/PoolDetailsSocketContext.js`:

```javascript
const s = io(TRANSACTION_WEBSOCKET_URL, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Subscribe to pool
const subscribeToPool = React.useCallback((addr) => {
  if (!addr) return;
  if (addr === activePoolAddress) return; // already subscribed
  if (socket && socketConnectedRef.current) {
    if (activePoolAddress) socket.emit('unsubscribe_pool', activePoolAddress);
    socket.emit('subscribe_pool', addr);
  }
  setActivePoolAddress(addr);
}, [socket, activePoolAddress]);

// Handle data updates
s.on('pool_data_update', (data) => {
  if (!data || !data.poolAddress) return;
  setPoolData((prev) => ({
    ...prev,
    [data.poolAddress]: mergePoolData(prev[data.poolAddress], data),
  }));
});

// Single transaction push
s.on('pool_transaction_update', ({ poolAddress, transaction }) => {
  if (!poolAddress || !transaction) return;
  setPoolData((prev) => {
    const current = prev[poolAddress] || {};
    const currentTx = current.transactions || [];
    // deduplicate by tx_hash
    if (currentTx.some((tx) => tx.tx_hash === transaction.tx_hash)) {
      return prev;
    }
    const updated = {
      ...current,
      transactions: [transaction, ...currentTx].slice(0, 20),
    };
    return { ...prev, [poolAddress]: updated };
  });
});
```

### Consuming Components

Pool Details Page (`client/src/pages/PoolDetailsPage/PoolDetailsPage.Logic.js`) merges real-time data:

```javascript
useEffect(() => {
  if (!pool || !address) return;
  
  const rt = poolData[address] || getPoolData(address);
  if (!rt || Object.keys(rt).length === 0) return;
  
  setPool((prev) => {
    if (!prev) return prev;
    const merged = { ...prev };
    if (rt.priceRealtime !== undefined) merged.price_realtime = rt.priceRealtime;
    if (rt.marketCap !== undefined) merged.market_cap = rt.marketCap;
    if (rt.volume !== undefined) merged.volume_24h = rt.volume;
    if (rt.holders !== undefined) merged.holders = rt.holders;
    if (rt.totalSupply !== undefined) merged.total_supply = rt.totalSupply;
    if (rt.totalSupplyTokenAMM !== undefined) merged.total_supply_tokenAMM = rt.totalSupplyTokenAMM;
    return merged;
  });
}, [poolData, address, pool]);
```

Transaction History Component (`client/src/components/pools/PoolTransactionHistory/PoolTransactionHistory.Logic.js`) listens for new transactions:

```javascript
useEffect(() => {
  if (!poolAddress) return;
  const rt = poolData[poolAddress] || getPoolData(poolAddress);
  if (!rt || !rt.transactions) return;
  if (rt.transactions.length === 0) return;

  setTransactions((prev) => {
    const seen = new Set(prev.map((tx) => tx.tx_hash));
    const fresh = rt.transactions.filter((tx) => !seen.has(tx.tx_hash));
    if (fresh.length === 0) return prev;
    // prepend and limit 20
    return [...fresh, ...prev].slice(0, 20);
  });
}, [poolData, poolAddress]);
```

## Real-time Metrics Supported

| Frontend Key | Backend Key | Description |
|--------------|-------------|-------------|
| priceRealtime | price_realtime | Current token price |
| marketCap | market_cap | Total market capitalization |
| volume | volume_24h | 24-hour trading volume |
| totalSupplyTokenAMM | total_supply_tokenAMM | AMM token supply |
| holders | holders | Number of token holders |
| transactions | - | Recent transactions list |

## Fallback Mechanism

The system includes a fallback to REST API when WebSocket is unavailable:

1. WebSocket connection errors are logged
   ```javascript
   s.on('connect_error', (err) => {
     logger.error('[PoolWS] Connection error', err.message);
     socketConnectedRef.current = false;
     setOfflineFallback();
   });
   ```

2. Timeouts trigger "offline" mode after 10 seconds
   ```javascript
   const setOfflineFallback = () => {
     if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
     reconnectTimerRef.current = setTimeout(() => {
       if (!socketConnectedRef.current) {
         logger.warn('[PoolWS] Still offline – clients may fall back to REST');
       }
     }, 10000);
   };
   ```

3. UI falls back to polling API endpoints (handled by components)

## Security and Performance Considerations

- Socket.io automatically handles reconnection with backoff strategy
- Connection drops gracefully fall back to HTTP polling through Socket.io's transport mechanism
- Room-based subscriptions ensure clients only receive relevant data
- In-memory pool data caching reduces database load
- HTTP timeouts prevent hanging requests (3000ms timeout on broadcasts)
- CORS configuration restricts access to allowed origins:
  ```javascript
  app.use(cors({
    origin: ["https://lf0g.fun", "https://www.lf0g.fun", "http://localhost:3000"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));
  ```

## Deployment Considerations

- The transaction broadcast service should be run as a separate process
- The service uses port 3005 by default but can be configured via environment variables
- Environment-specific settings are respected through dotenv configuration:
  ```javascript
  const isProduction = process.env.REACT_APP_PRODUCTION === 'true';
  ```
- Production logging is reduced to minimize output 