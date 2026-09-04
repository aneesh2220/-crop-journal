import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Phone, Eye, EyeOff, ArrowRight, Info } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signInWithPassword, signInWithGoogle, signInAsGuest, configured } = useAuth()

  const [mode, setMode] = useState<'email' | 'phone'>('email')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signInWithPassword(identifier, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/dashboard')
  }

  const handleGoogle = async () => {
    setError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    setGoogleLoading(false)
    if (error) setError(error)
  }

  const handleGuest = async () => {
    setError(null)
    setGuestLoading(true)
    const { error } = await signInAsGuest()
    setGuestLoading(false)
    if (error) setError(error)
    else navigate('/chat')
  }

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">{t('auth.welcomeBack')}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t('auth.signInToContinue')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'email' ? (
          <Input
            label={t('auth.email')}
            type="email"
            required
            icon={<Mail size={17} />}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        ) : (
          <Input
            label={t('auth.phone')}
            type="tel"
            required
            icon={<Phone size={17} />}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="+91 98765 43210"
            autoComplete="tel"
          />
        )}

        <Input
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          required
          icon={<Lock size={17} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          endAdornment={
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--text-muted)]">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setMode(mode === 'email' ? 'phone' : 'email')}
            className="font-medium text-brand-600 hover:underline"
          >
            {mode === 'email' ? t('auth.loginWithPhone') : t('auth.loginWithEmail')}
          </button>
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">{error}</p>}

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!configured}>
          {t('auth.login')}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs uppercase text-[var(--text-muted)]">{t('auth.or')}</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={handleGoogle}
        loading={googleLoading}
        disabled={!configured}
        icon={<GoogleIcon />}
      >
        {t('auth.continueWithGoogle')}
      </Button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        {t('auth.dontHaveAccount')}{' '}
        <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
          {t('auth.signup')}
        </Link>
      </p>

      <button
        onClick={handleGuest}
        disabled={guestLoading || !configured}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)] disabled:opacity-50"
      >
        {guestLoading ? t('common.loading') : t('auth.continueAsGuest')}
        {!guestLoading && <ArrowRight size={15} />}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs uppercase text-[var(--text-muted)]">{t('auth.newHere')}</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <Link to="/about" className="block">
        <Button variant="outline" className="w-full" size="lg" icon={<Info size={17} />}>
          {t('auth.aboutAgroAI')}
        </Button>
      </Link>
    </AuthLayout>
  )
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.3 0-13.6 4.1-16.9 10.1z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 34.9 26.9 36 24 36c-5.2 0-9.6-3.4-11.2-8.1l-6.6 5.1C9.4 39.6 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.5 36 44 30.6 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  )
}
