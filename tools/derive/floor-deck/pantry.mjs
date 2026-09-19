/* The Floor Deck, section "pantry". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0266',
		term: 'Balsamic',
		level: 1,
		packet: true,
		gist: 'Sweet-sharp Italian vinegar of cooked grape must, aged in wood',
		guest: "It's the dark, sweet-tart vinegar from Modena in northern Italy. The aged kind is thick enough to drizzle, and a few drops wake up cheese, strawberries or steak.",
		why: 'Grape must, the fresh-pressed juice, is cooked down, soured and aged. The traditional kind spends 12 years or more moving through barrels of different woods and turns syrupy and complex. Everyday bottles blend wine vinegar with cooked must, so they run thinner and sharper.',
		madeWith: ['cooked grape must', 'often wine vinegar', 'sometimes caramel color'],
		origin: 'Modena and Reggio Emilia, Italy, from balsamico, meaning balm-like',
		notThis: 'Not saba, the same cooked must left unsoured. Saba is a sweet syrup with no vinegar bite.',
		seeAlso: ['fd_0272', 'fd_0200'],
		confusedWith: ['fd_0268'],
		line: 'Burrata, heirloom tomato, 12-year balsamic',
		traps: [
			{ says: 'Red wine vinegar cooked down with sugar until thick and sweet', why: 'It is built on cooked grape must, and the aged kind thickens in barrels, not with sugar.' }
		]
	},
	{
		id: 'fd_0267',
		term: 'Banyuls',
		level: 4,
		say: 'bahn-YOOLZ',
		packet: true,
		gist: "Sweet fortified Grenache from France's far south, or its vinegar",
		guest: 'Banyuls is a sweet red wine from the south of France, by the Spanish border. On a menu it is usually the vinegar made from it, rounder and a little sweeter than red wine vinegar.',
		why: 'Grenache is fermented partway, then grape spirit is added to stop it, keeping natural sugar and adding strength, much as with port. Aged in oak into vinegar, it keeps a nutty, raisin sweetness that softens a dressing and flatters duck or foie gras.',
		madeWith: ['grenache grapes', 'grape spirit'],
		origin: 'Banyuls-sur-Mer, a Roussillon fishing port by the Spanish border',
		pairs: 'Foie gras, duck, beets, bitter greens, chocolate desserts',
		seeAlso: ['fd_0272', 'fd_0200', 'fd_0055'],
		line: 'Duck breast, roasted beets, Banyuls vinaigrette',
		traps: [
			{ says: 'Sweet fortified wine from the vineyards of eastern France', why: 'It comes from the far south, on the Mediterranean beside the Spanish border.' }
		]
	},
	{
		id: 'fd_0268',
		term: 'Saba',
		level: 4,
		say: 'SAH-bah',
		aliases: ['Sapa', 'Mosto Cotto'],
		packet: true,
		gist: 'Thick, sweet syrup of grape must cooked down, never soured',
		guest: 'Saba is grape juice cooked down slowly into a dark, sweet syrup, an old Italian farmhouse treat. It tastes of rich, jammy raisins, lovely over cheese or ice cream.',
		why: 'Freshly pressed grape juice, the must, is simmered for many hours until it shrinks to a fraction of its volume. Nothing ferments, so it has sweetness and gentle fruit acid with no vinegar edge. Think of balsamic with the bite taken out.',
		madeWith: ['grape must'],
		origin: 'Emilia-Romagna, Marche and Sardinia, from the Latin sapa, cooked must',
		notThis: 'Not the Japanese saba on a sushi menu, which is mackerel. And not balsamic, which is soured and aged.',
		seeAlso: ['fd_0273', 'fd_0202'],
		confusedWith: ['fd_0266'],
		line: 'Ricotta, roasted figs, saba, toasted hazelnut',
		traps: [
			{ says: 'Aged grape vinegar thickened and sweetened for drizzling', why: 'It is never soured into vinegar. It is sweet grape must, simply cooked down.' }
		]
	},
	{
		id: 'fd_0269',
		term: 'Kimchi',
		level: 1,
		say: 'KIM-chee',
		packet: true,
		gist: 'Korean salted cabbage, fermented with chili, garlic and ginger',
		guest: "Kimchi is Korea's signature side, napa cabbage fermented with chili, garlic and ginger. It is spicy, sour and a little funky, and it wakes up anything rich.",
		why: 'Salt pulls water from the cabbage, then a paste of chili flakes, garlic, ginger and often salted seafood is rubbed in. Lactic bacteria turn its sugars into acid over days or weeks, so it grows sourer and fizzier with age. Unlike a vinegar pickle, the sour is grown, not poured.',
		madeWith: ['napa cabbage', 'chili flakes', 'garlic', 'ginger', 'sometimes rice or wheat flour', 'often fish sauce', 'often salted shrimp'],
		origin: 'Korea, where hundreds of kinds are made, cabbage the best known',
		pairs: 'Pork belly, fried rice, rice bowls, grilled meats, eggs',
		lexiconSlug: 'kimchi',
		recipe: 'baechu-kimchi',
		seeAlso: ['fd_0046', 'fd_0033', 'fd_0281'],
		line: 'Crispy pork belly, kimchi, steamed bun',
		traps: [
			{ says: 'Korean cabbage quick-pickled in vinegar and sugar, served cold', why: 'No vinegar goes in. Its sour comes from days of fermentation by lactic bacteria.' }
		]
	},
	{
		id: 'fd_0270',
		term: 'Compote',
		level: 1,
		say: 'KAHM-poht',
		packet: true,
		gist: 'Fruit gently stewed in light syrup, loose and spoonable, never set',
		guest: "It's fruit simmered gently in a light syrup until juicy, with the fruit still in soft pieces. Think of the best part of a fruit pie, served warm or cool.",
		why: 'Fruit is poached in sugar syrup, sometimes with wine, citrus or spice, and pulled before it fully breaks down. Less sugar and shorter cooking than jam means it never sets, so it stays loose and spoonable and tastes of fresh fruit rather than candy.',
		madeWith: ['fruit', 'sugar', 'sometimes wine', 'sometimes spices'],
		origin: 'French, from the Latin composita, something put together',
		notThis: 'Not jam, which is cooked until it sets and spreads, and not coulis, a smooth strained sauce. Compote is loose, with soft pieces.',
		seeAlso: ['fd_0271', 'fd_0274'],
		confusedWith: ['fd_0276', 'fd_0203'],
		line: 'Vanilla panna cotta, rhubarb compote, pistachio'
	},
	{
		id: 'fd_0271',
		term: 'Marmalade',
		level: 1,
		packet: true,
		gist: 'Citrus preserve, classically bitter orange, with shreds of peel',
		guest: 'Marmalade is a citrus jam made with the peel, classically from bitter Seville oranges. It is sweet and tangy with a pleasant bitter edge.',
		why: 'Whole citrus is simmered so the peel softens, then boiled with sugar. The pith and seeds hold plenty of pectin, so it sets without help, and the peel adds a bitter edge that balances the sugar. Seville oranges are too sour to eat raw, which is why they suit it.',
		madeWith: ['citrus peel', 'citrus juice', 'sugar', 'classically seville orange'],
		origin: 'Portuguese marmelo, quince, first cooked into marmelada',
		notThis: 'Not jam made from any fruit. Marmalade is citrus cooked with its peel, and it should taste a little bitter.',
		seeAlso: ['fd_0270', 'fd_0277'],
		confusedWith: ['fd_0276'],
		line: 'Roast duck, Seville orange marmalade, turnips',
		traps: [
			{ says: 'Smooth orange jelly made from juice alone, strained of peel', why: 'The peel is the point: shreds of it run through the preserve and give its bitter edge.' }
		]
	},
	{
		id: 'fd_0272',
		term: 'Sherry Vinegar',
		level: 2,
		aliases: ['Vinagre de Jerez'],
		gist: 'Nutty, sharp Spanish wine acid aged in an oak solera in Jerez',
		guest: "It's a Spanish vinegar made from sherry and aged in oak barrels, often for years. It is sharp but round and nutty, and it makes a dressing or a sauce taste deeper.",
		why: 'Sherry wine is soured by acetic bacteria, then aged in a solera, stacked oak casks where young vinegar is blended into older. Six months makes the basic grade, two years Reserva, ten Gran Reserva. The wood brings a nutty, toasty depth plain red wine vinegar lacks.',
		madeWith: ['sherry wine'],
		origin: 'The Jerez triangle of Andalusia, Spain, a protected name',
		pairs: 'Gazpacho, bitter greens, mushrooms, pan sauces, roast vegetables',
		seeAlso: ['fd_0267', 'fd_0266', 'fd_0200'],
		line: 'Little gem, shallot, aged sherry vinegar, pecorino',
		traps: [
			{ says: 'Salted Spanish cooking wine used to deglaze a pan sauce', why: 'It is a true vinegar, soured and then aged in oak, not a salted wine for cooking.' }
		]
	},
	{
		id: 'fd_0273',
		term: 'Verjus',
		level: 4,
		say: 'vair-ZHOO',
		aliases: ['Verjuice'],
		gist: 'Tart pressed juice of unripe green grapes, milder than vinegar',
		guest: 'Verjus is the juice of sour green grapes, picked before they ripen. It gives the bright tartness of lemon or vinegar but gentler, so it plays well with wine.',
		why: "Grapes thinned from the vine in midsummer are pressed and the juice bottled unfermented. Its acid is mostly tartaric and malic, like wine's, with little sugar, so it lifts a sauce without the harsh vinegar bite that clashes with a glass of wine.",
		madeWith: ['unripe grapes'],
		origin: 'French vert jus, green juice, a medieval kitchen staple',
		pairs: 'Foie gras, delicate fish, salads served with wine, spritzes',
		recipe: 'foie-gras-de-canard-poele-au-verjus',
		seeAlso: ['fd_0268', 'fd_0200', 'fd_0055'],
		line: 'Seared foie gras, grapes, verjus, brioche',
		traps: [
			{ says: 'Young white wine left to sour into a light, pale vinegar', why: 'It is never fermented. It is fresh juice from unripe grapes, bottled as it is.' }
		]
	},
	{
		id: 'fd_0274',
		term: 'Mostarda',
		level: 3,
		say: 'moh-STAR-dah',
		gist: 'Italian candied fruit in syrup sharpened with a hot bite of mustard',
		guest: "It's Italian candied fruit in a sweet syrup with a hidden kick of mustard. It cuts through rich meats and cheese the way cranberry sauce does for turkey.",
		why: 'Fruit such as quince, pear, cherry or apple is candied slowly in sugar syrup, then spiked with mustard essence. It tastes sweet first, then hot in the nose like wasabi, and that sweet heat is built to cut boiled meats and aged cheese.',
		madeWith: ['fruit', 'sugar', 'mustard', 'sometimes grape must'],
		origin: 'Northern Italy, Cremona and Mantua, from mosto, the Italian for grape must',
		pairs: 'Bollito misto, cotechino, aged cheese, charcuterie boards',
		notThis: 'Not mustard the condiment. It is fruit first, with mustard only as the heat running through the syrup.',
		seeAlso: ['fd_0215', 'fd_0078'],
		confusedWith: ['fd_0275'],
		line: 'Cheese board, honeycomb, pear mostarda, grilled bread',
		traps: [
			{ says: 'Sweet yellow mustard whisked with honey and served as a dipping sauce', why: 'It is candied fruit in syrup, with mustard only as a hidden heat.' }
		]
	},
	{
		id: 'fd_0275',
		term: 'Chutney',
		level: 2,
		gist: 'Spiced relish of fruit or herbs, cooked sweet-sour or ground fresh',
		guest: "It's a spiced relish, often fruit like mango cooked down with vinegar, sugar and spices. Sweet, tangy and a little warm, it wakes up rich or fried food.",
		why: 'In India the word covers fresh relishes of mint, cilantro, coconut or tamarind made that day. The jarred style Britain made famous cooks fruit slowly with vinegar, sugar and spices until thick, so it keeps and tastes sweet, sour and warm at once.',
		madeWith: ['fruit', 'vinegar', 'sugar', 'spices', 'sometimes coconut', 'sometimes peanut', 'sometimes mustard seed'],
		origin: 'India, from the Hindi chatni',
		pairs: 'Samosas, curries, cheddar, pork, cheese and charcuterie boards',
		notThis: 'Not a jam: vinegar and spice make it savory. Chow-chow is a chopped vegetable pickle, and mostarda is fruit with mustard heat.',
		seeAlso: ['fd_0215'],
		confusedWith: ['fd_0276', 'fd_0274'],
		line: 'Pork chop, apple chutney, braised greens',
		traps: [
			{ says: 'Thick curry gravy of slow-cooked meat, spooned over steamed rice', why: 'It is a relish served on the side, not a curry or a gravy.' }
		]
	},
	{
		id: 'fd_0276',
		term: 'Jam',
		level: 1,
		gist: 'Fruit boiled with sugar until it sets into a soft, spreadable gel',
		guest: "It's fruit cooked down with sugar until it thickens into a soft spread. Sweet and bright, it's lovely on warm bread or next to cheese.",
		why: "Crushed or chopped fruit is boiled with sugar, and the fruit's own pectin, helped by acid, links into a loose gel as water cooks off. Jelly uses only the strained juice. Savory versions, like bacon or onion jam, borrow the name for anything cooked down sticky.",
		madeWith: ['fruit', 'sugar', 'often lemon juice', 'sometimes pectin'],
		pairs: 'Scones and clotted cream, toast, cheese boards, peanut butter',
		notThis: 'Not compote, which is looser with whole pieces of fruit, and not marmalade, which is citrus with the peel cut through it.',
		recipe: 'scones-with-jam-and-clotted-cream',
		confusedWith: ['fd_0270', 'fd_0271'],
		line: 'Warm scones, clotted cream, strawberry jam',
		traps: [
			{ says: 'Clear fruit juice set firm with gelatin, then cut into little cubes', why: 'It is cooked whole or crushed fruit set by its own pectin, not juice and gelatin.' }
		]
	},
	{
		id: 'fd_0277',
		term: 'Preserved Lemon',
		level: 2,
		gist: 'Citrus cured for weeks in salt until its rind turns soft and silky',
		guest: "They're lemons cured in salt for weeks until the peel goes soft. You get a deep, salty, almost floral lemon flavor without the sharp sourness.",
		why: 'Quartered lemons are packed in salt and their own juice. Over about a month the salt draws out water, and the peel softens and loses its bitterness, turning mellow and perfumed. Cooks usually rinse it and chop the rind into tagines, salads and sauces.',
		madeWith: ['lemon', 'salt', 'sometimes spices'],
		origin: 'Morocco and North Africa, a staple of the tagine',
		pairs: 'Chicken tagine, green olives, lamb, roast fish, grain salads',
		lexiconSlug: 'preserved-lemon',
		recipe: 'chicken-tagine-preserved-lemon-and-olives',
		seeAlso: ['fd_0187', 'fd_0035', 'fd_0030'],
		line: 'Chicken tagine, preserved lemon, green olives, couscous',
		traps: [
			{ says: 'Citrus peel simmered in sugar syrup, then rolled in sugar and dried', why: 'It is cured in salt, not sugar, and tastes salty and savory, not candied.' }
		]
	},
	{
		id: 'fd_0278',
		term: 'Capers',
		level: 1,
		gist: 'Tiny flower buds from a Mediterranean shrub, cured sharp and briny',
		guest: "They're little flower buds, pickled or packed in salt, that pop with a salty, tangy bite. A few of them brighten rich fish or a butter sauce.",
		why: 'The buds are hand-picked before they open, then cured in salt or a vinegar brine. Raw they are bitter, and curing brings out a sharp, faintly mustardy flavor. The smallest, nonpareils, are prized. Caperberries are the larger fruit that forms if a bud is left to flower.',
		madeWith: ['caper', 'salt', 'often vinegar'],
		pairs: 'Smoked salmon, tartare, piccata, skate with brown butter',
		lexiconSlug: 'caper',
		seeAlso: ['fd_0110', 'fd_0217', 'fd_0232'],
		line: 'Veal piccata, lemon, capers, white wine butter',
		traps: [
			{ says: 'Small green peppercorns pickled in brine to add a mild, fruity heat', why: 'They are flower buds of a shrub, not peppercorns, and bring salt and tang, not heat.' }
		]
	},
	{
		id: 'fd_0279',
		term: 'Cornichon',
		level: 2,
		say: 'KOR-nee-shahn',
		gist: 'Finger-length cucumber picked young and pickled sour with tarragon',
		guest: "It's a tiny French pickle, crunchy and sharply sour rather than sweet. It's there to cut through the richness of pâté, cheese or cured meats.",
		why: 'Small cucumber varieties are picked when only a few inches long, then pickled in vinegar, often with tarragon, pearl onion and mustard seed. Picking them young keeps them crisp with few seeds. Think of a dill pickle, smaller, crunchier and more tart.',
		madeWith: ['cucumber', 'vinegar', 'salt', 'often tarragon', 'sometimes onion', 'sometimes mustard seed'],
		origin: 'France, the French name for a small pickled gherkin',
		pairs: 'Pâté, rillettes, terrine, raclette, charcuterie boards',
		seeAlso: ['fd_0073', 'fd_0078', 'fd_0033'],
		line: 'Country pâté, cornichons, grain mustard, toast',
		traps: [
			{ says: 'Sweet pickle sliced into thin coins with onion, made for sandwiches', why: 'It is a whole, tiny, sour pickle, not a sweet sliced one.' }
		]
	},
	{
		id: 'fd_0280',
		term: 'Miso',
		level: 2,
		say: 'MEE-soh',
		gist: 'Salty Japanese paste of soybeans fermented with a grain mold',
		guest: "It's a Japanese paste of fermented soybeans, salty and deeply savory. Brushed on fish or stirred into soup, it adds a rich, rounded depth.",
		why: 'Cooked soybeans are mixed with salt and koji, rice or barley grown with a friendly mold, then aged for months or years. The enzymes turn protein into savory amino acids and starch into sugar. White is young and sweet, red is aged longer, darker and saltier.',
		madeWith: ['soybean', 'salt', 'often rice', 'sometimes barley'],
		origin: 'Japan, with roots in Chinese fermented bean pastes',
		pairs: 'Black cod, eggplant, butter, ramen, dashi broth',
		lexiconSlug: 'miso',
		recipe: 'miso-glazed-black-cod',
		seeAlso: ['fd_0046', 'fd_0281'],
		line: 'Miso-glazed black cod, pickled ginger, rice',
		traps: [
			{ says: 'Clear Japanese broth steeped from kelp and dried bonito flakes', why: 'That is dashi, the broth it is stirred into, not the paste itself.' }
		]
	},
	{
		id: 'fd_0281',
		term: 'Fish Sauce',
		level: 2,
		aliases: ['Nam Pla', 'Nuoc Mam'],
		gist: 'Amber liquid drained from anchovies salted and aged for months',
		guest: "It's the salty backbone of Thai and Vietnamese cooking, made from fermented anchovies. In the dish it just tastes deep and savory, not fishy.",
		why: 'Anchovies are layered with salt in barrels for months, the best for a year or more. Their own enzymes break the flesh down into a clear amber liquid dense with savory amino acids. It smells strong in the bottle but melts into a dish as salt with depth, like anchovy in Caesar dressing.',
		madeWith: ['anchovy', 'salt', 'sometimes sugar'],
		origin: 'Southeast Asia, nam pla in Thailand, nuoc mam in Vietnam',
		pairs: 'Lime, chili, palm sugar, herbs, green papaya, grilled pork',
		lexiconSlug: 'fish-sauce',
		seeAlso: ['fd_0280', 'fd_0046'],
		line: 'Crispy Brussels sprouts, fish sauce caramel, mint',
		traps: [
			{ says: 'Dark liquid brewed from soybeans and wheat, used for dipping sushi', why: 'That is soy sauce. This is made from salted, fermented anchovies.' }
		]
	},
	{
		id: 'fd_0282',
		term: 'Harissa',
		level: 2,
		say: 'huh-REE-suh',
		gist: 'Tunisian red paste of dried chilies, garlic and toasted spices',
		guest: 'Harissa is a Tunisian chili paste with garlic and warm spices like caraway and coriander. It brings real heat, but it tastes deeper and earthier than a hot sauce.',
		why: 'Dried red chilies are soaked, then pounded with garlic, salt, toasted caraway and coriander, often cumin, and packed under olive oil. Dried chilies give a deep, raisiny warmth rather than a fresh bite, and the spices make it earthier than sriracha or other hot sauces.',
		madeWith: ['dried red chili', 'garlic', 'olive oil', 'caraway', 'coriander seed', 'often cumin'],
		origin: 'Tunisia and the wider Maghreb, from the Arabic for to pound',
		pairs: 'Couscous, merguez, grilled lamb, roast carrots, eggs, yogurt',
		lexiconSlug: 'harissa',
		recipe: 'harissa',
		seeAlso: ['fd_0187'],
		line: 'Roast carrots, harissa yogurt, mint, flatbread',
		traps: [
			{ says: 'Fermented chili and soybean paste, sweet and sticky, from Korea', why: 'That is gochujang. This is unfermented, just dried chilies pounded with garlic and spices.' }
		]
	},
	{
		id: 'fd_0283',
		term: 'Pimentón',
		level: 2,
		say: 'pee-men-TOHN',
		aliases: ['Spanish Paprika'],
		gist: 'Spanish ground red pepper, often smoked over oak, sweet to hot',
		guest: "It's Spanish paprika, and the famous kind is dried over oak smoke. It adds a deep red color and a gentle campfire flavor, sweet or with a little heat.",
		why: 'Red peppers are dried, then ground. In the La Vera valley the harvest is dried for about two weeks over smoldering oak, which is why it tastes smoky. It comes sweet, bittersweet or hot, and it is the flavor and color of Spanish chorizo, patatas bravas and Galician octopus.',
		madeWith: ['dried red pepper'],
		origin: 'Spain, above all the La Vera valley in Extremadura, and Murcia',
		pairs: 'Octopus, potatoes, chorizo, eggs, chickpeas, paella',
		notThis: 'Not ordinary grocery paprika, which is usually unsmoked and flatter in flavor. Ask whether the kitchen uses sweet or hot.',
		lexiconSlug: 'paprika-and-pimenton',
		seeAlso: ['fd_0065', 'fd_0041'],
		line: 'Grilled octopus, olive oil potatoes, smoked pimentón',
		traps: [
			{ says: 'Always fiery hot ground chili, a Spanish version of cayenne', why: 'Most of it is sweet or bittersweet. Only the hot style carries real heat.' }
		]
	},
	{
		id: 'fd_0284',
		term: 'Finishing Salt',
		level: 2,
		gist: 'Crunchy crystals sprinkled over a dish just before it goes out',
		guest: "It's a coarse or flaky salt sprinkled on right before the plate comes out. You get little crunchy bursts of seasoning instead of salt melted into the food.",
		why: 'Salt added during cooking dissolves and disappears. Crystals added at the last second stay whole, so they crunch and land on the tongue in bright bursts. Common ones are English flaky salt like Maldon and French fleur de sel, raked by hand from the top of salt ponds.',
		madeWith: ['salt'],
		note: 'It goes on last, after slicing. On a wet or saucy surface the flakes melt within minutes, so it is never added early.',
		pairs: 'Sliced steak, ripe tomatoes, caramel, chocolate, bread and butter',
		lexiconSlug: 'salt-types-and-when-each-wins',
		line: 'Dark chocolate tart, olive oil, finishing salt',
		traps: [
			{ says: 'Fine seasoning grain dissolved into a sauce at the end of cooking', why: 'It is coarse and goes on dry, on top, so it stays crunchy instead of dissolving.' }
		]
	}
];

export default cards;
