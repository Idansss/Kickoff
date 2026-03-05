import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

type Params = {
  params: {
    id: string
  }
}

export async function GET(_req: Request, { params }: Params) {
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid team id' }, { status: 400 })
  }

  const teamId = parsed.data.id

  const items =
    ((await (db as any).newsItem?.findMany?.({
      where: {
        teamId,
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    })) as
      | {
          id: string
          title: string
          source: string | null
          url: string | null
          imageUrl: string | null
          publishedAt: Date
        }[]
      | undefined) ?? []

  return NextResponse.json({
    news: items,
  })
}

