'use client'

import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'
import { RightSidebarWrapper } from './RightSidebarWrapper'
import { useWindowWidth } from '@/hooks/useWindowWidth'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const width = useWindowWidth()
  const showRightSidebar = width >= 1200

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0 md:overflow-y-auto transition-all duration-300 ease-in-out min-w-0">
        {children}
      </main>
      {showRightSidebar && <RightSidebarWrapper />}
      <MobileNav />
    </div>
  )
}

