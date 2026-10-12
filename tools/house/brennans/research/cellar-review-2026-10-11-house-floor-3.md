# Cellar review, house floor 3: floor bottles 120 to 179 (11 October 2026)

## Scope and method

The batch is the sixty wines whose list is bottle, counted in pack order from 0, numbers 120 to 179: from F.E. Trimbach Pinot Gris ‘Réserve Personnelle’ 2007 (pack index 154) to Dominio de Pingus ‘Flor de Pingus’ Ribera del Duero 2022 (pack index 213), read in the shipped pack, shared/packs/brennans-new-orleans.v1.oothouse.json on the site. Every card was read in full: producer, wine, vintage, region string, grapes, style, profile, serve and the 10 second line first, then origin, parts, the timed lines, the guest line and the kept notes wherever one of those carried the same error.

The sweep was for errors only. Nothing thin was rewritten. Where a card's own research file (research/producers-cellar-*-2026-10-10.md) had already named an error "for the build's overrides, not patched here", and the pack still carried it, it is filed here. Where the same wrong claim stood in several fields of one card, every field carrying it is repaired, so the card does not contradict itself.

How to read the JSON. Each entry is a replace whose from is the exact current text, proved byte for byte against both the shipped pack and the model text in overrides.json (the wine:+ add and the kept add entries) by a node script, which also counted the words of every timed line after the change (the largest is 90 words in an s45, and no s10 passes 19). Two field names are the model's, not the pack's: the guest line is sayIt, and kept.N counts the kept add entries in the order overrides.json files them (0 Tell me about it., 1 How do I sell it?, 2 What do guests ask?, 3 What should I watch for?, 4 How do I pour it?), not the pack's alphabetical order.

Seventy entries over twenty wines; forty wines stand as they are. No name, vintage, price, bin or producer string is touched, and no stem changes.

## 1. The four Birth Year bottles were not bottled in 1946

Entries 1 to 12: Château Latour Pauillac Premier Cru Classé 1946 (profile, lines.s10, lines.s20, sayIt), Château Trotanoy Pomerol 1946 (profile, lines.s10, sayIt), Château-Figeac Saint-Émilion Premier Grand Cru Classé 1946 (lines.s20, sayIt) and Château Canon Saint-Émilion Premier Grand Cru Classé 1946 (profile, lines.s10, sayIt). "bottled the year Brennan’s opened" becomes "harvested the year Brennan’s opened".

Source: research/producers-cellar-bordeaux-right-2026-10-10.md, section 10, the expert line: "a 1946 red Bordeaux was harvested in the autumn of 1946 and spent its first years in barrel, so it was bottled later, not in 1946. The pack's lines "bottled the year Brennan’s opened" (w-ifeuldxp, w-h4dmq6ms and w-ahurh184, the guest, profile and s10 or s20 lines) should read "from the 1946 harvest" or "from the year Brennan’s opened"". The Latour 1946 is profiled with the Left Bank (research/producers-cellar-bordeaux-left-2026-10-10.md, section 10) and carries the same words in four fields; the same reasoning holds for it. A vintage is the year of the harvest.

## 2. Château Latour 1946: a living owner, undated

Entries 13 and 14: origin and kept.0.a (Tell me about it.). "is owned by François Pinault" and "today it is owned by François Pinault" are cut; the 1855 ranking stays.

Source: research/producers-cellar-bordeaux-left-2026-10-10.md, section 10: "Not confirmed: the 1993 date of the Pinault family's purchase rests on the card of 4 October, marked knowledge, not a search"; and the floor notes: "Give owners only with their dates". The card named a living person as the present owner with no date, against the house rule that no living person is named as a volatile fact, and on a 1946 wine made long before that ownership, where a guest could hear the owner as its maker. Nothing is added in its place.

## 3. Château Mouton-Rothschild 2005: the only promotion, not the only change

Entries 15 to 18: origin, lines.s45, kept.0.a and kept.2.a. "the only change ever made to the 1855 classification" becomes "the only promotion ever made in the 1855 classification".

Source: the Codex, as quoted in research/producers-cellar-bordeaux-white-sweet-2026-10-10.md, section 1, item 4: "At its creation, the 1855 list named how many First Growths? ... Mouton's 1973 promotion took the number to five, where it stands." The card's "only change" came from the unsearched card of 4 October (research/producers-cellar-bordeaux-left-2026-10-10.md, section 7, item 6, "producer history, certain"). Expert knowledge, held with certainty: Château Cantemerle was added to the fifth growths in 1856, a year after the list was drawn up, so the 1855 classification has been changed twice, and the elevation of 1973 is its one promotion. The new wording carries no name or year that the card did not already hold.

## 4. Echézeaux lies in Flagey-Echézeaux

Entries 19 and 20: the region strings of Domaine Jean Grivot Echézeaux Grand Cru 2011 and Domaine de la Romanée-Conti Echézeaux Grand Cru 2015, "Vosne-Romanée, Côte de Nuits, Burgundy, France" to "Flagey-Echézeaux, Côte de Nuits, Burgundy, France". Entry 21: the Grivot s45, "Echézeaux is one of its Grand Crus" (its: Vosne-Romanée's) to "Echézeaux is a Grand Cru beside it".

Sources: research/producers-cellar-red-burgundy-2026-10-10.md, section 4, expert knowledge: "Echézeaux is a grand cru appellation in its own right, sold under its own name; it lies in the commune of Flagey-Echézeaux, and it is that commune's village and premier cru wine, not the grand cru, that is sold as Vosne-Romanée." research/producers-cellar-grand-burgundy-beaujolais-2026-10-10.md, section 2, item 9, the Codex: "Echezeaux and Grands Echezeaux lie in Flagey-Échezeaux, not in Vosne-Romanée"; and its list of pack errors: "DRC Échezeaux (w-1mkmk9j0): the wine's region reads "Vosne-Romanée, Côte de Nuits", while the Codex and the component place Échezeaux in the commune of Flagey-Échezeaux". The region string names the commune first, as every other Burgundy bottle does (Chambolle-Musigny for the Musigny, Puligny-Montrachet for the Chevalier-Montrachet); the commune spelling follows the pack's own Echézeaux. The origins ("a Grand Cru beside Vosne-Romanée") already say it rightly and stand.

## 5. Domaine Jean Grivot: a living winemaker, undated, and a "just" no source holds

Entries 22 to 25: Les Charmois 2013, origin and kept.0.a; Echézeaux 2011, origin and kept.0.a. "run today by Mathilde Grivot" and "run by Mathilde Grivot" are cut; "just south of the town" becomes "south of the town".

Source: research/producers-cellar-red-burgundy-2026-10-10.md, section 4, item 5, the searched card: "Domaine Jean Grivot is a family domaine in Vosne-Romanée, run since 2017 by Mathilde Grivot. Les Charmois is a village-level Nuits-Saint-Georges vineyard south of the town"; and Verification, item 4: "the leadership is a dated fact that can change ... Refuted and repaired: "Les Charmois ... just south of the town" added a "just" the searched card does not carry ("south of the town")". The pack named her with no date, as the present head, while the lineup already asks to confirm it (the ask "Has Mathilde Grivot led Domaine Jean Grivot since 2017 ...?"). Under the house rule the name comes off the card until the sommelier settles it; the family domaine stays.

## 6. La Tâche and Romanée-Conti do not touch

Entries 26 to 29: La Tâche 2012, origin, lines.s45, kept.0.a and kept.2.a. Entry 30: Romanée-Conti 2014, kept.0.a. "beside the Romanée-Conti vineyard", "side by side in Vosne-Romanée" and "La Tâche, lies beside it" become a few rows apart, with the narrow La Grande Rue between them.

Source: research/producers-cellar-grand-burgundy-beaujolais-2026-10-10.md, "What this pass changes in the existing components and the pack": "La Tâche card (w-kn4fuubp): "La Tâche, lah TAHSH, is a Grand Cru in Vosne-Romanée, beside the Romanée-Conti vineyard" should read "a Grand Cru in Vosne-Romanée, a few rows from the Romanée-Conti vineyard, with the narrow La Grande Rue between them". The Codex says three times that La Grande Rue runs between them (section 2, item 8)." "Romanée-Conti card (w-au9xfxhe): "the other monopole, La Tâche, lies beside it" should read "the other monopole, La Tâche, lies just across the narrow La Grande Rue"." And under Verification: "La Tâche, w-kn4fuubp: "What do guests ask?" says the two monopoles are "side by side in Vosne-Romanée", the same error as the card".

## 7. Domaine Armand Rousseau: an overclaim, an unconfirmed wall, and a Santenay that is not Rousseau's

Entries 31 to 34: origin, lines.s45 and kept.0.a, "the family domaine that made Gevrey-Chambertin's name" (and "that made the village's name") becomes "at the head of nearly every list for Gevrey-Chambertin" (for the village); kept.0.a, "a walled Premier Cru" becomes "a Premier Cru". Entries 35 and 36: kept.2.a and kept.3.a, the Santenay.

Sources: research/producers-cellar-grand-burgundy-beaujolais-2026-10-10.md, "What this pass changes ... the pack": "Rousseau card (w-aip7138a): "the family domaine that made Gevrey-Chambertin's name" is stronger than any source; the Codex's "at the head of nearly every list for the village" (section 3, item 3) is the safe form. "A walled Premier Cru" is unconfirmed (section 3, item 10)". And under Verification, "Two more errors in the pack": "Rousseau, w-aip7138a: "What do guests ask?" says the list "prints the Clos Saint-Jacques and a Santenay under the Rousseau name", and "What should I watch for?" asks whether the Santenay is the same domaine. Entry 2138 is Domaine Jacques Girardin's Santenay Premier Cru "Clos Rousseau", a different producer; the answer should say the Clos Saint-Jacques is our only Rousseau wine." The $150 the card prints for the Santenay is kept as it stands.

## 8. Domaine Coudert: no source confirms walls at the Clos de la Roilette

Entries 37 to 43: style, profile, origin, parts.main, lines.s45, kept.0.a and kept.2.a. "walled" is cut; the style reads "Cru Beaujolais from a single vineyard".

Sources: research/producers-cellar-grand-burgundy-beaujolais-2026-10-10.md, Verification, item 7: "Coudert, "walled". The only sources for walls at the Clos de la Roilette are research/bottle-facts-cards-b-2026-10-04.json (trade knowledge, not searched), the pack's card and the components that repeat them ... Section 3 already refused "walled" for Rousseau's Clos Saint-Jacques on sources of the same kind, so the same rule applies here." The same file asks for "the Clos de la Roilette's walls" to be searched. Search 2 of this pass did so (below): the merchant and importer pages it returned (The Wine Society, Flatiron Wines, La Paulée, iDealwine) describe the clos as a lieu-dit of about nine hectares on the Moulin-à-Vent border, bought by Fernand Coudert in 1967, and none mentions a wall. The lineup already asks ("Is the Clos de la Roilette walled ...?"). The Codex compare line on this card, "A cru Fleurie from a walled clos, floral and light.", is built outside overrides.json and is not filed here; whoever owns that line should drop the word in its source.

## 9. René Rostaing Ampodium 2012: mostly destemmed, and no longer René's to farm

Entries 44 to 47: profile, parts.technique, lines.s45 and kept.0.a lose "made with whole bunches"; the s45 and kept.0.a speak of the domaine, not of René Rostaing as today's grower. Entry 48: origin, "René Rostaing is a grower in Ampuis" becomes "René Rostaing's domaine is at Ampuis".

Sources: research/producers-cellar-rhone-north-2026-10-10.md, "What this pass changes in the existing components": "The pack's card for the Rostaing Ampodium 2012 says it is "made with whole bunches", and its profile "made with whole bunches"; the Codex says the opposite ("Destemmed fruit") and the search that supports whole bunches is undated"; and Verification, item 9: "René Rostaing is a grower at Ampuis" says he works the vines today ... Now "René Rostaing's domaine is at Ampuis"". Search 3 of this pass (below): the Farr Vintners listing for this very vintage, https://farrvintners.com/wine.php?wine=39710, describes the 2012 as a mostly destemmed blend from René's thirteen terroirs, while the whole-cluster accounts (Vinous on the 2021, the domaine's sheet for the 2022, Wine Spectator's profile of the domaine under the next generation) belong to later vintages. So "whole bunches" is wrong for our bottle. The lineup question on whole bunches already filed can be answered from this; who runs the domaine today is left to it.

## 10. Alain Graillot: Crozes-Hermitage is not the hills around Hermitage

Entry 49: profile, "Crozes-Hermitage, the hills around Hermitage" becomes "Crozes-Hermitage, the larger appellation around the hill of Hermitage". Entries 50 to 52: lines.s45, kept.0.a and kept.2.a, "appellation in the hills around" becomes "appellation around".

Source: research/producers-cellar-rhone-north-2026-10-10.md, "What this pass changes in the existing components": "The pack's profile for the Graillot calls Crozes-Hermitage "the hills around Hermitage"; Graillot's vines are on the flat Chassis plain (section 3, items 1 and 4)." The whole bunches stay: the same file's Verification lists Graillot's "Chassis plain, Pont-de-l'Isère, whole bunches and neutral wood" among the claims checked and standing.

## 11. André Perret: not the southern end of Condrieu

Entries 53 and 54: origin and kept.0.a. "André Perret farms in Chavanay at the southern end of Condrieu" (and "at its southern end") becomes "André Perret's domaine is at Chavanay, in the south of the Condrieu appellation" (of the appellation).

Source: research/producers-cellar-rhone-north-2026-10-10.md, Verification, item 6: "At the southern end of Condrieu" is the importer's phrase as the searched card gives it, but the appellation continues south of Chavanay (expert knowledge), so the superlative is not used: the profile, component and library entry now say "in the south of the Condrieu appellation""; and item 7: "The present-tense "André Perret farms" became "André Perret's domaine is at Chavanay": the 1982 handover is searched, who works the vines today is not."

## 12. Château Rayas 2011: the serve line

Entry 55: serve, "; it is often poured straight." is cut, leaving "The sommelier decides on decanting."

Source: research/producers-cellar-rhone-south-roussillon-2026-10-10.md, Verification, item 7: "Château Rayas, "Rayas is often poured straight". The pack says it "often shows best poured straight, as the sommelier decides", but no source supports it as a fact about the estate; cut, leaving decanting to the sommelier." The lineup already asks whether it is decanted or poured straight.

## 13. Château de Beaucastel Oenothèque 2007: storage is never certain

Entries 56 to 59: kept.0.a (twice), kept.2.a and lines.s45. "so the storage is beyond question", "so the storage is certain" and "so its storage is beyond question" are cut; "with certain provenance" becomes "released from the estate's own cellar"; and "labeled with the date they left the cellar", which the lineup is still asked to confirm, comes out with the first of them.

Source: research/producers-cellar-rhone-south-roussillon-2026-10-10.md, Verification, item 3: ""So its storage is beyond question" promises the state of a bottle after release, which no source can; cut (the same overclaim stands in the pack's Tell me about it card and its What do guests ask card, "so the storage is certain", for the pack's owner to soften)." The open ask: "Does the Beaucastel Oenothèque 2007 label show the date it left the château's cellar ...?"

## 14. Château Haut-Bages Libéral 2018: a living manager, undated

Entries 60 and 61: origin and kept.0.a. "run by Claire Villars-Lurton" is cut; the parcel beside Latour and the certification stay.

Source: research/producers-cellar-bordeaux-left-2026-10-10.md, section 3: "Claire Villars-Lurton is named only with the card's date, and who runs an estate can change"; and Verification, item 5: "A note now dates Claire Villars-Lurton and the 2019 certification to the card of 4 October 2026 and says both can change." The pack named her undated as the present manager, against the house rule.

## 15. Flor de Pingus 2022: a living owner in the 10 second line, and old vines that are Pingus's

Entry 62: lines.s10, "from Peter Sisseck’s Ribera del Duero estate" becomes "the second wine of a cult Ribera del Duero estate". Entry 63: sayIt, the same. Entries 64 and 65: profile, "from old vines around La Horra" becomes "from younger and other vineyards around La Horra"; parts.technique loses "old vines". Entries 66 to 68: origin, kept.0.a and lines.s45, the founder keeps his name with the year of the founding ("created in 1995 by"), and the s45's present-tense "made by" becomes "created in 1995 by".

Source: research/producers-cellar-spain-2026-10-10.md, section 4, item 1, the Codex: founded "1995"; holdings "Old bush-vine Tinto Fino parcels at La Horra, farmed biodynamically"; and "Flor de Pingus", "the second wine, from a wider set of La Horra parcels". Item 2: "Dominio de Pingus was founded by which Dane in 1995?" Answer "Peter Sisseck". The card's own Tell me about it says Flor comes "from younger and other vineyards", which the profile's "old vines" contradicted. "Peter Sisseck’s estate" named a living person as the present owner in the 10 second line and the guest line; the dated founding is the safe fact.

## 16. Marcel Lapierre Morgon 2023: who leads the estate today

Entries 69 and 70: origin and kept.0.a. "his children run it now" and "his children run the estate today" become "his children took the estate on".

Source: research/producers-cellar-grand-burgundy-beaujolais-2026-10-10.md, Verification, item 12: ""His children run the domaine now" rests on the wine list's authored line and an unsearched trade-knowledge record. Now history: "his children took the domaine on", with a note that who leads it can change."

## Searched and left standing

- Clos Sainte Hune is walled. Search 1 (below) returned merchant notes (J.J. Buckley, Wine Dispensary) describing a stone wall around the vines, a walled parcel inside the Rosacker grand cru, as the Codex question c-qzkt8t21 already says ("a walled plot of a little over a hectare and a half at Hunawihr"). research/producers-cellar-alsace-jura-mosel-2026-10-10.md listed "whether Clos Sainte Hune is walled" among its searches owed; this answers it, and the nine fields of the Trimbach card that say walled stand.
- Everything else in the forty untouched cards was held against its producer research and stands: the region strings (each the commune or appellation, then the sub-region where the other bottles give one, then the region and the country), the grapes, the styles, the serve lines and the 10 second lines, the ages counted from 2026, Figeac's 2022 rank, Pichon Lalande's 2007 owner, Canon's 1996 owner, the Bellegrave and Clos L'Église purchase years, and the Vin Jaune's ageing as the Codex gives it.

## Searches (three of the four allowed, standard mode, 11 October 2026)

1. "Trimbach Clos Sainte Hune walled vineyard Rosacker Hunawihr": https://www.jjbuckley.com/wine/2014-domaine-trimbach-riesling-clos-ste-hune/2014-8898-750/ and https://winedispensary.com/products/f-e-trimbach-riesling-clos-sainte-hune-alsace-france (walled parcel inside the Rosacker).
2. "Coudert Clos de la Roilette Fleurie walled clos Moulin-à-Vent border history": https://www.thewinesociety.com/product/fleurie-clos-de-la-roilette-2022, https://nyc.flatiron-wines.com/collections/clos-de-la-roilette, https://www.lapaulee.com/clos-de-la-roilette and https://www.idealwine.net/le-clos-de-la-roilette-le-marquis-et-ses-fleuries-gourmands/ (about nine hectares on the Moulin-à-Vent border, Fernand Coudert from 1967; no wall named).
3. "René Rostaing Côte-Rôtie Ampodium destemmed or whole cluster vinification": https://farrvintners.com/wine.php?wine=39710 (the 2012 mostly destemmed), with https://www.winespectator.com/articles/pierre-rostaing-profile-syrah-wine-cote-rotie-northern-rhone and https://www.ventealapropriete.com/en/vente/ficheproduit/RRO0053 for the later whole-cluster vintages.

## Lineup questions no source settled

ask: Does the Pétrus 1980 (bin 21131) carry a little Cabernet Franc, as the estate grew some in those years, or is it all Merlot as our card lists it?
ask: Does the Fèlsina Rancia 2019 (bin 16433) label read Chianti Classico Riserva, as the list prints, or Chianti Classico Gran Selezione?
