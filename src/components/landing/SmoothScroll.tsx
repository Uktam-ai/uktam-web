import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { onTick } from "@/lib/ticker";

/** Breathing room between the bar and whatever the anchor landed on. */
const NAV_CLEARANCE = 8;

/** The fixed nav's rendered height, plus clearance. Falls back to the token's intent. */
function navOffset(): number {
  const nav = document.querySelector("header");
  const height = nav?.getBoundingClientRect().height ?? 64;
  return height + NAV_CLEARANCE;
}

type LenisInstance = {
  raf: (time: number) => void;
  scrollTo: (target: unknown, options?: unknown) => void;
  destroy: () => void;
};

/**
 * Lenis inertia scrolling, driven from the shared ticker rather than its own
 * rAF loop. Anchor links are routed through Lenis so jumping to a section feels
 * the same as scrolling to it.
 *
 * Disabled for touch (native momentum is already good, and hijacking it makes
 * scrolling feel worse) and for reduced-motion.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let lenis: LenisInstance | null = null;
    let stopTicker: (() => void) | null = null;
    let cancelled = false;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!anchor || !lenis) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      // Measured rather than hardcoded, so this cannot drift from the nav's
      // actual height the way a literal 72 could. `scroll-padding-top` in
      // styles.css does the same job for every path that is not Lenis.
      lenis.scrollTo(target, { offset: -navOffset(), duration: 1.4 });
    };

    void (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      lenis = new Lenis({
        duration: 1.15,
        lerp: 0.09,
        wheelMultiplier: 1,
        smoothWheel: true,
      }) as unknown as LenisInstance;

      stopTicker = onTick((time) => lenis?.raf(time));
      document.addEventListener("click", onClick);
      document.documentElement.classList.add("lenis-active");
    })();

    return () => {
      cancelled = true;
      stopTicker?.();
      document.removeEventListener("click", onClick);
      document.documentElement.classList.remove("lenis-active");
      lenis?.destroy();
    };
  }, [reduced]);

  return null;
}
