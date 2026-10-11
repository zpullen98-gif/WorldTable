# Producers in the cellar: the Right Bank of Bordeaux (10 October 2026)

## Method

No web search ran in this pass. One WebSearch call was tried first, in standard mode on 10 October 2026, with the query "Château Lassègue Saint-Émilion history Jackson family Pierre Seillan Les Cadrans". The harness refused it before it reached a search engine: "Web search was not performed: this turn's web search budget is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)." WebFetch was tried once, on the page that mattered most for the least documented producer in the group, the English Wikipedia article on Château Lassègue (https://en.wikipedia.org/wiki/Ch%C3%A2teau_Lass%C3%A8gue), and it failed at the network egress: "getaddrinfo ENOTFOUND en.wikipedia.org". The harness asks that the limit not be worked around, so no other route was tried. The name Pierre Seillan in the refused query is a recollection that the search was meant to test; it was not confirmed and appears in no profile.

Every fact below therefore comes from a source already in the repositories, quoted exactly with its path. There are five kinds:

1. The Codex library, sommelierscodex/js/data-producers.js, whose header says the corpus "was authored one wine region at a time" and each region "then read back by a SECOND pass whose only instruction was to refute it". With it, the Codex's question banks and primers, which carry producer facts in their answers and explanations: sommelierscodex/js/data-intro.js, js/data-questions.js, js/data-advanced.js, js/data-master.js, js/data-primers.js, js/data-primers-advanced.js, js/data-primers-master.js and js/reference.js. This is the app's own checked reference, not web evidence gathered today.
2. Earlier research that did search the web: research/bottle-facts-cards-b-2026-10-04.json, whose cards for Les Cadrans de Lassègue, Château Bellegrave and Clos L'Église name their searches (thewinecellarinsider.com, wineanorak.com, wine.com, millesima.com, weygandtmetzler.com). The cards there for Cheval Blanc and Pétrus, and the cards in research/bottle-facts-cards-c-2026-10-04.json for Trotanoy, Château-Figeac and Canon, are marked "producer knowledge, certain" or "knowledge, certain": they were not searched, and they are labelled so here.
3. The shipped wine list, static/shared/packs/brennans-new-orleans.winelist.v1.json: its producer lines and tells, and its entries, the bottles themselves as read on the Binwise list on 3 October 2026, with the paste of that list at tools/house/brennans/pages/binwise-wine-list-2026-10-03.txt. An entry proves only that a bottle is on the list under that name.
4. The pack, static/shared/packs/brennans-new-orleans.v1.oothouse.json: the nine wines of these nine producers, with their origin, profile, serve and service fields and their Tell me about it cards; the house guide, tools/house/brennans/guide.txt; and the existing components in tools/house/brennans/components/wines.json.
5. The master review of 4 October, research/master-review-2026-10-04.md, for the house's Birth Year story.

The profiles keep to those sources. A founding year, a person or a relation that only memory supplies is left out, except the expert knowledge lines named in each section, which hold nothing I am unsure of. This group should be re-run with search when the budget allows; the lineup questions in the JSON carry what a search, or the sommelier, must settle. Where a quoted passage carried a dash, it is written here with a comma and marked "(dash replaced)". Quoted passages keep their source's spelling.

What could not be confirmed, and is therefore left out of every profile or turned into a lineup question:
- The founding year of every estate in the group. The Codex prints none for Cheval Blanc, Pétrus, Trotanoy, Figeac or Canon, and holds no record for the other four. The only dated beginnings used are acquisitions and separations the sources date: Cheval Blanc's land separated from Figeac in 1832 (the Codex), Jean Bouldy's purchase of Bellegrave in 1951 and Sylviane Garcin-Cathiard's of Clos L'Église in 1997 (research of 4 October), the Wertheimer purchase of Canon in 1996 (the Codex), and the first vintage of Les Cadrans de Lassègue in 2008 (research of 4 October).
- Whether Château Lassègue holds Grand Cru Classé rank. The wine list says so and prints the words on the second wine; nothing reachable confirms the château's rank, and the pack itself sends the question to the sommelier. Also unconfirmed: when Jackson Family Wines bought the estate, who makes the wine, and the commune within Saint-Émilion where it lies.
- Anything of Château Troplong Mondot's history: who founded it, where the double name comes from, who owns and runs it today, the name of any second wine, when it was first ranked a premier grand cru, and whether the estate writes its name with a hyphen (the Binwise list does, the pack does not).
- When the Moueix family came to Trotanoy, and therefore whether they made the 1946. The profile says it is a Moueix property by the research of October 2026, and never that they made our bottle.
- Who owns Pétrus and Cheval Blanc today. The Codex gives Pétrus as "long run by the Moueix family" and "distributed by the Moueix house of Libourne"; no present owner is named for either.
- Who ran Château-Figeac, Château Canon and Château Trotanoy in 1946, and the blend of the three 1946 bottles. The Codex's "roughly a third each" for Figeac describes the estate's vineyard as it records it, not a 1946 bottle.
- The origin of the names Canon and Troplong Mondot, the Gallo-Roman story sometimes told of Figeac, and the year Figeac began to write its name with a hyphen.
- What the 1946 labels of Figeac and Canon actually print, given the first Saint-Émilion classification came in 1955.
- How the 1980 vintage is regarded at Pétrus. Nothing reachable characterises it, so it is a lineup question.
- Whether the bottle the list prints as "Le Petit Cheval Blanc 1er Grand Cru Classé A 2012" is Le Petit Cheval, the red second wine the Codex names.
- The organic certification on the Bellegrave 2019 and Clos L'Église 2019 labels.
- Hectares, scores and current prices are not stated as present facts anywhere below. The Codex's "Around forty hectares" for Cheval Blanc and Figeac and "About eleven hectares" for Pétrus (with "~11.5 ha" in its own Advanced bank) are recorded as the Codex's undated claims and are not used. List prices are the Binwise list of 3 October 2026.

Built on, and checked against: components/wines.json (keys wine-region-right-bank, wine-grape-merlot, wine-grape-cabernet-franc, wine-grape-cabernet-sauvignon, wine-half-bottles and wine-decanting, the ones that name Troplong Mondot, the only producer of this group any component names); components/dishes.json (story-founding-1946, for the year Brennan's opened); research/bottle-facts-cards-b-2026-10-04.json and bottle-facts-cards-c-2026-10-04.json; research/bottle-selection-2026-10-04.json; research/winelist/producers-b.json and producers-c.json; research/master-review-2026-10-04.md and master-review-somm-2026-10-04.md; research/components-wines-2026-10-05.md; research/dossier-the-cellar.md; research/producers-cellar-bordeaux-left-2026-10-10.md and research/producers-cellar-red-burgundy-2026-10-10.md with its contract JSON (for format); the wine list file (producer lines, tells and entries); the Binwise paste (the Birth Year page); guide.txt (the anniversary line); the pack (the nine wines in full); and the Codex library (header comment, the France, Bordeaux and the South West group, and the entries p-ch-cheval-blanc, p-petrus, p-ch-trotanoy, p-ch-figeac, p-ch-canon, p-ch-angelus, p-ch-ausone, p-ch-pavie, p-ch-leglise-clinet, p-ch-la-conseillante, p-ch-lafleur, p-vieux-chateau-certan, p-ch-le-tertre-roteboeuf, p-ch-rauzan-segla and p-dominus-estate). The Codex holds no record for Château Lassègue, Château Bellegrave, Clos L'Église or Château Troplong Mondot.

What the house prints (the pack's wines for these producers, with their ids):
- Château Lassègue: Les Cadrans de Lassègue Saint-Émilion Grand Cru 2021, $60, bin 28352, a Bordeaux anchor at the gentlest price on the Bordeaux pages (w-qv76ehtx).
- Château Bellegrave: Pomerol 2019, $190, bin 26111, a Bordeaux anchor in the sweet spot (w-p4vku3eb).
- Clos L’Église: Pomerol 2019, $325, bin 25623, a Bordeaux anchor above the sweet spot (w-7o6juia9); the list also prints a 2006 at $420 (bin 21363).
- Château Cheval Blanc: Saint-Émilion 1er Grand Cru Classé A 2008, $1450, bin 288242 (w-ypxq3tia); the list prints ten vintages from 1990 at $4000 to 2020 at $1975.
- Pétrus: Pomerol 1980, $7700, bin 21131 (w-4capyhmx); the list also prints a 1989 at $14000 (bin 32684).
- Château Trotanoy: Pomerol 1946, $3700, bin 27345, one of four Selections from our Birth Year (w-ifeuldxp).
- Château-Figeac: Saint-Émilion Premier Grand Cru Classé 1946, $3200, bin 27362, one of four Selections from our Birth Year (w-h4dmq6ms).
- Château Canon: Saint-Émilion Premier Grand Cru Classé 1946, $3100, bin 27346, one of four Selections from our Birth Year (w-ahurh184).
- Château Troplong Mondot: Saint-Émilion Premier Grand Cru Classé 2020 in a 375 ml half-bottle, $175, bin 32933, the half-bottle for the Creole-Spiced Hanger Steak at lunch (w-9fxnmc52); the list also prints the 2020 in 750 ml at $280 (bin 25471).

The searches: none ran. The one refused query is named above; the one WebFetch failed.

## 1. Château Lassègue, Saint-Émilion (Les Cadrans de Lassègue Saint-Émilion Grand Cru 2021)

1. Who, what and how it is made, searched on 4 October: "Les Cadrans de Lassègue is the second wine of Château Lassègue in Saint-Émilion, owned by Jackson Family Wines, first made in 2008; the name comes from the sundials on the château's front. It is mainly Merlot and Cabernet Franc, from younger vines and the foothill blocks, aged six to eight months in 30 to 40 percent new French oak."
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Les Cadrans card (entry 2432), "how": "search: thewinecellarinsider.com Lassègue profile, wineanorak.com on the 2020, wine.com product notes". The oak percentage is a range for the wine in general, not a fact of the 2021, and is written below only as "part of it new".
2. The bin clash, from the same card: "Bin 28352 is printed twice: Les Cadrans de Lassegue Grand Cru Classé 2021 at $60 (entry 2432, paste line 12577) and Château L'Évangile 2015 at $800 (entry 2394, paste line 12385)."
   Source: the same card; confirmed in the wine list file, entries 2394 and 2432.
3. The wine list's line: "A Saint-Émilion Grand Cru Classé; Les Cadrans de Lassègue is its second wine." Its tell: "Les Cadrans de Lassègue is the second wine of Château Lassègue. Soft, friendly Saint-Émilion at a gentle price." Its entry: "Les Cadrans de Lassegue Grand Cru Classé", 2021, $60, 750ml, under France ~ Bordeaux ~ Red ~ Saint-Émilion.
   Source: the wine list file, producer chateau-lassegue and entry 2432.
4. The pack: "The second wine of Château Lassègue in Saint-Émilion, owned by Jackson Family Wines; the name comes from the sundials on the château's front, and it draws on younger vines and the lower slopes." Its profile: "Merlot with Cabernet Franc from Saint-Émilion, the second wine of Château Lassègue: red cherry, plum and a little spice, soft, refined tannin and a fresh finish, ready to drink young." Its guest answer on the rank: "It is Saint-Émilion Grand Cru; whether the classé rank on our list applies to this second wine is a question for the sommelier." Its why: "A Bordeaux anchor at the gentlest price on the Bordeaux pages".
   Source: the pack, w-qv76ehtx (origin, profile, why, What do guests ask).
5. What the words on the label mean, from the Codex: "Saint-Émilion Grand Cru on the label is an appellation, not a classification rank" and "Classification in Saint-Émilion is applied for, not automatic".
   Source: sommelierscodex/js/data-producers.js, p-ch-le-tertre-roteboeuf, traps. And from p-ch-canon, traps: "Premier Grand Cru Classé B is a rank; Saint-Émilion Grand Cru on its own is an appellation, not a classification". And the Codex's Master bank: the classification "classifies the château rather than the land, estates must apply to be considered, and rank can be lost" (js/data-master.js, m-4sioe6n3).
6. Right Bank softness, from the pack's Tell me about it: "Right Bank Bordeaux is softer than the Médoc." And its selling line: "When a guest wants more structure, step up to La Chapelle de Meyney."
   Source: the pack, w-qv76ehtx, kept answers.

Expert knowledge: Lassègue is said lah-SEG and Cadrans kah-DRAHN, as the pack prints them; cadran is the French word for a dial, the face of a sundial. Jackson Family Wines is a California wine company. A second wine is the château's own wine from younger vines and from the lots that do not go into the grand vin, made by the same team.

Not confirmed: the château's own classification rank; when Jackson Family Wines came to the estate and who makes the wine; the commune within Saint-Émilion; whether the 2021 label prints Grand Cru Classé as the list does. The refused query's Pierre Seillan is recollection and is used nowhere.

Brennan's link: our gentlest priced Bordeaux, the soft Right Bank claret for roast chicken, pork, a lunch steak or a burger at the bar.

## 2. Château Bellegrave, Pomerol (Pomerol 2019)

1. Who, where, the farming and the blend, searched on 4 October: "Château Bellegrave in Pomerol was bought by Jean Bouldy in 1951 and is run by the third generation, Jean-Marie Bouldy and family; about 8.5 hectares in the southwest of the appellation on clay and gravel, converted to organic farming with ECOCERT certification in 2009; about 75 percent Merlot and 25 percent Cabernet Franc."
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Bellegrave card (entry 2374), "how": "search: millesima.com and the importer page at weygandtmetzler.com". The hectares are undated and are not used; the blend is written below as "about three parts Merlot to one of Cabernet Franc".
2. The appellation: "Pomerol has never had a classification of its châteaux."
   Source: the same card, "how": "appellation knowledge, certain"; and the Codex, p-petrus, traps: "Pétrus is unclassified: Pomerol has no classification".
3. The wine list's line: "A small Pomerol estate making supple Merlot led wine." Its tell: "Bellegrave is a Pomerol, so expect soft, plummy Merlot. A gentle price for the appellation." Its entry: "Château Bellegrave", 2019, $190, 750ml, bin 26111, under France ~ Bordeaux ~ Red ~ Pomerol.
   Source: the wine list file, producer chateau-bellegrave and entry 2374.
4. The pack: "A family estate in the southwest of Pomerol, owned by the Bouldy family since 1951 and farmed organically." Its profile: "Merlot with Cabernet Franc from a small organic Pomerol estate, seven years old: black cherry, blackcurrant and plum, cocoa and violet, plush and supple with a fresh, cedary finish." Its watch note: "Do not confuse it with Bellegrave estates elsewhere in Bordeaux; ours is the Pomerol. Pétrus and Clos L'Église share the Pomerol page at much higher prices, so read the bin." Its guest answer on organics: "The estate is farmed organically; certification on this bottle is a question I will put to the sommelier." Its pairing: "Duck, lamb and beef in gentler sauces: the Roasted Rohan Duck Breast, the Chateaubriand for a guest who wants softness, and roast pork."
   Source: the pack, w-p4vku3eb (origin, profile, pairs, kept answers).

Expert knowledge: Bellegrave is said bel-GRAHV and Pomerol pom-uh-ROLL, as the pack prints them. In the Bordeaux dialect of French a grave is gravel, the word the Graves region is named for, so the name reads as "beautiful gravel"; no source here says that is how the estate got its name, and no profile says so.

Not confirmed: the estate's history before 1951; whether the 2019 label carries the organic certification.

Brennan's link: the way into Pomerol on our list, the Merlot lover's bottle and a partner for the duck.

## 3. Clos L’Église, Pomerol (Pomerol 2019)

1. Who, the farming and the oak, searched on 4 October: "Clos L'Église is a small Pomerol estate (about 5.8 hectares) bought in 1997 by Sylviane Garcin-Cathiard and run by her family; farmed organically, Merlot with Cabernet Franc, aged sixteen to twenty-four months in new French oak."
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Clos L'Église card (entry 2401), "how": "search: thewinecellarinsider.com Clos L'Église guide and millesima.com". The hectares are undated and are not used.
2. The bottles and the name clash, from the same card: "The list prints Clos L'Église 2006 at $420 (bin 21363) and 2019 at $325 (bin 25623). Château L'Église-Clinet is a separate Pomerol estate." Marked "how": "catalogue entries 2400, 2401; producer knowledge".
3. Three names, from the Codex: "Clos L'Eglise, L'Eglise-Clinet and Domaine de l'Eglise are three different Pomerol properties".
   Source: sommelierscodex/js/data-producers.js, p-ch-leglise-clinet, traps.
4. The wine list's line: "A small Pomerol estate on the plateau making rich Merlot led wine." Its tell: "Clos l'Église is a small Pomerol estate. Rich, plummy Merlot. A good choice for duck." Its entries: "Clos L'Eglise", 2006, $420, bin 21363, and "Clos L'Église", 2019, $325, bin 25623. L'Église-Clinet is printed at $600 (2014) and $675 (2017).
   Source: the wine list file, producer clos-l-eglise and entries 2390, 2391, 2400 and 2401.
5. The pack: "A small estate on the Pomerol plateau, bought in 1997 by Sylviane Garcin-Cathiard and run by her family, farmed organically and aged in new French oak." Its profile: "Merlot with Cabernet Franc from a small, organically farmed Pomerol estate, seven years old: black cherry, plum and mocha, violet and spice, rich, polished and long, still young." Its serve: "Decant an hour ahead." Its guest answer on Pétrus: "Same village and the same grape, Merlot, at a fraction of the price; Pétrus is on the list too."
   Source: the pack, w-7o6juia9 (origin, profile, serve, kept answers).

Expert knowledge: Clos L'Église is said kloh lay-GLEEZ, as the pack prints it. In French a clos is a walled or enclosed vineyard and l'église is the church. No source here says which church the name refers to or places the estate beside any other, so no profile names a neighbour.

Not confirmed: the estate's history before 1997; whether the 2019 label carries an organic certification; whether both vintages are in the cellar.

Brennan's link: the serious Pomerol between Bellegrave and the grand names, for duck, lamb and the Chateaubriand.

## 4. Château Cheval Blanc, Saint-Émilion (Saint-Émilion 1er Grand Cru Classé A 2008)

1. The Codex record: sub "Premier Grand Cru Classé A until it withdrew before the 2022 revision"; holdings "Around forty hectares of gravel, sand and clay in the far north west of Saint-Émilion, hard against Pomerol; the land was separated from Figeac in 1832." The hectares are not used.
   Source: sommelierscodex/js/data-producers.js, p-ch-cheval-blanc (sub, holdings).
2. The style: "Exotic and floral rather than stony: violets, red plum, sweet spice and satin tannin, softer and more open than Ausone." Tasting tag: "Floral, exotic spice, satin tannin: Cabernet Franc's world summit".
   Source: the same record, style and t.
3. Why it matters: "The estate that breaks two Right Bank rules at once: gravel soil where limestone is expected, and Cabernet Franc where Merlot is expected. Its 2022 withdrawal is the live classification question."
   Source: the same record, why.
4. The wines and the traps: "Château Cheval Blanc", grape "Cabernet Franc and Merlot in near-equal parts", note "The high-water mark for Cabernet Franc anywhere"; "Le Petit Cheval", "The second wine". Traps: "Cheval Blanc was carved out of Figeac land in 1832: they are neighbours, not one estate"; "It withdrew from the classification ahead of the 2022 revision, along with Ausone and Angélus"; "Its gravel soils are shared with Figeac and are not typical of Saint-Émilion".
   Source: the same record, wines and traps.
5. The withdrawal, in the Codex's Master bank: "Ahead of the 2022 revision, Ausone and Cheval Blanc announced in 2021 that they would not enter, objecting that the criteria weighted reputation, marketing, tourism and communication alongside the wine in the glass; Angélus withdrew soon after. That removed three of the four Premier Grand Cru Classé A estates." And: "The 2006 edition was annulled after litigation from demoted properties."
   Source: sommelierscodex/js/data-master.js, m-4sioe6n3.
6. The original top rank: "Ausone and Cheval Blanc held the top rank alone for decades before the category was widened, and the membership has moved since."
   Source: sommelierscodex/js/data-intro.js, i-uou6q4yl. And js/data-questions.js, c-v46nukpw: "Ausone and Cheval Blanc held the top rank of the Saint-Emilion classification alone for decades. In the 2012 revision, which two estates were raised to join them?", answer "Angelus and Pavie".
7. The grape: "Cheval Blanc's Saint-Emilion vineyard carries far more Cabernet Franc than its neighbours, which is much of what makes its style distinctive." And, on the local name: "Around Saint-Emilion, Cabernet Franc goes by a local name that older growers still use in conversation", answer "Bouchet", with "Cheval Blanc's plantings were traditionally described in those terms".
   Source: sommelierscodex/js/data-intro.js, i-cszl7jrg; js/data-questions.js (the Bouchet question).
8. Cheval des Andes, in the Codex: "Partner with Château Cheval Blanc in Cheval des Andes." And on the wine list: "A partnership in Mendoza between Château Cheval Blanc and Terrazas de los Andes." Entry: "Cheval des Andes Malbec Blend Mendoza", 2022, $240.
   Source: sommelierscodex/js/data-producers.js, p-terrazas-de-los-andes, holdings; the wine list file, producer cheval-des-andes and entry 3474.
9. The card of 4 October: "Château Cheval Blanc is in Saint-Émilion on the border with Pomerol, Cabernet Franc-led with Merlot; it was ranked Premier Grand Cru Classé A in the Saint-Émilion classification that applied to the 2008 vintage, and withdrew from the classification before its 2022 revision." Marked "how": "producer knowledge, certain".
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Cheval Blanc card (entry 2416).
10. The wine list's line: "The great Saint-Émilion estate, rich in Cabernet Franc, which stood at the top of the classification until it withdrew in 2022; Le Petit Cheval is its second wine." Its tell: "Cheval Blanc is one of the world's great wines, unusual for its high share of Cabernet Franc. Le Petit Cheval is the second wine. Decant." Its entries: ten vintages, 1990 ($4000), 1996, 2004, 2006, 2007, 2008 ($1450, bin 288242), 2017, 2018, 2019 and 2020 ($1975); and "Le Petit Cheval Blanc 1er Grand Cru Classé A", 2012, $620, bin 25244, filed under France ~ Bordeaux ~ Red ~ Saint-Émilion.
    Source: the wine list file, producer chateau-cheval-blanc and entries 2411 to 2420 and 2431. The line's "withdrew in 2022" disagrees in its year with item 5, which dates the announcement to 2021, ahead of the 2022 revision: see the wine list fixes below.
11. The pack: "Saint-Émilion's most famous estate, on the border with Pomerol, ranked Premier Grand Cru Classé A when this vintage was made and known for a blend led by Cabernet Franc." Its profile: "Cabernet Franc with Merlot from Saint-Émilion's most famous estate, on the Pomerol border, eighteen years old: red and black fruit, violet, mint and spice, silky, fresh and very long." Its watch note: "Its current classification has changed since this vintage; say what the label says and send any question about it to the sommelier."
    Source: the pack, w-ypxq3tia (origin, profile, kept answers).

Expert knowledge: Cheval Blanc is said shuh-VAL BLAHN, as the pack prints it, and the name means white horse. The 1947 Cheval Blanc is among the most celebrated Bordeaux of the twentieth century. In the 2004 film Sideways, the wine lover Miles, who scorns Merlot, treasures a 1961 Cheval Blanc and finally drinks it from a takeaway cup in a fast food restaurant; guests mention it, and the joke is that Cheval Blanc is built on Cabernet Franc and Merlot.

Not confirmed: who owns and runs the estate today; whether the bottle the list prints as Le Petit Cheval Blanc 2012 is Le Petit Cheval, the red second wine, or another wine (a recollection of a white wine under a similar name was not searched and is used nowhere).

Brennan's link: the Right Bank legend on our list, for duck, lamb or veal and a guest who prefers silk to power.

## 5. Pétrus, Pomerol (Pomerol 1980)

1. The Codex record: sub "Unclassified, as all of Pomerol is"; holdings "About eleven hectares on the buttonhole of blue clay at the high point of the Pomerol plateau, distributed by the Moueix house of Libourne." The hectares are not used.
   Source: sommelierscodex/js/data-producers.js, p-petrus (sub, holdings).
2. The style and why: "Merlot at maximum depth without weight: truffle, dark plum, iron and a mid-palate that seems to have no end." Tag: "Blue-clay Merlot: truffle, plum velvet, endless mid-palate". Why: "The proof that classification and price are unrelated. Pomerol has never been classified, so the appellation's most famous wine carries no rank at all."
   Source: the same record, style, t and why.
3. The wine and the traps: "Pétrus", grape "Merlot, effectively the whole blend", note "The single vineyard of Merlot on the blue clay at the high point of the plateau". Traps: "Pétrus is unclassified: Pomerol has no classification"; "The label reads Pétrus alone, without the word Château"; "The blue clay is a small outcrop, not the soil of the whole plateau".
   Source: the same record, wines and traps.
4. The Moueix family and the clay, in the Advanced bank: "Which Pomerol estate, long run by the Moueix family, commands the appellation's highest prices from ~11.5 ha of blue clay?", answer "Pétrus", explanation "Near-pure Merlot on the boutonnière of smectite clay; no classification exists in Pomerol."
   Source: sommelierscodex/js/data-advanced.js, a-7egsj8r5. Its hectares disagree a little with item 1 and are not used; "commands the appellation's highest prices" is a price claim and is not used.
5. The twin vintages: "1989 and 1990, back-to-back hot, opulent vintages (Pétrus' pair among the century's greatest)" (dash replaced). Explanation: "both rich, '89 more structured at Pétrus by most tellings."
   Source: sommelierscodex/js/data-master.js, m-rcoxf6qb.
6. The icons, in the primers: "Pomerol (no classification; Pétrus, Le Pin)" and "Right Bank icons (Pétrus, Cheval Blanc, Ausone)".
   Source: sommelierscodex/js/data-primers.js.
7. The card of 4 October: "Pétrus is a small estate on a plateau of clay in Pomerol, almost entirely Merlot, made in small quantities; Pomerol has never had a classification. Very old bottles vary with cork and storage and are opened with care, often with a two-pronged cork puller." Marked "how": "producer knowledge and service practice, certain". And: "The list prints Pétrus 1980 at $7700 (bin 21131) and 1989 at $14000 (bin 32684); Château La Fleur-Pétrus 2006, 2007 and 2011 (entries 2387 to 2389, $400 to $630) is a separate Pomerol estate."
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Pétrus card (entry 2402).
8. La Fleur-Pétrus and Lafleur, in the Codex: "Lafleur is not related to La Fleur-Pétrus, a separate Moueix property". On the wine list: La Fleur-Pétrus, "A Pomerol estate of the Moueix family, near Pétrus, making silky, fine Merlot"; Lafleur, "A tiny, revered Pomerol estate of the Guinaudeau family".
   Source: sommelierscodex/js/data-producers.js, p-ch-lafleur, traps; the wine list file, producers chateau-la-fleur-petrus and chateau-lafleur.
9. The wine list's line: "The most famous wine of Pomerol, almost entirely Merlot from blue clay, among the most prized wines in the world." Its tell: "Pétrus is the most famous Pomerol, almost all Merlot from a blue clay plateau. A trophy bottle; involve the sommelier." Its entries: 1980, $7700, bin 21131; 1989, $14000, bin 32684.
   Source: the wine list file, producer petrus and entries 2402 and 2403.
10. The pack: "You do not sell a Pétrus 1980; you recognize the collector who asks for it and serve it well. Confirm the vintage, bring the sommelier at once, and suggest a simple course beside it." Its serve: "Stand upright well ahead; the sommelier opens it, often with an old-cork tool, and decants it off its sediment just before pouring." Its say: "Pétrus: pay-TROOS."
    Source: the pack, w-4capyhmx (serve, say, kept answers).

Expert knowledge: Petrus is Latin for Peter, and the Pétrus label carries a portrait of Saint Peter holding the keys of heaven.

Not confirmed: who owns Pétrus today and whether the Codex's "distributed by the Moueix house of Libourne" still describes how it is sold; the history of its owners before the Moueix family; how the 1980 vintage is regarded at Pétrus.

Brennan's link: the collector's bottle on the Pomerol page, opened by the sommelier, with a simple course or none.

## 6. Château Trotanoy, Pomerol (Château Trotanoy Pomerol 1946)

1. The Codex record: sub "Unclassified"; holdings "Clay over gravel on the western slope of the Pomerol plateau, a Moueix property, the name said to come from trop ennui, the difficulty of working the soil."
   Source: sommelierscodex/js/data-producers.js, p-ch-trotanoy (sub, holdings).
2. The style and why: "Dark, dense and mineral: black plum, truffle and wet stone, firmer and more brooding than most of the plateau." Tag: "Black plum, truffle and wet stone: Pomerol's darker half". Why: "The standard second name after Pétrus when an examiner asks what else the Moueix house makes in Pomerol."
   Source: the same record, style, t and why.
3. The wine and the traps: "Château Trotanoy", grape "Merlot with a little Cabernet Franc", note "Long regarded as the closest thing to Pétrus in the Moueix stable". Traps: "Moueix distributes or owns several Pomerol estates: ownership and distribution are not the same relationship"; "Trotanoy is unclassified, like everything in Pomerol".
   Source: the same record, wines and traps.
4. The card of 4 October: "Château Trotanoy is a small estate in Pomerol on the Right Bank of Bordeaux, owned by the Moueix family (Établissements Jean-Pierre Moueix, Libourne); the wine is mostly Merlot with Cabernet Franc; Pomerol has no official classification." And: "Christian Moueix of the same family created Dominus Estate in Napa (Yountville)." Both marked "how": "knowledge, certain".
   Source: research/bottle-facts-cards-c-2026-10-04.json, the Trotanoy card (entry 3515).
5. Dominus, in the Codex: "Christian Moueix of Pomerol brought a Right Bank name into Napa in 1983, and the wine is the standing example of a European hand in California. The single vineyard, Napanook, is the fact examiners want." On the wine list: "Christian Moueix's Napa estate near Yountville, making a refined, Bordeaux minded Cabernet blend." Entries: Dominus Estate Napa Valley 2001, $480, and 2014, $495.
   Source: sommelierscodex/js/data-producers.js, p-dominus-estate, why; the wine list file, producer dominus and entries 2833 and 2834.
6. The 1956 frost, in the Codex: "The February 1956 frost is the pivot of modern Right Bank history" and "The 1956 frost devastated Pomerol and Saint-Émilion and forced mass replanting".
   Source: sommelierscodex/js/data-producers.js, p-ch-leglise-clinet (why and traps). A 1946 wine was necessarily made from vines that stood before that frost.
7. The wine list's line: "A Pomerol estate of the Moueix family, making powerful, deep Merlot." Its tell: "Trotanoy is a Moueix Pomerol, powerful and deep. A great choice for a Pomerol lover." Its entries: "Château Trotanoy", 1946, $3700, bin 27345, under France ~ Bordeaux ~ Red ~ Pomerol, and "Château Trotanoy Pomerol", 1946, $3700, bin 27345, under Selections from our Birth Year ~ Wine.
   Source: the wine list file, producer chateau-trotanoy and entries 2398 and 3515; the Binwise paste, pages/binwise-wine-list-2026-10-03.txt, the page headed "Selections from our Birth Year".
8. The pack: "Château Trotanoy is a small estate in Pomerol on the Right Bank of Bordeaux, owned by the Moueix family, the Libourne merchants whose name also stands behind Dominus in Napa." Its watch note: "It is printed twice, under Birth Year and in the Bordeaux pages, both bin 27345 at $3700: one bottle. Never call it a first growth or a grand cru; Pomerol has no classification." Its serve: "stand the bottle upright a day ahead, ease out an old cork with a two-prong opener, and decant only to leave the sediment, just before pouring. A Coravin is never used on a cork this old." Its say: "Trotanoy: troh-tah-NWAH".
   Source: the pack, w-ifeuldxp (origin, serve, say, kept answers).
9. The year: "Brennan’s opened in 1946 (at 417 Royal Street since 1956) and celebrates 80 years in 2026, with anniversary tasting menus through the year." The master review added the must-know "Bottles from 1946, the year we opened" and called the four 1946 Bordeaux "the best wine story of the 80th year".
   Source: tools/house/brennans/guide.txt (the 80th anniversary line); research/master-review-2026-10-04.md.

Expert knowledge: trop ennui is French for too much trouble or weariness; the Codex's gloss, the difficulty of working the soil, is the one used.

Not confirmed: when the Moueix family came to Trotanoy, so whether they made the 1946; the level and cork of our bottle.

Brennan's link: the only Pomerol among our four Birth Year bottles, Merlot led (the softness once claimed here was refuted in the verification below).

## 7. Château-Figeac, Saint-Émilion (Saint-Émilion Premier Grand Cru Classé 1946)

1. The Codex record: sub "Premier Grand Cru Classé A (promoted 2022)"; holdings "Around forty hectares on the same gravel rise as Cheval Blanc in the north west of the appellation; the Cheval Blanc vineyard was sold out of Figeac in 1832." The hectares are not used.
   Source: sommelierscodex/js/data-producers.js, p-ch-figeac (sub, holdings).
2. The style and why: "Cool, cedary and structured: blackcurrant leaf, graphite and tobacco, closer to a Médoc classed growth than to plateau Merlot." Tag: "Blackcurrant leaf and graphite: the Médoc accent on Right Bank gravel". Why: "Promoted to Premier Grand Cru Classé A in 2022. Its one third Cabernet Sauvignon is the single most useful fact for separating it from every other Saint-Émilion."
   Source: the same record, style, t and why.
3. The wines and the traps: "Château Figeac", grape "Roughly a third each Cabernet Sauvignon, Cabernet Franc and Merlot", note "The only major Saint-Émilion with that much Cabernet Sauvignon"; "Petit-Figeac", "The second wine". Traps: "Figeac and Cheval Blanc share gravel and a history but are different estates"; "Figeac is the Right Bank estate with a major Cabernet Sauvignon share"; "Figeac joined the A rank only in 2022, alongside Pavie".
   Source: the same record, wines and traps.
4. The 2022 revision: "How many estates were classified Premier Grand Cru Classé 'A' in the 2022 Saint-Émilion revision, and name one of them.", answer "Two: Pavie and Figeac (Ausone, Cheval Blanc and Angélus had withdrawn)". And the primers: "2022 left Pavie and Figeac as 'A' after Ausone, Cheval Blanc and Angélus withdrew" (js/data-primers-master.js, dash replaced) and "Saint-Émilion reclassifies roughly each decade (2022: Pavie and Figeac as 'A' after Ausone, Cheval Blanc and Angélus withdrew). Pomerol has no classification at all." (js/data-primers-advanced.js).
   Source: sommelierscodex/js/data-advanced.js, a-9wiu9fp1, and the two primers named.
5. The first classification: "Saint-Émilion (classified 1955, revised roughly each decade: Ausone, Cheval Blanc at the top historically)".
   Source: sommelierscodex/js/data-primers.js (the Right Bank line).
6. The card of 4 October: "Château-Figeac is in Saint-Émilion on the Right Bank, on gravel soils beside Château Cheval Blanc near the Pomerol border; it grows a large share of Cabernet Sauvignon and Cabernet Franc with Merlot, unusual in Saint-Émilion; it was long run by the Manoncourt family." And: "In the 2022 Saint-Émilion classification Château-Figeac was raised to Premier Grand Cru Classé A; the Binwise list prints Premier Grand Cru Classé B. The first Saint-Émilion classification was made in 1955." Both marked "how": "knowledge, certain".
   Source: research/bottle-facts-cards-c-2026-10-04.json, the Figeac card (entry 3517).
7. The wine list's line: "A Saint-Émilion estate on gravel, unusually rich in Cabernet, promoted to premier grand cru classé A in 2022." Its tell: "Figeac is unusual in Saint-Émilion for its high share of Cabernet. It was promoted to the top rank in 2022. Fine and long lived." Its entries: "Château Figeac 1er Grand Cru Classé B", 1946, $3200, bin 27362, under France ~ Bordeaux ~ Red ~ Saint-Émilion, with 2003, 2012, 2014, 2017 and 2018; and "Château-Figeac Saint-Émilion 1er Grand Cru Classé B", 1946, $3200, bin 27362, under Selections from our Birth Year ~ Wine.
   Source: the wine list file, producer chateau-figeac and entries 2421 to 2426 and 3517; the Binwise paste, the Birth Year page, which prints the hyphenated "Château-Figeac".
8. The pack: "Château-Figeac sits on gravel beside Cheval Blanc on the Pomerol side of Saint-Émilion; long run by the Manoncourt family, it was raised to the very top rank, Premier Grand Cru Classé A, in the 2022 classification." Its guest answer: "Asked: Was it ranked in 1946? Answer: The Saint-Émilion classification came later, in 1955; I will let the sommelier tell the story." Its watch note: "The list prints B after the rank; Figeac was raised to A in 2022, so ask the sommelier how to say it. Château-Figeac is not the same as the many Figeac names nearby." Its say: "Figeac: fee-ZHAK".
   Source: the pack, w-h4dmq6ms (origin, say, kept answers).
9. The 1956 frost, as in section 6, item 6: "The 1956 frost devastated Pomerol and Saint-Émilion and forced mass replanting".
   Source: sommelierscodex/js/data-producers.js, p-ch-leglise-clinet, traps.

Expert knowledge: the estate writes its name with a hyphen, Château-Figeac, as the Binwise Birth Year page and the pack print it; the Codex and the Binwise Saint-Émilion page print Château Figeac. Both mean the one estate.

Not confirmed: who ran Figeac in 1946 and the blend of that vintage; what the 1946 label prints; the date of the hyphen; any story of the name's origin.

Brennan's link: the Saint-Émilion among our Birth Year bottles, with Cabernet in its heart.

## 8. Château Canon, Saint-Émilion (Saint-Émilion Premier Grand Cru Classé 1946)

1. The Codex record: sub "Premier Grand Cru Classé B"; holdings "A walled vineyard on the limestone plateau just west of the town, with quarry cellars beneath; bought by the Wertheimer family of Chanel in 1996, who also own Rauzan-Ségla."
   Source: sommelierscodex/js/data-producers.js, p-ch-canon (sub, holdings).
2. The style and why: "Chalky and precise: red cherry, orange peel and fine dry tannin, with the salty lift that limestone gives." Tag: "Red cherry, orange peel, chalk dust: the plateau in a glass". Why: "The teaching wine for limestone plateau Saint-Émilion, and a reminder that the B rank holds most of the appellation's serious names."
   Source: the same record, style, t and why.
3. The wines and the traps: "Château Canon", grape "Merlot with Cabernet Franc", note "The clearest statement of the Saint-Émilion limestone plateau"; "Clos Canon", "The second wine". Traps: "Château Canon is not Canon-la-Gaffelière, a different estate under different ownership"; "Premier Grand Cru Classé B is a rank; Saint-Émilion Grand Cru on its own is an appellation, not a classification".
   Source: the same record, wines and traps.
4. Rauzan-Ségla, in the Codex: "Parcels around the village of Margaux, bought in 1994 by the Wertheimer family of Chanel, who also own Château Canon in Saint-Émilion." Trap: "Same ownership as Château Canon in Saint-Émilion". On the wine list: "A Margaux second growth owned by the owners of Chanel, making fragrant, refined Margaux; Ségla is its second wine." Entries: Château Rauzan-Ségla 2ème Cru Classé 2002, $330; Ségla 2005, $480.
   Source: sommelierscodex/js/data-producers.js, p-ch-rauzan-segla; the wine list file, producer chateau-rauzan-segla and entries 2352 and 2355.
5. The card of 4 October: "Château Canon is in Saint-Émilion on the limestone plateau at the edge of the town; it has been owned by the Wertheimer family (owners of Chanel) since 1996; the wine is Merlot with Cabernet Franc. Château Canon-la-Gaffelière is a different estate." Marked "how": "knowledge, certain". And: "Château Canon 1946 is also printed in the Saint-Émilion pages at bin 27346 and $3100 (catalogue entry 2408); the list also prints Canon 2001 at $700 (bin 26343) and 2006 at $380 (bin 26112)."
   Source: research/bottle-facts-cards-c-2026-10-04.json, the Canon card (entry 3516).
6. The wine list's line: "A Saint-Émilion premier grand cru classé on the limestone plateau, owned by the family behind Chanel, making fine, fresh wine." Its tell: "Canon is a premier grand cru on the limestone plateau, owned by the family behind Chanel. Fine, fragrant and fresh." Its entries: "Château Canon 1er Grand Cru Classé B" 1946, 2001 and 2006, and "Château Canon Saint-Émilion 1er Grand Cru Classé B", 1946, under Selections from our Birth Year ~ Wine.
   Source: the wine list file, producer chateau-canon and entries 2408 to 2410 and 3516.
7. The pack: "Château Canon sits on the limestone plateau at the edge of the town of Saint-Émilion; it has belonged since 1996 to the Wertheimer family, the owners of Chanel." Its why: "One of our four Birth Year bottles from 1946, the year Brennan’s opened, and the gentlest priced of the four". Its profile: "At eighty years expect a pale brick color and a fine, fragile wine: dried cherry, rose petal, mushroom and a chalky freshness." Its say: "Canon: kah-NOHN".
   Source: the pack, w-ahurh184 (origin, why, profile, say).
8. The first classification and the frost, as in section 7, items 5 and 9: "classified 1955" and "The 1956 frost devastated Pomerol and Saint-Émilion and forced mass replanting".
   Source: sommelierscodex/js/data-primers.js; js/data-producers.js, p-ch-leglise-clinet.

Expert knowledge: none beyond the pronunciation the pack prints.

Not confirmed: the origin of the name Canon; who owned and made the wine in 1946; what the 1946 label prints; the level and cork of our bottle.

Brennan's link: the gentlest priced of our four Birth Year bottles, Saint-Émilion from the limestone beside the town.

## 9. Château Troplong Mondot, Saint-Émilion (Saint-Émilion Premier Grand Cru Classé 2020, half-bottle)

1. The wine list's line: "A Saint-Émilion premier grand cru classé on a high point of the appellation." Its tell: "Troplong-Mondot sits on one of the highest points in Saint-Émilion. The half bottle is a lovely treat for two." Its entries: "Château Troplong-Mondot Saint-Émilion 1er Grand Cru Classé B", 2020, $175, 375ml, bin 32933, under Half-bottles ~ Red ~ France; "Château Troplong-Mondot 1er Grand Cru Classé B", 2020, $175, 375ml, bin 32933, and 2020, $280, 750ml, bin 25471, under France ~ Bordeaux ~ Red ~ Saint-Émilion.
   Source: the wine list file, producer chateau-troplong-mondot and entries 78, 2429 and 2430.
2. The component: "Our bottle is Château Troplong Mondot, on one of the highest points of the Saint-Émilion plateau, in a half-bottle from 2020. Offer it to a guest who wants red Bordeaux that is generous and soft." And: "Saint-Émilion has its own classification, revised about every ten years, unlike the fixed 1855 list." Its sources line reads "expert knowledge" and the cards of 4 October.
   Source: components/wines.json, wine-region-right-bank (explain).
3. The pack: "Château Troplong Mondot sits on one of the highest points of the Saint-Émilion plateau on Bordeaux’s Right Bank." Its profile: "Saint-Émilion from Troplong Mondot, Merlot-led with Cabernet Franc and Cabernet Sauvignon: plum, black cherry, cocoa and a fresh, limestone edge, plush but structured, with fine tannin." Its service note: "The half-bottle for the Creole-Spiced Hanger Steak (lunch). The list prints it as 1er Grand Cru Classé B." Its guest answer: "What does Premier Grand Cru Classé mean? It is the top tier of the Saint-Émilion classification; the list prints Troplong Mondot that way." Its watch note: "Do not confuse the lunch Creole-Spiced Hanger Steak with the dinner Creole hanger steak, which has its own half." Its say: "Troplong Mondot: troh-LOHN mohn-DOH; Saint-Émilion: san tay-mee-LYOHN."
   Source: the pack, w-9fxnmc52 (origin, profile, serviceNote, say, kept answers).
4. The classification frame: "Saint-Émilion (classified 1955, revised roughly each decade: Ausone, Cheval Blanc at the top historically)"; the B rank, "a reminder that the B rank holds most of the appellation's serious names"; and "Premier Grand Cru Classé B is a rank; Saint-Émilion Grand Cru on its own is an appellation, not a classification".
   Source: sommelierscodex/js/data-primers.js; js/data-producers.js, p-ch-canon (why and traps).
5. The Codex names Troplong Mondot only as a wrong option in an Intro question: "Which two chateaux were the original Premier Grand Cru Classe A?", options including "Pavie and Troplong Mondot", answer "Ausone and Cheval Blanc". That is no fact about the estate and is not used as one.
   Source: sommelierscodex/js/data-intro.js, i-uou6q4yl.
6. The earlier record: research/components-wines-2026-10-05.md lists Troplong Mondot among the producers whose facts come from "The pack's wine cards and the 4 October research files"; no searched card for it exists in research/bottle-facts-cards-a, b or c.

Expert knowledge: none beyond the pronunciation the pack prints. The two spellings, Troplong Mondot (the pack) and Troplong-Mondot (the Binwise list), name the one estate.

Not confirmed: everything of the estate's history, as listed in the method: founder, the origin of the double name, owners past and present, the second wine, the date of its promotion, and which spelling the estate uses.

Brennan's link: a grand Right Bank red sized for two, the half-bottle for the Creole-Spiced Hanger Steak at lunch.

## 10. The Right Bank frame, shared by the sections above

1. Pomerol: "Pomerol has never classified anything" (js/data-primers-master.js); "Pomerol has no classification at all" (js/data-primers-advanced.js); "Petrus sits on Pomerol's clay plateau and is made almost entirely from Merlot. Pomerol is tiny and has no classification at all." (js/data-intro.js, i-7npgnyc9).
2. Saint-Émilion's classification: first made in 1955 and revised roughly each decade (js/data-primers.js); "it classifies the château rather than the land, estates must apply to be considered, and rank can be lost"; the 2006 edition was annulled; in 2012 Angélus and Pavie were raised to A; in 2022 Figeac joined Pavie at A after Ausone, Cheval Blanc and Angélus withdrew (js/data-master.js, m-4sioe6n3; js/data-questions.js, c-v46nukpw; js/data-advanced.js, a-9wiu9fp1).
3. The 1956 frost: "The 1956 frost devastated Pomerol and Saint-Émilion and forced mass replanting" (js/data-producers.js, p-ch-leglise-clinet). The Advanced bank adds: "The frost killed a third of Bordeaux's vines; replanting favored Merlot." (js/data-advanced.js, a-cuwwn5vl). That count is the Codex's and is not used in any profile.
4. The Birth Year page of the Binwise list prints four 1946 bottles: Château Latour Pauillac 1er Cru Classé ($4100, bin 27340), Château Trotanoy Pomerol ($3700, bin 27345), Château Canon Saint-Émilion 1er Grand Cru Classé B ($3100, bin 27346) and Château-Figeac Saint-Émilion 1er Grand Cru Classé B ($3200, bin 27362). Château Latour is profiled with the Left Bank (research/producers-cellar-bordeaux-left-2026-10-10.md, section 10).
   Source: pages/binwise-wine-list-2026-10-03.txt, the page headed "Selections from our Birth Year"; research/bottle-facts-cards-c-2026-10-04.json, the Latour card: "Brennan’s opened in 1946; the Binwise list files four 1946 bottles under Selections from our Birth Year".
5. Old bottle service, from the card of 4 October: "Very old wine: each bottle varies with its storage and cork; it is stood upright, opened with a two-prong (ah-so) opener when the cork is fragile, and decanted only to leave the sediment just before serving; a Coravin needle is not used through an old cork." Marked "trade practice, certain".
   Source: research/bottle-facts-cards-c-2026-10-04.json, the Latour card.

Expert knowledge: a 1946 red Bordeaux was harvested in the autumn of 1946 and spent its first years in barrel, so it was bottled later, not in 1946. The pack's lines "bottled the year Brennan’s opened" (w-ifeuldxp, w-h4dmq6ms and w-ahurh184, the guest, profile and s10 or s20 lines) should read "from the 1946 harvest" or "from the year Brennan’s opened"; the profiles here say it that way.

Names as the profiles print them, with the curly apostrophe: Clos L’Église, Château L’Église-Clinet, Domaine de l’Église, Château L’Évangile, Brennan’s.

## What this pass changes in the existing components

No existing component tells the story of any producer in this group. Only one names one of them in its explain: wine-region-right-bank, a region component, which says Troplong Mondot is "on one of the highest points of the Saint-Émilion plateau" and that Saint-Émilion's classification is "revised about every ten years, unlike the fixed 1855 list". Both agree with the wine list's tell and the Codex primers, so it stands. Outside the components, the pack's three 1946 Right Bank wines say "bottled the year Brennan’s opened"; see the expert line at the end of section 10 for the corrected wording. The grape, oak, decanting and half-bottle components list the Troplong Mondot half among their items without saying anything of the estate. The other eight producers appear in no component. Each of the nine therefore gets a new story component (cellar-lassegue, cellar-bellegrave, cellar-clos-leglise, cellar-cheval-blanc, cellar-petrus, cellar-trotanoy, cellar-figeac, cellar-canon and cellar-troplong-mondot), and no fixExisting is needed.

## Library agreement (sommelierscodex/js/data-producers.js)

- p-ch-cheval-blanc: the profile agrees with it (gravel on the Pomerol border, the 1832 separation from Figeac, Cabernet Franc in near-equal parts with Merlot, Le Petit Cheval, the withdrawal before the 2022 revision). Its "Around forty hectares" is a volatile figure its own header says to leave out; the profile does not use it.
- p-petrus: the profile agrees with it (blue clay at the high point of the plateau, effectively all Merlot, unclassified, the label without Château). Its "About eleven hectares" disagrees slightly with the Advanced bank's "~11.5 ha" and is volatile; neither is used. Its "distributed by the Moueix house of Libourne" is kept as the Codex's wording, with "long run by the Moueix family" from the Advanced bank; who owns and sells Pétrus today is not confirmed here.
- p-ch-trotanoy: the profile agrees with it (clay over gravel on the western slope, a Moueix property, the trop ennui story told as "said to", Merlot with a little Cabernet Franc, unclassified). It is silent on when the Moueix family came to the estate, which matters for our 1946; the lineup asks.
- p-ch-figeac: the profile agrees with it (the gravel rise shared with Cheval Blanc, 1832, a third each of the three grapes, Petit-Figeac, A in 2022). Its "Around forty hectares" is not used. The record prints Château Figeac; the estate and the Birth Year page print Château-Figeac. Not an error, but a trap worth adding: "The estate writes its name Château-Figeac, with a hyphen, to set it apart from the many neighbouring names that include Figeac".
- p-ch-canon: the profile agrees with it (the walled plateau vineyard west of the town, quarry cellars, the Wertheimer purchase in 1996, Clos Canon, not Canon-la-Gaffelière, the B rank). Nothing wrong.
- No record exists for Château Lassègue, Château Bellegrave, Clos L'Église or Château Troplong Mondot; the contract JSON proposes one for each, in the file's voice, with the founding year empty, no hectares and no present owner.

## Wine list fixes

- Château Cheval Blanc: the line says it "stood at the top of the classification until it withdrew in 2022". The Codex dates the announcement to 2021, ahead of the 2022 revision (section 4, item 5), and its own record says "until it withdrew before the 2022 revision". Corrected line: "The great Saint-Émilion estate, rich in Cabernet Franc, which stood at the top of the classification until it withdrew ahead of the 2022 revision; Le Petit Cheval is its second wine."
- Château Lassègue: the line calls the estate "A Saint-Émilion Grand Cru Classé". No source reachable here confirms the château's rank, and the second wine on our list is labelled Saint-Émilion Grand Cru, an appellation (section 1, items 3 to 5). Corrected line, keeping only what is sourced: "A Saint-Émilion estate whose second wine, Les Cadrans de Lassègue, is a soft, Merlot led Saint-Émilion Grand Cru named for the sundials on the château." The tell stands.
- The others stand: Bellegrave, Clos l'Église, Pétrus, Trotanoy, Figeac, Canon and Troplong-Mondot say nothing the sources contradict.

## Pronunciations (the pack's, expert knowledge)

Lassègue lah-SEG; Cadrans kah-DRAHN; Bellegrave bel-GRAHV; Clos L'Église kloh lay-GLEEZ; Cheval Blanc shuh-VAL BLAHN; Pétrus pay-TROOS; Trotanoy troh-tah-NWAH; Figeac fee-ZHAK; Canon kah-NOHN; Troplong Mondot troh-LOHN mohn-DOH; Pomerol pom-uh-ROLL; Saint-Émilion san tay-mee-LYOHN.

## Verification 2026-10-10

A second pass read every field of the contract JSON (history, facts, notes, sayIt, newComponent explain and card, the four library entries and the two wine list fixes) with one instruction: refute it, hunting the four shapes, a plausible number, neighbour, owner and relation.

The searches: none ran in this pass either. One WebSearch was tried on 10 October 2026 ("Château Lassègue Saint-Émilion Grand Cru Classé Jackson Seillan Les Cadrans de Lassègue sundials first vintage") and the harness refused it before it reached a search engine: "this turn's web search budget is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)". One WebFetch of https://en.wikipedia.org/wiki/Ch%C3%A2teau_Lass%C3%A8gue failed at the network egress ("getaddrinfo ENOTFOUND en.wikipedia.org"). No other route was tried. Every check below is therefore against the repository sources, re-read at their paths, and where the sources are silent the claim was removed or left as a lineup question rather than kept on recollection.

Sources re-read for this pass:
- research/bottle-facts-cards-b-2026-10-04.json, entries 2432 (Les Cadrans de Lassègue), 2374 (Bellegrave), 2401 (Clos L'Église), 2416 (Cheval Blanc) and 2402 (Pétrus): every quotation in sections 1 to 5 matches the file word for word.
- research/bottle-facts-cards-c-2026-10-04.json, entries 3514 to 3517 (the four Birth Year bottles): the quotations in sections 6 to 8 and 10 match.
- sommelierscodex/js/data-producers.js, records p-ch-cheval-blanc, p-ch-figeac, p-ch-canon, p-ch-trotanoy, p-petrus, p-ch-leglise-clinet and p-ch-lafleur: the quotations match. No record exists for Château Lassègue, Château Bellegrave, Clos L'Église or Château Troplong Mondot, and none of the proposed ids (p-ch-lassegue, p-ch-bellegrave, p-clos-leglise, p-ch-troplong-mondot) or wine names is taken. The heading "France, Bordeaux and the South West" is one of the file's ten.
- static/shared/packs/brennans-new-orleans.v1.oothouse.json, the nine wines w-qv76ehtx, w-p4vku3eb, w-7o6juia9, w-ypxq3tia, w-4capyhmx, w-ifeuldxp, w-h4dmq6ms, w-ahurh184 and w-9fxnmc52: the ids and producer strings match scratchpad cellar-producers.json; the Bellegrave pour reads "decanted thirty to forty-five minutes ahead"; the Troplong Mondot sell line names "a Bordeaux lover at dinner with the filet".
- static/shared/packs/brennans-new-orleans.winelist.v1.json, producers chateau-lassegue, chateau-cheval-blanc and the other seven: the lines and tells are as quoted in sections 1 to 9.
- tools/house/brennans/components/*.json: no cellar- key in this group collides with an existing key, and no existing component tells any of these producers' stories, so componentKey stays null for all nine.

Refuted or repaired, by shape:
1. Cheval Blanc, a plausible NUMBER: the profile said the estate "leads with Cabernet Franc". The only searched or checked sources say "Cabernet Franc and Merlot in near-equal parts" (the Codex record) and "far more Cabernet Franc than its neighbours" (js/data-intro.js, i-cszl7jrg); the card's "Cabernet Franc-led" is marked producer knowledge and was never searched. History and facts now say near-equal parts, and the who line says "famous for its share of Cabernet Franc".
2. Cheval Blanc, an unsourced claim about the label: "Our 2008 was made when it was ranked A, and the label says so". Nothing here has read the 2008 label; the words "1er Grand Cru Classé A" are the Binwise list's. Both places now say "as our list prints it".
3. Pétrus, a plausible RELATION: the profile kept the Codex's "distributed by the Moueix house of Libourne" as a fact, and called the Moueix family "the name that also stands behind Trotanoy, La Fleur-Pétrus and Dominus" in a way a guest could hear as one owner. How Pétrus is sold today is volatile and unsearched, and the Codex's own Trotanoy trap says "ownership and distribution are not the same relationship". The distribution clause is removed; the history now says the Moueix name also stands behind those estates and that a family name is not one owner.
4. Château Canon, a plausible NEIGHBOUR of names: the profile named Clos Canon as the second wine on the Codex alone. A recollection that the estate has also used the name Croix Canon for its second wine could not be searched, so neither name is stated: the second wine is removed from the history and facts. The Codex record p-ch-canon should be checked by search on this point; it is not changed here.
5. Trotanoy, an unsourced comparison: "the softest and most Merlot led of the four" contradicts the Codex style line ("firmer and more brooding than most of the plateau"), and the blends of the 1946 bottles are not on record. The note now says only "the only Pomerol among our 1946 Birth Year bottles, Merlot led".
6. Bellegrave, a plausible NUMBER: "decanted half an hour ahead" did not match the pack's "thirty to forty-five minutes ahead". Corrected.
7. Owners stated without the warning the contract asks for: Bellegrave (the Bouldy family), Clos L'Église (the Garcin-Cathiard family), Trotanoy (the Moueix family) and Canon (the Wertheimer family) now each carry "by the research of October 2026" and a note that owners can change.
8. Library entries, volatile facts: Clos L'Église's holdings dropped the undated "farmed organically"; Bellegrave's wine note dropped "organically farmed" (its holdings keep the dated ECOCERT certification of 2009). Purchases dated in the past (Bouldy 1951, Garcin-Cathiard 1997) stay, as the Codex keeps "bought by the Wertheimer family of Chanel in 1996".

Checked and standing: Les Cadrans de Lassègue as the second wine, first made in 2008, the sundials, the Jackson Family Wines ownership dated to the search of 4 October, the oak written only as "part of it new"; Bellegrave bought by Jean Bouldy in 1951, the third generation, the south west of Pomerol, clay and gravel, ECOCERT in 2009, about three parts Merlot to one of Cabernet Franc; Clos L'Église bought by Sylviane Garcin-Cathiard in 1997, sixteen to twenty-four months in new French oak, the three L'Église names; Cheval Blanc and Figeac separated in 1832, Bouchet, Le Petit Cheval, Ausone and Cheval Blanc alone at A for decades, Angélus and Pavie raised in 2012, the 2021 announcement ahead of the 2022 revision, Cheval des Andes with Terrazas de los Andes; Pétrus unclassified, blue clay outcrop, the label without Château, the 1989 and 1990 pair; Trotanoy on clay over gravel on the western slope, the trop ennui story told as "said to", Dominus in 1983; Figeac's third each, Petit-Figeac, the Manoncourt family, A in 2022 beside Pavie, the first classification in 1955; Canon's walled plateau vineyard, the Wertheimer purchase of 1996, Rauzan-Ségla, not Canon-la-Gaffelière, the B rank; Troplong Mondot on one of the highest points of the plateau, Merlot led with both Cabernets. The expert knowledge lines (the 1947 Cheval Blanc, Sideways and its 1961, Saint Peter on the Pétrus label) are well known and stand as written. Both wine list fixes stand: the Cheval Blanc line's year (the announcement came in 2021, ahead of the 2022 revision) and the Lassègue line's unconfirmed rank.

Recollections this pass could not test, used nowhere and left for a search or the sommelier: the year the Moueix family acquired Trotanoy (a date in the 1950s is remembered, not confirmed), whether Château Lassègue entered the Grand Cru Classé tier in a recent revision, whether a white wine sold as Le Petit Cheval Blanc began after 2012 (which would make the list's 2012 the red Le Petit Cheval), the origin of the Troplong Mondot name and its second wine. Each stays a lineup question in the JSON.
