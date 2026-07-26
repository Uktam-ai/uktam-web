/**
 * Motion tokens.
 *
 * The values here are mirrored as CSS custom properties in `styles.css` — keep
 * the two in sync. This module is the source of truth; CSS consumes the same
 * numbers so JS-driven and CSS-driven motion never drift apart.
 *
 * The governing idea is a two-speed system: entrances are slow and deliberate,
 * feedback is close to instant. Animating a hover at the same speed as a
 * section reveal is what makes an interface feel mushy rather than considered.
 */

/** Durations in milliseconds. */
export const DURATION = {
  /** Colour and opacity feedback. Should read as immediate. */
  instant: 90,
  /** Hover and focus transforms, underline draws. */
  fast: 180,
  /** Deliberate state changes — open/close, tab switches. */
  base: 420,
  /** Entrance of a block of content. */
  reveal: 900,
  /** Clip-path mask wipes. */
  wipe: 1100,
  /** Ambient loops — drifting light, waveforms. */
  ambient: 2400,
} as const;

/**
 * No hover or focus transition may exceed this. Anything slower stops reading
 * as a response to the pointer and starts reading as lag.
 */
export const HOVER_MAX_MS = 220;

/** CSS timing functions. */
export const EASE = {
  /** Entrances. Fast start, long settle. */
  expoOut: "cubic-bezier(0.19, 1, 0.22, 1)",
  /** Transforms that need slightly less overshoot than expo. */
  quintOut: "cubic-bezier(0.23, 1, 0.32, 1)",
  /** Mask wipes — slow in, slow out, fast through the middle. */
  quartInOut: "cubic-bezier(0.86, 0, 0.07, 1)",
  /** Micro-feedback. Nearly linear, just enough curve to avoid feeling robotic. */
  snap: "cubic-bezier(0.215, 0.61, 0.355, 1)",
} as const;

/** anime.js equivalents of the curves above, for JS-driven timelines. */
export const ANIME_EASE = {
  expoOut: "out(4)",
  quintOut: "out(3)",
  quartInOut: "inOut(4)",
  snap: "out(2)",
} as const;

/** Stagger steps in milliseconds. */
export const STAGGER = {
  /** Between lines of a heading. */
  line: 60,
  /** Between characters of the hero headline. */
  char: 22,
  /** Between sibling cards in a grid. */
  card: 90,
} as const;

/**
 * SSR-safe reduced-motion check. Returns `false` on the server so the markup
 * rendered there is the same one the client hydrates.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
