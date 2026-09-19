/* The Floor Deck, section "southern". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0001',
		term: 'Black-Eyed Peas',
		packet: true,
		gist: 'Creamy African cowpea marked with a single black spot',
		guest: "They're small, creamy Southern peas with a little black eye, slow-simmered until tender and earthy. It's the pea people eat on New Year's for luck.",
		why: 'Not a true pea or a common bean but a cowpea, carried from West Africa to the South. A thin skin lets it cook tender in under an hour with no overnight soak, and it holds its shape with a creamy middle and an earthy, slightly nutty flavor.',
		madeWith: ['black-eyed peas', 'often pork', 'sometimes ham hock', 'onion'],
		origin: 'West Africa, via the slave trade to the American South',
		pairs: 'Collard greens, rice, cornbread, chow-chow, pepper vinegar',
		notThis: 'Field peas is the family. Black-eyed is one member, beside crowders, lady peas and purple hulls.',
		lexiconSlug: 'black-eyed-pea',
		seeAlso: ['fd_0008', 'fd_0014'],
		confusedWith: ['fd_0016'],
		line: 'Braised black-eyed peas, smoked ham hock, chow-chow',
		traps: [
			{ says: 'Young green garden pod shelled fresh in spring and eaten sweet', why: 'It is a dried or fresh-shelled cowpea, starchy and earthy, not a sweet green garden pea.' }
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
		id: 'fd_0003',
		term: 'Chow-Chow',
		packet: true,
		gist: 'Crunchy sweet-sour relish of cabbage, green tomato and pepper',
		guest: "It's a crunchy, tangy Southern relish of chopped cabbage, green tomatoes and peppers. A spoonful wakes up beans, greens or a rich plate of pork.",
		why: 'End-of-garden vegetables, often the green tomatoes that will never ripen, are chopped, salted to draw out water, then cooked briefly in sweet vinegar with mustard seed and turmeric and jarred. The short cook keeps a crunch, and the acid cuts fat the way a pickle does.',
		madeWith: ['cabbage', 'green tomato', 'sweet pepper', 'onion', 'vinegar', 'sugar', 'mustard seed'],
		origin: 'Appalachian and Pennsylvania Dutch pantries, name of uncertain origin',
		pairs: 'Field peas, pinto beans, collard greens, hot dogs, ham',
		notThis: 'Not chutney, which is cooked down soft and fruit-led. This one stays crisp and vegetable-sharp.',
		seeAlso: ['fd_0033', 'fd_0001'],
		confusedWith: ['fd_0275'],
		line: 'Smoked pork chop, black-eyed peas, house chow-chow',
		traps: [
			{ says: 'Stir-fried Chinese noodles tossed with soy sauce and vegetables', why: 'It is a jarred vinegar relish from the American South, not a noodle dish.' }
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
		seeAlso: ['fd_0003', 'fd_0200'],
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
	},
	{
		id: 'fd_0006',
		term: 'Hoecakes',
		packet: true,
		gist: 'Thin cornmeal cake griddled in fat until the edges go lacy',
		guest: "They're thin cornmeal griddle cakes, crisp and lacy at the edges and soft in the middle. Think of a corn pancake with a toasty crunch.",
		why: 'A loose cornmeal batter, once just meal, water and salt, now often with buttermilk, is poured into a hot greased skillet and flipped. Frying in fat crisps the thin edges. Some trace the name to hoe blades over a fire, others to an old word for a griddle.',
		madeWith: ['cornmeal', 'often buttermilk', 'sometimes wheat flour', 'sometimes egg', 'often bacon fat', 'often butter'],
		origin: 'Colonial Southern cornmeal bread, kin to the New England johnnycake',
		pairs: 'Butter, sorghum, country ham, greens and pot likker',
		notThis: 'Not skillet cornbread, which is poured thick into a pan and baked. These are thin and flipped on a griddle.',
		seeAlso: ['fd_0021'],
		confusedWith: ['fd_0020'],
		line: 'Buttermilk hoecakes, sorghum butter, country ham',
		traps: [
			{ says: 'Fluffy wheat-flour pancakes stacked high and served with syrup', why: 'They are thin and cornmeal-based, crisp at the edge, closer to a corn griddle bread.' }
		]
	},
	{
		id: 'fd_0007',
		term: 'Hominy',
		say: 'HAH-muh-nee',
		packet: true,
		gist: 'Whole corn kernels steeped in alkali until puffed and chewy',
		guest: "It's corn that's been soaked and cooked until the kernels puff up big and soft, a little chewy. It tastes like a warm corn tortilla.",
		why: 'Dried field corn is cooked in an alkali, slaked lime or lye, which loosens the hull so it slips off and swells the starch. The same process makes masa for tortillas, so hominy shares that toasty flavor. It eats plump and chewy, and ground coarse it becomes hominy grits.',
		madeWith: ['dried corn', 'slaked lime', 'sometimes lye'],
		origin: 'From a Powhatan word, the same corn as Mexican pozole',
		pairs: 'Braised pork, chiles, greens, butter and black pepper',
		notThis: 'Not grits, though grits can be ground from it. Hominy is whole, puffy kernels you can count.',
		seeAlso: ['fd_0179'],
		confusedWith: ['fd_0178'],
		line: 'Braised pork shoulder, stewed hominy, charred onion',
		traps: [
			{ says: 'Fresh sweet corn cut from the cob and simmered in butter and cream', why: 'It is dried field corn treated with alkali, starchy and chewy, not fresh sweet corn.' }
		]
	},
	{
		id: 'fd_0008',
		term: "Hoppin' John",
		say: 'HAHP-in JAHN',
		packet: true,
		gist: 'Lowcountry rice steamed in the broth of cowpeas and smoked pork',
		guest: "It's a Southern rice and peas dish, slow-cooked with smoky pork and onion. It's the traditional New Year's Day luck dish, with greens and cornbread.",
		why: 'Field peas, usually black-eyed, are simmered with smoked pork, then rice is cooked in that seasoned liquid so each grain takes up the smoke and pea flavor. It comes from the Gullah Geechee rice kitchens of coastal Carolina, kin to West African and Caribbean rice and peas.',
		madeWith: ['black-eyed peas', 'rice', 'often bacon', 'sometimes ham hock', 'onion'],
		origin: 'Lowcountry South Carolina, from Gullah Geechee cooks',
		pairs: 'Collard greens, cornbread, pepper vinegar, hot sauce',
		recipe: 'hoppin-john',
		seeAlso: ['fd_0001', 'fd_0018', 'fd_0016'],
		line: "Hoppin' John, braised collards, skillet cornbread",
		traps: [
			{ says: 'Spicy Creole rice cooked with sausage, shrimp and tomatoes', why: 'That is jambalaya. This one is plainer: rice, field peas and smoked pork.' }
		]
	},
	{
		id: 'fd_0009',
		term: 'Muscadine',
		say: 'MUSS-kuh-dine',
		packet: true,
		gist: 'Native Southern grape, thick-skinned, musky and often dark purple',
		guest: "It's the South's own native grape, big and thick-skinned with a sweet, musky, floral taste. You'll see it in wine, jelly and pie.",
		why: 'A separate species from European wine grapes, native to the humid Southeast. The berries are big, often an inch or more across, in loose clusters, with a tough skin and a few seeds around slippery pulp. The flavor is musky and floral, closer to a Concord than a table grape.',
		madeWith: ['muscadine grapes'],
		note: 'Most people pop the pulp out of the tough skin, then spit out or swallow the seeds.',
		origin: 'Native to the Southeastern United States, ripe late summer into fall',
		seeAlso: ['fd_0010'],
		line: 'Grilled quail, muscadine jus, Carolina Gold rice',
		traps: [
			{ says: 'Sweet, perfumed white grape grown for Mediterranean dessert wines', why: 'That describes muscat. This is a separate American grape species with a thick, tough skin.' }
		]
	},
	{
		id: 'fd_0010',
		term: 'Scuppernong',
		say: 'SKUHP-er-nahng',
		packet: true,
		gist: "Bronze-green type of the Southeast's native thick-skinned grape",
		guest: "It's a golden-bronze muscadine, the old native grape of the Carolinas. Thick skin, juicy center and a honeyed, floral sweetness.",
		why: "The first named variety of the muscadine grape, found growing wild on North Carolina's coast and now its state fruit. The skin ripens greenish bronze instead of purple, and it eats a touch sweeter and more floral than the dark kind, with the same thick hull and seeds.",
		madeWith: ['bronze muscadine grapes'],
		origin: 'Named for the Scuppernong River in northeastern North Carolina',
		notThis: 'Not a separate species. Every scuppernong is a muscadine, but most muscadines are dark, not bronze.',
		confusedWith: ['fd_0009'],
		line: 'Scuppernong sorbet, mint'
	},
	{
		id: 'fd_0011',
		term: 'Sorghum',
		say: 'SOR-guhm',
		aliases: ['Sorghum Syrup', 'Sorghum Molasses'],
		packet: true,
		gist: 'Amber syrup boiled down from the pressed juice of a tall cane grass',
		guest: 'Sorghum is a syrup made by boiling down the juice of a sugary cane grass. Think molasses, but lighter, earthier and a little tangy.',
		why: 'Stalks of sweet sorghum, a grass first grown in Africa, are crushed each fall and the green juice is boiled in open pans until thick. It is thinner and milder than molasses, with an earthy, grassy, slightly sour edge that cuts rich food.',
		madeWith: ['sweet sorghum cane juice'],
		origin: 'African grass; the syrup is a fall tradition in Kentucky and Tennessee',
		pairs: 'Hot biscuits and butter, glazed pork, pecan pie',
		notThis: 'Not true molasses, which is left over from making sugar. Older Southerners still call it sorghum molasses.',
		line: 'Sorghum-glazed pork belly, braised collards',
		traps: [
			{ says: 'Dark, bitter syrup left over from refining sugarcane into white sugar', why: 'That is molasses, a sugar byproduct. This is the whole juice of a different plant, boiled down.' }
		]
	},
	{
		id: 'fd_0012',
		term: 'Red-Eye Gravy',
		aliases: ['Red Ham Gravy'],
		packet: true,
		gist: 'Thin pan sauce of country ham drippings lifted with black coffee',
		guest: "It's a thin, salty sauce from pan-fried country ham, made with black coffee. Spoon it over the ham, grits or a split biscuit.",
		why: 'Slices of country ham fry until their fat and browned bits coat the skillet. Black coffee, sometimes with water, goes in to lift them. It is left unthickened, so it stays thin and brothy: salty, smoky and a little bitter, more jus than gravy.',
		madeWith: ['country ham drippings', 'black coffee', 'sometimes water'],
		origin: 'American South; said to be named for the reddish eye of fat in the bowl',
		pairs: 'Country ham, stone-ground grits, biscuits',
		seeAlso: ['fd_0067', 'fd_0178', 'fd_0199'],
		line: 'Country ham, red-eye gravy, stone-ground grits',
		traps: [
			{ says: 'Thick, creamy sauce of crumbled sausage drippings, flour and milk', why: 'That is sausage sauce for biscuits. This one is thin ham drippings lifted with coffee.' }
		]
	},
	{
		id: 'fd_0013',
		term: 'Succotash',
		say: 'SUCK-uh-tash',
		packet: true,
		gist: 'Warm summer mix of sweet corn kernels and butter beans',
		guest: "It's sweet summer corn and butter beans cooked together, often with tomato or okra. Sweet, creamy and bright, it tastes like peak summer.",
		why: 'A Native American dish of corn and beans, adopted across the South with lima or butter beans. Fresh corn brings sugar and pop, the beans a creamy, starchy bite, and butter or bacon fat ties them together. Think of it as a warm corn and bean salad.',
		madeWith: ['sweet corn', 'lima beans', 'often butter', 'sometimes cream', 'sometimes bacon', 'sometimes tomato', 'sometimes okra'],
		origin: 'From Narragansett msickquatash, meaning boiled corn kernels',
		pairs: 'Fried chicken, grilled fish, pork chops',
		recipe: 'delaware-succotash',
		seeAlso: ['fd_0022', 'fd_0016'],
		line: 'Seared scallops, summer succotash, brown butter'
	},
	{
		id: 'fd_0014',
		term: 'Collard Greens',
		aliases: ['Collards'],
		gist: 'Broad, sturdy cabbage-family leaves braised long with smoked pork',
		guest: "They're big, sturdy Southern greens, simmered low with smoky pork until silky. Earthier than spinach, milder than kale, with a little vinegar bite.",
		why: 'The same species as cabbage and kale, grown as flat paddle leaves that never form a head. Their tough cell walls need a long braise, usually with smoked pork, to turn silky. A frost sweetens them, and the cooking broth is saved as pot likker.',
		madeWith: ['collard leaves', 'often smoked ham hock', 'sometimes smoked turkey', 'often onion', 'often vinegar'],
		origin: 'From colewort, an old English word for cabbage plants',
		pairs: 'Cornbread, pepper vinegar, black-eyed peas',
		lexiconSlug: 'collard-greens',
		recipe: 'braised-collard-greens',
		seeAlso: ['fd_0015', 'fd_0089', 'fd_0024'],
		line: 'Smoked pork chop, braised collard greens, cornbread',
		traps: [
			{ says: 'Tender young spinach leaves wilted quickly in butter and fresh garlic', why: 'These are tough cabbage-family leaves that need a long, slow braise to soften.' }
		]
	},
	{
		id: 'fd_0015',
		term: 'Pot Likker',
		aliases: ['Potlikker', 'Pot Liquor'],
		gist: 'Smoky, savory broth left behind by long-simmered greens',
		guest: "It's the broth the greens cook in, slow-simmered with smoked pork. Smoky and savory, it's made for dunking cornbread.",
		why: "Greens simmer for an hour or more with smoked ham hock or turkey, onion and water. The pork's smoke and fat and the greens' minerals end up in the liquid, so it tastes like a light, smoky ham broth with a green, slightly bitter edge.",
		madeWith: ['greens cooking liquid', 'often smoked ham hock', 'sometimes smoked turkey', 'often onion'],
		origin: 'Southern spelling of pot liquor, the liquid left in the pot',
		pairs: 'Cornbread for dunking, collards, field peas',
		seeAlso: ['fd_0014', 'fd_0020', 'fd_0089'],
		line: 'Braised greens in pot likker, skillet cornbread',
		traps: [
			{ says: 'Unaged corn whiskey made at home in the Southern hills', why: 'The word is Southern for liquor in the old sense of liquid. It is cooking broth, not a spirit.' }
		]
	},
	{
		id: 'fd_0016',
		term: 'Field Peas',
		gist: 'Umbrella name for Southern summer cowpea kinds: crowder, lady, zipper',
		guest: 'Field peas are Southern summer beans, shelled fresh and simmered low with a little smoked pork. They turn creamy and earthy in their own savory broth.',
		why: 'They are cowpeas, one species carried from West Africa, not the green garden pea. Shelled fresh in summer or dried, and simmered with smoked pork, they cook creamy and nutty and make their own broth. Crowder, lady, zipper and purple hull are common kinds.',
		madeWith: ['cowpeas', 'often smoked pork', 'often onion'],
		origin: 'West African cowpeas, named for the farm fields they grew in',
		pairs: 'Cornbread, sliced tomatoes, pepper vinegar, rice',
		notThis: 'Not green garden peas, and not only black-eyed peas: those are one kind among crowders, lady peas and zippers.',
		seeAlso: ['fd_0008', 'fd_0015'],
		confusedWith: ['fd_0001'],
		line: 'Summer field peas, sliced tomato, pepper vinegar',
		traps: [
			{ says: 'Wild legume foraged from pasture edges, not a crop anyone plants', why: 'They are a planted summer crop of cowpeas. The name means farm peas as against garden peas.' }
		]
	},
	{
		id: 'fd_0017',
		term: 'Benne',
		say: 'BEN-ee',
		gist: 'Old Lowcountry name for sesame seed, toasted for nutty crunch',
		guest: 'Benne is the old Southern word for sesame. Toasted, it brings a nutty crunch, and in Charleston it goes into thin, crisp benne wafers.',
		why: 'Enslaved West Africans brought the seed and its name to the Carolina Lowcountry. Heirloom benne holds less oil than modern sesame, so it toasts deeper and tastes earthier, almost bitter. Menus often use the word for any sesame.',
		madeWith: ['sesame seed', 'sometimes wheat flour', 'sometimes butter', 'sometimes egg', 'sometimes sugar'],
		origin: 'From a West African word for sesame, carried to the Carolina coast',
		recipe: 'benne-wafers',
		seeAlso: ['fd_0018', 'fd_0011'],
		line: 'Benne-crusted flounder, collard greens, brown butter',
		traps: [
			{ says: 'Tiny Lowcountry mustard seed, ground hot for pickles and relish', why: 'It is sesame, a mild nutty seed toasted for crunch, not a hot mustard seed.' }
		]
	},
	{
		id: 'fd_0018',
		term: 'Carolina Gold Rice',
		gist: 'Heirloom Lowcountry long grain, nearly lost and then revived',
		guest: "It's the heirloom rice the Carolina coast was built on, nearly lost and brought back. It cooks up fluffy but a little creamy, with a clean, sweet flavor.",
		why: 'Grown in South Carolina by the late 1600s, it made planters rich on the skill of enslaved West African rice growers, then nearly vanished after 1900. It can cook up separate like long grain or turn creamy when stirred, closer to risotto rice.',
		madeWith: ['rice', 'often butter', 'sometimes stock'],
		origin: 'South Carolina Lowcountry, named for its golden hull in the field',
		recipe: 'carolina-gold-rice-pilau',
		seeAlso: ['fd_0008', 'fd_0186'],
		line: 'Carolina Gold rice pilau, shrimp, smoked sausage',
		traps: [
			{ says: 'Everyday white long grain tinted yellow with saffron or turmeric', why: 'The gold is the color of the hull in the field. The milled grain is white.' }
		]
	},
	{
		id: 'fd_0019',
		term: 'Pimento Cheese',
		say: 'pih-MEN-toh CHEEZ',
		gist: 'Sharp cheddar bound with mayonnaise and sweet red peppers',
		guest: "It's the South's favorite spread, sharp cheddar and sweet red peppers mashed with mayo. Rich, tangy and a little sweet, great on a cracker or a burger.",
		why: 'Grated cheddar is folded into mayonnaise with diced pimentos, small sweet red peppers sold roasted in jars. The mayo makes it creamy and spreadable, the cheddar brings tang. It began around 1900 as a Northern factory product and became a Southern staple.',
		madeWith: ['cheddar cheese', 'mayonnaise', 'egg', 'pimento pepper', 'sometimes cream cheese', 'sometimes hot sauce'],
		pairs: 'Saltine crackers, celery, fried green tomatoes, burgers',
		recipe: 'pimento-cheese',
		seeAlso: ['fd_0283'],
		line: 'Pimento cheese, pepper jelly, benne crackers',
		traps: [
			{ says: "Soft Spanish sheep's milk spread seasoned with smoked paprika", why: 'It is American cheddar with mayonnaise and mild sweet peppers, with no smoky paprika.' }
		]
	},
	{
		id: 'fd_0020',
		term: 'Cornbread',
		gist: 'Crusty skillet-baked quick bread of cornmeal and buttermilk',
		guest: "It's a cornmeal bread baked in a hot iron skillet, so the edges come out crisp and golden. Tender inside with a real toasted corn flavor, and best with butter.",
		why: 'Cornmeal, buttermilk and egg are leavened with baking soda and poured into a skillet already hot with fat, which fries the crust as it bakes. Southern versions are less sweet and more corn-forward. Northern ones are sweeter and cakier.',
		madeWith: ['cornmeal', 'buttermilk', 'egg', 'often butter', 'often bacon fat', 'sometimes wheat flour', 'sometimes sugar'],
		notThis: 'Not hoecakes, thin cornmeal cakes cooked on a griddle. Cornbread is poured into a pan and baked.',
		recipe: 'skillet-cornbread',
		seeAlso: ['fd_0021', 'fd_0015'],
		confusedWith: ['fd_0006'],
		line: 'Skillet cornbread, sorghum butter'
	},
	{
		id: 'fd_0021',
		term: 'Hushpuppies',
		gist: 'Deep-fried balls of cornmeal batter, served beside fried fish',
		guest: "They're little fritters of seasoned cornmeal batter, fried golden. Crunchy outside, soft and a bit oniony inside, and the classic side for fried fish.",
		why: 'A thick batter of cornmeal, buttermilk, egg and onion is dropped by the spoonful into hot oil, where it puffs into a crisp shell around a steamy, cakey middle. Think cornbread batter, fried. The tale of cooks tossing them to quiet dogs is folklore.',
		madeWith: ['cornmeal', 'buttermilk', 'egg', 'onion', 'often wheat flour', 'sometimes sugar'],
		note: 'Often fried in the same oil as the fish and shrimp. Ask the kitchen when a guest needs to know.',
		pairs: 'Fried catfish, fried shrimp, coleslaw, tartar sauce',
		recipe: 'fried-catfish-and-hushpuppies',
		seeAlso: ['fd_0020', 'fd_0004'],
		line: 'Fried catfish, hushpuppies, slaw, comeback sauce'
	},
	{
		id: 'fd_0022',
		term: 'Okra',
		gist: 'Ridged green seed pod, silky when stewed and crisp when fried',
		guest: "It's a green seed pod, a cousin of hibiscus. Fried, it's crisp and nutty, and simmered in a stew it turns silky and thickens the pot.",
		why: 'The pods hold a slippery sap, mucilage, released when they are cut and cooked in liquid. That is what thickens gumbo, a word from a Bantu name for okra. Frying and high heat keep it crisp. Acid, like tomato or vinegar, cuts the slick.',
		madeWith: ['okra', 'often cornmeal', 'often wheat flour', 'sometimes egg', 'sometimes buttermilk', 'often tomato'],
		origin: 'African plant, carried to the South through the slave trade',
		lexiconSlug: 'okra',
		recipe: 'fried-okra',
		seeAlso: ['fd_0013', 'fd_0024'],
		line: 'Cornmeal-fried okra, comeback sauce',
		traps: [
			{ says: 'Small green chili pepper, pickled whole and served for its heat', why: 'It is a mild seed pod with no heat, though it is often pickled alongside chilies.' }
		]
	},
	{
		id: 'fd_0023',
		term: 'Boiled Peanuts',
		gist: 'Raw groundnuts simmered in brine, shell on, until soft',
		guest: "They're a roadside Southern classic, peanuts simmered in the shell in salty water until soft like a bean. Crack one open and slurp the brine.",
		why: 'Best made with green peanuts, freshly dug and not dried. Hours of boiling in heavy brine soften the nut to a tender, buttery texture and salt it through the shell. They taste closer to a tender cooked bean than a roasted nut.',
		madeWith: ['peanuts', 'salt', 'sometimes cajun spice'],
		note: 'Served in the shell. Guests crack them open and set the shells aside, so bring a bowl.',
		origin: 'Southern roadside snack, the official state snack of South Carolina',
		recipe: 'boiled-peanuts',
		seeAlso: ['fd_0016'],
		line: 'Warm Cajun boiled peanuts, cold beer',
		traps: [
			{ says: 'Roasted groundnuts glazed with sugar and salt, served warm', why: 'They are boiled soft in salted water, never roasted, and eat like a tender bean.' }
		]
	},
	{
		id: 'fd_0024',
		term: 'Pepper Vinegar',
		aliases: ['Pepper Sauce', 'Hot Pepper Vinegar'],
		gist: 'Bottle of whole hot chilies steeped in sharp acid, for greens',
		guest: "It's a bottle of little hot peppers soaking in vinegar. A few shakes brighten greens or peas with a sharp, spicy tang, and it sits on most Southern tables.",
		why: 'Small hot peppers, often tabasco or bird chilies, are packed into a bottle and covered with white vinegar. Over days the vinegar takes on their heat while staying thin and clear, and the bottle is topped up as it empties. Its acid cuts pork-rich greens.',
		madeWith: ['white vinegar', 'hot chili', 'sometimes garlic', 'sometimes salt'],
		notThis: 'Not a blended hot sauce. It stays thin and clear, and the whole peppers stay in the bottle.',
		seeAlso: ['fd_0014', 'fd_0016', 'fd_0015'],
		line: 'Braised collards, pot likker, pepper vinegar',
		traps: [
			{ says: 'Thick red chili mash, fermented and aged for years in oak barrels', why: 'It is a quick steep of whole peppers in vinegar, thin and clear, not a fermented mash.' }
		]
	}
];

export default cards;
