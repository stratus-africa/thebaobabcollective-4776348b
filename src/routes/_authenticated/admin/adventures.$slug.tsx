import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import {
  getAdventureEditorDraft,
  getAdventuresPage,
  saveAdventuresPage,
  type AdventuresSignature,
} from "@/lib/adventures.functions";

const adventuresQuery = {
  queryKey: ["admin-adventures-page"],
  queryFn: () => getAdventuresPage(),
};

export const Route = createFileRoute("/_authenticated/admin/adventures/$slug")({
  loader: async ({ params, context }) => {
    const page = await context.queryClient.ensureQueryData(adventuresQuery);
    const isNew = params.slug === "new";
    const adventure = isNew
      ? getAdventureEditorDraft(page, "new")
      : page.signatures.find((s) => s.slug === params.slug);
    if (!adventure && !isNew) throw notFound();
    return { adventure: adventure ?? getAdventureEditorDraft(page, "new"), isNew };
  },
  component: AdminAdventureEditor,
});

function AdminAdventureEditor() {
  const navigate = useNavigate();
  const fetchPage = useServerFn(getAdventuresPage);
  const savePage = useServerFn(saveAdventuresPage);
  const { adventure: initialAdventure, isNew } = Route.useLoaderData();
  const [draft, setDraft] = useState<AdventuresSignature>(initialAdventure);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const { data: page } = useQuery({
    queryKey: ["admin-adventures-page"],
    queryFn: () => fetchPage(),
    initialData: {
      hero: { eyebrow: "", headline: "", subhead: "", image: "", imageAlt: "" },
      cta: { eyebrow: "", headline: "", body: "", buttonLabel: "" },
      signatures: [initialAdventure],
    },
  });

  useEffect(() => {
    setDraft(initialAdventure);
  }, [initialAdventure]);

  const onChange = <K extends keyof AdventuresSignature>(field: K, value: AdventuresSignature[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentPage = page ?? {
        hero: { eyebrow: "", headline: "", subhead: "", image: "", imageAlt: "" },
        cta: { eyebrow: "", headline: "", body: "", buttonLabel: "" },
        signatures: [],
      };
      const nextPage = {
        ...currentPage,
        signatures: [
          ...currentPage.signatures.filter((item) => item.slug !== draft.slug && item.slug !== "new"),
          {
            ...draft,
            slug: draft.slug || (isNew ? "new" : initialAdventure.slug),
            status: draft.status ?? "draft",
            highlights: draft.highlights ?? [],
            included: draft.included ?? [],
            notIncluded: draft.notIncluded ?? [],
          },
        ],
      };

      await savePage({ data: nextPage });
      navigate({ to: "/admin/adventures" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-5 md:p-6 shadow-sm">
        <div className="space-y-1">
          <Link
            to="/admin/adventures"
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-gold transition-colors font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Adventures
          </Link>
          <h1 className="font-serif text-3xl text-foreground">{isNew ? "New Adventure" : "Edit Adventure"}</h1>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          {saving ? "Saving…" : "Save Adventure"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm space-y-4">
          <div>
            <Label className="mb-2 block text-[11px] tracking-[0.2em] uppercase text-foreground/60 font-semibold">
              Adventure Name
            </Label>
            <Input
              value={draft.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Great Migration & Beyond"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Region</Label>
              <Input value={draft.region} onChange={(e) => onChange("region", e.target.value)} placeholder="Kenya" />
            </div>
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Terrain</Label>
              <Input
                value={draft.terrain}
                onChange={(e) => onChange("terrain", e.target.value)}
                placeholder="Savannah & River"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Nights</Label>
              <Input value={draft.nights} onChange={(e) => onChange("nights", e.target.value)} placeholder="7 nights" />
            </div>
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                Difficulty
              </Label>
              <Input
                value={draft.difficulty}
                onChange={(e) => onChange("difficulty", e.target.value)}
                placeholder="Moderate"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Slug</Label>
            <Input
              value={draft.slug}
              onChange={(e) => onChange("slug", e.target.value)}
              placeholder="great-migration-and-beyond"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
              Short Description
            </Label>
            <Textarea
              rows={3}
              value={draft.shortDescription ?? ""}
              onChange={(e) => onChange("shortDescription", e.target.value)}
              placeholder="A short summary shown on cards and listings."
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
              Full Description
            </Label>
            <Textarea
              rows={8}
              value={draft.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Describe the experience in full detail…"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6 shadow-sm space-y-4">
          {/* Hero Image Preview & Picker */}
          <div className="space-y-3">
            <Label className="mb-2 block text-[11px] tracking-[0.2em] uppercase text-foreground/60 font-semibold">
              Hero Image
            </Label>

            {/* Image Preview */}
            {draft.image && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/50 bg-cream/40">
                <img src={draft.image} alt={draft.imageAlt || draft.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onChange("image", "")}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded text-white transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Media Picker */}
            <button
              type="button"
              onClick={() => setMediaPickerOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 hover:border-gold hover:bg-cream/40 bg-background px-4 py-3 text-sm font-medium text-foreground/70 hover:text-gold transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choose from Media Library
            </button>

            <MediaLibraryPicker
              open={mediaPickerOpen}
              onOpenChange={setMediaPickerOpen}
              onSelect={(urls) => {
                const nextUrl = urls[0] ?? "";
                onChange("image", nextUrl);
              }}
            />

            {/* Manual URL Input */}
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.15em] uppercase text-foreground/50 font-semibold">
                Or paste URL directly
              </label>
              <Input
                value={draft.image}
                onChange={(e) => onChange("image", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
              Hero Alt Text
            </Label>
            <Input
              value={draft.imageAlt ?? ""}
              onChange={(e) => onChange("imageAlt", e.target.value)}
              placeholder="Describe the image"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Status</Label>
            <Input
              value={draft.status ?? "draft"}
              onChange={(e) => onChange("status", e.target.value as AdventuresSignature["status"])}
              placeholder="draft"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Highlights</Label>
            <Textarea
              rows={4}
              value={(draft.highlights ?? []).join("\n")}
              onChange={(e) =>
                onChange(
                  "highlights",
                  e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                )
              }
              placeholder="One highlight per line"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">Included</Label>
              <Textarea
                rows={4}
                value={(draft.included ?? []).join("\n")}
                onChange={(e) =>
                  onChange(
                    "included",
                    e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="One item per line"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
                Not Included
              </Label>
              <Textarea
                rows={4}
                value={(draft.notIncluded ?? []).join("\n")}
                onChange={(e) =>
                  onChange(
                    "notIncluded",
                    e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="One item per line"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={Boolean(draft.featured)}
              onChange={(e) => onChange("featured", e.target.checked)}
            />
            Featured adventure
          </label>
        </div>
      </div>
    </div>
  );
}
