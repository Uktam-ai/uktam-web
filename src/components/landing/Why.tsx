import { Reveal, SectionHeading } from "./Reveal";
import { useTilt } from "@/hooks/use-scroll-fx";
import { PILLARS } from "./data";

export function Why() {
  return (
    <section id="why" className="relative border-t border-border py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="Why Uktam.ai"
          title="Cloud translators send your voice away."
          highlight="This one never does."
          blurb="Four decisions shape the whole app: run locally, use Indic-native models, quantize hard, and never wait on a network."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 90}>
              <PillarCard {...p} />
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
}: {
  label: string;
  title: string;
  body: string;
  emerald?: boolean;
}) {
  const ref = useTilt<HTMLElement>(6);
  return (
    <article
      ref={ref}
      data-cursor="hover"
      className="card-ring tilt-card h-full overflow-hidden rounded-2xl p-7"
    >
      <span className={`relative mono-label ${emerald ? "text-emerald" : "text-primary"}`}>
        {label}
      </span>
      <h3 className="relative mt-4 text-xl font-semibold">{title}</h3>
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}
