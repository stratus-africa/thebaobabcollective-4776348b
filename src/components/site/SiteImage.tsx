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

export function SiteImage({
  src,
  fallback,
  sourceReady = true,
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
      onError={(event) => {
        if (source && displaySrc === source) {
          setFailedSource(source);
        }
        onError?.(event);
      }}
    />
  );
}
