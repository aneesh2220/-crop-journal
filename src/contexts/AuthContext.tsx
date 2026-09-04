import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  configured: boolean
  /** True for a guest session (Supabase anonymous auth) — a real auth.uid() with no email/password. */
  isGuest: boolean
  signInWithPassword: (identifier: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signInAsGuest: () => Promise<{ error: string | null }>
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data ?? null)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signInWithPassword: AuthContextValue['signInWithPassword'] = async (identifier, password) => {
    const isEmail = identifier.includes('@')
    const { error } = isEmail
      ? await supabase.auth.signInWithPassword({ email: identifier, password })
      : await supabase.auth.signInWithPassword({ phone: identifier, password })
    return { error: error?.message ?? null }
  }

  const signUpWithEmail: AuthContextValue['signUpWithEmail'] = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: error?.message ?? null }
  }

  const signInWithGoogle: AuthContextValue['signInWithGoogle'] = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    return { error: error?.message ?? null }
  }

  const signInAsGuest: AuthContextValue['signInAsGuest'] = async () => {
    const { error } = await supabase.auth.signInAnonymously()
    return { error: error?.message ?? null }
  }

  const sendPasswordReset: AuthContextValue['sendPasswordReset'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id)
  }

  const updateProfile: AuthContextValue['updateProfile'] = async (patch) => {
    if (!session?.user) return { error: 'Not signed in' }
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id)
    if (!error) setProfile((prev) => (prev ? { ...prev, ...patch } : prev))
    return { error: error?.message ?? null }
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      configured: isSupabaseConfigured,
      isGuest: session?.user?.is_anonymous ?? false,
      signInWithPassword,
      signUpWithEmail,
      signInWithGoogle,
      signInAsGuest,
      sendPasswordReset,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [session, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
