import { Suspense } from 'react'
import { AgenciesContent } from '@/components/football/agency/AgenciesContent'
import { PageShell } from '@/components/shared/PageShell'
import { MarketHubQuickLinks } from '@/components/football/market-hub/MarketHubQuickLinks'
import { AppLayout } from '@/components/app-layout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Agencies · KICKOFF',
  description: 'Browse football agencies and their combined portfolio rankings.',
}

export default function AgenciesPage() {
  return (
    <AppLayout>
      <PageShell
        title="Agency rankings"
        description="Explore agencies by combined portfolio value, client count, and agent roster."
        header={<MarketHubQuickLinks />}
      >
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading agencies…</div>}>
          <AgenciesContent />
        </Suspense>
      </PageShell>
    </AppLayout>
  )
}
