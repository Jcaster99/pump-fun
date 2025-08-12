import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const FirstTimeSignIn = ({ 
  showFirstTimeSignIn, 
  handleFirstTimeSignIn, 
  cancelFirstTimeSignIn, 
  error, 
  isLoading, 
  wallet 
}) => {
  const { theme, darkMode } = useTheme();
  
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Jeśli nie powinniśmy pokazywać formularza, zwróć null
  if (!showFirstTimeSignIn || !wallet) return null;
  
  // Walidacja formularza
  const validateForm = () => {
    let isValid = true;
    
    // Sprawdzenie, czy username jest poprawny
    if (!newUsername.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      isValid = false;
    } else if (newUsername.length > 15) {
      setUsernameError('Username cannot exceed 15 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    return isValid;
  };
  
  // Obsługa zatwierdzenia formularza
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      handleFirstTimeSignIn(newUsername);
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.7)'
    }}>
      <div style={{
        backgroundColor: theme.bg.card,
        borderRadius: '24px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '450px',
        width: '100%',
        margin: '0 16px',
        overflow: 'hidden',
        color: theme.text.primary
      }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '12px' }}>
            Create Your Account
          </h2>
          
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: theme.text.secondary, fontSize: '0.95rem' }}>
              This is your first time connecting this wallet. Please choose a username to continue.
            </p>
          </div>
          
          {/* Informacje o portfelu */}
          <div style={{ 
            backgroundColor: theme.bg.panel, 
            borderRadius: '16px', 
            padding: '16px', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              marginRight: '16px'
            }}>
              <img 
                src="/pfpzer0.png" 
                alt="Profile" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            <div>
              <div style={{ color: theme.text.secondary, fontSize: '0.85rem' }}>Wallet Address</div>
              <div style={{ fontWeight: '500' }}>{wallet?.shortAddress}</div>
            </div>
          </div>
          
          {/* Formularz */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                color: theme.text.secondary, 
                fontSize: '0.9rem', 
                marginBottom: '8px' 
              }}>
                Username
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  backgroundColor: theme.bg.panel,
                  border: `1px solid ${usernameError ? '#ff4d4f' : theme.border}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: theme.text.primary,
                  outline: 'none',
                  fontSize: '1rem'
                }}
                placeholder="Choose a username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={isLoading}
              />
              {usernameError && (
                <p style={{ 
                  color: '#ff4d4f', 
                  fontSize: '0.85rem', 
                  marginTop: '8px' 
                }}>
                  {usernameError}
                </p>
              )}
            </div>
            
            {/* Informacje o podpisie */}
            <div style={{ 
              backgroundColor: theme.bg.panel,
              borderRadius: '12px', 
              padding: '12px', 
              marginBottom: '16px' 
            }}>
              <p style={{ color: theme.text.secondary, fontSize: '0.85rem' }}>
                You'll be asked to sign a message to verify your wallet ownership and connect it with your username. This doesn't cost any gas fees.
              </p>
              <p style={{ color: theme.text.secondary, fontSize: '0.85rem', marginTop: '8px' }}>
                <strong>Message format:</strong> "I am signing this message to verify my wallet address {wallet?.shortAddress} and connect it with username: {newUsername} on lf0g.fun"
              </p>
            </div>
            
            {/* Wyświetlanie błędów */}
            {error && (
              <div style={{ 
                backgroundColor: 'rgba(255, 59, 48, 0.1)', 
                border: '1px solid rgba(255, 59, 48, 0.2)',
                color: '#ff3b30',
                borderRadius: '12px', 
                padding: '12px', 
                marginBottom: '16px' 
              }}>
                <p style={{ fontSize: '0.9rem' }}>{error}</p>
              </div>
            )}
            
            {/* Przyciski akcji */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              marginTop: '24px' 
            }}>
              <button
                type="button"
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'transparent',
                  color: theme.text.secondary,
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  opacity: isLoading ? 0.7 : 1
                }}
                onClick={cancelFirstTimeSignIn}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: darkMode
                    ? `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`
                    : `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
                  color: 'white',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: isLoading ? 0.7 : 1
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      marginRight: '8px',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Processing...
                  </>
                ) : (
                  'Sign & Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FirstTimeSignIn; 