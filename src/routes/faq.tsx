import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getFaqs } from "@/lib/cms.functions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, ArrowRight } from "lucide-react";
import { EnquireDialog } from "@/components/site/EnquireDialog";

const q = queryOptions({ queryKey: ["faqs"], queryFn: () => getFaqs() });

const labels: Record<string, string> = {
  planning: "Planning Your Journey",
  conservation: "Conservation & Ethics",
  logistics: "Logistics, Flights & Support",
};

const DEFAULT_FAQS = [
  {
    id: "f1",
    category: "planning" as const,
    question: "When is the best time to visit Kenya for a safari?",
    answer:
      "Kenya offers exceptional wildlife viewing year-round. July to October is famous for the Great Migration river crossings in the Maasai Mara. December to March brings warm, dry conditions and excellent big cat encounters. The green season (April-May & November) offers vibrant emerald landscapes, baby wildlife, and secluded exclusivity.",
  },
  {
    id: "f2",
    category: "planning" as const,
    question: "Can I combine a wild safari with a beach escape?",
    answer:
      "Yes, seamlessly. Kenya's coast—including Diani Beach, Watamu and the Lamu archipelago—is just a short scenic flight from the Maasai Mara or Amboseli. We routinely design journeys that transition smoothly from exhilarating savannah game drives to relaxing by the Indian Ocean.",
  },
  {
    id: "f3",
    category: "planning" as const,
    question: "Is Kenya suitable for families with children?",
    answer:
      "Absolutely. We select family-friendly private camps with dedicated safari guides, interconnecting tents, and engaging Junior Ranger activities (bushcraft, tracking, and Maasai beadwork) tailored to curious travellers of all ages.",
  },
  {
    id: "f4",
    category: "conservation" as const,
    question: "How do your journeys support wildlife conservation?",
    answer:
      "Every journey we design contributes directly to private conservancies, community land lease programs, and anti-poaching initiatives. We prioritize boutique camps and lodges that operate on solar power, practice zero-waste protocols, and reinvest in local ecosystems.",
  },
  {
    id: "f5",
    category: "logistics" as const,
    question: "How do internal transfers and safari flights work?",
    answer:
      "We take care of all internal bush flights, airport VIP meet-and-greets, and private ground transfers. From the moment you land at Jomo Kenyatta International Airport (NBO) in Nairobi, our dedicated hosts escort you seamlessly every step of the way.",
  },
  {
    id: "f6",
    category: "logistics" as const,
    question: "Can you accommodate dietary requirements and private guides?",
    answer:
      "Yes. Every safari camp we partner with boasts world-class chefs who cater to vegetarian, vegan, gluten-free, kosher-style, and allergen-sensitive diets. Furthermore, all our journeys feature private 4x4 safari vehicles and dedicated professional guides.",
  },
];

export const Route = createFileRoute("/faq")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — The Baobab Collective" },
      { name: "description", content: "Answers on planning, seasons, conservation and logistics for your bespoke Kenya safari." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center">Not found</div>,
  component: FaqPage,
});

function FaqPage() {
  const { data: dbFaqs } = useSuspenseQuery(q);
  const [search, setSearch] = useState("");

  const all = (dbFaqs && dbFaqs.length > 0 ? dbFaqs : DEFAULT_FAQS) as typeof DEFAULT_FAQS;

  const filter = (cat: string) =>
    all.filter(
      (f) =>
        f.category === cat &&
        (!search ||
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())),
    );

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <section className="bg-cream py-20 md:py-28 text-center px-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta font-semibold mb-4">Frequently Asked</p>
          <h1 className="font-serif text-5xl md:text-6xl mb-5 text-foreground leading-[1.08]">Questions, answered.</h1>
          <p className="max-w-2xl mx-auto text-foreground/75 text-base sm:text-lg leading-relaxed">
            Everything you need to know to plan your Kenya journey with complete clarity and peace of mind.
          </p>
          <div className="max-w-md mx-auto mt-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions (e.g. migration, flights, beach)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-background rounded-full border-border/80"
            />
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6 space-y-14">
            {(["planning", "conservation", "logistics"] as const).map((cat) => {
              const items = filter(cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="space-y-4">
                  <h2 className="font-serif text-2xl md:text-3xl text-foreground pb-2 border-b border-border/60">
                    {labels[cat]}
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {items.map((f) => (
                      <AccordionItem key={f.id} value={f.id} className="border-b border-border/60 py-1">
                        <AccordionTrigger className="text-left font-serif text-lg md:text-xl text-foreground hover:text-gold hover:no-underline">
                          {f.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-foreground/75 leading-relaxed text-sm md:text-base pt-2 pb-4">
                          {f.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}

            {all.filter(
              (f) =>
                f.question.toLowerCase().includes(search.toLowerCase()) ||
                f.answer.toLowerCase().includes(search.toLowerCase()),
            ).length === 0 && (
              <div className="text-center py-16 space-y-4">
                <HelpCircle className="w-8 h-8 text-gold mx-auto" />
                <p className="text-foreground/70 font-serif text-xl">No questions match your search.</p>
                <p className="text-sm text-foreground/60">Have a specific question in mind? Speak directly with our team.</p>
              </div>
            )}

            {/* Inquire CTA */}
            <div className="bg-cream/60 rounded-xl p-8 text-center border border-border mt-12 space-y-4">
              <h3 className="font-serif text-2xl text-foreground">Have more questions about your journey?</h3>
              <p className="text-foreground/75 text-sm max-w-md mx-auto">
                Michael & Samra are always happy to talk through logistics, camp choices, and personalized recommendations.
              </p>
              <div className="pt-2">
                <EnquireDialog
                  defaultSubject="General Planning Question"
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full bg-forest text-forest-foreground uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-3.5 hover:bg-forest/90 transition-colors shadow-sm"
                    >
                      <span>Ask Our Team</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
