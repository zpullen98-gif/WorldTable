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

Deploy to GitHub Pages with `npm run build:pages`, never the raw env prefix.
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
  prototypes. `instanceof RegExp` is false for all of them: it silently
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

- **L2506**: typing in the lexicon search stripped every recipe cross-link.
- **L2806**: typing in the pantry filter destroyed the hemisphere toggle.

`$derived` recomputes from state; there is no reference to go stale. Both sites
carry a comment saying so. If you find yourself adding a listener that calls a
render function by name, stop.

## Conventions

- Prerendered pages must not read `url.searchParams`: one file on disk serves
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
  paint: that is the only reason preferences live in localStorage while
  everything else is in IndexedDB.
- One `@media print` block, in `src/lib/styles/print.css`. The original had four
  scattered ones that disagreed.
- Search options live in `src/lib/search-config.mjs`, imported by BOTH the
  build-time indexer and the runtime loader. `MiniSearch.loadJS` silently
  corrupts every lookup if its options drift from what the index was serialized
  with. Never fork them.

## The Family Chapter: how user recipes work

Family recipes carry the full Recipe shape (summary + detail in one object) and
live in IndexedDB, never in the static data. Consequences worth knowing:

- Their pages are `/family/[slug]` with `ssr = false`: there is nothing to
  prerender and no server holding their data. Do NOT move family fallback into
  the prerendered `/recipe/[slug]` route: its server-side 404 fires before any
  browser-only lookup can run (this was tried; it broke direct loads in dev).
- `recipeHref()` in data.ts is the only place that knows about the URL split.
  Generate recipe links through it, never by hand.
- `familySlug()` in authoring.ts refuses collisions with guide slugs so that
  slug-keyed menu/notes resolution can never grab the wrong dish.
- They are not in the static search index; under a query the browser matches
  them by the substring predicate and appends them after ranked results.

## The technique spine: how skills map to recipes

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

The Path of Study joins the same way. `study.json` gains `skills` (derived from
each semester's dishes, never authored, weighted by how many of them drill it)
and `techniques.json` gains `semesters` for the reverse link. The weight is the
point: the semester titled "The Braise" drills searing (4 dishes) above braising
(2), because a braise IS sear-then-simmer, and the curriculum could not say so
before. 48 of the 103 skills are taught somewhere on the Path; the other 55 are
reachable only by browsing. A semester skill pointing at no technique page fails
the build.

**Techniques derive from `linkBlobs`, not `blobs`**: the note-free text, same
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
keyword the corpus never says: the near-miss that left "Caramelizing onions"
dead against a corpus that writes "Caramelize onion"). Entries over 150 recipes
fail as too broad to distinguish. Anchor keys or values that resolve to nothing
fail. The original's own dead entries are reported, not failed: Gnocchi and
Boiling bagels never fire because this corpus has no gnocchi and no bagel.

`npm run report:tech` is the ledger; `--labels` gives per-entry counts, a
chapter name dumps its untagged recipes as working material.

## The repertoire: how repetition works

`cookedLog` has stored `{slug, at}` on every cook since the first build, and
until now nothing read the timestamp. `hasCooked()` collapsed the history to a
boolean, the study page drew a tick, and the home band counted log entries. That
is an attendance sheet: it recorded that you turned up, never whether you can
still cook the dish.

`src/lib/repertoire.ts` is the schedule, and it is PURE: same reason
`mergeSessions()` is. A `.svelte.ts` runes module cannot be reached from a unit
test, and scheduling is code that must be tested rather than eyeballed.

- **The ladder is 14 / 35 / 90 / 180 / 365 days.** Kitchen intervals, not
  flashcard ones: the unit of practice is a service or a weekend.
- **The rung is earned, not counted.** Walking a dish's cooks in order, a plate
  that `met` its standard climbs, `close` holds, `missed` drops back one. A
  cook with no grade climbs: having no standard to check against is the guide's
  gap, not the cook's failure. This is why the log must be read chronologically
  and not merely counted.
- **The due queue sorts by overdue-as-a-share-of-interval**, never by `dueAt`.
  A fortnightly dish three weeks late outranks an annual one three weeks late;
  sorting on the date says the opposite every time.
- **The grade comes from cook mode's last screen**, with the dish's marks in
  front of you. Without that, a re-cook queue is just a timer: it would nag
  about a dish you nailed and let a ruined one sit for months.

### Three things that were wrong before anything could read the log

- **`cookedLog.length` is a count of COOKS, not dishes.** `markCooked` appends
  on every finish, so a dish cooked three times counted as three. The home band
  compared that number to the 45-dish curriculum, and compared the WHOLE log,
  so 45 cooks of anything at all reported the ten-semester course complete. Use
  `session.cookedDishes` (a Set) for progress, always.
- **`toggleCooked` deleted every entry for the slug.** Invisible while a dish
  was a boolean; now that repeats carry the schedule, un-ticking a dish cooked
  four times destroyed four years of evidence. It removes the most recent cook
  only: undo the mis-tap, not the history behind it.
- **`mergeSessions` unioned by slug and kept the EARLIEST cook.** Correct while
  nothing read timestamps, data loss the moment something did: importing a
  session collapsed every repeat and backdated the survivor. It keys on
  `slug|at` now, so re-importing your own export is still idempotent.

## The palate — structure over the guide's own prose

The Flavor Atlas already held the whole of this and it reached FIVE recipes.
"The Repair Table: Balancing a Dish" is the seasoning chart every cook works
from; "Tasting Vocabulary & Palate Training" is the protocol for building the
palate that reads it. Both were filed among 479 lexicon terms, and
`crosslinks.mjs` caps a term at three recipes, so the diagnostic chart surfaced
beside a Filipino oxtail stew. Same shape as the technique spine: a good system
nobody could reach.

`tools/derive/palate.mjs` does NOT write a repair table. It parses the entry's
labelled clauses (`TOO FLAT:`, `TOO SALTY:` …) and carries a structure over
them: eight faults, levers ordered gentlest first. Only `symptom` is ours: the
entry names each fault and never says what it tastes like.

**That structure is a claim about the prose, so the build checks it three ways:**

- every fault we carry must still appear as a labelled clause;
- every lever's `token` must appear inside **its own** fault's clause: "TOO
  SOUR" and "TOO SWEET" are one word apart with near-opposite fixes, so a lever
  under the wrong fault is exactly the error that would read as plausible
  forever;
- **and the reverse**: a labelled clause the guide states that nothing carries
  fails the build. If the entry ever gains a ninth fault, nobody has to notice
  by eye.

Rewrite the entry and the build names the levers you just invalidated.
`src/lib/palate.test.ts` covers the other half: palate.mjs edited without
re-running `build:data`, which the build gate cannot see because the app reads
only the JSON.

**Where it is used.** `/palate` is the chart as a page. The one that matters is
cook mode: grade a plate `close` or `missed` and the repair table comes to you,
alongside that dish's own authored `standard.fault`. A plate that `met` its
standard skips it: a screen that appears anyway teaches cooks to tap through
screens. The grade is recorded BEFORE the panel opens, so closing the dialog
cannot lose it.

## The pass: planning backwards, and what it needed first

The Service Timeline was a printout: pinned dishes, total minutes, sorted
longest first, captioned "start at the top and work down". Sorting is not
scheduling. That order only holds for a cook who finishes one dish before
starting the next, the one thing a pass never is, and **one number per dish
cannot say when the cook is free**, so there was nothing to overlap with even in
principle.

### The measurement that was missing

Elapsed time is not work. Coq au vin is 78 minutes elapsed and ~18 of hands;
cacio e pepe is 17 elapsed and 16 of hands. The old timeline sized those two the
same. `tools/derive/service.mjs` splits every step into hands-on and unattended
seconds at build time (`handsOnSec`, `unattendedSec` on `Step`).

- **The unit is the CLAUSE, not the step.** The median recipe has four steps and
  each is compound: *"Deglaze with wine, add stock and herbs; return chicken,
  simmer 45–60 min."*
- **The governing verb is the nearest one BEFORE the duration.** That is how
  these methods are written, and it is what decides
  `"Bake 220°C 15 min or fry until blistered"` (bake governs: a wait) against
  `"Grill or broil hot, 3–4 min per side"` (nothing governs, and 4 < 20: hands).
- **Unstated work still costs time.** Only 34.5% of steps state a duration and
  most of those are waits, so scoring stated time alone gave Kansas City
  barbecue ribs 475 minutes elapsed and ZERO of work. A step earns the guide's
  four-minute default when it holds work no duration was attached to. **550
  recipes score zero hands-on without it**; the build gates on it.
- `durationSec` is untouched. It is the cook-mode TIMER's number (the first
  duration in the step); the split is additive.

### The plan

`src/lib/pass.ts` is pure and unit-tested. Times are **minutes before service**
throughout, because the plan is anchored at its end, the only fixed point a
kitchen has. Collisions are where two DIFFERENT dishes want hands at once; an
unattended simmer is not a demand on anybody, and overlapping clashes merge so
one busy stretch reports once. A dish carrying a wait of 240+ min is flagged to
start the day before rather than given a start time at 05:31 (85 recipes).

The honest limit, stated once on the page rather than as a badge on every row:
**the waits are measured and the work is largely estimated.** A marker that
fires on 15 of 17 rows distinguishes nothing.

## Menu economics: the costing sheet

The starkest instance of the pattern in this file. The guide carries a whole
restaurant-finance curriculum, 43 entries under "Restaurant Finance &
Opening", plus "Menu Economics: Food Cost, Yield & Par" and "Costing Time";
and **fourteen of those 43 link to no recipe at all**, because crosslinks.mjs
scores a term against dish text and "COGS Control: Inventory, Variance & Theft"
has no dish. The least reachable content in the guide is what the paying venue
needs most.

`tools/derive/economics.mjs` carries the bands and the four menu-engineering
quadrants, gated against the prose **in both directions**: the entry must still
state the phrase, AND the numbers are read back out of that phrase and compared
to the ones we ship. The first version only checked the phrase, and the hole was
live: `lowPct` could be edited from 25 to 30 while the entry still said
"25–35%" and the build passed, which would have scored every dish against a band
the guide does not state.

### Yield is not a refinement

`src/lib/costing.ts` divides every line by its yield. The guide is blunt about
why: *"a $12/kg fish at 45% yield is really $26/kg on the plate; costing raw
invoice prices is the classic rookie bankruptcy."* A sheet that multiplies
invoice price by quantity is not a simpler version of this: it is the specific
error that closes restaurants, and it would look completely convincing. The
worked example is a unit test.

Two more things the sheet refuses to fake:

- **An incomplete total is flagged, not silently shipped.** A plate cost that
  drops an uncostable line reads as authority and is wrong in the direction that
  makes a dish look more profitable than it is.
- **Menu engineering leaves out dishes with no price or no sales count.** A dish
  at the origin because nobody typed a number is not a dog. Popularity uses the
  standard 70%-of-fair-share floor, not a median: a median forces half the menu
  to be unpopular however evenly it sells.

`/menu/costing` sits inside `<article class="sheet">`, the same contract as
`/menu/quiz`: inside Outside Of Time this is a PAID surface and the monorepo's
lock masks `article.sheet` children. An overlay alone is not a gate.

`dishCosts` is a SIBLING of `menuDishes`, not a member. Dishes merge by id with
the newer `ts` winning, so folding costs into the dish would let a colleague's
edit to a description silently replace an evening of costing work.

### The allergen screen: thirteen of fourteen

`tools/derive/diet.mjs` screens every statutory allergen except sulphites,
which are concentration-defined and therefore not lexically screenable: the
refusal is documented in `src/lib/allergens.ts` and asserted non-empty by its
test. THE SCRUB RULE: exception phrases ("coconut milk", "vegetable stock")
are blanked before matching for dairy/gluten/fish/shellfish, whose exceptions
are the point, but EGG, NUTS and all seven new allergens match RAW lines,
because an exception written for the vegetarian logic ("peanut butter", "egg
noodles") must never silence the allergen inside it. Nine recipes shipped
containsNuts:false over peanut butter before this was measured. The closure
test in allergens.test.ts forces derivation, display, types and the
family-recipe literal to widen together.

### The firing drill: `src/lib/firing-drill.ts`

Questions are GENERATED from the cook's own pinned menu through buildPass,
never authored: the right answer is the firing order the pass computed. Three
distinct start times per question (ties have no defensible "first"), no
zero-hands steps (a simmer is not a decision), timeout counts as wrong. The
grade goes to the cook's own drillLog and nothing else reads it.

### The item book: `src/lib/items.ts`

`unitCost` was stored per line per dish and `editLine` patched it in place, so
the previous price did not exist anywhere and the guide's own *"reprice
quarterly against invoice creep"* was structurally impossible to follow. The
book is `HouseRecord.items`, keyed by `itemSlugOf(name)`, each holding up to
`HISTORY_CAP` observations of `{ unitCost, unit, at }`.

Four rules, none of them tidy-able:

- **History is UNIONED, never newer-wins-whole**, and the union key is the whole
  observation rather than `at` alone. The losing device's book holds price
  changes the winner never observed. The cap is applied AFTER the union by a
  total sort, so the merge is order-independent.
- **An item-backed line keeps the dish's own `yieldPct`; a prep-backed line is
  locked to 100.** A prep's trim already happened inside it; an item price is a
  raw invoice price. Clearing the dish yield here would price the menu off gross
  weight, the rookie bankruptcy above, reintroduced.
- **Zero is not a price.** `addLine` mints a row at `unitCost: 0`.
- **Usage follows preps AND the line's name**, not only `itemSlug`. Linking is
  opt-in, so counting only linked lines understates the exposure worst on the day
  the book is newest.

Linking is **never mandatory**: a required link turns a ten-minute costing into
an afternoon of master data and the sheet stops being opened. The datalist is
the entire onboarding.

### Technique standards: the threshold is the worklist

`TECHNIQUE_GATE_MIN_RECIPES` in `tools/derive/technique-standards.mjs` is the
load-bearing number: every technique on that many recipes MUST carry a standard
or the build fails, naming each one by slug and count. Lowering it is how the
remaining standards get written: drop it, read what the gate asks for, write
those, commit. It has gone 25 → 15, which produced twenty standards and took the
assessable corpus from 683 to 789 of 970.

Two claims in that module's header are parsed back out of the comment and
checked against the build: the headline paragraph and the ceiling sentence. A
number in either that nobody can re-run is a number already drifting: the
ceiling sentence shipped wrong the first time because it was reasoned from other
figures rather than measured.

**Any field added to SessionState must be NAMED in mergeSessions**, or the
next .wtjson import erases it — a genuine export always carries every key
present-and-empty. This has now bitten four times (cookedLog, shoppingChecks,
stepActuals, planRun); deep-pass.test.ts pins the last two. The same rule
holds for HouseRecord and adoptImport.

**A page number is computed, emitted-and-gated, or absent.** Hardcoded counts
in copy drifted three times in one review (coverage board, service page, the
service-track card). `assessability.json` exists precisely so pages can import
the measured numbers the gates already check.

**A mark must hold for EVERY recipe carrying the tag.** This is the constraint
`standards.mjs` does not have, and it is easy to break by reasoning instead of
checking: blanching demanded salted water when 7 of its 23 recipes never salt
it, and the overnight rest demanded a cover when two of its recipes chill
uncovered on purpose. `technique-standards.test.ts` forbids a mark naming an
ingredient or vessel its own technique does not name; beyond that, check each
mark against the actual recipe set.

### The waste log: `src/lib/waste.ts`, `tools/derive/waste.mjs`

The guide asks for it by name and supplies the taxonomy across three entries, so
the five reason codes are read out of prose rather than chosen: COGS Control
names the leak meter (*"waste, portioning drift, unrecorded comps, or theft"*)
and the villain, Prime Cost decomposes the COGS side, Pour Cost adds spillage.

**The reverse gate is the one that matters.** It parses the guide's own leak
list out of the entry and fails on any leak neither carried by a code nor
declared in `EXCLUDED`: the direction a taxonomy rots in silently, and the half
`economics.mjs` once shipped broken.

Two refusals, both declared rather than omitted so the gate can tell them from
gaps:

- **No THEFT code.** The guide names theft and then answers it: *"systems, not
  suspicion"*, and the goal is *"not a surveillance state"*. Theft is what
  remains in the variance once the log has named everything it can.
- **No vendor creep.** A price that moved, not a thing in a bin. The item book
  has it; logging it here double-counts.

**`WasteEntry` has no field for who binned it**, and `waste.test.ts` reads the
source and fails if one appears. Waste-by-cook is a disciplinary instrument and
the data goes dishonest inside a fortnight. `EightySix` carries `by` (a name,
never a permission) because saying who took the halibut off blames nobody. The
guide's *"not a surveillance state"* is itself gated, so the refusal cannot
outlive its justification unnoticed.

`unitValue` is a **snapshot** taken at log time, never recomputed: revaluing old
bins at today's prices would make last quarter move whenever an item is
repriced. Merged by **union on id and never capped**: the item book caps
because an old price is dead weight, and old waste is the trend.

### House collections in the .wtjson

They ride in a `house` block that is a **sibling of `data`**, never inside it.
`mergeSessions` spreads `...incoming` ahead of its named fields, so anything in
`data` is copied into the per-profile `session::<profileId>` record — and a prep,
a costing and an item price are facts about the VENUE. `menuDishes`/`dishCosts`
sit in `data` only because they have a session-side legacy being absorbed.

`buildExport`'s `house` and `adoptImport`'s `incoming` are **required
arguments**. They were optional, and that is precisely why preps could not travel
for their entire existence: the merge was written and tested, and neither call
site ever passed one, because an omitted optional argument compiles in silence.
`FORMAT_VERSION` stays at 3: the criterion for a bump is a build that would
DESTROY something, and an old build ignores an unknown top-level key.

## Sanitation: the guide's silences, made load-bearing

The fifth and last time the reachability pattern appears, and the only one
where the finding was to build LESS. The substrate is two entries: the
food-safety entry is 701 characters and reached three recipes crosslinks.mjs
picked on keyword score (key lime pie, pretzels, a tomato sauce); the
inspections entry is 1,535 characters and reached nothing at all.

**No per-recipe hazard flag exists, and one must not be added.** Five candidate
rules were written and measured against the corpus, and all five failed across
three adversarial lenses; 0 of 15 verdicts survived:

- stated-temperature: 12 hits, precision **0/12**: every hit is correctly
  cooked rare beef, medium salmon or a rested pork chop
- raw-protein: flags a salmon hot-smoked to a probe-verified 60°C while MISSING
  carbonara, caesar, aioli, hollandaise and lox. Recall ~44%
- live-shellfish: flags shucked oysters going into a 190°C fryer, misses live
  quahogs steamed open
- cook-chill: not reproducible from its own spec; the count moves 6/8/9/11
- preserve-uncooked: 3 of 6 hits vanish when the kill-verb list is widened

**A missed hazard is worse than ten false ones, and these miss in that
direction.** `assertNoRecipes()` in the module walks the shipped object and
fails on any string that is a recipe slug or any field named recipes/hazards.
Do not revive these by tuning a regex: a *corrected* undercooked-protein rule
returns ZERO hits on this corpus. There is no hazard of that shape to find.

### What is gated

Clauses forward and reverse (parseRepairTable is reused, but only because it
was measured on these two entries specifically: exactly 3 labels and 2, no
false positives: it produces junk on other prose). Thirteen literal evidence
substrings. Two numeric facts read back out of their own evidence in BOTH
directions, closing economics.mjs's original hole from the start.

Three gates are unusual enough to name:

- **The disclosed conflict.** The guide states 4–60°C in one entry and
  4.5–54.5°C in another and never reconciles them. The page discloses both
  rather than picking, because picking is a safety judgement this app has no
  standing to make. The gate's first draft was **unreachable**: pinning the
  figures inside the evidence string meant a changed number read as a *deleted*
  statement, so the "these must still differ" branch could never fire. The
  anchor is number-free now and the numbers are read from the window before it.
- **The C/F disagreement.** `4°C` rounds to 39°F; the guide writes 40°F. Safety
  strings are therefore never passed through `convertLine`, which would turn
  "4–60°C (40–140°F)" into a sentence with two different Fahrenheit ranges. The
  DISAGREEMENT is gated, so a corrected guide forces the copy to change.
- **The gaps.** Each asserts the guide still NAMES a practice and still states
  NO figure for it (`ppm`, `critical limit`, `reheat to`, `defrost` must appear
  in zero definitions). That second half makes filling a gap with invented
  regulatory content fail the build rather than pass review.

`readNumbers()` is deliberately NOT economics.mjs's `split(/[^0-9]+/)`, which
reads `4.5–54.5°C` as [4, 5, 54, 5]. economics.mjs is left alone; its integers
gate fine, and re-cutting a working gate to share a helper churns it for nothing.

### The allergen screen

Found while surveying this feature and fixed with it, because a safety-branded
page next to a broken allergen display is worse than neither. The recipe page
rendered `Contains` only when a flag was true, so **101 of 970 recipes showed
nothing at all**, hummus among them, over a line reading "150g good tahini".
Absence read as clearance. diet.mjs's own comment already stated the policy the
display was breaking: an empty list "reads as 'no allergens' rather than 'we
don't know'".

The block now always renders and names both what was screened and what was not
(sesame, soy, celery, mustard, sulphites, lupin, molluscs, peanuts: measured
prevalence 157/95/78/72/40/38/30/0). Closing the vocabulary to all 14 is a
diet.mjs project with its own keyword review and is deferred; `allergens.test.ts`
asserts NOT_SCREENED stays non-empty so the day it lands, the copy must change.

## Known remaining work

- None planned. The content backfill completed 2026-08-08: all 320 thin "from
  the pass" notes rewritten in src/lib/data/notes.json (the overlay keeps the
  raw extraction byte-identical to the archived original). `npm run
  report:notes` is the ledger and reads zero. New authoring goes through the
  same overlay; the parity harness exempts overlaid slugs automatically.
- 143 recipes still carry no technique tag, spread thin (no chapter has more
  than five). Some are correct: a three-ingredient drink demonstrates nothing.
  `npm run report:tech "<chapter>"` is the working material if the table is
  widened further. (This figure was 146 in an earlier version of this note and
  in a draft comment, both times reasoned rather than measured; the build now
  gates it in technique-standards.mjs's ceiling sentence.)

## Testing

`npm test` (192 unit) · `npm run test:e2e` (45 Playwright: regressions named for
the original's line numbers, offline in real Chromium, axe, print PDFs, and the
parity harness that runs the archived original against our build output).

**Every a11y view was checked with an EMPTY session until 2026-08-27.** Whole
sections were therefore never looked at: the shopping list, the cellar picker,
The Pass, The Repertoire; and an unlabelled `<select>` (axe: CRITICAL) sat on
the menu page for as long as the section existed. `seedSession()` in
tests/helpers.ts puts a session in via `addInitScript` before page scripts run;
the SEEDED block in a11y.spec.ts uses it. Proof it works: reintroduce the
missing `aria-label` and the empty-session menu test still passes while the
seeded one fails. **A page with no user data is not the page users have.**

**One e2e test is currently RED and it is not a flake:** `axe: recipe grid has
no serious violations`. `static/shared/oot-home.css` stacks `opacity: .6–.68`
on top of already-muted text in six rules (`.oot-sec-head span`,
`.oot-today-sub` and four more), which measures 2.32:1 to 3.17:1 against day
service's paper where AA wants 4.5:1. It is a SHARED-layer defect: every wing
renders those bands, so the fix belongs in the Outside Of Time monorepo and
must be re-vendored here, not patched in this copy alone. Dimming already-dim
text is the trap; a border weight or a different token carries "quieter"
without taking the words away.

Hard-won rules the suites encode; do not relearn these:

- **e2e runs against `tools/serve.mjs`, never `vite preview`.** SvelteKit's
  preview middleware serves only route-manifest files: the precached offline
  shell 404s (whatever it is named, 200.html and fallback.html both), the SW
  install fails, and the browser silently discards the registration. serve.mjs
  behaves like the real static host. `npm run preview` uses it too.
- **The offline shell ships as `shell.html`**, a postbuild copy of the adapter's
  fallback, because servers treat the configured fallback file as internal
  config. `404.html` is a third copy, for GitHub Pages.
- **Never reuse a running preview server across a rebuild**: sirv-style
  servers manifest files at startup and 404 new chunk hashes. Playwright always
  starts its own (`reuseExistingServer: false`).
- **Wait for `html[data-hydrated]`** (the layout stamps it from an effect)
  before interacting: prerendered pages look alive long before listeners attach.
- **`paths.relative: false` is load-bearing**; without it the SW registers
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
