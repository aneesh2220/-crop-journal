import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Printer, ArrowLeft, MapPin, ShieldCheck } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { StaticSatellite } from '@/components/StaticSatellite'
import { Button } from '@/components/ui/Button'
import { LoadingState, EmptyState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useCrops } from '@/hooks/useCrops'
import { useFarms } from '@/hooks/useFarms'
import { useCropLogs, dayNumber } from '@/hooks/useCropLogs'
import { analyseLogs, assessRecordQuality, lagDays } from '@/lib/farmRecord'

const STRENGTH_LABEL: Record<string, string> = {
  strong: 'Consistently kept',
  moderate: 'Partially kept',
  limited: 'Sparse',
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FarmRecord() {
  const { cropId } = useParams<{ cropId: string }>()
  const { t } = useTranslation()
  const { profile, user } = useAuth()
  const { crops, loading: cropsLoading } = useCrops()
  const { farms } = useFarms()
  const { logs, loading: logsLoading, error } = useCropLogs(cropId)

  const crop = crops.find((c) => c.id === cropId)
  const farm = farms.find((f) => f.id === crop?.farm_id)

  const stats = useMemo(() => analyseLogs(logs), [logs])
  const quality = useMemo(() => assessRecordQuality(stats), [stats])

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.created_at.localeCompare(b.created_at)),
    [logs]
  )

  if (cropsLoading || logsLoading) return <LoadingState />

  if (!crop) {
    return (
      <div className="py-10">
        <EmptyState title={t('farmRecord.cropNotFound')} action={<Link to="/farm-progress"><Button>{t('common.back')}</Button></Link>} />
      </div>
    )
  }

  const generatedOn = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <div className="mx-auto max-w-3xl">
      {/* Screen-only toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/farm-progress" className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
          <ArrowLeft size={16} /> {t('farmRecord.backToProgress')}
        </Link>
        <Button icon={<Printer size={16} />} onClick={() => window.print()}>
          {t('farmRecord.printOrSave')}
        </Button>
      </div>

      {error && (
        <p className="mb-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 print:hidden dark:bg-amber-950/25 dark:text-amber-300">
          {error}
        </p>
      )}

      <article className="print-doc rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 print:rounded-none print:border-0 print:p-0">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3">
            <BrandMark size={44} />
            <div>
              <h1 className="text-xl font-bold text-[var(--text)]">{t('farmRecord.title')}</h1>
              <p className="text-xs text-[var(--text-muted)]">{t('farmRecord.subtitle')}</p>
            </div>
          </div>
          <div className="text-right text-xs text-[var(--text-muted)]">
            <p>{t('farmRecord.generatedOn')}</p>
            <p className="font-medium text-[var(--text)]">{generatedOn}</p>
          </div>
        </header>

        {/* Identity */}
        <section className="grid gap-x-8 gap-y-4 border-b border-[var(--border)] py-5 sm:grid-cols-2">
          <Field label={t('farmRecord.farmerName')} value={profile?.full_name || user?.email || '—'} />
          <Field label={t('farmRecord.farmName')} value={farm?.name ?? '—'} />
          <Field label={t('myFarm.location')} value={farm?.location_name ?? '—'} />
          <Field
            label={t('myFarm.landSize')}
            value={farm?.land_size ? `${farm.land_size} ${farm.land_unit}` : '—'}
          />
          <Field label={t('farmRecord.crop')} value={`${crop.name}${crop.variety ? ` (${crop.variety})` : ''}`} />
          <Field label={t('myFarm.plantingDate')} value={fmt(crop.planting_date)} />
          <Field label={t('farmRecord.currentStage')} value={t(`farmProgress.${crop.stage}`)} />
          <Field
            label={t('farmRecord.cropAge')}
            value={dayNumber(crop.planting_date) ? t('farmProgress.dayN', { n: dayNumber(crop.planting_date) }) : '—'}
          />
        </section>

        {/* Satellite evidence + summary */}
        <section className="grid gap-6 border-b border-[var(--border)] py-5 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
              {t('farmRecord.summary')}
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label={t('farmRecord.totalEntries')} value={String(stats.totalEntries)} />
              <Row label={t('farmRecord.periodCovered')} value={`${fmt(stats.firstEntryDate)} — ${fmt(stats.lastEntryDate)}`} />
              <Row label={t('farmRecord.daysLogged')} value={`${stats.daysLogged} / ${stats.spanDays}`} />
              {stats.costEntries > 0 && (
                <Row label={t('farmRecord.recordedCost')} value={`₹${stats.totalCost.toLocaleString('en-IN')}`} />
              )}
            </dl>

            {stats.byType.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {t('farmRecord.activityBreakdown')}
                </p>
                <ul className="space-y-1 text-sm text-[var(--text)]">
                  {stats.byType.map((b) => (
                    <li key={b.type} className="flex justify-between gap-3">
                      <span>{t(`farmProgress.log.${b.type}`, b.type)}</span>
                      <span className="font-medium">{b.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
              {t('farmRecord.plotImagery')}
            </h2>
            {farm?.location_lat != null && farm?.location_lng != null ? (
              <StaticSatellite lat={farm.location_lat} lng={farm.location_lng} zoom={17} />
            ) : (
              <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-xs text-[var(--text-muted)]">
                {t('farmRecord.noPlotLocation')}
              </p>
            )}
          </div>
        </section>

        {/* How this record was kept — the honest core of the document */}
        <section className="border-b border-[var(--border)] py-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
            <ShieldCheck size={15} /> {t('farmRecord.howKept')}
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-base font-bold text-[var(--text)]">
              {t(`farmRecord.strength.${quality.strength}`, STRENGTH_LABEL[quality.strength])}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
              {quality.reasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              {t('farmRecord.howKeptExplainer')}
            </p>
          </div>
        </section>

        {/* Full log */}
        <section className="py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
            {t('farmRecord.fullLog')}
          </h2>
          {sortedLogs.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">{t('farmProgress.noEntries')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="py-2 pr-3 font-semibold">{t('farmRecord.day')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('farmProgress.entryDate')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('farmRecord.activity')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('farmProgress.note')}</th>
                    <th className="py-2 pr-3 font-semibold">₹</th>
                    <th className="py-2 font-semibold">{t('farmRecord.written')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLogs.map((log) => {
                    const d = dayNumber(crop.planting_date, log.entry_date)
                    const lag = lagDays(log)
                    return (
                      <tr key={log.id} className="border-b border-[var(--border)] align-top">
                        <td className="py-2 pr-3 font-medium text-[var(--text)]">{d && d > 0 ? d : '—'}</td>
                        <td className="whitespace-nowrap py-2 pr-3 text-[var(--text)]">{fmt(log.entry_date)}</td>
                        <td className="py-2 pr-3 text-[var(--text)]">
                          {t(`farmProgress.log.${log.type}`, log.type)}
                          {log.location_lat != null && (
                            <span className="ml-1 inline-flex items-center text-[var(--text-muted)]" title={`${log.location_lat}, ${log.location_lng}`}>
                              <MapPin size={10} />
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-[var(--text-muted)]">{log.note ?? '—'}</td>
                        <td className="py-2 pr-3 text-[var(--text)]">
                          {log.cost != null ? Number(log.cost).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="whitespace-nowrap py-2 text-[var(--text-muted)]">
                          {lag <= 0 ? t('farmRecord.sameDay') : t('farmRecord.nDaysLater', { n: lag })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Disclaimer — must survive printing, so it is part of the document itself */}
        <footer className="border-t-2 border-[var(--border)] pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            {t('farmRecord.importantHeading')}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
            {t('farmRecord.disclaimer')}
          </p>
          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            {t('farmRecord.generatedBy')} · agroai-five.vercel.app
          </p>
        </footer>
      </article>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[var(--text)]">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="text-right font-medium text-[var(--text)]">{value}</dd>
    </div>
  )
}
