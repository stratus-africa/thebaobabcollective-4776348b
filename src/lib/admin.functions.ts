import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

const TABLES = [
  "journey_categories",
  "itineraries",
  "journal_articles",
  "lodges",
  "destinations",
  "testimonials",
  "faqs",
] as const;
type TableName = (typeof TABLES)[number];

const ListSchema = z.object({
  table: z.enum(TABLES),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(12),
  orderBy: z.string().default("sort_order"),
  orderDir: z.enum(["asc", "desc"]).default("asc"),
});
const UpsertSchema = z.object({
  table: z.enum(TABLES),
  row: z.record(z.string(), z.any()),
});
const DeleteSchema = z.object({ table: z.enum(TABLES), id: z.string().uuid() });

// Allow-list of sortable columns per table to prevent injection via orderBy
const SORTABLE: Record<TableName, string[]> = {
  journey_categories: ["sort_order", "title", "slug", "created_at", "updated_at"],
  itineraries: ["sort_order", "name", "price_from_usd", "created_at", "updated_at"],
  journal_articles: ["sort_order", "title", "published_at", "created_at", "updated_at"],
  lodges: ["sort_order", "name", "price_from_usd", "created_at", "updated_at"],
  destinations: ["sort_order", "name", "country", "region", "created_at", "updated_at"],
  testimonials: ["sort_order", "name", "rating", "created_at", "updated_at"],
  faqs: ["sort_order", "category", "created_at", "updated_at"],
};

export const adminList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const orderCol = SORTABLE[data.table].includes(data.orderBy) ? data.orderBy : "sort_order";
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const {
      data: rows,
      error,
      count,
    } = await supabaseAdmin
      .from(data.table)
      .select("*", { count: "exact" })
      .order(orderCol, { ascending: data.orderDir === "asc", nullsFirst: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0 };
  });

const UploadImageSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(png|jpe?g|webp|gif|avif)$/i, "Unsupported image type"),
  base64: z.string().min(1),
});

export const adminUploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadImageSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cleanName = data.filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-|-$/g, "");
    const path = `cms/${Date.now()}-${cleanName}`;

    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // 8 MB hard limit (Worker memory)
    if (bytes.length > 8 * 1024 * 1024) throw new Error("Image exceeds 8MB limit");

    const { error: upErr } = await supabaseAdmin.storage
      .from("journal-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    // Serve via our public media proxy so the URL is stable and never expires.
    const url = `/api/public/media/${path}`;
    return { url, path, size: bytes.length };
  });

// Delete a previously-uploaded media file so the storage stays in sync with
// the CMS. Accepts either the stored proxy URL (`/api/public/media/<path>`)
// or the raw bucket path (`cms/<name>` or `<name>` for legacy journal uploads).
const DeleteMediaSchema = z
  .object({
    url: z.string().min(1).optional(),
    path: z.string().min(1).optional(),
  })
  .refine((d) => Boolean(d.url || d.path), { message: "url or path required" });

export const adminDeleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteMediaSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let path = data.path ?? "";
    if (!path && data.url) {
      const m = data.url.match(/\/api\/public\/media\/(.+)$/);
      if (m) path = m[1];
    }
    if (!path || path.includes("..")) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("journal-images").remove([path]);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// List previously-uploaded media so the admin can reuse images without
// re-uploading. Walks both the `cms/` prefix (new uploads) and the bucket
// root (legacy journal uploads) and returns a stable, newest-first list.
const ListMediaSchema = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(500).default(200),
});

export const adminListMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListMediaSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bucket = supabaseAdmin.storage.from("journal-images");

    async function listPrefix(prefix: string) {
      const { data: files } = await bucket.list(prefix, {
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      });
      return (files ?? [])
        .filter((f: any) => f?.name && f.id) // skip folders (id is null for folders)
        .map((f: any) => ({
          name: f.name as string,
          path: prefix ? `${prefix}/${f.name}` : (f.name as string),
          size: (f.metadata?.size as number) ?? 0,
          contentType: (f.metadata?.mimetype as string) ?? "image/jpeg",
          updated_at: (f.updated_at ?? f.created_at) as string,
        }));
    }

    const [cmsFiles, rootFiles] = await Promise.all([listPrefix("cms"), listPrefix("")]);
    let files = [...cmsFiles, ...rootFiles]
      .filter((f) => /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name))
      .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));

    if (data.search) {
      const s = data.search.toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(s));
    }

    return files.slice(0, data.limit).map((f) => ({
      ...f,
      url: `/api/public/media/${f.path}`,
    }));
  });

export const adminUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { ...data.row };
    // remove auto fields when blank id
    if (!row.id) delete row.id;
    const { data: saved, error } = await supabaseAdmin.from(data.table).upsert(row).select().single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const GetSchema = z.object({ table: z.enum(TABLES), id: z.string().uuid() });

export const adminGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from(data.table).select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ---- Bookings ----
export const adminListBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("bookings").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

const BookingUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  payment_status: z.enum(["unpaid", "deposit_paid", "paid_in_full", "refunded"]).optional(),
});

export const adminUpdateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BookingUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("bookings").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Enquiries ----
const EnquiryListSchema = z.object({
  status: z.enum(["all", "new", "handled", "spam"]).default("all"),
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

export const adminListEnquiries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EnquiryListSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("enquiries").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`name.ilike.${s},email.ilike.${s},message.ilike.${s},destination.ilike.${s},subject.ilike.${s}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const messageIds = (rows ?? [])
      .map((r: any) => r.message_id as string | null)
      .filter((m): m is string => Boolean(m));
    const emailMap: Record<string, { status: string; error_message: string | null; created_at: string }> = {};
    if (messageIds.length) {
      const { data: logs } = await supabaseAdmin
        .from("email_send_log")
        .select("message_id, status, error_message, created_at")
        .in("message_id", messageIds)
        .order("created_at", { ascending: false });
      for (const l of (logs ?? []) as any[]) {
        const mid = l.message_id as string | null;
        if (mid && !emailMap[mid]) {
          emailMap[mid] = {
            status: l.status,
            error_message: l.error_message,
            created_at: l.created_at,
          };
        }
      }
    }
    return (rows ?? []).map((r: any) => ({
      ...r,
      email_status: r.message_id ? (emailMap[r.message_id] ?? null) : null,
    }));
  });

const EnquiryUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "handled", "spam"]),
});

export const adminUpdateEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EnquiryUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      status: data.status,
      handled_at: data.status === "handled" ? new Date().toISOString() : null,
      handled_by: data.status === "handled" ? context.userId : null,
    };
    const { error } = await supabaseAdmin
      .from("enquiries")
      .update(patch as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Private Travel ----
export const adminListPrivateTravel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("private_travel_requests")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

// ---- Newsletter ----
export const adminListSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

// ---- Dashboard counts ----
export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [b, e, p, n, pending, visitors, lodges, destinations, recentB, recentE, recentP] = await Promise.all([
      supabaseAdmin.from("bookings").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("enquiries").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("private_travel_requests").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin
        .from("visitor_counter" as any)
        .select("total_count")
        .limit(1)
        .maybeSingle(),
      supabaseAdmin.from("lodges").select("*", { count: "exact", head: true }).eq("published", true),
      supabaseAdmin.from("destinations").select("*", { count: "exact", head: true }).eq("published", true),
      supabaseAdmin
        .from("bookings")
        .select("id, itinerary_name, guest_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(4),
      supabaseAdmin
        .from("enquiries")
        .select("id, name, subject, created_at")
        .order("created_at", { ascending: false })
        .limit(4),
      supabaseAdmin
        .from("private_travel_requests")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(2),
    ]);
    const visitor_count = (visitors.data as any)?.total_count ?? 0;

    type Activity = { kind: "booking" | "enquiry" | "private"; title: string; subtitle: string; at: string };
    const activity: Activity[] = [
      ...(recentB.data ?? []).map((r: any) => ({
        kind: "booking" as const,
        title: `Booking: ${r.itinerary_name}`,
        subtitle: `${r.guest_name} • ${r.status}`,
        at: r.created_at as string,
      })),
      ...(recentE.data ?? []).map((r: any) => ({
        kind: "enquiry" as const,
        title: `Enquiry: ${r.subject ?? "General"}`,
        subtitle: r.name as string,
        at: r.created_at as string,
      })),
      ...(recentP.data ?? []).map((r: any) => ({
        kind: "private" as const,
        title: "Private travel request",
        subtitle: r.name as string,
        at: r.created_at as string,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);
    return {
      bookings: b.count ?? 0,
      enquiries: e.count ?? 0,
      private_travel: p.count ?? 0,
      subscribers: n.count ?? 0,
      pending_bookings: pending.count ?? 0,
      visitor_count,
      active_lodges: lodges.count ?? 0,
      active_destinations: destinations.count ?? 0,
      activity,
    };
  });
