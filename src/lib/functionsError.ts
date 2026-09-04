import type { FunctionsError } from '@supabase/supabase-js'

/**
 * supabase.functions.invoke() puts non-2xx responses into `error` (a generic
 * FunctionsHttpError), NOT `data` — so our edge functions' `{ error: "..." }`
 * body (e.g. "Weather API is not connected yet.") would otherwise be lost
 * behind a generic "non-2xx status code" message. `error.context` is the raw
 * Response, so we recover the real message from its JSON body here.
 */
export async function extractFunctionErrorMessage(error: FunctionsError): Promise<string> {
  const context = error.context as Response | undefined
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json()
      if (body?.error) return body.error as string
    } catch {
      // response body wasn't JSON — fall through to the generic message
    }
  }
  return error.message
}

export class TimeoutError extends Error {
  constructor(message = 'The request took too long. Please check your connection and try again.') {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * The Supabase JS client has no built-in request timeout, and each edge function
 * has its own internal timeout on the calls *it* makes — but if the function
 * itself never responds (cold start hang, dropped connection, platform issue),
 * nothing on either side ever rejects and the UI spins forever. This bounds
 * every call from the browser's side too, as a last-resort safety net.
 */
export function withTimeout<T>(promise: Promise<T>, ms = 30_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}
