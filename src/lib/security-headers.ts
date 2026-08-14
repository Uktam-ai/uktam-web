/**
 * Headers every response carries, in one place because two things need them.
 *
 * `src/server.ts` applies these to anything the SSR handler returns. That
 * covers the HTML and nothing else: on the Vercel preset the build emits a
 * `handle: filesystem` route ahead of the function, so `/fonts/*.woff2`,
 * `/brand/*` and `robots.txt` are served by the platform and never touch our
 * code. `vite.config.ts` feeds the same object to Nitro's route rules so those
 * static responses are covered too, and `nosniff` in particular is worth
 * having on a font or an image rather than only on the page that asks for it.
 *
 * Deliberately no Content-Security-Policy. The shell inlines a synchronous
 * script to set the `.js` class before first paint, and the page inlines
 * JSON-LD; both are blocked by any `script-src` short of `'unsafe-inline'`,
 * which would make the policy decorative. A real CSP needs a per-request nonce
 * threaded through the shell — worth doing, but a behaviour change rather than
 * a header, so it is not smuggled in here.
 *
 * Everything below is inert for a site that ships no frames, no cross-origin
 * embeds and no camera/mic/geolocation use.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};
