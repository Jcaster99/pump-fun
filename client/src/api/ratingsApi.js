import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Funkcja do dodawania lub aktualizacji oceny
export const addRating = async (poolId, rating, signature) => {
  try {
    const response = await axios.post(
      `${API_URL}/ratings`,
      { poolId, rating, signature },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error adding rating:', error);
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error. Please try again.' };
  }
};

// Funkcja do pobierania oceny użytkownika dla danej puli
export const getUserRating = async (poolId) => {
  try {
    // Pobierz adres portfela z localStorage
    const address = localStorage.getItem('walletAddress');
    if (!address) {
      return { success: false, message: 'No wallet connected' };
    }

    const response = await axios.get(
      `${API_URL}/ratings/user/${poolId}/${address}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting user rating:', error);
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error. Please try again.' };
  }
};

// Funkcja do pobierania średniej oceny dla puli
export const getAverageRating = async (poolId) => {
  try {
    const response = await axios.get(
      `${API_URL}/ratings/average/${poolId}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting average rating:', error);
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error. Please try again.' };
  }
};

// Funkcja do pobierania rozkładu ocen dla puli
export const getRatingDistribution = async (poolId) => {
  try {
    const response = await axios.get(
      `${API_URL}/ratings/distribution/${poolId}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting rating distribution:', error);
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, message: 'Network error. Please try again.' };
  }
}; 