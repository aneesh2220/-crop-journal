import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Plus, Check, Trash2, Droplets, Sprout, SprayCan, Search, Scissors, ListTodo } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, NotConnectedState, LoadingState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useTasks } from '@/hooks/useTasks'
import type { TaskType, FarmTask } from '@/lib/database.types'

const TYPE_ICONS: Record<TaskType, React.ComponentType<{ size?: number; className?: string }>> = {
  irrigation: Droplets,
  fertilizer: Sprout,
  spraying: SprayCan,
  inspection: Search,
  harvesting: Scissors,
  other: ListTodo,
}

export default function Tasks() {
  const { t } = useTranslation()
  const { configured } = useAuth()
  const { tasks, loading, addTask, markDone, deleteTask } = useTasks()
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue'>('all')

  const now = new Date()
  const enriched = useMemo(
    () =>
      tasks.map((tk) => ({
        ...tk,
        computedStatus: tk.status === 'done' ? 'done' : new Date(tk.due_date) < now ? 'overdue' : 'upcoming',
      })),
    [tasks]
  )

  const filtered = enriched.filter((tk) => {
    if (filter === 'all') return true
    return tk.computedStatus === filter
  })

  if (!configured) {
    return (
      <div>
        <PageHeader title={t('tasks.title')} />
        <NotConnectedState />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('tasks.title')}
        action={
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>
            {t('tasks.addTask')}
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        {(['all', 'upcoming', 'overdue'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f ? 'bg-brand-600 text-white' : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
            )}
          >
            {f === 'all' ? t('common.seeAll') : f === 'upcoming' ? t('tasks.upcoming') : t('tasks.overdue')}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState title={t('common.noData')} />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((tk) => {
            const Icon = TYPE_ICONS[tk.type]
            return (
              <Card key={tk.id} className={clsx('flex items-center gap-3 p-4!', tk.status === 'done' && 'opacity-60')}>
                <div
                  className={clsx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    tk.computedStatus === 'overdue' ? 'bg-red-100 text-red-600 dark:bg-red-950/30' : 'bg-brand-100 text-brand-600 dark:bg-brand-900/30'
                  )}
                >
                  <Icon size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={clsx('truncate text-sm font-semibold text-[var(--text)]', tk.status === 'done' && 'line-through')}>{tk.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(tk.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {t(`tasks.taskType`)}: {tk.type}
                  </p>
                </div>
                {tk.status !== 'done' && (
                  <button
                    onClick={() => markDone(tk.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-brand-100 hover:text-brand-600"
                    aria-label={t('tasks.markDone')}
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteTask(tk.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={15} />
                </button>
              </Card>
            )
          })}
        </div>
      )}

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          await addTask(data)
          setModalOpen(false)
        }}
      />
    </div>
  )
}

function AddTaskModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<FarmTask> & { title: string; type: TaskType; due_date: string }) => void
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('irrigation')
  const [dueDate, setDueDate] = useState('')

  return (
    <Modal open={open} onClose={onClose} title={t('tasks.addTask')}>
      <div className="space-y-4">
        <Input label={t('common.add')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water the wheat field" />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text)]">{t('tasks.taskType')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[15px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {(['irrigation', 'fertilizer', 'spraying', 'inspection', 'harvesting', 'other'] as TaskType[]).map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
        </div>
        <Input label={t('tasks.dueDate')} type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <Button
          className="w-full"
          disabled={!title || !dueDate}
          onClick={() => {
            onSave({ title, type, due_date: new Date(dueDate).toISOString(), status: 'pending' })
            setTitle('')
            setDueDate('')
          }}
        >
          {t('common.save')}
        </Button>
      </div>
    </Modal>
  )
}
