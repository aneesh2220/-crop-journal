import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Esri's World Imagery is used instead of Google's tiles because it needs no API key,
// no billing account and no attribution token — Google's Maps JS/Tiles APIs all require
// a key tied to a card. Resolution over Indian farmland is comparable, often better.
const IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
// Village/road/field-boundary labels, drawn on top of the imagery so the farmer can
// orient themselves — bare satellite with no names is hard to navigate.
const LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

// Leaflet's stock marker points at PNGs via relative paths that don't survive bundling,
// which shows up as a broken-image icon. A pure-CSS divIcon avoids the asset entirely.
const PIN_ICON = L.divIcon({
  className: '',
  html:
    '<div style="width:18px;height:18px;border-radius:9999px;background:#e0a527;' +
    'border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.4),0 2px 6px rgba(0,0,0,.5)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export function SatelliteMap({
  lat,
  lng,
  zoom = 17,
  showLabels = true,
  className,
}: {
  lat: number
  lng: number
  zoom?: number
  showLabels?: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const labelsRef = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom,
      // Esri's imagery stops at z19 in most of rural India; letting the user zoom past
      // that just shows grey tiles, so cap it.
      maxZoom: 19,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer(IMAGERY_URL, {
      maxZoom: 19,
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    }).addTo(map)

    markerRef.current = L.marker([lat, lng], { icon: PIN_ICON }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      labelsRef.current = null
    }
    // Intentionally mount-only: re-centring on prop change is handled by the effects below,
    // so the map instance itself is never torn down and rebuilt mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setView([lat, lng], zoom)
    markerRef.current?.setLatLng([lat, lng])
  }, [lat, lng, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (showLabels && !labelsRef.current) {
      labelsRef.current = L.tileLayer(LABELS_URL, { maxZoom: 19 }).addTo(map)
    } else if (!showLabels && labelsRef.current) {
      map.removeLayer(labelsRef.current)
      labelsRef.current = null
    }
  }, [showLabels])

  return <div ref={containerRef} className={className} />
}
