/**
 * A non-interactive satellite snapshot built from a grid of Esri World Imagery
 * tiles. Used on the printable Farm Activity Record, where Leaflet is the wrong
 * tool — an interactive map doesn't print, and pulling 45 KB of map library into
 * a document that never pans is waste.
 *
 * The imagery matters on that document specifically because it is the one piece
 * of evidence there that the farmer did not produce themselves.
 */

const IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile'

function lngToTileX(lng: number, z: number) {
  return ((lng + 180) / 360) * 2 ** z
}

function latToTileY(lat: number, z: number) {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
}

export function StaticSatellite({
  lat,
  lng,
  zoom = 17,
  /** Grid size in tiles. 3 covers roughly 900 m across at zoom 17 — a field, plus context. */
  grid = 3,
  className,
}: {
  lat: number
  lng: number
  zoom?: number
  grid?: number
  className?: string
}) {
  const fx = lngToTileX(lng, zoom)
  const fy = latToTileY(lat, zoom)
  const cx = Math.floor(fx)
  const cy = Math.floor(fy)
  const half = Math.floor(grid / 2)

  // Everything is positioned as a percentage of the grid rather than in tile pixels,
  // so the block scales to whatever width the page gives it. Laying tiles out at a
  // fixed 256px and scaling by 1/grid only works if the container happens to be
  // exactly `grid * 256` wide — at any other width the imagery under-fills the box.
  const step = 100 / grid
  const markerLeftPct = ((fx - (cx - half)) / grid) * 100
  const markerTopPct = ((fy - (cy - half)) / grid) * 100

  const tiles = []
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      const x = cx - half + col
      const y = cy - half + row
      tiles.push(
        <img
          key={`${x}-${y}`}
          src={`${IMAGERY}/${zoom}/${y}/${x}`}
          alt=""
          loading="eager"
          style={{
            position: 'absolute',
            left: `${col * step}%`,
            top: `${row * step}%`,
            width: `${step}%`,
            height: `${step}%`,
            display: 'block',
          }}
        />
      )
    }
  }

  return (
    <figure className={className}>
      <div
        style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden' }}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]"
      >
        {tiles}
        <div
          style={{
            position: 'absolute',
            left: `${markerLeftPct}%`,
            top: `${markerTopPct}%`,
            width: 22,
            height: 22,
            marginLeft: -11,
            marginTop: -11,
            borderRadius: '9999px',
            background: '#e0a527',
            border: '4px solid #fff',
            boxShadow: '0 0 0 1.5px rgba(0,0,0,.5)',
          }}
        />
      </div>
      <figcaption className="mt-1.5 text-[10px] leading-snug text-[var(--text-muted)]">
        Satellite imagery © Esri, Maxar, Earthstar Geographics · {lat.toFixed(5)}, {lng.toFixed(5)} · zoom {zoom}
      </figcaption>
    </figure>
  )
}
