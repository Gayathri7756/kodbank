const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token exists in usertoken table
    const [result] = await pool.query(
      'SELECT * FROM usertoken WHERE token = ? AND uid = ?',
      [token, decoded.uid]
    );

    if (result.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if token is expired
    const tokenData = result[0];
    if (new Date() > new Date(tokenData.expiry)) {
      return res.status(401).json({ message: 'Token expired' });
    }

    // Attach user data to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = verifyToken;
