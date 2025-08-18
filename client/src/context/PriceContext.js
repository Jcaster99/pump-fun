import React, { createContext, useContext, useState } from 'react';
import { API_URL } from '../utils/apiConfig';

// Tworzenie kontekstu
const PriceContext = createContext();

// Hook do używania kontekstu
export const usePriceContext = () => useContext(PriceContext);

// Provider kontekstu
export const PriceProvider = ({ children }) => {
  const [tokenPrices, setTokenPrices] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Funkcja do pobierania ceny dla tokena/puli
  const fetchTokenPrice = async (contractAddress) => {
    if (!contractAddress) return null;
    
    // Jeśli już mamy cenę, zwróć ją
    if (tokenPrices[contractAddress.toLowerCase()]) {
      return tokenPrices[contractAddress.toLowerCase()];
    }
    
    setIsLoading(true);
    try {
      // Pobierz dane puli z API
      const response = await fetch(`${API_URL}/pools/${contractAddress}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pool data: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error('Invalid pool data response');
      }
      
      const poolData = data.data;
      
      // Sprawdź czy mamy cenę
      if (poolData.price !== undefined && poolData.price !== null) {
        // Zapisz cenę w stanie
        const price = typeof poolData.price === 'string' ? parseFloat(poolData.price) : poolData.price;
        if (!isNaN(price) && price > 0) {
          if (process.env.REACT_APP_TEST === 'true') {
            console.log(`Fetched price for ${contractAddress}: ${price}`);
          }
          setTokenPrices(prev => ({
            ...prev,
            [contractAddress.toLowerCase()]: price
          }));
          return price;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funkcja do aktualizacji ceny tokena
  const updateTokenPrice = (contractAddress, price) => {
    if (!contractAddress || price === undefined || price === null) return;
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice) || numericPrice <= 0) return;
    
    setTokenPrices(prev => ({
      ...prev,
      [contractAddress.toLowerCase()]: numericPrice
    }));
  };
  
  // Funkcja do pobierania ceny tokena
  const getTokenPrice = (contractAddress) => {
    if (!contractAddress) return 0.0001;
    
    const price = tokenPrices[contractAddress.toLowerCase()];
    return price !== undefined && price !== null && price > 0 ? price : 0.0001;
  };
  
  const value = {
    tokenPrices,
    fetchTokenPrice,
    updateTokenPrice,
    getTokenPrice,
    isLoading
  };
  
  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
}; 