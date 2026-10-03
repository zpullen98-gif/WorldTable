# gap-7
No live source was available in this pass. The WebSearch budget was already exhausted (200 of 200) before the first query ran, and the agent proxy answered 403 to every CONNECT, including brennansneworleans.com, web.archive.org, archive.ph and r.jina.ai. The scratchpad text files are plain dumps of the same PDF and the repository holds no earlier producer research. Part A therefore produced zero (search) statements: all seventeen sourcing names stay at status unconfirmed, with one true PDF-grounded sentence each plus clearly labelled (expert) background and a confidence grade. Part B could not read the recipes index or any recipe page; the four recipe questions (marchand de vin build, rum and banana liqueur, cinnamon in the flame, turtle soup stock) are answered only as (pdf) where the guide itself speaks and as (expert) recall of Brennan's widely reproduced published recipes, which is not proof of the 2026 kitchen. The full PDF was re-read (pages 1 to 51), the exact printed name for every producer is recorded with its page, several script risks were found (the oyster naming inference on p13, the banana liqueur line on p33, the three different marchand de vin definitions on p2, p17 and p50, the singular Creekstone Farm on p23), and an exact re-run query list is given so the next pass with search budget can close the gap quickly.

# Gap 7: sourcing names and the recipes index

## 1. Run conditions, stated plainly

- WebSearch returned "web search budget exhausted (200 of 200)" on every call, including the very first one in this pass. No search snippet was obtained. Nothing below carries the label (search).
- WebFetch was not called, per the ground rules. A single curl probe to https://www.brennansneworleans.com/recipes/ failed with "CONNECT tunnel failed, response 403". The proxy status log shows the same 403 for web.archive.org, archive.ph and r.jina.ai, so no mirror route exists either.
- The scratchpad files brennans.txt and guide.txt are byte-identical text extractions of the PDF (cmp confirmed). design-plan.md holds no producer names. The repository's table/recipe/bananas-foster.html is The World Table's own generic home recipe (80 g butter, 100 g brown sugar, 60 ml dark rum plus optional 30 ml banana liqueur). It is app content, not a Brennan's source, and is not used as evidence here.
- The PDF was re-read in full, pages 1 to 51, with the Read tool.

Labels used: (pdf pN) what the PDF prints on page N; (expert) professional knowledge from memory, never a fact about Brennan's. Confidence on (expert) lines is given honestly; several are low.

## 2. Where each name is printed (pdf)

| Name as printed | Page | Dish or wine | Printed sourcing words |
|---|---|---|---|
| Grand Isle Jewel Oysters | p12, p13, p41, p49 | Dinner $22, dinner tasting first course | "Served raw, preserved Fresno chili mignonette, parsley" |
| New Orleans Tien Dat tofu | p27, p28, p47 | Blackened Tofu, dinner $25 | "New Orleans Tien Dat tofu, Two Brooks Farm rice grits, preserved shiitake mushrooms" |
| Two Brooks Farm rice grits | p27 | Blackened Tofu | as above |
| Maggie's mushrooms | p24, p32 | Side, dinner $12 | "(no description printed)" |
| 100% turtle meat | p14, p48 | Turtle Soup $13 | no supplier named anywhere in the PDF |
| Rohan duck breast; Rohan duck leg | p6, p7, p20, p46 | Dinner tasting course four; Duck Confit Waffle $32 | "Rohan" only; no farm or distributor printed |
| Congregation Coffee & Chicory; single-origin Papua New Guinea from Congregation Coffee | p34, p49 | Breakfast tasting dessert pour; coffee $11 | p49 lists the PNG single origin as a coffee menu item |
| Creekstone Farm Prime hanger steak | p23 | Creole-Spiced Hanger Steak, B/L $38 | note the singular "Farm" on this page |
| Creekstone Farms beef tenderloin | p24 | Roasted Chateaubriand, dinner $120 | |
| Creekstone Farms hanger steak | p28 | Creole Hanger Steak, dinner $42 | no "Prime" printed on the dinner line |
| Vital Farms egg | p23 | Creole-Spiced Hanger Steak, B/L | "sunny side up Vital Farms egg" |
| Leidenheimer crisps | p16 | Creole Caesar $15 | guide adds "New Orleans' classic French-bread bakery" |
| Nueske's bacon | p31 | Succotash, dinner $12 | guide adds "a famously smoky Wisconsin bacon" |
| Luxardo sauce | p34, p48 | Cherries Jubilee $14 | guide adds "the Italian house famous for maraschino cherries and liqueur" |
| Charles Lafitte Brut Champagne NV | p13, p17, p18, p42, p49 | Tasting pour, 4 oz, both tastings | "Not on the by-the-glass list" |
| Damien Martin Bourgogne Pinot Noir 2023 | p7, p14, p16, p18, p20, p22, p28, p44 | $17 glass; first pick for Blackened Tofu | "Pinot Noir · Burgundy, France" |
| Domaine de Châteaumar 'Cuvée Vincent' Côtes du Rhône | p5, p45, p49 | Breakfast tasting pour with the petite filet | "Grenache-based · Rhône Valley, France" |
| Domaine Durand Sauvignon Blanc 2025 | p11, p12, p18, p42 | $14 glass; first pick for Eggs Sardou | "Sauvignon Blanc · Loire Valley, France" |
| Fichet 'Château London' Mâcon-Igé 2024 | p6, p43, p49 | Dinner tasting pour with the BBQ lobster | "Chardonnay · Mâconnais, Burgundy, France" |

## 3. Part A: producer records

Every record below has confirmed_by_kitchen: false, source_date: 2026-09-26 for the (pdf) sentence, and status: unconfirmed unless stated. "one_true_sentence" is always PDF-grounded so it can be printed safely. The (expert) block is background for the researcher, not for the guest script.

### prod-grand-isle-jewel
- name: Grand Isle Jewels (brand name as understood; unverified)
- name_as_printed: "Grand Isle Jewel Oysters" (pdf p12)
- type: oyster brand or farm
- location: not printed; the guide says Grand Isle is a barrier island on Louisiana's coast (pdf p13)
- founded: unknown
- one_true_sentence: Grand Isle Jewel is the name the dinner menu prints for the raw oysters, served with a preserved Fresno chilli mignonette and parsley, and they open the dinner tasting (pdf p12, p49).
- why_named_on_menu: a named Louisiana oyster signals provenance on a raw course (expert)
- dish_ids: grand-isle-jewel-oysters
- label: pdf
- source: Brennan's dinner menu as read in the PDF
- status: unconfirmed
- confidence: low on anything beyond the printed name
- (expert, low): the name reads like a brand for off-bottom, cage-farmed oysters from Grand Isle, Louisiana, which is the style of farming the task's hint (JEDCO, grandislejewels.com) describes. I could not verify a launch date, an owner or any Brennan's mention. The p13 script line that the oysters "are named for" the island is an inference, not a menu fact.

### prod-tien-dat
- name: Tien Dat (tofu maker)
- name_as_printed: "New Orleans Tien Dat tofu" (pdf p27)
- type: tofu maker
- location: New Orleans, per the menu's wording; no neighbourhood printed
- founded: unknown
- one_true_sentence: The dinner menu prints "New Orleans Tien Dat tofu" as the base of the Blackened Tofu, served on Two Brooks Farm rice grits with preserved shiitake mushrooms (pdf p27).
- why_named_on_menu: a local tofu maker gives a vegetarian entrée a provenance story (expert)
- dish_ids: blackened-tofu
- label: pdf
- status: unconfirmed
- confidence: low
- (expert, low): nothing is known to me about a Tien Dat tofu business. The Vietnamese spelling would be Tiến Đạt. New Orleans East and the Westbank hold the city's Vietnamese food producers, so a registry search is the right next step. The guide's "made right here in New Orleans" (p28) is supported by the menu's own wording and is safe; adding a founder or an address is not.

### prod-two-brooks-farm
- name: Two Brooks Farm
- name_as_printed: "Two Brooks Farm rice grits" (pdf p27)
- type: rice farm
- location: Sumner, Mississippi (expert)
- founded: unknown to me
- one_true_sentence: Two Brooks Farm is printed on the dinner menu as the source of the rice grits under the Blackened Tofu (pdf p27).
- why_named_on_menu: a named Delta rice farm supports the "rice grits" (broken rice) story (expert)
- dish_ids: blackened-tofu
- label: pdf
- status: unconfirmed
- confidence: medium on the (expert) background, which is: Two Brooks Farm is a family rice farm at Sumner in the Mississippi Delta, run by the Wagner family, known for wildlife-friendly rice growing and for selling rice grits, which are broken rice cooked like grits. No source linking it to Brennan's by name was checked.

### prod-maggies-mushrooms
- name: unknown ("Maggie" is not identified by the menu)
- name_as_printed: "Maggie's Mushrooms" (pdf p32)
- type: unknown; possibly a mushroom farm, possibly a person's name on a house side
- location: unknown
- founded: unknown
- one_true_sentence: Maggie's Mushrooms is a $12 dinner side printed with no description, and the guide's own service note says to learn who Maggie is at lineup (pdf p32).
- why_named_on_menu: unknown; the name may honour a grower or a person in the house (expert)
- dish_ids: maggies-mushrooms
- label: pdf
- status: unconfirmed
- confidence: low
- (expert, low): the earlier inference pointed to Mushroom Maggie's Farm at St Francisville, Louisiana (Maggie Long and Cyrus Lester), a specialty grower that sells to restaurants. I could not verify any link to Brennan's. This must not enter a guest script until the kitchen confirms it.

### prod-turtle-supplier
- name: none printed
- name_as_printed: "100% turtle meat" (pdf p14)
- type: not applicable
- one_true_sentence: The menu prints "100% turtle meat" for the Turtle Soup and names no supplier anywhere (pdf p14, p48).
- why_named_on_menu: "100%" tells the guest it is not a mock turtle soup (expert)
- dish_ids: turtle-soup
- label: pdf
- status: no name to confirm; the dossier does not need one
- confidence: high that no supplier is printed
- (expert, low): Louisiana restaurants buy turtle meat, usually snapping turtle, from regional seafood wholesalers, farm-raised or wild. Which house supplies Brennan's is unknown and should be asked, not guessed.

### prod-rohan-duck
- name: Rohan duck (a D'Artagnan trademark, expert)
- name_as_printed: "Roasted Rohan Duck Breast" (pdf p6); "Rohan duck leg" (pdf p20)
- type: branded duck breed sold by a distributor
- location: D'Artagnan is based in Union, New Jersey; the farms are in the United States (expert, medium); the state is unverified
- founded: D'Artagnan founded 1985 by Ariane Daguin (expert, medium)
- one_true_sentence: Rohan is the only sourcing word the menu prints for the duck, on the dinner tasting breast and the Duck Confit Waffle leg (pdf p6, p20).
- why_named_on_menu: a named duck breed signals a premium bird (expert)
- dish_ids: roasted-rohan-duck-breast, duck-confit-waffle
- label: pdf
- status: unconfirmed (the D'Artagnan link is expert, not printed)
- confidence: medium that Rohan is D'Artagnan's trademark; low on the breed description
- (expert, low): D'Artagnan describes Rohan as its own hybrid, bred for rich flavour and a Pekin-like size. The company's own page should be quoted before any of this is used. The guide's "a specialty duck breed with rich, flavorful meat" (p7) is safe.

### prod-congregation-coffee
- name: Congregation Coffee Roasters
- name_as_printed: "Congregation Coffee & Chicory" (pdf p34); "a single-origin Papua New Guinea from Congregation Coffee" (pdf p49)
- type: coffee roaster and café
- location: Algiers Point, New Orleans (expert, medium)
- founded: about 2016 (expert, low)
- one_true_sentence: The menu lists Congregation Coffee & Chicory as the breakfast tasting's coffee with the Bananas Foster, and a Papua New Guinea single origin from Congregation among the $11 coffees (pdf p34, p49).
- why_named_on_menu: a neighbourhood roaster across the river supports the chicory coffee story (expert)
- dish_ids: world-famous-bananas-foster (zero-proof pour), coffee-eye-openers
- label: pdf
- status: unconfirmed (PNG origin on the roaster's own list not verified)
- confidence: medium on location; low on the current PNG offering
- (expert): single-origin lists at small roasters rotate with the harvest, so the PNG origin printed on the menu may or may not be on the roaster's list on a given week. The dossier should keep "as the menu prints it".

### prod-creekstone-farms
- name: Creekstone Farms Premium Beef
- name_as_printed: "Creekstone Farm Prime hanger steak" (pdf p23, singular); "Creekstone Farms beef tenderloin" (pdf p24); "Creekstone Farms hanger steak" (pdf p28)
- type: beef processor, Black Angus programme
- location: Arkansas City, Kansas (expert, medium)
- founded: the Creekstone Farms brand dates from the 1990s; the Arkansas City plant opened in 2003 (expert, low)
- one_true_sentence: Creekstone Farms is printed on three steak dishes, and only the breakfast and lunch hanger line prints "Prime" (pdf p23, p24, p28).
- why_named_on_menu: a named Angus programme with a Prime grade supports the steak price (expert)
- dish_ids: creole-spiced-hanger-steak-bl, roasted-chateaubriand, creole-hanger-steak-dinner
- label: pdf
- status: unconfirmed on ownership and welfare certification
- confidence: medium on location and the Prime Black Angus programme; low on ownership today; low on Certified Humane
- (expert): Creekstone was bought by Sun Capital Partners in 2013. Any later change of ownership is unverified and I will not state one. The Arkansas City plant was designed with Temple Grandin's input for humane handling. Whether the company holds a formal Certified Humane label is unverified; do not print it.

### prod-vital-farms
- name: Vital Farms
- name_as_printed: "sunny side up Vital Farms egg" (pdf p23)
- type: pasture-raised egg company
- location: Austin, Texas (expert, high)
- founded: 2007 (expert, medium)
- one_true_sentence: Vital Farms is printed as the egg on the breakfast and lunch Creole-Spiced Hanger Steak (pdf p23).
- why_named_on_menu: a recognised pasture-raised brand on a $38 steak-and-eggs plate (expert)
- dish_ids: creole-spiced-hanger-steak-bl
- label: pdf
- status: unconfirmed by producer page this run
- confidence: medium-high on the (expert) standard: Vital Farms' pasture-raised standard gives each hen at least 108 square feet of outdoor pasture, with Certified Humane pasture-raised certification.

### prod-leidenheimer
- name: Leidenheimer Baking Company
- name_as_printed: "Leidenheimer crisps" (pdf p16)
- type: bakery
- location: New Orleans (expert, high)
- founded: 1896 by George Leidenheimer (expert, high)
- one_true_sentence: Leidenheimer is printed as the bread behind the crisps on the Creole Caesar at both meals (pdf p16).
- why_named_on_menu: the city's best-known French bread bakery, the po-boy loaf (expert)
- dish_ids: creole-caesar
- label: pdf
- status: unconfirmed by producer page this run; the (expert) facts are well established
- confidence: high on founding and po-boy bread

### prod-nueskes
- name: Nueske's Applewood Smoked Meats
- name_as_printed: "Nueske's bacon" (pdf p31)
- type: smokehouse
- location: Wittenberg, Wisconsin (expert, high)
- founded: 1933 by R. C. Nueske (expert, high)
- one_true_sentence: Nueske's is printed as the bacon in the dinner Succotash (pdf p31).
- why_named_on_menu: a nationally known applewood-smoked bacon (expert)
- dish_ids: succotash
- label: pdf
- status: unconfirmed by producer page this run; the (expert) facts are well established
- confidence: high

### prod-luxardo
- name: Girolamo Luxardo S.p.A.
- name_as_printed: "Luxardo sauce" (pdf p34)
- type: liqueur and cherry producer
- location: Torreglia, Veneto, Italy (expert, high)
- founded: 1821 in Zara, now Zadar, Croatia; moved to Torreglia after the Second World War (expert, high)
- one_true_sentence: The dessert menu prints "Luxardo sauce" on the Cherries Jubilee, flambéed tableside over vanilla ice cream (pdf p34).
- why_named_on_menu: Luxardo stands for maraschino in a cherry dessert (expert)
- dish_ids: cherries-jubilee
- label: pdf
- status: unconfirmed which product
- confidence: high on the company; low on which product the sauce uses
- (expert): a "Luxardo sauce" could be built on Luxardo Maraschino liqueur, on the syrup from Luxardo Original Maraschino Cherries, or on Sangue Morlacco cherry liqueur. The kitchen must say which. The guide's "Italian house famous for maraschino cherries and liqueur" (p34) is accurate.

### prod-charles-lafitte
- name: Charles Lafitte (Champagne brand)
- name_as_printed: "Charles Lafitte Brut Champagne NV" (pdf p42)
- type: Champagne brand within a group
- location: Champagne, France
- founded: the brand carries the date 1834 (expert, medium)
- one_true_sentence: Charles Lafitte Brut is the 4 oz tasting pour with Eggs Hussarde at breakfast and with the Grand Isle Jewel oysters at dinner, and it is not on the by-the-glass list (pdf p42).
- why_named_on_menu: a group-owned brand gives a tasting pour at a workable cost (expert)
- dish_ids: eggs-hussarde, grand-isle-jewel-oysters
- label: pdf
- status: unconfirmed on cuvée
- confidence: medium that the brand belongs to Vranken-Pommery Monopole; low on which cuvée (the "1834" Brut is the label I associate with the US market)

### prod-damien-martin
- name: unknown producer
- name_as_printed: "Damien Martin Bourgogne Pinot Noir 2023" (pdf p44)
- type: unknown; may be a domaine, a négociant label or an importer-created label
- location: Burgundy, France (pdf p44)
- founded: unknown
- one_true_sentence: Damien Martin Bourgogne Pinot Noir 2023 is the $17 red Burgundy by the glass and the first pick for the Blackened Tofu (pdf p44).
- why_named_on_menu: a light red Burgundy by the glass at $17 (pdf)
- dish_ids: blackened-tofu (first pick); second choice on p7, p14, p16, p18, p20, p22
- label: pdf
- status: unconfirmed
- confidence: low
- (expert, low): I do not recognise Damien Martin as an established estate. The back label (importer name) on the bottle at the bar is the fastest answer. Do not call it "a domaine" in the script.

### prod-chateaumar
- name: Domaine de Châteaumar
- name_as_printed: "Domaine de Châteaumar 'Cuvée Vincent' Côtes du Rhône" (pdf p45)
- type: wine estate
- location: not printed; Sorgues, Vaucluse, near Châteauneuf-du-Pape (expert, low)
- founded: unknown
- one_true_sentence: Domaine de Châteaumar 'Cuvée Vincent' Côtes du Rhône is the 4 oz breakfast tasting pour with the petite filet mignon (pdf p5, p45).
- why_named_on_menu: a soft Grenache red for a breakfast steak course (pdf p5)
- dish_ids: petite-filet-mignon
- label: pdf
- status: unconfirmed
- confidence: low on the estate's location and the Bouche family link; both must be verified before use

### prod-domaine-durand
- name: Domaine Durand (which one, unknown)
- name_as_printed: "Domaine Durand Sauvignon Blanc 2025" (pdf p42)
- type: wine estate
- location: Loire Valley, France (pdf p42); village and appellation unknown
- founded: unknown
- one_true_sentence: Domaine Durand Sauvignon Blanc 2025 is the $14 Loire white by the glass and the first pick for Eggs Sardou (pdf p42).
- why_named_on_menu: a crisp, herbal Loire Sauvignon for artichokes (pdf p18)
- dish_ids: eggs-sardou (first pick); creole-tomato-tostada and louisiana-crab-claws (second choice)
- label: pdf
- status: unconfirmed
- confidence: low
- (expert, low): several Durand estates exist in the Loire, in Touraine and in Sancerre among others; at $14 a glass a Touraine or Val de Loire IGP Sauvignon is more likely than Sancerre, but this is a guess. Say "Loire Sauvignon Blanc" and nothing narrower until the label is read.

### prod-fichet
- name: Domaine Fichet
- name_as_printed: "Fichet 'Château London' Mâcon-Igé 2024" (pdf p43)
- type: wine estate
- location: Igé, Mâconnais, Burgundy (pdf p43 gives Mâconnais; the village is expert, medium)
- founded: unknown
- one_true_sentence: Fichet 'Château London' Mâcon-Igé 2024 is the dinner tasting's white, poured 4 oz with the Louisiana BBQ Lobster (pdf p6, p43).
- why_named_on_menu: a Mâcon Chardonnay with body for lobster (pdf p6)
- dish_ids: louisiana-bbq-lobster
- label: pdf
- status: unconfirmed on the origin of the lieu-dit name
- confidence: medium that Domaine Fichet is a family estate in Igé run by the Fichet brothers; low on why the plot is called Château London (I recall it as a named plot, a lieu-dit, in the commune of Igé; the family's own explanation must be read)

## 4. Part B: recipes

### What could not be done
The recipes index at brennansneworleans.com/recipes/ and every recipe page under it were unreachable (proxy 403), and no search snippet could be obtained. No ingredient list can be quoted "as printed with the date read". The PDF's own sources list cites only one recipe page, Bananas Foster (pdf p51, item 11). Baked Apple, Turtle Soup and Gumbo recipe pages are therefore still unread, and whether the index holds marchand de vin, hollandaise, Eggs Hussarde, milk punch, Bloody Bull, Café Brûlot or bread pudding pages is unknown.

### What the PDF itself says on the four questions (pdf)
1. Marchand de vin. Three different definitions appear: "a red wine and mushroom sauce" (p2, voice rules example), "a savory red wine reduction" and "a red wine reduction" (p17, p19) and "a savory red wine sauce" (p50, menu words). The service note on p17 adds only that it "is made with red wine". None of the three mentions ham, onion or garlic.
2. Rum and banana liqueur. The menu line is "bananas, butter, brown sugar, cinnamon, rum" (p33). The p34 service note states: "The printed menu says rum; Brennan's own published recipe also uses banana liqueur, follow the house procedure you're trained on." The 45 s script on p33 nevertheless tells the guest "then banana liqueur, and the bananas go in to soften".
3. Cinnamon. The PDF says cinnamon is cooked with the butter and brown sugar (p33, technique box: "cooked in butter, brown sugar and cinnamon, then flambéed with rum at the table"). No page mentions cinnamon shaken into the flame.
4. Turtle soup. The menu line is "100% turtle meat, brown butter spinach, grated egg, aged Sherry" (p14). The service note says "Creole turtle soups are usually roux-thickened, so ask the kitchen about gluten" (p15). Neither flour, beef stock nor veal stock is printed.

### What is known from memory about Brennan's published recipes (expert; a home recipe page is not proof of what the 2026 kitchen does)
- Bananas Foster (the restaurant's long-published recipe, reproduced for decades; medium-high confidence on the list, but it must be re-read for a dated quote): 1/4 cup butter, 1 cup brown sugar, 1/2 teaspoon cinnamon, 1/4 cup banana liqueur, 4 bananas cut in half lengthwise then halved, 1/4 cup dark rum, 4 scoops vanilla ice cream. Method: butter, sugar and cinnamon melt together over low heat until the sugar dissolves; banana liqueur is stirred in; bananas go in; when they soften, the rum is added, heated and tipped to ignite; bananas go over the ice cream and the sauce is spooned over. So, if the page still reads as it did: yes, rum and banana liqueur both; cinnamon is in the pan from the start; there is no step shaking cinnamon into the flame. The cinnamon-sparks flourish is a common tableside showman's step in New Orleans dining rooms; whether Brennan's captains do it is a house question, not a recipe question.
- Marchand de vin (the classic build from the 1961 Brennan's New Orleans Cookbook, medium confidence): butter, finely chopped mushrooms, ham, shallots or green onions, onion and garlic, sweated, then flour, then beef stock and red wine, simmered and seasoned with salt, pepper and cayenne. So the classic Brennan's sauce carries ham, mushroom, onion and garlic. That makes p2's "red wine and mushroom sauce" the closer of the guide's two wordings, and p17's "red wine reduction" the looser one. Whether the 2026 kitchen still uses ham is unconfirmed; it matters for the vegetarian note on Eggs Sardou (which carries Choron, not marchand de vin) and for any guest avoiding pork on Eggs Hussarde or Eggs Owen.
- Turtle soup (as reproduced from Brennan's cookbooks, low to medium confidence): butter and flour roux, diced turtle meat, onion, celery, garlic, bay, thyme, oregano, beef stock, tomato purée, lemon juice, Worcestershire, sherry, chopped hard-boiled egg, spinach and parsley. I do not recall veal stock in the Brennan's version. The current menu's "brown butter spinach, grated egg, aged Sherry" (pdf p14) rhymes with that build, but this is not proof.
- Eggs Hussarde (medium): the original 1940s recipe used Holland rusks under the Canadian bacon; the current menu prints housemade English muffins (pdf p17). Sauce order in the classic plate: marchand de vin on the bacon, poached egg, hollandaise over.
- Brandy Milk Punch (medium): brandy, cream or half-and-half, simple syrup or sugar, vanilla, shaken over ice, nutmeg on top. The 2026 menu line is "Brandy, heavy cream, vanilla bean, nutmeg" (pdf p38), which the guide describes as shaken. No contradiction found between the PDF's own pages on this drink.
- Bloody Bull: vodka, housemade Bloody Mary mix, beef bouillon (pdf p38); a published build was not read.
- Café Brûlot (high, as a classic): brandy, orange and lemon peel, cinnamon sticks, cloves, sugar, flamed, then strong black coffee ladled in. The coffee cake on p9 borrows these flavours (pdf).
- Baked Apple, Seafood Filé Gumbo, Hollandaise, Bread Pudding: I decline to reconstruct these from memory; they must be read.

### What the pages would settle (to be confirmed on re-run)
- Rum and banana liqueur: expected yes to both on the published page (pdf p34 already says the published recipe uses banana liqueur).
- Cinnamon in the flame: expected no on the published page; it is a cart flourish question for the captains.
- Marchand de vin: expected ham, mushroom, onion, garlic in any published Brennan's version; the kitchen's current build still needs a lineup answer.
- Turtle soup: expected flour roux and beef stock, no veal, in the published version; the 2026 soup may differ.

## 5. Corrections for the dossiers (short list)
1. Unify marchand de vin across p2, p17, p19 and p50 to one line: "a savoury red wine sauce; the classic Brennan's build is red wine, beef stock, mushroom and ham; confirm tonight's build". Keep "red wine reduction" out, since a flour-bound sauce is not a reduction (expert).
2. p13: change "these oysters are named for it" to "the menu prints the Grand Isle name" until the farm is confirmed.
3. p23: the menu line reads "Creekstone Farm Prime hanger steak" (singular); check the live menu; the company is Creekstone Farms.
4. p33: the 45 s Bananas Foster script promises banana liqueur that the printed menu does not list; either confirm with the captain's build or drop the words from the script. The p34 note already warns about this, so the script and the note disagree.
5. p41: "Read read live online" is a typo.
6. Rohan (p6, p7, p20): do not add D'Artagnan to any script until the kitchen confirms the distributor.
7. p49: keep the Papua New Guinea single origin as "as printed on the coffee list", since a roaster's single origins rotate.
8. p45, p42, p44: do not name a village for Châteaumar, an appellation for Durand or a domaine for Damien Martin; the PDF is correct to stay at region level.
9. Turtle soup: no supplier is printed anywhere; the dossier should carry "supplier not printed; ask the kitchen" rather than a blank marked unconfirmed.
10. p28: the dinner Creole Hanger Steak line does not print "Prime"; the dossier should not carry the grade across from the breakfast plate.

## 6. Re-run plan once search budget is restored (exact queries)
- "Grand Isle Jewels" oysters; grandislejewels.com; "Grand Isle Jewels" JEDCO; "Grand Isle Jewels" Brennan's
- "Tien Dat" tofu New Orleans; "Tiến Đạt" tofu New Orleans; "Tien Dat" Louisiana Secretary of State business
- "Mushroom Maggie's" St. Francisville; "Mushroom Maggie's" Brennan's; "Maggie Long" "Cyrus Lester" mushrooms
- Brennan's turtle soup supplier; "turtle meat" Louisiana wholesaler restaurants; "farm-raised" snapping turtle Louisiana
- dartagnan.com Rohan duck; "Rohan duck" Brennan's
- congregationcoffee.com Papua New Guinea; "Congregation Coffee" Brennan's
- creekstonefarms.com about; "Creekstone Farms" owner 2025; "Creekstone Farms" "Certified Humane"
- vitalfarms.com pasture-raised 108 square feet
- twobrooksfarm.com rice grits Sumner Mississippi Wagner
- leidenheimer.com history 1896
- nueskes.com history 1933 Wittenberg
- luxardo.it history Zara Torreglia; "Luxardo sauce" cherries jubilee
- "Charles Lafitte" Champagne Vranken-Pommery United States cuvée
- "Damien Martin" Bourgogne Pinot Noir importer
- "Domaine de Châteaumar" Sorgues "Cuvée Vincent"; "Châteaumar" Bouche
- "Domaine Durand" Sauvignon Blanc Loire importer
- "Château London" Igé Fichet lieu-dit
- site:brennansneworleans.com recipes (then each recipe page), and the Bananas Foster page for a dated ingredient quote

CORRECTIONS: [
 {
  "page": "2, 17, 19, 50",
  "quote": "marchand de vin, a red wine and mushroom sauce",
  "problem": "The guide defines marchand de vin three ways: red wine and mushroom sauce (p2), red wine reduction (p17, p19) and savoury red wine sauce (p50). None mentions ham. The classic Brennan's build is a flour-bound sauce of red wine, beef stock, mushroom and ham, which is not a reduction (expert, medium).",
  "correction": "Use one wording everywhere: \"marchand de vin, a savoury red wine sauce; the classic Brennan's build has mushroom and ham, confirm tonight's build with the kitchen\". Drop \"reduction\".",
  "confidence": "medium"
 },
 {
  "page": "13",
  "quote": "these oysters are named for it",
  "problem": "The menu prints only the name Grand Isle Jewel; that the oysters are named for the island is an inference the PDF presents as fact.",
  "correction": "\"Grand Isle is a barrier island on Louisiana's coast, and Grand Isle Jewel is the name on our menu\" until the farm is confirmed.",
  "confidence": "high"
 },
 {
  "page": "23",
  "quote": "Creekstone Farm Prime hanger steak",
  "problem": "Singular \"Farm\" here, \"Creekstone Farms\" on p24 and p28. The company is Creekstone Farms Premium Beef (expert).",
  "correction": "Check the live menu line; unify to Creekstone Farms in the dossier and note the menu spelling if it really is singular.",
  "confidence": "medium"
 },
 {
  "page": "33",
  "quote": "then banana liqueur, and the bananas go in to soften",
  "problem": "The 45-second script promises banana liqueur, which the printed menu does not list; the p34 service note says to follow the house procedure instead.",
  "correction": "Either confirm the captain's cart build and keep the line, or cut \"banana liqueur\" from the script and leave it in the service note only.",
  "confidence": "high"
 },
 {
  "page": "41",
  "quote": "Read read live online September 26, 2026",
  "problem": "Doubled word.",
  "correction": "\"Read live online September 26, 2026\".",
  "confidence": "high"
 },
 {
  "page": "7",
  "quote": "Rohan is a specialty duck breed with rich, flavorful meat",
  "problem": "Accurate as far as it goes, but Rohan is a distributor's trademark (D'Artagnan, expert, medium) and the menu does not print the distributor.",
  "correction": "Keep the line; add a trainer note: do not name D'Artagnan at the table until the kitchen confirms the source.",
  "confidence": "medium"
 },
 {
  "page": "49",
  "quote": "a single-origin Papua New Guinea from Congregation Coffee",
  "problem": "Taken from the menu read; a small roaster's single origins rotate, so the origin may change without the menu being updated.",
  "correction": "Add \"as printed on the coffee list; confirm the current origin at lineup\".",
  "confidence": "medium"
 },
 {
  "page": "32",
  "quote": "The menu prints no description. At lineup, learn the mushroom varieties, how they're cooked, who Maggie is",
  "problem": "Correct and should stay; the risk is elsewhere: the earlier research inference linking the side to Mushroom Maggie's Farm (St Francisville) is unverified and must not be added to the script.",
  "correction": "No change to the page; add a dossier note that the farm link is unconfirmed.",
  "confidence": "high"
 },
 {
  "page": "14, 15",
  "quote": "100% turtle meat",
  "problem": "The gap note treats the turtle supplier as an unconfirmed printed name; no supplier is printed anywhere in the PDF.",
  "correction": "Record \"supplier not printed; ask the kitchen\" rather than an unconfirmed producer record.",
  "confidence": "high"
 },
 {
  "page": "34",
  "quote": "Luxardo is the Italian house famous for maraschino cherries and liqueur",
  "problem": "Accurate, but the menu's \"Luxardo sauce\" does not say which Luxardo product is used, which affects the alcohol note.",
  "correction": "Add to the service note: \"ask whether the sauce is built on the Maraschino liqueur or the cherry syrup\".",
  "confidence": "medium"
 },
 {
  "page": "45, 42, 44",
  "quote": "Grenache-based \u00b7 Rh\u00f4ne Valley, France",
  "problem": "Correctly region-level for Ch\u00e2teaumar, Durand (Loire Valley) and Damien Martin (Burgundy). The risk is in the dossiers, where earlier passes attached an unverified estate, appellation or producer.",
  "correction": "Keep the PDF's region-level wording in the dossiers until each back label is read: no village for Ch\u00e2teaumar, no appellation for Durand, no \"domaine\" for Damien Martin.",
  "confidence": "high"
 },
 {
  "page": "28",
  "quote": "Creekstone Farms hanger steak, housemade Creole spice",
  "problem": "The dinner hanger line prints no grade, while the breakfast line prints Prime (p23); a dossier that copies \"Prime\" to the dinner plate would overstate.",
  "correction": "Carry the grade only on the breakfast and lunch plate.",
  "confidence": "high"
 }
]
OPEN: ["Who is Maggie, what mushrooms are in Maggie's Mushrooms tonight, and is the side vegetarian (butter, stock)?", 'Which oyster farm or brand stands behind "Grand Isle Jewel", and are the oysters off-bottom cage farmed?', 'Who or where is Tien Dat, the New Orleans tofu maker, and is the Blackened Tofu fully vegan (blackening butter, rice grits stock)?', 'Who supplies the turtle meat for the Turtle Soup, and is the 2026 soup roux-thickened on beef stock, veal stock or neither?', "What is the kitchen's current marchand de vin build: does it still carry ham, mushroom, onion and garlic as in the classic Brennan's recipe?", 'On the Bananas Foster cart, does the captain use banana liqueur as well as rum, and is cinnamon shaken into the flame for sparks?', 'Which Luxardo product (Maraschino liqueur, cherry syrup or Sangue Morlacco) goes into the Cherries Jubilee sauce, and is a single order possible?', "Is the Rohan duck bought from D'Artagnan, and where is it raised?", 'Is the Papua New Guinea single origin still the Congregation Coffee on the list this week?', 'Which Charles Lafitte cuvée is poured on the tastings?', 'What importer and producer appear on the back label of the Damien Martin Bourgogne Pinot Noir 2023?', 'What village and appellation are on the Domaine Durand Sauvignon Blanc 2025 label?', 'Where is Domaine de Châteaumar, and what does the family say about the Cuvée Vincent?', 'Why is the Fichet Mâcon-Igé plot called Château London?', 'Does the dinner Creole Hanger Steak use the same Prime-grade Creekstone cut as the breakfast plate?', 'Is the live menu line really "Creekstone Farm" (singular) on the breakfast hanger steak?', 'Does the recipes index on brennansneworleans.com list Baked Apple, Turtle Soup, Seafood Filé Gumbo, marchand de vin, hollandaise, Eggs Hussarde, Brandy Milk Punch, Bloody Bull, Café Brûlot or Bread Pudding, and what does each ingredient list say as printed on the date read?']