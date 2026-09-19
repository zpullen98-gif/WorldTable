# The Floor Deck: how a section gets written

The deck is a staff-training set of 300 menu words (see the header of
`tools/derive/floor-deck.mjs` for what it is and why it is not the Lexicon).
Every one of the 300 has a minted id and a planned card already. This is the
procedure that turns a planned section into a written one. The last content
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
   (bytes now, projected at 300, mean prose per section), then
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
19 Sep 2026: all 300 are written and the flag is on, so a new card is added
by minting its id (`mint-ids.mjs`), briefing it with `--only`, and taking it
through the same steps.

## Ids

`node tools/deck/mint-ids.mjs` is the only writer of
`tools/derive/floor-deck.ledger.json`. A new card goes into its section module
with `id: 'NEW'` and is minted before anything else. A reader's progress is
filed under the id, so it is never typed, changed, reused or moved to another
term: `--accept-rename <id>` records a deliberate rename, `--retire <id> "<why>"`
retires one for good.

## What the refuters are for

The atlas's refute passes caught, per batch, outright safety errors that read
perfectly well (toxins attributed to the wrong mushroom, "cooking makes it
safe" where it does not). Here the packet itself shows the need: a working
server had written that shoulder is "very tender", that heirloom means "organic,
no GMOs", that sous vide is "steaming water". The refute pass is not optional,
and a finding is never dropped because its card could not be found: it stops
the merge instead.
