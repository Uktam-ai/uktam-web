# Plan: Uktam.ai — Lovable detox + incredibles.dev-grade motion & design pass

**Source**: free-form brief (`/plan`)
**Complexity**: Large (est. 14–20h)
**Constraint**: modify in place. Keep TanStack Start setup, file-based routing, `src/components/landing/*` component set, `data.ts` content, `src/components/ui/*` (shadcn), error-handling infra.

---

## 1. What I found

### Stack
TanStack Start 1.170 + React 19 + Vite 8 + Tailwind v4 (CSS-first `@theme inline`) + anime.js v4.5 + Lenis 1.3. Single route `/`. 78 source files; **~2,500 lines of real code**, of which ~1,200 is the landing page and 60 files are untouched shadcn UI primitives (only `utils.ts` is actually imported — the rest is dead weight but harmless).

`node_modules` is not installed. `bun` is available.

### What the benchmark actually does
I pulled `incredibles.dev`'s HTML and CSS. It is a **Nuxt** app using **Lenis + Motion One**, self-hosted fonts, and a WebGL fluid canvas. The transferable signal is its **motion grammar**, not its look (they're light-mode with a hot pink accent):

| Signal | incredibles.dev | uktam-web today |
|---|---|---|
| Primary reveal primitive | `clip-path` wipes (`inset()`), 0.8–1.1s, `cubic-bezier(.86,0,.07,1)`, with a counter-transform on inner content | `opacity` + `translateY` + **`filter: blur(6px)`** |
| Hover / micro-feedback | **0.07s – 0.2s** | **0.5s – 0.7s** |
| Display type | `line-height: .86`, `letter-spacing: -.05em`, up to `8.5rem` | `line-height: 1.03`, `-0.02em`, caps at `4.1rem` |
| Body weight | 300 | 400 |
| Fonts | 3 self-hosted from origin | 2 third-party CDNs, 9 files, render-blocking |
| Cursor | 8px accent dot | 34px ring + label chip + squash physics |
| Scroll | scrubbed / pinned sections | trigger-once IntersectionObserver only |

**The single biggest gap is the two-speed rule.** Premium sites make big reveals *slow* (0.8–2s) and micro-feedback *instant* (<0.2s). This codebase runs everything at 0.5–1.05s, which is exactly what reads as "smooth but mushy."

### Concrete defects found

**Performance — `setState` inside rAF/scroll loops (re-renders at 60fps):**
- `hooks/use-scroll-fx.ts:117` — `useScrollVelocity` calls `setVelocity` every frame, forever. Drives 2 `<Marquee>` instances → constant reconciliation.
- `landing/Nav.tsx:17` — `setScrolled` + `setProgress` on every raw scroll event, and reads `scrollHeight` each time (forced layout). Progress bar animates **`width`**, a layout property.
- `landing/Cursor.tsx:88` — `readTarget()` runs on *every* `pointermove`: `closest()` + `getBoundingClientRect()` + 2 `setState`.
- `landing/PhoneMockup.tsx:30` — one React render **per character** typed (~40 renders per line, looping forever).

**Performance — uncoordinated loops & observers:**
- 6+ independent `requestAnimationFrame` loops (Aurora, Cursor, Lenis, velocity, one per `useMagnetic`).
- One `IntersectionObserver` **per `<Reveal>`** — ~30 observers on the page.
- `Aurora.tsx` — 4 orbs at `blur(130px)` sized 26–32rem. Very expensive to composite; no `contain`.
- `PhoneMockup.tsx:62` — 26 separate anime.js instances for waveform bars that a single CSS keyframe could do.
- `useTilt`/`useMagnetic` attach their own `pointermove` listener per instance (4 pillar cards).

**Correctness / robustness:**
- SSR ships every `.reveal` at `opacity: 0`. If JS fails or is slow, the page is blank. Should be reveal-by-default, hidden only after JS confirms support.
- `styles.css:127` sets `scroll-behavior: smooth` while Lenis also drives scroll — patched by a class, but fragile.
- `landing/Magnetic.tsx` is **dead code**, never imported.
- `Pipeline` — the self-declared centerpiece — is **hover-only**. On touch and on scroll it does nothing.

**Design:**
- Five consecutive sections share the identical shape: `border-t` + `py-24 sm:py-32` + centered `SectionHeading` + card grid. No scale contrast, no editorial variation.
- Gradient text on nearly every heading highlight → the gradient stops meaning anything.
- The Indic scripts — the most distinctive material this product owns — appear only in a marquee and four small tiles, rendered in whatever **system fallback font** the visitor happens to have. This is the biggest missed opportunity on the page.
- Uniform radius (`2xl`/`3xl`) and one card style (`card-ring`) everywhere.

### Lovable traces (all reconstructible — I verified by unpacking the package)
`AGENTS.md`, `README.md`, `package.json` (name + dep), `bunfig.toml`, `vite.config.ts`, `src/lib/lovable-error-reporting.ts`, `src/routes/__root.tsx:13`, `.lovable/`, `bun.lock`.

`@lovable.dev/vite-tanstack-config` supplies, in this exact order: `tailwindcss()` → `tsConfigPaths({projects:["./tsconfig.json"]})` → `tanstackStart({importProtection, server:{entry:"server"}})` → `nitro({defaultPreset:"cloudflare-module"})` (build only) → `viteReact()`; plus `resolve.alias {"@": cwd/src}`, `dedupe: [react, react-dom, react/jsx-runtime, react/jsx-dev-runtime, @tanstack/react-query, @tanstack/query-core]`, `optimizeDeps.include`, and `server: {host:"::", port:8080}`. **Every peer dep is already in `package.json`.** Replacement is a ~35-line `vite.config.ts`.

---

## 2. Design direction

Keeping the brand (dark ink canvas, blue→indigo→purple, emerald = offline) but spending it very differently.

**Signature: the Living Headline.** The hero `<h1>` reads

> Speak **हिन्दी**. Hear **தமிழ்**. No internet.

…where the two script words **swap live** through all four languages on a timed loop — each swap a mask-wipe with the mono caption beneath updating (`hi → ta`, `kn → te`, …), while a hairline **emerald rule runs unbroken beneath the whole headline**. That rule is the thesis: nothing crossed the boundary. On scroll it becomes the Pipeline connector, so hero and centerpiece are structurally the same object.

This uses the product's own material instead of a gradient blob, and it demonstrates the product in the first 400ms instead of describing it.

**Typography — the highest-value change.**
- Cut Manrope. **Satoshi for display *and* body** (900 display / 500 body), **IBM Plex Mono** for data and labels. Two families, matches the rules, kills one entire CDN.
- **Self-host** both as woff2 in `public/fonts/` with `@font-face` + `preload` on the two critical weights. No third-party font requests at runtime.
- **Add real Indic faces** — Noto Sans Devanagari / Kannada / Tamil / Telugu, glyph-subset to only the characters the page actually renders (~2–4kb each), self-hosted. Right now these scripts render in an arbitrary system fallback; this is what makes them look designed rather than accidental.
- Reset the scale: display `clamp(3rem, 1rem + 8vw, 7.5rem)` at `line-height: .88` / `letter-spacing: -.045em`. Body drops to weight 400 at `1.3` leading.

**Palette — demote the gradient.** Gradient survives on exactly two things: the hero signature and the primary CTA. Everywhere else uses flat `--primary` or `--foreground`. Emerald becomes a strict system color that marks offline/local signals and nothing else. Deepen the canvas (current `oklch(.128 .03 271)` is a muddy blue-purple; going nearer true ink makes the accents read as emission).

**The one risk — an inverted section.** The **Languages** section flips to a bone/paper background with near-black type. The Indic scripts become large typographic specimens rather than glowing tiles. This breaks the flat-dark-page-with-gradients pattern with real structural contrast, and it's the moment the page stops looking like every other AI product site. *This is decision #1 for you below — it's easy to keep dark instead.*

**Structure — break the uniform rhythm.** Section shapes become: full-bleed hero → thin marquee rule → asymmetric 2-col Why → **pinned/scrubbed** Pipeline → inverted full-bleed Languages → dense editorial Stack table → full-bleed CTA. Different widths, different vertical rhythm, different card treatments.

---

## 3. Motion system

New `src/lib/motion.ts` as the single source of truth.

**Duration scale — the two-speed rule:**

| Token | ms | Use |
|---|---|---|
| `instant` | 90 | color, opacity feedback |
| `fast` | 180 | hover transform, underline draw |
| `base` | 420 | state changes, accordion |
| `reveal` | 900 | entrance |
| `wipe` | 1100 | clip-path mask |
| `ambient` | 2000+ | loops |

> **Hard rule: no hover/focus transition exceeds 220ms.** Applied mechanically across every component. This alone is most of the perceived-quality jump.

**Easing:** `expoOut (.19,1,.22,1)` entrances · `quintOut (.23,1,.32,1)` transforms · `quartInOut (.86,0,.07,1)` mask wipes · `snap (.215,.61,.355,1)` micro-feedback.

**Reveal primitives** (replacing the one blur-fade):
1. **`mask-wipe`** — `clip-path: inset(0 0 100% 0)` → `inset(0)` over 1.1s `quartInOut`, with inner `translateY(12%) scale(1.06)` → identity as a counter-move. For the phone, cards, images.
2. **`line-rise`** — split by **line**, each in an `overflow: hidden` box, `translateY(110%)` → 0, 60ms stagger, `expoOut`. Replaces the current *per-character* split on section headings (40+ DOM nodes and 40 concurrent transitions per heading, and a dated effect). Character-split is kept **only** for the hero H1, where it earns its cost.
3. **`fade-rise`** — 24px / 700ms for supporting copy. **`filter: blur()` is removed** — it's expensive to composite and it's a tell.

**Scroll engine:** adopt **anime.js v4 `onScroll`** (verified against current docs — it supports `sync: <0..1>` scrubbing, `enter`/`leave` thresholds, and sync modes; it is a ScrollTrigger equivalent and it's already a dependency). Used for:
- **Pipeline** becomes `position: sticky` and **scrub-driven** — the connector line draws via `stroke-dashoffset`, each stage lights as the line reaches it. Works on touch. This converts the dead centerpiece into the best moment on the page.
- Hero parallax and the aurora's scroll response.

One-shot reveals move to a **single shared IntersectionObserver** (`src/lib/observer.ts`), from ~30 down to 1.

**Page-load orchestration.** Currently everything just IntersectionObserves in independently. Replace with one deliberate ~1.4s timeline: nav rule draws → eyebrow → headline lines rise (staggered) → CTA → phone mask-wipe. An orchestrated moment, not scattered effects.

**Micro-interactions:** magnetic pull on primary CTAs only (finally using the existing `Magnetic.tsx`); button labels swap on hover via mask-slide; nav underline `scaleX` drops 500ms → 180ms; cursor shrinks to a small accent dot + faint ring, label chip removed.

---

## 4. Performance plan

- **Zero `setState` in any scroll or rAF loop.** All continuous values write to CSS custom properties through refs.
- **One shared rAF ticker** (`src/lib/ticker.ts`) — Lenis, cursor, aurora, magnetic all subscribe. 6 loops → 1.
- **One shared IntersectionObserver.**
- Aurora: 4 orbs → 2, `blur` capped at 90px, `contain: paint`, sized in `px` not `rem`.
- Waveform: 26 anime.js instances → 1 CSS keyframe with per-bar `animation-delay`.
- Nav progress bar: `width` → `transform: scaleX()`.
- Fonts: self-hosted + subset + `preload` on 2 critical faces; **zero** third-party font requests.
- `content-visibility: auto` on below-fold sections.
- **Reveal-by-default SSR** — hidden state applied by JS only, so the page is readable without JS.

**Budgets:** JS < 150kb gz · CSS < 30kb · LCP < 2.5s · CLS < 0.1 · INP < 200ms.

---

## 5. Files

| File | Action | Why |
|---|---|---|
| `vite.config.ts` | REWRITE | de-lovable; reconstruct exact plugin chain |
| `package.json` | UPDATE | drop `@lovable.dev/*`, rename to `uktam-web` |
| `bunfig.toml`, `AGENTS.md`, `README.md` | REWRITE | de-lovable |
| `.lovable/` | DELETE | |
| `src/lib/lovable-error-reporting.ts` | → `src/lib/report-error.ts` | neutral replacement |
| `src/routes/__root.tsx` | UPDATE | new import; self-hosted font links; preload |
| `src/lib/motion.ts` | CREATE | easing + duration tokens |
| `src/lib/ticker.ts` | CREATE | shared rAF |
| `src/lib/observer.ts` | CREATE | shared IntersectionObserver |
| `src/styles.css` | REWRITE | tokens, type scale, motion utilities, `@font-face` |
| `public/fonts/*` | CREATE | self-hosted + subset woff2 |
| `src/hooks/use-reveal.ts` | REWRITE | shared observer, SSR-safe default |
| `src/hooks/use-scroll-fx.ts` | REWRITE | CSS-var writes, shared ticker, no `setState` |
| `landing/Reveal.tsx` | REWRITE | 3 primitives; line-split headings |
| `landing/SplitText.tsx` | REWRITE | line + char modes |
| `landing/Hero.tsx` | REWRITE | living headline signature |
| `landing/Pipeline.tsx` | REWRITE | sticky + scroll-scrubbed |
| `landing/Nav.tsx` | REWRITE | rAF, `scaleX`, no per-event layout read |
| `landing/Cursor.tsx` | REWRITE | delegated events, dot-first |
| `landing/Aurora.tsx` | UPDATE | 2 orbs, contained, ticker |
| `landing/PhoneMockup.tsx` | UPDATE | ref-based typing, CSS waveform |
| `landing/Languages.tsx` | REWRITE | inverted section, script specimens |
| `landing/Why.tsx`, `Stack.tsx`, `CallToAction.tsx`, `MarqueeStrip.tsx`, `Marquee.tsx`, `Magnetic.tsx` | UPDATE | rhythm, hover speeds, wire up magnetic |
| `landing/data.ts` | KEEP | content is good |
| `src/components/ui/*` (60 files) | KEEP | untouched |

---

## 6. Phases

| # | Phase | Gate |
|---|---|---|
| 0 | Lovable detox + `bun install` + baseline build | `bun run build` green, `bun run dev` serves |
| 1 | Design system: fonts, tokens, type scale, motion tokens | visual diff on existing components; no layout breaks |
| 2 | Motion core: `motion.ts`, `ticker.ts`, `observer.ts`, `Reveal`, `SplitText`, hooks | zero `setState` in loops (grep-verified); reveals work with JS disabled |
| 3 | Hero signature — living headline + load orchestration | LCP < 2.5s on throttled 4G |
| 4 | Sections: Pipeline scrub, Languages invert, Why/Stack/CTA rhythm | works on touch; 320→1920 no overflow |
| 5 | Interaction layer: cursor, magnetic, buttons, nav | no hover transition > 220ms (grep-verified) |
| 6 | Verify: Playwright screenshots @ 320/768/1024/1440, a11y, reduced-motion, Lighthouse | budgets met; `bun run lint` clean |

---

## 7. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Removing the lovable vite wrapper breaks the build | Medium | Exact plugin chain already extracted from the published bundle; all peers present. Phase 0 gate is a green build **before** anything else changes. |
| Fontshare/Google woff2 not downloadable in this environment | Medium | Fall back to CDN `<link>` + `preload` + `font-display: swap`. Loses the third-party-free win, keeps everything else. |
| Indic subset fonts miss a glyph → tofu | Low | Subset from the exact strings in `data.ts` + `PhoneMockup`; system fallback declared in the stack. |
| anime.js `onScroll` conflicting with Lenis | Low | Lenis drives native window scroll, so scroll observers read correctly. Verified in Phase 4 on real scroll. |
| Inverted light section clashes with the brand | Medium | **Decision #1 below.** Reversible in one section file. |
| Scope creep across 20 files | Medium | Phase gates; `data.ts` and `ui/*` frozen. |

---

## 8. Two decisions I need from you

1. **Inverted Languages section** (bone background, near-black Indic specimens) — my recommendation, it's the one real risk and the strongest anti-template move. Or keep it dark and lean on scale alone?
2. **Hero restructure** — replace the left-copy/right-phone layout with the full-width Living Headline (phone moves below, revealed on scroll)? This is the largest single rewrite in the plan. Or keep the two-column layout and just upgrade its motion?

---

## 9. Validation

```bash
bun install
bun run lint
bun run build
bun run dev          # manual: 320 / 768 / 1024 / 1440, reduced-motion, keyboard-only
```

## 10. Acceptance

- [ ] Zero occurrences of "lovable" in tracked files
- [ ] `bun run build` and `bun run lint` clean
- [ ] No `setState` inside any rAF or scroll handler
- [ ] No hover/focus transition longer than 220ms
- [ ] Page fully readable with JavaScript disabled
- [ ] `prefers-reduced-motion` honoured on every new animation
- [ ] Pipeline animates on touch devices
- [ ] JS < 150kb gz, CSS < 30kb, LCP < 2.5s, CLS < 0.1
- [ ] No horizontal overflow at 320px
