import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
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
  Search,
  Star,
  Layers,
  Zap,
  Image,
  ToggleLeft,
  List,
  Grid,
} from "lucide-react";
import { PageEditor } from "./pages.$page";
import { AdminDestinationsMapHub } from "./destinations.map";
import type { PageKey } from "@/lib/page-content.defaults";

type SubEditor = { pageKey: PageKey; label: string; icon?: any; description?: string; fieldFilter?: string[] };
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

  // ── Adventures ──────────────────────────────────────────────────────────────
  adventures: {
    title: "Adventures Landing",
    description: "Every section of the /adventures page — copy, imagery and section toggles.",
    tabs: [
      {
        value: "hero",
        label: "Hero",
        icon: Image,
        editors: [
          {
            pageKey: "adventures_index",
            label: "Hero Section",
            description: "Hero visibility, copy and background image.",
            fieldFilter: ["show_hero", "eyebrow", "title", "subtitle", "hero_image"],
          },
        ],
      },
      {
        value: "rhythm",
        label: "Day in the Field",
        icon: Bell,
        editors: [
          {
            pageKey: "adventures_index",
            label: "A Day in the Field",
            description: "The day-rhythm timeline section.",
            fieldFilter: [
              "show_rhythm",
              "rhythm_eyebrow",
              "rhythm_title",
              "rhythm_body",
              "rhythm_1_time",
              "rhythm_1_phase",
              "rhythm_1_title",
              "rhythm_1_body",
              "rhythm_1_image",
              "rhythm_2_time",
              "rhythm_2_phase",
              "rhythm_2_title",
              "rhythm_2_body",
              "rhythm_2_image",
              "rhythm_3_time",
              "rhythm_3_phase",
              "rhythm_3_title",
              "rhythm_3_body",
              "rhythm_3_image",
              "rhythm_4_time",
              "rhythm_4_phase",
              "rhythm_4_title",
              "rhythm_4_body",
              "rhythm_4_image",
            ],
          },
        ],
      },
      {
        value: "finder",
        label: "Adventure Finder",
        icon: Search,
        editors: [
          {
            pageKey: "adventures_index",
            label: "Adventure Finder",
            description: "Filter bar and copy for the adventure search section.",
            fieldFilter: [
              "show_finder",
              "finder_eyebrow",
              "finder_title",
              "finder_body",
              "finder_experience_options",
              "finder_travel_style_options",
            ],
          },
        ],
      },
      {
        value: "signature",
        label: "Signature Selection",
        icon: Star,
        editors: [
          {
            pageKey: "adventures_index",
            label: "Signature Selection",
            description: "The curated signature adventures section.",
            fieldFilter: ["show_signature", "signature_eyebrow", "signature_title", "signature_body"],
          },
        ],
      },
      {
        value: "explore",
        label: "Explore by Experience",
        icon: Grid,
        editors: [
          {
            pageKey: "adventures_index",
            label: "Explore by Experience",
            description: "Experience type cards and section copy.",
            fieldFilter: [
              "show_explore",
              "explore_eyebrow",
              "explore_title",
              "explore_body",
              "explore_1_title",
              "explore_1_body",
              "explore_1_image",
              "explore_2_title",
              "explore_2_body",
              "explore_2_image",
              "explore_3_title",
              "explore_3_body",
              "explore_3_image",
              "explore_4_title",
              "explore_4_body",
              "explore_4_image",
              "explore_5_title",
              "explore_5_body",
              "explore_5_image",
              "explore_6_title",
              "explore_6_body",
              "explore_6_image",
              "explore_7_title",
              "explore_7_body",
              "explore_7_image",
              "explore_8_title",
              "explore_8_body",
              "explore_8_image",
            ],
          },
        ],
      },
      {
        value: "catalogue",
        label: "Full Catalogue",
        icon: List,
        editors: [
          {
            pageKey: "adventures_index",
            label: "Full Catalogue",
            description: "Full catalogue listing section and spotlight.",
            fieldFilter: ["show_spotlight", "show_catalogue", "catalogue_eyebrow", "catalogue_title"],
          },
        ],
      },
      {
        value: "combinations",
        label: "Combinations",
        icon: Layers,
        editors: [
          {
            pageKey: "adventures_index",
            label: "Journey Combinations",
            description: "Journey combinations section copy.",
            fieldFilter: ["show_combinations", "combinations_eyebrow", "combinations_title", "combinations_body"],
          },
        ],
      },
      {
        value: "ctas",
        label: "CTAs & Banner",
        icon: Megaphone,
        editors: [
          {
            pageKey: "adventures_index",
            label: "Bespoke Banner & Final CTA",
            description: "Enquiry banner and final call-to-action section.",
            fieldFilter: ["show_enquiry_cta", "bespoke_eyebrow", "bespoke_title", "bespoke_body", "show_final_cta"],
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

  // ── Destinations ────────────────────────────────────────────────────────────
  destinations: {
    title: "Destinations Landing",
    description: "Every section of the /destinations page — copy, imagery and section toggles.",
    tabs: [
      {
        value: "hero",
        label: "Hero",
        icon: Image,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Hero Section",
            description: "Hero visibility, copy and background image.",
            fieldFilter: ["show_hero", "eyebrow", "title", "subtitle", "body", "hero_image", "cta_label"],
          },
        ],
      },
      {
        value: "finder",
        label: "Destination Finder",
        icon: Search,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Destination Finder",
            description: "Filter bar and introductory copy for searching destinations.",
            fieldFilter: ["show_finder", "finder_eyebrow", "finder_title", "finder_body"],
          },
        ],
      },
      {
        value: "map",
        label: "Destinations Map",
        icon: Map,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Kenya Destinations Map",
            description: "Interactive map section toggle.",
            fieldFilter: ["show_map"],
          },
        ],
      },
      {
        value: "grid",
        label: "Destinations Grid",
        icon: Grid,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Editorial Groupings Grid",
            description: "Copy and toggle for The Icons, Beyond the Classics, and The Indian Ocean.",
            fieldFilter: [
              "show_grid",
              "icons_eyebrow",
              "icons_title",
              "icons_body",
              "beyond_eyebrow",
              "beyond_title",
              "beyond_body",
              "ocean_eyebrow",
              "ocean_title",
              "ocean_body",
            ],
          },
        ],
      },
      {
        value: "journeys",
        label: "Featured Adventures",
        icon: Compass,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Featured Adventures",
            description: "Adventures strip on the destinations page.",
            fieldFilter: ["show_journeys", "journeys_eyebrow", "journeys_title", "journeys_body"],
          },
        ],
      },
      {
        value: "stay",
        label: "Where You'll Stay",
        icon: Hotel,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Where You'll Stay",
            description: "Partner lodges spotlight on the destinations page.",
            fieldFilter: ["show_stay", "stay_eyebrow", "stay_title", "stay_body"],
          },
        ],
      },
      {
        value: "combinations",
        label: "Combinations",
        icon: Layers,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Destination Combinations",
            description: "Seamless itinerary pairings and route combinations section.",
            fieldFilter: ["show_combinations", "combinations_eyebrow", "combinations_title", "combinations_body"],
          },
        ],
      },
      {
        value: "matcher",
        label: "Destination Matcher",
        icon: Sparkles,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Destination Matcher",
            description: "'Where should Kenya take you?' tailor-made matcher section.",
            fieldFilter: ["show_matcher", "matcher_eyebrow", "matcher_title", "matcher_body"],
          },
        ],
      },
      {
        value: "cta",
        label: "Final CTA",
        icon: Megaphone,
        editors: [
          {
            pageKey: "destinations_index",
            label: "Final Call to Action",
            description: "Closing 'Your Kenya is waiting' planning CTA section.",
            fieldFilter: ["show_final_cta", "final_cta_eyebrow", "final_cta_title", "final_cta_body"],
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

  // ── Partner Lodges ──────────────────────────────────────────────────────────
  lodges: {
    title: "Partner Lodges Landing Page",
    description: "Hero and content of the /lodges page.",
    tabs: [
      {
        value: "hero",
        label: "Hero",
        icon: Image,
        editors: [
          {
            pageKey: "lodges_index",
            label: "Hero Section",
            description: "Hero visibility, eyebrow, title, subtitle and background image.",
            fieldFilter: ["show_hero", "eyebrow", "title", "subtitle", "hero_image"],
          },
        ],
      },
      {
        value: "grid",
        label: "Lodges Grid",
        icon: Grid,
        editors: [
          {
            pageKey: "lodges_index",
            label: "Lodges Grid",
            description: "Toggle visibility of the lodges listing grid.",
            fieldFilter: ["show_grid"],
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
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  beforeLoad: ({ params }) => {
    if (!SECTIONS[params.section]) throw notFound();
  },
  component: PagesHub,
});

function PagesHub() {
  const { section } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const cfg = SECTIONS[section];

  // Determine the active tab: if search.tab matches a tab value, use it; otherwise fallback to first tab
  const validTabValues = cfg.tabs.map((t) => t.value);
  const activeTab = search.tab && validTabValues.includes(search.tab) ? search.tab : cfg.tabs[0]?.value;

  const handleTabChange = (newTab: string) => {
    navigate({
      search: (prev) => ({ ...prev, tab: newTab }),
      replace: true,
    });
  };

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/60 mb-2">Admin · Pages</p>
        <h1 className="font-serif text-3xl text-foreground">{cfg.title}</h1>
        <p className="text-sm text-foreground/65 mt-1">{cfg.description}</p>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        orientation="vertical"
        className="flex flex-col md:flex-row gap-8"
      >
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
                        <PageEditor pageKey={ed.pageKey} fieldFilter={ed.fieldFilter} />
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              ) : section === "destinations" && t.value === "map" ? (
                <AdminDestinationsMapHub />
              ) : (
                <PageEditor pageKey={t.editors[0].pageKey} fieldFilter={t.editors[0].fieldFilter} />
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
