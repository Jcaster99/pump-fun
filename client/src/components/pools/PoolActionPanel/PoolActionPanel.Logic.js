import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { useSwap } from '../../../hooks/useSwap';
import { usePublicClient } from 'wagmi';
import { useBalance } from 'wagmi';
import { toast } from 'react-hot-toast';
import { ArrowRight, Check } from 'lucide-react';
import { savePoolTransaction } from '../../../api/poolTransactionsApi';
import { useTransaction } from '../../../context/TransactionContext';
import PoolActionPanelView from './PoolActionPanel.View';
import { createToastStyles, SpinnerIcon, SuccessToastWithExplorer, toastIcons, defaultToastConfig } from '../../../utils/toastConfig';

const PoolActionPanelLogic = ({ pool, theme, darkMode, hidePriceHeader }) => {
  const { wallet, connectWallet } = useWallet();
  const publicClient = usePublicClient();
  const { updateLastTransaction } = useTransaction();
  const [activeTab, setActiveTab] = useState('buy'); // buy, sell
  const [amount, setAmount] = useState('');
  
  // Slippage settings - changed from constants to state
  const [slippage, setSlippage] = useState('0.5');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  
  const [buttonAnimating, setButtonAnimating] = useState(false);
  // Store details of the trade so we can persist them once tx hash is known
  const [lastTradeInfo, setLastTradeInfo] = useState(null);
  // Add balance refresh key to trigger balance refresh after transactions
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  
  // Get toast styles
  const { baseToastStyle, successToastStyle, errorToastStyle } = createToastStyles(theme, darkMode);
  
  // This is just for the UI balance display. For trade, we use address from contractABIs.js
  const USDT_CONTRACT = '0x3eC8A8705bE1D5ca90066b37ba62c4183B024ebf';
  
  // Get USDT balance
  const { data: usdtBalance, refetch: refetchUsdtBalance } = useBalance({
    address: wallet?.address,
    token: USDT_CONTRACT,
    enabled: !!wallet?.address,
    cacheTime: 5000, // Reduce cache time to ensure more frequent updates
    staleTime: 5000,
    watch: true, // Watch for balance changes
    key: `usdt-balance-${balanceRefreshKey}`, // Key changes will cause refresh
  });
  
  // Get token balance for selling
  const { data: tokenBalance, refetch: refetchTokenBalance } = useBalance({
    address: wallet?.address,
    token: pool?.token_address,
    enabled: !!wallet?.address && !!pool?.token_address,
    cacheTime: 5000,
    staleTime: 5000,
    watch: true,
    key: `token-balance-${balanceRefreshKey}`, // Key changes will cause refresh
  });
  
  const formattedUsdtBalance = usdtBalance ? parseFloat(usdtBalance.formatted).toFixed(2) : '0.00';
  const formattedTokenBalance = tokenBalance ? parseFloat(tokenBalance.formatted).toFixed(6) : '0.00';
  
  // Prefer token_address; fall back to contract_address for legacy
  const poolAddress = pool?.token_address || pool?.contract_address;
  
  // Handle Max button click
  const handleMaxClick = () => {
    if (activeTab === 'buy' && usdtBalance) {
      handleAmountChange(usdtBalance.formatted);
    } else if (activeTab === 'sell' && tokenBalance) {
      handleAmountChange(tokenBalance.formatted);
    }
  };
  
  // Toggle slippage settings visibility
  const toggleSlippageSettings = () => {
    setShowSlippageSettings(prev => !prev);
  };
  
  // Handle slippage change
  const handleSlippageChange = (newSlippage) => {
    setSlippage(newSlippage);
  };
  
  const { 
    calculateSwap, 
    executeSwap,
    isLoadingCalculation, 
    isSwapping,
    isApprovingToken,
    calculatedData, 
    lastSwapHash,
    error,
    setError,
    setLastSwapHash
  } = useSwap();
  
  // To avoid unnecessary re-renders, keep a ref to calculateSwap
  const calculateSwapRef = useRef(calculateSwap);
  useEffect(() => { calculateSwapRef.current = calculateSwap; }, [calculateSwap]);
  
  // Efekt do obsługi animacji przycisku
  useEffect(() => {
    setButtonAnimating(isSwapping || isApprovingToken);
  }, [isSwapping, isApprovingToken]);
  
  // Adaptacyjny debounce - zaczyna od 800ms i dostosowuje się
  const [debounceTime, setDebounceTime] = useState(800);
  const lastCalculationTime = useRef(0);
  
  // Efekt do obliczania przewidywanych wartości przy zmianie kwoty
  useEffect(() => {
    // Skip calculations for empty or invalid amounts
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !pool) {
      return;
    }
    
    // Generate a unique identifier for this calculation request
    const calculationId = Date.now();
    lastCalculationTime.current = calculationId;
    
    const calculateSwapData = async () => {
      // Skip if this is no longer the latest calculation request
      if (calculationId !== lastCalculationTime.current) {
        return;
      }
      
      const startTime = performance.now();
      
      try {
        const result = await calculateSwapRef.current({
          poolAddress: poolAddress,
          isBuy: activeTab === 'buy',
          tokenAddress: pool.token_address,
          amount: parseFloat(amount),
          tokenSymbol: pool.symbol
        });
        
        // Skip processing result if a newer calculation is in progress
        if (calculationId !== lastCalculationTime.current) {
          return;
        }
        
        // Adaptacyjnie dostosuj czas debounce na podstawie rzeczywistego czasu odpowiedzi
        const elapsed = performance.now() - startTime;
        if (elapsed > 1000) {
          // Transakcja trwała długo, zwiększ debounce
          setDebounceTime(prev => Math.min(prev + 100, 1500));
        } else if (elapsed < 300 && debounceTime > 300) {
          // Transakcja była szybka, zmniejsz debounce
          setDebounceTime(prev => Math.max(prev - 50, 300));
        }
        
        if (process.env.REACT_APP_TEST === 'true') {
          console.log(`Calculation took ${Math.round(elapsed)}ms, debounce adjusted to ${debounceTime}ms`);
        }
      } catch (err) {
        // Skip error processing if a newer calculation is in progress
        if (calculationId !== lastCalculationTime.current) {
          return;
        }
        console.error('Failed to calculate swap:', err);
      }
    };
    
    // Użyj zaktualizowanego czasu debounce
    const timer = setTimeout(() => {
      calculateSwapData();
    }, debounceTime);
    
    return () => clearTimeout(timer);
  }, [amount, activeTab, poolAddress, pool, debounceTime]);
  
  // Efekt do wyświetlania powiadomień - zmodyfikowany, aby pojawiały się tylko przy rzeczywistych transakcjach
  useEffect(() => {
    if (isApprovingToken) {
      toast.loading(
        'Approving token for trading...', 
        { 
          id: 'approving', 
          duration: Infinity, 
          style: baseToastStyle,
          position: defaultToastConfig.position,
          icon: toastIcons.loading(theme.accent.primary)
        }
      );
    } else {
      toast.dismiss('approving');
    }
    
    if (isSwapping) {
      toast.loading(
        `${activeTab === 'buy' ? 'Buying' : 'Selling'} ${pool?.symbol} tokens...`, 
        { 
          id: 'swapping', 
          duration: Infinity, 
          style: baseToastStyle,
          position: defaultToastConfig.position,
          icon: toastIcons.loading(activeTab === 'buy' ? theme.accent.primary : '#FF5757')
        }
      );
    } else {
      toast.dismiss('swapping');
    }
  }, [isApprovingToken, isSwapping, activeTab, pool, theme.accent.primary, baseToastStyle]);
  
  // Obsługa submitu formularza
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet) {
      connectWallet();
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (isSwapping || isApprovingToken) {
      return; // Zabezpieczenie przed podwójnym submitowaniem
    }
    
    // Sprawdź, czy obliczenie zostało zakończone
    if (isLoadingCalculation) {
      // Informuj użytkownika, że obliczenie jest w toku
      toast.error('Please wait for the calculation to complete before proceeding', { 
        position: defaultToastConfig.position,
        style: errorToastStyle,
        icon: toastIcons.warning ? toastIcons.warning() : null
      });
      return;
    }
    
    try {
      // Przygotowanie danych transakcji dla późniejszego zapisu
      setLastTradeInfo({
        type: activeTab === 'buy' ? 'buy' : 'sell',
        inputAmount: parseFloat(amount),
        expectedAmount: calculatedData?.expectedAmount || 0,
        minAmount: calculatedData?.minAmount || 0,
        slippage: parseFloat(slippage)
      });
      
      // Wywołanie transakcji
      const result = await executeSwap({
        poolAddress: poolAddress,
        tokenAddress: pool.token_address,
        amount: parseFloat(amount),
        isBuy: activeTab === 'buy',
        slippage: slippage, // Use the state slippage value
        tokenSymbol: pool.symbol
      });
      
      if (result) {
        // Aktualizuj lastTradeInfo o rzeczywistą wartość transakcji
        setLastTradeInfo(prev => ({
          ...prev,
          actualAmount: result.actualAmount  // Dodajemy rzeczywistą wartość z blockchain
        }));
      }
      
      // Wyczyść pole amount po udanej transakcji
      setAmount('');
      
      // Wymuś odświeżenie obliczeń po transakcji
      lastCalculationTime.current = 0;
      
    } catch (err) {
      console.error('Error executing swap:', err);
      setError(err.message || 'Failed to execute transaction. Please try again.');
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    toast.dismiss('transaction-success');
    
    // Refresh balances when switching tabs
    refetchUsdtBalance();
    refetchTokenBalance();
  };

  // Efekt do obsługi udanej transakcji
  useEffect(() => {
    if (lastSwapHash) {
      // Wywołanie zapisu transakcji w tle
      (async () => {
        try {
          if (lastTradeInfo && wallet && pool) {
            const isBuy = lastTradeInfo.type === 'buy';
            
            // Używamy rzeczywistej wartości (actualAmount) jeśli jest dostępna, w przeciwnym razie oczekiwanej wartości
            const tokenAmount = isBuy 
              ? (lastTradeInfo.actualAmount || lastTradeInfo.expectedAmount) 
              : lastTradeInfo.inputAmount;
            
            const usdtAmount = isBuy 
              ? lastTradeInfo.inputAmount 
              : (lastTradeInfo.actualAmount || lastTradeInfo.expectedAmount);
            
            // Przekazujemy wartości bezpośrednio, bez formatowania
            // API poolTransactionsApi samo zapewni konwersję na stringi
            if (process.env.REACT_APP_TEST === 'true') {
              console.log('Saving transaction with actual values:', {
                type: lastTradeInfo.type,
                expectedAmount: lastTradeInfo.expectedAmount,
                actualAmount: lastTradeInfo.actualAmount,
                token_amount: tokenAmount,
                usdt_amount: usdtAmount
              });
            }
              
            await savePoolTransaction({
              contract_address: pool.token_address || pool.contract_address,
              wallet_address: wallet.address,
              tx_hash: lastSwapHash,
              type: lastTradeInfo.type,
              token_amount: tokenAmount, // Przekazujemy oryginalną wartość
              usdt_amount: usdtAmount,   // Przekazujemy oryginalną wartość
              min_amount: isBuy ? lastTradeInfo.minAmount : null,
              slippage: lastTradeInfo.slippage || 0.5,
              price: calculatedData?.currentPrice || pool.price
            });
            
            if (process.env.REACT_APP_TEST === 'true') {
              console.log('Transaction saved successfully');
            }
            
            // Trigger balance refresh after transaction is saved
            setBalanceRefreshKey(prevKey => prevKey + 1);
            
            // Actively refetch balances to ensure up-to-date values are displayed
            refetchUsdtBalance();
            refetchTokenBalance();

            // Broadcast transaction notification to all clients
            if (updateLastTransaction && lastTradeInfo && wallet && pool) {
              // Dla buy: amount to wartość otrzymanych tokenów
              // Dla sell: amount to liczba sprzedanych tokenów (inputAmount)
              const broadcastAmount = isBuy
                ? (lastTradeInfo.actualAmount || lastTradeInfo.expectedAmount)
                : lastTradeInfo.inputAmount;

              updateLastTransaction({
                wallet_address: wallet.address,
                contract_address: pool.token_address || pool.contract_address,
                tx_hash: lastSwapHash,
                type: lastTradeInfo.type,
                amount: broadcastAmount,
                symbol: pool.symbol,
                status: 'success',
                username: localStorage.getItem(`username_${wallet.address.toLowerCase()}`) || null
              });
            }
          }
        } catch (err) {
          console.error('Failed to save transaction:', err);
        }
      })();
      
      // Przygotuj dane transakcji do wyświetlenia
      const transactionInfo = lastTradeInfo ? {
        type: lastTradeInfo.type,
        actualAmount: lastTradeInfo.actualAmount || lastTradeInfo.expectedAmount,
        symbol: pool.symbol
      } : null;
      
      toast.success(
        <SuccessToastWithExplorer 
          message="Transaction completed!" 
          txHash={lastSwapHash} 
          theme={theme}
          transactionInfo={transactionInfo}
        />,
        { 
          id: 'transaction-success',
          duration: 7000,
          style: successToastStyle,
          position: defaultToastConfig.position,
          icon: toastIcons.success(theme)
        }
      );
      
      setTimeout(() => {
        setLastSwapHash(null);
      }, 100);
    }
  }, [lastSwapHash, darkMode, theme, successToastStyle, calculatedData, wallet, pool, lastTradeInfo, refetchUsdtBalance, refetchTokenBalance, updateLastTransaction]);
  
  // Format price for display
  const formatPrice = (price) => {
    if (!price && price !== 0) return '$0.00'; // Handle null/undefined
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (numPrice >= 1) {
      return `$${numPrice.toFixed(2)}`;
    } else if (numPrice >= 0.01) {
      return `$${numPrice.toFixed(4)}`;
    } else if (numPrice === 0) {
      return '$0.00';
    }
    
    // Handle scientific notation (very small numbers)
    const priceStr = numPrice.toString();
    
    // Check if it's in scientific notation (e.g., 1.23e-8)
    if (priceStr.includes('e-')) {
      const parts = priceStr.split('e-');
      const base = parseFloat(parts[0]);
      const exponent = parseInt(parts[1]);
      
      // Create string with the right number of leading zeros
      let result = '$0.';
      
      // Adjust for very small numbers
      for (let i = 0; i < exponent - 1; i++) {
        result += '0';
      }
      
      // Add significant digits from the base
      const baseDigits = base.toString().replace('.', '');
      result += baseDigits.substring(0, 4);
      return result;
    }
    
    return `$${numPrice.toFixed(8)}`;
  };

  // Monitorowanie statusu RPC
  const [rpcStatus, setRpcStatus] = useState('healthy'); // 'healthy', 'degraded', 'failed'
  
  // Efekt monitorujący statusu sieci RPC
  useEffect(() => {
    const checkRpcStatus = async () => {
      try {
        // Sprawdź, czy publicClient działa, wykonując proste zapytanie
        await publicClient.getChainId();
        setRpcStatus('healthy');
      } catch (err) {
        console.error('RPC health check failed:', err);
        setRpcStatus('degraded');
      }
    };
    
    // Uruchom sprawdzenie przy montowaniu i co 60 sekund
    checkRpcStatus();
    const interval = setInterval(checkRpcStatus, 60000);
    
    return () => clearInterval(interval);
  }, [publicClient]);

  const amountDebounceTimer = useRef(null);

  // Funkcja obsługująca zmianę kwoty w polu input (debounced)
  const handleAmountChange = useCallback((value) => {
    setAmount(value);

    // Wyczyść poprzedni timer, jeśli istnieje
    if (amountDebounceTimer.current) {
      clearTimeout(amountDebounceTimer.current);
    }

    // Ustaw nowy timer – po upływie debounceTime uruchom przeliczenie
    amountDebounceTimer.current = setTimeout(() => {
      // Tylko jeśli wartość poprawna
      if (!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0 || !pool) {
        return;
      }

      // Zainicjuj nowe obliczenie
      lastCalculationTime.current = Date.now();
      calculateSwapRef.current({
        poolAddress: poolAddress,
        isBuy: activeTab === 'buy',
        tokenAddress: pool.token_address,
        amount: parseFloat(value),
        tokenSymbol: pool.symbol
      }).catch((err) => {
        console.error('Failed to calculate swap (handleAmountChange):', err);
      });
    }, debounceTime);
  }, [activeTab, debounceTime, pool, poolAddress, calculateSwapRef]);

  // Handle Clear button click
  const handleClearClick = () => {
    setAmount('');
  };

  return (
    <PoolActionPanelView
      pool={pool}
      theme={theme}
      darkMode={darkMode}
      wallet={wallet}
      activeTab={activeTab}
      handleTabChange={handleTabChange}
      amount={amount}
      setAmount={handleAmountChange}
      handleMaxClick={handleMaxClick}
      handleClearClick={handleClearClick}
      handleSubmit={handleSubmit}
      isSwapping={isSwapping}
      isLoadingCalculation={isLoadingCalculation}
      formattedUsdtBalance={formattedUsdtBalance}
      formattedTokenBalance={formattedTokenBalance}
      calculatedData={calculatedData}
      buttonAnimating={buttonAnimating}
      error={error}
      formatPrice={formatPrice}
      hidePriceHeader={hidePriceHeader}
      lastTradeInfo={lastTradeInfo}
      slippage={slippage}
      handleSlippageChange={handleSlippageChange}
      showSlippageSettings={showSlippageSettings}
      toggleSlippageSettings={toggleSlippageSettings}
      rpcStatus={rpcStatus}
    />
  );
};

export default PoolActionPanelLogic; 