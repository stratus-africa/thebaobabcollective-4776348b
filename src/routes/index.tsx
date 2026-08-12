import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Journal } from "@/components/site/Journal";
import { InstagramStrip } from "@/components/site/Instagram";
import { Footer } from "@/components/site/Footer";
import { EnquireDialog } from "@/components/site/EnquireDialog";
import { getPageContent } from "@/lib/page-content.functions";
import { getArticles } from "@/lib/cms.functions";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";
import { usePreviewMerge } from "@/lib/preview-overrides";
import elephant from "@/assets/elephant.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import lodgeTent from "@/assets/lodge-tent.jpg";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [home, about, home_adventures, home_lodges, home_journal, home_instagram, footer, articles] =
      await Promise.all([
        getPageContent({ data: { key: "home" } }).catch(() => null),
        getPageContent({ data: { key: "about" } }).catch(() => null),
        getPageContent({ data: { key: "home_adventures" } }).catch(() => null),
        getPageContent({ data: { key: "home_lodges" } }).catch(() => null),
        getPageContent({ data: { key: "home_journal" } }).catch(() => null),
        getPageContent({ data: { key: "home_instagram" } }).catch(() => null),
        getPageContent({ data: { key: "footer" } }).catch(() => null),
        getArticles().catch(() => [] as any[]),
      ]);
    const journalCards = (articles ?? []).slice(0, 3).map((r: any) => ({
      slug: r.slug,
      title: r.title,
      image: r.image ?? "",
    }));
    return {
      home,
      about,
      home_adventures,
      home_lodges,
      home_journal,
      home_instagram,
      footer,
      journalCards,
    };
  },
  head: () => ({
    meta: [
      { title: "The Baobab Collective — Curated Safari Journeys" },
      {
        name: "description",
        content:
          "Luxury curated safari experiences in Africa. Authentic connections, conservation-led journeys, and extraordinary moments with The Baobab Collective.",
      },
      { property: "og:title", content: "The Baobab Collective — Curated Safari Journeys" },
      {
        property: "og:description",
        content: "Curated safari experiences that immerse, inspire and leave a lasting impact.",
      },
    ],
  }),
  component: Index,
});

type StripKey = "home_adventures" | "home_destinations" | "home_lodges";
type StripLink = { to: "/adventures" | "/destinations" | "/lodges" | "/journeys" };

function StripCard({ content, keyName, linkTo }: { content: any; keyName: StripKey; linkTo: StripLink["to"] }) {
  const base = { ...(PAGE_DEFAULTS[keyName] as any), ...(content ?? {}) };
  const c: any = usePreviewMerge(keyName, base);
  return (
    <div className="group relative flex min-h-[520px] overflow-hidden bg-forest text-cream">
      <img
        src={keyName === "home_lodges" ? lodgeTent : gallery1}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/35 to-transparent" />
      <div className="relative mt-auto flex w-full flex-col p-7 sm:p-9 md:p-10">
        <p className="mb-4 text-[11px] uppercase tracking-[0.32em] text-cream/75">{c.eyebrow}</p>
        <h3 className="mb-4 font-serif text-4xl leading-none tracking-wide text-cream md:text-5xl">{c.title}</h3>
        <p className="mb-8 max-w-md text-sm leading-relaxed text-cream/80 md:text-base">{c.body}</p>
        <Link
          to={linkTo}
          className="inline-flex w-fit items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-gold transition-colors group-hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {c.cta_label}
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

function HomeStrips({ adventures, lodges }: { adventures: any; lodges: any }) {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-[1920px] px-5 sm:px-8 lg:px-10">
        <div className="mb-12 grid gap-6 border-t border-foreground/15 pt-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-gold">Journeys</p>
          </div>
          <div>
            <h2 className="max-w-3xl font-serif text-4xl leading-[1.02] text-foreground md:text-6xl">
              Four ways into Kenya. Each one shaped around you.
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <StripCard content={adventures} keyName="home_adventures" linkTo="/journeys" />
          <JourneyPanel
            image={gallery2}
            eyebrow="Connection"
            title="TRAVEL DEEPER"
            body="Meaningful encounters with people, communities and places — designed with respect and context."
            to="/journeys/connection"
          />
          <JourneyPanel
            image={gallery3}
            eyebrow="Heritage"
            title="KENYA'S STORY"
            body="Culture, coastline, history and places shaped by generations."
            to="/journeys/heritage"
          />
          <JourneyPanel
            image={gallery4}
            eyebrow="Conservation"
            title="LEAVE SOMETHING BEHIND"
            body="Journeys that support wildlife, landscapes and communities with care."
            to="/journeys/conservation"
          />
        </div>
        <div className="mt-12">
          <PrimaryJourneyCta />
        </div>
        <div className="mt-20 md:mt-28">
          <StripCard content={lodges} keyName="home_lodges" linkTo="/lodges" />
        </div>
      </div>
    </section>
  );
}

function JourneyPanel({
  image,
  eyebrow,
  title,
  body,
  to,
}: {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  to: string;
}) {
  return (
    <Link
      to={to as any}
      className="group relative flex min-h-[520px] overflow-hidden bg-forest text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/30 to-transparent" />
      <div className="relative mt-auto p-7 sm:p-9 md:p-10">
        <p className="mb-4 text-[11px] uppercase tracking-[0.32em] text-cream/75">{eyebrow}</p>
        <h3 className="mb-4 font-serif text-4xl leading-none tracking-wide text-cream md:text-5xl">{title}</h3>
        <p className="max-w-md text-sm leading-relaxed text-cream/80 md:text-base">{body}</p>
        <span className="mt-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-gold transition-colors group-hover:text-cream">
          Explore <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function PrimaryJourneyCta() {
  return (
    <EnquireDialog
      sourceUrl="/"
      autosaveKey="enquire-home-sections"
      trigger={
        <button
          type="button"
          className="group inline-flex items-center gap-3 rounded-full border border-gold px-7 py-4 text-[11px] uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-gold-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Let's Create Your Journey
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      }
    />
  );
}

function WhyBaobab() {
  const reasons = [
    ["01", "Kenya, personally known", "Born from a close, lived connection to Kenya."],
    ["02", "Completely tailor-made", "No off-the-shelf itineraries; every journey begins with the traveller."],
    ["03", "Trusted locally", "Relationships with guides, camps and communities shape what is possible."],
    ["04", "Personal from start to finish", "You deal directly with the people creating your journey."],
    ["05", "Thoughtful travel", "Designed with people, wildlife and place in mind."],
  ];
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 border-t border-foreground/15 pt-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-gold">Why Baobab?</p>
            <h2 className="font-serif text-4xl leading-[1.05] text-foreground md:text-6xl">
              Quiet expertise, deeply personal travel.
            </h2>
          </div>
          <div className="divide-y divide-foreground/15">
            {reasons.map(([number, title, body]) => (
              <div key={number} className="grid gap-5 py-7 sm:grid-cols-[80px_1fr]">
                <span className="font-serif text-3xl text-gold">{number}</span>
                <div>
                  <h3 className="mb-2 text-[12px] uppercase tracking-[0.28em] text-foreground">{title}</h3>
                  <p className="max-w-2xl leading-relaxed text-foreground/70">{body}</p>
                </div>
              </div>
            ))}
            <div className="pt-8">
              <PrimaryJourneyCta />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlacesWeLove() {
  const lodges = [
    {
      image: lodgeTent,
      name: "Canvas under wide skies",
      location: "Kenya",
      body: "For travellers who want setting, soul and a proper sense of place.",
    },
    {
      image: gallery5,
      name: "Wild country retreats",
      location: "Remote landscapes",
      body: "Chosen for atmosphere, guiding and the feeling of being truly away.",
    },
    {
      image: gallery6,
      name: "Slow days in camp",
      location: "Bush & coast",
      body: "Places that give the journey space to breathe.",
    },
  ];
  return (
    <section className="bg-forest py-20 text-cream md:py-28">
      <div className="mx-auto max-w-[1920px] px-5 sm:px-8 lg:px-10">
        <div className="mb-12 max-w-3xl">
          <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-gold">Places we love</p>
          <h2 className="font-serif text-4xl leading-[1.05] md:text-6xl">We've slept here. We'd send you here.</h2>
          <p className="mt-6 max-w-xl leading-relaxed text-cream/75">
            Every camp and lodge has been walked, slept in, and chosen for soul as much as setting.
          </p>
        </div>
        <div className="flex snap-x gap-5 overflow-x-auto pb-4">
          {lodges.map((lodge) => (
            <article key={lodge.name} className="group min-w-[82vw] snap-start md:min-w-[420px] lg:min-w-[520px]">
              <div className="mb-5 aspect-[4/5] overflow-hidden md:aspect-[5/4]">
                <img
                  src={lodge.image}
                  alt={`${lodge.name}, ${lodge.location}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-gold">{lodge.location}</p>
              <h3 className="mb-2 font-serif text-3xl text-cream">{lodge.name}</h3>
              <p className="mb-4 max-w-md text-sm leading-relaxed text-cream/70">{lodge.body}</p>
              <Link
                to="/lodges"
                className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-cream/80 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Discover lodge <ArrowRight className="h-3 w-3" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalHomeCta() {
  return (
    <section className="relative min-h-[560px] overflow-hidden bg-forest text-cream">
      <img src={gallery7} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-forest/90 via-forest/45 to-forest/10" />
      <div className="relative mx-auto flex min-h-[560px] max-w-[1500px] items-center px-5 py-24 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-gold">Begin</p>
          <h2 className="font-serif text-5xl leading-[0.95] md:text-7xl">Your Kenya is waiting.</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
            Tell us what you're dreaming of. We'll help you make it real.
          </p>
          <div className="mt-9">
            <EnquireDialog
              sourceUrl="/"
              autosaveKey="enquire-home-final"
              trigger={
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-[11px] uppercase tracking-[0.24em] text-gold-foreground transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Let's Create Your Journey
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Index() {
  const {
    home,
    about,
    home_adventures,

    home_lodges,
    home_journal,
    home_instagram,
    footer,
    journalCards,
  } = Route.useLoaderData();
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <Hero content={home} />
      <About content={about} />
      <HomeStrips adventures={home_adventures} lodges={home_lodges} />
      <WhyBaobab />
      <PlacesWeLove />
      <Journal content={home_journal} articles={journalCards.length ? journalCards : undefined} />
      <InstagramStrip content={home_instagram} />
      <FinalHomeCta />
      <Footer content={footer} />
    </main>
  );
}
