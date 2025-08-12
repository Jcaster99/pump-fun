import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, Info, BarChart2, Sliders, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useGraduatedTokens } from '../../hooks/useTokens';
import { useSwap } from '../../hooks/useSwap';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectWalletButton } from '../wallet/RainbowKitProvider';
import toast from 'react-hot-toast';
import SwapInterfaceUI from './SwapInterfaceUI';
import { getTransactionExplorerUrl } from '../../utils/explorer';
import { getContractAddress } from '../../config/env';
import { parseUnits } from 'viem';
import { ERC20_ABI } from '../../constants/abi';

// Główny komponent kontenerowy, który zarządza stanem i logiką
const SwapInterface = ({ 
  externalShowSettings, 
  externalToggleSettings, 
  externalSlippage, 
  externalSetSlippage,
  externalUseOneStepSwap,
  externalSetUseOneStepSwap
}) => {
  // Theme context
  const { darkMode, theme } = useTheme();
  
  // Swap state
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [selectingToken, setSelectingToken] = useState('from'); // 'from' or 'to'
  
  // Lokalne stany, które mogą być nadpisane przez props zewnętrzne
  const [localUseOneStepSwap, setLocalUseOneStepSwap] = useState(true);
  
  // Stany do śledzenia etapów procesu swap
  const [swapStage, setSwapStage] = useState('idle'); // 'idle', 'approve', 'transfer', 'swap'
  const [currentTxHash, setCurrentTxHash] = useState(null);
  
  // Use external settings state if provided, otherwise use local state
  const showSettings = externalShowSettings !== undefined ? externalShowSettings : false;
  const toggleSettings = externalToggleSettings || (() => {});
  
  // Use external slippage if provided
  const slippage = externalSlippage !== undefined ? externalSlippage : 0.5;
  const setSlippage = externalSetSlippage || (() => {});
  
  // Use external useOneStepSwap if provided
  const useOneStepSwap = externalUseOneStepSwap !== undefined ? externalUseOneStepSwap : localUseOneStepSwap;
  const setUseOneStepSwap = externalSetUseOneStepSwap || setLocalUseOneStepSwap;
  
  // Upewnij się, że slippage jest zawsze liczbą
  useEffect(() => {
    if (slippage === '' || isNaN(slippage)) {
      setSlippage(0.5);
    }
  }, [slippage, setSlippage]);
  
  // UI interaction states
  const [isSwapping, setIsSwapping] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  
  // Calculated values
  const [exchangeRate, setExchangeRate] = useState(0);
  const [priceImpact, setPriceImpact] = useState(0);
  const [minimumReceived, setMinimumReceived] = useState(0);
  
  // Get tokens from graduated tokens registry
  const { tokens, loading: tokensLoading, error: tokensError, refreshTokenBalances } = useGraduatedTokens();
  
  // Get swap functionality
  const { 
    swapTokenToUsdt, 
    swapUsdtToToken, 
    swapExactTokensForUsdt,
    swapExactUsdtForToken,
    approveToken, 
    loading: swapLoading, 
    error: swapError 
  } = useSwap();
  
  // Get user account & clients
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // Adres USDT
  const usdtAddress = getContractAddress('USDT');
  
  // Set USDT as default toToken
  useEffect(() => {
    if (tokens && tokens.length > 0) {
      // Find USDT in tokens list, or use first token
      const usdtToken = tokens.find(t => t.symbol === 'USDT') || tokens[0];
      
      // Set default tokens
      if (!fromToken) {
        const defaultToken = tokens.find(t => t.symbol !== 'USDT') || tokens[0];
        setFromToken(defaultToken);
      }
      
      if (!toToken) {
        setToToken(usdtToken);
      }
    }
  }, [tokens]);
  
  // Aktualizuj referencje tokenów po każdym odświeżeniu tokenów
  useEffect(() => {
    if (tokens && tokens.length > 0) {
      console.log('[DEBUG] Synchronizacja referencji tokenów po aktualizacji');
      
      // Jeśli fromToken i toToken istnieją, zaktualizuj ich referencje
      if (fromToken) {
        // Znajdź aktualny token w nowej liście tokenów po adresie
        const updatedFromToken = tokens.find(t => t.address === fromToken.address);
        if (updatedFromToken) {
          console.log('[DEBUG] Aktualizacja fromToken:', updatedFromToken.symbol, 'nowy balans:', updatedFromToken.userBalance);
          setFromToken(updatedFromToken);
        }
      }
      
      if (toToken) {
        // Znajdź aktualny token w nowej liście tokenów po adresie
        const updatedToToken = tokens.find(t => t.address === toToken.address);
        if (updatedToToken) {
          console.log('[DEBUG] Aktualizacja toToken:', updatedToToken.symbol, 'nowy balans:', updatedToToken.userBalance);
          setToToken(updatedToToken);
        }
      }
    }
  }, [tokens]);
  
  // Token selection
  const openTokenSelect = (which) => {
    setSelectingToken(which);
    setShowTokenSelect(true);
  };
  
  // Handle token selection
  const selectToken = (token) => {
    if (selectingToken === 'from') {
      setFromToken(token);

      // Wybierz preferowany token po drugiej stronie (USDT, a jeśli brak – pierwszy inny token)
      if (!toToken || token.address === toToken.address) {
        const preferred = tokens.find(t => t.symbol === 'USDT' && t.address !== token.address) ||
                         tokens.find(t => t.address !== token.address);
        if (preferred) setToToken(preferred);
      }
    } else { // 'to'
      setToToken(token);

      // Wybierz preferowany token po pierwszej stronie
      if (!fromToken || token.address === fromToken.address) {
        const preferred = tokens.find(t => t.symbol === 'USDT' && t.address !== token.address) ||
                         tokens.find(t => t.address !== token.address);
        if (preferred) setFromToken(preferred);
      }
    }
    
    setShowTokenSelect(false);
    
    // Resetuj kwoty po zmianie tokenów
    setFromAmount('');
    setToAmount('');
    
    // Logi debugowania
    console.log('[DEBUG] Tokens after selection:', { fromToken: selectingToken === 'from' ? token : fromToken, toToken: selectingToken === 'to' ? token : toToken });
  };
  
  // Swap direction with animation
  const swapTokens = () => {
    setIsSwapping(true);
    
    setTimeout(() => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
      
      setIsSwapping(false);
    }, 300);
  };
  
  // Calculate amounts and exchange rate
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      // Set exchange rate based on token prices
      const fromTokenPrice = parseFloat(fromToken.price) || 0;
      const toTokenPrice = parseFloat(toToken.price) || 0;
      
      // Calculate exchange rate: how many toTokens per 1 fromToken
      const rate = toTokenPrice > 0 ? fromTokenPrice / toTokenPrice : 0;
      setExchangeRate(rate);
      
      // Calculate output amount
      const calculated = parseFloat(fromAmount) * rate;
      setToAmount(calculated.toFixed(6));
      
      // Calculate minimum amount with slippage
      const minAmount = calculated * (1 - slippage/100);
      setMinimumReceived(minAmount.toFixed(6));
      
      // Calculate price impact (simplified)
      // In a real app, you would calculate this based on actual reserves
      const reserveFrom = parseFloat(fromToken.tokenReserve) || 0;
      
      // Special handling for USDT which may not have tokenReserve property
      // or may have very small reserve causing infinite price impact
      if (fromToken.symbol === 'USDT' || reserveFrom <= 0) {
        // For USDT, set a reasonable price impact based on amount
        // Using a logarithmic scale to make impact reasonable
        const amount = parseFloat(fromAmount);
        if (amount > 0) {
          // Small amounts = small impact, larger amounts = reasonable impact
          const impact = Math.min(Math.log10(amount) * 0.5, 5).toFixed(2);
          setPriceImpact(impact);
        } else {
          setPriceImpact('0');
        }
      } else {
        // Normal calculation for non-USDT tokens
        const amountRatio = parseFloat(fromAmount) / reserveFrom;
        // Cap price impact at 99.99% to avoid showing "infinite"
        const impact = Math.min(amountRatio * 100, 99.99).toFixed(2);
        setPriceImpact(impact);
      }
    } else {
      setToAmount('');
      setMinimumReceived(0);
      setExchangeRate(0);
      setPriceImpact(0);
    }
  }, [fromToken, toToken, fromAmount, slippage]);
  
  // Handle input changes
  const handleFromAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) { // Allow only numbers and decimal point
      setFromAmount(value);
    }
  };
  
  const handleToAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) { // Allow only numbers and decimal point
      setToAmount(value);
      // Calculate from amount based on to amount if exchange rate is valid
      if (value && parseFloat(value) > 0 && exchangeRate > 0) {
        const calculated = parseFloat(value) / exchangeRate;
        setFromAmount(calculated.toFixed(6));
        // Update minimum received
        const minAmount = parseFloat(value) * (1 - slippage/100);
        setMinimumReceived(minAmount.toFixed(6));
      } else {
        setFromAmount('');
        setMinimumReceived(0);
      }
    }
  };
  
  // Set max amount
  const setMaxAmount = () => {
    if (fromToken && fromToken.userBalance) {
      setFromAmount(fromToken.userBalance);
    }
  };
  
  // Execute swap
  const executeSwap = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!walletClient || !publicClient) {
      toast.error('Wallet connection error');
      return;
    }
    
    try {
      // Początkowe powiadomienie
      const loadingToast = toast.loading(
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
          <div>Preparing transaction...</div>
        </div>
      );
      
      let result;
      
      // Jeśli używamy jednoetapowego swapa i mamy bezpośrednią wymianę (token->USDT lub USDT->token)
      if (useOneStepSwap && (fromToken.symbol === 'USDT' || toToken.symbol === 'USDT')) {
        // Jeśli fromToken jest USDT, swap USDT to token
        if (fromToken.symbol === 'USDT') {
          setSwapStage('approve');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Approving USDT...</div>
            </div>, 
            { id: loadingToast }
          );
          
          result = await swapExactUsdtForToken(toToken, fromAmount, slippage);
        } 
        // Jeśli toToken jest USDT, swap token to USDT
        else if (toToken.symbol === 'USDT') {
          setSwapStage('approve');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Approving {fromToken.symbol}...</div>
            </div>, 
            { id: loadingToast }
          );
          
          result = await swapExactTokensForUsdt(fromToken, fromAmount, slippage);
        }
        
        // Pobierz hash transakcji i zaktualizuj
        if (result && result.hash) {
          setCurrentTxHash(result.hash);
          setSwapStage('swap');
        }
      }
      // Użyj dwuetapowego swapa albo dla tokenu do tokenu (zawsze dwuetapowy) albo jeśli użytkownik wybrał dwuetapowy
      else {
        // Jeśli fromToken jest USDT, swap USDT to token
        if (fromToken.symbol === 'USDT') {
          // Approve
          setSwapStage('approve');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Approving USDT...</div>
            </div>, 
            { id: loadingToast }
          );
          
          const approveHash = await approveToken(usdtAddress, toToken.pairAddress, fromAmount, 18);
          setCurrentTxHash(approveHash);
          
          // Transfer
          setSwapStage('transfer');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Transferring USDT to pair...</div>
            </div>, 
            { id: loadingToast }
          );
          
          const amountBigInt = parseUnits(fromAmount.toString(), 18);
          const transferHashUsdt = await walletClient.writeContract({
            address: usdtAddress,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [toToken.pairAddress, amountBigInt],
          });
          
          setCurrentTxHash(transferHashUsdt);
          await publicClient.waitForTransactionReceipt({ hash: transferHashUsdt });
          
          // Swap
          setSwapStage('swap');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Executing swap...</div>
            </div>, 
            { id: loadingToast }
          );
          
          result = await swapUsdtToToken(toToken, fromAmount);
        } else if (toToken.symbol === 'USDT') {
          // Approve
          setSwapStage('approve');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Approving {fromToken.symbol}...</div>
            </div>, 
            { id: loadingToast }
          );
          
          const approveHash = await approveToken(fromToken.address, fromToken.pairAddress, fromAmount, fromToken.decimals);
          setCurrentTxHash(approveHash);
          
          // Transfer
          setSwapStage('transfer');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Transferring {fromToken.symbol} to pair...</div>
            </div>, 
            { id: loadingToast }
          );
          
          const decimals = Number(fromToken.decimals);
          const amountBigInt = parseUnits(fromAmount.toString(), decimals);
          const transferHash = await walletClient.writeContract({
            address: fromToken.address,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [fromToken.pairAddress, amountBigInt],
          });
          
          setCurrentTxHash(transferHash);
          await publicClient.waitForTransactionReceipt({ hash: transferHash });
          
          // Swap
          setSwapStage('swap');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Executing swap...</div>
            </div>, 
            { id: loadingToast }
          );
          
          result = await swapTokenToUsdt(fromToken, fromAmount);
        } else {
          // For token to token swaps, we need to do two swaps
          // First swap fromToken to USDT
          setSwapStage('approve');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Approving {fromToken.symbol}...</div>
            </div>, 
            { id: loadingToast }
          );
          
          // Approve first token
          const firstApproveHash = await approveToken(fromToken.address, fromToken.pairAddress, fromAmount, fromToken.decimals);
          setCurrentTxHash(firstApproveHash);
          
          // Transfer first token
          setSwapStage('transfer');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Transferring {fromToken.symbol} to first pair...</div>
            </div>, 
            { id: loadingToast }
          );
          
          // First swap
          setSwapStage('swap');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Swapping {fromToken.symbol} to USDT...</div>
            </div>, 
            { id: loadingToast }
          );
          
          const firstSwap = await swapTokenToUsdt(fromToken, fromAmount);
          
          // Now swap USDT to toToken
          setSwapStage('approve');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Approving USDT for second swap...</div>
            </div>, 
            { id: loadingToast }
          );
          
          // Second approve (USDT)
          const secondApproveHash = await approveToken(usdtAddress, toToken.pairAddress, firstSwap.amountOut, 18);
          setCurrentTxHash(secondApproveHash);
          
          // Transfer USDT
          setSwapStage('transfer');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Transferring USDT to second pair...</div>
            </div>, 
            { id: loadingToast }
          );
          
          // Second swap
          setSwapStage('swap');
          toast.loading(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap</div>
              <div>Swapping USDT to {toToken.symbol}...</div>
            </div>, 
            { id: loadingToast }
          );
          
          result = await swapUsdtToToken(toToken, firstSwap.amountOut);
        }
      }
      
      // Reset swap states
      setSwapStage('idle');
      setCurrentTxHash(null);
      
      toast.dismiss(loadingToast);
      
      // Pokaż powiadomienie o sukcesie z linkiem do transakcji
      if (result.hash) {
        const explorerUrl = getTransactionExplorerUrl(result.hash);
        toast.success(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Swap successful!</div>
            <a 
              href={explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: '#38bdf8', 
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}
            >
              View on explorer
              <ExternalLink size={14} style={{ marginLeft: '4px' }} />
            </a>
          </div>
        );
      } else {
        toast.success('Swap successful!');
      }
      
      // Odśwież balanse tokenów po wykonaniu swapa
      console.log('[DEBUG] Refreshing token balances after swap');
      await refreshTokenBalances();
      
      // Reset amounts
      setFromAmount('');
      setToAmount('');
    } catch (err) {
      toast.dismiss();
      setSwapStage('idle');
      setCurrentTxHash(null);
      // Wyświetl przyjazny komunikat dla użytkownika
      const isUserCancelled = err.message && err.message.includes('Transaction was cancelled by user');
      toast.error(
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {isUserCancelled ? 'Transaction cancelled' : 'Swap failed'}
          </div>
          <div>
            {isUserCancelled 
              ? 'The transaction was rejected in your wallet' 
              : err.message}
          </div>
        </div>
      );
    }
  };
  
  // Button state
  const getButtonState = () => {
    if (swapStage !== 'idle') {
      switch (swapStage) {
        case 'approve':
          return { 
            disabled: true, 
            text: `Approving ${fromToken?.symbol === 'USDT' ? 'USDT' : fromToken?.symbol || 'tokens'}...`,
            hash: currentTxHash
          };
        case 'transfer':
          return { 
            disabled: true, 
            text: `Transferring to pool...`, 
            hash: currentTxHash 
          };
        case 'swap':
          return { 
            disabled: true, 
            text: 'Executing swap...', 
            hash: currentTxHash
          };
        default:
          return { disabled: true, text: 'Processing...' };
      }
    }
    
    if (swapLoading) {
      return { disabled: true, text: 'Swapping...' };
    }
    
    if (!isConnected) {
      return { disabled: true, text: 'Connect Wallet' };
    }
    
    if (!fromToken || !toToken) {
      return { disabled: true, text: 'Select tokens' };
    }
    
    if (!fromAmount || parseFloat(fromAmount) === 0) {
      return { disabled: true, text: 'Enter an amount' };
    }
    
    if (fromToken && parseFloat(fromAmount) > parseFloat(fromToken.userBalance)) {
      return { disabled: true, text: `Insufficient ${fromToken.symbol} balance` };
    }
    
    return { disabled: false, text: 'Swap' };
  };
  
  const buttonState = getButtonState();
  
  return (
    <SwapInterfaceUI
      theme={theme}
      darkMode={darkMode}
      fromToken={fromToken}
      toToken={toToken}
      fromAmount={fromAmount}
      toAmount={toAmount}
      slippage={slippage}
      showSettings={showSettings}
      showTokenSelect={showTokenSelect}
      selectingToken={selectingToken}
      exchangeRate={exchangeRate}
      priceImpact={priceImpact}
      minimumReceived={minimumReceived}
      isSwapping={isSwapping}
      buttonHover={buttonHover}
      buttonState={buttonState}
      tokens={tokens}
      tokensLoading={tokensLoading}
      isConnected={isConnected}
      useOneStepSwap={useOneStepSwap}
      setUseOneStepSwap={setUseOneStepSwap}
      
      // Handlers
      toggleSettings={toggleSettings}
      openTokenSelect={openTokenSelect}
      selectToken={selectToken}
      swapTokens={swapTokens}
      handleFromAmountChange={handleFromAmountChange}
      handleToAmountChange={handleToAmountChange}
      setMaxAmount={setMaxAmount}
      executeSwap={executeSwap}
      setButtonHover={setButtonHover}
      setSlippage={setSlippage}
      setShowTokenSelect={setShowTokenSelect}
    />
  );
};

export default SwapInterface; 