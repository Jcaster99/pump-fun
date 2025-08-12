/**
 * Niestandardowy provider dla wagmi integrujący się z naszym systemem zarządzania RPC
 */

import { http } from 'viem';
import rpcManager from './rpcManager';

// Tworzenie niestandardowego transportu HTTP używającego naszego menedżera RPC
export const createCustomTransport = () => {
  // Bazowy URL (będzie dynamicznie zmieniany przez menedżer RPC)
  let currentRpcUrl = rpcManager.selectBestRpc();
  
  // Utwórz transport z niestandardowymi handlerami zdarzeń
  return http(currentRpcUrl, {
    // Większy timeout dla początkowo wolnych sieci
    timeout: 10000,
    
    // Wywołane przed każdym żądaniem - może dynamicznie zmienić URL
    fetchOptions: () => {
      // Wybierz najlepszy dostępny RPC dla tego żądania
      currentRpcUrl = rpcManager.selectBestRpc();
      
      return {
        url: currentRpcUrl
      };
    },
    
    // Obsługa odpowiedzi - raportowanie metryk do menedżera RPC
    onResponse: async (response) => {
      if (response.status >= 200 && response.status < 300) {
        // Raportuj sukces dla obecnego URL (czas odpowiedzi w ms)
        const responseTime = Date.now() - response.meta?.requestStart || 0;
        rpcManager.reportSuccess(currentRpcUrl, responseTime);
      } else {
        // Raportuj błąd dla obecnego URL
        rpcManager.reportFailure(currentRpcUrl);
      }
      
      return response;
    },
    
    // Obsługa błędów - raportowanie do menedżera RPC
    onError: async (error) => {
      rpcManager.reportFailure(currentRpcUrl);
      throw error;
    }
  });
};

// Funkcja pomocnicza do bezpośredniego wykonywania żądań RPC
export const executeRpcRequest = async (method, params, options = {}) => {
  return rpcManager.executeRequest(method, params, options);
};

// Funkcja tworząca konfigurację dla createConfig wagmi
export const getCustomProviderConfig = (chain) => {
  return {
    chain,
    transport: createCustomTransport()
  };
};

export default createCustomTransport; 