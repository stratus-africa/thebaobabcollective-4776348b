import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminDashboard } from "@/lib/admin.functions";
import {
  MessageSquare,
  Compass,
  MapPin,
  Building,
  FileText,
  Star,
  HelpCircle,
  Mail,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Sparkles,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted/60 animate-pulse rounded-md ${className}`} />;
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-admin-panel border border-admin-panel-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-admin-panel-border bg-admin-canvas/40">
        <div>
          <h2 className="text-[14px] font-semibold text-foreground tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-foreground/50 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

function Dashboard() {
  const fn = useServerFn(adminDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fn(),
    staleTime: 30_000,
  });

  const stats = [
    {
      label: "Adventures",
      value: data?.total_adventures,
      sublabel: `${data?.active_adventures ?? 0} active`,
      icon: Compass,
      to: "/admin/adventures",
    },
    {
      label: "Destinations",
      value: data?.total_destinations,
      sublabel: `${data?.active_destinations ?? 0} active`,
      icon: MapPin,
      to: "/admin/content/destinations",
    },
    {
      label: "Lodges",
      value: data?.total_lodges,
      sublabel: `${data?.active_lodges ?? 0} active`,
      icon: Building,
      to: "/admin/content/lodges",
    },
    {
      label: "Journal Articles",
      value: data?.total_journal,
      sublabel: `${data?.draft_articles ?? 0} drafts`,
      icon: FileText,
      to: "/admin/journal",
    },
    {
      label: "Testimonials",
      value: data?.total_testimonials,
      sublabel: "Guest reviews",
      icon: Star,
      to: "/admin/content/testimonials",
    },
    {
      label: "Enquiries",
      value: data?.enquiries,
      sublabel: `${data?.unhandled_enquiries ?? 0} unanswered`,
      icon: MessageSquare,
      to: "/admin/enquiries",
      highlight: (data?.unhandled_enquiries ?? 0) > 0,
    },
    {
      label: "Subscribers",
      value: data?.subscribers,
      sublabel: "Newsletter list",
      icon: Mail,
      to: "/admin/subscribers",
    },
  ];

  const quickActions = [
    {
      label: "New Adventure",
      description: "Create a signature itinerary",
      to: "/admin/adventures",
      icon: Compass,
      accent: true,
    },
    {
      label: "New Destination",
      description: "Add a country or regional guide",
      to: "/admin/content/destinations",
      icon: MapPin,
    },
    {
      label: "New Lodge",
      description: "Curate a partner camp or lodge",
      to: "/admin/content/lodges",
      icon: Building,
    },
    {
      label: "New Article",
      description: "Write and publish a story",
      to: "/admin/journal",
      icon: FileText,
    },
    {
      label: "New Testimonial",
      description: "Add guest feedback and rating",
      to: "/admin/content/testimonials",
      icon: Star,
    },
  ];

  const contentOverview = [
    { label: "Adventures", count: data?.total_adventures, to: "/admin/adventures", icon: Compass },
    { label: "Destinations", count: data?.total_destinations, to: "/admin/content/destinations", icon: MapPin },
    { label: "Lodges", count: data?.total_lodges, to: "/admin/content/lodges", icon: Building },
    { label: "Journal", count: data?.total_journal, to: "/admin/journal", icon: FileText },
    { label: "Testimonials", count: data?.total_testimonials, to: "/admin/content/testimonials", icon: Star },
    { label: "FAQs", count: data?.total_faqs, to: "/admin/content/faqs", icon: HelpCircle },
  ];

  const attentionItems = data?.needsAttention ?? [];

  return (
    <div className="space-y-6 w-full max-w-[1700px] xl:max-w-[1800px] mx-auto">
      {/* Welcome Banner */}
      <section className="bg-admin-panel border border-admin-panel-border p-6 md:p-7 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-admin-accent/15 text-admin-accent text-[11px] font-semibold tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" /> CMS Command Centre
            </div>
            <h1 className="font-serif text-2xl md:text-3xl text-foreground font-medium">Welcome to Baobab Admin</h1>
            <p className="text-[13px] text-foreground/65 mt-1 max-w-2xl">
              Manage your journeys, destinations, journal and website content from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/admin/adventures"
              className="inline-flex items-center gap-2 bg-admin-accent text-admin-accent-fg text-[13px] font-medium px-4 py-2 rounded shadow-xs hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Adventure
            </Link>
            <Link
              to="/admin/journal"
              className="inline-flex items-center gap-2 border border-admin-panel-border bg-admin-canvas text-foreground text-[13px] font-medium px-3.5 py-2 rounded hover:bg-admin-menu-hover/20 transition-colors"
            >
              <FileText className="w-4 h-4 text-admin-accent" /> New Article
            </Link>
          </div>
        </div>
      </section>

      {/* At a Glance */}
      <section>
        <h2 className="text-[11px] font-semibold tracking-[0.24em] uppercase text-foreground/60 mb-3 px-1">
          At a Glance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                to={s.to as any}
                className={`group flex flex-col justify-between p-4 rounded-lg border bg-admin-panel transition-all hover:shadow-md hover:border-admin-accent/50 ${
                  s.highlight ? "border-warning/40 bg-warning/5 ring-1 ring-warning/20" : "border-admin-panel-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="h-8 w-8 rounded bg-admin-canvas text-admin-accent flex items-center justify-center group-hover:bg-admin-accent group-hover:text-admin-accent-fg transition-colors">
                    <Icon className="w-4 h-4" strokeWidth={1.8} />
                  </span>
                  {s.highlight && <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse" />}
                </div>
                <div>
                  {isLoading || s.value === undefined ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-serif font-semibold text-foreground leading-none">{s.value}</p>
                  )}
                  <p className="text-[12px] font-medium text-foreground/80 mt-1 truncate">{s.label}</p>
                  <p className="text-[10px] text-foreground/50 truncate mt-0.5">{s.sublabel}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Main Grid: Needs Attention & Quick Actions, Recent Activity & Content Overview */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Needs Attention Panel */}
          <Panel
            title="Needs Attention"
            subtitle="Actionable items and content completeness"
            action={
              attentionItems.length > 0 ? (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-warning/15 text-warning-foreground font-semibold">
                  {attentionItems.length} {attentionItems.length === 1 ? "item" : "items"}
                </span>
              ) : null
            }
          >
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : attentionItems.length === 0 ? (
              <div className="p-6 text-center text-foreground/70 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-foreground">Everything is up to date.</p>
                <p className="text-xs text-foreground/50 mt-0.5">
                  No unhandled enquiries, unpublished drafts or missing assets found.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-admin-panel-border">
                {attentionItems.map((item) => (
                  <li
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-admin-canvas/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                          item.tone === "rose"
                            ? "bg-destructive/15 text-destructive"
                            : item.tone === "blue"
                              ? "bg-savannah/15 text-savannah"
                              : "bg-warning/15 text-warning"
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                      <p className="text-[13px] text-foreground font-medium truncate">{item.label}</p>
                    </div>
                    <Link
                      to={item.to as any}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-admin-accent hover:underline shrink-0"
                    >
                      {item.actionText} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Recent Activity Panel */}
          <Panel
            title="Recent Activity"
            subtitle="Real-time timeline across website and admin operations"
            action={
              <Link to="/admin/enquiries" className="text-[12px] text-admin-accent hover:underline">
                View enquiries
              </Link>
            }
          >
            <ul className="divide-y divide-admin-panel-border">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </li>
                ))
              ) : (data?.activity ?? []).length === 0 ? (
                <li className="px-5 py-10 text-center text-[13px] text-foreground/60">
                  No recent activity recorded yet.
                </li>
              ) : (
                (data?.activity ?? []).map((a: any, i: number) => {
                  const Icon =
                    a.kind === "enquiry"
                      ? MessageSquare
                      : a.kind === "journal"
                        ? FileText
                        : a.kind === "adventure"
                          ? Compass
                          : a.kind === "destination"
                            ? MapPin
                            : a.kind === "subscriber"
                              ? Mail
                              : Users;

                  return (
                    <li
                      key={i}
                      className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-admin-canvas/50 transition-colors"
                    >
                      <span className="h-8 w-8 rounded bg-admin-canvas text-admin-accent flex items-center justify-center shrink-0 border border-admin-panel-border/50">
                        <Icon className="w-4 h-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground truncate">{a.title}</p>
                        <p className="text-[11px] text-foreground/55 truncate mt-0.5">{a.subtitle}</p>
                      </div>
                      <span className="text-[11px] text-foreground/45 shrink-0 font-mono">{formatRelative(a.at)}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </Panel>
        </div>

        {/* Right Column (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Quick Actions */}
          <Panel title="Quick Actions" subtitle="Create new content in one click">
            <div className="p-3 space-y-1.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.to as any}
                    className={`group flex items-center gap-3 p-2.5 rounded transition-all hover:bg-admin-canvas ${
                      action.accent ? "bg-admin-accent/5 border border-admin-accent/20" : ""
                    }`}
                  >
                    <span
                      className={`h-8 w-8 rounded flex items-center justify-center shrink-0 transition-colors ${
                        action.accent
                          ? "bg-admin-accent text-admin-accent-fg"
                          : "bg-admin-canvas text-admin-accent group-hover:bg-admin-accent group-hover:text-admin-accent-fg"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground leading-snug">+ {action.label}</p>
                      <p className="text-[11px] text-foreground/50 truncate">{action.description}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-foreground/30 group-hover:text-admin-accent transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </Panel>

          {/* Content Overview */}
          <Panel title="Content Overview" subtitle="Total repeatable catalog items">
            <div className="divide-y divide-admin-panel-border">
              {contentOverview.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to as any}
                    className="group flex items-center justify-between px-5 py-3 hover:bg-admin-canvas/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-admin-menu-muted group-hover:text-admin-accent transition-colors" />
                      <span className="text-[13px] text-foreground font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoading || item.count === undefined ? (
                        <Skeleton className="h-4 w-6" />
                      ) : (
                        <span className="text-[12px] font-mono font-semibold px-2 py-0.5 rounded bg-admin-canvas text-foreground/80 border border-admin-panel-border">
                          {item.count}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-foreground/30 group-hover:text-admin-accent transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
