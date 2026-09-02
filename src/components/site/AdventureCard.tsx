import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Calendar, Compass, Sparkles } from "lucide-react";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import type { AdventuresSignature } from "@/lib/adventures.functions";

export const DIFFICULTY_HUMAN_MAP: Record<string, { label: string; tone: string; description: string }> = {
  Easy: {
    label: "RELAXED",
    // Savannah green — calm, accessible
    tone: "text-savannah bg-savannah/10 border-savannah/25",
    description: "Mostly game drives and easy experiences.",
  },
  Moderate: {
    label: "BALANCED",
    // Muted gold — premium mid-tier
    tone: "text-gold bg-gold/10 border-gold/30",
    description: "A mix of game drives, walking and activities.",
  },
  Active: {
    label: "ACTIVE",
    // Terracotta — earthy energy
    tone: "text-terracotta bg-terracotta/10 border-terracotta/20",
    description: "Walking, hiking and more physically demanding experiences.",
  },
  Challenging: {
    label: "CHALLENGING",
    // Forest — deep, serious intensity
    tone: "text-forest bg-forest/[0.08] border-forest/20",
    description: "Multi-day trekking, rugged wilderness & active exploration.",
  },
};

export function getHumanDifficulty(difficulty: string) {
  return (
    DIFFICULTY_HUMAN_MAP[difficulty] ?? {
      label: (difficulty || "BALANCED").toUpperCase(),
      tone: "text-gold bg-gold/10 border-gold/20",
      description: "A balanced safari adventure.",
    }
  );
}

interface AdventureCardProps {
  adventure: AdventuresSignature;
  className?: string;
  featured?: boolean;
}

export function AdventureCard({ adventure, className = "", featured = false }: AdventureCardProps) {
  const diffMeta = getHumanDifficulty(adventure.difficulty);
  const displayDestinations =
    adventure.destinations && adventure.destinations.length > 0 ? adventure.destinations.join(" · ") : adventure.region;

  const displayDescription =
    adventure.shortDescription || adventure.description || "A thoughtfully curated Kenya journey.";

  return (
    <article
      className={`group relative flex flex-col bg-background border border-border/70 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-gold/40 ${className}`}
    >
      {/* Media Header */}
      <div className="relative aspect-[16/10] overflow-hidden bg-cream">
        <img
          src={adventure.image}
          alt={`${adventure.name} — ${adventure.region}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/65 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-[0.2em] font-medium uppercase bg-background/90 text-foreground backdrop-blur border border-border/50 shadow-sm">
            <MapPin className="w-3 h-3 text-gold" />
            {adventure.region}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] tracking-[0.2em] font-semibold uppercase border backdrop-blur shadow-sm ${diffMeta.tone}`}
          >
            <Sparkles className="w-2.5 h-2.5" />
            {diffMeta.label}
          </span>
        </div>

        {/* Bottom Nights Badge */}
        {adventure.nights && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-serif text-cream bg-black/50 backdrop-blur border border-white/20">
              <Calendar className="w-3.5 h-3.5 text-gold" />
              {adventure.nights}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
        <div>
          {/* Destinations Line */}
          {displayDestinations && (
            <p className="text-[11px] tracking-[0.25em] uppercase text-gold font-medium mb-2.5 line-clamp-1">
              {displayDestinations}
            </p>
          )}

          {/* Adventure Title */}
          <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-3 leading-snug group-hover:text-gold transition-colors">
            <Link to="/adventures/$slug" params={{ slug: adventure.slug }}>
              {adventure.name}
            </Link>
          </h3>

          {/* Emotional Short Description */}
          <p className="text-foreground/75 text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
            {displayDescription}
          </p>

          {/* Experience Tags */}
          {((adventure.experienceTypes && adventure.experienceTypes.length > 0) ||
            (adventure.travelStyles && adventure.travelStyles.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {[...(adventure.experienceTypes || []), ...(adventure.travelStyles || [])].slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-block text-[10px] tracking-[0.15em] uppercase text-foreground/70 bg-cream border border-border/60 px-2.5 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="pt-5 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/adventures/$slug"
            params={{ slug: adventure.slug }}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground group-hover:text-gold transition-colors"
          >
            <span>Explore Adventure</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold transition-transform group-hover:translate-x-1" />
          </Link>

          <EnquireDialog
            defaultSubject={adventure.name}
            defaultDestination={adventure.region || adventure.name}
            sourceUrl={`/adventures/${adventure.slug}`}
            trigger={
              <button
                type="button"
                className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] text-foreground/60 hover:text-gold transition-colors underline underline-offset-4"
              >
                Plan Journey
              </button>
            }
          />
        </div>
      </div>
    </article>
  );
}
