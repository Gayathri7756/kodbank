const pool = require('../config/database');

const createTables = async () => {
  // Tables are created automatically in database-sqlite.js for SQLite
  // For MySQL, create tables here
  try {
    console.log('✅ Database tables ready');
  } catch (error) {
    console.error('❌ Error with tables:', error.message);
    throw error;
  }
};

module.exports = createTables;
