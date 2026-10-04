# The World Table: image audit and ChatGPT image brief

Prepared 4 October 2026 for the owner, a new server at Brennan's, 417 Royal Street, New Orleans. ChatGPT makes every picture in this suite; this document only writes the brief. Nothing here has been made or shipped.

How to use it: open a fresh ChatGPT chat, paste the style guide in section A once, then paste one prompt at a time from section C or D. Each prompt is complete on its own after the style guide. Save each result under the file name given (ChatGPT hands back a PNG: keep the name, change only the extension to .png, and Claude encodes the WebP and wires it in later).

Sources read for every fact below: the Brennan's house pack (`static/shared/packs/brennans-new-orleans.v1.oothouse.json`, menus read 3 October 2026), the plate data (`src/lib/data/plates.json`), the plate brief (`docs/teaching-folios.md`), the lexicon (`src/lib/data/lexicon.json`), the techniques and their standards (`src/lib/data/techniques.json`, `src/lib/data/technique-standards.json`), the recipes (`src/lib/data/recipes.full.json`) and the Floor Deck (`src/lib/data/floor-deck.json`). Every current image was opened and looked at, and the published app was viewed at 390 px wide.

---

## A. The World Table style guide for ChatGPT (paste once)

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

### The palette behind the guide

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

---

## B. Audit of every current image

Verdict key: **Keep** (teaches, accurate), **Keep, fix** (teaches, one or more panels wrong or off-brief, an entry in section C repairs it), **Note** (small issue, not worth a re-run on its own), **Code** (needs a code or encoding change, not ChatGPT).

### B1. The twenty v2 study plates (`static/plates/<slug>-v2.webp`, 1024 x 1536, quality 83; thumbnails `<slug>-v2.thumb.webp`, 360 x 540)

All twenty share the house look exactly: ivory paper, forest-green and gold frame, compass roses, corner sprigs, six numbered cells. At 390 px the plate shows at about 350 px wide, the numerals stay legible and each subject keeps a clear silhouette. They teach: each numeral matches a written subject with facts and a distinction. Weight is right (135 to 259 KB full, 19 to 34 KB thumbnails), loaded on demand. Panel-by-panel findings against each subject's written image description:

| Plate | Size (full / thumb) | Verdict | Finding and improvement |
|---|---|---|---|
| chicken-cuts | 153,918 / 20,946 B | Keep | Breast, thigh (skin-on and skinless), drumstick, wing with drumette, flat and tip, liver, split gizzard all match. |
| pork-cuts | 175,588 / 24,892 B | Note | Shapes right; the meat is painted a shade too beef-red for raw pork, and the loin's fat cap barely shows. Not worth a re-run alone. |
| beef-cuts | 241,688 / 33,038 B | Note | All six match (ribeye eye and cap, strip with fat edge, tapering tenderloin, two-lobed hanger). The meat surface has a pebbled, reptile-like texture that real muscle does not; fold into any future beef revision. |
| pacific-fish | 159,742 / 19,496 B | **Keep, fix** (WO-17) | Panel 4, sablefish, is drawn as a deep-bodied bass or bluefish with two close dorsal fins; sablefish is long, slim and slate-black with two widely separated dorsals. Panel 5, albacore, has pectoral fins of ordinary length; the guide's own key feature is "exceptionally long pectoral fins reaching far back along the body". Chinook, halibut (eyes on the upper side), cod with barbel and sardine are right. |
| atlantic-fish | 193,472 / 25,206 B | **Keep, fix** (WO-16) | Panel 6, lobster: the two claws are drawn the same size; the guide says "one heavy crusher claw and one finer-edged cutting claw" and the image brief "two visibly unequal large claws". Cod, haddock (dark lateral line, thumbprint), mackerel, black sea bass and scallop are right. |
| gulf-coast-fish | 172,034 / 25,676 B | Keep | Red snapper, red grouper, male mahi mahi, yellowfin with yellow finlets, uncooked white shrimp, blue crab with paddles all match. This is the plate most useful at Brennan's today. |
| northwest-vegetables | 243,690 / 31,088 B | Keep | All six match. |
| northwest-fruits | 239,042 / 30,728 B | Keep | The approved layout reference. All six match. |
| southwest-vegetables | 207,958 / 27,288 B | **Keep, fix** (WO-21) | Panel 1 is meant to be a "long smooth green Anaheim-style chile with a tapered point"; it is drawn as broad, glossy, wrinkled poblano-like pods. A guest-facing reader could learn the wrong pepper. |
| southwest-fruits | 258,990 / 33,906 B | Keep | All six match. |
| midwest-vegetables | 215,400 / 28,830 B | Note | Cabbage outer leaves are crinkled like a Savoy; the guide says a round green cabbage. Minor. |
| midwest-fruits | 230,390 / 31,448 B | **Keep, fix** (WO-19) | Panel 2, tart cherry, is a deep wine-red sweet cherry; the brief is "small bright red tart cherries". Panel 5, Concord grapes, are matt and speckled like the blueberries in panel 4, so the two read as one fruit. |
| northeastern-vegetables | 208,922 / 28,174 B | Keep | All six match. |
| northeastern-fruits | 203,890 / 28,144 B | **Keep, fix** (WO-20) | Panel 3, cranberry, hangs in a cherry-like cluster from a twig with broad leaves; the guide teaches "a small red berry produced by a low, trailing plant". The cut berry with its air chambers is right and should be kept. |
| southeastern-vegetables | 216,950 / 28,896 B | Note | Black-eyed pea pod is green and short where the brief says "long tan pod"; peas themselves are right. Minor. |
| southeastern-fruits | 234,462 / 31,224 B | Keep | All six match; the blueberry crowns are drawn as deep star-shaped holes on every plate that carries blueberries, a small exaggeration. |
| culinary-spices | 242,824 / 32,178 B | Keep | All six match. |
| culinary-mushrooms | 219,088 / 29,332 B | Note | Accurate (button and cremini rightly differ only in colour; maitake underside corrected). The cell rows are uneven and the numerals sit higher than on the other nineteen plates; fold into any future revision. |
| great-cheeses | 135,504 / 20,682 B | Keep | All six match, including the corrected interiors. |
| charcuterie | 233,754 / 31,814 B | **Keep, fix** (WO-18) | Panel 2, pancetta, is a flat slab with a peppered crust; the guide's image is "rolled pancetta with a cut spiral of pink meat and white fat". The summary allows either form, but the drawing must match the written image, and a spiral is the one form a server could not confuse with bacon. Prosciutto, guanciale, salame Milano, mortadella and bresaola are right. |

Two improvements that are not ChatGPT's:

- **Code: alt text.** The plate image's alt text is generic ("six illustrated subjects, numbered 1 to 6", `src/lib/components/PlateIllustration.svelte:63`). The 120 written image descriptions in `plates.json` (`teaching.subjects[].image`) would make a far better alt text, numbered, for a reader who cannot see the plate.
- **Code: file names.** The layout's offline warm-up accepts only `-v2` names (`src/routes/+layout.svelte:54`, the pattern `-v2(?:\.thumb)?`). Any v3 revision from section C needs that pattern widened to `-v\d+` and the builder paths, manifest and tests updated together, as `docs/teaching-folios.md` requires (never overwrite a filename).

### B2. The twenty archived posters (`static/plates/archive/<slug>.webp`)

Sizes vary: 1536 x 1024 (atlantic-fish, beef-cuts, gulf-coast-fish, pacific-fish, pork-cuts), 1024 x 1536 (charcuterie, great-cheeses), 1312 x 1199 (chicken-cuts, culinary-spices and all ten produce posters), 1224 x 1285 (culinary-mushrooms); 285 to 432 KB each. Dark, lettering-heavy posters (gulf-coast-fish viewed: gold display type, an invented Gulf map, generic "cuts" chunks that do not correspond to real fish butchery, and a "Red Fish" drawn as a generic snapper). **Verdict: Keep as archive, never extend.** They hold the known errors the corrections record; they are behind "View the original poster" only and are not quiz sources. No new art should copy their look.

### B3. The masthead (`static/house/world-table-library-v1.webp`, 1536 x 1024, 394,832 B)

A painted Explorer's Library: candlelit shelves, a stone arch onto a lake at sunset, a plated fish with tomatoes and herbs, copper pan, compass and map. **Verdict: Keep.** It is the house identity, it is ChatGPT's and it is not undone. It decorates rather than teaches, which is right for a masthead. At 390 px the arch and dish crop well behind the title. **Code (optional):** it loads at high priority on every page; a 768 px wide encode for narrow screens would cut about two thirds of the bytes with no change to the picture.

### B4. Icons

| File | Size | Verdict |
|---|---|---|
| `static/icon-512.png` | 512 x 512, 3,842 B | **Code.** A flat "T" under a striped awning in the old almanac palette (#191612 ground, #C2A055 gold, #EAE2CE ink). The app's palette is now midnight green #081510, brass #D5B16C and parchment #F3E9D5. A recolour is a two-minute code change, not a ChatGPT job: keep the mark, swap the colours. |
| `static/icon-192.png` | 192 x 192, 725 B | **Code**, as above. |
| `static/icon-maskable-512.png` | 512 x 512, 3,122 B | **Code**, as above; keep the safe-zone padding. |
| `static/favicon.svg` | 420 B | **Code**, same old palette, same recolour. |
| `src/lib/assets/favicon.svg` | Svelte logo | **Code.** Unused starter file (nothing imports it); delete it. |

### B5. What has no picture at all

1,844 recipes; 112 techniques (27 of them with no film either, among them the two most used in the whole guide: "Sweating aromatics: soft, never browned", 198 dishes, and "Salted water & the float test", 188); 60 technique standards, each a set of marks for done right and one fault; 797 lexicon terms, of which the visual atlases alone are 113 vegetables, 81 fruits, 46 cheeses, 46 spices, 41 charcuterie, 41 knives and equipment, 40 herbs and chiles, 40 grains and pulses and 21 fungi; 400 Floor Deck cards in 14 sections; and the Brennan's house of 62 dishes, which has no image field in its schema.

Not an image, but found while reading for this brief: the World Table recipe `bananas-foster` says in its note that the dessert was made "for a customs official named Foster". The Brennan's pack, from the house's own account, names Richard Foster, Owen Brennan's friend and chairman of the New Orleans Crime Commission. The recipe note should be corrected through the source data so a server never tells the wrong story.

### B6. Gaps ranked by value to the owner this month

1. Recognising the Brennan's plates on sight and naming every part (breakfast tasting, egg dishes, dinner entrées): WO-01, WO-02, WO-06, then the series D3.
2. The sauces that carry the menu (hollandaise, béarnaise, Choron, Foyot, marchand de vin, beurre blanc): WO-03.
3. Bananas Foster at the table, safely: WO-04, WO-05.
4. The dishes guests ask most about: WO-07 to WO-10.
5. The Louisiana larder and seafood behind the menu: WO-11, WO-12.
6. Kitchen fundamentals a server is asked about (roux, emulsions, doneness): WO-13 to WO-15.
7. Accuracy repairs to existing plates: WO-16 to WO-21.
8. The app's own imageless sets: WO-22 to WO-28, then the series templates D1, D2, D4 and D5.

---

## C. Entries

Every prompt below assumes the style guide above has been pasted earlier in the same chat, and repeats the essentials so it stands alone. "Where it appears" names the screen in the published app at `/table/`. "Must teach" quotes the source. Suggested paths are for Claude to wire in later.

A note on house plating: the Brennan's pack prints every dish's components but not how the kitchen arranges them on the plate. Where a prompt has to choose an arrangement, it says so, and the result must be held against the dish as it leaves the pass (a phone photo from the line is enough) before it goes in the app.

### C1. Brennan's first

#### WO-01. The Traditional Breakfast, course by course

- **File:** `brennans-traditional-breakfast-v1.webp`, 1024 x 1536, portrait plate. Suggested path `static/house/brennans/`.
- **Where it appears:** My Menu (`/table/menu.html`), the Tasting menus section, as the header image of the Traditional Breakfast; each numbered cell also serves as the recognition face of that dish's flash card ("which course is this?").
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

#### WO-02. Brennan's breakfast and lunch entrées: tell them apart

- **File:** `brennans-breakfast-entrees-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** My Menu, Entrées section header (Breakfast & lunch filter); each cell as a flash card face.
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

#### WO-03. The six sauces on the Brennan's menu

- **File:** `brennans-sauces-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** My Menu, under the house lexicon's sauce terms (Hollandaise, Béarnaise, Choron, Foyot, Marchand de vin, Beurre blanc), and on the Library's sauces Floor Deck cards.
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

#### WO-04. Bananas Foster at the table, in six steps

- **File:** `brennans-bananas-foster-tableside-v1.webp`, 1024 x 1536, portrait plate (a numbered sequence).
- **Where it appears:** My Menu, Desserts, on the World Famous Bananas Foster study card, above the tableside safety note; also in the Library on the Flambé technique.
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

#### WO-05. The flambé cart, set safely

- **File:** `brennans-flambe-cart-v1.webp`, 1536 x 1024, landscape folio.
- **Where it appears:** My Menu, Desserts, on both the Bananas Foster and Cherries Jubilee study cards, beside the numbered safety steps.
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

#### WO-06. Brennan's dinner entrées: tell them apart

- **File:** `brennans-dinner-entrees-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** My Menu, Entrées section header (Dinner filter), and as flash card faces.
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

#### WO-07. Eggs Hussarde, built up

- **File:** `brennans-eggs-hussarde-build-v1.webp`, 1536 x 1024, landscape folio.
- **Where it appears:** My Menu, Eggs Hussarde study card, at the top, so a server can describe the dish layer by layer ("two sauces").
- **Must teach:** "Housemade English muffins, coffee-cured Canadian bacon, hollandaise, poached eggs, marchand de vin sauce"; "Eggs Hussarde is New Orleans' answer to Eggs Benedict, with a red wine sauce as well as hollandaise"; "marchand de vin, 'wine merchant's sauce,' a savory red wine and mushroom sauce, and hollandaise, the buttery, lemony one".

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners. Lifelike natural-history watercolour over fine graphite, true food colour, soft daylight from the upper left, plain ivory background.

Left half: one finished Eggs Hussarde half on a plain round white plate, seen from about 45 degrees above: a toasted English muffin half, a round slice of Canadian bacon, a spoon of dark glossy red-wine and mushroom sauce, a soft poached egg, and pale yellow glossy hollandaise coating the egg.

Right half: the same five layers drawn as an exploded vertical stack floating one above the other with a little ivory space between, seen from the side, bottom to top: (1) the toasted English muffin half, craggy cut face up; (2) the round slice of pink Canadian bacon with a darker roasted edge; (3) a flat disc of dark glossy red-brown wine sauce with finely chopped mushroom; (4) the poached egg, smooth white, with a hint of soft yolk; (5) a cap of pale yellow hollandaise. Small dark brown serif numerals 1 to 5 sit to the right of each layer with short fine graphite leader lines.

The numerals and leader lines are the only marks: no words, labels or text.
```

- **Avoid:** an English-muffin cut face on top; ham in place of round Canadian bacon; the order of layers 2 to 5 is the house's long-published build and the pack does not print it, so confirm it on the pass before publishing.

#### WO-08. The poached egg: done right, and the fault

- **File:** `poached-egg-standard-v1.webp`, 1536 x 1024, landscape folio (pair).
- **Where it appears:** Library, Techniques, "Poaching eggs" (`/table/technique/poaching-eggs`), and linked from the Hussarde and Sardou study cards in My Menu.
- **Must teach:** the lexicon: "POACH: 71 to 82°C, water barely shivering: eggs ... anything delicate that violent bubbles would shred"; the film note: "The straining step that removes the loose outer white before the egg ever touches water, then the surface of the pot: it shivers rather than bubbles". Floor Deck hollandaise note: "The yolks are only gently warmed, never set firm."

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, the sheet divided into two equal cells by a hairline gold rule with a tiny gold star at each end. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. A dark brown serif numeral centred under each cell: 1 on the left, 2 on the right.

1. Done right: above, a small pan of water whose surface only shivers, with no bubbles breaking, and a neat egg holding together in it; below, on a plain white saucer, the drained poached egg: a compact, smooth, oval white wrapped closely round the yolk, no ragged edges, and beside it a second egg cut open so the yolk runs, deep orange and liquid.
2. The fault: above, the same pan at a hard rolling boil with large bubbles; below, on the same saucer, a flattened egg trailing ragged, feathery wisps of white, and beside it one cut open showing a firm, pale, set yolk.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** vinegar bottles or labels; a perfect sphere (a real poached egg is a soft oval); a cooked-through yolk in panel 1.

#### WO-09. Chateaubriand for two, with sauce Foyot

- **File:** `brennans-chateaubriand-v1.webp`, 1536 x 1024, landscape folio.
- **Where it appears:** My Menu, Roasted Chateaubriand study card, top; also on the Floor Deck card "Chateaubriand" in the Library.
- **Must teach:** "Chateaubriand is the thick center cut of the beef tenderloin, roasted for two"; lexicon: "The tapered tail becomes tips, the center-cut châteaubriand, the crosscuts filet mignon"; "sauce Foyot, béarnaise enriched with meat glaze"; sides "roasted and glazed summer squash"; "Ask temperature once for the table."

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two cells side by side divided by a hairline gold rule, a dark brown serif numeral under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left.

1. Where the cut comes from: a whole raw beef tenderloin lying on the ivory paper, long and tapering, broad at the head end and narrowing to a thin tail, deep red with fine grain and very little fat. The thick, even centre section is shown separated from the head and the tail by two thin clean cuts with a little ivory space between the three pieces, so the centre cut stands out as the thickest, most even part.
2. The dish: that centre cut roasted whole, a deep brown crust all round, on a plain white oval platter, three thick slices carved from one end and laid overlapping to show an even rosy medium-rare interior edge to edge with a thin brown crust, beside lengths of glazed golden-edged summer squash, and a small plain white sauceboat of glossy caramel-tan sauce flecked with green tarragon.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** a grey band under the crust (the standard for searing says "a thick grey collar under the crust means the heat was too low"); a red, raw centre; a carving knife or fork in a guest's hand. The table chooses the temperature; medium-rare is drawn because it is the one most ordered, and the app's text says so.

#### WO-10. Gulf Fish en Papillote, closed and opened

- **File:** `brennans-gulf-fish-papillote-v1.webp`, 1536 x 1024, landscape folio.
- **Where it appears:** My Menu, Gulf Fish en Papillote study card, top.
- **Must teach:** "En papillote means in paper; here we use a banana leaf instead, so the fish steams in its own juices and stays moist"; inside: "Louisiana crab adds sweetness, tomato and Castelvetrano olives, bright green, mild and buttery ... Marcona almonds and sorghum, a chewy ancient grain". Lineup question: "Ask at lineup whether it's opened at the table, if so, warn guests about the steam."

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two cells side by side divided by a hairline gold rule, a dark brown serif numeral under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. Each on a plain round white plate seen from about 45 degrees above.

1. Closed: a neat, flat rectangular parcel of glossy green banana leaf, folded over on itself with the fine parallel veins of the leaf clearly visible, the edges slightly browned from the oven, sealed and plump.
2. Opened: the same parcel with its leaf folded back, a little steam rising, showing a moist white Gulf fish fillet, white lumps of crab meat on top, bright green Castelvetrano olives, small pieces of red tomato in their juice, pale cream rounded Marcona almonds and a scattering of small round cream-coloured sorghum grains.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** parchment paper or foil; string or toothpicks (how it is closed is not printed); black olives; whole almonds in brown skins (Marcona almonds are skinless and rounded).

#### WO-11. The Louisiana seafood behind the menu

- **File:** `brennans-louisiana-seafood-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** My Menu, at the head of the house's seafood dishes; also on the Plates wall under "The fish case" as a companion to the Gulf Coast plate.
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

#### WO-12. The Louisiana larder: trinity and smokehouse

- **File:** `louisiana-larder-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** Plates wall, "The pantry" kind, and linked from the house's gumbo, shrimp and grits and the Library terms Tasso and Andouille.
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

#### WO-13. The roux, from white to brick

- **File:** `roux-colour-ladder-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** Library, Techniques, "Making a roux" (`/table/technique/making-a-roux`), and linked from the house's Seafood Gumbo ("Gumbo is the Louisiana stew built on a dark roux").
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

#### WO-14. Hollandaise: how it comes together, and the two ways it splits

- **File:** `hollandaise-standard-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** Library, Techniques, "Hollandaise" (`/table/technique/hollandaise`) and "Building an emulsion"; linked from the house sauces (WO-03).
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

### C2. The World Table's own entries

#### WO-15. Beef doneness, from rare to well done

- **File:** `beef-doneness-ladder-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** Library, Techniques, "Resting meat & slicing against the grain", and the Floor Deck cuts cards (Tenderloin, Chateaubriand, Hanger Steak). At Brennan's it serves every temperature question: the petite filet ("Ask filet temperature when you take the tasting order"), the hangers ("best medium-rare to medium"), the Chateaubriand.
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

#### WO-16. Atlantic plate, revised: the lobster's two claws

- **File:** `atlantic-fish-v3.webp` (and thumbnail made by Claude), 1024 x 1536. A new name, never overwriting v2.
- **Where it appears:** Plates wall, The fish case, Atlantic (`/table/plates/atlantic-fish`).
- **Must teach:** "A large crustacean with one heavy crusher claw and one finer-edged cutting claw"; "Live animals are usually olive or greenish brown"; image brief "two visibly unequal large claws".

```
Attach the current Atlantic plate (atlantic-fish-v2.webp) and edit it. Using the World Table style guide, keep the whole plate exactly as it is, the ivory paper, the dark forest-green and gold frame, the compass roses, the corner sprigs, the six cells, the numerals and panels 1 to 5 untouched. Change only panel 6, the American lobster (Homarus americanus), uncooked and seen from above: keep its olive-brown and greenish live colour, its long antennae and its tail fan, but make the two big claws clearly unequal. One claw, the crusher, is much broader and heavier, swollen, with thick rounded blunt molar-like teeth along its inner edges. The other, the cutter or pincer claw, is longer, slimmer and narrower, with fine, sharp, close-set teeth. The difference must be obvious at a glance on a small phone screen. Same lifelike natural-history watercolour, same scale, same light, same placement in the cell. No words or labels; the numeral 6 stays beneath it.
```

- **Avoid:** any red (cooked) colour; changing panels 1 to 5; moving the numeral.

#### WO-17. Pacific plate, revised: sablefish and albacore

- **File:** `pacific-fish-v3.webp`, 1024 x 1536.
- **Where it appears:** Plates wall, The fish case, Pacific.
- **Must teach:** sablefish "The North Pacific fish marketed as black cod, although it is not a member of the cod family", "An elongated, dark-bodied fish", "no cod-like chin barbel"; albacore "A streamlined tuna with exceptionally long pectoral fins reaching far back along the body", "Dark blue back, silver sides and a pale tail edge".

```
Attach the current Pacific plate (pacific-fish-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals, and panels 1, 2, 3 and 6 untouched. Change only two panels, keeping the same side view facing left, scale and natural-history watercolour:
Panel 4, sablefish (Anoplopoma fimbria): a long, slim, cylindrical fish, slate-black to dark charcoal-grey on the back fading to grey below, with small scales, a pointed snout, no chin barbel, two clearly separate dorsal fins with a wide gap between them (the first short and spiny, the second set well back), and a broad, slightly forked tail. It must not look like a bass, a bluefish or a cod.
Panel 5, albacore tuna (Thunnus alalunga): keep the torpedo-shaped body with dark blue back and silver sides, but make the pectoral fins very long and sword-like, reaching back past the start of the second dorsal fin and anal fin, and give the tail fin a thin pale white trailing edge.
No words or labels; the numerals 4 and 5 stay beneath their fish.
```

- **Avoid:** a barbel on the sablefish; yellow finlets on the albacore (that is the yellowfin of the Gulf plate).

#### WO-18. Charcuterie plate, revised: rolled pancetta

- **File:** `charcuterie-v3.webp`, 1024 x 1536.
- **Where it appears:** Plates wall, The board, Charcuterie.
- **Must teach:** "Cured pork belly, often presented as a slab or rolled into a cylinder"; "Alternating lean and fat"; "Its belly origin distinguishes it from cheek-based guanciale"; image brief "Rolled pancetta with a cut spiral of pink meat and white fat".

```
Attach the current charcuterie plate (charcuterie-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals and panels 1 and 3 to 6 untouched. Change only panel 2, pancetta: a rolled pancetta (pancetta arrotolata), a firm cylinder of cured pork belly tied with plain white butcher's string at even intervals, its outside dusted with cracked black pepper, one end cut cleanly to show a tight spiral of rose-pink lean and creamy white fat, with three thin round slices fanned in front showing the same spiral. Same lifelike natural-history watercolour, same scale and light. No words or labels; the numeral 2 stays beneath it.
```

- **Avoid:** a flat slab (that reads as bacon or guanciale); a smoked brown exterior; red salami-like colour.

#### WO-19. Midwest fruits, revised: tart cherry and Concord grape

- **File:** `midwest-fruits-v3.webp`, 1024 x 1536.
- **Where it appears:** Plates wall, The larder by region, Midwest fruits.
- **Must teach:** tart cherry "A sour red stone fruit commonly used in cherry pies", "It differs from the sweet cherry often served fresh", image brief "Small bright red tart cherries, one cut to show its central stone"; Concord "A dark purple, seeded grape", "Concord and muscadine are different grape types", image brief "Loose bunch of round purple Concord grapes with a dusty bloom".

```
Attach the current Midwest fruits plate (midwest-fruits-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals and panels 1, 3, 4 and 6 untouched. Change only two panels, same lifelike natural-history watercolour and scale:
Panel 2, tart cherries (sour cherries): small, round, bright scarlet-red cherries, slightly translucent and lighter than a sweet cherry, on long slender green stems in a pair and a single, with one cut in half to show juicy pale red flesh and a small round stone. They must look clearly brighter and redder than a dark sweet cherry.
Panel 5, Concord grapes: a loose bunch of round, medium-sized, blue-black to deep purple grapes on a woody stem, each covered in a soft, pale, silvery-blue powdery bloom that rubs off to show glossy dark skin where a finger has touched, with one grape split to show pale green translucent flesh and a seed, and a broad lobed grape leaf. The grapes must not look like the blueberries in panel 4: no five-point crowns, rounder and larger, on a branching bunch.
No words or labels; the numerals stay in place.
```

- **Avoid:** crowns on the grapes; a dark wine-red cherry.

#### WO-20. Northeast fruits, revised: the cranberry's trailing vine

- **File:** `northeastern-fruits-v3.webp`, 1024 x 1536.
- **Where it appears:** Plates wall, The larder by region, Northeast fruits.
- **Must teach:** "A small red berry produced by a low, trailing plant adapted to acidic, moist ground"; "Berry of a trailing evergreen plant"; "The plant grows in soil; flooding does not mean the fruit grows underwater"; image brief "Small deep red cranberries, one cut crosswise".

```
Attach the current Northeast fruits plate (northeastern-fruits-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals and panels 1, 2, 4, 5 and 6 untouched. Change only panel 3, cranberry: a short length of low, trailing, woody cranberry runner lying almost flat, with many tiny, oval, glossy dark green evergreen leaves only a few millimetres long along it, and five or six small, round to slightly oval, glossy deep red berries, each on its own short stalk rising from the runner, not hanging in a cluster. In front, keep one berry cut crosswise to show the white flesh and its four small air chambers with seeds. Same lifelike natural-history watercolour, scale and light. No words or labels; the numeral 3 stays beneath it.
```

- **Avoid:** broad cherry-like leaves; berries hanging in a bunch; water.

#### WO-21. Southwest vegetables, revised: the Anaheim chile

- **File:** `southwest-vegetables-v3.webp`, 1024 x 1536.
- **Where it appears:** Plates wall, The larder by region, Southwest vegetables.
- **Must teach:** "An elongated Capsicum fruit used for varying degrees of heat"; "The pictured Anaheim-style form does not promise a fixed heat level"; image brief "Long smooth green Anaheim-style chile with a tapered point".

```
Attach the current Southwest vegetables plate (southwest-vegetables-v2.webp) and edit it. Using the World Table style guide, keep the plate exactly as it is, the ivory paper, the frame, the ornaments, the six cells, the numerals and panels 2 to 6 untouched. Change only panel 1, the chile: two long, narrow, smooth Anaheim-type green chiles, each about six times as long as it is wide, a medium bright green with a light gloss, gently curved and slightly flattened, tapering to a point, with a short green stem and cap; and one split lengthwise showing thin walls, pale ribs and a cluster of cream seeds near the stem. Same lifelike natural-history watercolour, scale and light. No words or labels; the numeral 1 stays beneath it.
```

- **Avoid:** broad, dark, heart-shaped poblano pods; stubby jalapeño shapes; red colour.

#### WO-22. The French herbs

- **File:** `french-herbs-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** Plates wall, The pantry; the Library's Herb & Chile Atlas terms. At Brennan's: fines herbes on the Louisiana Crab Claws; tarragon in béarnaise, Choron and Foyot; parsley on the Grand Isle Jewel Oysters.
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

#### WO-23. Searing: the hard crust, and the grey fault

- **File:** `searing-standard-v1.webp`, 1536 x 1024, landscape folio (pair). This is the first run of series D1.
- **Where it appears:** Library, Techniques, "Searing: the hard crust", in the standard's done-right marks and fault.
- **Must teach:** "Deep even brown across the whole face, edge to edge ... no pale ring left around a browned centre, and no black patches"; "the browned band is thin, a few millimetres at most, sitting straight on top of correctly cooked interior; a thick grey collar under the crust means the heat was too low for too long". Fault: "the food released its water and sat in it: the surface goes grey and steams, it sticks when moved".

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two equal cells side by side divided by a hairline gold rule, a dark brown serif numeral centred under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left.

1. Done right: above, a thick strip steak in a black cast-iron pan, the top face turned to show a deep, even, mahogany-brown crust from edge to edge with no pale ring; below, the same steak cut across, showing a thin brown crust of a few millimetres sitting directly on an even rosy-pink interior.
2. The fault: above, the same steak in a crowded pan sitting in a shallow pool of grey liquid, its face patchy grey-brown and wet with a pale ring round the edge; below, the same steak cut across, showing a weak crust over a thick grey band that runs well into the meat before a small pink centre.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** black burnt patches in panel 1; smoke clouds; a brand mark on the pan.

#### WO-24. Resting and slicing against the grain

- **File:** `resting-slicing-standard-v1.webp`, 1536 x 1024, landscape folio (pair). Series D1.
- **Where it appears:** Library, Techniques, "Resting meat & slicing against the grain".
- **Must teach:** "The board is nearly dry when it is finally cut. A spreading pool means it was cut too early"; "The grain was found and the knife went ACROSS it, so the fibres are cut short". Fault: "It was cut straight off the heat ... it runs out onto the board". Lexicon on hanger and skirt: "slice thin against their very obvious grain".

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners, two equal cells side by side divided by a hairline gold rule, a dark brown serif numeral centred under each: 1 left, 2 right. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left. Each cell shows a plain pale wooden board from about 45 degrees above with a cooked hanger steak on it, its long coarse grain clearly visible as parallel lines along the meat.

1. Done right: the rested steak sliced straight across the grain into neat slices, each cut face showing short, fine, cross-cut fibres and an even pink interior; the board almost dry, with only a faint sheen.
2. The fault: the same steak cut too soon and along the grain into long, stringy strips with the fibres running the length of each slice, and a wide pool of red juice spreading across the board.

The two numerals are the only marks: no words, labels or text.
```

- **Avoid:** a knife or hand in the picture; a different cut of beef between the two cells.

#### WO-25. Sugar stages, by the cold-water test

- **File:** `sugar-stages-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** Library, Techniques, "Sugar stages & caramel" (a technique with no film), and linked from the house's Bananas Foster and pralines on the bread pudding.
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

#### WO-26. The classical knife cuts

- **File:** `knife-cuts-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** Library, Techniques, "Knife cuts: dice, julienne, bias", and the lexicon term "Knife Cuts: The Classical Ladder".
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

#### WO-27. Six kitchen knives

- **File:** `kitchen-knives-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** Plates wall, a new "The kit" group or The pantry; the Library's Knife & Equipment Atlas terms.
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

#### WO-28. Pot and pan shapes, and why they differ

- **File:** `pot-shapes-v1.webp`, 1024 x 1536, portrait plate.
- **Where it appears:** the Library term "Pot Shapes: Saucier, Rondeau, Stock & Why Geometry Matters", and Techniques "Reducing a sauce" (a technique with no film).
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

### C3. What is not written, and why

- **A Brennan's place setting.** The pack carries the dress code, the meals and the service notes, but nothing about the cover: no charger, napkin fold, silver layout, bread plate or glass positions. A picture would be guesswork about a real restaurant's standard. Once the setting is written into the house (or the owner photographs a set table at lineup and the steps are typed in), a landscape folio from above with numerals keyed to each piece follows the same pattern as WO-05.
- **The Louisiana Oysters.** The pack says "Confirm at lineup how the oysters are cooked and plated, and how many come per order", so a plate would invent the count and the form. The raw Grand Isle Jewel Oysters are covered by WO-11 panel 2.
- **The drinks** on the Traditional Breakfast and every cocktail and wine belong to the Bartender's Ledger and the Sommelier's Codex briefs. The 32 Brennan's drinks in the pack also have empty glass and garnish fields, which must be filled through the pack chain before any drink is drawn.

---

## D. Series templates for the big sets

Each template is one reusable prompt with slots in braces. Fill the slots from the source named, never from memory, then paste.

### D1. Technique standard: done right against the fault (60 standards)

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

### D2. Lexicon specimen plate (the visual atlases: 113 vegetables, 81 fruits, 46 cheeses, 46 spices, 41 charcuterie, 40 herbs and chiles, 21 fungi)

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
| `charcuterie-2-v1` | six Charcuterie Atlas terms not on the current plate, including tasso and andouille if WO-12 is not run | Coverage of the 41 terms. |

### D3. Brennan's dish card hero (62 dishes)

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

### D4. Recipe hero (1,844 recipes)

- **File pattern:** `recipe-<recipe-slug>-v1.webp`, 1536 x 1024, landscape folio, one finished dish.
- **Where:** the recipe page (`/table/recipe/<slug>`), top. Lowest priority of the five series: a recipe hero shows the goal but teaches less than a standard pair or a specimen plate.
- **Slots:** `{dish}` and `{finish}`, the finished look taken from the recipe's final steps and note.

```
Using the World Table style guide: a landscape study folio, 1536 x 1024 pixels, warm ivory paper (#F4E9CD), fine very dark forest-green border (#141C13) with thin antique-gold rules (#A8905B), gold compass roses top and bottom centre, gold leaf sprigs in the corners. One finished dish, centred with generous ivory margin: {dish}, {finish}. Lifelike natural-history watercolour over fine graphite, true food colour, soft daylight from the upper left, on a plain white plate or bowl with no pattern, seen from about 45 degrees above, nothing on the paper but the dish. No numerals, words, labels, logos or text.
```

First items, chosen because each sits behind a Brennan's dish: `bananas-foster` ("Over cold ice cream immediately", "One minute per side keeps the bananas intact"), `chicken-and-andouille-gumbo` (milk-chocolate roux, scallions, served over rice), `sauce-hollandaise`, `beurre-blanc-the-cold-butter-mount`, `sauce-bearnaise`, `gumbo-zherbes`, `grillades-and-grits`, `salmon-en-papillote`.

### D5. Floor Deck word card (400 cards)

- **File pattern:** `deck-<card-id>-v1.webp`, 1024 x 1024, square.
- **Where:** the Floor Deck card face in Flashcards, small at the top of the card. Run it only for the sections a picture helps: fish (39), cuts (30), mushrooms (25), cured (31), sauces (30), bread (24) and custards (26).
- **Slots:** `{term}` and `{look}`, the look taken from the card's gist and why.

```
Using the World Table style guide: a square study card, 1024 x 1024 pixels, warm ivory paper (#F4E9CD) inside a fine very dark forest-green border (#141C13) with a thin antique-gold rule (#A8905B) and a small gold leaf sprig in each corner (no compass roses on this small format). One subject centred with generous margin: {term}, {look}. Lifelike natural-history watercolour over fine graphite, true colour, soft daylight from the upper left, a soft contact shadow, nothing else on the paper. No numerals, words, labels or text.
```

First items, chosen for Brennan's: fd_0196 Béarnaise, fd_0197 Hollandaise, fd_0205 Beurre Blanc, Chateaubriand, Hanger Steak, Tenderloin, Oysters, Crawfish, Blue Crab, Shrimp, Mignonette, Gastrique (the Popcorn Shrimp's Crystal gastrique), Bordelaise (but the pack warns "in New Orleans it often means garlic butter", so hold it until the kitchen answers).

---

## Hand-back for Claude

| ID | Deliver as (PNG from ChatGPT) | Publish as | Suggested home | Wiring note |
|---|---|---|---|---|
| WO-01 | brennans-traditional-breakfast-v1.png | .webp 1024 x 1536 + 360 x 540 thumb | static/house/brennans/ | needs a house image field or a My Menu plate strip |
| WO-02 | brennans-breakfast-entrees-v1.png | as above | static/house/brennans/ | as above |
| WO-03 | brennans-sauces-v1.png | as above | static/house/brennans/ | link from the house lexicon terms |
| WO-04 | brennans-bananas-foster-tableside-v1.png | as above | static/house/brennans/ | Foster study card |
| WO-05 | brennans-flambe-cart-v1.png | .webp 1536 x 1024 | static/house/brennans/ | Foster and Jubilee cards |
| WO-06 | brennans-dinner-entrees-v1.png | 1024 x 1536 + thumb | static/house/brennans/ | as WO-01 |
| WO-07 | brennans-eggs-hussarde-build-v1.png | 1536 x 1024 | static/house/brennans/ | Hussarde card |
| WO-08 | poached-egg-standard-v1.png | 1536 x 1024 | static/standards/ | technique page |
| WO-09 | brennans-chateaubriand-v1.png | 1536 x 1024 | static/house/brennans/ | Chateaubriand card |
| WO-10 | brennans-gulf-fish-papillote-v1.png | 1536 x 1024 | static/house/brennans/ | papillote card |
| WO-11 | brennans-louisiana-seafood-v1.png | 1024 x 1536 + thumb | static/plates/ or static/house/brennans/ | plate data entry with six subjects |
| WO-12 | louisiana-larder-v1.png | 1024 x 1536 + thumb | static/plates/ | new plate in plates.json |
| WO-13 | roux-colour-ladder-v1.png | 1024 x 1536 | static/standards/ | technique page |
| WO-14 | hollandaise-standard-v1.png | 1024 x 1536 | static/standards/ | technique page |
| WO-15 | beef-doneness-ladder-v1.png | 1024 x 1536 | static/standards/ | technique page and deck cards |
| WO-16 to WO-21 | <slug>-v3.png | 1024 x 1536 + thumb | static/plates/ | new filenames; widen the `-v2` pattern in +layout.svelte; update images.json, builder paths and tests together; keep v2 files |
| WO-22, WO-26 to WO-28 | as named | 1024 x 1536 + thumb | static/plates/ | new plates in plates.json |
| WO-23, WO-24 | as named | 1536 x 1024 | static/standards/ | technique pages |
| WO-25 | sugar-stages-v1.png | 1024 x 1536 | static/standards/ | technique page |

Encoding follows the plate brief: WebP quality 83, method 6; thumbnails fit within 360 x 540, Lanczos, quality 78. Every new file loads on demand and stays out of precache. Image QA checks each numbered panel against the written subject, not against the prompt.
