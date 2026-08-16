import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import {
  ArrowRight,
  Check,
  MapPin,
  Compass,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  Calendar,
  Shield,
  Heart,
  Footprints,
  Sun,
  Camera,
  Users,
  Palmtree,
  Feather,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { AdventureCard, getHumanDifficulty } from "@/components/site/AdventureCard";
import { Label } from "@/components/ui/label";
import heroBaobab from "@/assets/hero-baobab.jpg";
import g1Img from "@/assets/gallery-1.jpg";
import g4Img from "@/assets/gallery-4.jpg";
import elephantImg from "@/assets/elephant.jpg";
import {
  adventuresDefaults,
  getAdventuresPage,
  type AdventuresPage,
  type AdventuresSignature,
} from "@/lib/adventures.functions";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";
import { DESTINATION_COMBINATIONS } from "@/lib/destinations.data";

const searchSchema = z.object({
  q: z.string().default(""),
  region: z.string().default(""),
  terrain: z.string().default(""),
  difficulty: z.string().default(""),
  duration: z.string().default(""),
  experience: z.string().default(""),
  travelStyle: z.string().default(""),
});

export const Route = createFileRoute("/adventures/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Kenya Safari Adventures & Tailor-Made Journeys | The Baobab Collective" },
      {
        name: "description",
        content:
          "Explore thoughtfully curated Kenya safari adventures, from wildlife and wilderness to beach escapes and cultural journeys. Designed personally by The Baobab Collective.",
      },
      { property: "og:title", content: "Kenya Safari Adventures — The Baobab Collective" },
      {
        property: "og:description",
        content:
          "Bespoke wild adventures across Kenya — walking safaris, private conservancies, deltas and coastal escapes.",
      },
      { property: "og:image", content: heroBaobab },
      { property: "og:url", content: "/adventures" },
    ],
    links: [{ rel: "canonical", href: "/adventures" }],
  }),
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData({
      queryKey: ["adventures-page"],
      queryFn: () => getAdventuresPage(),
      staleTime: 60_000,
    });
  },
  errorComponent: ({ error }) => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-3xl mb-4">Something went wrong</h1>
        <p className="text-foreground/70">{error.message}</p>
      </main>
      <Footer />
    </div>
  ),
  notFoundComponent: () => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-4">Page not found</h1>
        <Link to="/" className="text-gold underline">
          Back home
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: AdventuresPage,
});

const EXPERIENCE_CATEGORIES = [
  {
    name: "Wildlife",
    icon: Sparkles,
    image: elephantImg,
    desc: "Big cats, migration herds & private conservancies",
  },
  {
    name: "Walking",
    icon: Footprints,
    image: g1Img,
    desc: "Track wildlife on foot with veteran indigenous guides",
  },
  {
    name: "Wilderness",
    icon: Compass,
    image: heroBaobab,
    desc: "Remote, uncrowded landscapes under vast skies",
  },
  {
    name: "Safari + Beach",
    icon: Palmtree,
    image: g4Img,
    desc: "Savannah game drives paired with turquoise coastlines",
  },
  {
    name: "Romance",
    icon: Heart,
    image: heroBaobab,
    desc: "Intimate starry camps and quiet, private moments",
  },
  {
    name: "Family",
    icon: Users,
    image: elephantImg,
    desc: "Multi-generational safaris crafted for all ages",
  },
  {
    name: "Photography",
    icon: Camera,
    image: g1Img,
    desc: "Golden hour positioning and expert photographic leads",
  },
  {
    name: "Culture",
    icon: Feather,
    image: heroBaobab,
    desc: "Authentic connections with indigenous pastoralists",
  },
];

function AdventuresPage() {
  const fn = useServerFn(getAdventuresPage);
  const { data } = useQuery({
    queryKey: ["adventures-page"],
    queryFn: () => fn(),
  });
  const page: AdventuresPage = data ?? adventuresDefaults;

  const pageContentFn = useServerFn(getPageContent);
  const { data: pcData } = useQuery({
    queryKey: ["page-content", "adventures_index"],
    queryFn: () => pageContentFn({ data: { key: "adventures_index" } }),
    staleTime: 60_000,
  });
  const baseContent = { ...PAGE_DEFAULTS.adventures_index, ...(pcData ?? {}) };
  const content = usePreviewMerge("adventures_index", baseContent);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        {/* 01. Hero Section */}
        {content.show_hero !== false && <HeroSection hero={page.hero} content={content} />}

        {/* 02. A Day in the Field (Timeline) */}
        {content.show_rhythm !== false && <DayInTheFieldSection content={content} />}

        {/* 03. Adventure Finder / Filter UI */}
        {content.show_finder !== false && <AdventureFinderSection signatures={page.signatures} content={content} />}

        {/* 04. Journeys We'd Take Ourselves (Featured Signatures) */}
        {content.show_signature !== false && <SignatureSection signatures={page.signatures} content={content} />}

        {/* 05. Explore by Experience */}
        {content.show_explore !== false && <ExploreByExperienceSection content={content} />}

        {/* 06. Featured Journey (Spotlight) */}
        {content.show_spotlight !== false && <FeaturedJourneySpotlight signatures={page.signatures} />}

        {/* 07. Main Adventure Catalogue */}
        {content.show_catalogue !== false && <MainCatalogueSection signatures={page.signatures} content={content} />}

        {/* 08. Journey Combinations / Related Destinations */}
        {content.show_combinations !== false && <JourneyCombinationsSection content={content} />}

        {/* 09. "Not Quite Right?" Bespoke Banner */}
        {content.show_enquiry_cta !== false && <BespokeConversionBanner content={content} />}

        {/* 10. Final CTA */}
        {content.show_final_cta !== false && <FinalCtaSection cta={page.cta} />}
      </main>
      <Footer />
    </div>
  );
}

{
  /* ─── 01. HERO SECTION ────────────────────────────────────────────────────────── */
}

function HeroSection({
  hero,
  content,
}: {
  hero: AdventuresPage["hero"];
  content: typeof PAGE_DEFAULTS.adventures_index;
}) {
  const heroSrc = content.hero_image || hero.image || heroBaobab;
  return (
    <section className="relative h-[85vh] min-h-[620px] flex items-end">
      <img
        src={heroSrc}
        alt={hero.imageAlt || "Sunrise over the African bush — a guide leads a walking safari toward distant baobabs"}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-black/40 to-black/20" />

      <div className="relative max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16 pb-20 text-cream w-full">
        <p className="text-[11px] tracking-[0.35em] uppercase text-gold mb-5 font-semibold">
          {hero.eyebrow || content.eyebrow || "Adventures"}
        </p>
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] mb-6 max-w-5xl">
          {hero.headline || content.title || "EXPERIENCE KENYA BEYOND THE ORDINARY."}
        </h1>
        <p className="text-lg md:text-xl text-cream/90 max-w-2xl leading-relaxed mb-10 font-sans">
          {hero.subhead ||
            content.subtitle ||
            "Journeys designed around your pace, your curiosity and the places you want to discover."}
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <a
            href="#finder"
            className="inline-flex items-center gap-2.5 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-8 py-4 hover:bg-gold/90 transition-all shadow-lg hover:shadow-gold/20"
          >
            <span>Find Your Adventure</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <EnquireDialog
            defaultSubject="Private Travel Enquiry — Adventures"
            sourceUrl="/adventures"
            autosaveKey="enquire:adventures-hero"
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-cream/70 text-cream uppercase tracking-[0.24em] text-[11px] font-semibold px-8 py-4 hover:bg-cream hover:text-foreground transition-all"
              >
                Plan a Private Journey
              </button>
            }
          />
        </div>
      </div>
    </section>
  );
}

{
  /* ─── 02. A DAY IN THE FIELD ─────────────────────────────────────────────────── */
}

function DayInTheFieldSection({ content }: { content: typeof PAGE_DEFAULTS.adventures_index }) {
  const timeline = [1, 2, 3, 4]
    .map((i) => {
      const get = (suffix: string) => (content as Record<string, any>)[`rhythm_${i}_${suffix}`] as string | undefined;
      const fallbackImages = [g1Img, heroBaobab, g4Img, elephantImg];
      return {
        time: get("time") || "",
        phase: get("phase") || "",
        title: get("title") || "",
        body: get("body") || "",
        image: get("image") || fallbackImages[i - 1],
      };
    })
    .filter((step) => step.title || step.body || step.time);

  return (
    <section className="py-24 md:py-32 bg-cream/60 border-b border-border/40">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="max-w-3xl mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-3">
            {(content.rhythm_eyebrow || "A Day in the Field").toUpperCase()}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            {content.rhythm_title || "The rhythm of a Baobab safari."}
          </h2>
          <p className="text-foreground/75 text-lg mt-4 leading-relaxed">
            {content.rhythm_body ||
              "We don't rush between sightings. Every day is unhurried, shaped around natural light, wildlife movements, and moments of quiet wonder."}
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {timeline.map((step) => (
            <div
              key={`${step.time}-${step.title}`}
              className="bg-background border border-border/60 rounded-xl overflow-hidden p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
                  <span className="font-serif text-3xl text-gold font-medium">{step.time}</span>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-foreground/50 font-semibold bg-cream px-2.5 py-1 rounded">
                    {step.phase}
                  </span>
                </div>
                <h3 className="font-serif text-xl text-foreground mb-3 leading-snug">{step.title}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed mb-6">{step.body}</p>
              </div>
              <div className="aspect-[16/9] rounded-lg overflow-hidden mt-auto">
                <img src={step.image} alt={step.title} loading="lazy" className="w-full h-full object-cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

{
  /* ─── 03. ADVENTURE FINDER ────────────────────────────────────────────────────── */
}

function AdventureFinderSection({
  signatures,
  content,
}: {
  signatures: AdventuresSignature[];
  content: typeof PAGE_DEFAULTS.adventures_index;
}) {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const regions = useMemo(() => {
    const set = new Set<string>();
    signatures.forEach((s) => {
      if (s.region) set.add(s.region);
      (s.destinations || []).forEach((d) => set.add(d));
    });
    return Array.from(set).sort();
  }, [signatures]);

  const parseOptions = (value: string | undefined, fallback: string[]) => {
    const list = (value ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    return list.length > 0 ? list : fallback;
  };

  const experiences = useMemo(
    () =>
      parseOptions(content.finder_experience_options, [
        "Wildlife",
        "Walking",
        "Wilderness",
        "Safari + Beach",
        "Romance",
        "Family",
        "Photography",
        "Culture",
        "Conservation",
      ]),
    [content.finder_experience_options],
  );

  const travelStyles = useMemo(
    () =>
      parseOptions(content.finder_travel_style_options, [
        "Private",
        "Small Group",
        "Family",
        "Honeymoon",
        "Active",
        "Slow Safari",
        "Photography",
      ]),
    [content.finder_travel_style_options],
  );

  const setParam = (key: keyof z.infer<typeof searchSchema>, val: string) => {
    navigate({
      search: (prev) => ({ ...prev, [key]: val }),
      replace: true,
      resetScroll: false,
    });
  };

  const clearAll = () => {
    navigate({
      search: {
        q: "",
        region: "",
        terrain: "",
        difficulty: "",
        duration: "",
        experience: "",
        travelStyle: "",
      },
      replace: true,
      resetScroll: false,
    });
  };

  const hasActiveFilters = !!(
    search.q ||
    search.region ||
    search.terrain ||
    search.difficulty ||
    search.duration ||
    search.experience ||
    search.travelStyle
  );

  return (
    <section id="finder" className="py-20 bg-forest text-forest-foreground scroll-mt-12">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-3">
            {(content.finder_eyebrow || "Adventure Finder").toUpperCase()}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-cream">
            {(content.finder_title || "Find Your Adventure").toUpperCase()}
          </h2>
          <p className="text-forest-foreground/80 text-base md:text-lg mt-4 leading-relaxed">
            {content.finder_body ||
              "Tell us what you're looking for and we'll show you the journeys that might be right for you."}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-background/95 backdrop-blur border border-gold/30 rounded-2xl p-6 md:p-8 text-foreground shadow-2xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
            {/* WHERE? */}
            <div>
              <label className="text-[10px] tracking-[0.22em] uppercase text-foreground/60 font-semibold mb-2 block">
                WHERE? (Region)
              </label>
              <select
                value={search.region || ""}
                onChange={(e) => setParam("region", e.target.value)}
                className="w-full h-12 bg-cream border border-border px-3.5 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="">All Regions & Destinations</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* WHAT? */}
            <div>
              <label className="text-[10px] tracking-[0.22em] uppercase text-foreground/60 font-semibold mb-2 block">
                WHAT? (Experience)
              </label>
              <select
                value={search.experience || ""}
                onChange={(e) => setParam("experience", e.target.value)}
                className="w-full h-12 bg-cream border border-border px-3.5 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="">All Experiences</option>
                {experiences.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            {/* HOW LONG? */}
            <div>
              <label className="text-[10px] tracking-[0.22em] uppercase text-foreground/60 font-semibold mb-2 block">
                HOW LONG? (Duration)
              </label>
              <select
                value={search.duration || ""}
                onChange={(e) => setParam("duration", e.target.value)}
                className="w-full h-12 bg-cream border border-border px-3.5 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="">Any Duration</option>
                <option value="2-3">2–3 nights</option>
                <option value="4-6">4–6 nights</option>
                <option value="7-10">7–10 nights</option>
                <option value="10+">10+ nights</option>
              </select>
            </div>

            {/* HOW? */}
            <div>
              <label className="text-[10px] tracking-[0.22em] uppercase text-foreground/60 font-semibold mb-2 block">
                HOW? (Travel Style)
              </label>
              <select
                value={search.travelStyle || ""}
                onChange={(e) => setParam("travelStyle", e.target.value)}
                className="w-full h-12 bg-cream border border-border px-3.5 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="">All Travel Styles</option>
                {travelStyles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* HOW ACTIVE? */}
            <div>
              <label className="text-[10px] tracking-[0.22em] uppercase text-foreground/60 font-semibold mb-2 block">
                HOW ACTIVE? (Difficulty)
              </label>
              <select
                value={search.difficulty || ""}
                onChange={(e) => setParam("difficulty", e.target.value)}
                className="w-full h-12 bg-cream border border-border px-3.5 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="">Any Activity Level</option>
                <option value="Easy">RELAXED (Game drives & easy pace)</option>
                <option value="Moderate">BALANCED (Drives + gentle walking)</option>
                <option value="Active">ACTIVE (Walking & hiking)</option>
                <option value="Challenging">CHALLENGING (Multi-day active)</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-5 border-t border-border/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground/70 font-medium">
                {hasActiveFilters ? "Filters active" : "Displaying all adventures"}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 text-xs text-terracotta hover:underline font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Filters
                </button>
              )}
            </div>

            <a
              href="#catalogue"
              className="inline-flex items-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-7 py-3 hover:bg-gold/90 transition-colors shadow-md"
            >
              <span>Show My Adventures</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

{
  /* ─── 04. JOURNEYS WE'D TAKE OURSELVES ───────────────────────────────────────── */
}

function SignatureSection({
  signatures,
  content,
}: {
  signatures: AdventuresSignature[];
  content: typeof PAGE_DEFAULTS.adventures_index;
}) {
  const featuredList = useMemo(() => {
    const list = signatures.filter((s) => s.featured);
    return list.length > 0 ? list : signatures.slice(0, 4);
  }, [signatures]);

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-3">
            {(content.signature_eyebrow || "Signature Selection").toUpperCase()}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            {(content.signature_title || "Journeys we'd take ourselves.").toUpperCase()}
          </h2>
          <p className="text-foreground/75 text-lg mt-4 leading-relaxed">
            {content.signature_body ||
              "Curated safari itineraries designed from personal field experience across Kenya's wild frontiers."}
          </p>
        </div>

        <div
          className={`grid sm:grid-cols-2 ${
            Number(content.grid_size) === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          } gap-8`}
        >
          {featuredList.map((adv) => (
            <AdventureCard key={adv.slug} adventure={adv} featured />
          ))}
        </div>
      </div>
    </section>
  );
}

{
  /* ─── 05. EXPLORE BY EXPERIENCE ──────────────────────────────────────────────── */
}

function ExploreByExperienceSection({ content }: { content: typeof PAGE_DEFAULTS.adventures_index }) {
  const navigate = useNavigate({ from: Route.fullPath });

  const handleExperienceClick = (expName: string) => {
    navigate({
      search: (prev: any) => ({ ...prev, experience: expName }),
      replace: true,
      resetScroll: false,
    });
    const catalogueEl = document.getElementById("catalogue");
    if (catalogueEl) catalogueEl.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-24 bg-cream/70 border-y border-border/40">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-3">
            {(content.explore_eyebrow || "Curated Themes").toUpperCase()}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            {(content.explore_title || "Explore by Experience").toUpperCase()}
          </h2>
          <p className="text-foreground/75 text-lg mt-4 leading-relaxed">
            {content.explore_body ||
              "Select what matters most to your journey — from intimate walking safaris to coastal retreats."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPERIENCE_CATEGORIES.map((cat, idx) => {
            const get = (suffix: string) =>
              (content as Record<string, any>)[`explore_${idx + 1}_${suffix}`] as string | undefined;
            const exp = {
              name: get("title") || cat.name,
              desc: get("body") || cat.desc,
              image: get("image") || cat.image,
            };
            const IconComp = cat.icon;
            return (
              <button
                key={exp.name}
                type="button"
                onClick={() => handleExperienceClick(exp.name)}
                className="group relative text-left rounded-xl overflow-hidden border border-border bg-background p-6 hover:border-gold/60 transition-all duration-500 hover:shadow-lg"
              >
                <div className="aspect-[16/9] rounded-lg overflow-hidden mb-5 bg-cream">
                  <img
                    src={exp.image}
                    alt={exp.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <IconComp className="w-4 h-4 text-gold shrink-0" />
                  <h3 className="font-serif text-xl text-foreground group-hover:text-gold transition-colors">
                    {exp.name.toUpperCase()}
                  </h3>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">{exp.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

{
  /* ─── 06. FEATURED JOURNEY SPOTLIGHT ──────────────────────────────────────────── */
}

function FeaturedJourneySpotlight({ signatures }: { signatures: AdventuresSignature[] }) {
  const spotlight = useMemo(() => {
    return signatures.find((s) => s.featured) || signatures[0];
  }, [signatures]);

  if (!spotlight) return null;

  return (
    <section className="py-24 bg-forest text-forest-foreground">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-gold/30 shadow-2xl">
              <img src={spotlight.image} alt={spotlight.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-6 left-6">
                <span className="px-4 py-1.5 rounded-full text-[11px] tracking-[0.25em] uppercase font-semibold bg-gold text-gold-foreground shadow">
                  FEATURED JOURNEY
                </span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="lg:col-span-5 space-y-6">
            <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold">ONE JOURNEY. MANY STORIES.</p>
            <h2 className="font-serif text-4xl md:text-5xl text-cream leading-tight">{spotlight.name}</h2>
            <p className="text-forest-foreground/85 text-base md:text-lg leading-relaxed">
              {spotlight.shortDescription || spotlight.description}
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-cream/90 pt-2 border-t border-forest-foreground/15">
              {spotlight.nights && <span>Duration: {spotlight.nights}</span>}
              {spotlight.region && <span>· Region: {spotlight.region}</span>}
              {spotlight.difficulty && <span>· Pace: {getHumanDifficulty(spotlight.difficulty).label}</span>}
            </div>

            {spotlight.highlights?.length > 0 && (
              <ul className="space-y-2.5 pt-2">
                {spotlight.highlights.slice(0, 3).map((h) => (
                  <li key={h} className="flex gap-2.5 text-sm text-forest-foreground/90">
                    <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-4">
              <Link
                to="/adventures/$slug"
                params={{ slug: spotlight.slug }}
                className="inline-flex items-center gap-2.5 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-8 py-4 hover:bg-gold/90 transition-colors shadow-lg"
              >
                <span>Explore This Journey</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

{
  /* ─── 07. MAIN ADVENTURE CATALOGUE ───────────────────────────────────────────── */
}

function MainCatalogueSection({
  signatures,
  content,
}: {
  signatures: AdventuresSignature[];
  content: typeof PAGE_DEFAULTS.adventures_index;
}) {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [sortBy, setSortBy] = useState<"featured" | "duration" | "newest">("featured");

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    const region = (search.region ?? "").trim().toLowerCase();
    const terrain = (search.terrain ?? "").trim().toLowerCase();
    const difficulty = (search.difficulty ?? "").trim().toLowerCase();
    const duration = search.duration ?? "";
    const experience = (search.experience ?? "").trim().toLowerCase();
    const travelStyle = (search.travelStyle ?? "").trim().toLowerCase();

    return signatures.filter((s) => {
      if (region) {
        const matchRegion = s.region?.toLowerCase().includes(region);
        const matchDest = (s.destinations || []).some((d) => d.toLowerCase().includes(region));
        if (!matchRegion && !matchDest) return false;
      }
      if (terrain && s.terrain?.toLowerCase() !== terrain) return false;
      if (difficulty && s.difficulty?.toLowerCase() !== difficulty) return false;

      if (duration) {
        const n = parseInt(s.nights || "0", 10);
        if (duration === "2-3" && (n < 2 || n > 3)) return false;
        if (duration === "4-6" && (n < 4 || n > 6)) return false;
        if (duration === "7-10" && (n < 7 || n > 10)) return false;
        if (duration === "10+" && n < 10) return false;
      }

      if (experience) {
        const hasExp = (s.experienceTypes || []).some((e) => e.toLowerCase().includes(experience));
        if (!hasExp) return false;
      }

      if (travelStyle) {
        const hasStyle = (s.travelStyles || []).some((t) => t.toLowerCase().includes(travelStyle));
        if (!hasStyle) return false;
      }

      if (q) {
        const haystack =
          `${s.name} ${s.region} ${s.description} ${s.shortDescription || ""} ${(s.highlights || []).join(" ")} ${(s.destinations || []).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [signatures, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "duration") {
      return list.sort((a, b) => parseInt(a.nights || "0", 10) - parseInt(b.nights || "0", 10));
    }
    if (sortBy === "newest") {
      return list.reverse();
    }
    return list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [filtered, sortBy]);

  const clearAll = () => {
    navigate({
      search: {
        q: "",
        region: "",
        terrain: "",
        difficulty: "",
        duration: "",
        experience: "",
        travelStyle: "",
      },
      replace: true,
      resetScroll: false,
    });
  };

  return (
    <section id="catalogue" className="py-24 bg-background scroll-mt-12">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12 border-b border-border/60 pb-6">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-2">
              {(content.catalogue_eyebrow || "Full Catalogue").toUpperCase()}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              {(content.catalogue_title || "More Ways to Explore").toUpperCase()}
            </h2>
            <p className="text-sm text-foreground/60 mt-1">Showing {sorted.length} curated adventures</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 bg-cream border border-border rounded-md px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value="featured">Featured First</option>
              <option value="duration">Duration (Shortest to Longest)</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Empty Search State */}
        {sorted.length === 0 ? (
          <div className="text-center py-24 px-6 border border-dashed border-border/80 rounded-2xl bg-cream/30 max-w-3xl mx-auto">
            <p className="font-serif text-3xl text-foreground mb-4">WE HAVEN'T FOUND A PERFECT MATCH — YET.</p>
            <p className="text-foreground/75 text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Every Baobab journey can be shaped around your dates, interests and pace. Tell us what you're dreaming of
              and we'll craft it for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-full border border-gold text-gold uppercase tracking-[0.22em] text-[11px] font-semibold px-7 py-3.5 hover:bg-gold hover:text-gold-foreground transition-colors"
              >
                Clear Filters
              </button>
              <EnquireDialog
                defaultSubject="Custom Journey Request"
                sourceUrl="/adventures"
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-7 py-3.5 hover:bg-gold/90 transition-colors shadow"
                  >
                    <span>Create My Journey</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
            </div>
          </div>
        ) : (
          <div
            className={`grid sm:grid-cols-2 ${
              Number(content.grid_size) === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
            } gap-8`}
          >
            {sorted.map((adv) => (
              <AdventureCard key={adv.slug} adventure={adv} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

{
  /* ─── 08. JOURNEY COMBINATIONS ────────────────────────────────────────────────── */
}

function JourneyCombinationsSection({ content }: { content: typeof PAGE_DEFAULTS.adventures_index }) {
  return (
    <section className="py-24 bg-cream/50 border-t border-border/40">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold mb-3">
            {(content.combinations_eyebrow || "Seamless Circuits").toUpperCase()}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            {(content.combinations_title || "Continue Your Journey").toUpperCase()}
          </h2>
          <p className="text-foreground/75 text-lg mt-4 leading-relaxed">
            {content.combinations_body ||
              "Combine Kenya's wild savannahs with mountain highlands and pristine Indian Ocean beaches."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DESTINATION_COMBINATIONS.map((combo) => (
            <div
              key={combo.id}
              className="bg-background border border-border/70 rounded-xl overflow-hidden flex flex-col justify-between p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="aspect-[16/10] rounded-lg overflow-hidden mb-5">
                  <img src={combo.image} alt={combo.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold font-semibold mb-1.5">{combo.days}</p>
                <h3 className="font-serif text-xl text-foreground mb-2">{combo.title}</h3>
                <p className="text-xs text-foreground/75 leading-relaxed mb-4">{combo.tagline}</p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <EnquireDialog
                  defaultSubject={`Combination Journey — ${combo.title}`}
                  sourceUrl="/adventures"
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold text-gold hover:underline"
                    >
                      <span>Plan This Circuit</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

{
  /* ─── 09. BESPOKE CONVERSION BANNER ───────────────────────────────────────────── */
}

function BespokeConversionBanner({ content }: { content: typeof PAGE_DEFAULTS.adventures_index }) {
  return (
    <section className="py-20 bg-background border-t border-border/40 text-center">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold">
          {(content.bespoke_eyebrow || "Custom Journey Design").toUpperCase()}
        </p>
        <h2 className="font-serif text-4xl md:text-5xl text-foreground">
          {(content.bespoke_title || "Can't find exactly what you're looking for?").toUpperCase()}
        </h2>
        <p className="text-foreground/75 text-lg leading-relaxed max-w-2xl mx-auto">
          {content.bespoke_body ||
            "Our Adventures are starting points. We can reshape the journey around your dates, interests, pace and budget."}
        </p>
        <div className="pt-3">
          <EnquireDialog
            defaultSubject="Bespoke Tailor-Made Journey Request"
            sourceUrl="/adventures"
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-2.5 rounded-full bg-terracotta text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-terracotta/90 transition-colors shadow-lg"
              >
                <span>Create My Journey</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            }
          />
        </div>
      </div>
    </section>
  );
}

{
  /* ─── 10. FINAL CTA ───────────────────────────────────────────────────────────── */
}

function FinalCtaSection({ cta }: { cta: AdventuresPage["cta"] }) {
  return (
    <section className="relative py-28 bg-forest text-forest-foreground text-center overflow-hidden">
      <div className="absolute inset-0 opacity-15">
        <img src={heroBaobab} alt="Kenya Bush" className="w-full h-full object-cover" />
      </div>
      <div className="relative max-w-3xl mx-auto px-6 space-y-6">
        <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold">
          {cta.eyebrow || "YOUR ADVENTURE. OUR CRAFT."}
        </p>
        <h2 className="font-serif text-4xl sm:text-6xl text-cream leading-tight">
          {cta.headline || "Ready to experience Kenya differently?"}
        </h2>
        <p className="text-forest-foreground/85 text-lg leading-relaxed max-w-xl mx-auto font-sans">
          {cta.body ||
            "Tell us where you want to go, what you want to experience and how you like to travel. We'll take it from there."}
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <EnquireDialog
            defaultSubject="Adventures — Start Planning"
            sourceUrl="/adventures"
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-2.5 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-gold/90 transition-colors shadow-lg"
              >
                <span>Start Planning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            }
          />
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2.5 rounded-full border border-cream/70 text-cream uppercase tracking-[0.24em] text-[11px] font-semibold px-9 py-4 hover:bg-cream hover:text-foreground transition-colors"
          >
            <span>Explore Destinations</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
