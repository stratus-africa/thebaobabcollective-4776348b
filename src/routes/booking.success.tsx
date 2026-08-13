import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Check } from "lucide-react";

const search = z.object({ booking_id: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/booking/success")({
  validateSearch: zodValidator(search),
  head: () => ({ meta: [{ title: "Booking confirmed — The Baobab Collective" }] }),
  component: BookingSuccess,
});

function BookingSuccess() {
  const { booking_id } = Route.useSearch();
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="py-24 text-center px-6">
        <div className="max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold/15 flex items-center justify-center mb-6">
            <Check className="w-7 h-7 text-gold" />
          </div>
          <h1 className="font-serif text-4xl mb-3">Your booking is confirmed</h1>
          <p className="text-foreground/70 mb-6">
            Thank you. A confirmation has been sent to your email. One of our designers will reach out within 24 hours to finalise every detail.
          </p>
          {booking_id && (
            <p className="text-[11px] tracking-[0.2em] uppercase text-foreground/50 mb-8">
              Reference: {booking_id.slice(0, 8)}
            </p>
          )}
          <div className="flex justify-center gap-4">
            <Link to="/adventures" className="inline-flex items-center border border-gold text-gold uppercase tracking-[0.25em] text-[11px] px-5 py-3 hover:bg-gold hover:text-gold-foreground">
              View adventures
            </Link>
            <Link to="/contact" className="inline-flex items-center text-foreground/70 hover:text-foreground uppercase tracking-[0.25em] text-[11px] px-5 py-3">
              Browse more
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
