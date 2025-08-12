import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/splashscreen.css';

const SplashScreen = ({ onComplete }) => {
  const { theme, darkMode } = useTheme();
  const [fadeOut, setFadeOut] = useState(false);
  const [randomGif, setRandomGif] = useState('');
  
  // Different colors for light/dark mode
  const glowColor = darkMode ? 
    'radial-gradient(circle, rgba(0, 210, 233, 0.3) 0%, rgba(255, 92, 170, 0.1) 70%, transparent 100%)' : 
    'radial-gradient(circle, rgba(65, 157, 255, 0.3) 0%, rgba(132, 94, 225, 0.1) 70%, transparent 100%)';
  
  const dotColor = darkMode ? theme.accent.primary : theme.accent.secondary;
  
  useEffect(() => {
    // Randomly select a GIF from the list
    const gifs = ['around.gif', 'dance.gif'];
    const randomIndex = Math.floor(Math.random() * gifs.length);
    setRandomGif(gifs[randomIndex]);
    
    // Show splash for 1.5 seconds, then fade out
    const timeout = setTimeout(() => {
      setFadeOut(true);
      
      // Wait for fade out animation to complete before calling onComplete
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
    }, 1500); // Show splash for 1.5 seconds
    
    return () => clearTimeout(timeout);
  }, [onComplete]);
  
  return (
    <div 
      className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}
      style={{ 
        backgroundColor: darkMode ? 'rgba(18, 18, 24, 0.95)' : 'rgba(243, 243, 247, 0.95)',
        backdropFilter: 'blur(5px)'
      }}
    >
      <div className="splash-content">
        <div className="splash-logo-container">
          <div 
            className="splash-glow"
            style={{ background: glowColor }}
          ></div>
          <img 
            src={`/${randomGif}`} 
            alt="Loading..." 
            className="splash-logo"
            style={{ 
              boxShadow: darkMode 
                ? '0 0 20px rgba(0, 210, 233, 0.4)' 
                : '0 0 20px rgba(65, 157, 255, 0.4)'
            }}
          />
        </div>
        
        <div className="splash-loader">
          <div className="splash-loader-dot" style={{ background: dotColor }}></div>
          <div className="splash-loader-dot" style={{ background: dotColor }}></div>
          <div className="splash-loader-dot" style={{ background: dotColor }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen; 