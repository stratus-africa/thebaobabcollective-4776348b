import { useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SiteImage } from "@/components/site/SiteImage";

export type LightboxImage = { src: string; caption?: string; alt?: string };

export function Lightbox({
  images,
  open,
  onOpenChange,
  index,
  onIndexChange,
  title,
}: {
  images: LightboxImage[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  index: number;
  onIndexChange: (i: number) => void;
  title?: string;
}) {
  const count = images.length;
  const current = images[index];
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const next = useCallback(() => {
    if (count === 0) return;
    onIndexChange((index + 1) % count);
  }, [count, index, onIndexChange]);

  const prev = useCallback(() => {
    if (count === 0) return;
    onIndexChange((index - 1 + count) % count);
  }, [count, index, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          onIndexChange(0);
          break;
        case "End":
          e.preventDefault();
          onIndexChange(count - 1);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, onIndexChange, count]);

  if (!current) return null;
  const captionId = "lightbox-caption";
  const liveId = "lightbox-live";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 border-0 bg-black/95 max-w-[100vw] w-screen h-[100dvh] sm:max-w-[100vw] rounded-none flex flex-col [&>button]:hidden"
        aria-describedby={current.caption ? captionId : "lightbox-desc"}
        aria-roledescription="image carousel"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          closeRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">{title ?? "Gallery"}</DialogTitle>
        <DialogDescription id="lightbox-desc" className="sr-only">
          Use left and right arrow keys to navigate. Press Escape to close.
        </DialogDescription>
        <div id={liveId} aria-live="polite" aria-atomic="true" className="sr-only">
          Image {index + 1} of {count}
          {current.caption ? `: ${current.caption}` : ""}
        </div>

        <div className="absolute top-3 right-3 z-20 flex items-center gap-3 text-white/90 text-xs">
          <span aria-hidden="true" className="tabular-nums tracking-wider">
            {index + 1} / {count}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close gallery"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className="relative flex-1 flex items-center justify-center px-2 sm:px-12"
          role="group"
          aria-label={`Image ${index + 1} of ${count}`}
        >
          {count > 1 && (
            <button
              type="button"
              onClick={prev}
              aria-label={`Previous image (${((index - 1 + count) % count) + 1} of ${count})`}
              className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>
          )}
          <SiteImage
            src={current.src}
            alt={current.alt ?? current.caption ?? `Image ${index + 1} of ${count}`}
            aria-describedby={current.caption ? captionId : undefined}
            baseWidth={1920}
            responsiveWidths={[640, 960, 1280, 1920]}
            sizes="100vw"
            className="max-h-[85vh] max-w-full object-contain select-none"
            draggable={false}
          />
          {count > 1 && (
            <button
              type="button"
              onClick={next}
              aria-label={`Next image (${((index + 1) % count) + 1} of ${count})`}
              className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>
          )}
        </div>

        {current.caption && (
          <figcaption
            id={captionId}
            className="px-6 py-4 text-center text-white/85 text-sm"
          >
            {current.caption}
          </figcaption>
        )}
      </DialogContent>
    </Dialog>
  );
}
