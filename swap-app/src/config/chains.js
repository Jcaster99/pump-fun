import { Chain } from 'wagmi';
import { ENV } from './env';

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
  id: parseInt(ENV.CHAIN_ID),
  name: ENV.CHAIN_NAME,
  network: ENV.CHAIN_NAME,
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: 'OG',
  },
  rpcUrls: {
    public: { http: [ENV.RPC_URL] },
    default: { http: [ENV.RPC_URL] },
  },
  blockExplorers: {
    default: { name: '0G Galileo Explorer', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
  iconUrl: '/logo.png',
}; 