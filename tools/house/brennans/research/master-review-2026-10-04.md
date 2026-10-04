# Master review of My Menu, 4 October 2026: the record

The owner starts as a server at Brennan's (417 Royal Street) on Monday 5 October 2026 and asked for a deep review of every Brennan's card and flash card in the My Menu tab of World Table, the Bartender's Ledger and the Sommelier's Codex, as a master chef, a master bartender and a master sommelier, with videos that would help. This file is the record of that review: what each reviewer found and changed, and how the three were joined. The changes themselves are entries in overrides.json, each with a reason that opens "Master review:" and its source; the new facts rest on three research files beside this one: master-review-chef-2026-10-04.md, bar-master-review-2026-10-04.md and master-review-somm-2026-10-04.md. The videos come from videos-kitchen-2026-10-04.json and videos-bar-wine-2026-10-04.json.

## How the three were joined

- **Order.** The chef's 100 entries, then the bartender's 65, then the sommelier's 107, appended after the existing entries, then 25 video:+ entries. Every entry was kept as its reviewer wrote it.
- **Collisions.** No two entries touch the same field. Three dishes were touched by both the chef and the sommelier, on different fields: the Louisiana BBQ Lobster (the chef's parts, About note and origin; the sommelier's value bottle line), the Roasted Chateaubriand (the chef's Foyot year in the origin and About note; the sommelier's avoid line) and New Orleans Shrimp & Grits (the chef's 45 second line, About note and origin; the sommelier's splurge bottle). Both sides stand in each. The lineup asks from the chef (5) and the bartender (6) are distinct questions. One existing term entry (Chicory) is skipped as before, because the guide already prints it.
- **The edition.** EDITION_BUILT_AT moved to 2026-10-04T06:30:00.000Z, the half hour before the build. The chain ran check-parse, build-brennans --mint (138 ids minted), validate-pack, keep-all --owner-reviewed (the owner asked for it), check-pack, thin-lines, build-winelist and check-winelist: 0 fatal, 0 thin lines, 0 unanswered names.
- **What it added.** 55 lexicon terms (125 to 180), 22 scenarios (33 to 55), 20 mix-ups (9 to 29), 5 must-knows (30 to 35), 11 lineup asks (234 to 245), and 25 videos.

## The videos: what shipped and what did not

A video ships only when its link and title were shown by a search for that exact id and its channel was named for that video, either by YouTube's oEmbed answer stored in tools/derive/technique-films.mjs or by a search result naming the uploader. YouTube oEmbed is refused by this machine's proxy, so no link here was asked of YouTube today: run tools/check-house-videos.mjs where YouTube answers before the next edition, and file a video that comes back gone or changed as a retire.

Shipped (25):
- From the kitchen file (8, each title and channel from the stored oEmbed record): hollandaise (Le Cordon Bleu), beurre blanc (Chef Jean-Pierre), mayonnaise as the emulsion (Jacques Pépin Foundation), the pan sauce (America's Test Kitchen), roux (Food Network), shucking an oyster (Hog Island Oyster Co.), poached eggs (J. Kenji López-Alt), flambé safely.
- From the bar and wine file (17): the Bananas Foster with the owning family (SAVEUR); four from Anders Erickson (the Sazerac, two on the Espresso Martini, the Bloody Mary); two from WSET (why wine is fortified, Port); four from the Court of Master Sommeliers, Americas (opening and serving sparkling wine, opening a bottle, decanting, hospitality and service); six from GuildSomm (Champagne, Burgundy, Bordeaux's Right Bank, the Northern Rhône, Germany, Alsace).

Dropped as weakly verified (each stays in its research file for a later check):
- Kitchen, channel unknown (28): every record with channel null, among them the five Bananas Foster films, the turtle soup films, the Ella Brennan films, Commander's and Dooky Chase gumbo, choron, the Gulf oysters, shrimp and grits, barbecue shrimp, duck confit, Cherries Jubilee twice, tarte Tatin, the two Creole and Cajun introductions, the Commander's kitchen, the hospitality talk and the Royal Street walk.
- Kitchen, channel read from the title or a series rather than shown (2): béarnaise with Julia Child, en papillote.
- Bar and wine, channel inferred from a series, a presenter or a page snippet rather than named for the video (10): Eater's Meat Show on the Eggs Hussarde, How To Drink's Sazerac, the two Educated Barfly films (the Sazerac and the Absinthe Frappé), the Court's Riesling guide, Wine Folly on Riesling and on opening Champagne, and the three Bon Appétit episodes (wine glasses, ordering wine, Champagne at different ages).
- Bar and wine, WSET's Calvados film (1): the search named the series' channel, not this video's.
- Bar and wine, Anders Erickson's Irish Coffee (1): well verified, but its title as published carries two emoji glyphs, and a title is shown as published, never respelled; the Codex's voice rule refuses any glyph, so it waits for a film whose title reads plainly.
- The bar and wine file's own unverified list (8) was never a candidate.


## The kitchen (the master chef)


The master chef's review of every dish in the Brennan's pack (62 dishes: the tastings, starters, soups, salad, entrées, sides, desserts, children's plates and the Roost and Bubbles snacks), the food lexicon, scenarios, mix-ups, must-knows and lineup asks, and the Table's My Menu flash cards dealt from them. Each item was read the way its card renders it: lines s10, s20 and s45, the five parts, say, guest, why, origin, pairs, the service note and every kept note. The fixes are in the chef fragment, 98 entries in the overrides.json shape, each with a reason that starts "Master review:". The facts the research did not already hold are in research/master-review-chef-2026-10-04.md, which goes to research/master-review-chef-2026-10-04.md.

**How it was proved.** A scratch copy of tools/house. The fragment was appended to a fresh copy of overrides.json, then `build-brennans.mjs --mint` and `validate-pack.mjs` were run. The result: 0 fatal, 0 thin lines (thin-lines.mjs agrees), 0 unanswered names, every count holds and no wine or cocktail record changed. 41 ids are minted: 21 terms, 9 scenarios, 5 mix-ups, 1 must-know and 5 asks. **The real build needs `--mint` once**, plus the research file copied in.

### What the pack does well

The pack is already deeply researched. Every dish has an About note and three coaching notes. The service notes are careful, the tableside safety steps are exemplary and the pronunciations are mostly right. Most of what I found is one of four things: wrong cards (parts in the wrong slot, so the flash cards and drills teach errors), refuted claims that came back, generic selling lines, and real floor questions with no answer.

### Problems found and what I did, by item

#### Parts in the wrong slot (each part is a flash card and a drill stem)
- **Petite Filet Mignon.** The sauce slot held "garlic spinach", so the card taught that the filet's sauce is spinach. The sauce is now empty and the spinach moved to the sides with the rösti.
- **Seafood Gumbo.** The sauce slot held andouille. Andouille moved into the main. The sauce is now empty because whether the gumbo has okra or filé is a lineup question.
- **Louisiana BBQ Lobster.** The sauce slot held 'nduja, a sausage. The sauce is now the New Orleans barbecue shrimp butter, worded so it does not collide with the Louisiana Oysters' sauce stem, and the 'nduja moved to the sides with the beans. The taste said "smoky" right after the card says NOLA barbecue is not a smoker. I fixed that in the parts, in why (which is derived from taste) and in the About note.
- **Eggs Hussarde.** The technique slot held an ingredient and the sides slot held filler ("served benedict-style"). Now: main is eggs and coffee-cured bacon, technique is "poached and stacked Benedict-style", sides are the housemade English muffins.
- **Eggs Owen.** It had the same sauce stem as the Hussarde, so a sauce drill could mark the right answer wrong. Its sauce now reads "the Hussarde's two sauces, hollandaise and marchand de vin", which teaches the link and tells the two cards apart. The technique slot held the potato. It now holds the braise, and the potato joins the egg in the sides.
- **Creole Spiced Nuts.** The sauce repeated the technique. It is now empty.
- **Crawfish Meat Pies.** Sides and sauce were both chive rémoulade. The sides are now empty.
- **Shells & Cheese.** The sauce slot was empty and the technique slot held the whole recipe. The fondue is now the sauce.

#### Refuted or overstated claims that had come back
- **Turtle Soup origin.** It named Commander's Palace as stretching turtle with veal and beef. research/refuted.md corrects exactly this: Commander's cooks diced turtle in veal stock. It also promised "not wild or endangered", which no source says of the house supplier. I rewrote it from the refuted.md correction. I also cut "never wild" from the About note and from the guest answer, because the supplier is an open lineup ask.
- **Eggs Sardou.** The s45, the origin and two kept notes said it was created at Antoine's "for" Sardou. The dossier and refuted.md say "named for", since whether he ate it there is legend. I fixed all four. The s45 also said "ours" twice in a row and called the plate "meatless", a diet word. It now says "the egg dish with no meat on the menu line".
- **Eggs Owen origin.** It told the carving-board anecdote as founder Simon Landry's. refuted.md says to credit the restaurant: Mother's made the word famous, not coined it. Rewritten.
- **Roasted Chateaubriand.** It said Restaurant Foyot stood "until 1937"; the dossier says it closed in 1938. Both the origin and the About note now say "the late 1930s".
- **Cherries Jubilee.** "Escoffier made it" became "is credited with it" in the origin, the About note and the Escoffier term.

#### Generic, inconsistent or risky lines
- **Shrimp & Grits.** "One of the best values on the menu" (s45 and About) is a line that fits any restaurant. I replaced it with the Charleston contrast, which answers the question Carolina guests really ask, and added an origin (Bill Neal, Crook's Corner).
- **Poussin.** The same "best values" line, in s45 and About. It now carries the bistro classic: poulet à la moutarde made the Southern way. Origin added.
- **Bread Pudding s45.** It said PRAW-leens while the lexicon and the notes say PRAH-leen. It now says PRAH-leens.
- **Grand Isle Jewel Oysters s20.** It left the cracked pepper out of the mignonette, and the sauce is named for that pepper. Fixed.
- **The two Grilled Cheese plates.** Both called the plate "the simple, safe choice". "Safe" on a child's plate reads as an allergen promise, so it is now "sure".
- **Turtle Soup sell note.** "A cup before the eggs" implies a cup size and a bowl size; the menu prints one size at $13. It now says "a bowl".

#### Origins a server should be able to tell (all sourced to the kitchen dossier)
New or extended origins for:
- **Louisiana BBQ Lobster and Louisiana Oysters:** the Pascal's Manale barbecue shrimp story.
- **Gulf Fish en Papillote:** Antoine's Pompano en Papillote for Santos-Dumont.
- **Blackened Tofu:** Prudhomme, K-Paul's, 1980. Its butter is why the vegan question goes to the kitchen.
- **Redfish Véronique:** sole Véronique and Brennan's three swaps.
- **Creole Tomato Tostada:** what a Creole tomato is, and that its season ends in early July, so check the plate in October.
- **Seafood Gumbo:** okra, ki ngombo.
- **Crawfish Meat Pies:** the Natchitoches style and Hank Williams' "Jambalaya", 1952.
- **Eggs Hussarde:** the classic Holland rusk and grilled tomato build, which ended in 2014. Returning guests ask about it.

#### Scenarios
**Fixed:**
- **Vegan at breakfast.** It invented the chef's habits and offered "the fruit starters", which are a trifle of curds and a brioche French toast. Rewritten as honest and deferring to the kitchen.
- **Shellfish and nuts at one table.** It read the guest a partial list of nut dishes. It left out the baked apple, the pralines, the financiers and the snacks, and a partial list is worse than none. It now refuses to read a list from memory.
- **Shellfish allergy.** The list missed the children's shrimp plates and the Bubbles popcorn shrimp and crawfish pies. Added.
- **Item links on both shellfish scenarios.** Each scenario now links every plate whose menu line or service note names shellfish (or nuts), so it shows on those cards.

**Added (9), all things that happen on this floor:**
- Eggs Benedict, please
- A filet at dinner (the only filet is on the breakfast tasting)
- Two temperatures, one Chateaubriand
- Duck, but cooked through
- No runny yolks
- Raw oysters at brunch
- What is the fish today?
- Is the soup the courtyard turtles?
- First dinner (the pack had a first breakfast only)

#### Mix-ups added (5)
- **Hussarde vs Sardou:** the two signature egg dishes, ordered side by side.
- **Eggs Owen vs Creole-Spiced Hanger Steak:** both cards call the plate "steak and eggs".
- **Petite Filet vs Chateaubriand:** both are tenderloin, and the filet is on the breakfast tasting only.
- **Popcorn Shrimp vs Popcorn Shrimp with Brabant Potatoes:** one name printed twice at two prices, a wrong ticket waiting to happen.
- **Succotash vs Smoked Cauliflower:** the vegetable side that carries bacon.

#### Must-know added
**"The sauces on our menus".** The guide says the sauce matters more than the protein, yet nothing put the menu's sauces side by side. It covers:
- the five mother sauces (the courtyard turtles' names)
- the hollandaise family: hollandaise, béarnaise, Choron, Foyot, each with its dish
- beurre blanc
- the red wine sauces, and the bordelaise catch
- New Orleans BBQ
- Creole sauce

#### Lexicon terms added (21; each becomes two flash cards)
Roux, Holy trinity, Gastrique, Coulis, Anglaise, Brioche, Tartare, Pimento cheese, Okra, Bordelaise, Flambéed, Brown butter, Lump crab, Rice grits, Creole tomato, Nougat, Chili crisp, Pepita, Marcona, Sorghum, Mother sauces.

- **Wording:** guest lines avoid repeating the term where that reads naturally, so the guest-line drill can ask them.
- **Side effect on say:** Tartare now gives the Steak Tartare Cannoli its say line, "Tartare: tar-TAR", in place of "Say it as it reads".
- **notItems:** the builder links a term to items by the term's first word and by its aliases. That sent Brown butter to every item with brown sugar, Chili crisp to the Fresno chili oysters and a Riesling, and Rice grits to the Cheddar Grits. Each is undone with the builder's own notItems form.
- **Integration risk:** the Brown butter notItems list names six wines. If the sommelier's fragment edits those wines so the term no longer reaches one of them, the build says so by name, and the fix is to drop that name.

#### Lineup asks added (5)
- Two temperatures from one Chateaubriand.
- Firm-poached eggs on request.
- How far the duck will be cooked.
- Whether the papillote's sorghum is the grain or syrup.
- The Bubbles snacks: what is in the pink sauce, whether the meat pies are fried or baked and the count, tonight's cheeses, how the burger is cooked.

### Left alone, for the integrator or the owner
- **Children's service notes.** The eight children's plates have empty service notes. Service notes are a person's words (build-brennans), so I did not write them. The kitchen should give them at lineup.
- **Remaining empty parts (51 items; a report, not a gate).** The sauce on sides and snacks is genuinely empty. My changes add four honest empties: filet, gumbo, nuts and crawfish pies.
- **Drill engine limit (Table, house-drills.ts).** Distractors are drawn from every dish name, so a question can offer a second dish that also answers the stem. Examples: hollandaise and marchand de vin on the Hussarde and the Owen; buttery BBQ sauce on the oysters and the lobster. I made the stems distinct where I could. The full fix belongs in the engine (exclude any distractor whose own part matches the stem), which is out of this fragment's scope.
- **Ledger FC_MODES and Codex decks.** These deal from drinks and wines, so they belong to the bartender and the sommelier. Nothing in this fragment touches a cocktail or wine record. The Codex shows the dish pairings unchanged.


## The bar (the master bartender)


What I read: all 32 drinks as the card renders them (s10, s20, s45, the five parts, say, guest, why, origin, pairs, upsells, service note and every kept note), the 41 bar terms in the lexicon, the 33 scenarios, the 9 mix-ups, the 30 must-knows, the 32 lineup asks on drinks, and the decks each wing deals from them: the Ledger's FC_MODES (house drinks go through name2spec, spec2name, build, cloze, service, line10/20/45, parts, upsell and study), the Table's drill kinds and buildFlashcards (src/lib/house/house-drills.ts, house-drill-round.ts) and the Codex decks that read the same marks.

Overall: the drink cards are strong. The prices are as printed, the house builds are never invented, and every drink has all the coaching notes. What was wrong was a short list of factual and logical errors, four flash cards in the Ledger that graded against "Other", a few lines that sound clumsy read aloud, and big gaps in what connects the cards: the confusions that happen on the floor (the two Bloody drinks, the three Sazeracs, the two spirit-free drinks), the words guests ask about, and the questions guests really ask (morning drinks at dinner, off-list classics, the Roost drinks at a dining table, the absinthe legend, a guest who can have no alcohol at all).

The fragment is the bar fragment (65 entries). It needs one new top-level research file, tools/house/brennans/research/bar-master-review-2026-10-04.md, written to research/bar-master-review-2026-10-04.md. It also mints 31 ids (12 terms, 7 mix-ups, 5 scenarios, 2 must-knows, 6 asks), so the first build runs `build-brennans.mjs --mint`.

### Wrong (fixed)

- **Tullamore D.E.W. (term)**: it said the initials are "the founder's". Daniel E. Williams was the manager who later owned the distillery, which was established in 1829, and the Irish Coffee card already says so. The term now agrees with the card. Source: dossier-the-bar section 8.
- **Crème fraîche (term)**: the matcher linked it to the Banane au Chocolat because of the words "crème de banana" and "crème de cocoa", so the Banane's card listed crème fraîche as a term. Fixed with notItems.
- **Eye openers & coffee (must-know)**: one card named "a single-origin Papua New Guinea" as the coffee and then told the server never to name Papua New Guinea from memory. It now reads "a single origin from Congregation Coffee (the guide printed a Papua New Guinea)".
- **The Roost Bar and the cocktail list (must-know)**: it printed $28, $31 and $36, but the luxury page and every card print $28.00, $31.00 and $36.00. All three now read as printed.
- **Thompson's Dream s45**: it ended by sending a dining room guest to the Birdcage, a Roost-only drink, while the same card's watch note says never to upsell the Birdcage at the table. It now points to the next rung, Origin Story, which is the drink this card upsells.

### Flash cards that graded wrong (fixed)

The Ledger's Service Details card buckets `method` with svcMethodKey, which only knows the words stir, shake, build and so on. Four house drinks bucketed as **Other**, so the correct answer on the card was "Other":
- **Classic Sazerac**: "stirred with Peychaud's" missed the `^stir\b` test. It is now "Stir with Peychaud's bitters; serve without ice in a glass rinsed with Herbsaint." (the guide's own build), which buckets as Stirred.
- **Brennan's Irish Coffee**: it is now "Build in the glass: ... topped with whipped cream; never stirred." An Irish coffee is built in the glass by definition (expert knowledge, logged in the research file), and the printed parts stay in their order.
- **Bloody Bull** ("with our housemade Bloody Mary mix") and **Birdcage** ("a smoked Old Fashioned (the smoking method is not printed)"): neither is a method, and the house build is not printed. Both are now set to empty, so the card asks nothing it cannot answer. A lineup ask was added for the Bull; the Birdcage already had one.

### Lines that read badly aloud (fixed)

- **Bloody Bull s20 and guest**: it said bouillon twice in one breath ("beef bouillon added, vodka, our housemade Bloody Mary mix and bouillon"). Rewritten in speaking order, with the turtle soup hook.
- **Irish Coffee s20 and guest**: "uses our coffee ... with brown sugar, with Tullamore Dew". It now opens with the New Orleans accent and closes with the one instruction the guest needs: sip through the cream, don't stir.
- **Irish Coffee pairs**: it read "as the 45 second line says", which is a note to an editor. It now gives the fire-with-dessert timing.
- **Ralph's Coffee s20**: "coffee with chicory with Frangelico" said "with" twice. Fixed.
- **Revive why**: it read "the guide prices it and never pairs it", which is about the guide, not the guest. It now says who to offer it to.

### Thin or generic (sharpened)

These were all checked by a search on 4 October 2026, and each one is logged in the research file with the result pages:
- **Rumors are Flying s45**: Rittenhouse is now "a 100 proof Kentucky rye" (Heaven Hill, bottled in bond).
- **Five Minutes More s45**: Cathead is now "from Mississippi's first legal distillery". The asked answers now cover the Carthusian monks and the 130 plants at 55 percent, and Licor 43 is "named for its 43 ingredients".
- **Riviera s45**: Lillet is now "a light aperitif wine from Bordeaux" instead of "French aperitif wine", which fits any bottle.
- **Flamingo**: the asked answer now says Monkey 47 is 47 botanicals and 47 percent.
- **OBX (Tell me about it.)**: the Bigaro is now Brachetto and Moscato, softly sparkling, pink and low in alcohol. That answers half of the sommelier's lineup ask. The bottle on the bar is still confirmed.
- **Chandon Garden Spritz**: the answer to "Is the Chandon a Champagne?" deferred to the sommelier. It now answers: Chandon is Moët & Chandon's sparkling wine house outside Champagne, and the Garden Spritz is made in Mendoza. Whether the bar pours the bottled spritz stays a lineup ask.

### Missing (added)

- **Two table stories**:
  - Classic Sazerac, "What story can I tell at the table?":
    - Peychaud's apothecary at 437 Royal, the same block as Brennan's at 417. It is told as the Sazerac Company's account, and the existing hold stays: check at lineup before telling it.
    - Three Sazerac Company bottles go in one glass.
    - Herbsaint comes from herbe sainte.
    - The egg-cup "cocktail" tale is folklore.
    - Never say "America's first cocktail".
  - Irish Coffee, "Where does Irish coffee come from?": Joe Sheridan at Foynes, and the Buena Vista pours Tullamore D.E.W.
- **Lexicon**:
  - Herbsaint, Milk punch, Chartreuse, Licor 43, Monkey 47 and Lillet Blanc were sharpened. Milk punch now explains both kinds, so a server can say why the Prisoner of Love is not creamy.
  - 12 new terms that servers are asked or confuse:
    - Eye opener, Absinthe, Rinse
    - Zero proof: it separates the zero-proof Personality from the under-0.5-percent Lyre's drink.
    - Demerara, Allspice dram, Earl Grey, Rittenhouse, Bigaro, Cathead, Chandon
  - I dropped an "Orange flower water" term after the build showed the term matcher tied it to some twenty dessert wines.
- **Mix-ups (7)**:
  - Bloody Bull vs Brennan's Bloody Mary
  - Classic Sazerac vs Thompson's Dream
  - Thompson's Dream vs Origin Story
  - Brandy Milk Punch vs Prisoner of Love
  - Personality vs Oh! What It Seemed to Be
  - chicory coffee vs Congregation single origin
  - Champagne Cocktail vs Chandon Garden Spritz
  - Each one has its prices as printed and a one-line question that settles it.
- **Scenarios (5)**:
  - Morning drinks at dinner (the eye openers are printed for breakfast and lunch only)
  - A classic that is not on our list (the Ramos Gin Fizz)
  - The Spoonbill at a dining room table
  - The absinthe legend: history, never a health claim
  - No alcohol at all, not even a trace: zero proof against under 0.5 percent
- **Must-knows (2)**:
  - The Sazerac ladder: the three rungs and their three swaps on one card.
  - Twins on the bar list: the three pairs that cross the line between spirit and none, plus Irish against Ralph's. Ring the full name.
- **Lineup asks (6)**:
  - Milk punch: brandy, up or over ice, glass, fresh nutmeg.
  - Bloody Bull: vodka, glass and garnish, always cold.
  - Irish Coffee: glass, float or cap, Congregation coffee.
  - Eye openers at dinner.
  - Off-list classics and how to price them (manager).
  - Decaf. The Irish Coffee watch note already promised to ask about decaf, and no ask carried it.

### Found and not changed (for the wing owners or a manager)

- **The Table's "How to say it" drill (house-drills.ts sayIt) gives away answers.** The stem is the kept `say`, and the options are every term and item name. Twelve drinks and several terms have the default "As it reads: Bloody Bull.", whose stem contains the answer. stemProblems skips these on purpose, but dealQuestion still deals them. Suggested fix in the wing: skip any candidate whose stem contains its own answer, as stemProblems does.
- **The same drill is ambiguous** where an item's say names a word that is also a term (the Flamingo's "Chopin is SHOH-pan; Taittinger is ...", against the terms Chopin and Taittinger). This is a code-level fix (exclude terms named inside the stem from the distractors), not a content one.
- **The Table's "Glass" kind (cocktailGlass) never deals**, because no house drink has a glass and none may be invented. It will open once the bar's glass answers come back from the lineup asks.
- **Empty `parts.sides` on every drink** (a report, not a gate). For a drink, sides is glass and garnish, and none is printed. I left it empty rather than guess.
- **Billboard Songs from 1946 singers**: guests ask "who sang it?". The manager's ask stands ("servers name none"), so I added no recordings.
- **Say lines**: for plain English names, "As it reads" is honest. I did not invent respellings to defeat the drill.

### Proof

I ran it in a scratch copy: the overrides.json from WorldTable with these 65 entries added after the existing ones, and the research file under research/.
- `build-brennans.mjs --mint`: 3203 overrides applied, 31 ids minted.
- `validate-pack.mjs`: 0 fatal. The counts hold (136 terms, 38 scenarios, 16 mix-ups, 32 must-knows, 240 asks). Proper nouns: 1247 of 1247 found in the guide or the research.
- `thin-lines.mjs`: 0 thin lines.

There is no dash in either file I wrote. Nothing under /home/user/worldtable was edited.


## The cellar (the master sommelier)


Scope read as the cards render: the 34 menu wines (the glass list, the six tasting pours, the seven Birthday Bubbles bottles, the five Bubbles rosés) with their lines, five parts, say, guest, why, profile, goes with, serve, service note, origin and kept notes; the 35 dish pairings with their glass, second pick, stepUp, avoid and bottle tiers; 48 floor bottle cards, four from each of the twelve floor sections (Champagne, half bottles, large formats, white Burgundy, other whites, red Burgundy, Bordeaux, Rhône, Italy and Spain, California, other reds, dessert and fortified); the lexicon, the scenarios, the mix-ups, the must-knows and the sommelier's lineup asks; and the decks each wing deals from them (the Codex's v28CardOf back is s10, the parts not already printed, first picks, say and price; the Table's drill and pair modes take the parts and pairings as stems; the Ledger names no living person, so no new living name was written).

The fragment is the sommelier fragment, 107 entries. The facts it adds rest on a new research file, tools/house/brennans/research/master-review-somm-2026-10-04.md (written to WorldTable as well as the scratch copy, since validate-pack reads the research directory for names and years). Each line there is tagged (search), with the result named, or (expert).

Proof: scratch copy of tools/house, fragment appended to overrides.json, `build-brennans.mjs --mint` (41 new ids for the new terms, scenarios, mix-ups and must-knows), then `validate-pack.mjs`: 0 fatal, 0 note problems, 0 thin lines, 0 unanswered names, counts hold (148 terms, 41 scenarios, 17 mix-ups, 32 must-knows). thin-lines: 0. The real chain needs `--mint` once when this lands, and the ledger it writes kept.

### The 34 menu wines

**Brennan's Essential (house Champagne).** Say line was "Say it as it reads"; the Piper magnum respelled it PIE-per HIDE-sick and the lexicon said "ask the sommelier": three answers for the name a server says most. Set one pronunciation on all three, the house's own (PEE-pair HIDE-seek, PIE-per accepted), from Wine Spectator.

**Rare Brut 2012.** The why line was "On the by-the-glass list, Champagne & sparkling", true of fourteen wines. Rewritten as the splurge glass and the stepUp on four dishes. Say line now carries the vintage check (2012 or 2013), so the flash card back teaches the dispute.

**Charles Lafitte.** The profile, which a card prints as the taste, carried a service caution ("ask whether it can be poured à la carte"); removed from the profile and put in a why that names the two courses it is poured with. New mix-up with the house Champagne (a tasting guest who asks for "another glass of that Champagne").

**Argyle Brut 2022.** Thinnest card on the list: no grapes, technique "the method is a question for the sommelier", taste "the sommelier gives the tasting notes", and the guests' "what grapes?" answered "I will check". The producer publishes the method and the blend (Chardonnay and Pinot Noir with a little Meunier in recent vintages) and the 2022's notes. Set grapes, technique, taste; replaced the profile sentence and the two kept note deferrals, the bottle still confirmed with the sommelier. New mix-up with the house Champagne (the Birthday page files the Argyle under "Champagne by the Glass").

**Famille Durand Sauvignon Blanc.** "Say it as it reads" invites FAM-ily DUR-and. Set fah-MEE doo-RAHN.

**Leflaive Mâcon-Verzé and Fichet Mâcon-Igé.** The two look-alike Mâcons had swapped villages in their say lines (Leflaive's carried Igé, Fichet's led with Verzé), so the flash card backs taught them tangled. Each say line now carries only its own wine; a new mix-up teaches the difference ($40 Coravin glass against the 4 oz tasting pour with the lobster).

**La Miraja Barbera d'Asti.** Say line deferred the pronunciation; aging deferred; the name unexplained. Set the Italian pronunciation (lah mee-RAH-yah, leh MAHS-keh), replaced the aging question with the producer's description (steel then neutral oak, the sheet being for the Superiore, so confirm the bottle), and told the name's story: Le Masche are the spirits said to guard the vineyard. New lexicon term makes it a memory hook with the Albariño, "the manor of the witches".

**Inglenook Rubicon 2010 (the $70 glass).** Say line was "Say it as it reads" while the bottle card respells it; no history on the priciest glass. Set ING-gul-nook ROO-bih-kon on the card and the term; appended the history (Rutherford, 1879, Gustave Niebaum) and the blend (Cabernet-led with Merlot, Cabernet Franc, Petit Verdot).

**Albariño (term).** "Ask the sommelier" for a grape said nightly; set al-bah-REEN-yo.

**Drappier Carte d'Or half bottle.** Blend deferred three times; no story. Mostly Pinot Noir with Chardonnay and Meunier, from Urville, and the Champagne of Charles de Gaulle. Set grapes, main part, profile, and the two kept note deferrals; new term.

**Paul Bara Grand Cru rosé half bottle.** Blend and color deferred. Mostly Pinot Noir from Bouzy with Chardonnay, colored with Bouzy red wine. Same set of fixes.

**Krug Grande Cuvée half bottle.** "Prestige non-vintage" said nothing about why it costs $305. Appended the 100 plus wines from ten or more years and six more years in the cellar; grapes set; new term.

**Bollinger Special Cuvée magnum.** Blend deferred; the James Bond line, the one fact every guest knows, absent. Profile, grapes, both kept deferrals; the 10 second line now carries the Bond hook; new term.

**Billecart-Salmon 80th anniversary magnum.** Two Billecart cards gave two pronunciations; the description repeated the wrong one. Set bee-yeh-KAR on the say line and the description; blend and what "oak aged" means added to the profile.

**Piper-Heidsieck magnum.** Pronunciation brought into line (above).

**Taittinger La Française double magnum.** "Elegant" without the reason; appended the Chardonnay share and grapes.

**Mirabelle, Louis Pommery, Moët Imperial, Taittinger Prestige, Pommery (the Bubbles rosés).** Every blend deferred; nothing on how rosé Champagne gets its color. Added each blend and grapes. Louis Pommery: who makes it and how it relates to the $125 Pommery was deferred; it is made in California by the group that owns Pommery: profile, technique part and two kept notes fixed, the Pommery card ties the three Vranken-Pommery names together, and a new mix-up (Louis Pommery against Pommery, $60 against $125). Moët: say line now gives the reason the t is sounded (the name is Dutch), the argument guests have at the table; new mix-up against the Demi Sec Nectar on the bottle list.

Read and left as they stand: Pierre Sparr, Berres, Albariño card, Gainey, Minuty, Damien Martin, Jadot Beaune, Durban, Châteaumar, Moulin d'Issan, Paul Hobbs, Dr. Hermann, Banyuls: accurate, sellable, each line in range. Two new mix-ups cover their confusions (Damien Martin against Jadot Beaune; Berres against the Dr. Hermann Auslese).

### Pairings and bottle ladders

Read all 35 ladders. Most hold together as a sommelier would build them (Meursault for the lobster, Grüner for the Sardou's artichoke, Port and Banyuls for chocolate, Sauternes and Auslese for the caramel desserts, the house Champagne and Rare as the Hussarde's classic and splurge).

- **Roasted Chateaubriand.** The avoid line warned against young, oaked reds while the value and half tiers are a 2022 Duckhorn and a 2020 Ridge Cabernet: the card argued against its own bottles. Avoid rewritten (crisp whites and delicate reds are what fail; a young Cabernet wants opening ahead, ask the sommelier).
- **Louisiana BBQ Lobster.** The value bottle, Jean-Philippe Fichet Bourgogne Blanc, was called "a white Burgundy from Fichet" beside a tasting pour from a different Fichet whose card says it is not the Meursault Fichet. Say line names Jean-Philippe Fichet of Meursault; a new mix-up separates the two.
- **New Orleans Shrimp & Grits.** Fleurie $65, Foillard $115, then Krug Rosé $865 for a $25 brunch plate: a style and price jump no brunch table follows. Splurge changed to the Pascal Cotat Chavignol rosé ($270), which continues the rosé line the Minuty glass starts and sits in the splurge band.
- Noted, not changed: seven dessert and sweet starter pairings take the Dr. Hermann Auslese half-bottle as their glass pick though it is off the current glass page; the service note and the lineup ask already carry that, and the new "Not too dry" scenario and Berres mix-up say to confirm it.

### The 48 floor bottle cards

Accurate and well built: say lines, profiles, service notes with bins, kept notes that defer only where the list is silent. Problems found: the Billecart-Salmon pronunciation clash (fixed on the Birthday magnum, the Nebuchadnezzar already right) and the absence of any must-know for the four 1946 Bordeaux (Latour, Trotanoy, Figeac, Canon), the best wine story of the 80th year (added, below).

### Lexicon

Wine terms existed for producers but not for the words a guest asks about. Added 23: Crémant, Brut (with the sweetness ladder: Extra Dry is sweeter than Brut), Demi-Sec, Grower Champagne, Grand Cru, Premier Cru, Non-vintage, Blanc de Noirs, Blanc de Blancs, Rosé Champagne, Magnum, Sous Bois, Vin doux naturel, Sabrage, Decanting, Corked, Off-dry, Le Masche, Moët, Drappier, Bollinger, Krug, Pommery. Fixed three says (Piper-Heidsieck, Inglenook Rubicon, Albariño).

### Mix-ups

The pack had nine, none about wine. Added eight: Leflaive Mâcon-Verzé against Fichet Mâcon-Igé; Louis Pommery against Pommery; Fichet of Igé against Jean-Philippe Fichet; Moët Imperial Rosé against Nectar Demi Sec; the house Champagne against Charles Lafitte; the Argyle against the house Champagne; Damien Martin against Jadot Beaune; Berres against the Dr. Hermann Auslese.

### Scenarios

Added eight that happen on this floor: "Two glasses of Champagne" (name the wine and the price before pouring), "Is the wine pairing worth it?" ($120 on the $80 tasting, five 4 oz pours), "A glass of the tasting wine on its own", "Not too dry", "A buttery Chardonnay" (ours is creamy but fresh; say so), "We brought our own bottle" (the dining room corkage is unpublished: ask the manager), "Fish and steak, one bottle" (the light red bridge, or a glass each), and "An 80th birthday" (a guest born in 1946 shares our year).

### Must-knows

Added two: "Bottles from 1946, the year we opened" (four Bordeaux with prices; the sommelier presents and opens them) and "Champagne or sparkling wine: say the right word" (one list of which of our bubbles are Champagne).

### Lineup asks

None added: the register already asks for every blend the menus omit. Several of those asks (the twelve Birthday and Bubbles blends, the Argyle, the Barbera's aging, Louis Pommery's maker) now have a producer's published answer on the card, each worded so the bottle is still confirmed at lineup; the asks stay, because the bottle in the building is what counts.

### Left for the owner or other reviewers

- Codex flash card fronts are the wine's name, set in codex28.js; making the front a question (for example "Which Mâcon is on the tasting?") is a code change outside this fragment.
