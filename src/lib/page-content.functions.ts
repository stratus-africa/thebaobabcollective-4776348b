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
  value: z.record(z.string(), z.any()),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const getPageContent = createServerFn({ method: "POST" })
  .validator((d: unknown) => GetSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", `page_${data.key}`)
        .maybeSingle();
      if (error) {
        console.error(`[getPageContent] error fetching page_${data.key}:`, error);
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
        .eq("key", `page_${data.key}`)
        .maybeSingle();
      return (row?.value as Record<string, any> | null) ?? null;
    }
  });

export const savePageContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => GetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const database = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (await import("@/integrations/supabase/client.server")).supabaseAdmin
      : context.supabase;
    const { error } = await database
      .from("site_settings")
      .upsert({ key: `page_${data.key}`, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type { PageKey };
