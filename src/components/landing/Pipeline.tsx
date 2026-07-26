import { useEffect, useRef, useState } from "react";
import { AudioLines, Languages as LanguagesIcon, Mic, Volume2 } from "lucide-react";

import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { onTick } from "@/lib/ticker";

import { SectionHeading } from "./Reveal";
import { PIPELINE } from "./data";

const ICONS = [Mic, AudioLines, LanguagesIcon, Volume2];

/**
 * The centrepiece, driven by scroll rather than hover.
 *
 * The section reserves a tall runway and pins its contents, so scrolling
 * through it advances the pipeline one stage at a time and draws the connector
 * between them. The previous version only responded to `mouseenter`, which
 * meant the page's main illustration did nothing at all on a phone.
 */
export function Pipeline() {
  const reduced = usePrefersReducedMotion();
  const runwayRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const runway = runwayRef.current;
    const track = trackRef.current;
    if (!runway || !track) return;

    if (reduced) {
      setActive(PIPELINE.length - 1);
      track.style.setProperty("--pipeline-progress", "1");
      return;
    }

    let lastIndex = -1;
    let lastProgress = -1;

    return onTick(() => {
      const rect = runway.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));

      const rounded = Math.round(progress * 200) / 200;
      if (rounded !== lastProgress) {
        lastProgress = rounded;
        // The connector is a CSS variable, so drawing it costs no re-render.
        track.style.setProperty("--pipeline-progress", String(rounded));
      }

      // React state changes at most three times across the whole section.
      const index = Math.min(PIPELINE.length - 1, Math.floor(progress * PIPELINE.length));
      if (index !== lastIndex) {
        lastIndex = index;
        setActive(index);
      }
    });
  }, [reduced]);

  return (
    <section id="pipeline" className="relative border-t border-border">
      <div ref={runwayRef} className="lg:h-[280vh]">
        <div className="lg:sticky lg:top-0 lg:flex lg:min-h-screen lg:flex-col lg:justify-center">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
            <SectionHeading
              lead="Voice in, voice out."
              title="Four local stages, none of them remote."
            />

            <div ref={trackRef} className="pipeline-track mt-14">
              <div className="pipeline-rail" aria-hidden />

              <ol className="relative grid gap-3 lg:grid-cols-4">
                {PIPELINE.map((stage, i) => {
                  const Icon = ICONS[i];
                  const state = i === active ? "active" : i < active ? "done" : "waiting";
                  return (
                    <li key={stage.step}>
                      <article data-state={state} className="pipeline-stage">
                        <div className="flex items-start justify-between gap-4">
                          <span className="pipeline-icon">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="mono-label pipeline-step">{stage.step}</span>
                        </div>

                        <div className="mt-8">
                          <h3 className="text-xl font-semibold lg:text-2xl">{stage.title}</h3>
                          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                            {stage.engine}
                          </p>
                          {stage.timing ? (
                            <p className="mono-label mt-3 text-emerald">{stage.timing}</p>
                          ) : null}
                          {/* The wrapper is what collapses; the paragraph
                              inside it is what gets clipped. */}
                          <div className="pipeline-body mt-4">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {stage.body}
                            </p>
                          </div>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </div>

            <p className="mx-auto mt-14 max-w-xl text-center font-mono text-xs text-muted-foreground">
              network calls in this pipeline: <span className="text-emerald">0</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
