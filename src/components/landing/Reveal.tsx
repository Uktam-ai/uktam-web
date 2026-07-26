import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-reveal";
import { SplitText } from "./SplitText";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "p" | "h2";
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", inView && "reveal-in", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
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
  /** Plain string — rendered as a per-character mask reveal. */
  title: string;
  /** Optional trailing clause rendered in the brand gradient. */
  highlight?: string;
  blurb?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      <Reveal>
        <span className="mono-label text-primary">{kicker}</span>
      </Reveal>
      <h2 className="mt-4 text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl">
        <SplitText text={title} delay={60} />
        {highlight ? (
          <>
            {" "}
            <SplitText text={highlight} delay={60 + title.length * 14} gradient />
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
