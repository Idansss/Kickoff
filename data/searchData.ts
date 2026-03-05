export interface SearchPlayer {
  id: string
  name: string
  club: string
  position: string
  flag: string
}

export interface SearchClub {
  id: string
  name: string
  league: string
  color: string
}

export const SEARCH_PLAYERS: SearchPlayer[] = [
  { id: 'p1', name: 'Erling Haaland', club: 'Man City', position: 'ST', flag: '🇳🇴' },
  { id: 'p2', name: 'Kylian Mbappé', club: 'Real Madrid', position: 'FW', flag: '🇫🇷' },
  { id: 'p3', name: 'Vinicius Jr.', club: 'Real Madrid', position: 'FW', flag: '🇧🇷' },
  { id: 'p4', name: 'Mohamed Salah', club: 'Liverpool', position: 'RW', flag: '🇪🇬' },
  { id: 'p5', name: 'Jude Bellingham', club: 'Real Madrid', position: 'CM', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'p6', name: 'Lamine Yamal', club: 'Barcelona', position: 'RW', flag: '🇪🇸' },
  { id: 'p7', name: 'Pedri', club: 'Barcelona', position: 'CM', flag: '🇪🇸' },
  { id: 'p8', name: 'Rodri', club: 'Man City', position: 'DM', flag: '🇪🇸' },
  { id: 'p9', name: 'Bukayo Saka', club: 'Arsenal', position: 'RW', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'p10', name: 'Marcus Rashford', club: 'AC Milan', position: 'FW', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
]

export const SEARCH_CLUBS: SearchClub[] = [
  { id: 'c1', name: 'Arsenal', league: 'Premier League', color: '#EF0107' },
  { id: 'c2', name: 'Manchester City', league: 'Premier League', color: '#6CADDF' },
  { id: 'c3', name: 'Liverpool', league: 'Premier League', color: '#C8102E' },
  { id: 'c4', name: 'Real Madrid', league: 'La Liga', color: '#FEBE10' },
  { id: 'c5', name: 'Barcelona', league: 'La Liga', color: '#A50044' },
  { id: 'c6', name: 'Bayern Munich', league: 'Bundesliga', color: '#DC052D' },
  { id: 'c7', name: 'AC Milan', league: 'Serie A', color: '#FB090B' },
  { id: 'c8', name: 'Juventus', league: 'Serie A', color: '#000000' },
  { id: 'c9', name: 'PSG', league: 'Ligue 1', color: '#004170' },
  { id: 'c10', name: 'Chelsea', league: 'Premier League', color: '#034694' },
]

export const SEARCH_HASHTAGS: string[] = [
  '#UCLFinal',
  '#Haaland',
  '#TransferDeadline',
  '#ElClasico',
  '#PremierLeague',
  '#Bellingham',
  '#Vinicius',
  '#SerieA',
  '#Bundesliga',
  '#LaLiga',
  '#Tactics',
  '#OptaStats',
  '#Transfer',
]
