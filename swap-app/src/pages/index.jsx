import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { RainbowProvider } from '../components/wallet/RainbowKitProvider';
import SwapInterface from '../components/swap/SwapInterface';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/layout/Header';
import { SettingsPanel } from '../components/swap/SwapUIComponents';

export default function Home() {
  const { darkMode, theme, toggleDarkMode } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  
  // Zapewnij, że slippage zawsze inicjalizuje się z wartością 0.5%
  useEffect(() => {
    setSlippage(0.5);
  }, []);
  
  const toggleSettings = () => setShowSettings(!showSettings);
  
  // Glass background color for settings panel
  const glassBackground = darkMode ? 
    'rgba(20, 20, 32, 0.7)' : 
    'rgba(255, 255, 255, 0.7)';
  
  return (
    <div style={{ 
      paddingTop: '70px', 
      width: '100%', 
      maxWidth: '100vw',
      overflowX: 'hidden',
      minHeight: '100vh'
    }}>
      <Head>
        <title>SWAP.LF0G</title>
        <meta name="description" content="Here you can swap graduated tokens from lf0g.fun" />
        <link rel="icon" href="/pfpzer0.png" />
      </Head>

      <RainbowProvider darkMode={darkMode} theme={theme}>
        <Header 
          toggleSettings={toggleSettings} 
          toggleDarkMode={toggleDarkMode} 
          darkMode={darkMode} 
        />
        
        {/* Settings Panel (rendered outside of the swap interface) */}
        {showSettings && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 50,
            width: '320px',
            maxWidth: '90vw',
          }}>
            <SettingsPanel 
              theme={theme}
              darkMode={darkMode}
              slippage={slippage}
              setSlippage={setSlippage}
              toggleSettings={toggleSettings}
              glassBackground={glassBackground}
            />
          </div>
        )}
        
        <SwapInterface 
          externalShowSettings={showSettings} 
          externalToggleSettings={toggleSettings}
          externalSlippage={slippage}
          externalSetSlippage={setSlippage}
        />
      </RainbowProvider>
    </div>
  );
} 