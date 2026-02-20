# KodBank - Complete Implementation Plan

## 📋 Project Overview
A secure banking application with user registration, JWT authentication, and balance management.

---

## 🎯 Core Requirements

### 1. Database Structure
**Two Tables Required:**

#### Table 1: `kodusers`
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| user_id | SERIAL | PRIMARY KEY | Auto-increment | Unique user identifier |
| username | VARCHAR(50) | UNIQUE, NOT NULL | - | User's login name |
| password | VARCHAR(255) | NOT NULL | - | Hashed password |
| email | VARCHAR(100) | UNIQUE, NOT NULL | - | User's email |
| phone | VARCHAR(20) | - | - | User's phone number |
| role | VARCHAR(20) | - | 'customer' | User role (fixed as customer) |
| balance | DECIMAL(10,2) | - | 100000.00 | Account balance |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | Registration date |

#### Table 2: `cjwt` (JWT Token Storage)
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| token_id | SERIAL | PRIMARY KEY | Auto-increment | Unique token identifier |
| username | VARCHAR(50) | FOREIGN KEY | - | References kodusers(username) |
| jwt_token | TEXT | NOT NULL | - | The JWT token string |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | Token creation time |
| expires_at | TIMESTAMP | - | - | Token expiration time |

---

## 🔄 Application Flow

### Phase 1: User Registration

**Input Fields:**
- Username (required)
- Password (required)
- Email (required)
- Phone (optional)

**Backend Process:**
1. Receive registration data
2. Validate input (check required fields)
3. Check if username/email already exists
4. Hash password using bcrypt
5. Insert into `kodusers` table with:
   - role = 'customer' (hardcoded)
   - balance = 100000.00 (default)
6. Return success response

**Frontend Process:**
1. Display registration form
2. Collect user input
3. Send POST request to `/api/auth/register`
4. On success: Show success message
5. Redirect to login page after 2 seconds

**Expected Output:**
- ✅ User record created in database
- ✅ Initial balance: $100,000
- ✅ Role: customer
- ✅ Password: securely hashed
- ✅ Redirect to login page

---

### Phase 2: User Login & JWT Generation

**Input Fields:**
- Username (required)
- Password (required)

**Backend Process:**
1. Receive login credentials
2. Query `kodusers` table for username
3. Compare password with hashed password using bcrypt
4. If valid:
   - Generate JWT token with:
     - **Subject (sub):** username
     - **Claim:** role
     - **Algorithm:** HS256 (HMAC with SHA-256)
     - **Expiration:** 24 hours
   - Calculate expiration timestamp
   - Store token in `cjwt` table
   - Set token as HTTP-only cookie
   - Return success response
5. If invalid: Return error

**Frontend Process:**
1. Display login form
2. Collect credentials
3. Send POST request to `/api/auth/login`
4. On success: Show success message
5. Redirect to dashboard after 1 second

**Expected Output:**
- ✅ JWT token generated with username and role
- ✅ Token stored in `cjwt` database table
- ✅ Token set as HTTP-only cookie in browser
- ✅ Success status response
- ✅ Redirect to dashboard

---

### Phase 3: Dashboard Access

**Requirements:**
- User must be logged in (valid JWT token)
- Display "Check Balance" button
- Protected route (requires authentication)

**Backend Process:**
1. Verify JWT token from cookie
2. Check token signature validity
3. Verify token exists in `cjwt` table
4. Check token expiration
5. If valid: Allow access
6. If invalid: Return 401 Unauthorized

**Frontend Process:**
1. Display dashboard page
2. Show "Check Balance" button
3. Show "Logout" button
4. If unauthorized: Redirect to login

**Expected Output:**
- ✅ Dashboard visible only to authenticated users
- ✅ "Check Balance" button displayed
- ✅ Logout option available
- ✅ Unauthorized users redirected to login

---

### Phase 4: Balance Check with Animation

**User Action:**
- Click "Check Balance" button

**Backend Process:**
1. Receive GET request to `/api/user/balance`
2. Extract JWT token from cookie
3. Verify token using middleware:
   - Validate signature
   - Check database existence
   - Verify expiration
4. Extract username from token payload
5. Query `kodusers` table: `SELECT balance WHERE username = ?`
6. Return balance in JSON response

**Frontend Process:**
1. Send GET request with credentials (cookie)
2. Receive balance data
3. Display message: "Your balance is: $100000"
4. Trigger confetti animation:
   - Canvas-based particle system
   - 150 confetti pieces
   - Multiple colors (red, blue, green, yellow, purple)
   - Falling animation with rotation
   - 3-5 second duration

**Expected Output:**
- ✅ Balance fetched from database
- ✅ Message displayed: "Your balance is: $100,000"
- ✅ Animated confetti celebration (party popper effect)
- ✅ Colorful, engaging visual feedback
- ✅ Token verified before data access

---

## 🔒 Security Implementation

### Password Security
- ✅ Bcrypt hashing with 10 salt rounds
- ✅ Never store plain text passwords
- ✅ Secure comparison during login

### JWT Security
- ✅ Signed with secret key (HS256 algorithm)
- ✅ Contains username (subject) and role (claim)
- ✅ 24-hour expiration
- ✅ Stored in database for validation
- ✅ HTTP-only cookies (prevents XSS attacks)

### API Security
- ✅ Protected routes with middleware
- ✅ Token verification on every request
- ✅ Database token validation
- ✅ Expiration checking
- ✅ CORS configuration
- ✅ SQL injection prevention (parameterized queries)

---

## 📡 API Endpoints

### 1. POST `/api/auth/register`
**Purpose:** Register new user

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePass123",
  "email": "john@example.com",
  "phone": "1234567890"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully"
}
```

**Error Response (400):**
```json
{
  "message": "Username or email already exists"
}
```

---

### 2. POST `/api/auth/login`
**Purpose:** Authenticate user and generate JWT

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePass123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "success": true
}
```
**Cookie Set:** `token=<JWT_TOKEN>; HttpOnly; Max-Age=86400`

**Error Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

---

### 3. GET `/api/user/balance`
**Purpose:** Get user's account balance

**Headers Required:**
- Cookie: `token=<JWT_TOKEN>`

**Success Response (200):**
```json
{
  "balance": 100000.00
}
```

**Error Response (401):**
```json
{
  "message": "Invalid token"
}
```

---

### 4. POST `/api/auth/logout`
**Purpose:** Logout user and clear token

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## 🎨 Frontend Features

### Pages
1. **Registration Page**
   - Clean form design
   - Input validation
   - Success/error messages
   - Link to login page

2. **Login Page**
   - Username and password fields
   - Error handling
   - Link to registration page

3. **Dashboard Page**
   - Welcome message
   - Check Balance button (prominent)
   - Logout button
   - Balance display area
   - Confetti canvas overlay

### Visual Design
- ✅ Modern gradient background (purple theme)
- ✅ White card containers with shadows
- ✅ Smooth transitions and animations
- ✅ Responsive design
- ✅ Professional typography
- ✅ Color-coded messages (success/error)

### Animations
- ✅ Confetti particle system
- ✅ Smooth page transitions
- ✅ Button hover effects
- ✅ Balance display slide-in animation
- ✅ Form input focus effects

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Aiven)
- **Authentication:** jsonwebtoken
- **Password Hashing:** bcrypt
- **Cookie Handling:** cookie-parser
- **CORS:** cors
- **Environment:** dotenv

### Frontend
- **HTML5:** Semantic markup
- **CSS3:** Modern styling with gradients and animations
- **JavaScript:** Vanilla JS (ES6+)
- **Canvas API:** Confetti animation

### Database
- **Provider:** Aiven PostgreSQL
- **SSL:** Enabled
- **Connection Pooling:** pg Pool

---

## ✅ Deliverables Checklist

### Database
- [x] `kodusers` table created with all fields
- [x] `cjwt` table created with foreign key
- [x] Default values set (role: customer, balance: 100000)
- [x] Automatic table creation on server start

### Registration
- [x] Registration form with all fields
- [x] Backend validation
- [x] Password hashing
- [x] Duplicate username/email check
- [x] Initial balance assignment
- [x] Redirect to login after success

### Login & Authentication
- [x] Login form
- [x] Username/password validation
- [x] JWT token generation (username + role)
- [x] Token stored in database
- [x] Token set as HTTP-only cookie
- [x] Redirect to dashboard after success

### Dashboard
- [x] Protected route (requires authentication)
- [x] Check Balance button
- [x] Logout button
- [x] Token verification middleware

### Balance Check
- [x] JWT token verification
- [x] Token validation from database
- [x] Username extraction from token
- [x] Balance fetch from database
- [x] Balance display with formatting
- [x] Confetti animation (party popper effect)

### Security
- [x] Password hashing (bcrypt)
- [x] JWT signing and verification
- [x] HTTP-only cookies
- [x] Token expiration (24 hours)
- [x] Database token validation
- [x] Protected API routes
- [x] CORS configuration
- [x] SQL injection prevention

### User Experience
- [x] Clean, modern UI design
- [x] Responsive layout
- [x] Smooth animations
- [x] Clear error messages
- [x] Success feedback
- [x] Intuitive navigation
- [x] Celebration animation on balance check

---

## 🚀 Deployment Checklist

### Before Running
1. [ ] Aiven PostgreSQL database created
2. [ ] Database credentials obtained
3. [ ] `.env` file configured with:
   - DB_HOST
   - DB_PORT
   - DB_NAME
   - DB_USER
   - DB_PASSWORD
   - JWT_SECRET (strong random string)
4. [ ] Dependencies installed (`npm install`)

### Running the Application
1. [ ] Start server: `npm start`
2. [ ] Verify database tables created
3. [ ] Access application: http://localhost:5000
4. [ ] Test registration flow
5. [ ] Test login flow
6. [ ] Test balance check with animation
7. [ ] Test logout functionality

---

## 📊 Expected User Journey

```
START
  ↓
[Registration Page]
  ↓ (Fill form: username, email, phone, password)
  ↓ (Submit)
  ↓
[Backend: Create user with $100,000 balance]
  ↓
[Success Message: "User registered successfully"]
  ↓ (Auto-redirect after 2 seconds)
  ↓
[Login Page]
  ↓ (Enter username & password)
  ↓ (Submit)
  ↓
[Backend: Validate credentials]
  ↓
[Backend: Generate JWT token]
  ↓
[Backend: Store token in database]
  ↓
[Backend: Set token as cookie]
  ↓
[Success Message: "Login successful"]
  ↓ (Auto-redirect after 1 second)
  ↓
[Dashboard Page]
  ↓ (Click "Check Balance" button)
  ↓
[Backend: Verify JWT token]
  ↓
[Backend: Extract username from token]
  ↓
[Backend: Fetch balance from database]
  ↓
[Frontend: Display "Your balance is: $100,000"]
  ↓
[Frontend: Trigger confetti animation 🎉]
  ↓
[User sees celebration with balance]
  ↓
[Click "Logout" (optional)]
  ↓
[Backend: Remove token from database]
  ↓
[Frontend: Clear cookie & redirect to login]
  ↓
END
```

---

## 🎯 Success Criteria

The application is considered complete when:

1. ✅ User can register with username, email, phone, password
2. ✅ User gets $100,000 initial balance automatically
3. ✅ User role is set to "customer" by default
4. ✅ User is redirected to login after registration
5. ✅ User can login with valid credentials
6. ✅ JWT token is generated with username and role
7. ✅ Token is stored in `cjwt` database table
8. ✅ Token is set as HTTP-only cookie
9. ✅ User is redirected to dashboard after login
10. ✅ Dashboard shows "Check Balance" button
11. ✅ Clicking button triggers JWT verification
12. ✅ Balance is fetched from database using token
13. ✅ Balance is displayed with proper formatting
14. ✅ Confetti animation plays (party popper effect)
15. ✅ User can logout and token is removed
16. ✅ All security measures are implemented
17. ✅ Application handles errors gracefully

---

## 📝 Notes

- All passwords are hashed and never stored in plain text
- JWT tokens expire after 24 hours
- Tokens are validated against database on every request
- HTTP-only cookies prevent XSS attacks
- CORS is configured for security
- Database uses SSL connection (Aiven)
- Application creates tables automatically on first run
- Confetti animation uses HTML5 Canvas API
- Frontend is single-page application (SPA)
- All API responses are JSON formatted

---

**This plan ensures complete implementation of all requirements with security, user experience, and functionality as top priorities.**
