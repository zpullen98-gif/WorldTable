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
npm run verify:build   # 12 checks against build/
npm run icons          # regenerate PWA icons
```

Deploy to GitHub Pages with `BASE_PATH=/WorldTable npm run build`.

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
  `200.html` navigation fallback. Never precache the 1,070 HTML files.
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

## Known remaining work

- **Content backfill**: 320 of 970 "from the pass" notes are under 180 chars;
  149 are under 120. They cluster in the marquee world-cuisine chapters written
  first (Italian, French, Japanese, Chinese, Mexican — 10 of 10 each). This is
  authoring, not engineering. `noteChars` is on every record.
- **Runtime offline** is unverified — the embedded dev browser never installs a
  service worker. Needs a check in a real browser.
- Cook mode, the quiz, family-recipe entry, and the printable guest menu from
  the original are not ported yet.
