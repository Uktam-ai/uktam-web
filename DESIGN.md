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

| Role           | Token                        | Value                                 | Source                              |
| -------------- | ---------------------------- | ------------------------------------- | ----------------------------------- |
| Canvas         | `--background`               | `oklch(0.168 0.036 266)`              | one step below the app              |
| Surface        | `--surface`                  | `oklch(0.208 0.04 266)`               | the app's exact canvas `#0F172A`    |
| Deep panel     | `--panel-deep`               | `oklch(0.098 0.024 266)`              | Languages section only              |
| Blue — source  | `--primary` / `--blue-deep`  | `0.62 0.173 259` / `0.37 0.147 265`   | app outbound bubble                 |
| Green — target | `--emerald` / `--green-deep` | `0.773 0.153 163` / `0.432 0.085 168` | app reply bubble                    |
| Violet         | `--purple`                   | `0.491 0.241 293`                     | mandala diamond points; accent only |

**Strategy: Committed.** Blue and green are a _paired semantic system_, not a
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

| Token                | Duration | Use                     |
| -------------------- | -------- | ----------------------- |
| `--duration-instant` | 90ms     | colour, opacity         |
| `--duration-fast`    | 180ms    | hover, focus, underline |
| `--duration-base`    | 420ms    | state change            |
| `--duration-reveal`  | 900ms    | entrance                |
| `--duration-wipe`    | 1100ms   | clip-path mask          |

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

## Share card

`public/brand/og.gif`, with `public/brand/og.png` as its first frame. Both are
built by `bun run og` from `scripts/og-card.html` — a real browser, the real
webfonts, the real tokens — so the card is the page rather than a redraw of it.
Regenerate after changing the hero copy, the language list or the mark.

The card animates because the signature does. A still frame can say the app
translates; only the cycle can show it, and og:image is the one animated surface
a link unfurl has. Support is split — Slack, Discord, Telegram and iMessage play
it, Facebook and LinkedIn flatten it to frame one, X gets the PNG deliberately —
so the sequence starts on a settled card and every platform that refuses to
animate still lands on a finished composition.

The mark sits on a white disc, at both sizes, the same treatment the nav and the
phone mockup use. Unbacked it is a smudge against the canvas, and an unfurl is
often the only place the logo is seen at all.

It also drifts, the way the ambient mandala in the Languages section does — and
three things about that are decided rather than inherited:

- **The rosette turns; the waveform at its centre does not.** The mark is drawn
  twice, the lower copy rotating and an unrotated copy clipped back to the core.
  Petals are ornament and may point anywhere; the waveform is a glyph and has an
  up, and on its side it reads as a broken image rather than a moving one.
- **45° per loop, not the section's 3°/s.** A GIF has to return to its first
  frame, so the turn per loop must be an angle the rosette looks the same at.
  6.4°/s is the closest the loop length allows; matching 3°/s exactly would take
  a 15-second loop and about twice the bytes.
- **The swap eases as a quadratic, not `--ease-out-quint`.** The site's curve is
  three quarters travelled 80ms in, which is right at 60fps and collapses into a
  hard cut at the 12.5fps a GIF delay can hold. The motion is resampled for the
  frame rate rather than transcribed into it.

The headline also sets looser than the page's — 1.24 against 1.06. Kannada
stacks conjuncts below the baseline and Devanagari hangs the `ि` matra past
them; at 1.06 both fall outside the line box and the swap slot's clip takes them
off.

## Bans observed

No gradient text. No uppercase eyebrow above every section. No numbered markers
except the pipeline, which is an actual sequence. No identical card grids. No
glassmorphism. Display tracking never below -0.04em.

## Budgets

JS < 150kB gz, CSS < 30kB gz, LCP < 2.5s, CLS < 0.1.
