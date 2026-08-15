import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Calendar, ArrowRight, Compass, Sparkles, Navigation } from "lucide-react";
import type { DestinationMetadata } from "@/lib/destinations.data";
import { KENYA_REGIONS } from "@/lib/destinations.data";
import kenyaMapAsset from "@/assets/kenya-destinations-map.jpg";

interface KenyaDestinationsMapProps {
  destinations: DestinationMetadata[];
}

/**
 * Calibrated Percentage Coordinates for the reference Kenya Map (Kenya-Map1.gif)
 * Positions are normalized (% left, % top) calibrated against the reference map image.
 */
const DESTINATION_MAP_POSITIONS: Record<string, { left: number; top: number }> = {
  "maasai-mara": { left: 24.5, top: 64.0 },
  "amboseli": { left: 47.0, top: 76.5 },
  "samburu": { left: 47.5, top: 42.5 },
  "laikipia": { left: 41.5, top: 48.0 },
  "tsavo": { left: 57.5, top: 78.5 },
  "lake-nakuru-naivasha": { left: 31.5, top: 56.5 },
  "mount-kenya": { left: 46.5, top: 51.5 },
  // Coastal destinations — pinned to the visible Indian Ocean coast strip
  "lamu-archipelago": { left: 84.5, top: 55.0 },
  "malindi": { left: 84.0, top: 65.5 },
  "watamu": { left: 83.5, top: 68.5 },
  "diani-beach": { left: 82.5, top: 80.5 },
};

/**
 * Custom Label Offsets to prevent collision with map printed text and neighboring pins.
 */
const DESTINATION_LABEL_OFFSETS: Record<string, string> = {
  "laikipia": "-translate-x-[105%] -translate-y-1/2",
  "mount-kenya": "translate-x-3 -translate-y-1/2",
  "samburu": "-translate-x-1/2 -translate-y-[200%]",
  "lake-nakuru-naivasha": "-translate-x-[105%] translate-y-1",
  // Coastal — labels offset to the LEFT so they don't overflow the right edge
  "lamu-archipelago": "-translate-x-[105%] -translate-y-1/2",
  "malindi": "-translate-x-[105%] -translate-y-1/2",
  "watamu": "-translate-x-[105%] -translate-y-1/2",
  "diani-beach": "-translate-x-[105%] -translate-y-1/2",
  "tsavo": "translate-x-3 translate-y-0",
  "amboseli": "-translate-x-1/2 translate-y-3",
  "maasai-mara": "-translate-x-1/2 translate-y-3",
};

/**
 * Calculates percentage pin position on the reference map:
 * Uses pre-calibrated positions first, falling back to calibrated lat/lng box.
 */
function getMapPosition(d: DestinationMetadata): { left: number; top: number } {
  // 1. Direct slug match
  if (DESTINATION_MAP_POSITIONS[d.slug]) {
    return DESTINATION_MAP_POSITIONS[d.slug];
  }

  // 2. Loose key match
  const key = Object.keys(DESTINATION_MAP_POSITIONS).find(
    (k) => d.slug.includes(k) || k.includes(d.slug) || d.name.toLowerCase().includes(k)
  );
  if (key && DESTINATION_MAP_POSITIONS[key]) {
    return DESTINATION_MAP_POSITIONS[key];
  }

  // 3. Fallback Lat/Lng Box mapping calibrated to the reference GIF boundaries
  // Reference GIF Lat: -4.8° S to +5.0° N, Lng: 33.8° E to 42.0° E
  const minLat = -4.8;
  const maxLat = 5.0;
  const minLng = 33.8;
  const maxLng = 42.0;

  const left = Math.max(8, Math.min(92, 5 + ((d.longitude - minLng) / (maxLng - minLng)) * 88));
  const top = Math.max(8, Math.min(92, 5 + ((maxLat - d.latitude) / (maxLat - minLat)) * 88));

  return { left, top };
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
              <Navigation className="w-3.5 h-3.5" /> Explore Kenya Geographically
            </p>
            <h2 id="map-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]">
              Where in Kenya will your story begin?
            </h2>
            <p className="mt-4 text-forest-foreground/80 text-base sm:text-lg leading-relaxed">
              Explore Kenya's extraordinary regions — from the northern frontier down through the Great Rift Valley, iconic savannahs, and Swahili coast.
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

        {/* Map Layout Grid: Left Interactive Reference Image Map, Right Active Destination Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ── Left Map Canvas (5 Cols on desktop) ── */}
          <div className="lg:col-span-5 bg-forest-foreground/5 rounded-2xl border border-border/20 p-2 sm:p-3 relative flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Reference Map Container — fills column without side gaps */}
            <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: '1 / 1.18' }}>
              {/* Reference Map Image Layer — object-cover fills without side whitespace */}
              <img
                src="/maps/kenya-destinations-map.gif"
                alt="Map of Kenya showing major destinations and geographic regions"
                className="absolute inset-0 w-full h-full object-cover select-none rounded-xl"
                onError={(e) => {
                  // Fallback if public path is served differently in dev preview
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== kenyaMapAsset) {
                    target.src = kenyaMapAsset;
                  }
                }}
              />

              {/* Overlay Glass Vignette */}
              <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-white/10" />

              {/* ── INTERACTIVE DESTINATION PINS OVERLAY ── */}
              <div className="absolute inset-0">
                {destinations.map((d) => {
                  const pos = getMapPosition(d);
                  const isActive = activeDestination?.slug === d.slug;
                  const isRegionMatch = selectedRegion === "All" || d.region === selectedRegion;
                  const labelOffsetClass = DESTINATION_LABEL_OFFSETS[d.slug] || "-translate-x-1/2 translate-y-3";

                  return (
                    <button
                      key={d.slug}
                      type="button"
                      onClick={() => setActiveSlug(d.slug)}
                      onMouseEnter={() => setActiveSlug(d.slug)}
                      style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                      aria-label={`Select ${d.name}`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-all duration-300 z-20 ${
                        isRegionMatch ? "opacity-100 scale-100" : "opacity-35 scale-75 pointer-events-none"
                      }`}
                    >
                      {/* Pulsing ring on active pin */}
                      {isActive && (
                        <span className="absolute -inset-3 rounded-full bg-gold/40 animate-ping pointer-events-none" />
                      )}

                      {/* Pin Circle Icon */}
                      <div
                        className={`relative flex items-center justify-center rounded-full transition-all shadow-lg ${
                          isActive
                            ? "w-8 h-8 bg-gold text-gold-foreground ring-4 ring-forest ring-offset-2 ring-offset-forest"
                            : "w-6 h-6 bg-cream text-forest hover:scale-125 hover:bg-gold hover:text-gold-foreground"
                        }`}
                      >
                        <MapPin className={`${isActive ? "w-4 h-4" : "w-3 h-3"}`} />
                      </div>

                      {/* Destination Label Badge */}
                      <div
                        className={`absolute top-full left-1/2 ${labelOffsetClass} whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider transition-all pointer-events-none shadow-md ${
                          isActive
                            ? "bg-gold text-gold-foreground scale-105 z-30"
                            : "bg-forest/90 text-cream/90 group-hover:bg-cream group-hover:text-forest"
                        }`}
                      >
                        {d.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Map Helper Text */}
            <div className="pt-3 mt-2 border-t border-border/20 flex flex-wrap items-center justify-between text-xs text-forest-foreground/70 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" /> Hover or tap any pin to explore a destination
              </span>
              <span className="font-mono text-[11px]">Kenya destinations • Geographic reference map</span>
            </div>
          </div>

          {/* ── Right Active Destination Spotlight (7 Cols on desktop) ── */}
          <div className="lg:col-span-7 flex flex-col">
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
