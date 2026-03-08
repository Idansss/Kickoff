'use client'

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import { highlightMatch } from '@/lib/highlightMatch'
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '@/lib/recentSearches'
import type { SearchPlayer, SearchClub } from '@/data/searchData'
import type { Post } from '@/types'

function hashColor(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++)
    h = Math.imul(31, h) + str.charCodeAt(i)
  const hue = Math.abs(h % 360)
  const sat = 55
  const light = 45
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

interface SidebarSearchProps {
  isOpen: boolean
}

export function SidebarSearch({ isOpen }: SidebarSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [recentList, setRecentList] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const suggestions = useSearchSuggestions(query)
  const hasQuery = query.trim().length >= 1
  const showRecent = focused && !hasQuery
  const showSuggestions = hasQuery
  const dropdownOpen = showRecent || showSuggestions

  useEffect(() => {
    setRecentList(getRecentSearches())
  }, [showRecent])

  useEffect(() => {
    if (!dropdownOpen) setHighlightedIndex(0)
  }, [dropdownOpen])

  const flatItems = useMemo(() => {
    if (showRecent) return []
    const items: { type: string; data: unknown }[] = []
    suggestions.players.forEach((p) => items.push({ type: 'player', data: p }))
    suggestions.clubs.forEach((c) => items.push({ type: 'club', data: c }))
    suggestions.hashtags.forEach((h) => items.push({ type: 'hashtag', data: h }))
    suggestions.posts.forEach((p) => items.push({ type: 'post', data: p }))
    if (hasQuery) items.push({ type: 'searchAll', data: query.trim() })
    return items
  }, [
    showRecent,
    hasQuery,
    query,
    suggestions.players,
    suggestions.clubs,
    suggestions.hashtags,
    suggestions.posts,
  ])

  useEffect(() => {
    setHighlightedIndex((i) => (i >= flatItems.length ? Math.max(0, flatItems.length - 1) : i))
  }, [flatItems.length])

  const closeDropdown = useCallback(() => {
    setFocused(false)
  }, [])

  const selectItem = useCallback(
    (item: { type: string; data: unknown }) => {
      switch (item.type) {
        case 'player': {
          const p = item.data as SearchPlayer
          router.push(`/players?id=${encodeURIComponent(p.id)}`)
          break
        }
        case 'club': {
          const c = item.data as SearchClub
          router.push(`/discovery?club=${encodeURIComponent(c.name)}`)
          break
        }
        case 'hashtag': {
          const tag = item.data as string
          router.push(`/feed?hashtag=${encodeURIComponent(tag.replace(/^#/, ''))}`)
          break
        }
        case 'post': {
          const post = item.data as Post
          router.push(`/feed?post=${encodeURIComponent(post.id)}`)
          break
        }
        case 'searchAll': {
          const q = item.data as string
          router.push(`/discovery?q=${encodeURIComponent(q)}`)
          addRecentSearch(q)
          break
        }
      }
      closeDropdown()
      setQuery('')
    },
    [router, closeDropdown]
  )

  useEffect(() => {
    if (!dropdownOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdown()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => (i < flatItems.length - 1 ? i + 1 : i))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => (i > 0 ? i - 1 : 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (flatItems.length > 0 && highlightedIndex >= 0 && highlightedIndex < flatItems.length) {
          const item = flatItems[highlightedIndex]
          if (item.type === 'searchAll') {
            const q = item.data as string
            router.push(`/discovery?q=${encodeURIComponent(q)}`)
            addRecentSearch(q)
          } else {
            selectItem(item)
          }
        } else if (hasQuery) {
          const q = query.trim()
          router.push(`/discovery?q=${encodeURIComponent(q)}`)
          addRecentSearch(q)
        }
        closeDropdown()
        setQuery('')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [
    dropdownOpen,
    flatItems,
    highlightedIndex,
    hasQuery,
    query,
    closeDropdown,
    router,
    selectItem,
  ])

  useEffect(() => {
    if (!dropdownOpen) return
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [dropdownOpen, closeDropdown])

  const handleRecentSelect = (term: string) => {
    setQuery(term)
    setFocused(true)
    setRecentList(getRecentSearches())
  }

  if (!isOpen) return null

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Search players, clubs..."
        className="pl-10 bg-muted border-0 focus-visible:ring-1"
        aria-label="Search"
      />

      {dropdownOpen && (
        <div
          ref={listRef}
          className="sidebar-search-dropdown absolute left-0 right-0 z-[200] mt-1.5 overflow-hidden rounded-xl border border-border bg-background/95 backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          style={{
            maxHeight: 420,
          }}
        >
          <div className="max-h-[420px] overflow-y-auto">
            {showRecent && (
              <>
                <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent searches
                </div>
                {recentList.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No recent searches
                  </div>
                ) : (
                  recentList.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-foreground hover:bg-muted/60"
                      onClick={() => handleRecentSelect(term)}
                    >
                      <span className="text-muted-foreground">🕐</span>
                      <span className="flex-1 truncate">{term}</span>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-muted text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeRecentSearch(term)
                          setRecentList(getRecentSearches())
                        }}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </button>
                  ))
                )}
                {recentList.length > 0 && (
                  <div className="border-t border-border px-3.5 py-2">
                    <button
                      type="button"
                      className="text-xs text-green-600 hover:underline"
                      onClick={() => {
                        clearRecentSearches()
                        setRecentList([])
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </>
            )}

            {showSuggestions && (
              <>
                {!suggestions.hasResults && !suggestions.isLoading && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    ⚽ No results for &apos;{query.trim()}&apos;
                  </div>
                )}

                {suggestions.players.length > 0 && (
                  <>
                    <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Players
                    </div>
                    {suggestions.players.map((p, i) => {
                      const idx = flatItems.findIndex(
                        (x) => x.type === 'player' && (x.data as SearchPlayer).id === p.id
                      )
                      const isHighlighted = idx === highlightedIndex
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors',
                            isHighlighted && 'bg-green-500/10 border-l-[3px] border-l-green-600'
                          )}
                          onClick={() => selectItem({ type: 'player', data: p })}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                          <div
                            className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: hashColor(p.name) }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold">
                              {highlightMatch(p.name, query)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>{p.club}</span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                                {p.position}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 text-base">{p.flag}</span>
                        </button>
                      )
                    })}
                  </>
                )}

                {suggestions.clubs.length > 0 && (
                  <>
                    <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Clubs
                    </div>
                    {suggestions.clubs.map((c) => {
                      const idx = flatItems.findIndex(
                        (x) => x.type === 'club' && (x.data as SearchClub).id === c.id
                      )
                      const isHighlighted = idx === highlightedIndex
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors',
                            isHighlighted && 'bg-green-500/10 border-l-[3px] border-l-green-600'
                          )}
                          onClick={() => selectItem({ type: 'club', data: c })}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                          <div
                            className="h-8 w-8 shrink-0 rounded flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: c.color }}
                          >
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold">
                              {highlightMatch(c.name, query)}
                            </div>
                            <div className="text-xs text-muted-foreground">{c.league}</div>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}

                {suggestions.hashtags.length > 0 && (
                  <>
                    <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Hashtags
                    </div>
                    {suggestions.hashtags.map((tag) => {
                      const idx = flatItems.findIndex(
                        (x) => x.type === 'hashtag' && x.data === tag
                      )
                      const isHighlighted = idx === highlightedIndex
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors',
                            isHighlighted && 'bg-green-500/10 border-l-[3px] border-l-green-600'
                          )}
                          onClick={() => selectItem({ type: 'hashtag', data: tag })}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                            #
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[13px] font-bold text-green-600">
                              {highlightMatch(tag, query)}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              {Math.abs((tag.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)) % 2000) + 100} posts
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}

                {suggestions.posts.length > 0 && (
                  <>
                    <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Posts
                    </div>
                    {suggestions.posts.map((post) => {
                      const idx = flatItems.findIndex(
                        (x) => x.type === 'post' && (x.data as Post).id === post.id
                      )
                      const isHighlighted = idx === highlightedIndex
                      const content =
                        post.content.length > 60
                          ? `${post.content.slice(0, 60)}...`
                          : post.content
                      return (
                        <button
                          key={post.id}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors',
                            isHighlighted && 'bg-green-500/10 border-l-[3px] border-l-green-600'
                          )}
                          onClick={() => selectItem({ type: 'post', data: post })}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                          <div
                            className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                            style={{ backgroundColor: post.author.avatarColor }}
                          >
                            {post.author.avatarInitials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-foreground">{content}</p>
                            <p className="text-xs text-muted-foreground">
                              @{post.author.handle}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}

                {hasQuery && (
                  <div className="border-t border-border">
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-green-600 font-medium transition-colors',
                        highlightedIndex === flatItems.length - 1 &&
                          'bg-green-500/10 border-l-[3px] border-l-green-600'
                      )}
                      onClick={() => {
                        router.push(`/discovery?q=${encodeURIComponent(query.trim())}`)
                        addRecentSearch(query.trim())
                        closeDropdown()
                        setQuery('')
                      }}
                      onMouseEnter={() => setHighlightedIndex(flatItems.length - 1)}
                    >
                      🔍 Search all results for &apos;{query.trim()}&apos; →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
