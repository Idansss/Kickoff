'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { INPUT_LIMITS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { chatStore } from '@/store/chatStore'
import { userStore } from '@/store/userStore'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  previousMessage?: Message
  currentUserId: string
}

const MessageBubble = memo(function MessageBubble({
  message,
  previousMessage,
  currentUserId,
}: MessageBubbleProps): React.JSX.Element {
  const isMine = message.authorId === currentUserId
  const showAvatar = !isMine && (!previousMessage || previousMessage.authorId !== message.authorId)

  return (
    <div
      className={cn(
        'flex gap-2 animate-fade-in-up',
        isMine ? 'flex-row-reverse' : 'flex-row',
        !showAvatar && !isMine ? 'pl-10' : ''
      )}
    >
      {showAvatar && !isMine ? (
        <div
          className="h-9 w-9 rounded-full flex-shrink-0 self-end flex items-center justify-center text-xs font-semibold text-white"
          style={{ backgroundColor: message.avatarColor }}
        >
          {message.avatarInitials}
        </div>
      ) : null}

      <div className={cn('flex flex-col gap-0.5 max-w-[75%]', isMine && 'items-end')}>
        {showAvatar && !isMine ? (
          <span className="text-xs text-muted-foreground font-medium ml-1">
            {message.authorName}
          </span>
        ) : null}

        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm break-words',
            isMine
              ? 'rounded-br-sm bg-primary text-primary-foreground'
              : 'rounded-bl-sm bg-muted text-foreground'
          )}
        >
          {message.content}
        </div>

        <span className="text-xs text-muted-foreground px-1">
          {format(new Date(message.createdAt), 'h:mm a')}
        </span>
      </div>
    </div>
  )
})

export default function ChatRoomPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const rooms = chatStore((state) => state.rooms)
  const messages = chatStore((state) => (id ? state.messages[id] ?? [] : []))
  const sendMessage = chatStore((state) => state.sendMessage)
  const initMessages = chatStore((state) => state.initMessages)
  const setActiveRoom = chatStore((state) => state.setActiveRoom)
  const markRoomRead = chatStore((state) => state.markRoomRead)
  const currentUserId = userStore((state) => state.currentUser.id)

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const messageLength = input.trim().length
  const charsLeft = INPUT_LIMITS.chatMaxLength - messageLength
  const isNearLimit = charsLeft <= INPUT_LIMITS.warningThreshold
  const isOverLimit = charsLeft < 0

  const room = useMemo(() => rooms.find((item) => item.id === id), [id, rooms])
  const roomName = room?.title ?? 'Chat'

  useEffect(() => {
    if (!id) return

    initMessages()
    setActiveRoom(id)
    markRoomRead(id)
  }, [id, initMessages, markRoomRead, setActiveRoom])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback((): void => {
    if (!id || !input.trim() || isOverLimit) return
    sendMessage(id, input.trim())
    setInput('')
  }, [id, input, isOverLimit, sendMessage])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      handleSend()
    },
    [handleSend]
  )

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border flex flex-col h-[calc(100dvh-64px)] md:h-screen">
        <div className="border-b border-border bg-background/80 backdrop-blur px-4 py-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to chat rooms"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold truncate">{roomName}</h1>
              <p className="text-xs text-muted-foreground">
                {room?.members.toLocaleString() ?? 0} members
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="text-3xl">💬</div>
              <p className="text-sm text-muted-foreground">Be the first to say something!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                previousMessage={messages[index - 1]}
                currentUserId={currentUserId}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border bg-background p-4 sm:px-6 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
              className="flex-1"
              aria-label="Chat message"
              maxLength={INPUT_LIMITS.chatMaxLength + 50}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isOverLimit}
              className="h-9 w-9 flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p
            className={cn(
              'mt-2 text-xs text-right',
              isOverLimit || isNearLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'
            )}
          >
            {charsLeft}
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
