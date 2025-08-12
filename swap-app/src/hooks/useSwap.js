import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { getContract, parseUnits, formatUnits } from 'viem';
import { ERC20_ABI, LF0G_SWAP_PAIR_ABI } from '../constants/abi';
import { getContractAddress, isTestMode } from '../config/env';

/**
 * Hook do obsługi operacji swap pomiędzy tokenami z pul LF0GSwapPair
 */
export const useSwap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // Adres USDT
  const usdtAddress = getContractAddress('USDT');
  
  /**
   * Zatwierdza wydanie tokenów dla pary swap
   * @param {string} tokenAddress - Adres tokenu do zatwierdzenia
   * @param {string} spenderAddress - Adres pary swap (spender)
   * @param {string} amount - Ilość tokenów do zatwierdzenia
   */
  const approveToken = async (tokenAddress, spenderAddress, amount, decimals = 18) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const amountBigInt = parseUnits(amount.toString(), decimals);
      
      if (isTestMode()) {
        console.log(`Approving ${amount} tokens (${amountBigInt} wei) from ${tokenAddress} for ${spenderAddress}`);
      }
      
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, amountBigInt],
      });
      
      setTxHash(hash);
      
      // Czekaj na potwierdzenie transakcji
      await publicClient.waitForTransactionReceipt({ hash });
      
      return hash;
    } catch (err) {
      console.error('Error approving token:', err);
      
      // Specjalna obsługa dla błędu "User rejected the request"
      if (err.message && err.message.includes('User rejected the request')) {
        setError('Transaction was cancelled by user');
        throw new Error('Transaction was cancelled by user');
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Zamienia token na USDT
   * @param {object} token - Obiekt tokenu do sprzedaży
   * @param {string} amount - Ilość tokenów do sprzedaży
   */
  const swapTokenToUsdt = async (token, amount) => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const decimals = Number(token.decimals);
      const amountBigInt = parseUnits(amount.toString(), decimals);
      
      if (isTestMode()) {
        console.log(`Swapping ${amount} ${token.symbol} (${amountBigInt} wei) to USDT`);
      }
      
      // Sprawdź allowance, jeśli za małe - zatwierdź. Następnie prześlij tokeny do kontraktu pary
      await approveToken(token.address, token.pairAddress, amount, decimals);
      
      // Prześlij tokeny do kontraktu pary
      const transferHash = await walletClient.writeContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [token.pairAddress, amountBigInt],
      });
      await publicClient.waitForTransactionReceipt({ hash: transferHash });
      
      // Sprawdź, czy token jest token0 czy token1 w parze
      const token0Address = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'token0',
      });
      
      const isToken0 = token0Address.toLowerCase() === token.address.toLowerCase();
      
      // Get reserves to calculate expected amount out
      const reserves = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'getReserves',
      });
      
      const tokenReserve = isToken0 ? reserves[0] : reserves[1];
      const usdtReserve = isToken0 ? reserves[1] : reserves[0];
      
      // Calculate expected amount out (simplified, no fees included)
      // Formula: amount_out = (amount_in * reserve_out) / (reserve_in + amount_in)
      const amountOutBigInt = (amountBigInt * BigInt(usdtReserve)) / (BigInt(tokenReserve) + amountBigInt);
      
      // Add 1% slippage
      const minAmountOut = amountOutBigInt * BigInt(99) / BigInt(100);
      
      if (isTestMode()) {
        console.log(`Expected USDT out: ${formatUnits(amountOutBigInt, 18)}`);
        console.log(`Min USDT out with slippage: ${formatUnits(minAmountOut, 18)}`);
      }
      
      // Prepare swap parameters
      const amount0Out = isToken0 ? 0n : minAmountOut;
      const amount1Out = isToken0 ? minAmountOut : 0n;
      
      // Execute the swap
      const hash = await walletClient.writeContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'swap',
        args: [amount0Out, amount1Out, address],
      });
      
      setTxHash(hash);
      
      // Wait for transaction to be confirmed
      await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash,
        amountIn: amount,
        amountOut: formatUnits(amountOutBigInt, 18),
      };
    } catch (err) {
      console.error('Error swapping token to USDT:', err);
      
      // Specjalna obsługa dla błędu "User rejected the request"
      if (err.message && err.message.includes('User rejected the request')) {
        setError('Transaction was cancelled by user');
        throw new Error('Transaction was cancelled by user');
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Zamienia USDT na token
   * @param {object} token - Obiekt tokenu do kupienia
   * @param {string} usdtAmount - Ilość USDT do wydania
   */
  const swapUsdtToToken = async (token, usdtAmount) => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // USDT ma 18 decimals na 0G
      const usdtDecimals = 18;
      const amountBigInt = parseUnits(usdtAmount.toString(), usdtDecimals);
      
      if (isTestMode()) {
        console.log(`Swapping ${usdtAmount} USDT (${amountBigInt} wei) to ${token.symbol}`);
      }
      
      // Approve and transfer USDT to pair contract
      await approveToken(usdtAddress, token.pairAddress, usdtAmount, usdtDecimals);
      
      const transferHashUsdt = await walletClient.writeContract({
        address: usdtAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [token.pairAddress, amountBigInt],
      });
      await publicClient.waitForTransactionReceipt({ hash: transferHashUsdt });
      
      // Sprawdź, czy token jest token0 czy token1 w parze
      const token0Address = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'token0',
      });
      
      const isToken0 = token0Address.toLowerCase() === token.address.toLowerCase();
      const isUsdtToken0 = token0Address.toLowerCase() === usdtAddress.toLowerCase();
      
      // Get reserves to calculate expected amount out
      const reserves = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'getReserves',
      });
      
      const tokenReserve = isToken0 ? reserves[0] : reserves[1];
      const usdtReserve = isToken0 ? reserves[1] : reserves[0];
      
      // Calculate expected amount out (simplified, no fees included)
      // Formula: amount_out = (amount_in * reserve_out) / (reserve_in + amount_in)
      const amountOutBigInt = (amountBigInt * BigInt(tokenReserve)) / (BigInt(usdtReserve) + amountBigInt);
      
      // Add 1% slippage
      const minAmountOut = amountOutBigInt * BigInt(99) / BigInt(100);
      
      if (isTestMode()) {
        console.log(`Expected ${token.symbol} out: ${formatUnits(amountOutBigInt, token.decimals)}`);
        console.log(`Min ${token.symbol} out with slippage: ${formatUnits(minAmountOut, token.decimals)}`);
      }
      
      // Prepare swap parameters
      const amount0Out = isToken0 ? minAmountOut : 0n;
      const amount1Out = isToken0 ? 0n : minAmountOut;
      
      // Execute the swap
      const hash = await walletClient.writeContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'swap',
        args: [amount0Out, amount1Out, address],
      });
      
      setTxHash(hash);
      
      // Wait for transaction to be confirmed
      await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash,
        amountIn: usdtAmount,
        amountOut: formatUnits(amountOutBigInt, token.decimals),
      };
    } catch (err) {
      console.error('Error swapping USDT to token:', err);
      
      // Specjalna obsługa dla błędu "User rejected the request"
      if (err.message && err.message.includes('User rejected the request')) {
        setError('Transaction was cancelled by user');
        throw new Error('Transaction was cancelled by user');
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Zamienia dokładną ilość tokenów na USDT w jednej transakcji (nowa metoda)
   * @param {object} token - Obiekt tokenu do sprzedaży
   * @param {string} amount - Ilość tokenów do sprzedaży
   * @param {number} slippage - Tolerancja na poślizg cenowy (w procentach)
   */
  const swapExactTokensForUsdt = async (token, amount, slippage = 0.5) => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const decimals = Number(token.decimals);
      const amountBigInt = parseUnits(amount.toString(), decimals);
      
      if (isTestMode()) {
        console.log(`Swapping ${amount} ${token.symbol} (${amountBigInt} wei) to USDT using swapExactTokensForTokens`);
      }
      
      // Sprawdź, czy token jest token0 czy token1 w parze
      const token0Address = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'token0',
      });
      
      const isToken0 = token0Address.toLowerCase() === token.address.toLowerCase();
      
      // Oblicz oczekiwaną ilość USDT używając funkcji getAmountOut
      const expectedAmountOut = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'getAmountOut',
        args: [amountBigInt, isToken0],
      });
      
      // Oblicz minimalną akceptowalną ilość z uwzględnieniem slippage
      const minAmountOut = expectedAmountOut * BigInt(Math.floor(100 * (100 - slippage))) / BigInt(10000);
      
      if (isTestMode()) {
        console.log(`Expected USDT out: ${formatUnits(expectedAmountOut, 18)}`);
        console.log(`Min USDT out with ${slippage}% slippage: ${formatUnits(minAmountOut, 18)}`);
      }
      
      // Najpierw zatwierdź tokeny dla kontraktu pary
      await approveToken(token.address, token.pairAddress, amount, decimals);
      
      // Wykonaj swap w jednej transakcji
      const hash = await walletClient.writeContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountBigInt, minAmountOut, isToken0, address],
      });
      
      setTxHash(hash);
      
      // Czekaj na potwierdzenie transakcji
      await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash,
        amountIn: amount,
        amountOut: formatUnits(expectedAmountOut, 18),
      };
    } catch (err) {
      console.error('Error swapping exact tokens for USDT:', err);
      
      // Specjalna obsługa dla błędu "User rejected the request"
      if (err.message && err.message.includes('User rejected the request')) {
        setError('Transaction was cancelled by user');
        throw new Error('Transaction was cancelled by user');
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Zamienia USDT na dokładną ilość tokenów w jednej transakcji (nowa metoda)
   * @param {object} token - Obiekt tokenu do kupienia
   * @param {string} usdtAmount - Ilość USDT do wydania
   * @param {number} slippage - Tolerancja na poślizg cenowy (w procentach)
   */
  const swapExactUsdtForToken = async (token, usdtAmount, slippage = 0.5) => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // USDT ma 18 decimals na 0G
      const usdtDecimals = 18;
      const amountBigInt = parseUnits(usdtAmount.toString(), usdtDecimals);
      
      if (isTestMode()) {
        console.log(`Swapping ${usdtAmount} USDT (${amountBigInt} wei) to ${token.symbol} using swapExactTokensForTokens`);
      }
      
      // Sprawdź, czy token jest token0 czy token1 w parze
      const token0Address = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'token0',
      });
      
      const isToken0 = token0Address.toLowerCase() === token.address.toLowerCase();
      const isUsdtToken0 = !isToken0; // USDT jest przeciwnym tokenem niż token projektu
      
      // Oblicz oczekiwaną ilość tokenów używając funkcji getAmountOut
      const expectedTokensOut = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'getAmountOut',
        args: [amountBigInt, isUsdtToken0],
      });
      
      // Oblicz minimalną akceptowalną ilość z uwzględnieniem slippage
      const minTokensOut = expectedTokensOut * BigInt(Math.floor(100 * (100 - slippage))) / BigInt(10000);
      
      if (isTestMode()) {
        console.log(`Expected ${token.symbol} out: ${formatUnits(expectedTokensOut, token.decimals)}`);
        console.log(`Min ${token.symbol} out with ${slippage}% slippage: ${formatUnits(minTokensOut, token.decimals)}`);
      }
      
      // Najpierw zatwierdź USDT dla kontraktu pary
      await approveToken(usdtAddress, token.pairAddress, usdtAmount, usdtDecimals);
      
      // Wykonaj swap w jednej transakcji
      const hash = await walletClient.writeContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountBigInt, minTokensOut, isUsdtToken0, address],
      });
      
      setTxHash(hash);
      
      // Czekaj na potwierdzenie transakcji
      await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash,
        amountIn: usdtAmount,
        amountOut: formatUnits(expectedTokensOut, token.decimals),
      };
    } catch (err) {
      console.error('Error swapping exact USDT for token:', err);
      
      // Specjalna obsługa dla błędu "User rejected the request"
      if (err.message && err.message.includes('User rejected the request')) {
        setError('Transaction was cancelled by user');
        throw new Error('Transaction was cancelled by user');
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Zamienia tokeny, aby otrzymać dokładną ilość USDT (nowa metoda)
   * @param {object} token - Obiekt tokenu do sprzedaży
   * @param {string} usdtAmountOut - Oczekiwana ilość USDT do otrzymania
   * @param {string} maxTokensIn - Maksymalna ilość tokenów do wydania
   * @param {number} slippage - Tolerancja na poślizg cenowy (w procentach)
   */
  const swapTokensForExactUsdt = async (token, usdtAmountOut, maxTokensIn, slippage = 0.5) => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const decimals = Number(token.decimals);
      const maxTokensInBigInt = parseUnits(maxTokensIn.toString(), decimals);
      const usdtAmountOutBigInt = parseUnits(usdtAmountOut.toString(), 18);
      
      if (isTestMode()) {
        console.log(`Swapping max ${maxTokensIn} ${token.symbol} to get exactly ${usdtAmountOut} USDT using swapTokensForExactTokens`);
      }
      
      // Sprawdź, czy token jest token0 czy token1 w parze
      const token0Address = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'token0',
      });
      
      const isToken0 = token0Address.toLowerCase() === token.address.toLowerCase();
      
      // Oblicz wymaganą ilość tokenów do sprzedaży używając funkcji getAmountIn
      const requiredTokensIn = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'getAmountIn',
        args: [usdtAmountOutBigInt, isToken0],
      });
      
      // Dodaj slippage do wymaganej ilości tokenów
      const maxRequiredTokensIn = requiredTokensIn * BigInt(Math.floor(100 * (100 + slippage))) / BigInt(10000);
      
      if (isTestMode()) {
        console.log(`Required tokens in: ${formatUnits(requiredTokensIn, decimals)}`);
        console.log(`Max tokens in with ${slippage}% slippage: ${formatUnits(maxRequiredTokensIn, decimals)}`);
      }
      
      // Sprawdź, czy użytkownik ma wystarczającą ilość tokenów
      if (maxRequiredTokensIn > maxTokensInBigInt) {
        throw new Error(`Insufficient token amount. Required: ${formatUnits(maxRequiredTokensIn, decimals)}, Available: ${maxTokensIn}`);
      }
      
      // Najpierw zatwierdź tokeny dla kontraktu pary
      await approveToken(token.address, token.pairAddress, formatUnits(maxRequiredTokensIn, decimals), decimals);
      
      // Wykonaj swap w jednej transakcji
      const hash = await walletClient.writeContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'swapTokensForExactTokens',
        args: [usdtAmountOutBigInt, maxRequiredTokensIn, isToken0, address],
      });
      
      setTxHash(hash);
      
      // Czekaj na potwierdzenie transakcji
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash,
        amountIn: formatUnits(requiredTokensIn, decimals),
        amountOut: usdtAmountOut,
      };
    } catch (err) {
      console.error('Error swapping tokens for exact USDT:', err);
      
      // Specjalna obsługa dla błędu "User rejected the request"
      if (err.message && err.message.includes('User rejected the request')) {
        setError('Transaction was cancelled by user');
        throw new Error('Transaction was cancelled by user');
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Zamienia USDT, aby otrzymać dokładną ilość tokenów (nowa metoda)
   * @param {object} token - Obiekt tokenu do kupienia
   * @param {string} tokenAmountOut - Oczekiwana ilość tokenów do otrzymania
   * @param {string} maxUsdtIn - Maksymalna ilość USDT do wydania
   * @param {number} slippage - Tolerancja na poślizg cenowy (w procentach)
   */
  const swapUsdtForExactTokens = async (token, tokenAmountOut, maxUsdtIn, slippage = 0.5) => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const usdtDecimals = 18;
      const tokenDecimals = Number(token.decimals);
      const maxUsdtInBigInt = parseUnits(maxUsdtIn.toString(), usdtDecimals);
      const tokenAmountOutBigInt = parseUnits(tokenAmountOut.toString(), tokenDecimals);
      
      if (isTestMode()) {
        console.log(`Swapping max ${maxUsdtIn} USDT to get exactly ${tokenAmountOut} ${token.symbol} using swapTokensForExactTokens`);
      }
      
      // Sprawdź, czy token jest token0 czy token1 w parze
      const token0Address = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'token0',
      });
      
      const isToken0 = token0Address.toLowerCase() === token.address.toLowerCase();
      const isUsdtToken0 = !isToken0; // USDT jest przeciwnym tokenem niż token projektu
      
      // Oblicz wymaganą ilość USDT do wydania używając funkcji getAmountIn
      const requiredUsdtIn = await publicClient.readContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'getAmountIn',
        args: [tokenAmountOutBigInt, isUsdtToken0],
      });
      
      // Dodaj slippage do wymaganej ilości USDT
      const maxRequiredUsdtIn = requiredUsdtIn * BigInt(Math.floor(100 * (100 + slippage))) / BigInt(10000);
      
      if (isTestMode()) {
        console.log(`Required USDT in: ${formatUnits(requiredUsdtIn, usdtDecimals)}`);
        console.log(`Max USDT in with ${slippage}% slippage: ${formatUnits(maxRequiredUsdtIn, usdtDecimals)}`);
      }
      
      // Sprawdź, czy użytkownik ma wystarczającą ilość USDT
      if (maxRequiredUsdtIn > maxUsdtInBigInt) {
        throw new Error(`Insufficient USDT amount. Required: ${formatUnits(maxRequiredUsdtIn, usdtDecimals)}, Available: ${maxUsdtIn}`);
      }
      
      // Najpierw zatwierdź USDT dla kontraktu pary
      await approveToken(usdtAddress, token.pairAddress, formatUnits(maxRequiredUsdtIn, usdtDecimals), usdtDecimals);
      
      // Wykonaj swap w jednej transakcji
      const hash = await walletClient.writeContract({
        address: token.pairAddress,
        abi: LF0G_SWAP_PAIR_ABI,
        functionName: 'swapTokensForExactTokens',
        args: [tokenAmountOutBigInt, maxRequiredUsdtIn, isUsdtToken0, address],
      });
      
      setTxHash(hash);
      
      // Czekaj na potwierdzenie transakcji
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash,
        amountIn: formatUnits(requiredUsdtIn, usdtDecimals),
        amountOut: tokenAmountOut,
      };
    } catch (err) {
      console.error('Error swapping USDT for exact tokens:', err);
      
      // Specjalna obsługa dla błędu "User rejected the request"
      if (err.message && err.message.includes('User rejected the request')) {
        setError('Transaction was cancelled by user');
        throw new Error('Transaction was cancelled by user');
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    txHash,
    approveToken,
    swapTokenToUsdt,
    swapUsdtToToken,
    // Nowe metody używające jednoetapowej wymiany
    swapExactTokensForUsdt,
    swapExactUsdtForToken,
    swapTokensForExactUsdt,
    swapUsdtForExactTokens
  };
}; 