/**
 * Funkcje zabezpieczające przed atakami typu XSS i innymi zagrożeniami
 */

// Sanityzacja tekstu wejściowego przed zapisem do bazy
const sanitizeInput = (text) => {
  if (!text) return '';
  
  // Zastąp znaki specjalne HTML ich encjami
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Walidacja adresu portfela Ethereum
const isValidEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Walidacja bezpiecznej nazwy użytkownika (bez znaków specjalnych)
const isValidUsername = (username) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

// Walidacja adresu kontraktu
const isValidContractAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Ogólna walidacja parametrów ID
const isValidId = (id) => {
  return /^\d+$/.test(id) && parseInt(id, 10) > 0;
};

// Walidacja parametrów liczbowych
const isValidNumber = (num) => {
  return !isNaN(parseFloat(num)) && isFinite(num);
};

// Walidacja URL
const isValidURL = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

module.exports = {
  sanitizeInput,
  isValidEthereumAddress,
  isValidUsername,
  isValidContractAddress,
  isValidId,
  isValidNumber,
  isValidURL
}; 