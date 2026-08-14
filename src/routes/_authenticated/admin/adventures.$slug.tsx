import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  CircleAlert,
  FolderOpen,
  Loader2,
  Plus,
  Trash2,
  Save,
  Upload,
  X,
  Image as ImageIcon,
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

const DIFFICULTIES = ["Easy", "Moderate", "Active", "Challenging"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Route = createFileRoute("/_authenticated/admin/adventures/$slug")({
  component: AdminAdventureEdit,
});

function AdminAdventureEdit() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetchFn = useServerFn(getAdventuresPage);
  const saveFn = useServerFn(saveAdventuresPage);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-adventures-page"],
    queryFn: () => fetchFn(),
  });

  const [draft, setDraft] = useState<AdventuresPage>(adventuresDefaults);
  const [saving, setSaving] = useState(false);
  // Track which item we're editing by its array position, not by its live slug value.
  // The slug field can change as the user types (auto-generated from name, or edited
  // directly), and re-matching against the URL param on every render would cause the
  // item to "disappear" the moment its slug no longer equals the original URL slug.
  const [matchedIdx, setMatchedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  useEffect(() => {
    if (matchedIdx === null && draft.signatures.length > 0) {
      const idx = draft.signatures.findIndex((s) => s.slug === slug);
      if (idx >= 0) setMatchedIdx(idx);
    }
  }, [draft.signatures, slug, matchedIdx]);

  const adventure = matchedIdx !== null ? draft.signatures[matchedIdx] : undefined;

  async function save() {
    if (!adventure) return;
    setSaving(true);
    try {
      await saveFn({
        data: {
          hero: draft.hero,
          cta: draft.cta,
          signatures: draft.signatures,
        },
      });
      toast.success("Adventure saved");
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

  if (!adventure) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate({ to: "/admin/adventures" })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-foreground/60">Adventure not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/admin/adventures" })}
            className="text-foreground/60 hover:text-foreground"
            title="Back to adventures"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] tracking-[0.28em] uppercase text-gold">Edit Adventure</p>
            <h1 className="font-serif text-3xl text-foreground">{adventure.name || "New Adventure"}</h1>
            <p className="text-sm text-foreground/60 mt-1">
              Slug: <code className="text-xs px-1 py-0.5 bg-cream rounded">{adventure.slug}</code>
            </p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save changes
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          <AdventureForm
            adventure={adventure}
            onUpdate={(updated) => {
              if (matchedIdx === null) return;
              const copy = draft.signatures.slice();
              copy[matchedIdx] = updated;
              setDraft({ ...draft, signatures: copy });
            }}
          />
        </div>
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

function AdventureForm({
  adventure,
  onUpdate,
}: {
  adventure: AdventuresSignature;
  onUpdate: (adventure: AdventuresSignature) => void;
}) {
  const set = (updated: AdventuresSignature) => onUpdate(updated);

  return (
    <>
      <Card title="Basic Information" icon={ImageIcon} description="Name, slug, and location details.">
        <Field label="Name">
          <Input
            value={adventure.name}
            onChange={(e) =>
              set({
                ...adventure,
                name: e.target.value,
                slug: !adventure.slug || adventure.slug.startsWith("new-") ? slugify(e.target.value) : adventure.slug,
              })
            }
          />
        </Field>
        <Field label="Slug">
          <Input value={adventure.slug} onChange={(e) => set({ ...adventure, slug: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Region">
            <Input value={adventure.region} onChange={(e) => set({ ...adventure, region: e.target.value })} />
          </Field>
          <Field label="Terrain">
            <Input value={adventure.terrain} onChange={(e) => set({ ...adventure, terrain: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nights">
            <Input value={adventure.nights} onChange={(e) => set({ ...adventure, nights: e.target.value })} />
          </Field>
          <Field label="Difficulty">
            <select
              value={adventure.difficulty}
              onChange={(e) => set({ ...adventure, difficulty: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="Description" icon={ImageIcon} description="Main content about this adventure.">
        <Field label="Description">
          <Textarea
            rows={4}
            value={adventure.description}
            onChange={(e) => set({ ...adventure, description: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="Hero Image" icon={ImageIcon} description="Image and accessibility settings.">
        <Field label="Hero background image">
          <ManagedImageUpload
            value={adventure.image}
            onChange={(url) => set({ ...adventure, image: url })}
            recommendedRatio="4:3 card, 16:9 hero"
            altText={adventure.imageAlt}
            focalX={adventure.focalX ?? 50}
            focalY={adventure.focalY ?? 50}
            onFocalChange={(focalX, focalY) => set({ ...adventure, focalX, focalY })}
          />
        </Field>
        <Field label="Image alt text">
          <Input value={adventure.imageAlt ?? ""} onChange={(e) => set({ ...adventure, imageAlt: e.target.value })} />
        </Field>
      </Card>

      <Card title="Highlights" icon={ImageIcon} description="Key experiences and activities.">
        <Field label="Highlights">
          <Textarea
            rows={4}
            value={(adventure.highlights ?? []).join("\n")}
            onChange={(e) =>
              set({
                ...adventure,
                highlights: e.target.value
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
          />
          <p className="mt-1.5 text-xs text-foreground/55">
            Enter one highlight per line. They appear as the itinerary's key experiences.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(adventure.highlights ?? []).map((highlight, index) => (
              <button
                key={`${highlight}-${index}`}
                type="button"
                onClick={() =>
                  set({
                    ...adventure,
                    highlights: adventure.highlights.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground/70 hover:border-destructive hover:text-destructive"
                title="Remove highlight"
              >
                {highlight} ×
              </button>
            ))}
          </div>
        </Field>
      </Card>

      <Card
        title="What is Included & Not Included"
        icon={CircleAlert}
        description="Add one item per line. These lists appear on this adventure's public page."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Included">
            <Textarea
              rows={5}
              value={(adventure.included ?? []).join("\n")}
              onChange={(e) =>
                set({
                  ...adventure,
                  included: e.target.value
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
          <Field label="Not included">
            <Textarea
              rows={5}
              value={(adventure.notIncluded ?? []).join("\n")}
              onChange={(e) =>
                set({
                  ...adventure,
                  notIncluded: e.target.value
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </div>
      </Card>
    </>
  );
}

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
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const objectPosition = `${focalX}% ${focalY}%`;
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
    <div className="grid gap-3 border border-border bg-background p-3 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 lg:col-span-2">
        <div>
          <p className="text-xs font-medium text-foreground">Image requirements</p>
          <p className="text-[11px] text-foreground/55">Recommended ratio: {recommendedRatio}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${
            altComplete ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"
          }`}
        >
          {altComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleAlert className="w-3.5 h-3.5" />}
          {altComplete ? "Alt text complete" : "Alt text needed"}
        </span>
      </div>

      {value ? (
        <div className="border border-border bg-background lg:col-start-1">
          <div className="bg-muted">
            <img
              src={value}
              alt=""
              className="mx-auto max-h-72 w-full object-contain"
              onLoad={(e) =>
                setDimensions({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight,
                })
              }
            />
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
                setDimensions(null);
                onChange("");
              }}
              className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
            <span className="ml-auto max-w-[60%] truncate text-[11px] text-foreground/50" title={value}>
              {fileMeta ? `${fileMeta.name} - ${humanSize(fileMeta.size)}` : value.split("/").pop()}
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
          className={`flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-10 text-center transition-colors lg:col-start-1 ${
            drag ? "border-gold bg-gold/5" : "border-border bg-muted/30 hover:border-gold hover:bg-gold/5"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground/70">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">Drop an image here or click to upload</p>
            <p className="mt-1 text-[11px] text-foreground/50">PNG, JPG, WEBP, GIF, AVIF - up to 8MB</p>
          </div>
        </button>
      )}

      <div className="grid gap-3 lg:col-start-2 lg:row-start-2">
        <MetaTile label="Focal point" value={`${Math.round(focalX)}% / ${Math.round(focalY)}%`} />
        {value && (
          <div className="space-y-3">
            <FocalSlider
              label="Horizontal focal point"
              value={focalX}
              onChange={(next) => onFocalChange?.(next, focalY)}
            />
            <FocalSlider
              label="Vertical focal point"
              value={focalY}
              onChange={(next) => onFocalChange?.(focalX, next)}
            />
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setLibraryOpen(true)}
        className="w-full lg:col-start-1"
      >
        <FolderOpen className="w-3.5 h-3.5 mr-1" /> Choose from media library
      </Button>
      <Input
        value={value ?? ""}
        onChange={(e) => {
          setFileMeta(null);
          setDimensions(null);
          onChange(e.target.value);
        }}
        placeholder="...or paste an image URL"
        className="text-xs lg:col-start-1"
      />

      <MediaLibraryPicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(urls) => {
          const [url] = urls;
          if (!url) return;
          setFileMeta(null);
          setDimensions(null);
          onChange(url);
        }}
      />
    </div>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/45">{label}</p>
      <p className="mt-1 text-xs text-foreground/75">{value}</p>
    </div>
  );
}

function FocalSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-foreground/75">{label}</p>
        <span className="text-[11px] tabular-nums text-foreground/50">{Math.round(value)}%</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={1} onValueChange={([next]) => onChange(next ?? value)} />
    </div>
  );
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
