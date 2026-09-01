import { useEffect, useState, type ImgHTMLAttributes } from "react";

type SiteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  /** CMS/source image. */
  src?: string | null;
  /** Local/static fallback, only eligible after sourceReady is true. */
  fallback?: string | null;
  /** Set false while the CMS source is still being resolved. */
  sourceReady?: boolean;
};

function normalize(value?: string | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

const WIDTH_LADDER = [320, 640, 960, 1280, 1920];

/**
 * CMS media is served by /api/public/media/*, which can render resized WebP
 * derivatives via `?w=`. Build a srcSet for those URLs only — bundled assets
 * and remote URLs are left untouched.
 */
function buildMediaSrcSet(src: string, widths: number[]): string | undefined {
  if (!src.startsWith("/api/public/media/")) return undefined;
  const sep = src.includes("?") ? "&" : "?";
  return widths.map((w) => `${src}${sep}w=${w} ${w}w`).join(", ");
}

export function SiteImage({
  src,
  fallback,
  sourceReady = true,
  responsiveWidths = WIDTH_LADDER,
  srcSet,
  onError,
  ...props
}: SiteImageProps) {
  const source = normalize(src);
  const safeFallback = normalize(fallback);
  const [failedSource, setFailedSource] = useState<string | null>(null);

  useEffect(() => {
    setFailedSource(null);
  }, [source]);

  // Never paint a static fallback while a CMS source is still loading.
  const displaySrc =
    source && failedSource !== source
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

  return (
    <img
      {...props}
      src={displaySrc}
      srcSet={srcSet ?? buildMediaSrcSet(displaySrc, responsiveWidths)}
      onError={(event) => {
        if (source && displaySrc === source) {
          setFailedSource(source);
        }
        onError?.(event);
      }}
    />
  );
}
