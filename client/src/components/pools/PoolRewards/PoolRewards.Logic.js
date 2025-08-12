import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { ethers } from 'ethers';
import { useContractRead, useContractWrite, usePublicClient, useWalletClient } from 'wagmi';
import { toast } from 'react-hot-toast';
import { BONDING_CURVE_TOKEN_ABI, TOKEN_FACTORY_ABI, DEPLOYMENT_INFO } from '../../../utils/contractABIs';
import { createToastStyles, toastIcons, defaultToastConfig } from '../../../utils/toastConfig';
import { useTheme } from '../../../context/ThemeContext';
import PoolRewardsView from './PoolRewards.View';

// URL do serwera API
const API_URL = process.env.REACT_APP_LF0G_FACTORY_URL || 'http://localhost:5005';

const PoolRewards = ({ pool, theme, darkMode }) => {
  const { wallet } = useWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { theme: themeContext, darkMode: darkModeContext } = useTheme();
  
  // Use theme from props first, then from context
  const currentTheme = theme || themeContext;
  const isDarkMode = darkMode !== undefined ? darkMode : darkModeContext;
  
  // Toast styles
  const { baseToastStyle, successToastStyle, errorToastStyle } = createToastStyles(currentTheme, isDarkMode);
  
  // State
  const [isCreator, setIsCreator] = useState(false);
  const [gravityScore, setGravityScore] = useState(0);
  const [thresholds, setThresholds] = useState({});
  const [claimableTokens, setClaimableTokens] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimButtonState, setClaimButtonState] = useState({
    200: 'locked',
    400: 'locked',
    600: 'locked',
    800: 'locked',
    1000: 'locked'
  });
  
  // Constants for milestone thresholds
  const MILESTONES = [200, 400, 600, 800, 1000];
  
  const fetchedRef = useRef(false);
  const RETRY_DELAY_MS = 5000;
  
  // Check if user is creator
  useEffect(() => {
    const checkCreatorStatus = async () => {
      if (!wallet || !pool || !pool.token_address) return;
      
      try {
        // Check if current wallet matches creator_address
        if (pool.creator_address && wallet.address) {
          const isCreator = pool.creator_address.toLowerCase() === wallet.address.toLowerCase();
          setIsCreator(isCreator);
        }
        
        // Get gravity score from contract
        const gravityScore = await publicClient.readContract({
          address: pool.token_address,
          abi: BONDING_CURVE_TOKEN_ABI,
          functionName: 'gravityScore'
        });
        
        setGravityScore(Number(gravityScore));
      } catch (error) {
        console.error('Error checking creator status:', error);
      }
    };
    
    checkCreatorStatus();
  }, [wallet, pool, publicClient]);
  
  // Check thresholds and claimable tokens
  useEffect(() => {
    const checkThresholds = async () => {
      if (!pool || !pool.token_address || !isCreator || fetchedRef.current) return;
      fetchedRef.current = true;
      try {
        const thresholdStates = {};
        const buttonStates = { ...claimButtonState };
        
        for (const milestone of MILESTONES) {
          const reached = await publicClient.readContract({
            address: pool.token_address,
            abi: BONDING_CURVE_TOKEN_ABI,
            functionName: 'thresholdReached',
            args: [milestone]
          });
          thresholdStates[milestone] = reached;
          if (reached) {
            buttonStates[milestone] = 'claimable';
          } else if (gravityScore >= milestone) {
            buttonStates[milestone] = 'pending';
          } else {
            buttonStates[milestone] = 'locked';
          }
        }
        const totalUnlocked = await publicClient.readContract({
          address: pool.token_address,
          abi: BONDING_CURVE_TOKEN_ABI,
          functionName: 'totalUnlockedTokens'
        });
        const claimable = ethers.utils.formatUnits(totalUnlocked, 18);
        setClaimableTokens(claimable);
        const hasUnclaimed = parseFloat(claimable) > 0;
        for (const milestone of MILESTONES) {
          if (thresholdStates[milestone]) {
            buttonStates[milestone] = hasUnclaimed ? 'claimable' : 'claimed';
          }
        }
        setThresholds(thresholdStates);
        setClaimButtonState(buttonStates);
      } catch (error) {
        console.error('Error checking threshold status:', error);
        fetchedRef.current = false;
        if (error?.message?.includes('request limit') || error?.code === -32011) {
          setTimeout(() => {
            fetchedRef.current = false;
            setThresholds((prev) => ({ ...prev }));
          }, RETRY_DELAY_MS);
        }
      }
    };
    checkThresholds();
  }, [pool, isCreator, publicClient, gravityScore]);
  
  // Claim tokens function
  const handleClaimTokens = useCallback(async (threshold) => {
    if (!wallet || !pool || !pool.token_address || !isCreator) {
      toast.error('Connect your wallet to claim tokens', { 
        position: defaultToastConfig.position,
        style: errorToastStyle
      });
      return;
    }
    
    try {
      setIsClaiming(true);
      
      // Update button state to loading for this threshold
      setClaimButtonState(prev => ({
        ...prev,
        [threshold]: 'loading'
      }));
      
      toast.loading(
        'Claiming tokens...', 
        { 
          id: 'claiming',
          position: defaultToastConfig.position,
          style: baseToastStyle
        }
      );
      
      // Check if there are tokens to claim in the contract
      const totalUnlockedBefore = await publicClient.readContract({
        address: pool.token_address,
        abi: BONDING_CURVE_TOKEN_ABI,
        functionName: 'totalUnlockedTokens'
      });
      if (totalUnlockedBefore === 0n) {
        toast.dismiss('claiming');
        toast.error('No tokens to claim', {
          position: defaultToastConfig.position,
          style: errorToastStyle,
          icon: toastIcons.error()
        });
        setClaimButtonState(prev => ({
          ...prev,
          [threshold]: 'claimed'
        }));
        return;
      }

      // Bezpośrednio wysyłamy żądanie do API zamiast próbować transakcje blockchain
      console.log('Wysyłanie żądania do API:', `${API_URL}/api/claim-tokens`);
      const response = await fetch(`${API_URL}/api/claim-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress: pool.token_address,
          userAddress: wallet.address
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown API error');
      }
      
      console.log('API claim succeeded:', result);
      
      toast.dismiss('claiming');
      toast.success('Tokens claimed successfully!', { 
        position: defaultToastConfig.position,
        style: successToastStyle,
        icon: toastIcons.success(currentTheme)
      });
      
      // Update UI state
      setClaimButtonState(prev => ({
        ...prev,
        [threshold]: 'claimed'
      }));
      
      // Update thresholds
      fetchedRef.current = false;
      setThresholds((prev) => ({ ...prev }));
      
      // Reset claimable tokens
      setClaimableTokens(0);
    } catch (error) {
      toast.dismiss('claiming');
      toast.error(`Failed to claim tokens: ${error.message || 'Unknown error'}`, { 
        position: defaultToastConfig.position,
        style: errorToastStyle,
        icon: toastIcons.error()
      });
      
      // Reset button state
      setClaimButtonState(prev => ({
        ...prev,
        [threshold]: gravityScore >= threshold ? 'claimable' : 'locked'
      }));
      
      console.error('Error claiming tokens:', error);
    } finally {
      setIsClaiming(false);
    }
  }, [wallet, publicClient, pool, isCreator, gravityScore, baseToastStyle, successToastStyle, errorToastStyle, currentTheme]);
  
  return (
    <PoolRewardsView
      pool={pool}
      theme={currentTheme}
      darkMode={isDarkMode}
      wallet={wallet}
      isCreator={isCreator}
      gravityScore={gravityScore}
      claimableTokens={claimableTokens}
      thresholds={thresholds}
      isClaiming={isClaiming}
      handleClaimTokens={handleClaimTokens}
      claimButtonState={claimButtonState}
    />
  );
};

export default PoolRewards; 