import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, Instagram, Facebook } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EnquireForm } from "@/components/site/EnquireForm";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { RichText } from "@/components/site/RichText";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const contact = await getPageContent({ data: { key: "contact" } }).catch(() => null);
    return { contact };
  },
  head: () => ({
    meta: [
      { title: "Enquire — The Baobab Collective" },
      {
        name: "description",
        content:
          "Let's plan your safari. Get in touch with The Baobab Collective to begin designing your bespoke African journey.",
      },
      { property: "og:title", content: "Plan Your Journey — The Baobab Collective" },
      {
        property: "og:description",
        content: "Tell us about your dream safari and we'll craft a journey just for you.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { contact } = Route.useLoaderData();
  const c = { ...PAGE_DEFAULTS.contact, ...(contact ?? {}) };
  const { email, phone, phoneTel } = useSiteSettings();

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <section className="bg-cream py-20 md:py-28">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-[5fr_7fr] gap-10 lg:gap-14 items-start">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-5">{c.eyebrow}</p>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.05] mb-8">
                {c.title_line1}
                <br />
                {c.title_line2}
              </h1>
              <RichText html={c.body} className="mb-8 text-foreground/75" />
              <ul className="space-y-5 text-foreground/80">
                <li className="flex gap-4">
                  <Mail className="w-5 h-5 text-gold mt-1 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] tracking-[0.25em] uppercase text-foreground mb-1">{c.email_label}</p>
                    <a href={`mailto:${email}`} className="hover:text-gold break-all">
                      {email}
                    </a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Phone className="w-5 h-5 text-gold mt-1 shrink-0" />
                  <div>
                    <p className="text-[11px] tracking-[0.25em] uppercase text-foreground mb-1">{c.phone_label}</p>
                    <a href={`tel:${phoneTel}`} className="hover:text-gold">
                      {phone}
                    </a>
                  </div>
                </li>
                {c.instagram_url && (
                  <li className="flex gap-4">
                    <Instagram className="w-5 h-5 text-gold mt-1 shrink-0" />
                    <div>
                      <p className="text-[11px] tracking-[0.25em] uppercase text-foreground mb-1">
                        {c.instagram_label}
                      </p>
                      <a href={c.instagram_url} target="_blank" rel="noreferrer" className="hover:text-gold">
                        {c.instagram_handle}
                      </a>
                    </div>
                  </li>
                )}
                {c.facebook_url && (
                  <li className="flex gap-4">
                    <Facebook className="w-5 h-5 text-gold mt-1 shrink-0" />
                    <div>
                      <p className="text-[11px] tracking-[0.25em] uppercase text-foreground mb-1">{c.facebook_label}</p>
                      <a href={c.facebook_url} target="_blank" rel="noreferrer" className="hover:text-gold">
                        {c.facebook_handle}
                      </a>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-terracotta mb-4">Start an enquiry</p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">{c.form_title}</h2>
              <p className="text-foreground/70 mb-6 leading-relaxed">{c.form_intro}</p>
              <EnquireForm sourceUrl="/contact" autosaveKey="enquire:contact" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
