/**
 * Resolves the origin this build will be served from, and writes the two static
 * files that have to embed it as an absolute URL.
 *
 * Kept out of vite.config.ts so the resolution order is stated in one place and
 * can be read without wading through plugin wiring.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every build to the project's
 * production domain, without a scheme. It is the .vercel.app subdomain until a
 * custom domain is attached to the project and the shortest custom domain from
 * then on — which is exactly the switch we want to happen by itself.
 */
export function resolveSiteUrl() {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(withScheme(explicit));

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return stripTrailingSlash(withScheme(vercel));

  return "http://localhost:8080";
}

function withScheme(host) {
  return /^https?:\/\//i.test(host) ? host : `https://${host}`;
}

function stripTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const robots = (siteUrl) => `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

const sitemap = (siteUrl) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

/** Writes both files into public/, where the dev server and the build both read from. */
export async function writeSiteFiles(siteUrl) {
  const dir = join(ROOT, "public");
  await mkdir(dir, { recursive: true });
  await Promise.all([
    writeFile(join(dir, "robots.txt"), robots(siteUrl), "utf8"),
    writeFile(join(dir, "sitemap.xml"), sitemap(siteUrl), "utf8"),
  ]);
}
