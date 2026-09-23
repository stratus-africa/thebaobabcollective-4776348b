import { SiteImage } from "@/components/site/SiteImage";
import { Instagram as IgIcon } from "lucide-react";
import { MEDIA_ASSETS } from "@/lib/media-assets";
import { PAGE_DEFAULTS } from "@/lib/page-content.defaults";

import { usePreviewMerge } from "@/lib/preview-overrides";

const defaultImgs = [
  MEDIA_ASSETS.gallery1,
  MEDIA_ASSETS.gallery2,
  MEDIA_ASSETS.gallery3,
  MEDIA_ASSETS.gallery4,
  MEDIA_ASSETS.gallery5,
  MEDIA_ASSETS.gallery6,
  MEDIA_ASSETS.gallery7,
];

type Content = Partial<typeof PAGE_DEFAULTS.home_instagram>;

export function InstagramStrip({ content }: { content?: Content | null } = {}) {
  const base = { ...PAGE_DEFAULTS.home_instagram, ...(content ?? {}) };
  const c: any = usePreviewMerge("home_instagram", base);
  const photos = defaultImgs.map((d, i) => ({
    src: (c[`image_${i + 1}_url`] as string) || null,
    fallback: d,
    caption: (c[`image_${i + 1}_caption`] as string) || "",
  }));
  return (
    <section className="bg-forest text-forest-foreground py-6">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-4 shrink-0">
          <IgIcon className="w-8 h-8" strokeWidth={1.2} />
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase">{c.heading}</p>
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-forest-foreground/80 hover:text-gold"
            >
              {c.handle}
            </a>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {photos.map((p, i) => (
            <a
              key={i}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              title={p.caption || undefined}
              aria-label={p.caption || `Instagram photo ${i + 1}`}
              className="shrink-0 w-20 h-20 md:w-24 md:h-24 overflow-hidden block"
            >
              <SiteImage
                src={p.src}
                fallback={p.fallback}
                alt={p.caption || ""}
                loading="lazy"
                baseWidth={320}
                responsiveWidths={[320]}
                sizes="96px"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
