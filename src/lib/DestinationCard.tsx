import { Link } from "@tanstack/react-router";
import { MapPin, Calendar, ArrowRight, Sparkles } from "lucide-react";
import type { DestinationMetadata } from "@/lib/destinations.data";

interface DestinationCardProps {
  destination: DestinationMetadata;
  variant?: "standard" | "feature" | "compact";
  className?: string;
}

export function DestinationCard({ destination: d, variant = "standard", className = "" }: DestinationCardProps) {
  const isFeature = variant === "feature";

  return (
    <article
      className={`group relative flex flex-col bg-background rounded-2xl overflow-hidden border border-border/80 transition-all duration-500 hover:shadow-luxury-hover hover:border-gold/50 focus-within:ring-2 focus-within:ring-gold ${className}`}
    >
      {/* ── Image Container ── */}
      <Link
        to="/destinations/$slug"
        params={{ slug: d.slug }}
        className={`relative block overflow-hidden ${isFeature ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[4/3]"} bg-cream/30 focus:outline-none`}
        aria-label={`Explore ${d.name}, ${d.region}`}
      >
        <img
          src={d.fallbackImage}
          alt={`${d.name} — ${d.region}, ${d.country}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-75 group-hover:opacity-85 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase font-semibold bg-background/90 backdrop-blur-md text-foreground px-3 py-1 rounded-full shadow-sm">
            <MapPin className="w-3 h-3 text-gold" /> {d.region}
          </span>

          {d.featured && (
            <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase font-semibold bg-forest/90 backdrop-blur-md text-gold px-2.5 py-1 rounded-full border border-gold/30 shadow-sm">
              <Sparkles className="w-2.5 h-2.5" /> Iconic
            </span>
          )}
        </div>

        {/* Bottom Season Overlay Badge */}
        {d.bestSeason && (
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase font-medium bg-forest/90 text-cream px-3 py-1 rounded-full backdrop-blur-md border border-forest-foreground/10 shadow-sm">
              <Calendar className="w-3 h-3 text-gold" /> Best: {d.bestSeason}
            </span>
          </div>
        )}
      </Link>

      {/* ── Content Details ── */}
      <div className="p-6 sm:p-7 flex flex-col flex-1">
        {/* Title */}
        <h3 className={`font-serif ${isFeature ? "text-2xl sm:text-3xl lg:text-4xl" : "text-2xl sm:text-3xl"} text-foreground mb-2.5 leading-tight group-hover:text-gold transition-colors`}>
          <Link to="/destinations/$slug" params={{ slug: d.slug }}>
            {d.name}
          </Link>
        </h3>

        {/* Short Editorial Description (1-2 sentences) */}
        <p className="text-foreground/75 text-sm sm:text-[14.5px] leading-relaxed mb-5 flex-1 line-clamp-3">
          {d.shortDescription}
        </p>

        {/* "Best For" Tag Pills */}
        {d.bestFor && d.bestFor.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6" aria-label={`Best for categories in ${d.name}`}>
            {d.bestFor.slice(0, isFeature ? 4 : 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] tracking-[0.16em] uppercase font-medium bg-cream/70 text-foreground/80 border border-border px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {d.bestFor.length > (isFeature ? 4 : 3) && (
              <span className="text-[10px] tracking-wider text-foreground/50 self-center px-1">
                +{d.bestFor.length - (isFeature ? 4 : 3)}
              </span>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <Link
            to="/destinations/$slug"
            params={{ slug: d.slug }}
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase font-semibold text-gold group-hover:text-terracotta transition-colors"
          >
            <span>Explore Destination</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <span className="text-[11px] font-mono text-foreground/40 uppercase tracking-widest">
            {d.country}
          </span>
        </div>
      </div>
    </article>
  );
}
