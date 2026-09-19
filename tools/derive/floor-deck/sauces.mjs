/* The Floor Deck, section "sauces". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0195',
		term: 'Aioli',
		level: 2,
		say: 'eye-OH-lee',
		packet: true,
		gist: 'Thick garlic cream of olive oil beaten in drop by drop',
		guest: "It's a garlic sauce from the south of France, whipped with olive oil until it's thick and creamy. Great for dipping fries or spreading on a sandwich.",
		why: 'Garlic is pounded to a paste and olive oil is whisked in slowly until it thickens like mayonnaise. Most kitchens use egg yolk to hold it, as mayonnaise does, though the oldest versions rely on garlic alone. Raw garlic gives it real heat and bite.',
		madeWith: ['garlic', 'olive oil', 'often egg yolk', 'often lemon juice'],
		note: 'Made with raw egg yolk in most kitchens, so ask whether yours is raw or pasteurized.',
		origin: 'Provence and Catalonia, from the words for garlic and oil',
		seeAlso: ['fd_0198', 'fd_0209', 'fd_0213'],
		line: 'Crispy fries, smoked paprika aioli',
		traps: [
			{ says: 'Melted garlic butter whisked with lemon juice for dipping', why: 'It is made with olive oil beaten into garlic, not melted butter, and served cool.' }
		]
	},
	{
		id: 'fd_0196',
		term: 'Béarnaise',
		level: 2,
		say: 'bair-NAYZ',
		packet: true,
		gist: 'Warm butter sauce of yolks, tarragon, shallot and vinegar',
		guest: "It's a warm, buttery sauce with tarragon and shallot, the classic partner for steak. Rich like hollandaise but with a tangy herb bite.",
		why: 'A reduction of vinegar, shallot, tarragon and pepper is whisked with egg yolks over gentle heat, then butter goes in slowly until it turns thick and glossy. It is a child of hollandaise: the reduction and herbs give it tang and an anise note.',
		madeWith: ['egg yolk', 'butter', 'white wine vinegar', 'shallot', 'tarragon', 'often white wine'],
		pairs: 'Filet, steak frites, grilled fish, roast beef',
		notThis: 'Not hollandaise, the same yolks and butter with lemon. This one is flecked green with tarragon.',
		recipe: 'sauce-bearnaise',
		seeAlso: ['fd_0198', 'fd_0160'],
		confusedWith: ['fd_0197'],
		line: 'Filet mignon, pommes frites, béarnaise',
		traps: [
			{ says: 'Brown pan sauce of red wine and shallots for grilled steak', why: 'It is a pale yellow egg yolk and butter sauce; red wine and shallot is bordelaise.' }
		]
	},
	{
		id: 'fd_0197',
		term: 'Hollandaise',
		level: 1,
		say: 'HAH-luhn-dayz',
		packet: true,
		gist: 'Warm lemony sauce of egg yolks and melted butter',
		guest: "It's a warm, silky butter sauce brightened with lemon, the one on eggs Benedict. It's lovely over asparagus or fish too.",
		why: 'Egg yolks and a little water or lemon are whisked over gentle heat, then melted butter goes in a little at a time. The yolks hold the butter as tiny droplets, so it turns thick and pale. One of the French mother sauces; béarnaise grows from it.',
		madeWith: ['egg yolk', 'butter', 'lemon juice', 'sometimes cayenne'],
		note: 'The yolks are only gently warmed, never set firm. Ask the kitchen whether it uses pasteurized eggs.',
		pairs: 'Eggs Benedict, asparagus, poached salmon, artichokes',
		notThis: 'Not béarnaise, which adds tarragon and shallot, and not beurre blanc, a butter sauce built on wine and shallot.',
		recipe: 'sauce-hollandaise',
		seeAlso: ['fd_0198'],
		confusedWith: ['fd_0196', 'fd_0205'],
		line: 'Eggs Benedict, Canadian bacon, hollandaise',
		traps: [
			{ says: 'Cold sauce of whipped cream, mustard and lemon for fish', why: 'It is served warm and built from egg yolks and melted butter, not cream.' }
		]
	},
	{
		id: 'fd_0198',
		term: 'Emulsion',
		level: 2,
		packet: true,
		gist: 'Fat and liquid beaten into one smooth, even mix',
		guest: 'It means the sauce is whisked or blended so the oil and the liquid stay together, which makes it silky and rich on the tongue.',
		why: 'Oil and water separate, but beaten hard they break into droplets, and an emulsifier such as egg yolk or mustard keeps them apart. Mayonnaise, hollandaise and vinaigrette all work this way. Too hot, too cold or too much fat and it breaks into a greasy puddle.',
		madeWith: ['oil', 'often butter', 'often egg yolk', 'often mustard', 'often vinegar'],
		origin: 'Latin emulgere, to milk out: milk is itself one',
		lexiconSlug: 'emulsions',
		recipe: 'the-broken-emulsion-three-rescues',
		seeAlso: ['fd_0195', 'fd_0197', 'fd_0200'],
		line: 'Seared scallops, brown butter emulsion, peas',
		traps: [
			{ says: 'Clear broth set firm with gelatin and sliced cold', why: 'That is an aspic; this is fat and water held as droplets, not a set gel.' }
		]
	},
	{
		id: 'fd_0199',
		term: 'Jus',
		level: 1,
		say: 'ZHOO',
		packet: true,
		gist: "Thin, glossy sauce made from roast meat's own juices, cooked down",
		guest: "It's the natural juices from the roast, cooked down into a light, glossy sauce. All the flavor of the meat without the heaviness of gravy.",
		why: 'Drippings left in the roasting pan are loosened with stock or wine and simmered down, then strained. It is left thin or only lightly thickened, so it pours like broth but tastes deep. Any roast can make one: lamb, chicken, pork, veal or beef.',
		madeWith: ['meat drippings', 'often stock', 'sometimes wine', 'sometimes butter'],
		origin: 'French for juice; au jus means served with its own juices',
		notThis: 'Not gravy, which is thickened much further, and not demi-glace, a far thicker veal reduction.',
		recipe: 'red-wine-jus-monter-au-beurre',
		seeAlso: ['fd_0214'],
		confusedWith: ['fd_0206'],
		line: 'Roast lamb loin, fondant potato, rosemary jus',
		traps: [
			{ says: 'Light sauce used only for beef, the dip for a French dip sandwich', why: 'It comes from any roast, and lamb and chicken jus are as common as beef.' }
		]
	},
	{
		id: 'fd_0200',
		term: 'Vinaigrette',
		level: 1,
		say: 'vin-uh-GRET',
		packet: true,
		gist: 'Oil whisked with vinegar or citrus, held with mustard',
		guest: "It's a light dressing of good oil and vinegar with a little mustard and shallot. Bright and tangy, it lets the greens taste like themselves.",
		why: 'The classic ratio is about three parts oil to one of vinegar. Whisked hard, the vinegar breaks into droplets in the oil, and mustard helps them stay put, but it still separates on standing, so it gets a shake. Beyond salad it dresses leeks, fish and grains.',
		madeWith: ['oil', 'sometimes walnut or hazelnut oil', 'vinegar', 'often mustard', 'often shallot', 'sometimes honey'],
		origin: 'French, from vinaigre, vinegar',
		recipe: 'vinaigrette-the-three-to-one',
		seeAlso: ['fd_0198', 'fd_0272', 'fd_0201'],
		line: 'Little gems, radish, sherry vinaigrette',
		traps: [
			{ says: 'Creamy dressing of mayonnaise, buttermilk and fresh herbs', why: 'It is oil whisked with vinegar; mayonnaise and buttermilk describe ranch.' }
		]
	},
	{
		id: 'fd_0201',
		term: 'Mignonette',
		level: 2,
		say: 'min-yuh-NET',
		packet: true,
		gist: 'Minced shallot and black pepper steeped in vinegar',
		guest: "It's a sharp little sauce of shallot, cracked pepper and vinegar for the oysters. A few drops brighten the brine without covering it.",
		why: "Shallot is minced fine and steeped in red wine or champagne vinegar with coarsely cracked black pepper. It is thinner and sharper than any salad dressing, so it cuts the oyster's salt and richness instead of masking it.",
		madeWith: ['shallot', 'vinegar', 'black pepper'],
		origin: 'French for coarsely cracked pepper, the heart of the sauce',
		pairs: 'Raw oysters on the half shell, clams, crudo',
		seeAlso: ['fd_0115', 'fd_0200', 'fd_0137'],
		line: 'East Coast oysters, champagne mignonette, lemon',
		traps: [
			{ says: 'Sweet red cocktail sauce of ketchup and horseradish', why: 'It is thin, sharp and clear, made with vinegar and shallot, not ketchup.' }
		]
	},
	{
		id: 'fd_0202',
		term: 'Gastrique',
		level: 3,
		say: 'gas-TREEK',
		packet: true,
		gist: 'Caramelized sugar cooked with vinegar into a syrup',
		guest: "It's a sweet and tangy glaze made from caramel and vinegar, often with fruit. It's there to cut the richness of the meat.",
		why: 'Sugar is cooked to caramel, then vinegar goes in and it simmers to a syrup, often with fruit or stock. The caramel brings depth, the vinegar brings snap, and together they cut through rich, fatty meats. The base of classic duck with orange.',
		madeWith: ['sugar', 'vinegar', 'often fruit', 'sometimes stock', 'sometimes wine'],
		pairs: 'Duck breast, pork belly, foie gras, stone fruit',
		notThis: 'Not agrodolce, the Italian sweet-sour that is often chunky with onion or raisins. This one is a smooth syrup.',
		seeAlso: ['fd_0056', 'fd_0266'],
		confusedWith: ['fd_0215'],
		line: 'Seared duck breast, cherry gastrique, parsnip',
		traps: [
			{ says: 'Balsamic vinegar simmered down on its own until thick', why: 'It starts from caramelized sugar, and any vinegar can be used, not only balsamic.' }
		]
	},
	{
		id: 'fd_0203',
		term: 'Coulis',
		level: 2,
		say: 'koo-LEE',
		packet: true,
		gist: 'Smooth, strained purée of fruit or vegetable, served as a sauce',
		guest: "It's ripe fruit, or sometimes a vegetable, blended and strained into a smooth, pourable sauce. It tastes like the fruit itself, only silkier.",
		why: 'Fruit such as raspberry or mango, or a vegetable such as roasted red pepper, is blended, lightly sweetened and pushed through a fine sieve to catch seeds and skins. Raw or barely cooked and thickened by its own pulp, it tastes fresh, not jammy.',
		madeWith: ['fruit or vegetable', 'often sugar', 'often lemon juice', 'sometimes liqueur'],
		origin: 'French, from couler, to flow or to strain',
		pairs: 'Cheesecake, panna cotta, chocolate cake, ice cream',
		notThis: 'Not a compote, which is fruit cooked in soft chunks. This is blended and strained perfectly smooth.',
		seeAlso: ['fd_0036'],
		confusedWith: ['fd_0270'],
		line: 'Vanilla cheesecake, raspberry coulis, mint'
	},
	{
		id: 'fd_0204',
		term: 'Consommé',
		level: 2,
		say: 'kahn-suh-MAY',
		packet: true,
		gist: 'Rich meat stock made crystal clear by a raft of egg white',
		guest: "It's a rich broth made crystal clear with egg white. You can see the bottom of the bowl, yet every spoonful tastes of long-simmered meat.",
		why: 'A strong stock is whisked cold with egg whites, lean ground meat and chopped vegetables, then heated gently. The whites set into a floating raft that traps the cloudy particles while the meat adds flavor. The broth is ladled out through a hole in the raft and strained.',
		madeWith: ['beef or chicken stock', 'egg white', 'lean ground meat', 'celery', 'carrot', 'onion'],
		origin: 'French for completed, a stock taken to its finish',
		notThis: 'Not plain broth or stock, which stays cloudy. Clarity is the test: a true one is see-through.',
		lexiconSlug: 'consomme-and-clarification',
		recipe: 'chicken-consomme-raft-method',
		confusedWith: ['fd_0214'],
		line: 'Oxtail consommé, root vegetables, chervil',
		traps: [
			{ says: 'Light clear soup made by thinning a meat stock down with water', why: 'It is stronger than the stock it starts from, clarified with egg whites, never thinned.' }
		]
	},
	{
		id: 'fd_0205',
		term: 'Beurre Blanc',
		level: 3,
		say: 'BURR BLAHN',
		gist: 'Cold butter whisked into a reduction of wine and shallot',
		guest: "It's a warm butter sauce sharpened with white wine and shallot. Silky and rich with a bright finish, and a classic with fish and scallops.",
		why: 'White wine and vinegar are boiled down with minced shallot to a few spoonfuls, then cold butter is whisked in piece by piece. Kept just warm, the butter stays suspended as an emulsion, so the sauce eats creamy rather than oily and the acid cuts the richness.',
		madeWith: ['butter', 'white wine', 'white wine vinegar', 'shallot', 'sometimes cream'],
		note: 'Fragile. Too hot and it splits into oil, too cold and it sets, so kitchens make it near service and hold it just warm.',
		origin: 'French for white butter, from the Loire Valley near Nantes',
		notThis: 'Not hollandaise, which is thickened with egg yolk. This is butter whisked into a wine reduction.',
		recipe: 'beurre-blanc',
		seeAlso: ['fd_0198'],
		confusedWith: ['fd_0197'],
		line: 'Seared scallops, beurre blanc, spring peas',
		traps: [
			{ says: 'Plain melted butter spooned over fish as it comes out of the pan', why: 'Melted butter separates into fat and water. This is a creamy emulsion built on a reduction.' }
		]
	},
	{
		id: 'fd_0206',
		term: 'Demi-Glace',
		level: 2,
		say: 'DEM-ee-glahss',
		gist: 'Glossy brown sauce base of roasted veal stock reduced by half',
		guest: "It's a deeply reduced meat sauce, classically veal, glossy and rich and the backbone of a great steak sauce. Think of the best gravy you've had, concentrated.",
		why: 'Veal bones and vegetables are roasted and simmered for hours into brown stock, which is then reduced by about half, classically with a roux-thickened brown sauce. Gelatin from the bones gives body and shine, and the long reduction concentrates roasted, meaty flavor.',
		madeWith: ['traditionally veal bones', 'onion', 'carrot', 'celery', 'tomato', 'often madeira', 'often wheat flour'],
		origin: 'French for half glaze, halfway between a sauce and a glaze',
		pairs: 'Steak, veal chop, short rib, and the base of bordelaise',
		notThis: 'Not jus, the thin, unthickened pan juice. This is thicker and glossier and coats a spoon.',
		lexiconSlug: 'stocks-blanc-brun-broth-and-demi',
		recipe: 'sauce-espagnole-and-demi-glace',
		seeAlso: ['fd_0214'],
		confusedWith: ['fd_0199'],
		line: 'Grilled veal chop, potato purée, demi-glace',
		traps: [
			{ says: 'Half-strength stock thinned with water for a lighter pan sauce', why: 'Half refers to reducing it by half, which makes it stronger, not weaker.' }
		]
	},
	{
		id: 'fd_0207',
		term: 'Velouté',
		level: 3,
		say: 'veh-loo-TAY',
		gist: 'Pale mother sauce of light stock thickened with butter and flour',
		guest: "It's a silky sauce made from chicken or fish broth, thickened lightly. Mild and savory, it lets delicate fish or chicken taste like themselves.",
		why: 'Butter and flour are cooked to a pale roux, then light stock from chicken, veal or fish is whisked in and simmered until smooth. Finished with cream it becomes sauce suprême, and with wine and cream a white wine sauce for fish.',
		madeWith: ['butter', 'wheat flour', 'white stock', 'sometimes fish stock', 'often cream'],
		note: 'On a menu the word can also name a silky puréed soup, as in mushroom velouté.',
		origin: 'French for velvety, one of the five mother sauces',
		notThis: 'Not béchamel, which is made with milk. This is built on stock, so it tastes savory, not milky.',
		recipe: 'sauce-veloute',
		seeAlso: ['fd_0214'],
		confusedWith: ['fd_0208'],
		line: 'Poached halibut, mussel velouté, leeks'
	},
	{
		id: 'fd_0208',
		term: 'Béchamel',
		level: 2,
		say: 'BESH-uh-mel',
		gist: 'Hot milk thickened with butter and flour, the white base',
		guest: "It's a creamy white sauce of milk thickened with butter and flour. It's what makes a classic lasagna, a gratin or a croque monsieur so rich.",
		why: 'Butter and flour are cooked briefly without browning, then hot milk is whisked in and simmered until thick and smooth, often seasoned with nutmeg. Add cheese and it becomes Mornay, the sauce behind many gratins and baked macaroni. It tastes mild, milky and gentle.',
		madeWith: ['milk', 'butter', 'wheat flour', 'often nutmeg', 'sometimes onion'],
		origin: 'French, traditionally named for Louis de Béchameil, steward to Louis XIV',
		pairs: 'Lasagna, croque monsieur, gratins, moussaka',
		notThis: 'Not velouté, which thickens light stock the same way. This one is built on milk, so it is paler and milkier.',
		recipe: 'sauce-bechamel',
		seeAlso: ['fd_0225'],
		confusedWith: ['fd_0207'],
		line: 'Croque monsieur, ham, gruyère, béchamel',
		traps: [
			{ says: 'Rich sauce of reduced heavy cream and melted grated parmesan', why: 'It is milk thickened with cooked butter and flour, not reduced cream and cheese.' }
		]
	},
	{
		id: 'fd_0209',
		term: 'Remoulade',
		level: 2,
		say: 'REM-uh-lahd',
		gist: 'Cold mayonnaise sauce sharpened with pickles, capers and mustard',
		guest: "It's a tangy, creamy cold sauce, mayonnaise sharpened with mustard, pickles and herbs. It's great with anything fried, especially crab cakes.",
		why: 'Most start with mayonnaise, an emulsion of egg yolk and oil, then take chopped pickles, capers, herbs and mustard. The French version is pale and herby. The Louisiana one is often pink or orange with Creole mustard, paprika, hot sauce and horseradish, and bolder.',
		madeWith: ['egg yolk', 'oil', 'mustard', 'pickles', 'capers', 'often anchovy', 'sometimes horseradish'],
		note: 'House-made versions are often whisked from raw egg yolk. Ask the kitchen whether theirs uses pasteurized egg.',
		pairs: "Crab cakes, fried shrimp, po' boys, celery root salad",
		notThis: 'Not tartar sauce, though close. It is usually more mustardy and herby, and in Louisiana spicier and pinker.',
		seeAlso: ['fd_0195', 'fd_0198'],
		line: 'Crab cakes, Creole remoulade, pickled okra'
	},
	{
		id: 'fd_0210',
		term: 'Chimichurri',
		level: 2,
		say: 'chee-mee-CHOO-ree',
		gist: 'Raw Argentine sauce of parsley, garlic, oil and vinegar',
		guest: "It's Argentina's steak sauce, chopped parsley and garlic in oil and vinegar with a little chili. Bright and sharp, it cuts through rich grilled meat.",
		why: 'Parsley, garlic and dried oregano are chopped, usually by hand rather than blended, and loosened with oil, red wine vinegar and red pepper flakes. Raw garlic and vinegar make it sharp enough to cut fat, which is why it sits beside grilled beef at an Argentine asado.',
		madeWith: ['parsley', 'garlic', 'oregano', 'oil', 'red wine vinegar', 'red pepper flakes'],
		origin: 'Argentina and Uruguay, the table sauce of the asado grill',
		notThis: 'Not pesto or Italian salsa verde. This is loose, vinegar-sharp and flecked with oregano and chili.',
		recipe: 'chimichurri-verde',
		seeAlso: ['fd_0098', 'fd_0088'],
		confusedWith: ['fd_0212', 'fd_0211'],
		line: 'Wood-grilled skirt steak, chimichurri, crispy potatoes',
		traps: [
			{ says: 'Smooth blended cilantro and lime sauce spooned over tacos', why: 'The classic is parsley, oregano and vinegar, chopped, not cilantro and lime.' }
		]
	},
	{
		id: 'fd_0211',
		term: 'Salsa Verde',
		level: 2,
		say: 'SAHL-sah VEHR-day',
		gist: 'Chopped parsley sauce sharpened with capers, anchovy and vinegar',
		guest: "It's a bright Italian green sauce of chopped parsley, capers, anchovy and good olive oil. It wakes up rich meats and grilled fish.",
		why: 'The herbs are chopped by hand rather than blended, loosened with olive oil and sharpened with vinegar or lemon. Capers and anchovy add salt and savory depth without tasting fishy, and the acid cuts through fatty meat. It is served at room temperature, never cooked.',
		madeWith: ['parsley', 'olive oil', 'capers', 'often anchovy', 'garlic', 'sometimes bread', 'sometimes hard-boiled egg'],
		origin: 'Italian for green sauce, classic beside the boiled meats of Piedmont',
		notThis: 'Not chimichurri, which leans on oregano and chili and skips the capers. Mexican salsa verde is a tomatillo salsa.',
		recipe: 'salsa-verde-italian',
		seeAlso: ['fd_0212'],
		confusedWith: ['fd_0210'],
		line: 'Grilled swordfish, salsa verde, charred lemon'
	},
	{
		id: 'fd_0212',
		term: 'Pesto',
		level: 1,
		gist: 'Pounded basil sauce with pine nuts, garlic, hard cheese and oil',
		guest: "It's the classic basil sauce from Genoa, made with pine nuts, garlic, Parmesan and olive oil. Fresh, green and nutty, it clings to pasta.",
		why: 'The name comes from the Italian for to pound, as in a mortar and pestle. Crushing the leaves bursts their oils instead of slicing them, so the sauce is fragrant and glossy. Cheese and nuts give it body, so it coats pasta the way a cream sauce would.',
		madeWith: ['basil', 'pine nuts', 'parmesan', 'often pecorino', 'garlic', 'olive oil', 'sometimes walnuts'],
		note: 'Cut basil darkens in air, so a dull top layer is normal. Kitchens often seal it under a film of oil.',
		origin: 'Genoa in Liguria, from pestare, Italian for to pound',
		pairs: 'Trofie or trenette with green beans and potato, minestrone',
		seeAlso: ['fd_0211', 'fd_0159'],
		line: 'Trofie, basil pesto, green beans, potato',
		traps: [
			{ says: 'Warm basil cream sauce thickened with butter and flour for pasta', why: 'It is served raw, and its body comes from cheese, nuts and oil.' }
		]
	},
	{
		id: 'fd_0213',
		term: 'Romesco',
		level: 3,
		say: 'roh-MEHS-koh',
		gist: 'Catalan sauce of dried red peppers, roasted tomato, nuts and bread',
		guest: "It's a Catalan sauce of dried sweet red peppers and roasted tomato, ground with toasted almonds and garlic. Earthy, nutty and a little sweet.",
		why: 'Dried sweet peppers, traditionally the small round ñora, are soaked and ground with roasted tomato and garlic, then thickened with toasted almonds or hazelnuts and fried bread. The nuts and bread make it thick and spoonable, and a splash of vinegar keeps it bright.',
		madeWith: ['dried red pepper', 'tomato', 'almonds', 'often hazelnuts', 'bread', 'garlic', 'olive oil'],
		origin: 'Tarragona on the Catalan coast, said to come from its fishermen',
		pairs: 'Grilled spring onions and leeks, grilled fish, potatoes',
		recipe: 'romesco',
		seeAlso: ['fd_0283', 'fd_0272'],
		line: 'Grilled leeks, romesco, toasted hazelnuts',
		traps: [
			{ says: 'Fresh raw salsa of chopped tomato, onion, green chile and cilantro', why: 'It is ground from dried peppers, roasted tomato, nuts and bread, not chopped raw.' }
		]
	},
	{
		id: 'fd_0214',
		term: 'Stock',
		level: 1,
		gist: 'Liquid simmered from bones and aromatics, the base under sauces',
		guest: "It's the kitchen's foundation, bones and vegetables simmered slowly in water into a rich liquid. It's what gives sauces and soups their depth.",
		why: 'Bones and vegetables simmer gently in water for hours, or under an hour for fish. Collagen in the bones melts into gelatin, which gives stock body and makes it set when cold. Roasting the bones first makes brown stock, deeper in color and flavor, for dark sauces.',
		madeWith: ['chicken bones', 'often veal bones', 'sometimes fish bones', 'sometimes shellfish shells', 'sometimes white wine', 'onion', 'celery'],
		note: 'Kitchens usually leave it unsalted, because it gets reduced into sauces and salt would concentrate.',
		notThis: 'Not broth, which is made from meat and seasoned to drink. Stock is a building block, rarely served on its own.',
		lexiconSlug: 'stocks-blanc-brun-broth-and-demi',
		recipe: 'brown-veal-stock',
		seeAlso: ['fd_0206', 'fd_0207', 'fd_0204'],
		line: 'Steamed clams, fish stock, white wine, grilled bread'
	},
	{
		id: 'fd_0215',
		term: 'Agrodolce',
		level: 3,
		say: 'ah-groh-DOHL-chay',
		gist: 'Italian sweet-sour sauce of vinegar, sugar, raisins and onion',
		guest: "It's the Italian take on sweet and sour, vinegar and sugar or honey cooked down, often with raisins and onions. It makes rich meats and vegetables pop.",
		why: "Vinegar is cooked with sugar or honey until syrupy, and in Sicily raisins, pine nuts and onions often go in. The sweetness rounds off the vinegar's edge, so it cuts through fat without puckering, which is why it lands on duck, pork, rabbit and squash.",
		madeWith: ['wine vinegar', 'sugar', 'often honey', 'often raisins', 'often onion', 'sometimes pine nuts'],
		origin: 'Italian for sour-sweet, strongest in Sicilian and Roman cooking',
		notThis: 'Not gastrique, the smooth French sauce base of caramelized sugar and vinegar. Agrodolce is chunkier and often holds fruit and onion.',
		seeAlso: ['fd_0266', 'fd_0274'],
		confusedWith: ['fd_0202'],
		line: 'Roast duck breast, cherry agrodolce, farro',
		traps: [
			{ says: 'Chinese sweet and sour sauce of pineapple, ketchup and cornstarch', why: 'It is Italian, built on vinegar with sugar or honey, often with raisins and onion.' }
		]
	}
];

export default cards;
