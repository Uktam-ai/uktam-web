import type { ReactNode } from "react";
import { useScrollVelocity } from "@/hooks/use-scroll-fx";
import { cn } from "@/lib/utils";

/**
 * Infinite horizontal marquee. The children list is duplicated so the
 * translation loop is seamless. Scroll velocity skews and stretches the
 * track, so flicking the page visibly drags the strip.
 */
export function Marquee({
  children,
  speed = 38,
  reverse = false,
  className,
}: {
  children: ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  const velocity = useScrollVelocity();
  const clamped = Math.max(-28, Math.min(28, velocity));

  return (
    <div className={cn("marquee", className)} data-cursor="text">
      <div
        className="w-max"
        style={{
          transform: `skewX(${(clamped * -0.22).toFixed(2)}deg)`,
          transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className="marquee-track"
          style={{
            animationDuration: `${speed}s`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
        >
          <div className="marquee-group">{children}</div>
          <div className="marquee-group" aria-hidden>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
