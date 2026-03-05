'use client'

import { useRouter } from 'next/navigation'
import { RightSidebar } from '@/components/NewComponents'
import { matchStore } from '@/store/matchStore'
import { feedStore } from '@/store/feedStore'
import { useMemo } from 'react'
import { formatKickoffTime } from '@/lib/utils'

export function RightSidebarWrapper() {
  const router = useRouter()
  const liveMatches = matchStore((s) => s.liveMatches)
  const upcomingFixtures = matchStore((s) => s.upcomingFixtures)
  const getTrendingTopics = feedStore((s) => s.getTrendingTopics)
  const posts = feedStore((s) => s.posts)

  const liveForSidebar = useMemo(
    () =>
      liveMatches.slice(0, 3).map((m) => ({
        id: m.id,
        home: m.home.name,
        away: m.away.name,
        hs: m.home.score,
        as: m.away.score,
        min: m.minute,
        viewers: '—',
      })),
    [liveMatches]
  )

  const trendingList = useMemo(() => {
    const topics = getTrendingTopics()
    return topics.map((t, i) => ({
      rank: i + 1,
      tag: t.tag.startsWith('#') ? t.tag : `#${t.tag}`,
      count: t.count,
    }))
  }, [getTrendingTopics, posts])

  const fixtures = useMemo(
    () =>
      upcomingFixtures.slice(0, 4).map((f) => ({
        id: f.id,
        comp: f.competition,
        home: f.home.name,
        away: f.away.name,
        time: f.kickoffTime ? formatKickoffTime(f.kickoffTime) : '—',
      })),
    [upcomingFixtures]
  )

  const onSearchSubmit = (q: string) => {
    if (typeof q !== 'string' || !q.trim()) return
    router.push(`/discovery?q=${encodeURIComponent(q.trim())}`)
  }

  const handleLiveHeaderClick = () => {
    router.push('/matches')
  }

  const handleLiveMatchClick = (id: string) => {
    router.push(`/matches?id=${encodeURIComponent(id)}`)
  }

  const handleTrendingHeaderClick = () => {
    router.push('/discovery')
  }

  const handleTrendingClick = (tag: string) => {
    const clean = tag.startsWith('#') ? tag.slice(1) : tag
    router.push(`/feed?hashtag=${encodeURIComponent(clean)}`)
  }

  const handleShowMoreTrending = () => {
    router.push('/discovery?tab=trending')
  }

  const handleFixturesHeaderClick = () => {
    router.push('/matches?tab=upcoming')
  }

  const handleFixtureClick = (id: string) => {
    router.push(`/matches?fixture=${encodeURIComponent(id)}`)
  }

  return (
    <RightSidebar
      liveMatches={liveForSidebar}
      trendingList={trendingList}
      fixtures={fixtures}
      onSearchSubmit={onSearchSubmit}
      onClickLiveHeader={handleLiveHeaderClick}
      onClickLiveMatch={handleLiveMatchClick}
      onClickTrendingHeader={handleTrendingHeaderClick}
      onClickTrendingTag={handleTrendingClick}
      onClickShowMoreTrending={handleShowMoreTrending}
      onClickFixturesHeader={handleFixturesHeaderClick}
      onClickFixture={handleFixtureClick}
    />
  )
}
