// Skrypt do interakcji z istniejącym tokenem BondingCurveToken
const { ethers } = require('ethers');
require('dotenv').config();
const fs = require('fs');
const logger = require('./logger');

// Adres tokenu do testów
const TOKEN_ADDRESS = '0x50d5964D77cEe9B15Bb89358fdDE38f763650bF1';

// Zmienne środowiskowe
const PRIVATE_KEY = process.env.private_lf0g;
const WALLET_ADDRESS = process.env.wallet_lf0g;
const RPC_URL = process.env.RPC_URL;

// Wczytanie ABI kontraktów
const TOKEN_JSON = require('./artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json');
const TOKEN_FACTORY_JSON = require('./artifacts/contracts/TokenFactory.sol/TokenFactory.json');
const SWAP_PAIR_JSON = require('./artifacts/contracts/LF0GSwapPair.sol/LF0GSwapPair.json');

// Konfiguracja dostawcy i portfela
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Liczba decimals dla tokenów
const USDT_DECIMALS = 18; // USDT na 0G Galileo Testnet ma 18 decimals
const TOKEN_DECIMALS = 18;

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
      gasLimit: ethers.BigNumber.from('1000000'), // 1M zamiast 3M jako wartość awaryjna
    };
  }
}

// Utworzenie instancji kontraktu tokenu
const tokenContract = new ethers.Contract(
  TOKEN_ADDRESS,
  TOKEN_JSON.abi,
  wallet
);

// Funkcje interakcji
async function getTokenInfo() {
  logger.log('\nPobieranie informacji o tokenie:');
  
  try {
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const description = await tokenContract.description();
    const totalSupply = ethers.utils.formatUnits(await tokenContract.totalSupply(), TOKEN_DECIMALS);
    
    // Poprawione formatowanie ceny - getCurrentPrice zwraca wartość z 18 decimals
    const currentPriceRaw = await tokenContract.getCurrentPrice();
    const currentPrice = ethers.utils.formatUnits(currentPriceRaw, 18);
    
    // Poprawione formatowanie market cap - getMarketCap zwraca wartość z 18 decimals
    const marketCapRaw = await tokenContract.getMarketCap();
    const marketCap = ethers.utils.formatUnits(marketCapRaw, 18);
    
    // Dodajmy alternatywne obliczenia dla zweryfikowania poprawności
    const usdtReservesRaw = await tokenContract.usdtReserves();
    const tokenReservesRaw = await tokenContract.tokenReserves();
    const usdtReserves = ethers.utils.formatUnits(usdtReservesRaw, USDT_DECIMALS);
    const tokenReserves = ethers.utils.formatUnits(tokenReservesRaw, TOKEN_DECIMALS);
    
    // Ręczne obliczenie ceny dla porównania
    const manualPrice = usdtReservesRaw.mul(ethers.constants.WeiPerEther).div(tokenReservesRaw);
    const manualFormattedPrice = ethers.utils.formatUnits(manualPrice, 18);
    
    // Ręczne obliczenie market cap
    const manualMarketCap = manualPrice.mul(tokenReservesRaw).div(ethers.constants.WeiPerEther);
    const manualFormattedMarketCap = ethers.utils.formatUnits(manualMarketCap, 18);
    
    const gravityScore = await tokenContract.gravityScore();
    const owner = await tokenContract.owner();
    
    logger.log(`Nazwa: ${name} (${symbol})`);
    logger.log(`Opis: ${description}`);
    logger.log(`Adres: ${TOKEN_ADDRESS}`);
    logger.log(`Właściciel: ${owner}`);
    logger.log(`Całkowita podaż: ${totalSupply} ${symbol}`);
    logger.log(`Aktualna cena: ${currentPrice} USDT`);
    logger.log(`Cena (ręcznie obliczona): ${manualFormattedPrice} USDT`);
    logger.log(`Kapitalizacja rynkowa: ${marketCap} USDT`);
    logger.log(`Kapitalizacja (ręcznie obliczona): ${manualFormattedMarketCap} USDT`);
    logger.log(`Rezerwy USDT: ${usdtReserves} USDT`);
    logger.log(`Rezerwy tokenów: ${tokenReserves} ${symbol}`);
    logger.log(`Gravity Score: ${gravityScore}`);
    
    // Bardziej czytelny format ceny i kapitalizacji rynkowej
    const readablePrice = Number(currentPrice).toExponential(6);
    const readableMarketCap = Number(marketCap).toExponential(6);
    logger.log(`\nCzytelny format:`);
    logger.log(`Cena tokenu: ${readablePrice} USDT`);
    logger.log(`Kapitalizacja: ${readableMarketCap} USDT`);
    
    return { name, symbol, totalSupply, currentPrice, marketCap, gravityScore };
  } catch (error) {
    logger.error('Błąd podczas pobierania informacji o tokenie:', error);
    throw error;
  }
}

async function getBalance(address) {
  if (!address) address = wallet.address;
  
  try {
    const balance = await tokenContract.balanceOf(address);
    const formattedBalance = ethers.utils.formatUnits(balance, TOKEN_DECIMALS);
    const symbol = await tokenContract.symbol();
    
    logger.log(`\nSaldo ${address}: ${formattedBalance} ${symbol}`);
    return formattedBalance;
  } catch (error) {
    logger.error('Błąd podczas pobierania salda:', error);
    throw error;
  }
}

async function buyTokens(usdtAmount) {
  try {
    // Konwersja kwoty USDT do jednostek wei (18 miejsc po przecinku dla 0G)
    const usdtAmountWei = ethers.utils.parseUnits(usdtAmount.toString(), USDT_DECIMALS);
    
    logger.log(`\nRozpoczęcie zakupu tokenów za ${usdtAmount} USDT...`);
    
    // Pobierz adres kontraktu USDT z tokenu
    const usdtAddress = await tokenContract.USDT();
    logger.log(`Adres kontraktu USDT: ${usdtAddress}`);
    
    // Utwórz instancję kontraktu USDT
    const usdtContract = new ethers.Contract(
      usdtAddress,
      [
        "function transfer(address to, uint256 amount) public returns (bool)",
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function balanceOf(address account) public view returns (uint256)",
        "function decimals() public view returns (uint8)"
      ],
      wallet
    );
    
    // Sprawdź decimals dla pewności
    try {
      const decimals = await usdtContract.decimals();
      logger.log(`USDT decimals: ${decimals}`);
      if (decimals !== USDT_DECIMALS) {
        logger.log(`UWAGA: Rzeczywista liczba decimals (${decimals}) różni się od założonej (${USDT_DECIMALS})`);
      }
    } catch (error) {
      logger.log(`Nie można pobrać decimals: ${error.message}`);
    }
    
    // Sprawdź saldo USDT
    const usdtBalance = await usdtContract.balanceOf(wallet.address);
    logger.log(`Saldo USDT: ${ethers.utils.formatUnits(usdtBalance, USDT_DECIMALS)} USDT`);
    
    if (usdtBalance.lt(usdtAmountWei)) {
      throw new Error(`Niewystarczające saldo USDT. Masz tylko ${ethers.utils.formatUnits(usdtBalance, USDT_DECIMALS)} USDT.`);
    }
    
    // Sprawdź bieżący allowance
    const currentAllowance = await usdtContract.allowance(wallet.address, TOKEN_ADDRESS);
    logger.log(`Obecny allowance: ${ethers.utils.formatUnits(currentAllowance, USDT_DECIMALS)} USDT`);
    
    // Oblicz opłatę 0.1% (FEE_RATE = 100, FEE_DENOMINATOR = 100000)
    const fee = usdtAmountWei.mul(100).div(100000);
    const totalAmount = usdtAmountWei.add(fee);
    logger.log(`Kwota USDT: ${ethers.utils.formatUnits(usdtAmountWei, USDT_DECIMALS)}, Opłata: ${ethers.utils.formatUnits(fee, USDT_DECIMALS)}, Razem: ${ethers.utils.formatUnits(totalAmount, USDT_DECIMALS)}`);
    
    // Jeśli allowance jest niewystarczający, zatwierdź większą ilość (kwota + opłata)
    if (currentAllowance.lt(totalAmount)) {
      logger.log('Zatwierdzanie wydatków USDT z uwzględnieniem opłaty...');
      const approveTx = await usdtContract.approve(TOKEN_ADDRESS, totalAmount);
      await approveTx.wait();
      logger.log(`Zatwierdzono wydatki USDT. Hash transakcji: ${approveTx.hash}`);
    }
    
    // Obliczenie oczekiwanej liczby tokenów
    const expectedTokens = await tokenContract.calculatePurchaseAmount(usdtAmountWei);
    logger.log(`Oczekiwana liczba tokenów: ${ethers.utils.formatUnits(expectedTokens, TOKEN_DECIMALS)}`);
    
    // Dynamiczne oszacowanie gazu
    const gasOptions = await estimateGasWithBuffer(async () => tokenContract.estimateGas.buy(usdtAmountWei));
    
    // Wykonanie zakupu
    logger.log('Wysyłanie transakcji z dynamicznym limitem gazu...');
    const tx = await tokenContract.buy(usdtAmountWei, gasOptions);
    logger.log(`Transakcja wysłana: ${tx.hash}`);
    
    const receipt = await tx.wait();
    logger.log(`Transakcja potwierdzona: ${receipt.transactionHash}`);
    
    // Znajdź event TokensPurchased
    const event = receipt.events.find(e => e.event === 'TokensPurchased');
    if (event) {
      const { buyer, usdtAmount, tokenAmount, feeAmount } = event.args;
      logger.log(`\nZakup zakończony pomyślnie!`);
      logger.log(`Kupujący: ${buyer}`);
      logger.log(`Wydano: ${ethers.utils.formatUnits(usdtAmount, USDT_DECIMALS)} USDT`);
      logger.log(`Otrzymano: ${ethers.utils.formatUnits(tokenAmount, TOKEN_DECIMALS)} tokenów`);
      logger.log(`Opłata: ${ethers.utils.formatUnits(feeAmount, USDT_DECIMALS)} USDT`);
    }
    
    return receipt;
  } catch (error) {
    // Sprawdź specyficzne kody błędów
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      logger.error('Błąd oszacowania gazu. Próba dekodowania błędu kontraktu...');
      
      if (error.error && error.error.error && error.error.error.data) {
        const errorData = error.error.error.data;
        logger.error(`Dane błędu kontraktu: ${errorData}`);
        
        // Typowe problemy:
        if (errorData.includes('USDT')) {
          logger.error('Możliwy problem z kontraktem USDT. Sprawdź czy kontrakt USDT jest poprawny.');
        }
        
        // Sprawdź błędy związane z allowance
        if (errorData.toLowerCase().includes('allowance') || 
            errorData.toLowerCase().includes('transferfrom') || 
            errorData.includes('ERC20')) {
          logger.error('\nWYKRYTO PROBLEM Z ALLOWANCE:');
          logger.error('1. Umowa próbuje pobrać więcej USDT niż dozwolone');
          logger.error('2. Pamiętaj, że kontakt pobiera opłatę 0.1% oprócz kwoty podstawowej');
          logger.error(`3. Całkowita potrzebna kwota to: ${ethers.utils.formatUnits(totalAmount, USDT_DECIMALS)} USDT (kwota + opłata)`);
          logger.error('4. Spróbuj ponownie z poprawnie ustawionym allowance');
        }
        
        // Bardziej szczegółowa analiza
        logger.error('\nMożliwe przyczyny:');
        logger.error('1. Nie masz wystarczającej ilości USDT (sprawdź saldo)');
        logger.error('2. Niewystarczający allowance (kwota musi uwzględniać opłatę 0.1%)');
        logger.error('3. Kontrakt USDT na testowej sieci nie działa prawidłowo');
        logger.error('4. Istnieje ograniczenie w kontrakcie (np. minimalnej kwoty zakupu)');
      }
    } else if (error.code === 'CALL_EXCEPTION') {
      logger.error('Błąd wywołania kontraktu. Sprawdzam przyczyny...');
      
      // Pobierz aktualne allowance po nieudanej transakcji
      try {
        const usdtAddress = await tokenContract.USDT();
        const usdtContract = new ethers.Contract(
          usdtAddress,
          ["function allowance(address owner, address spender) public view returns (uint256)"],
          wallet
        );
        
        const currentAllowance = await usdtContract.allowance(wallet.address, TOKEN_ADDRESS);
        const fee = usdtAmountWei.mul(100).div(100000);
        const totalNeeded = usdtAmountWei.add(fee);
        
        logger.error(`\nInformacje diagnostyczne:`);
        logger.error(`- Aktualne uprawnienie (allowance): ${ethers.utils.formatUnits(currentAllowance, USDT_DECIMALS)} USDT`);
        logger.error(`- Potrzebne uprawnienie: ${ethers.utils.formatUnits(totalNeeded, USDT_DECIMALS)} USDT`);
        
        if (currentAllowance.lt(totalNeeded)) {
          logger.error('\nPOTWIERDZONO PROBLEM Z ALLOWANCE:');
          logger.error(`Aktualne allowance (${ethers.utils.formatUnits(currentAllowance, USDT_DECIMALS)} USDT) jest mniejsze niż`);
          logger.error(`wymagane (${ethers.utils.formatUnits(totalNeeded, USDT_DECIMALS)} USDT = kwota + opłata 0.1%)`);
        }
      } catch (diagError) {
        logger.error('Nie można przeprowadzić diagnostyki:', diagError.message);
      }
    }
    
    logger.error('Błąd podczas kupowania tokenów:', error);
    throw error;
  }
}

async function sellTokens(tokenAmount) {
  try {
    // Konwersja liczby tokenów do jednostek wei (18 miejsc po przecinku)
    const tokenAmountWei = ethers.utils.parseUnits(tokenAmount.toString(), TOKEN_DECIMALS);
    
    logger.log(`\nRozpoczęcie sprzedaży ${tokenAmount} tokenów...`);
    
    // Sprawdź saldo użytkownika
    const balance = await tokenContract.balanceOf(wallet.address);
    if (balance.lt(tokenAmountWei)) {
      throw new Error(`Niewystarczające saldo. Posiadasz tylko ${ethers.utils.formatUnits(balance, TOKEN_DECIMALS)} tokenów.`);
    }
    
    // Obliczenie oczekiwanej liczby USDT
    const expectedUsdt = await tokenContract.calculateSaleReturn(tokenAmountWei);
    logger.log(`Oczekiwana liczba USDT: ${ethers.utils.formatUnits(expectedUsdt, USDT_DECIMALS)}`);
    
    // Dynamiczne oszacowanie gazu
    const gasOptions = await estimateGasWithBuffer(async () => tokenContract.estimateGas.sell(tokenAmountWei));
    
    // Wykonanie sprzedaży
    logger.log('Wysyłanie transakcji sprzedaży z dynamicznym limitem gazu...');
    const tx = await tokenContract.sell(tokenAmountWei, gasOptions);
    logger.log(`Transakcja wysłana: ${tx.hash}`);
    
    const receipt = await tx.wait();
    logger.log(`Transakcja potwierdzona: ${receipt.transactionHash}`);
    
    // Znajdź event TokensSold
    const event = receipt.events.find(e => e.event === 'TokensSold');
    if (event) {
      const { seller, tokenAmount, usdtAmount, feeAmount } = event.args;
      logger.log(`\nSprzedaż zakończona pomyślnie!`);
      logger.log(`Sprzedający: ${seller}`);
      logger.log(`Sprzedano: ${ethers.utils.formatUnits(tokenAmount, TOKEN_DECIMALS)} tokenów`);
      logger.log(`Otrzymano: ${ethers.utils.formatUnits(usdtAmount, USDT_DECIMALS)} USDT`);
      logger.log(`Opłata: ${ethers.utils.formatUnits(feeAmount, USDT_DECIMALS)} USDT`);
    }
    
    return receipt;
  } catch (error) {
    logger.error('Błąd podczas sprzedaży tokenów:', error);
    throw error;
  }
}

// Dodajemy funkcję do aktualizacji Gravity Score
async function updateGravityScore(score) {
  try {
    // Parsowanie i walidacja wartości Gravity Score
    const newScore = parseInt(score, 10);
    
    if (isNaN(newScore) || newScore < 0 || newScore > 1000) {
      throw new Error('Gravity Score musi być liczbą całkowitą z zakresu 0-1000');
    }
    
    logger.log(`\nAktualizacja Gravity Score dla tokenu ${TOKEN_ADDRESS}`);
    logger.log(`Aktualny adres portfela: ${wallet.address}`);
    
    // Sprawdź czy portfel jest właścicielem tokenu
    const owner = await tokenContract.owner();
    logger.log(`Właściciel tokenu: ${owner}`);
    
    // Pobierz aktualny Gravity Score
    const currentScore = await tokenContract.gravityScore();
    logger.log(`Aktualny Gravity Score: ${currentScore}`);
    
    logger.log(`Ustawianie nowej wartości: ${newScore}`);
    
    // Dynamiczne oszacowanie gazu
    const gasOptions = await estimateGasWithBuffer(async () => tokenContract.estimateGas.updateGravityScore(newScore));
    
    // Spróbuj zaktualizować Gravity Score
    logger.log('Wysyłanie transakcji z dynamicznym limitem gazu...');
    const tx = await tokenContract.updateGravityScore(newScore, gasOptions);
    logger.log(`Transakcja wysłana: ${tx.hash}`);
    
    const receipt = await tx.wait();
    logger.log(`Transakcja potwierdzona: ${receipt.transactionHash}`);
    
    // Znajdź event GravityScoreUpdated
    const event = receipt.events.find(e => e.event === 'GravityScoreUpdated');
    if (event) {
      const { oldScore, newScore } = event.args;
      logger.log(`\nGravity Score zaktualizowany pomyślnie!`);
      logger.log(`Stara wartość: ${oldScore}`);
      logger.log(`Nowa wartość: ${newScore}`);
    }
    
    // Sprawdź, czy jakieś progi zostały osiągnięte
    logger.log(`\nSprawdzanie osiągniętych progów...`);
    for (const threshold of [200, 400, 600, 800, 1000]) {
      if (newScore >= threshold) {
        const thresholdReached = await tokenContract.thresholdReached(threshold);
        if (thresholdReached) {
          const unlockedTokens = await tokenContract.unlockedTokens(threshold);
          logger.log(`Próg ${threshold} osiągnięty! Odblokowane tokeny: ${ethers.utils.formatUnits(unlockedTokens, TOKEN_DECIMALS)}`);
        }
      }
    }
    
    // Sprawdź całkowitą liczbę odblokowanych tokenów
    const totalUnlocked = await tokenContract.totalUnlockedTokens();
    logger.log(`\nŁączna liczba odblokowanych tokenów: ${ethers.utils.formatUnits(totalUnlocked, TOKEN_DECIMALS)}`);
    
    return receipt;
  } catch (error) {
    // Sprawdź konkretne kody błędów
    if (error.message.includes('Not authorized')) {
      logger.error('BŁĄD: Brak uprawnień do aktualizacji Gravity Score');
      logger.error('Tylko właściciel tokenu lub fabryka tokenów może aktualizować Gravity Score');
      logger.error(`Twój adres: ${wallet.address}`);
      
      // Sprawdź czy jesteś właścicielem
      try {
        const owner = await tokenContract.owner();
        logger.error(`Właściciel tokenu: ${owner}`);
        
        if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
          logger.error('Nie jesteś właścicielem tego tokenu');
        }
      } catch (e) {
        logger.error('Nie można sprawdzić właściciela tokenu');
      }
    }
    
    logger.error('Błąd podczas aktualizacji Gravity Score:', error);
    throw error;
  }
}

// Dodajemy funkcję do odbioru odblokowanych tokenów (claim)
async function claimUnlockedTokens() {
  try {
    logger.log('\nOdbieranie odblokowanych tokenów...');
    
    // Sprawdź czy portfel jest właścicielem tokenu
    const owner = await tokenContract.owner();
    logger.log(`Właściciel tokenu: ${owner}`);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Tylko właściciel tokenu może odebrać odblokowane tokeny');
    }
    
    // Sprawdź ile tokenów jest do odebrania
    const totalUnlocked = await tokenContract.totalUnlockedTokens();
    logger.log(`Dostępne do odebrania: ${ethers.utils.formatUnits(totalUnlocked, TOKEN_DECIMALS)} tokenów`);
    
    if (totalUnlocked.isZero()) {
      logger.log('Brak tokenów do odebrania. Zdobądź wyższy Gravity Score, aby odblokować tokeny.');
      return;
    }
    
    // Dynamiczne oszacowanie gazu
    const gasOptions = await estimateGasWithBuffer(async () => tokenContract.estimateGas.claimUnlockedTokens());
    
    // Wykonaj transakcję odbioru tokenów
    logger.log('Wysyłanie transakcji z dynamicznym limitem gazu...');
    const tx = await tokenContract.claimUnlockedTokens(gasOptions);
    logger.log(`Transakcja wysłana: ${tx.hash}`);
    
    const receipt = await tx.wait();
    logger.log(`Transakcja potwierdzona: ${receipt.transactionHash}`);
    
    logger.log(`\nPomyślnie odebrano ${ethers.utils.formatUnits(totalUnlocked, TOKEN_DECIMALS)} tokenów!`);
    
    // Wyświetl aktualne saldo
    const balance = await tokenContract.balanceOf(wallet.address);
    logger.log(`Aktualne saldo: ${ethers.utils.formatUnits(balance, TOKEN_DECIMALS)} tokenów`);
    
    return receipt;
  } catch (error) {
    logger.error('Błąd podczas odbierania tokenów:', error);
    throw error;
  }
}

// Dodajemy nowe funkcje do interakcji z pulą płynności po graduacji
async function buyFromPool(usdtAmount) {
  try {
    // Konwersja kwoty USDT na jednostki Wei
    const usdtAmountWei = ethers.utils.parseUnits(usdtAmount.toString(), USDT_DECIMALS);
    
    logger.log(`\nRozpoczęcie zakupu tokenów przez pulę płynności za ${usdtAmount} USDT...`);
    
    // 1. Pobierz adres kontraktu USDT
    const usdtAddress = await tokenContract.USDT();
    logger.log(`Adres kontraktu USDT: ${usdtAddress}`);
    
    // 2. Pobierz adres pary
    logger.log(`Sprawdzam, czy token jest zgraduowany i posiada adres pary...`);
    const isGraduated = await tokenContract.isGraduated();
    if (!isGraduated) {
      throw new Error("Token nie został jeszcze zgraduowany. Najpierw wykonaj graduację.");
    }
    
    const swapPairAddress = await tokenContract.swapPair();
    logger.log(`Adres pary płynności: ${swapPairAddress}`);
    
    if (!swapPairAddress || swapPairAddress === ethers.constants.AddressZero) {
      throw new Error("Adres pary jest pusty lub nieprawidłowy.");
    }
    
    // 3. Utwórz instancję kontraktu SwapPair
    const swapPair = new ethers.Contract(swapPairAddress, SWAP_PAIR_JSON.abi, wallet);
    
    // 4. Utwórz instancję kontraktu USDT
    const usdtContract = new ethers.Contract(
      usdtAddress,
      [
        "function transfer(address to, uint256 amount) public returns (bool)",
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function balanceOf(address account) public view returns (uint256)",
        "function decimals() public view returns (uint8)"
      ],
      wallet
    );
    
    // 5. Sprawdź saldo USDT
    const usdtBalance = await usdtContract.balanceOf(wallet.address);
    logger.log(`Saldo USDT: ${ethers.utils.formatUnits(usdtBalance, USDT_DECIMALS)} USDT`);
    
    if (usdtBalance.lt(usdtAmountWei)) {
      throw new Error(`Niewystarczające saldo USDT. Masz tylko ${ethers.utils.formatUnits(usdtBalance, USDT_DECIMALS)} USDT.`);
    }
    
    // 6. Sprawdź allowance
    const currentAllowance = await usdtContract.allowance(wallet.address, swapPairAddress);
    logger.log(`Obecny allowance dla pary: ${ethers.utils.formatUnits(currentAllowance, USDT_DECIMALS)} USDT`);
    
    // 7. Zatwierdź USDT dla kontraktu pary, jeśli potrzeba
    if (currentAllowance.lt(usdtAmountWei)) {
      logger.log(`Zatwierdzanie ${usdtAmount} USDT dla kontraktu pary...`);
      const approveTx = await usdtContract.approve(swapPairAddress, usdtAmountWei);
      await approveTx.wait();
      logger.log(`Zatwierdzono. Hash transakcji: ${approveTx.hash}`);
    } else {
      logger.log(`Allowance jest wystarczający, pomijam approve.`);
    }
    
    // 8. Pobierz rezerwy pary
    const [tokenReserve, usdtReserve] = await swapPair.getReserves();
    logger.log(`Rezerwy pary - Token: ${ethers.utils.formatUnits(tokenReserve, TOKEN_DECIMALS)}, USDT: ${ethers.utils.formatUnits(usdtReserve, USDT_DECIMALS)}`);
    
    // 9. Oblicz oczekiwaną ilość tokenów na podstawie wzoru k = x * y
    // amount_out = (y * amount_in) / (x + amount_in)
    const expectedTokens = usdtAmountWei.mul(tokenReserve).div(usdtReserve.add(usdtAmountWei));
    logger.log(`Oczekiwana ilość tokenów: ${ethers.utils.formatUnits(expectedTokens, TOKEN_DECIMALS)}`);
    
    // 10. Wywołaj funkcję swap
    logger.log(`Wykonuję swap USDT -> token...`);
    
    // Transferuj USDT do pary
    const transferTx = await usdtContract.transfer(swapPairAddress, usdtAmountWei);
    await transferTx.wait();
    logger.log(`USDT przetransferowane do pary. Hash: ${transferTx.hash}`);
    
    // Wykonaj swap
    const swapTx = await swapPair.swap(expectedTokens, 0, wallet.address);
    await swapTx.wait();
    logger.log(`Swap zakończony. Hash transakcji: ${swapTx.hash}`);
    
    // 11. Sprawdź saldo po wykonaniu swapu
    const tokenBalance = await tokenContract.balanceOf(wallet.address);
    logger.log(`\nZakup zakończony pomyślnie!`);
    logger.log(`Twoje nowe saldo: ${ethers.utils.formatUnits(tokenBalance, TOKEN_DECIMALS)} tokenów`);
    
    return swapTx;
  } catch (error) {
    logger.error(`Błąd podczas zakupu tokenów przez pulę: ${error.message}`);
    throw error;
  }
}

async function sellToPool(tokenAmount) {
  try {
    // Konwersja ilości tokenów na jednostki Wei
    const tokenAmountWei = ethers.utils.parseUnits(tokenAmount.toString(), TOKEN_DECIMALS);
    
    logger.log(`\nRozpoczęcie sprzedaży ${tokenAmount} tokenów przez pulę płynności...`);
    
    // 1. Pobierz adres kontraktu USDT
    const usdtAddress = await tokenContract.USDT();
    
    // 2. Pobierz adres pary
    logger.log(`Sprawdzam, czy token jest zgraduowany i posiada adres pary...`);
    const isGraduated = await tokenContract.isGraduated();
    if (!isGraduated) {
      throw new Error("Token nie został jeszcze zgraduowany. Najpierw wykonaj graduację.");
    }
    
    const swapPairAddress = await tokenContract.swapPair();
    logger.log(`Adres pary płynności: ${swapPairAddress}`);
    
    if (!swapPairAddress || swapPairAddress === ethers.constants.AddressZero) {
      throw new Error("Adres pary jest pusty lub nieprawidłowy.");
    }
    
    // 3. Utwórz instancję kontraktu SwapPair
    const swapPair = new ethers.Contract(swapPairAddress, SWAP_PAIR_JSON.abi, wallet);
    
    // 4. Sprawdź saldo tokenów
    const tokenBalance = await tokenContract.balanceOf(wallet.address);
    logger.log(`Saldo tokenów: ${ethers.utils.formatUnits(tokenBalance, TOKEN_DECIMALS)}`);
    
    if (tokenBalance.lt(tokenAmountWei)) {
      throw new Error(`Niewystarczające saldo tokenów. Masz tylko ${ethers.utils.formatUnits(tokenBalance, TOKEN_DECIMALS)}.`);
    }
    
    // 5. Sprawdź allowance
    const currentAllowance = await tokenContract.allowance(wallet.address, swapPairAddress);
    logger.log(`Obecny allowance dla pary: ${ethers.utils.formatUnits(currentAllowance, TOKEN_DECIMALS)} tokenów`);
    
    // 6. Zatwierdź tokeny dla kontraktu pary, jeśli potrzeba
    if (currentAllowance.lt(tokenAmountWei)) {
      logger.log(`Zatwierdzanie ${tokenAmount} tokenów dla kontraktu pary...`);
      const approveTx = await tokenContract.approve(swapPairAddress, tokenAmountWei);
      await approveTx.wait();
      logger.log(`Zatwierdzono. Hash transakcji: ${approveTx.hash}`);
    } else {
      logger.log(`Allowance jest wystarczający, pomijam approve.`);
    }
    
    // 7. Pobierz rezerwy pary
    const [tokenReserve, usdtReserve] = await swapPair.getReserves();
    logger.log(`Rezerwy pary - Token: ${ethers.utils.formatUnits(tokenReserve, TOKEN_DECIMALS)}, USDT: ${ethers.utils.formatUnits(usdtReserve, USDT_DECIMALS)}`);
    
    // 8. Oblicz oczekiwaną ilość USDT na podstawie wzoru k = x * y
    // amount_out = (y * amount_in) / (x + amount_in)
    const expectedUsdt = tokenAmountWei.mul(usdtReserve).div(tokenReserve.add(tokenAmountWei));
    logger.log(`Oczekiwana ilość USDT: ${ethers.utils.formatUnits(expectedUsdt, USDT_DECIMALS)}`);
    
    // 9. Wywołaj funkcję swap
    logger.log(`Wykonuję swap token -> USDT...`);
    
    // Transferuj tokeny do pary
    const transferTx = await tokenContract.transfer(swapPairAddress, tokenAmountWei);
    await transferTx.wait();
    logger.log(`Tokeny przetransferowane do pary. Hash: ${transferTx.hash}`);
    
    // Wykonaj swap
    const swapTx = await swapPair.swap(0, expectedUsdt, wallet.address);
    await swapTx.wait();
    logger.log(`Swap zakończony. Hash transakcji: ${swapTx.hash}`);
    
    // 10. Sprawdź saldo USDT po wykonaniu swapu
    const usdtContract = new ethers.Contract(
      usdtAddress,
      ["function balanceOf(address account) public view returns (uint256)"],
      wallet
    );
    const usdtBalance = await usdtContract.balanceOf(wallet.address);
    
    logger.log(`\nSprzedaż zakończona pomyślnie!`);
    logger.log(`Twoje nowe saldo USDT: ${ethers.utils.formatUnits(usdtBalance, USDT_DECIMALS)} USDT`);
    
    return swapTx;
  } catch (error) {
    logger.error(`Błąd podczas sprzedaży tokenów przez pulę: ${error.message}`);
    throw error;
  }
}

// Przykład użycia
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  logger.log('Interakcja z tokenem BondingCurveToken');
  logger.log(`Adres tokenu: ${TOKEN_ADDRESS}`);
  logger.log(`Adres portfela: ${wallet.address}`);
  
  switch(command) {
    case 'info':
      await getTokenInfo();
      break;
    
    // Nowa komenda do analizy krzywej cenowej  
    case 'analyze-curve':
      await analyzeBondingCurve();
      break;

    // Dodajemy nowe komendy dla Gravity Score
    case 'update-gravity':
      if (args.length < 2) {
        logger.error('Użycie: node interact-token.js update-gravity <score>');
        logger.error('Score musi być liczbą całkowitą z zakresu 0-1000');
        process.exit(1);
      }
      await updateGravityScore(args[1]);
      break;
      
    case 'claim-tokens':
      await claimUnlockedTokens();
      break;
      
    case 'balance':
      const address = args[1] || wallet.address;
      await getBalance(address);
      break;
      
    case 'buy':
      if (args.length < 2) {
        logger.error('Użycie: node interact-token.js buy <kwota-USDT>');
        process.exit(1);
      }
      await buyTokens(parseFloat(args[1]));
      break;
      
    case 'sell':
      if (args.length < 2) {
        logger.error('Użycie: node interact-token.js sell <liczba-tokenów>');
        process.exit(1);
      }
      await sellTokens(parseFloat(args[1]));
      break;
      
    case 'buy-pool':
      if (args.length < 2) {
        logger.error('Użycie: node interact-token.js buy-pool <kwota-USDT>');
        process.exit(1);
      }
      await buyFromPool(parseFloat(args[1]));
      break;
      
    case 'sell-pool':
      if (args.length < 2) {
        logger.error('Użycie: node interact-token.js sell-pool <liczba-tokenów>');
        process.exit(1);
      }
      await sellToPool(parseFloat(args[1]));
      break;
      
    case 'test-decimals':
      // Sprawdź poprawność obliczeń z różnymi decimals
      logger.log('\nTest przeliczania wartości z różnymi decimals:');
      try {
        const oneUsdt = ethers.utils.parseUnits('1.0', USDT_DECIMALS);
        const expectedTokens = await tokenContract.calculatePurchaseAmount(oneUsdt);
        logger.log(`Za 1 USDT (${oneUsdt.toString()} jednostek) otrzymasz: ${ethers.utils.formatUnits(expectedTokens, TOKEN_DECIMALS)} tokenów`);
        
        const currentPrice = await tokenContract.getCurrentPrice();
        logger.log(`Aktualna cena tokenu: ${ethers.utils.formatUnits(currentPrice, 18)} USDT za 1 token`);
      } catch (error) {
        logger.error('Błąd podczas testu decimals:', error);
      }
      break;
      
    default:
      logger.log('\nDostępne komendy:');
      logger.log('  node interact-token.js info               - Pokaż informacje o tokenie');
      logger.log('  node interact-token.js balance [adres]    - Pokaż saldo podanego adresu lub twojego portfela');
      logger.log('  node interact-token.js buy <kwota-USDT>   - Kup tokeny za podaną kwotę USDT');
      logger.log('  node interact-token.js sell <liczba-tokenów> - Sprzedaj podaną liczbę tokenów');
      logger.log('  node interact-token.js test-decimals      - Testuj przeliczanie wartości z różnymi decimals');
      logger.log('  node interact-token.js analyze-curve      - Analiza mechanizmu bonding curve');
      logger.log('  node interact-token.js update-gravity <score> - Aktualizuj Gravity Score (0-1000)');
      logger.log('  node interact-token.js claim-tokens       - Odbierz odblokowane tokeny (tylko creator)');
      logger.log('  node interact-token.js buy-pool <kwota-USDT>   - Kup tokeny przez pulę za podaną kwotę USDT');
      logger.log('  node interact-token.js sell-pool <liczba-tokenów> - Sprzedaj podaną liczbę tokenów przez pulę');
  }
}

// Funkcja do analizy krzywej cenowej
async function analyzeBondingCurve() {
  try {
    logger.log('\n--- Analiza mechanizmu Bonding Curve ---');
    
    // Pobierz aktualne rezerwy
    const usdtReserves = await tokenContract.usdtReserves();
    const tokenReserves = await tokenContract.tokenReserves();
    const k = usdtReserves.mul(tokenReserves);
    const currentPrice = await tokenContract.getCurrentPrice();
    
    // Wyświetl informacje
    logger.log(`Rezerwy USDT: ${ethers.utils.formatUnits(usdtReserves, USDT_DECIMALS)} USDT`);
    logger.log(`Rezerwy tokenów: ${ethers.utils.formatUnits(tokenReserves, TOKEN_DECIMALS)}`);
    logger.log(`Wartość k (stała): ${ethers.utils.formatUnits(k, USDT_DECIMALS + TOKEN_DECIMALS)}`);
    logger.log(`Aktualna cena tokenu: ${ethers.utils.formatUnits(currentPrice, 18)} USDT za token`);
    
    // Bardziej czytelny format wyświetlania
    const readablePrice = Number(ethers.utils.formatUnits(currentPrice, 18)).toExponential(6);
    logger.log(`\nCzytelny format ceny: ${readablePrice} USDT za token`);
    
    // Wyjaśnienie dlaczego cena jest niska
    logger.log(`\nWyjaśnienie niskiej ceny:`);
    logger.log(`1. Kontrakt używa wirtualnych rezerw do inicjalizacji ceny:`);
    logger.log(`   - Wirtualne rezerwy USDT: 100,000 USDT (${ethers.utils.formatUnits(100000 * 10**USDT_DECIMALS, USDT_DECIMALS)} jednostek)`);
    logger.log(`   - Wirtualne rezerwy tokenów: 1,888,888,888 tokenów (${ethers.utils.formatUnits(1888888888 * 10**TOKEN_DECIMALS, TOKEN_DECIMALS)} jednostek)`);
    logger.log(`2. Początkowa cena = rezerwy_USDT / rezerwy_tokenów = 100,000 / 1,888,888,888 ≈ 0.000053 USDT za token`);
    logger.log(`3. Po uwzględnieniu różnicy decimals (USDT: 18, token: 18), cena jest wyrażona jako bardzo mała liczba`);
    logger.log(`4. Cena wzrośnie gdy użytkownicy będą kupować tokeny (zmniejszając rezerwy tokenów)`);
    
    // Analiza ceny dla różnych kwot zakupu
    logger.log('\nSymulacja zakupu:');
    const amounts = [1, 10, 100, 1000, 10000];
    
    for (const amount of amounts) {
      const usdtAmount = ethers.utils.parseUnits(amount.toString(), USDT_DECIMALS);
      const tokensOut = await tokenContract.calculatePurchaseAmount(usdtAmount);
      
      if (tokensOut.isZero()) {
        logger.log(`Za ${amount} USDT - zbyt mała ilość tokenów`);
        continue;
      }
      
      const effectivePrice = usdtAmount.mul(ethers.utils.parseUnits('1', TOKEN_DECIMALS)).div(tokensOut);
      
      logger.log(`Za ${amount} USDT otrzymasz ${ethers.utils.formatUnits(tokensOut, TOKEN_DECIMALS)} tokenów`);
      logger.log(`Efektywna cena: ${ethers.utils.formatUnits(effectivePrice, 18)} USDT za token`);
      logger.log(`Czytelna cena: ${Number(ethers.utils.formatUnits(effectivePrice, 18)).toExponential(6)} USDT za token`);
    }
    
    // Analiza wpływu różnych zakupów na cenę
    logger.log('\nAnaliza wpływu zakupów na cenę:');
    logger.log('Symulacja zakupu dużych ilości USDT i wpływ na cenę:');
    
    // Utwórz kopię aktualnych rezerw do symulacji
    let simUsdtReserves = usdtReserves.clone();
    let simTokenReserves = tokenReserves.clone();
    
    const bigAmounts = [10000, 100000, 1000000, 10000000];
    for (const amount of bigAmounts) {
      const usdtAmount = ethers.utils.parseUnits(amount.toString(), USDT_DECIMALS);
      
      // Oblicz nowe rezerwy po zakupie
      const newUsdtReserves = simUsdtReserves.add(usdtAmount);
      const newTokenReserves = k.div(newUsdtReserves);
      const tokensOut = simTokenReserves.sub(newTokenReserves);
      
      // Zaktualizuj symulowane rezerwy
      simUsdtReserves = newUsdtReserves;
      simTokenReserves = newTokenReserves;
      
      // Oblicz nową cenę
      const newPrice = simUsdtReserves.mul(ethers.constants.WeiPerEther).div(simTokenReserves);
      
      logger.log(`Po zakupie za ${amount} USDT:`);
      logger.log(`- Nowa cena: ${Number(ethers.utils.formatUnits(newPrice, 18)).toExponential(6)} USDT`);
      logger.log(`- Wzrost ceny: ${Number(ethers.utils.formatUnits(newPrice.mul(100).div(currentPrice), 18)).toFixed(2)}x`);
    }
    
    // Analiza ceny dla sprzedaży
    logger.log('\nSymulacja sprzedaży:');
    const tokenAmounts = [10, 100, 1000, 10000, 100000];
    
    for (const amount of tokenAmounts) {
      const tokenAmount = ethers.utils.parseUnits(amount.toString(), TOKEN_DECIMALS);
      const usdtOut = await tokenContract.calculateSaleReturn(tokenAmount);
      
      if (usdtOut.isZero()) {
        logger.log(`Za ${amount} tokenów - zbyt mała ilość USDT`);
        continue;
      }
      
      const effectivePrice = usdtOut.mul(ethers.utils.parseUnits('1', TOKEN_DECIMALS)).div(tokenAmount);
      
      logger.log(`Za ${amount} tokenów otrzymasz ${ethers.utils.formatUnits(usdtOut, USDT_DECIMALS)} USDT`);
      logger.log(`Efektywna cena sprzedaży: ${ethers.utils.formatUnits(effectivePrice, 18)} USDT za token`);
      logger.log(`Czytelna cena sprzedaży: ${Number(ethers.utils.formatUnits(effectivePrice, 18)).toExponential(6)} USDT za token`);
    }
  } catch (error) {
    logger.error('Błąd podczas analizy krzywej:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Wystąpił błąd podczas wykonywania operacji:');
    logger.error(error);
    process.exit(1);
  }); 