# The Bartender's Ledger: image audit and ChatGPT image brief

Audited 4 October 2026 from the source repo `/home/user/bartendersledger` (HEAD 693e5d5) and the published copy at `/ledger/` on the site, which carries the same image bytes. Every current image was opened and looked at: the masthead and the four PNG icons read directly, the eight technique plates, eleven glass icons and four ornaments rendered in Chromium at 390 px on the app's felt and read back as PNG, and the live screens (Home, the Brennan's menu list, a drink's study card) captured at 390 by 844.

The Ledger is a study app for the bar: the server, barback or bartender learns a drink by name, build, glass and garnish. Its only art today is one painted entrance and a handful of thin brass line drawings. 365 cocktails, 32 Brennan's drinks, 143 garnish strings, 19 reference glasses, the bar tools, six of the core techniques and the coffee bar have no picture at all. The brief below fills the gaps that teach most to a new server at Brennan's this month first, then the bar's own canon.

Contents:

- A. The Ledger style guide for ChatGPT (paste once)
- B. Audit of every current image
- C. The entries: Brennan's first (BA-01 to BA-14), then the Ledger's own (LG-01 to LG-14)
- D. Series templates for the big sets
- E. Notes: the data task, the code tasks, the hand-back spec

---

## A. The Ledger style guide for ChatGPT

Paste the block below into ChatGPT once, at the start of the conversation, before any prompt from section C or D.

```
STYLE GUIDE: THE BARTENDER'S LEDGER (paste once, then send prompts one at a time)

You are illustrating a bartending study app called The Bartender's Ledger, part of a
hospitality training suite called Outside Of Time. Its world is "the explorer's cocktail
library": a candlelit bar inside an old library, dark green baize, antique brass, leather,
cut crystal, warm light. Every image you make is a TEACHING image. A bartender or a server
must be able to look at it on a phone screen 390 pixels wide and learn something true:
which glass, what colour, which garnish, how a tool is held, what a technique looks like.
Never decorate for its own sake.

THE PALETTE (from the app's own colour tokens; keep to it):
- Deep felt green, the ground of the app: #081510, #102119, #14312a, #1d443a, #304333
- Antique brass, the line and frame colour: #d5b16c, #c9a44c
- Pale gold, highlights: #f1d89e, #e6cc8a
- Cream, the lightest tone: #f3e9d5, #f1e7d3; parchment #eee2c8
- Warm ink brown for deep shadow: #29271f
- Oxblood, used sparingly as an accent: #843d37, #a1453d
- Near black page: #050d09
The drink, the fruit and the garnish are always drawn in their TRUE colours, never tinted
gold by the light. The palette governs the setting, the frame and the line, not the food.

THERE ARE TWO FAMILIES OF IMAGE. Each prompt names which one it wants.

FAMILY 1, THE CANDLELIT CARD (drink portraits). It continues the app's painted entrance:
a richly detailed, realistic oil-painting look, an old-world bar at night lit by candles.
- One drink, the hero, centred, in its exact glass, standing on a dark polished wooden bar
  top that softly reflects it. Eye level just above the rim, so the surface of the drink,
  its foam or float and the garnish are all visible, and the whole glass including its
  foot or base is in frame with clear space around it.
- The glass fills about 60 percent of the frame height. Nothing overlaps it.
- Background: a dark library bar thrown well out of focus: shelves of bottles and leather
  books as soft warm bokeh, deep felt green and brown, a candle glow. Bottle labels are
  never readable. No window view, no sunset, no people, no hands unless the prompt asks.
- Light: a warm candle key light from the left, a soft cool rim light from behind that
  outlines the glass edge against the dark, gentle reflections on the bar top.
- The liquid is painted accurately: its true colour, its clarity or cloudiness, its
  bubbles, its foam line, its ice (or the absence of ice). Glass is clean and clear.
- Format: square, 1024 x 1024 pixels.

FAMILY 2, THE BRASS PLATE (diagrams, techniques, tools, charts). It continues the app's
engraved line drawings and its icon:
- A fine copperplate engraving drawn in antique brass (#d5b16c) and pale gold (#f1d89e)
  lines on deep felt green (#102119 fading to #081510 at the edges), with a faint
  felt-cloth grain. Shading is done with fine hatching and cross-hatching, not airbrush.
- A thin double brass rule frame inset from the edge with softly rounded corners, and a
  small brass diamond centred in the bottom margin, exactly like the app's icon.
- Restrained 1920s art deco geometry. Clean, technically accurate, like a plate in an
  antique bartender's manual.
- Colour is used ONLY where colour is the lesson (a liquid's true colour, citrus skin,
  a cherry, mint), as a transparent watercolour wash inside the engraved lines. Everything
  else stays brass line on green.
- Hands, when shown, are drawn as engraved line too: anonymous, no rings, no faces.
- Format: portrait 1024 x 1536 for step sequences and numbered charts, square 1024 x 1024
  for a single figure.

LETTERING: no words, letters or numbers inside any image, EXCEPT where a prompt asks for
numerals on a numbered chart. Then use only the numerals the prompt lists, small, in brass
classical serif capitals, placed beside each subject. The names are printed by the app,
not by you. No captions, no titles, no signatures, no watermarks.

NEVER: real people or recognisable faces; brand logos, readable labels or trademarked
bottle shapes (a plain generic bottle is fine); text; neon colours; a golden or sepia cast
over the drink or the fruit; extra drinks or extra glasses beside the hero unless asked;
props that could be mistaken for part of the drink; garnishes, straws, umbrellas or ice
the prompt does not name; smoke, fire or sparkles unless the prompt names them; anything
cartoonish, glossy 3D or stock-photo; modern bar clutter (phones, menus, POS screens).

If a prompt and this guide disagree, the prompt wins on facts (glass, colour, garnish),
and this guide wins on look.
```

---

## B. Audit of every current image

Judged as a teacher: is it true, can it be read at 390 px, does it teach or only decorate, does it match the app, and what does it weigh.

### B1. Image files (6)

| Path | Size and weight | What it is | Verdict | Improvement |
|---|---|---|---|---|
| `img/explorers-library.webp` | 1536 x 1024, VP8 webp, 386,948 bytes | The painted masthead (ChatGPT's): an Old Fashioned in a cut-crystal rocks glass with a large cube and an orange peel, a jigger, a brass shaker, a leather book, a compass and a map on a polished bar, under a stone arch opening on a Mediterranean coast at sunset. `alt=""`, `aria-hidden`, behind a dark gradient. | Keep. It is the house look and every new card in Family 1 extends it. It is decorative by design (the entrance), and the drink in it is drawn correctly (rocks glass, large cube, peel, jigger beside it). At 390 px Home crops it to the glass (`object-position:51% 64%`) and it reads well; interior pages show only a dark band of it. | No new art. Encoding only: a 768 px wide `srcset` variant for phones would cut the first paint on every page by roughly two thirds. That is a code task, not a ChatGPT one. |
| `icons/icon.svg` | 512 viewBox, 1,570 bytes | App icon source: felt-green rounded square, double brass rule, a gold coupe with a cherry on a pick, a brass diamond pip. | Keep. The double rule and the pip are the frame Family 2 borrows. | None. |
| `icons/icon-512.png` | 512 x 512, 81,934 bytes | The icon rasterised. | Keep. Clean and legible. | None. |
| `icons/icon-maskable-512.png` | 512 x 512, 64,381 bytes | Maskable icon with safe padding. | Keep. The coupe sits inside the safe zone. | None. |
| `icons/icon-192.png` | 192 x 192, 24,581 bytes | Small icon. | Keep. | None. |
| `icons/apple-touch-icon.png` | 180 x 180, 22,837 bytes | Home-screen icon on iPhone. | Keep. The cherry still reads at this size. | None. |

### B2. Inline SVG drawings (code, `js/ui-new.js` and `index.html`)

The technique plates sit in More, under Notes, in a "Technique Plates · 8 figures" accordion; each is a 200 x 156 viewBox, single 1.4 px brass stroke, no fill, with its title and a long caption beneath. At 390 px a plate renders about 330 px wide and at most 170 px tall.

| Item | What it draws | Verdict | Improvement |
|---|---|---|---|
| Plate I, The Two-Tin Seal (line 443) | A tin with a dashed line, a parallelogram above it for the small tin, a small arc. | Weak. Without hands or the angle shown clearly, the small tin reads as a floating box; the strike and the angled seal (the whole lesson) are not visible. | Redraw as a Family 2 plate (series S3). |
| Plate II, The Hawthorne Gate (446) | A top view of a strainer: rings for the spring, a handle, two tabs. | Misleads by omission. The caption's lesson is the forefinger pushing the strainer forward to close the gate; no finger and no gate are drawn, and seen from above the spring is just circles. | Redraw from the side, on a tin, with the forefinger (S3). |
| Plate III, The Double Strain (449) | A tilted tin, a cone for the fine strainer, a coupe bowl. | Half there. No Hawthorne on the tin, so it does not show what makes it a double strain. | Redraw with both strainers and both hands (S3). |
| Plate IV, Expressing the Peel (452) | A thick curved bar, dotted spray, a coupe. | Readable, but the peel reads as a sausage; skin-side down, the height, and the snap are not shown. | Redraw with fingers pinching a wide peel skin-side down (S3). |
| Plate V, The Julep Dome (455) | A cup, a dashed dome of ice, a few circles, a straw. | Readable. The frost on the metal, the doneness signal in the caption, is missing, and the cup reads as a plain tumbler. | Redraw with the frosted tin and the mint bouquet (S3). |
| Plate VI, The Dry Shake (458) | A tin with a crossed-out ice cube and an oval, an arrow, a tin with cubes. | The best idea of the set (two stages, left to right). The oval for egg white is ambiguous. | Redraw as two clear stages (S3). |
| Plate VII, The Muddle Press (461) | A stick ending in an oval, a glass, two leaf curls, an arrow down. | Misleads: the muddler head is drawn as an oval, so it reads as a spoon; the quarter turn is not shown. | Redraw with a true flat-headed muddler and the turn (S3). |
| Plate VIII, The Float (464) | A spoon tipped against the inner wall, a band on the surface, dashed lines below. | The clearest of the eight. | Redraw for consistency only (S3). |
| Glass icons, 11 shapes (line 700) | 24 x 24 outline glyphs shown at 18 px beside every drink ticket, the Library row, the study card and the reference cards: coupe, martini, rocks, collins, flute, mug, hurricane, shot, wine, julep, tumbler. | The shapes are clean and on-brand, but 95 glass strings in the data collapse onto 11 by first match, and several land on the wrong shape: "Pre-heated Irish coffee glass" (the Brennan's Irish Coffee's classic glass) shows a handled mug; "Nick & Nora" and "Frozen Nick & Nora" show a coupe; "Tiki mug", "Pilsner or tiki" and "Footed mug, caramelized sugar rim" show a hurricane; "Metal swizzle cup", "Sugar-rimmed, whole lemon peel inside", "Clay cantarito", "Brûlot or demitasse cup", "Demitasse" and "Beer glass" fall through to a plain tumbler; the julep icon is a rocks glass with a line and does not read as a metal cup. | Code task, not ChatGPT: add about seven shapes in the same 24 px line style (Nick & Nora, Irish coffee glass, tiki mug, copper mug, punch cup, demitasse cup, pint) and reorder the matcher. The larger, named glass charts are entries BA-01, LG-03 and LG-04. |
| Ornaments: fan, rule, pip (line 694) and the masthead fan (`index.html` line 30) | Small brass dividers. | Decorative by design and right for that job. Weight is nil. | None. |
| Data charts (lines 1223 to 1255) | The progress ring and bar charts. | Data, not training images. Out of scope. | None. |
| Coffee film thumbnails (`js/ui-coffee.js` line 97) | YouTube's own `hqdefault.jpg`, fetched only online. | Not ours, not in scope. | None. |

### B3. What is imageless (the gaps)

- 365 cocktails in `js/data-core.js` (fields `glass`, `garnish`, `method`): no picture of any drink.
- The 32 Brennan's drinks in the pack: no picture, and almost no glass or garnish data (see E1).
- 143 distinct garnish strings; the top eight (lemon twist 44, lime wheel 22, orange twist 20, lime wedge 18, grated nutmeg 13, brandied cherry 10, orange slice 8, lemon wheel 5) cover most of the canon.
- 19 reference glasses in `js/data-service.js` (domain `glassware`), each with capacity and use, shown as text with the 18 px icon.
- The bar tools: tins, mixing glass, jigger, barspoon, Hawthorne, julep and fine strainers, muddler, peeler, channel knife.
- Techniques with no figure: shake, stir, build and lift, swizzle, flame a peel, roll.
- The layered builds' density ladder (`js/ui-reference.js` `LAYER_LADDER`, 11 rungs) and the seven `LAYERED_BUILDS`.
- Ice types; espresso and milk drinks (`js/data-coffee.js` `COFFEE_REF`, 34 cards); spirit categories.

### B4. Ranking of the gaps (value to a new Brennan's server this month)

1. The Brennan's drink cards: recognising a drink at the service bar and describing it at the table (BA-02 to BA-14).
2. The Brennan's glassware chart: one look tells which glass each drink is classically served in (BA-01).
3. Garnish cuts: the words "twist", "wheel", "wedge", "peel" on every ticket (LG-01, LG-02).
4. The bar's glassware charts (LG-03, LG-04), and the coffee bar's milk drinks, which Brennan's serves at every meal (LG-05).
5. Ice and tools: the vocabulary a server hears from the bar (LG-06, LG-07).
6. The techniques, the density ladder and the canon's cards: the bartender's half of the app (LG-08 to LG-14, series S2 to S4).

---

## C. The entries

Each entry: title; file name (path inside the Ledger repo, which publishes to `/ledger/`); pixel size and format; where it appears; what it must teach, with the facts quoted from the pack or the app's data; the copy-ready prompt; what to avoid.

For every Brennan's drink the pack prints the ingredients but not the glass, and for all but two not the garnish. Where the pack is silent the card is drawn in the classic way and the entry carries a **Question for the bar**; if the bar answers differently, re-run the prompt with the bar's answer in place of the classic one before the image is used.

### Brennan's

#### BA-01. The Brennan's glassware chart

- **File:** `img/brennans/brennans-glassware-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
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

An antique bartender's manual plate showing nine empty glasses, each drawn as a fine
copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) lines on deep
felt green (#102119 fading to #081510 at the edges), faint felt grain, a thin double brass
rule frame inset with softly rounded corners, a small brass diamond centred in the bottom
margin.

Arrange the nine glasses in a grid of three columns and three rows, each standing upright
on its own short engraved ground line, all drawn to the same true relative scale, empty,
seen straight from the side at eye level with a slight ellipse at the rim. Clean glass
shown by fine highlight lines and light hatching, no liquid, no garnish.

Row 1, left to right:
1. A rocks glass: short, straight-sided, heavy thick base, about 6 to 9 oz.
2. A highball: tall, narrow, straight-sided, about 8 to 12 oz.
3. An Irish coffee glass: a stemmed, footed glass with a tall tulip-shaped bowl, a short
   stem and a small handle on the side of the bowl.
Row 2:
4. A Champagne flute: tall narrow bowl on a long stem and round foot.
5. A coupe: a shallow, wide, rounded bowl on a stem.
6. A Nick & Nora glass: a small, deep, bell-shaped bowl on a slender stem, narrower and
   deeper than the coupe.
Row 3:
7. A large wine glass: a big round bowl on a stem.
8. A coffee cup on its saucer: a plain round porcelain cup with a handle, drawn in the
   same engraved line.
9. A tall glass: a tall straight tumbler slightly taller than the highball.

Beneath each glass, small and centred, the numeral of its position in brass classical
serif capitals: 1, 2, 3, 4, 5, 6, 7, 8, 9. No other numerals, no words, no letters.
The shapes must be clearly distinct from one another at a small size: keep strong
silhouettes and generous space between them.
```

- **Avoid:** liquid or garnish in any glass; a coupe and a Nick & Nora that look the same (the Nick & Nora is smaller and deeper); a handled mug in place of the stemmed Irish coffee glass; words.

#### BA-02. Classic Sazerac

- **File:** `img/brennans/classic-sazerac-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card in the Menu tab (`#/menu/classic-sazerac`), under the name and price line, above "Say it". Reused as the card's front in Flash cards.
- **Must teach:** Pack: "Sazerac rye whiskey stirred with Peychaud's bitters, served without ice in a glass rinsed with Herbsaint"; "The guest gets a short, amber, iceless drink with an anise perfume"; "Sugar and lemon peel are confirmed with the bar." The classic (the Sazerac Company's recipe as the pack quotes it): "a sugar cube, three dashes of Peychaud's, an ounce and a half of Sazerac Rye, a quarter ounce of Herbsaint and a lemon peel, built across two glasses and served neat in a chilled rocks glass"; the Ledger: "Lemon peel, expressed & traditionally discarded". So: a chilled rocks glass, no ice, a short pour, rosy amber, the peel beside the glass and not in it.
- **Question for the bar:** the glass; sugar cube or syrup; the lemon peel in the glass, or expressed and discarded.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is
a Sazerac, New Orleans' own cocktail, in a chilled heavy rocks glass: short, straight
sided, thick base, with a fine bloom of cold condensation on the outside. There is NO ice
in the glass. The drink is a short pour, filling only about the bottom third of the glass,
a clear, brilliant rosy amber (deep amber whiskey tinted reddish by the bitters), still
and glossy, with a faint sheen of oil on its surface. Nothing floats in it.

Beside the glass on the bar top, lying flat, is one wide strip of fresh lemon peel, bright
yellow skin side up, as if just expressed over the drink and set aside.

The glass stands centred on a dark polished wooden bar top that reflects it softly. Eye
level just above the rim so the drink's surface is visible; the whole glass with clear
space around it, filling about 60 percent of the frame height. Warm candle key light from
the left, a cool rim light from behind outlining the glass. Background: shelves of bottles
and leather books thrown far out of focus into warm bokeh, deep felt green and brown.
No labels, no text, no people, no other glasses, no ice, no straw.
```

- **Avoid:** ice of any kind; a tall pour; the peel floating in the drink; a stemmed glass; a bright red drink (it is amber with a rosy cast); absinthe paraphernalia.

#### BA-03. The Sazerac ladder

- **File:** `img/brennans/sazerac-ladder-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** The Menu tab, at the head of the Premium Sazeracs section, above Thompson's Dream; the app prints under each glass, left to right: "Classic Sazerac $13", "Thompson's Dream $20", "Origin Story $40".
- **Must teach:** One build, one glass, three rungs. Pack: "the first rung of the house's Sazerac ladder: $13, then Thompson's Dream at $20 with Willett rye, then Origin Story at $40 with Cognac and absinthe"; Thompson's Dream "a short, iceless, amber drink like the Classic, with a greener perfume"; Origin Story "a short, iceless, deep amber drink", "rounder than the Classic: grape, dried fruit and oak". So: three identical iceless rocks glasses, the third visibly deeper in colour.
- **Question for the bar:** the glass and the peel for all three (the pack: "the build follows the Classic, confirmed with the bar").

```
FAMILY 1, THE CANDLELIT CARD, landscape variant. Landscape, 1536 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. Three
identical heavy rocks glasses stand in a straight row on a dark polished wooden bar top,
evenly spaced, the same size, seen at eye level just above the rims. Each is chilled, with
a faint bloom of condensation, and holds a short pour filling only the bottom third, with
NO ice and nothing floating in it.

Left glass: a clear, brilliant rosy amber.
Middle glass: the same rosy amber, a shade deeper.
Right glass: a deep amber with a rich mahogany warmth, clearly the darkest of the three.

The three glasses fill the middle band of the frame with space between them. Warm candle
key light from the left, a cool rim light from behind outlining each glass, soft
reflections of all three on the bar top. Background: shelves of bottles and leather books
far out of focus as warm bokeh in deep felt green and brown. No peels, no bottles in
focus, no labels, no text, no people, no ice.
```

- **Avoid:** different glass shapes (the lesson is that the build and glass are the same); price tags or numerals; steps or pedestals; garnish.

#### BA-04. Brandy Milk Punch

- **File:** `img/brennans/brandy-milk-punch-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/brandy-milk-punch`), under the name and price line. It is the first drink on the list and the first sale of the morning.
- **Must teach:** Pack: "brandy, heavy cream, vanilla bean, nutmeg", "shaken with heavy cream and vanilla bean", "The guest gets a cold, pale, creamy drink with the nutmeg dusted over it." The classic glass (the Ledger's own Brandy Milk Punch): "Highball or rocks", "Shake hard, strain over ice", "Grated nutmeg".
- **Question for the bar:** the glass; on ice or up; any garnish beyond the nutmeg.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar, in the soft early
light of a New Orleans breakfast. The hero is a Brandy Milk Punch in a heavy rocks glass,
filled to about a finger below the rim. The drink is cold, opaque and creamy: a pale
ivory with the faintest warm tint, smooth and velvety, with a fine layer of tiny bubbles
on the surface from a hard shake. Freshly grated nutmeg is dusted over the surface in fine
warm-brown specks, more in the centre. The glass has a light bloom of cold condensation.
Because the drink is opaque, no ice is visible.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above
the rim so the nutmeg on the surface is clearly seen, the whole glass in frame filling
about 60 percent of its height. Warm candle key light from the left with a hint of soft
morning daylight, a cool rim light from behind. Background: library shelves and bottles
far out of focus in warm bokeh, deep felt green and brown. No straw, no cinnamon stick,
no whipped cream, no garnish on the rim, no labels, no text, no people.
```

- **Avoid:** whipped cream or a frothy egg-nog head; a cinnamon stick; yellow (it is ivory, there is no egg); a tall foam cap.

#### BA-05. Bloody Bull and Brennan's Bloody Mary

- **File:** `img/brennans/bloody-bull-and-bloody-mary-v1.webp`
- **Size:** 1536 x 1024, landscape, webp
- **Where:** Both study cards, Bloody Bull (`#/menu/bloody-bull`) and Brennan's Bloody Mary (`#/menu/brennan-s-bloody-mary`), under the name and price line; the app prints "Bloody Bull" under the left glass and "Brennan's Bloody Mary" under the right.
- **Must teach:** Telling the two apart at the pass. Pack, Bull: "Housemade Bloody Mary mix, beef bouillon, vodka", "a deep red, savory drink", "like a spicy chilled consommé"; service note: "Contains beef: not vegetarian (offer the Brennan's Bloody Mary, $11)". Pack, Mary: "housemade Bloody Mary mix, vodka, pickled okra, spicy beans", garnish field "pickled okra and spicy beans", "a red, savory drink with the pickled okra and spicy beans standing in it". The classic glass (the Ledger's Bloody Mary): "Highball or pint". The Mary's garnish is printed; the Bull's is not.
- **Question for the bar:** the glass for both; the Bull's garnish (drawn here as the classic lemon wedge); whether the two use the same mix.

```
FAMILY 1, THE CANDLELIT CARD, landscape variant. Landscape, 1536 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar in soft morning light.
Two tall highball glasses stand side by side on a dark polished wooden bar top, the same
size, a hand's width apart, both filled with cubed ice and a savoury tomato drink, with a
light bloom of condensation.

Left glass, the Bloody Bull: the drink is a deeper, darker brick red with a brownish warmth
from beef broth, slightly more translucent at the edges. A single fresh lemon wedge sits on
the rim. Nothing else in the glass.

Right glass, the Bloody Mary: a brighter tomato red, thicker and more opaque. Standing up
in the drink, rising above the rim: one whole pickled okra pod (slender, ridged, olive
green) and two or three pickled green beans (long, thin, dull green, flecked with chile).
No celery, no olives, no lemon.

Eye level just above the rims so the drinks' surfaces and garnishes are clear. Both
glasses fully in frame with space around them. Warm candle key light from the left, a cool
rim light from behind, soft reflections on the bar top. Background: library shelves and
bottles far out of focus in warm bokeh. No straws, no salt rims, no bacon, no shrimp, no
labels, no text, no people.
```

- **Avoid:** celery stalks, olives, bacon or skewered extravagance (not printed); identical colours (the Bull must read darker and browner); a salt or spice rim.

#### BA-06. Brennan's Irish Coffee

- **File:** `img/brennans/brennan-s-irish-coffee-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/brennan-s-irish-coffee`); the same image serves the dessert menu's Coffee Cocktails section.
- **Must teach:** Pack method: "Build in the glass: brown sugar stirred into the hot chicory coffee, then Tullamore Dew, then the whipped cream floated on top; not stirred once the cream is on." "The guest gets a warm coffee under a cool white cap of cream, and sips the hot coffee through it." The classic glass (the Ledger's Irish Coffee): "Pre-heated Irish coffee glass", "The cream IS the garnish".
- **Question for the bar:** the glass; lightly whipped pourable cream or a stiff whipped cap (drawn here as the classic lightly whipped float).

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is
an Irish coffee in a classic Irish coffee glass: a clear stemmed, footed glass with a tall
tulip-shaped bowl, a short stem and a small glass handle on the side of the bowl. The
glass is warm, with no condensation.

The lower two thirds is hot, very dark brown coffee, almost black, clear at the edges
where the light passes through. On top floats a layer of lightly whipped cream about two
centimetres deep, pure white, smooth and matte, with a perfectly clean, level line where
it meets the coffee: the two never mix. A faint wisp of steam rises from the edge.
Nothing else: no garnish, no dusting, no straw, no spoon.

Centred on a dark polished wooden bar top that reflects it softly, eye level at the cream
line so the clean division between coffee and cream is the focus, the whole glass from foot
to rim in frame, filling about 60 percent of its height. Warm candle key light from the
left, a cool rim light from behind outlining the glass. Background: library shelves far
out of focus in warm bokeh, deep felt green and brown. No labels, no text, no people.
```

- **Avoid:** a handled mug; aerosol-style piped cream or a tall swirled peak; chocolate or cinnamon dusting; a blurred or mixed cream line; a straw.

#### BA-07. Brennan's Champagne Cocktail

- **File:** `img/brennans/brennan-s-champagne-cocktail-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/brennan-s-champagne-cocktail`), in the Bubbles at Brennan's section.
- **Must teach:** Pack: "Champagne, Angostura bitters, demerara sugar cube", "the cube is soaked in bitters, set in the glass, and the Champagne poured over it", "The guest gets a glass of Champagne with a steady stream of bubbles rising from the cube." The classic (the Ledger's Champagne Cocktail): "Drop cube in flute, pour gently", glass "Flute", garnish "Lemon twist".
- **Question for the bar:** the glass; the garnish (drawn here as the classic lemon twist); Angostura as printed.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar in late afternoon. The
hero is a Champagne cocktail in a tall Champagne flute on a long stem and round foot,
filled to about a finger below the rim. At the very bottom of the bowl rests one small
square demerara sugar cube, golden brown, stained a deeper reddish brown by bitters, its
edges just beginning to soften. From the cube a steady, fine, continuous column of tiny
bubbles rises straight up through the whole glass. The wine is a clear pale gold, faintly
warmer in tone just above the cube. A fine ring of bubbles sits at the surface.

A thin curl of bright yellow lemon twist rests on the rim, hanging just inside the glass.

Centred on a dark polished wooden bar top that softly reflects it, eye level at mid-bowl
so both the cube and the rising stream are clearly visible, the whole flute in frame
filling about 70 percent of its height. Warm candle key light from the left, a cool rim
light from behind. Background: library shelves and bottles far out of focus in warm bokeh.
No bottle, no other glasses, no labels, no text, no people.
```

- **Avoid:** a coupe; a strawberry or cherry; a sugared rim; the cube dissolved away (it must be visible); a bottle with a label.

#### BA-08. Espresso Martini (Brennan's)

- **File:** `img/brennans/espresso-martini-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/espresso-martini`), Coffee Cocktails on the dessert menu.
- **Must teach:** Pack: "chicory, vodka, Frangelico, Kahlua", "The guest gets a dark coffee cocktail", "roasty and smooth"; note: "The menu prints chicory, not espresso: confirm the coffee with the bar." The classic (the Ledger's Espresso Martini): "Shake hard, double strain up", glass "Coupe", garnish "3 coffee beans", "Fresh espresso's crema builds the foam."
- **Question for the bar:** the glass; the garnish (drawn here as the classic three beans); whether the foam is as dense as an espresso-built one, since the menu prints chicory.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is
an espresso martini in a stemmed coupe: a shallow, wide, rounded bowl on a slender stem.
The drink is a very dark coffee brown, almost black, served up with no ice, filled close
to the rim. On top sits a smooth, fine-textured foam about half a centimetre deep, the
colour of light hazelnut, creamy and even. Three whole roasted coffee beans rest together
in the centre of the foam.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above
the rim so the foam and the three beans are clearly seen, the whole glass from foot to rim
in frame, filling about 60 percent of its height. Warm candle key light from the left, a
cool rim light from behind. Background: library shelves far out of focus in warm bokeh,
deep felt green and brown. No chocolate, no cocoa dust, no extra beans scattered on the
bar, no labels, no text, no people.
```

- **Avoid:** a V-shaped martini glass; a thick white milky head; scattered beans; a chocolate rim.

#### BA-09. For Sentimental Reasons

- **File:** `img/brennans/for-sentimental-reasons-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/for-sentimental-reasons`), first in the Billboard Songs from 1946 section.
- **Must teach:** Pack: "allspice dram, pear purée, sparkling wine", "The guest gets a sparkling drink with the soft body the purée gives", "fizzy and fruity, ripe pear first". Drawn in a flute as the house's other sparkling drinks are classically served, ungarnished because nothing is printed.
- **Question for the bar:** the glass and any garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar. The hero is a
sparkling pear cocktail in a tall Champagne flute on a long stem, filled to about a finger
below the rim. The drink is a soft pale gold with a gentle, even haze from fruit purée:
not clear like Champagne, and not opaque like juice, but softly clouded, with a faint warm
amber tint low in the glass. Fine bubbles rise through it and a delicate ring of foam sits
at the surface. No garnish of any kind.

Centred on a dark polished wooden bar top that softly reflects it, eye level at mid-bowl,
the whole flute in frame filling about 70 percent of its height. Warm candle key light from
the left, a cool rim light from behind. Background: library shelves and bottles far out of
focus in warm bokeh, deep felt green and brown. No pear, no fruit slices, no spices, no
labels, no text, no people.
```

- **Avoid:** a pear slice or whole pear as garnish (not printed); a crystal-clear drink; a thick foam head.

#### BA-10. Prisoner of Love

- **File:** `img/brennans/prisoner-of-love-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/prisoner-of-love`).
- **Must teach:** That "clarified heavy cream" means a CLEAR drink. Pack: "gin, Earl Grey tea, clarified heavy cream, orange flower water"; "Clarifying is the old milk punch technique, where the milk is curdled and strained off clear; it leaves a silky texture without the weight of cream"; "The guest gets a fragrant, silky drink." The Ledger's Clarified Milk Punch: "crystal clear", glass "Rocks or coupe". Drawn here in a rocks glass over one large clear cube.
- **Question for the bar:** the glass, the ice, and any garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is a
clarified milk punch in a heavy rocks glass over one large, perfectly clear square ice
cube. The drink is crystal clear and brilliant, with NO cloudiness and NO white at all: a
pale golden straw colour with a soft amber warmth from tea, so transparent that the edges
of the ice cube are sharp through it. Its surface is glossy and still. The glass is
filled to about two fingers below the rim, with a light bloom of condensation. No garnish.

Centred on a dark polished wooden bar top that reflects it softly, the candle glow
passing through the liquid and casting a warm golden light on the wood. Eye level just
above the rim, the whole glass in frame filling about 60 percent of its height. Warm candle
key light from the left, a cool rim light from behind. Background: library shelves and
bottles far out of focus in warm bokeh. No milk, no cream, no tea cup, no flowers, no
citrus, no labels, no text, no people.
```

- **Avoid:** any milky, white or cloudy look (the point of the drink is that it is clear); cream or a foam; a tea bag or cup as a prop.

#### BA-11. Rumors are Flying

- **File:** `img/brennans/rumors-are-flying-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/rumors-are-flying`).
- **Must teach:** Pack: "Brennan's Barrel Aged Rittenhouse Rye, tart cherry juice, brown sugar syrup, orange bitters", "The guest gets a dark, spirit-forward drink", "rye spice and oak, with dark tart cherry", "the drink for an Old Fashioned lover". Drawn in a rocks glass over one large cube, as an Old Fashioned is served, ungarnished because nothing is printed.
- **Question for the bar:** the glass, the ice and the garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is a
dark whiskey and cherry cocktail in a heavy rocks glass over one large clear square ice
cube. The drink is clear but deeply coloured: a dark garnet red where it is thickest,
shading to warm amber at the thin edges where the candlelight passes through. Its surface
is still and glossy, filled to about two fingers below the rim. A light bloom of
condensation on the glass. No garnish of any kind.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above
the rim, the whole glass in frame filling about 60 percent of its height. Warm candle key
light from the left, a cool rim light from behind outlining the glass. Background: library
shelves, barrels and bottles far out of focus in warm bokeh, deep felt green and brown. No
cherries, no orange peel, no smoke, no labels, no text, no people.
```

- **Avoid:** a cherry or orange garnish (not printed); an opaque juice look (it is a clear, stirred-looking drink); smoke (that is the Birdcage).

#### BA-12. To Each His Own

- **File:** `img/brennans/to-each-his-own-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/to-each-his-own`).
- **Must teach:** Pack: "Daron Fine Calvados, Lillet Blanc, quince liqueur", "The guest gets a smooth, spirit-forward drink", "baked apple and perfumed quince". All three parts are spirit or aromatised wine, so it is drawn served up in a Nick & Nora, clear and pale gold.
- **Question for the bar:** the glass, the method and any garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar on an autumn evening.
The hero is an apple brandy cocktail served up, with no ice, in a Nick & Nora glass: a
small, deep, bell-shaped bowl on a slender stem. The drink is perfectly clear and bright,
a pale honeyed gold with a soft amber warmth, filled to a few millimetres below the rim,
its surface still and glossy. No garnish of any kind.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above
the rim, the whole glass from foot to rim in frame, filling about 60 percent of its height.
Warm candle key light from the left, a cool rim light from behind outlining the bowl.
Background: library shelves far out of focus in warm bokeh, deep felt green and brown. No
apples, no quinces, no fruit, no labels, no text, no people.
```

- **Avoid:** apple slices or fruit props (not printed); a coupe; cloudiness.

#### BA-13. Old Buttermilk Sky

- **File:** `img/brennans/old-buttermilk-sky-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/old-buttermilk-sky`). Its spirit-free twin Oh! What It Seemed to Be uses series S1.
- **Must teach:** Pack: "Volcán Reposado Tequila, fig liqueur, lemon, egg white, cinnamon syrup", "a tequila sour built with egg white", "The guest gets a sour with a silky texture"; service note: "Egg white, as printed." Drawn as a sour served up in a coupe with an egg-white foam cap, ungarnished because nothing is printed.
- **Question for the bar:** the glass and any garnish (for example a dusting of cinnamon on the foam, which is not printed and is not drawn).

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar. The hero is a tequila
sour with egg white served up, with no ice, in a stemmed coupe: a shallow, wide, rounded
bowl on a slender stem. The body of the drink is a soft, opaque, pale amber tan, like
weak tea with milk, smooth and silky. On top sits a dense, fine, pure white foam cap about
one centimetre deep, perfectly smooth and level, with a crisp line where it meets the
drink below. No garnish, no dusting, nothing on the foam.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the
rim so the foam cap and the line beneath it are clear, the whole glass from foot to rim in
frame, filling about 60 percent of its height. Warm candle key light from the left, a cool
rim light from behind. Background: library shelves far out of focus in warm bokeh, deep
felt green and brown. No figs, no cinnamon sticks, no salt rim, no lime, no labels, no
text, no people.
```

- **Avoid:** a salt rim or lime wheel (it is not a margarita); bitters art on the foam; cinnamon dust; a fig garnish.

#### BA-14. Five Minutes More

- **File:** `img/brennans/five-minutes-more-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** The drink's study card (`#/menu/five-minutes-more`).
- **Must teach:** Pack: "Cathead Mandarin Vodka, Green Chartreuse, Licor 43, lemon", "The guest gets a bright, citrusy drink", "mandarin and lemon first, then the deep green herbs of the Chartreuse". With lemon in it the drink is shaken; it is drawn served up in a coupe, cloudy pale yellow-green, ungarnished because nothing is printed.
- **Question for the bar:** the glass, the method and any garnish.

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar. The hero is a shaken
citrus and herbal liqueur cocktail served up, with no ice, in a stemmed coupe: a shallow,
wide, rounded bowl on a slender stem. The drink is a softly cloudy, pale yellow-green, the
colour of young celery leaves mixed with lemon juice: light, bright and translucent, with
a delicate thin film of fine white bubbles across the surface from a hard shake. Filled to
a few millimetres below the rim. No garnish of any kind.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the
rim, the whole glass from foot to rim in frame, filling about 60 percent of its height.
Warm candle key light from the left, a cool rim light from behind. Background: library
shelves far out of focus in warm bokeh, deep felt green and brown. No herbs, no lemon, no
mandarin, no labels, no text, no people.
```

- **Avoid:** a vivid neon green (Green Chartreuse is one of four parts: the drink is pale); an egg-white foam (none is printed); herb sprigs.

The rest of the Brennan's list (the Roost trio, the other Bubbles drinks, the spirit-free pair, the dessert and coffee drinks) is set out in series S1 with its slot values.

### The Ledger's own

#### LG-01. Garnish cuts I: citrus

- **File:** `img/plates/garnish-citrus-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** More, Notes, in a new "Garnish" panel beside the Technique Plates; linked from the garnish line of every ticket that names a citrus cut. The app prints the legend.
- **Must teach:** The cut a ticket names. The data's counts: "Lemon twist" 44, "Lime wheel" 22, "Orange twist" 20, "Lime wedge" 18, "Orange slice" 8, "Lemon wheel" 5, "Orange peel" 4 plus "Expressed orange peel" 3 and "Flamed orange peel" 2, "Lemon wedge" 4. The glossary: "Twist: A strip of citrus peel, expressed and often curled over the drink. Ask for it 'no pith' and mean it." "Wheel: A full round slice of citrus, slit to sit on the rim." Legend the app will print: 1 Lemon twist, 2 Orange twist, 3 Wide orange peel (for expressing or flaming), 4 Lime wheel, 5 Lemon wheel, 6 Lime wedge, 7 Lemon wedge, 8 Orange slice (half wheel).

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of eight citrus garnish cuts, drawn as fine copperplate
engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green
(#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with
softly rounded corners, a small brass diamond centred in the bottom margin. The citrus is
tinted with transparent watercolour in its TRUE colours inside the engraved lines: lemon
yellow, orange orange, lime green, white pith, translucent pale flesh with visible
segments. Everything else stays brass line on green.

Two columns, four rows, each cut drawn large, alone, seen from slightly above, with a soft
engraved shadow:
1. Lemon twist: a long, narrow strip of yellow zest, no white pith, curled into a loose
   corkscrew spiral.
2. Orange twist: the same long narrow corkscrew strip in orange zest.
3. Wide orange peel: a broad oval coin of orange zest the size of a large coin, skin side
   up, cut thin with only a whisper of white pith on the underside, edges neatly trimmed.
4. Lime wheel: a full round cross-section slice of lime, rind ring and segments visible,
   with one straight slit cut from the edge to the centre so it can sit on a rim.
5. Lemon wheel: the same full round slice in lemon, with the slit.
6. Lime wedge: a lengthwise eighth of a lime, a boat shape with rind on the back and flesh
   on the two cut faces, a small notch cut across the flesh so it can sit on a rim.
7. Lemon wedge: the same lengthwise wedge in lemon, with the notch.
8. Orange slice: a half-moon, half of a round orange wheel, rind on the curved edge.

Beside each cut, small, the numeral of its position in brass classical serif capitals: 1,
2, 3, 4, 5, 6, 7, 8. No other numerals, no words, no letters. Keep each cut clearly
separate with generous space, so the shapes read at a small size.
```

- **Avoid:** thick pith on twists and peels; a wedge with no notch or a wheel with no slit; grapefruit (not in this set); text labels.

#### LG-02. Garnish cuts II: the rest of the rail

- **File:** `img/plates/garnish-rail-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** The same Garnish panel as LG-01, second plate.
- **Must teach:** The non-citrus garnishes the data names most: "Grated nutmeg" 13, "Brandied cherry" 10, "Mint sprig" 4, "Mint bouquet" 3 and "Big mint bouquet, straw beside it", "3 coffee beans", "Three olives on a pick", "Cocktail onion (or three)", "Pineapple + cherry" 5. Legend the app will print: 1 Brandied cherry, 2 Mint sprig, 3 Mint bouquet, 4 Grated nutmeg, 5 Three coffee beans, 6 Olives on a pick, 7 Cocktail onions on a pick, 8 Pineapple wedge with a cherry.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of eight cocktail garnishes, drawn as fine copperplate
engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green
(#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with
softly rounded corners, a small brass diamond centred in the bottom margin. Each garnish
is tinted with transparent watercolour in its TRUE colours inside the engraved lines;
everything else stays brass line on green.

Two columns, four rows, each garnish drawn large and alone with a soft engraved shadow:
1. A brandied cherry: one dark, glossy, deep burgundy-black cherry with its stem, not a
   bright red candied cherry.
2. A mint sprig: one stem of fresh spearmint with four to six leaves, bright green.
3. A mint bouquet: a full, tight bunch of fresh mint tops, the stems gathered together,
   leaves fanning upward like a small posy.
4. Grated nutmeg: a whole nutmeg seed with its marbled brown interior showing on one
   grated face, beside a small fine metal rasp grater, with a dusting of grated nutmeg.
5. Three whole roasted coffee beans, glossy dark brown, grouped close together.
6. Three green olives speared on a plain metal cocktail pick.
7. Three small white pearl cocktail onions speared on a plain metal cocktail pick.
8. A pineapple wedge: a small triangle of pineapple with its skin and a cut notch, a
   brandied cherry pinned to it with a plain pick.

Beside each garnish, small, the numeral of its position in brass classical serif capitals:
1, 2, 3, 4, 5, 6, 7, 8. No other numerals, no words, no letters. Generous space between.
```

- **Avoid:** bright red maraschino cherries for item 1 (the data says brandied); paper umbrellas; decorative plastic picks.

#### LG-03. Glassware I: stemmed and specialty

- **File:** `img/plates/glassware-stemmed-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** More, Behind the Stick reference, the Glassware cards (`js/data-service.js`, domain `glassware`), above the Stemmed and Specialty groups. The app prints the legend.
- **Must teach:** The shapes and their relative sizes. Data capacities: Coupe "6-7 oz modern; 4-5 oz vintage"; Nick & Nora "5-6 oz"; Martini / Cocktail "6-10 oz"; Flute "6-8 oz"; Port / Sherry (Copita) "4-6 oz"; Cordial / Pony "2-3 oz"; Copper Mug "12-16 oz"; Julep Cup / Tin "10-12 oz"; Hurricane "15-20 oz"; Tiki Mug "12-16 oz". Legend: 1 Coupe, 2 Nick & Nora, 3 Martini, 4 Flute, 5 Copita, 6 Cordial, 7 Copper mug, 8 Julep cup, 9 Hurricane, 10 Tiki mug.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of ten empty bar glasses and cups, drawn as fine
copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt
green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset
with softly rounded corners, a small brass diamond centred in the bottom margin. All drawn
empty, seen straight from the side at eye level, to the SAME TRUE RELATIVE SCALE so their
sizes can be compared, each standing on a short engraved ground line.

Two columns, five rows:
1. Coupe: a shallow, wide, rounded bowl on a stem.
2. Nick & Nora: a small, deep, bell-shaped bowl on a slender stem, smaller than the coupe.
3. Martini glass: a wide, straight-sided V-shaped cone on a stem.
4. Champagne flute: a tall, narrow bowl on a long stem.
5. Copita: a small sherry glass, a narrow tulip bowl that closes in at the top, on a stem.
6. Cordial glass: a tiny stemmed glass with a small straight bowl, the smallest here.
7. Copper mug: a straight-sided metal mug with a sturdy handle, its copper shown as a warm
   copper watercolour wash, the only colour on the plate besides item 8.
8. Julep cup: a straight-sided metal cup with a small rolled rim and a beaded base, no
   handle, in a pale silver-pewter wash.
9. Hurricane glass: a tall, curvy glass that swells, narrows and flares like a lamp
   chimney, on a short stem and foot, the tallest here.
10. Tiki mug: a tall ceramic mug shaped as a plain carved totem with simple geometric
    grooves and no face, drawn in line only.

Beside each item, small, its numeral in brass classical serif capitals: 1 to 10. No other
numerals, no words, no letters. Strong silhouettes, generous space between.
```

- **Avoid:** a carved face on the tiki mug (keep it abstract); different scales; liquid; text.

#### LG-04. Glassware II: rocks, tall, beer and wine

- **File:** `img/plates/glassware-rocks-tall-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** The same Glassware reference, above the Rocks & Tall and Beer & Wine groups.
- **Must teach:** Data capacities: Rocks / Old Fashioned "6-9 oz"; Double Rocks (DOF) "12-14 oz"; Highball "8-12 oz"; Collins "10-14 oz"; Shot Glass "1 1/2 oz standard"; Shaker Pint "16 oz to the rim"; Nonic Pint "16 oz US nonic, 20 oz imperial"; Wine, White "12-14 oz"; Wine, Red "18-24 oz". And "The real difference between a Collins and a highball is about two inches of head room." Legend: 1 Rocks, 2 Double rocks, 3 Highball, 4 Collins, 5 Shot glass, 6 Shaker pint, 7 Nonic pint, 8 White wine glass, 9 Red wine glass.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of nine empty glasses, drawn as fine copperplate
engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green
(#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with
softly rounded corners, a small brass diamond centred in the bottom margin. All drawn
empty, straight from the side at eye level, to the SAME TRUE RELATIVE SCALE, each on a
short engraved ground line. Clean glass shown with fine highlight lines and hatching.

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

Beside each glass, small, its numeral in brass classical serif capitals: 1 to 9. No other
numerals, no words, no letters. Strong silhouettes and generous space between them.
```

- **Avoid:** a highball and a Collins of the same height; branded beer glass shapes; liquid.

#### LG-05. The milk drinks, in section

- **File:** `img/plates/coffee-milk-drinks-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** More, Coffee and Tea, the reference cards (`COFFEE_REF`), above the With Milk group. The app prints the legend.
- **Must teach:** What sits in each cup. Data: Espresso "Warmed demitasse, 2 to 3 oz", double "1.2 to 1.4 oz"; Macchiato: "a single dollop onto the middle of the shot", "Warmed demitasse at the 3 oz end"; Cortado: "Warmed and barely textured", "a skin of foam rather than a layer", "The 4.5 oz Gibraltar glass, a small straight tumbler with no handle"; Flat White: "The foam layer is thin, under about a quarter inch", "Warmed 5 to 6 oz tulip cup with a handle"; Cappuccino: "The cap runs about a third to a half inch", "5 to 6 oz cup with a handle, on a saucer"; Latte: "thin foam layer around a quarter inch", "8 to 12 oz cup or a tall glass". Legend: 1 Espresso, 2 Macchiato, 3 Cortado, 4 Flat white, 5 Cappuccino, 6 Latte.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique manual plate of six espresso drinks shown as clean cutaway cross-sections, each
cup sliced in half vertically so the layers inside are visible, drawn as fine copperplate
engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green
(#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with
softly rounded corners, a small brass diamond centred in the bottom margin. Inside each
cutaway, transparent watercolour in TRUE colours: espresso deep brown, crema a reddish
hazelnut band, steamed milk warm cream-white, foam a lighter matte white. All cups to the
same true relative scale. Two columns, three rows:

1. Espresso: a small handled demitasse cup on a saucer, holding a shallow layer of dark
   espresso with a thin hazelnut crema on top.
2. Macchiato: the same small demitasse, the espresso and crema, with one small white dollop
   of milk foam sitting in the middle of the surface.
3. Cortado: a small straight glass tumbler with no handle; the lower half espresso, the
   upper half warm milk, with only a very thin skin of foam on top.
4. Flat white: a medium handled tulip-shaped cup; espresso at the bottom, then smooth milk
   filling the cup, with a very thin foam line at the top.
5. Cappuccino: a medium handled cup on a saucer, the same size as the flat white; espresso
   at the bottom, milk, and a clearly thicker foam cap on top, about twice the flat
   white's.
6. Latte: a taller, larger handled cup; a little espresso at the bottom, a deep body of
   milk, and a thin foam layer on top.

Beside each cup, small, its numeral in brass classical serif capitals: 1 to 6. No other
numerals, no words, no letters, no latte art patterns. Generous space between.
```

- **Avoid:** latte art (the lesson is the layers); a flat white and a cappuccino with the same foam depth; a cortado in a handled cup.

#### LG-06. Ice

- **File:** `img/plates/ice-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** More, Notes, "Technique: The Mechanics", beside the "Ice" row.
- **Must teach:** Data: "Big cold dry ice dilutes slowly; wet small ice dilutes fast. Large cube for rocks, cracked for shaking, crushed for juleps and tiki. Never scoop with the glass." Rocks glass: "Most singles take a 1 1/4-1 1/2 inch cube; a 2-inch cube needs a double." Legend: 1 Large cube, 2 Cubed, 3 Cracked, 4 Crushed.

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate of four kinds of bar ice, drawn as fine copperplate
engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green
(#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with
softly rounded corners, a small brass diamond centred in the bottom margin. The ice is
drawn with crisp highlight lines and the faintest pale blue-white transparent wash so it
reads as clear, cold and dry.

Two columns, two rows, each a small heap on its own engraved ground line, to the same
scale:
1. One large clear cube, about two inches on each side, sharp edges, glass-clear.
2. A small pile of standard cubes, each about one and a quarter inches, slightly frosted.
3. A pile of cracked ice: irregular chunks about the size of a thumbnail, sharp broken
   faces.
4. A mound of crushed ice: fine, snowy, pebble-sized fragments, the smallest pieces.

Beside each, small, its numeral in brass classical serif capitals: 1, 2, 3, 4. No other
numerals, no words, no letters.
```

- **Avoid:** glasses or drinks; melting puddles (the lesson prizes dry ice); spheres (not in the data).

#### LG-07. The bar tools

- **File:** `img/plates/bar-tools-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** More, Notes, at the head of "Technique: The Mechanics"; also the Barback level's Technique and Method page.
- **Must teach:** The names a barback hears. Data: "Jigger: The hourglass measuring cup"; "Bar spoon: Long spiral-handled spoon; also a unit of measure, about 1/6 oz (5 ml)"; "Hawthorne strainer: The spring-rimmed strainer that fits a shaking tin"; "Straining: Hawthorne for shaken, julep for stirred, double strain anything shaken with citrus or herbs going 'up'"; muddling "Press, twist a quarter turn, lift". Legend: 1 Shaking tins, 2 Mixing glass, 3 Jigger, 4 Barspoon, 5 Hawthorne strainer, 6 Julep strainer, 7 Fine strainer, 8 Muddler, 9 Y-peeler, 10 Channel knife.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate of ten bar tools, drawn as fine, technically accurate
copperplate engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt
green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset
with softly rounded corners, a small brass diamond centred in the bottom margin. Steel is
shown by crisp highlight lines and hatching; no colour. Plain, unbranded tools.

Two columns, five rows, each tool drawn large and alone, at a slight angle, to a sensible
relative scale:
1. Shaking tins: a large metal tin and a smaller metal tin, side by side, open ends up.
2. A mixing glass: a heavy, straight-sided glass beaker with a pouring lip.
3. A jigger: a double-ended hourglass measure, a larger cup and a smaller cup joined at
   their bases, with faint measuring lines inside.
4. A barspoon: a very long, thin spoon with a tightly twisted spiral handle and a small
   teardrop-shaped bowl.
5. A Hawthorne strainer: a flat perforated metal disc with a coiled wire spring running
   around its edge, a short handle, and two small tabs.
6. A julep strainer: a shallow, perforated, spoon-shaped metal bowl with a short handle,
   no spring.
7. A fine strainer: a small conical fine-mesh sieve with a handle.
8. A muddler: a straight, sturdy wooden rod with a flat, blunt end.
9. A Y-peeler: a peeler with a Y-shaped frame and a horizontal blade across the top.
10. A channel knife: a short handle with a small notched blade that cuts a thin groove.

Beside each tool, small, its numeral in brass classical serif capitals: 1 to 10. No other
numerals, no words, no letters, no logos.
```

- **Avoid:** a muddler with a rounded spoon-like head (the fault in Plate VII today); a three-piece cobbler shaker in place of tins; brand marks.

#### LG-08. Technique: the hard shake

- **File:** `img/plates/technique-shake-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** More, Notes, Technique Plates, as a new plate; linked from every ticket whose method starts "Shake".
- **Must teach:** Data: "Shake anything with citrus, egg, cream, or juice." "Fresh ice 2/3 full, seal at an angle, shake HARD 10 to 15 seconds until the tin frosts." Three steps top to bottom: fill, seal, shake to frost.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate showing how to shake a cocktail, in three numbered
steps stacked from top to bottom, drawn as fine copperplate engravings in antique brass
(#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510),
faint felt grain, a thin double brass rule frame inset with softly rounded corners, a
small brass diamond centred in the bottom margin. Hands are anonymous engraved line, no
rings, cuffs plain.

Step 1, top: a large metal shaking tin standing on the bar, about two thirds full of fresh
cubed ice, a smaller tin beside it holding the measured drink.
Step 2, middle: the small tin set into the large tin at a slight angle, one hand pressing
down firmly on top to seal them.
Step 3, bottom: two hands holding the sealed tins horizontally at shoulder height, one hand
capping each end, fine motion lines showing a hard back-and-forth shake, and a fine white
frost visible across the outside of the metal.

Beside each step, small, its numeral in brass classical serif capitals: 1, 2, 3. No other
numerals, no words, no letters. Each step in its own band with space between.
```

- **Avoid:** a cobbler shaker; a person or face; the tins shaken upright over the head.

#### LG-09. Technique: the stir

- **File:** `img/plates/technique-stir-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** Technique Plates; linked from tickets whose method starts "Stir".
- **Must teach:** Data: "Stir anything all-spirit." "Barspoon rides the wall; ice moves as one silent mass. 30 to 45 seconds; taste with a straw to check dilution." Straining: "julep for stirred".

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate showing how to stir a cocktail, one figure, drawn as a
fine copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep
felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame
inset with softly rounded corners, a small brass diamond centred in the bottom margin.

A heavy glass mixing beaker full of cubed ice and a clear amber liquid (a transparent amber
watercolour wash, the only colour). A long barspoon with a twisted spiral handle stands in
it, its back pressed against the inside wall of the glass. One anonymous engraved hand
holds the spoon lightly between the fingertips near the top of the handle. A single fine
curved arrow drawn around the inside of the glass shows the spoon travelling smoothly
around the wall, and the ice drawn as one compact mass turning together. A julep strainer
rests on the bar beside the glass, ready.

No numerals, no words, no letters.
```

- **Avoid:** a spoon churning up and down; splashes; a fist grip.

#### LG-10. Technique: build and one lift

- **File:** `img/plates/technique-build-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** Technique Plates; linked from tickets whose method starts "Build".
- **Must teach:** Data: "Build: To make a drink directly in its serving glass, no shaker or mixing glass"; "Carbonation is fragile. Cold glass, cold mixer, gentle build, one lift of the barspoon, never a hard stir." (the data's dash replaced by a comma). Gin & Tonic: "Build over ice, one gentle lift". Steps: ice, spirit, mixer down the spoon, one lift.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate showing how to build a highball, in three numbered
steps stacked from top to bottom, drawn as fine copperplate engravings in antique brass
(#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading to #081510),
faint felt grain, a thin double brass rule frame inset with softly rounded corners, a
small brass diamond centred in the bottom margin. Liquids as faint transparent washes.

Step 1, top: a tall highball glass filled to the top with cubed ice, and a jigger pouring a
measure of clear spirit over the ice.
Step 2, middle: a plain unlabelled bottle of sparkling mixer tilted to pour gently down the
twisted handle of a barspoon that stands in the glass, small bubbles rising.
Step 3, bottom: the barspoon being raised once, slowly, from the bottom of the glass to the
top, shown by one single upward arrow; the drink full of fine bubbles.

Beside each step, small, its numeral in brass classical serif capitals: 1, 2, 3. No other
numerals, no words, no letters, no labels.
```

- **Avoid:** a shaker; vigorous stirring marks; a labelled bottle.

#### LG-11. Technique: the swizzle

- **File:** `img/plates/technique-swizzle-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** Technique Plates; linked from the swizzles and juleps (Queen's Park Swizzle, Chartreuse Swizzle, 151 Swizzle, Mojito and the juleps).
- **Must teach:** Data: "Swizzle: A crushed-ice drink churned with a swizzle stick (traditionally a branch of the Caribbean swizzlestick tree) until the glass frosts." Methods: "Swizzle in crushed ice until frosted"; Queen's Park Swizzle glass "Collins", garnish "Mint + the bitters float".

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate showing how to swizzle, one figure, drawn as a fine
copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt
green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset
with softly rounded corners, a small brass diamond centred in the bottom margin.

A tall Collins glass packed with crushed ice and a pale drink. Plunged deep into it is a
traditional swizzle stick: a slim natural wooden twig with four or five short prongs
radiating flat from its lower end like the spokes of a small wheel. Two anonymous engraved
hands hold the top of the stick between flat palms, rubbing it back and forth so it spins,
shown by fine curved motion arrows, while it moves slowly up and down. A dense white
frost covers the outside of the glass, drawn with fine stipple. A sprig of mint, tinted
true green, sits ready on the bar beside the glass.

No numerals, no words, no letters.
```

- **Avoid:** a barspoon in place of the swizzle stick; a plastic swizzle stirrer; a dry, clear glass (the frost is the signal).

#### LG-12. Technique: flaming an orange peel

- **File:** `img/plates/technique-flame-peel-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** Technique Plates; linked from "Flamed orange peel" (Cosmopolitan, Oaxaca Old Fashioned).
- **Must teach:** Data: "flame orange peels through a match for caramelized oil"; the quiz: "Skin-side down over the glass, one sharp snap ... flaming a peel is a real move (DeGroff's Cosmo), but fire caramelizes the oil. Expressing is the plain default." Steps: warm the peel, snap through the flame, wipe the rim.

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique bartender's manual plate showing how to flame an orange peel over a cocktail,
in three numbered steps stacked from top to bottom, drawn as fine copperplate engravings
in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green (#102119 fading
to #081510), faint felt grain, a thin double brass rule frame inset with softly rounded
corners, a small brass diamond centred in the bottom margin. Only the orange peel (true
orange) and the small flame (warm yellow-orange) carry colour.

Step 1, top: one anonymous hand holds a lit wooden match a few centimetres above a stemmed
coupe; the other hand holds a wide oval coin of orange peel, skin side facing the flame,
warming it gently.
Step 2, middle: the fingers pinch the peel sharply; a fine spray of oil passes through the
match flame and flares as a brief bright burst of tiny sparks over the drink's surface.
Step 3, bottom: the peel's skin is run around the rim of the glass, the match already
blown out, a thin thread of smoke rising from it.

Beside each step, small, its numeral in brass classical serif capitals: 1, 2, 3. No other
numerals, no words, no letters. The flame is small and controlled, never a large fire.
```

- **Avoid:** a lighter or torch; a large flame; burning liquid; anything that suggests setting a drink alight.

#### LG-13. Technique: rolling between tins

- **File:** `img/plates/technique-roll-v1.webp`
- **Size:** 1024 x 1024, square, webp
- **Where:** Technique Plates; linked from the Bloody Mary family (Bloody Mary, Bloody Maria, Caesar). Relevant to Brennan's two Bloody drinks.
- **Must teach:** Data: "Rolling: Pouring a drink back and forth between tins to mix with minimal aeration, the Bloody Mary's method, since shaking foams tomato." (the data's dash replaced by a comma). The Bloody Mary: "Roll between tins, never shake" (dash replaced).

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate showing how to roll a drink, one figure, drawn as a
fine copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep
felt green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame
inset with softly rounded corners, a small brass diamond centred in the bottom margin.

Two anonymous engraved hands hold two metal shaking tins, one high and one low, about a
forearm's length apart. A smooth, unbroken, rope-like stream of tomato-red liquid (true
tomato red, a transparent wash, the only colour) pours from the upper tin, which is fitted with a Hawthorne strainer
holding the ice back, into the lower tin. A gentle
curved double arrow beside them shows the liquid going back and forth between the tins.
No splashes, no foam.

No numerals, no words, no letters.
```

- **Avoid:** shaking motion lines; frothy foam; a long theatrical throw.

#### LG-14. The density ladder

- **File:** `img/plates/density-ladder-v1.webp`
- **Size:** 1024 x 1536, portrait, webp
- **Where:** More, Shots and Zero Proof, the Shot Board, beside the density table (`LAYER_LADDER`); the app prints the legend with each figure.
- **Must teach:** Data: "Rough specific gravity ladder: the physics behind every layered shot" (the data's dash replaced by a colon). Eleven rungs, heaviest at the bottom. Legend, from the bottom up: 1 Grenadine and syrups (about 1.18), 2 Crème de cassis and noyaux (1.16), 3 Coffee liqueur (1.15), 4 Crème de menthe and cacao (1.12), 5 Butterscotch and peach schnapps (1.08), 6 Irish cream (1.05), 7 Amaretto and Frangelico (1.04), 8 Orange liqueur (1.03), 9 Green Chartreuse (1.01), 10 Whiskey, rum, vodka at 80 proof (0.95), 11 Overproof spirits (0.90). "Spirits are LIGHTER than water. Always the crown, never the base."

```
FAMILY 2, THE BRASS PLATE. Portrait, 1024 x 1536 pixels.

An antique scientific plate showing a single tall, narrow, straight-sided glass cylinder,
like a laboratory specimen jar, standing in the centre on an engraved base, filled with
eleven perfectly separate horizontal liquid layers of equal thickness, drawn as a fine
copperplate engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt
green (#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset
with softly rounded corners, a small brass diamond centred in the bottom margin. Each layer
is a transparent watercolour wash in its TRUE colour, with a crisp clean line between
layers. From the bottom up:
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

To the left of the cylinder, a slim engraved brass arrow pointing downward from top to
bottom, widening as it goes, to show increasing heaviness. To the right of each layer,
small, its numeral in brass classical serif capitals: 1 at the bottom up to 11 at the top.
No other numerals, no words, no letters, no labels on the cylinder.
```

- **Avoid:** a shot glass (eleven layers will not read in one); blended or swirled layers; numbering from the top.

---

## D. Series templates for the big sets

Each template is one prompt with slots in CAPITALS between square brackets. Fill every slot from the list below it, then paste. Each filled prompt is self-contained.

### S1. The house drink card (the rest of the Brennan's list, and any later house)

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar [LIGHT, for example
"at night" or "in late afternoon"]. The hero is [DRINK DESCRIPTION, never the brand] in
[GLASS, described by shape]. [ICE: "There is no ice." or the ice described]. The drink is
[COLOUR AND CLARITY, exact], [SURFACE: still, foam, bubbles, float]. [GARNISH exactly as
printed, or "No garnish of any kind."] [ONE EXTRA ELEMENT if printed, for example a
side spoon.]

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the
rim, the whole glass from foot to rim in frame, filling about 60 percent of its height.
Warm candle key light from the left, a cool rim light from behind. Background: library
shelves and bottles far out of focus in warm bokeh, deep felt green and brown. No labels,
no text, no people, no other glasses, nothing the description does not name.
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
| `oh-what-it-seemed-to-be` | Oh! What It Seemed to Be, $16.00, spirit-free | "a non-alcoholic agave sour with egg white"; a coupe; no ice; soft opaque pale amber tan; a dense smooth white foam cap about one centimetre deep; no garnish. Pair it visually with BA-13 (same look: the app's label tells them apart). |
| `floating-in-south-africa` | Floating in South Africa, $15.00 | "a root beer float with cream liqueur"; a tall glass; no ice; a scoop of vanilla bean ice cream (cream white flecked with tiny black vanilla seeds) floating in dark brown root beer clouded beige where the cream liqueur and melting ice cream swirl; a tan foam head; no garnish, no straw. |
| `banane-au-chocolat` | Banane au Chocolat, $16.00 | "a dessert drink of banana liqueur, chocolate liqueur and sweet sherry"; a Nick & Nora; no ice; clear dark mahogany brown; still and glossy; no garnish. |
| `ralph-s-coffee` | Ralph's Coffee, $8.00 | "chicory coffee with two nut liqueurs under whipped cream"; an Irish coffee glass (stemmed, footed, tulip bowl, small handle); no ice; very dark coffee; a white cream cap, clean line; no garnish. |
| `caf-glac-de-la-maison` | Café Glacé de la Maison, $11, spirit-free | "a cold brew iced coffee with a pale foam"; a tall iced glass; cubed ice; clear dark brown cold coffee; a smooth pale ivory foam about two centimetres deep on top (pack: "orange flower foam"); no garnish. |
| `new-orleans-style-coffee-with-chicory` | New Orleans-Style Coffee with Chicory, $11 | "a cup of hot black coffee"; a plain white porcelain cup on its saucer with a spoon on the saucer; very dark brown, a faint steam wisp; no garnish. |
| `revive-cold-pressed-juice` | Revive Cold-Pressed Juice, $10.00 | "a cold-pressed strawberry, apple and pineapple juice"; a tall straight glass (BA-01, glass 9; held: confirm with the bar); no ice; opaque soft strawberry pink-red; a fine froth line; no garnish. |

Hold until the bar answers: `flamingo` (dragonfruit flesh may be magenta or white, which decides the colour), `bodrum` (how the pistachio goes in decides the colour), `apple-crumble` (the pack: "Whether it is served hot or cold is not printed"), `congregation-single-origin-coffee` (a plain cup; low value), `thompson-s-dream` and `origin-story` singles (covered by BA-03).

### S2. The Library cocktail card (365 drinks)

```
FAMILY 1, THE CANDLELIT CARD. Square, 1024 x 1024 pixels.

A realistic oil-painting still life in a candlelit old library bar at night. The hero is
[DRINK, described by style, for example "a classic gin martini"] in [GLASS, described by
shape]. [ICE]. The drink is [COLOUR AND CLARITY], [SURFACE]. Garnish: [GARNISH exactly as
the Ledger's data names it, described physically], and nothing else.

Centred on a dark polished wooden bar top that softly reflects it, eye level just above the
rim, the whole glass in frame, filling about 60 percent of its height. Warm candle key
light from the left, a cool rim light from behind. Background: library shelves and bottles
far out of focus in warm bokeh, deep felt green and brown. No labels, no text, no people,
no other glasses, no garnish beyond the one named.
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

### S3. The technique plate redraw (the eight current plates)

```
FAMILY 2, THE BRASS PLATE. [SIZE: "Portrait, 1024 x 1536 pixels" for a sequence, "Square,
1024 x 1024 pixels" for one figure].

An antique bartender's manual plate showing [TECHNIQUE], drawn as fine copperplate
engravings in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green
(#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with
softly rounded corners, a small brass diamond centred in the bottom margin. Hands are
anonymous engraved line, no rings, no faces. Colour only where named: [COLOUR, or "no
colour"].

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

### S4. The layered build (seven shots)

```
FAMILY 2, THE BRASS PLATE. Square, 1024 x 1024 pixels.

An antique bartender's manual plate of one layered shot, drawn as a fine copperplate
engraving in antique brass (#d5b16c) and pale gold (#f1d89e) line on deep felt green
(#102119 fading to #081510), faint felt grain, a thin double brass rule frame inset with
softly rounded corners, a small brass diamond centred in the bottom margin.

A clear, slightly tapered shot glass, drawn large and centred, holding [N] perfectly
separate horizontal layers with crisp lines between them, each a transparent watercolour
wash in its TRUE colour, from the bottom up: [LAYERS]. [EXTRA, if any]. A barspoon rests
beside the glass. Beside each layer, small, its numeral in brass classical serif capitals,
1 at the bottom. No other numerals, no words, no letters.
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

---

## E. Notes

### E1. The data task (not an image)

The Brennan's pack (`static/shared/packs/brennans-new-orleans.v1.oothouse.json`) has an empty `glass` field on all 32 drinks, and an empty `garnish` field on 30 of them: only the Spoonbill ("a spoon of caviar") and Brennan's Bloody Mary ("pickled okra and spicy beans") carry one. `method` is filled on three (Brandy Milk Punch, Classic Sazerac, Brennan's Irish Coffee). The study card therefore prints "not printed; confirm with the bar" on every glass. Filling these from the bar's answers, through the pack chain (WorldTable `tools/house/` overrides, then the mirror), would also settle every **Question for the bar** in section C. The glass and garnish drawn in BA-02 to BA-14 and S1 are the classic ones until then.

### E2. Code tasks noticed (not ChatGPT's)

- Glass icons: add about seven shapes and reorder `glassIcon()`'s matcher (B2). The Brennan's Irish Coffee today shows a handled mug.
- Masthead: a 768 px `srcset` variant for phones.
- New images should load lazily and stay out of the Ledger worker's precache list unless the owner wants them offline; under the publish rule any file added to `ASSETS` bumps `oot-ledger-vN`.

### E3. Hand-back spec

ChatGPT returns PNG. Save each one under its file name with `.png` in place of `.webp` (for example `classic-sazerac-v1.png`); Claude converts to webp (quality about 82) and, for the 1024 px cards, a 512 px thumbnail, at wiring time. Never overwrite a delivered file: a revision takes the next version (`-v2`).

| ID | File | Size | Goes |
|---|---|---|---|
| BA-01 | `img/brennans/brennans-glassware-v1.webp` | 1024 x 1536 | Menu tab, foot of the drinks list |
| BA-02 | `img/brennans/classic-sazerac-v1.webp` | 1024 x 1024 | `#/menu/classic-sazerac` card |
| BA-03 | `img/brennans/sazerac-ladder-v1.webp` | 1536 x 1024 | Menu tab, head of Premium Sazeracs |
| BA-04 | `img/brennans/brandy-milk-punch-v1.webp` | 1024 x 1024 | `#/menu/brandy-milk-punch` card |
| BA-05 | `img/brennans/bloody-bull-and-bloody-mary-v1.webp` | 1536 x 1024 | both Bloody cards |
| BA-06 | `img/brennans/brennan-s-irish-coffee-v1.webp` | 1024 x 1024 | `#/menu/brennan-s-irish-coffee` card |
| BA-07 | `img/brennans/brennan-s-champagne-cocktail-v1.webp` | 1024 x 1024 | `#/menu/brennan-s-champagne-cocktail` card |
| BA-08 | `img/brennans/espresso-martini-v1.webp` | 1024 x 1024 | `#/menu/espresso-martini` card |
| BA-09 | `img/brennans/for-sentimental-reasons-v1.webp` | 1024 x 1024 | its card |
| BA-10 | `img/brennans/prisoner-of-love-v1.webp` | 1024 x 1024 | its card |
| BA-11 | `img/brennans/rumors-are-flying-v1.webp` | 1024 x 1024 | its card |
| BA-12 | `img/brennans/to-each-his-own-v1.webp` | 1024 x 1024 | its card |
| BA-13 | `img/brennans/old-buttermilk-sky-v1.webp` | 1024 x 1024 | its card |
| BA-14 | `img/brennans/five-minutes-more-v1.webp` | 1024 x 1024 | its card |
| LG-01 | `img/plates/garnish-citrus-v1.webp` | 1024 x 1536 | More, Notes, Garnish |
| LG-02 | `img/plates/garnish-rail-v1.webp` | 1024 x 1536 | More, Notes, Garnish |
| LG-03 | `img/plates/glassware-stemmed-v1.webp` | 1024 x 1536 | Behind the Stick, Glassware |
| LG-04 | `img/plates/glassware-rocks-tall-v1.webp` | 1024 x 1536 | Behind the Stick, Glassware |
| LG-05 | `img/plates/coffee-milk-drinks-v1.webp` | 1024 x 1536 | Coffee and Tea, With Milk |
| LG-06 | `img/plates/ice-v1.webp` | 1024 x 1024 | Notes, Technique: The Mechanics, Ice |
| LG-07 | `img/plates/bar-tools-v1.webp` | 1024 x 1536 | Notes, Technique: The Mechanics |
| LG-08 | `img/plates/technique-shake-v1.webp` | 1024 x 1536 | Technique Plates |
| LG-09 | `img/plates/technique-stir-v1.webp` | 1024 x 1024 | Technique Plates |
| LG-10 | `img/plates/technique-build-v1.webp` | 1024 x 1536 | Technique Plates |
| LG-11 | `img/plates/technique-swizzle-v1.webp` | 1024 x 1024 | Technique Plates |
| LG-12 | `img/plates/technique-flame-peel-v1.webp` | 1024 x 1536 | Technique Plates |
| LG-13 | `img/plates/technique-roll-v1.webp` | 1024 x 1024 | Technique Plates |
| LG-14 | `img/plates/density-ladder-v1.webp` | 1024 x 1536 | Shot Board |
| S1 | `img/brennans/<slug>-v1.webp` | 1024 x 1024 | the drink's study card |
| S2 | `img/cards/<slug>-v1.webp` | 1024 x 1024 | Library drink card, flash card back |
| S3 | `img/plates/<id>-v1.webp` | as listed | Technique Plates, replacing the SVG |
| S4 | `img/plates/layered-<slug>-v1.webp` | 1024 x 1024 | Shot Board, layered drill |
