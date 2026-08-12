import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
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

export const Route = createFileRoute("/_authenticated/admin/adventures")({
  component: AdminAdventures,
});

const DIFFICULTIES = ["Easy", "Moderate", "Active", "Challenging"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

  const sections = [
    { id: "hero", label: "Hero", icon: Sparkles },
    { id: "cta", label: "Closing CTA", icon: Megaphone },
    { id: "signatures", label: "Signature itineraries", icon: MapIcon, count: draft.signatures.length },
  ];

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

      {/* Quick navigation */}
      <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 flex flex-wrap gap-2 sticky top-20 z-10 shadow-sm">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-border bg-background hover:bg-cream hover:border-gold/40 transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-gold" />
              {s.label}
              {typeof s.count === "number" && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded-full bg-cream text-[10px] text-foreground/70">
                  {s.count}
                </span>
              )}
            </a>
          );
        })}
      </div>

      <div className="grid gap-6">
        <Card id="hero" title="Hero" icon={Sparkles} description="Top of the Adventures page.">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Eyebrow">
              <Input
                value={draft.hero.eyebrow}
                onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, eyebrow: e.target.value } })}
              />
            </Field>
          </div>
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
          <Field label="Hero background image">
            <ImageUpload
              value={draft.hero.image}
              onChange={(url) => setDraft({ ...draft, hero: { ...draft.hero, image: url } })}
            />
            {draft.hero.image && (
              <img
                src={draft.hero.image}
                alt={draft.hero.imageAlt || "Hero preview"}
                className="mt-3 w-full max-h-64 object-cover rounded border border-border"
              />
            )}
          </Field>
          <Field label="Hero image — alt text (for accessibility & SEO)">
            <Input
              value={draft.hero.imageAlt ?? ""}
              placeholder="Describe the hero image"
              onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, imageAlt: e.target.value } })}
            />
          </Field>
        </Card>

        <Card
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
        </Card>

        <ListCard
          id="signatures"
          title="Signature itineraries"
          icon={MapIcon}
          description="Hero adventures featured at the bottom of the page."
          items={draft.signatures}
          onChange={(signatures) => setDraft({ ...draft, signatures })}
          empty={{
            slug: "",
            name: "",
            region: "",
            terrain: "",
            nights: "",
            difficulty: "Moderate",
            image: "",
            description: "",
            highlights: [],
          }}
          previewLabel={(s) => s.name || "New itinerary"}
          previewImage={(s) => s.image}
          render={(s, set) => (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Name">
                  <Input
                    value={s.name}
                    onChange={(e) => set({ ...s, name: e.target.value, slug: s.slug || slugify(e.target.value) })}
                  />
                </Field>
                <Field label="Slug (matches /itineraries/$slug)">
                  <Input value={s.slug} onChange={(e) => set({ ...s, slug: e.target.value })} />
                </Field>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Region">
                  <Input value={s.region} onChange={(e) => set({ ...s, region: e.target.value })} />
                </Field>
                <Field label="Terrain">
                  <Input value={s.terrain} onChange={(e) => set({ ...s, terrain: e.target.value })} />
                </Field>
                <Field label="Nights">
                  <Input
                    value={s.nights}
                    onChange={(e) => set({ ...s, nights: e.target.value })}
                    placeholder="8 nights"
                  />
                </Field>
              </div>
              <div className="grid md:grid-cols-[220px_1fr] gap-4">
                <Field label="Difficulty">
                  <select
                    value={s.difficulty}
                    onChange={(e) => set({ ...s, difficulty: e.target.value })}
                    className="h-10 bg-background border border-border rounded-md px-3 text-sm w-full"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Description">
                  <Textarea
                    rows={2}
                    value={s.description}
                    onChange={(e) => set({ ...s, description: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Hero image">
                <ImageUpload value={s.image} onChange={(url) => set({ ...s, image: url })} />
              </Field>
              <Field label="Highlights (one per line)">
                <Textarea
                  rows={4}
                  value={(s.highlights ?? []).join("\n")}
                  onChange={(e) =>
                    set({
                      ...s,
                      highlights: e.target.value
                        .split("\n")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
            </>
          )}
        />
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

function ListCard<T extends object>({
  id,
  title,
  icon: Icon,
  description,
  items,
  onChange,
  empty,
  render,
  previewLabel,
  previewImage,
}: {
  id?: string;
  title: string;
  icon: any;
  description?: string;
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  render: (item: T, set: (next: T) => void) => React.ReactNode;
  previewLabel?: (item: T) => string;
  previewImage?: (item: T) => string | undefined;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const setAt = (idx: number, next: T) => {
    const copy = items.slice();
    copy[idx] = next;
    onChange(copy);
  };
  const removeAt = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
    if (openIdx === idx) setOpenIdx(null);
  };
  const addNew = () => {
    onChange([...items, structuredClone(empty)]);
    setOpenIdx(items.length);
  };

  return (
    <section id={id} className="bg-background border border-border rounded-lg overflow-hidden scroll-mt-32 shadow-sm">
      <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-cream/50">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-gold/10 text-gold flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl leading-tight">
              {title}
              <span className="ml-2 text-xs text-foreground/50 font-sans">({items.length})</span>
            </h2>
            {description && <p className="text-xs text-foreground/55 mt-0.5">{description}</p>}
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
        {items.length === 0 && (
          <p className="text-sm text-foreground/60 italic p-4 text-center border border-dashed border-border rounded-md">
            No items yet. Click <span className="font-medium">Add</span> to create one.
          </p>
        )}
        {items.map((item, idx) => {
          const isOpen = openIdx === idx;
          const label = previewLabel?.(item) ?? `Item ${idx + 1}`;
          const img = previewImage?.(item);
          return (
            <div key={idx} className="border border-border rounded-md bg-background overflow-hidden shadow-sm">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-cream/50 transition-colors"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
              >
                <div className="h-10 w-14 rounded bg-cream overflow-hidden flex items-center justify-center shrink-0">
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-foreground/30" />
                  )}
                </div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 w-6">#{idx + 1}</span>
                <span className="font-medium text-sm flex-1 truncate">{label}</span>
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
                <span className="text-xs text-foreground/50">{isOpen ? "Hide" : "Edit"}</span>
              </div>
              {isOpen && (
                <div className="px-4 pb-5 pt-2 space-y-4 border-t border-border bg-cream/30">
                  {render(item, (next) => setAt(idx, next))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const upload = useServerFn(adminUploadImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

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
      {value ? (
        <div className="border-2 border-border rounded-md overflow-hidden bg-background shadow-sm">
          <div className="bg-cream">
            <img src={value} alt="" className="w-full max-h-72 object-contain mx-auto" />
          </div>
          <div className="flex flex-wrap items-center gap-2 p-3 border-t border-border bg-cream/40">
            <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange("")}
              className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
            <span className="ml-auto text-[11px] text-foreground/50 truncate max-w-[60%]" title={value}>
              {value.split("/").pop()}
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
          className={`w-full flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-12 text-center transition-colors ${
            drag ? "border-gold bg-gold/5" : "border-border bg-cream/40 hover:border-gold hover:bg-gold/5"
          }`}
        >
          <div className="h-14 w-14 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-medium">Drop an image here or click to upload</p>
            <p className="text-[11px] text-foreground/50 mt-1">PNG, JPG, WEBP, GIF, AVIF · up to 8MB</p>
          </div>
        </button>
      )}
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        className="text-xs"
      />
    </div>
  );
}

// Silence type imports
void (null as unknown as AdventuresSignature);
