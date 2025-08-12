/**
 * Token Graduation Utility
 * 
 * This module handles the graduation process for bonding curve tokens,
 * transitioning them from bonding curve pricing to liquidity pool trading.
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { getDbConnection } = require('../db/init');

// Load environment variables
const PRIVATE_KEY = process.env.private_lf0g;
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const GRADUATION_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_GRADUATION_REGISTRY_ADDRESS || '0x5689e36Ec534274f8516438B62DA3aecbF514e0a';
const USDT_CONTRACT = process.env.usdt_contract;
const WALLET_ADDRESS = process.env.wallet_lf0g;
const TREASURY_ADDRESS = process.env.treasury_lf0g;
const IS_TEST_ENV = process.env.REACT_APP_TEST === 'true';

// Funkcja do logowania w trybie testowym
function logDebug(...args) {
  if (IS_TEST_ENV) {
    logger.log(...args);
  }
}

// Get path to deployment info
const DEPLOYMENT_INFO_PATH = path.join(__dirname, '../../../lf0gfactory/deployment-info.json');

// Load contract ABI
let TOKEN_ABI;
try {
  const TOKEN_JSON = require('../../../lf0gfactory/artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json');
  TOKEN_ABI = TOKEN_JSON.abi;
} catch (error) {
  TOKEN_ABI = [
    "function graduate() external",
    "function isGraduated() external view returns (bool)",
    "function name() external view returns (string memory)",
    "function symbol() external view returns (string memory)"
  ];
  logger.warn('Using minimal ABI for BondingCurveToken, some functionality may be limited');
}

/**
 * Performs token graduation from bonding curve to liquidity pool
 * 
 * @param {string} tokenAddress - Address of the token to graduate
 * @returns {Promise<Object>} - Result of the graduation operation
 */
async function graduateToken(tokenAddress) {
  if (!PRIVATE_KEY) {
    throw new Error('private_lf0g is not configured in environment variables');
  }

  logger.log(`Initiating graduation for token ${tokenAddress}`);
  logDebug(`Using treasury address: ${TREASURY_ADDRESS}`);
  logDebug(`Using graduation registry: ${GRADUATION_REGISTRY_ADDRESS}`);
  
  // Configure provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Sprawdź czy adres portfela odpowiada oczekiwanemu
  if (wallet.address.toLowerCase() !== WALLET_ADDRESS.toLowerCase()) {
    logDebug(`Warning: Wallet address from private key (${wallet.address}) doesn't match expected wallet_lf0g (${WALLET_ADDRESS})`);
  }
  
  // Connect to token contract
  const tokenContract = new ethers.Contract(
    tokenAddress,
    TOKEN_ABI,
    wallet
  );

  try {
    // Check if token is already graduated
    const isGraduated = await tokenContract.isGraduated();
    if (isGraduated) {
      logger.log(`Token ${tokenAddress} is already graduated`);
      return {
        success: false,
        message: 'Token is already graduated',
        tokenAddress
      };
    }

    // Get token info for logging
    const tokenName = await tokenContract.name();
    const tokenSymbol = await tokenContract.symbol();
    logger.log(`Graduating token: ${tokenName} (${tokenSymbol})`);

    // Set gas limit with 30% buffer
    let gasLimit;
    try {
      logDebug('Estimating gas...');
      const estimatedGas = await tokenContract.estimateGas.graduate();
      gasLimit = estimatedGas.mul(130).div(100); // 30% buffer
      logDebug(`Estimated gas: ${estimatedGas.toString()}, with 30% buffer: ${gasLimit.toString()}`);
    } catch (error) {
      logger.log(`Gas estimation failed: ${error.message}`);
      gasLimit = ethers.BigNumber.from('4000000'); // 4M as default limit
      logDebug(`Using default gas limit: ${gasLimit.toString()}`);
    }
    
    // Execute graduation transaction
    const options = { gasLimit };
    const tx = await tokenContract.graduate(options);
    logger.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    logger.log('Waiting for confirmation...');
    const receipt = await tx.wait();
    
    // Check transaction status
    if (receipt.status === 0) {
      logger.log('WARNING: Transaction was executed but failed');
      logger.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
      // Try to find error reason
      try {
        logDebug('Trying to recreate transaction to find error reason...');
        await provider.call(tx, tx.blockNumber);
      } catch (error) {
        logger.log(`Error reason: ${error.message}`);
      }
      
      return {
        success: false,
        message: 'Graduation transaction failed',
        tokenAddress,
        txHash: tx.hash
      };
    }

    // Look for TokenGraduated event
    const graduationEvent = receipt.events?.find(e => e.event === 'TokenGraduated');
    let eventData = {};
    
    if (graduationEvent) {
      const { pairAddress, usdtAmount, tokenAmount } = graduationEvent.args;
      logger.log('Graduation successful!');
      logger.log(`Pair address: ${pairAddress}`);
      logger.log(`USDT in pool: ${ethers.utils.formatUnits(usdtAmount, 18)}`);
      logger.log(`Tokens in pool: ${ethers.utils.formatUnits(tokenAmount, 18)}`);
      
      eventData = {
        pairAddress,
        usdtAmount: usdtAmount.toString(),
        tokenAmount: tokenAmount.toString()
      };
      
      // Update token in database
      updateTokenGraduationStatus(tokenAddress, pairAddress);
    } else {
      logger.log('Graduation completed, but event not found');
    }
    
    return {
      success: true,
      message: 'Token graduation completed successfully',
      tokenAddress,
      txHash: tx.hash,
      ...eventData
    };
  } catch (error) {
    logger.error(`Error during token graduation: ${error.message}`);
    return {
      success: false,
      message: `Graduation failed: ${error.message}`,
      tokenAddress
    };
  }
}

/**
 * Updates token's graduation status in database
 * 
 * @param {string} tokenAddress - Address of the graduated token
 * @param {string} pairAddress - Address of the created liquidity pair
 */
async function updateTokenGraduationStatus(tokenAddress, pairAddress) {
  try {
    const db = getDbConnection();
    
    // Update token status in database
    db.prepare(`
      UPDATE pools
      SET 
        graduated = 'yes',
        liquidity_pair_address = ?
      WHERE token_address = ?
    `).run(pairAddress, tokenAddress);
    
    logger.log(`Database updated: token ${tokenAddress} marked as graduated with pair ${pairAddress}`);
    logDebug(`Full update params: graduated=yes, bonding_curve_percentage=100.0, liquidity_pair_address=${pairAddress}`);
    
    db.close();
  } catch (error) {
    logger.error(`Error updating token graduation status in database: ${error.message}`);
  }
}

module.exports = {
  graduateToken
}; 