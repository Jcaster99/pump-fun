import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from '../context/NavigationContext';
import PoolCard from '../components/pools/PoolCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ParticleBackground from '../components/common/ParticleBackground';
import { Plus } from 'lucide-react';

const MyTokensPage = () => {
  const { theme, darkMode } = useTheme();
  const { wallet, connectWallet } = useWallet();
  const navigate = useNavigate();
  const requestSentRef = useRef(false);
  
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch my tokens when wallet changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchMyTokens = async () => {
      if (!wallet) {
        setLoading(false);
        return;
      }
      
      // Zapobiega wielokrotnym zapytaniom
      if (requestSentRef.current) {
        return;
      }
      
      requestSentRef.current = true;
      
      try {
        setLoading(true);
        if (process.env.REACT_APP_TEST === 'true') {
          console.log(`Fetching tokens for address: ${wallet.address}`);
        }
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/pools/creator/${wallet.address}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch your tokens: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (process.env.REACT_APP_TEST === 'true') {
          console.log("API response:", data);
        }
        
        // Sprawdź czy komponent jest nadal zamontowany
        if (!isMounted) return;
        
        // Sprawdź strukturę odpowiedzi i ustaw pools
        if (data && Array.isArray(data)) {
          setPools(data);
        } else if (data && data.success && Array.isArray(data.data)) {
          setPools(data.data);
        } else if (data && Array.isArray(data.data)) {
          setPools(data.data);
        } else {
          console.error("Unexpected API response format:", data);
          throw new Error('Unexpected API response format');
        }
      } catch (err) {
        console.error('Error fetching my tokens:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load your tokens');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Wykonaj tylko jedno zapytanie po załadowaniu komponentu
    fetchMyTokens();
    
    // Funkcja czyszcząca
    return () => {
      isMounted = false;
    };
  }, [wallet?.address]); // Użyj wallet.address zamiast całego obiektu wallet
  
  // Reset requestSentRef gdy adres portfela się zmienia
  useEffect(() => {
    requestSentRef.current = false;
  }, [wallet?.address]);
  
  // Create media query style for grid columns
  const getGridColumns = () => {
    const width = window.innerWidth;
    if (width < 768) {
      return 'repeat(1, 1fr)'; // Mobile - 1 column
    } else if (width < 1024) {
      return 'repeat(2, 1fr)'; // Tablets - 2 columns
    } else if (width < 1280) {
      return 'repeat(3, 1fr)'; // Small desktops - 3 columns
    } else {
      return 'repeat(4, 1fr)'; // Larger desktops - 4 columns
    }
  };
  
  const [gridColumns, setGridColumns] = useState(getGridColumns());
  
  // Adjust layout to screen width
  useEffect(() => {
    const handleResize = () => {
      setGridColumns(getGridColumns());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      {/* Tło z cząsteczkami */}
      <ParticleBackground zIndex={1} />
      
      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '30px',
          position: 'relative'
        }}>
          {/* Usunięto przycisk "Add Token" */}
        </div>
        
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
              You need to connect your wallet to view your tokens.
              Access to your created tokens requires wallet authentication.
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
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 16px'
          }}>
            {/* Grid of tokens or load/empty states */}
            {loading ? (
              <div style={{ 
                backgroundColor: theme.bg.card,
                borderRadius: '16px',
                padding: '20px',
                border: `1px solid ${theme.border}`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
                boxShadow: `0 0 15px rgba(${parseInt(theme.accent.primary.slice(1, 3), 16)}, ${parseInt(theme.accent.primary.slice(3, 5), 16)}, ${parseInt(theme.accent.primary.slice(5, 7), 16)}, 0.15)`
              }}>
                <LoadingSpinner text="Loading your tokens..." />
              </div>
            ) : error ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#FF5757',
                backgroundColor: theme.bg.card,
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                boxShadow: `0 0 15px rgba(${parseInt(theme.accent.primary.slice(1, 3), 16)}, ${parseInt(theme.accent.primary.slice(3, 5), 16)}, ${parseInt(theme.accent.primary.slice(5, 7), 16)}, 0.15)`
              }}>
                <p style={{ marginBottom: '12px' }}>{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    background: darkMode 
                      ? `linear-gradient(90deg, ${theme.accent.primary}, #00D2FF)`
                      : `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : pools.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                borderRadius: '12px',
                backgroundColor: darkMode ? 'rgba(20, 25, 30, 0.2)' : 'rgba(240, 240, 245, 0.5)',
                marginTop: '20px'
              }}>
                <p style={{ 
                  color: theme.text.secondary,
                  fontSize: '16px',
                  marginBottom: '16px'
                }}>
                  You haven't created any tokens yet.
                </p>
                
                <button
                  onClick={() => navigate('/create-token')}
                  style={{
                    background: darkMode 
                      ? `linear-gradient(90deg, ${theme.accent.primary}, #00D2FF)`
                      : `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={16} />
                  Create Your First Token
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: gridColumns,
                gap: '24px',
                marginTop: '16px'
              }}>
                {pools.map(pool => (
                  <PoolCard 
                    key={pool.id}
                    pool={pool}
                    theme={theme}
                    darkMode={darkMode}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTokensPage; 