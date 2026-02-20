# Kodbank - Vercel Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
1. Aiven MySQL database (required for production)
2. Vercel account
3. GitHub repository

### Step 1: Configure Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

```
DB_HOST=your-aiven-mysql-host.aivencloud.com
DB_PORT=24489
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=your-aiven-password-here
JWT_SECRET=kodbank-super-secret-jwt-key-2024-production-256-bit-secure
NODE_ENV=production
```

**Important:** Replace the values with your actual Aiven MySQL credentials from your Aiven console.

### Step 2: Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Step 3: Initialize Database Tables

After first deployment, you need to create the tables in your Aiven MySQL database.

Run these SQL commands in your Aiven console:

```sql
CREATE TABLE IF NOT EXISTS koduser (
  uid INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  balance DECIMAL(12,2) DEFAULT 100000.00,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usertoken (
  tid INT PRIMARY KEY AUTO_INCREMENT,
  token TEXT NOT NULL,
  uid INT NOT NULL,
  expiry TIMESTAMP NOT NULL,
  FOREIGN KEY (uid) REFERENCES koduser(uid) ON DELETE CASCADE
);

CREATE INDEX idx_uid ON usertoken(uid);
CREATE INDEX idx_expiry ON usertoken(expiry);
```

### Important Notes

1. **SQLite doesn't work on Vercel** - The app automatically switches to MySQL in production
2. **Environment variables** - Must be set in Vercel dashboard
3. **Database** - Must use Aiven MySQL (or any external MySQL)
4. **Cookies** - Vercel handles cookies correctly with the current configuration

### Troubleshooting

**Network Error after deployment:**
- Check that all environment variables are set in Vercel
- Verify Aiven MySQL is accessible (whitelist Vercel IPs or use 0.0.0.0/0)
- Check Vercel function logs for errors

**Database Connection Issues:**
- Verify DB credentials in Vercel environment variables
- Check Aiven service is running
- Ensure IP whitelist includes Vercel's IPs

### Testing

After deployment:
1. Visit your Vercel URL
2. Register a new account
3. Login
4. Check balance

The application should work exactly like localhost!
