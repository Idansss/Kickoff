'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { chatStore } from '@/store/chatStore'
import { MessageCircle, Plus, X, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatRoom } from '@/types'

export default function ChatPage(): React.JSX.Element {
  const rooms = chatStore((s) => s.rooms)
  const initMessages = chatStore((s) => s.initMessages)
  const setActiveRoom = chatStore((s) => s.setActiveRoom)
  const markRoomRead = chatStore((s) => s.markRoomRead)
  const addRoom = chatStore((s) => s.addRoom)

  const [createOpen, setCreateOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')

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

  const handleCreate = () => {
    const name = newGroupName.trim()
    if (!name) return
    addRoom(name)
    setNewGroupName('')
    setNewGroupDesc('')
    setCreateOpen(false)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Chat Rooms</h1>
              <p className="text-sm text-muted-foreground">Join conversations</p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Group
            </button>
          </div>
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

      {/* Create Group Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-green-500/15 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="font-bold text-lg">Create New Group</h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => { setCreateOpen(false); setNewGroupName(''); setNewGroupDesc('') }}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value.slice(0, 50))}
                  placeholder="e.g. Champions League Banter"
                  autoFocus
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{newGroupName.length}/50</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value.slice(0, 100))}
                  placeholder="What's this group about?"
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setCreateOpen(false); setNewGroupName(''); setNewGroupDesc('') }}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newGroupName.trim()}
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
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
