import React from 'react';
import { ArrowRight, Lock, Unlock, Loader2, CheckCircle } from 'lucide-react';

const PoolRewardsView = ({
  pool,
  theme,
  darkMode,
  wallet,
  isCreator,
  gravityScore,
  claimableTokens,
  thresholds,
  isClaiming,
  handleClaimTokens,
  claimButtonState
}) => {
  // Tworzymy tablicę progów Gravity Score
  const milestones = [
    { score: 200, percentage: 0.5 },
    { score: 400, percentage: 1.0 },
    { score: 600, percentage: 2.0 },
    { score: 800, percentage: 3.0 },
    { score: 1000, percentage: 3.5 }
  ];
  
  // Style komponentu
  const getLockIconColor = (isReached) => {
    return isReached ? '#00D2FF' : (darkMode ? '#444' : '#ccc');
  };
  
  // Get style for milestone
  const getMilestoneStyle = (milestone, isReached, isActive, isLast = false) => {
    return {
      backgroundColor: isReached 
        ? 'rgba(0, 210, 255, 0.1)' 
        : (darkMode ? 'rgba(30, 30, 40, 0.5)' : 'rgba(240, 240, 250, 0.5)'),
      borderRadius: '16px',
      padding: '20px',
      position: 'relative',
      marginBottom: isLast ? 0 : '20px',
      border: `1px solid ${isReached ? 'rgba(0, 210, 255, 0.3)' : (darkMode ? 'rgba(60, 60, 80, 0.3)' : 'rgba(200, 200, 220, 0.5)')}`,
      transition: 'all 0.3s ease',
      opacity: isActive ? 1 : 0.7,
      transform: isActive ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isActive 
        ? '0 4px 20px rgba(0, 210, 255, 0.2)' 
        : 'none'
    };
  };
  
  // Button style based on state
  const getButtonStyle = (milestone) => {
    // Determine if this milestone's tokens can be claimed
    const state = claimButtonState[milestone.score];
    
    // Base style
    const baseStyle = {
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      minWidth: '120px',
      transition: 'all 0.3s ease'
    };
    
    // Style variants based on state
    const variants = {
      // Can't claim because not reached
      locked: {
        ...baseStyle,
        backgroundColor: darkMode ? 'rgba(60, 60, 80, 0.5)' : 'rgba(220, 220, 230, 0.8)',
        color: darkMode ? '#666' : '#999',
        cursor: 'not-allowed'
      },
      // Can claim but not unlocked (gravity score reached but time constraint)
      pending: {
        ...baseStyle,
        backgroundColor: darkMode ? 'rgba(255, 180, 0, 0.2)' : 'rgba(255, 180, 0, 0.1)',
        color: '#FFA500',
        cursor: 'not-allowed',
        border: '1px solid rgba(255, 180, 0, 0.3)'
      },
      // Can claim and is unlocked
      claimable: {
        ...baseStyle,
        backgroundColor: theme.accent.primary,
        color: 'white',
        boxShadow: '0 2px 8px rgba(0, 210, 255, 0.3)',
        cursor: 'pointer'
      },
      // Already claimed
      claimed: {
        ...baseStyle,
        backgroundColor: darkMode ? 'rgba(0, 210, 0, 0.2)' : 'rgba(0, 210, 0, 0.1)',
        color: '#00B897',
        cursor: 'default',
        border: '1px solid rgba(0, 210, 0, 0.3)'
      },
      // In process of claiming
      loading: {
        ...baseStyle,
        backgroundColor: theme.accent.primary,
        color: 'white',
        opacity: 0.8,
        cursor: 'not-allowed'
      }
    };
    
    return variants[state] || variants.locked;
  };
  
  // Button content based on state
  const getButtonContent = (milestone) => {
    const state = claimButtonState[milestone.score];
    
    switch (state) {
      case 'locked':
        return (
          <>
            <Lock size={14} />
            <span>Locked</span>
          </>
        );
      case 'pending':
        return (
          <>
            <Unlock size={14} />
            <span>Pending</span>
          </>
        );
      case 'claimable':
        return (
          <>
            <Unlock size={14} />
            <span>Claim {milestone.percentage}%</span>
          </>
        );
      case 'claimed':
        return (
          <>
            <CheckCircle size={14} />
            <span>Claimed</span>
          </>
        );
      case 'loading':
        return (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Claiming...</span>
          </>
        );
      default:
        return (
          <>
            <Lock size={14} />
            <span>Locked</span>
          </>
        );
    }
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '20px',
      width: '100%'
    }}>
      
      {/* Cosmic Gravity Score Display */}
      <div style={{ 
        backgroundColor: theme.bg.card,
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }} className="laser-border">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px' 
        }}>
          {/* Cosmic background effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            background: `radial-gradient(circle at center, ${darkMode ? 'rgba(0, 61, 100, 0.3)' : 'rgba(0, 210, 255, 0.05)'} 0%, transparent 70%)`
          }} />
          
          {/* Animated dance gif at the top */}
          <div style={{ 
            width: '80px', 
            height: '80px',
            zIndex: 1,
            marginTop: '8px',
            filter: 'drop-shadow(0 0 12px rgba(0, 210, 255, 0.5))'
          }}>
            <img 
              src="/dance.gif" 
              alt="Gravity Dance" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
          
          {/* Gravity Score Title */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1 
          }}>
            <h3 style={{ 
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: theme.text.primary,
              marginBottom: '4px'
            }}>
              Gravity Score
            </h3>
            <div style={{
              fontSize: '52px',
              fontWeight: '700',
              color: theme.accent.primary,
              textShadow: `0 0 15px ${theme.accent.primary}40`,
              fontFamily: 'monospace'
            }}>
              {gravityScore || '0'}
            </div>
          </div>
          
          {/* Explanation text */}
          <p style={{ 
            fontSize: '14px',
            color: theme.text.secondary,
            textAlign: 'center',
            maxWidth: '500px',
            margin: '8px 0 0 0',
            zIndex: 1
          }}>
            Gravity Score is a measure of your token's performance and community engagement.
            Reach higher scores to unlock tokens reserved for creator.
          </p>
          
          {/* Creator info */}
          {isCreator ? (
            <div style={{
              marginTop: '16px',
              padding: '12px 20px',
              backgroundColor: darkMode ? 'rgba(0, 210, 255, 0.1)' : 'rgba(0, 210, 255, 0.05)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 1
            }}>
              <img 
                src="/dance.gif" 
                alt="Creator" 
                style={{
                  width: '24px',
                  height: '24px',
                }}
              />
              <span style={{ color: theme.text.primary, fontWeight: 600 }}>
                You're the creator of this token
              </span>
            </div>
          ) : (
            <div style={{
              marginTop: '16px',
              padding: '12px 20px',
              backgroundColor: darkMode ? 'rgba(60, 60, 80, 0.3)' : 'rgba(220, 220, 230, 0.5)',
              borderRadius: '8px',
              color: theme.text.secondary,
              fontSize: '14px',
              zIndex: 1
            }}>
              Only the token creator can claim unlocked tokens
            </div>
          )}
        </div>
      </div>
      
      {/* Milestones */}
      <div style={{
        backgroundColor: theme.bg.card,
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }} className="laser-border">
        <h3 style={{ 
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: theme.text.primary,
          marginBottom: '4px'
        }}>
          Creator Reward Milestones
        </h3>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          marginTop: '8px'
        }}>
          {milestones.map((milestone, index) => {
            const isReached = thresholds && thresholds[milestone.score] !== undefined 
              ? thresholds[milestone.score] 
              : gravityScore >= milestone.score;
              
            const isActive = isCreator && claimButtonState[milestone.score] === 'claimable';
            const isLast = index === milestones.length - 1;
            
            return (
              <div 
                key={milestone.score} 
                style={getMilestoneStyle(milestone, isReached, isActive, isLast)}
              >
                {/* Milestone header with GS level */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: isReached ? 'rgba(0, 210, 255, 0.15)' : (darkMode ? 'rgba(60, 60, 80, 0.5)' : 'rgba(220, 220, 230, 0.8)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isReached ? (
                        <Unlock size={20} color={theme.accent.primary} />
                      ) : (
                        <Lock size={20} color={getLockIconColor(isReached)} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: isReached ? theme.accent.primary : theme.text.primary 
                      }}>
                        {milestone.score} Gravity Score
                      </h4>
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '14px', 
                        color: theme.text.secondary 
                      }}>
                        Unlocks {milestone.percentage}% of creator tokens
                      </p>
                    </div>
                  </div>
                  
                  {/* Dance animation */}
                  <div style={{ 
                    width: '36px', 
                    height: '36px',
                    opacity: isReached ? 1 : 0.3
                  }}>
                    <img 
                      src="/dance.gif" 
                      alt="Dance" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: isReached ? 'none' : 'grayscale(100%)'
                      }}
                    />
                  </div>
                </div>
                
                {/* Milestone content with claim button */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    flex: 1,
                    maxWidth: '60%' 
                  }}>
                    <p style={{ 
                      margin: 0,
                      fontSize: '14px',
                      color: theme.text.secondary,
                      lineHeight: '1.5'
                    }}>
                      {isReached ? (
                        <>This milestone has been <span style={{ color: theme.accent.primary, fontWeight: 600 }}>reached</span>!</>
                      ) : (
                        <>Work on increasing your Gravity Score to reach this milestone.</>
                      )}
                    </p>
                  </div>
                  
                  {isCreator && (
                    <button
                      style={getButtonStyle(milestone)}
                      onClick={() => handleClaimTokens(milestone.score)}
                      disabled={
                        claimButtonState[milestone.score] === 'locked' || 
                        claimButtonState[milestone.score] === 'claimed' ||
                        claimButtonState[milestone.score] === 'loading' ||
                        claimButtonState[milestone.score] === 'pending'
                      }
                    >
                      {getButtonContent(milestone)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PoolRewardsView; 