import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export type NavItem = {
  label: string;
  to: string;
  hidden?: boolean;
  children?: { label: string; to: string; hidden?: boolean }[];
};

export type FooterColumn = {
  heading: string;
  links: { label: string; to: string }[];
};

export type MenuConfig = {
  topBarText: string;
  topBarEnabled: boolean;
  transparentOverHero: boolean;
  primary: NavItem[];
  more: { label: string; to: string; hidden?: boolean }[];
  ctaLabel: string;
  ctaTo: string;
  footerColumns: FooterColumn[];
  footerTagline: string;
};

export const MENU_DEFAULTS: MenuConfig = {
  topBarText: "Kenya, curated personally.",
  topBarEnabled: true,
  transparentOverHero: false,
  primary: [
    { label: "Home", to: "/" },
    { label: "Journeys", to: "/adventures" },
    { label: "Destinations", to: "/destinations" },
    { label: "Lodges", to: "/lodges" },
    { label: "Why Baobab", to: "/about" },
    { label: "Journal", to: "/journal" },
  ],
  more: [
    { label: "About The Collective", to: "/about" },
    { label: "Testimonials", to: "/testimonials" },
    { label: "FAQ", to: "/faq" },
    { label: "Contact", to: "/contact" },
  ],
  ctaLabel: "Plan Your Journey",
  ctaTo: "",
  footerTagline: "Kenya, Curated Personally",
  footerColumns: [
    {
      heading: "Quick Links",
      links: [
        { label: "Home", to: "/" },
        { label: "About", to: "/about" },
        { label: "Destinations", to: "/destinations" },
        { label: "Journal", to: "/journal" },
        { label: "Contact", to: "/contact" },
      ],
    },
    {
      heading: "Explore",
      links: [
        { label: "Adventures", to: "/adventures" },
        { label: "Lodges", to: "/lodges" },
        { label: "Private Travel", to: "/private-travel" },
        { label: "Testimonials", to: "/testimonials" },
      ],
    },
  ],
};

const ChildSchema = z.object({
  label: z.string().min(1),
  to: z.string().min(1),
  hidden: z.boolean().optional(),
});
const NavSchema = z.object({
  label: z.string().min(1),
  to: z.string().min(1),
  hidden: z.boolean().optional(),
  children: z.array(ChildSchema).optional(),
});
const FooterColumnSchema = z.object({
  heading: z.string().min(1),
  links: z.array(z.object({ label: z.string().min(1), to: z.string().min(1) })),
});
const MenuSchema = z.object({
  topBarText: z.string().default(""),
  topBarEnabled: z.boolean().default(true),
  transparentOverHero: z.boolean().default(false),
  primary: z.array(NavSchema).default([]),
  more: z.array(ChildSchema).default([]),
  ctaLabel: z.string().default("Enquire"),
  ctaTo: z.string().default(""),
  footerColumns: z.array(FooterColumnSchema).default([]),
  footerTagline: z.string().default(""),
});

export const getMenuConfig = createServerFn({ method: "GET" }).handler(async () => {
  let row: { value: any } | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await supabaseAdmin.from("site_settings").select("value").eq("key", "menu_config").maybeSingle();
    row = res.data;
  } catch {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const res = await supabase.from("site_settings").select("value").eq("key", "menu_config").maybeSingle();
    row = res.data;
  }
  if (!row?.value) return MENU_DEFAULTS;
  return { ...MENU_DEFAULTS, ...(row.value as Partial<MenuConfig>) } satisfies MenuConfig;
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const saveMenuConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MenuSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "menu_config", value: data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
