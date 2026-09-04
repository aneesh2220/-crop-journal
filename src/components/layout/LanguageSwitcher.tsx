import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { LANGUAGES } from '@/i18n/languages'
import { useAuth } from '@/contexts/AuthContext'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation()
  const { profile, updateProfile, configured } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  const selectLanguage = async (code: string) => {
    await i18n.changeLanguage(code)
    setOpen(false)
    if (configured && profile) await updateProfile({ language: code })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)]"
      >
        <Languages size={16} className="text-brand-600" />
        {!compact && <span className="max-w-[7rem] truncate">{current.nativeName}</span>}
        <ChevronDown size={14} className={compact ? '' : 'text-[var(--text-muted)]'} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-80 w-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1.5 shadow-xl animate-fade-in scrollbar-thin">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)]"
            >
              <span className="flex flex-col">
                <span className="text-[var(--text)]">{lang.nativeName}</span>
                <span className="text-xs text-[var(--text-muted)]">{lang.name}</span>
              </span>
              {lang.code === current.code && <Check size={16} className="text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
