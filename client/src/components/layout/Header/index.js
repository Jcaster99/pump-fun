import { Menu } from 'lucide-react';
import React from 'react';
import { ConnectWalletButton } from '../../../components/wallet/RainbowKitProvider';
import { useTheme } from '../../../context/ThemeContext';
import TokenCreationNotification from './TokenCreationNotification';
import TransactionNotification from './TransactionNotification';

// Define the keyframes animation
const spinAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Header = ({ toggleSidebar, isMobile }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        padding: '20px',
        gap: '10px',
        position: 'relative',
        zIndex: 10,
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
      {/* <SearchComponent /> */}
      
      {/* Inject the CSS animation */}
      <style dangerouslySetInnerHTML={{ __html: spinAnimation }} />
    </div>
  );
};

export default Header; 