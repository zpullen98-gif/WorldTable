# Cellar review, 11 October 2026: house-floor-1

Batch house-floor-1 of the bounded pass over the Brennan's bottle cards: the floor bottles 0 to 59 of house.wines in the shipped pack (shared/packs/brennans-new-orleans.v1.oothouse.json on the site, byte for byte the same file as static/shared/packs in WorldTable), counted from 0 over the wines whose list is bottle, from Cesarini Sforza Rosé Brut Trento NV (pack index 34) to Dönnhoff 'Niederhäuser Hermannshöhle' Riesling Auslese Goldkapsel 2023 (375 ml) (pack index 93). The next batch, house-floor-2, begins at Grgich Hills 'Violetta' (floor bottle 60).

Sixty cards read in full. Swept for errors only, field by field: the producer, the wine, the vintage, the region string, the grapes, the style, the profile, the serve and the 10 second line first; then the origin, the parts, the timed lines, the guest line and the kept notes wherever one of those carried the same error, or a house rule (a living person named as a current owner or winemaker, a volatile figure stated as fact) was broken there. Where a card's own research file had named an error "for the integrator" or "left to the build's overrides" and the pack still carries it, it is filed here. Nothing thin was rewritten. No name, vintage, price, bin or producer string is touched, and there are no stem changes.

## How to read the JSON

Twenty-one entries in cellar-review-2026-10-11-house-floor-1.json, over ten wines; fifty wines stand as they are. Each is a replace whose "from" is the current text byte for byte. A node script proved every "from" twice: against the shipped pack, and against the override model rebuilt from overrides.json (each wine:+ add, then every later entry in file order, as house/build-brennans.mjs applies them), and it applied the entries in order to prove a second entry on one field still finds its text. The same script checked that no "from", "to" or reason carries an em dash, an en dash, a dash entity or a spaced double hyphen, that none carries the word the house never prints, and counted the words of every timed line after the change (Rare s10 19, Schramsberg s20 32, Dow's s20 28, Matrot s45 70, Selosse s45 87, Ridgeview s45 88, all inside the floors and caps of 12 to 25, 25 to 50 and 60 to 110).

Field names are the model's, as house-floor-3 explains: the guest line would be sayIt, and kept.N counts the kept add entries in the order overrides.json files them, which for all sixty of these wines is 0 Tell me about it., 1 How do I sell it?, 2 What do guests ask?, 3 What should I watch for?, 4 How do I pour it? (not the pack's alphabetical order, where Tell me about it. is kept[2]).

One WebSearch call of the four allowed was made, standard mode, 11 October 2026 (Ridgeview's soils, section 3). A passage marked (summary) is the search tool's summary of the page, not a quotation of it.

## 1. Matrot Bourgogne Blanc, the region string

Entry 1. Wine: Thierry et Pascale Matrot Bourgogne Blanc 2022 (375 ml), w-3wkj2yfj. Field: region. From "Meursault, Burgundy, France" to "Bourgogne, Burgundy, France".

Why: the wine's appellation is Bourgogne, the regional appellation, not the village appellation Meursault. The Codex card prints the string as the wine's Region line, the line a village Meursault carries, so the card taught the half-bottle as a Meursault, the very confusion its own guest answer warns against. (Corrected at integration: this paragraph said the card linked a Meursault Terroir row. No TERROIR row at any level is named Meursault, and v28Terroir in sommelierscodex/js/codex28.js reads every part of the string, not only the first, so no Terroir link moves.)

Sources and passages:
- research/bottle-facts-cards-a-2026-10-04.json, n708 (the Matrot half, bin 32852): "Bourgogne Blanc is the regional appellation for white Burgundy, Chardonnay."
- research/cellar-review-2026-10-11-house-floor-2.md, the closing notes: "Consistency for the batch before this one: the Matrot Bourgogne Blanc half-bottle, Thierry et Pascale Matrot Bourgogne Blanc 2022 (375 ml) (w-3wkj2yfj), reads "Meursault, Burgundy, France"; by the reasoning of sections 3 and 4 it would read "Bourgogne, Burgundy, France"." Those sections moved the Fichet and Coche-Dury Bourgogne Blancs to "Bourgogne, Burgundy, France".
- The pack: the card's style is "White Burgundy, Bourgogne Blanc, half-bottle"; its What do guests ask? answers "Is this a Meursault?" with "It is from a Meursault family, but the wine is their Bourgogne Blanc, the regional white Burgundy, so it is lighter."; Domaine Faiveley Bourgogne Rouge 2022 reads "Bourgogne, Burgundy, France".

The Meursault home of the family stays in the profile, the parts and the guest line, where it is said as origin, not appellation.

## 2. Schramsberg Blanc de Blancs, North Coast not Napa

Entries 5 and 6. Wine: Schramsberg 'Blanc de Blancs' North Coast 2021 (375 ml), w-ytf0l182. Region: from "Calistoga, Napa Valley, California" to "North Coast, California". lines.s20: from "all Chardonnay sparkling wine from Napa:" to "all Chardonnay sparkling wine from California’s North Coast:".

Why: the wine is labelled North Coast, a multi-county appellation, and the card's own Tell me about it says its Chardonnay comes from across the North Coast. Calistoga is where the winery and its caves stand. The string's first part named the winery's town as the appellation, and the 20 second line called the wine Napa sparkling wine.

Sources and passages:
- pages/binwise-wine-list-2026-10-03.txt, lines 3184 to 3187: "3274 / Schramsberg "Blanc de Blancs" North Coast • 375ml Half-bottle / 2021 / 70"; line 3190: Schramsberg "J Schram" Brut North Coast.
- The pack, the card's kept Tell me about it.: "The Blanc de Blancs is all Chardonnay, drawn from vineyards across the North Coast."
- research/bottle-facts-cards-a-2026-10-04.json, bin 15263 (the Duckhorn half): "its Sauvignon Blanc carries the North Coast appellation, from vineyards across California’s North Coast." The pack writes that wine's string "North Coast, California", and the Mirabelle Brut Rosé North Coast NV the same.
- research/producers-cellar-sparkling-elsewhere-2026-10-10.md, section 3, item 4, whose source is a retailer page for "schramsberg-vineyards-blanc-de-blancs-2020-north-coast"; and item 5 on the house's North Coast sources for its sparkling wines (Carneros, Sonoma Coast, Anderson Valley, Marin, for the Mirabelle).
- research/cellar-review-2026-10-11-house-floor-2.md, section on Chateau Montelena: the same string, "Calistoga, Napa Valley, California", was moved to the wine's own appellation.

The origin and the 45 second line still place the winery in Calistoga, at the north end of the Napa Valley, which is right.

## 3. Ridgeview, the chalk and the family

Entries 11 to 14. Wine: Ridgeview 'Bloomsbury' Brut Sussex NV, w-zowerxpq.
- origin, and the same sentence in kept.0.a: from "Ridgeview is a family sparkling wine estate at Ditchling in Sussex, on the chalk of the South Downs in southern England." to "Ridgeview is a sparkling wine estate at Ditchling in Sussex, in southern England, founded by the Roberts family."
- lines.s45: from "Ridgeview is a family estate at Ditchling in Sussex, on the chalk of the South Downs, and one of" to "Ridgeview is an estate at Ditchling in Sussex, founded by the Roberts family, and one of".
- kept.2.a: from "It is made the same way, on similar chalk, in a cool climate." to "It is made the same way, in a cool climate."

Why: two claims the research had already refused. The chalk: no source places the Ditchling vineyard on the chalk of the South Downs. The family: the business was sold out of administration in February 2026, so "a family estate" in the present tense is stale; who founded it is the dated fact.

Sources and passages:
- research/producers-cellar-sparkling-elsewhere-2026-10-10.md, Verification 2026-10-10, item 2: "The opening "England's sparkling wine pioneers planted on the same chalk that runs under Champagne", the placing of Ridgeview "on the South Downs", and the card's "Both on Champagne's chalk seam" claim chalk under both houses. The only source (research/components-wines-2026-10-05.md, search 52) says that the chalk of the South Downs and of Kent is the seam that runs under Champagne; it puts neither Ridgeview's vineyard at Ditchling nor Chapel Down's base at Tenterden on chalk. The one sourced chalk site is Kit's Coty on the North Downs (section 7, item 4)." The same file closes: "A follow-up pass with search budget should re-search the Ridgeview sale and the soils at Ditchling Common and Tenterden first."
- The same file, What this pass changes, the note for the integrator: "the Ridgeview card says "Ridgeview is a family sparkling wine estate at Ditchling", present tense, which the 2026 sale makes stale (section 8, item 7)".
- The same file, section 8, item 1: "the Sussex Express places the estate at Ditchling, "where Roberts co-founded it with his wife Chris""; "the Roberts couple started the estate in 1995 at Ditchling Common." Item 7: "Administrators completed the sale to QBRidge on 11 February 2026"; "All employees transferred to the purchaser"; the winery stays at Ditchling.
- Search 1, 11 October 2026, "Ridgeview wine estate Ditchling Common vineyard soil clay greensand chalk" (summary): the pages disagree. Wine-wiki pages (https://www.winewithseth.com/winewiki/ridgeview-grosvenor-blanc-de-blancs/, https://www.winewithseth.com/winewiki/west-sussex-ridgeview-wine-estate/) give chalk and Upper Greensand, or chalk, limestone and clay; a tour review (https://thebusinessgroup.co.uk/?p=26383) gives "the chalk and clay soils of the South Downs"; a retailer's Bloomsbury page (https://www.ocado.com/products/ridgeview-blanc-de-blancs-english-sparkling-wine/592168011 and https://wine-republic.co.uk/producer/ridgeview/, the tool did not tie the passage to one) gives vineyards at Ditchling "at 5-65m ASL on clay, limestone, flint, and loam soils" (written here as 5 to 65 metres); one listing (https://www.thegreatbritainguide.com/place/ridgeview-wine-estate/) is machine written and discounted. No soil survey and no page of the estate's own was found. Vineyards at 5 to 65 metres lie below the Downs, whose chalk scarp rises well above them (expert knowledge), so "on the chalk of the South Downs" is not something a server can say.

The Bloomsbury's grapes, the traditional method and the hollandaise pairing stand. The Chapel Down card's compare line "Both are English traditional method sparkling wine on Champagne's chalk seam" is a component's and out of this batch; the research's fix already covers the component.

## 4. Dow's 2000, the years in bottle

Entries 19 and 20. Wine: Dow’s Vintage Port 2000 (375 ml), w-8ht6rqnn. profile: from "with firm tannin softened by twenty-five years in bottle." to "with firm tannin softened by long years in bottle." lines.s20: from "is vintage Port with twenty-five years of age:" to "is vintage Port with long bottle age:".

Why: a count of years is volatile, and this one is already off. The 2000 was harvested in 2000 and bottled after about two years in wood, so in October 2026 it has about twenty-four years in bottle and twenty-six from the harvest; next year either figure is wrong again. The card's own 45 second line already says "softened by years in bottle", and its Tell me about it "its tannin softened by age".

Sources and passages:
- research/producers-cellar-port-madeira-2026-10-10.md, section 1, item 5, the Codex's i-z2kwbmwl: "Bottled after about two years in wood and then left to mature for decades in glass, this style is declared only in exceptional years", answer Vintage Port. Item 4: the 4 October card for this half: "vintage Port is made only in declared years (2000 was widely declared) and ages mostly in bottle, throwing sediment."
- The pack, the same card: lines.s45 "with firm tannin softened by years in bottle"; kept Tell me about it. "its tannin softened by age".

## 5. Matrot, who runs the domaine

Entries 2 to 4. Wine: Thierry et Pascale Matrot Bourgogne Blanc 2022 (375 ml), w-3wkj2yfj.
- origin: from "Thierry and Pascale Matrot run a family domaine in Meursault, in the Côte de Beaune; this half-bottle is their Bourgogne Blanc." to "Matrot is a family domaine in Meursault, in the Côte de Beaune, whose label carries the names of Thierry and Pascale Matrot; this half-bottle is its Bourgogne Blanc."
- lines.s45: from "Thierry and Pascale Matrot run a family domaine in Meursault, in the Côte de Beaune, and their Bourgogne Blanc is" to "Matrot is a family domaine in Meursault, in the Côte de Beaune, and its Bourgogne Blanc is".
- kept.0.a: from "Thierry and Pascale Matrot run a family domaine in Meursault, one of the great white wine villages of the Côte de Beaune." to "Matrot is a family domaine in Meursault, one of the great white wine villages of the Côte de Beaune, and the label carries the names of Thierry and Pascale Matrot."

Why: the card named two living people as running the domaine today, which the house never states, and which the research found is no longer so. The label still carries their names (the wine's own name), which is said as the label, the way the house-menu-1 review handled the Damien Martin label.

Sources and passages:
- research/producers-cellar-white-burgundy-cote-2026-10-10.md, section 3, item 5: "Sisters Adèle and Elsa Matrot took over from their father, Thierry Matrot, in the 2016 vintage." Item 4: the estate was known as Domaine Pierre Matrot before 2009, and "from 2009 all the wines, including older stocks, leaving the cellars will come under the name of Thierry and his wife Pascale." Item 1: "Joseph Matrot, the grandson of vineyard owners in Puligny-Montrachet, settled in Meursault at his wife's family domaine in 1914."
- The earlier claim rested only on research/bottle-facts-cards-a-2026-10-04.json, n708, marked "how": "knowledge": "Thierry and Pascale Matrot run a family domaine in Meursault (Côte de Beaune)".

## 6. Chartogne-Taillet, Merfy is not on the Montagne de Reims

Entry 7. Wine: Chartogne-Taillet Rosé Brut NV, w-ok86r5na. origin: from "northwest of Reims in the Montagne de Reims." to "northwest of Reims in the Massif de Saint-Thierry."

Why: the Montagne de Reims rises south of the city; Merfy lies north-west of it, on the Massif de Saint-Thierry. The card's Tell me about it quotes the list's own section heading, "Grower Producers, Montagne de Reims", as the list prints it; that stays, since it is the list's filing, not the card's geography.

Sources and passages:
- research/producers-cellar-champagne-growers-2026-10-10.md, section 3, item 1: "Die Weinbautätigkeit der Familie Taillet im Dorf Merfy, gelegen im Massif de St-Thierry nordwestlich von Reims, wurde erstmals 1683 urkundlich erwähnt." Item 5: "the Merfy vineyards sit on the southern slopes of the Massif de Saint-Thierry, on sands and clays over chalk". Item 4: about 11 hectares "across Merfy, Chenay and Saint-Thierry".

## 7. Tribaut-Schloesser, a family house rather than a grower

Entries 8 to 10. Wine: Tribaut-Schloesser 'Origine' Brut NV (375 ml), w-984woomc.
- style: from "Grower Brut Champagne, non-vintage, half-bottle" to "Brut Champagne from a family house, non-vintage, half-bottle".
- kept.0.a: from "Tribaut-Schloesser Origine is a grower Brut in a half-bottle," to "Tribaut-Schloesser Origine is a family house’s Brut in a half-bottle,".
- kept.1.a: from "grower Champagne from Romery" to "Champagne from a family house in Romery".

Why: by Hachette the house took négociant status in its third generation, so "grower" claims what the best source denies; the research's profile already calls it a family house and named this card error for the overrides. Whether the half-bottle's label prints NM or RM is already an open lineup question (overrides.json, the ask beginning "Does the Tribaut-Schloesser Origine half-bottle carry NM or RM"), so no new ask is filed. The card's own words "filed under Grower Producers" quote the list and stay.

Sources and passages:
- research/producers-cellar-champagne-growers-2026-10-10.md, section 6, item 1: "La marque devient Tribaut-Schloesser en 1950 et la 3e génération adopte le statut de négociant." The section's Brennan's link: "The Binwise list files it under Grower Producers and the pack calls it "a grower Brut"; by Hachette the house has been a négociant since its third generation, so the profile calls it a family house." What this pass changes: "Its Tribaut-Schloesser cards call Origine "a grower Brut"; by Hachette the house has been a négociant since its third generation (section 6, item 1). Both are left to the build's overrides, not patched here."

## 8. Chapel Down, not the only English rosé

Entry 15. Wine: Chapel Down Rosé Brut Kent NV, w-iawg2ni8. kept.0.a: from "Chapel Down Rosé Brut is the English sparkling rosé on our list," to "Chapel Down Rosé Brut is an English sparkling rosé on our list,".

Sources and passages:
- research/producers-cellar-sparkling-elsewhere-2026-10-10.md, Verification 2026-10-10, item 9: "The profile no longer calls the Rosé "the English sparkling rosé on the bottle list": the Binwise list of 3 October 2026 also carries Ridgeview "Fitzrovia" Rosé Brut Sussex (research/winelist-2026-10-03.json). The pack's own "Tell me about it" for w-iawg2ni8 repeats that slip ("the English sparkling rosé on our list"), for the integrator."
- pages/binwise-wine-list-2026-10-03.txt, lines 3096 to 3099: "32473 / Ridgeview "Fitzrovia" Rosé Brut Sussex / NV / 75".

## 9. Armand de Brignac, the owners dated

Entries 16 and 17. Wine: Armand de Brignac 'Gold' Brut NV, w-cp0e7p4g.
- kept.0.a: from "and today it is owned in partnership by Shawn Carter, the artist known as Jay-Z, and Moët Hennessy." to "and in February 2021 Shawn Carter, the artist known as Jay-Z, whose company had bought the brand in 2014, sold half of it to Moët Hennessy."
- kept.2.a: from "The Cattier family in Chigny-les-Roses on the Montagne de Reims; it is owned in partnership by Jay-Z and Moët Hennessy." to "The Cattier family in Chigny-les-Roses on the Montagne de Reims. Jay-Z’s company bought the brand in 2014, and Moët Hennessy bought half of it in February 2021."

Why: an undated present owner, and a living one, is a volatile fact the house never states. Guests do ask about the Jay-Z link, so the two dated events stay, as dated events.

Sources and passages:
- research/producers-cellar-champagne-houses-2026-10-10.md, section 4, item 5: "On November 5, 2014, it was announced that a new company led by Jay-Z had acquired Armand de Brignac Champagne from Sovereign Brands." "In February 2021, Carter sold a 50% stake of the brand to Moët Hennessy, the wine and spirits branch of LVMH." The pack (w-cp0e7p4g) says it is "owned in partnership by Shawn Carter, the artist known as Jay-Z, and Moët Hennessy". The same file's open list records "the terms of the 2014 and 2021 deals" as unconfirmed, so nothing beyond the two dates and the half share is said.

## 10. Jacques Selosse, the winemaker named in the present

Entry 18. Wine: Jacques Selosse 'Initial' Blanc de Blancs Brut NV, w-b3lm4k76. lines.s45: from "and Anselme Selosse is the winemaker who inspired a generation of growers" to "and Anselme Selosse, who took over from his father, inspired a generation of growers".

Why: the line named a living person as the estate's current winemaker. The management has passed to his son by the research's sources; what Anselme did is history and stays, in the words the card's own Tell me about it uses ("Anselme Selosse, who took over from his father, made Champagne the way a great Burgundy domaine makes white wine ... and inspired a generation of growers").

Sources and passages:
- research/producers-cellar-champagne-growers-2026-10-10.md, section 5, item 5: Gault and Millau "says ... that "Guillaume Selosse has recently taken over management of the estate" (undated); iDealwine visited with Guillaume Selosse in November 2023." Item 2: "Vinous and Wine Spectator date the formal takeover to 1980"; earlier research: "Anselme Selosse, who succeeded his father Jacques, ferments and ages in oak barrels in the manner of white Burgundy and inspired a generation of growers."

The origin ("where Anselme Selosse changed how Champagne growers think about wine") is past tense and stays.

## 11. Rare 2013, no longer Piper-Heidsieck's

Entry 21. Wine: Rare Champagne 'Rare' Brut 2013, w-gcoxn5b8. lines.s10: from "Piper-Heidsieck’s prestige vintage Champagne" to "the prestige vintage Champagne born at Piper-Heidsieck".

Sources and passages:
- research/producers-cellar-champagne-menu-2026-10-10.md, section 2, item 3: "Rare became its own brand in September 2018, previously labelled, marketed and sold under the Piper-Heidsieck name, and it is now managed separately."
- The pack, the same card: origin "Rare began as the prestige cuvée of Piper-Heidsieck in Reims"; Tell me about it "and today it carries its own name".
- research/cellar-review-2026-10-11-house-menu-1.json: the Grand Isle Jewel Oysters tier's "Piper-Heidsieck's prestige vintage Champagne" became "a prestige vintage Champagne that began at Piper-Heidsieck and is now its own house".

## Read and left standing

The sixty, with their ids and pack indexes, and what this file does to each:

0. Cesarini Sforza Rosé Brut Trento NV (w-in6wnlqj, pack index 34): stands
1. Jansz 'Premier Cuvée' Brut Tasmania 2022 (w-lx0lfo3w, 35): stands
2. Chapel Down Rosé Brut Kent NV (w-iawg2ni8, 36): entry 15
3. Ridgeview 'Bloomsbury' Brut Sussex NV (w-zowerxpq, 37): entries 11 to 14
4. Domaine Huet Pétillant Vouvray 2019 (w-kspquur7, 38): stands
5. Ferrari Rosé Brut NV (w-568xl8n8, 39): stands
6. JM Sélèque 'Solessence' Extra Brut NV (w-s3ih8iz8, 40): stands
7. Billecart-Salmon 'Réserve' Brut NV (w-cwd97m10, 41): stands
8. Pierre Paillard Grand Cru 'Les Parcelles XVIII' Extra Brut NV (w-52frrp7w, 42): stands
9. Louis Roederer 'Collection 244' Brut NV (w-zlepo7bf, 43): stands
10. Chartogne-Taillet Rosé Brut NV (w-ok86r5na, 44): entry 7
11. Larmandier-Bernier Premier Cru 'Longitude' Extra Brut NV (w-t9fmw7g4, 45): stands
12. Piper-Heidsieck 'Brennan’s Essential' Extra Brut NV (w-8t8kp5ey, 46): stands
13. Veuve Clicquot 'Yellow Label' Brut NV (w-56slu7c1, 47): stands
14. Moët & Chandon 'Nectar Imperial' Rosé Demi Sec NV (w-2yvmmtl2, 48): stands
15. Charles Heidsieck 'Réserve' Brut NV (w-w6m1inh5, 49): stands
16. Bollinger 'Special Cuvée' Brut NV (w-kx8pfl72, 50): stands
17. Armand de Brignac 'Gold' Brut NV (w-cp0e7p4g, 51): entries 16 and 17
18. Pol Roger 'Blanc de Blancs' Brut 2015 (w-2ujm9hay, 52): stands
19. Bollinger 'PNTX20' Brut NV (w-433zkw3p, 53): stands
20. Billecart-Salmon 'Cuvée Elisabeth Salmon' Rosé Brut 2009 (w-o7d3th9g, 54): stands
21. Bollinger 'La Grande Année' Brut 2015 (w-dp948xn6, 55): stands
22. Jacques Selosse 'Initial' Blanc de Blancs Brut NV (w-b3lm4k76, 56): entry 18
23. Krug 'Grande Cuvée 170th Edition' Brut NV (w-sven7j3q, 57): stands
24. Rare Champagne 'Rare' Brut 2013 (w-gcoxn5b8, 58): entry 21
25. Louis Roederer 'Cristal' Brut 2015 (w-itryoukh, 59): stands
26. Krug Rosé Brut NV (w-v8xtsq21, 60): stands
27. Dom Pérignon 'P2' Brut 2006 (w-5622vopw, 61): stands
28. Salon 'Le Mesnil' Blanc de Blancs Brut 2013 (w-mgnwvxmr, 62): stands
29. Louis Jadot Beaujolais-Villages 2021 (375 ml) (w-kkyqlh3y, 63): stands
30. Chalk Hill Chardonnay Sonoma County 2021 (375 ml) (w-29h9ciun, 64): stands
31. Duckhorn Sauvignon Blanc North Coast 2023 (375 ml) (w-u1x47wmo, 65): stands
32. Thierry et Pascale Matrot Bourgogne Blanc 2022 (375 ml) (w-3wkj2yfj, 66): entries 1 to 4
33. Tribaut-Schloesser 'Origine' Brut NV (375 ml) (w-984woomc, 67): entries 8 to 10
34. Domaine Huet 'Le Haut-Lieu' Vouvray Sec 2019 (375 ml) (w-ev1wdpea, 68): stands
35. Bründlmayer 'Terrassen' Grüner Veltliner 2023 (375 ml) (w-selhncvi, 69): stands
36. Domaine Raspail-Ay Gigondas 2021 (375 ml) (w-f53clius, 70): stands
37. Ferrari Brut Trento NV (375 ml) (w-ticb6kgc, 71): stands
38. Domaine Huet 'Le Mont' Vouvray Demi-Sec 2023 (375 ml) (w-ryatol7k, 72): stands
39. Duckhorn Merlot Napa Valley 2020 (375 ml) (w-ceiobq2z, 73): stands
40. Nicolas Feuillatte 'Réserve' Brut NV (375 ml) (w-3cacxqdn, 74): stands
41. Domaine Louis Michel 'Montmains' Chablis Premier Cru 2023 (375 ml) (w-31o8mfmw, 75): stands
42. Bergstrom 'Reserve' Pinot Noir Willamette Valley 2022 (375 ml) (w-sore7fcc, 76): stands
43. Schramsberg 'Blanc de Blancs' North Coast 2021 (375 ml) (w-ytf0l182, 77): entries 5 and 6
44. Ridge Vineyards 'Lytton Springs' Dry Creek Valley 2021 (375 ml) (w-6fihmc7q, 78): stands
45. Bründlmayer 'Heiligenstein' Riesling 2022 (375 ml) (w-aqp3w3g7, 79): stands
46. Laurent-Perrier 'Harmony' Demi Sec NV (375 ml) (w-c5m9qx3y, 80): stands
47. Ridge Vineyards 'Essence' Zinfandel Sonoma 2014 (375 ml) (w-kn6eo364, 81): stands
48. Bouchard Père & Fils 'Clos de la Mousse' Beaune Premier Cru 2022 (375 ml) (w-cvdn1iip, 82): stands
49. Ridge Vineyards 'Estate' Cabernet Sauvignon Santa Cruz Mountains 2020 (375 ml) (w-i42v0cdg, 83): stands
50. Louis Jadot Meursault 2022 (375 ml) (w-xakh7w3y, 84): stands
51. Veuve Fourny et Fils Premier Cru Blanc de Blancs Extra Brut NV (375 ml) (w-tmm38vzi, 85): stands
52. La Cigarrera Manzanilla Sanlúcar de Barrameda NV (375 ml) (w-dx8217nz, 86): stands
53. Dow’s Vintage Port 2000 (375 ml) (w-8ht6rqnn, 87): entries 19 and 20
54. Niepoort Colheita Port 1997 (375 ml) (w-ohgxn0df, 88): stands
55. Veuve Fourny et Fils Premier Cru Rosé Brut NV (375 ml) (w-yyjn4yrr, 89): stands
56. Domaine Henri Gouges Nuits-Saint-Georges 2021 (375 ml) (w-zxu9f2du, 90): stands
57. Dönnhoff 'Oberhäuser Brücke' Riesling Auslese Goldkapsel 2023 (375 ml) (w-uwkowe16, 91): stands
58. Château Suduiraut Sauternes 2016 (375 ml) (w-remgp2fk, 92): stands
59. Dönnhoff 'Niederhäuser Hermannshöhle' Riesling Auslese Goldkapsel 2023 (375 ml) (w-5txzjnqt, 93): stands

Checked against the research and left as they are, among others: the Collection 244 built on the 2019 harvest (champagne-houses, section 1, item 7); the Ferrari Rosé Pinot Noir led and the Ferrari Brut all Chardonnay (sparkling-elsewhere, section 5, items 5 and 6); the Cesarini Sforza rosé mostly Chardonnay (section 4, item 5); the Solessence blend, oak and seven villages (champagne-growers, section 1, item 8); Les Parcelles from Bouzy, Pinot Noir with Chardonnay (section 2, item 7); Longitude's villages on one meridian (section 4, item 4); the Origine Meunier led (section 6, item 6); Billecart-Salmon's 1818 marriage of Nicolas François Billecart and Elisabeth Salmon (champagne-menu, section 7, item 1); PN TX20 led by Tauxières on a 2020 base, and La Grande Année 2015 fermented in oak (section 8, items 5 and 6); Pol Roger's Blanc de Blancs from the six grand cru villages of the Côte des Blancs (champagne-houses, section 5, item 8); Cristal and the 1876 Tsar (section 1, item 2); Huet's Le Haut-Lieu bought in 1928 and the Pétillant's lower pressure (sparkling-elsewhere, section 9, items 1 and 7); the Clos de la Mousse a walled Bouchard monopole (chablis-maconnais, section 8, item 6); Louis Michel unoaked (section 7, item 2); Ridge Essence a late harvest Zinfandel left to dry on the vine (napa-sonoma, section 10, item 7); the Brücke a Dönnhoff monopole by the old bridge (germany-austria, section 1); Suduiraut a Premier Cru Classé at Preignac beside Yquem (bordeaux-white-sweet, section 3).

## Notes for the integrator, not asks

- Austrian region strings. The two Bründlmayer halves (Terrassen, Heiligenstein) read "Kamptal, Austria", which names the appellation and the country and skips the region (Niederösterreich), the shape house-floor-2 repaired on Whispering Angel. They are left alone here because house-floor-2 left the Bründlmayer 'Alte Reben' at the same "Kamptal, Austria" and moved the Loimer to "Niederösterreich, Austria", and three cards of one estate should not disagree. If the house wants the full shape, all three Bründlmayer strings would read "Kamptal, Niederösterreich, Austria" (the list labels Bründlmayer's sparkling wine Niederösterreich, the wider region that holds the Kamptal: research/producers-cellar-germany-austria-2026-10-10.md, section 4, the expert line), and the Hirtzberger "Spitz, Wachau, Niederösterreich, Austria".
- Bollinger PN TX20 reads "Aÿ and Tauxières, Champagne, France", the only string in the pack that joins two places with "and". It is not wrong (the house is at Aÿ, the wine is led by Tauxières), so it stands; "Tauxières, Champagne, France" would match the one-place shape if the integrator prefers it.
- Already open at lineup, so not asked again: the Jansz (non-vintage Premium Cuvée or a 2022 vintage wine, as the list prints Premier Cuvée Brut 2022), and the Tribaut-Schloesser's NM or RM.
- The Pierre Paillard card still leaves what the XVIII marks to the sommelier, where the research found it is the 2018 base harvest (champagne-growers, section 2, item 7). That is thin rather than wrong, so it is not filed.

## Lineup questions no source could settle

ask: What soils does Ridgeview's Ditchling vineyard, where the Bloomsbury grows, stand on: chalk, as some pages say, or clay, limestone, flint and loam, as a retailer's sheet for the Bloomsbury says?
