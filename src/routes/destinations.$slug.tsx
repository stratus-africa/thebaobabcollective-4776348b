import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  Compass,
  Check,
  ShieldCheck,
  Plane,
  HeartHandshake,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ShareButtons } from "@/components/site/ShareButtons";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Lightbox } from "@/components/site/Lightbox";
import { TheBaobabPick } from "@/components/site/TheBaobabPick";
import { DestinationCard } from "@/components/site/DestinationCard";
import { getDestinationBySlug, getDestinations, getLodges } from "@/lib/cms.functions";
import { getAdventuresPage } from "@/lib/adventures.functions";
import { resolveImageSource } from "@/lib/image-resolution";
import {
  enrichDestination,
  mergeDestinationsWithDefaults,
  DESTINATION_COMBINATIONS,
  type DestinationMetadata,
} from "@/lib/destinations.data";

const destQuery = (slug: string) =>
  queryOptions({
    queryKey: ["destination", slug],
    queryFn: () => getDestinationBySlug({ data: { slug } }),
  });

const allDestQuery = queryOptions({
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

export const Route = createFileRoute("/destinations/$slug")({
  loader: async ({ params, context }) => {
    const d = await context.queryClient.ensureQueryData(destQuery(params.slug));
    await Promise.all([
      context.queryClient.ensureQueryData(allDestQuery),
      context.queryClient.ensureQueryData(adventuresQuery),
      context.queryClient.ensureQueryData(lodgesQuery),
    ]);
    return { destination: d };
  },
  head: ({ loaderData, params }) => {
    const raw = loaderData?.destination;
    const enriched = raw
      ? enrichDestination(raw)
      : mergeDestinationsWithDefaults([]).find((d) => d.slug === params.slug);

    const title = enriched
      ? `${enriched.name}, ${enriched.region} — The Baobab Collective`
      : "Destination — The Baobab Collective";
    const desc =
      enriched?.shortDescription || "Discover this extraordinary destination in Kenya with The Baobab Collective.";
    const url = `https://thebaobabcollective.co.uk/destinations/${params.slug}`;

    const ldDest = enriched
      ? {
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          name: enriched.name,
          description: enriched.shortDescription,
          image: enriched.fallbackImage,
          url,
          touristType: enriched.region,
          address: {
            "@type": "PostalAddress",
            addressCountry: enriched.country,
            addressRegion: enriched.region,
          },
          includesAttraction: enriched.highlights?.map((t: string) => ({
            "@type": "TouristAttraction",
            name: t,
          })),
        }
      : null;

    const ldCrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://thebaobabcollective.co.uk/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Destinations",
          item: "https://thebaobabcollective.co.uk/destinations",
        },
        { "@type": "ListItem", position: 3, name: enriched?.name ?? params.slug, item: url },
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(enriched?.fallbackImage ? [{ property: "og:image", content: enriched.fallbackImage }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(enriched?.fallbackImage ? [{ name: "twitter:image", content: enriched.fallbackImage }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ...(ldDest ? [{ type: "application/ld+json", children: JSON.stringify(ldDest) }] : []),
        { type: "application/ld+json", children: JSON.stringify(ldCrumbs) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-4">Destination not found</h1>
        <p className="text-foreground/70 mb-6">The requested Kenya destination could not be located.</p>
        <Link to="/destinations" className="text-gold underline">
          Back to all destinations
        </Link>
      </main>
      <Footer />
    </div>
  ),
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
  component: DestinationDetailPage,
});

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function DestinationDetailPage() {
  const { slug } = Route.useParams();
  const { data: rawDest } = useSuspenseQuery(destQuery(slug));
  const { data: rawDestList } = useSuspenseQuery(allDestQuery);
  const { data: adventuresPage } = useSuspenseQuery(adventuresQuery);
  const { data: lodges } = useSuspenseQuery(lodgesQuery);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Enriched destination metadata
  const d: DestinationMetadata = useMemo(() => {
    if (rawDest) return enrichDestination(rawDest);
    const fallback = mergeDestinationsWithDefaults([]).find((item) => item.slug === slug);
    if (!fallback) throw notFound();
    return fallback;
  }, [rawDest, slug]);

  const heroImage = resolveImageSource(rawDest?.image, d?.fallbackImage) ?? null;

  const allDestinations = useMemo(() => {
    return mergeDestinationsWithDefaults(rawDestList || []);
  }, [rawDestList]);

  // Related Adventures (matching destination region or slug)
  const relatedAdventures = useMemo(() => {
    const list = adventuresPage?.signatures ?? [];
    return list.filter((adv) => {
      const advRegion = (adv.region || "").toLowerCase();
      const destName = d.name.toLowerCase();
      const destRegion = d.region.toLowerCase();
      return (
        advRegion.includes(destName) ||
        destName.includes(advRegion) ||
        advRegion.includes(destRegion) ||
        adv.description.toLowerCase().includes(destName)
      );
    });
  }, [adventuresPage, d]);

  // Related Lodges (matching destination or region)
  const relatedLodges = useMemo(() => {
    return (lodges ?? []).filter((l) => {
      const loc = (l.location || "").toLowerCase();
      const destName = d.name.toLowerCase();
      const destRegion = d.region.toLowerCase();
      return loc.includes(destName) || loc.includes(destRegion);
    });
  }, [lodges, d]);

  // Suggested Combinations
  const relevantCombinations = useMemo(() => {
    return DESTINATION_COMBINATIONS.filter((combo) =>
      combo.destinations.some((s) => s.includes(d.slug) || d.slug.includes(s)),
    );
  }, [d]);

  // Other destinations
  const otherDestinations = useMemo(() => {
    return allDestinations.filter((item) => item.slug !== d.slug).slice(0, 3);
  }, [allDestinations, d]);

  // Gallery
  const galleryItems = useMemo(() => {
    const imgs = [d.fallbackImage];
    return imgs.map((src, i) => ({
      src,
      alt: `${d.name} — view ${i + 1}`,
      caption: `${d.name}, ${d.region}`,
    }));
  }, [d]);

  return (
    <div className="bg-background min-h-screen selection:bg-gold selection:text-gold-foreground">
      <Navbar />
      <Breadcrumbs items={[{ label: "Destinations", to: "/destinations" }, { label: d.name }]} />

      <main id="main-content">
        {/* ── 1. CINEMATIC HERO ────────────────────────────────────────── */}
        <section className="relative h-[65vh] min-h-[460px] max-h-[720px] flex items-end bg-forest text-cream overflow-hidden">
          {heroImage ? (
            <img
              src={heroImage}
              alt={`${d.name}, ${d.region}`}
              className="absolute inset-0 w-full h-full object-cover"
              decoding="async"
              fetchPriority="high"
              sizes="100vw"
            />
          ) : (
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(216,174,88,0.34),_transparent_45%),linear-gradient(135deg,_#1f2b1d,_#0f1a12)]"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <div className="relative max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 pb-14 text-cream w-full flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-[11px] sm:text-xs tracking-[0.35em] uppercase text-gold font-semibold mb-3 inline-flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {d.region} · {d.country}
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.04] mb-4 text-cream">
                {d.name}
              </h1>
              {d.bestSeason && (
                <p className="text-sm sm:text-base text-cream/90 inline-flex items-center gap-2 font-medium">
                  <Calendar className="w-4 h-4 text-gold" /> Best time to visit: {d.bestSeason}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <ShareButtons
                title={`${d.name}, ${d.country} — The Baobab Collective`}
                description={d.shortDescription}
                label="Share"
              />
            </div>
          </div>
        </section>

        {/* ── 2. EDITORIAL OVERVIEW & PERSPECTIVE ──────────────────────── */}
        <section className="py-20 md:py-28 bg-cream/50 border-b border-border/50">
          <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Main Editorial Narrative */}
            <div className="lg:col-span-8 space-y-10">
              <div>
                <p className="text-[11px] tracking-[0.35em] uppercase text-terracotta font-semibold mb-3">Why Visit</p>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.12] mb-6">
                  {d.shortDescription}
                </h2>
                <div className="prose prose-lg text-foreground/80 leading-relaxed font-sans space-y-4">
                  <p>{d.fullDescriptionFallback}</p>
                </div>
              </div>

              {/* Best For Tags Box */}
              {d.bestFor && d.bestFor.length > 0 && (
                <div className="p-6 sm:p-8 bg-background rounded-2xl border border-border space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-gold" /> Ideal For
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {d.bestFor.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs tracking-wider uppercase font-semibold bg-cream text-foreground/90 border border-border px-4 py-2 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* The Baobab Pick Callout */}
              <TheBaobabPick
                title="The Baobab Perspective"
                author="Our Local Guide Advice"
                note={`In ${d.name}, the magic unfolds during the early hours and twilight. We coordinate private dawn wildlife encounters and dusk walking safaris before vehicle traffic builds.`}
              />

              {/* Visual Best Time to Visit Calendar Guide */}
              <div className="p-6 sm:p-8 bg-background rounded-2xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gold" /> Season Calendar Guide
                  </p>
                  <span className="text-xs font-semibold text-gold">{d.bestSeason}</span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2">
                  {ALL_MONTHS.map((m) => {
                    const isPeak = d.bestMonths?.includes(m);
                    const isGood = d.alsoGoodMonths?.includes(m);
                    return (
                      <div
                        key={m}
                        className={`text-center py-2.5 px-1 rounded-lg border text-xs font-semibold tracking-wider uppercase transition-all ${
                          isPeak
                            ? "bg-forest text-cream border-forest shadow-xs"
                            : isGood
                              ? "bg-gold/20 text-foreground border-gold/40"
                              : "bg-cream/40 text-foreground/40 border-border/60"
                        }`}
                        title={isPeak ? `${m}: Peak Season` : isGood ? `${m}: Good Season` : `${m}: Shoulder/Rainy`}
                      >
                        <div>{m}</div>
                        <div className="text-[9px] mt-0.5 opacity-80">{isPeak ? "Peak" : isGood ? "Good" : "•"}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-foreground/60 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-forest inline-block" /> Best Season
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-gold/40 inline-block" /> Also Great
                  </span>
                </div>
              </div>
            </div>

            {/* Right Sticky Sidebar */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <div className="bg-background rounded-2xl p-6 sm:p-8 border border-border shadow-xl space-y-6">
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/50 font-semibold mb-1">
                    Region & Setting
                  </p>
                  <p className="font-serif text-2xl text-foreground">{d.region}</p>
                </div>

                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/50 font-semibold mb-1">
                    Country
                  </p>
                  <p className="font-serif text-2xl text-foreground">{d.country}</p>
                </div>

                {d.bestSeason && (
                  <div>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-1">Best Months</p>
                    <p className="font-medium text-foreground">{d.bestSeason}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-border space-y-3">
                  <EnquireDialog
                    defaultSubject={`Journey to ${d.name}`}
                    defaultDestination={`${d.name}, ${d.country}`}
                    sourceUrl={`/destinations/${d.slug}`}
                    autosaveKey={`enquire:destination:${d.slug}`}
                    context={{
                      kind: "Destination",
                      title: `${d.name}, ${d.country}`,
                      dates: d.bestSeason ?? undefined,
                      slug: d.slug,
                      image: d.fallbackImage,
                    }}
                    trigger={
                      <button
                        type="button"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-6 py-4 hover:bg-gold/90 transition-colors shadow-sm cursor-pointer"
                      >
                        <span>Plan A Journey Here</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    }
                  />

                  <Link
                    to="/private-travel"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-cream text-foreground border border-border uppercase tracking-[0.2em] text-[11px] font-semibold px-6 py-3.5 hover:border-gold hover:text-gold transition-colors text-center"
                  >
                    <span>Request Custom Sketch</span>
                  </Link>
                </div>

                {/* Responsible Travel Badge */}
                <div className="pt-4 border-t border-border flex items-start gap-3 text-xs text-foreground/70">
                  <HeartHandshake className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Every journey to {d.name} supports local conservancy rangers, community leases, and habitat
                    protection.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ── 3. SIGNATURE EXPERIENCES ─────────────────────────────────── */}
        {((d.highlights && d.highlights.length > 0) || relevantCombinations.length > 0) && (
          <section className="py-20 bg-background border-b border-border/50">
            <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {d.highlights && d.highlights.length > 0 && (
                  <div>
                    <div className="text-center max-w-2xl mx-auto mb-8 lg:text-left lg:mx-0">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">
                        Activities & Moments
                      </p>
                      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">
                        Signature Experiences
                      </h2>
                      <p className="text-foreground/70 text-sm mt-3">Unforgettable ways to live and breathe {d.name}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {d.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="p-6 bg-cream/40 rounded-2xl border border-border flex items-start gap-3 hover:border-gold/50 transition-colors"
                        >
                          <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-foreground/85 leading-snug">{h}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relevantCombinations.length > 0 && (
                  <div>
                    <div className="mb-8">
                      <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">
                        Combine With
                      </p>
                      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">
                        Perfect Journeys Combining {d.name}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {relevantCombinations.map((combo) => (
                        <div
                          key={combo.id}
                          className="p-6 sm:p-8 bg-cream/30 rounded-2xl border border-border space-y-4 shadow-sm"
                        >
                          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">{combo.subtitle}</p>
                          <h3 className="font-serif text-2xl sm:text-3xl text-foreground">
                            {combo.destinationNames.join("  +  ")}
                          </h3>
                          <p className="text-foreground/75 text-sm leading-relaxed">{combo.tagline}</p>
                          <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                            <span className="text-foreground/60">{combo.days}</span>
                            <EnquireDialog
                              defaultSubject={`Inquiry: Combining ${d.name}`}
                              defaultDestination={combo.destinationNames.join(" & ")}
                              sourceUrl={`/destinations/${d.slug}`}
                              autosaveKey={`enquire:combo:${combo.id}`}
                              context={{
                                kind: "Journey",
                                title: combo.title,
                                dates: combo.days,
                                slug: combo.id,
                                image: combo.image,
                              }}
                              trigger={
                                <button
                                  type="button"
                                  className="text-gold hover:underline uppercase tracking-wider text-xs"
                                >
                                  Plan this route →
                                </button>
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 4. WHERE TO STAY (MATCHING LODGES) ───────────────────────── */}
        {relatedLodges.length > 0 && (
          <section className="py-20 bg-forest text-forest-foreground">
            <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">
                    Sanctuaries & Camps
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-cream">
                    Where You'll Stay in {d.name}
                  </h2>
                </div>
                <Link
                  to="/lodges"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-cream hover:text-gold transition-colors"
                >
                  <span>Explore All Lodges</span> <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedLodges.map((lodge) => (
                  <article
                    key={lodge.id}
                    className="group bg-background text-foreground rounded-2xl overflow-hidden border border-border/20 shadow-xl flex flex-col"
                  >
                    <Link
                      to="/lodges/$slug"
                      params={{ slug: lodge.slug }}
                      className="relative aspect-[16/10] overflow-hidden block"
                    >
                      <img
                        src={lodge.hero_image}
                        alt={lodge.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    </Link>
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-serif text-2xl text-foreground mb-2 group-hover:text-gold transition-colors">
                          <Link to="/lodges/$slug" params={{ slug: lodge.slug }}>
                            {lodge.name}
                          </Link>
                        </h3>
                        <p className="text-foreground/75 text-xs sm:text-sm line-clamp-3 mb-4">{lodge.description}</p>
                      </div>
                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <Link
                          to="/lodges/$slug"
                          params={{ slug: lodge.slug }}
                          className="text-xs uppercase tracking-[0.2em] font-semibold text-forest hover:text-gold transition-colors"
                        >
                          View Lodge →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 5. RELATED ADVENTURES ────────────────────────────────────── */}
        {relatedAdventures.length > 0 && (
          <section className="py-20 bg-background border-t border-border/50">
            <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">
                    Signature Journeys
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">
                    Adventures Visiting {d.name}
                  </h2>
                </div>
                <Link
                  to="/adventures"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-foreground hover:text-gold transition-colors"
                >
                  <span>All Adventures</span> <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedAdventures.map((adv) => (
                  <article
                    key={adv.slug}
                    className="group bg-cream/40 rounded-2xl overflow-hidden border border-border transition-all duration-500 hover:shadow-luxury-hover hover:border-gold/50 flex flex-col"
                  >
                    <Link
                      to="/adventures/$slug"
                      params={{ slug: adv.slug }}
                      className="relative aspect-[16/10] overflow-hidden block"
                    >
                      <img
                        src={adv.image}
                        alt={adv.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />
                    </Link>
                    <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-serif text-2xl text-foreground mb-2 group-hover:text-gold transition-colors">
                          <Link to="/adventures/$slug" params={{ slug: adv.slug }}>
                            {adv.name}
                          </Link>
                        </h3>
                        <p className="text-foreground/75 text-xs sm:text-sm line-clamp-3 mb-4">{adv.description}</p>
                      </div>
                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <Link
                          to="/adventures/$slug"
                          params={{ slug: adv.slug }}
                          className="text-xs uppercase tracking-[0.2em] font-semibold text-gold hover:text-terracotta transition-colors"
                        >
                          Explore Journey →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 6. OTHER DESTINATIONS ────────────────────────────────────── */}
        {otherDestinations.length > 0 && (
          <section className="py-20 bg-background border-t border-border/50">
            <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">
                  Continue Exploring
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Other Extraordinary Places</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {otherDestinations.map((other) => (
                  <DestinationCard key={other.slug} destination={other} variant="standard" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 8. FINAL CTA ─────────────────────────────────────────────── */}
        <section className="py-24 bg-forest text-forest-foreground text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto px-6 space-y-6 relative z-10">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold">Bespoke Journey Design</p>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]">
              Ready to explore {d.name}?
            </h2>
            <p className="text-forest-foreground/80 text-base sm:text-lg leading-relaxed">
              Our Kenya specialists will tailor every camp, guide and transfer around your exact dates and pace.
            </p>
            <div className="pt-4">
              <EnquireDialog
                defaultSubject={`Journey to ${d.name}`}
                defaultDestination={`${d.name}, ${d.country}`}
                sourceUrl={`/destinations/${d.slug}`}
                autosaveKey={`enquire:destination-final:${d.slug}`}
                context={{
                  kind: "Destination",
                  title: `${d.name}, ${d.country}`,
                  dates: d.bestSeason ?? undefined,
                  slug: d.slug,
                  image: d.fallbackImage,
                }}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-gold/90 transition-all shadow-lg cursor-pointer"
                  >
                    <span>Start Planning</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <Lightbox
        images={galleryItems}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        title={`${d.name} gallery`}
      />
    </div>
  );
}
