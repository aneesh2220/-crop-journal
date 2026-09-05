import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { withTimeout } from '@/lib/functionsError'

export type NdviStatus = 'bare' | 'sparse' | 'growing' | 'healthy' | 'dense'

export interface Scene {
  id: string
  /** YYYY-MM-DD — the day the satellite actually passed over. */
  date: string
  /** Cloud cover across the whole scene, not just this farm. */
  cloudCover: number
  ndvi: number | null
  status: NdviStatus | null
  /** True when the farm itself was under cloud, even if the scene was mostly clear. */
  cloudedOut: boolean
  tileUrl: string | null
}

export interface FieldInsights {
  scenes: Scene[]
  /** Newest pass, which may be clouded out. */
  latest: Scene | null
  /** Newest pass that actually saw the ground — this is the one to headline. */
  latestUsable: Scene | null
  sampledMetres: number
  attribution: string
  message?: string
}

export async function fetchFieldInsights(lat: number, lng: number): Promise<FieldInsights> {
  if (!isSupabaseConfigured) throw new Error('Backend not connected')

  const { data, error } = await withTimeout(
    supabase.functions.invoke('field-insights', { body: { lat, lng } }),
    45_000
  )
  if (error) throw new Error('Could not load satellite data right now.')
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
  return data as FieldInsights
}

/** Whole days between a YYYY-MM-DD capture date and today, in local time. */
export function daysAgo(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const then = new Date(y, m - 1, d).getTime()
  const today = new Date()
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return Math.max(0, Math.round((now - then) / 86_400_000))
}

/** Colour ramp matching the plain-language bands, red (bare) → deep green (dense). */
export const NDVI_COLORS: Record<NdviStatus, string> = {
  bare: '#b45309',
  sparse: '#d97706',
  growing: '#84cc16',
  healthy: '#4a9c60',
  dense: '#15803d',
}
