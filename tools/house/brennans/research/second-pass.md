# Brennan's server guide: second pass

Written 3 October 2026. Read-only except this file and verified-facts.json beside it. Nothing committed.

## Method note

The first pass (refuted.md, unverifiable.md, critique.md, pdf-corrections.md, summary-keyfacts.md) read the 51 page server guide (guide.txt, a pdftotext of the guide whose menus were read from brennansneworleans.com on 26 September 2026) and produced 25 refuted or disputed claims, 23 unverifiable claims and eight gaps. This second pass re-tested 48 of those claims and corrections and ran six searches against each of the eight gaps.

Every search was a WebSearch call under a hard cap, read as snippets. No page was fetched: WebFetch and curl were blocked for every domain. Verdict batches spent 65 searches (11, 9, 12, 9, 12, 12) and the eight gaps spent 47 (5, 6, 6, 6, 6, 6, 6, 6), 112 in all. Where the guide alone could settle a point (a count of its own headings, the AVOID lines, a palate call) no search was spent and the note says so.

Every statement carries one of three labels. (pdf) is the guide, with a page number. (search: site, what the snippet said) is a search snippet, and a snippet is evidence only for what it says. (expert) is general trade knowledge and is never a Brennan's fact. The search index carries no crawl date, so a snippet of a house page may be older than the page: where two house pages disagree, both readings are kept and the printed card on shift decides.

Verdict words: confirmed means the first pass's correction (or, where it stood alone, the original claim) holds; corrected means the first pass's correction itself needed amending; refuted means the first pass's correction was wrong and the original claim or a third reading is right; still-unverifiable means no source settles it and the pack should carry no fact on it.

Counts: 48 verdicts, of which 25 confirmed, 17 corrected, 1 refuted, 5 still unverifiable. 67 gap facts across the eight gaps. 115 entries in verified-facts.json.

## Claim verdicts by subject

### The kitchen: chefs and the house

**chef-history-15, chefs 1974 to 2013: corrected.** (search: Times-Picayune obituary mirrored on groups.google.com) Michael J. Roussel died in July 2005 aged 67, having retired earlier that year after 49 years at Brennan's, the last 30 as executive chef; he apprenticed under Paul Blangé and became executive chef in 1974. (search: cooksinfo.com, southernfoodways.org) Blangé, 1900 to 1977, created Bananas Foster, Eggs Hussarde and Chicken Pontalba. (search: frenchquarterly.com, brennansrestaurant.blogspot.com, bizneworleans.com) Lazone Randolph started as a dishwasher in 1965, was named executive chef in 2005 succeeding Roussel, and is the chef behind Chicken Lazone. (pdf p49) The guide names only Blangé and Kris Padalino. The original claim was right that Roussel retired in 2005 after 49 years; the first pass erred twice, saying he died in post and that he became chef after Blangé's death. 49 years back from 2005 is 1956, the year of the move to Royal Street.

**chef-dishes-a-23 and pdf-factcheck-4, Kris Padalino: confirmed.** (search: Axios New Orleans 4 June 2025, Country Roads Magazine, brennansneworleans.com/kris-padalino, myneworleans.com) Padalino became executive chef in June 2025 after eight years at Brennan's as executive sous chef and pastry chef, trained at Le Cordon Bleu in Pasadena, cooked in Los Angeles and Denver, draws on Vietnamese flavours and her Sicilian background. The maths and chemistry background in the first pass appeared in no snippet and is dropped. (pdf p49) She has said she wants more tableside cooking.

**pdf-factcheck-6, hours, happy hour, sabering, dress code: confirmed.** (search: brennansneworleans.com/about, Bubbles page, Roost Bar page, FAQ) Breakfast and lunch Monday to Friday 9 to 2, weekends 8 to 2; dinner nightly 6 to 10; Roost Bar and Courtyard weekdays 9 to 10, weekends 8 to 10; Bubbles at Brennan's weekdays 2 to 6; Champagne sabering Fridays at 5 in the courtyard, call ahead in case of a private event. Dress code: no athletic or cut-off shorts, decal or sleeveless t shirts, hats or open toed shoes for gentlemen; jackets preferred at dinner. Older snippets with Thursday to Monday schedules are stale.

**floor-service-16, parking and the Royal Street mall: corrected.** (search: offbeat.com, fqba.org, frenchquarter.com, Verite News) Royal Street from Bienville to Orleans is closed to vehicles Monday to Friday 11 to 4 and weekends 11 to 7, so the street is open to cars when breakfast opens and all evening; it is lunch that falls inside the closure, not breakfast. (search: brennansneworleans.com FAQ) Validated valet parking at 535 Chartres ($10 with validation, up to three hours) and 716 Iberville ($12 to $14). Nothing limits valet to dinner, so the first pass's inference goes. Note the floor gap below found a snippet saying no valet is published; the FAQ snippet here is the more specific reading, and the host stand decides.

### The kitchen: dishes and their sources

**chef-dishes-a-1, Louisiana Oysters and Worcestershire: confirmed.** (search: brennansneworleans.com breakfast and lunch menu) Louisiana Oysters with New Orleans BBQ Sauce, pickled collard greens, shallots, fried saltine crumble, $19, matching p10; the menu says nothing about Worcestershire. (pdf p10, p11) Butter, black pepper and Worcestershire is the definition of the barbecue shrimp style, not the house recipe; the service note flags the anchovy in Worcestershire. (expert) That is the Pascal's Manale style description. Correction stands.

**chef-dishes-a-2, Grand Isle Jewel Oysters: confirmed.** (search: jedco.org, axios.com) Grand Isle Jewels is a brand launched April 2025 by the Jefferson Parish Economic Development Commission with eight off-bottom farms after Hurricane Ida. (search: kalb.com, lailluminator.com) Floating cages above the seafloor, tumbled and selected for a deep cup. (search: seafoodsource.com) National distribution with Inland Foods from September 2025. The guide's line is true but omits that they are farmed and tumbled.

**chef-dishes-a-5, turtle sourcing: confirmed.** (search: foxnews.com) Brennan's uses only Louisiana farm-raised freshwater turtle from Louisiana Foods, no endangered species. The snippet names neither Slade Rushing nor 2014, so that attribution stays unconfirmed.

**chef-dishes-a-9, Baked Apple: confirmed.** (search: brennansneworleans.com/recipes/baked-apple) Peeled, trimmed, cored, topped with a pecan oat crumble (flour, butter, light brown sugar, cinnamon, oats, raisins, pecans), baked covered in half an inch of water at 350F for about 45 minutes. (pdf p4) The plate adds a brown sugar glaze and sweetened crème fraîche the home recipe omits.

**chef-dishes-a-10, Seafood Gumbo recipe: confirmed.** (search: brennansneworleans.com/recipes/seafood-fil-gumbo) Mahogany roux, andouille, trinity, garlic, okra, tomato, Creole spice, bay, thyme, crab or shrimp stock, an hour's simmer, crab, shrimp and oysters for the last three minutes; filé in the list. (pdf p15) The dining room build is still to be confirmed at lineup.

**chef-dishes-a-15, crab claws called tough: still unverifiable.** Two diners' opinions are not a pack fact. (pdf p12) Served warm in brown butter vinaigrette, finger food. (expert) The only lesson is to say warm and off the claw.

**chef-dishes-a-24, egg yolk bottarga: confirmed.** (search: SinglePlatform, Gayot, Tripadvisor aggregators) A Ricotta Gnudi at $14 with egg yolk bottarga did exist, undated. (pdf p13) The guide's full dinner menu has no gnudi; egg yolk bottarga is only on the Steak Tartare Cannoli, $17. Correction stands: the gnudi is off the menu.

**chef-dishes-a-25, Fresno chilli: confirmed.** (search: pepperscale.com, chilipeppermadness.com) Fresno 2,500 to 10,000 Scoville, jalapeño 2,500 to 8,000; red Fresnos average about 7,100. (search: en.wikipedia.org) Developed by Clarence Brown Hamlin in 1952, named for Fresno, thinner walls. Same band as a jalapeño, a red one a touch hotter; (pdf p13) 'gentle warmth' is the honest table line.

**chef-dishes-a-27, turtle soup canon: corrected.** (search: foodnetwork.com, cdkitchen.com, louisiana.kitchenandculture.com) The published Commander's Palace turtle soup uses equal parts turtle, veal and beef, with roux, lemon, chopped egg, spinach and sherry. (search: nomenu.com) Tom Fitzmorris says the regional style descends from Commander's and is distinctive in using as much veal as turtle. So the original 'as much veal as turtle' was sound and the first pass's correction was wrong. (search: en.wikipedia.org, 64parishes.org) Prudhomme became Commander's executive chef in 1975, so 'mid 1970s'. (search: brennansneworleans.com/recipes/turtle-soup, saveur.com) Brennan's recipe is turtle only. (pdf p14) '100% turtle meat'. (expert) That the menu line is a jab at Commander's is an inference nobody has stated.

**chef-dishes-b-4, Eggs Sardou: corrected.** (search: saveur.com, en.wikipedia.org, chowhound.com) Created at Antoine's, usually dated 1908, for Victorien Sardou: poached eggs on artichoke bottoms with anchovies, hollandaise, truffle, parsley and ham, with fried asparagus spears. The first pass was right on no spinach but wrong to drop the asparagus. (search: mission-food.com) Brennan's: creamed spinach, fried artichokes, poached eggs, Choron. (expert) Antoine Alciatore died in 1877, so say 'at Antoine's' and name no cook; 1908 is lore.

**chef-dishes-b-6, Eggs Owen named for Owen Brennan: still unverifiable.** (search: Yelp, feastio.com, Wikipedia) No source says it. Owen Brennan lived 1910 to 1955, opened on Bourbon Street in 1946. (pdf p48) No origin printed.

**chef-dishes-b-7, Eggs Owen old and new: confirmed.** (search: feastio.com) Older description: poached eggs on roast beef hash. (pdf p48) Today: red wine braised short rib débris, Creole spiced potato, soft boiled egg, hollandaise and marchand de vin, $32.

**chef-dishes-b-8, débris: corrected.** (search: mothersrestaurant.net/history) Mother's opened at 401 Poydras in 1938 and its own history says Simon Landry coined the term at the carving board. (search: nolaeats.com) Mother's has the strongest documented claim. The first pass was wrong to strike Landry; Mother's names him. (expert) Débris is ordinary Louisiana French for scraps, so say popularised, not invented.

**chef-dishes-b-13, Pecan Gulf Fish and amandine: still unverifiable.** No search spent. (pdf p30) Describe the plate as printed. (expert) The amandine lineage is plausible, not a house fact.

**chef-dishes-b-19, Sauce Foyot: corrected.** (search: fr.wikipedia.org, Escoffier on wikisource) Béarnaise with meat glaze, also called Valois, printed by Escoffier in 1903 and 1934. (search: en.wikipedia.org Restaurant Foyot, parismuseescollections) The restaurant at 33 rue de Tournon opposite the Senate closed in 1937 after 169 years; Nicolas Foyot, chef to Louis-Philippe, bought it after 1848 and did not found it; Léopold Mourier succeeded him in 1891. The first pass's correction erred on 'founder' and on 1938. (expert) Name the restaurant, not a cook.

**chef-dishes-c-4, Bananas Foster Day 2026: corrected.** (search: Axios 6 April 2026, brennansneworleans.com events page) Monday 6 April 2026, courtyard happy hour 4 to 6 for the dessert's 75th year: a Champagne sabering, free tastes for the first 75 guests, a flame competition, a Banana King, a cocktail flight, live music. Richard Foster's grandsons appeared in no snippet.

**chef-dishes-c-5, published Bananas Foster: confirmed.** (search: brennansneworleans.com/recipes/bananas-foster) Per person 1 oz butter, half cup light brown sugar, quarter tsp cinnamon, 1.5 oz banana liqueur, 1.5 oz aged rum, half a banana; the page tells the 1951 Owen Brennan, Blangé and Richard Foster story. (pdf p48) The guide's comparison line omits the banana liqueur.

**chef-dishes-c-9, Luxardo: confirmed.** (search: imbibemagazine.com, en.wikipedia.org) Founded 1821 in Zara, now Zadar, by Girolamo Luxardo from his wife Maria Canevari's rosolio maraschino; restarted at Torreglia near Padua in 1947. (expert) The 30,000 tree figure is trade lore.

**chef-dishes-c-15, bread pudding origin: corrected.** (search: myneworleans.com, ckbk.com) The 1901 Picayune pain perdu does carry lemon zest, so the claim's list was right; the same book prints a separate Pouding de Pain with raisins, so the first pass was right that pain perdu is not the anchor. (search: gumbopages.com, ckbk.com) The Bon Ton Café's whiskey sauce bread pudding, Alzina Pierce's family recipe, is the famous one. (expert) Medieval thrift origin is the safe wording.

**chef-dishes-c-16, Brabant potatoes: corrected.** (search: americastestkitchen.com, ckbk.com) The Picayune's Creole Cook Book (1901) has Pommes de Terre Brabant, parboiled cubes fried in butter and lard, so the citation is real and earlier than 1922. (search: americastestkitchen.com, sprinklesandsprouts.com) Named for the Brabant region of Belgium and the Netherlands, not northern France. (search: deepsouthdish.com) 'Louisiana fries' is a blog nickname. (pdf p30, p31) Garlic butter and parsley finish, bra-BAHNT.

### The dinner and breakfast tastings

**chef-dishes-a-6, the duck course: corrected.** (search: brennansneworleans.com/menus/dinnertastingmenu) Course four is now indexed as Hazelnut-Crusted Duck, 14 day dry-aged Rohan, brown butter and sweet potato purée, winter squash, sage, duck jus. (pdf p6, p7) The guide's late-summer plate had cane syrup glazed peaches and candied hazelnuts. Only the kitchen can say which plate is on tonight.

**chef-dishes-a-7, the lobster pour: corrected.** (search: same page) Domaine Matrot Meursault 2023 on the $120 supplement. (pdf p6, p45) Fichet 'Château London' Mâcon-Igé 2024. The course agrees; the pour has moved.

**chef-dishes-a-8, petite filet pairing: corrected.** (search: breakfasttastingmenu page) Domaine de Châteaumar 'Cuvée Vincent' Côtes du Rhône 2023, agreeing with the guide; the events page's Ogier 'La Rosine' is superseded. (search: wineenthusiast.com, intowine.com) Cuvée Vincent is 100 percent Syrah from fifty year old vines, so (pdf p45) 'Grenache-based' is wrong.

### The bar

**bar-signature-18, Sazerac canon spec: confirmed.** (search: sazerachouse.com) Sugar cube, 3 dashes Peychaud's, 1.5 oz Sazerac Rye, 0.25 oz Herbsaint, lemon peel, two glass build, no ice. (search: iba-world.com) The IBA version is Cognac based with absinthe. (pdf p39) The house prints rye, Peychaud's, Herbsaint rinse, up; sugar and peel to confirm.

**floor-service-19, Sazerac service: confirmed.** (search: brennansneworleans.com/menus/cocktails) Classic Sazerac $13; Thompson's Dream with Willett 4 year rye, Bitter Truth Creole Bitters, St George Absinthe Vert rinse; Origin Story. Nothing says the bar builds it over ice.

**bar-signature-20, Bloody Bull origin: corrected.** (search: provi.com, Axios Detroit) The Bull Shot was invented in 1952 at the Caucus Club, Detroit. (search: Oxford Companion to Spirits and Cocktails) The Bloody Bull's origin is 'claimed, not entirely without evidence, by Brennan's'. (search: themanual.com, tasteatlas.com) Popular histories credit Owen Brennan in the 1950s. Say credited, not invented here.

**bar-signature-30, spirit-free components: confirmed.** (search: thespiritsbusiness.com, en.wikipedia.org, htfw.com) Seedlip is British, launched 2015; Grove 42 is its citrus expression, July 2018, 0.0 percent. (search: lyres.com, beveragedaily.com) Lyre's is Australian, founded 2019; Agave Blanco is under 0.5 percent, not zero. (pdf p50) 'Lyre's N/A agave'; which Lyre's agave the bar pours is open.

**bar-list-12, the 1946 themed list: corrected.** (search: brennansneworleans.com/menus/cocktails) Five drinks under 'Summer Vacations of 1946': Yellowstone $18, Miami Beach $14, Niagara Falls $15, Havana $17, Acapulco $16, builds in the JSON; Catalina Island and Black Hills under 'Temperance, 1946'. The claim's 'no spec or price known' is refuted, and the first pass's reading that the guide's seven other cocktails were the themed list was also off. (pdf p49) A fall change was expected.

### The cellar: programme

**somm-program-2, Grand Award year: refuted.** (search: winespectator.com Class of 2021 article and listing, oeufetboeuf.com) First won 1983, lost when Katrina's power outage cooked the cellar in 2005, regained 2021 after Braithe Tidwell rebuilt the list past 15,000 bottles. The first pass's 'late 2010s, most likely 2018' is wrong.

**somm-program-4, by-the-glass count: confirmed.** (pdf p41 to p46) Twenty headings: 13 glass pours from $14 to $75, the $80 Auslese half-bottle, and six tasting-only wines (Charles Lafitte, Fichet, Jadot Beaune 1er Cru, Châteaumar, Paul Hobbs, La Tour Vieille). (search: cocktails page) The website shows an older list, with the Sauvignon Blanc as Famille Durand Val de Loire 2024.

**somm-program-29, server wine training: still unverifiable.** No standard published. (pdf p44 to p46) The guide's serve lines are the only house instructions.

**somm-whites-1, Brennan's Essential: corrected.** (search: Liberty Wines, Folio, thefinestbubble.com) Essentiel Extra Brut carries about 5 g/l dosage, at least three years on lees (not four), about 30 percent reserve wine. No snippet ties the Brennan's label to the Essentiel cuvée. (pdf p44) Only that it is a Piper-Heidsieck Extra Brut under the Brennan's name.

### The cellar: pairings

**somm-pairings-3, Berres Riesling sweetness: corrected.** (search: thesortingtable.com) The 2022 carries 20.7 g/l residual sugar at 11.5 percent; the winemaker calls it semi-sweet. Off-dry, not dry; (pdf p6) 'off-dry-leaning' is nearest. Taste at lineup if the vintage changes.

**somm-pairings-7, turtle soup and the Extra Brut: confirmed.** (search: piper-heidsieck.com, libertywines.co.uk) Essentiel: 44 Pinot Noir, 34 Meunier, 22 Chardonnay, 36 months on lees, 6 g/l. (search: retailers) Rare 2012: 70 Chardonnay, 30 Pinot Noir, grilled almond and candied orange. Neither oxidative; the toast meets the Sherry.

**somm-pairings-8, Eggs Hussarde second choice: confirmed.** (pdf p3, p17, p18) The Pinot Noir is the different-style second choice. (search: wilsondaniels.com, wine.com) Pierre Sparr Crémant Rosé is 100 percent Pinot Noir; quote 'dry', not a figure.

**somm-pairings-10, gumbo pairing: confirmed.** (pdf p3, p15, p16) Riesling first, Pinot conditional. (search: thesortingtable.com) The 2022 is off-dry, so the heat rule is met.

**somm-pairings-11, duck confit waffle: corrected.** (search: thesortingtable.com) Off-dry, so (pdf p20) 'if it's off-dry, lead with it' applies and the caveat falls away. (search: b-21.com) The 2014 Erdener Prälat Auslese is a Goldkapsel at 8 percent, 375 ml only. (pdf p46) Sold only as an $80 half-bottle; no source shows it by the glass.

**somm-pairings-19, crab claws second choice: confirmed.** (search: dinner menu) Crab claws $22 with warm brown butter vinaigrette. (pdf p3, p12, p43) The Durand works because the dressing is a vinaigrette; Gainey fails the different-style rule. The producer name on the site is Famille Durand; check the label.

**somm-pairings-21, zero-proof for raw oysters: still unverifiable.** A palate call. (pdf p13, p49) Keep Catalina Island as printed; a server may offer Black Hills.

**somm-pairings-25, Rare 2012 for raw oysters: confirmed.** (search: millesima.com, landofwines.com) Rare 2012 is Chardonnay-led from Grand Cru sites with a saline finish and the house's own pairing list names oysters. (search: cocktails page) Both a 2012 and a 2013 are on Coravin at $75, so the vintage is a lineup question.

**somm-pairings-26, AVOID lines: confirmed.** (pdf) 35 AVOID lines counted: 12 name oak and tannin, 10 sweet blocks warn off dry wines, 13 name other styles. Internal tally, no pack line.

**somm-pairings-27, pairing block totals: confirmed.** (pdf) 35 pairing blocks, matching 35 ZERO-PROOF lines and the cellar dossier's breakdown. The 22, 11, 2 split is the first pass's own judgement.

**somm-reds-29, Banyuls AOC rules: confirmed.** (search: INAO cahiers des charges via lespassionnesduvin.com, hachette-vins.com, inao.gouv.fr) Mutage with neutral grape spirit at 5 to 10 percent of the must; Grenache noir at least 50 percent; Grand Cru at least 75 percent Grenache noir and 30 months in wood. The claim's 'Grenache noir, gris, blanc' is wrong: the floor is Grenache noir alone. (expert) 15 to 18 percent alcohol.

## The eight gaps

### Gap 1: the children's menu (5 searches)

Found (search: brennansneworleans.com/menus/kidsmenus/ and /menus/childrens-menu/, snippets agreeing word for word): for children 10 and under, every item $25 at breakfast and dinner. Breakfast, each with a kid's drink, sliced fruit as first course and vanilla ice cream: Eggs Any Style with Toast and Bacon; Popcorn Shrimp with Brabant Potatoes; Vanilla French Toast with Fresh Berries and Whipped Cream; Grilled Cheese Sandwich with Brabant Potatoes. Dinner, each with a kid's drink, a salami and cheese starter and vanilla ice cream: Fried Gulf Shrimp with French Fries; Buttered Noodles with Cheese; Sautéed Gulf Fish with Potato and Green Beans; Grilled Cheese Sandwich with French Fries. (search: FAQ or About snippet) High chairs and a dedicated children's menu are offered; the dress code states no exemption for children. (pdf p34, p49, p51) The guide never mentions the card; its one child line is the Bananas Foster safety note. gap-fill-1's stop-gap built from the adult menu is superseded.

Still open: what the kid's drink is; whether the breakfast card runs through lunch or sits beside the tastings; any minimum age, stroller or bar rule; allergens (shared fryer, egg pasta, egg in the ice cream); why two URLs; live confirmation of $25 at lineup.

### Gap 2: the Roost Bar and the cocktail list (6 searches)

Found (search: brennansneworleans.com/luxury-roost-bar-cocktails/): three drinks exclusive to the Roost Bar and Lounge: Flamingo $28 (Chopin vodka, Monkey 47 gin, dragonfruit, lemon, Taittinger La Française), Birdcage $31 (smoked Old Fashioned on Rabbit Hole Dareringer bourbon, Angostura, orange, cherry), Spoonbill $36 (Hendrick's gin, Cap Corse Mattei Blanc quinquina, chive oil, a spoon of caviar). (search: cocktails page) The Summer Vacations of 1946 list as in bar-list-12; Classic Sazerac $13 with premium versions at $20 and $40; a printed bar PDF, bno-cocktails.pdf, sectioned sazerac project, featured cocktails, brennan's classics; the snippet prices Bananas Foster at $12 against the guide's $14. (search: fall list query) No result shows a fall list. (search: brennansneworleans.com/braithe-gill/, fox8live.com, axios.com 21 January 2026) Braithe Gill is Beverage Director at Brennan's and Corporate Beverage Director of the Ralph Brennan Restaurant Group, a certified sommelier, a 2026 James Beard semifinalist for Beverage Service, formerly Wine Director at Union Square Café; (expert) almost certainly the Braithe Tidwell of earlier articles.

Still open: whether the 1946 list is still served; measures and glassware for the eight drinks; where Thompson's Dream and Origin Story are printed; the Bananas Foster price; the contents of bno-cocktails.pdf; a named Roost bar manager and the Friday saberer; the Tidwell and Gill identity.

### Gap 3: the wine programme today (6 searches)

Found (search: winespectator.com listing): Grand Award held since 2021, regained after Katrina; 3,635 selections and 19,415 bottles; strengths in Burgundy, Bordeaux, California, Rhône, Champagne and Italy; the page sits in the live 2026 listing, though no snippet printed 2026 beside the name. The 1983 to 2005 run rests on the earlier pass. (search: brennansneworleans.com/sam-bortugno/, guildsomm.com, Vinitaly 2024) Sam Bortugno is Wine Director, joined September 2023, Advanced Sommelier, passed the Master Sommelier theory exam in May 2023; Braithe Tidwell's wine director title is dated. (search: thevendry.com, private parties page, Private Dining Guide 4.2.24) The Wine Room seats 16; events line 504.934.3376. (search: events FAQ) Private events corkage $25 per 750 ml, magnum $50 counting as two, six bottles at most; no dining-room policy surfaced. (search: Bubbles page) Piper Heidsieck 'Brennan's Essential' Brut NV, $125 a bottle, $75 at Bubbles; the house spells it Essential and prints Brut where the glass list prints Extra Brut. (search: nataliemaclean.com) The anglicised spelling appears in trade reviews of the standard Essentiel, so the spelling proves no bespoke blend. (search: vinous.com and retailers) A white Rare Millésime 2012 exists, 70 Chardonnay, 30 Pinot Noir, about ten years on lees, about $250 retail; the earlier doubt is refuted.

Still open: whether Bortugno is still in post in October 2026; whether Wine Spectator's 2026 list names Brennan's in so many words; where the Wine Room sits and its minimum; dining-room corkage; whether Brennan's Essential is a relabelled Essentiel; the glass price ($28 or $30); which Rare is open; the 1983 and 2005 dates were not re-tested.

### Gap 4: the tasting menus now (6 searches)

Found (search: breakfasttastingmenu page): 'Traditional Breakfast At Brennan's $80', all drinks included, Brandy Milk Punch as eye opener, Eggs Hussarde paired with Charles Lafitte Brut, 4 oz; this run found no Piper-Heidsieck on the tasting. (search: dinnertastingmenu page) Oysters; BBQ Lobster with 'nduja and white bean stew paired with Domaine Matrot Meursault 2023; Redfish Véronique with Louis Jadot Beaune Bressandes 1er Cru 2022; Hazelnut Crusted Duck with sweet potato, winter squash and sage; The Snickers with M. Chapoutier Banyuls (snippet misspelt). (search: events page taste-of-brennans-menus) The guide's version: Rohan duck breast with cane syrup peaches paired with Paul Hobbs Coombsville 2021, oysters with Charles Lafitte, the $120 pairing in 4 oz pours; first search confirmation of the $120 price. So the site holds two dinner cards at once, and the snippets cannot say which is live. (search: fall query) No announced fall 2026 change; a neighbourhood named Fall Cocktails list (The French Quarter $14, Garden District $18, The Uptown, The Marigny, The Bywater, The 9th Ward, The Channel) surfaced only on undated third party mirrors and is treated as a past list.

Still open: which dinner card is on the table tonight; whether the menus page index is the February launch card or a fall card; whether the Hussarde Champagne ever switched to Piper-Heidsieck; breakfast courses one, two, four and five not surfaced this run; the eye opener question; whether the 1946 cocktail list has been retired; which Banyuls and which Jadot are poured.

### Gap 5: the floor (6 searches)

Found (search: southernfoodways.org Gravy episode): Chalaine Celestain is a Captain of about nine years; suited servers fire Bananas Foster tableside after months of training. (search: tripadvisor.com old review) Friday sabering heavily advertised; one guest found it skipped. Chateaubriand carving: no snippet. (search: brennansneworleans.com/about/) Erick Schmitt, General Manager. (search: opentable.com, house FAQ) Reservations on OpenTable 60 days ahead; parties over 6 ring 504-525-9711. (search: house FAQ, neworleans.com) No valet published in this gap's snippets; Omni Royal Orleans garage under renovation; see floor-service-16, where the FAQ snippet gave two validated valet garages, a conflict for the host stand to settle. (search: private parties page, Private Dining Guide 4.2.24) Nine spaces, seated/reception: King's 36/40, Queen's 24/30, Havana 60/75, Morphy 12/12, Chanteclair 100/160, Roost Bar 20/30, Audubon 50/60, Wine Room 16/16, Courtyard 50/75; events 15 to 500; 504-934-3376. (search: holidayhours page) Christmas Eve dinner 5:30 to 9, three courses $85; New Year's Eve dinner 6 to 10 à la carte; year not printed. (search: myneworleans.com) Reveillon proper is advertised at Ralph's on the Park. (search: neworleans-food.com) The group: Brennan's, Napoleon House, Red Fish Grill, Ralph's on the Park, Cafe NOMA, Jazz Kitchen Coastal Grill and Patio, Beignets Expressed.

Still open: who sabres and which bottle; Chateaubriand carving; the written flambé sign off; the holiday page's year and Christmas Day, New Year's Day and Thanksgiving; room minimums; a published hospitality standard; the GM's spelling and the other managers; valet at dinner.

### Gap 6: pronunciations and the Berres sweetness (6 searches)

Found (search: thesortingtable.com tech sheet): Berres Old Vines 2022, 11.5 percent, 6.7 g/l acidity, 20.7 g/l residual sugar, hand picked near Ürzig, four months on lees; (expert) feinherb to halbtrocken, off dry. (search: handpickedselections.com, cellartracker.com) Damien Martin is Domaine Robert et Damien Martin at Davayé, founded 1982, about 20 ha. (search: delectable.com, jp-bourgeois.com) Châteaumar: 9 km from Orange, Cuvée Vincent all Syrah from 50 year old vines beside Châteauneuf, organic without certification. (search: wineanorak.com, saq.com, tedwardwines.com) Fichet at Igé since 1976, 36 ha; Château London a limestone lieu dit, 90 percent steel. (search: chateau-issan.com, bordeaux-tradition.com) Moulin d'Issan is Château d'Issan's Bordeaux Supérieur, Merlot led, named for a ruined windmill; one retailer says 70 percent Cabernet, so give no number. Pronunciations: sourced (forvo.com, wikipedia.org) for Beaumes-de-Venise, Banyuls, Jadot; the rest expert, listed in the JSON.

Still open: the Moulin d'Issan 2023 blend; whether the Berres bottle is the Sorting Table's 'Estate Riesling Old Vines'; an ear check on Leflaive, Minuty, Fichet, Berres, Pazo das Bruxas, Gainey; one-line facts for the thirteen producers not searched.

### Gap 7: the fourteen sourcing names (6 searches)

Found (search: opencorporates.com, marketumbrella.org, VEGGI): Tien Dat Tofu LLC is on the West Bank (Marrero, Harvey, Westwego), a Vietnamese co-op tied to VEGGI, extra firm non-GMO tofu weekly; (search: dinner menu) the blackened tofu uses it with rice grits and preserved shiitake. (search: jedco.org, axios.com, wwltv.com) Grand Isle Jewels honours the late Jules Melancon, first permitted to farm off-bottom in 2012; the brand is plural. (search: mushroommaggiesfarm.com, theadvocate.com) Mushroom Maggie's Farm, St Francisville, Maggie Long and Cyrus Lester since 2018, 1,200 to 1,500 pounds a week; no snippet names Brennan's. (search: dessert menu, rumx.com, bourbonandbones.com, gotrum.com) Dulce de Leche prints Brennan's Blender's Reserve Don Q Rum $14; Blender's Reserve is a blend of eight rums 5 to 18 years at 40.7 percent; Don Q sells restaurant-named private casks and hosted an event at Brennan's during Tales of the Cocktail 2026; the Brennan's prefix is unexplained. (search: myneworleans.com) Congregation's flagship is at 240 Pelican Ave, Algiers Point; no listing shows a Papua New Guinea. (search: farmprogress.com, world-grain.com) Two Brooks Farm, Sumner, Mississippi, Mike Wagner since 1992, about 2,000 acres, rice grits among 14 products. The other eight brands are covered from expert knowledge only, including the correction that Rohan is a D'Artagnan proprietary hybrid, not a heritage breed.

Still open: which Tien Dat style; oysters per order and the chilli preservation; chef confirmation of Maggie's; the Blender's Reserve story; the coffee origin this season; which Luxardo product is in the Cherries Jubilee.

### Gap 8: the published recipes (6 searches)

Found (search: brennansneworleans.com, domain limited): recipe pages for Bananas Foster, Turtle Soup, Seafood Filé Gumbo, Eggs Sardou, Artisanal Eggs Benedict, Caribbean Milk Punch, and Baked Apple at the root; no full index. Bananas Foster: both banana liqueur and rum at 1.5 oz; the history names the New Orleans Crime Commission, as the guide does. Turtle Soup (credited to the Brennan's New Orleans Cookbook): 1.5 lb cubed turtle, flour thickened, 3 qt beef stock, Worcestershire, Crystal, five chopped eggs, spinach, lemon, half cup sherry; no veal. Gumbo: canola and flour roux, okra, tomato, a teaspoon of filé, 3 gal crab or shrimp stock, lump crab, 40 oysters, shrimp. Eggs Hussarde and marchand de vin: no house page; the Benedict page gives the hollandaise (butter, yolks, lemon, Champagne vinegar, Crystal, cayenne, salt). Brandy Milk Punch: no recipe page, only the menu line. Eggs Sardou: fresh artichoke hearts in flour, egg and panko, Parmesan creamed spinach from reduced cream, two artichokes, two eggs, Choron over.

Still open: the full recipes index; whether the 2026 kitchen follows the published builds; the marchand de vin and its ham; the Choron build and Sardou quantities; the Caribbean Milk Punch build; the Metropolitan versus New Orleans Crime Commission wording; where the sherry goes into the turtle soup.

## The ten facts that most change the pack

1. The Wine Spectator Grand Award dates are 1983 to 2005 and regained 2021, not 2018; the live listing shows 3,635 selections and 19,415 bottles.
2. The Berres Old Vines Riesling 2022 is off-dry at 20.7 g/l, which retires four hedges and settles the gumbo, duck waffle and heat rule pairings.
3. Michael Roussel became executive chef in 1974 and retired in 2005 after 49 years; Lazone Randolph succeeded him; the first pass's correction was wrong twice.
4. The dinner tasting exists in two versions on the house site (peaches, Fichet, Jadot 2023, La Tour Vieille against hazelnut crust, Matrot Meursault, Jadot Bressandes 2022, Chapoutier), so three of five pours and the duck plate are confirm-at-lineup variables.
5. The children's menu: ten and under, every item $25, four breakfast and four dinner sets with inclusions, which replaces gap-fill-1's stop-gap.
6. The Summer Vacations of 1946 list and the three Roost luxury cocktails now carry full builds and prices, and the guide's seven other cocktails are not the themed list.
7. Cuvée Vincent is 100 percent Syrah, not Grenache-based, as p45 says.
8. Commander's Palace turtle soup does use as much veal as turtle, so the original claim stands and the first pass's correction falls; Brennan's published recipe is turtle only.
9. Braithe Gill (formerly Tidwell) is Beverage Director and a 2026 James Beard semifinalist, Sam Bortugno is Wine Director since September 2023, and Erick Schmitt is General Manager.
10. The published Bananas Foster recipe carries 1.5 oz banana liqueur beside the rum, which the guide's comparison line omits; and Royal Street is a pedestrian mall at lunch, not breakfast, with validated valet at two garages.
