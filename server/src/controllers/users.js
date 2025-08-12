const UserModel = require('../models/user');
const { generateToken } = require('../middleware/auth');
const ethers = require('ethers');

// Authentication message in English
const AUTH_MESSAGE_PREFIX = "I am signing this message to verify my wallet address ";
const AUTH_MESSAGE_SUFFIX = " on lf0g.fun";

const UserController = {
  // Rejestracja nowego użytkownika
  async register(req, res) {
    try {
      const { address, username, signature } = req.body;

      // Sprawdzamy wymagane pola
      if (!address || !username || !signature) {
        return res.status(400).json({ 
          success: false, 
          message: 'Address, username, and signature are required' 
        });
      }

      // Weryfikacja podpisu
      try {
        // Expected message format from client:
        // "I am signing this message to verify my wallet address ${address} and connect it with username: ${username} on lf0g.fun"
        const expectedMessage = `${AUTH_MESSAGE_PREFIX}${address} and connect it with username: ${username}${AUTH_MESSAGE_SUFFIX}`;
        
        // Verify the signature using the expected message
        const recoveredAddress = ethers.utils.verifyMessage(expectedMessage, signature);
        
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: 'Signature verification failed. Make sure you signed the correct message.'
          });
        }
      } catch (verifyError) {
        console.error('Signature verification error:', verifyError);
        return res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Sprawdzamy czy portfel już istnieje
      const walletExists = await UserModel.checkWalletExists(address);
      if (walletExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'This wallet address is already registered' 
        });
      }

      // Sprawdzamy czy nazwa użytkownika jest już zajęta
      const usernameExists = await UserModel.checkUsernameExists(username);
      if (usernameExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'This username is already taken' 
        });
      }

      // Tworzymy nowego użytkownika
      const userId = await UserModel.createUser(address, username, signature);

      // Pobieramy dane utworzonego użytkownika
      const userData = await UserModel.getUserByAddress(address);

      // Generujemy token JWT
      const token = generateToken(userData);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: userData.id,
          address: userData.address,
          username: userData.username,
          created_at: userData.created_at
        },
        token
      });
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Logowanie użytkownika
  async login(req, res) {
    try {
      const { address, signature } = req.body;

      // Sprawdzamy wymagane pola
      if (!address || !signature) {
        return res.status(400).json({ 
          success: false, 
          message: 'Wallet address and signature are required' 
        });
      }

      // Pobieramy dane użytkownika, aby uzyskać jego nazwę użytkownika
      const user = await UserModel.getUserByAddress(address);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found. Please register first.' 
        });
      }

      // Weryfikacja podpisu
      try {
        // For login, use the format with username from database
        const expectedMessage = `${AUTH_MESSAGE_PREFIX}${address} and connect it with username: ${user.username}${AUTH_MESSAGE_SUFFIX}`;
        
        // Verify the signature
        const recoveredAddress = ethers.utils.verifyMessage(expectedMessage, signature);
        
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: 'Signature verification failed'
          });
        }
      } catch (verifyError) {
        console.error('Signature verification error:', verifyError);
        return res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Aktualizujemy czas ostatniego logowania
      await UserModel.updateLastLogin(address);

      // Generujemy token JWT
      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          address: user.address,
          username: user.username,
          created_at: user.created_at
        },
        token
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Ponowne uwierzytelnienie użytkownika (wymagane co 7 dni)
  async reauth(req, res) {
    try {
      const { address, signature } = req.body;

      // Sprawdzamy wymagane pola
      if (!address || !signature) {
        return res.status(400).json({ 
          success: false, 
          message: 'Wallet address and signature are required' 
        });
      }

      // Pobieramy dane użytkownika, aby uzyskać jego nazwę użytkownika
      const user = await UserModel.getUserByAddress(address);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Weryfikacja podpisu
      try {
        // Wiadomość do podpisu powinna zawierać informację o ponownym uwierzytelnieniu
        const expectedMessage = `${AUTH_MESSAGE_PREFIX}${address} for periodic re-authentication${AUTH_MESSAGE_SUFFIX}`;
        
        // Weryfikacja podpisu
        const recoveredAddress = ethers.utils.verifyMessage(expectedMessage, signature);
        
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: 'Signature verification failed'
          });
        }
      } catch (verifyError) {
        console.error('Signature verification error:', verifyError);
        return res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Aktualizujemy czas ostatniego logowania
      await UserModel.updateLastLogin(address);

      // Generujemy nowy token JWT z aktualnym czasem uwierzytelnienia portfela
      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Re-authentication successful',
        data: {
          id: user.id,
          address: user.address,
          username: user.username,
          created_at: user.created_at
        },
        token
      });
    } catch (error) {
      console.error('Error during re-authentication:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Sprawdzenie czy portfel istnieje
  async checkWallet(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({ 
          success: false, 
          message: 'Wallet address is required' 
        });
      }

      const exists = await UserModel.checkWalletExists(address);
      if (exists) {
        const user = await UserModel.getUserByAddress(address);
        return res.status(200).json({
          success: true,
          exists: true,
          data: {
            username: user.username
          }
        });
      }

      return res.status(200).json({
        success: true,
        exists: false
      });
    } catch (error) {
      console.error('Error checking wallet:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = UserController; 