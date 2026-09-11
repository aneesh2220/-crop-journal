import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button aria-label="Close" className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-2xl animate-slide-up sm:rounded-[2rem] sm:p-6 scrollbar-thin">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--surface-muted)]">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
