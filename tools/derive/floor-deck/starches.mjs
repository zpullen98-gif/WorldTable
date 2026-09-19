/* The Floor Deck, section "starches". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0172',
		term: 'Agnolotti',
		say: 'an-yoh-LOH-tee',
		packet: true,
		gist: 'Pinched pockets of Piedmontese egg pasta, stuffed with roast meat',
		guest: "They're little pinched pillows of fresh egg pasta from Piedmont, classically filled with roast meat. Small, tender, and made to soak up the sauce.",
		why: 'A long strip of egg dough is folded over a line of filling, then pinched and cut into bite-size pockets, so each one has a ruffled edge that grabs sauce. The classic filling is leftover braised or roast meat, so they eat richer than cheese ravioli.',
		madeWith: ['wheat flour', 'egg', 'traditionally veal', 'often pork', 'often parmesan', 'sometimes butter'],
		origin: 'Piedmont, northern Italy; pinched ones are agnolotti del plin, plin meaning pinch',
		notThis: 'Not ravioli, which are larger squares sealed between two sheets, and not tortellini, which are rings wrapped around a finger.',
		confusedWith: ['fd_0191', 'fd_0192'],
		line: 'Veal agnolotti, brown butter, sage, parmesan',
		traps: [
			{ says: 'Large baked tubes of dried pasta, stuffed with ricotta and spinach', why: 'They are small pinched pockets of fresh egg pasta, boiled rather than baked.' }
		]
	},
	{
		id: 'fd_0173',
		term: 'Buckwheat',
		packet: true,
		gist: 'Dark, earthy seed of a plant related to rhubarb, not a true grain',
		guest: "It's the dark, earthy seed of a plant related to rhubarb, ground into flour for crepes and noodles. It tastes toasty, a bit like dark rye.",
		why: 'The three-sided seeds are hulled into groats, eaten whole or ground into flour. Toasted groats, called kasha, taste deep and nutty. The flour is gray and earthy, the backbone of Japanese soba, Breton galettes and Russian blini.',
		madeWith: ['buckwheat', 'sometimes wheat flour', 'sometimes egg', 'sometimes milk', 'sometimes butter'],
		note: 'Soba, blini and many buckwheat crepes are blended with wheat flour, so ask the kitchen what is in each one.',
		origin: 'From Dutch boekweit, beech wheat, for seeds shaped like beechnuts',
		lexiconSlug: 'buckwheat',
		recipe: 'buckwheat-cakes',
		seeAlso: ['fd_0246', 'fd_0180'],
		line: 'Buckwheat crepe, ham, gruyere, fried egg',
		traps: [
			{ says: 'A dark variety of rye, ground coarse for a sour, malty taste', why: 'It is not rye or any grass; it is the seed of a plant in the rhubarb family.' }
		]
	},
	{
		id: 'fd_0174',
		term: 'Bulgur',
		say: 'BUHL-ger',
		packet: true,
		gist: 'Wheat parboiled, dried and cracked, so it softens in minutes',
		guest: "It's cracked wheat that's already been cooked once, so it's light and fluffy with a nutty chew. It's the grain in tabbouleh.",
		why: 'Whole wheat kernels are boiled, dried and cracked into fine, medium or coarse bits. Because the starch is cooked before it is cracked, it only needs soaking or a short simmer, and the grains stay separate and chewy rather than going mushy.',
		madeWith: ['wheat', 'often olive oil', 'often parsley'],
		origin: 'Turkey and the Levant; the grain behind tabbouleh, kibbeh and pilaf',
		notThis: 'Not couscous, which is tiny rolled pasta made from semolina. Bulgur is broken grain and eats nuttier and chewier.',
		confusedWith: ['fd_0187', 'fd_0188'],
		line: 'Tabbouleh, bulgur, parsley, mint, lemon',
		traps: [
			{ says: 'Raw cracked wheat that needs an hour of simmering to soften', why: 'It is cooked before it is cracked, so a soak or a few minutes of simmering is enough.' }
		]
	},
	{
		id: 'fd_0175',
		term: 'Farro',
		say: 'FAHR-oh',
		packet: true,
		gist: 'Ancient hulled wheat, usually emmer, with a big chewy, nutty grain',
		guest: "It's an ancient Italian wheat with a big, chewy grain and a nutty flavor. It holds its bite, so it's great in salads and risotto-style dishes.",
		why: 'It is hulled wheat, mostly emmer, whose husk clings to the grain. Pearled farro has the bran rubbed off and cooks in about 20 minutes. Whole farro keeps it and takes longer, staying firmer and nuttier. Think brown rice with more bounce.',
		madeWith: ['emmer wheat', 'sometimes spelt'],
		pairs: 'Mushrooms, roasted squash, pecorino, grain salads',
		notThis: 'Not barley, though it looks similar. On Italian labels piccolo means einkorn, medio emmer and grande spelt.',
		lexiconSlug: 'farro',
		seeAlso: ['fd_0188'],
		confusedWith: ['fd_0176'],
		line: 'Farro salad, roasted squash, pecorino, brown butter',
		traps: [
			{ says: 'A heritage variety of barley with a big, chewy, nutty grain', why: 'It is a hulled wheat, most often emmer, not a barley.' }
		]
	},
	{
		id: 'fd_0176',
		term: 'Farro Piccolo',
		say: 'FAHR-oh PEE-koh-loh',
		aliases: ['Einkorn'],
		packet: true,
		gist: 'Tiny, tender grain of one of the very first wheats ever farmed',
		guest: "It's einkorn, one of the oldest wheats people farmed. The grains are tiny and tender, with a mild, sweet, nutty flavor.",
		why: 'Piccolo is einkorn, one of the first wheats people farmed, about ten thousand years ago. Its kernels are small, so it cooks faster and eats softer and sweeter than everyday farro, which is emmer. It is a true wheat, just an old one.',
		madeWith: ['einkorn wheat'],
		origin: 'Italian for small farro; einkorn, first farmed in what is now Turkey',
		notThis: 'Not plain farro, which is usually emmer with a bigger, chewier grain. Piccolo on the label is what marks it.',
		lexiconSlug: 'farro',
		confusedWith: ['fd_0175'],
		line: 'Einkorn risotto, spring peas, lemon, parmesan',
		traps: [
			{ says: 'A modern hybrid of wheat and rye, bred for a tiny, tender kernel', why: 'It is one of the first farmed wheats, not a modern cross, and nothing to do with rye.' }
		]
	},
	{
		id: 'fd_0177',
		term: 'Gnocchi',
		say: 'NYOH-kee',
		packet: true,
		gist: 'Soft little dumplings of riced potato bound with a bit of flour',
		guest: "They're soft little potato dumplings, light and pillowy. Think of the best mashed potato shaped into bite-size pieces.",
		why: 'Baked or boiled potato is riced, then kneaded with just enough flour to hold. Less flour and a light hand keep them tender. Too much work makes them dense. They boil in about two minutes, and many kitchens then sear them for a crisp edge.',
		madeWith: ['potato', 'wheat flour', 'often egg', 'sometimes ricotta', 'often parmesan', 'often butter'],
		pairs: 'Brown butter and sage, tomato sauce, gorgonzola cream, pesto',
		notThis: 'Not rolled pasta, though flour binds them. Ricotta gnocchi swap potato for cheese, and gnocchi alla romana are baked semolina discs.',
		recipe: 'gnocchi-di-patate-from-baked-potato',
		seeAlso: ['fd_0165', 'fd_0184', 'fd_0193'],
		line: 'Potato gnocchi, brown butter, sage, parmesan'
	},
	{
		id: 'fd_0178',
		term: 'Grits',
		packet: true,
		gist: 'Coarsely ground dried corn, slow-cooked into a Southern porridge',
		guest: "Grits are ground dried corn slow-cooked until creamy, often finished with butter. It's the South's comfort food, and great under shrimp.",
		why: 'Dried corn, often dent corn or lime-treated hominy, is ground coarse and simmered in water or milk until the starch swells. Stone-ground grits keep the germ, so they taste more of corn and take up to an hour. Instant grits cook in minutes and taste flat.',
		madeWith: ['corn', 'often butter', 'often milk', 'sometimes cheese', 'sometimes cream'],
		pairs: 'Shrimp, grillades, fried eggs, country ham, red-eye gravy',
		notThis: 'Not polenta, the Italian cousin. Grits are Southern, often from white corn, and usually cooked looser and butterier.',
		recipe: 'lowcountry-shrimp-and-grits',
		confusedWith: ['fd_0179', 'fd_0007'],
		line: 'Shrimp and grits, tasso gravy, scallions',
		traps: [
			{ says: 'Coarse cracked wheat simmered in milk into a breakfast porridge', why: 'It is made from ground dried corn, not wheat, so it tastes of corn.' }
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
		id: 'fd_0179',
		term: 'Polenta',
		say: 'poh-LEN-tuh',
		packet: true,
		gist: 'Italian cornmeal cooked into a porridge, served soft or set and grilled',
		guest: "It's Italian cornmeal slow-cooked until creamy, often with butter and cheese. Served soft it's like a savory corn pudding, and set and grilled it gets a crisp crust.",
		why: 'Dried corn is ground to meal and stirred into simmering liquid until the starch swells. Served soft, it is spoonable and creamy. Left to cool, it sets firm and can be sliced, then grilled or fried. Coarse meal tastes more of corn and takes longer.',
		madeWith: ['cornmeal', 'often butter', 'often parmesan', 'sometimes milk'],
		origin: 'Northern Italy; Latin polenta meant barley meal, long before corn arrived',
		pairs: 'Braised meats, mushrooms, ragu, gorgonzola',
		notThis: 'Not grits, the Southern cousin. Polenta is usually yellow corn and is served soft or set firm.',
		lexiconSlug: 'polenta',
		seeAlso: ['fd_0184'],
		confusedWith: ['fd_0178'],
		line: 'Braised short rib, soft polenta, gremolata'
	},
	{
		id: 'fd_0180',
		term: 'Quinoa',
		say: 'KEEN-wah',
		packet: true,
		gist: 'Tiny Andean seed that cooks up fluffy with a little curled tail',
		guest: "It's a tiny seed from the Andes, cooked like rice. It's light and fluffy with a gentle pop and a nutty, earthy flavor.",
		why: 'Not a grass grain at all but the seed of a plant related to spinach and beets. Simmered, each seed turns translucent and its germ loosens into a white spiral, which gives the soft pop. It is lighter than rice or farro and carries dressings well.',
		madeWith: ['quinoa', 'often olive oil', 'sometimes stock'],
		note: "The seed's natural coating is bitter and soapy, so it is rinsed before cooking. Most sold today comes prewashed.",
		origin: 'Andes of Bolivia and Peru, grown there for thousands of years',
		notThis: 'Not couscous, which is tiny pasta rolled from wheat. Quinoa is a seed, and each one shows a little curled tail.',
		lexiconSlug: 'quinoa',
		seeAlso: ['fd_0173', 'fd_0175'],
		confusedWith: ['fd_0187'],
		line: 'Red quinoa, roasted squash, pepitas, lemon',
		traps: [
			{ says: 'Small cracked grain of barley that is cooked and served like rice', why: 'It is not a cereal grass at all, but the seed of a plant related to spinach and beets.' }
		]
	},
	{
		id: 'fd_0181',
		term: 'Risotto',
		say: 'rih-ZOH-toh',
		packet: true,
		gist: 'Italian rice stirred with hot broth until creamy from its own starch',
		guest: "It's Italian rice stirred slowly in broth until it turns creamy on its own, then finished with butter and parmesan. Rich, with a little bite.",
		why: 'Short, starchy rice is toasted in fat, then fed hot broth a ladle at a time. The stirring rubs starch off each grain into the liquid, making a sauce with no cream, while the core stays firm. Butter and cheese beaten in at the end make it glossy.',
		madeWith: ['rice', 'stock', 'butter', 'parmesan', 'onion', 'often white wine'],
		note: 'It keeps thickening as it sits, so run it to the table the moment it is up.',
		origin: 'Northern Italy, from riso, the Italian word for rice',
		pairs: 'Saffron, mushrooms, seafood, spring peas, osso buco',
		recipe: 'risotto-alla-milanese',
		seeAlso: ['fd_0186', 'fd_0182', 'fd_0183'],
		line: 'Wild mushroom risotto, aged parmesan, thyme',
		traps: [
			{ says: 'Italian rice dish whose creaminess comes from added heavy cream', why: 'The creaminess is starch rubbed off the rice by stirring, plus butter and cheese at the end.' }
		]
	},
	{
		id: 'fd_0182',
		term: 'Carnaroli',
		say: 'kar-nah-ROH-lee',
		packet: true,
		gist: 'Long, firm Italian risotto rice variety bred near Milan in 1945',
		guest: "It's the rice many Italian chefs choose for risotto. It turns just as creamy but each grain stays distinct with a pleasant bite.",
		why: 'An Italian superfino rice bred near Milan in the 1940s. Its outside sheds plenty of starch for creaminess, but the grain is longer and firmer than arborio and holds its shape, so the risotto is more forgiving and less likely to turn mushy.',
		madeWith: ['rice'],
		origin: 'Bred in Lombardy in 1945, grown in Piedmont and Lombardy',
		notThis: 'Not arborio, the plumper, softer risotto rice. Carnaroli grains are longer and stay firmer in the pan.',
		seeAlso: ['fd_0181', 'fd_0183'],
		confusedWith: ['fd_0186'],
		line: 'Carnaroli risotto, saffron, bone marrow',
		traps: [
			{ says: 'Short, round Spanish rice grown for paella, cooked without stirring', why: 'It is an Italian risotto rice, and paella rice such as bomba comes from Spain.' }
		]
	},
	{
		id: 'fd_0183',
		term: 'Acquerello',
		say: 'ah-kweh-REL-oh',
		packet: true,
		gist: 'Husk-aged risotto rice brand, its germ put back once milled',
		guest: "It's a prized Italian risotto rice, aged at least a year before milling, so the grains stay firm and soak up the broth.",
		why: 'A carnaroli rice from one family estate near Vercelli in Piedmont. It is aged in the husk at least a year, which firms the starch so grains absorb broth without splitting. After milling, the germ is blended back in, adding nutrients and a little nuttiness.',
		madeWith: ['rice'],
		origin: 'Tenuta Colombara estate in Piedmont, Italian for watercolor',
		notThis: 'Not a variety but a brand: aged carnaroli from a single Piedmont estate, sold in tins.',
		seeAlso: ['fd_0181', 'fd_0186'],
		confusedWith: ['fd_0182'],
		line: 'Aged Acquerello risotto, white truffle, parmesan',
		traps: [
			{ says: 'Black Italian whole-grain rice with a nutty, chewy bran coat', why: 'It is a polished white rice with its germ added back, not a black whole-grain rice.' }
		]
	},
	{
		id: 'fd_0184',
		term: 'Semolina',
		say: 'seh-muh-LEE-nuh',
		packet: true,
		gist: 'Coarse, sandy golden meal milled from hard durum wheat',
		guest: "It's coarse, golden flour milled from hard durum wheat, what most dried pasta is made from. It gives pasta and bread a firm bite and a warm yellow color.",
		why: 'Durum wheat is so hard that milling shatters it into sandy, yellow grit instead of soft powder. Its strong protein makes a dough that holds its shape through drying and boiling, which is why dried pasta and couscous rely on it. It also dusts pizza peels.',
		madeWith: ['durum wheat'],
		origin: 'Italian semola, from Latin for fine flour',
		notThis: 'Not cornmeal or polenta, though all three are yellow and gritty. Semolina is wheat, cornmeal is corn.',
		lexiconSlug: 'semolina',
		seeAlso: ['fd_0187', 'fd_0177'],
		confusedWith: ['fd_0179'],
		line: 'Hand-rolled semolina cavatelli, tomato, basil',
		traps: [
			{ says: 'Fine, powdery white flour from soft wheat, for cakes', why: 'It is coarse and yellow, from hard durum wheat, the opposite of soft cake flour.' }
		]
	},
	{
		id: 'fd_0185',
		term: 'Tagliatelle',
		say: 'tahl-yah-TEL-ay',
		packet: true,
		gist: 'Long, flat ribbons of fresh egg pasta, the classic from Bologna',
		guest: "They're long, flat ribbons of fresh egg pasta from Bologna, classic with a slow meat ragu. Silky and tender, and the sauce clings to them.",
		why: 'Egg and flour dough is rolled into thin sheets and cut into ribbons about 7 to 8 millimeters wide. The egg makes them rich and tender, and the rolled surface is porous, so a meaty sauce clings. Narrower than pappardelle, much like fettuccine.',
		madeWith: ['wheat flour', 'egg'],
		origin: 'Emilia-Romagna, from tagliare, Italian for to cut',
		pairs: 'Ragu Bolognese, butter and parmesan, mushrooms, truffle',
		notThis: 'Not pappardelle, which are about three times as wide. Tagliatelle are close to fettuccine, the Roman name.',
		recipe: 'fresh-egg-pasta-tagliatelle-master',
		seeAlso: ['fd_0184'],
		confusedWith: ['fd_0190'],
		line: 'Tagliatelle Bolognese, aged parmesan',
		traps: [
			{ says: 'Thin, round dried strands made from flour and water alone', why: 'They are flat ribbons, classically fresh and made with egg.' }
		]
	},
	{
		id: 'fd_0186',
		term: 'Arborio',
		say: 'ar-BOR-ee-oh',
		gist: 'Plump, pearly short-grain Italian rice, the best known for risotto',
		guest: "It's the classic Italian risotto rice. The plump grains release lots of starch, so the dish turns rich and creamy.",
		why: 'A superfino rice named for the town of Arborio in Piedmont. Its fat grains have a chalky white core and shed surface starch readily, which thickens the broth into a creamy sauce. It softens sooner than carnaroli, so timing matters.',
		madeWith: ['rice'],
		origin: 'Named for the town of Arborio, Vercelli, Piedmont',
		notThis: 'Not carnaroli, the longer, firmer grain many chefs prefer. Arborio is rounder and turns soft sooner.',
		lexiconSlug: 'arborio-rice',
		seeAlso: ['fd_0181', 'fd_0183'],
		confusedWith: ['fd_0182'],
		line: 'Arborio risotto, spring peas, parmesan',
		traps: [
			{ says: 'Long, slender Italian rice cooked like pilaf so the grains stay apart', why: 'It is short and plump, bred to release starch and turn creamy, not stay separate.' }
		]
	},
	{
		id: 'fd_0187',
		term: 'Couscous',
		say: 'KOOS-koos',
		gist: 'Tiny steamed beads of rolled semolina from North Africa',
		guest: "It's tiny wheat pasta from North Africa, steamed until light and fluffy. It soaks up the broth of whatever stew it's served with.",
		why: 'Durum semolina is sprinkled with water and rolled by hand or machine into tiny granules, then dried. Steamed, often over a simmering stew, the beads swell and fluff apart. Most sold today is precooked and only needs soaking in boiling liquid.',
		madeWith: ['durum wheat', 'often butter', 'sometimes olive oil'],
		origin: 'The Maghreb: Morocco, Algeria and Tunisia',
		pairs: 'Tagine, lamb, merguez, seven vegetables, harissa',
		notThis: 'Not a grain like bulgur or a seed like quinoa. It is pasta made from wheat. Pearl couscous is a larger, toasted pasta.',
		lexiconSlug: 'couscous',
		recipe: 'seven-vegetable-couscous',
		seeAlso: ['fd_0184'],
		confusedWith: ['fd_0180', 'fd_0174'],
		line: 'Lamb tagine, apricot, saffron couscous',
		traps: [
			{ says: 'Tiny whole grain harvested from a North African grass', why: 'It is a pasta, rolled from wheat semolina, not a whole grain.' }
		]
	},
	{
		id: 'fd_0188',
		term: 'Freekeh',
		say: 'FREE-kuh',
		aliases: ['Farik', 'Frikeh'],
		gist: 'Green wheat roasted over fire, then rubbed clean and often cracked',
		guest: "It's young wheat picked green and roasted over fire, so it tastes a little smoky. It cooks up chewy and nutty, like a toasty cousin of bulgur.",
		why: 'The wheat, usually durum, is cut while still green and soft, piled and set alight so the straw and chaff burn off while the moist kernels only char. The kernels are rubbed clean and often cracked. That early harvest and fire give a firm chew and a smoky, grassy flavor.',
		madeWith: ['green wheat', 'often butter', 'sometimes chicken stock'],
		origin: 'The Levant and Egypt; from Arabic farik, meaning rubbed',
		pairs: 'Roast lamb, chicken, yogurt, herbs and pomegranate',
		notThis: 'Not bulgur, which is ripe wheat parboiled, dried and cracked, with no smoke. Freekeh tastes of the fire.',
		seeAlso: ['fd_0175'],
		confusedWith: ['fd_0174'],
		line: 'Freekeh salad, charred eggplant, herbs, yogurt',
		traps: [
			{ says: 'An ancient grain species of its own, with no relation to wheat at all', why: 'It is ordinary wheat, usually durum, just harvested green and roasted.' }
		]
	},
	{
		id: 'fd_0189',
		term: 'Wild Rice',
		gist: 'Long black seed of a North American lake grass, firm and nutty',
		guest: "It's the seed of a grass that grows in northern lakes, not true rice. It's chewy and nutty, with a toasty, almost tea-like flavor.",
		why: 'It comes from Zizania, a water grass native to the Great Lakes, gathered by canoe by the Ojibwe, who call it manoomin. Most sold today is paddy grown in Minnesota and California. The hard dark bran coat keeps it chewy, and cooked grains split to show white inside.',
		madeWith: ['wild rice', 'often butter', 'sometimes chicken stock', 'sometimes mushroom'],
		note: 'Takes 45 to 60 minutes to cook, so kitchens make it ahead. Split grains are a sign it is done.',
		pairs: 'Duck, game birds, mushrooms, dried cranberries',
		notThis: 'Not black rice, which is a true Asian rice whose dark color sits in its bran.',
		lexiconSlug: 'wild-rice',
		recipe: 'minnesota-wild-rice-soup',
		seeAlso: ['fd_0056'],
		line: 'Roast duck, wild rice, cherries, pan jus',
		traps: [
			{ says: 'Dark whole-grain Asian paddy grain, with the bran layer left on', why: 'It is not an Asian grain or even true rice; it is a North American water grass.' }
		]
	},
	{
		id: 'fd_0190',
		term: 'Pappardelle',
		say: 'pah-pahr-DEL-ay',
		gist: 'Very wide, flat ribbons of fresh egg pasta, made for heavy meat sauces',
		guest: "They're wide, silky ribbons of fresh egg pasta. They're built to carry a rich, slow-cooked sauce, so every forkful gets plenty of it.",
		why: 'Fresh egg dough is rolled thin and cut into ribbons about two to three centimeters wide. The width and the egg make them tender but sturdy, with lots of surface to hold a chunky braise. Tuscany serves them with wild boar, hare or duck ragu.',
		madeWith: ['wheat flour', 'egg'],
		origin: 'Tuscany, Italy; from pappare, to gobble up',
		pairs: 'Wild boar, hare or duck ragu, mushrooms, braised short rib',
		notThis: 'Not tagliatelle, which is the same egg dough cut about a third as wide.',
		recipe: 'pappardelle-al-ragu-di-cinghiale',
		confusedWith: ['fd_0185'],
		line: 'Pappardelle, wild boar ragu, pecorino'
	},
	{
		id: 'fd_0191',
		term: 'Ravioli',
		gist: 'Square pillows of pasta, two sheets pressed together around a filling',
		guest: "They're little pillows of fresh pasta sealed around a filling, often ricotta or meat. Soft and rich inside, with a tender bite of pasta around it.",
		why: 'A spoonful of filling goes on one sheet of fresh dough, a second sheet goes over it, and the pillows are pressed and cut apart. That gives a flat, sealed edge on every side. Ricotta and spinach is the classic, but meat, squash and cheese are common too.',
		madeWith: ['wheat flour', 'egg', 'often ricotta', 'often parmesan', 'sometimes meat'],
		note: "Fillings change by kitchen and by day. Check tonight's filling before describing it.",
		pairs: 'Brown butter and sage, tomato sauce, parmesan',
		notThis: 'Agnolotti fold one sheet over the filling and pinch, so they have a fold on one side.',
		recipe: 'ravioli-di-ricotta-the-seal',
		seeAlso: ['fd_0165', 'fd_0161'],
		confusedWith: ['fd_0172', 'fd_0192'],
		line: 'Ricotta ravioli, brown butter, sage'
	},
	{
		id: 'fd_0192',
		term: 'Tortellini',
		say: 'tor-tuh-LEE-nee',
		gist: 'Small rings of stuffed egg pasta, twisted around a fingertip',
		guest: "They're little rings of fresh pasta, classically filled with pork and parmesan. In Bologna they come floating in a rich, clear broth.",
		why: 'A tiny square of egg dough gets a dab of filling, is folded to a triangle, then wrapped around a fingertip and pinched into a ring. The Bologna filling is pork loin, prosciutto, mortadella and parmesan. Small and dense, they are meant for broth.',
		madeWith: ['wheat flour', 'egg', 'pork', 'mortadella', 'sometimes pistachio', 'parmesan', 'often chicken broth'],
		origin: 'Bologna and Modena, Italy; a small tortello, from torta, a pie',
		notThis: 'Not ravioli, which are flat sealed pillows. Tortelloni are bigger rings, often ricotta-filled.',
		recipe: 'tortellini-in-brodo-di-cappone',
		seeAlso: ['fd_0159'],
		confusedWith: ['fd_0191', 'fd_0172'],
		line: 'Tortellini in brodo, parmesan'
	},
	{
		id: 'fd_0193',
		term: 'Cavatelli',
		say: 'kah-vuh-TEL-ee',
		gist: 'Short semolina dough curls shaped like tiny split hot dog buns',
		guest: "They're little hand-rolled pasta curls from southern Italy, like tiny hot dog buns. Dense and chewy, and the hollow holds sauce.",
		why: 'A rope of semolina and water dough is cut into short pieces, and each is pulled with a fingertip or a small wooden board so it curls around a hollow. Durum semolina and water give a firm, chewy bite, more like a dumpling than a noodle.',
		madeWith: ['durum wheat semolina', 'sometimes ricotta', 'sometimes egg', 'often sausage'],
		origin: 'Molise and Puglia, Italy; from cavare, to hollow out',
		pairs: 'Sausage and broccoli rabe, tomato sauce, ricotta',
		notThis: 'Not gnocchi, which are soft potato dumplings, and not orecchiette, which are round cupped ears. These are short curls with a slit.',
		seeAlso: ['fd_0184'],
		confusedWith: ['fd_0177', 'fd_0194'],
		line: 'Cavatelli, sausage, broccoli rabe, chili'
	},
	{
		id: 'fd_0194',
		term: 'Orecchiette',
		say: 'or-uh-kee-ET-ay',
		gist: 'Small cupped disks of semolina dough, thin in the middle',
		guest: "The name means little ears. They're small cupped pasta from Puglia, chewy at the rim and tender in the middle, and the cup scoops up sauce.",
		why: 'Semolina and water dough is cut into small nubs, dragged across a board with a knife so each one curls, then flipped inside out over a thumb. That leaves a rough outside, a thin center and a thick rim, so one piece eats both tender and chewy.',
		madeWith: ['durum wheat semolina', 'often garlic', 'sometimes anchovy', 'sometimes sausage'],
		origin: 'Puglia, Italy; Italian for little ears',
		pairs: 'Broccoli rabe, garlic, anchovy and chili; sausage',
		notThis: 'Cavatelli are curled like a shell. These are round and domed like a small ear.',
		recipe: 'orecchiette-dragged-with-a-knife',
		seeAlso: ['fd_0184'],
		confusedWith: ['fd_0193'],
		line: 'Orecchiette, broccoli rabe, anchovy, chili',
		traps: [
			{ says: 'Rich egg-yolk dough stamped into tiny domes with a round cutter', why: 'It is semolina and water dough, dragged by knife and shaped over a thumb.' }
		]
	}
];

export default cards;
