// Skrypt do ekstrakcji ABI kontraktów dla frontendu
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Ścieżki do artefaktów kompilacji
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts/contracts');
const OUTPUT_FILE = path.join(__dirname, 'contract-abis.json');

// Lista kontraktów, których ABI chcemy wyekstrahować
const contractsList = [
  {
    name: 'BondingCurveToken',
    path: 'BondingCurveToken.sol/BondingCurveToken.json',
    description: 'Token z mechanizmem bonding curve'
  },
  {
    name: 'TokenFactory',
    path: 'TokenFactory.sol/TokenFactory.json',
    description: 'Fabryka do tworzenia nowych tokenów'
  },
  {
    name: 'GravityScoreSystem',
    path: 'GravityScoreSystem.sol/GravityScoreSystem.json',
    description: 'System oceny tokenów i odblokowywania nagród'
  }
];

// Dodatkowe informacje o deploymencie
let deploymentInfo = {};
try {
  deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
} catch (error) {
  logger.warn('Nie znaleziono pliku deployment-info.json. Adresy kontraktów nie zostaną dołączone.');
}

/**
 * Funkcja ekstrakcji ABI z pliku artefaktu
 * @param {string} artifactPath Ścieżka do pliku artefaktu
 * @returns {Object} ABI kontraktu
 */
function extractABI(artifactPath) {
  try {
    const fullPath = path.join(ARTIFACTS_DIR, artifactPath);
    const artifact = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return artifact.abi;
  } catch (error) {
    logger.error(`Błąd podczas ekstrakcji ABI z ${artifactPath}:`, error);
    throw error;
  }
}

/**
 * Główna funkcja ekstrakcji ABI
 */
async function extractAllABIs() {
  logger.log('Rozpoczynam ekstrakcję ABI kontraktów...');
  
  const result = {
    version: '1.0.0',
    description: 'ABI kontraktów LF0G Factory dla frontendu',
    generatedAt: new Date().toISOString(),
    deployment: deploymentInfo,
    contracts: {}
  };
  
  // Ekstrahuj ABI dla każdego kontraktu
  for (const contract of contractsList) {
    logger.log(`Ekstrakcja ABI dla ${contract.name}...`);
    
    try {
      const abi = extractABI(contract.path);
      
      // Przygotuj informacje o kontrakcie
      result.contracts[contract.name] = {
        name: contract.name,
        description: contract.description,
        abi: abi
      };
      
      // Dodaj adres kontraktu, jeśli jest dostępny w deployment-info.json
      if (deploymentInfo[contract.name.charAt(0).toLowerCase() + contract.name.slice(1)]) {
        result.contracts[contract.name].address = 
          deploymentInfo[contract.name.charAt(0).toLowerCase() + contract.name.slice(1)];
      }
      
      logger.log(`✓ ABI dla ${contract.name} wyekstrahowane pomyślnie`);
    } catch (error) {
      logger.error(`✗ Nie udało się wyekstrahować ABI dla ${contract.name}`);
    }
  }
  
  // Zapisz wynik do pliku
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(result, null, 2)
  );
  
  logger.log(`\nWyekstrahowane ABI zostały zapisane do pliku: ${OUTPUT_FILE}`);
  logger.log(`Liczba kontraktów: ${Object.keys(result.contracts).length}`);
  
  // Dodatkowe informacje dla deweloperów frontendu
  logger.log('\nInstrukcje dla frontendu:');
  logger.log('1. Zaimportuj plik contract-abis.json do swojego projektu React/Vue/Angular');
  logger.log('2. Użyj biblioteki web3.js, ethers.js lub useContract z wagmi do interakcji z kontraktami');
  logger.log('3. Przykład użycia z ethers.js:');
  logger.log(`
    import { ethers } from 'ethers';
    import contractAbis from './contract-abis.json';
    
    // Połączenie z dostawcą
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Tworzenie instancji kontraktu
    const tokenFactory = new ethers.Contract(
      contractAbis.contracts.TokenFactory.address,
      contractAbis.contracts.TokenFactory.abi,
      signer
    );
    
    // Wywołanie metody kontraktu
    async function createToken(name, symbol, description) {
      const tx = await tokenFactory.createToken(name, symbol, description);
      await tx.wait();
      return tx;
    }
  `);
}

// Uruchom ekstrakcję
extractAllABIs()
  .then(() => {
    logger.log('Zakończono ekstrakcję ABI kontraktów');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Wystąpił błąd podczas ekstrakcji ABI:', error);
    process.exit(1);
  }); 