import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";

const search = z.object({ redirect: fallback(z.string(), "/admin").default("/admin") });

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: zodValidator(search),
  head: () => ({ meta: [{ title: "Admin sign in — The Baobab Collective" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const c = PAGE_DEFAULTS.auth_page;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (role) navigate({ to: redirectTo as "/admin" });
      else await supabase.auth.signOut();
    })();
  }, [navigate, redirectTo]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      setLoading(false);
      return toast.error("This portal is restricted to administrators.");
    }
    setLoading(false);
    toast.success("Welcome back");
    navigate({ to: redirectTo as "/admin" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-20 bg-cream">
        <div className="w-full max-w-md bg-background border border-border p-10">
          <h1 className="font-serif text-3xl text-center mb-2">{c.title}</h1>
          <p className="text-center text-sm text-muted-foreground mb-8">{c.subtitle}</p>

          <form onSubmit={signIn} className="space-y-4">
            <div>
              <Label htmlFor="email">{c.email_label}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">{c.password_label}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "…" : c.submit_label}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
