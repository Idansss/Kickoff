function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const HASHTAG_MENTION_STYLE = 'color: #16a34a; font-weight: 600;'

/**
 * Convert plain text to HTML with #hashtags and @mentions wrapped in styled spans.
 */
export function toRichHtml(plainText: string): string {
  if (!plainText) return ''
  const parts: string[] = []
  const re = /(#\w+)|(@[\w]+)/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(plainText)) !== null) {
    if (m.index > lastIndex) {
      parts.push(escapeHtml(plainText.slice(lastIndex, m.index)))
    }
    const span = `<span style="${HASHTAG_MENTION_STYLE}">${escapeHtml(m[0])}</span>`
    parts.push(span)
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < plainText.length) {
    parts.push(escapeHtml(plainText.slice(lastIndex)))
  }
  return parts.join('').replace(/\n/g, '<br>')
}
