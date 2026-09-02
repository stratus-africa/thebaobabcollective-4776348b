import { Sparkles } from "lucide-react";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";

type WhyBaobabContent = Partial<typeof PAGE_DEFAULTS.home_why_baobab>;
type FinalCtaContent = Partial<typeof PAGE_DEFAULTS.home_final_cta>;

export function WhyBaobab({
  content,
  finalCtaContent,
}: {
  content?: WhyBaobabContent | null;
  finalCtaContent?: FinalCtaContent | null;
} = {}) {
  const whyBase = { ...PAGE_DEFAULTS.home_why_baobab, ...(content ?? {}) };
  const finalCtaBase = { ...PAGE_DEFAULTS.home_final_cta, ...(finalCtaContent ?? {}) };
  const c = whyBase;
  const finalCta = finalCtaBase;

  const pillars = [
    { num: c.pillar_1_num, title: c.pillar_1_title, body: c.pillar_1_body },
    { num: c.pillar_2_num, title: c.pillar_2_title, body: c.pillar_2_body },
    { num: c.pillar_3_num, title: c.pillar_3_title, body: c.pillar_3_body },
    { num: c.pillar_4_num, title: c.pillar_4_title, body: c.pillar_4_body },
  ];

  return (
    <section aria-labelledby="why-baobab-heading" className="bg-background py-16 md:py-24">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-28 items-start">
          <div className="max-w-2xl lg:sticky lg:top-28">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> {c.eyebrow}
            </p>
            <h2
              id="why-baobab-heading"
              className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]"
            >
              {c.title}
            </h2>
            <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed">{c.body}</p>

            <div className="mt-10 pt-8 border-t border-border">
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3">{finalCta.eyebrow}</p>
              <h3 className="font-serif text-3xl sm:text-4xl text-foreground leading-[1.12]">
                {finalCta.title_line1}
                <span className="block">{finalCta.title_line2}</span>
              </h3>
              <p className="mt-4 text-foreground/75 text-base leading-relaxed max-w-xl">{finalCta.body}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
            {pillars.map((pillar) => (
              <article key={pillar.num} className="border-t border-border pt-5">
                <p className="font-serif text-3xl text-gold leading-none mb-4">{pillar.num}</p>
                <h3 className="font-serif text-2xl text-foreground leading-snug mb-3">{pillar.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
