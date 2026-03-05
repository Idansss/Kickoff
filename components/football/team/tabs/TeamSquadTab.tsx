"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SquadPlayer {
  id: string
  name: string
  photoUrl?: string | null
  nationality?: string | null
  dob?: string | null
  age?: number | null
  position?: string | null
  preferredFoot?: string | null
}

interface SquadResponse {
  coachName?: string | null
  goalkeepers: SquadPlayer[]
  defenders: SquadPlayer[]
  midfielders: SquadPlayer[]
  forwards: SquadPlayer[]
}

interface Props {
  teamId: string
}

function Group({ title, players }: { title: string; players: SquadPlayer[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {players.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No players listed.</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/60">
              <div>
                <Link href={`/player/${p.id}`} className="font-medium hover:underline">
                  {p.name}
                </Link>
                <div className="text-[11px] text-muted-foreground">
                  {p.nationality && <span>{p.nationality}</span>}
                  {p.age != null && (
                    <>
                      {p.nationality && <span className="mx-1.5">·</span>}
                      <span>{p.age} years</span>
                    </>
                  )}
                </div>
              </div>
              {p.position && (
                <span className="text-[11px] uppercase text-muted-foreground">{p.position}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TeamSquadTab({ teamId }: Props) {
  const [data, setData] = useState<SquadResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/football/teams/${teamId}/squad`)
        if (!res.ok) throw new Error('Failed to load squad')
        const json = (await res.json()) as SquadResponse
        if (!cancelled) setData(json)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load squad.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [teamId])

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Squad</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading squad…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && !data && (
        <p className="text-xs text-muted-foreground">No squad data.</p>
      )}
      {data && (
        <div className="space-y-4">
          {data.coachName && (
            <p className="text-[11px] text-muted-foreground">Coach: {data.coachName}</p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Group title="Goalkeepers" players={data.goalkeepers} />
            <Group title="Defenders" players={data.defenders} />
            <Group title="Midfielders" players={data.midfielders} />
            <Group title="Forwards" players={data.forwards} />
          </div>
        </div>
      )}
    </section>
  )
}

