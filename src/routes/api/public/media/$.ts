import { promises as fs } from "node:fs";
import { createFileRoute } from "@tanstack/react-router";
import { getMediaMimeType, resolveLocalMediaPath } from "@/lib/local-media";
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

        const localPath = resolveLocalMediaPath(safePath);
        if (!localPath) {
          return new Response("Invalid path", { status: 400 });
        }

        let fileBuffer: Buffer;
        try {
          fileBuffer = await fs.readFile(localPath);
        } catch {
          return new Response("Not found", { status: 404 });
        }

        const settings = await getSiteSettings();
        const policy = resolveWatermarkPolicy(settings.branding, safePath);

        if (policy.enabled) {
          const mime = getMediaMimeType(safePath) || "image/jpeg";
          const base64 = fileBuffer.toString("base64");
          const svg = buildWatermarkSvg({
            mode: policy.mode,
            text: policy.text,
            position: policy.position,
            imageDataUrl: `data:${mime};base64,${base64}`,
            watermarkImageUrl: policy.mode === "image" ? policy.imageUrl : undefined,
            opacity: policy.opacity,
          });

          return new Response(svg, {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }

        const contentType = getMediaMimeType(safePath);

        return new Response(fileBuffer, {
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
