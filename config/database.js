// Use SQLite for local development, MySQL for production
const USE_SQLITE = process.env.NODE_ENV !== 'production';

let pool;

if (USE_SQLITE) {
  console.log('🔄 Using SQLite database (local)');
  pool = require('./database-sqlite');
} else {
  console.log('🔄 Using MySQL database (Aiven - Production)');
  const mysql = require('mysql2/promise');
  require('dotenv').config();

  const connectionConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 30000
  };

  pool = mysql.createPool(connectionConfig);

  // Test connection
  pool.getConnection()
    .then(connection => {
      console.log('✅ MySQL connection successful');
      connection.release();
    })
    .catch(err => {
      console.error('❌ MySQL connection failed:', err.message);
    });
}

module.exports = pool;
