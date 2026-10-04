# The Sommelier's Codex: image audit and ChatGPT image brief

Audited 4 October 2026 from the source repo `/home/user/sommelierscodex` and the published copy at `/codex/` on the site, which carries the same image bytes (masthead, atlas room, vignette and all seventeen atlas sheets compared). Every current image was looked at: the three painted webp files and the four icons read directly; the seventeen atlas sheets rendered in Chromium at their native 1200 x 1500 and read back as PNG; the seventeen archived JPG posters read as a contact sheet; and the live screens (Home, Library, the Wine Atlas room, the France sheet as a phone shows it) captured at 390 x 844.

The Codex is a study app for wine: a server or a sommelier candidate learns regions, grapes, classifications, tasting and service. Its house rule (CLAUDE.md, "typography, not pictures") allows an image only when it is teaching content, never ornament and never a picture standing in for a word. The owner's painted identity (the masthead, the atlas room, the vignette) is the one sanctioned exception, and the maps are content. So every entry below is a teaching plate: a sequence of hands, a map, a diagram, a specimen. Nothing here decorates.

Contents:

- A. The Codex style guide for ChatGPT (paste once)
- B. Audit of every current image
- C. The entries: Brennan's first (SO-01 to SO-13), then the Codex's own (SO-14 to SO-30)
- D. Series templates for the big sets
- E. Notes: hand-back spec, code tasks, what stays typography

---

## A. The Codex style guide for ChatGPT

Paste the block below into ChatGPT once, at the start of the conversation, before any prompt from section C or D.

```
STYLE GUIDE: THE SOMMELIER'S CODEX (paste once, then send prompts one at a time)

You are illustrating a wine study app called The Sommelier's Codex, part of a hospitality
training suite called Outside Of Time. Its world is "the illustrated wine library": a
candlelit study inside an old stone villa, forest-green leather, warm gold, parchment,
old atlases, and through a stone arch a vineyard landscape at golden hour. Every image you
make is a TEACHING image. A server or a sommelier student must be able to look at it on a
phone screen 390 pixels wide and learn something true: how a bottle is opened, where a
village lies, what a glass looks like, what a fault looks like. Never decorate for its own
sake. If a picture would only repeat what a sentence says, it is not wanted.

THE PALETTE (from the app's own colour tokens; keep to it):
- Forest green, the ground of the app: #081510, #102119, #142d21, #17382a, #1b2c1f
- Neighbour land and quiet panels on the maps: #263b2d, #48563a
- Sage ivory, the land of the country a map is about: #c5c1a2 fading to #9aa587
- Warm gold, the line and frame colour: #d5b16c, with pale gold #f1d89e and #ead19b
- Parchment and ivory: #f3e9d5, #f6ecd5, #e3d3b4
- Ink brown for text-dark shadow: #29271f, #64553d
- River teal on the maps: #285954
- Claret, used sparingly as an accent: #843d37, #6a302c
Wine, glass, cork, fruit and stone are always painted in their TRUE colours. A red wine is
a true ruby or garnet, a white a true lemon or gold, never tinted by the gold of the frame.
The palette governs the setting, the frame and the line, never the wine.

THERE ARE THREE FAMILIES OF IMAGE. Each prompt names which one it wants.

FAMILY 1, THE LIBRARY PLATE (service, objects, sequences). It continues the app's painted
masthead: a richly detailed, realistic oil-painting look, warm candlelight, polished dark
wood, crystal, brass, linen.
- The subject is shown plainly and accurately, as a master sommelier would demonstrate it,
  on a dark polished wooden table or a white linen tablecloth, against a calm deep
  forest-green background that falls into shadow. Behind it, at most, a hint of leather
  books thrown far out of focus. No window view, no sunset, no landscape, no clutter: the
  masthead already has those, and here the lesson must read at a glance.
- Light: a warm candle key light from the left, a soft cool rim light from behind that
  outlines glass and bottle edges against the dark.
- Hands, when shown, are a server's hands: clean, short nails, no rings, no watches, white
  shirt cuff and a black jacket sleeve at most. Never a face, never a whole person.
- Step sequences are laid out as a grid of equal panels, each panel framed by a thin gold
  hairline (#d5b16c), separated by a narrow forest-green gutter. Each panel shows one
  moment, from the same camera height, so the eye can follow the hands from panel to
  panel. A small ivory disc (#f3e9d5) with a dark green numeral (#17382a) sits in the top
  left corner of each panel, numbering the steps.

FAMILY 2, THE FIELD ATLAS SHEET (maps). It continues the app's reviewed atlas exactly:
- Ground: a deep forest-green page (#142d21 at the top left fading to #081510 at the
  bottom right), a fine double gold hairline frame inset from the edge with small engraved
  gold corner flourishes of curling vine tendrils, a subtle print grain.
- The map sits inside its own thin gold-ruled panel. North is up. Flat cartographic
  drawing, an equirectangular look with faint graticule lines (#263b2d). No relief, no
  hill shading, no 3D, no vineyard rows, no invented terrain, no trees, no buildings.
- The land the sheet is about is flat sage ivory (#c5c1a2 to #9aa587) with a thin gold
  coastline or border (#d5b16c). Neighbouring land is a darker green (#263b2d). Sea and
  lakes are the dark page green. Rivers are thin teal lines (#285954).
- Places are marked as the atlas marks them: a small ivory dot with a dark outline at the
  true position, a fine leader line, and a numbered disc (ivory #f3e9d5, gold ring, dark
  green numeral) placed a short way off so discs never overlap. Reference towns are a
  smaller hollow gold ring with no number.
- A small gold compass rose with N at the lower right of the map panel.
- Lettering inside the map is ONLY the numerals the prompt lists, plus the letter N on
  the compass. The study key, the title and the sources are printed by the app in its own
  type, outside the image.

FAMILY 3, THE PARCHMENT DIAGRAM (cross-sections, anatomy, charts). The scholarly page of
the library:
- A fine engraved-and-watercolour scientific plate on warm parchment (#f3e9d5 to #e3d3b4)
  with a faint paper grain, line work in ink brown (#29271f), shading by fine hatching,
  true colours laid in as transparent watercolour washes only where colour is the lesson.
- A thin double gold hairline frame (#d5b16c) inset from the edge.
- Callouts are a fine ink leader line ending in a small numbered ivory disc with a gold
  ring and a dark green numeral, exactly as on the atlas.

FORMATS: deliver each image at the exact pixel size the prompt gives: landscape
1536 x 1024, portrait 1024 x 1536, or square 1024 x 1024. Webp.

LETTERING: no words or letters inside any image, EXCEPT the numerals a prompt lists for
its callouts or steps, and EXCEPT the exact words a prompt gives for a labelled diagram,
which must be spelled exactly as given and nothing more. The names are printed by the app.
No captions, no titles, no signatures, no watermarks.

NEVER: real people or recognisable faces; brand logos, readable labels, crests or
trademarked bottle shapes (a plain generic bottle with a blank or illegible cream label is
fine); a recognisable branded device; text beyond what is asked; a golden or sepia cast
over the wine; sunsets, sea views or Italianate landscapes inside a teaching plate; extra
glasses, bottles or props the prompt does not name; smoke, flames or sparkles unless the
prompt names them (a candle is named where it is needed); anything cartoonish, glossy 3D,
stock-photo or modern-office; dangerous behaviour shown as fun.

If a prompt and this guide disagree, the prompt wins on facts (what is shown, where, in
what order), and this guide wins on look.
```

---

## B. Audit of every current image

Judged as a teacher: is it true, can it be read at 390 px, does it teach or only decorate, does it match the app, and what does it weigh.

### B1. The painted identity (3 files, all ChatGPT's, sanctioned by the owner)

| Path | Size | What it is | Verdict | Improvement |
|---|---|---|---|---|
| `assets/codex-library-v1.webp` | 1536 x 1024, 392 KB | The masthead: a candlelit study under a stone arch, red wine in a balloon glass, a white in a smaller glass, a ship's decanter, grapes, a leather atlas and a compass, a lake and vineyards at sunset beyond. Precached. | Keep. Decoration by the owner's explicit choice; it is not a teacher and does not pretend to be. On a 390 px phone it fills almost the whole first screen (about 460 css px tall) and the italic strapline "A journey through wine, place and the art of service" runs across the bright glass and decanter, where it is hard to read. | No new art. A code fix only: a darker scrim under the strapline, or crop the phone masthead to the upper two thirds so the tabs show on the first screen. Bottle labels are blank, correctly. |
| `assets/codex-atlas-room-v2.webp` | 1800 x 600, 256 KB (declared 1536 x 512 in the tag, same 3:1) | The Wine Atlas banner: a library, an open atlas with dividers and compass, a glass of red, candles, a villa town and lake at sunset. | Keep. Decorative header for the atlas room; the page text over it ("The Wine Atlas ... connect the landscape to the wine") is dimmed and reads well at 390. | None. |
| `assets/codex-atlas-vignette-v2.webp` | 700 x 149, 43 KB | The footer vignette: grapes, vine leaves, a brass compass and a strapped leather book on transparency. Also embedded as a data URI in each of the 17 atlas SVGs. | Keep. Ornament, outside the geographic field, as maps/README says. | None. The base64 copy adds about 58 KB to each sheet; acceptable. |

### B2. The reviewed atlas (17 SVG sheets, `maps/atlas-v2/`, generated by `.scripts/atlas-v2/build.cjs`)

Important for anyone briefing new maps: these sheets are **not painted**. Their geometry is Natural Earth (public domain, pinned revision) drawn by a deterministic script; only the vignette and the look are ChatGPT's. Their accuracy is the standard every new map in section C must meet.

| Sheet | Size | Points | Verdict | Improvement |
|---|---|---|---|---|
| `france.svg` | 1200 x 1500, 245 KB | 9 headings, 12 dots (Loire, Rhône and Languedoc-Roussillon split) | True and clean. At country scale Burgundy is one dot at 47.05 N, 4.85 E and Bordeaux one dot at the Gironde: nothing a server needs for the Brennan's list (Burgundy and Champagne are its deep end) can be found on it. | The zoom sheets SO-14 to SO-17 and SO-19. |
| `italy.svg` | 277 KB | 12 regions plus Etna | True. Piedmont and Tuscany are single dots. | SO-20, SO-21. |
| `spain.svg` | 154 KB | 11 | True. Rioja one dot. | SO-23. |
| `portugal.svg` | 127 KB | 9, Madeira inset | True. Douro one dot; Madeira inset is honest and separately scaled. | SO-24; Madeira in D1. |
| `germany.svg` | 250 KB | 9 | True. The Mosel is one dot at 49.92 N, 6.95 E, so the bends that explain the slopes (and the Wehlener Sonnenuhr on the list) are invisible. | SO-22. |
| `austria.svg` | 212 KB | 5 headings, Wachau, Kamptal, Kremstal grouped | True. | None this month. |
| `california.svg` | 391 KB | 2 numbered headings, 12 lettered references | True, but the numbers 1 (Napa and Sonoma share one number) and a to e crowd the North Coast at phone size. | SO-18 Napa Valley zoom. |
| `oregon.svg`, `washington.svg`, `new-york.svg` | 444 KB, 498 KB, 488 KB | 1 or 2 numbered, several lettered | True. Heaviest files in the atlas. | None this month; Willamette in D1. |
| `argentina.svg`, `chile.svg`, `south-africa.svg` | 256 KB, 338 KB, 134 KB | 5, 6, 8 with country-context inset | True; the gold window in the inset is a good teaching device. | None. |
| `australia.svg`, `new-zealand.svg` | 162 KB, 121 KB | 9, 7 | True. | None. |
| `hungary.svg`, `greece.svg` | 216 KB, 222 KB | 9, 10 | True. | None. |

Phone legibility, all seventeen: in the card on a 390 px screen the in-sheet study key is set at roughly 5 to 6 css px and the numerals at about 6 px; they cannot be read without "Enlarge map". The page below the sheet repeats the key in full-size type, so nothing is lost, but this is the reason every new map below carries **numerals only** and leaves the key to the app's own type.

On first visit with no saved maps the room shows "Artwork needs a connection" beside each card until the sheet loads; that is the designed on-demand cache, not a fault.

### B3. The archived posters (17 JPG, `maps/*.jpg`, 1024 x 1536, 357 to 488 KB each, 6.7 MB in all)

`argentina.jpg` to `washington.jpg`: ChatGPT posters in the old style (parchment map, coloured region blobs, a painted bottle, glass and book in the margin, a dense lettered key). Verdict: **retire for good; never brief from them.** They are generated, not geographic: regions are invented shapes, the lettering is small and partly garbled, and maps/README records known errors that the reviewed atlas corrected (Goose Gap belongs in Washington, Etna is on Sicily, Riverland and Mudgee are separate South Australian and New South Wales places, Nelson is on the northern South Island). They are kept only for rollback and are not shown. Improvement: none; consider deleting them from the published copy to save 6.7 MB of origin weight (a code task, not art).

### B4. Icons (4 PNG plus the SVG master, `icons/`)

| Path | Size | Verdict |
|---|---|---|
| `icons/icon.svg` (master), `icon-512.png` (83 KB), `icon-192.png` (25 KB), `apple-touch-icon.png` (180, 23 KB), `icon-maskable-512.png` (65 KB) | as named | A gold-stemmed wine glass with a claret bowl, a four-point star and small corner fleurons, on a near-black claret ground (#130709, the pre-house palette). Clear at every size. It belongs to the Codex's earlier claret-and-gold identity rather than the forest-green house that every screen now wears. Improvement: recolour the ground to the house green (#081510 to #102119) and the frame to #d5b16c in `icon.svg`, then regenerate the PNGs with resvg as CLAUDE.md describes. That is a code job; no ChatGPT art is needed, and the star and fleurons should arguably go too under the typography rule. |

### B5. Inline drawings

`INTRO_ATLAS` in `js/data-intro.js` still carries twelve hand-drawn outline paths from the old Compendium maps, but the Compendium's Wine Atlas now opens the reviewed atlas room, so they are no longer drawn. No other inline pictorial SVG is rendered: the typography rule removed every icon, flag and fleuron in Codex IX.

### B6. What is imageless, ranked by value to a new Brennan's server this month

1. **Wine service as Brennan's pours it** (the house's own pour notes on 271 wines): presenting, opening, the order round the table. Nothing visual today; the Service Ritual is 40 steps of text.
2. **Champagne**: the quiet opening, the Friday sabrage in the courtyard, the Coravin Sparkling stopper on the Rare. Champagne is the deep end of the list.
3. **Coravin**: two different devices on one by-the-glass list (needle for the Leflaive, stopper for the Rare). Servers confuse them.
4. **Decanting**: the four 1946 Bordeaux and the 2010 Rubicon (sediment), the 2021 Paul Hobbs (air), and when not to.
5. **Bottle sizes as the list carries them**: 375 ml to the 15 L Nebuchadnezzar, with the two naming systems.
6. **The house glass set**: nine shapes named in the pour notes.
7. **Reading an old bottle**: fill level, heat damage, crystals and sediment.
8. **Zoomed atlas sheets** for the regions the list is deepest in: Burgundy, Champagne, Bordeaux, Napa, Rhône, then Loire, Piedmont, Tuscany, Mosel, Rioja, Douro.
9. **Reading the wine itself**: colour and rim for the deductive grid; the Burgundy slope behind the classification; a label read aloud.
10. **Grape portraits** (47 profiles in `GRAPES` and `GRAPES_PLUS`): a series, lowest urgency.

---

## C. The entries

Every prompt below is self-contained: paste the style guide once, then any one prompt alone. File names are the names to deliver; the hand-back table in E says where each one goes. Facts in "Must teach" are quoted from the Brennan's pack (`brennans-new-orleans.v1.oothouse.json`, its pour notes, `serve` fields and must-knows), from the Binwise list catalogued as `winelist-2026-10-03.json`, or from the Codex's own data (`js/codex6.js` SERVICE and TASTING_GRID, `js/data-intro.js` INTRO_CLASS, `js/reference.js` GRAPES).

### Brennan's

#### SO-01. Around the table: who is poured, in what order

- **File:** `assets/teach/brennans-pour-order-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** My restaurant, at the top of "Study our list", above the first wine card, under a heading "How we pour"; and at the head of the Service Ritual's "Order of Service" section. The app prints the key.
- **Must teach:** the choreography the pack's pour notes repeat on every wine and the Codex's SERVICE states: "Present the bottle to the host, label forward"; "Pour the host a taste, about an ounce, and await approval"; "Approach from the right, serve with the right hand, move clockwise"; "Guests first and the host last"; "station the bottle to the host's right, label facing them". Key the app prints: 1 present to the host, label forward; 2 the host's taste; 3, 4, 5 the guests, clockwise, poured from each guest's right; 6 back to the host, last; 7 the bottle set down to the host's right, label towards the host.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Square, 1024 x 1024 pixels.

A top-down plan of a round restaurant table for four, drawn as a fine engraved diagram on
warm parchment (#f3e9d5 to #e3d3b4) with ink-brown line work (#29271f), a thin double gold
hairline frame (#d5b16c) inset from the edge.

The table is a white linen circle in the centre, seen straight from above. Around it four
chairs, drawn as simple engraved chair outlines from above, at the top, right, bottom and
left. The chair at the bottom is the host's: mark its seat with a small solid claret dot
(#843d37). On the table in front of each chair: one wine glass seen from above (a ring for
the bowl and a smaller ring for the foot) and a folded napkin. To the host's right on the
table, a standing wine bottle seen from above with its cream label facing the host's chair,
shown by a short cream arc on the side of the bottle towards the host.

The server's path: a fine dashed claret line (#843d37) with small arrowheads that starts
behind the host's right shoulder, then travels round the OUTSIDE of the chairs clockwise
(as seen from above), stopping behind the RIGHT shoulder of each guest in turn, and ends
back behind the host's right shoulder. At each stop, a small engraved footprint pair shows
where the server stands, always at the guest's right side.

Numbered discs (ivory #f3e9d5, gold ring, dark green numeral #17382a), small, placed on the
path: 1 behind the host's right shoulder; 2 just beside 1, at the host's glass; 3 at the
guest to the host's left in clockwise order, 4 at the next guest, 5 at the third guest;
6 back at the host; 7 beside the bottle on the table. Use exactly the numerals 1, 2, 3, 4,
5, 6, 7 and no other numbers, letters or words.

Clean, uncluttered, generous space, every numeral readable at a small size.
```

- **Avoid:** people or faces (chairs only); a counter-clockwise path; the server reaching across the table; the bottle label facing away from the host; gender markers on seats (the app's text handles "women first where practical"); any lettering.

#### SO-02. Opening a still wine at the table

- **File:** `assets/teach/service-still-opening-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Service Ritual, at the head of "Opening Still Wine", above step 1; also on the wine card of any Brennan's bottle whose pour note says "Pull the cork", behind a "See it" link.
- **Must teach:** the seven steps of SERVICE "Opening Still Wine", in order, condensed to six panels: (1) "Present the bottle to the host, label forward"; (2) "Cut the capsule below the bottom lip ... two draws around with the knife, one vertical, lift the cap"; (3) "Wipe the exposed cork and lip with the serviette"; (4) "Insert the worm just off-center and screw to the last spiral ... Never pierce through the bottom"; (5) "Lever in two stages, ease the cork silently by hand"; (6) "Pour the host a taste, about an ounce". The tool is "the two-step (double-hinged) corkscrew"; the serviette is "pressed and folded over the left forearm".

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

A six-panel step sequence, three panels across and two rows down, each panel framed by a
thin gold hairline (#d5b16c) with a narrow deep forest-green gutter (#102119) between them.
Every panel uses the same camera height and the same background: a white linen tablecloth
in the foreground, a calm deep forest-green background falling into shadow, warm candle
light from the left, a soft rim light behind. The bottle is a plain dark green Burgundy-
shaped wine bottle (sloping shoulders) with a deep burgundy-red foil capsule and a blank
cream label with no readable words. The server's hands are clean, no rings, white shirt
cuffs under black jacket sleeves; never a face. A pressed white serviette is folded over
the server's left forearm in every panel where the arm is visible.

Panel 1: the bottle held at a slight angle, resting on the folded serviette on the left
forearm, the blank cream label turned towards the viewer as if towards a seated guest.
Panel 2: close on the neck: the small blade of a waiter's two-step corkscrew cutting the
foil in a neat ring just BELOW the bulging lip of the bottle, one hand steadying the
bottle, the label still facing the viewer.
Panel 3: the foil top removed, a corner of the white serviette wiping the top of the cork
and the glass lip.
Panel 4: the spiral worm of the corkscrew entering the cork slightly off centre, screwed
nearly all the way down, one spiral still showing above the cork.
Panel 5: the corkscrew's two-step hinged lever resting on the bottle lip, the cork drawn
three quarters out, the second hand ready to ease the last of it out by hand. No spray,
no pop.
Panel 6: a small pour, about one ounce of true ruby red wine, going into a single clear
stemmed wine glass standing on the linen; the bottle's label faces the viewer.

In the top left corner of each panel, a small ivory disc (#f3e9d5) with a gold ring and a
dark green numeral (#17382a): 1, 2, 3, 4, 5, 6. No other numbers, letters or words.
```

- **Avoid:** a single-lever or winged corkscrew (it must be the two-step waiter's friend); the foil cut above the lip; the worm through the bottom of the cork; a full glass in panel 6; a sommelier's tastevin or other props; any readable label.

#### SO-03. Champagne, opened with a sigh

- **File:** `assets/teach/service-champagne-opening-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Service Ritual, at the head of "Sparkling Wine"; and on every Champagne card in My restaurant (the 29 Champagne bottles, the Birthday Bubbles halves and large formats) behind "See it".
- **Must teach:** the house's own words on the Rare 2013, the Billecart Sous Bois magnum and every Champagne bottle: "Ice bucket, half ice and half water. Hold cork and cage together and ease the cork out with a quiet sigh"; serve "43 to 46°F" (the house NV sparkling); and SERVICE: "Loosen the cage, six half-turns, and never let go of the cork again"; "Angle the bottle 30 to 45°, away from every guest and light fitting"; "twist the bottle, not the cork, from the base"; "Release with a sigh, not a pop"; "Pour in two stages ... then top to two-thirds".

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

A six-panel step sequence, three panels across and two rows down, each framed by a thin
gold hairline (#d5b16c) with a narrow deep forest-green gutter. Same camera height in every
panel; a white linen tablecloth, a calm deep forest-green background in shadow, warm candle
light from the left, a soft rim light behind. The bottle is a plain heavy dark green
Champagne bottle with sloping shoulders, gold foil over the cork and neck, a wire cage
(muselet) with a small plain metal cap on top, and a blank cream label with no readable
words. Hands are clean, no rings, white shirt cuffs under black sleeves; a white serviette.
Never a face.

Panel 1: the bottle standing in a polished silver ice bucket filled with a mix of ice cubes
AND water up to the bottle's shoulder, beads of condensation on the bucket.
Panel 2: the gold foil above the cage peeled away neatly; one thumb already pressed firmly
on top of the cage and cork.
Panel 3: close on the neck: fingers untwisting the small wire loop of the cage while the
thumb of the other hand stays pressed on top of the cork; the cage stays on the cork.
Panel 4: the bottle held at a 45 degree angle, pointing to an empty corner of the frame,
the serviette wrapped over the cork and cage and gripped in one hand, the other hand
turning the bottle at its base. A faint dotted gold arc around the base shows that the
bottle turns, not the cork.
Panel 5: the cork just released under the serviette, held in the hand, with only the
faintest wisp of cold vapour at the bottle mouth. No foam overflowing, no flying cork.
Panel 6: two tall tulip-shaped Champagne glasses on the linen: the left glass with a first
small pour whose mousse is settling, the right glass filled to two thirds with pale gold
sparkling wine and a fine steady bead.

In the top left corner of each panel, a small ivory disc with a gold ring and a dark green
numeral: 1, 2, 3, 4, 5, 6. No other numbers, letters or words.
```

- **Avoid:** a cork popping or foam spraying (the house serves with "a quiet sigh"); the cage removed before the cork is held; the bottle pointed at the viewer; a coupe; an ice bucket of ice alone with no water; a readable label or a recognisable house shape.

#### SO-04. Sabrage: the Friday saber in the courtyard

- **File:** `assets/teach/brennans-sabrage-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** My restaurant, in the house notes under "Bubbles at Brennan's", beside the lexicon term "Sabrage"; the app prints the key and the house line "We saber in the courtyard on Fridays at 5; confirm on shift."
- **Must teach:** the pack's lexicon, verbatim: "Sabrage is opening Champagne with a saber: the blade runs up the seam and takes off the collar and cork in one clean stroke." House facts: "Champagne sabered Fridays at 5" in "the Roost Bar and Courtyard"; "It's a bar team ritual"; "never promise who sabers or that it happens every week without confirming". The plate is so a server can explain it to a guest who asks "You cut Champagne open with a sword?", not a licence to saber. Key the app prints: 1 the seam of the bottle; 2 the collar (the glass ring under the cork); 3 the back of the blade, not the edge; 4 the bottle held by its base, at about 45°, pointed where no one stands; 5 collar and cork leave together, in one piece.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Portrait, 1024 x 1536 pixels.

An engraved-and-watercolour scientific plate on warm parchment (#f3e9d5 to #e3d3b4), ink
brown line work (#29271f), fine hatching, a thin double gold hairline frame (#d5b16c).

Upper two thirds: a large, clear side view of a chilled dark green Champagne bottle held
at a 45 degree angle, neck pointing up and to the right towards empty space. The foil and
the wire cage have been removed; the mushroom-shaped cork sits in the neck. One hand, drawn
in fine engraved line (no rings, a white cuff), holds the bottle firmly at its base with
the thumb in the deep punt. A faint vertical seam line runs up the side of the bottle and
the neck to the lip: draw it slightly emphasised in gold. A cavalry-style curved saber lies
flat along the bottle, its blade resting on the seam, with the BLUNT BACK of the blade
facing the neck and the sharp edge facing away. A short gold arrow along the blade shows
the stroke sliding up the seam towards the lip. At the top, just beyond the neck, show the
moment after: the glass collar ring and the cork flying off together, intact, in one
piece, a short distance away, with a tiny clean wisp of foam at the open neck.

Lower third: two small inset roundels framed in gold hairline. Left roundel: a close-up of
the neck showing the seam meeting the thick glass ring (the collar, called the annulus)
just under the cork, the point the blade strikes. Right roundel: a clean, smooth broken
edge of the neck seen from above, and the separated collar-and-cork piece beside it.

Numbered discs (ivory, gold ring, dark green numeral) with fine ink leader lines:
1 on the seam along the body; 2 on the collar ring under the cork; 3 on the blunt back of
the blade; 4 on the hand at the base; 5 on the flying collar and cork. Only the numerals
1, 2, 3, 4, 5; no words or letters.

Calm, precise, instructional, like a plate from an old manual of service.
```

- **Avoid:** a person or face; a crowd, a party, sprays of foam or shards of glass flying; the sharp edge of the blade striking; the bottle pointed at the viewer; a kitchen knife; any branded bottle; making it look like a stunt. Do not paint the Brennan's courtyard or its fountain: the courtyard is in the text, and a painted one would read as a promise of a scene.

#### SO-05. Coravin: two devices on one by-the-glass list

- **File:** `assets/teach/brennans-coravin-two-ways-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** My restaurant, on the two by-the-glass cards "Rare Brut 2012 (Coravin)" and "Domaine Leflaive Mâcon-Verzé 2022 (Coravin)", and in the lexicon under "Coravin".
- **Must teach:** the pack's two pour notes. Leflaive, still: "Poured by Coravin: needle through the cork, pour, and return the bottle to the cooler"; "Pour through the Coravin needle, cork left in". Rare, sparkling: "Lift the Coravin Sparkling stopper, pour, and reseal it straight away"; the cellar dossier: "The needle-and-argon system is for still wine only ... the Rare must be on the Coravin Sparkling stopper, so its cork has been pulled." And on the 1946 Latour: "Never a Coravin needle through a cork this old." Key the app prints: left panel 1 needle through foil and cork, 2 argon capsule, 3 the cork stays in; right panel 4 the cork already out, 5 the pressure stopper clamped on, 6 reseal after every pour.

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

Two equal side-by-side panels, each framed by a thin gold hairline (#d5b16c) with a narrow
deep forest-green gutter between them. Same lighting and background in both: a dark
polished wooden table, a calm deep forest-green background in shadow, warm candle light
from the left, a soft rim light behind.

LEFT PANEL, still white wine: a plain sloping-shouldered dark green white-wine bottle with
an intact pale foil capsule and a blank cream label, with a generic wine-preserving device
clamped onto its neck: a slim matte black and brushed steel body with a thin hollow steel
needle passing straight down through the foil and the cork, and a small silver gas capsule
fitted at the back of the device. The bottle is tilted over a clear stemmed white-wine
glass with a wide bowl, pouring a thin stream of pale lemon-gold wine through the device's
spout. Cut-away inset (a small gold-framed circle) beside the neck shows the cork in
section with the needle running through its centre and the cork still in the bottle.

RIGHT PANEL, sparkling wine: a heavy dark green Champagne bottle with NO cork in it and no
foil, its open neck closed by a generic sparkling-wine pressure stopper: a stout brushed
steel and black cap clamped round the glass collar, with a small lever on top. Beside the
bottle on the table, a pulled mushroom-shaped Champagne cork lying on a small white
saucer. A tulip-shaped Champagne glass beside it with a pour of pale gold sparkling wine
and a fine bead.

Numbered discs (ivory #f3e9d5, gold ring, dark green numeral #17382a) with fine gold
leader lines: left panel 1 on the needle in the inset, 2 on the gas capsule, 3 on the cork
in the inset; right panel 4 on the cork on the saucer, 5 on the stopper, 6 on the stopper's
lever. Only the numerals 1 to 6; no words, letters, logos or brand marks anywhere on the
devices.
```

- **Avoid:** any logo, wordmark or recognisable Coravin product styling (generic devices only); a needle device on the sparkling bottle (the lesson is that it is never used there); a cork in the sparkling bottle; old, crumbly corks under the needle; readable labels.

#### SO-06. Decanting an old bottle off its sediment

- **File:** `assets/teach/service-decanting-old-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Service Ritual, at the head of "The Decanting Ritual"; and on the cards of the four 1946 Bordeaux (Latour $4100, Trotanoy $3700, Figeac $3200, Canon $3100) and the Inglenook Rubicon 2010.
- **Must teach:** the house note on the 1946 Latour, verbatim: "stand the bottle upright a day ahead, ease out an old cork with a two-prong opener, and decant only to leave the sediment, just before pouring"; and SERVICE: "Set the station: candle or torch, decanter, serviette, saucer for the cork. The flame sits under the shoulder of the bottle where sediment first shows"; "Pour in one slow, continuous motion over the light ... the first wisp of sediment reaching the neck ends the pour"; "Serve from the decanter; present the original bottle alongside". The must-know: "They are old and fragile: the sommelier presents, opens and decants them."

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

A six-panel step sequence, three across and two rows down, each framed by a thin gold
hairline (#d5b16c) with a narrow deep forest-green gutter. Same camera height in every
panel; a dark polished wooden side table with a white linen runner, a calm deep forest-
green background in shadow, warm candle light from the left and a soft rim light behind.
The bottle is a plain dark glass Bordeaux bottle with high square shoulders, a dusty
shoulder, an aged, slightly stained blank cream label with no readable words, and a dark
red capsule. Hands are clean, no rings, white cuffs under black sleeves; never a face.

Panel 1: the bottle standing upright alone on a cellar shelf of dark wood, a fine dark
line of sediment settled at the very bottom of the bottle, visible through the glass.
Panel 2: the station set on the linen: a lit white candle in a short brass holder, an
empty clear crystal decanter with a wide base, a folded white serviette, and a small white
saucer.
Panel 3: the capsule removed, the two thin flat prongs of a two-prong cork puller (an
ah-so) slid down between the cork and the glass on either side, the hand twisting gently.
Panel 4: the old, darkened cork resting on the saucer.
Panel 5: the bottle tilted slowly over the decanter's mouth, its SHOULDER held directly
above the candle flame so the light shines up through the neck; a thin steady stream of
clear garnet-red wine runs into the decanter.
Panel 6: close on the bottle's shoulder against the flame: the first dark wisp of sediment
creeping into the neck and the pour stopped, the bottle tilted back upright; the decanter
holds clear garnet wine; a little dark wine with sediment remains in the bottle.

In the top left corner of each panel, a small ivory disc with a gold ring and a dark green
numeral: 1, 2, 3, 4, 5, 6. No other numbers, letters or words.
```

- **Avoid:** a young purple wine (it is old: garnet with a browning rim); a cloudy pour into the decanter; the candle under the body or the neck instead of the shoulder; a corkscrew in panel 3 (the house uses the two-prong opener on old corks); a sunset or a window; a readable label or a crest.

#### SO-07. Why we decant, and when we don't

- **File:** `assets/teach/service-decant-or-not-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Service Ritual, under step 6 of "The Decanting Ritual" ("Know why you decant, and when not to"); and on the dinner tasting card beside the Paul Hobbs and the Jadot.
- **Must teach:** the cellar rule the pack's notes follow: "Young, structured reds: 30 to 60 minutes. Old reds: stand upright a day ahead, decant only to leave the sediment, give no more than about 30 minutes of air. Light reds and all whites: none." House examples: the Paul Hobbs Coombsville Cabernet 2021, "open or decant 30 to 60 minutes ahead"; the 1946 Bordeaux, sediment only; the Leflaive Mâcon-Verzé, "No decanting"; SERVICE: "Fragile old Burgundy often should not be decanted at all; offer, and follow the host." Key the app prints: 1 air, for a young, structured red; 2 sediment, for an old red; 3 none, for whites and light reds.

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

Three equal vertical panels side by side, each framed by a thin gold hairline (#d5b16c)
with a narrow deep forest-green gutter. Same background in all three: a dark polished
wooden table, a calm deep forest-green background in shadow, warm candle light from the
left.

Panel 1, a young structured red: a wide, low, broad-based crystal decanter filled to its
widest point with deep opaque purple-ruby wine, a soft swirl on the surface; behind it a
plain dark Bordeaux-shaped bottle with a blank cream label, empty, standing upright; a
large Bordeaux wine glass with a pour of the same deep purple-ruby wine.

Panel 2, an old red: a slim, narrow-necked crystal carafe-style decanter holding clear
garnet wine with a brick-orange rim; beside it the original old Bordeaux-shaped bottle,
dusty, with a darkened aged blank label, a little dark sediment visible in its base; a
lit white candle in a brass holder; a large Bordeaux glass with a small pour of garnet
wine.

Panel 3, white and light red: no decanter at all. A plain sloping-shouldered white
Burgundy bottle with a blank cream label resting in a silver ice bucket of ice and water,
beside a wide white Burgundy bowl glass with a pour of pale lemon-gold wine; and a plain
sloping-shouldered bottle of light red beside a large balloon-shaped Burgundy glass with a
pour of translucent ruby wine.

In the top left corner of each panel, a small ivory disc with a gold ring and a dark green
numeral: 1, 2, 3. No other numbers, letters or words.
```

- **Avoid:** the same wine colour in panels 1 and 2 (young is purple and opaque, old is garnet and bricking); a decanter in panel 3; candles in panels 1 or 3; any readable label.

#### SO-08. Bottle sizes, as our list carries them

- **File:** `assets/teach/brennans-bottle-sizes-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** My restaurant, at the head of "Birthday Bubbles: Champagne large formats" and of "Half-bottles"; and in the Service Ritual's "Temperatures & Glassware" section. The app prints the key.
- **Must teach:** the formats on the Binwise list read 3 October 2026 (148 half-bottles, 5 bottles of 500 ml, 3,029 standard, 348 magnums, 32 double magnums, 11 Methuselahs, 2 Balthazars, 2 Nebuchadnezzars), and how many standard bottles each holds. Key the app prints: 1 Half-bottle, 375 ml, half a bottle (the Drappier Carte d'Or half for Birthday Bubbles); 2 500 ml (the Broadbent Madeiras, the Valdespino sherry); 3 Bottle, 750 ml; 4 Magnum, 1.5 L, 2 bottles (Bollinger Special Cuvée, the Billecart 80th Anniversary Sous Bois); 5 Double magnum, 3 L, 4 bottles, called Jeroboam in Champagne (Taittinger La Française $650); 6 Methuselah, 6 L, 8 bottles, called Imperial in Bordeaux and Napa (the list prints Opus One "6L Imperial"); 7 Balthazar, 12 L, 16 bottles (Taittinger La Française $2600); 8 Nebuchadnezzar, 15 L, 20 bottles (Billecart-Salmon Réserve, $4900: "Twenty bottles of Billecart-Salmon in one").

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific comparison plate on warm parchment (#f3e9d5 to #e3d3b4), ink-brown line work
(#29271f), a thin double gold hairline frame (#d5b16c).

Eight Champagne-style bottles standing in one row on a single engraved ground line,
smallest on the left to largest on the right, drawn side-on, all in TRUE proportion to one
another (height is what the eye must compare). Each bottle has a dark green watercolour
wash, gold foil over the neck and a blank cream label with no writing, and sloping
Champagne shoulders. Approximate heights to keep the proportions honest, relative to the
standard bottle: half-bottle about 0.8 of the standard; 500 ml bottle about 0.9, slimmer;
standard bottle 1.0; magnum about 1.2; double magnum about 1.55; Methuselah about 1.9;
Balthazar about 2.35; Nebuchadnezzar about 2.55, also much wider.
The 500 ml bottle (the second) is drawn as a slim, tall-necked dessert-wine bottle with
straight sides and a dark red capsule instead of a Champagne shape.

Behind the row, a very faint ink grid of horizontal lines, like a measuring board, so the
heights can be compared. At the far right, behind the Nebuchadnezzar, draw a small
engraved wooden pouring cradle, partly visible, to hint that it is poured from a cradle.

Under each bottle, centred on the ground line, a numbered disc (ivory #f3e9d5, gold ring,
dark green numeral #17382a): 1, 2, 3, 4, 5, 6, 7, 8 from left to right. No other numbers,
no words, no letters, no volumes written on the bottles.
```

- **Avoid:** bottles all drawn the same width (the large formats are much wider as well as taller); exaggerated giant bottles; written volumes or names in the image (the app prints them, in two naming systems); any label text or house shape.

#### SO-09. The Nebuchadnezzar at the table

- **File:** `assets/teach/brennans-nebuchadnezzar-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** My restaurant, on the card "Billecart-Salmon 'Réserve' Brut NV (15 L Nebuchadnezzar)", and in "Birthday Bubbles: Champagne large formats".
- **Must teach:** the house's serve note: "Serve 43 to 46°F in tulip or white-wine glasses. The bottle must be chilled well in advance in a large tub of ice and water; it is poured from a cradle or by two staff, never lifted by one person"; "Order ahead: it needs hours to chill and two people to pour"; "Let the sommelier lead."

```
FAMILY 1, THE LIBRARY PLATE. Square, 1024 x 1024 pixels.

A 15 litre Champagne bottle (a Nebuchadnezzar: about two and a half times the height of
a normal bottle and very wide) lying tilted in a heavy dark wooden pouring cradle with a
brass pivot and a brass crank, set on a white linen-covered side table. The bottle is
dark green, with gold foil over the neck and a blank cream label with no readable words.
Its neck is tipped down over a row of six tulip-shaped Champagne glasses on a silver tray;
one glass is being filled with pale gold sparkling wine with a fine bead. Two pairs of
server's hands are visible: one pair turning the cradle's crank, one pair steadying a
glass beneath the neck; clean hands, no rings, white cuffs under black sleeves; no faces.

To the left, a large polished oval metal tub holding ice and water, empty now, with beads
of condensation, showing where the bottle was chilled. A calm deep forest-green
background in shadow, warm candle light from the left, soft rim light behind. No
lettering, numerals or words anywhere.
```

- **Avoid:** one person lifting the bottle; a crowd or faces; spraying foam; a normal-sized bottle; readable labels or crests.

#### SO-10. The house glass set

- **File:** `assets/teach/brennans-wine-glasses-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** My restaurant, above "Study our list", under a heading "Our glasses"; and in the Service Ritual's "Temperatures & Glassware". The app prints the key and which wines go in each.
- **Must teach:** the glasses the pack's pour notes name across 271 wines (counts of mentions): white-wine glass (about 150), tulip (90), white Burgundy bowl (76), Bordeaux glass and large Bordeaux glass (about 125), flute (36), Burgundy bowl and large Burgundy bowl for red (about 57), dessert glass and small dessert glass (about 40), red-wine glass, the "standard red glass" of the Rhône notes (about 30), and Port glass (7). Key the app prints: 1 flute; 2 tulip (the house Champagne glass: the Rare goes in "a tulip or white-wine glass", and the cellar review adds "never a coupe"); 3 white-wine glass; 4 white Burgundy bowl (the Leflaive); 5 Burgundy bowl, for red Burgundy and Pinot Noir (the Jadot Beaune 1er Cru); 6 red-wine glass (the Châteaumar Côtes du Rhône); 7 Bordeaux glass (the 1946 Latour, "a large Bordeaux glass"); 8 small dessert glass (the Banyuls, "2 to 3 oz"); 9 Port glass.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific comparison plate of nine empty, clear crystal wine glasses on warm parchment
(#f3e9d5 to #e3d3b4), drawn as fine ink-brown engravings (#29271f) with the faintest grey
watercolour for the glass, a thin double gold hairline frame (#d5b16c). All nine stand on
one engraved ground line in a single row, side-on at eye level with a slight ellipse at
the rim, all in TRUE relative scale to one another. Each glass has a fine dotted gold line
across the bowl at its correct pour level.

Left to right:
1. A flute: a tall, narrow, straight-sided bowl on a long stem; pour line at two thirds.
2. A tulip: a slim bowl that widens from the stem and then narrows again towards the rim,
   on a long stem; slightly wider than the flute; pour line at two thirds.
3. A white-wine glass: a medium U-shaped bowl, taller than it is wide, gently tapering at
   the rim; pour line at the widest third.
4. A white Burgundy bowl: a wider, rounder, slightly shorter bowl than glass 3, with a
   gently tapered rim; pour line at the widest point.
5. A Burgundy bowl for red: the widest glass of all, a big balloon bowl that tapers
   sharply to a narrower rim, on a medium stem; pour line low, at the widest point.
6. A red-wine glass: a medium, all-purpose red bowl, larger than glass 3, smaller than
   glass 7; pour line at the widest point.
7. A Bordeaux glass: the tallest bowl, large, with straighter, more upright sides that
   taper only gently to the rim, on a long stem; pour line at the widest point.
8. A small dessert-wine glass: a small tulip bowl about half the size of glass 3, on a
   short stem; pour line at half.
9. A Port glass: a small, narrow tulip bowl that closes in at the rim, on a short stem;
   pour line at half.

Under each glass, centred on the ground line, a numbered disc (ivory, gold ring, dark
green numeral): 1 to 9. No other numbers, words or letters. Keep strong distinct
silhouettes and generous space between the glasses so each reads at a small size.
```

- **Avoid:** a coupe anywhere; wine in the glasses (empty, with the pour line only); glasses 4 and 5 drawn alike (5 is far wider and taller); glasses 8 and 9 identical (9 is narrower at the rim); brand-specific shapes or etched logos.

#### SO-11. Reading an old bottle's fill level

- **File:** `assets/teach/bottle-ullage-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** My restaurant, on the four 1946 Bordeaux cards and the Rubicon 2010; and in the Library primer "Wine Trade & Aging" beside "'ullage' = fill level as provenance evidence".
- **Must teach:** the Codex primer: "'ullage' = fill level as provenance evidence; OWC = original wooden case"; the must-know: the 1946 bottles "are old and fragile: the sommelier presents, opens and decants them, and confirms they are in the cellar". The fill terms the trade uses for a Bordeaux bottle, top to bottom, which the app prints as the key: 1 into neck; 2 base of neck; 3 top shoulder; 4 high shoulder; 5 mid shoulder; 6 low shoulder. At 80 years, high or even mid shoulder is common; low shoulder is the warning, and the sommelier judges every old bottle before it is offered.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific plate on warm parchment (#f3e9d5 to #e3d3b4), ink-brown engraving (#29271f),
a thin double gold hairline frame (#d5b16c).

Six identical dark glass Bordeaux bottles with high, square shoulders and a straight
neck, standing in a row on one engraved ground line, drawn side-on and in section so the
wine level inside each is clearly visible as a garnet-red watercolour wash with a pale air
space above it. Blank aged cream labels, no writing, dark red capsules. The only difference
between the bottles is the height of the wine inside:
1. wine up into the neck, close under the cork;
2. wine at the base of the neck, where the neck meets the shoulder;
3. wine at the very top of the shoulder;
4. wine a little lower, high on the shoulder;
5. wine halfway down the shoulder;
6. wine at the bottom of the shoulder, where it meets the body.
A faint dotted gold horizontal line runs across all six bottles at each level, so the
drop reads as a ladder.

Under each bottle a numbered disc (ivory, gold ring, dark green numeral): 1 to 6. No other
numbers, words or letters.
```

- **Avoid:** Burgundy-shaped bottles (the shoulder terms are a Bordeaux bottle's); levels that are not clearly distinct; a cloudy or brown wine (keep it garnet); text.

#### SO-12. Heat damage: what a cooked bottle shows

- **File:** `assets/teach/bottle-heat-damage-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** My restaurant, under the must-know "Wine program" (Katrina: "a month without power cooked about 35,000 bottles"); and in the Codex fault drills beside "Heat damage".
- **Must teach:** the house story, verbatim from the must-know: Brennan's "lost the cellar to Katrina in 2005 when a month without power cooked about 35,000 bottles, and won it back in 2021 after rebuilding to more than 15,000 bottles". What a server sees before the bottle is opened, the key the app prints: 1 a cork pushed up proud of the lip; 2 sticky dried wine seeping under and down the capsule; 3 a low fill for the wine's age; 4 in the glass, a red turned brown and flat at the rim beside a sound bottle's ruby.

```
FAMILY 1, THE LIBRARY PLATE. Square, 1024 x 1024 pixels.

Two plain dark Bordeaux-shaped wine bottles side by side on a dark polished wooden table,
with blank cream labels and no readable words, a calm deep forest-green background in
shadow, warm candle light from the left, soft rim light behind.

The LEFT bottle is sound: its dark red capsule sits flat and clean, the wine level is into
the neck. In front of it, a clear wine glass with a pour of bright ruby red wine.

The RIGHT bottle has been cooked by heat: its capsule is domed up because the cork has
been pushed up proud of the glass lip; a dark, sticky, dried trail of wine has seeped from
under the capsule and run a little way down the neck and onto the shoulder; the wine level
inside, visible through the glass against the light, is lower, at the shoulder. In front
of it, a clear wine glass with a pour of dull, brownish brick-red wine, flat and orange at
the rim.

Numbered discs (ivory #f3e9d5, gold ring, dark green numeral #17382a) with fine gold leader
lines, on the right bottle only: 1 on the pushed cork under the domed capsule; 2 on the
seepage trail; 3 on the low wine level; 4 on the brown wine in its glass. Only the
numerals 1, 2, 3, 4; no words or letters.
```

- **Avoid:** flood water, storm or ruin imagery (this is a lesson, not a memorial); mould or a broken bottle; the two wines the same colour; readable labels.

#### SO-13. Crystals, sediment and cork: what is in the glass

- **File:** `assets/teach/glass-crystals-sediment-cork-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** My restaurant, under "Guest questions" for the old reds and the Chardonnays; and in the Codex's tasting section beside "Clarity & brightness".
- **Must teach:** three things a guest may point at and ask "is there glass in my wine?", with the key the app prints: 1 tartrate crystals: clear, sugar-like crystals on the underside of a white wine's cork or in the bottom of the glass, a natural deposit and not a fault; 2 sediment in an old red: dark, fine and silty, which is why the house decants the 1946 Bordeaux "only to leave the sediment"; 3 cork crumbs: small brown flecks floating on the surface, a fault of technique, not of the wine (SERVICE: "cork dust in the wine is a fault of technique"); offer a fresh glass.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific plate on warm parchment (#f3e9d5 to #e3d3b4), ink-brown engraving (#29271f)
with true-colour watercolour washes, a thin double gold hairline frame (#d5b16c). Three
equal roundels side by side, each a gold-ringed circle, each showing a close magnified
view:

Roundel 1: the base of a clear wine glass holding pale lemon-gold white wine, a few clear,
glittering, colourless angular crystals resting on the bottom of the glass like coarse
sugar; beside the glass, the wet underside of a natural cork with a scatter of the same
small clear crystals stuck to it.

Roundel 2: the bottom of a clear wine glass holding garnet red wine, a fine dark purple-
brown silty sediment settled in the bottom and a few dark flakes drifting just above it.

Roundel 3: the surface of a clear glass of ruby red wine seen slightly from above, with
four or five small light-brown crumbs of cork floating on the surface.

Under each roundel a numbered disc (ivory, gold ring, dark green numeral): 1, 2, 3. No
other numbers, words or letters.
```

- **Avoid:** shards of real glass; making the crystals look dirty or the sediment look like mould; health or allergen claims of any kind; text.

### The Codex's own

#### A note on every atlas entry (SO-14 to SO-24)

The reviewed atlas is built by script from Natural Earth geometry, with every point an approximate representative location and every sheet tied to named sources in `atlas-sources.html`. ChatGPT draws pictures, not geography: it does not know where Puligny lies to the nearest kilometre, and it will draw rivers that look right rather than rivers that are. So each atlas prompt below gives the true relative positions and coordinates of every point, and each entry names the sources the delivered sheet must be checked against, point by point, before it ships. **ChatGPT draws the art; the geography must be checked against the named sources.** If a draft cannot be made to agree with them, the sheet is built instead by extending `.scripts/atlas-v2/build.cjs` with a zoom window (Natural Earth rivers and coasts, the same points), and ChatGPT's draft is kept only as the visual reference. Coordinates below are approximate village centres in decimal degrees, latitude north and longitude east (west is negative); they are for placing points, not for boundaries. Every sheet is a new versioned file under `maps/atlas-zoom-v1/`, so it never overwrites a saved atlas-v2 sheet, as CLAUDE.md requires.

#### SO-14. Burgundy: the Côte d'Or, village by village

- **File:** `maps/atlas-zoom-v1/burgundy-cote-dor.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** the Wine Atlas, a new "Closer look" card under the France sheet; opened from the Burgundy heading in the France guide and from "Next reading: Burgundy". The app prints the key, the scope line and the sources.
- **Must teach:** the order of the great villages from Dijon south, which explains every Burgundy on the list (Vougeraie Le Clos Blanc de Vougeot, Jadot Beaune 1er Cru, Marchand-Tawse Meursault Genevrières, Leflaive of Puligny). Côte de Nuits, north to south: 1 Marsannay (47.27, 4.99), 2 Fixin (47.24, 4.98), 3 Gevrey-Chambertin (47.23, 4.97), 4 Morey-Saint-Denis (47.20, 4.96), 5 Chambolle-Musigny (47.18, 4.95), 6 Vougeot (47.17, 4.96), 7 Vosne-Romanée (47.16, 4.95), 8 Nuits-Saint-Georges (47.14, 4.95). Côte de Beaune: 9 Aloxe-Corton (47.07, 4.86), 10 Savigny-lès-Beaune (47.06, 4.82), 11 Beaune (47.02, 4.84), 12 Pommard (47.01, 4.80), 13 Volnay (46.99, 4.78), 14 Meursault (46.98, 4.77), 15 Puligny-Montrachet (46.95, 4.75), 16 Chassagne-Montrachet (46.94, 4.73), 17 Santenay (46.91, 4.70). Reference town ring: Dijon (47.32, 5.04). The vineyards face east and south-east, on the slope west of the D974 road. Check against: BIVB, Vins de Bourgogne, appellation maps (bourgogne-wines.com); INAO appellation records; Natural Earth for any river or coast.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Côte d'Or in Burgundy, France, in the exact look of the
established atlas: deep forest-green page (#142d21 to #081510), a fine double gold
hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map
panel filling the upper four fifths of the sheet, a calm empty green band below it (the
app prints the key there).

The map: a narrow band of sage-ivory land (#c5c1a2 to #9aa587) running from the
north-north-east down to the south-south-west, the Côte d'Or escarpment, about 50 km long,
drawn as a flat strip with a thin gold edge on its east side; to the west of the strip,
the higher wooded ground drawn as darker flat green (#263b2d); to the east, the flat Saône
plain in the page green. No relief shading, no hills, no vine rows. Faint graticule lines.
North is up, and the whole strip is slightly tilted, running from top right to bottom left.

Seventeen small ivory dots at the true relative positions below (latitude, longitude),
evenly following the strip from top to bottom, each joined by a fine leader line to a
numbered disc (ivory #f3e9d5, gold ring, dark green numeral #17382a) set a little to the
EAST of the strip so no discs overlap:
1 (47.27, 4.99), 2 (47.24, 4.98), 3 (47.23, 4.97), 4 (47.20, 4.96), 5 (47.18, 4.95),
6 (47.17, 4.96), 7 (47.16, 4.95), 8 (47.14, 4.95), then a short gap,
9 (47.07, 4.86), 10 (47.06, 4.82), 11 (47.02, 4.84), 12 (47.01, 4.80), 13 (46.99, 4.78),
14 (46.98, 4.77), 15 (46.95, 4.75), 16 (46.94, 4.73), 17 (46.91, 4.70).
A thin gold bracket on the west side groups 1 to 8 and a second bracket groups 9 to 17.
At the top right, a smaller hollow gold ring with no number for the city at (47.32, 5.04).
A small gold compass rose with N at the lower right of the map panel.

A small inset in the top left corner of the map panel, framed in gold hairline: the
outline of France in sage ivory with a tiny gold rectangle marking where this strip lies
in east-central France.

Only the numerals 1 to 17 and the letter N; no words, no place names, no title.
```

- **Avoid:** village names painted in (the app prints them); vineyards drawn as patchwork plots; a perspective or relief view; points that wander off the strip; the strip running north to south without the slight south-west lean.

#### SO-15. Bordeaux: Left Bank, Right Bank, and the rivers between

- **File:** `maps/atlas-zoom-v1/bordeaux-banks.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** the Wine Atlas, "Closer look" under France, from the Bordeaux heading; and on the cards of the 1946 Bordeaux.
- **Must teach:** the three waters and the two banks, with the communes of the list: Latour (Pauillac), Cos d'Estournel (Saint-Estèphe), Trotanoy (Pomerol), Figeac and Canon (Saint-Émilion). The Gironde estuary forms where the Garonne and the Dordogne meet north of Bordeaux. Points: 1 Saint-Estèphe (45.26, -0.77), 2 Pauillac (45.20, -0.75), 3 Saint-Julien (45.16, -0.73), 4 Margaux (45.04, -0.67), 5 Pessac-Léognan (44.75, -0.62), 6 Barsac (44.60, -0.32), 7 Sauternes (44.53, -0.34), 8 Entre-Deux-Mers, between the two rivers (44.75, -0.30), 9 Pomerol (44.93, -0.20), 10 Saint-Émilion (44.89, -0.16), 11 Fronsac (44.93, -0.27). Reference rings: Bordeaux city (44.84, -0.58), Libourne (44.92, -0.24). INTRO_CLASS: "Pomerol has NO official classification at all"; the 1855 classification ranks "Médoc reds (plus Haut-Brion)". Check against: CIVB, Vins de Bordeaux appellation map (bordeaux.com); INAO; Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Bordeaux wine region, France, in the exact look of the
established atlas: deep forest-green page (#142d21 to #081510), a fine double gold
hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map
panel in the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule: the Atlantic coast as a long straight gold-edged
shoreline down the left side; the land in sage ivory (#c5c1a2 to #9aa587). The Gironde
estuary is a wide dark-green funnel of water running from the north-west (at the top
left, opening to the Atlantic) down to the south-east, narrowing towards Bordeaux. At its
southern end it divides into two rivers drawn as teal lines (#285954): the GARONNE, which
continues south-east past the city at (44.84, -0.58) towards (44.50, -0.20); and the
DORDOGNE, which runs east from the junction past Libourne at (44.92, -0.24) towards
(44.85, 0.10). The long peninsula of land west and south-west of the estuary and the
Garonne is the Left Bank; the land north and east of the Dordogne is the Right Bank;
the wedge between the two rivers is Entre-Deux-Mers.

Eleven small ivory dots at these true relative positions (latitude, longitude), each
joined by a fine leader to a numbered disc (ivory, gold ring, dark green numeral) placed
so none overlap: 1 (45.26, -0.77), 2 (45.20, -0.75), 3 (45.16, -0.73), 4 (45.04, -0.67)
all along the west shore of the estuary; 5 (44.75, -0.62) just south-west of the city;
6 (44.60, -0.32) and 7 (44.53, -0.34) on the west side of the Garonne upstream;
8 (44.75, -0.30) in the middle of the wedge between the rivers; 9 (44.93, -0.20),
10 (44.89, -0.16) and 11 (44.93, -0.27) on the Right Bank, east and north of Libourne.
Two smaller hollow gold rings with no numbers for the city (44.84, -0.58) and Libourne
(44.92, -0.24). A small gold compass rose with N at the lower right of the map panel.

A small inset at the top right: France in sage ivory with a tiny gold rectangle at the
south-west Atlantic coast.

Only the numerals 1 to 11 and the letter N; no words, no names, no title.
```

- **Avoid:** the Garonne and Dordogne joining south of the city (they meet north of it, at the Bec d'Ambès, to form the Gironde); Pomerol and Saint-Émilion on the Left Bank; châteaux drawings; region colouring.

#### SO-16. Champagne: the five growing areas

- **File:** `maps/atlas-zoom-v1/champagne.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** the Wine Atlas, "Closer look" under France, from the Champagne heading; and at the head of "Champagne bottles" in My restaurant.
- **Must teach:** where the Champagnes on the list come from, and which grape each slope leans on. Areas: 1 Montagne de Reims, between Reims and Épernay, Pinot Noir country (49.15, 4.05); 2 Vallée de la Marne, along the Marne west of Épernay, Meunier country (49.06, 3.75); 3 Côte des Blancs, south of Épernay, Chardonnay (48.97, 4.00); 4 Côte de Sézanne, further south-west (48.72, 3.72); 5 Côte des Bar, in the Aube far to the south-east, Pinot Noir (48.15, 4.50). Reference rings: Reims (49.26, 4.03), Épernay (49.04, 3.96). The Codex: "Grand Cru and Premier Cru rank whole VILLAGES (communes), not individual vineyards as in Burgundy." The Rare is "Mostly Chardonnay"; "Champagne: the house Brennan's Essential, the Rare, ... every Birthday Bubbles bottle". Check against: Comité Champagne, the Champagne appellation area map (champagne.fr); INAO; Natural Earth for the Marne and Seine.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Champagne region, France, in the exact look of the established
atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with
small engraved vine-tendril corner flourishes, a thin gold-ruled map panel in the upper
four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, all land in sage ivory (#c5c1a2 to #9aa587) with
no coast in view. Rivers as thin teal lines (#285954): the MARNE running from the east
(about 48.95, 4.40) west-north-west past Épernay (49.04, 3.96) and on west to the edge of
the map near (49.05, 3.30); the VESLE passing Reims (49.26, 4.03) in the north; the
SEINE flowing north-west through the far south of the map, from about (47.95, 4.45) past
(48.10, 4.35) towards Troyes near (48.30, 4.08); the AUBE river running north-west near
(48.25, 4.70).

Five small ivory dots at these true relative positions (latitude, longitude), each joined
by a fine leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (49.15, 4.05)
on the high ground between Reims and Épernay; 2 (49.06, 3.75) on the Marne west of
Épernay; 3 (48.97, 4.00) just south of Épernay; 4 (48.72, 3.72) further south-west;
5 (48.15, 4.50) far to the south-east. Draw a fine dotted gold line from 4 down to 5 to
show the long gap of about 100 km between the northern areas and the Côte des Bar.
Two smaller hollow gold rings with no numbers for Reims (49.26, 4.03) and Épernay
(49.04, 3.96). A small gold compass rose with N at the lower right of the map panel.

A small inset at the top left: France in sage ivory with a tiny gold rectangle in the
north-east.

Only the numerals 1 to 5 and the letter N; no words, no names, no title.
```

- **Avoid:** drawing the Côte des Bar next to Épernay; chalk cliffs, cellars or bottles on the map; region colours; names.

#### SO-17. The Rhône, north and south

- **File:** `maps/atlas-zoom-v1/rhone-north-south.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** the Wine Atlas, "Closer look" under France, from the Rhône Valley heading; and on the Rhône cards (Pegau Châteauneuf-du-Pape, the Châteaumar Côtes du Rhône, Durban of Beaumes-de-Venise).
- **Must teach:** the two halves and their banks. Northern Rhône: 1 Côte-Rôtie (45.49, 4.81, west bank), 2 Condrieu (45.46, 4.77, west bank), 3 Saint-Joseph (a long strip on the west bank, centred near 45.17, 4.80), 4 Hermitage (45.07, 4.85, east bank, on the hill above Tain), 5 Crozes-Hermitage (around Hermitage on the east bank, 45.10, 4.88), 6 Cornas (44.96, 4.85, west bank). Southern Rhône: 7 Châteauneuf-du-Pape (44.06, 4.83, east bank), 8 Gigondas (44.16, 5.00), 9 Vacqueyras (44.14, 4.98), 10 Beaumes-de-Venise (44.12, 5.03), 11 Rasteau (44.23, 4.99), 12 Tavel (43.99, 4.70, west bank), 13 Lirac (44.03, 4.71, west bank). Reference rings: Lyon (45.76, 4.83), Valence (44.93, 4.89), Orange (44.14, 4.81), Avignon (43.95, 4.81). House notes: the Châteaumar is "Grenache-based, Rhône Valley"; Durban "is famous for its sweet Muscat". Check against: Inter Rhône, the Rhône Valley appellation map (vins-rhone.com); INAO; Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Rhône Valley, France, in the exact look of the established
atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with
small engraved vine-tendril corner flourishes, an empty green band at the bottom for the
app's key.

Inside the frame, two gold-ruled map panels stacked vertically: the upper panel the
Northern Rhône, the lower panel the Southern Rhône, each at its own larger scale, with a
fine dotted gold line between them and a small gold bar showing the gap of about 60 km.
In both, north is up, flat drawing, faint graticule, land in sage ivory (#c5c1a2 to
#9aa587), the RHÔNE as a clear teal line (#285954) running from north to south.

Upper panel, the northern river from about (45.80, 4.83) down to (44.90, 4.88):
six small ivory dots with leaders to numbered discs (ivory, gold ring, dark green
numeral): 1 (45.49, 4.81) and 2 (45.46, 4.77) on the WEST bank; 3 (45.17, 4.80), a long
narrow gold-edged strip along the WEST bank from about 45.40 down to 44.95 with its dot
in the middle; 4 (45.07, 4.85) on the EAST bank; 5 (45.10, 4.88) on the EAST bank just
behind 4; 6 (44.96, 4.85) on the WEST bank. Hollow gold rings with no numbers for the
cities at (45.76, 4.83) and (44.93, 4.89).

Lower panel, the southern river from about (44.40, 4.70) down to (43.90, 4.80), with
the river widening into the plain: seven small ivory dots with leaders to numbered discs:
7 (44.06, 4.83) on the EAST bank; 8 (44.16, 5.00), 9 (44.14, 4.98), 10 (44.12, 5.03) and
11 (44.23, 4.99) to the north-east, towards a dark green flat band for the Dentelles
hills (no relief); 12 (43.99, 4.70) and 13 (44.03, 4.71) on the WEST bank. Hollow gold
rings with no numbers for the towns at (44.14, 4.81) and (43.95, 4.81).

A small gold compass rose with N at the lower right of the lower panel, and a small inset
in the top left of the upper panel: France in sage ivory with a tiny gold line marking the
Rhône corridor.

Only the numerals 1 to 13 and the letter N; no words, no names, no title.
```

- **Avoid:** Hermitage or Châteauneuf-du-Pape on the west bank, or Côte-Rôtie on the east; the two halves drawn as one continuous map at one scale; terraces or relief.

#### SO-18. Napa Valley: the AVAs, floor and mountains

- **File:** `maps/atlas-zoom-v1/napa-valley.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** the Wine Atlas, "Closer look" under California, from the Napa and Sonoma heading; and on the Napa cards (Paul Hobbs Coombsville, Inglenook Rubicon, Quintessa Rutherford, Trefethen Oak Knoll District, Duckhorn, Caymus, Opus One).
- **Must teach:** the valley floor's order south to north, and the mountains either side. Floor: 1 Los Carneros (38.25, -122.33, shared with Sonoma), 2 Coombsville (38.31, -122.26, east of Napa city), 3 Oak Knoll District (38.35, -122.32), 4 Yountville (38.40, -122.36), 5 Stags Leap District (38.41, -122.32, east side), 6 Oakville (38.44, -122.40), 7 Rutherford (38.46, -122.42), 8 St. Helena (38.50, -122.47), 9 Calistoga (38.58, -122.58). Mountains: 10 Mount Veeder (38.38, -122.42, west), 11 Spring Mountain District (38.52, -122.53, west), 12 Howell Mountain (38.56, -122.43, north-east), 13 Atlas Peak (38.45, -122.27, east). The Napa River runs down the floor into San Pablo Bay. Reference ring: Napa (38.30, -122.29). House notes: "Coombsville is one of Napa's cooler corners, so it keeps its freshness"; the Rubicon is "Rutherford, Napa Valley". Check against: the TTB's established AVA list and maps (27 CFR part 9; ttb.gov); Napa Valley Vintners AVA map (napavintners.com); Natural Earth for the bay.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Napa Valley, California, in the exact look of the established
atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with
small engraved vine-tendril corner flourishes, a thin gold-ruled map panel in the upper
four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule: the valley floor as a long narrow strip of sage
ivory (#c5c1a2 to #9aa587) running from San Pablo Bay at the bottom (a dark-green water
shape with a thin gold shore near 38.10, -122.30) north-west up to Calistoga at the top
left; the ranges either side as flat darker green (#263b2d), the Mayacamas range on the
west and the Vaca range on the east. The NAPA RIVER as a thin teal line (#285954) down the
middle of the floor into the bay. No relief shading.

Thirteen small ivory dots at these true relative positions (latitude, longitude), each
joined by a fine leader to a numbered disc (ivory, gold ring, dark green numeral) set to
the side so none overlap. On the floor, south to north: 1 (38.25, -122.33), 2 (38.31,
-122.26), 3 (38.35, -122.32), 4 (38.40, -122.36), 5 (38.41, -122.32), 6 (38.44, -122.40),
7 (38.46, -122.42), 8 (38.50, -122.47), 9 (38.58, -122.58). In the hills: 10 (38.38,
-122.42) and 11 (38.52, -122.53) in the western range; 12 (38.56, -122.43) and 13 (38.45,
-122.27) in the eastern range. Discs 1 to 9 are ivory; discs 10 to 13 are dark green with
an ivory numeral and gold ring, so floor and mountain read apart. One smaller hollow gold
ring with no number for the city at (38.30, -122.29). A small gold compass rose with N at
the lower right of the map panel.

A small inset at the top right: California in sage ivory with a tiny gold rectangle just
north of San Francisco Bay.

Only the numerals 1 to 13 and the letter N; no words, no names, no title.
```

- **Avoid:** the valley running straight north to south (it runs north-west); Coombsville on the west side; Stags Leap on the west side; vineyard rows or wineries; Sonoma Valley drawn as part of Napa.

#### SO-19. The Loire, west to east

- **File:** `maps/atlas-zoom-v1/loire.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Wine Atlas, "Closer look" under France, from the Loire Valley heading.
- **Must teach:** the long river and its stations, Atlantic to centre: 1 Muscadet, around Nantes (47.15, -1.40); 2 Savennières (47.38, -0.66); 3 Anjou, around Angers (47.40, -0.50); 4 Saumur (47.26, -0.08); 5 Chinon (47.17, 0.24); 6 Bourgueil (47.28, 0.17); 7 Vouvray (47.41, 0.80); 8 Sancerre (47.33, 2.84, west bank); 9 Pouilly-Fumé, Pouilly-sur-Loire (47.28, 2.95, east bank). Reference rings: Nantes (47.22, -1.55), Tours (47.39, 0.69), and an unnumbered ring at Orléans (47.90, 1.90), the river's northern apex. The course matters: from Tours the Loire climbs north-east through Blois (47.59, 1.33) to Orléans, then turns south-east past Gien (47.69, 2.63) and south past Sancerre and Pouilly, which is why the Central Vineyards lie so far from Touraine. The France sheet says: "These middle and upper Loire locators do not imply one compact vineyard zone." GRAPES: Chenin Blanc in "Vouvray & Savennières (Loire)". Check against: InterLoire, Vins de Loire appellation map (vinsvaldeloire.fr); INAO; Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Landscape, 1536 x 1024 pixels.

A field-atlas sheet of the Loire Valley, France, in the exact look of the established
atlas, laid out landscape: deep forest-green page (#142d21 to #081510), a fine double gold
hairline frame with small engraved vine-tendril corner flourishes, a wide thin gold-ruled
map panel across the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, covering about 47.0 to 48.0 north and -2.3 to
3.1 east: the Atlantic coast as a short gold-edged shore at the far left near
(47.25, -2.20); land in sage ivory (#c5c1a2 to #9aa587). The LOIRE as a clear teal line
(#285954) following this course from the Atlantic at the left: east past Nantes
(47.22, -1.55) and Angers (47.47, -0.55) to Tours (47.39, 0.69); then climbing north-east
past Blois (47.59, 1.33) to its northernmost point at Orléans (47.90, 1.90); then turning
south-east past Gien (47.69, 2.63); then running south past Sancerre (47.33, 2.84) and
Pouilly (47.28, 2.95) to the bottom right. The river must form a clear upward arc between
Tours and Gien, with Orléans at its top. Its tributaries the Vienne (joining near 47.21,
0.08) and the Cher (joining near 47.35, 0.48) as thinner teal lines.

Nine small ivory dots at these true relative positions (latitude, longitude), each joined
by a fine leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (47.15, -1.40),
2 (47.38, -0.66), 3 (47.40, -0.50), 4 (47.26, -0.08), 5 (47.17, 0.24) on the Vienne,
6 (47.28, 0.17), 7 (47.41, 0.80), 8 (47.33, 2.84) on the WEST bank of the upper river,
9 (47.28, 2.95) on the EAST bank facing it. Three hollow gold rings with no numbers for
the cities at (47.22, -1.55), (47.39, 0.69) and (47.90, 1.90), the last at the top of the
river's arc. A small gold compass rose with N at the lower right of the map panel.

Only the numerals 1 to 9 and the letter N; no words, no names, no title.
```

- **Avoid:** châteaux; Sancerre and Pouilly on the same bank; the Loire drawn nearly straight west to east (it arcs north-east from Tours to its apex at Orléans, then turns south-east and south); a map window that cuts off Orléans.

#### SO-20. Piedmont: Barolo, Barbaresco, Asti

- **File:** `maps/atlas-zoom-v1/piedmont.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** the Wine Atlas, "Closer look" under Italy, from the Piedmont heading; and on the Barbera d'Asti glass card.
- **Must teach:** the two great Nebbiolo zones either side of Alba, and Asti to the north-east. Points: 1 Barolo village (44.61, 7.94), 2 La Morra (44.64, 7.93), 3 Castiglione Falletto (44.62, 7.98), 4 Serralunga d'Alba (44.61, 8.00), 5 Monforte d'Alba (44.58, 7.97), 6 Barbaresco (44.72, 8.08), 7 Asti (44.90, 8.21), 8 Gavi (44.69, 8.81), 9 Gattinara (45.62, 8.37) in the north. Reference ring: Alba (44.70, 8.03). The Tanaro river runs north-east through Alba and Asti. GRAPES: Nebbiolo in Barolo and Barbaresco; "garnet says age or a naturally lighter variety like Nebbiolo". Check against: Consorzio di Tutela Barolo Barbaresco Alba Langhe e Dogliani maps (langhevini.it); Regione Piemonte DOC/DOCG register; Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of Piedmont's wine country, north-west Italy, in the exact look of
the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold
hairline frame with small engraved vine-tendril corner flourishes, an empty green band at
the bottom for the app's key.

Two gold-ruled map panels: a LARGE main panel (upper two thirds) of the Langhe around
Alba at close scale, and a SMALL panel beneath it at wider scale showing southern
Piedmont up to the north (from 44.4 to 45.8 north, 7.6 to 9.0 east) with a gold rectangle
marking the main panel's window. North up, flat, faint graticule, land in sage ivory
(#c5c1a2 to #9aa587), the TANARO as a teal line (#285954) running from the south-west up
through Alba to the north-east.

Main panel: a hollow gold ring with no number for the town of Alba at (44.70, 8.03), on
the Tanaro. South-west of it, five small ivory dots close together with leaders fanning
out to numbered discs (ivory, gold ring, dark green numeral): 1 (44.61, 7.94), 2 (44.64,
7.93), 3 (44.62, 7.98), 4 (44.61, 8.00), 5 (44.58, 7.97). A fine gold bracket groups them.
North-east of Alba, on the Tanaro's right bank, one dot: 6 (44.72, 8.08).

Small panel: the Tanaro continuing north-east to the dot 7 (44.90, 8.21); a dot 8 (44.69,
8.81) to the south-east; a dot 9 (45.62, 8.37) far to the north near the Sesia river (a
thin teal line); and the gold window rectangle round Alba.

A small gold compass rose with N at the lower right of the main panel. Only the numerals
1 to 9 and the letter N; no words, no names, no title.
```

- **Avoid:** Barbaresco south-west of Alba (it lies north-east); the Alps drawn in relief; hilltop villages as pictures; names.

#### SO-21. Tuscany: Chianti Classico, Montalcino, Montepulciano, Bolgheri

- **File:** `maps/atlas-zoom-v1/tuscany.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** the Wine Atlas, "Closer look" under Italy, from the Tuscany heading.
- **Must teach:** the Sangiovese heart between Florence and Siena, the two southern hill towns, and the coast. Points: 1 Chianti Classico, centred on Greve, Radda and Castellina (43.50, 11.32), 2 Montalcino (43.06, 11.49), 3 Montepulciano (43.09, 11.78), 4 Bolgheri (43.23, 10.61), 5 San Gimignano (43.47, 11.04), 6 Carmignano (43.81, 11.01). Reference rings: Florence (43.77, 11.25), Siena (43.32, 11.33). The Arno runs west through Florence to the sea. GRAPES: Sangiovese. Check against: Consorzio Vino Chianti Classico map (chianticlassico.com); Consorzio del Vino Brunello di Montalcino; Consorzio del Vino Nobile di Montepulciano; Natural Earth coast and rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of Tuscany's wine country, central Italy, in the exact look of the
established atlas: deep forest-green page (#142d21 to #081510), a fine double gold
hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map
panel in the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, covering about 42.9 to 43.9 north and 10.3 to
12.0 east: the Tyrrhenian coast as a gold-edged shore down the left side, the sea in
the page green, the land in sage ivory (#c5c1a2 to #9aa587). The ARNO as a teal line
(#285954) running from the east through Florence and west to the sea near (43.68, 10.28).

Six small ivory dots at these true relative positions (latitude, longitude), each joined
by a fine leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (43.50,
11.32), with a fine dotted gold outline loosely enclosing the hills between the two cities
around it; 2 (43.06, 11.49); 3 (43.09, 11.78); 4 (43.23, 10.61) near the coast;
5 (43.47, 11.04); 6 (43.81, 11.01) west of Florence. Two hollow gold rings with no numbers
for the cities at (43.77, 11.25) and (43.32, 11.33). A small gold compass rose with N at
the lower right of the map panel.

A small inset at the top right: Italy in sage ivory with a tiny gold rectangle in central
Tuscany.

Only the numerals 1 to 6 and the letter N; no words, no names, no title.
```

- **Avoid:** cypress avenues and hill towns as pictures; Montepulciano placed in Abruzzo (this is the Tuscan town); Bolgheri inland.

#### SO-22. The Mosel and its bends

- **File:** `maps/atlas-zoom-v1/mosel.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Wine Atlas, "Closer look" under Germany, from the Mosel heading; and on the J.J. Prüm Wehlener Sonnenuhr Auslese Goldkapsel magnum card.
- **Must teach:** why the slopes face south: the river loops, so the steep banks turn to the sun. Points: 1 Trittenheim (49.82, 6.90), 2 Piesport (49.88, 6.92), 3 Brauneberg (49.91, 6.98), 4 Bernkastel-Kues (49.92, 7.07), 5 Graach (49.93, 7.06), 6 Wehlen (49.94, 7.05), with the Sonnenuhr vineyard on the facing bank, 7 Zeltingen (49.95, 7.02), 8 Ürzig (49.98, 7.01), 9 Erden (49.98, 7.02). Reference rings: Trier (49.75, 6.64), Koblenz (50.36, 7.60), where the Mosel meets the Rhine. The Saar joins near Konz (49.70, 6.58); the Ruwer near Trier (49.78, 6.70). The list's magnum: "J.J. Prüm 'Wehlener Sonnenuhr' Riesling Auslese Goldkapsel 2015 (1.5 L magnum) $615". Check against: Deutsches Weininstitut and Moselwein e.V. vineyard maps; the Mosel Weinbergsrolle (vineyard register); Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Landscape, 1536 x 1024 pixels.

A field-atlas sheet of the Middle Mosel, Germany, in the exact look of the established
atlas, laid out landscape: deep forest-green page (#142d21 to #081510), a fine double gold
hairline frame with small engraved vine-tendril corner flourishes, a wide thin gold-ruled
main map panel across the upper four fifths, an empty green band below for the app's key.

Main panel, north up, flat, faint graticule, covering about 49.78 to 50.02 north and 6.85
to 7.12 east, land in sage ivory (#c5c1a2 to #9aa587): the MOSEL drawn as a clear,
broader teal line (#285954) that winds in tight, deep loops from the south-west corner to
the north-east, like a ribbon folding back on itself. Along the river, wherever the bank
faces south or south-west, a thin gold edge on that bank marks a steep sunny slope.

Nine small ivory dots at these true relative positions (latitude, longitude) along the
river, each joined by a fine leader to a numbered disc (ivory, gold ring, dark green
numeral): 1 (49.82, 6.90), 2 (49.88, 6.92), 3 (49.91, 6.98), 4 (49.92, 7.07), 5 (49.93,
7.06), 6 (49.94, 7.05), 7 (49.95, 7.02), 8 (49.98, 7.01), 9 (49.98, 7.02). Beside dot 6, on
the OPPOSITE bank from the village, a tiny engraved gold sundial symbol marks the famous
south-facing vineyard slope.

A small inset at the top left, framed in gold hairline, at wider scale: the whole Mosel
from Trier (hollow gold ring at 49.75, 6.64) to Koblenz (hollow gold ring at 50.36, 7.60)
where it meets the Rhine (a thicker teal line), the Saar joining near (49.70, 6.58) and the
Ruwer near (49.78, 6.70) as thin teal lines, and a gold rectangle marking the main panel's
window. A small gold compass rose with N at the lower right of the main panel.

Only the numerals 1 to 9 and the letter N, and the small sundial symbol; no words, no
names, no title.
```

- **Avoid:** a smooth, gently curving river (the loops are the lesson); vineyard rows or relief; the sundial on the village's own bank; names.

#### SO-23. Rioja: Alta, Alavesa, Oriental

- **File:** `maps/atlas-zoom-v1/rioja.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Wine Atlas, "Closer look" under Spain, from the Rioja heading.
- **Must teach:** the three subzones along the Ebro: 1 Rioja Alta, west, around Haro (42.58, -2.85); 2 Rioja Alavesa, north of the Ebro under the Sierra de Cantabria, around Laguardia (42.55, -2.58); 3 Rioja Oriental (the former Rioja Baja), east, around Alfaro (42.18, -1.75). Reference rings: Haro (42.58, -2.85), Logroño (42.47, -2.45). The Ebro runs south-east. GRAPES: Tempranillo, "Rioja". Check against: Consejo Regulador DOCa Rioja zone map (riojawine.com); Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Landscape, 1536 x 1024 pixels.

A field-atlas sheet of Rioja, northern Spain, in the exact look of the established atlas,
laid out landscape: deep forest-green page (#142d21 to #081510), a fine double gold
hairline frame with small engraved vine-tendril corner flourishes, a wide thin gold-ruled
map panel across the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, covering about 42.0 to 42.8 north and -3.1 to
-1.6 east, land in sage ivory (#c5c1a2 to #9aa587): the EBRO as a clear teal line
(#285954) running from the north-west corner down to the south-east corner. North of the
river in the west, a flat darker green band (#263b2d) for the Sierra de Cantabria, no
relief.

Three zones shown by fine dotted gold outlines, loosely, along the river: a western zone
on both banks around (42.55, -2.80); a smaller northern zone on the NORTH bank only,
between the river and the sierra, around (42.57, -2.58); an eastern zone on both banks
from about -2.2 to -1.7, around (42.25, -1.90). One small ivory dot in each zone with a
leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (42.58, -2.85),
2 (42.55, -2.58), 3 (42.18, -1.75). Two hollow gold rings with no numbers at (42.58,
-2.85) beside dot 1 and at (42.47, -2.45) on the river. A small gold compass rose with N at
the lower right of the map panel.

A small inset at the top right: Spain in sage ivory with a tiny gold rectangle in the
north.

Only the numerals 1, 2, 3 and the letter N; no words, no names, no title.
```

- **Avoid:** the northern zone drawn south of the Ebro; region colours; names.

#### SO-24. The Douro and Port

- **File:** `maps/atlas-zoom-v1/douro-port.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Wine Atlas, "Closer look" under Portugal, from the Douro / Port heading; and on the Port cards in "Dessert and fortified".
- **Must teach:** the river from the Spanish border to the lodges at its mouth, and its three subregions: 1 Baixo Corgo, from about Barqueiros (-7.93) to the mouth of the Corgo at Régua (about -7.77), dot just west of Peso da Régua (41.16, -7.85); 2 Cima Corgo, from the Corgo to the Cachão da Valeira (about -7.38), around Pinhão (41.19, -7.55); 3 Douro Superior, from the Cachão da Valeira east to the Spanish border (41.10, -7.10). Reference rings: Porto (41.15, -8.61) with Vila Nova de Gaia's lodges on the south bank, and Barca d'Alva at the border (41.03, -6.93). The Corgo joins the Douro at Régua. Check against: IVDP, Instituto dos Vinhos do Douro e do Porto, Douro region map (ivdp.pt); Natural Earth rivers and border.

```
FAMILY 2, THE FIELD ATLAS SHEET. Landscape, 1536 x 1024 pixels.

A field-atlas sheet of the Douro Valley, northern Portugal, in the exact look of the
established atlas, laid out landscape: deep forest-green page (#142d21 to #081510), a fine
double gold hairline frame with small engraved vine-tendril corner flourishes, a wide thin
gold-ruled map panel across the upper four fifths, an empty green band below for the
app's key.

The map, north up, flat, faint graticule, covering about 40.9 to 41.5 north and -8.8 to
-6.8 east: the Atlantic shore as a gold edge at the far left; Portugal in sage ivory
(#c5c1a2 to #9aa587); Spain beyond the border at the right in darker green (#263b2d), the
border a thin gold dotted line. The DOURO as a clear teal line (#285954) running from the
Spanish border at the right, west across the whole map to the sea at Porto. A thinner
teal tributary, the Corgo, joining from the north at about (41.16, -7.79).

Three fine vertical dotted gold lines cross the river: the region's western limit at
about longitude -7.93 (near Barqueiros); the line between the first and second stretches
at the mouth of the Corgo, about -7.77; and the line between the second and third
stretches at the Cachão da Valeira gorge, about -7.38. The Spanish border closes the third
stretch. The river from Porto up to -7.93 is left plain, outside the region. One small
ivory dot in each stretch, on the river, with a leader to a numbered disc (ivory, gold
ring, dark green numeral): 1 (41.16, -7.85), between the western limit and the Corgo;
2 (41.19, -7.55), between the Corgo and the gorge; 3 (41.10, -7.10), between the gorge
and the border. No dot sits on a line. Hollow gold rings with no numbers at (41.15, -8.61), with a tiny cluster of three
engraved gold lodge roofs on the SOUTH bank opposite it, and at (41.03, -6.93) at the
border. A small gold compass rose with N at the lower right of the map panel.

Only the numerals 1, 2, 3 and the letter N; no words, no names, no title.
```

- **Avoid:** terraces or relief; rabelo boats; the lodges on the north bank; a dot sitting on a divider; the region drawn reaching down to Porto (it begins at about -7.93); names.

#### SO-25. The Burgundy slope: why a vineyard is Grand Cru

- **File:** `assets/teach/burgundy-slope-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Compendium, Classifications & Labels, France, at the head of the Burgundy entry; and on the Burgundy cards in My restaurant.
- **Must teach:** INTRO_CLASS, verbatim: "Vineyard-based: Grand Cru (≈2%, the named vineyard only) › Premier Cru (village + '1er Cru' + vineyard) › Village (commune name) › Regional (Bourgogne). A Grand Cru label shows ONLY the vineyard name, e.g. 'Chambertin'." The slope shows why: the best sites sit mid-slope, facing east and south-east, with thin soil over limestone and good drainage; the village vines lower down; the regional vines on the flat land by the road and towards the plain. The house: "Premier Cru is Burgundy's second-highest vineyard tier" (the Jadot Beaune 1er Cru note). Key the app prints: 1 woods on the hilltop; 2 Grand Cru, mid-slope; 3 Premier Cru, just above and below; 4 Village, the lower slope; 5 Regional, the flat land; 6 the village itself, at the foot of the slope; 7 limestone beneath.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A geological cross-section plate on warm parchment (#f3e9d5 to #e3d3b4), fine ink-brown
engraving (#29271f) with soft true-colour watercolour washes, a thin double gold hairline
frame (#d5b16c).

A side-on cross-section of a gentle east-facing hillside in Burgundy: the hilltop at the
LEFT (west), the slope descending to the RIGHT (east) to a flat plain. A small sun low in
the upper right (morning sun from the east) with fine engraved rays falling on the slope.

Above ground, from left to right: a cap of dark green woodland on the hilltop; then the
slope covered in neat vine rows drawn small in side view, in four bands. The band at the
very middle of the slope has the most vigorous, richly drawn vines; above and below it,
two slightly narrower bands; lower down the slope, a broader band; and on the flat land at
the bottom right, a wide band of vines on level ground. At the foot of the slope, between
the lower band and the flat land, a small cluster of stone village houses with a church
spire, and a thin road running past them.

Below ground, the cross-section shows: a thin brown topsoil over pale cream limestone
bedrock on the hilltop and mid-slope, with fine stone fragments mixed in the thin soil
mid-slope; the soil getting thicker, darker and richer brown towards the bottom of the
slope and on the plain, with clay drawn as a heavier brown layer.

Numbered discs (ivory #f3e9d5, gold ring, dark green numeral #17382a) with fine ink
leaders: 1 on the woods; 2 on the mid-slope band; 3 on the band just above it AND, with a
second disc also numbered 3, on the band just below it; 4 on the lower broad band; 5 on the
flat land; 6 on the village; 7 on the limestone below. Only these numerals; no words,
letters or labels.
```

- **Avoid:** a steep Mosel-like slope or terraces (the Côte is gentle); the best band at the top or bottom; the sun in the west; words in the picture (the tier names are typeset by the app).

#### SO-26. Reading a label: Old World and New World

- **File:** `assets/teach/label-reading-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Compendium, at the head of Classifications & Labels; and in My restaurant above "The full wine list".
- **Must teach:** INTRO_CLASS: "Quality is tied to PLACE; the grape is usually implied by the appellation, not printed", against the New World label that leads with the grape. Two invented labels (no real producer), with the words given exactly, and numbered callouts the app keys: 1 the producer; 2 the place (the appellation); 3 the quality tier; 4 the vintage; 5 the grape (named only on the New World label); 6 the volume and the alcohol. This is the one entry that must carry words, because a label is words.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A plate on warm parchment (#f3e9d5 to #e3d3b4) with a thin double gold hairline frame
(#d5b16c), showing two wine labels flat and face-on, side by side, each drawn large and
crisp as if printed, each with a fine ink border. These are invented labels; spell every
word exactly as given below and add no other words, crests, logos or signatures.

LEFT LABEL, a traditional French Burgundy label: cream paper, black and deep red classical
serif type, centred, a thin double black rule border. Exactly these lines, top to bottom:
  DOMAINE DES TROIS CHÊNES        (small capitals, black)
  MEURSAULT                       (very large capitals, deep red)
  PREMIER CRU                     (small capitals, black)
  LES PERRIÈRES                   (medium capitals, black)
  2021                            (medium numerals, black)
  APPELLATION MEURSAULT 1ER CRU CONTRÔLÉE   (very small capitals, black)
  750 ml     13% vol              (very small, black, on one line at the bottom)

RIGHT LABEL, a modern Californian label: white paper, clean modern serif type, left
aligned, generous space, a single thin gold rule at the top. Exactly these lines, top to
bottom:
  Three Oaks Cellars              (medium, black)
  Chardonnay                      (very large, black)
  Sonoma Coast                    (medium, black)
  2022                            (medium, black)
  750 ml     14.1% alc/vol        (very small, black, at the bottom)

Numbered callout discs (ivory #f3e9d5, gold ring, dark green numeral #17382a) outside each
label with fine ink leader lines pointing to the right line:
Left label: 1 to DOMAINE DES TROIS CHÊNES; 2 to MEURSAULT; 3 to PREMIER CRU; 4 to 2021;
6 to the volume line. (No 5 on the left label.)
Right label: 1 to Three Oaks Cellars; 2 to Sonoma Coast; 4 to 2022; 5 to Chardonnay; 6 to
the volume line.
No other text anywhere in the image.
```

- **Avoid:** any real producer, crest or trademark; extra words or a back label; misspellings (check every accent: CHÊNES, PERRIÈRES, CONTRÔLÉE); a photograph of a bottle (labels flat only).

#### SO-27. Reading colour: the white page and the rim

- **File:** `assets/teach/grid-colour-rim-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** Study the grid (the Deductive Grid), at the head of "Sight"; and in the tasting flight screen.
- **Must teach:** TASTING_GRID, Sight: "Concentration: Pale, medium, or deep. Judge against a white page"; "Whites: straw, yellow, gold. Reds: purple, ruby, garnet. Purple says youth; garnet says age or a naturally lighter variety like Nebbiolo or Pinot Noir"; "Rim variation: A wide, pale or orange rim on a red suggests age or Nebbiolo/Sangiovese; magenta rim points to Malbec; little rim variation implies youth." House rule: "wine-colour teaching swatches must not be recoloured as branding." Key the app prints: top row 1 straw, 2 yellow, 3 gold; bottom row 4 purple, 5 ruby, 6 garnet; 7 the rim of the garnet wine, wide and orange.

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

Six identical clear, thin-rimmed tulip-shaped tasting glasses, each holding the same
modest pour of wine, each standing upright on a plain sheet of bright white paper on a
dark polished wooden table, seen from directly above, so that each wine's surface is a
circle that shows the colour from the deep centre out to the paler rim at its edge, with
the white paper visible through and around the glass. Nothing holds the glasses; they
stand on their own feet. Clean, even, neutral white daylight on the paper so the colours
are true; the deep forest-green background in soft shadow at the very top edge only.
Arranged in two rows of three.

Top row, white wines, left to right: 1 pale straw with a green glint; 2 lemon yellow;
3 deep gold.
Bottom row, red wines, left to right: 4 deep opaque purple with a vivid violet-magenta rim;
5 bright ruby, with only a narrow paler rim; 6 garnet, lighter in the centre, fading to a
WIDE brick-orange rim.

A numbered disc (ivory #f3e9d5, gold ring, dark green numeral #17382a) beside each glass:
1 to 6; and a seventh disc, 7, with a fine gold leader pointing to the wide orange rim of
glass 6. No other numerals, words or letters.
```

- **Avoid:** candlelight or any warm cast on the wine (this plate uses neutral light because colour is the lesson); the glasses held by hands, tilted, floating or propped; a side view (the plate is seen from directly above); brown, cloudy or fizzy wine; identical-looking rims on 4, 5 and 6.

#### SO-28. The traditional method, from base wine to cork

- **File:** `assets/teach/champagne-traditional-method-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** the Library, at the head of the Champagne study chapter; and at the head of "Champagne bottles" in My restaurant, under SO-16.
- **Must teach:** the traditional method in eight steps, the key the app prints: 1 base wine blended (assemblage); 2 bottled with yeast and sugar under a crown cap (tirage); 3 second fermentation in the bottle, making the bubbles (about 6 atmospheres of pressure, the Codex primer: "~6 atmospheres behind the muselet"); 4 ageing on the lees (non-vintage at least 15 months, vintage at least 36); 5 riddling (remuage): bottles turned neck down in a pupitre until the lees settle in the neck; 6 disgorging (dégorgement): the neck frozen, the crown cap removed, the plug of lees shot out; 7 dosage, a little wine and sugar (liqueur d'expédition), which sets the sweetness: Extra Brut, Brut (the house Brennan's Essential is an Extra Brut); 8 cork, wire cage (muselet) and foil.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Portrait, 1024 x 1536 pixels.

A scientific process plate on warm parchment (#f3e9d5 to #e3d3b4), fine ink-brown
engraving (#29271f) with soft true-colour watercolour washes, a thin double gold hairline
frame (#d5b16c). Eight small square vignettes in a grid of two columns and four rows,
each framed by a thin gold hairline, read left to right, top to bottom, with a small fine
gold arrow between each vignette and the next.

1: three glass beakers of pale still white wine being poured together into one larger
vessel.
2: a dark green Champagne bottle being filled, a small dish of yeast and a few sugar
crystals beside it, and a metal crown cap (like a beer bottle cap) on its neck.
3: the crown-capped bottle lying on its side in a dark cellar, with tiny fine bubbles
forming inside the wine and a few fine engraved pressure lines radiating from the bottle.
4: a stack of many bottles lying on their sides in a chalk cellar, a thin pale line of
yeast sediment (lees) resting along the lower side of each bottle.
5: a wooden riddling rack (an A-frame pupitre with angled holes), bottles tilted neck down
in it, a hand giving one bottle a slight turn; the sediment gathered in the neck.
6: a bottle held neck down, its neck dipped in a shallow tray of icy freezing brine; then
the same bottle upright with the crown cap flying off and a small frozen plug of sediment
shooting out.
7: a small measured pour of golden liquid from a jug being added to the open bottle.
8: the finished bottle, with a mushroom cork held by a wire cage and gold foil over the
neck, standing upright.

In the top left corner of each vignette, a small ivory disc with a gold ring and a dark
green numeral: 1 to 8. No other numbers, words or letters; no labels on any bottle.
```

- **Avoid:** a cork in steps 2 to 6 (the bottle is under a crown cap until step 8); people beyond a single hand in step 5; any branded bottle or cellar; words.

#### SO-29. Bottle shapes you can read across a room

- **File:** `assets/teach/bottle-shapes-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** the Compendium, Winemaking, beside "Grape to bottle"; and in My restaurant above "The full wine list", so a server can tell a Bordeaux from a Burgundy on the back bar.
- **Must teach:** the four classic shapes and what they usually hold; the key the app prints: 1 Bordeaux: high square shoulders, straight sides (Cabernet, Merlot, Sauvignon Blanc, Sémillon; Napa Cabernet uses it too); 2 Burgundy: gently sloping shoulders, a wider body (Pinot Noir, Chardonnay; the Rhône uses a similar shape); 3 the tall, slender flute of the Mosel and Alsace, in green glass (Riesling, Gewürztraminer; the Rhine uses the same shape in brown glass, which the key says and the image does not draw); 4 Champagne: heavy thick glass, sloping shoulders, a deep punt, a lip for the cage. Habits, not laws: the app says so.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific comparison plate on warm parchment (#f3e9d5 to #e3d3b4), fine ink-brown
engraving (#29271f) with true-colour watercolour washes, a thin double gold hairline frame
(#d5b16c). Four 750 ml wine bottles standing in a row on one engraved ground line, side-on,
in TRUE relative scale, each with a blank cream label and no writing, each drawn also as a
faint dotted cutaway showing the depth of the punt in its base.

1: a dark green Bordeaux bottle: straight parallel sides, high sharply squared shoulders,
a straight neck, a modest punt, a dark red capsule.
2: a dark olive-green Burgundy bottle: a slightly wider body, long gently sloping
shoulders flowing into the neck, a deeper punt, a deep burgundy capsule.
3: a tall, slender green flute bottle (Mosel and Alsace style): narrow, tall, gently tapering
from body to neck with no distinct shoulder, almost no punt, a pale gold capsule.
4: a heavy dark green Champagne bottle: thick glass, sloping shoulders, a pronounced lip
under the cork for the wire cage, a very deep punt, gold foil over the neck.

Under each bottle, centred on the ground line, a numbered disc (ivory #f3e9d5, gold ring,
dark green numeral #17382a): 1, 2, 3, 4. No other numbers, words or letters.
```

- **Avoid:** branded, embossed or crested bottles (a Châteauneuf-du-Pape crest especially); bottles at different scales; words.

#### SO-30. Grape portrait, the series anchor: Pinot Noir

- **File:** `assets/teach/grapes/pinot-noir-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** the Compendium, The Grapes, at the top of the Pinot Noir entry; and on the grape flashcards. It sets the look every other portrait in D2 follows, so run it first and approve it before the series.
- **Must teach:** the grape as a vine-side specimen a student can recognise: Pinot Noir's small, tightly packed, pine-cone-shaped clusters (the name is often traced to pin, pine) of thin-skinned, blue-black berries with a dusty bloom, and its leaf. GRAPES: Pinot Noir is light in body with high acid; "garnet says age or a naturally lighter variety like Nebbiolo or Pinot Noir". The house pours it from the Jadot Beaune 1er Cru and the "Light reds, Pinot Noir" section. Ampelography to check against: VIVC, Vitis International Variety Catalogue (vivc.de), Pinot Noir entry photographs.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Square, 1024 x 1024 pixels.

A botanical specimen plate in the manner of a nineteenth-century ampelography, on warm
parchment (#f3e9d5 to #e3d3b4), fine ink-brown engraving (#29271f) with true-colour
watercolour washes, a thin double gold hairline frame (#d5b16c).

In the centre, one ripe bunch of Pinot Noir grapes hanging from a short woody cane: a
SMALL, compact, tightly packed cluster shaped like a pine cone, cylindrical to slightly
conical, about the length of a palm; the berries small, round, crowded so tightly they
press against each other, thin-skinned, deep blue-black with a soft pale-grey dusty bloom
on the skins. Behind and to the upper left, one mature vine leaf, medium sized, roughly
round, with three to five shallow lobes and toothed edges, in true mid green with fine
engraved veins. A curling tendril to the right.

Lower right, a small gold-framed inset: one berry cut in half showing a thin dark skin,
pale greenish translucent flesh and two small seeds.

Lower left, a small gold-framed inset: a clear wine glass with a pour of translucent,
pale-to-medium ruby wine, so light that the outline of a fine line drawn behind it shows
through.

No numerals, words or letters.
```

- **Avoid:** large, loose or elongated clusters; green or purple-pink berries; an opaque inky wine in the glass; decorative borders of extra fruit; words.

---

## D. Series templates for the big sets

### D1. The atlas zoom sheet (one template, many regions)

Paste the style guide, then this template with the slots filled. Each filled sheet is checked point by point against its named sources before it ships, as the note above SO-14 says.

```
FAMILY 2, THE FIELD ATLAS SHEET. [Portrait, 1024 x 1536 | Landscape, 1536 x 1024] pixels.

A field-atlas sheet of [REGION, COUNTRY], in the exact look of the established atlas: deep
forest-green page (#142d21 to #081510), a fine double gold hairline frame with small
engraved vine-tendril corner flourishes, a thin gold-ruled map panel in the upper four
fifths, an empty green band below for the app's key.

The map, north up, flat drawing, faint graticule, covering about [LAT RANGE] north and
[LON RANGE] east, the land in sage ivory (#c5c1a2 to #9aa587), neighbouring countries in
darker green (#263b2d), any sea or lake in the page green with a thin gold shore. Rivers
as teal lines (#285954): [RIVERS, EACH WITH THE COORDINATES IT PASSES]. Any range of hills
as a flat darker green band, never relief: [HILLS, IF ANY].

Small ivory dots at these true relative positions (latitude, longitude), each joined by a
fine leader to a numbered disc (ivory #f3e9d5, gold ring, dark green numeral #17382a)
placed so none overlap: [NUMBERED POINTS WITH COORDINATES, AND WHICH BANK]. Smaller hollow
gold rings with no numbers for these reference towns: [TOWNS WITH COORDINATES]. A small
gold compass rose with N at the lower right of the map panel. A small inset of
[COUNTRY] in sage ivory with a tiny gold rectangle marking this window.

Only the numerals [1 TO n] and the letter N; no words, no names, no title.
```

First items to run, in this order:

1. **Alsace** (portrait). Points: Strasbourg ring (48.58, 7.75), Colmar ring (48.08, 7.36); 1 Riquewihr (48.17, 7.30), 2 Ribeauvillé (48.19, 7.32), 3 Kaysersberg (48.14, 7.26), 4 Eguisheim (48.04, 7.31), 5 Guebwiller (47.91, 7.21), 6 Barr (48.41, 7.45), 7 Thann (47.81, 7.10). Rivers: the Rhine on the eastern border (from 48.6, 7.8 south to 47.6, 7.55); the Ill parallel to it. Hills: the Vosges as a flat dark band west of the points. Vineyards on the eastern foothills. Sources: CIVA, Vins d'Alsace map (vinsalsace.com); INAO.
2. **Madeira** (landscape, island alone). Points: Funchal ring (32.65, -16.91); 1 Câmara de Lobos (32.65, -16.98), 2 São Vicente on the north coast (32.80, -17.04), 3 Porto Moniz (32.87, -17.17), 4 Seixal (32.82, -17.11). Coast only, no rivers. Sources: IVBAM, Instituto do Vinho, do Bordado e do Artesanato da Madeira; Natural Earth coast. The list's Broadbent Malvasia and Verdelho 500 ml come from here.
3. **Jura and Savoie** (portrait, two panels). Jura: 1 Arbois (46.90, 5.77), 2 Château-Chalon (46.75, 5.62), 3 L'Étoile (46.73, 5.53); Lons-le-Saunier ring (46.67, 5.55). Savoie: 4 Apremont (45.50, 5.94), 5 Chignin (45.52, 6.02); Chambéry ring (45.57, 5.92); Lac du Bourget. GRAPES_PLUS: Savagnin (Jura). Sources: CIVJ, Vins du Jura; Vins de Savoie; INAO.
4. **Chablis** (portrait). 1 Chablis town and its Grand Cru slope on the north-east bank of the Serein (47.82, 3.80); Auxerre ring (47.80, 3.57). Sources: BIVB.
5. **Beaujolais crus** (portrait). North to south: Saint-Amour (46.24, 4.70), Juliénas (46.24, 4.71), Chénas (46.21, 4.71), Moulin-à-Vent (46.19, 4.73), Fleurie (46.19, 4.70), Chiroubles (46.18, 4.66), Morgon (46.16, 4.68), Régnié (46.14, 4.64), Brouilly (46.12, 4.68), Côte de Brouilly (46.11, 4.67). INTRO_CLASS: "10 named Crus". The list's Foillard Côte du Py Morgon magnum. Sources: Inter Beaujolais (beaujolais.com); INAO. (Points crowd: use a larger scale and fan the leaders.)
6. **Sonoma County AVAs**, **Willamette Valley AVAs**, **Mendoza: Luján de Cuyo and the Uco Valley**, next, from TTB and the national bodies' maps.

### D2. Grape portraits (one template, 47 grapes)

Run SO-30 first and approve it; then the rest from this template, one grape per prompt.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Square, 1024 x 1024 pixels.

A botanical specimen plate in the manner of a nineteenth-century ampelography, on warm
parchment (#f3e9d5 to #e3d3b4), fine ink-brown engraving (#29271f) with true-colour
watercolour washes, a thin double gold hairline frame (#d5b16c), in exactly the same
layout as the approved Pinot Noir plate.

In the centre, one ripe bunch of [GRAPE] grapes hanging from a short woody cane:
[CLUSTER SHAPE AND SIZE]; the berries [BERRY SIZE, SHAPE, SKIN COLOUR AND BLOOM]. Behind and
to the upper left, one mature vine leaf: [LEAF CHARACTER], in true mid green with fine
engraved veins. A curling tendril to the right.

Lower right, a small gold-framed inset: one berry cut in half showing the skin, flesh and
seeds.

Lower left, a small gold-framed inset: a clear wine glass with a pour of [WINE COLOUR AND
DEPTH].

No numerals, words or letters.
```

First items, in the order the Brennan's list needs them, with the slot facts (each checked against the VIVC entry photographs before it ships):

| Grape | Cluster | Berries | Leaf | Wine in the glass |
|---|---|---|---|---|
| Chardonnay | small to medium, compact, cylindrical | small, round, green-gold, thin-skinned | medium, rounded, slightly lobed, with the veins running bare at the leaf's stem notch (the open petiolar sinus bounded by veins) | pale lemon to gold |
| Cabernet Sauvignon | small to medium, conical, fairly loose | small, round, thick-skinned, very dark blue-black, heavy bloom | deeply five-lobed with round holes between the lobes | deep, opaque purple-ruby |
| Merlot | medium, loose, conical | medium, round, blue-black, thinner-skinned than Cabernet | five-lobed, less deeply cut than Cabernet | deep ruby |
| Riesling | small, compact, cylindrical | small, round, green with brown sun freckles when ripe | small, rounded, three to five lobes | very pale lemon with a green glint |
| Sauvignon Blanc | small, compact, cylindrical to conical | small, oval, yellow-green | medium, rounded, lobed, crinkled | pale lemon-green |
| Grenache | medium to large, compact, conical | medium, round, thin-skinned, mid purple, lighter than Syrah | medium, five-lobed, shiny | medium ruby, translucent |
| Syrah | medium, cylindrical, elongated | small, oval, blue-black | medium, five-lobed | deep purple-ruby |
| Chenin Blanc | medium, compact, conical | medium, oval, yellow-green, thin-skinned | medium, rounded, lobed | pale lemon to gold |
| Nebbiolo | long, pyramidal, often winged | small to medium, round, dark purple-blue with a heavy dusty bloom (the bloom is said to give the name, from nebbia, fog) | medium, three to five lobed | pale garnet with an orange rim |
| Sangiovese | medium, cylindrical to conical, compact | medium, round to oval, blue-black, thin-skinned | medium, five-lobed | medium ruby to garnet |

Then the rest of `GRAPES` (Albariño, Gewürztraminer, Grüner Veltliner, Muscat Blanc, Pinot Gris, Torrontés, Viognier, Cabernet Franc, Gamay, Malbec, Tempranillo, Zinfandel) and of `GRAPES_PLUS` (24, from Assyrtiko to Carmenère), each slot filled from the VIVC entry and checked before it is sent. For Assyrtiko, add the training the data names: "kouloura-trained, own-rooted" (a low basket of vine on the ground) as a small inset in place of the berry section.

### D3. A single glass card (one template, nine glasses)

For each glass of SO-10 shown alone on a wine's card, once the chart is approved.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Square, 1024 x 1024 pixels.

One empty, clear crystal [GLASS NAME AND SHAPE, COPIED WORD FOR WORD FROM SO-10], drawn as
a fine ink-brown engraving (#29271f) with the faintest grey watercolour for the glass, on
warm parchment (#f3e9d5 to #e3d3b4), a thin double gold hairline frame (#d5b16c), standing
centred on a short engraved ground line, side-on at eye level with a slight ellipse at the
rim, filling about 70 percent of the frame height, with a fine dotted gold line across the
bowl at its correct pour level: [POUR LEVEL FROM SO-10]. No liquid, no numerals, no words.
```

First items: tulip, white Burgundy bowl, Bordeaux glass, Burgundy bowl, white-wine glass (the five the list names most).

---

## E. Notes

### E1. Hand-back spec (so the delivered images can be wired in)

| ID | Deliver as | Size | Goes to |
|---|---|---|---|
| SO-01 | `brennans-pour-order-v1.webp` | 1024 x 1024 | `assets/teach/` |
| SO-02 | `service-still-opening-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-03 | `service-champagne-opening-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-04 | `brennans-sabrage-v1.webp` | 1024 x 1536 | `assets/teach/` |
| SO-05 | `brennans-coravin-two-ways-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-06 | `service-decanting-old-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-07 | `service-decant-or-not-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-08 | `brennans-bottle-sizes-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-09 | `brennans-nebuchadnezzar-v1.webp` | 1024 x 1024 | `assets/teach/` |
| SO-10 | `brennans-wine-glasses-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-11 | `bottle-ullage-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-12 | `bottle-heat-damage-v1.webp` | 1024 x 1024 | `assets/teach/` |
| SO-13 | `glass-crystals-sediment-cork-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-14 | `burgundy-cote-dor.webp` | 1024 x 1536 | `maps/atlas-zoom-v1/` |
| SO-15 | `bordeaux-banks.webp` | 1024 x 1536 | `maps/atlas-zoom-v1/` |
| SO-16 | `champagne.webp` | 1024 x 1536 | `maps/atlas-zoom-v1/` |
| SO-17 | `rhone-north-south.webp` | 1024 x 1536 | `maps/atlas-zoom-v1/` |
| SO-18 | `napa-valley.webp` | 1024 x 1536 | `maps/atlas-zoom-v1/` |
| SO-19 | `loire.webp` | 1536 x 1024 | `maps/atlas-zoom-v1/` |
| SO-20 | `piedmont.webp` | 1024 x 1536 | `maps/atlas-zoom-v1/` |
| SO-21 | `tuscany.webp` | 1024 x 1536 | `maps/atlas-zoom-v1/` |
| SO-22 | `mosel.webp` | 1536 x 1024 | `maps/atlas-zoom-v1/` |
| SO-23 | `rioja.webp` | 1536 x 1024 | `maps/atlas-zoom-v1/` |
| SO-24 | `douro-port.webp` | 1536 x 1024 | `maps/atlas-zoom-v1/` |
| SO-25 | `burgundy-slope-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-26 | `label-reading-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-27 | `grid-colour-rim-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-28 | `champagne-traditional-method-v1.webp` | 1024 x 1536 | `assets/teach/` |
| SO-29 | `bottle-shapes-v1.webp` | 1536 x 1024 | `assets/teach/` |
| SO-30 | `pinot-noir-v1.webp` | 1024 x 1024 | `assets/teach/grapes/` |
| D1 | `<region-slug>.webp` | as the template | `maps/atlas-zoom-v1/` |
| D2 | `<grape-slug>-v1.webp` | 1024 x 1024 | `assets/teach/grapes/` |
| D3 | `glass-<slug>-v1.webp` | 1024 x 1024 | `assets/teach/glasses/` |


Wiring, for when the art comes back (code tasks, not art):

- Every teaching image is content under the typography rule, so it gets real alt text written from the "Must teach" lines, its key typeset beside it, and a caption; never alt="".
- Like the maps, the teaching images should load on demand into their own versioned cache rather than the shell precache, and the screens must render correctly with the folder empty, as the atlas tab does. Keep each file under about 250 KB (webp quality about 80 at the delivered size).
- The zoom sheets are new versioned paths (`maps/atlas-zoom-v1/`), so the atlas-v2 cache contract is untouched; give them a guide entry in `js/data-atlas-v2.js`'s style (title, scope, reading, sources) and a line in `atlas-sources.html`.
- In the site copy, any new file under `codex/` bumps the Codex worker (oot-codex-vN) with `node tools/bump-shared.mjs --apply`, then `node tools/check-all.mjs`.

### E2. Fixes to current images (code, no ChatGPT)

1. Icons: move `icons/icon.svg` from the claret ground (#130709) to the house forest green and regenerate the PNGs with resvg; consider dropping the star and fleurons under the typography rule.
2. Masthead on a phone: a darker scrim under the strapline, or a shorter phone crop, so the tabs reach the first screen.
3. The 17 archived JPG posters: never shown, never briefed from; remove them from the published copy when the rollback window closes (6.7 MB).
4. California sheet: give Napa and Sonoma separate numbers in `.scripts/atlas-v2/catalog.cjs` when the Napa zoom sheet lands.

### E3. What stays typography (no image wanted)

Service temperatures, the naming tables for large formats (Champagne Jeroboam 3 L against Bordeaux Jéroboam 5 L; Methuselah against Imperial at 6 L), the 1855 classification, the German Prädikat ladder, the Italian and Spanish tiers, and the deductive grid's wording are lists of words and numbers. The Codex sets them in type, and a picture would only repeat them. The images above are chosen because each shows something a sentence cannot: a hand's movement, a place's shape, a slope, a colour, a proportion.
