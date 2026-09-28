import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Compass, Loader2 } from "lucide-react";
import { BEST_FOR_CATEGORIES } from "@/lib/destinations.data";
import { recommendTrip, type TripRecommendation } from "@/lib/trip-recommender.functions";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { SiteImage } from "@/components/site/SiteImage";
import { MEDIA_ASSETS } from "@/lib/media-assets";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const PARTY = ["Couple", "Solo", "Family", "Friends", "Multi-generational"];

export function TripRecommender({ initialInterests = [] }: { initialInterests?: string[] }) {
  const recommend = useServerFn(recommendTrip);
  const { currencySymbol } = useSiteSettings();
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [experiences, setExperiences] = useState("");
  const [budget, setBudget] = useState("");
  const [travelMonth, setTravelMonth] = useState("");
  const [partyType, setPartyType] = useState("Couple");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TripRecommendation | null>(null);

  const toggle = (id: string) =>
    setInterests((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await recommend({ data: { interests, experiences, budget, travelMonth, partyType } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const profile = [
    interests.join(", "),
    experiences && `Experiences: ${experiences}`,
    budget && `Budget: ${budget}`,
    travelMonth && `When: ${travelMonth}`,
    partyType,
  ]
    .filter(Boolean)
    .join(" · ");

  const field =
    "w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold";

  return (
    <div className="space-y-12">
      <form onSubmit={onSubmit} className="bg-background rounded-3xl border border-border p-6 sm:p-10 shadow-xl space-y-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">Your travel priorities</p>
          <div className="flex flex-wrap gap-2.5">
            {BEST_FOR_CATEGORIES.map((c) => {
              const on = interests.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    on ? "bg-forest text-cream" : "bg-cream text-foreground/75 border border-border hover:border-gold hover:text-gold"
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5 text-gold" />}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <label className="space-y-2 block">
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">Budget per person</span>
            <input className={field} placeholder={`e.g. ${currencySymbol}6,000–10,000`} value={budget} onChange={(e) => setBudget(e.target.value)} maxLength={80} />
          </label>
          <label className="space-y-2 block">
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">When</span>
            <input className={field} placeholder="e.g. August 2027, flexible" value={travelMonth} onChange={(e) => setTravelMonth(e.target.value)} maxLength={80} />
          </label>
          <label className="space-y-2 block">
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">Travelling as</span>
            <select className={field} value={partyType} onChange={(e) => setPartyType(e.target.value)}>
              {PARTY.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2 block">
          <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">Experiences you'd love</span>
          <textarea
            className={`${field} min-h-[110px]`}
            placeholder="e.g. Big cat sightings, a hot-air balloon at dawn, walking with Samburu guides, and a few barefoot days by the ocean"
            value={experiences}
            onChange={(e) => setExperiences(e.target.value)}
            maxLength={1000}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-4 hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
          {loading ? "Designing your journey…" : "Get my recommendations"}
        </button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </form>

      {result && (
        <div className="space-y-10" aria-live="polite">
          {result.summary && <p className="font-serif text-2xl md:text-3xl text-foreground leading-snug max-w-4xl">{result.summary}</p>}

          {result.destinations.length > 0 && (
            <ResultGroup title="Destinations for you">
              {result.destinations.map((d) => (
                <ResultCard
                  key={d.slug}
                  name={d.name}
                  image={d.image}
                  reason={d.reason}
                  link={<Link to="/destinations/$slug" params={{ slug: d.slug }} className="underline-offset-4 hover:underline hover:text-gold">View destination</Link>}
                  enquire={{ subject: d.name, profile, slug: d.slug, kind: "Destination" }}
                />
              ))}
            </ResultGroup>
          )}

          {result.adventures.length > 0 && (
            <ResultGroup title="Adventures for you">
              {result.adventures.map((a) => (
                <ResultCard
                  key={a.slug}
                  name={a.name}
                  meta={a.nights}
                  image={a.image}
                  reason={a.reason}
                  link={<Link to="/adventures/$slug" params={{ slug: a.slug }} className="underline-offset-4 hover:underline hover:text-gold">View adventure</Link>}
                  enquire={{ subject: a.name, profile, slug: a.slug, kind: "Adventure" }}
                />
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-5">{title}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
    </section>
  );
}

function ResultCard({
  name,
  meta,
  image,
  reason,
  link,
  enquire,
}: {
  name: string;
  meta?: string;
  image: string | null;
  reason: string;
  link: React.ReactNode;
  enquire: { subject: string; profile: string; slug: string; kind: "Destination" | "Adventure" };
}) {
  return (
    <article className="bg-background rounded-2xl border border-border overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-forest">
        <SiteImage
          src={image || MEDIA_ASSETS.heroBaobab}
          alt={name}
          loading="lazy"
          sizes="(max-width: 1024px) 100vw, 33vw"
          responsiveWidths={[640, 960]}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-6 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-serif text-2xl text-foreground">{name}</h3>
          {meta && <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 mt-1">{meta}</p>}
        </div>
        <p className="text-sm text-foreground/75 leading-relaxed flex-1">{reason}</p>
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border text-xs font-semibold uppercase tracking-[0.15em] text-foreground/75">
          {link}
          <EnquireDialog
            defaultSubject={enquire.subject}
            defaultDestination={enquire.subject}
            sourceUrl="/plan-with-ai"
            autosaveKey={`enquire:ai:${enquire.slug}`}
            context={{ kind: enquire.kind, title: enquire.subject, dates: enquire.profile, slug: enquire.slug, image: image || MEDIA_ASSETS.heroBaobab }}
            trigger={
              <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-gold text-gold-foreground px-4 py-2 hover:bg-gold/90">
                Enquire <ArrowRight className="w-3 h-3" />
              </button>
            }
          />
        </div>
      </div>
    </article>
  );
}
