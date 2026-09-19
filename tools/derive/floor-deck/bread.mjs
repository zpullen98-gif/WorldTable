/* The Floor Deck, section "bread". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0234',
		term: 'Beignets',
		level: 2,
		say: 'ben-YAYZ',
		packet: true,
		gist: 'Squares of yeasted dough, deep-fried and buried in powdered sugar',
		guest: "They're little squares of sweet dough fried until they puff up hollow, then heaped with powdered sugar. Best eaten hot.",
		why: 'A soft, lightly sweet yeast dough is rolled thin, cut into squares and dropped into hot oil. Steam puffs each one into a pillow with a crisp shell and an airy, hollow middle. Lighter and less sweet than a doughnut, so the sugar on top does most of the work.',
		madeWith: ['wheat flour', 'milk', 'egg', 'butter or shortening', 'sugar', 'yeast'],
		origin: 'French word for fritter, made famous in New Orleans',
		pairs: 'Chicory coffee, café au lait, chocolate or caramel dipping sauce',
		recipe: 'beignets',
		seeAlso: ['fd_0243'],
		line: 'Warm beignets, powdered sugar, chicory crème anglaise',
		traps: [
			{ says: 'Thin French pancakes folded around sugar, fruit or chocolate', why: 'They are fried puffs of yeast dough, not pancakes cooked flat on a griddle.' }
		]
	},
	{
		id: 'fd_0235',
		term: 'Brioche',
		level: 1,
		say: 'bree-OHSH',
		packet: true,
		gist: 'Soft, golden French loaf enriched with plenty of eggs and butter',
		guest: "It's a French bread made rich with eggs and butter, so it's soft, golden and a little sweet. Almost halfway between bread and cake.",
		why: "The dough is kneaded first, then butter is worked in bit by bit, often a third or more of the flour's weight, with plenty of egg. The fat and yolk make a tender, cottony crumb and a deep brown crust. It toasts fast, which is why it carries burgers and French toast.",
		madeWith: ['wheat flour', 'butter', 'egg', 'milk', 'sugar', 'yeast'],
		pairs: 'Burgers, lobster rolls, French toast, foie gras, jam and coffee',
		recipe: 'brioche-nanterre',
		seeAlso: ['fd_0237', 'fd_0244'],
		line: 'Toasted brioche, foie gras torchon, fig jam',
		traps: [
			{ says: 'Flaky crescent roll built from many thin layers of butter and dough', why: 'Its butter is kneaded into the dough, so it is soft and cakey, not flaky and layered.' }
		]
	},
	{
		id: 'fd_0236',
		term: 'Focaccia',
		level: 1,
		say: 'foh-KAH-chuh',
		packet: true,
		gist: 'Thick, dimpled Italian flatbread baked in a pan pooled with olive oil',
		guest: "It's an Italian flatbread baked in lots of olive oil, crisp on the bottom and soft inside, usually topped with salt and rosemary.",
		why: 'A wet yeast dough is pressed into a well-oiled pan and dimpled with fingertips so oil and salt pool in the holes. The oil fries the base and edges crisp while the thick middle stays open and springy. Taller and softer than pizza, and served as bread.',
		madeWith: ['wheat flour', 'olive oil', 'yeast', 'salt', 'often rosemary'],
		origin: 'Italy, famed in Liguria. Latin for hearth',
		pairs: 'Olive oil, cured meats, soft cheese, sandwiches, antipasti',
		recipe: 'rosemary-focaccia',
		seeAlso: ['fd_0237'],
		line: 'Warm rosemary focaccia, whipped ricotta, sea salt',
		traps: [
			{ says: 'Thin, crisp flatbread topped with tomato sauce and melted cheese', why: 'It is thick and soft, usually dressed with just oil, salt and herbs rather than sauce and cheese.' }
		]
	},
	{
		id: 'fd_0237',
		term: 'Sourdough',
		level: 1,
		packet: true,
		gist: 'Tangy bread raised by a living starter of wild yeast and bacteria',
		guest: "It's bread raised with a natural starter instead of packaged yeast, which gives it a gentle tang, a chewy crumb and a crackly crust.",
		why: 'A starter is flour and water kept alive for years, full of wild yeasts that lift the dough and bacteria that make lactic and acetic acid. The slow rise builds the tang, a chewy, open crumb and a thick crust, and the acid helps the loaf keep longer than a quick yeast bread.',
		madeWith: ['wheat flour', 'water', 'salt', 'sometimes rye flour'],
		origin: 'Ancient method, famous in San Francisco since the Gold Rush',
		pairs: 'Cultured butter, olive oil, soups, toast, grilled cheese',
		lexiconSlug: 'fermentation-in-bread-yeast-levain-preferments',
		recipe: 'country-sourdough-loaf',
		seeAlso: ['fd_0236', 'fd_0235'],
		line: 'Grilled sourdough, cultured butter, flaky salt',
		traps: [
			{ says: 'Bread made sour by mixing vinegar or buttermilk into the dough', why: "The sourness comes from fermentation by the starter's bacteria, not from anything poured in." }
		]
	},
	{
		id: 'fd_0020',
		term: 'Cornbread',
		level: 1,
		gist: 'Crusty skillet-baked quick bread of cornmeal and buttermilk',
		guest: "It's a cornmeal bread baked in a hot iron skillet, so the edges come out crisp and golden. Tender inside with a real toasted corn flavor, and best with butter.",
		why: 'Cornmeal, buttermilk and egg are leavened with baking soda and poured into a skillet already hot with fat, which fries the crust as it bakes. Southern versions are less sweet and more corn-forward. Northern ones are sweeter and cakier.',
		madeWith: ['cornmeal', 'buttermilk', 'egg', 'often butter', 'often bacon fat', 'sometimes wheat flour', 'sometimes sugar'],
		notThis: 'Not polenta, cornmeal stirred into a porridge. Cornbread is a batter, poured into a hot pan and baked.',
		recipe: 'skillet-cornbread',
		seeAlso: ['fd_0179'],
		line: 'Skillet cornbread, sorghum butter'
	},
	{
		id: 'fd_0238',
		term: 'Macaron',
		level: 2,
		say: 'mah-kah-ROHN',
		packet: true,
		gist: 'Pair of smooth pastel almond meringue shells joined by a filling',
		guest: "It's a little French sandwich cookie of almond meringue, crisp outside and chewy inside, filled with ganache, buttercream or jam.",
		why: 'Almond flour and sugar are folded into whipped egg whites, piped into rounds and rested until a skin forms, so they bake with a smooth dome and a ruffled foot. Sandwiched and left overnight, the filling softens the shells into that crisp, then chewy bite.',
		madeWith: ['almond flour', 'egg white', 'sugar', 'often butter', 'sometimes cream', 'sometimes chocolate'],
		origin: 'France, perfected in Paris pastry shops',
		notThis: 'Not a macaroon, the single craggy mound of coconut. A macaron is smooth, round and filled.',
		seeAlso: ['fd_0240', 'fd_0251'],
		confusedWith: ['fd_0239'],
		line: 'Pistachio and raspberry macarons',
		traps: [
			{ says: 'Crisp rolled wafer of almond and butter, curled while still warm', why: 'It is a pair of smooth, domed almond shells joined by a filling.' }
		]
	},
	{
		id: 'fd_0239',
		term: 'Macaroon',
		level: 2,
		say: 'mack-uh-ROON',
		packet: true,
		gist: 'Craggy, chewy mound of sweetened shredded coconut and egg white',
		guest: "It's a chewy coconut cookie, toasty on the outside and soft in the middle, often with the bottom dipped in chocolate.",
		why: 'Shredded coconut is bound with egg white and sugar, sometimes condensed milk, then scooped into mounds and baked until the peaks brown. The sugary whites set around the coconut, so it eats dense, moist and chewy, closer to candy than to a crisp cookie.',
		madeWith: ['coconut', 'egg white', 'sugar', 'often condensed milk', 'sometimes wheat flour', 'sometimes chocolate'],
		origin: 'From Italian maccarone, a paste. In America it means coconut',
		notThis: 'Not a macaron, the smooth filled almond sandwich. A macaroon is one rough, chewy coconut mound.',
		confusedWith: ['fd_0238'],
		line: 'Chocolate-dipped coconut macaroons, sea salt',
		traps: [
			{ says: 'Two little sponge cakes sandwiched together with cream or jam', why: 'It is a single mound of coconut and egg white, not a filled sandwich of any kind.' }
		]
	},
	{
		id: 'fd_0240',
		term: 'Meringue',
		level: 1,
		say: 'muh-RANG',
		packet: true,
		gist: 'Egg whites whipped stiff with sugar, then baked crisp or torched soft',
		guest: "It's egg whites whipped with sugar into a glossy foam. Baked, it turns crisp and melts away, and toasted on a pie it stays soft like marshmallow.",
		why: "Whipping unfolds the white's proteins around air bubbles, and sugar holds the foam firm. Baked low and slow it dries crisp and airy; browned fast on a pie or baked Alaska it stays soft inside. Swiss and Italian styles heat the whites as they whip, for a denser, glossier foam.",
		madeWith: ['egg white', 'sugar', 'sometimes cream of tartar'],
		note: 'A soft, torched topping can be only lightly cooked inside. Ask the kitchen which style it is.',
		pairs: 'Lemon curd, berries, whipped cream, pie, baked Alaska',
		lexiconSlug: 'meringues-french-swiss-italian',
		recipe: 'cooked-meringue-italian-and-swiss',
		seeAlso: ['fd_0247', 'fd_0238', 'fd_0248'],
		line: 'Lemon tart, torched meringue, blackberry',
		traps: [
			{ says: 'Whole eggs and flour whipped into a light sponge, baked in a tall pan', why: 'It is whites whipped with sugar into an airy foam, not a whole-egg flour batter.' }
		]
	},
	{
		id: 'fd_0241',
		term: 'Tart',
		level: 1,
		aliases: ['Tarte'],
		packet: true,
		gist: 'Shallow open pastry shell with straight sides, filled and unmolded',
		guest: "It's a crisp, buttery pastry shell with no lid, filled with something like lemon curd, fruit or chocolate. Think of a pie's more elegant cousin.",
		why: 'A short, buttery dough is pressed into a shallow ring with straight, often fluted sides, often baked empty first so it stays crisp, then filled. It stands on its own out of the pan, so each slice is mostly filling over a thin, snappy crust, unlike a deep, soft pie.',
		madeWith: ['wheat flour', 'butter', 'sugar', 'egg', 'often cream', 'sometimes almond'],
		pairs: 'Lemon curd, fresh berries, chocolate ganache, crème fraîche',
		notThis: 'Not a torte, which is a rich cake, or a galette, which is folded free-form by hand with no pan.',
		recipe: 'tarte-au-citron',
		seeAlso: ['fd_0264', 'fd_0240'],
		confusedWith: ['fd_0242', 'fd_0246'],
		line: 'Lemon tart, raspberries, crème fraîche',
		traps: [
			{ says: 'Deep dish of fruit baked under a lid of pastry and served warm', why: 'It has no lid. It is a shallow open shell, filled, with straight sides and a thin crust.' }
		]
	},
	{
		id: 'fd_0242',
		term: 'Torte',
		level: 2,
		say: 'TORT',
		packet: true,
		gist: 'Dense, rich European cake, often with ground nuts in the batter',
		guest: "It's a rich European-style cake, either one dense round or thin layers with a filling. Denser than a sponge, and a little goes a long way.",
		why: 'German and Austrian bakers often build tortes from thin layers stacked with buttercream, jam or chocolate, or bake one dense round. Many swap part of the flour for ground nuts or crumbs, making them moist, dense and nutty. Compare Dobos torte to a light American layer cake.',
		madeWith: ['egg', 'butter', 'sugar', 'often ground nuts', 'often wheat flour', 'often chocolate', 'sometimes jam'],
		origin: 'German and Austrian, via Italian torta, a round cake or loaf',
		notThis: 'Not a tart, which is a pastry shell holding a filling. A torte is dense cake, whether in one layer or several.',
		recipe: 'oregon-hazelnut-torte',
		confusedWith: ['fd_0241'],
		line: 'Hazelnut torte, espresso cream, candied orange',
		traps: [
			{ says: 'Crusty Mexican sandwich roll stuffed with meat, beans and avocado', why: 'That is a torta, a sandwich. A torte is a dense European cake.' }
		]
	},
	{
		id: 'fd_0243',
		term: 'Pâte à Choux',
		level: 3,
		say: 'paht-ah-SHOO',
		aliases: ['Choux'],
		gist: 'Egg dough cooked on the stove, then baked into hollow shells to fill',
		guest: "It's the light, eggy dough behind cream puffs and eclairs. It bakes up crisp outside and hollow inside, ready to be filled with cream or something savory.",
		why: 'Butter, water and flour are cooked in a pot into a paste, then eggs are beaten in. In the oven the water turns to steam and puffs each piece into a hollow shell that the eggs set firm. No yeast and no layers, unlike croissant or puff pastry dough.',
		madeWith: ['wheat flour', 'butter', 'egg', 'water', 'often milk', 'sometimes cheese'],
		origin: 'French, choux means cabbages, for the knobbly look of the baked puffs',
		notThis: 'Not puff pastry, which is flaky folded layers, and not pâté, the meat spread. Pâte just means dough.',
		recipe: 'pate-a-choux-the-base-dough',
		seeAlso: ['fd_0264', 'fd_0234'],
		confusedWith: ['fd_0244', 'fd_0073'],
		line: 'Warm choux puffs, vanilla cream, chocolate sauce'
	},
	{
		id: 'fd_0244',
		term: 'Puff Pastry',
		level: 1,
		aliases: ['Pâte Feuilletée'],
		gist: 'Unyeasted dough folded around butter into hundreds of flaky layers',
		guest: "It's the buttery, shattering pastry you get in a napoleon or a beef Wellington. Hundreds of paper-thin layers that crackle when you cut in.",
		why: 'A block of butter is wrapped in plain dough, then rolled and folded again and again until there are hundreds of alternating layers. In the oven the water in the butter turns to steam and pushes the layers apart. Croissant dough is built the same way but adds yeast.',
		madeWith: ['wheat flour', 'butter', 'water', 'salt', 'often egg wash'],
		origin: 'French pâte feuilletée, leafed dough, for its layers like pages',
		notThis: 'Not choux, the eggy dough of cream puffs. Puff shatters into flakes, choux bakes into hollow shells.',
		recipe: 'rough-puff-pastry-in-four-turns',
		seeAlso: ['fd_0241', 'fd_0246'],
		confusedWith: ['fd_0243'],
		line: 'Mushroom and leek in puff pastry, Madeira sauce',
		traps: [
			{ says: 'Paper-thin stretched sheets brushed with butter, as in baklava', why: 'That is phyllo. This is one dough folded around a block of butter.' }
		]
	},
	{
		id: 'fd_0245',
		term: 'Clafoutis',
		level: 3,
		say: 'klah-foo-TEE',
		gist: 'Fruit baked in a sweet eggy batter that sets like a soft flan',
		guest: "It's a rustic French dessert of fruit, classically cherries, baked in a sweet custardy batter. Somewhere between a pancake and a flan, best served warm.",
		why: 'Fruit goes into a buttered dish and a thin pancake-style batter of eggs, milk, sugar and a little flour is poured over. It bakes into a soft, puffed, custardy cake that sinks as it cools. With fruit other than cherries the French call it a flognarde.',
		madeWith: ['egg', 'milk', 'wheat flour', 'butter', 'cherries', 'sometimes kirsch', 'sometimes almond'],
		note: 'Traditional versions leave the cherry pits in for flavor. Ask the kitchen, and warn the guest if they are there.',
		origin: 'Limousin, central France, from an old word meaning to fill',
		seeAlso: ['fd_0250'],
		line: 'Warm cherry clafoutis, crème fraîche',
		traps: [
			{ says: 'Thin French pancake folded around fruit and cream at the table', why: 'That is a crepe. This is baked in a dish as one thick, custardy cake.' }
		]
	},
	{
		id: 'fd_0246',
		term: 'Galette',
		level: 2,
		say: 'guh-LET',
		gist: 'French flat round: a free-form folded-edge pie, or a buckwheat crepe',
		guest: "It's a rustic French pie baked free-form, with the crust folded up over the filling. In Brittany the same word means a savory buckwheat crepe.",
		why: 'The word means a flat round cake. The dessert kind is dough rolled out, piled with fruit and its edges folded in, baked flat on a sheet with no tart ring, so it browns crisp all round. The Breton kind is a thin buckwheat crepe, often filled with ham, egg and cheese.',
		madeWith: ['wheat flour', 'butter', 'often egg', 'sometimes almond', 'sometimes buckwheat flour', 'sometimes ham', 'sometimes cheese'],
		origin: 'French, from galet, a smooth flat pebble',
		notThis: 'Not a tart, which is baked in a fluted pan with straight sides. A galette is shaped by hand.',
		recipe: 'rainier-cherry-galette',
		seeAlso: ['fd_0244'],
		confusedWith: ['fd_0241'],
		line: 'Rustic plum galette, vanilla ice cream'
	},
	{
		id: 'fd_0247',
		term: 'Pavlova',
		level: 2,
		say: 'pav-LOH-vuh',
		gist: 'Crisp meringue shell with a soft center, heaped with cream and fruit',
		guest: "It's a meringue cake that's crisp on the outside and soft like marshmallow inside, topped with whipped cream and fresh fruit. Light, sweet and tart at once.",
		why: 'Egg whites are whipped with sugar, often with a little cornstarch and vinegar, then baked low and slow. The outside dries to a crisp shell while the center stays soft and chewy. Cream and sharp fruit like passion fruit cut the sweetness.',
		madeWith: ['egg white', 'sugar', 'cream', 'fruit', 'often cornstarch', 'often vinegar'],
		note: 'Topped just before it goes out. Cream softens the shell, so it should not sit at the pass.',
		origin: 'Australia and New Zealand, both claim it, named for ballerina Anna Pavlova',
		recipe: 'pavlova',
		seeAlso: ['fd_0240', 'fd_0265'],
		line: 'Pavlova, passion fruit, berries, whipped cream',
		traps: [
			{ says: 'Russian honey cake of many thin layers stacked with sour cream', why: 'The ballerina was Russian, but the dessert is a meringue from Australia or New Zealand.' }
		]
	},
	{
		id: 'fd_0248',
		term: 'Soufflé',
		level: 2,
		say: 'soo-FLAY',
		gist: 'Baked egg dish lifted by whipped whites, served puffed and hot',
		guest: "It's a baked egg dish, savory with cheese or sweet with chocolate, that rises tall and airy around a soft, creamy middle. Made to order, and worth the wait.",
		why: 'A thick base, cheese sauce for savory or pastry cream or fruit for sweet, is folded with beaten egg whites. In the oven the air and steam expand and push it up the straight sides of the dish. As it cools the air contracts, so it starts to fall within minutes.',
		madeWith: ['egg', 'milk', 'butter', 'wheat flour', 'sometimes liqueur', 'sometimes cheese', 'sometimes chocolate'],
		note: 'Takes about 20 minutes and falls fast, so warn the guest when they order.',
		origin: 'French, souffler means to blow or puff up',
		notThis: 'Not a mousse, which is set cold in the fridge. A hot soufflé is baked, and a frozen one is really a mousse.',
		recipe: 'vanilla-souffle-on-a-patissiere-base',
		seeAlso: ['fd_0240', 'fd_0264'],
		confusedWith: ['fd_0252'],
		line: 'Gruyère soufflé, frisée, sherry vinaigrette',
		traps: [
			{ says: 'Eggs cooked in a pan and folded over a filling, often with cheese', why: 'That is an omelette. This is baked in a deep dish and rises on whipped whites.' }
		]
	}
];

export default cards;
