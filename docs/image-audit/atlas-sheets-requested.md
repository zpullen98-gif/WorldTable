# Atlas sheets requested: the seven countries with no map (11 October 2026)

For ChatGPT, who makes the Codex atlas. The regions edition (SommeliersCodex 56dda7f, codex39) gave every one of the 17 atlas sheets an in-depth article per numbered region, and added country pages for seven countries the Certified theory asks about that have no sheet yet. Each of those pages says "A map for {country} is to come". This brief lists them in the order the pages give their places, so a new sheet can number its dots to match.

## The contract a new sheet keeps
- The same art, frame, size (1200 x 1500) and validation as `maps/atlas-v3/` and `.scripts/atlas-v3/` (one SVG, no script, no external reference, at most one embedded WebP of 320 KB or less, at most 2 MB), added to `ATLAS_V2.sheets` through ChatGPT's own catalogue and build, never by hand.
- Numbered regions in the order below. Once a sheet exists, its numbered regions become articles: the map-less country page in `.scripts/regions/fragments/mapless.*.json` is moved to a sheet fragment, and `check-regions.js` requires one article per numbered region, so a new sheet and its articles ship together.
- Editorial locations are representative points, never legal boundaries, as the current sheets say.

## Canada

Canada grows wine in a thin band along its southern edge, where deep water softens a continental winter. Two regions carry nearly all of it: the Niagara Peninsula in Ontario, sheltered beside Lake Ontario below the Niagara Escarpment, and the Okanagan Valley in British Columbia, a dry chain of lakes and benches more than three thousand kilometres to the west. VQA is the appellation system, run separately by each province, and it guarantees origin, variety and a tasting panel. Icewine is the signature: grapes frozen naturally on the vine, picked at minus 8°C or colder and pressed while frozen, with Vidal doing most of the work and Riesling and Cabernet Franc behind it. Cool climate Riesling, Chardonnay, Cabernet Franc and Pinot Noir complete the picture.

Numbered regions, in this order:

1. **Ontario**: The larger producer, with three viticultural areas strung along the shores of Lake Ontario and Lake Erie, where the lakes temper a hard continental winter; home of most Canadian icewine.
   - Niagara Peninsula
   - Lake Erie North Shore
   - Prince Edward County
2. **British Columbia**: The western province, its vineyards in the dry interior valleys behind the coastal mountains and, on a smaller scale, on the wetter coast and islands around Vancouver.
   - Okanagan Valley
   - Similkameen Valley
   - Coastal British Columbia
3. **Nova Scotia**: Atlantic Canada's wine province, in the Annapolis and Gaspereau valleys beside the Bay of Fundy, cold and late.
4. **Quebec**: Vineyards south of Montreal and in the Eastern Townships on cold hardy hybrids and, increasingly, vinifera under winter covers, with its own indication, Vin du Québec, and ice cider, an invention of the province.

## England

England makes sparkling wine first and still wine second, in a cool maritime climate that keeps acidity high enough to build a fine traditional method base; most of its vines grow between fifty and fifty-two degrees north. Most of the vineyard lies in the south east, in Kent, Sussex and Hampshire, on soils that include the same chalk that runs under the Channel to Champagne, with greensand and clay besides. Chardonnay, Pinot Noir and Meunier lead the plantings; Bacchus is the still white to know. English Wine is the countrywide PDO, open to vinifera only, with English Regional Wine the PGI beneath it; Sussex gained a PDO of its own in 2022. British wine, made from imported concentrate, is something else entirely.

Numbered regions, in this order:

1. **Kent**: The North Downs chalk and the clays and greensand of the Weald, warm and sheltered in the south east: Chapel Down at Tenterden, Gusbourne at Appledore, and a Champagne house's own plantings.
2. **Sussex**: East and West Sussex, from the chalk of the South Downs to the greensand and clay of the Weald, with a PDO of its own since 2022.
   - South Downs
   - The Weald
3. **Hampshire**: Chalk downland west of Sussex, around Hambledon, where the modern English vineyard began in 1952; Hattingley Valley and Exton Park are names to know, and a Champagne house has planted here too.
4. **Essex**: The Crouch Valley's warm, dry, sheltered slopes on London clay, one of the sunniest corners of England, best known for still Pinot Noir, Chardonnay and Bacchus and for fruit sold to sparkling houses elsewhere.
5. **Surrey and the Thames Valley**: North Downs chalk around Dorking, where Denbies farms a large single estate, and smaller vineyards west into Berkshire and the Chilterns.
6. **Cornwall and the South West**: Milder, wetter and windier: Camel Valley in Cornwall, whose Darnibole vineyard has its own PDO for Bacchus, and estates in Dorset and Devon.
7. **Wales**: Not England but sold beside it: a small, cool, wet vineyard in the south and along the border, with its own Welsh Wine PDO and Welsh Regional Wine PGI.

## Switzerland

Switzerland grows wine in all its language regions but drinks almost all of it at home, so its wines are rare abroad and prized by sommeliers. The French speaking west makes most of it: the Valais, a dry, sunny stretch of the upper Rhône and the largest wine canton, then Vaud on the shore of Lake Geneva, then Geneva itself. Chasselas is the white to know, called Fendant in the Valais and bottled under village names in Vaud, where the terraces of Lavaux and Dézaley give its finest form. Pinot Noir is the most planted grape, Merlot rules Italian speaking Ticino, and the Valais keeps rare old varieties: Petite Arvine, Cornalin, Humagne Rouge, Amigne and Heida. Each canton writes its own AOC.

Numbered regions, in this order:

1. **Valais**: The largest wine canton, the upper Rhône valley from Visp down past Martigny: dry, sunny and foehn swept, on terraces of dry stone walls along the south facing right bank.
   - Sion and the central Valais
   - Fully and Vétroz
   - Visperterminen
   - Val d'Anniviers
2. **Vaud**: The second canton, along the north shore of Lake Geneva and up towards Lake Neuchâtel: Chasselas country, labelled by village rather than grape, with Pinot Noir and Gamay for its reds.
   - Lavaux
   - Chablais
   - La Côte
3. **Geneva**: The third canton, in the countryside around the city on both banks of the Rhône; Satigny in the Mandement is the largest wine commune in the country.
4. **Three Lakes**: The lakes of Neuchâtel, Biel and Murten at the foot of the Jura, on limestone: Chasselas, released unfiltered each January in Neuchâtel, Pinot Noir and Oeil de Perdrix, the pale rosé the canton made its own.
5. **Ticino**: The Italian speaking south of the Alps, sunny but wet, where Merlot arrived after phylloxera in 1906 and now dominates, as red, rosé and even white; Monte Ceneri divides the Sopraceneri to the north from the Sottoceneri to the south.
6. **German speaking Switzerland**: The north and east, from Basel to Lake Constance: Pinot Noir as Blauburgunder, Müller-Thurgau, and Räuschling around Lake Zurich, with Schaffhausen, Zurich and Aargau among its main cantons.
   - Bündner Herrschaft

## Mexico

Mexico is where wine in the Americas began. Spanish settlers planted vines in New Spain from the 1520s, missionaries carried the Mission grape, Listán Prieto, north into California, and Casa Madero at Parras in Coahuila, founded in 1597, is the oldest winery of the Americas. The modern industry lives in Baja California, above all in the Valle de Guadalupe inland from Ensenada, about thirty-two degrees north, where Pacific fog and cool nights rescue a hot, dry valley short of water. Blends of Bordeaux, Spanish, Italian and Rhône grapes are normal, with Nebbiolo and Tempranillo prominent. Vineyards on the high plateau of Coahuila, Querétaro and the centre rely on altitude instead. No appellation system fixes grapes, yields or ageing.

Numbered regions, in this order:

1. **Baja California**: The peninsula south of the United States border that makes most of Mexico's wine, a Mediterranean climate saved by the cold Pacific: dry summers, slight winter rain, fog and sea breezes at night.
   - Valle de Guadalupe
   - Valle de Santo Tomás
   - Valle de San Vicente
   - Ojos Negros
2. **Coahuila**: The northern desert state where altitude, not the sea, cools the nights, and where the Americas' oldest winery still works.
   - Parras
3. **Querétaro**: A high plateau north of Mexico City, around Ezequiel Montes and Tequisquiapan, close to 2,000 metres, where summer rain favours early picked grapes and sparkling wine is the speciality, led by a large traditional method cellar founded by a Catalan cava house.
4. **The central highlands**: Aguascalientes, Zacatecas, Guanajuato around San Miguel de Allende, and San Luis Potosí: vineyards, many of them recent, high on the tropical plateau, betting on altitude for freshness.
5. **Sonora and Chihuahua**: The northern states where grapes are grown mostly for the table, for raisins and for brandy, with only a little wine.

## Eastern Europe

Eight countries on one page. Georgia claims to be the cradle of wine: qvevri, clay vessels buried to the neck, Saperavi and Rkatsiteli, and the appellations of Kakheti. Slovenia is Friuli's other half, Brda facing Collio and Rebula for Ribolla Gialla. Croatia gives Plavac Mali, Malvazija Istarska and Tribidrag, which is Zinfandel. Romania has the Fetească grapes, Bulgaria Mavrud and Melnik, Moldova Codru and its cellars, and Czechia and Slovakia grow Austria's whites. Six are members of the European Union and print PDO and PGI in their own letters; Georgia and Moldova keep systems of their own.

Numbered regions, in this order:

1. **Croatia**: In the European Union since 2013, with ZOI and ZOZP for PDO and PGI, and the homeland of Tribidrag, which is Zinfandel.
   - Istria and Kvarner
   - Dalmatia
   - Slavonia and the Danube
   - Croatian Uplands
2. **Slovenia**: Three regions, named for the sea and two rivers: Primorska on the Adriatic side, Podravje on the Drava, Posavje on the Sava.
   - Primorska
   - Podravje
   - Posavje
3. **Georgia**: Over five hundred native grapes; buried qvevri give amber whites and dark reds, and naturally semi-sweet reds are a legal tradition, not a fault.
   - Kakheti
   - Kartli
   - Imereti
   - Racha-Lechkhumi
4. **Romania**: In the European Union since 2007: whites from Transylvania and the Moldavian hills, reds from the south, the Fetească family for identity, DOC and IG for law.
   - Dealu Mare
   - Cotnari
   - Transylvania and Târnave
   - Murfatlar
   - Drăgășani
5. **Bulgaria**: Once the eastern bloc's bulk red supplier.
   - Thracian Lowlands
   - Danubian Plain
   - Struma Valley and Melnik
6. **Moldova**: Between Romania and Ukraine, with a very high share of its land under vine: three PGIs, vast cellars, and Rara Neagră and Fetească Neagră as native reds.
   - Codru
   - Valul lui Traian
   - Ștefan Vodă
7. **Czechia**: Morava on the Austrian border holds nearly all the vines, Čechy near Prague the rest; VOC, an origin tier, began at Znojmo in 2009.
   - Morava
   - Čechy
8. **Slovakia**: Six regions across the south, from the Small Carpathians to Slovak Tokaj: aromatic whites and Frankovka on an Austrian style ripeness ladder.
   - Small Carpathians
   - Slovak Tokaj

## Lebanon

Lebanon's wine is the Bekaa Valley's: a plateau around a thousand metres up between Mount Lebanon and the Anti-Lebanon, dry and sunny through summer, fed by snow in winter, ripening Cinsault, Cabernet Sauvignon, Carignan, Syrah and Grenache with a freshness that altitude keeps. Château Ksara, founded by Jesuit priests in 1857, is the oldest house and long the largest; Château Musar, founded in 1930, is the one the exam knows, its red a blend of Cabernet Sauvignon, Cinsault and Carignan made at Ghazir on the coast and released around seven years after the harvest. The native whites are Obaideh and Merwah. There is no appellation ladder; Bekaa Valley on a label is geography. Arak, the aniseed grape spirit, comes from many of the same cellars.

Numbered regions, in this order:

1. **Bekaa Valley**: The heart of Lebanese wine: a high plateau around a thousand metres above the sea, between Mount Lebanon to the west and the Anti-Lebanon to the east, with the Litani river running down its length.
   - West Bekaa
   - Zahlé and Chtaura
   - Northern Bekaa and Baalbek
2. **Mount Lebanon**: The coastal range above Beirut: Château Musar's winery and cellars at Ghazir, north of the capital, and a few mountain vineyards in the hills around Bhamdoun.
3. **Batroun**: Hills above the northern coast, where Ixsir, founded in 2008, and a cluster of smaller estates farm terraced slopes; a more maritime counterpart to the Bekaa.
4. **Jezzine**: A small pine clad district in the south above Sidon, high and cool, with a handful of estates.

## Uruguay

Uruguay is the small, humid, Atlantic producer of South America, and Tannat is its grape: Madiran's red, brought by the Basque immigrant Pascual Harriague to Salto in the 1870s, long called Harriague and now the national red, softer here than in France. Most vines grow in Canelones, the department beside Montevideo, on clay over limestone a few kilometres from the Río de la Plata; Maldonado on the Atlantic coast, with granite soils and Albariño, is the newer face. The climate is maritime and wet, so rot is the enemy and open canopies, the lyre trellis among them, the answer. INAVI, the national institute founded in 1987, grades wine as VCP, preferred quality, or VC, common; departments stand in for regions on the label.

Numbered regions, in this order:

1. **Canelones**: The department beside Montevideo, to its north and east, holding most of the country's vineyards on clay and clay over limestone within reach of the Río de la Plata: the heartland of Tannat and of the immigrant family wineries that built the industry.
   - Juanicó and Las Violetas
   - Progreso
2. **Montevideo**: The capital's own department, with vineyards at Melilla on its northern edge, where Bouza farms Tannat, Albariño and Tempranillo on clay loam minutes from the city.
3. **Maldonado**: The Atlantic department around Punta del Este, planted on decomposed granite hills a short way from the ocean: firm, fresh Tannat, saline Albariño and the country's largest modern investment at Garzón.
   - Garzón
4. **Colonia**: The south western department across the river from Buenos Aires, with old estates around Carmelo and some of the country's oldest cellars; Tannat and Cabernet.
5. **San José**: West of Canelones, a smaller department of family estates on similar clay soils, part of the same Río de la Plata belt.
6. **Rivera**: The northern border with Brazil, hotter and inland, where Carrau's Cerro Chapeu vineyard stands on deep sandy soils; Tannat and Cabernet with a riper, drier profile than the coast.
7. **Salto**: In the north west on the Río Uruguay, warm and far from the coast, where Pascual Harriague planted Tannat in the 1870s: the history of the national grape begins here.
8. **Paysandú**: South of Salto on the Río Uruguay, warm and continental, with a few estates and early harvests.

