import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import PoolDetailsPage from './pages/PoolDetailsPage';
import MyTokensPage from './pages/MyTokensPage';
import CreateToken from './pages/CreateToken';
import LeaderboardPage from './components/leaderboard/LeaderboardPage';
import DocsPage from './pages/DocsPage';
import { RainbowProvider } from './components/wallet/RainbowKitProvider';
import Layout from './components/layout/Layout';
import PreloadScreen from './components/PreloadScreen';
import { NavigationProvider } from './context/NavigationContext';
import { TransactionProvider } from './context/TransactionContext';
import { PriceProvider } from './context/PriceContext';
import { PoolProvider } from './context/PoolContext';
import { PoolDetailsSocketProvider } from './context/PoolDetailsSocketContext';
import { Toaster } from 'react-hot-toast';

// The app uses responsive components from /resp folder
// Styles are imported in index.js

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  const handleLoadComplete = () => {
    setIsLoading(false);
    
    // Add a slight delay before showing content for smoother transition
    setTimeout(() => {
      setContentVisible(true);
    }, 100);
  };

  // Force preloader to show for at least 2 seconds, even if page loads faster
  useEffect(() => {
    // This will ensure preloader shows for at least 2 seconds
    // The actual loading happens in the PreloadScreen component
  }, []);

  return (
    <PriceProvider>
      <ThemeProvider>
        <RainbowProvider>
          <TransactionProvider>
            <PoolProvider>
              {isLoading ? (
                <PreloadScreen onLoadComplete={handleLoadComplete} />
              ) : (
                <PoolDetailsSocketProvider>
                  <div style={{ 
                    opacity: contentVisible ? 1 : 0, 
                    transition: 'opacity 0.3s ease-in-out' 
                  }}>
                    <Router>
                      <Routes>
                        <Route path="*" element={
                          <NavigationProvider>
                            <Layout>
                              <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/pool/:address" element={<PoolDetailsPage />} />
                                <Route path="/my-tokens" element={<MyTokensPage />} />
                                <Route path="/create-token" element={<CreateToken />} />
                                <Route path="/leaderboard" element={<LeaderboardPage />} />
                                <Route path="/docs" element={<DocsPage />} />
                              </Routes>
                            </Layout>
                          </NavigationProvider>
                        } />
                      </Routes>
                    </Router>
                  </div>
                  <Toaster position="bottom-right" />
                </PoolDetailsSocketProvider>
              )}
            </PoolProvider>
          </TransactionProvider>
        </RainbowProvider>
      </ThemeProvider>
    </PriceProvider>
  );
}

export default App; 