import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reveal";

/**
 * Lenis inertia scrolling. Anchor links are routed through Lenis so the
 * eased feel is consistent with wheel/trackpad scrolling.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let lenis: {
      raf: (t: number) => void;
      scrollTo: (t: unknown, o?: unknown) => void;
      destroy: () => void;
    } | null = null;
    let cancelled = false;

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!anchor || !lenis) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    };

    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      lenis = new Lenis({
        duration: 1.15,
        lerp: 0.09,
        wheelMultiplier: 1,
        smoothWheel: true,
      }) as never;
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      document.addEventListener("click", onClick);
      document.documentElement.classList.add("lenis-active");
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      document.documentElement.classList.remove("lenis-active");
      lenis?.destroy();
    };
  }, [reduced]);

  return null;
}
