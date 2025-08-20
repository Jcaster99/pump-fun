import { ChartLine, FileText, HandCoins, Home, Moon, Sun, X } from 'lucide-react';
import React from 'react';
import { useNavigate } from '../../../context/NavigationContext';
import { useTheme } from '../../../context/ThemeContext';
import { MyToken } from '../../Icons/MyToken';
import { SwapIcon } from '../../Icons/SwapIcon';
import SidebarItem from './SidebarItem';

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const { darkMode, theme, toggleTheme } = useTheme();
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
      </div>
    </div>
  );
};

export default Sidebar; 