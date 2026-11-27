import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";

import { SECURITY_HEADERS } from "./src/lib/security-headers";

// @ts-expect-error -- plain .mjs helper, shared with the build; no types needed.
import { resolveSiteUrl, writeSiteFiles } from "./scripts/site-url.mjs";

// Plugin order matters: Tailwind runs before Start's route
// and server transforms, and the React plugin comes last so it sees the
// already-transformed output.
export default defineConfig(async ({ command }) => {
  // Resolved once per build and substituted into the bundle as __SITE_URL__.
  // See src/lib/site.ts for why this is not a constant in the source.
  const siteUrl: string = resolveSiteUrl();

  const plugins: PluginOption[] = [
    {
      name: "uktam:site-files",
      // robots.txt and sitemap.xml both embed the origin as an absolute URL, so
      // they are generated rather than committed — a checked-in copy is a
      // second place for the domain to be wrong. Written into public/ so the
      // dev server and the production build pick them up the same way.
      async buildStart() {
        await writeSiteFiles(siteUrl);
      },
      async configureServer() {
        await writeSiteFiles(siteUrl);
      },
    },
    tailwindcss(),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      // Point Start's bundled server entry at src/server.ts, our SSR error wrapper.
      server: { entry: "server" },
    }),
  ];

  // Nitro only participates in production builds; loading it during `dev`
  // costs startup time for no benefit.
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(
      nitro({
        // A fallback, not a decision: Nitro detects Vercel in CI and picks its
        // own preset there. This is what a local `bun run build` targets, and
        // what `bun run preview` expects wrangler to serve.
        defaultPreset: "cloudflare-module",
        /*
         * src/server.ts already stamps these on anything SSR returns, which is
         * the HTML and nothing else — the Vercel build emits a `filesystem`
         * route ahead of the function, so fonts, brand images and robots.txt
         * are served by the platform and never reach our handler. This rule
         * lands ahead of that route and covers them. Same object either way,
         * so the two cannot drift, and both use `set` so neither doubles up.
         *
         * Vercel only. The cloudflare-module fallback binds Workers Assets
         * without `run_worker_first`, so there the static paths are served
         * before any of our code runs and this never executes. Production is
         * Vercel, so that gap is theoretical — but it is a gap.
         */
        routeRules: { "/**": { headers: { ...SECURITY_HEADERS } } },
      }),
    );
  }

  plugins.push(viteReact());

  return {
    plugins,
    define: {
      __SITE_URL__: JSON.stringify(siteUrl),
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      // React must resolve to a single copy — duplicates break hooks.
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: { host: "::", port: 8080 },
  };
});
