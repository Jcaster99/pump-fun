const Rating = require('../models/rating');
const Pool = require('../models/pool');
const ethers = require('ethers');

// Simple in-memory cache with expiration
const cache = {
  averageRatings: {},
  userRatings: {}
};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Clear expired cache entries
const cleanupCache = () => {
  const now = Date.now();
  Object.keys(cache.averageRatings).forEach(key => {
    if (cache.averageRatings[key].expiry < now) {
      delete cache.averageRatings[key];
    }
  });
  
  Object.keys(cache.userRatings).forEach(key => {
    if (cache.userRatings[key].expiry < now) {
      delete cache.userRatings[key];
    }
  });
};

// Run cache cleanup every minute
setInterval(cleanupCache, 60 * 1000);

// Weryfikuj podpis transakcji
const verifySignature = (walletAddress, message, signature) => {
  try {
    // Odzyskaj adres z podpisu
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    // Porównaj z adresem portfela (case-insensitive)
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

const ratingController = {
  // Dodaj lub zaktualizuj ocenę dla puli
  async addRating(req, res) {
    try {
      const { poolId, rating, signature } = req.body;
      
      // Wyciągnij adres z podpisu
      if (!poolId || !rating || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: poolId, rating, signature'
        });
      }
      
      // Walidacja oceny (1-5)
      const ratingValue = parseInt(rating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5'
        });
      }
      
      // Sprawdź, czy pula istnieje
      const pool = await Pool.getById(poolId);
      if (!pool) {
        return res.status(404).json({
          success: false,
          message: 'Pool not found'
        });
      }
      
      // Wiadomość do podpisania
      const message = `I am rating the pool ${pool.token_address} with ${ratingValue} stars.`;
      
      // Weryfikuj podpis i wyciągnij adres
      try {
        const walletAddress = ethers.utils.verifyMessage(message, signature);
        
        // Dodaj lub zaktualizuj ocenę
        const result = Rating.addOrUpdateRating(poolId, walletAddress, ratingValue, signature);
        
        // Pobierz zaktualizowane dane ocen
        const averageRating = Rating.getAverageRating(poolId);
        
        // Clear cache entries for this pool
        delete cache.averageRatings[poolId];
        delete cache.userRatings[`${poolId}:${walletAddress}`];
        
        res.status(200).json({
          success: true,
          message: result.updated ? 'Rating updated successfully' : 'Rating added successfully',
          data: {
            averageRating: averageRating.average,
            count: averageRating.count
          }
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }
    } catch (error) {
      console.error('Error adding rating:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  // Pobierz ocenę użytkownika dla danej puli
  async getUserRating(req, res) {
    try {
      const { poolId, walletAddress } = req.params;
      
      // Sprawdź, czy parametry są poprawne
      if (!poolId || !walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: poolId, walletAddress'
        });
      }
      
      // Check cache first
      const cacheKey = `${poolId}:${walletAddress}`;
      if (cache.userRatings[cacheKey] && cache.userRatings[cacheKey].expiry > Date.now()) {
        return res.status(200).json({
          success: true,
          data: { rating: cache.userRatings[cacheKey].value }
        });
      }
      
      // Pobierz ocenę użytkownika
      const rating = Rating.getUserRating(poolId, walletAddress);
      
      // Cache the result
      cache.userRatings[cacheKey] = {
        value: rating,
        expiry: Date.now() + CACHE_TTL
      };
      
      res.status(200).json({
        success: true,
        data: { rating }
      });
    } catch (error) {
      console.error('Error getting user rating:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  // Pobierz średnią ocenę dla puli
  async getAverageRating(req, res) {
    try {
      const { poolId } = req.params;
      
      // Sprawdź, czy parametry są poprawne
      if (!poolId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameter: poolId'
        });
      }
      
      // Check cache first
      if (cache.averageRatings[poolId] && cache.averageRatings[poolId].expiry > Date.now()) {
        return res.status(200).json({
          success: true,
          data: cache.averageRatings[poolId].value
        });
      }
      
      // Pobierz średnią ocenę
      const averageRating = Rating.getAverageRating(poolId);
      
      // Cache the result
      cache.averageRatings[poolId] = {
        value: averageRating,
        expiry: Date.now() + CACHE_TTL
      };
      
      res.status(200).json({
        success: true,
        data: averageRating
      });
    } catch (error) {
      console.error('Error getting average rating:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  // Pobierz rozkład ocen dla puli
  async getRatingDistribution(req, res) {
    try {
      const { poolId } = req.params;
      
      // Sprawdź, czy parametry są poprawne
      if (!poolId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameter: poolId'
        });
      }
      
      // Pobierz rozkład ocen
      const distribution = Rating.getRatingDistribution(poolId);
      
      res.status(200).json({
        success: true,
        data: { distribution }
      });
    } catch (error) {
      console.error('Error getting rating distribution:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = ratingController; 