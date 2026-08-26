import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Globe,
  Hash,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Save,
  Trash2,
  Sparkles,
  Compass,
  Check,
  Move,
  RotateCcw,
} from "lucide-react";
import kenyaMapAsset from "@/assets/kenya-destinations-map.webp";
import { adminGet, adminUpsert, adminDelete } from "@/lib/admin.functions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { BEST_FOR_CATEGORIES, KENYA_REGIONS, KENYA_DESTINATIONS_DATA } from "@/lib/destinations.data";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Route = createFileRoute("/_authenticated/admin/destinations/$id")({
  component: AdminDestinationEdit,
});

type DestinationRecord = {
  id: string;
  name: string;
  country: string;
  region: string;
  slug: string;
  best_season: string | null;
  description: string;
  short_description?: string | null;
  destination_category?: string | null;
  best_for?: string[] | null;
  best_months?: string[] | null;
  also_good_months?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  featured?: boolean | null;
  related_destinations?: string[] | null;
  image: string;
  featured_trips: string[];
  sort_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
};

const BLANK_DESTINATION: DestinationRecord = {
  id: "",
  name: "",
  country: "Kenya",
  region: "Southern Kenya",
  slug: "",
  best_season: "Jul – Oct",
  description: "",
  short_description: "",
  destination_category: "The Icons",
  best_for: ["Wildlife", "Photography"],
  best_months: ["Jul", "Aug", "Sep", "Oct"],
  also_good_months: ["Jan", "Feb"],
  latitude: -1.4061,
  longitude: 35.139,
  featured: false,
  related_destinations: [],
  image: "",
  featured_trips: [],
  sort_order: 0,
  published: true,
};

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function AdminDestinationEdit() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getFn = useServerFn(adminGet);
  const upsertFn = useServerFn(adminUpsert);
  const deleteFn = useServerFn(adminDelete);

  const [form, setForm] = useState<DestinationRecord>(BLANK_DESTINATION);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: destination,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-destination", id],
    queryFn: async () => {
      if (isNew) return null;
      try {
        const res = await getFn({ data: { table: "destinations", id } });
        if (res) return res as unknown as DestinationRecord | null;
      } catch {
        // Fall through to check static defaults
      }

      // Check static defaults if not yet in database
      const fallback = KENYA_DESTINATIONS_DATA.find((d) => d.slug === id || d.name.toLowerCase() === id.toLowerCase());
      if (fallback) {
        return {
          id: "",
          name: fallback.name,
          country: fallback.country || "Kenya",
          region: fallback.region || "Southern Kenya",
          slug: fallback.slug,
          best_season: fallback.bestSeason || "Jul – Oct",
          description: fallback.fullDescriptionFallback || fallback.shortDescription || "",
          short_description: fallback.shortDescription || "",
          destination_category: fallback.destinationCategory || "The Icons",
          best_for: fallback.bestFor || ["Wildlife"],
          best_months: fallback.bestMonths || ["Jul", "Aug", "Sep", "Oct"],
          also_good_months: fallback.alsoGoodMonths || ["Jan", "Feb"],
          latitude: fallback.latitude ?? -1.4061,
          longitude: fallback.longitude ?? 35.139,
          featured: fallback.featured ?? false,
          related_destinations: fallback.relatedDestinations || [],
          image: fallback.fallbackImage || "",
          featured_trips: [],
          sort_order: 0,
          published: true,
        } as DestinationRecord;
      }

      return null;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (destination) {
      setForm({
        id: destination.id,
        name: destination.name ?? "",
        country: destination.country ?? "Kenya",
        region: destination.region ?? "Southern Kenya",
        slug: destination.slug ?? "",
        best_season: destination.best_season ?? "",
        description: destination.description ?? "",
        short_description: destination.short_description ?? "",
        destination_category: destination.destination_category ?? "The Icons",
        best_for: Array.isArray(destination.best_for)
          ? destination.best_for
          : typeof destination.best_for === "string"
            ? (destination.best_for as string).split(",").map((s) => s.trim())
            : [],
        best_months: Array.isArray(destination.best_months) ? destination.best_months : [],
        also_good_months: Array.isArray(destination.also_good_months) ? destination.also_good_months : [],
        latitude: destination.latitude ?? null,
        longitude: destination.longitude ?? null,
        featured: destination.featured ?? false,
        related_destinations: Array.isArray(destination.related_destinations) ? destination.related_destinations : [],
        image: destination.image ?? "",
        featured_trips: Array.isArray(destination.featured_trips)
          ? destination.featured_trips
          : typeof destination.featured_trips === "string"
            ? (destination.featured_trips as string).split("\n").filter(Boolean)
            : [],
        sort_order: destination.sort_order ?? 0,
        published: destination.published ?? true,
        created_at: destination.created_at,
        updated_at: destination.updated_at,
      });
    }
  }, [destination]);

  const mUpsert = useMutation({
    mutationFn: (row: DestinationRecord) => upsertFn({ data: { table: "destinations", row } }),
    onSuccess: async (saved: any) => {
      toast.success(`"${saved.name || "Destination"}" saved successfully.`);
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      queryClient.invalidateQueries({ queryKey: ["destination", form.slug] });
      if (isNew && saved?.id) {
        navigate({ to: "/admin/destinations/$id", params: { id: saved.id }, replace: true });
      } else {
        await refetch();
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save destination"),
  });

  function patch<K extends keyof DestinationRecord>(key: K, value: DestinationRecord[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBestFor(tag: string) {
    const cur = form.best_for || [];
    const next = cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag];
    patch("best_for", next);
  }

  function toggleBestMonth(month: string) {
    const cur = form.best_months || [];
    const next = cur.includes(month) ? cur.filter((m) => m !== month) : [...cur, month];
    patch("best_months", next);
  }

  function toggleAlsoGoodMonth(month: string) {
    const cur = form.also_good_months || [];
    const next = cur.includes(month) ? cur.filter((m) => m !== month) : [...cur, month];
    patch("also_good_months", next);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Destination name is required.");
      return;
    }
    const rowToSave: any = { ...form };
    if (!rowToSave.slug.trim()) {
      rowToSave.slug = slugify(rowToSave.name);
    }
    mUpsert.mutate(rowToSave);
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteFn({ data: { table: "destinations", id } });
      toast.success("Destination deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      navigate({ to: "/admin/content/$table", params: { table: "destinations" } });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not delete destination");
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center gap-2 py-20 justify-center text-foreground/60">
        <Loader2 className="w-5 h-5 animate-spin text-gold" /> Loading destination details…
      </div>
    );
  }

  if (!isNew && (isError || !destination)) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12">
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/admin/content/$table", params: { table: "destinations" } })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Destinations
        </Button>
        <div className="rounded-lg border border-border bg-background p-8 text-center space-y-3">
          <h2 className="font-serif text-2xl">Destination not found</h2>
          <p className="text-sm text-foreground/60">
            {(error as any)?.message ?? "The requested destination could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-12">
      {/* ── Top Bar Header ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-5 md:p-6 shadow-sm">
        <div className="space-y-1">
          <Link
            to="/admin/content/$table"
            params={{ table: "destinations" }}
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-gold transition-colors font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Destinations
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-foreground">{isNew ? "New Destination" : "Edit Destination"}</h1>
            {!isNew && (
              <Badge
                variant={form.published ? "default" : "secondary"}
                className={form.published ? "bg-forest text-forest-foreground" : ""}
              >
                {form.published ? "Active" : "Draft"}
              </Badge>
            )}
          </div>
          {!isNew && form.slug && (
            <div className="flex items-center gap-2 text-xs text-foreground/60 pt-1">
              <span className="font-medium text-foreground/75">Permalink:</span>
              <code className="bg-cream px-1.5 py-0.5 rounded text-foreground/80 font-mono text-[11px]">
                /destinations/{form.slug}
              </code>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/admin/content/$table", params: { table: "destinations" } })}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mUpsert.isPending}
            className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm"
          >
            {mUpsert.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> {isNew ? "Create Destination" : "Update Destination"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Two-Column Layout ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ── Main Content Area (Left: 7/12 or 8/12) ─────────────────────────── */}
        <div className="space-y-6 min-w-0 lg:col-span-7 xl:col-span-8">
          {/* Destination Title / Name & Short Description */}
          <div className="rounded-lg border border-border bg-background p-6 shadow-sm space-y-4">
            <div>
              <Label className="mb-2 block text-[11px] tracking-[0.2em] uppercase text-foreground/60 font-semibold">
                Destination Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name: newName,
                    slug: prev.slug === slugify(prev.name) ? slugify(newName) : prev.slug,
                  }));
                }}
                placeholder="e.g. Maasai Mara"
                className="font-serif text-xl md:text-2xl h-12"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60 font-semibold">
                Short Editorial Description (1–2 sentences for index cards)
              </Label>
              <Textarea
                rows={2}
                value={form.short_description ?? ""}
                onChange={(e) => patch("short_description", e.target.value)}
                placeholder="e.g. World-renowned savannah teeming with apex predators, vast migratory herds, and authentic Maasai conservancies."
                className="text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* "Best For" Experience Categories */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <h2 className="font-serif text-lg leading-none">"Best For" Tags & Travel Styles</h2>
              </div>
              <span className="text-xs text-foreground/55">Used in dynamic category filtering</span>
            </header>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2.5">
                {BEST_FOR_CATEGORIES.map((cat) => {
                  const isChecked = (form.best_for || []).includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleBestFor(cat.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                        isChecked
                          ? "bg-forest text-cream ring-2 ring-forest ring-offset-2 ring-offset-background"
                          : "bg-cream/60 text-foreground/75 border border-border hover:border-gold"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 text-gold" />}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Seasonality & Monthly Guide */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-gold" />
              <h2 className="font-serif text-lg leading-none">Best Time to Visit & Seasonal Calendar</h2>
            </header>
            <div className="p-6 space-y-4">
              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  Best Season Summary String
                </Label>
                <Input
                  value={form.best_season ?? ""}
                  onChange={(e) => patch("best_season", e.target.value)}
                  placeholder="e.g. Jul – Oct (Great Migration & Peak Wildlife)"
                />
              </div>

              {/* Peak Months */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <Label className="block text-[11px] tracking-[0.2em] uppercase text-forest font-semibold">
                  Peak / Best Months
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_MONTHS.map((m) => {
                    const active = (form.best_months || []).includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleBestMonth(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors ${
                          active
                            ? "bg-forest text-cream"
                            : "bg-cream text-foreground/60 border border-border hover:border-forest"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Also Good Months */}
              <div className="space-y-2 pt-2">
                <Label className="block text-[11px] tracking-[0.2em] uppercase text-gold font-semibold">
                  Also Good Months
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_MONTHS.map((m) => {
                    const active = (form.also_good_months || []).includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleAlsoGoodMonth(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors ${
                          active
                            ? "bg-gold text-gold-foreground"
                            : "bg-cream text-foreground/60 border border-border hover:border-gold"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Description (Rich Text) */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <h2 className="font-serif text-lg leading-none">Full Description & Story</h2>
              </div>
            </header>
            <div className="p-6">
              <RichTextEditor
                value={form.description}
                onChange={(html) => patch("description", html)}
                autosaveKey={`cms:dest:${id}:desc`}
                placeholder="Describe this destination, its landscapes, wildlife, and safari experience…"
              />
            </div>
          </section>
        </div>

        {/* ── Sidebar Area (Right: 5/12 or 4/12) ──────────────────────────── */}
        <aside className="space-y-6 min-w-0 lg:col-span-5 xl:col-span-4">
          {/* Publish / Status Box */}
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-5 py-3.5 border-b border-border bg-cream/50 flex items-center justify-between">
              <h3 className="font-serif text-base">Publish</h3>
              <Badge
                variant={form.published ? "default" : "secondary"}
                className={form.published ? "bg-forest text-forest-foreground" : ""}
              >
                {form.published ? "Published" : "Draft"}
              </Badge>
            </header>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/60 uppercase tracking-wider">Status</span>
                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                  <Checkbox checked={form.published} onCheckedChange={(v) => patch("published", !!v)} id="published" />
                  <span>Active / Published</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs text-foreground/60 uppercase tracking-wider">Iconic / Featured</span>
                <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                  <Checkbox checked={!!form.featured} onCheckedChange={(v) => patch("featured", !!v)} id="featured" />
                  <span>Highlight on Index</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs text-foreground/60 uppercase tracking-wider">Sort Order</span>
                <div className="relative w-24">
                  <Hash className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => patch("sort_order", Number(e.target.value))}
                    className="pl-8 text-right h-8 text-xs"
                  />
                </div>
              </div>

              {form.created_at && (
                <div className="pt-2 border-t border-border/60 text-[11px] text-foreground/50 space-y-1">
                  <div>Created: {new Date(form.created_at).toLocaleDateString()}</div>
                  {form.updated_at && <div>Updated: {new Date(form.updated_at).toLocaleDateString()}</div>}
                </div>
              )}

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={mUpsert.isPending}
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm cursor-pointer"
                >
                  {mUpsert.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" /> {isNew ? "Create Destination" : "Update Destination"}
                    </>
                  )}
                </Button>

                {!isNew && (
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Move to trash
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Featured Image Box */}
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-5 py-3.5 border-b border-border bg-cream/50 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base">Hero Image</h3>
            </header>
            <div className="p-5">
              <ImageUploader
                label="Destination Hero Image"
                value={form.image}
                onChange={(url) => patch("image", url)}
              />
            </div>
          </div>

          {/* Featured Trips & Activities */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50">
              <h2 className="font-serif text-lg leading-none">Featured Trips & Activities</h2>
              <p className="text-xs text-foreground/55 mt-1">
                List the signature highlights or trips for this destination (one per line).
              </p>
            </header>
            <div className="p-6 space-y-4">
              <Textarea
                rows={4}
                value={form.featured_trips.join("\n")}
                onChange={(e) =>
                  patch(
                    "featured_trips",
                    e.target.value.split("\n").map((s) => s.trimEnd()),
                  )
                }
                placeholder="Great Migration river crossings&#10;Walking safaris with Maasai elders&#10;Sunrise hot-air ballooning"
              />

              {form.featured_trips.filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.featured_trips.filter(Boolean).map((trip, idx) => (
                    <button
                      key={`${trip}-${idx}`}
                      type="button"
                      onClick={() =>
                        patch(
                          "featured_trips",
                          form.featured_trips.filter((_, i) => i !== idx),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-cream/40 px-3 py-1 text-xs text-foreground/75 hover:border-destructive hover:text-destructive transition-colors"
                      title="Click to remove"
                    >
                      <span>{trip}</span>
                      <span className="opacity-60">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Location, Category & Coordinates Box */}
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-5 py-3.5 border-b border-border bg-cream/50 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base">Location & Geography</h3>
            </header>
            <div className="p-5 space-y-4">
              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  Country
                </Label>
                <Input
                  value={form.country}
                  onChange={(e) => patch("country", e.target.value)}
                  placeholder="e.g. Kenya"
                />
              </div>

              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Region</Label>
                <Select value={form.region || "Southern Kenya"} onValueChange={(val) => patch("region", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYA_REGIONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other Africa">Other Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  Discovery Category
                </Label>
                <Select
                  value={form.destination_category || "The Icons"}
                  onValueChange={(val) => patch("destination_category", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="The Icons">The Icons (Featured)</SelectItem>
                    <SelectItem value="Beyond the Classics">Beyond the Classics</SelectItem>
                    <SelectItem value="The Indian Ocean">The Indian Ocean</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Coordinates for Interactive Map */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between gap-2">
                  <Label className="block text-[11px] tracking-[0.2em] uppercase text-forest font-bold">
                    Pin Coordinates
                  </Label>
                  {form.latitude != null && form.longitude != null && (
                    <span className="text-[10px] font-mono bg-cream px-2 py-0.5 rounded text-foreground/70 border border-border">
                      {Number(form.latitude).toFixed(3)}, {Number(form.longitude).toFixed(3)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-foreground/60 leading-snug">
                  Drag the pin on the map or click to position this destination visually across Kenya.
                </p>

                {/* Interactive Mini-Map Pin Locator */}
                <DestinationPinLocator
                  name={form.name || "Destination"}
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(lat, lng) => {
                    patch("latitude", lat);
                    patch("longitude", lng);
                  }}
                />

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="mb-1 block text-[10px] tracking-wider uppercase text-foreground/60">
                      Latitude
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={form.latitude ?? ""}
                      onChange={(e) => patch("latitude", e.target.value ? Number(e.target.value) : null)}
                      placeholder="-1.4061"
                      className="text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[10px] tracking-wider uppercase text-foreground/60">
                      Longitude
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={form.longitude ?? ""}
                      onChange={(e) => patch("longitude", e.target.value ? Number(e.target.value) : null)}
                      placeholder="35.1390"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* URL Slug & Attributes */}
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-5 py-3.5 border-b border-border bg-cream/50 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base">Permalink & Slug</h3>
            </header>
            <div className="p-5 space-y-4">
              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  URL Slug
                </Label>
                <Input
                  value={form.slug}
                  onChange={(e) => patch("slug", slugify(e.target.value))}
                  placeholder="e.g. maasai-mara"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-foreground/50 mt-1">
                  Defines the URL at <code className="text-[10px]">/destinations/{form.slug || "slug"}</code>
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete destination?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to permanently delete{" "}
              <span className="font-semibold text-foreground">"{form.name || "this destination"}"</span>. This action
              cannot be undone and will remove it from the live site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

/**
 * Interactive Pin Locator for a Single Destination
 * Converts between map percentage coordinates and Kenya GPS Lat/Lng
 */
function DestinationPinLocator({
  name,
  latitude,
  longitude,
  onChange,
}: {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useState<HTMLDivElement | null>(null)[0];
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Kenya Map Bounds: Lat: -4.8 to +5.0, Lng: 33.8 to 42.0
  const minLat = -4.8;
  const maxLat = 5.0;
  const minLng = 33.8;
  const maxLng = 42.0;

  // Derive percent position from lat/lng or default to center-ish
  const curLat = latitude ?? -1.286389;
  const curLng = longitude ?? 36.817223;

  const left = Math.max(5, Math.min(95, 5 + ((curLng - minLng) / (maxLng - minLng)) * 88));
  const top = Math.max(5, Math.min(95, 5 + ((maxLat - curLat) / (maxLat - minLat)) * 88));

  const updateFromPointer = (clientX: number, clientY: number) => {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const rawLeft = ((clientX - rect.left) / rect.width) * 100;
    const rawTop = ((clientY - rect.top) / rect.height) * 100;

    const clampedLeft = Math.max(5, Math.min(95, rawLeft));
    const clampedTop = Math.max(5, Math.min(95, rawTop));

    // Convert back to Lat/Lng
    const nextLng = minLng + ((clampedLeft - 5) / 88) * (maxLng - minLng);
    const nextLat = maxLat - ((clampedTop - 5) / 88) * (maxLat - minLat);

    onChange(Number(nextLat.toFixed(4)), Number(nextLng.toFixed(4)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  return (
    <div className="space-y-3 bg-muted/40 rounded-xl p-3 border border-border">
      <div
        ref={setContainerEl}
        onClick={handleContainerClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full overflow-hidden rounded-lg bg-forest cursor-crosshair select-none ring-1 ring-border/50 shadow-inner"
        style={{ aspectRatio: "1 / 0.85" }}
      >
        {/* Map Background */}
        <img
          src="/maps/kenya-destinations-map.webp"
          alt="Kenya Pin Locator Map"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-90"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== kenyaMapAsset) {
              target.src = kenyaMapAsset;
            }
          }}
        />

        <div className="absolute inset-0 pointer-events-none bg-black/10" />

        {/* Grid crosshair guide */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "20% 20%",
          }}
        />

        {/* Draggable Pin */}
        <div
          style={{ left: `${left}%`, top: `${top}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${
            isDragging ? "z-50 scale-125" : "z-30"
          }`}
        >
          <button
            type="button"
            onPointerDown={handlePointerDown}
            className="group flex flex-col items-center justify-center focus:outline-none cursor-grab active:cursor-grabbing"
            title={`Drag to reposition ${name}`}
          >
            {/* Pulsing ring */}
            <span className="absolute -inset-2 rounded-full bg-gold/50 animate-ping pointer-events-none" />

            {/* Pin Badge */}
            <div className="w-8 h-8 rounded-full bg-gold text-gold-foreground flex items-center justify-center shadow-2xl ring-4 ring-forest ring-offset-2 ring-offset-forest group-hover:scale-110 transition-transform">
              <Move className="w-4 h-4" />
            </div>

            {/* Name label */}
            <div className="mt-1 whitespace-nowrap bg-forest text-cream text-[10px] font-bold px-2 py-0.5 rounded-full shadow border border-gold/40">
              {name || "Pin"}
            </div>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] tracking-wider uppercase text-foreground/50 font-semibold pr-1">
          Quick Presets:
        </span>
        {[
          { label: "Mara", lat: -1.4061, lng: 35.139 },
          { label: "Amboseli", lat: -2.6527, lng: 37.2606 },
          { label: "Samburu", lat: 0.6234, lng: 37.5317 },
          { label: "Laikipia", lat: 0.3297, lng: 36.9062 },
          { label: "Tsavo", lat: -2.7667, lng: 38.7667 },
          { label: "Mt Kenya", lat: -0.1521, lng: 37.3084 },
          { label: "Lamu", lat: -2.2717, lng: 40.902 },
          { label: "Diani", lat: -4.2794, lng: 39.5855 },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.lat, preset.lng)}
            className="text-[10px] px-2 py-1 rounded bg-background hover:bg-gold hover:text-gold-foreground border border-border transition-colors cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
