require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

const { private_lf0g: PRIVATE_KEY } = process.env;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    monad: {
      url: 'https://evmrpc-testnet.0g.ai',
      accounts: [PRIVATE_KEY],
      chainId: 16601,
    },
    hardhat: {
      chainId: 31337,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}; 