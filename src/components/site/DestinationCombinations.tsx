import { Link } from "@tanstack/react-router";
import { ArrowRight, Plane, Clock, Sparkles, Compass } from "lucide-react";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { DESTINATION_COMBINATIONS, type DestinationCombination } from "@/lib/destinations.data";

interface DestinationCombinationsProps {
  eyebrow?: string;
  title?: string;
  body?: string;
}

export function DestinationCombinations({ eyebrow, title, body }: DestinationCombinationsProps = {}) {
  return (
    <section aria-labelledby="combinations-heading" className="bg-cream/40 py-20 md:py-28 border-t border-border/50">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5" /> {eyebrow || "Seamless Itinerary Ideas"}
            </p>
            <h2
              id="combinations-heading"
              className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]"
            >
              {title || "Create Your Perfect Combination"}
            </h2>
            <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed">
              {body ||
                "Kenya's dramatic diversity comes alive when you pair contrasting regions — savannah with sea, or northern wilderness with high-altitude forests."}
            </p>
          </div>

          <Link
            to="/private-travel"
            className="self-start md:self-end group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] font-semibold text-foreground hover:text-gold transition-colors"
          >
            <span>Design Custom Route</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Combinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {DESTINATION_COMBINATIONS.map((combo) => (
            <article
              key={combo.id}
              className="group flex flex-col bg-background rounded-2xl overflow-hidden border border-border transition-all duration-500 hover:shadow-luxury-hover hover:border-gold/50"
            >
              {/* Image Banner */}
              <div className="relative aspect-[16/9] overflow-hidden bg-forest">
                <img
                  src={combo.image}
                  alt={combo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/75 via-forest-dark/20 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold bg-background/90 backdrop-blur text-foreground px-3 py-1 rounded-full">
                    {combo.subtitle}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase font-medium bg-forest/90 text-gold px-3 py-1 rounded-full backdrop-blur border border-gold/30">
                    <Clock className="w-3 h-3 text-gold" /> {combo.days}
                  </span>
                </div>

                {/* Destination Sequence Badge */}
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-serif text-2xl sm:text-3xl text-cream font-medium">
                    {combo.destinationNames.join("  +  ")}
                  </p>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between">
                <div>
                  <p className="text-foreground/75 text-sm sm:text-base leading-relaxed mb-6">{combo.tagline}</p>

                  {/* Highlights List */}
                  <div className="space-y-2 mb-6">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 font-semibold">
                      Journey Highlights
                    </p>
                    <ul className="space-y-1.5">
                      {combo.highlights.map((h, i) => (
                        <li key={i} className="text-xs sm:text-sm text-foreground/80 flex items-start gap-2">
                          <span className="text-gold font-bold">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Transfer / Travel Style */}
                  <div className="p-3 bg-cream/70 rounded-xl border border-border/60 text-xs text-foreground/70 flex items-center gap-2 mb-6">
                    <Plane className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <span>
                      <strong>Connections:</strong> {combo.transferType}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[10px] tracking-wider uppercase text-foreground/50 font-medium">
                    Best For: {combo.bestFor}
                  </span>

                  <EnquireDialog
                    defaultSubject={`Enquiry: ${combo.title} Combination`}
                    defaultDestination={combo.destinationNames.join(" & ")}
                    sourceUrl="/destinations"
                    autosaveKey={`enquire:combo:${combo.id}`}
                    context={{
                      kind: "Journey",
                      title: combo.title,
                      dates: combo.days,
                      slug: combo.id,
                      image: combo.image,
                    }}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-forest text-cream hover:bg-gold hover:text-gold-foreground uppercase tracking-[0.22em] text-[10px] font-semibold px-5 py-2.5 transition-colors shadow-sm"
                      >
                        <span>Enquire About This Route</span>
                        <ArrowRight className="w-3 h-3" />
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
  );
}
