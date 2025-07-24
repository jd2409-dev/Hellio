# Environment Variables Setup Guide

This guide explains how to set up all the required environment variables for NexusLearn AI.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values** in the `.env` file
3. **Never commit `.env`** to version control (it's already in .gitignore)

## Required Variables

### DATABASE_URL
Your PostgreSQL database connection string.

**Format:**
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

**Examples:**
```bash
# Neon Database
DATABASE_URL=postgresql://user:pass@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require

# Local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexuslearn

# Supabase Database  
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres?sslmode=require
```

### GEMINI_API_KEY
Your Google Gemini AI API key for AI-powered features.

**How to get it:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

**Format:**
```
GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
```

### SESSION_SECRET
A random string used to encrypt user sessions. Must be 32+ characters.

**Generate a secure secret:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Manual example (change this!)
SESSION_SECRET=b8f4a5e2c9d3f7a1e6b2c8d4f9a3e7b1c5d8f2a6e9b3c7d1f4a8e2b5c9d6f3a7e1
```

## Optional Variables (Supabase Integration)

### VITE_SUPABASE_URL
Your Supabase project URL.

**How to get it:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL"

**Format:**
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

### VITE_SUPABASE_ANON_KEY
Your Supabase anonymous/public key.

**How to get it:**
1. In your Supabase project dashboard
2. Go to Settings → API  
3. Copy the "anon public" key

**Format:**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

## Auto-Configured Variables

These are automatically set by the platform:

### Replit Environment
```bash
REPL_ID=your-repl-id                    # Automatically set
REPLIT_DOMAINS=your-domain.replit.dev   # Automatically set  
PORT=5000                               # Default port
NODE_ENV=development                    # Environment mode
```

## Platform-Specific Setup

### Replit
1. Click the 🔒 **Secrets** tab in the sidebar
2. Add each variable as a new secret
3. The application will automatically use these values

### Local Development
1. Copy `.env.example` to `.env`
2. Fill in your values
3. Run `npm run dev`

### Vercel
1. Go to Project Settings → Environment Variables
2. Add each variable with its value
3. Deploy your project

### Railway
1. Open your project dashboard
2. Go to Variables tab
3. Add each environment variable

### Heroku
1. Go to your app dashboard
2. Settings → Config Vars
3. Add each variable

## Validation

The application will validate required environment variables on startup:

- ✅ **DATABASE_URL** - Database connection works
- ✅ **GEMINI_API_KEY** - AI services available  
- ✅ **SESSION_SECRET** - Session management secure
- ⚠️ **Supabase vars** - Optional, will show warnings if missing

## Security Best Practices

1. **Never commit** `.env` files to version control
2. **Use different keys** for development/production
3. **Rotate secrets** regularly in production
4. **Limit API key permissions** to only what's needed
5. **Monitor API usage** to detect unauthorized access

## Troubleshooting

### "DATABASE_URL must be set" Error
- Check that `DATABASE_URL` is properly set
- Verify the connection string format
- Test database connectivity

### "GEMINI_API_KEY not found" Error  
- Verify your Google AI Studio API key
- Check for extra spaces or quotes
- Ensure the key has proper permissions

### "Session secret required" Error
- Generate a new `SESSION_SECRET`
- Must be at least 32 characters long
- Use only letters, numbers, and special characters

### Supabase Connection Issues
- Verify `VITE_SUPABASE_URL` format
- Check `VITE_SUPABASE_ANON_KEY` is correct
- Ensure Supabase project is active

## Example Complete .env File

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# AI Services  
GEMINI_API_KEY=AIzaSyC-your-gemini-key

# Security
SESSION_SECRET=your-32-character-secret-here

# Supabase (Optional)
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Application
NODE_ENV=development
PORT=5000
```

Need help? Check the main README.md or SUPABASE_SETUP.md for more detailed setup instructions.