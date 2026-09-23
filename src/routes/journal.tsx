import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SiteImage } from "@/components/site/SiteImage";
import { articles as staticArticles } from "@/lib/content";
import { getArticles } from "@/lib/cms.functions";

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: string;
};

function normalize(row: any): Article {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    image: row.image ?? "",
    category: row.category ?? "",
    readTime: row.read_time ?? row.readTime ?? "",
  };
}

export const Route = createFileRoute("/journal")({
  loader: async () => {
    const db = await getArticles().catch(() => [] as any[]);
    const list: Article[] = db && db.length > 0
      ? db.map(normalize)
      : staticArticles.map((a) => ({
          slug: a.slug, title: a.title, excerpt: a.excerpt, image: a.image,
          category: a.category, readTime: a.readTime,
        }));
    return { list };
  },
  head: () => ({
    meta: [
      { title: "Journal — The Baobab Collective" },
      { name: "description", content: "Travel inspiration, destination guides and stories from the road less travelled." },
      { property: "og:title", content: "Journal — The Baobab Collective" },
      { property: "og:description", content: "Stories. Guidance. Inspiration." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/journal" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/journal" }],
  }),
  component: JournalIndex,
});

function JournalIndex() {
  const { list } = Route.useLoaderData() as { list: Article[] };
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <section className="bg-cream py-20 md:py-28 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-5">Be Inspired</p>
            <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-6 leading-[1.1]">The Journal</h1>
            <p className="text-foreground/75">Stories, guidance and inspiration from the road less travelled.</p>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {list.map((a) => (
              <Link
                key={a.slug}
                to="/journal/$slug"
                params={{ slug: a.slug }}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <article>
                  <div className="overflow-hidden aspect-[4/3] mb-5">
                    {a.image ? (
                      <SiteImage
                        src={a.image}
                        alt={a.title}
                        loading="lazy"
                        baseWidth={640}
                        responsiveWidths={[320, 640, 960]}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : <div className="w-full h-full bg-cream" />}
                  </div>
                  {(a.category || a.readTime) && (
                    <p className="text-[10px] tracking-[0.25em] uppercase text-gold mb-2">
                      {[a.category, a.readTime].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <h2 className="font-serif text-2xl text-foreground mb-3 group-hover:text-gold transition-colors">{a.title}</h2>
                  {a.excerpt && <p className="text-foreground/70 mb-3">{a.excerpt}</p>}
                  <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-foreground">
                    Read More <ArrowRight className="w-3 h-3" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
