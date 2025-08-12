import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { TRANSACTION_WEBSOCKET_URL } from '../utils/apiConfig';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [lastTransaction, setLastTransaction] = useState(null);
  const [lastNewPool, setLastNewPool] = useState(null);
  const [socket, setSocket] = useState(null);
  const socketConnectedRef = useRef(false);

  // Inicjalizacja połączenia WebSocket przy uruchomieniu aplikacji
  useEffect(() => {
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Connecting to transaction service at:', TRANSACTION_WEBSOCKET_URL);
    }
    
    const newSocket = io(TRANSACTION_WEBSOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Connected to transaction broadcast service');
      }
      socketConnectedRef.current = true;
    });
    
    newSocket.on('disconnect', () => {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Disconnected from transaction broadcast service');
      }
      socketConnectedRef.current = false;
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      socketConnectedRef.current = false;
    });
    
    // Obsługa nowych transakcji
    newSocket.on('new_transaction', (transaction) => {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Received transaction notification:', transaction);
      }
      setLastTransaction(transaction);
    });
    
    // Obsługa nowych tokenów
    newSocket.on('new_pool', (pool) => {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Received new pool notification:', pool);
      }
      setLastNewPool(pool);
    });
    
    // Odbieranie historycznych transakcji
    newSocket.on('recent_transactions', (transactions) => {
      if (transactions && transactions.length > 0) {
        if (process.env.REACT_APP_TEST === 'true') {
          console.log('Received recent transactions:', transactions.length);
        }
        setLastTransaction(transactions[0]);
      }
    });
    
    // Odbieranie historycznych tokenów
    newSocket.on('recent_pools', (pools) => {
      if (pools && pools.length > 0) {
        if (process.env.REACT_APP_TEST === 'true') {
          console.log('Received recent pools:', pools.length);
        }
        setLastNewPool(pools[0]);
      }
    });
    
    setSocket(newSocket);
    
    // Czyszczenie przy odmontowaniu komponentu
    return () => {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Disconnecting from transaction service');
      }
      newSocket.disconnect();
    };
  }, []);
  
  // Funkcja do aktualizacji i rozgłaszania transakcji
  const updateLastTransaction = (transaction) => {
    // Walidacja transakcji
    if (!transaction) {
      console.error('Attempted to update with null transaction');
      return;
    }
    
    // Domyślnie ustaw status jeśli nie został podany
    if (!transaction.status) {
      transaction.status = 'success';
    }
    
    // Sprawdź czy typ transakcji jest prawidłowy
    const validTypes = ['buy', 'sell'];
    if (!validTypes.includes(transaction.type)) {
      if (process.env.REACT_APP_TEST === 'true') {
        console.warn(`Unknown transaction type: ${transaction.type}`);
      }
      return;
    }
    
    // Sprawdź czy transakcja zawiera contract_address
    // Jeśli nie, a mamy symbol, możemy spróbować go dodać w przyszłości
    // poprzez wyszukiwanie w bazie danych po symbolu
    
    // Dodaj timestamp jeśli jeszcze nie ma
    const transactionWithTimestamp = {
      ...transaction,
      timestamp: transaction.timestamp || new Date().toISOString()
    };
    
    // Aktualizuj lokalny stan
    setLastTransaction(transactionWithTimestamp);
    
    // Zapisz do localStorage dla trwałości między odświeżeniami
    localStorage.setItem('lastTransaction', JSON.stringify(transactionWithTimestamp));
    
    // Rozgłoś transakcję do wszystkich klientów przez WebSocket tylko jeśli jest w stanie success
    if (transaction.status === 'success' && socket && socketConnectedRef.current) {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Broadcasting transaction:', transactionWithTimestamp);
      }
      socket.emit('broadcast_transaction', transactionWithTimestamp);
    } else if (transaction.status !== 'success') {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log(`Not broadcasting ${transaction.status} transaction`);
      }
    } else if (!socket || !socketConnectedRef.current) {
      if (process.env.REACT_APP_TEST === 'true') {
        console.warn('Socket not connected, transaction not broadcasted');
      }
    }
  };
  
  // Funkcja do rozgłaszania nowych tokenów (podobna do updateLastTransaction)
  const broadcastNewPool = (poolData) => {
    if (!poolData) {
      console.error('Attempted to broadcast null pool data');
      return;
    }
    
    // Dodaj timestamp jeśli jeszcze nie ma
    const poolWithTimestamp = {
      ...poolData,
      timestamp: poolData.timestamp || new Date().toISOString()
    };
    
    // Aktualizuj lokalny stan
    setLastNewPool(poolWithTimestamp);
    
    // Rozgłoś informację o nowym tokenie do wszystkich klientów przez WebSocket
    if (socket && socketConnectedRef.current) {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Broadcasting new pool:', poolWithTimestamp);
      }
      socket.emit('broadcast_pool', poolWithTimestamp);
    } else if (!socket || !socketConnectedRef.current) {
      if (process.env.REACT_APP_TEST === 'true') {
        console.warn('Socket not connected, new pool not broadcasted');
      }
    }
  };
  
  return (
    <TransactionContext.Provider value={{ lastTransaction, lastNewPool, updateLastTransaction, broadcastNewPool }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => useContext(TransactionContext);

export default TransactionContext; 