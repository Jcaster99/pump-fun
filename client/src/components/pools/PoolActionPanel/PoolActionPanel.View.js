import React from 'react';
import { AlertCircle, Loader2, XCircle, Settings } from 'lucide-react';

const PoolActionPanelView = ({
  pool,
  theme,
  darkMode,
  wallet,
  activeTab,
  handleTabChange,
  amount,
  setAmount,
  handleMaxClick,
  handleClearClick,
  handleSubmit,
  isSwapping,
  isLoadingCalculation,
  formattedUsdtBalance,
  formattedTokenBalance,
  calculatedData,
  buttonAnimating,
  error,
  formatPrice,
  hidePriceHeader,
  lastTradeInfo,
  slippage,
  handleSlippageChange,
  showSlippageSettings,
  toggleSlippageSettings,
  rpcStatus
}) => {
  // Button animation keyframes for CSS
  const buttonAnimationKeyframes = `
    @keyframes buttonPulse {
      0% { opacity: 1; }
      50% { opacity: 0.8; }
      100% { opacity: 1; }
    }
    
    @keyframes spinAround {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // Predefined slippage values
  const slippageOptions = ['0.1', '0.5', '1.0', '2.0', '3.0'];

  // Format the error message to be more user-friendly
  const getFormattedErrorMessage = (errorMessage) => {
    if (!errorMessage) return null;
    
    // Handle user rejected transaction error
    if (errorMessage.includes("User rejected the request")) {
      return "Transaction was rejected by user";
    }
    
    // Handle other common errors
    if (errorMessage.includes("Failed to approve")) {
      return "USDT approval was rejected";
    }
    
    // Return the original error if none of the above matches
    return errorMessage;
  };

  const formattedError = getFormattedErrorMessage(error);

  // Custom slippage input change handler
  const handleCustomSlippageChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and one decimal point
    if (/^(\d+)?(\.\d*)?$/.test(value) || value === '') {
      handleSlippageChange(value);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{buttonAnimationKeyframes}</style>
      
      {/* Header with price and settings icon */}
      {!hidePriceHeader && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          animation: 'fadeInUp 0.3s ease-out',
          position: 'relative'
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '20px', 
            fontWeight: '600',
            color: theme.text.primary
          }}>
            Defy Gravity
          </h3>
          
          {/* Settings icon */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleSlippageSettings}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
                color: theme.text.secondary
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Settings size={18} />
            </button>
            
            {/* Slippage settings dropdown */}
            {showSlippageSettings && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '220px',
                backgroundColor: darkMode ? theme.bg.card : 'white',
                borderRadius: '12px',
                boxShadow: darkMode 
                  ? '0 8px 24px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 24px rgba(0, 0, 0, 0.15)',
                padding: '16px',
                zIndex: 100,
                border: `1px solid ${theme.border}`,
                animation: 'fadeIn 0.2s ease',
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: theme.text.primary,
                  fontSize: '14px', 
                  fontWeight: '600'
                }}>
                  Slippage Tolerance
                </h4>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  {slippageOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSlippageChange(option)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: slippage === option 
                          ? (darkMode ? theme.accent.primary : theme.accent.primary) 
                          : (darkMode ? 'rgba(255, 255, 255, 0.05)' : theme.bg.panel),
                        color: slippage === option ? 'white' : theme.text.secondary,
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: slippage === option ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label 
                    htmlFor="custom-slippage" 
                    style={{ 
                      fontSize: '12px', 
                      color: theme.text.secondary,
                      display: 'block',
                      marginBottom: '4px'
                    }}
                  >
                    Custom (%)
                  </label>
                  <input
                    id="custom-slippage"
                    type="text"
                    value={slippage}
                    onChange={handleCustomSlippageChange}
                    placeholder="Custom slippage"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : theme.bg.panel,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      color: theme.text.primary,
                      fontSize: '14px',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
                
                <p style={{ 
                  fontSize: '11px', 
                  color: theme.text.secondary,
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  Your transaction will revert if the price changes unfavorably by more than this percentage.
                </p>
                
                {parseFloat(slippage) > 3 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'rgba(255, 87, 87, 0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={14} color="#FF5757" />
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#FF5757', 
                      fontWeight: '500'
                    }}>
                      High slippage increases risk of front-running
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Error messages with improved styling */}
      {formattedError && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: darkMode ? 'rgba(255, 87, 87, 0.15)' : 'rgba(255, 87, 87, 0.1)',
          borderRadius: '12px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeInUp 0.3s ease-out',
          border: '1px solid rgba(255, 87, 87, 0.2)',
          boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          <XCircle size={16} color="#FF5757" style={{ flexShrink: 0 }} />
          <span style={{ 
            fontSize: '13px', 
            color: '#FF5757', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {formattedError}
          </span>
        </div>
      )}
      
      {/* Tabs */}
      <div 
        className="buy-sell-tabs"
        style={{ 
          display: 'flex', 
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : theme.bg.panel,
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '20px',
          padding: '4px',
          animation: 'fadeInUp 0.3s ease-out',
          boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        <button 
          style={{
            flex: 1,
            backgroundColor: activeTab === 'buy' 
              ? theme.accent.primary 
              : 'transparent',
            color: activeTab === 'buy' 
              ? 'white' 
              : theme.text.secondary,
            border: 'none',
            padding: '12px',
            cursor: 'pointer',
            fontWeight: activeTab === 'buy' ? '600' : '500',
            fontSize: '14px',
            borderRadius: activeTab === 'buy' ? '8px' : '0',
            transition: 'all 0.3s ease'
          }}
          onClick={() => handleTabChange('buy')}
        >
          Buy
        </button>
        <button 
          style={{
            flex: 1,
            backgroundColor: activeTab === 'sell' 
              ? '#FF5757' 
              : 'transparent',
            color: activeTab === 'sell' 
              ? 'white' 
              : theme.text.secondary,
            border: 'none',
            padding: '12px',
            cursor: 'pointer',
            fontWeight: activeTab === 'sell' ? '600' : '500',
            fontSize: '14px',
            borderRadius: activeTab === 'sell' ? '8px' : '0',
            transition: 'all 0.3s ease'
          }}
          onClick={() => handleTabChange('sell')}
        >
          Sell
        </button>
      </div>
      
      {/* Trade form */}
      <form onSubmit={handleSubmit} style={{ animation: 'fadeInUp 0.3s ease-out 0.1s both' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px' 
          }}>
            <label style={{ 
              fontSize: '14px',
              color: theme.text.secondary,
              fontWeight: '500'
            }}>
              {activeTab === 'buy' ? 'Amount in USDT' : `Amount in ${pool.symbol}`}
            </label>
            
            {activeTab === 'buy' && wallet && (
              <div style={{
                fontSize: '12px',
                color: theme.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>Balance: {formattedUsdtBalance} USDT</span>
              </div>
            )}
            
            {activeTab === 'sell' && wallet && pool && (
              <div style={{
                fontSize: '12px',
                color: theme.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>Balance: {formattedTokenBalance} {pool.symbol}</span>
              </div>
            )}
          </div>
          
          <div style={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <input 
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : theme.bg.panel,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                color: theme.text.primary,
                fontSize: '16px',
                fontWeight: '500',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                paddingRight: wallet ? '70px' : '16px'
              }}
              disabled={isSwapping}
              onFocus={(e) => {
                e.target.style.borderColor = theme.accent.primary;
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 184, 151, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.border;
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            />
            
            {activeTab === 'buy' && wallet && (
              <>
                <button
                  type="button"
                  onClick={handleClearClick}
                  style={{
                    position: 'absolute',
                    right: '60px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 10px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: theme.text.secondary,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) translateY(-1px)';
                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%)';
                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  }}
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={handleMaxClick}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 10px',
                    backgroundColor: theme.accent.primary, // Green for buy
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%)';
                  }}
                >
                  MAX
                </button>
              </>
            )}
            
            {activeTab === 'sell' && wallet && pool && (
              <>
                <button
                  type="button"
                  onClick={handleClearClick}
                  style={{
                    position: 'absolute',
                    right: '60px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 10px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: theme.text.secondary,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) translateY(-1px)';
                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%)';
                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  }}
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={handleMaxClick}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 10px',
                    backgroundColor: '#FF5757', // Red for sell
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%)';
                  }}
                >
                  MAX
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Expected amount display */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px' 
          }}>
            <label style={{ 
              fontSize: '14px',
              color: theme.text.secondary,
              fontWeight: '500'
            }}>
              {activeTab === 'buy' ? `Expected ${pool.symbol}` : 'Expected USDT'}
            </label>
            
            {/* Display price here since we removed the price box */}
            <span style={{ 
              fontSize: '14px',
              color: theme.text.secondary,
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Price: {calculatedData && calculatedData.currentPrice 
                ? formatPrice(calculatedData.currentPrice) 
                : formatPrice(pool.price_realtime || pool.price)}
              
              {/* RPC Status indicator */}
              {rpcStatus && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 
                    rpcStatus === 'healthy' ? '#4CAF50' : 
                    rpcStatus === 'degraded' ? '#FFC107' : '#F44336',
                  display: 'inline-block'
                }} title={`Network status: ${rpcStatus}`}></span>
              )}
            </span>
          </div>
          
          <div style={{
            width: '100%',
            padding: '14px 16px',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : theme.bg.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            color: theme.text.primary,
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <span>
              {isLoadingCalculation ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '14px', 
                    height: '14px', 
                    borderRadius: '50%', 
                    border: `2px solid ${theme.accent.primary}`,
                    borderRightColor: 'transparent',
                    animation: 'spinAround 1s linear infinite'
                  }}></div>
                  <span style={{ color: theme.text.secondary, fontSize: '14px' }}>
                    Calculating{rpcStatus === 'degraded' ? ' (network slow)' : ''}...
                  </span>
                </div>
              ) : (
                activeTab === 'buy' ? (
                  calculatedData?.expectedAmount ? (
                    <span>{parseFloat(calculatedData.expectedAmount).toFixed(6)} {pool.symbol}</span>
                  ) : (
                    <span style={{ color: theme.text.secondary }}>0.00 {pool.symbol}</span>
                  )
                ) : (
                  calculatedData?.expectedAmount ? (
                    <span>{formatPrice(calculatedData.expectedAmount)}</span>
                  ) : (
                    <span style={{ color: theme.text.secondary }}>$0.00</span>
                  )
                )
              )}
            </span>
          </div>
        </div>
        
        {/* Display calculation timing help text when network is degraded */}
        {rpcStatus === 'degraded' && amount && amount > 0 && (
          <div style={{
            marginBottom: '16px',
            fontSize: '12px',
            color: '#FFC107',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderRadius: '8px'
          }}>
            <AlertCircle size={14} color="#FFC107" />
            <span>Network is experiencing delays. Calculations may take longer than usual.</span>
          </div>
        )}
        
        {/* Slippage info */}
        <div style={{ 
          marginBottom: '24px',
          fontSize: '13px',
          color: theme.text.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px'
        }}>
          <span>Slippage tolerance: {slippage}%</span>
          {calculatedData && calculatedData.minAmount && !isLoadingCalculation && (
            <span>
              Min {activeTab === 'buy' ? 'received' : 'amount'}: {' '}
              {activeTab === 'buy' 
                ? `${parseFloat(calculatedData.minAmount).toFixed(6)} ${pool.symbol}`
                : formatPrice(calculatedData.minAmount)
              }
            </span>
          )}
        </div>
        
        <button
          type="submit"
          className="trade-button"
          disabled={isSwapping || isLoadingCalculation || !amount}
          style={{
            width: '100%',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: isSwapping || isLoadingCalculation ? 
              (darkMode ? 'rgba(255, 255, 255, 0.1)' : theme.bg.panel) : 
              (activeTab === 'buy' ? theme.accent.primary : '#FF5757'),
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: isSwapping || isLoadingCalculation || !amount ? 'not-allowed' : 'pointer',
            marginTop: '16px',
            marginLeft: 'auto',
            marginRight: 'auto',
            maxWidth: '400px',
            boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            animation: buttonAnimating ? 'buttonPulse 1.2s ease-in-out infinite' : 'none'
          }}
          onMouseOver={(e) => {
            if (!isSwapping && !isLoadingCalculation && amount) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = darkMode ? 
                '0 6px 16px rgba(0, 0, 0, 0.3)' : 
                '0 6px 16px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = darkMode ? 
              '0 4px 12px rgba(0, 0, 0, 0.2)' : 
              '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
        >
          {isSwapping && (
            <Loader2 size={18} className="animate-spin" style={{ animation: 'spinAround 1s linear infinite' }} />
          )}
          {isSwapping ? 'Processing...' : (
            isLoadingCalculation ? (
              rpcStatus === 'degraded' ? 'Calculating (slow network)...' : 'Calculating...'
            ) : (
              wallet ? 
                `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${pool.symbol}` : 
                'Connect Wallet to Trade'
            )
          )}
        </button>
      </form>
    </div>
  );
};

export default PoolActionPanelView; 