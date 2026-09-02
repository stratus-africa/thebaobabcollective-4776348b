import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { articles as staticArticles } from "@/lib/content";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";
import { useReveal } from "@/hooks/useReveal";

type Content = Partial<typeof PAGE_DEFAULTS.home_journal>;
type Article = {
  slug: string;
  title: string;
  image?: string | null;
};

export function Journal({
  content,
  articles,
}: {
  content?: Content | null;
  articles?: Article[] | null;
} = {}) {
  const base = { ...PAGE_DEFAULTS.home_journal, ...(content ?? {}) };
  const c = usePreviewMerge("home_journal", base);
  const list = (articles && articles.length > 0 ? articles : staticArticles).slice(0, 3);
  const [featured, ...supporting] = list;
  const leftRef = useReveal<HTMLDivElement>();
  const rightRef = useReveal<HTMLDivElement>(0.08);

  return (
    <section className="bg-sand/40 py-20 md:py-28">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-[0.8fr_1.6fr] gap-12 lg:gap-16">
        <div ref={leftRef} className="reveal">
          <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-5">{c.eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-6xl text-foreground leading-[1.02] mb-6">
            {c.title_line1}
            <br />
            {c.title_line2}
            <br />
            {c.title_line3}
          </h2>
          <p className="text-foreground/75 leading-relaxed mb-8 max-w-sm">{c.body}</p>
          <Link
            to="/journal"
            className="group inline-flex items-center gap-3 border border-terracotta text-terracotta uppercase tracking-[0.25em] text-[11px] px-7 py-4 hover:bg-terracotta hover:text-terracotta-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {c.cta_label}
            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <div ref={rightRef} className="reveal reveal-delay-2 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          {featured && (
            <article className="group">
              <Link
                to="/journal/$slug"
                params={{ slug: featured.slug }}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <div className="overflow-hidden mb-6 aspect-[4/5] md:aspect-[5/4]">
                  {featured.image ? (
                    <img
                      src={featured.image}
                      alt={featured.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-1000 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-cream" />
                  )}
                </div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-terracotta">Featured story</p>
                <h3 className="font-serif text-3xl md:text-5xl text-foreground mb-4 leading-tight group-hover:text-gold transition-colors">
                  {featured.title}
                </h3>
                <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-foreground/80">
                  Read story <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </article>
          )}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            {supporting.map((p) => (
              <article key={p.slug} className="group border-t border-foreground/15 pt-6">
                <Link
                  to="/journal/$slug"
                  params={{ slug: p.slug }}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <div className="overflow-hidden mb-4 aspect-[4/3]">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-1000 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-cream" />
                    )}
                  </div>
                  <h3 className="font-serif text-2xl text-foreground mb-3 leading-snug group-hover:text-gold transition-colors">
                    {p.title}
                  </h3>
                  <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-foreground/80">
                    Read story <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
