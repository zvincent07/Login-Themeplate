# RBAC Authentication System - MERN Stack

A complete Role-Based Access Control (RBAC) authentication system with Google OAuth and Email OTP verification.

## 🎯 Features

### Roles

1. **Admin** - Superuser
   - Secure first admin account creation via database seeding
   - Full system access
   - Can create and manage Employee accounts
   - Cannot be created through public registration

2. **Employee** - Managed Accounts
   - Accounts created and managed exclusively by Admin
   - Cannot self-register
   - Limited permissions

3. **User** - Public Access
   - Can register via Email/Password with OTP verification
   - Can register via Google OAuth (Gmail)
   - Strong password requirements enforced
   - Email verification required before login

### Authentication Methods

- **Email/Password** - Traditional authentication with strong password validation
- **Google OAuth** - Social authentication (Gmail)
- **Email OTP** - 6-digit code sent via email for account verification
- **JWT Tokens** - Secure token-based authentication

### Security Features

- ✅ Strong password requirements (8+ chars, uppercase, lowercase, number, special char)
- ✅ Email OTP verification (6-digit code, 10-minute expiry)
- ✅ Cloudflare Turnstile bot protection (optional)
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control (RBAC)
- ✅ Protected routes with middleware

## 🚀 Quick Start

### Prerequisites

- Node.js
- MongoDB
- Google account (for OAuth - optional)
- Email account (for OTP - optional)

### Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# See SETUP_GUIDE.md for detailed instructions

# Install dependencies
npm install

# Start server
npm run dev
```

The server will automatically:
- Connect to MongoDB
- Seed database with roles, permissions, and first admin account
- Run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Copy environment file (optional)
cp .env.example .env

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📖 Setup Guides

### Google OAuth Setup
See [SETUP_GUIDE.md](./SETUP_GUIDE.md#google-oauth-setup) for step-by-step instructions.

### Email OTP Setup
See [SETUP_GUIDE.md](./SETUP_GUIDE.md#email-otp-setup) for step-by-step instructions.

### Cloudflare Turnstile Setup
See [SETUP_GUIDE.md](./SETUP_GUIDE.md#cloudflare-turnstile-setup-optional---bot-protection) for step-by-step instructions.

## 🔐 Default Admin Account

After seeding, login with:
- **Email**: `admin@example.com` (or as set in `.env`)
- **Password**: `Admin123!` (or as set in `.env`)

**⚠️ Change this password after first login!**

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user (creates 'user' role, sends OTP)
- `POST /api/auth/login` - Login user (requires verified email)
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

## 🎨 Frontend Features

- Modern, sleek login/register UI
- Real-time password strength indicator
- OTP verification screen
- Cloudflare Turnstile integration
- Responsive design (mobile-friendly)
- Dark mode support
- Black, white, gray color theme

## 📝 Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/themeplate

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000

# Admin Seeding
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
SEED_DB=true

# Email OTP (Required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
APP_NAME=RBAC Auth

# Cloudflare Turnstile (Optional)
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api

# Cloudflare Turnstile (Optional)
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

## 🛠️ Technologies

**Backend:**
- Express.js
- MongoDB with Mongoose
- JWT (jsonwebtoken)
- Passport.js (Google OAuth)
- bcryptjs
- nodemailer

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- React Router DOM

## 📚 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions for Google OAuth and Email OTP
- [backend/README.md](./backend/README.md) - Backend API documentation
- [frontend/README.md](./frontend/README.md) - Frontend documentation

## 🔒 Security Notes

- Passwords are hashed with bcrypt before storage
- JWT tokens expire after 7 days (configurable)
- OTP codes expire after 10 minutes
- Email verification required before login
- Strong password requirements enforced
- Cloudflare Turnstile bot protection (optional)
- Admin account created via secure seeding

## 📄 License

ISC
