import clsx from 'clsx'
import type { ReactNode } from 'react'

type Tone = 'brand' | 'gold' | 'neutral' | 'danger' | 'warning' | 'success'

const toneClasses: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200',
  gold: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300',
  neutral: 'bg-[var(--surface-muted)] text-[var(--text-muted)]',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', toneClasses[tone], className)}>
      {children}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const map = { low: 'success', medium: 'warning', high: 'danger' } as const
  return <Badge tone={map[severity]}>{severity.toUpperCase()}</Badge>
}
