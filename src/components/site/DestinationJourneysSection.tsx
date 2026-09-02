import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Calendar, Compass } from "lucide-react";
import type { AdventuresSignature } from "@/lib/adventures.functions";

interface DestinationJourneysSectionProps {
  adventures: AdventuresSignature[];
  eyebrow?: string;
  title?: string;
  body?: string;
}

export function DestinationJourneysSection({ adventures, eyebrow, title, body }: DestinationJourneysSectionProps) {
  if (!adventures || adventures.length === 0) return null;

  return (
    <section
      aria-labelledby="journeys-section-heading"
      className="bg-background py-20 md:py-28 border-t border-border/50"
    >
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5" /> {eyebrow || "Curated Safari Itineraries"}
            </p>
            <h2
              id="journeys-section-heading"
              className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]"
            >
              {title || "Journeys Through These Places"}
            </h2>
            <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed">
              {body ||
                "Our adventures bring together the destinations, experiences and moments that make Kenya unforgettable."}
            </p>
          </div>

          <Link
            to="/adventures"
            className="self-start md:self-end group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] font-semibold text-foreground hover:text-gold transition-colors"
          >
            <span>Explore All Adventures</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Adventures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {adventures.slice(0, 3).map((adv) => (
            <article
              key={adv.slug}
              className="group flex flex-col bg-cream/40 rounded-2xl overflow-hidden border border-border transition-all duration-500 hover:shadow-luxury-hover hover:border-gold/50"
            >
              <Link
                to="/adventures/$slug"
                params={{ slug: adv.slug }}
                className="relative aspect-[16/10] overflow-hidden block bg-forest"
              >
                <img
                  src={adv.image}
                  alt={adv.imageAlt || adv.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/65 via-transparent to-transparent opacity-75 group-hover:opacity-85 transition-opacity" />

                {adv.region && (
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold bg-background/90 backdrop-blur text-foreground px-3 py-1 rounded-full">
                    <MapPin className="w-3 h-3 text-gold" /> {adv.region}
                  </span>
                )}

                {adv.nights && (
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-medium bg-forest/90 text-cream px-3 py-1 rounded-full backdrop-blur">
                    <Calendar className="w-3 h-3 text-gold" /> {adv.nights}
                  </span>
                )}
              </Link>

              <div className="p-6 sm:p-7 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/60 mb-2">
                  {adv.terrain && <span>{adv.terrain}</span>}
                  {adv.terrain && adv.difficulty && <span>•</span>}
                  {adv.difficulty && <span className="text-terracotta">{adv.difficulty}</span>}
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl text-foreground mb-3 leading-tight group-hover:text-gold transition-colors">
                  <Link to="/adventures/$slug" params={{ slug: adv.slug }}>
                    {adv.name}
                  </Link>
                </h3>

                <p className="text-foreground/75 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">{adv.description}</p>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <Link
                    to="/adventures/$slug"
                    params={{ slug: adv.slug }}
                    className="inline-flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase font-semibold text-gold group-hover:text-terracotta transition-colors"
                  >
                    View Adventure{" "}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
