import { Compass, ShieldCheck, HeartHandshake, Headphones } from "lucide-react";

export function TrustStrip() {
  const items = [
    {
      icon: Compass,
      title: "Kenya Specialists",
      subtitle: "Born from a deep, lifelong connection",
    },
    {
      icon: HeartHandshake,
      title: "Tailor-Made Journeys",
      subtitle: "Designed around you — no catalog packages",
    },
    {
      icon: ShieldCheck,
      title: "Personally Curated",
      subtitle: "Every camp, lodge & guide walked & vetted",
    },
    {
      icon: Headphones,
      title: "24/7 On-Ground Support",
      subtitle: "Seamless care from landing to departure",
    },
  ];

  return (
    <section aria-label="Trust and expertise" className="bg-cream/70 border-y border-foreground/10 py-6 md:py-8">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start sm:items-center gap-3.5 sm:gap-4 group transition-transform duration-300 hover:translate-y-[-2px]"
              >
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-forest/8 text-forest grid place-items-center shrink-0 border border-forest/10 group-hover:bg-forest group-hover:text-forest-foreground transition-colors duration-300">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gold group-hover:text-gold transition-colors" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg text-foreground font-medium leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-foreground/65 leading-normal mt-0.5">
                    {item.subtitle}
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
