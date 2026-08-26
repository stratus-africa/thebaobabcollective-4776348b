import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { WatermarkMode, WatermarkPosition } from "@/lib/watermark";

export type ContactSettings = {
  email?: string;
  phone?: string;
  phone_tel?: string;
  address?: string;
};

export type BrandingSettings = {
  logo_url?: string;
  watermark_enabled?: boolean;
  watermark_mode?: WatermarkMode;
  watermark_text?: string;
  watermark_image_url?: string;
  watermark_position?: WatermarkPosition;
  watermark_scale?: number;
  watermark_overrides?: Record<string, { enabled: boolean }>;
};

export type CurrencySettings = {
  code?: string; // ISO 4217, e.g. "USD"
  symbol?: string; // Display symbol, e.g. "$"
};

export const CURRENCY_OPTIONS: Array<{ code: string; symbol: string; label: string }> = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
];

export const DEFAULT_CURRENCY: CurrencySettings = { code: "USD", symbol: "$" };

export function resolveCurrencySettings(value?: CurrencySettings | null): CurrencySettings {
  const fallback = value ?? DEFAULT_CURRENCY;
  const match = CURRENCY_OPTIONS.find((opt) => opt.code === fallback.code) ?? DEFAULT_CURRENCY;
  return {
    code: fallback.code || match.code,
    symbol: fallback.symbol || match.symbol,
  };
}

export type SiteSettings = {
  contact: ContactSettings;
  branding: BrandingSettings;
  currency: CurrencySettings;
};

const SaveSchema = z.object({
  contact: z.object({
    email: z.string().email().or(z.literal("")).optional(),
    phone: z.string().max(40).optional(),
    phone_tel: z.string().max(40).optional(),
    address: z.string().max(200).optional(),
  }),
  branding: z.object({
    logo_url: z.string().url().or(z.literal("")).optional(),
    watermark_enabled: z.boolean().optional(),
    watermark_mode: z.enum(["text", "image"]).optional(),
    watermark_text: z.string().max(120).optional(),
    watermark_image_url: z.string().url().or(z.literal("")).optional(),
    watermark_position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right", "center"]).optional(),
    watermark_scale: z.number().min(0.25).max(2).optional(),
    watermark_overrides: z.record(z.object({ enabled: z.boolean() })).optional(),
  }),
  currency: z
    .object({
      code: z.string().min(3).max(3).optional(),
      symbol: z.string().min(1).max(4).optional(),
    })
    .optional(),
});

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let siteSettingsCache: { value: SiteSettings; expiresAt: number } | null = null;
const SITE_SETTINGS_CACHE_TTL_MS = 60_000;

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (siteSettingsCache && siteSettingsCache.expiresAt > now) {
    return siteSettingsCache.value;
  }
  let data: any[] | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await supabaseAdmin
      .from("site_settings")
      .select("key,value")
      .in("key", ["contact", "branding", "currency"]);
    data = res.data;
  } catch {
    const supabase = publicClient();
    const res = await supabase.from("site_settings").select("key,value").in("key", ["contact", "branding", "currency"]);
    data = res.data;
  }
  const map = new Map<string, any>((data ?? []).map((r: any) => [r.key, r.value]));
  const value = {
    contact: (map.get("contact") ?? {}) as ContactSettings,
    branding: (map.get("branding") ?? {}) as BrandingSettings,
    currency: resolveCurrencySettings(map.get("currency") as CurrencySettings | null),
  } satisfies SiteSettings;

  siteSettingsCache = { value, expiresAt: now + SITE_SETTINGS_CACHE_TTL_MS };
  return value;
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => SaveSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const rows: { key: string; value: any; updated_at: string }[] = [
      { key: "contact", value: data.contact, updated_at: now },
      { key: "branding", value: data.branding, updated_at: now },
    ];
    const nextCurrency = resolveCurrencySettings(data.currency ?? DEFAULT_CURRENCY);
    rows.push({ key: "currency", value: nextCurrency, updated_at: now });
    const { error } = await supabaseAdmin.from("site_settings").upsert(rows);
    if (error) throw new Error(error.message);
    siteSettingsCache = null;
    return { ok: true };
  });
