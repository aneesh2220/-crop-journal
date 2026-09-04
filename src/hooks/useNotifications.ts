import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { AppNotification } from '@/lib/database.types'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) setError(error.message)
    else setNotifications((data as AppNotification[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, load])

  const markAllRead = async () => {
    if (!isSupabaseConfigured || !user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    load()
  }

  const markRead = async (id: string) => {
    if (!isSupabaseConfigured) return
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    load()
  }

  const clearAll = async () => {
    if (!isSupabaseConfigured || !user) return
    await supabase.from('notifications').delete().eq('user_id', user.id)
    load()
  }

  return { notifications, loading, error, reload: load, markAllRead, markRead, clearAll, configured: isSupabaseConfigured }
}

export function useUnreadNotifications(): number {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    let active = true

    const load = async () => {
      const { count: c } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      if (active) setCount(c ?? 0)
    }
    load()

    const channel = supabase
      .channel('unread-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user])

  return count
}
