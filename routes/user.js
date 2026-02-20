const express = require('express');
const pool = require('../config/database');
const verifyToken = require('../middleware/auth');
const router = express.Router();

// Get balance endpoint (protected)
router.get('/balance', verifyToken, async (req, res) => {
  try {
    // Extract username from JWT token (subject)
    const username = req.user.sub;

    // Fetch balance from koduser table using username
    const [result] = await pool.query(
      'SELECT balance FROM koduser WHERE username = ?',
      [username]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balance = result[0].balance;

    res.json({ 
      success: true,
      balance: parseFloat(balance) 
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
