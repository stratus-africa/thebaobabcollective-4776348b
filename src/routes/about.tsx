import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { About } from "@/components/site/About";
import { getPageContent } from "@/lib/page-content.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { RichText } from "@/components/site/RichText";

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [about, mission, values, team] = await Promise.all([
      getPageContent({ data: { key: "about" } }).catch(() => null),
      getPageContent({ data: { key: "about_mission" } }).catch(() => null),
      getPageContent({ data: { key: "about_values" } }).catch(() => null),
      getPageContent({ data: { key: "about_team" } }).catch(() => null),
    ]);
    return { about, mission, values, team };
  },
  head: () => ({
    meta: [
      { title: "About — The Baobab Collective" },
      {
        name: "description",
        content: "Born from a love of Africa. Built on connection. Meet the people behind The Baobab Collective.",
      },
      { property: "og:title", content: "About — The Baobab Collective" },
      {
        property: "og:description",
        content: "We don't just plan trips, we create meaningful connections.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function MissionSection({ content }: { content: Partial<typeof PAGE_DEFAULTS.about_mission> | null }) {
  const c = usePreviewMerge("about_mission", {
    ...PAGE_DEFAULTS.about_mission,
    ...(content ?? {}),
  });
  return (
    <section className="bg-background py-20">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 max-w-3xl text-center">
        <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/70 mb-3">{c.eyebrow}</p>
        <h2 className="font-serif text-3xl md:text-4xl mb-6">{c.title}</h2>
        <RichText html={c.body} className="text-foreground/75" />
      </div>
    </section>
  );
}

function ValuesSection({ content }: { content: Partial<typeof PAGE_DEFAULTS.about_values> | null }) {
  const c = usePreviewMerge("about_values", {
    ...PAGE_DEFAULTS.about_values,
    ...(content ?? {}),
  });
  const items = [
    { title: c.value_1_title, body: c.value_1_body },
    { title: c.value_2_title, body: c.value_2_body },
    { title: c.value_3_title, body: c.value_3_body },
    { title: c.value_4_title, body: c.value_4_body },
  ];
  return (
    <section className="bg-cream py-20">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/70 mb-3">{c.eyebrow}</p>
          <h2 className="font-serif text-3xl md:text-4xl">{c.title}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it, i) => (
            <div key={i} className="bg-background border border-border p-6">
              <h3 className="text-[13px] tracking-[0.2em] uppercase mb-3 text-gold">{it.title}</h3>
              <RichText html={it.body} className="text-sm text-foreground/75" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type Founder = {
  url: string;
  name: string;
  role: string;
  bio: string;
};

function teaserFor(bio: string, name: string) {
  const fallback = name.toLowerCase().includes("michael")
    ? "Kenya has been home for most of my life. I created Baobab to share the places and people I know best."
    : "Every journey should feel considered, personal and rooted in real connection.";
  const text = (bio || fallback).trim();
  if (text.length <= 150) return text;
  return `${text.slice(0, 147).trim()}...`;
}

function FounderCard({ founder, active, onToggle }: { founder: Founder; active: boolean; onToggle: () => void }) {
  const slug = founder.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (
    <article
      id={`founder-${slug}`}
      className="group relative"
      onMouseLeave={() => {
        if (active && window.matchMedia("(hover: hover)").matches) onToggle();
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={active}
        aria-controls={`founder-story-${slug}`}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <div className="relative overflow-hidden bg-cream aspect-[4/5]">
          {founder.url ? (
            <img
              src={founder.url}
              alt={founder.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cream">
              <span className="max-w-[12rem] px-6 text-center text-[11px] uppercase tracking-[0.22em] text-foreground/45">
                Portrait image coming soon
              </span>
            </div>
          )}

          <div
            className={`absolute inset-0 bg-forest/35 transition-opacity duration-500 ease-out motion-reduce:transition-none ${
              active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            }`}
            aria-hidden="true"
          />

          <div
            id={`founder-story-${slug}`}
            className={`absolute inset-x-0 bottom-0 p-5 sm:p-6 text-background transition-all duration-500 ease-out motion-reduce:transition-none ${
              active
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold">{founder.name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-background/75">{founder.role}</p>
            <p className="mt-4 max-w-sm font-serif text-lg leading-snug">"{teaserFor(founder.bio, founder.name)}"</p>
            <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold">
              Read {founder.name.split(" ")[0]}'s story
              <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />
            </span>
          </div>
        </div>
      </button>

      <div className="pt-5">
        <h3 className="font-serif text-2xl text-foreground">{founder.name}</h3>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-foreground/55">{founder.role}</p>
        <p className={`mt-4 text-sm leading-relaxed text-foreground/70 md:hidden ${active ? "block" : "hidden"}`}>
          {teaserFor(founder.bio, founder.name)}
        </p>
      </div>
    </article>
  );
}

function TeamSection({ content }: { content: Partial<typeof PAGE_DEFAULTS.about_team> | null }) {
  const c = usePreviewMerge("about_team", { ...PAGE_DEFAULTS.about_team, ...(content ?? {}) });
  const [activeFounder, setActiveFounder] = useState<number | null>(null);
  const members: Founder[] = [
    {
      url: c.image_1_url,
      name: c.image_1_name,
      role: c.image_1_role,
      bio: c.image_1_bio,
    },
    {
      url: c.image_2_url,
      name: c.image_2_name,
      role: c.image_2_role,
      bio: c.image_2_bio,
    },
  ].filter((m) => m.name);

  return (
    <section className="bg-background py-14 md:py-20 lg:py-24">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-end border-t border-border pt-8 md:pt-10 mb-10 md:mb-12">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <span className="text-[10px] tracking-[0.24em] uppercase text-gold">02</span>
              <span className="h-px w-10 bg-gold/50" />
              <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/70">{c.eyebrow}</p>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight text-foreground">{c.title}</h2>
          </div>
          <RichText html={c.body} className="max-w-2xl text-foreground/72 lg:pb-2" />
        </div>

        {members.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:gap-10 xl:gap-12">
            {members.map((m, i) => (
              <FounderCard
                key={m.name}
                founder={m}
                active={activeFounder === i}
                onToggle={() => setActiveFounder((current) => (current === i ? null : i))}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AboutPage() {
  const { about, mission, values, team } = Route.useLoaderData();
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <About content={about} />
        <MissionSection content={mission} />
        <ValuesSection content={values} />
        <TeamSection content={team} />
        <section className="bg-cream py-12 md:py-16 text-center">
          <Link
            to="/contact"
            className="group inline-flex items-center gap-3 border border-gold text-gold uppercase tracking-[0.25em] text-[11px] px-8 py-4 hover:bg-gold hover:text-gold-foreground transition-colors duration-300 ease-out"
          >
            Plan Your Journey
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
