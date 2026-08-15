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
import { InstagramStrip } from "@/components/site/Instagram";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [
      home,
      home_trust,
      home_find_journey,
      home_adventures,
      home_why_baobab,
      home_founders,
      home_lodges,
      home_impact,
      home_how_it_works,
      home_final_cta,
      home_instagram,
      footer,
    ] = await Promise.all([
      getPageContent({ data: { key: "home" } }).catch(() => null),
      getPageContent({ data: { key: "home_trust" } }).catch(() => null),
      getPageContent({ data: { key: "home_find_journey" } }).catch(() => null),
      getPageContent({ data: { key: "home_adventures" } }).catch(() => null),
      getPageContent({ data: { key: "home_why_baobab" } }).catch(() => null),
      getPageContent({ data: { key: "home_founders" } }).catch(() => null),
      getPageContent({ data: { key: "home_lodges" } }).catch(() => null),
      getPageContent({ data: { key: "home_impact" } }).catch(() => null),
      getPageContent({ data: { key: "home_how_it_works" } }).catch(() => null),
      getPageContent({ data: { key: "home_final_cta" } }).catch(() => null),
      getPageContent({ data: { key: "home_instagram" } }).catch(() => null),
      getPageContent({ data: { key: "footer" } }).catch(() => null),
    ]);
    return {
      home,
      home_trust,
      home_find_journey,
      home_adventures,
      home_why_baobab,
      home_founders,
      home_lodges,
      home_impact,
      home_how_it_works,
      home_final_cta,
      home_instagram,
      footer,
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
} as any);

function WhyBaobab({ content }: { content?: any }) {
  const base = { ...PAGE_DEFAULTS.home_why_baobab, ...(content ?? {}) };
  const c = usePreviewMerge("home_why_baobab", base);

  const pillars = [
    { num: c.pillar_1_num, title: c.pillar_1_title, body: c.pillar_1_body },
    { num: c.pillar_2_num, title: c.pillar_2_title, body: c.pillar_2_body },
    { num: c.pillar_3_num, title: c.pillar_3_title, body: c.pillar_3_body },
    { num: c.pillar_4_num, title: c.pillar_4_title, body: c.pillar_4_body },
  ];

  return (
    <section id="why-baobab" aria-labelledby="why-baobab-heading" className="bg-background py-18 md:py-24">
      <div className="mx-auto max-w-[1920px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 xl:gap-20 items-start">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-gold font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> {c.eyebrow}
            </p>
            <h2
              id="why-baobab-heading"
              className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-foreground"
            >
              {c.title}
            </h2>
            <p className="text-foreground/75 text-base sm:text-lg leading-relaxed pt-2">{c.body}</p>
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

function FinalHeroCta({ content }: { content?: any }) {
  const base = { ...PAGE_DEFAULTS.home_final_cta, ...(content ?? {}) };
  const c = usePreviewMerge("home_final_cta", base);

  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-cream py-20 md:py-28 text-center border-t border-border/40"
    >
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        <p className="text-[11px] tracking-[0.35em] uppercase text-terracotta font-semibold">{c.eyebrow}</p>
        <h2
          id="final-cta-heading"
          className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.05]"
        >
          {c.title_line1}
          <br />
          <span className="text-gold italic">{c.title_line2}</span>
        </h2>
        <p className="text-foreground/75 text-base sm:text-lg leading-relaxed max-w-xl mx-auto pt-2">{c.body}</p>
        <div className="pt-4">
          <EnquireDialog
            sourceUrl="/"
            autosaveKey="enquire:home-final-cta"
            trigger={
              <button
                type="button"
                className="group inline-flex items-center gap-3 rounded-full bg-terracotta text-gold-foreground uppercase tracking-[0.22em] text-[12px] font-semibold px-9 py-4 hover:bg-terracotta/90 transition-colors shadow-lg"
              >
                <span>{c.cta_label}</span>
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
  const {
    home,
    home_trust,
    home_find_journey,
    home_adventures,
    home_why_baobab,
    home_founders,
    home_lodges,
    home_impact,
    home_how_it_works,
    home_final_cta,
    home_instagram,
    footer,
  } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      {/* 1. Hero */}
      <Hero content={home} />

      {/* 2. Trust Strip */}
      <TrustStrip content={home_trust} />

      {/* 3. Find Your Journey */}
      <FindYourJourney content={home_find_journey} />

      {/* 4. Signature Adventures */}
      <HomeAdventures content={home_adventures} />

      {/* 5. Why Baobab */}
      <WhyBaobab content={home_why_baobab} />

      {/* 6. Meet Your Journey Designers (Michael & Samra) */}
      <FoundersStrip content={home_founders} />

      {/* 7. Where You'll Stay (Lodges) */}
      <HomeLodges content={home_lodges} />

      {/* 8. Your Journey's Impact */}
      <JourneyImpact content={home_impact} />

      {/* 9. Testimonials */}
      <TestimonialsStrip />

      {/* 10. How It Works */}
      <HowItWorks content={home_how_it_works} />

      {/* 11. Final High-Conversion CTA */}
      <FinalHeroCta content={home_final_cta} />

      {/* 12. Instagram */}
      <InstagramStrip content={home_instagram} />

      {/* 13. Footer */}
      <Footer content={footer} />
    </main>
  );
}
