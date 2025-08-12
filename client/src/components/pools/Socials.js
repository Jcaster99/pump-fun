import React, { useState, useEffect, useCallback } from 'react';
import PoolComments from './PoolComments';
import GravityVotePanel from './GravityVotePanel';
import { MessageCircle, TrendingUp } from 'lucide-react'; // Usuwam niepotrzebny import BarChart3

const Socials = ({ pool, theme, darkMode }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [commentsCount, setCommentsCount] = useState(0);
  
  // Check if we're on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Funkcja callback do aktualizacji liczby komentarzy - memoized to prevent unnecessary re-renders
  const updateCommentsCount = useCallback((count) => {
    setCommentsCount(count);
  }, []);

  // Dynamic accent color - można dostosować na podstawie motywu
  const accentColor = theme.accent.primary;

  // Common card styling - uproszczony, dostosowany do Card & Indicators
  const cardStyle = {
    backgroundColor: theme.bg.card,
    borderRadius: '16px',
    border: 'none',
    boxShadow: `0 4px 20px ${darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'}`,
    overflow: 'hidden'
  };

  // Section header styling
  const sectionHeaderStyle = {
    padding: '16px 20px',
    margin: 0,
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
    fontSize: '18px',
    fontWeight: '600',
    color: theme.text.primary,
    position: 'relative'
  };

  // Header gradient overlay
  const headerGradientStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    background: `linear-gradient(90deg, ${accentColor}10, transparent)`,
    zIndex: 0,
    pointerEvents: 'none'
  };

  // Header icon container
  const iconContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${accentColor}15`,
    borderRadius: '10px',
    padding: '8px',
    zIndex: 1
  };

  // Content padding
  const contentPadding = {
    padding: '0 20px 20px'
  };

  // Stats counter pill
  const statsCounter = (count) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    color: theme.text.secondary,
    borderRadius: '12px',
    padding: '3px 8px',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '10px'
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      gap: '20px',
      width: '100%'
    }}>
      {/* On mobile: GravityVote appears at the top */}
      {isMobile && (
        <div className="laser-border" style={cardStyle}>
          <h3 style={sectionHeaderStyle}>
            <div style={headerGradientStyle}></div>
            <div style={iconContainerStyle}>
              <TrendingUp size={20} color={accentColor} />
            </div>
            <span style={{ position: 'relative', zIndex: 1 }}>
              Gravity Vote
            </span>
          </h3>
          <div style={contentPadding}>
            <GravityVotePanel 
              pool={pool} 
              theme={theme} 
              darkMode={darkMode} 
            />
          </div>
        </div>
      )}
      
      {/* Comments section - takes 2.5/4 on large screens */}
      <div className="laser-border" style={{
        ...cardStyle,
        flex: isMobile ? '1' : '2.5',
        position: 'relative'
      }}>
        <h3 style={sectionHeaderStyle}>
          <div style={headerGradientStyle}></div>
          <div style={iconContainerStyle}>
            <MessageCircle size={20} color={accentColor} />
          </div>
          <span style={{ position: 'relative', zIndex: 1 }}>
            Comments
            <span style={statsCounter(commentsCount)}>
              {commentsCount}
            </span>
          </span>
        </h3>
        <div style={contentPadding}>
          <PoolComments 
            pool={pool} 
            theme={theme} 
            darkMode={darkMode} 
            onCommentsLoaded={updateCommentsCount}
          />
        </div>
      </div>
      
      {/* GravityVote on desktop - takes 1.5/4 on large screens */}
      {!isMobile && (
        <div className="laser-border" style={{
          ...cardStyle,
          flex: '1.5',
          position: 'relative',
          alignSelf: 'flex-start'
        }}>
          <h3 style={sectionHeaderStyle}>
            <div style={headerGradientStyle}></div>
            <div style={iconContainerStyle}>
              <TrendingUp size={20} color={accentColor} />
            </div>
            <span style={{ position: 'relative', zIndex: 1 }}>
              Gravity Vote
            </span>
          </h3>
          <div style={contentPadding}>
            <GravityVotePanel 
              pool={pool} 
              theme={theme} 
              darkMode={darkMode} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Socials; 