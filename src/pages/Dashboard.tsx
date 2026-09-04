import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Stethoscope,
  FlaskConical,
  CloudSun,
  LineChart,
  Sprout,
  Droplets,
  ArrowRight,
  Tractor,
  Wind,
  CloudRain,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { QuoteBanner } from '@/components/QuoteBanner'
import { EmptyState, NotConnectedState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useFarms } from '@/hooks/useFarms'
import { useCrops } from '@/hooks/useCrops'
import { useTasks } from '@/hooks/useTasks'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useWeather } from '@/hooks/useWeather'
import { fetchMandiPrices, type MandiPrice, MarketNotConfiguredError } from '@/lib/marketApi'

const QUICK_ACTIONS = [
  { to: '/chat', icon: Sprout, labelKey: 'nav.chat', tone: 'bg-brand-600' },
  { to: '/crop-doctor', icon: Stethoscope, labelKey: 'nav.cropDoctor', tone: 'bg-emerald-600' },
  { to: '/soil-health', icon: FlaskConical, labelKey: 'nav.soilHealth', tone: 'bg-amber-600' },
  { to: '/irrigation', icon: Droplets, labelKey: 'nav.irrigation', tone: 'bg-sky-600' },
]

export default function Dashboard() {
  const { t } = useTranslation()
  const { profile, user, configured } = useAuth()
  const { farms, loading: farmsLoading } = useFarms()
  const { crops, loading: cropsLoading } = useCrops()
  const { tasks } = useTasks()
  const geo = useGeolocation(profile?.location_lat && profile?.location_lng ? { lat: profile.location_lat, lon: profile.location_lng } : undefined)
  const weather = useWeather(geo.lat, geo.lon, profile?.units === 'imperial' ? 'imperial' : 'metric')

  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'dashboard.greetingMorning' : hour < 17 ? 'dashboard.greetingAfternoon' : 'dashboard.greetingEvening'
  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''

  const todaysTasks = useMemo(() => {
    const today = new Date().toDateString()
    return tasks.filter((tk) => tk.status !== 'done' && new Date(tk.due_date).toDateString() === today)
  }, [tasks])

  const avgHealth = useMemo(() => {
    const scored = crops.filter((c) => c.health_score !== null)
    if (!scored.length) return null
    return Math.round(scored.reduce((sum, c) => sum + (c.health_score ?? 0), 0) / scored.length)
  }, [crops])

  const avgProgress = useMemo(() => {
    if (!crops.length) return null
    return Math.round(crops.reduce((sum, c) => sum + c.stage_progress, 0) / crops.length)
  }, [crops])

  const [marketPrices, setMarketPrices] = useState<MandiPrice[] | null>(null)
  const [marketLoading, setMarketLoading] = useState(true)
  const [marketNotConnected, setMarketNotConnected] = useState(false)
  const [marketError, setMarketError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchMandiPrices({})
      .then((prices) => active && setMarketPrices(prices.slice(0, 3)))
      .catch((err) => {
        if (!active) return
        if (err instanceof MarketNotConfiguredError) setMarketNotConnected(true)
        else setMarketError(err.message)
      })
      .finally(() => active && setMarketLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeader title={`${t(greetingKey)}${displayName ? ', ' + displayName : ''} 👋`} subtitle={t('common.tagline')} />

      {!configured && <NotConnectedState label="Backend not connected — showing empty state" />}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Farm overview */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--text)]">{t('dashboard.farmOverview')}</h2>
              <Link to="/my-farm" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                {t('dashboard.viewFarm')} <ArrowRight size={14} />
              </Link>
            </div>

            {farmsLoading || cropsLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
            ) : farms.length === 0 ? (
              <EmptyState
                icon={<Tractor className="text-[var(--text-muted)]" size={22} />}
                title={t('dashboard.noFarmYet')}
                action={
                  <Link to="/my-farm">
                    <Button size="sm">{t('dashboard.addFirstFarm')}</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label={t('myFarm.title')} value={String(farms.length)} />
                <Stat label={t('myFarm.crops')} value={String(crops.length)} />
                <Stat label={t('dashboard.cropHealth')} value={avgHealth !== null ? `${avgHealth}%` : '—'} />
                <Stat label={t('dashboard.overallProgress')} value={avgProgress !== null ? `${avgProgress}%` : '—'} />
              </div>
            )}

            {crops.length > 0 && (
              <div className="mt-5 space-y-3">
                {crops.slice(0, 3).map((crop) => (
                  <div key={crop.id} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-sm font-medium text-[var(--text)]">{crop.name}</span>
                    <ProgressBar value={crop.stage_progress} className="flex-1" />
                    <span className="w-10 shrink-0 text-right text-xs text-[var(--text-muted)]">{crop.stage_progress}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <h2 className="mb-4 text-base font-semibold text-[var(--text)]">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] p-4 text-center transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <div className={`rounded-full ${action.tone} p-2.5 text-white`}>
                    <action.icon size={18} />
                  </div>
                  <span className="text-xs font-medium leading-tight text-[var(--text)]">{t(action.labelKey)}</span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Today's tasks */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--text)]">{t('dashboard.todaysTasks')}</h2>
              <Link to="/tasks" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                {t('common.seeAll')} <ArrowRight size={14} />
              </Link>
            </div>
            {todaysTasks.length === 0 ? (
              <EmptyState title={t('common.noData')} />
            ) : (
              <ul className="space-y-2">
                {todaysTasks.map((tk) => (
                  <li key={tk.id} className="flex items-center justify-between rounded-lg bg-[var(--surface-muted)] px-3 py-2.5 text-sm">
                    <span className="font-medium text-[var(--text)]">{tk.title}</span>
                    <span className="text-xs capitalize text-[var(--text-muted)]">{tk.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <QuoteBanner />

          {/* Weather widget */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-semibold text-[var(--text)]">
                <CloudSun size={17} className="text-brand-600" /> {t('dashboard.weatherNow')}
              </h2>
              <Link to="/weather" className="text-sm font-medium text-brand-600 hover:underline">
                {t('common.viewDetails')}
              </Link>
            </div>
            {weather.notConnected ? (
              <NotConnectedState />
            ) : weather.loading ? (
              <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
            ) : weather.error ? (
              <p className="text-sm text-[var(--text-muted)]">{weather.error}</p>
            ) : weather.data ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-[var(--text)]">{Math.round(weather.data.temp)}°</p>
                  <p className="text-sm capitalize text-[var(--text-muted)]">{weather.data.condition}</p>
                </div>
                <div className="space-y-1 text-right text-xs text-[var(--text-muted)]">
                  <p className="flex items-center justify-end gap-1">
                    <CloudRain size={13} /> {weather.data.rainfallMm} mm
                  </p>
                  <p className="flex items-center justify-end gap-1">
                    <Wind size={13} /> {weather.data.windSpeed} m/s
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState title={t('common.noData')} />
            )}
          </Card>

          {/* Market widget */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-semibold text-[var(--text)]">
                <LineChart size={17} className="text-brand-600" /> {t('dashboard.marketToday')}
              </h2>
              <Link to="/market" className="text-sm font-medium text-brand-600 hover:underline">
                {t('common.viewDetails')}
              </Link>
            </div>
            {marketNotConnected ? (
              <NotConnectedState />
            ) : marketLoading ? (
              <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
            ) : marketError ? (
              <p className="text-sm text-[var(--text-muted)]">{marketError}</p>
            ) : marketPrices && marketPrices.length > 0 ? (
              <ul className="space-y-2">
                {marketPrices.map((p) => (
                  <li key={`${p.commodity}-${p.market}`} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--text)]">{p.commodity}</span>
                    <span className="text-[var(--text-muted)]">₹{p.modalPrice}/{p.unit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t('common.noData')} />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] p-3">
      <p className="text-xl font-bold text-[var(--text)]">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  )
}
