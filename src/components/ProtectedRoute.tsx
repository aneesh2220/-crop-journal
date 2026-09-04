import { Navigate, Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/ui/States'
import { Button } from '@/components/ui/Button'

export function ProtectedRoute() {
  const { session, loading, configured } = useAuth()

  if (!configured) return <Outlet />
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { session, loading, configured, isGuest } = useAuth()

  // A guest (anonymous) session shouldn't block reaching /login or /signup —
  // that's exactly how a guest upgrades to a real account.
  if (configured && !loading && session && !isGuest) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Gates farm-data features (Dashboard, My Farm, Tasks, etc.) behind a real account — guests see an upgrade prompt instead of the page. */
export function RequireFullAccount() {
  const { session, loading, configured, isGuest } = useAuth()
  const { t } = useTranslation()

  if (!configured) return <Outlet />
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  if (isGuest) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center animate-fade-in">
        <div className="rounded-full bg-brand-100 p-4 dark:bg-brand-900/30">
          <UserPlus className="text-brand-600" size={26} />
        </div>
        <h2 className="text-lg font-bold text-[var(--text)]">{t('auth.guestGateTitle')}</h2>
        <p className="max-w-sm text-sm text-[var(--text-muted)]">{t('auth.guestGateBody')}</p>
        <div className="flex gap-3">
          <Link to="/signup">
            <Button>{t('auth.signup')}</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">{t('auth.login')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <Outlet />
}
