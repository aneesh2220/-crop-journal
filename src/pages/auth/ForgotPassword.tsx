import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const { sendPasswordReset, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await sendPasswordReset(email)
    setLoading(false)
    if (error) setError(error)
    else setSent(true)
  }

  return (
    <AuthLayout>
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="rounded-full bg-brand-100 p-4 dark:bg-brand-900/30">
            <CheckCircle2 className="text-brand-600" size={32} />
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">{t('auth.checkYourEmail')}</h1>
          <p className="text-sm text-[var(--text-muted)]">{email}</p>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{t('auth.resetPassword')}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!configured}>
              {t('auth.sendResetLink')}
            </Button>
          </form>
        </>
      )}
      <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft size={14} /> {t('auth.login')}
      </Link>
    </AuthLayout>
  )
}
