import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { FoundersStrip } from "@/components/site/FoundersStrip";
import { TrustStrip } from "@/components/site/TrustStrip";
import { WhyBaobab } from "@/components/site/WhyBaobab";
const FindYourJourney = lazy(() => import("@/components/site/FindYourJourney").then((m) => ({ default: m.FindYourJourney })));
import { JourneyImpact } from "@/components/site/JourneyImpact";
import { HowItWorks } from "@/components/site/HowItWorks";
const InstagramStrip = lazy(() => import("@/components/site/Instagram").then((m) => ({ default: m.InstagramStrip })));
const TestimonialsStrip = lazy(() => import("@/components/site/TestimonialsStrip").then((m) => ({ default: m.TestimonialsStrip })));
import { getPageContents } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import heroBaobab from "@/assets/hero-baobab.jpg";

const HOME_CONTENT_KEYS = [
  "home",
  "home_founders",
  "home_trust",
  "home_why_baobab",
  "home_final_cta",
  "home_find_journey",
  "home_impact",
  "home_how_it_works",
  "home_instagram",
] as const;

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["page-content-batch", "home"],
      queryFn: () => getPageContents({ data: { keys: [...HOME_CONTENT_KEYS] } }),
      staleTime: 10 * 60_000,
    });
  },
  head: () => ({
    meta: [
      { title: "The Baobab Collective — Private Kenya Safaris & Tailor-Made Journeys" },
      {
        name: "description",
        content:
          "Private Kenya safari journeys designed with care, context and deep local knowledge. Walking safaris, wildlife, beach escapes and cultural encounters — all personally curated.",
      },
      { property: "og:title", content: "The Baobab Collective — Private Kenya Safaris" },
      {
        property: "og:description",
        content: "Bespoke wild adventures across Kenya — crafted personally by the Baobab Collective.",
      },
      { property: "og:image", content: heroBaobab },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});
function HomePage() {
  const { data: content } = useSuspenseQuery({
    queryKey: ["page-content-batch", "home"],
    queryFn: () => getPageContents({ data: { keys: [...HOME_CONTENT_KEYS] } }),
    staleTime: 10 * 60_000,
  });

  const heroContent = { ...PAGE_DEFAULTS.home, ...(content.home ?? {}) };
  const foundersData = content.home_founders;
  const trustData = content.home_trust;
  const whyBaobabData = content.home_why_baobab;
  const finalCtaData = content.home_final_cta;
  const findJourneyData = content.home_find_journey;
  const impactData = content.home_impact;
  const howItWorksData = content.home_how_it_works;
  const instagramData = content.home_instagram;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        {/* 01. Hero */}
        <Hero content={heroContent} />

        {/* 02. Trust Strip */}
        <TrustStrip content={trustData} />

        {/* 03. Why Baobab */}
        <WhyBaobab content={whyBaobabData} finalCtaContent={finalCtaData} />

        {/* 04. Founders */}
        <FoundersStrip content={foundersData} />

        {/* 05. Find Your Journey */}
        <Suspense fallback={<div className="min-h-[520px]" aria-hidden="true" />}>
          <FindYourJourney content={findJourneyData} />
        </Suspense>

        {/* 06. Guest Stories */}
        <Suspense fallback={<div className="min-h-[520px]" aria-hidden="true" />}>
          <TestimonialsStrip />
        </Suspense>

        {/* 07. Journey Impact */}
        <JourneyImpact content={impactData} />

        {/* 08. How It Works */}
        <HowItWorks content={howItWorksData} />

        {/* 09. Instagram */}
        <Suspense fallback={<div className="min-h-[320px]" aria-hidden="true" />}>
          <InstagramStrip content={instagramData} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
