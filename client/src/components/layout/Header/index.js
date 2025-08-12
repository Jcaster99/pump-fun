import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { ConnectWalletButton } from '../../../components/wallet/RainbowKitProvider';
import { searchPools, fetchPoolByAddress } from '../../../api/poolsApi';
import { useNavigate } from '../../../context/NavigationContext';
import { useTransaction } from '../../../context/TransactionContext';
import TransactionNotification from './TransactionNotification';
import TokenCreationNotification from './TokenCreationNotification';

// Define the keyframes animation
const spinAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Ethereum address regex pattern
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const Header = ({ toggleSidebar, isMobile }) => {
  const { theme } = useTheme();
  const { updateLastTransaction } = useTransaction();
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside to close search results
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim() === '') {
      setShowResults(false);
      setSearchResults([]);
      return;
    }
    
    // Check if input is an Ethereum address
    if (ETH_ADDRESS_REGEX.test(value)) {
      try {
        setIsLoading(true);
        // Attempt to fetch the pool directly by address
        const pool = await fetchPoolByAddress(value);
        if (pool && !pool.error) {
          // Navigate directly to the pool page
          navigate(`/pool/${value}`);
          setSearchValue('');
          setSearchResults([]);
          setShowResults(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching pool by address:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Debounce search to avoid too many API calls
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        
        // Use symbolSearch for short queries
        const useSymbolSearch = value.length <= 4;
        const data = await searchPools(value, useSymbolSearch ? 3 : 10, useSymbolSearch);
        
        if (process.env.REACT_APP_TEST === 'true') {
          console.log("Search API response:", data); // Debug log
        }
        
        let results = [];
        
        // Check if data is in the expected format
        if (data.pools && Array.isArray(data.pools)) {
          results = data.pools;
        } else if (Array.isArray(data)) {
          results = data;
        } else if (data.data && Array.isArray(data.data)) {
          results = data.data;
        }
        
        // For short inputs (up to 4 characters), the backend already prioritizes and limits results
        // But we'll format them specially in the UI
        
        setSearchResults(results);
        setShowResults(results.length > 0);
        
        // Log what we're showing for debugging
        if (process.env.REACT_APP_TEST === 'true') {
          console.log(`Showing ${results.length} results for search "${value}"`);
          if (results.length > 0) {
            console.log("First result:", results[0]);
          }
        }
        
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };
  
  const handleResultClick = (pool) => {
    setShowResults(false);
    setSearchResults([]);
    setSearchValue('');
    navigate(`/pool/${pool.token_address}`);
  };
  
  const handleKeyDown = (e) => {
    // Navigate to first result on Enter key
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  };
  
  // Format the display name for search results
  const formatPoolName = (pool) => {
    // For short tag searches, make the display more descriptive
    return `${pool.name || ''} (${pool.symbol || ''})`;
  };
  
  const handleFocus = () => {
    // Show results again when input is focused if we have results
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };
  
  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        padding: '20px',
        borderBottom: `1px solid ${theme.border}`,
        gap: '10px',
        position: 'relative',
        zIndex: 10,
        backgroundColor: theme.bg.main
      }}
    >
      {/* Top row - Menu button and wallet on mobile, or just the wallet on desktop */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '10px' : '0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Menu button on mobile */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.text.primary,
                padding: '8px'
              }}
            >
              <Menu size={24} />
            </button>
          )}
          
          {/* Transaction notification */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '10px'
          }}>
            <TokenCreationNotification />
            <TransactionNotification />
          </div>
          
          {/* Wallet button - aligned to the right on desktop, below notification on mobile */}
          {!isMobile && (
            <div className="wallet-button-container" style={{ 
              marginLeft: 'auto'
            }}>
              <ConnectWalletButton />
            </div>
          )}
        </div>
        
        {/* Wallet button on mobile - full width */}
        {isMobile && (
          <div className="wallet-button-container" style={{ 
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <ConnectWalletButton />
          </div>
        )}
      </div>
      
      {/* Second row - Search bar */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: isMobile ? 'flex-start' : 'center' // Center on desktop, left-aligned on mobile
      }}>
        <div 
          ref={searchRef}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            flex: isMobile ? 1 : 'unset', // Take full width on mobile, only required width on desktop
            width: isMobile ? '100%' : 'auto',
            maxWidth: '600px',
            minWidth: !isMobile ? '400px' : 'auto', // Ensure min-width on desktop
            background: theme.bg.card,
            borderRadius: '18px',
            padding: '10px 15px',
            border: `1px solid ${theme.border}`,
            position: 'relative' // For search results dropdown
          }}
        >
          <Search size={18} color={theme.text.secondary} />
          <input 
            placeholder={isMobile ? "Search..." : "Search for token or paste address..."}
            value={searchValue}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.text.primary,
              width: '100%',
              fontSize: '14px',
              marginLeft: '10px',
              fontFamily: 'inherit',
              textOverflow: 'ellipsis'
            }}
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div style={{ 
              width: '16px', 
              height: '16px',
              borderRadius: '50%',
              border: `2px solid ${theme.text.secondary}`,
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              marginLeft: '8px'
            }} />
          )}
          
          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              background: theme.bg.card,
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              marginTop: '5px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {searchResults.map((pool, index) => (
                <div 
                  key={pool.contract_address || index}
                  onClick={() => handleResultClick(pool)}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: index < searchResults.length - 1 ? `1px solid ${theme.border}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = theme.bg.hover;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {pool.logo_url && (
                    <img 
                      src={pool.logo_url} 
                      alt={pool.name} 
                      style={{ width: '24px', height: '24px', borderRadius: '50%' }} 
                    />
                  )}
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      color: theme.text.primary, 
                      fontWeight: 500,
                      fontSize: '14px'
                    }}>
                      {formatPoolName(pool)}
                    </div>
                    <div style={{ 
                      color: theme.text.secondary, 
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{pool.symbol}</span>
                      {searchValue.length <= 4 && pool.symbol?.toLowerCase().includes(searchValue.toLowerCase()) && (
                        <span style={{ 
                          backgroundColor: theme.accent || '#3861fb',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          Tag Match
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Inject the CSS animation */}
      <style dangerouslySetInnerHTML={{ __html: spinAnimation }} />
    </div>
  );
};

export default Header; 