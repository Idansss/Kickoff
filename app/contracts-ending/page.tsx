import { Suspense } from 'react'
import { ContractsEndingContent } from '@/components/football/player/ContractsEndingContent'
import { PageShell } from '@/components/shared/PageShell'
import { MarketHubQuickLinks } from '@/components/football/market-hub/MarketHubQuickLinks'
import { AppLayout } from '@/components/app-layout'

export const dynamic = 'force-dynamic'

export default function ContractsEndingPage() {
  return (
    <AppLayout>
      <PageShell
        title="Contracts ending"
        description="See players with deals expiring soon. Filter by window, position, club and more."
        header={<MarketHubQuickLinks />}
      >
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading expiring contracts…</div>}>
          <ContractsEndingContent />
        </Suspense>
      </PageShell>
    </AppLayout>
  )
}

