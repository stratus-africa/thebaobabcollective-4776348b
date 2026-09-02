import { ArrowRight } from "lucide-react";
import ctaImg from "@/assets/elephant.jpg";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";

type FinalCtaContent = Partial<typeof PAGE_DEFAULTS.home_final_cta>;

export function FinalCta({ content }: { content?: FinalCtaContent | null } = {}) {
  const base = { ...PAGE_DEFAULTS.home_final_cta, ...(content ?? {}) };
  const c = usePreviewMerge("home_final_cta", base);

  return (
    <section aria-labelledby="final-cta-heading" className="relative overflow-hidden">
      <div className="relative min-h-[420px] sm:min-h-[480px] flex items-center">
        <img
          src={ctaImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/80 to-forest/60"
          aria-hidden="true"
        />

        <div className="relative max-w-[1920px] mx-auto w-full px-5 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-4">{c.eyebrow}</p>
            <h2
              id="final-cta-heading"
              className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
            >
              <span className="block">{c.title_line1}</span>
              <span className="block text-gold">{c.title_line2}</span>
            </h2>
            <p className="mt-5 text-cream/90 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">{c.body}</p>
            <div className="mt-8 flex justify-center">
              <EnquireDialog
                sourceUrl="/"
                autosaveKey="enquire:home-final-cta"
                trigger={
                  <button
                    type="button"
                    className="group inline-flex items-center gap-3 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-gold/90 transition-colors shadow-lg"
                  >
                    <span>{c.cta_label}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
