import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Default to dark mode
  const [darkMode, setDarkMode] = useState(true);
  // Default to laser effects disabled
  const [lasersEnabled, setLasersEnabled] = useState(false);

  // Load theme preference from localStorage on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true');
    }
    
    const savedLasers = localStorage.getItem('lasersEnabled');
    if (savedLasers !== null) {
      setLasersEnabled(savedLasers === 'true');
    }
  }, []);

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);
  
  // Save laser preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lasersEnabled', lasersEnabled);
    
    // Add or remove the lasers-disabled class to the body to control CSS
    if (lasersEnabled) {
      document.body.classList.remove('lasers-disabled');
    } else {
      document.body.classList.add('lasers-disabled');
    }
  }, [lasersEnabled]);

  // Theme colors based on zer0AIAGENT
  const theme = {
    bg: {
      main: darkMode ? '#0A0A0A' : '#FFFFFF',
      card: darkMode ? '#0A0A0A' : '#FFFFFF',
      panel: darkMode ? '#F464BA1A' : '#F464BA1A',
      footer: darkMode ? '#141414' : '#F464BA',
    },
    text: {
      primary: darkMode ? '#F5F5F5' : '#131316',
      secondary: darkMode ? '#F5F5F5' : "#575757",
      accent: '#00D2E9',
      tertiary: darkMode ? '#575757' : '#A5A5A5'
    },
    border: darkMode ? '#141414' : '#F5F5F5',
    accent: {
      primary: '#00D2E9',
      secondary: '#F464BA',
      tertiary: '#7F5AF0'
    }
  };

  // Toggle theme function
  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode);
  };
  
  // Toggle laser effects function
  const toggleLasers = () => {
    setLasersEnabled(prevLasers => !prevLasers);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, theme, toggleTheme, lasersEnabled, toggleLasers }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 