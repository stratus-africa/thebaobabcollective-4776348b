import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { FoundersStrip } from "@/components/site/FoundersStrip";
import { TrustStrip } from "@/components/site/TrustStrip";
import { WhyBaobab } from "@/components/site/WhyBaobab";
import { FindYourJourney } from "@/components/site/FindYourJourney";
import { JourneyImpact } from "@/components/site/JourneyImpact";
import { HowItWorks } from "@/components/site/HowItWorks";
import { InstagramStrip } from "@/components/site/Instagram";
import { TestimonialsStrip } from "@/components/site/TestimonialsStrip";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import heroBaobab from "@/assets/hero-baobab.jpg";

const pageContentQuery = (key: keyof typeof PAGE_DEFAULTS) =>
  queryOptions({
    queryKey: ["page-content", key],
    queryFn: () => getPageContent({ data: { key } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(pageContentQuery("home")),
      context.queryClient.ensureQueryData(pageContentQuery("home_founders")),
      context.queryClient.ensureQueryData(pageContentQuery("home_trust")),
      context.queryClient.ensureQueryData(pageContentQuery("home_why_baobab")),
      context.queryClient.ensureQueryData(pageContentQuery("home_final_cta")),
      context.queryClient.ensureQueryData(pageContentQuery("home_find_journey")),
      context.queryClient.ensureQueryData(pageContentQuery("home_impact")),
      context.queryClient.ensureQueryData(pageContentQuery("home_how_it_works")),
      context.queryClient.ensureQueryData(pageContentQuery("home_instagram")),
    ]);
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
  const pageContentFn = useServerFn(getPageContent);

  const { data: heroData } = useSuspenseQuery(pageContentQuery("home"));
  const heroContent = { ...PAGE_DEFAULTS.home, ...(heroData ?? {}) };

  const { data: foundersData } = useSuspenseQuery(pageContentQuery("home_founders"));

  const { data: trustData } = useSuspenseQuery(pageContentQuery("home_trust"));

  const { data: whyBaobabData } = useSuspenseQuery(pageContentQuery("home_why_baobab"));

  const { data: finalCtaData } = useSuspenseQuery(pageContentQuery("home_final_cta"));

  const { data: findJourneyData } = useSuspenseQuery(pageContentQuery("home_find_journey"));

  const { data: impactData } = useSuspenseQuery(pageContentQuery("home_impact"));

  const { data: howItWorksData } = useSuspenseQuery(pageContentQuery("home_how_it_works"));

  const { data: instagramData } = useSuspenseQuery(pageContentQuery("home_instagram"));

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
        <FindYourJourney content={findJourneyData} />

        {/* 06. Guest Stories */}
        <TestimonialsStrip />

        {/* 07. Journey Impact */}
        <JourneyImpact content={impactData} />

        {/* 08. How It Works */}
        <HowItWorks content={howItWorksData} />

        {/* 09. Instagram */}
        <InstagramStrip content={instagramData} />
      </main>
      <Footer />
    </div>
  );
}
