import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MapPin, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  getAdventuresPage,
  saveAdventuresPage,
  type AdventuresPage,
  adventuresDefaults,
  normalizeAdventureSignatures,
} from "@/lib/adventures.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/adventures")({
  component: AdminAdventures,
});

function AdminAdventures() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchPage = useServerFn(getAdventuresPage);
  const savePage = useServerFn(saveAdventuresPage);

  const { data, isLoading } = useQuery<AdventuresPage>({
    queryKey: ["admin-adventures-page"],
    queryFn: () => fetchPage(),
  });

  const page = data ?? adventuresDefaults;
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signatures = useMemo(() => {
    const list = normalizeAdventureSignatures(page.signatures ?? []);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) =>
      [s.name, s.region, s.terrain, s.difficulty].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [page.signatures, query]);

  async function handleDelete(slug: string) {
    setBusy(true);
    try {
      await savePage({
        data: {
          hero: page.hero,
          cta: page.cta,
          signatures: (page.signatures ?? []).filter((s) => s.slug !== slug),
        } as never,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-adventures-page"] });
      await queryClient.invalidateQueries({ queryKey: ["adventures-page"] });
      toast.success("Adventure deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete adventure");
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Adventures</h1>
          <p className="text-sm text-muted-foreground">Create, edit and remove adventure packages.</p>
        </div>
        <Button
          onClick={() => navigate({ to: "/admin/adventures/$slug", params: { slug: "new" } })}
          className="bg-gold text-gold-foreground hover:bg-gold/90"
        >
          <Plus className="w-4 h-4 mr-2" /> New Adventure
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search adventures…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : signatures.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No adventures yet. Create your first package.
        </div>
      ) : (
        <div className="rounded-lg border divide-y bg-card">
          {signatures.map((s) => (
            <div key={s.slug} className="flex items-center gap-4 p-4">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {s.image ? (
                  <img src={s.image} alt={s.imageAlt || s.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-foreground/30" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{s.region || "—"}</span>
                  {s.nights ? <span>· {s.nights}</span> : null}
                </div>
              </div>
              {s.difficulty ? <Badge variant="secondary">{s.difficulty}</Badge> : null}
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/adventures/$slug" params={{ slug: s.slug }}>
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setPendingDelete(s.slug)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this adventure?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) void handleDelete(pendingDelete);
              }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
