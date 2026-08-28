# The World Table — session handoff

Written 27 Aug 2026. Every number below was measured, not remembered. **Where a
document and a file disagree, the file wins** — run the tool. This document was
itself written because the previous handoff was stale in four places.

`CLAUDE.md` is the architectural reference and is far more detailed. Read it
second; read this first.

---

## What this is

A SvelteKit rewrite of a 1.5MB single-file culinary field guide, now becoming a
**training app for professional kitchens**. It is one of five wings in the
"Outside Of Time" subscription monorepo (`C:\Users\zpull\OutsideOfTime`), sold
B2B to venues at $49.99/month, unlimited staff, one shared login.

**Audience, decided by the owner: chefs, culinary students, AND servers.** That
third one drove most of this session's work — front of house had nothing.

## Repo state

| | |
|---|---|
| WorldTable | branch `dish-standards`, **16 commits unpushed** (remote is `origin/master`), plus the technique-standards work below |
| OutsideOfTime | branch `main`, HEAD `3ca8361e`, tree clean, **no git remote — never pushed** |
| Tests | **383 unit** (26 files), **76 e2e** (76 pass — **the suite is green**) |
| Gates | `npm run build:data` all pass · `npm run verify:build` **18/18** |
| Precache | 1.39 MB gzipped against a 2.00 MB cap |
| Routes | 24 · Derived JSON | 19 files |

**There is no red test any more.** The shared-layer contrast defect that had
been outstanding longest is fixed — see below.

## The corpus, by the numbers

970 recipes · 94 chapters · 479 lexicon terms · 103 techniques · **45 dish
standards** · **26 technique standards** · course of 45 dishes over 10 semesters
· 176 front-of-house terms · 27 service modules · 186 drill cards.

**683 of the 970 recipes can now be assessed** — 45 against a standard of their
own, 638 against the techniques they exercise. 287 still carry neither.

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

### The pattern this project runs on

Six features were built the same way, and the seventh will be too:

> **The guide already contains the material, and nobody can reach it.**
> `crosslinks.mjs` caps a lexicon term at three recipes, so the best content in
> the book surfaces beside an arbitrary dish. The work is **structure + build
> gates over existing prose**, not new writing.

Instances found: the technique spine, the palate repair table, menu economics,
food safety, the 43-entry restaurant-finance curriculum (**14 of which link to
NO recipe**), and the 176 front-of-house terms. Expect it again.

**The predicted seventh instance did not arrive.** The technique standards are
the OTHER kind of work this repo does — authored from nothing and held down by
gates, like `standards.mjs` and the technique table's `SUPPLEMENT`. The guide
never said what correct execution looks like, so there was nothing to surface.
Both kinds are live; do not assume the next job is a reachability problem.

### The gate discipline

Every derive module is gated **in both directions**:

- forward — the evidence must still be present in the guide
- **reverse** — a thing the guide states that nothing carries fails the build

The reverse half is what stops rot. And **any number shipped must be read back
out of the prose that justifies it** — `economics.mjs` shipped with only the
forward half working, so `lowPct` could drift 25→30 while the entry still said
"25–35%".

**A gate that cannot fail is worth nothing.** Prove every one by breaking
something and reading the message.

---

## What was built this session, in order

1. **The Repertoire** (`lib/repertoire.ts`) — spaced repetition over cooked
   dishes. 14/35/90/180/365-day ladder where the rung is *earned*: cook mode's
   last screen shows the dish's standard and asks met/close/missed.
2. **The Palate** (`/palate`) — the guide's own repair table, reachable, and
   offered inside cook mode when a plate is graded close or missed.
3. **The Pass** (`lib/pass.ts`, on `/menu`) — back-timed service plan.
   `tools/derive/service.mjs` splits every step into hands-on vs unattended.
4. **The Costing Sheet** (`/menu/costing`) — yield-aware plate costing and menu
   engineering over the venue's own dishes.
5. **Food Safety** (`/safety`) — the guide's two entries plus a gated table of
   its **silences**.
6. **The front door** — the 970-card grid moved off `/` to `/recipes`.
7. **Role** — chef / student / server, on the per-person profile.
8. **Five tabs** — Today · Learn · Practise · Service · Library.
9. **The Service Track** (`/service`) — 27 modules over all 176 FOH terms.
10. **Scored drills** (`/service/drill`) — 10 questions, redacted prompts.
11. **The Coverage Board** (`/coverage`) — who can hold which station.

## Added after that handoff — technique standards

`tools/derive/technique-standards.mjs` — **26 authored standards**, one for every
technique the corpus uses on 25 or more recipes, in the same 3–5 marks + `fault`
shape as a dish standard. They put a standard on **638 recipes that had none**.

The distinction the copy is built around: **a dish standard is read at the pass,
a technique standard is read at the pan** — while there is still something to be
done about it. The recipe page says so in words, and the block is visually
quieter, because a cook who mistakes the second for the first has been told the
dish was assessed when only its method was. Cook mode's last screen now grades
those 638 dishes too, so they enter the Repertoire ladder instead of recording
attendance.

- Recipes carry `judgedBy` — technique slugs, **ordered rarest-first** and capped
  at two. Rarest-first is load-bearing and tested: the technique that applies to
  fewest dishes says most about this one, and `judgedBy[0]` is what cook mode
  grades. A dish standard always wins; a recipe never carries both.
- The prose lives once in `technique-standards.json`, interned the way pairings
  are, not copied into 638 recipes.
- **Eight build gates, every one broken on purpose and its message read.** One
  did not fire on the first attempt — the mutation was wrong, not the gate, which
  is its own reminder to check which of the two you actually proved.
- The module's headline numbers are **parsed back out of its own doc comment**
  and compared to what the build measured, so the paragraph cannot drift the way
  `economics.mjs` did.
- 18 new unit tests (`src/lib/technique-standards.test.ts`), two of them proven
  to fail by flipping the sort and by planting a dish name in a mark.

## Decisions not to reverse

- **Certified stat keys stay unprefixed**; question ids are frozen; minting is
  additive. A changed id orphans progress.
- **Rank II is FREE** (Codex).
- **`matchSA` short-circuits on the model answer** — do not tidy it away.
- **A false reject is worse than a scoring leak.**
- **The archived original is the only content source**, except explicitly gated
  authored exceptions (`SUPPLEMENT`, `STANDARDS`, and this session's derive
  modules).
- **No pictorial icons in the Codex.** New Codex features go in a new `codexN.js`.
- **NO per-recipe hazard flags, ever.** Five candidate rules were measured and
  all five were unshippable — 0 of 15 adversarial verdicts survived. The
  stated-temperature rule scored **0/12**; the raw-protein rule flagged a
  hot-smoked salmon while MISSING carbonara, caesar, aioli, hollandaise and lox.
  A missed hazard is worse than ten false ones. `assertNoRecipes()` in
  `sanitation.mjs` keeps this refused. **Do not revive by tuning a regex** — a
  corrected rule returns ZERO hits on this corpus.
- **The coverage board shows coverage, not scores** — bands, never percentages.
  A percentage invites a threshold, a threshold invites a pass mark, and a pass
  mark is certification. **But this is a CHOICE, not a limit**, and the copy says
  so: a manager device CAN read every profile's whole record (`session::<id>` is
  deterministic; `oot-pass.js` already does it for two other wings).
- **Chef and student are not the same role.** The student has a denominator (45
  dishes); a chef's work has no end state. Giving a chef a course percentage is
  the exact bug the old home band shipped.

## Gotchas that cost real time

- **Clear the service worker before verifying anything.** And when a new derived
  JSON file appears, **restart the dev server** — its module graph is stale and
  you get a 500 that looks like a code error. This happened three times.
- **A `shared/*.js` edit is a ritual**: bump `SHARED_V`, re-inject the Table
  (1,179 files), bump every wing's `?v=`, bump the four vanilla wing SW cache
  names. None of the four is optional — they precache `/shared/` with
  `ignoreSearch: true`. The Table needs no SW bump: it runtime-caches `/shared/`,
  so there the `?v=` IS the cache key.
- **Bash heredocs eat backslashes and backticks.** Regexes and template literals
  written through `node <<'JS'` arrive mangled. Use the Write tool, or write the
  code without escapes.
- **`verify-build.mjs` string-scans `MODES`** — it needs the literal
  `const MODES = [`, single-quoted `href: '`, and no nested array. The Today tab
  must be `href: ''`, never `'/'` (which computes `.html`).
- **Five class names are a published paywall contract**: `ol.semesters`,
  `li.semester`, `.lexcard`, `.def`, `.flash`. Renaming one fails OPEN (content
  delivered free, no symptom); reusing one fails CLOSED.
  `src/lib/navigation.test.ts` holds the line.
- **The e2e suite is structurally blind to a dead route** — `serve.mjs` answers
  any unknown path with `shell.html` at 200. Only `verify:build` sees a missing
  page; `tests/nav.spec.ts` covers the rest.
- **`seedSession` must write both keys.** Once a profile exists, `KEY()` returns
  `session::<id>` and a base-key-only seed silently reads empty.
- **Guards fire on legitimate change** — confirm the parser agrees with reality,
  then update. Do not edit a gate without reading it.

---

## BLOCKING DEPLOY

**`table/` in the monorepo is a stale build.** It contains NONE of this
session's routes — `/recipes`, `/learn`, `/practise`, `/service`, `/repertoire`,
`/palate`, `/safety`, `/coverage`. The paywall patch (`3ca8361e`) makes them free
*for when they land*; they do not resolve yet.

The sync, per `OutsideOfTime/HANDOFF.md`, **in PowerShell not Git Bash**:

```
$env:BASE_PATH='/table'; npm run build:pages
```

then the scope greps in `README.md:186-205`, copy into `table/`, re-inject
(`node .scripts/inject-oot-bar.mjs` and `--check`). Order is load-bearing.

Current versions (verified): shared scripts **v18**; `codex-v66`, `ledger-v38`,
`firstlight-v45`, `cfl-v84`.

Also unpushed: **WorldTable 15 commits**; BartendersLedger 3. **OutsideOfTime has
no remote at all.**

## The allergen truth pass — done, and why it mattered

A six-lens professional review (chef de cuisine, kitchen manager, chef patron,
compliance, educator, service director) found two places where **silence read as
clearance**, and one where the app made an affirmative claim it could not support.

**`lineIsEscaped()` discards an entire ingredient line**, and `containsFish` /
`containsShellfish` read from the escaped set. Both escape routes silenced real
allergens:

- *Weeknight paella* — "Chicken thighs, chorizo optional (heresy but delicious),
  shrimp". `OPTIONAL_MARKER` exists to excuse the chorizo. It threw away the
  whole line, and **the shrimp with it**.
- *Escabecheng Isda* — "1 whole tilapia, snapper or pompano (~800g), scored,
  salted, and fried WHOLE in hot oil". The `or` rule found no keyword in
  "pompano", matched `oil` in `VEG_ALTERNATIVE`, and escaped a whole fish. It
  shipped `containsFish: false` **and painted a Vegan badge**.

The precedent was already in the file: dairy and egg were moved to the all-lines
reading when panna cotta shipped `vegan: true` over "500ml cream". Fish and
shellfish were left behind, and the comment above them already claimed they had
not been.

**Measured effect** — `containsFish` +16, `containsShellfish` +12, blank allergen
screens 101 → 99, **16 false Vegan badges withdrawn**, and `vegetarianStrict` /
`vegetarian` changed on **exactly zero** recipes: the vegetarian filter did not
move, because vegetarian status still reads binding lines only. That separation
is asserted directly (`onigiri` is vegetarian-strict AND carries a fish allergen).

Also landed:

- **`vegan` is gated as an assertion.** 16 recipes shipped `vegan: true` and
  `vegetarianOption: true` together — a contradiction in the data's own terms,
  since `vegetarianOption` means an animal product IS named and merely escaped.
  Nothing flagged vegan may now carry an animal word anywhere.
- **`/menu` and `/menu/quiz` render three states, always.** A dish nobody had
  marked used to render **nothing at all** on the screen a server reads at a
  table. `MenuDish.allergensCheckedAt` is stamped by an explicit affirmation,
  never by Save, because ticking every box correctly and ticking none look
  identical in the record. An unmarked dish can no longer pose an allergen
  question in the quiz.
- **Vocabulary**: `pompano`, `mullet`, `sablefish`, `stockfish` — words `\bfish\b`
  cannot reach from inside. All four are in the corpus and all four were caught
  by a second word in the same recipe, which is luck, not cover.
- **9 tests** (`src/lib/diet-escape.test.ts`), five of which fail if the flags go
  back to the binding read. The first draft of the sweep failed on **"Cape Cod
  Cranberry Relish"** — `\bcod\b` inside a place name — so it reads ingredients,
  never names. Names carry geography; the build carries the food.

**Reported, not gated:** 15 authored-vegetarian recipes now carry a fish or
shellfish flag (dashi, Worcestershire, fish sauce). The authored `vegetarian`
flag is a documented human judgement the build trusts, so this surfaces rather
than fails — but a Vegetarian badge over a dish containing dashi is a live
product question, not a derivation bug.

## The house record — the shared-login fix

**The bug.** `menuDishes` and `dishCosts` were fields of SessionState, and
`db.ts KEY()` namespaces every session to `session::<profileId>`. A venue buys
ONE subscription for unlimited staff, so the manager typed the menu once and
every other person who tapped their own name got an empty one: `/menu/quiz`
never opened (it needs four dishes), `/menu/costing` was blank, and the whole
Service tab was empty **for exactly the people the subscription was sold for**.

**The line now drawn.** A menu, what is 86'd, and what a plate costs are facts
about the VENUE. A cooked mark is a fact about a PERSON. The precedent was
already shipped: `wt.timers.v1` carries no profile in its key, because a pot on
the heat belongs to the room.

- `persistence/house.ts` — the record and its reconciliation as **pure
  functions**, for the reason `mergeSessions()` is pure: a runes module is
  unreachable from a test. `stores/house.svelte.ts` is a thin wrapper.
- Flat `house` key in the same IndexedDB store, never namespaced.
- **Migration is incremental**, not a roster sweep: each person's own first load
  absorbs whatever their session still holds. A sweep would need the profile
  list at startup and still miss anyone created later.
- `absorbed[]` is the guard that matters. Without it the stale copy left in the
  session re-adds a dish on every load, and **a dish that will not stay deleted
  is worse than one never absorbed**. Verified in the browser: seed a legacy
  menu, delete a dish, reload with the stale session copy still present — it
  stays deleted.
- **The 86 board** rides on the same record, open to everyone, because the
  person who finds the last portion gone is whoever finds it. Struck by rule AND
  weight AND the word `86` — never colour alone.
- **No publish gate**, deliberately. There is no auth on a shared tablet —
  `isManagerDevice()` is a per-device toggle anyone can flip — so a gate would
  be false authority, and a draft/published split shows a fresh device an empty
  editor over a live menu. `lastEditedBy` is attribution, never permission.
- `eightySix` is **never exported**. Importing yesterday's .wtjson must not take
  a dish off tonight's menu that came back on this morning.
- `SessionState.menuDishes` / `dishCosts` survive as the **transport only** —
  the .wtjson format is unchanged so existing files still import. No UI reads
  them; the field carries a deprecation note saying so.
- 11 tests (`persistence/house.test.ts`).

**Verified end to end in the browser:** with the session record *deleted
outright* — which is exactly what a second profile has — the menu renders, the
costing sheet sees the dish, and the allergen three-state line from the previous
fix is intact.

## Grading the mark, not the plate

**The bug.** Every cook was recorded as one of three words, so a commis could
pull the sear early for four months with every plate faithfully logged and
nobody — including him — able to name the drift. And the one moment the app
captured a real diagnosis, the palate fault picker, was component state
(`CookMode.svelte:136`) that died with the dialog.

- **355 marks now carry frozen ids**, minted by `tools/mint-mark-ids.mjs` and
  written into the prose files as `{ id, text }`. The mint WRAPS each string
  literal without re-emitting it, so the prose cannot change — and it was
  verified against a snapshot: **355 unique ids, zero text drift**.
- **IDS, NEVER INDICES.** An index silently repoints four months of "mark 2 was
  off" to a different sentence the day someone inserts a mark above it, and no
  gate can see that happen. `tools/derive/mark-ids.ledger.json` is committed and
  the build appends to it; a **rename or a drop fails the build**, an ADD is
  silent, and editing a mark's wording is free. Same rule the Codex holds for
  question ids. Both failure modes were broken on purpose and the message read.
- `CookEntry` gains `off?: string[]` and `fault?: string`, both optional, so
  every entry written before this stays valid — a January `close` has no
  annotation, which is true, rather than an empty one, which would read as
  "nothing was off".
- **The pass screen's marks are tappable** (44px rows, glyph + weight + colour,
  never colour alone). No extra screen: the marks were already there being read.
  The three grade buttons are **untouched** — deriving a grade from tap count
  would rewire the one input `repertoire.ts` runs on across 970 recipes, and
  "one mark off" means different things on a 3-mark and a 5-mark standard.
- **`mergeSessions` was silently discarding the new fields.** The tiebreak was
  `!seen.grade && e.grade`, so an imported entry carrying marks AND a fault lost
  to a bare local grade on the same `slug|at`. Now it prefers the richer entry.
  The test for it fails against the old line.
- **The read side**: one line above the standard — *"Across 4 graded cooks of
  this dish, you marked Skin unbroken and dry to the eye off 3 times."* Shown
  from the second annotated cook, because one miss is an evening, not a habit.
  `markDrift()` and `faultHistogram()` are pure and tested; a graded cook with no
  annotation counts in the denominator and contributes to no mark.

Deliberately NOT built: any per-person number a manager reads. This is the
cook's own record, on their own device, and it stays that way.

## The Pass tells the truth — course firing and a real hands count

**All three lies fixed.**

**Lie 1: everything landed at one instant.** `buildPass` set every dish's
`startsAtMin` to its own `elapsedMin`, so the amuse and the dessert were both
planned for 19:00:00 — the starter sat under a lamp for twenty minutes and went
out as a comp.

- `PassDishInput` gains `course`; `PassDish` gains `firesAtMin` (0 for the first
  course, NEGATIVE for later ones, because the whole module counts down).
- `DEFAULT_COURSE_FIRING` covers **all ten** courses — with the first plate, with
  the main (+25), after it (+55). A dish with an unknown or absent course fires
  with the first plate: under-claiming, which is the safe direction for a plan.
- **These are ours and the guide states no stagger.** The offsets are printed on
  screen so a kitchen that plates differently can see the number it disagrees
  with, and `buildPass` takes the map as an argument.
- The bell moved INLINE. A "Service" row pinned to the bottom of the list read
  as the end of the plan while showing a time earlier than the rows above it.
  It now sits where it happens and says **First plates away**.

**A live bug this uncovered.** `/menu`'s `COURSE_ORDER` listed **8 of the 10**
courses — Breakfast (59 recipes) and Sauce (22) were missing, and `courses`
FILTERS on that list. So pinning The French Omelette put it in no group and it
vanished from the course breakdown entirely: **81 recipes could be pinned and
then not be seen.** Fixed, and the firing map is gated against the corpus rather
than against that list, so the same omission cannot happen twice.

**Lie 2: a four-cook brigade got a solo cook's warnings.** A chef warned about
clashes that are not real learns to ignore the ones that are.

- A new pure `handsSweep()` emits `{fromMin, toMin, demand, dishes}` over the
  hands-on windows; `clashesOver(steps, hands)` raises only where demand exceeds
  the crew. Demand counts DISHES, not steps — a dish wants one pair of hands and
  its steps cannot overlap themselves.
- **`findCollisions` is untouched** and still populates `Pass.collisions`. Its
  merge unions dish names across a widened stretch, so its `dishes.length` is
  "dishes touched in this busy period", not "hands wanted now" — dividing THAT
  by a crew size would invent clashes on a two-cook night and hide them on a
  four-cook one.
- The hands control is component state, persisted **nowhere**. A saved "who was
  on" is one field from a rota and two from a timesheet.
- Verified live: 4 dishes, 1 cook → *"Chicken Congee and Onigiri want 2 pairs of
  hands for 12 min, and there is one."* 2 cooks → silent.

`firesAtMin` shipped **negative zero** for the first course on the first pass —
it survives into stored state and breaks `Object.is` while printing as `0`.
Caught by a test, fixed at source.

**Lie 3: the clock could not say where the time went, and did not survive a
walk to the walk-in.** `live` and `serviceTime` were component `$state`, and
"behind" was one subtraction against total plan length.

- `SessionState.planRun` holds the service being cooked: the menu hash it
  belongs to, the service time, when the clock started, and a tick per row. It
  carries a hash so a different menu cannot inherit it, and it **expires after 18
  hours** so last night's service is never resumed into "40 minutes behind".
- Ticks store a TIMESTAMP rather than a boolean. That costs nothing and buys
  both remaining features.
- **Behind now names the dish.** Verified live: nothing ticked, *"765 min behind,
  and you are on Pizza Margherita — Mix dough, rest 20 min…"*; tick that row and
  it becomes *"141 min behind, and you are on Pizza Margherita — Divide into 4
  balls; proof 2 h…"*. With nothing ticked the number degrades to exactly the
  whole-plan subtraction it replaced, so a cook who never ticks loses nothing.
- **Observed durations, for free.** Each consecutive tick pair times the earlier
  step. `observedElapsed()` is pure and refuses to speak below 3 observations,
  discards anything past 4x the estimate (the cook who ticked, walked away and
  ticked again after service), and answers with the MEDIAN. Only steps with no
  unattended time are observed at all — verified in the browser that Pizza
  Margherita's 10-hour ferment and 2.75-hour proof correctly record NOTHING.
  The copy says **"usually N min elapsed here"** and never "hands-on", because a
  tick cannot tell a wait from the cook answering the phone.
- The actuals key is `slug#index#stepCount`. Constant for the 970 frozen guide
  recipes; a family recipe re-authored to a different length mints a new key and
  its old observations are never read again — the discard, without a special case.

**Verified after a full page reload:** the clock is still running and the ticked
rows are restored.

## The house's own dishes are assessable

**The bug.** A gastropub paying $49.99 a month could only assess its staff on
somebody else's coq au vin. `authoring.ts` set `techniques: []` on every family
recipe, so a house dish never resolved `judgedBy`; `/family/[slug]` passed no
`judged` prop, so cook mode skipped grading entirely and the ladder in
`repertoire.ts` climbed on **pure attendance** for every dish a venue actually
cooks.

- `FamilyDraft` gains `techniques: string[]` and the form gains a picker over
  **only the 26 techniques that have a standard written**. Bounding it to those
  keeps the list readable AND guarantees a tick means something: a tick
  resolving to no standard leaves the dish exactly where it started.
- `resolveJudgedBy()` applies the same rule `build-data.mjs` runs over the 970 —
  keep the ticks that name a standard, order **rarest first**, cap at two. The
  cap is asserted equal to the build's `JUDGED_BY_MAX`, so the two cannot drift.
- An author may tick four; the app shows two. The gap is deliberate: the cook
  describes the dish, the app decides which two say most about it.
- `/family/[slug]/+page.ts` resolves `judged` exactly as `/recipe/[slug]` does,
  and the page passes it through to the view that already knew what to do with it.

**Verified end to end in the browser.** A house dish ticked *Braising* and
*Searing* saved `judgedBy: ["braising", "searing-the-hard-crust"]` — 27 recipes
before 100, rarest first. Its page renders "How to tell it is going right" with
both standards and 10 marks, and cook mode reaches *"HOUSE LAMB RUMP · THE PASS
— How was the technique? Braising · this dish has no standard of its own yet"*
with the tappable marks from the annotation work.

### The safety property, and why it is structural

These ticks are SELF-DECLARED, and on a shared tablet the author of a recipe and
its cook are the same person — so a ticked box would BE self-credited station
coverage if `/coverage` read it. **It cannot.** The board builds
`recipesByTechnique` from `techniques.json`, the audited both-directions-gated
table, and `techniquesTouched` looks cooks up by slug WITHIN those lists.
`familySlug()` refuses to mint a slug the guide already holds, so a house dish
can never appear in one.

Both links are asserted. The first draft of that test looked for slugs starting
`fam-` and would have passed against any codebase at all — family recipes are
identified by `source === 'family'`, not a prefix.

### The pointer, and the card a guest is actually handed

`MenuDish.recipeSlug` — a POINTER, not a method. "A menu item is not a Recipe"
still holds: the dish carries no steps, no quantities and no technique tags of
its own. But one slug lets the lamb rump that goes out sixty times a week reach
cook mode, the standard it is judged against, and the Repertoire. The form
matches by NAME through a datalist, because a chef knows what the dish is called
and not what its slug is; the worksheet row then offers "Cook Coq au Vin ▸".

`/menu/guest` printed PINNED GUIDE RECIPES, so a venue that had entered, priced
and allergen-marked its whole menu tapped Print and handed a guest a card
listing Pizza Margherita — while the page's own empty state said it "sets itself
from the dishes on your worksheet".

- Two labelled tabs, the kitchen's menu default when it has dishes. Silently
  repointing would have broken the dinner-party use it was built for.
- Grouped by the sections the kitchen typed, with prices.
- **An 86'd dish does not print.** Off tonight is not on tonight's card.
- **The card carries NO allergen marks, by design.** Those marks are a kitchen
  record; printed, they read to a guest as a guarantee the derivation cannot
  make. A fixed, non-removable line invites the conversation instead: *"Before
  you order, please tell us about any allergy or intolerance."*
- The guest page carried the SAME 8-of-10 `COURSE_ORDER` bug as /menu, so a
  pinned omelette was absent from the card too. Fixed.

## The shared contrast defect — cleared

It was three defects wearing one test failure, and only the first was the one
described.

**1. Opacity stacked on an already-muted colour.** Six rules in
`shared/oot-home.css` set `opacity: .55–.68` on text that had just been given
`color: var(--oot-dim)`. `--oot-dim` was chosen to MEET AA — it measures 4.55:1
on day paper and 5.70:1 at night — and the very next line undid it, landing at
2.33:1 and 2.97:1. The opacity is gone; the colour does the work it was picked
for. **Do not put opacity back on text: if something must recede, give it a
colour that recedes.** The done-path row now recedes to `--oot-dim` rather than
to 55% of the ink, and the tick in `.oot-path-mark` is what actually says "done".

That took the violation from 14 nodes to 6, and the rest was not opacity at all.

**2. The accent was too light to be text.** `.oot-sec-head h3` is 12.5px
uppercase at weight 600 — normal text to WCAG, which wants 4.5:1 (large needs
18.66px AND bold). The Table's `--turmeric` measures **3.53:1** on its paper.
Its `--turmeric-deep` measures **5.90:1**, and the Table already reserves it for
exactly this kind of small label. The shared layer gained
`--oot-accent-deep`, falling back to `--oot-accent` so a wing that omits it gets
what it had before; `tokens.css` maps it to `--turmeric-deep`.

**3. The entrance animation faded text through every failing ratio on the way
in.** `@keyframes ootSecIn` animated `opacity: 0 → 1` on whole sections, so axe
sampled the dashboard's muted text at 4.18–4.46:1 against colours that measure
4.55–5.70 at rest. Those were real readings of a real frame — a reader on a slow
device sees them too. The keyframe animates **transform only** now. The rise was
the whole effect; the fade only ever cost legibility.

### Re-vendoring, and a correction to the ritual

`HANDOFF.md` says a shared edit means bumping **all four** vanilla wing SW cache
names. For a CSS-only change that is wrong, and shipping it that way would have
been four unnecessary cache invalidations:

- `codex` and `ledger` precache `../shared/oot-home.css` (sw.js line 10) and
  match with `ignoreSearch: true`, so the `?v=` is DISCARDED — `codex/sw.js:123`
  says so itself. Both cache names bumped: **codex-v67**, **ledger-v39**.
- `pass` references the CSS but has no service worker, so its `?v=` bump is enough.
- **`light` and `almanac` do not reference this file at all.** They precache the
  shared JS only. Left untouched at firstlight-v45 / cfl-v84.
- The Table references it unversioned across 1,179 prerendered files and
  runtime-caches `/shared/`, so it ships with the next build.

The CSS `?v=` went 17 → **18**, which happens to align it with `SHARED_V`; they
are separate tracks and were one apart.

## Preps — the cost object

**The bug.** A braise's sheet carried "Demi-glace, 6.00/L, 0.15 L, 100% yield".
Nobody had ever costed the demi, and the same guess was retyped into every other
dish that used it. On the seeded example — veal bones at a 25% yield, mirepoix,
wine, over 10 portions — the real number is **9.30 a portion against a 6.00
guess**. Every sauced dish was understated in the direction that flatters, which
is exactly the error `plateCost`'s own `complete` flag exists to refuse.

**Where it lives.** `Prep[]` on the **house record**, not in SessionState. The
panel proposed it as a sibling of `menuDishes` — but that moved to the house
record earlier in this session, and a prep is a venue fact for the same reason:
what the demi costs belongs to the room, not to whoever holds the tablet.

- Times are **SECONDS**. `PassStepInput` is `handsOnSec` and `handsOf()` divides
  by 60, so a prep kept in minutes back-times to sixty times its length — a
  two-hour stock claiming five days. The form types minutes and stores seconds.
- `CostLine.prepId?` is the join. `resolveLines()` flattens prep-backed lines to
  plain ones **at the call site**, so `costing.ts`'s primitives and their 38
  tests keep seeing only arithmetic they already know.
- **yieldPct is LOCKED to 100 on a resolved line, and that is a guard, not a
  default.** The trim, the bones and the nine hours already happened inside the
  prep and are already in its per-portion cost; a dish applying its own yield on
  top would divide by the loss twice and overstate the plate.
- **Depth is capped at one.** A prep referencing a prep is a graph and a graph
  needs a cycle detector nobody will maintain, so a nested line makes the prep
  incomplete rather than being resolved quietly.
- **Deleting a prep leaves its dishes incomplete, never cheaper.** The remove
  confirm names them.
- `preps` is named explicitly in the import merge, not left to a spread —
  `cookedLog` and `shoppingChecks` once fell through one and erased a Path of
  Study.

### Two bugs of my own, both about a number that looked right

**Incompleteness was not propagating structurally.** `resolveLines` returned
`complete: false` while still emitting a *costable* line, so `plateCost` on its
own reported a confident total over a sauce nobody had finished costing — the
propagation depended on every caller reading my flag. An unfinished prep now
makes the LINE uncostable, which is the same refusal `plateCost` already applies
to anything else it cannot price. Caught by a test.

**The line table costed the raw line.** A prep-backed line stores `unitCost: 0`
because its price comes from the prep, so the table printed **0.00** next to a
total that was right. Money is read from the resolved line now, and the field is
read-only on a prep row — typing over it there would be the retyped guess this
whole object exists to end.

## The prep board — back-timing the day

The Pass back-times a service; nothing back-timed the morning that has to happen
before it. On the floor that shows up at 8:20pm on a Saturday: the commis made
"some" stock, because the prep list said "veal stock" with no number.

**It is the same `buildPass`.** Back-timing is back-timing and a prep deadline is
just a different anchor, so #4's scheduler pays off twice — including the hands
sweep, which now answers "how many cooks are on PREP" as readily as it answered
it for service. The times are the chef's own from the prep record, not the
guide's 86%-estimated step durations.

- `prepCounts` on the house record: `{ onHand, countedOn }` as a LOCAL
  `YYYY-MM-DD`. A count is true for the day it was made and no longer — "12
  portions of demi" from Tuesday tells you nothing on Thursday, so the board says
  "counted 2026-01-05" rather than quietly believing it. Local and not
  `toISOString`, or a count made at 22:00 in UTC+2 files under tomorrow.
- `batchesNeeded()` = ceil((par − onHand) / portions). Two thirds of a batch of
  stock is a batch of stock.
- **An uncounted prep reads as none on hand**, which over-orders rather than
  sending a section out short. The board says so in as many words rather than
  letting the zero look like a measurement.
- **Time is NOT multiplied by the batch count**, and that is a decision: two
  batches of stock is usually one bigger pot, not two sittings. The batch count
  sits beside the row so a kitchen that really does run it twice can see what it
  is being told.

**Verified in the browser.** Three preps, nothing counted: *"3 of 3 not counted
today"*, demi at par 20 over 10 portions asks for **2 batches**, and the day
back-times to *"3 preps · 95 min of hands · start at 06:00 to be ready by
16:00"* — the demi's 10 hours starting first, the 25-minute crumb at 15:35.
Count the demi at par and it drops off the plan, which collapses to *"1 prep ·
20 min of hands · start at 15:40"*.

**Still not built:** the waste log — valued from `plateCost`, five reason codes,
rolled up venue-wide and **never per person**. That last part is not a detail:
a per-cook waste number is a disciplinary instrument, and the data goes
dishonest inside a fortnight.

## The house record could be wiped by a rollback — fixed

**Found while planning the costing week, and it was mine.** An adversarial pass
over the migration plan turned up a live data-loss bug in the house record
introduced earlier in this same session.

`hydrate()` read the record behind `if (schemaVersion <= HOUSE_VERSION)` **and
had no else.** A record written by a NEWER build failed that test, `#r` stayed
`EMPTY_HOUSE`, and then the next write — `absorbSession`'s persist, or the first
tap on the 86 board, which is the most-tapped write in the app — put that empty
record straight over the top of it.

**Menu, preps, costings, prep counts and the 86 board, gone.** On nothing worse
than a rollback or a stale service worker — and `vite.config.ts:65` ships
`registerType: 'prompt'` with `skipWaiting: false` ("never reload the page out
from under a cook"), so a device serving an older bundle is the SHIPPED DESIGN,
not an edge case.

**Reproduced and fixed, both in the browser.** A record stamped
`schemaVersion: 99` with a dish, a prep and an unknown `futureField`:

- before the fix, two taps left `schemaVersion: 1`, `dishes: []`, `preps: []`
- after it, everything survives untouched, `futureField` included

`readHouse()` is the pure decision and it is tested: a newer record is
**blocked** — not read, and never written over. Every mutator is a no-op while
blocked, because the guard sits in `#persist()` rather than in each caller. An
unreadable record blocks too: writing over what you cannot read is exactly how
this was lost.

`db.ts` had the right instinct all along and this had not followed it —
`migrate()` throws on a newer version and `loadSession` snapshots before
resetting, *"never destroy data silently"*. For a newer record the stronger
answer is to write nothing at all, so downgrading and upgrading again is
lossless, which is what `migrate()`'s own comment already promised.

A chef on a blocked device sees a banner saying the tablet is behind and nothing
has been lost — rather than an empty menu and no explanation.

## What's left, ranked

1. **More technique standards — and the threshold IS the worklist.** 26 are
   written. To get the rest: lower `TECHNIQUE_GATE_MIN_RECIPES` in
   `tools/derive/technique-standards.mjs`, run `npm run build:data`, and the
   reverse gate names exactly which techniques it now wants. **20** asks for 13
   more and reaches 745 of the 824 technique-tagged recipes; **15** asks for 20
   more and reaches 782.

   Correction to the previous ranking, which said 103 standards would cover 824:
   **only 69 of the 103 techniques add any coverage at all.** The other 34 are
   fully redundant — every recipe they touch is already covered by another
   technique — so the job is bounded well below 103, and 23 of the 103 are
   singletons where a technique standard would just be a dish standard.

   Still outstanding: letting the coverage board say "to a standard" as a
   measure rather than a floor. The standards now exist to support it; the board
   has not been changed to use them.
2. **The allergen vocabulary.** **101 of 970 recipes have no allergen flag at
   all** — hummus among them, over a line reading "150g good tahini". The
   display now says what it did NOT screen, so absence no longer reads as
   clearance, but closing the vocabulary to all 14 is a `diet.mjs` project.
   `allergens.test.ts` asserts `NOT_SCREENED` stays non-empty, so the day it
   lands the copy is forced to change.
3. ~~**The shared CSS contrast defect**~~ — **DONE.** Three defects, not one; see
   the section above. The suite is green.
4. **The prep list.** The Pass back-times *service*; nothing back-times the
   *day*. The hard part (hands-on vs unattended per step) is already built.
5. **Yield tests.** Zero content, and the costing sheet depends on the number.
6. **Sensory calibration.** Salt at three concentrations. Cheapest high-value
   item on the list.
7. **Repetition under load.** The Pass already computes collisions; that is a
   drill waiting to happen.

**Do not build:** video, leaderboards, certification, more recipes.

## Open question for the owner

`oot-pass.js` already renders per-person **Name / Last studied / Streak /
Answered / Owed / accuracy %** for two other wings. So "coverage, never scores"
in the World Table is inconsistent with what the monorepo already ships to the
same customers. Either the Table matches the pass, or the pass is overreaching.
Product call, not a technical one.

## A note on how this went

The most valuable thing done repeatedly was **measuring before building** and
**breaking every gate to prove it fires**. That caught, among others: a drill
prompt that gave away its own answer via a near-spelling (`muenster` beside
Munster — 25 of 186 cards); two techniques that would have credited a cook with
work they never did (`The soufflé`'s only recipe mentions it as a *negative
simile*); a nav gate that could never fail; and a prefs guard that passed
against a file that demonstrably contained the word it was banning.

Assume the same is true of anything in this document you have not re-run.
