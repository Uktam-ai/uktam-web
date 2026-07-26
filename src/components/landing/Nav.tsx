import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { PLAY_STORE_URL, GITHUB_URL } from "./data";

const LINKS = [
  { href: "#why", label: "Why" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#languages", label: "Languages" },
  { href: "#stack", label: "Stack" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (y / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled ? "border-b border-border bg-background/72 backdrop-blur-xl" : ""
      }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-hero text-[13px] font-bold text-primary-foreground">
            U
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight">
            Uktam<span className="text-muted-foreground">.ai</span>
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="relative text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-gradient-hero after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:after:origin-left hover:after:scale-x-100"
              >
                {l.label}
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
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href={PLAY_STORE_URL}
            data-cursor="hover"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-gradient-hero px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Get on Play Store
          </a>
        </div>
      </nav>
      <div className="h-px w-full bg-border/60">
        <div
          className="h-px bg-gradient-hero transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
