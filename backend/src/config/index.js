require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/themeplate',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  // Email configuration
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: process.env.SMTP_PORT || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  appName: process.env.APP_NAME || 'RBAC Auth',
  // Cloudflare Turnstile
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
  // AI Chatbot Configuration
  aiProvider: process.env.AI_PROVIDER || 'groq', // Default to Groq (free tier)
  aiApiKey: process.env.AI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
};

