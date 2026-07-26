import { Marquee } from "./Marquee";
import { LANGUAGES } from "./data";

const TECH = [
  "Kotlin",
  "Jetpack Compose",
  "Sherpa-ONNX",
  "IndicConformer",
  "llama.cpp",
  "Sarvam Translate",
  "GGUF Q4_K_S",
  "Android NDK",
  "Play Asset Delivery",
  "GPL-3.0",
];

/** Full-bleed double marquee: native scripts one way, tech stack the other. */
export function MarqueeStrip() {
  return (
    <section aria-hidden className="relative overflow-hidden border-y border-border py-8">
      <Marquee speed={26}>
        {LANGUAGES.concat(LANGUAGES).map((l, i) => (
          <span key={`${l.code}-${i}`} className="flex items-center gap-8 px-8">
            <span className="font-display text-3xl font-bold sm:text-5xl">{l.script}</span>
            <span className="mono-label text-muted-foreground">{l.name}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
        ))}
      </Marquee>

      <Marquee speed={34} reverse className="mt-6">
        {TECH.map((t) => (
          <span key={t} className="flex items-center gap-6 px-6">
            <span className="mono-label text-muted-foreground">{t}</span>
            <span className="text-muted-foreground/40">/</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
