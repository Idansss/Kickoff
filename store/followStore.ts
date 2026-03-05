import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_KEYS } from '@/lib/constants'
import { safeStorage } from '@/lib/safeStorage'

export type FollowEntityType = 'TEAM' | 'PLAYER' | 'MATCH' | 'COMPETITION'

type FollowBuckets = {
  teams: string[]
  players: string[]
  matches: string[]
  competitions: string[]
}

interface FollowState {
  follows: FollowBuckets
  hydrate: () => Promise<void>
  follow: (entityType: FollowEntityType, entityId: string) => void
  unfollow: (entityType: FollowEntityType, entityId: string) => void
  isFollowing: (entityType: FollowEntityType, entityId: string) => boolean
}

const emptyBuckets: FollowBuckets = {
  teams: [],
  players: [],
  matches: [],
  competitions: [],
}

function addId(list: string[], id: string): string[] {
  if (!id) return list
  return list.includes(id) ? list : [...list, id]
}

function removeId(list: string[], id: string): string[] {
  if (!id) return list
  return list.filter((item) => item !== id)
}

function getBucketKey(entityType: FollowEntityType): keyof FollowBuckets {
  switch (entityType) {
    case 'TEAM':
      return 'teams'
    case 'PLAYER':
      return 'players'
    case 'MATCH':
      return 'matches'
    case 'COMPETITION':
      return 'competitions'
    default:
      return 'teams'
  }
}

export const followStore = create<FollowState>()(
  persist(
    (set, get) => ({
      follows: emptyBuckets,

      hydrate: async (): Promise<void> => {
        if (typeof window === 'undefined') return

        try {
          const res = await fetch('/api/follow')
          if (!res.ok) return
          const json = (await res.json()) as {
            teams: { id: string }[]
            players: { id: string }[]
            matches: { id: string }[]
            competitions: { id: string }[]
          }

          set({
            follows: {
              teams: json.teams?.map((t) => t.id) ?? [],
              players: json.players?.map((p) => p.id) ?? [],
              matches: json.matches?.map((m) => m.id) ?? [],
              competitions: json.competitions?.map((c) => c.id) ?? [],
            },
          })
        } catch {
          // Ignore hydrate errors; UI can still function optimistically
        }
      },

      follow: (entityType, entityId): void => {
        const key = getBucketKey(entityType)
        set((state) => ({
          follows: {
            ...state.follows,
            [key]: addId(state.follows[key], entityId),
          },
        }))
      },

      unfollow: (entityType, entityId): void => {
        const key = getBucketKey(entityType)
        set((state) => ({
          follows: {
            ...state.follows,
            [key]: removeId(state.follows[key], entityId),
          },
        }))
      },

      isFollowing: (entityType, entityId): boolean => {
        const key = getBucketKey(entityType)
        return get().follows[key].includes(entityId)
      },
    }),
    {
      name: STORE_KEYS.follow,
      storage: createJSONStorage(() => safeStorage),
    }
  )
)

