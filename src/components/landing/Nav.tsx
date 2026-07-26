import { useEffect, useRef } from "react";
import { Github } from "lucide-react";

import { onTick } from "@/lib/ticker";

import { PLAY_STORE_URL, GITHUB_URL } from "./data";

const LINKS = [
  { href: "#why", label: "Why" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#languages", label: "Languages" },
  { href: "#stack", label: "Stack" },
];

export function Nav() {
  const headerRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const header = headerRef.current;
    const progress = progressRef.current;
    if (!header || !progress) return;

    // Cached because reading scrollHeight forces a layout, and the old code did
    // it on every single scroll event.
    let maxScroll = 0;
    const measure = () => {
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    };
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.documentElement);

    let lastCondensed: boolean | null = null;
    let lastProgress = -1;

    const stop = onTick(() => {
      const y = window.scrollY;

      const condensed = y > 40;
      if (condensed !== lastCondensed) {
        lastCondensed = condensed;
        header.toggleAttribute("data-condensed", condensed);
      }

      // Rounded so we only touch the DOM when the bar visibly moves.
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;
      const rounded = Math.round(ratio * 1000) / 1000;
      if (rounded !== lastProgress) {
        lastProgress = rounded;
        // scaleX, not width — width is a layout property and animating it
        // reflows the header on every frame.
        progress.style.transform = `scaleX(${rounded})`;
      }
    });

    return () => {
      stop();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <header ref={headerRef} className="site-nav">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Uktam.ai, back to top">
          <img
            src="/brand/mandala.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
            decoding="async"
          />
          <span className="font-display text-[15px] font-bold tracking-tight">
            Uktam<span className="text-muted-foreground">.ai</span>
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="nav-link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Uktam.ai on GitHub"
            // Dropped on the narrowest screens so the primary action keeps its
            // full label; the same link sits in the footer.
            className="hidden h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors duration-(--duration-fast) hover:border-primary/50 hover:text-foreground sm:grid"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href={PLAY_STORE_URL}
            data-cursor="hover"
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap rounded-lg bg-gradient-hero px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform duration-(--duration-fast) ease-(--ease-snap) hover:scale-[1.03] sm:px-4 sm:text-[13px]"
          >
            Get on Play Store
          </a>
        </div>
      </nav>

      <div className="h-px w-full bg-border/60">
        <div ref={progressRef} className="site-nav-progress" />
      </div>
    </header>
  );
}
