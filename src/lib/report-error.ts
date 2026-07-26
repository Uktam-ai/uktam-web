type ErrorContext = Record<string, unknown>;

/**
 * Turns a thrown value into a readable message. Loaders and server functions
 * commonly throw a raw `Response`, whose `String()` form is the opaque
 * "[object Response]" — pull out the status and URL instead.
 */
export function describeThrown(error: unknown): string {
  if (error instanceof Response) {
    return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Client-side sink for errors caught by a React error boundary. Production
 * React does not rethrow boundary-caught errors to `window.onerror`, so
 * without this they would vanish silently.
 */
export function reportRuntimeError(error: unknown, context: ErrorContext = {}): void {
  if (typeof window === "undefined") return;

  console.error("[uktam]", describeThrown(error), {
    route: window.location.pathname,
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
