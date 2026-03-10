import type { Metadata } from 'next'
import { PlayerHeader } from '@/components/football/player/PlayerHeader'
import { PlayerTabs } from '@/components/football/player/PlayerTabs'

interface PlayerPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/football/players/${params.id}`, { next: { revalidate: 300 } })
    if (!res.ok) return { title: 'Player - KICKOFF' }
    const data = await res.json() as { player: { name?: string; position?: string; nationality?: string } }
    const p = data.player
    const title = `${p.name ?? 'Player'} - KICKOFF`
    const description = [p.position, p.nationality].filter(Boolean).join(' · ')
    return {
      title,
      description,
      openGraph: { title, description, siteName: 'KICKOFF' },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: 'Player - KICKOFF' }
  }
}

async function fetchPlayer(id: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch(`${base}/api/football/players/${id}`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error('Player not found')
  }

  return (await res.json()) as {
    player: any
    transferStatus?: any
    contract?: any
    agent?: any
    value?: any
    valueDetail?: any
    recentForm?: any
  }
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const data = await fetchPlayer(params.id)

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <PlayerHeader
        player={data.player}
        transferStatus={data.transferStatus}
        contract={data.contract}
        agent={data.agent}
        value={data.value}
        recentForm={data.recentForm}
      />
      <PlayerTabs playerId={params.id} />
    </main>
  )
}
