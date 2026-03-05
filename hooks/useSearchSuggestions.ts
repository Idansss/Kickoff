'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Post } from '@/types'
import { feedStore } from '@/store/feedStore'
import {
  SEARCH_PLAYERS,
  SEARCH_CLUBS,
  SEARCH_HASHTAGS,
  type SearchPlayer,
  type SearchClub,
} from '@/data/searchData'

const DEBOUNCE_MS = 150
const LOADING_MS = 100
const MAX_PLAYERS = 3
const MAX_CLUBS = 3
const MAX_HASHTAGS = 3
const MAX_POSTS = 2

export interface SearchSuggestionsResult {
  players: SearchPlayer[]
  clubs: SearchClub[]
  hashtags: string[]
  posts: Post[]
  hasResults: boolean
  isLoading: boolean
}

function matchQuery(str: string, query: string): boolean {
  return str.toLowerCase().includes(query.toLowerCase().trim())
}

export function useSearchSuggestions(query: string): SearchSuggestionsResult {
  const posts = feedStore((s) => s.posts)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setDebouncedQuery('')
      return
    }
    setIsLoading(true)
    const t = setTimeout(() => {
      setDebouncedQuery(q)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!debouncedQuery) {
      setIsLoading(false)
      return
    }
    const t = setTimeout(() => setIsLoading(false), LOADING_MS)
    return () => clearTimeout(t)
  }, [debouncedQuery])

  const result = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) {
      return {
        players: [],
        clubs: [],
        hashtags: [],
        posts: [],
        hasResults: false,
      }
    }

    const players = SEARCH_PLAYERS.filter((p) =>
      matchQuery(p.name, debouncedQuery)
    ).slice(0, MAX_PLAYERS)

    const clubs = SEARCH_CLUBS.filter((c) =>
      matchQuery(c.name, debouncedQuery)
    ).slice(0, MAX_CLUBS)

    const hashtags = SEARCH_HASHTAGS.filter((tag) =>
      matchQuery(tag, debouncedQuery)
    ).slice(0, MAX_HASHTAGS)

    const postsFiltered = posts
      .filter((p) => matchQuery(p.content, debouncedQuery))
      .slice(0, MAX_POSTS)

    return {
      players,
      clubs,
      hashtags,
      posts: postsFiltered,
      hasResults:
        players.length > 0 ||
        clubs.length > 0 ||
        hashtags.length > 0 ||
        postsFiltered.length > 0,
    }
  }, [debouncedQuery, posts])

  return {
    ...result,
    isLoading,
  }
}
