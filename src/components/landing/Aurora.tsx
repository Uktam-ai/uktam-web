import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reveal";

const ORBS = [
  { key: "a", className: "left-[4%] top-[6%] h-[28rem] w-[28rem] bg-primary/50" },
  { key: "b", className: "right-[2%] top-[0%] h-[32rem] w-[32rem] bg-purple/45" },
  { key: "c", className: "left-[34%] top-[44%] h-[26rem] w-[26rem] bg-indigo/45" },
  { key: "d", className: "right-[26%] top-[56%] h-[18rem] w-[18rem] bg-cyan/25" },
];

export function Aurora() {
  const reduced = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !root.current) return;
    let cancelled = false;
    const node = root.current;
    const orbs = Array.from(node.querySelectorAll<HTMLElement>("[data-orb]"));

    (async () => {
      const { animate } = await import("animejs");
      if (cancelled) return;
      orbs.forEach((orb, i) => {
        animate(orb, {
          translateX: [0, 40 * (i % 2 === 0 ? 1 : -1), 0],
          translateY: [0, -30 - i * 8, 0],
          scale: [1, 1.16, 1],
          opacity: [0.5, 0.9, 0.5],
          duration: 14000 + i * 3200,
          ease: "inOutSine",
          loop: true,
          delay: i * 900,
        });
      });
    })();

    // Pointer-reactive light: the aurora leans toward the cursor.
    let raf = 0;
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 46;
      target.y = (e.clientY / window.innerHeight - 0.5) * 30;
    };
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      node.style.setProperty("--aurora-x", `${cur.x.toFixed(2)}px`);
      node.style.setProperty("--aurora-y", `${cur.y.toFixed(2)}px`);
      raf = requestAnimationFrame(loop);
    };
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", onMove);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ transform: "translate3d(var(--aurora-x, 0px), var(--aurora-y, 0px), 0)" }}
      >
        {ORBS.map((orb) => (
          <div
            key={orb.key}
            data-orb
            className={`absolute rounded-full blur-[130px] opacity-60 ${orb.className}`}
          />
        ))}
      </div>
      <div className="absolute inset-0 dot-grid opacity-[0.14]" />
      <div className="absolute inset-0 bg-veil" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
