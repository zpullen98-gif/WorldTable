# The World Table — session handoff

Written 28 Aug 2026. **Every number below was measured, not remembered** — run
the tool. Where a document and a file disagree, the file wins.

`CLAUDE.md` is the architectural reference and is far more detailed. Read it
second; read this first.

---

## What this is

A SvelteKit rewrite of a 1.5MB single-file culinary field guide, now a
**training app for professional kitchens**. One of five wings in the "Outside Of
Time" subscription monorepo (`C:\Users\zpull\OutsideOfTime`), sold B2B to venues
at **$49.99/month, unlimited staff, one shared login**.

**Audience, decided by the owner: chefs, culinary students, AND servers.**

## Repo state

| | |
|---|---|
| WorldTable | branch `dish-standards`, **28 commits unpushed** (remote `origin/master`), tree clean |
| OutsideOfTime | branch `main`, HEAD `53b31569`, tree clean, **no git remote — never pushed** |
| Tests | **447 unit** (30 files) · **80 e2e** — **the whole suite is green** |
| Gates | `build:data` all pass · `verify:build` **18/18** |
| Precache | 1.43 MB gzipped against a 2.00 MB cap |
| Routes | 27 · Derived JSON | 21 files |

## The corpus

970 recipes · 94 chapters · 479 lexicon terms · 103 techniques · 45 dish
standards · 26 technique standards · 355 marks · 6 calibration ladders · 176
front-of-house terms · 27 service modules · 186 drill cards.

**683 of 970 recipes are assessable** — 45 against a standard of their own, 638
against the techniques they exercise. 287 carry neither.

---

## Architecture

`reference/world-table-v1.html` is the archived original and the **only** source
of truth for content. Everything derives ONCE at build time into committed JSON:

```
reference/world-table-v1.html
  -> tools/extract.mjs      AST-slice + vm -> src/lib/data/raw/*.json
  -> tools/build-data.mjs   + tools/derive/* -> src/lib/data/*.json  (committed)
  -> the app imports only the derived JSON
```

**Never move derivation into a component.** A regex tweak must land as a
reviewable diff over JSON, not as a behaviour change nobody can see.

### The two kinds of work this repo does

1. **Reachability** — the guide already contains the material and nobody can
   reach it, because `crosslinks.mjs` caps a lexicon term at three recipes.
   Instances: the technique spine, the palate repair table, menu economics, food
   safety, the restaurant-finance curriculum, the 176 FOH terms.
2. **Authored + gated** — the guide never said it, so it is written and held
   down by gates. `standards.mjs`, `technique-standards.mjs`, `calibration.mjs`,
   the technique table's `SUPPLEMENT`.

Do not assume the next job is the first kind.

### The gate discipline

Every derive module is gated **in both directions**: forward (the evidence must
still be in the guide) and **reverse** (a thing the guide states that nothing
carries fails the build). Any number shipped must be **read back out of the prose
that justifies it**.

**A gate that cannot fail is worth nothing.** Prove every one by breaking
something and reading the message. This session found two gates that could never
have fired — one sat above `const problems = []`, so every `problems.push` was a
ReferenceError that only threw when a problem was *found*; with none, the build
passed green.

### Where state lives — the line that matters

- **`session::<profileId>`** (per person): cooked log, drill log, calibration
  log, notes, pantry, family recipes, the plan run.
- **`house`** (device-wide, NEVER namespaced): the menu, preps, prep counts, the
  86 board, dish costings, the tax setting.

**A cooked mark is a fact about a PERSON. A menu, what is 86'd and what a plate
costs are facts about the VENUE.** Precedent: `wt.timers.v1` carries no profile,
because a pot on the heat belongs to the room.

`persistence/state.ts` is deliberately a **leaf module** — db.ts and
migrations.ts both import it precisely so they never import each other. Do not
import a value back into it.

---

## Decisions not to reverse

- **Certified stat keys stay unprefixed**; question ids are frozen; minting is
  additive. A changed id orphans progress.
- **Mark ids are minted and ledgered** (`mark-ids.ledger.json`). A rename or a
  drop fails the build; an add is silent; editing the wording is free.
- **`matchSA` short-circuits on the model answer** — do not tidy it away.
- **A false reject is worse than a scoring leak.**
- **NO per-recipe hazard flags, ever.** Five rules were measured, zero of fifteen
  adversarial verdicts survived. `assertNoRecipes()` keeps this refused. **Do not
  revive by tuning a regex** — a corrected rule returns ZERO hits.
- **No allergen-exclusion filter**, ever. "Carries shellfish" costs ten seconds
  when wrong; "shellfish free" over 7 of the statutory 14 is a clearance claim
  the derivation cannot support.
- **The guest card never prints allergen marks.** Those are a kitchen record;
  printed, they read as a guarantee. A fixed line invites the conversation.
- **The coverage board shows coverage, not scores** — bands, never percentages,
  and never a count of what is left.
- **No per-person number a manager reads** — waste by cook, step times by cook.
  Each is a disciplinary instrument, and the data goes dishonest in a fortnight.
- **Chef and student are not the same role.** A student has a denominator; a
  chef's work has no end state.
- **No CSV importer, ever.** The `.wtjson` is the single portability contract
  with tested merge semantics.
- **Do not build**: video, leaderboards, certification, more recipes, HACCP or
  temperature logs (a single-device, freely-editable record would be adopted as
  compliance evidence while being worthless as evidence), reference plate photos
  (a photograph cannot say "the centre slumps once and stops"; the 355 marks can).

## Gotchas that cost real time

- **Clear the service worker before verifying.** When a new derived JSON file
  appears, **restart the dev server** — a stale module graph gives a 500 that
  looks like a code error.
- **A `shared/*` edit is a ritual.** For CSS specifically: `codex` and `ledger`
  precache `oot-home.css` and match with `ignoreSearch: true`, so the `?v=` is
  discarded and their SW cache names must be bumped. `pass` has no SW. `light`
  and `almanac` do not reference it at all. The Table runtime-caches `/shared/`.
- **Bash heredocs eat backticks and `$`.** Python patch scripts containing them
  must be written to a FILE and run, never piped through `bash -c`. This bit
  twice this session, once executing the Windows `at` command into a document.
- **`verify-build.mjs` string-scans `MODES`** — keep `OWNS` a separate const.
- **Five class names are a published paywall contract**: `ol.semesters`,
  `li.semester`, `.lexcard`, `.def`, `.flash`. `navigation.test.ts` holds the line.
- **`oot-locks.js` does a singular `querySelector('article.sheet')`** — one sheet
  element per page.
- **The e2e suite is structurally blind to a dead route** — `serve.mjs` answers
  any unknown path with `shell.html` at 200. Only `verify:build` sees it.
- **Guards fire on legitimate change** — confirm the parser agrees with reality,
  then update. Do not edit a gate without reading it.

---

## What was built this session

A six-lens professional review (chef de cuisine, kitchen manager, chef patron,
compliance, educator, service director) was run against the codebase and
adversarially verified. Its ranked list was then worked through 1–12.

**Safety and correctness**

1. **The allergen truth pass.** `lineIsEscaped()` discards a whole ingredient
   line, and `containsFish`/`containsShellfish` read from the escaped set — so
   "chorizo optional" threw away the shrimp beside it, and a whole fried tilapia
   shipped `containsFish: false` **and a Vegan badge**. Both flags now follow the
   allergen policy the file already stated (dairy and egg were moved for the same
   reason when panna cotta shipped vegan over "500ml cream"). +16 fish, +12
   shellfish, 16 false vegan badges withdrawn, **zero change to any vegetarian
   flag**. `/menu` and `/menu/quiz` render three states, always.
2. **The house record could be wiped by a rollback.** `hydrate()` had no `else`,
   so a record from a newer build left `#r` as `EMPTY_HOUSE` and the next write
   put it over the top. Reproduced (`schemaVersion: 99` → two taps → `dishes: []`)
   and fixed: a newer record is **blocked** — not read, never written over.
3. **The coverage board's manager gate was copy, not code.** `people` was built
   over the whole roster while a paragraph told a commis they were seeing only
   their own coverage. The roster is narrowed **before any session is read** now.
4. **The shared contrast defect** — three defects wearing one test failure:
   opacity stacked on an already-muted token, an accent too light to be text
   (3.53:1 where AA wants 4.5), and an entrance animation fading text through
   every failing ratio on the way in.

**Assessment**

5. **26 technique standards**, covering every technique the corpus uses on 25+
   recipes — 638 recipes gained a standard. Only **69 of 103** techniques add any
   coverage; 34 are fully redundant.
6. **Grade the mark, not the plate.** 355 marks carry frozen ledgered ids; the
   pass screen's marks are tappable; the palate fault the cook names is kept
   instead of dying with the dialog.
7. **The calibration bench** — a triangle test, six ladders, six trials a run,
   the app holding the answer.
8. **House dishes are assessable**, and the self-declared tags structurally
   cannot reach `/coverage`.

**Service and money**

9. **The Pass tells the truth** — course firing (everything used to land at
   19:00:00), a real hands sweep against the crew in the room, and a clock that
   survives a walk to the walk-in.
10. **Preps** — cost the demi once. On the worked example the real number is
    **9.30 a portion against a 6.00 guess**.
11. **The prep board** — count the walk-in and the day back-times itself, through
    the same `buildPass`.
12. **Covers by week**, without the migration that would have broken it.
13. **Three money bugs** — tax-inclusive pricing (contribution overstated by 3.00
    and food cost understated 5.5 points on **every** dish), an import banner that
    said "nothing new" before rewriting costings, and a sheet that could not print.
14. **A sheet that adds up** — weighted food cost. On the worked case the mean is
    32% and the weighted figure is **41.2%**.
15. **A timer not attached to a recipe** — `timers.start` had exactly one call
    site in the whole app.

---

## What's left, ranked

1. **The item book.** `unitCost` is stored per line per dish and `editLine`
   patches it in place, so the previous number does not exist anywhere — which
   makes the guide's own advice (*"reprice quarterly against invoice creep;
   menus that sleep bleed"*) structurally impossible to follow. Butter is free
   text on fourteen lines in fourteen dishes.

   Design: `items` keyed by slug with a capped price history, `CostLine.itemSlug?`,
   a datalist that populates itself from what has already been typed so there is
   no master-data chore, resolution to plain CostLines before `plateCost` exactly
   as preps do, and — the part that matters — **history merged by UNION on the
   timestamp**, because newer-wins-whole would discard every price change the
   losing device recorded, which is the one thing the feature exists to keep.
   NEVER mandatory: a one-off truffle stays free text, or a ten-minute costing
   becomes an afternoon of master data and the sheet stops being opened.

   The sentence that IS the feature: *"Butter is used in 14 dishes. 3 have moved
   out of the 25–35% band."*
2. **The waste log** — valued from `plateCost`, five reason codes, rolled up
   venue-wide and **never per person**.
3. **More technique standards.** The threshold IS the worklist: lower
   `TECHNIQUE_GATE_MIN_RECIPES`, run `build:data`, and the reverse gate names
   exactly what it wants. 20 asks for 13 more and reaches 745 of 824; 15 asks for
   20 more and reaches 782.
4. **The allergen vocabulary.** 99 of 970 recipes still carry no flag at all.
   `allergens.test.ts` asserts `NOT_SCREENED` stays non-empty, so the day it
   lands the copy is forced to change.
5. **Yield tests.** Zero content, and the costing sheet depends on the number.
6. **Repetition under load.** The Pass computes collisions; that is a drill.
7. **The costing CSV** — one-way door, and see the no-importer rule above.

## Open questions for the owner

- **`oot-pass.js` already ships per-person accuracy % to two other wings**, so
  "coverage, never scores" is inconsistent across the monorepo. Either the Table
  matches the pass, or the pass is overreaching. Product call, not technical.
- **Does the venue's own menu become the centre of gravity?** That is the line
  between "we train your staff on the guide's food" and "on yours".
- **Training app or management app?** Preps, the item book, the week, prime cost
  and a waste log are a second product, bought by the operator rather than the
  chef, competing for the same Service tab.
- **Prime cost is stated three incompatible ways** in the guide (55–60 in the
  entry `economics.mjs` ships, ~60–65 in Costing Time, 55–65 in the pro-forma)
  and the build silently picks one. `sanitation.mjs` surfaces its analogous
  conflict rather than choosing.
- **15 authored-vegetarian recipes now carry a fish or shellfish flag** — dashi,
  Worcestershire, fish sauce. Reported, not gated, because the authored flag is a
  documented human judgement. A Vegetarian badge over a dish containing dashi is
  a live product question.
- **The certification pressure is coming.** A venue will ask for a printable,
  dated training record. This product refuses on grounds worth keeping: nothing
  here is witnessed, dated, signed or tamper-evident.

## BLOCKING DEPLOY

**`table/` in the monorepo is a stale build.** It contains none of this session's
routes. The sync, in PowerShell not Git Bash:

```
$env:BASE_PATH='/table'; npm run build:pages
```

then the scope greps in `README.md:186-205`, copy into `table/`, re-inject
(`node .scripts/inject-oot-bar.mjs` and `--check`). Order is load-bearing.

Versions: shared scripts **v18**, `oot-home.css?v=18`; `codex-v67`,
`ledger-v39`, `firstlight-v45`, `cfl-v84`.

## A note on method

The valuable habits, repeatedly: **measure before building**, **break every gate
to prove it fires**, and **verify in the browser** — several defects this session
were invisible to a green test suite and obvious on screen. When a mutation does
not fire a gate, check whether the mutation or the gate is at fault; twice it was
the mutation. And two tests were found asserting the bug they were meant to
catch.

Assume anything in this document you have not re-run is stale.
