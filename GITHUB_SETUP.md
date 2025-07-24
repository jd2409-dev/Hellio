# GitHub Setup Guide

This guide will help you push your NexusLearn AI project to GitHub.

## Prerequisites

1. A GitHub account
2. Git installed (already available in Replit)
3. Your project files ready (✅ Already done!)

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `nexuslearn-ai` (or your preferred name)
   - **Description**: "AI-powered educational platform with gamification and Supabase integration"
   - **Visibility**: Choose Public or Private
   - **Don't initialize** with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Set up Git and Push to GitHub

In your Replit terminal, run these commands:

```bash
# Configure Git (replace with your GitHub details)
git config --global user.name "Your GitHub Username"
git config --global user.email "your.email@example.com"

# Remove any existing Git locks (if needed)
rm -f .git/index.lock .git/config.lock

# Initialize Git repository (if not already done)
git init

# Add all files to Git
git add .

# Create initial commit
git commit -m "Initial commit: NexusLearn AI with Supabase integration

Features:
- Complete educational platform with AI tutoring
- Supabase database integration with CRUD operations
- Supabase authentication with email/password
- Gamification system with XP, coins, and achievements
- Interactive demos and comprehensive documentation
- React + TypeScript + TailwindCSS frontend
- Express.js + Drizzle ORM backend"

# Add your GitHub repository as remote (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/nexuslearn-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify Upload

1. Go to your GitHub repository page
2. You should see all your project files including:
   - `README.md` - Comprehensive project documentation
   - `SUPABASE_SETUP.md` - Database setup instructions
   - `LICENSE` - MIT license
   - `.gitignore` - Proper file exclusions
   - All source code in `client/`, `server/`, and `shared/` directories

## Step 4: Set up Environment Variables

### For Local Development
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Fill in your actual values in `.env`
3. Never commit `.env` to Git (it's already in .gitignore)

### For GitHub Actions CI/CD (Optional)
If you want to use GitHub Actions:

1. Go to your repository settings
2. Click "Secrets and variables" → "Actions"  
3. Add these repository secrets:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `SESSION_SECRET` - Random string (32+ characters)
   - `VITE_SUPABASE_URL` - Your Supabase project URL (optional)
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key (optional)

### For Production Deployment
Configure these environment variables on your hosting platform:
- **Replit**: Use the Secrets tab
- **Vercel**: Project Settings → Environment Variables
- **Railway**: Variables tab in your project
- **Heroku**: Settings → Config Vars

## Troubleshooting

### If you get "Repository already exists" error:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/your-repo-name.git
git push -u origin main
```

### If you get authentication errors:
1. Make sure you're using the correct GitHub username and email
2. You may need to use a Personal Access Token instead of password
3. Go to GitHub Settings → Developer settings → Personal access tokens
4. Generate a new token with repo permissions
5. Use the token as your password when prompted

### If there are Git lock files:
```bash
rm -f .git/index.lock .git/config.lock
git status
```

## Repository Features

Your repository now includes:

### ✅ Complete Documentation
- **README.md**: Comprehensive project overview
- **SUPABASE_SETUP.md**: Database and auth setup
- **GITHUB_SETUP.md**: This setup guide
- **replit.md**: Technical architecture documentation

### ✅ Proper Project Structure
- Clean separation of client/server code
- Shared types and schemas
- Professional .gitignore
- MIT license

### ✅ Supabase Integration
- Database CRUD operations demo
- Complete authentication system
- React hooks for auth state management
- SQL schemas and security policies

### ✅ Educational Platform Features
- AI-powered tutoring
- Gamification system
- Interactive quizzes
- Study planning
- Progress analytics

## Next Steps

1. **Star your repository** to make it easier to find
2. **Add topics/tags** to help others discover your project
3. **Create a release** when you reach major milestones
4. **Set up branch protection** for collaborative development
5. **Add contributing guidelines** if you want community contributions

## Deployment Options

Your repository can be deployed to:
- **Replit** (current setup)
- **Vercel** (add vercel.json configuration)
- **Netlify** (for static deployment)
- **Railway** (for full-stack deployment)
- **Heroku** (with Procfile)

Congratulations! Your NexusLearn AI project is now on GitHub and ready for the world to see! 🎉