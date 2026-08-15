import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AdventuresHero = {
  eyebrow: string;
  headline: string;
  subhead: string;
  image: string;
  imageAlt: string;
};

export type AdventuresCta = {
  eyebrow: string;
  headline: string;
  body: string;
  buttonLabel: string;
};
export type AdventuresSignature = {
  slug: string;
  name: string;
  region: string;
  terrain: string;
  nights: string;
  difficulty: "Easy" | "Moderate" | "Active" | "Challenging" | string;
  image: string;
  imageAlt?: string;
  description: string;
  shortDescription?: string;
  highlights: string[];
  included: string[];
  notIncluded: string[];
  experienceTypes?: string[];
  travelStyles?: string[];
  bestFor?: string[];
  featured?: boolean;
  status?: "published" | "draft" | "archived";
  updatedAt?: string;
  bestMonths?: string[];
  destinations?: string[];
  lodges?: string[];
  itinerary?: { day: string; title: string; description: string }[];
  relatedAdventures?: string[];
  relatedDestinations?: string[];
};

export type AdventuresPage = {
  id?: string;
  hero: AdventuresHero;
  cta: AdventuresCta;
  signatures: AdventuresSignature[];
};

export function slugifyAdventureSegment(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function buildAdventureSlug(name: string, existingSlugs: Iterable<string> = []): string {
  const base = slugifyAdventureSegment(name || "untitled-adventure") || "untitled-adventure";
  const seen = new Set(
    Array.from(existingSlugs)
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  );
  if (!seen.has(base)) return base;

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (seen.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export function normalizeAdventureSignatures(
  signatures: AdventuresSignature[] | null | undefined,
): AdventuresSignature[] {
  const list = (signatures ?? []).map((item) => ({ ...item }));
  const seen = new Set<string>();

  return list.map((item) => {
    const raw = typeof item.slug === "string" ? item.slug.trim() : "";
    const safeRaw = raw && raw === slugifyAdventureSegment(raw) ? raw : "";
    const base = safeRaw || slugifyAdventureSegment(item.name || "untitled-adventure") || "untitled-adventure";
    const candidate = buildAdventureSlug(base, seen);
    seen.add(candidate);

    return {
      ...item,
      slug: candidate,
      name: item.name ?? "",
      region: item.region ?? "",
      terrain: item.terrain ?? "",
      nights: item.nights ?? "",
      difficulty: item.difficulty ?? "Moderate",
      image: item.image ?? "",
      imageAlt: item.imageAlt ?? "",
      description: item.description ?? "",
      shortDescription: item.shortDescription ?? "",
      highlights: Array.isArray(item.highlights) ? item.highlights : [],
      included: Array.isArray(item.included) ? item.included : [],
      notIncluded: Array.isArray(item.notIncluded) ? item.notIncluded : [],
      experienceTypes: Array.isArray(item.experienceTypes) ? item.experienceTypes : [],
      travelStyles: Array.isArray(item.travelStyles) ? item.travelStyles : [],
      bestFor: Array.isArray(item.bestFor) ? item.bestFor : [],
      featured: typeof item.featured === "boolean" ? item.featured : false,
      status: item.status === "draft" || item.status === "archived" ? item.status : "published",
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined,
      bestMonths: Array.isArray(item.bestMonths) ? item.bestMonths : [],
      destinations: Array.isArray(item.destinations) ? item.destinations : [],
      lodges: Array.isArray(item.lodges) ? item.lodges : [],
      itinerary: Array.isArray(item.itinerary) ? item.itinerary : [],
      relatedAdventures: Array.isArray(item.relatedAdventures) ? item.relatedAdventures : [],
      relatedDestinations: Array.isArray(item.relatedDestinations) ? item.relatedDestinations : [],
    };
  });
}

export const adventuresDefaults: AdventuresPage = {
  hero: {
    eyebrow: "Adventures",
    headline: "EXPERIENCE KENYA BEYOND THE ORDINARY.",
    subhead: "Journeys designed around your pace, your curiosity and the places you want to discover.",
    image: "",
    imageAlt: "Sunrise over the African bush — a guide leads a walking safari toward distant baobabs",
  },

  cta: {
    eyebrow: "YOUR ADVENTURE. OUR CRAFT.",
    headline: "Ready to experience Kenya differently?",
    body: "Tell us where you want to go, what you want to experience and how you like to travel. We'll take it from there.",
    buttonLabel: "Start Planning",
  },
  signatures: [],
};

export const getAdventuresPage = createServerFn({ method: "GET" }).handler(async (): Promise<AdventuresPage> => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data } = await supabase
    .from("adventures_page_blocks" as any)
    .select("id, hero, cta, signatures")
    .limit(1)
    .maybeSingle();
  if (!data) return adventuresDefaults;
  const page: AdventuresPage = {
    id: (data as any).id,
    hero: { ...adventuresDefaults.hero, ...((data as any).hero ?? {}) },
    cta: { ...adventuresDefaults.cta, ...((data as any).cta ?? {}) },
    signatures: normalizeAdventureSignatures(((data as any).signatures ?? []) as AdventuresSignature[]),
  };
  return page;
});

const SavePayload = z.object({
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    subhead: z.string(),
    image: z.string().default(""),
    imageAlt: z.string().default(""),
  }),

  cta: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
    buttonLabel: z.string(),
  }),
  signatures: z.array(
    z.object({
      slug: z.string().min(1),
      name: z.string().default(""),
      region: z.string(),
      terrain: z.string(),
      nights: z.string(),
      difficulty: z.string(),
      image: z.string(),
      imageAlt: z.string().optional().default(""),
      description: z.string(),
      shortDescription: z.string().optional().default(""),
      highlights: z.array(z.string()),
      included: z.array(z.string()).default([]),
      notIncluded: z.array(z.string()).default([]),
      experienceTypes: z.array(z.string()).optional().default([]),
      travelStyles: z.array(z.string()).optional().default([]),
      bestFor: z.array(z.string()).optional().default([]),
      featured: z.boolean().optional().default(false),
      status: z.enum(["published", "draft", "archived"]).optional().default("published"),
      updatedAt: z.string().optional(),
      bestMonths: z.array(z.string()).optional().default([]),
      destinations: z.array(z.string()).optional().default([]),
      lodges: z.array(z.string()).optional().default([]),
      itinerary: z
        .array(
          z.object({
            day: z.string(),
            title: z.string(),
            description: z.string(),
          }),
        )
        .optional()
        .default([]),
      relatedAdventures: z.array(z.string()).optional().default([]),
      relatedDestinations: z.array(z.string()).optional().default([]),
    }),
  ),
});

const normalizeSaveInput = (d: unknown) => {
  if (!d || typeof d !== "object") return SavePayload.parse(d);
  const value = d as any;
  return SavePayload.parse({
    ...value,
    signatures: normalizeAdventureSignatures(Array.isArray(value.signatures) ? value.signatures : []),
  });
};

export const saveAdventuresPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => normalizeSaveInput(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const cleaned = {
      ...data,
      signatures: normalizeAdventureSignatures(data.signatures),
    };

    const database = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (await import("@/integrations/supabase/client.server")).supabaseAdmin
      : context.supabase;
    const { data: existing } = await database
      .from("adventures_page_blocks" as any)
      .select("id")
      .limit(1)
      .maybeSingle();
    const payload = {
      ...cleaned,
      updated_by: context.userId,
      singleton: true,
    } as any;
    if ((existing as any)?.id) {
      const { error } = await database
        .from("adventures_page_blocks" as any)
        .update(payload)
        .eq("id", (existing as any).id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await database.from("adventures_page_blocks" as any).insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });
