import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Crosshair, Globe, Map as MapIcon, ExternalLink, Layers, Copy, Check,
  CalendarClock, CloudOff, Sprout, RefreshCw,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useFarms } from '@/hooks/useFarms'
import { fetchFieldInsights, daysAgo, NDVI_COLORS, type FieldInsights, type Scene } from '@/lib/fieldInsights'

const SatelliteMap = lazy(() =>
  import('@/components/SatelliteMap').then((m) => ({ default: m.SatelliteMap }))
)

const INDIA_CENTRE = { lat: 22.5937, lng: 78.9629, zoom: 5 }

function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/@${lat},${lng},18z/data=!3m1!1e3`
}
function googleEarthUrl(lat: number, lng: number) {
  return `https://earth.google.com/web/@${lat},${lng},0a,500d,35y,0h,0t,0r`
}

export default function FieldView() {
  const { t } = useTranslation()
  const { isGuest } = useAuth()
  const { farms } = useFarms()

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [zoom, setZoom] = useState(17)
  const [showLabels, setShowLabels] = useState(true)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')

  const [insights, setInsights] = useState<FieldInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  // Which dated Sentinel-2 pass to draw over the base map; null = sharp Esri only.
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [overlayLoading, setOverlayLoading] = useState(false)

  const pinnedFarms = useMemo(
    () => farms.filter((f) => f.location_lat != null && f.location_lng != null),
    [farms]
  )

  const locate = () => {
    if (!navigator.geolocation) return setGeoError(t('fieldView.geoUnsupported'))
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setZoom(17)
        setLocating(false)
      },
      (err) => {
        setGeoError(err.message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 }
    )
  }

  useEffect(() => {
    locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadInsights = useCallback(async (la: number, ln: number) => {
    setInsightsLoading(true)
    setInsightsError(null)
    setInsights(null)
    setActiveSceneId(null)
    try {
      setInsights(await fetchFieldInsights(la, ln))
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : String(err))
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  // Satellite history is only meaningful once we actually have a location, and the
  // all-India fallback view isn't one — don't burn a lookup on it.
  useEffect(() => {
    if (lat != null && lng != null) loadInsights(lat, lng)
  }, [lat, lng, loadInsights])

  const view = lat != null && lng != null ? { lat, lng, zoom } : INDIA_CENTRE
  const hasFix = lat != null && lng != null

  const activeScene = insights?.scenes.find((s) => s.id === activeSceneId) ?? null
  const headline = insights?.latestUsable ?? null

  const copyCoords = async () => {
    if (!hasFix) return
    await navigator.clipboard.writeText(`${lat!.toFixed(6)}, ${lng!.toFixed(6)}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const applyManual = () => {
    const la = Number(manualLat)
    const ln = Number(manualLng)
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return
    if (la < -90 || la > 90 || ln < -180 || ln > 180) return
    setLat(la)
    setLng(ln)
    setZoom(17)
    setGeoError(null)
  }

  return (
    <div>
      <PageHeader title={t('fieldView.title')} subtitle={t('fieldView.subtitle')} />

      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={locate} loading={locating} icon={<Crosshair size={16} />}>
              {t('fieldView.useMyLocation')}
            </Button>
            <Button variant="outline" onClick={() => setShowLabels((v) => !v)} icon={<Layers size={16} />}>
              {showLabels ? t('fieldView.hideLabels') : t('fieldView.showLabels')}
            </Button>
          </div>

          {geoError && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/25 dark:text-amber-300">
              {t('fieldView.geoDenied')} — {geoError}
            </p>
          )}

          {pinnedFarms.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t('fieldView.savedFarms')}
              </p>
              <div className="flex flex-wrap gap-2">
                {pinnedFarms.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setLat(f.location_lat!)
                      setLng(f.location_lng!)
                      setZoom(17)
                      setGeoError(null)
                    }}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)]"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isGuest && pinnedFarms.length === 0 && farms.length > 0 && (
            <p className="mt-3 text-sm text-[var(--text-muted)]">{t('fieldView.pinHint')}</p>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-brand-600">
              {t('fieldView.enterManually')}
            </summary>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <Input label={t('fieldView.latitude')} inputMode="decimal" placeholder="20.5937"
                value={manualLat} onChange={(e) => setManualLat(e.target.value)} className="w-36" />
              <Input label={t('fieldView.longitude')} inputMode="decimal" placeholder="78.9629"
                value={manualLng} onChange={(e) => setManualLng(e.target.value)} className="w-36" />
              <Button variant="outline" onClick={applyManual}>{t('fieldView.goThere')}</Button>
            </div>
          </details>
        </Card>

        {/* Which day you are looking at — the whole point of the redesign */}
        {hasFix && (
          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
                <CalendarClock size={15} /> {t('fieldView.imageDate')}
              </h2>
              <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />}
                onClick={() => loadInsights(lat!, lng!)} loading={insightsLoading}>
                {t('common.retry')}
              </Button>
            </div>

            {insightsLoading ? (
              <LoadingState />
            ) : insightsError ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/25 dark:text-amber-300">
                {insightsError}
              </p>
            ) : insights?.scenes.length ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveSceneId(null)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      activeSceneId === null
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    <span className="block font-bold">{t('fieldView.sharpView')}</span>
                    <span className="block opacity-75">{t('fieldView.sharpViewHint')}</span>
                  </button>

                  {insights.scenes.map((s) => (
                    <SceneChip key={s.id} scene={s} active={activeSceneId === s.id}
                      onClick={() => setActiveSceneId(s.id)} />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                  {t('fieldView.dateExplainer')}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                {insights?.message ?? t('fieldView.noScenes')}
              </p>
            )}
          </Card>
        )}

        <Card className="relative overflow-hidden p-0">
          <Suspense fallback={<div className="flex h-[420px] items-center justify-center"><LoadingState /></div>}>
            <SatelliteMap
              lat={view.lat}
              lng={view.lng}
              zoom={view.zoom}
              showLabels={showLabels}
              overlayUrl={activeScene?.tileUrl ?? null}
              onOverlayLoadingChange={setOverlayLoading}
              className="h-[420px] w-full sm:h-[540px]"
            />
            {overlayLoading && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-[var(--bg-elevated)]/95 px-4 py-2 text-xs font-medium text-[var(--text)] shadow-lg backdrop-blur">
                {t('fieldView.loadingImagery')}
              </div>
            )}
          </Suspense>
          {activeScene && (
            <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--text-muted)]">
              {t('fieldView.showingPass', { date: formatDate(activeScene.date), days: daysAgo(activeScene.date) })}
              {' · '}{insights?.attribution}
            </div>
          )}
        </Card>

        {/* Crop vigour */}
        {hasFix && headline && (
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
              <Sprout size={15} /> {t('fieldView.cropHealth')}
            </h2>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <p className="text-4xl font-bold" style={{ color: NDVI_COLORS[headline.status!] }}>
                  {headline.ndvi!.toFixed(2)}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--text)]">
                  {t(`fieldView.ndvi.${headline.status}`)}
                </p>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                {t(`fieldView.ndviAdvice.${headline.status}`)}
              </p>
            </div>

            <NdviTrend scenes={insights!.scenes} />

            <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
              {t('fieldView.ndviExplainer', { m: insights!.sampledMetres })}
            </p>
          </Card>
        )}

        {/* Coordinates + external viewers */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t('fieldView.coordinates')}
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--text)]">
                {hasFix ? `${lat!.toFixed(6)}, ${lng!.toFixed(6)}` : t('fieldView.noFix')}
              </p>
            </div>
            {hasFix && (
              <Button variant="outline" size="sm" onClick={copyCoords}
                icon={copied ? <Check size={15} /> : <Copy size={15} />}>
                {copied ? t('fieldView.copied') : t('fieldView.copy')}
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ExternalCard href={hasFix ? googleMapsUrl(lat!, lng!) : undefined} icon={<MapIcon className="text-brand-600" size={22} />}
              title={t('fieldView.openGoogleMaps')} hint={t('fieldView.openGoogleMapsHint')} />
            <ExternalCard href={hasFix ? googleEarthUrl(lat!, lng!) : undefined} icon={<Globe className="text-brand-600" size={22} />}
              title={t('fieldView.openGoogleEarth')} hint={t('fieldView.openGoogleEarthHint')} />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">{t('fieldView.imageryNote')}</p>
        </Card>
      </div>
    </div>
  )
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function SceneChip({ scene, active, onClick }: { scene: Scene; active: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  const days = daysAgo(scene.date)
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]'
      }`}
    >
      <span className="block font-bold">{formatDate(scene.date)}</span>
      <span className="flex items-center gap-1 opacity-75">
        {days === 0 ? t('fieldView.today') : t('fieldView.daysAgo', { n: days })}
        {scene.cloudedOut && <CloudOff size={11} />}
      </span>
    </button>
  )
}

/** Simple bar chart of NDVI over the recent passes, oldest → newest. */
function NdviTrend({ scenes }: { scenes: Scene[] }) {
  const { t } = useTranslation()
  const ordered = [...scenes].reverse()
  const readable = ordered.filter((s) => s.ndvi !== null)
  if (readable.length < 2) return null

  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {t('fieldView.trend')}
      </p>
      <div className="flex h-24 items-end gap-2">
        {ordered.map((s) => (
          <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
            {s.ndvi === null ? (
              <>
                <div className="flex w-full flex-1 items-end justify-center">
                  <CloudOff size={14} className="mb-1 text-[var(--text-muted)]" />
                </div>
                <span className="text-[9px] text-[var(--text-muted)]">{formatDate(s.date)}</span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold text-[var(--text)]">{s.ndvi.toFixed(2)}</span>
                <div
                  className="w-full rounded-t"
                  // NDVI below ~0 is water or cloud shadow; clamping keeps a negative
                  // reading from rendering as an invisible zero-height bar.
                  style={{
                    height: `${Math.max(4, Math.min(1, Math.max(0, s.ndvi)) * 100)}%`,
                    backgroundColor: NDVI_COLORS[s.status!],
                  }}
                />
                <span className="text-[9px] text-[var(--text-muted)]">{formatDate(s.date)}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ExternalCard({ href, icon, title, hint }: { href?: string; icon: React.ReactNode; title: string; hint: string }) {
  const enabled = Boolean(href)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!enabled}
      className={`flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition-colors ${
        enabled ? 'hover:bg-[var(--surface-muted)]' : 'pointer-events-none opacity-50'
      }`}
    >
      {icon}
      <span className="flex-1">
        <span className="block font-semibold text-[var(--text)]">{title}</span>
        <span className="block text-xs text-[var(--text-muted)]">{hint}</span>
      </span>
      <ExternalLink className="text-[var(--text-muted)]" size={16} />
    </a>
  )
}
