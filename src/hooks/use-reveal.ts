import { useEffect, useRef, useState } from "react";

import { observe, type ObserveOptions } from "@/lib/observer";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Reveals an element when it scrolls into view by setting `data-in` on the node
 * directly.
 *
 * Deliberately not React state: a reveal is a one-way visual transition that no
 * other component reads, so re-rendering the subtree just to flip a class is
 * pure cost. Around thirty elements on this page reveal, and this keeps every
 * one of them off the render path.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: ObserveOptions) {
  const ref = useRef<T | null>(null);
  const { threshold, rootMargin, once } = options ?? {};

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    return observe(
      node,
      (entry) => {
        if (entry.isIntersecting) node.setAttribute("data-in", "");
      },
      { threshold, rootMargin, once },
    );
    // Depend on the primitives rather than the options object — call sites pass
    // an inline literal, which would otherwise resubscribe on every render.
  }, [threshold, rootMargin, once]);

  return ref;
}

/**
 * The same observation surfaced as React state. Use only when rendering
 * genuinely depends on visibility — a counter that starts running, say. Prefer
 * `useReveal` for anything that is purely a CSS transition.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    return observe(
      node,
      (entry) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
  }, [threshold]);

  return { ref, inView };
}
