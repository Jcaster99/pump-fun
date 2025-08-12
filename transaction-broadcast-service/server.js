const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Wczytaj zmienne środowiskowe z pliku .env
const envPath = path.resolve(__dirname, '../.env');
console.log('[TransactionService] Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Alternatywna lokalizacja - w tym samym katalogu co skrypt
if (process.env.REACT_APP_TEST === undefined) {
  const localEnvPath = path.resolve(__dirname, '.env');
  console.log('[TransactionService] Trying local .env from:', localEnvPath);
  dotenv.config({ path: localEnvPath });
}

// Nadpisz metody konsoli na podstawie zmiennej środowiskowej REACT_APP_TEST
require('./consoleOverride');

// Ostatecznie sprawdź zmienne przekazane bezpośrednio do procesu
console.log('[TransactionService] Available environment variables:', 
  Object.keys(process.env)
    .filter(key => key.startsWith('REACT_'))
    .join(', '));

// Debugowanie - sprawdź wartość zmiennej środowiskowej
console.log('[TransactionService] REACT_APP_TEST=', process.env.REACT_APP_TEST);

// Sprawdź, czy jesteśmy w trybie testowym
const isTestMode = process.env.REACT_APP_TEST === 'true';
const isProduction = !isTestMode;

// Funkcja do logowania warunkowego
const logger = {
  log: (...args) => {
    if (isTestMode) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Błędy logujemy tylko w trybie testowym
    if (isTestMode) {
      console.error(...args);
    }
  }
};

// Wyświetl informację o trybie pracy
console.log(`[TransactionService] Running in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);

// Define allowed CORS origins based on environment variables
const allowedOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ['https://lf0g.fun', 'https://www.lf0g.fun', 'https://service.lf0g.fun', 'https://factory.lf0g.fun', 'https://broadcast.lf0g.fun', 'https://dexchecker.lf0g.fun', 'http://localhost:3000'];

// Diagnostyczny log pokazujący wartość CORS_ORIGINS
const originalConsole = require('./consoleOverride');
originalConsole.log(process.env.CORS_ORIGINS ? `CORS ACTIVATED!` : `CORS NOT WORKIN FR!`);

const app = express();
app.use(cors({
  origin: function(origin, callback) {
    // In test mode, allow requests from any origin
    if (isTestMode) {
      callback(null, true);
    } else {
      // In production, apply restrictive CORS policy
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 86400 // Cache CORS preflight requests for 24h
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // In test mode, allow requests from any origin
      if (isTestMode) {
        callback(null, true);
      } else {
        // In production, apply restrictive CORS policy
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory store per-pool latest data. Kept small – only last known snapshot & tx list (max 20)
const poolDataMap = {}; // { [address]: { ...data, transactions: [] } }

// Przechowywanie ostatnich transakcji
const recentTransactions = [];
const MAX_TRANSACTIONS = 10;

// Przechowywanie ostatnich poolów
const recentPools = [];
const MAX_POOLS = 10;

// -------- helper util ----------
const mergePoolData = (prev = {}, incoming = {}) => {
  return { ...prev, ...incoming };
};

// API endpoint do ręcznego wysyłania transakcji
app.use(express.json());

// ---- NEW: generic pool snapshot update ----
app.post('/api/pool-data-update', (req, res) => {
  const { poolAddress, ...payload } = req.body;
  if (!poolAddress) {
    return res.status(400).json({ success: false, error: 'poolAddress required' });
  }
  // merge & trim tx list if included
  const current = poolDataMap[poolAddress] || {};
  const merged = mergePoolData(current, payload);
  if (merged.transactions && merged.transactions.length > 20) {
    merged.transactions = merged.transactions.slice(0, 20);
  }
  poolDataMap[poolAddress] = merged;
  io.to(`pool_${poolAddress}`).emit('pool_data_update', { poolAddress, ...merged });
  res.json({ success: true });
});

// ---- NEW: single transaction push ----
app.post('/api/pool-transaction-update', (req, res) => {
  const { poolAddress, transaction } = req.body;
  if (!poolAddress || !transaction) {
    return res.status(400).json({ success: false, error: 'poolAddress and transaction required' });
  }
  const data = poolDataMap[poolAddress] || { transactions: [] };
  // prepend & dedupe
  const existing = data.transactions || [];
  const filtered = existing.filter((tx) => tx.tx_hash !== transaction.tx_hash);
  const newTxs = [transaction, ...filtered].slice(0, 20);
  poolDataMap[poolAddress] = { ...data, transactions: newTxs };
  io.to(`pool_${poolAddress}`).emit('pool_transaction_update', { poolAddress, transaction });
  res.json({ success: true });
});

app.post('/api/broadcast-transaction', (req, res) => {
  const transaction = req.body;
  
  logger.log('[TransactionService] Received transaction broadcast request');
  
  // Dodaj do historii
  recentTransactions.unshift(transaction);
  if (recentTransactions.length > MAX_TRANSACTIONS) {
    recentTransactions.pop();
  }
  
  // Wyślij do wszystkich klientów
  logger.log('[TransactionService] Broadcasting transaction to all clients');
  io.emit('new_transaction', transaction);
  
  res.json({ success: true });
});

// API endpoint do ręcznego wysyłania nowych poolów
app.post('/api/broadcast-pool', (req, res) => {
  const pool = req.body;
  
  logger.log('[TransactionService] Received pool broadcast request for:', pool.name || pool.symbol || 'unknown pool');
  
  // Dodaj do historii
  recentPools.unshift(pool);
  if (recentPools.length > MAX_POOLS) {
    recentPools.pop();
  }
  
  // Wyślij do wszystkich klientów
  const clientCount = io.engine.clientsCount;
  logger.log(`[TransactionService] Broadcasting pool to ${clientCount} connected clients`);
  io.emit('new_pool', pool);
  
  // Zapisz event do logów
  logger.log('[TransactionService] Pool broadcast event emitted successfully');
  
  res.json({ success: true });
});

// API endpoint do aktualizacji change_24h
app.post('/api/update-price-change', (req, res) => {
  const priceChangeData = req.body;
  
  logger.log('[TransactionService] Received price change update request for pool:', priceChangeData.poolId || 'unknown pool');
  
  // Broadcast do wszystkich klientów
  const clientCount = io.engine.clientsCount;
  logger.log(`[TransactionService] Broadcasting price change to ${clientCount} connected clients`);
  io.emit('price_change_update', priceChangeData);
  
  res.json({ success: true });
});

// Obsługa połączeń Socket.io
io.on('connection', (socket) => {
  logger.log('[TransactionService] Client connected:', socket.id);
  logger.log(`[TransactionService] Total connected clients: ${io.engine.clientsCount}`);
  
  // Wyślij ostatnie transakcje do nowego klienta
  if (recentTransactions.length > 0) {
    logger.log(`[TransactionService] Sending ${recentTransactions.length} recent transactions to client`);
    socket.emit('recent_transactions', recentTransactions);
  }
  
  // Wyślij ostatnie poole do nowego klienta
  if (recentPools.length > 0) {
    logger.log(`[TransactionService] Sending ${recentPools.length} recent pools to client`);
    socket.emit('recent_pools', recentPools);
  }
  
  // Obsługa nowych transakcji od klienta
  socket.on('broadcast_transaction', (transaction) => {
    logger.log('[TransactionService] Received transaction for broadcast from client');
    
    // Dodaj do historii
    recentTransactions.unshift(transaction);
    if (recentTransactions.length > MAX_TRANSACTIONS) {
      recentTransactions.pop();
    }
    
    // Broadcast do wszystkich klientów
    logger.log('[TransactionService] Broadcasting transaction to all clients');
    io.emit('new_transaction', transaction);
  });
  
  // Obsługa nowych poolów od klienta
  socket.on('broadcast_pool', (pool) => {
    logger.log('[TransactionService] Received pool for broadcast from client:', pool.name || pool.symbol || 'unknown pool');
    
    // Dodaj do historii
    recentPools.unshift(pool);
    if (recentPools.length > MAX_POOLS) {
      recentPools.pop();
    }
    
    // Broadcast do wszystkich klientów
    const clientCount = io.engine.clientsCount;
    logger.log(`[TransactionService] Broadcasting pool to ${clientCount} connected clients`);
    io.emit('new_pool', pool);
  });
  
  // Obsługa aktualizacji change_24h od klienta
  socket.on('broadcast_price_change', (priceChangeData) => {
    logger.log('[TransactionService] Received price change data for broadcast from client');
    
    // Broadcast do wszystkich klientów
    logger.log('[TransactionService] Broadcasting price change data to all clients');
    io.emit('price_change_update', priceChangeData);
  });
  
  // ---- NEW: room subscriptions ----
  socket.on('subscribe_pool', (addr) => {
    if (!addr) return;
    socket.join(`pool_${addr}`);
    logger.log('[TransactionService] socket', socket.id, 'joined room pool_', addr);
    if (poolDataMap[addr]) {
      socket.emit('pool_data_update', { poolAddress: addr, ...poolDataMap[addr] });
    }
  });

  socket.on('unsubscribe_pool', (addr) => {
    if (!addr) return;
    socket.leave(`pool_${addr}`);
    logger.log('[TransactionService] socket', socket.id, 'left room pool_', addr);
  });
  
  socket.on('disconnect', () => {
    logger.log('[TransactionService] Client disconnected:', socket.id);
    logger.log(`[TransactionService] Remaining connected clients: ${io.engine.clientsCount}`);
  });
});

// Dodaj endpoint healthcheck
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    clients: io.engine.clientsCount,
    recentTransactions: recentTransactions.length,
    recentPools: recentPools.length,
    mode: isTestMode ? 'test' : 'production'
  });
});

// Dodaj logowanie podczas startu
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  // Zawsze wyświetl podstawową informację o uruchomieniu
  console.log(`[TransactionService] Transaction broadcast service running on port ${PORT}`);
  // Szczegóły tylko w trybie test
  if (isTestMode) {
    console.log('[TransactionService] Ready to handle pools and transactions broadcasts');
  }
}); 