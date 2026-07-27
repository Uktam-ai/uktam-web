import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL, absoluteUrl } from "@/lib/site";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { Why } from "@/components/landing/Why";
import { Pipeline } from "@/components/landing/Pipeline";
import { Languages } from "@/components/landing/Languages";
import { Stack } from "@/components/landing/Stack";
import { CallToAction, Footer } from "@/components/landing/CallToAction";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Cursor } from "@/components/landing/Cursor";
import { DeferredFx, loadSplashCursor } from "@/components/fx/DeferredFx";

const TITLE = "Uktam.ai — Offline Indic Speech Translation for Android";
const DESCRIPTION =
  "Real-time, fully offline speech-to-speech translation between Hindi, Kannada, Tamil and Telugu. Every model runs on your Android device — nothing leaves your phone.";

// Rendered by the browser from the real design tokens and webfonts, so the
// share card is the page rather than an approximation of it. Source and
// regeneration steps are in DESIGN.md.
//
// Absolute because og:image has to be — a relative one is ignored by every
// crawler that matters — and resolved from the deployment rather than written
// down, so it cannot point at a domain this build is not served from.
const OG_IMAGE = absoluteUrl("/brand/og.png");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:site_name", content: "Uktam.ai" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Uktam.ai — Speak Hindi. Hear Tamil. No internet.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "theme-color", content: "#0f1729" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Index,
});

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Uktam.ai",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Android 14+",
  description: DESCRIPTION,
  url: SITE_URL,
  image: OG_IMAGE,
  license: "https://www.gnu.org/licenses/gpl-3.0.html",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  inLanguage: ["hi", "kn", "ta", "te"],
  author: {
    "@type": "Organization",
    name: "Uktam.ai",
    url: "https://github.com/ashb155/uktam",
  },
};

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SmoothScroll />
      <DeferredFx load={loadSplashCursor} />
      <Cursor />
      {/*
        First focusable element in the document, so keyboard and switch users
        can clear the nav in one Tab instead of walking every link in it.
      */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <MarqueeStrip />
        <Why />
        <Pipeline />
        <Languages />
        <Stack />
        <CallToAction />
      </main>

      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    </div>
  );
}
