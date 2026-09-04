import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Bell, CloudSun, Droplets, ListChecks, LineChart, Info, Trash2, CheckCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, NotConnectedState, LoadingState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import type { NotificationType } from '@/lib/database.types'

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  weather: CloudSun,
  irrigation: Droplets,
  task: ListChecks,
  market: LineChart,
  system: Info,
}

export default function Notifications() {
  const { t } = useTranslation()
  const { configured } = useAuth()
  const { notifications, loading, markAllRead, markRead, clearAll } = useNotifications()

  if (!configured) {
    return (
      <div>
        <PageHeader title={t('notifications.title')} />
        <NotConnectedState />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        action={
          notifications.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllRead} icon={<CheckCheck size={15} />}>
                {t('notifications.markAllRead')}
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} icon={<Trash2 size={15} />}>
                {t('notifications.clearAll')}
              </Button>
            </div>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="text-[var(--text-muted)]" size={22} />} title={t('notifications.noNotifications')} />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type]
            return (
              <Card
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={clsx('flex cursor-pointer items-start gap-3 p-4!', !n.read && 'border-brand-300 bg-brand-50/50 dark:bg-brand-900/10')}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">{n.title}</p>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />}
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">{n.body}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
