import { supabase, isSupabaseConfigured } from './supabase'
import { extractFunctionErrorMessage, withTimeout } from './functionsError'

export interface MandiPrice {
  commodity: string
  variety: string
  market: string
  state: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  unit: string
  date: string
  trend: 'up' | 'down' | 'flat'
}

export class MarketNotConfiguredError extends Error {
  constructor() {
    super('Market data API is not connected yet.')
    this.name = 'MarketNotConfiguredError'
  }
}

export async function fetchMandiPrices(params: { commodity?: string; state?: string; market?: string }): Promise<MandiPrice[]> {
  if (!isSupabaseConfigured) throw new MarketNotConfiguredError()
  const { data, error } = await withTimeout(supabase.functions.invoke('market-proxy', { body: params }), 25_000)
  if (error) {
    const message = await extractFunctionErrorMessage(error)
    if (message.includes('not connected')) throw new MarketNotConfiguredError()
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return (data?.records as MandiPrice[]) ?? []
}

export interface NationalPrice {
  id: string
  name: string
  icon: string
  price: number
  minPrice: number
  maxPrice: number
  unit: string
  change: number
  trend: 'up' | 'down' | 'flat'
  msp: number | null
  mspSeason: string | null
  majorStates: string[]
  updated: string
}

/**
 * A national per-commodity snapshot (one price per crop, not per-mandi) from farmer.in —
 * a free, no-key, CORS-enabled public endpoint, itself sourced from the same government
 * Agmarknet data. Called directly from the browser (no secret to protect, so no edge
 * function needed) and used as an always-available panel so the Market page still shows
 * real prices even when the detailed government mandi search returns nothing for a given
 * crop/state combination — different granularity, same underlying government data.
 */
export async function fetchNationalPrices(): Promise<NationalPrice[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch('https://farmer.in/api/open/prices.json', { signal: controller.signal })
    if (!res.ok) throw new Error(`farmer.in error (${res.status})`)
    const data = await res.json()
    const commodities = (data?.commodities as Record<string, unknown>[]) ?? []
    return commodities.map((c) => ({
      id: c.id as string,
      name: c.name as string,
      icon: (c.icon as string) ?? '🌾',
      price: Number(c.price),
      minPrice: Number(c.min),
      maxPrice: Number(c.max),
      unit: (c.unit as string) ?? 'quintal',
      change: Number(c.change ?? 0),
      trend: (c.trend as 'up' | 'down' | 'flat') ?? 'flat',
      msp: c.msp != null ? Number(c.msp) : null,
      mspSeason: (c.msp_season as string) ?? null,
      majorStates: (c.major_states as string[]) ?? [],
      updated: (c.updated as string) ?? '',
    }))
  } finally {
    clearTimeout(timeout)
  }
}
