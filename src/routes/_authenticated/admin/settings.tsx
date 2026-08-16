import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Save,
  Image as ImageIcon,
  Shield,
  ShieldOff,
  Trash2,
  UserCog,
  Search,
  Upload,
  Mail,
  Palette,
  Users as UsersIcon,
  X,
  Send,
  Coins,
  LogIn,
  FileWarning,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  getSiteSettings,
  resolveCurrencySettings,
  saveSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings.functions";
import { adminUploadImage } from "@/lib/admin.functions";
import {
  listAdminUsers,
  setUserRole,
  deleteAdminUser,
  inviteUser,
  type AdminUserRow,
} from "@/lib/users-admin.functions";
import { SITE_SETTINGS_QUERY_KEY } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

type RoleChoice = "admin" | "editor" | "customer";

function SettingsPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/60 mb-2">Admin</p>
        <h1 className="font-serif text-3xl text-foreground">Site Settings</h1>
        <p className="text-sm text-foreground/65 mt-1">
          Update branding, contact details, and team access. Changes apply across the site immediately.
        </p>
      </header>

      <Tabs defaultValue="branding" orientation="vertical" className="flex flex-col md:flex-row gap-8">
        <TabsList className="h-auto md:w-56 shrink-0 flex md:flex-col bg-transparent p-0 gap-1 justify-start">
          <TabsTrigger
            value="branding"
            className="w-full justify-start gap-2 data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-border px-4 py-2.5"
          >
            <Palette className="w-4 h-4" /> Branding
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="w-full justify-start gap-2 data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-border px-4 py-2.5"
          >
            <Mail className="w-4 h-4" /> Contact
          </TabsTrigger>
          <TabsTrigger
            value="currency"
            className="w-full justify-start gap-2 data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-border px-4 py-2.5"
          >
            <Coins className="w-4 h-4" /> Currency
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="w-full justify-start gap-2 data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-border px-4 py-2.5"
          >
            <UsersIcon className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger
            value="signin"
            className="w-full justify-start gap-2 data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-border px-4 py-2.5"
          >
            <LogIn className="w-4 h-4" /> Sign-in Page
          </TabsTrigger>
          <TabsTrigger
            value="notfound"
            className="w-full justify-start gap-2 data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-border px-4 py-2.5"
          >
            <FileWarning className="w-4 h-4" /> 404 Page
          </TabsTrigger>
          <TabsTrigger
            value="footer"
            className="w-full justify-start gap-2 data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-border px-4 py-2.5"
          >
            <LayoutDashboard className="w-4 h-4" /> Footer
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="branding" className="mt-0">
            <SiteSettingsForm tab="branding" />
          </TabsContent>
          <TabsContent value="contact" className="mt-0">
            <SiteSettingsForm tab="contact" />
          </TabsContent>
          <TabsContent value="currency" className="mt-0">
            <CurrencyForm />
          </TabsContent>
          <TabsContent value="users" className="mt-0 space-y-8">
            <InvitePanel />
            <UsersManagement />
          </TabsContent>
          <TabsContent value="signin" className="mt-0">
            <PageEditorLink
              icon={LogIn}
              title="Admin Sign-in Page"
              description="Edit the copy shown on the admin sign-in screen — title, subtitle, field labels and submit button."
              to="/admin/pages/$page"
              params={{ page: "auth_page" }}
            />
          </TabsContent>
          <TabsContent value="notfound" className="mt-0">
            <PageEditorLink
              icon={FileWarning}
              title="404 — Page Not Found"
              description="Edit the message and call-to-action shown when a visitor lands on a missing page."
              to="/admin/pages/$page"
              params={{ page: "not_found" }}
            />
          </TabsContent>
          <TabsContent value="footer" className="mt-0">
            <PageEditorLink
              icon={LayoutDashboard}
              title="Footer"
              description="Newsletter copy, contact heading, social icons and copyright line for the site footer."
              to="/admin/pages/$page"
              params={{ page: "footer" }}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function PageEditorLink({
  icon: Icon,
  title,
  description,
  to,
  params,
}: {
  icon: any;
  title: string;
  description: string;
  to: string;
  params: Record<string, string>;
}) {
  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8">
      <div className="flex items-start gap-4">
        <span className="h-12 w-12 rounded-lg bg-forest/10 text-forest flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl text-foreground">{title}</h2>
          <p className="text-sm text-foreground/70 mt-1">{description}</p>
          <Link
            to={to as any}
            params={params as any}
            className="inline-flex items-center gap-2 mt-5 bg-forest text-forest-foreground uppercase tracking-[0.2em] text-[11px] px-5 py-3 hover:bg-forest/90 transition-colors"
          >
            Open editor
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Branding / Contact shared form ──────────────────────────────────
function SiteSettingsForm({ tab }: { tab: "branding" | "contact" }) {
  const fetchSettings = useServerFn(getSiteSettings);
  const save = useServerFn(saveSiteSettings);
  const upload = useServerFn(adminUploadImage);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<SiteSettings>({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: () => fetchSettings(),
  });

  const [logoUrl, setLogoUrl] = useState("");
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkMode, setWatermarkMode] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState("The Baobab Collective");
  const [watermarkImageUrl, setWatermarkImageUrl] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("bottom-right");
  const [watermarkScale, setWatermarkScale] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTel, setPhoneTel] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setLogoUrl(data.branding?.logo_url ?? "");
    setWatermarkEnabled(Boolean(data.branding?.watermark_enabled));
    setWatermarkMode(data.branding?.watermark_mode ?? "text");
    setWatermarkText(data.branding?.watermark_text || "The Baobab Collective");
    setWatermarkImageUrl(data.branding?.watermark_image_url ?? "");
    setWatermarkPosition(data.branding?.watermark_position ?? "bottom-right");
    setWatermarkScale(typeof data.branding?.watermark_scale === "number" ? data.branding.watermark_scale : 1);
    setEmail(data.contact?.email ?? "");
    setPhone(data.contact?.phone ?? "");
    setPhoneTel(data.contact?.phone_tel ?? "");
    setAddress(data.contact?.address ?? "");
  }, [data]);

  async function pickLogo(file: File) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif|avif|svg\+xml)/i.test(file.type)) {
      toast.error("Choose a PNG, JPG, WEBP, GIF, AVIF, or SVG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }
    setUploading(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
      const res = await upload({
        data: {
          filename: file.name,
          contentType: file.type || "image/png",
          base64: btoa(binary),
        },
      });
      setLogoUrl(res.url);
      toast.success("Logo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const branding = {
        logo_url: logoUrl.trim(),
        watermark_enabled: watermarkEnabled,
        watermark_mode: watermarkMode,
        watermark_text: watermarkText.trim() || "The Baobab Collective",
        watermark_image_url: watermarkImageUrl.trim(),
        watermark_position: watermarkPosition,
        watermark_scale: watermarkScale,
        watermark_overrides: data?.branding?.watermark_overrides ?? {},
      };

      await save({
        data: {
          contact: {
            email: email.trim(),
            phone: phone.trim(),
            phone_tel: phoneTel.trim() || phone.trim().replace(/[^\d+]/g, ""),
            address: address.trim(),
          },
          branding,
        },
      });
      await queryClient.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY });
      toast.success("Site settings saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-foreground/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <form onSubmit={onSave} noValidate className="space-y-6">
      {tab === "branding" ? (
        <section className="bg-background border border-border rounded-lg p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-5 h-5 text-gold" aria-hidden="true" />
            <h2 className="font-serif text-xl text-foreground">Branding</h2>
          </div>
          <div>
            <Label className="text-sm">Site Logo</Label>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="w-24 h-24 border border-border rounded-md bg-cream flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-foreground/30" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && pickLogo(e.target.files[0])}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-border hover:bg-muted disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {logoUrl ? "Replace logo" : "Upload logo"}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border text-foreground/70 hover:bg-muted"
                    >
                      <X className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-foreground/55">
                  PNG, JPG, WEBP, or SVG. Stored privately and served via signed URL.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-cream/30 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Watermark all website images</p>
                <p className="text-xs text-foreground/60">
                  Adds a brand mark to uploaded gallery and asset images across the site.
                </p>
              </div>
              <Switch checked={watermarkEnabled} onCheckedChange={setWatermarkEnabled} />
            </div>

            {watermarkEnabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label className="text-sm">Watermark type</Label>
                  <Select value={watermarkMode} onValueChange={(value) => setWatermarkMode(value as "text" | "image")}>
                    <SelectTrigger className="mt-2 w-full">
                      <SelectValue placeholder="Choose watermark type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {watermarkMode === "text" ? (
                  <div className="md:col-span-2">
                    <Label htmlFor="watermark-text" className="text-sm">
                      Watermark text
                    </Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <div className="md:col-span-2">
                    <Label htmlFor="watermark-image-url" className="text-sm">
                      Watermark image URL
                    </Label>
                    <Input
                      id="watermark-image-url"
                      value={watermarkImageUrl}
                      onChange={(e) => setWatermarkImageUrl(e.target.value)}
                      placeholder="https://.../brand-mark.png"
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <Label className="text-sm">Position</Label>
                  <Select value={watermarkPosition} onValueChange={(value) => setWatermarkPosition(value as any)}>
                    <SelectTrigger className="mt-2 w-full">
                      <SelectValue placeholder="Choose position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top left</SelectItem>
                      <SelectItem value="top-right">Top right</SelectItem>
                      <SelectItem value="bottom-left">Bottom left</SelectItem>
                      <SelectItem value="bottom-right">Bottom right</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-sm">Watermark size</Label>
                    <span className="text-xs font-medium text-foreground/70">{watermarkScale.toFixed(2)}×</span>
                  </div>
                  <Slider
                    value={[watermarkScale]}
                    min={0.25}
                    max={2}
                    step={0.05}
                    onValueChange={(value) => setWatermarkScale(value[0] ?? 1)}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-background border border-border rounded-lg p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-gold" aria-hidden="true" />
            <h2 className="font-serif text-xl text-foreground">Contact</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="info@thebaobabcollective.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className="mt-2"
              />
              {emailError && (
                <p id="email-error" role="alert" className="mt-1 text-xs text-destructive">
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm">
                Phone (display)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 (0) 20 0000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="phone_tel" className="text-sm">
                Phone (tel link, optional)
              </Label>
              <Input
                id="phone_tel"
                placeholder="+442000000000"
                value={phoneTel}
                onChange={(e) => setPhoneTel(e.target.value)}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-foreground/55">
                Used as <code>tel:</code> link. Defaults to digits from display phone.
              </p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-sm">
                Address
              </Label>
              <Input
                id="address"
                placeholder="London · Cape Town · Nairobi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[11px] px-6 py-3 hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" /> Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Currency ────────────────────────────────────────────────────────
function CurrencyForm() {
  const fetchSettings = useServerFn(getSiteSettings);
  const save = useServerFn(saveSiteSettings);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<SiteSettings>({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: () => fetchSettings(),
  });

  const [code, setCode] = useState(DEFAULT_CURRENCY.code ?? "USD");
  const [symbol, setSymbol] = useState(DEFAULT_CURRENCY.symbol ?? "$");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const resolved = resolveCurrencySettings(data.currency ?? DEFAULT_CURRENCY);
    setCode(resolved.code ?? DEFAULT_CURRENCY.code ?? "USD");
    setSymbol(resolved.symbol ?? DEFAULT_CURRENCY.symbol ?? "$");
  }, [data]);

  function onSelect(nextCode: string) {
    setCode(nextCode);
    const match = CURRENCY_OPTIONS.find((o) => o.code === nextCode);
    if (match) setSymbol(match.symbol);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await save({
        data: {
          contact: data?.contact ?? {},
          branding: data?.branding ?? {},
          currency: resolveCurrencySettings({ code, symbol }),
        },
      });
      await queryClient.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY });
      toast.success("Currency updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-foreground/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <section className="bg-background border border-border rounded-lg p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Coins className="w-5 h-5 text-gold" aria-hidden="true" />
          <h2 className="font-serif text-xl text-foreground">Currency</h2>
        </div>
        <p className="text-sm text-foreground/65">
          The selected currency is used to display prices across the website (lodges, journeys, and booking pages).
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currency-code" className="text-sm">
              Currency
            </Label>
            <select
              id="currency-code"
              value={code}
              onChange={(e) => onSelect(e.target.value)}
              className="mt-2 h-10 w-full bg-background border border-border rounded-md px-3 text-sm"
            >
              {CURRENCY_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.code} — {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="currency-symbol" className="text-sm">
              Symbol
            </Label>
            <Input
              id="currency-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              maxLength={4}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-foreground/55">
              Preview: <span className="text-foreground/80">{symbol}1,250</span>
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[11px] px-6 py-3 hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" /> Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Invite ──────────────────────────────────────────────────────────
function InvitePanel() {
  const queryClient = useQueryClient();
  const invite = useServerFn(inviteUser);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleChoice>("customer");
  const [sending, setSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
      await invite({ data: { email: email.trim(), role, redirectTo } });
      toast.success(`Invite sent to ${email}`);
      setEmail("");
      setRole("customer");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="bg-background border border-border rounded-lg p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <Send className="w-5 h-5 text-gold" aria-hidden="true" />
        <h2 className="font-serif text-xl text-foreground">Invite a user</h2>
      </div>
      <p className="text-sm text-foreground/65">
        Send an email invitation. The recipient sets their own password from the link. Assign an initial role below.
      </p>
      <form onSubmit={send} className="grid md:grid-cols-[1fr_180px_auto] gap-3 items-end">
        <div>
          <Label htmlFor="invite-email" className="text-sm">
            Email
          </Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="invite-role" className="text-sm">
            Initial role
          </Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as RoleChoice)}
            className="mt-2 h-10 w-full bg-background border border-border rounded-md px-3 text-sm"
          >
            <option value="customer">Customer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="h-10 inline-flex items-center gap-2 bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[11px] px-5 hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send invite
        </button>
      </form>
    </section>
  );
}

// ─── Users Management ────────────────────────────────────────────────
function UsersManagement() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listAdminUsers);
  const setRole = useServerFn(setUserRole);
  const deleteUser = useServerFn(deleteAdminUser);
  const [me, setMe] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const { data: users, isLoading } = useQuery<AdminUserRow[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const filtered = useMemo(() => {
    const list = users ?? [];
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (u) => (u.email ?? "").toLowerCase().includes(needle) || (u.full_name ?? "").toLowerCase().includes(needle),
    );
  }, [users, q]);

  async function toggleAdmin(u: AdminUserRow) {
    const isAdmin = u.roles.includes("admin");
    setBusy(u.id);
    try {
      await setRole({ data: { user_id: u.id, role: "admin", grant: !isAdmin } });
      toast.success(isAdmin ? "Admin role revoked." : "Granted admin role.");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setBusy(null);
    }
  }

  async function removeUser(u: AdminUserRow) {
    setBusy(u.id);
    try {
      await deleteUser({ data: { user_id: u.id } });
      toast.success("User deleted.");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="bg-background border border-border rounded-lg p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <UserCog className="w-5 h-5 text-gold" aria-hidden="true" />
        <h2 className="font-serif text-xl text-foreground">Users</h2>
      </div>
      <p className="text-sm text-foreground/65">
        Grant or revoke admin access and remove accounts. Changes apply immediately.
      </p>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
          aria-label="Search users"
        />
      </div>

      <div className="overflow-x-auto -mx-6 md:-mx-8">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.2em] uppercase text-foreground/55 border-y border-border">
              <th className="px-6 md:px-8 py-3 font-medium">User</th>
              <th className="px-3 py-3 font-medium">Roles</th>
              <th className="px-3 py-3 font-medium">Joined</th>
              <th className="px-3 py-3 font-medium">Last sign-in</th>
              <th className="px-6 md:px-8 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-foreground/60">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading users…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-foreground/60">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isAdmin = u.roles.includes("admin");
                const isSelf = me === u.id;
                const rowBusy = busy === u.id;
                return (
                  <tr key={u.id} className="align-middle">
                    <td className="px-6 md:px-8 py-3">
                      <div className="font-medium text-foreground">{u.full_name || "—"}</div>
                      <div className="text-xs text-foreground/60">{u.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-foreground/50">—</span>
                        ) : (
                          u.roles.map((r) => (
                            <span
                              key={r}
                              className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                                r === "admin"
                                  ? "border-gold/40 text-gold bg-gold/10"
                                  : "border-border text-foreground/70"
                              }`}
                            >
                              {r}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground/65 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground/65 whitespace-nowrap">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-6 md:px-8 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAdmin(u)}
                          disabled={rowBusy || (isSelf && isAdmin)}
                          title={isSelf && isAdmin ? "You can't remove your own admin role" : undefined}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-50"
                        >
                          {isAdmin ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {isAdmin ? "Revoke admin" : "Make admin"}
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              disabled={rowBusy || isSelf}
                              title={isSelf ? "You can't delete your own account" : undefined}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes <strong>{u.email}</strong> and all their data. This cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeUser(u)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete user
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
