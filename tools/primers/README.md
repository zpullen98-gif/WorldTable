# The primers: one reader per level per subsection

A level page says "42 at this level" and lists the items; a primer says what
those items have in common, which to take first and why, what "met" looks
like, and what the level above will ask of the same subject. One per level
per subsection that holds items (31: Level IV has no plates), three to
seven paragraphs, read and never graded, on `/level/[n]/read` with a "Read
first" door from each subsection of the level page.

The files are authored: `tools/derive/primers/<level>-<subsection>.json`
(`{level, subsection, lede, paragraphs, cites, next}`), written by the
procedure below and hand-editable afterwards. `tools/derive/primers.mjs` is
the gate and the build: shape and lengths, the deck's prose rules (no dash,
no verdict, no British spelling, no sanitation token the guide never states,
temperatures in the house form), no scoring or locking language, and every
cite a real item of this level and subsection that the text names.
`PRIMERS_COMPLETE` there, once every primer is in, makes a missing one fail
the build.

## The standard

A primer is written for the cook or server standing at that level, on a
phone, between services. It names the items placed there by the names the
app uses, groups them by what they share, says what to take first and why,
says what "met" means for the subsection in the app's one rule, points to
the doors the level page opens by their names, and closes on what the level
above asks (or, at Level IV, what keeps the subject sharp). It draws on each
item's own text (a definition, a card's why, a standard's marks, a module's
outcome) and never contradicts it. It never presents an item as this
level's that is not placed here, never invents a door, never fills a gap in
the guide with a figure or a rule of its own, and never speaks of unlocking,
passing or a score: a level guides, it never bars.

## One run

1. **Brief.** `node tools/primers/brief.mjs` (after `npm run build:data`,
   which it reads). It WRITES one brief per level and subsection with items
   to `tools/primers/out/<level>-<subsection>.brief.json` (the standard and
   this level's paragraph, the limits and aims, what met means here, the
   doors, every item with its signals and its own text, the names at the
   neighbouring levels, the level's other subsections, the palate rung or
   the sanitation rule where they apply, a register sample and the rules)
   and PRINTS the small object to pass as the Workflow's `args`. `--only
   1-techniques,2-deck` briefs just those.
2. **Write.** Run `author.workflow.js` with the Workflow tool: copy the
   script into the session's working directory and pass the copy's path,
   with step 1's printed object as `args`. Per primer an author writes it
   from the brief, three refuters attack it (culinary fact; the app's own
   data, so every cite and every claim about an item is checked against the
   brief; house rules and register), and a corrector answers every finding
   with a disposition; then each level's primers are read together by a
   critic, with one bounded repair. About five agents per primer, 160 for
   the 31. A primer that dies is re-run with `--only`.
3. **Take.** `node tools/primers/take.mjs <the run's output file>`. It
   writes the authored files and `tools/primers/audit/<level>.json`, and
   prints what a person must read before committing: every `wrong` or
   `misplaced` finding with the corrector's disposition, anything undisposed,
   each critic's problems and notes.
4. **Gate.** `npm run build:data`: every primer through `checkPrimer`. Fix
   what it names in the authored file (a cite that is not this level's, a
   name the text never carries, a length) or re-run that primer.
5. **Complete.** When every level and subsection with items has its primer,
   set `PRIMERS_COMPLETE = true` in `tools/derive/primers.mjs`.
6. **Prove it.** `npm test` (`src/lib/primers.test.ts`: the gate on fixtures
   and the emitted file's cites resolve to the levels' items), `npm run
   check`, `npm run build` and `npm run verify:build` (the primers' chunk is
   precached), Playwright `tests/primers.spec.ts` with the levels, a11y,
   layout and nav suites.
7. **Read it.** Open each level's reader in the app. The refuters catch what
   is false; only a person catches what is dull.
8. **Commit** by explicit path: the authored files, the audits and the
   emitted `src/lib/data/primers.json`.

## Re-running one primer

`node tools/primers/brief.mjs --only 2-deck`, the workflow with that output
as `args`, `take.mjs <output> --only 2-deck`, `npm run build:data`. An item
moved to another level by `tools/levels/` may leave a cite behind: the gate
names it, and the primer is edited or re-run.
