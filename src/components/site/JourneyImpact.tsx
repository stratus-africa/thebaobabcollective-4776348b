import { Shield, Users, TreeDeciduous, HeartHandshake } from "lucide-react";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";
import { useReveal, useRevealChildren } from "@/hooks/useReveal";

type ImpactContent = Partial<typeof PAGE_DEFAULTS.home_impact>;

const PILLAR_ICONS = [Shield, Users, TreeDeciduous];

export function JourneyImpact({ content }: { content?: ImpactContent | null } = {}) {
  const base = { ...PAGE_DEFAULTS.home_impact, ...(content ?? {}) };
  const c = usePreviewMerge("home_impact", base);

  const pillars = [
    { icon: PILLAR_ICONS[0], title: c.pillar_1_title, subtitle: c.pillar_1_subtitle, description: c.pillar_1_body },
    { icon: PILLAR_ICONS[1], title: c.pillar_2_title, subtitle: c.pillar_2_subtitle, description: c.pillar_2_body },
    { icon: PILLAR_ICONS[2], title: c.pillar_3_title, subtitle: c.pillar_3_subtitle, description: c.pillar_3_body },
  ];

  const headingRef = useReveal<HTMLDivElement>();
  const pillarsRef = useRevealChildren<HTMLDivElement>();

  return (
    <section aria-labelledby="impact-heading" className="bg-cream/60 py-16 md:py-24 border-t border-border/40">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div ref={headingRef} className="reveal max-w-3xl mb-12 md:mb-16">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
            <HeartHandshake className="w-3.5 h-3.5" /> {c.eyebrow}
          </p>
          <h2
            id="impact-heading"
            className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]"
          >
            {c.title}
          </h2>
          <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed max-w-2xl">{c.body}</p>
        </div>

        <div ref={pillarsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className={`reveal reveal-delay-${idx + 1} bg-background rounded-xl p-8 border border-border transition-all duration-300 hover:shadow-luxury hover:border-gold/40 flex flex-col justify-between`}
              >
                <div>
                  <div className="h-12 w-12 rounded-full bg-forest text-gold flex items-center justify-center mb-6 shadow-sm">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-terracotta font-semibold mb-1.5">
                    {pillar.subtitle}
                  </p>
                  <h3 className="font-serif text-2xl text-foreground mb-3 leading-snug">{pillar.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
