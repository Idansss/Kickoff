import CalendarMatches from '@/components/football/CalendarMatches'

export const dynamic = 'force-dynamic'

export default function CalendarPage() {
  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="text-xl font-semibold">Match calendar</h1>
      <div className="mt-4">
        <CalendarMatches />
      </div>
    </main>
  )
}

