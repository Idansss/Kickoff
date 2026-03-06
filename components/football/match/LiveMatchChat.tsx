'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { userStore } from '@/store/userStore'

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    handle: string
    avatar: string
  }
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'c1', content: 'What a start! This is going to be a cracker ⚽', createdAt: new Date(Date.now() - 180000).toISOString(), author: { id: 'u2', name: 'Fabrizio Romano', handle: 'fabrizioromano', avatar: 'FR' } },
  { id: 'c2', content: 'The press from both teams is intense already!', createdAt: new Date(Date.now() - 120000).toISOString(), author: { id: 'u3', name: 'OptaJoe', handle: 'OptaJoe', avatar: 'OJ' } },
  { id: 'c3', content: 'Loving the high defensive line, risky but effective', createdAt: new Date(Date.now() - 60000).toISOString(), author: { id: 'u4', name: 'TheAthletic', handle: 'TheAthletic', avatar: 'TA' } },
]

function timeStr(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  matchId: string
}

export function LiveMatchChat({ matchId }: Props) {
  const currentUser = userStore((s) => s.currentUser)
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/match-chat/${matchId}`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setMessages([...MOCK_MESSAGES, ...data])
      }
    } catch {
      // keep mock messages
    }
  }, [matchId])

  useEffect(() => {
    if (!open) return
    loadMessages()
    pollRef.current = setInterval(loadMessages, 8000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open, loadMessages])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)

    // Optimistic
    const optimistic: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        handle: currentUser.handle,
        avatar: currentUser.avatarInitials,
      },
    }
    setMessages((prev) => [...prev, optimistic])
    setDraft('')

    try {
      await fetch(`/api/match-chat/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
    } catch {
      // Keep optimistic message
    }
    setSending(false)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-sm">Live Match Chat</span>
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          {/* Messages */}
          <div className="h-64 overflow-y-auto px-3 py-2 border-t border-border space-y-2 bg-muted/10">
            {messages.map((msg) => {
              const isMe = msg.author.id === currentUser.id
              return (
                <div key={msg.id} className={cn('flex gap-2 items-start', isMe && 'flex-row-reverse')}>
                  <div className="h-7 w-7 rounded-full bg-green-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {msg.author.avatar}
                  </div>
                  <div className={cn('max-w-[75%]', isMe && 'items-end flex flex-col')}>
                    <div className={cn('flex items-center gap-1.5 mb-0.5', isMe && 'flex-row-reverse')}>
                      <span className="text-xs font-semibold">{isMe ? 'You' : msg.author.name}</span>
                      <span className="text-[10px] text-muted-foreground">{timeStr(msg.createdAt)}</span>
                    </div>
                    <div className={cn(
                      'rounded-2xl px-3 py-1.5 text-sm leading-snug',
                      isMe ? 'bg-green-600 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-3 py-2 border-t border-border bg-card">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 280))}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Say something..."
              className="flex-1 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || sending}
              className="rounded-full bg-green-600 hover:bg-green-700 p-2 text-white disabled:opacity-50 transition-colors"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
