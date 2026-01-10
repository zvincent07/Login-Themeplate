# Setup Guide - Google OAuth & OTP Email Verification

Complete guide to set up Google OAuth login and Email OTP verification for the RBAC Authentication System.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google OAuth Setup](#google-oauth-setup)
3. [Email OTP Setup](#email-otp-setup)
4. [Quick Start](#quick-start)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js installed
- MongoDB running locally or connection string
- Google account (for OAuth)
- Email account (for OTP - Gmail recommended)

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `RBAC Auth App`
4. Click **"Create"**

### Step 2: Enable Google+ API

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** → Click **"Create"**
3. Fill in the form:
   - **App name**: `RBAC Auth App`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"**
5. **Scopes**: Click **"Add or Remove Scopes"**
   - Select: `userinfo.email` and `userinfo.profile`
   - Click **"Update"** → **"Save and Continue"**
6. **Test users**: Add your email address
7. Click **"Save and Continue"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Fill in:
   - **Name**: `RBAC Auth Web Client`
   - **Authorized redirect URIs**: 
     ```
     http://localhost:5000/api/auth/google/callback
     ```
5. Click **"Create"**
6. **Copy** the **Client ID** and **Client Secret**

### Step 5: Add to Backend .env

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### Step 6: Test Google OAuth

1. Restart backend server
2. Click **"Sign in with Google"** on login/register page
3. You should be redirected to Google login
4. After authorization, you'll be redirected back and logged in

**✅ Google OAuth is now configured!**

---

## Email OTP Setup

### Option 1: Gmail (Recommended for Development)

#### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **"2-Step Verification"**
3. Follow the setup wizard

#### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **"Mail"** → **"Other (Custom name)"**
3. Enter name: `RBAC Auth`
4. Click **"Generate"**
5. **Copy the 16-character password** (spaces don't matter)

#### Step 3: Add to Backend .env

Add to `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
APP_NAME=RBAC Auth
```

**Important**: Use the **App Password**, not your regular Gmail password!

#### Step 4: Test Email OTP

1. Restart backend server
2. Register a new account
3. Check your email inbox for the OTP code
4. Enter the OTP to verify your account

**✅ Email OTP is now configured!**

---

### Option 2: Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### Custom SMTP
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env and add your credentials:
# - MongoDB URI
# - JWT Secret
# - Google OAuth credentials (if using)
# - Email SMTP credentials (if using)

# Install dependencies
npm install

# Start server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Copy environment file (optional)
cp .env.example .env

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. First Admin Account

The backend automatically creates the first admin account on startup:

- **Email**: `admin@example.com` (or as set in `.env`)
- **Password**: `Admin123!` (or as set in `.env`)

**⚠️ Change this password after first login!**

---

## Troubleshooting

### Google OAuth Issues

**Error: `redirect_uri_mismatch`**
- Make sure the redirect URI in Google Cloud Console is **exactly**: `http://localhost:5000/api/auth/google/callback`
- No trailing slash, no spaces
- Must match exactly what's in your `.env` file
- Wait 1-2 minutes after saving in Google Cloud Console

**Error: `Access blocked: This app's request is invalid`**
- Make sure you added your email as a test user in OAuth consent screen
- For production, you need to verify your app with Google

### Email OTP Issues

**Error: `Failed to send verification email`**
- Check `SMTP_USER` and `SMTP_PASS` are set correctly
- For Gmail: Use App Password, not regular password
- Make sure 2-Step Verification is enabled
- Check backend console for detailed error messages

**Emails going to spam**
- This is normal for new senders
- Check spam/junk folder
- Consider using a transactional email service for production

**Can't generate Gmail App Password**
- Make sure 2-Step Verification is enabled first
- Try using a different browser
- Check if your Google account has restrictions

### General Issues

**Backend won't start**
- Check MongoDB is running: `mongod`
- Verify `.env` file exists and has correct values
- Check port 5000 is not already in use

**Frontend can't connect to backend**
- Make sure backend is running on port 5000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify CORS is enabled in backend

---

## Production Considerations

### Google OAuth
- Submit your app for verification (required for public use)
- Add production redirect URI: `https://yourdomain.com/api/auth/google/callback`
- Use different OAuth credentials for production

### Email OTP
- Use a transactional email service (SendGrid, Mailgun, AWS SES)
- Don't use personal Gmail for production
- Set up proper SPF/DKIM records for your domain
- Monitor email delivery rates

### Security
- Change default admin password
- Use strong JWT secret
- Enable HTTPS in production
- Set `NODE_ENV=production`
- Use environment-specific `.env` files

---

---

## Cloudflare Turnstile Setup (Optional - Bot Protection)

Cloudflare Turnstile provides invisible bot protection for your login form.

### Step 1: Get Turnstile Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **"Turnstile"** in the sidebar
3. Click **"Add Site"**
4. Fill in:
   - **Site name**: `RBAC Auth`
   - **Domain**: `localhost` (for development)
   - **Widget mode**: `Managed` (invisible)
5. Click **"Create"**
6. Copy the **Site Key** and **Secret Key**

### Step 2: Add to Frontend .env

Add to `frontend/.env`:

```env
VITE_TURNSTILE_SITE_KEY=your-site-key-here
```

### Step 3: Add to Backend .env

Add to `backend/.env`:

```env
TURNSTILE_SECRET_KEY=your-secret-key-here
```

### Step 4: Test Turnstile

1. Restart both frontend and backend servers
2. Go to login page
3. The Turnstile widget will appear before the "Sign in" button
4. Complete the verification and try logging in

**Note**: If Turnstile keys are not configured, the widget will use a test key and verification will be skipped on the backend (for development).

---

## AI Chatbot Setup

The application includes an AI-powered chatbot on the login page. You can configure it to use Groq (FREE), OpenAI, or Anthropic Claude.

### Option 1: Groq (FREE - Recommended for Free Tier) ⭐

Groq offers a **generous free tier** with fast responses using open-source models like Llama 3.1.

#### Step 1: Get Groq API Key

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for a free account (no credit card required)
3. Navigate to **"API Keys"** → **"Create API Key"**
4. Copy the API key

**Note**: Groq offers free API access with generous rate limits - perfect for development and small-scale production!

#### Step 2: Add to Backend .env

Add to `backend/.env`:

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_your-groq-api-key-here
GROQ_MODEL=llama-3.1-8b-instant
```

**Available Models**:
- `llama-3.1-8b-instant` (default, fastest, free tier)
- `llama-3.1-70b-versatile` (more capable, still free)
- `mixtral-8x7b-32768` (good balance)
- `gemma-7b-it` (Google's Gemma model)

#### Step 3: Test Chatbot

1. Restart backend server
2. Go to login page
3. Click the chatbot icon in the bottom-right corner
4. Send a message and verify AI responses

**✅ Groq Chatbot is now configured!**

### Option 2: OpenAI (Paid)

#### Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **"API Keys"** → **"Create new secret key"**
4. Copy the API key (you won't be able to see it again)

#### Step 2: Add to Backend .env

Add to `backend/.env`:

```env
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

**Available Models**:
- `gpt-3.5-turbo` (default, cost-effective)
- `gpt-4` (more capable, higher cost)
- `gpt-4-turbo` (latest, best performance)

#### Step 3: Test Chatbot

1. Restart backend server
2. Go to login page
3. Click the chatbot icon in the bottom-right corner
4. Send a message and verify AI responses

**✅ OpenAI Chatbot is now configured!**

### Option 2: Anthropic Claude

#### Step 1: Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **"API Keys"** → **"Create Key"**
4. Copy the API key

#### Step 2: Add to Backend .env

Add to `backend/.env`:

```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

**Available Models**:
- `claude-3-haiku-20240307` (default, fastest, cost-effective)
- `claude-3-sonnet-20240229` (balanced)
- `claude-3-opus-20240229` (most capable)

#### Step 3: Test Chatbot

1. Restart backend server
2. Go to login page
3. Click the chatbot icon in the bottom-right corner
4. Send a message and verify AI responses

**✅ Anthropic Chatbot is now configured!**

### Cost Comparison

| Provider | Cost | Free Tier | Speed | Best For |
|----------|------|-----------|-------|----------|
| **Groq** | FREE ⭐ | Generous limits | Very Fast | Development, small projects |
| **OpenAI** | Paid | Limited credits | Fast | Production, best quality |
| **Anthropic** | Paid | Limited credits | Medium | Complex reasoning |

**Recommendation**: Start with **Groq** (free) for development, then switch to OpenAI/Anthropic for production if needed.

### Fallback Behavior

If AI API keys are not configured, the chatbot will:
- Still be visible and functional
- Return helpful fallback responses
- Display a message about configuration needed

**Note**: The chatbot works without authentication, making it accessible to all users for support.

---

## Summary

✅ **Google OAuth**: Configured in Google Cloud Console → Add credentials to `.env`  
✅ **Email OTP**: Generate Gmail App Password → Add to `.env`  
✅ **Cloudflare Turnstile**: Get keys from Cloudflare Dashboard → Add to `.env`  
✅ **AI Chatbot**: Get API key from Groq (FREE)/OpenAI/Anthropic → Add to `.env`  
✅ **All features**: Restart backend server → Test registration/login

For detailed API documentation, see `README.md`.
