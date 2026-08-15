import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  FolderOpen,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  Save,
  Upload,
  X,
  Sparkles,
  Megaphone,
  Map as MapIcon,
  Image as ImageIcon,
  Edit,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTIES = ["Easy", "Moderate", "Active", "Challenging"];

const LABEL_CLASS = "mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60";

// ─── Utilities ────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

function buildUniqueSlug(name: string, existingSlugs: Set<string>): string {
  const base = slugify(name || "adventure") || `new-${Date.now().toString(36)}`;
  if (!existingSlugs.has(base)) return base;
  let n = 2;
  let candidate = `${base}-${n}`;
  while (existingSlugs.has(candidate)) candidate = `${base}-${++n}`;
  return candidate;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/admin/adventures")({
  component: AdminAdventures,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminAdventures() {
  const fetchFn = useServerFn(getAdventuresPage);
  const saveFn = useServerFn(saveAdventuresPage);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-adventures-page"],
    queryFn: () => fetchFn(),
  });

  const [draft, setDraft] = useState<AdventuresPage>(adventuresDefaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  async function save() {
    setSaving(true);
    try {
      await saveFn({
        data: {
          hero: draft.hero,
          cta: draft.cta,
          signatures: draft.signatures,
        },
      });
      toast.success("Adventures page saved");
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-foreground/60">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-5 md:p-6 shadow-sm">
        <div>
          <p className="text-[10px] tracking-[0.28em] uppercase text-gold">Page Editor</p>
          <h1 className="font-serif text-3xl text-foreground">Adventures page</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Edit the live content for <code className="text-xs px-1 py-0.5 bg-cream rounded">/adventures</code>.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save changes
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="grid gap-6 min-w-0">
          <SignatureItineraries draft={draft} setDraft={setDraft} refetch={refetch} />
        </div>

        <aside className="min-w-0">
          <div className="sticky top-24 space-y-4">
            <Card
              id="cta"
              title="Closing CTA"
              icon={Megaphone}
              description="The final invitation at the bottom of the page."
            >
              <Field label="Eyebrow">
                <Input
                  value={draft.cta.eyebrow}
                  onChange={(e) => setDraft({ ...draft, cta: { ...draft.cta, eyebrow: e.target.value } })}
                />
              </Field>
              <Field label="Headline">
                <Input
                  value={draft.cta.headline}
                  onChange={(e) => setDraft({ ...draft, cta: { ...draft.cta, headline: e.target.value } })}
                />
              </Field>
              <Field label="Body">
                <Textarea
                  rows={3}
                  value={draft.cta.body}
                  onChange={(e) => setDraft({ ...draft, cta: { ...draft.cta, body: e.target.value } })}
                />
              </Field>
              <Field label="Button label">
                <Input
                  value={draft.cta.buttonLabel}
                  onChange={(e) => setDraft({ ...draft, cta: { ...draft.cta, buttonLabel: e.target.value } })}
                />
              </Field>
            </Card>
            <Card id="hero" title="Hero image" icon={ImageIcon} description="Image and accessibility settings.">
              <Field label="Hero background image">
                <ManagedImageUpload
                  value={draft.hero.image}
                  onChange={(url) => setDraft({ ...draft, hero: { ...draft.hero, image: url } })}
                  recommendedRatio="16:9 or wider"
                  altText={draft.hero.imageAlt}
                  focalX={draft.hero.focalX ?? 50}
                  focalY={draft.hero.focalY ?? 50}
                  onFocalChange={(focalX, focalY) => setDraft({ ...draft, hero: { ...draft.hero, focalX, focalY } })}
                />
              </Field>
              <Field label="Hero image alt text">
                <Input
                  value={draft.hero.imageAlt ?? ""}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, imageAlt: e.target.value } })}
                />
              </Field>
            </Card>
            <Card title="Hero copy" icon={Sparkles} description="Words shown over the hero image.">
              <Field label="Eyebrow">
                <Input
                  value={draft.hero.eyebrow}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, eyebrow: e.target.value } })}
                />
              </Field>
              <Field label="Headline">
                <Textarea
                  rows={2}
                  value={draft.hero.headline}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, headline: e.target.value } })}
                />
              </Field>
              <Field label="Subhead">
                <Textarea
                  rows={3}
                  value={draft.hero.subhead}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, subhead: e.target.value } })}
                />
              </Field>
            </Card>
            <SignatureOrder signatures={draft.signatures} />
          </div>
        </aside>
      </div>

      {/* Sticky save footer */}
      <div className="sticky bottom-0 mt-10 -mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10 py-4 bg-background/95 backdrop-blur border-t border-border flex justify-end shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
        <Button onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

// ─── Card / Field layout helpers ──────────────────────────────────────────────

function Card({
  id,
  title,
  icon: Icon,
  description,
  children,
}: {
  id?: string;
  title: string;
  icon: any;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-background border border-border rounded-lg overflow-hidden scroll-mt-32 shadow-sm">
      <header className="flex items-start gap-3 px-6 py-4 border-b border-border bg-cream/50">
        <div className="h-9 w-9 rounded-md bg-gold/10 text-gold flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-serif text-xl leading-tight">{title}</h2>
          {description && <p className="text-xs text-foreground/55 mt-0.5">{description}</p>}
        </div>
      </header>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">{label}</Label>
      {children}
    </div>
  );
}

// ─── Signature itineraries list ────────────────────────────────────────────────

function SignatureItineraries({
  draft,
  setDraft,
  refetch,
}: {
  draft: AdventuresPage;
  setDraft: React.Dispatch<React.SetStateAction<AdventuresPage>>;
  refetch: () => Promise<any>;
}) {
  const navigate = useNavigate();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const persistFn = useServerFn(saveAdventuresPage);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdventuresSignature | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── drag-to-reorder ──────────────────────────────────────────────────────
  const moveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= draft.signatures.length) return;
    const copy = draft.signatures.slice();
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    setDraft({ ...draft, signatures: copy });
  };

  // ── open modals / navigation ──────────────────────────────────────
  const openCreate = () => {
    navigate({ to: "/admin/adventures/$slug", params: { slug: "new" } });
  };

  const openEdit = (item: AdventuresSignature) => {
    navigate({ to: "/admin/adventures/$slug", params: { slug: item.slug } });
  };

  // ── persist helpers ──────────────────────────────────────────────────────
  async function persistSignatures(signatures: AdventuresSignature[], successMsg: string) {
    await persistFn({ data: { hero: draft.hero, cta: draft.cta, signatures } });
    setDraft({ ...draft, signatures });
    await refetch();
    toast.success(successMsg);
  }

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const updatedSignatures = draft.signatures.filter((s) => s.slug !== deleteTarget.slug);
      await persistSignatures(updatedSignatures, `"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not delete adventure");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete adventure?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to permanently remove{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name || "this adventure"}</span>. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section card */}
      <section
        id="signatures"
        className="bg-background border border-border rounded-lg overflow-hidden scroll-mt-32 shadow-sm"
      >
        <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-cream/50">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-md bg-gold/10 text-gold flex items-center justify-center shrink-0">
              <MapIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-xl leading-tight">
                Signature itineraries
                <span className="ml-2 text-xs text-foreground/50 font-sans">({draft.signatures.length})</span>
              </h2>
              <p className="text-xs text-foreground/55 mt-0.5">
                Featured adventures in their display order. Drag to reorder.
              </p>
            </div>
          </div>
          <Button
            onClick={openCreate}
            size="sm"
            variant="outline"
            className="border-gold text-gold hover:bg-gold hover:text-gold-foreground"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Adventure
          </Button>
        </header>

        <div className="p-6">
          {draft.signatures.length === 0 ? (
            <div className="border border-dashed border-border bg-background p-16 text-center text-foreground/60">
              No adventures yet. Click <span className="font-medium">Add Adventure</span> to create one.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {draft.signatures.map((item, idx) => (
                <article
                  key={`${item.slug}-${idx}`}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdx !== null) moveTo(dragIdx, idx);
                    setDragIdx(null);
                  }}
                  className="group border border-border bg-background overflow-hidden flex flex-col transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[16/10] bg-cream overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.imageAlt || item.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/30">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-background/90 px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase text-foreground/60">
                      #{idx + 1}
                    </span>
                    <span
                      className="absolute top-3 right-3 cursor-grab bg-background/90 p-1.5 text-foreground/50"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-serif text-lg leading-tight">{item.name || "New itinerary"}</h3>
                    <p className="text-sm text-foreground/60 mt-1 truncate">
                      {[item.region, item.nights, item.difficulty].filter(Boolean).join(" · ") || "No details yet"}
                    </p>
                    <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Edit ${item.name || "adventure"}`}
                        onClick={() => openEdit(item)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => moveTo(idx, idx - 1)}
                        disabled={idx === 0}
                        className="text-foreground/45 hover:text-foreground p-1.5 disabled:opacity-25"
                        aria-label="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTo(idx, idx + 1)}
                        disabled={idx === draft.signatures.length - 1}
                        className="text-foreground/45 hover:text-foreground p-1.5 disabled:opacity-25"
                        aria-label="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ─── SignatureOrder sidebar ────────────────────────────────────────────────────

function SignatureOrder({ signatures }: { signatures: AdventuresSignature[] }) {
  return (
    <section className="border border-border bg-background shadow-sm">
      <header className="border-b border-border bg-cream/50 px-4 py-3">
        <h2 className="font-serif text-xl">Signature order</h2>
        <p className="mt-0.5 text-xs text-foreground/55">Use the controls in the main list to reorder.</p>
      </header>
      <ol className="divide-y divide-border">
        {signatures.map((item, index) => (
          <li key={`${item.slug}-${index}`} className="flex items-center gap-3 px-4 py-3">
            <span className="w-5 text-xs text-foreground/45">{index + 1}</span>
            <span className="h-9 w-12 overflow-hidden bg-muted">
              {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{item.name || "New itinerary"}</span>
          </li>
        ))}
        {signatures.length === 0 && (
          <li className="px-4 py-5 text-sm text-foreground/55">No signature itineraries yet.</li>
        )}
      </ol>
    </section>
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
          className={`flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-10 text-center transition-colors ${
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
