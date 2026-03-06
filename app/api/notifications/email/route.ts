import { NextRequest, NextResponse } from 'next/server'
import { sendMatchAlertEmail } from '@/lib/email'

/**
 * POST /api/notifications/email
 * Send a match alert email. Used internally by the cron sync job
 * and from the match page when a user enables notifications.
 *
 * Body: { type: 'match_alert', ...MatchAlertEmailData }
 */
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    type: 'match_alert'
    to: string
    userName: string
    homeTeam: string
    awayTeam: string
    competition: string
    kickoffTime: string
    matchUrl: string
  }

  if (!body.to || !body.type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (body.type === 'match_alert') {
    const result = await sendMatchAlertEmail(body)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 })
}
