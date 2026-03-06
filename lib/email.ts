/**
 * Email sending via Resend (https://resend.com).
 * Requires RESEND_API_KEY env var.
 * From address requires a verified domain — update RESEND_FROM below.
 */

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM ?? 'KICKOFF <noreply@kickoff.football>'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null
  if (!resend) resend = new Resend(RESEND_API_KEY)
  return resend
}

export interface MatchAlertEmailData {
  to: string
  userName: string
  homeTeam: string
  awayTeam: string
  competition: string
  kickoffTime: string
  matchUrl: string
}

export async function sendMatchAlertEmail(data: MatchAlertEmailData) {
  const client = getResend()
  if (!client) {
    console.log('[email] Resend not configured — skipping match alert email')
    return { success: false, reason: 'RESEND_API_KEY not set' }
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#1f1f1d;color:#f5f5f4;margin:0;padding:20px">
  <div style="max-width:480px;margin:0 auto;background:#2a2a28;border-radius:16px;padding:24px;border:1px solid rgba(255,255,255,0.1)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
      <span style="font-size:24px">⚽</span>
      <span style="font-size:20px;font-weight:700;color:#16a34a">KICKOFF</span>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#a3a3a3">Hi ${data.userName},</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700">Match Starting Soon!</h1>
    <div style="background:#1f1f1d;border-radius:12px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.05em">${data.competition}</p>
      <p style="margin:0;font-size:18px;font-weight:700">${data.homeTeam} vs ${data.awayTeam}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#a3a3a3">${data.kickoffTime}</p>
    </div>
    <a href="${data.matchUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
      Watch Live on KICKOFF
    </a>
    <p style="margin:20px 0 0;font-size:11px;color:#737373">
      You're receiving this because you follow these teams on KICKOFF.
    </p>
  </div>
</body>
</html>`

  try {
    const result = await client.emails.send({
      from: FROM,
      to: data.to,
      subject: `${data.homeTeam} vs ${data.awayTeam} starts soon! ⚽`,
      html,
    })
    return { success: true, id: result.data?.id }
  } catch (err) {
    console.error('[email] Failed to send match alert:', err)
    return { success: false, error: String(err) }
  }
}

export interface GoalAlertEmailData {
  to: string
  userName: string
  scorer: string
  team: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  minute: number
  matchUrl: string
}

export async function sendGoalAlertEmail(data: GoalAlertEmailData) {
  const client = getResend()
  if (!client) return { success: false, reason: 'RESEND_API_KEY not set' }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#1f1f1d;color:#f5f5f4;margin:0;padding:20px">
  <div style="max-width:480px;margin:0 auto;background:#2a2a28;border-radius:16px;padding:24px;border:1px solid rgba(255,255,255,0.1)">
    <div style="font-size:32px;margin-bottom:12px">⚽ GOAL!</div>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">${data.scorer} scores for ${data.team}!</h1>
    <p style="margin:0 0 16px;font-size:24px;font-weight:800;color:#16a34a">${data.homeTeam} ${data.homeScore}–${data.awayScore} ${data.awayTeam}</p>
    <p style="margin:0 0 16px;font-size:14px;color:#a3a3a3">${data.minute}' · Click to see the full match</p>
    <a href="${data.matchUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
      Open Match
    </a>
  </div>
</body>
</html>`

  try {
    const result = await client.emails.send({
      from: FROM,
      to: data.to,
      subject: `GOAL! ${data.scorer} (${data.minute}') — ${data.homeTeam} ${data.homeScore}-${data.awayScore} ${data.awayTeam}`,
      html,
    })
    return { success: true, id: result.data?.id }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
