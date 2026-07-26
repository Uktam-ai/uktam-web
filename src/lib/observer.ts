/**
 * Shared IntersectionObservers, pooled by configuration.
 *
 * Every `<Reveal>` used to construct its own observer, which put roughly thirty
 * of them on the page. Observers with identical options can watch any number of
 * elements, so we keep one per distinct config and hand out subscriptions.
 */

type IntersectCallback = (entry: IntersectionObserverEntry) => void;

type Pool = {
  observer: IntersectionObserver;
  callbacks: Map<Element, IntersectCallback>;
};

const pools = new Map<string, Pool>();

function getPool(threshold: number, rootMargin: string): Pool {
  const key = `${threshold}|${rootMargin}`;
  const existing = pools.get(key);
  if (existing) return existing;

  const callbacks = new Map<Element, IntersectCallback>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) callbacks.get(entry.target)?.(entry);
    },
    { threshold, rootMargin },
  );

  const pool: Pool = { observer, callbacks };
  pools.set(key, pool);
  return pool;
}

export type ObserveOptions = {
  threshold?: number;
  rootMargin?: string;
  /** Stop observing after the first intersection. Defaults to true. */
  once?: boolean;
};

/**
 * Watches an element. Returns an unsubscribe function.
 *
 * When IntersectionObserver is unavailable the callback fires immediately with
 * `isIntersecting: true`, so content is never left in its hidden state.
 */
export function observe(
  element: Element,
  callback: IntersectCallback,
  { threshold = 0.18, rootMargin = "0px 0px -8% 0px", once = true }: ObserveOptions = {},
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    callback({ target: element, isIntersecting: true } as IntersectionObserverEntry);
    return () => {};
  }

  const pool = getPool(threshold, rootMargin);

  const handler: IntersectCallback = (entry) => {
    callback(entry);
    if (once && entry.isIntersecting) unsubscribe();
  };

  const unsubscribe = () => {
    pool.callbacks.delete(element);
    pool.observer.unobserve(element);
  };

  pool.callbacks.set(element, handler);
  pool.observer.observe(element);
  return unsubscribe;
}
