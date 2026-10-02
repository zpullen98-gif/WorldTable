/* The Floor Deck, section "custards". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0249',
		term: 'Crème Anglaise',
		level: 2,
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
		level: 1,
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
		level: 2,
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
		level: 1,
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
		level: 2,
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
		level: 2,
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
		level: 1,
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
		level: 2,
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
		level: 2,
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
		level: 1,
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
		level: 1,
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
		level: 1,
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
		level: 2,
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
		level: 1,
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
		level: 2,
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
		level: 2,
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
		level: 2,
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
	},
	{
		id: 'fd_0345',
		term: 'Sabayon',
		level: 3,
		say: 'sah-bah-YOHN',
		aliases: ['Zabaglione', 'Zabaione'],
		gist: 'Warm, airy foam of yolks whisked with wine over gentle heat',
		guest: "It's a warm, airy sauce of egg yolks whisked with sweet wine until they froth. Spooned over berries, it tastes like a light custard with a hint of wine.",
		why: 'Yolks, sugar and wine are whisked over a water bath until they thicken and hold air, so it arrives warm, pale and foamy, lighter than any set custard. Italians make it with Marsala and call it zabaglione; the French pour Champagne or Sauternes.',
		madeWith: ['egg yolk', 'sugar', 'wine', 'sometimes cream'],
		note: "Often made to order and served warm, so allow a few minutes. Some of the wine's alcohol stays in it.",
		notThis: 'Not a chilled pouring custard and not a mousse. It is whisked warm over water and eaten as a foam.',
		seeAlso: ['fd_0197', 'fd_0261'],
		confusedWith: ['fd_0249', 'fd_0252'],
		line: 'Warm Champagne sabayon, summer berries, almond tuile',
		traps: [
			{ says: 'Egg whites whipped with sugar and wine into a cold, glossy foam', why: 'It is made from the yolks, not the whites, and it is whisked over heat and served warm.' }
		]
	},
	{
		id: 'fd_0346',
		term: 'Crémeux',
		level: 3,
		say: 'kray-MUH',
		gist: 'Custard base set with chocolate or fruit into a dense, silky cream',
		guest: "It's a rich chocolate or fruit cream built on a custard base, denser than a mousse and softer than a truffle. You drag the crunchy bits through it.",
		why: 'A custard of yolks and cream is cooked, then melted chocolate, or fruit purée and a little gelatin, is stirred in and it sets cold. No air is whipped in, so it is denser than a mousse, and the custard under it keeps it softer than a ganache and easy to spoon.',
		madeWith: ['egg yolk', 'cream', 'milk', 'sugar', 'often chocolate', 'sometimes gelatin', 'sometimes butter'],
		origin: "French, 'creamy'; a modern pastry kitchen word for a set, pipeable cream",
		notThis: 'Not a mousse, which is whipped light with air, and not a ganache, which is chocolate melted into hot cream with no custard under it.',
		seeAlso: ['fd_0249'],
		confusedWith: ['fd_0252', 'fd_0251', 'fd_0263'],
		line: 'Dark chocolate crémeux, hazelnut praline, brown butter sablé'
	},
	{
		id: 'fd_0347',
		term: 'Posset',
		level: 3,
		say: 'PAH-sit',
		gist: 'Boiled sweet cream that lemon juice sets soft in the glass',
		guest: "It's an old English lemon cream, chilled until the lemon juice sets it. Smooth and rich like a panna cotta, but with a real citrus snap.",
		why: "Cream and sugar are boiled, lemon juice is stirred in, and the acid firms the cream's proteins as it chills, so it sets in the glass. The high fat keeps it smooth, and it sits between a panna cotta and a thick pudding, sharp with citrus.",
		madeWith: ['cream', 'sugar', 'lemon juice', 'often lemon zest'],
		origin: 'English; in the Middle Ages a hot drink of milk curdled with wine or ale',
		notThis: 'Not a panna cotta, which is set with gelatin and turned out of a mold. This sets from the citrus and stays in its glass.',
		recipe: 'lemon-posset-with-shortbread-fingers',
		seeAlso: ['fd_0250', 'fd_0262'],
		confusedWith: ['fd_0254', 'fd_0263'],
		line: 'Meyer lemon posset, blueberries, brown butter shortbread',
		traps: [
			{ says: 'Sharp lemon spread cooked thick with egg yolks, butter and sugar', why: 'That is lemon curd, cooked thick over heat. A posset sets in the glass from cream meeting lemon juice.' }
		]
	},
	{
		id: 'fd_0348',
		term: 'Vacherin',
		level: 4,
		say: 'vash-uh-RAN',
		aliases: ['Vacherin Glacé'],
		gist: 'Crisp meringue shell holding ice cream or sorbet and whipped cream',
		guest: "It's a crisp meringue shell filled with ice cream or sorbet and whipped cream, so you get crunchy, cold and creamy in one spoonful.",
		why: 'Egg white and sugar are baked slow into dry, crisp meringue, shaped into a shell or discs, then filled with ice cream or sorbet and whipped cream, or classically just cream and fruit. The dry shell stays crisp against the cold filling, so every bite is crunch, ice and cream.',
		madeWith: ['egg white', 'sugar', 'cream', 'ice cream or sorbet', 'often fruit'],
		origin: 'French; a classical dessert that borrowed the name of a round Alpine cheese',
		notThis: 'Not a pavlova, soft in the middle. This shell is baked dry and crisp, then filled, most often with ice cream.',
		seeAlso: ['fd_0260', 'fd_0259', 'fd_0265'],
		confusedWith: ['fd_0247', 'fd_0240', 'fd_0341'],
		line: 'Strawberry vacherin, vanilla ice cream, Chantilly, basil',
		traps: [
			{ says: "Soft, runny Alpine cow's milk cheese ripened in a band of spruce bark", why: 'That is the cheese that shares the name. On a dessert menu it is a meringue shell filled with ice cream.' }
		]
	},
	{
		id: 'fd_0405',
		term: 'Île Flottante',
		level: 4,
		say: 'eel floh-TAHNT',
		aliases: ['Floating Island', 'Oeufs à la Neige'],
		gist: 'Soft poached meringue clouds served on a pool of cold vanilla sauce',
		guest: "It's a French classic, soft clouds of meringue poached in milk and set on a cool vanilla custard sauce, finished with caramel and often toasted almonds.",
		why: 'Sweet whipped egg whites are poached by the spoonful in barely simmering milk, or set as one mound in a water bath, so they stay soft and marshmallowy. The milk often becomes the crème anglaise beneath. It eats like a sweet cloud on silk.',
		madeWith: ['egg white', 'egg yolk', 'milk', 'sugar', 'often vanilla', 'often almonds'],
		origin: "French for 'floating island'; also sold as oeufs à la neige, 'snow eggs'",
		notThis: 'Not a pavlova, which is baked with a crisp shell. These are cooked soft in milk or a water bath.',
		seeAlso: ['fd_0249', 'fd_0240', 'fd_0250'],
		confusedWith: ['fd_0247'],
		line: 'Île flottante, vanilla crème anglaise, caramel, toasted almonds'
	},
	{
		id: 'fd_0406',
		term: 'Chiboust',
		level: 4,
		say: 'shee-BOOST',
		gist: 'Pastry cream lightened with cooked meringue and set, often torched',
		guest: "It's a silky custard lightened with meringue, often with a crackly torched sugar top like a crème brûlée.",
		why: 'Hot pastry cream is folded with Italian meringue, whites whipped with boiling sugar syrup, plus a little gelatin so it holds a clean edge. It eats lighter than pastry cream and richer than mousse, and sugared on top it torches like a brûlée.',
		madeWith: ['milk', 'egg yolk', 'egg white', 'sugar', 'gelatin', 'often wheat flour'],
		origin: 'Paris, 1840s, named for the pastry cook whose shop created the Saint-Honoré',
		notThis: 'Not plain pastry cream, which is thick and dense. This one is lightened with meringue.',
		seeAlso: ['fd_0401', 'fd_0240', 'fd_0262'],
		confusedWith: ['fd_0264'],
		line: 'Meyer lemon chiboust, blueberries, brown butter crumble',
		traps: [
			{ says: 'Pastry cream lightened with folded whipped cream, then piped chilled', why: 'That is diplomat cream. This one is lightened with cooked meringue, not whipped cream.' }
		]
	},
	{
		id: 'fd_0407',
		term: 'Bavarois',
		level: 4,
		say: 'bah-vahr-WAH',
		aliases: ['Bavarian Cream', 'Crème Bavaroise'],
		gist: 'Yolk custard set with gelatin and whipped cream, turned out of a mold',
		guest: "It's a classic French molded cream, a silky custard set with gelatin and lightened with whipped cream. Cool, smooth and lighter than it looks.",
		why: 'It starts as crème anglaise, milk and yolks stirred until thick. Gelatin is melted in, whipped cream folded through as it cools, and it sets in a mold. It turns out with clean sides and eats cool, light and custardy, eggier than panna cotta and firmer than mousse.',
		madeWith: ['milk', 'egg yolk', 'cream', 'sugar', 'gelatin', 'often vanilla'],
		origin: "French for 'Bavarian', a 19th-century classic with an unclear tie to Bavaria",
		notThis: 'Not panna cotta, which is sweet cream set with gelatin. A bavarois starts from a yolk custard.',
		seeAlso: ['fd_0249', 'fd_0265'],
		confusedWith: ['fd_0254', 'fd_0252'],
		line: 'Vanilla bavarois, poached rhubarb, almond tuile'
	},
	{
		id: 'fd_0408',
		term: 'Chocolate Marquise',
		level: 4,
		say: 'CHAWK-lit mar-KEEZ',
		gist: 'Dense unbaked slab of dark cocoa, butter and yolks, set cold',
		guest: "It's dark chocolate, butter and egg yolks chilled into a block and sliced, never baked. Dense and silky, like the center of a truffle.",
		why: 'Melted chocolate and butter are folded with yolks and sugar, sometimes whipped cream, then set cold in a loaf mold. With no oven and little air, it is denser than mousse and silkier than a flourless cake, and it melts as it warms.',
		madeWith: ['dark chocolate', 'butter', 'egg yolk', 'sugar', 'often cream', 'sometimes liqueur'],
		note: 'Classic recipes leave the yolks uncooked, set only by cold chocolate and butter. Ask how the house makes it.',
		notThis: 'Not a mousse, which is airy, or a flourless cake, which is baked. A marquise never sees the oven.',
		seeAlso: ['fd_0251', 'fd_0255', 'fd_0346'],
		confusedWith: ['fd_0252', 'fd_0242'],
		line: 'Chocolate marquise, crème anglaise, raspberries',
		traps: [
			{ says: 'Rich cocoa cake baked until just set, served warm from the oven', why: 'It is never baked. It is set cold in a mold and served chilled.' }
		]
	},
	{
		id: 'fd_0409',
		term: 'Nougat Glacé',
		level: 4,
		say: 'NOO-gut glah-SAY',
		gist: 'Honey meringue and cream frozen with nut brittle and candied fruit',
		guest: "It's a frozen French dessert of honey meringue and whipped cream, packed with toasted nuts and candied fruit, sliced like a cake.",
		why: 'Hot honey and sugar syrup is whipped into egg whites, a cooked meringue that stays soft when frozen, then folded with whipped cream, nut brittle and candied fruit. Never churned, it is set in a mold and sliced, a frozen, creamy take on the candy.',
		madeWith: ['egg white', 'honey', 'cream', 'almonds', 'often pistachios', 'often hazelnuts', 'often candied fruit'],
		origin: "French, 'iced nougat'; a frozen take on the honey nougat of Provence",
		notThis: 'Not a parfait or most semifreddos, which rest on whipped yolks. This is honey meringue full of nut brittle.',
		seeAlso: ['fd_0240', 'fd_0348'],
		confusedWith: ['fd_0261', 'fd_0253'],
		line: 'Nougat glacé, pistachio, raspberry coulis',
		traps: [
			{ says: 'Honey ice cream churned with chopped nuts and scooped like gelato', why: 'It is never churned. It is a meringue and cream mixture frozen in a mold and sliced.' },
			{ says: 'Chewy honey and almond candy, cut into bars and served straight frozen', why: 'It is a soft frozen cream, not a candy. Only the brittle and candied fruit inside give it crunch or chew.' }
		]
	}
];

export default cards;
