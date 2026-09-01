import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Mountain,
  Sparkles,
  ChevronRight,
  Users,
  Check,
  X,
  Shield,
  Bed,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ShareButtons } from "@/components/site/ShareButtons";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { TheBaobabPick } from "@/components/site/TheBaobabPick";
import { AdventureCard, getHumanDifficulty } from "@/components/site/AdventureCard";
import { getAdventuresPage } from "@/lib/adventures.functions";
import { getDestinations, getLodges } from "@/lib/cms.functions";
import { resolveImageSource } from "@/lib/image-resolution";

const adventuresQuery = queryOptions({
  queryKey: ["adventures-page"],
  queryFn: () => getAdventuresPage(),
});

const destinationsQuery = queryOptions({
  queryKey: ["destinations"],
  queryFn: () => getDestinations(),
});

const lodgesQuery = queryOptions({
  queryKey: ["lodges"],
  queryFn: () => getLodges(),
});

export const Route = createFileRoute("/adventures/$slug")({
  loader: async ({ params, context }) => {
    const page = await context.queryClient.ensureQueryData(adventuresQuery);
    await Promise.all([
      context.queryClient.ensureQueryData(destinationsQuery),
      context.queryClient.ensureQueryData(lodgesQuery),
    ]);
    const adventure = page.signatures.find((s) => s.slug === params.slug);
    if (!adventure) throw notFound();
    return { adventure };
  },
  head: ({ loaderData, params }) => {
    const a = loaderData?.adventure;
    const title = a ? `${a.name} — The Baobab Collective` : "Adventure — The Baobab Collective";
    const desc =
      a?.shortDescription || a?.description || "Discover a bespoke Kenya safari adventure with The Baobab Collective.";
    const url = `https://thebaobabcollective.co.uk/adventures/${params.slug}`;

    const ldTrip = a
      ? {
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: a.name,
          description: a.shortDescription || a.description,
          image: a.image,
          url,
          touristType: a.region,
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
          name: "Adventures",
          item: "https://thebaobabcollective.co.uk/adventures",
        },
        { "@type": "ListItem", position: 3, name: a?.name ?? params.slug, item: url },
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
        ...(a?.image ? [{ property: "og:image", content: a.image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(a?.image ? [{ name: "twitter:image", content: a.image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ...(ldTrip ? [{ type: "application/ld+json", children: JSON.stringify(ldTrip) }] : []),
        { type: "application/ld+json", children: JSON.stringify(ldCrumbs) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-4">Adventure not found</h1>
        <p className="text-foreground/70 mb-6">The requested Kenya adventure could not be located.</p>
        <Link to="/adventures" className="text-gold underline">
          Back to all adventures
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
  component: AdventureDetailPage,
});

function AdventureDetailPage() {
  const { slug } = Route.useParams();
  const { data: page } = useSuspenseQuery(adventuresQuery);
  const { data: allDestinations } = useSuspenseQuery(destinationsQuery);
  const { data: lodges } = useSuspenseQuery(lodgesQuery);

  const a = useMemo(() => {
    const found = page.signatures.find((s) => s.slug === slug);
    if (!found) throw notFound();
    return found;
  }, [page, slug]);

  const diffMeta = getHumanDifficulty(a.difficulty);
  const heroImage = resolveImageSource(a.image) ?? null;
  const url = `https://thebaobabcollective.co.uk/adventures/${a.slug}`;
  const included = a.included ?? [];
  const notIncluded = a.notIncluded ?? [];

  const relatedLodges = useMemo(() => {
    const region = (a.region || "").toLowerCase();
    const destNames = (a.destinations || []).map((d) => d.toLowerCase());
    return (lodges ?? []).filter((l: any) => {
      const loc = (l.location || "").toLowerCase();
      return loc.includes(region) || destNames.some((d) => loc.includes(d));
    });
  }, [lodges, a]);

  const relatedDestinations = useMemo(() => {
    if (!a.destinations || a.destinations.length === 0) return [];
    const names = a.destinations.map((d) => d.toLowerCase());
    return (allDestinations ?? []).filter(
      (d: any) => names.includes((d.name || "").toLowerCase()) || names.includes((d.slug || d.id || "").toLowerCase()),
    );
  }, [allDestinations, a]);

  const fallbackDestinations = useMemo(() => {
    return (allDestinations ?? [])
      .filter((d: any) => (d.region || "").toLowerCase() === (a.region || "").toLowerCase())
      .slice(0, 4);
  }, [allDestinations, a]);

  const similarAdventures = useMemo(() => {
    return (page.signatures ?? [])
      .filter((s) => s.slug !== a.slug && (s.region === a.region || s.difficulty === a.difficulty))
      .slice(0, 3);
  }, [page, a]);

  return (
    <div className="bg-background min-h-screen selection:bg-gold selection:text-gold-foreground">
      <Navbar />
      <main id="main-content">
        {/* ── CINEMATIC HERO ───────────────────────────────────────────── */}
        <section className="relative h-[65vh] min-h-[460px] max-h-[720px] flex items-end bg-forest text-cream overflow-hidden">
          {heroImage ? (
            <img
              src={heroImage}
              alt={a.imageAlt || a.name}
              className="absolute inset-0 w-full h-full object-cover"
              decoding="async"
              fetchPriority="high"
              sizes="100vw"
            />
          ) : (
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-gold)_34%,transparent),transparent_45%),linear-gradient(135deg,var(--color-forest),var(--color-forest-dark))]"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <div className="relative max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16 pb-14 text-cream w-full flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-[11px] sm:text-xs tracking-[0.35em] uppercase text-gold font-semibold mb-3 inline-flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {a.region || "Kenya"}
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.04] mb-4 text-cream">
                {a.name}
              </h1>
              {a.shortDescription && (
                <p className="text-lg md:text-xl text-cream/90 max-w-2xl leading-relaxed mb-6 font-sans">
                  {a.shortDescription}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-cream/90 mb-8">
                {a.region && (
                  <span className="flex items-center gap-1.5 bg-forest/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-gold/30">
                    <MapPin className="w-3.5 h-3.5 text-gold" /> {a.region}
                  </span>
                )}
                {a.nights && (
                  <span className="flex items-center gap-1.5 bg-forest/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-gold/30">
                    <Calendar className="w-3.5 h-3.5 text-gold" /> {a.nights}
                  </span>
                )}
                {a.terrain && (
                  <span className="flex items-center gap-1.5 bg-forest/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-gold/30">
                    <Mountain className="w-3.5 h-3.5 text-gold" /> {a.terrain}
                  </span>
                )}
                {a.difficulty && (
                  <span className="flex items-center gap-1.5 bg-forest/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-gold/30 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-gold" /> {diffMeta.label}
                  </span>
                )}
              </div>
            </div>
            <div>
              <EnquireDialog
                defaultSubject={a.name}
                defaultDestination={a.region || a.name}
                sourceUrl={url}
                context={{ kind: "Itinerary", title: a.name, slug: a.slug, image: a.image }}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-3 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-gold/90 transition-colors shadow-xl"
                  >
                    <span>Make This Journey Yours</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                }
              />
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16 pt-8">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "Adventures", to: "/adventures" }, { label: a.name }]}
          />
        </div>

        {/* AT A GLANCE STRIP */}
        <section className="py-12 border-b border-border/50 bg-cream/40 mt-6">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
            <p className="text-[10px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-4">AT A GLANCE</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-sm">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 block mb-1 font-semibold">
                  Duration
                </span>
                <span className="font-serif text-lg text-foreground">{a.nights || "Bespoke"}</span>
              </div>
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 block mb-1 font-semibold">
                  Region
                </span>
                <span className="font-serif text-lg text-foreground">{a.region || "Kenya"}</span>
              </div>
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 block mb-1 font-semibold">
                  Destinations
                </span>
                <span className="font-serif text-lg text-foreground">
                  {a.destinations && a.destinations.length > 0 ? a.destinations.join(" · ") : a.region}
                </span>
              </div>
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 block mb-1 font-semibold">
                  Terrain
                </span>
                <span className="font-serif text-lg text-foreground">{a.terrain || "Savannah & Bush"}</span>
              </div>
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 block mb-1 font-semibold">
                  Pacing / Difficulty
                </span>
                <span className="font-serif text-lg text-foreground">{diffMeta.label}</span>
              </div>
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 block mb-1 font-semibold">
                  Travel Style
                </span>
                <span className="font-serif text-lg text-foreground">
                  {a.travelStyles && a.travelStyles.length > 0 ? a.travelStyles.join(" · ") : "Private Safari"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content + Sticky Sidebar */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16 grid lg:grid-cols-[1.85fr_1.15fr] gap-12 lg:gap-16">
            <div className="space-y-16 min-w-0">
              {/* WHY YOU'LL LOVE IT */}
              <div>
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-3">
                  WHY YOU'LL LOVE IT
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">{a.name} Overview</h2>
                <p className="text-foreground/80 text-lg sm:text-xl leading-relaxed font-sans">{a.description}</p>
              </div>

              {/* The Baobab Pick Note */}
              <TheBaobabPick
                title="The Baobab Pick"
                author="Michael & Samra's Recommendation"
                note="We deliberately slow the pace on this journey to allow for extended morning walking safaris and unhurried bush breakfasts where you can truly take in Kenya's quiet wilderness."
              />

              {/* Adventure Highlights */}
              {a.highlights?.length > 0 && (
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">Adventure Highlights</h2>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {a.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex gap-3.5 text-foreground/85 bg-cream/70 rounded-xl p-5 border border-border/70"
                      >
                        <Check className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                        <span className="text-sm sm:text-base leading-snug font-medium">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* YOUR JOURNEY / ITINERARY */}
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-8">YOUR JOURNEY</h2>
                {a.itinerary && a.itinerary.length > 0 ? (
                  <div className="space-y-8">
                    {a.itinerary.map((step, idx) => (
                      <div key={idx} className="border-l-2 border-gold pl-6 md:pl-8 py-2">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold block mb-1">
                          {step.day}
                        </span>
                        <h3 className="font-serif text-2xl text-foreground mb-2">{step.title}</h3>
                        <p className="text-foreground/75 leading-relaxed text-sm sm:text-base">{step.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(a.highlights || []).slice(0, 4).map((h, i) => (
                      <div key={h} className="flex gap-5 border-l-2 border-gold pl-6 py-2">
                        <div className="shrink-0">
                          <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold">Phase</p>
                          <p className="font-serif text-3xl text-foreground">{String(i + 1).padStart(2, "0")}</p>
                        </div>
                        <div>
                          <h3 className="font-serif text-xl sm:text-2xl text-foreground mb-1.5">{h}</h3>
                          <p className="text-foreground/70 text-sm leading-relaxed">
                            Days of immersive guiding, intimate camps and conservation-led encounters crafted around
                            this chapter of your journey.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WHERE YOU'LL STAY */}
              {relatedLodges.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-gold mb-3">
                    <Bed className="w-5 h-5" />
                    <span className="text-[11px] tracking-[0.25em] uppercase font-semibold text-foreground">
                      ACCOMMODATION
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">WHERE YOU'LL STAY</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {relatedLodges.map((lodge) => (
                      <div
                        key={lodge.id}
                        className="border border-border bg-cream/40 rounded-xl overflow-hidden p-5 flex flex-col justify-between"
                      >
                        <div>
                          {lodge.hero_image && (
                            <img
                              src={lodge.hero_image}
                              alt={lodge.name}
                              className="w-full aspect-[16/10] object-cover rounded-lg mb-4"
                            />
                          )}
                          <h3 className="font-serif text-xl text-foreground mb-1">{lodge.name}</h3>
                          <p className="text-xs text-gold font-medium mb-3">{lodge.location}</p>
                          <p className="text-xs text-foreground/70 line-clamp-3 leading-relaxed mb-4">
                            {lodge.description}
                          </p>
                        </div>
                        <Link
                          to="/lodges/$slug"
                          params={{ slug: lodge.slug }}
                          className="inline-flex items-center gap-1.5 text-xs text-gold font-semibold uppercase tracking-[0.2em] hover:underline"
                        >
                          <span>Explore Lodge</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DYNAMIC INCLUSIONS & EXCLUSIONS — always show with forest-green background */}
              {(() => {
                const displayIncluded =
                  included.length > 0
                    ? included
                    : [
                        "Expert private guide for the full duration",
                        "All game drives and bush activities",
                        "Full-board accommodation at all camps",
                        "All park and conservancy fees",
                        "Airport and airstrip transfers",
                        "Shared charter flights between destinations (where applicable)",
                        "Sundowner drinks and bush breakfasts",
                        "All laundry services at camp",
                      ];
                const displayNotIncluded =
                  notIncluded.length > 0
                    ? notIncluded
                    : [
                        "International and domestic scheduled flights",
                        "Travel insurance (required)",
                        "Visas and passport fees",
                        "Tips and gratuities",
                        "Personal shopping and souvenirs",
                        "Spa and premium alcohol beyond standard offerings",
                      ];
                return (
                  <div className="space-y-8">
                    <div className="bg-forest text-forest-foreground p-8 md:p-10 rounded-2xl border border-gold/20 shadow-lg">
                      <h2 className="font-serif text-2xl sm:text-3xl text-cream mb-6 flex items-center gap-3">
                        <Check className="w-6 h-6 text-gold" /> WHAT'S INCLUDED
                      </h2>
                      <ul className="grid sm:grid-cols-2 gap-4 text-sm text-forest-foreground/90 font-sans">
                        {displayIncluded.map((item, idx) => (
                          <li key={`inc-${idx}`} className="flex gap-3 items-start">
                            <span className="text-gold font-bold shrink-0">•</span>
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-border bg-cream/50 p-8 md:p-10 rounded-2xl">
                      <h2 className="font-serif text-2xl text-foreground mb-6 flex items-center gap-3">
                        <X className="w-6 h-6 text-terracotta" /> WHAT'S NOT INCLUDED
                      </h2>
                      <ul className="grid sm:grid-cols-2 gap-4 text-sm text-foreground/80 font-sans">
                        {displayNotIncluded.map((item, idx) => (
                          <li key={`exc-${idx}`} className="flex gap-3 items-start">
                            <span className="text-terracotta font-bold shrink-0">•</span>
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}

              {/* YOUR JOURNEY'S IMPACT */}
              <div className="rounded-2xl border border-border bg-cream/40 p-8 md:p-10 space-y-4">
                <div className="flex items-center gap-2 text-gold">
                  <Shield className="w-5 h-5" />
                  <span className="text-[11px] tracking-[0.25em] uppercase font-semibold text-foreground">
                    YOUR JOURNEY'S IMPACT
                  </span>
                </div>
                <h3 className="font-serif text-2xl md:text-3xl text-foreground">Conservation & Local Stewardship</h3>
                <p className="text-foreground/75 text-sm md:text-base leading-relaxed font-sans">
                  By embarking on this journey, you directly support local conservancies, anti-poaching initiatives, and
                  indigenous guides who steward Kenya's wildest landscapes.
                </p>
              </div>

              {/* THIS JOURNEY TAKES YOU TO (Related Destinations) */}
              {(relatedDestinations.length > 0 || fallbackDestinations.length > 0) && (
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold mb-3">DESTINATIONS</p>
                  <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">THIS JOURNEY TAKES YOU TO</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {(relatedDestinations.length > 0 ? relatedDestinations : fallbackDestinations).map((dest: any) => (
                      <Link
                        key={dest.slug || dest.id}
                        to="/destinations/$slug"
                        params={{ slug: dest.slug || dest.id }}
                        className="group border border-border bg-background rounded-xl p-5 hover:border-gold/60 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {dest.image && (
                            <img
                              src={dest.image}
                              alt={dest.name}
                              className="w-full aspect-[16/10] object-cover rounded-lg mb-4 group-hover:scale-102 transition-transform"
                            />
                          )}
                          <h3 className="font-serif text-xl text-foreground group-hover:text-gold transition-colors mb-1">
                            {dest.name}
                          </h3>
                          <p className="text-xs text-foreground/60 mb-3">{dest.region}</p>
                          <p className="text-xs text-foreground/75 line-clamp-2 leading-relaxed">
                            {dest.short_description || dest.shortDescription || dest.description}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-gold font-semibold uppercase tracking-[0.2em]">
                          <span>Explore Destination</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Sidebar */}
            <aside className="lg:sticky lg:top-28 self-start space-y-6">
              <div className="bg-cream p-8 md:p-10 rounded-2xl border border-border shadow-lg">
                <p className="text-[10px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-2">
                  BESPOKE KENYA ADVENTURE
                </p>
                <p className="font-serif text-3xl sm:text-4xl text-foreground mb-2">Price on Request</p>
                <p className="text-xs text-foreground/70 mb-8 leading-relaxed">
                  {a.nights ? `${a.nights} · ` : ""}Tailored to your travel dates, party size & camp preferences.
                </p>

                <EnquireDialog
                  defaultSubject={a.name}
                  defaultDestination={a.region || a.name}
                  sourceUrl={url}
                  context={{ kind: "Itinerary", title: a.name, slug: a.slug, image: a.image }}
                  trigger={
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-6 py-4 hover:bg-gold/90 transition-colors shadow-md"
                    >
                      <span>Make This Journey Yours</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  }
                />

                <div className="mt-8 pt-6 border-t border-foreground/10 space-y-4 text-xs text-foreground/75">
                  <p className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>100% Bespoke — shaped around your pace, preferences, and travelling party.</span>
                  </p>
                  <p className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Flexible dates — travel at the optimal time for wildlife and weather.</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* SIMILAR ADVENTURES */}
        {similarAdventures.length > 0 && (
          <section className="py-20 bg-cream/50 border-t border-border/40">
            <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">SIMILAR JOURNEYS</p>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground">YOU MIGHT ALSO LOVE</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {similarAdventures.map((other) => (
                  <AdventureCard key={other.slug} adventure={other} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Share Strip */}
        <section className="border-t border-border/40 py-10 bg-background">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16 flex flex-wrap items-center justify-between gap-6">
            <p className="font-serif text-xl text-foreground">Inspired? Share {a.name} with a fellow traveller.</p>
            <ShareButtons
              title={`${a.name} — The Baobab Collective`}
              url={url}
              description={a.description?.slice(0, 140)}
              label="Share this adventure"
            />
          </div>
        </section>

        {/* "NOT QUITE RIGHT?" CONVERSION BANNER */}
        <section className="bg-background py-20 border-t border-border/40 text-center">
          <div className="max-w-3xl mx-auto px-6 space-y-5">
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold">CUSTOM TAILORING</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              CAN'T FIND EXACTLY WHAT YOU'RE LOOKING FOR?
            </h2>
            <p className="text-foreground/75 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
              Our Adventures are starting points. We can reshape the journey around your dates, interests, pace and
              budget.
            </p>
            <div className="pt-3">
              <EnquireDialog
                defaultSubject={`Custom Tailored — ${a.name}`}
                defaultDestination={a.region || a.name}
                sourceUrl={url}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-terracotta/90 transition-colors shadow-lg"
                  >
                    <span>Create My Journey</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                }
              />
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="bg-forest text-forest-foreground py-24 text-center border-t border-border/40">
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold">MAKE THIS JOURNEY YOURS.</p>
            <h2 className="font-serif text-4xl md:text-5xl text-cream">
              Tell us what you're dreaming of and we'll shape this adventure around you.
            </h2>
            <div className="pt-4">
              <EnquireDialog
                defaultSubject={a.name}
                defaultDestination={a.region || a.name}
                sourceUrl={url}
                context={{ kind: "Itinerary", title: a.name, slug: a.slug, image: a.image }}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2.5 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-gold/90 transition-colors shadow-xl"
                  >
                    <span>Plan This Journey</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                }
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
