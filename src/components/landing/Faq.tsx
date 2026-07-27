import { Reveal, SectionHeading } from "./Reveal";
import { FAQ } from "./data";

/**
 * Answers, all of them visible.
 *
 * Deliberately not an accordion. The usual reason to collapse an FAQ is that it
 * is long and nobody wants to scroll it, but eight answers are not long, and
 * collapsing them costs two things that matter more here than the vertical
 * space: a reader scanning for one specific worry — does it need a network, does
 * it upload my voice — has to open panels to find out which one to open, and an
 * answer engine reading the page gets content behind a control it will not
 * press. This section exists to be quoted, so it is legible without interaction.
 *
 * Built as a description list because that is what it is, and because Stack
 * already sets `dl` rows with hairline rules on this page — the shape is
 * established rather than invented for one section.
 */
export function Faq() {
  return (
    <section id="faq" className="relative border-t border-border py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          align="left"
          lead="Before you install."
          title="The questions people actually ask."
        />

        <dl className="mt-14 divide-y divide-border border-t border-border">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              {/*
                Question and answer sit side by side from `lg` up, where the
                measure would otherwise run past comfortable reading width; they
                stack below it. The index is decorative and sits outside both
                terms rather than inside the question text, so a screen reader
                reads the question and not "zero four".
              */}
              <div className="grid gap-3 py-7 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12">
                <dt className="flex gap-4">
                  <span aria-hidden className="mono-label pt-1 text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{item.q}</h3>
                </dt>
                <dd className="text-base leading-relaxed text-muted-foreground lg:pt-0.5">
                  {item.a}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
