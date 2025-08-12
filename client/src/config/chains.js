import { Chain } from 'wagmi/chains';

/**
 * 0G Galileo Testnet chain configuration
 * 
 * Chain Name: 0G-Galileo-Testnet
 * Chain ID: 16601
 * Token Symbol: OG
 * RPC URL: https://evmrpc-testnet.0g.ai
 * Block Explorer: https://chainscan-galileo.0g.ai/
 */
export const galileoTestnet = {
  id: 16601,
  name: '0G-Galileo-Testnet',
  network: '0G-Galileo-Testnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: 'OG',
  },
  rpcUrls: {
    public: { http: ['https://evmrpc-testnet.0g.ai'] },
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Galileo Explorer', url: 'https://chainscan-galileo.0g.ai/' },
  },
  testnet: true,
  iconUrl: '/logo.png',
};

export default galileoTestnet; 