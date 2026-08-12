import { createFileRoute, Outlet, Link, useRouterState, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";

type NavItem = { to: string; label: string; icon: any; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
      { to: "/admin/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
  {
    label: "Pages",
    items: [
      { to: "/admin/pages-hub/home", label: "Home", icon: LayoutDashboard },
      { to: "/admin/pages-hub/about", label: "About", icon: BookOpen },
      { to: "/admin/pages/contact", label: "Contact", icon: Mail },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/admin/adventures", label: "Manage Adventures", icon: Compass },
      { to: "/admin/content/lodges", label: "Manage Lodges", icon: Building },
      { to: "/admin/content/destinations", label: "Manage Destinations", icon: MapPin },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/journal", label: "Journal", icon: FileText },
      { to: "/admin/content/testimonials", label: "Testimonials", icon: Star },
      { to: "/admin/pages/testimonials", label: "Testimonials Page", icon: Star },
      { to: "/admin/content/faqs", label: "FAQs", icon: HelpCircle },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/menu", label: "Menu & Navigation", icon: Menu },
      { to: "/admin/pages/seo", label: "Global SEO", icon: Globe },
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
  onNavigate,
  onToggleCollapse,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-admin-menu text-admin-menu-fg">
      <nav className="flex-1 overflow-y-auto py-1">
        {groups.map((g, gi) => (
          <div key={g.label} className={gi > 0 ? "mt-1 border-t border-black/25 pt-1" : ""}>
            {!collapsed && (
              <p className="px-3 pt-3 pb-1 text-[10px] tracking-[0.22em] uppercase text-admin-menu-muted/70">
                {g.label}
              </p>
            )}
            <ul>
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to as any}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 text-[13px] leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent focus-visible:-ring-offset-1 ${
                        active
                          ? "bg-admin-bar text-admin-accent-fg font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:bg-admin-accent"
                          : "text-admin-menu-fg/85 hover:bg-admin-menu-hover hover:text-admin-accent-fg"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 ${active ? "text-admin-accent" : "text-admin-menu-muted group-hover:text-admin-accent"}`}
                        strokeWidth={1.8}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
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
          className="hidden md:flex items-center gap-3 px-3 py-3 border-t border-black/25 text-[12px] text-admin-menu-muted hover:text-admin-accent-fg hover:bg-admin-menu-hover transition-colors"
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
      {/* WP-style admin bar */}
      <header className="fixed inset-x-0 top-0 z-50 h-8 bg-admin-bar text-admin-menu-fg text-[12px] flex items-center px-2 gap-1">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className="md:hidden h-8 w-8 inline-flex items-center justify-center hover:bg-admin-menu-hover"
              aria-label="Open admin navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[200px] border-r-0 bg-admin-menu">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <div className="pt-8 h-full">
              <SidebarBody pathname={pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-2 h-8 hover:bg-admin-menu-hover hover:text-admin-accent transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">The Baobab Collective</span>
        </Link>
        <Link
          to="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-2 h-8 hover:bg-admin-menu-hover hover:text-admin-accent transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Visit Site
        </Link>

        <div className="flex-1" />

        <span className="hidden sm:inline text-admin-menu-muted px-2">Howdy, {user ?? "admin"}</span>
        <span className="h-6 w-6 rounded-full bg-admin-accent text-admin-accent-fg flex items-center justify-center text-[11px] font-semibold">
          {initial}
        </span>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 px-2 h-8 hover:bg-admin-menu-hover hover:text-admin-accent transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Log Out</span>
        </button>
      </header>

      <div className="flex pt-8">
        <aside
          className={`hidden md:block shrink-0 sticky top-8 h-[calc(100vh-2rem)] transition-[width] duration-200 ${
            collapsed ? "w-14" : "w-[200px]"
          }`}
        >
          <SidebarBody
            pathname={pathname}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
          />
        </aside>

        <main className="flex-1 min-w-0">
          <div className="px-4 md:px-8 pt-6 pb-3">
            <h1 className="font-serif text-2xl md:text-[28px] text-foreground leading-tight">
              {currentTitle(pathname)}
            </h1>
          </div>
          <div className="px-4 md:px-8 pb-10 overflow-x-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
