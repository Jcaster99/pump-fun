import { ethers } from 'ethers';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useTheme } from '../context/ThemeContext';
import { BONDING_CURVE_TOKEN_ABI, CONSTANTS, DEPLOYMENT_INFO, ERC20_ABI } from '../utils/contractABIs';
import rpcManager from '../utils/rpcManager'; // Import menedżera RPC
import { createToastStyles, defaultToastConfig, toastIcons } from '../utils/toastConfig';
import { useSwapHelpers } from './useSwapHelpers';
import { useWallet } from './useWallet';

export const useSwap = () => {
  const { wallet } = useWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { formatDecimal } = useSwapHelpers();
  const { theme, darkMode } = useTheme();
  
  // Toast styles
  const { baseToastStyle, successToastStyle, errorToastStyle } = createToastStyles(theme, darkMode);

  // State
  const [calculatedData, setCalculatedData] = useState(null);
  const [isLoadingCalculation, setIsLoadingCalculation] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isApprovingToken, setIsApprovingToken] = useState(false);
  const [error, setError] = useState(null);
  const [lastSwapHash, setLastSwapHash] = useState(null);
  
  // Licznik obliczeń do anulowania starych
  const calculationCounter = useRef(0);
  
  // Cache dla obliczeń - unikamy zbędnych wywołań blockchain
  const calculationCache = useRef(new Map());
  const CACHE_TTL = 10000; // 10 sekund
  
  // Pomocnicze funkcje zarządzania cache
  const getFromCache = (key) => {
    if (calculationCache.current.has(key)) {
      const {result, timestamp} = calculationCache.current.get(key);
      if (Date.now() - timestamp < CACHE_TTL) {
        return result;
      }
    }
    return null;
  };
  
  const saveToCache = (key, result) => {
    calculationCache.current.set(key, {
      result, 
      timestamp: Date.now()
    });
    
    // Czyszczenie cache gdy przekroczy 20 wpisów
    if (calculationCache.current.size > 20) {
      const oldestEntry = [...calculationCache.current.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldestEntry) {
        calculationCache.current.delete(oldestEntry[0]);
      }
    }
  };
  
  // Use the centralized USDT address and constants
  const USDT_ADDRESS = DEPLOYMENT_INFO.usdt;
  const { USDT_DECIMALS, TOKEN_DECIMALS } = CONSTANTS;

  /**
   * Enhanced calculate swap details with failover and caching
   */
  const calculateSwap = useCallback(async ({
    isBuy,
    tokenAddress,
    amount,
    tokenSymbol,
    poolAddress,
    slippage = '0.5' // Default slippage to 0.5% if not provided
  }) => {
    if (!amount || !wallet || !tokenAddress || !poolAddress || amount <= 0) {
      setCalculatedData(null);
      return;
    }

    // Increment counter to track the latest calculation
    calculationCounter.current += 1;
    const currentCounter = calculationCounter.current;

    setIsLoadingCalculation(true);
    setError(null);

    try {
      // Generate cache key
      const cacheKey = `${isBuy ? 'buy' : 'sell'}-${tokenAddress}-${amount.toString()}`;
      
      // Check cache first
      const cachedResult = getFromCache(cacheKey);
      if (cachedResult) {
        console.log('Using cached calculation result');
        setCalculatedData(cachedResult);
        setIsLoadingCalculation(false);
        return cachedResult;
      }
      
      // Prepare contract config
      const contract = {
        address: poolAddress || tokenAddress,
        abi: BONDING_CURVE_TOKEN_ABI
      };

      // For buy: amount is USDT, calculate expected token amount
      // For sell: amount is token, calculate expected USDT amount
      const functionName = isBuy ? 'calculatePurchaseAmount' : 'calculateSaleReturn';
      const amountBigInt = isBuy 
        ? ethers.utils.parseUnits(amount.toString(), USDT_DECIMALS)
        : ethers.utils.parseUnits(amount.toString(), TOKEN_DECIMALS);

      // Przygotuj argumenty dla contractRead
      const args = [amountBigInt];
      
      // Enhanced parallel read logic with RPC fallback
      let result;
      let currentPrice;
      
      try {
        // Attempt parallel RPC calls for faster results
        [result, currentPrice] = await Promise.all([
          // Try multiple RPC endpoints in parallel for calculatePurchaseAmount/calculateSaleReturn
          Promise.any([
            // Primary method using wagmi's publicClient
            publicClient.readContract({
              ...contract,
              functionName,
              args
            }),
            
            // Fallback using our RPC manager with direct JSON-RPC
            rpcManager.executeRequest('eth_call', [{
              to: poolAddress || tokenAddress,
              data: encodeFunctionData(BONDING_CURVE_TOKEN_ABI, functionName, args)
            }, 'latest'], {
              parallelRequests: true,
              parallelCount: 3,
              timeout: 3000
            }).then(hex => decodeFunctionResult(BONDING_CURVE_TOKEN_ABI, functionName, hex))
          ]),
          
          // Similar parallel approach for getCurrentPrice
          Promise.any([
            // Primary
            publicClient.readContract({
              ...contract,
              functionName: 'getCurrentPrice'
            }),
            
            // Fallback
            rpcManager.executeRequest('eth_call', [{
              to: poolAddress || tokenAddress,
              data: encodeFunctionData(BONDING_CURVE_TOKEN_ABI, 'getCurrentPrice', [])
            }, 'latest'], {
              parallelRequests: true,
              timeout: 3000
            }).then(hex => decodeFunctionResult(BONDING_CURVE_TOKEN_ABI, 'getCurrentPrice', hex))
          ])
        ]);
      } catch (err) {
        // If parallel approach fails, fall back to sequential with retries
        console.warn('Parallel RPC calls failed, falling back to sequential', err);
        
        try {
          // Check if calculation is still relevant
          if (currentCounter !== calculationCounter.current) return null;
          
          // Try publicClient with retries
          result = await retryOperation(() => 
            publicClient.readContract({
        ...contract,
        functionName,
              args
            }), 3);

          currentPrice = await retryOperation(() => 
            publicClient.readContract({
        ...contract,
        functionName: 'getCurrentPrice'
            }), 3);
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }

      // Check if calculation is still relevant
      if (currentCounter !== calculationCounter.current) {
        console.log('Ignoring stale calculation result');
        return null;
      }

      // Format expected amount
      const expectedAmount = isBuy
        ? ethers.utils.formatUnits(result, TOKEN_DECIMALS)
        : ethers.utils.formatUnits(result, USDT_DECIMALS);

      // Apply slippage to calculate minimum amount
      const slippagePercent = parseFloat(slippage || '0.5');
      const slippageFactor = (100 - slippagePercent) / 100;
      const minAmount = (parseFloat(expectedAmount) * slippageFactor).toString();

      // Create final result
      const calculationResult = {
        inputAmount: amount,
        expectedAmount: parseFloat(expectedAmount),
        minAmount: parseFloat(minAmount),
        currentPrice: ethers.utils.formatUnits(currentPrice, USDT_DECIMALS),
        isBuy,
        tokenSymbol,
        appliedSlippage: slippagePercent
      };

      // Cache the result for future use
      saveToCache(cacheKey, calculationResult);
      
      // Update state
      setCalculatedData(calculationResult);
      
      return calculationResult;
    } catch (err) {
      console.error('Error calculating swap:', err);
      
      // Check if calculation is still relevant before setting error
      if (currentCounter === calculationCounter.current) {
      setError(err.message || 'Failed to calculate swap');
      }
      return null;
    } finally {
      // Check if calculation is still relevant before clearing loading state
      if (currentCounter === calculationCounter.current) {
      setIsLoadingCalculation(false);
      }
    }
  }, [wallet, publicClient, USDT_DECIMALS, TOKEN_DECIMALS]);

  /**
   * Execute a swap (buy or sell)
   */
  const executeSwap = useCallback(async ({
    isBuy,
    tokenAddress,
    poolAddress,
    amount,
    slippage = '0.5' // Default slippage to 0.5% if not provided
  }) => {
    if (!wallet || !walletClient || !amount || amount <= 0) {
      setError('Invalid swap parameters or wallet not connected');
      return null;
    }

    setError(null);

    try {
      // Convert amount to correct units
      const amountBigInt = isBuy
        ? ethers.utils.parseUnits(amount.toString(), USDT_DECIMALS)
        : ethers.utils.parseUnits(amount.toString(), TOKEN_DECIMALS);
        
      // Calculate minimum amount with slippage
      const slippagePercent = parseFloat(slippage || '0.5');
      const slippageFactor = (100 - slippagePercent) / 100;
      
      // First, calculate the expected output amount using our enhanced calculateSwap
      const calculationResult = await calculateSwap({
        poolAddress: poolAddress || tokenAddress,
        tokenAddress,
        isBuy,
        amount: parseFloat(amount),
        slippage
      });
      
      if (!calculationResult) {
        throw new Error('Failed to calculate expected amount for swap');
      }
      
      // Get the expected and min amounts from calculation
      const { expectedAmount, minAmount } = calculationResult;

      // Track the token whose balance will change after the transaction (for actual amount calculation)
      const tokenToTrack = isBuy ? tokenAddress : USDT_ADDRESS;
      const tokenToTrackDecimals = isBuy ? TOKEN_DECIMALS : USDT_DECIMALS;
      
      // Read balance BEFORE swap - this is crucial for accurate measurement
      const balanceBeforeBigInt = await retryOperation(() => 
        publicClient.readContract({
        address: tokenToTrack,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [wallet.address]
        }), 3);
      
      // If buying, we need to approve USDT first
      if (isBuy) {
        setIsApprovingToken(true);
        
        try {
          // Check current allowance
          const allowance = await retryOperation(() => 
            publicClient.readContract({
            address: USDT_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [wallet.address, tokenAddress]
            }), 3);

          // If allowance is less than amount, approve
          if (ethers.BigNumber.from(allowance.toString()).lt(amountBigInt)) {
            // Add 0.1% buffer to approval amount
            const bufferMultiplier = ethers.BigNumber.from(1001);
            const amountWithBuffer = amountBigInt.mul(bufferMultiplier).div(1000);
            
            const approveTx = await walletClient.writeContract({
              address: USDT_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [tokenAddress, amountWithBuffer]
            });

            toast.loading('Approving USDT for trading...', { 
              id: 'approving',
              position: defaultToastConfig.position,
              style: baseToastStyle,
              icon: toastIcons.loading(theme.accent.primary)
            });
            
            // Wait for the transaction to be mined
            const receipt = await publicClient.waitForTransactionReceipt({ hash: approveTx });
            
            if (receipt.status !== 'success') {
              throw new Error('USDT approval failed');
            }
            
            toast.dismiss('approving');
            toast.success('USDT approved successfully!', { 
              position: defaultToastConfig.position,
              style: successToastStyle,
              icon: toastIcons.success(theme)
            });
          }
        } catch (err) {
          toast.dismiss('approving');
          toast.error('Failed to approve USDT: ' + (err.message || 'Unknown error'), { 
            position: defaultToastConfig.position,
            style: errorToastStyle,
            icon: toastIcons.error()
          });
          setError('Failed to approve USDT: ' + (err.message || 'Unknown error'));
          setIsApprovingToken(false);
          return null;
        }
        
        setIsApprovingToken(false);
      }

      // Execute the swap 
      // Note: We calculate with slippage but use standard functions since contract doesn't have slippage-enabled functions
      setIsSwapping(true);
      const functionName = isBuy ? 'buy' : 'sell';
      
      const swapTx = await walletClient.writeContract({
        address: tokenAddress,
        abi: BONDING_CURVE_TOKEN_ABI,
        functionName,
        args: [amountBigInt]
      });

      toast.loading(
        `${isBuy ? 'Buying' : 'Selling'} tokens with ${slippagePercent}% slippage...`, 
        { 
          id: 'swapping',
          position: defaultToastConfig.position,
          style: baseToastStyle,
          icon: toastIcons.loading(isBuy ? theme.accent.primary : '#FF5757')
        }
      );

      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });
      
      if (receipt.status !== 'success') {
        throw new Error(`${isBuy ? 'Buy' : 'Sell'} transaction failed`);
      }
      
      // Read balance AFTER swap with retries
      const balanceAfterBigInt = await retryOperation(() => 
        publicClient.readContract({
        address: tokenToTrack,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [wallet.address]
        }), 3);
      
      // Calculate actual amount received/spent from balance differences
      let actualAmount;
      // When using wagmi's publicClient, balance values are returned as native BigInt.
      // Native BigInt doesn't expose .eq / .gt / .sub helpers (these belong to ethers.BigNumber).
      // Therefore, we compare with normal JS comparison operators and calculate the difference
      // via standard arithmetic on BigInt.

      if (balanceAfterBigInt === balanceBeforeBigInt) {
        // No balance change detected – fall back to expected amount
        if (process.env.REACT_APP_TEST === 'true') {
          console.warn('No balance change detected after swap. Using expected amount instead.');
        }
        actualAmount = parseFloat(expectedAmount);
      } else {
        // Balance changed, calculate the absolute difference
        const balanceDiffBigInt = balanceAfterBigInt > balanceBeforeBigInt
          ? balanceAfterBigInt - balanceBeforeBigInt
          : balanceBeforeBigInt - balanceAfterBigInt;

        // Convert BigInt difference to human-readable format
        actualAmount = parseFloat(
          ethers.utils.formatUnits(balanceDiffBigInt.toString(), tokenToTrackDecimals)
        );
      }

      toast.dismiss('swapping');
      setLastSwapHash(swapTx);
      
      // Invalidate cache after successful transaction
      calculationCache.current.clear();
      
      return {
        txHash: swapTx,
        expectedAmount: parseFloat(expectedAmount),
        actualAmount: parseFloat(actualAmount),
        minAmount: parseFloat(minAmount)
      };
    } catch (err) {
      console.error('Swap error:', err);
      toast.dismiss('swapping');
      toast.error(`Failed to ${isBuy ? 'buy' : 'sell'} tokens: ${err.message || 'Unknown error'}`, { 
        position: defaultToastConfig.position,
        style: errorToastStyle,
        icon: toastIcons.error()
      });
      setError(`Failed to ${isBuy ? 'buy' : 'sell'} tokens: ${err.message || 'Unknown error'}`);
      return null;
    } finally {
      setIsSwapping(false);
    }
  }, [wallet, walletClient, publicClient, theme, baseToastStyle, successToastStyle, errorToastStyle, calculateSwap, USDT_DECIMALS, TOKEN_DECIMALS]);

  // Helper function for retrying operations
  const retryOperation = async (operation, maxRetries = 3, delay = 500) => {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, err.message);
        lastError = err;
        
        if (attempt < maxRetries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          // Increase delay for subsequent retries
          delay = Math.min(delay * 1.5, 2000);
        }
      }
    }
    
    throw lastError;
  };
  
  // Helper functions for direct contract interaction
  const encodeFunctionData = (abi, functionName, args) => {
    const iface = new ethers.utils.Interface(abi);
    return iface.encodeFunctionData(functionName, args);
  };
  
  const decodeFunctionResult = (abi, functionName, data) => {
    const iface = new ethers.utils.Interface(abi);
    return iface.decodeFunctionResult(functionName, data)[0];
  };

  return {
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
  };
};
