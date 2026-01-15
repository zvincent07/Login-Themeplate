# RBAC Authentication System - MERN Stack

A comprehensive, production-ready Role-Based Access Control (RBAC) authentication system with Google OAuth, Email OTP verification, and a full-featured admin dashboard.

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
- ✅ Cursor movement-based bot detection with IP banning
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Permission-based access control (PBAC) - Granular permissions system
- ✅ Role-based access control (RBAC) - Role hierarchy
- ✅ Protected routes with middleware
- ✅ IP whitelisting/blacklisting
- ✅ Session management
- ✅ Audit logging for all critical actions
- ✅ Two-factor authentication (2FA/MFA) support

### Admin Dashboard Features

A comprehensive admin dashboard with organized navigation:

#### Main
- **Dashboard** - Overview with statistics and key metrics
- **CMS** - Content Management System for public-facing content

#### Access Control
- **Users** - Complete user management (create, edit, delete, activate/deactivate, bulk operations)
- **Roles** - Role-based access control management
- **Permissions** - Granular permission management
- **Sessions** - Active session monitoring and management
- **Impersonation** - User impersonation for support/debugging

#### Security
- **2FA/MFA** - Two-factor authentication configuration
- **IP Management** - IP whitelisting and blacklisting
- **Audit Logs** - Comprehensive audit trail with IP and user agent tracking

#### System Health
- **Alerts** - System alerts and notifications
- **Error Logs** - Application error tracking
- **Maintenance Mode** - System maintenance controls
- **Job Queues** - Background job management

#### Settings
- **General Settings** - Site configuration, SEO, timezone, mail settings, white labeling
- **Billing** - Subscription plans, transactions, invoices, coupons
- **Email Templates** - Customizable transactional email templates
- **Backups & Cache** - Database backups and cache management

#### Developer Tools
- **Feature Flags** - Feature toggle management
- **API Management** - API endpoint documentation and testing
- **Global Variables** - System-wide configuration variables
- **Export/Import** - Data export and import utilities
- **Version Display** - Application version information

### Frontend Architecture

#### Reusable Components
- **Modal** - Consistent modal dialogs with keyboard support
- **Table** - Data tables with sorting, filtering, and selection
- **FormField** - Standardized form field wrapper
- **Badge** - Status and category badges
- **Card** - Content card components
- **DropdownMenu** - Context menus and dropdowns
- **PasswordInput** - Password input with visibility toggle
- **Pagination** - Page navigation component
- **Button** - Consistent button styling
- **PermissionGate** - Conditional rendering based on permissions
- **PermissionButton** - Permission-aware buttons

#### Custom Hooks
- **useOptimisticUpdate** - Optimistic UI updates with automatic rollback
- **useUserManagement** - User CRUD operations
- **useUserFilters** - User filtering and pagination
- **useUserSessions** - Session management

#### Optimistic UI
- Instant feedback on user actions
- Automatic rollback on errors
- Consistent UX across all mutations

### Backend Architecture

#### Repository Pattern
- **userRepository** - User data access
- **roleRepository** - Role data access
- **sessionRepository** - Session data access
- **auditLogRepository** - Audit log data access
- **bannedIPRepository** - IP management
- **loginAttemptRepository** - Login attempt tracking
- **permissionRepository** - Permission data access

#### Service Layer
- **userService** - User business logic
- **authService** - Authentication logic
- **roleService** - Role management
- **auditLogService** - Audit logging
- **dashboardService** - Dashboard statistics
- **chatbotService** - AI chatbot integration

#### API Versioning
- All APIs use `/api/v1/` prefix
- Backward compatibility maintained
- Clean separation of concerns

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
# See [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) for detailed instructions

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
See [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md#google-oauth-setup) for step-by-step instructions.

### Email OTP Setup
See [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md#email-otp-setup) for step-by-step instructions.


## 🔐 Default Admin Account

After seeding, login with:
- **Email**: `admin@example.com` (or as set in `.env`)
- **Password**: `Admin123!` (or as set in `.env`)

**⚠️ Change this password after first login!**

## 📡 API Endpoints

All endpoints use `/api/v1/` prefix for versioning.

### Authentication (`/api/v1/auth`)

- `POST /api/v1/auth/register` - Register new user (creates 'user' role, sends OTP)
- `POST /api/v1/auth/login` - Login user (requires verified email)
- `POST /api/v1/auth/verify-otp` - Verify OTP and activate account
- `POST /api/v1/auth/resend-otp` - Resend OTP code
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/auth/logout` - Logout user (protected)
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google OAuth callback
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

### Users (`/api/v1/users`)

- `GET /api/v1/users` - Get all users (permission: `users:read`)
- `GET /api/v1/users/:id` - Get single user (permission: `users:read`)
- `POST /api/v1/users` - Create user (permission: `users:create`)
- `PUT /api/v1/users/:id` - Update user (permission: `users:update`)
- `DELETE /api/v1/users/:id` - Delete user (permission: `users:delete`)
- `POST /api/v1/users/:id/restore` - Restore deleted user (permission: `users:restore`)
- `GET /api/v1/users/stats` - Get user statistics (permission: `dashboard:view`)
- `GET /api/v1/users/:id/sessions` - Get user sessions (permission: `users:view-sessions`)
- `DELETE /api/v1/users/:id/sessions/:sessionId` - Terminate session (permission: `users:terminate-sessions`)

### Roles (`/api/v1/roles`)

- `GET /api/v1/roles` - Get all roles (permission: `roles:read`)
- `GET /api/v1/roles/:id` - Get single role (permission: `roles:read`)
- `POST /api/v1/roles` - Create role (permission: `roles:create`)
- `PUT /api/v1/roles/:id` - Update role (permission: `roles:update`)
- `DELETE /api/v1/roles/:id` - Delete role (permission: `roles:delete`)
- `PUT /api/v1/roles/:id/permissions` - Update role permissions (permission: `roles:update`)

### Audit Logs (`/api/v1/audit-logs`)

- `GET /api/v1/audit-logs` - Get audit logs (permission: `audit-logs:read`)
- `GET /api/v1/audit-logs/:id` - Get single audit log (permission: `audit-logs:read`)

### Dashboard (`/api/v1/dashboard`)

- `GET /api/v1/dashboard/stats` - Get dashboard statistics (permission: `dashboard:view`)

All endpoints use permission-based authorization. See [backend/README.md](./backend/README.md) for complete API documentation.

## 🎨 Frontend Features

### User Interface
- Modern, sleek login/register UI
- Real-time password strength indicator
- OTP verification screen
- Cursor movement tracking for bot detection
- Responsive design (mobile-friendly)
- Dark mode support with theme toggle
- Consistent design system with reusable components

### Admin Dashboard
- Comprehensive admin interface with organized navigation
- Permission-aware UI components
- Optimistic UI updates for instant feedback
- Advanced filtering and search capabilities
- Bulk operations support
- Real-time statistics and metrics
- Detailed audit trail visualization
- Session management interface
- User impersonation capabilities

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

```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api

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

### Setup & Configuration
- [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) - Detailed setup instructions for Google OAuth and Email OTP
- [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) - Testing setup and best practices

### Architecture & Development
- [docs/CURSOR_RULES_APPLICATION.md](./docs/CURSOR_RULES_APPLICATION.md) - Cursor rules application status
- [docs/FRONTEND_CURSOR_RULES_APPLICATION.md](./docs/FRONTEND_CURSOR_RULES_APPLICATION.md) - Frontend architecture rules
- [docs/FINAL_MIGRATION_SUMMARY.md](./docs/FINAL_MIGRATION_SUMMARY.md) - Complete migration summary
- [docs/REUSABLE_COMPONENTS_GUIDE.md](./docs/REUSABLE_COMPONENTS_GUIDE.md) - Reusable components usage guide
- [docs/OPTIMISTIC_UI_GUIDE.md](./docs/OPTIMISTIC_UI_GUIDE.md) - Optimistic UI patterns

### API Documentation
- [backend/README.md](./backend/README.md) - Backend API documentation
- [frontend/README.md](./frontend/README.md) - Frontend documentation

### Additional Resources
- [docs/TYPESCRIPT_MIGRATION.md](./docs/TYPESCRIPT_MIGRATION.md) - TypeScript migration guide
- [docs/IMPROVEMENTS.md](./docs/IMPROVEMENTS.md) - Code improvements summary
- [docs/PROJECT_ANALYSIS.md](./docs/PROJECT_ANALYSIS.md) - Comprehensive project analysis

## 🔒 Security Notes

- Passwords are hashed with bcrypt before storage
- JWT tokens expire after 7 days (configurable)
- OTP codes expire after 10 minutes
- Email verification required before login
- Strong password requirements enforced
- Cursor movement-based bot detection with IP banning
- Admin account created via secure seeding
- Permission-based authorization (granular access control)
- Audit logging for all critical actions
- IP and User Agent tracking for security monitoring
- Session management with termination capabilities
- Soft delete for data recovery

## 🏗️ Architecture

### Backend Architecture
- **Repository Pattern** - Data access layer abstraction
- **Service Layer** - Business logic and permission enforcement
- **Controller Layer** - Thin controllers (parse request → call service → return response)
- **Middleware** - Authentication, authorization, validation, error handling
- **API Versioning** - `/api/v1/` prefix for future compatibility

### Frontend Architecture
- **Component-Based** - Reusable UI components
- **Service Layer** - API calls abstracted from components
- **Custom Hooks** - Business logic and state management
- **Permission System** - Frontend permission checks mirror backend
- **Optimistic UI** - Instant feedback with automatic rollback

### Code Quality
- Consistent coding standards enforced via `.cursorrules`
- Separation of concerns (components, services, hooks)
- No direct API calls in components
- Business logic in services/hooks
- Permission-aware components
- Comprehensive error handling

## 🚦 Project Status

✅ **Production Ready** - All core features implemented and tested

### Completed Features
- ✅ Authentication system (Email/Password, Google OAuth, OTP)
- ✅ Permission-based access control
- ✅ Complete admin dashboard
- ✅ User management with bulk operations
- ✅ Role and permission management
- ✅ Audit logging system
- ✅ Session management
- ✅ Reusable component library
- ✅ Optimistic UI patterns
- ✅ API versioning (v1)
- ✅ Repository pattern implementation
- ✅ Service layer architecture

### Future Enhancements
- 🔄 General Settings implementation
- 🔄 Billing system implementation
- 🔄 Email template editor
- 🔄 Backup management system
- 🔄 CMS content editor
- 🔄 Feature flags implementation
- 🔄 API documentation interface

## 📄 License

ISC
