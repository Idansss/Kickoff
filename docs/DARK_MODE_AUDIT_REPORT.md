# Dark Mode Color Audit Report

**Date:** 2025-03-06  
**Scope:** Next.js App Router + Tailwind codebase — hard-coded colors and theme-breaking classes.

---

## Summary

Issues are grouped by **file path** → **component/location** → **offending class/style** → **why it breaks dark mode**.

---

## 1. Dropdowns / popovers (light-only background)

| File | Component / Location | Offending class/style | Why it breaks dark mode |
|------|----------------------|------------------------|--------------------------|
| `app/feed/page.tsx` | Composer hashtag/mention suggestions dropdown | `border-black/[0.08] bg-white/92` | Dropdown is always light; in dark mode it flashes white and doesn’t match theme. |
| `app/settings/page.tsx` | Favorite team dropdown | `border-black/[0.08] bg-white/92` + `dark:bg-[#111111]/95 dark:border-white/[0.08]` | Relies on raw dark overrides instead of tokens; hover uses `hover:bg-black/[0.04] dark:hover:bg-white/[0.06]`. |
| `components/shared/NotificationDrawer.tsx` | Drawer panel | `bg-white dark:bg-[#111111]`, `border-[#f0f0f0] dark:border-[#1f1f1f]` | Hard-coded light/dark colors instead of `bg-popover` / `border-border`. |

---

## 2. Inline styles (raw hex/rgba, no theme)

| File | Component / Location | Offending class/style | Why it breaks dark mode |
|------|----------------------|------------------------|--------------------------|
| `components/NewComponents.jsx` | Composer poll inputs | `background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(0,0,0,0.1)'` | Inputs stay light; in dark mode they don’t match background. |
| `components/NewComponents.jsx` | Composer tag pills (inactive) | `background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(0,0,0,0.1)'` | Same as above. |
| `components/NewComponents.jsx` | Remove image buttons (overlay) | `background: 'rgba(0,0,0,0.6)', color: 'white'` | Overlay is always dark; acceptable for overlay but not token-based. |
| `components/feed/FeedPostCard.tsx` | Lightbox overlay | `backgroundColor: 'rgba(0,0,0,0.9)'` | Overlay; can stay or use token. |

---

## 3. Tailwind classes (theme-breaking)

| File | Component / Location | Offending class/style | Why it breaks dark mode |
|------|----------------------|------------------------|--------------------------|
| `components/football/match/PitchFormation.tsx` | Player rating badge (yellow) | `bg-yellow-500 text-black` | `text-black` is not token-based; in some themes a token for “text on yellow” is preferable. |
| `app/settings/page.tsx` | Switch thumb | `bg-white` | Thumb is always white; should use `bg-background` or a token so it respects theme if needed. |
| `app/profile/page.tsx` | Avatar placeholder (no image) | `text-white bg-muted` | In light mode `--muted` is `#ffffff`, so white text is invisible. |
| `app/profile/page.tsx` | Edit modal overlay | `bg-white/20` | Overlay; can stay or use `bg-background/20`. |

---

## 4. Intentional / low priority

- **Green/red accent classes** (e.g. `bg-green-600 text-white`, `text-green-600`, `text-red-500`): Used for primary actions, success, errors, live indicators. Left as-is unless a design system token exists.
- **Avatar/channel colors** (`backgroundColor: avatarColor`): User-defined colors; no change.
- **Email templates** (`lib/email.ts`): Static HTML emails; not part of app theme.
- **kickoff/page.jsx**: Legacy/demo page; hex colors for branding/data; optional to refactor later.

---

## 5. Fixes applied (semantic tokens)

- Replace dropdown backgrounds with `bg-popover` and borders with `border-border`.
- Replace NotificationDrawer panel with `bg-popover` and `border-border`.
- Replace composer poll inputs and tag pills with token-based styles (e.g. `var(--background)`, `var(--border)`) or Tailwind `bg-muted` / `border-border`.
- Replace overlay buttons with token-based overlay where appropriate.
- PitchFormation yellow badge: use `text-gray-900` for consistent dark text on yellow.
- Profile avatar placeholder: use `text-muted-foreground` (or ensure contrast on `bg-muted`) so initials are visible in light mode.
- Settings switch thumb: use `bg-background`; team dropdown and hover: use `bg-muted` / `hover:bg-muted`.

---

## 6. New shared utilities (if any)

- **None added.** Existing theme variables in `globals.css` (`--popover`, `--border`, `--muted`, `--background`, `--foreground`, `--card`, etc.) and Tailwind semantic classes (`.bg-popover`, `.border-border`, `.text-muted-foreground`, `.bg-muted`, `.bg-background`, `.text-foreground`, `.text-background`) were used. No changes to `globals.css` or `tailwind.config.ts` were required.

---

## 7. Fixes applied (summary)

| File | Change |
|------|--------|
| `app/feed/page.tsx` | Composer suggestions dropdown: `border-black/[0.08] bg-white/92` → `border-border bg-popover/95` |
| `app/settings/page.tsx` | Switch thumb: `bg-white` → `bg-background`; team dropdown: token-based `border-border bg-popover/95`, hover: `hover:bg-muted` |
| `components/shared/NotificationDrawer.tsx` | Panel: `bg-white dark:bg-[#111111]` → `bg-popover`; borders: `border-[#f0f0f0]` / `border-[#1f1f1f]` and `border-[#f5f5f5]` / `border-[#1a1a1a]` → `border-border`; hover: `hover:bg-muted`; timestamp/label: `text-[#9ca3af]` → `text-muted-foreground` |
| `components/NewComponents.jsx` | Poll inputs: inline `rgba` → Tailwind `bg-muted border border-border text-foreground placeholder:text-muted-foreground`; tag pills inactive: `rgba` → `var(--border)`, `var(--muted)` |
| `components/football/match/PitchFormation.tsx` | Rating badge (yellow): `text-black` → `text-gray-900` |
| `app/profile/page.tsx` | Avatar container: `text-white` → `text-muted-foreground` (visible on `bg-muted` in light mode); cover close button: `bg-black/60 text-white` → `bg-foreground/60 text-background`; edit avatar overlay: `bg-black/50`, `bg-white/20`, `text-white` → `bg-foreground/50`, `bg-background/20`, `text-foreground` |

---

## 8. Lint and build

- **`npm run build`**: Completed successfully (Next.js 16.1.6).
- **`npm run lint`**: Pre-existing ESLint errors remain (unused vars, `any` types, missing rule definitions); none introduced by these color-only edits.
