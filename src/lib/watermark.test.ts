import { describe, expect, it } from "vitest";
import { buildWatermarkSvg, extractMediaPathFromUrl, resolveWatermarkPolicy } from "./watermark";

describe("extractMediaPathFromUrl", () => {
  it("strips the public media proxy prefix and keeps the storage path", () => {
    expect(extractMediaPathFromUrl("/api/public/media/cms/123-photo.jpg")).toBe("cms/123-photo.jpg");
    expect(extractMediaPathFromUrl("https://example.com/api/public/media/cms/456-photo.jpg")).toBe("cms/456-photo.jpg");
  });
});

describe("resolveWatermarkPolicy", () => {
  it("respects a per-image override when the global setting is enabled", () => {
    const policy = resolveWatermarkPolicy(
      {
        watermark_enabled: true,
        watermark_mode: "text",
        watermark_text: "The Baobab Collective",
        watermark_position: "bottom-right",
        watermark_overrides: {
          "cms/123-photo.jpg": { enabled: false },
        },
      },
      "cms/123-photo.jpg",
    );

    expect(policy.enabled).toBe(false);
  });

  it("falls back to the global setting when no image override exists", () => {
    const policy = resolveWatermarkPolicy(
      {
        watermark_enabled: true,
        watermark_mode: "image",
        watermark_image_url: "https://cdn.example.com/logo.png",
        watermark_position: "center",
        watermark_scale: 1.5,
      },
      "cms/456-photo.jpg",
    );

    expect(policy.enabled).toBe(true);
    expect(policy.mode).toBe("image");
    expect(policy.position).toBe("center");
    expect(policy.scale).toBe(1.5);
  });
});

describe("buildWatermarkSvg", () => {
  it("creates an SVG with the configured text watermark and placement", () => {
    const svg = buildWatermarkSvg({
      imageDataUrl: "data:image/jpeg;base64,abcd",
      mode: "text",
      text: "The Baobab Collective",
      position: "bottom-right",
      opacity: 0.7,
      scale: 1.5,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("The Baobab Collective");
    expect(svg).toContain('text-anchor="end"');
    expect(svg).toContain('font-size="36"');
  });
});
