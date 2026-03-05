export const HASHTAGS = [
  { tag: '#UCLFinal', count: '4.2k' },
  { tag: '#Haaland', count: '18.3k' },
  { tag: '#TransferDeadline', count: '9.1k' },
  { tag: '#ElClasico', count: '22.4k' },
  { tag: '#PremierLeague', count: '41.2k' },
  { tag: '#Bellingham', count: '7.8k' },
  { tag: '#Vinicius', count: '11.2k' },
  { tag: '#SerieA', count: '6.3k' },
  { tag: '#Bundesliga', count: '5.1k' },
  { tag: '#LaLiga', count: '8.7k' },
  { tag: '#Tactics', count: '3.4k' },
  { tag: '#Transfer', count: '14.6k' },
  { tag: '#OptaStats', count: '2.9k' },
  { tag: '#UCL', count: '33.1k' },
  { tag: '#Arsenal', count: '19.2k' },
  { tag: '#RealMadrid', count: '28.4k' },
  { tag: '#Barcelona', count: '25.1k' },
  { tag: '#ManCity', count: '17.6k' },
  { tag: '#Liverpool', count: '21.3k' },
  { tag: '#MOTM', count: '8.1k' },
]

export interface MentionableUser {
  id: string
  name: string
  handle: string
  verified: boolean
  avatarColor: string
}

export interface MentionableClub {
  id: string
  name: string
  handle: string
  color: string
}

export const MENTIONABLE_USERS: MentionableUser[] = [
  { id: 'u1', name: 'Fabrizio Romano', handle: 'fabrizioromano', verified: true, avatarColor: '#3b82f6' },
  { id: 'u2', name: 'OptaJoe', handle: 'OptaJoe', verified: true, avatarColor: '#ef4444' },
  { id: 'u3', name: 'The Athletic', handle: 'TheAthletic', verified: true, avatarColor: '#16a34a' },
  { id: 'u4', name: 'Tactical Times', handle: 'tactimes', verified: false, avatarColor: '#8b5cf6' },
  { id: 'u5', name: 'Football Daily', handle: 'footballdaily', verified: true, avatarColor: '#f59e0b' },
  { id: 'u6', name: 'SerieA Daily', handle: 'serieadaily', verified: false, avatarColor: '#06b6d4' },
]

export const MENTIONABLE_CLUBS: MentionableClub[] = [
  { id: 'cl1', name: 'Arsenal', handle: 'Arsenal', color: '#EF0107' },
  { id: 'cl2', name: 'Real Madrid', handle: 'RealMadrid', color: '#FEBE10' },
  { id: 'cl3', name: 'Barcelona', handle: 'Barcelona', color: '#A50044' },
  { id: 'cl4', name: 'Manchester City', handle: 'ManCity', color: '#6CADDF' },
  { id: 'cl5', name: 'Liverpool', handle: 'Liverpool', color: '#C8102E' },
  { id: 'cl6', name: 'Bayern Munich', handle: 'FCBayern', color: '#DC052D' },
]
