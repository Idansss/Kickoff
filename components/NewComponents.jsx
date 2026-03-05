'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { getCursorOffset, setCursorOffset } from '@/lib/contentEditable';
import { toRichHtml } from '@/lib/richComposerHtml';
import { useComposerTokens } from '@/hooks/useComposerTokens';
import { HASHTAGS, MENTIONABLE_USERS, MENTIONABLE_CLUBS } from '@/data/composerSuggestions';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { highlightMatch } from '@/lib/highlightMatch';
import { PostToolbar } from '@/components/composer/PostToolbar';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  bg: '#f0f0f3',
  sidebar: '#f7f7f8',
  accent: '#16a34a',
  accentDark: '#15803d',
  text: '#0f0f0f',
  muted: '#6b7280',
  subtle: '#9ca3af',
  danger: '#ef4444',
  glass: 'rgba(255,255,255,0.55)',
  glassElevated: 'rgba(255,255,255,0.72)',
  glassDrop: 'rgba(248,248,250,0.85)',
  border: 'rgba(255,255,255,0.75)',
  borderStrong: 'rgba(255,255,255,0.9)',
  shadowCard: '0 2px 16px rgba(0,0,0,0.06)',
  shadowElevated: '0 8px 40px rgba(0,0,0,0.10)',
  shadowDrop: '0 8px 32px rgba(0,0,0,0.08)',
  glow: '0 0 0 3px rgba(22,163,74,0.15)',
  spring: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
  menu: 'opacity 0.15s ease, transform 0.15s ease',
  smooth: 'all 0.3s ease',
};

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES (injected once)
// ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');

  @keyframes nc-menuIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nc-menuUp {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nc-modalIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes nc-backdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes nc-toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes nc-toastOut {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
  }
  @keyframes nc-tooltipIn {
    from { opacity: 0; transform: translateX(-50%) translateY(3px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes nc-pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.8); }
  }
  @keyframes nc-pillIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes nc-pillOut {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to   { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }

  .nc-postcard:hover .nc-dots-btn { opacity: 1 !important; }
  .nc-trend-row:hover { background: #ffffff !important; }
  .nc-menu-item:hover { background: rgba(0,0,0,0.04) !important; }
  .nc-fixture-row:hover { background: #ffffff !important; }

  .dark .nc-trend-row:hover { background: #1a1a1a !important; }
  .dark .nc-fixture-row:hover { background: #1a1a1a !important; }

  @media (min-width: 1200px) {
    .nc-right-sidebar { display: flex !important; }
  }

  /* Hide scrollbar for trending strip */
  .nc-trend-strip::-webkit-scrollbar { display: none; }
  .nc-trend-strip { scrollbar-width: none; -ms-overflow-style: none; }

  /* Hide scrollbars for right sidebar + inner scroll regions */
  .nc-right-sidebar::-webkit-scrollbar { display: none; }
  .nc-right-sidebar { scrollbar-width: none; -ms-overflow-style: none; }

  .nc-right-scroll::-webkit-scrollbar { display: none; }
  .nc-right-scroll { scrollbar-width: none; -ms-overflow-style: none; }
`;

function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById('nc-global-styles')) return;
    const el = document.createElement('style');
    el.id = 'nc-global-styles';
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);
}

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────
function GlassCard({ children, style, accentLeft, palette }) {
  const cardBg = palette?.cardBg ?? '#111111';
  const cardBorder = palette?.cardBorder ?? '#222222';
  return (
    <div
      className="nc-right-card"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: accentLeft ? `3px solid ${T.accent}` : undefined,
        borderRadius: '14px',
        boxShadow: T.shadowCard,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardSectionHeader({ icon, label, color }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: color ?? '#ffffff',
        marginBottom: '10px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {icon} {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 1 — "Show X New Posts" Bar
// ─────────────────────────────────────────────────────────────
export function NewPostsBar({ onLoad }) {
  useGlobalStyles();
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('hidden'); // hidden | in | visible | out
  const dismissTimer = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  const showBar = useCallback((n) => {
    if (!isMounted.current) return;
    setCount(prev => prev + n);
    setPhase('in');
    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => dismiss(), 8000);
  }, []);

  const dismiss = useCallback(() => {
    if (!isMounted.current) return;
    setPhase('out');
    clearTimeout(dismissTimer.current);
    setTimeout(() => {
      if (isMounted.current) { setPhase('hidden'); setCount(0); }
    }, 350);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => showBar(5), 1500);
    const iv = setInterval(() => showBar(Math.floor(Math.random() * 5) + 1), 15000);
    return () => { clearTimeout(t); clearInterval(iv); clearTimeout(dismissTimer.current); };
  }, [showBar]);

  if (phase === 'hidden') return null;

  return (
    <div
      onClick={() => { onLoad?.(); dismiss(); }}
      style={{
        position: 'fixed',
        top: '72px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'rgba(22,163,74,0.88)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: '999px',
        padding: '10px 20px',
        boxShadow: '0 4px 20px rgba(22,163,74,0.30)',
        cursor: 'pointer',
        color: 'white',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        animation: `${phase === 'out' ? 'nc-pillOut' : 'nc-pillIn'} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 28px rgba(22,163,74,0.40)';
        e.currentTarget.style.filter = 'brightness(1.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,163,74,0.30)';
        e.currentTarget.style.filter = 'none';
      }}
    >
      <span style={{ fontSize: '14px' }}>↑</span>
      Show {count} new post{count !== 1 ? 's' : ''}
    </div>
  );
}

/** Show-new-posts bar wired to external count and onLoad (e.g. feedStore). */
export function ShowNewPostsBar({ count = 0, onLoad }) {
  useGlobalStyles();
  if (count <= 0) return null;
  return (
    <div
      onClick={() => onLoad?.()}
      style={{
        position: 'fixed',
        top: '72px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'rgba(22,163,74,0.88)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: '999px',
        padding: '10px 20px',
        boxShadow: '0 4px 20px rgba(22,163,74,0.30)',
        cursor: 'pointer',
        color: 'white',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        animation: 'nc-pillIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 28px rgba(22,163,74,0.40)';
        e.currentTarget.style.filter = 'brightness(1.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,163,74,0.30)';
        e.currentTarget.style.filter = 'none';
      }}
    >
      <span style={{ fontSize: '14px' }}>↑</span>
      Show {count} new post{count !== 1 ? 's' : ''}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 2 — Three-Dot Post Menu
// ─────────────────────────────────────────────────────────────
export function PostMenu({ handle = 'username', postId = '1', isFollowing: initFollowing = false, onCopyLink, onMute, onBlock, onNotInterested, onFollowToggle, onReport }) {
  useGlobalStyles();
  const [open, setOpen] = useState(false);
  const [following, setFollowing] = useState(initFollowing);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const copyLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/post/${postId}` : `https://kickoff.app/post/${postId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    onCopyLink?.();
    setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
  };

  const MENU = [
    {
      icon: following ? '✓' : '➕',
      label: following ? `Following @${handle}` : `Follow @${handle}`,
      action: () => { setFollowing(f => !f); onFollowToggle?.(); setTimeout(() => setOpen(false), 300); },
    },
    { sep: true },
    { icon: '🔇', label: `Mute @${handle}`, action: () => { onMute?.(); setOpen(false); } },
    { icon: '🚫', label: `Block @${handle}`, action: () => { onBlock?.(); setOpen(false); }, danger: true },
    { icon: '🏳️', label: 'Report post', action: () => { onReport?.(); setOpen(false); }, danger: true },
    { sep: true },
    { icon: '🔗', label: copied ? '✓ Copied!' : 'Copy link', action: copyLink },
    { icon: '😶', label: 'Not interested in this', action: () => { onNotInterested?.(); setOpen(false); } },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        className="nc-dots-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '5px 7px',
          borderRadius: '8px',
          color: T.muted,
          fontSize: '18px',
          lineHeight: 1,
          transition: T.spring,
          letterSpacing: '1px',
          opacity: 0,
          transition: 'opacity 0.15s ease, background 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.07)'; e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        title="More options"
      >
        •••
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: '224px',
            background: T.glassDrop,
            backdropFilter: 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            border: `1px solid ${T.borderStrong}`,
            borderRadius: '14px',
            boxShadow: T.shadowDrop,
            zIndex: 100,
            overflow: 'hidden',
            animation: 'nc-menuIn 0.15s ease forwards',
            padding: '4px 0',
          }}
          onClick={e => e.stopPropagation()}
        >
          {MENU.map((item, i) => {
            if (item.sep) return (
              <div key={`sep-${i}`} style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />
            );
            return (
              <button
                key={i}
                className="nc-menu-item"
                onClick={item.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '11px 16px',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  color: item.danger ? T.danger : T.text,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                }}
              >
                <span style={{ width: '20px', textAlign: 'center', fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 3 — Right Sidebar
// ─────────────────────────────────────────────────────────────
const LIVE_MATCHES = [
  { id: 1, home: 'Man City', away: 'Arsenal',    hs: 2, as: 1, min: 67, viewers: '45.2k' },
  { id: 2, home: 'Barcelona', away: 'Real Madrid', hs: 1, as: 1, min: 34, viewers: '78.9k' },
  { id: 3, home: 'PSG',      away: 'Bayern',      hs: 0, as: 2, min: 82, viewers: '34.2k' },
];
const TRENDING_LIST = [
  { rank: 1, tag: '#UCLFinal',         count: '4,832' },
  { rank: 2, tag: '#Haaland',          count: '3,291' },
  { rank: 3, tag: '#TransferDeadline', count: '2,847' },
  { rank: 4, tag: '#ElClasico',        count: '6,124' },
  { rank: 5, tag: '#PremierLeague',    count: '1,983' },
  { rank: 6, tag: '#Bellingham',       count: '2,456' },
];
const FIXTURES = [
  { id: 'fx1', comp: 'Premier League', home: 'Liverpool',  away: 'Chelsea',    time: '15:00' },
  { id: 'fx2', comp: 'La Liga',        home: 'Sevilla',    away: 'Atlético',   time: '17:30' },
  { id: 'fx3', comp: 'Serie A',        home: 'Juventus',   away: 'Napoli',     time: '19:45' },
  { id: 'fx4', comp: 'Bundesliga',     home: 'Dortmund',   away: 'Leverkusen', time: '20:30' },
];

export function RightSidebar({
  liveMatches: liveMatchesProp,
  trendingList: trendingListProp,
  fixtures: fixturesProp,
  onSearchSubmit,
  onClickLiveHeader,
  onClickLiveMatch,
  onClickTrendingHeader,
  onClickTrendingTag,
  onClickShowMoreTrending,
  onClickFixturesHeader,
  onClickFixture,
}) {
  useGlobalStyles();
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isLight = resolvedTheme !== 'dark';

  const palette = {
    sidebarBg: isLight ? '#ffffff' : '#000000',
    sidebarBorder: isLight ? '#e5e7eb' : '#1a1a1a',
    cardBg: isLight ? '#ffffff' : '#111111',
    cardBorder: isLight ? '#e5e7eb' : '#222222',
    header: isLight ? '#000000' : '#ffffff',
    primary: isLight ? '#000000' : '#f2f2f2',
    secondary: isLight ? '#000000' : '#555555',
    rank: isLight ? '#000000' : '#333333',
    searchBg: isLight ? '#ffffff' : '#111111',
    searchBorder: isLight ? '#e5e7eb' : '#222222',
    searchText: isLight ? '#000000' : '#f2f2f2',
    rowHover: isLight ? '#ffffff' : '#1a1a1a',
    separator: isLight ? '#e5e7eb' : '#1a1a1a',
  };

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const suggestions = useSearchSuggestions(query);
  const hasQuery = query.trim().length >= 1;
  const showDropdown = focused && hasQuery;

  const liveMatches = liveMatchesProp ?? LIVE_MATCHES;
  const trendingList = trendingListProp ?? TRENDING_LIST.map((t, i) => ({ ...t, rank: i + 1 }));
  const fixtures = fixturesProp ?? FIXTURES;

  const flatItems = useMemo(() => {
    if (!hasQuery) return [];
    const items = [];
    suggestions.players.slice(0, 3).forEach((p) => items.push({ type: 'player', data: p }));
    suggestions.clubs.slice(0, 3).forEach((c) => items.push({ type: 'club', data: c }));
    suggestions.hashtags.slice(0, 3).forEach((h) => items.push({ type: 'hashtag', data: h }));
    if (hasQuery) items.push({ type: 'searchAll', data: query.trim() });
    return items;
  }, [hasQuery, suggestions.players, suggestions.clubs, suggestions.hashtags, query]);

  useEffect(() => {
    if (!showDropdown) return;
    if (highlightedIndex >= flatItems.length) {
      setHighlightedIndex(flatItems.length > 0 ? flatItems.length - 1 : 0);
    }
  }, [showDropdown, flatItems.length, highlightedIndex]);

  useEffect(() => {
    if (!showDropdown) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFocused(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) => (i < flatItems.length - 1 ? i + 1 : i));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!flatItems.length) {
          if (hasQuery && typeof onSearchSubmit === 'function') {
            onSearchSubmit(query.trim());
          }
          setFocused(false);
          return;
        }
        const item = flatItems[Math.max(0, Math.min(highlightedIndex, flatItems.length - 1))];
        if (item && typeof onSearchSubmit === 'function') {
          const q =
            item.type === 'player'
              ? item.data.name
              : item.type === 'club'
              ? item.data.name
              : item.type === 'hashtag'
              ? item.data.replace(/^#/, '')
              : item.data;
          onSearchSubmit(String(q));
        }
        setFocused(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showDropdown, flatItems, highlightedIndex, hasQuery, query, onSearchSubmit]);

  useEffect(() => {
    if (!showDropdown) return;
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showDropdown]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && typeof onSearchSubmit === 'function') {
      onSearchSubmit(query.trim());
    }
  };

  return (
    <aside
      className="nc-right-sidebar"
      ref={containerRef}
      style={{
        width: '280px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 0 12px 12px',
        fontFamily: 'Inter, sans-serif',
        background: palette.sidebarBg,
        borderLeft: `1px solid ${palette.sidebarBorder}`,
        overflowY: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* ── Search ── */}
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: palette.secondary,
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          🔍
        </span>
        <input
          className="nc-right-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => setFocused(true)}
          placeholder="Search KICKOFF..."
          style={{
            width: '100%',
            background: palette.searchBg,
            border: focused ? '1px solid #16a34a' : `1px solid ${palette.searchBorder}`,
            borderRadius: '12px',
            padding: '10px 12px 10px 38px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            color: palette.searchText,
            outline: 'none',
            boxShadow: focused
              ? '0 0 0 2px rgba(22,163,74,0.15)'
              : isLight ? '0 1px 2px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.4)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        />

        {showDropdown && (
          <div
            className="nc-right-search-menu"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              marginTop: 6,
              borderRadius: 12,
              border: `1px solid ${palette.sidebarBorder}`,
              background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(17,17,17,0.98)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              overflow: 'hidden',
              zIndex: 40,
            }}
          >
            <div
              style={{
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {(!suggestions.hasResults && !suggestions.isLoading) && (
                <div
                  style={{
                    padding: '12px 14px',
                    fontSize: 13,
                    color: palette.secondary,
                  }}
                >
                  ⚽ No quick results for '{query.trim()}'
                </div>
              )}

              {suggestions.players.slice(0, 3).map((p, idx) => {
                const globalIndex = flatItems.findIndex(
                  (x) => x.type === 'player' && x.data.id === p.id
                );
                const isHighlighted = globalIndex === highlightedIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 12px',
                      gap: 8,
                      background: isHighlighted ? 'rgba(22,163,74,0.08)' : 'transparent',
                      border: 'none',
                      borderLeft: isHighlighted ? '3px solid #16a34a' : '3px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                    onClick={() => {
                      if (typeof onSearchSubmit === 'function') {
                        onSearchSubmit(p.name);
                      }
                      setFocused(false);
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#16a34a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: palette.primary,
                        }}
                      >
                        {highlightMatch(p.name, query)}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: palette.secondary,
                        }}
                      >
                        {p.club}
                      </div>
                    </div>
                  </button>
                );
              })}

              {suggestions.clubs.slice(0, 3).map((c) => {
                const globalIndex = flatItems.findIndex(
                  (x) => x.type === 'club' && x.data.id === c.id
                );
                const isHighlighted = globalIndex === highlightedIndex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 12px',
                      gap: 8,
                      background: isHighlighted ? 'rgba(22,163,74,0.08)' : 'transparent',
                      border: 'none',
                      borderLeft: isHighlighted ? '3px solid #16a34a' : '3px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                    onClick={() => {
                      if (typeof onSearchSubmit === 'function') {
                        onSearchSubmit(c.name);
                      }
                      setFocused(false);
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: c.color,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: palette.primary,
                        }}
                      >
                        {highlightMatch(c.name, query)}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: palette.secondary,
                        }}
                      >
                        {c.league}
                      </div>
                    </div>
                  </button>
                );
              })}

              {suggestions.hashtags.slice(0, 3).map((tag) => {
                const globalIndex = flatItems.findIndex(
                  (x) => x.type === 'hashtag' && x.data === tag
                );
                const isHighlighted = globalIndex === highlightedIndex;
                return (
                  <button
                    key={tag}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 12px',
                      gap: 8,
                      background: isHighlighted ? 'rgba(22,163,74,0.08)' : 'transparent',
                      border: 'none',
                      borderLeft: isHighlighted ? '3px solid #16a34a' : '3px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                    onClick={() => {
                      const clean = tag.replace(/^#/, '');
                      if (typeof onSearchSubmit === 'function') {
                        onSearchSubmit(clean);
                      }
                      setFocused(false);
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#16a34a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      #
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#16a34a',
                        }}
                      >
                        {highlightMatch(tag, query)}
                      </div>
                    </div>
                  </button>
                );
              })}

              {hasQuery && (
                <div
                  style={{
                    borderTop: `1px solid ${palette.separator}`,
                  }}
                >
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '9px 12px',
                      gap: 6,
                      border: 'none',
                      background:
                        highlightedIndex === flatItems.length - 1
                          ? 'rgba(22,163,74,0.08)'
                          : 'transparent',
                      borderLeft:
                        highlightedIndex === flatItems.length - 1
                          ? '3px solid #16a34a'
                          : '3px solid transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#16a34a',
                      fontWeight: 600,
                      textAlign: 'left',
                    }}
                    onMouseEnter={() => setHighlightedIndex(flatItems.length - 1)}
                    onClick={() => {
                      if (typeof onSearchSubmit === 'function') {
                        onSearchSubmit(query.trim());
                      }
                      setFocused(false);
                    }}
                  >
                    🔍 Search all results for '{query.trim()}' →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Live Now ── */}
      <GlassCard accentLeft palette={palette}>
        <div style={{ padding: '12px' }}>
          <div
            onClick={typeof onClickLiveHeader === 'function' ? () => onClickLiveHeader() : undefined}
            style={{
              cursor: onClickLiveHeader ? 'pointer' : 'default',
            }}
          >
            <CardSectionHeader icon="⚽" label="LIVE NOW" color={palette.header} />
          </div>
          <div
            className="nc-right-scroll"
            style={{
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {liveMatches.slice(0, 3).map((m, i) => (
              <div key={m.id ?? i}>
                {i > 0 && (
                  <div
                    style={{
                      height: '1px',
                      background: palette.separator,
                      margin: '10px 0',
                    }}
                  />
                )}
                <div
                onClick={
                  typeof onClickLiveMatch === 'function' && m.id
                    ? () => onClickLiveMatch(m.id)
                    : undefined
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: onClickLiveMatch ? 'pointer' : 'default',
                  padding: '8px 10px',
                  margin: '0 -10px',
                  borderRadius: '8px',
                  transition: 'background 0.15s ease, transform 0.05s ease',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                  e.currentTarget.style.transform = 'scale(0.99)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: palette.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.home}{' '}
                    <span style={{ color: palette.primary }}>
                      {m.hs}–{m.as}
                    </span>{' '}
                    {m.away}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: palette.secondary,
                      marginTop: '2px',
                    }}
                  >
                    {m.viewers ?? '—'} watching
                  </div>
                </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#ef4444', display: 'inline-block',
                    animation: 'nc-pulseDot 1.4s ease-in-out infinite',
                  }} />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#ef4444',
                    }}
                  >
                    {m.min}'
                  </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: `1px solid ${palette.separator}`,
            }}
          >
            <a
              href="/matches"
              style={{
                fontSize: '12px',
                color: '#16a34a',
                textDecoration: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View all live matches →
            </a>
          </div>
        </div>
      </GlassCard>

      {/* ── Trending ── */}
      <GlassCard palette={palette}>
        <div style={{ padding: '12px' }}>
          <div
            onClick={
              typeof onClickTrendingHeader === 'function'
                ? () => onClickTrendingHeader()
                : undefined
            }
            style={{
              cursor: onClickTrendingHeader ? 'pointer' : 'default',
            }}
          >
            <CardSectionHeader icon="🔥" label="TRENDING" color={palette.header} />
          </div>
          <div
            className="nc-right-scroll"
            style={{
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {trendingList.slice(0, 6).map((t, i) => (
              <div
                key={t.rank ?? i}
                className="nc-trend-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  margin: '0 -10px',
                  borderRadius: '8px',
                  cursor: onClickTrendingTag ? 'pointer' : 'default',
                  transition: 'background 0.15s ease, transform 0.05s ease',
                  borderBottom: `1px solid ${palette.separator}`,
                }}
                onClick={
                  typeof onClickTrendingTag === 'function'
                    ? () => onClickTrendingTag(t.tag)
                    : undefined
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                  const arrow = e.currentTarget.querySelector('.nc-trend-arrow');
                  if (arrow) {
                    arrow.style.color = palette.rank;
                  }
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                  e.currentTarget.style.transform = 'scale(0.99)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                  e.currentTarget.style.transform = 'scale(1)';
                  const arrow = e.currentTarget.querySelector('.nc-trend-arrow');
                  if (arrow) {
                    arrow.style.color = '#16a34a';
                  }
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: palette.rank,
                    width: '18px',
                    textAlign: 'right',
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                >
                  #{t.rank ?? i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: palette.primary,
                    }}
                  >
                    {t.tag}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: palette.secondary,
                      marginTop: '1px',
                    }}
                  >
                    {typeof t.count === 'number' ? t.count : t.count} posts
                  </div>
                </div>
                <span
                  className="nc-trend-arrow"
                  style={{
                    color: palette.rank,
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                >
                  ›
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: `1px solid ${palette.separator}`,
            }}
          >
            <button
              type="button"
              onClick={
                typeof onClickShowMoreTrending === 'function'
                  ? () => onClickShowMoreTrending()
                  : undefined
              }
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#16a34a',
                fontWeight: 600,
                padding: 0,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Show more
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ── Today's Fixtures ── */}
      <GlassCard palette={palette}>
        <div style={{ padding: '12px' }}>
          <div
            onClick={
              typeof onClickFixturesHeader === 'function'
                ? () => onClickFixturesHeader()
                : undefined
            }
            style={{
              cursor: onClickFixturesHeader ? 'pointer' : 'default',
            }}
          >
            <CardSectionHeader icon="📅" label="TODAY'S FIXTURES" color={palette.header} />
          </div>
          <div
            className="nc-right-scroll"
            style={{
              maxHeight: 250,
              overflowY: 'auto',
            }}
          >
            {fixtures.slice(0, 4).map((f, i) => (
              <div
                key={f.id ?? i}
                className="nc-fixture-row"
                style={{
                  padding: '8px 10px',
                  cursor: onClickFixture ? 'pointer' : 'default',
                  borderRadius: '8px',
                  transition: 'background 0.15s ease, transform 0.05s ease',
                  borderBottom: `1px solid ${palette.separator}`,
                }}
                onClick={
                  typeof onClickFixture === 'function' && f.id
                    ? () => onClickFixture(f.id)
                    : undefined
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                  e.currentTarget.style.transform = 'scale(0.99)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.background = palette.rowHover;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: palette.secondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {f.comp}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '3px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: palette.primary,
                    }}
                  >
                    {f.home}{' '}
                    <span style={{ color: palette.secondary, fontSize: '11px' }}>vs</span>{' '}
                    {f.away}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#16a34a',
                      fontFamily: 'Sora, sans-serif',
                    }}
                  >
                    {f.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 4 — Floating POST Button
// ─────────────────────────────────────────────────────────────
export function FloatingPostButton({ onClick }) {
  useGlobalStyles();
  const [down, setDown] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseEnter={e => {
        e.currentTarget.style.background = T.accentDark;
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,163,74,0.38)';
        e.currentTarget.style.transform = down ? 'scale(0.98)' : 'scale(1.01)';
      }}
      onMouseLeave={e => {
        setDown(false);
        e.currentTarget.style.background = T.accent;
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(22,163,74,0.22)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={{
        width: 'calc(100% - 32px)',
        margin: '0 16px',
        background: T.accent,
        border: 'none',
        borderRadius: '12px',
        padding: '13px',
        fontSize: '15px',
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        color: 'white',
        cursor: 'pointer',
        transform: down ? 'scale(0.98)' : 'scale(1)',
        boxShadow: '0 2px 12px rgba(22,163,74,0.22)',
        transition: T.spring,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ fontSize: '13px' }}>✦</span>
      Post
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 5 — Profile Card (Sidebar Bottom)
// ─────────────────────────────────────────────────────────────
export function ProfileCard({ user = { name: 'Alex Turner', handle: 'alexturner', initials: 'AT' }, onViewProfile, onEditProfile, onSignOut }) {
  useGlobalStyles();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const fn = (e) => { if (!ref.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [menuOpen]);

  const ITEMS = [
    { icon: '👤', label: 'View Profile', action: () => { setMenuOpen(false); onViewProfile?.(); } },
    { icon: '✏️', label: 'Edit Profile', action: () => { setMenuOpen(false); onEditProfile?.(); } },
    { icon: '🚪', label: 'Sign Out', danger: true, action: () => { setMenuOpen(false); onSignOut?.(); } },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', margin: '8px', marginTop: 'auto' }}>
      {menuOpen && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: T.glassDrop,
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: `1px solid ${T.borderStrong}`,
          borderRadius: '14px',
          boxShadow: T.shadowDrop,
          overflow: 'hidden',
          animation: 'nc-menuUp 0.15s ease forwards',
          padding: '4px 0',
          zIndex: 50,
        }}>
          {ITEMS.map((item, i) => (
            <button
              key={i}
              className="nc-menu-item"
              onClick={item.action ?? (() => setMenuOpen(false))}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '11px 16px',
                fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
                color: item.danger ? T.danger : T.text,
                background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.12s ease',
              }}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? T.glassElevated : T.glass,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${T.border}`,
          borderRadius: '12px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'background 0.2s ease',
          boxShadow: T.shadowCard,
        }}
      >
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '13px', fontWeight: 700,
          flexShrink: 0, fontFamily: 'Inter, sans-serif',
        }}>
          {user.initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: T.text, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '12px', color: T.muted, fontFamily: 'Inter, sans-serif' }}>
            @{user.handle}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '5px 7px', borderRadius: '6px',
            color: T.muted, fontSize: '16px', letterSpacing: '1px',
            lineHeight: 1, transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          •••
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 6 — Post Composer Modal (rich: images, #/@ suggestions)
// ─────────────────────────────────────────────────────────────
const COMPOSER_TAGS = ['General', 'PL', 'UCL', 'Transfer', 'Stats', 'Serie A', 'La Liga'];
const MAX_CHARS = 280;
const MAX_IMAGES = 4;

function highlightTag(tag, query) {
  if (!query) return tag;
  const i = tag.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return tag;
  const before = tag.slice(0, i);
  const match = tag.slice(i, i + query.length);
  const after = tag.slice(i + query.length);
  return (
    <>
      {before}
      <span style={{ color: '#15803d', fontWeight: 700 }}>{match}</span>
      {after}
    </>
  );
}

export function PostComposerModal({ isOpen, onClose, onPost }) {
  useGlobalStyles();
  const [plainText, setPlainText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [tags, setTags] = useState(['General']);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollA, setPollA] = useState('');
  const [pollB, setPollB] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const editableRef = useRef(null);
  const fileInputRef = useRef(null);
  const cursorOffsetRef = useRef(0);

  const tokens = useComposerTokens(plainText, cursorPosition);
  const { activeToken, hashtagSuggestions, mentionSuggestions, showSuggestions, highlightedIndex, setHighlightedIndex, resetHighlight, suggestionCount } = tokens;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => editableRef.current?.focus(), 150);
    } else {
      setPlainText('');
      setTags(['General']);
      imageUrls.forEach((u) => URL.revokeObjectURL(u));
      setImages([]);
      setImageUrls([]);
      setShowPoll(false);
      setPollA('');
      setPollB('');
    }
  }, [isOpen]);

  useEffect(() => {
    imageUrls.forEach((u) => URL.revokeObjectURL(u));
    const urls = images.map((f) => URL.createObjectURL(f));
    setImageUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  useEffect(() => {
    if (!editableRef.current || !isOpen) return;
    const el = editableRef.current;
    const offset = cursorOffsetRef.current;
    el.innerHTML = toRichHtml(plainText);
    setCursorOffset(el, offset);
  }, [plainText, isOpen]);

  useEffect(() => {
    if (showSuggestions) setSuggestionsOpen(true);
  }, [showSuggestions]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => {
      if (e.key === 'Escape') {
        if (showSuggestions && suggestionsOpen) { setSuggestionsOpen(false); resetHighlight(); }
        else onClose?.();
      }
      if (showSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab')) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(highlightedIndex + 1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(highlightedIndex - 1); }
        if ((e.key === 'Enter' || e.key === 'Tab') && suggestionCount > 0) {
          e.preventDefault();
          if (activeToken.type === 'hashtag' && hashtagSuggestions[highlightedIndex]) {
            const tag = hashtagSuggestions[highlightedIndex].tag + ' ';
            const before = plainText.slice(0, activeToken.start);
            const after = plainText.slice(activeToken.end);
            setPlainText(before + tag + after);
            setCursorPosition(before.length + tag.length);
            cursorOffsetRef.current = before.length + tag.length;
          }
          if (activeToken.type === 'mention' && mentionSuggestions[highlightedIndex]) {
            const s = mentionSuggestions[highlightedIndex];
            const insert = s.type === 'user' ? '@' + s.data.handle + ' ' : '@' + s.data.name + ' ';
            const before = plainText.slice(0, activeToken.start);
            const after = plainText.slice(activeToken.end);
            setPlainText(before + insert + after);
            setCursorPosition(before.length + insert.length);
            cursorOffsetRef.current = before.length + insert.length;
          }
          resetHighlight();
        }
      }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isOpen, onClose, showSuggestions, suggestionsOpen, highlightedIndex, suggestionCount, activeToken, hashtagSuggestions, mentionSuggestions, plainText, resetHighlight, setHighlightedIndex]);

  if (!isOpen) return null;

  const len = plainText.length;
  const overWarning = len >= 240;
  const overDanger = len >= 270;
  const counterColor = overDanger ? T.danger : overWarning ? '#f59e0b' : T.subtle;
  const canPost = len > 0 && len <= MAX_CHARS;
  const imageCount = images.length;
  const atMaxImages = imageCount >= MAX_IMAGES;

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const replaceToken = (replacement) => {
    const before = plainText.slice(0, activeToken.start);
    const after = plainText.slice(activeToken.end);
    const next = before + replacement + ' ';
    setPlainText(next + after);
    setCursorPosition(next.length);
    cursorOffsetRef.current = next.length;
    setSuggestionsOpen(false);
    resetHighlight();
  };

  const submit = () => {
    if (!canPost) return;
    const poll = showPoll && pollA && pollB ? {
      question: 'Poll',
      options: [
        { id: 'opt1', text: pollA.trim(), votes: 0 },
        { id: 'opt2', text: pollB.trim(), votes: 0 },
      ],
      totalVotes: 0,
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    } : undefined;
    onPost?.({ text: plainText.trim(), tags, images: imageUrls, poll });
    onClose?.();
  };

  const onEditableInput = () => {
    const el = editableRef.current;
    if (!el) return;
    cursorOffsetRef.current = getCursorOffset(el);
    const text = el.innerText || '';
    setPlainText(text);
    setCursorPosition(cursorOffsetRef.current);
  };

  const insertAtCursor = (str) => {
    const pos = cursorOffsetRef.current;
    const before = plainText.slice(0, pos);
    const after = plainText.slice(pos);
    const next = before + str + after;
    setPlainText(next);
    setCursorPosition(before.length + str.length);
    cursorOffsetRef.current = before.length + str.length;
    setTimeout(() => editableRef.current && (editableRef.current.innerHTML = toRichHtml(next)) && setCursorOffset(editableRef.current, before.length + str.length), 0);
  };

  const onFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, MAX_IMAGES));
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    setImages(prev => [...prev, ...files].slice(0, MAX_IMAGES));
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, j) => j !== i));
  };

  const composerAreaStyle = {
    flex: 1,
    border: isDragOver ? '2px dashed #16a34a' : 'none',
    outline: 'none',
    background: isDragOver ? 'rgba(22,163,74,0.04)' : 'transparent',
    fontSize: '16px',
    fontFamily: 'Inter, sans-serif',
    color: T.text,
    resize: 'none',
    minHeight: '110px',
    lineHeight: 1.55,
    borderRadius: '12px',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.32)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'nc-backdropIn 0.2s ease forwards',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '560px',
          maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: `1px solid ${T.borderStrong}`,
          borderRadius: '20px',
          boxShadow: T.shadowElevated,
          animation: 'nc-modalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.text, fontFamily: 'Sora, sans-serif' }}>
            Create Post
          </span>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.07)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', color: T.muted, transition: T.spring,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.14)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: T.accent, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '14px', fontWeight: 700,
            }}>
              AT
            </div>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <div
                ref={editableRef}
                contentEditable
                suppressContentEditableWarning
                onInput={onEditableInput}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                data-placeholder="What's happening in football? 🏟️"
                style={composerAreaStyle}
              />
              {!plainText && (
                <div style={{ position: 'absolute', left: 0, top: 0, right: 0, fontSize: '16px', fontFamily: 'Inter, sans-serif', color: T.subtle, pointerEvents: 'none', lineHeight: 1.55 }} contentEditable={false}>
                  What&apos;s happening in football? 🏟️
                </div>
              )}

              {showSuggestions && suggestionsOpen && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, zIndex: 50,
                  background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.10)', maxHeight: 280, overflowY: 'auto',
                }}>
                  {activeToken.type === 'hashtag' && hashtagSuggestions.map((h, i) => (
                    <button
                      key={h.tag}
                      type="button"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                        background: i === highlightedIndex ? 'rgba(22,163,74,0.08)' : 'transparent',
                        border: 'none', borderLeft: i === highlightedIndex ? '3px solid #16a34a' : '3px solid transparent',
                        cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
                      }}
                      onClick={() => replaceToken(h.tag)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: T.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>#</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{highlightTag(h.tag, activeToken.query)}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{h.count} posts</div>
                      </div>
                    </button>
                  ))}
                  {activeToken.type === 'mention' && mentionSuggestions.map((s, i) => (
                    <button
                      key={s.type === 'user' ? s.data.id : s.data.id}
                      type="button"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                        background: i === highlightedIndex ? 'rgba(22,163,74,0.08)' : 'transparent',
                        border: 'none', borderLeft: i === highlightedIndex ? '3px solid #16a34a' : '3px solid transparent',
                        cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
                      }}
                      onClick={() => replaceToken(s.type === 'user' ? '@' + s.data.handle : '@' + s.data.name)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                    >
                      {s.type === 'user' ? (
                        <>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.data.avatarColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                            {s.data.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.data.name}</div>
                            <div style={{ fontSize: 12, color: T.muted }}>@{s.data.handle}</div>
                          </div>
                          {s.data.verified && <span style={{ color: '#3b82f6', marginLeft: 'auto' }}>✓</span>}
                        </>
                      ) : (
                        <>
                          <div style={{ width: 28, height: 28, borderRadius: 4, background: s.data.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>🛡️</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.data.name}</div>
                            <div style={{ fontSize: 12, color: T.muted, fontStyle: 'italic' }}>Official Club</div>
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {imageUrls.length > 0 && (
            <div style={{ marginTop: 12, paddingLeft: 52, display: 'grid', gap: 6,
              gridTemplateColumns: imageUrls.length === 1 ? '1fr' : imageUrls.length === 2 ? '1fr 1fr' : '1fr 1fr',
              gridTemplateRows: imageUrls.length === 3 ? '180px 180px' : imageUrls.length === 4 ? '180px 180px' : 'auto',
            }}>
              {imageUrls.length === 1 && (
                <div style={{ position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden' }}>
                  <img src={imageUrls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  <button type="button" onClick={() => removeImage(0)} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
                </div>
              )}
              {imageUrls.length === 2 && imageUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', height: 180, borderRadius: 12, overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
                </div>
              ))}
              {imageUrls.length === 3 && (
                <>
                  <div style={{ gridColumn: '1 / -1', position: 'relative', height: 180, borderRadius: 12, overflow: 'hidden' }}>
                    <img src={imageUrls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                    <button type="button" onClick={() => removeImage(0)} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} style={{ position: 'relative', height: 180, borderRadius: 12, overflow: 'hidden' }}>
                      <img src={imageUrls[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </>
              )}
              {imageUrls.length === 4 && imageUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', height: 180, borderRadius: 12, overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}

          {showPoll && (
            <div style={{ marginTop: 12, paddingLeft: 52, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={pollA} onChange={e => setPollA(e.target.value)} placeholder="Option A" style={{ width: '100%', background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
              <input value={pollB} onChange={e => setPollB(e.target.value)} placeholder="Option B" style={{ width: '100%', background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
            </div>
          )}

          {/* Tag pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '14px', paddingLeft: '52px' }}>
            {COMPOSER_TAGS.map(tag => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '5px 13px',
                    borderRadius: '999px',
                    border: active ? '1px solid rgba(22,163,74,0.5)' : '1px solid rgba(0,0,0,0.1)',
                    background: active ? 'rgba(22,163,74,0.12)' : 'rgba(255,255,255,0.65)',
                    backdropFilter: active ? 'none' : 'blur(8px)',
                    color: active ? T.accent : T.muted,
                    fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer', transition: T.spring,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}>
          <PostToolbar
            variant="modal"
            maxChars={MAX_CHARS}
            charCount={len}
            canPost={canPost}
            onPost={submit}
            imageCount={imageCount}
            onPickImages={() => !atMaxImages && fileInputRef.current?.click()}
            onInsertHashtag={() => insertAtCursor('#')}
            onInsertMention={() => insertAtCursor('@')}
            onInsertEmoji={(e) => insertAtCursor(e)}
            pollOn={showPoll}
            onTogglePoll={() => setShowPoll(v => !v)}
          />
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onFileChange} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 7 — Repost Toast with Undo (or generic message toast)
// ─────────────────────────────────────────────────────────────
export function RepostToast({ onUndo, onDismiss, message: messageProp, duration: durationProp = 4000 }) {
  useGlobalStyles();
  const [state, setState] = useState('active'); // active | undone | out
  const timer = useRef(null);
  const isGeneric = messageProp != null;
  const message = messageProp ?? '🔁 Reposted';
  const duration = durationProp ?? 4000;

  useEffect(() => {
    timer.current = setTimeout(() => exit(), duration);
    return () => clearTimeout(timer.current);
  }, [duration]);

  const exit = () => {
    setState('out');
    setTimeout(() => onDismiss?.(), 320);
  };

  const undo = () => {
    clearTimeout(timer.current);
    onUndo?.();
    setState('undone');
    setTimeout(() => exit(), 1600);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 300,
      background: 'rgba(15,15,15,0.84)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '999px',
      padding: '12px 20px',
      display: 'flex', alignItems: 'center', gap: '8px',
      whiteSpace: 'nowrap',
      fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
      color: 'white',
      boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
      animation: `${state === 'out' ? 'nc-toastOut' : 'nc-toastIn'} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
    }}>
      {state === 'undone' ? (
        <span>↩ Repost undone</span>
      ) : isGeneric ? (
        <span>{message}</span>
      ) : (
        <>
          <span>{message}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <button
            onClick={undo}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#4ade80', fontSize: '13px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              textDecoration: 'underline', textUnderlineOffset: '2px',
              padding: 0,
            }}
          >
            Undo
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 8 — Post Impression Counter
// ─────────────────────────────────────────────────────────────
function seededRandom(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
}
function fmtCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function ImpressionCounter({ postId = '1', impressionCount: impressionCountProp }) {
  useGlobalStyles();
  const [tip, setTip] = useState(false);
  const count = impressionCountProp != null ? impressionCountProp : Math.floor(seededRandom(postId) * 9400 + 600);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <div
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          color: T.subtle, fontSize: '12px', fontFamily: 'Inter, sans-serif',
          cursor: 'default', userSelect: 'none',
          padding: '4px 6px', borderRadius: '6px',
          transition: 'color 0.15s ease',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor" opacity="0.85" />
          <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor" />
        </svg>
        <span>{fmtCount(count)} views</span>
      </div>

      {tip && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15,15,15,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '5px 10px',
          fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
          color: 'white',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 50,
          animation: 'nc-tooltipIn 0.12s ease forwards',
        }}>
          Post impressions
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid rgba(15,15,15,0.88)',
          }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 9 — Trending Topics Strip
// ─────────────────────────────────────────────────────────────
const STRIP_PILLS = [
  '#UCLFinal', '#Haaland', '#TransferDeadline', '#ElClasico',
  '#PremierLeague', '#Bellingham', '#Vinicius', '#SerieA',
];

export function TrendingStrip({ onFilter, topics: topicsProp }) {
  useGlobalStyles();
  const [active, setActive] = useState(null);
  const pills = Array.isArray(topicsProp) && topicsProp.length > 0 ? topicsProp.map((t) => (t.startsWith('#') ? t : `#${t}`)) : STRIP_PILLS;

  const click = (pill) => {
    const next = active === pill ? null : pill;
    setActive(next);
    onFilter?.(next);
  };

  return (
    <div
      className="nc-trend-strip"
      style={{
        display: 'flex',
        gap: '7px',
        overflowX: 'auto',
        padding: '4px 0 10px',
      }}
    >
      {pills.map(pill => {
        const on = active === pill;
        return (
          <button
            key={pill}
            onClick={() => click(pill)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: '999px',
              border: on ? 'none' : '1px solid rgba(255,255,255,0.8)',
              background: on ? T.accent : 'rgba(255,255,255,0.68)',
              backdropFilter: on ? 'none' : 'blur(12px)',
              WebkitBackdropFilter: on ? 'none' : 'blur(12px)',
              color: on ? 'white' : T.text,
              fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: T.spring,
              whiteSpace: 'nowrap',
              boxShadow: on ? '0 2px 10px rgba(22,163,74,0.28)' : '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {pill}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DEMO LAYOUT — Default Export
// ─────────────────────────────────────────────────────────────
const DEMO_POSTS = [
  { id: 'p1', initials: 'LM', color: '#7c3aed', name: 'Leo Fan',      handle: 'leofan', text: 'What a goal by Haaland tonight! Absolute machine 🔥 #PremierLeague #MCFC',                     likes: 124, reposts: 34, comments: 18 },
  { id: 'p2', initials: 'CR', color: '#0ea5e9', name: 'Ronaldo Fan',  handle: 'crfan',  text: 'That UCL draw was absolutely insane. VAR needs to be sorted out immediately. #UCLFinal',       likes: 89,  reposts: 12, comments: 7  },
  { id: 'p3', initials: 'NJ', color: '#f59e0b', name: 'Neymar Watch', handle: 'njwatch', text: 'Transfer window madness — 3 players signed in 24 hours. This club means business 💪 #TransferDeadline', likes: 347, reposts: 98, comments: 42 },
];

const NAV_ITEMS = [
  { icon: '⚡', label: 'Feed',      href: '/feed' },
  { icon: '⚽', label: 'Matches',   href: '/matches' },
  { icon: '🔍', label: 'Discovery', href: '/discovery' },
  { icon: '💬', label: 'Chat',      href: '/chat' },
  { icon: '🤖', label: 'AI Scout',  href: '/ai' },
  { icon: '👤', label: 'Profile',   href: '/profile' },
];

export default function NewComponentsDemo() {
  useGlobalStyles();
  const [modalOpen, setModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [localPosts, setLocalPosts] = useState(DEMO_POSTS);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [repostedPosts, setRepostedPosts] = useState(new Set());
  const [toastPostId, setToastPostId] = useState(null);

  const handleRepost = (postId) => {
    setRepostedPosts(prev => new Set([...prev, postId]));
    setToastPostId(postId);
    setToastVisible(true);
  };
  const handleUndo = () => {
    setRepostedPosts(prev => { const next = new Set(prev); next.delete(toastPostId); return next; });
  };

  const filteredPosts = activeFilter
    ? localPosts.filter(p => p.text.toLowerCase().includes(activeFilter.replace('#', '').toLowerCase()))
    : localPosts;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Portals */}
      <NewPostsBar onLoad={() => console.log('Loading new posts')} />

      {toastVisible && (
        <RepostToast
          onUndo={handleUndo}
          onDismiss={() => setToastVisible(false)}
        />
      )}

      <PostComposerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onPost={(data) => {
          const newPost = {
            id: `p${Date.now()}`,
            initials: 'AT', color: T.accent,
            name: 'Alex Turner', handle: 'alexturner',
            text: data.text, likes: 0, reposts: 0, comments: 0,
          };
          setLocalPosts(prev => [newPost, ...prev]);
        }}
      />

      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Left Sidebar ── */}
        <aside style={{
          width: '260px',
          flexShrink: 0,
          background: T.sidebar,
          borderRight: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 12px', fontFamily: 'Sora, sans-serif', fontSize: '22px', fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>⚽</span>
            <span>KICKOFF</span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
            {NAV_ITEMS.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px', borderRadius: '10px',
                  fontSize: '15px', fontWeight: 500, color: T.text,
                  textDecoration: 'none', marginBottom: '2px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                <span style={{ fontSize: '18px', width: '22px', textAlign: 'center' }}>{icon}</span>
                {label}
              </a>
            ))}
          </nav>

          {/* Post Button */}
          <div style={{ padding: '12px 0 8px' }}>
            <FloatingPostButton onClick={() => setModalOpen(true)} />
          </div>

          {/* Profile Card */}
          <ProfileCard />
        </aside>

        {/* ── Main Feed ── */}
        <main style={{ flex: 1, maxWidth: '600px', padding: '16px 24px', minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', fontWeight: 700, color: T.text, margin: 0 }}>
              Feed
            </h1>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['For You', 'Following'].map((tab, i) => (
                <button key={tab} style={{
                  padding: '6px 14px', borderRadius: '999px',
                  background: i === 0 ? T.text : 'transparent',
                  color: i === 0 ? 'white' : T.muted,
                  border: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.1)',
                  fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Trending Strip — Component 9 */}
          <TrendingStrip onFilter={setActiveFilter} />

          {activeFilter && (
            <div style={{
              padding: '9px 14px', borderRadius: '12px',
              background: 'rgba(22,163,74,0.09)',
              fontSize: '13px', color: T.accent, fontWeight: 600,
              marginBottom: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Filtering: {activeFilter}</span>
              <button onClick={() => setActiveFilter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, fontWeight: 700, fontSize: '14px', padding: 0 }}>✕</button>
            </div>
          )}

          {/* Post Cards */}
          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: T.muted, fontSize: '14px' }}>
              No posts match {activeFilter}
            </div>
          ) : filteredPosts.map(post => (
            <PostCardDemo
              key={post.id}
              post={post}
              liked={likedPosts.has(post.id)}
              reposted={repostedPosts.has(post.id)}
              onLike={() => setLikedPosts(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })}
              onRepost={() => handleRepost(post.id)}
            />
          ))}
        </main>

        {/* ── Right Sidebar — Component 3 ── */}
        <div className="nc-right-sidebar" style={{ display: 'none' }}>
          <RightSidebar />
        </div>

      </div>
    </div>
  );
}

// Internal post card for the demo
function PostCardDemo({ post, liked, reposted, onLike, onRepost }) {
  const actionStyle = (active, activeColor = T.danger) => ({
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
    color: active ? activeColor : T.muted,
    padding: '5px 8px', borderRadius: '8px',
    transition: 'background 0.15s ease, color 0.15s ease',
  });

  return (
    <div
      className="nc-postcard"
      style={{
        background: T.glass,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${T.border}`,
        borderRadius: '16px',
        boxShadow: T.shadowCard,
        padding: '16px',
        marginBottom: '12px',
        transition: 'box-shadow 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.09)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadowCard; }}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: post.color, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
        }}>
          {post.initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.text }}>{post.name}</span>
              <span style={{ fontSize: '13px', color: T.muted, marginLeft: '6px' }}>@{post.handle}</span>
              <span style={{ fontSize: '12px', color: T.subtle, marginLeft: '8px' }}>· 2h</span>
            </div>
            {/* Component 2: three-dot menu */}
            <PostMenu handle={post.handle} postId={post.id} />
          </div>

          <p style={{ fontSize: '14px', color: T.text, lineHeight: 1.55, margin: 0 }}>
            {post.text}
          </p>

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', marginLeft: '-8px' }}>
            <button
              onClick={onLike}
              style={actionStyle(liked, T.danger)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {liked ? '❤️' : '🤍'} {post.likes + (liked ? 1 : 0)}
            </button>

            <button
              onClick={onRepost}
              style={actionStyle(reposted, T.accent)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {reposted ? '🔁' : '↩️'} {post.reposts + (reposted ? 1 : 0)}
            </button>

            <button
              style={actionStyle(false)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              💬 {post.comments}
            </button>

            <div style={{ marginLeft: 'auto' }}>
              {/* Component 8: impression counter */}
              <ImpressionCounter postId={post.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
