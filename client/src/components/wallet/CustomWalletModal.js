import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Copy, X, Check } from 'lucide-react';

const CustomWalletModal = ({ 
  isOpen, 
  onClose, 
  walletAddress, 
  walletShort, 
  username, 
  chainName,
  onDisconnect 
}) => {
  const { theme, darkMode } = useTheme();
  const [copySuccess, setCopySuccess] = useState(false);
  const [animationState, setAnimationState] = useState('closed'); // 'closed', 'opening', 'open', 'closing'
  
  // Use the appropriate accent color based on theme mode
  const accentColor = theme.accent.secondary;
  
  // Handle opening and closing animations
  useEffect(() => {
    if (isOpen) {
      setAnimationState('opening');
      // After a small delay, set to 'open' to complete the animation
      const timer = setTimeout(() => {
        setAnimationState('open');
      }, 50);
      return () => clearTimeout(timer);
    } else if (animationState === 'open' || animationState === 'opening') {
      // Handle closing animation
      setAnimationState('closing');
      const timer = setTimeout(() => {
        setAnimationState('closed');
      }, 300); // Match this with the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Early return if fully closed
  if (animationState === 'closed' && !isOpen) return null;
  
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  
  // Handle actual close function with animation
  const handleClose = () => {
    setAnimationState('closing');
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  // Animation styles
  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '16px',
    opacity: animationState === 'closing' ? 0 : 1,
    transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    backdropFilter: 'blur(4px)',
  };
  
  const modalStyle = {
    backgroundColor: theme.bg.card,
    borderRadius: '12px',
    maxWidth: '440px',
    width: '100%',
    position: 'relative',
    boxShadow: '0 10px 35px rgba(0, 0, 0, 0.25)',
    color: theme.text.primary,
    overflow: 'hidden',
    transform: animationState === 'opening' 
      ? 'scale(0.95) translateY(10px)' 
      : animationState === 'closing' 
        ? 'scale(0.95) translateY(10px)' 
        : 'scale(1) translateY(0)',
    opacity: animationState === 'opening' || animationState === 'closing' ? 0.8 : 1,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };
  
  return (
    <div
      style={backdropStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div style={modalStyle} className="wallet-modal">
        {/* Header with close button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            background: theme.bg.card,
          }}
        >
          <h3 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '600',
            color: theme.text.primary,
            // background: theme.text.primary,
            // WebkitBackgroundClip: 'text',
            // WebkitTextFillColor: 'transparent'
          }}>Account</h3>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.text.secondary,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: 'rotate(0deg)',
            }}
            className="close-button"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Main content */}
        <div style={{ padding: '24px', textAlign: 'center' }}>
          {/* Avatar with pulsing animation */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              margin: '0 auto 16px',
              border: `2px solid ${accentColor}`,
              position: 'relative',
              backgroundColor: theme.bg.panel,
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: `scale(${animationState === 'opening' ? 0.9 : 1})`,
              boxShadow: `0 0 15px rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0.3)`,
            }}
            className="avatar-container"
          >
            <img
              src="/slop-avatar.png"
              alt="Profile"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                transition: 'transform 0.5s ease',
              }}
              className="avatar-image"
            />
          </div>
          
          {/* Username */}
          {/* {username && (
            <div
              style={{
                margin: '8px 0 12px',
                fontSize: '20px',
                fontWeight: '600',
                color: accentColor,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
                transform: `translateY(${animationState === 'opening' ? '10px' : '0'})`,
                opacity: animationState === 'opening' ? 0 : 1,
                transitionDelay: '0.05s',
              }}
              className="username-display"
            >
              @{username}
            </div>
          )} */}
          
          {/* Address */}
          <div
            style={{
              margin: '12px 0 0',
              padding: '10px 16px',
              backgroundColor: theme.bg.card,
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, box-shadow 0.3s ease',
              transform: `translateY(${animationState === 'opening' ? '10px' : '0'})`,
              opacity: animationState === 'opening' ? 0 : 1,
              transitionDelay: '0.1s',
              backdropFilter: 'blur(5px)',
            }}
            className="address-container"
          >
            <div style={{ fontFamily: 'monospace', fontSize: '16px' }}>
              {walletShort}
            </div>
            <button
              onClick={handleCopyAddress}
              style={{
                background: 'transparent',
                border: 'none',
                color:  accentColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
              }}
              className="copy-button"
            >
              {copySuccess ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          
          {/* Network info - pokazuj zawsze */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: theme.bg.card,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, box-shadow 0.3s ease',
              transform: `translateY(${animationState === 'opening' ? '10px' : '0'})`,
              opacity: animationState === 'opening' ? 0 : 1,
              transitionDelay: '0.2s',
              backdropFilter: 'blur(5px)',
              // boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
            }}
            className="network-container"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: theme.text.secondary,
                fontSize: '14px',
              }}
            >
              Network
            </div>
            <div style={{ 
              fontWeight: '400', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: accentColor
            }}>
              <div className="network-icon-container">
                <img 
                  src="/pink-og-logo.svg" 
                  alt="0G" 
                  style={{ 
                    width: '50px', 
                    height: '24px', 
                    transition: 'transform 0.3s ease',
                  }}
                  className="network-icon"
                />
              </div>
              {chainName}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ 
          padding: '0 24px 24px',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
          transform: `translateY(${animationState === 'opening' ? '10px' : '0'})`,
          opacity: animationState === 'opening' ? 0 : 1,
          transitionDelay: '0.25s',
        }}>
          <button
            onClick={() => {
              handleClose();
              // Only disconnect after animation completes
              setTimeout(() => {
                onDisconnect();
              }, 300);
            }}
            style={{
              width: 'fit-content',
              padding: '14px',
              background: theme.bg.card,
              color: theme.text.primary,
              border: `1px solid ${theme.border}`,
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              marginLeft: 'auto',
            }}
            // className="disconnect-button"
          >
            <span className="button-content">
              Disconnect
            </span>
          </button>
        </div>
      </div>
      
      {/* Success toast */}
      {copySuccess && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: theme.accent.secondary,
            color: 'white',
            padding: '10px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            zIndex: 60,
            fontSize: '15px',
          }}
          className="copy-toast"
        >
          <Check size={18} />
          Address copied!
        </div>
      )}
      
      <style jsx="true">{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0); }
          100% { box-shadow: 0 0 0 0 rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0); }
        }
        
        .wallet-modal {
          will-change: transform, opacity;
        }
        
        .copy-toast {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .avatar-container {
          animation: pulse 2s infinite;
        }
        
        .avatar-image:hover {
          transform: scale(1.05);
        }
        
        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: rotate(90deg);
        }
        
        .copy-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: scale(1.1);
        }
        
        .network-icon:hover {
          transform: scale(1.1);
        }
        
        .disconnect-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(255, 87, 87, 0.4);
        }
        
        .disconnect-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0)
          );
          transition: left 0.7s ease;
        }
        
        .disconnect-button:hover::before {
          left: 100%;
        }
        
        .address-container:hover,
        .network-container:hover {
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default CustomWalletModal; 