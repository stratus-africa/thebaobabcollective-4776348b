import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

// Stronger anti-spam validation: block disposable patterns, common spam phrases,
// excessive URLs in message, repeated character runs.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "trashmail.com",
  "yopmail.com",
  "throwaway.email",
  "fakeinbox.com",
  "sharklasers.com",
]);

const SPAM_PHRASES = [
  /\bseo\s+services?\b/i,
  /\bbacklinks?\b/i,
  /\bguest\s+post\b/i,
  /\bbitcoin\b/i,
  /\bcrypto\s+invest/i,
  /\bcasino\b/i,
  /\bviagra\b/i,
  /\bloan\s+offer\b/i,
];

function countUrls(s: string) {
  return (s.match(/\bhttps?:\/\/|www\./gi) ?? []).length;
}

function hasRepeatRun(s: string, n = 8) {
  return new RegExp(`(.)\\1{${n - 1},}`).test(s);
}

const EnquirySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Please share your full name")
      .max(120)
      .regex(/^[\p{L}\p{M}\s'.\-]+$/u, "Name contains invalid characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email")
      .max(255)
      .refine((e) => {
        const domain = e.split("@")[1];
        return domain && !DISPOSABLE_DOMAINS.has(domain);
      }, "Please use a permanent email address"),
    phone: z
      .string()
      .trim()
      .min(5, "Phone number is required")
      .max(40)
      .regex(/^[\d+()\-.\s]+$/, "Phone may only contain digits and + ( ) - . spaces"),
    destination: z.string().trim().max(160).optional().or(z.literal("")),
    subject: z.string().trim().max(200).optional().or(z.literal("")),
    travel_dates: z.string().trim().max(120).optional().or(z.literal("")),
    adults: z.number().int().min(0).max(50).optional(),
    children: z.number().int().min(0).max(50).optional(),
    budget: z.string().trim().max(60).optional().or(z.literal("")),
    trip_type: z.string().trim().max(60).optional().or(z.literal("")),
    accommodation_style: z.string().trim().max(60).optional().or(z.literal("")),
    experiences: z.array(z.string().max(60)).max(20).optional(),
    referral_source: z.string().trim().max(80).optional().or(z.literal("")),
    subscribe_newsletter: z.boolean().optional(),
    source_url: z.string().trim().max(500).optional().or(z.literal("")),
    message: z.string().trim().min(10, "Tell us a little more about your trip").max(2000),
    // Honeypot field — must be empty. Bots tend to fill every input.
    company: z.string().max(0).optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    if (countUrls(d.message) > 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["message"],
        message: "Please remove the links from your message",
      });
    }
    if (hasRepeatRun(d.message)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["message"],
        message: "Your message looks like spam",
      });
    }
    for (const re of SPAM_PHRASES) {
      if (re.test(d.message) || re.test(d.subject ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["message"],
          message: "Your message was flagged as spam",
        });
        break;
      }
    }
  });

// Rate-limit windows
const MAX_PER_EMAIL_PER_HOUR = 3;
const MAX_PER_IP_PER_HOUR = 6;
const MIN_SECONDS_BETWEEN = 20;

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => EnquirySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const xff = getRequestHeader("x-forwarded-for") ?? "";
    const ip = xff.split(",")[0]?.trim() || "unknown";
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const sinceMin = new Date(Date.now() - MIN_SECONDS_BETWEEN * 1000).toISOString();

    // Rate-limit by email (always) and IP (when known)
    const [{ count: emailCount }, recent] = await Promise.all([
      supabaseAdmin
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .ilike("email", data.email)
        .gte("created_at", sinceHour),
      supabaseAdmin.from("enquiries").select("id").ilike("email", data.email).gte("created_at", sinceMin).limit(1),
    ]);
    if ((emailCount ?? 0) >= MAX_PER_EMAIL_PER_HOUR) {
      throw new Error("Too many enquiries from this email. Please try again later.");
    }
    if ((recent.data?.length ?? 0) > 0) {
      throw new Error("Please wait a moment before submitting again.");
    }
    if (ip !== "unknown") {
      const { count: ipCount } = await supabaseAdmin
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .eq("source_url", data.source_url ?? "")
        .gte("created_at", sinceHour)
        .ilike("referral_source", `%ip=${ip}%`);
      if ((ipCount ?? 0) >= MAX_PER_IP_PER_HOUR) {
        throw new Error("Too many enquiries from your network. Please try again later.");
      }
    }

    // Stamp IP into referral_source for follow-on rate-limit checks
    const referral =
      [data.referral_source, ip !== "unknown" ? `ip=${ip}` : ""].filter(Boolean).join(" | ").slice(0, 80) || null;

    const { data: inserted, error } = await supabaseAdmin
      .from("enquiries")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        destination: data.destination || null,
        subject: data.subject || null,
        travel_dates: data.travel_dates || null,
        adults: data.adults ?? null,
        children: data.children ?? null,
        budget: data.budget || null,
        trip_type: data.trip_type || null,
        accommodation_style: data.accommodation_style || null,
        experiences: data.experiences?.length ? data.experiences : null,
        referral_source: referral,
        subscribe_newsletter: data.subscribe_newsletter ?? false,
        source_url: data.source_url || null,
        message: data.message,
        status: "new",
      })
      .select("id")
      .single();
    if (error || !inserted) {
      console.error("submitEnquiry error", error);
      throw new Error("Could not submit enquiry. Please try again.");
    }

    if (data.subscribe_newsletter) {
      await supabaseAdmin
        .from("newsletter_subscribers")
        .insert({ email: data.email.toLowerCase() })
        .then(
          () => undefined,
          () => undefined,
        );
    }

    // Use deterministic message_id so we can join enquiries -> email_send_log
    const messageId = `enquiry-${inserted.id}`;
    await supabaseAdmin.from("enquiries").update({ message_id: messageId }).eq("id", inserted.id);

    try {
      const { enqueueInternalEmail } = await import("@/lib/email/send-internal.server");
      await enqueueInternalEmail({
        templateName: "enquiry-notification",
        idempotencyKey: messageId,
        templateData: {
          kind: data.subject ? "Contact" : "Enquiry",
          name: data.name,
          email: data.email,
          phone: data.phone,
          destination: data.destination || undefined,
          subject: data.subject || undefined,
          travelDates: data.travel_dates || undefined,
          adults: data.adults ?? undefined,
          children: data.children ?? undefined,
          budget: data.budget || undefined,
          tripType: data.trip_type || undefined,
          accommodationStyle: data.accommodation_style || undefined,
          experiences: data.experiences,
          referralSource: data.referral_source || undefined,
          sourceUrl: data.source_url || undefined,
          message: data.message,
        },
      });
    } catch (err) {
      console.error("submitEnquiry: email notification failed", err);
    }
    return { ok: true as const };
  });

const NewsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator((input: unknown) => NewsletterSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("newsletter_subscribers").insert({ email: data.email.toLowerCase() });
    if (error) {
      if (error.code === "23505") return { ok: true as const, alreadySubscribed: true };
      console.error("subscribeNewsletter error", error);
      throw new Error("Could not subscribe. Please try again.");
    }
    return { ok: true as const, alreadySubscribed: false };
  });
