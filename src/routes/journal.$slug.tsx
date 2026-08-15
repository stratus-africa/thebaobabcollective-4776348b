import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { articles as staticArticles, getArticle as getStaticArticle } from "@/lib/content";
import { getArticleBySlug, getArticles } from "@/lib/cms.functions";

type ArticleView = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
  category: string;
  content: string[];
};

function normalizeContent(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x)).filter(Boolean);
  if (typeof raw === "string") return raw.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function toView(row: any): ArticleView {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    image: row.image ?? "",
    date: row.date ?? (row.published_at ? new Date(row.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : ""),
    readTime: row.read_time ?? row.readTime ?? "",
    category: row.category ?? "",
    content: normalizeContent(row.content),
  };
}

export const Route = createFileRoute("/journal/$slug")({
  loader: async ({ params }) => {
    // Try DB first, fall back to static content.
    const dbRow = await getArticleBySlug({ data: { slug: params.slug } }).catch(() => null);
    let article: ArticleView | null = dbRow ? toView(dbRow) : null;
    if (!article) {
      const stat = getStaticArticle(params.slug);
      if (stat) article = { ...stat };
    }
    if (!article) throw notFound();

    // Related list: prefer DB, fall back to static
    let relatedPool: ArticleView[] = [];
    const dbAll = await getArticles().catch(() => [] as any[]);
    if (dbAll && dbAll.length > 0) {
      relatedPool = dbAll.map(toView);
    } else {
      relatedPool = staticArticles.map((a) => ({ ...a }));
    }
    const related = relatedPool.filter((a) => a.slug !== article!.slug).slice(0, 2);

    return { article, related };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    const title = a ? `${a.title} — The Baobab Collective Journal` : "Journal";
    const desc = a?.excerpt ?? "Safari stories and inspiration.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: a?.title ?? title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: a ? `/journal/${a.slug}` : "/journal" },
        ...(a?.image ? [{ property: "og:image", content: a.image }] : []),
      ],
      links: a ? [{ rel: "canonical", href: `/journal/${a.slug}` }] : [],
    };
  },
  notFoundComponent: () => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-4">Article not found</h1>
        <Link to="/journal" className="text-gold underline">Back to Journal</Link>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-3xl mb-4">Something went wrong</h1>
        <p className="text-foreground/70">{error.message}</p>
      </main>
      <Footer />
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article, related } = Route.useLoaderData() as { article: ArticleView; related: ArticleView[] };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <article>
          <header className="bg-cream py-16 md:py-24">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <Link to="/journal" className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-foreground/60 hover:text-gold mb-8">
                <ArrowLeft className="w-3 h-3" /> Back to Journal
              </Link>
              {(article.category || article.readTime) && (
                <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">
                  {[article.category, article.readTime].filter(Boolean).join(" · ")}
                </p>
              )}
              <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-[1.1] mb-5">{article.title}</h1>
              {article.date && <p className="text-sm text-foreground/60">{article.date}</p>}
            </div>
          </header>

          {article.image && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 -mt-8 md:-mt-12">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="space-y-6 text-foreground/85 text-lg leading-relaxed font-serif">
              {article.content.length > 0 ? (
                article.content.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="text-foreground/60">This article has no content yet.</p>
              )}
            </div>
          </div>
        </article>

        {/* Article Conversion CTA */}
        <section className="bg-forest text-forest-foreground py-18 md:py-24 text-center">
          <div className="max-w-2xl mx-auto px-6 space-y-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold">Inspired by Kenya?</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-cream">Let's create your journey.</h2>
            <p className="text-forest-foreground/80 text-sm sm:text-base leading-relaxed">
              Every safari we design is completely bespoke — crafted around your timing, interests and travel style.
            </p>
            <div className="pt-3">
              <EnquireDialog
                defaultSubject={`Journal: ${article.title}`}
                sourceUrl={`/journal/${article.slug}`}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-3.5 hover:bg-gold/90 transition-colors shadow-md"
                  >
                    <span>Start Planning</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related" className="bg-cream py-20">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10">
              <h2 id="related" className="font-serif text-3xl text-foreground text-center mb-12">Related Articles</h2>
              <div className="grid md:grid-cols-2 gap-10">
                {related.map((a) => (
                  <Link
                    key={a.slug}
                    to="/journal/$slug"
                    params={{ slug: a.slug }}
                    className="group grid grid-cols-[140px_1fr] gap-5 items-center"
                  >
                    <div className="overflow-hidden aspect-square">
                      {a.image ? (
                        <img src={a.image} alt={a.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : <div className="w-full h-full bg-background" />}
                    </div>
                    <div>
                      {a.category && <p className="text-[10px] tracking-[0.25em] uppercase text-gold mb-1">{a.category}</p>}
                      <h3 className="font-serif text-xl text-foreground group-hover:text-gold transition-colors mb-2">{a.title}</h3>
                      <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-foreground/70">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
