import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { InstagramTimeline } from "@/components/site/InstagramTimeline";
import { getTestimonials } from "@/lib/cms.functions";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { Star, Quote } from "lucide-react";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";
import g6 from "@/assets/gallery-6.jpg";
import g7 from "@/assets/gallery-7.jpg";

const defaultIgImgs = [g1, g2, g3, g4, g5, g6, g7];

const q = queryOptions({ queryKey: ["testimonials"], queryFn: () => getTestimonials() });

export const Route = createFileRoute("/testimonials")({
  loader: async ({ context }) => {
    const [items, page, ig] = await Promise.all([
      context.queryClient.ensureQueryData(q),
      getPageContent({ data: { key: "testimonials_page" } }).catch(() => null),
      getPageContent({ data: { key: "home_instagram" } }).catch(() => null),
    ]);
    return { items, page, ig };
  },
  head: () => ({
    meta: [
      { title: "Guest Stories — The Baobab Collective" },
      { name: "description", content: "Hear from travellers who have journeyed with The Baobab Collective." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center">Not found</div>,
  component: TestimonialsPage,
});

function TestimonialsPage() {
  const { data: items } = useSuspenseQuery(q);
  const { page, ig } = Route.useLoaderData();
  const base = { ...PAGE_DEFAULTS.testimonials_page, ...(page ?? {}) };
  const c: any = base;
  const fallbackPhotos = defaultIgImgs.map((src) => ({ src, caption: "" }));

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <section className="bg-cream py-20 text-center px-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">{c.eyebrow}</p>
          <h1 className="font-serif text-5xl md:text-6xl mb-5">{c.title}</h1>
          <p className="max-w-2xl mx-auto text-foreground/75">{c.subtitle}</p>
        </section>

        <section className="py-20">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-10">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((t) => (
                <article key={t.id} className="bg-cream p-6 relative flex flex-col">
                  <Quote className="w-7 h-7 text-gold/40 mb-3" />
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="font-serif text-lg leading-relaxed text-foreground mb-5 flex-1">"{t.quote}"</p>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    {t.location && (
                      <p className="text-[11px] tracking-[0.15em] uppercase text-foreground/60">{t.location}</p>
                    )}
                    {t.trip_taken && (
                      <p className="text-[11px] tracking-[0.15em] uppercase text-gold mt-2">{t.trip_taken}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <aside className="lg:sticky lg:top-24 self-start">
              <InstagramTimeline fallbackPhotos={fallbackPhotos} initialData={ig ?? undefined} />
            </aside>
          </div>
        </section>

        <section className="bg-forest text-forest-foreground py-16 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-3xl mb-4">{c.cta_title}</h2>
            <EnquireDialog
              sourceUrl="/testimonials"
              autosaveKey="enquire:testimonials"
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[12px] px-8 py-3.5 hover:bg-gold/90"
                >
                  {c.cta_button}
                </button>
              }
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
