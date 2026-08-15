import { Shield, Users, TreeDeciduous, HeartHandshake } from "lucide-react";

export function JourneyImpact() {
  const pillars = [
    {
      icon: Shield,
      title: "Wild Habitat & Conservation",
      subtitle: "Securing wilderness corridors",
      description:
        "Every safari directly funds conservancy lease fees, ranger patrols, and wildlife protection in critical biodiversity areas across Kenya.",
    },
    {
      icon: Users,
      title: "Community Partnerships",
      subtitle: "Equitable local benefit",
      description:
        "We prioritize locally-owned camps, indigenous guides, and community projects ensuring travel revenue stays directly in the hands of traditional custodians.",
    },
    {
      icon: TreeDeciduous,
      title: "Ethical, Low-Impact Footprint",
      subtitle: "Slow, respectful exploration",
      description:
        "Small private parties, solar-powered eco-camps, and strict non-invasive wildlife protocols ensure Africa remains wild for generations to come.",
    },
  ];

  return (
    <section aria-labelledby="impact-heading" className="bg-cream/60 py-18 md:py-24 border-t border-border/40">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
            <HeartHandshake className="w-3.5 h-3.5" /> Responsible Tourism
          </p>
          <h2 id="impact-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]">
            Your Journey's Impact
          </h2>
          <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed max-w-2xl">
            We believe travel in Kenya should give back as much as it gives. When designed with intention, a safari is one of the most powerful catalysts for conservation and community resilience on earth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-background rounded-xl p-8 border border-border transition-all duration-300 hover:shadow-luxury hover:border-gold/40 flex flex-col justify-between"
              >
                <div>
                  <div className="h-12 w-12 rounded-full bg-forest text-gold flex items-center justify-center mb-6 shadow-sm">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-terracotta font-semibold mb-1.5">
                    {pillar.subtitle}
                  </p>
                  <h3 className="font-serif text-2xl text-foreground mb-3 leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
