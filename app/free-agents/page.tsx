import { Suspense } from 'react'
import { FreeAgentsContent } from '@/components/football/player/FreeAgentsContent'
import { PageShell } from '@/components/shared/PageShell'
import { MarketHubQuickLinks } from '@/components/football/market-hub/MarketHubQuickLinks'
import { AppLayout } from '@/components/app-layout'

export const dynamic = 'force-dynamic'

export default function FreeAgentsPage() {
  return (
    <AppLayout>
      <PageShell
        title="Free agents"
        description="Explore unattached players, filtered by position, nationality, value and more."
        header={<MarketHubQuickLinks />}
      >
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading free agents…</div>}>
          <FreeAgentsContent />
        </Suspense>
      </PageShell>
    </AppLayout>
  )
}

