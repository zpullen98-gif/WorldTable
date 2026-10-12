# Cellar review, house menu 1 (11 October 2026)

Batch house-menu-1: the first half of the house's glass wines and menu bottles, the wines in the shipped pack (shared/packs/brennans-new-orleans.v1.oothouse.json) that carry no list key, in house order, indices 0 to 16. Seventeen wines, every card read line by line as a server will say it: the three timed lines, the five parts, profile, serve, goes with, first picks against the dishes' pairings, say it, why, origin, the kept notes, and every dish pairing that names the wine by id (first pick, second choice) or by name in a step up.

1. Brennan's Essential by Piper-Heidsieck Extra Brut NV (w-dbz9e960)
2. Pierre Sparr Brut Rosé Crémant d'Alsace NV (w-rygz99uh)
3. Rare Brut 2012 (Coravin) (w-t1pktzym)
4. Charles Lafitte Brut Champagne NV (w-3yaps1gt)
5. Argyle Brut Willamette Valley 2022 (w-nb66m5o8)
6. C.H. Berres 'Old Vines' Riesling 2022 (w-5luyxb98)
7. Pazo das Bruxas Albariño 2025 (w-naty4r19)
8. Famille Durand Val de Loire Sauvignon Blanc 2024 (w-2zij5duw)
9. Gainey Estate Vineyards Chardonnay 2023 (w-uw1bb9ax)
10. Domaine Leflaive Mâcon-Verzé 2022 (Coravin) (w-iuzjmgz4)
11. Fichet 'Château London' Mâcon-Igé 2024 (w-w23cntcx)
12. Minuty 'Prestige' Côtes de Provence Rosé 2024 (w-fesbm1v5)
13. Damien Martin Bourgogne Pinot Noir 2023 (w-y0ihoyc7)
14. Louis Jadot Beaune 1er Cru 2023 (w-q71pquzd)
15. Domaine de Durban Beaumes-de-Venise Rouge 2024 (w-j69emzt9)
16. Domaine de Châteaumar 'Cuvée Vincent' Côtes du Rhône 2023 (w-u49o02ii)
17. Moulin d'Issan Bordeaux Supérieur 2021 (w-qwrup3j0)

Twenty-five replace entries, in cellar-review-2026-10-11-house-menu-1.json beside this file. Nine of the seventeen cards needed none: Pierre Sparr, Charles Lafitte, Argyle, Pazo das Bruxas, Gainey, Leflaive, Minuty, Jadot and Durban stand as written (two observations on Argyle and Gainey are under "Seen and not filed").

## How the entries were proved

Every from was matched twice by a node script (kept in the session scratchpad, not in the repo):

- byte for byte against the shipped pack, the field the card prints (a kept note found by its question, a dish pairing under pairing.value, the rest under value);
- against the builder's model as it stands after every entry of overrides.json and before the spelling map and the dash pass, made by a copy of build-brennans.mjs that stops after the override loop and writes nothing in the repo. That proves the builder will find each from where the entry points.

The script also held each from free of any word the spelling map changes and of any dash, so the replaced span is the same text before and after the passes; each to free of a dash, of a British form, of a banned word, of the provenance words and of any name or year the content gate cannot find; and every changed note, line and part inside its band after the replace (the kept bands, the 25, 50 and 110 word caps with their floors, fourteen words a part, the watch note's closing sentence). All twenty-five passed.

The kept index in each field is the builder's, not the pack's. The builder holds the kept notes in the order the overrides added them; the pack is reordered afterwards. So the Essential's What should I watch for? is kept.4 to the builder and kept.5 in the pack, its bespoke-blend note kept.0 and kept.2. Each entry below names its question so a reader can find it in the pack.

## Searches

Three WebSearch calls, standard mode, 11 October 2026, of the four allowed.

S1. "Moulin d'Issan Bordeaux Supérieur Merlot Cabernet Sauvignon blend Château d'Issan". The importer's technical sheet for the 2021 (enotria.com, products/pdf/chateau-d-issan-bordeaux-superieur-moulin-d-issan-2021): "GRAPE VARIETIES Merlot (90%), Cabernet Sauvignon (10%)". A Touton listing of the 2018 (mtouton.com) gives the same figures. One UK wholesaler (matthewclark.co.uk) gives 50 per cent each, the outlier. The fruit comes from a vineyard near the Gironde rather than in Margaux proper, so it is labelled Bordeaux Supérieur; about 14 months in French oak, 25 per cent new (summary). The tool's summary also called it the château's second wine; that is wrong (Blason d'Issan is the second wine, research/producers-cellar-bordeaux-left-2026-10-10.md, section 1, expert knowledge) and is not used.

S2. "Domaine de Châteaumar Châteauneuf-du-Pape Cuvée Vincent Côtes du Rhône Syrah". Nothing on Châteaumar came back; the results were other producers. No source shows a Châteaumar Châteauneuf.

S3. "Weingut C.H. Berres Ürzig family since 1510 generations". The Mosel tourism pages for the Winery and Guest House C.H. Berres (en.piesport.de/poi/winery-and-guest-house-ch-berres/poi.html and en.graach.de, the same listing) and glossary.wein.plus/berres: "Historical records reveal the Berres family has lived and worked in Ürzig's vineyards since 1510" (summary). The same results trace the estate itself to Peter Nicolay, one of the first large private estates in Ürzig after the secularisation under Napoleon, the name becoming C.H. (Carl Hubert) Berres through marriage and inheritance, and the estate divided by inheritance in 1986 (summary). So the 1510 date belongs to the family's work in Ürzig's vineyards, not to the estate as named. The search also names the present generation; nobody living is named in any entry.

## The entries, each with its source and passage

E1. Brennan's Essential, What should I watch for? (builder kept.4). The note left the breakfast tasting pour open ("a lineup question too"); it now names Charles Lafitte Brut, 4 oz, with the double-pour warning, and keeps the house Champagne for the Hussarde à la carte.
Source: guide.txt, the Eggs Hussarde page: "SERVE Pour as the eggs are fired. On the Traditional Breakfast the included pour is Charles Lafitte Brut, 4 oz, don't double-pour. À la carte, Piper-Heidsieck by the glass in a tulip." and its service note: "On the breakfast tasting it comes with a 4 oz pour of Charles Lafitte Brut." (the guide's dash written here as a comma). pages/brennans-tasting-menus-pasted-2026-10-05.txt: "Third Course / Egg Hussarde / ... / Paired with / Charles Lafitte Brut ChampaPAgne FR NV [4oz]". The pack's own Traditional Breakfast note and the Charles Lafitte card say the same. The lineup ask that weighed the Charles Lafitte against the Essential stays filed; the menu of 5 October answers it.

E2. Brennan's Essential, Is it a bespoke blend or the Essentiel under our label? (builder kept.0). "cuvee" twice becomes "cuvée", the spelling of the card's other notes and of the house. No name or year changes.

E3. Eggs Hussarde, pairing.palate. "the Pinot-based body" claimed a proportion for the house Champagne, whose cuvée and blend wait on the sommelier. Now "the body its Pinot Noir and Meunier give it".
Source: the card's grapes (Pinot Noir, Meunier, Chardonnay) and build-brennans.mjs, the guide's metadata for the wine: "Traditional method, a blend of the three Champagne grapes, Extra Brut; the lees age and the dosage wait on the sommelier confirming which cuvée is in the bottle".

E4. Rare, why. The why printed the pairing field's name, "the stepUp on the oysters", as a word a server reads aloud. Now "the upgrade we offer with the oysters, the turtle soup, the Hussarde and the omelette". No fact changes.

E5. Rare, What is Rare, in one breath? (builder kept.0). "prestige cuvee" becomes "prestige cuvée".

E6. Grand Isle Jewel Oysters, pairing.stepUp. The step up still called Rare "Piper-Heidsieck's prestige vintage Champagne, Chardonnay-led from Grand Cru vineyards", the two claims the producers deep dive took off the Rare card itself. Now "a prestige vintage Champagne that began at Piper-Heidsieck and is now its own house, Chardonnay-led from grand and premier cru villages", the card's own wording.
Source: research/producers-cellar-champagne-menu-2026-10-10.md, section 2, item 3: "Rare became its own brand in September 2018, previously labelled, marketed and sold under the Piper-Heidsieck name, and it is now managed separately." Item 5, Rare Millésime 2013: "70 percent Chardonnay and 30 percent Pinot Noir from across 11 crus, including seven grand cru and three premier cru sites". The Rare card's overrides already rest on the same section.

E7. C.H. Berres, Tell me about it. (builder kept.0). The 1510 date stands, now confirmed (S3), but it is the family's date in Ürzig's vineyards, not the estate's, and the sentence doubled the Mosel. Now "a family estate at Ürzig in the Middle Mosel, and the Berres family has worked Ürzig's vineyards since 1510."
Source: S3 above. Before it: research/producers-cellar-alsace-jura-mosel-2026-10-10.md, section 4, item 6: "The family dates its winemaking to 1510 ... labelled (expert, medium)", "Not used as a fact; a lineup question." S3 settles that question's date half; the profile's "a family with roots to 1510" and the guest answer's "an old family estate" are true as written and are left alone.

E8 and E9. Famille Durand, How do I pour it? (builder kept.5) and Tell me about it. (builder kept.1). Both respelled Durand "dur-AHN" while the say line gives "fah-MEE doo-RAHN". One sound now: doo-RAHN.
Source: research/master-review-somm-2026-10-04.md: "(expert) Famille Durand is fah-MEE doo-RAHN"; research/gap-fill-5.md (as quoted in research/producers-cellar-provence-loire-2026-10-10.md, section 4, item 8): "Durand is nasal with a silent d: dü-RAHN."

E10, E11 and E13. Fichet, profile, Tell me about it. (builder kept.0) and What do guests ask? (builder kept.2). "Some vines over a hundred years old" has no source; Château London is a named slope several producers bottle, not Fichet's own parcel; and the castle question now has its sourced answer, the rue Landon.
Source: research/producers-cellar-chablis-maconnais-2026-10-10.md, section 1, item 7: "Château London is a named slope shared by several producers: Hachette calls it a coteau réputé d'Igé in a Fichet note ... Jean-Claude Boisset bottles a Mâcon-Igé Château London too"; item 8: "Boisset's 2021 sheet says Château London is not a brand name, but a vineyard whose name refers to the fact that its original owner lived in rue Landon in Paris. Over time, Landon became London"; item 10: "The search didn't turn up any source describing Château London vines as 100 years old or as centenarian ... the 86-year figure is the nearest, for the 2018." Its closing note on the pack: "the Fichet Tell me about it card and the s45 line say some vines over a hundred years old (unsourced) ... left to the build's overrides". The s45 line carries no vine age today and is left alone.

E12. Fichet, Tell me about it. (builder kept.0). The respelling "mah-KAWN ee-ZHAY" sat after the village name Igé alone; now "ee-ZHAY".
Source: research/producers-cellar-chablis-maconnais-2026-10-10.md, section 1, expert knowledge: "Fichet is said fee-SHAY and Igé ee-ZHAY, as the pack prints them".

E14 and E15. Damien Martin, origin and Tell me about it. (builder kept.0). "Run by his son Damien" states a living person's current role with no date, which the house rules keep out, and "about twenty hectares" is an undated size the deep dive declined to use. The founding, 1982 by Robert, and the label name stand: "the label carries the name of his son, Damien".
Source: research/producers-cellar-red-burgundy-2026-10-10.md, section 1, item 1: "Damien Martin Bourgogne Pinot Noir is from Domaine Robert et Damien Martin at Davayé in the Mâconnais: founded 1982 by Robert, run by son Damien, about 20 ha"; its open list: "the domaine's size today (the earlier search's about 20 ha is undated and is not used)"; and its closing note on library entries, which "carry no ownership, hectares, current winemaker or recent vintage".

E16. Damien Martin, What should I watch for? (builder kept.3). "The producer and importer are a lineup question" is stale: the producer is on the card. The open question is where the grapes grow.
Source: research/producers-cellar-red-burgundy-2026-10-10.md, section 1, item 5 ("The earlier doubt, now settled ... The search in items 1 and 2 placed it") and its open list: "Where the grapes for the Damien Martin Bourgogne Pinot Noir grow". The filed ask "Where do the grapes for the Damien Martin Bourgogne Pinot Noir grow" already carries it to lineup.

E17 and E18. Châteaumar, Tell me about it. (builder kept.0) and What should I watch for? (builder kept.3). Both told the server to tell the wine apart from "the estate's Châteauneuf of the same name", a wine no source shows (S2 found nothing either). The real mix-up is the border: the vines touch Châteauneuf-du-Pape, the wine is a Côtes du Rhône.
Source: research/producers-cellar-rhone-north-2026-10-10.md, the open list: "Whether Châteaumar makes a Châteauneuf-du-Pape under the same cuvée name, as the pack's card implies ... the dossier asked it only as a question", and its closing note: "The pack's card for the Châteaumar names the estate's Châteauneuf of the same name as fact; no source in the repositories confirms such a wine (section 2, item 5). Noted only, and asked at lineup." Section 2, item 1, for the border: "100% Syrah from 50 year old vines on two parcels bordering Châteauneuf-du-Pape".

E19 to E25. Moulin d'Issan: profile, lines.s20, lines.s45, parts.main, Tell me about it. (builder kept.0), What do guests ask? (builder kept.2) and What should I watch for? (builder kept.3). The card taught the menu's heading, "a Cabernet Sauvignon blend", as the grapes on every line a guest hears. The château calls the wine Merlot-led, four expert reviews agree, and the importer's sheet for the 2021, the vintage the current menu prints, gives 90 per cent Merlot (S1). Every line now says Merlot-led with Cabernet Sauvignon, the menu's heading is kept as the menu's, and no percentage is given, since the blend moves by vintage and the Binwise list prints the 2023.
Source: research/producers-cellar-bordeaux-left-2026-10-10.md, section 1, item 2: "Moulin d'Issan is the Bordeaux Supérieur grown on Château d'Issan's own estate in Margaux, Merlot led, named for a ruined 17th century windmill, aged with 25% new barrels ... Say Merlot led and give no percentage; the blend varies by vintage and sources disagree"; item 3, the same from the second pass; item 5, the four reviews ("roughly two-thirds Merlot and one-third Cabernet Sauvignon", "normally Merlot-led with Cabernet Sauvignon in support", "Merlot-led ... not Cabernet-led", "typically about two thirds Merlot"); item 1, for parts.main: "Moulin d'Issan comes from d'Issan vineyards on low ground outside the Margaux appellation, hence Bordeaux Supérieur". And S1 for the 2021.

## Seen and not filed

These are true faults that an entry in the shape asked for cannot reach; the integrator decides.

- The Moulin d'Issan grapes field lists ["Cabernet Sauvignon", "Merlot"]. With E19 to E25 it should read Merlot first; that is a set on grapes, not a replace.
- The Creole-Spiced Hanger Steak's pairing.why calls the Moulin d'Issan "A Cabernet-Merlot Bordeaux". In the builder's model that hyphen is an en dash (the dash pass made it a hyphen), so a plain from refuses it; a fromRe entry could make it "A Merlot-led Bordeaux with Cabernet Sauvignon".
- Two comparisons come from components/wines.json, which this review does not touch: the Moulin d'Issan's Codex Bordeaux comparison says "Left Bank Cabernet blend: cassis, plum and cedar" (the wine is Merlot-led, from low ground outside Margaux), and the Argyle's Pacific Northwest comparison says "a speciality of the house since 1987", the British form, which the spelling map does not carry (the house writes specialty).
- The Gainey card holds Sta. Rita Hills in its profile and region while its kept note leaves the appellation to the bottle; Binwise prints "Gainey Estate Vineyards Sta. Rita Hills CA" for the glass (research/producers-cellar-central-coast-oregon-world-2026-10-10.md, section 1, item 6), so both stand, and the filed asks already carry the label question.
- The filed ask "Is our C.H. Berres the importer's Estate Riesling Old Vines, is the vintage still 2022, and can the family's 1510 date be confirmed from the label or the importer?" has its date half answered by S3.

## Lineup questions no source settled

ask: The château calls the Moulin d'Issan Merlot-led and the importer's sheet for the 2021 gives 90 per cent Merlot, yet the current menu and Binwise head it under Cabernet Sauvignon blends: should the menus head it as a Merlot blend?
ask: What vine age may a server quote for the Fichet Château London? No source gives a hundred years; a listing of the 2018 gives 86 years for the oldest vine.
ask: The house respells Famille Durand as doo-RAHN and Domaine de Durban as dur-BAHN, one French first syllable written two ways: which respelling should the floor use for both?
