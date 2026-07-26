import { useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { SMOOTHING } from "@/lib/motion";
import { hasFinePointer, pointer, trackPointer } from "@/lib/pointer";
import { damp, onTick } from "@/lib/ticker";

/**
 * Two-part cursor: a dot that tracks the pointer almost exactly, and a ring
 * that trails behind and swells over interactive targets.
 *
 * Target detection is delegated through `pointerover`/`pointerout` rather than
 * inspected on every move. The previous version ran `closest()`, a
 * `getBoundingClientRect()` and two `setState` calls on every single
 * `pointermove` event, which meant a layout read and a React re-render for
 * every pixel of mouse travel.
 */
export function Cursor() {
  const reduced = usePrefersReducedMotion();
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduced || !hasFinePointer()) return;
    setEnabled(true);

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const release = trackPointer();

    const ringPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const dotPos = { ...ringPos };
    const size = { current: 32, target: 32 };
    let visible = false;

    // Resolved once per target change, not per frame.
    const onOver = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-cursor]");
      const mode = target?.dataset.cursor ?? null;
      size.target = mode === "text" ? 8 : mode ? 68 : 32;
      ring.dataset.mode = mode ?? "idle";
      dot.dataset.mode = mode ?? "idle";
    };

    const onDown = () => ring.setAttribute("data-down", "");
    const onUp = () => ring.removeAttribute("data-down");
    const onLeave = () => {
      visible = false;
      ring.style.opacity = "0";
      dot.style.opacity = "0";
    };

    const stop = onTick((_time, delta) => {
      if (!visible && pointer.seen) {
        visible = true;
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }

      ringPos.x = damp(ringPos.x, pointer.x, SMOOTHING.cursorRing, delta);
      ringPos.y = damp(ringPos.y, pointer.y, SMOOTHING.cursorRing, delta);
      dotPos.x = damp(dotPos.x, pointer.x, SMOOTHING.cursorDot, delta);
      dotPos.y = damp(dotPos.y, pointer.y, SMOOTHING.cursorDot, delta);
      size.current = damp(size.current, size.target, SMOOTHING.cursorRing, delta);

      ring.style.transform = `translate3d(${ringPos.x.toFixed(1)}px, ${ringPos.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${(size.current / 32).toFixed(3)})`;
      dot.style.transform = `translate3d(${dotPos.x.toFixed(1)}px, ${dotPos.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    });

    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      stop();
      release();
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [reduced]);

  if (reduced || !enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} />
      <div ref={dotRef} className="cursor-dot" style={{ opacity: 0 }} />
    </div>
  );
}
