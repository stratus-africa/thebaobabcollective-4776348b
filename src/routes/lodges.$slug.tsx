import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Check, MapPin, Users, BedDouble } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ShareButtons } from "@/components/site/ShareButtons";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Lightbox } from "@/components/site/Lightbox";
import { getLodgeBySlug, getLodges } from "@/lib/cms.functions";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const lodgeQuery = (slug: string) =>
  queryOptions({
    queryKey: ["lodge", slug],
    queryFn: () => getLodgeBySlug({ data: { slug } }),
  });

const allLodgesQuery = queryOptions({
  queryKey: ["lodges"],
  queryFn: () => getLodges(),
});

export const Route = createFileRoute("/lodges/$slug")({
  loader: async ({ params, context }) => {
    const l = await context.queryClient.ensureQueryData(lodgeQuery(params.slug));
    if (!l) throw notFound();
    await context.queryClient.ensureQueryData(allLodgesQuery);
    return { lodge: l };
  },
  head: ({ loaderData, params }) => {
    const l = loaderData?.lodge;
    const title = l ? `${l.name}, ${l.location} — The Baobab Collective` : "Lodge";
    const desc = l?.description?.slice(0, 160) ?? "A handpicked safari lodge.";
    const url = `https://thebaobabcollective.co.uk/lodges/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(l?.hero_image ? [{ property: "og:image", content: l.hero_image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        ...(l?.hero_image ? [{ name: "twitter:image", content: l.hero_image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-4">Lodge not found</h1>
        <Link to="/lodges" className="text-gold underline">
          Back to all lodges
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
  component: LodgePage,
});

function LodgePage() {
  const { slug } = Route.useParams();
  const { data: l } = useSuspenseQuery(lodgeQuery(slug));
  const { data: all } = useSuspenseQuery(allLodgesQuery);
  const { formatPrice } = useSiteSettings();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  if (!l) return null;
  const others = (all ?? []).filter((x: any) => x.slug !== l.slug).slice(0, 3);
  const gallery = (l.gallery ?? []).map((src: string, i: number) => ({
    src,
    alt: `${l.name} — image ${i + 1}`,
    caption: `${l.name} · ${l.location}`,
  }));
  const url = typeof window !== "undefined" ? window.location.href : `https://thebaobabcollective.co.uk/lodges/${slug}`;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        {/* Hero — matches Adventure detail: 70vh, single gradient, breadcrumb below */}
        <section className="relative h-[70vh] min-h-[480px] flex items-end">
          {l.hero_image && (
            <img src={l.hero_image} alt={l.name} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/82 via-forest-dark/40 to-transparent" />
          <div className="relative max-w-[1920px] mx-auto px-6 lg:px-10 pb-16 text-background w-full">
            <Link
              to="/lodges"
              className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4 inline-block hover:underline"
            >
              ← All Lodges
            </Link>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-4 max-w-3xl">{l.name}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-background/90">
              {l.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" /> {l.location}
                </span>
              )}
              {l.amenities?.length ? (
                <span className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-gold" /> {l.amenities.length} amenities
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <div className="max-w-[1920px] mx-auto px-6 lg:px-10 pt-6">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Lodges", to: "/lodges" }, { label: l.name }]} />
        </div>

        {/* Overview + sticky Enquire sidebar */}
        <section className="py-16 md:py-20">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">About this lodge</p>
                <p className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed whitespace-pre-line">
                  {l.description}
                </p>
              </div>

              {l.amenities?.length ? (
                <div>
                  <h2 className="font-serif text-3xl text-foreground mb-6">Amenities</h2>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {l.amenities.map((a: string) => (
                      <li key={a} className="flex gap-3 text-foreground/80 bg-cream p-4">
                        <Check className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {gallery.length ? (
                <div>
                  <h2 className="font-serif text-3xl text-foreground mb-6">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {gallery.map((g: { src: string; alt: string }, i: number) => (
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
              ) : null}
            </div>

            {/* Sticky sidebar with pricing + Enquire */}
            <aside className="lg:sticky lg:top-24 self-start space-y-6">
              <div className="bg-cream p-8">
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-3">Reserve Your Stay</p>
                <p className="font-serif text-3xl text-foreground mb-1">
                  {l.price_from_usd ? formatPrice(l.price_from_usd) : "On request"}
                </p>
                <p className="text-xs text-foreground/60 mb-6">
                  {l.price_from_usd ? "per night · from" : "Rates shared on enquiry"}
                </p>
                <EnquireDialog
                  defaultSubject={`Enquiry about ${l.name}`}
                  defaultDestination={l.location ?? undefined}
                  sourceUrl={`/lodges/${l.slug}`}
                  autosaveKey={`enquire:lodge:${l.slug}`}
                  context={{
                    kind: "Lodge",
                    title: `${l.name}${l.location ? `, ${l.location}` : ""}`,
                    slug: l.slug,
                    image: l.hero_image ?? undefined,
                  }}
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
                  We'll weave {l.name} into a fully bespoke itinerary shaped around your dates, party and pace.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Share */}
        <section className="border-t border-border/40 py-10">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 flex flex-wrap items-center justify-between gap-6">
            <p className="font-serif text-xl text-foreground">Loved {l.name}? Share with a fellow traveller.</p>
            <ShareButtons
              title={`${l.name}, ${l.location} — The Baobab Collective`}
              url={url}
              description={l.description?.slice(0, 140)}
              label="Share this lodge"
            />
          </div>
        </section>

        {/* Closing Enquire CTA */}
        <section className="bg-cream py-20 md:py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">Enquire</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Speak with a Journey Designer</h2>
            <p className="text-foreground/70 mb-8">
              Share a few details about your dream stay at {l.name} — we'll respond within 24 hours.
            </p>
            <EnquireDialog
              defaultSubject={`Enquiry about ${l.name}`}
              defaultDestination={l.location ?? undefined}
              sourceUrl={`/lodges/${l.slug}`}
              context={{
                kind: "Lodge",
                title: `${l.name}${l.location ? `, ${l.location}` : ""}`,
                slug: l.slug,
                image: l.hero_image ?? undefined,
              }}
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

        {others.length > 0 && (
          <section className="py-20">
            <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
              <h2 className="font-serif text-3xl text-foreground mb-10 text-center">Similar Lodges</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {others.map((o: any) => (
                  <Link key={o.slug} to="/lodges/$slug" params={{ slug: o.slug }} className="group block">
                    <div className="overflow-hidden aspect-[4/3] mb-4">
                      <img
                        src={o.hero_image}
                        alt={o.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <h3 className="font-serif text-2xl text-foreground mb-1 group-hover:text-gold transition-colors">
                      {o.name}
                    </h3>
                    <p className="text-sm text-foreground/70">{o.location}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <Lightbox
        images={gallery}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        title={`${l.name} gallery`}
      />
    </div>
  );
}
