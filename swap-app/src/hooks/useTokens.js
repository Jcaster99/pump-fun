import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { createPublicClient, http, getContract } from 'viem';
import { GRADUATION_REGISTRY_ABI, ERC20_ABI, LF0G_SWAP_PAIR_ABI } from '../constants/abi';
import { getContractAddress, isTestMode } from '../config/env';
import { galileoTestnet } from '../config/chains';

/**
 * Hook pobierający tokeny, które przeszły proces graduacji
 * i ich szczegóły (symbol, nazwa, adres pary, rezerwy)
 */
export const useGraduatedTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();
  
  // Adres rejestru graduacji
  const registryAddress = getContractAddress('GRADUATION_REGISTRY');
  const usdtAddress = getContractAddress('USDT');

  console.log('[DEBUG] Graduation Registry Address:', registryAddress);
  console.log('[DEBUG] USDT Address:', usdtAddress);

  // Funkcja do pobierania balansu USDT
  const fetchUsdtBalance = async (client) => {
    if (!userAddress) return '0';
    
    try {
      console.log('[DEBUG] Fetching USDT balance for address:', userAddress);
      const decimals = await client.readContract({
        address: usdtAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      
      const rawBalance = await client.readContract({
        address: usdtAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      });
      
      const balance = (Number(rawBalance) / 10 ** Number(decimals)).toString();
      console.log(`[DEBUG] USDT balance: ${balance}`);
      return balance;
    } catch (err) {
      console.error('[DEBUG] Error fetching USDT balance:', err);
      return '0';
    }
  };

  // Funkcja do odświeżania balansów tokenów
  const refreshTokenBalances = async () => {
    if (!publicClient || !userAddress) {
      console.log('[DEBUG] Cannot refresh token balances - missing client or address');
      return;
    }
    
    console.log('[DEBUG] Refreshing token balances for address:', userAddress);
    
    try {
      // Pobierz aktualny balans USDT
      const usdtBalance = await fetchUsdtBalance(publicClient);
      
      // Aktualizuj balansy dla każdego tokenu
      const updatedTokens = await Promise.all(
        tokens.map(async (token) => {
          try {
            // Dla USDT użyj już pobranego balansu
            if (token.symbol === 'USDT') {
              console.log(`[DEBUG] Updating USDT balance to ${usdtBalance} in refreshTokenBalances`);
              return {
                ...token,
                userBalance: usdtBalance,
                rawBalance: BigInt(Math.floor(parseFloat(usdtBalance) * 10 ** Number(token.decimals))),
              };
            }
            
            // Dla innych tokenów pobierz aktualny balans
            const rawBalance = await publicClient.readContract({
              address: token.address,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [userAddress],
            });
            
            // Zaktualizuj balans tokenu
            const userBalance = (Number(rawBalance) / 10 ** Number(token.decimals)).toString();
            console.log(`[DEBUG] Updated balance for ${token.symbol}: ${userBalance}`);
            
            // Zwróć token z zaktualizowanym balansem
            return {
              ...token,
              userBalance,
              rawBalance,
            };
          } catch (err) {
            console.error(`[DEBUG] Error refreshing balance for token ${token.address}:`, err);
            return token; // Zachowaj poprzedni stan tokenu w przypadku błędu
          }
        })
      );
      
      // Ustaw zaktualizowane tokeny
      setTokens(updatedTokens);
      console.log('[DEBUG] Token balances refreshed successfully');
    } catch (err) {
      console.error('[DEBUG] Error refreshing token balances:', err);
    }
  };

  useEffect(() => {
    const fetchGraduatedTokens = async () => {
      if (!publicClient) {
        // Continue even if `usePublicClient` has not yet returned a client. In that case we
        // create a temporary stateless public client that points to the Galileo RPC so that
        // contract reads can still succeed before a wallet is connected.
        console.log('[DEBUG] PublicClient not available, will create fallback client');
      } else {
        console.log('[DEBUG] Using existing PublicClient');
      }
      
      try {
        setLoading(true);
        console.log('[DEBUG] Starting token fetch process');
        
        // Utworzenie klienta publicClient, jeśli nie jest dostępny
        const client = publicClient || createPublicClient({
          chain: galileoTestnet,
          transport: http()
        });
        
        console.log('[DEBUG] Client created, chain:', client.chain);
        
        // Tworzenie kontraktu rejestru graduacji
        const graduationRegistry = getContract({
          address: registryAddress,
          abi: GRADUATION_REGISTRY_ABI,
          publicClient: client,
        });
        
        console.log('[DEBUG] Graduation registry contract created');
        
        // Pobierz adresy graduowanych tokenów
        console.log('[DEBUG] Calling getGraduatedTokens...');
        const tokenAddresses = await client.readContract({
          address: registryAddress,
          abi: GRADUATION_REGISTRY_ABI,
          functionName: 'getGraduatedTokens',
        });
        
        console.log('[DEBUG] Received graduated tokens:', tokenAddresses);
        
        if (isTestMode()) {
          console.log('Graduated tokens:', tokenAddresses);
        }
        
        if (!tokenAddresses || tokenAddresses.length === 0) {
          console.log('[DEBUG] No graduated tokens found');
          setTokens([]);
          setLoading(false);
          return;
        }
        
        console.log(`[DEBUG] Processing ${tokenAddresses.length} tokens`);
        
        // Dla każdego tokenu pobierz szczegóły
        const tokenDetails = await Promise.all(
          tokenAddresses.map(async (tokenAddress, index) => {
            try {
              console.log(`[DEBUG] Processing token ${index + 1}/${tokenAddresses.length}: ${tokenAddress}`);
              
              // Pobierz adres pary swap
              console.log(`[DEBUG] Getting pair address for token ${tokenAddress}`);
              const pairAddress = await client.readContract({
                address: registryAddress,
                abi: GRADUATION_REGISTRY_ABI,
                functionName: 'getTokenPair',
                args: [tokenAddress],
              });
              
              console.log(`[DEBUG] Pair address: ${pairAddress}`);
              
              // Pobierz podstawowe informacje o tokenie
              console.log(`[DEBUG] Fetching token metadata`);
              const [name, symbol, decimals] = await Promise.all([
                client.readContract({
                  address: tokenAddress,
                  abi: ERC20_ABI,
                  functionName: 'name',
                }),
                client.readContract({
                  address: tokenAddress,
                  abi: ERC20_ABI,
                  functionName: 'symbol',
                }),
                client.readContract({
                  address: tokenAddress,
                  abi: ERC20_ABI,
                  functionName: 'decimals',
                }),
              ]);
              
              console.log(`[DEBUG] Token metadata: name=${name}, symbol=${symbol}, decimals=${decimals}`);
              
              // Pobierz rezerwy z pary
              console.log(`[DEBUG] Fetching reserves from pair ${pairAddress}`);
              const [reserves, token0Address] = await Promise.all([
                client.readContract({
                  address: pairAddress,
                  abi: LF0G_SWAP_PAIR_ABI,
                  functionName: 'getReserves',
                }),
                client.readContract({
                  address: pairAddress,
                  abi: LF0G_SWAP_PAIR_ABI,
                  functionName: 'token0',
                }),
              ]);
              
              console.log(`[DEBUG] Reserves:`, reserves);
              console.log(`[DEBUG] Token0Address: ${token0Address}`);
              
              // Determine which reserve corresponds to which token
              const isToken0 = token0Address.toLowerCase() === tokenAddress.toLowerCase();
              const tokenReserve = isToken0 ? reserves[0] : reserves[1];
              const usdtReserve = isToken0 ? reserves[1] : reserves[0];
              
              console.log(`[DEBUG] Is token0: ${isToken0}`);
              console.log(`[DEBUG] Token reserve: ${tokenReserve}`);
              console.log(`[DEBUG] USDT reserve: ${usdtReserve}`);
              
              // Calculate price - using safer approach for numerical operations
              const tokenReserveBigInt = BigInt(tokenReserve);
              const usdtReserveBigInt = BigInt(usdtReserve);
              
              // Simple price calculation: USDT/token ratio (with scaled precision)
              const SCALING_FACTOR = BigInt(10 ** 18);
              const priceScaled = tokenReserveBigInt > 0n 
                ? (usdtReserveBigInt * SCALING_FACTOR) / tokenReserveBigInt 
                : 0n;
              
              const tokenPrice = Number(priceScaled) / 10 ** 18;
              console.log(`[DEBUG] Calculated token price: ${tokenPrice}`);
              
              // Get user balance if wallet is connected
              let userBalance = '0';
              let rawBalance = 0n;
              
              if (userAddress) {
                console.log(`[DEBUG] Fetching user balance for address ${userAddress}`);
                rawBalance = await client.readContract({
                  address: tokenAddress,
                  abi: ERC20_ABI,
                  functionName: 'balanceOf',
                  args: [userAddress],
                });
                
                // Format balance as string with appropriate decimal places
                userBalance = (Number(rawBalance) / 10 ** Number(decimals)).toString();
                console.log(`[DEBUG] User balance: ${userBalance} ${symbol}`);
              }
              
              console.log(`[DEBUG] Token ${tokenAddress} processing complete`);
              return {
                address: tokenAddress,
                pairAddress,
                name,
                symbol,
                decimals,
                tokenReserve: (Number(tokenReserve) / 10 ** Number(decimals)).toString(),
                usdtReserve: (Number(usdtReserve) / 10 ** 18).toString(), // USDT ma 18 decimals na 0G
                price: tokenPrice,
                userBalance,
                rawBalance,
                logo: `/api/placeholder/30/30` // Placeholder logo URL
              };
            } catch (err) {
              console.error(`[DEBUG] Error fetching details for token ${tokenAddress}:`, err);
              return null;
            }
          })
        );
        
        // Filtruj tokeny, które nie udało się załadować
        let validTokens = tokenDetails.filter(token => token !== null);
        
        // -------------------------------------------------------------------
        // ZAWSZE dołącz USDT do listy tokenów, jeśli jeszcze go nie ma
        // -------------------------------------------------------------------
        const hasUsdt = validTokens.some(t => t.symbol === 'USDT');
        if (!hasUsdt) {
          try {
            console.log('[DEBUG] USDT not in graduated list – fetching metadata');
            // Pobierz metadane USDT z łańcucha
            const [name, symbol, decimals] = await Promise.all([
              client.readContract({
                address: usdtAddress,
                abi: ERC20_ABI,
                functionName: 'name',
              }),
              client.readContract({
                address: usdtAddress,
                abi: ERC20_ABI,
                functionName: 'symbol',
              }),
              client.readContract({
                address: usdtAddress,
                abi: ERC20_ABI,
                functionName: 'decimals',
              }),
            ]);

            // Zawsze pobierz balans USDT, niezależnie od innych tokenów
            let userBalance = '0';
            let rawBalance = 0n;
            if (userAddress) {
              rawBalance = await client.readContract({
                address: usdtAddress,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [userAddress],
              });
              userBalance = (Number(rawBalance) / 10 ** Number(decimals)).toString();
              console.log(`[DEBUG] USDT balance: ${userBalance}`);
            }

            const usdtTokenObj = {
              address: usdtAddress,
              pairAddress: null,
              name,
              symbol,
              decimals,
              tokenReserve: '0',
              usdtReserve: '0',
              price: 1, // Zakładamy cenę referencyjną 1
              userBalance,
              rawBalance,
              logo: `/api/placeholder/30/30`,
            };
            
            // Dodaj USDT na początek listy (łatwiejszy wybór w UI)
            validTokens = [usdtTokenObj, ...validTokens];
          } catch (metaErr) {
            console.error('[DEBUG] Error fetching USDT metadata:', metaErr);
          }
        } else {
          // Jeśli USDT jest już na liście, upewnij się, że ma aktualny balans
          if (userAddress) {
            try {
              const usdtToken = validTokens.find(t => t.symbol === 'USDT');
              if (usdtToken) {
                const decimals = usdtToken.decimals;
                const rawBalance = await client.readContract({
                  address: usdtAddress,
                  abi: ERC20_ABI,
                  functionName: 'balanceOf',
                  args: [userAddress],
                });
                const userBalance = (Number(rawBalance) / 10 ** Number(decimals)).toString();
                console.log(`[DEBUG] Updated USDT balance: ${userBalance}`);
                
                // Aktualizuj token USDT na liście
                usdtToken.userBalance = userBalance;
                usdtToken.rawBalance = rawBalance;
              }
            } catch (err) {
              console.error('[DEBUG] Error updating USDT balance:', err);
            }
          }
        }
        
        console.log(`[DEBUG] Processed ${validTokens.length} valid tokens out of ${tokenAddresses.length} total`);
        console.log('[DEBUG] Token data:', validTokens);
        
        setTokens(validTokens);
      } catch (err) {
        console.error('[DEBUG] Error in fetchGraduatedTokens:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log('[DEBUG] Token fetch process completed');
      }
    };
    
    console.log('[DEBUG] Triggering fetchGraduatedTokens');
    fetchGraduatedTokens();
  }, [publicClient, registryAddress, userAddress]);
  
  return { tokens, loading, error, refreshTokenBalances };
}; 