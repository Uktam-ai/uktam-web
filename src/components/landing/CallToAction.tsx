import { Apple, Github } from "lucide-react";
import { Reveal } from "./Reveal";
import { GITHUB_URL, PLAY_STORE_URL } from "./data";

export function CallToAction() {
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div className="absolute inset-0 bg-gradient-hero opacity-[0.16]" />
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="relative mx-auto w-full max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-5xl">
            Translate anywhere.
            <br />
            <span className="text-gradient">Even with no signal.</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            Live on Google Play. Download once, download the models once, then never need a network
            again.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href={PLAY_STORE_URL}
              data-cursor="install"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-hero px-6 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-[filter,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:brightness-110 glow-primary"
            >
              Get it on Google Play
            </a>
            <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border px-6 py-3.5 font-display text-sm font-medium text-muted-foreground">
              <Apple className="h-4 w-4" />
              App Store — coming soon
            </span>
          </div>
        </Reveal>
        <Reveal delay={260}>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            Read the source on GitHub
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
        <p className="font-display text-sm font-bold">
          Uktam<span className="text-muted-foreground">.ai</span>
        </p>
        <p className="mono-label text-muted-foreground">
          GPL-3.0 · Models by AI4Bharat &amp; Sarvam AI
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
