import { AlertTriangle, Check } from 'lucide-react';
import React from 'react';
import TransactionOverlay from '../components/TokenCreation/TransactionOverlay';
import { useNavigate } from '../context/NavigationContext';
import { useTheme } from '../context/ThemeContext';
import useCreateToken from '../hooks/useCreateToken';
import useNSFWDetection from '../hooks/useNSFWDetection';
import { useWallet } from '../hooks/useWallet';
import CreateTokenForm from './CreateTokenForm';

// Pobieramy wartości z zmiennych środowiskowych
const TREASURY_ADDRESS = process.env.REACT_APP_TREASURY_ADDRESS || "0x0f13e85B575964B8b4b77E37d43A6aE9E354e94C";
const LISTING_FEE = process.env.REACT_APP_LISTING_FEE || "0.015"; // Fallback wartość w razie braku zmiennej

const CreateToken = () => {
  const { theme, darkMode } = useTheme();
  const { wallet, connectWallet, username } = useWallet();
  const navigate = useNavigate();

  // Use NSFW detection hook
  const { 
    checking, 
    handleImageValidation 
  } = useNSFWDetection();

  // Use token creation hook
  const {
    formData,
    image,
    imagePreview,
    loading,
    error,
    success,
    formErrors,
    transactionStep,
    formVisible,
    handleChange,
    handleImageChange: baseHandleImageChange,
    handleSubmit: baseHandleSubmit,
    showForm
  } = useCreateToken(wallet, connectWallet, navigate, username);

  // Wrapper for image change to integrate with NSFW detection
  const handleImageChange = (e) => {
    baseHandleImageChange(e, handleImageValidation);
  };

  // Wrapper for submit to provide constants
  const handleSubmit = (e) => {
    baseHandleSubmit(e, TREASURY_ADDRESS, LISTING_FEE);
  };

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: '72px', // For fixed header
      paddingBottom: '32px',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Particle Background */}
      {/* <ParticleBackground /> */}

      {/* Transaction Progress Overlay */}
      <TransactionOverlay 
        transactionStep={transactionStep}
        theme={theme}
        darkMode={darkMode}
        LISTING_FEE={LISTING_FEE}
      />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 16px',
        position: 'relative',
        zIndex: 2
      }}>
          {!wallet ? (
            <div style={{
              backgroundColor: darkMode ? 'rgba(25, 30, 40, 0.7)' : theme.bg.card,
              borderRadius: '16px',
              boxShadow: darkMode ? '0 8px 16px rgba(0,0,0,0.3)' : '0 8px 16px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              padding: '40px 24px',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: darkMode 
                    ? `0 0 20px 2px ${theme.accent.primary}` 
                    : `0 0 20px 2px ${theme.accent.secondary}`,
                  border: darkMode 
                    ? `2px solid ${theme.accent.primary}` 
                    : `2px solid ${theme.accent.secondary}`,
                }}>
                  <img 
                    src="/zer02.gif" 
                    alt="Connect Wallet"
                    onError={(e) => e.target.src = '/zer03.gif'} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
              
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600',
                color: theme.text.primary,
                marginBottom: '16px'
              }}>
                Wallet Connection Required
              </h2>
              
              <p style={{ 
                color: theme.text.secondary, 
                marginBottom: '24px',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                You need to connect your wallet to create a token.
                Access to token creation requires wallet authentication.
              </p>
              
              <button 
                onClick={connectWallet}
                style={{
                  background: darkMode 
                    ? `linear-gradient(90deg, ${theme.accent.primary}, #00D2FF)` 
                    : `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 32px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Connect Wallet
              </button>
            </div>
          ) : (
          <>
          <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '28px',
              marginTop: '15px'
          }}>
            <div style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: darkMode 
                  ? `0 0 30px 5px ${theme.accent.primary}` 
                  : `0 0 30px 5px ${theme.accent.secondary}`,
                border: darkMode 
                  ? `3px solid ${theme.accent.primary}` 
                  : `3px solid ${theme.accent.secondary}`,
                animation: 'pulse 2s infinite'
            }}>
              <img 
                  src="/zer0smoke.gif" 
                  alt="zer0smoke"
                style={{
                  width: '100%',
                  height: '100%',
                    objectFit: 'cover'
                }}
                  onError={(e) => e.target.src = '/pfpzer0.png'} 
              />
              </div>
            </div>
            
            {formVisible ? (
              <div style={{
                textAlign: 'center',
                marginBottom: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: 'fadeIn 0.5s ease-in-out'
              }}>
                <p style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: darkMode ? theme.accent.primary : theme.accent.secondary,
                  textShadow: darkMode 
                    ? '0 0 8px rgba(0, 210, 233, 0.6)' 
                    : '0 0 8px rgba(255, 92, 170, 0.5)',
                  letterSpacing: '0.5px'
                }}>
                  Shh… you're a sneaky 0ne.
                </p>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                marginBottom: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '5px',
                    color: darkMode ? theme.accent.primary : theme.accent.secondary,
                    textShadow: darkMode 
                      ? '0 0 8px rgba(0, 210, 233, 0.6)' 
                      : '0 0 8px rgba(255, 92, 170, 0.5)',
                    letterSpacing: '0.5px'
                  }}>
                    Are u ready t0 create 0wn t0ken?
                  </p>
                  <p style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 35, 45, 0.7)',
                    fontStyle: 'italic'
                  }}>
                    ch00se wisely...
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center'
                }}>
                  <button 
                    type="button"
                    onClick={showForm}
                    style={{
                      background: darkMode 
                        ? 'rgba(30, 35, 45, 0.6)' 
                        : 'rgba(248, 250, 252, 0.8)',
                      border: `2px solid ${darkMode ? theme.accent.primary : theme.accent.secondary}`,
                      borderRadius: '12px',
                      padding: '12px 24px',
                      color: darkMode ? theme.accent.primary : theme.accent.secondary,
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.background = darkMode 
                        ? `linear-gradient(90deg, ${theme.accent.primary}, #00D2FF)` 
                        : `linear-gradient(90deg, ${theme.accent.secondary}, ${theme.accent.primary})`;
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.background = darkMode 
                        ? 'rgba(30, 35, 45, 0.6)' 
                        : 'rgba(248, 250, 252, 0.8)';
                      e.currentTarget.style.color = darkMode ? theme.accent.primary : theme.accent.secondary;
                    }}
                  >
                    Yes
                  </button>
                  <button 
                    type="button"
                    onClick={showForm}
                    style={{
                      background: darkMode 
                        ? 'rgba(30, 35, 45, 0.6)' 
                        : 'rgba(248, 250, 252, 0.8)',
                      border: `2px solid ${darkMode ? theme.accent.primary : theme.accent.secondary}`,
                      borderRadius: '12px',
                      padding: '14px 28px',
                      color: darkMode ? theme.accent.primary : theme.accent.secondary,
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.25)';
                      e.currentTarget.style.background = darkMode 
                        ? `linear-gradient(90deg, ${theme.accent.primary}, #00D2FF)` 
                        : `linear-gradient(90deg, ${theme.accent.secondary}, ${theme.accent.primary})`;
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
                      e.currentTarget.style.background = darkMode 
                        ? 'rgba(30, 35, 45, 0.6)' 
                        : 'rgba(248, 250, 252, 0.8)';
                      e.currentTarget.style.color = darkMode ? theme.accent.primary : theme.accent.secondary;
                    }}
                  >
                    Definitely Yes
                  </button>
                </div>
                
                {!formVisible && (
                  <div
                    style={{
                      marginTop: '40px',
                      animation: 'bounceArrow 1.5s infinite ease-in-out',
                      opacity: 0.8
                    }}
                  >
                    <svg 
                      width="40" 
                      height="40" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke={darkMode ? theme.accent.primary : theme.accent.secondary}
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
                    </svg>
                  </div>
                )}
              </div>
            )}
            
            <style jsx="true">{`
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 ${darkMode ? 'rgba(0, 210, 233, 0.6)' : 'rgba(255, 92, 170, 0.6)'}; }
                70% { box-shadow: 0 0 0 15px ${darkMode ? 'rgba(0, 210, 233, 0)' : 'rgba(255, 92, 170, 0)'}; }
                100% { box-shadow: 0 0 0 0 ${darkMode ? 'rgba(0, 210, 233, 0)' : 'rgba(255, 92, 170, 0)'}; }
              }
              
              @keyframes bounceArrow {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(10px); }
              }
              
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
        
            {error && (
              <div style={{
            padding: '12px 16px',
                backgroundColor: 'rgba(255, 87, 87, 0.1)',
                borderRadius: '8px',
            marginBottom: '24px',
                display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
              }}>
            <AlertTriangle size={20} color="#FF5757" style={{ marginTop: '2px' }} />
            <p style={{ color: '#FF5757', fontSize: '14px', lineHeight: '1.5', flex: 1 }}>
              {error}
            </p>
              </div>
            )}
            
            {success && (
              <div style={{
                padding: '12px 16px',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  borderRadius: '8px',
            marginBottom: '24px',
                          display: 'flex',
            alignItems: 'flex-start',
                      gap: '12px'
                    }}>
            <Check size={20} color="#34D399" style={{ marginTop: '2px' }} />
            <p style={{ color: '#34D399', fontSize: '14px', lineHeight: '1.5', flex: 1 }}>
              {success}
            </p>
                    </div>
                  )}

        <div 
          style={{
            maxHeight: formVisible ? '3000px' : '0',
            opacity: formVisible ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease-in-out',
            marginTop: formVisible ? '32px' : '0',
            transform: formVisible ? 'translateY(0)' : 'translateY(-20px)',
            position: 'relative',
          }}
        >
          {formVisible && (
            <div 
              style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderBottom: `15px solid ${darkMode ? 'rgba(25, 30, 40, 0.7)' : theme.bg.card}`,
                zIndex: 10
              }}
            />
          )}
        <CreateTokenForm 
          formData={formData}
          formErrors={formErrors}
          image={image}
          imagePreview={imagePreview}
          loading={loading}
          checking={checking}
          handleChange={handleChange}
          handleImageChange={handleImageChange}
          handleSubmit={handleSubmit}
          theme={theme}
          darkMode={darkMode}
          connectWallet={connectWallet}
          wallet={wallet}
          LISTING_FEE={LISTING_FEE}
            id="token-form"
        />
        </div>
      </>
        )}
      </div>
    </div>
  );
};

export default CreateToken;