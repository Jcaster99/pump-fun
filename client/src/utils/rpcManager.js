/**
 * RPC Manager - zarządzanie wieloma endpointami RPC z inteligentnym routingiem 
 * i monitorowaniem wydajności.
 */

class RpcManager {
  constructor(rpcUrls = []) {
    // Lista dostępnych URL RPC
    this.rpcUrls = rpcUrls;
    
    // Metryki wydajności dla każdego RPC
    this.metrics = {};
    
    // Inicjalizacja metryk dla każdego URL
    this.rpcUrls.forEach(url => {
      this.metrics[url] = {
        successCount: 0,
        failureCount: 0, 
        totalResponseTime: 0,
        lastResponseTime: 0,
        avgResponseTime: 0,
        lastUsed: 0,
        consecutiveFailures: 0,
        available: true
      };
    });
    
    // Cache ostatnich wyników
    this.cache = new Map();
    this.cacheTTL = 30000; // 30 sekund ważności cache
    
    // Wewnętrzny licznik dla balansowania obciążenia
    this.roundRobinIndex = 0;
    
    console.log(`RPC Manager initialized with ${rpcUrls.length} endpoints`);
  }

  // Wyczyść metryki dla wszystkich endpointów
  resetMetrics() {
    Object.keys(this.metrics).forEach(url => {
      this.metrics[url] = {
        successCount: 0,
        failureCount: 0,
        totalResponseTime: 0,
        lastResponseTime: 0, 
        avgResponseTime: 0,
        lastUsed: 0,
        consecutiveFailures: 0,
        available: true
      };
    });
  }

  // Wybierz najlepszy RPC na podstawie metryk
  selectBestRpc() {
    // Filtruj tylko dostępne RPC
    const availableRpcs = this.rpcUrls.filter(url => this.metrics[url].available);
    
    if (availableRpcs.length === 0) {
      console.warn("All RPCs marked as unavailable, resetting status");
      this.rpcUrls.forEach(url => this.metrics[url].available = true);
      return this.rpcUrls[0]; // Użyj pierwszego jako fallback
    }
    
    // Strategie wyboru:
    
    // 1. Jeśli jakiś RPC nie był jeszcze używany, wybierz go
    const unusedRpcs = availableRpcs.filter(url => 
      this.metrics[url].successCount === 0 && this.metrics[url].failureCount === 0
    );
    if (unusedRpcs.length > 0) {
      return unusedRpcs[0];
    }
    
    // 2. Wybierz RPC z najlepszym współczynnikiem sukcesu i najniższym czasem odpowiedzi
    return availableRpcs
      .filter(url => {
        const m = this.metrics[url];
        const total = m.successCount + m.failureCount;
        // Musi mieć jakieś sukcesy i współczynnik sukcesu powyżej 70%
        return m.successCount > 0 && total > 0 && (m.successCount / total) > 0.7;
      })
      .sort((a, b) => {
        const metricsA = this.metrics[a];
        const metricsB = this.metrics[b];
        
        // Sortuj najpierw po średnim czasie odpowiedzi
        return metricsA.avgResponseTime - metricsB.avgResponseTime;
      })[0] || this.getRpcWithRoundRobin(); // Fallback do round robin
  }

  // Prosta strategia round-robin
  getRpcWithRoundRobin() {
    const availableRpcs = this.rpcUrls.filter(url => this.metrics[url].available);
    
    if (availableRpcs.length === 0) {
      // Resetuj status dostępności jeśli wszystkie niedostępne
      this.rpcUrls.forEach(url => this.metrics[url].available = true);
      this.roundRobinIndex = 0;
      return this.rpcUrls[0];
    }
    
    this.roundRobinIndex = (this.roundRobinIndex + 1) % availableRpcs.length;
    return availableRpcs[this.roundRobinIndex];
  }

  // Wybierz kilka najlepszych RPC do zapytań równoległych
  selectTopRpcs(count = 3) {
    const availableRpcs = this.rpcUrls.filter(url => this.metrics[url].available);
    
    if (availableRpcs.length <= count) {
      return availableRpcs;
    }
    
    // Sortuj po współczynniku sukcesu i czasie odpowiedzi
    return availableRpcs
      .sort((a, b) => {
        const metricsA = this.metrics[a];
        const metricsB = this.metrics[b];
        
        const successRateA = metricsA.successCount / (metricsA.successCount + metricsA.failureCount || 1);
        const successRateB = metricsB.successCount / (metricsB.successCount + metricsB.failureCount || 1);
        
        // Najpierw po współczynniku sukcesu, potem po czasie odpowiedzi
        if (Math.abs(successRateA - successRateB) > 0.1) {
          return successRateB - successRateA;
        }
        
        return metricsA.avgResponseTime - metricsB.avgResponseTime;
      })
      .slice(0, count);
  }

  // Raportuj sukces dla danego RPC
  reportSuccess(rpcUrl, responseTime) {
    if (!this.metrics[rpcUrl]) return;
    
    const metrics = this.metrics[rpcUrl];
    metrics.successCount++;
    metrics.consecutiveFailures = 0;
    metrics.lastResponseTime = responseTime;
    metrics.totalResponseTime += responseTime;
    metrics.avgResponseTime = metrics.totalResponseTime / metrics.successCount;
    metrics.lastUsed = Date.now();
    metrics.available = true;
  }

  // Raportuj błąd dla danego RPC
  reportFailure(rpcUrl) {
    if (!this.metrics[rpcUrl]) return;
    
    const metrics = this.metrics[rpcUrl];
    metrics.failureCount++;
    metrics.consecutiveFailures++;
    metrics.lastUsed = Date.now();
    
    // Oznacz jako niedostępny po 3 kolejnych błędach
    if (metrics.consecutiveFailures >= 3) {
      console.warn(`RPC ${rpcUrl} marked as unavailable after ${metrics.consecutiveFailures} consecutive failures`);
      metrics.available = false;
      
      // Uruchom timer, który przywróci dostępność po 30 sekundach
      setTimeout(() => {
        console.log(`RPC ${rpcUrl} availability reset after timeout`);
        metrics.available = true;
        metrics.consecutiveFailures = 0;
      }, 30000);
    }
  }

  // Uzyskaj klucz cache dla danego zapytania
  getCacheKey(methodName, params) {
    return `${methodName}:${JSON.stringify(params)}`;
  }

  // Sprawdź czy wynik jest w cache
  getFromCache(methodName, params) {
    const key = this.getCacheKey(methodName, params);
    
    if (this.cache.has(key)) {
      const {value, timestamp} = this.cache.get(key);
      // Sprawdź czy cache jest jeszcze ważny
      if (Date.now() - timestamp < this.cacheTTL) {
        return value;
      } else {
        // Usuń przeterminowane wpisy
        this.cache.delete(key);
      }
    }
    
    return null;
  }

  // Zapisz wynik do cache
  saveToCache(methodName, params, value) {
    const key = this.getCacheKey(methodName, params);
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Zarządzanie wielkością cache - usuń najstarsze wpisy gdy przekroczy 100
    if (this.cache.size > 100) {
      const oldestKey = [...this.cache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  // Wykonanie zapytania z automatycznym zarządzaniem endpointami
  async executeRequest(methodName, params, options = {}) {
    const {
      timeout = 5000,
      parallelRequests = false,
      parallelCount = 2,
      useCache = true,
      cacheTTL = this.cacheTTL
    } = options;
    
    // Sprawdź cache jeśli włączony
    if (useCache) {
      const cachedResult = this.getFromCache(methodName, params);
      if (cachedResult) {
        console.log(`Cache hit for ${methodName}`);
        return cachedResult;
      }
    }
    
    // Zapytanie do pojedynczego RPC z timeout
    const queryRpc = async (rpcUrl) => {
      const startTime = Date.now();
      
      try {
        const response = await Promise.race([
          fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: methodName,
              params: params,
              id: Date.now()
            })
          }).then(res => res.json()),
          
          // Timeout promise
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`RPC timeout after ${timeout}ms`)), timeout)
          )
        ]);
        
        const elapsedTime = Date.now() - startTime;
        
        if (response.error) {
          console.warn(`RPC error from ${rpcUrl}:`, response.error);
          this.reportFailure(rpcUrl);
          throw new Error(response.error.message);
        }
        
        // Raportuj sukces wraz z czasem odpowiedzi
        this.reportSuccess(rpcUrl, elapsedTime);
        
        // Zapisz do cache
        if (useCache) {
          this.saveToCache(methodName, params, response.result);
        }
        
        return response.result;
      } catch (error) {
        this.reportFailure(rpcUrl);
        throw error;
      }
    };
    
    // Tryb równoległy - wysyła zapytania do kilku RPC jednocześnie i zwraca pierwszy sukces
    if (parallelRequests) {
      const selectedRpcs = this.selectTopRpcs(parallelCount);
      
      return Promise.any(
        selectedRpcs.map(rpcUrl => queryRpc(rpcUrl))
      ).catch(errors => {
        console.error('All parallel RPC requests failed:', errors);
        throw new Error('All RPC endpoints failed');
      });
    }
    
    // Tryb sekwencyjny z ponownymi próbami
    let lastError;
    let attemptsLeft = 3;
    
    while (attemptsLeft > 0) {
      // Wybierz najlepszy RPC dla tego zapytania
      const selectedRpc = this.selectBestRpc();
      
      try {
        const result = await queryRpc(selectedRpc);
        return result;
      } catch (error) {
        lastError = error;
        attemptsLeft--;
        
        if (attemptsLeft > 0) {
          // Poczekaj przed kolejną próbą
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    throw lastError || new Error('RPC request failed after retries');
  }
}

// Utwórz i wyeksportuj instancję z URL z .env
const rpcUrls = [
  process.env.REACT_APP_RPC_URL,
  process.env.REACT_APP_RPC_URL1,
  process.env.REACT_APP_RPC_URL2,
  process.env.REACT_APP_RPC_URL3,
  process.env.REACT_APP_RPC_URL4,
  process.env.REACT_APP_RPC_URL5,
  process.env.REACT_APP_RPC_URL6,
].filter(Boolean); // Tylko niepuste URL

export const rpcManager = new RpcManager(rpcUrls);

export default rpcManager; 