import { useEffect, useRef } from "react";

import { SMOOTHING } from "@/lib/motion";
import { hasFinePointer, pointer, trackPointer } from "@/lib/pointer";
import { damp, onTick } from "@/lib/ticker";

import { usePrefersReducedMotion } from "./use-reveal";

/**
 * Pointer- and scroll-driven effects.
 *
 * None of these hooks hold React state. Every value they produce goes straight
 * to a CSS custom property or a transform on the node, because these update on
 * every frame and routing them through `setState` re-renders the subtree sixty
 * times a second for a purely visual change.
 */

/** 3D tilt plus a pointer-tracked spotlight, both expressed as CSS variables. */
export function useTilt<T extends HTMLElement = HTMLElement>(max = 7) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced || !hasFinePointer()) return;

    // Bound to the element, not the window, so this only fires while the
    // pointer is actually over the card.
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      node.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
      node.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
      node.style.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
      node.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
    };

    const onLeave = () => {
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--ry", "0deg");
    };

    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, max]);

  return ref;
}

/**
 * Smoothed scroll velocity, published as `--scroll-skew` in degrees.
 *
 * This used to return a number from `setState` inside a rAF loop, re-rendering
 * every consumer on every frame for the entire life of the page.
 */
export function useScrollVelocity<T extends HTMLElement = HTMLElement>(
  degreesPerPixel = -0.22,
  maxDegrees = 6,
) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;

    let lastScroll = window.scrollY;
    let velocity = 0;
    let lastWritten = Number.NaN;

    return onTick((_time, delta) => {
      const y = window.scrollY;
      velocity = damp(velocity, y - lastScroll, SMOOTHING.velocity, delta);
      lastScroll = y;

      const skew = Math.max(
        -maxDegrees,
        Math.min(maxDegrees, Math.round(velocity * degreesPerPixel * 100) / 100),
      );
      if (skew === lastWritten) return;
      lastWritten = skew;
      node.style.setProperty("--scroll-skew", `${skew}deg`);
    });
  }, [reduced, degreesPerPixel, maxDegrees]);

  return ref;
}
