import { API_URL } from '../utils/apiConfig';

/**
 * Zapisuje transakcję swapu w bazie danych dla danej pooli
 * @param {Object} transaction - Dane transakcji
 * @param {string} transaction.contract_address - Adres kontraktu pooli
 * @param {string} transaction.wallet_address - Adres portfela
 * @param {string} transaction.tx_hash - Hash transakcji
 * @param {string} transaction.type - Typ transakcji ('buy' lub 'sell')
 * @param {number|string} [transaction.token_amount] - Ilość tokenów (dla buy lub sell)
 * @param {number|string} [transaction.usdt_amount] - Ilość USDT (dla buy lub sell)
 * @param {number} transaction.price_realtime - Cena tokena (realtime)
 * @param {number} [transaction.price] - Cena tokena (fallback)
 * @param {number} [transaction.slippage] - Wartość slippage w procentach
 * @param {number|string} [transaction.min_amount] - Minimalna ilość po uwzględnieniu slippage
 * @returns {Promise<Object>} - Odpowiedź z serwera
 */
export const savePoolTransaction = async (transaction) => {
  try {
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Transaction data to save:', JSON.stringify(transaction, null, 2));
    }
    
    // Konwersja wartości na stringi dla zachowania dokładnej precyzji
    const ensureString = (val) => {
      if (val === null || val === undefined) return null;
      return val.toString(); // Bezpośrednia konwersja na string bez formatowania
    };

    // Przygotowanie danych transakcji - wszystkie wartości liczbowe jako stringi
    const transactionData = {
      contract_address: transaction.contract_address,
      type: transaction.type || 'buy',
      tx_hash: transaction.tx_hash,
      wallet_address: transaction.wallet_address,
      token_amount: ensureString(transaction.token_amount),
      usdt_amount: ensureString(transaction.usdt_amount),
      min_amount: ensureString(transaction.min_amount),
      slippage: ensureString(transaction.slippage || '0.5'),
      price: ensureString(transaction.price_realtime || transaction.price || '0')
    };
    
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Sending transaction with exact string values:', transactionData);
    }
    
    // Wyślij dane do API
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });
    
    if (!response.ok) {
      console.error(`Error saving transaction: ${response.status} ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
      }
      return null;
    }
    
    const result = await response.json();
    if (process.env.REACT_APP_TEST === 'true') {
      console.log('Transaction saved successfully:', result);
    }
    return result;
  } catch (error) {
    console.error('Error saving pool transaction:', error);
    return null;
  }
};

/**
 * Pobiera historię transakcji dla określonego poola
 * @param {string} poolAddress - Adres kontraktu poola
 * @param {number} [limit=20] - Liczba transakcji do pobrania
 * @returns {Promise<Object>} - Odpowiedź z serwera zawierająca listę transakcji
 */
export const fetchPoolTransactions = async (poolAddress, limit = 20) => {
  try {
    const response = await fetch(`${API_URL}/transactions/pool/${poolAddress}?limit=${limit}`);
    
    if (!response.ok) {
      console.error(`Error fetching pool transactions: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: `Error fetching transactions: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pool transactions:', error);
    return {
      success: false,
      error: 'Failed to fetch transactions. Please try again later.'
    };
  }
}; 