# Teaching folios, September 2026

The current Plates edition pairs twenty generated specimen illustrations with twenty independently authored teaching guides. Each illustration shows six numbered subjects in reading order, two columns by three rows. Labels and facts are accessible HTML, not generated lettering. The original twenty posters and their 463 transcribed entries remain in the collapsed Original poster archive, including historical corrections and uncertain claims. The archive is not the source of quiz answers.

## Content and illustration contract

- `tools/derive/plates/teaching.json` owns each lesson title, introduction, scope, six subject descriptions/facts/distinctions and primary source links. Subject array order must match illustration numerals 1–6.
- `tools/derive/plates/<slug>.json` remains the original transcription. Preserve it as historical material; do not silently rewrite it to describe a different drawing.
- `tools/derive/plates.mjs` validates both layers, requires all images, and emits `src/lib/data/plates.json`. Run `npm run build:data` after authored changes and commit the result.
- Quiz questions use only reviewed subject summaries. They never draw from archival facts, groups or correction records. The quiz records no progress.
- These are culinary study illustrations, not field-identification keys, scaled specimens, exact growing calendars or complete butchery diagrams. The individual guides explain their scope.

## Artwork

Selected files: `static/plates/<slug>-<revision>.webp` and `<slug>-<revision>.thumb.webp`. The first reviewed edition is v2. Atlantic fish, Pacific fish, charcuterie, Midwest fruits, Northeastern fruits and Southwestern vegetables now use the individually reviewed v3 editions; the other fourteen remain v2. The earlier illustrations remain intact, and original posters are byte-preserved at `static/plates/archive/<slug>.webp`. `tools/derive/plates/images.json` records each current revision, dimensions and exact encoded sizes.

Each image manifest entry may also have a `revision` such as `"v3"`. An omitted revision means `"v2"`, so existing files and URLs stay unchanged. Advance only the reviewed folio's entry and add both matching full and thumbnail files; the builder rejects an invalid revision or a missing selected file instead of falling back to an older picture. Keep earlier versioned assets and original archives intact. The emitted data and browser tests read the selected paths rather than assuming every folio has the same edition.

The new originals were created with the built-in image-generation tool and visually reviewed. Exact generation/revision prompts and PNG masters are in the owner's Codex output folder, `outputs/world-table-teaching/`. That external folder is not a repository build dependency. The production files are all committed here.

House direction: a fine forest-green and antique-gold frame around warm ivory paper, restrained leaf/compass ornament, lifelike natural-history studies, soft neutral light and true food colors. Use the approved Northwest fruits folio as the layout reference. Keep only numerals inside the artwork. Preserve a consistent two-column/three-row composition. Do not apply a golden color cast to ingredients or add invented maps and anatomy.

Image QA must inspect each numbered specimen against the guide, not merely the generator prompt. The first reviewed edition required corrections to maitake undersides, cheese interiors and blue-crab limbs. The production PNGs are 1024×1536; WebP full images use quality 83/method 6, thumbnails fit within 360×540 using Lanczos and quality 78/method 6. Total selected full images: 3,998,210 bytes; thumbnails: 563,038 bytes. Encoding changes format/size only, never illustration content.

The full image and its zoom view share alternative text made from the lesson title, reading order, numbered subject names and authored `subjects[].image` visual descriptions. Review those descriptions alongside any replacement artwork. Wall thumbnails remain decorative beside their visible lesson titles.

The decorative World Table masthead keeps its 1536×1024 source and uses `static/house/world-table-library-v1.phone.webp` on viewports up to 599px. That 768×512 rendition is a proportional Lanczos resize, WebP quality 83/method 6, with no crop or composition changes. Existing CSS retains its home and compact study framing. First-visit offline warming follows the picture's loaded `currentSrc`, so a phone does not also download the desktop rendition.

## Offline and future revisions

Every art revision must use new filenames and update the builder paths, manifest and tests together. The `plates-v1` runtime cache is CacheFirst; overwriting an existing filename would conceal replacements from installed readers. Keep all files under `plates/`, including the archive, out of precache. They load on demand. The layout warms only loaded images when this wing's service worker claims the first visit, so pre-claim artwork can also be read offline. Unopened lazy pictures and archives must not be fetched by that process.

## Kitchen companion studies, October 2026

`src/lib/teaching-folios.ts` is the independently authored nine-entry manifest. The first collection covers the Brennan’s sauce comparison, poached egg, Louisiana larder, roux ladder and hollandaise. The second adds French herbs, searing, resting/slicing and classical knife cuts. It records numbered keys, scope notes, links to the existing lessons and exact dish/technique identities. It does not extend the twenty-plate archive, write HouseDish fields, change quiz answers or record progress. House-context matching is limited to Brennan’s stable house ID; general technique and Plates-library access needs no imported house.

`TeachingFolio.svelte` presents each study as a closed native disclosure, with text in the offline HTML and no image request until opened. `PlateIllustration.svelte` supplies the shared zoom/focus/failure handling. Every instance has unique dialog labels. The companion section sits below the existing menu rows, so it does not displace the first dishes on phones. The collection is available below the reference Plates; its deep links open the requested disclosure.

`TeachingFolioCollection.svelte` groups the nine studies into Ingredients, Knife work and heat, and Sauces and eggs on both the Plates page and the Brennan’s study menu. A small link near the top of the Plates page jumps directly to the collection. Grouping never opens or downloads a picture. New guides include a closed sources disclosure alongside the readable key.

### Second collection: review boundaries and sources

The four approved production image pairs use the brief's immutable `-v1` paths: `plates/french-herbs`, `standards/searing-standard`, `standards/resting-slicing-standard` and `plates/knife-cuts`. Portrait originals are 1024×1536 and landscape originals 1536×1024. The PNG masters and exact encoding metadata remain in the owner's `outputs/training-collection-02/` folder. Review confirmed the six herb distinctions, the separate crust/interior comparison, cross-cut versus long fibres, and the knife-cut shape progression. Total shipped artwork is now 90 files within the existing 96-entry runtime-cache limit.

- **French herbs (T02):** the first four specimens are the classic fines herbes quartet; thyme and rosemary are contrasts, not additional blend ingredients. The key compares known kitchen herbs and does not claim to identify wild plants. The [RHS herb guide](https://www.rhs.org.uk/herbs/growing), [RHS chives guide](https://www.rhs.org.uk/herbs/chives/grow-your-own) and [University of Nevada, Reno culinary-herb guide](https://extension.unr.edu/publication.aspx?PubID=2755) support the leaf/flavour distinctions and blend. Herb links on house cards follow named parsley, fines herbes or the béarnaise family in the current pack; no current plating is asserted.
- **Searing (T03):** wet, patchy browning and a thick grey band are separately described observations. The illustration cannot establish one cause, and pink paint cannot establish a temperature. [Rouxbe’s searing lesson](https://shop.rouxbe.com/cooking-school/searing) distinguishes searing from cooking the interior and rejects the seal-in-juices myth. Its exact technique and Seared card link to this study; no unconfirmed house cooking method is assigned.
- **Resting/slicing (T04):** the useful visible distinction is shorter cross-cut fibres versus long fibres in strips. [ICE’s grain-and-slicing lesson](https://www.ice.edu/blog/how-find-grain-and-slice-steak-chef) supports the grain direction and a rest before slicing. Juice-pool size alone is not a rest-time diagnosis. Contextual dish links are restricted to the two hanger-steak dishes; the picture does not specify their actual doneness or service arrangement.
- **Knife cuts (T06):** the dimensions use this Table’s existing lesson: 3 mm brunoise, 6 mm small dice, 12 mm medium dice, 3 × 3 × 50 mm julienne and 6 × 6 × 60 mm batonnet. [Rouxbe’s knife-cut chart](https://rouxbe.com/tips-techniques/495-types-of-knife-cuts) illustrates why school conventions need stating: its batonnet is 2 inches long. The app explicitly says the illustration is a shape/relative-size comparison, not an on-screen ruler. No archive or quiz text changes.

Companion images use immutable versioned paths in `static/house/brennans/`, `static/standards/` and `static/plates/`. Full images and thumbnails stay out of precache. Their loaded images use the existing `plates-v1` on-demand cache, now holding up to 96 entries to accommodate the companion studies and six revised folios without renaming readers’ cache. Both first-visit warm-up and Workbox accept the new roots. The independent manifest and integration tests verify links and scope; inspect every generated subject against its key before release.

## Verification and publication

Run source/type checks, unit tests, extraction checks, reproducible derivation, production build and build verification. Browser checks cover twenty pages at 320px, day/night styles, portrait images, keyboard zoom/close/focus, archive retention, quiz resets and offline artwork. CI runs the Playwright regressions, including the first-visit service-worker race.

The suite copy at OutsideOfTime/table is generated. Build with BASE_PATH=/table from a committed source revision, copy the complete build, run the suite shared-script injector and the normal publish script, inspect its output, and publish only the separate _publish repository. Never push the workshop or its private notes. Keep the standalone master deployment policy unchanged.
