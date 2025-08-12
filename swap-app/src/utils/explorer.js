/**
 * Utility functions for blockchain explorer URLs
 */

import { galileoTestnet } from '../config/chains';

/**
 * Get the base explorer URL without trailing slash
 * @returns {string} Base explorer URL
 */
export const getExplorerBaseUrl = () => {
  return galileoTestnet.blockExplorers.default.url;
};

/**
 * Generate explorer URL for a wallet address
 * @param {string} address - Wallet address
 * @returns {string} Explorer URL for the address
 */
export const getAddressExplorerUrl = (address) => {
  if (!address) return '';
  // Ensure address is lowercase for consistent URLs
  return `${getExplorerBaseUrl()}/address/${address.toLowerCase()}`;
};

/**
 * Generate explorer URL for a transaction
 * @param {string} txHash - Transaction hash
 * @returns {string} Explorer URL for the transaction
 */
export const getTransactionExplorerUrl = (txHash) => {
  if (!txHash) return '';
  return `${getExplorerBaseUrl()}/tx/${txHash}`;
}; 