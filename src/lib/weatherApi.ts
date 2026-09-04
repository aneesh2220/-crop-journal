import { supabase, isSupabaseConfigured } from './supabase'
import { extractFunctionErrorMessage, withTimeout } from './functionsError'

export interface WeatherData {
  location: string
  temp: number
  feelsLike: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  uvIndex: number | null
  rainfallMm: number
  farmingImpact: string
  alerts: { title: string; description: string; severity: 'low' | 'medium' | 'high' }[]
  forecast: {
    date: string
    minTemp: number
    maxTemp: number
    condition: string
    icon: string
    rainChance: number
  }[]
}

export class WeatherNotConfiguredError extends Error {
  constructor() {
    super('Weather API is not connected yet.')
    this.name = 'WeatherNotConfiguredError'
  }
}

export async function fetchWeather(lat: number, lon: number, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
  if (!isSupabaseConfigured) throw new WeatherNotConfiguredError()
  const { data, error } = await withTimeout(
    supabase.functions.invoke('weather-proxy', { body: { lat, lon, units } }),
    25_000
  )
  if (error) {
    const message = await extractFunctionErrorMessage(error)
    if (message.includes('not connected')) throw new WeatherNotConfiguredError()
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data as WeatherData
}
