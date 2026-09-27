# The Floor Deck: how a section gets written

The deck is a staff-training set of menu words, 281 cards in 14 sections at
four levels (see the header of `tools/derive/floor-deck.mjs` for what it is
and why it is not the Lexicon). It shipped at 300 in fifteen; the Southern
section was removed on 19 Sep 2026, five of its words moving to other sections
with their ids and the rest retired in the ledger. This is the procedure that
turns a planned section into a written one. The last content
pipeline this repo had lived in a session scratchpad and was lost; this one is
committed.

## The rules live in one place

`tools/derive/floor-deck-contract.mjs` is the contract: lengths with floors AND
ceilings, the prose rules, the structural refusal of allergen verdicts, identity
against the ledger. The build gate imports it, `validate.mjs` imports it, and
`brief.mjs` prints its numbers into the authoring prompt. Change a rule there
and nowhere else.

## One section

1. **Brief.** `node tools/deck/brief.mjs <section>`
   It WRITES the full brief to `tools/deck/out/<section>.brief.json`: the roster
   rows with what the packet's hire hand-wrote (`packet.mjs`) and where that was
   wrong, the limits and aims, the banned tokens, candidate Lexicon and recipe
   links, up to three finished cards as the register to match, and the whole
   roster so a card can name the cards it is confused with. It PRINTS a small
   JSON object (the brief's path and the contract's numbers): that is the
   workflow's `args`. `--only fd_0101,fd_0102` briefs just those cards, for
   re-running a chunk that died.
2. **Write.** Run `author-section.workflow.js` with the Workflow tool. The tool
   refuses a `scriptPath` outside the session's working directory, so copy the
   script into it and pass the copy's path, with step 1's printed object as
   `args`. A workflow script has no filesystem and its agents do, so the agents
   open the 50 KB brief for themselves and only 3 KB travels through the call.
   Authors draft in chunks of eight; three refuters with different lenses
   (culinary fact, floor usability, safety and no verdict) attack every chunk;
   a corrector answers every finding with a disposition; a critic reads the
   whole section and gets one bounded repair. About 17 agents for 22 cards.
   Then `node tools/deck/take.mjs <section> <the run's output file>`: it saves
   what the run returned as `tools/deck/out/<section>.json` and prints what a
   person must read before merging (every `wrong` or `verdict` finding with what
   the corrector did about it, anything undisposed or unplaced, the critic's
   notes). It decides nothing.
3. **Validate.** `node tools/deck/validate.mjs --draft tools/deck/out/<section>.json --section <section>`
   The build's own contract, against the draft laid over the deck, including
   the recipe links (it loads the recipe index for that). Fix what it names in
   the draft (or re-run the chunk) until it is clean. Read the critic's list
   against the DRAFT before ruling: its own repair pass has usually fixed it.
4. **Merge.** `node tools/deck/merge.mjs <section> tools/deck/out/<section>.json`
   All or nothing. It stops on any finding the workflow could not place on a
   card, on any serious finding with no disposition, and on any `wrong` or
   `verdict` finding the corrector REJECTED, until a person has read it
   (`--accept-rejected`). It writes the section module and
   `tools/deck/audit/<section>.json`, which is committed: why each card reads
   the way it does.
5. **Build and measure.** `npm run build:data`, then `node tools/deck/measure.mjs`
   (bytes now, projected at the deck's planned size, mean prose per section), then
   `node tools/check-displacement.mjs` (the deck does not join the recipe
   crosslinks, so this must report nothing evicted).
6. **Prove it.** `npm test`, then confirm `git diff --stat src/lib/data` lists
   only `floor-deck*.json` and `totals.json`, then `npm run build:pages` and
   `npm run verify:build` (in that order: `verify:build` after a plain
   `npm run build` fails its manifest check spuriously), then Playwright against
   a plain `npm run build`: the whole suite for the pilot, the Lexicon commit and
   the last section, `regressions` and `offline` between.
7. **Read it.** Open the section in the app and read every card as a new hire
   would. The refuters catch what is false; only a person catches what is dull.
8. **Commit** by explicit path, with `measure`'s output in the message.

Section order: `cuts` was the pilot (two packet errors, compound Lexicon
entries feeding several cards, dense confusions, and real Brisket and
Porterhouse cards to prove the Lexicon's pinned search counts hold). Then cured,
fish, methods, southern, meats, mushrooms, dairy, starches, sauces,
preparations, bread, custards, pantry, language. When the last planned card is
written, set `DECK_COMPLETE = true` in `tools/derive/floor-deck.mjs`. Done
19 Sep 2026: all 300 are written (281 live after the Southern section was
removed) and the flag is on, so a new card is added
by minting its id (`mint-ids.mjs`), briefing it with `--only`, and taking it
through the same steps.

## Levels

Every written card carries a brigade `level`, by its integer key, which is
what the data and the URLs (`?level=2`) carry. The names live in one constant,
`DECK_LEVELS` in `tools/derive/floor-deck.mjs`: 1 **Commis**, 2 **Chef de
Partie**, 3 **Sous Chef**, 4 **Chef**. Nothing is locked; a new reader is
guided through level 1 across every section before level 2, and any level can
be opened at any time. The standard each card is placed against:

- **1 Commis**: the everyday menu word a guest assumes any server knows on day
  one; on most American menus (Ribeye, Salmon, Shrimp, Risotto, Vinaigrette,
  Grilled, Braised, Parmesan, Creme Brulee, Prix Fixe).
- **2 Chef de Partie**: common at a good restaurant and needs a sentence to
  explain; the main confusable pairs (Hanger Steak, Branzino, Gnocchi, Aioli,
  Confit, Burrata, Gelato, Macaron).
- **3 Sous Chef**: fine-dining vocabulary: classical sauces and preparations,
  specialist cuts and products (Coulotte, Turbot, Beurre Blanc, Guanciale,
  Sweetbreads, Crudo, Mostarda).
- **4 Chef**: the rare, specialist or deeply classical word a senior server
  must own (Acquerello, Bottarga, Ballotine, Banyuls, Washed Rind, Lion's Mane).
- Signals: how often it is on menus, how often guests ask, how much it takes
  to explain; the packet flag (the house expected it early) breaks ties
  downward. No quotas; each level holds at least 14 cards (`LIMITS.levelMin`,
  one full written test), which the contract checks once the deck is complete.

The 281 cards were placed by agents against this standard (an assigner per
section, a challenger arguing each placement from the floor, a reconciler, then
one cross-deck critic), with no owner review round. The run's output went
through `node tools/deck/set-levels.mjs tools/deck/out/levels.json`, which
writes `level` into each section module through the one serializer, refuses an
id that is not a live written card or a written card left without a level, and
writes `tools/deck/audit/levels.json`: every card's level and the reason, plus
what the critic moved. Re-run it the same way to re-place the deck.

A NEW card gets its level from its writer: the brief hands the writer this
section (`brief.mjs` reads it from here) and lists `level` among the keys, and
`validate.mjs` refuses a written card without one. A merge keeps an existing
card's level (`overlay` in `lib.mjs`, as it keeps `packet`), so a condensing
pass cannot drop it; a card moves level only by editing its module or
re-running `set-levels.mjs`.

## Ids

`node tools/deck/mint-ids.mjs` is the only writer of
`tools/derive/floor-deck.ledger.json`. A new card goes into its section module
with `id: 'NEW'` and is minted before anything else. A reader's progress is
filed under the id, so it is never typed, changed, reused or moved to another
term: `--accept-rename <id>` records a deliberate rename, `--retire <id> "<why>"`
retires one for good.

## Expanding at Levels III and IV

At the first placement Level IV held exactly the fourteen cards the floor
asks for and five sections held no Level IV card at all (methods, custards,
language, cuts, bread). The expansion (27 Sep 2026) adds words at III and
IV, section by section, decided by agents and read by a person before a
stub is written:

1. `node tools/deck/roster-brief.mjs` writes `out/roster.<section>.brief.json`
   per section (the section's cards with levels, the level standard, the
   Lexicon's III and IV terms with no card as candidates, the whole deck for
   duplicates) and prints the Workflow `args`.
2. `roster.workflow.js` (a copy in the session's working directory): a
   proposer per section (two to four words at III or IV, each with the
   reason, the guest's question and a menu line), a challenger from the
   floor (on menus? already taught under an alias? really III or IV?), a
   reconciler, then one critic across the deck for duplicates and balance.
3. `node tools/deck/add-stubs.mjs <run.json>` adds `{ id: 'NEW', term,
   planned: true }` to each section module through the serializer, refuses
   a term the deck carries under any term or alias, records each word's
   intended level and reason in `out/expansion.levels.json` (which
   `brief.mjs` reads, so the writer gives the card that level: rule 9 in
   the author workflow) and the argument in `audit/expansion.json`.
4. `node tools/deck/mint-ids.mjs`, then `brief.mjs <section>` for each
   section with stubs.
5. `author-all.workflow.js` runs `author-section.workflow.js` as a child per
   section in parallel (`args`: `{ childPath, sections: [{ key, args }] }`);
   `node tools/deck/split-run.mjs <run.json>` writes `out/run.<section>.json`
   for `take.mjs`. Then validate, merge, build:data, measure and
   check-displacement per section, as above.

**Where it stands (27 Sep 2026).** The roster placed 55 words (41 at III,
14 at IV). Eight sections are written, refuted, corrected and merged:
bread, custards, cuts, language, pantry, preparations, sauces, starches (31
cards; the deck is 312, Sous Chef 61, Chef 19). The run hit the account's
usage limit before the correctors of cured, dairy, fish, meats and methods
answered their refuters, and before the mushrooms author wrote at all, so
those 24 cards are still `planned: true` stubs and `DECK_COMPLETE` is off
until they land. Their drafts and findings are in `tools/deck/out/run.<section>.json`;
the cheapest finish is `brief.mjs <section>` for the six and one
`author-all.workflow.js` run over them (the stubs keep their minted ids),
then take, validate, merge, and `DECK_COMPLETE = true`. Two things the run
taught: the author workflow's card schema has no `level` property, so a
structured result drops it and the operator fills it from
`out/expansion.levels.json` before validating; and a guest line of three
short sentences fails the two-sentence rule more often than any other.

## What the refuters are for

The atlas's refute passes caught, per batch, outright safety errors that read
perfectly well (toxins attributed to the wrong mushroom, "cooking makes it
safe" where it does not). Here the packet itself shows the need: a working
server had written that shoulder is "very tender", that heirloom means "organic,
no GMOs", that sous vide is "steaming water". The refute pass is not optional,
and a finding is never dropped because its card could not be found: it stops
the merge instead.
