/**
 * Formats an Ethereum address for display by showing only the first and last 4 characters
 * @param {string} address - The full Ethereum address
 * @returns {string} - The formatted address (e.g., "0x1234...5678")
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  if (address.length < 10) return address;
  
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}; 