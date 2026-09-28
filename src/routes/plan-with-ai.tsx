import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { TripRecommender } from "@/components/site/TripRecommender";

const TITLE = "Plan with AI — Personalised Kenya Safari Ideas | The Baobab Collective";
const DESC =
  "Tell us your interests, budget and dream experiences and get instant, personalised Kenya destination and adventure recommendations.";

export const Route = createFileRoute("/plan-with-ai")({
  validateSearch: z.object({ interests: z.string().optional() }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanWithAiPage,
});

function PlanWithAiPage() {
  const { interests } = Route.useSearch();
  const initial = interests ? interests.split(",").filter(Boolean) : ["Wildlife"];
  return (
    <div className="bg-cream min-h-screen">
      <Navbar />
      <main>
        <section className="bg-forest text-forest-foreground pt-40 pb-20 text-center px-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4">Personalised Recommendations</p>
          <h1 className="font-serif text-5xl md:text-6xl mb-5">Where should Kenya take you?</h1>
          <p className="max-w-2xl mx-auto text-forest-foreground/80">
            Share what moves you — we'll suggest the destinations and adventures that fit, then a journey designer can shape every detail.
          </p>
        </section>
        <section className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-16 md:py-20">
          <TripRecommender initialInterests={initial} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
