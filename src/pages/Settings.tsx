import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Sun, Moon, Monitor, MapPin, Bell, LogOut, Trash2, Check, Languages } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NotConnectedState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { LANGUAGES } from '@/i18n/languages'
import { useGeolocation } from '@/hooks/useGeolocation'
import { supabase } from '@/lib/supabase'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, profile, configured, updateProfile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const geo = useGeolocation()
  const [locationName, setLocationName] = useState(profile?.location_name ?? '')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  if (!configured) {
    return (
      <div>
        <PageHeader title={t('settings.title')} />
        <NotConnectedState />
      </div>
    )
  }

  const handleUseCurrentLocation = async () => {
    if (geo.lat === null || geo.lon === null) return
    setSaving(true)
    await updateProfile({ location_lat: geo.lat, location_lng: geo.lon })
    setSaving(false)
  }

  const handleSaveLocationName = async () => {
    setSaving(true)
    await updateProfile({ location_name: locationName })
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    // Deleting the auth user (not just the profile row) requires the service-role key,
    // which must never reach the browser — so this calls a server-side edge function.
    // All farm data cascade-deletes automatically once the auth user is removed.
    await supabase.functions.invoke('delete-account', { body: {} })
    await signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('settings.title')} />

      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
              {(profile?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">{profile?.full_name || '—'}</p>
              <p className="text-sm text-[var(--text-muted)]">{user?.email || user?.phone}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">
            <Languages size={15} /> {t('settings.language')}
          </h3>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto scrollbar-thin sm:grid-cols-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={async () => {
                  await i18n.changeLanguage(lang.code)
                  await updateProfile({ language: lang.code })
                }}
                className={clsx(
                  'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                  i18n.language === lang.code ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-[var(--border)] hover:bg-[var(--surface-muted)]'
                )}
              >
                <span className="truncate text-[var(--text)]">{lang.nativeName}</span>
                {i18n.language === lang.code && <Check size={14} className="shrink-0 text-brand-600" />}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{t('settings.theme')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: 'light', icon: Sun, label: t('settings.light') },
                { value: 'dark', icon: Moon, label: t('settings.dark') },
                { value: 'system', icon: Monitor, label: t('settings.system') },
              ] as { value: ThemePreference; icon: typeof Sun; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={clsx(
                  'flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
                  theme === opt.value ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300' : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-muted)]'
                )}
              >
                <opt.icon size={18} />
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">
            <MapPin size={15} /> {t('settings.location')}
          </h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Village, District, State" className="flex-1" />
              <Button variant="outline" onClick={handleSaveLocationName} loading={saving}>
                {t('common.save')}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleUseCurrentLocation} disabled={geo.loading || geo.lat === null}>
              {geo.loading ? t('common.loading') : 'Use current GPS location'}
            </Button>
            {profile?.location_lat && profile?.location_lng && (
              <p className="text-xs text-[var(--text-muted)]">
                {profile.location_lat.toFixed(3)}, {profile.location_lng.toFixed(3)}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{t('settings.units')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['metric', 'imperial'] as const).map((u) => (
              <button
                key={u}
                onClick={() => updateProfile({ units: u })}
                className={clsx(
                  'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                  profile?.units === u ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300' : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-muted)]'
                )}
              >
                {t(`settings.${u}`)}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <Bell size={17} className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text)]">{t('settings.notificationSettings')}</span>
            </div>
            <ToggleSwitch checked={profile?.notifications_enabled ?? true} onChange={(v) => updateProfile({ notifications_enabled: v })} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{t('settings.account')}</h3>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await signOut()
              navigate('/login')
            }}
            icon={<LogOut size={15} />}
          >
            {t('auth.logout')}
          </Button>
          <div className="mt-3">
            {deleteConfirm ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
                <p className="mb-2 text-sm text-red-700 dark:text-red-300">This permanently deletes your account and all farm data. Are you sure?</p>
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
                    {t('common.yes')}, {t('settings.deleteAccount')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => setDeleteConfirm(true)} icon={<Trash2 size={15} />}>
                {t('settings.deleteAccount')}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={clsx('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-[var(--surface-muted)]')}
    >
      <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  )
}
