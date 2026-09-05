// Supabase Edge Function: ai-assist
// Proxies all Claude calls for the app (chat, crop doctor, soil health, crop
// suggestions, irrigation advice) so the Anthropic API key never reaches the browser.
//
// Deploy:  supabase functions deploy ai-assist
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from 'jsr:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.124.0'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
// Kept as an automatic fallback. A borrowed or rotated Anthropic key can stop working
// with no warning, and when it does EVERY AI feature in the app dies at once. Falling
// back to Gemini's free tier means farmers keep getting answers instead of an error,
// and the app silently returns to Claude the moment a valid key is in place.
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-3.5-flash-lite'

// Last-resort tier, used only when both providers above are unavailable — typically
// when Gemini's free-tier quota is exhausted. Groq runs open-weight models, which are
// weaker on the smaller Indian languages and on reading crop photos, so it must never
// be preferred over Gemini. As a fallback it is clearly right: a rougher answer beats
// telling a farmer the assistant is down.
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Two independent daily ceilings.
//
// APP-WIDE is the spend guard. It was set to 100 when Claude — which bills every single
// request — was the only provider. On Gemini's free tier that number cost users far more
// than it saved: roughly 25 farmers asking a few questions each would lock the whole app
// out for the rest of the day. Raised accordingly. If Claude ever becomes the primary
// provider again with real billing attached, lower this first.
//
// PER-USER stops one person (or a script) draining the shared allowance. Without it the
// app-wide cap protects the bill but not the other farmers.
const MAX_DAILY_AI_REQUESTS = 1500
const MAX_DAILY_AI_REQUESTS_PER_USER = 25

const MODEL = 'claude-opus-5'

// Chat is latency-sensitive and the questions are ordinary farming Q&A, not multi-step
// reasoning — low effort keeps replies fast and cheap. The structured extraction tasks
// (diagnosis, soil interpretation) benefit from a bit more deliberation, so they run at
// medium. Neither disables thinking: on Opus 5 that risks tool-call/tag leakage and the
// low-effort setting already gets the cost saving.
const CHAT_EFFORT = 'low'
const STRUCTURED_EFFORT = 'medium'

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

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

function languageInstruction(lang: string) {
  return `Respond ONLY in the language with BCP-47/ISO code "${lang}" (use the natural script for that language). Keep the tone simple, warm and easy for a rural farmer with limited literacy to understand. Avoid jargon; explain plainly.`
}

/** The stable, per-task system prompt. Kept separate from the user's words so it can be cached. */
function systemPrompt(body: RequestBody): string {
  const langInstr = languageInstruction(body.language)

  switch (body.task) {
    case 'chat':
      return `You are AgroAI, a helpful, encouraging farming assistant for smallholder farmers in India. ${langInstr}\n\nAnswer the farmer's question clearly and practically. If it needs region-specific data you don't have (like exact local prices or forecasts), say so honestly instead of inventing numbers. Keep answers short enough to read on a phone.`
    case 'crop-doctor':
      return `You are an expert plant pathologist helping a farmer diagnose a crop problem from a photo and/or symptom description. ${langInstr}\n\nReturn ONLY valid JSON matching this exact shape, no markdown fences, no extra text:\n{"problem": string, "confidence": number (0-1), "causes": string[], "treatment": string[], "prevention": string[], "severity": "low"|"medium"|"high"}\nAll string values must be written in the target language.`
    case 'soil-health':
      return `You are a soil science expert interpreting a farmer's soil test. ${langInstr}\n\nReturn ONLY valid JSON matching this exact shape, no markdown fences:\n{"summary": string, "health_score": number (0-100), "recommendations": string[], "suitable_crops": string[]}`
    case 'crop-suggestion':
      return `You are an agronomy advisor suggesting crops for a farmer's conditions. ${langInstr}\n\nReturn ONLY valid JSON matching this exact shape, no markdown fences:\n{"crops": [{"name": string, "suitability": number (0-100), "reason": string}]} with 3-6 crops, ranked best first.`
    case 'irrigation':
      return `You are an irrigation specialist advising a farmer. ${langInstr}\n\nReturn ONLY valid JSON matching this exact shape, no markdown fences:\n{"schedule": string, "tips": string[], "waterAmount": string}`
  }
}

/** The variable part — this turn's actual question or data. */
function userText(body: RequestBody): string {
  const c = body.context ?? {}
  switch (body.task) {
    case 'chat':
      return body.text ?? '(see attached image)'
    case 'crop-doctor':
      return `Symptoms described: ${body.text || '(none, rely on the image)'}`
    case 'soil-health':
      return `Soil data (any field may be missing): pH=${c.ph ?? 'unknown'}, Nitrogen=${c.nitrogen ?? 'unknown'} mg/kg, Phosphorus=${c.phosphorus ?? 'unknown'} mg/kg, Potassium=${c.potassium ?? 'unknown'} mg/kg, texture=${c.texture ?? 'unknown'}.${body.imageBase64 ? ' A soil photo is attached.' : ''}`
    case 'crop-suggestion':
      return `Location=${c.location ?? 'unspecified'}, soil type=${c.soilType ?? 'unspecified'}, season=${c.season ?? 'unspecified'}, water availability=${c.water ?? 'unspecified'}, additional needs=${c.needs ?? 'none'}.`
    case 'irrigation':
      return `Crop=${c.crop ?? 'unspecified'}, soil type=${c.soilType ?? 'unspecified'}, growth stage=${c.stage ?? 'unspecified'}, current weather=${c.weather ?? 'unspecified'}.`
  }
}

/**
 * Prior turns go in as real user/assistant messages rather than being flattened into one
 * text blob the way the Gemini version did. It costs nothing extra and gives the model a
 * correctly structured conversation, which matters for follow-up questions like
 * "and how much of it?".
 */
function buildMessages(body: RequestBody): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = []

  for (const turn of body.history ?? []) {
    if (!turn.content?.trim()) continue
    messages.push({ role: turn.role, content: turn.content })
  }

  const content: Anthropic.ContentBlockParam[] = []
  if (body.imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: body.imageBase64 },
    })
  }
  content.push({ type: 'text', text: userText(body) })
  messages.push({ role: 'user', content })

  // The API requires the first message to be from the user. A history that somehow
  // starts with an assistant turn would 400, so drop any leading assistant messages.
  while (messages.length && messages[0].role !== 'user') messages.shift()

  return messages
}

function flatPrompt(body: RequestBody): string {
  const history = (body.history ?? [])
    .filter((h) => h.content?.trim())
    .map((h) => `${h.role === 'user' ? 'Farmer' : 'AgroAI'}: ${h.content}`)
    .join('\n')
  return [systemPrompt(body), history && `Conversation so far:\n${history}`, userText(body)]
    .filter(Boolean)
    .join('\n\n')
}

/** Non-streaming Gemini call — the fallback path when Claude is unavailable. */
async function callGemini(body: RequestBody, expectJson: boolean): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('No fallback AI configured.')
  const parts: unknown[] = [{ text: flatPrompt(body) }]
  if (body.imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: body.imageBase64 } })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.6, ...(expectJson ? { responseMimeType: 'application/json' } : {}) },
        }),
        signal: controller.signal,
      }
    )
    if (!res.ok) throw new Error(`Gemini fallback failed (${res.status})`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.map((x: { text?: string }) => x.text ?? '').join('') ?? ''
    if (!text.trim()) throw new Error('Gemini fallback returned nothing')
    return text
  } finally {
    clearTimeout(timer)
  }
}

/** Last-resort provider. Text only — see the GROQ_MODEL note above. */
async function callGroq(body: RequestBody, expectJson: boolean): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('No further fallback configured.')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        messages: [
          { role: 'system', content: systemPrompt(body) },
          ...(body.history ?? [])
            .filter((h) => h.content?.trim())
            .map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: userText(body) },
        ],
        ...(expectJson ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Groq fallback failed (${res.status})`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) throw new Error('Groq fallback returned nothing')
    return text
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Runs the provider chain in quality order and returns the first real answer.
 * Each provider is only tried when the ones before it genuinely could not serve, so
 * farmers get the best available model rather than the cheapest one.
 */
async function callWithFallbacks(body: RequestBody, expectJson: boolean): Promise<string> {
  const attempts: { name: string; run: () => Promise<string> }[] = []
  if (anthropic) attempts.push({ name: 'claude', run: () => callClaude(body) })
  if (GEMINI_API_KEY) attempts.push({ name: 'gemini', run: () => callGemini(body, expectJson) })
  if (GROQ_API_KEY) attempts.push({ name: 'groq', run: () => callGroq(body, expectJson) })

  let lastErr: unknown = new Error('No AI provider is configured.')
  for (const [i, attempt] of attempts.entries()) {
    try {
      return await attempt.run()
    } catch (err) {
      lastErr = err
      const isLast = i === attempts.length - 1
      // Claude distinguishes "try someone else" from "this request is malformed"; the
      // plain-fetch providers can't, so for those any failure moves down the chain.
      const movesOn = attempt.name === 'claude' ? shouldFallback(err) : true
      if (isLast || !movesOn) break
      console.error(`${attempt.name} unavailable, trying next provider:`, err instanceof Error ? err.message : err)
    }
  }
  throw lastErr
}

/**
 * True for failures where trying a different provider is the right move: a bad or
 * revoked key, or the service being unreachable. A 400 from a malformed request would
 * fail identically on Gemini, so those are not retried elsewhere.
 */
function shouldFallback(err: unknown): boolean {
  return (
    err instanceof Anthropic.AuthenticationError ||
    err instanceof Anthropic.PermissionDeniedError ||
    err instanceof Anthropic.RateLimitError ||
    err instanceof Anthropic.APIConnectionError ||
    (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500)
  )
}

/** Turns SDK errors into something a farmer can act on, without leaking key details. */
function friendlyError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return 'The AI service rejected this app\'s credentials. The app owner needs to check the Anthropic API key.'
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return 'This app\'s AI access has been revoked or has no remaining credit. The app owner needs to check the Anthropic account.'
  }
  if (err instanceof Anthropic.RateLimitError) {
    return 'The AI service is busy right now. Please try again in a minute.'
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return 'The AI took too long to respond. Please try again.'
  }
  if (err instanceof Anthropic.APIError) {
    return `AI service error (${err.status ?? '?'}). Please try again in a moment.`
  }
  return err instanceof Error ? err.message : 'Unknown error'
}

/** Non-streaming call, used by the structured tasks that need a complete JSON body. */
async function callStructured(body: RequestBody): Promise<string> {
  return await callWithFallbacks(body, true)
}

async function callClaude(body: RequestBody): Promise<string> {
  const response = await anthropic!.messages.create(
    {
      model: MODEL,
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt(body), cache_control: { type: 'ephemeral' } }],
      output_config: { effort: STRUCTURED_EFFORT },
      messages: buildMessages(body),
    },
    { timeout: 45_000 }
  )

  // A safety decline arrives as HTTP 200 with stop_reason "refusal" — content is empty,
  // so this has to be checked before reading it or the farmer just gets a blank card.
  if (response.stop_reason === 'refusal') {
    throw new Error('The AI declined to answer this request. Try rephrasing it.')
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  if (!text.trim()) throw new Error('The AI returned an empty response. Please try again.')
  return text
}

/**
 * Streams chat replies token-by-token so the client renders text as it arrives instead
 * of showing a spinner for the whole generation. Structured tasks use callClaude()
 * above since they need the complete JSON body before it can be parsed.
 *
 * Errors raised before the first token are reported through the same `__ERROR__:`
 * sentinel the client already understands; once tokens are flowing there is no way to
 * signal a failure other than ending the stream.
 */
function streamClaudeChat(body: RequestBody): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!anthropic) {
          controller.enqueue(encoder.encode(await callWithFallbacks(body, false)))
          controller.close()
          return
        }
        const stream = anthropic.messages.stream(
          {
            model: MODEL,
            max_tokens: 2048,
            system: [{ type: 'text', text: systemPrompt(body), cache_control: { type: 'ephemeral' } }],
            output_config: { effort: CHAT_EFFORT },
            messages: buildMessages(body),
          },
          { timeout: 40_000 }
        )

        let sentAnything = false
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            sentAnything = true
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        if (!sentAnything) {
          const final = await stream.finalMessage()
          controller.enqueue(
            encoder.encode(
              final.stop_reason === 'refusal'
                ? '__ERROR__:The AI declined to answer this request. Try rephrasing it.'
                : '__ERROR__:The AI returned an empty response. Please try again.'
            )
          )
        }
        controller.close()
      } catch (err) {
        // Safe to switch providers here only because an auth/connection failure happens
        // on the opening request, before any token has been written to the stream.
        // Once text is flowing there is no way to retract it and start over.
        if (shouldFallback(err) && (GEMINI_API_KEY || GROQ_API_KEY)) {
          console.error('Claude stream unavailable, falling back:', err instanceof Error ? err.message : err)
          try {
            // Fallback replies arrive whole rather than token-by-token. The chat UI
            // renders whatever it receives, so this shows up as one quick burst
            // instead of a typing effect — a fine trade for still getting an answer.
            for (const run of [
              GEMINI_API_KEY ? () => callGemini(body, false) : null,
              GROQ_API_KEY ? () => callGroq(body, false) : null,
            ]) {
              if (!run) continue
              try {
                controller.enqueue(encoder.encode(await run()))
                controller.close()
                return
              } catch (e) {
                console.error('fallback provider failed:', e)
              }
            }
          } catch (fallbackErr) {
            console.error('all fallbacks failed:', fallbackErr)
          }
        }
        controller.enqueue(encoder.encode(`__ERROR__:${friendlyError(err)}`))
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
    // feature down over a bookkeeping issue — the per-call timeouts are still in
    // place as an independent safeguard.
    console.error('ai_usage_daily counter failed:', error)
    return { allowed: true, count: -1 }
  }
  return { allowed: data <= MAX_DAILY_AI_REQUESTS, count: data }
}

/** Same pattern, scoped to one signed-in user (guests included — each has its own id). */
async function checkAndIncrementUserUsage(userId: string): Promise<{ allowed: boolean; count: number }> {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await adminClient.rpc('increment_user_ai_usage_and_get_count', {
    p_user: userId,
    p_date: today,
  })
  if (error || typeof data !== 'number') {
    // Fail open, exactly as the app-wide counter does — the app-wide cap is still in
    // force, so a broken per-user counter can't turn into unbounded usage.
    console.error('ai_usage_user_daily counter failed:', error)
    return { allowed: true, count: -1 }
  }
  return { allowed: data <= MAX_DAILY_AI_REQUESTS_PER_USER, count: data }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401)

    if (!anthropic && !GEMINI_API_KEY && !GROQ_API_KEY) return json({ error: 'AI backend is not connected yet.' }, 503)

    // Per-user first: when someone has used their own share, say so specifically rather
    // than blaming an app-wide limit they can do nothing about.
    const userUsage = await checkAndIncrementUserUsage(userData.user.id)
    if (!userUsage.allowed) {
      return json({
        error: `You have used your ${MAX_DAILY_AI_REQUESTS_PER_USER} AI questions for today. This keeps the free service available for every farmer — your allowance resets at midnight UTC.`,
      }, 429)
    }

    const usage = await checkAndIncrementDailyUsage()
    if (!usage.allowed) {
      return json({ error: "AgroAI's daily AI usage safety limit has been reached across all users. It resets at midnight UTC." }, 429)
    }

    const body = (await req.json()) as RequestBody

    if (body.task === 'chat') {
      const stream = streamClaudeChat(body)
      return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    const text = await callStructured(body)

    try {
      const parsed = JSON.parse(text.trim().replace(/^```json\s*|```$/g, ''))
      return json(parsed)
    } catch {
      return json({ error: 'AI returned an unexpected format. Please try again.' }, 502)
    }
  } catch (err) {
    return json({ error: friendlyError(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
