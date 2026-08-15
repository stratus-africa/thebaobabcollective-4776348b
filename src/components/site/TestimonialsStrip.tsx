import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Star, Quote, Sparkles } from "lucide-react";
import { getTestimonials } from "@/lib/cms.functions";

export function TestimonialsStrip() {
  const fetchTestimonials = useServerFn(getTestimonials);
  const { data: dbTestimonials = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => fetchTestimonials(),
    staleTime: 60_000,
  });

  const fallbackTestimonials = [
    {
      id: "1",
      name: "Claire & David Thornton",
      location: "London, UK",
      trip_taken: "Mara & Lewa Wilderness Private Safari",
      quote:
        "The level of care and personal knowledge Michael and Samra brought to our trip was extraordinary. Every camp felt handpicked for us, and our guide felt like family by day two.",
      rating: 5,
    },
    {
      id: "2",
      name: "Mark & Sarah Van Der Bilt",
      location: "Amsterdam, Netherlands",
      trip_taken: "Great Migration & Samburu Foot Safari",
      quote:
        "We've travelled to Africa four times, but this was the first time we truly felt connected to the rhythm of Kenya. Deeply personal, utterly unforgettable.",
      rating: 5,
    },
    {
      id: "3",
      name: "Eleanor Vance",
      location: "San Francisco, USA",
      trip_taken: "Laikipia Conservation Safari",
      quote:
        "Walking through the bush at dawn with tracking guides was the most humbling experience of my life. The Baobab Collective designs travel with immense soul.",
      rating: 5,
    },
  ];

  const list = dbTestimonials.length > 0 ? dbTestimonials : fallbackTestimonials;

  return (
    <section aria-labelledby="testimonials-heading" className="bg-background py-18 md:py-24 border-t border-border/40">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <p className="text-[11px] tracking-[0.35em] uppercase text-gold font-semibold mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Guest Stories
          </p>
          <h2 id="testimonials-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08]">
            What Our Travellers Say
          </h2>
          <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed">
            The clearest measure of a journey is how it stays with you long after you've returned home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {list.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between bg-cream/50 rounded-xl p-8 border border-border transition-all duration-300 hover:shadow-luxury hover:border-gold/40 hover:bg-cream"
            >
              <div>
                <div className="flex items-center gap-1 text-gold mb-6">
                  {Array.from({ length: item.rating ?? 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-gold/30 mb-3" />
                <p className="font-serif text-lg text-foreground leading-relaxed italic mb-6">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-foreground/10">
                <p className="font-serif text-base font-medium text-foreground">
                  {item.name}
                </p>
                <p className="text-[11px] tracking-wider uppercase text-foreground/60 mt-0.5">
                  {item.location} {item.trip_taken ? `• ${item.trip_taken}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
