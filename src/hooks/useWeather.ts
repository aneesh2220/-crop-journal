import { useEffect, useState } from 'react'
import { fetchWeather, type WeatherData } from '@/lib/weatherApi'
import { isSupabaseConfigured } from '@/lib/supabase'

export function useWeather(lat: number | null, lon: number | null, units: 'metric' | 'imperial' = 'metric') {
  const [data, setData] = useState<WeatherData | null>(null)
  // Starts false — with no coordinates yet there's nothing to load, so a page
  // waiting on geolocation shouldn't show an indefinite spinner.
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConnected, setNotConnected] = useState(false)

  useEffect(() => {
    if (lat === null || lon === null) return
    let active = true
    setLoading(true)
    setError(null)
    fetchWeather(lat, lon, units)
      .then((d) => active && setData(d))
      .catch((err) => {
        if (!active) return
        if (!isSupabaseConfigured || err.name === 'WeatherNotConfiguredError') setNotConnected(true)
        else setError(err.message)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [lat, lon, units])

  return { data, loading, error, notConnected }
}
