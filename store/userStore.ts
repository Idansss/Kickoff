import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AppSettings, Notification, User } from '@/types'
import { mockNotifications, mockUsers, defaultBadges } from '@/data/mockData'
import { STORE_KEYS } from '@/lib/constants'
import { safeGet, safeSet, safeStorage } from '@/lib/safeStorage'

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000] as const
const LEVEL_NAMES = ['Grassroots', 'Sunday League', 'Semi-Pro', 'Professional', 'Legend'] as const

function getLevel(xp: number): { level: number; name: string } {
  let level = 0

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }

  return { level, name: LEVEL_NAMES[level] ?? 'Grassroots' }
}

export interface UserState {
  currentUser: User
  notifications: readonly Notification[]
  settings: AppSettings
  followingIds: string[]
  addXP: (amount: number) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  toggleSetting: (key: keyof AppSettings) => void
  toggleFollow: (userId: string) => void
  addFavoriteTeam: (team: string) => void
  removeFavoriteTeam: (team: string) => void
  incrementStreak: () => void
  awardBadgeIfFirstPost: () => void
  awardBadgeIf10Likes: (totalLikes: number) => void
  initUser: () => void
  updateCurrentUser: (updates: Partial<Pick<User, 'name' | 'handle' | 'avatarInitials' | 'avatarColor' | 'bio' | 'avatarImage' | 'headerImage'>>) => void
}

const DEFAULT_SETTINGS: AppSettings = {
  privateAccount: false,
  allowMessages: true,
  activityStatus: true,
  matches: true,
  messages: true,
  posts: true,
}

const DEFAULT_FOLLOW_HANDLES = ['fabrizioromano', 'OptaJoe', 'TheAthletic'] as const

export const userStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: mockUsers[0],
      notifications: mockNotifications,
      settings: DEFAULT_SETTINGS,
      followingIds: [],

      toggleFollow: (userId): void => {
        if (!userId) return
        set((state) => ({
          followingIds: state.followingIds.includes(userId)
            ? state.followingIds.filter((id) => id !== userId)
            : [...state.followingIds, userId],
        }))
      },

      initUser: (): void => {
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            badges:
              state.currentUser.badges.length > 0
                ? state.currentUser.badges
                : defaultBadges.map((badge) => ({ ...badge })),
          },
          notifications:
            state.notifications.length > 0 ? state.notifications : mockNotifications,
          followingIds:
            state.followingIds.length > 0
              ? state.followingIds
              : DEFAULT_FOLLOW_HANDLES.map((h) => {
                  const u = mockUsers.find(
                    (mu) => mu.handle.toLowerCase() === h.toLowerCase()
                  )
                  return u?.id ?? h
                }),
        }))
      },

      addXP: (amount): void => {
        if (!Number.isFinite(amount) || amount <= 0) {
          return
        }

        set((state) => {
          const nextXP = state.currentUser.xp + amount
          const { level } = getLevel(nextXP)

          return {
            currentUser: {
              ...state.currentUser,
              xp: nextXP,
              level,
            },
          }
        })
      },

      markNotificationRead: (id): void => {
        if (!id.trim()) {
          return
        }

        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          ),
        }))
      },

      markAllNotificationsRead: (): void => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        }))
      },

      addNotification: (notification): void => {
        const text = notification.text.trim()
        if (!text) {
          return
        }

        const nextNotification: Notification = {
          ...notification,
          text,
          id: `n-${Date.now()}`,
          timestamp: new Date(),
          read: false,
        }

        set((state) => ({ notifications: [nextNotification, ...state.notifications] }))
      },

      toggleSetting: (key): void => {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: !state.settings[key],
          },
        }))
      },

      addFavoriteTeam: (team): void => {
        const normalizedTeam = team.trim()
        if (!normalizedTeam) {
          return
        }

        set((state) => {
          if (state.currentUser.favoriteTeams.includes(normalizedTeam)) {
            return state
          }

          return {
            currentUser: {
              ...state.currentUser,
              favoriteTeams: [...state.currentUser.favoriteTeams, normalizedTeam],
            },
          }
        })
      },

      removeFavoriteTeam: (team): void => {
        const normalizedTeam = team.trim()
        if (!normalizedTeam) {
          return
        }

        set((state) => ({
          currentUser: {
            ...state.currentUser,
            favoriteTeams: state.currentUser.favoriteTeams.filter(
              (favoriteTeam) => favoriteTeam !== normalizedTeam
            ),
          },
        }))
      },

      incrementStreak: (): void => {
        if (typeof window === 'undefined') {
          return
        }

        const today = new Date().toDateString()
        const last = safeGet<string | null>(STORE_KEYS.streakDate, null)
        if (last === today) {
          return
        }

        set((state) => {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const wasYesterday = last === yesterday.toDateString()

          return {
            currentUser: {
              ...state.currentUser,
              streak: wasYesterday ? state.currentUser.streak + 1 : 1,
            },
          }
        })

        safeSet(STORE_KEYS.streakDate, today)
      },

      awardBadgeIfFirstPost: (): void => {
        let awarded = false

        set((state) => {
          const firstPostBadge = state.currentUser.badges.find((badge) => badge.id === 'b1')
          if (firstPostBadge?.earned) {
            return state
          }

          awarded = true
          return {
            currentUser: {
              ...state.currentUser,
              badges: state.currentUser.badges.map((badge) =>
                badge.id === 'b1' ? { ...badge, earned: true, earnedAt: new Date() } : badge
              ),
            },
          }
        })

        if (!awarded) {
          return
        }

        const currentUser = get().currentUser
        get().addNotification({
          type: 'badge_earned',
          text: 'You earned the First Post badge!',
          avatarInitials: currentUser.avatarInitials,
          avatarColor: currentUser.avatarColor,
        })
      },

      awardBadgeIf10Likes: (totalLikes): void => {
        if (totalLikes < 10) {
          return
        }

        set((state) => {
          const likeBadge = state.currentUser.badges.find((badge) => badge.id === 'b2')
          if (likeBadge?.earned) {
            return state
          }

          return {
            currentUser: {
              ...state.currentUser,
              badges: state.currentUser.badges.map((badge) =>
                badge.id === 'b2' ? { ...badge, earned: true, earnedAt: new Date() } : badge
              ),
            },
          }
        })
      },

      updateCurrentUser: (updates) => {
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            ...updates,
          },
        }))
      },
    }),
    {
      name: STORE_KEYS.user,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        notifications: state.notifications,
        settings: state.settings,
        followingIds: state.followingIds,
      }),
    }
  )
)

export const selectUnreadNotificationCount = (state: UserState): number =>
  state.notifications.filter((notification) => !notification.read).length
