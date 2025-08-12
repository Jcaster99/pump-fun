import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate as useRouterNavigate, useLocation } from 'react-router-dom';
import SplashScreen from '../components/SplashScreen';

// Create a context for navigation with splash screen
const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const routerNavigate = useRouterNavigate();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Custom navigate function that shows splash screen during transitions
  const navigate = useCallback((to) => {
    // Check if we're already on this exact path
    if (location.pathname === to) return;
    
    // Extract route pattern and parameters
    const currentPathParts = location.pathname.split('/');
    const targetPathParts = to.split('/');
    
    const currentBaseRoute = currentPathParts[1]; // 'pool'
    const targetBaseRoute = targetPathParts[1]; // 'pool'
    
    const currentParam = currentPathParts[2]; // contract address
    const targetParam = targetPathParts[2]; // contract address
    
    // If we're already on a detail page for this exact contract, don't show splash
    if (currentBaseRoute === targetBaseRoute && currentParam === targetParam) {
      routerNavigate(to);
      return;
    }
    
    // For all other navigations, show splash screen
    routerNavigate(to);
    setIsTransitioning(true);
    
    // Log for debugging
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Navigating with splash screen:', { 
        from: location.pathname,
        to,
        currentBaseRoute,
        targetBaseRoute,
        currentParam,
        targetParam
      });
    }
    
  }, [location.pathname, routerNavigate]);

  // Handle transition completion - just hide the splash screen
  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return (
    <NavigationContext.Provider value={{ navigate }}>
      {children}
      {isTransitioning && <SplashScreen onComplete={handleTransitionComplete} />}
    </NavigationContext.Provider>
  );
};

// Custom hook to use the navigation context
export const useNavigate = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigate must be used within a NavigationProvider');
  }
  return context.navigate;
}; 