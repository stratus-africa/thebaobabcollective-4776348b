import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CircleAlert, FolderOpen, Loader2, Save, Upload, X, Image as ImageIcon } from "lucide-react";
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

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const adventure = draft.signatures.find((s) => s.slug === slug);

  async function save(e: React.FormEvent) {
    e.preventDefault();
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
        <Button variant="outline" onClick={() => navigate({ to: "/admin/content/itineraries" })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to adventures
        </Button>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-foreground/60">Adventure not found</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Adventure editor</p>
          <h1 className="font-serif text-3xl">{adventure.id ? "Edit adventure" : "New adventure"}</h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/content/itineraries" })}>
            Back to adventures
          </Button>
          <Button type="submit" disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
            {saving ? "Saving…" : "Save adventure"}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="space-y-5 border border-border bg-background p-5 sm:p-6">
          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
              Adventure name
            </Label>
            <Input
              value={adventure.name}
              onChange={(e) => {
                const idx = draft.signatures.findIndex((s) => s.slug === slug);
                if (idx >= 0) {
                  const copy = draft.signatures.slice();
                  copy[idx] = { ...adventure, name: e.target.value, slug: adventure.slug || slugify(e.target.value) };
                  setDraft({ ...draft, signatures: copy });
                }
              }}
              placeholder="e.g. Okavango Reverie"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Slug</Label>
              <Input
                value={adventure.slug}
                onChange={(e) => {
                  const idx = draft.signatures.findIndex((s) => s.slug === slug);
                  if (idx >= 0) {
                    const copy = draft.signatures.slice();
                    copy[idx] = { ...adventure, slug: e.target.value };
                    setDraft({ ...draft, signatures: copy });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Region</Label>
              <Input
                value={adventure.region}
                onChange={(e) => {
                  const idx = draft.signatures.findIndex((s) => s.slug === slug);
                  if (idx >= 0) {
                    const copy = draft.signatures.slice();
                    copy[idx] = { ...adventure, region: e.target.value };
                    setDraft({ ...draft, signatures: copy });
                  }
                }}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Terrain</Label>
              <Input
                value={adventure.terrain}
                onChange={(e) => {
                  const idx = draft.signatures.findIndex((s) => s.slug === slug);
                  if (idx >= 0) {
                    const copy = draft.signatures.slice();
                    copy[idx] = { ...adventure, terrain: e.target.value };
                    setDraft({ ...draft, signatures: copy });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Nights</Label>
              <Input
                value={adventure.nights}
                onChange={(e) => {
                  const idx = draft.signatures.findIndex((s) => s.slug === slug);
                  if (idx >= 0) {
                    const copy = draft.signatures.slice();
                    copy[idx] = { ...adventure, nights: e.target.value };
                    setDraft({ ...draft, signatures: copy });
                  }
                }}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                Difficulty
              </Label>
              <select
                value={adventure.difficulty}
                onChange={(e) => {
                  const idx = draft.signatures.findIndex((s) => s.slug === slug);
                  if (idx >= 0) {
                    const copy = draft.signatures.slice();
                    copy[idx] = { ...adventure, difficulty: e.target.value };
                    setDraft({ ...draft, signatures: copy });
                  }
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
              Description
            </Label>
            <Textarea
              rows={4}
              value={adventure.description}
              onChange={(e) => {
                const idx = draft.signatures.findIndex((s) => s.slug === slug);
                if (idx >= 0) {
                  const copy = draft.signatures.slice();
                  copy[idx] = { ...adventure, description: e.target.value };
                  setDraft({ ...draft, signatures: copy });
                }
              }}
              placeholder="Describe this adventure…"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
              Highlights (one per line)
            </Label>
            <Textarea
              rows={4}
              value={(adventure.highlights ?? []).join("\n")}
              onChange={(e) => {
                const idx = draft.signatures.findIndex((s) => s.slug === slug);
                if (idx >= 0) {
                  const copy = draft.signatures.slice();
                  copy[idx] = {
                    ...adventure,
                    highlights: e.target.value
                      .split("\n")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  };
                  setDraft({ ...draft, signatures: copy });
                }
              }}
              placeholder="One highlight per line…"
            />
            {(adventure.highlights ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(adventure.highlights ?? []).map((highlight, index) => (
                  <button
                    key={`${highlight}-${index}`}
                    type="button"
                    onClick={() => {
                      const idx = draft.signatures.findIndex((s) => s.slug === slug);
                      if (idx >= 0) {
                        const copy = draft.signatures.slice();
                        copy[idx] = {
                          ...adventure,
                          highlights: adventure.highlights.filter((_, itemIndex) => itemIndex !== index),
                        };
                        setDraft({ ...draft, signatures: copy });
                      }
                    }}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground/70 hover:border-destructive hover:text-destructive"
                    title="Remove highlight"
                  >
                    {highlight} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                Included (one per line)
              </Label>
              <Textarea
                rows={4}
                value={(adventure.included ?? []).join("\n")}
                onChange={(e) => {
                  const idx = draft.signatures.findIndex((s) => s.slug === slug);
                  if (idx >= 0) {
                    const copy = draft.signatures.slice();
                    copy[idx] = {
                      ...adventure,
                      included: e.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    };
                    setDraft({ ...draft, signatures: copy });
                  }
                }}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                Not included (one per line)
              </Label>
              <Textarea
                rows={4}
                value={(adventure.notIncluded ?? []).join("\n")}
                onChange={(e) => {
                  const idx = draft.signatures.findIndex((s) => s.slug === slug);
                  if (idx >= 0) {
                    const copy = draft.signatures.slice();
                    copy[idx] = {
                      ...adventure,
                      notIncluded: e.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    };
                    setDraft({ ...draft, signatures: copy });
                  }
                }}
              />
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="border border-border bg-background p-5">
            <Label className="mb-3 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Hero Image</Label>
            <ManagedImageUpload
              value={adventure.image}
              onChange={(url) => {
                const idx = draft.signatures.findIndex((s) => s.slug === slug);
                if (idx >= 0) {
                  const copy = draft.signatures.slice();
                  copy[idx] = { ...adventure, image: url };
                  setDraft({ ...draft, signatures: copy });
                }
              }}
              recommendedRatio="4:3 card, 16:9 hero"
              altText={adventure.imageAlt}
              focalX={adventure.focalX ?? 50}
              focalY={adventure.focalY ?? 50}
              onFocalChange={(focalX, focalY) => {
                const idx = draft.signatures.findIndex((s) => s.slug === slug);
                if (idx >= 0) {
                  const copy = draft.signatures.slice();
                  copy[idx] = { ...adventure, focalX, focalY };
                  setDraft({ ...draft, signatures: copy });
                }
              }}
            />
          </div>

          <div className="border border-border bg-background p-5">
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
              Image alt text
            </Label>
            <Input
              value={adventure.imageAlt ?? ""}
              onChange={(e) => {
                const idx = draft.signatures.findIndex((s) => s.slug === slug);
                if (idx >= 0) {
                  const copy = draft.signatures.slice();
                  copy[idx] = { ...adventure, imageAlt: e.target.value };
                  setDraft({ ...draft, signatures: copy });
                }
              }}
              placeholder="Describe the hero image…"
            />
          </div>
        </aside>
      </div>
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
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

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
            <p className="mt-1 text-[11px] text-foreground/50">PNG, JPG, WEBP, GIF, AVIF - up to 8MB</p>
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
        placeholder="...or paste URL"
        className="text-xs"
      />

      {value && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-foreground/75">Focal point</div>
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

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
