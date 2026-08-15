import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { TrustStrip } from "@/components/site/TrustStrip";
import { FindYourJourney } from "@/components/site/FindYourJourney";
import { HomeAdventures } from "@/components/site/HomeAdventures";
import { FoundersStrip } from "@/components/site/FoundersStrip";
import { HomeLodges } from "@/components/site/HomeLodges";
import { JourneyImpact } from "@/components/site/JourneyImpact";
import { TestimonialsStrip } from "@/components/site/TestimonialsStrip";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Journal } from "@/components/site/Journal";
import { InstagramStrip } from "@/components/site/Instagram";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { getPageContent } from "@/lib/page-content.functions";
import { getArticles } from "@/lib/cms.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [home, about, home_adventures, home_lodges, home_journal, home_instagram, footer, articles] =
      await Promise.all([
        getPageContent({ data: { key: "home" } }).catch(() => null),
        getPageContent({ data: { key: "about" } }).catch(() => null),
        getPageContent({ data: { key: "home_adventures" } }).catch(() => null),
        getPageContent({ data: { key: "home_lodges" } }).catch(() => null),
        getPageContent({ data: { key: "home_journal" } }).catch(() => null),
        getPageContent({ data: { key: "home_instagram" } }).catch(() => null),
        getPageContent({ data: { key: "footer" } }).catch(() => null),
        getArticles().catch(() => [] as any[]),
      ]);
    return {
      home,
      about,
      home_adventures,
      home_lodges,
      home_journal,
      home_instagram,
      footer,
      articles,
    };
  },
  head: () => ({
    meta: [
      { title: "The Baobab Collective — Kenya, Curated Personally" },
      {
        name: "description",
        content:
          "Private safaris, wild landscapes and meaningful encounters — thoughtfully designed around you with The Baobab Collective.",
      },
      { property: "og:title", content: "The Baobab Collective — Kenya, Curated Personally" },
      {
        property: "og:description",
        content:
          "Private Kenya safaris and bespoke African journeys shaped with care, context and genuine local knowledge.",
      },
    ],
  }),
  component: Index,
});

function WhyBaobab() {
  const pillars = [
    {
      num: "01",
      title: "Kenya is Home",
      body: "We're not simply selling Kenya from a desk abroad. We know its rhythms, seasons, guides, and secret corners personally.",
    },
    {
      num: "02",
      title: "Personally Curated",
      body: "Every journey is designed from scratch around you, your travelling party and your pace — never selected from a rigid catalogue.",
    },
    {
      num: "03",
      title: "Trusted Local Relationships",
      body: "Decades of friendship with conservationists, master trackers and private camp owners unlock encounters ordinary tourists never see.",
    },
    {
      num: "04",
      title: "Travel With Purpose",
      body: "Your journey directly contributes to wildlife conservation, anti-poaching, and empowering local community custodians.",
    },
  ];

  return (
    <section id="why-baobab" aria-labelledby="why-baobab-heading" className="bg-background py-18 md:py-24">
      <div className="mx-auto max-w-[1920px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 xl:gap-20 items-start">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-gold font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Quiet Expertise
            </p>
            <h2
              id="why-baobab-heading"
              className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-foreground"
            >
              Why The Baobab Collective?
            </h2>
            <p className="text-foreground/75 text-base sm:text-lg leading-relaxed pt-2">
              We operate as your personal Kenya travel designer and advisor — bringing deep local context, unhurried
              pacing, and genuine care to every moment of your adventure.
            </p>
          </div>

          <div className="divide-y divide-foreground/15 border-t border-foreground/15">
            {pillars.map((p) => (
              <div key={p.num} className="grid gap-4 py-6 sm:grid-cols-[70px_1fr] sm:py-7">
                <span className="font-serif text-3xl sm:text-4xl text-gold font-light">{p.num}</span>
                <div>
                  <h3 className="mb-2 text-[12px] uppercase tracking-[0.25em] font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="max-w-2xl leading-relaxed text-foreground/70 text-sm sm:text-base">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalHeroCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-cream py-20 md:py-28 text-center border-t border-border/40"
    >
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        <p className="text-[11px] tracking-[0.35em] uppercase text-terracotta font-semibold">Begin Your Journey</p>
        <h2
          id="final-cta-heading"
          className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.05]"
        >
          Your Kenya is waiting.
          <br />
          <span className="text-gold italic">Let's create it together.</span>
        </h2>
        <p className="text-foreground/75 text-base sm:text-lg leading-relaxed max-w-xl mx-auto pt-2">
          Tell us about your ideal travel dates and dreams. We'll respond within 24 hours with an initial private
          itinerary sketch.
        </p>
        <div className="pt-4">
          <EnquireDialog
            sourceUrl="/"
            autosaveKey="enquire:home-final-cta"
            trigger={
              <button
                type="button"
                className="group inline-flex items-center gap-3 rounded-full bg-terracotta text-gold-foreground uppercase tracking-[0.22em] text-[12px] font-semibold px-9 py-4 hover:bg-terracotta/90 transition-colors shadow-lg"
              >
                <span>Plan Your Journey</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            }
          />
        </div>
      </div>
    </section>
  );
}

function Index() {
  const { home, home_adventures, home_lodges, home_journal, home_instagram, footer, articles } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      {/* 1. Hero */}
      <Hero content={home} />

      {/* 2. Trust Strip */}
      <TrustStrip />

      {/* 3. Find Your Journey */}
      <FindYourJourney />

      {/* 4. Signature Adventures */}
      <HomeAdventures content={home_adventures} />

      {/* 5. Why Baobab */}
      <WhyBaobab />

      {/* 6. Meet Your Journey Designers (Michael & Samra) */}
      <FoundersStrip />

      {/* 7. Where You'll Stay (Lodges) */}
      <HomeLodges content={home_lodges} />

      {/* 8. Your Journey's Impact */}
      <JourneyImpact />

      {/* 9. Testimonials */}
      <TestimonialsStrip />

      {/* 10. How It Works */}
      <HowItWorks />

      {/* 11. Journal Editorial */}
      <Journal content={home_journal} articles={articles} />

      {/* 12. Final High-Conversion CTA */}
      <FinalHeroCta />

      {/* 13. Instagram */}
      <InstagramStrip content={home_instagram} />

      {/* 14. Footer */}
      <Footer content={footer} />
    </main>
  );
}
