// Supabase Edge Function: field-insights
//
// Returns recent Sentinel-2 satellite coverage for a farm location: when the most
// recent usable image was captured, and a short NDVI (crop vigour) history.
//
// Why this exists: the map's base imagery (Esri World Imagery) is high resolution but
// undated and often months to years old, which is why a farmer's field never matches
// what they see out the window. Sentinel-2 passes over every ~5 days, is free, needs no
// API key, and — critically — every scene carries the exact date it was captured.
//
// Everything here is free and unauthenticated:
//   - Earth Search (Element 84) STAC API  — finds scenes by location and date
//   - TiTiler                             — reads pixel values out of the COG bands
// No API key, no account, no billing. Nothing in this function can incur a charge.
//
// Deploy: supabase functions deploy field-insights

const STAC_SEARCH = 'https://earth-search.aws.element84.com/v1/search'
const TITILER = 'https://titiler.xyz'

// Above ~40% cloud the scene is mostly weather, and any NDVI read from it is noise
// rather than signal. Better to show an older clear day than a recent cloudy one.
const MAX_CLOUD_COVER = 40
const LOOKBACK_DAYS = 75
const MAX_SCENES = 6

// A Sentinel-2 pixel is 10 m. One pixel over a small Indian holding is a noisy sample —
// a single tractor rut or bund can dominate it. Averaging a small cross around the pin
// (~20 m arms) is far more representative of the plot without needing a real polygon.
const SAMPLE_OFFSETS_M = 20

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StacFeature {
  id: string
  properties: { datetime: string; 'eo:cloud_cover'?: number }
  assets: Record<string, { href: string }>
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const controller = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  )
  return await Promise.race([p, controller])
}

/** Metres → degrees, latitude-corrected for longitude. */
function offsetPoints(lat: number, lng: number, metres: number) {
  const dLat = metres / 111_320
  const dLng = metres / (111_320 * Math.cos((lat * Math.PI) / 180))
  return [
    [lng, lat],
    [lng, lat + dLat],
    [lng, lat - dLat],
    [lng + dLng, lat],
    [lng - dLng, lat],
  ] as [number, number][]
}

async function pointValue(href: string, lng: number, lat: number): Promise<number | null> {
  try {
    const url = `${TITILER}/cog/point/${lng},${lat}?url=${encodeURIComponent(href)}`
    const res = await withTimeout(fetch(url), 8000)
    if (!res.ok) return null
    const data = await res.json()
    const v = data?.values?.[0]
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

// Sentinel-2's Scene Classification Layer, per pixel. Only these classes are ground we
// can actually measure: vegetation, bare soil, water, unclassified. Everything else —
// cloud, cloud shadow, cirrus, snow, saturated, no-data — means we are looking at
// weather, not at the field.
const SCL_USABLE = new Set([4, 5, 6, 7])

/**
 * NDVI = (NIR − Red) / (NIR + Red), cloud-masked per sample point.
 *
 * The scene-level cloud percentage is not enough on its own: a scene can be 30% cloudy
 * overall with the one cloud sitting directly over this farm. Cloud pixels reflect
 * strongly in red, which collapses NDVI toward zero and reads as "your crop is dead" —
 * exactly the false alarm this feature must never raise. So each sample point is checked
 * against the SCL band first and thrown away if it isn't clear ground.
 *
 * Returns null rather than a number whenever nothing usable remains. An honest "no
 * reading for this date" is far better than a confident wrong one.
 */
async function ndviAt(
  scene: StacFeature,
  points: [number, number][]
): Promise<{ ndvi: number | null; cloudy: boolean }> {
  const red = scene.assets.red?.href
  const nir = scene.assets.nir?.href
  const scl = scene.assets.scl?.href
  if (!red || !nir) return { ndvi: null, cloudy: false }

  let maskedOut = 0

  const reads = await Promise.all(
    points.map(async ([lng, lat]) => {
      const [r, n, cls] = await Promise.all([
        pointValue(red, lng, lat),
        pointValue(nir, lng, lat),
        scl ? pointValue(scl, lng, lat) : Promise.resolve(null),
      ])
      if (cls !== null && !SCL_USABLE.has(Math.round(cls))) {
        maskedOut += 1
        return null
      }
      if (r === null || n === null) return null
      const denom = n + r
      if (denom === 0) return null
      return (n - r) / denom
    })
  )

  const valid = reads.filter((v): v is number => v !== null)
  // Every sample was cloud/shadow — say so, rather than reporting nothing at all.
  if (!valid.length) return { ndvi: null, cloudy: maskedOut > 0 }
  return { ndvi: valid.reduce((a, b) => a + b, 0) / valid.length, cloudy: false }
}

/** Plain-language band for a farmer, not a remote-sensing scale. */
function interpret(ndvi: number): string {
  if (ndvi < 0.15) return 'bare'
  if (ndvi < 0.3) return 'sparse'
  if (ndvi < 0.5) return 'growing'
  if (ndvi < 0.7) return 'healthy'
  return 'dense'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { lat, lng } = (await req.json()) as { lat?: number; lng?: number }
    if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return json({ error: 'A valid lat and lng are required.' }, 400)
    }

    const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString().slice(0, 10)

    const searchRes = await withTimeout(
      fetch(STAC_SEARCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collections: ['sentinel-2-l2a'],
          intersects: { type: 'Point', coordinates: [lng, lat] },
          datetime: `${since}T00:00:00Z/..`,
          query: { 'eo:cloud_cover': { lt: MAX_CLOUD_COVER } },
          sortby: [{ field: 'properties.datetime', direction: 'desc' }],
          limit: MAX_SCENES,
        }),
      }),
      12_000
    )

    if (!searchRes.ok) {
      return json({ error: 'Could not reach the satellite catalogue. Please try again.' }, 502)
    }

    const { features } = (await searchRes.json()) as { features: StacFeature[] }
    if (!features?.length) {
      return json({
        scenes: [],
        message: `No clear satellite image of this location in the last ${LOOKBACK_DAYS} days — it has been too cloudy.`,
      })
    }

    const finePoints = offsetPoints(lat, lng, SAMPLE_OFFSETS_M)

    // Every scene gets the multi-point average now that each point is cloud-masked —
    // a single centre read that lands under a cloud would silently poison the trend.
    const readings = await Promise.all(features.map((f) => ndviAt(f, finePoints)))

    const scenes = features.map((f, i) => {
      const { ndvi, cloudy } = readings[i]
      return {
        id: f.id,
        date: f.properties.datetime.slice(0, 10),
        cloudCover: Math.round(f.properties['eo:cloud_cover'] ?? 0),
        ndvi: ndvi === null ? null : Number(ndvi.toFixed(3)),
        status: ndvi === null ? null : interpret(ndvi),
        cloudedOut: ndvi === null && cloudy,
        // Rendered browser-side as a Leaflet layer; TCI is the ready-made true-colour image.
        tileUrl: f.assets.visual?.href
          ? `${TITILER}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}?url=${encodeURIComponent(f.assets.visual.href)}`
          : null,
      }
    })

    // The headline reading must be the most recent scene that actually saw the ground.
    // The newest scene is often the cloudy one, and leading with "bare" because a cloud
    // passed over would be the single most damaging thing this feature could say.
    const latestUsable = scenes.find((s) => s.ndvi !== null) ?? null

    return json({
      scenes,
      latest: scenes[0],
      latestUsable,
      sampledMetres: SAMPLE_OFFSETS_M,
      attribution: 'Contains modified Copernicus Sentinel data, processed by ESA',
    })
  } catch (err) {
    const msg = err instanceof Error && err.message === 'timeout'
      ? 'The satellite service took too long to respond. Please try again.'
      : 'Could not load satellite data right now.'
    return json({ error: msg }, 504)
  }
})
