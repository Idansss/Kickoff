import type { Metadata } from 'next'
import { AppLayout } from '@/components/app-layout'
import { TeamHeader } from '@/components/football/team/TeamHeader'
import { TeamTabs } from '@/components/football/team/TeamTabs'

interface ClubPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/football/teams/${params.id}/overview`, { next: { revalidate: 300 } })
    if (!res.ok) return { title: 'Club - KICKOFF' }
    const data = await res.json() as { team: { name?: string; country?: string } }
    const t = data.team
    const title = `${t.name ?? 'Club'} - KICKOFF`
    const description = t.country ? `${t.name} · ${t.country} football club on KICKOFF` : `${t.name} on KICKOFF`
    return {
      title,
      description,
      openGraph: { title, description, siteName: 'KICKOFF' },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: 'Club - KICKOFF' }
  }
}

async function fetchTeamOverview(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/football/teams/${id}/overview`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error('Team not found')
  }

  const json = (await res.json()) as { team: any }
  return json.team
}

export default async function ClubPage({ params }: ClubPageProps) {
  const team = await fetchTeamOverview(params.id)

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <TeamHeader team={team} />
        <TeamTabs teamId={params.id} />
      </div>
    </AppLayout>
  )
}
