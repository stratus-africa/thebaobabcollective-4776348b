import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { InstagramStrip } from "@/components/site/Instagram";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { getPageContent } from "@/lib/page-content.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [home, about, home_instagram, footer] = await Promise.all([
      getPageContent({ data: { key: "home" } }).catch(() => null),
      getPageContent({ data: { key: "about" } }).catch(() => null),
      getPageContent({ data: { key: "home_instagram" } }).catch(() => null),
      getPageContent({ data: { key: "footer" } }).catch(() => null),
    ]);
    return {
      home,
      about,
      home_instagram,
      footer,
    };
  },
  head: () => ({
    meta: [
      { title: "The Baobab Collective — Curated Safari Journeys" },
      {
        name: "description",
        content:
          "Luxury curated safari experiences in Africa. Authentic connections, conservation-led journeys, and extraordinary moments with The Baobab Collective.",
      },
      { property: "og:title", content: "The Baobab Collective — Curated Safari Journeys" },
      {
        property: "og:description",
        content: "Curated safari experiences that immerse, inspire and leave a lasting impact.",
      },
    ],
  }),
  component: Index,
});

function PrimaryJourneyCta() {
  return (
    <EnquireDialog
      sourceUrl="/"
      autosaveKey="enquire-home-why-baobab"
      trigger={
        <button
          type="button"
          className="group inline-flex items-center gap-3 rounded-full border border-gold px-7 py-4 text-[11px] uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-gold-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Let's Create Your Journey
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      }
    />
  );
}

function WhyBaobab() {
  const reasons = [
    ["01", "Kenya, personally known", "Born from a close, lived connection to Kenya."],
    ["02", "Completely tailor-made", "No off-the-shelf itineraries; every journey begins with the traveller."],
    ["03", "Trusted locally", "Relationships with guides, camps and communities shape what is possible."],
    ["04", "Personal from start to finish", "You deal directly with the people creating your journey."],
    ["05", "Thoughtful travel", "Designed with people, wildlife and place in mind."],
  ];
  return (
    <section className="bg-background py-14 md:py-20">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 border-t border-foreground/15 pt-7 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          <div>
            <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-gold">Why Baobab?</p>
            <h2 className="font-serif text-4xl leading-[1.05] text-foreground md:text-6xl">
              Quiet expertise, deeply personal travel.
            </h2>
          </div>
          <div className="divide-y divide-foreground/15">
            {reasons.map(([number, title, body]) => (
              <div key={number} className="grid gap-4 py-5 sm:grid-cols-[70px_1fr] sm:py-6">
                <span className="font-serif text-3xl text-gold">{number}</span>
                <div>
                  <h3 className="mb-2 text-[12px] uppercase tracking-[0.28em] text-foreground">{title}</h3>
                  <p className="max-w-2xl leading-relaxed text-foreground/70">{body}</p>
                </div>
              </div>
            ))}
            <div className="pt-6">
              <PrimaryJourneyCta />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Index() {
  const { home, about, home_instagram, footer } = Route.useLoaderData();
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero content={home} />
      <About content={about} />
      <WhyBaobab />
      <InstagramStrip content={home_instagram} />
      <Footer content={footer} />
    </main>
  );
}
