export interface User {
  id: string
  name: string
  handle: string
  avatarInitials: string
  avatarColor: string
  verified: boolean
  followers: number
  following: number
  favoriteTeams: string[]
  xp: number
  level: number
  streak: number
  badges: Badge[]
}

export interface Reply {
  id: string
  author: User
  content: string
  createdAt: Date
  likes: number
  likedByMe: boolean
}

export interface Post {
  id: string
  author: User
  content: string
  hashtags: string[]
  mentions: string[]
  tag: 'PL' | 'UCL' | 'Transfer' | 'Stats' | 'SerieA' | 'LaLiga' | 'General'
  likes: number
  comments: number
  reposts: number
  bookmarked: boolean
  likedByMe: boolean
  poll?: Poll
  quotedPost?: Post
  createdAt: Date
  replies?: Reply[]
  repostedByMe?: boolean
  /** Set on the repost copy; original post id */
  repostOfPostId?: string
  /** Set on the repost copy; user id who reposted */
  repostedBy?: string
  /** Object URLs or image URLs attached to the post (max 4) */
  images?: string[]
}

export interface Poll {
  question: string
  options: PollOption[]
  totalVotes: number
  votedOptionId?: string
  endsAt: Date
}

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface Match {
  id: string
  competition: string
  competitionFlag: string
  home: MatchTeam
  away: MatchTeam
  minute: number
  status: 'live' | 'upcoming' | 'finished'
  xG: { home: number; away: number }
  events: MatchEvent[]
  momentum: MomentumSegment[]
  shots: Shot[]
  kickoffTime?: string
}

export interface MatchTeam {
  name: string
  score: number
  color: string
}

export interface MatchEvent {
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'var'
  minute: number
  team: 'home' | 'away'
  playerName: string
  detail?: string
}

export interface Shot {
  x: number
  y: number
  outcome: 'goal' | 'saved' | 'missed' | 'blocked'
  xG: number
  playerName: string
  minute: number
}

export interface MomentumSegment {
  team: 'home' | 'away'
  intensity: number
}

export interface Player {
  id: string
  name: string
  club: string
  nationality: string
  flag: string
  age: number
  position: 'FW' | 'MF' | 'DF' | 'GK'
  goals: number
  assists: number
  apps: number
  rating: number
  marketValue: string
  contractUntil: string
  formRatings: number[]
  avatarColor: string
}

export interface Transfer {
  id: string
  playerName: string
  from: string
  to: string
  fee: string
  date: string
  isHot: boolean
  status: 'confirmed' | 'rumour'
  reliability?: number
  source?: string
}

export interface Standing {
  pos: number
  club: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: string
  points: number
  form: ('W' | 'D' | 'L')[]
}

export interface Badge {
  id: string
  name: string
  emoji: string
  description: string
  earned: boolean
  earnedAt?: Date
}

export interface Notification {
  id: string
  type: 'like' | 'reply' | 'follow' | 'goal_alert' | 'prediction_result' | 'badge_earned'
  text: string
  timestamp: Date
  read: boolean
  avatarInitials: string
  avatarColor: string
}

export interface Prediction {
  matchId: string
  result: 'home' | 'draw' | 'away'
  homeScore: number
  awayScore: number
  submitted: boolean
  pointsEarned?: number
}

export interface ChatRoom {
  id: string
  title: string
  members: number
  icon: 'live' | 'club' | 'general'
  unreadCount: number
  matchId?: string
  clubId?: string
}

export interface Message {
  id: string
  roomId: string
  content: string
  authorId: string
  authorName: string
  authorHandle: string
  avatarInitials: string
  avatarColor: string
  createdAt: Date
}

export interface AppSettings {
  privateAccount: boolean
  allowMessages: boolean
  activityStatus: boolean
  matches: boolean
  messages: boolean
  posts: boolean
}

export interface LegacyUser {
  id: string
  name: string
  handle: string
  avatar: string
  bio?: string
  isFollowing?: boolean
  followers: number
  following: number
}

export interface LegacyClub {
  id: string
  name: string
  logo: string
  country: string
  followers: number
}

export interface LegacyPlayer {
  id: string
  name: string
  number: number
  position: string
  nationality: string
  age: number
  club: LegacyClub
  avatar: string
  followers: number
  stats: {
    appearances: number
    goals: number
    assists: number
  }
}

export interface LegacyMatch {
  id: string
  homeTeam: LegacyClub
  awayTeam: LegacyClub
  date: Date
  status: 'upcoming' | 'live' | 'finished'
  homeScore?: number
  awayScore?: number
  league: string
  liveMinute?: number
}

export interface LegacyPost {
  id: string
  author: LegacyUser
  content: string
  image?: string
  likes: number
  replies: number
  reposts: number
  shares: number
  isLiked?: boolean
  createdAt: Date
  relatedMatch?: LegacyMatch
  relatedPlayer?: LegacyPlayer
}

export interface LegacyTransfer {
  id: string
  player: LegacyPlayer
  fromClub: LegacyClub
  toClub: LegacyClub
  fee: string
  date: Date
}
