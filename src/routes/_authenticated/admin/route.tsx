import { createFileRoute, Outlet, Link, useRouterState, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminDashboard } from "@/lib/admin.functions";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Mail,
  MessageSquare,
  Globe,
  Building,
  MapPin,
  Star,
  HelpCircle,
  FileText,
  Compass,
  BookOpen,
  Menu,
  LogOut,
  Home,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Briefcase,
  Map,
  Images,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  exact?: boolean;
  href?: string;
  getBadge?: (data: any) => string | number | undefined;
};

type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/", href: "/", label: "Homepage", icon: Home, exact: true },
      {
        to: "/admin/enquiries",
        label: "Enquiries",
        icon: MessageSquare,
        getBadge: (d) => (d?.unhandled_enquiries ? d.unhandled_enquiries : undefined),
      },
      {
        to: "/admin/subscribers",
        label: "Subscribers",
        icon: Mail,
        getBadge: (d) => (d?.subscribers ? d.subscribers : undefined),
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        to: "/admin/adventures",
        label: "Adventures",
        icon: Compass,
        getBadge: (d) => (d?.total_adventures ? d.total_adventures : undefined),
      },
      { to: "/admin/content/destinations", label: "Destinations", icon: MapPin },
      { to: "/admin/content/lodges", label: "Lodges", icon: Building },
      {
        to: "/admin/journal",
        label: "Journal",
        icon: FileText,
        getBadge: (d) => (d?.draft_articles ? `${d.draft_articles} draft${d.draft_articles === 1 ? "" : "s"}` : undefined),
      },
      { to: "/admin/content/testimonials", label: "Testimonials", icon: Star },
      { to: "/admin/content/faqs", label: "FAQs", icon: HelpCircle },
    ],
  },
  {
    label: "Pages",
    items: [
      { to: "/admin/pages-hub/home", label: "Home Page", icon: Home },
      { to: "/admin/pages-hub/about", label: "About", icon: BookOpen },
      { to: "/admin/pages-hub/adventures", label: "Adventures Page", icon: Compass },
      { to: "/admin/pages-hub/destinations", label: "Destinations Page", icon: Map },
      { to: "/admin/pages/contact", label: "Contact", icon: Mail },
      { to: "/admin/pages/testimonials", label: "Testimonials Page", icon: Star },
      { to: "/admin/private-travel", label: "Private Travel", icon: Briefcase },
    ],
  },
  {
    label: "Site",
    items: [
      { to: "/admin/menu", label: "Menu & Navigation", icon: Menu },
      { to: "/admin/pages/seo", label: "Global SEO", icon: Globe },
      { to: "/admin/media", label: "Media Library", icon: Images },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function currentTitle(pathname: string) {
  for (const g of groups) {
    for (const i of g.items) {
      if (i.exact ? pathname === i.to : pathname.startsWith(i.to)) return i.label;
    }
  }
  return "Dashboard";
}

function SidebarBody({
  pathname,
  collapsed,
  countsData,
  onNavigate,
  onToggleCollapse,
}: {
  pathname: string;
  collapsed: boolean;
  countsData?: any;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-admin-menu text-admin-menu-fg">
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((g, gi) => (
          <div key={g.label} className={gi > 0 ? "mt-2 border-t border-black/20 pt-2" : ""}>
            {!collapsed && (
              <p className="px-3.5 pt-2 pb-1 text-[10px] tracking-[0.24em] uppercase font-semibold text-admin-menu-muted/75">
                {g.label}
              </p>
            )}
            <ul className="space-y-0.5 px-1.5">
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const badge = item.getBadge?.(countsData);

                return (
                  <li key={item.to}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={`group relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent text-admin-menu-fg/80 hover:bg-admin-menu-hover hover:text-admin-accent-fg ${collapsed ? "justify-center px-0" : ""}`}
                      >
                        <Icon
                          className="w-[17px] h-[17px] shrink-0 text-admin-menu-muted group-hover:text-admin-accent"
                          strokeWidth={1.8}
                        />
                        {!collapsed && (
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                            <span className="truncate">{item.label}</span>
                            <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                          </div>
                        )}
                      </a>
                    ) : (
                      <Link
                        to={item.to as any}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={`group relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${
                          active
                            ? "bg-admin-bar text-admin-accent-fg font-semibold shadow-xs before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-admin-accent"
                            : "text-admin-menu-fg/80 hover:bg-admin-menu-hover hover:text-admin-accent-fg"
                        } ${collapsed ? "justify-center px-0" : ""}`}
                      >
                        <Icon
                          className={`w-[17px] h-[17px] shrink-0 ${
                            active ? "text-admin-accent" : "text-admin-menu-muted group-hover:text-admin-accent"
                          }`}
                          strokeWidth={1.8}
                        />
                        {!collapsed && (
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                            <span className="truncate">{item.label}</span>
                            {badge !== undefined && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                                  active
                                    ? "bg-admin-accent/20 text-admin-accent"
                                    : "bg-black/30 text-admin-menu-muted group-hover:text-admin-menu-fg"
                                }`}
                              >
                                {badge}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          className="hidden md:flex items-center gap-3 px-3.5 py-3 border-t border-black/25 text-[12px] text-admin-menu-muted hover:text-admin-accent-fg hover:bg-admin-menu-hover transition-colors"
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse menu</span>}
        </button>
      )}
    </div>
  );
}

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const dashFn = useServerFn(adminDashboard);
  const { data: dashboardData } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => dashFn(),
    staleTime: 30_000,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user?.email ?? null));
    try {
      setCollapsed(localStorage.getItem("admin-menu-collapsed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("admin-menu-collapsed", c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const initial = (user?.[0] ?? "A").toUpperCase();

  return (
    <div className="min-h-screen bg-admin-canvas">
      {/* Global admin header bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-10 items-center gap-2 bg-admin-bar px-3 text-[12px] text-admin-menu-fg sm:h-9 shadow-xs">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className="inline-flex h-8 w-8 items-center justify-center hover:bg-admin-menu-hover rounded md:hidden"
              aria-label="Open admin navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(86vw,300px)] border-r-0 bg-admin-menu p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <div className="pt-8 h-full">
              <SidebarBody
                pathname={pathname}
                collapsed={false}
                countsData={dashboardData}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-2 py-1 rounded transition-colors hover:bg-admin-menu-hover hover:text-admin-accent font-serif text-sm tracking-wide"
        >
          <Home className="w-3.5 h-3.5 text-admin-accent" />
          <span className="font-semibold text-admin-accent-fg">The Baobab Collective</span>
          <span className="text-[10px] uppercase tracking-widest text-admin-menu-muted ml-0.5">Admin</span>
        </Link>

        <div className="flex-1" />

        {/* Global Visit Site Action (The only site preview action in admin) */}
        <Link
          to="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-admin-menu-fg/90 hover:bg-admin-menu-hover hover:text-admin-accent transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-admin-accent" />
          <span>Visit Site</span>
        </Link>

        <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

        <span className="hidden sm:inline text-admin-menu-muted text-xs px-1">{user ?? "admin"}</span>
        <span className="h-6 w-6 rounded-full bg-admin-accent text-admin-accent-fg flex items-center justify-center text-[11px] font-semibold">
          {initial}
        </span>

        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors hover:bg-admin-menu-hover hover:text-admin-accent"
        >
          <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Log Out</span>
        </button>
      </header>

      <div className="flex pt-10 sm:pt-9">
        <aside
          className={`hidden md:block shrink-0 sticky top-9 h-[calc(100vh-2.25rem)] transition-[width] duration-200 ${
            collapsed ? "w-14" : "w-[230px]"
          }`}
        >
          <SidebarBody
            pathname={pathname}
            collapsed={collapsed}
            countsData={dashboardData}
            onToggleCollapse={toggleCollapse}
          />
        </aside>

        <main className="flex-1 min-w-0">
          <div className="min-w-0 overflow-x-hidden px-4 pt-4 pb-8 sm:px-6 md:px-8 md:pt-6 md:pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
