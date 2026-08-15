import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import elephantImg from "@/assets/elephant.jpg";
import lodgeTentImg from "@/assets/lodge-tent.jpg";
import g1Img from "@/assets/gallery-1.jpg";
import g2Img from "@/assets/gallery-2.jpg";
import g3Img from "@/assets/gallery-3.jpg";
import g4Img from "@/assets/gallery-4.jpg";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";

type FindJourneyContent = Partial<typeof PAGE_DEFAULTS.home_find_journey>;

export type JourneyTypeCard = {
  title: string;
  tagline: string;
  description: string;
  fallbackImage: string;
  imageKey: keyof typeof PAGE_DEFAULTS.home_find_journey;
  to: string;
  badge?: string;
};

const JOURNEY_STYLES: JourneyTypeCard[] = [
  {
    title: "Safari & Wildlife",
    tagline: "Wild Heart",
    description: "Experience Kenya's iconic wilderness — from the Mara plains to the red elephants of Tsavo.",
    fallbackImage: elephantImg,
    imageKey: "card_1_image",
    to: "/adventures",
    badge: "Signature",
  },
  {
    title: "The Great Migration",
    tagline: "Nature's Wonder",
    description: "Witness millions of wildebeest and zebra braving river crossings in an epic natural spectacle.",
    fallbackImage: g3Img,
    imageKey: "card_2_image",
    to: "/adventures",
    badge: "Seasonal",
  },
  {
    title: "Honeymoon & Romance",
    tagline: "Private Sanctuary",
    description: "Intimate star-bed sleep-outs, private bush dinners and secluded luxury camps under African skies.",
    fallbackImage: lodgeTentImg,
    imageKey: "card_3_image",
    to: "/private-travel",
    badge: "Bespoke",
  },
  {
    title: "Family Adventure",
    tagline: "All Generations",
    description: "A safari thoughtfully paced for curious travellers of all ages, with dedicated family guides.",
    fallbackImage: g1Img,
    imageKey: "card_4_image",
    to: "/adventures",
  },
  {
    title: "Beach & Safari",
    tagline: "Savannah to Sea",
    description: "Seamlessly combine exhilarating game drives with the turquoise waters of the Swahili Coast.",
    fallbackImage: g2Img,
    imageKey: "card_5_image",
    to: "/destinations",
  },
  {
    title: "Culture & Connection",
    tagline: "People & Stories",
    description: "Meet the people and communities that make Kenya extraordinary — guided by local elders.",
    fallbackImage: g4Img,
    imageKey: "card_6_image",
    to: "/about",
  },
];

export function FindYourJourney({ content }: { content?: FindJourneyContent | null } = {}) {
  const c = { ...PAGE_DEFAULTS.home_find_journey, ...(content ?? {}) } as Record<string, any>;

  return (
    <section aria-labelledby="find-journey-heading" className="bg-background py-16 md:py-24">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> {c.eyebrow}
          </p>
          <h2
            id="find-journey-heading"
            className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]"
          >
            {c.title}
          </h2>
          <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed max-w-2xl">{c.body}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {JOURNEY_STYLES.map((style, idx) => {
            // Use CMS image if uploaded, otherwise fall back to bundled asset
            const imageSrc = (c[style.imageKey] as string) || style.fallbackImage;

            return (
              <Link
                key={idx}
                to={style.to as any}
                className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-border/80 bg-forest min-h-[380px] sm:min-h-[420px] p-6 sm:p-8 transition-all duration-500 hover:shadow-luxury-hover hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {/* Background Image */}
                <img
                  src={imageSrc}
                  alt={style.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Gradient Overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/60 to-forest/20 transition-opacity duration-300 group-hover:opacity-90"
                  aria-hidden="true"
                />

                {/* Top Badge */}
                {style.badge && (
                  <div className="absolute top-5 left-5 z-10">
                    <span className="inline-flex items-center text-[10px] tracking-[0.2em] uppercase font-semibold text-gold bg-forest/80 backdrop-blur-md border border-gold/30 px-3 py-1 rounded-full">
                      {style.badge}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10 text-cream transform transition-transform duration-300 group-hover:translate-y-[-2px]">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gold/90 font-medium mb-1.5">
                    {style.tagline}
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl text-cream mb-2 leading-tight">{style.title}</h3>
                  <p className="text-sm text-cream/80 leading-relaxed mb-4 line-clamp-2">{style.description}</p>
                  <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase font-semibold text-gold group-hover:text-cream transition-colors">
                    Explore Experiences{" "}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
