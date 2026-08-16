import { createFileRoute, notFound } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Compass,
  MapPin,
  Building,
  BookOpen,
  Globe,
  Bell,
  Users as UsersIcon,
  Sparkles,
  Megaphone,
  Home as HomeIcon,
  Map,
  Hotel,
  FileText,
} from "lucide-react";
import { PageEditor } from "./pages.$page";
import type { PageKey } from "@/lib/page-content.defaults";

type SubEditor = { pageKey: PageKey; label: string; icon?: any; description?: string };
type HubTab = { value: string; label: string; icon: any; editors: SubEditor[] };
type HubSection = { title: string; description: string; tabs: HubTab[] };

const SECTIONS: Record<string, HubSection> = {
  home: {
    title: "Home Page",
    description: "Every section of the homepage, grouped into tabs.",
    tabs: [
      {
        value: "hero",
        label: "Hero",
        icon: LayoutDashboard,
        editors: [
          { pageKey: "home", label: "Home — Hero", icon: HomeIcon, description: "Main homepage hero content." },
          {
            pageKey: "top_bar",
            label: "Top Announcement Bar",
            icon: Megaphone,
            description: "Sitewide announcement strip above the navbar.",
          },
        ],
      },
      {
        value: "trust",
        label: "Trust Strip",
        icon: Sparkles,
        editors: [
          {
            pageKey: "home_trust",
            label: "Trust Strip",
            icon: Sparkles,
            description: "Four expertise/trust items below the hero.",
          },
        ],
      },
      {
        value: "find_journey",
        label: "Find Journey",
        icon: Compass,
        editors: [
          {
            pageKey: "home_find_journey",
            label: "Find Your Journey",
            icon: Compass,
            description: "Journey-type card grid section.",
          },
        ],
      },
      {
        value: "why",
        label: "Why Baobab",
        icon: Sparkles,
        editors: [
          {
            pageKey: "home_why_baobab",
            label: "Why Baobab — Pillars",
            icon: Sparkles,
            description: "Numbered pillars explaining why Baobab Collective.",
          },
        ],
      },
      {
        value: "founders",
        label: "Founders",
        icon: UsersIcon,
        editors: [
          {
            pageKey: "home_founders",
            label: "Meet the Founders",
            icon: UsersIcon,
            description: "Founder profile cards and narrative copy.",
          },
        ],
      },
      {
        value: "impact",
        label: "Journey Impact",
        icon: Globe,
        editors: [
          {
            pageKey: "home_impact",
            label: "Journey Impact",
            icon: Globe,
            description: "Responsible tourism / conservation pillars.",
          },
        ],
      },
      {
        value: "how",
        label: "How It Works",
        icon: Bell,
        editors: [
          {
            pageKey: "home_how_it_works",
            label: "How It Works — Steps",
            icon: Bell,
            description: "Four-step planning process section.",
          },
        ],
      },
      {
        value: "final_cta",
        label: "Final CTA",
        icon: Megaphone,
        editors: [
          {
            pageKey: "home_final_cta",
            label: "Final CTA Block",
            icon: Megaphone,
            description: "'Your Kenya is waiting' closing CTA.",
          },
        ],
      },
      {
        value: "instagram",
        label: "Instagram",
        icon: Globe,
        editors: [
          {
            pageKey: "home_instagram",
            label: "Home — Instagram Strip",
            icon: Globe,
            description: "Instagram feed strip on the homepage.",
          },
        ],
      },
    ],
  },
  about: {
    title: "About Page",
    description: "Sections of the /about page.",
    tabs: [
      {
        value: "hero",
        label: "About Hero",
        icon: Sparkles,
        editors: [
          {
            pageKey: "about",
            label: "About — Hero / Block",
            icon: Sparkles,
            description: "Top hero block on the About page.",
          },
        ],
      },
      {
        value: "mission",
        label: "Mission",
        icon: BookOpen,
        editors: [
          {
            pageKey: "about_mission",
            label: "About — Mission",
            icon: BookOpen,
            description: "Mission section content.",
          },
        ],
      },
      {
        value: "values",
        label: "Values",
        icon: Bell,
        editors: [
          { pageKey: "about_values", label: "About — Values", icon: Bell, description: "Core values section." },
        ],
      },
      {
        value: "team",
        label: "Team",
        icon: UsersIcon,
        editors: [
          { pageKey: "about_team", label: "About — Team", icon: UsersIcon, description: "Team members section." },
        ],
      },
      {
        value: "destinations",
        label: "Destinations",
        icon: MapPin,
        editors: [
          {
            pageKey: "home_destinations",
            label: "Home — Destinations Strip",
            icon: Map,
            description: "Destinations strip on the homepage.",
          },
        ],
      },
    ],
  },
  adventures: {
    title: "Adventures Landing",
    description: "Every section of the /adventures page — copy, imagery and section toggles.",
    tabs: [
      {
        value: "landing",
        label: "Adventures Landing",
        icon: Compass,
        editors: [
          {
            pageKey: "adventures_index",
            label: "Adventures Landing Page",
            icon: Compass,
            description: "Hero, day-in-the-field, finder, signatures, experiences, catalogue and CTAs.",
          },
        ],
      },
      {
        value: "home_strip",
        label: "Home Strip",
        icon: HomeIcon,
        editors: [
          {
            pageKey: "home_adventures",
            label: "Home — Adventures Strip",
            icon: HomeIcon,
            description: "Adventures strip on the homepage.",
          },
        ],
      },
      {
        value: "detail",
        label: "Detail Pages",
        icon: FileText,
        editors: [
          {
            pageKey: "detail_journey",
            label: "Adventure Detail",
            icon: FileText,
            description: "Shared copy across each adventure detail page.",
          },
        ],
      },
    ],
  },
  destinations: {
    title: "Destinations Landing Page",
    description: "Hero and content of the /destinations page.",
    tabs: [
      {
        value: "landing",
        label: "Destinations Landing",
        icon: MapPin,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Destinations Landing Page",
            icon: Map,
            description: "Hero copy, imagery and call to action on /destinations.",
          },
        ],
      },
      {
        value: "home_strip",
        label: "Home Strip",
        icon: HomeIcon,
        editors: [
          {
            pageKey: "home_destinations",
            label: "Home — Destinations Strip",
            icon: HomeIcon,
            description: "Destinations strip on the homepage.",
          },
        ],
      },
    ],
  },
  lodges: {
    title: "Partner Lodges Landing Page",
    description: "Hero and content of the /lodges page.",
    tabs: [
      {
        value: "landing",
        label: "Lodges Landing",
        icon: Building,
        editors: [
          {
            pageKey: "lodges_index",
            label: "Partner Lodges Landing Page",
            icon: Hotel,
            description: "Hero copy, imagery and section toggles on /lodges.",
          },
        ],
      },
      {
        value: "home_strip",
        label: "Home Strip",
        icon: HomeIcon,
        editors: [
          {
            pageKey: "home_lodges",
            label: "Home — Lodges Strip",
            icon: HomeIcon,
            description: "Lodges strip on the homepage.",
          },
        ],
      },
      {
        value: "detail",
        label: "Detail Pages",
        icon: FileText,
        editors: [
          {
            pageKey: "detail_lodge",
            label: "Lodge Detail",
            icon: FileText,
            description: "Shared copy across each lodge detail page.",
          },
        ],
      },
    ],
  },
};


export const Route = createFileRoute("/_authenticated/admin/pages-hub/$section")({
  beforeLoad: ({ params }) => {
    if (!SECTIONS[params.section]) throw notFound();
  },
  component: PagesHub,
});

function PagesHub() {
  const { section } = Route.useParams();
  const cfg = SECTIONS[section];

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/60 mb-2">Admin · Pages</p>
        <h1 className="font-serif text-3xl text-foreground">{cfg.title}</h1>
        <p className="text-sm text-foreground/65 mt-1">{cfg.description}</p>
      </header>

      <Tabs defaultValue={cfg.tabs[0]?.value} orientation="vertical" className="flex flex-col md:flex-row gap-8">
        <TabsList
          aria-label={`${cfg.title} sections`}
          className="h-auto md:w-56 shrink-0 flex md:flex-col bg-transparent p-0 gap-1 justify-start"
        >
          {cfg.tabs.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="w-full justify-start gap-2 data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none border border-transparent data-[state=active]:border-border px-4 py-2.5"
              >
                <Icon className="w-4 h-4" /> {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="flex-1 min-w-0">
          {cfg.tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-0">
              {t.editors.length > 1 ? (
                <Tabs defaultValue={t.editors[0].pageKey} className="flex flex-col gap-6">
                  <TabsList
                    aria-label={`${t.label} — editors`}
                    className="h-auto w-full flex flex-col bg-transparent p-0 gap-2"
                  >
                    {t.editors.map((ed) => {
                      const EdIcon = ed.icon;
                      return (
                        <TabsTrigger
                          key={ed.pageKey}
                          value={ed.pageKey}
                          className="w-full justify-start gap-4 rounded-md border border-border bg-background px-4 py-3 text-left data-[state=active]:bg-cream data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-foreground/40"
                        >
                          {EdIcon ? (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-cream/60 text-foreground/80">
                              <EdIcon className="w-4 h-4" />
                            </span>
                          ) : null}
                          <span className="flex flex-col items-start gap-0.5 min-w-0">
                            <span className="text-sm font-medium leading-tight">{ed.label}</span>
                            {ed.description ? (
                              <span className="text-xs text-foreground/60 leading-tight whitespace-normal">
                                {ed.description}
                              </span>
                            ) : null}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  <div className="min-w-0">
                    {t.editors.map((ed) => (
                      <TabsContent key={ed.pageKey} value={ed.pageKey} className="mt-0">
                        <PageEditor pageKey={ed.pageKey} />
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              ) : (
                <PageEditor pageKey={t.editors[0].pageKey} />
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
