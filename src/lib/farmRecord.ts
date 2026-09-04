import type { CropLog, CropLogType } from '@/lib/database.types'

/**
 * Analysis behind the Farm Activity Record.
 *
 * Deliberately NOT a credit score. Everything here describes *how the record was
 * kept* — how promptly entries were written, how many carry GPS, how much of the
 * season is covered — never whether the farm or the farmer is "good". A reader
 * decides what the record is worth; this module only makes the record's own
 * properties visible so that judgement is informed rather than blind.
 */

export interface RecordStats {
  totalEntries: number
  firstEntryDate: string | null
  lastEntryDate: string | null
  /** Distinct calendar days that carry at least one entry. */
  daysLogged: number
  /** Calendar days from the first entry to the last, inclusive. */
  spanDays: number
  byType: { type: CropLogType; count: number }[]
  totalCost: number
  costEntries: number
  /** Entries written on the same day as the work they describe. */
  sameDayEntries: number
  /** Entries carrying GPS coordinates. */
  gpsEntries: number
  /** Entries backfilled more than 7 days after the work. */
  lateEntries: number
}

function toDay(value: string): number {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).getTime()
}

/** Days between when work happened and when it was written down. Negative is impossible in the UI (dates are capped at today) but tolerated here. */
export function lagDays(log: CropLog): number {
  const entry = toDay(log.entry_date)
  const created = new Date(log.created_at)
  const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime()
  return Math.round((createdDay - entry) / 86_400_000)
}

export function analyseLogs(logs: CropLog[]): RecordStats {
  if (logs.length === 0) {
    return {
      totalEntries: 0, firstEntryDate: null, lastEntryDate: null, daysLogged: 0,
      spanDays: 0, byType: [], totalCost: 0, costEntries: 0,
      sameDayEntries: 0, gpsEntries: 0, lateEntries: 0,
    }
  }

  const sorted = [...logs].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  const first = sorted[0].entry_date
  const last = sorted[sorted.length - 1].entry_date

  const counts = new Map<CropLogType, number>()
  let totalCost = 0
  let costEntries = 0
  let sameDay = 0
  let gps = 0
  let late = 0

  for (const log of logs) {
    counts.set(log.type, (counts.get(log.type) ?? 0) + 1)
    if (log.cost != null) {
      totalCost += Number(log.cost)
      costEntries += 1
    }
    const lag = lagDays(log)
    if (lag <= 0) sameDay += 1
    if (lag > 7) late += 1
    if (log.location_lat != null && log.location_lng != null) gps += 1
  }

  return {
    totalEntries: logs.length,
    firstEntryDate: first,
    lastEntryDate: last,
    daysLogged: new Set(logs.map((l) => l.entry_date)).size,
    spanDays: Math.round((toDay(last) - toDay(first)) / 86_400_000) + 1,
    byType: [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    totalCost,
    costEntries,
    sameDayEntries: sameDay,
    gpsEntries: gps,
    lateEntries: late,
  }
}

export type Strength = 'strong' | 'moderate' | 'limited'

export interface RecordQuality {
  strength: Strength
  /** Plain-language reasons, shown verbatim on the record so a reader sees the basis. */
  reasons: string[]
  sameDayPct: number
  gpsPct: number
  coveragePct: number
}

/**
 * Describes the *record*, not the farm. "Strong" means the log was kept promptly
 * and consistently — it makes no claim that the crop did well or that the farmer
 * will repay anything.
 */
export function assessRecordQuality(stats: RecordStats): RecordQuality {
  if (stats.totalEntries === 0) {
    return { strength: 'limited', reasons: ['No entries recorded.'], sameDayPct: 0, gpsPct: 0, coveragePct: 0 }
  }

  const sameDayPct = Math.round((stats.sameDayEntries / stats.totalEntries) * 100)
  const gpsPct = Math.round((stats.gpsEntries / stats.totalEntries) * 100)
  const coveragePct = stats.spanDays > 0 ? Math.round((stats.daysLogged / stats.spanDays) * 100) : 0

  const reasons: string[] = []
  reasons.push(`${stats.totalEntries} entries over ${stats.spanDays} days.`)
  reasons.push(`${sameDayPct}% written on the same day as the work described.`)
  reasons.push(
    gpsPct > 0
      ? `${gpsPct}% carry GPS coordinates captured at the time of entry.`
      : 'No entries carry GPS coordinates.'
  )
  if (stats.lateEntries > 0) {
    reasons.push(`${stats.lateEntries} entries were added more than a week after the work.`)
  }

  // Thresholds are a presentation choice, not a measurement. They exist so the
  // summary word matches the detail underneath it — the detail is what matters.
  let strength: Strength = 'limited'
  if (stats.totalEntries >= 20 && sameDayPct >= 70 && stats.spanDays >= 30) strength = 'strong'
  else if (stats.totalEntries >= 8 && sameDayPct >= 40) strength = 'moderate'

  return { strength, reasons, sameDayPct, gpsPct, coveragePct }
}
