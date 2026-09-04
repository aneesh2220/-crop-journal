import { useEffect, useState } from 'react'

interface GeoState {
  lat: number | null
  lon: number | null
  loading: boolean
  error: string | null
}

export function useGeolocation(fallback?: { lat: number; lon: number }) {
  const [state, setState] = useState<GeoState>({ lat: fallback?.lat ?? null, lon: fallback?.lon ?? null, loading: true, error: null })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: 'Geolocation is not supported on this device' }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ lat: pos.coords.latitude, lon: pos.coords.longitude, loading: false, error: null }),
      (err) => setState((s) => ({ ...s, loading: false, error: err.message })),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    )
  }, [])

  return state
}
