"use client"

export function MatchVisualPlaceholders() {
  const sections: Array<{ title: string; description: string }> = [
    {
      title: 'Shot map',
      description: 'Detailed shot locations and xG will appear here when integrated.',
    },
    {
      title: 'Momentum',
      description: 'Live momentum graph will appear here during matches.',
    },
    {
      title: 'xG timeline',
      description: 'Cumulative expected goals over time will be shown here.',
    },
  ]

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {sections.map((s) => (
        <div key={s.title} className="flex flex-col justify-between rounded-xl border bg-card p-3 text-xs">
          <h3 className="mb-1 text-sm font-semibold">{s.title}</h3>
          <p className="text-[11px] text-muted-foreground">{s.description}</p>
          <div className="mt-2 flex-1 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40" />
        </div>
      ))}
    </section>
  )
}

