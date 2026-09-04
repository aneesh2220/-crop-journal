import clsx from 'clsx'

export function ProgressBar({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'gold' }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]', className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-500', tone === 'brand' ? 'bg-brand-500' : 'bg-gold-400')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
