import type { CSSProperties, ReactNode } from "react";

import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

import { SplitText } from "./SplitText";

/**
 * `fade` lifts and fades a block of content — the workhorse for body copy.
 *
 * `wipe` opens a clip-path mask while the content inside counter-moves, so the
 * subject appears to be uncovered rather than to slide in. It costs an extra
 * element, so it is reserved for things with real visual weight: the phone,
 * imagery, the feature cards.
 */
type RevealVariant = "fade" | "wipe";

type RevealTag = "div" | "section" | "li" | "span" | "p" | "figure";

export function Reveal({
  children,
  delay = 0,
  variant = "fade",
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Milliseconds before the reveal starts. */
  delay?: number;
  variant?: RevealVariant;
  className?: string;
  as?: RevealTag;
}) {
  const ref = useReveal<HTMLDivElement>();
  const style = delay ? ({ "--delay": `${delay}ms` } as CSSProperties) : undefined;

  if (variant === "wipe") {
    return (
      // Three elements, and each one is load-bearing. The observed node must
      // stay unclipped: a clip-path that collapses the box to zero area also
      // zeroes its intersection ratio, so an element hiding itself this way can
      // never trigger its own reveal. The mask carries the clip, and the inner
      // node carries the counter-move.
      <Tag ref={ref as never} className={cn("reveal-wipe", className)} style={style}>
        <span className="reveal-wipe-mask">
          <span className="reveal-wipe-inner">{children}</span>
        </span>
      </Tag>
    );
  }

  return (
    <Tag ref={ref as never} className={cn("reveal", className)} style={style}>
      {children}
    </Tag>
  );
}

export function SectionHeading({
  kicker,
  title,
  highlight,
  blurb,
  align = "center",
}: {
  kicker: string;
  title: string;
  /** Optional trailing clause carried in the brand gradient. */
  highlight?: string;
  blurb?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      <Reveal>
        <span className="mono-label text-primary">{kicker}</span>
      </Reveal>
      <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
        <SplitText text={title} />
        {highlight ? (
          <>
            {" "}
            <SplitText text={highlight} delay={90} gradient />
          </>
        ) : null}
      </h2>
      {blurb ? (
        <Reveal delay={200}>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">{blurb}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
