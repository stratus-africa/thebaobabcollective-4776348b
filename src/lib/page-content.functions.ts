import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const KEYS = [
  "home",
  "about",
  "about_mission",
  "about_values",
  "about_team",
  "private_travel",
  "home_trust",
  "home_find_journey",
  "home_adventures",
  "home_destinations",
  "home_why_baobab",
  "home_founders",
  "home_lodges",
  "home_impact",
  "home_how_it_works",
  "home_final_cta",
  "home_journal",
  "home_instagram",
  "top_bar",
  "contact",
  "lodges_index",
  "adventures_index",
  "destinations_index",
  "testimonials_page",
  "detail_journey",
  "detail_lodge",
  "footer",
  "not_found",
  "auth_page",
  "seo",
] as const;
type PageKey = (typeof KEYS)[number];

const GetSchema = z.object({ key: z.enum(KEYS) });
const SaveSchema = z.object({
  key: z.enum(KEYS),
  value: z
    .record(z.string(), z.any())
    .refine((value) => value !== null && typeof value === "object" && !Array.isArray(value), {
      message: "Page content must be a plain object.",
    }),
  /** "publish" writes live content; "draft" stores changes privately until published. */
  mode: z.enum(["publish", "draft"]).default("publish"),
});

/** Key used inside site_settings.value to hold unpublished editor changes. */
export const DRAFT_FIELD = "__draft";

export function validatePageContentSave(input: unknown) {
  return SaveSchema.parse(input);
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

async function readPageRow(key: string): Promise<Record<string, any> | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", `page_${key}`)
      .maybeSingle();
    if (error) {
      console.error(`[page-content] error fetching page_${key}:`, error);
      return null;
    }
    return (row?.value as Record<string, any> | null) ?? null;
  } catch {
    // Fallback to public client if service role key is not configured
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: row } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", `page_${key}`)
      .maybeSingle();
    return (row?.value as Record<string, any> | null) ?? null;
  }
}



const GetManySchema = z.object({
  keys: z.array(z.enum(KEYS)).min(1).max(KEYS.length),
});

async function readPageRows(keys: readonly string[]): Promise<Record<string, Record<string, any> | null>> {
  const result: Record<string, Record<string, any> | null> = Object.fromEntries(keys.map((key) => [key, null]));
  if (keys.length === 0) return result;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key,value")
      .in("key", keys.map((key) => `page_${key}`));

    if (error) {
      console.error("[page-content] error fetching page batch:", error);
      return result;
    }

    for (const row of data ?? []) {
      const key = typeof row.key === "string" ? row.key.replace(/^page_/, "") : "";
      if (key && key in result) {
        result[key] = (row.value as Record<string, any> | null) ?? null;
      }
    }
    return result;
  } catch {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", keys.map((key) => `page_${key}`));

    for (const row of data ?? []) {
      const key = typeof row.key === "string" ? row.key.replace(/^page_/, "") : "";
      if (key && key in result) {
        result[key] = (row.value as Record<string, any> | null) ?? null;
      }
    }
    return result;
  }
}

/** Public read for multiple page sections in one database request. */
export const getPageContents = createServerFn({ method: "POST" })
  .validator((d: unknown) => GetManySchema.parse(d))
  .handler(async ({ data }) => {
    const rows = await readPageRows(data.keys);
    return Object.fromEntries(
      data.keys.map((key) => {
        const value = rows[key];
        if (!value) return [key, null];
        const { [DRAFT_FIELD]: _draft, ...published } = value;
        return [key, published as Record<string, any>];
      }),
    ) as Record<PageKey, Record<string, any> | null>;
  });

/** Public read — never exposes unpublished draft content. */
export const getPageContent = createServerFn({ method: "POST" })
  .validator((d: unknown) => GetSchema.parse(d))
  .handler(async ({ data }) => {
    const value = await readPageRow(data.key);
    if (!value) return null;
    const { [DRAFT_FIELD]: _draft, ...published } = value;
    return published as Record<string, any>;
  });

/** Admin read — returns published content plus any pending draft. */
export const getPageDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => GetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const value = (await readPageRow(data.key)) ?? {};
    const { [DRAFT_FIELD]: draft, ...published } = value;
    const hasDraft = draft != null && typeof draft === "object" && !Array.isArray(draft);
    return {
      published: published as Record<string, any>,
      draft: hasDraft ? (draft as Record<string, any>) : null,
      hasDraft,
    };
  });

export const savePageContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => validatePageContentSave(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const database = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (await import("@/integrations/supabase/client.server")).supabaseAdmin
      : context.supabase;

    const pageValue = data.value;
    if (pageValue == null || typeof pageValue !== "object" || Array.isArray(pageValue)) {
      throw new Error("Page content must be a plain object.");
    }

    const { [DRAFT_FIELD]: _incomingDraft, ...cleanValue } = pageValue;

    let nextValue: Record<string, any>;
    if (data.mode === "draft") {
      const existing = (await readPageRow(data.key)) ?? {};
      const { [DRAFT_FIELD]: _old, ...published } = existing;
      nextValue = { ...published, [DRAFT_FIELD]: cleanValue };
    } else {
      nextValue = cleanValue;
    }

    const { error } = await database
      .from("site_settings")
      .upsert({ key: `page_${data.key}`, value: nextValue, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true, mode: data.mode };
  });

/** Drop the pending draft, leaving published content untouched. */
export const discardPageDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => GetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const database = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (await import("@/integrations/supabase/client.server")).supabaseAdmin
      : context.supabase;
    const existing = (await readPageRow(data.key)) ?? {};
    const { [DRAFT_FIELD]: _old, ...published } = existing;
    const { error } = await database
      .from("site_settings")
      .upsert({ key: `page_${data.key}`, value: published, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type { PageKey };

