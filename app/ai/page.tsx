'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronRight, RotateCcw, Send, Sparkles, User } from 'lucide-react'
import { AppLayout } from '@/components/app-layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { askFootballGPT } from '@/lib/claudeClient'
import { INPUT_LIMITS, STORE_KEYS } from '@/lib/constants'
import { safeGet, safeSet } from '@/lib/safeStorage'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type Category = 'All' | 'Tactics' | 'Stats' | 'Players' | 'Transfers'

const CATEGORIES: Category[] = ['All', 'Tactics', 'Stats', 'Players', 'Transfers']

const SUGGESTED_QUESTIONS: { question: string; category: Category }[] = [
  { question: 'Break down a high press vs low block', category: 'Tactics' },
  { question: 'What does xG actually mean?', category: 'Stats' },
  { question: 'Who is the best striker in the world right now?', category: 'Players' },
  { question: 'Which clubs are spending the most this window?', category: 'Transfers' },
  { question: 'Explain the false 9 role', category: 'Tactics' },
  { question: 'Who leads the Champions League in assists?', category: 'Stats' },
  { question: 'Compare Mbappe and Vinicius Jr', category: 'Players' },
  { question: 'Who is most likely to move to the Premier League?', category: 'Transfers' },
]

function TypingIndicator(): React.JSX.Element {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-500 flex-shrink-0">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <div className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          <div className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          <div className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
        </div>
      </div>
    </div>
  )
}

export default function AIPage(): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category>('All')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmedInput = input.trim()
  const charsLeft = INPUT_LIMITS.aiMessageMaxLength - trimmedInput.length
  const isNearLimit = charsLeft <= INPUT_LIMITS.warningThreshold
  const isOverLimit = charsLeft < 0

  const filteredQuestions = category === 'All'
    ? SUGGESTED_QUESTIONS
    : SUGGESTED_QUESTIONS.filter((q) => q.category === category)

  // Load persisted conversation on mount
  useEffect(() => {
    const stored = safeGet<{ messages?: Message[] }>(STORE_KEYS.ai, { messages: [] })
    if (stored.messages && stored.messages.length > 0) {
      setMessages(stored.messages)
    }
  }, [])

  // Persist conversation whenever messages change
  useEffect(() => {
    safeSet(STORE_KEYS.ai, { messages })
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const appendAssistantMessage = useCallback((content: string): void => {
    setMessages((previous) =>
      [
        ...previous,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content,
        },
      ].slice(-10)
    )
  }, [])

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const content = text.trim()
      if (!content || isLoading || content.length > INPUT_LIMITS.aiMessageMaxLength) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
      }

      setMessages((previous) => [...previous, userMessage])
      setInput('')
      setIsLoading(true)
      setError(null)

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }))
        const reply = await askFootballGPT(content, { history })
        if (reply === "Couldn't connect. Try again.") {
          setError(reply)
        } else {
          appendAssistantMessage(reply)
          setError(null)
        }
      } catch {
        setError("Couldn't connect. Try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [appendAssistantMessage, isLoading, messages]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        void sendMessage(input)
      }
    },
    [input, sendMessage]
  )

  const canSend = useMemo(
    () => Boolean(trimmedInput) && !isLoading && !isOverLimit,
    [isLoading, isOverLimit, trimmedInput]
  )

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border flex flex-col h-[calc(100dvh-64px)] md:h-screen">
        {/* Header */}
        <div className="border-b border-border bg-background/80 backdrop-blur px-4 py-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-500 ring-1 ring-green-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">FootballGPT</h1>
                <p className="text-xs text-muted-foreground">Your personal football analyst</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([])
                  setError(null)
                  safeSet(STORE_KEYS.ai, { messages: [] })
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New chat
              </button>
            )}
          </div>
        </div>

        {/* Messages / Empty state */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-500 ring-1 ring-green-500/20">
                  <Sparkles className="h-9 w-9" />
                </div>
                <h2 className="text-xl font-bold mb-1">Ask me anything about football</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Tactics, stats, transfers, match analysis — I know it all.
                </p>
              </div>

              {/* Category pills */}
              <div className="flex gap-2 flex-wrap justify-center">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'text-xs px-3 py-1 rounded-full border transition-colors',
                      category === cat
                        ? 'border-green-500 bg-green-500/10 text-green-600 font-medium'
                        : 'border-border text-muted-foreground hover:border-green-500/50 hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Question cards */}
              <div className="w-full space-y-1.5">
                {filteredQuestions.map(({ question }) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void sendMessage(question)}
                    className="w-full flex items-center justify-between gap-3 text-sm rounded-xl border border-border px-4 py-3 hover:border-green-500/50 hover:bg-green-500/5 transition-colors text-left group"
                  >
                    <span>{question}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-green-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-fade-in-up',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {message.role === 'assistant' ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-500 flex-shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
              ) : (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-green-600 text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-green-600 text-white whitespace-pre-wrap'
                    : 'rounded-tl-sm bg-muted/80 text-foreground border border-border/50'
                )}
              >
                {message.role === 'assistant' ? (
                  <div className="ai-markdown [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-2 [&_h2]:mt-2 [&_h3]:mt-2 [&_p]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-foreground [&_a]:text-green-600 [&_a]:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {isLoading ? <TypingIndicator /> : null}
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-background p-4 sm:px-6 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about tactics, players, transfers..."
              rows={1}
              className="flex-1 min-h-[40px] max-h-32 resize-none border-border focus-visible:ring-green-500/50"
              aria-label="Ask FootballGPT"
              maxLength={INPUT_LIMITS.aiMessageMaxLength + 50}
            />
            <Button
              size="icon"
              onClick={() => void sendMessage(input)}
              disabled={!canSend}
              className="h-10 w-10 flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Enter to send · Shift+Enter for new line</p>
            <p
              className={cn(
                'text-xs',
                isOverLimit || isNearLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'
              )}
            >
              {charsLeft}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
