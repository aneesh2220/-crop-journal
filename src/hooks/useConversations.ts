import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Conversation, Message } from '@/lib/database.types'

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false })
    setConversations((data as Conversation[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const createConversation = async (title = 'New conversation') => {
    if (!user) return null
    const { data, error } = await supabase.from('conversations').insert({ user_id: user.id, title }).select().single()
    if (error) return null
    load()
    return data as Conversation
  }

  const renameConversation = async (id: string, title: string) => {
    await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const deleteConversation = async (id: string) => {
    await supabase.from('conversations').delete().eq('id', id)
    load()
  }

  return { conversations, loading, reload: load, createConversation, renameConversation, deleteConversation, configured: isSupabaseConfigured }
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !conversationId) return
    setLoading(true)
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
    setMessages((data as Message[]) ?? [])
    setLoading(false)
  }, [conversationId])

  useEffect(() => {
    load()
  }, [load])

  // Accepts an explicit conversation id because a brand-new conversation's id is only
  // known via ensureConversation()'s return value — the `conversationId` this hook was
  // called with is still whatever it was during the render that produced this closure,
  // and React doesn't re-render synchronously just because handleSend called setActiveId.
  // Relying on the closed-over value here silently dropped the first message (and its
  // reply) of every new conversation, since `!conversationId` was still true.
  const addMessage = async (role: 'user' | 'assistant', content: string, imageUrl?: string, targetConversationId?: string) => {
    const convId = targetConversationId ?? conversationId
    if (!user || !convId) return null
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, user_id: user.id, role, content, image_url: imageUrl ?? null })
      .select()
      .single()
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId)
    if (error) return null
    const msg = data as Message
    setMessages((prev) => [...prev, msg])
    return msg
  }

  return { messages, loading, addMessage, reload: load }
}
