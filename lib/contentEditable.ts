/**
 * Get the character offset of the cursor/collapse position within a contentEditable
 * relative to the plain text content (innerText).
 */
export function getCursorOffset(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0
  const range = sel.getRangeAt(0)
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(el)
  preCaretRange.setEnd(range.endContainer, range.endOffset)
  const text = el.innerText || ''
  const offset = preCaretRange.toString().length
  return Math.min(offset, text.length)
}

/**
 * Set the cursor/collapse position in a contentEditable to the given character offset
 * (relative to plain text content).
 */
export function setCursorOffset(el: HTMLElement, offset: number): void {
  const sel = window.getSelection()
  if (!sel) return
  const text = el.innerText || ''
  const safeOffset = Math.max(0, Math.min(offset, text.length))
  let charCount = 0
  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || '').length
      if (charCount + len >= safeOffset) {
        const range = document.createRange()
        range.setStart(node, safeOffset - charCount)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        return true
      }
      charCount += len
      return false
    }
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'BR') {
      if (charCount >= safeOffset) {
        const range = document.createRange()
        range.setStartBefore(node)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        return true
      }
      charCount += 1
      return false
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      if (walk(node.childNodes[i])) return true
    }
    return false
  }
  walk(el)
}
