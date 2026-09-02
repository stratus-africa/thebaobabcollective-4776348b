import { useState } from "react";
import { Instagram, Facebook, Linkedin, Twitter, Youtube, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BaobabLogo } from "./Logo";
import { subscribeNewsletter } from "@/lib/submissions.functions";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";
import { toast } from "sonner";

type FooterContent = Partial<typeof PAGE_DEFAULTS.footer>;

export function Footer({ content }: { content?: FooterContent | null } = {}) {
  const subscribe = useServerFn(subscribeNewsletter);
  const { email: contactEmail, phone: contactPhone, phoneTel: contactPhoneTel, logoUrl } = useSiteSettings();
  const menu = useMenuConfig();
  const base = { ...PAGE_DEFAULTS.footer, ...(content ?? {}) };
  const f: any = usePreviewMerge("footer", base);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await subscribe({ data: { email } });
      toast.success(res.alreadySubscribed ? "You're already on the list — thank you." : "Welcome aboard.");
      setEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not subscribe.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const cols = menu.footerColumns ?? [];

  const socials: { url: string; label: string; Icon: any }[] = [
    { url: f.instagram_url, label: "Instagram", Icon: Instagram },
    { url: f.facebook_url, label: "Facebook", Icon: Facebook },
    { url: f.linkedin_url, label: "LinkedIn", Icon: Linkedin },
    { url: f.twitter_url, label: "X / Twitter", Icon: Twitter },
    { url: f.youtube_url, label: "YouTube", Icon: Youtube },
  ].filter((s) => !!s.url);

  return (
    <footer id="contact" className="bg-cream pt-16 pb-6">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-1 flex flex-col">
          <Link
            to="/"
            className="inline-flex items-center h-28 sm:h-32 lg:h-36 w-auto -mt-2 mb-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            aria-label="The Baobab Collective home"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="The Baobab Collective"
                className="h-28 sm:h-32 lg:h-36 w-auto max-w-[220px] object-contain object-left"
              />
            ) : (
              <BaobabLogo className="w-28 h-28" />
            )}
          </Link>

          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/60">
            {menu.footerTagline || "Journeys That Connect"}
          </p>
        </div>

        {cols.map((col, idx) => (
          <nav key={`${col.heading}-${idx}`} aria-label={`Footer ${col.heading}`}>
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-foreground mb-5">{col.heading}</h4>
            <ul className="space-y-2">
              {col.links.map((l, i) => (
                <li key={`${l.to}-${i}`}>
                  <Link
                    to={l.to as any}
                    className="text-[11px] tracking-wider uppercase text-foreground/75 hover:text-gold rounded py-1 block focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <address className="not-italic">
          <h4 className="text-[11px] tracking-[0.25em] uppercase text-foreground mb-5">{f.contact_heading}</h4>
          <p className="text-sm text-foreground/75 mb-1">
            <a href={`mailto:${contactEmail}`} className="hover:text-gold break-all">
              {contactEmail}
            </a>
          </p>
          <p className="text-sm text-foreground/75 mb-5">
            <a href={`tel:${contactPhoneTel}`} className="hover:text-gold">
              {contactPhone}
            </a>
          </p>
          {socials.length > 0 && (
            <div className="flex items-center gap-4 text-foreground/70">
              {socials.map(({ url, label, Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (opens in new tab)`}
                  className="inline-flex items-center justify-center h-11 w-11 rounded-full hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </address>

        <div>
          <h4 className="text-[11px] tracking-[0.25em] uppercase text-foreground mb-5">{f.newsletter_title}</h4>
          <p className="text-sm text-foreground/75 mb-4">{f.newsletter_body}</p>
          <form onSubmit={onSubmit} className="flex border border-border bg-background" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={f.newsletter_placeholder}
              className="flex-1 min-w-0 px-3 py-3 text-sm bg-transparent outline-none placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-gold"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-forest text-forest-foreground px-4 min-h-[44px] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
              aria-label={loading ? "Subscribing to newsletter" : "Subscribe to newsletter"}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 mt-14 pt-6 border-t border-border/60">
        <p className="text-center text-[11px] tracking-[0.2em] uppercase text-foreground/60">
          {(f.copyright || "").replace("{year}", String(new Date().getFullYear()))}
        </p>
      </div>
    </footer>
  );
}
