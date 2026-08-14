import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminList, adminUpsert, adminDelete } from "@/lib/admin.functions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  Pencil,
  Eye,
  Search,
  Star,
  MapPin,
  Image as ImageIcon,
  Upload,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

const TABLE_LABELS: Record<string, string> = {
  journey_categories: "Journey Categories",
  itineraries: "Journeys",
  journal_articles: "Articles",
  lodges: "Lodges",
  destinations: "Destinations",
  testimonials: "Testimonials",
  faqs: "FAQs",
};

const TABLE_SINGULAR: Record<string, string> = {
  journey_categories: "Category",
  itineraries: "Journey",
  journal_articles: "Article",
  lodges: "Lodge",
  destinations: "Destination",
  testimonials: "Testimonial",
  faqs: "FAQ",
};

const VIEW_PATH: Record<string, (row: any) => string | null> = {
  itineraries: (r) => (r.slug ? `/adventures/${r.slug}` : null),
  destinations: (r) => (r.slug ? `/destinations/${r.slug}` : null),
  lodges: (r) => (r.slug ? `/lodges/${r.slug}` : null),
  journal_articles: (r) => (r.slug ? `/journal/${r.slug}` : null),
  journey_categories: () => "/adventures",
  testimonials: () => null,
  faqs: () => null,
};

const GROUP_FIELD: Record<string, { field: string; label: string }> = {
  destinations: { field: "region", label: "regions" },
  lodges: { field: "location", label: "locations" },
  itineraries: { field: "nights", label: "lengths" },
  journal_articles: { field: "category", label: "categories" },
  testimonials: { field: "location", label: "locations" },
  faqs: { field: "category", label: "categories" },
  journey_categories: { field: "slug", label: "categories" },
};

const IMAGE_FIELD: Record<string, string> = {
  destinations: "image",
  lodges: "hero_image",
  itineraries: "image",
  journal_articles: "image",
  journey_categories: "hero_image",
};

const SUBTITLE: Record<string, (r: any) => string> = {
  destinations: (r) => [r.country, r.region].filter(Boolean).join(", "),
  lodges: (r) => r.location ?? "",
  itineraries: (r) => r.nights ?? "",
  journal_articles: (r) => [r.category, r.date].filter(Boolean).join(" · "),
  testimonials: (r) => r.location ?? "",
  faqs: (r) => r.category ?? "",
  journey_categories: (r) => r.tagline ?? "",
};

type FieldType = "text" | "textarea" | "rich" | "number" | "bool" | "array" | "image" | "images";
type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  icon?: "pin" | "hash";
};

const FORM_LAYOUT: Record<string, { rows: FieldDef[][] }> = {
  destinations: {
    rows: [
      [{ name: "name", label: "Name", type: "text", placeholder: "e.g. Bali", icon: "pin" }],
      [
        { name: "country", label: "Country", type: "text", placeholder: "e.g. Indonesia" },
        { name: "region", label: "Region", type: "text", placeholder: "e.g. Asia" },
      ],
      [
        { name: "slug", label: "Slug", type: "text", placeholder: "auto-from-name" },
        { name: "best_season", label: "Best Season", type: "text", placeholder: "e.g. May – Oct" },
      ],
      [
        {
          name: "description",
          label: "Description",
          type: "rich",
          placeholder: "Describe this destination…",
        },
      ],
      [{ name: "image", label: "Hero Image", type: "image" }],
      [{ name: "featured_trips", label: "Featured Trips (one per line)", type: "array" }],
      [
        { name: "sort_order", label: "Sort Order", type: "number", icon: "hash" },
        { name: "published", label: "Active", type: "bool" },
      ],
    ],
  },
  lodges: {
    rows: [
      [
        {
          name: "name",
          label: "Name",
          type: "text",
          placeholder: "e.g. Singita Sabi Sand",
          icon: "pin",
        },
      ],
      [
        {
          name: "location",
          label: "Location",
          type: "text",
          placeholder: "e.g. Sabi Sand, South Africa",
        },
        { name: "slug", label: "Slug", type: "text", placeholder: "auto-from-name" },
      ],
      [
        {
          name: "description",
          label: "Description",
          type: "rich",
          placeholder: "Describe this lodge…",
        },
      ],
      [{ name: "hero_image", label: "Hero Image", type: "image" }],
      [{ name: "gallery", label: "Gallery", type: "images" }],
      [{ name: "amenities", label: "Amenities (one per line)", type: "array" }],
      [
        { name: "price_from_usd", label: "Price from (USD)", type: "number" },
        { name: "sort_order", label: "Sort Order", type: "number", icon: "hash" },
      ],
      [{ name: "published", label: "Active", type: "bool" }],
    ],
  },
  itineraries: {
    rows: [
      [
        {
          name: "name",
          label: "Name",
          type: "text",
          placeholder: "e.g. Okavango Reverie",
          icon: "pin",
        },
      ],
      [
        { name: "nights", label: "Nights", type: "text", placeholder: "e.g. 8 nights" },
        { name: "slug", label: "Slug", type: "text", placeholder: "auto-from-name" },
      ],
      [
        {
          name: "category_id",
          label: "Category ID",
          type: "text",
          placeholder: "uuid of journey_categories row",
        },
      ],
      [
        {
          name: "description",
          label: "Description",
          type: "rich",
          placeholder: "Describe this journey…",
        },
      ],
      [{ name: "highlights", label: "Highlights (one per line)", type: "array" }],
      [{ name: "image", label: "Hero Image", type: "image" }],
      [{ name: "price_from_usd", label: "Price from (USD)", type: "number" }],
      [
        { name: "sort_order", label: "Sort Order", type: "number", icon: "hash" },
        { name: "published", label: "Active", type: "bool" },
      ],
    ],
  },
  journal_articles: {
    rows: [
      [{ name: "title", label: "Title", type: "text" }],
      [
        { name: "slug", label: "Slug", type: "text" },
        { name: "category", label: "Category", type: "text" },
      ],
      [
        { name: "date", label: "Date", type: "text", placeholder: "e.g. Oct 2026" },
        { name: "read_time", label: "Read time", type: "text", placeholder: "e.g. 6 min" },
      ],
      [{ name: "excerpt", label: "Excerpt", type: "textarea" }],
      [{ name: "image", label: "Hero Image", type: "image" }],
      [{ name: "content", label: "Paragraphs (one per line)", type: "array" }],
      [
        { name: "sort_order", label: "Sort Order", type: "number", icon: "hash" },
        { name: "published", label: "Active", type: "bool" },
      ],
    ],
  },
  journey_categories: {
    rows: [
      [{ name: "title", label: "Title", type: "text" }],
      [
        { name: "slug", label: "Slug", type: "text" },
        { name: "tagline", label: "Tagline", type: "text" },
      ],
      [{ name: "intro", label: "Intro", type: "rich" }],
      [{ name: "hero_image", label: "Hero Image", type: "image" }],
      [
        { name: "sort_order", label: "Sort Order", type: "number", icon: "hash" },
        { name: "published", label: "Active", type: "bool" },
      ],
    ],
  },
  testimonials: {
    rows: [
      [{ name: "name", label: "Name", type: "text" }],
      [
        { name: "location", label: "Location", type: "text" },
        { name: "trip_taken", label: "Trip", type: "text" },
      ],
      [{ name: "quote", label: "Quote", type: "rich" }],
      [
        { name: "rating", label: "Rating (1–5)", type: "number" },
        { name: "sort_order", label: "Sort Order", type: "number", icon: "hash" },
      ],
      [{ name: "published", label: "Active", type: "bool" }],
    ],
  },
  faqs: {
    rows: [
      [{ name: "question", label: "Question", type: "text" }],
      [
        {
          name: "category",
          label: "Category",
          type: "text",
          placeholder: "planning | conservation | logistics",
        },
      ],
      [{ name: "answer", label: "Answer", type: "rich" }],
      [
        { name: "sort_order", label: "Sort Order", type: "number", icon: "hash" },
        { name: "published", label: "Active", type: "bool" },
      ],
    ],
  },
};

const SORT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  destinations: [
    { value: "sort_order", label: "Sort Order" },
    { value: "name", label: "Name" },
    { value: "country", label: "Country" },
    { value: "created_at", label: "Newest" },
  ],
  lodges: [
    { value: "sort_order", label: "Sort Order" },
    { value: "name", label: "Name" },
    { value: "price_from_usd", label: "Price" },
    { value: "created_at", label: "Newest" },
  ],
  itineraries: [
    { value: "sort_order", label: "Sort Order" },
    { value: "name", label: "Name" },
    { value: "price_from_usd", label: "Price" },
    { value: "created_at", label: "Newest" },
  ],
  journal_articles: [
    { value: "sort_order", label: "Sort Order" },
    { value: "title", label: "Title" },
    { value: "published_at", label: "Published" },
    { value: "created_at", label: "Newest" },
  ],
  journey_categories: [
    { value: "sort_order", label: "Sort Order" },
    { value: "title", label: "Title" },
  ],
  testimonials: [
    { value: "sort_order", label: "Sort Order" },
    { value: "name", label: "Name" },
    { value: "rating", label: "Rating" },
  ],
  faqs: [
    { value: "sort_order", label: "Sort Order" },
    { value: "category", label: "Category" },
  ],
};

const PAGE_SIZE = 12;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fileToBase64(file: File): Promise<{ base64: string; contentType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve({ base64, contentType: file.type || "image/jpeg", filename: file.name });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/_authenticated/admin/content/$table")({
  component: ContentAdmin,
});

function ContentAdmin() {
  const { table } = Route.useParams();
  const list = useServerFn(adminList);
  const upsert = useServerFn(adminUpsert);
  const del = useServerFn(adminDelete);
  const qc = useQueryClient();

  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("__all__");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string>("sort_order");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");

  const layout = FORM_LAYOUT[table];
  const flatFields = useMemo(() => (layout?.rows ?? []).flat(), [layout]);
  const group = GROUP_FIELD[table];
  const imageField = IMAGE_FIELD[table];
  const subtitleFn = SUBTITLE[table] ?? (() => "");
  const viewPath = VIEW_PATH[table] ?? (() => null);
  const label = TABLE_LABELS[table] ?? table;
  const singular = TABLE_SINGULAR[table] ?? "Item";
  const sortOptions = SORT_OPTIONS[table] ?? [{ value: "sort_order", label: "Sort Order" }];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", table, { page, orderBy, orderDir }],
    queryFn: () => list({ data: { table: table as any, page, pageSize: PAGE_SIZE, orderBy, orderDir } }),
  });
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const mUpsert = useMutation({
    mutationFn: (row: any) => upsert({ data: { table: table as any, row } }),
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ["admin", table] });
      toast.success("Saved");
      // Clear any rich-text drafts for this record
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(`cms:rt:${table}:${vars.id || "new"}:`)) localStorage.removeItem(k);
        });
      } catch {}
      setOpen(false);
      if (table === "destinations") setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });
  const mDel = useMutation({
    mutationFn: (id: string) => del({ data: { table: table as any, id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", table] });
      toast.success("Deleted");
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });

  const groupOptions = useMemo(() => {
    if (!group) return [] as string[];
    const set = new Set<string>();
    rows.forEach((r: any) => {
      const v = r[group.field];
      if (typeof v === "string" && v.trim()) set.add(v);
    });
    return Array.from(set).sort();
  }, [rows, group]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r: any) => {
      if (activeOnly && !r.published) return false;
      if (featuredOnly && (r.sort_order ?? 0) <= 0) return false;
      if (group && groupFilter !== "__all__" && r[group.field] !== groupFilter) return false;
      if (!q) return true;
      const title = r.name ?? r.title ?? r.question ?? "";
      const sub = subtitleFn(r);
      return (title + " " + sub).toLowerCase().includes(q);
    });
  }, [rows, search, groupFilter, activeOnly, featuredOnly, group, subtitleFn]);

  const startCreate = () => {
    const blank: any = { id: "" };
    flatFields.forEach((f) => {
      blank[f.name] =
        f.type === "bool" ? true : f.type === "number" ? 0 : f.type === "array" || f.type === "images" ? [] : "";
    });
    setEditing(blank);
    if (table !== "destinations") setOpen(true);
  };
  const startEdit = (row: any) => {
    setEditing({ ...row });
    if (table !== "destinations") setOpen(true);
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const row: any = { ...editing };
    if ("slug" in row && !row.slug) {
      const seed = row.name ?? row.title ?? row.question ?? "";
      if (seed) row.slug = slugify(String(seed));
    }
    flatFields.forEach((f) => {
      if (f.type === "number" && row[f.name] !== null && row[f.name] !== "") row[f.name] = Number(row[f.name]);
      if (f.type === "array" && typeof row[f.name] === "string") {
        row[f.name] = (row[f.name] as string)
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (f.type === "images") {
        const raw = row[f.name];
        if (typeof raw === "string") {
          row[f.name] = raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (!Array.isArray(raw)) {
          row[f.name] = [];
        }
      }
    });
    mUpsert.mutate(row);
  };

  if (table === "destinations" && editing) {
    return (
      <DestinationEditor
        editing={editing}
        fields={flatFields}
        saving={mUpsert.isPending}
        onChange={(name, value) => setEditing({ ...editing, [name]: value })}
        onBack={() => setEditing(null)}
        onSave={save}
      />
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
        <div>
          <h1 className="font-serif text-3xl">{label}</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage your {label.toLowerCase()} catalog — create, edit, and publish.
          </p>
        </div>
        <Button onClick={startCreate} className="w-full bg-gold text-gold-foreground hover:bg-gold/90 sm:w-auto">
          <Plus className="w-4 h-4 mr-1" /> Add {singular}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="mb-5 border border-border bg-background p-3 sm:mb-6 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_200px_200px_auto]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="pl-9"
            />
          </div>
          {group ? (
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger>
                <SelectValue placeholder={`All ${group.label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All {group.label}</SelectItem>
                {groupOptions.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="hidden xl:block" />
          )}
          <Select
            value={`${orderBy}:${orderDir}`}
            onValueChange={(v) => {
              const [col, dir] = v.split(":");
              setOrderBy(col);
              setOrderDir(dir as "asc" | "desc");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((s) => (
                <span key={s.value}>
                  <SelectItem value={`${s.value}:asc`}>{s.label} ↑</SelectItem>
                  <SelectItem value={`${s.value}:desc`}>{s.label} ↓</SelectItem>
                </span>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-5 px-1 sm:col-span-2 xl:col-span-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={featuredOnly} onCheckedChange={(v) => setFeaturedOnly(!!v)} />
              <span>Featured</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={activeOnly} onCheckedChange={(v) => setActiveOnly(!!v)} />
              <span>Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Card grid */}
      {isLoading ? (
        <div
          className={`grid gap-4 sm:grid-cols-2 ${table === "destinations" ? "lg:grid-cols-4 xl:grid-cols-5" : "lg:grid-cols-3"} sm:gap-5`}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border bg-background overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border bg-background p-16 text-center text-foreground/60">
          No {label.toLowerCase()} match your filters.
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:grid-cols-2 ${table === "destinations" ? "lg:grid-cols-4 xl:grid-cols-5" : "lg:grid-cols-3"} sm:gap-5`}
        >
          {filtered.map((row: any) => {
            const img = imageField ? row[imageField] : null;
            const title = row.name ?? row.title ?? row.question ?? "Untitled";
            const sub = subtitleFn(row);
            const featured = (row.sort_order ?? 0) > 0;
            const href = viewPath(row);
            return (
              <article
                key={row.id}
                className="group border border-border bg-background overflow-hidden flex flex-col transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] bg-cream overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/30">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  {featured && (
                    <Badge className="absolute top-3 right-3 bg-gold text-gold-foreground hover:bg-gold border-0 shadow">
                      <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                    </Badge>
                  )}
                  {!row.published && (
                    <Badge variant="secondary" className="absolute top-3 left-3">
                      Draft
                    </Badge>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-serif text-lg leading-tight">{title}</h3>
                  {sub && (
                    <p className="text-sm text-foreground/60 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 opacity-60" /> {sub}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-border flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(row)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    {href ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={href} target="_blank" rel="noreferrer">
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => setDeleteTarget(row)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-foreground/60">
            Page {page} of {totalPages} · {total} total
            {isFetching && <Loader2 className="w-3 h-3 inline ml-2 animate-spin" />}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      {table !== "destinations" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-7xl gap-0 overflow-hidden p-0 sm:w-[calc(100%-3rem)]">
            <DialogHeader className="shrink-0 border-b border-border bg-cream/60 px-5 py-4 pr-12 sm:px-7 sm:py-5">
              <DialogTitle className="font-serif text-2xl">
                {editing?.id ? `Edit ${singular}` : `New ${singular}`}
              </DialogTitle>
              <DialogDescription>
                {editing?.id
                  ? `Update the details for this ${singular.toLowerCase()}.`
                  : `Create a new ${singular.toLowerCase()} to showcase on your platform.`}
              </DialogDescription>
            </DialogHeader>

            {editing && layout && (
              <form onSubmit={save} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-cream/20 p-4 sm:p-6">
                  {layout.rows.map((row, ri) => (
                    <div key={ri} className={row.length > 1 ? "grid gap-4 lg:grid-cols-2" : ""}>
                      {row.map((f) => (
                        <FieldInput
                          key={f.name}
                          field={f}
                          value={editing[f.name]}
                          onChange={(v) => setEditing({ ...editing, [f.name]: v })}
                          autosaveKey={`cms:rt:${table}:${editing.id || "new"}:${f.name}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                <DialogFooter className="shrink-0 border-t border-border bg-background px-4 py-3 sm:px-6 sm:py-4 gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={mUpsert.isPending}
                    className="bg-gold text-gold-foreground hover:bg-gold/90"
                  >
                    {mUpsert.isPending ? "Saving…" : editing?.id ? `Update ${singular}` : `Create ${singular}`}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name ?? deleteTarget?.title ?? deleteTarget?.question ?? "this item"}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && mDel.mutate(deleteTarget.id)}
              disabled={mDel.isPending}
            >
              {mDel.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  autosaveKey,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  autosaveKey?: string;
}) {
  if (field.type === "bool") {
    return (
      <div className="flex items-center gap-2 pt-6">
        <Checkbox checked={!!value} onCheckedChange={(v) => onChange(!!v)} id={field.name} />
        <Label htmlFor={field.name} className="cursor-pointer">
          {field.label}
        </Label>
      </div>
    );
  }
  const iconEl =
    field.icon === "pin" ? (
      <MapPin className="w-4 h-4" />
    ) : field.icon === "hash" ? (
      <span className="text-xs">#</span>
    ) : null;

  if (field.type === "image") {
    return <ImageField label={field.label} value={value ?? ""} onChange={onChange} />;
  }

  if (field.type === "images") {
    const arr = Array.isArray(value)
      ? (value as string[])
      : typeof value === "string" && value
        ? (value as string)
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    return <MultiImageUploader label={field.label} value={arr} onChange={onChange} />;
  }

  if (field.type === "rich") {
    return (
      <div>
        <Label className="mb-1.5 block">{field.label}</Label>
        <RichTextEditor
          value={value ?? ""}
          onChange={onChange}
          autosaveKey={autosaveKey}
          placeholder={field.placeholder}
        />
      </div>
    );
  }

  return (
    <div>
      <Label className="mb-1.5 block">{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea
          rows={4}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "array" ? (
        <Textarea
          rows={4}
          value={Array.isArray(value) ? (value as string[]).join("\n") : (value ?? "")}
          placeholder={field.placeholder ?? "One per line"}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "number" ? (
        <div className="relative">
          {iconEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">{iconEl}</span>}
          <Input
            type="number"
            value={value ?? 0}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={iconEl ? "pl-9" : ""}
          />
        </div>
      ) : (
        <div className="relative">
          {iconEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">{iconEl}</span>}
          <Input
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={iconEl ? "pl-9" : ""}
          />
        </div>
      )}
    </div>
  );
}

function DestinationEditor({
  editing,
  fields,
  saving,
  onChange,
  onBack,
  onSave,
}: {
  editing: any;
  fields: FieldDef[];
  saving: boolean;
  onChange: (name: string, value: any) => void;
  onBack: () => void;
  onSave: (event: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSave} className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Destination editor</p>
          <h1 className="font-serif text-3xl">{editing.id ? "Edit destination" : "New destination"}</h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to destinations
          </Button>
          <Button type="submit" disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
            {saving ? "Saving…" : "Save destination"}
          </Button>
        </div>
      </header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="space-y-5 border border-border bg-background p-5 sm:p-6">
          {fields
            .filter((field) => !["image", "sort_order", "published"].includes(field.name))
            .map((field) => (
              <FieldInput
                key={field.name}
                field={field}
                value={editing[field.name]}
                onChange={(value) => onChange(field.name, value)}
                autosaveKey={`cms:rt:destinations:${editing.id || "new"}:${field.name}`}
              />
            ))}
        </section>
        <aside className="space-y-5">
          {fields
            .filter((field) => ["image", "sort_order", "published"].includes(field.name))
            .map((field) => (
              <div key={field.name} className="border border-border bg-background p-5">
                <FieldInput
                  field={field}
                  value={editing[field.name]}
                  onChange={(value) => onChange(field.name, value)}
                />
              </div>
            ))}
        </aside>
      </div>
    </form>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <ImageUploader label={label} value={value} onChange={onChange} />;
}
