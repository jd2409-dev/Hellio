import { createClient } from '@supabase/supabase-js'

// Supabase configuration for client-side
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

// User interface for type safety
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  xp?: number
  coins?: number
  level?: number
  studyStreak?: number
  user_metadata?: any
  createdAt?: string
  updatedAt?: string
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

export default authService