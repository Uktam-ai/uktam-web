import { Marquee } from "./Marquee";
import { LANGUAGES } from "./data";

/**
 * A single full-bleed band of native scripts between the hero and the argument.
 *
 * There was a second strip of tech-stack names running the other way. Two
 * marquees in opposite directions is noise, and the stack is already listed
 * properly further down the page — this strip is here to let the scripts be
 * seen at size, and nothing else.
 */
export function MarqueeStrip() {
  return (
    <section aria-hidden className="relative overflow-hidden border-y border-border py-10">
      <Marquee speed={28}>
        {LANGUAGES.concat(LANGUAGES).map((language, i) => (
          <span key={`${language.code}-${i}`} className="flex items-center gap-8 px-8">
            <span lang={language.code} className="font-display text-3xl font-bold sm:text-5xl">
              {language.script}
            </span>
            <span className="mono-label text-muted-foreground">{language.name}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
