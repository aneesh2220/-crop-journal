// Supabase Edge Function: ai-assist
// Proxies all Gemini calls for the app (chat, crop doctor, soil health, crop
// suggestions, irrigation advice) so the Gemini API key never reaches the browser.
//
// Deploy:  supabase functions deploy ai-assist
// Secret:  supabase secrets set GEMINI_API_KEY=xxxx

import { createClient } from 'jsr:@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Hard, code-enforced spend-safety ceiling — refuses further Gemini calls once this
// many have happened app-wide today, regardless of Google Cloud billing/alert config.
// Worst-case cost math (image-attached request, full retry+fallback chain, ~2000 input
// + ~500 output tokens per attempt): ~$0.01/request worst case × 100/day ≈ $1/day ceiling,
// i.e. under $30/month even in the pessimistic case where every single request maxes out
// every retry — realistic usage costs a small fraction of this. Adjust freely; this exists
// so "how much could this possibly cost" always has a concrete, calculable answer.
const MAX_DAILY_AI_REQUESTS = 100

// Flash-Lite gets ~50% more free-tier throughput than full Flash (15 RPM vs 10 RPM),
// and this app's tasks — farming Q&A, structured extraction like Crop Doctor's JSON
// output — don't need deep multi-step reasoning. So Lite is PRIMARY for reliability;
// full Flash is the fallback for when Lite itself has trouble, trading a bit of quality
// for a lot of headroom. Verify exact model IDs before changing either — a mistyped or
// EOL'd name (e.g. gemini-2.0-flash, retired March 2026) makes the fallback silently
// useless, which is exactly what happened here twice before this fix.
const PRIMARY_MODEL = 'gemini-3.5-flash-lite'
const FALLBACK_MODEL = 'gemini-3.6-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  task: 'chat' | 'crop-doctor' | 'soil-health' | 'crop-suggestion' | 'irrigation'
  language: string
  text?: string
  imageBase64?: string
  history?: { role: 'user' | 'assistant'; content: string }[]
  context?: Record<string, unknown>
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function languageInstruction(lang: string) {
  return `Respond ONLY in the language with BCP-47/ISO code "${lang}" (use the natural script for that language). Keep the tone simple, warm and easy for a rural farmer with limited literacy to understand. Avoid jargon; explain plainly.`
}

function buildPrompt(body: RequestBody): string {
  const langInstr = languageInstruction(body.language)

  switch (body.task) {
    case 'chat':
      return `You are AgroAI, a helpful, encouraging farming assistant for smallholder farmers in India. ${langInstr}\n\nAnswer the farmer's question clearly and practically. If it needs region-specific data you don't have (like exact local prices or forecasts), say so honestly instead of inventing numbers.\n\nFarmer's question: ${body.text ?? '(see attached image)'}`
    case 'crop-doctor':
      return `You are an expert plant pathologist helping a farmer diagnose a crop problem from a photo and/or symptom description. ${langInstr}\n\nSymptoms described: ${body.text || '(none, rely on image)'}\n\nReturn ONLY valid JSON matching this exact shape, no markdown fences, no extra text:\n{"problem": string, "confidence": number (0-1), "causes": string[], "treatment": string[], "prevention": string[], "severity": "low"|"medium"|"high"}\nAll string values must be written in the target language.`
    case 'soil-health': {
      const c = body.context ?? {}
      return `You are a soil science expert. A farmer has provided the following soil data (any field may be missing): pH=${c.ph ?? 'unknown'}, Nitrogen=${c.nitrogen ?? 'unknown'} mg/kg, Phosphorus=${c.phosphorus ?? 'unknown'} mg/kg, Potassium=${c.potassium ?? 'unknown'} mg/kg, texture=${c.texture ?? 'unknown'}. ${body.imageBase64 ? 'A soil photo is also attached.' : ''} ${langInstr}\n\nReturn ONLY valid JSON matching this exact shape, no markdown fences:\n{"summary": string, "health_score": number (0-100), "recommendations": string[], "suitable_crops": string[]}`
    }
    case 'crop-suggestion': {
      const c = body.context ?? {}
      return `You are an agronomy advisor. Suggest the best crops for a farmer with: location=${c.location ?? 'unspecified'}, soil type=${c.soilType ?? 'unspecified'}, season=${c.season ?? 'unspecified'}, water availability=${c.water ?? 'unspecified'}, additional needs=${c.needs ?? 'none'}. ${langInstr}\n\nReturn ONLY valid JSON matching this exact shape, no markdown fences:\n{"crops": [{"name": string, "suitability": number (0-100), "reason": string}]} with 3-6 crops, ranked best first.`
    }
    case 'irrigation': {
      const c = body.context ?? {}
      return `You are an irrigation specialist. Advise a farmer growing crop=${c.crop ?? 'unspecified'}, soil type=${c.soilType ?? 'unspecified'}, growth stage=${c.stage ?? 'unspecified'}, current weather=${c.weather ?? 'unspecified'}. ${langInstr}\n\nReturn ONLY valid JSON matching this exact shape, no markdown fences:\n{"schedule": string, "tips": string[], "waterAmount": string}`
    }
  }
}

function buildParts(prompt: string, imageBase64?: string, history?: RequestBody['history']): unknown[] {
  const parts: unknown[] = []
  if (history?.length) {
    const historyText = history.map((h) => `${h.role === 'user' ? 'Farmer' : 'AgroAI'}: ${h.content}`).join('\n')
    parts.push({ text: `Conversation so far:\n${historyText}\n\n` })
  }
  parts.push({ text: prompt })
  if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } })
  return parts
}

function generationConfig(model: string, expectJson: boolean) {
  return {
    temperature: 0.6,
    // Only the full gemini-3.6-flash model has extended "thinking" on by default (which
    // adds real latency) and understands this field — Flash-Lite is already tuned for
    // low latency and doesn't need it. This is a farming Q&A assistant, not a multi-step
    // reasoning agent, so "low" trades away deep reasoning for speed when it does apply.
    ...(model === 'gemini-3.6-flash' ? { thinkingConfig: { thinkingLevel: 'low' } } : {}),
    ...(expectJson ? { responseMimeType: 'application/json' } : {}),
  }
}

/**
 * Retrying the SAME model only makes sense for 503 (transient overload) — a brief
 * backoff can genuinely help. It's pointless for 429 (quota exhausted): the quota
 * window won't clear in under a second, and each retry only burns more of a scarce
 * free-tier daily allowance. So: 503 gets one same-model retry, then either error
 * moves straight to the fallback model (a different model = a separate quota pool).
 */
function friendlyGeminiError(status: number, raw: string): string {
  if (status === 429) {
    return 'AI usage limit reached — this app is on Gemini\'s free-tier quota, which caps requests per day. It resets automatically, or the app owner can enable billing on the Gemini API key for much higher limits.'
  }
  if (status === 503) {
    return 'The AI service is very busy right now. Please try again in a minute.'
  }
  return raw
}

/** Non-streaming call, used by the structured tasks that need a complete JSON body. */
async function callGemini(prompt: string, imageBase64?: string, history?: RequestBody['history'], expectJson = false) {
  const parts = buildParts(prompt, imageBase64, history)
  let lastStatus = 0
  let lastMessage = 'Unknown error'

  for (const model of [PRIMARY_MODEL, PRIMARY_MODEL, FALLBACK_MODEL]) {
    if (lastStatus === 503) await sleep(900) // only worth a backoff after overload, not after quota exhaustion
    if (lastStatus === 429 && model === PRIMARY_MODEL) continue // quota won't have cleared — skip straight past the repeat

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25_000)
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: generationConfig(model, expectJson) }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errText = await res.text()
        lastStatus = res.status
        lastMessage = `Gemini API error (${res.status}): ${errText.slice(0, 300)}`
        if (res.status !== 503 && res.status !== 429) break // other errors won't fix themselves on retry
        continue
      }

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ?? ''
      if (!text) {
        lastMessage = 'Gemini returned an empty response'
        break
      }
      return text
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastMessage = 'Gemini took too long to respond. Please try again.'
        break
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error(friendlyGeminiError(lastStatus, lastMessage))
}

/**
 * Streams plain chat replies token-by-token instead of waiting for the full
 * response — the client can render text as it arrives instead of staring at a
 * spinner for the whole generation. Structured tasks still use callGemini()
 * above since they need the complete JSON body before it can be parsed.
 *
 * Overload (503) errors happen on the initial response, before any tokens
 * stream — so it's safe to retry/fall back to a different model at that point,
 * same as the non-streaming path.
 */
function streamGeminiChat(prompt: string, history?: RequestBody['history']): ReadableStream<Uint8Array> {
  const parts = buildParts(prompt, undefined, history)
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let upstream: Response | null = null
      let lastStatus = 0
      let lastMessage = 'Unknown error'

      for (const model of [PRIMARY_MODEL, PRIMARY_MODEL, FALLBACK_MODEL]) {
        if (upstream) break
        if (lastStatus === 503) await sleep(900)
        if (lastStatus === 429 && model === PRIMARY_MODEL) continue

        const abortController = new AbortController()
        const timeout = setTimeout(() => abortController.abort(), 25_000)
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: generationConfig(model, false) }),
              signal: abortController.signal,
            }
          )
          if (res.ok && res.body) {
            upstream = res
          } else {
            const errText = await res.text().catch(() => '')
            lastStatus = res.status
            lastMessage = `Gemini API error (${res.status}): ${errText.slice(0, 200)}`
            if (res.status !== 503 && res.status !== 429) break
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            lastMessage = 'Gemini took too long to respond. Please try again.'
            break
          }
          lastMessage = String(err)
          break
        } finally {
          clearTimeout(timeout)
        }
      }

      if (!upstream) {
        controller.enqueue(encoder.encode(`__ERROR__:${friendlyGeminiError(lastStatus, lastMessage)}`))
        controller.close()
        return
      }

      try {
        const reader = upstream.body!.getReader()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const jsonStr = trimmed.slice(5).trim()
            if (!jsonStr) continue
            try {
              const parsed = JSON.parse(jsonStr)
              const chunkText = parsed.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
              if (chunkText) controller.enqueue(encoder.encode(chunkText))
            } catch {
              // partial/malformed SSE line — skip, next chunk will complete it
            }
          }
        }
        controller.close()
      } catch (err) {
        controller.enqueue(encoder.encode(`__ERROR__:${err instanceof Error ? err.message : String(err)}`))
        controller.close()
      }
    },
  })
}

/**
 * Atomically increments today's app-wide request counter and returns the new total.
 * Uses the service-role key deliberately — this table has no RLS policies, so no
 * client (not even an authenticated one) can read or write it directly; only this
 * function, running server-side, can touch it.
 */
async function checkAndIncrementDailyUsage(): Promise<{ allowed: boolean; count: number }> {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await adminClient.rpc('increment_ai_usage_and_get_count', { p_date: today })
  if (error || typeof data !== 'number') {
    // If the counter itself is broken, fail open rather than taking the whole
    // feature down over a bookkeeping issue — the per-call timeouts and model
    // fallback are still in place as independent safeguards.
    console.error('ai_usage_daily counter failed:', error)
    return { allowed: true, count: -1 }
  }
  return { allowed: data <= MAX_DAILY_AI_REQUESTS, count: data }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401)

    if (!GEMINI_API_KEY) return json({ error: 'AI backend is not connected yet.' }, 503)

    const usage = await checkAndIncrementDailyUsage()
    if (!usage.allowed) {
      return json({ error: "AgroAI's daily AI usage safety limit has been reached. This is a deliberate cap to prevent runaway costs — it resets at midnight UTC." }, 429)
    }

    const body = (await req.json()) as RequestBody
    const prompt = buildPrompt(body)

    if (body.task === 'chat') {
      const stream = streamGeminiChat(prompt, body.history)
      return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    const text = await callGemini(prompt, body.imageBase64, body.history, true)

    try {
      const parsed = JSON.parse(text.trim().replace(/^```json\s*|```$/g, ''))
      return json(parsed)
    } catch {
      return json({ error: 'AI returned an unexpected format. Please try again.' }, 502)
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
