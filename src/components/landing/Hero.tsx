import { ArrowDown, ShieldCheck } from "lucide-react";
import { Aurora } from "./Aurora";
import { PhoneMockup } from "./PhoneMockup";
import { Reveal } from "./Reveal";

import { SplitText } from "./SplitText";
import { PLAY_STORE_URL } from "./data";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-32 sm:pb-32 sm:pt-40">
      <Aurora />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald/35 bg-emerald/10 px-3 py-1.5 text-xs font-medium text-emerald glow-emerald">
              <ShieldCheck className="h-3.5 w-3.5" />
              Zero data leaves your phone
            </span>
          </Reveal>

          <h1 className="mt-7 text-[2.6rem] font-bold leading-[1.03] sm:text-6xl lg:text-[4.1rem]">
            <span className="block">
              <SplitText text="Speak Hindi." delay={120} stagger={26} />
            </span>
            <span className="block">
              <SplitText text="Hear Tamil." delay={420} stagger={26} />
            </span>
            <span className="block">
              <SplitText text="No internet." delay={720} stagger={26} gradient />
            </span>
          </h1>

          <Reveal delay={170}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Uktam.ai is a real-time, fully offline Indic speech-to-speech pipeline that runs
              entirely on your Android device. Speech recognition, translation and text-to-speech —
              all local, all private, all instant.
            </p>
          </Reveal>

          <Reveal delay={250}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={PLAY_STORE_URL}
                data-cursor="install"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 rounded-xl bg-gradient-hero px-5 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-[box-shadow,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:brightness-110 glow-primary"
              >
                <GooglePlayGlyph />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] font-medium uppercase tracking-[0.14em] opacity-80">
                    Get it on
                  </span>
                  Google Play
                </span>
              </a>
              <a
                href="#pipeline"
                data-cursor="hover"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3.5 font-display text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-surface"
              >
                How it works
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={330}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-7">
              {[
                ["4", "Indic languages"],
                ["0 ms", "Network latency"],
                ["GPL-3.0", "Open source"],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-mono text-lg font-bold text-foreground">{v}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{k}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <PhoneMockup />
        </Reveal>
      </div>
    </section>
  );
}

function GooglePlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="currentColor">
      <path
        d="M3.6 1.8a1.3 1.3 0 0 0-.5 1.05v18.3c0 .43.18.8.5 1.05l10-10.2-10-10.2Z"
        opacity=".9"
      />
      <path d="M17.3 8.9 14.5 7.3 4.6 1.5c-.4-.24-.8-.2-1 .3l10 10.2 3.7-3.1Z" opacity=".75" />
      <path d="M17.3 15.1 20.9 13c.7-.4.7-1.6 0-2l-3.6-2 -3.8 3.1 3.8 3Z" />
      <path d="m3.6 22.5c.2.5.6.54 1 .3l9.9-5.8 2.8-1.6-3.7-3.1-10 10.2Z" opacity=".85" />
    </svg>
  );
}
