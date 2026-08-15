import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  Filter,
  FolderOpen,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Map as MapIcon,
  MapPin,
  Megaphone,
  MoreVertical,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Calendar,
  Layers,
} from "lucide-react";
import {
  getAdventuresPage,
  saveAdventuresPage,
  type AdventuresPage,
  type AdventuresSignature,
  adventuresDefaults,
  buildAdventureSlug,
} from "@/lib/adventures.functions";
import { adminUploadImage } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/admin/adventures")({
  component: AdminAdventuresDashboard,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

type CompletenessResult = {
  percent: number;
  items: { label: string; done: boolean; weight: number }[];
};

function calculateCompleteness(adv: AdventuresSignature): CompletenessResult {
  const hasImage = Boolean(adv.image?.trim());
  const hasAlt = Boolean(adv.imageAlt?.trim());
  const hasBasic = Boolean(adv.name?.trim() && adv.region?.trim() && adv.nights?.trim());
  const hasDiff = Boolean(adv.difficulty?.trim());
  const hasDesc = Boolean(adv.description?.trim());
  const hasHighlights = Boolean(adv.highlights && adv.highlights.filter(Boolean).length > 0);
  const hasPlanning = Boolean(
    (adv.included && adv.included.filter(Boolean).length > 0) ||
      (adv.notIncluded && adv.notIncluded.filter(Boolean).length > 0),
  );
  const hasCategories = Boolean(
    (adv.experienceTypes && adv.experienceTypes.length > 0) ||
      (adv.travelStyles && adv.travelStyles.length > 0) ||
      (adv.destinations && adv.destinations.length > 0),
  );
  const hasItinerary = Boolean(adv.itinerary && adv.itinerary.length > 0);

  const items = [
    { label: "Hero Image", done: hasImage, weight: 15 },
    { label: "Alt Text", done: hasAlt, weight: 5 },
    { label: "Core Details (Name, Region, Duration)", done: hasBasic, weight: 15 },
    { label: "Difficulty / Pacing", done: hasDiff, weight: 5 },
    { label: "Full Description", done: hasDesc, weight: 15 },
    { label: "Highlights", done: hasHighlights, weight: 15 },
    { label: "Inclusions & Exclusions", done: hasPlanning, weight: 10 },
    { label: "Experience & Travel Styles", done: hasCategories, weight: 10 },
    { label: "Daily Itinerary", done: hasItinerary, weight: 10 },
  ];

  const earned = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0);
  return {
    percent: Math.min(100, Math.round(earned)),
    items,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminAdventuresDashboard() {
  const navigate = useNavigate();
  const fetchFn = useServerFn(getAdventuresPage);
  const saveFn = useServerFn(saveAdventuresPage);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-adventures-page"],
    queryFn: () => fetchFn(),
  });

  const [draft, setDraft] = useState<AdventuresPage>(adventuresDefaults);
  const [saving, setSaving] = useState(false);

  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "unfeatured">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [terrainFilter, setTerrainFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "order" | "name-asc" | "name-desc" | "recent" | "duration-asc" | "duration-desc" | "difficulty"
  >("order");

  // Drag & drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<AdventuresSignature | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Collapsible Page Settings sections
  const [heroOpen, setHeroOpen] = useState(true);
  const [ctaOpen, setCtaOpen] = useState(false);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  // Determine if draft has unsaved changes compared to server data
  const hasUnsavedChanges = useMemo(() => {
    if (!data) return false;
    return JSON.stringify(draft) !== JSON.stringify(data);
  }, [draft, data]);

  // Real data summary statistics
  const totalCount = draft.signatures.length;
  const publishedCount = draft.signatures.filter((s) => (s.status ?? "published") === "published").length;
  const draftCount = draft.signatures.filter((s) => s.status === "draft").length;
  const archivedCount = draft.signatures.filter((s) => s.status === "archived").length;
  const featuredCount = draft.signatures.filter((s) => Boolean(s.featured)).length;

  // Dynamic filter options extracted from existing data
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    draft.signatures.forEach((s) => {
      if (s.region?.trim()) set.add(s.region.trim());
      (s.destinations || []).forEach((d) => {
        if (d?.trim()) set.add(d.trim());
      });
    });
    return Array.from(set).sort();
  }, [draft.signatures]);

  const availableTerrains = useMemo(() => {
    const set = new Set<string>();
    draft.signatures.forEach((s) => {
      if (s.terrain?.trim()) set.add(s.terrain.trim());
    });
    return Array.from(set).sort();
  }, [draft.signatures]);

  // Filtered and sorted adventures list
  const filteredAndSortedSignatures = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = draft.signatures.map((sig, originalIndex) => ({ sig, originalIndex })).filter(({ sig }) => {
      // Status filter
      const sigStatus = sig.status ?? "published";
      if (statusFilter !== "all" && sigStatus !== statusFilter) return false;

      // Featured filter
      if (featuredFilter === "featured" && !sig.featured) return false;
      if (featuredFilter === "unfeatured" && sig.featured) return false;

      // Difficulty filter
      if (difficultyFilter !== "all" && (sig.difficulty || "").toLowerCase() !== difficultyFilter.toLowerCase()) {
        return false;
      }

      // Region filter
      if (regionFilter !== "all") {
        const matchRegion = (sig.region || "").toLowerCase().includes(regionFilter.toLowerCase());
        const matchDest = (sig.destinations || []).some((d) => d.toLowerCase().includes(regionFilter.toLowerCase()));
        if (!matchRegion && !matchDest) return false;
      }

      // Terrain filter
      if (terrainFilter !== "all" && (sig.terrain || "").toLowerCase() !== terrainFilter.toLowerCase()) {
        return false;
      }

      // Search term
      if (q) {
        const haystack = [
          sig.name,
          sig.region,
          sig.terrain,
          sig.description,
          sig.shortDescription,
          ...(sig.destinations || []),
          ...(sig.highlights || []),
          ...(sig.experienceTypes || []),
          ...(sig.travelStyles || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "name-asc") return a.sig.name.localeCompare(b.sig.name);
      if (sortBy === "name-desc") return b.sig.name.localeCompare(a.sig.name);
      if (sortBy === "recent") {
        const dateA = a.sig.updatedAt ? new Date(a.sig.updatedAt).getTime() : 0;
        const dateB = b.sig.updatedAt ? new Date(b.sig.updatedAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === "duration-asc") {
        const nA = parseInt(a.sig.nights || "0", 10);
        const nB = parseInt(b.sig.nights || "0", 10);
        return nA - nB;
      }
      if (sortBy === "duration-desc") {
        const nA = parseInt(a.sig.nights || "0", 10);
        const nB = parseInt(b.sig.nights || "0", 10);
        return nB - nA;
      }
      if (sortBy === "difficulty") {
        return (a.sig.difficulty || "").localeCompare(b.sig.difficulty || "");
      }
      // Default: original display order
      return a.originalIndex - b.originalIndex;
    });

    return filtered;
  }, [
    draft.signatures,
    searchTerm,
    statusFilter,
    featuredFilter,
    difficultyFilter,
    regionFilter,
    terrainFilter,
    sortBy,
  ]);

  const hasActiveFilters = Boolean(
    searchTerm ||
      statusFilter !== "all" ||
      featuredFilter !== "all" ||
      difficultyFilter !== "all" ||
      regionFilter !== "all" ||
      terrainFilter !== "all",
  );

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFeaturedFilter("all");
    setDifficultyFilter("all");
    setRegionFilter("all");
    setTerrainFilter("all");
    setSortBy("order");
  };

  // ── Actions & Persistence ───────────────────────────────────────────────────

  async function saveAll() {
    setSaving(true);
    try {
      await saveFn({
        data: {
          hero: draft.hero,
          cta: draft.cta,
          signatures: draft.signatures,
        },
      });
      toast.success("All changes saved successfully");
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save adventures");
    } finally {
      setSaving(false);
    }
  }

  async function persistSignatures(signatures: AdventuresSignature[], successMsg: string) {
    setSaving(true);
    try {
      await saveFn({
        data: {
          hero: draft.hero,
          cta: draft.cta,
          signatures,
        },
      });
      setDraft((prev) => ({ ...prev, signatures }));
      await refetch();
      toast.success(successMsg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  // 1-Click Toggle Featured
  const handleToggleFeatured = async (targetSlug: string) => {
    const updated = draft.signatures.map((sig) => {
      if (sig.slug === targetSlug) {
        const nextState = !sig.featured;
        return { ...sig, featured: nextState, updatedAt: new Date().toISOString() };
      }
      return sig;
    });
    const target = draft.signatures.find((s) => s.slug === targetSlug);
    const actionLabel = target?.featured ? "Removed from featured" : "Marked as featured";
    await persistSignatures(updated, `"${target?.name || "Adventure"}" ${actionLabel.toLowerCase()}.`);
  };

  // 1-Click Change Status
  const handleChangeStatus = async (targetSlug: string, nextStatus: "published" | "draft" | "archived") => {
    const updated = draft.signatures.map((sig) => {
      if (sig.slug === targetSlug) {
        return { ...sig, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return sig;
    });
    const target = draft.signatures.find((s) => s.slug === targetSlug);
    await persistSignatures(
      updated,
      `Status for "${target?.name || "Adventure"}" changed to ${nextStatus}.`,
    );
  };

  // Duplicate Adventure
  const handleDuplicate = async (targetSlug: string) => {
    const original = draft.signatures.find((s) => s.slug === targetSlug);
    if (!original) return;

    const existingSlugs = new Set(draft.signatures.map((s) => s.slug));
    const newName = `${original.name} (Copy)`;
    const newSlug = buildAdventureSlug(newName, existingSlugs);

    const duplicate: AdventuresSignature = {
      ...original,
      name: newName,
      slug: newSlug,
      status: "draft",
      featured: false,
      updatedAt: new Date().toISOString(),
      highlights: Array.isArray(original.highlights) ? [...original.highlights] : [],
      included: Array.isArray(original.included) ? [...original.included] : [],
      notIncluded: Array.isArray(original.notIncluded) ? [...original.notIncluded] : [],
      experienceTypes: Array.isArray(original.experienceTypes) ? [...original.experienceTypes] : [],
      travelStyles: Array.isArray(original.travelStyles) ? [...original.travelStyles] : [],
      bestFor: Array.isArray(original.bestFor) ? [...original.bestFor] : [],
      bestMonths: Array.isArray(original.bestMonths) ? [...original.bestMonths] : [],
      destinations: Array.isArray(original.destinations) ? [...original.destinations] : [],
      lodges: Array.isArray(original.lodges) ? [...original.lodges] : [],
      itinerary: Array.isArray(original.itinerary) ? original.itinerary.map((it) => ({ ...it })) : [],
      relatedAdventures: Array.isArray(original.relatedAdventures) ? [...original.relatedAdventures] : [],
      relatedDestinations: Array.isArray(original.relatedDestinations) ? [...original.relatedDestinations] : [],
    };

    const updated = [...draft.signatures, duplicate];
    await persistSignatures(updated, `Duplicated "${original.name}". Saved as draft.`);
  };

  // Reorder Adventures
  const moveTo = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= draft.signatures.length) return;
    const copy = [...draft.signatures];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    await persistSignatures(copy, "Display order updated.");
  };

  // Delete Adventure
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const remaining = draft.signatures.filter((s) => s.slug !== deleteTarget.slug);
      await persistSignatures(remaining, `"${deleteTarget.name}" permanently deleted.`);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete adventure");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-foreground/60">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
        <span className="text-sm font-medium">Loading adventures dashboard…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── 1. REDESIGNED PAGE HEADER ────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title & Summary statistics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.28em] uppercase font-semibold text-gold">
                MANAGEMENT DASHBOARD
              </span>
              <span className="text-foreground/30">•</span>
              <span className="text-[11px] text-foreground/55">/adventures</span>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
              Manage Adventures
            </h1>

            {/* Summary statistics row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-cream border border-border px-3.5 py-1 font-medium text-foreground">
                <Compass className="w-3.5 h-3.5 text-gold" />
                <span>{totalCount} {totalCount === 1 ? "Adventure" : "Adventures"}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 border border-forest/20 px-3.5 py-1 font-medium text-forest">
                <span className="h-2 w-2 rounded-full bg-forest" />
                <span>{publishedCount} Published</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 font-medium text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>{draftCount} Drafts</span>
              </div>

              {archivedCount > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3.5 py-1 font-medium text-foreground/60">
                  <span className="h-2 w-2 rounded-full bg-foreground/40" />
                  <span>{archivedCount} Archived</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-3.5 py-1 font-medium text-gold">
                <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                <span>{featuredCount} Featured</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* Unsaved changes indicator & save button */}
            {hasUnsavedChanges ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Unsaved changes
                </span>
                <Button
                  onClick={saveAll}
                  disabled={saving}
                  className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  Save changes
                </Button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-forest font-medium mr-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All changes saved
              </span>
            )}

            <Button
              variant="outline"
              asChild
              className="border-border text-foreground hover:bg-cream"
            >
              <a href="/adventures" target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-foreground/60" />
                Preview Page
              </a>
            </Button>

            <Button
              onClick={() => navigate({ to: "/admin/adventures/$slug", params: { slug: "new" } })}
              className="bg-forest text-forest-foreground hover:bg-forest/90 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Adventure
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. SEARCH, FILTER AND SORT TOOLBAR ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background p-5 shadow-sm space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
          {/* Search bar */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="w-4 h-4 text-foreground/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search adventures by name, region, tags…"
              className="pl-9 pr-8 text-xs h-10 bg-cream/40 border-border"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-10 rounded-md border border-border bg-cream/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published ({publishedCount})</option>
              <option value="draft">Drafts ({draftCount})</option>
              <option value="archived">Archived ({archivedCount})</option>
            </select>
          </div>

          {/* Featured filter */}
          <div className="lg:col-span-2">
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as any)}
              className="w-full h-10 rounded-md border border-border bg-cream/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="all">All Featured States</option>
              <option value="featured">★ Featured Only ({featuredCount})</option>
              <option value="unfeatured">Not Featured ({totalCount - featuredCount})</option>
            </select>
          </div>

          {/* Difficulty filter */}
          <div className="lg:col-span-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-cream/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy / Relaxed</option>
              <option value="Moderate">Moderate / Balanced</option>
              <option value="Active">Active</option>
              <option value="Challenging">Challenging</option>
            </select>
          </div>

          {/* Sort selection */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-10 rounded-md border border-border bg-cream/40 px-3 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="order">Display Order (Drag)</option>
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="recent">Recently Updated</option>
              <option value="duration-asc">Duration (Shortest)</option>
              <option value="duration-desc">Duration (Longest)</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters row (Region & Terrain) + Results summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {availableRegions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-foreground/55 font-medium">Region:</span>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="all">All Regions</option>
                  {availableRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {availableTerrains.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-foreground/55 font-medium">Terrain:</span>
                <select
                  value={terrainFilter}
                  onChange={(e) => setTerrainFilter(e.target.value)}
                  className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="all">All Terrains</option>
                  {availableTerrains.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs text-terracotta hover:underline font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Reset filters
              </button>
            )}
          </div>

          <div className="text-foreground/60 font-medium">
            Showing {filteredAndSortedSignatures.length} of {totalCount} adventures
            {sortBy === "order" && !hasActiveFilters && (
              <span className="ml-2 text-gold font-sans font-normal">(Drag cards or use arrows to reorder)</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. ADVENTURE CARDS GRID / LIST ─────────────────────────────────────── */}
      {filteredAndSortedSignatures.length === 0 ? (
        // ── 12. EMPTY STATE
        <div className="rounded-xl border border-dashed border-border bg-background p-12 md:p-16 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="h-14 w-14 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7" />
          </div>
          {totalCount === 0 ? (
            <>
              <h2 className="font-serif text-2xl text-foreground">Your adventure collection is empty</h2>
              <p className="text-sm text-foreground/65 max-w-md mx-auto leading-relaxed">
                Create your first signature adventure and start building your collection.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => navigate({ to: "/admin/adventures/$slug", params: { slug: "new" } })}
                  className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Create your first adventure
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl text-foreground">No matching adventures found</h2>
              <p className="text-sm text-foreground/65 max-w-md mx-auto leading-relaxed">
                We couldn't find any adventures matching your current search terms or filter criteria.
              </p>
              <div className="pt-2">
                <Button variant="outline" onClick={clearAllFilters}>
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Clear Filters
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {filteredAndSortedSignatures.map(({ sig: item, originalIndex: idx }) => {
            const completeness = calculateCompleteness(item);
            const isDraggable = sortBy === "order" && !hasActiveFilters;
            const isFirst = idx === 0;
            const isLast = idx === draft.signatures.length - 1;
            const status = item.status ?? "published";
            const missingImage = !item.image?.trim();
            const missingAlt = Boolean(item.image?.trim() && !item.imageAlt?.trim());

            return (
              <article
                key={`${item.slug}-${idx}`}
                draggable={isDraggable}
                onDragStart={() => isDraggable && setDragIdx(idx)}
                onDragOver={(e) => {
                  if (isDraggable) e.preventDefault();
                }}
                onDrop={() => {
                  if (isDraggable && dragIdx !== null) {
                    moveTo(dragIdx, idx);
                    setDragIdx(null);
                  }
                }}
                className={`group relative rounded-xl border bg-background overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${
                  dragIdx === idx ? "opacity-40 border-gold border-dashed" : "border-border"
                }`}
              >
                {/* ── Card Image & Header Badges ── */}
                <div className="relative aspect-[16/10] bg-cream overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.imageAlt || item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ objectPosition: `${item.focalX ?? 50}% ${item.focalY ?? 50}%` }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-foreground/35 bg-cream/70">
                      <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
                      <span className="text-xs font-medium uppercase tracking-wider">No image set</span>
                    </div>
                  )}

                  {/* Gradient shadow overlay for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

                  {/* Top-Left: Display order index & Drag Handle */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
                    <span className="bg-black/70 backdrop-blur text-cream px-2.5 py-1 rounded-md text-[11px] font-mono font-medium shadow-sm">
                      #{idx + 1}
                    </span>
                    {isDraggable && (
                      <span
                        className="cursor-grab active:cursor-grabbing bg-black/70 backdrop-blur text-cream p-1.5 rounded-md hover:bg-black/90 transition-colors shadow-sm"
                        title="Drag card to reorder display position"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Top-Right: Status badge, Featured star, and Quick Menu */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
                    {/* Featured star toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(item.slug)}
                      title={item.featured ? "Featured Adventure (Click to unfeature)" : "Click to feature this adventure"}
                      className={`p-1.5 rounded-md backdrop-blur transition-all shadow-sm ${
                        item.featured
                          ? "bg-gold text-gold-foreground hover:bg-gold/90 ring-1 ring-gold"
                          : "bg-black/60 text-white/70 hover:text-white hover:bg-black/80"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.featured ? "fill-current" : ""}`} />
                    </button>

                    {/* Status badge */}
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] tracking-[0.18em] uppercase font-semibold backdrop-blur shadow-sm ${
                        status === "published"
                          ? "bg-forest text-forest-foreground"
                          : status === "draft"
                            ? "bg-amber-600 text-white"
                            : "bg-slate-700 text-white"
                      }`}
                    >
                      {status}
                    </span>

                    {/* Three-Dot Actions Dropdown */}
                    <AdventureCardDropdown
                      adventure={item}
                      onEdit={() => navigate({ to: "/admin/adventures/$slug", params: { slug: item.slug } })}
                      onDuplicate={() => handleDuplicate(item.slug)}
                      onToggleFeatured={() => handleToggleFeatured(item.slug)}
                      onChangeStatus={(s) => handleChangeStatus(item.slug, s)}
                      onMoveUp={() => moveTo(idx, idx - 1)}
                      onMoveDown={() => moveTo(idx, idx + 1)}
                      canMoveUp={!isFirst}
                      canMoveDown={!isLast}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  </div>

                  {/* Bottom Image Warnings */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1.5 z-10">
                    {missingImage && (
                      <span className="inline-flex items-center gap-1 bg-rose-900/90 text-rose-100 backdrop-blur px-2.5 py-0.5 rounded text-[10px] font-medium border border-rose-400/30">
                        <AlertTriangle className="w-3 h-3 text-rose-300" /> Missing image
                      </span>
                    )}
                    {missingAlt && (
                      <span className="inline-flex items-center gap-1 bg-amber-900/90 text-amber-100 backdrop-blur px-2.5 py-0.5 rounded text-[10px] font-medium border border-amber-400/30">
                        <AlertTriangle className="w-3 h-3 text-amber-300" /> Alt text missing
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Card Body & Metadata ── */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Title */}
                    <h3 className="font-serif text-xl md:text-2xl text-foreground leading-snug group-hover:text-gold transition-colors">
                      <Link to="/admin/adventures/$slug" params={{ slug: item.slug }}>
                        {item.name || "Untitled Adventure"}
                      </Link>
                    </h3>

                    {/* Metadata line: Region · Nights · Difficulty · Terrain */}
                    <p className="text-xs text-foreground/65 mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-foreground/80">{item.region || "Kenya"}</span>
                      {item.nights && (
                        <>
                          <span>·</span>
                          <span>{item.nights}</span>
                        </>
                      )}
                      {item.difficulty && (
                        <>
                          <span>·</span>
                          <span className="text-gold font-medium">{item.difficulty}</span>
                        </>
                      )}
                      {item.terrain && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[150px]">{item.terrain}</span>
                        </>
                      )}
                    </p>

                    {/* Emotional tagline or short description */}
                    {(item.shortDescription || item.description) && (
                      <p className="text-xs text-foreground/75 mt-2.5 line-clamp-2 leading-relaxed font-sans">
                        {item.shortDescription || item.description}
                      </p>
                    )}

                    {/* Badges / Experience & Travel Styles */}
                    {((item.experienceTypes && item.experienceTypes.length > 0) ||
                      (item.travelStyles && item.travelStyles.length > 0)) && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {[...(item.experienceTypes || []), ...(item.travelStyles || [])].slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] tracking-[0.15em] uppercase text-foreground/65 bg-cream px-2 py-0.5 rounded border border-border/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Content Completeness Bar ── */}
                  <div className="pt-3 border-t border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground/60 uppercase tracking-wider font-medium">
                        Content completeness
                      </span>
                      <span
                        className={`font-semibold font-mono ${
                          completeness.percent >= 90
                            ? "text-forest"
                            : completeness.percent >= 60
                              ? "text-gold"
                              : "text-amber-700"
                        }`}
                      >
                        {completeness.percent}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          completeness.percent >= 90
                            ? "bg-forest"
                            : completeness.percent >= 60
                              ? "bg-gold"
                              : "bg-amber-600"
                        }`}
                        style={{ width: `${completeness.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* ── Card Footer Actions ── */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs border-border hover:bg-cream"
                        onClick={() => navigate({ to: "/admin/adventures/$slug", params: { slug: item.slug } })}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1 text-gold" /> Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8 px-3 text-xs border-border hover:bg-cream"
                      >
                        <a href={`/adventures/${item.slug}`} target="_blank" rel="noreferrer">
                          <Eye className="w-3.5 h-3.5 mr-1 text-foreground/60" /> Preview
                        </a>
                      </Button>
                    </div>

                    {/* Up / Down reordering controls for accessibility */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveTo(idx, idx - 1)}
                        disabled={isFirst}
                        className="text-foreground/45 hover:text-foreground p-1.5 rounded hover:bg-cream disabled:opacity-20 disabled:hover:bg-transparent"
                        aria-label="Move up"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTo(idx, idx + 1)}
                        disabled={isLast}
                        className="text-foreground/45 hover:text-foreground p-1.5 rounded hover:bg-cream disabled:opacity-20 disabled:hover:bg-transparent"
                        aria-label="Move down"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── 10. PAGE SETTINGS (Collapsible below adventure management) ───────── */}
      <section className="mt-12 rounded-xl border border-border bg-background overflow-hidden shadow-sm">
        <header className="px-6 py-5 border-b border-border bg-cream/50 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-gold">
                CONFIGURATION
              </span>
            </div>
            <h2 className="font-serif text-2xl text-foreground leading-tight mt-0.5">Page Settings</h2>
            <p className="text-xs text-foreground/60 mt-0.5">
              Customize the hero media, header text, and closing call-to-action for the public /adventures page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const anyClosed = !heroOpen || !ctaOpen;
                setHeroOpen(anyClosed);
                setCtaOpen(anyClosed);
              }}
              className="text-xs"
            >
              {!heroOpen || !ctaOpen ? "Expand All" : "Collapse All"}
            </Button>
            {hasUnsavedChanges && (
              <Button
                size="sm"
                onClick={saveAll}
                disabled={saving}
                className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm text-xs"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save Page Settings
              </Button>
            )}
          </div>
        </header>

        <div className="divide-y divide-border">
          {/* Hero Settings Accordion */}
          <div className="bg-background">
            <button
              type="button"
              onClick={() => setHeroOpen((o) => !o)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-cream/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-gold/10 text-gold flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-foreground leading-none">Hero Section & Copy</h3>
                  <p className="text-xs text-foreground/55 mt-1">
                    Background banner, focal point, and main headline shown at the top of /adventures.
                  </p>
                </div>
              </div>
              <span className="text-foreground/50">
                {heroOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {heroOpen && (
              <div className="p-6 border-t border-border/50 bg-cream/10 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                      Hero background image
                    </Label>
                    <ManagedImageUpload
                      value={draft.hero.image}
                      onChange={(url) => setDraft({ ...draft, hero: { ...draft.hero, image: url } })}
                      recommendedRatio="16:9 or wider"
                      altText={draft.hero.imageAlt}
                      focalX={draft.hero.focalX ?? 50}
                      focalY={draft.hero.focalY ?? 50}
                      onFocalChange={(focalX, focalY) =>
                        setDraft({ ...draft, hero: { ...draft.hero, focalX, focalY } })
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                        Hero image alt text
                      </Label>
                      <Input
                        value={draft.hero.imageAlt ?? ""}
                        placeholder="Describe the hero image for screen readers…"
                        onChange={(e) =>
                          setDraft({ ...draft, hero: { ...draft.hero, imageAlt: e.target.value } })
                        }
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                        Eyebrow
                      </Label>
                      <Input
                        value={draft.hero.eyebrow}
                        onChange={(e) =>
                          setDraft({ ...draft, hero: { ...draft.hero, eyebrow: e.target.value } })
                        }
                        placeholder="e.g. Adventures"
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                        Headline
                      </Label>
                      <Textarea
                        rows={2}
                        value={draft.hero.headline}
                        onChange={(e) =>
                          setDraft({ ...draft, hero: { ...draft.hero, headline: e.target.value } })
                        }
                        placeholder="e.g. EXPERIENCE KENYA BEYOND THE ORDINARY."
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                        Subhead
                      </Label>
                      <Textarea
                        rows={3}
                        value={draft.hero.subhead}
                        onChange={(e) =>
                          setDraft({ ...draft, hero: { ...draft.hero, subhead: e.target.value } })
                        }
                        placeholder="Journeys designed around your pace, your curiosity…"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Closing CTA Settings Accordion */}
          <div className="bg-background">
            <button
              type="button"
              onClick={() => setCtaOpen((o) => !o)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-cream/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-gold/10 text-gold flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-foreground leading-none">Closing Call-To-Action (CTA)</h3>
                  <p className="text-xs text-foreground/55 mt-1">
                    The final invitation and contact button at the bottom of the /adventures page.
                  </p>
                </div>
              </div>
              <span className="text-foreground/50">
                {ctaOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {ctaOpen && (
              <div className="p-6 border-t border-border/50 bg-cream/10">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                      Eyebrow
                    </Label>
                    <Input
                      value={draft.cta.eyebrow}
                      onChange={(e) => setDraft({ ...draft, cta: { ...draft.cta, eyebrow: e.target.value } })}
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                      Button label
                    </Label>
                    <Input
                      value={draft.cta.buttonLabel}
                      onChange={(e) =>
                        setDraft({ ...draft, cta: { ...draft.cta, buttonLabel: e.target.value } })
                      }
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                      Headline
                    </Label>
                    <Input
                      value={draft.cta.headline}
                      onChange={(e) =>
                        setDraft({ ...draft, cta: { ...draft.cta, headline: e.target.value } })
                      }
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                      Body Copy
                    </Label>
                    <Textarea
                      rows={3}
                      value={draft.cta.body}
                      onChange={(e) => setDraft({ ...draft, cta: { ...draft.cta, body: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 11. STICKY SAVE FOOTER ────────────────────────────────────────────── */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-0 -mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10 py-3.5 bg-background/95 backdrop-blur border-t border-border flex items-center justify-between shadow-lg z-30">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved changes</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (data) setDraft(data);
              }}
              disabled={saving}
              className="text-xs"
            >
              Discard changes
            </Button>
            <Button
              size="sm"
              onClick={saveAll}
              disabled={saving}
              className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm text-xs"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save changes
            </Button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete adventure?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to permanently remove{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.name || "this adventure"}"</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete Adventure"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Dropdown Actions Menu Component ──────────────────────────────────────────

function AdventureCardDropdown({
  adventure,
  onEdit,
  onDuplicate,
  onToggleFeatured,
  onChangeStatus,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDelete,
}: {
  adventure: AdventuresSignature;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleFeatured: () => void;
  onChangeStatus: (status: "published" | "draft" | "archived") => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDelete: () => void;
}) {
  const currentStatus = adventure.status ?? "published";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open adventure actions menu"
          className="p-1.5 rounded-md bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur transition-colors shadow-sm"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 text-xs">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="w-3.5 h-3.5 mr-2 text-gold" />
          <span>Edit Adventure</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={`/adventures/${adventure.slug}`} target="_blank" rel="noreferrer">
            <Eye className="w-3.5 h-3.5 mr-2 text-foreground/60" />
            <span>Preview Page</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
          <Copy className="w-3.5 h-3.5 mr-2 text-foreground/60" />
          <span>Duplicate</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onToggleFeatured} className="cursor-pointer">
          <Star className={`w-3.5 h-3.5 mr-2 ${adventure.featured ? "fill-gold text-gold" : "text-foreground/60"}`} />
          <span>{adventure.featured ? "Unmark Featured" : "Mark as Featured"}</span>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-foreground/60" />
            <span>Change Status</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-36 text-xs">
            <DropdownMenuItem
              onClick={() => onChangeStatus("published")}
              className={`cursor-pointer ${currentStatus === "published" ? "font-semibold text-forest" : ""}`}
            >
              <span className="h-2 w-2 rounded-full bg-forest mr-2" />
              <span>Published</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onChangeStatus("draft")}
              className={`cursor-pointer ${currentStatus === "draft" ? "font-semibold text-amber-600" : ""}`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
              <span>Draft</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onChangeStatus("archived")}
              className={`cursor-pointer ${currentStatus === "archived" ? "font-semibold text-foreground/60" : ""}`}
            >
              <span className="h-2 w-2 rounded-full bg-slate-400 mr-2" />
              <span>Archived</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onMoveUp} disabled={!canMoveUp} className="cursor-pointer">
          <ArrowUp className="w-3.5 h-3.5 mr-2 text-foreground/60" />
          <span>Move Up</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onMoveDown} disabled={!canMoveDown} className="cursor-pointer">
          <ArrowDown className="w-3.5 h-3.5 mr-2 text-foreground/60" />
          <span>Move Down</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive focus:text-destructive">
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── ManagedImageUpload ────────────────────────────────────────────────────────

function ManagedImageUpload({
  value,
  onChange,
  recommendedRatio,
  altText,
  focalX = 50,
  focalY = 50,
  onFocalChange,
}: {
  value: string;
  onChange: (url: string) => void;
  recommendedRatio: string;
  altText?: string;
  focalX?: number;
  focalY?: number;
  onFocalChange?: (x: number, y: number) => void;
}) {
  const upload = useServerFn(adminUploadImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const altComplete = Boolean(altText?.trim());

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif|avif)/i.test(file.type)) {
      toast.error("Choose a PNG, JPG, WEBP, GIF, or AVIF image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be smaller than 8MB");
      return;
    }
    setBusy(true);
    setFileMeta({ name: file.name, size: file.size });
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
      const res = await upload({
        data: {
          filename: file.name,
          contentType: file.type || "image/jpeg",
          base64: btoa(binary),
        },
      });
      onChange(res.url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {/* Requirements bar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-foreground/55">Recommended: {recommendedRatio}</p>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
            altComplete ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"
          }`}
        >
          {altComplete ? "Alt text ✓" : "Alt text needed"}
        </span>
      </div>

      {value ? (
        <div className="border border-border bg-background rounded-lg overflow-hidden">
          <div className="bg-muted">
            <img src={value} alt="" className="mx-auto max-h-48 w-full object-contain" />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/30 p-3">
            <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Replace
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setLibraryOpen(true)} disabled={busy}>
              <FolderOpen className="w-3.5 h-3.5 mr-1" /> Library
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setFileMeta(null);
                onChange("");
              }}
              className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
            <span className="ml-auto max-w-[55%] truncate text-[11px] text-foreground/50" title={value}>
              {fileMeta ? `${fileMeta.name} – ${humanSize(fileMeta.size)}` : value.split("/").pop()}
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          disabled={busy}
          className={`flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg px-6 py-8 text-center transition-colors ${
            drag ? "border-gold bg-gold/5" : "border-border bg-muted/30 hover:border-gold hover:bg-gold/5"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground/70">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">Drop an image here or click to upload</p>
            <p className="mt-1 text-[11px] text-foreground/50">PNG, JPG, WEBP, GIF, AVIF – up to 8MB</p>
          </div>
        </button>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => setLibraryOpen(true)} className="w-full">
        <FolderOpen className="w-3.5 h-3.5 mr-1" /> Choose from media library
      </Button>

      <Input
        value={value ?? ""}
        onChange={(e) => {
          setFileMeta(null);
          onChange(e.target.value);
        }}
        placeholder="…or paste an image URL"
        className="text-xs"
      />

      {value && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-medium text-foreground/60 tracking-[0.15em] uppercase">Focal point</p>
          <FocalSlider label="Horizontal" value={focalX} onChange={(next) => onFocalChange?.(next, focalY)} />
          <FocalSlider label="Vertical" value={focalY} onChange={(next) => onFocalChange?.(focalX, next)} />
        </div>
      )}

      <MediaLibraryPicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(urls) => {
          const [url] = urls;
          if (!url) return;
          setFileMeta(null);
          onChange(url);
        }}
      />
    </div>
  );
}

// ─── FocalSlider ──────────────────────────────────────────────────────────────

function FocalSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-foreground/75">{label}</p>
        <span className="text-[11px] tabular-nums text-foreground/50">{Math.round(value)}%</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={1} onValueChange={([next]) => onChange(next ?? value)} />
    </div>
  );
}
