import { describe, expect, it } from "vitest";
import { getMediaMimeType, resolveLocalMediaPath, toPublicMediaUrl } from "./local-media";

describe("local media helpers", () => {
  it("resolves CMS files under public/uploads", () => {
    const result = resolveLocalMediaPath("cms/1786292097632-pexels-sam-kim1-11811982.jpg");
    expect(result).not.toBeNull();
    expect(result).toMatch(/public[\\/]uploads[\\/]cms[\\/]1786292097632-pexels-sam-kim1-11811982\.jpg$/i);
    expect(resolveLocalMediaPath("../secret.jpg")).toBeNull();
    expect(resolveLocalMediaPath("/etc/passwd")).toBeNull();
  });

  it("returns the expected MIME type for supported file types", () => {
    expect(getMediaMimeType("file.jpg")).toBe("image/jpeg");
    expect(getMediaMimeType("file.png")).toBe("image/png");
    expect(getMediaMimeType("file.webp")).toBe("image/webp");
    expect(getMediaMimeType("file.gif")).toBe("image/gif");
    expect(getMediaMimeType("file.avif")).toBe("image/avif");
    expect(getMediaMimeType("file.txt")).toBe("application/octet-stream");
  });

  it("keeps the public URL format stable", () => {
    expect(toPublicMediaUrl("cms/1786292097632-pexels-sam-kim1-11811982.jpg")).toBe(
      "/api/public/media/cms/1786292097632-pexels-sam-kim1-11811982.jpg",
    );
  });
});
