import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Calendar, ArrowRight, Compass, Sparkles, X, ChevronRight } from "lucide-react";
import type { DestinationMetadata, GeographicRegion } from "@/lib/destinations.data";
import { KENYA_REGIONS } from "@/lib/destinations.data";

interface KenyaDestinationsMapProps {
  destinations: DestinationMetadata[];
}

// Kenya Geographic Bounding Box approx:
// Min Lat: -4.8, Max Lat: 4.8
// Min Lng: 33.8, Max Lng: 41.9
function latLngToSvgPercent(lat: number, lng: number): { x: number; y: number } {
  const minLat = -4.8;
  const maxLat = 4.8;
  const minLng = 33.8;
  const maxLng = 41.9;

  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;

  return {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(8, Math.min(92, y)),
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
              <Compass className="w-3.5 h-3.5" /> Explore Kenya Geographically
            </p>
            <h2 id="map-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]">
              Where in Kenya will your story begin?
            </h2>
            <p className="mt-4 text-forest-foreground/80 text-base sm:text-lg leading-relaxed">
              From the arid northern frontier to the snow-capped highlands and warm Indian Ocean shores, discover how Kenya's distinct regions connect.
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
          <div className="lg:col-span-7 bg-forest-foreground/5 rounded-2xl border border-border/20 p-6 sm:p-8 relative min-h-[480px] sm:min-h-[560px] flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* SVG Visual Map */}
            <div className="relative w-full h-[400px] sm:h-[480px] my-auto">
              <svg
                viewBox="0 0 800 800"
                className="w-full h-full drop-shadow-lg"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Kenya Stylized Country Boundary Outline */}
                <path
                  d="M 280 40 
                     L 460 30 
                     L 620 90 
                     L 740 240 
                     L 720 440 
                     L 680 500 
                     L 620 660 
                     L 540 760 
                     L 430 730 
                     L 340 680 
                     L 240 600 
                     L 160 540 
                     L 120 420 
                     L 150 280 
                     L 210 180 
                     Z"
                  className="fill-forest-foreground/10 stroke-gold/30 stroke-2 transition-all duration-700 hover:fill-forest-foreground/15"
                />

                {/* Regional Shading Accents */}
                {/* Northern Frontier */}
                <path
                  d="M 280 40 L 460 30 L 620 90 L 700 240 L 420 320 L 210 180 Z"
                  className={`transition-opacity duration-500 ${
                    selectedRegion === "Northern Kenya" ? "fill-gold/20 stroke-gold/60" : "fill-transparent stroke-transparent"
                  }`}
                />

                {/* Rift Valley Spine */}
                <path
                  d="M 260 180 L 400 240 L 380 480 L 260 520 Z"
                  className={`transition-opacity duration-500 ${
                    selectedRegion === "Rift Valley & Central Kenya" ? "fill-gold/20 stroke-gold/60" : "fill-transparent stroke-transparent"
                  }`}
                />

                {/* Southern Plains */}
                <path
                  d="M 240 500 L 480 460 L 520 640 L 340 680 Z"
                  className={`transition-opacity duration-500 ${
                    selectedRegion === "Southern Kenya" ? "fill-gold/20 stroke-gold/60" : "fill-transparent stroke-transparent"
                  }`}
                />

                {/* Indian Ocean Coastline */}
                <path
                  d="M 520 520 L 680 500 L 620 660 L 540 760 L 510 650 Z"
                  className={`transition-opacity duration-500 ${
                    selectedRegion === "Indian Ocean Coast" ? "fill-gold/20 stroke-gold/60" : "fill-transparent stroke-transparent"
                  }`}
                />

                {/* Lake Victoria Indicative Waterway */}
                <path
                  d="M 120 440 Q 150 510 140 570 Q 90 530 120 440 Z"
                  className="fill-cyan-500/20 stroke-cyan-400/40 stroke-1"
                />
                <text x="75" y="515" className="fill-cyan-300/60 text-[11px] tracking-widest uppercase font-mono">
                  Lake Victoria
                </text>

                {/* Lake Turkana (North) */}
                <path
                  d="M 270 90 Q 290 190 310 240 Q 285 240 260 140 Z"
                  className="fill-cyan-500/20 stroke-cyan-400/40 stroke-1"
                />
                <text x="295" y="160" className="fill-cyan-300/60 text-[10px] tracking-widest uppercase font-mono">
                  Lake Turkana
                </text>

                {/* Indian Ocean Water Label */}
                <text x="640" y="700" className="fill-gold/40 text-[12px] tracking-[0.3em] uppercase font-serif">
                  Indian Ocean
                </text>

                {/* Equator Line */}
                <line x1="140" y1="360" x2="740" y2="360" stroke="rgba(212,175,55,0.2)" strokeDasharray="4 6" />
                <text x="150" y="352" className="fill-gold/40 text-[9px] tracking-widest font-mono uppercase">
                  Equator 0° 00'
                </text>

                {/* Mount Kenya Marker */}
                <circle cx="430" cy="380" r="4" className="fill-terracotta stroke-cream stroke-1" />
                <text x="440" y="384" className="fill-cream/70 text-[10px] font-serif">
                  Mt. Kenya (5,199m)
                </text>
              </svg>

              {/* Dynamic Interactive Destination Pins */}
              {destinations.map((d) => {
                const pos = latLngToSvgPercent(d.latitude, d.longitude);
                const isActive = activeDestination?.slug === d.slug;
                const isRegionMatch = selectedRegion === "All" || d.region === selectedRegion;

                return (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() => setActiveSlug(d.slug)}
                    onMouseEnter={() => setActiveSlug(d.slug)}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    aria-label={`Select ${d.name}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-all duration-300 z-20 ${
                      isRegionMatch ? "opacity-100 scale-100" : "opacity-30 scale-75 pointer-events-none"
                    }`}
                  >
                    {/* Pulsing ring on active */}
                    {isActive && (
                      <span className="absolute -inset-2.5 rounded-full bg-gold/40 animate-ping pointer-events-none" />
                    )}

                    <div
                      className={`relative flex items-center justify-center rounded-full transition-all shadow-md ${
                        isActive
                          ? "w-8 h-8 bg-gold text-gold-foreground ring-4 ring-forest ring-offset-1"
                          : "w-6 h-6 bg-cream text-forest hover:scale-125 hover:bg-gold hover:text-gold-foreground"
                      }`}
                    >
                      <MapPin className={`${isActive ? "w-4 h-4" : "w-3 h-3"}`} />
                    </div>

                    {/* Pin Label Tooltip */}
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
                <span className="w-2 h-2 rounded-full bg-gold inline-block" /> Click or hover any destination pin
              </span>
              <span className="font-mono text-[11px]">Kenya • East Africa</span>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold bg-background/95 backdrop-blur-md text-foreground px-3 py-1 rounded-full">
                      <MapPin className="w-3 h-3 text-gold" /> {activeDestination.region}
                    </span>
                    {activeDestination.featured && (
                      <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase font-semibold bg-forest text-gold px-2.5 py-1 rounded-full border border-gold/30">
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
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-6 py-3.5 hover:bg-gold/90 transition-colors shadow-sm text-center"
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
