import type { ReactNode } from "react";
import { useMagnetic } from "@/hooks/use-scroll-fx";
import { cn } from "@/lib/utils";

/** Wraps content in a magnetically-attracted shell. */
export function Magnetic({
  children,
  strength = 0.3,
  radius = 90,
  className,
}: {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}) {
  const ref = useMagnetic<HTMLSpanElement>(strength, radius);
  return (
    <span ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </span>
  );
}
