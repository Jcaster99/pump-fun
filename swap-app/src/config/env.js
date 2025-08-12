/**
 * Environment variables configuration for the application
 */

export const ENV = {
  // Network settings
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '16601',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME || '0G-Galileo-Testnet',
  
  // Contract addresses
  USDT_ADDRESS: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x3eC8A8705bE1D5ca90066b37ba62c4183B024ebf',
  GRADUATION_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_GRADUATION_REGISTRY_ADDRESS || '0x63BB9c216c19241c2a9941C94AE4d5Eff0DCfe7e',
  
  // Wallet Connect project ID
  WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '34121ad34d9bc22e1afc6f45f72b3fdd',
  
  // Debug settings
  IS_TEST: process.env.NEXT_PUBLIC_TEST === 'true' || true,
};

/**
 * Helper function to check if we're in a test environment
 */
export const isTestMode = () => ENV.IS_TEST;

/**
 * Helper to get contract addresses
 */
export const getContractAddress = (contractName) => {
  // Add debug logging to see which addresses are being requested
  const address = (() => {
    switch (contractName) {
      case 'USDT':
        return ENV.USDT_ADDRESS;
      case 'GRADUATION_REGISTRY':
        return ENV.GRADUATION_REGISTRY_ADDRESS;
      default:
        console.error(`Unknown contract name: ${contractName}`);
        return null;
    }
  })();
  
  console.log(`[DEBUG-ENV] getContractAddress('${contractName}') => ${address}`);
  return address;
}; 