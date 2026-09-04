import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { BrandMark } from '@/components/BrandMark'
import { NAV_ITEMS } from './nav'

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <BrandMark size={36} />
        <span className="text-lg font-bold tracking-tight text-[var(--text)]">{t('common.appName')}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
              )
            }
          >
            <item.icon size={18} />
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
