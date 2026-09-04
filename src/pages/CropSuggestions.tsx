import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sprout, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NotConnectedState, ErrorState } from '@/components/ui/States'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/contexts/AuthContext'
import { suggestCrops, AiNotConfiguredError, type CropSuggestionResult } from '@/lib/ai'

const SEASONS = ['Kharif (Monsoon)', 'Rabi (Winter)', 'Zaid (Summer)']
const WATER_LEVELS = ['Low / rain-fed', 'Medium', 'High / well irrigated']

export default function CropSuggestions() {
  const { t, i18n } = useTranslation()
  const { profile, configured } = useAuth()
  const [location, setLocation] = useState(profile?.location_name ?? '')
  const [soilType, setSoilType] = useState('')
  const [season, setSeason] = useState('')
  const [water, setWater] = useState('')
  const [needs, setNeeds] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConnected, setNotConnected] = useState(false)
  const [result, setResult] = useState<CropSuggestionResult | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setNotConnected(false)
    setResult(null)
    try {
      const res = await suggestCrops(i18n.language, { location, soilType, season, water, needs })
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
      <PageHeader title={t('cropSuggestions.title')} subtitle={t('cropSuggestions.subtitle')} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <Input label={t('cropSuggestions.location')} icon={<MapPin size={16} />} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="District, State" />
          <Input label={t('myFarm.soilType')} value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="e.g. Loamy, Black cotton soil" />
          <SelectField label={t('cropSuggestions.season')} value={season} onChange={setSeason} options={SEASONS} />
          <SelectField label={t('cropSuggestions.waterAvailability')} value={water} onChange={setWater} options={WATER_LEVELS} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text)]">{t('common.optional')}</label>
            <textarea
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              rows={2}
              placeholder="Any specific needs? e.g. short duration crop, low investment…"
              className="resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <Button className="w-full" size="lg" onClick={handleSubmit} loading={loading} disabled={!configured || !location || !season}>
            {t('cropSuggestions.getRecommendation')}
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
            <div className="space-y-3 animate-slide-up">
              {result.crops.map((crop) => (
                <Card key={crop.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <h3 className="text-base font-bold text-[var(--text)]">{crop.name}</h3>
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                      {crop.suitability}%
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{crop.reason}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Sprout className="text-[var(--text-muted)]" size={26} />
              <p className="text-sm text-[var(--text-muted)]">{t('common.noData')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--text)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[15px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
