import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// @ts-expect-error -- plain .mjs helper, shared with the build; no types needed.
import { resolveSiteUrl, writeSiteFiles } from "./scripts/site-url.mjs";

// Plugin order matters: Tailwind and path resolution run before Start's route
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
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
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
    plugins.push(nitro({ defaultPreset: "cloudflare-module" }));
  }

  plugins.push(viteReact());

  return {
    plugins,
    define: {
      __SITE_URL__: JSON.stringify(siteUrl),
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      // React and Query must each resolve to a single copy — duplicates break
      // hooks and split the query cache across the SSR/client boundary.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
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
