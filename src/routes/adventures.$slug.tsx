import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Check, Calendar, MapPin, Users, Sparkles, Mountain, X, Shield, TreeDeciduous } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { TheBaobabPick } from "@/components/site/TheBaobabPick";
import { getAdventuresPage } from "@/lib/adventures.functions";

const adventuresQuery = queryOptions({
  queryKey: ["adventures-page"],
  queryFn: () => getAdventuresPage(),
});

export const Route = createFileRoute("/adventures/$slug")({
  loader: async ({ params, context }) => {
    const page = await context.queryClient.ensureQueryData(adventuresQuery);
    const adv = page.signatures.find((s) => s.slug === params.slug);
    if (!adv) throw notFound();
    return { adv };
  },
  head: ({ loaderData, params }) => {
    const a = loaderData?.adv;
    const title = a ? `${a.name} — The Baobab Collective` : "Adventure";
    const desc = a?.description?.slice(0, 160) ?? "A signature African adventure.";
    const url = `https://thebaobabcollective.co.uk/adventures/${params.slug}`;
    const ldTrip = a
      ? {
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: a.name,
          description: a.description,
          image: a.image,
          touristType: a.difficulty,
          url,
        }
      : null;
    const ldCrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://thebaobabcollective.co.uk/" },
        { "@type": "ListItem", position: 2, name: "Adventures", item: "https://thebaobabcollective.co.uk/adventures" },
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
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-4">Adventure not found</h1>
        <Link to="/adventures" className="text-gold underline">
          Browse all adventures
        </Link>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-32 text-center">
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
        </div>
        <Footer />
      </div>
    );
  },
  component: AdventureDetail,
});

function AdventureDetail() {
  const { slug } = Route.useParams();
  const { data: page } = useSuspenseQuery(adventuresQuery);
  const a = page.signatures.find((s) => s.slug === slug)!;
  const url =
    typeof window !== "undefined" ? window.location.href : `https://thebaobabcollective.co.uk/adventures/${slug}`;

  const included = (
    Array.isArray(a.included) ? a.included : typeof a.included === "string" ? (a.included as string).split("\n") : []
  )
    .map((s) => s.trim())
    .filter(Boolean);

  const notIncluded = (
    Array.isArray(a.notIncluded)
      ? a.notIncluded
      : typeof a.notIncluded === "string"
        ? (a.notIncluded as string).split("\n")
        : []
  )
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        {/* Editorial Hero */}
        <section className="relative h-[72vh] min-h-[500px] flex items-end">
          <img
            src={a.image}
            alt={a.imageAlt || a.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `${a.focalX ?? 50}% ${a.focalY ?? 50}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-black/40 to-transparent" />

          <div className="relative max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 pb-12 sm:pb-16 text-cream w-full">
            <Link
              to="/adventures"
              className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-gold mb-4 inline-block hover:underline"
            >
              ← All Signature Adventures
            </Link>

            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl leading-[1.05] mb-4 max-w-4xl">{a.name}</h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-cream/90 mb-6">
              {a.region && (
                <span className="flex items-center gap-1.5 bg-forest/80 backdrop-blur px-3 py-1 rounded-full border border-gold/30">
                  <MapPin className="w-3.5 h-3.5 text-gold" /> {a.region}
                </span>
              )}
              {a.nights && (
                <span className="flex items-center gap-1.5 bg-forest/80 backdrop-blur px-3 py-1 rounded-full border border-gold/30">
                  <Calendar className="w-3.5 h-3.5 text-gold" /> {a.nights}
                </span>
              )}
              {a.terrain && (
                <span className="flex items-center gap-1.5 bg-forest/80 backdrop-blur px-3 py-1 rounded-full border border-gold/30">
                  <Mountain className="w-3.5 h-3.5 text-gold" /> {a.terrain}
                </span>
              )}
              {a.difficulty && (
                <span className="flex items-center gap-1.5 bg-forest/80 backdrop-blur px-3 py-1 rounded-full border border-gold/30">
                  <Sparkles className="w-3.5 h-3.5 text-gold" /> {a.difficulty}
                </span>
              )}
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
                    className="inline-flex items-center gap-3 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-3.5 hover:bg-gold/90 transition-colors shadow-lg"
                  >
                    <span>Start Planning This Journey</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                }
              />
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 pt-6">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "Adventures", to: "/adventures" }, { label: a.name }]}
          />
        </div>

        {/* Main Content + Sticky Sidebar */}
        <section className="py-14 md:py-20">
          <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 grid lg:grid-cols-[1.85fr_1.15fr] gap-12 lg:gap-16">
            <div className="space-y-12 min-w-0">
              {/* Overview */}
              <div>
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-3">Overview</p>
                <p className="font-serif text-2xl sm:text-3xl text-foreground leading-relaxed">{a.description}</p>
              </div>

              {/* The Baobab Pick note */}
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
                        className="flex gap-3 text-foreground/85 bg-cream/70 rounded-xl p-5 border border-border"
                      >
                        <Check className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                        <span className="text-sm sm:text-base leading-snug">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* A Sample Rhythm */}
              {a.highlights?.length > 0 && (
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">A Sample Journey Rhythm</h2>
                  <div className="space-y-6">
                    {a.highlights.slice(0, 4).map((h, i) => (
                      <div key={h} className="flex gap-5 border-l-2 border-gold pl-6 py-1">
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
                </div>
              )}

              {/* Dynamic Inclusions & Exclusions */}
              {(included.length > 0 || notIncluded.length > 0) && (
                <div className="space-y-6">
                  {included.length > 0 && (
                    <div className="bg-forest text-forest-foreground p-8 md:p-10 rounded-xl border border-forest-foreground/10">
                      <h2 className="font-serif text-2xl sm:text-3xl text-cream mb-5 flex items-center gap-2">
                        <Check className="w-5 h-5 text-gold" /> What's Included
                      </h2>
                      <ul className="grid sm:grid-cols-2 gap-3 text-sm text-forest-foreground/90">
                        {included.map((x, idx) => (
                          <li key={`${x}-${idx}`} className="flex gap-2.5 items-start">
                            <span className="text-gold font-bold">•</span>
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {notIncluded.length > 0 && (
                    <div className="border border-border bg-cream/50 p-8 md:p-10 rounded-xl">
                      <h2 className="font-serif text-2xl text-foreground mb-5 flex items-center gap-2">
                        <X className="w-5 h-5 text-terracotta" /> What's Not Included
                      </h2>
                      <ul className="grid sm:grid-cols-2 gap-3 text-sm text-foreground/80">
                        {notIncluded.map((x, idx) => (
                          <li key={`${x}-${idx}`} className="flex gap-2.5 items-start">
                            <span className="text-terracotta font-bold">•</span>
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Your Journey's Impact */}
              <div className="rounded-xl border border-border bg-cream/40 p-8 space-y-4">
                <div className="flex items-center gap-2 text-gold">
                  <Shield className="w-5 h-5" />
                  <span className="text-[11px] tracking-[0.25em] uppercase font-semibold text-foreground">
                    Your Journey's Impact
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-foreground">Conservation & Local Stewardship</h3>
                <p className="text-foreground/75 text-sm leading-relaxed">
                  By embarking on this journey, you directly support local conservancies, anti-poaching initiatives, and
                  indigenous guides who steward Kenya's wildest landscapes.
                </p>
              </div>
            </div>

            {/* Sticky Sidebar */}
            <aside className="lg:sticky lg:top-24 self-start space-y-6">
              <div className="bg-cream p-8 rounded-xl border border-border shadow-sm">
                <p className="text-[10px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-2">
                  Bespoke Journey
                </p>
                <p className="font-serif text-3xl sm:text-4xl text-foreground mb-1">Price on Request</p>
                <p className="text-xs text-foreground/65 mb-6">
                  {a.nights ? `${a.nights} · ` : ""}Tailored to your dates, party & preferred camps
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
                      <span>Enquire About This Journey</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  }
                />

                <div className="mt-6 pt-6 border-t border-foreground/10 space-y-3 text-xs text-foreground/70">
                  <p className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>Every adventure is 100% bespoke — customize the camps, pacing and route with our team.</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Share Strip */}
        <section className="border-t border-border/40 py-10">
          <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 flex flex-wrap items-center justify-between gap-6">
            <p className="font-serif text-xl text-foreground">Inspired? Share {a.name} with a fellow traveller.</p>
            <ShareButtons
              title={`${a.name} — The Baobab Collective`}
              url={url}
              description={a.description?.slice(0, 140)}
              label="Share this adventure"
            />
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-cream py-20 md:py-24 text-center border-t border-border/40">
          <div className="max-w-3xl mx-auto px-6 space-y-5">
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold">Start Here</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">Ready to experience Kenya differently?</h2>
            <p className="text-foreground/75 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
              Share your thoughts about your dream {a.name} journey — we will respond within 24 hours with a thoughtful
              first proposal.
            </p>
            <div className="pt-3">
              <EnquireDialog
                defaultSubject={a.name}
                defaultDestination={a.region || a.name}
                sourceUrl={url}
                context={{ kind: "Itinerary", title: a.name, slug: a.slug, image: a.image }}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-terracotta/90 transition-colors shadow-lg"
                  >
                    <span>Start Planning Your Journey</span>
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
