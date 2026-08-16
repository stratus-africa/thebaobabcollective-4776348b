import { promises as fs } from "node:fs";
import path from "node:path";
import { isSafePublicMediaPath } from "./public-media-path";

export const LOCAL_MEDIA_ROOT = path.resolve(process.cwd(), "public", "uploads");
export const LOCAL_CMS_MEDIA_DIR = path.join(LOCAL_MEDIA_ROOT, "cms");

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

export function resolveLocalMediaPath(rawPath: string | null | undefined): string | null {
  if (typeof rawPath !== "string") return null;

  let normalized = rawPath.trim();
  if (!normalized || normalized.startsWith("/")) return null;

  try {
    normalized = decodeURIComponent(normalized).replace(/\\/g, "/");
  } catch {
    return null;
  }

  if (!isSafePublicMediaPath(normalized)) return null;

  const root = LOCAL_MEDIA_ROOT;
  const resolved = path.resolve(root, normalized);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;

  return resolved;
}

export async function ensureLocalMediaDirectory(): Promise<string> {
  await fs.mkdir(LOCAL_CMS_MEDIA_DIR, { recursive: true });
  return LOCAL_CMS_MEDIA_DIR;
}

export async function listLocalMediaRecords(prefix = "cms") {
  const baseDir = path.resolve(LOCAL_MEDIA_ROOT, prefix);
  await fs.mkdir(baseDir, { recursive: true });

  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const items: Array<{
    name: string;
    path: string;
    size: number;
    contentType: string;
    updated_at: string;
    fullPath: string;
  }> = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (!/\.(png|jpe?g|webp|gif|avif)$/i.test(name)) continue;

    const fullPath = path.join(baseDir, name);
    const stat = await fs.stat(fullPath);
    const relativePath = prefix ? `${prefix}/${name}` : name;

    items.push({
      name,
      path: relativePath,
      size: Number(stat.size ?? 0),
      contentType: getMediaMimeType(name),
      updated_at: new Date(stat.mtimeMs).toISOString(),
      fullPath,
    });
  }

  items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return items;
}
