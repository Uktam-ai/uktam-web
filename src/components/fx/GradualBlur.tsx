import { useMemo, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Progressive blur along a section edge.
 *
 * A single `backdrop-filter` gives a hard line where the blur stops. Stacking a
 * few layers, each masked to a different band and blurred a little harder,
 * ramps it instead, so content dissolves into the boundary rather than hitting
 * a wall.
 *
 * Adapted from React Bits, cut down to the two positions this site uses. The
 * upstream component ships presets, responsive recalculation and hover
 * intensity; none of that is wanted here, and its documented `mathjs`
 * dependency is not actually imported by it.
 */

const CURVES = {
  linear: (p: number) => p,
  bezier: (p: number) => p * p * (3 - 2 * p),
} as const;

export function GradualBlur({
  position = "bottom",
  height = "6rem",
  strength = 2,
  layers = 5,
  curve = "bezier",
  className,
}: {
  position?: "top" | "bottom";
  height?: string;
  strength?: number;
  layers?: number;
  curve?: keyof typeof CURVES;
  className?: string;
}) {
  const divs = useMemo(() => {
    const increment = 100 / layers;
    const ease = CURVES[curve];
    const direction = position === "top" ? "to top" : "to bottom";

    return Array.from({ length: layers }, (_, index) => {
      const i = index + 1;
      const progress = ease(i / layers);
      const blur = 0.0625 * (progress * layers + 1) * strength;

      // Each layer is masked to its own band, with the neighbouring bands
      // fading in and out so the seams between layers are never visible.
      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const mask = `linear-gradient(${direction}, ${gradient})`;
      return (
        <div
          key={i}
          style={
            {
              position: "absolute",
              inset: 0,
              maskImage: mask,
              WebkitMaskImage: mask,
              backdropFilter: `blur(${blur.toFixed(3)}rem)`,
              WebkitBackdropFilter: `blur(${blur.toFixed(3)}rem)`,
            } as CSSProperties
          }
        />
      );
    });
  }, [position, strength, layers, curve]);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 z-10", className)}
      style={{ height, [position]: 0 }}
    >
      {divs}
    </div>
  );
}
