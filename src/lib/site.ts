/**
 * The origin this deployment is actually reachable at.
 *
 * Every absolute URL the page emits — canonical, og:url, og:image, the JSON-LD
 * `url`, robots.txt's sitemap directive and the sitemap's own <loc> — has to
 * agree with it, and all of them are wrong in a way that matters if it points
 * somewhere that does not resolve: a canonical to a dead host asks Google to
 * index a URL that is not there, and an og:image on a dead host is a share card
 * that renders blank.
 *
 * So it is not hardcoded. `__SITE_URL__` is substituted at build time in
 * vite.config.ts, which prefers, in order:
 *
 *   1. SITE_URL, if it is set explicitly
 *   2. VERCEL_PROJECT_PRODUCTION_URL, which Vercel sets for every build to the
 *      project's production domain — the .vercel.app one until a custom domain
 *      is attached, and the custom domain from then on
 *   3. localhost, for a local build
 *
 * The consequence worth knowing: attaching uktam.ai in the Vercel dashboard and
 * redeploying is the entire migration. There is no constant to remember to come
 * back and change.
 */
declare const __SITE_URL__: string;

export const SITE_URL: string = __SITE_URL__;

/** Absolute URL for a root-relative path, e.g. `/brand/og.png`. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
