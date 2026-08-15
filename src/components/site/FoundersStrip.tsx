import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Heart } from "lucide-react";
import g1 from "@/assets/gallery-1.jpg";
import g4 from "@/assets/gallery-4.jpg";

export function FoundersStrip() {
  const founders = [
    {
      name: "Michael D'Souza",
      role: "Co-Founder & Expedition Lead",
      image: g1,
      quote:
        "Kenya has been home for most of my life. I created Baobab to share the wild, intimate places and the people I know and respect most.",
      tag: "Lifelong Kenya Resident",
    },
    {
      name: "Samra D'Souza",
      role: "Co-Founder & Experience Curator",
      image: g4,
      quote:
        "We believe luxury is not about excess, but about intimacy, soul, and time well-spent in places that truly leave a lasting mark.",
      tag: "Journey Architect",
    },
  ];

  return (
    <section aria-labelledby="founders-heading" className="bg-cream py-18 md:py-24 border-y border-border/40">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-center">
          {/* Left Column — Narrative */}
          <div className="space-y-6">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Direct Personal Connection
            </p>
            <h2 id="founders-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]">
              Meet Your Journey Designers
            </h2>
            <p className="text-foreground/80 text-base sm:text-lg leading-relaxed">
              When you plan with The Baobab Collective, you do not speak to a call center or browse a mass catalog. You design your safari directly with people who have lived the land, walked every camp, and built decades of trusted relationships in Kenya.
            </p>
            <div className="pt-2">
              <Link
                to="/about"
                className="group inline-flex items-center gap-3 rounded-full bg-forest text-forest-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-4 hover:bg-forest/90 transition-colors shadow-md"
              >
                <span>Meet the Collective</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Column — Founder Cards */}
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            {founders.map((founder, idx) => (
              <div
                key={idx}
                className="group flex flex-col bg-background rounded-xl overflow-hidden border border-border transition-all duration-500 hover:shadow-luxury-hover hover:border-gold/40"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-cream">
                    <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-gold block mb-1">
                      {founder.tag}
                    </span>
                    <h3 className="font-serif text-2xl text-cream leading-tight">
                      {founder.name}
                    </h3>
                    <p className="text-xs text-cream/75 mt-0.5">
                      {founder.role}
                    </p>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <p className="font-serif italic text-foreground/80 text-sm md:text-base leading-relaxed">
                    "{founder.quote}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
