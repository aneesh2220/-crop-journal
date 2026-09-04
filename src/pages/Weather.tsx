import { useTranslation } from 'react-i18next'
import { CloudRain, Wind, Droplets, Sun, AlertTriangle, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { NotConnectedState, ErrorState, LoadingState } from '@/components/ui/States'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useWeather } from '@/hooks/useWeather'

export default function Weather() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const geo = useGeolocation(profile?.location_lat && profile?.location_lng ? { lat: profile.location_lat, lon: profile.location_lng } : undefined)
  const { data, loading, error, notConnected } = useWeather(geo.lat, geo.lon, profile?.units === 'imperial' ? 'imperial' : 'metric')

  return (
    <div>
      <PageHeader title={t('weather.title')} subtitle={data?.location} />

      {geo.error && !data && (
        <Card className="mb-5 flex items-center gap-3 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <MapPin className="text-amber-600" size={18} />
          <p className="text-sm text-amber-800 dark:text-amber-300">{geo.error} — enable location access or set it in Settings.</p>
        </Card>
      )}

      {notConnected ? (
        <Card>
          <NotConnectedState />
        </Card>
      ) : loading || geo.loading ? (
        <Card>
          <LoadingState />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} />
        </Card>
      ) : data ? (
        <div className="space-y-5 animate-slide-up">
          <Card className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-bold">{Math.round(data.temp)}°</p>
                <p className="mt-1 capitalize text-brand-100">{data.condition}</p>
                <p className="text-sm text-brand-200">
                  {t('weather.feelsLike')} {Math.round(data.feelsLike)}°
                </p>
              </div>
              <Sun size={56} className="text-gold-300" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
              <MiniStat icon={<Droplets size={15} />} label={t('weather.humidity')} value={`${data.humidity}%`} />
              <MiniStat icon={<Wind size={15} />} label={t('weather.wind')} value={`${data.windSpeed} m/s`} />
              <MiniStat icon={<CloudRain size={15} />} label={t('weather.rainfall')} value={`${data.rainfallMm} mm`} />
            </div>
          </Card>

          {data.alerts.length > 0 && (
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">
                <AlertTriangle size={16} className="text-amber-500" /> {t('weather.alerts')}
              </h3>
              <div className="space-y-2">
                {data.alerts.map((a, i) => (
                  <div key={i} className="rounded-xl bg-[var(--surface-muted)] p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone={a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'neutral'}>{a.severity}</Badge>
                      <p className="text-sm font-medium text-[var(--text)]">{a.title}</p>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{a.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{t('weather.forecast')}</h3>
            <div className="grid grid-cols-5 gap-2">
              {data.forecast.map((f) => (
                <div key={f.date} className="flex flex-col items-center gap-1.5 rounded-xl bg-[var(--surface-muted)] p-3 text-center">
                  <p className="text-xs font-medium text-[var(--text-muted)]">
                    {new Date(f.date).toLocaleDateString(undefined, { weekday: 'short' })}
                  </p>
                  <p className="text-xs capitalize text-[var(--text-muted)]">{f.condition}</p>
                  <p className="text-sm font-bold text-[var(--text)]">
                    {Math.round(f.maxTemp)}°/{Math.round(f.minTemp)}°
                  </p>
                  <p className="flex items-center gap-0.5 text-[10px] text-sky-600">
                    <Droplets size={10} /> {f.rainChance}%
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-muted)]">{t('weather.farmingImpact')}</h3>
            <p className="text-sm leading-relaxed text-[var(--text)]">{data.farmingImpact}</p>
          </Card>
        </div>
      ) : (
        <Card>
          <NotConnectedState />
        </Card>
      )}
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="mb-1 flex items-center justify-center gap-1 text-brand-200">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  )
}
