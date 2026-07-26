# Uktam.ai — agent notes

Single-page marketing site for Uktam.ai, an offline on-device Indic
speech-to-speech translator for Android.

## Stack

TanStack Start (SSR) · React 19 · Vite · Tailwind v4 (CSS-first) · anime.js v4 · Lenis.
Package manager is **bun**.

```sh
bun install
bun run dev      # http://localhost:8080
bun run build
bun run lint
```

## Layout

| Path | Purpose |
| --- | --- |
| `src/routes/` | File-based routes. `__root.tsx` is the only shell. |
| `src/components/landing/` | Page sections and motion primitives. |
| `src/components/ui/` | shadcn primitives. Mostly unused — don't extend. |
| `src/hooks/` | Scroll, reveal, and pointer hooks. |
| `src/lib/` | Motion tokens, shared ticker/observer, SSR error plumbing. |
| `src/styles.css` | Design tokens and motion utilities. Single source of truth. |

## Conventions

- **Design tokens live in `src/styles.css`.** No hardcoded colors in components.
- **Motion tokens live in `src/lib/motion.ts`.** Durations and easings come from
  there, not from inline magic numbers.
- **Hover and focus transitions must stay under 220ms.** Entrances are slow,
  feedback is instant.
- **Never call `setState` inside a `requestAnimationFrame` or scroll handler.**
  Write to a CSS custom property through a ref instead.
- Subscribe to the shared ticker (`src/lib/ticker.ts`) and shared
  IntersectionObserver (`src/lib/observer.ts`) rather than creating new ones.
- Every animation respects `prefers-reduced-motion`.
- The page must remain readable with JavaScript disabled — reveal states are
  applied by script, not baked into the server-rendered markup.
