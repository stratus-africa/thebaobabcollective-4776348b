import lodge from "@/assets/lodge-tent.jpg";
import elephant from "@/assets/elephant.jpg";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";
import { RichText } from "@/components/site/RichText";

type AboutContent = Partial<typeof PAGE_DEFAULTS.about>;

export function About({ content }: { content?: AboutContent | null } = {}) {
  const base = { ...PAGE_DEFAULTS.about, ...(content ?? {}) };
  const c = usePreviewMerge("about", base);
  const leftSrc = c.image_left_url || lodge;
  const rightSrc = c.image_right_url || elephant;
  const pillars = [
    {
      label: "Authentic",
      title: "Kenya isn't somewhere we simply sell. It's home.",
      body: "Journeys shaped by familiarity, feeling and lived connection rather than a catalogue.",
    },
    {
      label: "Personal",
      title: "Every journey is designed around you, not a template.",
      body: "Your pace, your people, your curiosity — refined into something quietly exceptional.",
    },
    {
      label: "Exceptional",
      title: "The right relationships create experiences you won't find in a brochure.",
      body: "Local knowledge, trusted guides and carefully chosen places make the difference.",
    },
  ];

  return (
    <section className="bg-cream py-14 md:py-20 lg:py-24">
      <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 grid md:grid-cols-2 gap-10 lg:gap-16 xl:gap-20 items-center">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/70 mb-4">{c.eyebrow}</p>
          <div className="w-12 h-px bg-gold mb-6" />
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] text-foreground mb-6">
            {c.title_line1}
            <br />
            {c.title_line2}
            <br />
            {c.title_line3}
          </h2>
          <RichText
            html={c.body}
            className="max-w-2xl lg:max-w-3xl text-foreground/75 text-base md:text-lg leading-relaxed space-y-4"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          <div className="overflow-hidden shadow-sm">
            <img
              src={leftSrc}
              alt="Luxury safari lodge tent at sunset"
              loading="lazy"
              className="w-full h-[380px] md:h-[440px] lg:h-[500px] object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="overflow-hidden shadow-sm mt-12 lg:mt-16">
            <img
              src={rightSrc}
              alt="African elephant in savannah"
              loading="lazy"
              className="w-full h-[380px] md:h-[440px] lg:h-[500px] object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-14 max-w-[1920px] px-6 sm:px-8 lg:px-12 xl:px-16 md:mt-20">
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.label}
              className="group bg-forest p-7 text-cream transition-all duration-500 hover:shadow-lg md:p-8 lg:p-10"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{pillar.label}</p>
                <span className="font-serif text-2xl text-cream/25">0{index + 1}</span>
              </div>
              <h3 className="mb-4 font-serif text-2xl lg:text-3xl leading-tight text-cream">{pillar.title}</h3>
              <RichText html={pillar.body} className="text-sm lg:text-base text-cream/70 leading-relaxed" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
