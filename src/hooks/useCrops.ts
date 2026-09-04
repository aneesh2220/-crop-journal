import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Crop } from '@/lib/database.types'

export function useCrops(farmId?: string) {
  const { user } = useAuth()
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    let query = supabase.from('crops').select('*').order('created_at', { ascending: true })
    if (farmId) query = query.eq('farm_id', farmId)
    const { data, error } = await query
    if (error) setError(error.message)
    else setCrops((data as Crop[]) ?? [])
    setLoading(false)
  }, [user, farmId])

  useEffect(() => {
    load()
  }, [load])

  const addCrop = async (crop: Partial<Crop> & { farm_id: string; name: string }) => {
    if (!user) return { error: 'Not signed in' }
    const { error } = await supabase.from('crops').insert({ ...crop, user_id: user.id })
    if (!error) load()
    return { error: error?.message ?? null }
  }

  const updateCrop = async (id: string, patch: Partial<Crop>) => {
    const { error } = await supabase.from('crops').update(patch).eq('id', id)
    if (!error) load()
    return { error: error?.message ?? null }
  }

  const deleteCrop = async (id: string) => {
    const { error } = await supabase.from('crops').delete().eq('id', id)
    if (!error) load()
    return { error: error?.message ?? null }
  }

  return { crops, loading, error, reload: load, addCrop, updateCrop, deleteCrop, configured: isSupabaseConfigured }
}
