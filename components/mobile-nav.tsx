'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Zap, Target, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()

  const links = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/matches', label: 'Matches', icon: Zap },
    { href: '/predict', label: 'Predict', icon: Target },
    { href: '/ai', label: 'AI', icon: Sparkles },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur md:hidden z-50">
      <div className="flex items-center justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const isAI = href === '/ai'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-3 text-xs transition-colors',
                isActive
                  ? isAI
                    ? 'text-green-500'
                    : 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
