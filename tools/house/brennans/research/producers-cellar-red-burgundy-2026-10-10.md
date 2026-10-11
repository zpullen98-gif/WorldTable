# Producers in the cellar: red Burgundy (10 October 2026)

## Method

No web search ran in this pass. Three WebSearch calls were attempted first, standard mode, on 10 October 2026 (Domaine Robert et Damien Martin at Davayé and its founding; Domaine Henri Gouges and its history; Faiveley and its founding), and each was refused by the harness before it reached a search engine: "Web search was not performed: this turn's web search budget is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)." WebFetch was tried once, on the page that mattered most for the least settled fact in the group, the Gouges founding year (https://www.gouges.com/), and failed at the network egress ("getaddrinfo ENOTFOUND www.gouges.com"). The harness asks that the limit not be worked around, so no other route was tried.

Every fact below therefore comes from a source already in the repositories, quoted exactly with its path. There are four kinds:

1. The Codex library, sommelierscodex/js/data-producers.js, whose header says the corpus "was authored one wine region at a time" and each region "then read back by a SECOND pass whose only instruction was to refute it", with sommelierscodex/js/data-advanced.js, js/data-intro.js, js/data-primers.js and sommelierscodex/CONTENT-FIXES.md. This is the app's own checked reference, not web evidence gathered today.
2. Earlier research that did search the web: research/verified-facts.json (record gap-pron-2), research/second-pass.md (Gap 6) and research/bottle-facts-cards-b-2026-10-04.json, whose facts name their searches (gouges.com, ahdvintners.com, insideburgundy.com, timelesswines.com, handpickedselections.com, cellartracker.com, vivino.com). Facts in those files marked "trade knowledge" or "knowledge" were not searched either, and are labelled so here.
3. The shipped wine list, static/shared/packs/brennans-new-orleans.winelist.v1.json: its producer lines and tells, and its entries, the bottles themselves as read on the Binwise list on 3 October 2026. An entry proves only that a bottle is on the list under that name.
4. The pack, static/shared/packs/brennans-new-orleans.v1.oothouse.json: the ten wines of these eight producers, with their origin, profile and serve fields and their Tell me about it cards.

The profiles keep to those sources. A founding year, a person or a relation that only memory supplies is left out, except the few expert knowledge lines named in each section, which hold nothing I am unsure of. This group should be re-run with search when the budget allows; the lineup questions in the JSON carry what a search, or the sommelier, must settle. Where a quoted passage carried a dash, it is written here with a comma or a colon and marked.

What could not be confirmed, and is therefore left out of every profile or turned into a lineup question:
- The founding year of Domaine Henri Gouges. The Codex prints 1925; nothing reachable in this pass confirmed it, and I am not sure of it, so the profile leaves founded empty and the lineup asks. The Codex's own rule: "a founding year nobody is sure of is worse than no founding year". The Codex's 1825 for Faiveley, 1880 for Drouhin and 1924 for Roumier are used, because each agrees with what I know with certainty; they remain the Codex's dates, not a search made today.
- Anything of Domaine Tollot-Beaut's history: who founded it, when, how the Tollot and Beaut names joined, and who runs it now. The profile says only what the wine list and the earlier cards say: a family domaine in Chorey-lès-Beaune, ripe and generous reds, and the bottles it makes.
- Whether the Faiveley Bourgogne Rouge 2022 comes from the domaine's own vines or from bought fruit; the Codex says the house "bottles both estate wines and negociant wines under one house name".
- Where the grapes for the Damien Martin Bourgogne Pinot Noir grow; the component's "near Pouilly-Fuissé" for Davayé, since no source in the repositories places Davayé beside a neighbour; and the domaine's size today (the earlier search's "about 20 ha" is undated and is not used).
- Who leads each domaine today, beyond three dated or attributed lines: Mathilde Grivot since 2017 (research of 4 October 2026), Grégory and Antoine Gouges as the fourth generation (the same research, from gouges.com), and Erwan Faiveley since 2005 (the Codex). Christophe Roumier is named by the wine list and the Codex without a date. No source names who runs Marquis d'Angerville, Joseph Drouhin or Tollot-Beaut today.
- The year Roumier came to own the Clos de la Bussière, the year d'Angerville turned biodynamic, the year Gouges turned organic, the year the white Pinot mutation was found at Gouges and the year Drouhin first owned part of the Clos des Mouches.
- How Mathilde Grivot is related to Étienne Grivot; the component says only "the next generation of the family", and so do the profiles.
- A pronunciation source for any of the eight names. The respellings are the pack's own and the components', marked expert knowledge.
- Hectares, scores, prices and current ownership are not stated as present facts anywhere below; where a source gives them they are recorded as that source's undated claim.

Built on, and checked against: components/wines.json (keys wine-story-damien-martin, wine-story-dangerville-pelican, wine-story-cote-de-nuits-families, wine-story-cote-de-beaune-families, wine-monopole-clos, wine-region-nuits-saint-georges, wine-region-vosne-romanee, wine-region-bourgogne, wine-region-maconnais, wine-organic-biodynamic and wine-burgundy-tiers, the ones that name these producers); research/verified-facts.json; research/second-pass.md; research/bottle-facts-cards-a-2026-10-04.json and bottle-facts-cards-b-2026-10-04.json; research/dossier-the-cellar.md (the Damien Martin section); research/gap-fill-5.md and gap-fill-7.md (the earlier Damien Martin doubt); research/master-review-somm-2026-10-04.md and master-review-2026-10-04.md; research/components-wines-2026-10-05.md; research/menus-pasted-diff-2026-10-03.md; the wine list file (producer lines, tells and entries); the pack (the ten wines in full); research/producers-cellar-white-burgundy-cote-2026-10-10.md and its contract JSON (for format); and the Codex library (header comment, the France, Burgundy and Beaujolais group, and the entries p-dom-henri-gouges, p-maison-faiveley, p-dom-jean-grivot, p-dom-georges-roumier, p-dom-marquis-dangerville, p-maison-joseph-drouhin, p-domaine-drouhin-oregon, the Eyrie record and p-dom-jf-mugnier). The Codex holds no record for Tollot-Beaut or for Damien Martin.

What the house prints (the pack's wines for these producers, with their ids):
- Damien Martin: Bourgogne Pinot Noir 2023 by the glass, $18 on the current menu (the Binwise list prints $17), under Light reds, Pinot Noir; the first pick for the Blackened Tofu (w-y0ihoyc7).
- Domaine Henri Gouges: Nuits-Saint-Georges 2021, 375 ml half-bottle, $130, bin 32844, the half-bottle for the Roasted Rohan duck breast (w-zxu9f2du); Les Pruliers Nuits-Saint-Georges Premier Cru 2016, $245, bin 25571, the sweet spot bottle for the duck (w-64x4h6hs).
- Domaine Faiveley: Bourgogne Rouge 2022, $90, bin 22651, the value bottle for the duck, also printed under Selections Under $100 (w-hzb9h1a4).
- Domaine Jean Grivot: Les Charmois Nuits-Saint-Georges 2013, $138, bin 23374, the sweet spot bottle for the Blackened Tofu (w-jixeyrd6); Echézeaux Grand Cru 2011, $450, bin 26764, the celebration bottle for the duck (w-bv44j8jo).
- Domaine Tollot-Beaut: Les Lavières Savigny-lès-Beaune Premier Cru 2019, $175, bin 24761, the sweet spot bottle for the Eggs Owen (w-cs4huhpa).
- Domaine Joseph Drouhin: Clos des Mouches Beaune Premier Cru 2015, $245, bin 27151, a red Burgundy anchor (w-c1zkvrly).
- Domaine Georges Roumier: Clos de la Bussière Morey-Saint-Denis Premier Cru 2014, $320, bin 287142, the celebration bottle for the Blackened Tofu (w-3mrvqhqq).
- Marquis d'Angerville: Clos des Ducs Volnay Premier Cru 2014, $380, bin 34351, the celebration bottle for the Eggs Owen (w-oyajc1so).

The searches: none ran. The three refused queries are named above; the one WebFetch failed.

## 1. Damien Martin (Domaine Robert et Damien Martin), Davayé, Mâconnais (Bourgogne Pinot Noir 2023 by the glass)

1. Who and where: "Damien Martin Bourgogne Pinot Noir is from Domaine Robert et Damien Martin at Davayé in the Mâconnais: founded 1982 by Robert, run by son Damien, about 20 ha, imported by Hand Picked Selections." Its forThePack line: "One line: a father and son family domaine in the Mâconnais, southern Burgundy, founded 1982."
   Source: research/verified-facts.json, record gap-pron-2, whose sources read "search: handpickedselections.com, cellartracker.com, vivino.com" (the gap fill of early October 2026). The 20 hectares are undated and are not used.
2. The same finding in the gap-fill log: "(search: handpickedselections.com, cellartracker.com) Damien Martin is Domaine Robert et Damien Martin at Davayé, founded 1982, about 20 ha."
   Source: research/second-pass.md, Gap 6.
3. The wine list's line: "A family estate in Davayé in the Mâconnais, making straightforward Bourgogne for everyday drinking." Its tell: "Damien Martin is a family domaine in the south of Burgundy. This Bourgogne Pinot Noir is light and fruity, red cherry and strawberry with soft tannin, a gentle red for fish, chicken or a guest who wants red with a lighter dish."
   Source: the wine list file, producer Domaine Damien Martin (region "Mâconnais, Burgundy").
4. The bottle on the list: the glass entry under By the Glass ~ Red names it as Pinot Noir, Damien Martin, Burgundy, France, 2023, $17. The current menu prints $18: "| Damien Martin Pinot Noir | $17 | $18 |".
   Source: the wine list file, entry 13 (its dash written here as a comma), and research/menus-pasted-diff-2026-10-03.md.
5. The earlier doubt, now settled: before the gap fill, research/gap-fill-7.md had "(expert, low): I do not recognise Damien Martin as an established estate", and research/dossier-the-cellar.md "Neither lens nor examiner could place a Damien Martin domaine or maison in Burgundy." The search in items 1 and 2 placed it; the component wine-story-damien-martin and the pack follow the search.
   Source: research/gap-fill-7.md (prod-damien-martin) and research/dossier-the-cellar.md (section 12).
6. The pack's tasting line: "Red Burgundy by the glass: red cherry, raspberry, a touch of earth; light tannin and fresh acidity." Its serve line: "Serve 55 to 58°F in a Burgundy bowl; no decanting." Its origin line repeats item 1, with "about twenty hectares".
   Source: the pack, w-y0ihoyc7 (profile, serve and origin).
7. The mix-up the house already teaches: the master review added "Damien Martin against Jadot Beaune" to the mix-ups.
   Source: research/master-review-2026-10-04.md.

Expert knowledge: Damien Martin is said dah-MYAN mar-TAN, as the component prints it; the pack's dah-mee-EN mar-TAN is the same name drawn out (no source either way). Davayé is said dah-vay-YAY, Bourgogne boor-GOHN-yuh. The Mâconnais is above all white wine country, the southern home of Chardonnay in Burgundy, which is why a red from a Mâconnais domaine is worth remarking. A Bourgogne label is the regional appellation: it names Burgundy as a whole, not a village or a vineyard.

Not confirmed: where the grapes for this Bourgogne grow; the component's "near Pouilly-Fuissé" (no source names a neighbour for Davayé, so the fix offered drops it); the domaine's other wines.

Brennan's link: the only red Burgundy by the glass, the first pick for the Blackened Tofu and, by the pack, the second choice on six plates (the Rohan duck, the duck confit waffle, the steak tartare cannoli, the gumbo, the Eggs Hussarde and the Pecan Gulf Fish).

## 2. Domaine Henri Gouges, Nuits-Saint-Georges (village half-bottle 2021 and Les Pruliers Premier Cru 2016)

1. The Codex record: r "Nuits-Saint-Georges", sub "Côte de Nuits", founded "1925"; holdings: "Around fifteen hectares concentrated in the premiers crus of Nuits, including Les Saint-Georges, Les Vaucrains, Clos des Porrets-Saint-Georges as a monopole, and La Perriere, which is planted to the white Pinot mutation found on the estate."
   Source: sommelierscodex/js/data-producers.js, p-dom-henri-gouges (holdings and founded).
2. The history: "Henri Gouges was a leader of the estate-bottling movement and of the drive that produced the AOC system; the village's bid to promote Les Saint-Georges to grand cru is a live exam topic."
   Source: the same record, why.
3. The style: "Firm, earthy and slow, built for a decade in bottle; the antithesis of early-drinking Burgundy." Its tasting tag: "Iron, wild cherry and clay: Nuits at its sternest, needing ten years".
   Source: the same record, style and t.
4. The wines and the traps: Nuits-Saint-Georges Les Saint-Georges, "The premier cru that gave the village half its name"; Clos des Porrets-Saint-Georges, "Premier cru monopole of the estate"; Nuits-Saint-Georges La Perrière Blanc, grape "Pinot Gouges", "A white Pinot mutation identified in the estate's own vines". Traps: "Nuits-Saint-Georges has no grand cru, however famous Les Saint-Georges is"; "The white from La Perriere is a Pinot mutation, not Chardonnay".
   Source: the same record, wines and traps.
5. The family and the farming today: "Domaine Henri Gouges is a family domaine in Nuits-Saint-Georges, run by the fourth generation (Grégory and Antoine Gouges), farmed organically, with about 14.5 hectares mostly of Premier Cru; Les Pruliers is a Premier Cru on the south side of the town, 1.8 hectares, vines about fifty years old." The hectares and the vine age are undated and are not used.
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Les Pruliers card, "how": "search: gouges.com, the estate page, and an importer sheet (ahdvintners.com)".
6. The wine list's line: "The reference domaine of Nuits-Saint-Georges, making firm, dark, long lived reds from the village's best premier crus." Its tell: "Gouges is the name most people think of in Nuits-Saint-Georges. The wines are sturdy and structured, with dark fruit and an earthy edge, and they age very well. The half bottles are a great option for two guests with red meat."
   Source: the wine list file, producer Domaine Henri Gouges.
7. The pack: for the half-bottle, "This is its village wine, all Pinot Noir; which parcels go into it is a question for the sommelier." For Les Pruliers: "Premier Cru Pinot Noir from Les Pruliers, organically farmed, ten years old: dark cherry and plum, earth and a little spice, firm structure softening into a long, savory finish."
   Source: the pack, w-zxu9f2du (Tell me about it) and w-64x4h6hs (profile).
8. The earlier card for the half-bottle: "Domaine Henri Gouges is a family domaine in Nuits-Saint-Georges (Côte de Nuits), one of the reference names of the village; village Nuits-Saint-Georges is sturdier and more savory than Beaune." Marked "how": "knowledge", not searched.
   Source: research/bottle-facts-cards-a-2026-10-04.json (n1944).

Expert knowledge: Gouges is said GOOZH, Henri Gouges ahn-REE GOOZH, Les Pruliers lay prew-LYAY and Nuits-Saint-Georges nwee san ZHORZH, as the pack prints them (no source).

Not confirmed: the founding year (the Codex's 1925 is held back, see the method); when the white Pinot mutation was found; when the domaine turned organic; the year estate bottling began at Gouges.

Brennan's link: the half-bottle and Les Pruliers 2016 are both duck bottles. The wine list also carries a 2022 half-bottle, Les Pruliers 2013 and 2021, Aux Chaignots 2021, the Clos des Porrets-Saint-Georges 2021 and 2022, Les Vaucrains 2022 and a Côte de Nuits-Villages 2023.

## 3. Domaine Faiveley, Nuits-Saint-Georges (Bourgogne Rouge 2022)

1. The Codex record: r "Nuits-Saint-Georges", sub "Côte de Nuits and Côte Chalonnaise", founded "1825"; holdings: "One of the largest owners in Burgundy, with the Corton grand cru monopole Clos des Cortons Faiveley, parcels in Chambertin-Clos de Bèze, Mazis-Chambertin, Latricieres and Echezeaux, and extensive holdings in Mercurey."
   Source: sommelierscodex/js/data-producers.js, p-maison-faiveley (p "Domaine Faiveley").
2. The style: "Historically firm and extracted; markedly finer and more aromatic since Erwan Faiveley took over in 2005." Its tasting tag: "Broad-shouldered Burgundy: dark fruit, spice and tannin that wants time".
   Source: the same record, style and t.
3. Why it matters: "Faiveley is both domaine and maison, and the only grand cru in Burgundy whose official name carries a family surname."
   Source: the same record, why.
4. The wines and the traps: Corton Clos des Cortons Faiveley, "A grand cru monopole carrying the family's own name"; Chambertin-Clos de Bèze, "The house's flagship Gevrey grand cru"; Mercurey Clos des Myglands, "Premier cru monopole in the Côte Chalonnaise". Traps: "Clos des Cortons Faiveley is the sole grand cru bearing an owner's name"; "Faiveley bottles both estate wines and negociant wines under one house name"; "The estate is one of the largest landowners in the Côte Chalonnaise, not only the Côte d'Or".
   Source: the same record, wines and traps.
5. The Mugnier lease: the Mugnier record's holdings include "the 9.55 ha Nuits-Saint-Georges premier cru monopole Clos de la Marechale, leased to Faiveley for half a century and farmed by the domaine again from the 2004 vintage"; its trap: "Clos de la Marechale bottlings before 2004 are Faiveley's, not Mugnier's".
   Source: sommelierscodex/js/data-producers.js, p-dom-jf-mugnier.
6. The primer's frame: "négociants (Jadot, Drouhin, Bouchard, Faiveley) buy fruit or wine".
   Source: sommelierscodex/js/data-primers.js, "Négociant vs domaine".
7. The wine list's line: "A historic Nuits-Saint-Georges house and one of Burgundy's biggest vineyard owners, making structured, modern, well made reds from Mercurey to Chambertin." Its tell: "Faiveley owns a remarkable spread of vineyards, many in the Côte de Nuits and the Côte Chalonnaise. The reds are dark, firm and reliable, from Mercurey up to the Chambertin grand crus."
   Source: the wine list file, producer Domaine Faiveley.
8. Billaud-Simon: the wine list's line for that producer reads "A historic Chablis estate known for pure, crisp wines, now owned by Faiveley." It carries no date, so it is an ownership claim that can change; it is not used in the profile.
   Source: the wine list file, producer Billaud-Simon.
9. The earlier card: "Faiveley is a family wine house based in Nuits-Saint-Georges in the Côte de Nuits, with vineyards across the Côte d'Or and the Côte Chalonnaise." Marked "trade knowledge of the producer, certain", not searched. The same card: bin 22651, the Bourgogne 2022 at $90, is printed twice, under Selections Under $100 and under Bourgogne; the list also prints a Faiveley Bourgogne 2021 at $100 and a white Bourgogne 2022 at $85.
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Faiveley Bourgogne Rouge card.
10. The pack: "Pinot Noir under the regional Bourgogne name from a Nuits-Saint-Georges house: bright cherry and red currant, light to medium body, fresh acidity and fine tannin, the plainest statement of red Burgundy on the list."
   Source: the pack, w-hzb9h1a4 (profile).

Expert knowledge: Faiveley is said fev-LAY, as the pack prints it (no source).

Not confirmed: the founder's name; whether the Bourgogne Rouge comes from estate vines or bought fruit; who leads the house today beyond the Codex's 2005.

Brennan's link: the value red Burgundy for the duck. The wine list carries Faiveley from Mercurey (Clos des Myglands, Domaine de la Framboisière, Vieilles Vignes, Clos Rochette white) through Gevrey (Lavaux Saint-Jacques, Les Cazetiers), Chambolle, Vosne, Nuits Les Montroziers, Beaune Clos de l'Écu, Volnay Frémiets and Santenots, to the grand crus Mazis-Chambertin, Chambertin-Clos de Bèze, Charmes-Chambertin, Corton Clos de Corton (as the list prints it) and the white Bienvenues-Bâtard-Montrachet.

## 4. Domaine Jean Grivot, Vosne-Romanée (Les Charmois Nuits-Saint-Georges 2013 and Echézeaux Grand Cru 2011)

1. The Codex record: r "Vosne-Romanée", sub "Côte de Nuits", founded empty; holdings: "Around fifteen hectares spread over Richebourg, Echezeaux, Clos de Vougeot and a long list of Vosne and Nuits premiers crus including Les Beaux Monts, Les Suchots and Les Boudots."
   Source: sommelierscodex/js/data-producers.js, p-dom-jean-grivot.
2. The style: "Classical and firm, moderate new oak; the estate stepped away from the cold-maceration experiments of the late 1980s toward greater clarity." Its tasting tag: "Vosne with the bones showing: dark berry, wet stone, upright tannin".
   Source: the same record, style and t.
3. The case study: "Etienne Grivot's association with the consultant Guy Accad in the late 1980s is the standard case study in Burgundian winemaking fashion and its reversal."
   Source: the same record, why.
4. The wines and the trap: Richebourg, "The estate's flagship grand cru"; Vosne-Romanée Les Beaux Monts, "High premier cru of marked minerality"; Nuits-Saint-Georges Les Boudots, "Premier cru bordering Vosne, with Vosne perfume". Trap: "Les Boudots is in Nuits-Saint-Georges despite tasting like Vosne".
   Source: the same record, wines and traps.
5. Today, and Les Charmois: "Domaine Jean Grivot is a family domaine in Vosne-Romanée, run since 2017 by Mathilde Grivot. Les Charmois is a village-level Nuits-Saint-Georges vineyard south of the town; the wine is Pinot Noir aged about eighteen months in French oak." The card did not say which half came from the search and which from trade knowledge; the leadership is a dated fact that can change.
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Les Charmois card, "how": "search: insideburgundy.com and timelesswines.com notes on Grivot Les Charmois, with trade knowledge of the domaine".
6. Echézeaux: "Echézeaux is a Grand Cru of the Côte de Nuits beside Vosne-Romanée, on the slope above the Clos de Vougeot; it is sold under the Vosne-Romanée name although it lies in Flagey-Echézeaux. Grivot owns a parcel." Marked "appellation and producer knowledge, certain", not searched. See the expert knowledge line: the second clause is wrong for the grand cru.
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Echézeaux card.
7. The wine list's line: "A leading Vosne-Romanée domaine run by Étienne Grivot and family, making fine, expressive reds from village wine to Richebourg." Its tell: "Grivot is one of the great Vosne-Romanée names, with a range from village Vosne up to Richebourg. The wines are refined and long, with a lovely spicy fruit." The line's "run by Étienne Grivot" disagrees with item 5; a winelistFix is offered.
   Source: the wine list file, producer Domaine Jean Grivot.
8. The components: wine-story-cote-de-nuits-families says the domaine is "run today by the next generation of the family"; wine-region-vosne-romanee calls Vosne-Romanée "the most celebrated red wine village in Burgundy" and places Echézeaux "just above the Clos de Vougeot".
   Source: components/wines.json.
9. The pack: Les Charmois, "Village Nuits-Saint-Georges from the Les Charmois vineyard, made by a Vosne-Romanée domaine and now thirteen years old: red cherry turning to dried cherry, forest floor and mushroom, silky tannin and fresh acidity." Echézeaux: "Grand Cru Pinot Noir from Echézeaux, beside Vosne-Romanée, made by a Vosne family domaine and fifteen years old: dark cherry, rose and spice, forest floor coming in, silky tannin and a layered, long finish."
   Source: the pack, w-jixeyrd6 and w-bv44j8jo (profile).

Expert knowledge: Grivot is said gree-VOH, Echézeaux eh-shay-ZOH, Les Charmois lay shar-MWAH, Vosne-Romanée vohn roh-mah-NAY (as the pack prints them). Echézeaux is a grand cru appellation in its own right, sold under its own name; it lies in the commune of Flagey-Echézeaux, and it is that commune's village and premier cru wine, not the grand cru, that is sold as Vosne-Romanée. So item 6's "sold under the Vosne-Romanée name" is wrong, and the component wine-region-vosne-romanee's "sold as part of Vosne" is loose in the same way.

Not confirmed: when the domaine was founded; Jean Grivot's own dates; how Mathilde Grivot is related to Étienne Grivot.

Brennan's link: Les Charmois 2013 is mature Burgundy at a fair price for the tofu; the Echézeaux 2011 is the grand step for the duck. The wine list also carries Grivot's Clos Vougeot (2009, 2011, 2015, 2016, 2019), the Echézeaux 2015, Richebourg (2015, 2016, 2020), village Vosne-Romanée, Les Beaux Monts, Nuits-Saint-Georges Aux Boudots and Roncière, and Les Charmois in six vintages.

## 5. Domaine Tollot-Beaut, Chorey-lès-Beaune (Les Lavières Savigny-lès-Beaune Premier Cru 2019)

1. The wine list's line: "A Chorey-lès-Beaune family domaine making ripe, generous reds from Chorey, Savigny, Beaune, Aloxe-Corton and Corton." Its tell: "Tollot-Beaut is a reliable family estate known for ripe, fruity, crowd pleasing reds. Chorey-lès-Beaune is one of the best values on the list, and the Corton Bressandes is a step up."
   Source: the wine list file, producer Domaine Tollot-Beaut (region "Burgundy, Chorey-lès-Beaune").
2. The earlier card: "Tollot-Beaut is a family domaine in Chorey-lès-Beaune with vineyards across the Côte de Beaune, known for ripe reds with some new oak; Les Lavières is a Premier Cru of Savigny-lès-Beaune, the village just north of Beaune." Marked "trade knowledge of the producer and appellation, certain", not searched.
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Les Lavières card.
3. The component: "Tollot-Beaut, in Chorey-lès-Beaune, makes our Savigny Les Lavières."
   Source: components/wines.json, wine-story-cote-de-beaune-families.
4. The bottles on the wine list, all under the domaine's name: Chorey-lès-Beaune as a 2021 half-bottle at $90 and in 2016, 2017, 2019 and 2022; a white Bourgogne "Côte d'Or" 2022; Corton-Charlemagne Grand Cru 2022; Corton Grand Cru Bressandes 2013, 2019 and 2022; Savigny-lès-Beaune Premier Cru Les Lavières 2019; Beaune Premier Cru Clos du Roi 2013 and 2022 (printed "Clos-du-Roi" and "Clos de Roi"); Aloxe-Corton 2015 and 2019.
   Source: the wine list file, entries 85, 689, 802, 1968 to 1970, 1987, 2002, 2008 and 2154 to 2159.
5. The pack: origin, "Tollot-Beaut is a family domaine in Chorey-lès-Beaune, with vineyards across the Côte de Beaune; Les Lavières is a Premier Cru in Savigny-lès-Beaune." Tell me about it: "known for ripe, generous reds with a touch of new oak". Profile: "Premier Cru Pinot Noir from Les Lavières in Savigny-lès-Beaune, seven years old: ripe red cherry and raspberry with a touch of spice and toasty oak, medium body, supple tannin."
   Source: the pack, w-cs4huhpa.
6. The Codex has no Tollot-Beaut record (no match for the name in data-producers.js), so a library entry is offered.

Expert knowledge: Tollot-Beaut is said toh-LOH BOH, Savigny-lès-Beaune sah-vee-NYEE lay BOHN, Les Lavières lay lah-VYAIR (as the pack prints them). "Lès" in a Burgundy village name means near, here near Beaune. Chorey-lès-Beaune is a village appellation with no premier cru, so the domaine's premiers crus come from other villages, here Savigny-lès-Beaune and Beaune.

Not confirmed: everything of the domaine's history and people; its farming.

Brennan's link: Les Lavières 2019 is the sweet spot bottle for the Eggs Owen, between the Lapierre Morgon and the d'Angerville Clos des Ducs; the wine list's Chorey-lès-Beaune is a value and its Corton Bressandes a step up.

## 6. Maison Joseph Drouhin, Beaune (Clos des Mouches Beaune Premier Cru 2015)

1. The Codex record: r "Beaune", sub "Côte de Beaune", founded "1880"; holdings: "Cellars under Beaune with vineyards across the Côte d'Or and Chablis; owns the largest share of the Beaune premier cru Clos des Mouches and farms and sells Le Montrachet Marquis de Laguiche. Domaine Drouhin Oregon was established in the Dundee Hills in 1987."
   Source: sommelierscodex/js/data-producers.js, p-maison-joseph-drouhin (p "Maison Joseph Drouhin").
2. The style: "Light-handed and aromatic, modest new oak, organic and biodynamic farming; elegance in preference to weight." Its tasting tag: "Understated and perfumed: red fruit, white flowers, no shouting anywhere".
   Source: the same record, style and t.
3. Why it matters: "The Laguiche arrangement shows that a famous Montrachet label can name an owner while the wine is made by a maison, and Drouhin Oregon is the standard answer on Burgundian investment in the New World."
   Source: the same record, why.
4. The wines and the traps: Beaune Clos des Mouches, grape "Chardonnay and Pinot Noir", "Made in both colours, the house signature"; Montrachet Marquis de Laguiche, "Farmed and sold by Drouhin for the Laguiche family"; Chablis Drouhin-Vaudon, "The house's Chablis estate, based at a former mill". Traps: "Marquis de Laguiche is the owner of the parcel; Drouhin makes and sells the wine"; "Clos des Mouches is a Beaune premier cru made in both colours, not a grand cru".
   Source: the same record, wines and traps.
5. Oregon: the Domaine Drouhin Oregon record, founded "1987"; why: "Robert Drouhin bought land in Oregon in 1987 after the 1980 rematch with Eyrie, and installed his daughter Veronique as winemaker. It is the clearest case of Burgundian capital validating a New World Pinot region." Trap: "Drouhin came to Oregon because of the Eyrie result, not the Judgement of Paris".
   Source: sommelierscodex/js/data-producers.js, p-domaine-drouhin-oregon.
6. The Eyrie result: "His 1975 South Block placed in the 1979 Gault-Millau tasting in Paris, and the 1980 rematch organised by Robert Drouhin put it second, which brought Drouhin to Oregon." (David Lett, The Eyrie Vineyards.)
   Source: sommelierscodex/js/data-producers.js, the Eyrie record.
7. The advanced question: answer "Maison Joseph Drouhin (1987; Véronique Drouhin winemaking)"; explanation "In Drouhin's 1980 rematch his own Chambolle-Musigny edged Eyrie's 1975 South Block by a fraction, close enough to send him to Oregon." (the source's dash written here as a comma).
   Source: sommelierscodex/js/data-advanced.js, a-8b8eih8v.
8. The wine list's line: "A family owned Beaune house with large organic and biodynamic holdings, known for graceful, elegant wines and its Beaune Clos des Mouches." Its tell: "Drouhin is one of Beaune's great family houses, with a style built on elegance. Clos des Mouches is their signature Beaune premier cru, and they also own parcels in Musigny and Les Amoureuses. A trusted name for any guest."
   Source: the wine list file, producer Joseph Drouhin.
9. The bottles on the wine list: Musigny Grand Cru 2008 and Chambolle-Musigny Premier Cru Les Amoureuses 2008, both as "Domaine Joseph Drouhin"; the red Clos des Mouches in 2005, 2011, 2014 and 2015, the 2015 printed twice under bin 27151 (as "Domaine Joseph Drouhin Clos des Mouches" and "Joseph Drouhin Le Clos des Mouches"); a Côte de Nuits-Villages 2022; a Vosne-Romanée 2011.
   Source: the wine list file, entries 1518, 1703, 1723, 1914, 1996 to 1999 and 2003; research/bottle-facts-cards-b-2026-10-04.json (the Clos des Mouches card).
10. The earlier card: "Maison Joseph Drouhin is a family house in Beaune with its own domaine vineyards; it owns the largest share of the Clos des Mouches, a Beaune Premier Cru, and makes it in red and white." Marked "trade knowledge of the producer, certain", not searched.
   Source: research/bottle-facts-cards-b-2026-10-04.json.
11. The pack: "Pinot Noir from the Clos des Mouches, a Premier Cru on the slope above Beaune, eleven years old: red and black cherry, rose and spice, silky tannin and a long, gentle finish."
   Source: the pack, w-c1zkvrly (profile).
12. The producer list's mapping: scratchpad cellar-producers.json marks Domaine Joseph Drouhin library:null, but the Codex holds the house as p-maison-joseph-drouhin. No new library entry is offered; the mapping should read p-maison-joseph-drouhin.

Expert knowledge: Drouhin is said droo-AN, Joseph Drouhin zho-ZEF droo-AN, Clos des Mouches kloh day MOOSH, Beaune BOHN (the pack prints all but the first name). The house carries the name of its founder, Joseph Drouhin, and the Codex's 1880 is the year I know for it.

Not confirmed: when Drouhin first owned part of the Clos des Mouches; who leads the house today.

Brennan's link: one of the anchors of the red Burgundy pages, at the top of the sweet spot; the Musigny and Les Amoureuses on the wine list are the same house's grand cru and great premier cru.

## 7. Domaine Georges Roumier, Chambolle-Musigny (Clos de la Bussière Morey-Saint-Denis Premier Cru 2014)

1. The Codex record: r "Chambolle-Musigny", sub "Côte de Nuits", founded "1924"; holdings: "About twelve hectares including one of the larger holdings in Bonnes-Mares, a sliver of Musigny giving a few hundred bottles, Chambolle Les Amoureuses, Ruchottes-Chambertin and the Morey-Saint-Denis monopole Clos de la Bussiere."
   Source: sommelierscodex/js/data-producers.js, p-dom-georges-roumier.
2. The style: "Whole bunches used sparingly, restrained oak, cool-toned red fruit and a stony, almost austere finish under Christophe Roumier." Its tasting tag: "Red currant, crushed rock, rose stem: Chambolle drawn fine and cold".
   Source: the same record, style and t.
3. Why it matters: "The monopole is examinable and so is the Bonnes-Mares split, since the grand cru's terres rouges and terres blanches divide the vineyard internally, and separately a small northern portion of the cru lies in Morey-Saint-Denis."
   Source: the same record, why.
4. The wines and the traps: Bonnes-Mares, "The estate's largest grand cru, drawn from both soil types"; Chambolle-Musigny Les Amoureuses, "Premier cru that trades at grand cru prices"; Musigny, "A few hundred bottles from a sliver of the grand cru"; Morey-Saint-Denis Clos de la Bussière, "Premier cru monopole, the estate's most affordable red". Traps: "Clos de la Bussiere is in Morey-Saint-Denis, not Chambolle-Musigny"; "Roumier's Musigny exists but in quantities most candidates assume are a Vogüé monopoly".
   Source: the same record, wines and traps.
5. The wine list's line: "The Chambolle-Musigny domaine of Christophe Roumier, one of the most celebrated names in Burgundy, known for intense, precise reds." Its tell: "Roumier is among the most sought after names in all of Burgundy. Bonnes-Mares and the Clos de la Bussière monopole in Morey are both here. These wines are rare and highly prized; suggest decanting and treat them as the occasion."
   Source: the wine list file, producer Domaine Georges Roumier.
6. The earlier card: "Domaine Georges Roumier is a family domaine in Chambolle-Musigny, among the most sought-after growers in Burgundy; the Clos de la Bussière is a walled Premier Cru in Morey-Saint-Denis that Roumier owns alone (a monopole)." Marked "trade knowledge of the producer, certain", not searched. The same card counts eight Roumier entries on the list.
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Clos de la Bussière card.
7. The component: wine-monopole-clos names "Roumier's Clos de la Bussière in Morey" among the walled vineyards on the list.
   Source: components/wines.json.
8. The pack: "Pinot Noir from the Clos de la Bussière, a walled Premier Cru that Roumier alone owns, twelve years old: dark cherry and plum, earth, iron and spice, firm but silky tannin and real depth." Its Tell me about it: "a more rustic, earthy side of Roumier than its Chambolle wines" and "its Grand Crus are hard to find anywhere".
   Source: the pack, w-3mrvqhqq.

Expert knowledge: Roumier is said roo-MYAY, Georges Roumier zhorzh roo-MYAY, Clos de la Bussière kloh duh lah bew-SYAIR, Morey-Saint-Denis moh-REE san duh-NEE (the pack prints all but the first name). The domaine is named for Georges Roumier, who founded it, and the Codex's 1924 is the year I know for it. Ruchottes-Chambertin is a grand cru of Gevrey-Chambertin.

Not confirmed: Christophe Roumier's dates at the domaine; when the Clos de la Bussière was acquired; its size.

Brennan's link: the celebration bottle for the Blackened Tofu. The wine list carries the Clos de la Bussière in 2013, 2014, 2022 and 2023, Bonnes-Mares 2012 and 2023, and village Chambolle-Musigny 2022 and 2023.

## 8. Domaine Marquis d'Angerville, Volnay (Clos des Ducs Volnay Premier Cru 2014)

1. The Codex record: r "Volnay", sub "Côte de Beaune", founded empty; holdings: "Owner of the Volnay premier cru monopole Clos des Ducs, with Taillepieds, Champans and Fremiets; biodynamic. The family also founded Domaine du Pelican in the Jura in 2012."
   Source: sommelierscodex/js/data-producers.js, p-dom-marquis-dangerville.
2. The style: "Pale, fine and aromatic; low extraction and little new oak, the model for Volnay as the elegant commune." Its tasting tag: "Volnay in silk: violet, red cherry, fine dry tannin, nothing forced".
   Source: the same record, style and t.
3. The history: "Sem d'Angerville was one of the growers who forced estate bottling and helped build the AOC framework in the 1930s, which makes the estate a history answer as well as a Volnay answer."
   Source: the same record, why.
4. The wines and the traps: Volnay Clos des Ducs, "Premier cru monopole beside the village"; Volnay Taillepieds, "The stoniest of the estate's crus, often argued for promotion"; Volnay Champans, "Broader premier cru from mid-slope". Traps: "Volnay has no grand cru; Clos des Ducs is a premier cru monopole"; "The family's Jura estate, Domaine du Pelican, is a separate property in Arbois".
   Source: the same record, wines and traps.
5. The advanced question: "Which premier cru of Volnay, the monopole of Domaine Marquis d'Angerville, is often called grand-cru-in-waiting?" Answer "Clos des Ducs"; explanation "Volnay and Pommard have no grands crus; Clos des Ducs, Taillepieds and Caillerets argue the case."
   Source: sommelierscodex/js/data-advanced.js, a-g12m7nmd.
6. The content fix behind that question (summary; the passage carries dashes): the Clos des Ducs is walled, adjoins the domaine in the village and is entirely owned by Domaine Marquis d'Angerville, "universally listed as a true monopole"; "near-monopole" was the wrong hedge.
   Source: sommelierscodex/CONTENT-FIXES.md, fix 15.
7. The wine list's line: "The great Volnay domaine, owner of the Clos des Ducs monopole, making pure, fragrant reds, farmed biodynamically." Its tell: "D'Angerville is perhaps the most famous name in Volnay. Clos des Ducs is their walled vineyard; Champans, Taillepieds and Caillerets are top premier crus. Elegant, fragrant and long lived." The Pélican line: "The Jura estate of Marquis d'Angerville of Volnay, making Chardonnay, Savagnin, Vin Jaune and sparkling wine."
   Source: the wine list file, producers Marquis d'Angerville and Domaine du Pélican.
8. The earlier card: "Domaine Marquis d'Angerville is a family domaine in Volnay, farmed biodynamically; the Clos des Ducs is the walled Volnay Premier Cru beside the house, a monopole of the domaine." Marked "trade knowledge of the producer, certain", not searched.
   Source: research/bottle-facts-cards-b-2026-10-04.json, the Clos des Ducs card.
9. The bottles on the wine list: the Clos des Ducs in 2007, 2014, 2015, 2022 (also in magnum) and 2023; Champans 2009, 2014, 2015, 2022 and 2023; Taillepieds (printed "Taille Pieds") 2005 and 2008; Les Caillerets 2015; a Volnay Premier Cru 2022 and 2023; and white Meursault Premier Cru, Les Santenots 2015 and Les Santenots Blancs 2022 and 2023.
   Source: the wine list file, entries 219, 816, 826, 837 and 2077 to 2092.
10. The components: wine-story-dangerville-pelican, "Its Clos des Ducs is the walled Premier Cru beside the family house, a monopole: no one else makes it", and "The same family looked beyond Burgundy to the Jura, where it founded Domaine du Pélican at Arbois".
   Source: components/wines.json.
11. The pack: "Volnay, vohl-NAY, makes the most perfumed, silky Pinot Noir of the Côte de Beaune." Profile: "Pinot Noir from the Clos des Ducs, a walled Premier Cru in Volnay that d'Angerville owns alone, twelve years old: red cherry, rose and violet, silky tannin and a long, fine finish."
   Source: the pack, w-oyajc1so.

Expert knowledge: d'Angerville is said dahn-zhair-VEEL, Clos des Ducs kloh day DEWK, Volnay vohl-NAY (as the pack prints them).

Not confirmed: who runs the domaine today; the year it turned biodynamic; when the domaine was founded; where the name Clos des Ducs comes from.

Brennan's link: the celebration bottle for the Eggs Owen, the top of a ladder that runs from the Lapierre Morgon through Tollot-Beaut's Les Lavières; the Pélican Vin Jaune on the list is the same family's Jura estate.

## What this pass changes in the existing components

- wine-story-damien-martin: the card stands. The explain says "his son Damien now runs its roughly twenty hectares", an undated size stated as a present fact (the earlier search's "about 20 ha" carries no date), and places Davayé "near Pouilly-Fuissé", a neighbour no source in the repositories names. A fixExisting offers the explain without either.
- wine-story-dangerville-pelican: stands; it agrees with the Codex and the wine list (section 8). The Codex dates the Pélican to 2012, which the explain could add.
- wine-story-cote-de-nuits-families and wine-story-cote-de-beaune-families: they stand. Gouges, Grivot, Roumier, Faiveley and Tollot-Beaut each now get a cellar- component of their own, as Drouhin does.
- wine-monopole-clos: stands (Roumier's Clos de la Bussière and d'Angerville's Clos des Ducs, sections 7 and 8).
- wine-region-vosne-romanee: "legally within the commune of Flagey-Echézeaux but sold as part of Vosne" is loose; the grand cru is sold under its own name, and it is Flagey's village and premier cru wine that is sold as Vosne-Romanée (section 4, expert knowledge). A suggested sentence: "Echézeaux is a large Grand Cru just above the Clos de Vougeot, in the commune of Flagey-Echézeaux; it is sold under its own name, the grand cru friendliest to a first taste of Vosne." Not a component this group owns, so it is noted here only.
- research/bottle-facts-cards-b-2026-10-04.json (not shipped): the Echézeaux card's "it is sold under the Vosne-Romanée name" is wrong for the grand cru, as above.
- The wine list: the Grivot line names Étienne Grivot as running the domaine; the research of 4 October dates Mathilde Grivot's lead to 2017 (section 4, items 5 and 7). A winelistFix offers a line that names her with the date.
- The producer list: cellar-producers.json marks Domaine Joseph Drouhin library:null where the Codex holds p-maison-joseph-drouhin (section 6, item 12).

## Library agreement (sommelierscodex/js/data-producers.js)

- p-dom-henri-gouges: agrees with everything this pass could read (Nuits-Saint-Georges, the premiers crus, the Clos des Porrets-Saint-Georges monopole, La Perrière and its white Pinot, estate bottling and the AOC, no grand cru in the village). Founded 1925 was neither confirmed nor refuted and should be checked when search is available. Its holdings open with "Around fifteen hectares", which the file's own header counts a volatile fact; suggested: "Concentrated in the premiers crus of Nuits, including Les Saint-Georges, Les Vaucrains, Clos des Porrets-Saint-Georges as a monopole, and La Perriere, which is planted to the white Pinot mutation found on the estate."
- p-maison-faiveley: agrees (1825, Nuits-Saint-Georges, domaine and maison, Clos des Cortons Faiveley, the Gevrey grand crus, Mercurey and the Clos des Myglands). Latricieres and Echezeaux are written without their accents (Latricières, Echézeaux).
- p-dom-jean-grivot: agrees (Richebourg, Echézeaux, Clos de Vougeot, the premiers crus, Guy Accad). "Around fifteen hectares" as for Gouges. The Echézeaux is in its holdings but not its wines; no other record claims that bottling name, so it could be added as { n: 'Echézeaux', grape: 'Pinot Noir', note: 'Grand cru above the Clos de Vougeot' }.
- p-dom-georges-roumier: agrees (1924, Bonnes-Mares, Musigny, Les Amoureuses, Ruchottes-Chambertin, the Clos de la Bussière in Morey-Saint-Denis). "About twelve hectares" as for Gouges; its style names Christophe Roumier as the current winemaker, which the header also counts volatile.
- p-dom-marquis-dangerville: agrees (Clos des Ducs monopole, Taillepieds, Champans, Frémiets, biodynamic, Pélican in 2012, Sem d'Angerville in the 1930s). Fremiets and Pelican are written without their accents; the family's own spellings carry them (Frémiets, Pélican). The white Meursault Santenots on the wine list is not in its wines.
- p-maison-joseph-drouhin: agrees (1880, Beaune, the Clos des Mouches in both colours, Laguiche, Drouhin-Vaudon, Oregon in 1987). The wine list's Musigny and Les Amoureuses under the Drouhin name are not in its record.
- New entries are offered for Domaine Tollot-Beaut and Domaine Robert et Damien Martin, neither of which the library holds.

## Verification 2026-10-10

A second, adversarial pass read every field of the contract JSON against the sources above, hunting the four shapes in which wine facts fail: a plausible number, neighbour, owner or relation.

Searches: none could run in this pass either. Two WebSearch calls were attempted on 10 October 2026 (Domaine Robert et Damien Martin at Davayé and its founding; the history of Domaine Henri Gouges, its estate bottling, Pinot Gouges, its organic farming and its fourth generation), and both were refused by the harness before reaching a search engine with the same message as the first pass: "this turn's web search budget is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)". One WebFetch of the Gouges site (https://www.gouges.com/) failed again at the network ("getaddrinfo ENOTFOUND www.gouges.com"). The limit was not worked around. So nothing below is a new web source: every check is against the repositories, quoted with its path, or against expert knowledge marked as such, and where a claim was uncertain and unsupported it was removed or turned into a lineup question. This group should still be re-run with search when the budget allows.

Sources read for the check:
- V1. The wine list file, static/shared/packs/brennans-new-orleans.winelist.v1.json: producer lines and tells for Domaine Damien Martin, Domaine Henri Gouges, Domaine Faiveley, Domaine Jean Grivot, Domaine Tollot-Beaut, Joseph Drouhin, Domaine Georges Roumier, Marquis d'Angerville and Domaine Saint-Martin, and the Roumier entries: Clos de la Bussière 2013 $385 (entry 1672), 2014 $320 (1673, bin 287142), 2022 $550 (1674), 2023 $585 (1675); Bonnes-Mares 2012 $1100 (1695) and 2023 $2550 (1696); village Chambolle-Musigny 2022 $450 (1737) and 2023 $475 (1738). Domaine Saint-Martin's Bonnes-Mares 2005 is entry 1698, bin 24222.
- V2. The pack, static/shared/packs/brennans-new-orleans.v1.oothouse.json: w-y0ihoyc7, w-hzb9h1a4, w-jixeyrd6, w-cs4huhpa and w-3mrvqhqq in full (Roumier's "How do I sell it?": "At $320 it is the most approachable Roumier on our list"), and the Louis Jadot Beaune 1er Cru 2023 the Damien Martin note names.
- V3. components/wines.json: wine-story-damien-martin, wine-story-dangerville-pelican, wine-story-cote-de-nuits-families, wine-story-cote-de-beaune-families and wine-region-vosne-romanee in full; no cellar- key exists yet in any components file, and none of the six new keys is used by another group's contract file.
- V4. The scratchpad producer list, cellar-producers.json: the eight pack strings, the ten wine ids and the library marks (null for Damien Martin, Tollot-Beaut and Joseph Drouhin) as printed there.
- V5. sommelierscodex/js/data-producers.js: the header comment, the region heading "France, Burgundy and Beaujolais", the six records named in the method, and a search for Tollot-Beaut, Robert et Damien Martin and the two proposed ids, none of which the file holds.
- V6. research/bottle-facts-cards-b-2026-10-04.json, its "how" fields: the Gouges Les Pruliers card (search: gouges.com and ahdvintners.com), the Grivot Les Charmois card (search: insideburgundy.com and timelesswines.com, with trade knowledge), and the Tollot-Beaut, Drouhin, Roumier, d'Angerville and Faiveley cards (trade knowledge, not searched).

Verdicts, producer by producer:

1. Damien Martin. Stands on its one searched source (section 1, items 1 and 2): the domaine, Davayé, 1982, Robert and his son Damien. Domaine Saint-Martin's Bonnes-Mares and the Jadot Beaune Premier Cru, both named in the notes, are real entries (V1, V2). The fixExisting stands: it drops the undated hectares and the unsourced neighbour. Expert knowledge: Davayé does lie close to the Pouilly-Fuissé villages, so the old phrase was not false, only unsourced; dropping it costs nothing.

2. Henri Gouges. The holdings, the monopole, La Perrière's white Pinot, estate bottling and the appellation system, organic farming, the fourth generation and Les Pruliers on the south side of the town all trace to the Codex record or the searched card (section 2, items 1, 2, 4 and 5). Refuted and repaired: the new component's "Its vines lie in the town's premiers crus" claimed all of the vines; the searched card says "mostly of Premier Cru", so it now reads "Most of its vines". The history's "the village's bid ... is still a live question" stated the present status of a request no source dates; it now says the village has asked for promotion and the lineup asks where that stands. "By its own site as read in October 2026" claimed a reading this pass never made; it now credits the research of 4 October 2026. Founded stays empty (the Codex's 1925 is still unconfirmed). Expert knowledge: the Côte de Nuits takes its name from the town of Nuits, now Nuits-Saint-Georges, as the Côte de Beaune takes its name from Beaune.

3. Faiveley. 1825, Nuits-Saint-Georges, the Clos des Cortons Faiveley, the Gevrey grand crus (Chambertin-Clos de Bèze, Mazis-Chambertin and Latricières-Chambertin, which the Codex writes Latricieres), Echézeaux, Mercurey and the Clos des Myglands, Erwan Faiveley in 2005 and the Clos de la Maréchale lease all trace to the Codex (section 3, items 1 to 5). Refuted as unsupported: "both kinds of wine carry the one house name" (and "under the same house name" in the new component). Its only source is a Codex trap that was never searched, and expert recollection, not confirmed, is that the house distinguishes its estate wines from its bought-fruit wines on the label. Both lines now say only that Faiveley is domaine and maison, and the lineup asks how the label shows the difference. The Codex trap "Faiveley bottles both estate wines and negociant wines under one house name" should be checked against the house when search is available.

4. Jean Grivot. Richebourg, Echézeaux, Clos de Vougeot, the premiers crus, Les Boudots bordering Vosne and Guy Accad all trace to the Codex (section 4, items 1 to 4). Mathilde Grivot since 2017 rests on the searched card of 4 October (item 5); it stays in the profile and the explain, credited and dated, but comes off the flashcard, where a volatile fact would be memorised as permanent, and the lineup asks the sommelier to confirm it. Refuted and repaired: "Les Charmois ... just south of the town" added a "just" the searched card does not carry ("south of the town"); it now matches the card. "Echézeaux is a grand cru on the slope beside Vosne-Romanée, above the Clos de Vougeot" was loose in the way item 6 and the expert knowledge line describe; the profile now says the grand cru is sold under its own name and lies in the commune of Flagey-Echézeaux, on the slope between Vosne-Romanée and the Clos de Vougeot (expert knowledge, as in section 4). The winelistFix stands: it dates the lead and the lineup asks to confirm it.

5. Tollot-Beaut. The family domaine in Chorey-lès-Beaune, the ripe style with new oak and every bottling named trace to the wine list and the pack (section 5, items 1, 4 and 5). Refuted as overreach: "Its grand crus are on the Corton hill: the red Corton Bressandes and the white Corton-Charlemagne" claimed the whole of its grand crus; the sources show only the bottles on our list, so the fact now says the wine list carries those two. The library trap "the domaine's premiers crus come from Savigny and Beaune" made the same exhaustive claim; it now says every premier cru the domaine makes comes from a neighbouring village, which follows from Chorey having none. Founded, family and farming stay empty.

6. Joseph Drouhin. 1880, the Beaune cellars, the Clos des Mouches in both colours, the Laguiche Montrachet, the farming, Robert Drouhin, Véronique Drouhin and Oregon in 1987 trace to the Codex (section 6, items 1 to 7). Repaired as an ambiguous relation: "a rematch of a Paris tasting, in which The Eyrie Vineyards' 1975 South Block ... placed second" could be read as second in the Paris tasting itself; the Eyrie record places it second in the 1980 rematch, after the 1979 Gault-Millau tasting in Paris (item 6), and the history now says so. The producer list's library:null for Drouhin is a mapping slip: the Codex holds p-maison-joseph-drouhin, so no library entry is offered.

7. Georges Roumier. 1924, Chambolle-Musigny, Bonnes-Mares from both soils, the Musigny sliver, Les Amoureuses and the Clos de la Bussière monopole in Morey-Saint-Denis trace to the Codex (section 7, items 1 to 4). Refuted, a plausible relation: "the estate's most affordable red" for the Clos de la Bussière. The house's own list contradicts it vintage for vintage: Roumier's village Chambolle-Musigny 2022 is $450 against $550 for the Bussière 2022, and the 2023 is $475 against $585 (V1, entries 1674, 1675, 1737 and 1738). It is removed from the explain, the history and the facts, and a note tells the floor never to say it. The pack's "the most approachable Roumier on our list" for the 2014 at $320 is true by the list's prices and stands. Softened, a plausible owner: "It also holds Ruchottes-Chambertin". The Codex lists it among the holdings, but expert recollection, not confirmed, is that Roumier's Ruchottes-Chambertin comes from a parcel the domaine farms for its owner rather than owns, and is bottled under Christophe Roumier's own name; the profile now says only that the range includes a Ruchottes-Chambertin. The new component's "Its grand crus, Bonnes-Mares and a sliver of Musigny" read as the whole list; it now says "among them". The Codex record's wine note "the estate's most affordable red" should be reconsidered in the library.

8. Marquis d'Angerville. The Clos des Ducs monopole beside the domaine, Sem d'Angerville and the 1930s, biodynamic farming, the pale style, the Pélican in 2012 and the Meursault Santenots on the wine list all trace to the Codex, the content fix and the wine list (section 8, items 1 to 9). Softened: "the premiers crus most often argued for promotion" turned the Codex's "argue the case" into a superlative no source measures; it now says they are among the premiers crus argued to deserve promotion. The component wine-story-dangerville-pelican stands.

Library entries: p-dom-tollot-beaut and p-dom-robert-damien-martin duplicate no name or id in WINE_PRODUCERS (V5), use a real heading, and carry no ownership, hectares, current winemaker or recent vintage; the Damien Martin founding year is the searched 1982 (section 1).
