import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Compass, Calendar, Users, Search, Plus, Minus } from "lucide-react";
import heroImg from "@/assets/hero-baobab.jpg";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { usePreviewMerge } from "@/lib/preview-overrides";
import { getAdventuresPage } from "@/lib/adventures.functions";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { SiteImage } from "@/components/site/SiteImage";

type HeroContent = Partial<typeof PAGE_DEFAULTS.home>;

export function Hero({ content }: { content?: HeroContent | null } = {}) {
  const base = { ...PAGE_DEFAULTS.home, ...(content ?? {}) };
  const c = usePreviewMerge("home", base);
  const asBackground = Boolean(c.hero_image_as_background);
  const hideSearch = Boolean(c.hero_hide_search);
  const heroSrc = c.hero_image_url || null;
  const navigate = useNavigate();
  const menu = useMenuConfig();
  const overlay = !!menu.transparentOverHero;

  const bgSize: "cover" | "contain" = c.hero_bg_size === "contain" ? "contain" : "cover";

  const fetchAdventures = useServerFn(getAdventuresPage);
  const { data: adventuresPage } = useQuery({
    queryKey: ["hero-adventures"],
    queryFn: () => fetchAdventures(),
    staleTime: 5 * 60_000,
  });
  const adventures = adventuresPage?.signatures ?? [];

  const onSearch = (formData: FormData) => {
    const slug = String(formData.get("adventure") ?? "").trim();
    if (slug) {
      navigate({ to: "/adventures/$slug", params: { slug } });
      return;
    }
    navigate({ to: "/adventures", search: { q: "", region: "", terrain: "", difficulty: "" } });
  };

  const overlayNavSpacer = overlay ? "pt-24 sm:pt-28 md:pt-32 lg:pt-36" : "";

  return (
    <section className={`relative w-full ${overlay ? "-mt-px" : ""}`}>
      {/* Full-bleed hero panel — no outer padding, no rounding, edge-to-edge on all breakpoints */}
      <div
        className={`relative overflow-hidden w-full ${
          asBackground ? "text-cream" : "bg-forest text-forest-foreground"
        }`}
      >
        {asBackground && (
          <SiteImage
            src={heroSrc}
            fallback={heroImg}
            alt="Baobab safari hero"
            className="absolute inset-0 h-full w-full"
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
            style={{
              objectFit: bgSize,
            }}
          />
        )}

        {asBackground && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-forest/85 via-forest/45 to-forest/10"
            aria-hidden="true"
          />
        )}

        {/* Decorative dotted flight paths */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 1200 700"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden
        >
          <circle cx="850" cy="360" r="240" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="2 6" />
          <circle cx="850" cy="360" r="320" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2 6" />
          <path
            d="M 480 220 C 620 140, 760 280, 900 260 S 1140 380, 1060 460"
            stroke="currentColor"
            strokeOpacity="0.6"
            strokeDasharray="4 8"
            strokeLinecap="round"
          />
        </svg>

        <div
          className={`relative grid gap-8 lg:gap-10 px-5 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 ${overlayNavSpacer} pt-10 sm:pt-14 md:pt-20 pb-10 sm:pb-14 md:pb-20 ${
            asBackground ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]"
          }`}
        >
          {/* LEFT — copy */}
          <div
            className={`max-w-2xl animate-fade-up ${
              asBackground ? "min-h-[580px] md:min-h-[660px] flex flex-col justify-center py-8" : ""
            }`}
            style={asBackground ? { textShadow: "0 2px 24px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)" } : undefined}
          >
            <p className="text-[11px] tracking-[0.38em] uppercase text-cream/85 mb-5">The Baobab Collective</p>

            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-wide text-cream max-w-4xl">
              <span className="block">{c.hero_title_line1}</span>
              <span className="block text-gold">{c.hero_title_line2}</span>
            </h1>

            <p className="mt-6 md:mt-7 text-cream/90 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl">
              {c.hero_subtitle}
            </p>

            <div className="mt-7 md:mt-9 flex flex-wrap items-center gap-3 md:gap-4">
              <Link
                to="/adventures"
                className="group inline-flex items-center gap-3 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[11px] px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 hover:bg-gold/90 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
              >
                {c.hero_cta_secondary}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <EnquireDialog
                sourceUrl="/"
                autosaveKey="enquire-home-hero"
                trigger={
                  <button
                    type="button"
                    className="group inline-flex items-center gap-3 rounded-full border border-cream/60 text-cream uppercase tracking-[0.2em] text-[11px] px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 hover:border-gold hover:text-gold transition-colors backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
                  >
                    {c.hero_cta_primary}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
                }
              />
            </div>

            {!hideSearch && (
              <div className="mt-6 md:mt-10">
                <SearchCapsule onSubmit={onSearch} adventures={adventures} />
              </div>
            )}

            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-cream/75">
              <span>Private safaris</span>
              <span className="text-gold" aria-hidden="true">
                •
              </span>
              <span>Kenya specialists</span>
              <span className="text-gold" aria-hidden="true">
                •
              </span>
              <span>Thoughtfully tailor-made</span>
            </div>
          </div>

          {/* RIGHT — hero image (hidden when background mode) */}
          {!asBackground && (
            <div className="relative min-h-[280px] sm:min-h-[380px] lg:min-h-[560px]">
              <div className="absolute inset-0 flex items-end justify-center lg:justify-end">
                <SiteImage
                  src={heroSrc}
                  fallback={heroImg}
                  alt="Baobab safari hero"
                  className="w-full h-full max-h-[600px] rounded-[18px] md:rounded-[24px] shadow-2xl"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              {c.hero_proof_text && (
                <div className="absolute -left-2 top-4 md:top-10 rotate-[-8deg] bg-cream text-forest px-3 md:px-4 py-2 md:py-3 rounded-md shadow-xl max-w-[180px] md:max-w-[220px]">
                  <p className="font-serif text-xs md:text-sm leading-snug">{c.hero_proof_text}</p>
                </div>
              )}
            </div>
          )}
        </div>
        {asBackground && (
          <div
            className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-cream/70 md:flex"
            aria-hidden="true"
          >
            <span className="text-[10px] uppercase tracking-[0.28em]">Scroll</span>
            <span className="h-10 w-px bg-cream/45" />
          </div>
        )}
      </div>
    </section>
  );
}

function SearchCapsule({
  onSubmit,
  adventures,
}: {
  onSubmit: (fd: FormData) => void;
  adventures: { slug: string; name: string }[];
}) {
  const [travellers, setTravellers] = useState(2);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="flex flex-col sm:flex-row sm:items-center gap-2 bg-cream text-forest rounded-3xl sm:rounded-full pl-4 sm:pl-6 pr-2 py-2 shadow-2xl w-full max-w-2xl"
    >
      <label className="flex-1 min-w-0 flex items-center gap-3 py-2">
        <Compass className="h-4 w-4 text-gold shrink-0" strokeWidth={1.75} />
        <span className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-forest">Adventure</span>
          <select
            name="adventure"
            defaultValue=""
            className="bg-transparent outline-none text-sm text-forest w-full appearance-none cursor-pointer"
          >
            <option value="">All adventures</option>
            {adventures.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </span>
      </label>
      <span className="hidden sm:block h-8 w-px bg-forest/15" />
      <label className="flex-1 min-w-0 flex items-center gap-3 py-2 sm:px-3">
        <Calendar className="h-4 w-4 text-gold shrink-0" strokeWidth={1.75} />
        <span className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-forest">Date</span>
          <input
            name="date"
            type="text"
            placeholder="Anytime"
            className="bg-transparent outline-none text-sm text-forest placeholder:text-forest/50 w-full"
          />
        </span>
      </label>
      <span className="hidden sm:block h-8 w-px bg-forest/15" />
      <div className="flex-1 min-w-0 flex items-center gap-3 py-2 sm:px-3">
        <Users className="h-4 w-4 text-gold shrink-0" strokeWidth={1.75} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-forest">Traveller</span>
          <span className="flex items-center gap-2 text-sm">
            <button
              type="button"
              aria-label="Fewer travellers"
              onClick={() => setTravellers((n) => Math.max(1, n - 1))}
              className="h-5 w-5 rounded-full border border-forest/25 grid place-items-center hover:bg-forest/5"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input type="hidden" name="travellers" value={travellers} />
            <span className="min-w-[1ch] text-center">{travellers}</span>
            <button
              type="button"
              aria-label="More travellers"
              onClick={() => setTravellers((n) => n + 1)}
              className="h-5 w-5 rounded-full border border-forest/25 grid place-items-center hover:bg-forest/5"
            >
              <Plus className="h-3 w-3" />
            </button>
          </span>
        </div>
      </div>
      <button
        type="submit"
        aria-label="Search"
        className="shrink-0 h-12 w-12 rounded-full bg-gold text-gold-foreground grid place-items-center hover:bg-gold/90 transition-colors self-end sm:self-auto"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
}
