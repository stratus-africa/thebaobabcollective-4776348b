import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, MapPin, Calendar } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ShareButtons } from "@/components/site/ShareButtons";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Lightbox } from "@/components/site/Lightbox";
import { TheBaobabPick } from "@/components/site/TheBaobabPick";
import { getDestinationBySlug, getDestinations } from "@/lib/cms.functions";

const destQuery = (slug: string) =>
  queryOptions({
    queryKey: ["destination", slug],
    queryFn: () => getDestinationBySlug({ data: { slug } }),
  });

const allDestQuery = queryOptions({
  queryKey: ["destinations"],
  queryFn: () => getDestinations(),
});

export const Route = createFileRoute("/destinations/$slug")({
  loader: async ({ params, context }) => {
    const d = await context.queryClient.ensureQueryData(destQuery(params.slug));
    if (!d) throw notFound();
    await context.queryClient.ensureQueryData(allDestQuery);
    return { destination: d };
  },
  head: ({ loaderData, params }) => {
    const d = loaderData?.destination;
    const title = d ? `${d.name}, ${d.country} — The Baobab Collective` : "Destination";
    const desc = d?.description?.slice(0, 160) ?? "Discover this destination.";
    const url = `https://thebaobabcollective.co.uk/destinations/${params.slug}`;
    const ldDest = d
      ? {
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          name: d.name,
          description: d.description ?? undefined,
          image: d.image ?? undefined,
          url,
          touristType: d.region ?? undefined,
          address: {
            "@type": "PostalAddress",
            addressCountry: d.country,
            addressRegion: d.region ?? undefined,
          },
          includesAttraction: d.featured_trips?.map((t: string) => ({
            "@type": "TouristAttraction",
            name: t,
          })),
        }
      : null;
    const ldCrumbs = {
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
        { "@type": "ListItem", position: 3, name: d?.name ?? params.slug, item: url },
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
        ...(d?.image ? [{ property: "og:image", content: d.image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(d?.image ? [{ name: "twitter:image", content: d.image }] : []),
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
  component: DestinationPage,
});

function DestinationPage() {
  const { slug } = Route.useParams();
  const { data: d } = useSuspenseQuery(destQuery(slug));
  const { data: all } = useSuspenseQuery(allDestQuery);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  if (!d) return null;
  const others = (all ?? []).filter((x: any) => x.slug !== d.slug).slice(0, 3);
  const gallery = (d as any).gallery as string[] | undefined;
  const galleryItems = (gallery ?? (d.image ? [d.image] : [])).map((src: string, i: number) => ({
    src,
    alt: `${d.name} — image ${i + 1}`,
    caption: `${d.name}, ${d.country}`,
  }));

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <Breadcrumbs items={[{ label: "Destinations", to: "/destinations" }, { label: d.name }]} />
      <main>
        <section className="relative h-[60vh] min-h-[420px] flex items-end">
          {d.image && <img src={d.image} alt={d.name} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative max-w-[1920px] mx-auto px-6 lg:px-10 pb-14 text-background w-full flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-3 inline-flex items-center gap-2">
                <MapPin className="w-3 h-3" /> {d.country} · {d.region}
              </p>
              <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-4">{d.name}</h1>
              {d.best_season && (
                <p className="text-sm md:text-base text-background/85 inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" /> Best time: {d.best_season}
                </p>
              )}
            </div>
            <ShareButtons
              title={`${d.name}, ${d.country} — The Baobab Collective`}
              description={d.description?.slice(0, 140)}
              label="Share"
            />
          </div>
        </section>

        <section className="py-20 md:py-24 bg-cream">
          <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 grid md:grid-cols-12 gap-10 lg:gap-16">
            <div className="md:col-span-8 space-y-8">
              <div>
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-3">Why Go?</p>
                <p className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed whitespace-pre-line">
                  {d.description}
                </p>
              </div>

              <TheBaobabPick
                title="The Baobab Pick"
                author="Our Local Perspective"
                note={`In ${d.name}, the magic happens at first light. We coordinate private early-morning game drives and walking safaris before the day warms up.`}
              />
            </div>
            <aside className="md:col-span-4 md:border-l md:border-border/60 md:pl-10 space-y-6 text-sm">
              <div className="bg-background rounded-xl p-6 border border-border space-y-5">
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 font-semibold mb-1">
                    Country
                  </p>
                  <p className="font-serif text-xl text-foreground">{d.country}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 font-semibold mb-1">
                    Region
                  </p>
                  <p className="font-serif text-xl text-foreground">{d.region}</p>
                </div>
                {d.best_season && (
                  <div>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-1 inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Best Time To Visit
                    </p>
                    <p className="text-foreground/90 font-medium">{d.best_season}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <EnquireDialog
                    defaultSubject={`Journey to ${d.name}`}
                    defaultDestination={`${d.name}, ${d.country}`}
                    sourceUrl={`/destinations/${d.slug}`}
                    autosaveKey={`enquire:destination:${d.slug}`}
                    context={{
                      kind: "Destination",
                      title: `${d.name}, ${d.country}`,
                      dates: d.best_season ?? undefined,
                      slug: d.slug,
                      image: d.image ?? undefined,
                    }}
                    trigger={
                      <button
                        type="button"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-5 py-3 hover:bg-gold/90 transition-colors shadow-sm"
                      >
                        <span>Plan A Journey Here</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    }
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>

        {d.featured_trips?.length ? (
          <section className="py-16 md:py-20 bg-background border-t border-border/40">
            <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">Experiences</p>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Activities & Signature Moments</h2>
                <p className="text-foreground/70 text-sm mt-2">A taste of what awaits in {d.name}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {d.featured_trips.map((t: string) => (
                  <span
                    key={t}
                    className="text-[11px] tracking-[0.18em] uppercase bg-cream border border-border px-5 py-2.5 text-foreground/85 rounded-full font-medium shadow-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {galleryItems.length > 1 && (
          <section className="pb-20">
            <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
              <h2 className="font-serif text-3xl text-foreground mb-8 text-center">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {galleryItems.map((g, i) => (
                  <button
                    type="button"
                    key={`${g.src}-${i}`}
                    onClick={() => {
                      setLightboxIndex(i);
                      setLightboxOpen(true);
                    }}
                    className="aspect-[4/3] overflow-hidden group block"
                    aria-label={`Open image ${i + 1} in lightbox`}
                  >
                    <img
                      src={g.src}
                      alt={g.alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-forest text-forest-foreground py-20 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-4xl mb-5">Plan your journey to {d.name}</h2>
            <p className="text-forest-foreground/80 mb-8">
              Our journey designers will craft a bespoke itinerary built around your dates, pace and dreams.
            </p>
            <EnquireDialog
              defaultSubject={`Enquiry about ${d.name}`}
              defaultDestination={`${d.name}, ${d.country}`}
              sourceUrl={`/destinations/${d.slug}`}
              autosaveKey={`enquire:destination:${d.slug}`}
              context={{
                kind: "Destination",
                title: `${d.name}, ${d.country}`,
                dates: d.best_season ?? undefined,
                slug: d.slug,
                image: d.image ?? undefined,
              }}
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[12px] px-8 py-4 hover:bg-gold/90 transition-colors"
                >
                  Start Planning <ArrowRight className="w-3 h-3" />
                </button>
              }
            />
          </div>
        </section>

        {others.length > 0 && (
          <section className="py-20 bg-cream">
            <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
              <h2 className="font-serif text-3xl text-foreground mb-10 text-center">Other Destinations</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {others.map((o: any) => (
                  <Link key={o.slug} to="/destinations/$slug" params={{ slug: o.slug }} className="group block">
                    <div className="overflow-hidden aspect-[4/3] mb-4">
                      <img
                        src={o.image}
                        alt={o.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <h3 className="font-serif text-2xl text-foreground mb-1 group-hover:text-gold transition-colors">
                      {o.name}
                    </h3>
                    <p className="text-sm text-foreground/70">
                      {o.country} · {o.region}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
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
