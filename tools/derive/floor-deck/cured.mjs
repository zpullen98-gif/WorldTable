/* The Floor Deck, section "cured". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0064',
		term: 'Andouille',
		level: 2,
		say: 'an-DOO-ee',
		packet: true,
		gist: 'Coarse, heavily smoked Louisiana pork sausage with garlic and cayenne',
		guest: "It's Louisiana's smoked pork sausage, coarse and garlicky with a peppery kick. It's what gives gumbo and jambalaya their deep, smoky backbone.",
		why: 'Chunks of pork shoulder, not a fine grind, are seasoned with garlic, black pepper and cayenne, cased and smoked hard, often over pecan wood. It comes out firm, dark and smoky enough to season a whole pot. Think kielbasa, but coarser and hotter.',
		madeWith: ['pork', 'pork fat', 'garlic', 'black pepper', 'cayenne', 'sometimes onion'],
		pairs: 'Gumbo, jambalaya, red beans and rice, shrimp and grits',
		notThis: 'Not tasso, its smokehouse partner, a solid spiced slab of shoulder. French andouille, its ancestor, is a tripe sausage.',
		lexiconSlug: 'tasso-and-cajun-andouille',
		recipe: 'chicken-and-andouille-gumbo',
		seeAlso: ['fd_0041', 'fd_0065'],
		confusedWith: ['fd_0077'],
		line: 'Chicken and andouille gumbo, Carolina Gold rice',
		traps: [
			{ says: 'Soft Louisiana sausage of pork, rice and liver, squeezed from its casing', why: 'That is boudin. This one is chunked pork, firm and smoked, sliced into coins.' }
		]
	},
	{
		id: 'fd_0065',
		term: 'Chorizo',
		level: 1,
		say: 'chor-EE-zoh',
		packet: true,
		gist: 'Paprika-red pork sausage, dry-cured in Spain and sold raw in Mexico',
		guest: "It's a garlicky pork sausage stained deep red. Sliced like salami it's the cured Spanish kind, and crumbled it's the fresh Mexican kind, which is spicier.",
		why: 'Two products share one word. Spanish chorizo is chopped pork cured with pimentón, the smoked paprika that gives it color and smoke, then dried until sliceable. Mexican chorizo is raw ground pork with dried chiles and vinegar, cooked loose so its red fat stains the dish.',
		madeWith: ['pork', 'pork fat', 'smoked paprika', 'garlic', 'sometimes dried chiles', 'sometimes vinegar', 'sometimes white wine'],
		note: 'Ask the kitchen which kind. Cured Spanish chorizo is air-dried, not cooked, and sliced as is. Fresh Mexican chorizo is always cooked.',
		origin: 'Spain and Portugal, remade in Mexico with local chiles',
		lexiconSlug: 'chorizo-spanish-vs-mexican',
		seeAlso: ['fd_0283', 'fd_0070', 'fd_0080'],
		line: 'Steamed clams, Spanish chorizo, white wine, grilled bread',
		traps: [
			{ says: 'Spicy pork sausage colored red with tomato and cayenne, always sold raw', why: 'The red comes from paprika or dried chiles, and the Spanish kind is dry-cured, not fresh.' }
		]
	},
	{
		id: 'fd_0066',
		term: 'Coppa',
		level: 2,
		say: 'KOH-pah',
		aliases: ['Capocollo', 'Capicola'],
		packet: true,
		gist: 'Italian dry-cured pork neck muscle, marbled and sliced paper thin',
		guest: "It's dry-cured pork neck, sliced thin like prosciutto but with more marbling and a little more spice. Rich, tender and slightly sweet.",
		why: 'The muscle running from the neck into the shoulder is salted, rubbed with pepper and spices, cased and hung to dry for months. Several small muscles meet here, so ribbons of fat run through the lean, making it richer and more seasoned than prosciutto and softer than salami.',
		madeWith: ['pork', 'salt', 'black pepper', 'often garlic', 'sometimes wine', 'sometimes paprika', 'sometimes fennel'],
		note: 'A dry-cured coppa is air-dried, not cooked, and is served as is in thin slices.',
		notThis: 'Not prosciutto, which is the whole hind leg cured with salt alone. Coppa is a smaller, spiced, fattier muscle.',
		lexiconSlug: 'coppa-capocollo',
		seeAlso: ['fd_0091', 'fd_0080', 'fd_0078'],
		confusedWith: ['fd_0074'],
		line: 'Coppa, pickled peppers, grilled sourdough',
		traps: [
			{ says: 'Italian sausage of ground pork neck, fermented and dried in a casing', why: 'It is one whole muscle cured intact, not ground meat, even though it dries in a casing.' }
		]
	},
	{
		id: 'fd_0067',
		term: 'Country Ham',
		level: 2,
		packet: true,
		gist: 'American pork leg, dry-salted, often smoked, then aged for months',
		guest: "It's the South's answer to prosciutto, a pork leg packed in salt and aged for months. It's salty, deep and a little funky, so a thin slice goes a long way.",
		why: 'A whole pork leg is packed in dry salt, often with sugar, usually smoked over hickory, then hung through a summer or longer. It loses water and concentrates, so it eats firm, intensely salty and savory. City ham is brined instead, so it stays moist and mild.',
		madeWith: ['pork', 'salt', 'often sugar', 'sometimes black pepper'],
		note: 'Served two ways: shaved uncooked like prosciutto, or sliced thicker and pan-fried. Ask the kitchen which.',
		pairs: 'Biscuits, red-eye gravy, grits, melon, pickles',
		lexiconSlug: 'american-country-ham',
		recipe: 'country-ham-with-redeye-gravy',
		seeAlso: ['fd_0074', 'fd_0089'],
		line: 'Shaved country ham, buttermilk biscuits, sorghum butter',
		traps: [
			{ says: 'Pork leg soaked in a sweet brine, then baked and glazed until moist', why: 'That describes the wet-cured city style. This one is rubbed with dry salt and aged, never soaked in brine.' }
		]
	},
	{
		id: 'fd_0068',
		term: 'Guanciale',
		level: 3,
		say: 'gwan-CHAH-leh',
		packet: true,
		gist: 'Italian cured pork jowl, unsmoked, richer and fattier than belly',
		guest: "It's cured pork jowl, the fatty cheek, like an unsmoked Italian bacon with richer, silkier fat. It's the classic pork in carbonara and amatriciana.",
		why: 'The jowl is rubbed with salt, black pepper and sometimes herbs, then hung to dry for weeks. It is mostly fat with streaks of lean, and that fat is firmer and more flavorful than belly fat. In a pan it renders into crisp pieces and a savory fat that becomes the sauce.',
		madeWith: ['pork', 'salt', 'black pepper', 'sometimes garlic', 'sometimes rosemary', 'sometimes thyme'],
		note: 'Nearly always cooked: diced and rendered until crisp, not sliced for a board.',
		notThis: 'Not pancetta, which is cured belly, leaner and milder, and not bacon, which is smoked belly. This is the jowl.',
		lexiconSlug: 'guanciale-jowl-and-lardo',
		recipe: 'guanciale',
		seeAlso: ['fd_0087', 'fd_0047', 'fd_0069'],
		confusedWith: ['fd_0071', 'fd_0083'],
		line: "Bucatini all'amatriciana, guanciale, pecorino",
		traps: [
			{ says: 'Italian pork jowl, heavily smoked like bacon, then diced into pasta', why: 'It is cured and air-dried without smoke, which is what sets it apart from bacon.' }
		]
	},
	{
		id: 'fd_0069',
		term: 'Lardo',
		level: 3,
		say: 'LAR-doh',
		packet: true,
		gist: 'Italian cured pork back fat, aged with salt and herbs, shaved thin',
		guest: "It's pure pork back fat cured with salt, rosemary and garlic until it's silky and sweet. Shaved thin over warm toast, it melts like butter.",
		why: "Thick slabs of fat from the pig's back are layered with sea salt, rosemary, garlic and spices and cured for months, traditionally in marble tubs in Colonnata, Tuscany. The cure firms and perfumes it, so a thin slice turns translucent and melts on anything warm.",
		madeWith: ['pork fat', 'salt', 'rosemary', 'garlic', 'black pepper', 'sometimes cinnamon', 'sometimes nutmeg'],
		note: 'Served uncooked in paper-thin slices, best laid on something warm so it softens.',
		notThis: 'Not lard, the rendered cooking fat. Lardo is a cured solid slab, sliced and eaten like other cured meats.',
		lexiconSlug: 'guanciale-jowl-and-lardo',
		seeAlso: ['fd_0068', 'fd_0071', 'fd_0047'],
		line: 'Grilled sourdough, lardo, rosemary, sea salt',
		traps: [
			{ says: 'Rendered pork fat, melted and strained, used for frying and pastry', why: 'That is lard. This is a solid slab of back fat, cured and sliced, never melted down.' }
		]
	},
	{
		id: 'fd_0070',
		term: 'Lomo',
		level: 4,
		say: 'LOH-moh',
		aliases: ['Lomo Embuchado', 'Lomo Curado'],
		packet: true,
		gist: 'Spanish air-dried whole pork loin, lean, rubbed with smoked paprika',
		guest: "It's Spanish cured pork loin, air-dried with smoked paprika and garlic. It's as lean as cured pork gets, clean, meaty and gently smoky.",
		why: 'The whole loin, the long lean muscle along the back, is trimmed, rubbed with salt, pimentón and garlic, cased and dried for two months or more. With almost no fat it slices rosy and eats firm and meaty. From ibérico pigs it shows fine marbling and a nutty depth.',
		madeWith: ['pork', 'salt', 'smoked paprika', 'garlic', 'sometimes oregano', 'sometimes olive oil'],
		note: 'Air-dried, not cooked, and served as is in thin slices.',
		origin: 'Spain; lomo is Spanish for loin',
		notThis: 'Not tenderloin. Lomo is the loin, the big muscle along the back. On a Latin American menu it can mean fresh beef.',
		lexiconSlug: 'lomo-embuchado',
		recipe: 'lomo-embuchado',
		seeAlso: ['fd_0082', 'fd_0283', 'fd_0065'],
		confusedWith: ['fd_0093'],
		line: 'Lomo ibérico, marcona almonds, olive oil',
		traps: [
			{ says: 'Cured pork tenderloin from Spain, the small soft muscle under the spine', why: 'It is the loin, the large muscle along the back. In Spain the tenderloin is called solomillo.' }
		]
	},
	{
		id: 'fd_0071',
		term: 'Pancetta',
		level: 2,
		say: 'pan-CHEH-tah',
		packet: true,
		gist: 'Italian pork belly cured with salt and spice, air-dried, not smoked',
		guest: "It's Italian bacon without the smoke, pork belly cured with salt, pepper and spices. It tastes cleaner and sweeter than American bacon, all pork and spice.",
		why: 'Same cut as bacon, the belly, but salt-cured with pepper, garlic and spices such as juniper or nutmeg, then air-dried for weeks instead of smoked. It comes as a flat slab for dicing or a rolled spiral for slicing. Without smoke, the sweet pork and spice come through.',
		madeWith: ['pork', 'salt', 'black pepper', 'often garlic', 'sometimes juniper', 'sometimes nutmeg', 'sometimes fennel'],
		note: 'Usually diced and cooked crisp. Thin-sliced rolled pancetta may be served uncooked, so ask the kitchen.',
		notThis: 'Not bacon, which is smoked, and not guanciale, which is the jowl. Pancetta is unsmoked belly.',
		lexiconSlug: 'pancetta-tesa-and-arrotolata',
		seeAlso: ['fd_0094', 'fd_0069', 'fd_0030'],
		confusedWith: ['fd_0083', 'fd_0068'],
		line: 'Brussels sprouts, crisp pancetta, aged balsamic',
		traps: [
			{ says: 'Italian dry-cured pork leg, diced small and crisped for pasta sauces', why: 'It is the belly, not the leg. A dry-cured pork leg is a ham, such as prosciutto.' }
		]
	},
	{
		id: 'fd_0072',
		term: 'Pastrami',
		level: 1,
		packet: true,
		gist: 'Brined beef, crusted in pepper and coriander, smoked, then steamed',
		guest: "It's beef cured like corned beef, then crusted in cracked pepper and coriander, smoked and steamed until tender. Peppery, smoky and rich.",
		why: 'Brisket, or the fattier navel cut beside it, sits in brine for days, which seasons it through and keeps it rosy. Then a pepper and coriander rub, smoke, and a long steam that melts the tough tissue. Think corned beef with a crust and a smoky edge.',
		madeWith: ['beef', 'salt', 'black pepper', 'coriander', 'garlic', 'often sugar', 'often mustard seed'],
		note: 'Fully cooked. The pink color comes from the cure, not from doneness, so there is no temperature to ask for.',
		notThis: 'Not corned beef, which shares the brine but is simmered, with no pepper crust and no smoke.',
		recipe: 'pastrami-on-rye',
		seeAlso: ['fd_0101', 'fd_0027', 'fd_0041'],
		confusedWith: ['fd_0085'],
		line: 'House pastrami, rye, whole grain mustard, pickles',
		traps: [
			{ says: 'Brined beef that is only smoked, then dried and sliced cold like a ham', why: 'Smoke is not the last step: it is steamed for hours until tender and usually served warm.' },
			{ says: 'Beef rubbed with pepper and oven roasted, with no brine and no smoke', why: 'That is roast beef. The days in brine and the smoke are what make it what it is.' }
		]
	},
	{
		id: 'fd_0073',
		term: 'Pâté',
		level: 2,
		say: 'pah-TAY',
		packet: true,
		gist: 'Ground meat, fat, often liver, baked, chilled, spread on toast',
		guest: "It's a French meat spread, usually pork and liver, baked and chilled. It can be silky or coarse, and it's rich, so a little on toast goes a long way.",
		why: 'Meat, fat and usually some liver are ground with salt, spice and often brandy, packed into a mold and baked gently in a water bath. Chilled, it sets firm enough to slice. Liver gives the deep mineral richness, and fat makes it spread.',
		madeWith: ['pork', 'liver', 'often egg', 'often cream', 'often bread', 'often brandy', 'sometimes pistachio'],
		note: 'Served cold. Liver versions are often left pink inside, so ask the kitchen how theirs is cooked.',
		notThis: 'Not rillettes, which are shredded, and not foie gras, fattened duck or goose liver. A terrine is the same family, named for its mold.',
		lexiconSlug: 'pate-and-terrine',
		seeAlso: ['fd_0062', 'fd_0279'],
		confusedWith: ['fd_0084', 'fd_0075', 'fd_0055'],
		line: 'Country pâté, cornichons, Dijon, grilled sourdough',
		traps: [
			{ says: 'Smooth paste of pure liver, always made with no other meat or fat', why: 'Liver is common but not required, and most are built on pork and fat with other meats.' }
		]
	},
	{
		id: 'fd_0074',
		term: 'Prosciutto',
		level: 1,
		say: 'proh-SHOO-toh',
		aliases: ['Prosciutto Crudo', 'Prosciutto di Parma', 'Parma Ham', 'San Daniele'],
		packet: true,
		gist: 'Italian pork leg, salted, air-dried a year or more, shaved thin',
		guest: "It's Italian ham, salted and air-dried for a year or more, never cooked or smoked. Sliced paper-thin, it's silky, a little sweet, and melts on your tongue.",
		why: "A whole hind leg is rubbed with sea salt, then hung in moving air for a year or longer. It slowly loses water while the meat's own enzymes build sweet, nutty flavor. Cut thin, the fat melts on contact. It is sweeter and softer than Spanish ham.",
		madeWith: ['pork', 'sea salt'],
		note: 'Served raw, as cured. Heat turns it salty and tough, so it goes on hot dishes last.',
		pairs: 'Melon, figs, burrata, arugula, breadsticks',
		notThis: "Not speck, the same leg lightly smoked, not pancetta, cured belly for cooking, and not jamón ibérico, Spain's longer-aged ham.",
		lexiconSlug: 'prosciutto-di-parma-and-san-daniele',
		seeAlso: ['fd_0067', 'fd_0030'],
		confusedWith: ['fd_0076', 'fd_0071', 'fd_0082'],
		line: 'Prosciutto di Parma, compressed melon, basil',
		traps: [
			{ says: 'Italian pork leg, smoked over beechwood and cooked before slicing', why: 'The crudo style taught here is never smoked or cooked: salt, air and time do the work.' }
		]
	},
	{
		id: 'fd_0075',
		term: 'Rillettes',
		level: 2,
		say: 'ree-YET',
		packet: true,
		gist: 'Meat cooked slowly in its own fat, then shredded into a rich spread',
		guest: "Think pulled pork, but French and spreadable. The meat cooks for hours in its own fat until it falls apart, then it's packed in a jar and served with toast.",
		why: 'Pork, duck or rabbit is salted and simmered very gently in fat until it collapses, then shredded, stirred with some of that fat and sealed in a jar under a fat cap. It is soft and stringy, not smooth, and it tastes milder than liver-rich pâté.',
		madeWith: ['pork', 'pork fat', 'sometimes duck', 'sometimes rabbit', 'sometimes salmon', 'often white wine', 'often garlic'],
		note: 'Served cool, not fridge-cold, so the fat softens and spreads. The pale layer of fat on top is normal.',
		notThis: 'Not pâté, which is ground and baked, usually with liver. Not confit, which is served whole, not shredded.',
		recipe: 'pork-rillettes',
		seeAlso: ['fd_0047', 'fd_0279'],
		confusedWith: ['fd_0073', 'fd_0029'],
		line: 'Pork rillettes, grilled bread, cornichons, mustard'
	},
	{
		id: 'fd_0076',
		term: 'Speck',
		level: 3,
		say: 'spek',
		aliases: ['Speck Alto Adige'],
		packet: true,
		gist: 'Boned pork leg cured with juniper, lightly cold smoked, then aged',
		guest: "It's a smoked cousin of prosciutto from the Italian Alps, cured with juniper and mountain herbs. It's a bit firmer, with a gentle smoky finish.",
		why: 'Alto Adige sits on the Austrian border, and its ham borrows from both sides: dry cured like prosciutto, then cold smoked over beechwood. The leg is rubbed with salt, juniper, bay and pepper and aged about five months. Boned, flat and smoked, it eats firmer than prosciutto.',
		madeWith: ['pork', 'salt', 'juniper', 'black pepper', 'bay leaf', 'often rosemary'],
		note: 'Served raw, as cured. Cold smoke flavors it but does not cook it.',
		pairs: 'Rye bread, pickles, horseradish, apples, mountain cheeses',
		notThis: 'Not prosciutto, which is never smoked. In German the word just means bacon, so on an Austrian menu it may be bacon.',
		lexiconSlug: 'speck-alto-adige',
		seeAlso: ['fd_0041', 'fd_0030'],
		confusedWith: ['fd_0074', 'fd_0083'],
		line: 'Speck, shaved apple, horseradish cream, rye crisps',
		traps: [
			{ says: 'Smoked Alpine pork leg, fully cooked and carved thick like deli ham', why: 'It is never cooked: it is cured, cold smoked and aged, then sliced thin and eaten as it is.' }
		]
	},
	{
		id: 'fd_0077',
		term: 'Tasso',
		level: 3,
		say: 'TAH-soh',
		aliases: ['Tasso Ham'],
		packet: true,
		gist: 'Cajun pork shoulder, cured, crusted in cayenne and garlic, smoked',
		guest: "It's Cajun smoked pork, rubbed with cayenne and garlic. Spicy, salty and very smoky, so the kitchen dices it small to season a dish, the way you'd use bacon.",
		why: 'Called a ham, but it is not leg meat. Pork shoulder is cut into slabs, briefly cured, packed in a cayenne, garlic and paprika rub and hot smoked until cooked through. Too intense to eat by the slice, it goes into gumbo, jambalaya, beans, grits and cream sauces.',
		madeWith: ['pork', 'salt', 'cayenne', 'garlic', 'paprika', 'black pepper', 'often sugar'],
		origin: 'South Louisiana, the name likely from Spanish tasajo, dried meat',
		notThis: 'Not andouille, its smokehouse partner, which is a sausage in a casing. This is a solid piece of shoulder.',
		lexiconSlug: 'tasso-and-cajun-andouille',
		seeAlso: ['fd_0178', 'fd_0041', 'fd_0091'],
		confusedWith: ['fd_0064'],
		line: 'Shrimp and grits, tasso ham gravy, scallions',
		traps: [
			{ says: 'Mild, sweet ham from the pork hind leg, carved thick as a main course', why: 'It is spicy shoulder, not leg, and it seasons a dish in small dice instead of being carved.' }
		]
	},
	{
		id: 'fd_0078',
		term: 'Charcuterie',
		level: 1,
		say: 'shar-KOO-tuh-ree',
		gist: 'French craft of salting, smoking and preserving meat, mostly pork',
		guest: "It's the French word for cured and prepared meats, like ham, salami and pâté. A board is a selection made for sharing, with pickles, mustard and bread.",
		why: "The word comes from the French for cooked flesh and named the pork butcher's shop. Before refrigeration, salting, drying, smoking and cooking in fat were how meat lasted the winter. A good board contrasts textures: a silky ham, a firm salami, something spreadable.",
		madeWith: ['pork', 'often beef', 'often liver', 'sometimes egg', 'sometimes milk', 'often wine', 'sometimes pistachio'],
		note: 'Dry-cured ham, salami and bresaola are served raw, as cured.',
		notThis: 'Not a cheese board. Italy calls the same craft salumi, and salami is only one kind of it.',
		lexiconSlug: 'building-the-charcuterie-board',
		seeAlso: ['fd_0287', 'fd_0030', 'fd_0084'],
		line: 'Charcuterie board, house pickles, mustard, grilled bread',
		traps: [
			{ says: 'Any shared board of cheese, fruit, nuts and crackers, with or without meat', why: 'The word means prepared meats. A board with no cured meat is a cheese or snack board.' }
		]
	},
	{
		id: 'fd_0079',
		term: 'Bresaola',
		level: 3,
		say: 'breh-ZOW-lah',
		gist: 'Lean beef round, salted with wine and spice, air-dried deep red',
		guest: "It's very lean air-dried beef from the Italian Alps. Deep red, tender and a little sweet, usually dressed with olive oil and lemon.",
		why: 'A single muscle from the beef round is trimmed of all fat, salted with wine, pepper, juniper and garlic, then hung to dry for a month or two in the Valtellina valley of Lombardy. With almost no fat it eats dense and clean, like a beefy prosciutto.',
		madeWith: ['beef', 'salt', 'often red wine', 'black pepper', 'juniper', 'garlic'],
		note: 'Served raw, sliced very thin. Once cut it dries and darkens quickly, so it is sliced to order.',
		notThis: 'Not carpaccio, which is fresh raw beef. This is cured and dried for weeks, so it is firmer and saltier.',
		lexiconSlug: 'bresaola-della-valtellina',
		recipe: 'bresaola',
		seeAlso: ['fd_0074', 'fd_0159', 'fd_0030'],
		confusedWith: ['fd_0216'],
		line: 'Bresaola, arugula, lemon, shaved Parmesan',
		traps: [
			{ says: 'Lean pork loin from the Italian Alps, salt-cured and air-dried firm', why: 'It is beef, which is why it is the lean, dark red meat on a board that is mostly pork.' }
		]
	},
	{
		id: 'fd_0080',
		term: 'Soppressata',
		level: 2,
		say: 'soh-preh-SAH-tah',
		aliases: ['Sopressata'],
		gist: 'Coarse-cut pressed dry salami of southern Italy, often hot with chili',
		guest: "It's a rustic dry salami from southern Italy, chopped coarse so you get real pieces of pork in every slice. Meatier and bolder than everyday salami.",
		why: 'Lean pork and firm fat are chopped, not finely ground, seasoned with salt, pepper and often Calabrian chili, and cased. Pressed under weights for the first days, then hung to dry for weeks, it eats dense, chewy and tangy, like a rougher Genoa salami.',
		madeWith: ['pork', 'pork fat', 'salt', 'black pepper', 'often chili', 'sometimes garlic', 'sometimes red wine'],
		note: 'Dry-cured, never cooked. Sold hot or sweet: sweet means mild, not sugary. Know which is on the board.',
		origin: 'Calabria and Basilicata, Italy; from soppressare, to press down',
		lexiconSlug: 'soppressata',
		seeAlso: ['fd_0066', 'fd_0065', 'fd_0078'],
		line: 'Hot soppressata, aged provolone, marinated olives',
		traps: []
	},
	{
		id: 'fd_0081',
		term: "'Nduja",
		level: 2,
		say: 'en-DOO-yah',
		gist: 'Soft, fiery Calabrian pork salami that spreads like butter',
		guest: "It's a spicy, spreadable salami from Calabria in southern Italy. Think of a soft, smoky chili and pork spread that melts into warm bread.",
		why: 'Fatty pork is ground very fine with a huge share of Calabrian chili, as much as a third by weight, then stuffed in a casing, lightly smoked and fermented. So much fat and chili keeps it from ever firming up, so it stays a brick-red paste: rich, tangy, smoky and hot.',
		madeWith: ['pork', 'pork fat', 'calabrian chili', 'salt'],
		note: 'Cured and fermented, never cooked. Often served as it is, spread on bread.',
		origin: 'Spilinga, Calabria; the name likely comes from the French andouille',
		pairs: 'Grilled bread, pizza, pasta sauces, eggs, burrata, honey',
		lexiconSlug: 'nduja',
		seeAlso: ['fd_0080', 'fd_0064', 'fd_0065'],
		line: "Grilled sourdough, 'nduja, burrata, honey",
		traps: [
			{ says: 'Calabrian chili paste made with olive oil, with no meat in it at all', why: 'It is a cured pork salami first. The chili is a seasoning, and the softness comes from pork fat.' }
		]
	},
	{
		id: 'fd_0082',
		term: 'Jamón Ibérico',
		level: 3,
		say: 'hah-MOHN ee-BEH-ree-koh',
		aliases: ['Pata Negra', 'Ibérico Ham'],
		gist: "Long-aged dry ham from Spain's native black pigs, carved paper-thin",
		guest: "It's Spain's great cured ham, from black Iberian pigs and aged for years. It's nutty and a little sweet, and the fat melts on your tongue.",
		why: 'The Iberian pig stores fat inside the muscle, and the top grade, bellota, fattens on acorns in oak pasture. Legs are salted, then hung 2 to 4 years. That fat is soft enough to melt at room temperature, so slices turn glossy, nutty and deeper than prosciutto.',
		madeWith: ['pork', 'salt'],
		note: 'Served uncooked, at room temperature. White specks are crystals from long aging, not a flaw.',
		notThis: "Not prosciutto, which is Italian, from white pigs, and milder. Spain's everyday serrano also comes from white pigs.",
		lexiconSlug: 'jamon-iberico-and-the-bellota-grades',
		seeAlso: ['fd_0070', 'fd_0067'],
		confusedWith: ['fd_0074'],
		line: 'Hand-carved jamón ibérico de bellota, pan con tomate',
		traps: [
			{ says: 'Everyday Spanish ham from white pigs, dried in mountain air for a year', why: 'That describes serrano. This ham comes from Iberian-breed pigs and ages far longer.' },
			{ says: 'Spanish ham heavily smoked over oak, then cooked and sliced thick', why: 'It is never smoked or cooked, only salted and air-dried, and it is carved very thin.' }
		]
	},
	{
		id: 'fd_0083',
		term: 'Bacon',
		level: 1,
		aliases: ['Streaky Bacon', 'Slab Bacon'],
		gist: 'Pork belly cured with salt and sugar, smoked, then sliced to crisp',
		guest: "It's pork belly cured with salt and a little sugar, then smoked over wood. Cooked until the fat crisps, it's salty, smoky and a touch sweet.",
		why: 'Belly is layered fat and lean. About a week in salt, sugar and curing salt firms it and keeps the lean rosy, then hickory or applewood smoke adds the signature flavor. In the pan the fat renders out and the strips crisp. Lardons are short batons cut from the slab.',
		madeWith: ['pork', 'salt', 'sugar', 'sometimes celery powder', 'sometimes maple syrup', 'sometimes black pepper'],
		note: 'Bacon labeled uncured is still cured, with celery powder standing in for curing salt.',
		notThis: 'Not pancetta, the same belly cured but usually not smoked. Pork belly on a menu is the fresh cut, not cured.',
		seeAlso: ['fd_0068', 'fd_0041', 'fd_0030'],
		confusedWith: ['fd_0071', 'fd_0094'],
		line: 'Thick-cut applewood bacon, maple, black pepper',
		traps: []
	},
	{
		id: 'fd_0084',
		term: 'Terrine',
		level: 2,
		say: 'teh-REEN',
		gist: 'Loaf of seasoned chopped meats baked in a mold, chilled and sliced',
		guest: "It's a French country-style meat loaf, served cold in slices. Think of a coarse, rich pâté you eat with a fork, with mustard and pickles.",
		why: 'Seasoned chopped pork, liver and fat, often with brandy, are packed into a deep rectangular mold, also called a terrine, and baked gently in a water bath. Pressed and chilled overnight, it slices clean, showing a mosaic of meat, fat and garnish.',
		madeWith: ['traditionally pork', 'often brandy', 'often egg', 'sometimes bread', 'sometimes cream', 'sometimes pistachios', 'sometimes gelatin'],
		note: 'Not every terrine is pork. Vegetables, fish or foie gras are layered the same way.',
		notThis: 'Not quite pâté, which names the mixture and is often smooth and spreadable. A terrine is named for its mold and served sliced.',
		lexiconSlug: 'pate-and-terrine',
		recipe: 'terrine-de-campagne',
		seeAlso: ['fd_0279', 'fd_0287', 'fd_0055'],
		confusedWith: ['fd_0073'],
		line: 'Country pork terrine, cornichons, grain mustard, toast',
		traps: [
			{ says: 'Deep lidded bowl for serving soup, and the hot soup ladled out of it', why: 'That is a tureen. This is a cold, sliced loaf named for the mold it is baked in.' }
		]
	},
	{
		id: 'fd_0085',
		term: 'Corned Beef',
		level: 1,
		aliases: ['Salt Beef'],
		gist: 'Brisket cured in spiced salt brine, then simmered until fork-tender',
		guest: "It's beef brisket cured for days in a salty, spiced brine, then simmered until it's tender. It's pink, salty and gently spiced, the heart of a Reuben.",
		why: 'Brisket sits 5 to 10 days in a brine of salt, sugar, curing salt and pickling spices such as bay, mustard seed and coriander. The cure keeps it pink, and long simmering softens the tough cut. Corn is an old word for coarse grains of salt.',
		madeWith: ['beef', 'salt', 'sugar', 'mustard seed', 'coriander', 'bay leaf', 'often garlic'],
		note: 'Pink here comes from the curing salt and does not mean undercooked.',
		notThis: 'Not pastrami, which starts with the same kind of cure but is then rubbed in pepper and coriander and smoked.',
		seeAlso: ['fd_0101', 'fd_0027', 'fd_0040'],
		confusedWith: ['fd_0072'],
		line: 'House corned beef Reuben, sauerkraut, Swiss, rye',
		traps: [
			{ says: 'Brisket slow-cooked with sweet corn kernels, an Irish American classic', why: 'Corn here is an old word for the coarse grains of salt used in the cure, not the vegetable.' }
		]
	}
];

export default cards;
