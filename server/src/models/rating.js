const { getDbConnection } = require('../db/init');

class Rating {
  // Dodaj ocenę do puli przez użytkownika
  static addOrUpdateRating(poolId, walletAddress, rating, signature) {
    const db = getDbConnection();
    
    try {
      // Najpierw sprawdzamy, czy użytkownik już oceniał tę pulę
      const existingRating = db.prepare(
        'SELECT id FROM pool_ratings WHERE pool_id = ? AND wallet_address = ?'
      ).get(poolId, walletAddress);
      
      if (existingRating) {
        // Aktualizuj istniejącą ocenę
        db.prepare(`
          UPDATE pool_ratings 
          SET rating = ?, signature = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE pool_id = ? AND wallet_address = ?
        `).run(rating, signature, poolId, walletAddress);
        
        return { success: true, updated: true };
      } else {
        // Dodaj nową ocenę
        db.prepare(`
          INSERT INTO pool_ratings (pool_id, wallet_address, rating, signature)
          VALUES (?, ?, ?, ?)
        `).run(poolId, walletAddress, rating, signature);
        
        return { success: true, updated: false };
      }
    } catch (error) {
      console.error('Error adding/updating rating:', error);
      throw error;
    } finally {
      db.close();
    }
  }
  
  // Pobierz ocenę użytkownika dla danej puli
  static getUserRating(poolId, walletAddress) {
    const db = getDbConnection();
    
    try {
      const rating = db.prepare(
        'SELECT rating FROM pool_ratings WHERE pool_id = ? AND wallet_address = ?'
      ).get(poolId, walletAddress);
      
      return rating ? rating.rating : null;
    } catch (error) {
      console.error('Error getting user rating:', error);
      throw error;
    } finally {
      db.close();
    }
  }
  
  // Oblicz średnią ocenę dla puli
  static getAverageRating(poolId) {
    const db = getDbConnection();
    
    try {
      const result = db.prepare(
        'SELECT AVG(rating) as average, COUNT(id) as count FROM pool_ratings WHERE pool_id = ?'
      ).get(poolId);
      
      return {
        average: result.average ? parseFloat(result.average.toFixed(1)) : 0,
        count: result.count || 0
      };
    } catch (error) {
      console.error('Error calculating average rating:', error);
      throw error;
    } finally {
      db.close();
    }
  }
  
  // Pobierz rozkład ocen (ile ocen jakiego typu)
  static getRatingDistribution(poolId) {
    const db = getDbConnection();
    
    try {
      const distribution = {};
      
      // Inicjalizacja wszystkich możliwych ocen od 1 do 5
      for (let i = 1; i <= 5; i++) {
        distribution[i] = 0;
      }
      
      // Pobierz liczbę ocen dla każdej wartości
      const results = db.prepare(
        'SELECT rating, COUNT(id) as count FROM pool_ratings WHERE pool_id = ? GROUP BY rating'
      ).all(poolId);
      
      // Uzupełnij dystrybucję
      results.forEach(row => {
        distribution[row.rating] = row.count;
      });
      
      return distribution;
    } catch (error) {
      console.error('Error getting rating distribution:', error);
      throw error;
    } finally {
      db.close();
    }
  }
}

module.exports = Rating; 