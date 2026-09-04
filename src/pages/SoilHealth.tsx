import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, X, FlaskConical, Gauge } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NotConnectedState, ErrorState } from '@/components/ui/States'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/contexts/AuthContext'
import { analyzeSoil, AiNotConfiguredError, type SoilHealthResult } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import { uploadToBucket } from '@/lib/storage'

const TEXTURES = ['Sandy', 'Clay', 'Loamy', 'Silty', 'Peaty', 'Chalky']

export default function SoilHealth() {
  const { t, i18n } = useTranslation()
  const { user, configured } = useAuth()
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null)
  const [ph, setPh] = useState('')
  const [nitrogen, setNitrogen] = useState('')
  const [phosphorus, setPhosphorus] = useState('')
  const [potassium, setPotassium] = useState('')
  const [texture, setTexture] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConnected, setNotConnected] = useState(false)
  const [result, setResult] = useState<SoilHealthResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage({ file, preview: URL.createObjectURL(file) })
    e.target.value = ''
  }

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setNotConnected(false)
    setResult(null)
    try {
      const imageBase64 = image ? await fileToBase64(image.file) : undefined
      const context = {
        ph: ph ? Number(ph) : undefined,
        nitrogen: nitrogen ? Number(nitrogen) : undefined,
        phosphorus: phosphorus ? Number(phosphorus) : undefined,
        potassium: potassium ? Number(potassium) : undefined,
        texture: texture || undefined,
      }
      const analysis = await analyzeSoil(i18n.language, context, imageBase64)
      setResult(analysis)

      if (user) {
        const imagePath = image ? await uploadToBucket('soil-images', user.id, image.file) : null
        await supabase.from('soil_analyses').insert({
          user_id: user.id,
          image_url: imagePath,
          ph: context.ph ?? null,
          nitrogen: context.nitrogen ?? null,
          phosphorus: context.phosphorus ?? null,
          potassium: context.potassium ?? null,
          texture: context.texture ?? null,
          analysis,
        })
      }
    } catch (err) {
      if (err instanceof AiNotConfiguredError) setNotConnected(true)
      else setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const hasInput = image || ph || nitrogen || phosphorus || potassium || texture

  return (
    <div>
      <PageHeader title={t('soilHealth.title')} subtitle={t('soilHealth.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          {image ? (
            <div className="relative mb-4">
              <img src={image.preview} alt="" className="h-40 w-full rounded-xl object-cover" />
              <button onClick={() => setImage(null)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mb-4 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] transition-colors hover:bg-[var(--surface)]"
            >
              <Upload className="text-brand-600" size={20} />
              <span className="text-sm font-medium text-[var(--text)]">{t('soilHealth.uploadSoilPhoto')}</span>
              <span className="text-xs text-[var(--text-muted)]">{t('common.optional')}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label={t('soilHealth.phLevel')} type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="6.5" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text)]">{t('soilHealth.texture')}</label>
              <select
                value={texture}
                onChange={(e) => setTexture(e.target.value)}
                className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[15px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">—</option>
                {TEXTURES.map((tex) => (
                  <option key={tex} value={tex}>
                    {tex}
                  </option>
                ))}
              </select>
            </div>
            <Input label={t('soilHealth.nitrogen')} type="number" value={nitrogen} onChange={(e) => setNitrogen(e.target.value)} placeholder="mg/kg" />
            <Input label={t('soilHealth.phosphorus')} type="number" value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} placeholder="mg/kg" />
            <Input label={t('soilHealth.potassium')} type="number" value={potassium} onChange={(e) => setPotassium(e.target.value)} placeholder="mg/kg" className="col-span-2" />
          </div>

          <Button className="mt-4 w-full" size="lg" onClick={handleAnalyze} loading={loading} disabled={!configured || !hasInput}>
            {t('soilHealth.analyze')}
          </Button>
        </Card>

        <div>
          {notConnected ? (
            <Card>
              <NotConnectedState />
            </Card>
          ) : error ? (
            <Card>
              <ErrorState message={error} onRetry={handleAnalyze} />
            </Card>
          ) : loading ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-16">
              <Spinner size={26} />
              <p className="text-sm text-[var(--text-muted)]">{t('common.loading')}</p>
            </Card>
          ) : result ? (
            <div className="space-y-4 animate-slide-up">
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">
                    <Gauge size={16} /> {t('soilHealth.insights')}
                  </h3>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    {result.health_score}/100
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text)]">{result.summary}</p>
              </Card>
              <Card>
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{t('cropDoctor.treatment')}</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{t('cropSuggestions.title')}</h3>
                <div className="flex flex-wrap gap-2">
                  {result.suitable_crops.map((c) => (
                    <span key={c} className="rounded-full bg-gold-100 px-3 py-1.5 text-sm font-medium text-gold-700 dark:bg-gold-900/30 dark:text-gold-300">
                      {c}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FlaskConical className="text-[var(--text-muted)]" size={26} />
              <p className="text-sm text-[var(--text-muted)]">{t('common.noData')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
