# The World Table — session handoff

Written 28 Aug 2026, re-measured 29 Aug 2026. **Every number below was
measured, not remembered** — run the tool. Where a document and a file
disagree, the file wins.

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
| WorldTable | branch `dish-standards`, **40 commits unpushed** (remote `origin/master`), tree clean |
| OutsideOfTime | branch `main`, HEAD `1a6f7d5e`, tree clean, **no git remote — never pushed** |
| Tests | **540 unit** (33 files) · **84 e2e** — **the whole suite is green** |
| Gates | `build:data` all pass · `verify:build` **18/18** |
| Precache | 1.44 MB gzipped against a 2.00 MB cap |
| Routes | 28 · Derived JSON | 22 files |
| Deploy | `table/` re-synced for `/menu/waste`. See below. |

## The corpus

970 recipes · 94 chapters · 479 lexicon terms · 103 techniques · 45 dish
standards · 46 technique standards · 455 marks · 6 calibration ladders · 176
front-of-house terms · 27 service modules · 186 drill cards.

**789 of 970 recipes are assessable** — 45 against a standard of their own, 744
against the techniques they exercise. 181 carry neither: 143 have no technique
tag at all, and 38 exercise only techniques too rare here to be worth a
standard. That is the ceiling of this approach, not a backlog.

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
  86 board, dish costings, the tax setting, **the item book**, **the waste log**.

**A cooked mark is a fact about a PERSON. A menu, what is 86'd and what a plate
costs are facts about the VENUE.** Precedent: `wt.timers.v1` carries no profile,
because a pot on the heat belongs to the room.

**House collections travel in a `house` block that is a SIBLING of `data` in the
.wtjson, never inside it.** `mergeSessions` spreads `...incoming` ahead of its
named fields, so anything in `data` is copied into the per-profile record and
persisted there. The menu and its costings sit in `data` only because they have
a session-side legacy being absorbed out of it. `buildExport`'s `house` and
`adoptImport`'s `incoming` are both **required arguments** — an omitted optional
one is exactly how the preps went nowhere for their whole existence.

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
- **Item price history is UNIONED, never newer-wins-whole**, and the union key is
  the whole observation (`at|unitCost|unit`) rather than `at` alone. The losing
  device's book holds price changes the winner never observed; discarding them
  destroys the only thing the book exists to keep, silently, leaving something
  plausible behind. The cap is applied AFTER the union by a total sort, so the
  merge is order-independent and re-importing your own export is a no-op.
- **An item-backed line keeps the dish's own yield; a prep-backed line is locked
  to 100.** Not an inconsistency to tidy into a shared branch: a prep's trim
  already happened inside it, an item price is a raw invoice price, and clearing
  the dish yield would price the menu off gross weight.
- **Zero is not a price.** `addLine` mints a row at `unitCost: 0`, so without the
  guard, naming a fresh row records that the thing is free and every dish
  following the book prices it at nothing.
- **The item book counts only the OVER direction.** Counting `under` made a new
  book shout "1 has moved out of the band" over a dish with one line on its
  sheet — every dish is under the band before it is costed, so the headline was
  loudest when it had least to say. The wording is "is above", not "has moved
  out of": the book cannot show the price move caused the drift.
- **A technique mark may not name an ingredient or a vessel its own technique
  does not name.** The file always said so and nothing enforced it; the test
  that now does found two shipped standards in violation. A mark is read beside
  up to a hundred dishes, so anything true of only some of them is false copy
  on the rest — and the way to catch it is to check the mark against the recipe
  set, never to reason about it.
- **A waste entry names no person, and there is no field for one.** Not a
  display decision — waste-by-cook is a disciplinary instrument and the data
  goes dishonest inside a fortnight, so a field that does not exist cannot be
  surfaced later by somebody who did not read the header. `waste.test.ts` reads
  the source and fails if one appears. `EightySix` carries `by` because saying
  who took the halibut off blames nobody; that is the line.
- **The waste log offers no code for THEFT**, though the guide names it as a
  leak. The guide also answers it — *"systems, not suspicion"*, and the goal is
  *"not a surveillance state"*. Theft is the part of the variance left once the
  log has named everything it can, reached by counting and never by a button.
  Vendor creep is refused too: it is a price that moved, and the item book
  already carries it.
- **A waste value is a SNAPSHOT, and the log is never capped.** Revaluing old
  bins at today's prices would make last quarter move whenever somebody
  reprices an item; capping would delete the year-on-year comparison the log
  exists for. The item book caps because an old price is dead weight — old
  waste is the trend.
- **Linking a line to the book is never mandatory.** A required link turns a
  ten-minute costing into an afternoon of master data and the sheet stops being
  opened, which costs more than the missing history.
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
- **The e2e suite serves `build/` and NEVER rebuilds it.** `playwright.config.ts`
  says so at line 6 and it is still easy to miss: editing a component and
  re-running `test:e2e` tests the previous build. This nearly got a live gate
  written off as dead — a mutation to the layout's `OWNS` table left the nav
  suite green, and it was only green because the change had not been built. It
  fails four ways after `npm run build`. **When a mutation does not fire, check
  whether the thing you mutated is what is running.**
- **A monorepo sync leaves `build/` holding the `/table` build, and both
  `verify:build` and the e2e suite then fail on it.** `verify:build` reports
  "service worker registers with an absolute path — no absolute /sw.js
  registration found", which reads exactly like a `paths.relative` regression and
  is not one: the worker is correctly at `/table/sw.js`. The e2e suite serves the
  same directory and collapses to a handful of passes over several minutes. Run
  a plain `npm run build` to put the default base back before believing either.
  Both were seen in this state on 29 Aug and both are clean after the rebuild.

---

## What was built, most recent first

### 29 Aug — the transport, the item book, the waste log

1. **The preps could not leave the tablet they were typed on** (`1e1ce4f`).
   `adoptImport` has taken a `preps` argument and merged it by id since preps
   shipped, and nothing ever passed one — `houseSnapshot` emitted two fields and
   both call sites called `adopt()` with two arguments. Measured on the worked
   braise: **8.625 a plate at the first site, 5.625 and `complete: false` at the
   second**, the sauce simply absent from the sum. `preps.test.ts` had a case
   named "survives an import that mentions no preps at all", which was every
   import there had ever been. `FORMAT_VERSION` stays at 3 — the criterion for a
   bump is a build that would DESTROY something, and an old build ignores an
   unknown top-level key.
2. **The item book** (`4ac0a47`). `items` keyed by `itemSlugOf(name)` with a
   24-entry price history, `CostLine.itemSlug`, a datalist that fills itself, and
   resolution before `plateCost` exactly as preps do. The sentence, from the
   venue's own numbers: *"Butter — 9.50/kg — +48.4% from 6.40. Used in 2 dishes.
   1 is above the 25–35% band."* Usage follows preps AND the line's name, not
   just the link, or the headline understates worst on the day the book is
   newest.
3. **Twenty more technique standards** (`aedb2dc`). `TECHNIQUE_GATE_MIN_RECIPES`
   25 → 15, the reverse gate named twenty techniques, they were written, the
   gate went quiet. 26 → 46 standards, 130 → 230 marks, assessable corpus
   683 → 789. Four of the new marks were not true of every recipe carrying
   their tag and were caught by checking each against its recipe set; a new
   test now forbids a mark naming an ingredient or vessel its own technique
   does not, which caught two pre-existing standards as well.
4. **The waste log** (`df9e60c`). `/menu/waste`, venue-wide, five reason codes
   read out of three lexicon entries and gated in REVERSE against the guide's
   own leak list — a leak it names that nothing carries fails the build. Theft
   and vendor creep are declared refusals, not gaps. No person field anywhere,
   enforced by a test that reads the source. Value snapshotted at log time;
   merged by union on id and never capped.
5. **`table/` replaced** (`1a6f7d5e`, in the monorepo). It was missing **eleven
   routes** — `costing`, `preps`, `prep-board`, and eight top-level ones. The
   scope assertion was run before copying; 126 stale content-hashed assets were
   dropped by replacing rather than copying over.

### 28 Aug — a six-lens review, worked through

Condensed from the full write-up in `0e2eb4c`; every rationale below is also in
the code it describes. Six professional lenses (chef de cuisine, kitchen
manager, chef patron, compliance, educator, service director) run against the
codebase and adversarially verified, then worked through 1–15.

**Safety and correctness.** The allergen truth pass — `lineIsEscaped()` discarded
a whole ingredient line and the fish/shellfish tests read from the escaped set,
so "chorizo optional" threw away the shrimp beside it and a whole fried tilapia
shipped `containsFish: false` **and a Vegan badge**: +16 fish, +12 shellfish, 16
false vegan badges withdrawn, zero vegetarian flags changed · the house record
could be wiped by a rollback (`hydrate()` had no `else`; a newer record is now
**blocked**, not read and never written over) · the coverage board's manager gate
was copy rather than code · the shared contrast defect, three defects wearing one
test failure (3.53:1 where AA wants 4.5, plus an animation fading text through
every failing ratio on the way in).

**Assessment.** 26 technique standards covering every technique used on 25+
recipes, so **638 recipes gained a standard** — only 69 of 103 techniques add any
coverage · grade the mark, not the plate (355 ledgered marks, tappable, and the
named palate fault survives the dialog) · the calibration bench, six ladders and
a triangle test with the app holding the answer · house dishes are assessable and
their self-declared tags structurally cannot reach `/coverage`.

**Service and money.** The Pass tells the truth — course firing, a real hands
sweep, a clock that survives the walk-in · preps, costing the demi once: **9.30 a
portion against a 6.00 guess** · the prep board back-times the day through the
same `buildPass` · covers by week · three money bugs, of which tax-inclusive
pricing overstated contribution by 3.00 and understated food cost 5.5 points on
**every** dish · weighted food cost, where the worked case is **41.2% against a
32% mean** · a timer not attached to a recipe (`timers.start` had one call site
in the app).
---

## What's left, ranked

1. **The e2e suite has never touched import or export.** `grep -rl` over
   `tests/*.spec.ts` for the .wtjson path returns nothing, so the whole
   transport — the thing that just turned out to have been broken since preps
   shipped — is covered by unit tests alone. The unit tests could not have
   caught the original defect either: it lived in the CALL SITES, and reverting
   the page wiring left 460 tests green. It is caught now only because the
   arguments were made required and `check` names them. An e2e that exports,
   clears the record and re-imports would close it properly.
2. **Lines that are not following the book.** A line keeps its own `unitCost`
   until somebody links it, so a venue can hold butter at 6.40 on one dish and
   9.50 in the book. The item book row knows which dishes reach the item; it
   does not yet say which of them are on a stale number. The datalist plus
   auto-link makes this rare on new work and common on everything costed before
   the book existed.
3. **More technique standards, if ever.** The threshold is still the worklist
   and it now sits at 15. The returns have thinned: 12 asks for four more
   (building an emulsion, charring over open flame, kneading dough, icing and
   frosting) and 10 asks for nothing beyond those, because the corpus has a gap
   between 12 recipes and 9. Below that it is writing assessment for techniques
   a venue meets a handful of times. **This is close to done, not open.**
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

## Deploying to the monorepo

**`table/` is current as of `1a6f7d5e` and nothing is blocking.** It had been
stale enough to be missing eleven routes, so re-sync after any route change
rather than assuming it followed.

The procedure is written out in **`OutsideOfTime/README.md` "Rebuilding the
World Table"** — that file, not this one, and the order is load-bearing. In
short, and in PowerShell rather than Git Bash (MSYS rewrites the leading slash
into a Windows path and SvelteKit rejects it with an error that never mentions
your shell):

```
$env:BASE_PATH='/table'; npm run build:pages
```

Then, before copying anything, the scope assertion — the README calls it the one
step in the whole process that can break the entire product, and it is right,
because a World Table worker at origin scope answers every navigation on the
site from its own shell:

```
grep -rho 'sw\.js`,{scope:`[^`]*`' _app/immutable/   # must print scope:`/table/`
```

Then REPLACE `table/` (`rm -rf` and copy, not copy-over, or content-hashed
chunks accumulate forever — 126 of them had), and re-inject with
`node .scripts/inject-oot-bar.mjs` followed by `--check`, which exits non-zero
if any page lacks the chip. 1,219 html files at the last run.

Versions: shared scripts **v18**, `oot-home.css?v=18`; `codex-v67`,
`ledger-v39`, `firstlight-v45`, `cfl-v84`. The Table's own copy of
`shared/oot-home.css` is byte-identical to the monorepo's, so a rebuild does not
regress the AA contrast fix — but check it, because the build copies its own.

## A note on method

The valuable habits, repeatedly: **measure before building**, **break every gate
to prove it fires**, and **verify in the browser** — defects in both sessions
were invisible to a green test suite and obvious on screen. When a mutation does
not fire a gate, check whether the mutation or the gate is at fault; twice it was
the mutation. Tests have twice been found asserting the bug they were meant to
catch, and once naming the universal case as an edge case.

Two more, both earned on 29 Aug:

**Break the CALL SITE, not only the function.** Reverting the page wiring to the
exact original defect left **460 tests green**. The unit tests covered the merge
perfectly and nothing covered whether anybody called it. When a feature spans a
pure function and the two lines that invoke it, the invocation is where the bug
will be — and the cheapest permanent gate is a REQUIRED argument, because an
omitted optional one compiles in silence while `check` names every call site.

**The browser is where wording fails.** The band sentence was correct code and a
wrong claim: it announced that a dish had "moved out of the band" over a plaice
whose sheet had one line on it, because every dish is under the band before it
is costed — so the headline was loudest when it had least to say. No test would
have called that wrong. It was obvious in one glance at the rendered page.

Assume anything in this document you have not re-run is stale.
