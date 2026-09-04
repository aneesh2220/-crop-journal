import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import {
  Check,
  Sprout,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  MapPin,
  CalendarDays,
  Droplets,
  SprayCan,
  Scissors,
  Eye,
  AlertTriangle,
  Wheat,
  IndianRupee,
  Leaf,
  FileText,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, NotConnectedState, LoadingState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useCrops } from '@/hooks/useCrops'
import { useCropLogs, dayNumber, todayLocalISO } from '@/hooks/useCropLogs'
import type { Crop, CropLog, CropLogType, CropStage } from '@/lib/database.types'

const STAGES: CropStage[] = ['preparation', 'sowing', 'growth', 'flowering', 'harvest']

const LOG_TYPES: { value: CropLogType; label: string; icon: typeof Droplets }[] = [
  { value: 'sowing', label: 'Sowing', icon: Sprout },
  { value: 'irrigation', label: 'Irrigation', icon: Droplets },
  { value: 'fertilizer', label: 'Fertiliser', icon: Leaf },
  { value: 'spraying', label: 'Spraying', icon: SprayCan },
  { value: 'weeding', label: 'Weeding', icon: Scissors },
  { value: 'observation', label: 'Observation', icon: Eye },
  { value: 'problem', label: 'Problem', icon: AlertTriangle },
  { value: 'harvest', label: 'Harvest', icon: Wheat },
  { value: 'expense', label: 'Expense', icon: IndianRupee },
]

function logMeta(type: CropLogType) {
  return LOG_TYPES.find((l) => l.value === type) ?? { value: type, label: type, icon: Eye }
}

export default function FarmProgress() {
  const { t } = useTranslation()
  const { configured } = useAuth()
  const { crops, loading, updateCrop } = useCrops()
  const [expanded, setExpanded] = useState<string | null>(null)

  const activeCrops = crops.filter((c) => c.status === 'active')
  const scored = activeCrops.filter((c) => c.health_score !== null)
  // Only average crops that actually have a score. Previously every unscored crop
  // silently counted as 70, so the ring showed a confident number invented from nothing.
  const overallHealth = scored.length
    ? Math.round(scored.reduce((sum, c) => sum + (c.health_score ?? 0), 0) / scored.length)
    : null

  if (!configured) {
    return (
      <div>
        <PageHeader title={t('farmProgress.title')} />
        <NotConnectedState />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('farmProgress.title')} subtitle={t('farmProgress.subtitle')} />

      <Card className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{t('farmProgress.overallHealth')}</p>
          {overallHealth !== null ? (
            <p className="text-3xl font-bold text-[var(--text)]">{overallHealth}%</p>
          ) : (
            <p className="mt-1 max-w-xs text-sm text-[var(--text-muted)]">{t('farmProgress.noHealthYet')}</p>
          )}
        </div>
        {overallHealth !== null && (
          <div
            className="h-16 w-16 rounded-full"
            style={{ background: `conic-gradient(var(--color-brand-500) ${overallHealth * 3.6}deg, var(--surface-muted) 0deg)` }}
          />
        )}
      </Card>

      {loading ? (
        <LoadingState />
      ) : activeCrops.length === 0 ? (
        <Card>
          <EmptyState icon={<Sprout className="text-[var(--text-muted)]" size={22} />} title={t('farmProgress.noCrops')} />
        </Card>
      ) : (
        <div className="space-y-5">
          {activeCrops.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              open={expanded === crop.id}
              onToggle={() => setExpanded(expanded === crop.id ? null : crop.id)}
              onUpdate={(patch) => updateCrop(crop.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CropCard({
  crop,
  open,
  onToggle,
  onUpdate,
}: {
  crop: Crop
  open: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<Crop>) => void
}) {
  const { t } = useTranslation()
  const { logs, loading, error, addLog, deleteLog } = useCropLogs(crop.id)
  const [logModal, setLogModal] = useState(false)

  const stageIndex = STAGES.indexOf(crop.stage)
  const day = dayNumber(crop.planting_date)
  const daysToHarvest = crop.expected_harvest_date
    ? Math.round(
        (new Date(crop.expected_harvest_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000
      )
    : null

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-[var(--text)]">{crop.name}</h3>
            {day !== null && day > 0 && (
              <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
                {t('farmProgress.dayN', { n: day })}
              </span>
            )}
          </div>
          {crop.variety && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{crop.variety}</p>}
          {day === null && (
            <p className="mt-1 text-xs text-amber-600">{t('farmProgress.noPlantingDate')}</p>
          )}
        </div>
        {daysToHarvest !== null && (
          <div className="shrink-0 text-right text-xs text-[var(--text-muted)]">
            <p>{t('farmProgress.estimatedHarvest')}</p>
            <p className="font-medium text-[var(--text)]">
              {daysToHarvest >= 0
                ? t('farmProgress.inNDays', { n: daysToHarvest })
                : t('farmProgress.overdueByNDays', { n: Math.abs(daysToHarvest) })}
            </p>
          </div>
        )}
      </div>

      {/* Stage timeline — now tappable, so a farmer can actually move the crop forward */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-[var(--border)]" />
        <div
          className="absolute left-0 top-3.5 h-0.5 bg-brand-500 transition-all duration-500"
          style={{ width: `${(stageIndex / (STAGES.length - 1)) * 100}%` }}
        />
        {STAGES.map((stage, i) => (
          <button
            key={stage}
            onClick={() => onUpdate({ stage, stage_progress: i === stageIndex ? crop.stage_progress : 0 })}
            title={t(`farmProgress.${stage}`)}
            className="relative z-10 flex flex-col items-center gap-1.5"
          >
            <div
              className={clsx(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                i < stageIndex
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : i === stageIndex
                    ? 'border-brand-500 bg-[var(--bg-elevated)] text-brand-600'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-brand-400'
              )}
            >
              {i < stageIndex ? <Check size={13} /> : i + 1}
            </div>
            <span className={clsx('text-[10px] font-medium capitalize', i <= stageIndex ? 'text-[var(--text)]' : 'text-[var(--text-muted)]')}>
              {t(`farmProgress.${stage}`)}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={crop.stage_progress}
          onChange={(e) => onUpdate({ stage_progress: Number(e.target.value) })}
          aria-label={t('farmProgress.stageProgress')}
          className="h-2 flex-1 cursor-pointer accent-[var(--color-brand-600)]"
        />
        <span className="w-12 text-right text-sm font-semibold text-[var(--text)]">{crop.stage_progress}%</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs text-[var(--text-muted)]">{t('dashboard.cropHealth')}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={crop.health_score ?? 70}
          onChange={(e) => onUpdate({ health_score: Number(e.target.value) })}
          aria-label={t('dashboard.cropHealth')}
          className="h-2 flex-1 cursor-pointer accent-[var(--color-brand-600)]"
        />
        <span className="w-12 text-right text-sm font-semibold text-[var(--text)]">
          {crop.health_score ?? '—'}
        </span>
      </div>

      {/* Diary */}
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between">
          <button onClick={onToggle} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
            <CalendarDays size={15} />
            {t('farmProgress.diary')}
            {logs.length > 0 && <span className="text-[var(--text-muted)]">({logs.length})</span>}
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <div className="flex gap-2">
            <Link to={`/farm-record/${crop.id}`}>
              <Button size="sm" variant="ghost" icon={<FileText size={15} />}>
                {t('farmProgress.exportRecord')}
              </Button>
            </Link>
            <Button size="sm" variant="outline" icon={<Plus size={15} />} onClick={() => setLogModal(true)}>
              {t('farmProgress.addEntry')}
            </Button>
          </div>
        </div>

        {open && (
          <div className="mt-4 animate-fade-in">
            {loading ? (
              <LoadingState />
            ) : error ? (
              /* Almost always "relation crop_logs does not exist" — i.e. the migration
                 hasn't been run yet. Showing it beats a silently empty diary. */
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/25 dark:text-amber-300">
                {error}
              </p>
            ) : logs.length === 0 ? (
              <p className="py-4 text-sm text-[var(--text-muted)]">{t('farmProgress.noEntries')}</p>
            ) : (
              <ol className="space-y-3">
                {logs.map((log) => (
                  <LogRow key={log.id} log={log} plantingDate={crop.planting_date} onDelete={() => deleteLog(log.id)} />
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      <AddLogModal
        open={logModal}
        onClose={() => setLogModal(false)}
        onSave={async (data) => {
          await addLog({ ...data, crop_id: crop.id })
          setLogModal(false)
        }}
      />
    </Card>
  )
}

function LogRow({
  log,
  plantingDate,
  onDelete,
}: {
  log: CropLog
  plantingDate: string | null
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const meta = logMeta(log.type)
  const Icon = meta.icon
  const day = dayNumber(plantingDate, log.entry_date)

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-brand-100 p-2 text-brand-600 dark:bg-brand-900/30">
          <Icon size={15} />
        </div>
        <div className="mt-1 w-px flex-1 bg-[var(--border)]" />
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {t(`farmProgress.log.${log.type}`, meta.label)}
              {day !== null && day > 0 && (
                <span className="ml-2 text-xs font-medium text-brand-600">
                  {t('farmProgress.dayN', { n: day })}
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {new Date(log.entry_date).toLocaleDateString()}
              {log.location_lat != null && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <MapPin size={11} /> {t('farmProgress.inField')}
                </span>
              )}
            </p>
          </div>
          <button onClick={onDelete} className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-red-600">
            <Trash2 size={13} />
          </button>
        </div>
        {log.note && <p className="mt-1 text-sm text-[var(--text)]">{log.note}</p>}
        {log.cost != null && (
          <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">₹{Number(log.cost).toLocaleString('en-IN')}</p>
        )}
      </div>
    </li>
  )
}

function AddLogModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<CropLog>) => void
}) {
  const { t } = useTranslation()
  const [type, setType] = useState<CropLogType>('irrigation')
  const [date, setDate] = useState(todayLocalISO())
  const [note, setNote] = useState('')
  const [cost, setCost] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)

  // Best-effort only: an entry without coordinates is still a valid entry, so a
  // denied or slow GPS must never block the farmer from writing the log down.
  const capture = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={t('farmProgress.addEntry')}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--text)]">{t('farmProgress.whatDidYouDo')}</p>
          <div className="flex flex-wrap gap-2">
            {LOG_TYPES.map((lt) => {
              const Icon = lt.icon
              return (
                <button
                  key={lt.value}
                  onClick={() => setType(lt.value)}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                    type === lt.value
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]'
                  )}
                >
                  <Icon size={13} /> {t(`farmProgress.log.${lt.value}`, lt.label)}
                </button>
              )
            })}
          </div>
        </div>

        <Input
          label={t('farmProgress.entryDate')}
          type="date"
          value={date}
          max={todayLocalISO()}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="log-note" className="text-sm font-medium text-[var(--text)]">
            {t('farmProgress.note')}
          </label>
          <textarea
            id="log-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('farmProgress.notePlaceholder')}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <Input
          label={t('farmProgress.costOptional')}
          type="number"
          inputMode="decimal"
          min="0"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="0"
        />

        <button
          onClick={capture}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
        >
          <MapPin size={15} />
          {coords ? t('farmProgress.locationAttached') : t('farmProgress.attachLocation')}
        </button>

        <Button
          className="w-full"
          loading={saving}
          onClick={async () => {
            setSaving(true)
            await onSave({
              type,
              entry_date: date,
              note: note.trim() || null,
              cost: cost ? Number(cost) : null,
              location_lat: coords?.lat ?? null,
              location_lng: coords?.lng ?? null,
            })
            setSaving(false)
            setNote('')
            setCost('')
            setCoords(null)
          }}
        >
          {t('common.save')}
        </Button>
      </div>
    </Modal>
  )
}
