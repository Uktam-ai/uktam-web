import { useEffect, useState } from "react";
import { ArrowLeftRight, Info, Mic, Settings, Sun, Volume2 } from "lucide-react";

import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

import { CONVERSATION, LANGUAGES } from "./data";

const TURN_INTERVAL_MS = 2200;
const byCode = new Map(LANGUAGES.map((language) => [language.code, language]));

/**
 * The app's translate screen.
 *
 * Blue is your turn, green is the reply coming back, and the pills track
 * whichever direction is currently being spoken. Every turn reports its own
 * measured latency, exactly as the app does.
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
      // Hold on the full transcript for one beat before restarting, so it
      // reads as a conversation rather than a ticker.
      setShown((count) => (count > CONVERSATION.length ? 1 : count + 1));
    }, TURN_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const current = CONVERSATION[Math.min(Math.max(shown, 1), CONVERSATION.length) - 1];

  return (
    <div className="relative mx-auto w-[292px] sm:w-[320px]">
      {/* A radial falloff, not a blurred rectangle. The old glow was an inset
          box with a blur on it, which still resolved to a visible lighter
          panel with discernible edges behind the phone. */}
      <div className="phone-glow" aria-hidden />

      <div className="shadow-elevated relative rounded-[2.6rem] border border-border bg-surface p-2.5">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-background">
          <header className="flex items-center gap-2.5 px-4 pb-4 pt-5">
            <img
              src="/brand/logo-64.webp"
              alt=""
              width={30}
              height={30}
              className="h-[30px] w-[30px] rounded-full bg-white p-[3px]"
              decoding="async"
            />
            <span className="font-display text-base font-bold tracking-tight">Uktam.ai</span>
            <span className="ml-auto flex items-center gap-2.5 text-foreground/85">
              <Sun className="h-[15px] w-[15px]" />
              <Info className="h-[15px] w-[15px]" />
              <Settings className="h-[15px] w-[15px]" />
            </span>
          </header>

          {/* Follows the turn being spoken, so the pills flip when the reply
              comes back. */}
          <div className="flex items-center gap-2 border-b border-border/60 px-3.5 pb-4">
            <LanguagePill code={current.from} active />
            <ArrowLeftRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <LanguagePill code={current.to} />
          </div>

          <div className="flex min-h-[318px] flex-col gap-3 px-3 py-4">
            {CONVERSATION.map((turn, i) => (
              <Turn key={i} turn={turn} visible={i < shown} />
            ))}
          </div>

          <div className="flex justify-center pb-7 pt-1">
            <div className="relative grid h-16 w-16 place-items-center rounded-full bg-primary">
              <Mic className="h-6 w-6 text-primary-foreground" />
              <span className="absolute inset-0 rounded-full border border-primary [animation:pulse-ring_2.4s_ease-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LanguagePill({ code, active = false }: { code: string; active?: boolean }) {
  return (
    <span
      lang={code}
      className={cn(
        "flex-1 truncate rounded-full px-3 py-2 text-center text-sm",
        active ? "bg-primary font-medium text-primary-foreground" : "bg-secondary text-foreground",
      )}
    >
      {byCode.get(code)?.script}
    </span>
  );
}

function Turn({ turn, visible }: { turn: (typeof CONVERSATION)[number]; visible: boolean }) {
  // Your turn sits left in blue; the reply comes back right in green.
  const outbound = turn.direction === "out";

  return (
    <article
      data-visible={visible || undefined}
      className={cn(
        "phone-turn max-w-[87%]",
        outbound ? "self-start bg-blue-deep" : "self-end bg-green-deep",
      )}
    >
      {/* What was heard, set quieter than what was said — the translation is
          the thing being reached for. */}
      <p lang={turn.from} className="text-[11px] leading-relaxed text-white/55">
        {turn.source}
      </p>

      <div className="mt-1.5 flex items-end gap-2">
        <p lang={turn.to} className="flex-1 text-[15px] font-semibold leading-relaxed text-white">
          {turn.target}
        </p>
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full",
            outbound ? "bg-primary" : "bg-emerald",
          )}
        >
          <Volume2 className={cn("h-4 w-4", outbound ? "text-white" : "text-green-deep")} />
        </span>
      </div>

      <p className="mt-2 font-mono text-[9px] text-white/45">
        ASR: {turn.asrMs}ms | Translation {turn.translateS}s
      </p>
    </article>
  );
}
