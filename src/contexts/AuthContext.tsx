import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { withTimeout } from '@/lib/functionsError'
import type { Profile } from '@/lib/database.types'

const AUTH_TIMEOUT_MS = 20_000

/** Browsers word a dropped connection differently ("Failed to fetch" in Chrome, "Load failed" in Safari). */
function friendlyAuthMessage(message: string): string {
  if (/failed to fetch|load failed|networkerror|network request failed/i.test(message)) {
    return "Can't reach AgroAI right now. Check your internet connection and try again."
  }
  return message
}

/**
 * Runs one auth call so it can never leave a login button spinning forever: it is
 * time-limited, a thrown network error becomes a message instead of an unhandled
 * rejection, and the browser's raw "Failed to fetch" is made readable.
 */
async function guardedAuth(run: () => Promise<{ error: { message: string } | null }>): Promise<{ error: string | null }> {
  try {
    const { error } = await withTimeout(run(), AUTH_TIMEOUT_MS)
    return { error: error ? friendlyAuthMessage(error.message) : null }
  } catch (err) {
    return { error: friendlyAuthMessage(err instanceof Error ? err.message : String(err)) }
  }
}

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

    // If this never settles (offline, slow network), carry on signed-out instead of
    // leaving every protected page on its loading spinner; onAuthStateChange below
    // still delivers the real session as soon as it is available.
    withTimeout(supabase.auth.getSession(), 15_000)
      .then(({ data }) => {
        setSession(data.session)
        if (data.session?.user) loadProfile(data.session.user.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

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
    return guardedAuth(() =>
      isEmail
        ? supabase.auth.signInWithPassword({ email: identifier, password })
        : supabase.auth.signInWithPassword({ phone: identifier, password })
    )
  }

  const signUpWithEmail: AuthContextValue['signUpWithEmail'] = async (email, password, fullName) =>
    guardedAuth(() =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
    )

  const signInWithGoogle: AuthContextValue['signInWithGoogle'] = async () =>
    guardedAuth(() =>
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
    )

  const signInAsGuest: AuthContextValue['signInAsGuest'] = async () =>
    guardedAuth(() => supabase.auth.signInAnonymously())

  const sendPasswordReset: AuthContextValue['sendPasswordReset'] = async (email) =>
    guardedAuth(() =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    )

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
