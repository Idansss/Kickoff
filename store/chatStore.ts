import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ChatRoom, Message } from '@/types'
import { buildMockMessages, mockChatRooms } from '@/data/mockData'
import { INPUT_LIMITS, STORE_KEYS } from '@/lib/constants'
import { safeStorage } from '@/lib/safeStorage'
import { userStore } from './userStore'

export interface ChatState {
  rooms: readonly ChatRoom[]
  activeRoomId: string | null
  messages: Readonly<Record<string, readonly Message[]>>
  sendMessage: (roomId: string, text: string) => void
  setActiveRoom: (roomId: string | null) => void
  markRoomRead: (roomId: string) => void
  initMessages: () => void
  addRoom: (title: string) => void
}

export const chatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      rooms: mockChatRooms,
      activeRoomId: null,
      messages: {},

      initMessages: (): void => {
        // If messages are already present (e.g. from persisted storage), don't overwrite them
        const existing = get().messages
        if (existing && Object.keys(existing).length > 0) {
          return
        }

        const currentUser = userStore.getState().currentUser
        const messages = buildMockMessages(get().rooms as ChatRoom[], currentUser.id)
        set({ messages })
      },

      sendMessage: (roomId, text): void => {
        const roomExists = get().rooms.some((room) => room.id === roomId)
        const content = text.trim()
        if (!roomExists || !content || content.length > INPUT_LIMITS.chatMaxLength) {
          return
        }

        const currentUser = userStore.getState().currentUser
        const message: Message = {
          id: `msg-${Date.now()}`,
          roomId,
          content,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorHandle: currentUser.handle,
          avatarInitials: currentUser.avatarInitials,
          avatarColor: currentUser.avatarColor,
          createdAt: new Date(),
        }

        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: [...(state.messages[roomId] ?? []), message],
          },
        }))
      },

      setActiveRoom: (roomId): void => {
        set({ activeRoomId: roomId })
      },

      markRoomRead: (roomId): void => {
        if (!roomId.trim()) {
          return
        }

        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId ? { ...room, unreadCount: 0 } : room
          ),
        }))
      },

      addRoom: (title): void => {
        const id = `room-${Date.now()}`
        const newRoom: ChatRoom = {
          id,
          title,
          members: 1,
          icon: 'general',
          unreadCount: 0,
        }
        set((state) => ({
          rooms: [...state.rooms, newRoom],
          messages: { ...state.messages, [id]: [] },
        }))
      },
    }),
    {
      name: STORE_KEYS.chat,
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
