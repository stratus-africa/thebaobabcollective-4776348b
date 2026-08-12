import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminDashboard } from "@/lib/admin.functions";
import {
  Calendar,
  MessageSquare,
  Plane,
  Users,
  PlusCircle,
  CheckCircle2,
  Compass,
  ArrowRight,
  Briefcase,
  MapPin,
  Building,
  BookOpen,
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
  return <div className={`bg-muted/60 animate-pulse rounded-sm ${className}`} />;
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-admin-panel border border-admin-panel-border shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-admin-panel-border">
        <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

function Dashboard() {
  const fn = useServerFn(adminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fn() });

  const stats = [
    { label: "Active Enquiries", value: data?.enquiries, icon: MessageSquare, to: "/admin/enquiries" },
    { label: "Visitor Counter", value: data?.visitor_count, icon: Users, to: "/admin" },
    { label: "Active Partner Lodges", value: data?.active_lodges, icon: Building, to: "/admin/content/lodges" },
    { label: "Active Destinations", value: data?.active_destinations, icon: MapPin, to: "/admin/content/destinations" },
  ];

  const quickTasks = [
    { to: "/admin/content/destinations", label: "Manage Destinations", icon: MapPin },
    { to: "/admin/content/itineraries", label: "Add an Itinerary", icon: PlusCircle },
    { to: "/admin/enquiries", label: "Review Enquiries", icon: CheckCircle2 },
    { to: "/admin/adventures", label: "Update Adventures Page", icon: Compass },
  ];

  const tools = [
    { to: "/admin/content/lodges", label: "Lodges", icon: Building, blurb: "Curate partner camps & lodges" },
    { to: "/admin/content/destinations", label: "Destinations", icon: MapPin, blurb: "Manage destination guides" },
    { to: "/admin/private-travel", label: "Private Travel", icon: Briefcase, blurb: "Bespoke travel requests" },
    { to: "/admin/content/testimonials", label: "Testimonials", icon: BookOpen, blurb: "Manage guest testimonials" },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome panel */}
      <section className="bg-admin-panel border border-admin-panel-border p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Welcome to Baobab Admin</h2>
            <p className="text-[13px] text-foreground/60 mt-1">
              Everything moving across the collective today, in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/content/destinations"
              className="inline-flex items-center gap-2 bg-admin-accent text-admin-accent-fg text-[13px] px-3.5 py-2 rounded-sm hover:opacity-90 transition-opacity"
            >
              <MapPin className="w-4 h-4" /> Manage Destinations
            </Link>
            <Link
              to="/admin/enquiries"
              className="inline-flex items-center gap-2 border border-admin-accent text-admin-accent text-[13px] px-3.5 py-2 rounded-sm hover:bg-admin-accent/10 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Review Enquiries
            </Link>
          </div>
        </div>
      </section>

      {/* At a Glance */}
      <Panel title="At a Glance">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-admin-panel-border">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                to={s.to as any}
                className="group flex items-center gap-3 p-4 hover:bg-admin-canvas transition-colors"
              >
                <span className="h-9 w-9 rounded-sm bg-admin-canvas text-admin-accent flex items-center justify-center shrink-0 group-hover:bg-admin-accent group-hover:text-admin-accent-fg transition-colors">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  {isLoading || s.value === undefined ? (
                    <Skeleton className="h-6 w-14" />
                  ) : (
                    <p className="text-[22px] font-semibold text-foreground leading-none">{s.value}</p>
                  )}
                  <p className="text-[12px] text-foreground/60 mt-1 truncate">{s.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Panel
          title="Activity"
          action={
            <Link to="/admin/enquiries" className="text-[12px] text-admin-accent hover:underline">
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-admin-panel-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="px-4 py-3 flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-sm" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </li>
              ))
            ) : (data?.activity ?? []).length === 0 ? (
              <li className="px-4 py-10 text-center text-[13px] text-foreground/60">No recent activity yet.</li>
            ) : (
              (data?.activity ?? []).map((a, i) => {
                const Icon = a.kind === "booking" ? Calendar : a.kind === "enquiry" ? MessageSquare : Plane;
                return (
                  <li key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-admin-canvas transition-colors">
                    <span className="h-8 w-8 rounded-sm bg-admin-canvas text-admin-accent flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-foreground truncate">{a.title}</p>
                      <p className="text-[12px] text-foreground/60 truncate">{a.subtitle}</p>
                    </div>
                    <span className="text-[11px] text-foreground/50 shrink-0">{formatRelative(a.at)}</span>
                  </li>
                );
              })
            )}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title="Quick Tasks">
            <ul className="divide-y divide-admin-panel-border">
              {quickTasks.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.to}>
                    <Link
                      to={t.to as any}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-admin-canvas transition-colors"
                    >
                      <Icon className="w-4 h-4 text-admin-accent shrink-0" strokeWidth={1.8} />
                      <span className="text-[13px] text-foreground flex-1">{t.label}</span>
                      <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-admin-accent transition-colors" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Admin Tools">
            <ul className="divide-y divide-admin-panel-border">
              {tools.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.to}>
                    <Link
                      to={t.to as any}
                      className="group flex items-start gap-3 px-4 py-3 hover:bg-admin-canvas transition-colors"
                    >
                      <span className="h-8 w-8 rounded-sm bg-admin-canvas text-admin-accent flex items-center justify-center shrink-0 group-hover:bg-admin-accent group-hover:text-admin-accent-fg transition-colors">
                        <Icon className="w-4 h-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground">{t.label}</p>
                        <p className="text-[12px] text-foreground/60">{t.blurb}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-admin-accent transition-colors mt-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
