import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNotifications, mockUsers } from '@/data/mockData'
import { STORE_KEYS } from '@/lib/constants'
import { userStore } from '@/store/userStore'

function resetUserStore(): void {
  userStore.setState({
    currentUser: {
      ...mockUsers[0],
      xp: 0,
      level: 1,
      streak: 0,
      badges: [],
    },
    notifications: mockNotifications.map((notification) => ({ ...notification, read: false })),
  })
}

describe('userStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserStore()
  })

  it('addXP increments XP correctly', () => {
    userStore.getState().addXP(50)
    expect(userStore.getState().currentUser.xp).toBe(50)
  })

  it('addXP updates level when threshold is crossed', () => {
    userStore.getState().addXP(200)
    expect(userStore.getState().currentUser.level).toBe(2)
  })

  it('markAllNotificationsRead marks every notification as read', () => {
    userStore.getState().markAllNotificationsRead()
    expect(userStore.getState().notifications.every((notification) => notification.read)).toBe(true)
  })

  it('incrementStreak increments once per day and not twice on same day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-04T10:00:00.000Z'))

    userStore.getState().incrementStreak()
    const first = userStore.getState().currentUser.streak

    userStore.getState().incrementStreak()
    const second = userStore.getState().currentUser.streak

    expect(first).toBe(1)
    expect(second).toBe(1)
    expect(localStorage.getItem(STORE_KEYS.streakDate)).toBeTruthy()

    vi.useRealTimers()
  })
})
