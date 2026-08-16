import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  Search,
  Copy,
  Check,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  X,
  RotateCcw,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { adminListMedia, adminUploadImage } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings.functions";
import { resolveWatermarkPolicy } from "@/lib/watermark";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: MediaLibraryAdmin,
});

type MediaItem = {
  path: string;
  url: string;
  name: string;
  size: number;
  updated_at: string;
};

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "size-desc" | "size-asc";

function humanSize(bytes: number) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MediaLibraryAdmin() {
  const listFn = useServerFn(adminListMedia);
  const uploadFn = useServerFn(adminUploadImage);
  const saveSettings = useServerFn(saveSiteSettings);
  const fetchSettings = useServerFn(getSiteSettings);
  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
  });
  const qc = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "media", "full-library", { search, sort, page, pageSize }],
    queryFn: () => listFn({ data: { search, sort, page, pageSize } }),
  });

  const allItems = (data ?? []) as MediaItem[];
  const total = allItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = useMemo(() => {
    const sorted = [...allItems].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.updated_at.localeCompare(b.updated_at);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "size-desc":
          return b.size - a.size;
        case "size-asc":
          return a.size - b.size;
        case "newest":
        default:
          return b.updated_at.localeCompare(a.updated_at);
      }
    });

    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [allItems, page, pageSize, sort]);

  // Handle single or multi-file upload
  const handleFiles = async (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!/^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.type)) {
        toast.error(`${file.name}: Unsupported image type.`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 8MB limit.`);
        continue;
      }

      try {
        const buf = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let j = 0; j < buf.length; j++) binary += String.fromCharCode(buf[j]);

        await uploadFn({
          data: {
            filename: file.name,
            contentType: file.type || "image/jpeg",
            base64: btoa(binary),
          },
        });
        successCount++;
      } catch (err: any) {
        toast.error(`${file.name}: ${err?.message ?? "Upload failed"}`);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} image${successCount === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["admin", "media"] });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("Image URL copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const updateWatermarkOverride = async (imagePath: string, enabled: boolean) => {
    const branding = settingsQuery.data?.branding ?? {};
    const nextOverrides = { ...(branding.watermark_overrides ?? {}) };
    const effectiveGlobal = Boolean(branding.watermark_enabled);
    if (enabled === effectiveGlobal) delete nextOverrides[imagePath];
    else nextOverrides[imagePath] = { enabled };

    await saveSettings({
      data: {
        contact: settingsQuery.data?.contact ?? {},
        branding: { ...branding, watermark_overrides: nextOverrides },
        currency: settingsQuery.data?.currency ?? { code: "USD", symbol: "$" },
      },
    });
    await qc.invalidateQueries({ queryKey: ["site-settings"] });
    await qc.invalidateQueries({ queryKey: ["admin", "media"] });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="rounded-xl border border-border bg-background p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.28em] uppercase font-semibold text-gold">ASSET MANAGER</span>
              <span className="text-foreground/30">•</span>
              <span className="text-[11px] text-foreground/55">{total} Assets</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">Media Library</h1>
            <p className="text-sm text-foreground/60 max-w-xl">
              Upload, browse and manage high-resolution safari and destination images across the site.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1.5" /> Upload Media
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Drag & Drop Upload Dropzone ── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-6 md:p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-gold bg-gold/10" : "border-border bg-background hover:border-gold/60 hover:bg-cream/30"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Drop images here or click to browse files</p>
            <p className="text-xs text-foreground/50 mt-0.5">Supports PNG, JPG, WEBP, GIF, AVIF — up to 8MB each</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-foreground/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search images by name…"
              className="pl-9 pr-8 text-xs h-9 bg-cream/40"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
              <span>Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-border bg-cream/40 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="size-desc">Size (Largest)</option>
                <option value="size-asc">Size (Smallest)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-md border border-border bg-cream/40 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
                <option value="96">96</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Media Grid ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background p-12 text-center text-foreground/60 space-y-3">
          <ImageIcon className="w-10 h-10 mx-auto text-foreground/30" />
          <h3 className="font-serif text-xl text-foreground">No media found</h3>
          <p className="text-xs max-w-sm mx-auto text-foreground/50">
            {search ? `No images match "${search}".` : "Your media library is empty. Upload your first image above."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const isSelected = selectedItem?.path === item.path;
            const isCopied = copiedUrl === item.url;

            return (
              <div
                key={item.path}
                onClick={() => setSelectedItem(item)}
                className={`group relative aspect-square rounded-lg border bg-background overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-gold border-gold" : "border-border"
                }`}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.url);
                      }}
                      title="Copy URL"
                      className="p-1 rounded bg-black/60 text-white hover:bg-gold hover:text-gold-foreground transition-colors shadow"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="text-white text-[11px] leading-tight">
                    <p className="font-medium truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-white/70 text-[10px] mt-0.5">{humanSize(item.size)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
          <span className="text-foreground/60">
            Page {page} of {totalPages} ({total} total items)
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Detail Drawer Modal for Selected Image ── */}
      {selectedItem && (
        <div className="fixed inset-x-0 bottom-0 top-auto z-40 bg-background border-t border-border shadow-2xl p-4 md:p-6 transition-transform">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 rounded border border-border bg-cream overflow-hidden shrink-0">
                <img src={selectedItem.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm text-foreground truncate">{selectedItem.name}</h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  {humanSize(selectedItem.size)} · Uploaded {new Date(selectedItem.updated_at).toLocaleDateString()}
                </p>
                <p className="text-[11px] text-foreground/45 font-mono truncate max-w-md mt-1">{selectedItem.url}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 rounded-md border border-border bg-cream/40 px-3 py-2 text-xs">
                <span className="text-foreground/65">Watermark</span>
                <Switch
                  checked={resolveWatermarkPolicy(settingsQuery.data?.branding ?? null, selectedItem.path).enabled}
                  onCheckedChange={(checked) => updateWatermarkOverride(selectedItem.path, checked)}
                  disabled={settingsQuery.isLoading}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedItem.url)} className="text-xs">
                {copiedUrl === selectedItem.url ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy URL
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)} className="text-xs">
                <X className="w-3.5 h-3.5" /> Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
