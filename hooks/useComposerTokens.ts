'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  HASHTAGS,
  MENTIONABLE_USERS,
  MENTIONABLE_CLUBS,
  type MentionableUser,
  type MentionableClub,
} from '@/data/composerSuggestions'

export interface ActiveToken {
  type: 'hashtag' | 'mention' | null
  query: string
  start: number
  end: number
}

export interface HashtagSuggestion {
  tag: string
  count: string
}

export type MentionSuggestion =
  | { type: 'user'; data: MentionableUser }
  | { type: 'club'; data: MentionableClub }

const MAX_HASHTAG_SUGGESTIONS = 6
const MAX_MENTION_SUGGESTIONS = 6

function getActiveToken(text: string, cursorPos: number): ActiveToken & { query: string } {
  if (cursorPos <= 0 || cursorPos > text.length) {
    return { type: null, query: '', start: cursorPos, end: cursorPos }
  }
  let start = cursorPos - 1
  while (start > 0 && /[\w#@]/.test(text[start - 1])) {
    start--
  }
  const end = cursorPos
  const word = text.slice(start, end)
  const afterHash = word.startsWith('#') && word.length > 1
  const afterAt = word.startsWith('@') && word.length > 1
  if (afterHash) {
    return { type: 'hashtag', query: word.slice(1).toLowerCase(), start, end }
  }
  if (afterAt) {
    return { type: 'mention', query: word.slice(1).toLowerCase(), start, end }
  }
  return { type: null, query: '', start, end }
}

function filterHashtags(query: string): HashtagSuggestion[] {
  if (!query) return HASHTAGS.slice(0, MAX_HASHTAG_SUGGESTIONS)
  const q = query.toLowerCase()
  return HASHTAGS.filter((h) => h.tag.toLowerCase().replace('#', '').startsWith(q)).slice(
    0,
    MAX_HASHTAG_SUGGESTIONS
  )
}

function filterMentions(query: string): MentionSuggestion[] {
  if (!query) {
    const users = MENTIONABLE_USERS.slice(0, 4).map((u) => ({ type: 'user' as const, data: u }))
    const clubs = MENTIONABLE_CLUBS.slice(0, 2).map((c) => ({ type: 'club' as const, data: c }))
    return [...users, ...clubs].slice(0, MAX_MENTION_SUGGESTIONS)
  }
  const q = query.toLowerCase()
  const users = MENTIONABLE_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q)
  ).map((u) => ({ type: 'user' as const, data: u }))
  const clubs = MENTIONABLE_CLUBS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q)
  ).map((c) => ({ type: 'club' as const, data: c }))
  const combined = [...users, ...clubs].slice(0, MAX_MENTION_SUGGESTIONS)
  return combined
}

export function useComposerTokens(content: string, cursorPosition: number) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const activeToken = useMemo(
    () => getActiveToken(content, cursorPosition),
    [content, cursorPosition]
  )

  const hashtagSuggestions = useMemo(() => {
    if (activeToken.type !== 'hashtag') return []
    return filterHashtags(activeToken.query)
  }, [activeToken.type, activeToken.query])

  const mentionSuggestions = useMemo(() => {
    if (activeToken.type !== 'mention') return []
    return filterMentions(activeToken.query)
  }, [activeToken.type, activeToken.query])

  const showSuggestions =
    (activeToken.type === 'hashtag' && hashtagSuggestions.length > 0) ||
    (activeToken.type === 'mention' && mentionSuggestions.length > 0)

  const suggestionCount = activeToken.type === 'hashtag'
    ? hashtagSuggestions.length
    : mentionSuggestions.length

  const resetHighlight = useCallback(() => {
    setHighlightedIndex(0)
  }, [])

  const setHighlightedIndexSafe = useCallback((i: number) => {
    setHighlightedIndex((prev) => Math.max(0, Math.min(i, suggestionCount - 1)))
  }, [suggestionCount])

  return {
    activeToken,
    hashtagSuggestions,
    mentionSuggestions,
    showSuggestions,
    highlightedIndex,
    setHighlightedIndex: setHighlightedIndexSafe,
    resetHighlight,
    suggestionCount,
  }
}
