import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

const ParamsSchema = z.object({ id: z.string().min(1) })

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 })
  }

  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const thread = await db.forumThread.findUnique({ where: { id: parsed.data.id } })
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  }

  const existing = await db.forumThreadSubscription.findFirst({
    where: { threadId: parsed.data.id, userId },
  })

  if (existing) {
    // Already subscribed — unsubscribe (toggle)
    await db.forumThreadSubscription.delete({ where: { id: existing.id } })
    return NextResponse.json({ subscribed: false })
  }

  await db.forumThreadSubscription.create({
    data: { threadId: parsed.data.id, userId },
  })

  return NextResponse.json({ subscribed: true }, { status: 201 })
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params
  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 })
  }

  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const existing = await db.forumThreadSubscription.findFirst({
    where: { threadId: parsed.data.id, userId },
  })

  if (!existing) {
    return NextResponse.json({ subscribed: false })
  }

  await db.forumThreadSubscription.delete({ where: { id: existing.id } })
  return NextResponse.json({ subscribed: false })
}
