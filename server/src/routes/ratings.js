const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

// Dodaj lub zaktualizuj ocenę
router.post('/', ratingController.addRating);

// Pobierz ocenę użytkownika dla danej puli
router.get('/user/:poolId/:walletAddress', ratingController.getUserRating);

// Pobierz średnią ocenę dla puli
router.get('/average/:poolId', ratingController.getAverageRating);

// Pobierz rozkład ocen dla puli
router.get('/distribution/:poolId', ratingController.getRatingDistribution);

module.exports = router; 