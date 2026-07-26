import { Reveal, SectionHeading } from "./Reveal";
import { STACK, REQUIREMENTS } from "./data";

export function Stack() {
  return (
    <section id="stack" className="relative border-t border-border py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              lead="Native Android,"
              title="native models."
              blurb="Built with modern Android practice and open research from AI4Bharat and Sarvam AI, compiled down to run on ordinary phone hardware."
            />

            <dl className="mt-10 divide-y divide-border border-y border-border">
              {STACK.map((row, i) => (
                <Reveal key={row.k} delay={i * 50}>
                  <div className="flex items-baseline justify-between gap-6 py-3.5">
                    <dt className="mono-label text-muted-foreground">{row.k}</dt>
                    <dd className="text-right text-sm font-medium">{row.v}</dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>

          <div className="lg:pt-24">
            <Reveal>
              <div className="rounded-3xl border border-border bg-surface/60 p-8">
                <span className="mono-label text-primary">Device requirements</span>
                <dl className="mt-6 space-y-4">
                  {REQUIREMENTS.map((r) => (
                    <div key={r.k} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">{r.k}</dt>
                      <dd className="text-right text-sm font-medium">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-5 rounded-3xl border border-border bg-background p-8">
                <span className="mono-label text-emerald">Dynamic model selection</span>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  The app sizes the translation model to your hardware so it never runs out of
                  memory:
                </p>
                <div className="mt-5 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                    <span className="text-muted-foreground">RAM &gt; 6 GB</span>
                    <span className="font-semibold text-foreground">Q4_K_S · higher accuracy</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span className="text-muted-foreground">RAM ≤ 6 GB</span>
                    <span className="font-semibold text-foreground">Q2_K · lighter footprint</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
