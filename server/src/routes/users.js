const express = require('express');
const UserController = require('../controllers/users');

const router = express.Router();

// Rejestracja nowego użytkownika
router.post('/register', UserController.register);

// Logowanie użytkownika
router.post('/login', UserController.login);

// Ponowne uwierzytelnienie użytkownika (co 7 dni)
router.post('/reauth', UserController.reauth);

// Sprawdzenie czy portfel istnieje
router.get('/check/:address', UserController.checkWallet);

module.exports = router; 