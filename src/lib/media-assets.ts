/**
 * Stable Media Library fallbacks. Keeping these behind the public media route
 * gives SiteImage responsive WebP derivatives and shared immutable caching.
 */
export const MEDIA_ASSETS = {
  elephant: "/api/public/media/cms/fallback-elephant.webp",
  gallery1: "/api/public/media/cms/fallback-gallery-1.webp",
  gallery2: "/api/public/media/cms/fallback-gallery-2.webp",
  gallery3: "/api/public/media/cms/fallback-gallery-3.webp",
  gallery4: "/api/public/media/cms/fallback-gallery-4.webp",
  gallery5: "/api/public/media/cms/fallback-gallery-5.webp",
  gallery6: "/api/public/media/cms/fallback-gallery-6.webp",
  gallery7: "/api/public/media/cms/fallback-gallery-7.webp",
  heroBaobab: "/api/public/media/cms/fallback-hero-baobab.webp",
  journalBaobab: "/api/public/media/cms/fallback-journal-baobab.webp",
  journalLion: "/api/public/media/cms/fallback-journal-lion.webp",
  journalLodge: "/api/public/media/cms/fallback-journal-lodge.webp",
  kenyaDestinationsMap: "/api/public/media/cms/fallback-kenya-destinations-map.webp",
  lodgeTent: "/api/public/media/cms/fallback-lodge-tent.webp",
} as const;

export const ABSOLUTE_MEDIA_ASSETS = {
  heroBaobab:
    "https://thebaobabcollective.co.uk/api/public/media/cms/fallback-hero-baobab.webp",
} as const;