import { Suspense } from 'react'
import { AgenciesContent } from '@/components/football/agency/AgenciesContent'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Agencies · KICKOFF',
  description: 'Browse football agencies and their combined portfolio rankings.',
}

export default function AgenciesPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Agency rankings</h1>
        <p className="text-sm text-muted-foreground">
          Explore agencies by combined portfolio value, client count, and agent roster.
        </p>
      </header>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading agencies…</div>}>
        <AgenciesContent />
      </Suspense>
    </main>
  )
}
