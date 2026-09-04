import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
