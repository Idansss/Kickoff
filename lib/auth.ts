import { db } from './db'

export async function getAuthedUserId(): Promise<string> {
  // TODO: Wire this to your real auth/session logic.
  // For now, return the first seeded user so follow/notification flows can be exercised.
  const user = await db.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (!user) {
    throw new Error('No demo user found. Seed the database first.')
  }

  return user.id
}

