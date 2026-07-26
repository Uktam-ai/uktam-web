/**
 * One requestAnimationFrame loop for the whole page.
 *
 * Every pointer-reactive or scroll-reactive effect subscribes here instead of
 * opening its own loop. Before this existed the page ran six concurrent rAF
 * loops — the cursor, the aurora, scroll velocity, Lenis, and one per magnetic
 * element — each independently waking the compositor.
 *
 * The loop only runs while something is subscribed, and parks itself when the
 * tab is hidden.
 */

type TickFn = (time: number, delta: number) => void;

const subscribers = new Set<TickFn>();
let frame = 0;
let last = 0;

function loop(time: number) {
  const delta = last === 0 ? 16.67 : time - last;
  last = time;
  // Iterate a copy so a subscriber may unsubscribe from inside its own tick.
  for (const fn of [...subscribers]) fn(time, delta);
  frame = requestAnimationFrame(loop);
}

function start() {
  if (frame || subscribers.size === 0) return;
  last = 0;
  frame = requestAnimationFrame(loop);
}

function stop() {
  if (!frame) return;
  cancelAnimationFrame(frame);
  frame = 0;
}

let visibilityBound = false;

function bindVisibility() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
}

/** Subscribes to the shared loop. Returns an unsubscribe function. */
export function onTick(fn: TickFn): () => void {
  if (typeof window === "undefined") return () => {};
  bindVisibility();
  subscribers.add(fn);
  start();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) stop();
  };
}

/**
 * Frame-rate independent exponential smoothing.
 *
 * The usual `current += (target - current) * 0.1` is tied to frame rate: the
 * same code eases twice as fast on a 120Hz display. This compensates using the
 * real frame delta, so motion feels identical everywhere.
 *
 * @param smoothing Fraction of the remaining distance left after ~16.7ms.
 */
export function damp(current: number, target: number, smoothing: number, delta: number): number {
  return target + (current - target) * Math.exp((Math.log(smoothing) * delta) / 16.67);
}
