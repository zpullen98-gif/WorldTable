/* The Floor Deck, section "cuts". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{
		id: 'fd_0086',
		term: 'Ribeye Cap',
		aliases: ['Calotte', 'Spinalis', 'Rib Cap'],
		packet: true,
		gist: 'Heavily marbled crescent of beef that wraps the outside of a rib steak',
		guest: "It's the outer strip of a ribeye, the part most people save for the last bite. You get ribeye richness with the softness of a filet.",
		why: 'A ribeye is the round eye plus a thin crescent curving over it. That crescent, the spinalis, has the most marbling on the steak and a loose, open grain, so it eats softer and richer than the eye. One animal yields very little, hence the price.',
		madeWith: ['beef', 'often butter'],
		note: 'Thin, so it cooks fast. The marbling needs heat to melt, and most kitchens send it medium rare.',
		notThis: 'Not coulotte, the leaner sirloin cap from the back end. Calotte and coulotte sound alike on a menu.',
		seeAlso: ['fd_0090', 'fd_0093'],
		confusedWith: ['fd_0104'],
		line: 'Grilled ribeye cap, charred onion, bordelaise',
		traps: [
			{ says: 'Thick layer of outside fat trimmed from the top of a beef rib roast', why: 'It is a muscle, not a fat layer, and it is the most prized meat on the steak.' }
		]
	},
	{
		id: 'fd_0087',
		term: 'Cheek',
		aliases: ['Beef Cheek', 'Veal Cheek', 'Pork Cheek'],
		packet: true,
		gist: 'Hard-working chewing muscle of the face, braised until spoon-soft',
		guest: "It's the cheek muscle, braised for hours until it cuts with a spoon. Think of the richest pot roast you've had, silkier and deeper in flavor.",
		why: 'An animal chews all day, so this muscle is dense with connective tissue and tough as leather cooked fast. Braised low for three hours or more, that tissue melts into gelatin, making the meat sticky and silky and the braising liquid a glossy sauce.',
		madeWith: ['beef', 'sometimes veal', 'sometimes pork', 'often red wine', 'sometimes wheat flour'],
		note: 'Always slow cooked through, so there is no temperature to ask the guest for.',
		pairs: 'Red wine braise, polenta, mashed potato, root vegetables',
		lexiconSlug: 'shank-oxtail-and-cheek',
		seeAlso: ['fd_0102', 'fd_0026', 'fd_0068'],
		line: 'Braised beef cheek, soft polenta, red wine jus',
		traps: [
			{ says: 'Lean, naturally soft muscle from the face that cooks quickly like a steak', why: 'It is tough and full of connective tissue, and only hours of braising make it soft.' }
		]
	},
	{
		id: 'fd_0088',
		term: 'Hanger Steak',
		aliases: ['Onglet', "Butcher's Steak", 'Hanging Tender'],
		packet: true,
		gist: 'One thick cut of beef from the diaphragm, loose-grained and deeply mineral',
		guest: "It's the butcher's steak, the one they used to keep for themselves. Loose grain, deep beef flavor, and usually served sliced.",
		why: 'It hangs between the last rib and the loin, the thick central pillar of the diaphragm, one per animal. Bearing no weight, it stays fairly soft, but a coarse grain and rich blood supply give it a mineral flavor bolder than strip or filet. It is sliced across the grain.',
		madeWith: ['beef', 'often butter'],
		note: 'Best at medium rare. Past medium it tightens and turns chewy, so steer well-done guests elsewhere.',
		notThis: 'Not skirt steak, the long thin belt of diaphragm beside it. Hanger is one short, thick piece.',
		lexiconSlug: 'flank-skirt-and-hanger',
		seeAlso: ['fd_0099', 'fd_0210', 'fd_0097'],
		confusedWith: ['fd_0098'],
		line: 'Grilled hanger steak, chimichurri, fries'
	},
	{
		id: 'fd_0089',
		term: 'Ham Hock',
		aliases: ['Pork Hock', 'Pork Knuckle'],
		packet: true,
		gist: 'Bony lower leg joint of a pig, usually smoked and simmered to flavor a pot',
		guest: "It's the smoked lower joint of the pork leg. It simmers in the pot for hours and gives the whole dish a deep, smoky pork flavor.",
		why: 'The hock is where the leg meets the foot: mostly skin, tendon and bone with a little meat, usually cured and smoked like ham. Simmered for hours, the skin and tendon melt into gelatin that gives body to beans, greens and soups, and the smoke and salt season the pot.',
		madeWith: ['pork', 'salt', 'often wood smoke'],
		note: 'A hock often seasons a dish without showing on the plate. Mention the pork when a guest asks what is in it.',
		pairs: 'Collard greens, split pea soup, white beans, black-eyed peas',
		lexiconSlug: 'ham-and-hock',
		seeAlso: ['fd_0041', 'fd_0103'],
		line: 'White beans, smoked ham hock, cornbread',
		traps: [
			{ says: "The pig's foot below the ankle, all skin and small bones, pickled or stewed", why: 'That is the trotter. This is the joint just above it, where the leg meets the foot.' }
		]
	},
	{
		id: 'fd_0090',
		term: 'Ribeye',
		aliases: ['Rib Eye', 'Scotch Fillet', 'Cowboy Steak', 'Tomahawk'],
		packet: true,
		gist: 'Upper rib beef steak, the most marbled of the classic steakhouse cuts',
		guest: "It's the richest of the classic steaks, cut from the rib and marbled all the way through. For big beef flavor and a juicy bite, this is the one.",
		why: 'It comes from high on the back over the ribs, a muscle that does little work, so it is soft and threaded with fat that melts and bastes the meat from inside. It is fattier and bolder than a strip and far richer than a filet. Roasted whole, the same cut is prime rib.',
		madeWith: ['beef', 'often butter'],
		note: 'Medium rare to medium suits it better than rare, where the fat can stay waxy.',
		pairs: 'Creamed spinach, baked potato, red wine sauce, Cabernet',
		lexiconSlug: 'ribeye-prime-rib',
		seeAlso: ['fd_0086', 'fd_0095', 'fd_0294'],
		line: '16 oz bone-in ribeye, roasted garlic butter',
		traps: [
			{ says: 'The strips of meat from between the bones of a rack of barbecue ribs', why: 'It is the large muscle lying on top of the rib bones, not the meat between them.' }
		]
	},
	{
		id: 'fd_0091',
		term: 'Shoulder',
		aliases: ['Chuck', 'Pork Butt', 'Boston Butt', 'Picnic'],
		packet: true,
		gist: 'Hard-working cut above the front leg that shreds after hours of low heat',
		guest: 'Shoulder is the cut made for slow cooking. After hours of low heat it pulls apart with a fork and has more flavor than any of the lean cuts.',
		why: "The front legs carry most of an animal's weight, so the shoulder is dense with connective tissue and seamed with fat, and chewy if cooked fast. Braised, smoked or slow roasted for hours, that tissue melts and the meat shreds. It is pulled pork and carnitas on a pig, pot roast on a steer.",
		madeWith: ['often pork', 'often lamb', 'sometimes beef'],
		notThis: 'Pork butt, or Boston butt, is the upper shoulder, not the rear of the pig. The rear leg is the ham.',
		recipe: 'cider-braised-pork-shoulder',
		seeAlso: ['fd_0026', 'fd_0100', 'fd_0101'],
		line: 'Slow-roasted lamb shoulder, white beans, salsa verde',
		traps: [
			{ says: 'Tender, lightly worked roast above the front leg needing only a quick sear', why: 'It works hard and is tough until long, slow cooking melts its connective tissue.' }
		]
	},
	{
		id: 'fd_0092',
		term: 'Short Rib',
		aliases: ['Beef Short Ribs', 'Flanken', "Jacob's Ladder"],
		packet: true,
		gist: 'Fatty beef on stubby bones from low on the chest, braised until it yields',
		guest: 'Short rib is thick, well-marbled beef braised for hours until it falls off the bone. Rich and soft, like pot roast turned all the way up.',
		why: 'It comes from the lower rib cage, in the chuck and plate, where the meat is heavily marbled and layered with connective tissue. A long braise melts both, so the beef holds its shape but gives to a fork. Sawn thin across the bones, the same cut is grilled fast for Korean barbecue.',
		madeWith: ['beef', 'often red wine', 'sometimes wheat flour', 'sometimes soy', 'sometimes sesame'],
		note: 'Braised short rib is cooked through. There is no temperature to ask the guest for.',
		pairs: 'Red wine sauce, mashed potato, polenta, horseradish',
		lexiconSlug: 'short-ribs-english-vs-flanken',
		recipe: 'oregon-pinot-noir-braised-short-ribs',
		seeAlso: ['fd_0026', 'fd_0101', 'fd_0087'],
		line: 'Red wine braised short rib, potato puree, glazed carrots',
		traps: [
			{ says: 'Beef from the brisket, the breast muscle, sold on a small piece of bone', why: 'It comes from the lower rib cage in the chuck and plate, next to the brisket but not part of it.' }
		]
	},
	{
		id: 'fd_0093',
		term: 'Tenderloin',
		aliases: ['Filet Mignon', 'Beef Filet', 'Fillet'],
		packet: true,
		gist: 'Small tapered muscle under the spine, the softest, mildest steak cut',
		guest: 'Tenderloin is the most tender cut on the animal, the one filet mignon comes from. Lean, mild and so soft you barely need the knife.',
		why: 'A long, narrow muscle under the backbone that does almost no work, it has very little connective tissue and cuts like butter. The trade is flavor: lean, with little marbling, it tastes milder than a ribeye or strip, so it often comes with a sauce, a butter or a bacon wrap.',
		madeWith: ['beef', 'sometimes pork', 'sometimes bacon', 'often butter'],
		note: 'Beef filet dries out past medium, so most kitchens suggest rare to medium rare. Pork tenderloin is always cooked further.',
		pairs: 'Bearnaise, peppercorn sauce, red wine sauce, mushrooms',
		lexiconSlug: 'tenderloin-filet-mignon',
		seeAlso: ['fd_0096', 'fd_0095', 'fd_0090'],
		line: '8 oz beef tenderloin, bearnaise, pommes puree',
		traps: [
			{ says: 'The wide, lean roast along the back of a pig that chops are cut from', why: 'That is the loin. The tenderloin is the small tapered muscle tucked beneath it.' }
		]
	},
	{
		id: 'fd_0094',
		term: 'Pork Belly',
		packet: true,
		gist: 'Fresh, uncured slab from the underside of the pig, layered fat and lean',
		guest: "It's the same cut as bacon, only fresh. It's very rich, cooked slowly until spoon tender, then crisped on the outside.",
		why: 'The boneless underside of the pig, in alternating layers of fat and lean. Slow cooking melts the fat and softens the meat, then high heat crisps the surface or the skin. Rich like short rib but softer and sweeter, so portions are small and come with something sharp.',
		madeWith: ['pork', 'salt', 'sometimes soy sauce', 'sometimes sugar'],
		pairs: 'Pickles, apples, mustard, bitter greens, soy and ginger glazes',
		notThis: 'Not bacon, which is this cut cured and smoked, nor pancetta, cured and not smoked. Belly on a menu is fresh meat.',
		lexiconSlug: 'pork-belly',
		recipe: 'siu-yuk-crackling-roast-pork-belly',
		seeAlso: ['fd_0026', 'fd_0047'],
		confusedWith: ['fd_0083', 'fd_0071'],
		line: 'Crispy pork belly, apple mostarda, mustard greens',
		traps: [
			{ says: "The pig's stomach lining, an organ meat simmered for hours until it turns soft", why: 'It is muscle and fat from the underside of the animal, not the stomach or any organ.' }
		]
	},
	{
		id: 'fd_0095',
		term: 'New York Strip',
		aliases: ['Strip Steak', 'Kansas City Strip', 'Striploin'],
		gist: 'Short loin steak with a firm, tight bite and a band of fat down one edge',
		guest: "It's the classic steakhouse steak, with a firmer bite and beefier flavor than filet. It's a little leaner than a ribeye, with an edge of fat that crisps on the grill.",
		why: 'Cut from the short loin, along the back just behind the ribs. It is the same long back muscle as the ribeye, only further back, where it carries less marbling. That muscle does little work, so it stays tender, with a tight grain and a clean chew.',
		madeWith: ['beef', 'often butter'],
		origin: 'Named for New York steakhouses, where it became the house cut',
		pairs: 'Peppercorn sauce, compound butter, creamed spinach, fries',
		lexiconSlug: 'strip-new-york-strip',
		seeAlso: ['fd_0090', 'fd_0093', 'fd_0096'],
		line: '14 oz New York strip, bone marrow butter, watercress',
		traps: [
			{ says: 'A thin, lean steak sliced from the round, the hard-working back leg', why: 'It comes from the short loin along the back, a tender area, not from the leg.' }
		]
	},
	{
		id: 'fd_0096',
		term: 'Porterhouse and T-Bone',
		aliases: ['Porterhouse', 'T-Bone'],
		gist: 'One large steak holding two: strip on one side, tenderloin on the other',
		guest: "It's two steaks on one T-shaped bone, a New York strip on one side and filet on the other. The porterhouse is the bigger cut, with more filet.",
		why: 'Both are sawn across the short loin, so each slice catches the strip above the bone and the tenderloin below it. The tenderloin tapers toward the front, so rear steaks, with a wide filet, are porterhouses and forward ones are T-bones. USDA sets the line at 1.25 inches of filet.',
		madeWith: ['beef', 'often butter'],
		note: 'The filet side cooks faster than the strip side, so the two halves rarely land at the same doneness.',
		pairs: 'Creamed spinach, hash browns, a big red wine',
		lexiconSlug: 't-bone-and-porterhouse',
		seeAlso: ['fd_0095', 'fd_0093', 'fd_0294'],
		line: 'Porterhouse for two, 32 oz, roasted garlic, sea salt',
		traps: [
			{ says: 'Two regional names for exactly the same steak, identical in size and makeup', why: 'They differ in how much tenderloin they carry: the porterhouse has the wider piece.' },
			{ says: 'A steak pairing ribeye and tenderloin on either side of one central rib', why: 'The large side is strip loin, not ribeye, and the cut comes from the short loin, behind the ribs.' }
		]
	},
	{
		id: 'fd_0097',
		term: 'Flank Steak',
		gist: 'Wide, lean sheet of beef from the lower abdomen with a long grain',
		guest: "A lean, flat steak with big beefy flavor, cooked hot and fast and sliced thin across the grain, so it's tender with a little chew.",
		why: 'One flat abdominal muscle from just ahead of the back legs. It works constantly, so it is lean and full of flavor, with long fibers running its whole length. Sliced thin across them it is tender, along them stringy.',
		madeWith: ['beef', 'sometimes soy sauce', 'sometimes garlic'],
		note: 'Best at medium rare to medium. With so little fat it dries out and toughens past that.',
		pairs: 'Chimichurri, citrus or soy marinades, steak salads',
		notThis: 'Not skirt, a longer, fattier ribbon from under the ribs, nor bavette, the looser-grained sirloin flap.',
		lexiconSlug: 'flank-skirt-and-hanger',
		seeAlso: ['fd_0210', 'fd_0032'],
		confusedWith: ['fd_0098', 'fd_0099'],
		line: 'Grilled flank steak, chimichurri, charred onions'
	},
	{
		id: 'fd_0098',
		term: 'Skirt Steak',
		aliases: ['Arrachera'],
		gist: 'Long, thin ribbon of beef from under the ribs, loose grained, well marbled',
		guest: "A long, thin steak with a loose grain and rich marbling, so it's intensely beefy. It's the classic for carne asada.",
		why: 'The outside skirt is the diaphragm and the inside skirt lies beside it, both from the plate. A thin belt with coarse fibers running across its width and more fat than flank, it soaks up marinade and chars fast. It wants fierce heat, then slicing across the grain.',
		madeWith: ['beef', 'sometimes soy sauce', 'sometimes lime'],
		note: 'Best at medium rare to medium. It is so thin that it toughens quickly past that.',
		origin: 'Fajitas take their name from it: faja is Spanish for belt',
		notThis: 'Not flank, wider and leaner, nor hanger, short and thick, nor bavette, the thicker sirloin flap.',
		lexiconSlug: 'flank-skirt-and-hanger',
		seeAlso: ['fd_0210'],
		confusedWith: ['fd_0097', 'fd_0088', 'fd_0099'],
		line: 'Skirt steak carne asada, salsa verde, grilled scallions'
	},
	{
		id: 'fd_0099',
		term: 'Bavette',
		say: 'bah-VET',
		aliases: ['Sirloin Flap', 'Flap Steak', 'Flap Meat'],
		gist: 'Loose, open-grained bottom sirloin steak, a French bistro favorite',
		guest: 'A French bistro steak from the sirloin, next to the flank. Loose, juicy grain and deep beefy flavor, like skirt but thicker and more tender.',
		why: 'It is the sirloin flap, a thin muscle where the bottom sirloin meets the flank. Its coarse, open fibers have good marbling between them, so it holds marinade and sauce, takes a hard sear and stays juicy.',
		madeWith: ['beef', 'often butter', 'sometimes shallot'],
		note: 'Best at medium rare, sliced across the grain. Past medium it turns chewy.',
		origin: 'French for bib, bistro shorthand for flat belly-side steaks',
		notThis: 'Not flank or skirt, though in France the word covers several flat cuts. Here it is sirloin flap, looser and more marbled than flank.',
		seeAlso: ['fd_0088', 'fd_0104'],
		confusedWith: ['fd_0097', 'fd_0098'],
		line: 'Bavette steak, shallot butter, frites'
	},
	{
		id: 'fd_0100',
		term: 'Flat Iron Steak',
		aliases: ['Top Blade Steak', "Butler's Steak", 'Oyster Blade'],
		gist: 'Chuck steak with its tough center gristle cut out, nearly as tender as filet',
		guest: 'Flat iron is a shoulder steak, second only to filet for tenderness. It has more marbling than filet, so it tastes beefier.',
		why: 'It is the top blade muscle from the shoulder, or chuck. A thick seam of gristle runs through its middle, which kept it off menus until meat scientists in Nebraska and Florida showed, around 2002, how to cut it out, leaving two flat, well-marbled steaks.',
		madeWith: ['beef'],
		origin: 'Named for its shape, like an old flat clothes iron',
		pairs: 'Salsa verde, chimichurri, fries, bistro salads',
		lexiconSlug: 'flat-iron',
		seeAlso: ['fd_0091', 'fd_0093', 'fd_0088'],
		line: 'Flat iron steak, salsa verde, crispy potatoes',
		traps: [
			{ says: 'A thin steak pounded out with a mallet and seared under a heavy press', why: 'The name describes the shape of the muscle, not a way of pounding or pressing it.' }
		]
	},
	{
		id: 'fd_0101',
		term: 'Brisket',
		gist: 'Tough chest muscle of beef that turns tender only after hours of slow heat',
		guest: 'Beef from the chest, cooked slowly for hours until tender and juicy, with deep beefy flavor and a rich, melting edge of fat.',
		why: "The chest muscles carry much of the steer's weight, so they are dense with connective tissue. Hours of low heat, in smoke or a braise, melt it into gelatin for a moist, silky slice. The flat is the lean half and the point the fatty half. Cured, it becomes corned beef and, often, pastrami.",
		madeWith: ['beef'],
		note: 'Sliced across the grain. Smoked brisket often shows a pink ring under the crust: the smoke ring, and it is normal.',
		pairs: 'Pickles, raw onion and white bread, or carrots and onions in a braise',
		lexiconSlug: 'brisket-point-vs-flat',
		recipe: 'central-texas-smoked-brisket',
		seeAlso: ['fd_0085', 'fd_0072', 'fd_0041'],
		line: 'Smoked brisket, house pickles, white bread, mustard slaw',
		traps: [
			{ says: 'A style of slow smoked barbecue, not any particular part of the animal', why: 'It is a specific cut, the chest of the steer, and it is braised and cured as well as smoked.' }
		]
	},
	{
		id: 'fd_0102',
		term: 'Oxtail',
		gist: 'Rounds of beef tail, braised until the meat slips off the bone',
		guest: "Oxtail is the tail of the steer, cut into thick rounds and braised for hours until it falls off the bone. It's rich, sticky and deeply beefy.",
		why: 'The tail is mostly bone, cartilage and small pockets of hard-working muscle, so it is loaded with collagen. Hours of slow, wet heat melt that into gelatin, giving silky meat and a glossy, sticky sauce. Think short rib, only deeper and more gelatinous.',
		madeWith: ['beef', 'onion', 'carrot', 'often red wine', 'often wheat flour', 'often soy sauce', 'sometimes butter beans'],
		note: 'Usually served on the bone, so tell guests to expect small bones.',
		origin: 'Once the tail of an ox, now of any beef cattle',
		pairs: 'Butter beans, rice and peas, polenta, mashed potato',
		lexiconSlug: 'shank-oxtail-and-cheek',
		recipe: 'jamaican-oxtail-stew',
		seeAlso: ['fd_0103', 'fd_0087', 'fd_0026'],
		line: 'Braised oxtail, butter beans, rice and peas'
	},
	{
		id: 'fd_0103',
		term: 'Shank',
		gist: 'The lower leg, all sinew around a marrow bone, braised until spoon-tender',
		guest: "Shank is the lower leg of lamb or veal, braised for hours until it's spoon-tender and slides off the bone. The sauce is made from its own rich juices.",
		why: 'The lower leg carries the animal all day, so the meat is lean, tough and laced with sinew. Hours of gentle braising melt that sinew into gelatin, giving moist shreds and a sticky sauce. Lamb comes whole on the bone. Veal is often cross-cut around its marrow bone.',
		madeWith: ['lamb or veal', 'sometimes beef or pork', 'onion', 'carrot', 'often red wine', 'often wheat flour', 'often butter'],
		note: 'A whole lamb shank is a big portion on a long bone. The marrow in a cross-cut piece is meant to be eaten.',
		origin: "Sold as lamb, veal, beef or pork; cross-cut veal shank is Italy's osso buco",
		pairs: 'Polenta, saffron risotto, white beans, mashed potato',
		lexiconSlug: 'shank-oxtail-and-cheek',
		seeAlso: ['fd_0102', 'fd_0061', 'fd_0089'],
		line: 'Braised lamb shank, creamy polenta, rosemary jus',
		traps: [
			{ says: 'The upper thigh of the animal, lean and tender enough to grill as a steak', why: 'It is the lower leg, the shin, and it is far too sinewy to grill. It needs hours of braising.' }
		]
	},
	{
		id: 'fd_0104',
		term: 'Coulotte',
		say: 'koo-LOT',
		aliases: ['Picanha', 'Culotte'],
		gist: 'The triangular cap of the top sirloin, grilled under its own fat',
		guest: "Coulotte is the cap of the top sirloin, a juicy, beefy steak cooked under its own fat so it bastes itself. In Brazil it's picanha, the star of the steakhouse.",
		why: 'One triangular muscle on top of the sirloin, under a thick layer of fat. It does moderate work, so it is tender enough to grill or roast but beefier than the loin steaks. Sliced across the grain it eats like a leaner, firmer strip.',
		madeWith: ['beef', 'coarse salt', 'sometimes garlic', 'sometimes butter'],
		note: 'Best at medium rare to medium, with the fat cap left on.',
		origin: "French culotte, a rump cut; Brazil's picanha, said pee-KAHN-yah",
		notThis: 'Not the ribeye cap, which comes from the rib and is far richer. This one sits on the sirloin, by the hip.',
		seeAlso: ['fd_0095', 'fd_0099'],
		confusedWith: ['fd_0086'],
		line: 'Grilled coulotte steak, chimichurri, charred onion',
		traps: [
			{ says: 'A lean steak from the hind leg that has to be braised to turn tender', why: 'It comes from the sirloin, not the leg, and it is tender enough to grill or roast.' }
		]
	},
	{
		id: 'fd_0105',
		term: 'Rack of Lamb',
		gist: 'The rib section of a young sheep, roasted whole and carved into chops',
		guest: "Rack of lamb is the rib section, roasted whole and carved into chops on the bone. It's the most tender, mild cut of lamb, the ribeye of the animal.",
		why: 'Seven or eight ribs with the eye of loin meat attached, a muscle along the back that barely works, so it is fine-grained and tender. The bones are often frenched, meaning scraped clean for looks. It is roasted fast and hot, then cut into single or double chops.',
		madeWith: ['lamb', 'often mustard', 'often wheat breadcrumbs', 'often garlic', 'rosemary', 'sometimes butter'],
		note: 'Best at medium rare, rosy through the middle. Past medium the small eye of meat dries out quickly.',
		pairs: 'Mustard and herb crust, mint, rosemary, garlic',
		lexiconSlug: 'lamb-primals',
		seeAlso: ['fd_0090', 'fd_0037', 'fd_0199'],
		line: 'Herb-crusted rack of lamb, mint salsa verde, potato gratin',
		traps: [
			{ says: 'The belly ribs of a young sheep, slow-smoked like barbecue spare ribs', why: 'It is the upper ribs with the tender loin eye attached, roasted fast and served pink.' }
		]
	},
	{
		id: 'fd_0106',
		term: 'Pork Chop',
		gist: "A thick slice across the hog's loin, usually on the bone, seared or grilled",
		guest: "A pork chop is a thick cut from the loin, the pig's answer to a bone-in strip or ribeye. Done right, it's seared outside and juicy in the middle.",
		why: "Chops are sliced across the loin, the long muscle down the pig's back. It does little work, so it is tender, but it is lean and dries out fast. Kitchens fight that with thick cuts, the bone left in, a brine and a rest. Rib chops carry more fat than center-cut loin chops.",
		madeWith: ['pork', 'often salt brine', 'sometimes sugar', 'sometimes butter', 'sometimes garlic'],
		note: 'Many kitchens now cook it to a blush of pink, 63 C (145 F) plus a rest, so ask the chef how ours is cooked.',
		pairs: 'Apples, mustard, sage, cabbage, cider sauce',
		recipe: 'vermont-maple-brined-pork-chops',
		seeAlso: ['fd_0027', 'fd_0094', 'fd_0049'],
		line: 'Brined bone-in pork chop, roasted apples, mustard jus',
		traps: [
			{ says: 'A loin slice from the hog that is only ever served well done, never pink', why: 'Since 2011 the national guidance has been 63 C (145 F) with a rest, and many kitchens serve a blush of pink.' },
			{ says: "A thick slice of the hog's hind leg, cured and smoked before it is grilled", why: 'That is a ham steak. This cut is fresh meat from the loin along the back, not cured leg.' }
		]
	},
	{
		id: 'fd_0107',
		term: 'Wagyu',
		say: 'WAH-gyoo',
		gist: 'Beef from Japanese cattle breeds prized for dense, fine marbling',
		guest: "Wagyu is beef from Japanese cattle breeds famous for marbling. The fat runs all through the meat, so it's buttery, tender and so rich that a little goes a long way.",
		why: "These breeds are genetically inclined to store fat inside the muscle, not just around it, and are fed far longer than other cattle. That fat melts at a lower temperature than other beef fat, so it goes buttery in the mouth. Japan's top grade is A5. American versions are usually crossed with Angus.",
		madeWith: ['beef'],
		note: 'Japanese A5 is usually sold by the ounce, seared quickly and served in small portions.',
		origin: 'Japanese: wa means Japanese and gyu means cattle',
		notThis: 'Not the same as Kobe, one regional brand of it from Hyogo. All Kobe is Wagyu, but very little Wagyu is Kobe.',
		lexiconSlug: 'wagyu-and-kobe',
		seeAlso: ['fd_0090', 'fd_0095', 'fd_0039'],
		line: 'A5 Wagyu strip, sea salt, fresh wasabi',
		traps: [
			{ says: 'Beef from cattle massaged daily and fed beer to make the meat tender', why: 'That is mostly legend. The marbling comes from breeding and long, careful feeding.' },
			{ says: 'A protected name for beef raised only around the city of Kobe', why: 'That describes Kobe, one regional brand. The word covers the Japanese breeds wherever they are raised.' }
		]
	}
];

export default cards;
