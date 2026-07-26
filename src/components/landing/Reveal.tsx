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

/**
 * There is deliberately no kicker slot here.
 *
 * A small uppercase tracked label above every section heading is scaffolding,
 * not voice — it appears on nearly every generated landing page regardless of
 * what the page is about. The headings below carry their own subject, and the
 * nav already names the sections.
 *
 * `lead` is set in muted ink and `title` at full strength, so emphasis comes
 * from contrast within one sentence rather than from a gradient fill.
 */
export function SectionHeading({
  lead,
  title,
  blurb,
  align = "center",
}: {
  /** Quieter opening clause. Optional. */
  lead?: string;
  title: string;
  blurb?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      <h2 className="text-3xl sm:text-4xl md:text-5xl">
        {lead ? (
          <>
            <SplitText text={lead} className="text-muted-foreground" />{" "}
          </>
        ) : null}
        <SplitText text={title} delay={lead ? 90 : 0} />
      </h2>
      {blurb ? (
        <Reveal delay={200}>
          <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
            {blurb}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
