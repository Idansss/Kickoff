'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  MessageSquarePlus, PanelLeftClose, PanelLeftOpen,
  Send, Sparkles, Trash2, User, X,
} from 'lucide-react'
import { AppLayout } from '@/components/app-layout'
import { cn } from '@/lib/utils'
import { askFootballGPT } from '@/lib/claudeClient'
import { INPUT_LIMITS } from '@/lib/constants'

// ── types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

// ── storage ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'footballgpt-sessions-v3'

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as ChatSession[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function saveSessions(sessions: ChatSession[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)) } catch {}
}

function createSession(): ChatSession {
  const now = Date.now()
  return { id: `s${now}`, title: 'New Chat', messages: [], createdAt: now, updatedAt: now }
}

function autoTitle(text: string): string {
  const t = text.trim()
  return t.length > 38 ? t.slice(0, 38) + '…' : t
}

function relTime(ts: number): string {
  const d = Date.now() - ts
  if (d < 60_000) return 'Just now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  const days = Math.floor(d / 86_400_000)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

function groupBy(sessions: ChatSession[]) {
  const buckets: Record<string, ChatSession[]> = {
    Today: [], Yesterday: [], 'This Week': [], Earlier: [],
  }
  const now = Date.now()
  for (const s of sessions) {
    const d = now - s.updatedAt
    if (d < 86_400_000) buckets['Today'].push(s)
    else if (d < 172_800_000) buckets['Yesterday'].push(s)
    else if (d < 604_800_000) buckets['This Week'].push(s)
    else buckets['Earlier'].push(s)
  }
  return Object.entries(buckets).filter(([, v]) => v.length > 0)
}

// ── suggestions ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { q: 'Who is the best striker in the world right now?',    tag: 'Players' },
  { q: 'Break down a high press vs low block tactically',    tag: 'Tactics' },
  { q: 'What does xG mean and how is it calculated?',        tag: 'Stats' },
  { q: 'Compare Haaland and Kane this season',               tag: 'Players' },
  { q: 'Who are the best wonderkids in Europe right now?',   tag: 'Players' },
  { q: 'Which clubs are spending most this window?',         tag: 'Transfers' },
  { q: 'Explain the false 9 role in detail',                 tag: 'Tactics' },
  { q: 'What makes Rodri the best CDM in the world?',        tag: 'Stats' },
]

// ── TypingIndicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 flex-shrink-0">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
        </div>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function AIPage() {
  const [mounted, setMounted] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // mount + load
  useEffect(() => {
    setMounted(true)
    const stored = loadSessions()
    if (stored.length > 0) {
      setSessions(stored)
      setActiveId(stored[0].id)
    } else {
      const s = createSession()
      setSessions([s])
      setActiveId(s.id)
    }
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [])

  // persist
  useEffect(() => {
    if (mounted) saveSessions(sessions)
  }, [sessions, mounted])

  // scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessions, isLoading])

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [input])

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeId) ?? null,
    [sessions, activeId]
  )

  const mutateSession = useCallback((id: string, fn: (s: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === id ? fn(s) : s))
  }, [])

  const startNewChat = useCallback(() => {
    const s = createSession()
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
    setInput('')
    setError(null)
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [])

  const switchChat = useCallback((id: string) => {
    setActiveId(id)
    setError(null)
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [])

  const deleteSession = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (activeId === id) {
        if (next.length > 0) setActiveId(next[0].id)
        else {
          const fresh = createSession()
          setActiveId(fresh.id)
          return [fresh]
        }
      }
      return next.length > 0 ? next : (() => {
        const fresh = createSession()
        setActiveId(fresh.id)
        return [fresh]
      })()
    })
  }, [activeId])

  const sendMessage = useCallback(async (text: string) => {
    const content = text.trim()
    if (!content || isLoading || !activeId || content.length > INPUT_LIMITS.aiMessageMaxLength) return

    // capture history snapshot before adding user message
    const historySnapshot = activeSession?.messages.map(m => ({ role: m.role, content: m.content })) ?? []
    const isFirst = (activeSession?.messages.length ?? 0) === 0

    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content, ts: Date.now() }

    mutateSession(activeId, s => ({
      ...s,
      title: isFirst ? autoTitle(content) : s.title,
      messages: [...s.messages, userMsg],
      updatedAt: Date.now(),
    }))

    // move this session to top
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === activeId)
      if (idx <= 0) return prev
      const updated = [...prev]
      const [item] = updated.splice(idx, 1)
      return [item, ...updated]
    })

    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const reply = await askFootballGPT(content, { history: historySnapshot })
      if (reply === "Couldn't connect. Try again.") {
        setError(reply)
      } else {
        const aiMsg: Message = { id: `a${Date.now()}`, role: 'assistant', content: reply, ts: Date.now() }
        mutateSession(activeId, s => ({
          ...s,
          messages: [...s.messages, aiMsg],
          updatedAt: Date.now(),
        }))
      }
    } catch {
      setError("Couldn't connect. Try again.")
    } finally {
      setIsLoading(false)
    }
  }, [activeId, activeSession, isLoading, mutateSession])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }, [input, sendMessage])

  const charsLeft = INPUT_LIMITS.aiMessageMaxLength - input.trim().length
  const canSend = Boolean(input.trim()) && !isLoading && charsLeft >= 0

  const groups = useMemo(() => groupBy(sessions), [sessions])

  if (!mounted) return null

  return (
    <AppLayout>
      <div className="flex h-[calc(100dvh-64px)] md:h-screen overflow-hidden w-full">

        {/* ── Mobile overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── History Sidebar ── */}
        <aside className={cn(
          'fixed md:relative z-30 md:z-auto flex flex-col border-r border-border bg-background h-full flex-shrink-0 transition-transform duration-300 ease-in-out',
          'w-[260px]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-0'
        )}>
          {/* sidebar header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-green-500" />
              </div>
              <span className="font-semibold text-sm truncate">FootballGPT</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* new chat btn */}
          <div className="px-3 py-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={startNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-green-500/50 hover:bg-muted/60 transition-colors text-sm font-medium group"
            >
              <MessageSquarePlus className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors flex-shrink-0" />
              <span>New chat</span>
            </button>
          </div>

          {/* session list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-3">
            {groups.map(([label, items]) => (
              <div key={label}>
                <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
                {items.map(session => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => switchChat(session.id)}
                    className={cn(
                      'w-full flex items-start justify-between gap-1 px-2 py-2 rounded-lg text-left text-xs group transition-colors',
                      session.id === activeId
                        ? 'bg-green-500/10 text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-medium truncate leading-snug', session.id === activeId && 'text-foreground')}>
                        {session.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        {session.messages.length > 0 && (
                          <span>{session.messages.length} msg{session.messages.length !== 1 ? 's' : ''} ·</span>
                        )}
                        {relTime(session.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={e => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Chat panel ── */}
        <div className="flex-1 flex flex-col min-w-0 border-l border-border">
          {/* chat header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/90 backdrop-blur flex-shrink-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Toggle history sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-7 w-7 rounded-xl bg-green-500/15 ring-1 ring-green-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-none">
                  {activeSession && activeSession.title !== 'New Chat' ? activeSession.title : 'FootballGPT'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Your personal football analyst</p>
              </div>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-green-500/50 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-colors flex-shrink-0"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto">
            {!activeSession || activeSession.messages.length === 0 ? (
              /* empty / welcome state */
              <div className="flex flex-col items-center justify-center h-full gap-5 px-4 py-8 max-w-2xl mx-auto w-full">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 ring-1 ring-green-500/20">
                    <Sparkles className="h-7 w-7 text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold">Ask me anything about football</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Tactics, stats, players, transfers — I know it all.
                  </p>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map(({ q, tag }) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="flex flex-col items-start gap-1 text-left rounded-xl border border-border px-4 py-3 hover:border-green-500/50 hover:bg-green-500/5 transition-colors group"
                    >
                      <span className="text-[10px] font-semibold text-green-600/80 uppercase tracking-wide">{tag}</span>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* conversation */
              <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-5 space-y-5">
                {activeSession.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3 animate-fade-in-up',
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                      msg.role === 'assistant'
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-green-600 text-white'
                    )}>
                      {msg.role === 'assistant'
                        ? <Sparkles className="h-4 w-4" />
                        : <User className="h-4 w-4" />
                      }
                    </div>

                    <div className={cn(
                      'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-green-600 text-white whitespace-pre-wrap'
                        : 'rounded-tl-sm bg-muted/70 border border-border/40 text-foreground'
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="prose-sm [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-3 [&_h2]:mt-2.5 [&_h3]:mt-2 [&_h1]:mb-1 [&_h2]:mb-1 [&_p]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_strong]:font-semibold [&_em]:italic [&_a]:text-green-500 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-green-500 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded [&_hr]:border-border [&_hr]:my-3">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && <TypingIndicator />}

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
                    {error}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* input */}
          <div className="border-t border-border bg-background/95 backdrop-blur px-4 sm:px-6 py-3 flex-shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-end rounded-2xl border border-border bg-muted/20 px-3 py-2 focus-within:ring-2 focus-within:ring-green-500/40 focus-within:border-green-500/50 transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about tactics, players, transfers..."
                  rows={1}
                  className="flex-1 min-h-[28px] max-h-32 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                  maxLength={INPUT_LIMITS.aiMessageMaxLength + 50}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage(input)}
                  disabled={!canSend}
                  className="h-8 w-8 flex-shrink-0 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-35 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1">
                <p className="text-[11px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
                <p className={cn('text-[11px] tabular-nums', charsLeft < 0 ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                  {charsLeft}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
