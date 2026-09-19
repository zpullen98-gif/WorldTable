/* The Floor Deck, section "methods". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0025',
		term: 'Boiled',
		packet: true,
		gist: 'Cooked fully submerged in water at a full, rolling bubble',
		guest: "It's cooked right in boiling water, which keeps the flavor clean and sweet, so the lobster or potatoes really shine.",
		why: 'A rolling boil is as hot as water gets at sea level, 100 C (212 F), and the bubbles keep everything moving. That suits pasta, potatoes, lobster and crab, which want fast, even heat. Delicate fish and meat toughen at a hard boil, so kitchens simmer or poach those.',
		pairs: 'Lobster with drawn butter, potatoes with parsley, corned beef with mustard',
		notThis: 'Not simmered: a simmer is a lazy bubble, gentler on meat. Boiled means a full, rolling boil.',
		recipe: 'new-england-boiled-dinner',
		seeAlso: ['fd_0044', 'fd_0045'],
		confusedWith: ['fd_0040', 'fd_0034'],
		line: 'Boiled Maine lobster, drawn butter, corn, new potatoes',
		traps: [
			{ says: 'Cooked at a hard bubble, which makes tough meat more tender', why: 'A hard boil tightens and toughens meat. Tenderness comes from gentle, long heat.' }
		]
	},
	{
		id: 'fd_0026',
		term: 'Braised',
		packet: true,
		gist: 'Often browned, then cooked slowly, covered, in a little liquid',
		guest: "It's usually seared first, then cooked slowly in a covered pot with wine or stock for hours. It comes out fork-tender, with the cooking liquid as its sauce.",
		why: 'Braising suits tough, hard-working cuts like short rib, shank and cheek. The meat sits partly in liquid under a lid at gentle heat for hours, and its connective tissue melts into gelatin. That makes the meat silky and turns the liquid into a glossy sauce.',
		madeWith: ['often red wine', 'often stock', 'sometimes wheat flour'],
		notThis: 'Not stewed: a stew cuts meat small and covers it in liquid. A braise keeps big pieces, half submerged.',
		recipe: 'oregon-pinot-noir-braised-short-ribs',
		seeAlso: ['fd_0092', 'fd_0087', 'fd_0039'],
		line: 'Red wine braised short rib, creamy polenta, gremolata'
	},
	{
		id: 'fd_0027',
		term: 'Brined',
		packet: true,
		gist: 'Soaked in salted water before cooking to season and stay juicy',
		guest: "It's soaked in salt water before it's cooked, so it stays juicy and seasoned all the way through. Pork chops and turkey love it.",
		why: 'Over hours, salt water works into the meat and loosens its proteins, so they hold on to more of their own juice in the heat. The result is juicier, evenly seasoned meat, which is why lean pork, chicken and turkey are brined most. Sugar and herbs often ride along.',
		madeWith: ['salt', 'often sugar', 'sometimes herbs'],
		notThis: 'Not pickled: a quick pickle sits in vinegar and turns sour. A meat brine only seasons, then the meat is cooked.',
		recipe: 'vermont-maple-brined-pork-chops',
		confusedWith: ['fd_0033', 'fd_0030'],
		line: 'Brined pork chop, apple mostarda, braised greens',
		traps: [
			{ says: 'Soaked in vinegar so the meat turns tangy and sour before cooking', why: 'A brine is salt and water. It seasons the meat without making it sour.' }
		]
	},
	{
		id: 'fd_0028',
		term: 'Caramelized',
		packet: true,
		gist: 'Cooked until sugar, natural or added, browns to a nutty sweetness',
		guest: "It's cooked until its sugars turn golden brown and sweet, the way onions cook down jammy and rich.",
		why: 'Heat breaks sugar down into hundreds of new compounds that taste nutty, toasty and a little bitter, like the top of a crème brûlée. Strictly that is sugar alone; browning meat is a separate reaction that needs protein. Menus use it loosely for any slow, deep browning of onions or fruit.',
		madeWith: ['often butter', 'sometimes sugar'],
		notThis: 'Not seared: a sear browns meat protein in minutes. Caramelizing browns sugars, usually slowly.',
		confusedWith: ['fd_0039'],
		line: 'Burger, caramelized onions, gruyère, brioche bun',
		traps: [
			{ says: 'Tossed in a store-bought caramel sauce once the food is fully cooked', why: 'Caramelizing is sugar browning in the pan as the food cooks, not a sauce poured on after.' }
		]
	},
	{
		id: 'fd_0029',
		term: 'Confit',
		say: 'kohn-FEE',
		packet: true,
		gist: 'Cooked slowly and fully submerged in fat at low heat',
		guest: "It's usually duck leg, cooked slowly in its own fat until it's meltingly tender. Then it's crisped up so the skin crackles.",
		why: 'The meat is salted overnight, covered in fat and cooked gently for hours, well below frying heat, so it poaches rather than fries. It turns silky and pulls from the bone. Before refrigeration the fat seal kept it for months. Garlic or tomato confit is cooked the same way in oil.',
		madeWith: ['duck', 'duck fat', 'salt', 'often garlic', 'often thyme'],
		origin: 'French, from confire, to preserve',
		notThis: 'Not fried: confit fat stays far below frying heat, so the meat poaches soft. Fried food browns fast.',
		lexiconSlug: 'confit',
		recipe: 'confit-duck-leg',
		seeAlso: ['fd_0075', 'fd_0047', 'fd_0034'],
		confusedWith: ['fd_0031'],
		line: 'Duck leg confit, white beans, frisée, mustard'
	},
	{
		id: 'fd_0030',
		term: 'Cured',
		packet: true,
		gist: 'Salted, then often dried or smoked, to firm it and make it keep',
		guest: "It's been salted, and sometimes smoked or aged, the way prosciutto or lox is. That firms it up and gives it a deep, savory flavor.",
		why: 'Salt pulls water out of meat or fish, and with less water left, spoiling microbes struggle. The flesh firms, turns translucent and concentrates in flavor. Many cures add sugar, and most ham and bacon get nitrite, which keeps them pink. Bacon is cooked before eating.',
		madeWith: ['salt', 'often sugar', 'often curing salt', 'often pork', 'sometimes fish', 'sometimes spirits'],
		note: 'Prosciutto crudo, bresaola, gravlax and lox are cured, not cooked, and are usually served raw.',
		notThis: 'Not smoked: smoke adds flavor, salt does the curing. Plenty of cured meat never sees smoke.',
		recipe: 'dill-and-aquavit-cured-salmon',
		seeAlso: ['fd_0078', 'fd_0222'],
		confusedWith: ['fd_0041', 'fd_0027'],
		line: 'House-cured salmon, crème fraîche, rye, pickled shallot',
		traps: [
			{ says: 'Always smoked over wood, which is what keeps the meat from spoiling', why: 'Salt does the curing. Smoke is optional flavor, and many cured meats are never smoked.' }
		]
	},
	{
		id: 'fd_0031',
		term: 'Fried',
		packet: true,
		gist: 'Cooked in hot oil until the outside turns crisp and golden',
		guest: "It's cooked in hot oil, so the outside turns crisp and golden while the inside stays moist. Often it's battered or breaded first.",
		why: 'Frying oil runs near 175 to 190 C (350 to 375 F), far hotter than boiling water, so the surface dries and browns into a crust while steam keeps the center moist. Deep frying submerges the food; pan frying uses oil partway up. Batter or breading gives the crunch.',
		madeWith: ['frying oil', 'sometimes peanut oil', 'often wheat flour', 'often egg', 'often buttermilk', 'sometimes breadcrumbs'],
		note: 'Many kitchens share one fryer across dishes, so ask what else is cooked in the same oil.',
		notThis: 'Not sautéed: a sauté uses a slick of fat and constant tossing. Fried food sits in enough oil to crisp.',
		recipe: 'korean-fried-chicken',
		seeAlso: ['fd_0002', 'fd_0029'],
		confusedWith: ['fd_0038'],
		line: 'Buttermilk fried chicken, hot honey, pickles',
		traps: [
			{ says: 'Cooked in fairly cool oil, which keeps the food from turning greasy', why: 'Oil that is too cool soaks in. Hot oil crisps the surface fast and leaves less grease.' }
		]
	},
	{
		id: 'fd_0002',
		term: 'Chicken-Fried',
		packet: true,
		gist: 'Meat pounded thin, floured and pan-crisped like Southern chicken',
		guest: "It means the meat is pounded thin, floured and fried crisp just like fried chicken. Most often it's a beef steak, and it usually comes with a creamy pepper gravy.",
		why: 'A tough, cheap cut, usually beef round run through a tenderizer, is pounded thin, dipped in egg or buttermilk and dredged in seasoned flour, then shallow-fried in hot fat. The ragged crust stays crisp under cream gravy, a floured cousin of the breadcrumbed schnitzel.',
		madeWith: ['usually beef', 'wheat flour', 'often egg', 'often buttermilk', 'often milk', 'sometimes pork'],
		origin: 'Texas and the Southern plains, likely from German schnitzel',
		pairs: 'Cream gravy, mashed potatoes, green beans, biscuits',
		seeAlso: ['fd_0031'],
		line: 'Chicken-fried steak, pepper cream gravy, mashed potatoes',
		traps: [
			{ says: 'Boneless chicken breast marinated in buttermilk and cooked crisp', why: 'The name is the method. The meat is usually beef steak, sometimes pork, cooked the way chicken is.' }
		]
	},
	{
		id: 'fd_0032',
		term: 'Grilled',
		packet: true,
		gist: 'Cooked on a grate right over an open flame or glowing coals',
		guest: "It's cooked over an open flame, which gives it those dark grill marks and a smoky, charred edge.",
		why: 'Heat radiates up from flame or coals, and the hot bars sear stripes where they touch. Fat and juices drip onto the fire and rise back as flavorful smoke. It is fast, high heat, so it suits steaks, fish, vegetables and anything thin enough to cook through before it burns.',
		note: 'A grilled cheese or grilled sandwich is cooked on a flat griddle, not over a flame.',
		notThis: 'Not smoked, which is slow, low heat in wood smoke, and not blackened, a spice crust seared in a skillet.',
		recipe: 'whole-grilled-fish-with-ladolemono',
		seeAlso: ['fd_0039', 'fd_0037'],
		confusedWith: ['fd_0041', 'fd_0048'],
		line: 'Grilled swordfish, salsa verde, charred lemon'
	},
	{
		id: 'fd_0033',
		term: 'Pickled',
		packet: true,
		gist: 'Kept in a sour liquid, usually vinegar, so it turns tangy and sharp',
		guest: "It's been soaked in tangy vinegar, so it comes out bright, sour and often a little crunchy. It's there to cut through the richer things on the plate.",
		why: 'Vegetables, fruit, eggs or fish sit in vinegar with salt and often sugar and spices. The acid seasons them all the way through, and raw vegetables keep their crunch. Quick pickles are ready in hours; fermented pickles get their sourness from bacteria over days.',
		madeWith: ['vinegar', 'salt', 'often sugar', 'sometimes mustard seed'],
		notThis: 'Not brined: brining soaks meat in salt water before cooking, while a pickle is sour and eaten as it is.',
		recipe: 'pickled-vegetables-for-the-plate',
		seeAlso: ['fd_0279', 'fd_0224'],
		confusedWith: ['fd_0027', 'fd_0046'],
		line: 'Pork belly, pickled mustard seeds, charred scallion',
		traps: [
			{ says: 'Left for months in a crock to sour, so it can never be made quickly', why: 'Quick pickles turn sour in vinegar within hours, and long fermenting is only one way to pickle.' }
		]
	},
	{
		id: 'fd_0034',
		term: 'Poached',
		packet: true,
		gist: 'Cooked in hot liquid that never bubbles, so it stays soft and moist',
		guest: "It's cooked gently in a flavorful liquid that never quite bubbles, so it stays tender and juicy. It's one of the gentlest ways to cook fish, eggs or chicken.",
		why: 'The liquid, water, stock, wine, milk, butter or oil, stays below a simmer, about 71 to 82 C (160 to 180 F). Proteins firm slowly without squeezing out much juice, so fish flakes silkily and eggs set around a soft yolk. Nothing browns, so the flavor stays clean.',
		madeWith: ['often stock', 'sometimes fish stock', 'sometimes wine', 'sometimes milk', 'sometimes butter', 'sometimes olive oil'],
		note: 'A poached egg normally arrives with a runny, not fully set, yolk.',
		notThis: 'Not boiled: boiling bubbles hard and toughens delicate food, while poaching keeps the liquid barely trembling.',
		seeAlso: ['fd_0029', 'fd_0042'],
		confusedWith: ['fd_0025', 'fd_0040'],
		line: 'Poached halibut, fennel, saffron broth'
	},
	{
		id: 'fd_0035',
		term: 'Preserved',
		packet: true,
		gist: 'Made to keep for months by any of several methods, not just one',
		guest: "It's been made to last, with salt, sugar or vinegar, the way cooks kept summer food for winter. That also concentrates the flavor, so a little goes a long way.",
		why: 'It is an umbrella word, not one technique. Salt, sugar and drying pull water out of food, acid slows spoilage, and time does the rest. Texture softens and taste deepens: preserved lemon rind turns silky and salty, preserved cherries turn syrupy.',
		madeWith: ['salt', 'often sugar', 'sometimes vinegar', 'sometimes oil', 'sometimes alcohol', 'sometimes sulfites'],
		notThis: 'Not fresh: the item was made weeks or months ahead, and it tastes saltier, sweeter or sourer than the raw ingredient.',
		seeAlso: ['fd_0277', 'fd_0030', 'fd_0033'],
		line: 'Roast chicken, preserved lemon, green olives',
		traps: [
			{ says: 'Treated with chemical additives so it lasts on a shelf for years', why: 'On a menu it means methods like salt, sugar, acid or drying, not a lab process.' }
		]
	},
	{
		id: 'fd_0036',
		term: 'Puréed',
		say: 'pyoo-RAYD',
		aliases: ['Purée'],
		packet: true,
		gist: 'Blended thick and completely smooth, firm enough to hold its shape',
		guest: "It's been blended until it's completely smooth, like a velvety spread on the plate. You get the flavor of the vegetable or fruit in a rich, silky form.",
		why: 'Food, usually cooked soft first, is blended or pushed through a fine sieve until no fiber or lump is left, so it eats silky and dense. Kitchens often loosen it with butter, cream or stock, which is why a purée can taste richer than the vegetable. A mash keeps some texture.',
		madeWith: ['often butter', 'often cream', 'sometimes stock'],
		origin: 'French purer, to strain or make pure',
		notThis: 'Not a coulis: a coulis is a thin sauce you pour, while a purée is thick enough to hold its shape on the plate.',
		confusedWith: ['fd_0203'],
		line: 'Seared scallops, cauliflower purée, brown butter',
		traps: [
			{ says: 'Chopped very finely by hand into tiny, even, crunchy cubes', why: 'It is blended or sieved completely smooth, with no pieces at all.' }
		]
	},
	{
		id: 'fd_0037',
		term: 'Roasted',
		packet: true,
		gist: 'Cooked by dry heat in an oven until browned outside and tender inside',
		guest: "It's cooked in a hot oven, so the outside browns and caramelizes while the inside stays juicy. That browning is where the deep, savory flavor comes from.",
		why: 'Hot, dry air surrounds the food on every side. The surface dries and browns, building a savory crust on meat and sweet, caramelized edges on vegetables, while the center cooks more gently. Unlike braising, no liquid goes in, and big cuts rest before carving.',
		madeWith: ['often oil', 'sometimes butter'],
		note: 'Roast beef and lamb are usually carved pink, at medium rare, unless asked otherwise.',
		notThis: 'Not pan-roasted: that starts in a skillet for the crust and finishes in the oven, usually for a single portion.',
		seeAlso: ['fd_0028', 'fd_0026'],
		confusedWith: ['fd_0049'],
		line: 'Roasted chicken, root vegetables, pan jus'
	},
	{
		id: 'fd_0038',
		term: 'Sautéed',
		say: 'saw-TAYD',
		packet: true,
		gist: 'Cooked fast in a little fat in a hot pan, tossed to cook evenly',
		guest: "It's cooked quickly in a hot pan with a little butter or oil, so it stays fresh and bright with lightly golden edges. The quick heat keeps it light.",
		why: 'Small or thin pieces go into a hot, shallow pan with just enough fat to coat it and are tossed or stirred. High heat and little fat brown the edges before the inside overcooks, so greens stay vivid and mushrooms turn golden.',
		madeWith: ['often butter', 'often oil', 'often garlic', 'sometimes wine'],
		origin: 'French sauter, to jump, from tossing food in the pan',
		notThis: 'Not fried: frying uses a deeper layer of oil, while a sauté uses only a thin film of fat and keeps the food moving.',
		recipe: 'sauteed-fiddleheads',
		seeAlso: ['fd_0043'],
		confusedWith: ['fd_0031', 'fd_0039'],
		line: 'Sautéed spinach, garlic, lemon',
		traps: [
			{ says: 'Cooked slowly over low heat until soft and pale, never browned', why: 'It uses high heat for speed, and light browning is part of the point.' }
		]
	},
	{
		id: 'fd_0039',
		term: 'Seared',
		packet: true,
		gist: 'Browned hard on a very hot surface to give it a dark, flavorful crust',
		guest: "It's cooked in a very hot pan just long enough to build a deep golden crust, so you get a caramelized outside with a tender, juicy inside.",
		why: 'Dry food meets metal hot enough for the Maillard reaction, the browning of proteins and sugars that makes crust and roasted flavor. It takes a minute or two, so tuna or scallops can stay rare inside. It builds flavor; it does not seal in juice.',
		madeWith: ['often oil', 'sometimes butter'],
		note: 'Seared tuna is usually served rare, and seared scallops translucent in the center.',
		notThis: 'Not blackened: blackening coats the food in spices and chars that coating, while searing browns the food itself.',
		recipe: 'seared-digby-scallops',
		seeAlso: ['fd_0049', 'fd_0223'],
		confusedWith: ['fd_0048', 'fd_0038'],
		line: 'Seared scallops, sweet corn, brown butter',
		traps: [
			{ says: 'Browned quickly over high heat to seal the juices inside the meat', why: 'Searing does not seal in juices: a seared steak loses as much moisture as an unseared one, or more.' }
		]
	},
	{
		id: 'fd_0040',
		term: 'Simmered',
		packet: true,
		gist: 'Cooked gently in liquid with small bubbles breaking now and then',
		guest: "It's cooked slowly in a gently bubbling liquid, so the flavors have time to meld and the meat or beans turn tender. Think of a good soup or a pot of beans.",
		why: 'The liquid sits just under boiling, about 85 to 96 C (185 to 205 F), with small bubbles breaking now and then. That is hot enough to soften tough cuts, beans and grains and pull flavor into a stock, yet calm enough not to shred meat or cloud a broth.',
		notThis: 'Not poached, which is cooler with no bubbles, or boiled, which rolls hard and can toughen meat and break up delicate food.',
		seeAlso: ['fd_0026', 'fd_0214'],
		confusedWith: ['fd_0034', 'fd_0025'],
		line: 'Simmered white beans, rosemary, olive oil'
	},
	{
		id: 'fd_0041',
		term: 'Smoked',
		packet: true,
		gist: 'Flavored, and often slowly cooked, by the fumes of smoldering wood',
		guest: "It's been cooked or just flavored in the smoke of smoldering wood, so it picks up a deep, sweet smokiness, like good barbecue or smoked salmon.",
		why: 'Smoldering hardwood gives off compounds that settle on the food and color it. Hot smoking also cooks it low and slow, which is how brisket goes tender. Cold smoking only flavors, so cold-smoked salmon stays silky and uncooked. Fruit woods are mild; hickory is bold.',
		madeWith: ['often pork', 'often beef', 'sometimes fish'],
		note: 'A pink ring just under the crust of smoked meat is normal. The smoke gases make it.',
		notThis: 'Not the same as cured. Salt cures, smoke flavors, and many hams and bacons get both.',
		recipe: 'central-texas-smoked-brisket',
		seeAlso: ['fd_0101', 'fd_0083'],
		confusedWith: ['fd_0030'],
		line: 'Smoked half chicken, white barbecue sauce, pickles',
		traps: [
			{ says: 'Brushed with a bottled flavoring and a rub, then baked quickly in an oven', why: 'It takes its flavor from smoldering wood itself, not from a bottle and an oven.' }
		]
	},
	{
		id: 'fd_0042',
		term: 'Sous Vide',
		say: 'soo-VEED',
		packet: true,
		gist: 'Sealed in a bag and held in a warm water bath at its exact doneness',
		guest: "It's cooked slowly in a warm water bath set to exactly the doneness we want, and meats get a sear at the end. It comes out tender and evenly cooked.",
		why: 'The food is vacuum sealed and set in water held at the target temperature itself, well below a simmer, so it can never overshoot. A steak comes out pink from edge to edge with no gray band. It gets no crust in the bag, so kitchens sear it afterward.',
		note: 'Steak, chops and duck come out evenly pink by design. Take any doneness request to the kitchen.',
		origin: 'French for under vacuum, a restaurant method since the 1970s',
		notThis: 'Not poached. A poach sits in open, barely bubbling liquid; this sits sealed in a bath held at its exact doneness.',
		lexiconSlug: 'sous-vide',
		seeAlso: ['fd_0039'],
		confusedWith: ['fd_0034'],
		line: 'Sous vide pork chop, charred peach, mustard jus',
		traps: [
			{ says: 'Sealed in plastic and steamed until it is cooked all the way through', why: 'The bag is held in a water bath at its exact doneness, not steamed until cooked through.' }
		]
	},
	{
		id: 'fd_0043',
		term: 'Wilted',
		packet: true,
		gist: 'Greens heated just until they slump, still bright and barely cooked',
		guest: 'The greens are warmed just until they soften, so they are tender but still fresh and bright. Think of a warm salad.',
		why: "A short hit of heat from a hot pan, hot broth or a warm dressing bursts the leaf's cell membranes, so it goes limp and releases water. Stopped there, the greens stay vivid and fresh tasting. Spinach, chard and tender lettuces take seconds; cooked longer, they turn dull and stewed.",
		madeWith: ['leafy greens', 'often olive oil', 'sometimes bacon fat', 'often vinegar'],
		origin: 'Southern and Appalachian cooks call hot bacon dressing on lettuce killed lettuce',
		notThis: 'Close to a quick sauté, but stopped the moment the leaves soften, before anything browns.',
		recipe: 'nebraska-wilted-lettuce-salad',
		confusedWith: ['fd_0038'],
		line: 'Wilted spinach, garlic, lemon, chili flake'
	},
	{
		id: 'fd_0044',
		term: 'Blanched',
		gist: 'Dipped briefly in boiling water, then usually chilled in ice water',
		guest: 'It gets a quick dip in boiling water and then an ice bath, so the vegetables stay bright green with a little snap.',
		why: 'A minute or two in heavily salted boiling water softens the outside, sets green color and loosens skins; the ice bath stops the cooking right there. Kitchens blanch ahead so a vegetable only needs a quick finish on the line. Blanched almonds are simply almonds with the skins slipped off.',
		origin: 'From French blanchir, to whiten',
		notThis: 'Not boiled. Boiling cooks food through in the water; blanching is a quick dip that stops short.',
		lexiconSlug: 'blanch-and-shock',
		recipe: 'baak-cheuk-gai-lan-blanched-gai-lan-with-ginger-oil',
		confusedWith: ['fd_0025'],
		line: 'Blanched haricots verts, brown butter, almonds',
		traps: [
			{ says: 'Soaked in lemon water or cold milk to turn it paler before it is served', why: 'The name means to whiten, but it is a quick dip in boiling water, not a bleaching soak.' }
		]
	},
	{
		id: 'fd_0045',
		term: 'Steamed',
		gist: 'Cooked by hot vapor rising from water below, without touching it',
		guest: "It's cooked gently over boiling water, so it stays moist and tender and keeps its clean, natural flavor.",
		why: 'The food sits in a basket or on a rack above the water, and steam carries heat in fast without the surface ever drying or browning. Nothing leaches into a pot of water, so fish stays delicate and vegetables keep their color. Dumplings and bao get their soft, pillowy skins this way.',
		madeWith: ['often fish', 'sometimes shellfish', 'often ginger', 'often scallion', 'sometimes soy sauce', 'sometimes sesame oil'],
		note: 'Steamed fish is often served whole, on the bone, so mention the bones to the guest.',
		pairs: 'Ginger and scallion, soy sauce, sesame oil, jasmine rice',
		notThis: 'Not poached. Poached food sits in the liquid; steamed food sits above it, out of the water.',
		recipe: 'cantonese-steamed-fish',
		seeAlso: ['fd_0231'],
		confusedWith: ['fd_0034', 'fd_0025'],
		line: 'Steamed black bass, ginger, scallion, soy'
	},
	{
		id: 'fd_0046',
		term: 'Fermented',
		gist: 'Changed slowly by live microbes, turning tangy, funky or savory',
		guest: "It's been slowly transformed by yeasts and bacteria, like sourdough or kimchi, so it has a tangy, deep, savory flavor you only get with time.",
		why: 'Yeasts, bacteria and molds turn sugars into acid, alcohol or gas, and enzymes break proteins into savory depth. That makes the tang in kimchi and yogurt, the funk in miso and fish sauce, and the rise in sourdough. Time does the work: days for kraut, months or years for miso.',
		origin: 'From Latin fervere, to boil, for the bubbling of a live ferment',
		notThis: 'Not pickled. A quick pickle gets its sour from added vinegar; a ferment makes its own sour.',
		recipe: 'lacto-fermented-red-chilli-sauce',
		seeAlso: ['fd_0269', 'fd_0280', 'fd_0237'],
		confusedWith: ['fd_0033'],
		line: 'Fermented chili glaze, crispy pork belly, herbs',
		traps: [
			{ says: 'Cooked slowly over very low heat for several days until it turns sour', why: 'Microbes make the sour flavor over time; cooking heat would kill them, not sour the food.' }
		]
	},
	{
		id: 'fd_0047',
		term: 'Rendered',
		gist: 'Fat melted slowly out of meat or skin, leaving the rest crisp',
		guest: 'The fat is slowly melted out so the skin crisps instead of going rubbery, and that fat is often saved to cook with, like duck fat for potatoes.',
		why: 'Gentle heat melts the fat inside skin or fatty meat so it runs out into the pan. Take it slowly and the skin thins and crisps; rush it and the outside burns over a layer of soft fat. The fat left behind is saved and used: lard, duck fat, schmaltz, tallow.',
		madeWith: ['often duck', 'often pork', 'sometimes chicken'],
		note: 'Duck breast with rendered skin is classically served pink, at medium rare.',
		notThis: 'Not confit. Confit cooks meat submerged in fat; rendering pulls the fat out of the meat.',
		lexiconSlug: 'schmaltz-and-rendering',
		seeAlso: ['fd_0056', 'fd_0094', 'fd_0083'],
		confusedWith: ['fd_0029'],
		line: 'Duck breast, skin rendered crisp, cherry jus',
		traps: [
			{ says: 'Trimmed of every last bit of fat before cooking so that it eats lean', why: 'The fat is melted out in the pan, and the skin stays on to turn crisp.' }
		]
	},
	{
		id: 'fd_0048',
		term: 'Blackened',
		gist: 'Dipped in butter, crusted in spice and cooked dark in a hot skillet',
		guest: "It's coated in a Cajun spice blend and seared in a very hot cast iron pan, so it gets a dark, spicy crust while the inside stays tender and juicy.",
		why: 'The fillet is dipped in melted butter, packed with paprika, cayenne, thyme and garlic, and dropped in a skillet heated until it smokes. The butter solids and spices toast almost black in a minute or two, while the inside stays moist. The dark color is toasted spice, not burnt fish.',
		madeWith: ['butter', 'paprika', 'cayenne', 'often fish'],
		note: 'Blackened tuna is usually served rare in the center, and steak is cooked to order.',
		origin: 'New Orleans, made famous by chef Paul Prudhomme in the early 1980s',
		notThis: 'Not simply seared. A sear browns plain meat; this builds a dark crust of spice and butter.',
		recipe: 'blackened-redfish',
		seeAlso: ['fd_0064'],
		confusedWith: ['fd_0039'],
		line: 'Blackened redfish, dirty rice, lemon butter',
		traps: [
			{ says: 'Charred over a roaring open flame until the skin turns burnt and bitter', why: 'It is seared in a hot skillet, and the dark crust is toasted spice, not burnt char.' }
		]
	},
	{
		id: 'fd_0049',
		term: 'Pan-Roasted',
		gist: 'Browned hard on the stove, then finished in a hot oven in one skillet',
		guest: "It's seared in a hot skillet for a crisp, golden crust, then slid into the oven to finish, so the inside stays juicy and cooks evenly.",
		why: 'Hard browning on the stove builds the crust, then the same ovenproof skillet goes into a hot oven. Surrounding heat cooks thick cuts through evenly without burning the outside, and many kitchens finish with a butter baste. Searing alone suits thinner pieces.',
		madeWith: ['oil', 'often butter'],
		notThis: 'Seared is stove only and roasted is oven only. Pan-roasting does both in one skillet, which suits thick chops, breasts and fillets.',
		seeAlso: ['fd_0038'],
		confusedWith: ['fd_0039', 'fd_0037'],
		line: 'Pan-roasted halibut, brown butter, capers, lemon'
	}
];

export default cards;
