# Supabase Integration Setup Guide

This guide will help you set up Supabase integration for your NexusLearn AI platform with basic CRUD operations.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy your Project URL and public anon key

## Step 2: Set Environment Variables

Add these environment variables to your Replit project:

```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Note**: In Replit, you can add these in the Secrets tab (🔒 icon in the sidebar).

## Step 3: Create Database Tables

In your Supabase SQL Editor, run this SQL to create the necessary tables:

### Users Table (for CRUD demo)

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "profileImageUrl" TEXT,
  xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  "studyStreak" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (for demo purposes)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);
```

### Authentication Setup (for auth demo)

Authentication tables are automatically created by Supabase, but you need to configure:

1. **Email Settings**: Go to Authentication → Settings → SMTP Settings
2. **Enable Email Auth**: Make sure email authentication is enabled
3. **Configure Redirect URLs**: Add your Replit domain to allowed redirect URLs

```sql
-- Optional: Create a profile table linked to auth.users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles (users can only see/edit their own profile)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 4: Test the Integration

1. **CRUD Operations**: Access the demo page at `/supabase-demo` in your application
   - Try creating, reading, updating, and deleting users
   - Check your Supabase dashboard to see the data changes

2. **Authentication**: Access the auth demo at `/supabase-auth` in your application
   - Test user registration with email/password
   - Try signing in and signing out
   - Test password reset functionality

## Available Operations

### CRUD Operations
The integration provides these functions in `client/src/lib/supabaseClient.ts`:

- `userService.createUser(userData)` - Create a new user
- `userService.getAllUsers()` - Get all users
- `userService.getUserById(id)` - Get user by ID
- `userService.getUserByEmail(email)` - Get user by email
- `userService.updateUser(id, updates)` - Update user data
- `userService.deleteUser(id)` - Delete a user
- `userService.searchUsers(query)` - Search users by name or email

### Authentication Operations
The integration provides these functions in `client/src/lib/supabaseClient.ts`:

- `authService.signUp(email, password, userData)` - Register new user
- `authService.signIn(email, password)` - Sign in user
- `authService.signOut()` - Sign out current user
- `authService.getCurrentUser()` - Get current authenticated user
- `authService.getSession()` - Get current session
- `authService.resetPassword(email)` - Send password reset email
- `authService.onAuthStateChange(callback)` - Listen to auth changes

### React Hook
Use the `useSupabaseAuth()` hook for authentication state management:

- `user` - Current authenticated user
- `session` - Current session
- `loading` - Loading state
- `isAuthenticated` - Boolean auth status
- `signIn(email, password)` - Sign in function
- `signUp(email, password, userData)` - Sign up function
- `signOut()` - Sign out function

## Example Usage

```typescript
import { userService } from '@/lib/supabaseClient'

// Create a user
const { data, error } = await userService.createUser({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  xp: 100,
  coins: 50
})

if (error) {
  console.error('Error creating user:', error)
} else {
  console.log('User created:', data)
}

// Get all users
const { data: users, error: fetchError } = await userService.getAllUsers()
```

## Security Considerations

For production use:

1. Set up proper Row Level Security policies
2. Use Supabase Auth for user authentication
3. Validate data on both client and server sides
4. Use environment variables for sensitive configuration
5. Implement proper error handling and logging

## Troubleshooting

- **Connection Error**: Verify your SUPABASE_URL and SUPABASE_ANON_KEY are correct
- **Permission Denied**: Check your Row Level Security policies
- **Table Not Found**: Ensure the users table is created in your Supabase database
- **CORS Issues**: Make sure your domain is added to Supabase's allowed origins

## Next Steps

- Integrate Supabase Auth for user authentication
- Add real-time subscriptions for live updates
- Implement proper data validation with Zod schemas
- Add file storage capabilities with Supabase Storage
- Set up database triggers and functions for complex business logic