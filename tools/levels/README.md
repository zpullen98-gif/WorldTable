# The four levels: how an item gets its level

The home is four level cards (I Commis, II Chef de Partie, III Sous Chef,
IV Chef: the Floor Deck's brigade ladder, now the whole app's), each level the
same seven subsections at that level's difficulty, and training from there.
`tools/derive/levels.mjs` is the one place the names and blurbs are written
and the gate that holds the placements; the placements themselves are the
authored files in `tools/derive/levels/<subsection>.json`, machine-written by
the procedure below and hand-editable afterwards, with the reason for every
item in the file. Nothing is locked: a level guides, it never bars.

What is placed here: the 45 course dishes, the 112 techniques, the 593 Lexicon
terms outside the service track, the 27 service modules (their 186 term cards
inherit through `moduleTerms`), the 8 palate faults, and the 26 read slices of
food safety (never counted, only read). The 281 deck cards keep the level in
their section modules (`tools/deck/README.md`, "Levels") and are copied from
the deck index at build; the deck's placements are the calibration set for
everything placed here. The library's 1,844 recipes are not placed one by one:
the level page's library door uses the gated `difficulty` as a proxy.

## The standard

**Level I, Commis.** What a cook is asked to know in the first weeks: the
everyday word a guest assumes any server knows and any cook understands
(boiled, braised, mise en place, the line's slang, the danger zone), the
produce and staples handled on day one (onion, garlic, carrot, potato, butter,
the common herbs), and the foundation techniques that carry a standard on the
most recipes (sweating, searing, salted water, blanching, knife cuts,
deglazing, roux, simmering, roasting). Dishes are the course's opening
semesters and the library's Easy plates: one technique, no wait, put up
without notes. Food safety is the danger zone, the two-hour rule,
cross-contamination and FIFO. Service is the room's vocabulary, the allergen
rule and the bottle at the table. On the palate, the two faults the repair
table opens with, flat and salty.

**Level II, Chef de Partie.** What running a station requires: the mother
sauces and their children, emulsions, pan sauces, caramelising, confit and the
braise; the cuts and grades, the fish case, the cheese and charcuterie words a
kitchen writes on a menu and expects a sentence of explanation for; pastry and
baking science at its base; the less common produce and the spice rack. Dishes
are the middle semesters (the sauté station, the braise, bread, pastry
fundamentals) and the library's Intermediate plates. Food safety is the
cooling law, HACCP as a system and the allergen protocol. Service is how a
wine is described, the pairing games, the whites and reds you will pour, and
the cheese board's formula. On the palate, sour and sweet.

**Level III, Sous Chef.** What running the pass and teaching a brigade
require: the classical vocabulary of fine dining, the specialist cut and
product behind it, the techniques whose standard governs a whole service
(tempering, lamination, live fire, the wok, fermentation, butchery), and the
numbers a sous reads (food cost, yield, par). Dishes are fire and smoke, the
wok, seafood mastery, and the library's Advanced plates with a long wait or a
multi-component build. Food safety is inspections, the disciplines, and the
guide's own disagreement with itself. Service is the grape atlas, the cheese
boards by country and the charcuterie boards. On the palate, bitter and rich.

**Level IV, Chef.** What owning the menu requires: the rare, the specialist
and the deeply classical word a senior cook or server must own without notes;
the techniques nobody drills by accident, on the fewest recipes and taught by
no semester (galantine, ballotine, mole); restaurant finance and opening; the
rarest atlas entries. Dishes are the capstone semester and the project dishes
of the Advanced library (cassoulet, a whole fish, laminated pastry). Food
safety is what the guide names and does not state, and the jurisdiction
framing. Service is bar craft, the cocktail templates and why the shift makes
money. On the palate, spicy and muddy, the faults with the least obvious
levers.

**Signals, weighed in this order.** The Floor Deck's 281 placements are the
calibration set: a term whose deck card exists takes the card's level unless
its essay is plainly broader. Recipe difficulty 1 leans I, 2 leans II, 3 leans
III or IV. The earliest semester on the Path: 1 to 3 lean I, 4 to 6 lean II,
7 to 9 lean III, 10 leans IV. The technique standards ladder: many recipes and
a Lexicon anchor lean down; a particular with few recipes and no semester
leans up. The Lexicon category: The Professional Kitchen and Knife & Prep lean
I; Heat & Precision I or II; the cuts, fish, baking science, the Flavor Atlas
and the Seasonal Larder II; Restaurant Finance & Opening III or IV; the
atlases by how often a kitchen handles the item. Ties break DOWN, because
nothing is locked and a word placed low costs nothing while a word placed high
hides it. No quotas; minimums only (`MINIMUMS` in `levels.mjs`).

## One run

1. **Brief.** `node tools/levels/brief.mjs` (after `npm run build:data`, which
   it reads). It WRITES one brief per subsection to
   `tools/levels/out/<subsection>.brief.json`: the standard above, the four
   levels, the deck's placements with reasons as the calibration set, and
   every item with its signals (a semester, a difficulty, a recipe count, a
   deck level, a category, a technique standard). It PRINTS a small JSON
   object (the briefs' directory, the levels, the minimums, the chunks as slug
   and name): that is the workflow's `args`. `--only lexicon,palate` briefs
   just those; `--chunk 40` sets the chunk size (even chunks, the Lexicon's cut
   by category).
2. **Place.** Run `place.workflow.js` with the Workflow tool: copy the script
   into the session's working directory and pass the copy's path, with step
   1's printed object as `args`. Per chunk an assigner places every item with
   a reason, a challenger argues each placement from the floor and the stove,
   and a reconciler answers every challenge with a disposition; then one
   critic reads the whole placement across subsections and gets one bounded
   repair, at most a tenth of each subsection, in its own order. About 70
   agents for the 811 items. A chunk that dies is filled by resuming the run.
   Save what the run returned as `tools/levels/out/run.json`.
3. **Write.** `node tools/levels/set-levels.mjs tools/levels/out/run.json`
   All or nothing per subsection: it refuses a slug that is not an item of
   this build, an item left without a level, a duplicate, a level outside 1 to
   4, or a missing reason. It writes `tools/derive/levels/<subsection>.json`
   (universe order, one item per line) and `tools/levels/audit/<subsection>.json`
   (the challenges, the dispositions, what the critic moved, its notes). Both
   are committed.
4. **Complete.** When every subsection is placed, set `LEVELS_COMPLETE = true`
   in `tools/derive/levels.mjs`: from then on an item with no level and a
   level under its minimums fail the build.
5. **Build and prove.** `npm run build:data` (it prints each level's counts
   per subsection), `npm test` (`src/lib/levels.test.ts` reads the emitted
   file: minimums, deck parity, names equal `DECK_LEVELS`, no digit or dash in
   a blurb), `npm run verify:derived`.
6. **Read it.** Open each level in the app. The agents catch what is
   inconsistent; only a person catches what is odd.
7. **Commit** by explicit path: the six authored files, the six audits, and
   the emitted `src/lib/data/levels.json`.

## Moving one item later

Edit its line in `tools/derive/levels/<subsection>.json` and rewrite the
reason; run `npm run build:data`. New content (a technique, a course dish, a
Lexicon term outside the track, a module, a fault, a safety slice) fails the
build until it is placed: brief it with `--only`, run the workflow for that
subsection, and write it in with `set-levels.mjs --only <subsection>`.
