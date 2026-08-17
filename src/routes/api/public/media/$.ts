import { createFileRoute } from "@tanstack/react-router";
import { downloadCmsMedia } from "@/lib/media-storage";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { buildWatermarkSvg, resolveWatermarkPolicy } from "@/lib/watermark";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rawPath = (params as any)._splat as string | undefined;
        if (!rawPath) {
          return new Response("Not found", { status: 404 });
        }

        const safePath = rawPath.trim();
        if (!safePath || safePath.includes("..") || safePath.startsWith("/")) {
          return new Response("Invalid path", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const downloaded = await downloadCmsMedia(supabaseAdmin, safePath);
        if (!downloaded) {
          return new Response("Not found", { status: 404 });
        }
        const fileBuffer = downloaded.bytes;

        const settings = await getSiteSettings();
        const policy = resolveWatermarkPolicy(settings.branding, safePath);

        if (policy.enabled) {
          const mime = downloaded.contentType || "image/jpeg";
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

        const bytes = new Uint8Array(fileBuffer);
        const blob = new Blob([bytes], { type: contentType ?? "application/octet-stream" });

        return new Response(blob, {
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
