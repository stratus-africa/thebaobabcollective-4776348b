import { promises as fs } from "node:fs";
import path from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ensureLocalMediaDirectory,
  getMediaMimeType,
  listLocalMediaRecords,
  resolveLocalMediaPath,
  toPublicMediaUrl,
} from "@/lib/local-media";
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
    const orderCol = SORTABLE[data.table].includes(data.orderBy) ? data.orderBy : "sort_order";
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const {
      data: rows,
      error,
      count,
    } = await context.supabase
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

    const cleanName = data.filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-|-$/g, "");
    const storedPath = `cms/${Date.now()}-${cleanName}`;

    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    if (bytes.length > 8 * 1024 * 1024) throw new Error("Image exceeds 8MB limit");

    const uploadDir = await ensureLocalMediaDirectory();
    const fullPath = path.join(uploadDir, storedPath.replace(/^cms\//, ""));
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, Buffer.from(bytes));

    const url = toPublicMediaUrl(storedPath);
    return { url, path: storedPath, size: bytes.length };
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
    let mediaPath = data.path ?? "";
    if (!mediaPath && data.url) {
      const m = data.url.match(/\/api\/public\/media\/(.+)$/);
      if (m) mediaPath = m[1];
    }

    const resolvedPath = mediaPath ? resolveLocalMediaPath(mediaPath) : null;
    if (!resolvedPath) return { ok: false as const };

    try {
      await fs.unlink(resolvedPath);
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

// List previously-uploaded media so the admin can reuse images without
// re-uploading. Walks both the `cms/` prefix (new uploads) and the bucket
// root (legacy journal uploads) and returns a stable, newest-first list.
const ListMediaSchema = z.object({
  search: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "oldest", "name-asc", "name-desc", "size-desc", "size-asc"]).optional(),
  limit: z.number().int().min(1).max(500).default(200),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(500).default(24).optional(),
});

export const adminListMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListMediaSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    await ensureLocalMediaDirectory();
    const files = await listLocalMediaRecords("cms");

    let filtered = files.filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f.name));
    if (data.search) {
      const s = data.search.toLowerCase();
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(s));
    }

    const sortKey = data.sort ?? "newest";
    filtered = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "size-desc":
          return b.size - a.size;
        case "size-asc":
          return a.size - b.size;
        case "newest":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered.slice(0, data.limit).map((f) => ({
      name: f.name,
      path: f.path,
      size: f.size,
      contentType: f.contentType,
      updated_at: f.updated_at,
      url: toPublicMediaUrl(f.path),
    }));
  });

export const adminUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = { ...data.row };
    // remove auto fields when blank id
    if (!row.id) delete row.id;
    const { data: saved, error } = await context.supabase.from(data.table).upsert(row).select().single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const GetSchema = z.object({ table: z.enum(TABLES), id: z.string().min(1) });

export const adminGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
    let query = context.supabase.from(data.table).select("*");
    if (isUuid) {
      query = query.eq("id", data.id);
    } else {
      query = query.or(`id.eq.${data.id},slug.eq.${data.id}`);
    }
    const { data: row, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ---- Bookings ----
export const adminListBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("bookings").select("*").order("created_at", { ascending: false });
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
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("bookings").update(patch).eq("id", id);
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
    let q = context.supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(data.limit);
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
      const { data: logs } = await context.supabase
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
    const patch = {
      status: data.status,
      handled_at: data.status === "handled" ? new Date().toISOString() : null,
      handled_by: data.status === "handled" ? context.userId : null,
    };
    const { error } = await context.supabase
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
    const { data } = await context.supabase
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
    const { data } = await context.supabase
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
    const db = context.supabase;
    const [
      b,
      e,
      p,
      n,
      pending,
      visitors,
      lodgesTotal,
      lodgesActive,
      destinationsTotal,
      destinationsActive,
      adventuresTotal,
      adventuresActive,
      journalTotal,
      journalDrafts,
      journalScheduled,
      testimonialsTotal,
      faqsTotal,
      unhandledEnquiries,
      recentB,
      recentE,
      recentP,
      recentJ,
      recentA,
      recentD,
      recentS,
      adventuresMissingImage,
    ] = await Promise.all([
      db.from("bookings").select("*", { count: "exact", head: true }),
      db.from("enquiries").select("*", { count: "exact", head: true }),
      db.from("private_travel_requests").select("*", { count: "exact", head: true }),
      db.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
      db.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      db
        .from("visitor_counter" as any)
        .select("total_count")
        .limit(1)
        .maybeSingle(),
      db.from("lodges").select("*", { count: "exact", head: true }),
      db.from("lodges").select("*", { count: "exact", head: true }).eq("published", true),
      db.from("destinations").select("*", { count: "exact", head: true }),
      db.from("destinations").select("*", { count: "exact", head: true }).eq("published", true),
      db.from("adventures").select("*", { count: "exact", head: true }),
      db.from("adventures").select("*", { count: "exact", head: true }).eq("published", true),
      db.from("journal_articles").select("*", { count: "exact", head: true }),
      db.from("journal_articles").select("*", { count: "exact", head: true }).eq("published", false),
      db
        .from("journal_articles")
        .select("*", { count: "exact", head: true })
        .eq("published", false)
        .not("scheduled_at", "is", null),
      db.from("testimonials").select("*", { count: "exact", head: true }),
      db.from("faqs").select("*", { count: "exact", head: true }),
      db.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
      db
        .from("bookings")
        .select("id, itinerary_name, guest_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      db.from("enquiries").select("id, name, subject, created_at").order("created_at", { ascending: false }).limit(3),
      db
        .from("private_travel_requests")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(2),
      db
        .from("journal_articles")
        .select("id, title, published, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(3),
      db
        .from("adventures")
        .select("id, name, published, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(3),
      db
        .from("destinations")
        .select("id, name, published, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(3),
      db
        .from("newsletter_subscribers")
        .select("id, email, created_at")
        .order("created_at", { ascending: false })
        .limit(2),
      db.from("adventures").select("id, name").or("image.is.null,image.eq.''").limit(5),
    ]);

    const visitor_count = (visitors.data as any)?.total_count ?? 0;

    type Activity = {
      kind: "booking" | "enquiry" | "private" | "journal" | "adventure" | "destination" | "subscriber";
      title: string;
      subtitle: string;
      at: string;
      to?: string;
    };

    const activity: Activity[] = [
      ...(recentB.data ?? []).map((r: any) => ({
        kind: "booking" as const,
        title: `Booking: ${r.itinerary_name}`,
        subtitle: `${r.guest_name} • ${r.status}`,
        at: r.created_at as string,
        to: "/admin",
      })),
      ...(recentE.data ?? []).map((r: any) => ({
        kind: "enquiry" as const,
        title: `Enquiry: ${r.subject || "General"}`,
        subtitle: r.name as string,
        at: r.created_at as string,
        to: "/admin/enquiries",
      })),
      ...(recentP.data ?? []).map((r: any) => ({
        kind: "private" as const,
        title: "Private travel request",
        subtitle: r.full_name as string,
        at: r.created_at as string,
        to: "/admin/private-travel",
      })),
      ...(recentJ.data ?? []).map((r: any) => ({
        kind: "journal" as const,
        title: `Article ${r.published ? "published" : "updated"}: ${r.title}`,
        subtitle: r.published ? "Published story" : "Draft article",
        at: (r.updated_at || r.created_at) as string,
        to: "/admin/journal",
      })),
      ...(recentA.data ?? []).map((r: any) => ({
        kind: "adventure" as const,
        title: `Adventure updated: ${r.name}`,
        subtitle: r.published ? "Live signature journey" : "Draft journey",
        at: (r.updated_at || r.created_at) as string,
        to: "/admin/adventures",
      })),
      ...(recentD.data ?? []).map((r: any) => ({
        kind: "destination" as const,
        title: `Destination updated: ${r.name}`,
        subtitle: r.published ? "Active guide" : "Draft guide",
        at: (r.updated_at || r.created_at) as string,
        to: "/admin/content/destinations",
      })),
      ...(recentS.data ?? []).map((r: any) => ({
        kind: "subscriber" as const,
        title: "New newsletter subscriber",
        subtitle: r.email as string,
        at: r.created_at as string,
        to: "/admin/subscribers",
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8);

    const totalAdv = adventuresTotal.count ?? 0;
    const activeAdv = adventuresActive.count ?? 0;
    const unpubAdv = Math.max(0, totalAdv - activeAdv);
    const unhandledEnq = unhandledEnquiries.count ?? 0;
    const draftsJ = journalDrafts.count ?? 0;
    const schedJ = journalScheduled.count ?? 0;
    const missingImgAdv = (adventuresMissingImage.data ?? []).length;

    type AttentionItem = {
      id: string;
      label: string;
      count?: number;
      tone: "amber" | "rose" | "blue";
      to: string;
      actionText: string;
    };

    const needsAttention: AttentionItem[] = [];
    if (unhandledEnq > 0) {
      needsAttention.push({
        id: "unhandled-enquiries",
        label: `${unhandledEnq} unanswered ${unhandledEnq === 1 ? "enquiry" : "enquiries"} awaiting response`,
        count: unhandledEnq,
        tone: "rose",
        to: "/admin/enquiries",
        actionText: "Review",
      });
    }
    if (draftsJ > 0) {
      needsAttention.push({
        id: "draft-articles",
        label: `${draftsJ} draft journal ${draftsJ === 1 ? "article" : "articles"} ready for review`,
        count: draftsJ,
        tone: "amber",
        to: "/admin/journal",
        actionText: "Open Journal",
      });
    }
    if (schedJ > 0) {
      needsAttention.push({
        id: "scheduled-articles",
        label: `${schedJ} article${schedJ === 1 ? "" : "s"} scheduled for future publication`,
        count: schedJ,
        tone: "blue",
        to: "/admin/journal",
        actionText: "View Schedule",
      });
    }
    if (unpubAdv > 0) {
      needsAttention.push({
        id: "unpub-adventures",
        label: `${unpubAdv} unpublished ${unpubAdv === 1 ? "adventure" : "adventures"}`,
        count: unpubAdv,
        tone: "amber",
        to: "/admin/adventures",
        actionText: "Manage",
      });
    }
    if (missingImgAdv > 0) {
      needsAttention.push({
        id: "missing-images",
        label: `${missingImgAdv} adventure${missingImgAdv === 1 ? "" : "s"} missing a hero image`,
        count: missingImgAdv,
        tone: "amber",
        to: "/admin/adventures",
        actionText: "Update Images",
      });
    }

    return {
      bookings: b.count ?? 0,
      enquiries: e.count ?? 0,
      unhandled_enquiries: unhandledEnq,
      private_travel: p.count ?? 0,
      subscribers: n.count ?? 0,
      pending_bookings: pending.count ?? 0,
      visitor_count,
      total_adventures: totalAdv,
      active_adventures: activeAdv,
      unpublished_adventures: unpubAdv,
      total_destinations: destinationsTotal.count ?? 0,
      active_destinations: destinationsActive.count ?? 0,
      total_lodges: lodgesTotal.count ?? 0,
      active_lodges: lodgesActive.count ?? 0,
      total_journal: journalTotal.count ?? 0,
      draft_articles: draftsJ,
      scheduled_articles: schedJ,
      total_testimonials: testimonialsTotal.count ?? 0,
      total_faqs: faqsTotal.count ?? 0,
      activity,
      needsAttention,
    };
  });
