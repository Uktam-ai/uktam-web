import type { ReactNode } from "react";

import { useScrollVelocity } from "@/hooks/use-scroll-fx";
import { cn } from "@/lib/utils";

/**
 * Infinite horizontal marquee. The children are duplicated so the translation
 * loop is seamless, and scroll velocity skews the track, so flicking the page
 * visibly drags the strip.
 *
 * The skew arrives as a CSS custom property written by the hook on each frame —
 * it never passes through React state.
 */
export function Marquee({
  children,
  speed = 38,
  reverse = false,
  className,
}: {
  children: ReactNode;
  /** Seconds for one full pass. */
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  const skewRef = useScrollVelocity<HTMLDivElement>();

  return (
    <div className={cn("marquee", className)} data-cursor="text">
      <div ref={skewRef} className="marquee-skew">
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
