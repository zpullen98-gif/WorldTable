# Teaching folios, September 2026

The current Plates edition pairs twenty generated specimen illustrations with twenty independently authored teaching guides. Each illustration shows six numbered subjects in reading order, two columns by three rows. Labels and facts are accessible HTML, not generated lettering. The original twenty posters and their 463 transcribed entries remain in the collapsed Original poster archive, including historical corrections and uncertain claims. The archive is not the source of quiz answers.

## Content and illustration contract

- `tools/derive/plates/teaching.json` owns each lesson title, introduction, scope, six subject descriptions/facts/distinctions and primary source links. Subject array order must match illustration numerals 1–6.
- `tools/derive/plates/<slug>.json` remains the original transcription. Preserve it as historical material; do not silently rewrite it to describe a different drawing.
- `tools/derive/plates.mjs` validates both layers, requires all images, and emits `src/lib/data/plates.json`. Run `npm run build:data` after authored changes and commit the result.
- Quiz questions use only reviewed subject summaries. They never draw from archival facts, groups or correction records. The quiz records no progress.
- These are culinary study illustrations, not field-identification keys, scaled specimens, exact growing calendars or complete butchery diagrams. The individual guides explain their scope.

## Artwork

Current files: `static/plates/<slug>-v2.webp` and `<slug>-v2.thumb.webp`. The originals are byte-preserved at `static/plates/archive/<slug>.webp`. `tools/derive/plates/images.json` records the current dimensions and exact encoded sizes.

The new originals were created with the built-in image-generation tool and visually reviewed. Exact generation/revision prompts and PNG masters are in the owner's Codex output folder, `outputs/world-table-teaching/`. That external folder is not a repository build dependency. The production files are all committed here.

House direction: a fine forest-green and antique-gold frame around warm ivory paper, restrained leaf/compass ornament, lifelike natural-history studies, soft neutral light and true food colors. Use the approved Northwest fruits folio as the layout reference. Keep only numerals inside the artwork. Preserve a consistent two-column/three-row composition. Do not apply a golden color cast to ingredients or add invented maps and anatomy.

Image QA must inspect each numbered specimen against the guide, not merely the generator prompt. This edition required corrections to maitake undersides, cheese interiors and blue-crab limbs. The production PNGs are 1024×1536; WebP full images use quality 83/method 6, thumbnails fit within 360×540 using Lanczos and quality 78/method 6. Total current full images: 4,187,306 bytes; thumbnails: 562,986 bytes. Encoding changes format/size only, never illustration content.

## Offline and future revisions

Every art revision must use new filenames and update the builder paths, manifest and tests together. The `plates-v1` runtime cache is CacheFirst; overwriting an existing filename would conceal replacements from installed readers. Keep all files under `plates/`, including the archive, out of precache. They load on demand. The layout warms only loaded images when this wing's service worker claims the first visit, so pre-claim artwork can also be read offline. Unopened lazy pictures and archives must not be fetched by that process.

## Verification and publication

Run source/type checks, unit tests, extraction checks, reproducible derivation, production build and build verification. Browser checks cover twenty pages at 320px, day/night styles, portrait images, keyboard zoom/close/focus, archive retention, quiz resets and offline artwork. CI runs the Playwright regressions, including the first-visit service-worker race.

The suite copy at OutsideOfTime/table is generated. Build with BASE_PATH=/table from a committed source revision, copy the complete build, run the suite shared-script injector and the normal publish script, inspect its output, and publish only the separate _publish repository. Never push the workshop or its private notes. Keep the standalone master deployment policy unchanged.
