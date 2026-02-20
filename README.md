# Kodbank Application

A secure banking application with user registration, JWT authentication, and balance checking features.

## Features

- User Registration with initial balance of $100,000
- Secure login with JWT token authentication (username as subject, role as claim)
- Token stored in database (`usertoken` table) and as HTTP-only cookie
- Protected dashboard with balance checking
- Balance fetched from `koduser` table using username from JWT
- Animated confetti celebration when checking balance
- Logout functionality

## Database Schema

### Table 1: `koduser`
- uid (Primary Key, Auto Increment)
- username (Unique)
- email (Unique)
- password (Hashed with bcrypt)
- balance (Default: 100000.00)
- phone
- role (Default: 'customer')
- created_at

### Table 2: `usertoken`
- tid (Primary Key, Auto Increment)
- token (JWT token string)
- uid (Foreign Key → koduser.uid)
- expiry (Token expiration timestamp)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Edit the `.env` file with your Aiven MySQL credentials:
```
DB_HOST=your-aiven-mysql-host.aivencloud.com
DB_PORT=3306
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key-256-bit-minimum
```

### 3. Start the Server
```bash
npm start
```

The application will:
- Create database tables automatically (`koduser` and `usertoken`)
- Start the server on http://localhost:5000

### 4. Access the Application
Open your browser and navigate to: http://localhost:5000

## Application Flow

### 1. Registration
- User provides: username, email, password, phone (optional)
- Role is automatically set to 'customer'
- Initial balance of $100,000 is assigned
- User is redirected to login page

### 2. Login
- User enters username and password
- Backend validates credentials
- JWT token generated with:
  - Subject (sub): username
  - Claim: role
  - Algorithm: HS256
  - Expiry: 24 hours
- Token stored in `usertoken` table
- Token set as HTTP-only cookie
- User redirected to dashboard

### 3. Dashboard
- Protected route (requires valid JWT)
- Displays "Check Balance" button
- Logout button available

### 4. Check Balance
- User clicks "Check Balance"
- Request includes JWT cookie
- Backend verifies token:
  - Validates signature
  - Checks token in database
  - Verifies expiration
- Username extracted from JWT (subject)
- Balance fetched from `koduser` table
- Balance displayed: "Your balance is: $100,000.00"
- Party popper confetti animation plays

### 5. Logout
- Token removed from `usertoken` table
- Cookie cleared
- User redirected to login

## API Endpoints

### POST /api/auth/register
Register a new user
```json
{
  "username": "john",
  "password": "password123",
  "email": "john@example.com",
  "phone": "1234567890"
}
```

### POST /api/auth/login
Login with credentials
```json
{
  "username": "john",
  "password": "password123"
}
```

### GET /api/user/balance
Get user balance (requires authentication)

### POST /api/auth/logout
Logout and clear token

## Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 24-hour expiration
- HTTP-only cookies (prevent XSS)
- SameSite=Strict (prevent CSRF)
- Token validation on protected routes
- Database token verification
- Parameterized SQL queries (prevent SQL injection)

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL (Aiven)
- **Database Client:** mysql2
- **Authentication:** JWT, bcrypt
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Animation:** Canvas API (confetti)

## Project Structure

```
kodbank/
├── config/
│   ├── database.js          # MySQL connection
│   └── initDb.js            # Table creation
├── middleware/
│   └── auth.js              # JWT verification
├── routes/
│   ├── auth.js              # Register, login, logout
│   └── user.js              # Balance check
├── public/
│   ├── index.html           # Frontend
│   ├── styles.css           # Styling
│   └── app.js               # Frontend logic
├── .env                     # Environment variables
├── .gitignore
├── server.js                # Entry point
├── package.json
└── README.md
```

## Troubleshooting

### Database Connection Issues
- Verify your Aiven MySQL credentials in `.env`
- Check if your IP is whitelisted in Aiven console
- Ensure SSL is enabled (already configured in code)

### Port Already in Use
- Change PORT in `.env` to another port (e.g., 5001)

### Token Issues
- Clear browser cookies
- Make sure JWT_SECRET is set in `.env`

Enjoy using Kodbank! 🎉
