/**
 * One `pointermove` listener for the whole page.
 *
 * Magnetic buttons, the aurora and the cursor all need the pointer position.
 * Each attaching its own listener meant the browser dispatched the same event
 * to a handler per element; they now read from this shared, mutable position
 * inside the frame they already run in.
 */

export const pointer = { x: 0, y: 0, seen: false };

let refCount = 0;
let bound = false;

function onMove(event: PointerEvent) {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.seen = true;
}

/** Starts tracking (idempotent, ref-counted). Returns a release function. */
export function trackPointer(): () => void {
  if (typeof window === "undefined") return () => {};

  refCount += 1;
  if (!bound) {
    window.addEventListener("pointermove", onMove, { passive: true });
    bound = true;
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    refCount -= 1;
    if (refCount === 0 && bound) {
      window.removeEventListener("pointermove", onMove);
      bound = false;
      pointer.seen = false;
    }
  };
}

/** True for mouse and trackpad, false for touch. Pointer effects are opt-in. */
export function hasFinePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: fine)").matches;
}
