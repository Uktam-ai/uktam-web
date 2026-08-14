import { ArrowDown, ShieldCheck } from "lucide-react";

import { DeferredFx, loadFerrofluid } from "@/components/fx/DeferredFx";
import { GradualBlur } from "@/components/fx/GradualBlur";
import SpecularButton from "@/components/fx/SpecularButton";

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
  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-32">
      {/* Replaces the CSS aurora that used to sit here: two ambient layers in
          the same space would just fight each other. Deferred, so the hero
          text never waits on a shader to compile. */}
      <DeferredFx load={loadFerrofluid} />

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
                {/*
                  Plain type, not a badge. This used to draw the Play triangle
                  and set "Get it on / Google Play" in the badge's own two-line
                  lockup, tinted to our gradient — which is the one thing Play
                  brand terms do not allow, and which read as a mistake once the
                  real badge went into the nav. Naming Google Play in running
                  text is fine; imitating the artwork is not.
                */}
                <SpecularButton
                  href={PLAY_STORE_URL}
                  data-cursor="install"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary relative isolate"
                >
                  Install on Google Play
                </SpecularButton>
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
      {/* The hero ends on a hard line against the strip below it, with the
          fluid backdrop stopping mid-motion. Ramping the blur over the last
          few rem lets it settle out instead of being cut off. */}
      <GradualBlur position="bottom" height="7rem" strength={1.6} />
    </section>
  );
}
