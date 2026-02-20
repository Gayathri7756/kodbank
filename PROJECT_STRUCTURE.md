# KodBank Project Structure

```
kodbank/
├── config/
│   ├── database.js          # PostgreSQL connection configuration
│   └── initDb.js            # Database table creation script
│
├── middleware/
│   └── auth.js              # JWT token verification middleware
│
├── routes/
│   ├── auth.js              # Authentication routes (register, login, logout)
│   └── user.js              # User routes (balance check)
│
├── public/                  # Frontend files
│   ├── index.html           # Main HTML page
│   ├── styles.css           # Styling and animations
│   └── app.js               # Frontend JavaScript logic
│
├── node_modules/            # Dependencies (auto-generated)
│
├── .env                     # Environment variables (DATABASE, JWT_SECRET)
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
├── server.js                # Main server entry point
├── README.md                # Project documentation
├── SETUP_GUIDE.md           # Quick setup instructions
└── PROJECT_STRUCTURE.md     # This file
```

## Key Files Explained

### Backend Files

1. **server.js** - Main application entry point
   - Initializes Express server
   - Sets up middleware (CORS, cookie-parser, JSON)
   - Connects routes
   - Serves static frontend files
   - Initializes database tables

2. **config/database.js** - Database connection
   - Creates PostgreSQL connection pool
   - Uses Aiven credentials from .env

3. **config/initDb.js** - Database initialization
   - Creates `kodusers` table
   - Creates `cjwt` table
   - Runs automatically on server start

4. **middleware/auth.js** - Authentication middleware
   - Verifies JWT token from cookies
   - Checks token in database
   - Validates token expiration
   - Protects routes

5. **routes/auth.js** - Authentication endpoints
   - POST /api/auth/register - User registration
   - POST /api/auth/login - User login with JWT generation
   - POST /api/auth/logout - User logout

6. **routes/user.js** - User endpoints
   - GET /api/user/balance - Get user balance (protected)

### Frontend Files

1. **public/index.html** - Main HTML structure
   - Registration form
   - Login form
   - Dashboard with balance button

2. **public/styles.css** - Styling
   - Modern gradient design
   - Responsive layout
   - Animation effects

3. **public/app.js** - Frontend logic
   - Form handling
   - API calls
   - Page navigation
   - Confetti animation

### Configuration Files

1. **.env** - Environment variables
   - Database credentials
   - JWT secret key
   - Server port

2. **package.json** - Project metadata
   - Dependencies list
   - NPM scripts
   - Project information

## Data Flow

### Registration Flow
1. User fills registration form → Frontend
2. POST /api/auth/register → Backend
3. Password hashed with bcrypt
4. User saved to `kodusers` table with $100,000 balance
5. Success response → Redirect to login

### Login Flow
1. User enters credentials → Frontend
2. POST /api/auth/login → Backend
3. Username/password validated
4. JWT token generated (username + role)
5. Token saved to `cjwt` table
6. Token set as HTTP-only cookie
7. Success response → Redirect to dashboard

### Balance Check Flow
1. User clicks "Check Balance" → Frontend
2. GET /api/user/balance (with cookie) → Backend
3. JWT token verified by middleware
4. Token checked in `cjwt` table
5. Username extracted from token
6. Balance fetched from `kodusers` table
7. Balance returned → Frontend displays with confetti

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration (24 hours)
- HTTP-only cookies (prevents XSS)
- Token stored in database for validation
- Protected routes with middleware
- CORS configured for specific origin
- SQL injection prevention (parameterized queries)
