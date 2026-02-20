const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const router = express.Router();

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone validation regex (10 digits, optional country code)
const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;

    // Validate input
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, password, and email are required' });
    }

    // Validate username format (3-50 chars, alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return res.status(400).json({ message: 'Username must be 3-50 alphanumeric characters' });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate phone format if provided
    if (phone && phone.trim() !== '') {
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit phone number' });
      }
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const [existingUser] = await pool.query(
      'SELECT * FROM koduser WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user with default balance 100000.00 and role 'customer'
    const phoneValue = phone && phone.trim() !== '' ? phone : null;
    await pool.query(
      'INSERT INTO koduser (username, password, email, phone, role, balance) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, phoneValue, 'customer', 100000.00]
    );

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT uid, username, password, role FROM koduser WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    // Subject: username, Claim: role
    const token = jwt.sign(
      { 
        sub: user.username,    // Subject (username)
        uid: user.uid,         // User ID
        role: user.role        // Claim (role)
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const expiryString = expiresAt.toISOString();

    // Store token in usertoken table
    await pool.query(
      'INSERT INTO usertoken (token, uid, expiry) VALUES (?, ?, ?)',
      [token, user.uid, expiryString]
    );

    // Set cookie with HTTP-only flag
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    
    if (token) {
      // Delete token from usertoken table
      await pool.query('DELETE FROM usertoken WHERE token = ?', [token]);
    }
    
    res.clearCookie('auth_token');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
