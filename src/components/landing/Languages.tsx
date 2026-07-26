import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";
import { LANGUAGES, STATS } from "./data";
import { useInView, usePrefersReducedMotion } from "@/hooks/use-reveal";

export function Languages() {
  return (
    <section id="languages" className="relative border-t border-border py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="Languages"
          title="Four Indic languages today."
          highlight="More on the way."
          blurb="Real-time speech recognition, translation and text-to-speech in every direction between the supported languages."
        />

        <ul className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-5">
          {LANGUAGES.map((lang, i) => (
            <Reveal as="li" key={lang.code} delay={i * 80}>
              <div className="card-ring group h-full rounded-2xl p-6 text-center">
                <p className="text-3xl font-semibold leading-tight text-foreground">
                  {lang.script}
                </p>
                <p className="mt-3 text-sm font-medium">{lang.name}</p>
                <p className="mono-label mt-1 text-muted-foreground">{lang.code}</p>
              </div>
            </Reveal>
          ))}
          <Reveal as="li" delay={360}>
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                More Indic languages coming soon
              </p>
            </div>
          </Reveal>
        </ul>

        <div className="mt-16 grid gap-5 rounded-3xl border border-border bg-surface/60 p-8 sm:grid-cols-3 sm:p-10">
          {STATS.map((s) => (
            <Counter key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const [n, setN] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (!inView || done.current) return;
    done.current = true;
    if (reduced || value === 0) {
      setN(value);
      return;
    }
    let cancelled = false;
    (async () => {
      const { animate } = await import("animejs");
      if (cancelled) return;
      const obj = { v: 0 };
      animate(obj, {
        v: value,
        duration: 1500,
        ease: "out(3)",
        onUpdate: () => setN(Math.round(obj.v)),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [inView, reduced, value]);

  return (
    <div ref={ref} className="text-center sm:text-left">
      <p className="font-mono text-4xl font-bold text-gradient">
        {n}
        {suffix}
      </p>
      <p className="mono-label mt-2 text-muted-foreground">{label}</p>
    </div>
  );
}
