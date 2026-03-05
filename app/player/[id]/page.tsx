'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Sparkles, Target, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { PostCard } from '@/components/post-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getScoutReport } from '@/lib/claudeClient'
import { mockPlayers, mockPosts } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

function formatNumber(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
}

export default function PlayerPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const player = mockPlayers.find((item) => item.id === id)

  const [isFollowing, setIsFollowing] = useState(false)
  const [scoutReport, setScoutReport] = useState<string | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  if (!player) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl border-x border-border">
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-4xl">⚽</div>
            <h2 className="text-xl font-bold">Player not found</h2>
            <Link href="/discovery">
              <Button variant="outline">Browse Players</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const relatedPosts = useMemo(
    () => mockPosts.filter((post) => post.relatedPlayer?.id === player.id),
    [player.id]
  )

  const generateScoutReport = useCallback(async (): Promise<void> => {
    if (scoutReport) {
      setReportOpen((open) => !open)
      return
    }

    setIsLoadingReport(true)
    setReportOpen(true)
    setReportError(null)

    try {
      const report = await getScoutReport(player.name, player.club.name)
      if (report === "Couldn't connect. Try again.") {
        setReportError(report)
      } else {
        setScoutReport(report || 'Could not generate report.')
        setReportError(null)
      }
    } catch {
      setReportError("Couldn't connect. Try again.")
    } finally {
      setIsLoadingReport(false)
    }
  }, [player.club.name, player.name, scoutReport])

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        <div className="h-32 bg-gradient-to-br from-green-600/30 via-green-500/10 to-transparent border-b border-border" />

        <div className="px-4 sm:px-6 pb-4 border-b border-border">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <Image
                src={player.avatar}
                alt={player.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full border-4 border-background bg-muted"
              />
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold border-2 border-background">
                {player.number}
              </div>
            </div>

            <div className="flex gap-2 pb-1">
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
                onClick={() => setIsFollowing((value) => !value)}
                className={cn(isFollowing && 'border-green-500 text-green-600')}
              >
                <Users className="h-4 w-4 mr-1" />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <h1 className="text-2xl font-bold">{player.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary">{player.position}</Badge>
                {player.nationality ? (
                  <span className="text-sm text-muted-foreground">{player.nationality}</span>
                ) : null}
                {player.age ? (
                  <span className="text-sm text-muted-foreground">Age {player.age}</span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Image
                src={player.club.logo}
                alt={player.club.name}
                width={20}
                height={20}
                className="h-5 w-5"
              />
              <Link
                href={`/club/${player.club.id}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {player.club.name}
              </Link>
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{formatNumber(player.followers)}</span>
              <span>followers</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-2xl font-bold text-green-500">{player.stats.goals}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Goals</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-2xl font-bold text-blue-500">{player.stats.assists}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Assists</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-2xl font-bold">{player.stats.appearances}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Appearances</div>
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full border-green-500/50 text-green-600 hover:bg-green-500/10 hover:border-green-500"
              onClick={() => void generateScoutReport()}
              disabled={isLoadingReport}
            >
              {isLoadingReport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Scout Report...
                </>
              ) : scoutReport ? (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Scout Report
                  {reportOpen ? (
                    <ChevronUp className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  )}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Scout Report
                </>
              )}
            </Button>

            {reportOpen && scoutReport ? (
              <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                    AI Scout Analysis
                  </span>
                </div>
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {scoutReport}
                </div>
              </div>
            ) : null}

            {reportError ? (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">
                {reportError}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="px-4 py-3 sm:px-6 border-b border-border">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Recent Posts
            </h2>
          </div>

          {relatedPosts.length > 0 ? (
            relatedPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-3xl">⚽</div>
              <p className="text-sm text-muted-foreground">No posts about {player.name} yet</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
