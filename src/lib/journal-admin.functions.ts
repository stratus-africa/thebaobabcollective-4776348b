import { promises as fs } from "node:fs";
import path from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureLocalMediaDirectory, toPublicMediaUrl } from "@/lib/local-media";
import { z } from "zod";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

const ArticleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  read_time: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  content: z.array(z.string()).default([]),
  sort_order: z.number().optional().nullable(),
  published: z.boolean().default(false),
  scheduled_at: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
});

export const adminListArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("journal_articles")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => ArticleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row: any = { ...data };
    if (!row.id) delete row.id;

    // Normalize publishing logic
    const now = new Date();
    if (row.published && !row.published_at) {
      row.published_at = now.toISOString();
    }
    if (!row.published) {
      // keep scheduled_at as-is for future auto-publish
      // clear published_at if user un-publishes
      row.published_at = null;
    }
    if (row.scheduled_at) {
      const sched = new Date(row.scheduled_at);
      if (!Number.isNaN(sched.getTime()) && sched.getTime() <= now.getTime() && !row.published) {
        // Past scheduled date — publish immediately
        row.published = true;
        row.published_at = now.toISOString();
      }
    }

    const { data: saved, error } = await context.supabase.from("journal_articles").upsert(row).select().single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const adminDeleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("journal_articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1),
});

export const adminUploadJournalImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => UploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const cleanName = data.filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-|-$/g, "");
    const mediaPath = `cms/${Date.now()}-${cleanName}`;

    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const dir = await ensureLocalMediaDirectory();
    const fullPath = path.join(dir, mediaPath.replace(/^cms\//, ""));
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, Buffer.from(bytes));

    const url = toPublicMediaUrl(mediaPath);
    return { url, path: mediaPath };
  });
