// Pure helpers for media path/URL handling. The actual bytes now live in
// Supabase Storage (see media-storage.ts) rather than on local disk — local
// disk isn't persistent across the multiple instances/regions that serve
// SSR requests on Lovable's hosting, which caused uploads to "disappear"
// from the Media Library.
import { isSafePublicMediaPath } from "./public-media-path";

export function getMediaMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  return "application/octet-stream";
}

export function isRemoteMediaUrl(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed) || /^data:/i.test(trimmed);
}

export function toPublicMediaUrl(mediaPath: string): string {
  if (!mediaPath) return "";
  const trimmed = mediaPath.trim();
  if (isRemoteMediaUrl(trimmed)) return trimmed;
  const clean = trimmed.replace(/^\/+/, "");
  return `/api/public/media/${clean}`;
}

// Validates a media path of the form `cms/<filename>` and, if safe, returns
// the storage object key (filename only) used inside the Supabase Storage
// bucket. Returns null for anything unsafe or not under the `cms/` prefix.
export function resolveMediaObjectKey(rawPath: string | null | undefined): string | null {
  if (typeof rawPath !== "string") return null;

  let normalized = rawPath.trim();
  if (!normalized || normalized.startsWith("/")) return null;

  try {
    normalized = decodeURIComponent(normalized).replace(/\\/g, "/");
  } catch {
    return null;
  }

  if (!isSafePublicMediaPath(normalized)) return null;

  // Strip a leading `cms/` prefix — that's a path-namespacing convention
  // kept for URL/back-compat, not part of the actual storage object key.
  const key = normalized.startsWith("cms/") ? normalized.slice(4) : normalized;
  if (!key || key.includes("/")) return null;

  return key;
}
