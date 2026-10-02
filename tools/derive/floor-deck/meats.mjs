/* The Floor Deck, section "meats". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0050',
		term: 'Escargot',
		level: 2,
		say: 'ess-kar-GOH',
		packet: true,
		gist: 'Land snails baked in their shells under garlic and parsley butter',
		guest: "They're snails, baked in a sizzling garlic and herb butter. The texture is like a tender mushroom or a clam, and the butter is the star, so save bread for it.",
		why: 'The snail is a land mollusk, a cousin of the clam, bought cleaned and precooked, usually tinned. It tastes of very little on its own, mild and earthy, so it carries the sauce: in the Burgundy classic, butter beaten with garlic, parsley and shallot.',
		madeWith: ['snail', 'butter', 'garlic', 'parsley', 'often shallot', 'sometimes white wine'],
		origin: 'French for snail, and the classic recipe comes from Burgundy',
		pairs: 'Crusty bread for the butter, a glass of white Burgundy',
		seeAlso: ['fd_0137', 'fd_0114'],
		line: 'Escargot in garlic parsley butter, grilled baguette',
		traps: [
			{ says: 'Small sea snails picked from the shell and served chilled with lemon', why: 'These are land snails, and the dish is served piping hot in butter, not cold.' }
		]
	},
	{
		id: 'fd_0051',
		term: 'Guinea Hen',
		level: 2,
		aliases: ['Guinea Fowl', 'Pintade'],
		packet: true,
		gist: 'African farmyard fowl, leaner and a little darker than chicken',
		guest: "It's a farm bird like chicken, but a little deeper and more savory, with firmer, leaner meat and just a faint wild note.",
		why: 'Guinea fowl came to European farms from West Africa and is a restless, active bird, naturally lean. More exercise means darker, firmer meat and more flavor than chicken, with only a light game note. Little fat means it dries out fast, so kitchens often braise the legs.',
		madeWith: ['guinea fowl', 'often butter', 'sometimes bacon'],
		origin: 'West Africa, and pintade on French menus, a farm-table staple',
		notThis: 'Not pheasant, though the two eat much alike. Guinea hen is a speckled farm fowl; pheasant is the long-tailed game bird.',
		seeAlso: ['fd_0057'],
		confusedWith: ['fd_0060'],
		line: 'Roasted guinea hen, morels, spring onion jus',
		traps: [
			{ says: 'Wild game bird shot in season, every bit as dark and strong as venison', why: 'It is a farmed bird, and its meat is only a shade darker and richer than chicken.' }
		]
	},
	{
		id: 'fd_0052',
		term: 'Quail',
		level: 2,
		packet: true,
		gist: 'Tiny farmed game bird, served one or two a plate, mild and juicy',
		guest: "It's a small bird, about a handful, tender and juicy with a flavor a little richer than chicken dark meat. The legs are meant to be picked up.",
		why: 'Restaurant quail is farm raised and weighs about 5 ounces whole, so it cooks in minutes and stays moist. The meat is all fairly dark but mild, not gamy. Most kitchens serve it semi-boneless, with the rib cage out and the leg and wing bones left in.',
		madeWith: ['quail', 'often butter', 'sometimes bacon', 'sometimes pork sausage'],
		note: 'Semi-boneless still means small bones in the legs and wings. Warn guests who expect a boneless bird.',
		pairs: 'Grits, sausage stuffing, a honey or sorghum glaze, pepper jelly',
		seeAlso: ['fd_0053', 'fd_0057'],
		line: 'Grilled semi-boneless quail, cheddar grits, pepper jelly',
		traps: [
			{ says: 'Tiny wild-shot bird with a strong, gamy flavor and dark, livery meat', why: 'Restaurant quail is farmed and eats mild, only a little richer than chicken dark meat.' }
		]
	},
	{
		id: 'fd_0053',
		term: 'Squab',
		level: 3,
		packet: true,
		gist: 'Young pigeon raised on a farm, deep red meat served rosy',
		guest: 'Squab is a young farm-raised pigeon. The meat is dark red and rich, closer to duck or even a tender steak than to chicken.',
		why: 'Squab are raised in lofts and taken at about four weeks, before they fly, so the muscle is tender. Pigeon breast is all dark meat, full of the iron-rich protein that makes beef red, which gives a deep, slightly livery flavor. It is milder than wild game.',
		madeWith: ['pigeon', 'often butter', 'sometimes red wine'],
		note: 'The breast is classically served medium rare. Cooked through it turns dry and tastes of liver, so ask before it fires.',
		origin: 'English word for a young pigeon, pigeonneau on French menus',
		pairs: 'Cherries, beets, farro, a red wine or berry sauce',
		seeAlso: ['fd_0056', 'fd_0052'],
		line: 'Roasted squab breast, confit leg, cherries, jus',
		traps: [
			{ says: 'Wild city pigeon trapped in season, stringy and strongly flavored', why: 'It is a farm-raised young pigeon taken before it ever flies, so it is tender.' }
		]
	},
	{
		id: 'fd_0054',
		term: 'Sweetbreads',
		level: 3,
		packet: true,
		gist: 'Calf thymus or pancreas, crisp outside and creamy within',
		guest: "They're a gland, usually the thymus of veal, and neither sweet nor bread. A mild organ meat, nothing like liver, crisp outside and soft and creamy inside.",
		why: 'Sweetbreads are glands: the thymus in the throat of a young animal and the pancreas near the stomach. They are soaked, blanched, peeled of their membrane and pressed, then seared or fried. Little muscle means no chew, just a soft, milky richness.',
		madeWith: ['veal', 'sometimes lamb', 'often butter', 'often wheat flour', 'sometimes egg', 'sometimes milk'],
		pairs: 'Brown butter, capers, lemon, mushrooms, a sharp gastrique',
		recipe: 'grilled-veal-sweetbreads',
		seeAlso: ['fd_0061', 'fd_0062', 'fd_0161'],
		line: 'Crispy veal sweetbreads, brown butter, capers, lemon',
		traps: [
			{ says: 'Calf testicles, sliced thin, breaded and fried until crisp', why: 'Those are mountain oysters. Sweetbreads are the thymus or pancreas gland.' },
			{ says: 'Sweet yeast dough fried in lard and rolled in cinnamon sugar', why: 'It is not bread or pastry at all but a gland, most often from veal.' }
		]
	},
	{
		id: 'fd_0055',
		term: 'Foie Gras',
		level: 2,
		say: 'FWAH GRAH',
		packet: true,
		gist: 'Specially fattened liver of a duck or goose, silky and buttery',
		guest: 'It is the fattened liver of a duck, the richest bite in French cooking. Seared, it is crisp outside and melts like butter inside.',
		why: 'The birds are force-fed corn in their last weeks, called gavage, so the liver swells with fat. That fat is why it melts at body heat and tastes sweet and buttery, only faintly of liver. Most American foie gras is duck. Goose is rarer.',
		madeWith: ['duck liver', 'sometimes goose liver', 'sometimes brandy', 'sometimes sweet wine'],
		note: 'Seared, it stays pink at the center, and a torchon is only gently cooked. Some guests object to how it is made, so answer honestly.',
		origin: 'French for fat liver, an ancient craft now centered on southwest France',
		notThis: 'Not chicken liver mousse, lean liver whipped with butter, or pâté, a ground meat spread. This is the whole fattened liver.',
		lexiconSlug: 'foie-gras-torchon-mi-cuit-and-ethics-of-service',
		recipe: 'foie-gras-de-canard-poele-au-verjus',
		confusedWith: ['fd_0062', 'fd_0073'],
		line: 'Seared foie gras, brioche, fig jam, Sauternes',
		traps: [
			{ says: 'Liver of wild ducks taken in season, naturally richer in autumn', why: 'It comes from farmed ducks or geese, force-fed in their last weeks, not wild birds.' }
		]
	},
	{
		id: 'fd_0056',
		term: 'Duck Breast',
		level: 1,
		aliases: ['Magret'],
		gist: 'Red-meat poultry cut under a thick fat cap, rendered until crisp',
		guest: "It's the breast of the duck, served rosy and sliced like a steak, rich and tender under crisp, golden skin.",
		why: 'Ducks descend from strong fliers, so the breast is dark, red muscle, full of flavor. Under the skin sits a thick layer of fat that the cook scores and renders slowly, skin side down, until it turns crisp and bastes the meat. Sliced, it looks like a sirloin.',
		madeWith: ['duck', 'sometimes honey', 'sometimes orange', 'sometimes red wine'],
		note: 'Most kitchens send it medium rare. Well done it tightens and tastes of liver, so ask first.',
		origin: 'Magret is French for the breast of a duck raised for foie gras',
		pairs: 'Cherries, orange, a sweet and sour gastrique, farro, turnips',
		seeAlso: ['fd_0055', 'fd_0053', 'fd_0029'],
		line: 'Seared duck breast, cherry gastrique, parsnip puree',
		traps: [
			{ says: "White meat from the bird's chest that must always be served well done", why: 'It is red meat, and most kitchens serve it pink and sliced like a steak.' }
		]
	},
	{
		id: 'fd_0057',
		term: 'Poussin',
		level: 3,
		say: 'poo-SAN',
		gist: 'Chicken taken at under a month old, about a pound, one per guest',
		guest: "It's a baby chicken, small enough that you get the whole bird. Very tender, mild and juicy, with crisp skin all the way around.",
		why: 'A poussin is slaughtered at under 28 days and weighs about a pound, so the meat has had no time to toughen. It tastes like a mild, delicate chicken. Small size means it roasts fast and stays juicy, and kitchens often split it flat to cook evenly.',
		madeWith: ['chicken', 'often butter', 'often garlic', 'sometimes lemon'],
		origin: 'French for a chick, and used by British butchers too',
		notThis: 'Not a Cornish game hen, which is a little older and larger. Poussin is the smallest chicken sold.',
		seeAlso: ['fd_0052', 'fd_0051'],
		line: 'Roasted poussin, salsa verde, crispy potatoes',
		traps: [
			{ says: 'Older laying hen, slow-stewed for hours because the meat has grown tough', why: 'It is the opposite: a chicken taken very young, tender enough to roast fast.' }
		]
	},
	{
		id: 'fd_0058',
		term: 'Rabbit',
		level: 2,
		gist: 'Small farmed mammal with lean, pale, mild meat, often braised',
		guest: 'Rabbit is lean, pale and mild, a lot like the dark meat of chicken but a touch sweeter. It is usually braised slowly so it stays juicy.',
		why: 'Farmed rabbit carries almost no fat marbled through the meat, so it is fine-grained, pale and gentle, closer to chicken than to game. That leanness means the loin dries out fast, so kitchens often cook the loin briefly and braise the legs in wine or stock.',
		madeWith: ['rabbit', 'often white wine', 'often butter', 'sometimes cream', 'sometimes bacon', 'sometimes mustard'],
		note: 'Braised legs come on the bone, and rabbit has many small, fine bones.',
		pairs: 'Mustard cream, white wine, prunes, pappardelle',
		seeAlso: ['fd_0026', 'fd_0051'],
		line: 'Braised rabbit, pappardelle, mustard cream',
		traps: [
			{ says: 'Dark, gamy meat of a wild hare, hung for days before it is cooked', why: 'Menu rabbit is a farmed domestic animal with pale, mild meat, not dark, hung wild hare.' }
		]
	},
	{
		id: 'fd_0059',
		term: 'Venison',
		level: 2,
		say: 'VEN-ih-sun',
		gist: 'Deep red, very lean deer meat, its loin served rare to medium rare',
		guest: 'Venison is deer, and it eats like a very lean, tender beef filet with a clean, slightly wild flavor. Loin and steaks are at their best rare to medium rare.',
		why: 'Deer carry very little marbling, so the meat is dense, deep red and rich in iron. Hunted game generally cannot be sold in US restaurants, so menus serve farm-raised deer, much of it from New Zealand, which tastes milder than wild.',
		madeWith: ['venison', 'often red wine', 'often butter', 'sometimes juniper'],
		note: 'So lean that past medium it turns dry and livery, which is why most kitchens send the loin rare to medium rare.',
		pairs: 'Juniper, red wine, blackberry or cherry, celery root',
		seeAlso: ['fd_0093', 'fd_0199'],
		line: 'Seared venison loin, juniper jus, celery root',
		traps: [
			{ says: 'Well-marbled meat of wild boar, roasted slowly like a pork shoulder', why: 'Venison is deer, not boar, and it is very lean rather than marbled.' }
		]
	},
	{
		id: 'fd_0060',
		term: 'Pheasant',
		level: 2,
		gist: 'Long-tailed game bird with a lean, pale breast and a faint wild edge',
		guest: 'Pheasant is a game bird that eats like a more flavorful chicken, lean and pale with a light wild note. It is a gentle first step into game.',
		why: 'Most pheasant on menus is farm-raised. The bird is leaner than chicken, so the breast dries easily and is often wrapped in bacon or sauced with cream, while the legs are sinewy and do best braised. The flavor sits just a little deeper than chicken.',
		madeWith: ['pheasant', 'often butter', 'often cream', 'sometimes bacon', 'sometimes apple brandy', 'sometimes chestnut', 'sometimes bread'],
		pairs: 'Apples, cream, bacon, chestnuts, bread sauce',
		notThis: 'Not guinea hen, a domesticated African fowl. Both eat like a richer chicken, but pheasant is the classic autumn game bird.',
		recipe: 'south-dakota-pheasant-with-cream-gravy',
		seeAlso: ['fd_0052'],
		confusedWith: ['fd_0051'],
		line: 'Roast pheasant, apples, chestnuts, cream sauce'
	},
	{
		id: 'fd_0061',
		term: 'Bone Marrow',
		level: 2,
		gist: "Soft beef fat from a leg's hollow core, roasted and spread on toast",
		guest: 'Bone marrow is the soft center of a beef bone, roasted until it melts. You scoop it onto toast, and it tastes like the best part of a roast, spread like butter.',
		why: 'Cattle leg bones hold a core of marrow that is mostly fat. Split lengthwise or cut into rounds and roasted in a hot oven, it turns soft and wobbly and tastes deeply beefy and buttery. A sharp parsley salad and salt cut the richness.',
		madeWith: ['beef', 'bread', 'often parsley', 'often shallot', 'sometimes capers'],
		note: 'It arrives in the bone with a small spoon for scooping. The bone itself is not eaten.',
		origin: 'Made a modern classic by Fergus Henderson at St. John, London, in the 1990s',
		pairs: 'Grilled bread, parsley and caper salad, flaky salt',
		recipe: 'roast-bone-marrow-with-parsley-salad',
		seeAlso: ['fd_0103', 'fd_0102', 'fd_0284'],
		line: 'Roasted bone marrow, parsley salad, grilled bread'
	},
	{
		id: 'fd_0062',
		term: 'Chicken Liver',
		level: 2,
		gist: 'Small, iron-rich chicken organ, silky unless it is overcooked',
		guest: 'Chicken livers are rich and silky, with a mild, slightly sweet iron flavor. Most often they are whipped with butter into a smooth spread for toast.',
		why: 'The liver stores iron and vitamin A, which gives it a mineral depth, and it has a fine, tender texture with almost no connective tissue. Overcooked, it turns grainy, so kitchens cook it gently, then blend it with butter into a pâté or bake it into a silky parfait.',
		madeWith: ['chicken liver', 'butter', 'often egg', 'often shallot', 'often brandy or port', 'sometimes cream'],
		note: 'Pink chicken liver is linked to food poisoning, and US guidance is to cook it to 74 C (165 F). Ask the kitchen how theirs is done.',
		notThis: 'Not foie gras, the fattened liver of a duck or goose. Chicken liver is smaller, leaner, more mineral and far cheaper.',
		recipe: 'chicken-liver-parfait',
		seeAlso: ['fd_0073', 'fd_0084'],
		confusedWith: ['fd_0055'],
		line: 'Chicken liver mousse, pickled shallot, grilled bread'
	},
	{
		id: 'fd_0063',
		term: 'Beef Tongue',
		level: 2,
		aliases: ['Lengua'],
		gist: 'Dense, fatty cow muscle, usually simmered for hours, then sliced',
		guest: 'Beef tongue is usually simmered until tender, then sliced. It eats like very tender, rich roast beef, with none of the strong taste people expect from organ meats.',
		why: 'The tongue is a muscle, worked constantly and laced with fat, so it is usually simmered three hours or more. The tough outer skin is then peeled off, leaving fine-grained, rich meat that slices neatly or crisps on a griddle, a lot like soft brisket.',
		madeWith: ['beef', 'often onion', 'often garlic', 'sometimes bay leaf'],
		origin: 'Lengua in Mexican tacos, gyutan in Japanese grill bars, a Jewish deli staple',
		seeAlso: ['fd_0085', 'fd_0101', 'fd_0087'],
		line: 'Lengua tacos, tomatillo salsa, onion, cilantro',
		traps: [
			{ says: 'Gristly, strong-tasting organ that stays chewy however long it cooks', why: 'It is a muscle that turns tender with long cooking and tastes like mild roast beef.' }
		]
	},
	{
		id: 'fd_0305',
		term: 'Tripe',
		level: 3,
		aliases: ['Trippa'],
		gist: "Cleaned lining of a cow's stomach, simmered until soft",
		guest: 'Tripe is the lining of a beef stomach, cleaned and simmered for hours. It cooks soft with a gentle chew and a mild taste, and soaks up its sauce.',
		why: "A cow's stomach has four chambers. Honeycomb tripe, from the second, is prized for a lacy texture that holds sauce. Kitchens buy it scrubbed and blanched, then simmer it two to three hours until it goes from rubbery to tender, with only a faint beefy taste.",
		madeWith: ['beef tripe', 'often tomato', 'often onion', 'sometimes white wine', 'sometimes pecorino cheese', 'sometimes hominy', 'sometimes pork'],
		origin: 'Trippa alla romana in Rome, menudo in Mexico, callos in Madrid',
		pairs: 'Tomato sauce, mint and pecorino, red chile broth, crusty bread',
		seeAlso: ['fd_0063', 'fd_0007', 'fd_0040'],
		line: 'Trippa alla romana, tomato, mint, pecorino',
		traps: [
			{ says: 'Cleaned pig intestines, boiled and then fried until crisp', why: 'Tripe is stomach lining, most often beef. Intestines are chitterlings, a different cut.' }
		]
	},
	{
		id: 'fd_0306',
		term: 'Duck Hearts',
		level: 3,
		gist: "Thumb-sized organ that pumps a bird's blood, eaten like dark meat",
		guest: 'Duck hearts are pure muscle, so they eat like a tiny steak, meaty with a slight chew and nothing like liver. Most are grilled fast and served pink.',
		why: 'The heart works nonstop, so it is dense, lean muscle, red with iron-rich myoglobin, closer to duck breast than to liver. Trimmed of fat and vessels, it is seared or skewered and grilled. Gizzards are the other muscle organ, firmer, and often confit.',
		madeWith: ['duck heart', 'often garlic', 'sometimes soy sauce', 'sometimes butter'],
		origin: 'Heart on the grill: chicken at Japanese yakitori bars, beef in Peruvian anticuchos',
		notThis: 'Not liver. The heart is a working muscle, so it eats dense and meaty, where liver is soft and iron-strong.',
		seeAlso: ['fd_0056', 'fd_0063'],
		confusedWith: ['fd_0062'],
		line: 'Grilled duck hearts, salsa verde, charred onion',
		traps: [
			{ says: 'Strong, livery organ with a soft, grainy texture and a bitter edge', why: 'The heart is a muscle, so it eats dense and meaty like dark meat, not soft or livery.' }
		]
	},
	{
		id: 'fd_0307',
		term: 'Chicken Oysters',
		level: 4,
		say: 'CHIK-in OY-sterz',
		aliases: ["Sot-l'y-laisse"],
		gist: "Two coin-sized nuggets of dark meat set along a bird's back",
		guest: "They are the two little rounds of dark meat along a chicken's backbone, the juiciest bite on the bird. The name comes only from their oyster-like shape.",
		why: "Each one sits in a spoon-shaped hollow of the hip bone, on the back just above the thigh. It is a small muscle of dark meat, so it roasts up tender and juicy. Carvers miss them, and one plate takes several birds, so they are a chef's luxury.",
		madeWith: ['chicken', 'often butter', 'sometimes soy sauce'],
		origin: "French sot-l'y-laisse, the bit only a fool leaves on the carcass",
		notThis: 'Not the shellfish, and not the old slang for testicles. The name is only for the oval shape of the meat.',
		seeAlso: ['fd_0057', 'fd_0228'],
		confusedWith: ['fd_0115'],
		line: 'Roasted chicken oysters, brown butter, sherry jus',
		traps: [
			{ says: 'Fried testicles of a rooster, served as a ranch-country bar snack', why: 'They are two small pieces of dark meat from the back. The name describes only the shape.' },
			{ says: 'Small shucked shellfish poached gently in a rich poultry broth', why: 'It is chicken meat. The name describes the shape of two small pieces of dark meat.' }
		]
	},
	{
		id: 'fd_0308',
		term: 'Moulard',
		level: 4,
		say: 'moo-LARD',
		aliases: ['Mulard', 'Mule Duck'],
		gist: 'Sterile hybrid duck raised for foie gras and a big red breast',
		guest: 'Moulard is the duck raised for foie gras, a cross of two breeds. Its breast is big, deep red and beefy, closer to a steak than to the duck most people know.',
		why: "A cross of a Muscovy drake and a Pekin hen, the moulard is sterile, hardy and large. It gives most of the world's foie gras, and its breast, the magret, is thick, dark and richly fatted, often enough for two. Pekin breast is smaller and milder.",
		madeWith: ['duck', 'sometimes duck liver', 'sometimes red wine', 'sometimes honey'],
		note: 'The breast is classically seared and served pink, medium rare, then sliced.',
		origin: "Raised for foie gras in southwest France and New York's Hudson Valley",
		notThis: 'Not Pekin, also sold as Long Island duck, the smaller, milder bird behind most US duck breast and Peking duck.',
		seeAlso: ['fd_0056', 'fd_0055', 'fd_0306'],
		line: 'Seared Moulard duck breast, cherries, turnips',
		traps: [
			{ says: 'Village in southwest France whose farms raise the finest ducks', why: 'It is a hybrid duck, a sterile cross of Muscovy and Pekin, not a place or a farm.' }
		]
	},
	{
		id: 'fd_0360',
		term: 'Grouse',
		level: 4,
		gist: 'Wild bird of the British heather moors, dark, livery and strong',
		guest: 'Grouse is a truly wild bird from the British moors, here only from mid-August into winter. It is dark and rich, with a deep game flavor bolder than pheasant.',
		why: 'Red grouse cannot be farmed: every bird lives wild on heather moors and is shot in season. A heather diet and a life on the wing make the breast all dark, iron-rich meat with a deep, slightly bitter, livery flavor, far bolder than pheasant or quail.',
		madeWith: ['grouse', 'often butter', 'often bacon', 'sometimes wheat bread', 'sometimes milk', 'sometimes red wine'],
		note: 'Shot in the wild, so a stray pellet can turn up. Classically roasted and served pink.',
		origin: 'Scotland and northern England, from 12 August, the Glorious Twelfth',
		notThis: 'Not pheasant, a milder bird usually farmed. Grouse is wild only, darker and far stronger.',
		seeAlso: ['fd_0053', 'fd_0361', 'fd_0059'],
		confusedWith: ['fd_0060'],
		line: 'Roast grouse, bread sauce, game chips, watercress',
		traps: [
			{ says: 'Farm-reared Scottish bird with pale, mild meat, roasted well done', why: 'Grouse cannot be farmed. It is wild, dark-fleshed and strong, and is served pink.' }
		]
	},
	{
		id: 'fd_0361',
		term: 'Hare',
		level: 4,
		aliases: ['Lièvre', 'Lepre'],
		gist: 'Wild long-legged cousin of rabbit, dark red and deeply gamey',
		guest: 'Hare is the wild cousin of rabbit, but darker, richer and deeply gamey. It is usually braised slowly in red wine.',
		why: 'Hares live wild in open country and survive on speed, born furred and ready to run. That working muscle is dark red and iron-rich, with a strong game flavor far from pale farmed rabbit. The lean saddle is roasted pink and the legs braised for hours.',
		madeWith: ['hare', 'often red wine', 'often bacon', 'often wheat flour', "sometimes hare's blood", 'sometimes egg', 'sometimes foie gras'],
		note: "Wild and shot, so a stray pellet can turn up. Classic sauces are thickened with the hare's blood.",
		origin: 'Autumn and winter game, lièvre in French, lepre in Italian',
		notThis: 'Not rabbit, usually farmed, with pale, mild meat. Hare is wild, larger, darker and much gamier.',
		recipe: 'jugged-hare',
		seeAlso: ['fd_0059', 'fd_0360', 'fd_0190'],
		confusedWith: ['fd_0058'],
		line: 'Pappardelle with braised hare, juniper and red wine',
		traps: [
			{ says: 'A bigger breed of farmed rabbit with the same pale, mild meat', why: 'Hare is a separate wild species with dark red, strongly flavored meat.' }
		]
	},
	{
		id: 'fd_0362',
		term: 'Cockscomb',
		level: 4,
		say: 'KOKS-kohm',
		aliases: ['Crête de Coq', 'Rooster Comb', "Cock's Comb"],
		gist: 'Fleshy red crest of a rooster, braised soft and gelatinous',
		guest: "It's the red crest from a rooster's head, braised until silky, then often fried crisp outside. The flavor is mild, and it eats like tender braised pork skin.",
		why: "The comb is thick skin over collagen-rich tissue, with no muscle. Blanched so its thin outer skin slips off, then simmered until tender, it turns soft and gelatinous, like a braised pig's trotter, and takes the flavor of its sauce.",
		madeWith: ['rooster', 'often chicken stock', 'sometimes butter', 'sometimes wheat flour', 'sometimes egg', 'sometimes madeira'],
		origin: "French crête de coq, classic in financière garnish and Piedmont's finanziera",
		seeAlso: ['fd_0054', 'fd_0305', 'fd_0364'],
		line: 'Fried cockscomb, sauce gribiche, pickled shallot',
		traps: [
			{ says: 'Ruffled red garden flower grown for its velvety, crested blooms', why: "That is the celosia plant, which shares the name. On a menu it means the rooster's crest." }
		]
	},
	{
		id: 'fd_0363',
		term: 'Blue Foot Chicken',
		level: 4,
		aliases: ['Poulet Bleu'],
		gist: "Slow-grown chicken bred in Canada to rival France's Bresse",
		guest: "It's a breed made to match France's famous Bresse chicken. Raised more than twice as long as most chickens, it has firmer meat and deeper flavor.",
		why: 'Bred in British Columbia from the 1980s as an answer to Poulet de Bresse, it has white feathers, a red comb and steel-blue feet. Raised 14 to 16 weeks, more than twice as long as a supermarket broiler, it has firmer, tastier meat and skin that roasts crisp.',
		madeWith: ['chicken', 'often butter', 'sometimes cream', 'sometimes morels', 'sometimes truffle', 'sometimes white wine'],
		note: 'Often sold with the head and blue feet still on, as proof of the breed.',
		pairs: 'Roasted whole for two, morels and cream, truffle under the skin',
		notThis: 'Not Poulet de Bresse, the protected French bird it was bred to match, very rare in the US.',
		seeAlso: ['fd_0057', 'fd_0051', 'fd_0144'],
		line: 'Roasted blue foot chicken for two, morels, vin jaune',
		traps: [
			{ says: "Chicken flown in from France's Bresse region under strict rules", why: 'It is a North American breed made to match Bresse. True French Bresse is very rare here.' }
		]
	},
	{
		id: 'fd_0364',
		term: "Calf's Brains",
		level: 4,
		aliases: ['Veal Brains', 'Cervelle de Veau'],
		gist: 'Custard-soft organ from a veal skull, seared in brown butter',
		guest: "Calf's brains are very soft and creamy, like a delicate custard, and mild in flavor. They're usually poached, then browned in butter with capers.",
		why: 'Soaked, peeled of a thin membrane and gently poached in vinegared water to firm them just enough to slice, they are fatty nerve tissue with no muscle at all, so they eat soft and creamy, milder than sweetbreads and nothing like liver.',
		madeWith: ['veal', 'often butter', 'often wheat flour', 'often capers', 'sometimes egg', 'sometimes vinegar', 'sometimes lemon'],
		note: "US rules bar brain only from cattle 30 months and older. Send a guest's health questions to a manager.",
		origin: 'French bistro classic, cervelle de veau au beurre noir',
		notThis: 'Not sweetbreads, the firmer thymus or pancreas. Brains are softer still, almost like a set custard.',
		seeAlso: ['fd_0161', 'fd_0278', 'fd_0362'],
		confusedWith: ['fd_0054'],
		line: "Calf's brains, brown butter, capers, parsley",
		traps: [
			{ says: 'Dense, chewy organ with a strong iron flavor, much like liver', why: 'Brains are very soft and mild, nearer a custard than liver in both texture and taste.' }
		]
	}
];

export default cards;
