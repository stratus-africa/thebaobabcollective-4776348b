import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Check, Calendar, MapPin, Users, Sparkles, Mountain } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
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

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative h-[70vh] min-h-[480px] flex items-end">
          <img
            src={a.image}
            alt={a.imageAlt || a.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `${a.focalX ?? 50}% ${a.focalY ?? 50}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative max-w-[1920px] mx-auto px-6 lg:px-10 pb-16 text-background w-full">
            <Link
              to="/adventures"
              className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4 inline-block hover:underline"
            >
              ← All Adventures
            </Link>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-4 max-w-3xl">{a.name}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-background/90">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" /> {a.region}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" /> {a.nights}
              </span>
              <span className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-gold" /> {a.terrain}
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" /> {a.difficulty}
              </span>
            </div>
          </div>
        </section>

        <div className="max-w-[1920px] mx-auto px-6 lg:px-10 pt-6">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "Adventures", to: "/adventures" }, { label: a.name }]}
          />
        </div>

        {/* Overview + Sidebar */}
        <section className="py-16 md:py-20">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">Overview</p>
                <p className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed mb-6">{a.description}</p>
              </div>

              {a.highlights?.length > 0 && (
                <div>
                  <h2 className="font-serif text-3xl text-foreground mb-6">Adventure Highlights</h2>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {a.highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-foreground/80 bg-cream p-4">
                        <Check className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {a.highlights?.length > 0 && (
                <div>
                  <h2 className="font-serif text-3xl text-foreground mb-6">A Sample Rhythm</h2>
                  <div className="space-y-6">
                    {a.highlights.slice(0, 4).map((h, i) => (
                      <div key={h} className="flex gap-5 border-l-2 border-gold pl-6">
                        <div className="shrink-0">
                          <p className="text-[10px] tracking-[0.3em] uppercase text-gold">Phase</p>
                          <p className="font-serif text-3xl text-foreground">{String(i + 1).padStart(2, "0")}</p>
                        </div>
                        <div>
                          <h3 className="font-serif text-xl text-foreground mb-2">{h}</h3>
                          <p className="text-foreground/70 text-sm leading-relaxed">
                            Days of immersive guiding, intimate camps and conservation-led experiences crafted around
                            this chapter of your adventure.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-forest text-forest-foreground p-8 md:p-10">
                <h2 className="font-serif text-2xl mb-5">What's Included</h2>
                <ul className="grid sm:grid-cols-2 gap-3 text-sm text-forest-foreground/90">
                  {[
                    "All accommodation in hand-picked lodges & camps",
                    "Private expert guide throughout",
                    "All meals, drinks & park fees",
                    "Internal light-aircraft transfers",
                    "24/7 on-trip concierge",
                    "Conservation contribution",
                  ].map((x) => (
                    <li key={x} className="flex gap-2">
                      <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" /> {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 self-start space-y-6">
              <div className="bg-cream p-8">
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-3">Reserve Your Adventure</p>
                <p className="font-serif text-3xl text-foreground mb-1">On request</p>
                <p className="text-xs text-foreground/60 mb-6">per person, twin share · {a.nights}</p>
                <EnquireDialog
                  defaultSubject={a.name}
                  defaultDestination={a.name}
                  sourceUrl={url}
                  context={{ kind: "Itinerary", title: a.name, slug: a.slug, image: a.image }}
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
                  <Users className="w-4 h-4 text-gold mt-0.5" />
                  Every adventure is fully bespoke — adapt the route, lodges and pace to your travel style.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Share */}
        <section className="border-t border-border/40 py-10">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 flex flex-wrap items-center justify-between gap-6">
            <p className="font-serif text-xl text-foreground">Inspired? Share {a.name} with a fellow traveller.</p>
            <ShareButtons
              title={`${a.name} — The Baobab Collective`}
              url={url}
              description={a.description?.slice(0, 140)}
              label="Share this adventure"
            />
          </div>
        </section>

        {/* Enquire CTA */}
        <section className="bg-cream py-20 md:py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">Enquire</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Speak with an Adventure Designer</h2>
            <p className="text-foreground/70 mb-8">
              Share a few details about your dream {a.name} experience — we'll respond within 24 hours.
            </p>
            <EnquireDialog
              defaultSubject={a.name}
              defaultDestination={a.name}
              sourceUrl={url}
              context={{ kind: "Itinerary", title: a.name, slug: a.slug, image: a.image }}
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
