import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NotConnectedState, ErrorState } from '@/components/ui/States'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useCrops } from '@/hooks/useCrops'
import { getIrrigationAdvice, AiNotConfiguredError, type IrrigationResult } from '@/lib/ai'

const STAGES = ['Preparation', 'Sowing', 'Growth', 'Flowering', 'Harvest']

export default function Irrigation() {
  const { t, i18n } = useTranslation()
  const { configured } = useAuth()
  const { crops } = useCrops()
  const [crop, setCrop] = useState('')
  const [soilType, setSoilType] = useState('')
  const [stage, setStage] = useState('')
  const [weather, setWeather] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConnected, setNotConnected] = useState(false)
  const [result, setResult] = useState<IrrigationResult | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setNotConnected(false)
    setResult(null)
    try {
      const res = await getIrrigationAdvice(i18n.language, { crop, soilType, stage, weather })
      setResult(res)
    } catch (err) {
      if (err instanceof AiNotConfiguredError) setNotConnected(true)
      else setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title={t('irrigation.title')} subtitle={t('irrigation.subtitle')} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text)]">{t('myFarm.crops')}</label>
            {crops.length > 0 ? (
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[15px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">—</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Cotton, Rice, Sugarcane" />
            )}
          </div>
          <Input label={t('myFarm.soilType')} value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="e.g. Sandy loam" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text)]">{t('irrigation.growthStage')}</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[15px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">—</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Input label={t('weather.title')} value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="e.g. Hot & dry, light rain expected" />
          <Button className="w-full" size="lg" onClick={handleSubmit} loading={loading} disabled={!configured || !crop || !stage}>
            {t('common.submit')}
          </Button>
        </Card>

        <div>
          {notConnected ? (
            <Card>
              <NotConnectedState />
            </Card>
          ) : error ? (
            <Card>
              <ErrorState message={error} onRetry={handleSubmit} />
            </Card>
          ) : loading ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-16">
              <Spinner size={26} />
              <p className="text-sm text-[var(--text-muted)]">{t('common.loading')}</p>
            </Card>
          ) : result ? (
            <div className="space-y-4 animate-slide-up">
              <Card>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">
                  <Calendar size={16} /> {t('irrigation.schedule')}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text)]">{result.schedule}</p>
                <p className="mt-2 text-sm font-medium text-brand-600">{result.waterAmount}</p>
              </Card>
              <Card>
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{t('irrigation.waterSavingTips')}</h3>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Droplets className="text-[var(--text-muted)]" size={26} />
              <p className="text-sm text-[var(--text-muted)]">{t('common.noData')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
