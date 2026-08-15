import { ArrowRight, Sparkles } from "lucide-react";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";

type HowItWorksContent = Partial<typeof PAGE_DEFAULTS.home_how_it_works>;

export function HowItWorks({ content }: { content?: HowItWorksContent | null } = {}) {
  const base = { ...PAGE_DEFAULTS.home_how_it_works, ...(content ?? {}) };
  const c = usePreviewMerge("home_how_it_works", base);

  const steps = [
    { num: c.step_1_num, title: c.step_1_title, body: c.step_1_body },
    { num: c.step_2_num, title: c.step_2_title, body: c.step_2_body },
    { num: c.step_3_num, title: c.step_3_title, body: c.step_3_body },
    { num: c.step_4_num, title: c.step_4_title, body: c.step_4_body },
  ];

  return (
    <section aria-labelledby="how-it-works-heading" className="bg-forest text-forest-foreground py-18 md:py-24">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-18">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> {c.eyebrow}
          </p>
          <h2 id="how-it-works-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]">
            {c.title}
          </h2>
          <p className="mt-4 text-forest-foreground/80 text-base sm:text-lg leading-relaxed">
            {c.body}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-14">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between bg-forest/60 border border-forest-foreground/15 rounded-xl p-7 transition-all duration-300 hover:border-gold/50 hover:bg-forest/80"
            >
              <div>
                <span className="font-serif text-4xl sm:text-5xl text-gold/80 block mb-4">
                  {step.num}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-cream mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm text-forest-foreground/80 leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <EnquireDialog
            sourceUrl="/"
            autosaveKey="enquire:how-it-works"
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
    </section>
  );
}
