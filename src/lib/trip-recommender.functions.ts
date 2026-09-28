import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  interests: z.array(z.string().max(60)).max(20).default([]),
  experiences: z.string().trim().max(1000).default(""),
  budget: z.string().trim().max(80).default(""),
  travelMonth: z.string().trim().max(80).default(""),
  partyType: z.string().trim().max(80).default(""),
});

export type TripRecommendation = {
  summary: string;
  destinations: { slug: string; name: string; image: string | null; reason: string }[];
  adventures: { slug: string; name: string; image: string | null; nights: string; reason: string }[];
};

export const recommendTrip = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<TripRecommendation> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { generateRecommendations } = await import("./trip-recommender.server");
    const { getAdventuresPage } = await import("./adventures.functions");

    const { data: dests } = await supabaseAdmin
      .from("destinations")
      .select("slug,name,region,short_description,description,best_for,best_months,image")
      .eq("published", true);
    const page = await getAdventuresPage();
    const advs = (page.signatures ?? []).filter((a) => (a.status ?? "published") === "published");

    const destList = (dests ?? []).map((d) => ({
      slug: d.slug,
      name: d.name,
      image: d.image as string | null,
      summary: [d.region, (d.short_description || d.description || "").slice(0, 220), `best for: ${(d.best_for ?? []).join(", ")}`, `best months: ${(d.best_months ?? []).join(", ")}`]
        .filter(Boolean)
        .join(" · "),
    }));
    const advList = advs.map((a) => ({
      slug: a.slug,
      name: a.name,
      image: a.image || null,
      nights: a.nights,
      summary: [a.region, a.terrain, a.nights, a.difficulty, (a.shortDescription || a.description || "").slice(0, 220)].filter(Boolean).join(" · "),
    }));

    try {
      const raw = await generateRecommendations(data, destList, advList);
      const dMap = new Map(destList.map((d) => [d.slug, d]));
      const aMap = new Map(advList.map((a) => [a.slug, a]));
      return {
        summary: String(raw.summary ?? ""),
        destinations: (raw.destinations ?? [])
          .filter((r) => dMap.has(r.slug))
          .slice(0, 3)
          .map((r) => ({ ...dMap.get(r.slug)!, reason: String(r.reason ?? "") })),
        adventures: (raw.adventures ?? [])
          .filter((r) => aMap.has(r.slug))
          .slice(0, 3)
          .map((r) => ({ ...aMap.get(r.slug)!, reason: String(r.reason ?? "") })),
      };
    } catch (err) {
      console.error("[trip-recommender]", err);
      throw new Error(err instanceof Error ? err.message : "Could not generate recommendations");
    }
  });
