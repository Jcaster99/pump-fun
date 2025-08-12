const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_token_change_in_production';

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      address: user.address, 
      username: user.username,
      last_wallet_auth: new Date().toISOString()
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided, authentication required' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    if (decoded.last_wallet_auth) {
      const lastAuthTime = new Date(decoded.last_wallet_auth).getTime();
      const currentTime = Date.now();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      
      if (currentTime - lastAuthTime > sevenDaysInMs) {
        return res.status(401).json({ 
          success: false, 
          message: 'Wallet re-authentication required',
          requiresWalletAuth: true 
        });
      }
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 