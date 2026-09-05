import { supabase, isSupabaseConfigured } from './supabase'
import { extractFunctionErrorMessage, withTimeout, TimeoutError } from './functionsError'

export type AiTask = 'chat' | 'crop-doctor' | 'soil-health' | 'crop-suggestion' | 'irrigation'

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface AiAssistRequest {
  task: AiTask
  language: string
  text?: string
  imageBase64?: string
  history?: ChatHistoryItem[]
  context?: Record<string, unknown>
}

export interface CropDoctorResult {
  problem: string
  confidence: number
  causes: string[]
  treatment: string[]
  prevention: string[]
  severity: 'low' | 'medium' | 'high'
}

export interface SoilHealthResult {
  summary: string
  health_score: number
  recommendations: string[]
  suitable_crops: string[]
}

export interface CropSuggestionResult {
  crops: { name: string; suitability: number; reason: string }[]
}

export interface IrrigationResult {
  schedule: string
  tips: string[]
  waterAmount: string
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI backend is not connected yet.')
    this.name = 'AiNotConfiguredError'
  }
}

async function invokeAi<T>(payload: AiAssistRequest): Promise<T> {
  if (!isSupabaseConfigured) throw new AiNotConfiguredError()
  // 55s client-side ceiling — deliberately above the edge function's own 45s Claude
  // timeout, so the server's specific, friendly error always surfaces before this
  // generic one does. Keep this the larger of the two if either is ever changed: if
  // the client gives up first, the model keeps generating (and billing) unseen.
  const { data, error } = await withTimeout(supabase.functions.invoke('ai-assist', { body: payload }), 55_000)
  if (error) {
    const message = await extractFunctionErrorMessage(error)
    if (message.includes('not connected')) throw new AiNotConfiguredError()
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

/**
 * Streams the chat reply token-by-token instead of waiting for the full response.
 * This bypasses supabase.functions.invoke() (which buffers the whole response)
 * in favor of a raw fetch so the reader can be read incrementally.
 */
export async function streamChatWithAssistant(
  text: string,
  language: string,
  history: ChatHistoryItem[],
  onChunk: (chunk: string) => void
): Promise<string> {
  if (!isSupabaseConfigured) throw new AiNotConfiguredError()

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Not signed in')

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 35_000)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ task: 'chat', language, text, history } satisfies AiAssistRequest),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new TimeoutError()
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const errorIndex = chunk.indexOf('__ERROR__:')
    if (errorIndex !== -1) throw new Error(chunk.slice(errorIndex + '__ERROR__:'.length))
    full += chunk
    onChunk(chunk)
  }
  return full
}

export function diagnoseCrop(symptoms: string, language: string, imageBase64?: string) {
  return invokeAi<CropDoctorResult>({ task: 'crop-doctor', language, text: symptoms, imageBase64 })
}

export function analyzeSoil(
  language: string,
  context: { ph?: number; nitrogen?: number; phosphorus?: number; potassium?: number; texture?: string },
  imageBase64?: string
) {
  return invokeAi<SoilHealthResult>({ task: 'soil-health', language, context, imageBase64 })
}

export function suggestCrops(
  language: string,
  context: { location?: string; soilType?: string; season?: string; water?: string; needs?: string }
) {
  return invokeAi<CropSuggestionResult>({ task: 'crop-suggestion', language, context })
}

export function getIrrigationAdvice(
  language: string,
  context: { crop?: string; soilType?: string; stage?: string; weather?: string }
) {
  return invokeAi<IrrigationResult>({ task: 'irrigation', language, context })
}
