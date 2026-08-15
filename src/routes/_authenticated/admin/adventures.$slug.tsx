import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Compass,
  ExternalLink,
  Eye,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Save,
  Trash2,
  Upload,
  X,
  Mountain,
} from "lucide-react";
import {
  getAdventuresPage,
  saveAdventuresPage,
  type AdventuresPage,
  type AdventuresSignature,
  adventuresDefaults,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DIFFICULTIES = ["Easy", "Moderate", "Active", "Challenging"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const Route = createFileRoute("/_authenticated/admin/adventures/$slug")({
  component: AdminAdventureEdit,
});

function AdminAdventureEdit() {
  const { slug } = Route.useParams();
  const isNew = slug === "new";
  const navigate = useNavigate();
  const fetchFn = useServerFn(getAdventuresPage);
  const saveFn = useServerFn(saveAdventuresPage);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-adventures-page"],
    queryFn: () => fetchFn(),
  });

  const [draft, setDraft] = useState<AdventuresPage>(adventuresDefaults);
  const [newForm, setNewForm] = useState<AdventuresSignature>({
    slug: "",
    name: "",
    region: "",
    terrain: "",
    nights: "",
    difficulty: "Moderate",
    image: "",
    imageAlt: "",
    focalX: 50,
    focalY: 50,
    description: "",
    highlights: [],
    included: [],
    notIncluded: [],
  });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const adventureIdx = isNew ? -1 : draft.signatures.findIndex((s) => s.slug === slug);
  const adventure = isNew ? newForm : (adventureIdx >= 0 ? draft.signatures[adventureIdx] : null);

  function updateAdventure(patch: Partial<AdventuresSignature>) {
    if (isNew) {
      setNewForm((prev) => ({ ...prev, ...patch }));
    } else if (adventureIdx >= 0) {
      const updated = { ...draft.signatures[adventureIdx], ...patch };
      const copy = draft.signatures.slice();
      copy[adventureIdx] = updated;
      setDraft((prev) => ({ ...prev, signatures: copy }));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adventure) return;
    if (!adventure.name.trim()) {
      toast.error("Adventure name is required.");
      return;
    }
    setSaving(true);
    try {
      let updatedSignatures = [...draft.signatures];
      if (isNew) {
        const finalSlug = slugify(adventure.name);
        updatedSignatures.push({ ...adventure, slug: finalSlug });
      } else {
        updatedSignatures[adventureIdx] = adventure;
      }

      await saveFn({
        data: {
          hero: draft.hero,
          cta: draft.cta,
          signatures: updatedSignatures,
        },
      });
      toast.success(`"${adventure.name}" ${isNew ? "created" : "updated"} successfully.`);
      await refetch();
      
      if (isNew) {
        navigate({
          to: "/admin/adventures/$slug",
          params: { slug: slugify(adventure.name) },
          replace: true,
        });
      } else if (adventure.slug !== slug) {
        navigate({
          to: "/admin/adventures/$slug",
          params: { slug: adventure.slug },
          replace: true,
        });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save adventure");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!adventure || isNew) return;
    setDeleting(true);
    try {
      const remaining = draft.signatures.filter((s) => s.slug !== slug);
      await saveFn({
        data: {
          hero: draft.hero,
          cta: draft.cta,
          signatures: remaining,
        },
      });
      toast.success(`"${adventure.name}" deleted.`);
      navigate({ to: "/admin/adventures" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not delete adventure");
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-foreground/60">
        <Loader2 className="w-5 h-5 animate-spin text-gold" /> Loading adventure…
      </div>
    );
  }

  if (!isNew && !adventure) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12">
        <Button variant="outline" onClick={() => navigate({ to: "/admin/adventures" })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to adventures
        </Button>
        <div className="rounded-lg border border-border bg-background p-8 text-center space-y-3">
          <h2 className="font-serif text-2xl">Adventure not found</h2>
          <p className="text-sm text-foreground/60">
            No adventure found with slug <code className="text-xs">{slug}</code>.
          </p>
        </div>
      </div>
    );
  }

  const liveHref = !isNew && adventure && adventure.slug ? `/adventures/${adventure.slug}` : null;
  // Non-null alias — at this point adventure is guaranteed to be non-null for isNew (newForm) and for existing (found above)
  const adv = adventure!;

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-5 md:p-6 shadow-sm">
        <div className="space-y-1">
          <Link
            to="/admin/adventures"
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-gold transition-colors font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to adventures
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-foreground">{isNew ? "New Adventure" : "Edit Adventure"}</h1>
            {!isNew && (
              <Badge className="bg-forest text-forest-foreground">Signature Adventure</Badge>
            )}
          </div>
          {!isNew && adventure && adventure.slug && (
            <div className="flex items-center gap-2 text-xs text-foreground/60 pt-1">
              <span className="font-medium text-foreground/75">Permalink:</span>
              <code className="bg-cream px-1.5 py-0.5 rounded text-foreground/80 font-mono text-[11px]">
                /adventures/{adventure.slug}
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
            onClick={() => navigate({ to: "/admin/adventures" })}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> {isNew ? "Create Adventure" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── WordPress-Style Two-Column Layout (9/12 and 3/12) ────────── */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* ── Main Content Area (Left: 9/12) ─────────────────────────── */}
        <div className="space-y-6 min-w-0 xl:col-span-9">
          {/* Adventure Title / Name */}
          <div className="rounded-lg border border-border bg-background p-6 shadow-sm space-y-4">
            <div>
              <Label className="mb-2 block text-[11px] tracking-[0.2em] uppercase text-foreground/60 font-semibold">
                Adventure Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={adv.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  updateAdventure({
                    name: newName,
                    slug: adv.slug === slugify(adv.name) ? slugify(newName) : adv.slug,
                  });
                }}
                placeholder="e.g. Okavango on Foot"
                className="font-serif text-xl md:text-2xl h-12"
              />
            </div>
          </div>

          {/* Adventure Information */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-gold" />
                <h2 className="font-serif text-lg leading-none">Adventure Information & Filtering</h2>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={adv.featured ?? false}
                  onChange={(e) => updateAdventure({ featured: e.target.checked })}
                  className="rounded border-border text-gold focus:ring-gold h-4 w-4"
                />
                <span>Featured Adventure</span>
              </label>
            </header>
            <div className="p-6 space-y-4">
              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  Short Description / Emotional Tagline
                </Label>
                <Input
                  value={adv.shortDescription ?? ""}
                  onChange={(e) => updateAdventure({ shortDescription: e.target.value })}
                  placeholder="e.g. Big cats, river crossings and bare-foot coastal luxury."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Region
                  </Label>
                  <Input
                    value={adv.region}
                    onChange={(e) => updateAdventure({ region: e.target.value })}
                    placeholder="e.g. Maasai Mara"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Terrain
                  </Label>
                  <Input
                    value={adv.terrain}
                    onChange={(e) => updateAdventure({ terrain: e.target.value })}
                    placeholder="e.g. Savannah & Riverine"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Nights / Duration
                  </Label>
                  <Input
                    value={adv.nights}
                    onChange={(e) => updateAdventure({ nights: e.target.value })}
                    placeholder="e.g. 4 Nights"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Difficulty / Pacing
                  </Label>
                  <select
                    value={adv.difficulty}
                    onChange={(e) => updateAdventure({ difficulty: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Experience Categories (comma separated)
                  </Label>
                  <Input
                    value={(adv.experienceTypes ?? []).join(", ")}
                    onChange={(e) =>
                      updateAdventure({
                        experienceTypes: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Wildlife, Walking, Wilderness, Safari + Beach"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Travel Styles (comma separated)
                  </Label>
                  <Input
                    value={(adv.travelStyles ?? []).join(", ")}
                    onChange={(e) =>
                      updateAdventure({
                        travelStyles: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Private, Small Group, Family, Honeymoon"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Destinations Covered (comma separated)
                  </Label>
                  <Input
                    value={(adv.destinations ?? []).join(", ")}
                    onChange={(e) =>
                      updateAdventure({
                        destinations: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Maasai Mara, Lake Naivasha, Lake Nakuru"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                    Associated Lodges (comma separated)
                  </Label>
                  <Input
                    value={(adv.lodges ?? []).join(", ")}
                    onChange={(e) =>
                      updateAdventure({
                        lodges: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Rekero Camp, Mara Plains"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Description & Story */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50 flex items-center justify-between">
              <h2 className="font-serif text-lg leading-none">Full Description & Story</h2>
            </header>
            <div className="p-6">
              <Textarea
                rows={5}
                value={adv.description}
                onChange={(e) => updateAdventure({ description: e.target.value })}
                placeholder="Describe this adventure, the journey flow, what guests will encounter…"
                className="leading-relaxed"
              />
            </div>
          </section>

          {/* Highlights */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50">
              <h2 className="font-serif text-lg leading-none">Highlights</h2>
              <p className="text-xs text-foreground/55 mt-1">
                Enter each key highlight on a new line.
              </p>
            </header>
            <div className="p-6 space-y-4">
              <Textarea
                rows={4}
                value={(adv.highlights ?? []).join("\n")}
                onChange={(e) =>
                  updateAdventure({
                    highlights: e.target.value
                      .split("\n")
                      .map((s) => s.trimEnd()),
                  })
                }
                placeholder="Walking safaris in the Okavango Delta&#10;Night game drives with expert trackers&#10;Private mokoro expeditions"
              />

              {(adv.highlights ?? []).filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(adv.highlights ?? []).filter(Boolean).map((highlight, idx) => (
                    <button
                      key={`${highlight}-${idx}`}
                      type="button"
                      onClick={() =>
                        updateAdventure({
                          highlights: (adv.highlights ?? []).filter((_, i) => i !== idx),
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-cream/40 px-3 py-1 text-xs text-foreground/75 hover:border-destructive hover:text-destructive transition-colors"
                      title="Click to remove"
                    >
                      <span>{highlight}</span>
                      <span className="opacity-60">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Planning: Included & Not Included */}
          <section className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-6 py-4 border-b border-border bg-cream/50">
              <h2 className="font-serif text-lg leading-none">Planning: Included & Not Included</h2>
              <p className="text-xs text-foreground/55 mt-1">
                List inclusions and exclusions (one item per line).
              </p>
            </header>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  Included (one per line)
                </Label>
                <Textarea
                  rows={5}
                  value={(adv.included ?? []).join("\n")}
                  onChange={(e) =>
                    updateAdventure({
                      included: e.target.value
                        .split("\n")
                        .map((s) => s.trimEnd()),
                    })
                  }
                  placeholder="All meals & drinks&#10;Park fees&#10;Expert guide&#10;Internal charter flights"
                />
              </div>

              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  Not Included (one per line)
                </Label>
                <Textarea
                  rows={5}
                  value={(adv.notIncluded ?? []).join("\n")}
                  onChange={(e) =>
                    updateAdventure({
                      notIncluded: e.target.value
                        .split("\n")
                        .map((s) => s.trimEnd()),
                    })
                  }
                  placeholder="International flights&#10;Travel insurance&#10;Premium cellar wines&#10;Gratuities"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Sidebar Area (Right: 3/12) ──────────────────────────── */}
        <aside className="space-y-6 min-w-0 xl:col-span-3">
          {/* Publish / Status Box */}
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-5 py-3.5 border-b border-border bg-cream/50 flex items-center justify-between">
              <h3 className="font-serif text-base">Publish</h3>
              <Badge className="bg-forest text-forest-foreground">Active</Badge>
            </header>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/60 uppercase tracking-wider">Type</span>
                <span className="text-xs font-medium">Signature Itinerary</span>
              </div>

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" /> {isNew ? "Create Adventure" : "Save Changes"}
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

                    {liveHref && (
                      <Button variant="ghost" size="sm" asChild className="text-xs text-foreground/60 hover:text-foreground px-2">
                        <a href={liveHref} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Preview
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero Image Box */}
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <header className="px-5 py-3.5 border-b border-border bg-cream/50 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base">Hero Image</h3>
            </header>
            <div className="p-5 space-y-4">
              <ManagedImageUpload
                value={adv.image}
                onChange={(url) => updateAdventure({ image: url })}
                recommendedRatio="4:3 card · 16:9 hero"
                altText={adv.imageAlt}
                focalX={adv.focalX ?? 50}
                focalY={adv.focalY ?? 50}
                onFocalChange={(focalX, focalY) => updateAdventure({ focalX, focalY })}
              />

              <div>
                <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                  Image alt text
                </Label>
                <Input
                  value={adv.imageAlt ?? ""}
                  placeholder="Describe the hero image…"
                  onChange={(e) => updateAdventure({ imageAlt: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Permalink & Slug Box */}
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
                  value={adv.slug}
                  onChange={(e) => updateAdventure({ slug: slugify(e.target.value) })}
                  placeholder="e.g. okavango-on-foot"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-foreground/50 mt-1">
                  Defines the URL at <code className="text-[10px]">/adventures/{adv.slug || "slug"}</code>
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
            <AlertDialogTitle>Delete adventure?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to permanently remove{" "}
              <span className="font-semibold text-foreground">"{adv.name || "this adventure"}"</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
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
        <div className="border border-border bg-background">
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
          className={`flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed px-4 py-8 text-center transition-colors ${
            drag ? "border-gold bg-gold/5" : "border-border bg-muted/30 hover:border-gold hover:bg-gold/5"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground/70">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-medium">Drop or click to upload</p>
            <p className="mt-1 text-[11px] text-foreground/50">PNG, JPG, WEBP, GIF, AVIF – up to 8MB</p>
          </div>
        </button>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => setLibraryOpen(true)} className="w-full">
        <FolderOpen className="w-3.5 h-3.5 mr-1" /> Choose from library
      </Button>

      <Input
        value={value ?? ""}
        onChange={(e) => {
          setFileMeta(null);
          onChange(e.target.value);
        }}
        placeholder="…or paste image URL"
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

function FocalSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
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
