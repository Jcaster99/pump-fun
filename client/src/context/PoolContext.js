import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { TRANSACTION_WEBSOCKET_URL } from '../utils/apiConfig';
import { fetchNewestPools } from '../api/poolsApi';
import logger from '../utils/logger';

const PoolContext = createContext();

export const PoolProvider = ({ children }) => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [recentlyAddedPoolId, setRecentlyAddedPoolId] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 50
  });
  const socketConnectedRef = useRef(false);
  
  // Inicjalne pobranie poolów
  useEffect(() => {
    const loadPools = async () => {
      try {
        logger.log(`[PoolContext] Loading pools with sortBy=${sortBy}, order=${order}, page=${currentPage}`);
        setLoading(true);
        const response = await fetchNewestPools({
          limit: 50,
          sortBy,
          order,
          page: currentPage
        });
        
        logger.log('[PoolContext] API response:', response);
        
        if (response && response.data) {
          logger.log(`[PoolContext] Setting ${response.data.length} pools from response.data`);
          setPools(response.data);
          
          // Zapisujemy dane paginacji jeśli są dostępne
          if (response.pagination) {
            logger.log('[PoolContext] Setting pagination data:', response.pagination);
            setPaginationData(response.pagination);
          }
        } else if (response && Array.isArray(response)) {
          // Obsługa starszego formatu odpowiedzi
          logger.log(`[PoolContext] Setting ${response.length} pools from array response`);
          setPools(response);
        } else {
          logger.warn('[PoolContext] Unexpected response format:', response);
        }
        setError(null);
      } catch (err) {
        logger.error('[PoolContext] Failed to load pools:', err);
        setError('Failed to load pools');
      } finally {
        setLoading(false);
      }
    };
    
    loadPools();
  }, [sortBy, order, currentPage]);
  
  // Inicjalizacja połączenia WebSocket
  useEffect(() => {
    logger.log('[PoolContext] Connecting to WebSocket at:', TRANSACTION_WEBSOCKET_URL);
    
    // Upewnij się, że WebSocket URL jest poprawny
    if (!TRANSACTION_WEBSOCKET_URL) {
      logger.error('[PoolContext] WebSocket URL is missing!');
      return;
    }
    
    const newSocket = io(TRANSACTION_WEBSOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Leave default transports to allow graceful fallback from polling to WebSocket
    });
    
    newSocket.on('connect', () => {
      logger.log('[PoolContext] Connected to WebSocket service! Socket ID:', newSocket.id);
      socketConnectedRef.current = true;
    });
    
    newSocket.on('disconnect', (reason) => {
      logger.log('[PoolContext] Disconnected from WebSocket service. Reason:', reason);
      socketConnectedRef.current = false;
    });
    
    newSocket.on('connect_error', (error) => {
      logger.error('[PoolContext] WebSocket connection error:', error);
      socketConnectedRef.current = false;
    });
    
    // Obsługa nowych poolów
    newSocket.on('new_pool', (pool) => {
      logger.log('[PoolContext] Received new pool notification!', pool);
      
      // Oznaczamy nowy pool do podświetlenia
      setRecentlyAddedPoolId(pool.id);
      
      // Automatyczne zresetowanie podświetlenia po 5 sekundach
      setTimeout(() => {
        setRecentlyAddedPoolId(null);
      }, 5000);
      
      // Sprawdź czy pool już istnieje w liście
      setPools(currentPools => {
        logger.log('[PoolContext] Checking if pool exists in current list of', currentPools.length, 'pools');
        
        const existsIndex = currentPools.findIndex(p => p.id === pool.id || p.token_address === pool.token_address);
        if (existsIndex !== -1) {
          logger.log(`[PoolContext] Pool already exists at index ${existsIndex}, moving to top`);
          
          // Usuń istniejący pool z listy
          const updatedPools = [...currentPools];
          updatedPools.splice(existsIndex, 1);
          
          // Dodaj pool na początku listy
          return [pool, ...updatedPools];
        }
        
        // Dodajemy nowy pool tylko gdy jesteśmy na pierwszej stronie
        // i sortujemy według created_at DESC (tj. najnowsze)
        if (currentPage === 1 && sortBy === 'created_at' && order === 'DESC') {
          logger.log('[PoolContext] Adding new pool to the beginning of the list');
          
          // Aktualizujemy paginationData zwiększając total o 1
          setPaginationData(prevData => ({
            ...prevData,
            total: (prevData.total || 0) + 1,
            last_page: Math.ceil((prevData.total + 1) / prevData.per_page)
          }));
          
          // Wyraźnie tworzymy nową tablicę, aby React wykrył zmianę
          const newPools = [pool, ...currentPools];
          return newPools;
        }
        
        // Jeśli nie jesteśmy na pierwszej stronie lub sortujemy w inny sposób,
        // nie dodajemy poola do aktualnego widoku, ale aktualizujemy licznik
        logger.log('[PoolContext] Not adding new pool to current view due to page/sort conditions');
        
        setPaginationData(prevData => ({
          ...prevData,
          total: (prevData.total || 0) + 1,
          last_page: Math.ceil((prevData.total + 1) / prevData.per_page)
        }));
        
        return currentPools;
      });
    });
    
    // Odbieranie historycznych poolów przy połączeniu
    newSocket.on('recent_pools', (recentPools) => {
      if (recentPools && recentPools.length > 0) {
        logger.log('[PoolContext] Received recent pools:', recentPools.length);
        
        // Tylko jeśli jesteśmy na pierwszej stronie i sortujemy według created_at DESC
        if (currentPage === 1 && sortBy === 'created_at' && order === 'DESC') {
          // Dodaj tylko te poole, których jeszcze nie mamy
          setPools(currentPools => {
            const currentAddresses = new Set(currentPools.map(p => p.contract_address));
            const newPools = recentPools.filter(p => !currentAddresses.has(p.contract_address));
            
            logger.log(`[PoolContext] Adding ${newPools.length} new pools from recent_pools event`);
            
            if (newPools.length === 0) return currentPools;
            
            // Aktualizujemy paginationData
            setPaginationData(prevData => ({
              ...prevData,
              total: (prevData.total || 0) + newPools.length,
              last_page: Math.ceil((prevData.total + newPools.length) / prevData.per_page)
            }));
            
            return [...newPools, ...currentPools];
          });
        }
      }
    });
    
    // Dodaj event do ręcznego sprawdzenia połączenia
    setTimeout(() => {
      if (socketConnectedRef.current) {
        logger.log('[PoolContext] WebSocket is connected and ready!');
      } else {
        logger.warn('[PoolContext] WebSocket is NOT connected after timeout!');
      }
    }, 3000);
    
    setSocket(newSocket);
    
    return () => {
      logger.log('[PoolContext] Cleaning up WebSocket connection');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentPage, sortBy, order]); // Dodajemy zależności, aby reagować na zmiany strony i sortowania

  // Funkcja do zmiany sortowania
  const changeSorting = (newSortBy, newOrder = 'DESC') => {
    logger.log(`[PoolContext] Changing sorting to: ${newSortBy}, ${newOrder}`);
    setSortBy(newSortBy);
    setOrder(newOrder);
    setCurrentPage(1); // Resetujemy stronę przy zmianie sortowania
  };
  
  // Funkcja do zmiany strony
  const changePage = (newPage) => {
    logger.log(`[PoolContext] Changing page to: ${newPage}`);
    setCurrentPage(newPage);
  };

  // Eksport kontekstu
  const contextValue = useMemo(() => ({
    pools,
    loading,
    error,
    recentlyAddedPoolId,
    sortBy,
    order,
    currentPage,
    paginationData,
    changeSorting,
    changePage
  }), [pools, loading, error, recentlyAddedPoolId, sortBy, order, currentPage, paginationData]);

  return (
    <PoolContext.Provider value={contextValue}>
      {children}
    </PoolContext.Provider>
  );
};

export const usePools = () => useContext(PoolContext);

export default PoolContext; 