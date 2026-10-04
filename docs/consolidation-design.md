# The consolidation: four tabs, Back everywhere, cards and quizzes at the centre

Designed 4 October 2026 for the World Table, the Bartender's Ledger and the
Sommelier's Codex. Binding sources, in this order: the plan's section "Step 2:
the consolidation" (`~/.claude/plans/root-claude-uploads-09201eae-82ec-5cba-scalable-cosmos.md`,
the owner's twelve answers and the design rules), then each repo's own
CLAUDE.md, then this file. Where this file and a CLAUDE.md disagree, the
CLAUDE.md wins and this file is wrong; say so to the critic.

The reader this is built for: a new server at Brennan's in New Orleans,
studying on a phone between shifts, who wants to open an app, see four
levels, tap one, and be told what to do today; who wants every deck in one
place and every quiz in another; and who expects the phone's Back to undo the
last tap, never to throw them out of the app.

Before screenshots (390 by 844, Chromium, the site served whole, Brennan's
loaded) are in this session's scratchpad as `shots/cons-before-*.png`:
`table-home`, `table-level`, `table-mine`, `ledger-home`, `ledger-level`,
`ledger-mine`, `codex-home`, `codex-level`, `codex-mine`. Measured on them:
Back from the Ledger's Mine and from the Codex's Mine left the app for the
previous page on the origin (the Table's `/table/menu/`), because the Ledger
replaces every entry (`js/ui-new.js:162-165`) and the Codex pushes none
outside Our List and the full list.

Every file and line cited below was read at these commits: WorldTable
`3431e01`, BartendersLedger `5f20590`, SommeliersCodex `45fdf76`.

## Contents

1. What changes and what never does
2. The shared contract (tab bar, Back, history, level scope, More, the common screens, results)
3. The World Table
4. The Bartender's Ledger
5. The Sommelier's Codex
6. The copy, every new string
7. The back chain tests and the checks each app adds
8. Trade-offs the critic should test

Critic: the critic's pass (4 October 2026) walked the owner's morning at
390 by 844 in each app against this file and the before shots, and edited
in place; every change is marked `Critic:` and struck text is shown
~~struck~~. Builders read the marked text as binding. The changes, by
where they bite:

- **Learnability:** More is a quiet control after four tab words, not a
  fifth tab (answers 2 and 5; 2.1); `Due today` and `Quick quiz` start at
  once (2.6); Due today tops up with new cards so the first morning is not
  a dead end, from one count shared by row, root and pill (2.6, 6.2); the
  Ledger's switcher moves below the page's work so Today's study is in the
  first screen (2.6); My restaurant shows three study doors, section chips
  and quiet setup links instead of a dozen equal doors (2.6); duplicate
  and near-identical rows renamed or removed (3.8, 4.7, 5.8, 6.4); Search
  leaves More's Settings for the Library root in the Ledger (4.2); the
  full wine list says so and leads the Codex Library (5.6, 5.8); the
  Table's chapters get a door (3.9); a filtered search never hides an
  item at another level (2.4); a size floor for arm's length (2.9).
- **Back and history:** Back is sticky and stays visible when scrolled
  (2.2); a cross-room landing says what the gesture will do (2.2); hash
  links and layers that push for themselves make one entry, never two or a
  loop (2.3, 5.4); a run reached by Back renders from memory, so results
  survive `Study this card` (2.3); the Table's editing page is a pushed
  screen (3.3); section scope is in the address (2.6).
- **One card style:** the Table's old card screens and `/menu/quiz`'s mode
  chips forward or go, per answer 8 (3.7, 3.8); `Study the misses` deals
  every miss with a card, from one miss up (2.7).
- **Tests:** 7.1 gains tests 17 to 25 (the owner's morning end to end,
  no history from in-screen changes, hash adoption, one action one entry,
  first screen, one count, the first morning, one card style, arriving
  from another room), sticky Back at scroll 2000, an enumerated screen
  list, a font floor, mutation checks for each, and 7.5's cross-room
  expectations corrected.

## 1. What changes and what never does

Changes, in all three apps:

- The tab bar reads **Home · Flashcards · Quizzes · Library**, in that
  order, then a quiet **More** button at the end of the same row, nothing
  else in it. Critic: the owner's answer 2 is four tabs and answer 5 a
  "quiet More menu in the header"; the plan's cross-app check counts "the
  same four words". More is therefore not a fifth tab word drawn like the
  others: it is the app's existing quiet or ghost control (2.1), set apart
  from the four, and it still lights when a More screen is showing.
- Home is the four level cards and nothing else. The quiet row of doors
  (Today, Library, Record, Mine) goes; what each door opened has a new home
  in the screen maps below.
- A level page opens on **Today's study**, then **My restaurant**, then
  **Search**, then a closed summary of what the level holds.
- **Flashcards** is one deck picker in front of the app's existing deck
  engines; **Quizzes** is one list in front of the app's existing round
  builders; **Library** is reading only; **More** holds the record, the
  tools, backup and data, the Maître d', settings and about.
- A visible **Back** button sits at the top of every screen except Home and
  steps back exactly one screen, keeping scroll. The phone's back gesture
  does the same, because every screen change is now a history entry.
- The chosen level filters Flashcards, Quizzes and Library, with a scope
  chip to change level or show all. My restaurant ignores the level.

Never changes:

- Internal ids, routes, hashes and stored records. The Table's routes, the
  Ledger's `TABS` ids (`js/app.js:3`) and the Codex's `S.view` names all
  stay; new ones are only added. Every old address lands somewhere sensible
  (each app's screen map lists them).
- Every progress store and its keys: the Table's session and house records,
  `oot-house-drilled-v1`; the Ledger's `bartenders-ledger-v1` and every
  field the Ledger CLAUDE.md lists; the Codex's `codexStats` (`ST`) and
  `codexLevelChosen`. New per-device slots are listed where they are made,
  are never exported and never in a backup, and every read and write is
  wrapped in try.
- `shared/oot-locks.js`. Its tab ids still resolve, so First Light and the
  Calendar need no carry-forward.
- ChatGPT's art. Every new screen is built from the components each app
  already draws (named per app below): the palette, the type, the
  mastheads, the artwork, the cards, the doors, the chips, the buttons. No
  new colour, font, picture, icon or emoji. Every control at least 44 px
  tall, every state in words, no pictorial glyph.
- Offline. Nothing new fetches at load; every new screen is built from data
  already precached. The house's videos stay links out that say they need a
  connection.
- The house auto-load (answer 10: the owner's device opens on Brennan's):
  the Table's house store, the Ledger's `houseAutoLoad`
  (`js/house-bar.js:593`) and the Codex's codex27 sync are untouched, so My
  restaurant shows Brennan's on first open.

## 2. The shared contract

### 2.1 The tab bar

Words, exactly, in this order: `Home`, `Flashcards`, `Quizzes`, `Library`,
then `More`. The nav's accessible name stays each app's own (the Table
`Sections`, the Ledger `Main`, the Codex `The Codex`). The lit word carries
`aria-current="page"` and the app's existing lit style (never colour alone:
each app already pairs it with an underline or a fill).

Critic: `More` is the last control in the same nav and the same row, but
drawn in the app's existing quiet style rather than as a fifth tab, so the
four tabs read as the app and More reads as the drawer of everything else:
the Table puts it at the right end of `nav.modebar`, in the place the
service toggle's moon holds today (`+layout.svelte:365-375`), styled as the
existing `.quiet` link with the modetab's 44 px box; the Ledger's `#bnav`
keeps it in the fifth slot (on phones the bottom bar is the Ledger's whole
header nav, so "in the header" means that bar there), with the slot's
label in the bar's muted ink and no lit underline until a More screen is
showing; the Codex's `nav.appnav` puts it last with the navword box and
the `.btn.ghost` ink. When a More screen shows, More takes the lit style
and `aria-current="page"` like any tab, so the state is still a word and a
mark, never colour alone. The tests (7.1, test 9) assert four tab words and
then `More`, in all three apps.

Which word is lit: the tab that owns the screen, by the owner tables in each
app's section. A level page and My restaurant are under **Home**. Every
screen reached from More lights **More**.

Placement, each app keeping the bar it already draws:

- **Table:** the sticky `nav.modebar` under the masthead
  (`src/routes/+layout.svelte:345-376`), top only, as today.
- **Ledger:** the clusters row `#tabs` at the top on wide screens and the
  bottom bar `#bnav` on phones, both drawn by `renderNav`
  (`js/ui-new.js:29-56`), as today. The bottom bar keeps five slots; More
  takes the slot Search held.
- **Codex:** the `nav.appnav` the topbar wrapper appends
  (`js/codex25.js:1372-1423`), top only, as today.

At 390 px every app's bar is **one row**, every word whole, never
truncated, every target at least 44 by 44. Measured before the change (this
session): the Table's four tabs ended at x 343 with More wrapping to a second
row; the Codex's navwords are 89 px each, so the fifth wraps; the Ledger's
bottom bar is five 76 px slots and fits. Each app's section says what it
changes to fit. At 320 px a second row is accepted, as the Table's bar does
today.

Tab taps follow the Ledger's existing rule (`js/app.js` `navClick`): a tap
lands on the tab's root screen, never on a remembered sub-screen, so the
same tap always does the same thing. A tap on the lit tab while already on
its root scrolls to the top and does not push a history entry.

A count on a tab is a pill with a word for screen readers, absent at zero:
the Flashcards tab carries the due-today count, drawn with the Table's
existing `.pill` (`+layout.svelte` `.pill` rule) or the Ledger's and the
Codex's existing small count style, and a visually hidden " due".

### 2.2 The Back control

- **Look:** each app's existing chip or ghost button, the word `Back` and
  nothing else (no arrow, no glyph). Table `button.chip` inside a
  `div.backline` (the pattern of `StudyCard.svelte:152-153`); Ledger
  `button.chip` inside `div.crumb` (the pattern of `clusterChromeHTML`,
  `js/ui-levels.js:357-363`); Codex `button.btn.ghost` (the pattern of the
  Mine doors' `Back to Mine`, `js/codex27.js:1853`).
- **Placement:** the first thing inside the app's content region, under the
  tab bar, at the content's left gutter, in normal flow (not fixed, not
  sticky). The OOT badge is a 44 px disc fixed at x 10 to 54, y 10 to 54,
  z-index 45 (`shared/oot-bar.js`); in all three apps the content begins
  below the masthead and the tab bar (y above 350 at 390 px on every
  screen measured), so Back never sits under the badge at rest. ~~When the
  page is scrolled, Back scrolls away with the content.~~
  Critic: Back must stay visible when scrolled. The owner asked for "a
  visible button at the top of every screen", and the screens a server
  scrolls furthest (Brennan's sixty-odd dishes, the 365, the full wine
  list, a forty-row Quizzes list) are exactly where a Back that scrolled
  away three thousand pixels ago is no button at all. The back row is
  `position: sticky`, its `top` just under whatever the app keeps stuck
  (the Table: the height of the sticky `nav.modebar`; the Ledger and the
  Codex: 0), on the content's own background token so text never shows
  through it, one row tall (the 44 px button plus the gutter). While the
  row sits in flow it is at the content's left gutter; once it sticks, a
  sentinel watched by one `IntersectionObserver` (no scroll handler) sets
  `is-stuck` on the row, which moves the button to x 64, clear of the
  badge's 10 to 54, the inset codex28's deck bars already use. On the
  Codex's card screen the back row and codex28's deck bar share one sticky
  wrapper, so two stuck strips never stack. Test 10 is extended to scroll
  0 and scroll 2000.
- Critic: **Arriving from another room.** The Table's dish card links its
  bottle tiers to `/codex/#wine=<id>` and its zero proof to the Ledger
  (`StudyCard.svelte:181-246`); that is the owner's morning. In the Codex
  the entry has depth 0, so the Back control goes to Our List, not back to
  the dish (answer 7: Back across apps was not chosen). To say so in words
  instead of surprising them, when depth is 0 and `document.referrer` is
  another app on the same origin (path under `/table/`, `/ledger/` or
  `/codex/`, not this one), the back row carries one quiet line after the
  button: `Opened from {App}. Your phone's back gesture returns there.`
  (`{App}`: The World Table, The Bartender's Ledger, The Sommelier's
  Codex). It goes at the first push.
- **Where it is not:** Home. Back from Home to the hub was not chosen; the
  OOT badge stays the way to the hub.
- **One per screen.** Every screen-specific way back is replaced by this
  one control: the level page's crumb `Home` (`src/routes/level/[n]/+page.svelte:139`),
  the Floor Deck's crumb `Service` (`src/routes/service/deck/+page.svelte:130`)
  and every other `nav.crumbs` in the Table's routes, the study card's
  `Back to the menu` chip (`StudyCard.svelte:153`; its position line and
  Next stay), the Ledger's `Back to {level}` and `Back to Mine` crumbs
  (`js/ui-levels.js:357-363`), the Codex's `Back to the level` train
  (`js/codex25.js:456`), `Back to Mine` on Our list by heart, Say the pour
  and Guest at the table (`js/codex27.js:1853`, `2451`, and the guest's
  `hg-back`), and the Our List card's back to the list (`js/codex28.js:1148`).
  A screen with two ways back is a defect the checks fail on.
- **Accessible name:** `Back`. The heading of the screen it leads to is not
  announced on the button; focus lands on that heading after the move.

### 2.3 The history model

The rule, in one line: **every screen change pushes one history entry;
every change within a screen replaces the current one; popstate renders the
entry; Back calls `history.back()` when this app pushed the current entry,
and otherwise goes to the screen's logical parent.**

A **screen change** is anything that would get a new heading: a tab root, a
level page, a deck screen, the first card of a run, a quiz round, a results
screen, a reading page, a list item opened to its own page or card, a More
item, an overlay that takes the whole screen (the Table's study card, the
Codex's house deck). Within a screen (replace, never push): flipping a card,
Next and Previous card, answering and moving to the next question, typing
in a search box, changing a filter or chip, opening a disclosure.

A run's cards share one entry: the first card pushes, each later card
replaces. So Back from card nine returns to the deck screen, not to card
eight, which is what the Table's study card already does (CLAUDE.md "Study
menus", `menu/+page.svelte:420-432`). A results screen replaces the last
card or question, so Back from results returns to the deck or quiz picker
the run started from.

Critic: **a run screen reached by Back renders from memory.** Each app
says a run (`/card`, a running round, `/done`, `results`) "cold-loads to
its parent", because a dealt hand is not in the address. That must not
also apply to a pop within the visit, or the owner's morning breaks: take
the quick quiz, press `Study this card` on a miss (a push), read the card,
press Back, and the results are gone, replaced by the Quizzes root. The
rule: when a pop lands on a run entry and the run the app holds in memory
is that run (same mode or deck, the same round), it renders as it was,
finished results included; only when memory holds no such run (a reload, a
cold link, a new tab) does it fall to the parent with a replace. The Table
keeps the finished round in the page's `snapshot` and in the shallow
entry's `page.state` (SvelteKit restores both on a back navigation into
the page, but not component state); the Ledger keeps `state.quiz` and
`state.fc` as they are (it never discards them on a tab change) and
`applyRoute` reads `#/quiz/{mode}/done` as the done stage while
`state.quiz` holds a finished round of that mode; the Codex keeps the
results it drew in `S` and codex31 renders `results` on a pop while they
are there. Test 3 already walks this; it now also runs with the gesture.

**The depth counter.** Each app keeps the in-app depth of the current entry:

- On every push, the new entry's depth is the current depth plus one.
- On popstate, the depth is the depth recorded for the entry popped to.
- An entry the app did not push (a cold load, a link from the hub, a
  bookmark, a reload of a page whose depth was never recorded) has depth 0.

Where the depth lives:

- **Ledger and Codex** (vanilla, they own `history.state`): the depth rides
  in the entry's state as `ootd` (an integer), merged with whatever else the
  app stores there (`Object.assign({}, state, { ootd: n })`, so codex28's
  `{ v28: ... }` and codex29's states keep their keys). It is mirrored to
  `sessionStorage` under `oot-nav-ledger-v1` or `oot-nav-codex-v1` as
  `{ "d": n, "href": location.href }` after every push, replace and pop, so a
  reload of the same address keeps its depth.
- Critic: **entries the browser makes for the app.** A hash link or a
  `location.hash = h` assignment makes a history entry with a null state:
  the Ledger's `gotoHash` does exactly that (`js/ui-new.js:279-283`), and
  `js/house-study.js` and `js/ui-coffee.js` carry `href="#/..."` links. As
  first written, the hashchange that follows would see a new screen key and
  push a second entry for the same screen (Back then does nothing visible
  on the first press), or, if the render replaced, the entry would carry
  no `ootd` and read as depth 0, so Back would replace to the parent and
  leave the browser's entry behind it: a loop. The rule: the app's one
  `hashchange` handler, finding `history.state` without `ootd` while the app
  is running, adopts the entry with `replaceState(Object.assign({},
  history.state, { ootd: last + 1 }))`, `last` being the depth in memory,
  and renders with `syncRoute('none')`. Better still, `gotoHash` and one
  delegated click handler on `a[href^="#/"]` route through the push path
  and never assign `location.hash`; the adoption stays as the net for any
  link missed. **One user action, one entry:** a layer that pushes for
  itself (codex28's `v28Push`, codex29's list, the Ledger's `hsPush`)
  writes the new hash in that same push and records the screen key as
  already pushed, so the render that follows replaces. Tests 19 and 20
  (7.1) catch both.
- **Table** (SvelteKit owns `history.state`): `sessionStorage`
  `oot-nav-table-v1` as `{ "d": n, "href": ..., "base": n }`, kept by
  `src/lib/nav.ts` (section 3.3), using `afterNavigate`'s `type` and
  SvelteKit's popstate `delta` for full navigations, and `page.state.ootd`
  for shallow entries.

**Back pressed:**

1. If the current depth is above 0: `history.back()`. The popstate that
   follows renders the previous entry exactly as it was (2.3, scroll).
2. If the depth is 0: go to the screen's **logical parent** with
   `history.replaceState`, depth stays 0. So a cold deep link walks up the
   tree one screen per press until Home, where Back disappears, and the
   browser history never gains a loop.

The logical parent of every screen is in each app's screen map. The general
rule: a tab root's parent is Home; a level page's parent is Home; My
restaurant's parent is the level page of the chosen level; a deck screen's
parent is Flashcards; a card's parent is its deck screen (or its list, for a
study card); a round's parent is Quizzes; a results screen's parent is
Quizzes; a reading page's parent is its shelf, a shelf's parent is Library;
a More item's parent is More.

**The phone's back gesture** is `history.back()` itself, so it follows the
same entries. At depth 0 the gesture leaves the app, as the browser always
does; that is the one difference from the Back button, and it is accepted
(answer 7: back across apps was not chosen, the browser's own history still
crosses apps).

**Scroll.** Each app sets `history.scrollRestoration = 'manual'` where it
restores by hand (Ledger, Codex). Before a push, the leaving entry's scroll
is saved; after a popstate render, it is restored after the paint (two
animation frames, the Table's proven pattern at `menu/+page.svelte:396-413`).
Ledger and Codex keep `{ [href]: scrollY }` in `sessionStorage` under
`oot-scroll-ledger-v1` and `oot-scroll-codex-v1`, capped at 60 entries,
oldest dropped. The Table uses SvelteKit's own scroll restoration for full
navigations and a `snapshot` on each list page (section 3.3). A push always
lands at the top of the new screen (or at the item the existing code scrolls
to, such as the Ledger's `[data-open="1"]`, `js/app.js:62-69`).

**Focus.** After a push, focus moves to the new screen's heading (`tabindex="-1"`)
or the main region, using each app's existing call (the Table's
`main#main` `tabindex="-1"`, the Ledger's `view.focus()` in `render`, the
Codex's `v25FocusMain`, `js/codex25.js:385`). After a pop, focus returns to
the control that opened the screen when it is still there (the Table's
study row pattern, `menu/+page.svelte:407`; the Ledger's `focusSignature`,
`js/app.js:19-29`; codex18's remembered id), else the heading.

**Escape** closes the topmost overlay (the Ledger's search overlay and
sheet, already `js/app.js:201` and `214`; the scope chip's level list; any
dialog) and never navigates.

**Leaving a running round or test.** A push away from a running quiz or
level test asks nothing new: the existing guards stand (the Codex's
`leaveSitting` through `v25Leave`, `js/codex25.js:372`; the Ledger's level
test resumes, `js/app.js` `navClick`). A round left by Back is abandoned the
way each app abandons it today, nothing recorded beyond what was answered.

### 2.4 The level scope

**The chosen level.** One per app, per device:

- Table: new slot `oot-level-table-v1` in `localStorage` (the integer key,
  1 to 4), read in `onMount` only. Absent, the chosen level is
  `levels.current` (`firstUnmetLevel`, `src/lib/stores/levels.svelte.ts`).
- Ledger: new slot `oot-level-ledger-v1` in `localStorage`, through
  `OOT.profiles.key()` when the wing has it. Absent, `firstUnmetLevel()`
  (`js/levels.js:196`).
- Codex: the existing `activeLevel` and `codexLevelChosen`
  (`js/codex25.js:317-330`); nothing new.

Choosing a level on Home sets it, and so does opening any level page
(whatever you are looking at is what you are studying). The Home card that
reads `Your level` is the chosen level (falling back to the first unmet, as
today). Nothing is locked: a level guides, it never bars.

**The scope chip.** At the top of the Flashcards, Quizzes and Library roots,
under the heading and above everything else, one line in a `role="group"`
labelled `Level`:

- Filtered: `{Level name} · show all levels`, where the level name is a
  button (accessible name `{Level name}, change level`) and `show all
  levels` is a button.
- Showing all: `All levels · show {Level name} only`, `show {Level name}
  only` a button.
- Pressing the level name opens, in place, the four level names as chips
  in the app's chip style, the chosen one marked with the words `Your
  level`; choosing one sets the chosen level, closes the list and refilters.
  Escape or pressing the name again closes it.

"Show all" is part of the address (section 2.3 replaces, it is in-screen
state), so Back to a root restores the scope it was left in: Table
`?all=1`, Ledger and Codex `/all` at the end of the root's hash. It is
never stored.

Critic: **a filter must never hide what was searched for.** The owner,
studying Bartender, looks for the Sazerac in the Library; if it sits at
another level, a filtered list answers with nothing, which reads as "not
in the app". On every scoped screen (the three roots and every Library
shelf that takes the level), a search or filter that finds nothing at the
chosen level shows the matches from the other levels under the heading
`At other levels`, each row naming its level in words, and the line
`Nothing at {Level} for "{q}".` above them. Show all is still one tap.
The house's own rows (My restaurant, the house's videos, the full wine
list) carry no scope anywhere, the rule of answer 4.

My restaurant always shows whatever the level: its decks and drills sit
above the level's in Flashcards and Quizzes and carry no scope.

### 2.5 More

More is a **screen**, not an overlay: a tab root like the others, so its
items are one tap each, every item has Back to More, Back from More returns
to where you were, and it works with a screen reader and the gesture with no
dialog to trap focus. It is drawn as each app's existing list of doors: the
Table's `nav.quiet a.door` (`Home.svelte:118-149`), the Ledger's
`nav.quiet button.door` (`renderMine`, `js/ui-levels.js:319-346`), the
Codex's `ul.v25rows` (`v25Rows`, `js/codex25.js:759-770`).

Groups, in this order, each an h2 (an h3 in the Ledger, whose masthead is
the h1): **Record and progress**, **Tools**, **Backup and data**, **The
Maître d'**, **Settings**, **About**. A group with nothing in it in an app is
left out. What each holds is in each app's section.

### 2.6 The common screens

**Home.** The four level cards, reusing each app's existing markup and art
untouched (the Table's `section.levels a.level`, `Home.svelte:100-116`; the
Ledger's `homeLevelsHTML`, `js/ui-levels.js:18-30`; the Codex's cards in
`v25HomeHtml`, `js/codex25.js:826-846`). The `nav.quiet` doors go. No
heading below the masthead, as today. Nothing else.

**The level page**, top to bottom:

1. The Back control, the level's name as the heading, the blurb, the stat
   line with `Your level` when it is the chosen one (all existing).
2. ~~A level switcher where the app has one.~~ Critic: the Ledger's
   `nav.lv-switch` (`js/ui-levels.js:169-171`) moves to the foot of the
   level page, under `What {Level} holds`, with an h3 `Another level`.
   Measured on `cons-before-ledger-level.png`: the switcher's two rows of
   44 px buttons take y 200 to 300, and with the new Back row above them
   Today's study would start near y 700 of 844, the first row cut by the
   bottom bar. Kept at the foot, it is the same component and the same
   words, the page reads like the other two apps' (heading, then what to
   do today), and Home stays the switcher in all three. Rule for every
   app, tested (7.1, test 21): the first row of Today's study is wholly
   above the fold (and above the Ledger's bottom bar) at 390 by 844,
   scroll 0.
3. **Today's study** (h2; h3 in the Ledger): three rows drawn as the app's
   door or row component, each a name, a line computed from the engines,
   and the row itself is the button:
   - **Due today**: what is due on this level and the house; opens the Due
     today deck (Flashcards).
   - **Quick quiz**: ten questions mixing this level and the house; opens
     the quick quiz (Quizzes).
   - Critic: **both rows start the run at once.** Answer 8 says Due today
     is "one tap". Tapping `Due today` here, or `Start today's cards` on
     the Flashcards root, pushes the card screen directly (first card
     showing), never the deck screen; tapping `Quick quiz` or `Start the
     quick quiz` pushes question one. Back from either returns to the
     screen the tap was made on (the level page or the root); a cold load
     of the run's address falls to its parent (`Flashcards`, `Quizzes`).
     The deck screen stays for every other deck, where there is a choice
     to make.
   - Critic: **Due today is never empty on the first morning.** On a fresh
     device nothing has been graded, so nothing is "due": the house has no
     Again ids, the Floor Deck owes nothing, no term has been learnt, and
     codex3 has no questions on its schedule. As written, the owner's
     first tap on `Due today` met `Nothing due today.` and a dead end. The
     run is the cards due, then **new cards** to make it up: up to 20
     cards a run, at most 10 of them new, new ones from the house first in
     menu order (Brennan's), then the level's, each app taking new cards
     the way its own scheduler already does (the Table's `pickSession`
     quota, `floor-deck.ts:287`; the Ledger's `sessionDeckParts()`
     `newDeck`, `js/ui-new.js:529`, which already deals the menu first;
     the Codex's unseen house wines through `startHouseDeck`, then
     `v25FirstTen`'s unseen questions). The count line says both numbers
     (6.2). The empty state is reserved for a device with nothing due and
     nothing new left. One function per app (`dueToday(level)`) gives the
     run, the row's line and the Flashcards tab's pill, so the three never
     disagree (test 22).
   - **Next reading**: the next thing to read at this level; opens it.
   - The Ledger adds **Tonight's session** (its existing three-step night,
     `todayDoor`, `js/ui-levels.js:33-55`, and `openDoor('today')`,
     `js/ui-levels.js:84-99`); the Codex adds **Your first week** while it
     is unfinished (`v25TodayHtml`'s path, `js/codex25.js:1038-1074`).
4. **My restaurant** (h2; h3 in the Ledger), whatever the level:
   - the house line, the app's existing component, unchanged;
   - the Menu Desk's waiting line when another room has left rows (the
     existing copy, moved here from Home and Mine);
   - one line counting the house: items, sections and what is studied;
   - three doors: `Study the whole menu` (the existing study view),
     `Flashcards for the menu` (the house deck in Flashcards), `Drill the
     menu` (the house drill in Quizzes);
   - Critic: the menu's sections as one wrapping row of the app's
     existing section chips (the Table's study view chips, `All 62 ·
     Tasting menus 4 · Starters 8` in `cons-before-table-mine.png`; the
     Ledger's and the Codex's chip styles), each `{Section} {n}`, each a
     link to the study list scoped to that section. Not one door per
     section: Brennan's has a dozen sections, and a dozen 70 px doors put
     Search two screens down, the very thing the doors were chosen to
     avoid;
   - Critic: then one row of the app's quiet links, each 44 px tall, for
     the setup things a server uses rarely: `The Menu Desk`, `The house`
     (switch, add, rename or export a restaurant: one place in all three
     apps, so More's Backup holds only the whole device's backup), and in
     the Codex `The full wine list` and `Look over her marks`;
   - No house on the device: the no-house sentence and the app's existing
     door to set one up.
   Why doors and not the whole study list inline: at 390 px Brennan's menu
   is sixty-odd rows; inline, it would push Search off the page and bury
   Today's study's siblings. The study list and its cards are one tap away,
   scoped, and Back returns to the level page with its scroll.
   Critic: the section scope is part of the study list's address, so Back
   and a reload keep it: Table `/menu?section={name}` (read in `onMount`,
   the prerender rule), Ledger and Codex a section segment in the hash
   that `check-nav` proves can never be read as an item's slug or id
   (Ledger `#/menu/section/{slug}`, Codex `#/v/cellar/section/{slug}`;
   house drink ids start `b-` and wine ids `w-`).
5. **Search** (h2; h3 in the Ledger): one search box over the app's items
   and the house, results inline under it in two groups, `From the menu`
   and `In the app`, each result a link to its screen (a push). Typing
   repaints the results only, never the page (each app's existing targeted
   repaint pattern), so the caret stays.
6. **What {Level} holds**: a closed `details` (the summary says `Show` or
   `Hide` in words, the Codex's `v25WireSecs` pattern, `js/codex25.js:918-926`)
   listing each subsection with `N at this level` and its word and figure,
   each line a link into the Library filtered to that subsection. Nothing
   that the old level page counted is lost.

The training doors (Read, Flashcards, Quiz, Hands on, Test) leave the level
page: Read goes to Library (filtered), Flashcards to the Flashcards tab,
Quiz, Test and Hands on to the Quizzes tab. Each app's screen map lists every
door's new home.

**Flashcards**, top to bottom: the heading `Flashcards`, the scope chip,
then:

1. **Due today**, first and alone: the count in words and one button. One
   tap runs a spaced deck of what is due on this level and the house, from
   the app's own schedules. Nothing due: the empty line and no button.
2. **My restaurant**: the whole menu, then one deck per menu section, then
   `My weak ones` (the house cards last answered Again), then the house's
   other card kinds where the app has them.
3. **{Level name}**: the level's subjects, one deck each.
4. **Words**: the terms decks.
5. **Reference cards**: the app's reference decks and the mastery views.

Each deck is one row (the app's door or row component): the name, a line
with the count and how many are learnt, and the row opens the **deck
screen**. One deck picker per app: this screen.

Critic: **a row appears once on a screen.** `The menu's words` was listed
both under My restaurant and under Words in the Ledger and the Codex; it
sits under Words only. **One card style per app means the old card
screens forward.** Answer 8 is "one deck screen and one card style per
app"; the first draft left the Table's `/service/deck/study` (three
buttons), `/menu/quiz?mode=cards` and `/lexicon?start=flash` drawing their
own cards beside the new one, and kept `The Floor Deck page` as a second
picker. Each old address now forwards with a replace to the matching deck
on the one card screen (Table 3.7, Ledger 4.7, Codex 5.7 name them), so
every old link lands and there is one way a card looks.

**The deck screen** (one per app): Back, the deck's name as heading, a line
`{n} cards · {m} learnt`, the ways to study it where the engine has more
than one (the Ledger's `FC_MODES`, the Codex's direction), a closed
`Narrow this deck` disclosure holding the engine's existing filters, and
`Start`. Start pushes the **card screen**.

**The card screen** (one per app, one card style per app): Back, a position
line `Card {i} of {n} · {deck name}`, the face, then `Flip`; once flipped,
`Got it` and `Again` (never before Flip, the rule all three already keep).
Each card after the first replaces the entry. The last card replaces the
entry with the **deck summary**: `Deck done`, `{g} got it, {a} to see
again.`, and `Study the misses` (when there are misses) and `Another deck`.
Every grade goes to the record the engine already writes; nothing about a
grade changes meaning.

**Quizzes**, top to bottom: the heading `Quizzes`, the scope chip, then:

1. **Quick quiz**, first and alone: one line and one button.
2. **My restaurant**: Pairings, Say it back, Guest at the table, and the
   app's other house drills.
3. **{Level name}**: the level's subject quizzes.
4. **Hands on**: the drills done with hands, a glass or a voice.
5. **The {Level name} test**, last, with its existing one-line description.

Each quiz is a row that starts it (a push). Every round ends on the
**results screen** (2.7).

**Library**, top to bottom: the heading `Library`, the scope chip, one line
`Reading for {Level name}. Nothing here is graded.` (all levels: `Reading
for every level. Nothing here is graded.`), the shelves as rows with their
count at the level, and **Videos** (the house's videos list, each a link
out, `Each video opens in a new tab and needs a connection.`). Reading only:
anything that tests you is in Quizzes, anything you flip is in Flashcards.

### 2.7 The results screen

Every quiz round, the quick quiz included, ends on a results screen that
keeps the app's existing tally and adds, in this order:

- the heading `What you missed` (or the existing heading where the app has
  one, with this list under it);
- one row per miss: the question, `Answer: {right answer}`, the app's
  existing explanation line where it has one, and one link: `Study this
  card` when the miss has a card (opens that card's study place: a push, so
  Back returns to these results), else `Read about it` when it has a
  reading place, else nothing;
- `Nothing missed.` when there were none;
- the buttons `Study the misses` (deals the missed items' cards as a deck,
  when ~~two or more~~ Critic: one or more have cards; a single miss is the
  commonest result of a good round and is still worth a card) and the
  app's existing `Deal another` or `Again`.
- Critic: `Study the misses` deals **every** missed item that has a card,
  whichever engine it came from, as one run on the one card screen: the
  quick quiz mixes house and level questions, so its misses are mixed, and
  the first draft's Table fallback (`deck-slipping`, the whole slipping
  deck) dealt neither the misses nor only them. The deck id is `misses`,
  its members carried in the address (Table `?deck=misses&h={ids}&c={ids}&t={slugs}`
  for house items, Floor Deck cards and terms; Ledger
  `#/flashcards/misses/{keys}`; Codex `#/flashcards/misses/{ids}`), so Back
  to it and a reload deal the same cards.
- Critic: every quiz row, and the results heading, names what the round
  asks in one line (the Table's `The dishes` and `Drill the house` were
  otherwise two rows a new server cannot tell apart).

The level tests keep their own no-score report exactly as built (the
Table's `/level/[n]/test`, the Ledger's `renderLevelTest`, the Codex's
`v25TestReportHtml`), each miss gaining the same link.

### 2.8 The words for states

- A pressed chip says so in words: the chosen level chip `Your level`; a
  mode chip the Table's existing `, chosen` and `, off` (`menu/quiz/+page.svelte:693`).
- A card before Flip carries the eyebrow `Front`; after, `Answer`.
- A deck row's line always says how many are learnt, never a bare number.
- A disclosure's summary says `Show` or `Hide`.

### 2.9 Readable at arm's length (Critic)

The owner studies on a phone held at arm's length between shifts. On every
new screen: row names at the app's existing door name size, row lines at
the app's body size and never below 15 px computed, no line of a row
clamped or truncated with an ellipsis (a dish's line wraps), and every row
a single target whose whole box, not only its name, is the button. Nothing
here adds a size; it forbids shrinking the art's sizes to fit more rows.
Test 13 measures computed font sizes on the new screens.

## 3. The World Table

### 3.1 The pieces reused

- Nav: `MODES` and `OWNS` (`src/routes/+layout.svelte:170-193`), the owner
  resolution (`+layout.svelte:245-258`), `.modetab` (`+layout.svelte:590-611`,
  `801`, `816`), the badge lane (`+layout.svelte:582-589`), the service
  toggle (`+layout.svelte:365-375`).
- Home: `Home.svelte:100-116` (cards), the deskline (`Home.svelte:124-135`).
- Level engine: `levels.svelte.ts` (`progress`, `current`, `ready`),
  `src/lib/levels.ts` (`LEVEL_KEYS` 68, `statOf` 88, `itemsAt` 137,
  `levelFromSearch` 248, `levelHref` 256, `buildLevelTest` 381,
  `gradeLevelAnswer` 433).
- The house's study rules: `src/lib/study.ts` (`studyRows` 349,
  `studySections` 369, `searchRows` 407, `searchElsewhere` 417, `itemCards`
  680, `studyProgress` 713, `latestVerdicts` 734, `studyVideos` 786), the
  drill slot `src/lib/house-drilled.ts` (`readDrilled` 91, `markDrilled` 109),
  the house rounds `src/lib/house-drill-round.ts` (`QUIZ_MODES` and
  `MODE_LABELS` 35-46, `dealRound` 152, `explainAnswer` 219, `shuffleCards`
  270, `dealSection` 322), the engine's `buildFlashcards`
  (`src/lib/house/house-drills.ts:499`).
- The Floor Deck: `src/lib/floor-deck.ts` (`cardsInScope` 174,
  `pickSession` 287, `flipRecordable` 335, `sectionProgress` 355,
  `slipping` 394, `dueCount` 405, `owedCount` 416, `mcFor` 460,
  `FLIP_GRADES` 78), `FloorCard.svelte` (the one place a deck card's
  answers render).
- The Lexicon: `src/lib/lexicon-quiz.ts` (`nextTarget` 89, `optionsForTerm`
  115, `gradeForQuiz` 130), the due terms rule in `/lexicon`
  (`src/routes/lexicon/+page.svelte:241-247`), `TERM_LADDER_DAYS`
  (`src/lib/repertoire.ts:123`).
- Screens: `/menu` study view (`StudyMenu.svelte`, `StudyCard.svelte`), its
  shallow card history (`menu/+page.svelte:420-450`) and `snapshot`
  (`menu/+page.svelte:490-499`), `HouseBar.svelte`, `HouseCard.svelte`,
  `MenuImport.svelte`, `/menu/quiz` (`menu/quiz/+page.svelte`), the deck
  routes under `/service/deck`, `/level/[n]/test`, `/level/[n]/read`.

### 3.2 The tab bar and who owns what

`MODES` becomes, with every href a literal so `verify-build`'s scanner
resolves it to a page (`navigation.test.ts` pins this):

```
{ href: '', label: 'Home' },
{ href: '/flashcards', label: 'Flashcards' },
{ href: '/quizzes', label: 'Quizzes' },
{ href: '/library', label: 'Library' },
{ href: '/more', label: 'More' }
```

The owner of a path, decided once (the rule at `+layout.svelte:245-258`),
tested in this order; the first match wins:

1. `/level/N/test` (regex `^/level/[1-4]/test$`): Quizzes.
2. `/level/N/read` (regex `^/level/[1-4]/read$`): Library.
3. More: `/more`, `/repertoire`, `/coverage`, `/menu/costing`,
   `/menu/preps`, `/menu/prep-board`, `/menu/waste`, `/menu/producers`,
   `/menu/guest`.
4. Quizzes: `/quizzes`, `/menu/quiz`, `/service/deck/test`,
   `/service/deck/say`, `/service/deck/lineup`, `/service/drill`,
   `/practise`.
5. Flashcards: `/flashcards`, `/service/deck/study`, `/service/deck`.
6. Library: `/library`, `/recipes`, `/recipe/`, `/chapter/`, `/family`,
   `/lexicon`, `/pantry`, `/technique`, `/plates`, `/service`, `/safety`,
   `/palate`, `/study`.
7. Home: `/`, `/level`, `/menu`.

`/menu/quiz?mode=cards` lights Flashcards in the browser only (the layout
may read `page.url.searchParams` only behind `browser`, never during the
prerender, the first Convention); the prerendered page lights Quizzes.

Fitting one row at 390 px: the service toggle leaves the bar for More,
Settings (it stays the only day and night control, with the same
`prefs.toggleService()` and its words `Day service` and `Night service`); at
`max-width: 599px` `.modetab` takes `padding-inline: 4px; min-width: 44px;
text-align: center` in the phone block at `+layout.svelte:816`. Measured
arithmetic from this session's widths (Home 52, Flashcards 91, Quizzes 65,
Library 63, More 50 at 8 px padding): at 4 px the five come to 283 px plus
16 px of gaps from x 60, ending at x 359 inside the 370 px line. The builder
measures it and the spec asserts one row at 390 and 375.

Critic: in `MODES` above, the More entry is drawn as the quiet control at
the right end of the bar where the moon is today (2.1), so `MODES` holds
the four tabs and the layout draws More after them from a fifth literal
(`{ href: '/more', label: 'More', quiet: true }` is acceptable if
`navigation.test.ts` pins it last and quiet). The arithmetic is unchanged:
the same five widths in the same row.

The Flashcards tab carries the due-today pill (`.pill`, absent at zero, with
a visually hidden ` due`). The old pills move: the house's dish count to My
restaurant's count line, the re-cook count (`dueCount`,
`+layout.svelte:228-232`) to More's Record row.

### 3.3 Back and history in the Table

New `src/lib/nav.ts`, pure, every function taking its `Storage` as an
argument so the rules are unit-tested under Node with a Map (the
`desk-inbox.ts` rule):

- `parentOf(path: string, search: string): string` returns the logical
  parent's href for every route in the screen map (3.11), `'/'` for
  anything unknown. Total over the route list; a unit test walks every
  `+page.svelte` and asserts a parent other than itself (Home excepted).
- `depthAfter(prev, event)` for the events `enter`, `push`, `replace`,
  `pop` (with SvelteKit's `delta`), `shallowPush`, `shallowPop`.
- `readDepth(storage, href)` and `writeDepth(storage, d, href, base)`
  over `oot-nav-table-v1`.

Wiring:

- `BackButton.svelte`, rendered by the layout as the first child of
  `main#main` inside a `div.shell.backline` on every path except `/`, and
  never on the error page's Home link duplicate. Click: depth above 0,
  `history.back()`; else `goto(base + parentOf(...), { replaceState: true })`
  with the depth left at 0.
- The layout's `afterNavigate` records the depth: `enter` keeps the stored
  depth when the stored `href` is this one, else 0; `link` and `goto` push
  plus one unless the navigation was a replace; `popstate` adds `delta`.
  Replaces are marked: every existing `goto(..., { replaceState: true })`
  (the `/level` forwarder, `src/routes/level/+page.svelte:28`; the bare-path
  fix, `+layout.svelte:139-143`, which uses `history.replaceState` directly
  and is left alone, it never changes depth) calls `navReplace()` first.
- Shallow entries: `openCard` (`menu/+page.svelte:420-425`) and the new
  deck and quick-quiz states push through `navPushShallow(url, state)`,
  which adds `ootd: d + 1` to the page state and records `base: d`; a
  window `popstate` listener reads `page.state.ootd` after a tick and, when
  none is present and no `afterNavigate` ran, restores `base`.
- Scroll: SvelteKit restores full navigations itself. Each list root exports
  a `snapshot` of its scroll and filters, the `menu/+page.svelte:490-499`
  pattern: `/flashcards`, `/quizzes`, `/library`, `/more`, `/level/[n]`,
  `/recipes` (already holds its URL state), `/lexicon`, `/technique`,
  `/plates`, `/service`. Shallow states restore after two frames, the
  `menu/+page.svelte:396-413` pattern.
- The old `fromStudy` round trip (`menu/quiz/+page.svelte:342`, `458-460`,
  `673`) folds into the rule: its `Close the deck` becomes the Back control,
  which does `history.back()` because the study view pushed.
- Every `nav.crumbs` in the routes is removed (the Back control replaces
  it); `StudyCard.svelte:153`'s `Back to the menu` chip is removed, its
  position line and Next stay.
- Critic: **the editing page is a screen.** `Edit the menu`
  (`button.studyedit`, `menu/+page.svelte:1307`) flips the component's
  `editMode` and changes the heading, so by 2.3 it is a screen change, but
  as written it pushed nothing: Back from the editing page left `/menu`
  for the level page, which is not the previous screen. `Edit the menu`
  now pushes a shallow entry (`navPushShallow` with `{ edit: true }`), a pop
  of it returns to the study view, and the editing page's own switch back
  to study is replaced by Back when the edit was pushed. Where editing is
  the decided landing (a house with no dishes, `menu/+page.svelte:341-350`),
  nothing was pushed and its switch stays, as the only way to the study
  view. `gotoEditing()` (`tests/helpers.ts:389`) keeps working: it presses
  the same button.
- Critic: SvelteKit restores `page.state` when the visitor comes back into
  `/flashcards` or `/quizzes` from another route, but not component state,
  so a deck, run or result reached by a pop is drawn from `page.state`
  plus `snapshot` (2.3, a run screen reached by Back). A `pageshow` with
  `persisted` (the bfcache) rereads the depth from `oot-nav-table-v1`.

### 3.4 The chosen level in the Table

`levels.svelte.ts` gains `chosen` (getter) and `choose(n)`: `chosen` is the
slot `oot-level-table-v1` when it holds 1 to 4 and the store is ready, else
`current`. `choose(n)` writes the slot (try) and is called by
`/level/[n]`'s `onMount`. `Home.svelte` marks `chosen` as `Your level`
(today it marks `current`, `Home.svelte:103`). The slot is not in
`oot-profiles.js` BASES, never exported, and read nowhere earlier than
`onMount` (no localStorage in the prerender pass). `/level` forwards to
`levelHref(levels.chosen)` (`src/routes/level/+page.svelte:28`).

### 3.5 Home

`Home.svelte` keeps lines 99-116 and loses the `nav.quiet` (118-149), the
deskline moving to the level page's My restaurant (its class, copy and link
`{base}/menu#desk` kept, `tests/menu-desk.spec.ts` reads it). The
`curriculum` prop and the Record door's figures move to More's Record row.
The regression suite's "no h2 and no h3 on the home" stays true.

### 3.6 The level page (`/level/[n]`)

Rewritten in place (same route, same load, same `data.counts`,
`data.subsections`, `data.primed`):

1. Back (layout), `h1` the level's name, the lede, the stat line
   (`level/[n]/+page.svelte:140-145`, kept).
2. **Today's study** (`h2`), three `a.door` rows in `nav.quiet` (the Home
   door markup and its CSS moved into a shared stylesheet or copied with the
   component):
   - `Due today`: count = `owedCount(deck, session.drillLog, now, { levels:
     new Set([n]) })` (`floor-deck.ts:416`, owed reaches down, the deck's
     rule) + the house's Again ids (`studyProgress(...).againIds`,
     `study.ts:713`, over `latestVerdicts(current.id, readDrilled())`) + the
     level's due Lexicon terms (the rule at `lexicon/+page.svelte:241-247`
     scoped to `itemsAt(data, 'lexicon', n)`). Opens
     `/flashcards?deck=due`.
   - `Quick quiz`: opens `/quizzes?quick=1`.
   - `Next reading`: the level's primer for the first subsection (in
     `data.subsections` order) that has a primer (`data.primed`) and whose
     figure is not `Met`, as `/level/{n}/read#{key}`; when all are met, the
     first unmet technique `/technique/{slug}`; when nothing is left, the
     empty line and `/library`.
3. **My restaurant** (`h2`): `<HouseBar />` (as in `houseDoors`,
   `menu/+page.svelte:1054-1061`), the deskline (moved from Home), the
   count line, the sections from `studySections(studyRows(current,
   'dish'))` (`study.ts:349`, `369`) as `a.door` rows to
   `/menu?section={name}` (the study view seeds its section chip from the
   query in `onMount`, a new three-line seed beside the meal seed at
   `menu/+page.svelte:363-378`), then `Study the whole menu` (`/menu`),
   `Flashcards for the menu` (`/flashcards?deck=menu`), `Drill the menu`
   (`/menu/quiz?mode=drill`), `The Menu Desk` (`/menu#desk`).
   Critic: in the order of 2.6 item 4: the three study doors as `a.door`,
   then the sections as the study view's own section chips (links, not
   doors), then the quiet links `The Menu Desk` (`/menu#desk`) and `The
   house` (`/menu#house`, moved here from More's Backup).
   Critic: `Due today`'s count and run come from one `dueToday(n)` in a new
   `src/lib/today.ts` (pure, unit-tested), which adds new cards (2.6) and
   also feeds the Flashcards pill and the root's Due today block.
4. **Search** (`h2`): an `input type="search"` labelled `Search the menu
   and the app`. Results: `From the menu`, `searchRows` and
   `searchElsewhere` (`study.ts:407`, `417`) over the current house, each to
   `/menu#d-...`; `In the app`, substring over the names the page already
   loads in `onMount` (`level/[n]/+page.svelte:36-60`: Lexicon terms to
   `/lexicon#slug`, deck cards to `/service/deck/study?card=`, modules to
   `/service/{key}`, techniques to `/technique/{slug}`, plates), at most
   eight, then the link `Search all recipes for "{q}"` to `/recipes?q={q}`
   (`urlState.ts:70` reads it). The `/` key focuses it (the layout's
   handler already finds the first search box, `+layout.svelte:266-277`).
5. **What {Level} holds**: `details` with today's `ol.subsections` lines
   (`level/[n]/+page.svelte:151-183`) minus the `div.doors`, each title a
   link to the subsection's Library shelf at the level (3.9).

### 3.7 Flashcards (`/flashcards`, new)

One prerendered page; the deck screen and the card screen are shallow
states of it (`?deck=` pushed through `navPushShallow`, the card run a
second shallow push), so no route beyond `/flashcards` is added for them.
Prerendered pages may not read `url.searchParams`: the deck is seeded from
the query in `afterNavigate` (the `/lexicon` pattern,
`lexicon/+page.svelte:43-56`).

The deck ids and the engine behind each:

- `due`: one queue, in this order: the house's Again cards (`itemCards`
  with `{ itemIds: againIds }`), the deck's owed cards at the level
  (`pickSession` restricted to owed, `floor-deck.ts:287`), the level's due
  Lexicon terms.
- `menu`, `menu:{section}`, `menu-weak`: `itemCards(current, 'dish',
  scope)` (`study.ts:680`), scope `{ all: true }`, `{ section }`, `{
  itemIds: againIds }`; `menu&item={id}` for one dish (the card's
  `Flash cards for this`).
- `menu-parts`: `buildFlashcards(current)` shuffled (`shuffleCards`), the
  `Part by part` deck (`menu/quiz/+page.svelte:301-309`).
- `deck:{sectionKey}`: the Floor Deck section at the chosen level
  (`cardsInScope`, `floor-deck.ts:174`, through `pickSession` so new cards
  get their quota).
- `deck-all`: the whole Floor Deck in teaching order.
- `deck-slipping`: `slipping(deck, log, now)` (`floor-deck.ts:394`).
- `lexicon`, `lexicon-all`: the level's terms, or all 779, shuffled.

The rows: Due today (2.6); **My restaurant**: `The whole menu`, one per
section, `My weak ones` (only when there are any), `Part by part`; **{Level
name}**: one per live Floor Deck section at the level (`liveSections`,
`sectionProgress(deck, log, n)` for `learnt`); **Words**: `The Lexicon at
{Level name}` (all levels: `The whole Lexicon`); **Reference cards**: `The
whole Floor Deck`, `Keeps slipping` (when any), and the door `The Floor Deck
page` to `/service/deck` (its landing, levels and plates stay as they are).

Critic: the door `The Floor Deck page` is struck: it was a second deck
picker on the Flashcards root. `/service/deck` stays as an address and
keeps its plates and its reading, but its study doors open the matching
`/flashcards?deck=` rows. The old card screens forward with
`goto(..., { replaceState: true })` after `navReplace()`, reading their
query in `afterNavigate` (prerender rule): `/service/deck/study?card={id}`
to `/flashcards?deck=deck:{section of id}&card={id}` (the run opened on
that card), `/service/deck/study` bare to `/flashcards?deck=deck-all`,
`/menu/quiz?mode=cards` (with its scope query) to `/flashcards?deck=menu`
(or `menu-parts`, `menu:{section}`, `menu&item=`), `/lexicon?start=flash`
to `/flashcards?deck=lexicon`. Each forwarder is a few lines in the old
page's script; the routes stay for old links and for `verify-build`'s
scanner. The deck results link in 3.8 changes with it. `FloorCard.svelte`
inside `DeckFrame` keeps the paywall contract (`class="flash"`,
`class="def"`), so the forward loses nothing the contract tests read; the
tests that drive `/service/deck/study` directly are pointed at the new
card screen (the same grades through `flipRecordable`).

Critic: the card run is its own shallow entry with an address, so the
gesture and a reload behave: `/flashcards?deck={id}&run=1` (Due today:
`?deck=due&run=1`, pushed straight from the level page or the root, 2.6).
A cold load or reload of `run=1` with no run in `page.state` replaces to
the deck screen (Due today: to `/flashcards`; `misses` deals again from
the members in its address).

**The card screen** is `DeckFrame.svelte` (new): the position line, the
eyebrow `Front` or `Answer`, a face slot, and the controls `Flip`, `Got it`,
`Again`, styled with the existing `.chip` and `.chip.go`
(`menu/quiz/+page.svelte` `.chip.go`, the filled art the CLAUDE.md
describes). Faces: a house card draws the item card's front and back as
`/menu/quiz` mode cards does; a deck card draws `FloorCard.svelte` (so the
deck stays under the paywall contract, `class="flash"` and `class="def"`);
a Lexicon term draws the `.flash` term and definition
(`lexicon/+page.svelte:420-427`). Grades:

- house card: `Got it` and `Again` record `card-item` (or `card-{kind}`
  for Part by part) in the house drill slot exactly as `judgeCard` does
  (`menu/quiz/+page.svelte:311-324`);
- deck card: `Got it` is `FLIP_GRADES.had` (records `close`), `Again` is
  `FLIP_GRADES.missed` and returns the card later in the run, through
  `session.markDrilled` guarded by `flipRecordable`, as
  `/service/deck/study` does (`service/deck/study/+page.svelte:112-115`).
  `shaky` also recorded `close`, so two buttons lose no record;
- Lexicon term: records nothing, as the Lexicon's flash cards record
  nothing today (`lexicon/+page.svelte:202-212`).

### 3.8 Quizzes (`/quizzes`, new)

The quick quiz is a shallow state of it (`?quick=1`).

**The quick quiz** builds ten in one round, alternating house and level:

- house: `dealRound(current, ALL_KINDS, 5, Math.random)`
  (`house-drill-round.ts:152`), only the kinds `poolSize` says can be
  dealt; recorded through `markDrilled` as the `drill` mode records;
  explained with `explainAnswer` (`house-drill-round.ts:219`).
- level: owed first, then never asked: Floor Deck cards at the level as
  `mcFor(card, cards, undefined, rand)` (`floor-deck.ts:460`; **no traps**:
  only `/service/deck/test` and `/level/[n]/test` may name `loadDeckTraps`,
  a test scans the routes for it) and the level's Lexicon terms as
  `optionsForTerm` (`lexicon-quiz.ts:115`), graded with `gradeLevelAnswer`
  (`levels.ts:433`, the deck `met` or `missed`, the Lexicon never `met`).
- A side that cannot supply five is topped up by the other; no house, ten
  from the level.

Results (2.7): a house miss links `Study this card` to `/menu#{itemId}`; a
deck miss to ~~`/service/deck/study?card={id}`~~ Critic:
`/flashcards?deck=deck:{section}&card={id}` (the one card screen); a
Lexicon miss `Read about it` to `/lexicon#{slug}`. `Study the misses` opens
~~`/flashcards?deck=` with the missed house ids when the misses are house
cards, else the deck's `deck-slipping`~~ Critic: `/flashcards?deck=misses`
with every missed house id, deck card and term in the address (2.7), run
at once.

Critic: **`/menu/quiz` loses its mode chips.** Its row of mode chips
(`menu/quiz/+page.svelte:692-693`) is a second quiz picker inside Quizzes,
and its `Flip cards` chip a way into a second card style. Each mode is now
reached from its Quizzes row (cards from Flashcards), the page's heading
names the mode from `MODE_LABELS`, and a mode change is a new address
(`?mode=`), which is a screen change and a push, never an in-page chip.
The `, chosen` and `, off` words go with the chips (2.8 keeps them only
where a mode chip remains elsewhere). The Quizzes rows carry these lines
(new copy, 6.4): `The dishes` / `Name the dish from what is on the plate.`;
`Drill the menu` (the label of `?mode=drill` on every Table screen, so the
level page's door and the Quizzes row say the same words; `MODE_LABELS`
keeps its value for the record's history) / `Mixed questions from every
section, ten at a time.`; `Pairings` / `Which wine from our list, and why.`;
`Say it back` / `The ten, twenty and forty five second lines, out loud.`;
`Guest at the table` / `A guest asks; you answer.` The builder checks each
line against what the mode actually deals and corrects the words, not the
mode.

The rows: Quick quiz; **My restaurant**: `The dishes` (`/menu/quiz`),
`Drill the house` (`?mode=drill`), `Pairings` (`?mode=pair`), `Say it back`
(`?mode=say`), `Guest at the table` (`?mode=guest`) (labels from
`MODE_LABELS`, `house-drill-round.ts:38-45`); **{Level name}**: `The
written test` (`/service/deck/test?level={n}`), `Say it back: the Floor
Deck` (`/service/deck/say?level={n}`), `The Lexicon quiz`
(`/lexicon?level={n}&start=quiz`), `The service drill`
(`/service/drill?level={n}`); **Hands on**: `The firing drill`
(`/practise/firing`), `Calibrate your palate` (`/practise/calibrate`), `The
lineup` (`/service/deck/lineup`); last, `The {Level name} test`
(`/level/{n}/test`). Show all: the level rows without `?level=`, and the
four level tests listed by name.

### 3.9 Library (`/library`, new)

Rows (`a.door`), each with its count at the chosen level where the data
gives one, filtered by the existing query each page already reads:

- `What {Level name} asks` to `/level/{n}/read` (the primers; all levels:
  the four, by name);
- `Recipes` to `/recipes?diff={1|2|3}` (the level page's difficulty proxy,
  `level/[n]/+page.svelte:123`; all: `/recipes`);
- `The Path of Study` to `/study`; `Chapters` (the chapter rail lives on
  `/recipes`, so this row is `/recipes#chapters` only if that anchor exists,
  else left out); `The Family Chapter` to `/family`;
- Critic: `Chapters` is never left out: answer 6 names chapters first
  among the reading, and on a phone the cuisine rail sits under the dishes
  on `/recipes` (`RecipeBrowser.svelte:321`, "Dishes FIRST on a phone"),
  so without this row the 171 chapters have no visible door. The row is a
  closed `details` on `/library` itself, `Show the chapters` and `Hide the
  chapters`, listing every chapter by name with its dish count, each a
  link to `/chapter/{slug}`, built in `onMount` from the chapter index the
  recipes data already carries (no new fetch, no edit to the deliberately
  untouched `RecipeBrowser`).
- `The Lexicon` to `/lexicon?level={n}`; `Techniques` to
  `/technique?level={n}`; `The pantry` to `/pantry`;
- `The Plates` to `/plates`; `Service` to `/service`; `The repair table` to
  `/palate`; `Food safety` to `/safety`;
- **Videos**: the house's video groups from `studyVideos(current)`
  (`study.ts:786`) drawn with `VideoList.svelte` or the `section.vgroup`
  markup of `StudyMenu.svelte:249-262`, with the connection line.

The subsection links from the level page's `What {Level} holds` land on the
matching row's address.

### 3.10 More (`/more`, new)

- **Record and progress**: `The record` (`/repertoire`, line: `{done} of
  {n} cooked, {all} dishes in all.` and `{k} past their re-cook` when any,
  the figures from `Home.svelte:91-96` and `+layout.svelte:228-232`), `The
  coverage board` (`/coverage`).
- **Tools**: `Cost this menu` (`/menu/costing`), `Preps` (`/menu/preps`),
  `The prep board` (`/menu/prep-board`), `The waste log` (`/menu/waste`),
  `Producers` (`/menu/producers`), `The guest menu` (`/menu/guest`), `Plan a
  menu from the Library` (`/menu#plan`, which opens the planner drawer; the
  hash is read once in `onMount` the way `#desk` is).
- **Backup and data**: `Export, import and print` (`/menu#tools`, which
  opens the `Session and tools` drawer and focuses Export, the existing
  `openTools`, `menu/+page.svelte:480-486`), ~~`The house` (the `HouseBar`
  doors on `/menu#house`, which scrolls to the house card)~~. Critic: `The
  house` moves to My restaurant's quiet links (2.6), its one place in all
  three apps; More keeps the whole device's backup only, and the row is
  worded `Back up, restore and print` so it is not mistaken for importing
  a menu (which is the Menu Desk's, under My restaurant, answer 5).
- **The Maître d'**: `The Maître d'` (`/menu#maitre`, which calls the
  existing `herSettings`).
- **Settings**: the service toggle as a button reading `Day service` or
  `Night service` (`prefs.toggleService()`).
- **About**: the footer's three counts as a line, and Privacy and Terms on
  the shared origin (the footer's rule, `+layout.svelte:470-473`).

The three new `/menu#...` hashes are read once in `onMount` beside the cold
card hash (`menu/+page.svelte:380-394`), each then cleared with
`replaceState` so the address does not keep reopening them.

### 3.11 The Table's screen map

Every route, its new home, and its logical parent (`parentOf`).

- `/` Home (Home), no parent, no Back.
- `/level` Home, forwards to the chosen level (unchanged, `replaceState`).
- `/level/[n]` Home, parent `/`.
- `/level/[n]/read` Library, parent `/library`.
- `/level/[n]/test` Quizzes, parent `/quizzes`.
- `/menu` (study view, My restaurant) Home, parent `/level/{chosen}`; with a
  card open (`#d-...`), parent `/menu`; editing (`Edit the menu`, component
  state) the same page. Critic: editing, when pushed, is a shallow entry
  whose parent is the study view (3.3).
- `/menu/quiz` Quizzes (Flashcards for `mode=cards`), parent `/quizzes`
  (`/flashcards` for `mode=cards`). Critic: `mode=cards` forwards to
  `/flashcards?deck=menu` (3.7), so it never draws its own card.
- Critic: `/service/deck/study` forwards to the card screen (3.7);
  `/lexicon?start=flash` forwards to `/flashcards?deck=lexicon`.
- Critic: `/flashcards?deck={id}&run=1` parent the deck screen;
  `?deck=due&run=1` and `?deck=misses&run=1` parent `/flashcards`.
- `/menu/costing`, `/menu/preps`, `/menu/prep-board`, `/menu/waste`,
  `/menu/producers`, `/menu/guest` More, parent `/more`.
- `/repertoire`, `/coverage` More, parent `/more`.
- `/practise/firing`, `/practise/calibrate` Quizzes, parent `/quizzes`.
- `/service/deck` Flashcards, parent `/flashcards`.
- `/service/deck/study` Flashcards, parent `/flashcards`.
- `/service/deck/test`, `/service/deck/say`, `/service/deck/lineup`,
  `/service/drill` Quizzes, parent `/quizzes`.
- `/service` Library, parent `/library`; `/service/[topic]` parent
  `/service`.
- `/recipes` Library, parent `/library`; `/recipe/[slug]` and
  `/chapter/[slug]` parent `/recipes`.
- `/family` Library, parent `/library`; `/family/[slug]` parent `/family`.
- `/lexicon`, `/pantry`, `/technique`, `/plates`, `/safety`, `/palate`,
  `/study` Library, parent `/library`; `/technique/[slug]` parent
  `/technique`; `/plates/[slug]` parent `/plates`.
- `/flashcards` Flashcards, parent `/`; `?deck=` parent `/flashcards`; the
  card run parent the deck screen.
- `/quizzes` Quizzes, parent `/`; `?quick=1` parent `/quizzes`.
- `/library`, `/more` their tabs, parent `/`.
- The error page: parent `/`.

Old doors and where they went: Home's Today door (`todayFromLevel`) is
replaced by Today's study (`todayFromLevel` stays exported and tested, and is
no longer drawn); Library door to the Library tab; Record door to More,
Record; `Mine · My Menu` to My restaurant on the level page. The level
page's doors: `Read first`, `Read the semester`, `The library at this
level`, `Read the techniques`, `Read the terms`, `The wall`, `The repair
table`, `Read`, `The whole page`, `The first module`, `The track` to
Library rows; `Flashcards` (Lexicon) and `Flip cards` (deck) to Flashcards
decks; `Quiz`, `The written test`, `Say it back`, `Drill`, `Calibrate` to
Quizzes rows; `Cook the next dish` and `The next technique` to Next reading
or the level's `What {Level} holds` lists; `The deck` to Reference cards;
`The {Level} test` to Quizzes, last. The `/menu` kitchen links
(`menu/+page.svelte:1063-1080`) stay on the editing page and also appear in
More.

### 3.12 Precache and the Table's own rules

Four new routes (`/flashcards`, `/quizzes`, `/library`, `/more`), each a hub
over engines already in chunks. The precache was 2.954 MB gzipped against
the 3.5 MB cap (`CAP_MB`, `tools/verify-build.mjs:370`) at the last
measure; `npm run verify:build` prints the live figure and is the judge.
The new pages load data in `onMount`, never in `load` (a universal load is
inlined into the prerendered HTML). `navigation.test.ts` pins the five words
and their order and the literal hrefs. Specs that open the editing page keep
using `gotoEditing()`.

## 4. The Bartender's Ledger

### 4.1 The pieces reused

`TABS` (`js/app.js:3`), `render` (`js/app.js:30-150`), `navClick`
(`js/app.js:159-182`), the hashchange listener (`js/app.js:195`), the
keyboard map (`js/app.js:259-264`), `NAV_CLUSTERS` and `renderNav`
(`js/ui-new.js:2-56`), `TAB_WAS` and `ROUTE_WAS` (`js/ui-new.js:86-96`),
`applyRoute`, `currentRoute`, `syncRoute` (`js/ui-new.js:99-165`), the search
index and overlay (`buildSearchIndex` 169, `searchResults` 215,
`renderSearch` 231, `openSearch` 266), `sessionDeckParts` and
`startSession` (`js/ui-new.js:529`, `584`); the level screens
(`js/ui-levels.js`: `homeLevelsHTML` 18, `todayDoor` 33, `homeDoorsHTML` 62,
`openDoor` 84, `openLevel` 104, `readLabel` 117, `handsLabel` 133,
`levelBooksHTML` 143, `trainDoorsHTML` 157, `renderLevel` 162,
`renderLevelTest` 200, `levelTestsHTML` 246, `recordHTML` 257, `renderMine`
319, `LIBRARY_SHELF` and `clusterChromeHTML` 348-365); the level engine
(`js/levels.js`: `LEVELS` 36, `firstUnmetLevel` 196, `todayLevel` 203,
`levelBooks` 234, `readDoorTarget` 270, `trainTarget` 303, `bookTarget` 321,
`applyTarget` 325, `levelRound` 406, `levelRoundFromMode` 413,
`buildLevelTest` 427, `ltStart` 474); the study screens (`js/ui-study.js`:
`DECK_SOURCES` 135, `deckSources` 145, `fcPool` 278, `gradeCardKey` 388,
`FC_MODES` 432, `renderFlashcards` 446, `QUIZ_MODES` 722, `modeLabel` 746,
`buildRound` 904, `renderQuiz` 982, its done stage 1020-1046,
`videoSettingsHTML` 1078, `glossaryHTML` 1097, `renderNotes` 1109); the
practice room and tools (`js/ui-practice.js`: `renderPractice` 393,
`maitreToolHTML` 1071, `renderTools` 1097); `srsDueKeys` (`js/srs.js:71`);
the house (`js/house-bar.js`: `houseHere` 59, `houseCardFits` 191,
`housePairReady` 297, `houseQuizRound` 317, `houseDrillModes` 338,
`houseDrillPanelHTML` 350, `houseStartCards` 369, `houseStartPair` 383,
`houseAutoLoad` 593, `houseLineHTML` 750, `houseDrillChipsHTML` 818,
`houseDrillDoorsHTML` 1847); the study view (`js/house-study.js`:
`hsProgress` 464, `houseStudyOn` 531, `houseStudySectionOf` 539,
`hsVideosHTML` 683, `houseStudyHTML` 698, `houseStudyDeck` 1110, `hsPush`
and `hsReplace` 1192-1199, `houseStudyRoute` 1214, `houseStudyDeepLink`
1228); the Menu tab (`renderMenu`, `js/ui-menu.js:754`) and the desk's
waiting line (`deskWaitingHTML`, `js/ui-import.js:741`).

### 4.2 Tabs, clusters and the bar

`TABS` keeps every id and label and gains three: `['more','More']` is not
added, because `mine` already exists and becomes the More screen (its label
in `TABS` changes to `More`, so `TAB_LABEL` and the search index say More);
new ids `['record','Record and progress']` and `['videos','Videos']`.

`NAV_CLUSTERS` becomes (check.mjs requires every tab in one cluster, and the
cluster tap lands on its first tab):

```
['home', 'Home', ['home', 'level', 'menu']],
['flashcards', 'Flashcards', ['flashcards']],
['quizzes', 'Quizzes', ['quiz', 'practice', 'riffs']],
['library', 'Library', ['library', 'families', 'shots', 'na', 'ontap', 'coffee', 'prep', 'producers', 'service', 'notes', 'videos']],
['more', 'More', ['mine', 'record', 'tools']]
```

`renderNav` draws the five words in `#tabs` and `#bnav` with the existing
`cl-btn` and `bnav-btn` classes; the `cl-search` button and the bottom bar's
Search slot go (Search moves to the level page and to More, and the `/` key
still opens the overlay). Critic: More is drawn quiet in both (2.1): the
muted label, no lit underline until a More screen shows. And Search does
not go under More's **Settings**, which is no place a server would look
for it: the Library root carries a `Search everything` door at its top
(opening the existing overlay, `openSearch`, `js/ui-new.js:266`), beside
the level page's Search block, and More keeps no Search row. The `#sheet` panel (`js/ui-new.js:47-55`) stays
unused, as today. The keyboard's `1` to `5` follow the new clusters
(`js/app.js:259-264`). `navClick`'s Levels branch (`js/app.js:171`) goes;
the Home cluster lands on `home`.

### 4.3 Routes, history and Back in the Ledger

The route grammar keeps every existing address and adds:

- `#/flashcards` (the picker), `#/flashcards/all`, `#/flashcards/{deck}`
  (the deck screen), `#/flashcards/{deck}/card` (the run), `#/flashcards/board`
  (the mastery board);
- `#/quiz` (the Quizzes root), `#/quiz/all`, `#/quiz/quick`, `#/quiz/{mode}`
  (a running round, `mode` a `QUIZ_MODES` key or a `level-N-sub` mode),
  `#/quiz/{mode}/done`;
- `#/practice/{view}` for `drills`, `rail`, `hold`, `pour`, `tasting`,
  `flights`, `method`; `#/tools/{view}` for `batch`, `dates`, `strength`,
  `cost`, `spills`, `convert`, `maitre`, `data`;
- `#/level/{slug}/test` while a level test is sat;
- `#/library/all` and `#/{shelf}/all` for the Library's scope;
- `#/record`, `#/videos`, `#/mine` (More).

`currentRoute` (`js/ui-new.js:141-160`) writes these from state;
`applyRoute` (`js/ui-new.js:99-139`) reads them back. A cold load of a run
(`/card`, a running `#/quiz/{mode}`, `/done`) lands on its parent screen
(the deck screen, the Quizzes root), because a dealt hand is not in the
address. Critic: a pop within the visit renders the run from memory when
`state.fc` or `state.quiz` still holds it (2.3); only a cold load falls to
the parent. Added: `#/flashcards/due/card` (pushed straight from the level
page and the root, 2.6), `#/flashcards/misses/{keys}` and its `/card`,
`#/menu/section/{slug}` (2.6). The `gotoHash` and hash link adoption rule
of 2.3 applies here first: `gotoHash` (`js/ui-new.js:279-283`) stops
assigning `location.hash` and pushes.

`syncRoute` becomes `syncRoute(kind)`: `render()` passes `push` when the
screen key changed since the last render, else `replace`. The **screen
key** is the route without in-screen state: tab, slug, flashcards stage and
deck, quiz stage and mode, practice view, tools view, level, level test on
or off, menu sub-view and open study card. A push writes `history.pushState({
ootd: d + 1 }, '', h)`; a replace `history.replaceState(Object.assign({},
history.state, { ootd: d }), '', h)`; both mirror to `oot-nav-ledger-v1`.

A `popstate` listener calls `applyRoute()` and `render()` with
`syncRoute('none')` (the address is already right), then restores the
scroll for `location.href` from `oot-scroll-ledger-v1` after two frames.
The `hashchange` listener stays for typed and linked addresses and skips
when the href equals the one just rendered, so a pop is never rendered
twice. `hsPush` and `hsReplace` (`js/house-study.js:1192-1199`) route
through the same push and replace so the study card's entry carries its
depth. Before each push, `scrollY` is saved for the leaving href.

The Back control is drawn by `clusterChromeHTML` (`js/ui-levels.js:349-365`)
on every tab except `home`, as `<div class="crumb"><button class="chip"
data-act="back">Back</button></div>`, replacing its two crumbs; the
Library's shelf stays under it on the Library's tabs. `act==='back'`:
`history.state.ootd > 0`, `history.back()`; else `applyParent()`, which
sets the state for the logical parent (4.10) and renders with a replace.

### 4.4 The chosen level in the Ledger

`chosenLevel()` reads `oot-level-ledger-v1` (1 to 4) else
`firstUnmetLevel()`. `openLevel(n)` (`js/ui-levels.js:104-108`) writes it.
`homeLevelsHTML` marks `chosenLevel()` with `Your level`. The scope chip
sets `state.fc.level`, `state.lib.level` and the quiz rounds' level from it;
show all clears them (the existing `fc-level-clear`, the Library's
`lib-level` select).

### 4.5 Home

`homeHTML` (`js/ui-levels.js:80-82`) returns `homeLevelsHTML()` only;
`homeDoorsHTML` and `openDoor` stay defined (the wing wraps `renderHome` by
name, `js/ui-study.js:2-10`) and are no longer drawn. The desk's waiting
line moves to My restaurant.

### 4.6 The level page (`renderLevel`)

`renderLevel` (`js/ui-levels.js:162-191`) keeps the switcher, `h2.lv-title`,
the blurb and the stat line, then (Critic: the switcher moves to the foot,
under item 4, as `Another level`, 2.6):

1. **Today's study** (`h3.sub-head`), `nav.quiet` of `button.door`
   (the Home door markup, `js/ui-levels.js:65-71`):
   - `Due today`: count = the deck `fcPool()` with `special: 'due'` and
     `level: n` (the trick at `js/ui-study.js:476-477`) plus the house's weak
     ones (`hsProgress(ids).againIds`, `js/house-study.js:464`). Opens
     `#/flashcards/due`. Critic: the run and its count are
     `sessionDeckParts()` (`js/ui-new.js:529`), its `dueDeck` then its
     `newDeck` (which already deals the menu first and the level after),
     capped as 2.6 says, at the chosen level (`todayLevel()` returns
     `chosenLevel()`). So `Due today` and `Tonight's session` count the
     same cards in the same words, never two numbers for one evening. It
     opens `#/flashcards/due/card`, the run, at once.
   - `Quick quiz`: opens `#/quiz/quick`.
   - `Next reading`: `readDoorTarget(n, sub)` (`js/levels.js:270`) for the
     first subsection whose figure is not `Met`, labelled by `readLabel`
     without its `Read · ` prefix (`js/ui-levels.js:117-132`), applied with
     `applyTarget` (`js/levels.js:325`).
   - `Tonight's session`: the `todayDoor()` line and sub; the press is
     `openDoor('today')`. Critic: it is the last of the four rows, and its
     line keeps `todayDoor()`'s own words, which already say it is the
     cards, a quiz round, then a drill in one go, so a new server reads it
     as the three rows above joined, not a fourth thing.
2. **My restaurant** (`h3.sub-head`): `houseLineHTML()` (`js/house-bar.js:750`),
   `deskWaitingHTML('home')` (`js/ui-import.js:741`), the count line
   (`{n} drinks in {s} sections. {x} studied, {y} to see again.` from
   `hsProgress`), the sections (`houseStudySectionOf` over the house's
   drinks, `js/house-study.js:539`) as `button.door` rows that open the
   Menu tab's study view with `state.menu.study.sec` set, then `Study the
   whole menu` (`#/menu`), `Flashcards for the menu` (`#/flashcards/menu`),
   `Drill the menu` (`#/quiz/mybar`), `The Menu Desk` (`#/menu` with
   `state.menu.view = 'add'`). No house: the house line's own no-house
   sentence and its door. Critic: laid out as 2.6 item 4: the three study
   doors, the sections as chips to `#/menu/section/{slug}`, then the quiet
   links `The Menu Desk` and `The house` (the house line's own door to
   switch or add a restaurant).
3. **Search** (`h3.sub-head`): an input `#lv-q` labelled `Search the ledger
   and the menu`, added to `captureLiveInputs` (`js/app.js`), repainting
   `#lv-results` alone on input with `searchResults(q)`
   (`js/ui-new.js:215`), which already holds the house's drinks
   (`progress.bar`, `js/ui-new.js:177-178`), grouped `From the menu` (the
   `#/menu/` hits) and `In the ledger`, at most eight each; each hit is a
   link through `gotoHash`.
4. **What {Level} holds**: a `details` with today's subsection lines
   (`js/ui-levels.js:172-181`) minus `trainDoorsHTML` and the books; each
   title opens the subsection's Read target (`readDoorTarget`) in Library.

The level test button and its line (`js/ui-levels.js:188-189`) move to the
foot of Quizzes.

### 4.7 Flashcards in the Ledger

`state.fc.stage` gains `pick` (the root, the new default in `engine.js:83`);
`setup` is the deck screen; `run` and `board` are unchanged.

Deck ids and their preset state (each sets `fc.src`, `fc.section`,
`fc.special`, `fc.level`, `fc.sub`, `fc.tier` and leaves the rest at
`All`):

- `due`: `special: 'due'`, `level` the chosen level, `src: 'All'`; then the
  house's weak ones (`src: 'My Bar'`, `special: 'trouble'`), one run.
- `menu`, `menu:{section}`, `menu-weak`: `src: 'My Bar'` with `section`,
  `special: 'trouble'` for weak, mode `study` (the house card,
  `js/ui-study.js:443`). These replace the study view's own deck
  (`houseStudyDeck`, `js/house-study.js:1110`): its buttons now open these
  decks, and its records were already the same `gradeCardKey`.
- `menu-lines`, `menu-parts`, `menu-offer`: the house modes `line10` to
  `line45`, `parts`, `upsell` (`houseDrillModes`, `js/house-bar.js:338`),
  shown only when `n > 0`.
- `menu-words`: the house's lexicon terms from the shared engine's
  `OOT.houseLib.drills.buildFlashcards` (kind `term`), shown only when
  the engine is here and the house holds terms, recorded through the
  house's existing drill record.
- `cocktails`, `cocktails:{book}`: `src: 'Cocktails'`, `level` the chosen
  level, `tier` the book (`bookHeld`, `js/levels.js:250`).
- `shots`, `zero-proof`, `on-tap`, `coffee`: the sources at the level.
- `everything`, `trouble`, `unmastered`: `src: 'All'`, the specials, no
  level.

The rows: Due today; **My restaurant**: `The whole menu`, one per section,
`My weak ones`, `The ten second line` (and the twenty and forty five second
lines), `The five parts`, `What to offer next`, ~~`The menu's words`~~
(Critic: under Words only, 2.6);
**{Level name}**: `Cocktails at {Level name}` then one row per book at the
level (`levelBooks(n)`, name and count, the `levelBooksHTML` words), `Shots`,
`Zero Proof`, `On Tap`, `Coffee & Tea`; **Words**: `The menu's words` (when
there is no house, the group is left out); **Reference cards**: `Every card`,
`Trouble cards`, `Unmastered only`, `The mastery board` (`fc-board`).

**The deck screen** is today's setup panel (`js/ui-study.js:450-507`) with
its source chips removed (the deck chose the source), its filters inside a
closed `details` labelled `Narrow this deck`, its `Choose your drill` list
renamed `Choose how to study` (the `FC_MODES` buttons, filtered by `fits`,
unchanged), and its scope line `Dealing from {Level}` kept. The card screen
is today's `run` stage, with `Quit` replaced by the Back control and the
done screen gaining `Study the misses` and `Another deck`.

Critic: the house study view's own card (`houseStudyHTML`'s deck, opened
from `#/menu`) and the Menu tab's `Drill what is on it` panel keep no card
of their own: their card buttons open these decks (one card style, 2.6),
and their old addresses (`#/menu/{slug}` stays the study card, which is
reading, not a flashcard) are unchanged.

### 4.8 Quizzes in the Ledger

`state.quiz.stage` `setup` becomes the Quizzes root (the hub); choosing a
row sets `z.mode` and deals at once (`quiz-start`, `js/app.js:427`), a push
to `#/quiz/{mode}`.

**The quick quiz** (`buildRound('quick')`, a new branch in `buildRound`,
`js/ui-study.js:904`; `quick` is not a topic, so none of the four topic sites
in the CLAUDE.md change): five house questions from `houseQuizRound()`
(`js/house-bar.js:317`) or, with no kept lines, `buildRound('mybar')`
questions when the menu holds four drinks with a spec; five level
questions from `levelRound(n, sub, 1)` across the level's subsections in
`LEVEL_SUBS` order (`js/levels.js:406`), units not yet met first; topped up
from the other side. It records as each builder already records (`qaRecord`
for bank questions, `gradeCardKey` for tickets) and writes one
`progress.quizzes` row with mode `quick`, labelled `Quick quiz` by
`modeLabel` through a one-line entry in a label map beside `MODE_WAS`
(`js/ui-study.js:745`), never a chip in `QUIZ_MODES`.

The rows: Quick quiz; **My restaurant**: `Menu` (`mybar`, with its existing
four-drink floor and words), `Pair the menu` (`housepair`, only when
`housePairReady()`), `Say it back`, `Guest at the table` (the chips of
`houseDrillChipsHTML`, `js/house-bar.js:818-827`), `The Ticket Rail`
(practice `rail`); **{Level name}**: one round per subsection at the level
(`levelRoundFromMode('level-{n}-{sub}')`, labelled by `levelModeLabel`),
then the topic rounds `Mixed round`, `Service & law`, `On tap`, `Wine`,
`Spirits & craft`, `Blind tickets`, `Dealer's choice` (labels from
`QUIZ_MODES`, blurbs as the row's line); **Hands on**: the drills
(`#/practice/drills`, the `DRILLS` list), `Hold the Round`, `Free Pour`,
`The Tasting Room`, `Flights`, `How to Taste`, `Riffs` (`renderRiffs`);
last, `The {Level name} test` (`lt-start`) with its line
(`js/ui-levels.js:189`). Recent rounds (`js/ui-study.js:1000-1001`) stay at
the foot.

The practice room's own tab row (`js/ui-practice.js:395-397`) stays inside
the practice screens; each view is its own route, so Back steps between
them.

Results: the done stage (`js/ui-study.js:1020-1046`) keeps its ticket and
verdict and its miss panel under the heading `What you missed`; each miss
gains `Study this card` (`#/library/{slug}` for a cocktail ticket,
`#/menu/{slug}` for a house drink, `#/shots/` or `#/na/` for those, `#/ontap/`
or `#/coffee/` for a fact card) or `Read about it` (the question's topic
tab: `service`, `ontap`, `notes`). `Replay the misses` stays; `Study the
misses` opens a deck of the missed tickets when ~~two or more are cards~~
Critic: one or more are cards, as `#/flashcards/misses/{keys}/card`, the
house drinks and the bank's cards in one run (2.7). `Replay the misses`
(the same questions again) and `Study the misses` (their cards) sit side
by side with those words, so the difference is said, not guessed.

### 4.9 Library and More in the Ledger

**Library**: the root is the `library` tab (the 365 with its filters,
`renderLibrary`, `js/ui-study.js:84`) under the shelf
(`LIBRARY_SHELF`, `js/ui-levels.js:348`), which gains `['videos','Videos']`
at the end. The scope chip sits above the shelf on every Library tab and
drives `state.lib.level` (`lib-level`, `js/app.js:111`). `#/videos` draws
`hsVideosHTML(h)` (`js/house-study.js:683`) and, under it, a door to the
Coffee & Tea films (`#/coffee`). Reading only: the Notes tab's glossary,
plates and study notes stay; nothing graded moves here.

**More** (`renderMine`, `js/ui-levels.js:319-346`, rewritten, the `mine`
id kept so `#/mine` lands here): `h2.lv-title` `More`, then the groups as
`nav.quiet button.door`:

- **Record and progress**: `The record` (`#/record`: `recordHTML()`,
  `levelTestsHTML()` and `dashboardHTML()`, `js/ui-levels.js:246-317`,
  `js/ui-new.js:1227`; the old Record door's anchor `state.mine.at`
  keeps working by landing on `#/record`).
- **Tools**: `Batching`, `Open Bottles`, `Strength`, `Pour Cost`, `Spill
  Log`, `Convert` (`#/tools/{view}`), and `The stock` (the Menu tab's
  `stock` view).
- **Backup and data**: `My Data` (`#/tools/data`, `dataToolHTML`,
  `js/ui-new.js:709`).
- **The Maître d'**: her door exactly as today (`maitre-open` where she is
  here or loadable, else `#/tools/maitre`).
- **Settings**: ~~`Search` (opens the overlay),~~ `Video settings`
  (`videoSettingsHTML`, `js/ui-study.js:1078`, on its own screen). Critic:
  Search is not a setting; it is the Library root's first door (4.2).
- **About**: the privacy line (`js/ui-levels.js:340`) and the record's `In
  the ledger` and pillars panels, moved from the record page, worded as
  each tree words them today (the wing's names nobody).

### 4.10 The Ledger's screen map

Every tab id, its new home and its logical parent:

- `home` Home, none. `level` Home, parent `home`. `menu` Home (My
  restaurant), parent `level` at the chosen level; its study card
  (`#/menu/{slug}`) parent `#/menu`; `stock` and `add` views parent `#/menu`.
- `flashcards` Flashcards: `pick` parent `home`; a deck screen parent
  `#/flashcards`; `run` parent its deck screen; `board` parent
  `#/flashcards`. Critic: the `due` and `misses` runs parent
  `#/flashcards` (they have no deck screen).
- Critic: `menu` with a section (`#/menu/section/{slug}`) parent the level
  page; its study card parent the scoped list it was opened from when
  pushed, else `#/menu`.
- `quiz` Quizzes: root parent `home`; a round and its done stage parent
  `#/quiz`; the level test (`state.lt`, drawn by `renderLevel`) parent
  `#/quiz`.
- `practice` Quizzes, each view parent `#/quiz`. `riffs` Quizzes, parent
  `#/quiz`.
- `library` Library, parent `home`; `#/library/{slug}` parent `#/library`.
- `families`, `shots`, `na`, `ontap`, `coffee`, `prep`, `producers`,
  `service`, `notes`, `videos` Library, parent `#/library`; each item slug
  parent its tab.
- `mine` More, parent `home`. `record` More, parent `#/mine`. `tools` More,
  each view parent `#/mine`.

Old addresses: every `#/{tab}/{slug}` stays; `#/mybar/...` and
`#/service/beer` heal as before (`TAB_WAS`, `ROUTE_WAS`); `#/level` lands
on the chosen level; `#/level/{slug}` on that level; `#drink=<id>` is read
by `houseStudyDeepLink` before `applyRoute` as today; `#/mine` lands on
More. Old doors: Home's Today to Today's study (Tonight's session); Library
to the Library tab; Record to More, Record; `Mine · My Bar` to My
restaurant. The level page's training doors (`trainTarget` read, cards,
quiz, hands): Read to Library, Flashcards to the level's deck rows, Quiz to
the level's subsection rounds, Hands on to Quizzes, Hands on; the book doors
to `Cocktails at {Level}` book rows in Flashcards and the Library's book
filter; the test to Quizzes, last.

## 5. The Sommelier's Codex

### 5.1 The pieces reused

`codex25.js`: `V25_LEVELS` 77-86, `v25FirstUnmet` 307, the chosen level
317-330, `v25Leave` 372, `v25FocusMain` 385, `v25ChooseLevel` 394,
`v25OpenChapter` 413, `v25HasChapter` 426, `V25_TRAIN` 437-456,
`V25_LIBRARY` 473-528, `V25_RECORD` 538-591, `V25_MINE` 603-626,
`v25FirstTen` 628, `V25_GO` and `V25_AREA` 668-695, `v25Go` 697,
`v25Bind` and `v25Build` 718-740, `v25Rows` 759, `v25Due` 773,
`v25TodayLine` 793, `v25HomeHtml` 826, `v25TestLine` 854, `v25SubHtml` 866,
`v25LevelHtml` 904, `v25WireSecs` 918, `v25Head` 934, `v25LibraryHtml` and
`v25WireFind` 939-972, `v25RecordHtml` 1008, `v25InboxHtml` 1017,
`v25MineHtml` 1029, `v25TodayHtml` 1038, `v25TestReportHtml` 1246, `V25_NAV`
1352, `V25_HUB` and `V25_UNDER` 1357-1366, `v25NavWord` 1368, `v25NavHtml`
1372, `v25Nav` 1380, the topbar wrapper 1389, `V25_VIEWS` 1425,
`v25MainName` 1434. Engines: `startDaily` and `dueList` (`js/codex3.js:18-32`),
`startFlash`, `flashView` (`js/reference.js:219`, `241`), `startDrill`,
`startReview`, `startEndless` (`js/core.js:129-140`), `startWeakness`,
`startLightning`, `startSudden` (`js/codex2.js:36-50`), `startSectionExam`,
`startDomainExam`, `startFinals` (`js/codex19.js:170-180`), `gridStart`
(`js/codex20.js:62`), `floorStart`, `pairStart` (`js/codex21.js:56`, `160`),
`startTastingFlight` (`js/codex6.js:25`), `startCellarDrill`,
`startCellarRecite` (`js/codex12.js:58`, `125`), `codexFind` and
`codexFindHtml` (`js/codex16.js:576`, `615`), the house (`js/codex27.js`:
`V27_HOUSE_ROW` 811, `V27_REVIEW_ROW` 1466, `startHousePairDrill` 1727,
`startHouseRecite` 1812, `V27_DRILL_ROWS` 1889, `v27RecordHouse` 2312,
`v27OpenSay` 2347, `v27OpenGuest` 2612), Our List (`js/codex28.js`:
`v28Progress` 567, `v28DeckIds` 595, `startHouseDeck` 1219, `v28DeckView`
1303, `startHouseSectionDrill` 1355, `v28Push` 1361, `v28OnPop` 1377,
`V28_WANT` 1643-1656, `V28_MINE_ROW` 1805), the full list (`js/codex29.js`:
`v29ListView` 802, `v29Open` 818, `v29OnPop` 846, `V29_MINE_ROW` 905), the
videos (`v30VideosHtml`, `js/codex30.js:156`).

### 5.2 The new layer

Everything lands in **`js/codex31.js`**, after codex30 and before boot, by
the layer rule: no edits to earlier layers, top level `var` and `function`
only, CSS injected from the file, the same bytes in the standalone and the
wing, every wing global feature-detected, no pictorial glyph, no mark at or
above U+2190 in anything it writes, no dash of any spelling, British
spelling, nobody named. `index.html` gains its tag; `sw.js` its asset.

### 5.3 The nav, the views and who owns what

- `V25_NAV` is replaced in place (it is a `var`, reassigned by codex31):
  `[['home','Home'],['flashcards','Flashcards'],['quizzes','Quizzes'],['library','Library'],['more','More']]`.
- New views in `V25_VIEWS`: `flashcards`, `deck` (the deck screen),
  `quizzes`, `more`. `mine` is reassigned to the More view, so every old
  path to Mine lands on More. `level` is reassigned to the new level page.
  `today` is reassigned to the level page (Today's study sits on it).
- `v25Nav(word)` maps `flashcards`, `quizzes`, `library`, `more` to their
  views and `home` to `home()`.
- Owners (`V25_HUB` and `V25_UNDER` rewritten): Home owns `home`, `level`,
  `today`, `cellar`, `menudesk`, `winepaste`, `house`, `housereview`;
  Flashcards owns `flashcards`, `deck`, `flash`, `housedeck`; Quizzes owns
  `quizzes`, `quiz`, `results`, `drillpick`, `sim`, `grid`, `floor`,
  `floortally`, `pairs`, `pairtally`, `finalsreport`, `tasting`, `service`,
  `cellarrecite`, `houserecite`, `housesay`, `houseguest`; Library owns
  `library`, `primers`, `primer`, `ency`, `producers`, `worldmap`,
  `compendium`, `terroir`, `videos`, `tastegrid`, `fulllist`; More owns
  `more`, `mine`, `record`, `dash`, `hall`, `sync`, `plan`, `disputes`,
  `exams`, `maitre`, `oot-pass`. `S._v25area` still wins for a view reached
  from a door, so the Our List card's doors keep lighting the word they
  lit.
- Fitting one row at 390 px: codex31's CSS gives `.appnav .navword`
  `flex: 1 1 0; min-width: 44px; padding-inline: 4px` and, at `max-width:
  420px`, the smallest step of the existing navword size that seats
  `Flashcards` whole; the builder measures it.

### 5.4 Routes, history and Back in the Codex

The router (codex31): every render writes the hash from `S.view` and its
argument; a push when the screen key changed, else a replace; a `popstate`
listener applies the hash and renders. The grammar:

- `#/` Home; `#/level`; `#/flashcards`, `#/flashcards/all`,
  `#/flashcards/{deck}`, `#/flashcards/{deck}/card`; `#/quizzes`,
  `#/quizzes/all`, `#/quizzes/quick`; `#/library`, `#/library/all`;
  `#/more`;
- `#/v/{view}` and `#/v/{view}/{arg}` for every other view: `primer/{key}`
  (`S.primerKey`), `producers/{id}` (`S._prod.id`), `worldmap/{sheet}`
  (`S.wmap`), `compendium/{sec}` (`S.cmp.sec`), `cellar` and
  `cellar/{wineId}` (the Our List card), `videos/{topic}` (`S.vidFocus`),
  and the rest bare. A run (`quiz`, `results`, `grid`, `floor`, `pairs`,
  `tasting`, `housedeck` past its first card, `finalsreport`) cold-loads to
  its parent.
- The screen key is the view plus its argument; a quiz's question index,
  a card's flip and step, a search box and a chip are in-screen (replace).

The two existing history users join it rather than run beside it:
codex31 reassigns `v28Push` and the codex29 pushes so their states carry
`ootd` (`Object.assign({}, state, { ootd: d + 1 })`), and its popstate
listener hands an entry whose state names `v28` or `v29` to `v28OnPop` or
`v29OnPop` (`js/codex28.js:1377`, `js/codex29.js:846`) and removes their own
`window` listeners' effect by checking a flag codex31 sets for the one pop
it has already handled. Critic: `v28Push` pushes with no URL today
(`history.pushState(state, '')`, `js/codex28.js:1363`); reassigned, it
writes the new `#/v/cellar/{id}` in that same push and marks the screen key
pushed, so the render that follows replaces (2.3, one user action, one
entry). Without it, opening a wine on Our List would make two entries,
and the first Back would seem to do nothing. The old addresses `#wine=<id>` and `#list` are still
read once at load into `V28_WANT` (`js/codex28.js:1643-1656`) and their
replace to the bare path then becomes `#/v/cellar/{id}` or `#/v/cellar` on
the first render.

Scroll: `history.scrollRestoration = 'manual'`, `oot-scroll-codex-v1`, saved
before a push, restored two frames after a pop's render (codex29's restore,
`js/codex29.js:882-899`, is the model and keeps working for the full list).

The Back control is drawn by the outermost render wrapper (codex31) as the
first child of `#view` on every view except `home`, as `<div
class="v31back"><button type="button" class="btn ghost" id="v31-back">Back</button></div>`.
Press: `ootd > 0`, `history.back()`; else the view's parent (5.9) with a
replace. Every screen-specific way back goes (2.2): codex31 removes the
`backlevel` train from `V25_TRAIN` use, hides `#hr-back`, `#hs-back`,
`#hg-back` and codex28's `data-v28="back"` with its CSS and routes their
work through the Back control, which is a `history.back()` to the entry
those screens pushed.

### 5.5 The chosen level in the Codex

The existing `activeLevel` and `codexLevelChosen`. The scope chip's level
choice calls `applyLevel(lv, true)` and `v25Choose()` and repaints the
screen it is on, as `v25ChooseLevel` does without its navigation
(`js/codex25.js:394-411`). Show all, in the Codex, where the engine is one
level at a time by design (codex7 rebinds `QUESTIONS`, `GRAPES`, `PRIMERS`):

- Flashcards: the grape decks deal `GRAPES` and `GRAPES_PLUS` together
  (`js/data-grapes-plus.js`), every profile once.
- Quizzes: the four levels' subject quizzes and tests listed under each
  level's name; starting one from another level says `This moves you to
  {Level name}.` on the row's line and applies that level first.
- Library: Study Chapters lists the four levels' chapters under each
  level's name with the same line; the Encyclopedia and the Producers
  already span every level.

### 5.6 Home and the level page in the Codex

**Home**: `v25HomeHtml` returns the `section.levels` only (lines 828-840);
the doors go. `homeView` keeps its fragment rule.

**The level page** (`V25_VIEWS.level`, codex31's `v31LevelHtml`): the Back
control, `h1.lv-h1` and `p.lv-blurb` (`js/codex25.js:909-910`), then:

1. **Today's study** (`h2`), `ul.v25rows` of `button.v25row`:
   - `Due today`: `v25Due()` (`dueList().length`, the questions due by
     codex3's schedule) plus the house's weak wines
     (`v28Progress(v28DeckIds({})).againIds`). Opens `#/flashcards/due`.
   - `Quick quiz`: opens `#/quizzes/quick`.
   - `Next reading`: the chapter (`v25HasChapter`, `v25OpenChapter`) of the
     first domain section at the level whose figure is not `Met`, by
     `v25Subs(lv)` order; none left, the Library.
   - `Your first week`, while unfinished: the steps from `v25TodayHtml`
     (`js/codex25.js:1059-1074`).
2. **My restaurant** (`h2`): `v25InboxHtml()` (the desk band), the house
   row's line (`V27_HOUSE_ROW`), the count line from the house's wines and
   `v28Progress`, the list's sections as rows that open Our List with that
   section chosen, then `Study our list` (`cellar`), `Flashcards for our
   list` (`#/flashcards/list`), `Drill our list` (codex27's house round via
   `startHouseSectionDrill('')`, never `startCellarDrill`, the codex28
   rule), `The Menu Desk` (`menudesk`), `The full list` (`v29Open('level')`,
   shown when `V29_MINE_ROW.show()`), `The house` (`house`) and `Look over
   her marks` (`housereview`, when `V27_REVIEW_ROW.show()`).
   Critic: laid out as 2.6 item 4: the three study doors (`Study our
   list`, `Flashcards for our list`, `Drill our list`) as `button.v25row`,
   the list's sections as chips to `#/v/cellar/section/{slug}`, then one
   row of quiet links: `The full wine list`, `The Menu Desk`, `The house`,
   `Look over her marks`. Seven equal rows made the house's setup look as
   urgent as studying it. `The full list` is worded `The full wine list`
   here and on the Library (5.8), the same words in both places, because
   "the full list" on its own does not say of what; the owner's morning
   asks for "the full wine list" and that is what both doors now say.
   `v29Open`'s argument no longer chooses where its own back goes: the
   Back control does (2.2).
3. **Search** (`h2`): the Library's find box (`v25LibraryHtml`'s
   `.codexfind`, wired by `v25WireFind`, `js/codex25.js:939-970`) with the
   label `Search the Codex and our list`; `codexFind` already searches
   producers, wines and the bottles on our list.
4. **What {Level} holds**: a `details` holding today's `ol.subsections`
   from `v25SubHtml` without its trains, each section's name a link to its
   chapter (Library) where `v25HasChapter`.

The level test leaves the level page for the foot of Quizzes.

### 5.7 Flashcards in the Codex

Deck ids:

- `due`: the house's weak wines first (`startHouseDeck({ weak: true })`,
  `js/codex28.js:1219`); at the deck summary, `Now the {n} questions due`
  runs `startDaily()` (`js/codex3.js:22`), the existing spaced review, in
  the quiz view. One row, two engines, in that order, said on the row's
  line. Critic: with no weak wines (every fresh device) the house step is
  unseen wines (`startHouseDeck({})` over the wines never graded, menu
  order, at most 10, 2.6), and with neither weak nor unseen wines the row
  goes straight to `startDaily()`; with nothing due on codex3's schedule
  either, `Now the {n} questions due` is replaced by `Another deck`. Never
  a summary button that leads to an empty round.
- `list`, `list:{section}`, `list-weak`: `startHouseDeck({})`,
  `startHouseDeck({ section })`, `startHouseDeck({ weak: true })`.
- `bottles`, `bottles:{section}`: codex29's floor bottle scopes (`#bottles`,
  `#bottles|{section}`) through `startHouseDeck`.
- `menu-words`: the house's lexicon terms through
  `OOT.houseLib.drills.buildFlashcards` (kind `term`), drawn in the house
  deck's frame, recorded with `v27RecordHouse`.
- `grapes`, `grapes:r`, `grapes:w`: `startFlash()` with `S.fc.filter`
  (`js/reference.js:219-229`); `grapes-all` under show all.

The rows: Due today; **My restaurant**: `The whole list`, one per section,
`My weak ones`, `The floor's bottles` and its sections (codex29's words),
`The menu's words`; **{Level name}**: `Grape cards`, `Red grapes`, `White
grapes`; **Words**: `The menu's words`; **Reference cards**: `Every grape`
(both grape files).

**The deck screen** (`V25_VIEWS.deck`): the deck's name, `{n} cards ·
{m} learnt`, the grape deck's direction (`flashDir`) as `Name on the front`
or `Profile on the front`, and `Start`. **The card screen** is the house
deck's view (`v28DeckView`) for house decks and `flashView` for grapes,
both drawn inside one codex31 frame: the position line, the eyebrow `Front`
or `Answer`, and the controls in one row in one order (`Flip`, then `Got it`
and `Again`), codex28's deck bar classes, padded 64 px clear of the badge as
codex28's bars already are.

### 5.8 Quizzes, Library and More in the Codex

**The quick quiz**: five house questions from codex27's house round
(`startHousePairDrill`'s and `startHouseSectionDrill`'s question builders,
whichever the house can deal, never `startCellarDrill`) and five
multiple-choice questions from the level's bank built as `v25FirstTen`
builds them (`js/codex25.js:628-640`), run in the quiz view with `S.mode =
'drill'`, `S.section = 'Quick quiz'` and `S._again` set to deal another.

**Quizzes rows**: Quick quiz; **My restaurant**: `Drill our list`, `Recite
our list` (`startCellarRecite`), `Our list by heart`, `Pair the menu`, `Say
the pour`, `Guest at the table` (`V27_DRILL_ROWS`, their own lines), `Drill
our list (the classic drill)` (`startCellarDrill`, `V25_MINE`'s
`cellardrill`) (Critic: worded `The cellar drill` with its own line from
`V25_MINE`, so two rows never begin with the same three words); **{Level name}**: one row per domain, `Domain exam`
(`startDomainExam`), each opening its sections' `Drill` and `Exam` in a
disclosure (today's `v25SubHtml` markup); then `The whole paper`:
`Weakness Review`, `Endless`, `Lightning Round`, `Sudden Death`, `Review
misses` (when any), `Bookmark Review` (when any); `The Floor`, `Pairing`
(Critic: worded `Classic pairings`, so it is never mistaken for the
house's `Pair the menu` above it);
**Hands on**: `The Blind Grid`, `Blind flight`, `The Service Ritual`;
last, `The {Level name} test` (`startFinals`) with `v25TestLine`.

Results: the results view (`resultsView`, `js/core.js:391`, wrapped by
codex7 and codex11) gains, per miss, `Study this card` for a wine of our
list (opens `#/v/cellar/{wineId}`) and `Read the chapter` for a question
whose category has a chapter at the level (`v25OpenChapter(q.cat)`); the
level test's report (`v25TestReportHtml`) gains the same.

**Library rows** (`V25_LIBRARY`, extended in codex31): `Study Chapters`,
`The Compendium`, `Encyclopedia`, `The Producers`, `The World Map`, `Terroir
Atlas`, `Study the grid` (`tastegrid`, moved from the level page's
tasting trains), `The full list` (codex29; Critic: worded `The full wine
list`, shown only when the house has one, carrying no level scope, and
placed first on the Library when a house is here, since it is the one
reading a server at that house opens every shift), `Video Scriptorium`, and
**Videos for our list** (`v30VideosHtml(h)`, `js/codex30.js:156`, on its own
view, with its connection line). The find box moves to the level page's
Search and stays on Library.

**More rows** (`v31MoreHtml`, `v25Rows` markup): **Record and progress**:
`Dashboard`, `Hall of Fame`, `Examination record`, `The Study Plan`,
`Content Report` (from `V25_RECORD`, their own lines); **Backup and data**:
`Progress Transfer` (`sync`) and the pass strip and settings from
`v25Pass()` (`js/codex25.js:974-1006`); **The Maître d'**: her row from
`V25_RECORD`; **Settings**: `Who is studying` (`v25Who()`, when the wing's
profiles are here); **About**: the colophon's non-affiliation line
(`V25_NONAFFIL`).

### 5.9 The Codex's screen map

Every view, its new home and its logical parent:

- `home` Home, none. `level` and `today` Home, parent `home`.
- `cellar` (Our List) Home, parent `level`; its card parent `cellar`;
  `menudesk`, `winepaste`, `house`, `housereview` Home, parent `level`.
- `flashcards` parent `home`; `deck` parent `flashcards`; `housedeck` and
  `flash` parent `deck` for the deck they ran (a cold or door-opened
  `housedeck` parent `cellar`, codex28's rule).
- `quizzes` parent `home`; `quiz`, `results`, `drillpick`, `sim`, `grid`,
  `floor`, `floortally`, `pairs`, `pairtally`, `tasting`, `service`,
  `cellarrecite`, `houserecite`, `housesay`, `houseguest`, `finalsreport`
  parent `quizzes`.
- `library` parent `home`; `primers`, `ency`, `producers`, `worldmap`,
  `compendium`, `terroir`, `videos`, `tastegrid`, `fulllist` parent
  `library`; `primer` parent `primers`.
- `more` and `mine` parent `home`; `record`, `dash`, `hall`, `sync`, `plan`,
  `disputes`, `exams`, `maitre`, `oot-pass` parent `more`.

Old doors: Today to Today's study; Library to the Library tab; Record and
its rows to More; `Mine · Our Wine List` to My restaurant (Our List, the
desk, the house, the full list) and to Quizzes (the drills) and Flashcards
(the list's cards). `V25_TRAIN`: `chapter` to Library and Next reading;
`drill`, `secexam`, `domexam`, `weak`, `endless`, `lightning`, `sudden`,
`review`, `floor`, `pairs`, `grid`, `flight`, `service`, `leveltest` to
Quizzes; `flash` to Flashcards; `tastegrid` to Library; `backlevel` retired
for the Back control.

## 6. The copy

Every new visible string, by place. British spelling, no dash of any kind,
levels by name. `{Level}` is the level's name from each app's own source;
`{House}` the house's name; `{n}` and friends are counts, written as
figures. Where an app's noun differs, it is given as Table / Ledger / Codex.

### 6.1 Shared

- Tabs: `Home`, `Flashcards`, `Quizzes`, `Library`, `More`.
- Back: `Back`.
- Due pill, hidden part: ` due`.
- Scope chip: `{Level} · show all levels`; `All levels · show {Level}
  only`; the name button's accessible name `{Level}, change level`; the
  chosen chip in the open list `{Level}` with `Your level`; the group's
  label `Level`.
- Card screen: `Card {i} of {n} · {Deck}`; eyebrows `Front`, `Answer`;
  buttons `Flip`, `Got it`, `Again`.
- Deck screen: line `{n} cards · {m} learnt`; `Start`; disclosure `Narrow
  this deck`; heading of the ways `Choose how to study`; empty `No cards in
  this deck yet.`
- Deck summary: heading `Deck done`; line `{g} got it, {a} to see again.`
  (no misses: `{g} got it.`); buttons `Study the misses`, `Another deck`.
- Results: heading `What you missed`; per miss `Answer: {answer}`; links
  `Study this card`, `Read about it` (the Codex: `Read the chapter`); empty
  `Nothing missed.`; button `Study the misses`.
- Disclosure summaries: `Show {what}`, `Hide {what}`.

### 6.2 The level page

- `Today's study` (heading).
- `Due today` (row name). Lines: `{n} cards due: {a} from the menu, {b} at
  {Level}.` (Codex: `{n} due: {a} wines from our list, {b} questions at
  {Level}.`); only one side: `{n} cards due from the menu.` or `{n} cards
  due at {Level}.`; none: `Nothing due today. New cards wait in
  Flashcards.`
  Critic: with new cards (2.6) the line is `{d} due and {k} new: {a} from
  the menu, {b} at {Level}.` (Codex: `{d} due and {k} new: {a} wines from
  our list, {b} questions at {Level}.`); only new: `{k} new cards to
  start: {a} from the menu, {b} at {Level}.`; the `Nothing due today.`
  line now appears only when nothing is due and nothing is new, and reads
  `Nothing due today and nothing new at {Level}. Try the quick quiz.`
  (the row then opens the quick quiz, never an empty deck). The same
  sentence, from the same function, heads the Flashcards root's Due today
  block (6.3).
- `Quick quiz` (row name). Lines: `Ten questions: five from the menu, five
  from {Level}.` (Codex: `from our list`); no house: `Ten questions from
  {Level}.`
- `Next reading` (row name). Line: the reading's title, then ` · {Level}`;
  none: `Everything at {Level} is read. The Library holds the rest.`
- Ledger: `Tonight's session` (row name), line and sub from `todayDoor()`
  unchanged.
- Codex: `Your first week` (row name), line `{done} of {total} steps
  done.`
- `My restaurant` (heading).
- Count line: Table `{House}: {n} dishes in {s} sections. {x} studied, {y}
  to see again.`; Ledger `{House}: {n} drinks in {s} sections. {x}
  studied, {y} to see again.`; Codex `{House}: {n} wines in {s} sections.
  {x} studied, {y} to see again.` (`{y}` zero: the sentence ends after
  `studied.`; nothing studied: `Nothing studied yet.`).
- Section door: `{Section}` with the line `{n} dishes` / `{n} drinks` /
  `{n} wines`.
- Doors: Table `Study the whole menu`, `Flashcards for the menu`, `Drill
  the menu`, `The Menu Desk`; Ledger the same four; Codex `Study our list`,
  `Flashcards for our list`, `Drill our list`, `The Menu Desk`, `The full
  list`, `The house`, `Look over her marks`.
  Critic: three doors in each app (Table and Ledger `Study the whole menu`,
  `Flashcards for the menu`, `Drill the menu`; Codex `Study our list`,
  `Flashcards for our list`, `Drill our list`), then the quiet links
  (Table and Ledger `The Menu Desk`, `The house`; Codex `The full wine
  list`, `The Menu Desk`, `The house`, `Look over her marks`). Section
  chips: `{Section} {n}`.
- No house: `No restaurant on this device yet.` then the app's existing
  door to set one up.
- `Search` (heading). Labels: Table `Search the menu and the app`; Ledger
  `Search the ledger and the menu`; Codex `Search the Codex and our list`.
  Placeholders: Table `A dish, a word, a technique`; Ledger `A drink, a
  spirit, a word`; Codex `A wine, a grape, a producer`. Groups: `From the
  menu` (Codex `From our list`), `In the app` (Ledger `In the ledger`,
  Codex `In the Codex`). Empty: `Nothing found for "{q}".` Table link:
  `Search all recipes for "{q}"`.
- `What {Level} holds` (the disclosure's thing: `Show what {Level} holds`,
  `Hide what {Level} holds`).

### 6.3 Flashcards

- Heading `Flashcards`.
- `Due today` block: line `{n} cards due today.`; button `Start today's
  cards`; empty `Nothing due today. Pick a deck below to learn something
  new.` Critic: the line is the level page's Due today line (6.2), from
  the same function; the button starts the run at once; the empty
  sentence is shown only when nothing is due and nothing is new.
- Group headings: `My restaurant`, `{Level}` (all levels: `Every level`),
  `Words`, `Reference cards`.
- No house, in place of My restaurant's rows: `No restaurant on this device
  yet. Set one up from a level page.`
- Table rows: `The whole menu`, `{Section}`, `My weak ones`, `Part by part`,
  `{Floor Deck section title}`, `The Lexicon at {Level}` (all: `The whole
  Lexicon`), `The whole Floor Deck`, `Keeps slipping`, `The Floor Deck
  page`.
- Ledger rows: `The whole menu`, `{Section}`, `My weak ones`, `The ten
  second line`, `The twenty second line`, `The forty five second line`,
  `The five parts`, `What to offer next`, `The menu's words`, `Cocktails at
  {Level}`, `{Book}`, `Shots`, `Zero Proof`, `On Tap`, `Coffee & Tea`,
  `Every card`, `Trouble cards`, `Unmastered only`, `The mastery board`.
- Codex rows: `The whole list`, `{Section}`, `My weak ones`, `The floor's
  bottles`, `The menu's words`, `Grape cards`, `Red grapes`, `White grapes`,
  `Every grape`; the due row's second step `Now the {n} questions due`.
- Row line: `{n} cards · {m} learnt`; a book row in the Ledger `{n} drinks
  at {Level}`.
- Codex deck screen direction: `Name on the front`, `Profile on the front`.

### 6.4 Quizzes

- Heading `Quizzes`.
- `Quick quiz` block: line as 6.2; button `Start the quick quiz`.
- Group headings: `My restaurant`, `{Level}` (all levels: one heading per
  level by name), `Hands on`.
- The test row: `The {Level} test`, its existing line.
- Table rows: `The dishes`, `Drill the house`, `Pairings`, `Say it back`,
  `Guest at the table` (from `MODE_LABELS`), `The written test`, `Say it
  back: the Floor Deck`, `The Lexicon quiz`, `The service drill`, `The
  firing drill`, `Calibrate your palate`, `The lineup`.
- Ledger rows: `Menu`, `Pair the menu`, `Say it back`, `Guest at the table`,
  `The Ticket Rail`, the level rounds by `levelModeLabel`, `Mixed round`,
  `Service & law`, `On tap`, `Wine`, `Spirits & craft`, `Blind tickets`,
  `Dealer's choice`, `The drills`, `Hold the Round`, `Free Pour`, `The
  Tasting Room`, `Flights`, `How to Taste`, `Riffs`; `Recent rounds` stays.
  Critic: the Ledger's row `Menu` reads `Drill the menu` (the level page's
  door says the same words for the same round; the `mybar` chip label in
  `QUIZ_MODES` is unchanged for the record's history).
- Codex rows: `Drill our list`, `Recite our list`, `Our list by heart`,
  `Pair the menu`, `Say the pour`, `Guest at the table`, `Drill our list
  (the classic drill)`, `Domain exam` per domain, `The whole paper`,
  `Weakness Review`, `Endless`, `Lightning Round`, `Sudden Death`, `Review
  misses`, `Bookmark Review`, `The Floor`, `Pairing`, `The Blind Grid`,
  `Blind flight`, `The Service Ritual`; under show all, on another level's
  row: `This moves you to {Level}.` Critic: `Drill our list (the classic
  drill)` reads `The cellar drill`; `Pairing` reads `Classic pairings`.
- Critic: Table rows: `Drill the house` reads `Drill the menu`; each Table
  house row carries the line given in 3.8.
- Critic: Results: `Replay the misses` (Ledger, existing) beside `Study the
  misses`; the cross-room line `Opened from {App}. Your phone's back
  gesture returns there.` (2.2); a filtered search with nothing at the
  level: `Nothing at {Level} for "{q}".` and the heading `At other levels`
  (2.4); Library: `Search everything` (Ledger); `Show the chapters`, `Hide
  the chapters` (Table); `The full wine list` (Codex); the Ledger's moved
  switcher heading `Another level`.
- The quick quiz's history label (Ledger): `Quick quiz`.

### 6.5 Library

- Heading `Library`.
- Line: `Reading for {Level}. Nothing here is graded.`; all: `Reading for
  every level. Nothing here is graded.`
- Table rows: `What {Level} asks`, `Recipes`, `The Path of Study`, `The
  Family Chapter`, `The Lexicon`, `Techniques`, `The pantry`, `The Plates`,
  `Service`, `The repair table`, `Food safety`, `Videos`.
- Ledger: the shelf's existing words plus `Videos`.
- Codex rows: `Study Chapters`, `The Compendium`, `Encyclopedia`, `The
  Producers`, `The World Map`, `Terroir Atlas`, `Study the grid`, `The full
  list`, `Video Scriptorium`, `Videos for our list`. Critic: `The full wine
  list`, first when a house is here (5.8).
- Critic: Table `Chapters` is the disclosure `Show the chapters` / `Hide
  the chapters`; Ledger adds `Search everything` at the top.
- Videos: heading `Videos`; line `Each video opens in a new tab and needs a
  connection.`; empty `No videos for this restaurant yet.`

### 6.6 More

- Heading `More`.
- Group headings: `Record and progress`, `Tools`, `Backup and data`, `The
  Maître d'`, `Settings`, `About`.
- Table rows and lines: `The record` / `{done} of {n} cooked, {all} dishes
  in all.` (and ` {k} past their re-cook.` when any); `The coverage board`;
  `Cost this menu`; `Preps`; `The prep board`; `The waste log`;
  `Producers`; `The guest menu`; `Plan a menu from the Library`; `Export,
  import and print` (Critic: worded `Back up, restore and print`) / `Your
  menu, notes and pantry, to a file and back.`; `The house` / `Switch,
  add, export or rename a restaurant.` (Critic: moved to My restaurant's
  quiet links, same line); `The Maître
  d'` / `Optional, with a key of your own: she reads a menu with you.`;
  `Day service` or `Night service` / `Switch the colours for the room you
  are in.`; About `{recipes} recipes · {chapters} chapters · Chef's Lexicon:
  {terms} terms`.
- Ledger rows: `The record` / `Standing, mastery, the night's numbers.`;
  `Batching`, `Open Bottles`, `Strength`, `Pour Cost`, `Spill Log`,
  `Convert`, `The stock`; `My Data` / `Back up and restore everything this
  ledger has recorded.`; `The Maître d'` (her existing line); ~~`Search` /
  `Every drink, sheet and lesson in the ledger.`~~ (Critic: moved to the
  top of the Library root as `Search everything`, same line); `Video
  settings`; About as moved.
- Codex rows: the `V25_RECORD` rows with their own lines; `Progress
  Transfer`; `Who is studying`; About `V25_NONAFFIL`.

### 6.7 Strings that go

Home's door names and lines (`Today`, `Library`, `Record`, `Mine · My
Menu`, `Mine · My Bar`, `Mine · Our Wine List` and their lines); the nav
words `Levels` and `Mine`; the crumbs `Home`, `Service`, `Back to {Level}`,
`Back to Mine`, `Back to the menu`, `Back to the level`; the Ledger's
`Search` tab word (Search lives on in More and the level page).

## 7. The back chain tests and the checks

Every test below runs at 390 by 844 in Chromium against the app's own
build (the Table's e2e build through `tools/serve.mjs`; the Ledger and the
Codex through `serve.py`), with Brennan's on the device (the shipped pack,
or the suite's seeded house), and again on the site's copies before
publish. "Back" means the Back control; "gesture" means `page.goBack()`.
"Scroll kept" means `scrollY` within 4 px of the value before leaving.

### 7.1 The tests every app passes

1. **The flashcard chain.** Home, tap the first level card, tap the
   Flashcards tab, scroll the picker 400 px, open `The whole menu`, press
   `Start`, Flip, `Got it` (now on card two). Back four times: the deck
   screen, then Flashcards with scroll kept and its scope as left, then
   the level page with scroll kept, then Home, where no Back control is
   drawn. Repeat with the gesture; same four screens.
2. **The study chain.** Home, a level, `Study the whole menu`, scroll
   600 px, open a card, Next twice. Back three times: the list with scroll
   kept and focus on the row that opened the card (not the third card's
   row), the level page, Home.
3. **The quiz chain.** Home, Quizzes, `Start the quick quiz`, answer all
   ten (choose a wrong option at least once), the results list `What you
   missed` with at least one `Study this card`; follow it; Back returns to
   the results with the same misses; Back again returns to Quizzes (not to
   question ten); Back again to Home. Critic: the quiz is started from the
   level page's `Quick quiz` row as well as from Quizzes (both push
   question one directly, no picker between), the walk is repeated with
   the gesture, and `Study the misses` is pressed once: its run holds
   exactly the missed items that have cards, of every engine in the
   round, and no other card.
4. **The More chain.** Home, More, an item under Tools, Back, Back: More,
   then Home.
5. **The Library chain with scroll.** Home, Library, scroll 1500 px, open a
   shelf, open an item. Back three times: the shelf, Library with scroll
   kept, Home.
6. **Cold deep links walk up.** Load a deep address fresh (no in-app
   entries): Table `/recipe/{slug}`; Ledger `#/library/{slug}`; Codex
   `#/v/primer/{key}`. Back: the shelf (Table `/recipes`, Ledger
   `#/library`, Codex `primers`); Back: Library; Back: Home. `history.length`
   does not grow across the three presses (each is a replace).
7. **Depth survives a reload.** Home, Flashcards, a deck; reload; Back
   calls `history.back()` (the deck's depth was kept) and lands on
   Flashcards.
8. **Old addresses land.** Each app's list in 7.2 to 7.4: each loads to the
   named screen with a Back control whose first press goes to that screen's
   logical parent.
9. **Four words and More, one row.** On every tab root: the bar's tab
   words are exactly `Home`, `Flashcards`, `Quizzes`, `Library` in that
   order, followed by `More` as the last control (Critic: drawn quiet,
   2.1: its computed style differs from an unlit tab's in at least one of
   colour, weight or border, and it carries no lit mark until a More
   screen shows); all five share one row at 390 and 375; each is at least
   44 by 44; the lit word carries `aria-current="page"`, and on a More
   screen `More` does.
10. **One Back, clear of the badge.** On every screen in the app's screen
    map except Home there is exactly one control named `Back`, at least 44
    by 44, whose box does not intersect x 10 to 54, y 10 to 54 at scroll 0;
    Home has none. Critic: and again at scroll 2000 (or the page's end, on
    a shorter page): Back is in the viewport, whole, still clear of the
    badge (2.2, sticky). "Every screen" is enumerated, not sampled by
    hand: for the Table, every `+page.svelte` route with the first slug of
    each dynamic route from its prerender list; for the Ledger and the
    Codex, every tab id and view in the screen map with one item each.
    No visible text on any screen begins `Back to`.
11. **The scope chip.** Flashcards reads `{Level} · show all levels` for the
    chosen level; `show all levels` lists every level's decks and the
    address carries the scope; leave and Back: still all; choosing another
    level from the chip changes Home's `Your level`.
12. **Home is four cards.** `#view` (Table: the home's container) holds the
    four level cards and nothing else focusable.
13. **Words, no glyphs.** No emoji and no pictorial glyph anywhere on the
    new screens; every pressed or chosen state has its word. Critic: and
    no text on the new screens computes below 15 px, no row text is
    clipped with an ellipsis (2.9).
14. **Offline.** After one full load, go offline and run test 1 and test 3;
    both pass.
15. **Escape.** Open the scope chip's level list; Escape closes it and the
    address does not change. Ledger: the search overlay closes on Escape.
16. **Brennan's.** My restaurant names Brennan's on first open of a fresh
    device on the shared origin; its cards, the bottle tiers on a dish
    card, the full list (Codex) and the videos are each reachable within
    two taps of a level page.

Critic: tests added. Tests 1 to 16 each prove one rule; none walked the
owner's actual morning, and several regressions the design invites would
pass all sixteen.

17. **The owner's morning, end to end** (one script per app, Brennan's
    loaded, fresh device): open the app; tap the second level card; on the
    level page press `Due today` (the card screen shows a card at once,
    and the run holds at least one card); Flip, `Again`; Back (the level
    page, scroll kept); `Quick quiz`, answer all ten with at least one
    wrong; on the results press `Study this card`; Back (the results, same
    misses); Back (the level page); `Study the whole menu` (Codex: `Study
    our list`); open a dish (a drink, a wine); on the Table see the bottle
    tiers and the video links on the card; Back five times, checking each
    screen by its heading: the list, the level page, Home, and Back is
    gone. Then: Codex, `Library`, `The full wine list` is the first row
    and opens the list; Ledger, `Library`, type `Sazerac` in the Library's
    filter at a level where it is not taught: the row is under `At other
    levels` (named with its level in words), it opens the Sazerac's card
    (the Classics Canon, `tier: 2`, `js/data-core.js:55`), Back returns to the
    Library with the query kept.
18. **In-screen changes add no history.** On Flashcards, Quizzes, Library,
    the deck screen and the card screen: flip, Next, a chip, typing in a
    search box, opening a disclosure, show all and back, each leaves
    `history.length` unchanged; a run of ten questions adds exactly one
    entry (the round), and its results add none.
19. **A hash link is adopted, not doubled** (Ledger, and the Codex for any
    `href="#/..."`): follow an in-app hash link (a search hit, a
    `house-study.js` link, `gotoHash`); `history.length` grows by one, the
    entry's state carries `ootd` one above the previous, and one Back
    returns to the screen the link was on.
20. **One action, one entry.** Opening an Our List card (codex28), a full
    list entry (codex29), a Ledger study card (`hsPush`) and a Table study
    card each grow `history.length` by exactly one; one Back closes it.
21. **Today's study in the first screen.** On each level page at 390 by
    844, scroll 0: the first row of Today's study is wholly inside the
    viewport and above the Ledger's bottom bar.
22. **One count.** The Flashcards tab's pill, the level page's `Due today`
    figure and the Flashcards root's Due today line give the same number
    (same level, same house), before and after grading one card.
23. **The first morning is not empty.** On a fresh device with Brennan's,
    `Due today` names at least one new card and its run deals house cards
    first; the empty sentence appears only with every card learnt and
    nothing due (seeded).
24. **One card style.** `/service/deck/study?card={id}`,
    `/menu/quiz?mode=cards` and `/lexicon?start=flash` (Table) land on the
    one card screen with the right deck and a Back whose first press goes
    to that deck's screen; no other route draws `Got it` and `Again`; the
    Ledger's and the Codex's house study views open the Flashcards decks.
25. **Arriving from another room.** From the Table's dish card, follow a
    bottle link into the Codex: the wine's card shows, Back's first press
    goes to Our List, the line `Opened from The World Table.` is there,
    and `page.goBack()` returns to the Table's dish card with its depth
    kept (the Table's Back then steps back within the Table, not to a
    parent).

Each new test is mutation-checked once by the builder: put a
`replaceState` back in the push path, remove the new-card top-up, drop the
sticky rule, restore the `/menu/quiz` mode chips, restore a `Back to`
crumb; each mutation must turn at least one test red.

### 7.2 The World Table

- `tests/consolidation.spec.ts`: tests 1 to 16 (test 16 on the based build
  only, where the shared origin rules apply; standalone, a seeded house).
  Old addresses for test 8: `/level` (forwards), `/level/2`, `/menu`,
  `/menu#d-{id}`, `/menu#desk`, `/menu/quiz?mode=cards`,
  `/service/deck/study?card={id}`, `/service/deck`, `/lexicon?level=1&start=flash`,
  `/repertoire`, `/practise/firing`. Critic: plus tests 17 to 25; for test
  8, `/menu/quiz?mode=cards`, `/service/deck/study?card={id}` and
  `/lexicon?level=1&start=flash` are asserted to land on the one card
  screen (test 24), `/menu?section={name}` on the scoped study list.
- Critic: `src/lib/today.ts`'s unit test: `dueToday` over a Map-backed
  store, fresh (new cards only, house first), mid-week (due then new, the
  caps), done (empty), and the pill, row and root figures from one call.
- Critic: `navigation.test.ts` is mutation-checked as the Ledger's
  check-nav is: a `replaceState: true` dropped from a forwarder, a
  `parentOf` returning its own path, More drawn as a fifth tab, each turn
  it red. Its "five words" read as four tab words and the quiet More.
- `src/lib/nav.test.ts`: `parentOf` total over every `+page.svelte` (walk
  `src/routes`), `depthAfter` for each event, reload keeps depth only for
  the same href.
- `navigation.test.ts`: the five words, their order, every href literal and
  resolvable; `OWNS` order (the test and read regexes before the prefixes).
- The regression suite's home test stays (no h2, no h3); the doors' tests
  are rewritten against the level page.
- `npm test`, `npm run check`, `npm run build`, `npm run verify:build`
  (precache under `CAP_MB` with the four routes), the full `npm run
  test:e2e`.

### 7.3 The Bartender's Ledger

- New `tools/check-nav.mjs`, loading the app from `index.html`'s own script
  list in a `vm` sandbox the way `check-home.mjs` does, with a fake
  `history`, `sessionStorage` and `localStorage`:
  - `NAV_CLUSTERS` words and order exactly the five; every `TABS` id in
    exactly one cluster; `TABS` holds every id it held at `5f20590` (a
    frozen literal in the check, so deleting one fails it);
  - every route in 4.3 round-trips: state to `currentRoute()` to
    `applyRoute()` to the same screen key;
  - the parent map is total over `TABS` and every deck id and practice and
    tools view, and never returns the screen itself;
  - the push model: simulated taps for test 1 produce four pushes with
    `ootd` 1 to 4, a Next card produces a replace, and four Backs walk
    down; a cold `#/library/{slug}` gives `ootd` 0 and three parent
    replaces to Home;
  - every old address in this list lands: `#/mybar/{slug}`,
    `#/service/beer`, `#/level`, `#/level/{slug}`, `#drink=<id>`, `#/mine`,
    `#/menu`, `#/flashcards`, `#/quiz`, `#/tools`, `#/practice`;
  - the home is the four cards only; one `data-act="back"` on every tab but
    `home`; no level named by a numeral on any new screen;
  - mutation-tested: a `replaceState` put back in `syncRoute`, a missing
    parent, a sixth word, a Back drawn twice, each fail it.
  - Critic: `gotoHash` and a hash link in the sandbox: one entry, `ootd`
    one higher, never a second push for the same screen key (test 19);
    a pop to `#/quiz/{mode}/done` with a finished round in `state.quiz`
    draws the done stage, and without one replaces to `#/quiz`;
    `Due today`'s count equals `sessionDeckParts()`'s due plus new under
    the caps, and is above zero on a fresh `progress` with a house;
    `#/menu/section/{slug}` never resolves as a drink; the level page's
    switcher is after `What {Level} holds`; More has no Search row and the
    Library root has `Search everything`; mutation-tested by putting
    `location.hash = h` back in `gotoHash`.
- Critic: the Playwright walk below covers tests 1 to 25, not 1 to 16.
- `check.mjs`: its four words become the five; `check-home.mjs`: the home
  is the four cards with no doors, the level page's new blocks, every Read
  door still resolving from the level summary; `check-import.mjs`: the study
  view's deck assertions follow the deck to the Flashcards tab (the same
  records through `gradeCardKey`).
- A Playwright walk in the scratchpad for tests 1 to 16.
- Every `tools/check*.mjs` green; `?v=` bumped on every changed file and
  `CACHE` in `sw.js` bumped.

### 7.4 The Sommelier's Codex

- New `.scripts/check-nav.js` (takes a `jsDir` like `check-home.js`, so it
  runs against the wing's `codex/js` too):
  - `V25_NAV` is the five; every view codex31 knows has an owner and a
    parent, never itself; the parent of `home` is none;
  - every route in 5.4 round-trips view and argument;
  - the push model as the Ledger's, including a `v28Push` from Our List
    carrying `ootd`, and a codex28 pop still closing the card;
  - old addresses land: `#wine=<id>` (to the card), `#list`, a bare
    `/codex/`, `#/v/mine` (to More);
  - the home is `section.levels` only; one `#v31-back` on every view but
    `home`; no `Back to Mine` or `data-v28="back"` visible;
  - no "Level" followed by a roman numeral in anything codex31 draws, no
    mark at or above U+2190, no dash;
  - mutation-tested the same four ways.
  - Critic: opening an Our List card through the reassigned `v28Push`
    makes exactly one entry carrying both `ootd` and the new
    `#/v/cellar/{id}` (test 20), and the render after it replaces; a pop
    to `results` with results in `S` draws them; the due row on a fresh
    `ST` with a house deals unseen wines, and with nothing due and nothing
    new goes to the quick quiz, never an empty round; `The full wine list`
    is the Library's first row when a house is here; no two Quizzes rows
    begin with the same three words; mutation-tested by restoring the
    URL-less `pushState(state, '')`.
- Critic: the Playwright walk below covers tests 1 to 25, not 1 to 16.
- `check-home.js` updated for the four-card home and the new level page;
  `check-study.js` for the card's single Back.
- A Playwright walk in the scratchpad for tests 1 to 16.
- Every `.scripts/check-*.js` green; `?v=` and `CACHE` bumped.

### 7.5 Across the three, before publish

On the site, at 390 px: the same four tab words and the quiet More (Critic:
not "five words", 2.1) in the same order in all three;
the hub's links into each app land on Home; the cross-room links still open
their targets (`/table/menu#<id>`, `/codex/#wine=<id>`, `/codex/#list`,
`/ledger/#/menu`, `/ledger/#drink=<id>`, `/table/menu#desk`), each with a
Back whose first press goes to ~~My restaurant's study view's parent in
that app~~ Critic: the landing screen's own logical parent, which differs
by link and was wrong for the card links: `/table/menu#<id>`,
`/ledger/#drink=<id>` and `/codex/#wine=<id>` open a card, whose first
Back goes to the study list (`/table/menu`, `#/menu`, Our List);
`/codex/#list`, `/ledger/#/menu` and `/table/menu#desk` open the study
view, whose first Back goes to the chosen level's page; each carries the
`Opened from {App}.` line (2.2) when followed from another app, and test
25 runs on the site's copies. The same four tab words and More, in the
same order and the same quiet style, in all three; `node tools/check-all.mjs` green after `sync-wing`, the table rebuild
and `bump-shared --apply`.

## 8. Trade-offs the critic should test

- **My restaurant as doors, not the list inline.** Chosen for the first
  screen at 390 px (2.6). If the owner's Monday wants the dishes on the
  level page itself, the alternative is the study list inline below Search,
  which pushes the level summary further down.
- **More as a screen, not a sheet.** Chosen for history and Back. It costs
  one screen of travel to reach a tool; a sheet would save it and lose the
  gesture's predictability.
- **The Codex's Due today runs two engines in order** (house cards, then the
  question review) because its spaced schedule is over questions, not
  cards. The row's line says so.
- **The Table's two-button card** drops the deck's `shaky`, which recorded
  the same `close` as `had`; nothing in the record changes, but a reader
  used to three buttons on `/service/deck/study` will see two in the new
  card screen. ~~`/service/deck/study` itself is unchanged.~~ Critic: it
  forwards to the one card screen (3.7), so the owner never meets both.
- **The gesture at depth 0 leaves the app**, the Back button does not. The
  owner chose within-app Back; this is the one place the two differ.
- **The Table's service toggle moves to More** to seat five words in one
  row. It stays one tap from any tab root. Critic: More takes the moon's
  place at the right of the bar, so the bar's shape is the art's own.
- **Show all in the Codex** switches level for quizzes and chapters from
  other levels, and says so, because the Codex's engine is one level at a
  time by design.
- Critic: **Back is sticky.** It costs one 44 px strip at the top of a
  scrolled screen, under the Table's sticky bar; the owner asked for a
  visible Back on every screen, and a button three thousand pixels up is
  not visible. If the strip proves heavy on the Table (bar plus strip near
  110 px stuck), the alternative is the Back control drawn inside the
  stuck modebar's badge lane side, which needs the lane widened and was
  not chosen because it moves the art's bar.
- Critic: **Due today adds new cards.** A strict "due only" deck is empty
  on every fresh device, which is the owner's first morning. Ten new at
  most per run keeps the schedule spaced; the line says how many are new.
- Critic: **Due today and Quick quiz skip their picker.** One tap starts
  them, per answer 8. Every other deck keeps its deck screen, where its
  study ways and filters are a real choice.
- Critic: **The Ledger's level switcher moves to the foot of the level
  page.** Kept, unchanged, but below the page's work, so Today's study is
  in the first screen as in the other two apps. Home stays the switcher.
- Critic: **More is quiet, not a fifth tab.** Answer 5 asks for a quiet
  More "in the header" and the plan counts four tab words; More keeps the
  same row and one tap, drawn in each app's quiet style.
- Critic: **The cross-room Back stays in the app.** Answer 7 did not choose
  Back across apps; the line `Opened from {App}.` says what the gesture
  will do instead of letting the Back button surprise.
