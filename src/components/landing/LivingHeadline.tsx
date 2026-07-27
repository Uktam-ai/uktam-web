import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

import { HEADLINE_PAIRS, LANGUAGES } from "./data";

const SWAP_INTERVAL_MS = 2800;

const byCode = new Map(LANGUAGES.map((language) => [language.code, language]));

/**
 * The headline demonstrates the product instead of describing it: the two
 * script words cycle through real translation directions, and the caption
 * beneath names the pair currently on screen.
 *
 * Both slots are `inline-grid` with every script stacked in one cell, so the
 * slot is always as wide as its widest member and swapping never reflows the
 * headline. Getting this wrong would put layout shift in the largest element
 * on the page.
 */
export function LivingHeadline() {
  const reduced = usePrefersReducedMotion();
  const [pair, setPair] = useState({ current: 0, previous: -1 });

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setPair((state) => ({
        current: (state.current + 1) % HEADLINE_PAIRS.length,
        previous: state.current,
      }));
    }, SWAP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const active = HEADLINE_PAIRS[pair.current];
  const previous = pair.previous >= 0 ? HEADLINE_PAIRS[pair.previous] : null;

  return (
    <div>
      <h1 className="hero-headline">
        <span className="block">
          Speak{" "}
          <ScriptSwap
            activeCode={active.from}
            previousCode={previous?.from}
            label="source language"
            tone="source"
          />
        </span>
        <span className="block">
          Hear{" "}
          <ScriptSwap
            activeCode={active.to}
            previousCode={previous?.to}
            label="target language"
            tone="target"
          />
        </span>
        {/*
          Deliberately not gradient-filled. In this headline colour means
          language — cyan is the source, green the target — so tinting the
          English clause too would drain that of meaning. The rule directly
          beneath carries the emphasis instead.
        */}
        <span className="block">No internet.</span>
      </h1>

      {/*
        The rule is the thesis: an unbroken line under the whole exchange,
        because nothing crossed the device boundary. It reappears as the
        pipeline connector further down the page.
      */}
      <div className="hero-rule" aria-hidden />

      <p className="mono-label mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
        {/*
          Keyed on the pair so each change remounts and replays the fade. A
          plain text swap lands instantly while the scripts above take 420ms,
          and the caption visibly announces the new language before the word
          itself arrives.
        */}
        <span key={`${active.from}-${active.to}`} className="caption-swap">
          <span className="text-cyan">{byCode.get(active.from)?.name}</span>
          <span aria-hidden> &rarr; </span>
          <span className="text-emerald">{byCode.get(active.to)?.name}</span>
        </span>
        {/* Decorative, hence aria-hidden and exempt from contrast — but at the
            border token's 11% it was invisible rather than subtle. */}
        <span aria-hidden className="text-foreground/30">
          /
        </span>
        <span>translated on device</span>
      </p>
    </div>
  );
}

function ScriptSwap({
  activeCode,
  previousCode,
  label,
  tone,
}: {
  activeCode: string;
  previousCode?: string;
  label: string;
  /** Maps onto the app's own colour semantics: outbound blue, reply green. */
  tone: "source" | "target";
}) {
  return (
    <span
      className="script-swap"
      role="img"
      aria-label={`${byCode.get(activeCode)?.name}, ${label}`}
    >
      {LANGUAGES.map((language) => {
        const state =
          language.code === activeCode
            ? "active"
            : language.code === previousCode
              ? "out"
              : "waiting";
        return (
          <span
            key={language.code}
            lang={language.code}
            aria-hidden
            data-state={state}
            data-tone={tone}
            className={cn("script-swap-item")}
          >
            {/* The full stop rides inside the slot. Left outside, it would sit
                against the widest script's edge and float away from a short
                one. */}
            {language.script}.
          </span>
        );
      })}
    </span>
  );
}
