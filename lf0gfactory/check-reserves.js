// Skrypt sprawdzający stałe wartości w wdrożonym kontrakcie
const { ethers } = require('ethers');
require('dotenv').config();
const TOKEN_JSON = require('./artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json');
const logger = require('./logger');

// Adres wdrożonego tokenu
const TOKEN_ADDRESS = '0x0eBCb4c21A9DDd793cC068CD979c11EF8daCB664';

// Konfiguracja dostawcy
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// Utworzenie instancji kontraktu
const tokenContract = new ethers.Contract(
  TOKEN_ADDRESS,
  TOKEN_JSON.abi,
  provider
);

async function main() {
  try {
    logger.log('Sprawdzanie stałych wartości w kontrakcie:');
    logger.log('Adres kontraktu:', TOKEN_ADDRESS);
    
    // Sprawdź VIRTUAL_USDT_RESERVES
    const vReserves = await tokenContract.VIRTUAL_USDT_RESERVES();
    logger.log('VIRTUAL_USDT_RESERVES:', vReserves.toString());
    
    // Sprawdź czy kontrakt ma funkcję USDT_DECIMALS
    try {
      const decimals = await tokenContract.USDT_DECIMALS();
      logger.log('USDT_DECIMALS:', decimals.toString());
    } catch (e) {
      logger.log('USDT_DECIMALS: nie znaleziono takiej stałej w kontrakcie');
      logger.log('To potwierdza, że kontrakt używa starej wersji bez wsparcia dla 6 decimals');
    }
    
    // Pobierz adres USDT
    const usdt = await tokenContract.USDT();
    logger.log('Adres USDT:', usdt);
    
    // Utwórz instancję kontraktu USDT
    const usdtContract = new ethers.Contract(
      usdt,
      [
        "function decimals() public view returns (uint8)",
        "function name() public view returns (string)",
        "function symbol() public view returns (string)"
      ],
      provider
    );
    
    // Sprawdź decimals dla USDT
    try {
      const decimals = await usdtContract.decimals();
      logger.log('USDT decimals:', decimals.toString());
      const name = await usdtContract.name();
      const symbol = await usdtContract.symbol();
      logger.log('USDT name:', name);
      logger.log('USDT symbol:', symbol);
    } catch (e) {
      logger.log('Błąd podczas odczytu informacji o USDT:', e.message);
    }
    
  } catch (e) {
    logger.error('Błąd:', e);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    logger.error(error);
    process.exit(1);
  }); 