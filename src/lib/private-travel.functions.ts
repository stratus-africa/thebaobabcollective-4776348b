import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  destinations: z.string().trim().max(500).optional().or(z.literal("")),
  travel_dates: z.string().trim().max(200).optional().or(z.literal("")),
  party_size: z.number().int().min(1).max(50).optional(),
  budget_usd: z.string().trim().max(80).optional().or(z.literal("")),
  interests: z.array(z.string().min(1).max(60)).max(20).default([]),
  notes: z.string().trim().max(3000).optional().or(z.literal("")),
});

export const submitPrivateTravelRequest = createServerFn({ method: "POST" })
  .validator((d: unknown) => Schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("private_travel_requests").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      destinations: data.destinations || null,
      travel_dates: data.travel_dates || null,
      party_size: data.party_size ?? null,
      budget_usd: data.budget_usd || null,
      interests: data.interests,
      notes: data.notes || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
