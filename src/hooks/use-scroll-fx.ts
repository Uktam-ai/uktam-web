import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reveal";

/**
 * Magnetic attraction: the element eases toward the pointer while the pointer
 * is within `radius`, then springs back on leave.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(strength = 0.35, radius = 120) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const loop = () => {
      cur.x += (target.x - cur.x) * 0.18;
      cur.y += (target.y - cur.y) * 0.18;
      node.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + radius;
      if (dist < reach) {
        target.x = dx * strength;
        target.y = dy * strength;
      } else {
        target.x = 0;
        target.y = 0;
      }
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      node.style.transform = "";
    };
  }, [reduced, strength, radius]);

  return ref;
}

/** 3D tilt + pointer-tracked spotlight driven by CSS custom properties. */
export function useTilt<T extends HTMLElement = HTMLElement>(max = 7) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      node.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
      node.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
      node.style.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
      node.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
    };
    const onLeave = () => {
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--ry", "0deg");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, max]);

  return ref;
}

/** Vertical parallax on scroll, expressed as a translateY in pixels. */
export function useParallax<T extends HTMLElement = HTMLElement>(intensity = 40) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = node.getBoundingClientRect();
      const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      node.style.setProperty("--py-shift", `${(progress * intensity).toFixed(2)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced, intensity]);

  return ref;
}

/** Smoothed scroll velocity in px/frame, signed by direction. */
export function useScrollVelocity() {
  const [velocity, setVelocity] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let last = window.scrollY;
    let value = 0;
    let raf = 0;

    const loop = () => {
      const y = window.scrollY;
      const delta = y - last;
      last = y;
      value += (delta - value) * 0.14;
      if (Math.abs(value) < 0.05) value = 0;
      setVelocity((prev) => (Math.abs(prev - value) > 0.08 ? value : prev));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return velocity;
}
