import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL, absoluteUrl } from "@/lib/site";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { Why } from "@/components/landing/Why";
import { Pipeline } from "@/components/landing/Pipeline";
import { Languages } from "@/components/landing/Languages";
import { Stack } from "@/components/landing/Stack";
import { Faq } from "@/components/landing/Faq";
import { CallToAction, Footer } from "@/components/landing/CallToAction";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Cursor } from "@/components/landing/Cursor";
import { DeferredFx, loadSplashCursor } from "@/components/fx/DeferredFx";
import { FAQ } from "@/components/landing/data";

const TITLE = "Uktam.ai — Offline Indic Speech Translation for Android";
const DESCRIPTION =
  "Real-time, fully offline speech-to-speech translation between Hindi, Kannada, Tamil and Telugu. Every model runs on your Android device — nothing leaves your phone.";

/**
 * The headline on a share card, which is not the headline on the page.
 *
 * `<title>` is written for a search result, where it sits under a URL in a list
 * of ten competing blue links and has to say what the thing is. An unfurl has
 * already been chosen — someone posted the link — so its title can name what
 * was built rather than sell the category.
 */
const SHARE_TITLE = "Uktam.ai — On-device Indic Speech Pipeline for Android";

/*
 * Both cards are rendered by a browser from the real design tokens and
 * webfonts, so the share card is the page rather than an approximation of it.
 * `bun run og` regenerates them; source is scripts/og-card.html.
 *
 * Two files, because animated og:image support is genuinely split and neither
 * half can be served by one asset:
 *
 *   - Slack, Discord, Telegram and iMessage animate a GIF, which is the only
 *     way an unfurl can show the thing this product does — the languages
 *     changing. They get the GIF.
 *   - Facebook and LinkedIn flatten it to the first frame, which is a complete
 *     settled card by construction, so they lose nothing but the motion.
 *   - X is the reason twitter:image is separately declared. Its card renderer
 *     will not animate a GIF either way and has historically been the one
 *     willing to reject an image outright rather than flatten it, so it is
 *     handed the PNG and given nothing to be fussy about.
 *
 * Absolute because og:image has to be — a relative one is ignored by every
 * crawler that matters — and resolved from the deployment rather than written
 * down, so it cannot point at a domain this build is not served from.
 */
const OG_IMAGE = absoluteUrl("/brand/og.gif");
const OG_IMAGE_STILL = absoluteUrl("/brand/og.png");

const OG_IMAGE_ALT =
  "Uktam.ai — Speak Hindi. Hear Tamil. No internet. The two Indic words cycle through the languages the app translates between.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: SHARE_TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:site_name", content: "Uktam.ai" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:type", content: "image/gif" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: OG_IMAGE_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SHARE_TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE_STILL },
      { name: "twitter:image:alt", content: OG_IMAGE_ALT },
      { name: "theme-color", content: "#0f1729" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Index,
});

/**
 * One @graph rather than two script tags, so the FAQ and the application are
 * explicitly the same page's data instead of two unrelated assertions.
 *
 * The FAQPage entries are mapped straight out of the FAQ array the section
 * renders from. That is not tidiness: Google requires the answer in the markup
 * to be the answer on the page, and the reliable way to guarantee that is for
 * there to be one copy of the text. Editing an answer cannot leave the
 * structured data behind.
 */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Uktam.ai",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Android 14+",
      description: DESCRIPTION,
      url: SITE_URL,
      // The still, not the GIF. Google Images and the rich-result renderers
      // want a frame they can crop, not an animation to sample.
      image: OG_IMAGE_STILL,
      license: "https://www.gnu.org/licenses/gpl-3.0.html",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      inLanguage: ["hi", "kn", "ta", "te"],
      author: {
        "@type": "Organization",
        name: "Uktam.ai",
        url: "https://github.com/ashb155/uktam",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
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
        <Faq />
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
