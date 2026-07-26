import { createFileRoute } from "@tanstack/react-router";
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

const TITLE = "Uktam.ai — Offline Indic Speech Translation for Android";
const DESCRIPTION =
  "Real-time, fully offline speech-to-speech translation between Hindi, Kannada, Tamil and Telugu. Every model runs on your Android device — nothing leaves your phone.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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
  license: "https://www.gnu.org/licenses/gpl-3.0.html",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SmoothScroll />
      <Cursor />
      <Nav />
      <main>
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
