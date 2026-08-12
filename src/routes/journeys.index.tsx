import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FilterBar, type FilterOption } from "@/components/site/FilterBar";
import { CardGridSkeleton } from "@/components/site/CardSkeleton";
import { journeys } from "@/lib/content";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  sort: z.enum(["featured", "name-asc", "name-desc"]).optional().catch("featured"),
});

export const Route = createFileRoute("/journeys/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Our Journeys — The Baobab Collective" },
      { name: "description", content: "Handpicked safari experiences that celebrate adventure, connection, heritage and conservation across Africa." },
      { property: "og:title", content: "Our Journeys — The Baobab Collective" },
      { property: "og:description", content: "Curated safari journeys across Africa." },
      { property: "og:url", content: "/journeys" },
    ],
    links: [{ rel: "canonical", href: "/journeys" }],
  }),
  component: JourneysIndex,
});

const categoryOptions: FilterOption[] = [
  { value: "adventure", label: "Adventure" },
  { value: "connection", label: "Connection" },
  { value: "heritage", label: "Heritage" },
  { value: "conservation", label: "Conservation" },
];

const sortOptions: FilterOption[] = [
  { value: "featured", label: "Featured order" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

function JourneysIndex() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const q = search.q ?? "";
  const category = search.category ?? "all";
  const sort = search.sort ?? "featured";

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = journeys.filter((j) => {
      if (category !== "all" && j.slug !== category) return false;
      if (!needle) return true;
      return (
        j.title.toLowerCase().includes(needle) ||
        j.tagline.toLowerCase().includes(needle) ||
        j.intro.toLowerCase().includes(needle)
      );
    });
    if (sort === "name-asc") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "name-desc") list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    return list;
  }, [q, category, sort]);

  const hasFilters = q !== "" || category !== "all" || sort !== "featured";
  const setSearch = (patch: Record<string, unknown>) =>
    navigate({ to: "/journeys", search: ((prev: Record<string, unknown>) => ({ ...prev, ...patch })) as any, replace: true });

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <section className="bg-cream py-20 md:py-28">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-5">Curated Safari Journeys</p>
            <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-6 tracking-wider">OUR JOURNEYS</h1>
            <p className="text-foreground/75 max-w-2xl mx-auto">
              Handpicked safari experiences that celebrate adventure, connection, heritage and conservation.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 space-y-8">
            <FilterBar
              query={q}
              onQueryChange={(v) => setSearch({ q: v || undefined })}
              queryPlaceholder="Search journeys…"
              category={category}
              categoryOptions={categoryOptions}
              categoryLabel="Category"
              onCategoryChange={(v) => setSearch({ category: v === "all" ? undefined : v })}
              sort={sort}
              sortOptions={sortOptions}
              onSortChange={(v) => setSearch({ sort: v === "featured" ? undefined : v })}
              resultCount={filtered.length}
              totalCount={journeys.length}
              hasFilters={hasFilters}
              onReset={() => navigate({ to: "/journeys", search: {} as any, replace: true })}
            />

            <Suspense fallback={<CardGridSkeleton count={6} />}>
              {filtered.length === 0 ? (
                <div className="py-20 text-center text-foreground/70">
                  <p className="font-serif text-2xl mb-2">No journeys match those filters</p>
                  <p className="text-sm">Try clearing filters or searching a different term.</p>
                </div>
              ) : (
                <ul
                  aria-label="Safari journeys"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 list-none p-0"
                >
                  {filtered.map((j) => {
                    const titleId = `journey-${j.slug}-title`;
                    return (
                      <li key={j.slug}>
                        <Link
                          to="/journeys/$slug"
                          params={{ slug: j.slug }}
                          aria-labelledby={titleId}
                          aria-describedby={`${titleId}-desc`}
                          className="group relative flex flex-col h-full bg-background border border-border rounded-xl overflow-hidden motion-safe:transition-all motion-safe:duration-500 motion-safe:hover:-translate-y-1 hover:shadow-2xl hover:shadow-foreground/10 hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                              src={j.heroImage}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-700 ease-out motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
                            <span className="absolute top-4 left-4 bg-background/90 backdrop-blur text-[10px] tracking-[0.25em] uppercase px-3 py-1.5 text-foreground rounded-full capitalize">
                              {j.slug}
                            </span>
                          </div>
                          <div className="p-6 md:p-7 flex flex-col flex-1">
                            <p className="text-[11px] tracking-[0.25em] uppercase text-gold mb-2">{j.tagline}</p>
                            <h2
                              id={titleId}
                              className="font-serif text-2xl md:text-3xl text-foreground mb-3 group-hover:text-gold group-focus-visible:text-gold transition-colors"
                            >
                              {j.title}
                            </h2>
                            <p id={`${titleId}-desc`} className="text-foreground/70 text-sm leading-relaxed mb-5 line-clamp-3 flex-1">
                              {j.intro}
                            </p>
                            <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                              <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-foreground">
                                Explore Journey
                              </span>
                              <ArrowRight
                                aria-hidden="true"
                                className="w-4 h-4 text-gold motion-safe:transition-transform motion-safe:duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                              />
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
