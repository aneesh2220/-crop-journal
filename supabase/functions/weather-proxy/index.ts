// Supabase Edge Function: weather-proxy
// Proxies OpenWeatherMap (One Call + Air Pollution) so the API key stays server-side.
//
// Deploy:  supabase functions deploy weather-proxy
// Secret:  supabase secrets set OPENWEATHER_API_KEY=xxxx

import { createClient } from 'jsr:@supabase/supabase-js@2'

const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function classifyAlertSeverity(event: string): 'low' | 'medium' | 'high' {
  const e = event.toLowerCase()
  if (e.includes('extreme') || e.includes('warning') || e.includes('cyclone') || e.includes('flood')) return 'high'
  if (e.includes('watch') || e.includes('advisory')) return 'medium'
  return 'low'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401)

    if (!OPENWEATHER_API_KEY) return json({ error: 'Weather API is not connected yet.' }, 503)

    const { lat, lon, units = 'metric' } = await req.json()
    if (typeof lat !== 'number' || typeof lon !== 'number') return json({ error: 'lat/lon required' }, 400)

    // A bound here stops a stalled upstream call from hanging the whole request forever.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    let currentRes: Response, forecastRes: Response
    try {
      ;[currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_API_KEY}`, { signal: controller.signal }),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_API_KEY}`, { signal: controller.signal }),
      ])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return json({ error: 'Weather provider took too long to respond. Please try again.' }, 504)
      throw err
    } finally {
      clearTimeout(timeout)
    }

    if (!currentRes.ok) return json({ error: `Weather provider error (${currentRes.status})` }, 502)
    const current = await currentRes.json()
    const forecastJson = forecastRes.ok ? await forecastRes.json() : null

    // Bucket the 3-hourly forecast list into daily min/max for the next 5 days.
    const dayMap = new Map<string, { min: number; max: number; conditions: string[]; icons: string[]; rain: number[] }>()
    if (forecastJson?.list) {
      for (const entry of forecastJson.list) {
        const date = new Date(entry.dt * 1000).toISOString().slice(0, 10)
        const bucket = dayMap.get(date) ?? { min: Infinity, max: -Infinity, conditions: [], icons: [], rain: [] }
        bucket.min = Math.min(bucket.min, entry.main.temp_min)
        bucket.max = Math.max(bucket.max, entry.main.temp_max)
        bucket.conditions.push(entry.weather[0]?.description ?? '')
        bucket.icons.push(entry.weather[0]?.icon ?? '')
        bucket.rain.push(Math.round((entry.pop ?? 0) * 100))
        dayMap.set(date, bucket)
      }
    }
    const forecast = Array.from(dayMap.entries())
      .slice(0, 5)
      .map(([date, b]) => ({
        date,
        minTemp: b.min,
        maxTemp: b.max,
        condition: b.conditions[Math.floor(b.conditions.length / 2)] ?? '',
        icon: b.icons[Math.floor(b.icons.length / 2)] ?? '',
        rainChance: Math.max(...b.rain),
      }))

    const windSpeedMs = units === 'imperial' ? current.wind.speed * 0.44704 : current.wind.speed
    const rainMm = current.rain?.['1h'] ?? current.rain?.['3h'] ?? 0

    let farmingImpact = 'Conditions look stable for regular field activity today.'
    if (rainMm > 5) farmingImpact = 'Notable rainfall expected — hold off on spraying and consider delaying irrigation.'
    else if (current.main.temp > 38) farmingImpact = 'High heat — irrigate early morning or evening to reduce water loss.'
    else if (windSpeedMs > 8) farmingImpact = 'Strong winds — avoid spraying pesticides/fertilizer today.'

    const alerts = (current.alerts ?? []).map((a: { event: string; description: string }) => ({
      title: a.event,
      description: a.description,
      severity: classifyAlertSeverity(a.event),
    }))

    return json({
      location: current.name || 'Your location',
      temp: current.main.temp,
      feelsLike: current.main.feels_like,
      condition: current.weather[0]?.description ?? '',
      icon: current.weather[0]?.icon ?? '',
      humidity: current.main.humidity,
      windSpeed: Math.round(windSpeedMs * 10) / 10,
      uvIndex: null,
      rainfallMm: rainMm,
      farmingImpact,
      alerts,
      forecast,
    })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
