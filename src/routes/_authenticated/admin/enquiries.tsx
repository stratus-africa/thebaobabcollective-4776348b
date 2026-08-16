import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, CheckCircle2, Mail, Loader2, AlertCircle, Ban, RotateCcw } from "lucide-react";
import { adminListEnquiries, adminUpdateEnquiry } from "@/lib/admin.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrivateTravelList } from "@/components/admin/PrivateTravelList";

export const Route = createFileRoute("/_authenticated/admin/enquiries")({
  component: EnquiriesTabs,
});

function EnquiriesTabs() {
  return (
    <Tabs defaultValue="enquiries" className="space-y-6">
      <TabsList>
        <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
        <TabsTrigger value="private-travel">Private Travel</TabsTrigger>
      </TabsList>
      <TabsContent value="enquiries" className="mt-0">
        <EnquiriesAdmin />
      </TabsContent>
      <TabsContent value="private-travel" className="mt-0 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Private Travel Requests</h1>
          <p className="text-sm text-foreground/60 mt-1">Bespoke private travel enquiries.</p>
        </div>
        <PrivateTravelList />
      </TabsContent>
    </Tabs>
  );
}

type StatusFilter = "all" | "new" | "handled" | "spam";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "new", label: "New" },
  { value: "handled", label: "Handled" },
  { value: "spam", label: "Spam" },
  { value: "all", label: "All" },
];

function EnquiriesAdmin() {
  const list = useServerFn(adminListEnquiries);
  const update = useServerFn(adminUpdateEnquiry);
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("new");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-enquiries", status, debounced],
    queryFn: () => list({ data: { status, search: debounced || undefined, limit: 100 } }),
  });

  const mutate = useMutation({
    mutationFn: (vars: { id: string; status: "new" | "handled" | "spam" }) =>
      update({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === "handled"
          ? "Marked as handled"
          : vars.status === "spam"
            ? "Marked as spam"
            : "Reopened",
      );
      qc.invalidateQueries({ queryKey: ["admin-enquiries"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Enquiries</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Inbox of contact & enquiry form submissions, with email delivery status.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDebounced(e.target.value);
            }}
            placeholder="Search name, email, message…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border bg-background outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`px-4 py-2 text-sm uppercase tracking-[0.2em] -mb-px border-b-2 transition-colors ${
              status === t.value
                ? "border-gold text-foreground"
                : "border-transparent text-foreground/55 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
        {isFetching && (
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-foreground/50 px-2 py-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Refreshing
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-foreground/60">Loading…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-foreground/60 border border-dashed border-border p-8 text-center">
          No enquiries in this view.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((e: any) => {
            const isOpen = expanded === e.id;
            return (
              <li key={e.id} className="border border-border bg-background">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  className="w-full text-left p-4 sm:p-5 flex flex-wrap gap-4 items-start hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{e.name}</p>
                      <a
                        href={`mailto:${e.email}`}
                        onClick={(ev) => ev.stopPropagation()}
                        className="text-sm text-foreground/60 hover:text-gold"
                      >
                        {e.email}
                      </a>
                      <StatusBadge value={e.status} />
                      <EmailBadge value={e.email_status} />
                    </div>
                    <p className="mt-2 text-sm text-foreground/70 line-clamp-2">{e.message}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/55">
                      {e.destination && <span>📍 {e.destination}</span>}
                      {e.travel_dates && <span>🗓 {e.travel_dates}</span>}
                      {e.adults != null && <span>{e.adults} adults{e.children ? ` · ${e.children} children` : ""}</span>}
                      <span className="ml-auto">{new Date(e.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border p-4 sm:p-5 space-y-4 bg-accent/10">
                    <Detail label="Phone" value={e.phone} />
                    <Detail label="Subject" value={e.subject} />
                    <Detail label="Budget" value={e.budget} />
                    <Detail label="Trip type" value={e.trip_type} />
                    <Detail label="Accommodation" value={e.accommodation_style} />
                    <Detail label="Experiences" value={(e.experiences ?? []).join(", ")} />
                    <Detail label="Source page" value={e.source_url} />
                    <Detail label="Referral" value={e.referral_source} />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/50 mb-1">Message</p>
                      <p className="whitespace-pre-wrap text-sm text-foreground/85">{e.message}</p>
                    </div>
                    {e.email_status && (
                      <div className="border border-border p-3 text-xs">
                        <p className="text-foreground/60">
                          Notification email · <strong>{e.email_status.status}</strong> ·{" "}
                          {new Date(e.email_status.created_at).toLocaleString()}
                        </p>
                        {e.email_status.error_message && (
                          <p className="mt-1 text-destructive">Error: {e.email_status.error_message}</p>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <a
                        href={`mailto:${e.email}?subject=${encodeURIComponent("Re: your enquiry")}`}
                        className="inline-flex items-center gap-2 text-xs px-3 py-2 border border-border hover:bg-accent"
                      >
                        <Mail className="w-3 h-3" /> Reply
                      </a>
                      {e.status !== "handled" && (
                        <button
                          onClick={() => mutate.mutate({ id: e.id, status: "handled" })}
                          disabled={mutate.isPending}
                          className="inline-flex items-center gap-2 text-xs px-3 py-2 bg-gold text-gold-foreground hover:bg-gold/90"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark handled
                        </button>
                      )}
                      {e.status !== "spam" && (
                        <button
                          onClick={() => mutate.mutate({ id: e.id, status: "spam" })}
                          disabled={mutate.isPending}
                          className="inline-flex items-center gap-2 text-xs px-3 py-2 border border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <Ban className="w-3 h-3" /> Spam
                        </button>
                      )}
                      {e.status !== "new" && (
                        <button
                          onClick={() => mutate.mutate({ id: e.id, status: "new" })}
                          disabled={mutate.isPending}
                          className="inline-flex items-center gap-2 text-xs px-3 py-2 border border-border hover:bg-accent"
                        >
                          <RotateCcw className="w-3 h-3" /> Reopen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ value }: { value: string | null }) {
  const v = value ?? "new";
  const styles: Record<string, string> = {
    new: "bg-gold/15 text-gold border-gold/40",
    handled: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    spam: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 border ${styles[v] ?? styles.new}`}
    >
      {v}
    </span>
  );
}

function EmailBadge({
  value,
}: {
  value: { status: string; error_message: string | null; created_at: string } | null;
}) {
  if (!value) {
    return (
      <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 border border-border text-foreground/55">
        no email
      </span>
    );
  }
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    pending: { label: "queued", cls: "border-amber-500/40 text-amber-700 bg-amber-500/10", icon: Loader2 },
    sent: { label: "sent", cls: "border-emerald-500/40 text-emerald-700 bg-emerald-500/10", icon: CheckCircle2 },
    dlq: { label: "failed", cls: "border-destructive/40 text-destructive bg-destructive/10", icon: AlertCircle },
    failed: { label: "failed", cls: "border-destructive/40 text-destructive bg-destructive/10", icon: AlertCircle },
    suppressed: { label: "suppressed", cls: "border-border text-foreground/60", icon: Ban },
  };
  const m = map[value.status] ?? { label: value.status, cls: "border-border text-foreground/60", icon: Mail };
  const Icon = m.icon;
  return (
    <span
      title={value.error_message ?? `Email ${m.label} · ${new Date(value.created_at).toLocaleString()}`}
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 border ${m.cls}`}
    >
      <Icon className={`w-3 h-3 ${value.status === "pending" ? "animate-spin" : ""}`} /> {m.label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/50">{label}</p>
      <p className="text-sm text-foreground/85">{value}</p>
    </div>
  );
}
