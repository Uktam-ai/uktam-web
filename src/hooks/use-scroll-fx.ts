import { useEffect, useRef } from "react";

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

/** Magnetic attraction: the element eases toward the pointer within `radius`. */
export function useMagnetic<T extends HTMLElement = HTMLElement>(strength = 0.35, radius = 120) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced || !hasFinePointer()) return;

    const release = trackPointer();
    const current = { x: 0, y: 0 };
    let resting = false;

    const stop = onTick((_time, delta) => {
      const rect = node.getBoundingClientRect();
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);
      const reach = Math.max(rect.width, rect.height) / 2 + radius;
      const inReach = pointer.seen && Math.hypot(dx, dy) < reach;

      current.x = damp(current.x, inReach ? dx * strength : 0, 0.82, delta);
      current.y = damp(current.y, inReach ? dy * strength : 0, 0.82, delta);

      // Once settled at rest, stop writing until the pointer comes back.
      if (!inReach && Math.abs(current.x) < 0.05 && Math.abs(current.y) < 0.05) {
        if (!resting) {
          resting = true;
          node.style.transform = "";
        }
        return;
      }
      resting = false;
      node.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
    });

    return () => {
      stop();
      release();
      node.style.transform = "";
    };
  }, [reduced, strength, radius]);

  return ref;
}

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

/** Vertical parallax, published as `--py-shift` in pixels. */
export function useParallax<T extends HTMLElement = HTMLElement>(intensity = 40) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;

    let last = Number.NaN;
    return onTick(() => {
      const rect = node.getBoundingClientRect();
      // Skip the work entirely while off screen.
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const shift = Math.round(progress * intensity * 100) / 100;
      if (shift === last) return;
      last = shift;
      node.style.setProperty("--py-shift", `${shift}px`);
    });
  }, [reduced, intensity]);

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
      velocity = damp(velocity, y - lastScroll, 0.86, delta);
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
