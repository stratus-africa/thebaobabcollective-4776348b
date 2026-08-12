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
    <section className="bg-cream py-14 md:py-20">
      <div className="max-w-[1920px] mx-auto px-5 lg:px-10 grid md:grid-cols-2 gap-9 lg:gap-14 items-center">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/70 mb-4">{c.eyebrow}</p>
          <div className="w-12 h-px bg-gold mb-6" />
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.02] text-foreground mb-6">
            {c.title_line1}
            <br />
            {c.title_line2}
            <br />
            {c.title_line3}
          </h2>
          <RichText html={c.body} className="max-w-xl text-foreground/75" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="overflow-hidden">
            <img
              src={leftSrc}
              alt="Luxury safari lodge tent at sunset"
              loading="lazy"
              className="w-full h-[360px] md:h-[400px] object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="overflow-hidden mt-12">
            <img
              src={rightSrc}
              alt="African elephant in savannah"
              loading="lazy"
              className="w-full h-[360px] md:h-[400px] object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1500px] px-5 lg:px-10 md:mt-16">
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.label}
              className="group bg-forest p-6 text-cream transition-colors duration-500 md:p-7"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{pillar.label}</p>
                <span className="font-serif text-2xl text-cream/25">0{index + 1}</span>
              </div>
              <h3 className="mb-4 font-serif text-3xl leading-tight text-cream">{pillar.title}</h3>
              <RichText html={pillar.body} className="text-sm text-cream/70" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
