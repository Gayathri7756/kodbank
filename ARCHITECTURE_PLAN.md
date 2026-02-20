# KODBANK - ARCHITECTURE & DEVELOPMENT PLAN
## Based on Stateless Protocol Design

---

## 🎯 ARCHITECTURE OVERVIEW

**Protocol Type:** Stateless Protocol  
**Database:** Aiven PostgreSQL (MySQL-compatible)  
**Authentication:** JWT with Database Token Storage  
**Cookie Strategy:** HTTP-only, Secure, SameSite=Strict  

---

## 📊 DATABASE SCHEMA (AIVEN DB - MYSQL)

### Table 1: `kodUser` (User Information)
```sql
CREATE TABLE kodUser (
    uid INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,        -- bcrypt hashed
    balance DECIMAL(12,2) DEFAULT 100000.00,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    manager VARCHAR(50),                    -- optional field
    admin VARCHAR(50)                       -- optional field
);
```

### Table 2: `CJWT` (JWT Token Storage with Balance)
```sql
CREATE TABLE CJWT (
    tid INT PRIMARY KEY AUTO_INCREMENT,
    token TEXT NOT NULL,
    uid INT NOT NULL,
    expiry TIMESTAMP NOT NULL,
    balance DECIMAL(12,2) DEFAULT 100000.00,    -- Balance stored here!
    FOREIGN KEY (uid) REFERENCES kodUser(uid) ON DELETE CASCADE,
    INDEX idx_uid (uid),
    INDEX idx_expiry (expiry)
);
```

**Key Points:**
- `kodUser` stores user authentication and profile information
- `CJWT` stores JWT tokens with expiry AND balance for each session
- Balance is stored in CJWT table (not in kodUser)
- Foreign key relationship: CJWT.uid → kodUser.uid
- Indexes on uid and expiry for performance
- Each login creates a new token entry with balance copy

---

## 🔄 APPLICATION FLOW (STATELESS PROTOCOL)

### **PHASE 1: REGISTRATION FLOW**

**Frontend (Registration Page):**
```
User Input Fields:
├── username (required)
├── email (required)
├── password (required)
├── phone (optional, one option: customer)
└── role (hidden, default: "customer")
```

**Backend Process:**
1. Receive POST request to `/api/auth/register`
2. Validate input:
   - Check username format (alphanumeric, 3-50 chars)
   - Validate email format
   - Check password strength (min 8 chars)
3. Check if username or email already exists in `kodUser`
4. Hash password using bcrypt (10 salt rounds)
5. Insert into `kodUser`:
   ```sql
   INSERT INTO kodUser (username, email, password, phone, role)
   VALUES (?, ?, ?, ?, 'customer')
   ```
   Note: Balance is NOT stored in kodUser, it will be stored in CJWT during login
6. Return success response

**Response:**
- Success (201): `{ message: "User registered successfully" }`
- Error (400): `{ message: "Username or email already exists" }`

**Frontend Action:**
- Display success message
- Redirect to Login page after 2 seconds

---

### **PHASE 2: LOGIN FLOW (JWT GENERATION)**

**Frontend (Login Page):**
```
User Input Fields:
├── username (required)
└── password (required)
```

**Backend Process:**
1. Receive POST request to `/api/auth/login`
2. Query `kodUser` table:
   ```sql
   SELECT uid, username, email, password, phone, role, createdAt, manager, admin
   FROM kodUser
   WHERE username = ?
   ```
3. Validate password using bcrypt.compare()
4. If valid, generate JWT token:
   ```javascript
   JWT Payload:
   {
     sub: username,           // Subject (standard claim)
     uid: uid,                // User ID
     role: role,              // User role
     iat: timestamp,          // Issued at
     exp: timestamp + 24h     // Expiration (24 hours)
   }
   
   Algorithm: HS256 (HMAC-SHA256)
   Secret: process.env.JWT_SECRET
   ```
5. Calculate expiry timestamp (current time + 24 hours)
6. Store token in `CJWT` table with initial balance:
   ```sql
   INSERT INTO CJWT (token, uid, expiry, balance)
   VALUES (?, ?, ?, 100000.00)
   ```
   Note: Balance of 100000.00 is assigned during login and stored in CJWT
7. Set token as HTTP-only cookie:
   ```javascript
   res.cookie('auth_token', token, {
     httpOnly: true,           // Prevent XSS
     secure: true,             // HTTPS only (production)
     sameSite: 'strict',       // CSRF protection
     maxAge: 86400000          // 24 hours in milliseconds
   });
   ```
8. Return success response

**Response:**
- Success (200): `{ success: true, message: "Login successful" }`
- Error (401): `{ message: "Invalid credentials" }`

**Frontend Action:**
- Store authentication state (optional)
- Redirect to Dashboard after 1 second

---

### **PHASE 3: DASHBOARD ACCESS (PROTECTED ROUTE)**

**Authentication Middleware (verifyToken):**
```
Process:
1. Extract token from cookie (req.cookies.auth_token)
2. Check if token exists
3. Verify JWT signature using JWT_SECRET
4. Decode token payload
5. Query CJWT table:
   SELECT * FROM CJWT WHERE token = ? AND uid = ?
6. Check if token exists in database
7. Verify token hasn't expired (expiry > current time)
8. If valid:
   - Attach user data to request: req.user = decoded
   - Attach token to request: req.token = token
   - Call next()
9. If invalid:
   - Return 401 Unauthorized
```

**Frontend (Dashboard Page):**
```
Display:
├── Welcome message with username
├── "Check Balance" button (prominent)
├── Logout button
└── User profile section (optional)
```

**Backend:**
- Apply `verifyToken` middleware to all dashboard routes
- Return 401 if token invalid → Frontend redirects to login

---

### **PHASE 4: CHECK BALANCE FLOW**

**User Action:**
- Click "Check Balance" button

**Backend Process:**
1. Receive GET request to `/api/user/balance`
2. Apply `verifyToken` middleware:
   - Verify JWT token from cookie
   - Validate token in database
   - Extract uid from token payload
3. Query `CJWT` table (NOT kodUser):
   ```sql
   SELECT balance FROM CJWT WHERE token = ? AND uid = ?
   ```
   Important: Balance is fetched from CJWT table, not from kodUser
4. Return balance in response:
   ```json
   {
     "success": true,
     "balance": 100000.00
   }
   ```

**Frontend Process:**
1. Send GET request with credentials (cookie sent automatically)
2. Receive balance data
3. Display message:
   ```
   "Your balance is: $100,000.00"
   ```
4. Trigger party popper animation:
   - Canvas-based confetti particles
   - Multiple colors (red, blue, yellow, green, purple)
   - Falling animation with rotation
   - 2-3 second duration
   - Celebration feel

**Animation Implementation:**
```javascript
// Canvas-based confetti system
- Create 150 confetti pieces
- Random colors from palette
- Physics: gravity, rotation, horizontal drift
- Render loop using requestAnimationFrame
- Clear canvas when all particles off-screen
```

---

### **PHASE 5: LOGOUT FLOW**

**User Action:**
- Click "Logout" button

**Backend Process:**
1. Receive POST request to `/api/auth/logout`
2. Extract token from cookie
3. Delete token from `CJWT` table:
   ```sql
   DELETE FROM CJWT WHERE token = ?
   ```
   Note: This also removes the balance associated with this session
4. Clear cookie:
   ```javascript
   res.clearCookie('auth_token');
   ```
5. Return success response

**Frontend Action:**
- Clear local authentication state
- Redirect to Login page

---

## 🏗️ DEVELOPMENT STAGES

### **STAGE 1: PROJECT SETUP & DATABASE CONNECTION**

**Goal:** Set up project structure and connect to Aiven database

**Tasks:**
1. Initialize Node.js project
2. Install dependencies:
   ```bash
   npm install express mysql2 bcrypt jsonwebtoken cookie-parser cors dotenv
   ```
3. Create folder structure:
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
   └── server.js                # Entry point
   ```
4. Configure Aiven MySQL connection:
   ```javascript
   // Using mysql2 with connection pooling
   const mysql = require('mysql2/promise');
   
   const pool = mysql.createPool({
     host: process.env.DB_HOST,
     port: process.env.DB_PORT,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     ssl: {
       rejectUnauthorized: false
     },
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0
   });
   ```
5. Create `.env` file:
   ```
   DB_HOST=your-aiven-host.aivencloud.com
   DB_PORT=3306
   DB_USER=avnadmin
   DB_PASSWORD=your-password
   DB_NAME=defaultdb
   JWT_SECRET=your-256-bit-secret-key
   JWT_EXPIRY=24h
   PORT=5000
   NODE_ENV=development
   ```

**Testing Checkpoints:**
- ✅ Server starts without errors
- ✅ Database connection successful
- ✅ Environment variables loaded
- ✅ Basic endpoint responds

**Deliverables:**
- Project structure created
- Database connection established
- Environment configured

---

### **STAGE 2: DATABASE SCHEMA CREATION**

**Goal:** Create `kodUser` and `UserToken` tables in Aiven MySQL

**Tasks:**
1. Create initialization script (`config/initDb.js`):
   ```javascript
   // Create kodUser table (NO balance field)
   CREATE TABLE IF NOT EXISTS kodUser (
     uid INT PRIMARY KEY AUTO_INCREMENT,
     username VARCHAR(50) UNIQUE NOT NULL,
     email VARCHAR(100) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     phone VARCHAR(20),
     role VARCHAR(20) DEFAULT 'customer',
     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     manager VARCHAR(50),
     admin VARCHAR(50)
   );
   
   // Create CJWT table (WITH balance field)
   CREATE TABLE IF NOT EXISTS CJWT (
     tid INT PRIMARY KEY AUTO_INCREMENT,
     token TEXT NOT NULL,
     uid INT NOT NULL,
     expiry TIMESTAMP NOT NULL,
     balance DECIMAL(12,2) DEFAULT 100000.00,
     FOREIGN KEY (uid) REFERENCES kodUser(uid) ON DELETE CASCADE
   );
   
   // Create indexes
   CREATE INDEX idx_uid ON CJWT(uid);
   CREATE INDEX idx_expiry ON CJWT(expiry);
   ```
2. Run initialization on server startup
3. Add error handling for table creation

**Testing Checkpoints:**
- ✅ Tables created successfully
- ✅ Foreign key constraint working
- ✅ Default values applied (role, balance)
- ✅ Indexes created
- ✅ Can insert test data manually

**Deliverables:**
- Database schema implemented
- Initialization script
- Schema documentation

---

### **STAGE 3: USER REGISTRATION**

**Goal:** Implement registration with validation and password hashing

**Backend Tasks:**
1. Create registration endpoint: `POST /api/auth/register`
2. Implement validation:
   - Username: 3-50 chars, alphanumeric
   - Email: valid format
   - Password: min 8 chars
   - Phone: optional
3. Check for duplicate username/email
4. Hash password with bcrypt (10 rounds)
5. Insert into `kodUser` table
6. Return success/error response

**Frontend Tasks:**
1. Create registration form:
   - Fields: username, email, password, phone
   - Client-side validation
   - Submit button with loading state
2. Handle form submission
3. Display success/error messages
4. Redirect to login on success

**Testing Checkpoints:**
- ✅ User created with correct default values (role = 'customer')
- ✅ Password hashed (not plain text)
- ✅ No balance field in kodUser (balance will be in CJWT)
- ✅ Duplicate username rejected
- ✅ Duplicate email rejected
- ✅ Validation working
- ✅ Redirect to login works

**Deliverables:**
- Registration API endpoint
- Registration frontend page
- Input validation
- Error handling

---

### **STAGE 4: LOGIN & JWT AUTHENTICATION**

**Goal:** Implement login with JWT generation and cookie storage

**Backend Tasks:**
1. Create login endpoint: `POST /api/auth/login`
2. Validate credentials:
   - Query `kodUser` by username
   - Compare password with bcrypt
3. Generate JWT token:
   - Payload: username, uid, role
   - Algorithm: HS256
   - Expiry: 24 hours
4. Store token in `UserToken` table
5. Set HTTP-only cookie
6. Return success response

**Frontend Tasks:**
1. Create login form
2. Handle form submission
3. Display success/error messages
4. Redirect to dashboard on success

**Testing Checkpoints:**
- ✅ Valid credentials generate token
- ✅ Token stored in CJWT table with balance = 100000.00
- ✅ Cookie set with correct flags
- ✅ Invalid credentials rejected
- ✅ Redirect to dashboard works
- ✅ Balance assigned during login (not registration)

**Deliverables:**
- Login API endpoint
- JWT generation logic
- Token storage in database
- Login frontend page

---

### **STAGE 5: AUTHENTICATION MIDDLEWARE**

**Goal:** Create middleware to verify JWT tokens

**Backend Tasks:**
1. Create `verifyToken` middleware
2. Extract token from cookie
3. Verify JWT signature
4. Check token in `UserToken` table
5. Verify expiry
6. Attach user data to request
7. Return 401 if invalid

**Frontend Tasks:**
1. Handle 401 responses globally
2. Redirect to login on authentication failure
3. Implement route guards

**Testing Checkpoints:**
- ✅ Valid token allows access
- ✅ Invalid token returns 401
- ✅ Expired token returns 401
- ✅ Missing token returns 401
- ✅ Frontend redirects on 401

**Deliverables:**
- Authentication middleware
- Token verification logic
- Frontend auth guards

---

### **STAGE 6: DASHBOARD (PROTECTED ROUTE)**

**Goal:** Create protected dashboard accessible only to authenticated users

**Backend Tasks:**
1. Create dashboard endpoint: `GET /api/dashboard`
2. Apply `verifyToken` middleware
3. Return user data

**Frontend Tasks:**
1. Create dashboard page
2. Display welcome message
3. Show "Check Balance" button
4. Show logout button
5. Handle unauthenticated access

**Testing Checkpoints:**
- ✅ Dashboard accessible when logged in
- ✅ Unauthenticated users redirected
- ✅ User info displayed correctly
- ✅ Check Balance button visible

**Deliverables:**
- Protected dashboard endpoint
- Dashboard frontend page
- Navigation system

---

### **STAGE 7: CHECK BALANCE WITH ANIMATION**

**Goal:** Implement balance check with JWT verification and party popper animation

**Backend Tasks:**
1. Create balance endpoint: `GET /api/user/balance`
2. Apply `verifyToken` middleware
3. Extract token from cookie
4. Query `CJWT` table for balance (NOT kodUser):
   ```sql
   SELECT balance FROM CJWT WHERE token = ?
   ```
5. Return balance in response

**Frontend Tasks:**
1. Implement "Check Balance" button handler
2. Send GET request to balance endpoint
3. Display balance message: "Your balance is: $100,000.00"
4. Implement party popper animation:
   - Canvas-based confetti
   - 150 particles
   - Multiple colors
   - Falling animation with rotation
   - 2-3 second duration

**Animation Code Structure:**
```javascript
class Confetti {
  constructor() {
    this.x = random x position
    this.y = -10 (start above screen)
    this.size = random 5-15px
    this.speedY = random 2-5px
    this.speedX = random -1 to 1px
    this.color = random from palette
    this.rotation = random 0-360
    this.rotationSpeed = random -5 to 5
  }
  
  update() {
    this.y += this.speedY
    this.x += this.speedX
    this.rotation += this.rotationSpeed
  }
  
  draw(ctx) {
    // Draw rotated rectangle
  }
}

function launchConfetti() {
  // Create 150 confetti pieces
  // Animate using requestAnimationFrame
  // Clear when all off-screen
}
```

**Testing Checkpoints:**
- ✅ Balance request requires valid JWT
- ✅ Correct balance returned from CJWT table
- ✅ Balance fetched using token (not username)
- ✅ Balance formatted properly
- ✅ Animation plays smoothly
- ✅ Error handling works
- ✅ Balance is session-specific (from CJWT, not kodUser)

**Deliverables:**
- Balance API endpoint
- Balance display UI
- Party popper animation
- Error handling

---

### **STAGE 8: LOGOUT FUNCTIONALITY**

**Goal:** Implement logout with token removal

**Backend Tasks:**
1. Create logout endpoint: `POST /api/auth/logout`
2. Extract token from cookie
3. Delete token from `CJWT` table (this also removes the balance)
4. Clear cookie
5. Return success response

**Frontend Tasks:**
1. Implement logout button handler
2. Send logout request
3. Clear local state
4. Redirect to login page

**Testing Checkpoints:**
- ✅ Token removed from CJWT table
- ✅ Balance removed with token
- ✅ Cookie cleared
- ✅ Redirect to login works
- ✅ Cannot access dashboard after logout

**Deliverables:**
- Logout API endpoint
- Logout functionality
- Session cleanup

---

### **STAGE 9: SECURITY HARDENING**

**Goal:** Implement security best practices

**Tasks:**
1. Add rate limiting:
   - Login: 5 attempts per 15 minutes
   - Registration: 3 attempts per hour
   - Balance: 100 requests per hour
2. Add security headers (Helmet.js)
3. Implement CSRF protection
4. Add request logging
5. Implement token cleanup job (remove expired tokens)
6. Add input sanitization
7. Configure CORS properly

**Testing Checkpoints:**
- ✅ Rate limiting working
- ✅ Security headers present
- ✅ CSRF protection working
- ✅ Token cleanup job running
- ✅ Logging capturing events

**Deliverables:**
- Rate limiting
- Security headers
- CSRF protection
- Token cleanup job
- Logging system

---

### **STAGE 10: TESTING & DEPLOYMENT**

**Goal:** Test all features and deploy to production

**Tasks:**
1. Unit tests for all functions
2. Integration tests for all flows
3. Security testing
4. Performance testing
5. Production configuration
6. Deploy to hosting platform
7. Set up monitoring
8. Create documentation

**Testing Checkpoints:**
- ✅ All tests passing
- ✅ Security tests passing
- ✅ Performance benchmarks met
- ✅ Production deployment successful
- ✅ Monitoring active

**Deliverables:**
- Test suite
- Production deployment
- Monitoring setup
- Documentation

---

## 🔒 SECURITY IMPLEMENTATION

### Password Security
- Bcrypt hashing with 10 salt rounds
- Never store plain text passwords
- Secure password comparison

### JWT Security
- HS256 algorithm (HMAC-SHA256)
- 256-bit secret key
- 24-hour expiration
- Stored in database for validation
- Revocation capability

### Cookie Security
- HTTP-only flag (prevent XSS)
- Secure flag (HTTPS only)
- SameSite=Strict (CSRF protection)
- 24-hour max age

### API Security
- Authentication middleware on protected routes
- Token verification on every request
- Database token validation
- Expiration checking
- Rate limiting
- Input validation
- SQL injection prevention (parameterized queries)

---

## 📋 TECHNOLOGY STACK

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MySQL (Aiven)
- **Database Client:** mysql2 (with promises)
- **Authentication:** jsonwebtoken
- **Password Hashing:** bcrypt
- **Cookie Handling:** cookie-parser
- **Security:** helmet, express-rate-limit
- **CORS:** cors
- **Environment:** dotenv

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **JavaScript (ES6+)** - Vanilla JS
- **Canvas API** - Confetti animation
- **Fetch API** - HTTP requests

### Database
- **Aiven MySQL** (managed)
- **Connection Pooling:** mysql2 pool
- **SSL:** Enabled

---

## ✅ SUCCESS CRITERIA

Application is complete when:

1. ✅ User can register with username, email, password, phone
2. ✅ User gets $100,000 balance assigned during LOGIN (stored in CJWT)
3. ✅ User role defaults to "customer"
4. ✅ User redirected to login after registration
5. ✅ User can login with valid credentials
6. ✅ JWT token generated with username, uid, role
7. ✅ Token stored in `CJWT` table with balance = 100000.00
8. ✅ Token sent as HTTP-only cookie
9. ✅ User redirected to dashboard after login
10. ✅ Dashboard accessible only when authenticated
11. ✅ Check Balance button visible
12. ✅ Balance request validates JWT
13. ✅ Token used to query CJWT table
14. ✅ Balance fetched from `CJWT` table (NOT kodUser)
15. ✅ Balance displayed: "Your balance is: $100,000.00"
16. ✅ Party popper animation plays
17. ✅ User can logout successfully
18. ✅ Token AND balance removed from CJWT on logout
19. ✅ All security measures implemented
20. ✅ Application follows stateless protocol

---

## 📈 DEVELOPMENT TIMELINE

| Stage | Duration | Focus |
|-------|----------|-------|
| Stage 1: Setup | 1 day | Project & database connection |
| Stage 2: Schema | 1 day | Table creation |
| Stage 3: Registration | 2 days | User registration flow |
| Stage 4: Login | 2 days | JWT authentication |
| Stage 5: Middleware | 1 day | Token verification |
| Stage 6: Dashboard | 1 day | Protected routes |
| Stage 7: Balance | 2 days | Balance check & animation |
| Stage 8: Logout | 1 day | Session cleanup |
| Stage 9: Security | 2 days | Hardening |
| Stage 10: Testing | 3 days | QA & deployment |

**Total:** 16 days (3.2 weeks)

---

## 🎯 KEY DIFFERENCES FROM STANDARD APPROACH

1. **Database:** Using MySQL (Aiven) instead of PostgreSQL
2. **Table Names:** `kodUser` and `CJWT` (as per your diagram)
3. **Balance Storage:** Balance stored in `CJWT` table, NOT in `kodUser` table
4. **Balance Assignment:** Balance assigned during LOGIN (not registration)
5. **Balance Retrieval:** Balance fetched from `CJWT` using token (not from kodUser)
6. **Fields:** Includes `manager` and `admin` fields in `kodUser`
7. **Stateless Protocol:** Emphasis on stateless architecture
8. **Cookie Name:** `auth_token` for JWT storage
9. **Balance Display:** Specific message format with party popper animation
10. **Session-Based Balance:** Each login session has its own balance in CJWT

---

**This plan follows your diagram exactly and implements a complete stateless protocol architecture with JWT authentication, database token storage, and cookie-based session management.**

**Ready to start implementation? Begin with Stage 1!**
