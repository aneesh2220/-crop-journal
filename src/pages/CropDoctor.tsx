import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, X, Stethoscope, Sprout, ShieldCheck, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NotConnectedState, ErrorState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { diagnoseCrop, AiNotConfiguredError, type CropDoctorResult } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import { uploadToBucket } from '@/lib/storage'

/**
 * Laid out per the AgroAI App v2 design: a photo-led hero card on the left with a
 * scan line travelling over the image while the AI reads it, and a stack of
 * findings on the right.
 *
 * The design's right-hand column shows named risks with percentage meters. We have
 * no per-risk probabilities to put there and inventing them would turn a guess into
 * something that looks measured, so the meters are driven by the two numbers the
 * model does return — confidence and severity — and the findings themselves keep
 * the design's card treatment without fake precision.
 */

const SEVERITY_METER: Record<CropDoctorResult['severity'], { pct: number; color: string; key: string }> = {
  low: { pct: 33, color: '#8fa073', key: 'low' },
  medium: { pct: 66, color: '#d9a441', key: 'medium' },
  high: { pct: 100, color: '#c96a4f', key: 'high' },
}

export default function CropDoctor() {
  const { t, i18n } = useTranslation()
  const { user, configured } = useAuth()
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null)
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConnected, setNotConnected] = useState(false)
  const [result, setResult] = useState<CropDoctorResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

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
    if (!image && !symptoms.trim()) return
    setLoading(true)
    setError(null)
    setNotConnected(false)
    setResult(null)
    try {
      const imageBase64 = image ? await fileToBase64(image.file) : undefined
      const diagnosis = await diagnoseCrop(symptoms, i18n.language, imageBase64)
      setResult(diagnosis)

      if (user) {
        const imagePath = image ? await uploadToBucket('crop-images', user.id, image.file) : null
        await supabase.from('crop_diagnoses').insert({
          user_id: user.id,
          image_url: imagePath,
          symptoms,
          diagnosis,
        })
      }
    } catch (err) {
      if (err instanceof AiNotConfiguredError) setNotConnected(true)
      else setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setImage(null)
    setSymptoms('')
  }

  const severity = result ? SEVERITY_METER[result.severity] : null

  return (
    <div>
      <PageHeader title={t('cropDoctor.title')} subtitle={t('cropDoctor.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Hero: the photo, and what it turned out to be ── */}
        <Card className="overflow-hidden p-0">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickImage} />

          {image ? (
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={image.preview} alt="" className="washed h-full w-full object-cover" />
              {loading && (
                <div
                  className="absolute inset-x-0 h-0.5 animate-scan bg-[var(--accent)]"
                  style={{ boxShadow: '0 0 20px 5px color-mix(in srgb, var(--accent) 50%, transparent)' }}
                />
              )}
              {!loading && (
                <button
                  onClick={() => setImage(null)}
                  className="absolute right-3 top-3 rounded-full bg-black/55 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/75"
                  aria-label={t('common.close')}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 bg-[var(--surface-muted)]">
              <div className="rounded-full bg-[var(--accent)]/15 p-4">
                <Stethoscope className="text-[var(--accent)]" size={26} />
              </div>
              <div className="flex flex-wrap justify-center gap-2 px-4">
                <Button size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} icon={<Camera size={15} />}>
                  {t('cropDoctor.takePhoto')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} icon={<Upload size={15} />}>
                  {t('cropDoctor.uploadPhoto')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 p-6">
            {result ? (
              <>
                <span className="self-start rounded-full bg-[var(--accent)]/16 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  {t('cropDoctor.confidence')} {Math.round(result.confidence * 100)}%
                </span>
                <h2 className="font-display text-2xl leading-tight text-[var(--text)]">{result.problem}</h2>
                {result.treatment[0] && (
                  <p className="text-[14.5px] leading-relaxed text-[var(--text-muted)]">{result.treatment[0]}</p>
                )}
                <Button className="self-start" onClick={reset} icon={<Search size={15} />}>
                  {t('cropDoctor.scanAnother')}
                </Button>
              </>
            ) : (
              <>
                <label htmlFor="symptoms" className="text-sm font-medium text-[var(--text)]">
                  {t('cropDoctor.describeSymptoms')}
                </label>
                <textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  placeholder={t('cropDoctor.symptomsPlaceholder')}
                />
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  loading={loading}
                  disabled={!configured || (!image && !symptoms.trim())}
                >
                  {t('cropDoctor.analyze')}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* ── Findings ── */}
        <div className="flex flex-col gap-4">
          {notConnected ? (
            <Card><NotConnectedState /></Card>
          ) : error ? (
            <Card><ErrorState message={error} onRetry={handleAnalyze} /></Card>
          ) : loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : result && severity ? (
            <div className="flex flex-col gap-4 animate-slide-up">
              <Card className="flex flex-col gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="mr-auto font-display text-[17px] text-[var(--text)]">
                    {t('cropDoctor.severity')}
                  </span>
                  <span className="text-[12.5px] font-medium" style={{ color: severity.color }}>
                    {t(`cropDoctor.severityLevel.${severity.key}`)}
                  </span>
                </div>
                <Meter pct={severity.pct} color={severity.color} />
                <p className="text-[13.5px] leading-snug text-[var(--text-muted)]">
                  {t(`cropDoctor.severityNote.${severity.key}`)}
                </p>
              </Card>

              <FindingCard icon={<Search size={15} />} title={t('cropDoctor.causes')} items={result.causes} />
              <FindingCard icon={<Sprout size={15} />} title={t('cropDoctor.treatment')} items={result.treatment} />
              <FindingCard icon={<ShieldCheck size={15} />} title={t('cropDoctor.prevention')} items={result.prevention} />

              <p className="px-1 text-xs leading-relaxed text-[var(--text-muted)]">
                {t('cropDoctor.disclaimer')}
              </p>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="rounded-full bg-[var(--surface-muted)] p-3">
                <Stethoscope className="text-[var(--text-muted)]" size={22} />
              </div>
              <p className="max-w-xs text-sm text-[var(--text-muted)]">{t('cropDoctor.emptyHint')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Meter({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[5px] overflow-hidden rounded-full bg-[var(--surface-muted)]">
      <div className="h-full animate-fill-bar rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function FindingCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  const { t } = useTranslation()
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <h3 className="font-display text-[17px] text-[var(--text)]">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{t('common.noData')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function SkeletonRow() {
  return (
    <Card className="flex flex-col gap-2.5">
      <div className="h-4 w-1/3 animate-pulse rounded-full bg-[var(--surface-muted)]" />
      <div className="h-[5px] animate-pulse rounded-full bg-[var(--surface-muted)]" />
      <div className="h-3 w-4/5 animate-pulse rounded-full bg-[var(--surface-muted)]" />
    </Card>
  )
}
