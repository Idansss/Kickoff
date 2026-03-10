import { Suspense } from 'react'
import { AdvancedPlayerSearchContent } from '@/components/football/player/AdvancedPlayerSearchContent'
import { PageShell } from '@/components/shared/PageShell'
import { MarketHubQuickLinks } from '@/components/football/market-hub/MarketHubQuickLinks'
import { AppLayout } from '@/components/app-layout'

export const dynamic = 'force-dynamic'

export default function AdvancedPlayerSearchPage() {
  return (
    <AppLayout>
      <PageShell
        title="Advanced player search"
        description="Filter players by contract, market value, age, position, agent and more."
        header={<MarketHubQuickLinks />}
      >
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading filters…</div>}>
          <AdvancedPlayerSearchContent />
        </Suspense>
      </PageShell>
    </AppLayout>
  )
}

