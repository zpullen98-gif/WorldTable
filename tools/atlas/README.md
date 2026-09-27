# The Ingredient Atlas, a batch at a time

The atlas is `tools/derive/lexicon-supplement.mjs`: every Lexicon entry
authored since the archive, in the six atlas categories only, with the
contract in the file's opening comment and the gate in `build-data.mjs`.
This directory is how a batch of entries is written into it by agents and
read by a person.

## Where it stands (27 Sep 2026)

The first batch (the 18 plate items in `roster.json`) ran into the account's
usage limit. Three entries passed all three refuters and the corrector and
are in the supplement, placed by the operator (the placement agents never
ran): Huckleberry (II), Pawpaw (III), Crabapple (II); the argument is in
`audit/plates-1.json`. The other fifteen are HELD, deliberately not taken
half-checked: six were never refuted (marionberry, hawthorn-berry,
black-raspberry, jerk-seasoning, chili-powder, mesquite), two only in part
(field-pea, pueblo-chile), and seven were refuted but their corrector died
(salmonberry, serviceberry, boysenberry, muscadine-grape, loquat, lima-bean,
puffball; puffball and lima bean carry safety findings that must be answered).
Their drafts and findings are in `out/run.plates-1.json`. Finish them with
`brief.mjs --only <the fifteen>` and one workflow run, then `take.mjs`
without `--only` skips the three already in (it refuses an existing term).

## One batch

1. **Roster.** `tools/atlas/roster.json`: one row per entry, `{t, c, plates,
   plateItems, hint}`. The term is named once (its slug is a reader's key);
   the category is one of the six; the plates and plate items say which
   illustrated plates draw the thing (the brief hands the author what the
   plate prints, corrections included); the hint is the operator's note on
   what the entry is about and what it must get right. The first batch
   (27 Sep 2026) is the plate items that had no Lexicon entry and belong in
   an atlas: the Northwest and Midwest berries, the pawpaw, the loquat, the
   muscadine, the Southern pulses, the Pueblo chile, the puffball, and the
   two American blends the spice plate prints.
2. **Brief.** `node tools/atlas/brief.mjs [roster.json] [--only slug,slug]`
   writes `tools/atlas/out/<slug>.brief.json` (the contract verbatim, the
   rules, three exemplars of the category, the related entries, the plates'
   text, every existing term, the levels standard) and prints the Workflow
   `args`.
3. **Write.** Run `author.workflow.js` with the Workflow tool (a copy inside
   the session's working directory, step 2's output as `args`). Per entry an
   author, three refuters (botany and food science; safety and look-alikes;
   the contract), a corrector; then one critic over the batch with a bounded
   repair; then a placer, a challenger and a reconciler give every entry a
   level with a reason. About six agents per entry.
4. **Take.** `node tools/atlas/take.mjs <output.json> [--batch name]` appends
   the entries to the supplement in the file's style, the placements to
   `tools/derive/levels/lexicon.json`, and the argument to
   `tools/atlas/audit/<batch>.json`; it prints every `wrong` or `unsafe`
   finding with its disposition, the critic and the placement challenges.
   It refuses a term that already exists.
5. **Gate.** `npm run build:data`: the supplement contract and the levels
   gate both. The plates that draw the item link to it on this build
   (`tools/derive/plates.mjs` matches by folded name, the parenthetical
   alias included).
6. **Prove it.** `npm test`, `npm run verify:derived`, then read each entry in
   the app.
7. **Commit** by explicit path: the supplement, the level file, the audit,
   the roster, and the emitted `src/lib/data/` files the build rewrote.
