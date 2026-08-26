// Media storage backed by Supabase Storage (bucket: cms-media) instead of
// local disk. See migration 20260817030806_create_cms_media_bucket.sql for
// the bucket + RLS policies (public read, admin-only write).
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMediaMimeType, resolveMediaObjectKey, toPublicMediaUrl } from "@/lib/local-media";

export const CMS_MEDIA_BUCKET = "cms-media";

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|webp|gif|avif)$/i;

function cleanFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type MediaRecord = {
  name: string;
  path: string; // `cms/<key>` — stable, back-compat media path
  size: number;
  contentType: string;
  updated_at: string;
  url: string;
};

export async function uploadCmsMedia(
  supabase: SupabaseClient,
  filename: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ path: string; url: string; size: number }> {
  const key = `${Date.now()}-${cleanFilename(filename)}`;

  const { error } = await supabase.storage.from(CMS_MEDIA_BUCKET).upload(key, bytes, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const mediaPath = `cms/${key}`;
  return { path: mediaPath, url: toPublicMediaUrl(mediaPath), size: bytes.length };
}

export async function listCmsMedia(supabase: SupabaseClient, limit = 500): Promise<MediaRecord[]> {
  const { data, error } = await supabase.storage.from(CMS_MEDIA_BUCKET).list("", {
    limit,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error(error.message);

  const items: MediaRecord[] = [];
  for (const entry of data ?? []) {
    // Directory placeholder entries have id === null in Supabase Storage.
    if (!entry.name || entry.id === null) continue;
    if (!IMAGE_EXTENSION_RE.test(entry.name)) continue;

    const mediaPath = `cms/${entry.name}`;
    items.push({
      name: entry.name,
      path: mediaPath,
      size: Number((entry.metadata as { size?: number } | null)?.size ?? 0),
      contentType: getMediaMimeType(entry.name),
      updated_at: entry.updated_at ?? entry.created_at ?? new Date(0).toISOString(),
      url: toPublicMediaUrl(mediaPath),
    });
  }
  return items;
}

export async function downloadCmsMedia(
  supabase: SupabaseClient,
  mediaPath: string,
): Promise<{ body: Blob; contentType: string } | null> {
  const key = resolveMediaObjectKey(mediaPath);
  if (!key) return null;

  const { data, error } = await supabase.storage.from(CMS_MEDIA_BUCKET).download(key);
  if (error || !data) return null;

  // Supabase already returns a Blob. Keep it intact so the API response does
  // not allocate Buffer -> Uint8Array -> Blob copies for normal image requests.
  return { body: data, contentType: getMediaMimeType(key) };
}

export async function deleteCmsMedia(
  supabase: SupabaseClient,
  mediaPath: string,
): Promise<boolean> {
  const key = resolveMediaObjectKey(mediaPath);
  if (!key) return false;

  const { error } = await supabase.storage.from(CMS_MEDIA_BUCKET).remove([key]);
  return !error;
}
