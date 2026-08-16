export type WatermarkMode = "text" | "image";
export type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export type WatermarkPolicy = {
  enabled: boolean;
  mode: WatermarkMode;
  text: string;
  imageUrl: string;
  position: WatermarkPosition;
  opacity: number;
};

export function extractMediaPathFromUrl(value: string) {
  if (!value) return "";
  const trimmed = value.trim();
  const pathname = (() => {
    try {
      return new URL(trimmed, "https://example.com").pathname;
    } catch {
      return trimmed;
    }
  })();

  const match = pathname.match(/\/api\/public\/media\/(.+)$/) ?? pathname.match(/\/media\/(.+)$/);
  const cleaned = match ? match[1] : pathname.replace(/^\/+/, "");
  return cleaned.replace(/^api\/public\/media\//, "");
}

export function resolveWatermarkPolicy(
  branding: {
    watermark_enabled?: boolean;
    watermark_mode?: WatermarkMode;
    watermark_text?: string;
    watermark_image_url?: string;
    watermark_position?: WatermarkPosition;
    watermark_overrides?: Record<string, { enabled: boolean }>;
  } | null | undefined,
  mediaPath: string,
): WatermarkPolicy {
  const effectiveMode: WatermarkMode =
    (branding?.watermark_mode ?? "text") === "image" && !branding?.watermark_image_url
      ? "text"
      : (branding?.watermark_mode ?? "text");

  const fallback: WatermarkPolicy = {
    enabled: Boolean(branding?.watermark_enabled),
    mode: effectiveMode,
    text: branding?.watermark_text || "The Baobab Collective",
    imageUrl: branding?.watermark_image_url || "",
    position: branding?.watermark_position ?? "bottom-right",
    opacity: 0.7,
  };

  const mediaKey = extractMediaPathFromUrl(mediaPath);
  const override = branding?.watermark_overrides?.[mediaKey];
  if (override !== undefined) {
    return {
      ...fallback,
      enabled: Boolean(override.enabled),
    };
  }

  return fallback;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildWatermarkSvg({
  mode,
  text,
  position,
  imageDataUrl,
  watermarkImageUrl,
  opacity,
}: {
  mode: WatermarkMode;
  text: string;
  position: WatermarkPosition;
  imageDataUrl?: string;
  watermarkImageUrl?: string;
  opacity?: number;
}) {
  const safeText = (text || "The Baobab Collective").replace(/[<>&"']/g, "");
  const waterOpacity = opacity ?? 0.7;
  const placement = {
    "top-left": { x: 18, y: 30, anchor: "start", baseline: "hanging" },
    "top-right": { x: 98, y: 30, anchor: "end", baseline: "hanging" },
    "bottom-left": { x: 18, y: 92, anchor: "start", baseline: "baseline" },
    "bottom-right": { x: 98, y: 92, anchor: "end", baseline: "baseline" },
    center: { x: 50, y: 50, anchor: "middle", baseline: "middle" },
  }[position] ?? { x: 98, y: 92, anchor: "end", baseline: "baseline" };

  const baseMarkup = imageDataUrl ? `<image href="${escapeXml(imageDataUrl)}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />` : "";
  const waterMarkup = mode === "text"
    ? `<text x="${placement.x}%" y="${placement.y}%" text-anchor="${placement.anchor}" dominant-baseline="${placement.baseline}" fill="rgba(255,255,255,${waterOpacity})" font-size="24" font-weight="700" font-family="Georgia, serif" letter-spacing="1.2">${safeText}</text>`
    : watermarkImageUrl
      ? `<image href="${escapeXml(watermarkImageUrl)}" x="${placement.x}%" y="${placement.y}%" width="18%" height="18%" preserveAspectRatio="xMidYMid meet" opacity="${waterOpacity}" transform="translate(-9%,-9%)" />`
      : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="0.5" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <g filter="url(#softShadow)">${baseMarkup}${waterMarkup}</g>
    </svg>
  `.trim();
}
