const { getDbConnection } = require('../db/init');
const { isValidContractAddress } = require('../utils/security');

/**
 * Pobierz historię cen dla tokenów w określonym przedziale czasowym
 * 
 * @param {string} poolAddress Adres tokenu puli
 * @param {string} timeRange Zakres czasowy ('15m', '4h', '24h', '30d', 'all')
 * @returns {Array} Tablica danych cenowych z timestampami
 */
const getPriceHistoryFromDb = async (poolAddress, timeRange = '30d') => {
  const db = getDbConnection();
  
  try {
    // Najpierw znajdź pool_id dla danego adresu tokenu
    const pool = db.prepare(`
      SELECT id FROM pools WHERE token_address = ?
    `).get(poolAddress);
    
    if (!pool) {
      return { data: [], error: 'Pool not found' };
    }
    
    const poolId = pool.id;
    
    // Zdefiniuj okres czasu na podstawie wybranego zakresu
    let timeConstraint;
    let intervalName;
    switch (timeRange) {
      case '15m':
        timeConstraint = "datetime('now', '-15 minutes')";
        intervalName = '15 minutes';
        break;
      case '4h':
        timeConstraint = "datetime('now', '-4 hours')";
        intervalName = '4 hours';
        break;
      case '24h':
        timeConstraint = "datetime('now', '-1 day')";
        intervalName = '24 hours';
        break;
      case '30d':
        timeConstraint = "datetime('now', '-30 days')";
        intervalName = '30 days';
        break;
      case 'all':
      default:
        timeConstraint = "datetime('now', '-1 year')"; // Pobieramy dane z ostatniego roku lub wszystkie dostępne
        intervalName = 'all time';
        break;
    }
    
    // Sprawdźmy najpierw czy mamy dane w tabeli price_history
    let pricePoints = db.prepare(`
      SELECT 
        timestamp as date, 
        price 
      FROM price_history 
      WHERE pool_id = ? AND timestamp >= ${timeConstraint}
      ORDER BY timestamp ASC
    `).all(poolId);
    
    // Jeśli nie ma danych w price_history, spróbujmy pobrać z tabeli transactions jako fallback
    if (!pricePoints || pricePoints.length === 0) {
      pricePoints = db.prepare(`
        SELECT 
          timestamp as date, 
          price 
        FROM transactions 
        WHERE pool_id = ? AND timestamp >= ${timeConstraint}
        ORDER BY timestamp ASC
      `).all(poolId);
      
      // Dodaj również aktualną cenę z tabeli pools jako ostatni punkt
      if (pricePoints && pricePoints.length > 0) {
        const currentPrice = db.prepare(`
          SELECT price_realtime FROM pools WHERE id = ?
        `).get(poolId);
        
        if (currentPrice) {
          pricePoints.push({
            date: new Date().toISOString(),
            price: currentPrice.price_realtime
          });
        }
      }
    }
    
    // Jeśli nadal brak danych, zwróć odpowiedni komunikat błędu dla danego interwału
    if (!pricePoints || pricePoints.length === 0) {
      return { 
        data: [], 
        error: `NO GRAVITY FOR THIS INTERVAL (${intervalName})` 
      };
    }
    
    return { data: pricePoints, error: null };
  } catch (error) {
    console.error('Error fetching price history:', error);
    return { data: [], error: 'Database error' };
  } finally {
    db.close();
  }
};

/**
 * Get price history for a pool
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPriceHistory = async (req, res) => {
  try {
    const { address } = req.params;
    const { timeRange } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Pool address is required'
      });
    }
    
    // Walidacja adresu kontraktu
    if (!isValidContractAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract address format'
      });
    }
    
    const { data, error } = await getPriceHistoryFromDb(address, timeRange);
    
    if (error) {
      return res.status(200).json({
        success: true,
        data: [],
        message: error
      });
    }
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getPriceHistory controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching price history'
    });
  }
};

module.exports = {
  getPriceHistory
}; 