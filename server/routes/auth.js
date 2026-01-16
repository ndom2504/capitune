const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET is set
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  if (process.env.NODE_ENV === 'production') {
    console.error('Application cannot start in production without JWT_SECRET.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET not set. Using insecure default for development ONLY.');
  }
}

const ACTUAL_JWT_SECRET = JWT_SECRET || 'dev-secret-DO-NOT-USE-IN-PRODUCTION';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, bio, level } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email, and password' });
    }

    // Check if user exists
    if (User.findByEmail(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    if (User.findByUsername(username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = User.create({
      username,
      email,
      password: hashedPassword,
      bio: bio || '',
      level: level || 'beginner'
    });

    // Create token
    const token = jwt.sign({ userId: user.id }, ACTUAL_JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ userId: user.id }, ACTUAL_JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
