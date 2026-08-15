import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleAlert,
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

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Route = createFileRoute("/_authenticated/admin/adventures")({
  component: AdminAdventures,
});

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
          <SignatureItineraries draft={draft} setDraft={setDraft} />
          {/*
          <Card id="hero" title="Hero image" icon={ImageIcon} description="Image, crop and accessibility settings.">
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
          <Field label="Hero image — alt text (for accessibility & SEO)">
            <Input
              value={draft.hero.imageAlt ?? ""}
              placeholder="Describe the hero image"
              onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, imageAlt: e.target.value } })}
            />
          </Field>
        </Card>*/}

          {/*<Card
          id="cta"
          title="Closing CTA"
          icon={Megaphone}
          description="The final invitation at the bottom of the page."
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Eyebrow">
              <Input
                value={draft.cta.eyebrow}
                onChange={(e) => setDraft({ ...draft, cta: { ...draft.cta, eyebrow: e.target.value } })}
              />
            </Field>
            <Field label="Button label">
              <Input
                value={draft.cta.buttonLabel}
                onChange={(e) => setDraft({ ...draft, cta: { ...draft.cta, buttonLabel: e.target.value } })}
              />
            </Field>
          </div>
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
        </Card>*/}
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

function SignatureItineraries({
  draft,
  setDraft,
}: {
  draft: AdventuresPage;
  setDraft: React.Dispatch<React.SetStateAction<AdventuresPage>>;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const persistFn = useServerFn(saveAdventuresPage);
  const [openingSlug, setOpeningSlug] = useState<string | null>(null);

  const moveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= draft.signatures.length) return;
    const copy = draft.signatures.slice();
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    setDraft({ ...draft, signatures: copy });
  };

  const removeAt = (idx: number) => {
    setDraft({ ...draft, signatures: draft.signatures.filter((_, i) => i !== idx) });
  };

  const addNew = () => {
    setDraft({
      ...draft,
      signatures: [
        ...draft.signatures,
        {
          slug: `new-${Date.now().toString(36)}`,
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
        },
      ],
    });
  };

  return (
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
              Featured adventures, in their display order. Click the edit icon to modify individual adventures.
            </p>
          </div>
        </div>
        <Button
          onClick={addNew}
          size="sm"
          variant="outline"
          className="border-gold text-gold hover:bg-gold hover:text-gold-foreground"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add
        </Button>
      </header>

      <div className="p-4 space-y-2">
        {draft.signatures.length === 0 && (
          <p className="text-sm text-foreground/60 italic p-4 text-center border border-dashed border-border rounded-md">
            No items yet. Click <span className="font-medium">Add</span> to create one.
          </p>
        )}
        {draft.signatures.map((item, idx) => (
          <div
            key={`${item.slug}-${idx}`}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIdx !== null) moveTo(dragIdx, idx);
              setDragIdx(null);
            }}
            className="border border-border bg-background overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-cream/50 transition-colors">
              <span className="cursor-grab text-foreground/35 hover:text-foreground/60" title="Drag to reorder">
                <GripVertical className="w-4 h-4" />
              </span>
              <div className="h-10 w-14 rounded bg-cream overflow-hidden flex items-center justify-center shrink-0">
                {item.image ? (
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-foreground/30" />
                )}
              </div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 w-6">#{idx + 1}</span>
              <span className="font-medium text-sm flex-1 truncate">{item.name || "New itinerary"}</span>
              <button
                type="button"
                className="text-foreground/60 hover:text-foreground p-1.5"
                title="Edit"
                aria-label={`Edit ${item.name || "adventure"}`}
                onClick={() => {
                  let targetSlug = item.slug;
                  if (!targetSlug) {
                    // Legacy/stuck item with no slug yet — generate one now instead of
                    // permanently blocking access to the edit page.
                    const base = item.name ? slugify(item.name) : "";
                    targetSlug = base || `new-${Date.now().toString(36)}`;
                    const existingSlugs = new Set(draft.signatures.map((s) => s.slug).filter(Boolean));
                    let unique = targetSlug;
                    let n = 2;
                    while (existingSlugs.has(unique)) {
                      unique = `${targetSlug}-${n++}`;
                    }
                    targetSlug = unique;
                    const copy = draft.signatures.slice();
                    copy[idx] = { ...item, slug: targetSlug };
                    setDraft({ ...draft, signatures: copy });
                  }
                  navigate({ to: "/admin/adventures/$slug", params: { slug: targetSlug } });
                }}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveTo(idx, idx - 1);
                }}
                disabled={idx === 0}
                className="text-foreground/45 hover:text-foreground p-1.5 disabled:opacity-25"
                aria-label="Move up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveTo(idx, idx + 1);
                }}
                disabled={idx === draft.signatures.length - 1}
                className="text-foreground/45 hover:text-foreground p-1.5 disabled:opacity-25"
                aria-label="Move down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(idx);
                }}
                className="text-foreground/50 hover:text-destructive p-1.5"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

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

function CropPreview({
  label,
  ratio,
  src,
  objectPosition,
}: {
  label: string;
  ratio: string;
  src: string;
  objectPosition: string;
}) {
  return (
    <div>
      <div className={`${ratio} overflow-hidden border border-border bg-muted`}>
        <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition }} />
      </div>
      <p className="mt-1 text-[10px] text-foreground/50">{label}</p>
    </div>
  );
}

function PagePreview({ draft }: { draft: AdventuresPage }) {
  const heroPosition = `${draft.hero.focalX ?? 50}% ${draft.hero.focalY ?? 50}%`;
  return (
    <section className="border border-border bg-background shadow-sm">
      <header className="border-b border-border px-4 py-3">
        <h2 className="font-sans text-sm font-semibold text-foreground">Preview</h2>
      </header>
      <div className="p-4 space-y-4">
        <div className="overflow-hidden border border-border bg-forest">
          <div className="relative aspect-video">
            {draft.hero.image ? (
              <img
                src={draft.hero.image}
                alt=""
                className="h-full w-full object-cover opacity-75"
                style={{ objectPosition: heroPosition }}
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 text-background">
              <p className="text-[9px] uppercase tracking-[0.22em] text-gold">{draft.hero.eyebrow || "Adventures"}</p>
              <p className="mt-1 line-clamp-2 font-serif text-lg leading-tight">
                {draft.hero.headline || "Untitled hero"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-foreground/50">Signature order</p>
          <ol className="space-y-2">
            {draft.signatures.slice(0, 5).map((s, idx) => (
              <li key={`${s.slug}-${idx}`} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-[11px] text-foreground/45">{idx + 1}</span>
                <span className="h-8 w-10 overflow-hidden bg-muted">
                  {s.image && (
                    <img
                      src={s.image}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${s.focalX ?? 50}% ${s.focalY ?? 50}%` }}
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.name || "New itinerary"}</span>
              </li>
            ))}
            {draft.signatures.length === 0 && (
              <li className="text-sm text-foreground/55">No signature itineraries yet.</li>
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}

void (null as unknown as AdventuresSignature);
