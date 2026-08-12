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
  FileText,
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
  return <div className={`bg-muted/60 animate-pulse rounded ${className}`} />;
}

function Dashboard() {
  const fn = useServerFn(adminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fn() });
  const activityCount = data?.activity?.length ?? 0;

  const stats = [
    {
      label: "Active Enquiries",
      value: data?.enquiries,
      icon: MessageSquare,
      tone: "bg-cream/15 text-cream",
    },
    {
      label: "Visitor Counter",
      value: data?.visitor_count,
      icon: Users,
      tone: "bg-terracotta/20 text-terracotta",
    },
    {
      label: "Active Partner Lodges",
      value: data?.active_lodges,
      icon: Building,
      tone: "bg-gold/15 text-gold",
    },
    {
      label: "Active Destinations",
      value: data?.active_destinations,
      icon: MapPin,
      tone: "bg-cream/10 text-cream",
    },
  ];

  const quickTasks = [
    { to: "/admin/content/itineraries", label: "Add an Itinerary", icon: PlusCircle },
    { to: "/admin/enquiries", label: "Review Enquiries", icon: CheckCircle2 },
    { to: "/admin/adventures", label: "Update Adventures Page", icon: Compass },
    { to: "/admin/content/journal_articles", label: "Publish an Article", icon: FileText },
  ];

  const tools = [
    { to: "/admin/content/lodges", label: "Lodges", icon: Building, blurb: "Curate partner camps & lodges" },
    { to: "/admin/content/destinations", label: "Destinations", icon: MapPin, blurb: "Manage destination guides" },
    { to: "/admin/private-travel", label: "Private Travel", icon: Briefcase, blurb: "Bespoke travel requests" },
    { to: "/admin/content/testimonials", label: "Testimonials", icon: BookOpen, blurb: "Manage guest testimonials" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome card */}
      <section className="relative overflow-hidden bg-forest text-forest-foreground border border-forest/20 rounded-lg p-6 md:p-8 shadow-xl shadow-forest/10">
        <div className="absolute inset-x-0 top-0 h-px bg-gold/70" aria-hidden="true" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 items-center">
            <div className="h-12 w-12 rounded-md bg-gold text-gold-foreground flex items-center justify-center font-serif text-xl shrink-0 shadow-sm">
              B
            </div>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.28em] uppercase text-forest-foreground/55">Admin Dashboard</p>
              <h1 className="font-serif text-3xl md:text-4xl text-forest-foreground truncate">Welcome back</h1>
              <p className="text-sm text-forest-foreground/65 mt-1">
                Here is what is moving across the collective today.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.18em] uppercase">
            <Link
              to="/admin/enquiries"
              className="rounded-full border border-forest-foreground/15 px-3 py-2 text-forest-foreground/75 hover:border-gold hover:text-gold transition-colors"
            >
              Review Enquiries
            </Link>
            <Link
              to="/admin/adventures"
              className="rounded-full bg-gold px-3 py-2 text-gold-foreground hover:bg-gold/90 transition-colors"
            >
              Update Adventures
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-3 p-4 rounded-md bg-forest-foreground/[0.06] border border-forest-foreground/10"
              >
                <span className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${s.tone}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-forest-foreground/55 truncate">{s.label}</p>
                  {isLoading || s.value === undefined ? (
                    <Skeleton className="h-6 w-16 mt-1 bg-forest-foreground/15" />
                  ) : (
                    <p className="font-serif text-xl md:text-2xl text-forest-foreground leading-tight">{s.value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main grid: left content, right admin tools (stacked) */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6 min-w-0">
          <div className="bg-background border border-border rounded-lg shadow-sm">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-foreground">Recent Activity</h2>
                <p className="text-xs text-foreground/55 mt-0.5">{activityCount} updates in the latest feed</p>
              </div>
              <Link to="/admin/enquiries" className="text-[11px] tracking-[0.2em] uppercase text-gold hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-border/70">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="px-6 py-4 flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </li>
                ))
              ) : (data?.activity ?? []).length === 0 ? (
                <li className="px-6 py-10 text-center text-sm text-foreground/60">No recent activity yet.</li>
              ) : (
                (data?.activity ?? []).map((a, i) => {
                  const Icon = a.kind === "booking" ? Calendar : a.kind === "enquiry" ? MessageSquare : Plane;
                  return (
                    <li key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-cream/40 transition-colors">
                      <span className="h-9 w-9 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" strokeWidth={1.6} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{a.title}</p>
                        <p className="text-xs text-foreground/60 truncate">{a.subtitle}</p>
                      </div>
                      <span className="text-[11px] text-foreground/50 shrink-0">{formatRelative(a.at)}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="bg-background border border-border rounded-lg shadow-sm">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="font-serif text-xl text-foreground">Quick Tasks</h2>
            </div>
            <ul className="p-3 space-y-1">
              {quickTasks.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.to}>
                    <Link
                      to={t.to as any}
                      className="group flex items-center gap-3 p-3 rounded-md hover:bg-cream transition-colors"
                    >
                      <span className="h-9 w-9 rounded-md bg-cream text-foreground flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-gold-foreground transition-colors">
                        <Icon className="w-4 h-4" strokeWidth={1.6} />
                      </span>
                      <span className="text-sm text-foreground flex-1">{t.label}</span>
                      <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-gold transition-colors" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <aside className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Admin Tools</h2>
          <div className="flex flex-col gap-3">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to as any}
                  className="group flex items-start gap-3 bg-background border border-border rounded-lg p-4 hover:border-gold/50 hover:shadow-md transition-all"
                >
                  <span className="h-10 w-10 rounded-md bg-forest/10 text-forest flex items-center justify-center shrink-0 group-hover:bg-gold/15 group-hover:text-gold transition-colors">
                    <Icon className="w-5 h-5" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-base text-foreground">{t.label}</p>
                    <p className="text-xs text-foreground/60 mt-0.5">{t.blurb}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-gold transition-colors mt-1" />
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
}
