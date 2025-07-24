import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create Supabase client only if credentials are available
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null
}

// Authentication functions
export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: { firstName?: string, lastName?: string }) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') }
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      return { data, error }
    } catch (error) {
      console.error('Error signing up:', error)
      return { data: null, error }
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') }
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      return { data, error }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error }
    }
  },

  // Sign out
  async signOut() {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error }
    }
  },

  // Get current user
  async getCurrentUser() {
    if (!supabase) {
      return { data: { user: null }, error: new Error('Supabase not configured') }
    }
    
    try {
      const { data, error } = await supabase.auth.getUser()
      return { data, error }
    } catch (error) {
      console.error('Error getting current user:', error)
      return { data: { user: null }, error }
    }
  },

  // Get current session
  async getSession() {
    if (!supabase) {
      return { data: { session: null }, error: new Error('Supabase not configured') }
    }
    
    try {
      const { data, error } = await supabase.auth.getSession()
      return { data, error }
    } catch (error) {
      console.error('Error getting session:', error)
      return { data: { session: null }, error }
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) {
      return { data: { subscription: null } }
    }
    
    const { data } = supabase.auth.onAuthStateChange(callback)
    return { data }
  },

  // Reset password
  async resetPassword(email: string) {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error) {
      console.error('Error resetting password:', error)
      return { error }
    }
  }
}

// User interface for type safety
export interface User {
  id?: string
  email: string
  firstName: string
  lastName: string
  profileImageUrl?: string
  xp?: number
  coins?: number
  level?: number
  studyStreak?: number
  createdAt?: string
  updatedAt?: string
}

// CRUD operations for users table
export const userService = {
  // Create a new user
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.') }
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating user:', error)
      return { data: null, error }
    }
  },

  // Get all users
  async getAllUsers() {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.') }
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('createdAt', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { data: null, error }
    }
  },

  // Get user by ID
  async getUserById(id: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.') }
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user:', error)
      return { data: null, error }
    }
  },

  // Get user by email
  async getUserByEmail(email: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.') }
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user by email:', error)
      return { data: null, error }
    }
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.') }
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating user:', error)
      return { data: null, error }
    }
  },

  // Delete user
  async deleteUser(id: string) {
    if (!supabase) {
      return { error: new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.') }
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { error }
    }
  },

  // Search users by name or email
  async searchUsers(query: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.') }
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`firstName.ilike.%${query}%,lastName.ilike.%${query}%,email.ilike.%${query}%`)
        .order('createdAt', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error searching users:', error)
      return { data: null, error }
    }
  }
}