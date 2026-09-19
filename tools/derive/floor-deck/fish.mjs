/* The Floor Deck, section "fish". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0108',
		term: 'Arctic Char',
		aliases: ['Char'],
		packet: true,
		gist: 'Cold-water cousin of salmon and trout with pink, moderately rich flesh',
		guest: "It's a cold-water fish from the salmon family, and it eats right between salmon and trout. Rich but mild, with a fine flake and a thin skin that crisps.",
		why: 'A member of the salmon family from icy northern lakes and coasts, now mostly farmed in cold tanks. Its fat sits between trout and salmon, so the pink to red flesh stays moist and fine-flaked, with a cleaner, milder flavor than salmon.',
		madeWith: ['arctic char', 'often butter', 'often lemon'],
		note: 'Nearly all of it is farmed, mostly in Iceland and Canada. The thin skin crisps well and is meant to be eaten.',
		notThis: 'Not salmon or trout, though kin to both. It is milder and finer than salmon, and richer than trout.',
		seeAlso: ['fd_0039'],
		confusedWith: ['fd_0117', 'fd_0122'],
		line: 'Crispy-skin arctic char, fennel, citrus beurre blanc',
		traps: [
			{ says: 'Lean, white-fleshed relative of cod from polar seas, with large mild flakes', why: 'It belongs to the salmon family, and its flesh is pink and fairly rich, not white and lean.' }
		]
	},
	{
		id: 'fd_0109',
		term: 'Crawfish',
		aliases: ['Crayfish', 'Crawdads', 'Mudbugs'],
		packet: true,
		gist: 'Finger-long freshwater crustacean, a tiny lobster eaten for its tail',
		guest: "They're freshwater shellfish that look like tiny lobsters, a Louisiana staple. The tail meat is sweet and tender, somewhere between shrimp and lobster.",
		why: "A freshwater crustacean from Louisiana's swamps and rice ponds, built like a lobster about a finger long. Only the tail holds real meat, sweet and tender, while the fat in the head carries the flavor, so whole ones are boiled in spice and peeled by hand.",
		madeWith: ['crawfish', 'often butter', 'often wheat flour', 'often cayenne', 'sometimes pork sausage'],
		note: 'Live season runs roughly late winter to early summer. Outside it, most kitchens cook with frozen peeled tail meat.',
		pairs: 'Boils with corn, potato and sausage; étouffée over rice',
		recipe: 'backyard-crawfish-boil',
		seeAlso: ['fd_0136', 'fd_0133', 'fd_0064'],
		line: 'Crawfish étouffée, Carolina Gold rice, scallion',
		traps: [
			{ says: 'Small saltwater shrimp from the Gulf, sold under a Louisiana nickname', why: 'It lives in fresh water and is built like a lobster, with claws, not like a shrimp.' }
		]
	},
	{
		id: 'fd_0110',
		term: 'Skate',
		aliases: ['Skate Wing', 'Raie'],
		packet: true,
		gist: 'Wing of a ray, its sweet white flesh pulling apart in long strands',
		guest: "It's the wing of a ray, a cousin of the stingray. The meat is sweet and mild, a little like scallop or crab, and it pulls away in long tender strands.",
		why: 'Skates are rays, with a skeleton of cartilage instead of bone. Only the wings are eaten: a fan of long muscle strands over a sheet of soft cartilage, so the flesh comes away in ribbons, not flakes. It is lean, sweet and mild, and takes well to a hot pan.',
		madeWith: ['skate', 'often butter', 'often capers', 'often wheat flour', 'often lemon or vinegar'],
		note: 'No pin bones. A bone-in wing has a flat sheet of soft cartilage in the middle, and the meat slides off it with a fork.',
		pairs: 'Black butter, capers, parsley and vinegar, the French classic, or brown butter and lemon',
		seeAlso: ['fd_0161', 'fd_0278', 'fd_0232'],
		line: 'Pan-roasted skate wing, brown butter, capers, lemon',
		traps: [
			{ says: 'Dense, meaty steak cut from a small shark and grilled like swordfish', why: 'It is the thin, ribbed wing of a ray, soft and stranded, and nothing like a dense steak.' }
		]
	},
	{
		id: 'fd_0111',
		term: 'Flounder',
		aliases: ['Fluke', 'Summer Flounder'],
		packet: true,
		gist: 'Small, thin flatfish with lean, delicate, mild and sweet fillets',
		guest: "It's a small flatfish, lean and very delicate, with a mild, sweet flavor. If you like sole, it eats the same way, light and fine-flaked.",
		why: 'A flatfish that lies on the seabed with both eyes on its upper side, left or right depending on the species. Little fat and thin fillets give a fine, soft texture and a mild, sweet taste. Fluke is summer flounder, and many American soles are flounders too. It cooks in minutes.',
		madeWith: ['flounder', 'often wheat flour', 'often butter', 'sometimes almonds', 'sometimes crab', 'sometimes egg', 'sometimes cornmeal'],
		note: 'Fluke is often served raw, sliced thin as crudo or sashimi.',
		notThis: 'Not halibut, its giant cousin. Halibut comes as thick, firm portions, and flounder as thin, soft fillets or a whole fish.',
		seeAlso: ['fd_0123', 'fd_0232', 'fd_0233'],
		confusedWith: ['fd_0113'],
		line: 'Pan-fried flounder, lemon, parsley, brown butter',
		traps: [
			{ says: 'Flatfish with both eyes always on its left side and firm, meaty flesh', why: 'Some flounders are left-eyed and some right-eyed, and the flesh is delicate, not firm.' }
		]
	},
	{
		id: 'fd_0112',
		term: 'Grouper',
		packet: true,
		gist: 'Warm-water reef fish with lean, firm white meat in big chunky flakes',
		guest: "It's a mild white fish from the Gulf and the South Atlantic. The meat is firm and sweet with big, moist flakes, so it holds up to the grill or the fryer.",
		why: 'A heavy-bodied reef fish of the sea bass family, caught off Florida, the Gulf and the Carolinas. It is lean but holds moisture well, and thick fillets break into large, firm flakes. The flavor is mild and faintly sweet, close to sea bass.',
		madeWith: ['grouper', 'often butter', 'often wheat flour', 'sometimes egg'],
		notThis: 'Not snapper, the other Southern reef fish. Snapper fillets are thinner and finer-flaked, and grouper is chunkier and firmer.',
		recipe: 'florida-grouper-sandwich',
		seeAlso: ['fd_0128', 'fd_0048', 'fd_0124'],
		confusedWith: ['fd_0119'],
		line: 'Blackened grouper sandwich, lettuce, tomato, tartar sauce',
		traps: []
	},
	{
		id: 'fd_0113',
		term: 'Halibut',
		packet: true,
		gist: 'The largest flatfish, cut into thick, firm, snow-white lean portions',
		guest: "It's a big cold-water flatfish with thick, snow-white meat. Firm, clean and mildly sweet, the fish for someone who wants nothing fishy.",
		why: 'The giant of the flatfish, a right-eyed flounder that can outweigh a person, from the cold North Pacific and North Atlantic. Its size gives thick portions with a firm, large flake. With very little fat, it tastes clean and mild and leans on sauce for richness.',
		madeWith: ['halibut', 'often butter', 'often lemon', 'sometimes egg'],
		note: 'So lean it dries out fast. Kitchens pull it just as it turns opaque, and it is a poor choice for well done.',
		origin: 'Middle English haly butte, holy flatfish, eaten on feast days',
		notThis: 'Not flounder, a small flatfish sold in thin fillets, or turbot, which is richer and more gelatinous.',
		recipe: 'baked-alaska-halibut-with-mayonnaise-crust',
		seeAlso: ['fd_0205'],
		confusedWith: ['fd_0111', 'fd_0123'],
		line: 'Pan-roasted halibut, spring peas, beurre blanc',
		traps: [
			{ says: 'Rich, oily white fish whose silky flesh stays moist however long it cooks', why: 'It is one of the leanest fish on a menu and dries out quickly when overcooked.' }
		]
	},
	{
		id: 'fd_0114',
		term: 'Mussels',
		aliases: ['Moules'],
		packet: true,
		gist: 'Blue-black bivalve with soft, sweet meat, steamed open in its own broth',
		guest: "They're shellfish in blue-black shells, steamed until they pop open. The meat is soft and sweet, milder than a clam, and the broth is made for dipping bread.",
		why: 'A bivalve farmed in clusters on ropes, which keeps sand out. Steamed a few minutes with wine, garlic and shallot, the shells open and release their own liquor, which becomes the broth. The meat is plump and soft, sweeter and less briny than clam or oyster.',
		madeWith: ['mussels', 'often white wine', 'often butter', 'often garlic', 'often shallot', 'sometimes cream'],
		note: 'A mussel still shut after steaming should be left in the bowl, not pried open. Orange or cream meat is only male or female.',
		notThis: 'Not clams. Mussels have thin, blue-black teardrop shells and soft meat. Clams are rounder, paler and chewier.',
		lexiconSlug: 'mussels-scallops-and-the-cold-water-winter',
		recipe: 'penn-cove-mussels-steamed-in-cider',
		seeAlso: ['fd_0115', 'fd_0045', 'fd_0118'],
		confusedWith: ['fd_0137'],
		line: 'Steamed mussels, white wine, garlic, grilled bread',
		traps: [
			{ says: 'Round, sandy bivalve that is saltier and chewier than a clam, served raw', why: 'They are softer and sweeter than clams, and they are served cooked, not raw.' }
		]
	},
	{
		id: 'fd_0115',
		term: 'Oysters',
		packet: true,
		gist: 'Rough-shelled bivalve, often eaten raw, that tastes of its home water',
		guest: "They're shellfish, and on the half shell they're shucked to order and eaten raw. A cold, silky bite of clean ocean, some brinier, some sweeter.",
		why: 'A bivalve that filters the water it grows in, so each bay gives its own flavor, the way a vineyard does for wine. East Coast ones run briny and firm, West Coast ones sweeter and creamier, with a cucumber or melon note.',
		madeWith: ['oysters', 'often lemon', 'often vinegar', 'sometimes horseradish', 'sometimes butter', 'sometimes wheat flour', 'sometimes anise liqueur'],
		note: 'On the half shell they come raw and alive on ice, opened to order. The list changes daily, so learn each name and where it grew.',
		pairs: 'Mignonette, lemon, cocktail sauce, horseradish; Champagne, Chablis, Muscadet',
		lexiconSlug: 'oysters-east-vs-west',
		recipe: 'oysters-rockefeller',
		seeAlso: ['fd_0201', 'fd_0137', 'fd_0114'],
		line: 'Half dozen oysters on the half shell, mignonette, lemon',
		traps: [
			{ says: 'The shellfish that jewelry pearls are taken from, eaten raw on the half shell', why: 'Pearl oysters are a different family, and the eating kind almost never makes a pearl of any value.' }
		]
	},
	{
		id: 'fd_0116',
		term: 'Roe',
		packet: true,
		gist: 'Eggs of a female fish, cured loose or cooked whole in the sac',
		guest: 'Roe is fish eggs. Salmon roe pops with a bright, salty burst, and spring shad roe is seared whole until it is creamy inside.',
		why: 'Roe is the egg mass of a female fish, held in a thin sac. Loosened and salted, the eggs pop and taste of the sea: salmon roe is large and orange, flying fish roe tiny and crunchy. Cooked whole in the sac, like shad roe, it firms outside and turns creamy and grainy within.',
		madeWith: ['fish eggs', 'salt', 'sometimes soy sauce', 'sometimes sake', 'sometimes wheat flour', 'sometimes butter', 'sometimes bacon'],
		note: 'Loose salted roe, like salmon roe, is cured but never cooked: it is served raw.',
		pairs: 'Blini, sour cream, chives, sushi rice, brown butter, bacon',
		notThis: 'Caviar on its own means salted sturgeon roe. Any other roe sold as caviar has to name the fish, as in salmon caviar.',
		lexiconSlug: 'roe-caviar-ikura-tobiko-bottarga',
		recipe: 'shad-roe-with-bacon',
		seeAlso: ['fd_0120', 'fd_0117'],
		confusedWith: ['fd_0125', 'fd_0126'],
		line: 'Salmon roe, buckwheat blini, sour cream, chives',
		traps: [
			{ says: 'Soft white sacs from a male fish, pan-fried in butter and lemon', why: 'That is milt, from the male fish. These are the eggs of the female.' }
		]
	},
	{
		id: 'fd_0117',
		term: 'Salmon',
		packet: true,
		gist: 'Rich, oily pink fish that grows at sea and spawns back in rivers',
		guest: 'Salmon is rich and buttery, with big, silky flakes. Wild king is the richest of all, and sockeye is leaner and deeper in flavor.',
		why: 'Salmon hatch in rivers, fatten at sea and swim back upstream to spawn, so they carry fat for the trip. It keeps the flesh moist and gives it big, soft flakes. The color comes from a pigment in the krill and shrimp they eat. King is the fattiest species, sockeye the reddest.',
		madeWith: ['fish', 'often butter', 'often lemon'],
		note: 'Often served medium, still translucent in the center. Guests can ask for it cooked through.',
		origin: 'Wild from Alaska to California; Atlantic salmon on menus is almost always farmed',
		notThis: 'Arctic char and trout look alike but are milder, with a finer flake. Steelhead is a sea-run trout that eats much like salmon.',
		lexiconSlug: 'wild-salmon-the-run-calendar',
		recipe: 'cedar-planked-chinook-salmon',
		seeAlso: ['fd_0222', 'fd_0116'],
		confusedWith: ['fd_0108', 'fd_0122'],
		line: 'Seared king salmon, French lentils, beurre blanc',
		traps: [
			{ says: 'Naturally pale white fish whose farmed flesh is dyed pink at packing', why: 'The color comes from a pigment in the diet, krill in the wild and added to feed on farms.' }
		]
	},
	{
		id: 'fd_0118',
		term: 'Scallops',
		packet: true,
		gist: 'Sweet round muscle a shellfish uses to clap its two shells shut',
		guest: 'Scallops are the sweet muscle that snaps the shell shut, seared golden on the outside and soft, almost creamy, in the middle.',
		why: 'A scallop swims by clapping its shells, driven by one big muscle, and that muscle is what we eat. It is rich in glycogen and sweet amino acids, so it tastes sweet and browns well. Sea scallops are large and sear. Bay scallops are small and cook in seconds. Untreated dry ones sear best.',
		madeWith: ['scallops', 'often butter', 'often lemon'],
		note: 'Best seared golden and left just translucent in the center. Cooked through, they turn rubbery.',
		notThis: 'Not king trumpet mushroom scallops, which are thick rounds of mushroom stem cut to look like the real thing.',
		lexiconSlug: 'scallops-dry-vs-wet-u-10',
		recipe: 'seared-digby-scallops',
		seeAlso: ['fd_0114', 'fd_0137', 'fd_0039'],
		confusedWith: ['fd_0143'],
		line: 'Seared sea scallops, cauliflower puree, brown butter',
		traps: [
			{ says: 'Rounds punched out of skate or shark wings and sold as shellfish', why: 'A long-running myth. They are the real muscle of the shellfish, cut from the shell.' }
		]
	},
	{
		id: 'fd_0119',
		term: 'Snapper',
		aliases: ['Red Snapper'],
		packet: true,
		gist: 'Red-skinned warm-reef fish, lean and sweet, often served whole',
		guest: 'Snapper is a mild, slightly sweet white fish from warm Gulf waters. It is lean and flaky, and the skin crisps up beautifully.',
		why: 'Snapper live on warm reefs in the Gulf of Mexico and the southern Atlantic. They are lean, so the flesh is mild and sweet with moist, medium flakes, and the red skin crisps well in a hot pan. Whole snapper, fried or grilled, is a classic of the Gulf and the Caribbean.',
		madeWith: ['fish', 'often butter', 'often lemon', 'sometimes wheat flour'],
		note: 'Served whole, it arrives on the bone, with fins and small bones to work around.',
		notThis: 'Not grouper, which is firmer and chunkier. West Coast Pacific snapper is usually rockfish, a different fish.',
		seeAlso: ['fd_0128', 'fd_0127'],
		confusedWith: ['fd_0112'],
		line: 'Whole fried red snapper, green mango slaw, lime',
		traps: []
	},
	{
		id: 'fd_0120',
		term: 'Sturgeon',
		packet: true,
		gist: 'Ancient armored river fish, dense and meaty, prized for its eggs',
		guest: 'Sturgeon is the fish caviar comes from. The meat is firm and rich, more like veal than a flaky fish, and it is wonderful smoked.',
		why: 'Sturgeon have barely changed in 200 million years: rows of bony plates, not ordinary scales, and a skeleton mostly of cartilage. The flesh has almost no flake and a good amount of fat, so it eats dense and meaty, often compared to veal or lobster, and it takes smoke beautifully.',
		madeWith: ['fish'],
		origin: 'Mostly farmed white sturgeon from California and Idaho; wild stocks are protected',
		pairs: 'Potato pancakes, sour cream, dill, horseradish, rye bread',
		seeAlso: ['fd_0125', 'fd_0041'],
		line: 'Smoked sturgeon, potato pancake, sour cream, dill',
		traps: [
			{ says: 'Delicate, flaky white fish that falls apart like cod when cooked', why: 'Its flesh is dense and meaty with almost no flake, and holds together like a chop.' }
		]
	},
	{
		id: 'fd_0121',
		term: 'Tilefish',
		aliases: ['Golden Tilefish'],
		packet: true,
		gist: 'Lean deep-water fish that eats crab, sweet and firm like lobster',
		guest: 'Tilefish is a lean white fish from deep Atlantic waters. It eats crab and shrimp, so it tastes sweet, a little like lobster, with firm, moist flakes.',
		why: 'Golden tilefish live at the edge of the continental shelf, digging burrows in the clay and feeding on crabs and shrimp. That diet is why the flesh tastes so sweet, often compared to lobster or scallop. It is lean, with a firm, fine flake closer to halibut than to cod.',
		madeWith: ['fish', 'often butter'],
		origin: 'Deep Atlantic shelf edge, from New England down to the Gulf of Mexico',
		seeAlso: ['fd_0124', 'fd_0113'],
		line: 'Pan-roasted golden tilefish, clams, fennel broth',
		traps: [
			{ says: 'Lean, sweet-tasting fish usually caught in shallow water near shore', why: 'It lives deep, at the edge of the continental shelf, often hundreds of feet down.' }
		]
	},
	{
		id: 'fd_0122',
		term: 'Trout',
		packet: true,
		gist: 'Mild, delicate freshwater fish, often pan-fried whole or split',
		guest: 'Trout is a mild, delicate freshwater fish with tender flakes and thin skin that crisps in the pan. With brown butter and almonds, it is a classic.',
		why: 'Most trout on menus is farmed rainbow trout, raised in cold spring water in places like Idaho. It is small and fairly lean, so the flesh is mild with fine, soft flakes and the skin is thin enough to eat crisp. Steelhead is rainbow trout that went to sea: bigger, richer and pinker.',
		madeWith: ['fish', 'often butter', 'sometimes almonds', 'sometimes wheat flour'],
		note: 'Served whole, it keeps its fine rib bones, and butterflied fillets can still hold a few small pin bones.',
		notThis: 'Arctic char is a cousin with richer, pinker flesh. Salmon is bigger and much oilier.',
		recipe: 'nevada-trout-almondine',
		seeAlso: ['fd_0233', 'fd_0232'],
		confusedWith: ['fd_0108', 'fd_0117'],
		line: 'Pan-fried rainbow trout, brown butter, almonds',
		traps: [
			{ says: 'Strong-tasting oily sea fish with dark flesh, much like mackerel', why: 'Farmed rainbow trout is a mild, lean freshwater fish with pale, tender flesh.' }
		]
	},
	{
		id: 'fd_0123',
		term: 'Turbot',
		say: 'TUR-buht',
		packet: true,
		gist: 'Prized European flatfish, firm and white, rich in gelatin at the bone',
		guest: 'Turbot is one of the most prized fish in Europe, a flatfish with firm, snow-white flesh that is sweet and almost silky. It is often roasted whole.',
		why: 'Turbot lie flat on the seabed, and their thick, muscular fillets eat firm and meaty rather than flaky. The skin and bones are rich in gelatin, which keeps the flesh moist and gives cooked turbot a silky, sticky richness that chefs pair with butter sauces.',
		madeWith: ['fish', 'often butter'],
		note: 'Often cooked on the bone to keep it juicy, so it may arrive whole or as a bone-in cut.',
		origin: 'European coasts from Norway to the Mediterranean, much of it farmed in Spain',
		notThis: 'Not halibut, a bigger, leaner flatfish. Cheap Greenland turbot is a different, softer and oilier fish.',
		seeAlso: ['fd_0111', 'fd_0205'],
		confusedWith: ['fd_0113'],
		line: 'Whole roasted turbot for two, brown butter, potatoes'
	},
	{
		id: 'fd_0124',
		term: 'Wreckfish',
		aliases: ['Stone Bass'],
		packet: true,
		gist: 'Deep-water Carolina fish that gathers at wrecks, with big flakes',
		guest: "It's a deep-water fish from off the Carolinas, firm and mild with big white flakes. It eats a lot like grouper.",
		why: 'It lives far down on rocky ledges off South Carolina and Georgia, and got its name from gathering around shipwrecks. Caught by hook and line in a small fishery, it is lean with large, moist, sweet flakes, much like grouper or a big sea bass.',
		madeWith: ['fish', 'often butter'],
		origin: 'Southeast US, the deep Charleston Bump; named for hanging around wrecks',
		notThis: 'Not grouper, though it eats like one. It is its own deep-water family and a local Carolina catch.',
		seeAlso: ['fd_0121', 'fd_0119'],
		confusedWith: ['fd_0112'],
		line: 'Pan-roasted wreckfish, Carolina Gold rice, brown butter',
		traps: [
			{ says: 'Small shallow-reef fish farmed in pens off the Keys, soft and oily', why: 'It lives in deep water far offshore, is caught wild on hook and line, and is lean and firm.' }
		]
	},
	{
		id: 'fd_0125',
		term: 'Caviar',
		packet: true,
		gist: 'Salt-cured sturgeon eggs, served cold by the small spoonful',
		guest: "It's sturgeon roe, lightly salted and served cold. Each pearl pops with a clean, briny, buttery flavor, best with a blini and a glass of Champagne.",
		why: 'Eggs are taken from a sturgeon, screened, and lightly salted, which firms them and seasons them without cooking. Nearly all caviar today is farmed, since wild sturgeon were overfished and wild Caspian caviar is barely traded. Osetra, Kaluga and Siberian are common kinds.',
		madeWith: ['sturgeon roe', 'salt', 'often blini', 'often crème fraîche'],
		note: 'Served cold and never cooked. Kitchens often use a mother-of-pearl or bone spoon rather than metal.',
		pairs: 'Blini, crème fraîche, chives, potato chips, Champagne or cold vodka',
		notThis: 'Not just any fish eggs. On a US menu, salmon or trout eggs must name the fish, as in salmon caviar.',
		lexiconSlug: 'roe-caviar-ikura-tobiko-bottarga',
		seeAlso: ['fd_0120', 'fd_0126'],
		confusedWith: ['fd_0116'],
		line: 'Osetra caviar, buckwheat blini, crème fraîche, chives',
		traps: [
			{ says: 'Salt-cured eggs of wild sturgeon, netted today in the Caspian Sea', why: 'Almost all caviar sold now is farmed. Wild Caspian sturgeon were overfished and are protected.' }
		]
	},
	{
		id: 'fd_0126',
		term: 'Bottarga',
		say: 'boh-TAR-guh',
		aliases: ['Poutargue'],
		gist: 'Salted, pressed and dried fish-egg sac, grated like a cheese',
		guest: "It's cured fish roe, dried into an amber block and grated over the dish. Salty and savory, it tastes like the sea's answer to parmesan.",
		why: 'The whole roe sac of a grey mullet or a tuna is salted, pressed and air-dried for weeks until firm and amber. Drying concentrates it into a salty, savory, faintly bitter seasoning. Mullet is milder and more delicate, tuna darker and stronger.',
		madeWith: ['mullet roe', 'sometimes tuna roe', 'salt'],
		note: 'Cured and dried, never cooked. It is shaved or grated over the dish at the end.',
		origin: 'Italian, from Sardinia and Sicily; the word comes from Arabic',
		pairs: 'Spaghetti, olive oil, lemon, garlic, toasted breadcrumbs',
		lexiconSlug: 'roe-caviar-ikura-tobiko-bottarga',
		seeAlso: ['fd_0116', 'fd_0125', 'fd_0131'],
		line: 'Spaghetti, bottarga, lemon, garlic, breadcrumbs',
		traps: [
			{ says: 'Salted anchovy fillets mashed into a paste and melted into sauces', why: 'It is a whole dried roe sac, shaved or grated, not a paste made from fillets.' }
		]
	},
	{
		id: 'fd_0127',
		term: 'Branzino',
		say: 'bran-ZEE-noh',
		aliases: ['Loup de Mer', 'European Sea Bass', 'Mediterranean Sea Bass'],
		gist: 'Mild, lean Mediterranean white fish, often roasted and served whole',
		guest: "It's a Mediterranean sea bass, mild and delicate with crisp skin. It's often roasted whole with lemon and herbs, simple and light.",
		why: 'The European sea bass, now mostly farmed in Greece and Turkey. Each fish is only a pound or two, so it suits one plate whole or as two fillets. The flesh is lean, white and finely flaked with a clean, sweet flavor, and the thin skin crisps well.',
		madeWith: ['fish', 'olive oil', 'often lemon'],
		note: 'Served whole, it comes with bones and head on. Many kitchens will fillet it before or at the table.',
		origin: 'Italian name for the European sea bass; loup de mer in French',
		notThis: 'Not black sea bass, the wild Atlantic fish. Branzino is the Mediterranean one, usually farmed.',
		seeAlso: ['fd_0119'],
		confusedWith: ['fd_0128'],
		line: 'Whole roasted branzino, lemon, capers, herbs'
	},
	{
		id: 'fd_0128',
		term: 'Black Sea Bass',
		gist: 'Small wild Atlantic fish with firm, fine white flesh and crisp skin',
		guest: "It's a small wild fish from the Atlantic coast, sweet and delicate, and the skin crisps beautifully in the pan.",
		why: 'A small grouper relative caught from New England to the Gulf by pot, hook and trawl. It stays small, a few pounds at most, so fillets are thin with a fine flake. The white flesh is sweet and mild, firmer than branzino, and the dark skin sears crisp.',
		madeWith: ['fish', 'often butter'],
		note: 'Thin fillets can hold a few fine pin bones.',
		origin: 'US Atlantic coast, from Cape Cod down to Florida and the Gulf',
		notThis: 'Not Chilean sea bass, a rich deep-water fish, and not branzino, the farmed Mediterranean one.',
		seeAlso: ['fd_0112', 'fd_0119'],
		confusedWith: ['fd_0127'],
		line: 'Crispy-skin black sea bass, clams, fennel broth',
		traps: [
			{ says: 'Rich, oily deep-water fish from the Southern Ocean, in thick fillets', why: 'That is Chilean sea bass, a different fish. This one is small, lean and from the Atlantic.' }
		]
	},
	{
		id: 'fd_0129',
		term: 'Cobia',
		say: 'KOH-bee-uh',
		aliases: ['Ling', 'Lemonfish'],
		gist: 'Firm, buttery warm-water fish, often served raw, sturdy on a grill',
		guest: "Cobia is a firm, rich white fish from warm waters. It's buttery and clean served raw, and it holds up beautifully on the grill.",
		why: 'A fast-swimming fish of warm seas, caught in the Gulf and farmed in open-ocean pens. It carries more fat than most white fish, so the meat is firm, moist and buttery with a clean, sweet flavor. Think somewhere between swordfish and snapper.',
		madeWith: ['fish'],
		note: 'Often served raw as crudo. Cooked, it stays moist even a little past medium.',
		origin: 'Warm seas worldwide; Gulf anglers call it ling or lemonfish',
		seeAlso: ['fd_0220', 'fd_0130'],
		line: 'Cobia crudo, citrus, chili, olive oil',
		traps: [
			{ says: 'Lean, delicate freshwater fish that flakes apart at a gentle touch', why: 'It is a saltwater fish, rich for a white fish, and firm enough to grill.' }
		]
	},
	{
		id: 'fd_0130',
		term: 'Swordfish',
		gist: 'Big ocean hunter cut into thick, dense, mild steaks that grill well',
		guest: 'Swordfish is meaty and mild, cut into thick steaks. It eats almost like a pork chop, great off the grill for someone who wants hearty fish.',
		why: 'A large open-ocean fish, cut crosswise from the loin into boneless steaks. The flesh is dense with a tight grain and moderate fat, so it holds together on a grill and rarely breaks into flakes. It tastes mild, without the red-meat depth of tuna.',
		madeWith: ['fish', 'often olive oil'],
		note: 'The dark red band in each steak is the bloodline and is normal. Cooked past medium, it dries out fast.',
		notThis: 'Not tuna, the other ocean steak. Swordfish is pale and cooked further, tuna deep red and served rare.',
		seeAlso: ['fd_0131', 'fd_0129'],
		line: 'Grilled swordfish, salsa verde, charred lemon',
		traps: [
			{ says: 'Delicate flaky white fish, best poached gently and eaten with a spoon', why: 'It is one of the densest, firmest fish on the menu and is usually grilled.' }
		]
	},
	{
		id: 'fd_0131',
		term: 'Tuna',
		gist: 'Deep-red, meaty ocean fish, served raw or seared rare inside',
		guest: "It's a meaty, deep-red fish, clean and rich. It's usually served raw, or seared outside and rare inside, closer to a steak than a flaky fish.",
		why: 'Tuna are warm-bodied ocean sprinters, and their muscle is full of oxygen-carrying myoglobin, which makes it red and beefy. Yellowfin is lean, bigeye a little richer, and bluefin belly is marbled with fat. Albacore is the paler, milder one canned as white tuna.',
		madeWith: ['fish', 'often soy sauce', 'often wheat', 'often sesame'],
		note: 'Usually served raw or rare. Cooked through, it firms up, dries and tastes like canned tuna.',
		pairs: 'Soy, sesame, ginger, avocado, wasabi, citrus',
		recipe: 'oregon-albacore-tuna-melt',
		seeAlso: ['fd_0130', 'fd_0223', 'fd_0220'],
		line: 'Seared ahi tuna, sesame, cucumber, ponzu',
		traps: [
			{ says: 'Pale, flaky white fish that is always cooked through before serving', why: 'The fresh fish is deep red and usually served raw or rare. Only albacore is pale.' }
		]
	},
	{
		id: 'fd_0132',
		term: 'Monkfish',
		aliases: ['Anglerfish', 'Lotte'],
		gist: 'Dense, firm tail of a big-mouthed Atlantic fish, meaty and sweet',
		guest: "It's a firm, sweet white fish people call poor man's lobster. It holds together like a steak instead of flaking.",
		why: 'Monkfish is an anglerfish, mostly head and mouth, so the tail is the main cut sold. That tail is dense, springy muscle around one central bone, with no flakes, so it eats sweet and meaty like shellfish and stands up to roasting, grilling and stews.',
		madeWith: ['monkfish', 'often butter'],
		note: 'A thin gray membrane is trimmed off first, or it shrinks and toughens in the pan.',
		origin: 'North Atlantic anglerfish, sold as lotte on French menus',
		seeAlso: ['fd_0136', 'fd_0230'],
		line: 'Roasted monkfish, pancetta, white beans, salsa verde',
		traps: [
			{ says: 'Imitation shellfish meat made from minced white fish pressed into shape', why: 'It is a real whole fish, and the tail is cut straight from it.' }
		]
	},
	{
		id: 'fd_0133',
		term: 'Shrimp',
		aliases: ['Prawns'],
		gist: 'Small ten-legged crustacean, sweet and snappy, sized by count',
		guest: 'Sweet, firm shrimp, cooked just until they curl and turn pink, so they stay juicy with a little snap.',
		why: 'Shrimp are ten-legged crustaceans, wild or farmed, from the Gulf to Asia. The meat is almost pure muscle protein that tightens fast in heat, so a minute too long turns it rubbery. Size is a count per pound: 16/20 means 16 to 20 shrimp, U-15 means under 15.',
		madeWith: ['shrimp', 'often butter', 'often garlic'],
		note: 'The dark line down the back is the digestive tract. Kitchens usually pull it out, mostly for looks and grit.',
		pairs: 'Garlic butter, grits, cocktail sauce, andouille, lemon',
		lexiconSlug: 'shrimp-sizing-and-prawn-confusion',
		recipe: 'shrimp-scampi',
		seeAlso: ['fd_0109', 'fd_0136'],
		line: 'Gulf shrimp and grits, tasso gravy, scallion',
		traps: [
			{ says: 'Young of a bigger crustacean, caught before it grows to full size', why: 'Shrimp never grow into prawns, and prawn is often just another market name.' }
		]
	},
	{
		id: 'fd_0134',
		term: 'Blue Crab',
		gist: 'Chesapeake swimmer prized for sweet, hand-picked lump meat',
		guest: "It's the East Coast crab Maryland crab cakes are famous for. The meat is sweet and delicate, and the big jumbo lumps are the prize.",
		why: 'A swimming crab of the Atlantic and Gulf with paddle-shaped back legs. The two big muscles driving those paddles give jumbo lump, the whitest, sweetest meat. Lump and backfin are smaller pieces, and claw meat is darker and stronger. Picking is slow handwork, hence the price.',
		madeWith: ['blue crab', 'often butter', 'often seafood seasoning', 'sometimes egg', 'sometimes breadcrumbs'],
		note: 'Hand-picked meat can hold small bits of shell and cartilage, even when picked carefully.',
		origin: "Atlantic and Gulf coasts, most famously Maryland's Chesapeake Bay",
		pairs: 'Old Bay, drawn butter, crab cakes, remoulade, cold beer',
		recipe: 'steamed-blue-crabs-with-old-bay',
		seeAlso: ['fd_0135', 'fd_0209'],
		line: 'Jumbo lump blue crab cake, remoulade, charred lemon',
		traps: [
			{ says: 'Cold-water giant from Alaska, sold as frozen precooked legs', why: 'That is king crab. This is a small East Coast swimmer picked for its body meat.' }
		]
	},
	{
		id: 'fd_0135',
		term: 'Soft-Shell Crab',
		gist: 'Freshly molted Chesapeake swimmer, eaten whole with its legs',
		guest: "It's a blue crab caught just after it sheds its old shell, so you eat the whole thing. Crisp outside, sweet and juicy inside.",
		why: 'Crabs grow by molting: they split the old shell and back out soft. Within hours the new one starts to firm, so watermen hold molting crabs in tanks and pull them the moment they emerge. The kitchen trims the face, gills and apron, then fries or sautés it whole.',
		madeWith: ['blue crab', 'often wheat flour', 'often butter', 'sometimes egg', 'sometimes milk'],
		note: 'Eaten entirely, legs and all. The light crunch of the new shell is the point, not a mistake.',
		origin: 'A late spring to summer delicacy, mostly from the Chesapeake Bay',
		seeAlso: ['fd_0134', 'fd_0031'],
		line: 'Fried soft-shell crab, remoulade, pickled green tomato',
		traps: [
			{ says: 'Separate species of tiny sea creature, eaten whole from birth', why: 'It is an ordinary blue crab caught in the few hours after it molts.' }
		]
	},
	{
		id: 'fd_0136',
		term: 'Lobster',
		gist: 'Big-clawed cold-water crustacean with a firm, sweet tail',
		guest: "It's the cold-water Atlantic kind with big claws. The tail is firm and sweet, the claw meat softer, and it all loves butter.",
		why: 'A North Atlantic crustacean fished mostly off Maine and Canada. The tail is one big muscle, so it eats firm and snappy, while claws and knuckles are sweeter and softer. The meat breaks down fast after death, so it is cooked live or killed just before.',
		madeWith: ['lobster', 'often butter'],
		note: 'The green paste in the body is tomalley, and dark beads in a female are roe, called coral, which turn red when cooked.',
		notThis: 'Not spiny or rock lobster, a warm-water cousin with no big claws, usually sold as tails.',
		recipe: 'maine-lobster-roll',
		seeAlso: ['fd_0133', 'fd_0132'],
		line: 'Butter-poached Maine lobster, sweet corn, tarragon',
		traps: [
			{ says: 'Warm-water crustacean with no claws, sold mostly as frozen tails', why: 'That is spiny lobster. This one lives in cold water and carries two big claws.' }
		]
	},
	{
		id: 'fd_0137',
		term: 'Clams',
		aliases: ['Littlenecks', 'Quahogs', 'Steamers'],
		gist: 'Sand-burrowing two-shelled shellfish, briny and chewy',
		guest: 'Clams are briny little shellfish with a pleasant chew. Small ones like littlenecks are eaten raw or steamed open in wine and garlic.',
		why: 'Two-shelled animals that burrow in sand and mud and filter the water, so they taste of where they grew. Hard shells sell by size: littlenecks small and tender, cherrystones bigger, chowder clams biggest, tough and chopped. Soft-shell steamers have a neck skin to peel.',
		madeWith: ['clams', 'often white wine', 'often butter', 'often garlic'],
		note: 'Sold alive with shells shut. Littlenecks and cherrystones are often served raw on the half shell.',
		notThis: 'Not mussels, which are longer, blue-black and smooth, and cling to rocks and ropes instead of burrowing.',
		recipe: 'whole-belly-fried-clams',
		seeAlso: ['fd_0115'],
		confusedWith: ['fd_0114'],
		line: 'Linguine with littleneck clams, white wine, chili',
		traps: [
			{ says: 'Shellfish that must always be cooked and is never eaten raw', why: 'Small hard clams like littlenecks are a raw bar staple on the half shell.' }
		]
	}
];

export default cards;
