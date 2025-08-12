import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
  ConnectButton,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { galileoTestnet } from '../../config/chains';
import { ENV } from '../../config/env';

// Create a client for TanStack Query
const queryClient = new QueryClient();

// Create a custom avatar component
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
        src="/dance.gif"
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

// Configure chains and providers for wagmi
const config = getDefaultConfig({
  appName: 'swap.lf0g.fun',
  projectId: ENV.WALLET_CONNECT_PROJECT_ID,
  chains: [galileoTestnet],
  ssr: true,
});

// Provider component
export const RainbowProvider = ({ children, darkMode, theme }) => {
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
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Simplified connect button
export const ConnectWalletButton = () => {
  return <ConnectButton />;
}; 