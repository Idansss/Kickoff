import { Suspense } from 'react'
import { AgentsContent } from '@/components/football/agent/AgentsContent'
import { PageShell } from '@/components/shared/PageShell'
import { MarketHubQuickLinks } from '@/components/football/market-hub/MarketHubQuickLinks'
import { AppLayout } from '@/components/app-layout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Agents · KICKOFF',
  description: 'Browse football agents and their client portfolios.',
}

export default function AgentsPage() {
  return (
    <AppLayout>
      <PageShell
        title="Agent rankings"
        description="Browse agents by portfolio value, number of clients, and agency affiliation."
        header={<MarketHubQuickLinks />}
      >
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading agents…</div>}>
          <AgentsContent />
        </Suspense>
      </PageShell>
    </AppLayout>
  )
}
