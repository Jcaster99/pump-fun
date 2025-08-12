import React, { createContext, useContext, useState, useEffect } from 'react';

// Definiowanie domyślnych kolorów motywu
const lightThemeColors = {
  bg: {
    page: '#F8FAFC',
    card: '#FFFFFF',
    input: '#F1F5F9',
    panel: '#F8FAFC'
  },
  text: {
    primary: '#1E293B',
    secondary: '#64748B'
  },
  accent: {
    primary: '#00D2E9',
    secondary: '#FF5CAA'
  },
  border: '#E2E8F0'
};

const darkThemeColors = {
  bg: {
    page: '#0B0B13',
    card: '#141420',
    input: '#1A1A25',
    panel: '#191927'
  },
  text: {
    primary: '#E6E6E6',
    secondary: '#9999A5'
  },
  accent: {
    primary: '#00D2E9',
    secondary: '#FF5CAA'
  },
  border: '#232330'
};

// Tworzenie kontekstu
const ThemeContext = createContext();

// Hook do używania kontekstu
export const useTheme = () => useContext(ThemeContext);

// Provider komponent
export const ThemeProvider = ({ children }) => {
  // Stan dla trybu ciemnego
  const [darkMode, setDarkMode] = useState(true);
  
  // Aktualny motyw bazujący na trybie
  const theme = darkMode ? darkThemeColors : lightThemeColors;
  
  // Przełączanie trybu
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  // Efekt inicjalizujący tryb z localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
    
    // Dodaj klasę do elementu html
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 