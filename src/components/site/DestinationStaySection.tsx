import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface DestinationStaySectionProps {
  lodges: any[];
  eyebrow?: string;
  title?: string;
  body?: string;
}

export function DestinationStaySection({ lodges, eyebrow, title, body }: DestinationStaySectionProps) {
  const { formatPrice } = useSiteSettings();
  if (!lodges || lodges.length === 0) return null;

  return (
    <section aria-labelledby="stay-heading" className="bg-forest text-forest-foreground py-20 md:py-28">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> {eyebrow || "Hand-Picked Accommodations"}
            </p>
            <h2 id="stay-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]">
              {title || "Where You'll Stay"}
            </h2>
            <p className="mt-4 text-forest-foreground/80 text-base sm:text-lg leading-relaxed">
              {body ||
                "We choose camps and lodges for their setting, character and the experiences they make possible."}
            </p>
          </div>

          <Link
            to="/lodges"
            className="self-start md:self-end group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] font-semibold text-cream hover:text-gold transition-colors"
          >
            <span>View All Lodges</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Lodges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lodges.slice(0, 3).map((lodge) => (
            <article
              key={lodge.id}
              className="group flex flex-col bg-background text-foreground rounded-2xl overflow-hidden border border-border/20 transition-all duration-500 hover:shadow-2xl hover:border-gold/50"
            >
              <Link
                to="/lodges/$slug"
                params={{ slug: lodge.slug }}
                className="relative aspect-[16/10] overflow-hidden block"
              >
                <img
                  src={lodge.hero_image}
                  alt={`${lodge.name}, ${lodge.location}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/65 via-transparent to-transparent opacity-60" />

                {lodge.location && (
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-medium bg-background/90 backdrop-blur text-foreground px-3 py-1 rounded-full">
                    <MapPin className="w-3 h-3 text-gold" /> {lodge.location}
                  </span>
                )}

                {lodge.price_from_usd ? (
                  <span className="absolute bottom-4 right-4 text-[10px] tracking-[0.2em] uppercase font-semibold bg-forest/90 text-gold px-3 py-1 rounded-full backdrop-blur border border-gold/30">
                    From {formatPrice(lodge.price_from_usd)} / night
                  </span>
                ) : null}
              </Link>

              <div className="p-6 sm:p-7 flex flex-col flex-1">
                <h3 className="font-serif text-2xl text-foreground mb-2.5 group-hover:text-gold transition-colors leading-snug">
                  <Link to="/lodges/$slug" params={{ slug: lodge.slug }}>
                    {lodge.name}
                  </Link>
                </h3>

                <p className="text-foreground/75 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                  {lodge.description}
                </p>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <Link
                    to="/lodges/$slug"
                    params={{ slug: lodge.slug }}
                    className="inline-flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase font-semibold text-forest hover:text-gold transition-colors"
                  >
                    Discover Lodge{" "}
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
