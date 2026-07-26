import { useEffect, useState } from "react";
import { ArrowLeftRight, Mic, Volume2 } from "lucide-react";

import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

import { CONVERSATION, LANGUAGES } from "./data";

const TURN_INTERVAL_MS = 2200;
const byCode = new Map(LANGUAGES.map((language) => [language.code, language]));

/**
 * The app's translate screen, rebuilt from a real screenshot rather than
 * imagined: a two-way conversation where each turn shows what was heard above
 * what was said, the direction is carried by colour, and every turn reports its
 * own measured latency.
 *
 * Turns arrive on a timer and the whole exchange loops. State changes once per
 * turn, not per frame — the previous version re-rendered once per typed
 * character, forever.
 */
export function PhoneMockup() {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced ? CONVERSATION.length : 0);

  useEffect(() => {
    if (reduced) {
      setShown(CONVERSATION.length);
      return;
    }
    const id = window.setInterval(() => {
      // Pause on a full transcript before starting over, so the loop reads as
      // a conversation rather than a ticker.
      setShown((count) => (count > CONVERSATION.length ? 1 : count + 1));
    }, TURN_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const latest = CONVERSATION[Math.min(shown, CONVERSATION.length) - 1] ?? CONVERSATION[0];

  return (
    <div className="relative mx-auto w-[298px] sm:w-[326px]">
      <div className="absolute -inset-10 rounded-[3rem] bg-gradient-hero opacity-20 blur-3xl" />

      <div className="shadow-elevated relative rounded-[2.6rem] border border-border bg-surface p-2.5">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-background">
          <header className="flex items-center gap-2.5 px-4 pb-3 pt-5">
            <img
              src="/brand/logo-64.webp"
              alt=""
              width={26}
              height={26}
              className="h-[26px] w-[26px] rounded-full bg-white p-[3px]"
              decoding="async"
            />
            <span className="font-display text-[15px] font-bold tracking-tight">Uktam.ai</span>
            <span className="ml-auto mono-label text-[9px] text-emerald">offline</span>
          </header>

          <div className="flex items-center gap-2 border-b border-border px-4 pb-4">
            <LanguagePill code={latest.from} active />
            <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <LanguagePill code={latest.to} />
          </div>

          <div className="flex min-h-[330px] flex-col gap-3 px-3 py-4">
            {CONVERSATION.map((turn, i) => (
              <Turn key={i} turn={turn} visible={i < shown} />
            ))}
          </div>

          <div className="flex justify-center pb-7 pt-2">
            <div className="relative grid h-14 w-14 place-items-center rounded-full bg-primary">
              <Mic className="h-5 w-5 text-primary-foreground" />
              <span className="absolute inset-0 rounded-full border border-primary [animation:pulse-ring_2.4s_ease-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LanguagePill({ code, active = false }: { code: string; active?: boolean }) {
  const language = byCode.get(code);
  return (
    <span
      lang={code}
      className={cn(
        "flex-1 truncate rounded-full px-3 py-1.5 text-center text-[13px] transition-colors duration-(--duration-fast)",
        active ? "bg-primary font-medium text-primary-foreground" : "bg-secondary text-foreground",
      )}
    >
      {language?.script}
    </span>
  );
}

function Turn({ turn, visible }: { turn: (typeof CONVERSATION)[number]; visible: boolean }) {
  const outbound = turn.direction === "out";

  return (
    <article
      data-visible={visible || undefined}
      className={cn("phone-turn", outbound ? "mr-6 bg-blue-deep" : "ml-6 bg-green-deep")}
    >
      {/* What was heard, quieter than what was said — the translation is the
          thing the user is reaching for. */}
      <p lang={turn.from} className="text-[11px] leading-snug text-white/60">
        {turn.source}
      </p>

      <div className="mt-1.5 flex items-start gap-2">
        <p lang={turn.to} className="flex-1 text-[15px] font-semibold leading-snug text-white">
          {turn.target}
        </p>
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
            outbound ? "bg-primary" : "bg-emerald",
          )}
        >
          <Volume2 className={cn("h-3.5 w-3.5", outbound ? "text-white" : "text-green-deep")} />
        </span>
      </div>

      <p className="mt-2 font-mono text-[9px] text-white/45">
        ASR {turn.asrMs} ms · Translation {turn.translateS}s
      </p>
    </article>
  );
}
