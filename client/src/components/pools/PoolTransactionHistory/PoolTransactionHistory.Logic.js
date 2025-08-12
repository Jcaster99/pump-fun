import React, { useState, useEffect } from 'react';
import { fetchPoolTransactions } from '../../../api/poolTransactionsApi';
import PoolTransactionHistoryView from './PoolTransactionHistory.View';
import { usePoolDetailsSocket } from '../../../context/PoolDetailsSocketContext';

const PoolTransactionHistoryLogic = ({ pool, theme, darkMode }) => {
  const { getPoolData, poolData } = usePoolDetailsSocket();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Używamy tylko token_address - bez fallbacku na contract_address
  const poolAddress = pool?.token_address;
  
  // Fetch transaction history when component mounts or pool changes
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        
        const response = await fetchPoolTransactions(poolAddress);
        
        if (response.success) {
          setTransactions(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to load transaction history');
        }
      } catch (err) {
        console.error('Error loading transaction history:', err);
        setError('Error loading transaction history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (poolAddress) {
      loadTransactions();
    }
  }, [poolAddress]);
  
  // Listen for realtime transaction updates
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
  
  return (
    <PoolTransactionHistoryView
      pool={pool}
      theme={theme}
      darkMode={darkMode}
      transactions={transactions}
      loading={loading}
      error={error}
    />
  );
};

export default PoolTransactionHistoryLogic; 