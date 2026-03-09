"use client"

import { useEffect, useState } from 'react'
import { ClubIdentity } from '@/components/common/ClubIdentity'

interface TransferItem {
  id: string
  type: string
  direction: 'in' | 'out'
  fee?: string | null
  date?: string | null
  player: {
    id: string
    name: string
    position?: string | null
    nationality?: string | null
  }
  fromTeam: { id: string; name: string; badgeUrl?: string | null } | null
  toTeam: { id: string; name: string; badgeUrl?: string | null } | null
}

interface Props {
  teamId: string
}

export function TeamTransfersTab({ teamId }: Props) {
  const [items, setItems] = useState<TransferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/football/teams/${teamId}/transfers`)
        if (!res.ok) throw new Error('Failed to load transfers')
        const json = (await res.json()) as { transfers: TransferItem[] }
        if (!cancelled) setItems(json.transfers ?? [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load transfers.')
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
      <h2 className="mb-3 text-sm font-semibold">Transfers</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading transfers…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-xs text-muted-foreground">No transfers found.</p>
      )}
      <ul className="space-y-2 text-xs">
        {items.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
          >
            <div>
              <div className="font-semibold">{t.player.name}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{t.direction === 'in' ? 'In from' : 'Out to'}</span>
                {t.direction === 'in' ? (
                  t.fromTeam ? (
                    <ClubIdentity
                      name={t.fromTeam.name}
                      badgeUrl={t.fromTeam.badgeUrl}
                      href={`/club/${t.fromTeam.id}`}
                      size="xs"
                    />
                  ) : (
                    <span>Unknown</span>
                  )
                ) : t.toTeam ? (
                  <ClubIdentity
                    name={t.toTeam.name}
                    badgeUrl={t.toTeam.badgeUrl}
                    href={`/club/${t.toTeam.id}`}
                    size="xs"
                  />
                ) : (
                  <span>Unknown</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground">
                {t.type === 'loan' ? 'Loan' : 'Permanent'}
              </div>
              {t.fee && <div className="text-[11px] font-semibold">{t.fee}</div>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
