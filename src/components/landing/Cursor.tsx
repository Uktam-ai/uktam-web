import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reveal";

type Mode = "idle" | "hover" | "text" | "drag";

/**
 * Two-part cursor: a precise dot that tracks the pointer 1:1 and a soft ring
 * that trails with spring easing, snaps onto `[data-cursor]` targets (matching
 * their bounds), squashes with pointer velocity and inverts over dark art.
 */
export function Cursor() {
  const reduced = usePrefersReducedMotion();
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };
    const dotPos = { ...pos };
    const size = { w: 34, h: 34, r: 999 };
    const sizeTarget = { ...size };
    let snap: DOMRect | null = null;
    let raf = 0;

    const readTarget = (el: HTMLElement | null) => {
      if (!el) {
        snap = null;
        sizeTarget.w = 34;
        sizeTarget.h = 34;
        sizeTarget.r = 999;
        setMode("idle");
        setLabel(null);
        return;
      }
      const value = el.dataset.cursor || "";
      if (value === "text") {
        snap = null;
        sizeTarget.w = 3;
        sizeTarget.h = 42;
        sizeTarget.r = 4;
        setMode("text");
        setLabel(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      const wide = rect.width < 320 && rect.height < 200;
      snap = wide ? rect : null;
      sizeTarget.w = wide ? rect.width + 16 : 92;
      sizeTarget.h = wide ? rect.height + 16 : 92;
      sizeTarget.r = wide ? 18 : 999;
      setMode("hover");
      setLabel(value && value !== "hover" ? value : null);
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setVisible(true);
      readTarget((e.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-cursor]") ?? null);
    };

    const loop = () => {
      // Snapped targets pull the ring toward the element centre.
      const gx = snap ? snap.left + snap.width / 2 : target.x;
      const gy = snap ? snap.top + snap.height / 2 : target.y;
      const ease = snap ? 0.22 : 0.145;
      const px = pos.x;
      const py = pos.y;
      pos.x += (gx - pos.x) * ease;
      pos.y += (gy - pos.y) * ease;

      size.w += (sizeTarget.w - size.w) * 0.14;
      size.h += (sizeTarget.h - size.h) * 0.14;
      size.r += (sizeTarget.r - size.r) * 0.14;

      const vx = pos.x - px;
      const vy = pos.y - py;
      const speed = Math.min(Math.hypot(vx, vy), 42);
      const stretch = snap ? 0 : speed / 260;
      const angle = (Math.atan2(vy, vx) * 180) / Math.PI;

      if (ring.current) {
        ring.current.style.width = `${size.w.toFixed(2)}px`;
        ring.current.style.height = `${size.h.toFixed(2)}px`;
        ring.current.style.borderRadius = `${size.r.toFixed(2)}px`;
        ring.current.style.transform =
          `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0) translate(-50%, -50%)` +
          ` rotate(${angle.toFixed(2)}deg) scale(${(1 + stretch).toFixed(3)}, ${(1 - stretch * 0.7).toFixed(3)})` +
          ` rotate(${(-angle).toFixed(2)}deg)`;
      }
      dotPos.x += (target.x - dotPos.x) * 0.55;
      dotPos.y += (target.y - dotPos.y) * 0.55;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${dotPos.x.toFixed(2)}px, ${dotPos.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    const onDown = () => setDown(true);
    const onUp = () => setDown(false);
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);
    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-custom-cursor");
      setEnabled(false);
    };
  }, [reduced]);

  if (reduced || !enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <div
        ref={ring}
        className="cursor-ring"
        data-mode={mode}
        data-down={down ? "true" : undefined}
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="cursor-label" data-show={label ? "true" : undefined}>
          {label}
        </span>
      </div>
      <div
        ref={dot}
        className="cursor-dot"
        data-mode={mode}
        style={{ opacity: visible && mode !== "text" ? 1 : 0 }}
      />
    </div>
  );
}
