import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Calendar,
  ArrowRight,
  Sparkles,
  Navigation,
  Move,
  Save,
  RotateCcw,
  Loader2,
  Sliders,
} from "lucide-react";
import type { DestinationMetadata } from "@/lib/destinations.data";
import {
  KENYA_REGIONS,
  DEFAULT_DESTINATION_MAP_POSITIONS,
  DESTINATION_LABEL_OFFSETS,
  getDestinationMapPosition,
} from "@/lib/destinations.data";
import kenyaMapAsset from "@/assets/kenya-destinations-map.webp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KenyaDestinationsMapProps {
  destinations: DestinationMetadata[];
  mapImage?: string | null;
  customPositions?: Record<string, { left: number; top: number }> | null;
  onSavePositions?: (positions: Record<string, { left: number; top: number }>) => Promise<void> | void;
  isAdmin?: boolean;
  embeddedAdminView?: boolean;
}

export function KenyaDestinationsMap({
  destinations,
  mapImage,
  customPositions: initialCustomPositions,
  onSavePositions,
  isAdmin: forcedIsAdmin,
  embeddedAdminView = false,
}: KenyaDestinationsMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [activeSlug, setActiveSlug] = useState<string>(destinations[0]?.slug || "maasai-mara");

  // Admin auth check
  const [isAdminUser, setIsAdminUser] = useState<boolean>(!!forcedIsAdmin);
  const [isEditMode, setIsEditMode] = useState<boolean>(embeddedAdminView);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Pin positions map state
  const [positions, setPositions] = useState<Record<string, { left: number; top: number }>>(() => {
    return initialCustomPositions || {};
  });

  // Track if positions were modified
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Dragging state
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync when initialCustomPositions changes
  useEffect(() => {
    if (initialCustomPositions) {
      setPositions(initialCustomPositions);
    }
  }, [initialCustomPositions]);

  // Check admin role if not forced
  useEffect(() => {
    if (forcedIsAdmin !== undefined) {
      setIsAdminUser(forcedIsAdmin);
      return;
    }
    let isMounted = true;
    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (isMounted && role?.role === "admin") {
          setIsAdminUser(true);
        }
      } catch {
        // public visitor
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [forcedIsAdmin]);

  const filteredDestinations = useMemo(() => {
    if (selectedRegion === "All") return destinations;
    return destinations.filter((d) => d.region === selectedRegion);
  }, [destinations, selectedRegion]);

  const activeDestination = useMemo(() => {
    return destinations.find((d) => d.slug === activeSlug) || filteredDestinations[0] || destinations[0];
  }, [destinations, activeSlug, filteredDestinations]);

  // Calculate resolved position for a destination
  const getResolvedPos = useCallback(
    (d: DestinationMetadata) => {
      if (positions[d.slug]) {
        return positions[d.slug];
      }
      return getDestinationMapPosition(d, positions);
    },
    [positions],
  );

  // Handle pointer coordinate updates
  const updatePinPosition = useCallback((slug: string, clientX: number, clientY: number) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const rawLeft = ((clientX - rect.left) / rect.width) * 100;
    const rawTop = ((clientY - rect.top) / rect.height) * 100;

    // Clamp inside boundaries
    const left = Number(Math.max(2, Math.min(98, rawLeft)).toFixed(1));
    const top = Number(Math.max(2, Math.min(98, rawTop)).toFixed(1));

    setPositions((prev) => ({
      ...prev,
      [slug]: { left, top },
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Pointer drag start
  const handlePointerDownPin = (slug: string, e: React.PointerEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveSlug(slug);
    setDraggingSlug(slug);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Pointer drag move
  const handlePointerMoveMap = (e: React.PointerEvent) => {
    if (!isEditMode || !draggingSlug) return;
    updatePinPosition(draggingSlug, e.clientX, e.clientY);
  };

  // Pointer drag end
  const handlePointerUpMap = (e: React.PointerEvent) => {
    if (draggingSlug) {
      setDraggingSlug(null);
    }
  };

  // Click on map container to move selected pin
  const handleMapClick = (e: React.MouseEvent) => {
    if (!isEditMode || !activeSlug || draggingSlug) return;
    // Don't reposition if clicking on a button directly
    if ((e.target as HTMLElement).closest("button.pin-handle")) return;
    updatePinPosition(activeSlug, e.clientX, e.clientY);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSavePositions) {
        await onSavePositions(positions);
      } else {
        // Fallback: save to page_destinations_index site setting
        const { getPageContent, savePageContent } = await import("@/lib/page-content.functions");
        const current = (await getPageContent({ data: { key: "destinations_index" } })) || {};
        await savePageContent({
          data: {
            key: "destinations_index",
            value: {
              ...current,
              map_positions: positions,
            },
          },
        });
      }
      setHasUnsavedChanges(false);
      toast.success("Destination map pin positions saved successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save map pin positions");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default coordinates
  const handleResetToDefaults = () => {
    if (confirm("Reset all destination pin positions to default Kenya map coordinates?")) {
      setPositions(DEFAULT_DESTINATION_MAP_POSITIONS);
      setHasUnsavedChanges(true);
      toast.info("Reset to default pin positions. Click 'Save' to apply permanently.");
    }
  };

  // Fine-tuning nudges for active pin
  const nudgeActivePin = (dx: number, dy: number) => {
    if (!activeDestination) return;
    const cur = getResolvedPos(activeDestination);
    const nextLeft = Number(Math.max(2, Math.min(98, cur.left + dx)).toFixed(1));
    const nextTop = Number(Math.max(2, Math.min(98, cur.top + dy)).toFixed(1));
    setPositions((prev) => ({
      ...prev,
      [activeDestination.slug]: { left: nextLeft, top: nextTop },
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <section
      aria-labelledby="map-heading"
      className={`bg-forest text-forest-foreground ${embeddedAdminView ? "py-4" : "py-20 md:py-28"} relative overflow-hidden`}
    >
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-gold) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        {/* Section Header (hidden in embedded view) */}
        {!embeddedAdminView && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5" /> Explore Kenya Geographically
                </p>
                {isAdminUser && (
                  <span className="inline-flex items-center gap-1.5 bg-gold/20 text-gold border border-gold/40 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">
                    <Sliders className="w-3 h-3" /> Admin Controls
                  </span>
                )}
              </div>
              <h2 id="map-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.08]">
                Where in Kenya will your story begin?
              </h2>
              <p className="mt-4 text-forest-foreground/80 text-base sm:text-lg leading-relaxed">
                Explore Kenya's extraordinary regions — from the northern frontier down through the Great Rift Valley,
                iconic savannahs, and Swahili coast.
              </p>
            </div>

            {/* Region Tabs & Admin Edit Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start md:self-end">
              {isAdminUser && (
                <button
                  type="button"
                  onClick={() => setIsEditMode((prev) => !prev)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] tracking-[0.2em] uppercase font-bold transition-all shadow-md cursor-pointer ${
                    isEditMode
                      ? "bg-terracotta text-white ring-2 ring-terracotta/40 hover:bg-terracotta/90"
                      : "bg-gold text-gold-foreground hover:bg-gold/90"
                  }`}
                >
                  <Move className="w-3.5 h-3.5" />
                  {isEditMode ? "Exit Pin Editor" : "Drag & Drop Pins"}
                </button>
              )}

              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kenya Regions">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedRegion === "All"}
                  onClick={() => setSelectedRegion("All")}
                  className={`px-4 py-2 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold transition-all cursor-pointer ${
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
                      className={`px-4 py-2 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold transition-all cursor-pointer ${
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
          </div>
        )}

        {/* ── ADMIN LIVE PIN POSITIONING TOOLBAR ── */}
        {isEditMode && (
          <div className="mb-6 bg-cream text-foreground rounded-2xl p-4 sm:p-5 border-2 border-gold shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-terracotta animate-pulse" />
                  <h3 className="font-serif text-lg font-bold text-forest flex items-center gap-2">
                    <Move className="w-4 h-4 text-gold" /> Drag & Drop Pin Positioning
                  </h3>
                  {hasUnsavedChanges && (
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-terracotta/15 text-terracotta px-2 py-0.5 rounded-full">
                      Unsaved Changes
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/75">
                  Click and drag any pin directly on the map. You can also click anywhere on the map to place the
                  selected pin.
                </p>
              </div>

              {/* Active Pin Coordinates & Nudge Controls */}
              {activeDestination && (
                <div className="flex flex-wrap items-center gap-2 bg-background p-2 rounded-xl border border-border">
                  <span className="text-xs font-semibold text-foreground/70 pl-2">
                    Active: <strong className="text-forest">{activeDestination.name}</strong>
                  </span>
                  {(() => {
                    const pos = getResolvedPos(activeDestination);
                    return (
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-foreground/90">
                        X: {pos.left}% | Y: {pos.top}%
                      </span>
                    );
                  })()}
                  <div className="flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      title="Nudge Left"
                      onClick={() => nudgeActivePin(-0.5, 0)}
                      className="px-2 py-1 bg-muted hover:bg-forest hover:text-cream text-xs rounded font-bold cursor-pointer transition-colors"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      title="Nudge Right"
                      onClick={() => nudgeActivePin(0.5, 0)}
                      className="px-2 py-1 bg-muted hover:bg-forest hover:text-cream text-xs rounded font-bold cursor-pointer transition-colors"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      title="Nudge Up"
                      onClick={() => nudgeActivePin(0, -0.5)}
                      className="px-2 py-1 bg-muted hover:bg-forest hover:text-cream text-xs rounded font-bold cursor-pointer transition-colors"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      title="Nudge Down"
                      onClick={() => nudgeActivePin(0, 0.5)}
                      className="px-2 py-1 bg-muted hover:bg-forest hover:text-cream text-xs rounded font-bold cursor-pointer transition-colors"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-background hover:bg-destructive/10 text-foreground border border-border hover:border-destructive transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving || !hasUnsavedChanges}
                  onClick={handleSave}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                    hasUnsavedChanges
                      ? "bg-gold text-gold-foreground hover:bg-gold/90 ring-2 ring-gold/40"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Pin Positions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Layout Grid: Left Interactive Reference Image Map, Right Active Destination Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ── Left Map Canvas (5 Cols on desktop) ── */}
          <div className="lg:col-span-5 bg-forest-foreground/5 rounded-2xl border border-border/20 p-2 sm:p-3 relative flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Reference Map Container */}
            <div
              ref={mapContainerRef}
              onClick={handleMapClick}
              onPointerMove={handlePointerMoveMap}
              onPointerUp={handlePointerUpMap}
              className={`relative w-full overflow-hidden rounded-xl touch-none ${
                isEditMode ? "cursor-crosshair ring-2 ring-gold/60" : ""
              }`}
              style={{ aspectRatio: "1 / 1.18" }}
            >
              {/* Reference Map Image Layer */}
              <img
                src={mapImage || kenyaMapAsset}
                alt="Map of Kenya showing major destinations and geographic regions"
                className="absolute inset-0 w-full h-full object-cover select-none rounded-xl pointer-events-none"
              />

              {/* Overlay Glass Vignette */}
              <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-white/10" />

              {/* Edit Mode Grid Crosshair Guide Overlay */}
              {isEditMode && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-15"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
                    backgroundSize: "10% 10%",
                  }}
                />
              )}

              {/* ── INTERACTIVE DESTINATION PINS OVERLAY ── */}
              <div className="absolute inset-0 pointer-events-auto">
                {destinations.map((d) => {
                  const pos = getResolvedPos(d);
                  const isActive = activeDestination?.slug === d.slug;
                  const isDragging = draggingSlug === d.slug;
                  const isRegionMatch = selectedRegion === "All" || d.region === selectedRegion;
                  const labelOffsetClass = DESTINATION_LABEL_OFFSETS[d.slug] || "-translate-x-1/2 translate-y-3";

                  return (
                    <div
                      key={d.slug}
                      style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all select-none ${
                        isDragging ? "z-50 scale-125" : isActive ? "z-40 scale-110" : "z-20"
                      } ${isRegionMatch ? "opacity-100" : "opacity-35 pointer-events-none"}`}
                    >
                      <button
                        type="button"
                        className="pin-handle relative group focus:outline-none flex flex-col items-center justify-center cursor-pointer"
                        onPointerDown={(e) => handlePointerDownPin(d.slug, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlug(d.slug);
                        }}
                        onMouseEnter={() => {
                          if (!draggingSlug) setActiveSlug(d.slug);
                        }}
                        aria-label={`${isEditMode ? "Drag" : "Select"} ${d.name} (X: ${pos.left}%, Y: ${pos.top}%)`}
                        title={isEditMode ? `Drag to move ${d.name} (${pos.left}%, ${pos.top}%)` : d.name}
                      >
                        {/* Pulsing ring on active pin */}
                        {isActive && !isDragging && (
                          <span className="absolute -inset-3.5 rounded-full bg-orange-500/40 animate-ping pointer-events-none" />
                        )}

                        {/* Drag mode active aura */}
                        {isDragging && (
                          <span className="absolute -inset-5 rounded-full bg-orange-600/50 animate-pulse pointer-events-none ring-4 ring-orange-300" />
                        )}

                        {/* Pin Circle Icon - Bigger & Orange */}
                        <div
                          className={`relative flex items-center justify-center rounded-full transition-all shadow-2xl ${
                            isDragging
                              ? "w-12 h-12 bg-orange-600 text-white ring-4 ring-orange-300 cursor-grabbing scale-125"
                              : isEditMode
                                ? isActive
                                  ? "w-11 h-11 bg-orange-500 text-white ring-4 ring-white/90 ring-offset-2 ring-offset-forest cursor-grab hover:scale-110 shadow-orange-500/50 shadow-lg"
                                  : "w-9 h-9 bg-orange-500 text-white border-2 border-white hover:bg-orange-600 cursor-grab hover:scale-110 shadow-md"
                                : isActive
                                  ? "w-11 h-11 bg-orange-500 text-white ring-4 ring-white/90 ring-offset-2 ring-offset-forest shadow-orange-500/50 shadow-lg scale-110"
                                  : "w-9 h-9 bg-orange-500 text-white border-2 border-white/90 hover:scale-125 hover:bg-orange-600 shadow-md"
                          }`}
                        >
                          {isEditMode ? (
                            <Move className={`${isActive || isDragging ? "w-5 h-5" : "w-4 h-4"}`} />
                          ) : (
                            <MapPin className={`${isActive ? "w-5.5 h-5.5" : "w-4.5 h-4.5"} drop-shadow-sm`} />
                          )}
                        </div>

                        {/* Live Coordinate Tooltip during edit/drag */}
                        {isEditMode && (isActive || isDragging) && (
                          <div className="absolute -top-8 whitespace-nowrap bg-black/90 text-orange-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-lg pointer-events-none border border-orange-500/50">
                            {pos.left}% · {pos.top}%
                          </div>
                        )}

                        {/* Destination Label Badge - Orange */}
                        <div
                          className={`absolute top-full left-1/2 ${labelOffsetClass} whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all pointer-events-none shadow-lg ${
                            isActive || isDragging
                              ? "bg-orange-600 text-white scale-110 z-30 ring-2 ring-orange-300 shadow-orange-600/40"
                              : "bg-orange-500 text-white group-hover:bg-orange-600 group-hover:scale-105"
                          }`}
                        >
                          {d.name}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Map Helper Text */}
            <div className="pt-3 mt-2 border-t border-border/20 flex flex-wrap items-center justify-between text-xs text-forest-foreground/70 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                {isEditMode
                  ? "Admin Pin Placement Mode: Click & drag pins or click map to move active pin."
                  : "Hover or tap any pin to explore a destination"}
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
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold">
                        {activeDestination.destinationCategory}
                      </p>
                      {isEditMode && (
                        <span className="text-[10px] font-mono bg-cream px-2 py-0.5 rounded text-foreground/60 border border-border">
                          Pin: {getResolvedPos(activeDestination).left}% left, {getResolvedPos(activeDestination).top}%
                          top
                        </span>
                      )}
                    </div>
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
