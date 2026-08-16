import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Map,
  MapPin,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Move,
  Check,
  Sparkles,
  Sliders,
  Compass,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { getPageContent, savePageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { getDestinations } from "@/lib/cms.functions";
import {
  mergeDestinationsWithDefaults,
  DEFAULT_DESTINATION_MAP_POSITIONS,
  DESTINATION_LABEL_OFFSETS,
  type DestinationMetadata,
  KENYA_REGIONS,
} from "@/lib/destinations.data";
import kenyaMapAsset from "@/assets/kenya-destinations-map.jpg";
import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { PageLivePreview } from "@/components/admin/PageLivePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/destinations/map")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/pages-hub/destinations",
      search: { tab: "map" },
    });
  },
});

export interface MapDestinationItem {
  id?: string;
  slug: string;
  name: string;
  region: string;
  x: number; // Normalized coordinate 0 to 1
  y: number; // Normalized coordinate 0 to 1
  visible: boolean;
  order: number;
}

export function AdminDestinationsMapHub() {
  const queryClient = useQueryClient();
  const getPageFn = useServerFn(getPageContent);
  const savePageFn = useServerFn(savePageContent);

  // 1. Fetch live page content
  const { data: pageContent, isLoading: isContentLoading } = useQuery({
    queryKey: ["page-content", "destinations_index"],
    queryFn: () => getPageFn({ data: { key: "destinations_index" } }),
  });

  // 2. Fetch existing CMS destinations list
  const { data: rawDestinations, isLoading: isDestsLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: () => getDestinations(),
  });

  const allAvailableDestinations = useMemo(() => {
    return mergeDestinationsWithDefaults(rawDestinations || []);
  }, [rawDestinations]);

  // Editor State
  const [showMap, setShowMap] = useState<boolean>(true);
  const [mapImage, setMapImage] = useState<string>("");
  const [destinationsOnMap, setDestinationsOnMap] = useState<MapDestinationItem[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Dialogs & Pickers
  const [mediaPickerOpen, setMediaPickerOpen] = useState<boolean>(false);
  const [addDestinationOpen, setAddDestinationOpen] = useState<boolean>(false);
  const [removeTargetSlug, setRemoveTargetSlug] = useState<string | null>(null);
  const [resetAlertOpen, setResetAlertOpen] = useState<boolean>(false);

  // Dragging State
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);
  const tableRowsRef = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Initialize and sync state from database
  useEffect(() => {
    if (pageContent !== undefined && allAvailableDestinations.length > 0) {
      const content = { ...PAGE_DEFAULTS.destinations_index, ...((pageContent ?? {}) as Record<string, any>) };
      setShowMap(content.show_map !== false);
      const savedMapImage = content.map_image || "";
      setMapImage(savedMapImage);

      // Construct map destinations
      const savedPositions = content.map_positions || {};
      const savedMapDestinations = content.map_destinations || [];

      let items: MapDestinationItem[] = [];

      if (Array.isArray(savedMapDestinations) && savedMapDestinations.length > 0) {
        // Use saved structured map destinations
        items = savedMapDestinations.map((d: any, idx: number) => {
          const match = allAvailableDestinations.find((a) => a.slug === d.slug);
          return {
            id: d.id || match?.slug || d.slug,
            slug: d.slug,
            name: d.name || match?.name || d.slug,
            region: d.region || match?.region || "Kenya",
            x: typeof d.x === "number" ? d.x : (savedPositions[d.slug]?.left ?? 50) / 100,
            y: typeof d.y === "number" ? d.y : (savedPositions[d.slug]?.top ?? 50) / 100,
            visible: d.visible !== false,
            order: typeof d.order === "number" ? d.order : idx,
          };
        });
      } else {
        // Fallback from available destinations and default positions
        items = allAvailableDestinations.map((d, idx) => {
          const defaultPos = DEFAULT_DESTINATION_MAP_POSITIONS[d.slug] || { left: 50, top: 50 };
          const customPos = savedPositions[d.slug];
          const leftPercent = customPos?.left ?? defaultPos.left;
          const topPercent = customPos?.top ?? defaultPos.top;

          return {
            id: d.slug,
            slug: d.slug,
            name: d.name,
            region: d.region,
            x: Number((leftPercent / 100).toFixed(3)),
            y: Number((topPercent / 100).toFixed(3)),
            visible: customPos?.visible !== false,
            order: idx,
          };
        });
      }

      setDestinationsOnMap(items);
      if (items.length > 0 && !activeSlug) {
        setActiveSlug(items[0].slug);
      }
    }
  }, [pageContent, allAvailableDestinations]);

  // Unsaved changes navigation prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Save Mutation
  const mSave = useMutation({
    mutationFn: async () => {
      const current = { ...PAGE_DEFAULTS.destinations_index, ...((pageContent ?? {}) as Record<string, any>) };

      // Build map_positions map for backward compatibility
      const nextPositions: Record<string, { left: number; top: number; visible?: boolean }> = {};
      destinationsOnMap.forEach((d) => {
        nextPositions[d.slug] = {
          left: Number((d.x * 100).toFixed(1)),
          top: Number((d.y * 100).toFixed(1)),
          visible: d.visible,
        };
      });

      const updated = {
        ...current,
        show_map: showMap,
        map_image: mapImage,
        map_destinations: destinationsOnMap,
        map_positions: nextPositions,
      };

      await savePageFn({
        data: {
          key: "destinations_index",
          value: updated,
        },
      });
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["page-content", "destinations_index"] });
      toast.success("Destinations map and pin positions saved successfully.");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Failed to save destinations map.");
    },
  });

  // Revert / Reset unsaved changes
  const handleReset = () => {
    if (pageContent !== undefined) {
      const content = { ...PAGE_DEFAULTS.destinations_index, ...((pageContent ?? {}) as Record<string, any>) };
      setShowMap(content.show_map !== false);
      setMapImage(content.map_image || "");
      const savedPositions = content.map_positions || {};
      const savedMapDestinations = content.map_destinations || [];

      if (Array.isArray(savedMapDestinations) && savedMapDestinations.length > 0) {
        setDestinationsOnMap(savedMapDestinations);
      } else {
        const items = allAvailableDestinations.map((d, idx) => {
          const defaultPos = DEFAULT_DESTINATION_MAP_POSITIONS[d.slug] || { left: 50, top: 50 };
          const customPos = savedPositions[d.slug];
          return {
            id: d.slug,
            slug: d.slug,
            name: d.name,
            region: d.region,
            x: Number(((customPos?.left ?? defaultPos.left) / 100).toFixed(3)),
            y: Number(((customPos?.top ?? defaultPos.top) / 100).toFixed(3)),
            visible: customPos?.visible !== false,
            order: idx,
          };
        });
        setDestinationsOnMap(items);
      }
      setHasUnsavedChanges(false);
      setResetAlertOpen(false);
      toast.info("Unsaved changes reset to last saved state.");
    }
  };

  // Coordinated pointer updates
  const updateItemPosition = useCallback((slug: string, clientX: number, clientY: number) => {
    if (!mapCanvasRef.current) return;
    const rect = mapCanvasRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const rawX = (clientX - rect.left) / rect.width;
    const rawY = (clientY - rect.top) / rect.height;

    // Clamp between 0.02 and 0.98
    const clampedX = Number(Math.max(0.02, Math.min(0.98, rawX)).toFixed(3));
    const clampedY = Number(Math.max(0.02, Math.min(0.98, rawY)).toFixed(3));

    setDestinationsOnMap((prev) =>
      prev.map((item) => (item.slug === slug ? { ...item, x: clampedX, y: clampedY } : item))
    );
    setHasUnsavedChanges(true);
  }, []);

  // Pointer Handlers for Pins
  const handlePointerDownPin = (slug: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlug(slug);
    setDraggingSlug(slug);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Scroll corresponding table row into view
    const rowEl = tableRowsRef.current[slug];
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (!draggingSlug) return;
    updateItemPosition(draggingSlug, e.clientX, e.clientY);
  };

  const handlePointerUpCanvas = () => {
    if (draggingSlug) {
      setDraggingSlug(null);
    }
  };

  // Canvas Click: Move active pin to clicked location
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (draggingSlug || !activeSlug) return;
    if ((e.target as HTMLElement).closest(".pin-handle")) return;
    updateItemPosition(activeSlug, e.clientX, e.clientY);
  };

  // Nudge Active Pin
  const nudgeActive = (dx: number, dy: number) => {
    if (!activeSlug) return;
    setDestinationsOnMap((prev) =>
      prev.map((item) => {
        if (item.slug !== activeSlug) return item;
        const nextX = Number(Math.max(0.02, Math.min(0.98, item.x + dx)).toFixed(3));
        const nextY = Number(Math.max(0.02, Math.min(0.98, item.y + dy)).toFixed(3));
        return { ...item, x: nextX, y: nextY };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Toggle Visibility
  const toggleVisibility = (slug: string) => {
    setDestinationsOnMap((prev) =>
      prev.map((item) => (item.slug === slug ? { ...item, visible: !item.visible } : item))
    );
    setHasUnsavedChanges(true);
  };

  // Remove Destination From Map (Does NOT delete DB record)
  const confirmRemoveFromMap = () => {
    if (!removeTargetSlug) return;
    setDestinationsOnMap((prev) => prev.filter((d) => d.slug !== removeTargetSlug));
    if (activeSlug === removeTargetSlug) {
      setActiveSlug(null);
    }
    setHasUnsavedChanges(true);
    setRemoveTargetSlug(null);
    toast.success("Destination removed from map.");
  };

  // Add Destination to Map
  const addDestinationToMap = (dest: DestinationMetadata) => {
    const defaultPos = DEFAULT_DESTINATION_MAP_POSITIONS[dest.slug] || { left: 50, top: 50 };
    const newItem: MapDestinationItem = {
      id: dest.slug,
      slug: dest.slug,
      name: dest.name,
      region: dest.region,
      x: Number((defaultPos.left / 100).toFixed(3)),
      y: Number((defaultPos.top / 100).toFixed(3)),
      visible: true,
      order: destinationsOnMap.length,
    };
    setDestinationsOnMap((prev) => [...prev, newItem]);
    setActiveSlug(dest.slug);
    setHasUnsavedChanges(true);
    setAddDestinationOpen(false);
    toast.success(`"${dest.name}" added to the map.`);
  };

  // Filtered table items
  const filteredTableItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return destinationsOnMap;
    return destinationsOnMap.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        (d.region && d.region.toLowerCase().includes(q))
    );
  }, [destinationsOnMap, searchQuery]);

  // Unassigned destinations available to add
  const unassignedDestinations = useMemo(() => {
    const assignedSlugs = new Set(destinationsOnMap.map((d) => d.slug));
    return allAvailableDestinations.filter((d) => !assignedSlugs.has(d.slug));
  }, [allAvailableDestinations, destinationsOnMap]);

  // Active Destination Details
  const activeItem = useMemo(() => {
    return destinationsOnMap.find((d) => d.slug === activeSlug);
  }, [destinationsOnMap, activeSlug]);

  const activeDestinationMeta = useMemo(() => {
    if (!activeSlug) return null;
    return allAvailableDestinations.find((d) => d.slug === activeSlug);
  }, [allAvailableDestinations, activeSlug]);

  const isLoading = isContentLoading || isDestsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-foreground/60 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
        <span className="text-sm font-medium">Loading Destinations Map Editor…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. HEADER SECTION ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-bold flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5" /> Destinations CMS
            </span>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Destinations — Map</h1>
          <p className="text-sm text-foreground/65 mt-1 max-w-2xl">
            Manage the Kenya destinations map, gallery map artwork, destination pins, and normalized locations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((prev) => !prev)}
            className="text-xs font-semibold"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs font-semibold"
          >
            <Link to="/destinations" target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Open Live Page
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasUnsavedChanges}
            onClick={() => setResetAlertOpen(true)}
            className="text-xs font-semibold text-foreground/70 hover:text-destructive"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={mSave.isPending || !hasUnsavedChanges}
            onClick={() => mSave.mutate()}
            className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold uppercase tracking-wider text-xs shadow-md"
          >
            {mSave.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Toggle show_map switch ── */}
      <div className="flex items-center justify-between gap-4 bg-background border border-border rounded-xl p-4 shadow-sm">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold text-foreground">Show Kenya Destinations Map Section</Label>
          <p className="text-xs text-foreground/60">
            Toggle whether the interactive destinations map section is visible to visitors on the public Destinations landing page.
          </p>
        </div>
        <Switch
          checked={showMap}
          onCheckedChange={(checked) => {
            setShowMap(checked);
            setHasUnsavedChanges(true);
          }}
        />
      </div>

      {/* ── 2. TWO-COLUMN MAIN EDITOR LAYOUT ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: MAP CANVAS & POSITIONING EDITOR (7 Cols) ────────── */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Map Canvas Header Toolbar */}
            <div className="p-4 border-b border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold inline-block" />
                <span className="font-serif text-base font-bold text-foreground">
                  Kenya Map Canvas
                </span>
                <span className="text-xs text-foreground/50">
                  ({destinationsOnMap.filter((d) => d.visible).length} visible pins)
                </span>
              </div>

              {/* Map Image Selection Controls */}
              <div className="flex items-center gap-2">
                {mapImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMapImage("");
                      setHasUnsavedChanges(true);
                    }}
                    className="text-xs text-foreground/60 hover:text-foreground"
                  >
                    Reset to Default Map
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  className="text-xs font-semibold bg-background hover:bg-cream border-gold/40 text-forest"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-gold" />
                  {mapImage ? "Change Map Image" : "Select Map from Gallery"}
                </Button>
              </div>
            </div>

            {/* Interactive Map Area */}
            <div className="p-3 sm:p-4 bg-forest/5 relative">
              <div
                ref={mapCanvasRef}
                onClick={handleCanvasClick}
                onPointerMove={handlePointerMoveCanvas}
                onPointerUp={handlePointerUpCanvas}
                className="relative w-full rounded-xl overflow-hidden bg-forest touch-none cursor-crosshair ring-1 ring-border/40 select-none shadow-inner"
                style={{ aspectRatio: "1 / 1.18" }}
              >
                {/* Map Image Layer */}
                <img
                  src={mapImage || "/maps/kenya-destinations-map.gif"}
                  alt="Kenya Destinations Map"
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== kenyaMapAsset) {
                      target.src = kenyaMapAsset;
                    }
                  }}
                />

                {/* Glass Vignette & Subtle Alignment Grid */}
                <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10" />
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
                    backgroundSize: "10% 10%",
                  }}
                />

                {/* ── DRAGGABLE DESTINATION PINS OVERLAY ── */}
                <div className="absolute inset-0 pointer-events-auto">
                  {destinationsOnMap.map((dest) => {
                    const isSelected = activeSlug === dest.slug;
                    const isDragging = draggingSlug === dest.slug;
                    if (!dest.visible) return null;

                    const leftPercent = dest.x * 100;
                    const topPercent = dest.y * 100;
                    const labelOffset =
                      DESTINATION_LABEL_OFFSETS[dest.slug] || "-translate-x-1/2 translate-y-3";

                    return (
                      <div
                        key={dest.slug}
                        style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all select-none ${
                          isDragging ? "z-50 scale-125" : isSelected ? "z-40 scale-110" : "z-20"
                        }`}
                      >
                        <button
                          type="button"
                          className="pin-handle relative group focus:outline-none flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
                          onPointerDown={(e) => handlePointerDownPin(dest.slug, e)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlug(dest.slug);
                          }}
                          aria-label={`Select ${dest.name} pin (X: ${(dest.x * 100).toFixed(1)}%, Y: ${(dest.y * 100).toFixed(1)}%)`}
                          title={`Drag to reposition ${dest.name}`}
                        >
                          {/* Pulsing selection aura */}
                          {isSelected && !isDragging && (
                            <span className="absolute -inset-3.5 rounded-full bg-orange-500/40 animate-ping pointer-events-none" />
                          )}

                          {/* Drag aura */}
                          {isDragging && (
                            <span className="absolute -inset-5 rounded-full bg-orange-600/50 animate-pulse pointer-events-none ring-4 ring-orange-300" />
                          )}

                          {/* Pin Circular Badge */}
                          <div
                            className={`relative flex items-center justify-center rounded-full transition-all shadow-2xl ${
                              isDragging
                                ? "w-12 h-12 bg-orange-600 text-white ring-4 ring-orange-300 cursor-grabbing shadow-2xl scale-125"
                                : isSelected
                                ? "w-11 h-11 bg-orange-500 text-white ring-4 ring-white/90 ring-offset-2 ring-offset-forest cursor-grab hover:scale-110 shadow-orange-500/50 shadow-lg"
                                : "w-9 h-9 bg-orange-500 text-white border-2 border-white/90 hover:bg-orange-600 hover:scale-110 cursor-grab shadow-md"
                            }`}
                          >
                            <Move className={`${isSelected || isDragging ? "w-5 h-5" : "w-4 h-4"}`} />
                          </div>

                          {/* Floating normalized coordinates badge */}
                          {(isSelected || isDragging) && (
                            <div className="absolute -top-8 whitespace-nowrap bg-black/90 text-orange-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-lg pointer-events-none border border-orange-500/50">
                              x: {dest.x.toFixed(3)} · y: {dest.y.toFixed(3)} ({(dest.x * 100).toFixed(1)}%, {(dest.y * 100).toFixed(1)}%)
                            </div>
                          )}

                          {/* Destination Title Label */}
                          <div
                            className={`absolute top-full left-1/2 ${labelOffset} whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all pointer-events-none shadow-lg ${
                              isSelected || isDragging
                                ? "bg-orange-600 text-white scale-110 z-30 ring-2 ring-orange-300 shadow-orange-600/40"
                                : "bg-orange-500 text-white group-hover:bg-orange-600 group-hover:scale-105"
                            }`}
                          >
                            {dest.name}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Map Footer Tip */}
              <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-foreground/60 gap-2">
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-gold" />
                  Drag pins freely or click anywhere on the map to relocate the active destination.
                </span>
                <span className="font-mono text-[11px] text-foreground/50">
                  Normalized coordinates: 0.000 to 1.000
                </span>
              </div>
            </div>
          </div>

          {/* Active Pin Inspector & Fine Nudge Controls */}
          {activeItem && (
            <div className="bg-background rounded-xl border border-border p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Selected Destination
                </p>
                <h4 className="font-serif text-lg font-bold text-foreground">
                  {activeItem.name}
                </h4>
                <p className="text-xs text-foreground/60 font-mono">
                  Normalized: x={activeItem.x.toFixed(3)}, y={activeItem.y.toFixed(3)} | Screen: {(activeItem.x * 100).toFixed(1)}% L, {(activeItem.y * 100).toFixed(1)}% T
                </p>
              </div>

              {/* Arrow Nudge Buttons */}
              <div className="flex items-center gap-1 bg-muted p-1.5 rounded-lg border border-border self-end sm:self-auto">
                <span className="text-[10px] font-semibold text-foreground/60 px-1.5">Nudge:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Nudge Left"
                  onClick={() => nudgeActive(-0.005, 0)}
                  className="h-7 w-7 p-0 text-xs font-bold"
                >
                  ←
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Nudge Right"
                  onClick={() => nudgeActive(0.005, 0)}
                  className="h-7 w-7 p-0 text-xs font-bold"
                >
                  →
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Nudge Up"
                  onClick={() => nudgeActive(0, -0.005)}
                  className="h-7 w-7 p-0 text-xs font-bold"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Nudge Down"
                  onClick={() => nudgeActive(0, 0.005)}
                  className="h-7 w-7 p-0 text-xs font-bold"
                >
                  ↓
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: DESTINATIONS MANAGEMENT TABLE (5 Cols) ─────────── */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Table Header with Search and Add Action */}
            <div className="p-4 border-b border-border bg-muted/40 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground">
                    Assigned Destinations
                  </h3>
                  <p className="text-xs text-foreground/60">
                    {destinationsOnMap.length} destinations on Kenya map
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setAddDestinationOpen(true)}
                  className="bg-forest text-cream hover:bg-forest/90 text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-gold" /> Add Destination
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Filter destinations by name or region…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background"
                />
              </div>
            </div>

            {/* Destinations Table */}
            <div className="max-h-[620px] overflow-y-auto divide-y divide-border">
              {filteredTableItems.length === 0 ? (
                <div className="py-12 px-4 text-center text-foreground/50 space-y-2">
                  <Compass className="w-8 h-8 mx-auto text-foreground/30" />
                  <p className="text-sm">No destinations found matching "{searchQuery}".</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-foreground/60 uppercase tracking-wider text-[10px] font-semibold sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-2 text-center">Coordinates</th>
                      <th className="py-2.5 px-2 text-center">Pin</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredTableItems.map((item) => {
                      const isSelected = activeSlug === item.slug;
                      return (
                        <tr
                          key={item.slug}
                          ref={(el) => (tableRowsRef.current[item.slug] = el)}
                          onClick={() => setActiveSlug(item.slug)}
                          className={`transition-colors cursor-pointer group ${
                            isSelected
                              ? "bg-gold/10 font-semibold text-foreground border-l-4 border-l-gold"
                              : "hover:bg-muted/40 text-foreground/80"
                          }`}
                        >
                          {/* Destination Info */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  item.visible
                                    ? isSelected
                                      ? "bg-gold ring-2 ring-forest"
                                      : "bg-forest"
                                    : "bg-muted-foreground/30"
                                }`}
                              />
                              <div>
                                <p className="font-serif text-sm font-medium text-foreground">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-foreground/50">
                                  {item.region}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Coordinates */}
                          <td className="py-3 px-2 text-center font-mono text-[11px] text-foreground/70">
                            {item.x.toFixed(2)}, {item.y.toFixed(2)}
                          </td>

                          {/* Visibility Toggle */}
                          <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleVisibility(item.slug)}
                              title={item.visible ? "Hide pin on map" : "Show pin on map"}
                              className={`p-1 rounded-md transition-colors ${
                                item.visible
                                  ? "text-gold hover:bg-gold/20"
                                  : "text-foreground/30 hover:bg-muted"
                              }`}
                            >
                              {item.visible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              title="Edit destination details"
                              className="h-7 px-2 text-[11px] text-foreground/60 hover:text-foreground"
                            >
                              <Link
                                to="/admin/destinations/$id"
                                params={{ id: item.slug }}
                                target="_blank"
                              >
                                Edit
                              </Link>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Remove from map"
                              onClick={() => setRemoveTargetSlug(item.slug)}
                              className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-foreground/60">
              <span>
                Showing {filteredTableItems.length} of {destinationsOnMap.length}
              </span>
              <span className="text-[11px] text-foreground/50">
                Click a row to focus its pin on the map
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. LIVE VISITOR PREVIEW PANEL ────────────────────────────── */}
      {showPreview && (
        <div className="mt-8 pt-8 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-bold">
                Visitor Experience
              </span>
              <h2 className="font-serif text-2xl text-foreground">Live Public Map Preview</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(false)}
              className="text-xs"
            >
              Close Preview
            </Button>
          </div>
          <div className="border border-border rounded-2xl overflow-hidden shadow-2xl">
            <PageLivePreview path="/destinations" />
          </div>
        </div>
      )}

      {/* ── 4. MEDIA LIBRARY PICKER DIALOG ───────────────────────────── */}
      <MediaLibraryPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        title="Select Kenya Map Artwork"
        onSelect={(urls) => {
          if (urls[0]) {
            setMapImage(urls[0]);
            setHasUnsavedChanges(true);
            toast.success("Map image selected from Gallery.");
          }
        }}
      />

      {/* ── 5. ADD DESTINATION MODAL ─────────────────────────────────── */}
      <Dialog open={addDestinationOpen} onOpenChange={setAddDestinationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Destination to Map</DialogTitle>
            <DialogDescription className="text-xs">
              Select an existing destination to place its pin onto the interactive Kenya map canvas.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[350px] overflow-y-auto divide-y divide-border border border-border rounded-lg">
            {unassignedDestinations.length === 0 ? (
              <div className="p-6 text-center text-xs text-foreground/60">
                All existing destinations have already been added to the map!
              </div>
            ) : (
              unassignedDestinations.map((dest) => (
                <div
                  key={dest.slug}
                  className="p-3 flex items-center justify-between hover:bg-cream/40 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">{dest.name}</p>
                    <p className="text-xs text-foreground/50">{dest.region}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addDestinationToMap(dest)}
                    className="bg-gold text-gold-foreground hover:bg-gold/90 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddDestinationOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 6. REMOVE FROM MAP CONFIRMATION ──────────────────────────── */}
      <AlertDialog
        open={removeTargetSlug !== null}
        onOpenChange={(open) => !open && setRemoveTargetSlug(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Remove destination from map?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-foreground/70">
              This will remove the pin from the Destinations Map. It does{" "}
              <strong>NOT</strong> delete the underlying destination record from your database or CMS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveFromMap}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove from Map
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── 7. RESET CONFIRMATION ────────────────────────────────────── */}
      <AlertDialog open={resetAlertOpen} onOpenChange={setResetAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Reset unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-foreground/70">
              Are you sure you want to revert all map changes back to the last saved state?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
 
