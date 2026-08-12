import { useMemo, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminDeleteArticle,
  adminListArticles,
  adminUploadJournalImage,
  adminUpsertArticle,
} from "@/lib/journal-admin.functions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  CalendarClock,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/journal")({
  component: JournalAdmin,
});

type Article = {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  image?: string | null;
  date?: string | null;
  read_time?: string | null;
  category?: string | null;
  author?: string | null;
  content: string[];
  sort_order?: number | null;
  published: boolean;
  scheduled_at?: string | null;
  published_at?: string | null;
};

const EMPTY: Article = {
  slug: "",
  title: "",
  excerpt: "",
  image: "",
  date: "",
  read_time: "",
  category: "",
  author: "",
  content: [],
  sort_order: 0,
  published: false,
  scheduled_at: null,
  published_at: null,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusOf(a: Article): { label: string; tone: string } {
  if (a.published) return { label: "Published", tone: "bg-forest text-forest-foreground" };
  if (a.scheduled_at && new Date(a.scheduled_at).getTime() > Date.now())
    return { label: "Scheduled", tone: "bg-gold text-gold-foreground" };
  return { label: "Draft", tone: "bg-muted text-foreground/70" };
}

function JournalAdmin() {
  const list = useServerFn(adminListArticles);
  const upsert = useServerFn(adminUpsertArticle);
  const del = useServerFn(adminDeleteArticle);
  const upload = useServerFn(adminUploadJournalImage);
  const qc = useQueryClient();

  const [editing, setEditing] = useState<Article | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "scheduled" | "draft">("all");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "journal_articles"],
    queryFn: () => list(),
  });

  const mUpsert = useMutation({
    mutationFn: (row: Article) => upsert({ data: row as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "journal_articles"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article saved");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "journal_articles"] });
      toast.success("Article deleted");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete"),
  });

  const filtered = useMemo(() => {
    const all = (data ?? []) as Article[];
    const needle = q.trim().toLowerCase();
    return all.filter((a) => {
      if (filter === "published" && !a.published) return false;
      if (
        filter === "scheduled" &&
        !(!a.published && a.scheduled_at && new Date(a.scheduled_at).getTime() > Date.now())
      )
        return false;
      if (filter === "draft" && (a.published || (a.scheduled_at && new Date(a.scheduled_at).getTime() > Date.now())))
        return false;
      if (!needle) return true;
      return (
        a.title.toLowerCase().includes(needle) ||
        a.slug.toLowerCase().includes(needle) ||
        (a.category ?? "").toLowerCase().includes(needle)
      );
    });
  }, [data, q, filter]);

  const startNew = () => {
    setEditing({ ...EMPTY });
    setOpen(true);
  };
  const startEdit = (a: Article) => {
    setEditing({ ...a, content: a.content ?? [] });
    setOpen(true);
  };

  const onChange = <K extends keyof Article>(k: K, v: Article[K]) => {
    setEditing((prev) => (prev ? { ...prev, [k]: v } : prev));
  };

  const onPickImage = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setUploading(true);
    try {
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      const res = await upload({
        data: {
          filename: file.name,
          contentType: file.type || "image/jpeg",
          base64,
        },
      });
      onChange("image", res.url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title is required");
    const row: Article = {
      ...editing,
      slug: editing.slug.trim() || slugify(editing.title),
      content: Array.isArray(editing.content)
        ? editing.content
        : String(editing.content || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
      scheduled_at: editing.scheduled_at ? new Date(editing.scheduled_at).toISOString() : null,
    };
    mUpsert.mutate(row);
  };

  const quickPublishToggle = (a: Article) => {
    mUpsert.mutate({
      ...a,
      published: !a.published,
      scheduled_at: !a.published ? null : (a.scheduled_at ?? null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Journal</h1>
          <p className="text-sm text-foreground/60">Create, schedule and publish stories from the field.</p>
        </div>
        <Button onClick={startNew} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="w-4 h-4 mr-1.5" /> New Article
        </Button>
      </div>

      <div className="bg-background border border-border rounded-lg p-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title, slug, category…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {(["all", "published", "scheduled", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[11px] tracking-[0.2em] uppercase border rounded-md ${
                filter === f
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-foreground/70 hover:border-gold hover:text-gold"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream">
            <tr className="text-left text-[11px] tracking-[0.2em] uppercase text-foreground/70">
              <th className="p-3">Article</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Schedule</th>
              <th className="p-3 w-44 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-foreground/60">
                  <Loader2 className="inline w-4 h-4 mr-2 animate-spin" /> Loading…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-foreground/60">
                  <FileText className="inline w-5 h-5 mr-2" /> No articles yet. Create your first story.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const s = statusOf(a);
              return (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="p-3">
                    <div className="flex gap-3 items-start">
                      {a.image ? (
                        <img src={a.image} alt="" className="w-14 h-14 rounded-md object-cover border border-border" />
                      ) : (
                        <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-foreground/40">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{a.title}</p>
                        <p className="text-xs text-foreground/50 truncate">/{a.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-foreground/70">{a.category ?? "—"}</td>
                  <td className="p-3">
                    <span className={`inline-block text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded ${s.tone}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="p-3 text-foreground/70 text-xs">
                    {a.scheduled_at
                      ? new Date(a.scheduled_at).toLocaleString()
                      : a.published_at
                        ? `Published ${new Date(a.published_at).toLocaleDateString()}`
                        : "—"}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => quickPublishToggle(a)}
                      title={a.published ? "Unpublish" : "Publish now"}
                      className="text-foreground/60 hover:text-gold mr-3"
                    >
                      {a.published ? <EyeOff className="w-4 h-4 inline" /> : <Eye className="w-4 h-4 inline" />}
                    </button>
                    <button onClick={() => startEdit(a)} className="text-foreground/60 hover:text-foreground mr-3">
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => {
                        if (a.id && confirm(`Delete "${a.title}"?`)) mDelete.mutate(a.id);
                      }}
                      className="text-foreground/60 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0 sm:w-[calc(100%-3rem)]">
          <DialogHeader className="shrink-0 border-b border-border bg-cream/60 px-5 py-4 pr-12 sm:px-7 sm:py-5">
            <DialogTitle className="font-serif text-2xl">{editing?.id ? "Edit article" : "New article"}</DialogTitle>
            <DialogDescription>Save as draft, schedule for later, or publish immediately.</DialogDescription>
          </DialogHeader>

          {editing && (
            <form onSubmit={save} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-cream/20 p-4 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Title</Label>
                    <Input
                      value={editing.title}
                      onChange={(e) => {
                        const t = e.target.value;
                        setEditing((p) => (p ? { ...p, title: t, slug: p.slug || slugify(t) } : p));
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={editing.slug}
                      onChange={(e) => onChange("slug", slugify(e.target.value))}
                      placeholder="auto-generated-from-title"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={editing.category ?? ""}
                      onChange={(e) => onChange("category", e.target.value)}
                      placeholder="Conservation, Field Notes…"
                    />
                  </div>
                  <div>
                    <Label>Author</Label>
                    <Input
                      value={editing.author ?? ""}
                      onChange={(e) => onChange("author", e.target.value)}
                      placeholder="By line"
                    />
                  </div>
                  <div>
                    <Label>Read time</Label>
                    <Input
                      value={editing.read_time ?? ""}
                      onChange={(e) => onChange("read_time", e.target.value)}
                      placeholder="5 min read"
                    />
                  </div>
                  <div>
                    <Label>Display date</Label>
                    <Input
                      value={editing.date ?? ""}
                      onChange={(e) => onChange("date", e.target.value)}
                      placeholder="June 2026"
                    />
                  </div>
                  <div>
                    <Label>Sort order</Label>
                    <Input
                      type="number"
                      value={editing.sort_order ?? 0}
                      onChange={(e) => onChange("sort_order", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Hero image</Label>
                  <ImageUploader
                    value={editing.image ?? ""}
                    onChange={(v: string) => onChange("image", v)}
                    uploadFn={upload as any}
                    maxSizeMB={5}
                  />
                </div>

                <div>
                  <Label>Excerpt</Label>
                  <Textarea
                    rows={2}
                    value={editing.excerpt ?? ""}
                    onChange={(e) => onChange("excerpt", e.target.value)}
                    placeholder="One-line summary shown on the journal index"
                  />
                </div>

                <div>
                  <Label>Content (one paragraph per line)</Label>
                  <Textarea
                    rows={10}
                    value={Array.isArray(editing.content) ? editing.content.join("\n") : (editing.content ?? "")}
                    onChange={(e) => onChange("content", e.target.value.split("\n").map((s) => s) as any)}
                  />
                  <p className="text-xs text-foreground/50 mt-1">
                    Each blank line starts a new paragraph in the article.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4 bg-cream/40 space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground inline-flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-gold" /> Publishing
                      </p>
                      <p className="text-xs text-foreground/60">Toggle live, or set a future time to auto-publish.</p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={!!editing.published} onCheckedChange={(v) => onChange("published", !!v)} />
                      <span className="text-sm">Published</span>
                    </label>
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-gold" /> Schedule (optional)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={toLocalInput(editing.scheduled_at)}
                      onChange={(e) =>
                        onChange("scheduled_at", e.target.value ? new Date(e.target.value).toISOString() : null)
                      }
                    />
                    <p className="text-xs text-foreground/50 mt-1">
                      When this time arrives, the article auto-publishes on the next view.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border bg-background px-4 py-3 sm:px-6 sm:py-4">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mUpsert.isPending}
                  className="bg-gold text-gold-foreground hover:bg-gold/90"
                >
                  {mUpsert.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Save article
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
