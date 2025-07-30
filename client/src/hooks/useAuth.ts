import { useState, useEffect } from 'react'
import { useQuery } from "@tanstack/react-query";
import { authService, isSupabaseConfigured } from '@/lib/supabaseService'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured] = useState(isSupabaseConfigured())

  // Get user data from server API (for database user info)
  const { data: dbUser, isLoading: dbUserLoading, refetch: refetchUser } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!session?.access_token,
    meta: {
      headers: {
        Authorization: `Bearer ${session?.access_token}`
      }
    }
  });

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
        setSupabaseUser(data.session.user)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data } = authService.onAuthStateChange((event, session) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      setLoading(false)
      
      // Refetch user data when session changes
      if (session?.access_token) {
        refetchUser()
      }
    })

    return () => {
      data?.subscription?.unsubscribe()
    }
  }, [isConfigured, refetchUser])

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
    setSupabaseUser(null)
    setSession(null)
    setLoading(false)
    return result
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  return {
    user: dbUser || supabaseUser,
    supabaseUser,
    dbUser,
    session,
    isLoading: loading || dbUserLoading,
    isAuthenticated: !!supabaseUser && !!session,
    isConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refetchUser
  }
}
