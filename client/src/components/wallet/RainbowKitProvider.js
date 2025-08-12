import React, { useState, useEffect } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
  ConnectButton,
  useAccountModal,
  createAuthenticationAdapter,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useTheme } from '../../context/ThemeContext';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import axios from 'axios';
import FirstTimeSignIn from './FirstTimeSignIn';
import CustomWalletModal from './CustomWalletModal';
import { galileoTestnet } from '../../config/chains';
import { API_URL } from '../../utils/apiConfig';

// Create API client
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a client for TanStack Query
const queryClient = new QueryClient();

// Create a custom avatar component to show user's PFP
const CustomAvatar = ({ size }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden'
      }}
    >
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
  );
};

// Configure chains and providers for wagmi with only 0G Galileo Testnet
const config = getDefaultConfig({
  appName: 'lf0g.fun',
  projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || '34121ad34d9bc22e1afc6f45f72b3fdd',
  chains: [galileoTestnet],
  ssr: false, // Set to true if using SSR
});

// Split into outer provider and inner component
export const RainbowProvider = ({ children }) => {
  const { darkMode, theme } = useTheme();
  
  // Create a custom theme based on the app's current theme
  const customTheme = darkMode
    ? darkTheme({
        accentColor: theme.accent.primary,
        accentColorForeground: 'white',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
      })
    : lightTheme({
        accentColor: theme.accent.secondary,
        accentColorForeground: 'white',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
      });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={customTheme}
          avatar={CustomAvatar}
          modalSize="compact"
          initialChain={galileoTestnet.id}
          showRecentTransactions={true}
        >
          <RainbowProviderInner theme={theme}>
            {children}
          </RainbowProviderInner>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Inner component that uses Wagmi hooks (now safely inside WagmiProvider context)
const RainbowProviderInner = ({ children, theme }) => {
  const { darkMode } = useTheme();
  const [showFirstTimeSignIn, setShowFirstTimeSignIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { openAccountModal } = useAccountModal();
  
  // Check if wallet is registered when address changes
  useEffect(() => {
    const checkWalletRegistration = async () => {
      if (!address) return;
      
      try {
        // Check if username is cached in localStorage
        const cachedUsername = localStorage.getItem(`username_${address.toLowerCase()}`);
        
        if (cachedUsername) {
          // Use cached username
          setUsername(cachedUsername);
          return;
        }
        
        // If not cached, fetch from API
        const response = await api.get(`/users/check/${address}`);
        
        if (response.data.exists) {
          // If wallet exists, get user data and cache it
          const fetchedUsername = response.data.data.username;
          setUsername(fetchedUsername);
          localStorage.setItem(`username_${address.toLowerCase()}`, fetchedUsername);
        } else {
          // If wallet doesn't exist, show registration form
          setShowFirstTimeSignIn(true);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    };
    
    if (isConnected && address) {
      checkWalletRegistration();
    } else {
      // Reset state when disconnected
      setUsername('');
      setShowFirstTimeSignIn(false);
    }
  }, [address, isConnected]);
  
  // Handle first-time sign-in
  const handleFirstTimeSignIn = async (newUsername) => {
    if (!address) {
      setError('Wallet not connected!');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Message to sign - typically used for identity verification
      const message = `I am signing this message to verify my wallet address ${address} and connect it with username: ${newUsername} on lf0g.fun`;
      
      // Sign message
      const signature = await signMessageAsync({ message });
      
      // Register user
      const response = await api.post('/users/register', {
        address: address,
        username: newUsername,
        signature: signature
      });
      
      if (response.data.success) {
        // Successful registration
        setUsername(newUsername);
        // Cache the username in localStorage
        localStorage.setItem(`username_${address.toLowerCase()}`, newUsername);
        setShowFirstTimeSignIn(false);
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Registration failed');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel first-time sign-in
  const cancelFirstTimeSignIn = () => {
    setShowFirstTimeSignIn(false);
    disconnect();
  };
  
  // Open custom wallet modal
  const openCustomModal = () => {
    setShowCustomModal(true);
  };
  
  // Close custom wallet modal
  const closeCustomModal = () => {
    setShowCustomModal(false);
  };

  // Create a custom authentication adapter to handle our first-time sign-in flow
  const authAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      return 'random-nonce'; // In a real app, you should generate a secure nonce
    },
    createMessage: ({ nonce }) => {
      return `Sign this message to verify your identity.\n\nNonce: ${nonce}`;
    },
    getMessageBody: ({ message }) => {
      return message;
    },
    verify: async ({ message, signature }) => {
      return true; // We handle this in our own flow, so always return true here
    },
    signOut: async () => {
      disconnect();
    },
  });

  return (
    <>
      {children}
      
      {/* First-time sign-in modal */}
      {showFirstTimeSignIn && (
        <FirstTimeSignIn 
          showFirstTimeSignIn={showFirstTimeSignIn}
          handleFirstTimeSignIn={handleFirstTimeSignIn}
          cancelFirstTimeSignIn={cancelFirstTimeSignIn}
          error={error}
          isLoading={isLoading}
          wallet={{ address, shortAddress: `${address.substring(0, 6)}...${address.substring(address.length - 4)}` }}
        />
      )}
      
      {/* Custom wallet modal - will show instead of default account modal */}
      {showCustomModal && (
        <CustomWalletModal 
          isOpen={showCustomModal}
          onClose={closeCustomModal}
          walletAddress={address}
          walletShort={address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}
          username={username}
          onDisconnect={disconnect}
          chainName="0G-Galileo-Testnet" // Updated chain name
        />
      )}
    </>
  );
};

// Export the custom ConnectButton component
export const CustomConnectButton = () => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  return (
    <ConnectButtonInner 
      showCustomModal={showCustomModal} 
      setShowCustomModal={setShowCustomModal} 
    />
  );
};

// Inner ConnectButton component that uses Wagmi hooks
const ConnectButtonInner = ({ showCustomModal, setShowCustomModal }) => {
  const { darkMode, theme } = useTheme();
  const { openAccountModal } = useAccountModal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [username, setUsername] = useState('');
  
  // Fetch username when address changes
  useEffect(() => {
    const fetchUsername = async () => {
      if (!address) return;
      
      try {
        // Check if username is cached in localStorage
        const cachedUsername = localStorage.getItem(`username_${address.toLowerCase()}`);
        
        if (cachedUsername) {
          // Use cached username
          setUsername(cachedUsername);
          return;
        }
        
        // If not cached, fetch from API
        const response = await api.get(`/users/check/${address}`);
        
        if (response.data.exists) {
          const fetchedUsername = response.data.data.username;
          setUsername(fetchedUsername);
          // Cache the username in localStorage
          localStorage.setItem(`username_${address.toLowerCase()}`, fetchedUsername);
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };
    
    if (isConnected && address) {
      fetchUsername();
    } else {
      setUsername('');
    }
  }, [address, isConnected]);
  
  // Show custom modal instead of default
  const handleAccountClick = () => {
    setShowCustomModal(true);
  };
  
  // Wspólny styl przycisków z gradientem
  const buttonStyle = {
    background: darkMode 
      ? `linear-gradient(90deg, ${theme.accent.primary}, #00D2FF)` 
      : `linear-gradient(90deg, ${theme.accent.secondary}, ${theme.accent.primary})`,
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
  };
  
  return (
    <>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button 
                      onClick={openConnectModal} 
                      type="button"
                      style={buttonStyle}
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button 
                      onClick={openChainModal} 
                      type="button"
                      style={{
                        ...buttonStyle,
                        background: `linear-gradient(90deg, #FF5757, #FF8A8A)`,
                      }}
                    >
                      Przełącz na 0G-Galileo-Testnet
                    </button>
                  );
                }

                return (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={handleAccountClick} 
                      type="button"
                      style={buttonStyle}
                    >
                      {account.displayName}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
      
      {/* Render the custom modal when needed */}
      {showCustomModal && address && (
        <CustomWalletModal 
          isOpen={showCustomModal}
          onClose={() => setShowCustomModal(false)}
          walletAddress={address}
          walletShort={`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
          username={username}
          onDisconnect={disconnect}
          chainName="0G-Galileo-Testnet" // Updated chain name
        />
      )}
    </>
  );
};

// Export a simpler component for easier use
export const ConnectWalletButton = () => {
  return <CustomConnectButton />;
}; 