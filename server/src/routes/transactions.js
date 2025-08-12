const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');

// GET /api/transactions/latest - Get the latest transaction
router.get('/latest', transactionsController.getLatestTransaction);

// GET /api/transactions/pool/:address - Get transactions for a specific pool
router.get('/pool/:address', transactionsController.getPoolTransactions);

// POST /api/transactions - Record a new transaction
router.post('/', transactionsController.recordTransaction);

module.exports = router; 