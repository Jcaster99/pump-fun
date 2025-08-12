import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * TimeframeSelector component for selecting different timeframes in leaderboard
 * 
 * @param {Object} props - Component props
 * @param {string} props.timeframe - Current selected timeframe
 * @param {Function} props.setTimeframe - Function to set timeframe
 * @returns {JSX.Element} TimeframeSelector component
 */
const TimeframeSelector = ({ timeframe, setTimeframe }) => {
  const { theme, darkMode } = useTheme();
  
  const containerStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    '@media (max-width: 600px)': {
      justifyContent: 'center'
    }
  };
  
  const getButtonStyle = (buttonTimeframe) => {
    const isActive = timeframe === buttonTimeframe;
    
    return {
      padding: '8px 16px',
      background: isActive 
        ? theme.accent.primary 
        : darkMode ? 'rgba(0, 210, 233, 0.1)' : 'rgba(0, 210, 233, 0.08)',
      border: `1px solid ${isActive ? 'transparent' : darkMode ? 'rgba(0, 210, 233, 0.3)' : 'rgba(0, 210, 233, 0.2)'}`,
      borderRadius: '8px',
      color: isActive ? '#000' : theme.accent.primary,
      fontWeight: isActive ? '600' : '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      boxShadow: isActive ? '0 0 8px rgba(0, 210, 233, 0.5)' : 'none',
      '@media (max-width: 400px)': {
        padding: '6px 12px',
        fontSize: '13px'
      }
    };
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={() => setTimeframe('weekly')}
        style={getButtonStyle('weekly')}
      >
        This Week
      </button>
      <button
        onClick={() => setTimeframe('monthly')}
        style={getButtonStyle('monthly')}
      >
        This Month
      </button>
      <button
        onClick={() => setTimeframe('all-time')}
        style={getButtonStyle('all-time')}
      >
        All Time
      </button>
    </div>
  );
};

export default TimeframeSelector; 