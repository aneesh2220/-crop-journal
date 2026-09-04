// Supabase Edge Function: market-proxy
// Proxies data.gov.in's "Variety-wise Daily Market Prices" (Agmarknet) dataset
// so the API key stays server-side.
//
// Deploy:  supabase functions deploy market-proxy
// Secret:  supabase secrets set DATA_GOV_IN_API_KEY=xxxx

import { createClient } from 'jsr:@supabase/supabase-js@2'

const DATA_GOV_IN_API_KEY = Deno.env.get('DATA_GOV_IN_API_KEY')
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

interface RawRecord {
  commodity: string
  variety: string
  market: string
  state: string
  min_price: string | number
  max_price: string | number
  modal_price: string | number
  arrival_date: string
}

/** The API returns dates as "DD/MM/YYYY" — plain string comparison sorts them
 * alphabetically, not chronologically (e.g. "05/09/2026" < "18/08/2026" as strings,
 * even though August is earlier than September). Convert to a real sortable value. */
function parseArrivalDate(dateStr: string): number {
  const [day, month, year] = dateStr.split('/').map(Number)
  if (!day || !month || !year) return 0
  return new Date(year, month - 1, day).getTime()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401)

    if (!DATA_GOV_IN_API_KEY) return json({ error: 'Market data API is not connected yet.' }, 503)

    const { commodity, state, market } = await req.json().catch(() => ({}))

    // This API silently breaks when more than one `filters[x]=y` param is sent at once —
    // it doesn't error, it just ignores every filter and returns generic unfiltered
    // results, which looked identical to "no data" from the client's perspective. It
    // does support exactly one filter reliably, so we send only the most selective one
    // (commodity, since a specific crop narrows the result set far more than a state
    // does) with a larger page size, then apply any remaining filters ourselves below.
    const params = new URLSearchParams({
      'api-key': DATA_GOV_IN_API_KEY,
      format: 'json',
      limit: commodity ? '1000' : '100',
      'sort[arrival_date]': 'desc',
    })
    if (commodity) params.set('filters[commodity]', commodity)
    else if (state) params.set('filters[state]', state)
    else if (market) params.set('filters[market]', market)

    // A bound here stops a stalled upstream call from hanging the whole request forever.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    let res: Response
    try {
      res = await fetch(`https://api.data.gov.in/resource/${RESOURCE_ID}?${params.toString()}`, { signal: controller.signal })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return json({ error: 'Market data provider took too long to respond. Please try again.' }, 504)
      throw err
    } finally {
      clearTimeout(timeout)
    }
    if (!res.ok) return json({ error: `Market data provider error (${res.status})` }, 502)
    const data = await res.json()
    let records: RawRecord[] = data.records ?? []

    // Apply any filter(s) the API call above didn't already cover, in-memory.
    if (commodity && state) records = records.filter((r) => r.state === state)
    if (commodity && market) records = records.filter((r) => r.market === market)

    // Group by commodity+variety+market so we can derive a trend from the two most recent dates.
    const groups = new Map<string, RawRecord[]>()
    for (const r of records) {
      const key = `${r.commodity}|${r.variety}|${r.market}`
      const arr = groups.get(key) ?? []
      arr.push(r)
      groups.set(key, arr)
    }

    const result = Array.from(groups.values()).map((entries) => {
      entries.sort((a, b) => parseArrivalDate(b.arrival_date) - parseArrivalDate(a.arrival_date))
      const latest = entries[0]
      const prior = entries[1]
      let trend: 'up' | 'down' | 'flat' = 'flat'
      if (prior) {
        const latestModal = Number(latest.modal_price)
        const priorModal = Number(prior.modal_price)
        if (latestModal > priorModal) trend = 'up'
        else if (latestModal < priorModal) trend = 'down'
      }
      return {
        commodity: latest.commodity,
        variety: latest.variety,
        market: latest.market,
        state: latest.state,
        minPrice: Number(latest.min_price),
        maxPrice: Number(latest.max_price),
        modalPrice: Number(latest.modal_price),
        unit: 'quintal',
        date: latest.arrival_date,
        trend,
      }
    })

    return json({ records: result })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
