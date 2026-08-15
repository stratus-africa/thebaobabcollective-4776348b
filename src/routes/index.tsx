import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { FoundersStrip } from "@/components/site/FoundersStrip";
import { TrustStrip } from "@/components/site/TrustStrip";
import { FindYourJourney } from "@/components/site/FindYourJourney";
import { WhyBaobab } from "@/components/site/WhyBaobab";
import { JourneyImpact } from "@/components/site/JourneyImpact";
import { HowItWorks } from "@/components/site/HowItWorks";
import { InstagramStrip } from "@/components/site/Instagram";
import { TestimonialsStrip } from "@/components/site/TestimonialsStrip";
import { FinalCta } from "@/components/site/FinalCta";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";
import heroBaobab from "@/assets/hero-baobab.jpg";

export const Route = createFileRoute("/")({
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
  const pageContentFn = useServerFn(getPageContent);

  const { data: heroData } = useQuery({
    queryKey: ["page-content", "home"],
    queryFn: () => pageContentFn({ data: { key: "home" } }),
    staleTime: 60_000,
  });
  const heroContent = usePreviewMerge("home", { ...PAGE_DEFAULTS.home, ...(heroData ?? {}) });

  const { data: foundersData } = useQuery({
    queryKey: ["page-content", "home_founders"],
    queryFn: () => pageContentFn({ data: { key: "home_founders" } }),
    staleTime: 60_000,
  });

  const { data: trustData } = useQuery({
    queryKey: ["page-content", "home_trust"],
    queryFn: () => pageContentFn({ data: { key: "home_trust" } }),
    staleTime: 60_000,
  });

  const { data: findJourneyData } = useQuery({
    queryKey: ["page-content", "home_find_journey"],
    queryFn: () => pageContentFn({ data: { key: "home_find_journey" } }),
    staleTime: 60_000,
  });

  const { data: whyBaobabData } = useQuery({
    queryKey: ["page-content", "home_why_baobab"],
    queryFn: () => pageContentFn({ data: { key: "home_why_baobab" } }),
    staleTime: 60_000,
  });

  const { data: impactData } = useQuery({
    queryKey: ["page-content", "home_impact"],
    queryFn: () => pageContentFn({ data: { key: "home_impact" } }),
    staleTime: 60_000,
  });

  const { data: howItWorksData } = useQuery({
    queryKey: ["page-content", "home_how_it_works"],
    queryFn: () => pageContentFn({ data: { key: "home_how_it_works" } }),
    staleTime: 60_000,
  });

  const { data: instagramData } = useQuery({
    queryKey: ["page-content", "home_instagram"],
    queryFn: () => pageContentFn({ data: { key: "home_instagram" } }),
    staleTime: 60_000,
  });

  const { data: finalCtaData } = useQuery({
    queryKey: ["page-content", "home_final_cta"],
    queryFn: () => pageContentFn({ data: { key: "home_final_cta" } }),
    staleTime: 60_000,
  });

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        {/* 01. Hero */}
        <Hero content={heroContent} />

        {/* 02. Trust Strip */}
        <TrustStrip content={trustData} />

        {/* 03. Founders */}
        <FoundersStrip content={foundersData} />

        {/* 04. Find Your Journey */}
        <FindYourJourney content={findJourneyData} />

        {/* 05. Why Baobab */}
        <WhyBaobab content={whyBaobabData} />

        {/* 06. Testimonials — social proof */}
        <TestimonialsStrip />

        {/* 07. Journey Impact */}
        <JourneyImpact content={impactData} />

        {/* 08. How It Works */}
        <HowItWorks content={howItWorksData} />

        {/* 09. Instagram */}
        <InstagramStrip content={instagramData} />

        {/* 10. Final CTA */}
        <FinalCta content={finalCtaData} />
      </main>
      <Footer />
    </div>
  );
}
