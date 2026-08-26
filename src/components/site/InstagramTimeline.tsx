import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Instagram as IgIcon, Loader2, RefreshCw, ImageOff, ChevronDown } from "lucide-react";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { SiteImage } from "@/components/site/SiteImage";

type Photo = { src: string; caption: string };

const PAGE_SIZE = 4;
const MAX_SLOTS = 7;
const STORAGE_KEY = "ig-timeline-visible";

export function InstagramTimeline({ fallbackPhotos, initialData }: { fallbackPhotos: Photo[]; initialData?: unknown }) {
  // Restore last "View more" page from sessionStorage on mount.
  const [visible, setVisible] = useState<number>(() => {
    if (typeof window === "undefined") return PAGE_SIZE;
    const raw = window.sessionStorage?.getItem(STORAGE_KEY);
    const n = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n >= PAGE_SIZE ? Math.min(n, MAX_SLOTS) : PAGE_SIZE;
  });

  useEffect(() => {
    try {
      window.sessionStorage?.setItem(STORAGE_KEY, String(visible));
    } catch {}
  }, [visible]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["ig-timeline"],
    queryFn: () => getPageContent({ data: { key: "home_instagram" } }),
    initialData,
    staleTime: 60_000,
    retry: 1,
  });

  const merged: Record<string, any> = { ...PAGE_DEFAULTS.home_instagram, ...((data as any) ?? {}) };
  const url: string = merged.url ?? "";
  const handle: string = merged.handle ?? "";
  const heading: string = merged.heading ?? "Latest from Instagram";

  const photos: Photo[] = Array.from({ length: MAX_SLOTS }, (_, i) => ({
    src: (merged[`image_${i + 1}_url`] as string) || fallbackPhotos[i]?.src || "",
    caption: (merged[`image_${i + 1}_caption`] as string) || fallbackPhotos[i]?.caption || "",
  })).filter((p) => Boolean(p.src));

  const shown = photos.slice(0, visible);
  const hasMore = visible < photos.length;

  return (
    <div className="bg-background border border-border">
      <a
        href={url || "#"}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-5 border-b border-border hover:bg-cream/60 transition-colors"
      >
        <span className="h-11 w-11 rounded-full bg-gradient-to-tr from-terracotta via-gold to-forest flex items-center justify-center text-background">
          <IgIcon className="w-5 h-5" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{handle || "Instagram"}</p>
          <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 truncate">{heading}</p>
        </div>
        <span className="text-[10px] tracking-[0.2em] uppercase text-gold shrink-0">Follow</span>
      </a>

      {isLoading ? (
        <SkeletonList />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} loading={isFetching} />
      ) : photos.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ul className="divide-y divide-border" aria-busy={isFetching}>
            {shown.map((p, i) => (
              <li key={i}>
                <a
                  href={url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex gap-4 p-4 hover:bg-cream/60 transition-colors"
                  aria-label={p.caption || `Instagram post ${i + 1}`}
                >
                  <div className="w-20 h-20 shrink-0 overflow-hidden bg-cream">
                    <SiteImage
                      src={p.src}
                      sourceReady={!isLoading}
                      alt={p.caption || ""}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <p className="text-sm text-foreground leading-snug line-clamp-3 flex-1">
                      {p.caption || "View on Instagram"}
                    </p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 mt-2">
                      @{(handle || "").replace(/^@/, "")}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, photos.length))}
              className="w-full flex items-center justify-center gap-2 p-4 border-t border-border text-[11px] tracking-[0.25em] uppercase text-foreground/70 hover:text-foreground hover:bg-cream/60 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              View more posts
            </button>
          ) : (
            <a
              href={url || "#"}
              target="_blank"
              rel="noreferrer"
              className="block text-center p-4 border-t border-border text-[11px] tracking-[0.25em] uppercase text-gold hover:bg-cream/60 transition-colors"
            >
              View all on Instagram
            </a>
          )}
        </>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-border" aria-busy="true" aria-live="polite">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex gap-4 p-4">
          <div className="w-20 h-20 bg-cream animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-cream animate-pulse w-11/12" />
            <div className="h-3 bg-cream animate-pulse w-8/12" />
            <div className="h-2 bg-cream animate-pulse w-4/12 mt-3" />
          </div>
        </li>
      ))}
      <li className="flex items-center justify-center gap-2 p-3 text-[11px] tracking-wider uppercase text-foreground/50">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading posts…
      </li>
    </ul>
  );
}

function ErrorState({ onRetry, loading }: { onRetry: () => void; loading: boolean }) {
  return (
    <div className="p-8 text-center" role="alert">
      <ImageOff className="w-8 h-8 mx-auto text-foreground/40 mb-3" />
      <p className="text-sm text-foreground/70 mb-4">We couldn't load the Instagram feed right now.</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="inline-flex items-center gap-2 border border-gold text-gold uppercase tracking-[0.2em] text-[11px] px-4 py-2 hover:bg-gold hover:text-gold-foreground transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <ImageOff className="w-8 h-8 mx-auto text-foreground/40 mb-3" />
      <p className="text-sm text-foreground/60">No posts to show yet — check back soon.</p>
    </div>
  );
}
