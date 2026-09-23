# Clean and optimise site imagery

## Goal
Keep all destination content, remove every broken image reference, and move the remaining bundled fallback photography into the Media Library as WebP so the shared image system can request appropriately sized versions.

## Changes

### 1. Replace broken CMS image references
- Cross-check every image field in Adventures, Destinations, Journeys, Lodges, Journal, Testimonials, and page settings against the actual files in the Media Library.
- Replace the ten confirmed missing destination image links with matching, valid images rather than deleting the destination records.
- Use each destination’s existing curated fallback image as the source when no destination-specific Media Library image exists.
- Re-run the cross-check after replacement and confirm there are no remaining CMS image URLs pointing to absent files.

### 2. Move bundled fallback images into the Media Library
- Re-encode the remaining bundled JPEG photography to WebP at visually equivalent quality.
- Include homepage, Adventures, Destinations, Lodges, Testimonials, and shared section fallbacks; also move the bundled Kenya map through the same Media Library delivery path.
- Upload the WebP files to the Media Library using stable, unique filenames.
- Remove superseded bundled raster files after all references have moved.

### 3. Route every fallback through the shared image pipeline
- Replace static asset imports with central Media Library URLs.
- Keep `SiteImage` as the single rendering path for these photos.
- Preserve the current design, crops, focal points, lazy-loading choices, eager hero loading, and accessible alternative text.
- Ensure the Media Library endpoint produces responsive width candidates, WebP delivery, immutable caching, and watermark behavior where configured.
- Correct homepage social-preview metadata so it never advertises a relative bundled image URL.

### 4. Verify
- Confirm every referenced Media Library object exists.
- Check Home, Adventures, Destinations, Partner Lodges, Testimonials, Journal, Gallery, and Contact on desktop and mobile.
- Verify no broken images, no fallback flash, responsive `srcset` values, and successful resized responses from the media endpoint.
- Run focused tests and confirm the latest production build passes.

## Technical details
- The Media Library is backed directly by stored objects, not a separate media-record table. The cleanup therefore updates broken CMS content references; it does not remove valid files merely because they are duplicated.
- Simply renaming a bundled file to `.webp` does not enable server-side resizing. Images must be uploaded and served through `/api/public/media/...`, which is what `SiteImage` recognizes for responsive derivatives.
- Current audit found ten missing destination image references: Amboseli, Lake Naivasha, Lamu, Maasai Mara, Malindi, Mombasa, Mt. Kenya, Samburu, Tsavo East, and Tsavo West.
