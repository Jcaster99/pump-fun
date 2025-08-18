import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useAccount, useBalance, useDisconnect, usePublicClient, useSignMessage, useWalletClient } from 'wagmi';
import { checkWalletExists, loginUser, registerUser } from '../api/authApi';
import { getToken, getUser, logout } from '../utils/authService';

/**
 * Custom hook to access wallet functionality throughout the app
 * This hook provides a similar interface to the previous wallet context
 * to minimize changes needed throughout the codebase
 */
export const useWallet = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { data: balanceData } = useBalance({
    address,
    enabled: !!address,
  });
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { signMessageAsync } = useSignMessage();

  // Stan do śledzenia procesu logowania/rejestracji
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Zapisz adres portfela w localStorage
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem('walletAddress', address);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [isConnected, address]);

  // Create a wallet object similar to the one used in the previous implementation
  const wallet = isConnected && address ? {
    address,
    shortAddress: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
    balance: balanceData ? parseFloat(balanceData.formatted).toFixed(4) : '0.0000',
    tokenSymbol: balanceData ? balanceData.symbol : 'ETH',
    signer: walletClient,
    publicClient,
  } : null;

  // Pobierz dane użytkownika z tokenu JWT
  const userData = getUser();

  // Get the username from localStorage - uses the same key as in RainbowKitProvider.js
  const getUsername = () => {
    if (userData && userData.username) {
      return userData.username;
    }
    
    if (!address) return null;
    
    // Try to get username from localStorage - using the correct key format
    const storedUsername = localStorage.getItem(`username_${address.toLowerCase()}`);
    return storedUsername || null; // Return null if no username is found
  };

  const username = getUsername();

  // Sprawdzenie stanu uwierzytelnienia przy inicjalizacji
  useEffect(() => {
    if (getToken()) {
      setIsAuthenticated(true);
    }
  }, []);

  // Funkcja do podpisania wiadomości uwierzytelniającej
  const signAuthMessage = async () => {
    if (!address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    // Format zgodny z serwerem
    const storedUsername = getUsername() || "unknown";
    const message = `I am signing this message to verify my wallet address ${address} and connect it with username: ${storedUsername} on lf0g.fun`;

    try {
      const signature = await signMessageAsync({ message });
      return { signature, message };
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  };

  // Funkcja do logowania z JWT
  const authenticateWithJWT = async (providedUsername = null) => {
    if (!address) {
      return { success: false, error: "No wallet connected" };
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Sprawdź czy adres portfela istnieje w systemie
      const walletCheck = await checkWalletExists(address);
      
      let result;
      
      if (walletCheck.exists) {
        // Dla istniejącego użytkownika użyj nazwy użytkownika z systemu
        const usernameToUse = walletCheck.data.username;
        
        // Przygotuj wiadomość z właściwą nazwą użytkownika
        const message = `I am signing this message to verify my wallet address ${address} and connect it with username: ${usernameToUse} on lf0g.fun`;
        const signature = await signMessageAsync({ message });
        
        // Logowanie istniejącego użytkownika
        result = await loginUser(address, signature);
      } else {
        // Nowy użytkownik wymaga rejestracji
        if (!providedUsername) {
          throw new Error("Username required for registration");
        }

        // Przygotuj wiadomość z nazwą użytkownika do rejestracji
        const message = `I am signing this message to verify my wallet address ${address} and connect it with username: ${providedUsername} on lf0g.fun`;
        const signature = await signMessageAsync({ message });
        
        result = await registerUser(address, providedUsername, signature);
      }

      setIsAuthenticated(true);
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Function to connect wallet
  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    disconnect();
    logout(); // Wyloguj również z JWT
    setIsAuthenticated(false);
  };

  // Funkcja do podpisywania wiadomości dla Gravity Vote 
  const requestSignature = async (message) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      // Użyj wagmi do podpisania wiadomości
      const signature = await signMessageAsync({ message });
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  };

  // Funkcja do łączenia z portfelem i podpisywania wiadomości do uwierzytelnienia
  const authenticateWithSignature = async (username = null) => {
    if (!address) {
      return { success: false, error: "No wallet connected" };
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Sprawdź czy adres portfela istnieje w systemie
      const walletCheck = await checkWalletExists(address);
      
      let usernameToUse = username;
      
      if (walletCheck.exists) {
        // Dla istniejącego użytkownika użyj nazwy użytkownika z systemu
        usernameToUse = walletCheck.data.username;
      } else if (!username) {
        throw new Error("Username required for new users");
      }

      // Zapisz nazwę użytkownika w localStorage
      if (usernameToUse) {
        localStorage.setItem(`username_${address.toLowerCase()}`, usernameToUse);
      }
      
      setIsAuthenticated(true);
      return { 
        success: true, 
        data: { 
          address, 
          username: usernameToUse 
        } 
      };
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    wallet,
    username,
    isConnected,
    connectWallet,
    disconnectWallet,
    authenticateWithSignature,
    isAuthenticating,
    authError,
    isAuthenticated,
    // These are kept for backward compatibility but not needed with RainbowKit
    isConnecting: false,
    showModal: false,
    openWalletModal: connectWallet,
    closeWalletModal: () => {},
    requestSignature,
    // Zachowujemy kompatybilność z poprzednią wersją
    authenticateWithJWT: authenticateWithSignature
  };
}; 