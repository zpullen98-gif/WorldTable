/**
 * recipes-supplement.mjs: recipes authored AFTER the original guide.
 *
 * WHY THIS FILE EXISTS, and why new recipes do not go in raw/R.json.
 *
 * R.json is not an editable list. verify-extraction.mjs proves it is a
 * byte-lossless image of the literals still sitting in the original
 * single-file guide, gated on a count of exactly 970, a character sum, and a
 * deepStrictEqual against a fresh extraction. That proof is worth keeping: it
 * is the only thing standing between the shipped data and a silent transcription
 * error. Appending a recipe there would break it, and relaxing the gate to allow
 * the append would throw away the guarantee for everybody.
 *
 * So the original stays sealed and the book grows here instead. build-data.mjs
 * concatenates the two, and everything downstream, the derivations, the diet
 * gates, the technique tagging, the search index, treats a supplement recipe
 * exactly like an original one. This is the same shape technique-table.mjs
 * already uses with TECH and SUPPLEMENT.
 *
 * THE CONTRACT. Nine keys, all required, no others. The original 970 carry
 * exactly these and the build assumes them.
 *
 *   n  string   Name as a cook would say it. The slug is derived from this, so
 *               it must be unique across the whole book, originals included.
 *   c  string   Chapter. An existing chapter name adds to it. A new name
 *               creates a chapter, grouped as a World Cuisine unless it is
 *               listed in SUPPLEMENT_ATLASES below.
 *   k  string   Course, one of: Bread Breakfast Dessert Drink Main Salad
 *               Sauce Side Soup Starter.
 *   d  1|2|3    Difficulty. 1 a cook's first week, 2 competent line work,
 *               3 needs judgement or a long process.
 *   t  number   Active minutes, honestly. Fermentation time is in the note,
 *               not here; a kraut is 20 minutes of work and three weeks of
 *               waiting, and t is 20.
 *   v  0|1      1 if the dish as written is strictly vegetarian. This is
 *               CROSS-CHECKED: build-data derives diet from the ingredients and
 *               fails the build when the flag and the ingredients disagree.
 *               Fish sauce, anchovy, lard, gelatine, dashi and shrimp paste all
 *               mean 0.
 *   i  string[] Ingredients, 3 to 18, metric first. Quantities matter; "a
 *               splash" teaches nothing.
 *   m  string[] Method, 3 to 5 steps. Each step is one movement of the hand or
 *               one decision. Say the sensory endpoint, not just the clock:
 *               "until it smells of hazelnut and stops foaming".
 *   p  string   THE NOTE, and the reason this book is worth reading. 150 to 500
 *               characters explaining the MECHANISM: why the thing works, what
 *               breaks it, what the cook should watch. The house standard is the
 *               Cacio e Pepe note, which explains that the emulsion breaks above
 *               65C because pecorino's proteins seize, and that this is why the
 *               work happens off the heat. Not history for its own sake, and
 *               never a paragraph of praise for the dish.
 *
 * HOUSE STYLE. No em dashes and no spaced en dashes anywhere in this file; the
 * whole product was swept of them and a new one would put it back. Use a colon,
 * a semicolon, a comma or a full stop. Temperatures in Celsius with Fahrenheit
 * in brackets where a home cook needs it. Weights in grams.
 */

/** Chapters here that are cross-cutting technique collections rather than a
 *  place on the map. Grouped under The Atlases, beside the Seafood and Noodle
 *  atlases the original guide already carries. */
export const SUPPLEMENT_ATLASES = new Set([
	'Fermentation Atlas',
	'The Cure',
	'Stock & Fond Atlas',
	'Dumpling Atlas',
	'The Rice Bowl',
	'Offal & the Whole Animal',
	'The Vegetable-Led Plate',
	'Bread Atlas',
	'Pickle & Condiment Atlas'
]);

export const RECIPE_SUPPLEMENT = [
	/* ---- Fermentation Atlas ------------------------------------------------
	   The largest craft gap in the original book: no koji, no miso, no kimchi,
	   no kraut, nothing cured. These six are the anchors the rest hang off. */
	{
		n: 'Baechu Kimchi',
		c: 'Fermentation Atlas',
		k: 'Side',
		d: 2,
		t: 60,
		v: 0,
		i: [
			'1 napa cabbage, about 1.2kg, quartered lengthwise',
			'90g coarse sea salt, not iodised',
			'40g gochugaru, coarse Korean chilli flake',
			'30g garlic, about 8 cloves, grated',
			'15g ginger, grated',
			'30g salted shrimp (saeujeot), minced',
			'20g fish sauce',
			'15g glutinous rice flour cooked to a paste with 150ml water',
			'100g Korean radish, julienned',
			'3 spring onions, in 4cm lengths'
		],
		m: [
			'Salt the cabbage between every leaf, heaviest at the stem, and leave 2 hours turning once. It is ready when a stem folds double without cracking.',
			'Rinse three times and drain cut side down 30 min. Water left in the leaf dilutes the brine and slows the ferment.',
			'Cool the rice paste, then beat in gochugaru, garlic, ginger, shrimp and fish sauce. Fold through radish and spring onion.',
			'Wearing gloves, paint the paste over every leaf. Pack into a jar, press until brine rises over the top, and leave 2cm of headroom.',
			'Ferment at 18 to 20C for 2 to 4 days until it tastes sour and fizzes against the tongue, then refrigerate.'
		],
		p: 'The salting is the whole technique. It draws water out by osmosis until the cell walls go limp, which is why a ready stem folds instead of snapping, and it leaves the cabbage salty enough that lactobacillus can work while almost nothing else can. That selective pressure is what makes fermentation safe rather than lucky. Keep everything under the brine: the spoilage organisms that ruin a jar are aerobic, and a leaf floating in air is where they start. Bubbles and a clean sour smell mean it is working; fuzz on a dry surface means something was left exposed.'
	},
	{
		n: 'Sauerkraut, the Two Ingredient Ferment',
		c: 'Fermentation Atlas',
		k: 'Side',
		d: 1,
		t: 25,
		v: 1,
		i: [
			'1kg white cabbage, cored and shredded 2mm',
			'20g fine sea salt, not iodised'
		],
		m: [
			'Weigh the cabbage and use exactly 2% of that weight in salt. Precision here is not fussiness; it is the safety margin.',
			'Toss and then squeeze in handfuls for 10 min until the cabbage releases enough liquid to pool when pressed.',
			'Pack into a jar a fistful at a time, pressing hard, until the brine covers everything. Weight it down.',
			'Ferment at 18 to 22C for 2 to 4 weeks, releasing pressure every few days. Taste weekly and refrigerate when it is sour enough.'
		],
		p: 'Two percent salt by weight is the number to memorise, because it is the concentration at which lactobacillus is comfortable and most spoilage organisms are not. Below about 1.5% the kraut goes soft and can turn; above 3% the ferment stalls and stays harshly salty. Weigh the cabbage rather than the jar, and weigh the salt rather than measuring it by spoon, since flake salts differ in density by a factor of two. Cold slows everything: a cellar at 15C takes twice as long as a kitchen at 22C and produces a rounder, less sharp result.'
	},
	{
		n: 'Shio Koji',
		c: 'Fermentation Atlas',
		k: 'Sauce',
		d: 2,
		t: 15,
		v: 1,
		i: [
			'200g dried rice koji',
			'60g fine sea salt',
			'300ml water, filtered if yours is chlorinated'
		],
		m: [
			'Break the koji grains apart with your fingers so none are clumped, then stir through the salt.',
			'Add water to cover by 1cm and stir. Keep the surface submerged.',
			'Leave at room temperature 7 to 10 days, stirring daily; it is ready when the grains are soft, the liquid is cloudy, and it smells of sweet chestnut.',
			'Blend smooth for a marinade, or leave whole. Refrigerate up to 6 months.'
		],
		p: 'Koji is Aspergillus oryzae grown on rice, and what you are buying is its enzymes: proteases that cut protein into free amino acids, and amylases that cut starch into sugar. Rubbed on fish or chicken at about 10% of its weight for a few hours, shio koji does what a long dry age does, tenderising while building glutamate, which is why the result tastes savoury rather than merely salty. The limit is time: leave protein in it overnight and the proteases go too far, turning the surface soft and faintly bitter. Two to four hours is the working window.'
	},
	{
		n: 'Preserved Lemons',
		c: 'Fermentation Atlas',
		k: 'Side',
		d: 1,
		t: 20,
		v: 1,
		i: [
			'8 unwaxed lemons, thin skinned',
			'200g coarse sea salt',
			'2 bay leaves',
			'1 tsp black peppercorns',
			'Juice of 4 further lemons, as needed'
		],
		m: [
			'Cut each lemon in quarters from the top, stopping 1cm short of the base so it stays hinged.',
			'Pack salt into every cut surface, close the fruit, and press into a sterilised jar, layering bay and peppercorns.',
			'Press down hard. The lemons should release enough juice to cover; top up with fresh juice if not.',
			'Seal and leave a month at room temperature, turning the jar occasionally. Refrigerate after opening.'
		],
		p: 'This is a salt cure, not a fermentation in the lactic sense, and the salt is doing two jobs: drawing juice out to make the covering brine, and breaking down the pith so the bitterness leaves. That is why a month matters and a week does not. The rind is the ingredient; most cooks scrape the flesh away and use only the peel, sliced fine. A white bloom on the surface is usually harmless kahm yeast, and can be lifted off, but any fuzzy growth or a jar where the fruit has risen out of the brine should go in the bin.'
	},
	/* ---- Stock & Fond Atlas ------------------------------------------------
	   The Saucier chapter teaches sauces and assumes the base already exists.
	   This is the base. */
	{
		n: 'Brown Veal Stock',
		c: 'Stock & Fond Atlas',
		k: 'Sauce',
		d: 3,
		t: 60,
		v: 0,
		i: [
			'4kg veal bones, knuckle and marrow, cut 6cm',
			'500g onion, halved',
			'250g carrot, in chunks',
			'250g leek, white only',
			'100g tomato paste',
			'1 head garlic, halved across',
			'2 bay leaves, 6 parsley stalks, 1 tsp black peppercorns',
			'6 litres cold water'
		],
		m: [
			'Roast the bones at 220C (425F) for 45 min until deep brown, turning once. Pale bones make pale stock and there is no recovering it later.',
			'Add the vegetables and roast 20 min more, then smear on the tomato paste and give it 10 min until it darkens and smells sweet rather than tinny.',
			'Transfer to a tall pot, deglaze the roasting tray with water and scrape every brown speck in, then cover with cold water.',
			'Bring to 90C and hold there 8 to 12 hours, never boiling, skimming for the first hour. Add the aromatics in the final hour.',
			'Strain through muslin without pressing, chill overnight, and lift the fat cap off.'
		],
		p: 'Two rules carry this. Start cold, because proteins that will become scum are soluble in cold water and set into the liquid if you start hot, and a stock clouded at the beginning never clears. Then never let it boil: at a rolling boil the rendered fat emulsifies into the water and the stock turns greasy and permanently opaque, where at 90C it simply floats and can be lifted off cold. The gelatine comes from knuckle and connective tissue rather than marrow, so ask for joints. Properly made it sets to a firm jelly in the fridge, and that wobble is the only test worth running.'
	},
	{
		n: 'Dashi, Ichiban',
		c: 'Stock & Fond Atlas',
		k: 'Soup',
		d: 1,
		t: 20,
		v: 0,
		i: [
			'20g kombu, wiped but not washed',
			'1 litre soft water',
			'25g katsuobushi, thick shaved'
		],
		m: [
			'Steep the kombu in the cold water 30 min, then bring slowly to 60C and hold 20 min. Do not let it boil.',
			'Lift the kombu out the moment small bubbles climb the pan.',
			'Raise to 80C, add the katsuobushi all at once, and take off the heat immediately.',
			'Let the flakes sink, about 2 min, then strain through muslin without pressing.'
		],
		p: 'Dashi is a lesson in restraint: almost everything that goes wrong is caused by more heat or more time. Kombu gives up glutamate slowly at low temperature, and boiling it drags out alginates that turn the broth slippery and faintly bitter. Katsuobushi gives inosinate in seconds, and left to steep it turns sour and fishy. The reason the two are used together is synergy rather than tradition: glutamate and inosinate together read as far more savoury than the sum of each alone, which is why a two ingredient broth can carry a whole meal. The spent kombu and flakes make niban dashi, a second, weaker stock for simmering vegetables.'
	}
];
