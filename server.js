const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const createTables = require('./config/initDb');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: `http://localhost:${PORT}`,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await createTables();
    app.listen(PORT, () => {
      console.log('✅ Server started successfully!');
      console.log(`🌐 Open your browser: http://localhost:${PORT}`);
      console.log('📊 Database: Connected');
      console.log('🔐 JWT Authentication: Enabled');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
