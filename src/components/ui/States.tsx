import { AlertTriangle, Inbox, PlugZap, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { Spinner } from './Spinner'

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--text-muted)] animate-fade-in">
      <Spinner size={28} />
      <p className="text-sm">{label ?? t('common.loading')}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-fade-in">
      <div className="rounded-full bg-red-100 p-3 dark:bg-red-950/40">
        <AlertTriangle className="text-red-500" size={24} />
      </div>
      <p className="text-sm font-medium text-[var(--text)]">{message ?? t('common.error')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw size={14} />}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-fade-in">
      <div className="rounded-full bg-[var(--surface-muted)] p-4">
        {icon ?? <Inbox className="text-[var(--text-muted)]" size={24} />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        {description && <p className="max-w-xs text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Shown when a feature depends on an API key the app owner hasn't configured yet — never fake data. */
export function NotConnectedState({ label }: { label?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] py-14 text-center animate-fade-in">
      <div className="rounded-full bg-gold-100 p-3 dark:bg-gold-900/20">
        <PlugZap className="text-gold-600" size={22} />
      </div>
      <div className="space-y-1 px-6">
        <p className="text-sm font-semibold text-[var(--text)]">{label ?? t('common.notConnected')}</p>
        <p className="max-w-xs text-sm text-[var(--text-muted)]">{t('common.notConnectedDesc')}</p>
      </div>
    </div>
  )
}
