import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Farm } from '@/lib/database.types'

export function useFarms() {
  const { user } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('farms').select('*').order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setFarms((data as Farm[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const addFarm = async (farm: Partial<Farm> & { name: string }) => {
    if (!user) return { error: 'Not signed in' }
    const { error } = await supabase.from('farms').insert({ ...farm, user_id: user.id })
    if (!error) load()
    return { error: error?.message ?? null }
  }

  const updateFarm = async (id: string, patch: Partial<Farm>) => {
    const { error } = await supabase.from('farms').update(patch).eq('id', id)
    if (!error) load()
    return { error: error?.message ?? null }
  }

  const deleteFarm = async (id: string) => {
    const { error } = await supabase.from('farms').delete().eq('id', id)
    if (!error) load()
    return { error: error?.message ?? null }
  }

  return { farms, loading, error, reload: load, addFarm, updateFarm, deleteFarm, configured: isSupabaseConfigured }
}
