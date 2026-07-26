import { useTilt } from "@/hooks/use-scroll-fx";
import { cn } from "@/lib/utils";

import { Reveal, SectionHeading } from "./Reveal";
import { PILLARS } from "./data";

/**
 * Four identical cards in a 2x2 grid would say all four decisions carry equal
 * weight. They don't — privacy is the entire argument and the other three are
 * how it was achieved. So the first pillar runs full width at a larger size and
 * the supporting three sit beneath it in a lighter treatment.
 */
export function Why() {
  const [lead, ...supporting] = PILLARS;

  return (
    <section id="why" className="relative border-t border-border py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          lead="Cloud translators send your voice away."
          title="This one never does."
          blurb="Four decisions shape the whole app: run locally, use Indic-native models, quantize hard, and never wait on a network."
        />

        <Reveal className="mt-16">
          <PillarCard {...lead} featured />
        </Reveal>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {supporting.map((pillar, i) => (
            <Reveal key={pillar.title} delay={90 + i * 90}>
              <PillarCard {...pillar} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({
  label,
  title,
  body,
  emerald,
  featured = false,
}: {
  label: string;
  title: string;
  body: string;
  emerald?: boolean;
  featured?: boolean;
}) {
  const ref = useTilt<HTMLElement>(featured ? 3 : 6);

  return (
    <article
      ref={ref}
      data-cursor="hover"
      className={cn(
        "card-ring tilt-card h-full overflow-hidden rounded-2xl",
        featured ? "p-8 sm:p-10" : "p-6",
      )}
    >
      <span
        className={cn("relative mono-label", emerald ? "text-emerald" : "text-muted-foreground")}
      >
        {label}
      </span>
      <h3 className={cn("relative mt-4", featured ? "text-2xl sm:text-3xl" : "text-lg")}>
        {title}
      </h3>
      <p
        className={cn(
          "relative mt-3 leading-relaxed text-muted-foreground",
          featured ? "max-w-[58ch] text-base" : "text-sm",
        )}
      >
        {body}
      </p>
    </article>
  );
}
