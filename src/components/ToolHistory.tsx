import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { History, ChevronDown, Trash2, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { ToolHistoryEntry } from '@/hooks/useToolHistory'

interface ToolHistoryProps<I, R> {
  entries: ToolHistoryEntry<I, R>[]
  onRemove: (id: string) => void
  onClear: () => void
  /** Headline of a collapsed row, usually the result's main finding. */
  title: (entry: ToolHistoryEntry<I, R>) => string
  /** One line describing what was entered. */
  subtitle: (entry: ToolHistoryEntry<I, R>) => string
  /** The full result, shown when a row is opened. */
  renderDetail: (entry: ToolHistoryEntry<I, R>) => ReactNode
  /** Puts an entry's inputs back into the form. Omit to hide the button. */
  onReuse?: (entry: ToolHistoryEntry<I, R>) => void
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

/** Past runs of a tool: what was entered and what came back, newest first. */
export function ToolHistory<I, R>({ entries, onRemove, onClear, title, subtitle, renderDetail, onReuse }: ToolHistoryProps<I, R>) {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)

  return (
    <Card className="mt-5 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-[17px] text-[var(--text)]">
            <History size={17} className="text-[var(--accent)]" />
            {t('history.title')}
            {entries.length > 0 && <span className="text-sm font-normal text-[var(--text-muted)]">({entries.length})</span>}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t('history.savedOnDevice')}</p>
        </div>
        {entries.length > 0 &&
          (confirmingClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">{t('history.clearConfirm')}</span>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  onClear()
                  setConfirmingClear(false)
                  setOpenId(null)
                }}
              >
                {t('common.delete')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmingClear(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setConfirmingClear(true)} className="text-[var(--text-muted)]">
              {t('history.clear')}
            </Button>
          ))}
      </div>

      {entries.length === 0 ? (
        <p className="border-t border-[var(--border)] px-5 py-8 text-center text-sm text-[var(--text-muted)]">{t('history.empty')}</p>
      ) : (
        <ul>
          {entries.map((entry) => {
            const open = openId === entry.id
            return (
              <li key={entry.id} className="border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : entry.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-muted)]"
                >
                  {entry.thumb && <img src={entry.thumb} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">{title(entry)}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{subtitle(entry)}</p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-[var(--text-muted)] sm:block">{formatWhen(entry.at)}</span>
                  <ChevronDown size={16} className={clsx('shrink-0 text-[var(--text-muted)] transition-transform', open && 'rotate-180')} />
                </button>
                {open && (
                  <div className="flex flex-col gap-4 px-5 pb-5 animate-fade-in">
                    <p className="text-xs text-[var(--text-muted)] sm:hidden">{formatWhen(entry.at)}</p>
                    {renderDetail(entry)}
                    <div className="flex flex-wrap gap-2">
                      {onReuse && (
                        <Button size="sm" variant="outline" icon={<RotateCcw size={14} />} onClick={() => onReuse(entry)}>
                          {t('history.reuse')}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => onRemove(entry.id)} className="text-[var(--text-muted)]">
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
