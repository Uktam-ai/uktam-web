import { ArrowDown, ShieldCheck } from "lucide-react";

import { useMagnetic } from "@/hooks/use-scroll-fx";

import { Aurora } from "./Aurora";
import { LivingHeadline } from "./LivingHeadline";
import { PhoneMockup } from "./PhoneMockup";
import { Reveal } from "./Reveal";
import { HERO_STATS, PLAY_STORE_URL } from "./data";

/**
 * Entrance timings. These are deliberately sequenced rather than fired at once:
 * badge, then headline, then the rule that anchors it, then the actions. The
 * phone uncovers last, once the claim above it has landed.
 */
const STEP = {
  badge: 0,
  headline: 120,
  subhead: 720,
  actions: 820,
  stats: 920,
  phone: 700,
} as const;

export function Hero() {
  const installRef = useMagnetic<HTMLAnchorElement>(0.22, 70);

  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-32">
      <Aurora />

      {/*
        One row, phone included, aligned to the top. Putting the phone in a
        second row left it stranded low with a pool of empty canvas beside the
        headline; here it reads as part of the opening statement.
      */}
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-14">
        <div>
          <Reveal delay={STEP.badge}>
            <span className="offline-pill">
              <ShieldCheck className="h-3.5 w-3.5" />
              Zero data leaves your phone
            </span>
          </Reveal>

          <Reveal delay={STEP.headline} className="mt-8">
            <LivingHeadline />
          </Reveal>

          <div className="mt-10">
            <Reveal delay={STEP.subhead}>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                A real-time Indic speech-to-speech pipeline that runs entirely on your Android
                device. Recognition, translation and speech — all local, all private, all yours.
              </p>
            </Reveal>

            <Reveal delay={STEP.actions}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  ref={installRef}
                  href={PLAY_STORE_URL}
                  data-cursor="install"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  <GooglePlayGlyph />
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.14em] opacity-80">
                      Get it on
                    </span>
                    Google Play
                  </span>
                </a>
                <a href="#pipeline" data-cursor="hover" className="btn-ghost">
                  How it works
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={STEP.stats}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-7">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label}>
                    <dt className="font-mono text-lg font-bold text-foreground">{stat.value}</dt>
                    <dd className="mt-1 text-xs text-muted-foreground">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>

        <Reveal
          variant="wipe"
          delay={STEP.phone}
          className="justify-self-center lg:justify-self-end"
        >
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
