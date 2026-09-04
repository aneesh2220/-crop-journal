import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { FarmTask, TaskType } from '@/lib/database.types'

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<FarmTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('farm_tasks').select('*').order('due_date', { ascending: true })
    if (error) setError(error.message)
    else setTasks((data as FarmTask[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const addTask = async (task: Partial<FarmTask> & { title: string; type: TaskType; due_date: string }) => {
    if (!user) return { error: 'Not signed in' }
    const { error } = await supabase.from('farm_tasks').insert({ ...task, user_id: user.id })
    if (!error) load()
    return { error: error?.message ?? null }
  }

  const updateTask = async (id: string, patch: Partial<FarmTask>) => {
    const { error } = await supabase.from('farm_tasks').update(patch).eq('id', id)
    if (!error) load()
    return { error: error?.message ?? null }
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('farm_tasks').delete().eq('id', id)
    if (!error) load()
    return { error: error?.message ?? null }
  }

  const markDone = (id: string) => updateTask(id, { status: 'done' })

  return { tasks, loading, error, reload: load, addTask, updateTask, deleteTask, markDone, configured: isSupabaseConfigured }
}
