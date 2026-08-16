import { describe, expect, it } from "vitest";
import { isSafePublicMediaPath } from "./public-media-path";

describe("isSafePublicMediaPath", () => {
  it("allows valid CMS file paths", () => {
    expect(isSafePublicMediaPath("cms/1750000000000-image.jpg")).toBe(true);
    expect(isSafePublicMediaPath("images/photo.webp")).toBe(true);
  });

  it("rejects directory-like and traversal paths", () => {
    expect(isSafePublicMediaPath("cms/")).toBe(false);
    expect(isSafePublicMediaPath("../secret.jpg")).toBe(false);
    expect(isSafePublicMediaPath("cms/../../etc/passwd")).toBe(false);
    expect(isSafePublicMediaPath(" ")).toBe(false);
  });

  it("keeps CMS media under the public uploads root", () => {
    expect(isSafePublicMediaPath("cms/1786292097632-pexels-sam-kim1-11811982.jpg")).toBe(true);
    expect(isSafePublicMediaPath("cms/../../etc/passwd")).toBe(false);
    expect(isSafePublicMediaPath("/etc/passwd")).toBe(false);
  });
});
