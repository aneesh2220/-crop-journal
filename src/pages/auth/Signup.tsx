import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export default function Signup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUpWithEmail, signInWithGoogle, configured } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError(t('auth.confirmPassword') + ' ✗')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const { error } = await signUpWithEmail(email, password, fullName)
    setLoading(false)
    if (error) setError(error)
    else setDone(true)
  }

  const handleGoogle = async () => {
    setError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    setGoogleLoading(false)
    if (error) setError(error)
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="rounded-full bg-brand-100 p-4 dark:bg-brand-900/30">
            <CheckCircle2 className="text-brand-600" size={32} />
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">{t('auth.checkYourEmail')}</h1>
          <p className="text-sm text-[var(--text-muted)]">{email}</p>
          <Button variant="outline" onClick={() => navigate('/login')}>
            {t('auth.login')}
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">{t('auth.joinAgroAI')}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t('auth.startFarmingSmarter')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('auth.fullName')}
          required
          icon={<User size={17} />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
        <Input
          label={t('auth.email')}
          type="email"
          required
          icon={<Mail size={17} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Input
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          required
          icon={<Lock size={17} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          endAdornment={
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--text-muted)]">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />
        <Input
          label={t('auth.confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          required
          icon={<Lock size={17} />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">{error}</p>}

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!configured}>
          {t('auth.createAccount')}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs uppercase text-[var(--text-muted)]">{t('auth.or')}</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <Button variant="outline" className="w-full" size="lg" onClick={handleGoogle} loading={googleLoading} disabled={!configured}>
        {t('auth.continueWithGoogle')}
      </Button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          {t('auth.login')}
        </Link>
      </p>
    </AuthLayout>
  )
}
