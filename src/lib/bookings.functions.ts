import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const BookingSchema = z.object({
  itinerary_id: z.string().uuid(),
  guest_name: z.string().trim().min(1).max(120),
  guest_email: z.string().trim().email().max(255),
  guest_phone: z.string().trim().max(40).optional().or(z.literal("")),
  travel_date: z.string().optional().or(z.literal("")),
  party_size: z.number().int().min(1).max(20),
  special_requests: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const createBooking = createServerFn({ method: "POST" })
  .validator((d: unknown) => BookingSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // load itinerary
    const { data: it } = await supabaseAdmin
      .from("itineraries")
      .select("id, name, deposit_usd, price_from_usd")
      .eq("id", data.itinerary_id)
      .maybeSingle();
    if (!it) throw new Error("Itinerary not found");

    // try to attach to current user if signed in
    let user_id: string | null = null;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const req = getRequest();
      const auth = req?.headers.get("authorization");
      if (auth?.startsWith("Bearer ")) {
        const token = auth.slice(7);
        const { createClient } = await import("@supabase/supabase-js");
        const tmp = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
        const { data: claims } = await tmp.auth.getClaims(token);
        if (claims?.claims?.sub) user_id = claims.claims.sub;
      }
    } catch {
      /* anon ok */
    }

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id,
        itinerary_id: it.id,
        itinerary_name: it.name,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone || null,
        travel_date: data.travel_date || null,
        party_size: data.party_size,
        special_requests: data.special_requests || null,
        deposit_usd: it.deposit_usd,
        total_estimate_usd: it.price_from_usd ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Create Stripe Checkout session for the deposit
    let checkoutUrl: string | null = null;
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      const stripeKey = process.env.STRIPE_SANDBOX_API_KEY;
      if (apiKey && stripeKey) {
        const { getRequestHost } = await import("@tanstack/react-start/server");
        const host = getRequestHost();
        const origin = host ? `https://${host}` : "";
        const body = new URLSearchParams();
        body.set("mode", "payment");
        body.set("success_url", `${origin}/booking/success?booking_id=${booking.id}`);
        body.set("cancel_url", `${origin}/adventures`);
        body.set("customer_email", data.guest_email);
        body.set("client_reference_id", booking.id);
        body.set("metadata[booking_id]", booking.id);
        body.set("line_items[0][quantity]", "1");
        body.set("line_items[0][price_data][currency]", "usd");
        body.set("line_items[0][price_data][unit_amount]", String(it.deposit_usd * 100));
        body.set("line_items[0][price_data][product_data][name]", `Deposit — ${it.name}`);
        body.set(
          "line_items[0][price_data][product_data][description]",
          `Booking deposit for ${data.party_size} guest(s). Travel date: ${data.travel_date || "TBC"}.`,
        );

        const r = await fetch("https://connector-gateway.lovable.dev/stripe/v1/checkout/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${apiKey}`,
            "X-Connection-Api-Key": stripeKey,
          },
          body,
        });
        const json = await r.json();
        if (r.ok && json.url) {
          checkoutUrl = json.url;
          await supabaseAdmin.from("bookings").update({ stripe_session_id: json.id }).eq("id", booking.id);
        } else {
          console.error("Stripe checkout error", json);
        }
      }
    } catch (e) {
      console.error("Stripe checkout exception", e);
    }

    return { booking_id: booking.id, checkoutUrl };
  });

export const getMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("bookings")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });
