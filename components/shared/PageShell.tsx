import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageShell({
  title,
  description,
  children,
  header,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  header?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <main className={cn('mx-auto flex w-full max-w-6xl flex-col gap-5 p-4', className)}>
      <header className="relative overflow-hidden rounded-2xl border bg-card px-4 py-4 sm:px-6 sm:py-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {header ? <div className="pt-1">{header}</div> : null}
        </div>
      </header>

      <section className="min-h-[50vh]">{children}</section>
    </main>
  )
}

