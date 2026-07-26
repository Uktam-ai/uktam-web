import { Fragment, type ElementType } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/**
 * Per-character mask reveal. Text is split into words (kept unbreakable) and
 * characters, each rising out of an overflow-hidden line box with a staggered
 * delay. Screen readers get the plain string via aria-label.
 */
export function SplitText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 18,
  gradient = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  gradient?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLElement>(0.25);
  const words = text.split(" ");
  let index = 0;

  return (
    <Tag ref={ref as never} className={cn(className)} aria-label={text}>
      {words.map((word, w) => (
        <Fragment key={`${word}-${w}`}>
          <span className="split-word" aria-hidden>
            {Array.from(word).map((char, c) => {
              const i = index++;
              return (
                <span key={`${char}-${c}`} className="split-char">
                  <span
                    className={cn(
                      "split-inner",
                      (inView || reduced) && "split-in",
                      gradient && "text-gradient",
                    )}
                    style={{ transitionDelay: reduced ? "0ms" : `${delay + i * stagger}ms` }}
                  >
                    {char}
                  </span>
                </span>
              );
            })}
          </span>
          {w < words.length - 1 ? <span aria-hidden> </span> : null}
        </Fragment>
      ))}
    </Tag>
  );
}
