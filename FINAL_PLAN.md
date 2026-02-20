# KODBANK - FINAL DEVELOPMENT PLAN
## Complete Architecture Based on Requirements

---

## 🎯 PROJECT OVERVIEW

**Application Name:** Kodbank  
**Database:** Aiven MySQL  
**Authentication:** JWT with Cookie-based Session  
**Architecture:** Stateless Backend + SPA Frontend  

---

## 📊 DATABASE SCHEMA (AIVEN MYSQL)

### Table 1: `koduser`
```sql
CREATE TABLE koduser (
    uid INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,           -- bcrypt hashed
    balance DECIMAL(12,2) DEFAULT 100000.00,  -- Initial balance
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table 2: `usertoken`
```sql
CREATE TABLE usertoken (
    tid INT PRIMARY KEY AUTO_INCREMENT,
    token TEXT NOT NULL,
    uid INT NOT NULL,
    expiry TIMESTAMP NOT NULL,
    FOREIGN KEY (uid) REFERENCES koduser(uid) ON DELETE CASCADE,
    INDEX idx_uid (uid),
    INDEX idx_expiry (expiry)
);
```

**Key Points:**
- `koduser` stores user information INCLUDING balance (100000.00 default)
- `usertoken` stores JWT tokens with expiry for validation
- Balance is stored in `koduser` table
- Foreign key: usertoken.uid → koduser.uid

---

## 🔄 COMPLETE APPLICATION FLOW

### **STEP 1: USER REGISTRATION**

**Frontend - Registration Page:**
```
Input Fields:
├── uid (auto-generated, not user input)
├── username (required)
├── email (required)
├── password (required)
├── phone (optional)
└── role (hidden, fixed as "customer")
```

**Backend Process:**
1. Receive POST `/api/auth/register`
2. Validate inputs:
   - Username: 3-50 characters, alphanumeric
   - Email: valid format
   - Password: minimum 8 characters
3. Check if username or email already exists
4. Hash password using bcrypt (10 salt rounds)
5. Insert into `koduser` table:
   ```sql
   INSERT INTO koduser (username, email, password, phone, role, balance)
   VALUES (?, ?, ?, ?, 'customer', 100000.00)
   ```
6. Return success response

**Response:**
- Success (201): `{ message: "Registration successful" }`
- Error (400): `{ message: "Username or email already exists" }`

**Frontend Action:**
- Display success message
- Redirect to login page

---

### **STEP 2: USER LOGIN & JWT GENERATION**

**Frontend - Login Page:**
```
Input Fields:
├── username (required)
└── password (required)
```

**Backend Process:**
1. Receive POST `/api/auth/login`
2. Query `koduser` table:
   ```sql
   SELECT uid, username, password, role FROM koduser WHERE username = ?
   ```
3. Validate password using bcrypt.compare()
4. If valid, generate JWT token:
   ```javascript
   Payload:
   {
     sub: username,        // Subject (username)
     uid: uid,             // User ID
     role: role,           // Claim (role)
     iat: timestamp,       // Issued at
     exp: timestamp + 24h  // Expiration
   }
   
   Algorithm: HS256 (HMAC-SHA256)
   Secret: process.env.JWT_SECRET
   Expiry: 24 hours
   ```
5. Calculate expiry timestamp (current time + 24 hours)
6. Store token in `usertoken` table:
   ```sql
   INSERT INTO usertoken (token, uid, expiry)
   VALUES (?, ?, ?)
   ```
7. Set token as HTTP-only cookie:
   ```javascript
   res.cookie('auth_token', token, {
     httpOnly: true,        // Prevent XSS
     secure: true,          // HTTPS only (production)
     sameSite: 'strict',    // CSRF protection
     maxAge: 86400000       // 24 hours
   });
   ```
8. Return success response

**Response:**
- Success (200): `{ success: true, message: "Login successful" }`
- Error (401): `{ message: "Invalid credentials" }`

**Frontend Action:**
- Redirect to user dashboard

---

### **STEP 3: USER DASHBOARD (PROTECTED ROUTE)**

**Authentication Middleware:**
```javascript
verifyToken(req, res, next):
1. Extract token from cookie (req.cookies.auth_token)
2. Check if token exists
3. Verify JWT signature using JWT_SECRET
4. Decode token payload
5. Query usertoken table:
   SELECT * FROM usertoken WHERE token = ? AND uid = ?
6. Check if token exists in database
7. Verify token hasn't expired (expiry > current time)
8. If valid:
   - Attach user data to request: req.user = decoded
   - Call next()
9. If invalid:
   - Return 401 Unauthorized
```

**Frontend - Dashboard Page:**
```
Display:
├── Welcome message with username
├── "Check Balance" button (prominent)
└── Logout button
```

**Backend:**
- Apply `verifyToken` middleware to dashboard route
- Return 401 if token invalid

---

### **STEP 4: CHECK BALANCE**

**User Action:**
- Click "Check Balance" button

**Backend Process:**
1. Receive GET `/api/user/balance`
2. Apply `verifyToken` middleware:
   - Verify JWT token from cookie
   - Validate token in database
   - Extract username from token payload (req.user.sub)
3. Query `koduser` table:
   ```sql
   SELECT balance FROM koduser WHERE username = ?
   ```
4. Return balance:
   ```json
   {
     "success": true,
     "balance": 100000.00
   }
   ```

**Frontend Process:**
1. Send GET request (cookie sent automatically)
2. Receive balance data
3. Display message:
   ```
   "Your balance is: $100,000.00"
   ```
4. Trigger party popper animation:
   - Canvas-based confetti particles
   - Multiple colors (red, blue, yellow, green, purple, pink)
   - Falling animation with rotation
   - 150+ particles
   - 2-3 second duration
   - Celebration effect

---

### **STEP 5: LOGOUT**

**Backend Process:**
1. Receive POST `/api/auth/logout`
2. Extract token from cookie
3. Delete token from `usertoken` table:
   ```sql
   DELETE FROM usertoken WHERE token = ?
   ```
4. Clear cookie
5. Return success response

**Frontend Action:**
- Redirect to login page

---

## 🏗️ DEVELOPMENT STAGES

### **STAGE 1: PROJECT SETUP (1 day)**

**Goal:** Initialize project and connect to Aiven MySQL

**Tasks:**
1. Create project folder: `kodbank`
2. Initialize Node.js: `npm init -y`
3. Install dependencies:
   ```bash
   npm install express mysql2 bcrypt jsonwebtoken cookie-parser cors dotenv
   ```
4. Create folder structure:
   ```
   kodbank/
   ├── config/
   │   ├── database.js       # MySQL connection
   │   └── initDb.js         # Table creation
   ├── middleware/
   │   └── auth.js           # JWT verification
   ├── routes/
   │   ├── auth.js           # Register, login, logout
   │   └── user.js           # Balance check
   ├── public/
   │   ├── index.html        # Frontend
   │   ├── styles.css        # Styling
   │   └── app.js            # Frontend logic
   ├── .env                  # Environment variables
   ├── .gitignore
   └── server.js             # Entry point
   ```
5. Configure `.env`:
   ```
   DB_HOST=your-aiven-host.aivencloud.com
   DB_PORT=3306
   DB_USER=avnadmin
   DB_PASSWORD=your-password
   DB_NAME=defaultdb
   JWT_SECRET=your-256-bit-secret-key
   PORT=5000
   NODE_ENV=development
   ```
6. Create MySQL connection pool in `config/database.js`
7. Test database connection

**Testing:**
- ✅ Server starts
- ✅ Database connects
- ✅ Environment variables load

---

### **STAGE 2: DATABASE SCHEMA (1 day)**

**Goal:** Create `koduser` and `usertoken` tables

**Tasks:**
1. Create `config/initDb.js`:
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
2. Run initialization on server startup
3. Add error handling

**Testing:**
- ✅ Tables created
- ✅ Foreign key works
- ✅ Default values applied
- ✅ Indexes created

---

### **STAGE 3: USER REGISTRATION (2 days)**

**Goal:** Implement registration API and frontend

**Backend Tasks:**
1. Create `routes/auth.js`
2. Implement POST `/api/auth/register`:
   - Input validation
   - Duplicate check
   - Password hashing (bcrypt, 10 rounds)
   - Insert into `koduser` with balance = 100000.00
   - Return response
3. Add error handling

**Frontend Tasks:**
1. Create registration form in `public/index.html`
2. Implement form submission in `public/app.js`
3. Display success/error messages
4. Redirect to login on success

**Testing:**
- ✅ User created with balance = 100000.00
- ✅ Password hashed
- ✅ Role = 'customer'
- ✅ Duplicate username rejected
- ✅ Duplicate email rejected
- ✅ Redirect works

---

### **STAGE 4: LOGIN & JWT (2 days)**

**Goal:** Implement login with JWT generation

**Backend Tasks:**
1. Implement POST `/api/auth/login`:
   - Query `koduser` by username
   - Validate password with bcrypt
   - Generate JWT token (username as subject, role as claim)
   - Store token in `usertoken` table
   - Set HTTP-only cookie
   - Return success response
2. Add error handling

**Frontend Tasks:**
1. Create login form
2. Implement form submission
3. Handle success/error
4. Redirect to dashboard

**Testing:**
- ✅ Valid credentials generate token
- ✅ Token stored in `usertoken` table
- ✅ Cookie set correctly
- ✅ Invalid credentials rejected
- ✅ Redirect works

---

### **STAGE 5: AUTHENTICATION MIDDLEWARE (1 day)**

**Goal:** Create JWT verification middleware

**Backend Tasks:**
1. Create `middleware/auth.js`
2. Implement `verifyToken`:
   - Extract token from cookie
   - Verify JWT signature
   - Check token in `usertoken` table
   - Verify expiry
   - Attach user data to request
   - Return 401 if invalid
3. Export middleware

**Testing:**
- ✅ Valid token allows access
- ✅ Invalid token returns 401
- ✅ Expired token returns 401
- ✅ Missing token returns 401

---

### **STAGE 6: DASHBOARD (1 day)**

**Goal:** Create protected dashboard

**Backend Tasks:**
1. Create dashboard endpoint with `verifyToken` middleware
2. Return user data

**Frontend Tasks:**
1. Create dashboard page
2. Display welcome message
3. Show "Check Balance" button
4. Show logout button
5. Handle 401 (redirect to login)

**Testing:**
- ✅ Dashboard accessible when logged in
- ✅ Unauthenticated users redirected
- ✅ Check Balance button visible

---

### **STAGE 7: CHECK BALANCE WITH ANIMATION (2 days)**

**Goal:** Implement balance check with party popper animation

**Backend Tasks:**
1. Create `routes/user.js`
2. Implement GET `/api/user/balance`:
   - Apply `verifyToken` middleware
   - Extract username from JWT (req.user.sub)
   - Query `koduser` for balance
   - Return balance

**Frontend Tasks:**
1. Implement "Check Balance" button handler
2. Send GET request
3. Display balance message: "Your balance is: $100,000.00"
4. Implement party popper animation:
   ```javascript
   Canvas-based confetti:
   - 150 particles
   - Colors: red, blue, yellow, green, purple, pink
   - Random positions, sizes, speeds
   - Gravity effect
   - Rotation animation
   - 2-3 second duration
   ```

**Testing:**
- ✅ Balance request requires valid JWT
- ✅ Correct balance returned from `koduser` table
- ✅ Username extracted from JWT
- ✅ Balance formatted properly
- ✅ Animation plays smoothly

---

### **STAGE 8: LOGOUT (1 day)**

**Goal:** Implement logout functionality

**Backend Tasks:**
1. Implement POST `/api/auth/logout`:
   - Extract token from cookie
   - Delete from `usertoken` table
   - Clear cookie
   - Return success

**Frontend Tasks:**
1. Implement logout button handler
2. Send logout request
3. Redirect to login

**Testing:**
- ✅ Token removed from database
- ✅ Cookie cleared
- ✅ Redirect works

---

### **STAGE 9: SECURITY & POLISH (2 days)**

**Goal:** Add security measures and polish UI

**Tasks:**
1. Add rate limiting
2. Add security headers (Helmet.js)
3. Implement CSRF protection
4. Add request logging
5. Token cleanup job (remove expired tokens)
6. Polish UI/UX
7. Add loading states
8. Improve error messages

**Testing:**
- ✅ Rate limiting works
- ✅ Security headers present
- ✅ Token cleanup runs
- ✅ UI polished

---

### **STAGE 10: TESTING & DEPLOYMENT (3 days)**

**Goal:** Test and deploy application

**Tasks:**
1. Unit tests
2. Integration tests
3. Security testing
4. Performance testing
5. Production configuration
6. Deploy to hosting platform
7. Set up monitoring
8. Create documentation

**Testing:**
- ✅ All tests passing
- ✅ Production deployment successful
- ✅ Monitoring active

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
- **CSS3** - Modern styling
- **JavaScript (ES6+)** - Vanilla JS
- **Canvas API** - Confetti animation
- **Fetch API** - HTTP requests

### Database
- **Aiven MySQL** (managed)
- **Connection Pooling:** mysql2 pool
- **SSL:** Enabled

---

## 🔒 SECURITY FEATURES

1. **Password Security:**
   - Bcrypt hashing (10 salt rounds)
   - Never store plain text

2. **JWT Security:**
   - HS256 algorithm
   - 256-bit secret key
   - 24-hour expiration
   - Database validation

3. **Cookie Security:**
   - HTTP-only flag (prevent XSS)
   - Secure flag (HTTPS only)
   - SameSite=Strict (CSRF protection)

4. **API Security:**
   - Authentication middleware
   - Token verification
   - Database token validation
   - Rate limiting
   - Input validation
   - Parameterized queries (SQL injection prevention)

---

## ✅ SUCCESS CRITERIA

Application is complete when:

1. ✅ User can register with username, email, password, phone
2. ✅ User gets $100,000 initial balance (stored in `koduser` table)
3. ✅ User role defaults to "customer"
4. ✅ User redirected to login after registration
5. ✅ User can login with valid credentials
6. ✅ JWT token generated (username as subject, role as claim)
7. ✅ Token stored in `usertoken` table
8. ✅ Token sent as HTTP-only cookie
9. ✅ User redirected to dashboard after login
10. ✅ Dashboard shows "Check Balance" button
11. ✅ Balance request includes JWT cookie
12. ✅ Backend verifies JWT token
13. ✅ Username extracted from JWT
14. ✅ Balance fetched from `koduser` table using username
15. ✅ Balance sent to client
16. ✅ Client displays: "Your balance is: $100,000.00"
17. ✅ Party popper animation plays
18. ✅ User can logout
19. ✅ All security measures implemented
20. ✅ Application deployed and working

---

## 📈 TIMELINE

| Stage | Duration | Total |
|-------|----------|-------|
| Stage 1: Setup | 1 day | 1 day |
| Stage 2: Database | 1 day | 2 days |
| Stage 3: Registration | 2 days | 4 days |
| Stage 4: Login & JWT | 2 days | 6 days |
| Stage 5: Middleware | 1 day | 7 days |
| Stage 6: Dashboard | 1 day | 8 days |
| Stage 7: Balance Check | 2 days | 10 days |
| Stage 8: Logout | 1 day | 11 days |
| Stage 9: Security | 2 days | 13 days |
| Stage 10: Testing | 3 days | 16 days |

**Total Time:** 16 days (3.2 weeks)

---

## 🎯 KEY POINTS

1. **Balance Storage:** Balance is stored in `koduser` table (NOT in `usertoken`)
2. **Balance Assignment:** Balance assigned during REGISTRATION (100000.00 default)
3. **Balance Retrieval:** Balance fetched from `koduser` using username extracted from JWT
4. **Token Storage:** JWT token stored in `usertoken` table for validation
5. **Cookie-Based Auth:** Token sent as HTTP-only cookie
6. **Stateless Backend:** Each request verified independently using JWT + database
7. **Party Popper:** Canvas-based confetti animation on balance display

---

**This plan is complete and ready for implementation. All requirements are covered with clear stages, testing checkpoints, and deliverables.**

**Ready to start coding? Begin with Stage 1: Project Setup!**
