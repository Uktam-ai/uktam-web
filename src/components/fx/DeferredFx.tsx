import { Suspense, lazy, useEffect, useState, type ComponentType } from "react";

/**
 * Loads a decorative effect after the page is interactive, never during SSR.
 *
 * These components are all WebGL: they cannot render on the server, and none of
 * them is content. Bundling them into the entry chunk would put a fluid solver
 * in front of the hero text. Splitting them out keeps the critical bundle to
 * what the page actually needs to say something, and the effects arrive a beat
 * later without anyone waiting on them.
 */
export function DeferredFx<P extends object>({
  load,
  ...props
}: { load: () => Promise<{ default: ComponentType<P> }> } & P) {
  const [Component, setComponent] = useState<ComponentType<P> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // requestIdleCallback where available so the fetch never competes with
    // first paint; Safari still has no support for it.
    const start = () => {
      // Swallowed deliberately. These are decorations: if the chunk fails to
      // arrive the page is still entirely usable, and an unhandled rejection
      // would be noise reporting that an ornament is missing.
      load()
        .then((module) => {
          if (!cancelled) setComponent(() => module.default);
        })
        .catch(() => {});
    };
    // Typed as optional deliberately: the DOM lib declares it as always
    // present, but Safari has never shipped it.
    const idle = (window as { requestIdleCallback?: typeof window.requestIdleCallback })
      .requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 2000 }) : window.setTimeout(start, 400);
    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback?.(handle as number);
      else clearTimeout(handle as number);
    };
  }, [load]);

  if (!Component) return null;
  return (
    <Suspense fallback={null}>
      <Component {...(props as P)} />
    </Suspense>
  );
}

/** Kept beside the loader so each effect has exactly one import site. */
export const loadSplashCursor = () => import("./SplashCursor");
export const loadFerrofluid = () => import("./Ferrofluid");

/** Lazily loaded, but referenced enough to be worth a stable identity. */
export const LazySpecularButton = lazy(() => import("./SpecularButton"));
