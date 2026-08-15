import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Sparkles, Check } from "lucide-react";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { BEST_FOR_CATEGORIES } from "@/lib/destinations.data";
import journalLodgeImg from "@/assets/journal-lodge.jpg";

export function DestinationMatcherSection() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Wildlife", "Romance"]);

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  return (
    <section aria-labelledby="matcher-heading" className="bg-cream py-20 md:py-28 relative overflow-hidden border-t border-border/50">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="bg-background rounded-3xl border border-border overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
          {/* Left Matcher Column */}
          <div className="lg:col-span-7 p-8 sm:p-12 md:p-16 flex flex-col justify-between">
            <div>
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" /> Tailor-Made Recommendation
              </p>
              <h2 id="matcher-heading" className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.12] mb-4">
                Where should Kenya take you?
              </h2>
              <p className="text-foreground/75 text-base sm:text-lg leading-relaxed mb-8">
                Tell us what you're looking for and our journey designers will hand-pick the exact lodges, conservancies, and coastlines tailored to your vision.
              </p>

              {/* Multi-Select Badges */}
              <div className="space-y-3 mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">
                  Select your travel priorities:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {BEST_FOR_CATEGORIES.map((cat) => {
                    const isSelected = selectedInterests.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleInterest(cat.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                          isSelected
                            ? "bg-forest text-cream ring-2 ring-forest ring-offset-2 ring-offset-background shadow-xs"
                            : "bg-cream text-foreground/75 hover:border-gold hover:text-gold border border-border"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-gold" />}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center gap-4">
              <EnquireDialog
                defaultSubject={`Custom Journey Recommendation (${selectedInterests.join(", ")})`}
                defaultDestination="Kenya (Tailor-Made)"
                sourceUrl="/destinations"
                autosaveKey="enquire:matcher"
                context={{
                  kind: "Destination",
                  title: "Custom Kenya Journey",
                  dates: selectedInterests.join(", "),
                  slug: "matcher",
                  image: journalLodgeImg,
                }}
                trigger={
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-4 hover:bg-gold/90 transition-colors shadow-sm"
                  >
                    <span>Find My Destination</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              />

              <Link
                to="/private-travel"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-cream text-foreground border border-border uppercase tracking-[0.2em] text-[11px] font-semibold px-6 py-4 hover:border-gold hover:text-gold transition-colors text-center"
              >
                <span>Private Travel Designer</span>
              </Link>
            </div>
          </div>

          {/* Right Editorial Image Panel */}
          <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full bg-forest">
            <img
              src={journalLodgeImg}
              alt="Bespoke luxury safari camp verandah at dawn in Kenya"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="absolute bottom-8 left-8 right-8 text-cream">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold mb-2">
                Personalized Curation
              </p>
              <p className="font-serif text-2xl text-cream leading-snug">
                "No two travellers are the same. We take the time to know you before sketching a single day."
              </p>
              <p className="text-xs text-cream/70 mt-2 font-mono">
                — The Baobab Collective Founders
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
