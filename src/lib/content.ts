import heroBaobab from "@/assets/hero-baobab.jpg";
import lodgeTent from "@/assets/lodge-tent.jpg";
import elephant from "@/assets/elephant.jpg";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";

const journalBaobab = "/api/public/media/1786937361601-journal-baobab.jpg";
const journalLion = "/api/public/media/1786937362836-journal-lion.jpg";
const journalLodge = "/api/public/media/1786937363764-journal-lodge.jpg";

export type Itinerary = {
  name: string;
  nights: string;
  highlights: string[];
  description: string;
  image: string;
};

export type JourneyCategory = {
  slug: "adventure" | "connection" | "heritage" | "conservation";
  title: string;
  tagline: string;
  intro: string;
  heroImage: string;
  itineraries: Itinerary[];
};

export const journeys: JourneyCategory[] = [
  {
    slug: "adventure",
    title: "Adventure",
    tagline: "Wild landscapes. Untamed encounters.",
    intro:
      "From the dunes of the Namib to the Okavango's floodplains, our adventure journeys take you deep into Africa's most untamed places — guided by experts who know the land like family.",
    heroImage: heroBaobab,
    itineraries: [
      {
        name: "Wilderness Awakening",
        nights: "7 nights",
        highlights: ["Okavango Delta safari", "Mokoro canoe expedition", "Walking safaris with master guides"],
        description: "Track wildlife on foot, glide through papyrus channels, and sleep under skies thick with stars.",
        image: lodgeTent,
      },
      {
        name: "Dunes & Desert",
        nights: "8 nights",
        highlights: ["Sossusvlei sunrise", "Skeleton Coast flight", "Hot-air balloon over Namib"],
        description: "An odyssey through Namibia's ancient deserts, where silence and scale rewrite the senses.",
        image: g3,
      },
      {
        name: "Great Migration Chase",
        nights: "9 nights",
        highlights: ["Mara river crossings", "Private bush dinner", "Hot air balloon at dawn"],
        description: "Follow the rhythm of the herds across the Serengeti and Maasai Mara at the height of the migration.",
        image: elephant,
      },
    ],
  },
  {
    slug: "connection",
    title: "Connection",
    tagline: "Meaningful encounters with people and place.",
    intro:
      "Slow journeys designed around the people, traditions and quiet rituals that make Africa unforgettable. Connect with communities, conservationists and the wild itself.",
    heroImage: g1,
    itineraries: [
      {
        name: "Safari Connection",
        nights: "5 nights",
        highlights: ["Village storytelling evening", "Cook with a local chef", "Private guided bush walks"],
        description: "Settle into a single intimate camp, sharing meals and stories with the people who call it home.",
        image: g2,
      },
      {
        name: "Maasai Heartlands",
        nights: "6 nights",
        highlights: ["Stay with a Maasai family", "Traditional beadwork workshop", "Guided plains walk"],
        description: "Live alongside the Maasai, learning the rhythms of cattle, land and the elders' wisdom.",
        image: g4,
      },
      {
        name: "Slow Safari Sanctuary",
        nights: "7 nights",
        highlights: ["Yoga at sunrise", "Forest bathing", "Star bed sleep-outs"],
        description: "A gentler pace — long mornings, quiet bush, and time to truly arrive.",
        image: journalLodge,
      },
    ],
  },
  {
    slug: "heritage",
    title: "Heritage",
    tagline: "Honouring the stories that shape Africa.",
    intro:
      "Journey through living history — ancient rock art, sacred landscapes and the cultural threads that bind generations to the land.",
    heroImage: journalBaobab,
    itineraries: [
      {
        name: "Heritage Trails",
        nights: "9 nights",
        highlights: ["Lalibela rock churches", "Omo Valley ceremonies", "Tea with elders"],
        description: "An immersive arc through Ethiopia's spiritual and cultural heartlands.",
        image: journalBaobab,
      },
      {
        name: "Kingdoms of the South",
        nights: "8 nights",
        highlights: ["Great Zimbabwe ruins", "San rock art", "Riverside heritage lodges"],
        description: "Follow the trade and storytelling routes that built southern Africa's lost kingdoms.",
        image: g1,
      },
      {
        name: "Coastal Trade Winds",
        nights: "7 nights",
        highlights: ["Stone Town heritage walk", "Swahili dhow sailing", "Spice farm immersion"],
        description: "Discover the Swahili coast where Africa, Arabia and Asia meet across centuries.",
        image: g2,
      },
    ],
  },
  {
    slug: "conservation",
    title: "Conservation",
    tagline: "Travel that gives back.",
    intro:
      "Each of these journeys directly funds anti-poaching, rewilding and community programmes. Travel deeply, leave a legacy.",
    heroImage: elephant,
    itineraries: [
      {
        name: "Conservation Journey",
        nights: "7 nights",
        highlights: ["Rhino tracking on foot", "Behind-the-scenes with rangers", "Tree planting with community"],
        description: "Spend a week with the conservationists protecting Africa's most endangered species.",
        image: elephant,
      },
      {
        name: "Rewilding Reserve",
        nights: "6 nights",
        highlights: ["Wildlife monitoring", "Camera-trap study", "Lodge funded by your stay"],
        description: "Witness rewilding in motion at a reserve where every guest stay restores wild land.",
        image: journalLion,
      },
      {
        name: "Marine Sanctuary",
        nights: "6 nights",
        highlights: ["Coral restoration dive", "Sea turtle release", "Conservation researcher hosted"],
        description: "From reef to forest — an ocean-focused conservation safari on Africa's eastern shores.",
        image: g4,
      },
    ],
  },
];

export const getJourney = (slug: string) => journeys.find((j) => j.slug === slug);

export type JournalArticle = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
  category: string;
  content: string[];
};

export const articles: JournalArticle[] = [
  {
    slug: "first-safari-guide",
    title: "Where to go for your first safari",
    excerpt:
      "Africa is vast and varied — here's how to choose the right place to begin your safari story.",
    image: journalBaobab,
    date: "October 2024",
    readTime: "6 min read",
    category: "Travel Guide",
    content: [
      "There is no single 'right' first safari. The best one is the one shaped around what stirs you — open plains alive with the migration, intimate forest walks with mountain gorillas, or the soft quiet of a mokoro in the Okavango at dawn.",
      "For first-time travellers we often recommend Kenya or Tanzania. Both reward you generously: classic Big Five game viewing, deep cultural heritage, and a wide range of lodges from elegantly understated to genuinely wild.",
      "If you crave space and silence, Botswana and Namibia offer landscapes so vast they reorder your sense of self. Choose Botswana for water-based safaris in the Delta, Namibia for the painterly dunes of Sossusvlei.",
      "Whatever you choose, give yourself time. Safari rewards stillness. Three nights in one camp will always outweigh a frantic loop of single-night stops. Let the land find you.",
    ],
  },
  {
    slug: "slow-travel-magic",
    title: "The magic of slow travel in Africa",
    excerpt:
      "Why fewer destinations and longer stays unlock the deepest, most memorable safari moments.",
    image: journalLion,
    date: "September 2024",
    readTime: "5 min read",
    category: "Philosophy",
    content: [
      "Slow travel isn't a trend — it's a return to the way safari was always meant to be experienced. The most extraordinary wildlife encounters rarely happen in the first hour. They happen on day three, when the bush begins to reveal itself to you.",
      "When you stay longer in one camp, the rhythms shift. You start to recognise individual elephants. You learn the call of the fish eagle. Your guide stops being a guide and becomes a friend.",
      "We design every journey with negative space — afternoons with nothing scheduled, mornings without an alarm. The magic is in what unfolds when you stop chasing it.",
      "Pack lightly. Walk often. Read by lantern. Eat slowly. Africa will do the rest.",
    ],
  },
  {
    slug: "responsible-travel",
    title: "Why responsible travel matters",
    excerpt:
      "Every itinerary we craft is built around community, conservation and a lighter footprint.",
    image: journalLodge,
    date: "August 2024",
    readTime: "7 min read",
    category: "Conservation",
    content: [
      "Tourism funds more than 80% of conservation work across many of Africa's wildest landscapes. The choice of where you stay, who guides you, and how your money flows shapes whether wilderness survives.",
      "We only partner with lodges and operators that demonstrably reinvest in their communities and ecosystems. That means local ownership, fair employment, anti-poaching contributions and habitat restoration that we can name and verify.",
      "Responsible travel isn't about giving up beauty or comfort. It's about choosing the version of beauty that endures — because someone is protecting it long after you've flown home.",
      "Travel that connects, restores and gives back: that is the only kind of journey worth taking now.",
    ],
  },
];

export const getArticle = (slug: string) => articles.find((a) => a.slug === slug);
