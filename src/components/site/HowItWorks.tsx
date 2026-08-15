import { ArrowRight, Sparkles } from "lucide-react";
import { EnquireDialog } from "@/components/site/EnquireDialog";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Tell Us What You're Dreaming Of",
      body: "A quick conversation about your dates, travelling party, travel style, and the sights and wildlife you long to see.",
    },
    {
      num: "02",
      title: "We Design Your Journey",
      body: "We create a thoughtful, completely personalised itinerary based on our firsthand knowledge and local relationships.",
    },
    {
      num: "03",
      title: "Refine The Details",
      body: "Together, we talk through camps, pacing, private guides, unique encounters, and make adjustments until it feels perfect.",
    },
    {
      num: "04",
      title: "Experience Kenya",
      body: "From the moment you step off the plane in Nairobi, our on-ground team takes care of every single detail.",
    },
  ];

  return (
    <section aria-labelledby="how-it-works-heading" className="bg-forest text-forest-foreground py-18 md:py-24">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-18">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Seamless Planning
          </p>
          <h2 id="how-it-works-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]">
            Your Journey Starts Here
          </h2>
          <p className="mt-4 text-forest-foreground/80 text-base sm:text-lg leading-relaxed">
            Planning a private safari with The Baobab Collective is calm, collaborative, and entirely stress-free.
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
                <span>Start Planning My Journey</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            }
          />
        </div>
      </div>
    </section>
  );
}
