import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Match, Prediction } from '@/types'
import { mockMatches } from '@/data/mockData'
import { STORE_KEYS } from '@/lib/constants'
import { safeStorage } from '@/lib/safeStorage'
import { userStore } from './userStore'

type MatchResult = 'home' | 'draw' | 'away'

export interface MatchState {
  liveMatches: readonly Match[]
  upcomingFixtures: readonly Match[]
  predictions: readonly Prediction[]
  reminders: readonly string[]
  initMatches: () => void
  tickMatchMinute: () => void
  submitPrediction: (
    matchId: string,
    result: MatchResult,
    homeScore: number,
    awayScore: number
  ) => void
  toggleReminder: (matchId: string) => void
  voteMotm: (matchId: string, playerName: string) => void
  resolveMatch: (matchId: string, actualHome: number, actualAway: number) => void
}

function isValidScore(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

function hasMatch(id: string, liveMatches: readonly Match[], upcoming: readonly Match[]): boolean {
  return [...liveMatches, ...upcoming].some((match) => match.id === id)
}

export const matchStore = create<MatchState>()(
  persist(
    (set, get) => ({
      liveMatches: [],
      upcomingFixtures: [],
      predictions: [],
      reminders: [],

      initMatches: (): void => {
        set({
          liveMatches: mockMatches.filter((match) => match.status === 'live'),
          upcomingFixtures: mockMatches.filter((match) => match.status === 'upcoming'),
        })
      },

      tickMatchMinute: (): void => {
        set((state) => {
          const liveMatches = state.liveMatches.map((match) => {
            const nextMinute = Math.min(match.minute + 1, 90)
            if (nextMinute === 90 && match.minute === 89) {
              get().resolveMatch(match.id, match.home.score, match.away.score)
            }
            return { ...match, minute: nextMinute }
          })

          return { liveMatches }
        })
      },

      submitPrediction: (matchId, result, homeScore, awayScore): void => {
        if (
          !hasMatch(matchId, get().liveMatches, get().upcomingFixtures) ||
          !isValidScore(homeScore) ||
          !isValidScore(awayScore)
        ) {
          return
        }

        const existingPrediction = get().predictions.find(
          (prediction) => prediction.matchId === matchId
        )
        if (existingPrediction?.submitted) {
          return
        }

        userStore.getState().addXP(10)
        const prediction: Prediction = {
          matchId,
          result,
          homeScore,
          awayScore,
          submitted: true,
        }

        set((state) => ({
          predictions: [
            ...state.predictions.filter((item) => item.matchId !== matchId),
            prediction,
          ],
        }))
      },

      resolveMatch: (matchId, actualHome, actualAway): void => {
        if (!isValidScore(actualHome) || !isValidScore(actualAway)) {
          return
        }

        const prediction = get().predictions.find(
          (item) => item.matchId === matchId && item.submitted
        )
        if (!prediction || prediction.pointsEarned !== undefined) {
          return
        }

        const actualResult: MatchResult =
          actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw'

        const exactScore = prediction.homeScore === actualHome && prediction.awayScore === actualAway
        const correctResult = prediction.result === actualResult

        let points = 0
        if (exactScore) {
          points = 100
        } else if (correctResult) {
          points = 50
        }

        if (points > 0) {
          const currentUser = userStore.getState().currentUser
          userStore.getState().addXP(points)
          userStore.getState().addNotification({
            type: 'prediction_result',
            text: exactScore ? 'Exact score! +100 XP' : 'Correct prediction! +50 XP',
            avatarInitials: currentUser.avatarInitials,
            avatarColor: currentUser.avatarColor,
          })
        }

        set((state) => ({
          predictions: state.predictions.map((item) =>
            item.matchId === matchId && item.submitted ? { ...item, pointsEarned: points } : item
          ),
        }))
      },

      toggleReminder: (matchId): void => {
        if (!hasMatch(matchId, get().liveMatches, get().upcomingFixtures)) {
          return
        }

        set((state) => ({
          reminders: state.reminders.includes(matchId)
            ? state.reminders.filter((id) => id !== matchId)
            : [...state.reminders, matchId],
        }))
      },

      voteMotm: (_matchId, _playerName): void => {
        set(() => ({}))
      },
    }),
    {
      name: STORE_KEYS.matches,
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
