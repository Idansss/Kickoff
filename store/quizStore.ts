import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_KEYS } from '@/lib/constants'
import { safeStorage } from '@/lib/safeStorage'

interface QuizPlayer {
  id: string
  name: string
  position: string | null
  nationality: string | null
  age: number | null
  photoUrl: string | null
  currentTeam: { id: string; name: string; badgeUrl: string | null } | null
}

interface AttemptResult {
  playerId: string
  playerName: string
  guessedValueEur: number
  actualValueEur: number
  guessedFormatted: string
  actualFormatted: string
  deltaEur: number
  deltaFormatted: string
  deltaDirection: 'over' | 'under' | 'exact'
  score: number
  scoreLabel: string
  percentageOff: number
}

interface QuizState {
  /** Current player being shown, persisted so refresh resumes the same player */
  player: QuizPlayer | null
  valueBand: string | null
  guess: string
  result: AttemptResult | null
  streak: number

  setPlayer: (player: QuizPlayer | null, valueBand: string | null) => void
  setGuess: (guess: string) => void
  setResult: (result: AttemptResult) => void
  resetRound: () => void
  clearGame: () => void
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      player: null,
      valueBand: null,
      guess: '',
      result: null,
      streak: 0,

      setPlayer: (player, valueBand) =>
        set({ player, valueBand, guess: '', result: null }),

      setGuess: (guess) => set({ guess }),

      setResult: (result) =>
        set((state) => ({
          result,
          streak: result.score > 0 ? state.streak + 1 : 0,
        })),

      resetRound: () => set({ player: null, valueBand: null, guess: '', result: null }),

      clearGame: () => set({ player: null, valueBand: null, guess: '', result: null, streak: 0 }),
    }),
    {
      name: STORE_KEYS.quiz,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
)
