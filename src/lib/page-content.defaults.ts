// Default content for editable pages, used as fallback if no override is saved.
export const PAGE_DEFAULTS = {
  home: {
    hero_title_line1: "KENYA,",
    hero_title_line2: "CURATED PERSONALLY",
    hero_subtitle: "Private safaris, wild places and meaningful connections — designed around you.",
    hero_cta_primary: "Plan With Us",
    hero_cta_secondary: "Explore Destinations",
    hero_proof_text: "Private Kenya journeys shaped with care, context and local knowledge.",
    hero_image_url: "",
    hero_image_as_background: true,
    hero_hide_search: true,
    hero_focal_x: 50, // 0 = left, 100 = right
    hero_focal_y: 50, // 0 = top,  100 = bottom
    hero_bg_size: "cover" as "cover" | "contain",
  },
  about: {
    eyebrow: "The feeling of Kenya",
    title_line1: "KENYA ISN'T JUST",
    title_line2: "A DESTINATION.",
    title_line3: "IT'S A FEELING.",
    body: "The Baobab Collective designs private journeys through Kenya with the calm confidence of people who know the place intimately — its landscapes, its lodges, its guides, and the small moments that make a journey stay with you.",
    image_left_url: "",
    image_right_url: "",
  },
  about_mission: {
    eyebrow: "Our Mission",
    title: "Journeys with purpose",
    body: "Every safari we design supports conservation, community, and the guides who make Africa feel like home. We believe travel should give back as much as it gives.",
  },
  about_values: {
    eyebrow: "What guides us",
    title: "Our values",
    value_1_title: "Conservation-led",
    value_1_body: "Each journey supports the wild places we love.",
    value_2_title: "Community-first",
    value_2_body: "We partner with local guides and lodges.",
    value_3_title: "Slow travel",
    value_3_body: "Fewer destinations. Deeper connections.",
    value_4_title: "Bespoke by design",
    value_4_body: "No two itineraries are ever the same.",
  },
  about_team: {
    eyebrow: "The people",
    title: "Meet the collective",
    body: "A small team of Africa specialists, guides and storytellers with deep roots in Kenya.",
    image_1_url: "",
    image_1_name: "Michael D'Souza",
    image_1_role: "Co-Founder",
    image_1_bio:
      "Kenya has been home for most of my life. I created Baobab to share the places and people I know best.",
    image_2_url: "",
    image_2_name: "Samra D'Souza",
    image_2_role: "Co-Founder",
    image_2_bio:
      "Samra brings a deeply personal eye to each journey, shaping travel with warmth, care and an instinct for meaningful connection.",
    image_3_url: "",
    image_3_name: "",
    image_3_role: "",
    image_3_bio: "",
    image_4_url: "",
    image_4_name: "",
    image_4_role: "",
    image_4_bio: "",
  },

  private_travel: {
    eyebrow: "Private Travel",
    title: "Designed entirely around you.",
    subtitle: "For travellers who want something truly bespoke — every camp, guide and moment shaped to your story.",
    success_title: "Request received",
    success_body:
      "A confirmation has been sent to your inbox. One of our journey designers will reach out within 48 hours.",
    submit_label: "Request my bespoke journey",
  },
  home_adventures: {
    eyebrow: "Journeys",
    title: "ADVENTURE",
    body: "For the wild at heart — migration country, remote wilderness, walking safaris and unforgettable encounters.",
    cta_label: "Explore journeys",
  },
  home_destinations: {
    eyebrow: "The Continent",
    title: "DESTINATIONS",
    body: "From the deltas of Botswana to the highlands of Ethiopia — explore where each journey could take you.",
    cta_label: "Explore destinations",
    hidden: false,
  },
  home_lodges: {
    eyebrow: "Places we love",
    title: "PARTNER LODGES",
    body: "Every camp and lodge has been walked, slept in, and chosen for soul as much as setting.",
    cta_label: "Discover lodges",
  },
  home_journal: {
    eyebrow: "Stories from the road",
    title_line1: "A JOURNAL",
    title_line2: "OF PLACES,",
    title_line3: "PEOPLE & LIGHT.",
    body: "Field notes, travel ideas and considered guidance for journeys that begin before you board the plane.",
    cta_label: "Explore the Journal",
  },
  home_instagram: {
    heading: "Follow Our Journeys",
    handle: "@thebaobabcollective",
    url: "https://instagram.com/thebaobabcollective",
    image_1_url: "",
    image_1_caption: "",
    image_2_url: "",
    image_2_caption: "",
    image_3_url: "",
    image_3_caption: "",
    image_4_url: "",
    image_4_caption: "",
    image_5_url: "",
    image_5_caption: "",
    image_6_url: "",
    image_6_caption: "",
    image_7_url: "",
    image_7_caption: "",
  },

  top_bar: {
    text: "Curated Safari Journeys. Authentic Connections. Extraordinary Experiences.",
    enabled: true,
  },
  contact: {
    eyebrow: "We'd love to hear from you",
    title_line1: "Let's Plan",
    title_line2: "Your Journey",
    body: "Tell us a little about who's travelling, when, and the kind of experience you're after. One of our journey designers will respond within 24 hours with first ideas and next steps.",
    form_title: "Share Your Vision",
    form_intro:
      "Open our detailed enquiry form — tell us who's travelling, when, your budget, and the experiences you're dreaming of. We'll respond within 24 hours.",
    form_cta: "Open Enquiry Form",
    email_label: "Email us",
    phone_label: "Call / WhatsApp",
    instagram_label: "Instagram",
    facebook_label: "Facebook",
    instagram_url: "https://instagram.com/thebaobabcollective",
    instagram_handle: "@thebaobabcollective",
    facebook_url: "https://facebook.com/thebaobabcollective",
    facebook_handle: "/thebaobabcollective",
  },
  lodges_index: {
    eyebrow: "Where you'll stay",
    title: "Partner Lodges",
    subtitle: "Every camp and lodge we work with has been walked, slept in, and chosen for soul as much as setting.",
  },
  adventures_index: {
    eyebrow: "Signature Adventures",
    title: "Wild Africa, Deeply Lived",
    subtitle: "Walking safaris, mokoro expeditions, desert traverses, gorilla treks and migration chases.",
    // Rhythm section (editable)
    rhythm_eyebrow: "A Day in the Field",
    rhythm_title: "The rhythm of an adventure day.",
    rhythm_body:
      "No two days repeat — but the cadence is the same. Up before the bush, slow through the heat, alive again at dusk.",
    // Signature section header
    signature_eyebrow: "Signature Adventures",
    signature_title: "Journeys we'd take ourselves.",
    signature_body: "Each is a starting point — every detail is reshaped around you, your dates and your pace.",
    // Show/hide sections
    show_rhythm: true,
    show_enquiry_cta: true,
  },
  testimonials_page: {
    eyebrow: "Guest Stories",
    title: "In their words",
    subtitle: "The clearest measure of a journey is how it stays with you afterwards.",
    show_metrics: true,
    metric_1_value: "12+",
    metric_1_label: "Years of journeys",
    metric_2_value: "800+",
    metric_2_label: "Travellers hosted",
    metric_3_value: "40+",
    metric_3_label: "Lodge partners",
    cta_title: "Let your story begin here",
    cta_button: "Start planning",
  },
  // Detail-page templates (shared intros / CTAs)
  detail_journey: {
    enquire_cta: "Enquire about this journey",
    intro_eyebrow: "The Journey",
    related_title: "Other journeys you might love",
  },
  detail_lodge: {
    enquire_cta: "Enquire about this lodge",
    intro_eyebrow: "The Lodge",
    related_title: "Similar lodges",
  },
  // Footer copy (columns are managed via Menu editor; socials are editable here)
  footer: {
    newsletter_title: "Newsletter",
    newsletter_body: "Receive travel inspiration and special offers.",
    newsletter_placeholder: "Your email address",
    copyright: "© The Baobab Collective {year} | All Rights Reserved",
    contact_heading: "Get in Touch",
    instagram_url: "https://instagram.com",
    facebook_url: "https://facebook.com",
    linkedin_url: "",
    twitter_url: "",
    youtube_url: "",
  },
  // 404 / Auth / global SEO
  not_found: {
    title: "Page not found",
    body: "The page you're looking for doesn't exist or has been moved.",
    cta_label: "Go home",
  },
  auth_page: {
    title: "Admin sign in",
    subtitle: "Access The Baobab Collective admin.",
    email_label: "Email",
    password_label: "Password",
    submit_label: "Sign in",
  },
  seo: {
    site_name: "The Baobab Collective",
    default_title: "The Baobab Collective — Curated Safari Journeys",
    default_description:
      "Luxury curated safari experiences in Africa. Authentic connections, conservation-led journeys, and extraordinary moments.",
    default_og_image: "",
  },
} as const;

export type PageDefaults = typeof PAGE_DEFAULTS;
export type PageKey = keyof PageDefaults;

export function mergePageContent<K extends PageKey>(
  key: K,
  override: Record<string, unknown> | null | undefined,
): PageDefaults[K] {
  return { ...PAGE_DEFAULTS[key], ...(override ?? {}) } as PageDefaults[K];
}
