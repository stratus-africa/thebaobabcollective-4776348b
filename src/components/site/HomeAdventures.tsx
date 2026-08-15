import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Calendar, Compass, Sparkles } from "lucide-react";
import { getAdventuresPage, type AdventuresSignature } from "@/lib/adventures.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";

type Content = Partial<typeof PAGE_DEFAULTS.home_adventures>;

export function HomeAdventures({ content }: { content?: Content | null } = {}) {
  const base = { ...PAGE_DEFAULTS.home_adventures, ...(content ?? {}) };
  const c = usePreviewMerge("home_adventures", base);

  const fetchAdventures = useServerFn(getAdventuresPage);
  const { data: page } = useQuery({
    queryKey: ["adventures-page"],
    queryFn: () => fetchAdventures(),
    staleTime: 60_000,
  });

  const adventures = page?.signatures ?? [];

  return (
    <section
      aria-labelledby="signature-adventures-heading"
      className="bg-cream/40 py-18 md:py-24 border-t border-border/40"
    >
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3">
              {c.eyebrow || "Signature Adventures"}
            </p>
            <h2
              id="signature-adventures-heading"
              className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]"
            >
              {c.title || "Find Your Adventure"}
            </h2>
            <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed">
              {c.body || "Journeys designed around the places, experiences and moments that make Kenya unforgettable."}
            </p>
          </div>
          <Link
            to="/adventures"
            className="self-start md:self-end group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] font-semibold text-foreground hover:text-gold transition-colors"
          >
            <span>{c.cta_label || "Explore All Journeys"}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {adventures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {adventures.map((adv: AdventuresSignature) => (
              <article
                key={adv.slug}
                className="group flex flex-col bg-background rounded-xl overflow-hidden border border-border transition-all duration-500 hover:shadow-luxury-hover hover:border-gold/40"
              >
                <Link
                  to="/adventures/$slug"
                  params={{ slug: adv.slug }}
                  className="relative aspect-[16/10] overflow-hidden block"
                >
                  <img
                    src={adv.image}
                    alt={adv.imageAlt || adv.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {adv.region && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-medium bg-background/90 backdrop-blur text-foreground px-3 py-1 rounded-full">
                        <MapPin className="w-3 h-3 text-gold" /> {adv.region}
                      </span>
                    )}
                  </div>

                  {adv.nights && (
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-medium bg-forest/90 text-cream px-3 py-1 rounded-full backdrop-blur">
                      <Calendar className="w-3 h-3 text-gold" /> {adv.nights}
                    </span>
                  )}
                </Link>

                <div className="p-6 sm:p-7 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-foreground/60 mb-2">
                    {adv.terrain && <span>{adv.terrain}</span>}
                    {adv.terrain && adv.difficulty && <span>•</span>}
                    {adv.difficulty && <span className="text-terracotta">{adv.difficulty}</span>}
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl text-foreground mb-3 leading-tight group-hover:text-gold transition-colors">
                    <Link to="/adventures/$slug" params={{ slug: adv.slug }}>
                      {adv.name}
                    </Link>
                  </h3>

                  <p className="text-foreground/70 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                    {adv.description}
                  </p>

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                    <Link
                      to="/adventures/$slug"
                      params={{ slug: adv.slug }}
                      className="inline-flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase font-semibold text-gold group-hover:text-terracotta transition-colors"
                    >
                      Explore Journey{" "}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background rounded-xl border border-border">
            <Compass className="w-8 h-8 text-gold mx-auto mb-3" />
            <p className="font-serif text-2xl text-foreground">Signature journeys are being curated.</p>
            <p className="text-sm text-foreground/60 mt-1">Please explore our private travel designer services.</p>
          </div>
        )}
      </div>
    </section>
  );
}
