import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Menu, X } from 'lucide-react'
import { NAV_ITEMS, MOBILE_PRIMARY_COUNT } from './nav'

export function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const primary = NAV_ITEMS.slice(0, MOBILE_PRIMARY_COUNT)
  const rest = NAV_ITEMS.slice(MOBILE_PRIMARY_COUNT)
  const restActive = rest.some((item) => location.pathname.startsWith(item.to))

  return (
    <>
      {moreOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 animate-fade-in lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg-elevated)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text)]">{t('nav.more')}</span>
            <button onClick={() => setMoreOpen(false)} aria-label="Close" className="rounded-full p-1.5 hover:bg-[var(--surface-muted)]">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {rest.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-colors',
                    isActive ? 'bg-[var(--accent)] text-[var(--accent-contrast)]' : 'bg-[var(--surface-muted)] text-[var(--text)]'
                  )
                }
              >
                <item.icon size={20} />
                <span className="text-center leading-tight">{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              )
            }
          >
            <item.icon size={20} />
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={clsx(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
            restActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
          )}
        >
          <Menu size={20} />
          <span>{t('nav.more')}</span>
        </button>
      </nav>
    </>
  )
}
