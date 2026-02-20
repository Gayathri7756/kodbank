-- Kodbank Database Setup Script for Aiven MySQL
-- Run this script in your Aiven MySQL console

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS usertoken;
DROP TABLE IF EXISTS koduser;

-- Create koduser table
CREATE TABLE koduser (
  uid INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  balance DECIMAL(12,2) DEFAULT 100000.00,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create usertoken table
CREATE TABLE usertoken (
  tid INT PRIMARY KEY AUTO_INCREMENT,
  token TEXT NOT NULL,
  uid INT NOT NULL,
  expiry TIMESTAMP NOT NULL,
  FOREIGN KEY (uid) REFERENCES koduser(uid) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_uid ON usertoken(uid);
CREATE INDEX idx_expiry ON usertoken(expiry);

-- Verify tables created
SHOW TABLES;

-- Show table structures
DESCRIBE koduser;
DESCRIBE usertoken;

SELECT 'Database setup complete!' AS status;
