import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, CheckCircle2 } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function ResetPassword() {
  const { t } = useTranslation()
  const { configured } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="rounded-full bg-brand-100 p-4 dark:bg-brand-900/30">
            <CheckCircle2 className="text-brand-600" size={32} />
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">Password updated</h1>
          <Button onClick={() => navigate('/login')}>{t('auth.login')}</Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">{t('auth.resetPassword')}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Choose a new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('auth.password')}
          type="password"
          required
          icon={<Lock size={17} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!configured}>
          {t('auth.resetPassword')}
        </Button>
      </form>
    </AuthLayout>
  )
}
