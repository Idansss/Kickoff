import Image from 'next/image'
import Link from 'next/link'
import { mockClubs, mockPlayers } from '@/lib/mock-data'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Share2, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Club Profile - KICKOFF',
}

interface ClubPageProps {
  params: Promise<{ id: string }>
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { id } = await params
  const club = mockClubs.find((c) => c.id === id)

  if (!club) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Club not found</h1>
          </div>
        </div>
      </AppLayout>
    )
  }

  const clubPlayers = mockPlayers.filter((p) => p.club.id === club.id)

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        {/* Cover and Header */}
        <div className="border-b border-border">
          {/* Cover */}
          <div className="h-40 bg-gradient-to-r from-accent/30 to-accent/10"></div>

          {/* Profile Section */}
          <div className="px-4 pb-6 sm:px-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <div className="-mt-20 flex gap-4">
                  <Image
                    src={club.logo}
                    alt={club.name}
                    width={120}
                    height={120}
                    className="h-32 w-32 rounded-lg border-4 border-background bg-background p-2"
                    priority
                  />
                  <div className="flex flex-col justify-end pb-2">
                    <h1 className="text-2xl font-bold">{club.name}</h1>
                    <p className="text-muted-foreground">{club.country}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" aria-label="Open club messages">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" aria-label="Share club profile">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm">Follow</Button>
                </div>
              </div>

              {/* Stats */}
              <div className="rounded-lg border border-border p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{club.followers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Followers on KICKOFF</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Squad Section */}
        <div className="border-b border-border">
          <div className="px-4 py-6 sm:px-6">
            <h2 className="mb-4 text-lg font-bold">Squad</h2>

            {clubPlayers.length > 0 ? (
              <div className="space-y-3">
                {clubPlayers.map((player) => (
                  <Link
                    key={player.id}
                    href={`/player/${player.id}`}
                    className="group flex items-center gap-4 rounded-lg border border-border p-3 transition-all hover:border-accent hover:bg-muted"
                  >
                    <Image
                      src={player.avatar}
                      alt={player.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full"
                    />

                    <div className="flex-1">
                      <div className="font-semibold text-foreground group-hover:text-accent">
                        {player.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        #{player.number} · {player.position}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">{player.stats.goals}</div>
                      <div className="text-xs text-muted-foreground">Goals</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No players in this squad yet
              </div>
            )}
          </div>
        </div>

        {/* About Section */}
        <div className="px-4 py-6 sm:px-6">
          <h2 className="mb-4 text-lg font-bold">About</h2>
          <div className="rounded-lg border border-border p-4">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">Country</dt>
                <dd className="mt-1">{club.country}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">On KICKOFF</dt>
                <dd className="mt-1">{club.followers.toLocaleString()} followers</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
