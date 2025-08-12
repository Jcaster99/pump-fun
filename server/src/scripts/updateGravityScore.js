#!/usr/bin/env node

/**
 * Manual Gravity Score Update Script
 * 
 * This script can be run manually to update gravity scores for pools based on the 
 * Revised Gravity Score System methodology.
 * 
 * The new system uses the following components:
 * - Market Cap Component (70%): 1 point for every $1000 of market cap, capped at 700 points
 * - Other Components (30%):
 *   - Curve Utilization (10%)
 *   - Holder Metrics (8%)
 *   - Price Stability (5%)
 *   - Community Activity (7%)
 * 
 * Anti-manipulation safeguards:
 * - Time-weighted market cap (7-day average)
 * - Minimum activity threshold (requires 5+ unique transactions in 7 days)
 * - Minimum holder requirement (10+ unique holders)
 * 
 * Usage:
 * - Update all pools: node src/scripts/updateGravityScore.js
 * - Update specific pool: node src/scripts/updateGravityScore.js --poolId=123
 * - Update and send to blockchain: node src/scripts/updateGravityScore.js --updateBlockchain
 */

// Importuj dotenv na początku, aby zmienne środowiskowe były dostępne
const dotenv = require('dotenv');
dotenv.config();

const GravityScore = require('../models/gravityScore');
const { getDbConnection } = require('../db/init');
const fetch = require('node-fetch');
const minimist = require('minimist');
const logger = require('../utils/logger');

// Importuj skrypt aktualizacji Gravity Score na blockchainie
const { updateBlockchainGravityScores } = require('./updateBlockchainGravityScore');

/**
 * Update zero_dex_rank for all pools from leaderboard service
 */
async function updateZeroDexRanks() {
  logger.log('Updating Zero_dex ranks for all pools...');
  const db = getDbConnection();
  
  try {
    // Get all pools with creator addresses
    const pools = db.prepare('SELECT id, creator_address FROM pools WHERE creator_address IS NOT NULL').all();
    
    if (pools.length === 0) {
      logger.log('No pools with creator addresses found');
      db.close();
      return [];
    }
    
    // Adres URL leaderboard API (pobrany ze zmiennych środowiskowych)
    const leaderboardApiUrl = process.env.REACT_APP_LEADERBOARD_API_URL || 'http://localhost:3004';
    
    // Pobieramy dane leaderboard jeden raz dla wszystkich
    logger.log(`Fetching leaderboard data from ${leaderboardApiUrl}/api/leaderboard?sortBy=totalInteractions&limit=5000...`);
    
    try {
      const response = await fetch(`${leaderboardApiUrl}/api/leaderboard?sortBy=totalInteractions&limit=5000`);
      
      if (!response.ok) {
        logger.warn(`Leaderboard API returned status ${response.status} ${response.statusText}. Skipping Zero_dex rank update.`);
        db.close();
        return [];
      }
      
      const responseData = await response.json();
      
      // Sprawdzamy różne możliwe formaty odpowiedzi
      let leaderboardData;
      
      // Logujemy strukturę odpowiedzi, aby zrozumieć jej format
      logger.log('Leaderboard API response structure:', Object.keys(responseData));
      
      // Sprawdzamy różne możliwe formaty odpowiedzi
      if (Array.isArray(responseData)) {
        // Odpowiedź jest bezpośrednio tablicą
        leaderboardData = responseData;
      } else if (responseData.wallets && Array.isArray(responseData.wallets)) {
        // Odpowiedź zawiera tablicę w polu wallets
        leaderboardData = responseData.wallets;
        logger.log('Using wallets array from response');
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // Odpowiedź zawiera tablicę w polu data
        leaderboardData = responseData.data;
        logger.log('Using data array from response');
      } else if (responseData.leaderboard && Array.isArray(responseData.leaderboard)) {
        // Odpowiedź zawiera tablicę w polu leaderboard
        leaderboardData = responseData.leaderboard;
        logger.log('Using leaderboard array from response');
      } else if (responseData.results && Array.isArray(responseData.results)) {
        // Odpowiedź zawiera tablicę w polu results
        leaderboardData = responseData.results;
        logger.log('Using results array from response');
      } else {
        // Nie znaleźliśmy żadnej tablicy - pomijamy aktualizację ranków
        logger.warn('Could not find leaderboard array in the API response. Skipping Zero_dex rank update.');
        logger.log('Detailed response data:', JSON.stringify(responseData).substring(0, 500) + '...');
        db.close();
        return [];
      }
      
      logger.log(`Received leaderboard data with ${leaderboardData.length} entries`);
      
      // Tworzymy mapę pozycji w rankingu dla każdego adresu
      const rankMap = {};
      leaderboardData.forEach((entry, index) => {
        // Sprawdzamy różne możliwe formaty danych w tablicy
        const address = entry.address || entry.wallet_address || entry.walletAddress || entry.user;
        if (address) {
          rankMap[address.toLowerCase()] = index + 1;
        }
      });
      
      // Aktualizujemy rangi dla wszystkich puli
      let updatedCount = 0;
      
      // Rozpoczynamy transakcję
      db.prepare('BEGIN TRANSACTION').run();
      
      try {
        const updateStmt = db.prepare('UPDATE pools SET zero_dex_rank = ? WHERE id = ?');
        
        for (const pool of pools) {
          if (!pool.creator_address) continue;
          
          const creatorAddress = pool.creator_address.toLowerCase();
          const rank = rankMap[creatorAddress] || null;
          
          if (rank) {
            updateStmt.run(rank, pool.id);
            updatedCount++;
            
            if (updatedCount <= 5 || (pools.length - updatedCount) < 5) {
              logger.log(`Updated pool ID ${pool.id} with Zero_dex rank ${rank} for creator ${creatorAddress}`);
            } else if (updatedCount === 6) {
              logger.log('...');
            }
          }
        }
        
        // Commitujemy transakcję
        db.prepare('COMMIT').run();
        
        logger.log(`Successfully updated Zero_dex ranks for ${updatedCount} pools`);
        db.close();
        return updatedCount;
      } catch (error) {
        // W przypadku błędu wycofujemy transakcję
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      // Error fetching from API - log and skip instead of throwing
      logger.warn(`Error fetching from leaderboard API: ${error.message}. Skipping Zero_dex rank update.`);
      db.close();
      return [];
    }
  } catch (error) {
    logger.error('Error updating Zero_dex ranks:', error);
    db.close();
    return [];  // Return empty array instead of throwing
  }
}

/**
 * Update gravity score for a specific pool
 */
async function updatePoolGravityScore(poolId) {
  logger.log(`Updating gravity score for pool ${poolId}...`);
  
  try {
    const score = await GravityScore.calculateForPool(poolId);
    logger.log(`Pool ${poolId} gravity score updated successfully: ${score}`);
    return score;
  } catch (error) {
    logger.error(`Error updating gravity score for pool ${poolId}:`, error);
    throw error;
  }
}

/**
 * Update gravity scores for all pools
 */
async function updateAllGravityScores() {
  logger.log('Starting gravity score update for all pools...');
  const startTime = Date.now();
  
  try {
    // Calculate scores for all pools
    const results = await GravityScore.calculateForAllPools();
    
    // Log results
    logger.log(`Updated gravity scores for ${results.length} pools`);
    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;
    
    logger.log(`Success: ${successCount}, Errors: ${errorCount}`);
    
    // Log any errors
    if (errorCount > 0) {
      logger.log('Pools with errors:');
      results.filter(r => r.error).forEach(result => {
        logger.log(`Pool ID ${result.poolId}: ${result.error}`);
      });
    }
    
    const duration = (Date.now() - startTime) / 1000;
    logger.log(`Gravity score update completed in ${duration.toFixed(2)} seconds`);
    
    return results;
  } catch (error) {
    logger.error('Error updating all gravity scores:', error);
    throw error;
  }
}

/**
 * Main function to handle command line arguments and execute appropriate actions
 */
async function main() {
  try {
    // Parse command line arguments
    const args = minimist(process.argv.slice(2));
    const poolId = args.poolId;
    const updateBlockchain = args.updateBlockchain;
    
    logger.log('Starting Gravity Score update process...');
    
    // Step 1: Update Zero_dex ranks (always do this first)
    try {
      logger.log('Step 1: Updating Zero_dex ranks...');
      await updateZeroDexRanks();
    } catch (error) {
      logger.error('Error updating Zero_dex ranks:', error);
    }
    
    logger.log('\nStep 2: Updating Gravity Scores...');
    
    // Step 2: Update gravity scores (either specific pool or all pools)
    if (poolId) {
      logger.log(`Updating Gravity Score for pool ID ${poolId}...`);
      await updatePoolGravityScore(poolId);
      logger.log(`Gravity Score updated for pool ID ${poolId}`);
    } else {
      logger.log('Updating Gravity Scores for all pools...');
      await updateAllGravityScores();
    }
    
    // Step 3: Optionally update scores on blockchain
    if (updateBlockchain) {
      logger.log('\nStep 3: Updating Gravity Scores on blockchain...');
      
      // Korzystamy z ulepszonej funkcji importowanej z updateBlockchainGravityScore.js
      const { updateBlockchainGravityScores } = require('./updateBlockchainGravityScore');
      
      if (poolId) {
        // Jeśli określono poolId, najpierw pobieramy token_address
        const db = getDbConnection();
        const poolData = db.prepare('SELECT token_address FROM pools WHERE id = ?').get(poolId);
        db.close();
        
        if (poolData && poolData.token_address) {
          logger.log(`Updating Gravity Score on blockchain for pool ID ${poolId} (token: ${poolData.token_address})...`);
          const { updateSingleTokenGravityScore } = require('./updateBlockchainGravityScore');
          await updateSingleTokenGravityScore(poolData.token_address);
        } else {
          logger.warn(`Pool ID ${poolId} has no token_address. Skipping blockchain update.`);
        }
      } else {
        // Aktualizuj wszystkie tokeny w blockchain
        logger.log('Updating Gravity Scores on blockchain for all tokens...');
        await updateBlockchainGravityScores();
      }
    } else {
      logger.log('\nSkipping blockchain update. Use --updateBlockchain flag to update scores on blockchain.');
    }
    
    logger.log('\nGravity Score update process completed successfully!');
  } catch (error) {
    logger.error('Error in Gravity Score update process:', error);
    process.exit(1);
  }
}

// Run the script
main();

module.exports = {
  updateZeroDexRanks,
  updatePoolGravityScore,
  updateAllGravityScores,
  main
}; 