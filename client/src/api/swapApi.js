import { ethers } from 'ethers';

// Stały adres USDT na 0G Galileo Testnet
export const USDT_ADDRESS = process.env.REACT_APP_USDT_ADDRESS || '0x3ec8a8705be1d5ca90066b37ba62c4183b024ebf';

// ABI dla kontraktu puli (AMM/DEX) - zaktualizowane dla faktycznej implementacji puli
export const POOL_ABI = [
  // Funkcje do sprawdzania stanu puli
  {
    type: "function",
    name: "tokenA",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "tokenB",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "reserveA",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "reserveB",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  
  // Funkcje transakcyjne z faktycznego kontraktu
  {
    type: "function",
    name: "swapAforB",
    inputs: [
      { type: "uint256", name: "amountIn" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "swapBforA",
    inputs: [
      { type: "uint256", name: "amountIn" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "addLiquidity",
    inputs: [
      { type: "uint256", name: "amountA" },
      { type: "uint256", name: "amountB" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "removeLiquidity",
    inputs: [
      { type: "uint256", name: "amountA" },
      { type: "uint256", name: "amountB" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  
  // Funkcje ERC20 dla kompatybilności
  {
    type: "function",
    name: "allowance",
    inputs: [
      { type: "address", name: "owner" },
      { type: "address", name: "spender" }
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "amount" }
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable"
  }
];

// ABI dla tokenów ERC20
export const ERC20_ABI = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "amount" }
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable"
  }
];

// Funkcja pomocnicza do retry logiki
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    if (process.env.REACT_APP_TEST === 'true') {
      console.log(`Retrying after error: ${error.message}. Attempts left: ${retries}`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
};

// Funkcja do debugowania interfejsu kontraktu
export const debugContractInterface = async (publicClient, contractAddress) => {
  try {
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Attempting to debug contract at:', contractAddress);
    }
    
    // Próbuj odczytać metody kontraktu poprzez błędy
    const testMethods = [
      { name: 'tokenA', args: [] },
      { name: 'token0', args: [] },
      { name: 'tokenB', args: [] },
      { name: 'token1', args: [] },
      { name: 'reserveA', args: [] },
      { name: 'reserve0', args: [] },
      { name: 'reserveB', args: [] },
      { name: 'reserve1', args: [] },
      { name: 'getReserves', args: [] }
    ];
    
    for (const method of testMethods) {
      try {
        const result = await publicClient.readContract({
          address: contractAddress,
          abi: [{ 
            type: "function", 
            name: method.name, 
            inputs: [], 
            outputs: [{ type: "address" }],
            stateMutability: "view"
          }],
          functionName: method.name,
          args: method.args,
        });
        if (process.env.REACT_APP_TEST === 'true') {
          console.log(`Method ${method.name} exists and returned:`, result);
        }
      } catch (err) {
        if (err.message.includes('function selector was not recognized')) {
          if (process.env.REACT_APP_TEST === 'true') {
            console.log(`Method ${method.name} does not exist on contract`);
          }
        } else {
          if (process.env.REACT_APP_TEST === 'true') {
            console.log(`Error calling ${method.name}:`, err.message);
          }
        }
      }
    }
    
    return "Debug complete";
  } catch (err) {
    console.error('General error during contract debugging:', err);
    return `Error: ${err.message}`;
  }
};

/**
 * Pobiera rezerwy tokenów z puli
 * @param {Object} publicClient - Klient publicClient z wagmi
 * @param {string} poolAddress - Adres kontraktu puli
 * @returns {Promise<{reserveA: ethers.BigNumber, reserveB: ethers.BigNumber, tokenA: string, tokenB: string}>}
 */
export const getPoolReserves = async (publicClient, poolAddress) => {
  try {
    if (process.env.REACT_APP_TEST === 'true') {
      console.log(`Pobieranie danych puli z adresu: ${poolAddress}`);
    }
    
    // Dodajmy więcej informacji debugujących o kontrakcie
    await debugContractInterface(publicClient, poolAddress);
    
    // Spróbujmy wykryć typ puli
    let poolType = 'unknown';
    let tokenA, tokenB, reserveA, reserveB;
    
    // Podejście 1: tokenA / tokenB
    try {
      tokenA = await retry(() => publicClient.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'tokenA',
      }), 2, 1000);
      
      tokenB = await retry(() => publicClient.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'tokenB',
      }), 2, 1000);
      
      // Jeśli doszliśmy tutaj, to pula ma interface tokenA/tokenB
      poolType = 'tokenA/tokenB';
      
      reserveA = await retry(() => publicClient.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'reserveA',
      }), 2, 1000);
      
      reserveB = await retry(() => publicClient.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'reserveB',
      }), 2, 1000);
      
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Znaleziono interface puli tokenA/tokenB');
      }
    } catch (err) {
      if (process.env.REACT_APP_TEST === 'true') {
        console.log('Nie znaleziono tokenA/tokenB, próbuję token0/token1...');
      }
      
      // Podejście 2: token0 / token1
      try {
        const token0ABI = {
          type: "function",
          name: "token0",
          inputs: [],
          outputs: [{ type: "address" }],
          stateMutability: "view"
        };
        
        const token1ABI = {
          type: "function",
          name: "token1",
          inputs: [],
          outputs: [{ type: "address" }],
          stateMutability: "view"
        };
        
        tokenA = await retry(() => publicClient.readContract({
          address: poolAddress,
          abi: [token0ABI],
          functionName: 'token0',
        }), 2, 1000);
        
        tokenB = await retry(() => publicClient.readContract({
          address: poolAddress,
          abi: [token1ABI],
          functionName: 'token1',
        }), 2, 1000);
        
        poolType = 'token0/token1';
        
        // Podejście 3: getReserves - funkcja z UniswapV2
        try {
          const getReservesABI = {
            type: "function",
            name: "getReserves",
            inputs: [],
            outputs: [
              { type: "uint112", name: "_reserve0" },
              { type: "uint112", name: "_reserve1" },
              { type: "uint32", name: "_blockTimestampLast" }
            ],
            stateMutability: "view"
          };
          
          const reserves = await retry(() => publicClient.readContract({
            address: poolAddress,
            abi: [getReservesABI],
            functionName: 'getReserves',
          }), 2, 1000);
          
          poolType = 'uniswapV2';
          reserveA = reserves[0];
          reserveB = reserves[1];
          if (process.env.REACT_APP_TEST === 'true') {
            console.log('Znaleziono UniswapV2-style reserves');
          }
        } catch (reserveErr) {
          if (process.env.REACT_APP_TEST === 'true') {
            console.log('Nie znaleziono getReserves, próbuję reserve0/reserve1...');
          }
          
          // Podejście 4: reserve0 / reserve1
          const reserve0ABI = {
            type: "function",
            name: "reserve0",
            inputs: [],
            outputs: [{ type: "uint256" }],
            stateMutability: "view"
          };
          
          const reserve1ABI = {
            type: "function",
            name: "reserve1",
            inputs: [],
            outputs: [{ type: "uint256" }],
            stateMutability: "view"
          };
          
          reserveA = await retry(() => publicClient.readContract({
            address: poolAddress,
            abi: [reserve0ABI],
            functionName: 'reserve0',
          }), 2, 1000);
          
          reserveB = await retry(() => publicClient.readContract({
            address: poolAddress,
            abi: [reserve1ABI],
            functionName: 'reserve1',
          }), 2, 1000);
          
          poolType = 'reserve0/reserve1';
        }
        
        if (process.env.REACT_APP_TEST === 'true') {
          console.log('Znaleziono interface puli token0/token1');
        }
      } catch (innerErr) {
        console.error('Wszystkie próby detekcji interfejsu puli nie powiodły się:', innerErr);
        throw new Error('Nie można wykryć typu puli, brak tokenA/tokenB ani token0/token1');
      }
    }
    
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Dane puli pobrano pomyślnie:', {
        poolType,
        tokenA,
        tokenB,
        reserveA: reserveA.toString(),
        reserveB: reserveB.toString()
      });
    }
    
    return { 
      reserveA: ethers.BigNumber.from(reserveA.toString()), 
      reserveB: ethers.BigNumber.from(reserveB.toString()), 
      tokenA, 
      tokenB,
      poolType
    };
  } catch (error) {
    console.error('Błąd podczas pobierania danych puli:', error);
    throw error;
  }
};

/**
 * Sprawdza, który token w puli to USDT
 * @param {string} tokenA - Adres pierwszego tokenu
 * @param {string} tokenB - Adres drugiego tokenu
 * @returns {{ isTokenAUSDT: boolean, usdtToken: string, nonUsdtToken: string }}
 */
export const identifyTokens = (tokenA, tokenB) => {
  const isTokenAUSDT = tokenA.toLowerCase() === USDT_ADDRESS.toLowerCase();
  const usdtToken = isTokenAUSDT ? tokenA : tokenB;
  const nonUsdtToken = isTokenAUSDT ? tokenB : tokenA;
  
  return { isTokenAUSDT, usdtToken, nonUsdtToken };
};

/**
 * Oblicza ilość tokenów do otrzymania na podstawie formuły AMM x*y=k
 * @param {ethers.BigNumber} amountIn - Ilość tokenów wejściowych
 * @param {ethers.BigNumber} reserveIn - Rezerwa tokenu wejściowego
 * @param {ethers.BigNumber} reserveOut - Rezerwa tokenu wyjściowego
 * @returns {ethers.BigNumber} Przewidywana ilość tokenów wyjściowych
 */
export const getAmountOut = (amountIn, reserveIn, reserveOut) => {
  if (amountIn.lte(0)) return ethers.BigNumber.from(0);
  
  if (reserveIn.lte(0) || reserveOut.lte(0)) return ethers.BigNumber.from(0);
  
  // Stała 0.3% opłaty za handel (997/1000 = 0.997 czyli 1 - opłata)
  const amountInWithFee = amountIn.mul(997);
  const numerator = amountInWithFee.mul(reserveOut);
  const denominator = reserveIn.mul(1000).add(amountInWithFee);
  return numerator.div(denominator);
};

/**
 * Oblicza cenę tokenu w USDT na podstawie rezerw
 * @param {boolean} isTokenAUSDT - Czy token A to USDT
 * @param {ethers.BigNumber} reserveA - Rezerwa tokenu A
 * @param {ethers.BigNumber} reserveB - Rezerwa tokenu B
 * @param {number} decimalsA - Liczba miejsc dziesiętnych tokenu A
 * @param {number} decimalsB - Liczba miejsc dziesiętnych tokenu B
 * @returns {number} Cena tokenu w USDT
 */
export const calculateTokenPrice = (isTokenAUSDT, reserveA, reserveB, decimalsA, decimalsB) => {
  if (isTokenAUSDT) {
    return parseFloat(ethers.utils.formatUnits(reserveA, decimalsA)) / 
           parseFloat(ethers.utils.formatUnits(reserveB, decimalsB));
  } else {
    return parseFloat(ethers.utils.formatUnits(reserveB, decimalsB)) / 
           parseFloat(ethers.utils.formatUnits(reserveA, decimalsA));
  }
};

/**
 * Oblicza wpływ transakcji na cenę (price impact)
 * @param {ethers.BigNumber} amountIn - Ilość tokenów wejściowych
 * @param {ethers.BigNumber} reserveIn - Rezerwa tokenu wejściowego
 * @param {ethers.BigNumber} reserveOut - Rezerwa tokenu wyjściowego
 * @param {ethers.BigNumber} amountOut - Przewidywana ilość tokenów wyjściowych
 * @returns {number} Wpływ na cenę jako wartość procentowa (np. 1.5 dla 1.5%)
 */
export const calculatePriceImpact = (amountIn, reserveIn, reserveOut, amountOut) => {
  // Oblicz obecną cenę
  const currentPrice = reserveOut.mul(ethers.constants.WeiPerEther).div(reserveIn);
  
  // Oblicz cenę po transakcji
  const newReserveIn = reserveIn.add(amountIn);
  const newReserveOut = reserveOut.sub(amountOut);
  const newPrice = newReserveOut.mul(ethers.constants.WeiPerEther).div(newReserveIn);
  
  // Oblicz procentową różnicę
  const priceDifference = currentPrice.sub(newPrice).mul(10000).div(currentPrice);
  return parseFloat(priceDifference.toString()) / 100;
};

/**
 * Oblicza minimalną ilość tokenów do otrzymania z uwzględnieniem slippage
 * @param {ethers.BigNumber} amountOut - Przewidywana ilość tokenów wyjściowych
 * @param {number} slippagePercent - Tolerancja poślizgu cenowego w procentach (np. 0.5 dla 0.5%)
 * @returns {ethers.BigNumber} Minimalna akceptowalna ilość tokenów
 */
export const calculateAmountOutMin = (amountOut, slippagePercent) => {
  // Konwertuj procent slippage na ułamek (np. 0.5% -> 0.005)
  const slippageFraction = slippagePercent / 100;
  
  // Oblicz minimalną ilość: amountOut * (1 - slippage)
  const slippageBasisPoints = Math.floor(slippageFraction * 10000);
  return amountOut.mul(10000 - slippageBasisPoints).div(10000);
};

/**
 * Przygotowuje dane do transakcji swap
 * @param {Object} poolData - Dane o puli
 * @param {string} poolData.poolAddress - Adres kontraktu puli
 * @param {boolean} poolData.isBuy - Czy to jest zakup (buy) czy sprzedaż (sell)
 * @param {string} poolData.tokenAddress - Adres tokenu niebędącego USDT
 * @param {number} poolData.amount - Kwota w USD (przy kupnie) lub ilość tokenów (przy sprzedaży)
 * @param {number} poolData.slippage - Tolerancja poślizgu w procentach
 * @param {Object} publicClient - PublicClient z wagmi
 * @returns {Promise<Object>} Dane do transakcji
 */
export const prepareSwapTransaction = async (poolData, publicClient) => {
  const { poolAddress, isBuy, tokenAddress, amount, slippage = 0.5 } = poolData;
  
  try {
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Preparing swap transaction for pool:', poolAddress);
    }
    
    // Pobierz dane o puli
    const { reserveA, reserveB, tokenA, tokenB, poolType } = await getPoolReserves(publicClient, poolAddress);
    if (process.env.REACT_APP_TEST === 'true') {
      console.log(`Pool type detected: ${poolType}, tokenA: ${tokenA}, tokenB: ${tokenB}`);
    }
    
    // Sprawdź, czy USDT jest jednym z tokenów w puli
    const isTokenAUSDT = tokenA.toLowerCase() === USDT_ADDRESS.toLowerCase();
    const isTokenBUSDT = tokenB.toLowerCase() === USDT_ADDRESS.toLowerCase();
    
    if (!isTokenAUSDT && !isTokenBUSDT) {
      if (process.env.REACT_APP_TEST === 'true') {
        console.warn("Warning: USDT not detected in this pool. Using the provided tokenAddress for swap.");
      }
    }
    
    // Ustal, który token to USDT (lub inny "stabilny" token)
    const usdtToken = isTokenAUSDT ? tokenA : (isTokenBUSDT ? tokenB : USDT_ADDRESS);
    const nonUsdtToken = isTokenAUSDT ? tokenB : (isTokenBUSDT ? tokenA : tokenAddress);
    
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Token identification:', {
        usdtToken,
        nonUsdtToken,
        isTokenAUSDT,
        isTokenBUSDT
      });
    }
    
    // Pobierz informacje o tokenach (decimals)
    const usdtDecimals = await retry(() => publicClient.readContract({
      address: usdtToken,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }), 2, 1000) || 18; // Default to 18 if not available
    
    const tokenDecimals = await retry(() => publicClient.readContract({
      address: nonUsdtToken,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }), 2, 1000) || 18; // Default to 18 if not available
    
    // Określ rezerwy na podstawie tego, który token jest USDT
    const usdtReserve = isTokenAUSDT ? reserveA : reserveB;
    const tokenReserve = isTokenAUSDT ? reserveB : reserveA;
    
    let amountIn, amountOut, tokenIn, tokenOut;
    
    // Ustaw kierunek swapu
    if (isBuy) {
      // Kupujemy token za USDT
      tokenIn = usdtToken;
      tokenOut = nonUsdtToken;
      amountIn = ethers.utils.parseUnits(amount.toString(), usdtDecimals);
      amountOut = getAmountOut(amountIn, usdtReserve, tokenReserve);
    } else {
      // Sprzedajemy token za USDT
      tokenIn = nonUsdtToken;
      tokenOut = usdtToken;
      amountIn = ethers.utils.parseUnits(amount.toString(), tokenDecimals);
      amountOut = getAmountOut(amountIn, tokenReserve, usdtReserve);
    }
    
    // Oblicz minimalną ilość z uwzględnieniem slippage
    const amountOutMin = calculateAmountOutMin(amountOut, slippage);
    
    // Oblicz price impact
    const priceImpact = calculatePriceImpact(
      amountIn,
      isBuy ? usdtReserve : tokenReserve,
      isBuy ? tokenReserve : usdtReserve,
      amountOut
    );
    
    // Sprawdź czy token wejściowy jest tokenA czy tokenB, aby określić właściwą funkcję
    const isTokenInA = tokenIn.toLowerCase() === tokenA.toLowerCase();
    const swapFunction = isTokenInA ? 'swapAforB' : 'swapBforA';
    
    // Przygotuj dane do transakcji
    const result = {
      poolAddress,
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      amountOutMin: amountOutMin.toString(),
      priceImpact,
      tokenDecimals: isBuy ? tokenDecimals : usdtDecimals,
      formattedAmountOut: ethers.utils.formatUnits(amountOut, isBuy ? tokenDecimals : usdtDecimals),
      swapFunction
    };
    
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Swap data prepared:', result);
    }
    return result;
  } catch (error) {
    console.error('Error preparing swap transaction:', error);
    throw error;
  }
}; 