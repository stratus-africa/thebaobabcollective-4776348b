import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (authErr) throw new Error(authErr.message);

    const users = authData?.users ?? [];
    const ids = users.map((u) => u.id);

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });

    return users
      .map((u) => ({
        id: u.id,
        email: u.email ?? null,
        full_name: (profileMap.get(u.id) as any)?.full_name ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        roles: roleMap.get(u.id) ?? [],
      }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

const SetRoleInput = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "editor", "customer"]),
  grant: z.boolean(),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => SetRoleInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("You cannot remove your own admin role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const DeleteInput = z.object({ user_id: z.string().uuid() });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => DeleteInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const InviteInput = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "customer"]).default("customer"),
  redirectTo: z.string().url().optional(),
});

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => InviteInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      data.redirectTo ? { redirectTo: data.redirectTo } : undefined,
    );
    if (error) throw new Error(error.message);
    const newId = invited?.user?.id;
    if (newId) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: newId, role: "customer" }, { onConflict: "user_id,role" });
      if (data.role !== "customer") {
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: newId, role: data.role }, { onConflict: "user_id,role" });
      }
    }
    return { ok: true, user_id: newId ?? null };
  });
