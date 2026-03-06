/* eslint-disable react/jsx-no-bind */
'use client'

import { useEffect, useRef, useState } from 'react'

const EMOJIS = ['⚽', '🏆', '🔥', '🎯', '💪', '👏', '😤', '🤩', '😱', '🏟️', '🥅', '🟨', '🟥', '❤️', '💚'] as const

export interface PostToolbarProps {
  variant?: 'inline' | 'modal'
  maxChars: number
  charCount: number
  canPost: boolean
  onPost: () => void

  imageCount?: number
  onPickImages?: () => void

  onInsertHashtag?: () => void
  onInsertMention?: () => void

  pollOn?: boolean
  onTogglePoll?: () => void

  onInsertEmoji?: (emoji: string) => void
  onHotTake?: (text: string) => void
}

export function PostToolbar({
  variant = 'inline',
  maxChars,
  charCount,
  canPost,
  onPost,
  imageCount = 0,
  onPickImages,
  onInsertHashtag,
  onInsertMention,
  pollOn = false,
  onTogglePoll,
  onInsertEmoji,
  onHotTake,
}: PostToolbarProps) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [hotTakeLoading, setHotTakeLoading] = useState(false)
  const emojiRef = useRef<HTMLDivElement | null>(null)

  const handleHotTake = async () => {
    if (!onHotTake || hotTakeLoading) return
    setHotTakeLoading(true)
    try {
      const res = await fetch('/api/ai/hot-take', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json() as { hotTake: string }
      onHotTake(data.hotTake)
    } finally {
      setHotTakeLoading(false)
    }
  }

  const overWarning = charCount >= 240
  const overDanger = charCount >= 270
  const counterColor = overDanger ? '#ef4444' : overWarning ? '#f59e0b' : '#9ca3af'

  useEffect(() => {
    if (!emojiOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEmojiOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [emojiOpen])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
        <button
          type="button"
          title="Image"
          onClick={() => onPickImages?.()}
          style={{
            background: 'none',
            border: 'none',
            cursor: onPickImages ? 'pointer' : 'default',
            fontSize: '18px',
            padding: '7px 9px',
            borderRadius: '8px',
            position: 'relative',
          }}
        >
          📷
          {imageCount > 0 && (
            <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 10, fontWeight: 700, color: '#16a34a' }}>
              {imageCount}
            </span>
          )}
        </button>

        <button
          type="button"
          title="Hashtag"
          onClick={() => onInsertHashtag?.()}
          style={{
            padding: '4px 10px',
            border: '1px solid #16a34a',
            color: '#16a34a',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            background: 'none',
            cursor: onInsertHashtag ? 'pointer' : 'default',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          #
        </button>

        <button
          type="button"
          title="Mention"
          onClick={() => onInsertMention?.()}
          style={{
            padding: '4px 10px',
            border: '1px solid #16a34a',
            color: '#16a34a',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            background: 'none',
            cursor: onInsertMention ? 'pointer' : 'default',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          @
        </button>

        <div ref={emojiRef} style={{ position: 'relative' }}>
          <button
            type="button"
            title="Emoji"
            onClick={() => setEmojiOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '7px 9px',
              borderRadius: '8px',
            }}
          >
            😄
          </button>
          {emojiOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 200,
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                padding: 10,
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 6,
                minWidth: 180,
              }}
            >
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onInsertEmoji?.(e)
                    setEmojiOpen(false)
                  }}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.08)',
                    background: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                  aria-label={`Insert ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          title="Poll"
          onClick={() => onTogglePoll?.()}
          style={{
            background: 'none',
            border: 'none',
            cursor: onTogglePoll ? 'pointer' : 'default',
            fontSize: '18px',
            padding: '7px 9px',
            borderRadius: '8px',
            color: pollOn ? '#16a34a' : undefined,
          }}
        >
          📊
        </button>

        {onHotTake && (
          <button
            type="button"
            title="AI Hot Take"
            onClick={handleHotTake}
            disabled={hotTakeLoading}
            style={{
              padding: '4px 10px',
              border: '1px solid #16a34a',
              color: '#16a34a',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: 'none',
              cursor: hotTakeLoading ? 'wait' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              opacity: hotTakeLoading ? 0.6 : 1,
            }}
          >
            {hotTakeLoading ? '...' : '🔥 Hot Take'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {variant === 'modal' ? (
          <div style={{ position: 'relative', width: '28px', height: '28px' }}>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle
                cx="14"
                cy="14"
                r="11"
                fill="none"
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="2.5"
              />
              <circle
                cx="14"
                cy="14"
                r="11"
                fill="none"
                stroke={counterColor}
                strokeWidth="2.5"
                strokeDasharray={`${Math.min(charCount / maxChars, 1) * 69.1} 69.1`}
                strokeLinecap="round"
                transform="rotate(-90 14 14)"
                style={{ transition: 'stroke-dasharray 0.1s ease, stroke 0.2s ease' }}
              />
            </svg>
            {charCount > 240 && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 700,
                  color: counterColor,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {maxChars - charCount}
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: counterColor }}>
            {charCount}/{maxChars}
          </span>
        )}
        <button
          type="button"
          onClick={onPost}
          disabled={!canPost}
          style={{
            background: canPost ? '#16a34a' : 'rgba(0,0,0,0.10)',
            color: canPost ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '12px',
            padding: '9px 18px',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            cursor: canPost ? 'pointer' : 'not-allowed',
            boxShadow: canPost ? '0 2px 12px rgba(22,163,74,0.28)' : 'none',
          }}
        >
          Post
        </button>
      </div>
    </div>
  )
}

