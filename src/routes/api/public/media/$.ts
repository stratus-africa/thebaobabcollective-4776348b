import { createFileRoute } from "@tanstack/react-router";
import { isSafePublicMediaPath } from "@/lib/public-media-path";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { buildWatermarkSvg, resolveWatermarkPolicy } from "@/lib/watermark";

// Public media proxy — streams files from the private `journal-images`
// Supabase Storage bucket using the admin client. Keeps the bucket private
// while giving uploaded images a stable, public URL we can store in the DB.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as any)._splat as string | undefined;
        if (!path || !isSafePublicMediaPath(path)) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("journal-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        const buf = await data.arrayBuffer();
        const settings = await getSiteSettings();
        const policy = resolveWatermarkPolicy(settings.branding, path);

        if (policy.enabled) {
          const mime = data.type || "image/jpeg";
          const base64 = Buffer.from(buf).toString("base64");
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

        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
