import { useEffect, useState, type ImgHTMLAttributes } from "react";

type SiteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  /** CMS/source image. */
  src?: string | null;
  /** Local/static fallback, only eligible after sourceReady is true. */
  fallback?: string | null;
  /** Set false while the CMS source is still being resolved. */
  sourceReady?: boolean;
  /** Candidate widths used to build a srcSet for CMS media URLs. */
  responsiveWidths?: number[];
  /** Width used for the plain `src` of a CMS media URL (srcSet fallback). */
  baseWidth?: number;
};

function normalize(value?: string | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

const WIDTH_LADDER = [320, 640, 960, 1280, 1920];

const isCmsMedia = (src: string) => src.startsWith("/api/public/media/");

/**
 * Module-level caches shared by every SiteImage instance.
 *
 * `failedSources` means a URL that 404s once (an image deleted from the media
 * library, say) instantly renders its fallback everywhere else on the page
 * instead of each card re-requesting the same broken file.
 */
const failedSources = new Set<string>();
const resolvedSources = new Map<string, string>();

function withWidth(src: string, width: number) {
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}w=${width}`;
}

/**
 * CMS media is served by /api/public/media/*, which can render resized WebP
 * derivatives via `?w=`. Build a srcSet for those URLs only — bundled assets
 * and remote URLs are left untouched.
 */
function buildMediaSrcSet(src: string, widths: number[]): string | undefined {
  if (!isCmsMedia(src)) return undefined;
  const key = `${src}|${widths.join(",")}`;
  const cached = resolvedSources.get(key);
  if (cached) return cached;
  const value = widths.map((w) => `${withWidth(src, w)} ${w}w`).join(", ");
  resolvedSources.set(key, value);
  return value;
}

export function SiteImage({
  src,
  fallback,
  sourceReady = true,
  responsiveWidths = WIDTH_LADDER,
  baseWidth,
  srcSet,
  sizes,
  decoding = "async",
  onError,
  ...props
}: SiteImageProps) {
  const source = normalize(src);
  const safeFallback = normalize(fallback);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (source && failedSources.has(source)) forceRender((n) => n + 1);
  }, [source]);

  // Never paint a static fallback while a CMS source is still loading.
  const displaySrc =
    source && !failedSources.has(source)
      ? source
      : sourceReady
        ? safeFallback
        : null;

  if (!displaySrc) {
    return (
      <div
        aria-hidden="true"
        className={props.className}
        style={props.style}
      />
    );
  }

  const computedSrcSet = srcSet ?? buildMediaSrcSet(displaySrc, responsiveWidths);

  // For CMS media, point `src` at a sized derivative too — otherwise browsers
  // that ignore srcSet (or preload scanners) pull the full-size original.
  const resolvedSrc = isCmsMedia(displaySrc)
    ? withWidth(displaySrc, baseWidth ?? responsiveWidths[responsiveWidths.length - 1] ?? 1280)
    : displaySrc;

  return (
    <img
      {...props}
      src={resolvedSrc}
      srcSet={computedSrcSet}
      sizes={computedSrcSet ? (sizes ?? "100vw") : sizes}
      decoding={decoding}
      onError={(event) => {
        if (source && displaySrc === source) {
          failedSources.add(source);
          forceRender((n) => n + 1);
        }
        onError?.(event);
      }}
    />
  );
}
