/**
 * Keywords added by the tagging pass of 31 Aug 2026.
 *
 * 246 of 1,510 recipes matched no technique at all. They were not bad
 * recipes: mujadara caramelises onions for twenty five minutes and Bananas
 * Foster builds a caramel, and the table simply did not know the words
 * those recipes use. Every keyword below is a phrase quoted from a recipe
 * that was invisible, attached to a technique the book already teaches.
 *
 * Each one was checked against the whole corpus rather than the batch it
 * came from: anything matching more than four percent of the book was
 * dropped as a common phrase, and anything that rescued nothing already
 * invisible was dropped as a future false positive with no present value.
 */
export const TAGGING_PASS = [
	{
		k: ['stew gently', 'the meat parts under a spoon', 'until the meat pulls away from the bone'],
		l: 'Braising',
		q: 'braising technique'
	},
	{
		k: ['cure skin down', 'hang the coils', 'no translucent line', 'scale the salt and sugar', 'the cure', 'undo the cure'],
		l: 'Brining & curing',
		q: 'brining & curing technique'
	},
	{
		k: ['into the cold coconut cream', 'oil a spoonful at a time', 'stream in the oil', 'the oil in a thread', 'trickle in the oil'],
		l: 'Building an emulsion',
		q: 'building an emulsion technique'
	},
	{
		k: ['directly over a gas flame'],
		l: 'Charring over open flame',
		q: 'charring over open flame technique'
	},
	{
		k: ['chill 3 h until firm', 'chill at least 30 min', 'chill until cold and firm', 'completely cold and firm', 'cool, then refrigerate overnight', 'cuts without sagging', 'firm under a fingertip', 'freeze hard', 'freeze them 15 min', 'set cold and firm'],
		l: 'Chilling to firm: the fridge as binder',
		q: 'chilling to firm the fridge as binder technique'
	},
	{
		k: ['steep the kombu'],
		l: 'Dashi',
		q: 'dashi technique'
	},
	{
		k: ['(350f) oil', 'a scrap of dough surfaces', 'deep frying', 'fry at 170', 'fry at 180', 'fry at 190c', 'fry in olive oil at', 'heat the oil to 170c', 'oil to 180c', 'oil to 190c', 'rolls over', 'the hissing dies down'],
		l: 'Deep frying',
		q: 'deep frying technique'
	},
	{
		k: ['browned fond', 'scrape up every brown bit', 'the sauce in the same pan'],
		l: 'Deglazing & pan sauces',
		q: 'deglazing & pan sauces technique'
	},
	{
		k: ['a rack rather than', 'drain and salt', 'drain standing on a rack', 'drain them standing on edge', 'drain, salt', 'onto a wire rack', 'upright to drain'],
		l: 'Draining fried food: a rack, never paper',
		q: 'draining fried food a rack, never paper technique'
	},
	{
		k: ['a dry heavy pan', 'dry toast the', 'in a dry pan', 'seeds, dry roasted'],
		l: 'Dry-pan toasting: spices, seeds and nuts',
		q: 'dry-pan toasting spices, seeds and nuts technique'
	},
	{
		k: ['glaze them and bake'],
		l: 'Egg wash & the baker’s shine',
		q: 'egg wash & the baker’s shine technique'
	},
	{
		k: ['sour clabber'],
		l: 'Fermentation',
		q: 'fermentation technique'
	},
	{
		k: ['lift the backbone out', 'lift two fillets'],
		l: 'Filleting fish',
		q: 'filleting fish technique'
	},
	{
		k: ['tilt to ignite'],
		l: 'Flambé',
		q: 'flambé technique'
	},
	{
		k: ['fold in the chocolate'],
		l: 'Folding: keeping the air in',
		q: 'folding keeping the air in technique'
	},
	{
		k: ['mound the flour', 'semola dusted board', 'semola rimacinata'],
		l: 'Fresh pasta',
		q: 'fresh pasta technique'
	},
	{
		k: ['fragrant and split', 'oil beads', 'the oil runs clear', 'the oil separates', 'until the oil separates', 'until the paste darkens'],
		l: 'Frying the paste until the oil splits',
		q: 'frying the paste until the oil splits technique'
	},
	{
		k: ['barbecue plate'],
		l: 'Griddle & plancha work',
		q: 'griddle & plancha work technique'
	},
	{
		k: ['hot grates'],
		l: 'Grilling over live coals',
		q: 'grilling over live coals technique'
	},
	{
		k: ['before the glaze skins over', 'icing bath'],
		l: 'Icing & frosting',
		q: 'icing & frosting technique'
	},
	{
		k: ['cool in the liquid overnight', 'noodle water', 'splash of pasta water', 'the reserved liquid', 'with its liquor'],
		l: 'Keeping the cooking liquid',
		q: 'keeping the cooking liquid technique'
	},
	{
		k: ['goes translucent before it tears', 'knead 10 minutes', 'knead 5 minutes', 'knead 6 minutes', 'knead it smooth', 'knead to a dough', 'smooth and elastic', 'to a firm dough'],
		l: 'Kneading dough',
		q: 'kneading dough technique'
	},
	{
		k: ['5 mm dice', 'even 5 mm dice', 'into a tight cigar', 'into the finest ribbons', 'knife, not machine', 'minced to 2 mm', 'to a coarse mince'],
		l: 'Knife cuts: dice, julienne, bias',
		q: 'knife cuts dice, julienne, bias technique'
	},
	{
		k: ['cold smoke below', 'pellicle'],
		l: 'Low & slow smoking',
		q: 'low & slow smoking technique'
	},
	{
		k: ['melt the butter, whisk in the flour', 'then the flour, and cook 2 min'],
		l: 'Making a roux',
		q: 'making a roux technique'
	},
	{
		k: ['lime-and-salted'],
		l: 'Marinating: acid, salt and time',
		q: 'marinating acid, salt and time technique'
	},
	{
		k: ['blend hot chickpeas', 'blend smooth', 'blend vegetables', 'in a mortar', 'pound the garlic', 'pound the peanuts', 'through a mouli'],
		l: 'Mashing & puréeing',
		q: 'mashing & puréeing technique'
	},
	{
		k: ['garlic and salt to a rough paste', 'pound or blitz the paste', 'pounded to a paste', 'stone mortar'],
		l: 'Pounding a curry paste',
		q: 'pounding a curry paste technique'
	},
	{
		k: ['leave it to double', 'prove 2 hours', 'springs back only halfway', 'until it has doubled'],
		l: 'Proofing: the rise before the oven',
		q: 'proofing the rise before the oven technique'
	},
	{
		k: ['a spoon dragged across the base', 'a spoon leaves a trail', 'leaves a track that closes', 'raise the heat and reduce', 'reduce the cooking liquid', 'reduce the tomatoes', 'reduce to a glossy', 'reduce until', 'reduced to a thick', 'runs thick off a spoon', 'slow-closing path', 'syrupy glaze', 'the milk has visibly thickened', 'thickened the gravy', 'until it reduces'],
		l: 'Reducing a sauce',
		q: 'reducing a sauce technique'
	},
	{
		k: ['render it', 'rendered oil'],
		l: 'Rendering fat: and cooking in what runs out',
		q: 'rendering fat and cooking in what runs out technique'
	},
	{
		k: ['cover and rest it 30 minutes', 'cover, and rest 30 minutes', 'let it relax', 'no dry flour remains', 'rest 30 minutes wrapped', 'rest it covered', 'rest it wrapped', 'so the gluten slackens', 'wrap airtight and rest', 'wrap and rest'],
		l: 'Resting dough: the pause that does the work',
		q: 'resting dough the pause that does the work technique'
	},
	{
		k: ['rest 30 min under foil'],
		l: 'Resting meat & slicing against the grain',
		q: 'resting meat & slicing against the grain technique'
	},
	{
		k: ['blast beef', 'directly on the oven rack', 'syrupy at the edges'],
		l: 'Roasting in a hot oven',
		q: 'roasting in a hot oven technique'
	},
	{
		k: ['like damp sand', 'looks like damp sand', 'rub everything into a dough'],
		l: 'Rubbing fat into flour',
		q: 'rubbing fat into flour technique'
	},
	{
		k: ['dropped into water rises', 'floats when dropped', 'salted at 10 g', 'salted at 10 g per litre'],
		l: 'Salted water & the float test',
		q: 'salted water & the float test technique'
	},
	{
		k: ['beads of moisture', 'beads of water stand', 'blot the beads of moisture', 'leave it to weep', 'salt pulls water out', 'salt the aubergine', 'salt them and let them sit', 'salted and squeezed', 'the salt and leave them in a colander', 'the water it gives up', 'toss the diced onion with the salt'],
		l: 'Salting to draw the water out',
		q: 'salting to draw the water out technique'
	},
	{
		k: ['1cm of hot oil', '45 seconds a side', 'butter-fry', 'crisp the pita in olive oil', 'fry as a thick patty', 'fry in clarified butter', 'fry the aubergine in batches', 'fry the diced potatoes', 'fry the tortilla strips', 'get the butter foaming', 'hot oiled pan', 'in 1cm of hot oil', 'in generous oil', 'in the oil over medium', 'so they take color', 'toss constantly', 'until it takes a little color', 'until the grains separate and crisp', 'without crowding'],
		l: 'Sautéing & the shallow fry',
		q: 'sautéing & the shallow fry technique'
	},
	{
		k: ['crosshatch', 'fat cap scored', 'one deep slit', 'score a', 'score it in'],
		l: 'Scoring',
		q: 'scoring technique'
	},
	{
		k: ['a dark crust builds', 'brown the bison hard', 'brown, don\'t cook through', 'releases itself from the pan', 'the underside is deep brown'],
		l: 'Searing: the hard crust',
		q: 'searing the hard crust technique'
	},
	{
		k: ['bend each into a crescent', 'from palm to palm', 'into ropes', 'no rolling pin', 'over the pad of your thumb', 'pinching closed at the bottom', 'roll each to a rope', 'roll spoonfuls into balls', 'roll walnut sized balls', 'shape a dome', 'stretch the dough', 'wet your palm', 'with oiled hands'],
		l: 'Shaping by hand',
		q: 'shaping by hand technique'
	},
	{
		k: ['crack the claws'],
		l: 'Shucking shellfish',
		q: 'shucking shellfish technique'
	},
	{
		k: ['fully degreased', 'the raft'],
		l: 'Skimming: foam, fat and a clear broth',
		q: 'skimming foam, fat and a clear broth technique'
	},
	{
		k: ['changing the water', 'for the dried herb to swell', 'soak 30 minutes', 'soak the beans', 'soak the dates', 'soak the urad dal', 'soaked 8 hours', 'soaked soft', 'sultanas, soaked', 'the drained peas', 'until they plump'],
		l: 'Soaking dried goods back to life',
		q: 'soaking dried goods back to life technique'
	},
	{
		k: ['parcel in banana leaf', 'wet muslin over the vegetables'],
		l: 'Steaming: basket, leaf and lid',
		q: 'steaming basket, leaf and lid technique'
	},
	{
		k: ['double layer of muslin', 'in a sieve', 'muslin lined sieve', 'sieve with muslin', 'strain for clear', 'through a fine sieve', 'through muslin', 'through the sieve'],
		l: 'Straining & passing through a sieve',
		q: 'straining & passing through a sieve technique'
	},
	{
		k: ['boil the sugar, corn syrup', 'breaking into shards', 'bubbling caramel', 'candy thermometer', 'cold water sets', 'into cold water forms a ball', 'just caramelizes', 'loses its shine', 'melt the rock sugar', 'off a spoon in a thread', 'repostero stage', 'syrup will turn amber'],
		l: 'Sugar stages & caramel',
		q: 'sugar stages & caramel technique'
	},
	{
		k: ['but not coloured', 'cook until softened', 'garlic and cook until soft', 'never browned', 'onion and cook until soft', 'pale gold jam', 'stew rather than fry', 'sweat in their own', 'until jammy, pale gold', 'with no browning'],
		l: 'Sweating aromatics: soft, never browned',
		q: 'sweating aromatics soft, never browned technique'
	},
	{
		k: ['bloom the paprikas', 'drop in the curry leaves', 'fry it in the samneh', 'fry the curry leaves', 'pop the mustard', 'pop the mustard seeds', 'seeds to crackle', 'the chillies and swirl', 'through the warm oil', 'until it pops and greys', 'until the fat runs deep red', 'until the oil runs red'],
		l: 'Tadka: blooming spices in fat',
		q: 'tadka blooming spices in fat technique'
	},
	{
		k: ['temper in milk', 'temper in the'],
		l: 'Tempering a custard',
		q: 'tempering a custard technique'
	},
	{
		k: ['a bare shiver', 'a bare tremble', 'a lazy blip', 'a single bubble', 'barest simmer', 'hold the milk at 75', 'more than shiver', 'the barest simmer'],
		l: 'The bare simmer: holding liquid below the boil',
		q: 'the bare simmer holding liquid below the boil technique'
	},
	{
		k: ['with a torch'],
		l: 'The brûlée torch',
		q: 'the brûlée torch technique'
	},
	{
		k: ['a dusty veil', 'dip the curds in batter', 'dip the fish in batter', 'dry and dust with', 'dusted in flour', 'flour, egg and crumb', 'flour, egg, crumbs', 'flour, egg, panko', 'roll in flour', 'roll in the crumb', 'rub starch', 'toss in the cornmeal'],
		l: 'The coat before the fry: dredge, crumb, batter',
		q: 'the coat before the fry dredge, crumb, batter technique'
	},
	{
		k: ['drinks overnight', 'rest 24 hours', 'rest in the fridge overnight', 'the soak is the recipe'],
		l: 'The overnight rest: letting a dish marry',
		q: 'the overnight rest letting a dish marry technique'
	},
	{
		k: ['boil with the old bay'],
		l: 'The seafood boil',
		q: 'the seafood boil technique'
	},
	{
		k: ['double boiler'],
		l: 'The water bath',
		q: 'the water bath technique'
	},
	{
		k: ['a skewer meets no resistance', 'a skewer slides through', 'firm to a fingertip', 'shivers when nudged', 'sounds hollow when tapped'],
		l: 'The wobble & the skewer: testing a bake',
		q: 'the wobble & the skewer testing a bake technique'
	},
	{
		k: ['velveted'],
		l: 'Velveting',
		q: 'velveting technique'
	},
	{
		k: ['stir-fry until', 'tossing violently'],
		l: 'Wok technique',
		q: 'wok technique technique'
	},
	{
		k: ['nixtamal masa'],
		l: 'Working with masa',
		q: 'working with masa technique'
	},
];