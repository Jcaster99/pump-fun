// Skrypt do interakcji z wdrożonymi kontraktami LF0G Factory
const { ethers } = require('ethers');
require('dotenv').config();
const fs = require('fs');
const logger = require('./logger');

// Zmienne środowiskowe
const PRIVATE_KEY = process.env.private_lf0g;
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';

// Wczytanie danych o wdrożeniu
let deploymentInfo;
try {
  deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
} catch (error) {
  logger.error('Nie znaleziono pliku deployment-info.json. Uruchom najpierw deploy.js.');
  process.exit(1);
}

// ABI kontraktów z artefaktów kompilacji
const FACTORY_JSON = require('./artifacts/contracts/TokenFactory.sol/TokenFactory.json');
const GRAVITY_SYSTEM_JSON = require('./artifacts/contracts/GravityScoreSystem.sol/GravityScoreSystem.json');
const TOKEN_JSON = require('./artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json');

// Konfiguracja dostawcy i portfela
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Funkcje interakcji
async function createToken(name, symbol, description) {
  logger.log(`\nTworzenie nowego tokenu: ${name} (${symbol})`);
  
  const factory = new ethers.Contract(
    deploymentInfo.tokenFactory,
    FACTORY_JSON.abi,
    wallet
  );
  
  let creationFee = ethers.constants.Zero;
  if (factory.interface.functions['creationFee()']) {
    creationFee = await factory.creationFee();
    logger.log(`Opłata za utworzenie: ${ethers.utils.formatEther(creationFee)} OG`);
  } else {
    logger.log('Brak opłaty creationFee w kontrakcie – tworzenie tokenu bez fee');
  }
  
  // Wywołanie funkcji tworzenia tokenu
  const tx = await factory.createToken(name, symbol, description, {
    value: creationFee
  });
  
  logger.log(`Transakcja wysłana: ${tx.hash}`);
  logger.log('Oczekiwanie na potwierdzenie...');
  
  const receipt = await tx.wait();
  
  // Odczytaj adres utworzonego tokenu z eventów
  const event = receipt.events.find(e => e.event === 'TokenCreated');
  const tokenAddress = event.args.tokenAddress;
  
  logger.log(`\nToken został utworzony pomyślnie!`);
  logger.log(`Adres tokenu: ${tokenAddress}`);
  logger.log(`Twórca: ${event.args.creator}`);
  
  return tokenAddress;
}

async function updateGravityScore(tokenAddress, score) {
  logger.log(`\nAktualizacja Gravity Score dla tokenu ${tokenAddress}: ${score} punktów`);
  
  const gravitySystem = new ethers.Contract(
    deploymentInfo.gravityScoreSystem,
    GRAVITY_SYSTEM_JSON.abi,
    wallet
  );
  
  const tx = await gravitySystem.updateScore(tokenAddress, score);
  logger.log(`Transakcja wysłana: ${tx.hash}`);
  
  await tx.wait();
  logger.log('Gravity Score zaktualizowany pomyślnie!');
}

async function getTokenInfo(tokenAddress) {
  logger.log(`\nPobieranie informacji o tokenie ${tokenAddress}`);
  
  const token = new ethers.Contract(
    tokenAddress,
    TOKEN_JSON.abi,
    provider
  );
  
  const factory = new ethers.Contract(
    deploymentInfo.tokenFactory,
    FACTORY_JSON.abi,
    provider
  );
  
  const gravitySystem = new ethers.Contract(
    deploymentInfo.gravityScoreSystem,
    GRAVITY_SYSTEM_JSON.abi,
    provider
  );
  
  // Pobierz dane z kontraktów
  const name = await token.name();
  const symbol = await token.symbol();
  const description = await token.description();
  const totalSupply = ethers.utils.formatUnits(await token.totalSupply(), 18);
  const currentPrice = ethers.utils.formatUnits(await token.getCurrentPrice(), 18);
  const marketCap = ethers.utils.formatUnits(await token.getMarketCap(), 18);
  const gravityScore = await token.gravityScore();
  const owner = await token.owner();
  
  // Dane o progach Gravity Score
  const thresholdResults = await Promise.all(
    [200, 400, 600, 800, 1000].map(async threshold => {
      return {
        threshold,
        reached: await token.thresholdReached(threshold)
      };
    })
  );
  
  const unlockedTokens = ethers.utils.formatUnits(await token.totalUnlockedTokens(), 18);
  
  // Wyświetl dane
  logger.log('\nInformacje o tokenie:');
  logger.log(`- Nazwa: ${name} (${symbol})`);
  logger.log(`- Opis: ${description}`);
  logger.log(`- Adres: ${tokenAddress}`);
  logger.log(`- Właściciel: ${owner}`);
  logger.log(`- Całkowita podaż: ${totalSupply} ${symbol}`);
  logger.log(`- Aktualna cena: ${currentPrice} USDT`);
  logger.log(`- Kapitalizacja rynkowa: ${marketCap} USDT`);
  logger.log(`- Gravity Score: ${gravityScore}`);
  
  logger.log('\nOsiągnięte progi Gravity Score:');
  thresholdResults.forEach(({ threshold, reached }) => {
    logger.log(`- ${threshold} punktów: ${reached ? '✓' : '✗'}`);
  });
  
  logger.log(`\nDostępne do odebrania tokeny: ${unlockedTokens} ${symbol}`);
}

async function getAllTokens() {
  logger.log('\nPobieranie wszystkich utworzonych tokenów');
  
  const factory = new ethers.Contract(
    deploymentInfo.tokenFactory,
    FACTORY_JSON.abi,
    provider
  );
  
  const tokens = await factory.getAllTokens();
  
  logger.log(`\nZnaleziono ${tokens.length} tokenów:`);
  tokens.forEach((address, index) => {
    logger.log(`${index + 1}. ${address}`);
  });
  
  return tokens;
}

async function graduateToken(tokenAddress) {
  logger.log(`\nInicjowanie graduacji tokenu ${tokenAddress}`);
  const tokenContract = new ethers.Contract(
    tokenAddress,
    TOKEN_JSON.abi,
    wallet
  );

  // Sprawdź czy już graduowany
  const already = await tokenContract.isGraduated();
  if (already) {
    logger.log('Token jest już graduowany');
    return;
  }

  // Spróbuj oszacować gaz z buforem 30%. Jeśli estymacja się nie uda, użyj konserwatywnego limitu 4 000 000.
  let gasLimit;
  try {
    logger.log('Próbuję oszacować gaz...');
    const estimatedGas = await tokenContract.estimateGas.graduate();
    gasLimit = estimatedGas.mul(130).div(100); // 30% bufora
    logger.log(`Oszacowany gas: ${estimatedGas.toString()}, z buforem 30%: ${gasLimit.toString()}`);
  } catch (error) {
    logger.log(`Nie udało się oszacować gazu: ${error.message}`);
    gasLimit = ethers.BigNumber.from('4000000'); // 4M jako domyślny limit
    logger.log(`Używam domyślnego limitu gazu: ${gasLimit.toString()}`);
  }
  
  logger.log(`Wykonuję transakcję z limitem gazu: ${gasLimit.toString()}`);
  
  // Debug opcje:
  const options = {
    gasLimit: gasLimit
  };
  
  // Wykonaj transakcję
  const tx = await tokenContract.graduate(options);
  logger.log(`Transakcja wysłana: ${tx.hash}`);
  
  logger.log('Oczekiwanie na potwierdzenie...');
  const receipt = await tx.wait();
  
  // Sprawdź status transakcji
  if (receipt.status === 0) {
    logger.log('UWAGA: Transakcja została wykonana, ale zakończyła się niepowodzeniem');
    logger.log(`Wykorzystany gaz: ${receipt.gasUsed.toString()}`);
    
    // Spróbuj znaleźć przyczynę błędu
    try {
      logger.log('Próbuję odtworzyć transakcję, aby znaleźć powód błędu...');
      // Wykonaj statyczne wywołanie aby uzyskać powód
      await provider.call(tx, tx.blockNumber);
    } catch (error) {
      logger.log(`Powód błędu: ${error.message}`);
    }
  } else {
    logger.log('Transakcja zakończona sukcesem!');
  }

  // Szukamy eventu TokenGraduated
  const event = receipt.events.find(e => e.event === 'TokenGraduated');
  if (event) {
    const { pairAddress, usdtAmount, tokenAmount } = event.args;
    logger.log('Graduacja zakończona pomyślnie!');
    logger.log(`Adres pary: ${pairAddress}`);
    logger.log(`USDT w puli: ${ethers.utils.formatUnits(usdtAmount, 18)}`);
    logger.log(`Tokeny w puli: ${ethers.utils.formatUnits(tokenAmount, 18)}`);
  } else {
    logger.log('Graduacja zakończona, ale event nie został znaleziony.');
  }
}

async function checkGraduatedPools() {
  logger.log('\nPobieranie informacji o wszystkich pulach tokenów graduowanych');
  
  // Utworzenie kontraktu rejestru graduacji
  const graduationRegistry = new ethers.Contract(
    deploymentInfo.graduationRegistry,
    [
      "function getGraduatedTokens() view returns (address[])",
      "function getTokenPair(address token) view returns (address)",
      "function isGraduated(address token) view returns (bool)"
    ],
    provider
  );
  
  // Pobieranie listy graduowanych tokenów
  const graduatedTokens = await graduationRegistry.getGraduatedTokens();
  
  if (graduatedTokens.length === 0) {
    logger.log('\nBrak graduowanych tokenów w rejestrze.');
    return;
  }
  
  logger.log(`\nZnaleziono ${graduatedTokens.length} graduowanych tokenów:`);
  
  // Dla każdego tokenu pobierz szczegóły pary i rezerwy
  for (let i = 0; i < graduatedTokens.length; i++) {
    const tokenAddress = graduatedTokens[i];
    logger.log(`\n--- Token #${i + 1}: ${tokenAddress} ---`);
    
    try {
      // Pobierz adres pary
      const pairAddress = await graduationRegistry.getTokenPair(tokenAddress);
      logger.log(`Adres pary swapowej: ${pairAddress}`);
      
      // Tworzymy instancje kontraktu tokenu i pary
      const token = new ethers.Contract(
        tokenAddress,
        TOKEN_JSON.abi,
        provider
      );
      
      const pair = new ethers.Contract(
        pairAddress,
        [
          "function getReserves() view returns (uint112, uint112, uint32)",
          "function token0() view returns (address)",
          "function token1() view returns (address)"
        ],
        provider
      );
      
      // Pobierz informacje o tokenie
      const name = await token.name();
      const symbol = await token.symbol();
      const decimals = await token.decimals();
      
      logger.log(`Nazwa tokenu: ${name} (${symbol})`);
      
      // Pobierz token0 i token1 z pary
      const token0 = await pair.token0();
      const token1 = await pair.token1();
      
      // Sprawdź, który token jest naszym tokenem a który USDT
      const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
      const tokenPosition = isToken0 ? 'token0' : 'token1';
      const usdtPosition = isToken0 ? 'token1' : 'token0';
      
      logger.log(`Pozycja w parze: ${tokenPosition}`);
      
      // Pobierz rezerwy z pary
      const reserves = await pair.getReserves();
      const tokenReserve = isToken0 ? reserves[0] : reserves[1];
      const usdtReserve = isToken0 ? reserves[1] : reserves[0];
      
      // Wyświetl rezerwy
      logger.log(`Rezerwa tokenu: ${ethers.utils.formatUnits(tokenReserve, decimals)} ${symbol}`);
      logger.log(`Rezerwa USDT: ${ethers.utils.formatUnits(usdtReserve, 18)} USDT`); // USDT zwykle ma 18 decimals
      
      // Oblicz cenę tokenu
      const tokenPrice = usdtReserve.mul(ethers.BigNumber.from(10).pow(decimals)).div(tokenReserve);
      logger.log(`Cena tokenu: ${ethers.utils.formatUnits(tokenPrice, 18)} USDT za 1 ${symbol}`);
      
      // Oblicz kapitalizację rynkową (price * totalSupply)
      const totalSupply = await token.totalSupply();
      const marketCap = tokenPrice.mul(totalSupply).div(ethers.BigNumber.from(10).pow(decimals));
      logger.log(`Kapitalizacja rynkowa: ${ethers.utils.formatUnits(marketCap, 18)} USDT`);
      
    } catch (error) {
      logger.error(`Błąd podczas pobierania informacji o parze: ${error.message}`);
    }
  }
}

// Przykład użycia
async function main() {
  // Sprawdź argumenty linii poleceń
  const args = process.argv.slice(2);
  const command = args[0];
  
  logger.log('Interakcja z kontraktami LF0G Factory');
  logger.log(`Używam adresów z deployment-info.json:`);
  logger.log(`- TokenFactory: ${deploymentInfo.tokenFactory}`);
  logger.log(`- GravityScoreSystem: ${deploymentInfo.gravityScoreSystem}`);
  
  switch(command) {
    case 'create':
      // Przykład: node interact.js create "My Token" MTK "This is a test token"
      if (args.length < 4) {
        logger.error('Użycie: node interact.js create "Name" "Symbol" "Description"');
        process.exit(1);
      }
      await createToken(args[1], args[2], args[3]);
      break;
      
    case 'update-score':
      // Przykład: node interact.js update-score 0x1234... 450
      if (args.length < 3) {
        logger.error('Użycie: node interact.js update-score <tokenAddress> <score>');
        process.exit(1);
      }
      await updateGravityScore(args[1], parseInt(args[2]));
      break;
      
    case 'info':
      // Przykład: node interact.js info 0x1234...
      if (args.length < 2) {
        logger.error('Użycie: node interact.js info <tokenAddress>');
        process.exit(1);
      }
      await getTokenInfo(args[1]);
      break;
      
    case 'list':
      // Przykład: node interact.js list
      await getAllTokens();
      break;
      
    case 'graduate':
      // node interact.js graduate 0xTokenAddress
      if (args.length < 2) {
        logger.error('Użycie: node interact.js graduate <tokenAddress>');
        process.exit(1);
      }
      await graduateToken(args[1]);
      break;
      
    case 'pools':
      // node interact.js pools
      await checkGraduatedPools();
      break;
      
    default:
      logger.log('\nDostępne komendy:');
      logger.log('  create "Name" "Symbol" "Description" - Tworzy nowy token');
      logger.log('  update-score <tokenAddress> <score> - Aktualizuje Gravity Score');
      logger.log('  info <tokenAddress> - Wyświetla informacje o tokenie');
      logger.log('  list - Wyświetla wszystkie utworzone tokeny');
      logger.log('  graduate <tokenAddress> - Inicjuje graduację tokenu');
      logger.log('  pools - Wyświetla informacje o pulach wszystkich graduowanych tokenów');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('\nWystąpił błąd:');
    logger.error(error);
    process.exit(1);
  }); 