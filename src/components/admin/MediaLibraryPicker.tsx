import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Search,
  HardDrive,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminListMedia } from "@/lib/admin.functions";

type MediaItem = {
  path: string;
  url: string;
  name: string;
  size: number;
  updated_at: string;
};

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "size-desc" | "size-asc";

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

export const MEDIA_LIBRARY_QUERY_KEY = ["admin", "media", "library"] as const;

function humanSize(bytes: number) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibraryPicker({
  open,
  onOpenChange,
  onSelect,
  multi = false,
  title = "Media library",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (urls: string[]) => void;
  multi?: boolean;
  title?: string;
}) {
  const list = useServerFn(adminListMedia);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [selected, setSelected] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Debounce search input (250ms) — keeps big libraries responsive.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, refetch, isFetching } = useQuery<MediaItem[]>({
    queryKey: [...MEDIA_LIBRARY_QUERY_KEY, { open }],
    queryFn: () => list({ data: { limit: 500 } }) as unknown as Promise<MediaItem[]>,
    enabled: open,
    staleTime: 15_000,
  });

  const filteredSorted = useMemo(() => {
    if (!data) return [] as MediaItem[];
    const q = search.toLowerCase();
    const filtered = q ? data.filter((m) => m.name.toLowerCase().includes(q)) : data;
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (a.updated_at ?? "").localeCompare(b.updated_at ?? "");
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "size-desc":
          return (b.size ?? 0) - (a.size ?? 0);
        case "size-asc":
          return (a.size ?? 0) - (b.size ?? 0);
        case "newest":
        default:
          return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
      }
    });
    return sorted;
  }, [data, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filteredSorted.slice(pageStart, pageStart + pageSize);

  function toggle(url: string) {
    if (multi) {
      setSelected((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
    } else {
      onSelect([url]);
      onOpenChange(false);
    }
  }

  function moveSelected(from: number, to: number) {
    if (from === to || to < 0 || to >= selected.length) return;
    setSelected((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  }

  function confirm() {
    if (selected.length) onSelect(selected);
    setSelected([]);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSelected([]);
          setDragIndex(null);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-7xl gap-4 sm:w-[calc(100%-3rem)]">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {multi
              ? "Select images, drag to set their order, then add them to your gallery."
              : "Pick an image you've already uploaded."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by filename…"
              className="pl-9"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as SortKey);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <Calendar className="w-3.5 h-3.5 inline mr-2" />
                Newest first
              </SelectItem>
              <SelectItem value="oldest">
                <Calendar className="w-3.5 h-3.5 inline mr-2" />
                Oldest first
              </SelectItem>
              <SelectItem value="name-asc">
                <ArrowDownAZ className="w-3.5 h-3.5 inline mr-2" />
                Name A–Z
              </SelectItem>
              <SelectItem value="name-desc">
                <ArrowUpAZ className="w-3.5 h-3.5 inline mr-2" />
                Name Z–A
              </SelectItem>
              <SelectItem value="size-desc">
                <HardDrive className="w-3.5 h-3.5 inline mr-2" />
                Largest first
              </SelectItem>
              <SelectItem value="size-asc">
                <HardDrive className="w-3.5 h-3.5 inline mr-2" />
                Smallest first
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto rounded-md border border-border bg-cream/30 p-2 sm:p-3">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-md bg-foreground/5 animate-pulse" />
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-foreground/60">
              <ImageIcon className="w-8 h-8 mb-2 opacity-60" />
              <p className="text-sm">{search ? "No images match that search." : "No images uploaded yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pageItems.map((m) => {
                const active = selected.includes(m.url);
                return (
                  <button
                    key={m.path}
                    type="button"
                    onClick={() => toggle(m.url)}
                    className={`group relative aspect-square rounded-md overflow-hidden border-2 transition-all bg-background text-left ${
                      active ? "border-gold ring-2 ring-gold/30" : "border-border hover:border-gold/70"
                    }`}
                    title={m.name}
                  >
                    <img
                      src={m.url}
                      alt={m.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-[10px] text-white/90 truncate">{m.name}</p>
                      <p className="text-[9px] text-white/65 truncate">{humanSize(m.size)}</p>
                    </div>
                    {active && (
                      <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-gold text-gold-foreground flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredSorted.length > pageSize && (
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <span>
              {pageStart + 1}–{Math.min(pageStart + pageSize, filteredSorted.length)} of {filteredSorted.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Selected preview + drag-to-reorder (multi mode) */}
        {multi && selected.length > 0 && (
          <div className="rounded-md border border-border bg-background p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] tracking-[0.2em] uppercase text-foreground/60">Selected order</p>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-[11px] text-foreground/60 hover:text-destructive"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) moveSelected(dragIndex, idx);
                    setDragIndex(null);
                  }}
                  className="relative h-16 w-16 rounded-md overflow-hidden border border-border bg-cream cursor-grab active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-end justify-between p-0.5 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-[9px] text-white/90 font-medium px-1">{idx + 1}</span>
                    <GripVertical className="w-3 h-3 text-white/80" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {multi && (
          <DialogFooter>
            <p className="text-xs text-foreground/60 mr-auto self-center">{selected.length} selected</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={!selected.length}>
              Add {selected.length ? `(${selected.length})` : ""}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
