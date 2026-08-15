import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Calendar, ArrowRight, Compass, Sparkles, Navigation } from "lucide-react";
import type { DestinationMetadata } from "@/lib/destinations.data";
import { KENYA_REGIONS } from "@/lib/destinations.data";

interface KenyaDestinationsMapProps {
  destinations: DestinationMetadata[];
}

/**
 * Calibrated geographic projection for Kenya:
 * Bounding Box:
 *   Min Lat: -4.8° S (Vanga / Tanzania Coast border)
 *   Max Lat: 5.2° N (Ilemi Triangle / Ethiopia border)
 *   Min Lng: 33.7° E (Lake Victoria / Uganda border)
 *   Max Lng: 42.0° E (Mandera / Somalia border)
 * SVG ViewBox: 0 0 720 780
 */
function getGeoCoordinates(lat: number, lng: number): { x: number; y: number } {
  const minLat = -4.8;
  const maxLat = 5.2;
  const minLng = 33.7;
  const maxLng = 42.0;

  const leftPad = 40;
  const rightPad = 40;
  const topPad = 40;
  const bottomPad = 50;

  const width = 720 - leftPad - rightPad; // 640px
  const height = 780 - topPad - bottomPad; // 690px

  const x = leftPad + ((lng - minLng) / (maxLng - minLng)) * width;
  const y = topPad + ((maxLat - lat) / (maxLat - minLat)) * height;

  return { x, y };
}

// Convert x/y to percentage for CSS absolute pin positioning
function getGeoPercentages(lat: number, lng: number): { leftPercent: number; topPercent: number } {
  const { x, y } = getGeoCoordinates(lat, lng);
  return {
    leftPercent: (x / 720) * 100,
    topPercent: (y / 780) * 100,
  };
}

export function KenyaDestinationsMap({ destinations }: KenyaDestinationsMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [activeSlug, setActiveSlug] = useState<string>(destinations[0]?.slug || "maasai-mara");

  const filteredDestinations = useMemo(() => {
    if (selectedRegion === "All") return destinations;
    return destinations.filter((d) => d.region === selectedRegion);
  }, [destinations, selectedRegion]);

  const activeDestination = useMemo(() => {
    return (
      destinations.find((d) => d.slug === activeSlug) ||
      filteredDestinations[0] ||
      destinations[0]
    );
  }, [destinations, activeSlug, filteredDestinations]);

  // Equator line Y position (lat: 0.0)
  const equatorY = getGeoCoordinates(0.0, 36.0).y;

  return (
    <section aria-labelledby="map-heading" className="bg-forest text-forest-foreground py-20 md:py-28 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-gold) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5" /> Interactive Map of Kenya
            </p>
            <h2 id="map-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]">
              Where in Kenya will your story begin?
            </h2>
            <p className="mt-4 text-forest-foreground/80 text-base sm:text-lg leading-relaxed">
              Explore Kenya's accurate geographical regions — from the arid northern frontier down through the Great Rift Valley, iconic savannahs, and Swahili coast.
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-2 self-start md:self-end" role="tablist" aria-label="Kenya Regions">
            <button
              type="button"
              role="tab"
              aria-selected={selectedRegion === "All"}
              onClick={() => setSelectedRegion("All")}
              className={`px-4 py-2 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold transition-all ${
                selectedRegion === "All"
                  ? "bg-gold text-gold-foreground shadow-sm"
                  : "bg-forest-foreground/10 text-forest-foreground/80 hover:bg-forest-foreground/20 hover:text-cream border border-forest-foreground/15"
              }`}
            >
              All Regions ({destinations.length})
            </button>
            {KENYA_REGIONS.map((reg) => {
              const count = destinations.filter((d) => d.region === reg.id).length;
              return (
                <button
                  key={reg.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedRegion === reg.id}
                  onClick={() => setSelectedRegion(reg.id)}
                  className={`px-4 py-2 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold transition-all ${
                    selectedRegion === reg.id
                      ? "bg-gold text-gold-foreground shadow-sm"
                      : "bg-forest-foreground/10 text-forest-foreground/80 hover:bg-forest-foreground/20 hover:text-cream border border-forest-foreground/15"
                  }`}
                >
                  {reg.label} {count > 0 ? `(${count})` : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Layout Grid: Left Interactive SVG Map, Right Active Destination Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ── Left Map Canvas (7 Cols on desktop) ── */}
          <div className="lg:col-span-7 bg-forest-foreground/5 rounded-2xl border border-border/20 p-4 sm:p-6 relative min-h-[520px] sm:min-h-[620px] flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* SVG Visual Map Container */}
            <div className="relative w-full h-[460px] sm:h-[560px] my-auto">
              <svg
                viewBox="0 0 720 780"
                className="w-full h-full drop-shadow-xl"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Subtle Map Gradient */}
                  <linearGradient id="kenyaLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.04)" />
                    <stop offset="100%" stopColor="rgba(212,175,55,0.06)" />
                  </linearGradient>

                  <linearGradient id="regionHighlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(212,175,55,0.3)" />
                    <stop offset="100%" stopColor="rgba(212,175,55,0.1)" />
                  </linearGradient>

                  <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Grid backdrop inside Map Area */}
                <rect width="720" height="780" fill="url(#gridPattern)" />

                {/* ── ACCURATE KENYA GEOGRAPHIC BOUNDARY PATH ── */}
                <path
                  d="M 159,81 
                     C 220,95 320,135 439,159 
                     L 649,130 
                     L 579,210 
                     L 576,383 
                     L 627,526 
                     C 610,545 585,558 577,570 
                     C 555,595 532,600 521,611 
                     C 515,628 512,638 511,647 
                     C 505,658 501,662 499,667 
                     C 492,682 488,688 485,696 
                     C 475,720 460,735 452,741 
                     L 337,650 
                     L 270,590 
                     L 215,551 
                     L 137,540 
                     L 71,482 
                     C 65,430 68,400 69,376 
                     C 85,350 95,340 103,329 
                     C 120,300 135,290 148,278 
                     C 110,200 95,150 88,111 
                     Z"
                  fill="url(#kenyaLandGrad)"
                  stroke="rgba(212, 175, 55, 0.45)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="transition-all duration-700 hover:stroke-gold"
                />

                {/* ── REGIONAL SHADING OVERLAYS ── */}
                {/* 1. Northern Kenya Region Shading */}
                <path
                  d="M 159,81 L 439,159 L 649,130 L 579,210 L 576,383 L 340,360 L 148,278 Z"
                  fill={selectedRegion === "Northern Kenya" ? "url(#regionHighlightGrad)" : "none"}
                  stroke={selectedRegion === "Northern Kenya" ? "var(--color-gold)" : "none"}
                  strokeWidth="2"
                  className="transition-all duration-500 pointer-events-none"
                />

                {/* 2. Rift Valley & Central Kenya Region Shading */}
                <path
                  d="M 148,278 L 340,360 L 320,530 L 137,540 L 69,376 L 103,329 Z"
                  fill={selectedRegion === "Rift Valley & Central Kenya" ? "url(#regionHighlightGrad)" : "none"}
                  stroke={selectedRegion === "Rift Valley & Central Kenya" ? "var(--color-gold)" : "none"}
                  strokeWidth="2"
                  className="transition-all duration-500 pointer-events-none"
                />

                {/* 3. Southern Kenya Region Shading */}
                <path
                  d="M 137,540 L 320,530 L 485,600 L 452,741 L 337,650 L 270,590 L 215,551 Z"
                  fill={selectedRegion === "Southern Kenya" ? "url(#regionHighlightGrad)" : "none"}
                  stroke={selectedRegion === "Southern Kenya" ? "var(--color-gold)" : "none"}
                  strokeWidth="2"
                  className="transition-all duration-500 pointer-events-none"
                />

                {/* 4. Indian Ocean Coast Region Shading */}
                <path
                  d="M 576,383 L 627,526 L 577,570 L 521,611 L 511,647 L 485,696 L 452,741 L 440,620 Z"
                  fill={selectedRegion === "Indian Ocean Coast" ? "url(#regionHighlightGrad)" : "none"}
                  stroke={selectedRegion === "Indian Ocean Coast" ? "var(--color-gold)" : "none"}
                  strokeWidth="2"
                  className="transition-all duration-500 pointer-events-none"
                />

                {/* ── ACCURATE WATER BODIES & GEOGRAPHIC LANDMARKS ── */}

                {/* Lake Victoria (South-West Gulf) */}
                <path
                  d="M 71,482 C 60,450 62,420 69,376 C 50,400 40,440 52,470 Z"
                  className="fill-cyan-500/25 stroke-cyan-400/50 stroke-1.5"
                />
                <text x="50" y="445" className="fill-cyan-200/75 text-[10px] tracking-widest uppercase font-mono font-semibold">
                  Lake Victoria
                </text>

                {/* Lake Turkana (North Slender Lake) */}
                <path
                  d="M 211,96 C 220,140 230,190 256,246 C 238,235 225,180 205,110 Z"
                  className="fill-cyan-500/30 stroke-cyan-300/60 stroke-1.5"
                />
                <text x="238" y="165" className="fill-cyan-200/80 text-[10px] tracking-wider uppercase font-mono font-semibold">
                  Lake Turkana
                </text>

                {/* Indian Ocean Label */}
                <path d="M 540,660 C 580,680 630,710 670,730" stroke="rgba(212,175,55,0.2)" strokeDasharray="3 3" />
                <text x="560" y="705" className="fill-gold/60 text-[12px] tracking-[0.35em] uppercase font-serif font-medium">
                  Indian Ocean
                </text>

                {/* Equator Line */}
                <line x1="50" y1={equatorY} x2="670" y2={equatorY} stroke="rgba(212,175,55,0.25)" strokeDasharray="4 6" />
                <text x="60" y={equatorY - 6} className="fill-gold/60 text-[9.5px] tracking-widest font-mono uppercase font-semibold">
                  Equator 0° 00'
                </text>

                {/* Mount Kenya Elevation Marker */}
                <g transform="translate(309, 420)">
                  <path d="M 0 -8 L 7 5 L -7 5 Z" className="fill-terracotta stroke-cream stroke-1" />
                  <circle cx="0" cy="0" r="1.5" className="fill-cream" />
                  <text x="12" y="4" className="fill-cream/85 text-[10px] font-serif tracking-wide font-medium">
                    Mt. Kenya (5,199m)
                  </text>
                </g>

                {/* Neighboring Country Labels for Context */}
                <text x="110" y="70" className="fill-forest-foreground/30 text-[10px] tracking-widest uppercase font-mono">
                  Ethiopia
                </text>
                <text x="610" y="300" className="fill-forest-foreground/30 text-[10px] tracking-widest uppercase font-mono">
                  Somalia
                </text>
                <text x="210" y="690" className="fill-forest-foreground/30 text-[10px] tracking-widest uppercase font-mono">
                  Tanzania
                </text>
                <text x="50" y="240" className="fill-forest-foreground/30 text-[10px] tracking-widest uppercase font-mono">
                  Uganda
                </text>
              </svg>

              {/* ── ACCURATE GEOGRAPHIC PINS OVERLAY ── */}
              {destinations.map((d) => {
                const pos = getGeoPercentages(d.latitude, d.longitude);
                const isActive = activeDestination?.slug === d.slug;
                const isRegionMatch = selectedRegion === "All" || d.region === selectedRegion;

                return (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() => setActiveSlug(d.slug)}
                    onMouseEnter={() => setActiveSlug(d.slug)}
                    style={{ left: `${pos.leftPercent}%`, top: `${pos.topPercent}%` }}
                    aria-label={`Select ${d.name}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-all duration-300 z-20 ${
                      isRegionMatch ? "opacity-100 scale-100" : "opacity-35 scale-75 pointer-events-none"
                    }`}
                  >
                    {/* Pulsing ring on active */}
                    {isActive && (
                      <span className="absolute -inset-3 rounded-full bg-gold/40 animate-ping pointer-events-none" />
                    )}

                    <div
                      className={`relative flex items-center justify-center rounded-full transition-all shadow-lg ${
                        isActive
                          ? "w-8 h-8 bg-gold text-gold-foreground ring-4 ring-forest ring-offset-2 ring-offset-forest"
                          : "w-6 h-6 bg-cream text-forest hover:scale-125 hover:bg-gold hover:text-gold-foreground"
                      }`}
                    >
                      <MapPin className={`${isActive ? "w-4 h-4" : "w-3 h-3"}`} />
                    </div>

                    {/* Pin Label Badge */}
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider transition-all pointer-events-none shadow-md ${
                        isActive
                          ? "bg-gold text-gold-foreground scale-105"
                          : "bg-forest/90 text-cream/90 group-hover:bg-cream group-hover:text-forest"
                      }`}
                    >
                      {d.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Map Helper Text */}
            <div className="pt-4 border-t border-border/20 flex flex-wrap items-center justify-between text-xs text-forest-foreground/70">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" /> Hover or tap any pin to inspect region
              </span>
              <span className="font-mono text-[11px]">Accurate Kenya Projection • 10 Protected Destinations</span>
            </div>
          </div>

          {/* ── Right Active Destination Spotlight (5 Cols on desktop) ── */}
          <div className="lg:col-span-5 flex flex-col">
            {activeDestination ? (
              <div className="bg-background text-foreground rounded-2xl overflow-hidden border border-border flex flex-col h-full shadow-2xl transition-all duration-500">
                {/* Image Showcase */}
                <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                  <img
                    src={activeDestination.fallbackImage}
                    alt={activeDestination.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold bg-background/95 backdrop-blur-md text-foreground px-3 py-1 rounded-full shadow-sm">
                      <MapPin className="w-3 h-3 text-gold" /> {activeDestination.region}
                    </span>
                    {activeDestination.featured && (
                      <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase font-semibold bg-forest text-gold px-2.5 py-1 rounded-full border border-gold/30 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" /> Iconic
                      </span>
                    )}
                  </div>

                  {activeDestination.bestSeason && (
                    <div className="absolute bottom-4 left-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase font-medium bg-forest/90 text-cream px-3 py-1 rounded-full backdrop-blur-md">
                        <Calendar className="w-3 h-3 text-gold" /> Best time: {activeDestination.bestSeason}
                      </span>
                    </div>
                  )}
                </div>

                {/* Detail Information */}
                <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-1">
                      {activeDestination.destinationCategory}
                    </p>
                    <h3 className="font-serif text-3xl sm:text-4xl text-foreground mb-3 leading-tight">
                      {activeDestination.name}
                    </h3>
                    <p className="text-foreground/75 text-sm sm:text-base leading-relaxed mb-6">
                      {activeDestination.shortDescription}
                    </p>

                    {/* Best For Tags */}
                    {activeDestination.bestFor && activeDestination.bestFor.length > 0 && (
                      <div className="space-y-2 mb-6">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 font-semibold">
                          Known For & Best Experiences
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeDestination.bestFor.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] tracking-[0.18em] uppercase font-medium bg-cream text-foreground/80 border border-border px-3 py-1 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/destinations/$slug"
                      params={{ slug: activeDestination.slug }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-6 py-3.5 hover:bg-gold/90 transition-colors shadow-sm text-center cursor-pointer"
                    >
                      <span>Explore {activeDestination.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
