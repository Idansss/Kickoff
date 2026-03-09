/**
 * Shared scoring logic for the Market Value Quiz.
 * Score is based on how close the guess was as a percentage of actual value.
 */
export function calcScore(actualValueEur: number, deltaEur: number): number {
  if (actualValueEur <= 0) return 0
  const pct = Math.abs(deltaEur) / actualValueEur
  if (pct <= 0.05) return 100
  if (pct <= 0.10) return 75
  if (pct <= 0.20) return 50
  if (pct <= 0.40) return 25
  return 0
}

export function formatValueEur(eur: number): string {
  if (eur >= 1_000_000_000) return `€${(eur / 1_000_000_000).toFixed(1)}bn`
  if (eur >= 1_000_000) return `€${(eur / 1_000_000).toFixed(1)}m`
  if (eur >= 1_000) return `€${(eur / 1_000).toFixed(0)}k`
  return `€${eur}`
}

export function scoreLabel(score: number): string {
  if (score === 100) return 'Perfect!'
  if (score >= 75) return 'Great!'
  if (score >= 50) return 'Not bad'
  if (score >= 25) return 'Close-ish'
  return 'Way off'
}
