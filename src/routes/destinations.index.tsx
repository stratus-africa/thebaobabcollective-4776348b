import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ShareButtons } from "@/components/site/ShareButtons";
import { getDestinations } from "@/lib/cms.functions";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";

const q = queryOptions({ queryKey: ["destinations"], queryFn: () => getDestinations() });

export const Route = createFileRoute("/destinations/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  head: () => ({
    meta: [
      { title: "Destinations — The Baobab Collective" },
      { name: "description", content: "Discover the regions, parks and coasts of Africa we know best." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center">Not found</div>,
  component: DestinationsPage,
});

function DestinationsPage() {
  const { data: all } = useSuspenseQuery(q);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string>("All");
  const regions = ["All", ...Array.from(new Set(all.map((d) => d.region)))];

  const filtered = all.filter((d) => {
    const matchesRegion = region === "All" || d.region === region;
    const s = search.trim().toLowerCase();
    const matchesSearch =
      !s ||
      d.name.toLowerCase().includes(s) ||
      d.country.toLowerCase().includes(s) ||
      d.description.toLowerCase().includes(s);
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <section className="bg-cream py-20 text-center px-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">The Continent</p>
          <h1 className="font-serif text-5xl md:text-6xl mb-5">Destinations</h1>
          <p className="max-w-2xl mx-auto text-foreground/75">
            From the deltas of Botswana to the highlands of Ethiopia — explore where each journey could take you.
          </p>
        </section>

        <section className="py-12 border-b border-border/40">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row gap-4 items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search destinations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`px-4 py-2 text-[11px] tracking-[0.2em] uppercase border ${region === r ? "bg-forest text-forest-foreground border-forest" : "border-border text-foreground/70 hover:border-gold hover:text-gold"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((d) => (
              <article
                key={d.id}
                className="group bg-cream overflow-hidden rounded-xl border border-border motion-safe:transition-all motion-safe:duration-500 motion-safe:hover:-translate-y-1 hover:shadow-2xl hover:shadow-foreground/10 hover:border-gold/40 focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-background"
              >
                <Link
                  to="/destinations/$slug"
                  params={{ slug: d.slug }}
                  aria-label={`View ${d.name}`}
                  className="block focus:outline-none"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={d.image}
                      alt={d.name}
                      loading="lazy"
                      className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-gold mb-2">
                      <MapPin className="w-3 h-3" /> {d.country} · {d.region}
                    </div>
                    <h2 className="font-serif text-2xl text-foreground mb-2 group-hover:text-gold transition-colors">
                      {d.name}
                    </h2>
                    <p className="text-foreground/70 text-sm leading-relaxed mb-4 line-clamp-3">{d.description}</p>
                    {d.best_season && (
                      <p className="text-[11px] tracking-[0.15em] uppercase text-foreground/60 mb-3">
                        Best: {d.best_season}
                      </p>
                    )}
                    {d.featured_trips?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {d.featured_trips.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] tracking-wider uppercase border border-border px-2 py-1 text-foreground/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
                <div className="px-6 pb-6 pt-2 border-t border-border/40 mt-2">
                  <ShareButtons
                    title={`${d.name}, ${d.country} — The Baobab Collective`}
                    description={d.description?.slice(0, 140)}
                    label="Share"
                  />
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-foreground/60 py-20">No destinations match your search.</p>
            )}
          </div>
        </section>

        <section className="bg-forest text-forest-foreground py-16 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-3xl mb-4">Not sure where to begin?</h2>
            <p className="mb-6 text-forest-foreground/80">Let us match you to the region that suits your dream trip.</p>
            <Link
              to="/private-travel"
              className="inline-flex items-center bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[12px] px-8 py-3.5 hover:bg-gold/90"
            >
              Plan a private journey
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
