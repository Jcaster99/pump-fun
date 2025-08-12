// API Server for LF0G Factory integration
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
require('dotenv').config();

// Override console methods based on REACT_APP_TEST environment variable
require('./consoleOverride');

const fs = require('fs');
const logger = require('./logger');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5005;

// Define allowed CORS origins based on environment variables
const allowedOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ['https://lf0g.fun', 'https://www.lf0g.fun', 'https://service.lf0g.fun', 'https://factory.lf0g.fun', 'https://broadcast.lf0g.fun', 'https://dexchecker.lf0g.fun', 'http://localhost:3000'];
  
// Diagnostyczny log pokazujący wartość CORS_ORIGINS
const originalConsole = require('./consoleOverride');
originalConsole.log(process.env.CORS_ORIGINS ? `CORS ACTIVATED!` : `CORS NOT WORKIN FR!`);

// Determine if we're in test mode
const isTestMode = process.env.REACT_APP_TEST === 'true';

// CORS middleware with proper configuration
app.use(cors({
  origin: function(origin, callback) {
    // In test mode, allow requests from any origin
    if (isTestMode) {
      callback(null, true);
    } else {
      // In production, apply restrictive CORS policy
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies
  maxAge: 86400 // Cache CORS preflight requests for 24h
}));

app.use(bodyParser.json());

// Environment variables
const PRIVATE_KEY = process.env.private_lf0g;
const WALLET_ADDRESS = process.env.wallet_lf0g;
const USDT_CONTRACT = process.env.usdt_contract;
const TREASURY_ADDRESS = process.env.treasury_lf0g || process.env.wallet_lf0g;
const RPC_URL = process.env.RPC_URL;

// Stała dla liczby decimals USDT
const USDT_DECIMALS = 18; // USDT na 0G Galileo Testnet ma 18 miejsc po przecinku
// Stała dla liczby decimals tokenu BondingCurve
const TOKEN_DECIMALS = 18;

// Load contract ABIs and deployment info
let deploymentInfo;
try {
  deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
} catch (error) {
  logger.error('Deployment info not found. Make sure to run deploy.js first.');
  process.exit(1);
}

const FACTORY_JSON = require('./artifacts/contracts/TokenFactory.sol/TokenFactory.json');
const TOKEN_JSON = require('./artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json');

// Setup provider and signer
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Mapowanie tokenów do ich rzeczywistych twórców (nie zawsze zgodnych z zapisem w kontrakcie)
const realTokenCreators = {};

// Próba wczytania mapowania z pliku, jeśli istnieje
try {
  const creatorData = fs.readFileSync('./real-creators.json', 'utf8');
  Object.assign(realTokenCreators, JSON.parse(creatorData));
  logger.log(`Loaded ${Object.keys(realTokenCreators).length} token creator mappings`);
} catch (error) {
  if (error.code !== 'ENOENT') {
    logger.error('Error loading creator mappings:', error);
  } else {
    logger.log('No creator mappings file found, starting with empty map');
  }
}

// Funkcja zapisująca mapowanie do pliku
function saveCreatorMappings() {
  try {
    fs.writeFileSync('./real-creators.json', JSON.stringify(realTokenCreators, null, 2));
    logger.log(`Saved ${Object.keys(realTokenCreators).length} token creator mappings`);
  } catch (error) {
    logger.error('Error saving creator mappings:', error);
  }
}

// Pomocnicza funkcja do estymacji gazu
async function estimateGasWithBuffer(estimateFunc, bufferPercent = 30) {
  logger.log('Oszacowanie wymaganego gazu...');
  try {
    const gasEstimate = await estimateFunc();
    const feeData = await provider.getFeeData();
    
    // Dodaj bufor bezpieczeństwa do oszacowania (domyślnie 30%)
    const gasLimit = gasEstimate.mul(100 + bufferPercent).div(100);
    
    const gasOptions = {
      gasLimit: gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    };
    
    logger.log(`Oszacowany limit gazu: ${gasEstimate.toString()} (z buforem ${bufferPercent}%: ${gasLimit.toString()})`);
    logger.log(`Max opłata za gaz: ${ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei`);
    
    return gasOptions;
  } catch (error) {
    logger.error('Błąd podczas estymacji gazu:', error.message);
    logger.log('Używam standardowych parametrów gazu...');
    
    // Awaryjnie zwróć standardowe wartości
    return {
      gasLimit: ethers.BigNumber.from('1000000'), // 1M jako wartość awaryjna
    };
  }
}

// Create contract instance
const tokenFactory = new ethers.Contract(
  deploymentInfo.tokenFactory,
  FACTORY_JSON.abi,
  wallet
);

// API routes
app.post('/create-token', async (req, res) => {
  try {
    const { name, symbol, description, creatorAddress } = req.body;
    
    if (!name || !symbol || !creatorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: name, symbol, or creatorAddress'
      });
    }

    logger.log(`Creating token: ${name} (${symbol}) for ${creatorAddress}`);
    
    // Get current nonce for the wallet address
    const currentNonce = await provider.getTransactionCount(wallet.address, "latest");
    logger.log(`Using nonce: ${currentNonce}`);
    
    // Call the createToken function with explicit nonce
    const tx = await tokenFactory.createToken(
      name,
      symbol,
      description || '',
      { nonce: currentNonce }
    );
    
    logger.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    logger.log(`Transaction confirmed: ${receipt.transactionHash}`);
    
    // Get the token address from the event
    const event = receipt.events.find(e => e.event === 'TokenCreated');
    if (!event) {
      throw new Error('TokenCreated event not found in transaction receipt');
    }
    
    const tokenAddress = event.args.tokenAddress;
    
    // Zapisz mapowanie rzeczywistego twórcy
    realTokenCreators[tokenAddress.toLowerCase()] = creatorAddress.toLowerCase();
    saveCreatorMappings();
    logger.log(`Registered real creator mapping: ${tokenAddress} -> ${creatorAddress}`);
    
    return res.status(200).json({
      success: true,
      data: {
        txHash: receipt.transactionHash,
        tokenAddress: tokenAddress,
        name,
        symbol,
        description,
        creatorAddress
      }
    });
  } catch (error) {
    logger.error('Error creating token:', error);
    return res.status(500).json({
      success: false,
      error: `Token creation failed: ${error.message}`
    });
  }
});

// Get factory info
app.get('/factory-info', async (req, res) => {
  try {
    const totalTokens = await tokenFactory.getAllTokens();
    
    return res.status(200).json({
      success: true,
      data: {
        factoryAddress: deploymentInfo.tokenFactory,
        totalTokensCreated: totalTokens.length,
        network: {
          name: '0G-Galileo-Testnet',
          chainId: 16601,
          rpcUrl: RPC_URL
        }
      }
    });
  } catch (error) {
    logger.error('Error getting factory info:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch factory info: ${error.message}`
    });
  }
});

// Dodaj nowy endpoint do odbierania tokenów
app.post('/api/claim-tokens', async (req, res) => {
  try {
    const { tokenAddress, userAddress } = req.body;
    
    if (!tokenAddress || !userAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: tokenAddress and userAddress' 
      });
    }
    
    // Weryfikacja czy adres jest poprawny
    if (!ethers.utils.isAddress(tokenAddress) || !ethers.utils.isAddress(userAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Ethereum address' 
      });
    }

    const normalizedTokenAddress = tokenAddress.toLowerCase();
    const normalizedUserAddress = userAddress.toLowerCase();

    logger.log(`Próba odebrania tokenów dla ${userAddress} z kontraktu ${tokenAddress}`);
    
    // Sprawdź czy w ogóle są tokeny do odebrania
    const tokenContract = new ethers.Contract(
      tokenAddress,
      TOKEN_JSON.abi,
      wallet
    );
    
    const totalUnlocked = await tokenContract.totalUnlockedTokens();
    if (totalUnlocked.eq(0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'No tokens to claim' 
      });
    }

    logger.log(`Dostępne tokeny do odebrania: ${ethers.utils.formatUnits(totalUnlocked, 18)}`);
    
    // Weryfikacja czy użytkownik jest twórcą tokenu
    const factoryContract = new ethers.Contract(
      deploymentInfo.tokenFactory,
      FACTORY_JSON.abi,
      wallet
    );
    
    // Sprawdź czy użytkownik jest właścicielem lub twórcą tokenu
    let isOwner = false;
    try {
      const owner = await tokenContract.owner();
      isOwner = owner.toLowerCase() === normalizedUserAddress;
      logger.log(`Czy użytkownik jest właścicielem tokenu: ${isOwner}`);
    } catch (error) {
      logger.error(`Błąd podczas sprawdzania właściciela: ${error.message}`);
    }
    
    let isCreator = false;
    try {
      if (factoryContract.isTokenCreator) {
        isCreator = await factoryContract.isTokenCreator(userAddress, tokenAddress);
        logger.log(`Czy użytkownik jest twórcą tokenu: ${isCreator}`);
      } else {
        logger.log('Funkcja isTokenCreator nie jest dostępna, sprawdzam w tokenData');
        const tokenData = await factoryContract.tokenData(tokenAddress);
        isCreator = tokenData.creator.toLowerCase() === normalizedUserAddress;
        logger.log(`Czy użytkownik jest twórcą tokenu (z tokenData): ${isCreator}`);
      }
    } catch (error) {
      logger.error(`Błąd podczas sprawdzania twórcy: ${error.message}`);
    }
    
    // Sprawdź mapowanie rzeczywistych twórców
    const isRealCreator = realTokenCreators[normalizedTokenAddress] === normalizedUserAddress;
    logger.log(`Czy użytkownik jest rzeczywistym twórcą tokenu (z mapowania): ${isRealCreator}`);
    
    if (!isOwner && !isCreator && !isRealCreator) {
      // Awaryjnie zarejestruj użytkownika jako twórcę, jeśli próbuje odebrać tokeny
      logger.log(`Użytkownik nie został rozpoznany jako twórca, rejestruję awaryjnie mapowanie: ${normalizedTokenAddress} -> ${normalizedUserAddress}`);
      realTokenCreators[normalizedTokenAddress] = normalizedUserAddress;
      saveCreatorMappings();
    }

    // 1. Wykonaj transakcję odbioru tokenów przez treasury
    logger.log('Wykonuję transakcję odbioru tokenów przez treasury...');
    
    // Szacowanie gazu
    const gasOptions = await estimateGasWithBuffer(async () => 
      tokenContract.estimateGas.claimUnlockedTokens()
    );

    // Wykonaj transakcję claim
    const claimTx = await tokenContract.claimUnlockedTokens(gasOptions);
    logger.log(`Transakcja claim wysłana: ${claimTx.hash}`);
    
    // Czekaj na potwierdzenie
    const claimReceipt = await claimTx.wait();
    logger.log(`Transakcja claim potwierdzona: ${claimReceipt.transactionHash}`);
    
    // 2. Sprawdź balans treasury po claim (ile dokładnie otrzymaliśmy)
    const treasuryBalance = await tokenContract.balanceOf(wallet.address);
    const amountToTransfer = totalUnlocked; // Używamy wartości unlocked, bo to jest dokładnie to, co odebraliśmy
    
    logger.log(`Balans treasury po claim: ${ethers.utils.formatUnits(treasuryBalance, 18)}`);
    logger.log(`Transferuję ${ethers.utils.formatUnits(amountToTransfer, 18)} tokenów do rzeczywistego twórcy ${userAddress}...`);
    
    // 3. Wyślij odebrane tokeny do rzeczywistego twórcy
    const transferGasOptions = await estimateGasWithBuffer(async () => 
      tokenContract.estimateGas.transfer(userAddress, amountToTransfer)
    );
    
    const transferTx = await tokenContract.transfer(userAddress, amountToTransfer, transferGasOptions);
    logger.log(`Transakcja transfer wysłana: ${transferTx.hash}`);
    
    // Czekaj na potwierdzenie transferu
    const transferReceipt = await transferTx.wait();
    logger.log(`Transakcja transfer potwierdzona: ${transferReceipt.transactionHash}`);
    
    return res.json({
      success: true,
      claimTxHash: claimReceipt.transactionHash,
      transferTxHash: transferReceipt.transactionHash,
      amount: ethers.utils.formatUnits(amountToTransfer, 18)
    });
    
  } catch (error) {
    logger.error(`Błąd podczas odbierania/transferu tokenów: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  // Always show the server start message
  logger.log(`LF0G Factory API server running on port ${PORT}`);
  logger.debug('Factory service initialized', {
    factoryAddress: deploymentInfo.tokenFactory,
    treasuryAddress: TREASURY_ADDRESS,
    usdtContract: USDT_CONTRACT
  });
}); 