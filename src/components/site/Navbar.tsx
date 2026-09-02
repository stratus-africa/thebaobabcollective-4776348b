import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Search, LogOut, Settings, Zap } from "lucide-react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";

import { EnquireDialog } from "@/components/site/EnquireDialog";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

function resolveNavTo(to: string): string {
  if (!to || to === "/" || to === "/home" || to === "home") return "/";
  return to;
}

// Helper to check if a route matches the current location
function isRouteActive(to: string, currentPathname: string): boolean {
  const resolvedTo = resolveNavTo(to);
  if (resolvedTo === "/") {
    return currentPathname === "/";
  }
  return currentPathname.startsWith(resolvedTo);
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const [adventuresOpen, setAdventuresOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logoUrl } = useSiteSettings();
  const menu = useMenuConfig();
  const headerRef = useRef<HTMLElement>(null);

  const primaryItems = menu.primary.filter((i) => !i.hidden);
  const moreItems = menu.more.filter((i) => !i.hidden);

  // Scroll listener for sticky header behavior
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Authentication
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

  // Close mobile menu on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close dropdowns on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setDestinationsOpen(false);
        setAdventuresOpen(false);
        setAdminMenuOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const overlay = !!menu.transparentOverHero;

  const linkBaseStyles =
    "relative text-[15px] tracking-[0.22em] uppercase font-semibold px-1 transition-colors duration-200 after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-200 hover:after:w-[80%]";
  const linkColor = overlay ? "text-cream/85 hover:text-cream" : "text-foreground/80 hover:text-foreground";
  const activeLinkColor = overlay ? "text-cream" : "text-foreground";

  const topBar =
    menu.topBarEnabled && menu.topBarText ? (
      <div className="relative z-[40] bg-forest text-forest-foreground py-2.5 px-4 text-center text-[10px] tracking-[0.3em] uppercase font-medium">
        {menu.topBarText}
      </div>
    ) : null;

  return (
    <>
      {overlay && topBar}
      <header
        ref={headerRef}
        className={`${overlay ? "absolute inset-x-0 z-[70]" : "sticky top-0 z-50"} transition-all duration-300`}
      >
        {!overlay && topBar}

        <div
          className={`${
            overlay ? "bg-transparent" : "bg-background border-b border-border/40"
          } ${scrolled && !overlay ? "shadow-sm" : ""} transition-all duration-300`}
        >
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-2 flex items-center gap-4 lg:gap-6">
            {/* Logo */}
            <Link
              to="/"
              className="group relative shrink-0 flex items-center h-14 sm:h-16 lg:h-20 w-14 sm:w-16 lg:w-24 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 transition-transform duration-300"
              aria-label="The Baobab Collective home"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="The Baobab Collective"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-auto max-w-none object-contain z-[60] origin-left transition-transform duration-300 ease-out group-hover:scale-110 group-focus-visible:scale-110"
                />
              ) : (
                <span
                  className={`font-serif text-sm sm:text-base lg:text-lg leading-tight ${overlay ? "text-cream" : "text-foreground"}`}
                >
                  Baobab
                  <br />
                  Collective
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav aria-label="Primary" className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8">
              {primaryItems.map((item, i) => {
                const isActive = isRouteActive(item.to, location.pathname);
                const hasChildren = item.children && item.children.length > 0;

                if (hasChildren && item.label === "Destinations") {
                  return (
                    <DesktopDropdown
                      key={`${item.to}-${i}`}
                      item={item}
                      overlay={overlay}
                      open={destinationsOpen}
                      onOpenChange={setDestinationsOpen}
                      isActive={isActive}
                      linkBaseStyles={linkBaseStyles}
                      linkColor={linkColor}
                      activeLinkColor={activeLinkColor}
                    />
                  );
                } else if (hasChildren && item.label === "Adventures") {
                  return (
                    <DesktopDropdown
                      key={`${item.to}-${i}`}
                      item={item}
                      overlay={overlay}
                      open={adventuresOpen}
                      onOpenChange={setAdventuresOpen}
                      isActive={isActive}
                      linkBaseStyles={linkBaseStyles}
                      linkColor={linkColor}
                      activeLinkColor={activeLinkColor}
                    />
                  );
                } else {
                  return (
                    <Link
                      key={`${item.to}-${i}`}
                      to={resolveNavTo(item.to) as any}
                      activeOptions={{ exact: resolveNavTo(item.to) === "/" }}
                      className={`${linkBaseStyles} ${linkColor}`}
                      activeProps={{
                        className: `${linkBaseStyles} ${activeLinkColor} after:w-[80%]`,
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                }
              })}

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
                    className={`${linkBaseStyles} ${linkColor} inline-flex items-center gap-1`}
                  >
                    More{" "}
                    <ChevronDown
                      className="w-3 h-3 transition-transform duration-200"
                      style={{ transform: moreOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      aria-hidden="true"
                    />
                  </button>
                  {moreOpen && (
                    <div className="absolute right-0 top-full pt-3" role="menu">
                      <div className="bg-background border border-border shadow-lg py-2 min-w-[220px]">
                        {moreItems.map((m, i) => (
                          <Link
                            key={`${m.to}-${i}`}
                            to={resolveNavTo(m.to) as any}
                            role="menuitem"
                            onClick={() => setMoreOpen(false)}
                            className="block px-5 py-2 text-[14px] tracking-[0.2em] uppercase font-semibold text-foreground/80 hover:text-foreground hover:bg-cream focus:outline-none focus-visible:bg-cream focus-visible:text-foreground transition-colors"
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

            {/* Right side actions */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <button
                type="button"
                aria-label="Search"
                className="p-2 text-foreground/70 hover:text-foreground transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <Search className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>

              {isAdmin ? (
                <AdminMenu adminMenuOpen={adminMenuOpen} setAdminMenuOpen={setAdminMenuOpen} signOut={signOut} />
              ) : null}

              {menu.ctaTo ? (
                <Link
                  to={menu.ctaTo as any}
                  className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-2.5 hover:bg-gold/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
                      className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-2.5 hover:bg-gold/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                    >
                      {menu.ctaLabel}
                    </button>
                  }
                />
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2.5 ml-auto rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {open && (
            <MobileMenu
              primaryItems={primaryItems}
              moreItems={moreItems}
              menu={menu}
              isAdmin={isAdmin}
              signOut={signOut}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      </header>
    </>
  );
}

// Desktop Dropdown Component
function DesktopDropdown({
  item,
  overlay,
  open,
  onOpenChange,
  isActive,
  linkBaseStyles,
  linkColor,
  activeLinkColor,
}: {
  item: { label: string; to: string; children?: { label: string; to: string; hidden?: boolean }[] };
  overlay?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isActive: boolean;
  linkBaseStyles: string;
  linkColor: string;
  activeLinkColor: string;
}) {
  const kids = (item.children ?? []).filter((c) => !c.hidden);

  return (
    <div
      className="relative"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
      onFocus={() => onOpenChange(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onOpenChange(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          onOpenChange(false);
          (e.currentTarget.querySelector("a") as HTMLAnchorElement | null)?.focus();
        }
      }}
    >
      <Link
        to={resolveNavTo(item.to) as any}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${linkBaseStyles} inline-flex items-center gap-1 ${isActive ? activeLinkColor + " after:w-[80%]" : linkColor}`}
      >
        {item.label}{" "}
        <ChevronDown
          className="w-3 h-3 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        />
      </Link>
      {open && kids.length > 0 && (
        <div className="absolute left-0 top-full pt-3 z-50" role="menu">
          <div className="bg-background border border-border shadow-lg py-3 min-w-[260px]">
            {kids.map((c) => (
              <Link
                key={c.to}
                to={resolveNavTo(c.to) as any}
                role="menuitem"
                onClick={() => onOpenChange(false)}
                className="block px-6 py-2.5 text-[13px] tracking-[0.2em] uppercase font-semibold text-foreground/70 hover:text-foreground hover:bg-cream/50 focus:outline-none focus-visible:bg-cream focus-visible:text-foreground transition-colors"
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

// Admin Menu Component
function AdminMenu({
  adminMenuOpen,
  setAdminMenuOpen,
  signOut,
}: {
  adminMenuOpen: boolean;
  setAdminMenuOpen: (open: boolean) => void;
  signOut: () => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => setAdminMenuOpen(true)}
      onMouseLeave={() => setAdminMenuOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setAdminMenuOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && adminMenuOpen) {
          setAdminMenuOpen(false);
        }
      }}
    >
      <button
        type="button"
        onMouseEnter={() => setAdminMenuOpen(true)}
        onFocus={() => setAdminMenuOpen(true)}
        onClick={() => setAdminMenuOpen(!adminMenuOpen)}
        aria-haspopup="menu"
        aria-expanded={adminMenuOpen}
        aria-label="Admin menu"
        className="inline-flex items-center gap-1 text-[13px] tracking-[0.2em] uppercase font-semibold text-foreground/70 hover:text-foreground rounded-full px-3 py-2 transition-colors"
      >
        <Zap className="w-3.5 h-3.5" aria-hidden="true" />
        Admin
        <ChevronDown
          className="w-3 h-3 transition-transform duration-200"
          style={{ transform: adminMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        />
      </button>
      {adminMenuOpen && (
        <div className="absolute right-0 top-full pt-2 z-50" role="menu">
          <div className="bg-background border border-border shadow-lg py-2 min-w-[200px]">
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setAdminMenuOpen(false)}
              className="block px-5 py-2 text-[13px] tracking-[0.2em] uppercase font-semibold text-foreground/70 hover:text-foreground hover:bg-cream focus:outline-none focus-visible:bg-cream focus-visible:text-foreground transition-colors flex items-center gap-2"
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                signOut();
                setAdminMenuOpen(false);
              }}
              className="w-full text-left px-5 py-2 text-[13px] tracking-[0.2em] uppercase font-semibold text-foreground/70 hover:text-foreground hover:bg-cream focus:outline-none focus-visible:bg-cream focus-visible:text-foreground transition-colors flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile Menu Component
function MobileMenu({
  primaryItems,
  moreItems,
  menu,
  isAdmin,
  signOut,
  onClose,
}: {
  primaryItems: any[];
  moreItems: any[];
  menu: any;
  isAdmin: boolean;
  signOut: () => void;
  onClose: () => void;
}) {
  return (
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
              onClick={() => onClose()}
              className="text-[14px] tracking-[0.2em] uppercase text-foreground/80 hover:text-foreground py-2 block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
            {children.length > 0 && (
              <div className="pl-4 mt-1 flex flex-col gap-1">
                {children.map((c) => (
                  <Link
                    key={c.to}
                    to={resolveNavTo(c.to) as any}
                    onClick={() => onClose()}
                    className="text-[13px] tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground py-2.5 block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
        {isAdmin ? (
          <>
            <Link
              to="/admin"
              onClick={() => onClose()}
              className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 mt-2 gap-2"
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut();
                onClose();
              }}
              className="inline-flex items-center justify-center rounded-full border border-foreground/20 text-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 gap-2 hover:bg-cream transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              Sign Out
            </button>
          </>
        ) : menu.ctaTo ? (
          <Link
            to={menu.ctaTo as any}
            onClick={() => onClose()}
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
                onClick={() => onClose()}
                className="inline-flex items-center justify-center rounded-full bg-gold text-gold-foreground uppercase tracking-[0.2em] text-[13px] px-6 py-3 mt-2 w-full"
              >
                {menu.ctaLabel}
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
