import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { useInView, usePrefersReducedMotion } from "@/hooks/use-reveal";
import { DURATION } from "@/lib/motion";
import { onTick } from "@/lib/ticker";

import { Reveal } from "./Reveal";
import { LANGUAGES, STATS } from "./data";

/**
 * The one section that breaks the page's surface rhythm, by dropping below the
 * canvas rather than rising above it. The scripts get their contrast — they are
 * the subject here, not decoration — without a bright panel flashing at anyone
 * scrolling through in a dark room.
 */
export function Languages() {
  return (
    <section id="languages" className="section-deep relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <span className="mono-label text-emerald">Languages</span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
              Four Indic languages today. More on the way.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-base leading-relaxed opacity-70">
              Speech recognition, translation and text-to-speech in every direction between the
              supported languages.
            </p>
          </Reveal>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-current/15 bg-current/15 md:grid-cols-5">
          {LANGUAGES.map((language, i) => (
            <Reveal as="li" key={language.code} delay={i * 80} className="specimen">
              <p lang={language.code} className="specimen-script">
                {language.script}
              </p>
              <p className="mt-4 text-sm font-medium">{language.name}</p>
              <p className="mono-label mt-1 opacity-55">{language.code}</p>
            </Reveal>
          ))}
          {/* Spans the row on the two-column layout — five tiles across two
              columns would otherwise leave an orphan cell showing the grid's
              own background. */}
          <Reveal as="li" delay={360} className="specimen col-span-2 opacity-60 md:col-span-1">
            <Plus className="h-5 w-5" />
            <p className="mt-3 text-xs leading-relaxed">More Indic languages coming soon</p>
          </Reveal>
        </ul>

        <div className="mt-14 grid gap-8 border-t border-current/15 pt-10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <Counter key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const [shown, setShown] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (!inView || done.current) return;
    done.current = true;
    if (reduced || value === 0) {
      setShown(value);
      return;
    }

    // Counted on the shared ticker. This was the last thing on the page still
    // pulling in anime.js, which cost ~22 kB gzipped to tween one integer.
    let elapsed = 0;
    const stop = onTick((_time, delta) => {
      elapsed += delta;
      const t = Math.min(1, elapsed / (DURATION.reveal + DURATION.base));
      // easeOutCubic
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t >= 1) stop();
    });
    return stop;
  }, [inView, reduced, value]);

  return (
    <div ref={ref}>
      <p className="font-mono text-4xl font-bold">
        {shown}
        {suffix}
      </p>
      <p className="mono-label mt-2 opacity-55">{label}</p>
    </div>
  );
}
