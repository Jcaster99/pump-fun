// Serwis do zarządzania tokenami JWT i autoryzacją

// Klucze do przechowywania tokenów w localStorage
const TOKEN_KEY = 'lf0g_auth_token';
const USER_DATA_KEY = 'lf0g_user_data';
const LAST_WALLET_AUTH_KEY = 'lf0g_last_wallet_auth'; // New key for tracking last wallet auth

/**
 * Zapisuje token JWT i dane użytkownika do localStorage
 * @param {string} token - Token JWT
 * @param {object} userData - Dane użytkownika
 */
export const saveAuth = (token, userData) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  localStorage.setItem(LAST_WALLET_AUTH_KEY, new Date().toISOString());
};

/**
 * Pobiera token JWT z localStorage
 * @returns {string|null} Token JWT lub null jeśli nie istnieje
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Pobiera dane zalogowanego użytkownika
 * @returns {object|null} Dane użytkownika lub null
 */
export const getUser = () => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Sprawdza czy użytkownik jest zalogowany
 * @returns {boolean} True jeśli użytkownik jest zalogowany
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Sprawdza czy wymagane jest ponowne uwierzytelnienie portfela
 * @returns {boolean} True jeśli minęło co najmniej 7 dni od ostatniego uwierzytelnienia portfela
 */
export const isWalletReauthRequired = () => {
  const lastWalletAuth = localStorage.getItem(LAST_WALLET_AUTH_KEY);
  if (!lastWalletAuth) return true;
  
  const lastAuthTime = new Date(lastWalletAuth).getTime();
  const currentTime = Date.now();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  
  return currentTime - lastAuthTime > sevenDaysInMs;
};

/**
 * Wylogowuje użytkownika
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(LAST_WALLET_AUTH_KEY);
};

/**
 * Dodaje token JWT do nagłówków żądania
 * @param {object} headers - Obecne nagłówki
 * @returns {object} Nagłówki z dodanym tokenem JWT
 */
export const getAuthHeaders = (headers = {}) => {
  const token = getToken();
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return headers;
};

/**
 * Aktualizuje timestamp ostatniego uwierzytelnienia portfela
 */
export const updateWalletAuthTimestamp = () => {
  localStorage.setItem(LAST_WALLET_AUTH_KEY, new Date().toISOString());
};

/**
 * Tworzy fetch z dodanym JWT do nagłówków
 * @param {string} url - URL do którego wysyłane jest żądanie
 * @param {object} options - Opcje fetch
 * @returns {Promise} Promise z wynikiem fetch
 */
export const fetchWithAuth = async (url, options = {}) => {
  const headers = getAuthHeaders(options.headers || {});
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Obsługa specjalnych kodów odpowiedzi
  if (response.status === 401) {
    try {
      const data = await response.clone().json();
      
      // Sprawdź czy wymagane jest ponowne uwierzytelnienie portfela
      if (data && data.requiresWalletAuth) {
        // Można tutaj wywołać event lub ustawić stan, który powiadomi UI o konieczności ponownego logowania
        // Na przykład poprzez EventEmitter lub callback
        const event = new CustomEvent('wallet-reauth-required');
        window.dispatchEvent(event);
        
        // Nie wylogowujemy użytkownika całkowicie, tylko informujemy o potrzebie ponownego uwierzytelnienia
        return response;
      }
    } catch (e) {
      // Jeśli nie można sparsować odpowiedzi, potraktuj jak standardowy błąd 401
      logout();
    }
    
    // Standardowy przypadek - nieważny token
    logout();
  }
  
  return response;
};

export default {
  saveAuth,
  getToken,
  getUser,
  isAuthenticated,
  logout,
  getAuthHeaders,
  fetchWithAuth,
  isWalletReauthRequired,
  updateWalletAuthTimestamp
}; 