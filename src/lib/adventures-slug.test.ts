import { describe, expect, it } from "vitest";
import { getAdventureEditorDraft, normalizeAdventureSignatures, slugifyAdventureSegment } from "./adventures.functions";

describe("adventure slug normalization", () => {
  it("creates a valid URL-safe slug from a title", () => {
    expect(slugifyAdventureSegment("Great Migration & Chase")).toBe("great-migration-and-chase");
    expect(slugifyAdventureSegment("  Safari / 2025  ")).toBe("safari-2025");
  });

  it("preserves valid existing slugs and fills missing ones", () => {
    const output = normalizeAdventureSignatures([
      { slug: "okavango-on-foot", name: "Okavango on Foot" },
      { slug: "", name: "Namib Traverse" },
      { slug: "okavango-on-foot", name: "Duplicate slug record" },
    ] as any);

    expect(output[0].slug).toBe("okavango-on-foot");
    expect(output[1].slug).toBe("namib-traverse");
    expect(output[2].slug).toBe("okavango-on-foot-2");
  });

  it("keeps a valid slug when the title changes later", () => {
    const output = normalizeAdventureSignatures([{ slug: "mount-kilimanjaro", name: "Kilimanjaro Expedition" }] as any);

    expect(output[0].slug).toBe("mount-kilimanjaro");
  });

  it("creates a blank draft for new adventure records", () => {
    const draft = getAdventureEditorDraft(
      {
        hero: { eyebrow: "", headline: "", subhead: "", image: "", imageAlt: "" },
        cta: { eyebrow: "", headline: "", body: "", buttonLabel: "" },
        signatures: [],
      },
      "new",
    );

    expect(draft.slug).toBe("new");
    expect(draft.name).toBe("");
    expect(draft.status).toBe("draft");
    expect(Array.isArray(draft.highlights)).toBe(true);
  });
});
