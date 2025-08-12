import React from 'react';
import { 
  SettingsPanel, 
  TokenInputField, 
  SwapDetailsPanel, 
  TokenSelectModal 
} from './SwapUIComponents';
import { Sliders } from 'lucide-react';

const SwapInterfaceUI = ({
  theme,
  darkMode,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  slippage,
  showSettings,
  showTokenSelect,
  selectingToken,
  exchangeRate,
  priceImpact,
  minimumReceived,
  isSwapping,
  buttonHover,
  buttonState,
  tokens,
  tokensLoading,
  isConnected,
  useOneStepSwap,
  setUseOneStepSwap,
  
  // Handlers
  toggleSettings,
  openTokenSelect,
  selectToken,
  swapTokens,
  handleFromAmountChange,
  handleToAmountChange,
  setMaxAmount,
  executeSwap,
  setButtonHover,
  setSlippage,
  setShowTokenSelect
}) => {
  
  // CSS for the enhanced laser border effect
  const laserBorderStyle = {
    position: 'relative',
    borderRadius: '20px',
    zIndex: 1,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };
  
  const laserBorderBeforeStyle = {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 'inherit',
    padding: '1.5px',
    background: `linear-gradient(135deg, 
      ${theme.accent.primary}, ${theme.accent.secondary}, 
      #9A4CFF, ${theme.accent.secondary}, 
      ${theme.accent.primary})`,
    backgroundSize: '400% 100%',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    animation: 'rotate 6s linear infinite',
    zIndex: -1,
  };
  
  // Obliczenie efektywnego shadow bazując na theme
  const themeShadow = darkMode ? 
    '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)' : 
    '0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)';

  // Gradient dla theme
  const themeGradient = darkMode ? 
    'linear-gradient(135deg, #00D2E9 0%, #9A4CFF 100%)' : 
    'linear-gradient(135deg, #FF5CAA 0%, #00D2E9 100%)';
  
  // Glow effect
  const themeGlow = darkMode ? 
    '0 0 20px rgba(0, 210, 233, 0.4)' : 
    '0 0 20px rgba(255, 92, 170, 0.3)';
  
  // Glass background color
  const glassBackground = darkMode ? 
    'rgba(20, 20, 32, 0.7)' : 
    'rgba(255, 255, 255, 0.7)';
    
  // Shared theme utils for child components
  const themeUtils = {
    themeShadow,
    themeGradient,
    themeGlow,
    glassBackground,
    glassBorder: darkMode ? 'rgba(35, 35, 48, 0.5)' : 'rgba(226, 232, 240, 0.7)',
    laserBorderStyle,
    laserBorderBeforeStyle
  };
  
  return (
    <div className="swap-container" style={{ 
      backgroundColor: theme.bg.page,
      backgroundImage: darkMode ? 
        'radial-gradient(circle at 10% 20%, rgba(20, 20, 50, 0.4) 0%, rgba(11, 11, 19, 0.2) 90%)' : 
        'radial-gradient(circle at 10% 20%, rgba(235, 240, 255, 0.6) 0%, rgba(248, 250, 252, 0.2) 90%)',
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      transition: 'background-color 0.5s ease, color 0.5s ease',
      overflowX: 'hidden',
    }}>
      <style>
        {`
          @keyframes rotate {
            0% { background-position: 0% 0%; }
            100% { background-position: 400% 0%; }
          }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 8px rgba(0, 210, 233, 0.4), 0 0 16px rgba(255, 92, 170, 0.2); }
            50% { box-shadow: 0 0 16px rgba(0, 210, 233, 0.5), 0 0 24px rgba(255, 92, 170, 0.3); }
            100% { box-shadow: 0 0 8px rgba(0, 210, 233, 0.4), 0 0 16px rgba(255, 92, 170, 0.2); }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes flipSwap {
            0% { transform: rotate(0deg); opacity: 1; }
            50% { transform: rotate(180deg); opacity: 0.3; }
            100% { transform: rotate(360deg); opacity: 1; }
          }
          
          @keyframes slideUpFadeIn {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          /* Token hover effect */
          .token-item {
            transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          }
          
          .token-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
          }
          
          /* Button hover effect */
          .swap-button:not(:disabled):hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          }
          
          /* Icon button effect */
          .icon-button {
            transition: all 0.2s ease;
          }
          
          .icon-button:hover {
            transform: translateY(-2px);
            filter: brightness(1.2);
          }
          
          /* Input field focus */
          .amount-input:focus {
            box-shadow: 0 0 0 2px rgba(0, 210, 233, 0.3);
          }
          
          /* Settings menu animation */
          .settings-menu {
            animation: slideUpFadeIn 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          }
          
          /* Token select animation */
          .token-select-overlay {
            animation: fadeIn 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              backdrop-filter: blur(0px);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(6px);
            }
          }
          
          /* Slide up animation for cards */
          .slide-up {
            animation: slideUpFadeIn 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          }
          
          /* Token amount transition */
          .amount-input {
            transition: all 0.2s ease;
          }
          
          /* Swap direction button animation */
          .swap-direction-button {
            transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          }
          
          .swap-direction-button:hover {
            transform: translateY(-50%) scale(1.1) !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
          }
          
          .swap-direction-button.swapping {
            animation: flipSwap 0.6s ease;
          }
          
          /* Glass effect for cards */
          .glass-effect {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            background-color: ${glassBackground};
            border: 1px solid ${themeUtils.glassBorder};
          }
          
          /* Gradient text animation */
          @keyframes gradientText {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .gradient-text {
            background: linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary}, #9A4CFF, ${theme.accent.secondary});
            background-size: 300% auto;
            animation: gradientText 4s linear infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}
      </style>
      
      {/* Header Section with Title */}
      <div style={{
        marginBottom: '30px',
        textAlign: 'center',
        animation: 'slideUpFadeIn 0.5s ease-out',
        opacity: 0,
        animationFillMode: 'forwards',
        animationDelay: '0.2s',
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '800',
          marginBottom: '15px',
          letterSpacing: '-0.03em',
        }} className="gradient-text">
          swap.lf0g.fun
        </h1>
        <p style={{
          color: theme.text.secondary,
          fontSize: '1.2rem',
          maxWidth: '500px',
          margin: '0 auto',
          opacity: 0.9,
          letterSpacing: '0.01em',
        }}>
          Swap graduated tokens from lf0g.fun with 0% fees
        </p>
      </div>
      
      {/* Main Swap Card */}
      <div className="swap-card slide-up glass-effect" style={{
        ...laserBorderStyle,
        width: '100%',
        maxWidth: '450px',
        padding: '25px',
        boxShadow: themeShadow,
        animation: 'pulse 3s infinite, slideUpFadeIn 0.5s ease-out',
        opacity: 0,
        animationFillMode: 'forwards',
        animationDelay: '0.3s',
      }}>
        <div style={laserBorderBeforeStyle}></div>
        
        {/* Card Header with Settings and Theme Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          {/* Empty div to maintain spacing */}
          <div></div>
        </div>
        
        {/* Swap Mode Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          padding: '5px',
          backgroundColor: darkMode ? 'rgba(24, 26, 32, 0.4)' : 'rgba(240, 245, 255, 0.6)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${darkMode ? 'rgba(48, 50, 62, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
        }}>
          <button 
            onClick={() => setUseOneStepSwap(true)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '12px',
              background: useOneStepSwap 
                ? (darkMode 
                    ? 'linear-gradient(135deg, rgba(0, 210, 233, 0.9), rgba(0, 162, 180, 0.8))' 
                    : 'linear-gradient(135deg, rgba(255, 92, 170, 0.9), rgba(218, 78, 145, 0.8))')
                : 'transparent',
              color: useOneStepSwap 
                ? '#ffffff' 
                : theme.text.secondary,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.9rem',
              fontWeight: useOneStepSwap ? '700' : '500',
              letterSpacing: '0.02em',
              position: 'relative',
              zIndex: 1,
              boxShadow: useOneStepSwap ? '0 4px 10px rgba(0, 0, 0, 0.15)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Direct Swap
            <span style={{ 
              fontSize: '0.75rem', 
              opacity: 0.9, 
              fontWeight: '400',
              backgroundColor: useOneStepSwap ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
              padding: useOneStepSwap ? '2px 6px' : '0',
              borderRadius: '10px',
            }}>1 TX</span>
          </button>
          <button 
            onClick={() => setUseOneStepSwap(false)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '12px',
              background: !useOneStepSwap 
                ? (darkMode 
                    ? 'linear-gradient(135deg, rgba(0, 210, 233, 0.9), rgba(0, 162, 180, 0.8))' 
                    : 'linear-gradient(135deg, rgba(255, 92, 170, 0.9), rgba(218, 78, 145, 0.8))')
                : 'transparent',
              color: !useOneStepSwap 
                ? '#ffffff' 
                : theme.text.secondary,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.9rem',
              fontWeight: !useOneStepSwap ? '700' : '500',
              letterSpacing: '0.02em',
              position: 'relative',
              zIndex: 1,
              boxShadow: !useOneStepSwap ? '0 4px 10px rgba(0, 0, 0, 0.15)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
            Router Swap
            <span style={{ 
              fontSize: '0.75rem', 
              opacity: 0.9, 
              fontWeight: '400',
              backgroundColor: !useOneStepSwap ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
              padding: !useOneStepSwap ? '2px 6px' : '0',
              borderRadius: '10px',
            }}>2+ TX</span>
          </button>
        </div>
        
        {/* Token Input Fields */}
        <TokenInputField
          label="From"
          token={fromToken}
          amount={fromAmount}
          onChange={handleFromAmountChange}
          openTokenSelect={() => openTokenSelect('from')}
          setMaxAmount={setMaxAmount}
          isConnected={isConnected}
          theme={theme}
          utils={themeUtils}
          darkMode={darkMode}
        />
        
        {/* Swap Direction Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '8px',
          position: 'relative',
          zIndex: 2
        }}>
          <button
            onClick={swapTokens}
            className={`swap-direction-button ${isSwapping ? 'swapping' : ''}`}
            style={{
              backgroundColor: theme.bg.card,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: `1px solid ${theme.border}`,
              color: theme.accent.primary,
              transform: 'translateY(-50%)',
              position: 'absolute',
              top: '0',
              boxShadow: themeShadow,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          >
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ 
                transition: 'all 0.3s ease',
                transform: isSwapping ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="8 12 12 16 16 12"></polyline>
              <line x1="12" y1="8" x2="12" y2="16"></line>
            </svg>
          </button>
        </div>
        
        {/* To Token Input Field */}
        <TokenInputField
          label="To"
          token={toToken}
          amount={toAmount}
          onChange={handleToAmountChange}
          openTokenSelect={() => openTokenSelect('to')}
          isConnected={isConnected}
          theme={theme}
          utils={themeUtils}
          showMaxButton={false}
          darkMode={darkMode}
        />
        
        {/* Transaction Details */}
        {fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && (
          <SwapDetailsPanel
            fromToken={fromToken}
            toToken={toToken}
            priceImpact={priceImpact}
            minimumReceived={minimumReceived}
            exchangeRate={exchangeRate}
            theme={theme}
            darkMode={darkMode}
          />
        )}
        
        {/* Swap Button */}
        <button
          onClick={executeSwap}
          disabled={buttonState.disabled}
          onMouseEnter={() => setButtonHover(true)}
          onMouseLeave={() => setButtonHover(false)}
          style={{
            width: '100%',
            background: buttonState.disabled 
              ? (darkMode ? 'rgba(60, 65, 75, 0.6)' : 'rgba(230, 235, 240, 0.8)') 
              : themeGradient,
            color: buttonState.disabled ? theme.text.secondary : 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '1.1rem',
            fontWeight: '700',
            cursor: buttonState.disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            boxShadow: buttonState.disabled ? 'none' : 
              (buttonHover ? 
                `${themeGlow}, 0 8px 20px rgba(0, 0, 0, 0.2)` : 
                '0 6px 15px rgba(0, 0, 0, 0.15)'),
            transform: buttonHover && !buttonState.disabled ? 'translateY(-2px)' : 'translateY(0)',
            letterSpacing: '0.02em',
            position: 'relative',
            overflow: 'hidden'
          }}
          className="swap-button"
        >
          {buttonState.text}
        </button>
      </div>
      
      {/* Token Selection Modal */}
      {showTokenSelect && (
        <TokenSelectModal
          theme={theme}
          darkMode={darkMode}
          tokens={tokens}
          tokensLoading={tokensLoading}
          selectingToken={selectingToken}
          fromToken={fromToken}
          toToken={toToken}
          setShowTokenSelect={setShowTokenSelect}
          selectToken={selectToken}
          isConnected={isConnected}
          utils={themeUtils}
        />
      )}
    </div>
  );
};

export default SwapInterfaceUI; 