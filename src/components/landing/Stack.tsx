import { Plus } from "lucide-react";

import { Reveal, SectionHeading } from "./Reveal";
import { STACK, REQUIREMENTS, MODELS } from "./data";

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

          {/*
            No top offset. This column used to be pushed down 96px, which was
            fine when it held two short cards, but the model disclosures made it
            the taller of the two — the panels ran 166px past the bottom of the
            spec table beside them, and the section read as lopsided. Dropping
            the offset closes that to about 70px, which is as level as the two
            get without padding one of them to match, and it aligns the first
            card's top edge with the heading rather than with nothing.
          */}
          <div>
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
                <span className="mono-label text-emerald">The three models</span>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  One per stage, all of them resident on the device. Open any of them for what it is
                  and why it was chosen.
                </p>

                <div className="mt-6">
                  {MODELS.map((model) => (
                    <details key={model.name} className="model-disclosure">
                      <summary data-cursor="hover" className="model-summary">
                        <span>
                          <span className="block font-display text-[15px] font-semibold text-foreground">
                            {model.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {model.role}
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {model.meta}
                          </span>
                          <span aria-hidden className="model-marker">
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      </summary>
                      <div className="model-body">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {model.body}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
