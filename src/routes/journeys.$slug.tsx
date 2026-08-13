import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/journeys/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/adventures" });
  },
  component: () => null,
});

const featuredDestinationsQuery = queryOptions({
  queryKey: ["destinations", "featured"],
  queryFn: () => getDestinations(),
});

export const Route = createFileRoute("/journeys/$slug")({
  loader: ({ params }) => {
    const journey = getJourney(params.slug);
    if (!journey) throw notFound();
    return { journey };
  },
  head: ({ loaderData, params }) => {
    const j = loaderData?.journey;
    const title = j ? `${j.title} Journeys — The Baobab Collective` : "Journey";
    const desc = j?.intro?.slice(0, 160) ?? "Curated safari journey";
    const url = `https://thebaobabcollective.co.uk/journeys/${params.slug}`;
    const ldTrip = j
      ? {
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: j.title,
          description: j.intro ?? j.tagline,
          image: j.heroImage ?? undefined,
          url,
          itinerary: (j.itineraries as Itinerary[])?.map((it, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: it.name,
            description: it.description,
          })),
        }
      : null;
    const ldCrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://thebaobabcollective.co.uk/" },
        { "@type": "ListItem", position: 2, name: "Journeys", item: "https://thebaobabcollective.co.uk/journeys" },
        { "@type": "ListItem", position: 3, name: j?.title ?? params.slug, item: url },
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
        ...(j?.heroImage ? [{ property: "og:image", content: j.heroImage }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(j?.heroImage ? [{ name: "twitter:image", content: j.heroImage }] : []),
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
        <h1 className="font-serif text-4xl mb-4">Journey not found</h1>
        <Link to="/journeys" className="text-gold underline">Back to all journeys</Link>
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
  component: JourneyPage,
});

function JourneyPage() {
  const { journey } = Route.useLoaderData();
  const others = journeys.filter((j) => j.slug !== journey.slug);
  const { data: destinations } = useQuery(featuredDestinationsQuery);
  const featuredDestinations = (destinations ?? []).slice(0, 3);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const galleryImages = Array.from(
    new Set([journey.heroImage, ...(journey.itineraries as Itinerary[]).map((i) => i.image)].filter(Boolean)),
  );
  const itineraryByImage = new Map<string, string>();
  (journey.itineraries as Itinerary[]).forEach((it) => {
    if (it.image && !itineraryByImage.has(it.image)) itineraryByImage.set(it.image, it.name);
  });
  const galleryItems = galleryImages.map((src, i) => ({
    src,
    alt: `${journey.title} — image ${i + 1}`,
    caption: itineraryByImage.get(src) ?? journey.title,
  }));

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <Breadcrumbs
        items={[
          { label: "Journeys", to: "/journeys" },
          { label: journey.title },
        ]}
      />
      <main>
        <section className="relative h-[60vh] min-h-[420px] flex items-end">
          <img
            src={journey.heroImage}
            alt={`${journey.title} — ${journey.tagline}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative max-w-[1920px] mx-auto px-6 lg:px-10 pb-16 text-background w-full flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4">Our Journeys</p>
              <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-4">{journey.title}</h1>
              <p className="text-lg md:text-xl text-background/90 max-w-xl">{journey.tagline}</p>
            </div>
            <div className="text-background/90">
              <ShareButtons
                title={`${journey.title} — The Baobab Collective`}
                description={journey.tagline}
                label="Share"
              />
            </div>
          </div>
        </section>


        <section className="py-20 md:py-28 bg-cream">
          <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-5">The Journey</p>
            <p className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed">{journey.intro}</p>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-12 text-center">
              Featured Itineraries
            </h2>
            <div className="space-y-16">
              {(journey.itineraries as Itinerary[]).map((it: Itinerary, idx: number) => (
                <article
                  key={it.name}
                  className={`grid md:grid-cols-2 gap-10 items-center ${idx % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""}`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.25em] uppercase text-gold mb-2">{it.nights}</p>
                    <h3 className="font-serif text-3xl text-foreground mb-4">{it.name}</h3>
                    <p className="text-foreground/75 mb-6 leading-relaxed">{it.description}</p>
                    <ul className="space-y-2 mb-8">
                      {it.highlights.map((h: string) => (
                        <li key={h} className="flex gap-3 text-foreground/80">
                          <Check className="w-4 h-4 text-gold mt-1 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to="/itineraries/$slug"
                        params={{ slug: (it as any).slug ?? it.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }}
                        className="inline-flex items-center gap-2 bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[11px] px-6 py-3 hover:bg-gold/90"
                      >
                        View Itinerary <ArrowRight className="w-3 h-3" />
                      </Link>
                      <EnquireDialog
                        defaultSubject={`Enquiry about ${it.name}`}
                        defaultDestination={it.name}
                        sourceUrl={`/journeys/${journey.slug}`}
                        autosaveKey={`enquire:itinerary:${(it as any).slug ?? it.name}`}
                        context={{
                          kind: "Itinerary",
                          title: it.name,
                          dates: it.nights,
                          slug: (it as any).slug ?? it.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                          image: it.image,
                        }}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 border border-gold text-gold uppercase tracking-[0.25em] text-[11px] px-6 py-3 hover:bg-gold hover:text-gold-foreground transition-colors"
                          >
                            Enquire
                          </button>
                        }
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {galleryItems.length >= 2 && (
          <section className="pb-20 bg-cream pt-16">
            <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
              <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-3 text-center">Glimpses</p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-10 text-center">Gallery</h2>
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
            <h2 className="font-serif text-4xl mb-5">Begin your {journey.title.toLowerCase()} journey</h2>
            <p className="text-forest-foreground/80 mb-8">
              Every journey we craft is bespoke. Tell us your dates, dreams and travel style — we'll do the rest.
            </p>
            <EnquireDialog
              defaultSubject={`Enquiry about ${journey.title}`}
              sourceUrl={`/journeys/${journey.slug}`}
              autosaveKey={`enquire:journey:${journey.slug}`}
              context={{
                kind: "Journey",
                title: journey.title,
                slug: journey.slug,
                image: journey.heroImage,
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

        {featuredDestinations.length > 0 && (
          <section className="py-20">
            <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
              <div className="text-center mb-12">
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-3">Where it could take you</p>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground">Featured Destinations</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {featuredDestinations.map((d: any) => (
                  <Link
                    key={d.slug}
                    to="/destinations/$slug"
                    params={{ slug: d.slug }}
                    className="group block"
                  >
                    <div className="overflow-hidden aspect-[4/3] mb-4">
                      <img
                        src={d.image}
                        alt={d.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-gold mb-1 inline-flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {d.country}{d.region ? ` · ${d.region}` : ""}
                    </p>
                    <h3 className="font-serif text-2xl text-foreground group-hover:text-gold transition-colors">
                      {d.name}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-20 bg-cream">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
            <h2 className="font-serif text-3xl text-foreground mb-10 text-center">Other Journeys</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  to="/journeys/$slug"
                  params={{ slug: o.slug }}
                  className="group block"
                >
                  <div className="overflow-hidden aspect-[4/3] mb-4">
                    <img src={o.heroImage} alt={o.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <h3 className="font-serif text-2xl text-foreground mb-1">{o.title}</h3>
                  <p className="text-sm text-foreground/70">{o.tagline}</p>
                </Link>
              ))}
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
        title={`${journey.title} gallery`}
      />
    </div>
  );
}
