# Producers in the cellar: Alsace, the Jura and the Mosel (10 October 2026)

## Method

No new web search ran for this pass. The session's shared WebSearch budget (200 calls a turn, shared by every agent) was already spent when this group began: the first three queries (Trimbach of Ribeauvillé, Albert Boxler of Niedermorschwihr, Domaine du Pélican of Arbois) were each refused with "this turn's web search budget is used up". WebFetch was tried once, on the page that mattered most for the least documented estate (www.weingut-dr-hermann.de), and failed at the network egress with "getaddrinfo ENOTFOUND www.weingut-dr-hermann.de". The limit was not worked around.

So this file is built from what the repositories already hold, and every item says which of four kinds it is:
- [search, earlier]: a live search made by an earlier pass and recorded in this repo with the pages it named. The passage is that pass's record of the page, not a fresh reading of it. Three files hold these: research/components-wines-2026-10-05.md (searches 22, 23 and 38), research/verified-facts.json and research/second-pass.md (the importer page for C.H. Berres at thesortingtable.com and the retailer page for Dr. Hermann at b-21.com), and research/bottle-facts-cards-a-2026-10-04.json (the importer pages for Weingut Stein at astorwines.com and chambersstwines.com, searched on 4 October 2026, mixed by that pass with its own knowledge).
- [house]: the house's own documents: the shipped wine list static/shared/packs/brennans-new-orleans.winelist.v1.json (producer lines, tells and the Binwise entries read on 3 October 2026) and the pack static/shared/packs/brennans-new-orleans.v1.oothouse.json (the fourteen wines of this group in full, their say lines and service notes).
- [Codex]: the Sommelier's Codex's own corpus: the producer records in sommelierscodex/js/data-producers.js and the question and primer records in data-questions.js, data-intro.js, data-advanced.js, data-master.js and data-primers.js. They were written to the Codex's refutation rule (its header comment: "AN EMPTY FIELD IS A TRUE ANSWER"), but they are not independent web sources, and a Codex record cannot confirm a component built from the same knowledge. Where a quoted Codex passage carried a dash, it is written here as a colon or a comma.
- [expert]: standard wine knowledge, used only where certain and never for a date, a number, a person or a relation that is not also sourced above.

The task named research/producers-2026-10-04.json; no such file exists in the repo.

What could not be confirmed, and is therefore left out of every profile or turned into a lineup question:
- C.H. Berres: the family's 1510 date, its generation count and who runs the estate. The pack and the component wine-story-mosel-families print "roots to 1510"; the only bases are research/dossier-the-cellar.md, which marks it "(expert, medium)", and research/claims.json, which says "I hold this with medium confidence from memory only". No search has ever confirmed it.
- Dr. Hermann: the founding year (1967), the founder (Dr. Rudolf Hermann), a cousinship with the Loosen family, the son who runs it and whether it belongs to the VDP. All rest on research/claims.json, which records "No search... My recollection matches the claim". None is used.
- Albert Boxler: the founding date, the founder, the generations, the size, the farming and who makes the wine today. No source at all.
- Domaine du Pélican: which member of the d'Angerville family founded it, where the cellar stands, where its vines came from, how it is farmed, why it is called Pélican and what the S° on its sparkling wine means.
- Weingut Stein: the founding date, whether the "Dr." the earlier card gave Ulrich Stein is right, where exactly the Weihwasser grows and how old the vines are (the earlier card mixed "60-year-old vines in the St. Aldegunder Klosterkammer" with "near the old church in Alf", partly from knowledge), and what the 1900 in Alfer Holle 1900 means.
- Trimbach: when the house moved to Ribeauvillé (one earlier summary says after the First World War; no second source), how long the family has owned Clos Sainte Hune, and which vineyards feed the Réserve Personnelle.
- Egon Müller: the year of the marriage that brought the Scharzhofberg to the Müllers, and anything about the family today.
- Joh. Jos. Prüm: how long the family has been in Wehlen before 1842, and anything about the family today.
- Pronunciations: no pronunciation source was read; the pack's respellings are kept and marked [house].
- Hectares, scores, prices beyond the list's own and current owners or winemakers are not stated as present facts anywhere below.

Because no search ran, these profiles are thinner than the other cellar groups. A follow-up pass with search budget should start from the list "Searches still owed" at the end of this file.

What the house prints (the pack's wines for these producers, with their ids):
- F.E. Trimbach: Riesling Réserve 2020, $85, bin 25312, Other whites (w-ev3v8m4g); Pinot Gris Réserve Personnelle 2007, $360, bin 22755 (w-lu2zb67t); Clos Sainte Hune Riesling 2007, $390, bin 22754, the pack's region Hunawihr (w-s9wsu1v5).
- Maison Trimbach: Gewurztraminer Vendanges Tardives 2007, $295, bin 29958, Dessert and fortified (w-62yqx152); the list spells it "Vendages Tardives".
- Albert Boxler: Pinot Gris 2020, $110, bin 2173, Other whites (w-uwpmn81x).
- Domaine du Pélican: Arbois Vin Jaune 2016, $655, bin 32816, Other whites (w-q4gc7twe).
- C.H. Berres: Old Vines Riesling 2022, $14 glass, Riesling and aromatic whites (w-5luyxb98).
- Dr. Hermann: Erdener Prälat Riesling Auslese 2014, 375 ml, $80 half-bottle, Dessert wines (w-lkox3rl4).
- Weingut Dr. Hermann: Ürziger Würzgarten in der Kranklei Riesling Spätlese Goldkapsel 2018, $95, bin 28461, Dessert and fortified (w-1j9ri89c); the list spells it "Urziger Wurtzgarten".
- Weingut Stein: Weihwasser Riesling Feinherb 2023, $55, bin 22111 (w-du80kehr); Palmberg-Terrassen Riesling Spätlese-Feinherb 2014, $62, bin 29362 (w-dv66g929); both Other whites.
- Egon Müller: Scharzhofberger Riesling Kabinett 2020, $395, bin 21964, Other whites (w-7g6cp24m).
- Joh. Jos. Prüm: Wehlener Sonnenuhr Riesling Kabinett 2020, $135, bin 29361, Other whites (w-3pcqa2ty); Wehlener Sonnenuhr Riesling Auslese Goldkapsel 2015, 1.5 L magnum, $615, bin 12135, Large formats, printed "GKA" (w-pv3la1bh).

The searches, in the order tried: 1. Trimbach history (refused, budget). 2. Albert Boxler history (refused, budget). 3. Domaine du Pélican founding (refused, budget). WebFetch: www.weingut-dr-hermann.de (ENOTFOUND). No further attempt.

## 1. Trimbach, Ribeauvillé (F.E. Trimbach and Maison Trimbach)

1. Founding and family [search, earlier]: "Trimbach. Wikipedia (Maison Trimbach), idealwine.net: founded in 1626 by Jean Trimbach, first at Riquewihr; settled at Ribeauvillé after the First World War; thirteen generations of the family; best known for bone dry Riesling, above all the Clos Sainte Hune."
   Source: research/components-wines-2026-10-05.md, search 38 (the pages named there are Wikipedia, Maison Trimbach, and idealwine.net). The move to Ribeauvillé after the First World War rests on this one summary and is left out of the profile.
2. The Codex record [Codex]: p-trimbach: country "France, Champagne, Loire and Alsace", r "Alsace", sub "Ribeauvillé (Haut-Rhin)", founded "1626"; holdings: "Owns Clos Ste Hune, a parcel of a little under two hectares inside the Rosacker grand cru at Hunawihr, and draws Cuvée Frédéric Emile from the Geisberg and Osterberg slopes above Ribeauvillé." Style: "Bone dry, stainless steel, no new oak, released late: austerity as a house policy rather than a vintage accident." Why: "The house that made dryness the Alsace standard, and that long declined to print grand cru on its greatest wines: the cleanest proof that a cru is a site, not a maker." Wines include "Riesling Réserve", "the house wine, and the reference for dry Alsace Riesling at volume", and "Gewürztraminer Cuvée des Seigneurs de Ribeaupierre", "dry Gewürztraminer". Traps include "The house stands at Ribeauvillé; Clos Ste Hune is at Hunawihr".
   Source: sommelierscodex/js/data-producers.js, record p-trimbach (and the icon record w-clos-ste-hune, "A parcel of a little under two hectares inside the Rosacker grand cru at Hunawihr, owned outright by Trimbach").
3. Clos Sainte Hune and Rosacker [Codex]: "Clos Sainte Hune, a walled plot of a little over a hectare and a half at Hunawihr, lies inside one of Alsace's grand crus, though the label has traditionally said nothing about it." Answer Rosacker: "Rosacker is limestone and dolomite on the slope above Hunawihr, and the clos sits in the heart of it. The house behind the wine built its reputation long before the grand cru system was delimited at all, which is why the plot name has always carried more weight on that label than the site name would." Another record: "~1.67 ha; Trimbach declines to print the grand cru name on principle."
   Source: sommelierscodex/js/data-questions.js, c-qzkt8t21; data-advanced.js, a-j20zbpjo. The three Codex sizes agree within themselves; no hectares go into the profile.
4. The grand cru system [Codex]: "Fifty-one, and each is a separate AOC in its own right with its own decree setting permitted varieties, yields and minimum ripeness"; "the term is optional: Trimbach's Clos Ste Hune sits in Rosacker and has historically declined to say so".
   Source: sommelierscodex/js/data-advanced.js, a-j5va0rn8.
5. Vendanges Tardives [Codex]: "Two late-harvest categories were given legal force in 1984"; "The 1984 decree fixed minimum must weights, banned any addition of sugar and required hand picking." "VT: 235 g/L for Riesling and Muscat, 257 g/L for Gewurztraminer and Pinot Gris". "The wines may not be sold until eighteen months have passed". "The category sets a minimum sugar level in the fruit at picking, not in the finished wine. A producer is free to ferment that sugar out, and some celebrated examples are nearly dry."
   Source: sommelierscodex/js/data-intro.js, i-kg5kw4ho, i-6c7nyiqo and i-qhkyarph; data-advanced.js, a-qe25zf0w.
6. The sweetness word [Codex]: "Since the 2021 vintage a dryness indication is compulsory on Alsace's still whites, either as a printed scale or as one of four words" (sec, demi-sec, moelleux, doux); Vendanges Tardives and Sélection de Grains Nobles "stand outside the 2021 rule".
   Source: sommelierscodex/js/data-questions.js, c-ur0x5kp7 and c-3i8ky62n.
7. The wine list [house]: producer trimbach, region "Ribeauvillé, Alsace": line "A historic Ribeauvillé house famous for dry, firm, long-lived Riesling, above all Clos Ste Hune."; tell "Trimbach makes dry, firm Alsace whites. Clos Ste Hune is one of the world's great Rieslings, from a tiny plot; Cuvée Frédéric Emile is its other top Riesling; Vendanges Tardives means late harvest and is sweeter." The entries print the house three ways, "F.E. Trimbach", "Domaine F.E. Trimbach" and "Trimbach": Clos Ste Hune 2004 ($400), 2007 ($390), 2009 in magnum ($985) and 2015 ($980); Cuvée Frédéric Emile 2014 in magnum ($500) and 2015 ($265); Gewurztraminer Cuvée des Seigneurs de Ribeaupierre 2007 ($305), Vendanges Tardives 2007 ($295) and a Gewurztraminer 2018 ($65); Pinot Gris Réserve Personnelle 2007 ($360), Reserve 2018 ($75) and Vendanges Tardive 2000 ($145); Riesling Reserve 2020 ($85); Pinot Blanc 2021 and 2022 ($50 each).
   Source: the shipped wine list, producer trimbach and its entries.
8. Réserve Personnelle [house]: "Réserve Personnelle is F.E. Trimbach's top range, here its top Pinot Gris, from the family house in Ribeauvillé, Alsace" (how: "knowledge"). Which vineyards and how much sweetness the 2007 carries are, in the pack's own words, "questions for the sommelier".
   Source: research/bottle-facts-cards-a-2026-10-04.json, bin 22755; the pack, w-lu2zb67t.
9. Pronunciation [house]: "Trimbach: TRIM-bahk; Ribeauvillé: ree-boh-vee-LAY"; "Clos Sainte Hune: kloh sant OON; Hunawihr: OO-nah-veer"; "Réserve Personnelle: ray-ZAIRV pair-soh-NELL"; "Vendanges Tardives: vahn-DAHNZH tar-DEEV".
   Source: the pack, say fields of w-ev3v8m4g, w-s9wsu1v5, w-lu2zb67t and w-62yqx152.

Expert knowledge: the initials F.E. on the label, and the name of the Cuvée Frédéric Emile, are those of Frédéric Emile Trimbach, a forebear of the family (no source read this pass; a search should confirm it before it goes beyond the notes).

Brennan's link: the Riesling Réserve 2020 is the reference dry Riesling on our list; Clos Sainte Hune 2007 is the collectors' bottle for the purest seafood; the Réserve Personnelle 2007 is the celebration bottle for the duck confit waffle; the Gewurztraminer Vendanges Tardives 2007 is the celebration bottle for the Baked Apple. The pack files the last under the producer string "Maison Trimbach", which is why the house producers list finds no wine list line for it or for "F.E. Trimbach": the list's producer is named "Trimbach".

## 2. Albert Boxler, Niedermorschwihr (Pinot Gris 2020)

1. The wine list [house]: producer albert-boxler, region "Niedermorschwihr, Alsace": line "A small, revered estate in Niedermorschwihr, famed for grand cru Riesling from the Brand and Sommerberg."; tell "Boxler is one of Alsace's most admired small estates. Brand and Sommerberg are grand crus, and the Rieslings are intense, dry and mineral. The Muscat and Edelzwicker blend are lighter, aromatic surprises."
   Source: the shipped wine list, producer albert-boxler.
2. The domaine [house]: "Albert Boxler is a small family domaine in Niedermorschwihr, in the hills above Colmar, Alsace, known for intense, precise wines; Alsace Pinot Gris is richer and more aromatic than Italian Pinot Grigio, and Pinot Gris with foie gras is a classic Alsace pairing" (how: "knowledge").
   Source: research/bottle-facts-cards-a-2026-10-04.json, bin 2173.
3. What the labels name [house]: the list prints Albert Boxler "Brand" Grand Cru Pinot Gris 2015 ($170), 2020 ($200) and 2022 ($225); "Wibthal" Sommerberg Grand Cru Pinot Gris 2015 ($175) and 2019 ($225); "Brand" Riesling 2022 ($230); "Sommerberg" Grand Cru Riesling 2015 ($180); "Sommerberg ~ Eckberg" Grand Cru Riesling 2015 ($195); "Sommerberg Dudenstein" Riesling 2022 ($280); Gewurztraminer Réserve 2019 ($130); Pinot Gris 2020 ($110); Edelzwicker 2015 ($65); Muscat 2015 ($105) and 2020 ($110). So the domaine bottles both grand crus, and some Sommerberg bottlings carry a further name.
   Source: the shipped wine list, entries for albert-boxler.
4. Granite crus [Codex]: "Granite crus like Brand and Sommerberg sit at the mouths of Vosges valleys, while Alsace's marl and limestone names string along the lower foothills." The answer: "Valley streams sawed through the sedimentary skin to the old crystalline rock beneath"; "a valley is where a stream has cut clean through that roof into the granite and gneiss beneath."
   Source: sommelierscodex/js/data-questions.js, c-wzuqih6d.
5. Each grand cru its own appellation [Codex]: "Fifty-one, and each is a separate AOC in its own right with its own decree setting permitted varieties, yields and minimum ripeness".
   Source: sommelierscodex/js/data-advanced.js, a-j5va0rn8.
6. The 2020 and the sweetness word [Codex]: "Since the 2021 vintage a dryness indication is compulsory on Alsace's still whites". Our Pinot Gris is a 2020, so its label need carry no such word; the pack already says "Whether this bottling carries a touch of sweetness is a question for the sommelier."
   Source: sommelierscodex/js/data-questions.js, c-ur0x5kp7; the pack, w-uwpmn81x.
7. Edelzwicker [Codex]: "Edelzwicker is the 'noble' blend term still in use"; "Edelzwicker is the freer blend term, any proportion, no separate vinification."
   Source: sommelierscodex/js/data-advanced.js, a-4b8l2ole and the record before it.
8. Another Boxler [house]: the list also carries a separate producer, Domaine Justin Boxler, region "Niedermorschwihr, Alsace": line "A family estate in Niedermorschwihr with vines in the Sommerberg grand cru."; entry "Sommerberg" Riesling 2017 ($125). No source says how, or whether, the two estates are related.
   Source: the shipped wine list, producer justin-boxler.
9. Pronunciation [house]: "Albert Boxler: al-BAIR BOX-ler; Niedermorschwihr: nee-der-MORSH-veer; Pinot Gris: PEE-noh GREE."
   Source: the pack, w-uwpmn81x.

Expert knowledge: the Brand grand cru lies at Turckheim and the Sommerberg at Niedermorschwihr and Katzenthal, both a short way west of Colmar.

Brennan's link: the Pinot Gris 2020 at $110 is the sweet spot bottle for the duck confit waffle; the list's deeper Boxler run (Brand, Sommerberg and the named Sommerberg bottlings) is for the guest who asks for grand cru Alsace.

## 3. Domaine du Pélican, Arbois (Vin Jaune 2016)

1. The family and the year [Codex]: p-dom-marquis-dangerville, holdings: "Owner of the Volnay premier cru monopole Clos des Ducs, with Taillepieds, Champans and Fremiets; biodynamic. The family also founded Domaine du Pelican in the Jura in 2012." Trap: "The family's Jura estate, Domaine du Pelican, is a separate property in Arbois". Why: "Sem d'Angerville was one of the growers who forced estate bottling and helped build the AOC framework in the 1930s".
   Source: sommelierscodex/js/data-producers.js, record p-dom-marquis-dangerville. The record writes Pelican without its accent; the domaine and our list write Pélican.
2. The wine list [house]: producer domaine-du-pelican, region "Arbois, Jura": line "The Jura estate of Marquis d'Angerville of Volnay, making Chardonnay, Savagnin, Vin Jaune and sparkling wine."; tell "Domaine du Pélican is the Jura home of the d'Angerville family from Volnay. Grand Curoulet is a precise Chardonnay; the Savagnin Ouillé is topped up and fresh; the Vin Jaune is aged under a veil of yeast, nutty and intense." Entries: "S°" Brut Jura 2020 ($165); "Grand Curoulet" Chardonnay Arbois 2018 ($145); Savagnin Ouillé Arbois 2022 ($130); Vin Jaune Arbois 2016 ($655, printed "750ml"); Arbois red 2015 ($110); "Clos Saint-Laurent" Pinot Noir Côtes du Jura 2022 ($150).
   Source: the shipped wine list, producer domaine-du-pelican and its entries.
3. Vin Jaune's rules [Codex]: "Vin Jaune requires 100% Savagnin, aged in cask sans ouillage for a minimum of six years and three months with at least sixty months under the veil, and it must be sold in the 62 cl clavelin." "Just 62 centilitres, squat and heavy-shouldered: the law reserves one bottle for the Jura's vin jaune and permits it no other." "Vin Jaune is never fortified; it finishes at ordinary table-wine strength". "The clavelin is 62 cl, said to be what remains of a liter after six years of evaporation."
   Source: sommelierscodex/js/data-master.js, m-hhh9d4tf; data-questions.js, c-pnihqi3b; data-producers.js, p-macle traps; data-primers.js (Jura primer).
4. Arbois [Codex]: "the anchor for Arbois, the region's largest appellation"; "Arbois was among the first French appellations granted in 1936"; and the two Jura idioms: "topped-up single-vineyard whites alongside classic sous voile Vin Jaune".
   Source: sommelierscodex/js/data-producers.js, record p-tissot (why, traps and style).
5. Flor and the veil [house]: "In the Jura the same thing happens to Savagnin in barrels never topped up, for more than six years, making Vin Jaune: walnut, curry spice and dried apple." The pack's card: "aged at least six years in barrel without topping up, under a veil of yeast that forms on the surface, much as fino sherry ages under flor."
   Source: components/wines.json, wine-flor; the pack, w-q4gc7twe.
6. The existing story [house]: "The same family looked beyond Burgundy to the Jura, where it founded Domaine du Pélican at Arbois, bringing Burgundian care to the Jura's own grapes and its traditions, including Vin Jaune." Built from the 4 October bottle cards, not from a search.
   Source: components/wines.json, wine-story-dangerville-pelican.
7. Service [house]: "Serve 55 to 60°F, cool but not cold, in a white Burgundy bowl; it can be opened ahead and decanted, and keeps for days once opened." Say: "Domaine du Pélican: doh-MEN doo pay-lee-KAHN; Vin Jaune: van ZHOHN; Arbois: ar-BWAH."
   Source: the pack, w-q4gc7twe.

Found in passing: the list prints the Vin Jaune at "750ml"; by item 3 a Vin Jaune can only be sold in the 62 cl clavelin, so the list's size field is almost certainly a default, and the bottle should be checked.

Brennan's link: the Vin Jaune 2016 at $655 is the celebration bottle for the turtle soup, chosen because the soup is finished with aged sherry; the Volnay Clos des Ducs 2014 on our list is the same family's Burgundy.

## 4. C.H. Berres, Ürzig (Old Vines Riesling 2022)

1. The 2022's numbers [search, earlier]: "(search: thesortingtable.com importer page for the 2022) C.H. Berres Estate Riesling Old Vines Mosel 2022 carries 20.7 g/l residual sugar at 11.5 percent alcohol and the winemaker's note calls it 'a rich and modern, semi-sweet Riesling'; the 2021 carried 18.9 g/l."
   Source: research/verified-facts.json, the Berres sweetness record, pages https://www.thesortingtable.com/wines/c-h-berres/estate-riesling-old-vines-mosel-2022/ and https://www.thesortingtable.com/wines/c-h-berres/estate-riesling-old-vines-mosel-2021/.
2. The tech sheet [search, earlier]: "Found (search: thesortingtable.com tech sheet): Berres Old Vines 2022, 11.5 percent, 6.7 g/l acidity, 20.7 g/l residual sugar, hand picked near Ürzig, four months on lees". The same pass left open "whether the Berres bottle is the Sorting Table's 'Estate Riesling Old Vines'".
   Source: research/second-pass.md, Gap 6.
3. Where [house]: producer ch-berres, region "Mosel": line "A family estate in Ürzig on the Middle Mosel, making bright, slate-grown Riesling."; tell "Berres is a family estate in Ürzig on the Mosel. The Old Vines Riesling is crisp and lightly fruity, with the stony edge slate soil gives, and it is a friendly first white for a guest who thinks Riesling is always sweet."
   Source: the shipped wine list, producer ch-berres. The tell's last clause sells an off-dry to semi-sweet wine to the guest who fears sweetness as if it were dry; see the winelistFix.
4. Ürzig's rock [Codex]: "Slate is not all one colour along the Mosel. Which village is known for weathered red slate and volcanic sandstone giving unusually spicy, exotic Riesling?" Answer Ürzig: "The Wurzgarten, the spice garden, sits on red rock rather than the blue-grey slate of Wehlen and Graach upstream. Its wines are broader and more perfumed, and they smell of the name." And: "Red slate, the Rotliegend and red Devonian, sits downriver at Erdener Pralat and Erdener Treppchen and, mixed with red volcanic sandstone and loess, at Urziger Wurzgarten: warmer soils, more exotic spice, orange peel and cinnamon rather than green apple."
   Source: sommelierscodex/js/data-intro.js, i-0rv6vij2; data-master.js, m-53pxthga.
5. The legal sweetness bands [Codex]: "Halbtrocken is capped at twelve grams of residual sugar, or eighteen where the sugar sits no more than ten grams above the total acidity"; "Feinherb is undefined and therefore covers a wider range, while lieblich and suss are the legal terms for genuinely sweet wine." Arithmetic: at 20.7 g/l of sugar the 2022 is above both halbtrocken ceilings, so it is off-dry to semi-sweet, as the winemaker says.
   Source: sommelierscodex/js/data-intro.js, i-rqe6txc4.
6. The family date, unconfirmed: "The family dates its winemaking to 1510 and presents itself as 21 generations, with Markus Berres in charge since the early 2000s" is labelled "(expert, medium)"; the claims file: "I hold this with medium confidence from memory only."
   Source: research/dossier-the-cellar.md, wine 5; research/claims.json, the C.H. Berres record. Not used as a fact; a lineup question.
7. Pronunciation [house]: "C.H. Berres: BEH-ress." The earlier pronunciation pass gave "SEE AYCH BEH-res" with "BAIR-es" as an alternative, and "Ürzig is ÜR-tsikh".
   Source: the pack, w-5luyxb98; research/gap-fill-5.md, gap5-w05.

Brennan's link: our only Riesling by the glass, $14 at breakfast, lunch and dinner, the first pick with the seafood gumbo and the duck confit waffle.

## 5. Dr. Hermann, Erden (Erdener Prälat Auslese and the Kranklei Spätlese)

1. Where [house]: producer dr-hermann, region "Erden, Mosel": line "A family estate in Erden."; tell "Dr. Hermann is a family estate in Erden on the Mosel. The Spätlese and Auslese bottles are sweeter Rieslings, lovely with spice or dessert." Entries: "Erdener Herzlei" Goldkapsel Spätlese 2021 ($110); "Erdener Prälat" Auslese 2014, 375 ml ($80); "Urziger Wurtzgarten in der Kranklei" Goldkapsel Spätlese 2018 ($95).
   Source: the shipped wine list, producer dr-hermann and its entries.
2. The 2014 Auslese [search, earlier]: "(search: b-21.com) The 2014 Dr. Hermann Erdener Prälat Riesling Auslese is a Goldkapsel picked at 124 Oechsle with 50 percent botrytis, 8 percent alcohol, 375 ml only." The same record: "No source shows Brennan's pouring it by the glass."
   Source: research/verified-facts.json, somm-pairings-11, page https://www.b-21.com/2014-Dr-Hermann-Erdener-Pralat-Riesling-Auslese-Goldkapsel/productinfo/DEHERI14EC/.
3. The Erdener Prälat [Codex]: "A cliff of red slate shelters a sliver of vineyard barely above the water at Erden, and it is reckoned the warmest pocket on the Mosel." Answer: "The Pralat lies at the foot of a sheer crag of red slate that throws the afternoon heat back onto a sliver of scree, and some of the vines standing in it are old and ungrafted. Treppchen, the little staircase, adjoins it along the same hillside and gives a firmer, later wine off cooler ground."
   Source: sommelierscodex/js/data-questions.js, c-4125cpmy.
4. Ürzig's Würzgarten [Codex]: as section 4, item 4: red slate mixed with red volcanic sandstone and loess, "more exotic spice, orange peel and cinnamon rather than green apple".
   Source: sommelierscodex/js/data-master.js, m-53pxthga.
5. The same sites, another estate [Codex]: p-dr-loosen, sub "Bernkastel", holdings "Ungrafted old-vine parcels in Erdener Pralat, Erdener Treppchen, Urziger Wurzgarten, Wehlener Sonnenuhr, Graacher Himmelreich and Bernkasteler Lay."
   Source: sommelierscodex/js/data-producers.js, record p-dr-loosen.
6. The gold capsule [house]: "Goldkapsel, gold capsule, is a German grower's signal, not a legal category. A grower bottles a richer, more concentrated selection of the same Prädikat, usually from riper or botrytised berries, and dresses it with a gold foil capsule."
   Source: components/wines.json, wine-goldkapsel. The Codex agrees for another estate: "The capsule colour system is the estate's own, not German law and not a VDP scheme" (p-markus-molitor).
7. The Kranklei [house]: "the Ürziger Würzgarten (spice garden of Ürzig) is a steep red slate vineyard, and in der Kranklei is a parcel within it; Goldkapsel (gold capsule) marks a richer selection within a Prädikat; the list spells it Urziger Wurtzgarten" (how: "knowledge, certain").
   Source: research/bottle-facts-cards-c-2026-10-04.json, bin 28461.
8. The founding and the family, unconfirmed: "The estate was set up in 1967 by Dr. Rudolf Hermann on parcels from the Loosen family (the Hermanns and the Loosens of Dr. Loosen are cousins) and is run by his son Christian" is labelled "(medium)"; the claims file records "No search... My recollection matches the claim"; on the VDP: "to the best of two recollections, not a VDP member".
   Source: research/dossier-the-cellar.md, wine 19; research/claims.json, the Weingut Dr. Hermann record. Not used; lineup questions.
9. Pronunciation [house]: "Dr. Hermann: HAIR-mahn; Auslese: OWS-lay-zuh."; "Dr. Hermann: doc-tor HAIR-mahn; Ürziger Würzgarten: URTS-ig-er VURTS-gar-ten; Kranklei: KRANK-lie; Goldkapsel: GOLT-kap-sel."; Erdener Prälat "AIR-den-er PRAY-laht".
   Source: the pack, w-lkox3rl4 and w-1j9ri89c; research/verified-facts.json, Gap 6 pronunciations.

Found in passing: the pack gives Weingut Dr. Hermann the region "Ürzig, Mosel, Germany", which is the vineyard's village; the estate is at Erden (item 1), as the pack's own card for that wine says. And the b-21.com record calls the 2014 Prälat Auslese a Goldkapsel, which neither the list nor the pack prints.

Brennan's link: the Erdener Prälat Auslese half-bottle at $80 is the only sweet wine sold à la carte and the first pick on seven plates; the Kranklei Spätlese Goldkapsel at $95 is the value bottle for the Framboise French Toast and the Lemon Tart.

## 6. Weingut Stein, Alf (Weihwasser and Palmberg-Terrassen)

1. The estate [search, earlier, mixed with knowledge]: "Weingut Stein is a small estate in Alf on the Mosel, run by Dr. Ulrich Stein, who has reclaimed steep slate vineyards; Weihwasser (holy water) comes from 60-year-old vines in the St. Aldegunder Klosterkammer near the old church in Alf, fermented in old 1000 liter casks; feinherb means off dry." How: "search 4 October 2026, astorwines.com and chambersstwines.com (Ulli Stein); knowledge".
   Source: research/bottle-facts-cards-a-2026-10-04.json, bin 22111. The record does not say which parts came from the two pages and which from knowledge, so the vine age, the cask size, the parcel and the title "Dr." are left out of the profile.
2. The pack's card [house]: "Weingut Stein is a small estate in the village of Alf on the Mosel, run by Ulrich Stein, who has spent years rescuing steep slate vineyards others abandoned. Weihwasser means holy water: the old vines grow on slate near the old church. Feinherb means just off dry, and the wine ferments in large old casks."
   Source: the pack, w-du80kehr.
3. The wine list [house]: producer stein, region "Alf, Mosel": line "A Mosel estate."; tell "Stein makes Mosel Riesling. Palmberg is a site; Trocken on the label means dry, Feinherb means off-dry." Entries: "Alfer Holle 1900" Kabinett Trocken 2023 ($140); "Palmberg" Spätlese Trocken 2022 and 2023 ($110 each); "Palmberg" Kabinett Trocken 2023 ($85) and 2024 ($100); "Weihwasser" Feinherb 2023 ($55); "Palmberg-Terrassen" Spätlese-Feinherb 2014 ($62).
   Source: the shipped wine list, producer stein and its entries.
4. Feinherb and trocken [Codex]: "Many German estates now put a word on their off-dry bottles that carries no legal meaning whatever, in preference to halbtrocken." Answer Feinherb: "Feinherb is undefined and therefore covers a wider range". And: "Trocken: ≤4 g/L, or ≤9 g/L when total acidity is within 2 g/L of the sugar; halbtrocken ≤12 g/L, or ≤18 g/L when acidity is within 10 g/L (EU 2019/33, Annex III)."
   Source: sommelierscodex/js/data-intro.js, i-rqe6txc4; data-advanced.js, a-275n65l3.
5. The Palmberg-Terrassen [house]: "Spätlese means late picked (riper than Kabinett); feinherb means off dry; aged Riesling develops a petrol note and Mosel Riesling ages for decades. The Palmberg-Terrassen is a terraced vineyard bottled by Weingut Stein." (how: "knowledge; list").
   Source: research/bottle-facts-cards-a-2026-10-04.json, bin 29362.
6. Pronunciation [house]: "Stein: shtine; Weihwasser: VY-vah-ser, holy water; Feinherb: FINE-hairb."; "Palmberg-Terrassen: PAHLM-bairg teh-RAH-sen; Spätlese: SHPATE-lay-zuh".
   Source: the pack, w-du80kehr and w-dv66g929.

Expert knowledge: Weingut Stein of Alf is not to be confused with the Würzburger Stein, a famous vineyard in Franken.

Brennan's link: two value bottles with a touch of sweetness: the Weihwasser at $55 for the seafood gumbo's spice, the Palmberg-Terrassen 2014 at $62 for the duck confit waffle.

## 7. Egon Müller, the Scharzhof, Wiltingen (Scharzhofberger Kabinett 2020)

1. The hill and the family [search, earlier]: "Egon Müller. thewineresistance.substack.com, bestofwines.com, Wikipedia (Egon Müller IV): the Scharzhofberg on the Saar belonged to a Trier monastery until the French revolutionary armies seized church land; in 1797 Jean-Jacques Koch bought it at auction, and the estate passed to the Müller family through his daughter's marriage. Scharzhofberger Riesling was served at royal courts."
   Source: research/components-wines-2026-10-05.md, search 23.
2. The Codex record [Codex]: p-egon-muller, sub "Saar, Wiltingen (Scharzhofberg)", founded "1797"; holdings: "Roughly eight hectares of the Scharzhofberg at Wiltingen, farmed from the Scharzhof itself; the family also runs the Le Gallais estate in the Wiltinger Braune Kupp." Style: "Sweet Saar Riesling of very low alcohol and very high acid, picked in repeated selective passes so that even the Kabinett carries the house transparency." Traps: "Scharzhofberger is the single vineyard; Scharzberg is the Grosslage that borrows its reputation across much of the Saar"; "The Saar is part of the Mosel region, not a separate anbaugebiet"; "Egon Müller's fame rests on sweet Prädikat wine, not on Grosses Gewächs".
   Source: sommelierscodex/js/data-producers.js, record p-egon-muller.
3. The Scharzhofberg [Codex]: "Above a single farmstead outside Wiltingen rises the slope most often called the finest ground on the Saar." Answer: "The Scharzhof stands below it and gives the site its name, and the vineyard is blue Devonian slate at an angle that makes every pass up it real work. Its wines were among the most expensive in the world before the First World War, and the reputation rests on the vintages where the Saar ripens fully, which it does not always manage."
   Source: sommelierscodex/js/data-questions.js, c-r4jj3ip7.
4. The label [Codex]: "The estate labels its wines simply Scharzhofberger and leaves the village name off, because the site is famous enough that adding it would say nothing. The Saar ripens later and far more precariously than the main Mosel valley, which is why its great years are talked about for decades."
   Source: sommelierscodex/js/data-intro.js, i-dd1frcxb.
5. The TBA [Codex]: "Which German estate's Scharzhofberger Trockenbeerenauslese is the world's most expensive regularly produced white wine?" Answer: "Egon Müller (Scharzhof, Saar)".
   Source: sommelierscodex/js/data-advanced.js, a-o4jzcpxh.
6. The wine list [house]: producer egon-muller, region "Scharzhof, Saar": line "The most famous estate of the Saar, owner of the Scharzhofberg."; tell "Egon Müller is the Saar's great name and the leading owner on the Scharzhofberg hill. The Kabinett is light and gently sweet, delicate and very rare." The line and the tell disagree: "owner" against "the leading owner".
   Source: the shipped wine list, producer egon-muller.
7. Pronunciation [house]: "Egon Müller: AY-gon MOO-ler; Scharzhofberger: SHARTZ-hof-bair-ger; Kabinett: kah-bee-NET." The component wine-story-egon-muller writes "AY-gon MEW-ler".
   Source: the pack, w-7g6cp24m; components/wines.json, wine-story-egon-muller.

Expert knowledge: the Scharzhofberg has more than one owner; other estates hold parcels and print Scharzhofberger on their labels, so the tell's "leading owner" is the right phrase.

Brennan's link: the celebration bottle for the seafood gumbo, at $395 the grandest Kabinett on our list.

## 8. Joh. Jos. Prüm, Wehlen (Kabinett 2020 and the Auslese Goldkapsel magnum)

1. The sundial and the estate [search, earlier]: "Wehlener Sonnenuhr and Joh. Jos. Prüm. visitmosel.de, winewithseth.com, K&L: Jodocus Prüm built the sundial on the Wehlen slate, grey Devonian slate, in 1842 so the vineyard workers could tell the time; the vineyard is named for it. The Joh. Jos. Prüm estate dates from 1911, when the family holdings in Wehlen were divided."
   Source: research/components-wines-2026-10-05.md, search 22.
2. The Codex record [Codex]: p-jj-prum, sub "Wehlen", founded "1911"; holdings: "Holdings in Wehlener Sonnenuhr, Graacher Himmelreich, Graacher Domprobst, Zeltinger Sonnenuhr and Bernkasteler Badstube, all on blue Devonian slate." Style: "Reductive and faintly spritzy in youth, often unapproachable for years, then turning to honey, smoke and slate over several decades." Why: "The benchmark producer for classical fruity-styled Mosel Riesling and the name attached to the Wehlener Sonnenuhr. The house is also the standard illustration of capsule colour marking selections within one Prädikat." Wines: "Wehlener Sonnenuhr Riesling Auslese", "Gold capsule and long gold capsule mark the finer selections of the same Prädikat". Traps: "Several unrelated Prüm estates exist: S.A. Prüm, Studert-Prüm and Dr. F. Weins-Prüm among them"; "The spritz and reduction in young bottles is house signature, not fault"; "Sonnenuhr means sundial and appears at Wehlen, Zeltingen and Brauneberg, so the village name carries the answer".
   Source: sommelierscodex/js/data-producers.js, record p-jj-prum.
3. Why sundials [Codex]: "They went up in the nineteenth century for pickers and pruners who were a long walk from any church clock, and the wall carrying the dial is usually the warmest stone on the slope."
   Source: sommelierscodex/js/data-questions.js, c-9zlqr0vs.
4. The slate [Codex]: "Blue-grey Devonian slate is the classic middle Mosel: Wehlener Sonnenuhr, Graacher Domprobst and Himmelreich, Zeltinger Sonnenuhr, and the wines are filigree, high-toned, taut, the green-apple and wet-stone register that made the region's name." And: "JJ Prüm's blue-slate flagship; Zeltinger Sonnenuhr adjoins."
   Source: sommelierscodex/js/data-master.js, m-53pxthga; data-advanced.js, a-b325k1zt. The earlier search said grey, the Codex blue; the Codex's own walk says blue-grey.
5. The young wines [house]: "Kabinett is the lightest German Prädikat level; J.J. Prüm Kabinett is lightly sweet and low in alcohol; young Prüm Rieslings often show a light spritz and a reductive (struck match) note that clears with air." (how: "knowledge").
   Source: research/bottle-facts-cards-a-2026-10-04.json, bin 29361.
6. The wine list [house]: producer jj-prum, region "Wehlen, Mosel": line "A legendary Wehlen estate."; tell "JJ Prüm is a legendary Mosel name. Wehlener Sonnenuhr Kabinett is light and gently sweet, and it ages beautifully." Entries: JJ Prum "Wehlener Sonnenuhr" Kabinett 2020 ($135); J.J. Prum "Wehlener Sonnenuhr" Riesling GKA Mosel 2015, 1.5 L ($615).
   Source: the shipped wine list, producer jj-prum and its entries.
7. Pronunciation and service [house]: "J.J. Prüm: YOH-han YO-sef PROOM, or simply J.J. Prüm; Wehlener Sonnenuhr: VAY-len-er ZON-en-oor; Goldkapsel: GOLT-kap-sel." The magnum: "a magnum pours about twenty."
   Source: the pack, w-pv3la1bh.

Expert knowledge: "Unrelated" in the Codex trap is stronger than any source read here supports; the other Prüm estates are separate businesses, and whether any shares the family's line was not checked. "Separate" is the safe word.

Brennan's link: the Kabinett 2020 at $135 is the sweet spot bottle for the seafood gumbo; the Auslese Goldkapsel magnum at $615 is the celebration choice for the Pineapple Tarte Tatin, about twenty small dessert pours for a big table.

## What this pass changes in the existing components

- wine-story-trimbach: what it says agrees with the sources (section 1, items 1 to 3), with one caution: "It settled in Ribeauvillé after the First World War" rests on a single search summary (section 1, item 1). Its items and card cover only the two 2007 Pinot Gris and Gewurztraminer; the house also pours Clos Sainte Hune 2007 and the Riesling Réserve 2020. A corrected third paragraph and card are offered in the JSON. Added by the verification pass: the say field writes Ribeauvillé "ree-boh-vee-YAY" where the pack writes "ree-boh-vee-LAY", and the card back's "thirteenth generation at Ribeauvillé" puts every generation at Ribeauvillé (Verification 2026-10-10, R5).
- wine-story-dangerville-pelican: stands. It could add the year the Codex gives, 2012 (section 3, item 1).
- wine-story-mosel-families: three repairs. "Its Erdener Prälat Auslese 2014 half-bottle pours by the glass with dessert" is wrong: the wine is sold only as an $80 half-bottle, and no source shows a glass pour (section 5, item 2). "C.H. Berres ... from a family with roots to 1510" and its card back rest on memory, never a search (section 4, item 6); until one confirms it, leave the date out (Verification 2026-10-10, R10, which withdrew this pass's first wording, "a family that dates its winemaking to 1510", because it still prints the date). The say field gives "BAIR-es" where the pack prints "BEH-ress".
- wine-region-mosel: "Our Mosel bottles include the Berres and Dr. Hermann by the glass" has the same fault for the Dr. Hermann; "the Berres by the glass and the Dr. Hermann half-bottle" is right.
- wine-story-egon-muller: stands (section 7, items 1 and 3); the say field and the pack disagree on Müller (MEW-ler against MOO-ler).
- wine-story-prum-sundial: "The Prüm family has been in Wehlen for centuries" has no source in the repo (section 8, item 1 supports only 1842 and 1911); a sourced sentence is offered in the JSON.
- Albert Boxler has no component of its own (wine-region-alsace names it only); a new cellar-albert-boxler is offered.

## Library agreement (sommelierscodex/js/data-producers.js)

- p-trimbach: agrees (1626, Ribeauvillé, Clos Ste Hune inside Rosacker at Hunawihr, Frédéric Emile from the Geisberg and Osterberg, the Riesling Réserve as the house wine). Its "stainless steel" was neither met nor refuted in this pass. Its wines could take the Pinot Gris Réserve Personnelle and the Gewurztraminer Vendanges Tardives, both on our list. The Codex gives the clos three slightly different sizes across three records (section 1, item 3); they agree in substance.
- p-egon-muller: two conflicts with the file's own rule. Founded "1797" is the year Jean-Jacques Koch bought the hill at auction; the Müllers came by his daughter's marriage, in a year no source read gives (section 7, item 1), so "1797" dates the purchase, not the family's estate. Holdings "Roughly eight hectares" is a hectare figure, which the header comment forbids ("ownership, hectares, a current winemaker and a recent vintage all change"). Suggested holdings: "The family's holding on the Scharzhofberg at Wiltingen, farmed from the Scharzhof below it, with a second estate, Le Gallais, in the Wiltinger Braune Kupp, bottled apart."
- p-jj-prum: agrees (1911, Wehlen, the five sites, blue Devonian slate, the spritz). Its trap's "unrelated" is stronger than any source read here; "separate" is safe (section 8, expert note).
- p-dom-marquis-dangerville: the only source for the Pélican's 2012; spells Pelican without its accent.
- New entries are offered for Albert Boxler, Domaine du Pélican, C.H. Berres, Dr. Hermann and Weingut Stein.

## Searches still owed

When search budget returns, these settle what this file leaves open:
1. Trimbach: when the house moved to Ribeauvillé; what F.E. stands for; how long the family has owned Clos Sainte Hune; the source vineyards of the Réserve Personnelle.
2. Albert Boxler: founding, the family and its generations, farming, and the style of the 2020 Pinot Gris (dry or touched with sweetness).
3. Domaine du Pélican: the founding member of the family, the cellar's village, where the vines came from, farming, the meaning of the name and of S°.
4. C.H. Berres: the 1510 date and the generations from the family's own site; whether our bottle is the importer's Estate Riesling Old Vines.
5. Dr. Hermann: founding year and founder, any family link to Dr. Loosen, VDP membership, what Herzlei is.
6. Weingut Stein: Ulrich Stein's title and story, the Weihwasser parcel, the 1900 of Alfer Holle 1900, where the Palmberg lies.
7. Egon Müller: the year of the marriage; Le Gallais.
8. Joh. Jos. Prüm: the family in Wehlen before 1842; Johann Josef Prüm.

## Verification 2026-10-10

A refutation pass read every claim in this group's profiles, the component fixes, the new component, the five library entries, the wine list fixes and the lineup questions against the records above, then tried to search independently.

Searches tried, in order: 1. "Trimbach history 1626 Jean Trimbach Riquewihr Ribeauvillé Frédéric Emile generations"; 2. "Albert Boxler Niedermorschwihr domaine Brand Sommerberg granite family history"; 3. "Domaine du Pélican d'Angerville Arbois founded 2012". Each was refused with "this turn's web search budget is used up". WebFetch of the English Wikipedia pages for Maison Trimbach, Egon Müller and Joh. Jos. Prüm failed at the egress ("getaddrinfo ENOTFOUND en.wikipedia.org"). The limit was not worked around. So nothing below is newly confirmed by a live page: each verdict rests on the repo's records, re-read for this pass, and on expert knowledge marked as such. Where a claim had neither, it was cut or turned into a lineup question.

What was re-read:
- V1. The recorded searches: research/components-wines-2026-10-05.md, searches 22 (visitmosel.de, winewithseth.com, K&L), 23 (thewineresistance.substack.com, bestofwines.com, Wikipedia, Egon Müller IV) and 38 (Wikipedia, Maison Trimbach, idealwine.net); research/verified-facts.json, records somm-program-4, somm-pairings-3, somm-pairings-11 and gap-pron-1 (thesortingtable.com pages for the Berres 2022 and 2021, the b-21.com page for the Dr. Hermann 2014, the guide's p46 for the half-bottle); research/second-pass.md, Gap 6; research/bottle-facts-cards-a-2026-10-04.json, bins 2173, 22111, 22755, 29361 and 29362. Each says what sections 1 to 8 quote.
- V2. The house: the shipped wine list's producers trimbach, albert-boxler, justin-boxler, domaine-du-pelican, ch-berres, dr-hermann, stein, egon-muller, jj-prum and hermann-ludes (Hermann Ludes: line "A Mosel grower.", one entry, a Mosel Riesling 2022 at $45, bin 297517, so the Dr. Hermann note that warns against confusing the two names a producer the list really carries), with every entry of each; the pack's fourteen wines in full, whose notes carry every Brennan's link in this file.
- V3. Names and keys: every pack string in the contract (F.E. Trimbach, Maison Trimbach, Albert Boxler, Domaine du Pélican, C.H. Berres, Dr. Hermann, Weingut Dr. Hermann, Weingut Stein, Egon Müller, Joh. Jos. Prüm) and all fourteen wine ids match the house's producer list; wine-story-trimbach, wine-story-dangerville-pelican, wine-story-mosel-families, wine-story-egon-muller and wine-story-prum-sundial exist in components/wines.json, and cellar-albert-boxler is used by no components file. None of the five library entries repeats a WINE_PRODUCERS name or id; each takes its country heading from that file's own list (the Jura goes under "France, Rhône and the Mediterranean South", as p-tissot, p-macle and p-ganevat do) and its exact field shape.

Refuted or narrowed, and how each was repaired:
- R1. Trimbach, "the house wine": the Codex calls the Riesling Réserve "the house wine", but Trimbach's range has a plainer Riesling beneath the Réserve [expert]. The profile now says only that the Réserve 2020 is our reference dry Riesling, with Cuvée Frédéric Emile and Clos Sainte Hune above it. The Codex record p-trimbach carries the same phrase; reported here, not changed.
- R2. Trimbach, "walled": the Codex question c-qzkt8t21 and the pack call Clos Sainte Hune walled; no recorded search does, and an Alsace clos need not be walled. The profile and the suggested component text now say "the family's own plot".
- R3. Trimbach, "never the cru": the sources say "traditionally" and "historically"; "never" claimed more than they do. The label note now speaks of our 2007 only, and Cuvée Frédéric Emile "has been sold" as plain Alsace, in the Codex's tense, since labels can change.
- R4. Trimbach, the dryness rule: "Alsace whites" is now "Alsace still whites", as c-ur0x5kp7 says.
- R5. wine-story-trimbach: the say field's "ree-boh-vee-YAY" turns the sounded l of Ribeauvillé into a y; the pack's "ree-boh-vee-LAY" is right [expert]. Its card back's "thirteenth generation at Ribeauvillé" is corrected to "now in its thirteenth generation, based at Ribeauvillé", since the house began at Riquewihr (section 1, item 1). "We pour four" became "Our pairings use four": the wine list carries fifteen Trimbach wines, two of them printed twice.
- R6. Albert Boxler, the rock: "the granite crus sit at the mouths of the Vosges valleys, where a stream has cut through ... down to the old crystalline rock" stretched one Codex question (c-wzuqih6d, about Brand and Sommerberg) over every granite cru. The profile now says only that both are granite, the old crystalline rock of the Vosges, where many other crus lie on limestone, marl or sandstone (the same record, and p-ostertag's Muenchberg sandstone). Library: "with dry Rieslings" is dropped from the style, since only the wine list's tell says dry; the wine "Pinot Gris" is renamed "Alsace Pinot Gris", because p-dry-river already claims the bare name and .scripts/check-producers.js skips the "who makes it" question for a bottling two estates share.
- R7. Domaine du Pélican, library: the "Clos Saint-Laurent" Pinot Noir and the Côtes du Jura holding rest on one wine list entry that no other record confirms; both are out. "Topped up" for the Grand Curoulet Chardonnay had no source (the list says "a precise Chardonnay"), so the note and the style no longer say it. "Arbois Vin Jaune" is renamed "Vin Jaune", since p-tissot already claims that bottling name.
- R8. C.H. Berres: "loess" in the Würzgarten rests on one Codex record (m-53pxthga) and no recorded search; dropped, leaving red slate and red volcanic sandstone, which p-dr-loosen also gives. "An old family estate": "old" leaned on the unconfirmed 1510; now "a family estate". The legal ceilings now carry the acidity condition exactly as a-275n65l3 states it: halbtrocken 12 g/l, or 18 when the acidity is within 10 grams of the sugar; trocken 4 g/l, or 9 within 2 grams.
- R9. wine-story-mosel-families: the first wording offered by this pass, "a family that dates its winemaking to 1510", still prints an unconfirmed date. The fix now leaves the date out, with a corrected sentence and card back in the JSON.
- R10. Dr. Hermann: "the afternoon heat" in the Prälat set a time of day only one Codex phrasing gives; now "heat". Library: "a wine printed Erdener Herzlei" pointed at a list and named a site no source explains, and "small" sized an estate no source sizes; both dropped, and the style no longer calls the whole range sweet and late-picked.
- R11. Weingut Stein: "old vines near the old church" and "ferments in large old casks" come from the 4 October card, which mixed two importer pages with knowledge and placed the vines both in the St. Aldegunder Klosterkammer and near the old church in Alf (section 6, item 1). Like the vine age and the parcel, they are now a lineup question, in the profile, the library and the lineup. Library: "around Alf ... the Palmberg and the Alfer Holle" placed a site nobody located and kept the list's spelling of Holle; now "near Alf", naming only the Palmberg and Palmberg-Terrassen labels. "On our list the two Stein wines" is now "In our pairings", since the list carries seven.
- R12. Egon Müller: "because the site needs none" gave a reason no source gives for the label without a village name; dropped. "The most expensive white wine regularly made anywhere" became "among the most expensive white wines in the world", the measure the records support (search 23; a-o4jzcpxh). "The most sought-after Riesling estate in Germany" is an opinion and now says "perhaps".
- R13. Joh. Jos. Prüm: "far from any church clock" carried a Codex generalisation about sundials (c-9zlqr0vs) onto Wehlen; dropped. "Holds ... Bernkasteler Badstube" became "bottles", since Badstube names a group of Bernkastel sites rather than one vineyard [expert]. "Sonnenuhr also names vineyards at Zeltingen and Brauneberg" now adds "among others": Brauneberg's is the Juffer-Sonnenuhr, and the word appears in other Mosel site names too [expert].

Stood after the check, unchanged: Trimbach's 1626, Jean Trimbach, Riquewihr and thirteen generations (search 38); Clos Sainte Hune in the Rosacker at Hunawihr on limestone and dolomite and Frédéric Emile from the Geisberg and Osterberg (Codex, and expert knowledge agrees); the Vendanges Tardives minimum of 257 g/l for Gewurztraminer (Codex); the initials F.E. for Frédéric Emile Trimbach (expert, certain). Boxler at Niedermorschwihr with the Brand and the Sommerberg, both granite; fifty-one grand crus; Justin Boxler a separate producer on the list. The Pélican's 2012 and the d'Angerville family (Codex); Sem d'Angerville in the 1930s; Arbois in 1936; the Vin Jaune rules. The Berres numbers (importer). The Dr. Hermann 2014 numbers (b-21.com); the Prälat, the Treppchen, the Kranklei and Dr. Loosen in the same sites. Ulrich Stein, called Ulli, dated to the importer pages of 4 October 2026. Egon Müller's Trier monastery, the 1797 auction to Jean-Jacques Koch, the daughter's marriage and the royal courts (search 23). Prüm's 1911 division and Jodocus Prüm's sundial of 1842 (search 22). The four wine list fixes and the Trimbach, Dr. Hermann notes on the list's producer names.

Added to the searches still owed: whether Clos Sainte Hune is walled; whether a Clos Saint-Laurent Pinot Noir is the Pélican's; how the Weihwasser is grown and made; whether the Codex's "loess" at Ürzig stands.
