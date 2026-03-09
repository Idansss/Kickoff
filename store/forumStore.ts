import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_KEYS } from '@/lib/constants'
import { safeStorage } from '@/lib/safeStorage'

interface ForumState {
  /** Thread IDs the current user is subscribed to (optimistic local cache) */
  subscriptions: string[]
  /** Thread IDs that have been visited — used to compute "unread" in listings */
  visited: string[]

  isSubscribed: (threadId: string) => boolean
  setSubscribed: (threadId: string, value: boolean) => void
  markVisited: (threadId: string) => void
  isVisited: (threadId: string) => boolean
}

export const useForumStore = create<ForumState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      visited: [],

      isSubscribed: (threadId) => get().subscriptions.includes(threadId),

      setSubscribed: (threadId, value) => {
        set((state) => ({
          subscriptions: value
            ? state.subscriptions.includes(threadId)
              ? state.subscriptions
              : [...state.subscriptions, threadId]
            : state.subscriptions.filter((id) => id !== threadId),
        }))
      },

      markVisited: (threadId) => {
        set((state) => ({
          visited: state.visited.includes(threadId)
            ? state.visited
            : [...state.visited, threadId],
        }))
      },

      isVisited: (threadId) => get().visited.includes(threadId),
    }),
    {
      name: STORE_KEYS.forum,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
)
