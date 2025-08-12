import React, { useState, useEffect } from 'react';
import { fetchPoolHoldersList } from '../../api/holdersApi';

const TopHoldersList = ({ pool, theme, darkMode }) => {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  // Prefer token_address; fall back to contract_address
  const poolAddress = pool?.token_address || pool?.contract_address;
  
  useEffect(() => {
    const loadHolders = async () => {
      try {
        setLoading(true);
        // We'll add this function to holdersApi.js
        const response = await fetchPoolHoldersList(poolAddress);
        
        if (response.success) {
          // Sort holders by percentage and take top 20
          const sortedHolders = response.holders
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 20);
          
          setHolders(sortedHolders);
        } else {
          setError(response.error || 'Failed to load holders list');
        }
      } catch (err) {
        console.error('Error loading holders list:', err);
        setError('Error loading holders list. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (poolAddress) {
      loadHolders();
    }
  }, [poolAddress]);

  // Format large numbers in a readable way (1B, 2M, 500K etc)
  const formatTokenAmount = (amount) => {
    if (!amount) return '0';
    
    // Convert to number if it's a string
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(2);
    }
  };
  
  // Get visible holders (5 if not expanded, all if expanded)
  const visibleHolders = expanded ? holders : holders.slice(0, 5);
  
  // Render a single holder item
  const renderHolderItem = (holder, index) => {
    const displayIndex = (index + 1).toString().padStart(2, '0');
    
    return (
      <div 
        key={index} 
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: darkMode ? 'rgba(30, 30, 40, 0.5)' : 'rgba(240, 240, 250, 0.5)',
          marginBottom: '8px',
          backdropFilter: 'blur(5px)',
          border: `1px solid ${darkMode ? 'rgba(60, 60, 80, 0.3)' : 'rgba(200, 200, 220, 0.5)'}`,
        }}
      >
        <span style={{ 
          width: '24px', 
          color: theme.text.secondary,
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {displayIndex}
        </span>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginRight: '8px'
        }}>
          <img 
            src="/dance.gif" 
            alt="Zero dance"
            style={{ 
              width: '20px', 
              height: '20px',
              borderRadius: '50%',
              marginRight: '8px'
            }}
          />
          <span style={{ 
            color: theme.text.primary, 
            fontWeight: '500',
            fontSize: '14px'
          }}>
            {holder.username}
          </span>
        </div>
        
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* Token amount */}
          <span style={{
            color: theme.text.secondary,
            fontSize: '13px'
          }}>
            {formatTokenAmount(holder.amount)}
          </span>
          
          {/* Percentage */}
          <span style={{
            color: holder.username === 'bonding_curve' 
              ? '#00D2FF' 
              : holder.username === 'dev' 
                ? '#FF5CAA' 
                : theme.text.primary,
            fontWeight: '600',
            fontSize: '13px'
          }}>
            {holder.percentage.toFixed(2)}%
          </span>
        </div>
      </div>
    );
  };
  
  // Render show more/less button
  const renderShowMoreButton = () => {
    if (holders.length <= 5) return null;
    
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '8px 16px',
          marginTop: '12px',
          cursor: 'pointer',
          color: theme.accent.primary,
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          transition: 'background-color 0.2s ease',
          ':hover': {
            backgroundColor: darkMode ? 'rgba(30, 30, 40, 0.5)' : 'rgba(240, 240, 250, 0.5)'
          }
        }}
      >
        {expanded ? 'Show Less' : `Show More (${holders.length - 5})`}
      </button>
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <div style={{ 
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.text.secondary
      }}>
        Loading top holders...
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div style={{ 
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        color: '#FF5757',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>{error}</p>
      </div>
    );
  }
  
  // If no holders, show message
  if (holders.length === 0) {
    return (
      <div style={{ 
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.text.secondary
      }}>
        No holders found
      </div>
    );
  }
  
  return (
    <div style={{ 
      backgroundColor: theme.bg.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0',
        fontSize: '18px', 
        fontWeight: '600',
        color: theme.text.primary
      }}>
        Top Holders
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visibleHolders.map((holder, index) => renderHolderItem(holder, index))}
        
        {renderShowMoreButton()}
      </div>
    </div>
  );
};

export default TopHoldersList; 