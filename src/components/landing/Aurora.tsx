import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { SMOOTHING } from "@/lib/motion";
import { hasFinePointer, pointer, trackPointer } from "@/lib/pointer";
import { damp, onTick } from "@/lib/ticker";

/**
 * Ambient light behind the hero.
 *
 * Two orbs rather than four, and blur capped well below the previous 130px.
 * A blurred element is rasterised at full size before the blur is applied, so a
 * 32rem orb at 130px blur is an enormous surface to recompose every frame —
 * and there were four of them drifting continuously.
 */
const ORBS = [
  { key: "blue", className: "left-[6%] top-[4%] h-[24rem] w-[24rem] bg-primary/45" },
  { key: "green", className: "right-[8%] top-[38%] h-[20rem] w-[20rem] bg-emerald/25" },
];

export function Aurora() {
  const reduced = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || reduced || !hasFinePointer()) return;

    const release = trackPointer();
    const current = { x: 0, y: 0 };
    let last = { x: Number.NaN, y: Number.NaN };

    const stop = onTick((_time, delta) => {
      const targetX = (pointer.x / window.innerWidth - 0.5) * 46;
      const targetY = (pointer.y / window.innerHeight - 0.5) * 30;
      current.x = damp(current.x, targetX, SMOOTHING.ambientLight, delta);
      current.y = damp(current.y, targetY, SMOOTHING.ambientLight, delta);

      const x = Math.round(current.x * 10) / 10;
      const y = Math.round(current.y * 10) / 10;
      if (x === last.x && y === last.y) return;
      last = { x, y };
      node.style.setProperty("--aurora-x", `${x}px`);
      node.style.setProperty("--aurora-y", `${y}px`);
    });

    return () => {
      stop();
      release();
    };
  }, [reduced]);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [contain:paint]"
    >
      <div
        className="absolute inset-0"
        style={{ transform: "translate3d(var(--aurora-x, 0px), var(--aurora-y, 0px), 0)" }}
      >
        {ORBS.map((orb, i) => (
          <div
            key={orb.key}
            className={`aurora-orb absolute rounded-full blur-[90px] ${orb.className}`}
            style={{ animationDelay: `${i * -6}s` }}
          />
        ))}
      </div>
      <div className="dot-grid absolute inset-0 opacity-[0.12]" />
      <div className="bg-veil absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
