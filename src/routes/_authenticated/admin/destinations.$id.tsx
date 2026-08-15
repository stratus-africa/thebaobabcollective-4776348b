import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Eye,
  Globe,
  Hash,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Save,
  Trash2,
  Sparkles,
} from "lucide-react";
import { adminGet, adminUpsert, adminDelete } from "@/lib/admin.functions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  country: "",
  region: "",
  slug: "",
  best_season: "",
  description: "",
  image: "",
  featured_trips: [],
  sort_order: 0,
  published: true,
};

function AdminDestinationEdit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getFn = useServerFn(adminGet);
  const upsertFn = useServerFn(adminUpsert);
  const deleteFn = useServerFn(adminDelete);

  const [form, setForm] = useState<DestinationRecord>(BLANK_DESTINATION);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: destination, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-destination", id],
    queryFn: () => getFn({ data: { table: "destinations", id } }),
  });

  useEffect(() => {
    if (destination) {
      setForm({
        id: destination.id,
        name: destination.name ?? "",
        country: destination.country ?? "",
        region: destination.region ?? "",
        slug: destination.slug ?? "",
        best_season: destination.best_season ?? "",
        description: destination.description ?? "",
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
      await refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save destination"),
  });

  function patch<K extends keyof DestinationRecord>(key: K, value: DestinationRecord[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 justify-center text-foreground/60">
        <Loader2 className="w-5 h-5 animate-spin text-gold" /> Loading destination details…
      </div>
    );
  }

  if (isError || !destination) {
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

  const liveHref = form.slug ? `/destinations/${form.slug}` : null;

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
            <h1 className="font-serif text-3xl text-foreground">Edit Destination</h1>
            <Badge variant={form.published ? "default" : "secondary"} className={form.published ? "bg-forest text-forest-foreground" : ""}>
              {form.published ? "Active" : "Draft"}
            </Badge>
          </div>
          {form.slug && (
            <div className="flex items-center gap-2 text-xs text-foreground/60 pt-1">
              <span className="font-medium text-foreground/75">Permalink:</span>
              <code className="bg-cream px-1.5 py-0.5 rounded text-foreground/80 font-mono text-[11px]">
                /destinations/{form.slug}
              </code>
              {liveHref && (
                <a
                  href={liveHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-gold hover:underline ml-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Page
                </a>
              )}
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
                <Save className="w-4 h-4 mr-1.5" /> Update Destination
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── WordPress-Style Two-Column Layout ────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* ── Main Content Area (Left) ───────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          {/* Destination Title / Name */}
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
                placeholder="e.g. Okavango Delta"
                className="font-serif text-xl md:text-2xl h-12"
              />
            </div>
          </div>

          {/* Location & Season Details */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-gold" />
              <h2 className="font-serif text-lg leading-none">Location & Season</h2>
            </header>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Country
                  </Label>
                  <Input
                    value={form.country}
                    onChange={(e) => patch("country", e.target.value)}
                    placeholder="e.g. Botswana"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Region
                  </Label>
                  <Input
                    value={form.region}
                    onChange={(e) => patch("region", e.target.value)}
                    placeholder="e.g. Southern Africa"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  Best Season to Visit
                </Label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <Input
                    value={form.best_season ?? ""}
                    onChange={(e) => patch("best_season", e.target.value)}
                    placeholder="e.g. May – Oct (dry season, peak wildlife)"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Description (Rich Text) */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <h2 className="font-serif text-lg leading-none">Description & Overview</h2>
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
                placeholder="Mokoro safaris&#10;Walking safaris with Bushmen&#10;Helicopter transfers"
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
        </div>

        {/* ── Sidebar Area (Right) ───────────────────────────────────── */}
        <aside className="space-y-6 min-w-0">
          {/* Publish / Status Box */}
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-5 py-3.5 border-b border-border bg-cream/50 flex items-center justify-between">
              <h3 className="font-serif text-base">Publish</h3>
              <Badge variant={form.published ? "default" : "secondary"} className={form.published ? "bg-forest text-forest-foreground" : ""}>
                {form.published ? "Published" : "Draft"}
              </Badge>
            </header>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/60 uppercase tracking-wider">Status</span>
                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                  <Checkbox
                    checked={form.published}
                    onCheckedChange={(v) => patch("published", !!v)}
                    id="published"
                  />
                  <span>Active / Published</span>
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
                  {form.updated_at && (
                    <div>Updated: {new Date(form.updated_at).toLocaleDateString()}</div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={mUpsert.isPending}
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm"
                >
                  {mUpsert.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" /> Update Destination
                    </>
                  )}
                </Button>

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

                  {liveHref && (
                    <Button variant="ghost" size="sm" asChild className="text-xs text-foreground/60 hover:text-foreground px-2">
                      <a href={liveHref} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Preview
                      </a>
                    </Button>
                  )}
                </div>
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

          {/* URL Slug & Attributes */}
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-5 py-3.5 border-b border-border bg-cream/50 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base">Permalink & Attributes</h3>
            </header>
            <div className="p-5 space-y-4">
              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  URL Slug
                </Label>
                <Input
                  value={form.slug}
                  onChange={(e) => patch("slug", slugify(e.target.value))}
                  placeholder="e.g. okavango-delta"
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
              <span className="font-semibold text-foreground">"{form.name || "this destination"}"</span>. This action cannot be undone and will remove it from the live site.
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
