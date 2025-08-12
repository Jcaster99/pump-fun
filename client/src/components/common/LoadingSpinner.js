import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const LoadingSpinner = ({ size = 40, text = "Loading...", centered = true }) => {
  const { theme } = useTheme();
  
  const container = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    ...(centered && {
      minHeight: '300px',
      width: '100%'
    })
  };
  
  const spinnerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    border: `3px solid ${theme.border}`,
    borderRadius: '50%',
    borderTop: `3px solid ${theme.accent.primary}`,
    borderRight: `3px solid ${theme.accent.primary}`,
    animation: 'spinner 1s linear infinite',
    marginBottom: '15px'
  };
  
  return (
    <div style={container}>
      <div style={spinnerStyle} />
      {text && (
        <div style={{ 
          color: theme.text.secondary,
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {text}
        </div>
      )}
      
      <style jsx="true">{`
        @keyframes spinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner; 