import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, LogOut, Settings, User, UserPlus } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { useUnreadNotifications } from '@/hooks/useNotifications'

export function TopBar() {
  const { t } = useTranslation()
  const { profile, user, isGuest, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = useUnreadNotifications()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const displayName = isGuest ? t('auth.guestLabel') : profile?.full_name || user?.email || user?.phone || ''
  const initial = isGuest ? '?' : displayName.charAt(0).toUpperCase() || 'A'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]/90 px-4 backdrop-blur sm:px-6">
      <div className="lg:hidden flex items-center gap-2 font-bold text-[var(--text)]">
        <span>{t('common.appName')}</span>
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher compact />
        <ThemeToggle />
        <Link
          to="/notifications"
          aria-label={t('nav.notifications')}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-brand-950">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
          >
            {initial}
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl animate-fade-in">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <p className="truncate text-sm font-semibold text-[var(--text)]">{displayName}</p>
              </div>
              {isGuest && (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/signup')
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-[var(--surface-muted)]"
                >
                  <UserPlus size={16} /> {t('auth.createAccount')}
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/settings')
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface-muted)]"
              >
                <User size={16} /> {t('nav.settings')}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/settings')
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface-muted)]"
              >
                <Settings size={16} /> {t('settings.title')}
              </button>
              <button
                onClick={async () => {
                  setMenuOpen(false)
                  await signOut()
                  navigate('/login')
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut size={16} /> {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
