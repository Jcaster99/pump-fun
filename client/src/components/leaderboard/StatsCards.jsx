import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, Flame, Users, DollarSign } from 'lucide-react';
import { getFormattedTotalVolume, getFormattedTotalHolders, getHighestTokenPrice } from './utils';

/**
 * StatsCards component for displaying statistics in the leaderboard
 * 
 * @param {Object} props - Component props
 * @param {Array} props.leaderboardData - Array of leaderboard data
 * @returns {JSX.Element} StatsCards component
 */
const StatsCards = ({ leaderboardData }) => {
  const { theme, darkMode } = useTheme();
  
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '32px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    },
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
      marginTop: '24px',
      gap: '16px'
    }
  };
  
  const cardStyle = {
    backgroundColor: darkMode ? 'rgba(25, 30, 40, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${darkMode ? 'rgba(60, 60, 90, 0.3)' : 'rgba(230, 230, 240, 0.8)'}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    '@media (max-width: 480px)': {
      padding: '16px',
    }
  };
  
  const iconContainerStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 210, 233, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (max-width: 480px)': {
      width: '36px',
      height: '36px',
    }
  };
  
  const titleStyle = {
    fontSize: '13px',
    color: theme.text.secondary,
    '@media (max-width: 480px)': {
      fontSize: '12px',
    }
  };
  
  const valueStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: theme.text.primary,
    '@media (max-width: 480px)': {
      fontSize: '18px',
    }
  };
  
  return (
    <div style={containerStyle}>
      {/* Total Trading Volume Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={iconContainerStyle}>
            <TrendingUp size={20} color={theme.accent.primary} />
          </div>
          <div>
            <div style={titleStyle}>
              Total Trading Volume
            </div>
            <div style={valueStyle}>
              ${getFormattedTotalVolume(leaderboardData)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Total Tokens Tracked Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={iconContainerStyle}>
            <Flame size={20} color={theme.accent.primary} />
          </div>
          <div>
            <div style={titleStyle}>
              Total Tokens Tracked
            </div>
            <div style={valueStyle}>
              {leaderboardData.length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Total Unique Holders Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={iconContainerStyle}>
            <Users size={20} color={theme.accent.primary} />
          </div>
          <div>
            <div style={titleStyle}>
              Total Unique Holders
            </div>
            <div style={valueStyle}>
              {getFormattedTotalHolders(leaderboardData)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Highest Token Price Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={iconContainerStyle}>
            <DollarSign size={20} color={theme.accent.primary} />
          </div>
          <div>
            <div style={titleStyle}>
              Highest Token Price
            </div>
            <div style={valueStyle}>
              ${getHighestTokenPrice(leaderboardData)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards; 