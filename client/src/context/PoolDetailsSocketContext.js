import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { TRANSACTION_WEBSOCKET_URL } from '../utils/apiConfig';
import logger from '../utils/logger';

// Context init
const PoolDetailsSocketContext = createContext();

// Helper – shallow merge specific allowed keys only
const mergePoolData = (prev = {}, incoming = {}) => {
  const allowed = [
    'priceRealtime',
    'marketCap',
    'volume',
    'holders',
    'totalSupply',
    'totalSupplyTokenAMM',
    'transactions',
  ];
  const merged = { ...prev };
  allowed.forEach((k) => {
    if (incoming[k] !== undefined) {
      merged[k] = incoming[k];
    }
  });
  return merged;
};

export const PoolDetailsSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketConnectedRef = useRef(false);

  // { [address]: poolData }
  const [poolData, setPoolData] = useState({});
  const [activePoolAddress, setActivePoolAddress] = useState(null);
  const reconnectTimerRef = useRef(null);

  // -------------------- socket connection --------------------
  useEffect(() => {
    if (!TRANSACTION_WEBSOCKET_URL) {
      logger.error('[PoolWS] Missing WS URL');
      return;
    }

    const s = io(TRANSACTION_WEBSOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Default transports allow automatic fallback to polling if WebSocket blocked
    });

    const setOfflineFallback = () => {
      // If still offline after timeout we mark as disconnected; UI may poll REST then.
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (!socketConnectedRef.current) {
          logger.warn('[PoolWS] Still offline – clients may fall back to REST');
        }
      }, 10000);
    };

    s.on('connect', () => {
      logger.log('[PoolWS] Connected', s.id);
      socketConnectedRef.current = true;
      if (activePoolAddress) {
        s.emit('subscribe_pool', activePoolAddress);
      }
    });

    s.on('disconnect', (reason) => {
      logger.log('[PoolWS] Disconnected:', reason);
      socketConnectedRef.current = false;
      setOfflineFallback();
    });

    s.on('connect_error', (err) => {
      logger.error('[PoolWS] Connection error', err.message);
      socketConnectedRef.current = false;
      setOfflineFallback();
    });

    // Main bulk update (could be after subscribe or periodic)
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

    setSocket(s);

    return () => {
      if (activePoolAddress) s.emit('unsubscribe_pool', activePoolAddress);
      s.disconnect();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []); // run once

  // -------------- subscription helpers ----------------
  const subscribeToPool = React.useCallback((addr) => {
    if (!addr) return;
    if (addr === activePoolAddress) return; // already subscribed
    if (socket && socketConnectedRef.current) {
      if (activePoolAddress) socket.emit('unsubscribe_pool', activePoolAddress);
      socket.emit('subscribe_pool', addr);
    }
    setActivePoolAddress(addr);
  }, [socket, activePoolAddress]);

  const unsubscribeCurrent = React.useCallback(() => {
    if (socket && socketConnectedRef.current && activePoolAddress) {
      socket.emit('unsubscribe_pool', activePoolAddress);
    }
    setActivePoolAddress(null);
  }, [socket, activePoolAddress]);

  const getPoolData = React.useCallback((addr) => poolData[addr] || {}, [poolData]);

  const contextValue = React.useMemo(() => ({
    subscribeToPool,
    unsubscribeCurrent,
    getPoolData,
    poolData,
    activePoolAddress,
    isConnected: socketConnectedRef.current,
  }), [subscribeToPool, unsubscribeCurrent, getPoolData, poolData, activePoolAddress]);

  return (
    <PoolDetailsSocketContext.Provider
      value={contextValue}
    >
      {children}
    </PoolDetailsSocketContext.Provider>
  );
};

export const usePoolDetailsSocket = () => useContext(PoolDetailsSocketContext); 