import { useState } from "react";
import { Mic, AudioLines, Languages as LanguagesIcon, Volume2 } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";
import { PIPELINE } from "./data";

const ICONS = [Mic, AudioLines, LanguagesIcon, Volume2];

export function Pipeline() {
  const [active, setActive] = useState(0);

  return (
    <section id="pipeline" className="relative border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <SectionHeading
          kicker="The pipeline"
          title="Voice in, voice out —"
          highlight="four local stages"
        />

        <Reveal delay={100}>
          <div
            className="mt-14 flex flex-col gap-3 lg:h-[430px] lg:flex-row"
            onMouseLeave={() => setActive(0)}
          >
            {PIPELINE.map((stage, i) => {
              const Icon = ICONS[i];
              const on = active === i;
              return (
                <article
                  key={stage.step}
                  data-cursor="hover"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  tabIndex={0}
                  className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-6 outline-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    on
                      ? "border-transparent bg-surface-raised glow-primary lg:flex-[3.4]"
                      : "border-border bg-surface/60 lg:flex-[1]"
                  }`}
                >
                  {/* gradient wash on the open card */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 bg-gradient-hero transition-opacity duration-700 ${
                      on ? "opacity-[0.14]" : "opacity-0"
                    }`}
                  />

                  <div className="relative flex items-start justify-between gap-4">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-all duration-500 ${
                        on
                          ? "border-transparent bg-gradient-hero text-primary-foreground"
                          : "border-border bg-surface text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`mono-label transition-colors duration-500 ${
                        on ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {stage.step}
                    </span>
                  </div>

                  <div className="relative mt-8 lg:mt-0">
                    <h3
                      className={`font-display text-xl font-semibold transition-colors duration-500 lg:text-2xl ${
                        on ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage.title}
                    </h3>
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                      {stage.engine}
                    </p>

                    {/* revealed body */}
                    <div
                      className={`grid transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        on ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <p className="overflow-hidden text-sm leading-relaxed text-muted-foreground lg:max-w-md">
                        {stage.body}
                      </p>
                    </div>

                    <span
                      aria-hidden
                      className={`mt-5 block h-[2px] bg-gradient-hero transition-all duration-700 ${
                        on ? "w-24 opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-14 max-w-xl text-center font-mono text-xs text-muted-foreground">
            network calls in this pipeline: <span className="text-emerald">0</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
