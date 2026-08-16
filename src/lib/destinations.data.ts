import elephantImg from "@/assets/elephant.jpg";
import lodgeTentImg from "@/assets/lodge-tent.jpg";
import heroBaobabImg from "@/assets/hero-baobab.jpg";
import { resolveImageSource } from "@/lib/image-resolution";
import journalLionImg from "@/assets/journal-lion.jpg";
import g1Img from "@/assets/gallery-1.jpg";
import g2Img from "@/assets/gallery-2.jpg";
import g3Img from "@/assets/gallery-3.jpg";
import g4Img from "@/assets/gallery-4.jpg";
import g5Img from "@/assets/gallery-5.jpg";
import g6Img from "@/assets/gallery-6.jpg";
import g7Img from "@/assets/gallery-7.jpg";

export type DestinationCategory = "The Icons" | "Beyond the Classics" | "The Indian Ocean";

export type BestForTag =
  | "Wildlife"
  | "Big Cats"
  | "Migration"
  | "Beach"
  | "Culture"
  | "Romance"
  | "Family"
  | "Adventure"
  | "Conservation"
  | "Photography"
  | "Wellness"
  | "Walking"
  | "Marine Life";

export type GeographicRegion =
  | "Northern Kenya"
  | "Rift Valley & Central Kenya"
  | "Southern Kenya"
  | "Indian Ocean Coast";

export interface DestinationMetadata {
  slug: string;
  name: string;
  country: string;
  region: GeographicRegion | string;
  destinationCategory: DestinationCategory;
  shortDescription: string;
  fullDescriptionFallback: string;
  bestFor: BestForTag[];
  bestSeason: string;
  bestMonths: string[];
  alsoGoodMonths: string[];
  latitude: number;
  longitude: number;
  featured: boolean;
  fallbackImage: string;
  highlights: string[];
  relatedDestinations: string[];
}

export const BEST_FOR_CATEGORIES: { id: BestForTag; label: string; description: string }[] = [
  {
    id: "Wildlife",
    label: "Wildlife",
    description: "Unrivalled game viewing and legendary predator density",
  },
  {
    id: "Beach",
    label: "Beach",
    description: "Pristine Swahili sands and turquoise Indian Ocean waters",
  },
  {
    id: "Culture",
    label: "Culture",
    description: "Deep encounters with Maasai, Samburu, and Swahili heritage",
  },
  {
    id: "Romance",
    label: "Romance",
    description: "Intimate star beds, secluded sanctuaries, and lantern-lit bush dinners",
  },
  {
    id: "Family",
    label: "Family",
    description: "Thoughtfully paced adventures designed for all generations",
  },
  {
    id: "Adventure",
    label: "Adventure",
    description: "Walking safaris, dhow sailing, and camel treks in wild country",
  },
  {
    id: "Conservation",
    label: "Conservation",
    description: "Community conservancies and pioneering anti-poaching initiatives",
  },
  {
    id: "Photography",
    label: "Photography",
    description: "Cinematic light, dramatic river crossings, and sweeping vistas",
  },
  {
    id: "Wellness",
    label: "Wellness",
    description: "Open-air yoga, spa pavilions, and restorative wilderness stillness",
  },
];

export const KENYA_REGIONS: { id: GeographicRegion; label: string; description: string }[] = [
  {
    id: "Northern Kenya",
    label: "Northern Kenya",
    description: "Vast arid frontiers, dramatic crags, Samburu warrior culture, and private rhino sanctuaries.",
  },
  {
    id: "Rift Valley & Central Kenya",
    label: "Rift Valley & Central",
    description: "Great tectonic lakes, fever tree forests, bird sanctuaries, and Mount Kenya's alpine tarns.",
  },
  {
    id: "Southern Kenya",
    label: "Southern Kenya",
    description: "Iconic savannahs, the Great Migration, and elephant herds beneath Mount Kilimanjaro.",
  },
  {
    id: "Indian Ocean Coast",
    label: "Indian Ocean Coast",
    description: "Swahili dhow sailing, historic UNESCO Lamu, coral reefs, and powder-soft white sands.",
  },
];

export const KENYA_DESTINATIONS_DATA: DestinationMetadata[] = [
  // ── THE ICONS ─────────────────────────────────────────────────────────────
  {
    slug: "maasai-mara",
    name: "Maasai Mara",
    country: "Kenya",
    region: "Southern Kenya",
    destinationCategory: "The Icons",
    shortDescription:
      "World-renowned savannah teeming with apex predators, vast migratory herds, and authentic Maasai conservancies.",
    fullDescriptionFallback:
      "The Maasai Mara is Kenya's crown jewel — an undulating golden savannah bordered by the Mara and Talek rivers. From July through October, millions of wildebeest and zebra brave crocodile-filled waters in the Great Migration. Year-round, its private community conservancies offer peerless big cat sightings, night game drives, and walking safaris guided by local Maasai elders.",
    bestFor: ["Wildlife", "Big Cats", "Migration", "Photography", "Family"],
    bestSeason: "Jul – Oct",
    bestMonths: ["Jul", "Aug", "Sep", "Oct"],
    alsoGoodMonths: ["Dec", "Jan", "Feb"],
    latitude: -1.4061,
    longitude: 35.139,
    featured: true,
    fallbackImage: g4Img,
    highlights: [
      "Great Migration River Crossings",
      "Private Conservancy Game Drives",
      "Hot-Air Ballooning at Sunrise",
      "Maasai Guided Bush Walks",
    ],
    relatedDestinations: ["diani-beach", "samburu", "laikipia"],
  },
  {
    slug: "amboseli",
    name: "Amboseli",
    country: "Kenya",
    region: "Southern Kenya",
    destinationCategory: "The Icons",
    shortDescription:
      "Legendary elephant herds marching across dry lake beds beneath the majestic snow-capped peak of Mount Kilimanjaro.",
    fullDescriptionFallback:
      "Framed by the towering silhouette of Mount Kilimanjaro, Amboseli is celebrated globally for its resident elephant population, studied continuously for over fifty years. The park transitions from dry lake beds to lush papyrus swamps fed by subterranean snowmelt, drawing hundreds of bird species and classic plains wildlife.",
    bestFor: ["Wildlife", "Photography", "Family", "Romance"],
    bestSeason: "Jun – Oct",
    bestMonths: ["Jun", "Jul", "Aug", "Sep", "Oct"],
    alsoGoodMonths: ["Jan", "Feb", "Mar"],
    latitude: -2.6527,
    longitude: 37.2606,
    featured: true,
    fallbackImage: elephantImg,
    highlights: [
      "Big Tusker Elephant Encounters",
      "Kilimanjaro Sunrise Backdrops",
      "Observation Hill Panoramas",
      "Swamp Birdlife Exploration",
    ],
    relatedDestinations: ["tsavo", "maasai-mara", "diani-beach"],
  },
  {
    slug: "samburu",
    name: "Samburu",
    country: "Kenya",
    region: "Northern Kenya",
    destinationCategory: "The Icons",
    shortDescription:
      "Rugged semi-arid wilderness framed by the Ewaso Nyiro River, home to the Samburu Special Five and rich pastoral culture.",
    fullDescriptionFallback:
      "North of the equator, Samburu National Reserve reveals Kenya's dramatic arid frontier. The palm-lined Ewaso Nyiro River acts as a lifeline through red doum-palm plains. Travellers come to encounter rare northern species — Grevy's zebra, reticulated giraffe, Beisa oryx, Somali ostrich, and gerenuk — alongside leopards and nomadic Samburu communities.",
    bestFor: ["Wildlife", "Culture", "Photography", "Adventure"],
    bestSeason: "Jun – Oct",
    bestMonths: ["Jun", "Jul", "Aug", "Sep", "Oct"],
    alsoGoodMonths: ["Dec", "Jan", "Feb", "Mar"],
    latitude: 0.6234,
    longitude: 37.5317,
    featured: true,
    fallbackImage: g1Img,
    highlights: [
      "Samburu Special Five Tracking",
      "Ewaso Nyiro River Sundowners",
      "Cultural Walks with Samburu Warriors",
      "Dramatic Rocky Kopjes",
    ],
    relatedDestinations: ["laikipia", "maasai-mara", "mount-kenya"],
  },

  // ── BEYOND THE CLASSICS ───────────────────────────────────────────────────
  {
    slug: "laikipia",
    name: "Laikipia Plateau",
    country: "Kenya",
    region: "Northern Kenya",
    destinationCategory: "Beyond the Classics",
    shortDescription:
      "Pioneering private conservancies offering rhino sanctuaries, wild dog tracking, horseback safaris, and walking journeys.",
    fullDescriptionFallback:
      "Stretching from the slopes of Mount Kenya to the edge of the northern rift, Laikipia is Kenya's most successful conservation frontier. Private and community-owned ranches protect endangered black and white rhinos, thriving packs of African wild dogs, and rare melanistic leopards. Here, safari activities extend far beyond traditional game drives to camel treks and fly camping.",
    bestFor: ["Conservation", "Walking", "Wildlife", "Family", "Adventure"],
    bestSeason: "Jun – Oct",
    bestMonths: ["Jun", "Jul", "Aug", "Sep", "Oct"],
    alsoGoodMonths: ["Dec", "Jan", "Feb"],
    latitude: 0.3297,
    longitude: 36.9062,
    featured: false,
    fallbackImage: lodgeTentImg,
    highlights: [
      "Black Rhino Sanctuaries",
      "Horseback & Walking Safaris",
      "Wild Dog Pack Tracking",
      "Star Bed Sleep-outs",
    ],
    relatedDestinations: ["samburu", "maasai-mara", "mount-kenya"],
  },
  {
    slug: "tsavo",
    name: "Tsavo East & West",
    country: "Kenya",
    region: "Southern Kenya",
    destinationCategory: "Beyond the Classics",
    shortDescription:
      "Vast red-dust savannahs, crystal volcanic springs, and dramatic rocky escarpments known for magnificent tusker elephants.",
    fullDescriptionFallback:
      "Forming one of the largest protected wilderness areas on earth, Tsavo is raw and untamed. Tsavo East features sweeping semi-arid plains where elephants bathe in iconic red volcanic soil. Tsavo West presents lush hilly landscapes, Mzima Springs' crystal-clear hippo pools, and the ancient Shetani lava flows.",
    bestFor: ["Wildlife", "Adventure", "Photography", "Conservation"],
    bestSeason: "Jun – Oct",
    bestMonths: ["Jun", "Jul", "Aug", "Sep", "Oct"],
    alsoGoodMonths: ["Jan", "Feb"],
    latitude: -2.7667,
    longitude: 38.7667,
    featured: false,
    fallbackImage: g6Img,
    highlights: [
      "Red Elephant Herds",
      "Mzima Springs Underwater Viewing",
      "Shetani Lava Flow",
      "Mudanda Rock Waterhole",
    ],
    relatedDestinations: ["amboseli", "diani-beach", "watamu"],
  },
  {
    slug: "lake-nakuru-naivasha",
    name: "Lake Nakuru & Naivasha",
    country: "Kenya",
    region: "Rift Valley & Central Kenya",
    destinationCategory: "Beyond the Classics",
    shortDescription:
      "Great Rift Valley lakes framed by fever tree forests, sanctuary rhinos, boat safaris, and walking among giraffe on Crescent Island.",
    fullDescriptionFallback:
      "Nestled on the floor of the Great Rift Valley, Lake Naivasha and Lake Nakuru offer gentle, scenic safari encounters. Lake Naivasha invites boat safaris past pods of hippos and walking on Crescent Island, while nearby Lake Nakuru National Park is a fenced sanctuary safeguarding healthy populations of both black and white rhinos.",
    bestFor: ["Wildlife", "Family", "Walking", "Photography"],
    bestSeason: "Year-round",
    bestMonths: ["Jun", "Jul", "Aug", "Sep", "Oct", "Jan", "Feb"],
    alsoGoodMonths: ["Mar", "Nov", "Dec"],
    latitude: -0.5667,
    longitude: 36.2167,
    featured: false,
    fallbackImage: g5Img,
    highlights: [
      "Rhino Sanctuary Drives",
      "Lake Naivasha Boat Expeditions",
      "Crescent Island Walking Safari",
      "Hell's Gate Gorge Biking",
    ],
    relatedDestinations: ["maasai-mara", "mount-kenya", "laikipia"],
  },
  {
    slug: "mount-kenya",
    name: "Mount Kenya Highlands",
    country: "Kenya",
    region: "Northern Kenya",
    destinationCategory: "Beyond the Classics",
    shortDescription:
      "Africa's second-highest summit enveloped in misty bamboo forests, trout streams, and high-altitude wilderness sanctuaries.",
    fullDescriptionFallback:
      "Rising dramatically above the central plains, Mount Kenya is an extinct volcano draped in equatorial glaciers and moorlands. The lower slopes host dense indigenous forests home to rare bongo antelopes and giant forest hogs, while exclusive private lodges offer horseback riding, fly-fishing, and guided trekking.",
    bestFor: ["Adventure", "Walking", "Conservation", "Romance"],
    bestSeason: "Dec – Mar",
    bestMonths: ["Dec", "Jan", "Feb", "Mar"],
    alsoGoodMonths: ["Jul", "Aug", "Sep"],
    latitude: -0.1521,
    longitude: 37.3084,
    featured: false,
    fallbackImage: heroBaobabImg,
    highlights: [
      "Alpine Mountain Trekking",
      "Wilderness Forest Walks",
      "Trout Stream Fly-Fishing",
      "Canopy Walkways & Waterfalls",
    ],
    relatedDestinations: ["laikipia", "samburu", "lake-nakuru-naivasha"],
  },

  // ── THE INDIAN OCEAN ──────────────────────────────────────────────────────
  {
    slug: "lamu-archipelago",
    name: "Lamu Archipelago",
    country: "Kenya",
    region: "Indian Ocean Coast",
    destinationCategory: "The Indian Ocean",
    shortDescription:
      "A serene, car-free UNESCO Swahili archipelago of carved timber doors, sunset dhow sailing, and barefoot coastal luxury.",
    fullDescriptionFallback:
      "Stepping onto Lamu Island is entering a rhythm shaped by tides and trade winds. As Kenya's oldest continuously inhabited Swahili settlement, Lamu Old Town features coral-rag mansions, donkey-lined alleys, and rooftop courtyards. Nearby Shela Beach offers miles of deserted dunes and tranquil dhow journeys across turquoise channels.",
    bestFor: ["Culture", "Beach", "Romance", "Wellness"],
    bestSeason: "Oct – Apr",
    bestMonths: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
    alsoGoodMonths: ["Jul", "Aug", "Sep"],
    latitude: -2.2717,
    longitude: 40.902,
    featured: true,
    fallbackImage: g2Img,
    highlights: [
      "Sunset Dhow Sailing",
      "UNESCO Swahili Town Immersion",
      "Deserted Shela Beach Walks",
      "Rooftop Swahili Dinners",
    ],
    relatedDestinations: ["watamu", "maasai-mara", "laikipia"],
  },
  {
    slug: "watamu",
    name: "Watamu & Malindi",
    country: "Kenya",
    region: "Indian Ocean Coast",
    destinationCategory: "The Indian Ocean",
    shortDescription:
      "Powder-soft white sands, marine national parks teeming with coral reefs, and sea turtle conservation sanctuaries.",
    fullDescriptionFallback:
      "Watamu is a coastal haven where dense coastal forest meets a pristine marine national park. Sheltered bays, sandbars, and coral gardens offer premier snorkelling, scuba diving, and deep-sea game fishing. It is also an active conservation hub for sea turtle rehabilitation and Arabuko Sokoke coastal forest protection.",
    bestFor: ["Marine Life", "Beach", "Conservation", "Family", "Wellness"],
    bestSeason: "Nov – Apr",
    bestMonths: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
    alsoGoodMonths: ["Jul", "Aug", "Sep", "Oct"],
    latitude: -3.3533,
    longitude: 40.0167,
    featured: false,
    fallbackImage: g7Img,
    highlights: [
      "Marine National Park Snorkelling",
      "Sea Turtle Sanctuary Visits",
      "Mida Creek Boardwalk & Birding",
      "Pristine Sandbar Lounging",
    ],
    relatedDestinations: ["lamu-archipelago", "diani-beach", "tsavo"],
  },
  {
    slug: "diani-beach",
    name: "Diani Beach",
    country: "Kenya",
    region: "Indian Ocean Coast",
    destinationCategory: "The Indian Ocean",
    shortDescription:
      "Award-winning palm-fringed coast with emerald waters, coral sandbanks, kitesurfing, and private oceanfront boutique villas.",
    fullDescriptionFallback:
      "Voted repeatedly as Africa's leading beach destination, Diani Beach is defined by unbroken stretches of fine white coral sand, vibrant coral reefs, and gentle turquoise shallows. It is the quintessential ending point for a Kenya safari, combining world-class dining, kitesurfing, colobus monkey sanctuaries, and private barefoot luxury.",
    bestFor: ["Beach", "Romance", "Family", "Wellness", "Adventure"],
    bestSeason: "Oct – Apr",
    bestMonths: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
    alsoGoodMonths: ["Jul", "Aug", "Sep"],
    latitude: -4.2794,
    longitude: 39.5855,
    featured: true,
    fallbackImage: g3Img,
    highlights: [
      "Kite Surfing & Paddleboarding",
      "Kwale Forest Elephant Reserve Day Trip",
      "Private Sandbank Dhow Excursions",
      "Oceanfront Spa & Wellness",
    ],
    relatedDestinations: ["maasai-mara", "amboseli", "tsavo"],
  },
];

export interface DestinationCombination {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  destinations: string[];
  destinationNames: string[];
  days: string;
  highlights: string[];
  image: string;
  transferType: string;
  bestFor: string;
}

export const DESTINATION_COMBINATIONS: DestinationCombination[] = [
  {
    id: "mara-diani",
    title: "Maasai Mara + Diani Beach",
    subtitle: "Savannah to Sea",
    tagline: "Kenya's ultimate classic pairing: big cats and turquoise Indian Ocean reefs.",
    destinations: ["maasai-mara", "diani-beach"],
    destinationNames: ["Maasai Mara", "Diani Beach"],
    days: "8 – 10 nights",
    highlights: ["River crossings & big cats", "Direct bush plane flight to coast", "Barefoot luxury on white sands"],
    image: g4Img,
    transferType: "Scenic bush flight (1 hr 45 min)",
    bestFor: "First-Time Safari · Honeymoons · Families",
  },
  {
    id: "samburu-laikipia-mara",
    title: "Samburu + Laikipia + Maasai Mara",
    subtitle: "The Northern Wilderness to Great Plains",
    tagline: "Explore Kenya's wild arid frontier, private rhino sanctuaries, and the Great Migration.",
    destinations: ["samburu", "laikipia", "maasai-mara"],
    destinationNames: ["Samburu", "Laikipia Plateau", "Maasai Mara"],
    days: "10 – 12 nights",
    highlights: ["Samburu Special Five", "Walking safaris & rhino tracking", "Exclusive private conservancies"],
    image: g1Img,
    transferType: "Scheduled safari light aircraft",
    bestFor: "Wildlife Enthusiasts · Photographers · Walking Safaris",
  },
  {
    id: "amboseli-tsavo-diani",
    title: "Amboseli + Tsavo + Diani Beach",
    subtitle: "Kilimanjaro Giants & Turquoise Coast",
    tagline: "Follow the historical safari route from Kilimanjaro's shadow through red-earth savannah to the beach.",
    destinations: ["amboseli", "tsavo", "diani-beach"],
    destinationNames: ["Amboseli", "Tsavo", "Diani Beach"],
    days: "9 – 11 nights",
    highlights: ["Giant tusker elephants", "Volcanic springs & red dirt", "Private coastal villa retreat"],
    image: elephantImg,
    transferType: "Private 4x4 Cruiser + Flight",
    bestFor: "Scenic Diversity · Families · Slow Travel",
  },
  {
    id: "mount-kenya-naivasha-mara",
    title: "Mount Kenya + Great Rift + Maasai Mara",
    subtitle: "Highlands, Rift Valley Lakes & Savannah",
    tagline:
      "A sweeping overland journey across Kenya's high afro-alpine forests, rift lakes, and predator heartlands.",
    destinations: ["mount-kenya", "lake-nakuru-naivasha", "maasai-mara"],
    destinationNames: ["Mount Kenya", "Lake Naivasha", "Maasai Mara"],
    days: "9 – 12 nights",
    highlights: ["Highland trout streams & forest", "Boat safaris among hippos", "Endless Mara plains"],
    image: heroBaobabImg,
    transferType: "Private guided overland & flight",
    bestFor: "Active Explorers · Birders · Landscape Lovers",
  },
];

/**
 * Enriches a raw database destination record with metadata and fallbacks
 */
export function enrichDestination(dbDest: any): DestinationMetadata {
  const meta = KENYA_DESTINATIONS_DATA.find(
    (d) =>
      d.slug === dbDest.slug ||
      d.name.toLowerCase() === (dbDest.name || "").toLowerCase() ||
      (dbDest.name || "").toLowerCase().includes(d.name.toLowerCase()) ||
      d.name.toLowerCase().includes((dbDest.name || "").toLowerCase()),
  );

  // Region fallback
  let region: GeographicRegion | string = dbDest.region || meta?.region || "Southern Kenya";
  if (region === "East Africa" && meta?.region) {
    region = meta.region;
  }

  // Category fallback
  const destinationCategory: DestinationCategory =
    (dbDest.destination_category as DestinationCategory) ||
    meta?.destinationCategory ||
    (region.includes("Ocean") || region.includes("Coast")
      ? "The Indian Ocean"
      : dbDest.featured || meta?.featured
        ? "The Icons"
        : "Beyond the Classics");

  // Best For fallback
  const bestFor: BestForTag[] =
    Array.isArray(dbDest.best_for) && dbDest.best_for.length > 0
      ? (dbDest.best_for as BestForTag[])
      : meta?.bestFor || ["Wildlife", "Photography", "Adventure"];

  // Best Months fallback
  const bestMonths: string[] =
    Array.isArray(dbDest.best_months) && dbDest.best_months.length > 0
      ? dbDest.best_months
      : meta?.bestMonths || ["Jul", "Aug", "Sep", "Oct"];

  const alsoGoodMonths: string[] =
    Array.isArray(dbDest.also_good_months) && dbDest.also_good_months.length > 0
      ? dbDest.also_good_months
      : meta?.alsoGoodMonths || ["Jan", "Feb"];

  // Short description fallback:
  // Prefer db short_description; otherwise meta; otherwise first sentence of description; otherwise fallback.
  let shortDescription = dbDest.short_description?.trim() || meta?.shortDescription;
  if (!shortDescription && dbDest.description) {
    // Strip HTML and take first 1-2 sentences
    const plain = dbDest.description.replace(/<[^>]*>?/gm, "").trim();
    const sentences = plain.match(/[^\.!\?]+[\.!\?]+/g);
    shortDescription = sentences ? sentences.slice(0, 2).join(" ").trim() : plain.slice(0, 160);
  }
  if (!shortDescription) {
    shortDescription = "Experience the extraordinary wilderness, wildlife, and cultures of Kenya.";
  }

  // Image fallback: prefer a real user/media image, then curated metadata, then intentional placeholder.
  const fallbackImage = resolveImageSource(dbDest.image, meta?.fallbackImage, elephantImg) ?? elephantImg;

  // Highlights
  const highlights =
    Array.isArray(dbDest.featured_trips) && dbDest.featured_trips.length > 0
      ? dbDest.featured_trips
      : meta?.highlights || ["Private Game Drives", "Guided Walking Safaris", "Scenic Sundowners"];

  return {
    slug: dbDest.slug,
    name: dbDest.name,
    country: dbDest.country || "Kenya",
    region,
    destinationCategory,
    shortDescription,
    fullDescriptionFallback: dbDest.description || meta?.fullDescriptionFallback || shortDescription,
    bestFor,
    bestSeason: dbDest.best_season || meta?.bestSeason || "Jul – Oct",
    bestMonths,
    alsoGoodMonths,
    latitude: dbDest.latitude ?? meta?.latitude ?? -1.286389,
    longitude: dbDest.longitude ?? meta?.longitude ?? 36.817223,
    featured: dbDest.featured ?? meta?.featured ?? false,
    fallbackImage,
    highlights,
    relatedDestinations:
      Array.isArray(dbDest.related_destinations) && dbDest.related_destinations.length > 0
        ? dbDest.related_destinations
        : meta?.relatedDestinations || [],
  };
}

/**
 * Helper to match database records and fallback metadata into a complete list
 */
export function mergeDestinationsWithDefaults(dbList: any[]): DestinationMetadata[] {
  const seenSlugs = new Set<string>();
  const merged: DestinationMetadata[] = [];

  // 1. Process all actual database destinations first
  for (const item of dbList || []) {
    const enriched = enrichDestination(item);
    seenSlugs.add(enriched.slug);
    merged.push(enriched);
  }

  // 2. If database does not yet contain all Kenya discovery destinations, append curated defaults so the visitor discovers full Kenya
  for (const def of KENYA_DESTINATIONS_DATA) {
    if (!seenSlugs.has(def.slug)) {
      merged.push(def);
      seenSlugs.add(def.slug);
    }
  }

  return merged;
}

/**
 * Calibrated default percentage coordinates for reference Kenya Map
 */
export const DEFAULT_DESTINATION_MAP_POSITIONS: Record<string, { left: number; top: number }> = {
  "maasai-mara": { left: 24.5, top: 64.0 },
  amboseli: { left: 47.0, top: 76.5 },
  samburu: { left: 47.5, top: 42.5 },
  laikipia: { left: 41.5, top: 48.0 },
  tsavo: { left: 57.5, top: 78.5 },
  "lake-nakuru-naivasha": { left: 31.5, top: 56.5 },
  "mount-kenya": { left: 46.5, top: 51.5 },
  "lamu-archipelago": { left: 84.5, top: 55.0 },
  malindi: { left: 84.0, top: 65.5 },
  watamu: { left: 83.5, top: 68.5 },
  "diani-beach": { left: 82.5, top: 80.5 },
};

/**
 * Custom Label Offsets to prevent collision with map printed text and neighboring pins.
 */
export const DESTINATION_LABEL_OFFSETS: Record<string, string> = {
  laikipia: "-translate-x-[105%] -translate-y-1/2",
  "mount-kenya": "translate-x-3 -translate-y-1/2",
  samburu: "-translate-x-1/2 -translate-y-[200%]",
  "lake-nakuru-naivasha": "-translate-x-[105%] translate-y-1",
  "lamu-archipelago": "-translate-x-[105%] -translate-y-1/2",
  malindi: "-translate-x-[105%] -translate-y-1/2",
  watamu: "-translate-x-[105%] -translate-y-1/2",
  "diani-beach": "-translate-x-[105%] -translate-y-1/2",
  tsavo: "translate-x-3 translate-y-0",
  amboseli: "-translate-x-1/2 translate-y-3",
  "maasai-mara": "-translate-x-1/2 translate-y-3",
};

/**
 * Calculates percentage pin position on reference map:
 * Checks custom admin positions first, then default positions, then geographic fallback.
 */
export function getDestinationMapPosition(
  d: DestinationMetadata,
  customPositions?: Record<string, { left: number; top: number }> | null,
): { left: number; top: number } {
  // 1. Custom positions (saved by admin)
  if (customPositions && customPositions[d.slug]) {
    const p = customPositions[d.slug];
    if (typeof p.left === "number" && typeof p.top === "number") {
      return { left: p.left, top: p.top };
    }
  }

  // 2. Direct slug match in default positions
  if (DEFAULT_DESTINATION_MAP_POSITIONS[d.slug]) {
    return DEFAULT_DESTINATION_MAP_POSITIONS[d.slug];
  }

  // 3. Loose key match in custom positions or defaults
  if (customPositions) {
    const customKey = Object.keys(customPositions).find(
      (k) => d.slug.includes(k) || k.includes(d.slug) || d.name.toLowerCase().includes(k),
    );
    if (customKey && customPositions[customKey]) {
      return customPositions[customKey];
    }
  }

  const key = Object.keys(DEFAULT_DESTINATION_MAP_POSITIONS).find(
    (k) => d.slug.includes(k) || k.includes(d.slug) || d.name.toLowerCase().includes(k),
  );
  if (key && DEFAULT_DESTINATION_MAP_POSITIONS[key]) {
    return DEFAULT_DESTINATION_MAP_POSITIONS[key];
  }

  // 4. Fallback Lat/Lng Box mapping calibrated to the reference GIF boundaries
  const minLat = -4.8;
  const maxLat = 5.0;
  const minLng = 33.8;
  const maxLng = 42.0;

  const left = Math.max(8, Math.min(92, 5 + ((d.longitude - minLng) / (maxLng - minLng)) * 88));
  const top = Math.max(8, Math.min(92, 5 + ((maxLat - d.latitude) / (maxLat - minLat)) * 88));

  return {
    left: Number(left.toFixed(1)),
    top: Number(top.toFixed(1)),
  };
}
