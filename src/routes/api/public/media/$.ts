import { createFileRoute } from "@tanstack/react-router";
import { downloadCmsMedia } from "@/lib/media-storage";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { buildWatermarkSvg, resolveWatermarkPolicy } from "@/lib/watermark";

// Site settings rarely change but are needed on every media request to decide
// watermarking. Cache them briefly to avoid a DB round trip per image.
let settingsCache: { value: Awaited<ReturnType<typeof getSiteSettings>>; expires: number } | null = null;
async function getCachedSiteSettings() {
  const now = Date.now();
  if (settingsCache && settingsCache.expires > now) return settingsCache.value;
  const value = await getSiteSettings();
  settingsCache = { value, expires: now + 60_000 };
  return value;
}

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const rawPath = (params as any)._splat as string | undefined;
        if (!rawPath) {
          return new Response("Not found", { status: 404 });
        }

        const safePath = rawPath.trim();
        if (!safePath || safePath.includes("..") || safePath.startsWith("/")) {
          return new Response("Invalid path", { status: 400 });
        }

        // Object keys are timestamp-prefixed and never reused, so the path is a
        // valid strong validator. Short-circuit revalidation without any I/O.
        const etag = `"${encodeURIComponent(safePath)}"`;
        if (request.headers.get("if-none-match") === etag) {
          return new Response(null, {
            status: 304,
            headers: { ETag: etag, "Cache-Control": "public, max-age=31536000, immutable" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const downloaded = await downloadCmsMedia(supabaseAdmin, safePath);
        if (!downloaded) {
          return new Response("Not found", { status: 404 });
        }
        const fileBlob = downloaded.body;

        const settings = await getSiteSettings();
        const policy = resolveWatermarkPolicy(settings.branding, safePath);

        if (policy.enabled) {
          const mime = downloaded.contentType || "image/jpeg";
          const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
          const base64 = fileBuffer.toString("base64");
          const svg = buildWatermarkSvg({
            mode: policy.mode,
            text: policy.text,
            position: policy.position,
            imageDataUrl: `data:${mime};base64,${base64}`,
            watermarkImageUrl: policy.mode === "image" ? policy.imageUrl : undefined,
            opacity: policy.opacity,
            scale: policy.scale,
          });

          return new Response(svg, {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }

        const contentType = downloaded.contentType;

        return new Response(fileBlob, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
