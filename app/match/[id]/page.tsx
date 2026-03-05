import Image from 'next/image'
import Link from 'next/link'
import { mockMatches, mockPosts } from '@/lib/mock-data'
import { AppLayout } from '@/components/app-layout'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Match - KICKOFF',
}

interface MatchPageProps {
  params: Promise<{ id: string }>
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params
  const match = mockMatches.find((m) => m.id === id)

  if (!match) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Match not found</h1>
          </div>
        </div>
      </AppLayout>
    )
  }

  const matchPosts = mockPosts.filter((p) => p.relatedMatch?.id === match.id)

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        {/* Match Header */}
        <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
          <div className="space-y-6">
            {/* League and Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {match.league}
              </span>
              <Badge
                variant={
                  match.status === 'live'
                    ? 'default'
                    : match.status === 'finished'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {match.status === 'live'
                  ? 'LIVE'
                  : match.status === 'finished'
                    ? 'FINISHED'
                    : 'UPCOMING'}
              </Badge>
            </div>

            {/* Match Score */}
            <div className="flex items-center justify-around gap-4">
              {/* Home Team */}
              <Link
                href={`/club/${match.homeTeam.id}`}
                className="flex flex-1 flex-col items-center gap-3 rounded-lg transition-colors hover:text-accent"
              >
                <Image
                  src={match.homeTeam.logo}
                  alt={match.homeTeam.name}
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
                <div className="text-center">
                  <div className="font-bold">{match.homeTeam.name}</div>
                  <div className="text-sm text-muted-foreground">{match.homeTeam.country}</div>
                </div>
              </Link>

              {/* Score */}
              <div className="flex flex-col items-center gap-2">
                {match.status === 'finished' ? (
                  <>
                    <div className="text-4xl font-bold">
                      {match.homeScore} - {match.awayScore}
                    </div>
                    <span className="text-xs text-muted-foreground">Full Time</span>
                  </>
                ) : match.status === 'live' ? (
                  <>
                    <div className="text-4xl font-bold text-accent">
                      {match.homeScore} - {match.awayScore}
                    </div>
                    <span className="text-xs font-semibold text-accent">LIVE</span>
                  </>
                ) : (
                  <Button>Watch</Button>
                )}
              </div>

              {/* Away Team */}
              <Link
                href={`/club/${match.awayTeam.id}`}
                className="flex flex-1 flex-col items-center gap-3 rounded-lg transition-colors hover:text-accent"
              >
                <Image
                  src={match.awayTeam.logo}
                  alt={match.awayTeam.name}
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
                <div className="text-center">
                  <div className="font-bold">{match.awayTeam.name}</div>
                  <div className="text-sm text-muted-foreground">{match.awayTeam.country}</div>
                </div>
              </Link>
            </div>

            {/* Match Info */}
            <div className="rounded-lg border border-border p-3">
              <div className="text-center text-sm">
                <div className="text-muted-foreground">
                  {match.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="font-semibold">
                  {match.date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Section */}
        <div>
          <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-4 sm:px-6">
            <h2 className="font-bold">Match Discussion</h2>
            <p className="text-sm text-muted-foreground">
              {matchPosts.length} posts about this match
            </p>
          </div>

          {matchPosts.length > 0 ? (
            <div>
              {matchPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to discuss!</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
