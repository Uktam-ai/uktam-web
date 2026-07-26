import { Fragment, useEffect, useRef, type CSSProperties, type ElementType } from "react";

import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type SplitMode = "lines" | "chars";

/**
 * Masked text reveal.
 *
 * In `lines` mode each word rises out of its own overflow box, but the delay is
 * keyed to the *line* the word sits on, so a heading comes up line by line
 * rather than word by word. Line membership is only knowable after layout, so
 * it is measured on mount and on resize and written back as `--i`.
 *
 * `chars` mode staggers per character. It costs a DOM node per glyph, so it is
 * reserved for the hero headline where the detail earns its keep.
 *
 * Screen readers get the plain string via `aria-label`; every fragment is
 * `aria-hidden`, so the text is announced once and intact.
 */
export function SplitText({
  text,
  as: Tag = "span",
  className,
  mode = "lines",
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  mode?: SplitMode;
  /** Milliseconds before the first fragment moves. */
  delay?: number;
}) {
  const revealRef = useReveal<HTMLElement>({ threshold: 0.25 });
  const nodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (mode !== "lines") return;
    const node = nodeRef.current;
    if (!node) return;

    const measure = () => {
      let lineIndex = -1;
      let lineTop = Number.NaN;
      for (const word of node.querySelectorAll<HTMLElement>("[data-word]")) {
        // offsetTop changes exactly when a word wraps onto a new line.
        if (word.offsetTop !== lineTop) {
          lineTop = word.offsetTop;
          lineIndex += 1;
        }
        word.style.setProperty("--i", String(lineIndex));
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode, text]);

  const setRefs = (node: HTMLElement | null) => {
    nodeRef.current = node;
    revealRef.current = node;
  };

  const words = text.split(" ");
  let charIndex = 0;

  return (
    <Tag
      ref={setRefs}
      aria-label={text}
      className={cn("split", className)}
      style={delay ? ({ "--delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {words.map((word, w) => (
        <Fragment key={`${word}-${w}`}>
          {mode === "chars" ? (
            <span className="split-group" aria-hidden>
              {Array.from(word).map((char, c) => (
                <span
                  key={`${char}-${c}`}
                  data-word
                  className="split-word"
                  style={{ "--i": charIndex++ } as CSSProperties}
                >
                  <span className="split-inner">{char}</span>
                </span>
              ))}
            </span>
          ) : (
            <span data-word className="split-word" aria-hidden>
              <span className="split-inner">{word}</span>
            </span>
          )}
          {w < words.length - 1 ? <span aria-hidden> </span> : null}
        </Fragment>
      ))}
    </Tag>
  );
}
