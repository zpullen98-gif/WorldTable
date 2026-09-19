/* The Floor Deck, section "mushrooms". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0138',
		term: 'Abalone Mushroom',
		say: 'ab-uh-LOH-nee MUSH-room',
		aliases: ['Abalone Oyster Mushroom'],
		packet: true,
		gist: 'Thick, gray-brown cap from the oyster mushroom family, springy',
		guest: "It's a thick, meaty cousin of the oyster mushroom, named for the shellfish because it has the same firm, springy chew. Seared, it's savory and satisfying.",
		why: "A close relative of the oyster mushroom, grown indoors on sawdust or straw, mostly in East Asia. Its caps are thicker and denser than an oyster's, so they keep their shape and a firm, springy chew when seared or braised. The name comes from that chew.",
		madeWith: ['abalone mushroom', 'often butter', 'often garlic', 'sometimes soy sauce', 'sometimes oyster sauce'],
		origin: 'Named for abalone, the prized sea snail its chewy texture resembles',
		notThis: 'Not abalone, the shellfish. A mushroom named for its chew, though it is often braised in oyster sauce.',
		seeAlso: ['fd_0145', 'fd_0143'],
		line: 'Seared abalone mushroom, black garlic, scallion',
		traps: [
			{ says: 'Thin slices of sea snail, cut and dressed to look like a mushroom', why: 'It is a cultivated mushroom. Only the name and the chewy texture come from the sea snail.' }
		]
	},
	{
		id: 'fd_0139',
		term: 'Beech Mushroom',
		aliases: ['Shimeji', 'Buna-Shimeji', 'Clamshell Mushroom'],
		packet: true,
		gist: 'Clump of round brown or white caps, bitter raw and nutty cooked',
		guest: "They're little clustered mushrooms, brown or white, on long stems. Cooked, they turn nutty and a bit sweet, with a pleasant crunch that holds up.",
		why: 'Grown in bottles of sawdust, they reach the kitchen as a clump joined at the base, which is trimmed to free them. Raw they taste bitter, but cooking turns them nutty and savory, and unlike softer mushrooms they stay firm and slightly crunchy.',
		madeWith: ['beech mushroom', 'often butter', 'often soy sauce', 'sometimes sesame oil'],
		origin: 'Japanese buna-shimeji, named for the beech logs it grows on in the wild',
		pairs: 'Butter, soy, miso, ramen, rice dishes and hot pots',
		seeAlso: ['fd_0151', 'fd_0145'],
		line: 'Roasted beech mushrooms, miso butter, scallion'
	},
	{
		id: 'fd_0140',
		term: 'Black Trumpet',
		aliases: ['Horn of Plenty', 'Black Chanterelle', 'Trompette de la Mort'],
		packet: true,
		gist: 'Thin, hollow, near-black wild funnel with a deep, smoky flavor',
		guest: "It's a wild mushroom shaped like a little dark horn. It's thin and delicate, with a deep, smoky flavor, a bit like truffle, that goes a long way.",
		why: 'A wild relative of the chanterelle, foraged under hardwoods and not farmed. It has no gills, just a thin hollow funnel, so it cooks in a minute and turns silky. Its aroma is intense and smoky, and it dries so well that dried ones are ground into sauces.',
		madeWith: ['black trumpet mushroom', 'often butter', 'often cream', 'sometimes shallot'],
		note: 'The hollow funnel traps forest grit, so kitchens split and rinse each one.',
		origin: "French trompette de la mort, for its dark color and All Saints' season",
		notThis: 'Not king trumpet, the thick white farmed stem. This one is wild, thin and nearly black.',
		lexiconSlug: 'black-trumpet',
		seeAlso: ['fd_0141', 'fd_0147'],
		confusedWith: ['fd_0143'],
		line: 'Black trumpet risotto, parmesan, brown butter',
		traps: [
			{ says: 'Wild funnel named for its poison, eaten only after a long boil', why: 'The death in its French name is for its dark color and season, not poison. It cooks in minutes.' }
		]
	},
	{
		id: 'fd_0141',
		term: 'Chanterelle',
		say: 'shan-tuh-REL',
		aliases: ['Girolle', 'Golden Chanterelle'],
		packet: true,
		gist: 'Golden, vase-shaped wild mushroom, apricot-scented and peppery',
		guest: "It's a golden wild mushroom, foraged, not farmed. It smells faintly of apricot and has a gentle, peppery flavor and a tender, meaty bite.",
		why: 'Chanterelles live in partnership with the roots of living trees, which is why they are not grown commercially and nearly all are foraged. Under the cap they carry blunt ridges, not true gills. Firm and a little chewy, they taste fruity and peppery, milder than porcini.',
		madeWith: ['chanterelle mushroom', 'often butter', 'often shallot', 'sometimes cream'],
		origin: 'French, from Greek kantharos, a drinking cup, for its shape',
		pairs: 'Brown butter, sweet corn, eggs, roast chicken, white Burgundy',
		lexiconSlug: 'chanterelle',
		recipe: 'oregon-chanterelle-soup',
		seeAlso: ['fd_0140', 'fd_0144', 'fd_0149'],
		line: 'Pan-roasted chanterelles, sweet corn, brown butter',
		traps: [
			{ says: 'Pale farmed mushroom that only turns golden once browned in butter', why: 'It is golden when raw, and it is foraged in the wild, not farmed.' }
		]
	},
	{
		id: 'fd_0142',
		term: 'Hen of the Woods',
		aliases: ['Maitake', "Sheep's Head", "Ram's Head"],
		packet: true,
		gist: 'Ruffled cluster of gray-brown fronds found at the base of oak trees',
		guest: "It's maitake, a big, ruffled mushroom that grows wild under oaks and is farmed too. Roasted, the frilly edges crisp up and the center stays tender and earthy.",
		why: 'It grows as one large rosette of overlapping gray-brown caps, usually at the base of oaks, and is now widely farmed too. Torn into pieces and roasted or seared, the thin edges crisp like chips while the thick base stays meaty. The flavor is deep and earthy.',
		madeWith: ['maitake mushroom', 'often butter', 'often olive oil', 'sometimes miso'],
		origin: 'The Japanese name, maitake, means dancing mushroom',
		notThis: 'Not chicken of the woods, a bright orange shelf fungus. This one is gray-brown and ruffled.',
		seeAlso: ['fd_0145'],
		confusedWith: ['fd_0153'],
		line: 'Crispy maitake, miso butter, charred scallion'
	},
	{
		id: 'fd_0143',
		term: 'King Trumpet',
		aliases: ['King Oyster Mushroom', 'Eryngii', 'French Horn Mushroom'],
		packet: true,
		gist: 'Thick white stem under a small cap, seared in coins like scallops',
		guest: "It's a mushroom that's almost all thick white stem. Seared, it's firm and meaty with a mild, savory flavor, and some cooks cut it into coins like scallops.",
		why: 'The largest of the oyster mushroom family, farmed on sawdust. Unlike most mushrooms, its stem is the prize: dense and firm, it browns deeply, shrinks less than softer kinds and keeps a springy bite. Cooks score it and sear it like a scallop or a steak.',
		madeWith: ['king trumpet mushroom', 'often butter', 'often garlic', 'sometimes soy sauce'],
		origin: 'Native to Mediterranean grasslands, now farmed worldwide as eryngii',
		notThis: 'Not black trumpet, the thin dark wild funnel. This one is thick, white and farmed.',
		lexiconSlug: 'king-oyster-mushroom',
		seeAlso: ['fd_0145', 'fd_0138'],
		confusedWith: ['fd_0140'],
		line: 'Seared king oyster mushroom, brown butter, capers',
		traps: [
			{ says: 'Mushroom whose small cap is eaten and whose thick stem goes to stock', why: 'The thick stem is the best part, firm and meaty, and it is what cooks slice and sear.' }
		]
	},
	{
		id: 'fd_0144',
		term: 'Morel',
		say: 'muh-REL',
		packet: true,
		gist: 'Hollow, honeycombed spring mushroom, always cooked through',
		guest: "It's a wild spring mushroom with a honeycombed cap, one of the most prized there is. It's nutty and earthy, and all those pockets soak up the sauce.",
		why: 'Morels come up for a few weeks each spring in woods, old orchards and burned forest, and most are still foraged, hence the price. The cap is a hollow honeycomb, light and chewy, and its pits hold butter or cream. The flavor is deep, nutty and meaty, stronger still when dried.',
		madeWith: ['morel mushroom', 'often butter', 'often cream', 'sometimes shallot', 'sometimes brandy'],
		note: 'Always cooked through: raw or undercooked morels can make people sick. The pits also trap grit.',
		pairs: 'Asparagus, spring peas, ramps, cream sauces, veal and chicken',
		lexiconSlug: 'morel',
		recipe: 'idaho-morel-and-asparagus-saute',
		seeAlso: ['fd_0141', 'fd_0147'],
		line: 'Morels and asparagus, cream, grilled bread',
		traps: [
			{ says: 'Delicate spring mushroom usually sliced raw into salads', why: 'Morels must be cooked through. Raw or undercooked, they can make people ill.' }
		]
	},
	{
		id: 'fd_0145',
		term: 'Oyster Mushroom',
		aliases: ['Pearl Oyster Mushroom', 'Hiratake'],
		packet: true,
		gist: 'Soft, fan-shaped gray caps growing in shelves, mild and velvety',
		guest: "They're soft, fan-shaped mushrooms with a mild, gently savory flavor. Seared hot, the thin edges go crisp and golden while the middle stays velvety.",
		why: 'Grown on straw or sawdust, they form overlapping shelves of thin, tender caps with short stems. Being thin, they cook in minutes, and a hot pan crisps the edges. The name is for the shell-like shape and color, not the taste, which is mild with a faint sweetness.',
		madeWith: ['oyster mushroom', 'often butter', 'often garlic', 'sometimes wheat flour', 'sometimes oyster sauce'],
		note: 'Golden and pink kinds sold under the same name are thinner and cook even faster.',
		notThis: "Not oysters, the shellfish. The name is for the cap's shape, though dishes may use oyster sauce.",
		lexiconSlug: 'oyster-mushroom',
		seeAlso: ['fd_0143', 'fd_0138'],
		confusedWith: ['fd_0115'],
		line: 'Crispy oyster mushrooms, chili crisp, scallion',
		traps: [
			{ says: 'Mushroom that tastes briny, like the shellfish it is named for', why: 'The name is for its shell-like shape. The flavor is mild and earthy, not of the sea.' }
		]
	},
	{
		id: 'fd_0146',
		term: 'Shiitake',
		say: 'shih-TAH-kee',
		packet: true,
		gist: 'Brown East Asian mushroom with a smoky, deeply savory bite',
		guest: "It's a mushroom from East Asia grown on hardwood, meaty and smoky with a deep savory flavor. It's wonderful off the grill or in a broth.",
		why: 'It grows on hardwood logs or sawdust blocks. Cutting and cooking release a sulfur aroma compound, and the cap is rich in the compounds behind umami, stronger still once dried. The cap eats meaty and firm; the stem is woody, so kitchens keep it for stock.',
		madeWith: ['shiitake mushroom', 'often soy sauce', 'often butter', 'sometimes sesame oil'],
		note: 'Meant to be cooked through: raw or undercooked shiitake gives a few people an itchy, streaky rash.',
		origin: 'Japanese, from shii, the tree it grows on, and take, mushroom',
		pairs: 'Soy, ginger, miso, kombu broth, noodles, rice',
		lexiconSlug: 'shiitake',
		recipe: 'shojin-dashi-kombu-and-shiitake',
		seeAlso: ['fd_0280', 'fd_0151', 'fd_0145'],
		line: 'Grilled shiitake, miso butter, scallion, rice',
		traps: [
			{ says: 'Soft, spongy mushroom with a mild, almost neutral woodsy flavor', why: 'The cap is firm and meaty, and its flavor is strongly savory and smoky, not mild.' }
		]
	},
	{
		id: 'fd_0147',
		term: 'Truffle',
		packet: true,
		gist: 'Rare underground fungus found by dogs, prized for its aroma',
		guest: "It's a rare fungus that grows underground on tree roots, and dogs sniff it out. It's usually shaved fresh over the dish, and the smell is the whole point.",
		why: 'A truffle fruits underground on the roots of oak and hazel, and it spreads by smell, so it is hunted with trained dogs. Its value is aroma, which fades within days of digging, so it is bought small and used fast: white shaved raw, black often warmed gently in fat.',
		madeWith: ['fresh truffle', 'often butter', 'often egg', 'often fresh wheat pasta', 'sometimes parmesan', 'sometimes cream'],
		origin: 'Black winter truffles from France, white from Piedmont in Italy',
		notThis: 'Not the chocolate truffle, which is a candy, and not truffle oil, which is usually just flavored.',
		seeAlso: ['fd_0149', 'fd_0185', 'fd_0181'],
		confusedWith: ['fd_0255', 'fd_0148'],
		line: 'Tagliatelle, butter, shaved black truffle',
		traps: [
			{ says: 'Knobby black mushroom that grows on the bark of old oak trees', why: 'It grows underground on the roots, never on bark, and is found by smell, usually by a trained dog.' }
		]
	},
	{
		id: 'fd_0148',
		term: 'Truffle Oil',
		gist: 'Finishing drizzle whose truffle scent usually comes from a lab',
		guest: "It's an oil flavored to smell like truffle, drizzled on at the end. It gives a big, earthy hit of that aroma.",
		why: 'Most bottles are olive or neutral oil flavored with a manufactured copy of one aroma compound found in white truffle, sometimes with a speck of real truffle for show. It smells louder and flatter than the real thing, and heat drives the aroma off, so it goes on at the end.',
		madeWith: ['olive oil', 'sometimes neutral oil', 'truffle flavoring', 'rarely real truffle'],
		note: 'A few drops go a long way. Too much reads harsh and chemical.',
		notThis: 'Not the truffle itself. If a guest asks for real truffle, the answer is the shaved fresh truffle, not the oil.',
		seeAlso: ['fd_0284'],
		confusedWith: ['fd_0147'],
		line: 'Fries, truffle oil, parmesan, parsley',
		traps: [
			{ says: 'Rich pressing made by crushing whole black truffles like olives', why: 'Truffles hold almost no fat, and nearly all such bottles are flavored with a made compound.' }
		]
	},
	{
		id: 'fd_0149',
		term: 'Porcini',
		say: 'por-CHEE-nee',
		aliases: ['Cep', 'Cèpe', 'King Bolete'],
		gist: 'Fat-stemmed wild forest mushroom with a sponge under its cap',
		guest: "Porcini are wild forest mushrooms with a deep, nutty, almost meaty flavor. They're a classic in risotto and fresh pasta.",
		why: 'A wild mushroom that lives with the roots of pine, oak and spruce and resists farming, so it is foraged. Under the cap is a sponge of pores, not gills. Drying concentrates its nutty, beefy flavor, which is why most kitchens use dried, and the soaking water becomes stock.',
		madeWith: ['porcini mushroom', 'often butter', 'often parmesan', 'sometimes white wine'],
		origin: 'Italian for little pigs; the French call it cèpe',
		pairs: 'Risotto, fresh pasta, veal, beef, polenta, parmesan',
		lexiconSlug: 'porcini',
		seeAlso: ['fd_0181', 'fd_0141', 'fd_0144'],
		line: 'Porcini risotto, parmesan, brown butter',
		traps: [
			{ says: 'Young Italian truffle dug from under oak roots before it ripens', why: 'It is an above-ground mushroom with a cap, a thick stem and pores, not a truffle at any age.' }
		]
	},
	{
		id: 'fd_0150',
		term: 'Cremini',
		say: 'kreh-MEE-nee',
		aliases: ['Baby Bella', 'Brown Mushroom'],
		gist: 'Brown strain of the everyday button, firmer and a little earthier',
		guest: "It's the brown cousin of the white button mushroom, a little firmer with more flavor. Let it grow bigger and you get a portobello.",
		why: 'Same species as the white button: the button is a pale mutant found in a brown bed in the 1920s, and cremini is the original brown strain. It has a touch less water and a deeper, earthier flavor, so it browns well and holds shape. Grown to full size, it is sold as a portobello.',
		madeWith: ['cremini mushroom', 'often butter', 'often garlic', 'sometimes thyme', 'sometimes sherry'],
		notThis: 'Not a wild mushroom. It is farmed year round, the everyday brown mushroom.',
		lexiconSlug: 'cremini',
		seeAlso: ['fd_0149', 'fd_0146'],
		line: 'Roasted cremini, garlic, thyme, sherry',
		traps: [
			{ says: 'Small white mushroom, the pale everyday kind sold in every grocery', why: 'That is the white button. This is its brown strain, a little firmer and more flavorful.' }
		]
	},
	{
		id: 'fd_0151',
		term: 'Enoki',
		say: 'eh-NOH-kee',
		aliases: ['Enokitake', 'Golden Needle'],
		gist: 'Bundle of long, thin white stems with pinhead caps and a crunch',
		guest: "Enoki are long, thin white mushrooms that grow in a bundle. They're mild and a little crunchy, and they soak up the broth they cook in.",
		why: 'Farmed in dark bottles with little air, it stretches into pale noodle-like stems instead of the short golden caps it grows in the wild. There is little cap, so it eats crisp and springy rather than meaty, with a mild, faintly fruity flavor that takes on broth.',
		madeWith: ['enoki mushroom', 'often soy sauce', 'sometimes sesame oil', 'sometimes beef', 'sometimes pork', 'sometimes tofu'],
		note: 'Cook it through. Packaged enoki has been part of US listeria recalls, so it should not go out raw.',
		origin: 'Japanese, from enoki, the hackberry tree it grows on wild',
		lexiconSlug: 'enoki',
		seeAlso: ['fd_0139', 'fd_0146'],
		line: 'Beef hot pot, enoki, napa cabbage, tofu'
	},
	{
		id: 'fd_0152',
		term: "Lion's Mane",
		aliases: ['Pom Pom Mushroom', 'Bearded Tooth'],
		gist: 'Shaggy white ball of spines that sears up like crab meat',
		guest: "It's a white, shaggy mushroom that sears up tender and flaky, a lot like crab or lobster. The flavor is mild and a little sweet.",
		why: 'It grows on hardwood trees as a white mop of hanging spines, with no gills or cap. Those spines are fine and fibrous, so pressed and seared hard it pulls into strands like shellfish meat. It holds a lot of water, so it needs a hot pan to brown instead of steaming.',
		madeWith: ["lion's mane mushroom", 'often butter', 'sometimes garlic', 'sometimes lemon', 'sometimes egg', 'sometimes breadcrumbs'],
		pairs: 'Brown butter, lemon, capers, crab cake style with remoulade',
		lexiconSlug: 'lions-mane',
		seeAlso: ['fd_0145', 'fd_0134'],
		line: "Seared lion's mane, brown butter, capers",
		traps: [
			{ says: 'Seaweed-like fungus with a natural briny taste of the sea', why: 'Its flavor is mild and faintly sweet. The seafood likeness is the shredded texture, not a sea taste.' }
		]
	},
	{
		id: 'fd_0153',
		term: 'Chicken of the Woods',
		aliases: ['Sulphur Shelf'],
		gist: 'Orange shelf fungus off tree trunks that tears into meaty strands',
		guest: "It's a wild orange mushroom that grows in shelves on trees. Cooked, it pulls apart like chicken breast, with a mild, slightly lemony flavor.",
		why: 'A wild shelf fungus foraged from the trunks of living and dead hardwoods, oak above all, in summer and fall. Its flesh is dense and fibrous rather than soft, so it tears into strands like cooked chicken. Only the young, tender edges eat well; the older core turns woody.',
		madeWith: ['chicken of the woods mushroom', 'often butter', 'sometimes wheat flour', 'sometimes egg', 'sometimes buttermilk'],
		note: 'Must be cooked through. A few people get an upset stomach even from cooked pieces.',
		notThis: 'Not hen of the woods, the gray frilly maitake. This one is bright orange-yellow shelves.',
		seeAlso: ['fd_0141', 'fd_0031'],
		confusedWith: ['fd_0142'],
		line: 'Fried chicken of the woods, hot honey, pickles',
		traps: [
			{ says: 'Farmed mushroom grown on poultry manure, named for how it is raised', why: 'It is wild, grows on tree trunks, and the name comes from its chicken-like texture.' }
		]
	}
];

export default cards;
