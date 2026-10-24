/* The Floor Deck, section "methods". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0025',
		term: 'Boiled',
		level: 1,
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
		level: 1,
		packet: true,
		gist: 'Often browned, then cooked slowly, covered, in a little liquid',
		guest: "It's usually seared first, then cooked slowly in a covered pot with wine or stock for hours. It comes out fork-tender, with the cooking liquid as its sauce.",
		why: 'Braising suits tough, hard-working cuts like short rib, shank and cheek. The meat sits partly in liquid under a lid at gentle heat for hours, and its connective tissue melts into gelatin. That makes the meat silky and turns the liquid into a glossy sauce.',
		madeWith: ['often red wine', 'often stock', 'sometimes wheat flour'],
		notThis: "A stew usually uses smaller pieces in liquid; a braise often keeps larger cuts partly submerged in a covered pot.",
		recipe: 'oregon-pinot-noir-braised-short-ribs',
		seeAlso: ['fd_0092', 'fd_0087', 'fd_0039'],
		line: 'Red wine braised short rib, creamy polenta, gremolata'
	},
	{
		id: 'fd_0027',
		term: 'Brined',
		level: 1,
		packet: true,
		gist: "Seasoned ahead with salt, wet or dry, to help retain moisture",
		guest: "It is seasoned ahead with salt, either in a water brine or directly on the meat, to help it stay juicy during cooking.",
		why: "Wet brining uses salted water; dry brining applies salt without added water. Salt changes muscle proteins so they retain moisture during cooking. Sugar and aromatics add flavor, but ordinary pre-cook brining is not a preservation process.",
		madeWith: ['salt', 'often sugar', 'sometimes herbs'],
		notThis: "A quick pickle gets sourness from vinegar. A pre-cook brine seasons with salt; curing uses a controlled preservation process.",
		recipe: 'vermont-maple-brined-pork-chops',
		confusedWith: ['fd_0033', 'fd_0030'],
		line: 'Brined pork chop, apple mostarda, braised greens',
		traps: [{"says":"Soaked in vinegar to make the meat sour before cooking","why":"Salt is the defining seasoning here; vinegar describes an acidic marinade or quick pickle."}]
	},
	{
		id: 'fd_0028',
		term: 'Caramelized',
		level: 1,
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
		level: 2,
		say: 'kohn-FEE',
		packet: true,
		gist: 'Cooked slowly and fully submerged in fat at low heat',
		guest: "It is cooked gently in fat or oil until very tender. Duck leg is a classic example, often crisped separately before serving.",
		why: "For meat confit, seasoning and a slow cook in fat develop tenderness; the fat need not come from that animal. Garlic and other vegetables can cook gently in oil. Historical preservation is separate from the kitchen's current cooling and storage procedure.",
		madeWith: ["fat or oil","often duck","often salt","sometimes garlic","sometimes thyme"],
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
		level: 1,
		packet: true,
		gist: "Treated with a controlled salt cure, sometimes followed by drying or smoking",
		guest: "It's been salted, and sometimes smoked or aged, the way prosciutto or lox is. That firms it up and gives it a deep, savory flavor.",
		why: "Curing changes taste, texture and keeping quality. Some cures use nitrite as well as salt. Cured ham may be ready to eat or still need cooking; appearance cannot settle that question. Follow the product instructions and kitchen procedure.",
		madeWith: ['salt', 'often sugar', 'often curing salt', 'often pork', 'sometimes fish', 'sometimes spirits'],
		note: "Some cured products are ready to serve; others need cooking. Check the exact product and the kitchen's preparation.",
		notThis: "Curing, smoking and cooking are different processes; ready to eat describes the finished product.",
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
		level: 1,
		packet: true,
		gist: 'Cooked in hot oil until the outside turns crisp and golden',
		guest: "It's cooked in hot oil, so the outside turns crisp and golden while the inside stays moist. Often it's battered or breaded first.",
		why: "Deep frying submerges food in hot fat; pan frying uses a shallower layer. Surface moisture escapes and browning develops. A batter or crumb coating is common but optional: uncoated potatoes can also become crisp. The recipe determines the fat temperature, coating and finished texture.",
		madeWith: ['frying oil', 'sometimes peanut oil', 'often wheat flour', 'often egg', 'often buttermilk', 'sometimes breadcrumbs'],
		note: 'Many kitchens share one fryer across dishes, so ask what else is cooked in the same oil.',
		notThis: "Deep frying immerses food; pan frying uses less fat; sautéing uses a thin film with small or thin pieces.",
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
		level: 1,
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
		level: 1,
		packet: true,
		gist: "Cooked over direct heat on a grill, usually on a metal grate",
		guest: "It is cooked over direct heat on a grill, which browns the surface. The exact smoky character depends on the kitchen's heat source.",
		why: "Grilling places food on an open grid over a heat source, which may use charcoal, gas or electricity. The hot grate and radiant heat brown the surface. Smoke character depends on the equipment, fuel and preparation.",
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
		level: 1,
		packet: true,
		gist: 'Kept in a sour liquid, usually vinegar, so it turns tangy and sharp',
		guest: "It has a bright, sour flavor from vinegar or fermentation, giving a refreshing contrast to the richer parts of the dish.",
		why: 'Vegetables, fruit, eggs or fish sit in vinegar with salt and often sugar and spices. The acid seasons them all the way through, and raw vegetables keep their crunch. Quick pickles are ready in hours; fermented pickles get their sourness from bacteria over days.',
		madeWith: ["often vinegar","salt","often sugar","sometimes mustard seed"],
		notThis: "Quick pickles use added vinegar; fermented pickles develop acid in a salt brine. A pre-cook meat brine need not turn sour.",
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
		level: 1,
		packet: true,
		gist: 'Cooked in hot liquid that never bubbles, so it stays soft and moist',
		guest: "It's cooked gently in a flavorful liquid that never quite bubbles, so it stays tender and juicy. It's one of the gentlest ways to cook fish, eggs or chicken.",
		why: "Poaching gently cooks food in hot liquid with little movement. Water, stock, wine, milk or other suitable liquids can be used. The method gives little surface browning; the food, cooking time and kitchen specification determine the finished texture.",
		madeWith: ['often stock', 'sometimes fish stock', 'sometimes wine', 'sometimes milk', 'sometimes butter', 'sometimes olive oil'],
		note: "Poaching describes the method, not a guaranteed center. Confirm the kitchen's finish for eggs, fish or meat.",
		notThis: 'Not boiled: boiling bubbles hard and toughens delicate food, while poaching keeps the liquid barely trembling.',
		seeAlso: ['fd_0029', 'fd_0042'],
		confusedWith: ['fd_0025', 'fd_0040'],
		line: 'Poached halibut, fennel, saffron broth'
	},
	{
		id: 'fd_0035',
		term: 'Preserved',
		level: 1,
		packet: true,
		gist: "Prepared by a process that extends keeping quality beyond fresh food",
		guest: "It has been prepared to keep longer. The method might use salt, sugar, acid, drying or another process, and that shapes its flavor.",
		why: "Preservation is a family of methods, including drying, freezing, fermentation, pickling, curing and canning. Different processes control spoilage differently. The word alone does not tell you how long food keeps or whether it needs refrigeration.",
		madeWith: ['salt', 'often sugar', 'sometimes vinegar', 'sometimes oil', 'sometimes alcohol', 'sometimes sulfites'],
		notThis: "Not one flavor or one age: a dried ingredient, a frozen ingredient and a pickle can all be preserved in different ways.",
		seeAlso: ['fd_0277', 'fd_0030', 'fd_0033'],
		line: 'Roast chicken, preserved lemon, green olives',
		traps: [{"says":"Always left for months in salt before it can be served","why":"There are many methods and timelines. The actual product determines its storage and service."}]
	},
	{
		id: 'fd_0036',
		term: 'Puréed',
		level: 1,
		say: 'pyoo-RAYD',
		aliases: ['Purée'],
		packet: true,
		gist: "Blended or passed smooth, with thickness suited to the dish",
		guest: "It has been blended or passed smooth for an even, velvety texture. Its thickness is suited to the dish.",
		why: "Food is blended or passed through a sieve to reduce pieces and fibers. The result can be a thick accompaniment or a pourable soup or sauce. Added liquid and the ingredient itself determine consistency; a mash generally retains more texture.",
		madeWith: ['often butter', 'often cream', 'sometimes stock'],
		origin: 'French purer, to strain or make pure',
		notThis: "A mash may keep pieces; a purée is smoother. A coulis is a sauce, often made from a strained fruit or vegetable purée.",
		confusedWith: ['fd_0203'],
		line: 'Seared scallops, cauliflower purée, brown butter',
		traps: [
			{ says: 'Chopped very finely by hand into tiny, even, crunchy cubes', why: 'It is blended or sieved completely smooth, with no pieces at all.' }
		]
	},
	{
		id: 'fd_0037',
		term: 'Roasted',
		level: 1,
		packet: true,
		gist: 'Cooked by dry heat in an oven until browned outside and tender inside',
		guest: "It's cooked in a hot oven, so the outside browns and caramelizes while the inside stays juicy. That browning is where the deep, savory flavor comes from.",
		why: "Roasting exposes food to dry oven heat, allowing the surface to brown while the interior cooks. Basting or some liquid in the tray does not automatically make it a braise. In a braise, covered moist cooking is the main method.",
		madeWith: ['often oil', 'sometimes butter'],
		note: "Roasted describes the cooking method. Confirm the cut, the kitchen's finish and the guest's preference before promising a pink center.",
		notThis: 'Not pan-roasted: that starts in a skillet for the crust and finishes in the oven, usually for a single portion.',
		seeAlso: ['fd_0028', 'fd_0026'],
		confusedWith: ['fd_0049'],
		line: 'Roasted chicken, root vegetables, pan jus'
	},
	{
		id: 'fd_0038',
		term: 'Sautéed',
		level: 1,
		say: 'saw-TAYD',
		packet: true,
		gist: "Cooked quickly in a little hot fat, turned or tossed as needed",
		guest: "It's cooked quickly in a hot pan with a little butter or oil, so it stays fresh and bright with lightly golden edges. The quick heat keeps it light.",
		why: "Sautéing suits small or thin pieces and uses little fat. Small vegetables may be tossed; a delicate fillet is usually turned carefully. Constant movement is not a requirement. Enough room in the pan helps moisture escape so the surface can brown.",
		madeWith: ['often butter', 'often oil', 'often garlic', 'sometimes wine'],
		origin: 'French sauter, to jump, from tossing food in the pan',
		notThis: "Sautéing uses little fat; shallow frying uses more. A fillet can be sautéed without being tossed.",
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
		level: 1,
		packet: true,
		gist: 'Browned hard on a very hot surface to give it a dark, flavorful crust',
		guest: "It is browned over intense heat to create a savory crust. The center may be cooked further depending on the dish.",
		why: "Intense heat browns a food's surface and develops a savory crust, often through the Maillard reaction. Searing may begin or finish another cooking method. Its timing varies, and the browned surface does not establish the center's doneness or seal in juices.",
		madeWith: ['often oil', 'sometimes butter'],
		note: "Searing describes the surface, not the center. Confirm the kitchen's finish and the guest's request.",
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
		level: 1,
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
		level: 1,
		packet: true,
		gist: 'Flavored, and often slowly cooked, by the fumes of smoldering wood',
		guest: "It's been cooked or just flavored in the smoke of smoldering wood, so it picks up a deep, sweet smokiness, like good barbecue or smoked salmon.",
		why: "Smoke adds aroma and changes appearance. Hot smoking includes cooking; cold smoking does not provide a pathogen kill step. A smoke ring or silky texture does not prove readiness to eat. Follow the product instructions and kitchen procedure.",
		madeWith: ['often pork', 'often beef', 'sometimes fish'],
		note: "Smoke can form a pink ring; it is not a doneness test. Follow the product instructions and the kitchen's cooking checks.",
		notThis: "Hot smoking includes cooking; cold smoking does not provide a pathogen kill step. Curing is a separate process.",
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
		level: 2,
		say: 'soo-VEED',
		packet: true,
		gist: "Cooked in a sealed pouch using carefully controlled time and temperature",
		guest: "It is cooked at a carefully controlled temperature for an even texture. The chef may finish it with a sear when the dish calls for a crust.",
		why: "Food in a sealed pouch cooks in a controlled water bath. The stable temperature limits overheating, but time still changes texture, so food should not be held indefinitely. A separate sear can add browning when the recipe calls for it.",
		note: "Follow the kitchen's specified time, temperature and finishing procedure. Sous vide does not require a pink center, and color alone does not establish doneness.",
		origin: 'French for under vacuum, a restaurant method since the 1970s',
		notThis: "Direct poaching puts food in the cooking liquid. This method keeps food in a sealed pouch within a controlled bath.",
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
		level: 1,
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
		level: 2,
		gist: 'Briefly cooked in boiling water; chilling depends on the next step',
		guest: 'The vegetables are briefly cooked in boiling water to the texture the dish needs, then drained and finished for service.',
		why: 'Test a piece for texture; time depends on the ingredient and size. An ice bath interrupts cooking for preparation ahead; immediate finishing or service may not need it. Drain well and follow storage controls if holding. Blanched almonds have their skins removed.',
		origin: 'From French blanchir, to whiten',
		notThis: 'Blanching describes a brief cooking step and its purpose. It may partly or fully cook an ingredient; shocking is the separate cooling step.',
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
		level: 1,
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
		level: 2,
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
		level: 2,
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
		level: 1,
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
		level: 2,
		gist: 'Browned hard on the stove, then finished in a hot oven in one skillet',
		guest: "It's seared in a hot skillet for a crisp, golden crust, then slid into the oven to finish, so the inside stays juicy and cooks evenly.",
		why: 'Hard browning on the stove builds the crust, then the same ovenproof skillet goes into a hot oven. Surrounding heat cooks thick cuts through evenly without burning the outside, and many kitchens finish with a butter baste. Searing alone suits thinner pieces.',
		madeWith: ['oil', 'often butter'],
		notThis: 'Seared is stove only and roasted is oven only. Pan-roasting does both in one skillet, which suits thick chops, breasts and fillets.',
		seeAlso: ['fd_0038'],
		confusedWith: ['fd_0039', 'fd_0037'],
		line: 'Pan-roasted halibut, brown butter, capers, lemon'
	},
	{
		id: 'fd_0301',
		term: 'À la Plancha',
		level: 3,
		say: 'ah lah PLAHN-chah',
		aliases: ['Plancha'],
		gist: 'Cooked fast on a very hot flat metal griddle, Spanish style',
		guest: "It's cooked the Spanish way, on a very hot flat steel griddle, for an even golden crust with no grill marks and a juicy center.",
		why: 'A thick steel plate is heated until very hot and the food lies flat on it, browning into an even crust. With no grate, octopus and delicate fish cannot fall through, and with no open flame there are no grill stripes or smoky char.',
		madeWith: ['often olive oil', 'sometimes garlic', 'sometimes butter'],
		origin: 'Spanish: on the plate, meaning a flat metal griddle',
		pairs: 'Octopus, shrimp or scallops, olive oil, garlic, lemon',
		notThis: 'Not grilled: no bars and no open flame, so no grill marks. Seared usually means a pan; this is a wide flat plate.',
		lexiconSlug: 'comal-plancha-and-griddles',
		seeAlso: ['fd_0049'],
		confusedWith: ['fd_0032', 'fd_0039'],
		line: 'Octopus à la plancha, romesco, crispy potatoes',
		traps: [
			{ says: 'Cooked on a soaked wooden board in the oven for a gentle smokiness', why: 'That is plank cooking. This is a bare, very hot steel plate with no wood and no smoke.' }
		]
	},
	{
		id: 'fd_0302',
		term: 'Salt-Baked',
		level: 3,
		aliases: ['Salt-Roasted', 'Salt-Crusted'],
		gist: 'Sealed in a thick mineral crust so it steams in its own juices',
		guest: "It's sealed in a crust of salt and baked, so it steams in its own juices. The crust is cracked away, leaving it moist and gently seasoned.",
		why: 'Coarse salt, usually bound with egg white, is packed around a whole fish, beet or celery root and hardens into a shell in the oven. It traps steam, so the inside cooks gently, while skin or peel keeps most salt out. The shell is cracked off and thrown away.',
		madeWith: ['coarse salt', 'often egg white', 'often whole fish', 'sometimes herbs', 'sometimes wheat flour'],
		note: 'When a whole fish is filleted at the table, a few small bones can remain.',
		origin: 'Spain and Italy for whole fish, Hakka China for chicken',
		notThis: 'Not cured: the salt is a shell cracked off after cooking, not rubbed in for days.',
		recipe: 'salt-baked-whole-fish',
		seeAlso: ['fd_0027', 'fd_0045', 'fd_0231'],
		confusedWith: ['fd_0030'],
		line: 'Salt-baked branzino for two, lemon, olive oil',
		traps: [
			{ says: 'Seasoned heavily through the crust, so the flesh eats briny like ham', why: 'The shell traps steam and is thrown away, and the skin or peel keeps the flesh only gently seasoned.' }
		]
	},
	{
		id: 'fd_0303',
		term: 'Lacquered',
		level: 3,
		gist: 'Glazed in thin coats as it roasts until it sets glossy and dark',
		guest: "It's brushed with a sweet, savory glaze again and again as it roasts, so it comes out shiny, dark and sticky, like Chinese barbecue pork.",
		why: 'Honey, soy, maple or reduced stock is brushed on in thin coats while the meat roasts. Each coat cooks down and sets over the last, building a glossy, dark shell, sweet and savory at once, as the fat beneath renders out.',
		madeWith: ['often honey', 'often soy sauce', 'sometimes hoisin', 'sometimes maple syrup', 'sometimes wine'],
		note: 'Duck breast is usually served pink, at medium rare. A whole duck is cooked through.',
		origin: 'Named for lacquerware, a finish built up in glossy coats',
		pairs: 'Duck, pork belly or quail, with something sharp',
		notThis: 'Not caramelized, which is sugar browning. Here a glaze is painted on in coats and built into a shell.',
		seeAlso: ['fd_0037', 'fd_0047'],
		confusedWith: ['fd_0028'],
		line: 'Lacquered duck breast, charred plum, five-spice jus',
		traps: [
			{ says: 'Fried twice in very hot oil until the skin turns glassy and brittle', why: 'Nothing is fried. A glaze is brushed on in coats while it roasts, and it sets glossy and sticky.' }
		]
	},
	{
		id: 'fd_0304',
		term: 'Koji-Aged',
		level: 4,
		say: 'KOH-jee AYJD',
		aliases: ['Koji-Cured'],
		gist: 'Coated in a rice mold culture whose enzymes tenderize it in days',
		guest: 'It sits for days under koji, the mold-grown rice behind miso and sake, which turns the meat tender and deeply savory, like a long dry-age.',
		why: 'Koji is rice or barley grown with Aspergillus oryzae, the mold behind miso, soy sauce and sake. Its enzymes turn protein into savory amino acids and starch into sugar, so in days, not weeks, the meat softens and turns nutty and rich, much like dry-aging.',
		madeWith: ['rice koji', 'sometimes barley koji', 'often salt', 'often beef', 'sometimes pork'],
		note: 'The coat is usually wiped off first, and its sugars brown fast, so the crust runs darker.',
		origin: 'Japanese koji, used by American chefs to age meat',
		notThis: 'Not dry-aged, which takes weeks in cold air. Here a mold culture does it in days.',
		seeAlso: ['fd_0280', 'fd_0046'],
		confusedWith: ['fd_0294'],
		line: 'Koji-aged ribeye, charred scallion, black garlic jus',
		traps: [
			{ says: 'Marinated overnight in soy sauce and mirin, then grilled over charcoal', why: 'It is not a soy marinade. Koji, a mold-grown rice, is spread on the raw meat and left for days.' }
		]
	},
	{
		id: 'fd_0356',
		term: 'Kombu-Cured',
		level: 4,
		say: 'KOHM-boo KYOORD',
		aliases: ['Kobujime', 'Konbujime'],
		gist: 'Raw fish pressed between sheets of kelp to firm and season it',
		guest: 'The raw fish rests wrapped in sheets of kelp, which firms it gently and gives it a deep, savory sweetness. It eats like sashimi, just firmer and fuller.',
		why: 'Kelp sheets, often wiped with sake, draw water from raw fish while their glutamate, the compound behind umami, seeps in. Over a few hours to a day the flesh firms, turns glassy and gains depth. It is gentler than a salt cure, so the fish still eats as sashimi.',
		madeWith: ['fish', 'sometimes shrimp or scallop', 'kelp', 'often salt', 'sometimes sake'],
		origin: 'Japanese kobujime, a Toyama specialty, from kobu, kelp, and shime, to tighten',
		notThis: 'Not gravlax, buried in salt and sugar for days, nor koji-aged meat. Kelp firms raw fish in hours.',
		seeAlso: ['fd_0220', 'fd_0355'],
		confusedWith: ['fd_0030', 'fd_0304', 'fd_0222'],
		line: 'Kombu-cured fluke, yuzu kosho, shiso, olive oil',
		traps: [
			{ says: 'Raw fish soaked overnight in soy sauce and sweet rice wine', why: 'No marinade is involved. Dry kelp sheets pull water out and season the fish from the outside.' },
			{ says: 'Fish wrapped in seaweed and steamed until just cooked', why: 'Nothing cooks it. The kelp only firms and seasons the fish, which is served raw.' }
		]
	},
	{
		id: 'fd_0357',
		term: 'Aburi',
		level: 4,
		say: 'ah-BOO-ree',
		gist: 'Raw fish touched by a flame on top only, fat softened, center raw',
		guest: "It's raw fish, or sometimes wagyu, kissed with a flame just on top, so the fat melts and turns a little smoky while the inside stays cool and silky.",
		why: 'A torch or glowing charcoal is held over the surface for seconds. The top fat melts and the edges catch a light char, while the flesh below stays raw. It suits rich cuts like salmon belly, fatty tuna, mackerel and wagyu, where melting fat is the point.',
		madeWith: ['fish', 'sometimes scallop', 'sometimes wagyu beef', 'often sushi rice', 'sometimes soy', 'sometimes egg-yolk mayonnaise'],
		origin: 'Japanese, from aburu, to sear or scorch over a flame',
		notThis: 'Not tataki, seared all round and then sliced. Here only the top of a raw piece, often on its rice, meets the flame.',
		seeAlso: ['fd_0355', 'fd_0107'],
		confusedWith: ['fd_0039', 'fd_0223'],
		line: 'Aburi salmon belly nigiri, yuzu, sea salt',
		traps: [
			{ says: 'Raw fish slices splashed with hot oil so the edges just turn white', why: 'No hot oil is used. A flame touches only the top of the piece for seconds.' }
		]
	},
	{
		id: 'fd_0358',
		term: 'Binchotan-Grilled',
		level: 4,
		say: 'BIN-choh-tahn GRILLD',
		gist: 'Cooked over dense Japanese white charcoal, hot and nearly smokeless',
		guest: "It's cooked over Japanese white charcoal, which burns very hot and clean, so you get a crisp, deeply browned outside without a heavy smoky taste.",
		why: 'Ubame oak is charred slowly in a kiln, then pulled out glowing and smothered in sand and ash, leaving dense, almost pure carbon. It burns for hours with little flame or smoke and fierce, even heat, so the outside browns fast and the food tastes of itself, not of smoke.',
		madeWith: ['often chicken', 'sometimes beef', 'sometimes fish', 'often soy', 'often mirin'],
		origin: 'Japanese white charcoal, named for a Wakayama maker of about 1700',
		notThis: 'Not ordinary grilling: wood and briquettes add their own smoke and odor, while this charcoal gives clean, steady heat.',
		seeAlso: ['fd_0357', 'fd_0041'],
		confusedWith: ['fd_0032'],
		line: 'Binchotan-grilled chicken thigh, tare, scallion'
	},
	{
		id: 'fd_0359',
		term: 'Hay-Smoked',
		level: 4,
		aliases: ['Hay-Roasted', 'Cooked in Hay'],
		gist: 'Roasted in or held over smoldering dried grass for a sweet aroma',
		guest: "It's roasted in or smoked over smoldering hay, a farmhouse trick that leaves a sweet, grassy smoke. The hay is just for aroma, you don't eat it.",
		why: 'Hay burns fast and brief, so its smoke is lighter than wood smoke, and dried grass holds sweet aromatics, chiefly coumarin. Food is packed in hay and roasted in a closed pot, or held over it for minutes: a quick kiss of smoke, not slow barbecue.',
		madeWith: ['often lamb', 'sometimes chicken', 'sometimes egg', 'sometimes butter or cream', 'sometimes cheese'],
		note: 'A quick hay smoke does not cook food, so hay-smoked fish or tartare may still be raw.',
		origin: 'Old French farmhouse cooking, revived by Nordic chefs',
		notThis: 'Not wood-smoked: hay burns fast and sweet, giving a lighter, grassier smoke than hardwood.',
		seeAlso: ['fd_0037'],
		confusedWith: ['fd_0041'],
		line: 'Hay-smoked lamb loin, sunchoke, salsa verde',
		traps: [
			{ says: 'Food baked in a crust of dried grass, which is eaten with the dish', why: 'The hay only perfumes the food and is never eaten, even when it comes to the table.' }
		]
	}
];

export default cards;
