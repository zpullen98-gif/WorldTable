# Outside Of Time Hospitality: training image audit and ChatGPT brief

4 October 2026. Prepared for the owner, a new server at Brennan's, 417 Royal Street, New Orleans. World Table, the Bartender's Ledger and the Sommelier's Codex. ChatGPT makes every picture in this suite; this brief writes what each picture must be. Nothing in it has been made or shipped.

## 1. How to use this with ChatGPT

1. **Open one fresh ChatGPT chat per app.** Every entry is headed with the app whose art it is: World Table, the Bartender's Ledger or the Sommelier's Codex. Keep a chat for each, so the look never drifts from one app to another.
2. **Paste that app's style guide once,** at the start of its chat, from section 2. It sets the paper, frame, palette, light and lettering rules for every picture that follows. If a chat grows long and the look starts to wander, open a new chat and paste the style guide again.
3. **Paste one prompt at a time.** Copy the whole grey block of one entry, nothing more, and send it. Every prompt is complete on its own after the style guide: it repeats the essentials, so it also works if the style guide has scrolled far back.
4. **Ask for the file name and size given.** Each entry's first line names the exact file, for example `brennans-sauces-v1.webp`, and the pixel size: 1024 x 1536 portrait, 1536 x 1024 landscape or 1024 x 1024 square. After the prompt, add: "Deliver it as WebP at exactly that size, named" and the file name. ChatGPT's image sizes are these three, so nothing needs cropping.
5. **Deliver WebP.** If ChatGPT hands back a PNG, keep the file name and change only the extension (`brennans-sauces-v1.png`); Claude encodes the WebP and the thumbnails when it wires the image in.
6. **Check the picture against "Must teach" before keeping it.** The entries quote the house and the apps' own data, so the picture can be held against the words: the right glass, the right number of panels, the numerals in the right order, nothing added. If one detail is wrong, reply in the same chat naming only that detail ("keep everything, but make the two claws clearly unequal") rather than pasting the prompt again. Where an entry says to confirm something on the pass or with the bar, do that before the image is used.
7. **Never accept lettering you did not ask for.** Apart from the numerals a prompt lists (and the exact words of the one labelled diagram, the wine label in C13), the art carries no words; the apps print every name beside the picture in their own type. Ask ChatGPT to remove any stray text, signature or watermark.
8. **Hand the files back for wiring in.** Put the delivered files in one folder and give them to Claude with the IDs. Section 10 lists, for every ID, the file name, format, size, repository, folder and screen, so Claude can wire each image in, write its alt text and bump the right worker. A revision takes the next version number (`-v2`), never the same name.

**Order of work.** Brennan's first (section 4), because that is what the owner serves this month: the dishes in World Table art, the drinks in Ledger art, the wines and service in Codex art. Then each app's own entries (sections 5 to 7), the fixes to current images (section 8), and the series templates (section 9) for the large sets, which are filled from the apps' data one item at a time.

**What each entry holds.** An ID and title; the app and the style guide to paste; the file name, pixel size and format; where the image appears in the app; what it must teach, with the facts quoted from the source; any question for the bar or the pass; the copy-ready prompt; and what to avoid.

## 2. The three style guides

Paste one of these once, at the start of that app's ChatGPT chat, before any of its prompts. The art already in each app is ChatGPT's and is never undone: these guides extend its look, they do not replace it.

### 2.1 World Table

The house look is the twenty v2 natural-history study plates. Every new World Table picture is a study plate (portrait, six numbered cells) or the new landscape folio that carries the same paper, frame and numerals.

```
STYLE GUIDE: THE WORLD TABLE (a culinary study app). Read this once and apply it to every image I ask for in this chat.

WHAT THE ART IS FOR
Every image is a teaching plate for restaurant staff. It must be factually right before it is beautiful. If a detail is uncertain, leave it plain rather than invent it.

THE HOUSE LOOK: "the study plate"
A lifelike natural-history study, as in a fine nineteenth-century botanical or ichthyological plate, but with true modern food colour. Fine graphite line under transparent watercolour, crisp detail, gentle modelling, soft neutral daylight from the upper left, a soft grey-brown contact shadow under each subject. Food colour is true: no golden or sepia cast on the food, no oversaturation, no glossy advertising sheen.

PAPER AND FRAME
Warm ivory paper, about #F4E9CD, with a very faint laid-paper texture and a slightly deeper ivory (about #F2DCB2) in the corners of each cell. A fine outer border of very dark forest green, about #141C13 to #1C271C, framed by thin antique-gold rules, about #A8905B. A small gold compass rose sits at the centre of the top border and of the bottom border. A small gold leaf-sprig ornament sits in each of the four corners. Inside, hairline gold rules divide the page into cells, with a tiny gold four-point star where the rules cross. Restrained ornament only: no scrollwork, no banners, no ribbons, no cartouches.

TWO FORMATS
1. Portrait plate, 1024 x 1536: six cells, two columns by three rows, one subject per cell, a single dark brown serif numeral (about #2B1A0C) centred under each subject: 1 2 on the top row, 3 4 in the middle, 5 6 at the bottom, read left to right.
2. Landscape folio, 1536 x 1024: the same paper and frame, holding one subject, or two cells side by side, or a short numbered sequence, as each prompt says.

LETTERING
No words, letters, labels, captions, titles, prices, signatures or watermarks inside the art. The only marks allowed are the dark brown serif numerals the prompt asks for. The app prints every name and fact beside the image in its own type.

PLATED FOOD
Dishes sit on plain round white china with no pattern, no coloured band and no maker's mark, seen from a three-quarter overhead angle of about 45 degrees unless the prompt says otherwise, the whole plate inside its cell with margin to spare. No cutlery, linen, glassware, table or background unless the prompt names it. Portions look like a fine restaurant's, neat and generous, never styled with tweezers, edible flowers or smears that the prompt did not ask for.

PEOPLE, BRANDS, CLAIMS
No people and no faces. Where a step needs hands, show only a cook's forearms and hands in plain white sleeves, cropped at the elbow, with no jewellery or tattoos. No brand names, logos, readable labels or trademarked bottle shapes: a plain unlabelled bottle or jar is fine. No health, diet or allergen symbols.

CONSISTENCY
Every subject in a plate is drawn at a consistent scale and angle so the cells compare at a glance. Keep generous ivory margin round each subject; nothing touches a rule or the frame. The image must still read on a phone screen 390 pixels wide: clear silhouettes, no fine detail that carries the lesson alone.

NEVER
Never add maps, anatomy diagrams, arrows, rulers, scales or text that the prompt did not ask for. Never change the frame, the paper colour or the numeral style between images. Never apply a gold, amber or sepia wash to the food. Never draw a cooked colour on something the prompt calls raw, or the reverse.
```

**The palette behind the guide** (for reference, not for pasting).

From the app's tokens (`src/lib/styles/tokens.css`) and colours sampled from the published plates:

| Role | Hex | Where |
|---|---|---|
| Plate paper | #F4E9CD (cell corners #F2DCB2) | sampled from the v2 plates |
| Plate frame | #141C13 to #1C271C | sampled border |
| Plate gold rule | #A8905B | sampled rule |
| Plate numeral | about #2B1A0C | sampled numeral |
| Night paper / raised | #081510 / #102119 | `--paper`, `--paper-raised` |
| Night ink | #F3E9D5 | `--ink` |
| Night brass | #D5B16C | `--turmeric`, `--accent-solid` |
| Night frame line | #76603B | `--line-strong` |
| Day paper / card | #F3EAD8 / #FFF8E9 | day `--paper`, `--card` |
| Day ink (forest) | #21382A | day `--ink` |
| Day gold | #856520 | day `--turmeric` |
| Day frame line | #AE915D | day `--line-strong` |
| Day leaf / chilli | #48633A / #943F3A | day `--leaf`, `--chili` |

The established families: (1) the v2 study plate, 1024 x 1536, which is the teaching art and the model for everything new; (2) the masthead, "the Explorer's Library", a painted candlelit loggia at dusk (`static/house/world-table-library-v1.webp`), which is decoration and is not extended for teaching; (3) the app icons, a flat geometric mark. The landscape folio in the guide is new: it extends the plate's paper, frame and numerals to a 1536 x 1024 sheet so that sequences and done-right-against-fault pairs fit a phone card.

### 2.2 The Bartender's Ledger

Two families: the candlelit card, which continues the painted masthead, for drink portraits; and the brass plate, which continues the engraved line drawings and the icon, for charts, tools and techniques.

```
STYLE GUIDE: THE BARTENDER'S LEDGER (paste once, then send prompts one at a time)

You are illustrating a bartending study app called The Bartender's Ledger, part of a hospitality training suite called Outside Of Time. Its world is "the explorer's cocktail library": a candlelit bar inside an old library, dark green baize, antique brass, leather, cut crystal, warm light. Every image you make is a TEACHING image. A bartender or a server must be able to look at it on a phone screen 390 pixels wide and learn something true: which glass, what colour, which garnish, how a tool is held, what a technique looks like. Never decorate for its own sake.

THE PALETTE (from the app's own colour tokens; keep to it):
- Deep felt green, the ground of the app: #081510, #102119, #14312a, #1d443a, #304333
- Antique brass, the line and frame colour: #d5b16c, #c9a44c
- Pale gold, highlights: #f1d89e, #e6cc8a
- Cream, the lightest tone: #f3e9d5, #f1e7d3; parchment #eee2c8
- Warm ink brown for deep shadow: #29271f
- Oxblood, used sparingly as an accent: #843d37, #a1453d
- Near black page: #050d09
The drink, the fruit and the garnish are always drawn in their TRUE colours, never tinted gold by the light. The palette governs the setting, the frame and the line, not the food.

THERE ARE TWO FAMILIES OF IMAGE. Each prompt names which one it wants.

FAMILY 1, THE CANDLELIT CARD (drink portraits). It continues the app's painted entrance: a richly detailed, realistic oil-painting look, an old-world bar at night lit by candles.
- One drink, the hero, centred, in its exact glass, standing on a dark polished wooden bar top that softly reflects it. Eye level just above the rim, so the surface of the drink, its foam or float and the garnish are all visible, and the whole glass including its foot or base is in frame with clear space around it.
- The glass fills about 60 percent of the frame height. Nothing overlaps it.
- Background: a dark library bar thrown well out of focus: shelves of bottles and leather books as soft warm bokeh, deep felt green and brown, a candle glow. Bottle labels are never readable. No window view, no sunset, no people, no hands unless the prompt asks.
- Light: a warm candle key light from the left, a soft cool rim light from behind that outlines the glass edge against the dark, gentle reflections on the bar top.
- The liquid is painted accurately: its true colour, its clarity or cloudiness, its bubbles, its foam line, its ice (or the absence of ice). Glass is clean and clear.
- Format: square, 1024 x 1024 pixels.

FAMILY 2, THE BRASS PLATE (diagrams, techniques, tools, charts). It continues the app's engraved line drawings and its icon:
- A fine copperplate engraving drawn in antique brass (#d5b16c) and pale gold (#f1d89e) lines on deep felt green (#102119 fading to #081510 at the edges), with a faint felt-cloth grain. Shading is done with fine hatching and cross-hatching, not airbrush.
- A thin double brass rule frame inset from the edge with softly rounded corners, and a small brass diamond centred in the bottom margin, exactly like the app's icon.
- Restrained 1920s art deco geometry. Clean, technically accurate, like a plate in an antique bartender's manual.
- Colour is used ONLY where colour is the lesson (a liquid's true colour, citrus skin, a cherry, mint), as a transparent watercolour wash inside the engraved lines. Everything else stays brass line on green.
- Hands, when shown, are drawn as engraved line too: anonymous, no rings, no faces.
- Format: portrait 1024 x 1536 for step sequences and numbered charts, square 1024 x 1024 for a single figure.

LETTERING: no words, letters or numbers inside any image, EXCEPT where a prompt asks for numerals on a numbered chart. Then use only the numerals the prompt lists, small, in brass classical serif capitals, placed beside each subject. The names are printed by the app, not by you. No captions, no titles, no signatures, no watermarks.

NEVER: real people or recognisable faces; brand logos, readable labels or trademarked bottle shapes (a plain generic bottle is fine); text; neon colours; a golden or sepia cast over the drink or the fruit; extra drinks or extra glasses beside the hero unless asked; props that could be mistaken for part of the drink; garnishes, straws, umbrellas or ice the prompt does not name; smoke, fire or sparkles unless the prompt names them; anything cartoonish, glossy 3D or stock-photo; modern bar clutter (phones, menus, POS screens).

If a prompt and this guide disagree, the prompt wins on facts (glass, colour, garnish), and this guide wins on look.
```

### 2.3 The Sommelier's Codex

The Codex's house rule is "typography, not pictures": an image is allowed only when it teaches, never as ornament. Three families: the library plate (service and sequences), the field atlas sheet (maps, matching the reviewed atlas exactly) and the parchment diagram (cross-sections, charts, specimens).

```
STYLE GUIDE: THE SOMMELIER'S CODEX (paste once, then send prompts one at a time)

You are illustrating a wine study app called The Sommelier's Codex, part of a hospitality training suite called Outside Of Time. Its world is "the illustrated wine library": a candlelit study inside an old stone villa, forest-green leather, warm gold, parchment, old atlases, and through a stone arch a vineyard landscape at golden hour. Every image you make is a TEACHING image. A server or a sommelier student must be able to look at it on a phone screen 390 pixels wide and learn something true: how a bottle is opened, where a village lies, what a glass looks like, what a fault looks like. Never decorate for its own sake. If a picture would only repeat what a sentence says, it is not wanted.

THE PALETTE (from the app's own colour tokens; keep to it):
- Forest green, the ground of the app: #081510, #102119, #142d21, #17382a, #1b2c1f
- Neighbour land and quiet panels on the maps: #263b2d, #48563a
- Sage ivory, the land of the country a map is about: #c5c1a2 fading to #9aa587
- Warm gold, the line and frame colour: #d5b16c, with pale gold #f1d89e and #ead19b
- Parchment and ivory: #f3e9d5, #f6ecd5, #e3d3b4
- Ink brown for text-dark shadow: #29271f, #64553d
- River teal on the maps: #285954
- Claret, used sparingly as an accent: #843d37, #6a302c
Wine, glass, cork, fruit and stone are always painted in their TRUE colours. A red wine is a true ruby or garnet, a white a true lemon or gold, never tinted by the gold of the frame. The palette governs the setting, the frame and the line, never the wine.

THERE ARE THREE FAMILIES OF IMAGE. Each prompt names which one it wants.

FAMILY 1, THE LIBRARY PLATE (service, objects, sequences). It continues the app's painted masthead: a richly detailed, realistic oil-painting look, warm candlelight, polished dark wood, crystal, brass, linen.
- The subject is shown plainly and accurately, as a master sommelier would demonstrate it, on a dark polished wooden table or a white linen tablecloth, against a calm deep forest-green background that falls into shadow. Behind it, at most, a hint of leather books thrown far out of focus. No window view, no sunset, no landscape, no clutter: the masthead already has those, and here the lesson must read at a glance.
- Light: a warm candle key light from the left, a soft cool rim light from behind that outlines glass and bottle edges against the dark.
- Hands, when shown, are a server's hands: clean, short nails, no rings, no watches, white shirt cuff and a black jacket sleeve at most. Never a face, never a whole person.
- Step sequences are laid out as a grid of equal panels, each panel framed by a thin gold hairline (#d5b16c), separated by a narrow forest-green gutter. Each panel shows one moment, from the same camera height, so the eye can follow the hands from panel to panel. A small ivory disc (#f3e9d5) with a dark green numeral (#17382a) sits in the top left corner of each panel, numbering the steps.

FAMILY 2, THE FIELD ATLAS SHEET (maps). It continues the app's reviewed atlas exactly:
- Ground: a deep forest-green page (#142d21 at the top left fading to #081510 at the bottom right), a fine double gold hairline frame inset from the edge with small engraved gold corner flourishes of curling vine tendrils, a subtle print grain.
- The map sits inside its own thin gold-ruled panel. North is up. Flat cartographic drawing, an equirectangular look with faint graticule lines (#263b2d). No relief, no hill shading, no 3D, no vineyard rows, no invented terrain, no trees, no buildings.
- The land the sheet is about is flat sage ivory (#c5c1a2 to #9aa587) with a thin gold coastline or border (#d5b16c). Neighbouring land is a darker green (#263b2d). Sea and lakes are the dark page green. Rivers are thin teal lines (#285954).
- Places are marked as the atlas marks them: a small ivory dot with a dark outline at the true position, a fine leader line, and a numbered disc (ivory #f3e9d5, gold ring, dark green numeral) placed a short way off so discs never overlap. Reference towns are a smaller hollow gold ring with no number.
- A small gold compass rose with N at the lower right of the map panel.
- Lettering inside the map is ONLY the numerals the prompt lists, plus the letter N on the compass. The study key, the title and the sources are printed by the app in its own type, outside the image.

FAMILY 3, THE PARCHMENT DIAGRAM (cross-sections, anatomy, charts). The scholarly page of the library:
- A fine engraved-and-watercolour scientific plate on warm parchment (#f3e9d5 to #e3d3b4) with a faint paper grain, line work in ink brown (#29271f), shading by fine hatching, true colours laid in as transparent watercolour washes only where colour is the lesson.
- A thin double gold hairline frame (#d5b16c) inset from the edge.
- Callouts are a fine ink leader line ending in a small numbered ivory disc with a gold ring and a dark green numeral, exactly as on the atlas.

FORMATS: deliver each image at the exact pixel size the prompt gives: landscape 1536 x 1024, portrait 1024 x 1536, or square 1024 x 1024. Webp.

LETTERING: no words or letters inside any image, EXCEPT the numerals a prompt lists for its callouts or steps, and EXCEPT the exact words a prompt gives for a labelled diagram, which must be spelled exactly as given and nothing more. The names are printed by the app. No captions, no titles, no signatures, no watermarks.

NEVER: real people or recognisable faces; brand logos, readable labels, crests or trademarked bottle shapes (a plain generic bottle with a blank or illegible cream label is fine); a recognisable branded device; text beyond what is asked; a golden or sepia cast over the wine; sunsets, sea views or Italianate landscapes inside a teaching plate; extra glasses, bottles or props the prompt does not name; smoke, flames or sparkles unless the prompt names them (a candle is named where it is needed); anything cartoonish, glossy 3D, stock-photo or modern-office; dangerous behaviour shown as fun.

If a prompt and this guide disagree, the prompt wins on facts (what is shown, where, in what order), and this guide wins on look.
```

## 3. The audit

Every current image in the three apps was opened and judged as a teacher: is it true, can it be read on a phone 390 pixels wide, does it teach or only decorate, does it match its app, and what does it weigh. The inline drawings were rendered in Chromium and looked at; the published apps were viewed at 390 px.

### 3.1 What exists today

| App | Image files | The teaching images among them | Verdict in one line |
|---|---|---|---|
| World Table (`/table/`) | 65 in `static/`: 20 v2 study plates and their 20 thumbnails, 20 archived posters, 1 masthead, 4 icon files; plus 1 unused starter favicon in `src/lib/assets/` | The 20 study plates (120 numbered specimens) | Beautiful and mostly true: 9 keep, 5 small notes, 6 need one or two panels redrawn (section 8). Nothing at all for 1,844 recipes, 112 techniques, 60 standards, 797 lexicon terms, 400 Floor Deck cards or the 62 Brennan's dishes. |
| Bartender's Ledger (`/ledger/`) | 6: 1 painted masthead, 1 SVG icon master, 4 PNG icons; plus inline SVG drawn by code: 8 technique plates, 11 glass icons, 4 ornaments | The 8 thin line technique plates and the 11 glass icons | The masthead is right; the plates are too thin to teach (three mislead) and the glass icons squeeze 95 glass names onto 11 shapes, several wrongly. No picture of any of 365 cocktails, the 32 Brennan's drinks, a garnish, a tool or a glass chart. |
| Sommelier's Codex (`/codex/`) | 42: 3 painted identity images, 17 reviewed atlas SVG sheets, 17 archived JPG posters, 5 icon files | The 17 atlas sheets | The atlas is true and is the standard for every new map, but each region is one dot at country scale. No image for service, Champagne, Coravin, decanting, bottle sizes, glasses, faults, labels or grapes. |

Across the three apps that is 113 image files, of which 56 teach: 20 food plates, 19 small line drawings and 17 maps. Not one shows a Brennan's dish, a Brennan's drink or a moment of wine service.

### 3.2 The main findings

- **The art is good and stays.** The study plates, the Ledger's painted entrance and the Codex's atlas and identity are ChatGPT's work, approved by the owner, and every new prompt here extends their look rather than replacing it.
- **Six World Table plates teach one wrong thing each,** caught by checking every panel against its written description: the sablefish drawn as a bass and the albacore without its long fins (Pacific), the lobster's two equal claws (Atlantic), a poblano where the Anaheim chile should be (Southwest vegetables), a sweet cherry for the tart one and Concord grapes that read as blueberries (Midwest fruits), a cherry-like cluster for the trailing cranberry (Northeast fruits), and a flat slab for rolled pancetta (Charcuterie). Section 8 repairs each with an edit prompt that leaves the rest of the plate untouched.
- **The plates' alt text wastes 120 written descriptions.** Every plate is described to a screen reader as "six illustrated subjects"; the data already holds a careful description of each specimen (section 11).
- **The Ledger's drawings are too thin to carry their lessons.** The Hawthorne gate shows no finger and no gate, the muddler is drawn with a spoon's head, the seal shows a floating box. Series S08 redraws all eight as brass plates.
- **The Ledger's glass icons mislead on Brennan's own drinks.** The Brennan's Irish Coffee, a stemmed glass, shows a handled mug; Nick & Nora shows a coupe; tiki mugs show a hurricane (a code fix, section 8; the full glass charts are B15, L03 and L04).
- **The Codex atlas is accurate but too far away.** Burgundy, Bordeaux, Champagne and Napa, the deep end of the Brennan's list, are single dots. Eleven zoom sheets (C01 to C11) give the villages, banks and rivers, each with coordinates and named sources to check against.
- **The 37 archived posters in World Table and the Codex hold known errors** (an invented Gulf map, garbled lettering, misplaced regions). They are kept only for rollback and must never be briefed from.
- **Two icon sets wear an old palette:** World Table's almanac gold on near-black, the Codex's claret. Both are colour changes in code, not new art.
- **The Brennan's pack has gaps that block drawing.** All 32 drinks have an empty glass field and 30 an empty garnish field, so every drink card is drawn in the classic way with a question for the bar; the dishes have no plating notes, so each plate is a fair reading of the menu line to be checked on the pass (section 11).

### 3.3 The biggest gaps, ranked by value to a new Brennan's server this month

1. **Recognising the Brennan's plates and naming every part:** the breakfast tasting, the egg dishes, the dinner entrées (B01, B02, B06, then series S03 for all 62 dishes).
2. **The Brennan's drinks at the service bar:** the glassware chart and the drink cards (B15 to B28, then S06 for the rest of the list).
3. **Wine service as Brennan's pours it:** the order round the table, opening still and sparkling, Coravin, decanting the 1946 Bordeaux (B29 to B35).
4. **The sauces and the tableside desserts:** the six sauces, Bananas Foster in six steps and the flambé cart set safely (B03 to B05).
5. **The house's large formats and glasses:** bottle sizes to the 15 L Nebuchadnezzar, the nine house wine glasses (B36 to B38).
6. **The vocabulary on every ticket:** garnish cuts, glassware, ice, tools, the coffee bar's milk drinks (L01 to L07).
7. **The regions the list is deepest in:** zoom maps of Burgundy, Bordeaux, Champagne, the Rhône and Napa, then the Loire, Piedmont, Tuscany, the Mosel, Rioja and the Douro (C01 to C11).
8. **Kitchen fundamentals guests ask about:** roux, hollandaise, doneness, searing, resting (B13, B14, T01, T03, T04).
9. **Reading the wine and the bottle:** fill level, heat damage, crystals and sediment, colour and rim, labels, shapes (B39 to B41, C12 to C16).
10. **The large sets, by template:** technique standards, lexicon specimens, recipe heroes, Floor Deck cards, the 365 Library cocktails, grape portraits (section 9).

### 3.4 World Table, image by image

#### The twenty v2 study plates (`static/plates/<slug>-v2.webp`, 1024 x 1536, quality 83; thumbnails `<slug>-v2.thumb.webp`, 360 x 540)

All twenty share the house look exactly: ivory paper, forest-green and gold frame, compass roses, corner sprigs, six numbered cells. At 390 px the plate shows at about 350 px wide, the numerals stay legible and each subject keeps a clear silhouette. They teach: each numeral matches a written subject with facts and a distinction. Weight is right (135 to 259 KB full, 19 to 34 KB thumbnails), loaded on demand. Panel-by-panel findings against each subject's written image description:

| Plate | Size (full / thumb) | Verdict | Finding and improvement |
|---|---|---|---|
| chicken-cuts | 153,918 / 20,946 B | Keep | Breast, thigh (skin-on and skinless), drumstick, wing with drumette, flat and tip, liver, split gizzard all match. |
| pork-cuts | 175,588 / 24,892 B | Note | Shapes right; the meat is painted a shade too beef-red for raw pork, and the loin's fat cap barely shows. Not worth a re-run alone. |
| beef-cuts | 241,688 / 33,038 B | Note | All six match (ribeye eye and cap, strip with fat edge, tapering tenderloin, two-lobed hanger). The meat surface has a pebbled, reptile-like texture that real muscle does not; fold into any future beef revision. |
| pacific-fish | 159,742 / 19,496 B | **Keep, fix** (F02) | Panel 4, sablefish, is drawn as a deep-bodied bass or bluefish with two close dorsal fins; sablefish is long, slim and slate-black with two widely separated dorsals. Panel 5, albacore, has pectoral fins of ordinary length; the guide's own key feature is "exceptionally long pectoral fins reaching far back along the body". Chinook, halibut (eyes on the upper side), cod with barbel and sardine are right. |
| atlantic-fish | 193,472 / 25,206 B | **Keep, fix** (F01) | Panel 6, lobster: the two claws are drawn the same size; the guide says "one heavy crusher claw and one finer-edged cutting claw" and the image brief "two visibly unequal large claws". Cod, haddock (dark lateral line, thumbprint), mackerel, black sea bass and scallop are right. |
| gulf-coast-fish | 172,034 / 25,676 B | Keep | Red snapper, red grouper, male mahi mahi, yellowfin with yellow finlets, uncooked white shrimp, blue crab with paddles all match. This is the plate most useful at Brennan's today. |
| northwest-vegetables | 243,690 / 31,088 B | Keep | All six match. |
| northwest-fruits | 239,042 / 30,728 B | Keep | The approved layout reference. All six match. |
| southwest-vegetables | 207,958 / 27,288 B | **Keep, fix** (F06) | Panel 1 is meant to be a "long smooth green Anaheim-style chile with a tapered point"; it is drawn as broad, glossy, wrinkled poblano-like pods. A guest-facing reader could learn the wrong pepper. |
| southwest-fruits | 258,990 / 33,906 B | Keep | All six match. |
| midwest-vegetables | 215,400 / 28,830 B | Note | Cabbage outer leaves are crinkled like a Savoy; the guide says a round green cabbage. Minor. |
| midwest-fruits | 230,390 / 31,448 B | **Keep, fix** (F04) | Panel 2, tart cherry, is a deep wine-red sweet cherry; the brief is "small bright red tart cherries". Panel 5, Concord grapes, are matt and speckled like the blueberries in panel 4, so the two read as one fruit. |
| northeastern-vegetables | 208,922 / 28,174 B | Keep | All six match. |
| northeastern-fruits | 203,890 / 28,144 B | **Keep, fix** (F05) | Panel 3, cranberry, hangs in a cherry-like cluster from a twig with broad leaves; the guide teaches "a small red berry produced by a low, trailing plant". The cut berry with its air chambers is right and should be kept. |
| southeastern-vegetables | 216,950 / 28,896 B | Note | Black-eyed pea pod is green and short where the brief says "long tan pod"; peas themselves are right. Minor. |
| southeastern-fruits | 234,462 / 31,224 B | Keep | All six match; the blueberry crowns are drawn as deep star-shaped holes on every plate that carries blueberries, a small exaggeration. |
| culinary-spices | 242,824 / 32,178 B | Keep | All six match. |
| culinary-mushrooms | 219,088 / 29,332 B | Note | Accurate (button and cremini rightly differ only in colour; maitake underside corrected). The cell rows are uneven and the numerals sit higher than on the other nineteen plates; fold into any future revision. |
| great-cheeses | 135,504 / 20,682 B | Keep | All six match, including the corrected interiors. |
| charcuterie | 233,754 / 31,814 B | **Keep, fix** (F03) | Panel 2, pancetta, is a flat slab with a peppered crust; the guide's image is "rolled pancetta with a cut spiral of pink meat and white fat". The summary allows either form, but the drawing must match the written image, and a spiral is the one form a server could not confuse with bacon. Prosciutto, guanciale, salame Milano, mortadella and bresaola are right. |

Two improvements that are not ChatGPT's, the plates' alt text and their file names, are in sections 11 and 8.3.

#### The twenty archived posters (`static/plates/archive/<slug>.webp`)

Sizes vary: 1536 x 1024 (atlantic-fish, beef-cuts, gulf-coast-fish, pacific-fish, pork-cuts), 1024 x 1536 (charcuterie, great-cheeses), 1312 x 1199 (chicken-cuts, culinary-spices and all ten produce posters), 1224 x 1285 (culinary-mushrooms); 285 to 432 KB each. Dark, lettering-heavy posters (gulf-coast-fish viewed: gold display type, an invented Gulf map, generic "cuts" chunks that do not correspond to real fish butchery, and a "Red Fish" drawn as a generic snapper). **Verdict: Keep as archive, never extend.** They hold the known errors the corrections record; they are behind "View the original poster" only and are not quiz sources. No new art should copy their look.

#### The masthead (`static/house/world-table-library-v1.webp`, 1536 x 1024, 394,832 B)

A painted Explorer's Library: candlelit shelves, a stone arch onto a lake at sunset, a plated fish with tomatoes and herbs, copper pan, compass and map. **Verdict: Keep.** It is the house identity, it is ChatGPT's and it is not undone. It decorates rather than teaches, which is right for a masthead. At 390 px the arch and dish crop well behind the title. **Code (optional):** it loads at high priority on every page; a 768 px wide encode for narrow screens would cut about two thirds of the bytes with no change to the picture.

#### Icons

| File | Size | Verdict |
|---|---|---|
| `static/icon-512.png` | 512 x 512, 3,842 B | **Code.** A flat "T" under a striped awning in the old almanac palette (#191612 ground, #C2A055 gold, #EAE2CE ink). The app's palette is now midnight green #081510, brass #D5B16C and parchment #F3E9D5. A recolour is a two-minute code change, not a ChatGPT job: keep the mark, swap the colours. |
| `static/icon-192.png` | 192 x 192, 725 B | **Code**, as above. |
| `static/icon-maskable-512.png` | 512 x 512, 3,122 B | **Code**, as above; keep the safe-zone padding. |
| `static/favicon.svg` | 420 B | **Code**, same old palette, same recolour. |
| `src/lib/assets/favicon.svg` | Svelte logo | **Code.** Unused starter file (nothing imports it); delete it. |

#### What has no picture at all

1,844 recipes; 112 techniques (27 of them with no film either, among them the two most used in the whole guide: "Sweating aromatics: soft, never browned", 198 dishes, and "Salted water & the float test", 188); 60 technique standards, each a set of marks for done right and one fault; 797 lexicon terms, of which the visual atlases alone are 113 vegetables, 81 fruits, 46 cheeses, 46 spices, 41 charcuterie, 41 knives and equipment, 40 herbs and chiles, 40 grains and pulses and 21 fungi; 400 Floor Deck cards in 14 sections; and the Brennan's house of 62 dishes, which has no image field in its schema.

Not an image, but found while reading for this brief: the World Table recipe `bananas-foster` says in its note that the dessert was made "for a customs official named Foster". The Brennan's pack, from the house's own account, names Richard Foster, Owen Brennan's friend and chairman of the New Orleans Crime Commission. The recipe note should be corrected through the source data so a server never tells the wrong story.

### 3.5 The Bartender's Ledger, image by image

#### Image files (6)

| Path | Size and weight | What it is | Verdict | Improvement |
|---|---|---|---|---|
| `img/explorers-library.webp` | 1536 x 1024, VP8 webp, 386,948 bytes | The painted masthead (ChatGPT's): an Old Fashioned in a cut-crystal rocks glass with a large cube and an orange peel, a jigger, a brass shaker, a leather book, a compass and a map on a polished bar, under a stone arch opening on a Mediterranean coast at sunset. `alt=""`, `aria-hidden`, behind a dark gradient. | Keep. It is the house look and every new card in Family 1 extends it. It is decorative by design (the entrance), and the drink in it is drawn correctly (rocks glass, large cube, peel, jigger beside it). At 390 px Home crops it to the glass (`object-position:51% 64%`) and it reads well; interior pages show only a dark band of it. | No new art. Encoding only: a 768 px wide `srcset` variant for phones would cut the first paint on every page by roughly two thirds. That is a code task, not a ChatGPT one. |
| `icons/icon.svg` | 512 viewBox, 1,570 bytes | App icon source: felt-green rounded square, double brass rule, a gold coupe with a cherry on a pick, a brass diamond pip. | Keep. The double rule and the pip are the frame Family 2 borrows. | None. |
| `icons/icon-512.png` | 512 x 512, 81,934 bytes | The icon rasterised. | Keep. Clean and legible. | None. |
| `icons/icon-maskable-512.png` | 512 x 512, 64,381 bytes | Maskable icon with safe padding. | Keep. The coupe sits inside the safe zone. | None. |
| `icons/icon-192.png` | 192 x 192, 24,581 bytes | Small icon. | Keep. | None. |
| `icons/apple-touch-icon.png` | 180 x 180, 22,837 bytes | Home-screen icon on iPhone. | Keep. The cherry still reads at this size. | None. |

#### Inline SVG drawings (code, `js/ui-new.js` and `index.html`)

The technique plates sit in More, under Notes, in a "Technique Plates · 8 figures" accordion; each is a 200 x 156 viewBox, single 1.4 px brass stroke, no fill, with its title and a long caption beneath. At 390 px a plate renders about 330 px wide and at most 170 px tall.

| Item | What it draws | Verdict | Improvement |
|---|---|---|---|
| Plate I, The Two-Tin Seal (line 443) | A tin with a dashed line, a parallelogram above it for the small tin, a small arc. | Weak. Without hands or the angle shown clearly, the small tin reads as a floating box; the strike and the angled seal (the whole lesson) are not visible. | Redraw as a Family 2 plate (series S08). |
| Plate II, The Hawthorne Gate (446) | A top view of a strainer: rings for the spring, a handle, two tabs. | Misleads by omission. The caption's lesson is the forefinger pushing the strainer forward to close the gate; no finger and no gate are drawn, and seen from above the spring is just circles. | Redraw from the side, on a tin, with the forefinger (S08). |
| Plate III, The Double Strain (449) | A tilted tin, a cone for the fine strainer, a coupe bowl. | Half there. No Hawthorne on the tin, so it does not show what makes it a double strain. | Redraw with both strainers and both hands (S08). |
| Plate IV, Expressing the Peel (452) | A thick curved bar, dotted spray, a coupe. | Readable, but the peel reads as a sausage; skin-side down, the height, and the snap are not shown. | Redraw with fingers pinching a wide peel skin-side down (S08). |
| Plate V, The Julep Dome (455) | A cup, a dashed dome of ice, a few circles, a straw. | Readable. The frost on the metal, the doneness signal in the caption, is missing, and the cup reads as a plain tumbler. | Redraw with the frosted tin and the mint bouquet (S08). |
| Plate VI, The Dry Shake (458) | A tin with a crossed-out ice cube and an oval, an arrow, a tin with cubes. | The best idea of the set (two stages, left to right). The oval for egg white is ambiguous. | Redraw as two clear stages (S08). |
| Plate VII, The Muddle Press (461) | A stick ending in an oval, a glass, two leaf curls, an arrow down. | Misleads: the muddler head is drawn as an oval, so it reads as a spoon; the quarter turn is not shown. | Redraw with a true flat-headed muddler and the turn (S08). |
| Plate VIII, The Float (464) | A spoon tipped against the inner wall, a band on the surface, dashed lines below. | The clearest of the eight. | Redraw for consistency only (S08). |
| Glass icons, 11 shapes (line 700) | 24 x 24 outline glyphs shown at 18 px beside every drink ticket, the Library row, the study card and the reference cards: coupe, martini, rocks, collins, flute, mug, hurricane, shot, wine, julep, tumbler. | The shapes are clean and on-brand, but 95 glass strings in the data collapse onto 11 by first match, and several land on the wrong shape: "Pre-heated Irish coffee glass" (the Brennan's Irish Coffee's classic glass) shows a handled mug; "Nick & Nora" and "Frozen Nick & Nora" show a coupe; "Tiki mug", "Pilsner or tiki" and "Footed mug, caramelized sugar rim" show a hurricane; "Metal swizzle cup", "Sugar-rimmed, whole lemon peel inside", "Clay cantarito", "Brûlot or demitasse cup", "Demitasse" and "Beer glass" fall through to a plain tumbler; the julep icon is a rocks glass with a line and does not read as a metal cup. | Code task, not ChatGPT: add about seven shapes in the same 24 px line style (Nick & Nora, Irish coffee glass, tiki mug, copper mug, punch cup, demitasse cup, pint) and reorder the matcher. The larger, named glass charts are entries B15, L03 and L04. |
| Ornaments: fan, rule, pip (line 694) and the masthead fan (`index.html` line 30) | Small brass dividers. | Decorative by design and right for that job. Weight is nil. | None. |
| Data charts (lines 1223 to 1255) | The progress ring and bar charts. | Data, not training images. Out of scope. | None. |
| Coffee film thumbnails (`js/ui-coffee.js` line 97) | YouTube's own `hqdefault.jpg`, fetched only online. | Not ours, not in scope. | None. |

#### What is imageless (the gaps)

- 365 cocktails in `js/data-core.js` (fields `glass`, `garnish`, `method`): no picture of any drink.
- The 32 Brennan's drinks in the pack: no picture, and almost no glass or garnish data (see section 11).
- 143 distinct garnish strings; the top eight (lemon twist 44, lime wheel 22, orange twist 20, lime wedge 18, grated nutmeg 13, brandied cherry 10, orange slice 8, lemon wheel 5) cover most of the canon.
- 19 reference glasses in `js/data-service.js` (domain `glassware`), each with capacity and use, shown as text with the 18 px icon.
- The bar tools: tins, mixing glass, jigger, barspoon, Hawthorne, julep and fine strainers, muddler, peeler, channel knife.
- Techniques with no figure: shake, stir, build and lift, swizzle, flame a peel, roll.
- The layered builds' density ladder (`js/ui-reference.js` `LAYER_LADDER`, 11 rungs) and the seven `LAYERED_BUILDS`.
- Ice types; espresso and milk drinks (`js/data-coffee.js` `COFFEE_REF`, 34 cards); spirit categories.

### 3.6 The Sommelier's Codex, image by image

#### The painted identity (3 files, all ChatGPT's, sanctioned by the owner)

| Path | Size | What it is | Verdict | Improvement |
|---|---|---|---|---|
| `assets/codex-library-v1.webp` | 1536 x 1024, 392 KB | The masthead: a candlelit study under a stone arch, red wine in a balloon glass, a white in a smaller glass, a ship's decanter, grapes, a leather atlas and a compass, a lake and vineyards at sunset beyond. Precached. | Keep. Decoration by the owner's explicit choice; it is not a teacher and does not pretend to be. On a 390 px phone it fills almost the whole first screen (about 460 css px tall) and the italic strapline "A journey through wine, place and the art of service" runs across the bright glass and decanter, where it is hard to read. | No new art. A code fix only: a darker scrim under the strapline, or crop the phone masthead to the upper two thirds so the tabs show on the first screen. Bottle labels are blank, correctly. |
| `assets/codex-atlas-room-v2.webp` | 1800 x 600, 256 KB (declared 1536 x 512 in the tag, same 3:1) | The Wine Atlas banner: a library, an open atlas with dividers and compass, a glass of red, candles, a villa town and lake at sunset. | Keep. Decorative header for the atlas room; the page text over it ("The Wine Atlas ... connect the landscape to the wine") is dimmed and reads well at 390. | None. |
| `assets/codex-atlas-vignette-v2.webp` | 700 x 149, 43 KB | The footer vignette: grapes, vine leaves, a brass compass and a strapped leather book on transparency. Also embedded as a data URI in each of the 17 atlas SVGs. | Keep. Ornament, outside the geographic field, as maps/README says. | None. The base64 copy adds about 58 KB to each sheet; acceptable. |

#### The reviewed atlas (17 SVG sheets, `maps/atlas-v2/`, generated by `.scripts/atlas-v2/build.cjs`)

Important for anyone briefing new maps: these sheets are **not painted**. Their geometry is Natural Earth (public domain, pinned revision) drawn by a deterministic script; only the vignette and the look are ChatGPT's. Their accuracy is the standard every new map in sections 4 and 7 must meet.

| Sheet | Size | Points | Verdict | Improvement |
|---|---|---|---|---|
| `france.svg` | 1200 x 1500, 245 KB | 9 headings, 12 dots (Loire, Rhône and Languedoc-Roussillon split) | True and clean. At country scale Burgundy is one dot at 47.05 N, 4.85 E and Bordeaux one dot at the Gironde: nothing a server needs for the Brennan's list (Burgundy and Champagne are its deep end) can be found on it. | The zoom sheets C01 to C04 and C06. |
| `italy.svg` | 277 KB | 12 regions plus Etna | True. Piedmont and Tuscany are single dots. | C07, C08. |
| `spain.svg` | 154 KB | 11 | True. Rioja one dot. | C10. |
| `portugal.svg` | 127 KB | 9, Madeira inset | True. Douro one dot; Madeira inset is honest and separately scaled. | C11; Madeira in S10. |
| `germany.svg` | 250 KB | 9 | True. The Mosel is one dot at 49.92 N, 6.95 E, so the bends that explain the slopes (and the Wehlener Sonnenuhr on the list) are invisible. | C09. |
| `austria.svg` | 212 KB | 5 headings, Wachau, Kamptal, Kremstal grouped | True. | None this month. |
| `california.svg` | 391 KB | 2 numbered headings, 12 lettered references | True, but the numbers 1 (Napa and Sonoma share one number) and a to e crowd the North Coast at phone size. | C05 Napa Valley zoom. |
| `oregon.svg`, `washington.svg`, `new-york.svg` | 444 KB, 498 KB, 488 KB | 1 or 2 numbered, several lettered | True. Heaviest files in the atlas. | None this month; Willamette in S10. |
| `argentina.svg`, `chile.svg`, `south-africa.svg` | 256 KB, 338 KB, 134 KB | 5, 6, 8 with country-context inset | True; the gold window in the inset is a good teaching device. | None. |
| `australia.svg`, `new-zealand.svg` | 162 KB, 121 KB | 9, 7 | True. | None. |
| `hungary.svg`, `greece.svg` | 216 KB, 222 KB | 9, 10 | True. | None. |

Phone legibility, all seventeen: in the card on a 390 px screen the in-sheet study key is set at roughly 5 to 6 css px and the numerals at about 6 px; they cannot be read without "Enlarge map". The page below the sheet repeats the key in full-size type, so nothing is lost, but this is the reason every new map below carries **numerals only** and leaves the key to the app's own type.

On first visit with no saved maps the room shows "Artwork needs a connection" beside each card until the sheet loads; that is the designed on-demand cache, not a fault.

#### The archived posters (17 JPG, `maps/*.jpg`, 1024 x 1536, 357 to 488 KB each, 6.7 MB in all)

`argentina.jpg` to `washington.jpg`: ChatGPT posters in the old style (parchment map, coloured region blobs, a painted bottle, glass and book in the margin, a dense lettered key). Verdict: **retire for good; never brief from them.** They are generated, not geographic: regions are invented shapes, the lettering is small and partly garbled, and maps/README records known errors that the reviewed atlas corrected (Goose Gap belongs in Washington, Etna is on Sicily, Riverland and Mudgee are separate South Australian and New South Wales places, Nelson is on the northern South Island). They are kept only for rollback and are not shown. Improvement: none; consider deleting them from the published copy to save 6.7 MB of origin weight (a code task, not art).

#### Icons (4 PNG plus the SVG master, `icons/`)

| Path | Size | Verdict |
|---|---|---|
| `icons/icon.svg` (master), `icon-512.png` (83 KB), `icon-192.png` (25 KB), `apple-touch-icon.png` (180, 23 KB), `icon-maskable-512.png` (65 KB) | as named | A gold-stemmed wine glass with a claret bowl, a four-point star and small corner fleurons, on a near-black claret ground (#130709, the pre-house palette). Clear at every size. It belongs to the Codex's earlier claret-and-gold identity rather than the forest-green house that every screen now wears. Improvement: recolour the ground to the house green (#081510 to #102119) and the frame to #d5b16c in `icon.svg`, then regenerate the PNGs with resvg as CLAUDE.md describes. That is a code job; no ChatGPT art is needed, and the star and fleurons should arguably go too under the typography rule. |

#### Inline drawings

`INTRO_ATLAS` in `js/data-intro.js` still carries twelve hand-drawn outline paths from the old Compendium maps, but the Compendium's Wine Atlas now opens the reviewed atlas room, so they are no longer drawn. No other inline pictorial SVG is rendered: the typography rule removed every icon, flag and fleuron in Codex IX.

## 4. Brennan's first

Forty-one entries for the house the owner works in: the dishes in World Table art, the drinks in Ledger art, the wines and service in Codex art. Each subsection names the style guide to paste; each entry repeats it in its first line. Every fact is quoted from the Brennan's house pack (`static/shared/packs/brennans-new-orleans.v1.oothouse.json`, menus read 3 October 2026: 62 dishes, 32 drinks, 271 wines, the terms and the service notes) or from the apps' own data.

### 4.1 The dishes (World Table art)

Paste the World Table style guide (2.1) first. A note on house plating: the pack prints every dish's components but not how the kitchen arranges them on the plate. Where a prompt has to choose an arrangement, it says so, and the result must be held against the dish as it leaves the pass (a phone photo from the line is enough) before it goes in the app. "Where" names the screen in the published app at `/table/`.

#### B01. The Traditional Breakfast, course by course

> World Table art. Paste the World Table style guide first. Deliver as `brennans-traditional-breakfast-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu (`/table/menu.html`), the Tasting menus section, as the header image of the Traditional Breakfast; each numbered cell also serves as the recognition face of that dish's flash card ("which course is this?").
- **Must teach:** the order and look of the $80 tasting. The pack: "Brandy Milk Punch eye opener → baked apple → turtle soup or seafood gumbo with a Bloody Bull → Eggs Hussarde with Charles Lafitte Brut (4 oz) → petite filet with Châteaumar Côtes du Rhône (4 oz) → Bananas Foster tableside". The drinks belong to the Bartender's Ledger and the Codex and are left out here. Components as printed: Baked Apple "Oatmeal-pecan-raisin crumble, brown sugar glaze, sweetened crème fraîche" ("A whole apple, peeled and cored, baked until soft under a crumble"); Turtle Soup "100% turtle meat, brown butter spinach, grated egg, aged Sherry"; Seafood Gumbo "Shrimp, crab, oysters, andouille, popcorn rice"; Eggs Hussarde "Housemade English muffins, coffee-cured Canadian bacon, hollandaise, poached eggs, marchand de vin sauce"; Petite Filet Mignon "Potato rösti, garlic spinach"; Bananas Foster "bananas, butter, brown sugar, cinnamon, rum, housemade vanilla ice cream". "Tasting portions of each course."

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), a small gold compass rose at the top and bottom centre, a gold leaf sprig in each corner, six equal cells (two columns, three rows) divided by hairline gold rules with tiny gold four-point stars at the crossings, one dark brown serif numeral centred under each cell's subject. Lifelike natural-history watercolour over fine graphite, true food colour, soft daylight from the upper left, soft contact shadows. Each dish is a tasting portion on plain round white china with no pattern, seen from about 45 degrees above, whole plate visible, no cutlery, no linen, no glassware.

1. A baked apple: one whole apple, peeled and cored, baked soft so it slumps slightly, crowned with a rough golden crumble of rolled oats, pecan pieces and plump raisins, glossed with a dark amber brown-sugar glaze running down its sides; a neat spoonful of sweetened crème fraîche, white and softly whipped, beside it on a small white plate.
2. Turtle soup in a plain white soup bowl: a thick, glossy, deep chestnut-brown soup with very finely chopped meat through it, topped with a small heap of finely grated hard-cooked egg (white and pale yellow crumbs) and a little dark green wilted spinach.
3. Seafood gumbo in a plain white soup bowl: a dark brown roux-based broth holding whole pink cooked shrimp, white lumps of crab meat, plump grey-beige poached oysters with frilled edges, and coin-shaped slices of coarse, dark-skinned smoked andouille sausage, around a small mound of long-grain white rice.
4. Eggs Hussarde: two toasted English muffin halves side by side, each topped with a round slice of Canadian bacon, a spoon of dark glossy red-wine sauce, a soft poached egg and a coat of pale yellow, glossy hollandaise.
5. A petite filet mignon: a small, thick, round beef medallion with a deep brown seared crust, beside a crisp golden potato rösti of fine shreds and a small heap of dark green garlic spinach.
6. Bananas Foster plated: a scoop of vanilla ice cream, white with fine black vanilla specks, with soft caramelised banana pieces spooned over it and a glossy deep amber butter-rum caramel poured on top, pooling at the base.

The six numerals 1 to 6 are the only marks in the image: no words, labels, logos or text of any kind. Keep every subject at a consistent scale, with ivory margin all round.
```

- **Avoid:** any glass, bottle or drink in the cells (the drinks live in the other wings); a red cooked-lobster colour on the gumbo shrimp that turns them orange; the Hussarde sauce order is the house's long-published build (bacon, marchand de vin, egg, hollandaise) and the pack does not print it, so confirm against the pass; no Sherry jug beside the soup, since the pack does not say how the Sherry is served.

#### B02. Brennan's breakfast and lunch entrées: tell them apart

> World Table art. Paste the World Table style guide first. Deliver as `brennans-breakfast-entrees-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, Entrées section header (Breakfast & lunch filter); each cell as a flash card face.
- **Must teach:** the six plates guests mix up. The pack's mix-ups: "Eggs Hussarde is the classic: housemade English muffin, coffee-cured Canadian bacon, poached eggs, hollandaise and marchand de vin. Eggs Owen is heartier: red wine-braised short rib débris, Creole-spiced potato and a soft-boiled egg with the same two sauces"; "The Sardou has no meat on the menu line: crispy artichokes and Parmesan creamed spinach under Choron"; "The breakfast/lunch hanger ($38) is Creekstone Prime with smoked potato pavé, a sunny-side-up egg and béarnaise, steak and eggs." Shrimp & Grits: "Louisiana shrimp, fried pimento cheese grit cake, tasso, Creole sauce, fried okra chips". Duck Confit Waffle: "Rohan duck leg, cornbread & chive waffle, foie gras butter, mustard maple syrup, sunny-side-up egg". Choron is "a béarnaise with tomato".

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses at the top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows divided by hairline gold rules with tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true food colour, soft daylight from the upper left. Each dish on a plain round white plate with no pattern, seen from about 45 degrees above, whole plate visible, no cutlery or linen. All six plates drawn at the same scale.

1. Eggs Hussarde: two toasted English muffin halves, each with a round slice of Canadian bacon, a spoon of dark glossy red-wine and mushroom sauce, a soft poached egg, and pale yellow glossy hollandaise over the egg.
2. Eggs Sardou: a bed of pale green creamed spinach with flecks of grated Parmesan, golden crisp fried artichoke pieces, two soft poached eggs, and a smooth salmon-coral sauce (a tarragon butter sauce tinted with tomato, with tiny green herb flecks) over the eggs. No meat anywhere on the plate.
3. Eggs Owen: a mound of dark, glossy, shredded red-wine-braised beef short rib, a golden roasted potato portion dusted with red-brown Creole spice, a peeled soft-boiled egg halved to show a jammy orange yolk, pale yellow hollandaise and a pool of dark glossy red-wine sauce.
4. Steak and eggs: slices of hanger steak with a dark seared crust and a pink centre, a neat rectangle of layered potato pavé with a golden top, a sunny-side-up egg with an unbroken yolk, and a spoonful of thick pale yellow béarnaise on the plate, flecked with green tarragon.
5. Shrimp and grits: a round fried grit cake with a golden crust, Louisiana shrimp in a brick-red Creole tomato sauce with small cubes of dark red smoked tasso, and a few thin, crisp fried okra chips on top.
6. A duck confit waffle: a square golden cornbread waffle flecked with green chive, a confit duck leg with crisp bronze skin and the leg bone showing, a sunny-side-up egg, a small pat of pale pink-beige butter, and amber syrup drizzled over.

The six numerals are the only marks: no words, labels, logos or text. Generous ivory margin round every plate.
```

- **Avoid:** making panels 1 and 3 look alike: the Hussarde is muffins and round bacon, the Owen is shredded beef and a halved soft-boiled egg; meat of any kind in panel 2; a ramekin in panel 4 (how the béarnaise is served is not printed, so it sits on the plate); every arrangement here is a fair reading of the menu line, not the house's plating, so check against the pass.

#### B03. The six sauces on the Brennan's menu

> World Table art. Paste the World Table style guide first. Deliver as `brennans-sauces-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, under the house lexicon's sauce terms (Hollandaise, Béarnaise, Choron, Foyot, Marchand de vin, Beurre blanc), and on the Library's sauces Floor Deck cards.
- **Must teach:** the six sauces by colour and body. Pack lexicon: "Hollandaise is the buttery, lemony egg-yolk sauce"; "Béarnaise is a rich butter sauce with tarragon"; "Choron is a béarnaise with tomato, tangy and herbal"; "Sauce Foyot is béarnaise made even richer with a reduced beef glaze"; "Marchand de vin is a savory red wine and mushroom sauce"; "Beurre blanc is a silky white wine and butter sauce". Floor Deck: hollandaise "thick and pale"; béarnaise "a reduction of vinegar, shallot, tarragon and pepper"; beurre blanc "eats creamy rather than oily". Recipes: hollandaise "should hold soft peaks and pour reluctantly"; béarnaise "holds the shape a spoon cuts into it", chopped tarragon and chervil folded in at the end. Where each appears: hollandaise (Hussarde, Owen), Choron (Sardou), béarnaise (breakfast hanger), Foyot (Chateaubriand), marchand de vin (Hussarde, Owen), beurre blanc (Redfish Véronique).

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left.

Every cell shows the same thing so the sauces compare: one identical small, plain, round white saucer, seen from about 45 degrees above, holding a generous pool of sauce with a plain silver spoon resting in it, its bowl lifted slightly to show how the sauce coats it. Same saucer, same spoon, same light, same scale in all six.

1. Hollandaise: smooth, opaque, pale butter-yellow, glossy, thick enough to hold soft peaks, no herbs.
2. Béarnaise: a slightly deeper yellow than hollandaise and a little thicker, holding the line a spoon cuts, flecked all through with finely chopped green tarragon and chervil and a few tiny translucent shallot bits.
3. Choron: the béarnaise of panel 2 tinted a soft salmon-coral by tomato, still flecked with green tarragon.
4. Foyot: the béarnaise of panel 2 darkened to a light caramel-tan by reduced beef glaze, glossy, still flecked with green tarragon.
5. Marchand de vin: a dark, glossy, translucent red-brown sauce with a deep wine colour at the edges, holding finely chopped mushroom and shallot, thinner than the butter sauces and pooling flat.
6. Beurre blanc: ivory to pale cream, glossy and opaque, noticeably more fluid than hollandaise, spreading wider in the saucer, no herbs, no flecks.

The six numerals are the only marks: no words, labels, logos or text anywhere.
```

- **Avoid:** a separated or oily sheen on any butter sauce (they must look stable); brown gravy for panel 5 (it is a wine sauce, red-brown and translucent); colouring Foyot orange (that is Choron); the Redfish Véronique's beurre blanc is "preserved lemon beurre blanc" and may carry visible lemon, which the pack does not describe, so panel 6 shows the classic sauce.

#### B04. Bananas Foster at the table, in six steps

> World Table art. Paste the World Table style guide first. Deliver as `brennans-bananas-foster-tableside-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, Desserts, on the World Famous Bananas Foster study card, above the tableside safety note; also in the Library on the Flambé technique.
- **Must teach:** the order and the safety. Pack: "Butter, brown sugar and cinnamon melt into a caramel… then banana liqueur, and the bananas go in to soften. Now the rum ... and there's the flame. ... We spoon the bananas over our vanilla ice cream, then the warm sauce." Safety, from the service note: "(3) Measure the rum into a small vessel first, never pour from the bottle near a flame. (4) Pull the pan off the flame to add rum, then tilt the far edge toward the flame to ignite, away from you and the guests. (5) Never add alcohol to a lit pan. ... (7) Let the flame burn out before plating; turn the burner off before you leave the cart." The menu prints rum; whether the cart adds banana liqueur is an open lineup question ("Does the cart build for Bananas Foster use banana liqueur as well as rum ... Which rum?"), so the sequence shows only a measured spirit. The World Table recipe: "4 bananas, halved lengthwise", "1 min per side".

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows divided by hairline gold rules with tiny gold stars at the crossings, a dark brown serif numeral centred under each cell. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left.

A six-step sequence of the same scene, read 1 to 6: a round, shallow, polished copper flambé pan with a long handle on a small single-burner tableside stove, seen from the side at a low three-quarter angle. Only a cook's hands and forearms in plain white sleeves appear, cropped at the elbow; no faces, no guests, no people beyond the hands. The pan, stove and angle stay identical in every cell.

1. Butter and dark brown sugar melting together in the pan over a small blue flame into a bubbling, glossy amber caramel, a light dusting of ground cinnamon on the surface.
2. Banana halves, cut lengthwise, lying flat in the bubbling caramel, softening and turning golden at the edges, a spoon basting them.
3. The pan pulled away from the burner and held off the flame, while the other hand pours dark rum from a small plain metal measuring cup, not from a bottle, into the pan. The burner flame is visibly separate from the pan.
4. The pan back over the burner with its far edge tipped down toward the flame, and a tall, soft blue and orange flame rising from the pan, leaning away from the cook, the near edge of the pan raised toward the cook.
5. The flame gone, the caramel darker and glossier around the bananas, and the burner knob turned off with no flame under the pan.
6. On a plain white plate beside the cart: a scoop of vanilla ice cream with fine black vanilla specks, the banana pieces laid over it and the deep amber butter-rum sauce spooned on top.

The six numerals are the only marks: no words, labels, logos, bottle labels or text.
```

- **Avoid:** a bottle anywhere near the flame (a plain closed bottle may stand on a lower shelf, never in hand); flames leaning toward the viewer or the cook; anything hanging above the pan; a guest or a face; a cinnamon "sparkle" thrown into the flame (an open lineup question in the pack); any labelled bottle.

#### B05. The flambé cart, set safely

> World Table art. Paste the World Table style guide first. Deliver as `brennans-flambe-cart-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, Desserts, on both the Bananas Foster and Cherries Jubilee study cards, beside the numbered safety steps.
- **Must teach:** the pack's numbered safety steps as one picture. "(1) Set the cart where nothing hangs overhead and away from drapes, décor and air vents; clear menus, napkins and paper from it. (2) Guests seated and back from the cart; no one leaning in ... (3) Measure the rum into a small vessel first ... (6) Keep a lid or cover within reach to smother, and know where the extinguisher is."

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses at the top and bottom centre, gold leaf sprigs in the corners. One scene fills the sheet with generous ivory margin, drawn as a lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left, the background left as plain ivory paper (no room, no walls, no ceiling, no décor).

The scene, seen from a high three-quarter angle: a plain wooden restaurant service cart on wheels, with a polished copper flambé pan on a small single-burner tableside stove on its top. Beside the cart, at a clear distance of about an arm and a half, the edge of a round dining table with a white cloth and two empty chairs pulled in to the table. No people.

Six small dark brown serif numerals sit on the ivory beside the objects they mark, each with a short fine graphite leader line:
1. the pan on its burner, with nothing at all above it, the space over the cart empty;
2. a small plain metal measuring cup of dark rum beside the pan;
3. a plain unlabelled closed bottle standing on the cart's lower shelf, well away from the burner;
4. a round metal lid lying on the cart top within reach of the pan;
5. the bare cart top, with no menus, napkins or paper on it;
6. the gap between the cart and the table with its empty chairs.

The six numerals and their leader lines are the only marks: no words, labels, logos or text.
```

- **Avoid:** a fire extinguisher (the pack says "know where" it is, not that it sits on the cart); people; drapes or lamps in the picture; any label on the bottle.

#### B06. Brennan's dinner entrées: tell them apart

> World Table art. Paste the World Table style guide first. Deliver as `brennans-dinner-entrees-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, Entrées section header (Dinner filter), and as flash card faces.
- **Must teach:** Redfish Véronique "Hibiscus-pickled grapes, braised leeks, fingerling potatoes, preserved lemon beurre blanc"; Roasted Chateaubriand "Creekstone Farms beef tenderloin, roasted & glazed summer squash, sauce Foyot, serves two" ("the thick center cut", "roasted whole"); Gulf Fish en Papillote "Banana leaf-wrapped Gulf fish, Louisiana crab, sorghum, Marcona almonds, Castelvetrano olives, tomato"; Creole Hanger Steak "Creekstone Farms hanger steak, housemade Creole spice, Madeira-glazed broccolini, pepita persillade, chili crisp" (the dinner hanger, "spicier, with no egg"); Roasted Rohan Duck Breast "Cane syrup-glazed peaches, candied hazelnuts" ("rich, rosy duck"); Poussin à la Moutarde "Sweet tea-brined and fried Cornish hen, turnips & shallots, mustard cream sauce" ("Whole small bird").

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true food colour, soft daylight from the upper left. Each dish on plain round white china with no pattern, seen from about 45 degrees above, whole plate visible, no cutlery or linen, all at one scale.

1. Redfish Véronique: a fillet of mild white Gulf redfish with a lightly golden seared top, over soft pale green braised leeks and halved fingerling potatoes, scattered with halved grapes stained a deep ruby-magenta by a hibiscus pickle, and a glossy ivory butter sauce spooned round.
2. Chateaubriand for two: on a plain white oval platter, a thick centre-cut beef tenderloin roast with a deep brown crust, partly carved into thick slices that show an even rosy pink interior, beside lengths of glazed, golden-edged yellow and green summer squash and a small plain white sauceboat of glossy caramel-tan sauce flecked with green tarragon.
3. Gulf fish en papillote: a banana-leaf parcel folded open on the plate, the glossy green leaf edges curling back to show a moist white fish fillet topped with white lumps of crab, bright green Castelvetrano olives, red tomato pieces, pale rounded Marcona almonds and a scattering of small round cream-coloured sorghum grains.
4. Creole hanger steak: slices of hanger steak with a dark red-brown spice crust and a pink centre, beside glossy Madeira-glazed broccolini, with a spoon of coarse green pumpkin-seed and herb persillade and a few drops of red chilli crisp with dark crisp flakes. No egg.
5. Roasted duck breast: a duck breast sliced to show a rosy pink centre under a crisp bronze skin, with glossy amber cane-syrup-glazed peach halves and a few candied hazelnuts with a clear sugar shell.
6. Poussin à la moutarde: a whole small Cornish hen with a crisp, golden-brown fried crust, beside glazed turnips and soft whole shallots, with a pale yellow mustard cream sauce speckled with mustard grains pooled beside it.

The six numerals are the only marks: no words, labels, logos or text.
```

- **Avoid:** an egg on panel 4 (that is the breakfast hanger); a paper parcel in panel 3 (the house wraps in banana leaf); grey duck or grey beef (the pack serves both rosy); mustard grains in panel 6 are a reasonable reading of "mustard cream sauce" but not printed, so drop them if the pass shows a smooth sauce. Whether the Chateaubriand is carved at the table and whether the papillote is opened at the table are open lineup questions, so neither cell shows a guest or a table.

#### B07. Eggs Hussarde, built up

> World Table art. Paste the World Table style guide first. Deliver as `brennans-eggs-hussarde-build-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, Eggs Hussarde study card, at the top, so a server can describe the dish layer by layer ("two sauces").
- **Must teach:** "Housemade English muffins, coffee-cured Canadian bacon, hollandaise, poached eggs, marchand de vin sauce"; "Eggs Hussarde is New Orleans' answer to Eggs Benedict, with a red wine sauce as well as hollandaise"; "marchand de vin, 'wine merchant's sauce,' a savory red wine and mushroom sauce, and hollandaise, the buttery, lemony one".

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners. Lifelike natural-history watercolour over fine graphite, true food colour, soft daylight from the upper left, plain ivory background.

Left half: one finished Eggs Hussarde half on a plain round white plate, seen from about 45 degrees above: a toasted English muffin half, a round slice of Canadian bacon, a spoon of dark glossy red-wine and mushroom sauce, a soft poached egg, and pale yellow glossy hollandaise coating the egg.

Right half: the same five layers drawn as an exploded vertical stack floating one above the other with a little ivory space between, seen from the side, bottom to top: (1) the toasted English muffin half, craggy cut face up; (2) the round slice of pink Canadian bacon with a darker roasted edge; (3) a flat disc of dark glossy red-brown wine sauce with finely chopped mushroom; (4) the poached egg, smooth white, with a hint of soft yolk; (5) a cap of pale yellow hollandaise. Small dark brown serif numerals 1 to 5 sit to the right of each layer with short fine graphite leader lines.

The numerals and leader lines are the only marks: no words, labels or text.
```

- **Avoid:** an English-muffin cut face on top; ham in place of round Canadian bacon; the order of layers 2 to 5 is the house's long-published build and the pack does not print it, so confirm it on the pass before publishing.

#### B08. The poached egg: done right, and the fault

> World Table art. Paste the World Table style guide first. Deliver as `poached-egg-standard-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in WorldTable `static/standards/` (published at /table/).

- **File:** `poached-egg-standard-v1.webp`, 1536 x 1024, landscape folio (pair).
- **Where:** Library, Techniques, "Poaching eggs" (`/table/technique/poaching-eggs`), and linked from the Hussarde and Sardou study cards in My Menu.
- **Must teach:** the lexicon: "POACH: 71 to 82°C, water barely shivering: eggs ... anything delicate that violent bubbles would shred"; the film note: "The straining step that removes the loose outer white before the egg ever touches water, then the surface of the pot: it shivers rather than bubbles". Floor Deck hollandaise note: "The yolks are only gently warmed, never set firm."

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, the sheet divided into two equal cells by a hairline gold rule with a tiny gold star at each end. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. A dark brown serif numeral centred under each cell: 1 on the left, 2 on the right.

1. Done right: above, a small pan of water whose surface only shivers, with no bubbles breaking, and a neat egg holding together in it; below, on a plain white saucer, the drained poached egg: a compact, smooth, oval white wrapped closely round the yolk, no ragged edges, and beside it a second egg cut open so the yolk runs, deep orange and liquid.
2. The fault: above, the same pan at a hard rolling boil with large bubbles; below, on the same saucer, a flattened egg trailing ragged, feathery wisps of white, and beside it one cut open showing a firm, pale, set yolk.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** vinegar bottles or labels; a perfect sphere (a real poached egg is a soft oval); a cooked-through yolk in panel 1.

#### B09. Chateaubriand for two, with sauce Foyot

> World Table art. Paste the World Table style guide first. Deliver as `brennans-chateaubriand-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, Roasted Chateaubriand study card, top; also on the Floor Deck card "Chateaubriand" in the Library.
- **Must teach:** "Chateaubriand is the thick center cut of the beef tenderloin, roasted for two"; lexicon: "The tapered tail becomes tips, the center-cut châteaubriand, the crosscuts filet mignon"; "sauce Foyot, béarnaise enriched with meat glaze"; sides "roasted and glazed summer squash"; "Ask temperature once for the table."

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two cells side by side divided by a hairline gold rule, a dark brown serif numeral under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left.

1. Where the cut comes from: a whole raw beef tenderloin lying on the ivory paper, long and tapering, broad at the head end and narrowing to a thin tail, deep red with fine grain and very little fat. The thick, even centre section is shown separated from the head and the tail by two thin clean cuts with a little ivory space between the three pieces, so the centre cut stands out as the thickest, most even part.
2. The dish: that centre cut roasted whole, a deep brown crust all round, on a plain white oval platter, three thick slices carved from one end and laid overlapping to show an even rosy medium-rare interior edge to edge with a thin brown crust, beside lengths of glazed golden-edged summer squash, and a small plain white sauceboat of glossy caramel-tan sauce flecked with green tarragon.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** a grey band under the crust (the standard for searing says "a thick grey collar under the crust means the heat was too low"); a red, raw centre; a carving knife or fork in a guest's hand. The table chooses the temperature; medium-rare is drawn because it is the one most ordered, and the app's text says so.

#### B10. Gulf Fish en Papillote, closed and opened

> World Table art. Paste the World Table style guide first. Deliver as `brennans-gulf-fish-papillote-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, Gulf Fish en Papillote study card, top.
- **Must teach:** "En papillote means in paper; here we use a banana leaf instead, so the fish steams in its own juices and stays moist"; inside: "Louisiana crab adds sweetness, tomato and Castelvetrano olives, bright green, mild and buttery ... Marcona almonds and sorghum, a chewy ancient grain". Lineup question: "Ask at lineup whether it's opened at the table, if so, warn guests about the steam."

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two cells side by side divided by a hairline gold rule, a dark brown serif numeral under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. Each on a plain round white plate seen from about 45 degrees above.

1. Closed: a neat, flat rectangular parcel of glossy green banana leaf, folded over on itself with the fine parallel veins of the leaf clearly visible, the edges slightly browned from the oven, sealed and plump.
2. Opened: the same parcel with its leaf folded back, a little steam rising, showing a moist white Gulf fish fillet, white lumps of crab meat on top, bright green Castelvetrano olives, small pieces of red tomato in their juice, pale cream rounded Marcona almonds and a scattering of small round cream-coloured sorghum grains.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** parchment paper or foil; string or toothpicks (how it is closed is not printed); black olives; whole almonds in brown skins (Marcona almonds are skinless and rounded).

#### B11. The Louisiana seafood behind the menu

> World Table art. Paste the World Table style guide first. Deliver as `brennans-louisiana-seafood-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/house/brennans/` (published at /table/).

- **Where:** My Menu, at the head of the house's seafood dishes; also on the Plates wall under "The fish case" as a companion to the Gulf Coast plate.
- **Must teach:** the seafood the menu names: redfish (Redfish Véronique; "Redfish is a firm, mild Gulf fish"); oysters (Grand Isle Jewel Oysters "Served raw"; lexicon: Eastern oysters have "tear-drop shells"); Louisiana crab claws (starter, served warm, "Warm brown butter vinaigrette, fines herbes"); Louisiana lump crab (Pecan Gulf Fish, Crab & Corn Omelette, papillote); crawfish (Crawfish Meat Pies); Louisiana shrimp (Shrimp & Grits, gumbo, popcorn shrimp). The lexicon's doneness note: "the shrimp's C-curl (O means overcooked)".

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite in the manner of a fisheries plate, true colour, soft daylight from the upper left, soft contact shadows, no plates or props unless named.

1. Redfish (red drum, Sciaenops ocellatus), whole and uncooked, side view facing left: a long, sturdy body, coppery bronze on the back fading to a white belly, a slightly overhanging snout with a low mouth, no chin barbels, and one round black spot ringed paler at the base of the tail.
2. Gulf oysters (Eastern oyster): one whole closed oyster with a rough, grey-brown, layered, teardrop-shaped shell, and one opened on the half shell, the plump grey-beige oyster sitting in clear liquor.
3. Louisiana crab claws: four cooked Louisiana blue crab claws, served warm, the shell taken off the white meat and the smooth orange-red and cream pincer tip left on each as a handle.
4. Lump crab meat: a small mound of large, snow-white lumps of cooked blue crab meat with faint pink edges, in a plain white ramekin.
5. Louisiana crawfish: one whole cooked crawfish, bright red, with its long claws and segmented tail, beside a small heap of peeled pink-and-white tail meat.
6. Louisiana shrimp, peeled with the tail fan left on: two cooked shrimp curled in a loose C, pink and white, and one curled tight into a closed O.

The six numerals are the only marks: no words, labels or text.
```

- **Avoid:** a red snapper shape for panel 1 (the archive poster made that mistake: redfish is long, bronze, low-mouthed and tail-spotted); a Pacific ruffled oyster in panel 2; panel 3's serving form is the Louisiana standard for crab claws and the pack does not describe it, so confirm on the pass; any lemon wedges or sauce.

#### B12. The Louisiana larder: trinity and smokehouse

> World Table art. Paste the World Table style guide first. Deliver as `louisiana-larder-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Plates wall, "The pantry" kind, and linked from the house's gumbo, shrimp and grits and the Library terms Tasso and Andouille.
- **Must teach:** lexicon: "LOUISIANA, the holy trinity: onion, celery, green bell pepper"; "TASSO: not really a ham but a cured, heavily spiced (cayenne, garlic ...) hot-smoked slab of pork shoulder, used in cubes as a flavor base"; "ANDOUILLE (Cajun style): coarse-chopped, garlicky, double-smoked pork sausage, firmer and smokier than its French namesake"; okra "the body in gumbo". On the menu: andouille in the Seafood Gumbo, tasso in the Shrimp & Grits, okra in the Creole Tomato Tostada and the fried okra chips.

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left, soft contact shadows, no props.

1. Onion: a whole yellow onion with dry golden-brown skin and a few root threads, and a small pile of it finely diced, translucent white.
2. Celery: two pale green celery ribs with a few leaves, and a small pile cut into small dice.
3. Green bell pepper: a whole glossy green bell pepper and a small pile cut into small dice.
4. Andouille: a length of coarse, dark, wrinkled smoked pork sausage, mahogany brown, with two thick coins sliced from it showing a coarse grind of pink meat and white fat.
5. Tasso: a thick slab of smoked pork shoulder with a dark red-brown crust of cayenne and spice, one end cut to show deep pink meat, and a few small cubes cut from it.
6. Okra: three slender green ridged okra pods and two cut rounds showing the star-shaped cross-section and pale seeds.

The six numerals are the only marks: no words, labels or text.
```

- **Avoid:** carrot in the trinity (that is French mirepoix); a smooth fine-ground sausage in panel 4; a ham shape or bone in panel 5.

#### B13. The roux, from white to brick

> World Table art. Paste the World Table style guide first. Deliver as `roux-colour-ladder-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/standards/` (published at /table/).

- **Where:** Library, Techniques, "Making a roux" (`/table/technique/making-a-roux`), and linked from the house's Seafood Gumbo ("Gumbo is the Louisiana stew built on a dark roux").
- **Must teach:** the standard: "Taken to the stage the dish named and no further, judged against that colour (pale, blond, or brown to brick)"; "No black specks anywhere. One scorched fleck condemns the batch". Lexicon: "white (2 min) for béchamel, blond for velouté, brown to brick-dark for gumbo". Gumbo recipe: "whisk oil and flour over medium 30 to 45 min to milk-chocolate brown"; "burnt roux means start over". The pack's roux: "the darker it goes, the deeper the flavor and the less it thickens".

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left.

Every cell shows the same heavy, plain, straight-sided stainless steel pan seen from about 60 degrees above, holding the same amount of roux (flour cooked in fat), with a flat wooden spoon resting in it, so only the colour and texture change.
1. White roux: a smooth, pale cream paste, barely coloured.
2. Blond roux: a light golden straw colour, smooth and loose.
3. Peanut-butter brown roux: the colour of peanut butter, smooth and glossy.
4. Milk-chocolate brown roux: an even, deep milk-chocolate brown, glossy and fluid, the colour of a gumbo base.
5. Brick roux: a deep red-brown, darker than panel 4, glossy and loose, the darkest sound roux, still clean and even with no black anywhere.
6. Scorched roux, the fault: a dark brown roux peppered with black specks and a burnt dark ring at the edge of the pan.

The six numerals are the only marks: no words, labels or text.
```

- **Avoid:** a black or near-black roux in panels 4 or 5 (brick is deep red-brown, not black); panel 5 lighter than panel 4 (the order runs pale to dark, as the Library's "brown to brick-dark" does); lumps or dry flour in panels 1 to 5; specks anywhere but panel 6.

#### B14. Hollandaise: how it comes together, and the two ways it splits

> World Table art. Paste the World Table style guide first. Deliver as `hollandaise-standard-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/standards/` (published at /table/).

- **Where:** Library, Techniques, "Hollandaise" (`/table/technique/hollandaise`) and "Building an emulsion"; linked from the house sauces (B03).
- **Must teach:** the recipe "Hollandaise, and the Two Ways It Splits": "whisk steadily until the sabayon triples in volume, holds a ribbon on the surface for two seconds"; "add the clarified butter in a thread no thicker than a pencil lead ... until each addition disappears and the sauce climbs the wires"; "Hollandaise fails at two temperatures: too hot (scrambled) and too cold (split)"; "If it breaks: new yolk in a clean bowl, whisk the broken sauce into IT". The emulsion standard's fault: "it breaks into grease over a thin liquid".

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. Each cell shows a round stainless steel mixing bowl from about 45 degrees above, with a balloon whisk; where a cook's hand appears, only a hand and forearm in a plain white sleeve.

1. The sabayon: egg yolks whisked over a pan of barely steaming water into a pale, airy, tripled foam, a ribbon trailing from the lifted whisk and resting on the surface.
2. Building it: off the heat, warm golden clarified butter poured from a small plain jug in a pencil-thin thread while the whisk turns, the sauce thick, pale and climbing the wires.
3. Finished: a smooth, glossy, pale butter-yellow sauce falling from the lifted whisk in a thick ribbon, soft and stable.
4. Too hot, the fault: the sauce grainy and curdled, with small scrambled-egg lumps through it.
5. Too cold or too fast, the fault: the sauce broken, a slick of clear yellow butter pooled over a thin, watery, pale liquid, no body at all.
6. The rescue: a clean bowl with one fresh yolk, the broken sauce from panel 5 being whisked into it a little at a time, already smooth again where it meets the yolk.

The six numerals are the only marks: no words, labels or text.
```

- **Avoid:** a thermometer read-out or numbers; a bowl sitting in the water in panel 1 (the recipe checks "that the bowl base sits clear of the water"); a pure white colour for the finished sauce.

### 4.2 The drinks (Ledger art)

Paste the Ledger style guide (2.2) first. For every Brennan's drink the pack prints the ingredients but not the glass, and for all but two not the garnish. Where the pack is silent the card is drawn in the classic way and the entry carries a **Question for the bar**; if the bar answers differently, run the prompt again with the bar's answer in place of the classic one before the image is used. File paths are inside the Ledger repository, which publishes to `/ledger/`.

#### B15. The Brennan's glassware chart

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `brennans-glassware-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The Menu tab (Brennan's), at the foot of the drinks list, under a heading "The glasses"; the app prints the legend below the image. Also linked from each drink card's glass line.
- **Must teach:** The nine glass shapes the Brennan's drinks are classically served in, so a server can match a drink to its glass at the pass. The legend the app will print (classic service, every line "confirm with the bar"):
  1. Rocks glass: Classic Sazerac ("served without ice in a glass rinsed with Herbsaint"), Thompson's Dream and Origin Story (the same build, each rinsed with its own anise spirit), Brandy Milk Punch, Birdcage, Rumors are Flying, Prisoner of Love
  2. Highball: Bloody Bull, Brennan's Bloody Mary
  3. Irish coffee glass: Brennan's Irish Coffee, Ralph's Coffee
  4. Champagne flute: Brennan's Champagne Cocktail, For Sentimental Reasons, Personality, Riviera, OBX, Flamingo
  5. Coupe: Espresso Martini, Old Buttermilk Sky, Oh! What It Seemed to Be, Five Minutes More
  6. Nick & Nora: To Each His Own, Spoonbill, Banane au Chocolat
  7. Large wine glass: Chandon Garden Spritz
  8. Coffee cup and saucer: New Orleans-Style Coffee with Chicory, Congregation Single-Origin Coffee
  9. Tall glass: Café Glacé de la Maison (over ice), Floating in South Africa, Revive Cold-Pressed Juice (held: confirm with the bar)

  The legend places 30 of the 32 drinks. Two are held off it until the bar answers, because the build decides the glass: Bodrum (how the pistachio goes in) and Apple Crumble (the pack: "Whether it is served hot or cold is not printed").
- **Question for the bar:** the pack's `glass` field is empty for all 32 drinks. Which glass does each drink go out in? The open questions already ask it for the Milk Punch, the Sazerac, the Irish Coffee and the Champagne Cocktail.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate showing nine empty glasses, each drawn as a fine copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) lines on deep felt green (#102119 fading to #081510 at the edges), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin.

Arrange the nine glasses in a grid of three columns and three rows, each standing upright on its own short engraved ground line, all drawn to the same true relative scale, empty, seen straight from the side at eye level with a slight ellipse at the rim. Clean glass shown by fine highlight lines and light hatching, no liquid, no garnish.

Row 1, left to right:
1. A rocks glass: short, straight-sided, heavy thick base, about 6 to 9 oz.
2. A highball: tall, narrow, straight-sided, about 8 to 12 oz.
3. An Irish coffee glass: a stemmed, footed glass with a tall tulip-shaped bowl, a short stem and a small handle on the side of the bowl.
Row 2:
4. A Champagne flute: tall narrow bowl on a long stem and round foot.
5. A coupe: a shallow, wide, rounded bowl on a stem.
6. A Nick & Nora glass: a small, deep, bell-shaped bowl on a slender stem, narrower and deeper than the coupe.
Row 3:
7. A large wine glass: a big round bowl on a stem.
8. A coffee cup on its saucer: a plain round porcelain cup with a handle, drawn in the same engraved line.
9. A tall glass: a tall straight tumbler slightly taller than the highball.

Beneath each glass, small and centred, the numeral of its position in brass classical serif capitals: 1, 2, 3, 4, 5, 6, 7, 8, 9. No other numerals, no words, no letters. The shapes must be clearly distinct from one another at a small size: keep strong silhouettes and generous space between them.
```

- **Avoid:** liquid or garnish in any glass; a coupe and a Nick & Nora that look the same (the Nick & Nora is smaller and deeper); a handled mug in place of the stemmed Irish coffee glass; words.

#### B16. Classic Sazerac

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `classic-sazerac-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card in the Menu tab (`#/menu/classic-sazerac`), under the name and price line, above "Say it". Reused as the card's front in Flash cards.
- **Must teach:** Pack: "Sazerac rye whiskey stirred with Peychaud's bitters, served without ice in a glass rinsed with Herbsaint"; "The guest gets a short, amber, iceless drink with an anise perfume"; "Sugar and lemon peel are confirmed with the bar." The classic (the Sazerac Company's recipe as the pack quotes it): "a sugar cube, three dashes of Peychaud's, an ounce and a half of Sazerac Rye, a quarter ounce of Herbsaint and a lemon peel, built across two glasses and served neat in a chilled rocks glass"; the Ledger: "Lemon peel, expressed & traditionally discarded". So: a chilled rocks glass, no ice, a short pour, rosy amber, the peel beside the glass and not in it.
- **Question for the bar:** the glass; sugar cube or syrup; the lemon peel in the glass, or expressed and discarded.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is a Sazerac, New Orleans' own cocktail, in a chilled heavy rocks glass: short, straight sided, thick base, with a fine bloom of cold condensation on the outside. There is NO ice in the glass. The drink is a short pour, filling only about the bottom third of the glass, a clear, brilliant rosy amber (deep amber whiskey tinted reddish by the bitters), still and glossy, with a faint sheen of oil on its surface. Nothing floats in it.

Beside the glass on the bar top, lying flat, is one wide strip of fresh lemon peel, bright yellow skin side up, as if just expressed over the drink and set aside.

The glass stands centred on a dark polished wooden bar top that reflects it softly. Eye level just above the rim so the drink's surface is visible; the whole glass with clear space around it, filling about 60 percent of the frame height. Warm candle key light from the left, a cool rim light from behind outlining the glass. Background: shelves of bottles and leather books thrown far out of focus into warm bokeh, deep felt green and brown. No labels, no text, no people, no other glasses, no ice, no straw.
```

- **Avoid:** ice of any kind; a tall pour; the peel floating in the drink; a stemmed glass; a bright red drink (it is amber with a rosy cast); absinthe paraphernalia.

#### B17. The Sazerac ladder

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `sazerac-ladder-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The Menu tab, at the head of the Premium Sazeracs section, above Thompson's Dream; the app prints under each glass, left to right: "Classic Sazerac $13", "Thompson's Dream $20", "Origin Story $40".
- **Must teach:** One build, one glass, three rungs. Pack: "the first rung of the house's Sazerac ladder: $13, then Thompson's Dream at $20 with Willett rye, then Origin Story at $40 with Cognac and absinthe"; Thompson's Dream "a short, iceless, amber drink like the Classic, with a greener perfume"; Origin Story "a short, iceless, deep amber drink", "rounder than the Classic: grape, dried fruit and oak". So: three identical iceless rocks glasses, the third visibly deeper in colour.
- **Question for the bar:** the glass and the peel for all three (the pack: "the build follows the Classic, confirmed with the bar").

```
FAMILY 1, THE CANDLELIT CARD, landscape variant. Landscape, 1536 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. Three identical heavy rocks glasses stand in a straight row on a dark polished wooden bar top, evenly spaced, the same size, seen at eye level just above the rims. Each is chilled, with a faint bloom of condensation, and holds a short pour filling only the bottom third, with NO ice and nothing floating in it.

Left glass: a clear, brilliant rosy amber.
Middle glass: the same rosy amber, a shade deeper.
Right glass: a deep amber with a rich mahogany warmth, clearly the darkest of the three.

The three glasses fill the middle band of the frame with space between them. Warm candle key light from the left, a cool rim light from behind outlining each glass, soft reflections of all three on the bar top. Background: shelves of bottles and leather books far out of focus as warm bokeh in deep felt green and brown. No peels, no bottles in focus, no labels, no text, no people, no ice.
```

- **Avoid:** different glass shapes (the lesson is that the build and glass are the same); price tags or numerals; steps or pedestals; garnish.

#### B18. Brandy Milk Punch

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `brandy-milk-punch-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/brandy-milk-punch`), under the name and price line. It is the first drink on the list and the first sale of the morning.
- **Must teach:** Pack: "brandy, heavy cream, vanilla bean, nutmeg", "shaken with heavy cream and vanilla bean", "The guest gets a cold, pale, creamy drink with the nutmeg dusted over it." The classic glass (the Ledger's own Brandy Milk Punch): "Highball or rocks", "Shake hard, strain over ice", "Grated nutmeg".
- **Question for the bar:** the glass; on ice or up; any garnish beyond the nutmeg.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar, in the soft early light of a New Orleans breakfast. The hero is a Brandy Milk Punch in a heavy rocks glass, filled to about a finger below the rim. The drink is cold, opaque and creamy: a pale ivory with the faintest warm tint, smooth and velvety, with a fine layer of tiny bubbles on the surface from a hard shake. Freshly grated nutmeg is dusted over the surface in fine warm-brown specks, more in the centre. The glass has a light bloom of cold condensation. Because the drink is opaque, no ice is visible.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the rim so the nutmeg on the surface is clearly seen, the whole glass in frame filling about 60 percent of its height. Warm candle key light from the left with a hint of soft morning daylight, a cool rim light from behind. Background: library shelves and bottles far out of focus in warm bokeh, deep felt green and brown. No straw, no cinnamon stick, no whipped cream, no garnish on the rim, no labels, no text, no people.
```

- **Avoid:** whipped cream or a frothy egg-nog head; a cinnamon stick; yellow (it is ivory, there is no egg); a tall foam cap.

#### B19. Bloody Bull and Brennan's Bloody Mary

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `bloody-bull-and-bloody-mary-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** Both study cards, Bloody Bull (`#/menu/bloody-bull`) and Brennan's Bloody Mary (`#/menu/brennan-s-bloody-mary`), under the name and price line; the app prints "Bloody Bull" under the left glass and "Brennan's Bloody Mary" under the right.
- **Must teach:** Telling the two apart at the pass. Pack, Bull: "Housemade Bloody Mary mix, beef bouillon, vodka", "a deep red, savory drink", "like a spicy chilled consommé"; service note: "Contains beef: not vegetarian (offer the Brennan's Bloody Mary, $11)". Pack, Mary: "housemade Bloody Mary mix, vodka, pickled okra, spicy beans", garnish field "pickled okra and spicy beans", "a red, savory drink with the pickled okra and spicy beans standing in it". The classic glass (the Ledger's Bloody Mary): "Highball or pint". The Mary's garnish is printed; the Bull's is not.
- **Question for the bar:** the glass for both; the Bull's garnish (drawn here as the classic lemon wedge); whether the two use the same mix.

```
FAMILY 1, THE CANDLELIT CARD, landscape variant. Landscape, 1536 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar in soft morning light. Two tall highball glasses stand side by side on a dark polished wooden bar top, the same size, a hand's width apart, both filled with cubed ice and a savoury tomato drink, with a light bloom of condensation.

Left glass, the Bloody Bull: the drink is a deeper, darker brick red with a brownish warmth from beef broth, slightly more translucent at the edges. A single fresh lemon wedge sits on the rim. Nothing else in the glass.

Right glass, the Bloody Mary: a brighter tomato red, thicker and more opaque. Standing up in the drink, rising above the rim: one whole pickled okra pod (slender, ridged, olive green) and two or three pickled green beans (long, thin, dull green, flecked with chile). No celery, no olives, no lemon.

Eye level just above the rims so the drinks' surfaces and garnishes are clear. Both glasses fully in frame with space around them. Warm candle key light from the left, a cool rim light from behind, soft reflections on the bar top. Background: library shelves and bottles far out of focus in warm bokeh. No straws, no salt rims, no bacon, no shrimp, no labels, no text, no people.
```

- **Avoid:** celery stalks, olives, bacon or skewered extravagance (not printed); identical colours (the Bull must read darker and browner); a salt or spice rim.

#### B20. Brennan's Irish Coffee

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `brennan-s-irish-coffee-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/brennan-s-irish-coffee`); the same image serves the dessert menu's Coffee Cocktails section.
- **Must teach:** Pack method: "Build in the glass: brown sugar stirred into the hot chicory coffee, then Tullamore Dew, then the whipped cream floated on top; not stirred once the cream is on." "The guest gets a warm coffee under a cool white cap of cream, and sips the hot coffee through it." The classic glass (the Ledger's Irish Coffee): "Pre-heated Irish coffee glass", "The cream IS the garnish".
- **Question for the bar:** the glass; lightly whipped pourable cream or a stiff whipped cap (drawn here as the classic lightly whipped float).

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is an Irish coffee in a classic Irish coffee glass: a clear stemmed, footed glass with a tall tulip-shaped bowl, a short stem and a small glass handle on the side of the bowl. The glass is warm, with no condensation.

The lower two thirds is hot, very dark brown coffee, almost black, clear at the edges where the light passes through. On top floats a layer of lightly whipped cream about two centimetres deep, pure white, smooth and matte, with a perfectly clean, level line where it meets the coffee: the two never mix. A faint wisp of steam rises from the edge. Nothing else: no garnish, no dusting, no straw, no spoon.

Centred on a dark polished wooden bar top that reflects it softly, eye level at the cream line so the clean division between coffee and cream is the focus, the whole glass from foot to rim in frame, filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind outlining the glass. Background: library shelves far out of focus in warm bokeh, deep felt green and brown. No labels, no text, no people.
```

- **Avoid:** a handled mug; aerosol-style piped cream or a tall swirled peak; chocolate or cinnamon dusting; a blurred or mixed cream line; a straw.

#### B21. Brennan's Champagne Cocktail

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `brennan-s-champagne-cocktail-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/brennan-s-champagne-cocktail`), in the Bubbles at Brennan's section.
- **Must teach:** Pack: "Champagne, Angostura bitters, demerara sugar cube", "the cube is soaked in bitters, set in the glass, and the Champagne poured over it", "The guest gets a glass of Champagne with a steady stream of bubbles rising from the cube." The classic (the Ledger's Champagne Cocktail): "Drop cube in flute, pour gently", glass "Flute", garnish "Lemon twist".
- **Question for the bar:** the glass; the garnish (drawn here as the classic lemon twist); Angostura as printed.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar in late afternoon. The hero is a Champagne cocktail in a tall Champagne flute on a long stem and round foot, filled to about a finger below the rim. At the very bottom of the bowl rests one small square demerara sugar cube, golden brown, stained a deeper reddish brown by bitters, its edges just beginning to soften. From the cube a steady, fine, continuous column of tiny bubbles rises straight up through the whole glass. The wine is a clear pale gold, faintly warmer in tone just above the cube. A fine ring of bubbles sits at the surface.

A thin curl of bright yellow lemon twist rests on the rim, hanging just inside the glass.

Centred on a dark polished wooden bar top that softly reflects it, eye level at mid-bowl so both the cube and the rising stream are clearly visible, the whole flute in frame filling about 70 percent of its height. Warm candle key light from the left, a cool rim light from behind. Background: library shelves and bottles far out of focus in warm bokeh. No bottle, no other glasses, no labels, no text, no people.
```

- **Avoid:** a coupe; a strawberry or cherry; a sugared rim; the cube dissolved away (it must be visible); a bottle with a label.

#### B22. Espresso Martini (Brennan's)

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `espresso-martini-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/espresso-martini`), Coffee Cocktails on the dessert menu.
- **Must teach:** Pack: "chicory, vodka, Frangelico, Kahlua", "The guest gets a dark coffee cocktail", "roasty and smooth"; note: "The menu prints chicory, not espresso: confirm the coffee with the bar." The classic (the Ledger's Espresso Martini): "Shake hard, double strain up", glass "Coupe", garnish "3 coffee beans", "Fresh espresso's crema builds the foam."
- **Question for the bar:** the glass; the garnish (drawn here as the classic three beans); whether the foam is as dense as an espresso-built one, since the menu prints chicory.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is an espresso martini in a stemmed coupe: a shallow, wide, rounded bowl on a slender stem. The drink is a very dark coffee brown, almost black, served up with no ice, filled close to the rim. On top sits a smooth, fine-textured foam about half a centimetre deep, the colour of light hazelnut, creamy and even. Three whole roasted coffee beans rest together in the centre of the foam.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the rim so the foam and the three beans are clearly seen, the whole glass from foot to rim in frame, filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind. Background: library shelves far out of focus in warm bokeh, deep felt green and brown. No chocolate, no cocoa dust, no extra beans scattered on the bar, no labels, no text, no people.
```

- **Avoid:** a V-shaped martini glass; a thick white milky head; scattered beans; a chocolate rim.

#### B23. For Sentimental Reasons

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `for-sentimental-reasons-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/for-sentimental-reasons`), first in the Billboard Songs from 1946 section.
- **Must teach:** Pack: "allspice dram, pear purée, sparkling wine", "The guest gets a sparkling drink with the soft body the purée gives", "fizzy and fruity, ripe pear first". Drawn in a flute as the house's other sparkling drinks are classically served, ungarnished because nothing is printed.
- **Question for the bar:** the glass and any garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar. The hero is a sparkling pear cocktail in a tall Champagne flute on a long stem, filled to about a finger below the rim. The drink is a soft pale gold with a gentle, even haze from fruit purée: not clear like Champagne, and not opaque like juice, but softly clouded, with a faint warm amber tint low in the glass. Fine bubbles rise through it and a delicate ring of foam sits at the surface. No garnish of any kind.

Centred on a dark polished wooden bar top that softly reflects it, eye level at mid-bowl, the whole flute in frame filling about 70 percent of its height. Warm candle key light from the left, a cool rim light from behind. Background: library shelves and bottles far out of focus in warm bokeh, deep felt green and brown. No pear, no fruit slices, no spices, no labels, no text, no people.
```

- **Avoid:** a pear slice or whole pear as garnish (not printed); a crystal-clear drink; a thick foam head.

#### B24. Prisoner of Love

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `prisoner-of-love-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/prisoner-of-love`).
- **Must teach:** That "clarified heavy cream" means a CLEAR drink. Pack: "gin, Earl Grey tea, clarified heavy cream, orange flower water"; "Clarifying is the old milk punch technique, where the milk is curdled and strained off clear; it leaves a silky texture without the weight of cream"; "The guest gets a fragrant, silky drink." The Ledger's Clarified Milk Punch: "crystal clear", glass "Rocks or coupe". Drawn here in a rocks glass over one large clear cube.
- **Question for the bar:** the glass, the ice, and any garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is a clarified milk punch in a heavy rocks glass over one large, perfectly clear square ice cube. The drink is crystal clear and brilliant, with NO cloudiness and NO white at all: a pale golden straw colour with a soft amber warmth from tea, so transparent that the edges of the ice cube are sharp through it. Its surface is glossy and still. The glass is filled to about two fingers below the rim, with a light bloom of condensation. No garnish.

Centred on a dark polished wooden bar top that reflects it softly, the candle glow passing through the liquid and casting a warm golden light on the wood. Eye level just above the rim, the whole glass in frame filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind. Background: library shelves and bottles far out of focus in warm bokeh. No milk, no cream, no tea cup, no flowers, no citrus, no labels, no text, no people.
```

- **Avoid:** any milky, white or cloudy look (the point of the drink is that it is clear); cream or a foam; a tea bag or cup as a prop.

#### B25. Rumors are Flying

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `rumors-are-flying-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/rumors-are-flying`).
- **Must teach:** Pack: "Brennan's Barrel Aged Rittenhouse Rye, tart cherry juice, brown sugar syrup, orange bitters", "The guest gets a dark, spirit-forward drink", "rye spice and oak, with dark tart cherry", "the drink for an Old Fashioned lover". Drawn in a rocks glass over one large cube, as an Old Fashioned is served, ungarnished because nothing is printed.
- **Question for the bar:** the glass, the ice and the garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is a dark whiskey and cherry cocktail in a heavy rocks glass over one large clear square ice cube. The drink is clear but deeply coloured: a dark garnet red where it is thickest, shading to warm amber at the thin edges where the candlelight passes through. Its surface is still and glossy, filled to about two fingers below the rim. A light bloom of condensation on the glass. No garnish of any kind.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the rim, the whole glass in frame filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind outlining the glass. Background: library shelves, barrels and bottles far out of focus in warm bokeh, deep felt green and brown. No cherries, no orange peel, no smoke, no labels, no text, no people.
```

- **Avoid:** a cherry or orange garnish (not printed); an opaque juice look (it is a clear, stirred-looking drink); smoke (that is the Birdcage).

#### B26. To Each His Own

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `to-each-his-own-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/to-each-his-own`).
- **Must teach:** Pack: "Daron Fine Calvados, Lillet Blanc, quince liqueur", "The guest gets a smooth, spirit-forward drink", "baked apple and perfumed quince". All three parts are spirit or aromatised wine, so it is drawn served up in a Nick & Nora, clear and pale gold.
- **Question for the bar:** the glass, the method and any garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar on an autumn evening. The hero is an apple brandy cocktail served up, with no ice, in a Nick & Nora glass: a small, deep, bell-shaped bowl on a slender stem. The drink is perfectly clear and bright, a pale honeyed gold with a soft amber warmth, filled to a few millimetres below the rim, its surface still and glossy. No garnish of any kind.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the rim, the whole glass from foot to rim in frame, filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind outlining the bowl. Background: library shelves far out of focus in warm bokeh, deep felt green and brown. No apples, no quinces, no fruit, no labels, no text, no people.
```

- **Avoid:** apple slices or fruit props (not printed); a coupe; cloudiness.

#### B27. Old Buttermilk Sky

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `old-buttermilk-sky-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/old-buttermilk-sky`). Its spirit-free twin Oh! What It Seemed to Be uses series S06.
- **Must teach:** Pack: "Volcán Reposado Tequila, fig liqueur, lemon, egg white, cinnamon syrup", "a tequila sour built with egg white", "The guest gets a sour with a silky texture"; service note: "Egg white, as printed." Drawn as a sour served up in a coupe with an egg-white foam cap, ungarnished because nothing is printed.
- **Question for the bar:** the glass and any garnish (for example a dusting of cinnamon on the foam, which is not printed and is not drawn).

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar. The hero is a tequila sour with egg white served up, with no ice, in a stemmed coupe: a shallow, wide, rounded bowl on a slender stem. The body of the drink is a soft, opaque, pale amber tan, like weak tea with milk, smooth and silky. On top sits a dense, fine, pure white foam cap about one centimetre deep, perfectly smooth and level, with a crisp line where it meets the drink below. No garnish, no dusting, nothing on the foam.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the rim so the foam cap and the line beneath it are clear, the whole glass from foot to rim in frame, filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind. Background: library shelves far out of focus in warm bokeh, deep felt green and brown. No figs, no cinnamon sticks, no salt rim, no lime, no labels, no text, no people.
```

- **Avoid:** a salt rim or lime wheel (it is not a margarita); bitters art on the foam; cinnamon dust; a fig garnish.

#### B28. Five Minutes More

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `five-minutes-more-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/brennans/` (published at /ledger/).

- **Where:** The drink's study card (`#/menu/five-minutes-more`).
- **Must teach:** Pack: "Cathead Mandarin Vodka, Green Chartreuse, Licor 43, lemon", "The guest gets a bright, citrusy drink", "mandarin and lemon first, then the deep green herbs of the Chartreuse". With lemon in it the drink is shaken; it is drawn served up in a coupe, cloudy pale yellow-green, ungarnished because nothing is printed.
- **Question for the bar:** the glass, the method and any garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar. The hero is a shaken citrus and herbal liqueur cocktail served up, with no ice, in a stemmed coupe: a shallow, wide, rounded bowl on a slender stem. The drink is a softly cloudy, pale yellow-green, the colour of young celery leaves mixed with lemon juice: light, bright and translucent, with a delicate thin film of fine white bubbles across the surface from a hard shake. Filled to a few millimetres below the rim. No garnish of any kind.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the rim, the whole glass from foot to rim in frame, filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind. Background: library shelves far out of focus in warm bokeh, deep felt green and brown. No herbs, no lemon, no mandarin, no labels, no text, no people.
```

- **Avoid:** a vivid neon green (Green Chartreuse is one of four parts: the drink is pale); an egg-white foam (none is printed); herb sprigs.

The rest of the Brennan's list (the Roost trio, the other Bubbles drinks, the spirit-free pair, the dessert and coffee drinks) is set out in series S06 with its slot values.

### 4.3 The wines and service (Codex art)

Paste the Codex style guide (2.3) first. Facts are quoted from the pack's pour notes, serve fields and must-knows, from the Binwise list catalogued as `winelist-2026-10-03.json`, or from the Codex's own data (`js/codex6.js` SERVICE and TASTING_GRID, `js/data-intro.js` INTRO_CLASS, `js/reference.js` GRAPES). Every one is a teaching plate: a sequence of hands, a diagram, a specimen. Nothing here decorates.

#### B29. Around the table: who is poured, in what order

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `brennans-pour-order-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, at the top of "Study our list", above the first wine card, under a heading "How we pour"; and at the head of the Service Ritual's "Order of Service" section. The app prints the key.
- **Must teach:** the choreography the pack's pour notes repeat on every wine and the Codex's SERVICE states: "Present the bottle to the host, label forward"; "Pour the host a taste, about an ounce, and await approval"; "Approach from the right, serve with the right hand, move clockwise"; "Guests first and the host last"; "station the bottle to the host's right, label facing them". Key the app prints: 1 present to the host, label forward; 2 the host's taste; 3, 4, 5 the guests, clockwise, poured from each guest's right; 6 back to the host, last; 7 the bottle set down to the host's right, label towards the host.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Square, 1024 x 1024 pixels.

A top-down plan of a round restaurant table for four, drawn as a fine engraved diagram on warm parchment (#f3e9d5 to #e3d3b4) with ink-brown line work (#29271f), a thin double gold hairline frame (#d5b16c) inset from the edge.

The table is a white linen circle in the centre, seen straight from above. Around it four chairs, drawn as simple engraved chair outlines from above, at the top, right, bottom and left. The chair at the bottom is the host's: mark its seat with a small solid claret dot (#843d37). On the table in front of each chair: one wine glass seen from above (a ring for the bowl and a smaller ring for the foot) and a folded napkin. To the host's right on the table, a standing wine bottle seen from above with its cream label facing the host's chair, shown by a short cream arc on the side of the bottle towards the host.

The server's path: a fine dashed claret line (#843d37) with small arrowheads that starts behind the host's right shoulder, then travels round the OUTSIDE of the chairs clockwise (as seen from above), stopping behind the RIGHT shoulder of each guest in turn, and ends back behind the host's right shoulder. At each stop, a small engraved footprint pair shows where the server stands, always at the guest's right side.

Numbered discs (ivory #f3e9d5, gold ring, dark green numeral #17382a), small, placed on the path: 1 behind the host's right shoulder; 2 just beside 1, at the host's glass; 3 at the guest to the host's left in clockwise order, 4 at the next guest, 5 at the third guest; 6 back at the host; 7 beside the bottle on the table. Use exactly the numerals 1, 2, 3, 4, 5, 6, 7 and no other numbers, letters or words.

Clean, uncluttered, generous space, every numeral readable at a small size.
```

- **Avoid:** people or faces (chairs only); a counter-clockwise path; the server reaching across the table; the bottle label facing away from the host; gender markers on seats (the app's text handles "women first where practical"); any lettering.

#### B30. Opening a still wine at the table

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `service-still-opening-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** the Service Ritual, at the head of "Opening Still Wine", above step 1; also on the wine card of any Brennan's bottle whose pour note says "Pull the cork", behind a "See it" link.
- **Must teach:** the seven steps of SERVICE "Opening Still Wine", in order, condensed to six panels: (1) "Present the bottle to the host, label forward"; (2) "Cut the capsule below the bottom lip ... two draws around with the knife, one vertical, lift the cap"; (3) "Wipe the exposed cork and lip with the serviette"; (4) "Insert the worm just off-center and screw to the last spiral ... Never pierce through the bottom"; (5) "Lever in two stages, ease the cork silently by hand"; (6) "Pour the host a taste, about an ounce". The tool is "the two-step (double-hinged) corkscrew"; the serviette is "pressed and folded over the left forearm".

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

A six-panel step sequence, three panels across and two rows down, each panel framed by a thin gold hairline (#d5b16c) with a narrow deep forest-green gutter (#102119) between them. Every panel uses the same camera height and the same background: a white linen tablecloth in the foreground, a calm deep forest-green background falling into shadow, warm candle light from the left, a soft rim light behind. The bottle is a plain dark green Burgundy- shaped wine bottle (sloping shoulders) with a deep burgundy-red foil capsule and a blank cream label with no readable words. The server's hands are clean, no rings, white shirt cuffs under black jacket sleeves; never a face. A pressed white serviette is folded over the server's left forearm in every panel where the arm is visible.

Panel 1: the bottle held at a slight angle, resting on the folded serviette on the left forearm, the blank cream label turned towards the viewer as if towards a seated guest.
Panel 2: close on the neck: the small blade of a waiter's two-step corkscrew cutting the foil in a neat ring just BELOW the bulging lip of the bottle, one hand steadying the bottle, the label still facing the viewer.
Panel 3: the foil top removed, a corner of the white serviette wiping the top of the cork and the glass lip.
Panel 4: the spiral worm of the corkscrew entering the cork slightly off centre, screwed nearly all the way down, one spiral still showing above the cork.
Panel 5: the corkscrew's two-step hinged lever resting on the bottle lip, the cork drawn three quarters out, the second hand ready to ease the last of it out by hand. No spray, no pop.
Panel 6: a small pour, about one ounce of true ruby red wine, going into a single clear stemmed wine glass standing on the linen; the bottle's label faces the viewer.

In the top left corner of each panel, a small ivory disc (#f3e9d5) with a gold ring and a dark green numeral (#17382a): 1, 2, 3, 4, 5, 6. No other numbers, letters or words.
```

- **Avoid:** a single-lever or winged corkscrew (it must be the two-step waiter's friend); the foil cut above the lip; the worm through the bottom of the cork; a full glass in panel 6; a sommelier's tastevin or other props; any readable label.

#### B31. Champagne, opened with a sigh

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `service-champagne-opening-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** the Service Ritual, at the head of "Sparkling Wine"; and on every Champagne card in My restaurant (the 29 Champagne bottles, the Birthday Bubbles halves and large formats) behind "See it".
- **Must teach:** the house's own words on the Rare 2013, the Billecart Sous Bois magnum and every Champagne bottle: "Ice bucket, half ice and half water. Hold cork and cage together and ease the cork out with a quiet sigh"; serve "43 to 46°F" (the house NV sparkling); and SERVICE: "Loosen the cage, six half-turns, and never let go of the cork again"; "Angle the bottle 30 to 45°, away from every guest and light fitting"; "twist the bottle, not the cork, from the base"; "Release with a sigh, not a pop"; "Pour in two stages ... then top to two-thirds".

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

A six-panel step sequence, three panels across and two rows down, each framed by a thin gold hairline (#d5b16c) with a narrow deep forest-green gutter. Same camera height in every panel; a white linen tablecloth, a calm deep forest-green background in shadow, warm candle light from the left, a soft rim light behind. The bottle is a plain heavy dark green Champagne bottle with sloping shoulders, gold foil over the cork and neck, a wire cage (muselet) with a small plain metal cap on top, and a blank cream label with no readable words. Hands are clean, no rings, white shirt cuffs under black sleeves; a white serviette. Never a face.

Panel 1: the bottle standing in a polished silver ice bucket filled with a mix of ice cubes AND water up to the bottle's shoulder, beads of condensation on the bucket.
Panel 2: the gold foil above the cage peeled away neatly; one thumb already pressed firmly on top of the cage and cork.
Panel 3: close on the neck: fingers untwisting the small wire loop of the cage while the thumb of the other hand stays pressed on top of the cork; the cage stays on the cork.
Panel 4: the bottle held at a 45 degree angle, pointing to an empty corner of the frame, the serviette wrapped over the cork and cage and gripped in one hand, the other hand turning the bottle at its base. A faint dotted gold arc around the base shows that the bottle turns, not the cork.
Panel 5: the cork just released under the serviette, held in the hand, with only the faintest wisp of cold vapour at the bottle mouth. No foam overflowing, no flying cork.
Panel 6: two tall tulip-shaped Champagne glasses on the linen: the left glass with a first small pour whose mousse is settling, the right glass filled to two thirds with pale gold sparkling wine and a fine steady bead.

In the top left corner of each panel, a small ivory disc with a gold ring and a dark green numeral: 1, 2, 3, 4, 5, 6. No other numbers, letters or words.
```

- **Avoid:** a cork popping or foam spraying (the house serves with "a quiet sigh"); the cage removed before the cork is held; the bottle pointed at the viewer; a coupe; an ice bucket of ice alone with no water; a readable label or a recognisable house shape.

#### B32. Sabrage: the Friday saber in the courtyard

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `brennans-sabrage-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, in the house notes under "Bubbles at Brennan's", beside the lexicon term "Sabrage"; the app prints the key and the house line "We saber in the courtyard on Fridays at 5; confirm on shift."
- **Must teach:** the pack's lexicon, verbatim: "Sabrage is opening Champagne with a saber: the blade runs up the seam and takes off the collar and cork in one clean stroke." House facts: "Champagne sabered Fridays at 5" in "the Roost Bar and Courtyard"; "It's a bar team ritual"; "never promise who sabers or that it happens every week without confirming". The plate is so a server can explain it to a guest who asks "You cut Champagne open with a sword?", not a licence to saber. Key the app prints: 1 the seam of the bottle; 2 the collar (the glass ring under the cork); 3 the back of the blade, not the edge; 4 the bottle held by its base, at about 45°, pointed where no one stands; 5 collar and cork leave together, in one piece.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Portrait, 1024 x 1536 pixels.

An engraved-and-watercolour scientific plate on warm parchment (#f3e9d5 to #e3d3b4), ink brown line work (#29271f), fine hatching, a thin double gold hairline frame (#d5b16c).

Upper two thirds: a large, clear side view of a chilled dark green Champagne bottle held at a 45 degree angle, neck pointing up and to the right towards empty space. The foil and the wire cage have been removed; the mushroom-shaped cork sits in the neck. One hand, drawn in fine engraved line (no rings, a white cuff), holds the bottle firmly at its base with the thumb in the deep punt. A faint vertical seam line runs up the side of the bottle and the neck to the lip: draw it slightly emphasised in gold. A cavalry-style curved saber lies flat along the bottle, its blade resting on the seam, with the BLUNT BACK of the blade facing the neck and the sharp edge facing away. A short gold arrow along the blade shows the stroke sliding up the seam towards the lip. At the top, just beyond the neck, show the moment after: the glass collar ring and the cork flying off together, intact, in one piece, a short distance away, with a tiny clean wisp of foam at the open neck.

Lower third: two small inset roundels framed in gold hairline. Left roundel: a close-up of the neck showing the seam meeting the thick glass ring (the collar, called the annulus) just under the cork, the point the blade strikes. Right roundel: a clean, smooth broken edge of the neck seen from above, and the separated collar-and-cork piece beside it.

Numbered discs (ivory, gold ring, dark green numeral) with fine ink leader lines: 1 on the seam along the body; 2 on the collar ring under the cork; 3 on the blunt back of the blade; 4 on the hand at the base; 5 on the flying collar and cork. Only the numerals 1, 2, 3, 4, 5; no words or letters.

Calm, precise, instructional, like a plate from an old manual of service.
```

- **Avoid:** a person or face; a crowd, a party, sprays of foam or shards of glass flying; the sharp edge of the blade striking; the bottle pointed at the viewer; a kitchen knife; any branded bottle; making it look like a stunt. Do not paint the Brennan's courtyard or its fountain: the courtyard is in the text, and a painted one would read as a promise of a scene.

#### B33. Coravin: two devices on one by-the-glass list

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `brennans-coravin-two-ways-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, on the two by-the-glass cards "Rare Brut 2012 (Coravin)" and "Domaine Leflaive Mâcon-Verzé 2022 (Coravin)", and in the lexicon under "Coravin".
- **Must teach:** the pack's two pour notes. Leflaive, still: "Poured by Coravin: needle through the cork, pour, and return the bottle to the cooler"; "Pour through the Coravin needle, cork left in". Rare, sparkling: "Lift the Coravin Sparkling stopper, pour, and reseal it straight away"; the cellar dossier: "The needle-and-argon system is for still wine only ... the Rare must be on the Coravin Sparkling stopper, so its cork has been pulled." And on the 1946 Latour: "Never a Coravin needle through a cork this old." Key the app prints: left panel 1 needle through foil and cork, 2 argon capsule, 3 the cork stays in; right panel 4 the cork already out, 5 the pressure stopper clamped on, 6 reseal after every pour.

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

Two equal side-by-side panels, each framed by a thin gold hairline (#d5b16c) with a narrow deep forest-green gutter between them. Same lighting and background in both: a dark polished wooden table, a calm deep forest-green background in shadow, warm candle light from the left, a soft rim light behind.

LEFT PANEL, still white wine: a plain sloping-shouldered dark green white-wine bottle with an intact pale foil capsule and a blank cream label, with a generic wine-preserving device clamped onto its neck: a slim matte black and brushed steel body with a thin hollow steel needle passing straight down through the foil and the cork, and a small silver gas capsule fitted at the back of the device. The bottle is tilted over a clear stemmed white-wine glass with a wide bowl, pouring a thin stream of pale lemon-gold wine through the device's spout. Cut-away inset (a small gold-framed circle) beside the neck shows the cork in section with the needle running through its centre and the cork still in the bottle.

RIGHT PANEL, sparkling wine: a heavy dark green Champagne bottle with NO cork in it and no foil, its open neck closed by a generic sparkling-wine pressure stopper: a stout brushed steel and black cap clamped round the glass collar, with a small lever on top. Beside the bottle on the table, a pulled mushroom-shaped Champagne cork lying on a small white saucer. A tulip-shaped Champagne glass beside it with a pour of pale gold sparkling wine and a fine bead.

Numbered discs (ivory #f3e9d5, gold ring, dark green numeral #17382a) with fine gold leader lines: left panel 1 on the needle in the inset, 2 on the gas capsule, 3 on the cork in the inset; right panel 4 on the cork on the saucer, 5 on the stopper, 6 on the stopper's lever. Only the numerals 1 to 6; no words, letters, logos or brand marks anywhere on the devices.
```

- **Avoid:** any logo, wordmark or recognisable Coravin product styling (generic devices only); a needle device on the sparkling bottle (the lesson is that it is never used there); a cork in the sparkling bottle; old, crumbly corks under the needle; readable labels.

#### B34. Decanting an old bottle off its sediment

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `service-decanting-old-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** the Service Ritual, at the head of "The Decanting Ritual"; and on the cards of the four 1946 Bordeaux (Latour $4100, Trotanoy $3700, Figeac $3200, Canon $3100) and the Inglenook Rubicon 2010.
- **Must teach:** the house note on the 1946 Latour, verbatim: "stand the bottle upright a day ahead, ease out an old cork with a two-prong opener, and decant only to leave the sediment, just before pouring"; and SERVICE: "Set the station: candle or torch, decanter, serviette, saucer for the cork. The flame sits under the shoulder of the bottle where sediment first shows"; "Pour in one slow, continuous motion over the light ... the first wisp of sediment reaching the neck ends the pour"; "Serve from the decanter; present the original bottle alongside". The must-know: "They are old and fragile: the sommelier presents, opens and decants them."

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

A six-panel step sequence, three across and two rows down, each framed by a thin gold hairline (#d5b16c) with a narrow deep forest-green gutter. Same camera height in every panel; a dark polished wooden side table with a white linen runner, a calm deep forest- green background in shadow, warm candle light from the left and a soft rim light behind. The bottle is a plain dark glass Bordeaux bottle with high square shoulders, a dusty shoulder, an aged, slightly stained blank cream label with no readable words, and a dark red capsule. Hands are clean, no rings, white cuffs under black sleeves; never a face.

Panel 1: the bottle standing upright alone on a cellar shelf of dark wood, a fine dark line of sediment settled at the very bottom of the bottle, visible through the glass.
Panel 2: the station set on the linen: a lit white candle in a short brass holder, an empty clear crystal decanter with a wide base, a folded white serviette, and a small white saucer.
Panel 3: the capsule removed, the two thin flat prongs of a two-prong cork puller (an ah-so) slid down between the cork and the glass on either side, the hand twisting gently.
Panel 4: the old, darkened cork resting on the saucer.
Panel 5: the bottle tilted slowly over the decanter's mouth, its SHOULDER held directly above the candle flame so the light shines up through the neck; a thin steady stream of clear garnet-red wine runs into the decanter.
Panel 6: close on the bottle's shoulder against the flame: the first dark wisp of sediment creeping into the neck and the pour stopped, the bottle tilted back upright; the decanter holds clear garnet wine; a little dark wine with sediment remains in the bottle.

In the top left corner of each panel, a small ivory disc with a gold ring and a dark green numeral: 1, 2, 3, 4, 5, 6. No other numbers, letters or words.
```

- **Avoid:** a young purple wine (it is old: garnet with a browning rim); a cloudy pour into the decanter; the candle under the body or the neck instead of the shoulder; a corkscrew in panel 3 (the house uses the two-prong opener on old corks); a sunset or a window; a readable label or a crest.

#### B35. Why we decant, and when we don't

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `service-decant-or-not-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** the Service Ritual, under step 6 of "The Decanting Ritual" ("Know why you decant, and when not to"); and on the dinner tasting card beside the Paul Hobbs and the Jadot.
- **Must teach:** the cellar rule the pack's notes follow: "Young, structured reds: 30 to 60 minutes. Old reds: stand upright a day ahead, decant only to leave the sediment, give no more than about 30 minutes of air. Light reds and all whites: none." House examples: the Paul Hobbs Coombsville Cabernet 2021, "open or decant 30 to 60 minutes ahead"; the 1946 Bordeaux, sediment only; the Leflaive Mâcon-Verzé, "No decanting"; SERVICE: "Fragile old Burgundy often should not be decanted at all; offer, and follow the host." Key the app prints: 1 air, for a young, structured red; 2 sediment, for an old red; 3 none, for whites and light reds.

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

Three equal vertical panels side by side, each framed by a thin gold hairline (#d5b16c) with a narrow deep forest-green gutter. Same background in all three: a dark polished wooden table, a calm deep forest-green background in shadow, warm candle light from the left.

Panel 1, a young structured red: a wide, low, broad-based crystal decanter filled to its widest point with deep opaque purple-ruby wine, a soft swirl on the surface; behind it a plain dark Bordeaux-shaped bottle with a blank cream label, empty, standing upright; a large Bordeaux wine glass with a pour of the same deep purple-ruby wine.

Panel 2, an old red: a slim, narrow-necked crystal carafe-style decanter holding clear garnet wine with a brick-orange rim; beside it the original old Bordeaux-shaped bottle, dusty, with a darkened aged blank label, a little dark sediment visible in its base; a lit white candle in a brass holder; a large Bordeaux glass with a small pour of garnet wine.

Panel 3, white and light red: no decanter at all. A plain sloping-shouldered white Burgundy bottle with a blank cream label resting in a silver ice bucket of ice and water, beside a wide white Burgundy bowl glass with a pour of pale lemon-gold wine; and a plain sloping-shouldered bottle of light red beside a large balloon-shaped Burgundy glass with a pour of translucent ruby wine.

In the top left corner of each panel, a small ivory disc with a gold ring and a dark green numeral: 1, 2, 3. No other numbers, letters or words.
```

- **Avoid:** the same wine colour in panels 1 and 2 (young is purple and opaque, old is garnet and bricking); a decanter in panel 3; candles in panels 1 or 3; any readable label.

#### B36. Bottle sizes, as our list carries them

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `brennans-bottle-sizes-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, at the head of "Birthday Bubbles: Champagne large formats" and of "Half-bottles"; and in the Service Ritual's "Temperatures & Glassware" section. The app prints the key.
- **Must teach:** the formats on the Binwise list read 3 October 2026 (148 half-bottles, 5 bottles of 500 ml, 3,029 standard, 348 magnums, 32 double magnums, 11 Methuselahs, 2 Balthazars, 2 Nebuchadnezzars), and how many standard bottles each holds. Key the app prints: 1 Half-bottle, 375 ml, half a bottle (the Drappier Carte d'Or half for Birthday Bubbles); 2 500 ml (the Broadbent Madeiras, the Valdespino sherry); 3 Bottle, 750 ml; 4 Magnum, 1.5 L, 2 bottles (Bollinger Special Cuvée, the Billecart 80th Anniversary Sous Bois); 5 Double magnum, 3 L, 4 bottles, called Jeroboam in Champagne (Taittinger La Française $650); 6 Methuselah, 6 L, 8 bottles, called Imperial in Bordeaux and Napa (the list prints Opus One "6L Imperial"); 7 Balthazar, 12 L, 16 bottles (Taittinger La Française $2600); 8 Nebuchadnezzar, 15 L, 20 bottles (Billecart-Salmon Réserve, $4900: "Twenty bottles of Billecart-Salmon in one").

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific comparison plate on warm parchment (#f3e9d5 to #e3d3b4), ink-brown line work (#29271f), a thin double gold hairline frame (#d5b16c).

Eight Champagne-style bottles standing in one row on a single engraved ground line, smallest on the left to largest on the right, drawn side-on, all in TRUE proportion to one another (height is what the eye must compare). Each bottle has a dark green watercolour wash, gold foil over the neck and a blank cream label with no writing, and sloping Champagne shoulders. Approximate heights to keep the proportions honest, relative to the standard bottle: half-bottle about 0.8 of the standard; 500 ml bottle about 0.9, slimmer; standard bottle 1.0; magnum about 1.2; double magnum about 1.55; Methuselah about 1.9; Balthazar about 2.35; Nebuchadnezzar about 2.55, also much wider. The 500 ml bottle (the second) is drawn as a slim, tall-necked dessert-wine bottle with straight sides and a dark red capsule instead of a Champagne shape.

Behind the row, a very faint ink grid of horizontal lines, like a measuring board, so the heights can be compared. At the far right, behind the Nebuchadnezzar, draw a small engraved wooden pouring cradle, partly visible, to hint that it is poured from a cradle.

Under each bottle, centred on the ground line, a numbered disc (ivory #f3e9d5, gold ring, dark green numeral #17382a): 1, 2, 3, 4, 5, 6, 7, 8 from left to right. No other numbers, no words, no letters, no volumes written on the bottles.
```

- **Avoid:** bottles all drawn the same width (the large formats are much wider as well as taller); exaggerated giant bottles; written volumes or names in the image (the app prints them, in two naming systems); any label text or house shape.

#### B37. The Nebuchadnezzar at the table

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `brennans-nebuchadnezzar-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, on the card "Billecart-Salmon 'Réserve' Brut NV (15 L Nebuchadnezzar)", and in "Birthday Bubbles: Champagne large formats".
- **Must teach:** the house's serve note: "Serve 43 to 46°F in tulip or white-wine glasses. The bottle must be chilled well in advance in a large tub of ice and water; it is poured from a cradle or by two staff, never lifted by one person"; "Order ahead: it needs hours to chill and two people to pour"; "Let the sommelier lead."

```
FAMILY 1, THE LIBRARY PLATE. Square, 1024 x 1024 pixels.

A 15 litre Champagne bottle (a Nebuchadnezzar: about two and a half times the height of a normal bottle and very wide) lying tilted in a heavy dark wooden pouring cradle with a brass pivot and a brass crank, set on a white linen-covered side table. The bottle is dark green, with gold foil over the neck and a blank cream label with no readable words. Its neck is tipped down over a row of six tulip-shaped Champagne glasses on a silver tray; one glass is being filled with pale gold sparkling wine with a fine bead. Two pairs of server's hands are visible: one pair turning the cradle's crank, one pair steadying a glass beneath the neck; clean hands, no rings, white cuffs under black sleeves; no faces.

To the left, a large polished oval metal tub holding ice and water, empty now, with beads of condensation, showing where the bottle was chilled. A calm deep forest-green background in shadow, warm candle light from the left, soft rim light behind. No lettering, numerals or words anywhere.
```

- **Avoid:** one person lifting the bottle; a crowd or faces; spraying foam; a normal-sized bottle; readable labels or crests.

#### B38. The house glass set

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `brennans-wine-glasses-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, above "Study our list", under a heading "Our glasses"; and in the Service Ritual's "Temperatures & Glassware". The app prints the key and which wines go in each.
- **Must teach:** the glasses the pack's pour notes name across 271 wines (counts of mentions): white-wine glass (about 150), tulip (90), white Burgundy bowl (76), Bordeaux glass and large Bordeaux glass (about 125), flute (36), Burgundy bowl and large Burgundy bowl for red (about 57), dessert glass and small dessert glass (about 40), red-wine glass, the "standard red glass" of the Rhône notes (about 30), and Port glass (7). Key the app prints: 1 flute; 2 tulip (the house Champagne glass: the Rare goes in "a tulip or white-wine glass", and the cellar review adds "never a coupe"); 3 white-wine glass; 4 white Burgundy bowl (the Leflaive); 5 Burgundy bowl, for red Burgundy and Pinot Noir (the Jadot Beaune 1er Cru); 6 red-wine glass (the Châteaumar Côtes du Rhône); 7 Bordeaux glass (the 1946 Latour, "a large Bordeaux glass"); 8 small dessert glass (the Banyuls, "2 to 3 oz"); 9 Port glass.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific comparison plate of nine empty, clear crystal wine glasses on warm parchment (#f3e9d5 to #e3d3b4), drawn as fine ink-brown engravings (#29271f) with the faintest grey watercolour for the glass, a thin double gold hairline frame (#d5b16c). All nine stand on one engraved ground line in a single row, side-on at eye level with a slight ellipse at the rim, all in TRUE relative scale to one another. Each glass has a fine dotted gold line across the bowl at its correct pour level.

Left to right:
1. A flute: a tall, narrow, straight-sided bowl on a long stem; pour line at two thirds.
2. A tulip: a slim bowl that widens from the stem and then narrows again towards the rim, on a long stem; slightly wider than the flute; pour line at two thirds.
3. A white-wine glass: a medium U-shaped bowl, taller than it is wide, gently tapering at the rim; pour line at the widest third.
4. A white Burgundy bowl: a wider, rounder, slightly shorter bowl than glass 3, with a gently tapered rim; pour line at the widest point.
5. A Burgundy bowl for red: the widest glass of all, a big balloon bowl that tapers sharply to a narrower rim, on a medium stem; pour line low, at the widest point.
6. A red-wine glass: a medium, all-purpose red bowl, larger than glass 3, smaller than glass 7; pour line at the widest point.
7. A Bordeaux glass: the tallest bowl, large, with straighter, more upright sides that taper only gently to the rim, on a long stem; pour line at the widest point.
8. A small dessert-wine glass: a small tulip bowl about half the size of glass 3, on a short stem; pour line at half.
9. A Port glass: a small, narrow tulip bowl that closes in at the rim, on a short stem; pour line at half.

Under each glass, centred on the ground line, a numbered disc (ivory, gold ring, dark green numeral): 1 to 9. No other numbers, words or letters. Keep strong distinct silhouettes and generous space between the glasses so each reads at a small size.
```

- **Avoid:** a coupe anywhere; wine in the glasses (empty, with the pour line only); glasses 4 and 5 drawn alike (5 is far wider and taller); glasses 8 and 9 identical (9 is narrower at the rim); brand-specific shapes or etched logos.

#### B39. Reading an old bottle's fill level

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `bottle-ullage-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, on the four 1946 Bordeaux cards and the Rubicon 2010; and in the Library primer "Wine Trade & Aging" beside "'ullage' = fill level as provenance evidence".
- **Must teach:** the Codex primer: "'ullage' = fill level as provenance evidence; OWC = original wooden case"; the must-know: the 1946 bottles "are old and fragile: the sommelier presents, opens and decants them, and confirms they are in the cellar". The fill terms the trade uses for a Bordeaux bottle, top to bottom, which the app prints as the key: 1 into neck; 2 base of neck; 3 top shoulder; 4 high shoulder; 5 mid shoulder; 6 low shoulder. At 80 years, high or even mid shoulder is common; low shoulder is the warning, and the sommelier judges every old bottle before it is offered.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific plate on warm parchment (#f3e9d5 to #e3d3b4), ink-brown engraving (#29271f), a thin double gold hairline frame (#d5b16c).

Six identical dark glass Bordeaux bottles with high, square shoulders and a straight neck, standing in a row on one engraved ground line, drawn side-on and in section so the wine level inside each is clearly visible as a garnet-red watercolour wash with a pale air space above it. Blank aged cream labels, no writing, dark red capsules. The only difference between the bottles is the height of the wine inside:
1. wine up into the neck, close under the cork;
2. wine at the base of the neck, where the neck meets the shoulder;
3. wine at the very top of the shoulder;
4. wine a little lower, high on the shoulder;
5. wine halfway down the shoulder;
6. wine at the bottom of the shoulder, where it meets the body.
A faint dotted gold horizontal line runs across all six bottles at each level, so the drop reads as a ladder.

Under each bottle a numbered disc (ivory, gold ring, dark green numeral): 1 to 6. No other numbers, words or letters.
```

- **Avoid:** Burgundy-shaped bottles (the shoulder terms are a Bordeaux bottle's); levels that are not clearly distinct; a cloudy or brown wine (keep it garnet); text.

#### B40. Heat damage: what a cooked bottle shows

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `bottle-heat-damage-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, under the must-know "Wine program" (Katrina: "a month without power cooked about 35,000 bottles"); and in the Codex fault drills beside "Heat damage".
- **Must teach:** the house story, verbatim from the must-know: Brennan's "lost the cellar to Katrina in 2005 when a month without power cooked about 35,000 bottles, and won it back in 2021 after rebuilding to more than 15,000 bottles". What a server sees before the bottle is opened, the key the app prints: 1 a cork pushed up proud of the lip; 2 sticky dried wine seeping under and down the capsule; 3 a low fill for the wine's age; 4 in the glass, a red turned brown and flat at the rim beside a sound bottle's ruby.

```
FAMILY 1, THE LIBRARY PLATE. Square, 1024 x 1024 pixels.

Two plain dark Bordeaux-shaped wine bottles side by side on a dark polished wooden table, with blank cream labels and no readable words, a calm deep forest-green background in shadow, warm candle light from the left, soft rim light behind.

The LEFT bottle is sound: its dark red capsule sits flat and clean, the wine level is into the neck. In front of it, a clear wine glass with a pour of bright ruby red wine.

The RIGHT bottle has been cooked by heat: its capsule is domed up because the cork has been pushed up proud of the glass lip; a dark, sticky, dried trail of wine has seeped from under the capsule and run a little way down the neck and onto the shoulder; the wine level inside, visible through the glass against the light, is lower, at the shoulder. In front of it, a clear wine glass with a pour of dull, brownish brick-red wine, flat and orange at the rim.

Numbered discs (ivory #f3e9d5, gold ring, dark green numeral #17382a) with fine gold leader lines, on the right bottle only: 1 on the pushed cork under the domed capsule; 2 on the seepage trail; 3 on the low wine level; 4 on the brown wine in its glass. Only the numerals 1, 2, 3, 4; no words or letters.
```

- **Avoid:** flood water, storm or ruin imagery (this is a lesson, not a memorial); mould or a broken bottle; the two wines the same colour; readable labels.

#### B41. Crystals, sediment and cork: what is in the glass

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `glass-crystals-sediment-cork-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** My restaurant, under "Guest questions" for the old reds and the Chardonnays; and in the Codex's tasting section beside "Clarity & brightness".
- **Must teach:** three things a guest may point at and ask "is there glass in my wine?", with the key the app prints: 1 tartrate crystals: clear, sugar-like crystals on the underside of a white wine's cork or in the bottom of the glass, a natural deposit and not a fault; 2 sediment in an old red: dark, fine and silty, which is why the house decants the 1946 Bordeaux "only to leave the sediment"; 3 cork crumbs: small brown flecks floating on the surface, a fault of technique, not of the wine (SERVICE: "cork dust in the wine is a fault of technique"); offer a fresh glass.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific plate on warm parchment (#f3e9d5 to #e3d3b4), ink-brown engraving (#29271f) with true-colour watercolour washes, a thin double gold hairline frame (#d5b16c). Three equal roundels side by side, each a gold-ringed circle, each showing a close magnified view:

Roundel 1: the base of a clear wine glass holding pale lemon-gold white wine, a few clear, glittering, colourless angular crystals resting on the bottom of the glass like coarse sugar; beside the glass, the wet underside of a natural cork with a scatter of the same small clear crystals stuck to it.

Roundel 2: the bottom of a clear wine glass holding garnet red wine, a fine dark purple- brown silty sediment settled in the bottom and a few dark flakes drifting just above it.

Roundel 3: the surface of a clear glass of ruby red wine seen slightly from above, with four or five small light-brown crumbs of cork floating on the surface.

Under each roundel a numbered disc (ivory, gold ring, dark green numeral): 1, 2, 3. No other numbers, words or letters.
```

- **Avoid:** shards of real glass; making the crystals look dirty or the sediment look like mould; health or allergen claims of any kind; text.

### 4.4 What is not drawn yet, and why

- **A Brennan's place setting.** The pack carries the dress code, the meals and the service notes, but nothing about the cover: no charger, napkin fold, silver layout, bread plate or glass positions. A picture would be guesswork about a real restaurant's standard. Once the setting is written into the house (or the owner photographs a set table at lineup and the steps are typed in), a landscape folio from above with numerals keyed to each piece follows the same pattern as B05.
- **The Louisiana Oysters.** The pack says "Confirm at lineup how the oysters are cooked and plated, and how many come per order", so a plate would invent the count and the form. The raw Grand Isle Jewel Oysters are covered by B11 panel 2.
- **The drinks** on the Traditional Breakfast and every cocktail and wine belong to the Bartender's Ledger and the Sommelier's Codex sections of this brief. The 32 Brennan's drinks in the pack also have empty glass and garnish fields, which must be filled through the pack chain before any drink is drawn.

## 5. World Table

Paste the World Table style guide (2.1) first. These are the app's own teaching plates beyond Brennan's: doneness, herbs, the technique standards, knife cuts, knives and pans. The six revisions to existing plates are in section 8.

#### T01. Beef doneness, from rare to well done

> World Table art. Paste the World Table style guide first. Deliver as `beef-doneness-ladder-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/standards/` (published at /table/).

- **Where:** Library, Techniques, "Resting meat & slicing against the grain", and the Floor Deck cuts cards (Tenderloin, Chateaubriand, Hanger Steak). At Brennan's it serves every temperature question: the petite filet ("Ask filet temperature when you take the tasting order"), the hangers ("best medium-rare to medium"), the Chateaubriand.
- **Must teach:** the lexicon's "Key coordinates: 50 to 52°C rare beef, 55 to 57 medium-rare"; the resting standard: "It came off the heat BEFORE the target temperature, measured with a probe rather than by time". The app prints the temperatures; the art shows only colour.

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true colour, soft neutral daylight from the upper left.

In every cell, the same thick, round beef filet steak at the same size, cut cleanly in half and shown with its cut face turned toward the viewer, on bare ivory paper. In cells 2 to 6 it carries the same deep brown seared crust, so only the interior changes; cell 1 is the same steak raw, with no crust:
1. Raw, for reference: uncooked deep red throughout, no crust.
2. Rare: a thin brown crust over a cool, deep red, glossy centre that fills almost the whole face.
3. Medium-rare: a thin brown crust, a narrow band of pink, and a warm rosy-red centre across most of the face.
4. Medium: an even rosy pink centre with a wider pale pink band.
5. Medium-well: mostly pale brownish-grey with a small faint pink core.
6. Well done: an even grey-brown throughout, no pink.

The six numerals are the only marks: no words, labels, thermometers or text.
```

- **Avoid:** a thick grey band under the crust in panels 2 to 4; juice pooling on the paper; brown meat in panel 1.

#### T02. The French herbs

> World Table art. Paste the World Table style guide first. Deliver as `french-herbs-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Plates wall, The pantry; the Library's Herb & Chile Atlas terms. At Brennan's: fines herbes on the Louisiana Crab Claws; tarragon in béarnaise, Choron and Foyot; parsley on the Grand Isle Jewel Oysters.
- **Must teach:** chervil "a lace-leaved cousin of parsley ... Nothing else in the fines herbes quartet, with parsley, chives and tarragon, is lost so easily"; tarragon "French tarragon is a sterile plant ... reduced into the base of a bearnaise"; "Herb Profiles": the bright register (parsley, chervil, tarragon) against the resinous (rosemary, thyme).

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike botanical watercolour over fine graphite, true fresh greens, soft daylight from the upper left, each herb as a small loose bunch of fresh cut sprigs lying on the paper.

1. Flat-leaf parsley: bright green, flat, deeply toothed three-part leaves on slender stems.
2. Chervil: very fine, soft, lacy, pale green leaves, more delicate and feathery than parsley.
3. Chives: a neat bundle of long, hollow, slender, dark green blades, a few with a round pale purple flower head.
4. French tarragon: slim upright stems with long, narrow, smooth, glossy, pointed dark green leaves.
5. Thyme: short woody stems crowded with tiny, oval, grey-green leaves.
6. Rosemary: stiff woody sprigs with dense, needle-like, dark green leaves, silvery beneath.

The six numerals are the only marks: no words, labels or text.
```

- **Avoid:** curly parsley; coriander (cilantro) in panel 1 or 2; garlic chives with flat blades.

#### T03. Searing: the hard crust, and the grey fault

> World Table art. Paste the World Table style guide first. Deliver as `searing-standard-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in WorldTable `static/standards/` (published at /table/).

- **File:** `searing-standard-v1.webp`, 1536 x 1024, landscape folio (pair). This is the first run of series S01.
- **Where:** Library, Techniques, "Searing: the hard crust", in the standard's done-right marks and fault.
- **Must teach:** "Deep even brown across the whole face, edge to edge ... no pale ring left around a browned centre, and no black patches"; "the browned band is thin, a few millimetres at most, sitting straight on top of correctly cooked interior; a thick grey collar under the crust means the heat was too low for too long". Fault: "the food released its water and sat in it: the surface goes grey and steams, it sticks when moved".

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two equal cells side by side divided by a hairline gold rule, a dark brown serif numeral centred under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left.

1. Done right: above, a thick strip steak in a black cast-iron pan, the top face turned to show a deep, even, mahogany-brown crust from edge to edge with no pale ring; below, the same steak cut across, showing a thin brown crust of a few millimetres sitting directly on an even rosy-pink interior.
2. The fault: above, the same steak in a crowded pan sitting in a shallow pool of grey liquid, its face patchy grey-brown and wet with a pale ring round the edge; below, the same steak cut across, showing a weak crust over a thick grey band that runs well into the meat before a small pink centre.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** black burnt patches in panel 1; smoke clouds; a brand mark on the pan.

#### T04. Resting and slicing against the grain

> World Table art. Paste the World Table style guide first. Deliver as `resting-slicing-standard-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in WorldTable `static/standards/` (published at /table/).

- **File:** `resting-slicing-standard-v1.webp`, 1536 x 1024, landscape folio (pair). Series S01.
- **Where:** Library, Techniques, "Resting meat & slicing against the grain".
- **Must teach:** "The board is nearly dry when it is finally cut. A spreading pool means it was cut too early"; "The grain was found and the knife went ACROSS it, so the fibres are cut short". Fault: "It was cut straight off the heat ... it runs out onto the board". Lexicon on hanger and skirt: "slice thin against their very obvious grain".

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two equal cells side by side divided by a hairline gold rule, a dark brown serif numeral centred under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. Each cell shows a plain pale wooden board from about 45 degrees above with a cooked hanger steak on it, its long coarse grain clearly visible as parallel lines along the meat.

1. Done right: the rested steak sliced straight across the grain into neat slices, each cut face showing short, fine, cross-cut fibres and an even pink interior; the board almost dry, with only a faint sheen.
2. The fault: the same steak cut too soon and along the grain into long, stringy strips with the fibres running the length of each slice, and a wide pool of red juice spreading across the board.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** a knife or hand in the picture; a different cut of beef between the two cells.

#### T05. Sugar stages, by the cold-water test

> World Table art. Paste the World Table style guide first. Deliver as `sugar-stages-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/standards/` (published at /table/).

- **Where:** Library, Techniques, "Sugar stages & caramel" (a technique with no film), and linked from the house's Bananas Foster and pralines on the bread pudding.
- **Must teach:** lexicon: "thread 110°C (syrups), soft ball 113 to 116 (fudge, pralines, Italian meringue), firm/hard ball 120 to 130 (caramels, nougat), soft/hard crack 132 to 154 (toffee, brittle, spun sugar), then true CARAMEL 160 to 180°C"; the standard: "consecutive stages are a few degrees apart and look identical in the pan", hence the test. The app prints the temperatures.

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left.

Cells 1 to 5 each show the same small clear glass bowl of cold water, seen from about 45 degrees above, with a spoonful of hot sugar syrup dropped into it, so only the result changes. Cell 6 shows the pan.
1. Thread: the syrup falling from a spoon in a fine, soft, clear thread that does not form a ball.
2. Soft ball: a small clear ball of syrup in the water that slumps and flattens when lifted on a fingertip.
3. Hard ball: a firm, clear ball that holds its round shape when lifted.
4. Soft crack: the syrup set into clear, firm strands that bend before they break.
5. Hard crack: the syrup set into brittle, glass-clear threads, one snapped cleanly in two.
6. Caramel: a small heavy pan of clear, glossy, deep amber liquid caramel, its colour even, a faint wisp of steam.

The six numerals are the only marks: no words, labels, thermometers or text.
```

- **Avoid:** colour in panels 1 to 5 (syrup stays clear until caramel); a burnt, black caramel in panel 6.

#### T06. The classical knife cuts

> World Table art. Paste the World Table style guide first. Deliver as `knife-cuts-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Library, Techniques, "Knife cuts: dice, julienne, bias", and the lexicon term "Knife Cuts: The Classical Ladder".
- **Must teach:** "BRUNOISE (3mm dice) ... JULIENNE (matchsticks 3mm × 5cm) and BATONNET (6mm × 6cm, the fry); small/medium/large DICE (6/12/20mm) ... CHIFFONADE (herbs and leaves rolled and sliced into ribbons)"; the standard: "Take any three pieces from anywhere in the pile: they match closely enough in every dimension that you would have to measure them to argue otherwise."

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. Every cell is drawn at exactly the same scale, so the sizes compare, and cells 1 to 5 all use bright orange carrot.

1. Brunoise: a small neat pile of tiny, perfect carrot cubes, all identical, the smallest dice on the plate.
2. Small dice: a pile of carrot cubes twice the size of panel 1, all identical.
3. Medium dice: a pile of carrot cubes twice the size of panel 2, all identical.
4. Julienne: a neat bundle of thin, square-sided carrot matchsticks, all the same length and thickness.
5. Batonnet: a neat stack of carrot sticks twice as thick as the julienne and a little longer, square-sided like a chip.
6. Chiffonade: a small loose heap of fine ribbons of fresh green basil, cut cleanly with no bruising, and a few basil leaves rolled into a tight cigar beside them.

Clean, flat, sharp cut faces throughout. The six numerals are the only marks: no rulers, words, labels or text.
```

- **Avoid:** uneven or wedge-shaped pieces; a ruler (the app gives the millimetres); bruised black edges on the basil.

#### T07. Six kitchen knives

> World Table art. Paste the World Table style guide first. Deliver as `kitchen-knives-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Plates wall, a new "The kit" group or The pantry; the Library's Knife & Equipment Atlas terms.
- **Must teach:** chef's knife "The 8 to 10 inch generalist ... a curved belly built for ROCK-CHOPPING"; santoku "shorter (5 to 7"), flat-profiled, sheep's-foot tip"; nakiri "the rectangular VEGETABLE knife, thin, flat"; paring "(3 to 4"): in-hand work"; boning "(5 to 6", stiff or semi-flex): rides bones and seams"; bread knife "(9 to 10", serrated)".

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Precise natural-history watercolour over fine graphite, polished steel and plain dark wooden handles, soft daylight from the upper left. Each knife lies flat in profile, blade pointing right, edge down, all drawn to the same scale so their lengths compare.

1. Western chef's knife: an 8 to 10 inch blade, broad at the heel, with a pronounced curved belly rising to a pointed tip, a full bolster.
2. Santoku: a shorter, 5 to 7 inch blade with a straight, flat edge and a spine that curves down to meet it in a rounded sheep's-foot tip, a row of shallow oval dimples along the edge.
3. Nakiri: a thin rectangular vegetable blade with a straight flat edge and a squared blunt tip.
4. Paring knife: a small 3 to 4 inch pointed blade.
5. Boning knife: a narrow, slightly flexible 5 to 6 inch blade curving up to a fine point.
6. Bread knife: a long 9 to 10 inch straight blade with a scalloped serrated edge and a rounded tip.

The six numerals are the only marks: no words, maker's marks, logos, engravings or text on blades or handles.
```

- **Avoid:** any engraved brand or kanji on the blades; Damascus patterns; a cleaver in place of the nakiri.

#### T08. Pot and pan shapes, and why they differ

> World Table art. Paste the World Table style guide first. Deliver as `pot-shapes-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** the Library term "Pot Shapes: Saucier, Rondeau, Stock & Why Geometry Matters", and Techniques "Reducing a sauce" (a technique with no film).
- **Must teach:** "SAUCEPAN: tall walls, less evaporation"; "SAUCIER: flared, rounded corners a whisk can actually reach"; "RONDEAU/BRAISER: wide, shallow, two-handled"; "STOCKPOT: tall and narrow ON PURPOSE, minimal evaporation"; "SAUTÉ PAN (straight walls) vs. SKILLET (flared)"; "Choosing the pot IS choosing the evaporation rate".

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows with hairline gold rules and tiny gold stars at the crossings, a dark brown serif numeral centred under each subject. Precise natural-history watercolour over fine graphite, brushed stainless steel with true reflections, soft daylight from the upper left. Each vessel is seen from the same slight side angle, empty, all drawn to one scale so their proportions compare.

1. Saucepan: tall straight sides, a single long handle.
2. Saucier: a single long handle, sides that flare outward from a rounded bottom with no sharp corner where wall meets base.
3. Rondeau: very wide and shallow, straight low sides, two short loop handles.
4. Stockpot: much taller than it is wide, straight sides, two loop handles.
5. Sauté pan: a flat base, straight vertical sides of moderate height, a single long handle and a small helper handle opposite.
6. Skillet: a flat base and low sides that flare outward, a single long handle.

The six numerals are the only marks: no words, logos, maker's marks or text.
```

- **Avoid:** lids; food in the pans; non-stick black coatings; a wok.

## 6. The Bartender's Ledger

Paste the Ledger style guide (2.2) first. The bar's own canon: garnish cuts, glassware, the coffee bar's milk drinks, ice, tools, six techniques and the density ladder. All are brass plates (Family 2).

#### L01. Garnish cuts I: citrus

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `garnish-citrus-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** More, Notes, in a new "Garnish" panel beside the Technique Plates; linked from the garnish line of every ticket that names a citrus cut. The app prints the legend.
- **Must teach:** The cut a ticket names. The data's counts: "Lemon twist" 44, "Lime wheel" 22, "Orange twist" 20, "Lime wedge" 18, "Orange slice" 8, "Lemon wheel" 5, "Orange peel" 4 plus "Expressed orange peel" 3 and "Flamed orange peel" 2, "Lemon wedge" 4. The glossary: "Twist: A strip of citrus peel, expressed and often curled over the drink. Ask for it 'no pith' and mean it." "Wheel: A full round slice of citrus, slit to sit on the rim." Legend the app will print: 1 Lemon twist, 2 Orange twist, 3 Wide orange peel (for expressing or flaming), 4 Lime wheel, 5 Lemon wheel, 6 Lime wedge, 7 Lemon wedge, 8 Orange slice (half wheel).

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of eight citrus garnish cuts, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. The citrus is tinted with transparent watercolour in its TRUE colours inside the engraved lines: lemon yellow, orange orange, lime green, white pith, translucent pale flesh with visible segments. Everything else stays brass line on green.

Two columns, four rows, each cut drawn large, alone, seen from slightly above, with a soft engraved shadow:
1. Lemon twist: a long, narrow strip of yellow zest, no white pith, curled into a loose corkscrew spiral.
2. Orange twist: the same long narrow corkscrew strip in orange zest.
3. Wide orange peel: a broad oval coin of orange zest the size of a large coin, skin side up, cut thin with only a whisper of white pith on the underside, edges neatly trimmed.
4. Lime wheel: a full round cross-section slice of lime, rind ring and segments visible, with one straight slit cut from the edge to the centre so it can sit on a rim.
5. Lemon wheel: the same full round slice in lemon, with the slit.
6. Lime wedge: a lengthwise eighth of a lime, a boat shape with rind on the back and flesh on the two cut faces, a small notch cut across the flesh so it can sit on a rim.
7. Lemon wedge: the same lengthwise wedge in lemon, with the notch.
8. Orange slice: a half-moon, half of a round orange wheel, rind on the curved edge.

Beside each cut, small, the numeral of its position in brass classical serif capitals: 1, 2, 3, 4, 5, 6, 7, 8. No other numerals, no words, no letters. Keep each cut clearly separate with generous space, so the shapes read at a small size.
```

- **Avoid:** thick pith on twists and peels; a wedge with no notch or a wheel with no slit; grapefruit (not in this set); text labels.

#### L02. Garnish cuts II: the rest of the rail

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `garnish-rail-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** The same Garnish panel as L01, second plate.
- **Must teach:** The non-citrus garnishes the data names most: "Grated nutmeg" 13, "Brandied cherry" 10, "Mint sprig" 4, "Mint bouquet" 3 and "Big mint bouquet, straw beside it", "3 coffee beans", "Three olives on a pick", "Cocktail onion (or three)", "Pineapple + cherry" 5. Legend the app will print: 1 Brandied cherry, 2 Mint sprig, 3 Mint bouquet, 4 Grated nutmeg, 5 Three coffee beans, 6 Olives on a pick, 7 Cocktail onions on a pick, 8 Pineapple wedge with a cherry.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of eight cocktail garnishes, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. Each garnish is tinted with transparent watercolour in its TRUE colours inside the engraved lines; everything else stays brass line on green.

Two columns, four rows, each garnish drawn large and alone with a soft engraved shadow:
1. A brandied cherry: one dark, glossy, deep burgundy-black cherry with its stem, not a bright red candied cherry.
2. A mint sprig: one stem of fresh spearmint with four to six leaves, bright green.
3. A mint bouquet: a full, tight bunch of fresh mint tops, the stems gathered together, leaves fanning upward like a small posy.
4. Grated nutmeg: a whole nutmeg seed with its marbled brown interior showing on one grated face, beside a small fine metal rasp grater, with a dusting of grated nutmeg.
5. Three whole roasted coffee beans, glossy dark brown, grouped close together.
6. Three green olives speared on a plain metal cocktail pick.
7. Three small white pearl cocktail onions speared on a plain metal cocktail pick.
8. A pineapple wedge: a small triangle of pineapple with its skin and a cut notch, a brandied cherry pinned to it with a plain pick.

Beside each garnish, small, the numeral of its position in brass classical serif capitals: 1, 2, 3, 4, 5, 6, 7, 8. No other numerals, no words, no letters. Generous space between.
```

- **Avoid:** bright red maraschino cherries for item 1 (the data says brandied); paper umbrellas; decorative plastic picks.

#### L03. Glassware I: stemmed and specialty

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `glassware-stemmed-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** More, Behind the Stick reference, the Glassware cards (`js/data-service.js`, domain `glassware`), above the Stemmed and Specialty groups. The app prints the legend.
- **Must teach:** The shapes and their relative sizes. Data capacities: Coupe "6-7 oz modern; 4-5 oz vintage"; Nick & Nora "5-6 oz"; Martini / Cocktail "6-10 oz"; Flute "6-8 oz"; Port / Sherry (Copita) "4-6 oz"; Cordial / Pony "2-3 oz"; Copper Mug "12-16 oz"; Julep Cup / Tin "10-12 oz"; Hurricane "15-20 oz"; Tiki Mug "12-16 oz". Legend: 1 Coupe, 2 Nick & Nora, 3 Martini, 4 Flute, 5 Copita, 6 Cordial, 7 Copper mug, 8 Julep cup, 9 Hurricane, 10 Tiki mug.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of ten empty bar glasses and cups, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. All drawn empty, seen straight from the side at eye level, to the SAME TRUE RELATIVE SCALE so their sizes can be compared, each standing on a short engraved ground line.

Two columns, five rows:
1. Coupe: a shallow, wide, rounded bowl on a stem.
2. Nick & Nora: a small, deep, bell-shaped bowl on a slender stem, smaller than the coupe.
3. Martini glass: a wide, straight-sided V-shaped cone on a stem.
4. Champagne flute: a tall, narrow bowl on a long stem.
5. Copita: a small sherry glass, a narrow tulip bowl that closes in at the top, on a stem.
6. Cordial glass: a tiny stemmed glass with a small straight bowl, the smallest here.
7. Copper mug: a straight-sided metal mug with a sturdy handle, its copper shown as a warm copper watercolour wash, the only colour on the plate besides item 8.
8. Julep cup: a straight-sided metal cup with a small rolled rim and a beaded base, no handle, in a pale silver-pewter wash.
9. Hurricane glass: a tall, curvy glass that swells, narrows and flares like a lamp chimney, on a short stem and foot, the tallest here.
10. Tiki mug: a tall ceramic mug shaped as a plain carved totem with simple geometric grooves and no face, drawn in line only.

Beside each item, small, its numeral in brass classical serif capitals: 1 to 10. No other numerals, no words, no letters. Strong silhouettes, generous space between.
```

- **Avoid:** a carved face on the tiki mug (keep it abstract); different scales; liquid; text.

#### L04. Glassware II: rocks, tall, beer and wine

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `glassware-rocks-tall-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** The same Glassware reference, above the Rocks & Tall and Beer & Wine groups.
- **Must teach:** Data capacities: Rocks / Old Fashioned "6-9 oz"; Double Rocks (DOF) "12-14 oz"; Highball "8-12 oz"; Collins "10-14 oz"; Shot Glass "1 1/2 oz standard"; Shaker Pint "16 oz to the rim"; Nonic Pint "16 oz US nonic, 20 oz imperial"; Wine, White "12-14 oz"; Wine, Red "18-24 oz". And "The real difference between a Collins and a highball is about two inches of head room." Legend: 1 Rocks, 2 Double rocks, 3 Highball, 4 Collins, 5 Shot glass, 6 Shaker pint, 7 Nonic pint, 8 White wine glass, 9 Red wine glass.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of nine empty glasses, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. All drawn empty, straight from the side at eye level, to the SAME TRUE RELATIVE SCALE, each on a short engraved ground line. Clean glass shown with fine highlight lines and hatching.

Three columns, three rows:
1. Rocks glass: short, straight-sided, heavy thick base.
2. Double rocks: the same shape, wider and a little taller, heavy base.
3. Highball: tall, narrow, straight-sided.
4. Collins: the same width as the highball but clearly taller, about two inches more.
5. Shot glass: tiny, thick-walled, slightly tapered.
6. Shaker pint: a plain conical pint glass, wider at the rim.
7. Nonic pint: a pint glass with a pronounced bulge ring a little below the rim.
8. White wine glass: a medium U-shaped bowl on a stem.
9. Red wine glass: a large, wide, rounded bowl on a stem, the biggest bowl here.

Beside each glass, small, its numeral in brass classical serif capitals: 1 to 9. No other numerals, no words, no letters. Strong silhouettes and generous space between them.
```

- **Avoid:** a highball and a Collins of the same height; branded beer glass shapes; liquid.

#### L05. The milk drinks, in section

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `coffee-milk-drinks-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** More, Coffee and Tea, the reference cards (`COFFEE_REF`), above the With Milk group. The app prints the legend.
- **Must teach:** What sits in each cup. Data: Espresso "Warmed demitasse, 2 to 3 oz", double "1.2 to 1.4 oz"; Macchiato: "a single dollop onto the middle of the shot", "Warmed demitasse at the 3 oz end"; Cortado: "Warmed and barely textured", "a skin of foam rather than a layer", "The 4.5 oz Gibraltar glass, a small straight tumbler with no handle"; Flat White: "The foam layer is thin, under about a quarter inch", "Warmed 5 to 6 oz tulip cup with a handle"; Cappuccino: "The cap runs about a third to a half inch", "5 to 6 oz cup with a handle, on a saucer"; Latte: "thin foam layer around a quarter inch", "8 to 12 oz cup or a tall glass". Legend: 1 Espresso, 2 Macchiato, 3 Cortado, 4 Flat white, 5 Cappuccino, 6 Latte.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique manual plate of six espresso drinks shown as clean cutaway cross-sections, each cup sliced in half vertically so the layers inside are visible, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. Inside each cutaway, transparent watercolour in TRUE colours: espresso deep brown, crema a reddish hazelnut band, steamed milk warm cream-white, foam a lighter matte white. All cups to the same true relative scale. Two columns, three rows:

1. Espresso: a small handled demitasse cup on a saucer, holding a shallow layer of dark espresso with a thin hazelnut crema on top.
2. Macchiato: the same small demitasse, the espresso and crema, with one small white dollop of milk foam sitting in the middle of the surface.
3. Cortado: a small straight glass tumbler with no handle; the lower half espresso, the upper half warm milk, with only a very thin skin of foam on top.
4. Flat white: a medium handled tulip-shaped cup; espresso at the bottom, then smooth milk filling the cup, with a very thin foam line at the top.
5. Cappuccino: a medium handled cup on a saucer, the same size as the flat white; espresso at the bottom, milk, and a clearly thicker foam cap on top, about twice the flat white's.
6. Latte: a taller, larger handled cup; a little espresso at the bottom, a deep body of milk, and a thin foam layer on top.

Beside each cup, small, its numeral in brass classical serif capitals: 1 to 6. No other numerals, no words, no letters, no latte art patterns. Generous space between.
```

- **Avoid:** latte art (the lesson is the layers); a flat white and a cappuccino with the same foam depth; a cortado in a handled cup.

#### L06. Ice

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `ice-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** More, Notes, "Technique: The Mechanics", beside the "Ice" row.
- **Must teach:** Data: "Big cold dry ice dilutes slowly; wet small ice dilutes fast. Large cube for rocks, cracked for shaking, crushed for juleps and tiki. Never scoop with the glass." Rocks glass: "Most singles take a 1 1/4-1 1/2 inch cube; a 2-inch cube needs a double." Legend: 1 Large cube, 2 Cubed, 3 Cracked, 4 Crushed.

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate of four kinds of bar ice, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. The ice is drawn with crisp highlight lines and the faintest pale blue-white transparent wash so it reads as clear, cold and dry.

Two columns, two rows, each a small heap on its own engraved ground line, to the same scale:
1. One large clear cube, about two inches on each side, sharp edges, glass-clear.
2. A small pile of standard cubes, each about one and a quarter inches, slightly frosted.
3. A pile of cracked ice: irregular chunks about the size of a thumbnail, sharp broken faces.
4. A mound of crushed ice: fine, snowy, pebble-sized fragments, the smallest pieces.

Beside each, small, its numeral in brass classical serif capitals: 1, 2, 3, 4. No other numerals, no words, no letters.
```

- **Avoid:** glasses or drinks; melting puddles (the lesson prizes dry ice); spheres (not in the data).

#### L07. The bar tools

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `bar-tools-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** More, Notes, at the head of "Technique: The Mechanics"; also the Barback level's Technique and Method page.
- **Must teach:** The names a barback hears. Data: "Jigger: The hourglass measuring cup"; "Bar spoon: Long spiral-handled spoon; also a unit of measure, about 1/6 oz (5 ml)"; "Hawthorne strainer: The spring-rimmed strainer that fits a shaking tin"; "Straining: Hawthorne for shaken, julep for stirred, double strain anything shaken with citrus or herbs going 'up'"; muddling "Press, twist a quarter turn, lift". Legend: 1 Shaking tins, 2 Mixing glass, 3 Jigger, 4 Barspoon, 5 Hawthorne strainer, 6 Julep strainer, 7 Fine strainer, 8 Muddler, 9 Y-peeler, 10 Channel knife.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of ten bar tools, drawn as fine, technically accurate copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. Steel is shown by crisp highlight lines and hatching; no colour. Plain, unbranded tools.

Two columns, five rows, each tool drawn large and alone, at a slight angle, to a sensible relative scale:
1. Shaking tins: a large metal tin and a smaller metal tin, side by side, open ends up.
2. A mixing glass: a heavy, straight-sided glass beaker with a pouring lip.
3. A jigger: a double-ended hourglass measure, a larger cup and a smaller cup joined at their bases, with faint measuring lines inside.
4. A barspoon: a very long, thin spoon with a tightly twisted spiral handle and a small teardrop-shaped bowl.
5. A Hawthorne strainer: a flat perforated metal disc with a coiled wire spring running around its edge, a short handle, and two small tabs.
6. A julep strainer: a shallow, perforated, spoon-shaped metal bowl with a short handle, no spring.
7. A fine strainer: a small conical fine-mesh sieve with a handle.
8. A muddler: a straight, sturdy wooden rod with a flat, blunt end.
9. A Y-peeler: a peeler with a Y-shaped frame and a horizontal blade across the top.
10. A channel knife: a short handle with a small notched blade that cuts a thin groove.

Beside each tool, small, its numeral in brass classical serif capitals: 1 to 10. No other numerals, no words, no letters, no logos.
```

- **Avoid:** a muddler with a rounded spoon-like head (the fault in Plate VII today); a three-piece cobbler shaker in place of tins; brand marks.

#### L08. Technique: the hard shake

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `technique-shake-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** More, Notes, Technique Plates, as a new plate; linked from every ticket whose method starts "Shake".
- **Must teach:** Data: "Shake anything with citrus, egg, cream, or juice." "Fresh ice 2/3 full, seal at an angle, shake HARD 10 to 15 seconds until the tin frosts." Three steps top to bottom: fill, seal, shake to frost.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate showing how to shake a cocktail, in three numbered steps stacked from top to bottom, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. Hands are anonymous engraved line, no rings, cuffs plain.

Step 1, top: a large metal shaking tin standing on the bar, about two thirds full of fresh cubed ice, a smaller tin beside it holding the measured drink.
Step 2, middle: the small tin set into the large tin at a slight angle, one hand pressing down firmly on top to seal them.
Step 3, bottom: two hands holding the sealed tins horizontally at shoulder height, one hand capping each end, fine motion lines showing a hard back-and-forth shake, and a fine white frost visible across the outside of the metal.

Beside each step, small, its numeral in brass classical serif capitals: 1, 2, 3. No other numerals, no words, no letters. Each step in its own band with space between.
```

- **Avoid:** a cobbler shaker; a person or face; the tins shaken upright over the head.

#### L09. Technique: the stir

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `technique-stir-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** Technique Plates; linked from tickets whose method starts "Stir".
- **Must teach:** Data: "Stir anything all-spirit." "Barspoon rides the wall; ice moves as one silent mass. 30 to 45 seconds; taste with a straw to check dilution." Straining: "julep for stirred".

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate showing how to stir a cocktail, one figure, drawn as a fine copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin.

A heavy glass mixing beaker full of cubed ice and a clear amber liquid (a transparent amber watercolour wash, the only colour). A long barspoon with a twisted spiral handle stands in it, its back pressed against the inside wall of the glass. One anonymous engraved hand holds the spoon lightly between the fingertips near the top of the handle. A single fine curved arrow drawn around the inside of the glass shows the spoon travelling smoothly around the wall, and the ice drawn as one compact mass turning together. A julep strainer rests on the bar beside the glass, ready.

No numerals, no words, no letters.
```

- **Avoid:** a spoon churning up and down; splashes; a fist grip.

#### L10. Technique: build and one lift

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `technique-build-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** Technique Plates; linked from tickets whose method starts "Build".
- **Must teach:** Data: "Build: To make a drink directly in its serving glass, no shaker or mixing glass"; "Carbonation is fragile. Cold glass, cold mixer, gentle build, one lift of the barspoon, never a hard stir." (the data's dash replaced by a comma). Gin & Tonic: "Build over ice, one gentle lift". Steps: ice, spirit, mixer down the spoon, one lift.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate showing how to build a highball, in three numbered steps stacked from top to bottom, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. Liquids as faint transparent washes.

Step 1, top: a tall highball glass filled to the top with cubed ice, and a jigger pouring a measure of clear spirit over the ice.
Step 2, middle: a plain unlabelled bottle of sparkling mixer tilted to pour gently down the twisted handle of a barspoon that stands in the glass, small bubbles rising.
Step 3, bottom: the barspoon being raised once, slowly, from the bottom of the glass to the top, shown by one single upward arrow; the drink full of fine bubbles.

Beside each step, small, its numeral in brass classical serif capitals: 1, 2, 3. No other numerals, no words, no letters, no labels.
```

- **Avoid:** a shaker; vigorous stirring marks; a labelled bottle.

#### L11. Technique: the swizzle

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `technique-swizzle-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** Technique Plates; linked from the swizzles and juleps (Queen's Park Swizzle, Chartreuse Swizzle, 151 Swizzle, Mojito and the juleps).
- **Must teach:** Data: "Swizzle: A crushed-ice drink churned with a swizzle stick (traditionally a branch of the Caribbean swizzlestick tree) until the glass frosts." Methods: "Swizzle in crushed ice until frosted"; Queen's Park Swizzle glass "Collins", garnish "Mint + the bitters float".

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate showing how to swizzle, one figure, drawn as a fine copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin.

A tall Collins glass packed with crushed ice and a pale drink. Plunged deep into it is a traditional swizzle stick: a slim natural wooden twig with four or five short prongs radiating flat from its lower end like the spokes of a small wheel. Two anonymous engraved hands hold the top of the stick between flat palms, rubbing it back and forth so it spins, shown by fine curved motion arrows, while it moves slowly up and down. A dense white frost covers the outside of the glass, drawn with fine stipple. A sprig of mint, tinted true green, sits ready on the bar beside the glass.

No numerals, no words, no letters.
```

- **Avoid:** a barspoon in place of the swizzle stick; a plastic swizzle stirrer; a dry, clear glass (the frost is the signal).

#### L12. Technique: flaming an orange peel

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `technique-flame-peel-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** Technique Plates; linked from "Flamed orange peel" (Cosmopolitan, Oaxaca Old Fashioned).
- **Must teach:** Data: "flame orange peels through a match for caramelized oil"; the quiz: "Skin-side down over the glass, one sharp snap ... flaming a peel is a real move (DeGroff's Cosmo), but fire caramelizes the oil. Expressing is the plain default." Steps: warm the peel, snap through the flame, wipe the rim.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate showing how to flame an orange peel over a cocktail, in three numbered steps stacked from top to bottom, drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. Only the orange peel (true orange) and the small flame (warm yellow-orange) carry colour.

Step 1, top: one anonymous hand holds a lit wooden match a few centimetres above a stemmed coupe; the other hand holds a wide oval coin of orange peel, skin side facing the flame, warming it gently.
Step 2, middle: the fingers pinch the peel sharply; a fine spray of oil passes through the match flame and flares as a brief bright burst of tiny sparks over the drink's surface.
Step 3, bottom: the peel's skin is run around the rim of the glass, the match already blown out, a thin thread of smoke rising from it.

Beside each step, small, its numeral in brass classical serif capitals: 1, 2, 3. No other numerals, no words, no letters. The flame is small and controlled, never a large fire.
```

- **Avoid:** a lighter or torch; a large flame; burning liquid; anything that suggests setting a drink alight.

#### L13. Technique: rolling between tins

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `technique-roll-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** Technique Plates; linked from the Bloody Mary family (Bloody Mary, Bloody Maria, Caesar). Relevant to Brennan's two Bloody drinks.
- **Must teach:** Data: "Rolling: Pouring a drink back and forth between tins to mix with minimal aeration, the Bloody Mary's method, since shaking foams tomato." (the data's dash replaced by a comma). The Bloody Mary: "Roll between tins, never shake" (dash replaced).

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate showing how to roll a drink, one figure, drawn as a fine copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin.

Two anonymous engraved hands hold two metal shaking tins, one high and one low, about a forearm's length apart. A smooth, unbroken, rope-like stream of tomato-red liquid (true tomato red, a transparent wash, the only colour) pours from the upper tin, which is fitted with a Hawthorne strainer holding the ice back, into the lower tin. A gentle curved double arrow beside them shows the liquid going back and forth between the tins. No splashes, no foam.

No numerals, no words, no letters.
```

- **Avoid:** shaking motion lines; frothy foam; a long theatrical throw.

#### L14. The density ladder

> Bartender's Ledger art. Paste the Ledger style guide first. Deliver as `density-ladder-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in bartendersledger `img/plates/` (published at /ledger/).

- **Where:** More, Shots and Zero Proof, the Shot Board, beside the density table (`LAYER_LADDER`); the app prints the legend with each figure.
- **Must teach:** Data: "Rough specific gravity ladder: the physics behind every layered shot" (the data's dash replaced by a colon). Eleven rungs, heaviest at the bottom. Legend, from the bottom up: 1 Grenadine and syrups (about 1.18), 2 Crème de cassis and noyaux (1.16), 3 Coffee liqueur (1.15), 4 Crème de menthe and cacao (1.12), 5 Butterscotch and peach schnapps (1.08), 6 Irish cream (1.05), 7 Amaretto and Frangelico (1.04), 8 Orange liqueur (1.03), 9 Green Chartreuse (1.01), 10 Whiskey, rum, vodka at 80 proof (0.95), 11 Overproof spirits (0.90). "Spirits are LIGHTER than water. Always the crown, never the base."

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique scientific plate showing a single tall, narrow, straight-sided glass cylinder, like a laboratory specimen jar, standing in the centre on an engraved base, filled with eleven perfectly separate horizontal liquid layers of equal thickness, drawn as a fine copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. Each layer is a transparent watercolour wash in its TRUE colour, with a crisp clean line between layers. From the bottom up:
1. Bright pomegranate red (grenadine).
2. Very dark purple-red (crème de cassis).
3. Deep opaque coffee brown (coffee liqueur).
4. Mint green (crème de menthe).
5. Pale golden amber (butterscotch schnapps).
6. Opaque milky beige (Irish cream).
7. Clear warm amber (amaretto).
8. Clear bright orange-gold (orange liqueur).
9. Clear vivid herbal green (a green herbal liqueur).
10. Clear light amber (whiskey).
11. Clear, nearly colourless pale gold (overproof rum), the top layer.

To the left of the cylinder, a slim engraved brass arrow pointing downward from top to bottom, widening as it goes, to show increasing heaviness. To the right of each layer, small, its numeral in brass classical serif capitals: 1 at the bottom up to 11 at the top. No other numerals, no words, no letters, no labels on the cylinder.
```

- **Avoid:** a shot glass (eleven layers will not read in one); blended or swirled layers; numbering from the top.

## 7. The Sommelier's Codex

Paste the Codex style guide (2.3) first. Eleven zoom maps (C01 to C11), then the slope, the label, colour, the traditional method, bottle shapes and the first grape portrait.

**A note on every atlas entry (C01 to C11).** The reviewed atlas is built by script from Natural Earth geometry, with every point an approximate representative location and every sheet tied to named sources in `atlas-sources.html`. ChatGPT draws pictures, not geography: it does not know where Puligny lies to the nearest kilometre, and it will draw rivers that look right rather than rivers that are. So each atlas prompt below gives the true relative positions and coordinates of every point, and each entry names the sources the delivered sheet must be checked against, point by point, before it ships. **ChatGPT draws the art; the geography must be checked against the named sources.** If a draft cannot be made to agree with them, the sheet is built instead by extending `.scripts/atlas-v2/build.cjs` with a zoom window (Natural Earth rivers and coasts, the same points), and ChatGPT's draft is kept only as the visual reference. Coordinates below are approximate village centres in decimal degrees, latitude north and longitude east (west is negative); they are for placing points, not for boundaries. Every sheet is a new versioned file under `maps/atlas-zoom-v1/`, so it never overwrites a saved atlas-v2 sheet, as CLAUDE.md requires.

#### C01. Burgundy: the Côte d'Or, village by village

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `burgundy-cote-dor.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, a new "Closer look" card under the France sheet; opened from the Burgundy heading in the France guide and from "Next reading: Burgundy". The app prints the key, the scope line and the sources.
- **Must teach:** the order of the great villages from Dijon south, which explains every Burgundy on the list (Vougeraie Le Clos Blanc de Vougeot, Jadot Beaune 1er Cru, Marchand-Tawse Meursault Genevrières, Leflaive of Puligny). Côte de Nuits, north to south: 1 Marsannay (47.27, 4.99), 2 Fixin (47.24, 4.98), 3 Gevrey-Chambertin (47.23, 4.97), 4 Morey-Saint-Denis (47.20, 4.96), 5 Chambolle-Musigny (47.18, 4.95), 6 Vougeot (47.17, 4.96), 7 Vosne-Romanée (47.16, 4.95), 8 Nuits-Saint-Georges (47.14, 4.95). Côte de Beaune: 9 Aloxe-Corton (47.07, 4.86), 10 Savigny-lès-Beaune (47.06, 4.82), 11 Beaune (47.02, 4.84), 12 Pommard (47.01, 4.80), 13 Volnay (46.99, 4.78), 14 Meursault (46.98, 4.77), 15 Puligny-Montrachet (46.95, 4.75), 16 Chassagne-Montrachet (46.94, 4.73), 17 Santenay (46.91, 4.70). Reference town ring: Dijon (47.32, 5.04). The vineyards face east and south-east, on the slope west of the D974 road. Check against: BIVB, Vins de Bourgogne, appellation maps (bourgogne-wines.com); INAO appellation records; Natural Earth for any river or coast.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Côte d'Or in Burgundy, France, in the exact look of the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map panel filling the upper four fifths of the sheet, a calm empty green band below it (the app prints the key there).

The map: a narrow band of sage-ivory land (#c5c1a2 to #9aa587) running from the north-north-east down to the south-south-west, the Côte d'Or escarpment, about 50 km long, drawn as a flat strip with a thin gold edge on its east side; to the west of the strip, the higher wooded ground drawn as darker flat green (#263b2d); to the east, the flat Saône plain in the page green. No relief shading, no hills, no vine rows. Faint graticule lines. North is up, and the whole strip is slightly tilted, running from top right to bottom left.

Seventeen small ivory dots at the true relative positions below (latitude, longitude), evenly following the strip from top to bottom, each joined by a fine leader line to a numbered disc (ivory #f3e9d5, gold ring, dark green numeral #17382a) set a little to the EAST of the strip so no discs overlap: 1 (47.27, 4.99), 2 (47.24, 4.98), 3 (47.23, 4.97), 4 (47.20, 4.96), 5 (47.18, 4.95), 6 (47.17, 4.96), 7 (47.16, 4.95), 8 (47.14, 4.95), then a short gap, 9 (47.07, 4.86), 10 (47.06, 4.82), 11 (47.02, 4.84), 12 (47.01, 4.80), 13 (46.99, 4.78), 14 (46.98, 4.77), 15 (46.95, 4.75), 16 (46.94, 4.73), 17 (46.91, 4.70). A thin gold bracket on the west side groups 1 to 8 and a second bracket groups 9 to 17. At the top right, a smaller hollow gold ring with no number for the city at (47.32, 5.04). A small gold compass rose with N at the lower right of the map panel.

A small inset in the top left corner of the map panel, framed in gold hairline: the outline of France in sage ivory with a tiny gold rectangle marking where this strip lies in east-central France.

Only the numerals 1 to 17 and the letter N; no words, no place names, no title.
```

- **Avoid:** village names painted in (the app prints them); vineyards drawn as patchwork plots; a perspective or relief view; points that wander off the strip; the strip running north to south without the slight south-west lean.

#### C02. Bordeaux: Left Bank, Right Bank, and the rivers between

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `bordeaux-banks.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under France, from the Bordeaux heading; and on the cards of the 1946 Bordeaux.
- **Must teach:** the three waters and the two banks, with the communes of the list: Latour (Pauillac), Cos d'Estournel (Saint-Estèphe), Trotanoy (Pomerol), Figeac and Canon (Saint-Émilion). The Gironde estuary forms where the Garonne and the Dordogne meet north of Bordeaux. Points: 1 Saint-Estèphe (45.26, -0.77), 2 Pauillac (45.20, -0.75), 3 Saint-Julien (45.16, -0.73), 4 Margaux (45.04, -0.67), 5 Pessac-Léognan (44.75, -0.62), 6 Barsac (44.60, -0.32), 7 Sauternes (44.53, -0.34), 8 Entre-Deux-Mers, between the two rivers (44.75, -0.30), 9 Pomerol (44.93, -0.20), 10 Saint-Émilion (44.89, -0.16), 11 Fronsac (44.93, -0.27). Reference rings: Bordeaux city (44.84, -0.58), Libourne (44.92, -0.24). INTRO_CLASS: "Pomerol has NO official classification at all"; the 1855 classification ranks "Médoc reds (plus Haut-Brion)". Check against: CIVB, Vins de Bordeaux appellation map (bordeaux.com); INAO; Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Bordeaux wine region, France, in the exact look of the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map panel in the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule: the Atlantic coast as a long straight gold-edged shoreline down the left side; the land in sage ivory (#c5c1a2 to #9aa587). The Gironde estuary is a wide dark-green funnel of water running from the north-west (at the top left, opening to the Atlantic) down to the south-east, narrowing towards Bordeaux. At its southern end it divides into two rivers drawn as teal lines (#285954): the GARONNE, which continues south-east past the city at (44.84, -0.58) towards (44.50, -0.20); and the DORDOGNE, which runs east from the junction past Libourne at (44.92, -0.24) towards (44.85, 0.10). The long peninsula of land west and south-west of the estuary and the Garonne is the Left Bank; the land north and east of the Dordogne is the Right Bank; the wedge between the two rivers is Entre-Deux-Mers.

Eleven small ivory dots at these true relative positions (latitude, longitude), each joined by a fine leader to a numbered disc (ivory, gold ring, dark green numeral) placed so none overlap: 1 (45.26, -0.77), 2 (45.20, -0.75), 3 (45.16, -0.73), 4 (45.04, -0.67) all along the west shore of the estuary; 5 (44.75, -0.62) just south-west of the city; 6 (44.60, -0.32) and 7 (44.53, -0.34) on the west side of the Garonne upstream; 8 (44.75, -0.30) in the middle of the wedge between the rivers; 9 (44.93, -0.20), 10 (44.89, -0.16) and 11 (44.93, -0.27) on the Right Bank, east and north of Libourne. Two smaller hollow gold rings with no numbers for the city (44.84, -0.58) and Libourne (44.92, -0.24). A small gold compass rose with N at the lower right of the map panel.

A small inset at the top right: France in sage ivory with a tiny gold rectangle at the south-west Atlantic coast.

Only the numerals 1 to 11 and the letter N; no words, no names, no title.
```

- **Avoid:** the Garonne and Dordogne joining south of the city (they meet north of it, at the Bec d'Ambès, to form the Gironde); Pomerol and Saint-Émilion on the Left Bank; châteaux drawings; region colouring.

#### C03. Champagne: the five growing areas

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `champagne.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under France, from the Champagne heading; and at the head of "Champagne bottles" in My restaurant.
- **Must teach:** where the Champagnes on the list come from, and which grape each slope leans on. Areas: 1 Montagne de Reims, between Reims and Épernay, Pinot Noir country (49.15, 4.05); 2 Vallée de la Marne, along the Marne west of Épernay, Meunier country (49.06, 3.75); 3 Côte des Blancs, south of Épernay, Chardonnay (48.97, 4.00); 4 Côte de Sézanne, further south-west (48.72, 3.72); 5 Côte des Bar, in the Aube far to the south-east, Pinot Noir (48.15, 4.50). Reference rings: Reims (49.26, 4.03), Épernay (49.04, 3.96). The Codex: "Grand Cru and Premier Cru rank whole VILLAGES (communes), not individual vineyards as in Burgundy." The Rare is "Mostly Chardonnay"; "Champagne: the house Brennan's Essential, the Rare, ... every Birthday Bubbles bottle". Check against: Comité Champagne, the Champagne appellation area map (champagne.fr); INAO; Natural Earth for the Marne and Seine.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Champagne region, France, in the exact look of the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map panel in the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, all land in sage ivory (#c5c1a2 to #9aa587) with no coast in view. Rivers as thin teal lines (#285954): the MARNE running from the east (about 48.95, 4.40) west-north-west past Épernay (49.04, 3.96) and on west to the edge of the map near (49.05, 3.30); the VESLE passing Reims (49.26, 4.03) in the north; the SEINE flowing north-west through the far south of the map, from about (47.95, 4.45) past (48.10, 4.35) towards Troyes near (48.30, 4.08); the AUBE river running north-west near (48.25, 4.70).

Five small ivory dots at these true relative positions (latitude, longitude), each joined by a fine leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (49.15, 4.05) on the high ground between Reims and Épernay; 2 (49.06, 3.75) on the Marne west of Épernay; 3 (48.97, 4.00) just south of Épernay; 4 (48.72, 3.72) further south-west; 5 (48.15, 4.50) far to the south-east. Draw a fine dotted gold line from 4 down to 5 to show the long gap of about 100 km between the northern areas and the Côte des Bar. Two smaller hollow gold rings with no numbers for Reims (49.26, 4.03) and Épernay (49.04, 3.96). A small gold compass rose with N at the lower right of the map panel.

A small inset at the top left: France in sage ivory with a tiny gold rectangle in the north-east.

Only the numerals 1 to 5 and the letter N; no words, no names, no title.
```

- **Avoid:** drawing the Côte des Bar next to Épernay; chalk cliffs, cellars or bottles on the map; region colours; names.

#### C04. The Rhône, north and south

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `rhone-north-south.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under France, from the Rhône Valley heading; and on the Rhône cards (Pegau Châteauneuf-du-Pape, the Châteaumar Côtes du Rhône, Durban of Beaumes-de-Venise).
- **Must teach:** the two halves and their banks. Northern Rhône: 1 Côte-Rôtie (45.49, 4.81, west bank), 2 Condrieu (45.46, 4.77, west bank), 3 Saint-Joseph (a long strip on the west bank, centred near 45.17, 4.80), 4 Hermitage (45.07, 4.85, east bank, on the hill above Tain), 5 Crozes-Hermitage (around Hermitage on the east bank, 45.10, 4.88), 6 Cornas (44.96, 4.85, west bank). Southern Rhône: 7 Châteauneuf-du-Pape (44.06, 4.83, east bank), 8 Gigondas (44.16, 5.00), 9 Vacqueyras (44.14, 4.98), 10 Beaumes-de-Venise (44.12, 5.03), 11 Rasteau (44.23, 4.99), 12 Tavel (43.99, 4.70, west bank), 13 Lirac (44.03, 4.71, west bank). Reference rings: Lyon (45.76, 4.83), Valence (44.93, 4.89), Orange (44.14, 4.81), Avignon (43.95, 4.81). House notes: the Châteaumar is "Grenache-based, Rhône Valley"; Durban "is famous for its sweet Muscat". Check against: Inter Rhône, the Rhône Valley appellation map (vins-rhone.com); INAO; Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Rhône Valley, France, in the exact look of the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, an empty green band at the bottom for the app's key.

Inside the frame, two gold-ruled map panels stacked vertically: the upper panel the Northern Rhône, the lower panel the Southern Rhône, each at its own larger scale, with a fine dotted gold line between them and a small gold bar showing the gap of about 60 km. In both, north is up, flat drawing, faint graticule, land in sage ivory (#c5c1a2 to #9aa587), the RHÔNE as a clear teal line (#285954) running from north to south.

Upper panel, the northern river from about (45.80, 4.83) down to (44.90, 4.88): six small ivory dots with leaders to numbered discs (ivory, gold ring, dark green numeral): 1 (45.49, 4.81) and 2 (45.46, 4.77) on the WEST bank; 3 (45.17, 4.80), a long narrow gold-edged strip along the WEST bank from about 45.40 down to 44.95 with its dot in the middle; 4 (45.07, 4.85) on the EAST bank; 5 (45.10, 4.88) on the EAST bank just behind 4; 6 (44.96, 4.85) on the WEST bank. Hollow gold rings with no numbers for the cities at (45.76, 4.83) and (44.93, 4.89).

Lower panel, the southern river from about (44.40, 4.70) down to (43.90, 4.80), with the river widening into the plain: seven small ivory dots with leaders to numbered discs: 7 (44.06, 4.83) on the EAST bank; 8 (44.16, 5.00), 9 (44.14, 4.98), 10 (44.12, 5.03) and 11 (44.23, 4.99) to the north-east, towards a dark green flat band for the Dentelles hills (no relief); 12 (43.99, 4.70) and 13 (44.03, 4.71) on the WEST bank. Hollow gold rings with no numbers for the towns at (44.14, 4.81) and (43.95, 4.81).

A small gold compass rose with N at the lower right of the lower panel, and a small inset in the top left of the upper panel: France in sage ivory with a tiny gold line marking the Rhône corridor.

Only the numerals 1 to 13 and the letter N; no words, no names, no title.
```

- **Avoid:** Hermitage or Châteauneuf-du-Pape on the west bank, or Côte-Rôtie on the east; the two halves drawn as one continuous map at one scale; terraces or relief.

#### C05. Napa Valley: the AVAs, floor and mountains

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `napa-valley.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under California, from the Napa and Sonoma heading; and on the Napa cards (Paul Hobbs Coombsville, Inglenook Rubicon, Quintessa Rutherford, Trefethen Oak Knoll District, Duckhorn, Caymus, Opus One).
- **Must teach:** the valley floor's order south to north, and the mountains either side. Floor: 1 Los Carneros (38.25, -122.33, shared with Sonoma), 2 Coombsville (38.31, -122.26, east of Napa city), 3 Oak Knoll District (38.35, -122.32), 4 Yountville (38.40, -122.36), 5 Stags Leap District (38.41, -122.32, east side), 6 Oakville (38.44, -122.40), 7 Rutherford (38.46, -122.42), 8 St. Helena (38.50, -122.47), 9 Calistoga (38.58, -122.58). Mountains: 10 Mount Veeder (38.38, -122.42, west), 11 Spring Mountain District (38.52, -122.53, west), 12 Howell Mountain (38.56, -122.43, north-east), 13 Atlas Peak (38.45, -122.27, east). The Napa River runs down the floor into San Pablo Bay. Reference ring: Napa (38.30, -122.29). House notes: "Coombsville is one of Napa's cooler corners, so it keeps its freshness"; the Rubicon is "Rutherford, Napa Valley". Check against: the TTB's established AVA list and maps (27 CFR part 9; ttb.gov); Napa Valley Vintners AVA map (napavintners.com); Natural Earth for the bay.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of the Napa Valley, California, in the exact look of the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map panel in the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule: the valley floor as a long narrow strip of sage ivory (#c5c1a2 to #9aa587) running from San Pablo Bay at the bottom (a dark-green water shape with a thin gold shore near 38.10, -122.30) north-west up to Calistoga at the top left; the ranges either side as flat darker green (#263b2d), the Mayacamas range on the west and the Vaca range on the east. The NAPA RIVER as a thin teal line (#285954) down the middle of the floor into the bay. No relief shading.

Thirteen small ivory dots at these true relative positions (latitude, longitude), each joined by a fine leader to a numbered disc (ivory, gold ring, dark green numeral) set to the side so none overlap. On the floor, south to north: 1 (38.25, -122.33), 2 (38.31, -122.26), 3 (38.35, -122.32), 4 (38.40, -122.36), 5 (38.41, -122.32), 6 (38.44, -122.40), 7 (38.46, -122.42), 8 (38.50, -122.47), 9 (38.58, -122.58). In the hills: 10 (38.38, -122.42) and 11 (38.52, -122.53) in the western range; 12 (38.56, -122.43) and 13 (38.45, -122.27) in the eastern range. Discs 1 to 9 are ivory; discs 10 to 13 are dark green with an ivory numeral and gold ring, so floor and mountain read apart. One smaller hollow gold ring with no number for the city at (38.30, -122.29). A small gold compass rose with N at the lower right of the map panel.

A small inset at the top right: California in sage ivory with a tiny gold rectangle just north of San Francisco Bay.

Only the numerals 1 to 13 and the letter N; no words, no names, no title.
```

- **Avoid:** the valley running straight north to south (it runs north-west); Coombsville on the west side; Stags Leap on the west side; vineyard rows or wineries; Sonoma Valley drawn as part of Napa.

#### C06. The Loire, west to east

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `loire.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under France, from the Loire Valley heading.
- **Must teach:** the long river and its stations, Atlantic to centre: 1 Muscadet, around Nantes (47.15, -1.40); 2 Savennières (47.38, -0.66); 3 Anjou, around Angers (47.40, -0.50); 4 Saumur (47.26, -0.08); 5 Chinon (47.17, 0.24); 6 Bourgueil (47.28, 0.17); 7 Vouvray (47.41, 0.80); 8 Sancerre (47.33, 2.84, west bank); 9 Pouilly-Fumé, Pouilly-sur-Loire (47.28, 2.95, east bank). Reference rings: Nantes (47.22, -1.55), Tours (47.39, 0.69), and an unnumbered ring at Orléans (47.90, 1.90), the river's northern apex. The course matters: from Tours the Loire climbs north-east through Blois (47.59, 1.33) to Orléans, then turns south-east past Gien (47.69, 2.63) and south past Sancerre and Pouilly, which is why the Central Vineyards lie so far from Touraine. The France sheet says: "These middle and upper Loire locators do not imply one compact vineyard zone." GRAPES: Chenin Blanc in "Vouvray & Savennières (Loire)". Check against: InterLoire, Vins de Loire appellation map (vinsvaldeloire.fr); INAO; Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Landscape, 1536 x 1024 pixels.

A field-atlas sheet of the Loire Valley, France, in the exact look of the established atlas, laid out landscape: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a wide thin gold-ruled map panel across the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, covering about 47.0 to 48.0 north and -2.3 to 3.1 east: the Atlantic coast as a short gold-edged shore at the far left near (47.25, -2.20); land in sage ivory (#c5c1a2 to #9aa587). The LOIRE as a clear teal line (#285954) following this course from the Atlantic at the left: east past Nantes (47.22, -1.55) and Angers (47.47, -0.55) to Tours (47.39, 0.69); then climbing north-east past Blois (47.59, 1.33) to its northernmost point at Orléans (47.90, 1.90); then turning south-east past Gien (47.69, 2.63); then running south past Sancerre (47.33, 2.84) and Pouilly (47.28, 2.95) to the bottom right. The river must form a clear upward arc between Tours and Gien, with Orléans at its top. Its tributaries the Vienne (joining near 47.21, 0.08) and the Cher (joining near 47.35, 0.48) as thinner teal lines.

Nine small ivory dots at these true relative positions (latitude, longitude), each joined by a fine leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (47.15, -1.40), 2 (47.38, -0.66), 3 (47.40, -0.50), 4 (47.26, -0.08), 5 (47.17, 0.24) on the Vienne, 6 (47.28, 0.17), 7 (47.41, 0.80), 8 (47.33, 2.84) on the WEST bank of the upper river, 9 (47.28, 2.95) on the EAST bank facing it. Three hollow gold rings with no numbers for the cities at (47.22, -1.55), (47.39, 0.69) and (47.90, 1.90), the last at the top of the river's arc. A small gold compass rose with N at the lower right of the map panel.

Only the numerals 1 to 9 and the letter N; no words, no names, no title.
```

- **Avoid:** châteaux; Sancerre and Pouilly on the same bank; the Loire drawn nearly straight west to east (it arcs north-east from Tours to its apex at Orléans, then turns south-east and south); a map window that cuts off Orléans.

#### C07. Piedmont: Barolo, Barbaresco, Asti

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `piedmont.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under Italy, from the Piedmont heading; and on the Barbera d'Asti glass card.
- **Must teach:** the two great Nebbiolo zones either side of Alba, and Asti to the north-east. Points: 1 Barolo village (44.61, 7.94), 2 La Morra (44.64, 7.93), 3 Castiglione Falletto (44.62, 7.98), 4 Serralunga d'Alba (44.61, 8.00), 5 Monforte d'Alba (44.58, 7.97), 6 Barbaresco (44.72, 8.08), 7 Asti (44.90, 8.21), 8 Gavi (44.69, 8.81), 9 Gattinara (45.62, 8.37) in the north. Reference ring: Alba (44.70, 8.03). The Tanaro river runs north-east through Alba and Asti. GRAPES: Nebbiolo in Barolo and Barbaresco; "garnet says age or a naturally lighter variety like Nebbiolo". Check against: Consorzio di Tutela Barolo Barbaresco Alba Langhe e Dogliani maps (langhevini.it); Regione Piemonte DOC/DOCG register; Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of Piedmont's wine country, north-west Italy, in the exact look of the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, an empty green band at the bottom for the app's key.

Two gold-ruled map panels: a LARGE main panel (upper two thirds) of the Langhe around Alba at close scale, and a SMALL panel beneath it at wider scale showing southern Piedmont up to the north (from 44.4 to 45.8 north, 7.6 to 9.0 east) with a gold rectangle marking the main panel's window. North up, flat, faint graticule, land in sage ivory (#c5c1a2 to #9aa587), the TANARO as a teal line (#285954) running from the south-west up through Alba to the north-east.

Main panel: a hollow gold ring with no number for the town of Alba at (44.70, 8.03), on the Tanaro. South-west of it, five small ivory dots close together with leaders fanning out to numbered discs (ivory, gold ring, dark green numeral): 1 (44.61, 7.94), 2 (44.64, 7.93), 3 (44.62, 7.98), 4 (44.61, 8.00), 5 (44.58, 7.97). A fine gold bracket groups them. North-east of Alba, on the Tanaro's right bank, one dot: 6 (44.72, 8.08).

Small panel: the Tanaro continuing north-east to the dot 7 (44.90, 8.21); a dot 8 (44.69, 8.81) to the south-east; a dot 9 (45.62, 8.37) far to the north near the Sesia river (a thin teal line); and the gold window rectangle round Alba.

A small gold compass rose with N at the lower right of the main panel. Only the numerals 1 to 9 and the letter N; no words, no names, no title.
```

- **Avoid:** Barbaresco south-west of Alba (it lies north-east); the Alps drawn in relief; hilltop villages as pictures; names.

#### C08. Tuscany: Chianti Classico, Montalcino, Montepulciano, Bolgheri

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `tuscany.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under Italy, from the Tuscany heading.
- **Must teach:** the Sangiovese heart between Florence and Siena, the two southern hill towns, and the coast. Points: 1 Chianti Classico, centred on Greve, Radda and Castellina (43.50, 11.32), 2 Montalcino (43.06, 11.49), 3 Montepulciano (43.09, 11.78), 4 Bolgheri (43.23, 10.61), 5 San Gimignano (43.47, 11.04), 6 Carmignano (43.81, 11.01). Reference rings: Florence (43.77, 11.25), Siena (43.32, 11.33). The Arno runs west through Florence to the sea. GRAPES: Sangiovese. Check against: Consorzio Vino Chianti Classico map (chianticlassico.com); Consorzio del Vino Brunello di Montalcino; Consorzio del Vino Nobile di Montepulciano; Natural Earth coast and rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Portrait, 1024 x 1536 pixels.

A field-atlas sheet of Tuscany's wine country, central Italy, in the exact look of the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map panel in the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, covering about 42.9 to 43.9 north and 10.3 to 12.0 east: the Tyrrhenian coast as a gold-edged shore down the left side, the sea in the page green, the land in sage ivory (#c5c1a2 to #9aa587). The ARNO as a teal line (#285954) running from the east through Florence and west to the sea near (43.68, 10.28).

Six small ivory dots at these true relative positions (latitude, longitude), each joined by a fine leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (43.50, 11.32), with a fine dotted gold outline loosely enclosing the hills between the two cities around it; 2 (43.06, 11.49); 3 (43.09, 11.78); 4 (43.23, 10.61) near the coast; 5 (43.47, 11.04); 6 (43.81, 11.01) west of Florence. Two hollow gold rings with no numbers for the cities at (43.77, 11.25) and (43.32, 11.33). A small gold compass rose with N at the lower right of the map panel.

A small inset at the top right: Italy in sage ivory with a tiny gold rectangle in central Tuscany.

Only the numerals 1 to 6 and the letter N; no words, no names, no title.
```

- **Avoid:** cypress avenues and hill towns as pictures; Montepulciano placed in Abruzzo (this is the Tuscan town); Bolgheri inland.

#### C09. The Mosel and its bends

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `mosel.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under Germany, from the Mosel heading; and on the J.J. Prüm Wehlener Sonnenuhr Auslese Goldkapsel magnum card.
- **Must teach:** why the slopes face south: the river loops, so the steep banks turn to the sun. Points: 1 Trittenheim (49.82, 6.90), 2 Piesport (49.88, 6.92), 3 Brauneberg (49.91, 6.98), 4 Bernkastel-Kues (49.92, 7.07), 5 Graach (49.93, 7.06), 6 Wehlen (49.94, 7.05), with the Sonnenuhr vineyard on the facing bank, 7 Zeltingen (49.95, 7.02), 8 Ürzig (49.98, 7.01), 9 Erden (49.98, 7.02). Reference rings: Trier (49.75, 6.64), Koblenz (50.36, 7.60), where the Mosel meets the Rhine. The Saar joins near Konz (49.70, 6.58); the Ruwer near Trier (49.78, 6.70). The list's magnum: "J.J. Prüm 'Wehlener Sonnenuhr' Riesling Auslese Goldkapsel 2015 (1.5 L magnum) $615". Check against: Deutsches Weininstitut and Moselwein e.V. vineyard maps; the Mosel Weinbergsrolle (vineyard register); Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Landscape, 1536 x 1024 pixels.

A field-atlas sheet of the Middle Mosel, Germany, in the exact look of the established atlas, laid out landscape: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a wide thin gold-ruled main map panel across the upper four fifths, an empty green band below for the app's key.

Main panel, north up, flat, faint graticule, covering about 49.78 to 50.02 north and 6.85 to 7.12 east, land in sage ivory (#c5c1a2 to #9aa587): the MOSEL drawn as a clear, broader teal line (#285954) that winds in tight, deep loops from the south-west corner to the north-east, like a ribbon folding back on itself. Along the river, wherever the bank faces south or south-west, a thin gold edge on that bank marks a steep sunny slope.

Nine small ivory dots at these true relative positions (latitude, longitude) along the river, each joined by a fine leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (49.82, 6.90), 2 (49.88, 6.92), 3 (49.91, 6.98), 4 (49.92, 7.07), 5 (49.93, 7.06), 6 (49.94, 7.05), 7 (49.95, 7.02), 8 (49.98, 7.01), 9 (49.98, 7.02). Beside dot 6, on the OPPOSITE bank from the village, a tiny engraved gold sundial symbol marks the famous south-facing vineyard slope.

A small inset at the top left, framed in gold hairline, at wider scale: the whole Mosel from Trier (hollow gold ring at 49.75, 6.64) to Koblenz (hollow gold ring at 50.36, 7.60) where it meets the Rhine (a thicker teal line), the Saar joining near (49.70, 6.58) and the Ruwer near (49.78, 6.70) as thin teal lines, and a gold rectangle marking the main panel's window. A small gold compass rose with N at the lower right of the main panel.

Only the numerals 1 to 9 and the letter N, and the small sundial symbol; no words, no names, no title.
```

- **Avoid:** a smooth, gently curving river (the loops are the lesson); vineyard rows or relief; the sundial on the village's own bank; names.

#### C10. Rioja: Alta, Alavesa, Oriental

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `rioja.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under Spain, from the Rioja heading.
- **Must teach:** the three subzones along the Ebro: 1 Rioja Alta, west, around Haro (42.58, -2.85); 2 Rioja Alavesa, north of the Ebro under the Sierra de Cantabria, around Laguardia (42.55, -2.58); 3 Rioja Oriental (the former Rioja Baja), east, around Alfaro (42.18, -1.75). Reference rings: Haro (42.58, -2.85), Logroño (42.47, -2.45). The Ebro runs south-east. GRAPES: Tempranillo, "Rioja". Check against: Consejo Regulador DOCa Rioja zone map (riojawine.com); Natural Earth rivers.

```
FAMILY 2, THE FIELD ATLAS SHEET. Landscape, 1536 x 1024 pixels.

A field-atlas sheet of Rioja, northern Spain, in the exact look of the established atlas, laid out landscape: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a wide thin gold-ruled map panel across the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, covering about 42.0 to 42.8 north and -3.1 to -1.6 east, land in sage ivory (#c5c1a2 to #9aa587): the EBRO as a clear teal line (#285954) running from the north-west corner down to the south-east corner. North of the river in the west, a flat darker green band (#263b2d) for the Sierra de Cantabria, no relief.

Three zones shown by fine dotted gold outlines, loosely, along the river: a western zone on both banks around (42.55, -2.80); a smaller northern zone on the NORTH bank only, between the river and the sierra, around (42.57, -2.58); an eastern zone on both banks from about -2.2 to -1.7, around (42.25, -1.90). One small ivory dot in each zone with a leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (42.58, -2.85), 2 (42.55, -2.58), 3 (42.18, -1.75). Two hollow gold rings with no numbers at (42.58, -2.85) beside dot 1 and at (42.47, -2.45) on the river. A small gold compass rose with N at the lower right of the map panel.

A small inset at the top right: Spain in sage ivory with a tiny gold rectangle in the north.

Only the numerals 1, 2, 3 and the letter N; no words, no names, no title.
```

- **Avoid:** the northern zone drawn south of the Ebro; region colours; names.

#### C11. The Douro and Port

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `douro-port.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `maps/atlas-zoom-v1/` (published at /codex/).

- **Where:** the Wine Atlas, "Closer look" under Portugal, from the Douro / Port heading; and on the Port cards in "Dessert and fortified".
- **Must teach:** the river from the Spanish border to the lodges at its mouth, and its three subregions: 1 Baixo Corgo, from about Barqueiros (-7.93) to the mouth of the Corgo at Régua (about -7.77), dot just west of Peso da Régua (41.16, -7.85); 2 Cima Corgo, from the Corgo to the Cachão da Valeira (about -7.38), around Pinhão (41.19, -7.55); 3 Douro Superior, from the Cachão da Valeira east to the Spanish border (41.10, -7.10). Reference rings: Porto (41.15, -8.61) with Vila Nova de Gaia's lodges on the south bank, and Barca d'Alva at the border (41.03, -6.93). The Corgo joins the Douro at Régua. Check against: IVDP, Instituto dos Vinhos do Douro e do Porto, Douro region map (ivdp.pt); Natural Earth rivers and border.

```
FAMILY 2, THE FIELD ATLAS SHEET. Landscape, 1536 x 1024 pixels.

A field-atlas sheet of the Douro Valley, northern Portugal, in the exact look of the established atlas, laid out landscape: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a wide thin gold-ruled map panel across the upper four fifths, an empty green band below for the app's key.

The map, north up, flat, faint graticule, covering about 40.9 to 41.5 north and -8.8 to -6.8 east: the Atlantic shore as a gold edge at the far left; Portugal in sage ivory (#c5c1a2 to #9aa587); Spain beyond the border at the right in darker green (#263b2d), the border a thin gold dotted line. The DOURO as a clear teal line (#285954) running from the Spanish border at the right, west across the whole map to the sea at Porto. A thinner teal tributary, the Corgo, joining from the north at about (41.16, -7.79).

Three fine vertical dotted gold lines cross the river: the region's western limit at about longitude -7.93 (near Barqueiros); the line between the first and second stretches at the mouth of the Corgo, about -7.77; and the line between the second and third stretches at the Cachão da Valeira gorge, about -7.38. The Spanish border closes the third stretch. The river from Porto up to -7.93 is left plain, outside the region. One small ivory dot in each stretch, on the river, with a leader to a numbered disc (ivory, gold ring, dark green numeral): 1 (41.16, -7.85), between the western limit and the Corgo; 2 (41.19, -7.55), between the Corgo and the gorge; 3 (41.10, -7.10), between the gorge and the border. No dot sits on a line. Hollow gold rings with no numbers at (41.15, -8.61), with a tiny cluster of three engraved gold lodge roofs on the SOUTH bank opposite it, and at (41.03, -6.93) at the border. A small gold compass rose with N at the lower right of the map panel.

Only the numerals 1, 2, 3 and the letter N; no words, no names, no title.
```

- **Avoid:** terraces or relief; rabelo boats; the lodges on the north bank; a dot sitting on a divider; the region drawn reaching down to Porto (it begins at about -7.93); names.

#### C12. The Burgundy slope: why a vineyard is Grand Cru

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `burgundy-slope-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** the Compendium, Classifications & Labels, France, at the head of the Burgundy entry; and on the Burgundy cards in My restaurant.
- **Must teach:** INTRO_CLASS, verbatim: "Vineyard-based: Grand Cru (≈2%, the named vineyard only) › Premier Cru (village + '1er Cru' + vineyard) › Village (commune name) › Regional (Bourgogne). A Grand Cru label shows ONLY the vineyard name, e.g. 'Chambertin'." The slope shows why: the best sites sit mid-slope, facing east and south-east, with thin soil over limestone and good drainage; the village vines lower down; the regional vines on the flat land by the road and towards the plain. The house: "Premier Cru is Burgundy's second-highest vineyard tier" (the Jadot Beaune 1er Cru note). Key the app prints: 1 woods on the hilltop; 2 Grand Cru, mid-slope; 3 Premier Cru, just above and below; 4 Village, the lower slope; 5 Regional, the flat land; 6 the village itself, at the foot of the slope; 7 limestone beneath.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A geological cross-section plate on warm parchment (#f3e9d5 to #e3d3b4), fine ink-brown engraving (#29271f) with soft true-colour watercolour washes, a thin double gold hairline frame (#d5b16c).

A side-on cross-section of a gentle east-facing hillside in Burgundy: the hilltop at the
LEFT (west), the slope descending to the RIGHT (east) to a flat plain. A small sun low in the upper right (morning sun from the east) with fine engraved rays falling on the slope.

Above ground, from left to right: a cap of dark green woodland on the hilltop; then the slope covered in neat vine rows drawn small in side view, in four bands. The band at the very middle of the slope has the most vigorous, richly drawn vines; above and below it, two slightly narrower bands; lower down the slope, a broader band; and on the flat land at the bottom right, a wide band of vines on level ground. At the foot of the slope, between the lower band and the flat land, a small cluster of stone village houses with a church spire, and a thin road running past them.

Below ground, the cross-section shows: a thin brown topsoil over pale cream limestone bedrock on the hilltop and mid-slope, with fine stone fragments mixed in the thin soil mid-slope; the soil getting thicker, darker and richer brown towards the bottom of the slope and on the plain, with clay drawn as a heavier brown layer.

Numbered discs (ivory #f3e9d5, gold ring, dark green numeral #17382a) with fine ink leaders: 1 on the woods; 2 on the mid-slope band; 3 on the band just above it AND, with a second disc also numbered 3, on the band just below it; 4 on the lower broad band; 5 on the flat land; 6 on the village; 7 on the limestone below. Only these numerals; no words, letters or labels.
```

- **Avoid:** a steep Mosel-like slope or terraces (the Côte is gentle); the best band at the top or bottom; the sun in the west; words in the picture (the tier names are typeset by the app).

#### C13. Reading a label: Old World and New World

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `label-reading-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** the Compendium, at the head of Classifications & Labels; and in My restaurant above "The full wine list".
- **Must teach:** INTRO_CLASS: "Quality is tied to PLACE; the grape is usually implied by the appellation, not printed", against the New World label that leads with the grape. Two invented labels (no real producer), with the words given exactly, and numbered callouts the app keys: 1 the producer; 2 the place (the appellation); 3 the quality tier; 4 the vintage; 5 the grape (named only on the New World label); 6 the volume and the alcohol. This is the one entry that must carry words, because a label is words.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A plate on warm parchment (#f3e9d5 to #e3d3b4) with a thin double gold hairline frame (#d5b16c), showing two wine labels flat and face-on, side by side, each drawn large and crisp as if printed, each with a fine ink border. These are invented labels; spell every word exactly as given below and add no other words, crests, logos or signatures.

LEFT LABEL, a traditional French Burgundy label: cream paper, black and deep red classical serif type, centred, a thin double black rule border. Exactly these lines, top to bottom:
  DOMAINE DES TROIS CHÊNES        (small capitals, black)
  MEURSAULT                       (very large capitals, deep red)
  PREMIER CRU                     (small capitals, black)
  LES PERRIÈRES                   (medium capitals, black)
  2021                            (medium numerals, black)
  APPELLATION MEURSAULT 1ER CRU CONTRÔLÉE   (very small capitals, black)
  750 ml     13% vol              (very small, black, on one line at the bottom)

RIGHT LABEL, a modern Californian label: white paper, clean modern serif type, left aligned, generous space, a single thin gold rule at the top. Exactly these lines, top to bottom:
  Three Oaks Cellars              (medium, black)
  Chardonnay                      (very large, black)
  Sonoma Coast                    (medium, black)
  2022                            (medium, black)
  750 ml     14.1% alc/vol        (very small, black, at the bottom)

Numbered callout discs (ivory #f3e9d5, gold ring, dark green numeral #17382a) outside each label with fine ink leader lines pointing to the right line:
Left label: 1 to DOMAINE DES TROIS CHÊNES; 2 to MEURSAULT; 3 to PREMIER CRU; 4 to 2021; 6 to the volume line. (No 5 on the left label.)
Right label: 1 to Three Oaks Cellars; 2 to Sonoma Coast; 4 to 2022; 5 to Chardonnay; 6 to the volume line. No other text anywhere in the image.
```

- **Avoid:** any real producer, crest or trademark; extra words or a back label; misspellings (check every accent: CHÊNES, PERRIÈRES, CONTRÔLÉE); a photograph of a bottle (labels flat only).

#### C14. Reading colour: the white page and the rim

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `grid-colour-rim-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** Study the grid (the Deductive Grid), at the head of "Sight"; and in the tasting flight screen.
- **Must teach:** TASTING_GRID, Sight: "Concentration: Pale, medium, or deep. Judge against a white page"; "Whites: straw, yellow, gold. Reds: purple, ruby, garnet. Purple says youth; garnet says age or a naturally lighter variety like Nebbiolo or Pinot Noir"; "Rim variation: A wide, pale or orange rim on a red suggests age or Nebbiolo/Sangiovese; magenta rim points to Malbec; little rim variation implies youth." House rule: "wine-colour teaching swatches must not be recoloured as branding." Key the app prints: top row 1 straw, 2 yellow, 3 gold; bottom row 4 purple, 5 ruby, 6 garnet; 7 the rim of the garnet wine, wide and orange.

```
FAMILY 1, THE LIBRARY PLATE. Landscape, 1536 x 1024 pixels.

Six identical clear, thin-rimmed tulip-shaped tasting glasses, each holding the same modest pour of wine, each standing upright on a plain sheet of bright white paper on a dark polished wooden table, seen from directly above, so that each wine's surface is a circle that shows the colour from the deep centre out to the paler rim at its edge, with the white paper visible through and around the glass. Nothing holds the glasses; they stand on their own feet. Clean, even, neutral white daylight on the paper so the colours are true; the deep forest-green background in soft shadow at the very top edge only. Arranged in two rows of three.

Top row, white wines, left to right: 1 pale straw with a green glint; 2 lemon yellow; 3 deep gold.
Bottom row, red wines, left to right: 4 deep opaque purple with a vivid violet-magenta rim; 5 bright ruby, with only a narrow paler rim; 6 garnet, lighter in the centre, fading to a WIDE brick-orange rim.

A numbered disc (ivory #f3e9d5, gold ring, dark green numeral #17382a) beside each glass: 1 to 6; and a seventh disc, 7, with a fine gold leader pointing to the wide orange rim of glass 6. No other numerals, words or letters.
```

- **Avoid:** candlelight or any warm cast on the wine (this plate uses neutral light because colour is the lesson); the glasses held by hands, tilted, floating or propped; a side view (the plate is seen from directly above); brown, cloudy or fizzy wine; identical-looking rims on 4, 5 and 6.

#### C15. The traditional method, from base wine to cork

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `champagne-traditional-method-v1.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** the Library, at the head of the Champagne study chapter; and at the head of "Champagne bottles" in My restaurant, under C03.
- **Must teach:** the traditional method in eight steps, the key the app prints: 1 base wine blended (assemblage); 2 bottled with yeast and sugar under a crown cap (tirage); 3 second fermentation in the bottle, making the bubbles (about 6 atmospheres of pressure, the Codex primer: "~6 atmospheres behind the muselet"); 4 ageing on the lees (non-vintage at least 15 months, vintage at least 36); 5 riddling (remuage): bottles turned neck down in a pupitre until the lees settle in the neck; 6 disgorging (dégorgement): the neck frozen, the crown cap removed, the plug of lees shot out; 7 dosage, a little wine and sugar (liqueur d'expédition), which sets the sweetness: Extra Brut, Brut (the house Brennan's Essential is an Extra Brut); 8 cork, wire cage (muselet) and foil.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Portrait, 1024 x 1536 pixels.

A scientific process plate on warm parchment (#f3e9d5 to #e3d3b4), fine ink-brown engraving (#29271f) with soft true-colour watercolour washes, a thin double gold hairline frame (#d5b16c). Eight small square vignettes in a grid of two columns and four rows, each framed by a thin gold hairline, read left to right, top to bottom, with a small fine gold arrow between each vignette and the next.

1: three glass beakers of pale still white wine being poured together into one larger vessel.
2: a dark green Champagne bottle being filled, a small dish of yeast and a few sugar crystals beside it, and a metal crown cap (like a beer bottle cap) on its neck.
3: the crown-capped bottle lying on its side in a dark cellar, with tiny fine bubbles forming inside the wine and a few fine engraved pressure lines radiating from the bottle.
4: a stack of many bottles lying on their sides in a chalk cellar, a thin pale line of yeast sediment (lees) resting along the lower side of each bottle.
5: a wooden riddling rack (an A-frame pupitre with angled holes), bottles tilted neck down in it, a hand giving one bottle a slight turn; the sediment gathered in the neck.
6: a bottle held neck down, its neck dipped in a shallow tray of icy freezing brine; then the same bottle upright with the crown cap flying off and a small frozen plug of sediment shooting out.
7: a small measured pour of golden liquid from a jug being added to the open bottle.
8: the finished bottle, with a mushroom cork held by a wire cage and gold foil over the neck, standing upright.

In the top left corner of each vignette, a small ivory disc with a gold ring and a dark green numeral: 1 to 8. No other numbers, words or letters; no labels on any bottle.
```

- **Avoid:** a cork in steps 2 to 6 (the bottle is under a crown cap until step 8); people beyond a single hand in step 5; any branded bottle or cellar; words.

#### C16. Bottle shapes you can read across a room

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `bottle-shapes-v1.webp`, 1536 x 1024 pixels, landscape, WebP. Goes in sommelierscodex `assets/teach/` (published at /codex/).

- **Where:** the Compendium, Winemaking, beside "Grape to bottle"; and in My restaurant above "The full wine list", so a server can tell a Bordeaux from a Burgundy on the back bar.
- **Must teach:** the four classic shapes and what they usually hold; the key the app prints: 1 Bordeaux: high square shoulders, straight sides (Cabernet, Merlot, Sauvignon Blanc, Sémillon; Napa Cabernet uses it too); 2 Burgundy: gently sloping shoulders, a wider body (Pinot Noir, Chardonnay; the Rhône uses a similar shape); 3 the tall, slender flute of the Mosel and Alsace, in green glass (Riesling, Gewürztraminer; the Rhine uses the same shape in brown glass, which the key says and the image does not draw); 4 Champagne: heavy thick glass, sloping shoulders, a deep punt, a lip for the cage. Habits, not laws: the app says so.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Landscape, 1536 x 1024 pixels.

A scientific comparison plate on warm parchment (#f3e9d5 to #e3d3b4), fine ink-brown engraving (#29271f) with true-colour watercolour washes, a thin double gold hairline frame (#d5b16c). Four 750 ml wine bottles standing in a row on one engraved ground line, side-on, in TRUE relative scale, each with a blank cream label and no writing, each drawn also as a faint dotted cutaway showing the depth of the punt in its base.

1: a dark green Bordeaux bottle: straight parallel sides, high sharply squared shoulders, a straight neck, a modest punt, a dark red capsule.
2: a dark olive-green Burgundy bottle: a slightly wider body, long gently sloping shoulders flowing into the neck, a deeper punt, a deep burgundy capsule.
3: a tall, slender green flute bottle (Mosel and Alsace style): narrow, tall, gently tapering from body to neck with no distinct shoulder, almost no punt, a pale gold capsule.
4: a heavy dark green Champagne bottle: thick glass, sloping shoulders, a pronounced lip under the cork for the wire cage, a very deep punt, gold foil over the neck.

Under each bottle, centred on the ground line, a numbered disc (ivory #f3e9d5, gold ring, dark green numeral #17382a): 1, 2, 3, 4. No other numbers, words or letters.
```

- **Avoid:** branded, embossed or crested bottles (a Châteauneuf-du-Pape crest especially); bottles at different scales; words.

#### C17. Grape portrait, the series anchor: Pinot Noir

> Sommelier's Codex art. Paste the Codex style guide first. Deliver as `pinot-noir-v1.webp`, 1024 x 1024 pixels, square, WebP. Goes in sommelierscodex `assets/teach/grapes/` (published at /codex/).

- **Where:** the Compendium, The Grapes, at the top of the Pinot Noir entry; and on the grape flashcards. It sets the look every other portrait in S11 follows, so run it first and approve it before the series.
- **Must teach:** the grape as a vine-side specimen a student can recognise: Pinot Noir's small, tightly packed, pine-cone-shaped clusters (the name is often traced to pin, pine) of thin-skinned, blue-black berries with a dusty bloom, and its leaf. GRAPES: Pinot Noir is light in body with high acid; "garnet says age or a naturally lighter variety like Nebbiolo or Pinot Noir". The house pours it from the Jadot Beaune 1er Cru and the "Light reds, Pinot Noir" section. Ampelography to check against: VIVC, Vitis International Variety Catalogue (vivc.de), Pinot Noir entry photographs.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Square, 1024 x 1024 pixels.

A botanical specimen plate in the manner of a nineteenth-century ampelography, on warm parchment (#f3e9d5 to #e3d3b4), fine ink-brown engraving (#29271f) with true-colour watercolour washes, a thin double gold hairline frame (#d5b16c).

In the centre, one ripe bunch of Pinot Noir grapes hanging from a short woody cane: a SMALL, compact, tightly packed cluster shaped like a pine cone, cylindrical to slightly conical, about the length of a palm; the berries small, round, crowded so tightly they press against each other, thin-skinned, deep blue-black with a soft pale-grey dusty bloom on the skins. Behind and to the upper left, one mature vine leaf, medium sized, roughly round, with three to five shallow lobes and toothed edges, in true mid green with fine engraved veins. A curling tendril to the right.

Lower right, a small gold-framed inset: one berry cut in half showing a thin dark skin, pale greenish translucent flesh and two small seeds.

Lower left, a small gold-framed inset: a clear wine glass with a pour of translucent, pale-to-medium ruby wine, so light that the outline of a fine line drawn behind it shows through.

No numerals, words or letters.
```

- **Avoid:** large, loose or elongated clusters; green or purple-pink berries; an opaque inky wine in the glass; decorative borders of extra fruit; words.

**What stays typography (no image wanted).** Service temperatures, the naming tables for large formats (Champagne Jeroboam 3 L against Bordeaux Jéroboam 5 L; Methuselah against Imperial at 6 L), the 1855 classification, the German Prädikat ladder, the Italian and Spanish tiers, and the deductive grid's wording are lists of words and numbers. The Codex sets them in type, and a picture would only repeat them. The images above are chosen because each shows something a sentence cannot: a hand's movement, a place's shape, a slope, a colour, a proportion.

## 8. Fixes to current images

### 8.1 ChatGPT revisions of six World Table plates

Paste the World Table style guide (2.1) first. Each prompt asks ChatGPT to edit the current plate: attach the named v2 file from `static/plates/` to the message, then paste the prompt. Only the named panels change. The result is a new file name (`-v3`), never an overwrite of v2, as `docs/teaching-folios.md` requires; Claude makes the thumbnail.

#### F01. Atlantic plate, revised: the lobster's two claws

> World Table art. Paste the World Table style guide first. Deliver as `atlantic-fish-v3.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **File:** `atlantic-fish-v3.webp` (and thumbnail made by Claude), 1024 x 1536. A new name, never overwriting v2.
- **Where:** Plates wall, The fish case, Atlantic (`/table/plates/atlantic-fish`).
- **Must teach:** "A large crustacean with one heavy crusher claw and one finer-edged cutting claw"; "Live animals are usually olive or greenish brown"; image brief "two visibly unequal large claws".

```
Attach the current Atlantic plate (atlantic-fish-v2.webp) and edit it. Using the World Table style guide, keep the whole plate exactly as it is, the ivory paper, the dark forest-green and gold frame, the compass roses, the corner sprigs, the six cells, the numerals and panels 1 to 5 untouched. Change only panel 6, the American lobster (Homarus americanus), uncooked and seen from above: keep its olive-brown and greenish live colour, its long antennae and its tail fan, but make the two big claws clearly unequal. One claw, the crusher, is much broader and heavier, swollen, with thick rounded blunt molar-like teeth along its inner edges. The other, the cutter or pincer claw, is longer, slimmer and narrower, with fine, sharp, close-set teeth. The difference must be obvious at a glance on a small phone screen. Same lifelike natural-history watercolour, same scale, same light, same placement in the cell. No words or labels; the numeral 6 stays beneath it.
```

- **Avoid:** any red (cooked) colour; changing panels 1 to 5; moving the numeral.

#### F02. Pacific plate, revised: sablefish and albacore

> World Table art. Paste the World Table style guide first. Deliver as `pacific-fish-v3.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Plates wall, The fish case, Pacific.
- **Must teach:** sablefish "The North Pacific fish marketed as black cod, although it is not a member of the cod family", "An elongated, dark-bodied fish", "no cod-like chin barbel"; albacore "A streamlined tuna with exceptionally long pectoral fins reaching far back along the body", "Dark blue back, silver sides and a pale tail edge".

```
Attach the current Pacific plate (pacific-fish-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals, and panels 1, 2, 3 and 6 untouched. Change only two panels, keeping the same side view facing left, scale and natural-history watercolour:
Panel 4, sablefish (Anoplopoma fimbria): a long, slim, cylindrical fish, slate-black to dark charcoal-grey on the back fading to grey below, with small scales, a pointed snout, no chin barbel, two clearly separate dorsal fins with a wide gap between them (the first short and spiny, the second set well back), and a broad, slightly forked tail. It must not look like a bass, a bluefish or a cod.
Panel 5, albacore tuna (Thunnus alalunga): keep the torpedo-shaped body with dark blue back and silver sides, but make the pectoral fins very long and sword-like, reaching back past the start of the second dorsal fin and anal fin, and give the tail fin a thin pale white trailing edge.
No words or labels; the numerals 4 and 5 stay beneath their fish.
```

- **Avoid:** a barbel on the sablefish; yellow finlets on the albacore (that is the yellowfin of the Gulf plate).

#### F03. Charcuterie plate, revised: rolled pancetta

> World Table art. Paste the World Table style guide first. Deliver as `charcuterie-v3.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Plates wall, The board, Charcuterie.
- **Must teach:** "Cured pork belly, often presented as a slab or rolled into a cylinder"; "Alternating lean and fat"; "Its belly origin distinguishes it from cheek-based guanciale"; image brief "Rolled pancetta with a cut spiral of pink meat and white fat".

```
Attach the current charcuterie plate (charcuterie-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals and panels 1 and 3 to 6 untouched. Change only panel 2, pancetta: a rolled pancetta (pancetta arrotolata), a firm cylinder of cured pork belly tied with plain white butcher's string at even intervals, its outside dusted with cracked black pepper, one end cut cleanly to show a tight spiral of rose-pink lean and creamy white fat, with three thin round slices fanned in front showing the same spiral. Same lifelike natural-history watercolour, same scale and light. No words or labels; the numeral 2 stays beneath it.
```

- **Avoid:** a flat slab (that reads as bacon or guanciale); a smoked brown exterior; red salami-like colour.

#### F04. Midwest fruits, revised: tart cherry and Concord grape

> World Table art. Paste the World Table style guide first. Deliver as `midwest-fruits-v3.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Plates wall, The larder by region, Midwest fruits.
- **Must teach:** tart cherry "A sour red stone fruit commonly used in cherry pies", "It differs from the sweet cherry often served fresh", image brief "Small bright red tart cherries, one cut to show its central stone"; Concord "A dark purple, seeded grape", "Concord and muscadine are different grape types", image brief "Loose bunch of round purple Concord grapes with a dusty bloom".

```
Attach the current Midwest fruits plate (midwest-fruits-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals and panels 1, 3, 4 and 6 untouched. Change only two panels, same lifelike natural-history watercolour and scale:
Panel 2, tart cherries (sour cherries): small, round, bright scarlet-red cherries, slightly translucent and lighter than a sweet cherry, on long slender green stems in a pair and a single, with one cut in half to show juicy pale red flesh and a small round stone. They must look clearly brighter and redder than a dark sweet cherry.
Panel 5, Concord grapes: a loose bunch of round, medium-sized, blue-black to deep purple grapes on a woody stem, each covered in a soft, pale, silvery-blue powdery bloom that rubs off to show glossy dark skin where a finger has touched, with one grape split to show pale green translucent flesh and a seed, and a broad lobed grape leaf. The grapes must not look like the blueberries in panel 4: no five-point crowns, rounder and larger, on a branching bunch.
No words or labels; the numerals stay in place.
```

- **Avoid:** crowns on the grapes; a dark wine-red cherry.

#### F05. Northeast fruits, revised: the cranberry's trailing vine

> World Table art. Paste the World Table style guide first. Deliver as `northeastern-fruits-v3.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Plates wall, The larder by region, Northeast fruits.
- **Must teach:** "A small red berry produced by a low, trailing plant adapted to acidic, moist ground"; "Berry of a trailing evergreen plant"; "The plant grows in soil; flooding does not mean the fruit grows underwater"; image brief "Small deep red cranberries, one cut crosswise".

```
Attach the current Northeast fruits plate (northeastern-fruits-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals and panels 1, 2, 4, 5 and 6 untouched. Change only panel 3, cranberry: a short length of low, trailing, woody cranberry runner lying almost flat, with many tiny, oval, glossy dark green evergreen leaves only a few millimetres long along it, and five or six small, round to slightly oval, glossy deep red berries, each on its own short stalk rising from the runner, not hanging in a cluster. In front, keep one berry cut crosswise to show the white flesh and its four small air chambers with seeds. Same lifelike natural-history watercolour, scale and light. No words or labels; the numeral 3 stays beneath it.
```

- **Avoid:** broad cherry-like leaves; berries hanging in a bunch; water.

#### F06. Southwest vegetables, revised: the Anaheim chile

> World Table art. Paste the World Table style guide first. Deliver as `southwest-vegetables-v3.webp`, 1024 x 1536 pixels, portrait, WebP. Goes in WorldTable `static/plates/` (published at /table/).

- **Where:** Plates wall, The larder by region, Southwest vegetables.
- **Must teach:** "An elongated Capsicum fruit used for varying degrees of heat"; "The pictured Anaheim-style form does not promise a fixed heat level"; image brief "Long smooth green Anaheim-style chile with a tapered point".

```
Attach the current Southwest vegetables plate (southwest-vegetables-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals and panels 2 to 6 untouched. Change only panel 1, the chile: two long, narrow, smooth Anaheim-type green chiles, each about six times as long as it is wide, a medium bright green with a light gloss, gently curved and slightly flattened, tapering to a point, with a short green stem and cap; and one split lengthwise showing thin walls, pale ribs and a cluster of cream seeds near the stem. Same lifelike natural-history watercolour, scale and light. No words or labels; the numeral 1 stays beneath it.
```

- **Avoid:** broad, dark, heart-shaped poblano pods; stubby jalapeño shapes; red colour.

### 8.2 The Ledger's eight technique plates

The eight inline line drawings in the Ledger's Technique Plates accordion are redrawn as brass plates by series S08 in section 9, one prompt per plate, each replacing its SVG (which stays as the fallback). Three of them mislead today (the seal, the Hawthorne gate, the muddle), four are half there, and the float is redrawn for consistency only.

### 8.3 Fixes in code, no ChatGPT

**World Table.**

- **Code: file names.** The layout's offline warm-up accepts only `-v2` names (`src/routes/+layout.svelte:54`, the pattern `-v2(?:\.thumb)?`). Any v3 revision from section 8 needs that pattern widened to `-v\d+` and the builder paths, manifest and tests updated together, as `docs/teaching-folios.md` requires (never overwrite a filename).
- **Code: icons.** `static/icon-512.png`, `icon-192.png`, `icon-maskable-512.png` and `favicon.svg` wear the old almanac palette (#191612, #C2A055, #EAE2CE). Keep the mark and swap the colours to midnight green #081510, brass #D5B16C and parchment #F3E9D5; delete the unused Svelte starter `src/lib/assets/favicon.svg`.
- **Code: masthead weight.** A 768 px wide encode of `static/house/world-table-library-v1.webp` for narrow screens would cut about two thirds of its bytes with no change to the picture.

**The Bartender's Ledger.**

- Glass icons: add about seven shapes and reorder `glassIcon()`'s matcher (section 3.5). The Brennan's Irish Coffee today shows a handled mug.
- Masthead: a 768 px `srcset` variant for phones.
- New images should load lazily and stay out of the Ledger worker's precache list unless the owner wants them offline; under the publish rule any file added to `ASSETS` bumps `oot-ledger-vN`.

**The Sommelier's Codex.**

1. Icons: move `icons/icon.svg` from the claret ground (#130709) to the house forest green and regenerate the PNGs with resvg; consider dropping the star and fleurons under the typography rule.
2. Masthead on a phone: a darker scrim under the strapline, or a shorter phone crop, so the tabs reach the first screen.
3. The 17 archived JPG posters: never shown, never briefed from; remove them from the published copy when the rollback window closes (6.7 MB).
4. California sheet: give Napa and Sonoma separate numbers in `.scripts/atlas-v2/catalog.cjs` when the Napa zoom sheet lands.

## 9. Series templates

Twelve templates for the large sets. Each is one reusable prompt with slots; fill every slot from the source named, never from memory, then paste it after the app's style guide. Each filled prompt is self-contained. The first items to run are listed under each template.

### 9.1 World Table templates (paste the World Table style guide first)

Each template is one reusable prompt with slots in braces.

#### S01. Technique standard: done right against the fault (60 standards) (World Table)

- **File pattern:** `standard-<technique-slug>-v1.webp`, 1536 x 1024, landscape folio pair.
- **Where:** Library, Techniques, each technique page, beside its marks and fault (`src/lib/data/technique-standards.json`).
- **Slots:** `{subject}` the food and vessel; `{right}` one picture-able sentence built from the standard's marks; `{fault}` one picture-able sentence built from its fault text.

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two equal cells side by side divided by a hairline gold rule, a dark brown serif numeral centred under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. Both cells show {subject}, from the same angle and at the same scale, so that only the result differs.
1. Done right: {right}
2. The fault: {fault}
Where a hand is needed, show only a cook's hand and forearm in a plain white sleeve. The two numerals are the only marks: no words, labels, thermometers or text.
```

First items to run, by how many recipes each standard governs (from the data):

| Technique (slug) | Recipes | {subject} | {right} (from the marks) | {fault} (from the fault) |
|---|---|---|---|---|
| sweating-aromatics-soft-never-browned | 198 | diced onion in butter in a stainless sauté pan, seen from above | translucent to pale gold pieces, no tan edges, clear loose fat, a clean pan floor | browned edges and tips, browned flecks in the fat, firm centres under coloured edges |
| salted-water-and-the-float-test | 188 | a pot of water with gnocchi or dumplings | (take the marks from the data before running) | (take the fault from the data) |
| the-bare-simmer-holding-liquid-below-the-boil | 183 | a pot of stock | (from the data) | (from the data) |
| straining-and-passing-through-a-sieve | 148 | a sauce through a fine conical sieve | (from the data) | (from the data) |
| reducing-a-sauce | 95 | a sauce in a saucier with a reduction line on the wall | coats the back of a spoon and holds a clean line drawn by a finger; a visible tide line shows the drop | a sauce boiled hard, scorched on the base, a browned film where the heat was fiercest |
| deep-frying | 96 | fried pieces lifted from oil | (from the data) | (from the data) |
| blanching-and-shocking | 76 | green beans in iced water | (from the data) | (from the data) |
| building-an-emulsion | 40 | a vinaigrette or mayonnaise in a bowl | glossy and homogeneous, clinging and holding a line, no slick on top | broken into grease over a thin liquid |
| caramelising onions (no standard yet; the technique has no film) | 6 | sliced onions in a wide pan | (write the standard first) | (write the standard first) |

Rows marked "from the data" need their marks and fault read out of `technique-standards.json` before the prompt is filled; the template must never be run on a guess.

#### S02. Lexicon specimen plate (the visual atlases: 113 vegetables, 81 fruits, 46 cheeses, 46 spices, 41 charcuterie, 40 herbs and chiles, 21 fungi) (World Table)

- **File pattern:** `<atlas>-<set>-v1.webp`, 1024 x 1536, portrait plate, six subjects.
- **Where:** Plates wall, in the matching kind; each Library term links to its cell.
- **Slots:** `{1}` to `{6}`: name plus a one-line look note taken from the term's definition.

```
Using the World Table style guide: a portrait study plate, 1024 x 1536 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses at the top and bottom centre, gold leaf sprigs in the corners, six equal cells in two columns and three rows divided by hairline gold rules with tiny gold four-point stars at the crossings, one dark brown serif numeral centred under each subject. Lifelike natural-history watercolour over fine graphite, true colour, no golden cast, soft neutral daylight from the upper left, soft contact shadows, consistent scale. Where it helps recognition, show the whole item beside a cut piece.
1. {1}
2. {2}
3. {3}
4. {4}
5. {5}
6. {6}
The six numerals are the only marks: no words, labels or text.
```

First plates to run:

| Plate | {1} to {6} | Why first |
|---|---|---|
| `chiles-fresh-v1` | Jalapeño; Serrano; Poblano; Fresno; Habanero; Thai bird chile (look notes from each Herb & Chile Atlas term) | Fresno is in the Grand Isle Jewel Oysters' mignonette; guests ask about heat. |
| `fungi-wild-v1` | Chanterelle; Morel; Porcini; Black trumpet; Hen of the woods; Black truffle | The Floor Deck mushrooms section has 25 cards and no picture. |
| `cheese-atlas-2-v1` | six Cheese Atlas terms not on the current cheese plate, chosen by the Floor Deck's dairy cards | Cheese Board on the Roost Bar list. |
| `grains-pulses-v1` | six from The Grain, Pulse & Seed Atlas, including sorghum and long-grain rice | Sorghum (papillote) and popcorn rice (gumbo) are on the menu. |
| `vegetable-atlas-alliums-v1` | six alliums from The Vegetable Atlas (shallot, leek, garlic, scallion and two more) | Shallots and leeks run through the Brennan's menu. |
| `charcuterie-2-v1` | six Charcuterie Atlas terms not on the current plate, including tasso and andouille if B12 is not run | Coverage of the 41 terms. |

#### S03. Brennan's dish card hero (62 dishes) (World Table)

- **File pattern:** `brennans-<dish-id>-<dish-slug>-v1.webp`, 1536 x 1024, landscape folio, one dish.
- **Where:** My Menu, top of each dish's study card, and the face of its flash card. The house schema has no image field yet; Claude adds one keyed by the dish id when the art arrives.
- **Slots:** `{dish}` the name as printed; `{menu line}` the description as printed, with every producer and brand name stripped out (write "beef tenderloin", not the farm's name; "French bread crisps", not the bakery's); `{plate}` the vessel (bowl, plate, platter) and a plain reading of how the parts sit, checked against the pass.

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses at the top and bottom centre, gold leaf sprigs in the corners. One dish, centred with generous ivory margin, painted as a lifelike natural-history watercolour over fine graphite, true food colour, soft daylight from the upper left, a soft contact shadow, on plain white china with no pattern, coloured rim or maker's mark, seen from about 45 degrees above, no cutlery, linen, glassware, table or background.
The dish is {dish}: {menu line}. Show {plate}. Every visible component named must be shown and recognisable; do not draw bottles or props for liquids that are stirred in; nothing that is not named may be added.
No numerals, words, labels, logos or text anywhere.
```

First twelve (menu lines as printed in the pack, producer and brand names already stripped; the Turtle Soup's turtle meat and Sherry, the Foster's rum and the Hussarde's coffee cure are stirred in or cured in and are not drawn):

| Dish id | {dish} | {menu line} |
|---|---|---|
| d-1q0xk7jv | Eggs Hussarde | Housemade English muffins, coffee-cured Canadian bacon, hollandaise, poached eggs, marchand de vin sauce |
| d-fs311zha | Eggs Sardou | Crispy artichokes, poached eggs, Parmesan creamed spinach, Choron sauce |
| d-ecy8tdsb | Turtle Soup | 100% turtle meat, brown butter spinach, grated egg, aged Sherry |
| d-r3h9vj7a | Seafood Gumbo | Shrimp, crab, oysters, andouille, popcorn rice |
| d-w6h1p19m | World Famous Bananas Foster | bananas, butter, brown sugar, cinnamon, rum, housemade vanilla ice cream (plated, after the flame) |
| d-s1bqzuks | Redfish Véronique | Hibiscus-pickled grapes, braised leeks, fingerling potatoes, preserved lemon beurre blanc |
| d-5wcuejdy | Roasted Chateaubriand | beef tenderloin, roasted & glazed summer squash, sauce Foyot, serves two |
| d-szzugxzi | Gulf Fish en Papillote | Banana leaf-wrapped Gulf fish, Louisiana crab, sorghum, Marcona almonds, Castelvetrano olives, tomato |
| d-44jfmkdb | Eggs Owen | Red wine-braised short rib débris, Creole-spiced potato, soft-boiled egg, hollandaise, marchand de vin sauce |
| d-bqznncn6 | New Orleans Shrimp & Grits | Louisiana shrimp, fried pimento cheese grit cake, tasso, Creole sauce, fried okra chips |
| d-5p5b1hjn | Louisiana Crab Claws | Warm brown butter vinaigrette, fines herbes |
| d-tdqej73i | Creole Caesar | Gem lettuce, smoked oyster dressing, Grana Padano cheese, French bread crisps |

Do not run this template for Maggie's Mushrooms or South Louisiana Rice Dressing (the menu prints no description), the Louisiana Oysters (plating and count unconfirmed) or Cherries Jubilee (not on the dessert menu of 3 October 2026) until the house confirms them.

#### S04. Recipe hero (1,844 recipes) (World Table)

- **File pattern:** `recipe-<recipe-slug>-v1.webp`, 1536 x 1024, landscape folio, one finished dish.
- **Where:** the recipe page (`/table/recipe/<slug>`), top. Lowest priority of the five series: a recipe hero shows the goal but teaches less than a standard pair or a specimen plate.
- **Slots:** `{dish}` and `{finish}`, the finished look taken from the recipe's final steps and note.

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners. One finished dish, centred with generous ivory margin: {dish}, {finish}. Lifelike natural-history watercolour over fine graphite, true food colour, soft daylight from the upper left, on a plain white plate or bowl with no pattern, seen from about 45 degrees above, nothing on the paper but the dish. No numerals, words, labels, logos or text.
```

First items, chosen because each sits behind a Brennan's dish: `bananas-foster` ("Over cold ice cream immediately", "One minute per side keeps the bananas intact"), `chicken-and-andouille-gumbo` (milk-chocolate roux, scallions, served over rice), `sauce-hollandaise`, `beurre-blanc-the-cold-butter-mount`, `sauce-bearnaise`, `gumbo-zherbes`, `grillades-and-grits`, `salmon-en-papillote`.

#### S05. Floor Deck word card (400 cards) (World Table)

- **File pattern:** `deck-<card-id>-v1.webp`, 1024 x 1024, square.
- **Where:** the Floor Deck card face in Flashcards, small at the top of the card. Run it only for the sections a picture helps: fish (39), cuts (30), mushrooms (25), cured (31), sauces (30), bread (24) and custards (26).
- **Slots:** `{term}` and `{look}`, the look taken from the card's gist and why.

```
Using the World Table style guide: a square study card, 1024 x 1024 pixels, warm ivory paper (#F4E9CD) inside a fine very dark forest-green border (#141C13) with a thin antique-gold rule (#A8905B) and a small gold leaf sprig in each corner (no compass roses on this small format). One subject centred with generous margin: {term}, {look}. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left, a soft contact shadow, nothing else on the paper. No numerals, words, labels or text.
```

First items, chosen for Brennan's: fd_0196 Béarnaise, fd_0197 Hollandaise, fd_0205 Beurre Blanc, Chateaubriand, Hanger Steak, Tenderloin, Oysters, Crawfish, Blue Crab, Shrimp, Mignonette, Gastrique (the Popcorn Shrimp's Crystal gastrique), Bordelaise (but the pack warns "in New Orleans it often means garlic butter", so hold it until the kitchen answers).

### 9.2 Ledger templates (paste the Ledger style guide first)

Each template is one prompt with slots in capitals between square brackets.

#### S06. The house drink card (the rest of the Brennan's list, and any later house) (Ledger)

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar [LIGHT, for example "at night" or "in late afternoon"]. The hero is [DRINK DESCRIPTION, never the brand] in [GLASS, described by shape]. [ICE: "There is no ice." or the ice described]. The drink is [COLOUR AND CLARITY, exact], [SURFACE: still, foam, bubbles, float]. [GARNISH exactly as printed, or "No garnish of any kind."] [ONE EXTRA ELEMENT if printed, for example a side spoon.]

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the rim, the whole glass from foot to rim in frame, filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind. Background: library shelves and bottles far out of focus in warm bokeh, deep felt green and brown. No labels, no text, no people, no other glasses, nothing the description does not name.
```

File name: `img/brennans/<slug>-v1.webp`, where the slug is the app's own (`#/menu/<slug>`). First items (pack facts quoted; glass and garnish classic unless printed; every one also asks the bar for the glass):

| Slug | Drink | Slot values |
|---|---|---|
| `birdcage` | Birdcage, $31.00, Roost only | "a smoked bourbon Old Fashioned" (pack: "built as an Old Fashioned and smoked"); a heavy rocks glass; one large clear cube; clear deep amber; a few soft wisps of pale smoke curling from the surface; no garnish drawn (pack lists "orange, cherry" as ingredients; how they appear is a question for the bar). |
| `spoonbill` | Spoonbill, $36.00, Roost only | "a pale gin and quinquina martini-style drink with a few drops of chive oil"; a Nick & Nora; no ice; clear pale straw; a few small bright green droplets of oil floating on the surface; no garnish in the glass; extra element: "beside the glass on a small white saucer, a small mother-of-pearl spoon holding a neat quenelle of glossy black caviar" (pack garnish: "a spoon of caviar"). |
| `riviera` | Riviera, $12.00 | "a light aperitif-wine and sparkling wine drink"; a Champagne flute; no ice; clear pale gold; fine bubbles; no garnish (lemon is an ingredient, its form is a question for the bar). |
| `obx` | OBX, $12.00 | "a sparkling gin and peach drink topped with a softly sparkling pink Italian wine"; a Champagne flute; no ice; clear coral pink; gentle fine bubbles; no garnish. |
| `chandon-garden-spritz` | Chandon Garden Spritz, $15.00 | "a bitter orange spritz with dry sparkling wine"; a large wine glass; cubed ice; clear bright orange; bubbles; no garnish (never call it Champagne). |
| `personality` | Personality, $16.00, spirit-free | "a spirit-free sparkling rosé with tart cherry"; a Champagne flute; no ice; clear deep rosy pink with a cherry-red tint; fine bubbles; no garnish. |
| `oh-what-it-seemed-to-be` | Oh! What It Seemed to Be, $16.00, spirit-free | "a non-alcoholic agave sour with egg white"; a coupe; no ice; soft opaque pale amber tan; a dense smooth white foam cap about one centimetre deep; no garnish. Pair it visually with B27 (same look: the app's label tells them apart). |
| `floating-in-south-africa` | Floating in South Africa, $15.00 | "a root beer float with cream liqueur"; a tall glass; no ice; a scoop of vanilla bean ice cream (cream white flecked with tiny black vanilla seeds) floating in dark brown root beer clouded beige where the cream liqueur and melting ice cream swirl; a tan foam head; no garnish, no straw. |
| `banane-au-chocolat` | Banane au Chocolat, $16.00 | "a dessert drink of banana liqueur, chocolate liqueur and sweet sherry"; a Nick & Nora; no ice; clear dark mahogany brown; still and glossy; no garnish. |
| `ralph-s-coffee` | Ralph's Coffee, $8.00 | "chicory coffee with two nut liqueurs under whipped cream"; an Irish coffee glass (stemmed, footed, tulip bowl, small handle); no ice; very dark coffee; a white cream cap, clean line; no garnish. |
| `caf-glac-de-la-maison` | Café Glacé de la Maison, $11, spirit-free | "a cold brew iced coffee with a pale foam"; a tall iced glass; cubed ice; clear dark brown cold coffee; a smooth pale ivory foam about two centimetres deep on top (pack: "orange flower foam"); no garnish. |
| `new-orleans-style-coffee-with-chicory` | New Orleans-Style Coffee with Chicory, $11 | "a cup of hot black coffee"; a plain white porcelain cup on its saucer with a spoon on the saucer; very dark brown, a faint steam wisp; no garnish. |
| `revive-cold-pressed-juice` | Revive Cold-Pressed Juice, $10.00 | "a cold-pressed strawberry, apple and pineapple juice"; a tall straight glass (B15, glass 9; held: confirm with the bar); no ice; opaque soft strawberry pink-red; a fine froth line; no garnish. |

Hold until the bar answers: `flamingo` (dragonfruit flesh may be magenta or white, which decides the colour), `bodrum` (how the pistachio goes in decides the colour), `apple-crumble` (the pack: "Whether it is served hot or cold is not printed"), `congregation-single-origin-coffee` (a plain cup; low value), `thompson-s-dream` and `origin-story` singles (covered by B17).

#### S07. The Library cocktail card (365 drinks) (Ledger)

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is [DRINK, described by style, for example "a classic gin martini"] in [GLASS, described by shape]. [ICE]. The drink is [COLOUR AND CLARITY], [SURFACE]. Garnish: [GARNISH exactly as the Ledger's data names it, described physically], and nothing else.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the rim, the whole glass in frame, filling about 60 percent of its height. Warm candle key light from the left, a cool rim light from behind. Background: library shelves and bottles far out of focus in warm bokeh, deep felt green and brown. No labels, no text, no people, no other glasses, no garnish beyond the one named.
```

File name: `img/cards/<slug>-v1.webp`, the Library's slug (`#/library/<slug>`). Where: the Library's opened drink card, above the ticket; the flash card's back. First run, the Core Dozen (data: glass, garnish, method as printed):

| Slug | Glass | Ice | Colour and surface | Garnish |
|---|---|---|---|---|
| `old-fashioned` | rocks glass | one large clear cube | clear deep amber, still | an expressed wide orange peel resting in the glass |
| `manhattan` | Nick & Nora (data: "Coupe or Nick & Nora") | none | clear deep reddish amber, still | one dark brandied cherry on the bottom of the glass |
| `martini` | Nick & Nora | none | crystal clear, faintly silvery, still | a thin lemon twist on the rim (data: "Lemon twist or olive"; draw the twist) |
| `daiquiri` | coupe | none | pale, slightly cloudy greenish white, fine bubbles on top | a lime wheel slit onto the rim |
| `margarita` | rocks glass with a salt rim (half the rim) | cubed | pale cloudy lime-yellow | a lime wheel on the rim |
| `whiskey-sour` | rocks glass (data: "Rocks or coupe") | cubed | opaque pale gold | an orange slice and a brandied cherry on a pick (data: "Cherry + orange") |
| `negroni` | rocks glass | one large clear cube | clear deep ruby red | an expressed wide orange peel in the glass |
| `mojito` | highball | crushed ice | clear pale with green mint leaves and bubbles | a full mint bouquet rising from the ice |
| `moscow-mule` | lined copper mug | cubed | pale cloudy straw, bubbles | a lime wedge on the rim |
| `gin-and-tonic` | highball | cubed to the top | crystal clear, lively bubbles | a lime wedge in the glass |
| `tom-collins` | Collins | cubed | pale cloudy, bubbles | a lemon wheel and a cherry on a pick |
| `espresso-martini` | coupe | none | very dark brown with a hazelnut foam | three coffee beans on the foam |

Then the Classics Canon and the New Orleans drinks (Sazerac, Vieux Carré, Ramos Gin Fizz, Brandy Milk Punch, Hurricane, Café Brûlot), each read from `js/data-core.js` before its prompt is filled.

#### S08. The technique plate redraw (the eight current plates) (Ledger)

```
FAMILY 2, THE BRASS PLATE. [SIZE: "Portrait, 1024 x 1536 pixels" for a sequence, "Square, 1024 x 1024 pixels" for one figure].

An antique bartender's manual plate showing [TECHNIQUE], drawn as fine copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin. Hands are anonymous engraved line, no rings, no faces. Colour only where named: [COLOUR, or "no colour"].

[THE FIGURE OR STEPS, exact.]

[NUMERALS: "Beside each step, small, its numeral in brass classical serif capitals: 1, 2,
3. No other numerals." or "No numerals."] No words, no letters.
```

File name: `img/plates/<id>-v1.webp` using the plate's own `id` in `PLATES`. Where: the Technique Plates accordion, replacing the SVG for that plate (keep the SVG as the fallback). Slot values, from each plate's caption:

| id | Technique | Size | Figure or steps |
|---|---|---|---|
| `seal` | sealing two tins | square | the small tin set into the large tin at a clear angle, one side touching; the heel of a hand striking the top once, shown by a short impact arc; then (inset, lower right) a hand squeezing the large tin and twisting to break the seal. |
| `gate` | the Hawthorne gate | portrait, 2 steps | side view of a Hawthorne strainer on a tin, forefinger pushing it forward so the spring closes tight against the rim, a thin stream pouring; then the forefinger eased back so the gap opens wide and the stream is thicker. Numerals 1, 2. |
| `dstrain` | the double strain | square | one hand pours from a tin fitted with a Hawthorne strainer; the other holds a small conical fine strainer over a coupe; the stream passes through both; tiny ice shards caught in the mesh. |
| `express` | expressing a peel | square | fingers pinch a wide oval orange peel, skin side down, a hand's height above a coupe, snapping it; a fine mist of oil falls like rain over the drink's surface. Colour: the peel true orange. |
| `dome` | the julep dome | square | a julep cup packed with crushed ice heaped into a rounded dome above the rim, a full mint bouquet rising from it, a straw beside the mint, a dense white frost over the metal. Colour: mint green. |
| `dryshake` | the dry shake | portrait, 2 steps | sealed tins shaken with no ice inside (a cutaway shows liquid and a pale foam forming); then the same tins with ice added, shaken again, frost on the metal. Numerals 1, 2. |
| `muddle` | the muddle press | portrait, 3 steps | a flat-ended wooden muddler pressing mint leaves and lime in the base of a sturdy glass; the muddler twisted a quarter turn (curved arrow); the muddler lifted. Colour: mint and lime green. Numerals 1, 2, 3. |
| `float` | the float | square | the back of a barspoon's bowl held against the inside wall of a rocks glass just above the drink's surface; a thin pour running down the spoon and spreading across the top as a separate dark red layer over a pale sour. Colour: the pale drink and the red wine layer. |

#### S09. The layered build (seven shots) (Ledger)

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate of one layered shot, drawn as a fine copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded corners, a small brass diamond centred in the bottom margin.

A clear, slightly tapered shot glass, drawn large and centred, holding [N] perfectly separate horizontal layers with crisp lines between them, each a transparent watercolour wash in its TRUE colour, from the bottom up: [LAYERS]. [EXTRA, if any]. A barspoon rests beside the glass. Beside each layer, small, its numeral in brass classical serif capitals, 1 at the bottom. No other numerals, no words, no letters.
```

File name: `img/plates/layered-<slug>-v1.webp`. Where: the Shot Board, the layered drill (`LAYERED_BUILDS`), above the build's layers. Items from the data:

| Slug | N | Layers, bottom up | Extra |
|---|---|---|---|
| `b-52` | 3 | deep opaque coffee brown (coffee liqueur); opaque milky beige (Irish cream); clear orange-amber (Grand Marnier) | none |
| `baby-guinness` | 2 | very dark brown, almost black (coffee liqueur); a thin opaque cream cap (Irish cream) | none |
| `duck-fart` | 3 | deep coffee brown; milky beige; clear light amber (Canadian whisky) | none |
| `buttery-nipple` | 2 | clear golden amber (butterscotch schnapps); opaque milky beige (Irish cream) | none |
| `slippery-nipple` | 2 | clear, colourless (sambuca); opaque milky beige (Irish cream) | none |
| `springbokkie` | 2 | clear vivid green (green crème de menthe); opaque cream-tan (Amarula) | none |
| `brain-hemorrhage` | 2 | clear pale peach (peach schnapps); opaque beige curdled into soft clumps (Irish cream) | "three drops of deep red grenadine falling through the curdled cream, leaving red threads" (data: "The one build where grenadine goes LAST") |

### 9.3 Codex templates (paste the Codex style guide first)

#### S10. The atlas zoom sheet (one template, many regions) (Codex)

Paste the style guide, then this template with the slots filled. Each filled sheet is checked point by point against its named sources before it ships, as the note above C01 says.

```
FAMILY 2, THE FIELD ATLAS SHEET. [Portrait, 1024 x 1536 | Landscape, 1536 x 1024] pixels.

A field-atlas sheet of [REGION, COUNTRY], in the exact look of the established atlas: deep forest-green page (#142d21 to #081510), a fine double gold hairline frame with small engraved vine-tendril corner flourishes, a thin gold-ruled map panel in the upper four fifths, an empty green band below for the app's key.

The map, north up, flat drawing, faint graticule, covering about [LAT RANGE] north and [LON RANGE] east, the land in sage ivory (#c5c1a2 to #9aa587), neighbouring countries in darker green (#263b2d), any sea or lake in the page green with a thin gold shore. Rivers as teal lines (#285954): [RIVERS, EACH WITH THE COORDINATES IT PASSES]. Any range of hills as a flat darker green band, never relief: [HILLS, IF ANY].

Small ivory dots at these true relative positions (latitude, longitude), each joined by a fine leader to a numbered disc (ivory #f3e9d5, gold ring, dark green numeral #17382a) placed so none overlap: [NUMBERED POINTS WITH COORDINATES, AND WHICH BANK]. Smaller hollow gold rings with no numbers for these reference towns: [TOWNS WITH COORDINATES]. A small gold compass rose with N at the lower right of the map panel. A small inset of [COUNTRY] in sage ivory with a tiny gold rectangle marking this window.

Only the numerals [1 TO n] and the letter N; no words, no names, no title.
```

First items to run, in this order:

1. **Alsace** (portrait). Points: Strasbourg ring (48.58, 7.75), Colmar ring (48.08, 7.36); 1 Riquewihr (48.17, 7.30), 2 Ribeauvillé (48.19, 7.32), 3 Kaysersberg (48.14, 7.26), 4 Eguisheim (48.04, 7.31), 5 Guebwiller (47.91, 7.21), 6 Barr (48.41, 7.45), 7 Thann (47.81, 7.10). Rivers: the Rhine on the eastern border (from 48.6, 7.8 south to 47.6, 7.55); the Ill parallel to it. Hills: the Vosges as a flat dark band west of the points. Vineyards on the eastern foothills. Sources: CIVA, Vins d'Alsace map (vinsalsace.com); INAO.
2. **Madeira** (landscape, island alone). Points: Funchal ring (32.65, -16.91); 1 Câmara de Lobos (32.65, -16.98), 2 São Vicente on the north coast (32.80, -17.04), 3 Porto Moniz (32.87, -17.17), 4 Seixal (32.82, -17.11). Coast only, no rivers. Sources: IVBAM, Instituto do Vinho, do Bordado e do Artesanato da Madeira; Natural Earth coast. The list's Broadbent Malvasia and Verdelho 500 ml come from here.
3. **Jura and Savoie** (portrait, two panels). Jura: 1 Arbois (46.90, 5.77), 2 Château-Chalon (46.75, 5.62), 3 L'Étoile (46.73, 5.53); Lons-le-Saunier ring (46.67, 5.55). Savoie: 4 Apremont (45.50, 5.94), 5 Chignin (45.52, 6.02); Chambéry ring (45.57, 5.92); Lac du Bourget. GRAPES_PLUS: Savagnin (Jura). Sources: CIVJ, Vins du Jura; Vins de Savoie; INAO.
4. **Chablis** (portrait). 1 Chablis town and its Grand Cru slope on the north-east bank of the Serein (47.82, 3.80); Auxerre ring (47.80, 3.57). Sources: BIVB.
5. **Beaujolais crus** (portrait). North to south: Saint-Amour (46.24, 4.70), Juliénas (46.24, 4.71), Chénas (46.21, 4.71), Moulin-à-Vent (46.19, 4.73), Fleurie (46.19, 4.70), Chiroubles (46.18, 4.66), Morgon (46.16, 4.68), Régnié (46.14, 4.64), Brouilly (46.12, 4.68), Côte de Brouilly (46.11, 4.67). INTRO_CLASS: "10 named Crus". The list's Foillard Côte du Py Morgon magnum. Sources: Inter Beaujolais (beaujolais.com); INAO. (Points crowd: use a larger scale and fan the leaders.)
6. **Sonoma County AVAs**, **Willamette Valley AVAs**, **Mendoza: Luján de Cuyo and the Uco Valley**, next, from TTB and the national bodies' maps.

#### S11. Grape portraits (one template, 47 grapes) (Codex)

Run C17 first and approve it; then the rest from this template, one grape per prompt.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Square, 1024 x 1024 pixels.

A botanical specimen plate in the manner of a nineteenth-century ampelography, on warm parchment (#f3e9d5 to #e3d3b4), fine ink-brown engraving (#29271f) with true-colour watercolour washes, a thin double gold hairline frame (#d5b16c), in exactly the same layout as the approved Pinot Noir plate.

In the centre, one ripe bunch of [GRAPE] grapes hanging from a short woody cane: [CLUSTER SHAPE AND SIZE]; the berries [BERRY SIZE, SHAPE, SKIN COLOUR AND BLOOM]. Behind and to the upper left, one mature vine leaf: [LEAF CHARACTER], in true mid green with fine engraved veins. A curling tendril to the right.

Lower right, a small gold-framed inset: one berry cut in half showing the skin, flesh and seeds.

Lower left, a small gold-framed inset: a clear wine glass with a pour of [WINE COLOUR AND DEPTH].

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

#### S12. A single glass card (one template, nine glasses) (Codex)

For each glass of B38 shown alone on a wine's card, once the chart is approved.

```
FAMILY 3, THE PARCHMENT DIAGRAM. Square, 1024 x 1024 pixels.

One empty, clear crystal [GLASS NAME AND SHAPE, COPIED WORD FOR WORD FROM B38], drawn as a fine ink-brown engraving (#29271f) with the faintest grey watercolour for the glass, on warm parchment (#f3e9d5 to #e3d3b4), a thin double gold hairline frame (#d5b16c), standing centred on a short engraved ground line, side-on at eye level with a slight ellipse at the rim, filling about 70 percent of the frame height, with a fine dotted gold line across the bowl at its correct pour level: [POUR LEVEL FROM B38]. No liquid, no numerals, no words.
```

First items: tulip, white Burgundy bowl, Bordeaux glass, Burgundy bowl, white-wine glass (the five the list names most).

## 10. The hand-back table

For Claude, when the art comes back: every ID, the file name ChatGPT should deliver, its format and size, the repository and folder it goes in, and the screen it serves. "Was" is the entry's number in the three working files in `docs/image-audit/`, which keep the full audit trail.

| ID | File name | Format and size | Repository and folder | Screen | Was |
|---|---|---|---|---|---|
| B01 | `brennans-traditional-breakfast-v1.webp` | WebP 1024 x 1536 | WorldTable `static/house/brennans/` | My Menu, the Tasting menus section, as the header image of the Traditional Breakfast | WO-01 |
| B02 | `brennans-breakfast-entrees-v1.webp` | WebP 1024 x 1536 | WorldTable `static/house/brennans/` | My Menu, Entrées section header (Breakfast & lunch filter) | WO-02 |
| B03 | `brennans-sauces-v1.webp` | WebP 1024 x 1536 | WorldTable `static/house/brennans/` | My Menu, under the house lexicon's sauce terms (Hollandaise, Béarnaise, Choron, Foyot,... | WO-03 |
| B04 | `brennans-bananas-foster-tableside-v1.webp` | WebP 1024 x 1536 | WorldTable `static/house/brennans/` | My Menu, Desserts, on the World Famous Bananas Foster study card, above the tableside... | WO-04 |
| B05 | `brennans-flambe-cart-v1.webp` | WebP 1536 x 1024 | WorldTable `static/house/brennans/` | My Menu, Desserts, on both the Bananas Foster and Cherries Jubilee study cards, beside the... | WO-05 |
| B06 | `brennans-dinner-entrees-v1.webp` | WebP 1024 x 1536 | WorldTable `static/house/brennans/` | My Menu, Entrées section header (Dinner filter), and as flash card faces | WO-06 |
| B07 | `brennans-eggs-hussarde-build-v1.webp` | WebP 1536 x 1024 | WorldTable `static/house/brennans/` | My Menu, Eggs Hussarde study card, at the top, so a server can describe the dish layer by... | WO-07 |
| B08 | `poached-egg-standard-v1.webp` | WebP 1536 x 1024 | WorldTable `static/standards/` | Library, Techniques, "Poaching eggs", and linked from the Hussarde and Sardou study cards... | WO-08 |
| B09 | `brennans-chateaubriand-v1.webp` | WebP 1536 x 1024 | WorldTable `static/house/brennans/` | My Menu, Roasted Chateaubriand study card, top | WO-09 |
| B10 | `brennans-gulf-fish-papillote-v1.webp` | WebP 1536 x 1024 | WorldTable `static/house/brennans/` | My Menu, Gulf Fish en Papillote study card, top | WO-10 |
| B11 | `brennans-louisiana-seafood-v1.webp` | WebP 1024 x 1536 | WorldTable `static/house/brennans/` | My Menu, at the head of the house's seafood dishes | WO-11 |
| B12 | `louisiana-larder-v1.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, "The pantry" kind, and linked from the house's gumbo, shrimp and grits and the... | WO-12 |
| B13 | `roux-colour-ladder-v1.webp` | WebP 1024 x 1536 | WorldTable `static/standards/` | Library, Techniques, "Making a roux", and linked from the house's Seafood Gumbo ("Gumbo is... | WO-13 |
| B14 | `hollandaise-standard-v1.webp` | WebP 1024 x 1536 | WorldTable `static/standards/` | Library, Techniques, "Hollandaise" and "Building an emulsion" | WO-14 |
| B15 | `brennans-glassware-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/brennans/` | The Menu tab (Brennan's), at the foot of the drinks list, under a heading "The glasses" | BA-01 |
| B16 | `classic-sazerac-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card in the Menu tab, under the name and price line, above "Say it" | BA-02 |
| B17 | `sazerac-ladder-v1.webp` | WebP 1536 x 1024 | bartendersledger `img/brennans/` | The Menu tab, at the head of the Premium Sazeracs section, above Thompson's Dream | BA-03 |
| B18 | `brandy-milk-punch-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card, under the name and price line | BA-04 |
| B19 | `bloody-bull-and-bloody-mary-v1.webp` | WebP 1536 x 1024 | bartendersledger `img/brennans/` | Both study cards, Bloody Bull and Brennan's Bloody Mary, under the name and price line | BA-05 |
| B20 | `brennan-s-irish-coffee-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card | BA-06 |
| B21 | `brennan-s-champagne-cocktail-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card, in the Bubbles at Brennan's section | BA-07 |
| B22 | `espresso-martini-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card, Coffee Cocktails on the dessert menu | BA-08 |
| B23 | `for-sentimental-reasons-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card, first in the Billboard Songs from 1946 section | BA-09 |
| B24 | `prisoner-of-love-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card | BA-10 |
| B25 | `rumors-are-flying-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card | BA-11 |
| B26 | `to-each-his-own-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card | BA-12 |
| B27 | `old-buttermilk-sky-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card | BA-13 |
| B28 | `five-minutes-more-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card | BA-14 |
| B29 | `brennans-pour-order-v1.webp` | WebP 1024 x 1024 | sommelierscodex `assets/teach/` | My restaurant, at the top of "Study our list", above the first wine card, under a heading... | SO-01 |
| B30 | `service-still-opening-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | the Service Ritual, at the head of "Opening Still Wine", above step 1 | SO-02 |
| B31 | `service-champagne-opening-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | the Service Ritual, at the head of "Sparkling Wine" | SO-03 |
| B32 | `brennans-sabrage-v1.webp` | WebP 1024 x 1536 | sommelierscodex `assets/teach/` | My restaurant, in the house notes under "Bubbles at Brennan's", beside the lexicon term... | SO-04 |
| B33 | `brennans-coravin-two-ways-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | My restaurant, on the two by-the-glass cards "Rare Brut 2012 (Coravin)" and "Domaine... | SO-05 |
| B34 | `service-decanting-old-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | the Service Ritual, at the head of "The Decanting Ritual" | SO-06 |
| B35 | `service-decant-or-not-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | the Service Ritual, under step 6 of "The Decanting Ritual" ("Know why you decant, and when... | SO-07 |
| B36 | `brennans-bottle-sizes-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | My restaurant, at the head of "Birthday Bubbles: Champagne large formats" and of "Half-bottles" | SO-08 |
| B37 | `brennans-nebuchadnezzar-v1.webp` | WebP 1024 x 1024 | sommelierscodex `assets/teach/` | My restaurant, on the card "Billecart-Salmon 'Réserve' Brut NV (15 L Nebuchadnezzar)", and... | SO-09 |
| B38 | `brennans-wine-glasses-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | My restaurant, above "Study our list", under a heading "Our glasses" | SO-10 |
| B39 | `bottle-ullage-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | My restaurant, on the four 1946 Bordeaux cards and the Rubicon 2010 | SO-11 |
| B40 | `bottle-heat-damage-v1.webp` | WebP 1024 x 1024 | sommelierscodex `assets/teach/` | My restaurant, under the must-know "Wine program" (Katrina: "a month without power cooked... | SO-12 |
| B41 | `glass-crystals-sediment-cork-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | My restaurant, under "Guest questions" for the old reds and the Chardonnays | SO-13 |
| T01 | `beef-doneness-ladder-v1.webp` | WebP 1024 x 1536 | WorldTable `static/standards/` | Library, Techniques, "Resting meat & slicing against the grain", and the Floor Deck cuts... | WO-15 |
| T02 | `french-herbs-v1.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, The pantry | WO-22 |
| T03 | `searing-standard-v1.webp` | WebP 1536 x 1024 | WorldTable `static/standards/` | Library, Techniques, "Searing: the hard crust", in the standard's done-right marks and fault | WO-23 |
| T04 | `resting-slicing-standard-v1.webp` | WebP 1536 x 1024 | WorldTable `static/standards/` | Library, Techniques, "Resting meat & slicing against the grain" | WO-24 |
| T05 | `sugar-stages-v1.webp` | WebP 1024 x 1536 | WorldTable `static/standards/` | Library, Techniques, "Sugar stages & caramel" (a technique with no film), and linked from... | WO-25 |
| T06 | `knife-cuts-v1.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Library, Techniques, "Knife cuts: dice, julienne, bias", and the lexicon term "Knife Cuts:... | WO-26 |
| T07 | `kitchen-knives-v1.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, a new "The kit" group or The pantry | WO-27 |
| T08 | `pot-shapes-v1.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | the Library term "Pot Shapes: Saucier, Rondeau, Stock & Why Geometry Matters", and... | WO-28 |
| L01 | `garnish-citrus-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | More, Notes, in a new "Garnish" panel beside the Technique Plates | LG-01 |
| L02 | `garnish-rail-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | The same Garnish panel as L01, second plate | LG-02 |
| L03 | `glassware-stemmed-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | More, Behind the Stick reference, the Glassware cards (js/data-service.js, domain... | LG-03 |
| L04 | `glassware-rocks-tall-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | The same Glassware reference, above the Rocks & Tall and Beer & Wine groups | LG-04 |
| L05 | `coffee-milk-drinks-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | More, Coffee and Tea, the reference cards (COFFEE_REF), above the With Milk group | LG-05 |
| L06 | `ice-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/plates/` | More, Notes, "Technique: The Mechanics", beside the "Ice" row | LG-06 |
| L07 | `bar-tools-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | More, Notes, at the head of "Technique: The Mechanics" | LG-07 |
| L08 | `technique-shake-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | More, Notes, Technique Plates, as a new plate | LG-08 |
| L09 | `technique-stir-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/plates/` | Technique Plates | LG-09 |
| L10 | `technique-build-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | Technique Plates | LG-10 |
| L11 | `technique-swizzle-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/plates/` | Technique Plates | LG-11 |
| L12 | `technique-flame-peel-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | Technique Plates | LG-12 |
| L13 | `technique-roll-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/plates/` | Technique Plates | LG-13 |
| L14 | `density-ladder-v1.webp` | WebP 1024 x 1536 | bartendersledger `img/plates/` | More, Shots and Zero Proof, the Shot Board, beside the density table (LAYER_LADDER) | LG-14 |
| C01 | `burgundy-cote-dor.webp` | WebP 1024 x 1536 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, a new "Closer look" card under the France sheet | SO-14 |
| C02 | `bordeaux-banks.webp` | WebP 1024 x 1536 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under France, from the Bordeaux heading | SO-15 |
| C03 | `champagne.webp` | WebP 1024 x 1536 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under France, from the Champagne heading | SO-16 |
| C04 | `rhone-north-south.webp` | WebP 1024 x 1536 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under France, from the Rhône Valley heading | SO-17 |
| C05 | `napa-valley.webp` | WebP 1024 x 1536 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under California, from the Napa and Sonoma heading | SO-18 |
| C06 | `loire.webp` | WebP 1536 x 1024 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under France, from the Loire Valley heading | SO-19 |
| C07 | `piedmont.webp` | WebP 1024 x 1536 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under Italy, from the Piedmont heading | SO-20 |
| C08 | `tuscany.webp` | WebP 1024 x 1536 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under Italy, from the Tuscany heading | SO-21 |
| C09 | `mosel.webp` | WebP 1536 x 1024 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under Germany, from the Mosel heading | SO-22 |
| C10 | `rioja.webp` | WebP 1536 x 1024 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under Spain, from the Rioja heading | SO-23 |
| C11 | `douro-port.webp` | WebP 1536 x 1024 | sommelierscodex `maps/atlas-zoom-v1/` | the Wine Atlas, "Closer look" under Portugal, from the Douro / Port heading | SO-24 |
| C12 | `burgundy-slope-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | the Compendium, Classifications & Labels, France, at the head of the Burgundy entry | SO-25 |
| C13 | `label-reading-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | the Compendium, at the head of Classifications & Labels | SO-26 |
| C14 | `grid-colour-rim-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | Study the grid (the Deductive Grid), at the head of "Sight" | SO-27 |
| C15 | `champagne-traditional-method-v1.webp` | WebP 1024 x 1536 | sommelierscodex `assets/teach/` | the Library, at the head of the Champagne study chapter | SO-28 |
| C16 | `bottle-shapes-v1.webp` | WebP 1536 x 1024 | sommelierscodex `assets/teach/` | the Compendium, Winemaking, beside "Grape to bottle" | SO-29 |
| C17 | `pinot-noir-v1.webp` | WebP 1024 x 1024 | sommelierscodex `assets/teach/grapes/` | the Compendium, The Grapes, at the top of the Pinot Noir entry | SO-30 |
| F01 | `atlantic-fish-v3.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, The fish case, Atlantic | WO-16 |
| F02 | `pacific-fish-v3.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, The fish case, Pacific | WO-17 |
| F03 | `charcuterie-v3.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, The board, Charcuterie | WO-18 |
| F04 | `midwest-fruits-v3.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, The larder by region, Midwest fruits | WO-19 |
| F05 | `northeastern-fruits-v3.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, The larder by region, Northeast fruits | WO-20 |
| F06 | `southwest-vegetables-v3.webp` | WebP 1024 x 1536 | WorldTable `static/plates/` | Plates wall, The larder by region, Southwest vegetables | WO-21 |
| S01 | `standard-<technique-slug>-v1.webp` | WebP 1536 x 1024 | WorldTable `static/standards/` | Library, Techniques, beside each standard | template |
| S02 | `<atlas>-<set>-v1.webp` | WebP 1024 x 1536 (+ 360 x 540 thumb) | WorldTable `static/plates/` | Plates wall; each Library term links to its cell | template |
| S03 | `brennans-<dish-id>-<dish-slug>-v1.webp` | WebP 1536 x 1024 | WorldTable `static/house/brennans/` | My Menu, top of each dish card (needs a house image field) | template |
| S04 | `recipe-<recipe-slug>-v1.webp` | WebP 1536 x 1024 | WorldTable `static/recipes/` | Recipe page, top | template |
| S05 | `deck-<card-id>-v1.webp` | WebP 1024 x 1024 | WorldTable `static/deck/` | Floor Deck card face | template |
| S06 | `<slug>-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/brennans/` | The drink's study card | template |
| S07 | `<slug>-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/cards/` | Library drink card, flash card back | template |
| S08 | `<id>-v1.webp` | WebP as listed | bartendersledger `img/plates/` | Technique Plates, replacing the SVG | template |
| S09 | `layered-<slug>-v1.webp` | WebP 1024 x 1024 | bartendersledger `img/plates/` | Shot Board, layered drill | template |
| S10 | `<region-slug>.webp` | WebP as the template | sommelierscodex `maps/atlas-zoom-v1/` | Wine Atlas, Closer look cards | template |
| S11 | `<grape-slug>-v1.webp` | WebP 1024 x 1024 | sommelierscodex `assets/teach/grapes/` | The Grapes, each entry; grape flashcards | template |
| S12 | `glass-<slug>-v1.webp` | WebP 1024 x 1024 | sommelierscodex `assets/teach/glasses/` | A wine's card, its glass line | template |

**Wiring and encoding.**

- **World Table.** Encoding follows the plate brief: WebP quality 83, method 6; thumbnails fit within 360 x 540, Lanczos, quality 78. Every new file loads on demand and stays out of precache. Image QA checks each numbered panel against the written subject, not against the prompt. The World Table art goes into the WorldTable repository and reaches the site only through a rebuild of `table/`; it is never placed in `table/` by hand.
- **The Ledger.** If ChatGPT returns PNG, Claude converts to webp (quality about 82) and, for the 1024 px cards, a 512 px thumbnail, at wiring time. Never overwrite a delivered file: a revision takes the next version (`-v2`).
- **The Codex.**

- Every teaching image is content under the typography rule, so it gets real alt text written from the "Must teach" lines, its key typeset beside it, and a caption; never alt="".
- Like the maps, the teaching images should load on demand into their own versioned cache rather than the shell precache, and the screens must render correctly with the folder empty, as the atlas tab does. Keep each file under about 250 KB (webp quality about 80 at the delivered size).
- The zoom sheets are new versioned paths (`maps/atlas-zoom-v1/`), so the atlas-v2 cache contract is untouched; give them a guide entry in `js/data-atlas-v2.js`'s style (title, scope, reading, sources) and a line in `atlas-sources.html`.
- In the site copy, any new file under `codex/` bumps the Codex worker (oot-codex-vN) with `node tools/bump-shared.mjs --apply`, then `node tools/check-all.mjs`.

## 11. Data tasks noticed on the way

None of these is ChatGPT's work; each was found while reading for the brief, and each is offered, not made.

- **The Brennan's drinks' empty glass and garnish fields.** The Brennan's pack (`static/shared/packs/brennans-new-orleans.v1.oothouse.json`) has an empty `glass` field on all 32 drinks, and an empty `garnish` field on 30 of them: only the Spoonbill ("a spoon of caviar") and Brennan's Bloody Mary ("pickled okra and spicy beans") carry one. `method` is filled on three (Brandy Milk Punch, Classic Sazerac, Brennan's Irish Coffee). The study card therefore prints "not printed; confirm with the bar" on every glass. Filling these from the bar's answers, through the pack chain (WorldTable `tools/house/` overrides, then the mirror), would also settle every **Question for the bar** in section 4.2. The glass and garnish drawn in B16 to B28 and S06 are the classic ones until then.
- **Plate alt text.** The World Table plate image's alt text is generic ("six illustrated subjects, numbered 1 to 6", `src/lib/components/PlateIllustration.svelte:63`). The 120 written image descriptions in `plates.json` (`teaching.subjects[].image`) would make a far better alt text, numbered, for a reader who cannot see the plate. Every new image in this brief needs real alt text too, written from its "Must teach" lines, never `alt=""`.
- **The Bananas Foster story.** The World Table recipe `bananas-foster` says in its note that the dessert was made "for a customs official named Foster". The Brennan's pack, from the house's own account, names Richard Foster, Owen Brennan's friend and chairman of the New Orleans Crime Commission. The recipe note should be corrected through the source data so a server never tells the wrong story.
- **The Brennan's dishes have no image field and no plating notes.** The house schema needs an image field keyed by dish id before S03 can be wired, and a line of plating per dish (from the pass) would let the prompts draw the house arrangement rather than a fair reading of the menu.
- **Technique standards to read before S01 runs.** Several rows of the S01 table say "from the data": their marks and fault must be read out of `technique-standards.json` first, and caramelising onions needs a standard written before it can be drawn.
- **The California atlas sheet.** Napa and Sonoma share one number on `california.svg`; give them separate numbers in `.scripts/atlas-v2/catalog.cjs` when the Napa zoom sheet (C05) lands.
- **Open lineup questions that decide pictures.** Whether the Bananas Foster cart adds banana liqueur and which rum; whether the Chateaubriand is carved and the papillote opened at the table; how the Louisiana Oysters are cooked and how many come; the colour of the Flamingo's dragonfruit; how the Bodrum's pistachio goes in; whether the Apple Crumble is hot or cold. Each answer, once in the pack, unlocks or corrects an entry.
