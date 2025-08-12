import React from 'react';
import { Crown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import TimeframeSelector from './TimeframeSelector';

/**
 * LeaderboardInfo component displays the title and description of the leaderboard
 * 
 * @param {Object} props - Component props
 * @param {string} props.timeframe - Current selected timeframe
 * @param {Function} props.setTimeframe - Function to set timeframe
 * @returns {JSX.Element} LeaderboardInfo component
 */
const LeaderboardInfo = ({ timeframe, setTimeframe }) => {
  const { theme, darkMode } = useTheme();
  
  // Media queries are implemented through style conditionals
  const isMobile = window.innerWidth <= 480;
  
  const titleContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    justifyContent: isMobile ? 'center' : 'flex-start',
  };
  
  const titleStyle = {
    fontSize: isMobile ? '24px' : '28px',
    fontWeight: '700',
    margin: 0,
    color: theme.text.primary,
    textAlign: isMobile ? 'center' : 'left',
  };
  
  const infoContainerStyle = {
    backgroundColor: darkMode ? 'rgba(18, 18, 24, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    padding: isMobile ? '16px' : '20px',
    marginBottom: isMobile ? '24px' : '32px',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${darkMode ? 'rgba(60, 60, 90, 0.3)' : 'rgba(230, 230, 240, 0.8)'}`,
  };
  
  const descriptionStyle = {
    fontSize: '15px',
    color: theme.text.secondary,
    marginBottom: '16px',
    lineHeight: '1.5',
    textAlign: isMobile ? 'center' : 'left',
  };
  
  return (
    <>
      <div style={titleContainerStyle}>
        <Crown size={isMobile ? 20 : 24} color={theme.accent.primary} />
        <h1 style={titleStyle}>
          top tokens on lf0g.fun
        </h1>
      </div>
      
      <div style={infoContainerStyle}>
        <p style={descriptionStyle}>
          The leaderboard displays top performing creator tokens on lf0g.fun platform. Ranking is based on a weighted score (80% market cap, 20% gravity score).
        </p>
        
        <TimeframeSelector 
          timeframe={timeframe} 
          setTimeframe={setTimeframe} 
        />
      </div>
    </>
  );
};

export default LeaderboardInfo; 