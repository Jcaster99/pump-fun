import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from '../../context/NavigationContext';

/**
 * LeaderboardTable component for displaying pool data in a table format
 * 
 * @param {Object} props - Component props
 * @param {Array} props.leaderboardData - Array of leaderboard data
 * @returns {JSX.Element} LeaderboardTable component
 */
const LeaderboardTable = ({ leaderboardData }) => {
  const { theme, darkMode } = useTheme();
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({
    key: 'mcap',
    direction: 'desc'
  });
  
  // Media queries are simulated since we're using inline styles
  const isMobile = window.innerWidth <= 768;
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortedData = () => {
    if (!sortConfig.key) {
      return leaderboardData;
    }
    
    return [...leaderboardData].sort((a, b) => {
      let aValue, bValue;
      
      // Handle different column types
      switch (sortConfig.key) {
        case 'price':
          aValue = parseFloat(a.price_realtime || a.price || 0);
          bValue = parseFloat(b.price_realtime || b.price || 0);
          break;
        case '24h':
          aValue = parseFloat(a.change_24h || 0);
          bValue = parseFloat(b.change_24h || 0);
          break;
        case 'volume':
          aValue = parseFloat(a.volume_24h || 0);
          bValue = parseFloat(b.volume_24h || 0);
          break;
        case 'mcap':
          aValue = parseFloat(a.market_cap || 0);
          bValue = parseFloat(b.market_cap || 0);
          break;
        case 'gravity':
          aValue = parseInt(a.gravity_score || 0);
          bValue = parseInt(b.gravity_score || 0);
          break;
        case 'graduate':
          aValue = parseFloat(a.bonding_curve_percentage || 0);
          bValue = parseFloat(b.bonding_curve_percentage || 0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  
  const sortedData = getSortedData();
  
  const formatChangePercentage = (value) => {
    const isPositive = value >= 0;
    return (
      <div style={{
        color: isPositive ? '#5FE388' : '#FF5252',
        fontSize: '13px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center'
      }}>
        {isPositive ? '+' : ''}{value.toFixed(2)}%
      </div>
    );
  };
  
  const formatVolume = (value) => {
    if (!value && value !== 0) return '$0.00';
    
    const numValue = parseFloat(value);
    if (numValue >= 1000000) {
      return `$${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      return `$${(numValue / 1000).toFixed(2)}K`;
    } else {
      return `$${numValue.toFixed(2)}`;
    }
  };

  const formatGravityScore = (score) => {
    const numScore = parseInt(score || 0);
    return numScore;
  };
  
  const formatGraduateStatus = (percentage, graduated) => {
    // Ensure the value is a number and handle edge cases
    const curvePercentage = percentage !== null && 
                          percentage !== undefined && 
                          !isNaN(percentage) 
                          ? parseFloat(percentage) 
                          : 0;
    
    // Determine color based on progress
    let bgColor;
    if (curvePercentage >= 80) {
      bgColor = 'rgba(95, 227, 136, 0.2)'; // Green for high progress
    } else if (curvePercentage >= 50) {
      bgColor = 'rgba(255, 193, 7, 0.2)'; // Yellow for medium progress
    } else {
      bgColor = 'rgba(150, 150, 180, 0.15)'; // Gray for low progress
    }
    
    // Display graduation status for tokens over 100%
    const showGraduatedStatus = curvePercentage >= 100;
    const isGraduated = graduated === 'yes';
    const statusText = isGraduated ? 'Done' : 'Not yet';
    
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '4px',
        backgroundColor: bgColor,
        fontSize: '13px',
        fontWeight: '500',
        width: 'fit-content'
      }}>
        {curvePercentage.toFixed(2)}%
        {showGraduatedStatus && (
          <span style={{ 
            marginLeft: '6px',
            padding: '1px 6px', 
            borderRadius: '3px', 
            backgroundColor: isGraduated ? 'rgba(95, 227, 136, 0.4)' : 'rgba(255, 193, 7, 0.4)',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {statusText}
          </span>
        )}
      </div>
    );
  };
  
  const handleBuyClick = (item) => {
    // Upewnij się, że item.token_address istnieje
    const tokenAddress = item?.token_address || '0x33ec3fFdf76E6d63ec2ca66acE8e975BB0a2818D';
    navigate(`/pool/${tokenAddress}`);
    
    // Debug info
    console.log(`Navigating to token: ${tokenAddress}`);
  };
  
  const tableContainerStyle = {
    backgroundColor: darkMode ? 'rgba(25, 30, 40, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${darkMode ? 'rgba(60, 60, 90, 0.3)' : 'rgba(230, 230, 240, 0.8)'}`,
    overflowX: isMobile ? 'auto' : 'visible'
  };
  
  const headerStyle = {
    display: 'flex',
    padding: '15px 20px',
    borderBottom: `1px solid ${darkMode ? 'rgba(60, 60, 90, 0.3)' : 'rgba(230, 230, 240, 0.8)'}`,
    color: theme.text.secondary,
    fontSize: '13px',
    fontWeight: '600',
    minWidth: isMobile ? '1000px' : 'auto'
  };
  
  const columnHeaderStyle = (key) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'color 0.2s ease, transform 0.2s ease',
    color: sortConfig.key === key ? theme.accent.primary : theme.text.secondary,
    ':hover': {
      color: theme.accent.primary,
    },
    position: 'relative',
  });
  
  const sortIconStyle = {
    width: '16px',
    height: '16px',
    strokeWidth: 2.5,
  };
  
  // Add hover effect styling
  const getColumnHoverStyle = () => `
    .column-header:hover {
      color: ${theme.accent.primary} !important;
      transform: translateY(-1px);
    }
    
    .column-header:after {
      content: "";
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 0;
      height: 2px;
      background-color: ${theme.accent.primary};
      transition: width 0.2s ease;
    }
    
    .column-header:hover:after {
      width: 100%;
    }
    
    .sort-indicator {
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .column-header:hover .sort-indicator {
      opacity: 0.5;
    }
  `;
  
  const rowStyle = (index, isLast) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: isLast ? 'none' : `1px solid ${darkMode ? 'rgba(60, 60, 90, 0.3)' : 'rgba(230, 230, 240, 0.8)'}`,
    backgroundColor: index % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(30, 35, 45, 0.3)' : 'rgba(248, 248, 252, 0.3)'),
    transition: 'background-color 0.2s ease',
    minWidth: isMobile ? '1000px' : 'auto'
  });
  
  const buyButtonStyle = {
    background: darkMode 
      ? theme.accent.primary
      : `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
    color: darkMode ? '#000' : 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: darkMode ? '0 0 8px rgba(0, 210, 233, 0.5)' : 'none',
    '&:hover': {
      transform: 'translateY(-2px)'
    }
  };
  
  return (
    <div style={tableContainerStyle}>
      <div style={headerStyle}>
        <div style={{ width: '70px', textAlign: 'center' }}>RANK</div>
        <div style={{ flex: 2 }}>TOKEN</div>
        <div 
          className="column-header"
          style={{ flex: 1, ...columnHeaderStyle('price') }}
          onClick={() => handleSort('price')}
        >
          PRICE
          {sortConfig.key === 'price' ? (
            sortConfig.direction === 'asc' ? <ArrowUp style={sortIconStyle} /> : <ArrowDown style={sortIconStyle} />
          ) : (
            <ArrowUp className="sort-indicator" style={{...sortIconStyle, opacity: 0}} />
          )}
        </div>
        <div 
          className="column-header"
          style={{ flex: 1, ...columnHeaderStyle('24h') }}
          onClick={() => handleSort('24h')}
        >
          24H
          {sortConfig.key === '24h' ? (
            sortConfig.direction === 'asc' ? <ArrowUp style={sortIconStyle} /> : <ArrowDown style={sortIconStyle} />
          ) : (
            <ArrowUp className="sort-indicator" style={{...sortIconStyle, opacity: 0}} />
          )}
        </div>
        <div 
          className="column-header"
          style={{ flex: 1, ...columnHeaderStyle('volume') }}
          onClick={() => handleSort('volume')}
        >
          VOLUME
          {sortConfig.key === 'volume' ? (
            sortConfig.direction === 'asc' ? <ArrowUp style={sortIconStyle} /> : <ArrowDown style={sortIconStyle} />
          ) : (
            <ArrowUp className="sort-indicator" style={{...sortIconStyle, opacity: 0}} />
          )}
        </div>
        <div 
          className="column-header"
          style={{ flex: 1, ...columnHeaderStyle('mcap') }}
          onClick={() => handleSort('mcap')}
        >
          MCAP
          {sortConfig.key === 'mcap' ? (
            sortConfig.direction === 'asc' ? <ArrowUp style={sortIconStyle} /> : <ArrowDown style={sortIconStyle} />
          ) : (
            <ArrowUp className="sort-indicator" style={{...sortIconStyle, opacity: 0}} />
          )}
        </div>
        <div 
          className="column-header"
          style={{ flex: 1, ...columnHeaderStyle('gravity') }}
          onClick={() => handleSort('gravity')}
        >
          ØG
          {sortConfig.key === 'gravity' ? (
            sortConfig.direction === 'asc' ? <ArrowUp style={sortIconStyle} /> : <ArrowDown style={sortIconStyle} />
          ) : (
            <ArrowUp className="sort-indicator" style={{...sortIconStyle, opacity: 0}} />
          )}
        </div>
        <div 
          className="column-header"
          style={{ flex: 1, ...columnHeaderStyle('graduate') }}
          onClick={() => handleSort('graduate')}
        >
          GRADUATE STATUS
          {sortConfig.key === 'graduate' ? (
            sortConfig.direction === 'asc' ? <ArrowUp style={sortIconStyle} /> : <ArrowDown style={sortIconStyle} />
          ) : (
            <ArrowUp className="sort-indicator" style={{...sortIconStyle, opacity: 0}} />
          )}
        </div>
        <div style={{ width: '100px', textAlign: 'center' }}>ACTION</div>
      </div>
      
      {sortedData.map((item, index) => (
        <div key={item.id || index} style={rowStyle(index, index === sortedData.length - 1)}>
          {/* Rank */}
          <div style={{ width: '70px', textAlign: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: index < 3 
                ? `rgba(${255 - index * 30}, ${92 + index * 30}, ${170 - index * 20}, 0.15)` 
                : 'rgba(120, 120, 140, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px',
              color: index < 3 
                ? `rgb(${255 - index * 30}, ${92 + index * 30}, ${170 - index * 20})` 
                : theme.text.secondary,
              margin: '0 auto',
              border: index < 3 
                ? `1px solid rgba(${255 - index * 30}, ${92 + index * 30}, ${170 - index * 20}, 0.3)` 
                : `1px solid ${theme.border}`
            }}>
              #{String(index + 1).padStart(2, '0')}
            </div>
          </div>
          
          {/* Token */}
          <div style={{ flex: 2, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginRight: '12px' }}>
              <img 
                src={item.image_url || `https://picsum.photos/seed/${item.symbol || index}/200`}
                alt={item.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
                className="laser-glow"
              />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: theme.text.primary }}>
                {item.name}
              </div>
              <div style={{ fontSize: '13px', color: theme.text.secondary, display: 'flex', alignItems: 'center', gap: '5px' }}>
                by {item.creator_name || 'anonymous'}
                {item.creator_verified && (
                  <div style={{ 
                    width: '14px', 
                    height: '14px', 
                    borderRadius: '50%', 
                    backgroundColor: theme.accent.primary,
                    color: '#fff',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    ✓
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Price */}
          <div style={{ flex: 1, fontWeight: '600', fontSize: '15px', color: theme.text.primary }}>
            ${parseFloat(item.price_realtime || item.price || 0).toFixed(8)}
          </div>
          
          {/* 24h change */}
          <div style={{ flex: 1 }}>
            {formatChangePercentage(item.change_24h || 0)}
          </div>
          
          {/* Volume 24h */}
          <div style={{ flex: 1, color: theme.text.primary }}>
            {formatVolume(item.volume_24h)}
          </div>
          
          {/* Market Cap */}
          <div style={{ flex: 1, color: theme.text.primary }}>
            {item.market_cap_formatted || `$${parseFloat(item.market_cap || 0).toLocaleString()}`}
          </div>
          
          {/* Gravity Score (ØG) */}
          <div style={{ flex: 1, color: theme.text.primary, fontWeight: '500' }}>
            {formatGravityScore(item.gravity_score)}
          </div>
          
          {/* Graduate Status */}
          <div style={{ flex: 1, color: theme.text.primary, fontWeight: '500' }}>
            {formatGraduateStatus(item.bonding_curve_percentage, item.graduated)}
          </div>
          
          {/* Buy button */}
          <div style={{ width: '100px', textAlign: 'center' }}>
            <button 
              style={buyButtonStyle}
              onClick={() => handleBuyClick(item)}
            >
              buy
            </button>
          </div>
        </div>
      ))}
      
      <style jsx="true">{`
        ${getColumnHoverStyle()}
      `}</style>
    </div>
  );
};

export default LeaderboardTable; 