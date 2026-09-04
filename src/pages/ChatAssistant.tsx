import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Send, Bot, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NotConnectedState } from '@/components/ui/States'
import { useConversations, useMessages } from '@/hooks/useConversations'
import { streamChatWithAssistant, AiNotConfiguredError } from '@/lib/ai'
import { useAuth } from '@/contexts/AuthContext'

const SUGGESTED_KEYS = [
  'When should I water my wheat crop this week?',
  'What is the best fertilizer for tomatoes?',
  'How do I control aphids organically?',
  'What crop should I plant after harvest?',
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5">
      <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce-dot" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce-dot" style={{ animationDelay: '160ms' }} />
      <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce-dot" style={{ animationDelay: '320ms' }} />
    </div>
  )
}

export default function ChatAssistant() {
  const { t, i18n } = useTranslation()
  const { configured } = useAuth()
  const { conversations, createConversation, deleteConversation } = useConversations()
  const [activeId, setActiveId] = useState<string | null>(null)
  const { messages, addMessage } = useMessages(activeId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [streamingReply, setStreamingReply] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Every farmer gets one ongoing thread — reuse the existing conversation
  // (most recent first, per useConversations) instead of ever listing/switching.
  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id)
  }, [activeId, conversations])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingReply])

  const ensureConversation = async () => {
    if (activeId) return activeId
    const conv = await createConversation()
    if (conv) setActiveId(conv.id)
    return conv?.id ?? null
  }

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return
    setError(null)
    const convId = await ensureConversation()
    if (!convId) return

    await addMessage('user', content, undefined, convId)
    setInput('')
    setSending(true)
    setStreamingReply('')
    inputRef.current?.focus()

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const reply = await streamChatWithAssistant(content, i18n.language, history, (chunk) =>
        setStreamingReply((prev) => (prev ?? '') + chunk)
      )
      await addMessage('assistant', reply, undefined, convId)
    } catch (err) {
      if (err instanceof AiNotConfiguredError) setError(t('common.notConnected'))
      else setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSending(false)
      setStreamingReply(null)
    }
  }

  const handleClear = async () => {
    if (activeId) await deleteConversation(activeId)
    setActiveId(null)
    setConfirmClear(false)
  }

  if (!configured) {
    return (
      <div>
        <PageHeader title={t('chat.title')} subtitle={t('chat.askAnything')} />
        <NotConnectedState />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col lg:h-[calc(100vh-5.5rem)]">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title={t('chat.title')} subtitle={t('chat.askAnything')} />
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)} icon={<Trash2 size={15} />} className="mt-1 shrink-0 text-[var(--text-muted)]">
            {t('chat.clearChat')}
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {messages.length === 0 && streamingReply === null ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <div className="rounded-full bg-brand-100 p-4 dark:bg-brand-900/30">
                <Bot className="text-brand-600" size={28} />
              </div>
              <p className="text-sm text-[var(--text-muted)]">{t('chat.askAnything')}</p>
              <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_KEYS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-left text-xs text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)] hover:border-brand-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m.id} className={clsx('flex animate-msg-in', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={clsx(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]',
                      m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-[var(--surface-muted)] text-[var(--text)]'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {streamingReply !== null && (
                <div className="flex justify-start animate-msg-in">
                  <div className="max-w-[85%] rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm leading-relaxed text-[var(--text)] sm:max-w-[70%]">
                    {streamingReply === '' ? (
                      <TypingDots />
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {streamingReply}
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-blink-caret bg-brand-500 align-middle" />
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {error && <p className="border-t border-[var(--border)] px-4 py-2 text-xs text-red-500 animate-fade-in">{error}</p>}

        <div className="flex items-center gap-2 border-t border-[var(--border)] p-3 sm:p-4">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.typeMessage')}
            className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm text-[var(--text)] transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <Button size="md" onClick={() => handleSend()} disabled={sending || !input.trim()} icon={<Send size={17} />} className="px-3.5! transition-transform active:scale-95" />
        </div>
      </div>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title={t('chat.clearChat')}>
        <p className="mb-5 text-sm text-[var(--text-muted)]">{t('chat.clearChatConfirm')}</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleClear} icon={<Trash2 size={15} />}>
            {t('common.delete')}
          </Button>
          <Button variant="outline" onClick={() => setConfirmClear(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
