import { createFileRoute } from "@tanstack/react-router";
import { downloadCmsMedia } from "@/lib/media-storage";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { buildWatermarkSvg, resolveWatermarkPolicy } from "@/lib/watermark";
import { CMS_MEDIA_BUCKET } from "@/lib/media-storage";
import { resolveMediaObjectKey } from "@/lib/local-media";

// Allowed responsive widths (matches the srcSet ladder used by SiteImage).
export const WIDTH_LADDER = [320, 640, 960, 1280, 1920];


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

        // Optional responsive width. Clamped to a small ladder so the CDN cache
        // stays warm and arbitrary values can't be used to hammer the resizer.
        const requestedWidth = Number(new URL(request.url).searchParams.get("w"));
        const width = WIDTH_LADDER.includes(requestedWidth) ? requestedWidth : null;

        // Object keys are timestamp-prefixed and never reused, so the path is a
        // valid strong validator. Short-circuit revalidation without any I/O.
        const acceptsWebp = (request.headers.get("accept") ?? "").includes("image/webp");
        const etag = `"${encodeURIComponent(safePath)}${width ? `-w${width}` : ""}${acceptsWebp ? "-webp" : ""}"`;
        if (request.headers.get("if-none-match") === etag) {
          return new Response(null, {
            status: 304,
            headers: { ETag: etag, "Cache-Control": "public, max-age=31536000, immutable" },
          });
        }

        const settingsEarly = await getCachedSiteSettings();
        const policyEarly = resolveWatermarkPolicy(settingsEarly.branding, safePath);

        // Ask Supabase Storage for a resized (and, when the browser accepts it,
        // WebP) derivative instead of shipping the full-size original.
        const renderDerivative = async () => {
          if (!width) return null;
          const objectKey = resolveMediaObjectKey(safePath);
          const baseUrl = process.env["VITE_SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
          if (!objectKey || !baseUrl) return null;
          const renderUrl = `${baseUrl}/storage/v1/render/image/public/${CMS_MEDIA_BUCKET}/${encodeURIComponent(
            objectKey,
          )}?width=${width}&quality=78&resize=contain`;
          const rendered = await fetch(renderUrl, {
            headers: { accept: request.headers.get("accept") ?? "image/webp,image/*" },
          });
          if (!rendered.ok) return null;
          return rendered;
        };

        // Fast path: no watermark → stream the derivative straight through.
        if (!policyEarly.enabled) {
          const rendered = await renderDerivative();
          if (rendered) {
            return new Response(rendered.body, {
              status: 200,
              headers: {
                "Content-Type": rendered.headers.get("content-type") ?? "image/webp",
                "Cache-Control": "public, max-age=31536000, immutable",
                Vary: "Accept",
                ETag: etag,
              },
            });
          }
          // fall through to the untransformed original on any failure
        }

        const policy = policyEarly;

        if (policy.enabled) {
          // Watermarking inlines the image into an SVG, so embed the resized
          // derivative when one is available to keep the payload small.
          const rendered = await renderDerivative();
          let mime: string;
          let fileBuffer: Buffer;
          if (rendered) {
            mime = rendered.headers.get("content-type") ?? "image/webp";
            fileBuffer = Buffer.from(await rendered.arrayBuffer());
          } else {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const original = await downloadCmsMedia(supabaseAdmin, safePath);
            if (!original) return new Response("Not found", { status: 404 });
            mime = original.contentType || "image/jpeg";
            fileBuffer = Buffer.from(await original.body.arrayBuffer());
          }
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
              ETag: etag,
            },
          });
        }

        const contentType = downloaded.contentType;

        return new Response(fileBlob, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            ETag: etag,
          },
        });
      },
    },
  },
});
