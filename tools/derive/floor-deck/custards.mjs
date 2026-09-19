/* The Floor Deck, section "custards". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0249',
		term: 'Crème Anglaise',
		say: 'KREM ahn-GLAYZ',
		packet: true,
		gist: 'Pourable vanilla sauce of yolks and milk, stirred until it coats a spoon',
		guest: "It's a warm or cool vanilla custard sauce, silky and pourable, spooned around the plate. Think melted vanilla ice cream, only a little lighter.",
		why: 'Egg yolks, sugar and milk are stirred over low heat until the yolks thicken it just enough to coat a spoon, about 82 C (180 F). There is no starch, so it stays a sauce and never sets. Churned in a machine, the same base becomes ice cream.',
		madeWith: ['egg yolk', 'milk', 'sugar', 'often cream', 'vanilla'],
		origin: 'French for English cream, the classic French pouring custard',
		notThis: 'Not pastry cream, which is thickened with starch and holds its shape. This one pours.',
		lexiconSlug: 'custards-anglaise-patissiere-and-curds',
		recipe: 'creme-anglaise-stirred-to-the-nappe',
		seeAlso: ['fd_0250', 'fd_0260'],
		confusedWith: ['fd_0264'],
		line: 'Warm chocolate cake, crème anglaise, raspberries',
		traps: [
			{ says: 'Sweet sauce of butter, sugar and cream cooked until amber and toffee-like', why: 'That is caramel sauce. This one is yolks and milk, pale and vanilla-scented, never cooked to color.' }
		]
	},
	{
		id: 'fd_0250',
		term: 'Custard',
		packet: true,
		gist: 'Umbrella name for any milk or cream set by egg over gentle heat',
		guest: "It's milk or cream gently cooked with eggs until it thickens into something smooth and silky. It can be a spoonable pudding, a pie filling or a sauce.",
		why: 'Egg proteins unwind and link as they warm, trapping the liquid into a soft gel. Stirred on the stove it stays pourable. Baked in a water bath it sets firm enough to slice or unmold. Too much heat and the eggs tighten and weep, so it is cooked low and slow.',
		madeWith: ['egg', 'milk', 'cream', 'sugar', 'sometimes cornstarch', 'sometimes wheat flour'],
		note: 'A baked custard should still jiggle slightly in the center. Bubbles, holes or weeping mean it was overcooked.',
		pairs: 'Fresh berries, caramel, nutmeg, pie crust, stewed fruit',
		lexiconSlug: 'custards-anglaise-patissiere-and-curds',
		recipe: 'creme-caramel-the-set-custard',
		seeAlso: ['fd_0249', 'fd_0262', 'fd_0263'],
		line: 'Buttermilk custard pie, macerated strawberries',
		traps: [
			{ says: 'Milk pudding thickened only with cornstarch, cooked quickly to a boil', why: 'What defines it is egg setting the milk or cream. Starch is optional, and boiling would curdle a plain one.' }
		]
	},
	{
		id: 'fd_0251',
		term: 'Ganache',
		say: 'guh-NAHSH',
		packet: true,
		gist: 'Chopped chocolate melted into hot cream, glossy and smooth',
		guest: "It's chocolate melted into warm cream until it's glossy and smooth. It's the silky center of a truffle and the shiny glaze on a chocolate cake.",
		why: 'Hot cream poured over chopped chocolate melts it, and stirring emulsifies the cocoa butter and cream into one smooth mass. The ratio sets the texture: equal parts pours as a glaze or whips into frosting, twice as much chocolate sets firm enough to roll.',
		madeWith: ['chocolate', 'cream', 'sometimes butter', 'sometimes liqueur'],
		pairs: 'Tart fillings, cake glaze, macaron filling, sea salt, raspberry',
		notThis: 'Not a truffle itself. This is the mixture, and a truffle is a ball rolled from it.',
		lexiconSlug: 'ganache-bloom-and-chocolate-craft',
		seeAlso: ['fd_0255', 'fd_0198', 'fd_0252'],
		line: 'Dark chocolate ganache tart, sea salt, crème fraîche',
		traps: [
			{ says: 'Chocolate melted and cooled with care so it sets shiny and snaps', why: 'That is tempered chocolate, which is chocolate alone. This is chocolate melted into cream, and it never snaps.' }
		]
	},
	{
		id: 'fd_0252',
		term: 'Mousse',
		say: 'MOOS',
		packet: true,
		gist: 'Chilled sweet dish made airy with whipped cream or beaten egg whites',
		guest: "It's a chilled dessert, often chocolate, lightened with whipped cream or egg whites. Rich flavor, but it melts away and never sits heavy.",
		why: 'A flavored base, often melted chocolate or fruit puree, has whipped cream or beaten egg whites folded through it, then chills until the fat or a little gelatin holds the bubbles in place. The trapped air is what makes it taste rich but eat light.',
		madeWith: ['often egg', 'often cream', 'sugar', 'often chocolate', 'sometimes butter', 'sometimes gelatin'],
		note: 'Classic chocolate versions are often made with uncooked eggs. Ask the kitchen how theirs is made.',
		notThis: 'Not a soufflé, which is baked and served hot. Not pot de crème, which is baked dense in a cup.',
		seeAlso: ['fd_0251', 'fd_0261'],
		confusedWith: ['fd_0248', 'fd_0263'],
		line: 'Dark chocolate mousse, olive oil, sea salt',
		traps: [
			{ says: 'Dense dessert of cream and yolks, baked and chilled, then cut in slices', why: 'It is never baked. It is set by chilling, and its whole point is the air folded into it.' }
		]
	},
	{
		id: 'fd_0253',
		term: 'Parfait',
		say: 'par-FAY',
		packet: true,
		gist: 'Sliced frozen mold of whipped yolks and cream, or layers in a tall glass',
		guest: "In France it's a frozen dessert of whipped yolks and cream, sliced from a mold, softer and silkier than ice cream. At brunch it's layered yogurt and fruit.",
		why: 'The French version cooks yolks with hot sugar syrup, whips them pale and thick, folds in whipped cream and freezes it in a mold. All that air keeps it soft enough to slice. In America the word means layers of ice cream or yogurt with fruit in a tall glass.',
		madeWith: ['egg yolk', 'cream', 'sugar', 'sometimes almond or pistachio', 'sometimes yogurt', 'sometimes granola', 'sometimes gelatin'],
		origin: 'French for perfect, the frozen dessert of French pastry',
		notThis: 'On a starter menu, chicken liver parfait is a silky savory pâté, not a dessert.',
		seeAlso: ['fd_0260', 'fd_0252'],
		confusedWith: ['fd_0261', 'fd_0062'],
		line: 'Frozen nougat parfait, raspberry coulis, almond tuile'
	},
	{
		id: 'fd_0254',
		term: 'Panna Cotta',
		say: 'PAH-nuh KOH-tuh',
		packet: true,
		gist: 'Sweet cream set with gelatin, turned out soft and wobbly',
		guest: "It's sweet cream, gently set so it just holds its shape and trembles on the plate. Cool, silky and clean, usually with fruit alongside.",
		why: 'Cream and sugar are warmed with vanilla, gelatin is stirred in, and it sets in the fridge in a mold, then is turned out. The gelatin gives a soft wobble rather than the denser body of an egg custard, so it tastes of pure, clean dairy.',
		madeWith: ['cream', 'sugar', 'gelatin', 'often milk', 'vanilla'],
		origin: 'Italian for cooked cream, from Piedmont in the north',
		pairs: 'Berries, stone fruit, caramel, aged balsamic, honey',
		recipe: 'panna-cotta',
		seeAlso: ['fd_0250', 'fd_0262'],
		line: 'Vanilla bean panna cotta, macerated strawberries',
		traps: [
			{ says: 'Italian cream and yolk dessert baked slowly in a water bath', why: 'It is never baked. Warm cream is set with gelatin as it chills in the fridge.' }
		]
	},
	{
		id: 'fd_0255',
		term: 'Chocolate Truffle',
		packet: true,
		gist: 'Bite-size ball of cocoa and cream, rolled in cocoa powder or dipped',
		guest: "It's a little ball of chocolate and cream, soft and rich, that melts on the tongue. A one-bite way to end a meal.",
		why: 'A firm, chocolate-heavy ganache is chilled, scooped and rolled into balls, then dusted in cocoa, rolled in nuts or dipped in a hard chocolate shell. The cream keeps the center soft, so it melts on the tongue far faster than a solid bar.',
		madeWith: ['chocolate', 'cream', 'often butter', 'sometimes liqueur', 'sometimes hazelnut', 'sometimes almond'],
		note: 'Best at cool room temperature. Straight from the fridge the center is hard and the flavor muted.',
		origin: 'French sweet named for its look-alike, the dusty black truffle fungus',
		notThis: 'Not the truffle mushroom. If a guest asks about truffle on a dessert menu, it is this sweet.',
		seeAlso: ['fd_0251'],
		confusedWith: ['fd_0147'],
		line: 'House chocolate truffles, cocoa dusted'
	},
	{
		id: 'fd_0256',
		term: 'Gelato',
		say: 'jeh-LAH-toh',
		packet: true,
		gist: 'Italian frozen dessert, more milk and less air, served softer and warmer',
		guest: "It's Italian ice cream, denser and silkier, served a little softer so the flavor comes through bright and strong.",
		why: 'The base leans on milk more than cream, so it is lower in fat. It is churned slowly, beating in less air, which makes it dense. It is served a few degrees warmer than ice cream, so it is soft and less numbing, and the flavor hits harder.',
		madeWith: ['milk', 'sugar', 'cream', 'sometimes egg yolk', 'sometimes pistachio', 'sometimes hazelnut'],
		origin: 'Italian for frozen, from the verb gelare, to freeze',
		notThis: 'Not ice cream with an accent. Ice cream has more cream and air and is served colder and firmer.',
		seeAlso: ['fd_0259', 'fd_0261', 'fd_0257'],
		confusedWith: ['fd_0260'],
		line: 'Pistachio gelato, olive oil, flaky salt',
		traps: [
			{ says: 'Italian frozen dessert made richer than ice cream with extra cream and yolks', why: 'It runs the other way. It leans on milk and is lower in fat than ice cream, and dense from less air.' }
		]
	},
	{
		id: 'fd_0257',
		term: 'Granita',
		say: 'gruh-NEE-tuh',
		packet: true,
		gist: 'Sweet juice or coffee frozen into loose, grainy ice crystals',
		guest: "It's a Sicilian ice of sweet fruit, coffee or almond, frozen into fine, icy crystals. Light and refreshing.",
		why: 'The flavored syrup is stirred slowly as it freezes, in a machine in Sicilian bars or with a fork in a pan, so it sets as ice crystals rather than a smooth, airy mass. It melts fast and tastes clean, like a grown-up snow cone with the flavor frozen in.',
		madeWith: ['sugar', 'fruit', 'often coffee', 'sometimes almond'],
		origin: 'Sicily, from Italian grana, grain, for its grainy crystals',
		pairs: 'Brioche for dipping, whipped cream, espresso',
		notThis: 'Not sorbet, which is churned smooth and scoops. Granita is spooned as loose, grainy crystals.',
		recipe: 'granita-di-mandorla-con-brioche-col-tuzzu',
		confusedWith: ['fd_0259'],
		line: 'Espresso granita, whipped cream, candied orange',
		traps: [
			{ says: 'Shaved block of plain frozen water topped with flavored syrup', why: 'The flavor is frozen into the syrup from the start, not poured over plain ice.' }
		]
	},
	{
		id: 'fd_0258',
		term: 'Sherbet',
		say: 'SHER-bit',
		packet: true,
		gist: 'Fruit-sugar frozen dessert churned with a small splash of milk',
		guest: "It's a fruit ice with milk or cream churned in. Brighter than ice cream, creamier than sorbet.",
		why: 'It is a sorbet base of fruit and sugar with a small amount of dairy added, about 1 to 2 percent milkfat in the US. That bit of milk fat softens the ice crystals and rounds the tartness, so it sits between a clean sorbet and a rich ice cream.',
		madeWith: ['fruit', 'sugar', 'milk', 'sometimes cream', 'sometimes egg white'],
		origin: 'From Turkish and Persian sherbet, a chilled sweet fruit drink',
		notThis: 'Not sorbet, whose classic base is fruit and sugar. Often said sherbert, but there is only one r in the word.',
		confusedWith: ['fd_0259', 'fd_0260'],
		line: 'Orange sherbet, shortbread, mint'
	},
	{
		id: 'fd_0259',
		term: 'Sorbet',
		say: 'sor-BAY',
		packet: true,
		gist: 'Smooth churned fruit ice on sugar syrup, clean and sharp',
		guest: "It's a fruit ice churned smooth like ice cream. Pure, bright fruit flavor that feels light after a big meal.",
		why: 'Fruit puree or juice is balanced with sugar syrup and churned while it freezes. The sugar keeps the crystals tiny, so it scoops smooth like ice cream, but as a base built on fruit and sugar it tastes sharper and cleaner and it melts quickly.',
		madeWith: ['fruit', 'sugar', 'sometimes egg white', 'sometimes wine', 'sometimes liqueur'],
		note: 'A small scoop between courses is a palate cleanser. Most sorbets melt faster than ice cream, so run them straight out.',
		notThis: 'Not sherbet, which has some milk churned in, and not granita, which is grainy rather than smooth.',
		confusedWith: ['fd_0258', 'fd_0257'],
		line: 'Blood orange sorbet, pistachio, mint',
		traps: [
			{ says: 'Frozen fruit yogurt churned smooth and served as a light scoop', why: 'It is a fruit and sugar syrup base churned smooth, not a yogurt base.' }
		]
	},
	{
		id: 'fd_0260',
		term: 'Ice Cream',
		gist: 'Rich, high-fat dairy base churned with plenty of air to scoop',
		guest: "It's cream, milk and sugar, often with egg yolk, churned as it freezes until thick and smooth. Rich and soft enough to scoop.",
		why: 'Cream, milk and sugar, often cooked with egg yolks into a custard, are churned as they freeze. Churning keeps ice crystals tiny and beats in air, so it scoops soft. It holds more fat and air than gelato, so it tastes richer but a little less dense.',
		madeWith: ['cream', 'milk', 'sugar', 'often egg yolk'],
		pairs: 'Warm pie, brownies, affogato, fruit crisp',
		notThis: 'Not gelato, which is churned slower with more milk and less cream, so it is denser and softer.',
		confusedWith: ['fd_0256'],
		line: 'Vanilla bean ice cream, warm apple crisp',
		traps: [
			{ says: 'Lean frozen milk and sugar, churned slow and denser than gelato', why: 'Backwards. It holds more butterfat and more air than gelato, so it is richer and lighter.' }
		]
	},
	{
		id: 'fd_0261',
		term: 'Semifreddo',
		say: 'seh-mee-FRED-oh',
		gist: 'Italian frozen mousse, soft enough to slice when frozen',
		guest: "It's an Italian frozen mousse, whipped eggs and cream frozen in a mold and sliced. Soft and airy, it melts on your tongue.",
		why: 'Egg yolks and sugar are whisked over heat into a foam, then folded with whipped cream and frozen without churning. All that air keeps it soft enough to slice straight from the freezer, lighter and more like a frozen mousse than ice cream.',
		madeWith: ['egg yolk', 'cream', 'sugar', 'often egg white', 'sometimes pistachio', 'sometimes almond or hazelnut', 'sometimes liqueur'],
		note: 'Some versions fold in whipped egg white that is never cooked. Ask the kitchen how theirs is made.',
		origin: 'Italian for half cold, for its soft, never rock-hard set',
		notThis: 'Close cousin of the French frozen parfait. A layered glass parfait of yogurt and fruit is another thing.',
		recipe: 'semifreddo-al-caffe',
		confusedWith: ['fd_0253'],
		line: 'Honey semifreddo, roasted figs, pistachio',
		traps: [
			{ says: 'Half-melted scoop of gelato served soft on a warmed plate', why: 'It is a frozen mousse sliced from a mold, soft because of air, not because it melted.' }
		]
	},
	{
		id: 'fd_0262',
		term: 'Crème Brûlée',
		say: 'KREM broo-LAY',
		gist: 'Chilled baked custard under a thin crust of torched sugar',
		guest: "It's a cold vanilla custard with a layer of sugar torched to glassy caramel. You crack the top with your spoon.",
		why: 'Cream, egg yolks, sugar and vanilla bake gently in a water bath until just set, then chill. Sugar is burned on top to order, so you get a warm, brittle caramel shell over cold, silky custard. The contrast is the whole point.',
		madeWith: ['cream', 'egg yolk', 'sugar', 'vanilla'],
		origin: 'French, meaning burnt cream',
		recipe: 'creme-brulee',
		seeAlso: ['fd_0250', 'fd_0263'],
		line: 'Vanilla bean crème brûlée, fresh berries',
		traps: [
			{ says: 'Baked custard turned out onto a plate with a runny caramel sauce', why: 'That is flan. This stays in its dish with a hard, torched sugar crust.' }
		]
	},
	{
		id: 'fd_0263',
		term: 'Pot de Crème',
		say: 'poh duh KREM',
		gist: 'Soft-set, silky baked custard in its own little cup, often chocolate',
		guest: "It's a rich baked custard served in a little cup, usually deep chocolate. Silky and spoonable, like the best pudding.",
		why: 'Cream, milk and egg yolks, often with melted chocolate, bake gently in small cups in a water bath. It uses more yolk and less white than a firm custard, so it sets soft and dense, eaten with a spoon from the cup and never turned out.',
		madeWith: ['cream', 'milk', 'egg yolk', 'sugar', 'often chocolate'],
		origin: 'French, pot of cream, named for the small lidded cups it bakes in',
		notThis: 'Not mousse, which is whipped and airy. Not crème brûlée, which has a torched sugar top.',
		confusedWith: ['fd_0252', 'fd_0262'],
		line: 'Dark chocolate pot de crème, sea salt, whipped cream'
	},
	{
		id: 'fd_0264',
		term: 'Pastry Cream',
		aliases: ['Crème Pâtissière'],
		gist: 'Thick stovetop custard set with starch, piped into eclairs',
		guest: "It's a thick vanilla custard, the filling inside eclairs and under the fruit on a tart. Smooth, rich and not too sweet.",
		why: 'Milk, egg yolks and sugar are cooked on the stove with flour or cornstarch and brought to a boil. The starch lets it thicken until it holds its shape when piped or sliced, where a crème anglaise, thickened by yolks alone, stays pourable.',
		madeWith: ['milk', 'egg yolk', 'sugar', 'wheat flour', 'often butter', 'sometimes cornstarch'],
		pairs: 'Eclairs, fruit tarts, Boston cream pie, cream puffs',
		notThis: 'Not crème anglaise, the pourable sauce thickened by yolks alone. This is thick enough to pipe.',
		seeAlso: ['fd_0250'],
		confusedWith: ['fd_0249'],
		line: 'Fresh berry tart, vanilla pastry cream',
		traps: [
			{ says: 'Whipped butter and sugar frosting spread over the tops of cakes', why: 'It is a cooked custard of milk and yolks set with starch, not a butter frosting.' }
		]
	},
	{
		id: 'fd_0265',
		term: 'Chantilly',
		say: 'shan-TIL-ee',
		aliases: ['Chantilly Cream', 'Crème Chantilly'],
		gist: 'Cream whipped soft with sugar and vanilla to spoonable peaks',
		guest: 'It is fresh cream whipped with a little sugar and vanilla, soft and cloud-light. The classic spoonful on berries, shortcake or a slice of pie.',
		why: 'Cold cream is whisked until its fat droplets trap air, roughly doubling in volume, with sugar and vanilla added near the end. Stopped at soft peaks it stays silky and melts on the tongue. Whipped too far it turns grainy and heads toward butter.',
		madeWith: ['cream', 'sugar', 'vanilla', 'sometimes liqueur', 'sometimes gelatin'],
		origin: 'French, named for the Chantilly estate north of Paris',
		pairs: 'Fresh berries, strawberry shortcake, meringue, choux',
		notThis: 'Not pastry cream, the thick cooked custard. This is raw cream lifted by whipped-in air.',
		seeAlso: ['fd_0252', 'fd_0164'],
		confusedWith: ['fd_0264'],
		line: 'Strawberry shortcake, Chantilly cream, mint',
		traps: [
			{ says: 'Cooked vanilla custard lightened with whipped cream to fill cakes', why: 'It is simply cream whipped with sugar and vanilla, with nothing cooked into it.' }
		]
	}
];

export default cards;
