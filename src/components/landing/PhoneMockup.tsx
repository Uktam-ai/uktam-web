import { useEffect, useRef, useState } from "react";
import { Mic, Volume2, WifiOff } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-reveal";

const SCRIPT = [
  { source: "मुझे स्टेशन का रास्ता बताइए", target: "ரயில் நிலையத்திற்கு வழி சொல்லுங்கள்" },
  { source: "यह ऐप इंटरनेट के बिना काम करता है", target: "இந்த ஆப் இணையம் இல்லாமல் வேலை செய்யும்" },
];

export function PhoneMockup() {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [translated, setTranslated] = useState("");
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      setTyped(SCRIPT[0].source);
      setTranslated(SCRIPT[0].target);
      return;
    }
    let cancelled = false;
    const line = SCRIPT[idx];
    setTyped("");
    setTranslated("");

    const run = async () => {
      for (let i = 1; i <= line.source.length; i++) {
        if (cancelled) return;
        setTyped(line.source.slice(0, i));
        await wait(55);
      }
      await wait(420);
      for (let i = 1; i <= line.target.length; i++) {
        if (cancelled) return;
        setTranslated(line.target.slice(0, i));
        await wait(38);
      }
      await wait(2400);
      if (!cancelled) setIdx((v) => (v + 1) % SCRIPT.length);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [idx, reduced]);

  useEffect(() => {
    if (reduced || !barsRef.current) return;
    let cancelled = false;
    const bars = Array.from(barsRef.current.querySelectorAll<HTMLElement>("span"));
    (async () => {
      const { animate } = await import("animejs");
      if (cancelled) return;
      bars.forEach((bar, i) => {
        animate(bar, {
          scaleY: [0.22, 1, 0.35],
          duration: 760 + (i % 5) * 130,
          ease: "inOutQuad",
          loop: true,
          alternate: true,
          delay: i * 45,
        });
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  return (
    <div className="relative mx-auto w-[298px] sm:w-[326px]">
      <div className="absolute -inset-10 rounded-[3rem] bg-gradient-hero opacity-25 blur-3xl" />
      <div className="relative rounded-[2.6rem] border border-border bg-surface p-2.5 shadow-elevated">
        <div className="relative overflow-hidden rounded-[2.1rem] border border-border bg-background">
          <div className="flex items-center justify-between px-5 pt-4 mono-label text-muted-foreground">
            <span>9:41</span>
            <span className="flex items-center gap-1.5 text-emerald">
              <WifiOff className="h-3 w-3" /> offline
            </span>
          </div>

          <div className="px-5 pb-6 pt-6">
            <div className="flex items-center justify-between">
              <span className="mono-label text-primary">Hindi → Tamil</span>
              <span className="rounded-full border border-emerald/40 px-2 py-0.5 text-[10px] font-medium text-emerald">
                on-device
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
              <p className="mono-label text-muted-foreground">Heard</p>
              <p className="mt-2 min-h-[3.5rem] text-[15px] leading-relaxed text-foreground">
                {typed}
                <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary" />
              </p>
            </div>

            <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <p className="mono-label text-primary">Translated</p>
              <p className="mt-2 min-h-[3.5rem] text-[15px] leading-relaxed text-foreground">
                {translated}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Volume2 className="h-3.5 w-3.5 text-emerald" /> speaking aloud
              </div>
            </div>

            <div ref={barsRef} className="mt-6 flex h-12 items-center justify-center gap-[3px]">
              {Array.from({ length: 26 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-gradient-hero"
                  style={{ height: `${14 + ((i * 7) % 30)}px` }}
                />
              ))}
            </div>

            <div className="mt-5 flex justify-center">
              <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-hero glow-primary">
                <Mic className="h-6 w-6 text-primary-foreground" />
                <span className="absolute inset-0 rounded-full border border-primary/60 [animation:pulse-ring_2.4s_ease-out_infinite]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
