import { useState, useEffect } from 'react'
import { authService, isSupabaseConfigured } from '@/lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured] = useState(isSupabaseConfigured())

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data, error } = await authService.getSession()
      if (!error && data.session) {
        setSession(data.session)
        setUser(data.session.user)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data } = authService.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      data?.subscription?.unsubscribe()
    }
  }, [isConfigured])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const result = await authService.signIn(email, password)
    setLoading(false)
    return result
  }

  const signUp = async (email: string, password: string, userData?: { firstName?: string, lastName?: string }) => {
    setLoading(true)
    const result = await authService.signUp(email, password, userData)
    setLoading(false)
    return result
  }

  const signOut = async () => {
    setLoading(true)
    const result = await authService.signOut()
    setUser(null)
    setSession(null)
    setLoading(false)
    return result
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}