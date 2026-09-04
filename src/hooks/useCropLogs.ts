import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CropLog } from '@/lib/database.types'

/**
 * Day number for a date within a crop's life, counting the planting date as Day 1
 * (a farmer says "day 1" for the day they sowed, not the day after).
 *
 * Both dates are parsed as plain calendar dates — `entry_date` and `planting_date`
 * are DATE columns with no timezone. Building them via `new Date('YYYY-MM-DD')`
 * would parse as UTC midnight and then shift by the local offset, which puts
 * anyone east of Greenwich (all of India) on the wrong day.
 */
export function dayNumber(plantingDate: string | null, on: string | Date = new Date()): number | null {
  if (!plantingDate) return null
  const start = parseCalendarDate(plantingDate)
  const end = typeof on === 'string' ? parseCalendarDate(on) : startOfLocalDay(on)
  if (!start || !end) return null
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  return days + 1
}

function parseCalendarDate(value: string): Date | null {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** `YYYY-MM-DD` for today in the user's own timezone (not UTC). */
export function todayLocalISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function useCropLogs(cropId?: string) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<CropLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    let query = supabase
      .from('crop_logs')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (cropId) query = query.eq('crop_id', cropId)
    const { data, error } = await query
    if (error) setError(error.message)
    else setLogs((data as CropLog[]) ?? [])
    setLoading(false)
  }, [user, cropId])

  useEffect(() => {
    load()
  }, [load])

  const addLog = async (log: Partial<CropLog> & { crop_id: string }) => {
    if (!user) return { error: 'Not signed in' }
    const { error } = await supabase.from('crop_logs').insert({ ...log, user_id: user.id })
    if (!error) load()
    return { error: error?.message ?? null }
  }

  const deleteLog = async (id: string) => {
    const { error } = await supabase.from('crop_logs').delete().eq('id', id)
    if (!error) load()
    return { error: error?.message ?? null }
  }

  return { logs, loading, error, reload: load, addLog, deleteLog, configured: isSupabaseConfigured }
}
