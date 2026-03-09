'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClubIdentity } from '@/components/common/ClubIdentity'

interface PlayerCareerTabProps {
  playerId: string
}

interface TransferRow {
  id: string
  date: string | null
  type: string
  fee: string | null
  fromTeam: { id: string; name: string; badgeUrl?: string | null } | null
  toTeam: { id: string; name: string; badgeUrl?: string | null } | null
}

interface PlayerResponse {
  player: {
    id: string
    name: string
    transfers?: TransferRow[]
  }
}

export function PlayerCareerTab({ playerId }: PlayerCareerTabProps) {
  const [transfers, setTransfers] = useState<TransferRow[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/football/players/${playerId}`)
        if (!res.ok) return
        const data = (await res.json()) as PlayerResponse
        if (!cancelled) {
          setTransfers(data.player.transfers ?? [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [playerId])

  if (loading && !transfers) {
    return (
      <section className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        Loading career history…
      </section>
    )
  }

  if (!transfers || transfers.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        No transfer history is available for this player yet.
      </section>
    )
  }

  return (
    <section className="rounded-xl border bg-card p-4 text-xs">
      <h2 className="mb-3 text-sm font-semibold">Transfers &amp; career history</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-[11px]">
          <thead className="border-b text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pr-3 text-left">Season / Date</th>
              <th className="py-2 px-3 text-left">From</th>
              <th className="py-2 px-3 text-left">To</th>
              <th className="py-2 px-3 text-left">Type</th>
              <th className="py-2 px-3 text-right">Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transfers.map((t) => {
              const date = t.date ? new Date(t.date) : null
              const seasonLabel =
                date && !Number.isNaN(date.getTime())
                  ? `${date.getFullYear() - 1}/${String(date.getFullYear()).slice(-2)}`
                  : '—'

              return (
                <tr key={t.id} className="align-middle">
                  <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{seasonLabel}</span>
                      {date && (
                        <span className="text-[10px]">
                          {date.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {t.fromTeam ? (
                      <Link href={`/club/${t.fromTeam.id}`} className="inline-flex items-center gap-1.5">
                        <ClubIdentity
                          name={t.fromTeam.name}
                          badgeUrl={t.fromTeam.badgeUrl}
                          size="xs"
                          textClassName="text-[11px]"
                        />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {t.toTeam ? (
                      <Link href={`/club/${t.toTeam.id}`} className="inline-flex items-center gap-1.5">
                        <ClubIdentity
                          name={t.toTeam.name}
                          badgeUrl={t.toTeam.badgeUrl}
                          size="xs"
                          textClassName="text-[11px]"
                        />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3 capitalize text-muted-foreground">{t.type.toLowerCase()}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">
                    {t.fee && t.fee.trim().length > 0 ? t.fee : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

