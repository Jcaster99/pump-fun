import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Graduation confirmation modal component
 * Shows graduation requirements and confirmation dialog
 */
const GraduationModal = ({
  show,
  onClose,
  onConfirm,
  pool,
  theme,
  darkMode,
  isMobile,
  graduationValidation,
  areAllRequirementsMet
}) => {
  if (!show) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: theme.bg.card,
        borderRadius: '16px',
        padding: '24px',
        width: isMobile ? '90%' : '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${theme.border}`,
        animation: 'fadeIn 0.3s ease'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          marginTop: 0,
          marginBottom: '20px',
          color: theme.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={20} color="#FFD700" />
          Confirm Token Graduation
        </h2>
        
        <p style={{ 
          fontSize: '14px', 
          lineHeight: '1.6',
          color: theme.text.secondary,
          marginBottom: '24px'
        }}>
          You are about to graduate this token. This is an <b>irreversible action</b> that will:
        </p>
        
        <ul style={{ 
          listStyle: 'none',
          padding: 0,
          margin: '0 0 24px 0'
        }}>
          <li style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '12px',
            color: theme.text.primary,
            fontSize: '14px'
          }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>•</div>
            <div>Close bonding curve trading on this platform.</div>
          </li>
          <li style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '12px',
            color: theme.text.primary,
            fontSize: '14px'
          }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>•</div>
            <div>Create a liquidity pool on swap.lf0g.fun.</div>
          </li>
          <li style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '12px',
            color: theme.text.primary,
            fontSize: '14px'
          }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>•</div>
            <div>Permanently lock remaining curve token supply as initial liquidity.</div>
          </li>
          <li style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '12px',
            color: theme.text.primary,
            fontSize: '14px'
          }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>•</div>
            <div>Burn 100% of the generated LP tokens, making this liquidity permanently available to all traders.</div>
          </li>
        </ul>
        
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: theme.text.primary
        }}>
          Graduation Requirements
        </h3>
        
        <div style={{
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {graduationValidation.bondingCurve ? (
                <CheckCircle size={18} color="#00B897" />
              ) : (
                <XCircle size={18} color="#FF5757" />
              )}
              <span style={{ fontSize: '14px', color: theme.text.primary }}>
                Minimum 75% tokens sold from curve
              </span>
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500',
              color: graduationValidation.bondingCurve ? '#00B897' : theme.text.secondary
            }}>
              {pool && (
                <>
                  {(100 - ((pool.total_supply_tokenAMM || 0) / (pool.total_supply || 1) * 100)).toFixed(2)}%
                </>
              )}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {graduationValidation.minHolders ? (
                <CheckCircle size={18} color="#00B897" />
              ) : (
                <XCircle size={18} color="#FF5757" />
              )}
              <span style={{ fontSize: '14px', color: theme.text.primary }}>
                Minimum 10 unique token holders
              </span>
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500',
              color: graduationValidation.minHolders ? '#00B897' : theme.text.secondary
            }}>
              {pool?.holders || 0}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {graduationValidation.minCreationTime ? (
                <CheckCircle size={18} color="#00B897" />
              ) : (
                <XCircle size={18} color="#FF5757" />
              )}
              <span style={{ fontSize: '14px', color: theme.text.primary }}>
                Token age minimum 7 days
              </span>
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500',
              color: graduationValidation.minCreationTime ? '#00B897' : theme.text.secondary
            }}>
              {pool && pool.created_at && (
                `${Math.floor((new Date() - new Date(pool.created_at)) / (1000 * 60 * 60 * 24))} days`
              )}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {graduationValidation.minGravityScore ? (
                <CheckCircle size={18} color="#00B897" />
              ) : (
                <XCircle size={18} color="#FF5757" />
              )}
              <span style={{ fontSize: '14px', color: theme.text.primary }}>
                Minimum 600 Gravity Score
              </span>
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500',
              color: graduationValidation.minGravityScore ? '#00B897' : theme.text.secondary
            }}>
              {pool?.gravity_score || 0}
            </span>
          </div>
        </div>
        
        {!areAllRequirementsMet() && (
          <div style={{
            backgroundColor: 'rgba(255, 87, 87, 0.1)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={18} color="#FF5757" />
            <span style={{ 
              fontSize: '13px', 
              color: '#FF5757'
            }}>
              Your token does not meet all graduation requirements yet.
            </span>
          </div>
        )}
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '20px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: theme.text.secondary,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            disabled={!areAllRequirementsMet()}
            style={{
              padding: '10px 20px',
              backgroundColor: areAllRequirementsMet() ? theme.accent.primary : 'rgba(0, 184, 151, 0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: areAllRequirementsMet() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              opacity: areAllRequirementsMet() ? 1 : 0.7
            }}
          >
            Graduate Token
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraduationModal; 