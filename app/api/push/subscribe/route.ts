import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAuthedUserId } from '@/lib/auth'

const SubscribeSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const json = await req.json()
    const parsed = SubscribeSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
    }

    const userId = await getAuthedUserId()
    const {
      endpoint,
      keys: { p256dh, auth },
    } = parsed.data

    await db.pushSubscription.upsert({
      where: {
        endpoint,
      },
      update: {
        userId,
        p256dh,
        auth,
      },
      create: {
        userId,
        endpoint,
        p256dh,
        auth,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }
}

