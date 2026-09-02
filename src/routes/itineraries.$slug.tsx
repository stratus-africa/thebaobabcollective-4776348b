import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { ArrowRight, Check, Calendar, MapPin, Users, Sparkles, X } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";

import { ShareButtons } from "@/components/site/ShareButtons";
import { getItineraryBySlug } from "@/lib/cms.functions";
import { getAdventuresPage } from "@/lib/adventures.functions";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const itinerarySearchSchema = z.object({
  itinerary: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/itineraries/$slug")({
  validateSearch: zodValidator(itinerarySearchSchema),
  loader: async ({ params }) => {
    const [itinerary, adventuresPage] = await Promise.all([
      getItineraryBySlug({ data: { slug: params.slug } }),
      getAdventuresPage().catch(() => null),
    ]);
    if (!itinerary) throw notFound();
    const matchingAdventure = (adventuresPage?.signatures ?? []).find(
      (s) => s.slug === params.slug || s.name.toLowerCase() === itinerary.name.toLowerCase(),
    );
    return { itinerary, matchingAdventure };
  },
  head: ({ loaderData }) => {
    const it = loaderData?.itinerary;
    const title = it ? `${it.name} — The Baobab Collective` : "Itinerary";
    const desc = it?.description ?? "A curated safari itinerary";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        ...(it?.image ? [{ property: "og:image", content: it.image }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-4">Itinerary not found</h1>
        <Link to="/adventures" className="text-gold underline">
          Browse all adventures
        </Link>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-32 text-center">
          <h1 className="font-serif text-3xl mb-4">Something went wrong</h1>
          <p className="text-foreground/70 mb-6">{error.message}</p>
          <button
            onClick={() => {
              reset();
              router.invalidate();
            }}
            className="bg-gold text-gold-foreground px-6 py-3 uppercase tracking-[0.25em] text-[11px]"
          >
            Retry
          </button>
        </main>
        <Footer />
      </div>
    );
  },
  component: ItineraryPage,
});

function ItineraryPage() {
  const { itinerary, matchingAdventure } = Route.useLoaderData();
  const { formatPrice } = useSiteSettings();
  const { itinerary: prefillFromQuery } = Route.useSearch();
  const cat = (itinerary as any).category;
  const enquiryName = prefillFromQuery || itinerary.name;

  const rawIncluded = matchingAdventure?.included ?? (itinerary as any).included ?? [];
  const included = (
    Array.isArray(rawIncluded)
      ? rawIncluded
      : typeof rawIncluded === "string"
        ? (rawIncluded as string).split("\n")
        : []
  )
    .map((s: string) => s.trim())
    .filter(Boolean);

  const rawNotIncluded = matchingAdventure?.notIncluded ?? (itinerary as any).notIncluded ?? [];
  const notIncluded = (
    Array.isArray(rawNotIncluded)
      ? rawNotIncluded
      : typeof rawNotIncluded === "string"
        ? (rawNotIncluded as string).split("\n")
        : []
  )
    .map((s: string) => s.trim())
    .filter(Boolean);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative h-[70vh] min-h-[480px] flex items-end">
          <img src={itinerary.image} alt={itinerary.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/82 via-forest-dark/40 to-transparent" />
          <div className="relative max-w-[1920px] mx-auto px-6 lg:px-10 pb-16 text-background w-full">
            {cat && (
              <Link
                to="/adventures"
                className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4 inline-block hover:underline"
              >
                ← {cat.title}
              </Link>
            )}
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-4 max-w-3xl">{itinerary.name}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-background/90">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" /> {itinerary.nights}
              </span>
              {itinerary.price_from_usd && (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" /> From {formatPrice(Number(itinerary.price_from_usd))} pp
                </span>
              )}
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold" /> Private guided
              </span>
            </div>
          </div>
        </section>

        {/* Overview + Sidebar */}
        <section className="py-20 md:py-24">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">Overview</p>
                <p className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed mb-6">
                  {itinerary.description}
                </p>
              </div>

              <div>
                <h2 className="font-serif text-3xl text-foreground mb-6">Journey Highlights</h2>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {itinerary.highlights.map((h: string) => (
                    <li key={h} className="flex gap-3 text-foreground/80 bg-cream p-4">
                      <Check className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-3xl text-foreground mb-6">A Sample Rhythm</h2>
                <div className="space-y-6">
                  {itinerary.highlights.slice(0, 4).map((h: string, i: number) => (
                    <div key={h} className="flex gap-5 border-l-2 border-gold pl-6">
                      <div className="shrink-0">
                        <p className="text-[10px] tracking-[0.3em] uppercase text-gold">Phase</p>
                        <p className="font-serif text-3xl text-foreground">{String(i + 1).padStart(2, "0")}</p>
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-foreground mb-2">{h}</h3>
                        <p className="text-foreground/70 text-sm leading-relaxed">
                          Days of immersive guiding, intimate camps and conservation-led experiences crafted around this
                          chapter of your journey.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {included.length > 0 && (
                <div className="bg-forest text-forest-foreground p-8 md:p-10">
                  <h2 className="font-serif text-2xl mb-5">What's Included</h2>
                  <ul className="grid sm:grid-cols-2 gap-3 text-sm text-forest-foreground/90">
                    {included.map((x: string, idx: number) => (
                      <li key={`${x}-${idx}`} className="flex gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {notIncluded.length > 0 && (
                <div className="border border-border bg-cream/60 p-8 md:p-10">
                  <h2 className="font-serif text-2xl text-foreground mb-5">What's Not Included</h2>
                  <ul className="grid sm:grid-cols-2 gap-3 text-sm text-foreground/80">
                    {notIncluded.map((x: string, idx: number) => (
                      <li key={`${x}-${idx}`} className="flex gap-2">
                        <X className="w-4 h-4 text-terracotta mt-0.5 shrink-0" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 self-start space-y-6">
              <div className="bg-cream p-8">
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-3">Reserve Your Journey</p>
                <p className="font-serif text-3xl text-foreground mb-1">
                  {itinerary.price_from_usd ? formatPrice(Number(itinerary.price_from_usd)) : "On request"}
                </p>
                <p className="text-xs text-foreground/60 mb-6">per person, twin share · {itinerary.nights}</p>
                <EnquireDialog
                  defaultSubject={enquiryName}
                  defaultDestination={enquiryName}
                  openOnHash="enquire"
                  trigger={
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[11px] px-6 py-4 hover:bg-gold/90"
                    >
                      Enquire <ArrowRight className="w-3 h-3" />
                    </button>
                  }
                />
              </div>
              <div className="border border-foreground/10 p-6 text-sm text-foreground/70">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gold mt-0.5" />
                  Every itinerary is fully bespoke — adapt the route, lodges and pace to your travel style.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Share */}
        <section className="border-t border-border/40 py-10">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 flex flex-wrap items-center justify-between gap-6">
            <p className="font-serif text-xl text-foreground">
              Inspired? Share {itinerary.name} with a fellow traveller.
            </p>
            <ShareButtons
              title={`${itinerary.name} — The Baobab Collective`}
              description={itinerary.description?.slice(0, 140)}
              label="Share this journey"
            />
          </div>
        </section>

        {/* Enquire CTA */}
        <section className="bg-cream py-20 md:py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">Enquire</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Speak with a Journey Designer</h2>
            <p className="text-foreground/70 mb-8">
              Share a few details about your dream {enquiryName} experience — we'll respond within 24 hours.
            </p>
            <EnquireDialog
              defaultSubject={enquiryName}
              defaultDestination={enquiryName}
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 bg-terracotta text-gold-foreground uppercase tracking-[0.25em] text-[12px] px-8 py-4 hover:bg-terracotta/90 transition-colors"
                >
                  Start Your Enquiry
                </button>
              }
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
