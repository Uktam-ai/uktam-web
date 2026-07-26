import { useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { SMOOTHING } from "@/lib/motion";
import { hasFinePointer, pointer, trackPointer } from "@/lib/pointer";
import { damp, onTick } from "@/lib/ticker";

/** Half-size of the reticle when it is not locked onto anything. */
const IDLE_REACH = 11;
/** Corner arm length, and how far outside a target the brackets sit. */
const CORNER = 12;
const BRACKET_GAP = 5;
/** Seconds per full turn while idle. */
const SPIN_PERIOD = 8;

type Offsets = { x: number; y: number }[];

/**
 * A reticle cursor: a dot that tracks the pointer, and four brackets that idle
 * as a small rotating square and snap open around whatever is hoverable.
 *
 * Built on the page's existing ticker rather than an animation library. Every
 * corner is one damped value per axis updated inside the single rAF the rest of
 * the page already shares, so adding it costs no new loop, no new listener and
 * no dependency.
 *
 * Target geometry is measured once when the pointer enters an element, not per
 * frame — `getBoundingClientRect` forces layout, and doing that four times a
 * frame for a decoration is how a cursor ends up costing more than the page.
 */
export function Cursor() {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const cornerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduced || !hasFinePointer()) return;
    setEnabled(true);

    const wrap = wrapRef.current;
    const dot = dotRef.current;
    const corners = cornerRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!wrap || !dot || corners.length !== 4) return;

    const release = trackPointer();

    const dotPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const wrapPos = { ...dotPos };
    const current: Offsets = corners.map(() => ({ x: 0, y: 0 }));
    let spin = 0;
    let visible = false;

    /** Null while idle; a viewport-space rect while locked onto a target. */
    let lockedRect: DOMRect | null = null;
    let activeTarget: HTMLElement | null = null;

    const idleOffsets = (): Offsets => [
      { x: -IDLE_REACH, y: -IDLE_REACH },
      { x: IDLE_REACH - CORNER, y: -IDLE_REACH },
      { x: IDLE_REACH - CORNER, y: IDLE_REACH - CORNER },
      { x: -IDLE_REACH, y: IDLE_REACH - CORNER },
    ];

    const rectOffsets = (rect: DOMRect, originX: number, originY: number): Offsets => {
      const left = rect.left - BRACKET_GAP - originX;
      const top = rect.top - BRACKET_GAP - originY;
      const right = rect.right + BRACKET_GAP - CORNER - originX;
      const bottom = rect.bottom + BRACKET_GAP - CORNER - originY;
      return [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom },
      ];
    };

    const setTarget = (target: HTMLElement | null) => {
      activeTarget = target;
      lockedRect = target ? target.getBoundingClientRect() : null;
      const mode = target?.dataset.cursor ?? "idle";
      wrap.dataset.mode = mode;
      dot.dataset.mode = mode;
    };

    const onOver = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-cursor]");
      // `text` marks copy the cursor should get out of the way of, not lock to.
      if (target && target.dataset.cursor !== "text") setTarget(target);
      else setTarget(null);
    };

    // The rect is in viewport space, so scrolling invalidates it even though
    // the pointer never moved.
    const onScroll = () => {
      if (activeTarget) lockedRect = activeTarget.getBoundingClientRect();
    };

    const onDown = () => wrap.setAttribute("data-down", "");
    const onUp = () => wrap.removeAttribute("data-down");
    const onLeave = () => {
      visible = false;
      wrap.style.opacity = "0";
      dot.style.opacity = "0";
    };

    const stop = onTick((_time, delta) => {
      if (!visible && pointer.seen) {
        visible = true;
        wrap.style.opacity = "1";
        dot.style.opacity = "1";
      }

      dotPos.x = damp(dotPos.x, pointer.x, SMOOTHING.cursorDot, delta);
      dotPos.y = damp(dotPos.y, pointer.y, SMOOTHING.cursorDot, delta);
      // Locked on, the frame stops chasing the pointer and holds the target, so
      // the brackets read as attached to the element rather than dragged near it.
      const anchorX = lockedRect ? lockedRect.left + lockedRect.width / 2 : pointer.x;
      const anchorY = lockedRect ? lockedRect.top + lockedRect.height / 2 : pointer.y;
      wrapPos.x = damp(wrapPos.x, anchorX, SMOOTHING.cursorRing, delta);
      wrapPos.y = damp(wrapPos.y, anchorY, SMOOTHING.cursorRing, delta);

      const goal = lockedRect ? rectOffsets(lockedRect, wrapPos.x, wrapPos.y) : idleOffsets();
      for (let i = 0; i < corners.length; i++) {
        current[i].x = damp(current[i].x, goal[i].x, SMOOTHING.cursorRing, delta);
        current[i].y = damp(current[i].y, goal[i].y, SMOOTHING.cursorRing, delta);
        corners[i].style.transform =
          `translate3d(${current[i].x.toFixed(1)}px, ${current[i].y.toFixed(1)}px, 0)`;
      }

      // Spin only while idle. Rotating the frame once it has locked onto a
      // button would tear the brackets off the edges they are tracking.
      if (!lockedRect) spin = (spin + delta / (SPIN_PERIOD * 1000)) % 1;
      wrap.style.transform =
        `translate3d(${wrapPos.x.toFixed(1)}px, ${wrapPos.y.toFixed(1)}px, 0) ` +
        `rotate(${lockedRect ? 0 : (spin * 360).toFixed(2)}deg)`;
      dot.style.transform = `translate3d(${dotPos.x.toFixed(1)}px, ${dotPos.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    });

    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      stop();
      release();
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [reduced]);

  if (reduced || !enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <div ref={wrapRef} className="cursor-frame" style={{ opacity: 0 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            ref={(node) => {
              cornerRefs.current[i] = node;
            }}
            className="cursor-corner"
            data-corner={i}
          />
        ))}
      </div>
      <div ref={dotRef} className="cursor-dot" style={{ opacity: 0 }} />
    </div>
  );
}
