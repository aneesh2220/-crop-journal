import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export type ToolName = 'crop-doctor' | 'soil-health' | 'crop-suggestions' | 'irrigation'

export interface ToolHistoryEntry<I, R> {
  id: string
  /** ISO timestamp of when the result came back. */
  at: string
  input: I
  result: R
  /** Small JPEG data URL of the photo that was scanned, if there was one. */
  thumb?: string
}

const MAX_ENTRIES = 30

// Keyed by user as well as tool, so two people (or a guest and a later account) sharing
// one browser never see each other's history.
const storageKey = (userId: string, tool: ToolName) => `agroai.history.v1.${userId}.${tool}`

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function load<I, R>(key: string): ToolHistoryEntry<I, R>[] {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save<I, R>(key: string, entries: ToolHistoryEntry<I, R>[]) {
  try {
    localStorage.setItem(key, JSON.stringify(entries))
  } catch {
    // Storage is full or blocked (some private-browsing modes). Keep the newest few
    // without their photos rather than losing the whole history; give up quietly if
    // even that fails, since history is a convenience and must never break the tool.
    try {
      localStorage.setItem(key, JSON.stringify(entries.slice(0, 8).map((e) => ({ ...e, thumb: undefined }))))
    } catch {
      // nothing more to do
    }
  }
}

/**
 * Past inputs and results for one tool, kept on this device. Newest first, capped at
 * MAX_ENTRIES. Works for guests too, since it only needs a user id to namespace by.
 */
export function useToolHistory<I, R>(tool: ToolName) {
  const { user } = useAuth()
  const key = user ? storageKey(user.id, tool) : null
  const [entries, setEntries] = useState<ToolHistoryEntry<I, R>[]>([])
  const entriesRef = useRef<ToolHistoryEntry<I, R>[]>([])

  useEffect(() => {
    const loaded = key ? load<I, R>(key) : []
    entriesRef.current = loaded
    setEntries(loaded)
  }, [key])

  const commit = useCallback(
    (next: ToolHistoryEntry<I, R>[]) => {
      entriesRef.current = next
      setEntries(next)
      if (key) save(key, next)
    },
    [key]
  )

  const add = useCallback(
    (entry: { input: I; result: R; thumb?: string }) => {
      if (!key) return
      commit([{ ...entry, id: newId(), at: new Date().toISOString() }, ...entriesRef.current].slice(0, MAX_ENTRIES))
    },
    [key, commit]
  )

  const remove = useCallback((id: string) => commit(entriesRef.current.filter((e) => e.id !== id)), [commit])
  const clear = useCallback(() => commit([]), [commit])

  return { entries, add, remove, clear }
}
