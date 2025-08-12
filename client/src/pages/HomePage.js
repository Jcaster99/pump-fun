import React, { useState, useEffect } from 'react';
import TrendingPools from '../components/pools/TrendingPools';
import PoolsTicker from '../components/pools/PoolsTicker';
import { useTheme } from '../context/ThemeContext';
import { fetchPools, fetchTotalVolume } from '../api/poolsApi';
import { Database, BarChart2 } from 'lucide-react';
import ParticleBackground from '../components/common/ParticleBackground';

const HomePage = () => {
  const { theme, darkMode } = useTheme();
  const [totalPools, setTotalPools] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Fetch total pools count and volume
  useEffect(() => {
    const getStats = async () => {
      try {
        // Fetch total pools count
        const response = await fetchPools({ limit: 1 });
        if (response && response.pagination && response.pagination.total) {
          setTotalPools(response.pagination.total);
        }
        
        // Fetch total volume
        const volume = await fetchTotalVolume();
        setTotalVolume(volume);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    getStats();
  }, []);

  // Format volume for display
  const formatVolume = (volume) => {
    if (!volume) return '$0';
    
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      {/* Tło z cząsteczkami */}
      <ParticleBackground zIndex={0} />
      
      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 5
      }}>
        {/* Pools Ticker */}
        <PoolsTicker />
        
        {/* Stats Counters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '16px auto',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Total Pools Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: darkMode ? 'rgba(35, 35, 48, 0.8)' : 'rgba(245, 245, 248, 0.8)',
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            backdropFilter: 'blur(5px)',
            boxShadow: `0 0 10px rgba(${parseInt(theme.accent.primary.slice(1, 3), 16)}, ${parseInt(theme.accent.primary.slice(3, 5), 16)}, ${parseInt(theme.accent.primary.slice(5, 7), 16)}, 0.15)`,
          }}>
            <Database size={16} color={theme.accent.primary} style={{ marginRight: '8px' }} />
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: theme.text.secondary }}>Total Tokens Created: </span>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                color: theme.text.primary,
                marginLeft: '5px',
                background: `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {totalPools.toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* 24h Volume Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: darkMode ? 'rgba(35, 35, 48, 0.8)' : 'rgba(245, 245, 248, 0.8)',
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            backdropFilter: 'blur(5px)',
            boxShadow: `0 0 10px rgba(${parseInt(theme.accent.primary.slice(1, 3), 16)}, ${parseInt(theme.accent.primary.slice(3, 5), 16)}, ${parseInt(theme.accent.primary.slice(5, 7), 16)}, 0.15)`,
          }}>
            <BarChart2 size={16} color={theme.accent.primary} style={{ marginRight: '8px' }} />
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: theme.text.secondary }}>24h Volume: </span>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                color: theme.text.primary,
                marginLeft: '5px',
                background: `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {formatVolume(totalVolume)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Trending Pools Section */}
        <TrendingPools />
      </div>
    </div>
  );
};

export default HomePage; 