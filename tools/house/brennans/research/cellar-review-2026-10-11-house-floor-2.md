# Cellar review, 11 October 2026: house-floor-2

Batch house-floor-2 of the bounded pass over the Brennan's bottle cards: the floor bottles 60 to 119 of house.wines in the shipped pack (static/shared/packs/brennans-new-orleans.v1.oothouse.json, counted from 0 over the wines whose list is bottle), from Grgich Hills 'Violetta' Late Harvest Napa Valley 2012 (375 ml) to Pascal Cotat 'Les Monts Damnés' Sancerre 2022. Sixty cards read in full. Swept for errors only, field by field: the producer, the wine, the vintage, the region string, the grapes, the style, the profile, the serve and the 10 second line. A thin field that is not wrong was left alone.

Ten entries in cellar-review-2026-10-11-house-floor-2.json, each a replace whose "from" is the pack's text byte for byte (proved by a node script against the shipped pack before filing). Four WebSearch calls were allowed; three were made, standard mode, 11 October 2026 (Montelena's Chardonnay vineyards, the Lois appellation, the Mas de Valériole location). A passage marked (summary) is the search tool's summary of the page, not a quotation of it.

The region rule applied: the string names the appellation or sub-region, then its region, then its country, comma separated, as the other bottles do. American bottles end at the state across the whole pack (Napa Valley, California), so no country was added to them. The Codex card prints the string as the wine's Region line, so a wrong first part teaches a wrong appellation. (Corrected at integration: this paragraph said the card matches its Terroir row by the first part of the string. It does not. v28Terroir in sommelierscodex/js/codex28.js reads every part of the string against the TERROIR rows, no row at any level is named Meursault, Calistoga or Sancerre, and each old string in this batch links the same Terroir row as its new one: Napa Valley for the Montelena, Beaujolais for the Foillard magnum, none for the others.)

## 1. Mas de Valériole, the region string

Wine: Mas de Valériole 'Vé' Rosé Méditerranée 2025 (1.5 L magnum), w-8j6qflst. Field: region. From "Camargue, near Arles, France" to "Camargue, Provence, France".

Why: "near Arles" is a direction, not a region, and the string was the only one in the pack that did not end sub-region, region, country.

Sources and passages:
- research/producers-cellar-provence-loire-2026-10-10.md, section 5, item 1, quoting the searched card of 4 October (bin 1569): "Mas de Valériole is a family (Michel family) estate in the Camargue, about ten miles south of Arles, cooled by Mediterranean wind; Vé is a Provençal expression meaning look at that; the Vé rosé (IGP Méditerranée) blends Caladoc (Grenache crossed with Malbec), Merlot and Marselan, direct pressed and kept in stainless steel."
- Search 3, 11 October 2026, https://provence-alpes-cotedazur.com/que-faire/vin-et-gastronomie/toutes-les-activites-vin-et-gastronomie/mas-de-valeriole-arles-fr-2872595/ (the Provence-Alpes-Côte d'Azur regional tourism page for the estate), https://parc-camargue.fr/parc-camargue/202000048/0001/Producteurs_list.pdf and https://parcs-naturels-regionaux.fr/print/pdf/node/8711: the Mas de Valériole is an organic wine and rice estate in Gageron, near Arles, inside the Camargue regional park; the park's producer directory says wine can be bought at the estate in Gageron; the estate makes some cuvées under the IGP Pays des Bouches-du-Rhône, Terre de Camargue (summary). Arles and the Grande Camargue south of it lie in the Bouches-du-Rhône, a département of Provence (expert knowledge, certain).

The appellation stays in the wine's own name, Vé Rosé IGP Méditerranée; the string claims no Provence appellation, only the region the estate stands in. The earlier pass's care (section 5 of that file: the library's why no longer implies the Camargue could hold a Provence appellation) is kept.

## 2. Jean Foillard Côte du Py magnum, the region string

Wine: Jean Foillard 'Côte du Py' Morgon 2023 (1.5 L magnum), w-iegw2pmn. Field: region. From "Morgon, Beaujolais, France" to "Morgon, Beaujolais, Burgundy, France".

Why: the same wine in bottle and every other Beaujolais card carry Burgundy; the magnum alone dropped it.

Sources and passages:
- The pack: Jean Foillard 'Côte du Py' Morgon 2022 (w-g8r9sffh, Red Burgundy), region "Morgon, Beaujolais, Burgundy, France"; Marcel Lapierre Morgon 2023 (w-vg32nwfm), "Morgon, Beaujolais, Burgundy, France"; Domaine Coudert 'Clos de la Roilette' Fleurie 2023 (w-zisvd8al), "Fleurie, Beaujolais, Burgundy, France"; Louis Jadot Beaujolais-Villages 2021 (375 ml) (w-kkyqlh3y), "Beaujolais, Burgundy, France".
- pages/binwise-wine-list-2026-10-03.txt, line 1218: Jean Foillard "Côte du Py" Morgon Beaujolais • 1.5L Magnum.

## 3. Jean-Philippe Fichet Bourgogne Blanc, the region string

Wine: Jean-Philippe Fichet Bourgogne Blanc 2023, w-ekfo9ytb. Field: region. From "Meursault, Côte de Beaune, Burgundy, France" to "Bourgogne, Burgundy, France".

Why: the wine's appellation is Bourgogne, the regional appellation, not the village appellation Meursault. With Meursault first, the Codex card printed the same Region line as the village Meursaults beside it on the list, so the bottle read as a Meursault, the one thing a server must never tell a guest about a Bourgogne Blanc. The parcels' Meursault origin is true and stays where it is said as origin, not appellation: the profile ("A Bourgogne Blanc from a Meursault grower") and parts.main ("Chardonnay from a Meursault grower, Bourgogne Blanc").

Sources and passages:
- research/producers-cellar-white-burgundy-cote-2026-10-10.md, section 2, item 8: "The Bourgogne Blanc: from three parcels in the village of Meursault with an average vine age over 50 years; fermented in stainless steel tanks, then about 12 months in cement tanks" (summary).
- The pack: Domaine Faiveley Bourgogne Rouge 2022 (w-hzb9h1a4), region "Bourgogne, Burgundy, France", the form this entry follows.

## 4. Domaine Coche-Dury Bourgogne Blanc, the region string

Wine: Domaine Coche-Dury Bourgogne Blanc 2022, w-0jfgq158. Field: region. From "Meursault, Côte de Beaune, Burgundy, France" to "Bourgogne, Burgundy, France".

Why: as in section 3. The card's own profile calls it "a regional wine" and "A Bourgogne priced like a Grand Cru because of the name"; the string now agrees with it. The estate's Meursault home stays in the origin and in parts.main ("Chardonnay from Coche-Dury of Meursault, Bourgogne Blanc").

Sources and passages:
- research/producers-cellar-white-burgundy-cote-2026-10-10.md, section 10, item 6: "Coche-Dury's Bourgogne Blanc is sourced from meticulously selected parcels scattered throughout the domaine in Meursault, showcasing some of the oldest vines dating back to the 1930s." (a merchant's description, not the estate's).
- The same file, Brennan's link under section 10: "the Bourgogne Blanc 2022, $690, is the regional white of the estate, priced for its scarcity rather than its appellation".

## 5. Whispering Angel, the region string

Wine: Château d'Esclans 'Whispering Angel' Côtes de Provence Rosé 2024, w-2e9l0yek. Field: region. From "Côtes de Provence, France" to "Côtes de Provence, Provence, France".

Why: the string named the appellation and the country and skipped the region. The Provence bottles beside it read "Bandol, Provence, France" (Domaine Tempier) and "Alpilles, Provence, France" (Trévallon).

Sources and passages:
- The pack's wine name and wine field: "Whispering Angel Côtes de Provence Rosé"; its origin: "Whispering Angel is made by Château d'Esclans in Provence".
- research/producers-cellar-provence-loire-2026-10-10.md, the Esclans section (search 39 of research/components-wines-2026-10-05.md, esclans.com), which places Esclans at La Motte-en-Provence. Côtes de Provence is an appellation of Provence (expert knowledge, certain).

## 6. Loimer Lois, the region string and the profile

Wine: Loimer 'Lois' Grüner Veltliner 2022, w-atwx0lgo. Two entries.
- Field: region. From "Kamptal, Austria" to "Niederösterreich, Austria".
- Field: profile. From "A light, fresh Grüner Veltliner from the Kamptal:" to "A light, fresh Grüner Veltliner from Lower Austria, made by a Kamptal estate:".

Why: Lois is the estate's wide-release Grüner, made from its own fruit and from contracted growers across Lower Austria (Niederösterreich), and retailers list the 2022 under Niederösterreich. The Kamptal is the estate's home at Langenlois, which the origin, the s45 line and the lineup note keep. Niederösterreich holds the Kamptal, so the new string and profile are true whichever word the label in hand prints; the old ones were wrong if the label reads Niederösterreich.

Sources and passages:
- Search 2, 11 October 2026: https://championwinecellars.com/products/2022-loimer-lois-gruner-veltliner-niederosterreich-austria, titled "2022 Loimer 'Lois' Grüner Veltliner, Niederösterreich, Austria", gives Region Niederösterreich, Sub-Region Kamptal (summary; its appellation line "Niederösterreich DAC" names a DAC that does not exist and is not used); https://www.saq.com/en/11990492 lists the Lois with the region Niederösterreich (summary); https://phpdemo.bottlecapps.com/product/s-10010/p-11104762/buy-loimer-lois-gruner-veltliner: Lois is named after the village of Langenlois and is "produced from a combination of estate grown fruit and contracted growers in Lower Austria" (summary).
- pages/binwise-wine-list-2026-10-03.txt, line 166: Loimer "Lois" Gruner Veltliner Kamptal AT. The house list prints Kamptal; the lineup ask already filed ("Does the Loimer Lois label read Kamptal or Niederösterreich, is Loimer certified biodynamic, and may servers name Fred Loimer?") settles the label. Niederösterreich is also printed on that page for the Bründlmayer sparkling wines.

## 7. Weingut Stein Weihwasser, the profile

Wine: Stein 'Weihwasser' Riesling Feinherb 2023, w-du80kehr. Field: profile. From "from old vines on steep slate near the old church in Alf:" to "from Stein's steep Mosel slate:" (the apostrophe is the pack's curly one).

Why: a still unverifiable fact is placed nowhere as a fact. The parcel and the vine age come from one card that gave two places for the same vines.

Sources and passages:
- research/producers-cellar-alsace-jura-mosel-2026-10-10.md, section 6, item 1, the 4 October card: "Weihwasser (holy water) comes from 60-year-old vines in the St. Aldegunder Klosterkammer near the old church in Alf, fermented in old 1000 liter casks", how: "search 4 October 2026, astorwines.com and chambersstwines.com (Ulli Stein); knowledge".
- The same file, R11: "'old vines near the old church' and 'ferments in large old casks' come from the 4 October card, which mixed two importer pages with knowledge and placed the vines both in the St. Aldegunder Klosterkammer and near the old church in Alf (section 6, item 1). Like the vine age and the parcel, they are now a lineup question".
- components/producers.json, the Weingut Stein profile: "who has reclaimed steep slate vineyards that others had given up" and "Weihwasser means holy water; where its vines grow, how old they are and how the wine is" made are left to the sommelier. The steep slate is sourced; the parcel is not. The lineup ask "Where does the Stein Weihwasser grow, how old are its vines, does it ferment in large old casks as the pack's card says" is already filed.

## 8. Chateau Montelena Chardonnay, the region string

Wine: Chateau Montelena Chardonnay Napa Valley 2023, w-x0lkwehr. Field: region. From "Calistoga, Napa Valley, California" to "Napa Valley, California".

Why: Calistoga is where the winery stands and where its estate Cabernet grows; the Chardonnay is grown well to the south. The string printed Calistoga as the place of a wine with no Calistoga fruit that any current source names. The wine's own name prints its appellation, Napa Valley. The card's other Calistoga lines (origin, s45, parts.main and the compare row) speak of the winery and are true.

Sources and passages:
- Search 1, 11 October 2026: the importer's technical sheets, https://fr.vintus.com/wp-content/uploads/2019/12/Montelena-Chardonnay-2017-Tech-Sheet.pdf and https://flipboard.vintus.com/wp-content/uploads/2020/10/Montelena-Chard-2018-Tech-1.pdf: the fruit comes from vineyards located in the south-central Napa Valley appellation, near the base of Mt. Veeder and Dry Creek Valley Road; fermented in temperature-controlled stainless steel, about 10 months in French oak; "Blocking malolactic fermentation keeps the flavors brisk." (summary).
- Search 1: https://sommelier-academy.de/topic/court-of-master-sommeliers-notable-producers-chateau-montelena-2/ says current production is grown entirely in the Oak Knoll AVA (the Oak Knoll District), from the Takahashi and John Muir Hanna vineyards (summary). It disagrees with the importer on the exact place; both put the fruit in the southern half of the valley, and neither names Calistoga.
- Search 1: https://www.decanter.com/learn/wine-legend-chateau-montelena-1973-305096/ gives the 1973 as a blend of Alexander Valley, Russian River Valley, Oak Knoll and Calistoga fruit (summary): the Paris wine, not today's.
- research/producers-cellar-napa-icons-2026-10-10.md, section 10, item 1: the Codex record p-chateau-montelena, holdings "A stone winery built by Alfred Tubbs, with estate Cabernet vineyards at the northern end of the valley in Calistoga."

## 9. Pascal Cotat Lot 2024 rosé, the region string

Wine: Pascal Cotat 'Lot 2024' Chavignol Rosé, w-wmyu1uii. Field: region. From "Chavignol, Sancerre, Loire Valley, France" to "Chavignol, Loire Valley, France".

Why: the wine is not a Sancerre. Sancerre in the string read as its appellation, against the card's own warning ("Do not call it Sancerre rosé on the label: it is labeled by lot"). Sancerre country stays in the style and the 10 second line, where it names the district, not an appellation.

Sources and passages:
- research/producers-cellar-provence-loire-2026-10-10.md, section 10, item 1, quoting the searched card of 4 October (bin 28431; astorwines.com, northberkeleyimports.com, vinous.com): "his rosé is Pinot Noir from a tiny parcel (about 0.1 hectare, vines planted in the 1930s), declassified from the Sancerre appellation after a local dispute and so labeled as a non-vintage lot (Vin de France), fermented with native yeasts and aged in old casks."
- The vintage field (2024) is left as the list prints it; whether Lot 2024 is the 2024 harvest is the lineup ask already filed.

## The sixty cards and their verdicts

Stood as written (no error found in the swept fields): Grgich Hills Violetta 2012 (grapes and American Canyon fruit as searched on 4 October); Troplong Mondot 2020 (375 ml); Insignia 2011 (375 ml; its grapes field lists Cabernet Sauvignon alone, thin beside the profile's other Bordeaux grapes, and the 2011 blend is an ask already filed); Keller PIUS 2022 (375 ml; empty grapes, true to the changing varieties); Opus One 2015 (375 ml); Château d'Yquem 2015 and 2016 (375 ml); Pierre Péters Cuvée de Réserve (magnum); Duckhorn Cabernet 2022 (magnum); Cos d'Estournel 2015 (magnum); J.J. Prüm Wehlener Sonnenuhr Auslese Goldkapsel 2015 (magnum); Billecart-Salmon Réserve (Nebuchadnezzar; fifteen liters is twenty bottles, a hundred five ounce glasses); Louis Michel Chablis 2022; Roc des Boutires En Bertilionne 2020; Lafon Mâcon-Milly-Lamartine 2023; Leflaive Mâcon-Verzé 2021; Droin Vaillons 2023; Dupont-Fahn Les Tillets 2022; Bitouzet-Prieur Les Corbins 2020; Paul Pillot Le Charmois 2022; Carillon Puligny-Montrachet 2022; Leflaive Puligny-Montrachet 2016; Dauvissat Les Preuses 2015; Comtes Lafon Clos de la Baronne 2022; Leflaive Sous le Dos d'Ane 2017; Roulot Meursault 2022; Raveneau Montée de Tonnerre 2022; Leflaive Chevalier-Montrachet 2015; Stein Palmberg-Terrassen 2014; Écu Orthogneiss 2022; Raúl Pérez Ultreia Godello 2021; Pépière Monnières-Saint Fiacre 2020; Laureau L'Alliance 2022; Sandhi Sta. Rita Hills 2021 (the s10's "Santa Rita Hills" is the spoken form of the name); Trimbach Riesling Réserve 2020; Huet Le Haut-Lieu Sec 2024; Au Bon Climat Sanford & Benedict 2021; Kumeu River Estate 2022; Cakebread Chardonnay 2023; Boxler Pinot Gris 2020; Gaia Wild Ferment 2023; Tempier Bandol Rosé 2024; J.J. Prüm Wehlener Sonnenuhr Kabinett 2020; Huet Clos du Bourg 2015; Bründlmayer Alte Reben 2023; Carbonnieux Blanc 2016; Do Ferreiro Cepas Vellas 2018; Trévallon Blanc 2016 (the 2016 blend is an ask already filed); Kongsgaard Chardonnay 2016; Hirtzberger Honivogl 2022; Cotat Les Monts Damnés 2022.

Corrected: Mas de Valériole Vé (1), Foillard Côte du Py magnum (2), Fichet Bourgogne Blanc (3), Coche-Dury Bourgogne Blanc (4), Whispering Angel (5), Loimer Lois (6, two entries), Stein Weihwasser (7), Chateau Montelena Chardonnay (8), Cotat Lot 2024 (9).

## Seen outside the swept fields, not filed

These lie in fields this batch was not asked to sweep (origin, parts, the kept notes, the 20 and 45 second lines). They are set down for the integrator, not filed as entries.

- A living person named as who runs an estate today, with no date: the origin and the s45 of Dupont-Fahn Les Tillets ("now run by Raymond Dupont-Fahn"; "Raymond Dupont-Fahn runs his family estate"), Roulot ("run by Jean-Marc Roulot"), Coche-Dury ("now run by Raphaël Coche after his father Jean-François"; the white Burgundy research, section 10, item 4, dates his taking over the winemaking to 2010, which could stand as an as of), Loimer ("run by Fred Loimer"; the filed ask already asks whether servers may name him) and both Stein cards ("run by Ulrich Stein"; "Ulrich Stein's small Mosel estate"). Each also stands in a kept note of the same card.
- Stein Weihwasser: parts.main "Riesling from old vines on steep slate in Alf, on the Mosel", parts.technique "fermented in old casks" and kept notes 2 and 3 carry the same unsettled parcel, vine age and casks as the profile entry of section 7.
- Loimer Lois: parts.main "Grüner Veltliner from Langenlois in the Kamptal" would follow the region entry of section 6.
- Dupont-Fahn Les Tillets: the linden tree reading of Les Tillets, in kept notes 2 and 3 and the s45, has no source (white Burgundy research, section 4, item 7).
- Paul Pillot Le Charmois: kept notes 2 and 3 place Le Charmois near the Puligny boundary, where the one source that locates it puts it on the hillside bordering Chassagne's Les Chaumées (white Burgundy research, section 6, item 6).
- Consistency for the batch before this one: the Matrot Bourgogne Blanc half-bottle, Thierry et Pascale Matrot Bourgogne Blanc 2022 (375 ml) (w-3wkj2yfj), reads "Meursault, Burgundy, France"; by the reasoning of sections 3 and 4 it would read "Bourgogne, Burgundy, France".

## Lineup questions no source settled

Already filed and left alone: the Lois label (Kamptal or Niederösterreich); the Weihwasser parcel, vine age and casks; whether Cotat's Lot 2024 is the 2024 harvest and how it is labeled; the Montelena malolactic question; the Insignia 2011, Keller PIUS 2022, Trévallon 2016 and Violetta 2012 blends. New:

ask: Which Napa vineyards grow the Chateau Montelena Chardonnay 2023? The importer's sheets name the south-central Napa Valley near Mount Veeder, another reference names the Oak Knoll District, and neither names Calistoga, where the winery stands.
ask: Which Meursault parcels make the Coche-Dury Bourgogne Blanc 2022? Only one merchant places them, as parcels across the domaine in Meursault; nothing from the estate says so.
ask: Is the Mas de Valériole Vé 2025 magnum labeled IGP Méditerranée, as our list prints it, or IGP Pays des Bouches-du-Rhône, Terre de Camargue, the label the estate uses for some of its other wines?
