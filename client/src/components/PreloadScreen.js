import React, { useState, useEffect } from 'react';
import '../styles/preload.css';
import { useTheme } from '../context/ThemeContext';

const PreloadScreen = ({ onLoadComplete }) => {
  const { theme, darkMode } = useTheme();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const uniqueKey = Date.now();
  
  // Check if device is mobile
  const isMobile = window.innerWidth < 768;
  // Choose appropriate image based on device type
  const logoImageSrc = isMobile ? "/pfpzer0.png" : "/pfp.gif";

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + 2;
        
        // When reaching 100%, start fade out
        if (newProgress >= 100) {
          clearInterval(interval);
          setFadeOut(true);
          
          // Wait for animation to complete before calling onLoadComplete
          setTimeout(() => {
            if (onLoadComplete) onLoadComplete();
          }, 300);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 40); // Will take exactly 2 seconds to reach 100%
    
    return () => clearInterval(interval);
  }, [onLoadComplete]);

  return (
    <div 
      className={`preload-screen ${fadeOut ? 'fade-out' : ''}`}
      style={{ 
        backgroundColor: darkMode ? '#121218' : '#f3f3f7',
        color: theme.text.primary
      }}
    >
      <div className="preload-content">
        <div 
          className="logo-container"
          style={{
            // Make the logo larger on desktop
            width: isMobile ? '140px' : '200px',
            height: isMobile ? '140px' : '200px'
          }}
        >
          <div className="neon-glow"></div>
          <img 
            src={logoImageSrc}
            alt="lf0g.fun" 
            className="preload-logo"
            key={uniqueKey}
          />
        </div>
        
        <h1 
          className="preload-title" 
          style={{ 
            background: `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}
        >
          lf0g.fun
        </h1>
        
        <div 
          className="loading-bar-container"
          style={{ borderColor: theme.border }}
        >
          <div 
            className="loading-bar-progress"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${theme.accent.primary} 0%, ${theme.accent.secondary} 100%)`
            }}
          ></div>
        </div>
        
        <p style={{ color: theme.text.secondary }}>
          Loading tokens data... {progress}%
        </p>
      </div>
    </div>
  );
};

export default PreloadScreen; 