import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPoolByAddress } from '../../api/poolsApi';
import { usePoolDetailsSocket } from '../../context/PoolDetailsSocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../hooks/useWallet';
import PoolDetailsPageView from './PoolDetailsPage.View';

// Style for transition animations
const tabContentAnimations = {
  fadeIn: {
    opacity: 0,
    animation: 'fadeIn 0.4s ease-in-out forwards',
  },
  slideIn: {
    transform: 'translateY(10px)',
    opacity: 0,
    animation: 'slideIn 0.4s ease-out forwards',
  }
};

// Keyframes for animations
const animationKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const PoolDetailsPage = () => {
  const { address } = useParams();
  const { theme, darkMode } = useTheme();
  const { wallet, connectWallet } = useWallet();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chart'); // chart, socials
  const [isMobile, setIsMobile] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [tabChanging, setTabChanging] = useState(false);
  const [graduatingToken, setGraduatingToken] = useState(false);
  const [graduationResult, setGraduationResult] = useState(null);
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [graduationValidation, setGraduationValidation] = useState({
    bondingCurve: false,
    minHolders: false,
    minCreationTime: false,
    minGravityScore: false
  });

  // -------- realtime socket context ---------
  const {
    subscribeToPool,
    unsubscribeCurrent,
    getPoolData,
    poolData,
  } = usePoolDetailsSocket();

  // Check if we're on mobile or large screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLargeScreen(window.innerWidth >= 1200);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handler for tab change with animation
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    
    setTabChanging(true);
    
    // Short delay before changing tab for animation effect
    setTimeout(() => {
      setActiveTab(tab);
      setTabChanging(false);
    }, 150);
  };

  // Function to update holders count
  const handleUpdateHolders = (newHoldersCount) => {
    if (process.env.REACT_APP_TEST === 'true') {
      console.log(`Updating holders count to: ${newHoldersCount}`);
    }
    if (pool && newHoldersCount !== pool.holders) {
      setPool(prevPool => ({
        ...prevPool,
        holders: newHoldersCount
      }));
    }
  };

  // Open graduation confirmation modal with validation checks
  const openGraduationModal = () => {
    if (!pool) return;
    
    // Validate graduation requirements
    const currentDate = new Date();
    const creationDate = new Date(pool.created_at);
    const daysSinceCreation = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24));
    
    // Calculate the ratio of tokens in AMM vs total supply
    const totalSupply = pool.total_supply || 0;
    const totalSupplyAMM = pool.total_supply_tokenAMM || 0;
    const percentSold = 100 - (totalSupplyAMM / totalSupply) * 100;
    
    const validationResults = {
      bondingCurve: percentSold >= 75, // 75% is the minimum requirement
      minHolders: (pool.holders || 0) >= 10,
      minCreationTime: daysSinceCreation >= 7,
      minGravityScore: (pool.gravity_score || 0) >= 600
    };
    
    setGraduationValidation(validationResults);
    setShowGraduationModal(true);
  };

  // Close graduation confirmation modal
  const closeGraduationModal = () => {
    setShowGraduationModal(false);
  };

  // Handle token graduation
  const handleGraduateToken = async () => {
    if (!wallet) {
      connectWallet();
      return;
    }

    if (!pool || graduatingToken) return;
    
    // Open confirmation modal instead of immediate graduation
    openGraduationModal();
  };
  
  // Execute graduation after confirmation
  const executeGraduation = async () => {
    if (!pool || graduatingToken) return;
    
    try {
      setGraduatingToken(true);
      setGraduationResult(null);
      // Close the modal first
      setShowGraduationModal(false);

      // Call graduation API
      const response = await axios.post(`/api/pools/${address}/graduate`, {
        wallet_address: wallet.address
      });

      setGraduationResult({
        success: true,
        message: 'Token graduation process initiated! Transaction is being processed.',
        txHash: response.data.txHash
      });

      // Refresh pool data after graduation
      setTimeout(async () => {
        try {
          const response = await fetchPoolByAddress(address);
          if (response && response.data) {
            setPool(response.data);
          }
        } catch (err) {
          console.error('Error refreshing pool data after graduation:', err);
        }
      }, 10000); // Refresh after 10 seconds
    } catch (error) {
      console.error('Error graduating token:', error);
      setGraduationResult({
        success: false,
        message: error.response?.data?.error || 'Failed to graduate token. Please try again later.'
      });
    } finally {
      setGraduatingToken(false);
    }
  };

  // Check if all requirements are met for graduation
  const areAllRequirementsMet = () => {
    return Object.values(graduationValidation).every(value => value === true);
  };

  // Check if wallet is creator
  const isCreator = pool && wallet && pool.creator_address && 
    wallet.address && wallet.address.toLowerCase() === pool.creator_address.toLowerCase();

  // Fetch pool data when component mounts or address changes
  useEffect(() => {
    const loadPoolData = async () => {
      try {
        setLoading(true);
        const response = await fetchPoolByAddress(address);
        
        if (response && response.data) {
          setPool(response.data);
        } else if (response && response.success === false) {
          setError(response.error || 'Failed to load pool data');
        } else {
          setError('Could not retrieve pool data');
        }
      } catch (err) {
        console.error('Error loading pool details:', err);
        setError('Error loading pool data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      loadPoolData();
    }
  }, [address]);

  // Subscribe on mount / address change
  useEffect(() => {
    if (address) {
      subscribeToPool(address);
    }
    return () => {
      unsubscribeCurrent();
    };
  }, [address, subscribeToPool, unsubscribeCurrent]);

  // Merge realtime updates into pool state
  useEffect(() => {
    if (!pool || !address) return;

    const rt = poolData[address] || getPoolData(address);
    if (!rt || Object.keys(rt).length === 0) return;

    setPool((prev) => {
      if (!prev) return prev;
      const merged = { ...prev };
      if (rt.priceRealtime !== undefined) merged.price_realtime = rt.priceRealtime;
      if (rt.marketCap !== undefined) merged.market_cap = rt.marketCap;
      if (rt.volume !== undefined) merged.volume_24h = rt.volume;
      if (rt.holders !== undefined) merged.holders = rt.holders;
      if (rt.totalSupply !== undefined) merged.total_supply = rt.totalSupply;
      if (rt.totalSupplyTokenAMM !== undefined) merged.total_supply_tokenAMM = rt.totalSupplyTokenAMM;
      return merged;
    });
  }, [poolData, address, pool, getPoolData]);

  // Pass all props to the view component
  return (
    <PoolDetailsPageView
      pool={pool}
      loading={loading}
      error={error}
      activeTab={activeTab}
      isMobile={isMobile}
      isLargeScreen={isLargeScreen}
      tabChanging={tabChanging}
      theme={theme}
      darkMode={darkMode}
      animationKeyframes={animationKeyframes}
      tabContentAnimations={tabContentAnimations}
      handleTabChange={handleTabChange}
      handleUpdateHolders={handleUpdateHolders}
      wallet={wallet}
      isCreator={isCreator}
      handleGraduateToken={handleGraduateToken}
      graduatingToken={graduatingToken}
      graduationResult={graduationResult}
      showGraduationModal={showGraduationModal}
      closeGraduationModal={closeGraduationModal}
      executeGraduation={executeGraduation}
      graduationValidation={graduationValidation}
      areAllRequirementsMet={areAllRequirementsMet}
    />
  );
};

export default PoolDetailsPage; 