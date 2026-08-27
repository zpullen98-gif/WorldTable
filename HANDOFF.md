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
| WorldTable | branch `dish-standards`, **15 commits unpushed**, tree clean |
| OutsideOfTime | branch `main`, HEAD `3ca8361e`, tree clean, **no git remote — never pushed** |
| Tests | **269 unit** (18 files), **76 e2e** (75 pass, 1 known red) |
| Gates | `npm run build:data` all pass · `npm run verify:build` **18/18** |
| Precache | 1.39 MB gzipped against a 2.00 MB cap |
| Routes | 24 · Derived JSON | 19 files |

**The one red test is pre-existing and not from this work.**
`axe: today dashboard has no serious violations`. `static/shared/oot-home.css`
stacks `opacity: .6–.68` on already-muted text in six rules, measuring 2.32:1 to
3.17:1 where AA wants 4.5:1. It is a SHARED-layer defect — every wing renders
those bands — so the fix belongs in the monorepo and must be re-vendored.

## The corpus, by the numbers

970 recipes · 94 chapters · 479 lexicon terms · 103 techniques · **45 standards**
· course of 45 dishes over 10 semesters · 176 front-of-house terms · 27 service
modules · 186 drill cards.

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

## What's left, ranked

1. **Technique standards — the highest-leverage work available.** 45 dish
   standards cover 45 dishes. **103 technique standards would cover 824.** It is
   also what would let the coverage board say "to a standard" as a measure
   rather than a floor. Large authoring job; do it next.
2. **The allergen vocabulary.** **101 of 970 recipes have no allergen flag at
   all** — hummus among them, over a line reading "150g good tahini". The
   display now says what it did NOT screen, so absence no longer reads as
   clearance, but closing the vocabulary to all 14 is a `diet.mjs` project.
   `allergens.test.ts` asserts `NOT_SCREENED` stays non-empty, so the day it
   lands the copy is forced to change.
3. **The shared CSS contrast defect** — the one red test, affecting all five
   wings.
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
