const Database = require('better-sqlite3');
const path = require('path');

// Create SQLite database
const db = new Database(path.join(__dirname, '..', 'kodbank.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS koduser (
    uid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance REAL DEFAULT 100000.00,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usertoken (
    tid INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    uid INTEGER NOT NULL,
    expiry DATETIME NOT NULL,
    FOREIGN KEY (uid) REFERENCES koduser(uid) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_uid ON usertoken(uid);
  CREATE INDEX IF NOT EXISTS idx_expiry ON usertoken(expiry);
`);

console.log('✅ SQLite database initialized');
console.log('📁 Database file: kodbank.db');

// Wrapper to make it work like mysql2/promise
const pool = {
  async query(sql, params = []) {
    try {
      // Convert MySQL ? placeholders to SQLite format
      const sqliteSql = sql;
      
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(sqliteSql);
        const rows = stmt.all(...params);
        return [rows];
      } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const stmt = db.prepare(sqliteSql);
        const result = stmt.run(...params);
        return [{ insertId: result.lastInsertRowID, affectedRows: result.changes }];
      } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
        const stmt = db.prepare(sqliteSql);
        const result = stmt.run(...params);
        return [{ affectedRows: result.changes }];
      } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
        const stmt = db.prepare(sqliteSql);
        const result = stmt.run(...params);
        return [{ affectedRows: result.changes }];
      } else {
        // For other queries (CREATE, DROP, etc.)
        db.exec(sqliteSql);
        return [{ affectedRows: 0 }];
      }
    } catch (error) {
      console.error('Database query error:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }
};

module.exports = pool;
