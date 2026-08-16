import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ShareButtons } from "@/components/site/ShareButtons";
import { CardGridSkeleton } from "@/components/site/CardSkeleton";
import { getLodges } from "@/lib/cms.functions";
import { MapPin, ArrowRight } from "lucide-react";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";

const lodgesQuery = queryOptions({
  queryKey: ["lodges"],
  queryFn: () => getLodges(),
});

export const Route = createFileRoute("/lodges/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lodgesQuery),
  head: () => ({
    meta: [
      { title: "Partner Lodges — The Baobab Collective" },
      { name: "description", content: "Hand-picked luxury safari lodges across Africa — each chosen for its setting, soul and ethics." },
      { property: "og:title", content: "Partner Lodges — The Baobab Collective" },
      { property: "og:description", content: "Hand-picked luxury safari lodges across Africa." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-center" role="alert">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center">Not found</div>,
  component: LodgesPage,
});

function LodgesPage() {
  const pageContentFn = useServerFn(getPageContent);
  const { data: pcData } = useQuery({
    queryKey: ["page-content", "lodges_index"],
    queryFn: () => pageContentFn({ data: { key: "lodges_index" } }),
    staleTime: 60_000,
  });
  const content = { ...PAGE_DEFAULTS.lodges_index, ...((pcData ?? {}) as Record<string, any>) };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        {content.show_hero !== false && (
          <section className="relative bg-forest text-forest-foreground py-24 text-center px-6 overflow-hidden">
            {content.hero_image ? (
              <>
                <img src={content.hero_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-forest/70" />
              </>
            ) : null}
            <div className="relative">
              <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4">
                {content.eyebrow || "Where you'll stay"}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl mb-5">{content.title || "Partner Lodges"}</h1>
              <p className="max-w-2xl mx-auto text-forest-foreground/80">{content.subtitle}</p>
            </div>
          </section>
        )}

        {content.show_grid !== false && (
          <section className="py-12 md:py-16">
            <div className="max-w-[1920px] mx-auto px-6 lg:px-10 space-y-8">
              <Suspense fallback={<CardGridSkeleton count={6} />}>
                <LodgesGrid />
              </Suspense>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function LodgesGrid() {
  const { data: lodges } = useSuspenseQuery(lodgesQuery);
  const { formatPrice } = useSiteSettings();

  if (!lodges.length) {
    return (
      <div className="py-20 text-center text-foreground/70">
        <p className="font-serif text-2xl mb-2">No lodges yet</p>
        <p className="text-sm">Please check back soon.</p>
      </div>
    );
  }

  return (
    <ul
      aria-label="Partner lodges"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 list-none p-0"
    >
      {lodges.map((l) => {
        const titleId = `lodge-${l.id}-title`;
        return (
          <li key={l.id}>
            <article
              aria-labelledby={titleId}
              className="group flex flex-col h-full bg-background border border-border rounded-xl overflow-hidden motion-safe:transition-all motion-safe:duration-500 motion-safe:hover:-translate-y-1 hover:shadow-2xl hover:shadow-foreground/10 hover:border-gold/40"
            >
              <Link
                to="/lodges/$slug"
                params={{ slug: l.slug }}
                aria-label={`View ${l.name}`}
                className="relative aspect-[4/3] overflow-hidden block"
              >
                <img
                  src={l.hero_image}
                  alt={`${l.name}, ${l.location ?? "lodge"}`}
                  loading="lazy"
                  className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-700 ease-out motion-safe:group-hover:scale-110"
                />
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-background/90 backdrop-blur text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 text-foreground rounded-full">
                  <MapPin className="w-3 h-3 text-gold" aria-hidden="true" /> {l.location}
                </span>
                {l.price_from_usd ? (
                  <span className="absolute top-4 right-4 bg-gold text-gold-foreground text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full font-medium">
                    From {formatPrice(l.price_from_usd)}
                  </span>
                ) : null}
              </Link>
              <div className="p-6 md:p-7 flex flex-col flex-1">
                <h2
                  id={titleId}
                  className="font-serif text-2xl md:text-3xl text-foreground mb-3 group-hover:text-gold transition-colors"
                >
                  <Link to="/lodges/$slug" params={{ slug: l.slug }}>{l.name}</Link>
                </h2>
                <p className="text-foreground/70 text-sm leading-relaxed mb-5 line-clamp-3 flex-1">
                  {l.description}
                </p>
                {l.amenities?.length ? (
                  <ul aria-label="Amenities" className="flex flex-wrap gap-1.5 mb-5">
                    {l.amenities.slice(0, 4).map((a: string) => (
                      <li
                        key={a}
                        className="text-[10px] tracking-[0.15em] uppercase border border-border/70 px-2.5 py-1 text-foreground/70 rounded-full"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="pt-4 border-t border-border/60 flex flex-wrap items-center gap-3">
                  <Link
                    to="/lodges/$slug"
                    params={{ slug: l.slug }}
                    className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-foreground hover:text-gold transition-colors"
                  >
                    View Lodge <ArrowRight aria-hidden="true" className="w-4 h-4" />
                  </Link>
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
                        className="ml-auto inline-flex items-center gap-2 bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[10px] px-4 py-2.5 rounded-full hover:bg-gold/90"
                      >
                        Enquire
                      </button>
                    }
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-border/40">
                  <ShareButtons
                    title={`${l.name} — ${l.location}`}
                    description={l.description?.slice(0, 140)}
                    label="Share lodge"
                  />
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
