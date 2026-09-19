/* The Floor Deck, section "dairy". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0154',
		term: 'Brebis',
		level: 4,
		say: 'breh-BEE',
		packet: true,
		gist: "Cheese made from ewe's milk, rich and sweet, sold fresh or aged",
		guest: "It's a sheep's milk cheese, richer and sweeter than most cow's milk cheeses, with a nutty, buttery finish.",
		why: "Sheep's milk carries nearly twice the fat and more protein than cow's milk, so the cheese eats dense, creamy and sweet. Young, it is mild and milky. Aged, as in the Pyrenees tommes like Ossau-Iraty, it turns firm, nutty and caramel-like.",
		madeWith: ["sheep's milk", 'salt', 'often animal rennet'],
		origin: "French for ewe, used for sheep's milk cheeses, above all from the Pyrenees",
		pairs: 'Black cherry jam, quince paste, walnuts, crusty bread',
		seeAlso: ['fd_0168', 'fd_0156'],
		line: 'Aged brebis, black cherry jam, walnut bread',
		traps: [
			{ says: 'Name of one protected cheese made in a single French village', why: 'It is a milk word meaning ewe and covers many cheeses, fresh and aged.' }
		]
	},
	{
		id: 'fd_0155',
		term: 'Buttermilk',
		level: 1,
		packet: true,
		gist: 'Thick, tangy cultured milk that tenderizes batters and brines',
		guest: "It's a tangy, lightly thick cultured milk, the classic secret to tender biscuits and juicy fried chicken.",
		why: 'Once the liquid left after churning butter, today it is low-fat milk soured with lactic cultures. Its acid loosens meat proteins in a brine and reacts with baking soda in batters for lift. It tastes like thin, sharp yogurt, not butter.',
		madeWith: ['milk', 'lactic cultures'],
		pairs: 'Fried chicken, biscuits, pancakes, ranch dressing',
		recipe: 'buttermilk-fried-chicken',
		seeAlso: ['fd_0157', 'fd_0020'],
		line: 'Buttermilk fried chicken, hot honey, slaw',
		traps: [
			{ says: 'Rich, high-fat cream left behind after butter is churned', why: 'It is low in fat. Churning takes the fat into the butter and leaves a thin liquid.' }
		]
	},
	{
		id: 'fd_0156',
		term: 'Chèvre',
		level: 2,
		say: 'SHEV-ruh',
		packet: true,
		gist: "Soft, bright, tangy fresh cheese made from goat's milk",
		guest: "It's fresh goat cheese, creamy and bright with a clean tang. It's lovely with beets, honey or a warm salad.",
		why: "Goat's milk is set slowly with cultures and a little rennet, then drained into soft logs. The cultures give the lemony tang, goat's milk fatty acids the goaty note. Young it is spreadable, like tangier cream cheese. Aged, it firms and grows a rind.",
		madeWith: ["goat's milk", 'salt', 'often rennet'],
		origin: 'French for goat, used in America for fresh goat cheese',
		pairs: 'Roasted beets, honey, figs, arugula, toasted walnuts',
		notThis: 'Not feta, which is brined, saltier and firmer. Chèvre is soft, creamy and never sits in brine.',
		seeAlso: ['fd_0154', 'fd_0158'],
		confusedWith: ['fd_0168'],
		line: 'Roasted beets, whipped chèvre, pistachio, honey',
		traps: [
			{ says: 'Soft goat cheese whose tang comes from lemon juice mixed in', why: 'The tang comes from cultures souring the milk, not from added lemon juice.' }
		]
	},
	{
		id: 'fd_0157',
		term: 'Crème Fraîche',
		level: 2,
		say: 'KREM FRESH',
		packet: true,
		gist: "Thick, mild cultured cream that won't curdle when hot",
		guest: "It's French cultured cream, thick and rich with a gentle tang, like a silkier, milder sour cream. It melts into anything warm.",
		why: 'Heavy cream is ripened with lactic cultures until it thickens and turns softly sour. With about twice the fat of sour cream, it can go into a hot pan sauce without splitting, and it tastes nutty and mellow rather than sharp.',
		madeWith: ['cream', 'lactic cultures'],
		origin: 'French, fresh cream, though it is cultured, not plain',
		pairs: 'Caviar, smoked salmon, potatoes, fruit tarts',
		notThis: 'Not sour cream, which is leaner and sharper and curdles in a hot sauce.',
		seeAlso: ['fd_0155', 'fd_0164', 'fd_0125'],
		line: 'Smoked trout, potato rosti, crème fraîche, dill',
		traps: [
			{ says: 'Plain sweet cream, fresh from the dairy, never soured', why: 'Despite the name it is cultured cream with a tang, not plain fresh cream.' }
		]
	},
	{
		id: 'fd_0158',
		term: 'Fromage Blanc',
		level: 3,
		say: 'froh-MAHZH BLAHN',
		packet: true,
		gist: 'Smooth, spoonable soft white cheese, mild and lightly sour',
		guest: "It's a fresh French cheese, smooth and spoonable like thick yogurt, cool and mildly tangy.",
		why: 'Milk, often skimmed, is soured with cultures and a touch of rennet, then drained only briefly, so the curd stays wet and silky. It is never aged. Think smoother than ricotta and milder than Greek yogurt, with fat set by the milk used.',
		madeWith: ['milk', 'lactic cultures', 'often rennet'],
		origin: 'French for white cheese, a staple of French breakfasts and desserts',
		pairs: 'Berries and honey, or herbs, shallot and black pepper',
		notThis: 'Not ricotta, which is grainier and made by heating. This is smooth, tangy and set without heat.',
		seeAlso: ['fd_0157', 'fd_0156'],
		confusedWith: ['fd_0165'],
		line: 'Fromage blanc, strawberries, honey, cracked pepper'
	},
	{
		id: 'fd_0159',
		term: 'Parmesan',
		level: 1,
		aliases: ['Parmigiano-Reggiano'],
		packet: true,
		gist: "Hard, long-aged Italian cow's milk cheese, nutty and salty",
		guest: "It's a hard, long-aged cheese, nutty and savory with little crunchy crystals. It makes everything taste deeper.",
		why: "The real one is made around Parma from raw, part-skimmed cow's milk and aged 12 months or far longer. As it ages, proteins break down into savory amino acids, which is where the depth comes from. The crunchy white specks are clusters of one of them, tyrosine.",
		madeWith: ["cow's milk", 'salt', 'traditionally calf rennet'],
		origin: 'English for Parmigiano-Reggiano, though US parmesan can be domestic',
		pairs: 'Pasta, risotto, balsamic, pears, Caesar salad',
		seeAlso: ['fd_0181', 'fd_0266'],
		line: 'Shaved Parmigiano-Reggiano, arugula, lemon',
		traps: [
			{ says: 'Hard grating cheese whose crunchy white specks are grains of salt', why: 'The crunchy specks are clusters of an amino acid, tyrosine, formed during long aging.' }
		]
	},
	{
		id: 'fd_0160',
		term: 'Clarified Butter',
		level: 2,
		aliases: ['Drawn Butter'],
		packet: true,
		gist: 'Mild, pale butterfat, most milk solids skimmed off before they brown',
		guest: "It's butter melted down to its golden fat, with the milky bits skimmed off. It tastes clean and buttery and can take real heat.",
		why: 'Butter is gently melted so the water cooks off and the milk solids separate. The solids burn first in a hot pan, so with most of them gone the fat can sear without scorching. It keeps a mild butter flavor and is the classic base for hollandaise.',
		madeWith: ['butter'],
		pairs: 'Lobster, crab, hollandaise, béarnaise, seared fish',
		notThis: 'Not ghee, which is cooked longer until the solids toast. That tastes nutty. This stays clean and mild.',
		lexiconSlug: 'butterfat-fluency-butter-cream-and-cultures',
		seeAlso: ['fd_0197', 'fd_0161'],
		confusedWith: ['fd_0162'],
		line: 'Steamed lobster, drawn butter, lemon'
	},
	{
		id: 'fd_0161',
		term: 'Brown Butter',
		level: 2,
		aliases: ['Beurre Noisette'],
		packet: true,
		gist: 'Butter cooked until its milk solids toast, left in for a nutty taste',
		guest: "It's butter cooked just until it toasts, so it turns golden and smells like hazelnuts. It's rich and warm.",
		why: 'As butter cooks, its water boils off and the milk solids fall to the bottom and toast, the same browning that colors bread crust. That gives a nutty, caramel flavor plain melted butter lacks. The French call it hazelnut butter for the color and smell.',
		madeWith: ['butter'],
		note: 'It goes from toasted to burnt in seconds, so it is usually made to order.',
		pairs: 'Sage and squash pasta, sole, scallops, cakes',
		notThis: 'Not ghee, which toasts the solids and then strains them out. Brown butter keeps them in, and that is the flavor.',
		seeAlso: ['fd_0232', 'fd_0160'],
		confusedWith: ['fd_0162'],
		line: 'Butternut squash agnolotti, brown butter, sage',
		traps: [
			{ says: 'Butter blended with ground roasted hazelnuts into a warm sauce', why: 'The name describes its color and hazelnut smell, not a blend with ground nuts.' }
		]
	},
	{
		id: 'fd_0162',
		term: 'Ghee',
		level: 2,
		gist: 'Butter simmered until its milk solids toast, then strained out',
		guest: "It's butter cooked slowly until golden and nutty, then strained, for a rich, toasty butter flavor you can't get from plain butter.",
		why: 'Butter is simmered until its water cooks off and the milk solids sink and toast, then it is strained. What remains is nearly pure butterfat with a nutty, caramel flavor that keeps at room temperature and takes high heat without burning.',
		madeWith: ['butter'],
		origin: 'India and South Asia, where it is the everyday cooking fat',
		notThis: 'Clarified butter is strained before the solids color. Brown butter keeps its toasted solids in. Ghee toasts them, then strains them out.',
		confusedWith: ['fd_0160', 'fd_0161'],
		line: 'Ghee-roasted cauliflower, cumin, yogurt, mint',
		traps: [
			{ says: 'Plain melted butter, kept warm in a small pot for dipping', why: 'It is cooked until the solids toast and then strained, which plain melted butter never is.' }
		]
	},
	{
		id: 'fd_0163',
		term: 'Compound Butter',
		level: 2,
		aliases: ['Beurre Composé'],
		gist: 'Butter beaten with herbs, chilled in a log, sliced onto hot food',
		guest: "It's butter mixed with herbs and seasonings, then chilled. A slice melts over your steak and turns into the sauce.",
		why: "Softened butter is beaten with herbs, garlic, shallot, citrus or spices, rolled into a log and chilled. A cold slice set on hot steak or fish melts into an instant sauce that carries those flavors. The French classic is maître d'hôtel butter, parsley and lemon.",
		madeWith: ['butter', 'often herbs', 'often garlic', 'sometimes shallot', 'sometimes anchovy', 'sometimes blue cheese'],
		pairs: 'Grilled steak, fish, corn on the cob, warm bread',
		seeAlso: ['fd_0161', 'fd_0205'],
		line: 'Seared strip steak, herb compound butter, fries',
		traps: [
			{ says: 'Butter blended with oil so it can take high heat without burning', why: 'It is butter mixed with flavorings and served cold on hot food, not a cooking fat.' }
		]
	},
	{
		id: 'fd_0164',
		term: 'Mascarpone',
		level: 2,
		say: 'mas-kar-POH-nay',
		gist: 'Silky Italian cheese of cream set with a mild acid, not rennet',
		guest: "It's an Italian cream cheese, silky, sweet and very rich. It's what makes tiramisu so plush, like cream cheese with barely any tang.",
		why: 'Cream, not milk, is warmed and set with a food acid such as citric acid, then drained. With no rennet and no aging it stays spoonable, sweet and only faintly tangy, and because it starts as cream it is far richer than cream cheese.',
		madeWith: ['cream', 'often citric acid'],
		origin: 'Lombardy, in northern Italy',
		pairs: 'Tiramisu, fresh figs, berries and honey, risotto',
		notThis: 'Not ricotta, which is fluffy, grainy curds from whey. Mascarpone is smooth, dense and made from cream.',
		lexiconSlug: 'mascarpone',
		seeAlso: ['fd_0157'],
		confusedWith: ['fd_0165'],
		line: 'Tiramisu, espresso-soaked ladyfingers, mascarpone, cocoa',
		traps: [
			{ says: 'Sweetened whipped cream folded with egg yolks for dessert', why: 'It is a set cream cheese on its own. Tiramisu adds the egg and sugar to it.' }
		]
	},
	{
		id: 'fd_0165',
		term: 'Ricotta',
		level: 1,
		say: 'rih-KAH-tuh',
		gist: 'Soft, fluffy curds made by reheating the whey left from cheesemaking',
		guest: "It's a soft, fluffy fresh cheese with a sweet, milky flavor. Whipped with honey, it's like a cloud on toast.",
		why: 'The name means recooked: whey left from making other cheeses is heated again, often with milk and a little acid, until the last proteins float up as soft curds. Drained, they are light, moist and mildly sweet. Ricotta salata is the pressed, salted, firm version.',
		madeWith: ['whey', 'often milk', 'sometimes cream', 'sometimes vinegar'],
		origin: 'Italy, a by-product of cheesemaking',
		pairs: 'Honey, lemon zest, ravioli, lasagna, grilled bread',
		notThis: 'Not mascarpone, which is dense set cream, or fromage blanc, which is smooth and tangy. Ricotta is light, fluffy curds.',
		lexiconSlug: 'ricotta',
		recipe: 'ravioli-di-ricotta-the-seal',
		confusedWith: ['fd_0164', 'fd_0158'],
		line: 'Whipped ricotta, hot honey, grilled bread',
		traps: [
			{ says: 'The Italian name for cottage cheese, the same curds sold in tubs', why: 'Cottage cheese is curds of milk, while this is traditionally made by reheating whey.' }
		]
	},
	{
		id: 'fd_0166',
		term: 'Burrata',
		level: 2,
		say: 'boo-RAH-tuh',
		gist: 'Pouch of stretched cheese curd filled with cream-soaked shreds',
		guest: "It's a ball of fresh mozzarella filled with cream and soft curd. Cut it open and the center spills out, rich and milky.",
		why: 'Mozzarella curd is stretched in hot water into a thin pouch, filled with stracciatella, shreds of the same curd soaked in cream, then tied shut. The shell is springy and the center loose and sweet, so it eats richer than plain mozzarella.',
		madeWith: ["cow's milk", 'cream', 'sometimes buffalo milk'],
		note: 'Best within a day or two of making, and served at room temperature, not fridge-cold.',
		origin: 'Puglia, southern Italy; the name comes from the Italian for butter',
		notThis: 'Not fresh mozzarella, which is solid all the way through. Burrata has a creamy, spoonable center.',
		lexiconSlug: 'burrata',
		confusedWith: ['fd_0167'],
		line: 'Burrata, heirloom tomatoes, basil oil, grilled bread',
		traps: [
			{ says: 'A ball of mozzarella aged until its center turns soft and runny', why: 'The center is a separate filling of cream and curd, and it is eaten fresh, never aged.' }
		]
	},
	{
		id: 'fd_0167',
		term: 'Fresh Mozzarella',
		level: 1,
		aliases: ['Fior di Latte'],
		gist: 'Soft white ball of stretched milk curd, solid through, kept in liquid',
		guest: "It's soft, milky mozzarella made fresh and kept in water, nothing like the shredded kind. Sweet, delicate and a little springy.",
		why: 'Curds are dipped in hot water and pulled like taffy until smooth and elastic, then shaped into balls and kept in water or whey. Unaged, it tastes of sweet milk with a light tang and melts into soft strings. Low-moisture pizza mozzarella is the drier cousin.',
		madeWith: ["cow's milk"],
		origin: 'Southern Italy; from mozzare, to cut off, as the curd is pinched off by hand',
		notThis: 'Not burrata, which is a mozzarella pouch filled with cream. This is the same curd, solid all the way through.',
		confusedWith: ['fd_0166'],
		line: 'Fresh mozzarella, tomato, basil, olive oil',
		traps: [
			{ says: 'Firm, low-moisture block made for shredding and melting on pizza', why: 'That is the drier, packaged style. This one is soft, wet and sold in liquid.' }
		]
	},
	{
		id: 'fd_0168',
		term: 'Feta',
		level: 1,
		gist: 'Salty, tangy white cheese of sheep and goat milk, aged in brine',
		guest: "It's the Greek brined cheese, crumbly and creamy with a salty, tangy bite. It wakes up salads, watermelon and anything off the grill.",
		why: "Curds are cut into slabs, salted and aged in brine for at least two months. The brine keeps it moist and sharply salty, and sheep's milk gives a rich, creamy tang. In the EU only Greek cheese of sheep's milk, with up to 30 percent goat, carries the name.",
		madeWith: ["sheep's milk", "often goat's milk", "sometimes cow's milk"],
		origin: 'Greece; the name means slice, for the slabs it is cut into',
		pairs: 'Greek salad, watermelon, olives, spanakopita, honey',
		notThis: 'Not chèvre, which is soft, unbrined goat cheese. Feta is firmer, saltier and aged in brine.',
		lexiconSlug: 'feta',
		recipe: 'bougiourdi-baked-feta',
		confusedWith: ['fd_0156'],
		line: 'Baked feta, cherry tomatoes, oregano, warm pita'
	},
	{
		id: 'fd_0169',
		term: 'Blue Cheese',
		level: 1,
		aliases: ['Bleu Cheese'],
		gist: 'Wheel pierced so a mold culture grows in veins, sharp, salty, creamy',
		guest: "It's cheese ripened with a mold that runs through it in blue veins. Sharp, salty and creamy, it's bold, and wonderful with pears or honey.",
		why: 'Milk is set with a blue mold culture, then the young wheel is pierced with needles. Air rushing in lets the mold grow blue-green veins that break down fat and protein, giving the peppery bite and creamy texture. Gorgonzola, Roquefort and Stilton are all in this family.',
		madeWith: ["cow's milk", "sometimes sheep's milk", "sometimes goat's milk", 'blue mold'],
		note: 'Serve it at room temperature and taste it last on a board, since it overpowers milder cheeses.',
		pairs: 'Pears, walnuts, honey, port, steak, wedge salad',
		seeAlso: ['fd_0170', 'fd_0171'],
		line: 'Iceberg wedge, blue cheese, bacon, cherry tomato'
	},
	{
		id: 'fd_0170',
		term: 'Bloomy Rind',
		level: 3,
		gist: 'Soft cheese under a velvety white mold skin that ripens it inward',
		guest: "It's a soft cheese with a thin, velvety white rind, like Brie or Camembert. Inside it's buttery and creamy, with a mild mushroomy flavor.",
		why: 'The young cheese is dusted or sprayed with white molds, which grow a downy skin within about a week. Those molds soften the curd from the outside in, so a ripe one runs creamy under the rind and tastes of butter, cream and mushroom. The rind is edible.',
		madeWith: ["cow's milk", "sometimes goat's milk", "sometimes sheep's milk", 'sometimes added cream', 'white mold cultures'],
		note: 'Best served at room temperature. A firm, chalky center means it is young, and that is normal.',
		pairs: 'Baguette, honey, fig jam, apples, Champagne',
		notThis: 'Not a washed rind. A bloomy rind is white, velvety and mild, while a washed rind is orange, sticky and pungent.',
		seeAlso: ['fd_0169'],
		confusedWith: ['fd_0171'],
		line: 'Bloomy rind cheese, honeycomb, grilled baguette',
		traps: [
			{ says: 'Soft cheese with a white wax coat that is peeled off before eating', why: 'The white skin is living mold grown on the cheese, and it is meant to be eaten.' }
		]
	},
	{
		id: 'fd_0171',
		term: 'Washed Rind',
		level: 4,
		gist: 'Brine-bathed aging cheese with a sticky orange skin and strong aroma',
		guest: "It's a cheese like Taleggio, rubbed with brine as it ages, so the rind turns orange and smells bold. Inside it's milder, soft and savory.",
		why: 'While it ages the cheese is rubbed with brine, sometimes with beer, wine or brandy. The damp, salty surface grows orange bacteria that make the tacky rind and barnyard smell, while the paste stays supple and savory. Think Taleggio or French Munster.',
		madeWith: ["cow's milk", "sometimes goat's milk", "sometimes sheep's milk", 'sometimes beer', 'sometimes wine', 'sometimes brandy'],
		note: 'The rind is edible but strong, and many guests leave it.',
		pairs: 'Belgian ale, Alsatian white wine, pear, rye bread',
		notThis: 'Not a bloomy rind. A washed rind is orange, tacky and pungent, while a bloomy rind is white, velvety and mild.',
		seeAlso: ['fd_0169'],
		confusedWith: ['fd_0170'],
		line: 'Washed rind cheese, pear mostarda, rye crisps',
		traps: [
			{ says: 'Aged cheese rinsed in fresh water to mellow it into a clean, mild taste', why: 'It is washed in brine, sometimes with alcohol, and that makes the rind stronger and more pungent.' }
		]
	}
];

export default cards;
