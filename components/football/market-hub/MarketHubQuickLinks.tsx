'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MARKET_HUB_LINKS } from './marketHubLinks'
import { cn } from '@/lib/utils'

export function MarketHubQuickLinks({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-wrap gap-2', className)} aria-label="Market hub quick links">
      {MARKET_HUB_LINKS.map((l) => {
        const active = pathname === l.href
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted/40 text-foreground hover:bg-muted',
            )}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}

