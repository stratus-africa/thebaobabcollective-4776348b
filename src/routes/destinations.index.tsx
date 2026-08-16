import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, ArrowDown, MapPin, Sparkles, Compass } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { DestinationCard } from "@/components/site/DestinationCard";
import { KenyaDestinationsMap } from "@/components/site/KenyaDestinationsMap";
import { DestinationFinderSection } from "@/components/site/DestinationFinderSection";
import { DestinationCombinations } from "@/components/site/DestinationCombinations";
import { DestinationJourneysSection } from "@/components/site/DestinationJourneysSection";
import { DestinationStaySection } from "@/components/site/DestinationStaySection";
import { DestinationMatcherSection } from "@/components/site/DestinationMatcherSection";
import { getDestinations, getLodges } from "@/lib/cms.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { getAdventuresPage } from "@/lib/adventures.functions";
import { mergeDestinationsWithDefaults, type DestinationMetadata } from "@/lib/destinations.data";
import heroBaobab from "@/assets/hero-baobab.jpg";
import g4Img from "@/assets/gallery-4.jpg";

const destinationsQuery = queryOptions({
  queryKey: ["destinations"],
  queryFn: () => getDestinations(),
});

const adventuresQuery = queryOptions({
  queryKey: ["adventures-page"],
  queryFn: () => getAdventuresPage(),
});

const lodgesQuery = queryOptions({
  queryKey: ["lodges"],
  queryFn: () => getLodges(),
});

export const Route = createFileRoute("/destinations/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(destinationsQuery),
      context.queryClient.ensureQueryData(adventuresQuery),
      context.queryClient.ensureQueryData(lodgesQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Kenya Safari & Beach Destinations | The Baobab Collective" },
      {
        name: "description",
        content:
          "Discover Kenya's most extraordinary safari, wilderness and coastal destinations. Explore tailor-made journeys with The Baobab Collective.",
      },
      { property: "og:title", content: "Kenya Safari & Beach Destinations | The Baobab Collective" },
      {
        property: "og:description",
        content:
          "From the wild northern frontier to the Indian Ocean, explore the places that make Kenya extraordinary.",
      },
      { property: "og:image", content: heroBaobab },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://thebaobabcollective.co.uk/destinations" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Kenya Safari & Beach Destinations | The Baobab Collective" },
      {
        name: "twitter:description",
        content:
          "Discover Kenya's most extraordinary safari, wilderness and coastal destinations. Explore tailor-made journeys with The Baobab Collective.",
      },
      { name: "twitter:image", content: heroBaobab },
    ],
    links: [{ rel: "canonical", href: "https://thebaobabcollective.co.uk/destinations" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Kenya Safari & Beach Destinations",
          description:
            "Discover Kenya's most extraordinary safari, wilderness and coastal destinations. Explore tailor-made journeys with The Baobab Collective.",
          url: "https://thebaobabcollective.co.uk/destinations",
          publisher: {
            "@type": "Organization",
            name: "The Baobab Collective",
            url: "https://thebaobabcollective.co.uk",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://thebaobabcollective.co.uk/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Destinations",
              item: "https://thebaobabcollective.co.uk/destinations",
            },
          ],
        }),
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-3xl mb-4">Something went wrong</h1>
        <p className="text-foreground/70">{error.message}</p>
      </main>
      <Footer />
    </div>
  ),
  notFoundComponent: () => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-4">Page not found</h1>
        <Link to="/" className="text-gold underline">
          Back home
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: DestinationsDiscoveryPage,
});

function DestinationsDiscoveryPage() {
  const { data: rawDestinations } = useSuspenseQuery(destinationsQuery);
  const { data: adventuresPage } = useSuspenseQuery(adventuresQuery);
  const { data: lodges } = useSuspenseQuery(lodgesQuery);
  const pageContentFn = useServerFn(getPageContent);
  const { data: pcData } = useQuery({
    queryKey: ["page-content", "destinations_index"],
    queryFn: () => pageContentFn({ data: { key: "destinations_index" } }),
    staleTime: 60_000,
  });
  const content = { ...PAGE_DEFAULTS.destinations_index, ...((pcData ?? {}) as Record<string, any>) };

  // Merge database records with baseline Kenya data
  const allDestinations = useMemo(() => {
    return mergeDestinationsWithDefaults(rawDestinations || []);
  }, [rawDestinations]);

  // Filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredDestinations = useMemo(() => {
    return allDestinations.filter((d) => {
      // Category filter (e.g. Wildlife, Beach, Romance, etc.)
      const matchesCategory =
        selectedCategory === "All" ||
        (d.bestFor && d.bestFor.some((t) => t.toLowerCase() === selectedCategory.toLowerCase()));

      // Text search filter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.shortDescription.toLowerCase().includes(q) ||
        (d.bestFor && d.bestFor.some((t) => t.toLowerCase().includes(q)));

      return matchesCategory && matchesSearch;
    });
  }, [allDestinations, selectedCategory, searchQuery]);

  // Editorial Groupings
  const icons = useMemo(() => {
    return filteredDestinations.filter((d) => d.destinationCategory === "The Icons");
  }, [filteredDestinations]);

  const beyondClassics = useMemo(() => {
    return filteredDestinations.filter((d) => d.destinationCategory === "Beyond the Classics");
  }, [filteredDestinations]);

  const indianOcean = useMemo(() => {
    return filteredDestinations.filter((d) => d.destinationCategory === "The Indian Ocean");
  }, [filteredDestinations]);

  const isFiltered = selectedCategory !== "All" || searchQuery.trim().length > 0;

  function scrollToDiscovery() {
    const el = document.getElementById("discovery-grid");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="bg-background min-h-screen selection:bg-gold selection:text-gold-foreground">
      <Navbar />
      <main id="main-content">
        {/* ── 1. HERO SECTION ────────────────────────────────────────────── */}
        {content.show_hero !== false && (
          <section
            aria-label="Discover Kenya Hero"
            className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center bg-forest text-cream overflow-hidden"
          >
            {/* Background Image */}
            <img
              src={content.hero_image || heroBaobab}
              alt="Golden sunrise across Kenya's wild savannah and acacia trees"
              className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
            />

            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-black/40" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-forest/40 to-forest/80" />

            {/* Hero Content */}
            <div className="relative max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 text-center py-24 sm:py-32 w-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <p className="text-[11px] sm:text-xs tracking-[0.4em] uppercase text-gold font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> {content.eyebrow || "Destination Discovery"}
                </p>

                <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-cream leading-[1.02]">
                  {content.title || "DISCOVER KENYA"}
                </h1>

                <p className="text-base sm:text-xl md:text-2xl text-cream/90 font-serif max-w-2xl mx-auto leading-relaxed italic">
                  {content.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-cream/75 max-w-xl mx-auto leading-relaxed">{content.body}</p>

                {/* Action Buttons */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={scrollToDiscovery}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-8 py-4 hover:bg-gold/90 transition-all shadow-lg hover:shadow-gold/20 cursor-pointer"
                  >
                    <span>{content.cta_label || "Explore Destinations"}</span>
                    <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                  </button>

                  <EnquireDialog
                    defaultSubject="Tailor-Made Kenya Journey Inquiry"
                    defaultDestination="Kenya (All Destinations)"
                    sourceUrl="/destinations"
                    autosaveKey="enquire:destinations-hero"
                    context={{
                      kind: "Destination",
                      title: "Discover Kenya",
                      slug: "discover-kenya",
                      image: heroBaobab,
                    }}
                    trigger={
                      <button
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-forest/80 text-cream backdrop-blur-md border border-gold/40 uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-4 hover:bg-forest hover:border-gold transition-all cursor-pointer shadow-md"
                      >
                        <span>Plan Your Journey</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    }
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 2. DESTINATION FINDER ──────────────────────────────────────── */}
        {content.show_finder !== false && (
          <DestinationFinderSection
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            matchCount={filteredDestinations.length}
            totalCount={allDestinations.length}
          />
        )}

        {/* ── 3. KENYA DESTINATION MAP ────────────────────────────────────── */}
        {content.show_map !== false && <KenyaDestinationsMap destinations={allDestinations} />}

        {/* ── 4. EDITORIAL GROUPINGS GRID ────────────────────────────────── */}
        {content.show_grid !== false && (
          <div id="discovery-grid" className="py-20 md:py-28 space-y-24 md:space-y-32">
            {/* GROUP 1: THE ICONS */}
            {icons.length > 0 && (
              <section
                aria-labelledby="icons-heading"
                className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-border/60">
                  <div>
                    <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">
                      Signature Kenya
                    </p>
                    <h2 id="icons-heading" className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">
                      The Icons
                    </h2>
                  </div>
                  <p className="text-foreground/60 text-sm max-w-md">
                    Kenya's world-famous wilderness heartlands — legendary predator density, great elephant herds, and
                    dramatic arid frontiers.
                  </p>
                </div>

                {/* Asymmetric Large Cards Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {icons.map((dest, idx) => (
                    <DestinationCard
                      key={dest.slug}
                      destination={dest}
                      variant={idx === 0 ? "feature" : "standard"}
                      className={idx === 0 ? "md:col-span-2 lg:col-span-2" : ""}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* GROUP 2: BEYOND THE CLASSICS */}
            {beyondClassics.length > 0 && (
              <section
                aria-labelledby="beyond-heading"
                className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-border/60">
                  <div>
                    <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-2">
                      Untamed & Extraordinary
                    </p>
                    <h2 id="beyond-heading" className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">
                      Beyond the Classics
                    </h2>
                  </div>
                  <p className="text-foreground/60 text-sm max-w-md">
                    Private conservancies, ancient volcanoes, and Great Rift Valley lakes where wildlife viewing is
                    intimate, active, and conservation-focused.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {beyondClassics.map((dest) => (
                    <DestinationCard key={dest.slug} destination={dest} variant="standard" />
                  ))}
                </div>
              </section>
            )}

            {/* GROUP 3: THE INDIAN OCEAN */}
            {indianOcean.length > 0 && (
              <section
                aria-labelledby="ocean-heading"
                className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-border/60">
                  <div>
                    <p className="text-[11px] tracking-[0.3em] uppercase text-cyan-600 dark:text-cyan-400 font-semibold mb-2">
                      Swahili Coast & Coral Reefs
                    </p>
                    <h2 id="ocean-heading" className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">
                      The Indian Ocean
                    </h2>
                  </div>
                  <p className="text-foreground/60 text-sm max-w-md">
                    White sands, historic UNESCO Swahili ports, sunset dhow sailing, and marine national parks teeming
                    with reef life.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {indianOcean.map((dest) => (
                    <DestinationCard key={dest.slug} destination={dest} variant="standard" />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State if Filter yields zero */}
            {filteredDestinations.length === 0 && (
              <div className="max-w-2xl mx-auto px-6 py-20 text-center bg-cream/40 rounded-2xl border border-border">
                <Compass className="w-10 h-10 text-gold mx-auto mb-3" />
                <h3 className="font-serif text-2xl text-foreground mb-2">No destinations match your search</h3>
                <p className="text-foreground/70 text-sm mb-6">
                  Try selecting a different interest category or resetting your search term.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-forest text-cream uppercase tracking-[0.2em] text-[11px] font-semibold px-6 py-3"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 5. FEATURED ADVENTURES ─────────────────────────────────────── */}
        {content.show_journeys !== false && (
          <DestinationJourneysSection adventures={adventuresPage?.signatures ?? []} />
        )}

        {/* ── 6. WHERE YOU'LL STAY ───────────────────────────────────────── */}
        {content.show_stay !== false && <DestinationStaySection lodges={lodges ?? []} />}

        {/* ── 7. DESTINATION COMBINATIONS ────────────────────────────────── */}
        {content.show_combinations !== false && <DestinationCombinations />}

        {/* ── 8. WHERE SHOULD KENYA TAKE YOU? (MATCHER) ─────────────────── */}
        {content.show_matcher !== false && <DestinationMatcherSection />}

        {/* ── 9. FINAL CALL TO ACTION ────────────────────────────────────── */}
        {content.show_final_cta !== false && (
          <section
            aria-label="Final Journey Planning CTA"
            className="relative py-24 md:py-32 bg-forest text-cream overflow-hidden text-center"
          >
            <img
              src={g4Img}
              alt="Majestic baobab tree and giraffe silhouetted at dusk"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/80 to-forest/60" />

            <div className="relative max-w-4xl mx-auto px-6 space-y-6">
              <p className="text-[11px] tracking-[0.4em] uppercase text-gold font-semibold">
                Begin Your Kenyan Journey
              </p>
              <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl text-cream leading-[1.06]">
                Your Kenya is waiting.
              </h2>
              <p className="text-forest-foreground/85 text-base sm:text-xl font-serif max-w-2xl mx-auto leading-relaxed">
                Not sure where to start? Tell us what you love, and we'll help you find the places and rhythm that are
                right for you.
              </p>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <EnquireDialog
                  defaultSubject="Plan My Bespoke Kenya Journey"
                  defaultDestination="Kenya (Tailor-Made)"
                  sourceUrl="/destinations"
                  autosaveKey="enquire:destinations-final"
                  context={{
                    kind: "Destination",
                    title: "Your Kenya is Waiting",
                    slug: "your-kenya-waiting",
                    image: g4Img,
                  }}
                  trigger={
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-gold/90 transition-all shadow-lg cursor-pointer"
                    >
                      <span>Plan My Journey</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  }
                />

                <Link
                  to="/adventures"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-forest-foreground/10 text-cream border border-forest-foreground/20 uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-4 hover:bg-forest-foreground/20 transition-all text-center"
                >
                  <span>Explore Adventures</span>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
