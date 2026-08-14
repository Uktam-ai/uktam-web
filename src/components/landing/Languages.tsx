import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Plus } from "lucide-react";

import { useInView, usePrefersReducedMotion } from "@/hooks/use-reveal";
import { DURATION } from "@/lib/motion";
import { onTick } from "@/lib/ticker";

import { Reveal } from "./Reveal";
import { LANGUAGES, STATS } from "./data";

/**
 * How many cells the trailing tile has to swallow to square off the grid at a
 * given column count. Always between 1 and `columns`: a count that already
 * divides evenly gives the tile a whole row to itself rather than no width.
 */
const fillerSpan = (columns: number) => columns - (LANGUAGES.length % columns);

/**
 * Sits on the page's own canvas. Any opaque panel here would be a lid: the
 * cursor fluid renders behind page content, so a section with a background of
 * its own becomes a dead patch the trail cannot cross. The scripts get their
 * separation from the raised specimen tiles and the rules between them, which
 * is structure rather than a slab of colour.
 */
export function Languages() {
  return (
    <section
      id="languages"
      className="relative overflow-hidden border-t border-border py-24 sm:py-32"
    >
      {/* The mark is 8-fold symmetric, so it reads as ornament at this scale
          rather than as a logo someone forgot to shrink. Cropped by the section
          edge on purpose: a whole centred logo would be a watermark. */}
      <img src="/brand/mandala.svg" alt="" aria-hidden className="ambient-mandala" />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">
              Six Indic languages today. More on the way.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-base leading-relaxed opacity-70">
              Speech recognition, translation and text-to-speech in every direction between the
              supported languages.
            </p>
          </Reveal>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-current/15 bg-current/15 md:grid-cols-4">
          {LANGUAGES.map((language, i) => (
            <Reveal as="li" key={language.code} delay={i * 80} className="specimen">
              <p lang={language.code} className="specimen-script">
                {language.script}
              </p>
              <p className="mt-4 text-sm font-medium">{language.name}</p>
              <p className="mono-label mt-1 opacity-55">{language.code}</p>
            </Reveal>
          ))}
          {/*
            The tile stretches to finish whichever row it lands on, rather than
            carrying a span someone re-tuned by hand. At six languages that is
            two cells at both widths; at seven it is one cell at both, and
            neither leaves an odd cell showing the grid's own background
            through the gap.

            Inline, because Tailwind only ships the span utilities it can see
            in the source and these are computed.
          */}
          <Reveal
            as="li"
            delay={LANGUAGES.length * 80}
            className="specimen specimen-filler opacity-60"
            style={
              {
                "--filler-span": fillerSpan(2),
                "--filler-span-md": fillerSpan(4),
              } as CSSProperties
            }
          >
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
  /*
   * Seeded with the real figure, not zero.
   *
   * This counts up from nothing, which is fine once it is running and a lie
   * before it starts: the server-rendered HTML used to say "0 Indic languages"
   * eight lines under a heading saying six, and say it to anyone with
   * JavaScript off and to any crawler that does not run it. That broke the
   * no-JS rule in AGENTS.md and, worse, contradicted the page's own JSON-LD.
   *
   * So the markup ships the truth and the client arms the animation on mount.
   * The reset is invisible because this section sits well below the fold —
   * the only way to see it is to load a #languages deep link, where a single
   * frame of the correct number is the better failure anyway.
   */
  const [shown, setShown] = useState(value);
  const done = useRef(false);

  useEffect(() => {
    if (!reduced) setShown(0);
  }, [reduced]);

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
