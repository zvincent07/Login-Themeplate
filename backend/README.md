# Backend API

Express.js backend with MongoDB for the RBAC Authentication System.

## Folder Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # MongoDB connection
│   │   ├── index.js     # App configuration
│   │   └── passport.js  # Google OAuth configuration
│   ├── controllers/     # Request handlers
│   │   ├── authController.js
│   │   └── userController.js
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── Role.js
│   │   └── Permission.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── index.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js      # JWT authentication
│   │   ├── asyncHandler.js
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── services/        # Business logic layer
│   │   └── emailService.js
│   └── utils/           # Utility functions
│       ├── generateToken.js
│       ├── generateOTP.js
│       ├── passwordValidator.js
│       ├── verifyTurnstile.js
│       └── seedDatabase.js
├── index.js             # Main entry point
├── package.json
└── .env.example         # Environment variables template
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - MongoDB connection string
   - JWT secret key
   - Google OAuth credentials (optional)
   - Email SMTP credentials (required for OTP)
   - Cloudflare Turnstile secret key (optional)

4. Start the development server:
```bash
npm run dev
```

The server will automatically:
- Connect to MongoDB
- Seed database with roles, permissions, and admin account (if `SEED_DB=true`)

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user (sends OTP)
- `POST /api/auth/login` - Login user (requires verified email, Turnstile verification)
- `POST /api/auth/verify-otp` - Verify OTP and activate account
- `POST /api/auth/resend-otp` - Resend OTP code
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Users (`/api/users`)

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user (protected)
- `POST /api/users/employees` - Create employee (admin only)
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (admin only)

## Environment Variables

See `.env.example` for all available variables:

**Required:**
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `SMTP_USER` - Email username (for OTP)
- `SMTP_PASS` - Email password/app password (for OTP)

**Optional:**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret key
- `ADMIN_EMAIL` - First admin email (default: admin@example.com)
- `ADMIN_PASSWORD` - First admin password (default: Admin123!)
- `SEED_DB` - Enable database seeding (default: true)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Email OTP verification
- Cloudflare Turnstile bot protection
- Role-based access control (RBAC)
- Protected routes with middleware

## Database Seeding

On first startup (if `SEED_DB=true`), the database is automatically seeded with:
- Roles: `admin`, `employee`, `user`
- Permissions for each role
- First admin account (credentials from `.env`)

**⚠️ Change the default admin password after first login!**