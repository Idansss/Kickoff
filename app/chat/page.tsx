'use client'

import { memo, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { chatStore } from '@/store/chatStore'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatRoom } from '@/types'

export default function ChatPage(): React.JSX.Element {
  const rooms = chatStore((s) => s.rooms)
  const initMessages = chatStore((s) => s.initMessages)
  const setActiveRoom = chatStore((s) => s.setActiveRoom)
  const markRoomRead = chatStore((s) => s.markRoomRead)

  useEffect(() => {
    initMessages()
  }, [initMessages])

  const { liveRooms, clubRooms, generalRooms } = useMemo(
    () => ({
      liveRooms: rooms.filter((room) => room.icon === 'live'),
      clubRooms: rooms.filter((room) => room.icon === 'club'),
      generalRooms: rooms.filter((room) => room.icon === 'general'),
    }),
    [rooms]
  )

  const handleRoomClick = useCallback((roomId: string): void => {
    setActiveRoom(roomId)
    markRoomRead(roomId)
  }, [markRoomRead, setActiveRoom])

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold">Chat Rooms</h1>
          <p className="text-sm text-muted-foreground">Join conversations</p>
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          {liveRooms.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-bold text-accent">Live Now</h2>
              {liveRooms.map((room) => (
                <MemoizedChatRoomCard
                  key={room.id}
                  room={room}
                  onClick={() => handleRoomClick(room.id)}
                />
              ))}
            </div>
          )}
          {clubRooms.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-bold">Club Discussions</h2>
              {clubRooms.map((room) => (
                <MemoizedChatRoomCard
                  key={room.id}
                  room={room}
                  onClick={() => handleRoomClick(room.id)}
                />
              ))}
            </div>
          )}
          {generalRooms.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold">General Topics</h2>
              {generalRooms.map((room) => (
                <MemoizedChatRoomCard
                  key={room.id}
                  room={room}
                  onClick={() => handleRoomClick(room.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function ChatRoomCard({ room, onClick }: { room: ChatRoom; onClick: () => void }) {
  const icon = <MessageCircle className="h-6 w-6 text-muted-foreground" />
  return (
    <Link href={`/chat/${room.id}`} onClick={onClick}>
      <div className="group mb-3 flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:border-accent hover:bg-muted/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-accent">
            {room.title}
          </h3>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {room.members.toLocaleString()} members
            </span>
            {room.unreadCount > 0 && (
              <span
                className={cn(
                  'rounded-full bg-green-500 text-white text-xs font-semibold min-w-5 h-5 flex items-center justify-center px-1.5'
                )}
                aria-label={`${room.unreadCount} unread notifications`}
              >
                {room.unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Join
          </div>
        </div>
      </div>
    </Link>
  )
}

const MemoizedChatRoomCard = memo(ChatRoomCard)
