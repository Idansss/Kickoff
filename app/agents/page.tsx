import { Suspense } from 'react'
import { AgentsContent } from '@/components/football/agent/AgentsContent'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Agents · KICKOFF',
  description: 'Browse football agents and their client portfolios.',
}

export default function AgentsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Agent rankings</h1>
        <p className="text-sm text-muted-foreground">
          Browse licensed agents by portfolio value, number of clients, and agency affiliation.
        </p>
      </header>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading agents…</div>}>
        <AgentsContent />
      </Suspense>
    </main>
  )
}
