import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { EnquireDialog } from "@/components/site/EnquireDialog";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

function resolveNavTo(to: string): string {
  if (!to || to === "/" || to === "/home" || to === "home") return "/";
  return to;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { logoUrl } = useSiteSettings();
  const menu = useMenuConfig();

  const primaryItems = menu.primary.filter((i) => !i.hidden);
  const moreItems = menu.more.filter((i) => !i.hidden);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  // Close mobile menu on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const signOut = async () => {
    supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const overlay = !!menu.transparentOverHero;
  const focusRing =
    "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 " +
    (overlay ? "focus-visible:ring-offset-transparent" : "focus-visible:ring-offset-background");
  const linkBase = `relative text-[15px] tracking-[0.22em] uppercase font-semibold px-1 transition-colors after:absolute after:-bottom-2 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full ${focusRing}`;
  const linkColor = overlay ? "text-cream/85 hover:text-cream" : "text-foreground/80 hover:text-foreground";
  const adminCta = !!user && isAdmin;

  const topBar =
    menu.topBarEnabled && menu.topBarText ? (
      <div className="relative z-[40] bg-forest text-forest-foreground py-2 px-4 text-center text-[11px] tracking-luxury uppercase">
        {menu.topBarText}
      </div>
    ) : null;

  return (
    <>
      {/* Floating nav sits above the top bar so the logo overlay can overlap it. */}
      {overlay && topBar}
      <header className={overlay ? "absolute inset-x-0 z-[70]" : "sticky top-0 z-50"}>
        {!overlay && topBar}

        <div className={overlay ? "bg-transparent" : "bg-background border-b border-border/40"}>
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-1 flex items-center gap-4 lg:gap-6">
            <Link
              to="/"
              className="group relative shrink-0 flex items-center h-16 sm:h-20 lg:h-24 w-16 sm:w-24 lg:w-32 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              aria-label="The Baobab Collective home"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="The Baobab Collective"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-auto max-w-none object-contain z-[60] origin-left transition-transform duration-300 ease-out group-hover:scale-[1.75] sm:group-hover:scale-[2] lg:group-hover:scale-[2.15] group-focus-visible:scale-[1.75] sm:group-focus-visible:scale-[2] lg:group-focus-visible:scale-[2.15]"
                />
              ) : (
                <span
                  className={`font-serif text-lg sm:text-xl lg:text-2xl leading-tight ${overlay ? "text-cream" : "text-foreground"}`}
                >
                  The Baobab
                  <br />
                  Collective
                </span>
              )}
            </Link>

            <nav aria-label="Primary" className="hidden lg:flex flex-1 items-center justify-center gap-8 xl:gap-12">
              {primaryItems.map((item, i) =>
                item.children && item.children.length ? (
                  <PrimaryWithSubmenu key={`${item.to}-${i}`} item={item} overlay={overlay} />
                ) : (
                  <Link
                    key={`${item.to}-${i}`}
                    to={resolveNavTo(item.to) as any}
                    activeOptions={{ exact: resolveNavTo(item.to) === "/" }}
                    className={`${linkBase} ${linkColor}`}
                    activeProps={{
                      className: `${linkBase} ${overlay ? "text-cream" : "text-foreground"} after:w-full`,
                    }}
                  >
                    {item.label}
                  </Link>
                ),
              )}

              {moreItems.length > 0 && (
                <div
                  className="relative"
                  onMouseLeave={() => setMoreOpen(false)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setMoreOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && moreOpen) {
                      setMoreOpen(false);
                      (e.currentTarget.querySelector("button") as HTMLButtonElement | null)?.focus();
                    }
                  }}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setMoreOpen(true)}
                    onFocus={() => setMoreOpen(true)}
                    onClick={() => setMoreOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    aria-label="More navigation"
                    className={`${linkBase} ${linkColor} inline-flex items-center gap-1`}
                  >
                    More <ChevronDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                  {moreOpen && (
                    <div className="absolute right-0 top-full pt-2" role="menu">
                      <div className="bg-background border border-border shadow-lg py-2 min-w-[220px]">
                        {moreItems.map((m, i) => (
                          <Link
                            key={`${m.to}-${i}`}
                            to={resolveNavTo(m.to) as any}
                            role="menuitem"
                            onClick={() => setMoreOpen(false)}
                            className="block px-5 py-2 text-[14px] tracking-[0.2em] uppercase font-semibold text-foreground/80 hover:text-foreground hover:bg-cream focus:outline-none focus-visible:bg-cream focus-visible:text-foreground"
                          >
                            {m.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>

            <div className="hidden lg:flex items-center gap-4 shrink-0">
              {user && isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="text-[11px] tracking-[0.2em] uppercase text-gold hover:underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-[11px] tracking-[0.2em] uppercase text-foreground/70 hover:text-foreground rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    Sign out
                  </button>
                </>
              )}
              <button
                type="button"
                aria-label="Search"
                className="p-2 text-foreground/70 hover:text-foreground transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <Search className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
              {adminCta ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 hover:bg-gold/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  Dashboard
                </Link>
              ) : menu.ctaTo ? (
                <Link
                  to={menu.ctaTo as any}
                  className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 hover:bg-gold/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {menu.ctaLabel}
                </Link>
              ) : (
                <EnquireDialog
                  autosaveKey="enquire:navbar"
                  trigger={
                    <button
                      type="button"
                      aria-label={`${menu.ctaLabel} — open enquiry form`}
                      className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 hover:bg-gold/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                    >
                      {menu.ctaLabel}
                    </button>
                  }
                />
              )}
            </div>

            <button
              type="button"
              className="lg:hidden p-2 ml-auto rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>

          {open && (
            <div
              id="mobile-nav"
              role="navigation"
              aria-label="Mobile"
              className="lg:hidden border-t border-border/40 bg-background px-6 py-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto"
            >
              {[...primaryItems, ...moreItems].map((item, i) => {
                const rawChildren = ("children" in item ? item.children : undefined) as
                  | { label: string; to: string; hidden?: boolean }[]
                  | undefined;
                const children = (rawChildren ?? []).filter((c) => !c.hidden);
                return (
                  <div key={`${item.to}-${i}`}>
                    <Link
                      to={resolveNavTo(item.to) as any}
                      onClick={() => setOpen(false)}
                      className="text-[14px] tracking-[0.2em] uppercase text-foreground/80 hover:text-foreground py-1 block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                    >
                      {item.label}
                    </Link>
                    {children.length > 0 && (
                      <div className="pl-4 mt-1 flex flex-col gap-1">
                        {children.map((c) => (
                          <Link
                            key={c.to}
                            to={resolveNavTo(c.to) as any}
                            onClick={() => setOpen(false)}
                            className="text-[13px] tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground py-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                          >
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="pt-3 mt-2 border-t border-border/40 flex flex-col gap-3">
                {user && isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="text-[13px] tracking-[0.2em] uppercase text-gold"
                    >
                      Admin
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="text-left text-[13px] tracking-[0.2em] uppercase text-foreground/80"
                    >
                      Sign out
                    </button>
                  </>
                )}
                {adminCta ? (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 mt-2"
                  >
                    Dashboard
                  </Link>
                ) : menu.ctaTo ? (
                  <Link
                    to={menu.ctaTo as any}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 mt-2"
                  >
                    {menu.ctaLabel}
                  </Link>
                ) : (
                  <EnquireDialog
                    autosaveKey="enquire:navbar"
                    trigger={
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 mt-2"
                      >
                        {menu.ctaLabel}
                      </button>
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

function PrimaryWithSubmenu({
  item,
  overlay,
}: {
  item: { label: string; to: string; children?: { label: string; to: string; hidden?: boolean }[] };
  overlay?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const kids = (item.children ?? []).filter((c) => !c.hidden);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          (e.currentTarget.querySelector("a") as HTMLAnchorElement | null)?.focus();
        }
      }}
    >
      <Link
        to={resolveNavTo(item.to) as any}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`text-[15px] tracking-[0.22em] uppercase font-semibold inline-flex items-center gap-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
          overlay ? "text-cream/85 hover:text-cream" : "text-foreground/80 hover:text-foreground"
        }`}
        activeProps={{ className: overlay ? "text-cream" : "text-foreground" }}
      >
        {item.label} <ChevronDown className="w-3 h-3" aria-hidden="true" />
      </Link>
      {open && kids.length > 0 && (
        <div className="absolute left-0 top-full pt-2" role="menu">
          <div className="bg-background border border-border shadow-lg py-2 min-w-[220px]">
            {kids.map((c) => (
              <Link
                key={c.to}
                to={resolveNavTo(c.to) as any}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-5 py-2 text-[14px] tracking-[0.2em] uppercase font-semibold text-foreground/80 hover:text-foreground hover:bg-cream focus:outline-none focus-visible:bg-cream focus-visible:text-foreground"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
