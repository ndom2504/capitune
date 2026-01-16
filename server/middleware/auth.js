const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user
    const user = User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };
