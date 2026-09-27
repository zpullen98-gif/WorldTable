/* The Floor Deck, section "language". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0285',
		term: 'Heirloom',
		level: 1,
		packet: true,
		gist: 'Old plant variety whose saved seed grows the same plant each year',
		guest: "It's an old variety, grown from seed farmers have saved for generations. They look uneven, but they're grown for flavor rather than for shipping.",
		why: 'Most supermarket produce comes from modern hybrids bred for yield and for surviving a truck. Heirlooms are open-pollinated, so saved seed grows the same plant again, and many varieties are 50 years old or more. Thin skins and odd shapes come with deeper flavor.',
		notThis: 'Not a farming label. Heirloom describes the seed, organic describes how it was grown, and a crop can be both, either or neither.',
		seeAlso: ['fd_0297'],
		confusedWith: ['fd_0300'],
		line: 'Heirloom tomato salad, burrata, basil, olive oil',
		traps: [
			{ says: 'Produce certified organic because its seed was never a GMO', why: 'Organic is a separate farming certification. This word names an old seed variety, certified or not.' },
			{ says: 'Any vegetable grown on a small family farm near the restaurant', why: 'Farm size and distance have nothing to do with it. The word names an old seed variety.' }
		]
	},
	{
		id: 'fd_0286',
		term: 'Larder',
		level: 2,
		packet: true,
		gist: 'Cool store for cured and preserved foods, now a menu heading too',
		guest: 'The larder is the cold pantry side of the menu, cured meats, pickles, cheese and preserves. Plates from there are usually good for sharing.',
		why: 'Before refrigeration a larder was the coolest room in the house, where meat was salted and hung and food was kept. Kitchens borrowed the word for their cold side, and menus now use it for charcuterie, pickles, cheese and preserves, food made days ahead.',
		origin: 'Old French lardier, a store for bacon and salted pork',
		pairs: 'Cured meats, pickles, mustard, cheese and toasted bread',
		notThis: 'Not the cold station itself. Garde manger is the cook and station, and larder is the store or the menu heading.',
		seeAlso: ['fd_0078', 'fd_0293'],
		confusedWith: ['fd_0287'],
		line: 'From the larder: terrine, pickles, grain mustard'
	},
	{
		id: 'fd_0287',
		term: 'Garde Manger',
		level: 3,
		say: 'gard mahn-ZHAY',
		packet: true,
		gist: 'Cold station of the line that builds salads and chilled starters',
		guest: "Garde manger is the kitchen's cold station. That cook makes the salads, crudo, terrines and cold starters, so it's often the first plate you see.",
		why: 'In grand houses it was the cool room where provisions were kept. The classic French kitchen brigade made it a station, and the cook there works with knives, dressings and cold sauces, cooking ahead and serving chilled, so the plates are about texture and freshness.',
		note: 'Crudo, tartare and oysters from this station are served raw. Say so when you describe them.',
		origin: 'French, literally keep the food, the old cool storeroom',
		seeAlso: ['fd_0286', 'fd_0084', 'fd_0220'],
		traps: [
			{ says: 'Head cook who checks each plate at the pass before it goes out', why: 'That is the expediter or chef at the pass. This is the cold station on the line.' }
		]
	},
	{
		id: 'fd_0288',
		term: 'Amuse-Bouche',
		level: 2,
		say: 'ah-MOOZ BOOSH',
		aliases: ['Amuse', 'Amuse-Gueule'],
		gist: 'One complimentary bite the chef sends out before the first course',
		guest: "It's a single bite from the chef, on the house, before your meal begins. It's a little preview of what the kitchen is excited about tonight.",
		why: 'The chef chooses it, not the guest, so it changes often and shows off a technique or a seasonal ingredient. One or two bites wake up the palate without filling anyone, and it sets the tone for the meal the way an overture sets up an opera.',
		note: "Nobody ordered it, so check the table's dietary restrictions before it lands. Most kitchens can swap it.",
		origin: 'French, mouth amuser, older French amuse-gueule',
		seeAlso: ['fd_0290'],
		traps: [
			{ says: 'Small starter the guest picks from the first page of the list', why: 'A starter is ordered and paid for. This bite is chosen by the chef and sent out unasked.' }
		]
	},
	{
		id: 'fd_0289',
		term: 'Prix Fixe',
		level: 1,
		say: 'pree FIKS',
		aliases: ["Table d'Hote", 'Set Menu'],
		gist: 'A few set courses for one charge, with a short pick in each',
		guest: 'Prix fixe means one price for the whole meal, usually three courses. You choose a starter, a main and a dessert from a short list.',
		why: 'The kitchen offers a short list per course and charges one number for the lot. That lets it plan and buy tightly, and the total often comes in under the same dishes ordered one by one. It is shorter than a tasting menu and leaves the choices to the guest.',
		origin: 'French, fixed price, one set charge for the meal',
		notThis: 'Not a tasting menu, where the chef picks every course and there are many more of them. Here the guest chooses.',
		seeAlso: ['fd_0291'],
		confusedWith: ['fd_0290'],
		line: 'Three-course prix fixe, 58 per guest',
		traps: [
			{ says: 'Dishes the kitchen will not change, served exactly as written', why: 'The word fixes the price, not the recipes or the plating.' }
		]
	},
	{
		id: 'fd_0290',
		term: 'Tasting Menu',
		level: 1,
		aliases: ['Degustation', "Chef's Tasting"],
		gist: 'Chef-chosen run of many small courses, often for the whole table',
		guest: 'The chef sends a run of small courses, usually five or more, so you taste more of the kitchen than one main allows. Many come with an optional wine pairing.',
		why: "Instead of a few big plates the kitchen sends many small ones in an order it designed, light to rich and savory to sweet. Small portions keep the palate curious and let the chef show ingredients that wouldn't sell as a full main. Plan on two to three hours.",
		note: 'Many kitchens need the whole table on it and any dietary changes in advance, so ask early.',
		notThis: 'Not prix fixe, where the guest picks from a few set courses. Here the chef chooses every plate, and there are more of them.',
		seeAlso: ['fd_0288'],
		confusedWith: ['fd_0289'],
		line: 'Seven-course tasting menu, optional wine pairing',
		traps: [
			{ says: 'Small samples of dishes offered to help a guest decide on a main', why: 'It is a full paid meal of many courses, not a sampler before ordering.' }
		]
	},
	{
		id: 'fd_0291',
		term: 'À la Carte',
		level: 1,
		say: 'ah lah KART',
		gist: 'Every dish priced on its own and ordered one plate at a time',
		guest: 'À la carte means every dish has its own price, and you order exactly what you want. Build the meal however you like, one plate or five.',
		why: 'Each plate is priced and cooked to order on its own, unlike a set meal at one price. At a steakhouse it also means the steak comes alone, and sides are ordered and charged separately. It is the default at most restaurants, so menus say it mostly to flag that.',
		origin: 'French, from the card, meaning straight from the written list',
		seeAlso: ['fd_0289', 'fd_0290'],
		line: 'Steaks à la carte, sides for the table',
		traps: [
			{ says: 'Dessert served with a scoop of vanilla ice cream on the side', why: 'That is a la mode. This one means each dish is priced and ordered on its own.' }
		]
	},
	{
		id: 'fd_0292',
		term: 'Market Price',
		level: 1,
		aliases: ['MP'],
		gist: 'Listed without a number because the cost shifts with each delivery',
		guest: "It means the price moves with what we paid for it this week. I'm happy to tell you tonight's price before you order.",
		why: "Lobster, crab, oysters, whole fish and truffles swing in cost with season, weather and the catch, sometimes week to week. Printing one number would mean reprinting menus or losing money, so the menu says MP and the server quotes the day's figure.",
		note: "Know tonight's figure before service and say it when you describe the dish. No guest should learn it from the check.",
		origin: 'Printed on menus as MP, a figure the server quotes each day',
		line: 'Whole Maine lobster, drawn butter, MP',
		traps: [
			{ says: 'Premium charge for produce bought that morning at a farmers stand', why: 'Where the food was bought has nothing to do with it. The word only means its cost varies.' }
		]
	},
	{
		id: 'fd_0293',
		term: 'House-Made',
		level: 1,
		gist: 'Prepared in this kitchen from scratch, not bought in ready',
		guest: "The kitchen makes it here from scratch instead of buying it ready, so it is fresher and done the chef's way.",
		why: "There is no legal definition, so it is the kitchen's own claim: the pasta, bread, pickles or sauce were produced on site from basic ingredients. That usually means fresher, more particular flavor and a lot more labor behind the plate.",
		notThis: 'Not a sourcing claim. House-made ricotta can start with bought milk: the phrase says who did the work, not where the food came from.',
		seeAlso: ['fd_0286', 'fd_0078'],
		line: 'House-made pappardelle, braised short rib, parmesan',
		traps: [
			{ says: "Grown or raised on the restaurant's own farm or kitchen garden", why: 'It says who prepared the food, not who grew it, and the raw ingredients are often bought.' }
		]
	},
	{
		id: 'fd_0294',
		term: 'Dry-Aged',
		level: 2,
		gist: 'Beef hung unwrapped in a cold room for weeks to deepen and soften',
		guest: 'The beef rests in a cold room for weeks before we cut it, so it turns more tender and tastes deeper, almost nutty.',
		why: "Whole cuts sit unwrapped just above freezing with fans moving the air, usually 21 to 45 days or longer. Water evaporates and concentrates the beef flavor while the meat's own enzymes loosen its fibers. The hard outer crust is trimmed away, and that loss is in the price.",
		madeWith: ['beef'],
		notThis: 'Not cured: it is fresh beef, cooked to order like any steak. Wet-aged beef rests sealed in plastic and tastes milder.',
		lexiconSlug: 'dry-aging',
		seeAlso: ['fd_0090', 'fd_0095', 'fd_0096'],
		confusedWith: ['fd_0030'],
		line: '45-day dry-aged ribeye, bone marrow butter',
		traps: [
			{ says: 'Steak seared hard with no marinade or sauce so the crust stays crisp', why: 'It describes weeks of cold rest before cutting, not how the steak is cooked or sauced.' }
		]
	},
	{
		id: 'fd_0295',
		term: 'Grass-Fed',
		level: 1,
		gist: 'Beef from cattle raised on forage, not finished on feedlot grain',
		guest: 'The cattle ate grass instead of grain, so the beef is leaner, with a cleaner, more mineral flavor than the richly marbled grain-fed steak most people know.',
		why: 'Most cattle graze when young, then finish on grain in a feedlot, which builds marbling. Grass-finished animals stay on forage, so the meat is leaner and deeper red, with yellowish fat from the carotene in grass and a mineral, slightly gamey taste.',
		madeWith: ['beef'],
		note: 'Leaner beef has less margin for error: it cooks faster and dries out sooner, so medium rare is the usual advice.',
		notThis: 'Not the same as organic or pasture-raised. Grass-finished spells out what the claim should mean: the cattle ate forage right to the end.',
		lexiconSlug: 'grass-fed-vs-grain-finished',
		seeAlso: ['fd_0095', 'fd_0107'],
		confusedWith: ['fd_0296', 'fd_0300'],
		line: 'Grass-fed strip loin, salsa verde, roasted potatoes',
		traps: [
			{ says: 'Beef finished on corn in a feedlot for heavier marbling', why: 'That describes grain-finished beef, the feedlot norm. This beef stays on forage and is leaner.' }
		]
	},
	{
		id: 'fd_0296',
		term: 'Pasture-Raised',
		level: 2,
		gist: 'Animals living outdoors with room to roam, whatever they are fed',
		guest: 'The animals lived outside on open grass, moving around and foraging. The eggs often have deeper-colored yolks, and the meat tends to be firmer with more flavor.',
		why: 'It describes where the animals lived more than what they ate: pigs and chickens on pasture still get grain feed. More exercise gives firmer, darker meat, and foraging deepens yolk color. There is no federal definition for meat or eggs, so certifiers set the bar.',
		notThis: 'Not free-range, which only promises some outdoor access, and not a grass-only diet, which is a grass-finished claim.',
		seeAlso: ['fd_0297'],
		confusedWith: ['fd_0295', 'fd_0300'],
		line: 'Pasture-raised egg, asparagus, brown butter',
		traps: [
			{ says: 'Animals kept indoors in large open barns without cages or crates', why: 'That describes cage-less barn housing, not time spent outdoors on grass.' }
		]
	},
	{
		id: 'fd_0297',
		term: 'Heritage Breed',
		level: 2,
		gist: 'Old livestock lines from before fast-growing industrial animals',
		guest: "It's an old-fashioned breed of animal, the kind farms raised before industrial farming. They grow slower, so the meat is richer and more flavorful.",
		why: 'Supermarket chickens, turkeys and pigs are bred to grow fast and lean. Older breeds like Berkshire pork or Bourbon Red turkey take longer to reach size, building more fat, darker meat and a firmer bite. Think heirloom tomatoes, for animals.',
		notThis: "Not a welfare or feed certification on its own: it names the animal's genetics, not how it was fed or kept.",
		seeAlso: ['fd_0285', 'fd_0106', 'fd_0296'],
		line: 'Heritage breed pork chop, apple mostarda, farro',
		traps: [
			{ says: 'Meat from an animal raised on the same family farm for generations', why: "It refers to the animal's genetic line, not the age or ownership of the farm." }
		]
	},
	{
		id: 'fd_0298',
		term: 'Wild-Caught',
		level: 1,
		gist: 'Taken from open water rather than farmed, fresh or frozen at sea',
		guest: 'It was caught in the ocean or a river rather than raised on a farm. Wild fish tend to be leaner and firmer, with a flavor that changes with the season.',
		why: 'Wild fish swim hard and eat a natural diet, so their flesh is firmer and leaner than farmed fish, and the flavor shifts with season and waters. Wild salmon gets its red color from the shrimp and krill it eats; farmed salmon gets pigment in its feed.',
		note: 'Lean wild salmon dries out faster than farmed, so kitchens often cook it to medium rare.',
		notThis: 'Not a freshness claim: much wild fish is frozen at sea. Nor is it a sustainability label.',
		seeAlso: ['fd_0117', 'fd_0113'],
		confusedWith: ['fd_0299'],
		line: 'Wild-caught king salmon, sweet corn, chanterelles',
		traps: [
			{ says: 'Fish certified as sustainably harvested from a well-managed fishery', why: 'It only says the fish was not farmed. Sustainability is a separate certification.' }
		]
	},
	{
		id: 'fd_0299',
		term: 'Day-Boat',
		level: 2,
		gist: 'Seafood from vessels that land the catch within hours of fishing',
		guest: 'The fishing boat went out and came back within a day, so the catch landed fresh instead of spending days on ice at sea. You can taste it in a sweeter, firmer bite.',
		why: 'Large trip boats stay out a week or more with the catch on ice, so the first fish caught is days old at the dock. Day boats fish close to shore and land within about 24 hours, so the flesh is firmer, sweeter and cleaner. Scallops are the classic.',
		note: 'Day-boat scallops are usually seared hard outside and left translucent in the center, and some kitchens serve them raw.',
		notThis: 'Not a promise it was caught today: it was fresh when landed, then may travel for days.',
		seeAlso: ['fd_0118', 'fd_0113', 'fd_0292'],
		confusedWith: ['fd_0298'],
		line: 'Seared day-boat scallops, brown butter, cauliflower',
		traps: [
			{ says: 'Seafood served only at lunch because the catch runs out by evening', why: 'It describes how long the fishing trip lasted, not when the dish is served.' }
		]
	},
	{
		id: 'fd_0300',
		term: 'Organic',
		level: 1,
		gist: 'Certified to federal rules limiting synthetic farm inputs',
		guest: 'The farm is certified to USDA organic rules, so it follows strict limits on synthetic pesticides, fertilizers and what the animals eat.',
		why: 'It is a legal claim, overseen by the USDA and checked yearly by certifiers. It rules out GMOs and most synthetic sprays and fertilizers. Livestock eat organic feed, and grazing animals must graze at least 120 days a year. It describes farming method, not flavor.',
		notThis: 'Not the same as local, natural, heirloom or grass-fed. Organic beef can still be finished on grain, as long as the grain is organic.',
		confusedWith: ['fd_0295', 'fd_0296', 'fd_0285'],
		line: 'Organic little gem, radish, buttermilk dressing',
		traps: [
			{ says: 'Grown with no pesticides or sprays of any kind on the plants', why: 'Certified growers may still use approved pesticides, mostly natural ones.' }
		]
	},
	{
		id: 'fd_0352',
		term: 'Mignardises',
		level: 3,
		say: 'meen-yar-DEEZ',
		gist: 'Tray of tiny sweets sent after dessert to close a tasting menu',
		guest: "They're the little sweets that come after dessert, one bite each. Often a chocolate, a macaron, a fruit jelly, sent out with the coffee.",
		why: 'From the French for dainty. After the plated dessert, the pastry kitchen sends a tray of one-bite sweets, usually chocolates, fruit jellies, macarons, financiers or caramels, to go with coffee. Each is a single bite, so the meal ends on variety rather than fullness.',
		madeWith: ['often chocolate', 'often butter', 'often egg', 'often wheat flour', 'often almonds', 'often cream', 'sometimes gelatin'],
		origin: 'French, from mignard, dainty: the last line of a tasting menu',
		notThis: 'Not an amuse-bouche, the savory bite that opens the meal. These are sweet and close it, after dessert.',
		seeAlso: ['fd_0290', 'fd_0238', 'fd_0255'],
		confusedWith: ['fd_0288'],
		line: 'Coffee, tea and mignardises',
		traps: [
			{ says: 'The plated dessert course itself, the one that ends a set tasting menu', why: 'They come after the dessert, not instead of it: one-bite sweets sent with the coffee.' }
		]
	},
	{
		id: 'fd_0353',
		term: 'Ikejime',
		level: 4,
		say: 'ee-keh-JEE-may',
		gist: 'Fish killed by a spike and bled at once, so the flesh stays firm',
		guest: "It's a Japanese way of handling fish, killed instantly and bled as it leaves the water so it never thrashes. The flesh stays firm and clean tasting, most often served raw.",
		why: 'A spike to the brain kills the fish instantly, it is bled, and often a wire is run down the spine to still the nerves. A fish that dies thrashing floods its muscle with stress chemistry and softens fast; this one stays firm for days and can be rested to deepen its flavor.',
		madeWith: ['fish'],
		note: 'Most often served raw or barely seared. The word covers only the kill and bleed, not how the fish was frozen or handled since.',
		origin: 'Japanese: ike, live, and shime, to close: killed while still alive',
		notThis: 'Not a species, a cut or a cooking method. It says only how the fish was killed and bled.',
		lexiconSlug: 'sashimi-grade-and-ikejime',
		seeAlso: ['fd_0220', 'fd_0299', 'fd_0298'],
		line: 'Ikejime madai, yuzu kosho, shiso',
		traps: [
			{ says: 'Fish kept alive in a tank and cooked to order the moment it is chosen', why: 'It names how the fish was killed and bled, not where it was kept. A tank fish can be ikejime too.' },
			{ says: 'Fish lightly cured in salt and rice vinegar before it is sliced', why: 'That is shime saba, vinegar-cured mackerel. This word is about how the fish was killed, not cured.' }
		]
	},
	{
		id: 'fd_0354',
		term: 'Regenerative',
		level: 3,
		aliases: ['Regeneratively Raised', 'Regeneratively Farmed'],
		gist: 'Farming that sets out to rebuild the soil, with no legal definition',
		guest: 'It means the farm works to rebuild its soil, moving cattle pasture to pasture and planting cover crops, not just avoiding harm. I can name the farm.',
		why: "Sustainable means doing no further harm; this sets out to repair: cover crops, little or no tilling, cattle moved often so the grass recovers. No law or label rule defines the word; only private marks like Regenerative Organic Certified are audited, so the farm's name matters.",
		origin: 'English, to grow back. Coined for farming by Robert Rodale in the 1980s',
		notThis: 'Not the same as organic, a federal legal standard with inspections. A farm can be one without the other.',
		seeAlso: ['fd_0296', 'fd_0297'],
		confusedWith: ['fd_0300', 'fd_0295'],
		line: 'Grilled bavette from a regenerative farm, chimichurri',
		traps: [
			{ says: 'Government soil standard for farms, audited yearly, one step above organic', why: "No government defines the word; only private certifications audit it, so it is the farm's own claim." }
		]
	},
	{
		id: 'fd_0355',
		term: 'Omakase',
		level: 3,
		say: 'oh-mah-KAH-say',
		gist: "Japanese chef's-choice meal with no printed menu, served piece by piece",
		guest: "It means leave it to the chef, who picks each course from the best fish in today and adjusts to how you eat. Just tell us anything you'd rather skip.",
		why: "Makaseru means to entrust. At a sushi counter the chef builds the meal from the day's fish, nigiri running from lighter to richer, at a set price or tiers. No menu is printed; the chef swaps pieces to the guest's taste and pace. Other kitchens borrow it for any chef's-choice meal.",
		note: 'Most pieces at a sushi counter are raw fish and nothing is printed ahead, so anything to avoid must be said before the first course.',
		origin: 'Japanese, o-makase, from makaseru, to entrust: I leave it up to you',
		notThis: "Not a printed tasting menu: the chef sets tonight's courses at the counter and can adjust them to you.",
		seeAlso: ['fd_0291', 'fd_0353'],
		confusedWith: ['fd_0290', 'fd_0289'],
		line: 'Omakase, 18 courses, counter seating only',
		traps: [
			{ says: 'All you can eat sushi service at one fixed price, ordered from a list', why: 'The chef chooses every course; the guest does not order, and the chef sets the count of pieces.' },
			{ says: 'Formal multi-course Japanese dinner whose sequence is fixed by tradition', why: 'That is kaiseki. Here the chef, not tradition, decides the order of courses.' }
		]
	}
];

export default cards;
