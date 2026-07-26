# Uktam.ai — Design System

Source of truth for values: `src/styles.css` (CSS custom properties) and
`src/lib/motion.ts` (JS-side motion constants). This document explains the
reasoning; those files hold the numbers.

## Theme

Dark. Not by reflex — the scene forces it: someone checking whether an app will
work on a train with no signal, on a phone, often at night. The app itself is
dark. A light site would misrepresent the thing it is selling.

## Color

Sampled from the Android app and the logo, not invented.

| Role | Token | Value | Source |
|---|---|---|---|
| Canvas | `--background` | `oklch(0.168 0.036 266)` | one step below the app |
| Surface | `--surface` | `oklch(0.208 0.04 266)` | the app's exact canvas `#0F172A` |
| Deep panel | `--panel-deep` | `oklch(0.098 0.024 266)` | Languages section only |
| Blue — source | `--primary` / `--blue-deep` | `0.62 0.173 259` / `0.37 0.147 265` | app outbound bubble |
| Green — target | `--emerald` / `--green-deep` | `0.773 0.153 163` / `0.432 0.085 168` | app reply bubble |
| Violet | `--purple` | `0.491 0.241 293` | mandala diamond points; accent only |

**Strategy: Committed.** Blue and green are a *paired semantic system*, not a
palette. The app encodes translation direction as colour — your turn is blue,
the reply is green — so the site does too. Both the logo (blue petals, green
petals, teal core) and the app agree on this independently.

Rule: colour means language. Nothing else gets tinted for decoration.

## Typography

- **Satoshi** (Fontshare) — display 900, body 400/500. One family in strong
  weight contrast rather than a timid display/body pair.
- **IBM Plex Mono** — data only: latency figures, language codes, stack rows.
  Kept despite being a reflex-reject default because the values it sets are
  genuinely machine output, and it was already the project's committed face.
- **Noto Sans Devanagari / Kannada / Tamil / Telugu** — glyph-subset to the
  exact strings rendered. Satoshi has no Indic coverage, so these sit behind it
  in one stack and the browser falls through per codepoint.

All self-hosted in `public/fonts`. No third-party font requests. Regenerate with
`bun run fonts` after changing any Indic copy.

Display: `clamp(2.25rem, 1rem + 5.4vw, 5.25rem)`, line-height 1.06,
letter-spacing -0.04em. Indic text resets to line-height 1.45 and zero tracking —
matras and descenders collide at display tracking.

## Motion

Two speeds, and the split is the whole idea:

| Token | Duration | Use |
|---|---|---|
| `--duration-instant` | 90ms | colour, opacity |
| `--duration-fast` | 180ms | hover, focus, underline |
| `--duration-base` | 420ms | state change |
| `--duration-reveal` | 900ms | entrance |
| `--duration-wipe` | 1100ms | clip-path mask |

**No hover or focus transition may exceed 220ms.** Entrances are slow; feedback
is close to instant. Easing: expo-out for entrances, quart-in-out for wipes,
snap for micro-feedback. No bounce.

Infrastructure: one shared rAF ticker (`lib/ticker.ts`), one pooled
IntersectionObserver (`lib/observer.ts`), one pointermove listener
(`lib/pointer.ts`). Nothing calls `setState` on a per-frame path.

Reveal styles are scoped to a `.js` class set before first paint, so content is
never gated behind a transition that a headless renderer or a background tab
will not fire.

## Signature

**The living headline.** The two script words cycle through real translation
pairs while the caption names the current direction. Each swap slot is an
`inline-grid` with every script stacked in one cell, so it is permanently as
wide as its widest member — measured CLS is 0.0000.

## Bans observed

No gradient text. No uppercase eyebrow above every section. No numbered markers
except the pipeline, which is an actual sequence. No identical card grids. No
glassmorphism. Display tracking never below -0.04em.

## Budgets

JS < 150kB gz, CSS < 30kB gz, LCP < 2.5s, CLS < 0.1.
