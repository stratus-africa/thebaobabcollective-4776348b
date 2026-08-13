import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getItineraryBySlug } from "@/lib/cms.functions";
import { createBooking } from "@/lib/bookings.functions";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/book/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const it = await getItineraryBySlug({ data: { slug: params.slug } });
    if (!it) throw notFound();
    return { itinerary: it };
  },
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p>Journey not found.</p>
      <Link to="/adventures" className="text-gold underline">Back to adventures</Link>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: `Book ${loaderData?.itinerary?.name ?? "Journey"} — The Baobab Collective` },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { itinerary } = Route.useLoaderData() as { itinerary: any };
  const { formatPrice } = useSiteSettings();
  const book = useServerFn(createBooking);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    travel_date: "",
    party_size: 2,
    special_requests: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await book({ data: { itinerary_id: itinerary.id, ...form } });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.success("Booking received — we'll contact you to confirm payment");
        window.location.href = `/booking/success?booking_id=${res.booking_id}`;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create booking");
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <section className="bg-cream py-12">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-3">Book this journey</p>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">{itinerary.name}</h1>
            <p className="text-foreground/70 mt-3">{itinerary.nights} · From {formatPrice(itinerary.price_from_usd)} pp</p>
          </div>
        </section>

        <section className="py-16">
          <form onSubmit={onSubmit} className="max-w-2xl mx-auto px-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div><Label>Full name</Label><Input required value={form.guest_name} onChange={(e) => setForm((f) => ({ ...f, guest_name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" required value={form.guest_email} onChange={(e) => setForm((f) => ({ ...f, guest_email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.guest_phone} onChange={(e) => setForm((f) => ({ ...f, guest_phone: e.target.value }))} /></div>
              <div><Label>Party size</Label><Input type="number" min={1} max={20} value={form.party_size} onChange={(e) => setForm((f) => ({ ...f, party_size: Number(e.target.value) }))} /></div>
              <div className="md:col-span-2"><Label>Preferred travel date</Label><Input type="date" value={form.travel_date} onChange={(e) => setForm((f) => ({ ...f, travel_date: e.target.value }))} /></div>
              <div className="md:col-span-2"><Label>Special requests</Label><Textarea rows={4} value={form.special_requests} onChange={(e) => setForm((f) => ({ ...f, special_requests: e.target.value }))} /></div>
            </div>

            <div className="bg-cream p-5 border border-border">
              <p className="text-sm text-foreground/80">
                A refundable deposit of <span className="font-medium text-foreground">{formatPrice(itinerary.deposit_usd)}</span> will secure your booking. The balance is due 60 days before travel.
              </p>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full bg-gold text-gold-foreground hover:bg-gold/90 uppercase tracking-[0.25em] text-[12px]">
              {loading ? "Preparing checkout…" : `Pay deposit · ${formatPrice(itinerary.deposit_usd)}`}
            </Button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
