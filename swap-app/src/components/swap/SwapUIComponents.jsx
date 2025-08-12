import React, { useState } from 'react';

// SettingsPanel - komponent dla ustawień transakcji
export const SettingsPanel = ({ 
  theme, 
  darkMode, 
  slippage, 
  setSlippage, 
  toggleSettings, 
  glassBackground 
}) => {
  const [customSlippageValue, setCustomSlippageValue] = useState('');
  
  // Dostępne predefiniowane wartości slippage
  const presetValues = [0.1, 0.5, 1.0, 3.0, 5.0, 10.0];
  
  // Sprawdź, czy slippage jest jedną z predefiniowanych wartości
  const isPresetValue = presetValues.includes(parseFloat(slippage));
  
  // Funkcja do przetwarzania niestandardowych wartości slippage
  const handleCustomSlippageChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCustomSlippageValue(value);
      
      if (value !== '') {
        const numValue = parseFloat(value);
        setSlippage(numValue);
      }
    }
  };

  // Funkcja do obsługi kliknięcia przycisku z predefiniowaną wartością
  const handlePresetClick = (value) => {
    setCustomSlippageValue('');
    setSlippage(value);
  };

  return (
  <div className="settings-menu" style={{
    backgroundColor: theme.bg.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '15px',
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '18px'
    }}>
      <h3 style={{
        margin: 0,
        color: theme.text.primary,
        fontSize: '1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="21" x2="4" y2="14"></line>
          <line x1="4" y1="10" x2="4" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="3"></line>
          <line x1="20" y1="21" x2="20" y2="16"></line>
          <line x1="20" y1="12" x2="20" y2="3"></line>
          <line x1="1" y1="14" x2="7" y2="14"></line>
          <line x1="9" y1="8" x2="15" y2="8"></line>
          <line x1="17" y1="16" x2="23" y2="16"></line>
        </svg>
        Transaction Settings
      </h3>
      <button 
        onClick={toggleSettings}
        className="icon-button"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.text.secondary,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
        }}
      >
        ×
      </button>
    </div>
    
    <div style={{ marginBottom: '12px' }}>
      <label style={{ 
        color: theme.text.secondary,
        fontSize: '0.9rem',
        display: 'block',
        marginBottom: '8px'
      }}>
        Slippage Tolerance
      </label>
      
      {/* Pierwsze 3 przyciski */}
      <div style={{ 
        display: 'flex',
        gap: '10px',
        marginBottom: '10px'
      }}>
        {presetValues.slice(0, 3).map((value) => (
          <button
            key={value}
            onClick={() => handlePresetClick(value)}
            style={{
              backgroundColor: parseFloat(slippage) === value ? 
                (darkMode ? 'rgba(0, 210, 233, 0.15)' : 'rgba(255, 92, 170, 0.15)') : 
                glassBackground,
              color: parseFloat(slippage) === value ? 
                (darkMode ? theme.accent.primary : theme.accent.secondary) : theme.text.primary,
              border: `1px solid ${parseFloat(slippage) === value ? 
                (darkMode ? theme.accent.primary : theme.accent.secondary) : 'transparent'}`,
              borderRadius: '12px',
              padding: '10px 0px',
              fontSize: '0.9rem',
              fontWeight: parseFloat(slippage) === value ? '600' : '400',
              cursor: 'pointer',
              flex: 1,
              transition: 'all 0.2s ease'
            }}
          >
            {value}%
          </button>
        ))}
      </div>
      
      {/* Kolejne 3 przyciski */}
      <div style={{ 
        display: 'flex',
        gap: '10px',
        marginBottom: '10px'
      }}>
        {presetValues.slice(3).map((value) => (
          <button
            key={value}
            onClick={() => handlePresetClick(value)}
            style={{
              backgroundColor: parseFloat(slippage) === value ? 
                (darkMode ? 'rgba(0, 210, 233, 0.15)' : 'rgba(255, 92, 170, 0.15)') : 
                glassBackground,
              color: parseFloat(slippage) === value ? 
                (darkMode ? theme.accent.primary : theme.accent.secondary) : theme.text.primary,
              border: `1px solid ${parseFloat(slippage) === value ? 
                (darkMode ? theme.accent.primary : theme.accent.secondary) : 'transparent'}`,
              borderRadius: '12px',
              padding: '10px 0px',
              fontSize: '0.9rem',
              fontWeight: parseFloat(slippage) === value ? '600' : '400',
              cursor: 'pointer',
              flex: 1,
              transition: 'all 0.2s ease'
            }}
          >
            {value}%
          </button>
        ))}
      </div>
      
      {/* Niestandardowa wartość */}
      <div style={{
        position: 'relative',
        flex: 1,
        marginTop: '5px'
      }}>
        <input
          type="text"
          value={customSlippageValue}
          onChange={handleCustomSlippageChange}
          placeholder="Custom value (%)"
          style={{
            width: '100%',
            padding: '10px 30px 10px 14px',
            fontSize: '0.9rem',
            backgroundColor: !isPresetValue ? 
              (darkMode ? 'rgba(0, 210, 233, 0.15)' : 'rgba(255, 92, 170, 0.15)') : 
              glassBackground,
            color: theme.text.primary,
            border: `1px solid ${!isPresetValue ? 
              (darkMode ? theme.accent.primary : theme.accent.secondary) : 'transparent'}`,
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          className="amount-input"
        />
        <span style={{
          position: 'absolute',
          right: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: theme.text.secondary,
          fontSize: '0.9rem'
        }}>
          %
        </span>
      </div>
      
      {parseFloat(slippage) > 3 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#FF5757',
          fontSize: '0.85rem',
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 87, 87, 0.1)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Your transaction may be frontrun
        </div>
      )}
    </div>
  </div>
  );
};

// TokenInputField - komponent pola wyboru tokena i wprowadzania ilości
export const TokenInputField = ({ 
  label, 
  token, 
  amount, 
  onChange, 
  openTokenSelect, 
  setMaxAmount, 
  isConnected, 
  theme, 
  utils,
  darkMode,
  showMaxButton = true
}) => (
  <div style={{
    backgroundColor: theme.bg.input,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: label === 'From' ? '8px' : '20px',
    marginTop: label === 'To' ? '8px' : '0',
    transition: 'all 0.3s ease',
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '14px'
    }}>
      <span style={{
        color: theme.text.secondary,
        fontSize: '0.95rem',
        fontWeight: '500',
      }}>
        {label}
      </span>
      <span style={{
        color: theme.text.secondary,
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}>
        Balance: {isConnected && token && (
          <span style={{ fontWeight: '600' }}>
            {console.log("[TEST] Rendering balance for", token?.symbol, ":", token?.userBalance)}
            {typeof token?.userBalance !== 'undefined' ? parseFloat(token.userBalance).toFixed(4) : '...'} {token?.symbol}
          </span>
        )}
      </span>
    </div>
    
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    }}>
      <input
        type="text"
        value={amount}
        onChange={onChange}
        placeholder="0.0"
        className="amount-input"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.text.primary,
          fontSize: '1.7rem',
          fontWeight: '600',
          outline: 'none',
          width: '100%',
          padding: '8px 0',
        }}
      />
      
      <button
        onClick={openTokenSelect}
        style={{
          backgroundColor: darkMode ? 'rgba(30, 35, 45, 0.8)' : 'rgba(240, 245, 250, 0.8)',
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          color: theme.text.primary,
          fontWeight: '600',
          fontSize: '1rem',
          minWidth: '130px',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        className="icon-button"
      >
        {token ? (
          <>
            <img 
              src={token.logo} 
              alt={token.symbol}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: `1px solid ${theme.border}`,
              }}
            />
            {token.symbol}
          </>
        ) : (
          <span>Select Token</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
    
    {showMaxButton && (
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '10px'
      }}>
        {isConnected && token && (
          <button
            onClick={setMaxAmount}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: theme.accent.primary,
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            className="icon-button"
          >
            MAX
          </button>
        )}
      </div>
    )}
  </div>
);

// SwapDetailsPanel - komponent wyświetlający szczegóły transakcji
export const SwapDetailsPanel = ({ 
  fromToken, 
  toToken, 
  priceImpact, 
  minimumReceived, 
  exchangeRate, 
  theme, 
  darkMode 
}) => (
  <div style={{
    backgroundColor: darkMode ? 'rgba(30, 35, 45, 0.5)' : 'rgba(248, 250, 252, 0.7)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '16px',
    fontSize: '0.85rem',
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    }}>
      <span style={{ 
        color: theme.text.secondary,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        Price Impact
      </span>
      <span style={{ 
        color: parseFloat(priceImpact) > 5 ? '#FF5757' : '#00B897',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {priceImpact}%
      </span>
    </div>
    
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
      padding: '8px 10px',
      borderRadius: '8px',
      backgroundColor: darkMode ? 'rgba(0, 210, 233, 0.08)' : 'rgba(255, 92, 170, 0.08)',
    }}>
      <span style={{ 
        color: theme.text.secondary,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Minimum Received
      </span>
      <span style={{ 
        color: theme.text.primary,
        fontWeight: '600',
      }}>
        {minimumReceived} {toToken.symbol}
      </span>
    </div>
    
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ color: theme.text.secondary }}>
        Exchange Rate
      </span>
      <span style={{ 
        color: theme.text.primary,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: '500',
      }}>
        1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      </span>
    </div>
  </div>
);

// TokenSelectModal - komponent modalu wyboru tokena
export const TokenSelectModal = ({ 
  theme, 
  darkMode, 
  tokens, 
  tokensLoading, 
  selectingToken, 
  fromToken, 
  toToken, 
  setShowTokenSelect, 
  selectToken, 
  isConnected, 
  utils 
}) => {
  console.log('[DEBUG-MODAL] TokenSelectModal rendered');
  console.log('[DEBUG-MODAL] tokens:', tokens);
  console.log('[DEBUG-MODAL] tokensLoading:', tokensLoading);
  console.log('[DEBUG-MODAL] selectingToken:', selectingToken);
  console.log('[DEBUG-MODAL] fromToken:', fromToken);
  console.log('[DEBUG-MODAL] toToken:', toToken);

  // Function to add token to wallet
  const addTokenToWallet = async (e, token) => {
    e.stopPropagation(); // Prevent selecting the token when clicking the button
    
    try {
      // Check if ethereum provider is available
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              image: token.logo,
            },
          },
        });
      } else {
        alert('MetaMask or compatible wallet not found');
      }
    } catch (error) {
      console.error('Error adding token to wallet:', error);
    }
  };

  // Pokazuj wszystkie tokeny włącznie z USDT
  const displayTokens = tokens ? tokens : [];

  return (
    <div className="token-select-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}
    onClick={() => setShowTokenSelect(false)}
    >
      <div 
        className="slide-up" 
        style={{
          ...utils.laserBorderStyle,
          backgroundColor: theme.bg.card,
          width: '100%',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={utils.laserBorderBeforeStyle}></div>
        
        <div style={{
          padding: '24px 24px 18px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0,
            color: theme.text.primary,
            fontSize: '1.2rem',
            fontWeight: '700',
            letterSpacing: '-0.01em',
          }}>
            Select a token
          </h3>
          <button
            onClick={() => setShowTokenSelect(false)}
            className="icon-button"
            style={{
              backgroundColor: utils.glassBackground,
              border: 'none',
              borderRadius: '50%',
              color: theme.text.secondary,
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              transition: 'all 0.2s ease',
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{
          padding: '14px 24px 24px',
          maxHeight: '65vh',
          overflowY: 'auto',
        }}>
          <div style={{
            backgroundColor: theme.bg.input,
            borderRadius: '16px',
            padding: '5px 5px 5px 20px',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '18px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by name or address"
              style={{
                width: '100%',
                padding: '15px 5px',
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.text.primary,
                fontSize: '0.95rem',
                outline: 'none',
              }}
              className="amount-input"
              id="token-search"
              onChange={(e) => {
                const searchText = e.target.value.toLowerCase();
                // Ukryj tokeny, które nie pasują do wyszukiwania
                document.querySelectorAll('.token-item').forEach(item => {
                  const tokenText = item.textContent.toLowerCase();
                  if (tokenText.includes(searchText)) {
                    item.style.display = 'flex';
                  } else {
                    item.style.display = 'none';
                  }
                });
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {tokensLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: theme.text.secondary }}>
                Loading tokens...
              </div>
            ) : displayTokens.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: theme.text.secondary }}>
                No tokens found
              </div>
            ) : (
              displayTokens.map((token) => (
                <div
                  key={token.address}
                  className="token-item"
                  onClick={() => selectToken(token)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    border: (selectingToken === 'from' && fromToken && token.address === fromToken.address) ||
                           (selectingToken === 'to' && toToken && token.address === toToken.address)
                      ? `2px solid ${theme.accent.primary}` 
                      : `1px solid transparent`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: `1px solid ${theme.border}`,
                        padding: '2px',
                        backgroundColor: darkMode ? 'rgba(20, 20, 32, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                      }}
                    />
                    <div>
                      <div style={{ 
                        color: theme.text.primary,
                        fontWeight: '600',
                        fontSize: '1rem',
                        marginBottom: '4px',
                      }}>
                        {token.symbol}
                      </div>
                      <div style={{ 
                        color: 'white',
                        fontSize: '0.85rem'
                      }}>
                        {token.name}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {token.symbol !== 'USDT' && (
                      <button
                        onClick={(e) => addTokenToWallet(e, token)}
                        className="icon-button"
                        title="Add to wallet"
                        style={{
                          backgroundColor: darkMode ? 'rgba(40, 45, 55, 0.8)' : 'rgba(240, 245, 250, 0.8)',
                          border: `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          color: theme.accent.primary,
                          fontSize: '0.8rem',
                          padding: '5px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1"></path>
                          <rect x="15" y="8" width="9" height="8" rx="2"></rect>
                        </svg>
                        Add
                      </button>
                    )}
                    {isConnected && (
                      <div style={{ 
                        color: theme.text.primary,
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        background: darkMode ? 'rgba(20, 20, 32, 0.5)' : 'rgba(245, 247, 250, 0.7)',
                        padding: '6px 12px',
                        borderRadius: '10px',
                      }}>
                        {parseFloat(token.userBalance).toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 