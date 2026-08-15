import { Award } from "lucide-react";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";

type WhyBaobabContent = Partial<typeof PAGE_DEFAULTS.home_why_baobab>;

export function WhyBaobab({ content }: { content?: WhyBaobabContent | null } = {}) {
  const base = { ...PAGE_DEFAULTS.home_why_baobab, ...(content ?? {}) };
  const c = usePreviewMerge("home_why_baobab", base);

  const pillars = [
    { num: c.pillar_1_num, title: c.pillar_1_title, body: c.pillar_1_body },
    { num: c.pillar_2_num, title: c.pillar_2_title, body: c.pillar_2_body },
    { num: c.pillar_3_num, title: c.pillar_3_title, body: c.pillar_3_body },
    { num: c.pillar_4_num, title: c.pillar_4_title, body: c.pillar_4_body },
  ];

  return (
    <section aria-labelledby="why-baobab-heading" className="bg-background py-18 md:py-24 border-t border-border/40">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
            <Award className="w-3.5 h-3.5" /> {c.eyebrow}
          </p>
          <h2 id="why-baobab-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]">
            {c.title}
          </h2>
          <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed max-w-2xl">
            {c.body}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between border-t-2 border-gold/50 pt-6 transition-all duration-300 hover:border-gold"
            >
              <div>
                <span className="font-serif text-4xl sm:text-5xl text-gold/70 block mb-4">
                  {pillar.num}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-foreground mb-3 leading-snug">
                  {pillar.title}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {pillar.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
