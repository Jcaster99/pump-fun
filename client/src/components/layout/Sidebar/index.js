import { ChartLine, FileText, HandCoins, Home, Layers, Moon, RefreshCw, Sun, X, Zap } from 'lucide-react';
import React from 'react';
import { useNavigate } from '../../../context/NavigationContext';
import { useTheme } from '../../../context/ThemeContext';
import SidebarItem from './SidebarItem';
import { MyToken } from '../../Icons/MyToken';
import { SwapIcon } from '../../Icons/SwapIcon';

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const { darkMode, theme, toggleTheme, lasersEnabled, toggleLasers } = useTheme();
  const navigate = useNavigate();
  
  // Compute sidebar styles based on state
  const sidebarStyle = {
    width: '240px',
    backgroundColor: theme.bg.card,
    borderRight: `1px solid ${theme.border}`,
    padding: '20px 20px 28px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: isMobile ? 'fixed' : 'fixed',
    top: 0,
    left: 0,
    zIndex: 50,
    transition: 'transform 0.3s ease',
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    boxShadow: isMobile && isOpen ? '0 0 15px rgba(0, 0, 0, 0.1)' : 'none',
    overflowY: 'auto'
  };
  
  const handleLogoClick = () => {
    navigate('/');
    if (isMobile) onClose();
  };

  return (
    <div style={sidebarStyle}>
      {/* Close button (mobile only) */}
      {isMobile && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            color: theme.text.secondary,
            cursor: 'pointer',
            zIndex: 2,
            padding: '8px'
          }}
        >
          <X size={20} />
        </button>
      )}
      
      <div 
        style={{ 
          padding: '0 20px', 
          marginBottom: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={handleLogoClick}
      >
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <img 
            src="/slop-logo.svg" 
            alt="slop-logo" 
            style={{
              height: '60px',
            }}
          />
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <SidebarItem 
          icon={<Home size={18} />} 
          label="Home" 
          theme={theme} 
          to="/"
          onClick={isMobile ? onClose : undefined}
        />
        <SidebarItem 
          icon={<HandCoins size={18} />} 
          label="Create Token" 
          theme={theme} 
          to="/create-token"
          onClick={isMobile ? onClose : undefined}
        />
        <SidebarItem 
          icon={<MyToken />} 
          label="My Tokens" 
          theme={theme} 
          to="/my-tokens"
          onClick={isMobile ? onClose : undefined}
        />
        <SidebarItem 
          icon={<ChartLine size={18} />} 
          label="Leaderboard" 
          theme={theme} 
          to="/leaderboard"
          onClick={isMobile ? onClose : undefined}
        />
        
        <a 
          href="https://swap.lf0g.fun" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: theme.text.secondary,
            transition: 'all 0.2s ease',
            textDecoration: 'none',
            margin: '2px 0'
          }}
          onClick={isMobile ? onClose : undefined}
        >
          <SwapIcon />
          <span style={{ marginLeft: '10px', fontSize: '14px' }}>
            Swap
          </span>
        </a>
        
        {/* Docs link */}
        <SidebarItem 
          icon={<FileText size={18} />} 
          label="Docs" 
          theme={theme} 
          to="/docs"
          onClick={isMobile ? onClose : undefined}
        />
      </div>
      
      <div style={{ padding: '0 20px', marginTop: '20px' }}>
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.text.secondary,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '10px 0'
          }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span style={{ marginLeft: '10px' }}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        
        <button 
          onClick={toggleLasers}
          style={{
            background: 'transparent',
            border: 'none',
            color: lasersEnabled ? theme.accent.primary : theme.text.secondary,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '10px 0',
            marginTop: '10px'
          }}
        >
          <Zap size={18} />
          <span style={{ marginLeft: '10px' }}>
            {lasersEnabled ? 'Disable Lasers' : 'Enable Lasers'}
          </span>
        </button>
        
        {/* Powered by desu and X link */}
        {/* <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '30px',
          padding: '10px 0',
          opacity: 0.8,
          fontSize: '12px',
          color: theme.text.secondary
        }}>
          <span>p0wered by desu</span>
          <a 
            href="https://x.com/nov3lolo" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: theme.text.secondary,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = theme.accent.primary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = theme.text.secondary;
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 512 512" 
              width="16" 
              height="16"
              fill="currentColor"
            >
              <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
            </svg>
          </a>
          <a 
            href="https://github.com/desu777" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: theme.text.secondary,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = theme.accent.primary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = theme.text.secondary;
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              width="20" 
              height="20"
              fill="currentColor"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div> */}
      </div>
    </div>
  );
};

export default Sidebar; 