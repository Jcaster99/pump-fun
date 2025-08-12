import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Crown } from 'lucide-react';
import ParticleBackground from '../common/ParticleBackground';
import LoadingSpinner from '../common/LoadingSpinner';
import { fetchLeaderboardData } from '../../api/leaderboardApi';
import useWindowSize from './useWindowSize';
import LeaderboardInfo from './LeaderboardInfo';
import LeaderboardTable from './LeaderboardTable';

/**
 * LeaderboardPage component displays the top pools based on weighted score
 * 
 * @returns {JSX.Element} LeaderboardPage component
 */
const LeaderboardPage = () => {
  const { theme, darkMode } = useTheme();
  const windowSize = useWindowSize();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('weekly'); // weekly, monthly, all-time
  
  // Is mobile check
  const isMobile = windowSize.width <= 480;
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const result = await fetchLeaderboardData({
          limit: 100,
          timeframe
        });
        
        setLeaderboardData(result.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeframe]);

  // Responsive container style
  const containerStyle = {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    overflow: 'hidden'
  };
  
  const contentStyle = {
    position: 'relative',
    zIndex: 5,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '16px' : '20px'
  };
  
  const errorStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#FF5757'
  };
  
  const retryButtonStyle = {
    backgroundColor: theme.accent.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    marginTop: '16px',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      {/* Particle Background */}
      <ParticleBackground zIndex={0} />
      
      {/* Main content */}
      <div style={contentStyle}>
        {/* Title and timeframe selector */}
        <LeaderboardInfo 
          timeframe={timeframe} 
          setTimeframe={setTimeframe} 
        />
        
        {/* Content area */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px'
          }}>
            <LoadingSpinner text="Loading leaderboard data..." />
          </div>
        ) : error ? (
          <div style={errorStyle}>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={retryButtonStyle}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Leaderboard table */}
            <LeaderboardTable leaderboardData={leaderboardData} />
          </>
        )}
      </div>
      
      {/* Add styling for laser effects */}
      <style jsx="true">{`
        .laser-glow {
          box-shadow: 0 0 10px rgba(0, 210, 233, 0.3), 0 0 15px rgba(255, 92, 170, 0.2);
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 210, 233, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 210, 233, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 210, 233, 0);
          }
        }
        
        @media (max-width: 480px) {
          .laser-glow {
            box-shadow: 0 0 5px rgba(0, 210, 233, 0.2), 0 0 8px rgba(255, 92, 170, 0.1);
          }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardPage; 