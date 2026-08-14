import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Github, Menu, X } from "lucide-react";

import { onTick } from "@/lib/ticker";

import { PLAY_STORE_URL, GITHUB_URL } from "./data";

const LINKS = [
  { href: "#why", label: "Why" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#languages", label: "Languages" },
  { href: "#stack", label: "Stack" },
  { href: "#faq", label: "FAQ" },
];

/** Matches the `md` breakpoint the section links appear at. */
const DESKTOP_QUERY = "(width >= 48rem)";

export function Nav() {
  const headerRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const sheetId = useId();

  const closeMenu = useCallback((returnFocus = false) => {
    setMenuOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Escape closes and hands focus back; a tap outside just closes. Both are
  // bound only while the sheet is open, so the shut nav costs no listeners.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      const header = headerRef.current;
      if (header && !header.contains(event.target as Node)) closeMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen, closeMenu]);

  // Rotating a phone to landscape can cross into the desktop layout, where the
  // sheet is display:none and its open state would be stranded — the links are
  // back in the bar but the toggle still reports itself as expanded.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

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
    <header ref={headerRef} data-menu-open={menuOpen || undefined} className="site-nav">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Uktam.ai, back to top">
          {/*
            The mark is drawn in blues, greens and violets that all sit close to
            the dark canvas in lightness, so unbacked it read as a smudge at
            32px. Same white disc the phone mockup puts behind it, for the same
            reason — and the rosette's outline is itself near-circular, so a
            circle wastes less of the chip than a rounded square would.
          */}
          <img
            src="/brand/mandala.svg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full bg-white p-[3px]"
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

        {/* gap-2.5 from `sm`, where the badge grows to h-9: Google asks for
            clear space of a quarter the badge height, which is 9px there and
            8px below it. */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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
          {/*
            Google's own badge rather than a styled button. It is the artwork
            people scan for, and Play's brand terms require it be used as
            shipped — so no tint, no rounding and no border of ours over it.
            The badge already carries its own #a6a6a6 outline, which is what
            keeps a black plate legible against this canvas.
          */}
          <a
            href={PLAY_STORE_URL}
            data-cursor="hover"
            target="_blank"
            rel="noreferrer"
            // No aria-label here. It would win the accessible name over the
            // badge's alt, and "Get Uktam.ai on Google Play" does not contain
            // the words rendered in the artwork — WCAG 2.5.3 Label in Name, so
            // a speech-input user asking for the control they can read would
            // miss it. The alt names the link instead, and matches the badge.
            className="inline-block transition-transform duration-(--duration-fast) ease-(--ease-snap) hover:scale-[1.03]"
          >
            <img
              src="/brand/google-play-badge.svg"
              alt="Get it on Google Play"
              width={135}
              height={40}
              // 32px tall is 108px wide, which clears Google's 60px minimum
              // and still leaves the toggle room on a 320px screen.
              className="h-8 w-auto sm:h-9"
              decoding="async"
            />
          </a>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={sheetId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="nav-toggle relative md:hidden"
          >
            {menuOpen ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <Menu className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {/*
        Rendered on every width but never reachable at `md` and up: `md:hidden`
        takes it out of layout entirely, so the desktop bar is unchanged.
      */}
      <div id={sheetId} data-open={menuOpen || undefined} className="nav-sheet md:hidden">
        <ul className="mx-auto w-full max-w-6xl px-5 pb-3 sm:px-8">
          {LINKS.map((link, i) => (
            <li key={link.href}>
              <a
                href={link.href}
                data-index={String(i + 1).padStart(2, "0")}
                onClick={() => closeMenu()}
                className="nav-sheet-link"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-px w-full bg-border/60">
        <div ref={progressRef} className="site-nav-progress" />
      </div>
    </header>
  );
}
