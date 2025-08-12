#!/usr/bin/env node

/**
 * Blockchain Gravity Score Update Script
 * 
 * Ten skrypt aktualizuje wartości Gravity Score w kontraktach na blockchainie,
 * pobierając dane z bazy danych.
 * 
 * Uruchomienie:
 * - Samodzielnie: node src/scripts/updateBlockchainGravityScore.js
 * - Można też wywołać z updateGravityScore.js z flagą --updateBlockchain
 */

// Importuję potrzebne moduły
const { ethers } = require('ethers');
const { getDbConnection } = require('../db/init');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

// Wczytujemy potrzebne zmienne środowiskowe (.env)
const PRIVATE_KEY = process.env.private_lf0g;
const WALLET_ADDRESS = process.env.wallet_lf0g;
// Use RPC_URL from environment if available, otherwise fall back to 0G-Galileo-Testnet public RPC
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';

// Minimalny ABI GravityScoreSystem - tylko funkcje, których potrzebujemy
const GRAVITY_SCORE_SYSTEM_ABI = [
  "function batchUpdateScores(address[] calldata _tokenAddresses, uint256[] calldata _newScores) external",
  "function updateScore(address _tokenAddress, uint256 _newScore) external",
  "event ScoreUpdated(address indexed tokenAddress, uint256 newScore, uint256 timestamp)"
];

/**
 * Ulepszona funkcja do dynamicznej estymacji gazu z buforem bezpieczeństwa
 * @param {Function} estimateFunc - Funkcja asynchroniczna do estymacji gazu
 * @param {number} bufferPercent - Procentowy bufor bezpieczeństwa (domyślnie 30%)
 * @param {number} defaultGasLimit - Domyślny limit gazu w przypadku błędu estymacji
 * @returns {Object} - Obiekt z parametrami transakcji (gasLimit, maxFeePerGas, maxPriorityFeePerGas)
 */
async function estimateGasWithBuffer(provider, estimateFunc, bufferPercent = 30, defaultGasLimit = 3000000) {
  logger.log('Oszacowanie wymaganego gazu...');
  try {
    // Wykonaj estymację gazu
    const gasEstimate = await estimateFunc();
    
    // Pobierz aktualne dane o opłatach
    const feeData = await provider.getFeeData();
    
    // Dodaj bufor bezpieczeństwa do oszacowania
    const gasLimit = gasEstimate.mul(100 + bufferPercent).div(100);
    
    // Przygotuj opcje transakcji
    const gasOptions = {
      gasLimit: gasLimit
    };
    
    // Dodaj parametry EIP-1559, jeśli są dostępne
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      gasOptions.maxFeePerGas = feeData.maxFeePerGas;
      gasOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      logger.log(`Używam EIP-1559 transakcji z maxFeePerGas: ${ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei`);
    }
    
    logger.log(`Oszacowany limit gazu: ${gasEstimate.toString()} (z buforem ${bufferPercent}%: ${gasLimit.toString()})`);
    
    return gasOptions;
  } catch (error) {
    logger.error('Błąd podczas estymacji gazu:', error.message);
    logger.log(`Używam domyślnego limitu gazu: ${defaultGasLimit}`);
    
    // Zwróć awaryjne parametry transakcji
    return {
      gasLimit: ethers.BigNumber.from(defaultGasLimit)
    };
  }
}

/**
 * Aktualizuje Gravity Score w blockchain dla wszystkich tokenów
 */
async function updateBlockchainGravityScores() {
  const db = getDbConnection();
  
  try {
    logger.log('Pobieranie danych o Gravity Score z bazy danych...');
    
    // Pobieramy wszystkie tokeny z ich Gravity Score
    const pools = db.prepare(`
      SELECT token_address, gravity_score 
      FROM pools 
      WHERE token_address IS NOT NULL AND gravity_score > 0
    `).all();
    
    if (pools.length === 0) {
      logger.log('Brak tokenów do aktualizacji w blockchain');
      db.close();
      return;
    }
    
    logger.log(`Znaleziono ${pools.length} tokenów do aktualizacji w blockchain`);
    
    // Przygotowanie danych do batchUpdateScores
    const tokenAddresses = pools.map(pool => pool.token_address);
    const gravityScores = pools.map(pool => pool.gravity_score);
    
    // Połączenie z blockchainem
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Wczytanie adresu kontraktu GravityScoreSystem
    let deploymentInfo;
    try {
      // Ścieżka względna do pliku deployment-info.json
      const deploymentPath = path.resolve(__dirname, '../../../lf0gfactory/deployment-info.json');
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    } catch (error) {
      logger.error('Nie znaleziono pliku deployment-info.json:', error);
      logger.error('Ścieżka: ' + path.resolve(__dirname, '../../../lf0gfactory/deployment-info.json'));
      db.close();
      return;
    }
    
    logger.log(`Adres portfela: ${WALLET_ADDRESS}`);
    
    if (!deploymentInfo.gravityScoreSystem) {
      logger.error('Brak adresu GravityScoreSystem w pliku deployment-info.json');
      db.close();
      return;
    }
    
    // Utworzenie instancji kontraktu
    const gravityScoreSystem = new ethers.Contract(
      deploymentInfo.gravityScoreSystem,
      GRAVITY_SCORE_SYSTEM_ABI,
      wallet
    );
    
    logger.log(`Aktualizacja Gravity Score dla ${pools.length} tokenów w blockchain...`);
    logger.log(`Używam kontraktu GravityScoreSystem: ${deploymentInfo.gravityScoreSystem}`);
    
    logger.log('Przygotowane dane:');
    pools.forEach((pool, index) => {
      if (index < 5 || index > pools.length - 5) {
        logger.log(`${index+1}. Token: ${pool.token_address}, Score: ${pool.gravity_score}`);
      } else if (index === 5) {
        logger.log('...');
      }
    });
    
    // Oszacowanie gazu z użyciem nowej funkcji
    const gasOptions = await estimateGasWithBuffer(
      provider,
      async () => gravityScoreSystem.estimateGas.batchUpdateScores(tokenAddresses, gravityScores),
      30,  // 30% bufor bezpieczeństwa
      3000000  // 3M gas jako wartość awaryjna
    );
    
    // Wywołanie batchUpdateScores z oszacowanymi parametrami
    const tx = await gravityScoreSystem.batchUpdateScores(tokenAddresses, gravityScores, gasOptions);
    logger.log(`Transakcja wysłana: ${tx.hash}`);
    
    // Oczekiwanie na potwierdzenie
    logger.log('Oczekiwanie na potwierdzenie transakcji...');
    const receipt = await tx.wait();
    logger.log(`Transakcja potwierdzona w bloku ${receipt.blockNumber}. Wykorzystany gaz: ${receipt.gasUsed.toString()}`);
    
    // Zliczanie eventów ScoreUpdated
    logger.log('Analiza logów transakcji...');
    const iface = new ethers.utils.Interface(GRAVITY_SCORE_SYSTEM_ABI);
    const scoreUpdatedEvents = receipt.logs
      .filter(log => log.topics[0] === ethers.utils.id("ScoreUpdated(address,uint256,uint256)"))
      .map(log => {
        try {
          return iface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(log => log !== null);
    
    logger.log(`\nPomyślnie zaktualizowano Gravity Score dla ${scoreUpdatedEvents.length} tokenów na blockchainie`);
    
    // Logujemy szczegóły pierwszych kilku aktualizacji
    if (scoreUpdatedEvents.length > 0) {
      logger.log('\nPrzykładowe aktualizacje:');
      const exampleCount = Math.min(5, scoreUpdatedEvents.length);
      for (let i = 0; i < exampleCount; i++) {
        const event = scoreUpdatedEvents[i];
        logger.log(`Token: ${event.args.tokenAddress}, Nowy score: ${event.args.newScore}`);
      }
    }
    
    db.close();
    return scoreUpdatedEvents.length;
  } catch (error) {
    logger.error('Błąd podczas aktualizacji Gravity Score w blockchain:', error);
    db.close();
    throw error;
  }
}

/**
 * Aktualizuje Gravity Score dla pojedynczego tokenu
 */
async function updateSingleTokenGravityScore(tokenAddress) {
  const db = getDbConnection();
  
  try {
    logger.log(`Pobieranie Gravity Score dla tokenu ${tokenAddress} z bazy danych...`);
    
    // Pobieramy Gravity Score dla określonego tokenu
    const pool = db.prepare(`
      SELECT token_address, gravity_score 
      FROM pools 
      WHERE token_address = ?
    `).get(tokenAddress);
    
    if (!pool) {
      logger.log(`Token ${tokenAddress} nie znaleziony w bazie danych`);
      db.close();
      return null;
    }
    
    if (!pool.gravity_score) {
      logger.log(`Token ${tokenAddress} nie ma obliczonego Gravity Score`);
      db.close();
      return null;
    }
    
    logger.log(`Znaleziono token ${tokenAddress} z Gravity Score: ${pool.gravity_score}`);
    
    // Połączenie z blockchainem
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Wczytanie adresu kontraktu GravityScoreSystem
    let deploymentInfo;
    try {
      const deploymentPath = path.resolve(__dirname, '../../../lf0gfactory/deployment-info.json');
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    } catch (error) {
      logger.error('Nie znaleziono pliku deployment-info.json:', error);
      db.close();
      return null;
    }
    
    if (!deploymentInfo.gravityScoreSystem) {
      logger.error('Brak adresu GravityScoreSystem w pliku deployment-info.json');
      db.close();
      return null;
    }
    
    // Utworzenie instancji kontraktu
    const gravityScoreSystem = new ethers.Contract(
      deploymentInfo.gravityScoreSystem,
      GRAVITY_SCORE_SYSTEM_ABI,
      wallet
    );
    
    // Aktualizacja Gravity Score dla pojedynczego tokenu
    logger.log(`Aktualizacja Gravity Score dla tokenu ${tokenAddress} w blockchain...`);
    
    // Oszacowanie gazu z użyciem nowej funkcji
    const gasOptions = await estimateGasWithBuffer(
      provider,
      async () => gravityScoreSystem.estimateGas.updateScore(tokenAddress, pool.gravity_score),
      30,  // 30% bufor bezpieczeństwa
      500000  // 500k gas jako wartość awaryjna (mniejsza niż dla batch, bo to pojedyncza aktualizacja)
    );
    
    // Wywołanie updateScore z oszacowanymi parametrami
    const tx = await gravityScoreSystem.updateScore(tokenAddress, pool.gravity_score, gasOptions);
    logger.log(`Transakcja wysłana: ${tx.hash}`);
    
    const receipt = await tx.wait();
    logger.log(`Transakcja potwierdzona w bloku ${receipt.blockNumber}. Wykorzystany gaz: ${receipt.gasUsed.toString()}`);
    
    // Znalezienie zdarzenia ScoreUpdated w logach transakcji
    const iface = new ethers.utils.Interface(GRAVITY_SCORE_SYSTEM_ABI);
    const scoreUpdatedEvents = receipt.logs
      .filter(log => log.topics[0] === ethers.utils.id("ScoreUpdated(address,uint256,uint256)"))
      .map(log => {
        try {
          return iface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(log => log !== null);
    
    // Jeśli znaleziono zdarzenie, zwróć nową wartość score
    const score = scoreUpdatedEvents.length > 0 ? 
      scoreUpdatedEvents[0].args.newScore.toNumber() : 
      pool.gravity_score;
    
    logger.log(`Pomyślnie zaktualizowano Gravity Score dla tokenu ${tokenAddress} na wartość ${score}`);
    
    db.close();
    return score;
  } catch (error) {
    logger.error(`Błąd podczas aktualizacji Gravity Score dla tokenu ${tokenAddress}:`, error);
    db.close();
    throw error;
  }
}

/**
 * Funkcja główna
 */
async function main() {
  try {
    logger.log('Rozpoczynam aktualizację Gravity Score w blockchain...');
    
    // Jeśli podano argument tokenAddress, aktualizuj tylko ten token
    const args = process.argv.slice(2);
    const tokenAddress = args[0];
    
    if (tokenAddress && ethers.utils.isAddress(tokenAddress)) {
      logger.log(`Aktualizacja pojedynczego tokenu: ${tokenAddress}`);
      await updateSingleTokenGravityScore(tokenAddress);
    } else {
      // W przeciwnym razie aktualizuj wszystkie tokeny
      await updateBlockchainGravityScores();
    }
    
    logger.log('Zadanie zakończone pomyślnie.');
  } catch (error) {
    logger.error('Błąd podczas wykonywania zadania:', error);
    process.exit(1);
  }
}

// Eksport funkcji dla innych modułów
module.exports = {
  updateBlockchainGravityScores,
  updateSingleTokenGravityScore
};

// Uruchom funkcję main, jeśli skrypt jest wywoływany bezpośrednio
if (require.main === module) {
  main();
} 