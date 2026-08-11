# The World Table

A SvelteKit rewrite of a 1.5MB single-file culinary field guide: 970 recipes
across 94 chapters, a 479-term chef's lexicon, pantry matching, a ten-semester
path of study, and a menu-planning worksheet. Static build, installable PWA,
fully offline, no server.

## Commands

```bash
npm run dev            # localhost:5173
npm run build          # static site -> build/  (~1,070 HTML pages, ~25s)
npm run preview        # serve build/ locally
npm test               # vitest
npm run check          # svelte-check

npm run extract        # re-lift the data literals out of reference/world-table-v1.html
npm run verify:data    # 38 checks: counts, round-trip, char-sum, slugs, refs
npm run build:data     # derive + emit src/lib/data/*.json  (gated, idempotent)
npm run verify:build   # 18 checks against build/
npm run build:pages    # the GitHub Pages build (sets BASE_PATH correctly)
npm run icons          # regenerate PWA icons
npm run report:tech    # technique coverage ledger (--labels, or a chapter name)
```

Deploy to GitHub Pages with `npm run build:pages` — never the raw env prefix.
On Windows cmd it is a syntax error, and in Git Bash MSYS path conversion
rewrites the leading slash to `C:/Program Files/Git/WorldTable`, which SvelteKit
rejects with a message that never mentions your shell. CI does it for you
(.github/workflows/pages.yml); `.nojekyll` is written by postbuild because
Jekyll would otherwise strip `_app/` and serve a blank page.

## The data pipeline

`reference/world-table-v1.html` is the archived original and the **only** source
of truth for content. It is committed byte-identical and pinned `-text` in
`.gitattributes` so git never rewrites its line endings. Do not edit it.

```
reference/world-table-v1.html
  -> tools/extract.mjs        acorn AST-slice + vm, 15 literals -> src/lib/data/raw/*.json
  -> tools/build-data.mjs     + tools/derive/* -> src/lib/data/*.json  (committed)
  -> the app imports only the derived JSON
```

**Every regex that used to run at render time runs at build time now.** Tuning a
keyword table shows up as a reviewable `git diff` over `recipes.index.json`
rather than as a behaviour change nobody can see. Do not move derivation back
into components.

`src/lib/data/overrides.json` merges last and is the single escape hatch. Every
entry needs a written `reason`; if you can't write one, the fix belongs in the
keyword tables.

### Gotchas that already bit once

- **Realm-safe type checks.** Values from `vm.runInNewContext` carry that realm's
  prototypes. `instanceof RegExp` is false for all of them — it silently
  serialized 31 EQUIP rules and 17 NOTE_DEFS to `{}`. Use
  `Object.prototype.toString.call(v)`.
- **Slugs are chapter-qualified on collision.** "Bun Thit Nuong" (Vietnamese) and
  "Bún Thịt Nướng" (Lunch Atlas) are different recipes that fold to the same
  slug. *Both* get qualified, never just the second one, so slugs depend on the
  set of recipes and not on their array order.
- **Everything user-facing is keyed by slug, never array index.** The original
  keyed the menu and notes by index, so adding one family recipe repointed every
  saved reference.
- **`vegetarian` is authored, `vegetarianStrict` is derived.** The corpus is
  inconsistent about "pork (or shiitake for veg)" constructions. The build gates
  only fail on unambiguous errors; see the long note in `tools/derive/diet.mjs`.

## Two bugs fixed by the architecture — do not "re-fix" them

The original bound `addEventListener` to function *values* that were later
reassigned, so two features silently degraded on first interaction:

- **L2506** — typing in the lexicon search stripped every recipe cross-link.
- **L2806** — typing in the pantry filter destroyed the hemisphere toggle.

`$derived` recomputes from state; there is no reference to go stale. Both sites
carry a comment saying so. If you find yourself adding a listener that calls a
render function by name, stop.

## Conventions

- Prerendered pages must not read `url.searchParams` — one file on disk serves
  every query string. Seed filter state from the URL in `onMount`, not reactively
  (the URL write-back effect would chase it).
- The grid ships all 970 DOM nodes with `content-visibility: auto`. No
  virtualisation: it breaks Ctrl+F, print, and the a11y tree for a problem that
  measurement says we don't have.
- Prerendering and precaching are separate decisions. The service worker caches
  the shell + data + fonts (~1 MB gzip) and rebuilds pages from the
  `shell.html` navigation fallback. Never precache the 1,070 HTML files.
- Day/night are full token sets in `src/lib/styles/tokens.css`, not overrides on
  a body class. Service is read synchronously in `src/app.html` before first
  paint — that is the only reason preferences live in localStorage while
  everything else is in IndexedDB.
- One `@media print` block, in `src/lib/styles/print.css`. The original had four
  scattered ones that disagreed.
- Search options live in `src/lib/search-config.mjs`, imported by BOTH the
  build-time indexer and the runtime loader. `MiniSearch.loadJS` silently
  corrupts every lookup if its options drift from what the index was serialized
  with — never fork them.

## The Family Chapter — how user recipes work

Family recipes carry the full Recipe shape (summary + detail in one object) and
live in IndexedDB, never in the static data. Consequences worth knowing:

- Their pages are `/family/[slug]` with `ssr = false` — there is nothing to
  prerender and no server holding their data. Do NOT move family fallback into
  the prerendered `/recipe/[slug]` route: its server-side 404 fires before any
  browser-only lookup can run (this was tried; it broke direct loads in dev).
- `recipeHref()` in data.ts is the only place that knows about the URL split.
  Generate recipe links through it, never by hand.
- `familySlug()` in authoring.ts refuses collisions with guide slugs so that
  slug-keyed menu/notes resolution can never grab the wrong dish.
- They are not in the static search index; under a query the browser matches
  them by the substring predicate and appends them after ranked results.

## The technique spine — how skills map to recipes

Two systems existed and never met. `raw/TECH.json` tagged recipes by keyword but
was written around DISHES (Khachapuri shaping, Pierogi, Arepas), so it lit up
401 of 970 and rendered nowhere but a YouTube link. Meanwhile the Lexicon holds
45 hand-written technique definitions that reached almost nothing, because
`crosslinks.mjs` caps a term at three recipes — "Braising & Stewing" linked to
ONE recipe while 27 braise.

`tools/derive/technique-table.mjs` marries them:

- **SUPPLEMENT** appends the foundations the original omitted (searing,
  sweating, steaming, blanching, proofing, rendering…). The raw table is deep
  round-trip gated by verify:data, so it is never edited — improvements append.
- **LEXICON_ANCHOR** maps a technique label to the Lexicon term that defines it.
  It is hand-authored, not string-matched: "Tempering a custard" and "Tempering
  chocolate" are one word apart and anchor to different halves of one entry.
- `techniques.json` carries each label with the COMPLETE recipe list and a copy
  of the anchored definition. Pages are `/technique/[slug]`, prerendered.

Coverage is 824 of 970 across 103 live labels, 76 anchored.

The Path of Study joins the same way. `study.json` gains `skills` — derived from
each semester's dishes, never authored, weighted by how many of them drill it —
and `techniques.json` gains `semesters` for the reverse link. The weight is the
point: the semester titled "The Braise" drills searing (4 dishes) above braising
(2), because a braise IS sear-then-simmer, and the curriculum could not say so
before. 48 of the 103 skills are taught somewhere on the Path; the other 55 are
reachable only by browsing. A semester skill pointing at no technique page fails
the build.

**Techniques derive from `linkBlobs`, not `blobs`** — the note-free text, same
as cross-links and for the same reason. Measurement before the change: 111 tags
existed only because of note prose, 62 recipes were tagged solely by their
margin commentary, and the 320-note backfill had silently minted 50 tags. A
recipe braises because its method braises. Removing the note also exposed four
entries (Velveting, Mole, Tempering chocolate, Rolling dolmas) that had only
ever fired on commentary.

`deriveFilms` deliberately still uses the full blob and the ORIGINAL table. Film
links are twelve curated canon URLs plus searches, not a claim about what a
recipe demonstrates; re-cutting them would churn 970 link lists for nothing.

Gates in build-data: a SUPPLEMENT entry tagging nothing fails the build (a
keyword the corpus never says — the near-miss that left "Caramelizing onions"
dead against a corpus that writes "Caramelize onion"). Entries over 150 recipes
fail as too broad to distinguish. Anchor keys or values that resolve to nothing
fail. The original's own dead entries are reported, not failed: Gnocchi and
Boiling bagels never fire because this corpus has no gnocchi and no bagel.

`npm run report:tech` is the ledger; `--labels` gives per-entry counts, a
chapter name dumps its untagged recipes as working material.

## Known remaining work

- None planned. The content backfill completed 2026-08-08: all 320 thin "from
  the pass" notes rewritten in src/lib/data/notes.json (the overlay keeps the
  raw extraction byte-identical to the archived original). `npm run
  report:notes` is the ledger and reads zero. New authoring goes through the
  same overlay; the parity harness exempts overlaid slugs automatically.
- 146 recipes still carry no technique tag, spread thin (no chapter has more
  than five). Some are correct — a three-ingredient drink demonstrates nothing.
  `npm run report:tech "<chapter>"` is the working material if the table is
  widened further.

## Testing

`npm test` (34 unit) · `npm run test:e2e` (34 Playwright: regressions named for
the original's line numbers, offline in real Chromium, axe, print PDFs, and the
parity harness that runs the archived original against our build output).

Hard-won rules the suites encode — do not relearn these:

- **e2e runs against `tools/serve.mjs`, never `vite preview`.** SvelteKit's
  preview middleware serves only route-manifest files: the precached offline
  shell 404s (whatever it is named — 200.html and fallback.html both), the SW
  install fails, and the browser silently discards the registration. serve.mjs
  behaves like the real static host. `npm run preview` uses it too.
- **The offline shell ships as `shell.html`**, a postbuild copy of the adapter's
  fallback, because servers treat the configured fallback file as internal
  config. `404.html` is a third copy, for GitHub Pages.
- **Never reuse a running preview server across a rebuild** — sirv-style
  servers manifest files at startup and 404 new chunk hashes. Playwright always
  starts its own (`reuseExistingServer: false`).
- **Wait for `html[data-hydrated]`** (the layout stamps it from an effect)
  before interacting: prerendered pages look alive long before listeners attach.
- **`paths.relative: false` is load-bearing** — without it the SW registers
  './sw.js', which 404s from any deep link.
- **`navigateFallback` must be RELATIVE (`'shell.html'`).** Workbox resolves
  precache keys against the worker's own location, so under a base path a
  root-absolute `'/shell.html'` points at the domain root, which was never
  precached; `createHandlerBoundToURL` throws `non-precached-url`. The throw
  lands AFTER `precacheAndRoute` and BEFORE `registerRoute(navigationRoute)`,
  which is why this hid so well: the install listener is already attached, all
  75 entries still cache, and only offline NAVIGATION is dead. Every e2e test
  stayed green for months because localhost:4173 serves from the root, where
  both spellings resolve identically. Only a based build can see it, which is
  why verify:build now resolves the fallback against `BASE_PATH` and asserts
  precache membership rather than grepping for the string.
