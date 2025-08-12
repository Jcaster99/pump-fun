// Skrypt wdrożeniowy dla kontraktów LF0G Factory
const { ethers } = require('ethers');
require('dotenv').config();
const fs = require('fs');
const logger = require('./logger');

// Zmienne środowiskowe
const PRIVATE_KEY = process.env.private_lf0g;
const WALLET_ADDRESS = process.env.wallet_lf0g;
const USDT_CONTRACT = process.env.usdt_contract;
const TREASURY_ADDRESS = process.env.treasury_lf0g || process.env.wallet_lf0g;
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';

// Stała dla liczby decimals USDT (18 na 0G)
const USDT_DECIMALS = 18; // USDT na 0G Galileo Testnet ma 18 miejsc po przecinku

// Ścieżki do artefaktów kompilacji (generowane przez Hardhat)
const FACTORY_JSON = require('./artifacts/contracts/TokenFactory.sol/TokenFactory.json');
const GRAVITY_SYSTEM_JSON = require('./artifacts/contracts/GravityScoreSystem.sol/GravityScoreSystem.json');
const SWAP_FACTORY_JSON = require('./artifacts/contracts/LF0GSwapFactory.sol/LF0GSwapFactory.json');
const GRADUATION_REGISTRY_JSON = require('./artifacts/contracts/GraduationRegistry.sol/GraduationRegistry.json');

async function main() {
  logger.log('Rozpoczynam proces wdrażania kontraktów LF0G Factory...');
  logger.log('Sieć: 0G-Galileo-Testnet (16601)');
  logger.log('RPC URL:', RPC_URL);
  logger.log('Adres portfela deployer\'a:', WALLET_ADDRESS);
  logger.log('Adres USDT:', USDT_CONTRACT);
  logger.log('Adres treasury:', TREASURY_ADDRESS);

  // Konfiguracja dostawcy i portfela
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const balanceWei = await provider.getBalance(wallet.address);
  const balanceEth = ethers.utils.formatEther(balanceWei);
  
  logger.log(`\nSaldo portfela: ${balanceEth} OG`);
  
  if (balanceWei.lt(ethers.utils.parseEther('0.1'))) {
    logger.warn('UWAGA: Saldo portfela jest niskie. Zalecane jest min. 0.1 OG.');
  }

  // 1. Deploy GravityScoreSystem
  logger.log('\n1. Wdrażanie kontraktu GravityScoreSystem...');
  
  const GravityScoreSystemFactory = new ethers.ContractFactory(
    GRAVITY_SYSTEM_JSON.abi,
    GRAVITY_SYSTEM_JSON.bytecode,
    wallet
  );
  
  const gravityScoreSystem = await GravityScoreSystemFactory.deploy();
  await gravityScoreSystem.deployed();
  
  logger.log(`   ✓ GravityScoreSystem wdrożony pod adresem: ${gravityScoreSystem.address}`);

  // 2. Deploy TokenFactory
  logger.log('\n2. Wdrażanie kontraktu TokenFactory...');
  
  const TokenFactoryFactory = new ethers.ContractFactory(
    FACTORY_JSON.abi,
    FACTORY_JSON.bytecode,
    wallet
  );
  
  const tokenFactory = await TokenFactoryFactory.deploy(
    TREASURY_ADDRESS,
    gravityScoreSystem.address,
    USDT_CONTRACT
  );
  await tokenFactory.deployed();
  
  logger.log(`   ✓ TokenFactory wdrożony pod adresem: ${tokenFactory.address}`);

  // Konfiguracja GravityScoreSystem z adresem TokenFactory
  logger.log('\n   Konfiguracja GravityScoreSystem -> setTokenFactory');
  const setFactoryTx = await gravityScoreSystem.setTokenFactory(tokenFactory.address);
  await setFactoryTx.wait();
  logger.log('   ✓ GravityScoreSystem skonfigurowany');

  // 3. Deploy GraduationRegistry
  logger.log('\n3. Wdrażanie kontraktu GraduationRegistry...');
  const GraduationRegistryFactory = new ethers.ContractFactory(
    GRADUATION_REGISTRY_JSON.abi,
    GRADUATION_REGISTRY_JSON.bytecode,
    wallet
  );
  const graduationRegistry = await GraduationRegistryFactory.deploy();
  await graduationRegistry.deployed();
  logger.log(`   ✓ GraduationRegistry wdrożony pod adresem: ${graduationRegistry.address}`);

  // 4. Deploy LF0GSwapFactory
  logger.log('\n4. Wdrażanie kontraktu LF0GSwapFactory...');
  const SwapFactoryFactory = new ethers.ContractFactory(
    SWAP_FACTORY_JSON.abi,
    SWAP_FACTORY_JSON.bytecode,
    wallet
  );
  const swapFactory = await SwapFactoryFactory.deploy();
  await swapFactory.deployed();
  logger.log(`   ✓ LF0GSwapFactory wdrożony pod adresem: ${swapFactory.address}`);

  // 5. Konfiguracja TokenFactory z adresami graduacji
  logger.log('\n5. Konfiguracja adresów graduacji w TokenFactory...');
  const setGradTx = await tokenFactory.setGraduationAddresses(swapFactory.address, graduationRegistry.address);
  await setGradTx.wait();
  logger.log('   ✓ Ustawiono adresy swapFactory i graduationRegistry');

  // 6. Dodanie TokenFactory jako autoryzowanego rejestratora w GraduationRegistry
  logger.log('\n6. Dodawanie TokenFactory jako registrara w GraduationRegistry...');
  const addRegTx = await graduationRegistry.addRegistrar(tokenFactory.address);
  await addRegTx.wait();
  logger.log('   ✓ TokenFactory dodany jako registrar');

  // 7. Podsumowanie
  logger.log('\n7. Podsumowanie wdrożenia:');
  logger.log(`   - GravityScoreSystem: ${gravityScoreSystem.address}`);
  logger.log(`   - TokenFactory:       ${tokenFactory.address}`);
  logger.log(`   - LF0GSwapFactory:    ${swapFactory.address}`);
  logger.log(`   - GraduationRegistry: ${graduationRegistry.address}`);
  logger.log(`   - USDT:               ${USDT_CONTRACT}`);
  logger.log(`   - Treasury:           ${TREASURY_ADDRESS}`);

  // Zapisz adresy
  const deployData = {
    gravityScoreSystem: gravityScoreSystem.address,
    tokenFactory: tokenFactory.address,
    swapFactory: swapFactory.address,
    graduationRegistry: graduationRegistry.address,
    usdt: USDT_CONTRACT,
    treasury: TREASURY_ADDRESS,
    network: {
      name: '0G-Galileo-Testnet',
      chainId: 16601,
      rpcUrl: RPC_URL
    },
    deploymentTime: new Date().toISOString()
  };

  fs.writeFileSync(
    './deployment-info.json', 
    JSON.stringify(deployData, null, 2)
  );
  
  logger.log('\nInformacje o wdrożeniu zostały zapisane do pliku deployment-info.json');
  logger.log('\nKontrakty zostały pomyślnie wdrożone i skonfigurowane!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Wystąpił błąd podczas wdrażania kontraktów:');
    logger.error(error);
    process.exit(1);
  }); 