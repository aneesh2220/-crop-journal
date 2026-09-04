import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, X, Stethoscope, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SeverityBadge } from '@/components/ui/Badge'
import { NotConnectedState, ErrorState } from '@/components/ui/States'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/contexts/AuthContext'
import { diagnoseCrop, AiNotConfiguredError, type CropDoctorResult } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import { uploadToBucket } from '@/lib/storage'

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

  return (
    <div>
      <PageHeader title={t('cropDoctor.title')} subtitle={t('cropDoctor.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickImage} />

          {image ? (
            <div className="relative">
              <img src={image.preview} alt="" className="h-56 w-full rounded-xl object-cover" />
              <button
                onClick={() => setImage(null)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
                aria-label={t('common.close')}
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)]">
              <div className="rounded-full bg-brand-100 p-3 dark:bg-brand-900/30">
                <Stethoscope className="text-brand-600" size={24} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} icon={<Camera size={15} />}>
                  {t('cropDoctor.takePhoto')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} icon={<Upload size={15} />}>
                  {t('cropDoctor.uploadPhoto')}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">{t('cropDoctor.describeSymptoms')}</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="e.g. Yellow spots on leaves, wilting since 3 days…"
            />
          </div>

          <Button className="mt-4 w-full" size="lg" onClick={handleAnalyze} loading={loading} disabled={!configured || (!image && !symptoms.trim())}>
            {t('cropDoctor.analyze')}
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
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-muted)]">{t('cropDoctor.possibleProblem')}</h3>
                  <SeverityBadge severity={result.severity} />
                </div>
                <p className="text-lg font-bold text-[var(--text)]">{result.problem}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{Math.round(result.confidence * 100)}% confidence</p>
              </Card>
              <ResultList title={t('cropDoctor.causes')} items={result.causes} />
              <ResultList title={t('cropDoctor.treatment')} items={result.treatment} tone="brand" />
              <ResultList title={t('cropDoctor.prevention')} items={result.prevention} tone="gold" />
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle className="text-[var(--text-muted)]" size={26} />
              <p className="text-sm text-[var(--text-muted)]">{t('common.noData')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultList({ title, items, tone = 'neutral' }: { title: string; items: string[]; tone?: 'brand' | 'gold' | 'neutral' }) {
  const { t } = useTranslation()
  const dotColor = tone === 'brand' ? 'bg-brand-500' : tone === 'gold' ? 'bg-gold-500' : 'bg-[var(--text-muted)]'
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{t('common.noData')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text)]">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
