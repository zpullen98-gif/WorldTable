/* The Floor Deck, section "preparations". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0216',
		term: 'Carpaccio',
		say: 'kar-PAH-choh',
		packet: true,
		gist: 'Raw beef, or sometimes fish, sliced paper thin to cover the plate',
		guest: "It's raw beef sliced so thin you can almost see through it, dressed with olive oil, lemon and shaved Parmesan. Light, silky and bright.",
		why: "Chilled lean beef, often tenderloin, is sliced paper thin or pounded flat between sheets, so the raw meat melts on the tongue instead of chewing. Harry's Bar in Venice made it around 1950 with a thin mayonnaise sauce. Menus now use the word for any thin raw slice.",
		madeWith: ['often beef', 'sometimes fish', 'often olive oil', 'often parmesan', 'sometimes egg yolk', 'sometimes capers'],
		origin: "Harry's Bar, Venice, named for the painter Vittore Carpaccio and his reds",
		pairs: 'Arugula, shaved Parmesan, capers, lemon, olive oil',
		notThis: 'Not tartare, which is raw meat chopped fine, and not bresaola, which is cured. Carpaccio is fresh, raw and sliced flat.',
		seeAlso: ['fd_0220', 'fd_0223'],
		confusedWith: ['fd_0217', 'fd_0079'],
		line: 'Beef carpaccio, arugula, Parmesan, lemon oil'
	},
	{
		id: 'fd_0217',
		term: 'Tartare',
		say: 'tar-TAR',
		packet: true,
		gist: 'Raw beef or fish chopped fine by knife, seasoned and served in a mound',
		guest: "It's raw beef chopped fine by hand and mixed with capers, shallot and mustard, often with an egg yolk on top. Rich, tender and savory, served with toast or fries.",
		why: 'The meat is cut with a knife, not ground, so it stays in tiny tender pieces rather than a paste. Salty capers, sharp shallot, mustard and a raw yolk season and bind it. Tuna and salmon versions use the same method with lighter dressings, often soy and citrus.',
		madeWith: ['beef', 'often egg yolk', 'often mustard', 'sometimes sesame', 'sometimes anchovy', 'sometimes tuna', 'sometimes soy'],
		note: 'The yolk is served raw along with the meat.',
		pairs: 'Frites, toasted baguette, cornichons, a raw egg yolk',
		notThis: 'Not carpaccio, which is sliced whole and flat. Tartare is chopped into small pieces and piled up.',
		seeAlso: ['fd_0278', 'fd_0279'],
		confusedWith: ['fd_0216'],
		line: 'Hand-cut beef tartare, egg yolk, capers, frites',
		traps: [
			{ says: 'Beef ground coarse, pressed into a patty and seared rare on the flat top', why: 'It is never cooked: the meat is served raw, cut by knife and never ground.' }
		]
	},
	{
		id: 'fd_0218',
		term: 'Frittata',
		say: 'frih-TAH-tuh',
		packet: true,
		gist: 'Thick open egg dish with its fillings set right in, cut into wedges',
		guest: "It's an Italian egg dish, thick and open like a crustless pie, with the vegetables and cheese cooked right into the eggs. Served in wedges, warm or at room temperature.",
		why: 'Beaten eggs are poured over the fillings in a pan and cooked gently until the bottom sets, then finished in the oven or flipped. Slow heat gives an even, tender slice. An omelette is cooked fast and folded, and a quiche sits in pastry with cream.',
		madeWith: ['egg', 'often cheese', 'sometimes milk', 'sometimes butter'],
		origin: 'Italian, from friggere, to fry',
		pairs: 'Green salad, roasted peppers, crusty bread',
		line: 'Frittata of spring onion, ricotta and herbs',
		traps: [
			{ says: 'Folded French egg dish cooked fast in a hot pan and left soft inside', why: 'It is cooked slowly and served flat and open, never folded. The fast folded dish is an omelette.' }
		]
	},
	{
		id: 'fd_0219',
		term: 'Ragout',
		say: 'rah-GOO',
		packet: true,
		gist: 'Slow-simmered stew of meat, fish or vegetables in a thick sauce',
		guest: "It's a slow-simmered stew, the meat or vegetables cooked gently in a rich sauce until tender. Deep, savory and made for spooning over something soft.",
		why: 'Pieces of meat or vegetables are browned, then simmered low in stock or wine until the connective tissue relaxes and the liquid reduces to a thick, glossy sauce. It is braising in small pieces. The Italian cousin, ragù, is usually a meat sauce for pasta.',
		madeWith: ['often beef', 'sometimes lamb', 'sometimes pork', 'often wine', 'often wheat flour'],
		origin: 'French ragoût, from ragoûter, to revive the appetite',
		pairs: 'Polenta, mashed potato, egg noodles, crusty bread',
		recipe: 'ragout-de-boulettes',
		seeAlso: ['fd_0026', 'fd_0040', 'fd_0229'],
		line: 'Lamb ragout, white beans, gremolata',
		traps: [
			{ says: 'Meat stew cooked fast over high heat and served thin and brothy', why: 'A ragout simmers low and slow until its sauce reduces thick, never fast and brothy.' }
		]
	},
	{
		id: 'fd_0220',
		term: 'Crudo',
		say: 'KROO-doh',
		gist: 'Very fresh raw fish dressed simply, Italian style, as it goes out',
		guest: "It's raw fish sliced thin and dressed at the last second with good olive oil, citrus and sea salt. Clean, cool and delicate, the fish is the whole point.",
		why: 'Italian for raw. Very fresh fish or shellfish is sliced and dressed moments before it goes out, so the acid has no time to firm it and the flesh stays soft and glossy. Think sashimi with Italian seasoning, or ceviche without the long soak.',
		madeWith: ['fish', 'sometimes shellfish', 'often olive oil', 'often citrus'],
		note: 'Served raw and dressed at the pass, so run it out right away.',
		pairs: 'Olive oil, lemon, flaky salt, chili, shaved fennel',
		notThis: 'Not ceviche, which sits in lime juice until the fish turns opaque. Crudo is dressed at the last moment and stays glossy.',
		recipe: 'geoduck-crudo',
		seeAlso: ['fd_0216', 'fd_0284'],
		confusedWith: ['fd_0221'],
		line: 'Hamachi crudo, blood orange, chili, olive oil'
	},
	{
		id: 'fd_0221',
		term: 'Ceviche',
		say: 'seh-VEE-chay',
		gist: 'Raw fish soaked in lime juice until it firms and turns opaque',
		guest: "It's raw fish marinated in fresh lime juice with red onion, chili and cilantro. The lime firms it and makes it bright, tangy and refreshing.",
		why: "Acid in lime juice unwinds the fish's proteins the way heat does, so the flesh turns white and firm in minutes, though nothing is cooked. It is Peru's national dish, and the tangy, spicy liquid left in the bowl is called leche de tigre, tiger's milk.",
		madeWith: ['fish', 'sometimes shellfish', 'often lime', 'often chili', 'often red onion'],
		note: 'The lime changes the texture but does not cook it. Treat it as raw fish.',
		pairs: 'Sweet potato, boiled corn, crunchy toasted corn, red onion',
		notThis: 'Not crudo, which is raw fish dressed with oil at the last second, and not escabeche, which is cooked first. Ceviche soaks raw in lime.',
		recipe: 'ceviche-clasico',
		confusedWith: ['fd_0220', 'fd_0224'],
		line: 'Peruvian ceviche, leche de tigre, sweet potato, corn',
		traps: [
			{ says: 'Seafood fully cooked by the lime, so it is no longer raw fish', why: 'Acid firms and whitens the flesh but does not heat it, so the fish is still raw.' }
		]
	},
	{
		id: 'fd_0222',
		term: 'Gravlax',
		say: 'GRAHV-lahks',
		gist: 'Salmon cured raw under salt, sugar and dill, then sliced thin',
		guest: "It's Scandinavian salmon cured for a few days with salt, sugar and fresh dill, never smoked. Silky, sweet and herby, usually with a mustard dill sauce.",
		why: 'A side of salmon is packed in salt, sugar and dill and pressed in the fridge for two to three days. Salt draws out water and firms the flesh while sugar keeps it tender, so it slices like silk. Smoked salmon is cured, then smoked, so it tastes of wood.',
		madeWith: ['salmon', 'often dill', 'often mustard', 'sometimes aquavit'],
		note: 'Cured but never cooked, so it is served raw.',
		origin: 'Swedish, literally grave salmon, once buried in sand to cure',
		notThis: 'Not smoked salmon. Gravlax is cured with no smoke, so it is paler, sweeter and tastes of dill, not wood.',
		recipe: 'gravlax',
		seeAlso: ['fd_0030', 'fd_0117'],
		confusedWith: ['fd_0041'],
		line: 'House gravlax, mustard dill sauce, rye crisps'
	},
	{
		id: 'fd_0223',
		term: 'Tataki',
		say: 'tah-TAH-kee',
		gist: 'Fish or beef seared for seconds, rare inside, then sliced and dressed',
		guest: "It's tuna or beef seared for just a few seconds over high heat, so the edge is cooked and the center stays rare. Sliced thin with a bright citrus soy sauce.",
		why: 'The meat is kissed by a very hot flame or pan, then often plunged into ice water to stop the cooking, leaving a thin browned rim around a cool raw center. It began in Kochi with bonito seared over burning straw. The name means pounded, from patting in the garnish.',
		madeWith: ['often tuna or bonito', 'sometimes beef', 'often soy', 'often citrus', 'often bonito flakes', 'often garlic', 'sometimes sesame'],
		note: 'Seared outside only. The center is served raw by design. Ask the kitchen before promising more heat.',
		pairs: 'Ponzu, scallion, grated ginger, garlic chips, sesame',
		seeAlso: ['fd_0039', 'fd_0131', 'fd_0216'],
		line: 'Seared tuna tataki, ponzu, scallion, sesame',
		traps: [
			{ says: 'Thin slices of beef simmered at the table in a sweet soy broth', why: 'That is sukiyaki. This is seared hot for seconds, left raw inside and sliced.' }
		]
	},
	{
		id: 'fd_0224',
		term: 'Escabeche',
		say: 'es-kah-BAY-chay',
		gist: 'Fish or meat cooked first, then left to cool in a spiced vinegar',
		guest: "It's fish that's cooked, then left to marinate in a warm, spiced vinegar, often served cool. Bright, tangy and tender, like a gentle pickle.",
		why: 'The fish or meat is fried or poached first, then covered in hot vinegar and oil with garlic, bay, onion and spices. As it rests, the acid seasons and firms the flesh. Think a gentle pickle, served cool in Spain and often hot in the Philippines.',
		madeWith: ['fish', 'sometimes chicken', 'vinegar', 'olive oil', 'often wheat flour', 'often garlic'],
		origin: 'Spain, from an Arabic word for a vinegar stew; now across Latin America and the Philippines',
		notThis: 'Not ceviche, which is raw fish cured in citrus. Escabeche is always cooked before it meets the vinegar.',
		seeAlso: ['fd_0033'],
		confusedWith: ['fd_0221'],
		line: 'Mackerel escabeche, pickled shallot, grilled bread'
	},
	{
		id: 'fd_0225',
		term: 'Gratin',
		say: 'GRAH-tin',
		gist: 'Dish baked in a shallow pan until its top forms a browned crust',
		guest: "It's baked in a shallow dish until the top turns golden and crisp. The classic is thin sliced potatoes baked soft in cream.",
		why: 'The word means the crust. A wide, shallow dish gives lots of surface, so the top browns under high heat while the inside turns tender and creamy. Cheese or breadcrumbs help it brown, but the classic potato version from the Dauphine skips cheese entirely.',
		madeWith: ['often cream', 'often milk', 'butter', 'sometimes cheese', 'sometimes wheat flour', 'sometimes breadcrumbs'],
		origin: 'French, from gratter, to scrape: the crust once scraped from the pan',
		pairs: 'Roast lamb, steak, roast chicken',
		recipe: 'gratin-dauphinois',
		seeAlso: ['fd_0208', 'fd_0037'],
		line: 'Potato gratin, gruyère, thyme',
		traps: [
			{ says: 'Any dish smothered in cheese, since the word itself means melted cheese', why: 'The word means the browned crust on top. Cheese is common, but it is not what makes a dish a gratin.' }
		]
	},
	{
		id: 'fd_0226',
		term: 'Croquette',
		say: 'kroh-KET',
		gist: 'Creamy filling shaped into a small log, breaded and deep-fried',
		guest: "It's a little breaded, fried bite with a crisp shell and a soft, creamy middle. The filling is often ham, fish or cheese in a silky white sauce.",
		why: 'A filling of mashed potato or a thick white sauce folded with ham, fish or cheese is chilled until firm, shaped, rolled in flour, egg and crumbs, then fried. The crust sets fast and the inside turns molten, so it eats crunchy then creamy.',
		madeWith: ['egg', 'wheat flour', 'breadcrumbs', 'often milk', 'often butter', 'sometimes ham', 'sometimes fish or shellfish'],
		note: 'The center holds heat far longer than the shell. Warn guests the first bite runs hot.',
		origin: 'French, from croquer, to crunch; in Spain croqueta',
		seeAlso: ['fd_0031', 'fd_0208'],
		line: 'Jamón croquettes, saffron aioli'
	},
	{
		id: 'fd_0227',
		term: 'Roulade',
		say: 'roo-LAHD',
		gist: 'Thin flat layer spread with filling, rolled into a spiral and sliced',
		guest: "It's thin meat or cake rolled around a filling, then sliced so every piece shows a pretty spiral. A savory one is often pork or chicken rolled with herbs and greens.",
		why: 'Meat is pounded or butterflied thin, or a sponge cake baked in a flat sheet, then spread with filling and rolled tight, the meat ones tied. Rolling means every slice gets the filling and cooks evenly. The same idea makes a jelly roll or a Yule log.',
		madeWith: ['often egg', 'sometimes wheat flour', 'sometimes cream', 'sometimes pork'],
		origin: 'French, from rouler, to roll',
		notThis: 'Not a ballotine, which is a boned bird or leg stuffed and reshaped. A roulade starts as a flat sheet of anything, even cake.',
		recipe: 'pavlova-roulade-with-passionfruit-curd',
		seeAlso: ['fd_0084'],
		confusedWith: ['fd_0228'],
		line: 'Pork roulade, braised greens, mustard jus'
	},
	{
		id: 'fd_0228',
		term: 'Ballotine',
		say: 'bal-oh-TEEN',
		gist: 'Poultry leg or bird with the bones removed, stuffed and rolled tight',
		guest: "It's usually a chicken leg or a whole bird with the bones taken out, filled with a savory stuffing and rolled. Every slice is juicy meat around a rich center.",
		why: 'The cook bones the bird or leg while keeping the skin whole, fills it with a forcemeat of ground meat, herbs and cream, then rolls and ties it. Poached or roasted, the skin holds the juices in, so it slices clean and stays moist, a boneless roast in miniature.',
		madeWith: ['chicken', 'sometimes duck', 'often pork', 'often cream', 'often egg', 'sometimes pistachio'],
		origin: 'French, from ballot, a small bundle',
		notThis: 'Not a roulade, which rolls a flat sheet of anything. A ballotine is a boned bird, leg or fish rebuilt around stuffing.',
		seeAlso: ['fd_0084', 'fd_0051'],
		confusedWith: ['fd_0227'],
		line: 'Chicken ballotine, mushroom farce, pan jus',
		traps: [
			{ says: 'Cold loaf of poached poultry set in its own jelly, served in slices', why: 'That is a galantine. A ballotine is not set in jelly and is often served hot.' }
		]
	},
	{
		id: 'fd_0229',
		term: 'Cassoulet',
		say: 'kah-soo-LAY',
		gist: 'Slow-baked casserole of white beans, duck confit, sausage and pork',
		guest: "It's a slow-baked French casserole of white beans with slow-cooked duck, garlic sausage and pork. Hearty and rich, with a golden crust.",
		why: 'Dried white beans are simmered with pork and aromatics, layered with duck or goose confit and garlicky sausage, then baked for hours. The beans soak up the fat and turn creamy while a crust forms on top, which cooks break and push under to thicken the pot.',
		madeWith: ['white beans', 'duck', 'pork', 'sometimes goose', 'sometimes lamb', 'sometimes breadcrumbs'],
		origin: 'Languedoc, France; named for the cassole, its earthenware pot',
		pairs: 'Red wine from southwest France, green salad',
		recipe: 'cassoulet-de-toulouse',
		seeAlso: ['fd_0029', 'fd_0026'],
		line: 'Duck cassoulet, garlic sausage, pork belly'
	},
	{
		id: 'fd_0230',
		term: 'Bouillabaisse',
		say: 'boo-yuh-BAYS',
		gist: 'Marseille stew of several fish in a saffron and fennel broth',
		guest: "It's the famous fish stew of Marseille, several kinds of fish in a golden saffron broth, with toast and a garlicky sauce to float on top.",
		why: 'Rockfish and other catch are boiled hard in olive oil, tomato, fennel, orange peel and saffron, so the oil emulsifies into a rich, silky broth. It is served with toasted bread and rouille, a garlic and saffron mayonnaise stirred into the broth.',
		madeWith: ['mixed fish', 'often shellfish', 'olive oil', 'saffron', 'bread', 'often egg yolk', 'garlic'],
		note: 'Whole or bone-in fish may be used. Ask the kitchen before promising a guest no bones.',
		origin: 'Marseille, France; from bouillir and abaisser, to boil then lower the heat',
		pairs: 'Rouille, toasted bread, dry rosé',
		recipe: 'bouillabaisse',
		seeAlso: ['fd_0214', 'fd_0114'],
		line: 'Bouillabaisse, rockfish, mussels, rouille, crouton',
		traps: [
			{ says: 'Thick, creamy seafood soup with potato, thickened with cream', why: 'It is a thin saffron broth with pieces of fish, served with bread and rouille. The thick creamy soup is a chowder.' }
		]
	},
	{
		id: 'fd_0231',
		term: 'En Papillote',
		say: 'ahn pah-pee-YOHT',
		gist: 'Fish or vegetables sealed in a parchment packet to steam in the oven',
		guest: "It's fish baked sealed inside a parchment paper pouch, so it steams in its own juices. When the pouch is cut open, you get all the aroma.",
		why: 'Fish, herbs, vegetables and a splash of wine or butter are sealed in folded parchment and baked. The trapped moisture turns to steam, cooking the food gently without drying it and keeping every drop of flavor in the packet. Delicate fish suits it best.',
		madeWith: ['usually fish', 'often butter', 'often white wine'],
		origin: 'French, in paper; a papillote was a paper frill or curl paper',
		notThis: 'Not baked in pastry. The wrap is parchment or foil, cut open and set aside, not eaten.',
		lexiconSlug: 'steaming-and-en-papillote',
		recipe: 'salmon-en-papillote',
		seeAlso: ['fd_0045', 'fd_0113'],
		line: 'Halibut en papillote, fennel, lemon, white wine',
		traps: [
			{ says: 'Fish wrapped in pastry dough and baked until the crust is golden', why: 'The wrap is paper, not pastry, and it is never eaten.' }
		]
	},
	{
		id: 'fd_0232',
		term: 'Meunière',
		say: 'muhn-YEHR',
		gist: 'Floured fish fried in butter, dressed only in brown butter and lemon',
		guest: "It's fish dusted in flour and pan-fried in butter, then finished with nutty browned butter, lemon and parsley. Simple, crisp-edged and rich.",
		why: 'The fish is dredged in flour and fried in butter, so the flour browns into a thin golden skin that keeps delicate flesh moist. The butter is cooked on until it smells of hazelnuts, then sharpened with lemon and parsley. Think lemon-butter fish, toastier.',
		madeWith: ['fish', 'wheat flour', 'butter', 'lemon', 'parsley'],
		note: 'Sole may come whole on the bone and be filleted tableside, so small bones are possible.',
		origin: "French for the miller's wife, named for the flour dusting",
		pairs: 'Sole, trout, boiled potatoes, green beans, spinach',
		notThis: 'Not beurre blanc, a creamy white wine butter sauce. This butter is browned and nutty, not pale.',
		recipe: 'sole-meuniere',
		seeAlso: ['fd_0161', 'fd_0122', 'fd_0233'],
		confusedWith: ['fd_0205'],
		line: 'Dover sole meunière, brown butter, lemon, parsley',
		traps: [
			{ says: 'Fish gently poached in white wine, then coated in a creamy mushroom sauce', why: 'It is floured and pan-fried in butter, and the sauce is browned butter and lemon, not cream.' }
		]
	},
	{
		id: 'fd_0233',
		term: 'Amandine',
		say: 'ah-mahn-DEEN',
		aliases: ['Almondine'],
		gist: 'Pan-fried fish topped with toasted sliced almonds in browned butter',
		guest: 'It means with almonds. The fish is pan-fried in butter and topped with toasted sliced almonds in a nutty brown butter with lemon.',
		why: 'It builds on the classic floured, butter-fried fish. Sliced almonds are toasted in the pan butter as it browns, so almond and butter pick up the same roasted flavor, then lemon cuts the richness. You get crunch on top of soft, flaky fish.',
		madeWith: ['fish', 'almonds', 'butter', 'often wheat flour', 'lemon'],
		origin: 'French, meaning made with almonds; trout is the classic, a New Orleans staple',
		pairs: 'Trout, green beans, rice, lemon, parsley',
		seeAlso: ['fd_0232', 'fd_0161', 'fd_0122'],
		line: 'Trout amandine, brown butter, lemon, haricots verts',
		traps: [
			{ says: 'Fish pressed into a crust of finely ground almond flour, then baked golden', why: 'The almonds are sliced and toasted, spooned over pan-fried fish, not ground into a baked crust.' }
		]
	},
	{
		id: 'fd_0004',
		term: 'Coleslaw',
		packet: true,
		gist: 'Shredded raw cabbage salad, dressed creamy or sharp with vinegar',
		guest: "It's crisp shredded cabbage in a tangy dressing, cool and crunchy. It's here to cut through the richness of barbecue and anything fried.",
		why: 'Raw cabbage is shredded fine and dressed a while ahead, so salt and acid soften it slightly while it keeps its crunch. Creamy versions are mayonnaise-based; in the Carolinas it is often just vinegar, sugar and pepper, or reddened with ketchup.',
		madeWith: ['cabbage', 'often carrot', 'vinegar', 'sugar', 'often mayonnaise', 'often egg', 'sometimes buttermilk'],
		origin: 'Dutch koolsla, cabbage salad, brought to colonial New York',
		pairs: 'Pulled pork, fried catfish, hushpuppies, sandwiches',
		recipe: 'carolina-coleslaw',
		seeAlso: ['fd_0200'],
		line: 'Pulled pork sandwich, vinegar coleslaw, pickles',
		traps: [
			{ says: 'Hot braised red cabbage, stewed soft with apple and vinegar', why: 'It is raw cabbage dressed cold, crisp and crunchy, not cooked soft.' }
		]
	},
	{
		id: 'fd_0005',
		term: 'Hash',
		packet: true,
		gist: 'Chopped cooked meat and potato, pan-crisped into a browned crust',
		guest: "Usually it's chopped meat and potatoes crisped in a hot pan, often with a runny egg on top. At Carolina barbecue joints it's a soft pork stew over rice.",
		why: 'Born as a way to use leftovers: cooked meat, often corned or roast beef, is diced with potato and onion and pressed into a hot buttered pan, then left alone so the starch browns into a crust. In South Carolina barbecue joints, hash is instead a soft pork stew spooned over rice.',
		madeWith: ['often beef', 'sometimes pork', 'potato', 'onion', 'often butter', 'sometimes egg'],
		note: 'The egg on top usually comes with a runny yolk. A guest can ask for it cooked through.',
		origin: 'From the French hacher, to chop',
		pairs: 'Fried or poached eggs, toast, hot sauce, and rice under Carolina hash',
		seeAlso: ['fd_0085'],
		line: 'Corned beef hash, two fried eggs, toast'
	}
];

export default cards;
