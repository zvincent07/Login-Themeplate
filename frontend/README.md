# Frontend

React + Vite frontend application for the RBAC Authentication System.

## Folder Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── Login.jsx    # Login page with Turnstile
│   │   └── Register.jsx # Registration with OTP flow
│   ├── config/          # Configuration files
│   │   └── api.js       # API endpoints configuration
│   ├── services/        # API service layer
│   │   ├── api.js       # Generic API client
│   │   └── authService.js
│   ├── utils/           # Utility functions
│   │   └── passwordStrength.js
│   ├── App.jsx          # Main App component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global Tailwind styles
├── public/              # Static assets
├── .env.example         # Environment variables template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── package.json
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
   - `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:5000/api)
   - `VITE_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key (optional)

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`.

## Features

- ✅ Modern, sleek login/register UI
- ✅ Real-time password strength indicator
- ✅ OTP verification screen
- ✅ Cloudflare Turnstile integration
- ✅ Google OAuth login
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode support
- ✅ Black, white, gray color theme

## Components

### Login.jsx
- Email/password authentication
- Cloudflare Turnstile bot protection
- Google OAuth integration
- Remember me checkbox
- Forgot password link

### Register.jsx
- User registration form
- Password strength validation
- Email OTP verification flow
- Google OAuth integration

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (required)
- `VITE_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key (optional)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Styling

The project uses Tailwind CSS for styling with a custom black, white, and gray color theme. Dark mode is supported and automatically switches based on system preferences.
