# Study menus: My Menu as a training tool, in three wings

A specification for three engineers to build identically: one in this repo (the World Table), one in the Bartender's Ledger, one in the Sommelier's Codex, with the site's copies brought forward by the site's own tools. Written 3 October 2026 for an owner who starts as a server at Brennan's on Monday 5 October.

## 0. Why, and what this changes

### 0.1 The owner's words

"I just looked at My Menu for Brennan's in all 3, World Table, Bartender's Ledger, Sommelier's Codex, and it looks like shit and it's not user friendly. I want flash cards, I want detailed suggestions and improvements, I want links to relevant information that we already have in these apps. Let's make this the best training tool it can possibly be." And: "I uploaded all of Brennan's information at the very beginning and it included a wine list. I feel like we are missing a lot of information. What I also want done is expanded and improved descriptions of each dish, cocktail and wine."

### 0.2 What is wrong today (read off the six screenshots at 390 px, and measured)

- **The Table's /menu is an editing surface.** All 62 dishes are expanded at once; under every mark sit Edit and Discard; under every dish "Allergens not marked: ask the kitchen" and 86 it / Edit / Remove. Above the house sit the recipe planner's "Nothing pinned yet" prompt and a boxed export warning; the "Ready to cook offline" pop-up covers the text at the bottom of the screen. The page is 235,732 px tall on a phone.
- **The Codex's Our List** is a wall of Kept / Edit / Discard under every mark of every bottle; the section header of the list is buried under six drill buttons.
- **The Ledger** shows a tidy list but buries the drink behind five pane chips (Build, Taste and tell, Against the classics, Cost and pour, The formula), and the formula pane reads like an editor ("Hers until you keep it; until then it reaches no drill, no card and no guest").
- **The wine list is complete as the guide prints it, and the screens hide that.** The server guide's wine content is the by-the-glass list: 20 wines, 14 priced and 6 poured on the two tastings, all 20 in the pack. The full bottle list is not in the guide; it is linked to Binwise, which this environment cannot reach. What the owner feels is missing is depth: no story, no producer, no region, no way to present the bottle. Section 5 supplies it, and the Codex header says plainly what the list is and is not.
- **Critic: part of the bottle list has been verified since, and the spec ignored it.** `tools/house/brennans/research/deep-2026-10-03/` holds six wine sweeps and three refuter files: 62 bottle records marked `held` (champagne 11, white Burgundy 16, red Burgundy 7, other France 10, other Old World 11, New World 7), 16 refuted and 177 unverifiable, plus 40 held food facts, 17 bar facts and 11 about the wine programme. "We are missing a lot of information" is literally true of the bottles, and a header that says only "the full bottle list is not in the guide" reads as a shrug. Section 5.8 files the held bottles as a partial bottle list with its date, and section 5.1 lets the notes cite the held facts. Nothing unverifiable or refuted ships.
- **The content is thin in measurable places** (section 5.4): 15 ten second lines under 12 words, 9 twenty second lines under 25 words, 8 forty five second lines under 60 words, 41 items with an empty part, 7 children's and snack dishes whose guest line is the menu line restated, 15 wines whose "profile" part is the profile field copied, 52 items whose guest line and twenty second line are the same string (shown twice today), 20 wines whose "pairs" and "goes with" are the same string, one wine profile carrying a price argument. Only 42 kept notes exist across 105 items, and 22 of those are the cellar dossier's second opinion.

### 0.3 The decisions, in one list

1. **Study first.** When a house is current, each wing's My Menu opens on a study view: a short header, a sticky row of section chips and a search box, compact rows, each opening a detail card. Editing moves behind one "Edit" per item and one "Edit the menu" switch, which shows today's editing UI unchanged.
2. **One pure module, three wings.** The rows, the short line, the sections, the search, the notes, the item flash cards, the progress line, the name folding and the link matching live once in `src/lib/house/house-study.ts`, ported into `static/shared/oot-house.js` as `OOT.houseLib.study`. Each wing draws it in its own art.
3. **The art is never undone.** The Table builds the study view from its parchment tokens and classes (`--paper`, `--card`, `--ink`, `--turmeric-deep`, `.chip`, `.eyebrow`, `.sec`, `--display`, `--text`); the Ledger from its felt and brass (`.panel`, `.chip`, `.btn-brass`, `.btn-ghost`, `.eyebrow`, `.ticket`, `--felt-*`, `--brass*`, `--cream*`); the Codex from its dark page and gold small caps (`.viewhead`, `.secgroup`, `.btn.gold`, `.btn.ghost`, `.lvltag`, `--house-display`, `--house-reading`, `--gold*`, `--parch`). Layout and hierarchy change; palette, type, tokens and components do not.
4. **Every link is matched at runtime, never guessed, and shown only when its target exists.**
5. **Deep links**: the Table's `/menu#d-<id>`, the Ledger's `ledger/#drink=<id>`, the Codex's `codex/#wine=<id>` (and `codex/#list`), each read once at boot behind `typeof` and `try`; the Codex's in a new layer `js/codex28.js`, because codex27 reads no location.
6. **Flash cards in every wing**, a deck per scope (the whole list, a section, one item, my weak ones), Got it / Again, a count; the Table through `/menu/quiz?mode=cards`, the Ledger through its flashcards engine with a house scope, the Codex through a new deck in codex28.
7. **The content**: every dish, drink and wine gains one kept note "Tell me about it." (120 to 200 words) and three or four coaching notes under fixed questions; thin guest-facing lines are rewritten within their caps. They ship in a second pack edition, `brennans-new-orleans.v2.oothouse.json`, which refreshes a device holding the first without losing anything a person kept.
8. **Allergens stay with the kitchen.** The study view never draws an allergen list, a tick or a verdict. A service note appears only under the fixed eyebrow "Your words. Allergens: confirm at lineup." The editing UI behind the switch keeps today's dish form exactly as it is, because ticking a box there is a person's act on their own record.

### 0.4 Rules that hold everywhere (from the brief and the four CLAUDE.md files)

- No em dash, en dash or spaced double hyphen in any file written for this work, the pack included.
- British spelling in the apps' own strings. The house's fields stay as the house writes them: the builder's spelling map makes every house string American, as the guide is (`tools/house/engine.mjs americanise`), and the new notes pass through it like every other house string. "flavor" in a kept line is right; "flavour" in a button is right.
- Levels are named, never numbered. Nothing in this work counts toward a level, a readiness figure or an exam.
- Only kept marks (`by === 'person'`) are shown as the house's word. A mark of hers that nobody kept is never drawn in the study view; the card says in one line that there is something to look over behind Edit.
- Every control at least 44 px tall; every state a word, never a colour alone; no emoji and no pictorial icon. The study views use words for direction too ("Back to the menu", "Next: Turtle Soup"). Critic: the reason given here was wrong. The Codex's keep-set (its CLAUDE.md, "typography, not pictures") allows the arrows U+2192 and U+203A as directional marks and the en and em dashes (U+2013, U+2014) inside content, and its own reference data carries them (the Riesling profile's `st` puts an en dash between "low" and "mod" and a U+2192 arrow between "Dry" and "sweet"). The rule for this work is narrower and stands: the strings the three study views author (`STUDY_WORDS` and each wing's templates) carry no dash and no codepoint at or above U+2190; reference text a card quotes verbatim from a wing's own data is that wing's content, already held by that wing's sweep, and is never rewritten by the study code (section 7.3 scopes the check accordingly).
- Critic: **arm's length.** A server studies standing, phone in one hand. Body text in the study views is never under 16 px (17 px in the Codex's reading face, whose x-height is small), a row's name never under 18 px, the ten second line 20 px, a flash card's front name 28 px and its back 18 px. Text meets 4.5:1 against its own background in day and night; each wing's check runs axe's `color-contrast` rule over the study view and the open card, not only the serious-violations sweep.
- The study view works offline: every byte it needs is precached by its wing, and the Table's library links come through loaders that are already precached.
- Nobody commits or pushes as part of building this; each engineer touches only the repo named in their part, and the site is brought forward by its own tools afterwards.

## 1. Shared ground

### 1.1 What is studied where

| Wing | Studies | Kind | Rows from | Reads the house through |
|---|---|---|---|---|
| World Table `/menu` | the dishes | `dish` | `house.current.dishes`, joined to `house.dishes` (the Table's rows) by id | `house.current` (`stores/house.svelte.ts`) |
| Bartender's Ledger, Menu tab | the drinks | `cocktail` | `OOT.house.current().cocktails`, joined to `progress.bar` by id | `OOT.house` (the shared engine), behind `houseHere()` |
| Sommelier's Codex, Our List | the wines | `wine` | `OOT.house.current().wines`, joined to `ST.cellar` by id | `v27Current()` (codex27) |

Rows follow the house's own order (the pack's order is the menu's order). A wing row with no house item (a person's own drink or bottle added by hand) is shown after the house's sections under a final section "Your own" with the short line taken from its own fields; it opens a card with what it has.

**The study view is the default whenever `current` returns a house with at least one item of the wing's kind and the person has not switched "Edit the menu" on.** With no house, or a house with none of the wing's kind, each wing shows exactly today's screen. The switch is not persisted: every load opens on the study view.

Critic: **the shift filter.** Brennan's serves two menus, and a server on a Monday breakfast shift does not need the dinner entrées first. Every item carries `meals` (Eggs Hussarde: Breakfast & lunch only). The header carries one row of three chips, "All day", "Breakfast & lunch", "Dinner" (the names are the house's `meals`, so another house shows its own), `aria-pressed`, at least 44 px. A chosen meal narrows the rows, the section counts, the search and every deck the header deals to items whose `meals` hold it; an item with empty `meals` is kept under every choice, because hiding a dish nobody tagged is the worse failure. The choice is a per-device convenience in `localStorage` (`oot-study-meal-v1`, one origin, so the three wings agree), wrapped in `try`, defaulting to All day when it cannot be read. It never touches a record.

### 1.2 The pure module: `src/lib/house/house-study.ts`

Added to `MODULES` in `tools/port-house.mjs` after `house-drills`, so it reaches the two vanilla wings as `OOT.houseLib.study`. Comments dash-free and regexes ASCII (the port's `assertClean`). No DOM, no storage, no clock: every function takes what it needs.

```ts
export const ABOUT_Q = 'Tell me about it.';
export const SELL_Q = 'How do I sell it?';
export const ASK_Q = 'What do guests ask?';
export const WATCH_Q = 'What should I watch for?';
export const POUR_Q = 'How do I pour it?';
export const COACH_ORDER = [SELL_Q, ASK_Q, WATCH_Q, POUR_Q] as const;
export const FIXED_QS = [ABOUT_Q, ...COACH_ORDER] as const;
export const STUDY_WORDS: Readonly<Record<StudyWordKey, string>>;   // section 9, every string a wing prints

export interface StudyRow { id: string; kind: ItemKind; name: string; section: string; price: string; line: string; signature: boolean; hasKept: boolean }
export function studyRows(house: House, kind: ItemKind): StudyRow[];
export function shortLine(item: HouseItem): string;
export function studySections(rows: readonly StudyRow[]): Array<{ section: string; count: number }>;
export function searchRows(house: House, rows: readonly StudyRow[], query: string): StudyRow[];
export function searchElsewhere(house: House, kind: ItemKind, query: string): Array<{ kind: ItemKind; id: string; name: string }>;   // Critic: the other kinds' hits
export function priceLine(item: HouseItem): string;                  // Critic: the one rule for printing a price
export function mealsOf(house: House): string[];                     // Critic: the shift filter's chips
export function inMeal(item: HouseItem, meal: string): boolean;

export interface ItemNotes { about: Note | null; coaching: Array<{ q: string; note: Note }>; more: Note[]; earlier: Note[] }
export function notesFor(item: HouseItem): ItemNotes;

export interface CardBack { s10: string; parts: Array<[label: string, text: string]>; pairs: Array<[label: string, text: string]>; say: string }
export interface ItemCard { itemId: string; kind: ItemKind; name: string; section: string; back: CardBack }
export function itemCards(house: House, kind: ItemKind, scope: StudyScope): ItemCard[];
export type StudyScope = { all: true } | { section: string } | { itemIds: readonly string[] };

export type Verdict = 'got' | 'again';
export interface StudyProgress { total: number; studied: number; got: number; again: number; againIds: string[] }
export function studyProgress(itemIds: readonly string[], latest: ReadonlyMap<string, Verdict>): StudyProgress;

export function fold(s: string): string;
export function nameIn(hay: string, name: string): number;   // the index of the first whole-word hit in a folded hay, or -1
export function itemHay(item: HouseItem): string;              // the folded text links are matched against
export function partsShown(item: HouseItem): Array<[string, string]>;
export function linesShown(item: HouseItem): { s10: string; s20: string; s45: string; guestShown: boolean };
export function lineupFor(house: House, itemId: string): { asks: AskAtLineup[]; disputes: Dispute[]; mixUps: MixUp[]; terms: LexiconTerm[]; scenarios: Scenario[]; tastings: Array<{ tasting: Tasting; course: TastingCourse; as: 'dish' | 'pour' }> };
```

The rules each function keeps:

- **`studyRows`** reads `house.dishes`, `house.cocktails` or `house.wines` in order and skips an item with no name. `hasKept` is true when any mark on the item is kept.
- **`shortLine`**: the kept `lines.s10`, with a leading copy of the name taken off (the text up to the first colon or comma, folded, equals the folded name, or the folded name with a leading "the"; the remainder's first letter is raised); else the first sentence of the kept `guest`; else, for a dish, the `description`; for a drink, the `spec` joined with commas; for a wine, the `style`. Never cut in code: the wings clamp it to two lines in CSS. On Brennan's: Eggs Hussarde reads "Poached eggs, coffee-cured Canadian bacon and our own English muffins, with hollandaise and marchand de vin."; the Classic Sazerac reads "Sazerac rye, Peychaud's bitters and a Herbsaint rinse. New Orleans' own cocktail."; the house Champagne keeps its whole ten second line because it does not open on its name. Critic: a wine's line usually opens on a paraphrase of its name, not a copy, and the rule above missed it: the Berres row would read "C.H. Berres 'Old Vines' Riesling 2022" over "The Berres Old Vines Riesling from the Mosel: light, racy and off-dry, our glass for anything spicy.", the name twice and the useful half clamped away. For a wine the leading clause (up to the first colon or comma) is also taken off when every one of its folded words occurs in the folded join of the name, producer, wine, region and grapes, or is one of "the", "a", "an", "our", "from", "by", "in"; so the Berres row reads "Light, racy and off-dry, our glass for anything spicy." A clause carrying any other word stays whole. The test pins the Berres line and the Champagne's.
- **`studySections`**: sections in order of first appearance, with counts.
- **`searchRows`**: the query is folded and split on spaces; a row matches when every token occurs in the folded join of the name, section, the kept `s10`, and for a dish the description and ingredients, for a drink the spec, family and spirit, for a wine the producer, wine, vintage, region, grapes and style. Order is kept.
- Critic: **`searchElsewhere`** runs the same match over the house's other two kinds. On her first morning the owner will type "sazerac" into the Table, because that is where she is; today's answer, "Nothing matches sazerac.", is a dead end. Under the wing's own rows (or under "Nothing matches" when there are none) each wing draws "Elsewhere in the house" with each hit as "Classic Sazerac, in the Ledger", a cross-room link under the three conditions of 1.7 and plain words otherwise. At most five, in house order.
- Critic: **`priceLine`** is the one rule for a printed price, used by the row, the card and the flash card back. Each `prices[].printed` is printed exactly as the house holds it, never edited. When every meal's printed string is the same, it is printed once ("$13", never "Breakfast & lunch $13 · Dinner $13", which is what the Classic Sazerac's two entries would draw). When they differ, each is "meal printed" joined by " · ". For a wine the meal label "By the glass" is not printed, because the printed string already names its measure ("$14 glass", "$80 half-bottle"); nothing is appended to it, so the Berres reads "$14 glass" and the Auslese "$80 half-bottle", never "by the glass". A wine with no price and a pour on a tasting reads "Poured on the Dinner tasting, 4 oz" from `pours` and the tastings. An item with no price reads nothing: no "$0", no "Price not printed".
- **`notesFor`**: `about` is the newest note whose `q` is `ABOUT_Q`; `coaching` is, for each question of `COACH_ORDER` in order, the newest note with that `q` (absent questions are skipped); `earlier` holds the older notes under a fixed question (a later edition or a person's own answer superseded them; shown behind "Earlier answers"); `more` holds every other note, newest first. Equality of `q` is exact after trimming.
- **`linesShown`**: the kept three lines; `guestShown` is false when the kept `guest` equals the kept `s20` after trimming (52 of 105 on Brennan's), so the card never prints the same sentence twice.
- **`partsShown`**: the kept five parts with the kind's labels (`DISH_PARTS`, `COCKTAIL_PARTS`, `WINE_PARTS`), in that order, empty ones left out; for a wine, the "the profile" part is left out when it equals the kept `profile` and the "what it goes with" part when it equals the kept `goesWith`, because the card shows those fields in their own blocks. Critic: "equals" misses the commonest case. The Berres's `parts.sauce` is the first two sentences of its `profile`, not the whole of it, so the card would print the same 45 words twice, once in the parts and once under The profile. The test is containment after folding: the part is left out when its fold is contained in the fold of the field it copies. The same containment rule decides `dup-part` in 5.4, whose count is re-measured with it.
- **`itemCards`**: one card per item in scope that has a kept `lines.s10` or a kept `parts`. The back: `s10`; `partsShown`; `pairs` by kind (a dish: "First pick" with the wine's name and glass price, and "Without alcohol" with the drink's name, from the kept pairing; a drink: "Offer next" with the kept upsells' names; a wine: "First picks" with the dish names); `say` from the kept `say`.
- **`studyProgress`**: `studied` counts ids with any verdict; `got` and `again` count by the latest verdict; `againIds` keeps the menu's order. Each wing maps its own records to `latest` (section 1.6).
- **`fold`**: NFD, combining marks removed; the letters NFD does not split transliterated first (ø o, æ ae, œ oe, ß ss, ł l, đ d, ð d, þ th, ı i), as `tools/slugify.mjs` does; curly quotes made straight; lower case; `&` read as " and "; every run of anything outside a to z and 0 to 9 becomes one space; trimmed; returned with one space at each end so whole-word tests are a plain `includes`.
- **`nameIn(hay, name)`**: `name` is folded; a name under four characters never matches; the hit is the first of `" name "`, `" names "`, `" namees "` in the folded hay (the Floor Deck's plural rule, `nameInText` in `floor-deck-core.mjs`).
- **`itemHay`**: the folded join of the name, then the description and ingredients (a dish), the spec, method, glass and garnish (a drink), or the producer, wine, region and grapes (a wine), then the kept parts. The order matters: link lists are ordered by where in the hay a name first occurs, so a term in the dish's name comes before a term in its sauce.
- **`lineupFor`**: the house's lineup asks, disputes, mix-ups, lexicon terms and scenarios whose ids or item ids name the item, and the tastings that serve it as a course or pour it.

`house-study.test.ts` beside it (section 7.1) pins every rule above on `fixtures/house-min.json` and on the shipped pack.

### 1.3 The detail card's order (all three wings, all three kinds)

The card replaces the list in place; the list's scroll position is kept and restored on Back. Top to bottom:

1. **"Back to the menu"** (the Codex: "Back to the list") and, on the same line, the position: "3 of 14 in Entrées" (or "3 of 5 found" under a search), and Critic: a **"Next"** button (44 px, the word alone) at the right of that line. The card is long by design, and stepping through a section to learn it must not mean scrolling past fifteen blocks every time. The named "Previous: …" and "Next: …" stay at the foot (item 15).
2. **The eyebrow**: the section, then "Signature" when the item is a signature, then "86 tonight" when the Table's 86 board holds it.
3. **The name** as the card's heading, and **the price** by `priceLine` (1.2). Critic: the earlier wording ("each as Breakfast & lunch $27 · Dinner $30", "a wine adds by the glass") would have drawn "Breakfast & lunch $13 · Dinner $13" on the Sazerac and "$14 glass by the glass" on the Berres; `priceLine` is the rule. Under the price, in the wing's soft ink, Critic: "Prices as printed on 26 September 2026. Confirm before quoting." (the date is `menusReadOn`; the guide's own first page says "prices as printed then, menus change seasonally, so confirm before quoting"), once per card, never per price.
4. **Say it**: the eyebrow "Say it" and, under it, the kept `say` verbatim. Critic: the house writes the respelling with its word ("Hussarde: hoo-SARD.", "Sazerac: SAZ-uh-rak.", "C.H. Berres: BEH-ress."), so the earlier form "Say it: hoo-SARD." would have needed code that guesses where the word ends, and would have drawn "Say it: C.H. Berres: BEH-ress." on a wine. The value is printed as kept, under its own label. Absent when nothing is kept.
5. **In ten seconds**: the kept `s10`, large (the wing's display face, about 20 px), with a rule at its left.
5a. Critic: **the one-line answer to the question a guest asks next**, directly under the ten second line, so the first screen at 390 by 844 holds what a server needs at the table without scrolling. A dish: "Pour: Brennan's Essential by Piper-Heidsieck Extra Brut NV, $28 glass. Without alcohol: Catalina Island." (the kept pairing's first pick and zero-proof drink, as links under 1.7). A drink: "Offer next: Thompson's Dream $20, Origin Story $40." A wine: "First pick for: Turtle Soup, Eggs Hussarde, Grand Isle Jewel Oysters." Each name is a link or plain words by 1.7; the full blocks below (item 8) are unchanged. Absent when the item has no kept pairing, upsell or first pick.
6. Two toggles side by side, **"Twenty seconds"** and Critic: **"Forty-five seconds"** (hyphenated, as English writes the number; a hyphen is not a dash), each `aria-expanded`, each showing its line beneath when open and reading "Hide twenty seconds" or "Hide forty-five seconds" while open. The kept `guest` follows only when `guestShown`.
7. **About it**: the "Tell me about it." note in paragraphs. When none is kept, the block is absent.
8. **The kind's own block** (1.4).
9. **The five parts**: a two-column `dl` (labels in the wing's eyebrow style in a fixed first column of about 8.5em, values in the reading face); at 390 px both columns stay side by side.
10. **On the floor** (Critic: this heading belongs to the coaching notes alone; the Floor Deck's link group in 1.5 is renamed "In the Floor Deck", so one card never carries two blocks called "On the floor" that mean different things): the coaching notes in `COACH_ORDER`, each a disclosure whose summary is the question; "How do I sell it?" open by default. Under them, when present: **To confirm at lineup** (each ask's question and "ask the sommelier" or whomever it names), **Two sources disagree** (each dispute's two sides with their sources and dates), **Not to be confused with** (each mix-up's other item, as a link to its card, with the kept difference), then **More notes** (a disclosure over `more`) and **Earlier answers** (over `earlier`).
11. **The service note** under the fixed eyebrow "Your words. Allergens: confirm at lineup." When the note is empty, the eyebrow stays and the line under it reads "No service note yet. Ask at lineup."
12. **In this app** (1.5 per wing) and **In the other rooms** (1.4 and 1.7).
13. Three buttons: **"Flash cards for this"**, **"Say it back"**, **"Drill this section"**. Critic: below the section's floor (4.4) the third button is not drawn disabled; it becomes **"Drill the whole menu"** with one plain line under the buttons, "Entrées is too small to drill alone." On Brennan's most wine and drink sections hold one to three items, so a disabled control would sit on most cards in two of the three wings.
14. When any of her unkept marks stand on the item: one line, "Lizzy has written lines here that nobody has kept yet. Edit to look them over."
15. **"Edit"** (quiet, the wing's ghost button), then **"Previous: …"** and **"Next: …"** within the current filter.

Focus moves to the card's heading (`tabindex="-1"`) on open, and back to the row that opened it on Back. One polite live region per wing announces "Showing Entrées: 14 dishes", "3 found for huss", "Nothing matches xyz".

Critic, three rules the walk-through found missing:

- **The sticky bar is hidden while a card is open.** Search and section chips mean nothing on a card, and at 390 by 844 the bar (112 px) plus the Ledger's fixed bottom nav would take a fifth of the screen from the card. Back brings the bar back with the query and the chosen chip as they were.
- **The phone's back gesture closes the card, in all three wings.** The Table does it with shallow `pushState` (2.2.5). The Ledger and the Codex had no history entry for an open card, so the back gesture left the room altogether (from a cross-room link it went back to the Table). The Ledger's rule is in 2.3, the Codex's in 2.4.
- **The In this app block never moves what is above it.** On the Table it fills from lazy loaders; until they resolve it holds one line, "Finding links in this app…", at the block's own position at the foot of the card, so nothing the reader is looking at jumps.

### 1.4 The kind's own block

**A dish: "Pour with it"** (from the kept `pairing`). First pick: the wine's name and its glass price, a link to the bottle in the Codex (1.7), then "Why" (`why`) and the line to say (`sayIt`, quoted). Second choice: the name (a link) and `secondWhy`. Step up: `stepUp`. Without alcohol: the drink's name (a link to the Ledger) and `zeroProofWhy`. A disclosure **"More on the pairing"** holds `whyThisWine`, `palate`, `serve`, `avoid` and the principles as words ("fat, acid, bridge"). When the item is a tasting course: "On the Traditional Breakfast at Brennan's, course 3, with Charles Lafitte Brut, 4 oz" from `lineupFor().tastings`.

**A drink: "The build"**. The Ledger draws its own `ticketHTML(row)` (the spec lines as printed; the importer never invents a quantity, and neither does this card). Under it, in words: "Glass: …", "Method: …", "Garnish: …", each the row's plain field, or "Glass: not printed; confirm with the bar" when empty. Then **"Offer next"**: each kept upsell as a button opening that drink's card, with its price. Then **"Poured with"**: each house dish whose kept pairing names this drink as `zeroProofId`, as a link to the dish in the Table (1.7). The Table and the Codex do not study drinks and draw no drink card.

**A wine: "The wine"**: a `dl` of producer, wine, vintage, region, grapes, style, "By the glass" (the printed price or "Poured on the tastings"), "Bottle" (the printed bottle price, or "Not in the guide: the bottle list is on the restaurant's own page"). Then **The profile** (kept `profile`), **How it is served** (kept `serve`), **What it goes with** (kept `goesWith`; the kept `pairs` follows only when it differs), **First picks** (each kept `firstPickIds` dish as a link to the Table, each with that dish's kept `pairing.sayIt` when the pairing names this wine first, so the line to say travels with the dish), **Also the second choice for** (dishes whose pairing names this wine as `secondId`), and **Poured on** (tasting courses that pour it).

### 1.5 In this app: the links each wing already holds

Every list below is matched by `nameIn` over `itemHay(item)` (or the named fields), ordered by first hit, at most six per group, a group absent when empty. Nothing is hand-mapped.

**The World Table** (loaded on the card's first open through the existing precached loaders `loadDeckIndex`, `loadLexicon`, `loadTechniques`, `loadPrimers` and `loadDetail`, so the `/menu` chunk does not grow by their data):

- **The house's words**: the house lexicon terms whose `itemIds` include the dish, drawn inline (term, kept `say`, kept `toGuest`), not as links: they are the house's. 38 of 62 dishes on Brennan's.
- **In the Floor Deck** (Critic: renamed from "On the floor", which is the coaching block's heading in 1.3): cards whose term or any alias is `nameIn` the hay, each linking to `deckHref(base, card)`, each drawn as the term and, under it, the card's gist in the soft ink, so the reader sees where a link goes before following it. Trial on 3 October: 48 of 62 dishes, 107 links (Eggs Hussarde: Cured, Poached, Bacon, Hollandaise).
  Critic: **that trial list holds a link that misleads.** The deck's Bacon card (fd_0083) is "Pork belly cured with salt and sugar, smoked, then sliced to crisp"; Eggs Hussarde's is coffee-cured Canadian bacon, which is loin, not belly. A server who follows it learns the wrong thing about the signature dish. Two rules, both mechanical: (1) overlapping hits resolve to the longest, so a term or alias "Canadian Bacon" would win over "Bacon" if the deck ever gains one; (2) a one-word term is not linked where, in the unfolded source text, the word directly before it begins with a capital letter and is not the first word of its sentence or list item ("Canadian bacon", "Creole mustard", "Grand Marnier"), because a proper adjective in front of a common noun names a different thing. Rule 2 reads the unfolded text, so `itemHay` keeps an unfolded twin for this test alone. Eggs Hussarde then links Cured, Poached and Hollandaise, and `study-links.test.ts` pins that list exactly.
- **The Lexicon**: entries whose term is `nameIn` the hay, linking to `/lexicon#<slug>`. Trial: 31 of 62 dishes.
- **Techniques**: technique labels and their anchored Lexicon terms `nameIn` the kept `parts.technique` and the description, linking to `/technique/<slug>`.
- **Cook it in the Library**: the dish's own `recipeSlug` when set; else the recipe (guide or family) whose folded name equals the folded dish name; else the longest recipe name of at least two words and eight characters that is `nameIn` the folded dish name. Trial: 2 (World Famous Bananas Foster to Bananas Foster, Pineapple Tarte Tatin to Tarte Tatin). The link goes through `recipeHref()`. When a recipe links, its sommelier ruling (`pairings[detail.pairingId]`) is drawn under the house pairing as **"The Library pairs it with"** (pour, alternative, zero-proof, why), labelled as the Library's and never as the house's.
  Critic: two corrections. The link reads "The Library's Bananas Foster: a recipe to cook, not the house's", because a new server who taps "Cook it in the Library" from a Brennan's card will otherwise take the Library's quantities for the kitchen's. And the Library's pairing names wines Brennan's does not pour; drawn open under the house pairing it puts a second answer to "what do I pour with this?" on the card of a server who must give one. It moves into a closed disclosure at the foot of In this app, "What the Library would pour (not on our list)", drawn only when its pour differs from the house's first pick, and it never reaches a flash card.
- **Read in the primers**: primers whose `cites` hold the linked recipe's slug or a linked Lexicon or technique slug, linking to `/level/<n>/read#<subsection>` with the level's name, never its number.
- **At the table**: the house scenarios naming the dish, each linking to `/menu/quiz?mode=guest&scenario=<id>`.

**The Bartender's Ledger** (all globals already loaded at boot, each read behind `typeof`):

- **The canon**: a `COCKTAILS` drink whose folded name, of at least seven characters or two words, is `nameIn` the folded house name: "It is the canon Sazerac." Else a canon drink whose folded name equals the folded first clause of the house drink's `family` (the text before its first comma): "It comes from the Old Fashioned." Each links to `#/library/<slugify(name)>`. Trial: Brandy Milk Punch, Classic Sazerac, Brennan's Irish Coffee, Brennan's Bloody Mary and Brennan's Champagne Cocktail by name; Bloody Bull, Thompson's Dream, Origin Story, Flamingo and Birdcage by family.
  Critic: the canon's spec is the classic's, and the house's own kept note says to give the classic "as the classic, never as the house build". The line therefore reads "The classic Sazerac is in the Library. Its build is the classic's, not ours." and the card never draws the canon's quantities inline; only the link reaches them.
- **The story**: `LORE[canonName]`, its first two sentences inline and "Read the whole story" to the same library link.
- **Words in the spec**: `GLOSSARY` terms of four or more characters `nameIn` the spec, method, glass, garnish and kept parts, drawn as a `dl` with their definitions (the Classic Sazerac: Bitters, Rinse).
- **The producers**: `PRODUCERS` names of five or more characters `nameIn` the spec and the name, linking to `#/producers/<slugify(name)>`. Trial: Lillet (Niagara Falls), Appleton Estate (Havana), Monkey 47 (Flamingo), Willett (Thompson's Dream).
- **On the shelf as**: the ingredient vocabulary entries the Ledger's own matcher resolves from the spec lines (`reqsOf(row)`, `reqLabel`), as labels with their kind, and one door "See what the bar stocks" (`data-act="menu-view" data-v="stock"`).
- **The house's words** and **At the table**, as on the Table, the scenarios opening Guest at the table on that scenario (`houseDrillOpen('guest')` then the scenario chosen).

**The Sommelier's Codex** (globals already loaded; every one read behind `typeof`, and absent at the current level means absent from the card):

- **The grapes**: each of the wine's grapes whose fold equals a `GRAPES` or `GRAPES_PLUS` profile's `g`, drawn inline: the structure line (`st`), the tell, and what it is confused with. Trial: 16 of 20 wines.
- **The region**: the `TERROIR` region whose fold equals a comma part of the wine's region, or is `nameIn` it: climate, soil and the note, inline. Trial: 9 of 20.
- **The primer**: the current level's `PRIMERS` chapter whose `cat` is `nameIn` the folded region, else the chapter `MAP_REGION_SEC` names for a matched region; the link sets `S.primerKey` and `S.view = 'primer'`. Trial: 18 of 20 by the first rule alone.
- **The map**: the sheet whose regions (`mapRegions(id)`) include the matched region, shown only when `v25MapSheets()` holds it; the link sets `S.wmap` and `S.view = 'worldmap'`.
- **The producer**: the `WINE_PRODUCERS` record whose fold equals the wine's producer, or within which the producer's fold (six or more characters) is `nameIn`; the link sets `S._prod = { c, id }` and `S.view = 'producers'` exactly as codex25 does at its search (line 963). Trial: Domaine Leflaive, Maison Louis Jadot, Inglenook.
- **The house's words** and **At the table**, the scenarios opening Guest at the table.

The trial figures above came from these rules run by hand on 3 October. Each wing's test pins a floor just under them (section 7), and the engineer records the real figures in that wing's CLAUDE.md when the code lands.

### 1.6 Records, progress and the weak deck, per wing

Each wing reads its own records; nothing new is stored about a person, and nothing here touches a level.

| Wing | A flash card answer writes | `latest` per item is |
|---|---|---|
| Table | `markDrilled(drilledKey(houseId, itemId, 'card-item'), got ? 'met' : 'missed')` into `oot-house-drilled-v1` | the newest entry for `house:<houseId>:<itemId>:` of any kind: `met` or `close` is got, `missed` is again |
| Ledger | `gradeCardKey(cardKey(row), got)` on `'My Bar · ' + name`, the existing SRS record | again when the card meets the existing trouble rule (`s.w > 0 && (s.w >= s.r * 0.5 \|\| lapses >= 2)`); else got when `r + w > 0`; a `progress.house.say` entry for the id counts as studied |
| Codex | `v27RecordHouse('h-' + id + '-card', 'Our List', name, got)` | again when any `h-<id>-*` key holds `w > 0` and `s === 0`; else got when `c + w > 0` |

The header's progress line is `studyProgress` in words (section 9). "My weak ones" is the deck of `againIds`.

### 1.7 Deep links and the links across the rooms

**The scheme.**

| Target | Address | Read where |
|---|---|---|
| A dish in the Table | `/table/menu#d-xxxxxxxx` (the dish id itself, `d-` and eight base36 characters) | the existing `hashed` effect in `/menu/+page.svelte`, which now also waits for `house.api.ready()` |
| A drink in the Ledger | `/ledger/#drink=b-xxxxxxxx` | `houseStudyDeepLink()` in the new `js/house-study.js`, called once from the boot block in `js/app.js` immediately before `applyRoute()` |
| A wine in the Codex | `/codex/#wine=w-xxxxxxxx`, and `/codex/#list` for the list itself | `js/codex28.js` at script load |

Each reader: inside `try`; `typeof location !== 'undefined'` first; the id matched by `/^[dbw]-[a-z0-9]{8}$/` and nothing looser; a miss writes nothing and opens nothing. Once read, the hash is replaced (`history.replaceState`, itself guarded) by the wing's own form: the Table by `#d-…` left as it is (it is the Table's canonical card address), the Ledger by `#/menu` (so `applyRoute` and `syncRoute` own it from there), the Codex by an empty hash. When the item is not there yet (the house's first sync is asynchronous), the id is held and tried again after the wing's next sync (`houseApplyChanges` in the Ledger, `v27Apply` in the Codex, `house.current` changing in the Table) and dropped after the first sync that does not find it. The Table keeps `#dish-<id>` (the producers page's anchor): in the study view it opens the same card.

Critic: **the Ledger already has a route for a drink, and it opens the editor.** `applyRoute()` (`js/ui-new.js`) reads `#/menu/<slugify(name)>` and sets `state.menu.open` with `state.menu.pane = 'build'`, and the Ledger's own global search points every house drink at that address. Left alone, a search for "sazerac" in the Ledger opens today's five-pane editor, the screen the owner called not user friendly. So in the Ledger: while `houseStudyOn()`, the `menu` branch of `applyRoute` sets `state.menu.study.open` to the drink's id instead (and `state.menu.study.open = null` for `#/menu` alone); `currentRoute()` writes `#/menu/<slug>` for an open study card, so `syncRoute` keeps the address honest; and `hs-open` writes that address with `history.pushState` (guarded) before rendering, so the existing `hashchange` listener closes the card on the back gesture. `#drink=<id>` stays as the cross-room address, because an id survives a renamed drink and a slug does not; once read it is replaced by `#/menu/<slug>` of the drink it found, not by `#/menu`.

**When a cross-room link is drawn.** Only when all three hold:

1. The page is on the suite's shared origin: the Table when `sharedOrigin(base)` (`desk-share.ts`), the Ledger when `location.pathname` starts with `/ledger` (the precedent in `ui-import.js`), the Codex when it starts with `/codex`. A standalone build draws no cross-room link, because another origin's storage cannot be known to hold the item.
2. The target item is in the current house (`house.wines`, `house.cocktails`, `house.dishes` by id). The rooms share the one house, and each projects its own kind on boot, so an item in the house is an item that room will open.
3. The network is up, or the target room is installed on this device: `wingInstalled(wing)` resolves true when `caches.keys()` holds a name beginning `oot-ledger-` or `oot-codex-`, or, for the Table, a Workbox precache name containing `/table/`. Offline and not installed, the name is drawn as plain text followed by "(open the Codex once online and it stays with you offline)", in the room's own name.
   Critic: a cache NAME proves only that a worker began to install, not that the room will open: an install interrupted on a weak signal leaves the name and no shell, and the link then leads offline to the browser's error page, the one broken link this rule exists to prevent. `wingInstalled` asks instead for the room's own entry point: `caches.match(url, { ignoreSearch: true })` resolving a response for `/ledger/index.html` (or `/ledger/`), `/codex/index.html` (or `/codex/`), and `/table/shell.html`, the Table's navigation fallback (CLAUDE.md, "The offline shell ships as shell.html"). `ignoreSearch` because Workbox keys carry a revision parameter. The answer is read once per page and kept; a link drawn on it is drawn only after it resolves, so no link appears and then turns to plain text.

**The links.** A dish's first pick and second choice open the bottle in the Codex; its zero-proof drink opens in the Ledger. A drink's "Poured with" dishes open in the Table. A wine's first picks, second-choice dishes and tasting courses open in the Table. The header's counts of the other rooms ("23 drinks in the Ledger", "20 wines in the Codex") open those rooms' study views (`/ledger/#/menu`, `/codex/#list`, `/table/menu`).

`src/lib/wing-links.ts` (Table, pure apart from `wingInstalled`) and the same few lines in `js/house-study.js` and `js/codex28.js` build these: `roomHref(room, id)` returns the address above or `''`, and every caller draws a link only for a non-empty address.

## 2. The study view

### 2.1 The anatomy at 390 by 844

```
[ the wing's own masthead and nav, unchanged                    ]
  Brennan's                                     <- h2, the house
  Menus read 26 September 2026 · 62 dishes ·
  23 drinks in the Ledger · 20 wines in the Codex
  31 of 62 studied · 24 got it last time · 7 again
  [ Flash cards ] [ My weak ones (7) ] [ Drill the menu ]
  [ Edit the menu: off ]
  Not backed up yet. Export from Session and tools.   <- one quiet line, Table only
+--------------------------------------------------------------+
| [ Find a dish....................................... ]        |  <- sticky
| [All 62][Starters 8][Soups 2][Salads 1][Entrées 14][Si>      |  <- one row, scrolls in itself
+--------------------------------------------------------------+
  ENTRÉES · 14                              [ Flash cards ]
  Eggs Hussarde                                         $27
  Poached eggs, coffee-cured Canadian bacon and our own
  English muffins, with hollandaise and marchand de vin.
  ------------------------------------------------------------
  Eggs Sardou                                           $26
  ...
```

- Critic: **the anatomy above is drawn on the Table, and in the other two wings it does not fit.** The Ledger's and the Codex's mastheads (the painted hero, the nav, "Back to Mine" and the Ledger's three sub-tabs) take about 310 px of the 844 before the study header begins, and the Ledger's fixed bottom nav takes another 64. Header (about 290 px) plus the sticky bar (112) puts the first dish row below the fold in the Ledger, so on first open the owner would see buttons and no menu. The rule is now measured, not described: **on a fresh load at 390 by 844, the top of the first row is inside the viewport less any fixed bottom nav, in all three wings**, and each wing's check asserts it. To get there: the switch leaves its own row and sits at the right of the house's heading as a quiet 44 px text button ("Edit the menu"; the state "on" is said by the editing screen itself, which shows "Edit the menu: on" at its top); the facts are one line (the other rooms' counts move to the foot of the list as "Also in the house: 23 drinks in the Ledger, 20 wines in the Codex"); the three buttons are one row, "Flash cards" first; the shift filter (1.1) shares the row with the progress line when it fits and wraps under it when it does not. In study mode the Ledger hides "Tell it what the bar stocks" (it lives behind Edit and in The stock) and the Codex replaces its editing lede ("Enter it bottle by bottle and drill it like the Court's") with the one list sentence of 2.4.
- **The header** is short by rule: the house as the section heading, two lines of facts, the progress line, one row of three buttons and the switch. The date is `menusReadOn` formatted `toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })`, the ISO string when the call throws. The other rooms' counts are links (1.7) or plain words.
- **The sticky bar** holds the search box (a labelled `input type="search"`, 44 px, placeholder "Find a dish", "Find a drink" or "Find a wine") and, below it, one row of section chips: "All 62" first, then each section with its count. The row scrolls sideways inside itself (`overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x proximity`), so the page never scrolls sideways; the chosen chip is filled, carries `aria-pressed="true"`, and is scrolled into view; the live region says what is shown in words. The bar is about 112 px tall at 390.
  Critic: **the shared OOT badge sits on top of it.** `shared/oot-bar.js` fixes its host at `top: 10px; left: 10px` (plus the safe-area insets) at `z-index: 45`, a 44 px disc; the screenshots show it over the Ledger's and the Codex's first lines. A bar stuck at `top: 0` (the Ledger, the Codex) would lose the first 54 px of the search box, placeholder included, under the badge. In those two wings the bar's first row reserves `padding-left: calc(64px + env(safe-area-inset-left, 0px))` and `padding-top: env(safe-area-inset-top, 0px)`, and each wing's check asserts that `document.elementFromPoint` at the input's left text edge, after scrolling 3,000 px, returns the input. The Table's bar sticks under its modebar, below the badge, and needs no inset. Chips are listed in the house's order, so the Table's row opens on "Tasting menus 4", not "Starters" as the sketch shows; the row's last visible chip is cut by the edge on purpose, which is what tells a thumb the row scrolls.
- **Each section** opens on its heading in the wing's eyebrow style with its count, and a "Flash cards" button for that section at the right (44 px).
- **Each row** is one button, full width, at least 56 px: the name in the wing's display or reading face (about 18 px), the price right-aligned in tabular figures, the short line below in the wing's soft ink clamped to two lines (`-webkit-line-clamp: 2` with `display: -webkit-box`). Words on the row, never colour: "Signature" as a small eyebrow before the name, "86" and the name struck for a dish on the 86 board, "Again" as a small tag when the item is in `againIds`.
- **Below the sections**, a closed disclosure per house list the wing already shows in its read view: "Must-knows (29)", "The words (123)", "At the table (34)", "Mix-ups (7)", "The tastings (2)", each read-only and kept-only. In the Table this is `HouseLists` with a new `mode="study"` prop; in the vanilla wings it is one door, "The house: must-knows, words and the table", opening the existing `OOT.houseUI.readView`.
  Critic: **`readView` as it ships would bring the clutter back.** `markRow` in `static/shared/oot-house-ui.js` draws the eyebrow "Kept" over every kept mark and, for a mark of hers, "Hers, not yet kept" with Keep, Edit and Discard: the wall of the Codex screenshot, and a breach of "only kept marks are shown". `readView` gains a fourth argument, `opts`, and `readView(root, house, hooks, { study: true })` skips every unkept mark, drops the "Kept" eyebrow and draws no chip; without `opts` it draws exactly what it draws today. The file is written in WorldTable (`static/shared/`), held by `tools/check-house-ui.mjs` (a study case added: no "Kept", no "Hers", no `data-h` chip in the output), and mirrored to the site byte for byte like every oot-house script.

### 2.2 The World Table

**Files.** `src/lib/components/StudyMenu.svelte` (the header, the bar, the sections and rows), `src/lib/components/StudyCard.svelte` (the card), `src/lib/components/StudyLinks.svelte` (the In this app block, which calls the loaders on mount and resolves through `src/lib/study-links.ts`, pure and tested), `src/lib/wing-links.ts`. `/menu/+page.svelte` changes as below; no other route changes but `/menu/quiz` (section 4.1) and the layout's offline notice (2.2.4).

**2.2.1 The page when a house is current and Edit is off.**

1. The h1 "My Menu" stays (the outline check needs it); the lede becomes "The menu to learn before service, dish by dish." while a house is current.
2. `<StudyMenu>`, then the read-only house lists.
3. **"Session and tools"**, a closed disclosure holding, unchanged, the tools row (Export session, Import session, Print, Guest menu, The Maître d', Ask the Maître d'), the kitchen's links (Cost this menu, Preps, Producers, The prep board, The waste log, Drill this menu, The coverage board, The Repertoire, The firing drill), `HouseBar` (all its doors) and `HouseCard`.
4. **"Plan a menu from the Library"**, a closed disclosure holding today's planner whole (stats, courses, the shopping list, The Pass, The Cellar), with its count in the summary ("Plan a menu from the Library (3 pinned)"). Its empty prompt "Nothing pinned yet" is shown only inside it. The planner markup becomes a snippet rendered either here or in its place today, so nothing in it is copied.
5. The export reminder becomes one quiet line at the foot of the study header through a new `quiet` prop on `ExportNudge` (no box, `--ink-soft`, never stacked opacity): "Not backed up yet. Export from Session and tools." or "Last exported 3 days ago, and the menu has changed since." Its words keep their meaning; only the frame goes. Critic: the line points into a closed disclosure, so on its own it sends the reader hunting. "Session and tools" in it is a 44 px text button that opens the disclosure, scrolls it into view and moves focus to "Export session".

**2.2.2 The page with Edit on, or with no house**: exactly today's page, markup and order unchanged, with one addition when a house is current: the switch at the top, reading "Edit the menu: on" and returning to the study view. Each dish in the editing list gains nothing.

**2.2.3 The per-item Edit.** The card's "Edit" turns the switch on, then after `tick()` calls today's `editDish(d)` and scrolls the dish form into view (it opens where "Add a dish" sits today). Saving or cancelling the form leaves the switch on; the person turns it off.

**2.2.4 The offline notice.** "Ready to cook offline: the whole guide is on this device now." leaves the dock. `UpdatePrompt.svelte` splits: the Reload prompt (it asks for an act) stays docked; the offline-ready notice renders in normal flow as one line directly under the modebar in `+layout.svelte`, with "Good" (44 px), dismissed by Good or after eight seconds. While the dock holds anything, `main` pads its foot by `--dock-h` (the footer already does), so the last rows scroll clear of it.

**2.2.5 State.** `editMode` (component state, default false), `studyQuery`, `studySection` (`''` for All), `openId` (the card shown). Opening a card calls SvelteKit's shallow `pushState('#' + id, { study: id })` so a phone's back gesture closes it; `page.state.study` drives `openId`; a cold `#d-…` sets it directly once the house is read. Before `house.api.ready()` resolves, the study slot holds one line, "Opening the house…", so the prerendered page and the first hydrated paint agree and the planner prompt never flashes above the house.

Critic: **the round trip to the flash cards lost the reader's place.** "Flash cards" and "Drill this section" navigate to `/menu/quiz`, and coming back remounts `/menu` with `studyQuery`, `studySection` and the scroll at their defaults: she leaves Entrées to drill it and comes back to the top of Tasting menus. `/menu/+page.svelte` exports a SvelteKit `snapshot` (`capture` returns `{ studyQuery, studySection, openId }`, `restore` puts them back), which SvelteKit replays on a back navigation and drops on a fresh one, and SvelteKit's own scroll restoration then holds. In `/menu/quiz`, "Close the deck" and the end screen's way out call `history.back()` when the previous entry is this app's `/menu` (a flag set by the study view's buttons in `page.state`), and `goto(base + '/menu')` otherwise, so a cold `/menu/quiz` link still has a way home.

**2.2.6 Style.** Scoped Svelte styles using the tokens only: the bar `position: sticky; top: var(--modebar-h, 0px); z-index: 30; background: var(--paper); border-bottom: 1px solid var(--line)`; rows `border-bottom: 1px dotted var(--line)` (the dish list's rule today); names `font-family: var(--display)`; eyebrows the existing `.eyebrow`/`.sec` look (`--t-micro`, `--tracking-eyebrow`, uppercase, `--muted`); chips the page's `.chip`, with `min-height: 44px`; the chosen chip `background: var(--accent-solid); color: var(--on-accent)`; the ten second line `var(--display)` at 1.25rem with `border-left: 2px solid var(--turmeric-deep)`; the card on `var(--card)` with `var(--shadow-card)`. Both day and night token sets apply untouched.

**2.2.7 The cap.** The study components and `house-study.ts` are expected near 10 KB gzipped; the library data comes through existing lazy chunks. `npm run verify:build` prints the live figure against the 3.0 MB cap; the engineer records it in the commit message. If it does not fit, the desk-vocab release valve in CLAUDE.md is the one lever.

### 2.3 The Bartender's Ledger

**Files.** New `js/house-study.js` (loaded after `js/house-bar.js` and before `js/app.js`; identical in both trees; dash-free; names nobody; every `OOT` read behind `typeof`, so `check-import.mjs` and `load-wing.mjs` load it with no `OOT`), new `css/house-menu.css` (after `css/house.css`), both in `index.html` with `?v=1` and in `sw.js` `ASSETS`. One-line hooks: `renderMenu()` in `js/ui-menu.js` draws `houseStudyHTML()` in place of `menuListHTML()` when `houseStudyOn()`; `js/app.js` sends every `act` beginning `hs-` to `houseStudyAct(act, el.dataset)` and calls `houseStudyDeepLink()` before `applyRoute()`; `houseAfterRender()` in `house-bar.js` calls `houseStudyAfterRender()`, which wires the search box.

**State.** `state.menu.study = { q: '', sec: '', open: null, editAll: false, deck: null }`, defaulted in the boot block. `houseStudyOn()` is `houseHere() && current house has cocktails && !state.menu.study.editAll && (state.menu.view || 'menu') === 'menu'`.

**The view.** The three sub-tabs (The menu, The stock, Add drinks) stay above. The header is a `.panel.p5`: the house as an h2 in the reading face, the facts as `.small .dim`, the progress line, then `.btn.btn-brass` "Flash cards", `.btn.btn-ghost` "My weak ones (n)" and "Quiz the list", and the switch `.chip` "Edit the menu: off". The sticky bar is `div.hs-bar` (felt-2 background, brass hairline under it, `top: 0`). Rows are `button.hs-row` inside one `.panel` per section, the name in the reading face in cream, the price in `var(--brass-2)`, the short line `.tiny .dim`. Section headings are `.eyebrow`. The bottom nav is fixed, so the view ends with padding equal to its height, as the other views do.

Critic: **"Quiz the list" and "Drill this section" land on a paid tab.** On the site `LEDGER_FREE_TABS` holds `menu` but not `quiz` or `flashcards`, so both buttons, as specified, open the Ledger's quiz and meet the lock, with no warning, on a free account. Until decision 10.1 is taken the buttons stay (a free account sees the paywall's own words, which is the site's rule: "the locked drill is the pitch"), but each says where it goes, "Quiz the list (the Quiz tab)", so the owner is never surprised by a different screen, and the in-tab deck (4.2) and Say it back (`houseDrillOpen('say')`, drawn inside the Menu tab) stay free in the Menu tab.

**The search box** (`id="hs-q"`) repaints only `#hs-rows` on input, the batch-out pattern in `app.js` (a `render()` per keystroke would take the focus); it is read into `state.menu.study.q` and is not added to `captureLiveInputs`, because no act reads it.

Critic: **a full `render()` throws away the scroll and the focus.** The Ledger repaints the whole tab with one `innerHTML`, so "the list's scroll position is kept and restored on Back" and "focus back to the row" (1.3) do not happen by themselves. `hs-open` saves `window.scrollY` into `state.menu.study.y` before it renders; `houseStudyAfterRender()` scrolls to the top of the card on open, and on Back (`hs-back`, or the `hashchange` from the back gesture) scrolls to `state.menu.study.y` and focuses `[data-act="hs-open"][data-id="<id>"]` with `{ preventScroll: true }`. The address and the back gesture are in 1.7.

**The card** replaces the list inside the Menu tab; its heading is an h2. The build block uses `ticketHTML(row)`. "Edit" sets `state.menu.study.editAll = true`, `state.menu.open = id`, `state.menu.pane = 'build'`, so today's drink opens on its Build pane inside today's list. The switch "Edit the menu" sets `editAll` and shows `menuListHTML()` unchanged; it reads "Edit the menu: on" there.

**Acts**: `hs-open` (data-id), `hs-back`, `hs-prev`, `hs-next`, `hs-sec` (data-s), `hs-clear`, `hs-toggle` (data-l `s20` or `s45`), `hs-edit` (data-id), `hs-editall`, `hs-cards` (data-s or data-id, or data-weak), `hs-say` (data-id: `houseDrillOpen('say')` then `houseSayPick(id)`), `hs-drill` (data-s), `hs-guest` (data-id, the scenario), `hs-house` (the read view door), and the deck's `hs-flip`, `hs-got`, `hs-again`, `hs-close`.

### 2.4 The Sommelier's Codex

**Files.** New `js/codex28.js` (after `codex27.js`, before `boot.js`; top-level `var` and `function` only; dash-free; no glyph at or above U+2190; no "practise" or "practice"; British spelling; loads with no `OOT` and with no `location`), new `css/house-list.css` (after `css/house-study.css`), both in `index.html` and `sw.js` `ASSETS`; `CACHE` bumped. The CLAUDE.md's layer rule names codex28 as the next layer; codex27 changes in one place only, its `V27_DEFAULT_PACK` constant (section 6.3).

**What codex28 does, at load:**

1. Reads `#wine=` or `#list` into `V28_WANT` (1.7).
2. Wraps `cellarView`: `var _v28CellarView = cellarView; cellarView = function () { return v28StudyOn() ? v28StudyView() : _v28CellarView.apply(this, arguments); }`. `v28StudyOn()` is `v27Current()` holding wines and `!S._v28edit`. The wrapped call is today's list with codex27's rows, unchanged.
3. Wraps `render` to honour `V28_WANT` once the house holds the wine (`S.view = 'cellar'`, `S._v28 = { open: id }`), and to draw the deck view `S.view === 'housedeck'`.
4. Declares the top-level functions `startHouseDeck(scope)` and `startHouseSectionDrill(section)` as `function` declarations (a lock wrap can see them on `window`; see section 8).
5. Registers one row in `V25_MINE`, `V25_GO`, `V25_AREA` and `V25_HUB`: `ourlistcards`, "Flash cards: our list", line "every wine on the list, front and back".

**The view.** `.viewhead` with h2 "Our List" and the sub "Brennan's · menus read 26 September 2026", then one plain line: "By the glass, as the server guide prints it: 20 wines, 14 with a glass price and 6 poured on the tastings. The full bottle list is not in the guide." (the counts computed from the house, the sentence fixed). Then the progress line, the buttons (`.btn.gold` "Flash cards", `.btn.ghost` "My weak ones (n)", "Drill the list", "Say the pour"), the switch (`.btn.ghost`, "Edit the list: off"), the sticky bar, and the rows. Rows are `button.v28-row`: the name in `--house-reading` at 1.1rem in `--parch` (Cinzel capitals wrap a long cuvée name to three lines at 390, so the name is in the reading face and Cinzel small caps carry the section headings and the price tag), the price in `.lvltag`, the short line in `--gold-soft` at .95rem. Section headings are `.secgroup` in `--house-display` small caps. On the dark page only the dark-page tokens are used (`--parch`, `--gold`, `--gold-soft`), and anything inside a `.card` uses `--ink` and `--ink-soft`, by the contrast rule.

**The card** is drawn in the view (no `.card` frame for the body, so the dark-page tokens hold; the ten second line sits in a `.card` parchment block where `--ink` holds). "Edit" sets `S._v28edit = true` and `S._cellarEdit`/`S._cellarForm` exactly as codex12's own `data-cl-edit` handler does, so today's form opens on that bottle. "Edit the list" sets `S._v28edit = true` alone. "Say the pour" calls `v27OpenSay()` then `v27SayPick(id)`.

Critic, three Codex rules the walk-through needed:

- **The back gesture.** The Codex reads no location and keeps no history, so a phone's back from a wine card left the Codex (from a Table link, back to the Table, with the card's place lost). codex28 calls `history.pushState({ v28: id }, '')` (guarded by `typeof history` and `try`) when a card or the deck opens, and one `popstate` listener, attached at load behind `typeof window`, closes the card or the deck when the state it pops to holds no `v28`, restores the list's scroll (`S._v28.y`, saved on open, because `render()` repaints the view whole) and focuses the row. The deck's own steps push nothing, so back from card nine of a deck closes the deck, not one card.
- **"Drill the list" is codex27's house drill, never `startCellarDrill`.** On the site, `shared/oot-locks.js` wraps `startCellarDrill` and `startCellarRecite` behind the `cellardrill` boundary, which is paid; codex27's house drills are not wrapped and are free. The study header's "Drill the list" therefore calls codex27's own house round (the `v27HouseQs` kinds through the Codex's quiz engine, as `startHousePairDrill` does), and nothing in codex28 calls either wrapped function. Whether the house deck and the section drill stay free is decision 10.1; the "see section 8" in item 4 above meant that decision, and the reason the two entry points are `function` declarations is that `oot-locks.js` can only wrap a name it finds on `window`.
- **The row's short line**: `--gold-soft` at .95rem is under the 16 px floor (0.4); it is 1rem, and each Codex check asserts its contrast on the dark page.

## 3. The detail card per wing: what is specific

The order is 1.3 for all three. What differs per wing is the art (2.2 to 2.4), the kind's block (1.4), the In this app block (1.5) and the three action buttons' targets:

| Button | Table | Ledger | Codex |
|---|---|---|---|
| Flash cards for this | `/menu/quiz?mode=cards&item=<id>` | `houseStudyDeck({ itemIds: [id] })` | `startHouseDeck({ itemIds: [id] })` |
| Say it back | `/menu/quiz?mode=say&item=<id>` | `houseDrillOpen('say')`, `houseSayPick(id)` | `v27OpenSay()`, `v27SayPick(id)` (the button reads "Say the pour") |
| Drill this section | `/menu/quiz?mode=drill&section=<name>` | a `mybar` quiz round over the section (4.4) | `startHouseSectionDrill(section)` |

`/menu/quiz` reads `item`, `section`, `deck` (`weak` or `parts`) and `scenario` through a new pure `studyScopeFromSearch(search)` in `src/lib/house-drill-round.ts`, seeded in `afterNavigate` like `mode`, never in `load`.

## 4. Flash cards from the menu

### 4.1 The Table: `/menu/quiz?mode=cards`

- With a current house holding kept lines, `cards` mode deals **the item deck** (`itemCards`) by default. A chip row above it: "Whole menu (62)", each section with its count, "My weak ones (7)" (disabled with "none yet" when empty), and "Part by part", which is today's `buildFlashcards` deck unchanged (parts, lines, terms, mix-ups, pairings as separate cards).
- `section=<name>` chooses the section; `deck=weak` the weak deck; `item=<id>` deals that item's card followed by its part-by-part cards (`buildFlashcards(current)` filtered to `itemId`).
- **Front**: the eyebrow "Card 3 of 14 · Entrées · hidden" (the existing pattern), the name as the term, "Say it, then flip." **Back**: "In ten seconds" and the line; the parts as a two-column `dl`; "First pick" and "Without alcohol" with the names; "Say it" and the respelling. "Got it" and "Again" (44 px); the running count "Got it 5 · Again 2".
- At the end: "Deck complete", the count, "Again: the 2 you marked" (a deck of this sitting's Again cards), "Shuffle again", "Close the deck". `markStudied()` once per finished deck, as today.
- Critic, **the card itself, in all three wings.** "Say it, then flip." does not say what to say; the front reads "Say the ten second line aloud, then flip." The whole front face is one button (Flip), at least 240 px tall, so a thumb anywhere turns it. "Got it" and "Again" are not drawn until the card is flipped, so a stray tap never grades a card nobody read; once flipped they sit side by side at the foot of the card, each at least 56 px tall and half the width, Again on the left, above the Ledger's fixed bottom nav. The back is cut for arm's length: the ten second line at 20 px, then the price by `priceLine`, then the pairing line, then the parts; the parts sit in a closed disclosure "The five parts" on the back, because five label and value pairs push Got it below the fold at 390 by 844, and the check asserts Got it is in the viewport after Flip. The existing study-mode chip on `/menu/quiz` keeps its art; the new item deck adds no glyph of any kind.
- Records as 1.6, kind `card-item` for item cards; part cards keep `card-<kind>` as today.

### 4.2 The Ledger: its flashcards engine with a house scope

- `FC_MODES` in `js/ui-study.js` gains one row after `upsell`: `['study', 'The house card', 'Name and section on the front. The line, the five parts and what to offer next on the back.', fitsHouse('study')]`, where `houseCardFits('study', d)` is `d.src === 'My Bar' && hasKeptLines(d)`, and `houseCardBackHTML('study', c)` in `house-bar.js` draws the back from `itemCards`.
- `state.fc` gains `section: 'All'`; `fcPool()` filters a `My Bar` card by the house item's section when it is not `'All'` (named in `fcPool`, defaulted in `engine.js`, read nowhere else). The Flashcards tab's setup shows a section select when the source is the menu.
- The study view's buttons do not leave the Menu tab: `houseStudyDeck(scope)` builds the deck by the dueN pattern in `renderFlashcards` (set a temporary `state.fc` of `{ src: 'My Bar', mode: 'study', section, special: weak ? 'trouble' : 'All' }`, call `fcPool()`, restore), keeps it in `state.menu.study.deck`, draws the card inside the Menu tab with the same back, and grades through `gradeCardKey(cardKey(card), got)`, the engine's own record. So a card turned in the Menu tab and the same card in the Flashcards tab are one SRS record.
- My weak ones is the `trouble` special over the house drinks.

### 4.3 The Codex: a new deck in codex28

- `startHouseDeck(scope)` sets `S._v28deck = { ids, idx: 0, flipped: false, got: 0, again: 0, label, missed: [] }` and `S.view = 'housedeck'`. Scopes: the whole list, a section, one wine, the weak ones.
- The view uses the Codex's flashcard look (the active face only exposed to assistive technology, as codex26 does; controls above the card); the front is the wine's name and section in a `.card` parchment frame; the back is `itemCards`' back. "Got it" and "Again" record through `v27RecordHouse` (1.6), which codex27's `keyOwned` wrap already keeps out of every level, readiness figure and exam, and whose pace, history and perfect-round side effects codex27 already puts back.
- The end screen: the count, "Again: the 2 you marked", "Shuffle again", "Back to the list".

### 4.4 Drill this section, and its floor

A section drills when it holds at least four items with what the round needs (the Table's and the Ledger's quiz floor is four; the Codex's drill is three bottles, and its house kinds deal four options from the whole list). Below that, the button is disabled and says so: "Drill this section: needs 4 dishes, 2 here." with "Drill the whole menu" beside it. The section round deals the whole house's pool and keeps the questions whose item is in the section (`dealSection(house, kinds, section, length, rand)` = `dealRound(house, kinds, null, rand)` filtered by item and cut to the length), so distractors still come from the whole house. The Ledger narrows `buildRound('mybar')` by `state.quiz.section` the same way; the Codex's `startHouseSectionDrill` runs codex27's cellar kinds (`v27HouseQs`) filtered to the section's wine ids through the Codex's own quiz engine, as `startHousePairDrill` does.

## 5. The content: descriptions and coaching

### 5.1 Where it is written, and how it ships

All of it is house content in the pack, written once in WorldTable and mirrored to the site, never typed into a wing.

- `tools/house/brennans/notes.json`: `{ about, entries: [{ target, q, a, sources, why? }] }`. `target` is `dish:<ledger slug>`, `cocktail:<ledger slug>` or `wine:<ledger slug>` (the slugs in `ids.ledger.json`). `q` is one of `FIXED_QS`, character for character.
- `tools/house/brennans/rewrites.json`: `{ about, entries: [{ target, field, was, value, why, sources }] }`. `field` is a path the builder already writes (`lines.s10`, `lines.s20`, `lines.s45`, `guest`, `parts.sides`, `parts.taste`, `profile`, `goesWith`, `serve`, …). `was` is the value the build produces today; the builder runs `was` through the same spelling and dash pass before comparing, and a rewrite whose `was` no longer matches fails the build (a stale rewrite never lands on new text). `why` is one of the thin codes in 5.4.
- `build-brennans.mjs` applies, in order: the parsed guide, `overrides.json`, `rewrites.json`, `notes.json`, the spelling map, the dash pass. Every changed string still lands in `dash-log.json` and `spelling-log.json`.
- `sources` name where each fact came from: `guide:<from>-<to>` (line numbers in `guide.txt`), `page:<file>` (a file in `pages/`), `research:<file>#<heading>` (a file in `research/`), `fact:<id>` (an id in `research/verified-facts.json`), Critic: `deep:<file>#<name>` for a record in `research/deep-2026-10-03/` whose refuter verdict is `held` (an `unverifiable` or `refuted` record is never a source, and `validate-notes.mjs` reads the verdict, not the sweep), or `app:<room>:<id>` for the apps' own reference entries (a Codex producer id, a Ledger `LORE` key, a Table Lexicon slug), which are sources like any other.

### 5.2 About it: the note "Tell me about it."

One per dish, drink and wine: 105 notes. The answer is what a master would tell a new server who asked, 120 to 200 words, in paragraphs, in this order wherever the sources hold it:

1. **What it is**, in one sentence: the name, what kind of dish, drink or wine it is, and its place on the menu.
2. **How it is made**: the technique and the components; for a drink, the build as printed and never a quantity the house did not print (a classic's proportions may be given only as the classic, never as the house build, as the Sazerac's kept note does); for a wine, the method, oak, lees and sweetness as sourced.
3. **What is on the plate or in the glass**: what the guest sees, garnish, vessel, anything done at the table.
4. **How it tastes and feels**: texture, temperature, weight, balance; for a wine, acid, body, tannin and finish.
5. **Where it comes from and its story at Brennan's**: the origin, the person credited and the year only when a cited source states them.
6. **What makes it special here**: made in house, a signature, sourcing, the pairing it was chosen for, Coravin, the tasting it anchors.

Voice: plain, warm and concrete, present tense, "we" for the restaurant, no "I". Banned: "delicious", "amazing", "perfect", "decadent", "to die for", "mouthwatering", "elevated", "unique", "world-class" (the dish's own name "World Famous" stands), and any allergen statement (5.6).

### 5.3 The coaching notes: fixed questions

| Question (exact) | Dishes | Drinks | Wines | Words | What it must hold |
|---|---|---|---|---|---|
| How do I sell it? | required | required | required | 50 to 110 | when to suggest it (the meal, the moment, the course), to whom (a first visit, a celebration, a guest who likes something named), with what (the house pairing or upsell by name), and one sentence to say, quoted, of 25 words or fewer |
| What do guests ask? | required | required | required | 60 to 140 | two or three pairs, each two paragraphs beginning `Asked: ` and `Answer: `; every answer true to the sources; an answer the sources do not hold says "I will check with the kitchen" (or the bar, or the sommelier) and the item carries a matching lineup ask |
| What should I watch for? | required | required | required | 40 to 110 | the mix-up partner by name when one exists, timing (fire times, tableside service, a doneness the kitchen must confirm), any minimum or party-size rule, every dispute and lineup ask tied to the item in a sentence each, and the closing sentence, fixed: "Allergens: read the service note and confirm at lineup." |
| How do I pour it? | never | when the guest watches it poured or finished (the coffee service, the Champagne cocktails, anything topped or flamed at the table) | required | 40 to 110 | presentation (show the label and say the name as the kept `say` has it), temperature, glass, the pour as printed (4 oz on the tastings), opening (cork and cage held together; the Coravin as sourced), the host served last, and one line to say while pouring, quoted, of 20 words or fewer |

So a dish carries three coaching notes, a drink three or four, a wine four: inside the three to five the brief allows, and alike across every item. The card draws them in `COACH_ORDER` as disclosures under "On the floor" (1.3), the first open.

### 5.4 Thin lines, rewritten

A guest-facing line is thin, and goes on the rewrite worklist, by these rules (measured on the v1 pack on 3 October; `tools/house/thin-lines.mjs` prints the worklist and exits 0, a report and not a gate):

| Code | Rule | Count today |
|---|---|---|
| `short-10` | a kept `s10` under 12 words | 15 |
| `short-20` | a kept `s20` under 25 words | 9 |
| `short-45` | a kept `s45` under 60 words | 8 |
| `empty-part` | a kept `parts` with an empty field | 41 items |
| `menu-line` | a dish's kept `guest` sharing 80 per cent of its words with the description and no more than eight words longer | 7 |
| `dup-part` | a wine's `parts.sauce` equal to its `profile`, or `parts.sides` equal to `goesWith` | 15 |
| `price-in-profile` | a `$` figure in a wine's `profile` (the price argument belongs in the service note and the lineup ask, where it already is) | 1 |

The rewrite stays within `LINE_CAPS` (25, 50, 110 words) and above the floors above; a wine's five parts become the short form (14 words or fewer each) so the profile and goes-with blocks carry the long form; an empty part is filled from the sources, or, when no source holds it, stays empty and gains a lineup ask ("What glass is the Classic Sazerac served in?", `askWhom: 'bar'`) listed in `rewrites.json` under `gaps`. Two duplications are fixed in display, not in text: the 52 guest lines equal to their `s20`, and the 20 wines whose `pairs` equals `goesWith` (1.2, `linesShown` and 1.4).

### 5.5 Authoring: masters, refuted

The procedure follows the Floor Deck's (`tools/deck/README.md`): a brief, authors, three refuters, a corrector, a critic, then a take into the authored file. New files under `tools/house/notes/`:

- `brief.mjs` writes `briefs/<kind>-<slug>.json` per item: the item as built (every field and mark), the guide's lines that name it (by `nameIn` over the folded guide, with twelve lines either side), the research passages that name it, the verified facts, its pairings both ways, the lineup asks, disputes, mix-ups, scenarios, terms and tastings that name it, the apps' own reference entries the matchers of 1.5 find for it, the fixed questions with their word ranges, and the thin codes against it.
- The authors are masters of the room: a chef with years on a Creole line for the dishes, a head bartender for the drinks, a sommelier for the wines, and a floor trainer who has opened restaurants for every "How do I sell it?" and "What do guests ask?". Chunks of eight items.
- Three refuters per chunk with different lenses: **the facts** (every claim against the cited sources; an uncited claim is cut), **the floor** (prices, promises a server cannot keep, allergens, doneness, timings, party rules), **the voice and the caps** (word ranges, banned words, the fixed questions, repetition).
- A corrector answers every finding; a critic per section reads the section's notes together (no two About notes opening alike; no "How do I sell it?" repeating another's sentence).
- `take.mjs` writes `notes.json` and `rewrites.json`; `validate-notes.mjs` runs the gates of 5.6 on them alone, before any build.
- The owner reads the proof (`notes-proof.mjs` prints one page per section, item by item) before `keep-all.mjs --owner-reviewed` ships the edition, as with the first pack.

### 5.6 The gates on the content

In `src/lib/house/house-validate.ts` as `NOTE_RULES` and `noteProblems(house, opts)` (pure, ported), run FATAL by `validate-pack.mjs` and `brennans-pack.test.ts` on the strict build, and only as flags on a device (a person's own notes are never refused):

- `about-missing`, `about-length` (120 to 200 words), `coach-missing` (the required set per kind), `coach-extra` (a fixed question twice from one edition, or "How do I pour it?" on a dish), `coach-length` (the ranges in 5.3), `coach-close` (the fixed closing sentence of "What should I watch for?"), `asked-shape` (two or three `Asked:` and `Answer:` pairs).
- `line-floor` (the 5.4 floors), `part-empty` (unless listed under `gaps` with its lineup ask), `dup-part`, `price-in-profile`.
- The existing codes over the new text: `dash`, `price` (every `$` figure equals a house price string), `allergen-talk` (an allergen word in a note fails unless its sentence also holds "confirm" or "ask the kitchen"; "free", "safe", "contains no" and "suitable for" fail outright, by the Floor Deck's `VERDICT_RE`), `proper-noun` (FATAL for the new notes: every capitalised word not opening a sentence occurs in the item's own record or in a cited source, or is listed in the entry's `allow`), and `figure` (a year, an age or a count occurs in a cited source).
- `sources`: every cited file exists and every cited line range is inside `guide.txt`.

### 5.7 The second edition, and what a device keeps

- The pack becomes `static/shared/packs/brennans-new-orleans.v2.oothouse.json` with `pack.version: 2` and a new `builtAt`; `engine.mjs` gains `EDITION_TS_V2` and keeps `EDITION_TS_V1`, and `PACK` points at v2. The v1 file stays on disk and on the site (an installed client that has not updated may still fetch it), and `check-pack` proves both.
- **Kept notes keep their first stamp.** Today `keptNotes()` stamps every note with the build stamp. In v2, the 42 notes the first edition carried keep `EDITION_TS_V1`, and only the new notes carry `EDITION_TS_V2`. `mergeKept` unions on `ts|q`; restamping an old note would make every device hold it twice after the refresh.
- Rewritten marks carry the v2 stamp; `refreshEdition` then replaces a device mark that still carries the v1 stamp and keeps any mark a person touched, by the rule already in `house-pack.ts`.
- `DEFAULT_PACK` moves to v2 in `src/lib/stores/house.svelte.ts`, `DEFAULT_PACK` in the Ledger's `js/house-bar.js`, `V27_DEFAULT_PACK` in the Codex's `js/codex27.js` (the constant its own header names as the one seam).
- Size: the house grows by about 350 KB of notes; the house record lives in IndexedDB (`HOUSE_DB`), well inside `HOUSE_MAX_BYTES`. The Ledger's and the Codex's rows carry `kept` too, in localStorage: about 70 KB each. `brennans-pack.test.ts` pins the house JSON at or under 1.5 MB and each projection's notes at or under 200 KB, so growth is seen.

### 5.8 Critic: the bottle list, as far as it was verified

The 62 bottle records held by the refuters (0.2) ship in the v2 pack, so the Codex can answer "do we have a Meursault?" with what is known, dated, and never more.

- **Where.** `tools/house/brennans/bottles.json`, written by `take-bottles.mjs` from the three `verify-*.json` files: one entry per `held` verdict, `{ name, producer, wine, vintage, region, grapes, format, printed, sources, verifiedOn: '2026-10-03' }`, every field copied from the held snippet or the guide and none inferred (an absent vintage stays absent). A record whose name matches one of the 20 by-the-glass wines is folded into that wine as its `bottle` price (the field 1.4 prints as "Not in the guide" today) rather than added twice.
- **How they sit in the house.** As `wines` with `list: 'bottle'` and a section per sweep ("Bottles: Champagne", "Bottles: white Burgundy", and so on), after the glass list's sections. They carry `say` where the guide or a held source gives one, `lines.s10` built from their own fields by a fixed template ("Meursault from Domaine X, 2019, a white Burgundy, $nnn the bottle."), no About note and no coaching notes; `NOTE_RULES` apply to `list !== 'bottle'` only, and the content gates (`price`, `proper-noun`, `figure`, `dash`) apply to all.
- **How the Codex shows them.** One chip after the glass sections, "Bottles verified online (62)", and the header sentence becomes computed in full: "By the glass, as the server guide prints it: 20 wines, 14 with a glass price and 6 poured on the tastings. From the bottle list: 62 bottles verified online on 3 October 2026, not the whole list; confirm with the sommelier before offering one." A bottle's card has the wine block, the price under "Bottle", the date it was verified, and "Confirm with the sommelier that it is on the list tonight." in the place of the coaching notes. Bottles are dealt in their own deck ("Bottles verified online"), never mixed into the glass list's Flash cards, which stay the 20 she will pour on Monday.
- **The counts that move.** The house's wines become 82; every test that pins 20 wines pins 20 with `list !== 'bottle'` and 62 with `list === 'bottle'`. The Table's and the Ledger's pairings never name a bottle, because no kept pairing does.
- **When the owner pastes the Binwise page** (decision 10.3), the same file takes the whole list and the "verified online" sentence gives way to the list's own date.

## 6. Per repo, the files

### 6.1 WorldTable (this repo)

New: `src/lib/house/house-study.ts`, `src/lib/house/house-study.test.ts`, `src/lib/study-links.ts`, `src/lib/study-links.test.ts`, `src/lib/wing-links.ts`, `src/lib/wing-links.test.ts`, `src/lib/components/StudyMenu.svelte`, `src/lib/components/StudyCard.svelte`, `src/lib/components/StudyLinks.svelte`, `tests/study.spec.ts`, `tools/house/notes/` (5.5), `tools/house/brennans/notes.json`, `tools/house/brennans/rewrites.json`, `tools/house/thin-lines.mjs`, `static/shared/packs/brennans-new-orleans.v2.oothouse.json`.

Changed: `src/routes/menu/+page.svelte` (2.2), `src/routes/menu/quiz/+page.svelte` (4.1, 3), `src/lib/house-drill-round.ts` (`studyScopeFromSearch`, `dealSection`), `src/lib/components/HouseLists.svelte` (`mode="study"`), `src/lib/components/ExportNudge.svelte` (`quiet`), `src/lib/components/UpdatePrompt.svelte` and `src/routes/+layout.svelte` (2.2.4), `src/lib/house/house-validate.ts` (5.6), `tools/port-house.mjs` (`MODULES`), `static/shared/oot-house.js` (regenerated, never hand-edited), `tools/house/build-brennans.mjs`, `tools/house/validate-pack.mjs`, `tools/house/engine.mjs`, `tools/house/check-pack.mjs`, `src/lib/stores/house.svelte.ts` (`DEFAULT_PACK`), Critic: `static/shared/oot-house-ui.js` (`readView`'s `opts.study`, 2.1) and `tools/check-house-ui.mjs` (its study case), `tools/house/brennans/bottles.json` and `tools/house/notes/take-bottles.mjs` (5.8, new), the tests that read the v1 path (moved to v2, except `house-autoload.adversarial.test.ts`, which keeps v1 and gains the refresh case), `CLAUDE.md` (a section "Study menus" recording 1.2, 1.7, 2.2 and 5.7, with the measured link figures and the cap figure).

### 6.2 Bartender's Ledger

New: `js/house-study.js`, `css/house-menu.css`, `tools/check-study.mjs`, `tools/fixtures/brennans.oothouse.json` (a copy of the v2 pack, compared by the site's `check-mirror` like `house-min.json`).

Changed: `index.html` (two tags, stamps), `sw.js` (`ASSETS`, `CACHE`), `js/ui-menu.js` (`renderMenu`, one branch), `js/app.js` (two lines), `js/house-bar.js` (`houseStudyAfterRender` call, `houseCardFits('study')`, `houseCardBackHTML('study')`, `DEFAULT_PACK`), `js/ui-study.js` (`FC_MODES` row, `fcPool` section filter, the setup's section select), `js/engine.js` (`fc.section` default), Critic: `js/ui-new.js` (`applyRoute`'s `menu` branch and `currentRoute`, 1.7), `CLAUDE.md` (the study view, the deep link, the `#/menu/<slug>` rule, the deck, the section filter).

### 6.3 Sommelier's Codex

New: `js/codex28.js`, `css/house-list.css`, `.scripts/check-study.js`.

Changed: `index.html`, `sw.js` (`ASSETS`, `CACHE`), `js/codex27.js` (`V27_DEFAULT_PACK` only), `.scripts/check-home.js` and `.scripts/check-merge.js` (`FILES` gains `codex28.js` after `codex27.js`), `.scripts/check-syntax.js` (codex28), `CLAUDE.md` (codex28 in the architecture list; the layer after it is codex29).

### 6.4 The site

Nothing hand-edited. `node tools/sync-wing.mjs ledger` and `node tools/sync-wing.mjs codex` once the source commits exist (new files arrive as status A); `node tools/inject-shared.mjs --from <build>` from `BASE_PATH=/table npm run build:pages`; `shared/oot-house.js`, Critic: `shared/oot-house-ui.js`, and `shared/packs/brennans-new-orleans.v2.oothouse.json` copied from `static/shared` byte for byte; `node tools/bump-shared.mjs --apply` (the Codex's `oot-codex-vN` for any change under `shared/` or `codex/`, the Ledger's `oot-ledger-vN` for its own files and `oot-house.js` in its `ASSETS`; the hub's `oot-shell-vN` does not move, since `oot-house.js` is not one of the nine it lists; `SHARED_V` stays 32; Light and the Almanac list none of these files and get no note); then `node tools/check-all.mjs`, with the new `check-study` (7.4) in its list.

## 7. Tests and gates

### 7.1 WorldTable: `npm test`, `npm run check`, `npm run verify:build`, `npm run test:e2e`

Unit (vitest):

- `house-study.test.ts`: every rule in 1.2, on the fixture and on the v2 pack. The short line for Eggs Hussarde and the Classic Sazerac as quoted in 1.2; sections in menu order with Brennan's counts (Starters 8, Soups 2, Salads 1, Entrées 14, Sides 12, Desserts 6, and the rest); search "huss" finds Eggs Hussarde alone, "pinot" finds the wines carrying the grape, "creole caesar" ANDs; `notesFor` picks the newest per fixed question and puts the older in `earlier`; `linesShown` hides a guest equal to `s20`; `partsShown` drops a wine part equal to its profile; `itemCards` reads kept marks only (a fixture item with her unkept lines deals no card); `studyProgress` over a map; `fold` on "Mâcon-Igé", "Véronique", "Brennan’s", "Shrimp & Grits"; `nameIn` refuses three letters and takes the plural. Critic additions: sections open on "Tasting menus 4" (the house's first section), not Starters; the Berres short line is "Light, racy and off-dry, our glass for anything spicy."; `priceLine` gives "$13" for the Classic Sazerac, "$27" for Eggs Hussarde, "$14 glass" for the Berres and "$80 half-bottle" for the Auslese, and never the words "by the glass"; `partsShown` drops the Berres's `sauce` part, contained in its profile; `searchElsewhere` for "sazerac" from the dishes returns the Classic Sazerac, Thompson's Dream and Origin Story, in that order, and from the drinks returns nothing for "hussarde" but Eggs Hussarde from the dishes; `inMeal` keeps Eggs Hussarde under "Breakfast & lunch", drops it under "Dinner", and keeps an item with empty `meals` under both.
- `study-links.test.ts`: over the real `floor-deck.index.json`, `lexicon.json`, `techniques.json`, `primers.json` and recipes index with the v2 pack: at least 40 dishes with a Floor Deck link, at least 25 with a Lexicon link, Critic: Eggs Hussarde's Floor Deck links exactly Cured, Poached and Hollandaise (no Bacon: the capitalised-modifier rule of 1.5), and a planted "Creole mustard" does not link a "Mustard" card, Bananas Foster and Tarte Tatin linked to their recipes, no link to a target that does not exist (a planted term absent from the deck yields nothing), the oyster rule (a dish naming "oyster mushrooms" does not link the fish card when the deck's oyster card is in a fish section, by the plates' `LINKABLE` precedent applied to the Lexicon's categories).
- `wing-links.test.ts`: `roomHref` is empty when `base` is `''`, present under `/table` for an item in the house, empty for an id not in the house; the three address shapes exactly.
- `brennans-pack.test.ts` (v2): zero FATAL problems including `noteProblems`; every dish, drink and wine has one About note of 120 to 200 words and its coaching set; the 42 first-edition notes carry `EDITION_TS_V1`; every new note carries `EDITION_TS_V2`; no fixed question twice from one edition on one item; no rewrite below its floor or over its cap; no dash; the size pins of 5.7; the counts (62 dishes, 23 drinks, 20 wines) unchanged.
- `house-autoload.adversarial.test.ts`: a device on v1 with a person's kept line and a person's own note on Eggs Hussarde, refreshed by v2: the person's line stands, the person's note stands once, every first-edition note stands once, the new notes arrive once each, the rewritten lines arrive on every untouched mark.
- `house-drill-round.test.ts`: `studyScopeFromSearch` reads `item`, `section`, `deck`, `scenario` and ignores anything else; `dealSection` returns only section items with options from the whole house.
- `port.test.ts`: `check-port-house.mjs` proves `oot-house.js` says what `house-study.ts` says.

Playwright, in a new `tests/study.spec.ts`, against the build with the shipped pack auto-loaded (the existing `house-autoload` path), at **390 by 844**:

- The study view is what `/menu` shows; "Nothing pinned yet" is not visible; the page is under 9,000 px tall (235,732 today).
- No horizontal scroll (`document.scrollingElement.scrollWidth <= 390`); every button, chip, summary and input in the study view is at least 44 px tall; every row at least 56 px.
- The sticky bar is still at the top after scrolling 3,000 px; choosing "Desserts" shows six rows and the live region says "Showing Desserts: 6 dishes"; "huss" in the search leaves Eggs Hussarde.
- Critic: on a fresh load the top of the first row is inside 844 px; with the meal filter on "Dinner", Eggs Hussarde is not listed and "huss" finds nothing in the dishes; "sazerac" in the search shows "Elsewhere in the house" with the Classic Sazerac (plain words on the standalone build).
- Opening Eggs Hussarde: the heading, "$27", Critic: "Prices as printed on 26 September 2026. Confirm before quoting.", the eyebrow "Say it" over "Hussarde: hoo-SARD." exactly (the kept value, not a cut of it), the line "Pour: Brennan's Essential by Piper-Heidsieck Extra Brut NV, $28 glass. Without alcohol: Catalina Island." inside the first 844 px of the card, a "Next" button on the first line, no sticky bar while the card is open, the ten second line, the two toggles with `aria-expanded`, "About it" with 120 to 200 words, a `dl` of five parts, "Pour with it" naming the house Champagne, "On the floor" with three disclosures in the fixed order, the fixed eyebrow exactly, the In this app block with at least one Floor Deck link; focus on the heading; Back returns focus to the row.
- Allergens: in the study view and the open card, `input[type=checkbox]:checked` counts zero, and no text matches "No allergens" or "Allergens:" except the fixed eyebrow. Critic: and except the fixed closing sentence of "What should I watch for?" (5.3, "Allergens: read the service note and confirm at lineup."), which the test as first written would have failed on every card; the test allows exactly those two strings and nothing else holding "Allergens:".
- Standalone (base `''`), no link to `/codex/` or `/ledger/` is drawn; the based build's link shapes are proved in `wing-links.test.ts`.
- Edit: "Edit the menu" shows today's dish list with "86 it", "Edit" and "Remove"; the card's "Edit" opens today's dish form for that dish.
- `#d-1q0xk7jv` on a cold load opens the Eggs Hussarde card.
- Critic, **the back gesture and the round trip**: open Entrées, scroll, open Eggs Hussarde, `page.goBack()` closes the card with the scroll and the chip as they were; choose Entrées, press "Flash cards" in its heading, then "Close the deck": `/menu` shows Entrées at the same scroll.
- Critic, **the deck**: Got it and Again are absent before Flip and inside the viewport after it.
- Flash cards: "Flash cards" opens `/menu/quiz?mode=cards`; the front shows the name and section; Again writes `house:<id>:<item>:card-item` with `missed` to `oot-house-drilled-v1`; back on `/menu` the header says "1 again" and "My weak ones (1)" deals that item.
- Offline (the `offline.spec.ts` harness: worker on, network off, reload): the study view renders, a card opens, and its In this app block resolves.
- The offline notice: once it shows, `document.elementFromPoint` at the centre of every study row in the viewport returns the row or a descendant.
- **Screenshots**: `study-table-list-390.png` (the view scrolled to Entrées) and `study-table-card-390.png` (Eggs Hussarde, top of the card) with `toHaveScreenshot({ maxDiffPixelRatio: 0.02 })`, baselines committed under `tests/study.spec.ts-snapshots/` for Linux and updated only by a person who has looked (`--update-snapshots`). The structural assertions above are the gate; the pictures catch what words cannot.
- `a11y.spec.ts`: the seeded block gains the study view and the open card under axe, with no serious violation.

`npm run verify:build`: the cap holds and the figure is recorded; no new route; `oot-house.js` ships and is not precached (the existing `SHARED_LAZY` check).

### 7.2 Bartender's Ledger: `node tools/check.mjs`, `check-import.mjs`, `check-home.mjs`, `check-levels.mjs`, `check-options.mjs`, `check-house-wiring.mjs`, and the new `check-study.mjs`

`tools/check-study.mjs` loads the shipped js through the `check-import.mjs` loader with `OOT_SHARED` (the house cases skip with a printed SKIPPED when neither shared tree exists) and the v2 fixture, and asserts:

- With a current house, `renderMenu()` returns the study view and not `menuListHTML()`; with `editAll`, the reverse; with no house, today's list.
- 23 rows in eight sections in the house's order; every row a `button` carrying `data-act="hs-open"`.
- The Classic Sazerac card holds the ticket, "About it", "The build", "Offer next" naming Thompson's Dream and Origin Story as `hs-open` buttons, Critic: "The classic Sazerac is in the Library. Its build is the classic's, not ours." linking `#/library/sazerac` with no canon quantity drawn on the card, the price "$13" once, the glossary's Bitters and Rinse, the fixed eyebrow, no `checked` attribute, and, with `location.pathname` set to `/ledger/`, no Table link (no house dish names it as a zero-proof); Catalina Island's card links Eggs Hussarde in the Table at `/table/menu#d-1q0xk7jv`.
- At least nine of the 23 drinks link the canon by name or family; at least four link a producer.
- `#drink=b-olsmh04y` before `applyRoute()` opens the Sazerac's card and leaves the hash Critic: `#/menu/classic-sazerac`; a malformed `#drink=` writes nothing.
- Critic: with a current house, `#/menu/classic-sazerac` through `applyRoute()` (the global search's address) opens the study card and not the Build pane; with `editAll` it opens the Build pane as today; `hs-open` pushes a history entry and a `hashchange` to `#/menu` closes the card, restores `state.menu.study.y` and focuses the row.
- Critic: the study header's first row's top is inside 844 less the bottom nav at 390 by 844, measured in the `check-study.mjs` layout case through the site's Playwright run (7.4), since node:vm has no layout.
- The deck: `houseStudyDeck({ section: 'Signature drinks' })` deals only that section's drinks with kept lines; Got it writes `progress.cards['My Bar · Classic Sazerac']`; the `trouble` special yields the weak deck; `fcPool()` with `mode: 'study'` deals no spec-only draft without kept lines.
- Every string `house-study.js` draws: dash-free, names nobody, no level numeral, British spelling (the `color`, `favorite`, `practice` as a verb list).
- `check.mjs`: `ASSETS` and `index.html` agree on `house-study.js` and `house-menu.css`; `CACHE` bumped.

### 7.3 Sommelier's Codex: `.scripts/check-home.js`, `check-merge.js`, `check-wine-import.js`, `check-drill.js`, `check-house.js`, `check-syntax.js`, and the new `check-study.js`

`.scripts/check-study.js` loads the chain with `codex28.js` and `OOT_SHARED/oot-house.js` on a Map storage with the v2 fixture, and asserts:

- codex28 loads with no `OOT`, with no `location`, and with a `location` that has no `pathname` (the merge harness's shape).
- With a current house, `cellarView()` returns the study view; with `S._v28edit`, codex27's list; with no house, codex12's.
- The header sentence with 20, 14 and 6 computed from the house.
- The house Champagne's card: "The wine" with "Bottle: Not in the guide…", the profile, served, goes with, three first picks linking `/table/menu#d-…` on the suite path, the grape profiles for Pinot Noir and Chardonnay, the Terroir entry for Champagne, the Champagne primer; Domaine Leflaive's card links its producer record; no card links a producer that is not in `WINE_PRODUCERS`.
- At least 17 wines link a primer, at least 15 a grape, and exactly the three producers named in 1.5 link (Domaine Leflaive, Maison Louis Jadot, Inglenook), unless `WINE_PRODUCERS` grows.
- `#wine=w-dbz9e960` opens that card after the first sync; `#list` opens the list; a malformed hash writes nothing.
- `startHouseDeck` records `h-<id>-card` through `statRecord`, and `keyOwned` keeps the key out of every rank's figures (the existing wrap); `startHouseDeck` and `startHouseSectionDrill` are `function` declarations visible on the global.
- `voiceProblems` over everything codex28 draws: no U+2014, no spaced double hyphen, no "practise" or "practice", no level numeral, no codepoint at or above U+2190. Critic: scoped to codex28's own strings and templates, rendered with every quoted reference field (a `GRAPES` structure line, a `TERROIR` note, a primer title) replaced by a placeholder; the Riesling's `st` carries an en dash and a U+2192 arrow, both in the Codex's keep-set, and checking quoted reference text against a stricter rule than its home page would fail the build on the Codex's own data. The quoted text stays held by the wing's existing sweep.
- Critic: the history case: opening the Berres's card pushes one entry; a `popstate` to a state without `v28` closes it and restores `S._v28.y`; the deck's Flip, Got it and Again push nothing. "Drill the list" never calls `startCellarDrill` or `startCellarRecite` (asserted by stubbing both to throw).
- `check-home.js` and `check-merge.js` run green with codex28 in `FILES`, against `js/` and the wing's `codex/js`.

### 7.4 The site: `node tools/check-all.mjs`

All seven gates as today, plus `check-pack` proving v1 and v2, `check-mirror` holding v2 and the Ledger's fixture, and a new eighth gate, **`tools/check-study.mjs`**, appended to the list constant: it finds Playwright in `WORLDTABLE_SRC`'s `node_modules` (absent: a note and a skip, as every absent checkout is; an override that names no checkout: a failure), serves the site root from a small static server, and at **390 by 844**:

- opens `/table/menu`, `/ledger/#/menu` and `/codex/#list` on a fresh profile, waits for the auto-loaded house, and saves `study-table-390.png`, `study-ledger-390.png`, `study-codex-390.png`;
- opens the Eggs Hussarde, Classic Sazerac and house Champagne cards and saves `card-table-390.png`, `card-ledger-390.png`, `card-codex-390.png`, into `tools/out/study/` (ignored by git);
- asserts in each: the study view is the default; no horizontal scroll; every control at least 44 px; no checked checkbox; the fixed eyebrow present on each card; the cross-room links present and pointing at items in the house (Eggs Hussarde's first pick opens `/codex/#wine=w-dbz9e960`, and following it shows that card in the Codex; the Champagne's first picks open the Table cards; Catalina Island's "Poured with" opens the Table);
- repeats the three list loads offline after one online visit, each room installed, and asserts the study view and one card render.
- Critic, **the owner's Monday, as one script**: offline after one online visit to each room, open `/table/menu`, find "huss", open Eggs Hussarde, follow its first pick into the Codex, flip that wine's card, go back (the gesture) to the Codex list, open `/ledger/#/menu`, search "sazerac", open the Classic Sazerac, follow "Poured with" where it exists, and open `/codex/#list`, search "berres", open the C.H. Berres card. At each step: no browser error page, the expected heading, no element under the OOT badge at the search box's left edge, no checked checkbox, the fixed eyebrow on each card. Then one room's cache is deleted (`caches.delete` of `oot-codex-*`) and the Table's card is reopened: its first pick is plain words with the offline note, never a link to an error page.

## 8. Order of work

1. **WorldTable, the engine**: `house-study.ts` and its test, the port, `noteProblems` in `house-validate.ts`. `npm test`, `npm run check`.
2. **WorldTable, the content**: briefs, the authoring run, `notes.json`, `rewrites.json`, the builder changes, the v2 pack, the owner's read, keep-all, the pack tests.
3. **WorldTable, the study view**: the components, `/menu`, `/menu/quiz`, the offline notice, `study.spec.ts`, the screenshots, `verify:build`, the CLAUDE.md section.
4. **The Ledger**: `house-study.js`, the CSS, the hooks, the deck, `check-study.mjs`, the CLAUDE.md note.
5. **The Codex**: `codex28.js`, the CSS, the `FILES` lists, `check-study.js`, the CLAUDE.md note.
6. **The site**: the mirrors, the two syncs, the Table rebuild and injection, the bumps, `check-all.mjs` with `check-study`.

Steps 4 and 5 need only the ported `oot-house.js` and the v2 pack from steps 1 and 2, and can run beside step 3.

## 9. The strings (in `STUDY_WORDS`; a wing that cannot read the engine carries the same copy)

| Key | Text |
|---|---|
| `back` | Back to the menu |
| `backList` | Back to the list (the Codex) |
| `position` | {i} of {n} in {section} |
| `found` | {i} of {n} found |
| `findDish` / `findDrink` / `findWine` | Find a dish / Find a drink / Find a wine |
| `all` | All {n} |
| `showing` | Showing {section}: {n} {unit} |
| `searchHits` | {n} found for {query} |
| `searchNone` | Nothing matches {query}. |
| `clear` | Clear the search |
| `read` | Menus read {date} |
| `progress` | {studied} of {total} studied · {got} got it last time · {again} again |
| `progressNone` | Nothing studied yet: start with Flash cards. |
| `cards` | Flash cards |
| `weak` | My weak ones ({n}) |
| `weakNone` | My weak ones: none yet |
| `editOff` / `editOn` | Edit the menu: off / Edit the menu: on (the Codex: Edit the list) |
| `edit` | Edit |
| `ten` | In ten seconds |
| `twenty` / `twentyHide` | Twenty seconds / Hide twenty seconds |
| `fortyFive` / `fortyFiveHide` | Forty-five seconds / Hide forty-five seconds (Critic: hyphenated) |
| `say` | Say it (Critic: an eyebrow over the kept value, verbatim; no `{say}` interpolation) |
| `asPrinted` | Critic: Prices as printed on {date}. Confirm before quoting. |
| `pourLine` | Critic: Pour: {wine}, {price}. Without alcohol: {drink}. |
| `offerLine` | Critic: Offer next: {names} |
| `pickLine` | Critic: First pick for: {names} |
| `allDay` | Critic: All day |
| `elsewhere` | Critic: Elsewhere in the house |
| `inRoom` | Critic: {name}, in the {room} |
| `alsoHouse` | Critic: Also in the house: {drinks} in the Ledger, {wines} in the Codex |
| `nextOnly` | Critic: Next |
| `drillWhole` | Critic: Drill the whole menu (the Codex: Drill the whole list) |
| `tooSmall` | Critic: {section} is too small to drill alone. |
| `deckHere` | Critic: In the Floor Deck |
| `linksWait` | Critic: Finding links in this app… |
| `libRecipe` | Critic: The Library's {name}: a recipe to cook, not the house's |
| `libPour` | Critic: What the Library would pour (not on our list) |
| `canonLine` | Critic: The classic {name} is in the Library. Its build is the classic's, not ours. |
| `quizTab` | Critic: Quiz the list (the Quiz tab) (the Ledger) |
| `bottles` | Critic: Bottles verified online ({n}) |
| `bottleConfirm` | Critic: Confirm with the sommelier that it is on the list tonight. |
| `about` | About it |
| `parts` | The five parts |
| `pour` | Pour with it |
| `pairMore` | More on the pairing |
| `build` | The build |
| `offerNext` | Offer next |
| `pouredWith` | Poured with |
| `wine` | The wine |
| `bottleNone` | Not in the guide: the bottle list is on the restaurant's own page |
| `firstPicks` | First picks |
| `secondFor` | Also the second choice for |
| `pouredOn` | Poured on |
| `floor` | On the floor |
| `confirm` | To confirm at lineup |
| `disagree` | Two sources disagree |
| `mixUp` | Not to be confused with |
| `more` | More notes |
| `earlier` | Earlier answers |
| `eyebrow` | Your words. Allergens: confirm at lineup. |
| `noteNone` | No service note yet. Ask at lineup. |
| `here` | In this app |
| `rooms` | In the other rooms |
| `offlineRoom` | (open the {room} once online and it stays with you offline) |
| `cardsThis` | Flash cards for this |
| `sayBack` | Say it back (the Codex: Say the pour) |
| `drillSection` | Drill this section |
| `drillFloor` | Critic: retired; a section under its floor shows `drillWhole` and `tooSmall` instead of a disabled button (1.3, item 13) |
| `hers` | Lizzy has written lines here that nobody has kept yet. Edit to look them over. |
| `prev` / `next` | Previous: {name} / Next: {name} |
| `got` / `again` | Got it / Again |
| `count` | Got it {g} · Again {a} |
| `done` | Deck complete |
| `againDeck` | Again: the {n} you marked |
| `shuffle` | Shuffle again |
| `close` | Close the deck |
| `front` | Say the ten second line aloud, then flip. (Critic: "Say it, then flip." did not say what to say) |
| `flip` | Flip |
| `opening` | Opening the house… |
| `listLine` | By the glass, as the server guide prints it: {n} wines, {p} with a glass price and {t} poured on the tastings. The full bottle list is not in the guide. Critic: when the house holds bottles (5.8), the second sentence is `listBottles` instead. |
| `listBottles` | Critic: From the bottle list: {b} bottles verified online on {date}, not the whole list; confirm with the sommelier before offering one. |

The ellipsis in `opening` is U+2026, in the Codex's keep-set; the middle dot is U+00B7, in it too.

## 10. Open decisions for the owner

1. **The Ledger's house flash cards and the subscription.** In the wing, the Flashcards tab is a paid tab (`LEDGER_FREE_TABS` leaves it out), while the Table is free in full and the Codex's house drills are free today. As specified, the deck drawn inside the Menu tab (4.2) is free like the Table's and the Codex's, and the same cards on the Flashcards tab stay behind the lock. To make the Menu tab's deck paid instead, route `houseStudyDeck` to `state.tab = 'flashcards'` and let the lock decide; nothing else changes.
   Critic: the decision is wider than the Ledger's flash cards, and the owner should take it before Monday, because on a free account today two of the study view's buttons meet a paywall. In the Ledger, "Quiz the list" and "Drill this section" open the `quiz` tab, which `LEDGER_FREE_TABS` leaves out. In the Codex, the site already makes "drilling your own list" paid (`cellardrill`, wrapping `startCellarDrill` and `startCellarRecite`), while codex27's house drills and codex28's new `startHouseDeck` and `startHouseSectionDrill` are not wrapped and so are free, which is the opposite of what that boundary's own comment intends for "the drills generated from the venue's own wine list". The Table is free in full by the owner's decision of 19 September. The spec's default: every study surface drawn inside My Menu (the item decks, Say it back, the section drills) is free in all three wings, matching the Table, and only the Ledger's separate Quiz and Flashcards tabs stay behind the lock. To make the Codex's house deck paid instead, add `startHouseDeck` and `startHouseSectionDrill` to the names `oot-locks.js` wraps (a site change under `shared/`, which bumps `oot-codex-vN` by the publish rule, and the hub's worker too, since `oot-locks.js` is one of the nine shared scripts its `ASSETS` list).
2. **The house's English.** The new notes are house fields, so the builder's spelling map makes them American, like every line a server reads to a guest in New Orleans. To keep them British, they would need an exemption from `americanise`, and they would then disagree with the lines beside them.
3. **The bottle list.** The guide links it and does not print it. When the owner can paste the Binwise page into `tools/house/brennans/pages/`, the builder can file the bottles as wines in a third edition through the same doors, with the gates above. Critic: in the meantime, 62 bottles verified online on 3 October ship in v2 as a partial list (5.8), dated and labelled as partial. If the owner would rather the Codex show nothing of the bottle list until the whole of it can be read, `bottles.json` is left empty and the header keeps its first sentence; nothing else changes.
4. Critic: **the house's spelling inside the study view's own sentences.** The pour, offer and pick lines (`pourLine`, `offerLine`, `pickLine`) are app strings wrapped round house values: the frame is British, the names inside it are the house's as written ("flavor" stays in a kept line). This is the rule of 0.4 applied to a sentence that holds both, recorded so nobody "corrects" one into the other.
