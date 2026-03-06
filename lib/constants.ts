export const STORE_KEYS = {
  feed: 'kickoff-feed',
  user: 'kickoff-user',
  matches: 'kickoff-matches',
  chat: 'kickoff-chat',
  follow: 'kickoff-follow',
  streakDate: 'kickoff-last-streak-date',
  ui: 'kickoff-ui',
} as const

export const INPUT_LIMITS = {
  postMaxLength: 280,
  chatMaxLength: 500,
  aiMessageMaxLength: 500,
  warningThreshold: 30,
} as const

export const ANTHROPIC = {
  model: 'claude-sonnet-4-6',
  apiUrl: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01',
  timeoutMs: 15_000,
  retryDelayMs: 2_000,
  maxRetries: 1,
} as const

export const XAI = {
  model: 'grok-2-1212',
  apiUrl: 'https://api.x.ai/v1/chat/completions',
  timeoutMs: 15_000,
  retryDelayMs: 2_000,
  maxRetries: 1,
} as const

export type AiProvider = 'claude' | 'xai'

export const USER_MESSAGES = {
  connectionError: "Couldn't connect. Try again.",
  timeoutError: "Couldn't connect. Try again.",
  genericError: 'Something went wrong. Please try again.',
} as const

export const ROUTES = {
  footballGpt: '/api/footballgpt',
  scoutReport: '/api/scout-report',
  matchPreview: '/api/match-preview',
} as const
