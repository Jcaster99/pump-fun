import { ExternalLink } from 'lucide-react';
import React from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import GraduationModal from '../../components/pools/GraduationModal';
import PoolActionPanel from '../../components/pools/PoolActionPanel';
import PoolDetailHeader from '../../components/pools/PoolDetailHeader';
import PoolPriceChart from '../../components/pools/PoolPriceChart';
import PoolRewards from '../../components/pools/PoolRewards';
import PoolTransactionHistory from '../../components/pools/PoolTransactionHistory';
import Socials from '../../components/pools/Socials';
import TopHoldersList from '../../components/pools/TopHoldersList';

const PoolDetailsPageView = ({
  pool,
  loading,
  error,
  activeTab,
  isMobile,
  isLargeScreen,
  tabChanging,
  theme,
  darkMode,
  animationKeyframes,
  tabContentAnimations,
  handleTabChange,
  handleUpdateHolders,
  wallet,
  isCreator,
  handleGraduateToken,
  graduatingToken,
  graduationResult,
  showGraduationModal,
  closeGraduationModal,
  executeGraduation,
  graduationValidation,
  areAllRequirementsMet
}) => {
  // Render indicators (Bonding Curve and Top Holders)
  const renderIndicators = () => {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        height: '100%'
      }}>
        {/* Bonding Curve Indicator */}
        <div className="laser-border" style={{
          flex: isMobile ? 1 : 'none',
          backgroundColor: theme.bg.card,
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          border: 'none',
          height: !isMobile ? '300px' : 'auto',
          minHeight: '240px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ 
              margin: 0,
              fontSize: '18px', 
              fontWeight: '600',
              color: theme.text.primary
            }}>
              Bonding Curve
            </h3>
            
            {/* Graduate Now button - only visible for creator and if pool is not graduated yet */}
            {isCreator && pool && pool.graduated !== 'yes' && (
              <button 
                onClick={handleGraduateToken}
                disabled={graduatingToken}
                style={{
                  backgroundColor: theme.accent.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: graduatingToken ? 'default' : 'pointer',
                  opacity: graduatingToken ? 0.7 : 1,
                  transition: 'opacity 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {graduatingToken ? (
                  <>
                    <div style={{width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite'}} />
                    Processing...
                  </>
                ) : (
                  'Graduate Now'
                )}
              </button>
            )}
          </div>
          
          {/* Graduation Result Message */}
          {graduationResult && (
            <div style={{
              padding: '8px 12px',
              marginBottom: '10px',
              borderRadius: '6px',
              backgroundColor: graduationResult.success ? 'rgba(0, 184, 151, 0.1)' : 'rgba(255, 87, 87, 0.1)',
              border: `1px solid ${graduationResult.success ? 'rgba(0, 184, 151, 0.3)' : 'rgba(255, 87, 87, 0.3)'}`,
              color: graduationResult.success ? '#00B897' : '#FF5757',
              fontSize: '13px'
            }}>
              {graduationResult.message}
              {graduationResult.txHash && (
                <div style={{ marginTop: '4px' }}>
                  <a 
                    href={`https://chainscan-galileo.0g.ai/tx/${graduationResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'inherit',
                      textDecoration: 'underline',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    View transaction
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}
          
          {/* Add keyframes for spinner animation */}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
          
          {/* Bonding curve percentage based on total_supply_tokenAMM/total_supply ratio */}
          {pool && (
            <div style={{
              position: 'relative',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '5px'
            }}>
              {/* Calculate ratio of remaining tokens in the AMM */}
              {(() => {
                // Calculate the ratio of tokens in AMM vs total supply
                const totalSupply = pool.total_supply || 0;
                const totalSupplyAMM = pool.total_supply_tokenAMM || 0;
                
                // Avoid division by zero
                if (totalSupply === 0) return null;
                
                // Calculate how much has been sold (as percentage)
                const percentSold = 100 - (totalSupplyAMM / totalSupply) * 100;
                
                // Calculate progress toward graduation (75% sold = 100% progress)
                const progressToGraduation = Math.min(100, (percentSold / 75) * 100);
                
                // Graduated status is reached when 75% or more tokens are sold
                const isGraduated = percentSold >= 75;
                
                // Format for display
                const displayPercentage = Math.max(0, Math.min(progressToGraduation, 100)).toFixed(1);
                
                return (
                  <>
                    {/* Indicator position - GIF completely visible */}
                    <div style={{
                      position: 'absolute',
                      left: `${displayPercentage}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '32px',
                      height: '32px',
                      zIndex: 20,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                      transition: 'left 0.5s ease-out',
                    }}>
                      <img 
                        src="/dance.gif" 
                        alt="Indicator" 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  
                    <div style={{
                      width: '100%',
                      height: '24px',
                      backgroundColor: 'transparent',
                      borderRadius: '12px',
                      overflow: 'visible',
                      position: 'relative'
                    }}>
                      {/* Background */}
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        background: darkMode 
                          ? 'linear-gradient(to right, rgba(35, 35, 48, 0.9), rgba(25, 25, 34, 0.95))'
                          : 'linear-gradient(to right, rgba(245, 245, 248, 0.9), rgba(235, 235, 240, 0.95))',
                        borderRadius: '12px',
                        border: `1px solid ${darkMode ? 'rgba(60, 60, 80, 0.3)' : 'rgba(200, 200, 220, 0.5)'}`,
                      }}></div>
                      
                      {/* Filling with gradient - change color to gold/yellow if graduated */}
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        height: '100%',
                        width: `${displayPercentage}%`,
                        background: isGraduated 
                          ? 'linear-gradient(to left, #FFD700, #FFC000)' // Gold gradient for graduated state
                          : `linear-gradient(to left, ${theme.accent.primary}, ${theme.accent.primary}CC)`,
                        boxShadow: isGraduated 
                          ? '0 0 10px rgba(255, 215, 0, 0.5)' 
                          : `0 0 10px ${theme.accent.primary}50`,
                        transition: 'width 0.5s ease-out, background 0.5s ease-out',
                        borderRadius: '12px',
                      }}></div>
                      
                      {/* Graduated badge if 75% or more tokens sold */}
                      {isGraduated && (
                        <div style={{
                          position: 'absolute',
                          top: '-18px',
                          left: `${Math.min(displayPercentage, 90)}%`,
                          background: 'linear-gradient(to right, #FFD700, #FFA500)',
                          color: '#000',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          zIndex: 10,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          transform: 'translateX(-50%)',
                        }}>
                          GRADUATED
                        </div>
                      )}
                      
                      {/* Percentage value */}
                      <div style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '10px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: darkMode ? '#ffffff' : '#000000',
                        zIndex: 5,
                      }}>
                        {displayPercentage}%
                      </div>
                      
                      {/* Scale markers - now showing progress toward graduation */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-20px',
                        left: '0',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0 5px',
                      }}>
                        <span style={{ fontSize: '10px', color: theme.text.secondary }}>0%</span>
                        <span style={{ fontSize: '10px', color: theme.text.secondary }}>100%</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          
          <p style={{ 
            fontSize: '14px', 
            color: theme.text.secondary,
            marginTop: '10px',
            marginBottom: '15px'
          }}>
            {pool && pool.total_supply && pool.total_supply_tokenAMM && ((pool.total_supply - pool.total_supply_tokenAMM) / pool.total_supply) >= 0.75 ? (
              <>This token has <b>graduated</b> with more than 75% of supply sold from the bonding curve.</>
            ) : (
              <>
                {(() => {
                  // Calculate tokens remaining until graduation
                  const totalSupply = pool?.total_supply || 0;
                  const totalSupplyAMM = pool?.total_supply_tokenAMM || 0;
                  const tokensSold = totalSupply - totalSupplyAMM;
                  const tokensNeededForGraduation = Math.max(0, (totalSupply * 0.75) - tokensSold);
                  
                  return (
                    <>
                      <div style={{ marginBottom: '8px' }}>
                        <b>{tokensNeededForGraduation.toLocaleString(undefined, {maximumFractionDigits: 0})}</b> tokens remaining until graduation
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        When it reaches 100%, it will be traded on <a href="https://swap.lf0g.fun" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent.primary, fontWeight: 'bold', textDecoration: 'none' }}>swap.lf0g.fun</a>
                      </div>
                      <div>
                        A bonding curve is an automated market maker that allows tokens to be bought and sold at a price that changes with supply. As more tokens are purchased, the price increases following a mathematical curve.
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </p>
        </div>
        
        {/* Top Holders List (Replacing Gravity Score) */}
        <div style={{ flex: 2 }}>
          <TopHoldersList 
            pool={pool} 
            theme={theme}
            darkMode={darkMode}
          />
        </div>
      </div>
    );
  };

  // Render main content based on active tab
  const renderContent = () => {
    const contentStyle = {
      ...tabContentAnimations.slideIn,
      animationDelay: '0.1s'
    };
    
    if (activeTab === 'chart') {
      const chartContainerHeight = isMobile ? 'auto' : (isLargeScreen ? '520px' : '450px');
      
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '16px',
        }}>
          {/* Chart container with panel on the right */}
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            ...contentStyle
          }}>
            {/* Left column - Chart and Transaction History */}
            <div style={{ 
              flex: isMobile ? 'auto' : '3',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Gravity Chart */}
              <div style={{ height: isMobile ? '350px' : chartContainerHeight }}>
                <PoolPriceChart pool={pool} theme={theme} darkMode={darkMode} />
              </div>
              
              {/* On mobile: Show indicators here, between chart and transaction history */}
              {isMobile && (
                <div style={{
                  animationDelay: '0.1s',
                  ...tabContentAnimations.slideIn
                }}>
                  {renderIndicators()}
                </div>
              )}
              
              {/* Transaction History Table - szerokość równa szerokości wykresu */}
              <div style={{
                animationDelay: '0.15s',
                ...tabContentAnimations.slideIn
              }}>
                <PoolTransactionHistory pool={pool} theme={theme} darkMode={darkMode} />
              </div>
            </div>
            
            {/* Right column - Side panel with indicators (only visible on non-mobile) */}
            {!isMobile && (
              <div style={{ 
                flex: '1',
                display: 'flex'
              }}>
                {renderIndicators()}
              </div>
            )}
          </div>
        </div>
      );
    } else if (activeTab === 'socials') {
      return (
        <div style={{ ...contentStyle }}>
          <Socials 
            pool={pool} 
            theme={theme} 
            darkMode={darkMode} 
          />
        </div>
      );
    } else if (activeTab === 'rewards') {
      return (
        <div style={{ ...contentStyle }}>
          <PoolRewards 
            pool={pool} 
            theme={theme} 
            darkMode={darkMode} 
          />
        </div>
      );
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading pool data..." />;
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: '#FF5757'
      }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: theme.accent.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            marginTop: '16px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!pool) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: theme.text.secondary
      }}>
        Pool not found
      </div>
    );
  }

  return (
    <>
      {/* Style for animations */}
      <style>{animationKeyframes}</style>
      
      {/* Add spin animation for the graduated token icon */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      {/* Graduation confirmation modal */}
      <GraduationModal 
        show={showGraduationModal}
        onClose={closeGraduationModal}
        onConfirm={executeGraduation}
        pool={pool}
        theme={theme}
        darkMode={darkMode}
        isMobile={isMobile}
        graduationValidation={graduationValidation}
        areAllRequirementsMet={areAllRequirementsMet}
      />
      
      <div style={{ padding: '20px 0' }}>
        {/* Top Section with Pool Header and Buy/Sell Component */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Pool Header - same width as chart (75%) */}
          <div style={{ flex: isMobile ? 'auto' : '3' }}>
            <PoolDetailHeader pool={pool} theme={theme} />
          </div>
          
          {/* Buy/Sell Component - 25% width */}
          <div style={{ flex: isMobile ? 'auto' : '1' }}>
            <div className="laser-border" style={{
              height: '100%',
              backgroundColor: theme.bg.card,
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              border: 'none',
              position: 'relative'
            }}>
              {pool && pool.graduated === 'yes' ? (
                // Overlay for graduated tokens
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backdropFilter: 'blur(8px)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '20px',
                  zIndex: 10,
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    marginBottom: '16px',
                    animation: 'spin 10s linear infinite'
                  }}>
                    <img 
                      src="/dance.gif" 
                      alt="Graduated" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    Token Graduated!
                  </h3>
                  <p style={{ 
                    fontSize: '14px',
                    lineHeight: '1.5',
                    marginBottom: '16px'
                  }}>
                    This token has been graduated by its creator and is now available for trading on <a href="https://swap.lf0g.fun" target="_blank" rel="noopener noreferrer" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'underline' }}>swap.lf0g.fun</a>
                  </p>
                  <a 
                    href="https://swap.lf0g.fun" 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      backgroundColor: theme.accent.primary,
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
                    }}
                  >
                    Trade on Swap
                  </a>
                </div>
              ) : null}
              <PoolActionPanel 
                pool={pool} 
                theme={theme} 
                darkMode={darkMode} 
              />
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: `1px solid ${theme.border}`,
          marginBottom: '20px'
        }}>
          <div 
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderBottom: activeTab === 'chart' ? `2px solid ${theme.accent.primary}` : 'none',
              color: activeTab === 'chart' ? theme.text.primary : theme.text.secondary,
              fontWeight: activeTab === 'chart' ? '600' : '400',
              transition: 'color 0.3s ease, border-bottom 0.3s ease, font-weight 0.3s ease'
            }}
            onClick={() => handleTabChange('chart')}
          >
            Chart & Indicators
          </div>
          <div 
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderBottom: activeTab === 'socials' ? `2px solid ${theme.accent.primary}` : 'none',
              color: activeTab === 'socials' ? theme.text.primary : theme.text.secondary,
              fontWeight: activeTab === 'socials' ? '600' : '400',
              transition: 'color 0.3s ease, border-bottom 0.3s ease, font-weight 0.3s ease'
            }}
            onClick={() => handleTabChange('socials')}
          >
            Socials
          </div>
          <div 
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderBottom: activeTab === 'rewards' ? `2px solid ${theme.accent.primary}` : 'none',
              color: activeTab === 'rewards' ? theme.text.primary : theme.text.secondary,
              fontWeight: activeTab === 'rewards' ? '600' : '400',
              transition: 'color 0.3s ease, border-bottom 0.3s ease, font-weight 0.3s ease'
            }}
            onClick={() => handleTabChange('rewards')}
          >
            Rewards
          </div>
        </div>

        {/* Content based on active tab */}
        <div style={{ 
          opacity: tabChanging ? 0 : 1,
          transition: 'opacity 0.15s ease-out',
          minHeight: isMobile ? '500px' : '600px',
          position: 'relative'
        }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default PoolDetailsPageView; 