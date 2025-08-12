import { saveAuth, logout, updateWalletAuthTimestamp } from '../utils/authService';
import { API_URL } from '../utils/apiConfig';

/**
 * Rejestruje nowego użytkownika
 * @param {string} address - Adres portfela użytkownika
 * @param {string} username - Nazwa użytkownika
 * @param {string} signature - Podpis kryptograficzny
 * @returns {Promise<Object>} - Dane użytkownika i token JWT
 */
export const registerUser = async (address, username, signature) => {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address, username, signature })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Registration failed');
    }

    // Zapisz token i dane użytkownika
    if (data.token) {
      saveAuth(data.token, data.data);
    }

    return data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

/**
 * Loguje użytkownika
 * @param {string} address - Adres portfela użytkownika
 * @param {string} signature - Podpis kryptograficzny
 * @returns {Promise<Object>} - Dane użytkownika i token JWT
 */
export const loginUser = async (address, signature) => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address, signature })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    // Zapisz token i dane użytkownika
    if (data.token) {
      saveAuth(data.token, data.data);
    }

    return data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

/**
 * Ponowne uwierzytelnienie podpisem portfela (co 7 dni)
 * @param {string} address - Adres portfela użytkownika
 * @param {string} signature - Podpis kryptograficzny
 * @returns {Promise<Object>} - Dane użytkownika i token JWT
 */
export const reauthenticateUser = async (address, signature) => {
  try {
    const response = await fetch(`${API_URL}/users/reauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address, signature })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Re-authentication failed');
    }

    // Zapisz nowy token i dane użytkownika
    if (data.token) {
      saveAuth(data.token, data.data);
    }

    // Dodatkowo zaktualizuj timestamp ostatniego uwierzytelnienia portfela
    updateWalletAuthTimestamp();

    return data;
  } catch (error) {
    console.error('Error during re-authentication:', error);
    throw error;
  }
};

/**
 * Sprawdza czy portfel istnieje
 * @param {string} address - Adres portfela do sprawdzenia
 * @returns {Promise<Object>} - Informacja czy portfel istnieje
 */
export const checkWalletExists = async (address) => {
  try {
    const response = await fetch(`${API_URL}/users/check/${address}`);
    return await response.json();
  } catch (error) {
    if (process.env.REACT_APP_PRODUCTION !== 'true') {
      console.error('Error checking wallet:', error);
    }
    throw error;
  }
};

/**
 * Wylogowuje użytkownika
 */
export const logoutUser = () => {
  logout();
};

export default {
  registerUser,
  loginUser,
  reauthenticateUser,
  checkWalletExists,
  logoutUser
}; 