# KodBank - Quick Setup Guide

## Step 1: Configure Your Aiven Database

1. Log in to your Aiven account
2. Get your PostgreSQL connection details:
   - Host
   - Port
   - Database name
   - Username
   - Password

## Step 2: Update Environment Variables

Open the `.env` file and replace the placeholder values:

```env
PORT=5000
DB_HOST=your-actual-aiven-host.aivencloud.com
DB_PORT=your-actual-port
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=your-actual-password
JWT_SECRET=change-this-to-a-random-secret-key
JWT_EXPIRES_IN=24h
```

## Step 3: Start the Application

```bash
npm start
```

You should see:
```
Database tables created successfully
Server running on http://localhost:5000
```

## Step 4: Test the Application

1. Open http://localhost:5000 in your browser
2. Register a new user (you'll get $100,000 initial balance)
3. Login with your credentials
4. Click "Check Balance" to see your balance with confetti animation!

## Troubleshooting

### Database Connection Issues
- Verify your Aiven credentials in `.env`
- Check if your IP is whitelisted in Aiven console
- Ensure SSL is enabled (already configured in code)

### Port Already in Use
- Change PORT in `.env` to another port (e.g., 5001)

### Token Issues
- Clear browser cookies
- Make sure JWT_SECRET is set in `.env`

## Application Flow

1. **Register** → User data saved to `kodusers` table with $100,000 balance
2. **Login** → JWT token generated and stored in `cjwt` table + cookie
3. **Dashboard** → Protected route, requires valid JWT token
4. **Check Balance** → Token verified, balance fetched from database
5. **Logout** → Token removed from database and cookie cleared

## Database Tables Created Automatically

The application creates these tables on first run:
- `kodusers` - Stores user information and balance
- `cjwt` - Stores JWT tokens for validation

Enjoy using KodBank! 🎉
