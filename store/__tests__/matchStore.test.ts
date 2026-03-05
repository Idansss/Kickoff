import { beforeEach, describe, expect, it } from 'vitest'
import { matchStore } from '@/store/matchStore'

describe('matchStore', () => {
  beforeEach(() => {
    localStorage.clear()
    matchStore.setState({
      liveMatches: [],
      upcomingFixtures: [],
      predictions: [],
      reminders: [],
    })
    matchStore.getState().initMatches()
  })

  it('tickMatchMinute increments match minute by one', () => {
    const initialMinute = matchStore.getState().liveMatches[0].minute

    matchStore.getState().tickMatchMinute()

    expect(matchStore.getState().liveMatches[0].minute).toBe(initialMinute + 1)
  })

  it('submitPrediction stores prediction with correct matchId and result', () => {
    const matchId = matchStore.getState().upcomingFixtures[0].id

    matchStore.getState().submitPrediction(matchId, 'home', 2, 1)

    const prediction = matchStore.getState().predictions.find((item) => item.matchId === matchId)
    expect(prediction).toBeDefined()
    expect(prediction?.result).toBe('home')
    expect(prediction?.submitted).toBe(true)
  })

  it('toggleReminder adds then removes match reminder', () => {
    const matchId = matchStore.getState().upcomingFixtures[0].id

    matchStore.getState().toggleReminder(matchId)
    expect(matchStore.getState().reminders).toContain(matchId)

    matchStore.getState().toggleReminder(matchId)
    expect(matchStore.getState().reminders).not.toContain(matchId)
  })
})
