import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Crosshair, Globe, Map as MapIcon, ExternalLink, Layers, Copy, Check } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/States'
import { useAuth } from '@/contexts/AuthContext'
import { useFarms } from '@/hooks/useFarms'

// Leaflet plus its CSS is ~45 KB gzipped — kept out of the main bundle so every other
// page still loads at the same weight it did before this feature existed.
const SatelliteMap = lazy(() =>
  import('@/components/SatelliteMap').then((m) => ({ default: m.SatelliteMap }))
)

/** Roughly the geographic centre of India — the fallback view when we have no location at all. */
const INDIA_CENTRE = { lat: 22.5937, lng: 78.9629, zoom: 5 }

function googleMapsUrl(lat: number, lng: number) {
  // `!3m1!1e3` is the satellite basemap; a plain link, no API key involved.
  return `https://www.google.com/maps/@${lat},${lng},18z/data=!3m1!1e3`
}

function googleEarthUrl(lat: number, lng: number) {
  // 500d = camera 500 m up, 35y tilt — a field-scale view rather than a globe view.
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

  const pinnedFarms = useMemo(
    () => farms.filter((f) => f.location_lat != null && f.location_lng != null),
    [farms]
  )

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError(t('fieldView.geoUnsupported'))
      return
    }
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

  // Try GPS once on open. If it's denied we fall back to the India-wide view rather than
  // showing a spinner forever — the farmer can still pick a farm or type coordinates.
  useEffect(() => {
    locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const view = lat != null && lng != null ? { lat, lng, zoom } : INDIA_CENTRE
  const hasFix = lat != null && lng != null

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
        {/* Location source controls */}
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={locate} loading={locating} icon={<Crosshair size={16} />}>
              {t('fieldView.useMyLocation')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLabels((v) => !v)}
              icon={<Layers size={16} />}
            >
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
              <Input
                label={t('fieldView.latitude')}
                inputMode="decimal"
                placeholder="20.5937"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-36"
              />
              <Input
                label={t('fieldView.longitude')}
                inputMode="decimal"
                placeholder="78.9629"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="w-36"
              />
              <Button variant="outline" onClick={applyManual}>
                {t('fieldView.goThere')}
              </Button>
            </div>
          </details>
        </Card>

        {/* The map */}
        <Card className="overflow-hidden p-0">
          <Suspense
            fallback={
              <div className="flex h-[420px] items-center justify-center">
                <LoadingState />
              </div>
            }
          >
            <SatelliteMap
              lat={view.lat}
              lng={view.lng}
              zoom={view.zoom}
              showLabels={showLabels}
              className="h-[420px] w-full sm:h-[540px]"
            />
          </Suspense>
        </Card>

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
              <Button
                variant="outline"
                size="sm"
                onClick={copyCoords}
                icon={copied ? <Check size={15} /> : <Copy size={15} />}
              >
                {copied ? t('fieldView.copied') : t('fieldView.copy')}
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a
              href={hasFix ? googleMapsUrl(lat!, lng!) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!hasFix}
              className={`flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition-colors ${
                hasFix ? 'hover:bg-[var(--surface-muted)]' : 'pointer-events-none opacity-50'
              }`}
            >
              <MapIcon className="text-brand-600" size={22} />
              <span className="flex-1">
                <span className="block font-semibold text-[var(--text)]">
                  {t('fieldView.openGoogleMaps')}
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {t('fieldView.openGoogleMapsHint')}
                </span>
              </span>
              <ExternalLink className="text-[var(--text-muted)]" size={16} />
            </a>

            <a
              href={hasFix ? googleEarthUrl(lat!, lng!) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!hasFix}
              className={`flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition-colors ${
                hasFix ? 'hover:bg-[var(--surface-muted)]' : 'pointer-events-none opacity-50'
              }`}
            >
              <Globe className="text-brand-600" size={22} />
              <span className="flex-1">
                <span className="block font-semibold text-[var(--text)]">
                  {t('fieldView.openGoogleEarth')}
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {t('fieldView.openGoogleEarthHint')}
                </span>
              </span>
              <ExternalLink className="text-[var(--text-muted)]" size={16} />
            </a>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
            {t('fieldView.imageryNote')}
          </p>
        </Card>
      </div>
    </div>
  )
}
