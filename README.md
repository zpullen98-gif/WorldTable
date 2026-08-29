# The World Table

An offline-first culinary field guide: **970 recipes**, a **479-term chef's
lexicon**, **103 technique pages**, pantry matching and a ten-semester path of
study. Installable, fully static, no server anywhere.

**→ [zpullen98-gif.github.io/WorldTable](https://zpullen98-gif.github.io/WorldTable/)**

Open it on a phone, add it to your home screen, and it works on a plane.

---

## What's in it

970 recipes across 94 chapters: 31 world cuisines, all 52 US states, and 11
thematic atlases from the Dessert Atlas to The Saucier. Alongside them:

- **The Chef's Lexicon**: 479 terms with flashcards and a quiz
- **The Techniques**: 103 skills, each listing every dish in the guide that
  demonstrates it, with the Lexicon's own definition of the skill
- **The standard**: for the 45 dishes of the Path of Study, what a correct
  plate looks like at the pass: three to five marks a cook can actually check,
  and the commonest way the dish goes wrong. The guide teaches you to make a
  dish; this is how you know you got it right.
- **Pantry Match**: what you can cook from 177 ingredients, seasonally aware
- **The Path of Study**: ten semesters, in teaching order, tracking what you
  have actually cooked and which skills that has drilled
- **Cook mode**: step-by-step, timers parsed from the method text, screen kept
  awake
- **The menu worksheet**: a checkable shopping list, a service timeline, a
  printable guest menu, and session export/import
- **The Family Chapter**: your own recipes, first-class alongside the guide's

Scale any recipe, convert its units, pin it, annotate it. All of it offline, all
of it persistent.

## The interesting part

This is a complete rewrite of a 1.5MB single-file HTML original, which stays in
the repo as `reference/world-table-v1.html`, committed byte-identical and
pinned in `.gitattributes` so git can never rewrite it. It is the only source of
truth for content.

```
reference/world-table-v1.html
  -> tools/extract.mjs      acorn AST-slice + vm: 15 inline JS literals out
  -> tools/build-data.mjs   + tools/derive/*: everything computed once
  -> the app imports only the derived JSON
```

**Every regex that used to run at render time runs at build time now.** Diet
flags, seasonality, equipment, flavour, cost, pairings, technique tags, lexicon
cross-links, the search index: all computed once and committed as reviewable
JSON. Tuning a keyword table shows up as a diff you can read, instead of a
behaviour change nobody can see.

The build refuses to emit data that fails its own gates: a technique keyword
matching nothing, a cross-link concentration above 8% in any one chapter, a
recipe marked vegetarian that carries an animal product with no stated
alternative.

## Running it

```bash
npm install
npm run dev          # localhost:5173
npm run build        # 1,178 static pages
npm run preview      # serve the build with real-host semantics
```

| | |
|---|---|
| `npm test` | 73 unit tests |
| `npm run verify:data` | 38 checks: extraction round-trip, char-sums, slug uniqueness, referential integrity |
| `npm run verify:build` | 18 checks against the built site |
| `npm run test:e2e` | 27 Playwright specs: offline in real Chromium, axe, print, and a parity harness |
| `npm run report:tech` | technique coverage ledger |

The parity harness is the one worth knowing about: it loads the archived
original in a browser, runs *its own* `costFor` / `flavorFor` / `pairingFull`
as an oracle across all 970 recipes, and asserts the rewrite agrees.

## Built with

SvelteKit 2 · Svelte 5 runes · TypeScript · `adapter-static` · `@vite-pwa/sveltekit`

Four runtime dependencies: `minisearch`, `idb-keyval`, and two self-hosted font
families. No CDN, no analytics, no third-party request of any kind: a build
check enforces it.

Deploys itself to GitHub Pages on every push to `master`
(`.github/workflows/pages.yml`), gated behind the data verification, the unit
tests and the build checks.

## Architecture notes

`CLAUDE.md` documents the conventions in depth, including the decisions that
look like bugs and are not: why all 970 cards render as real DOM, why the
offline shell ships under a third filename, why search options live in exactly
one file, and what breaks if you move derivation back into a component.
