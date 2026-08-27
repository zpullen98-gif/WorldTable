/**
 * The standard: what a correct plate looks like at the pass.
 *
 * AUTHORED, NOT DERIVED. Everything else in this directory computes something
 * out of `reference/world-table-v1.html`, which is the only source of truth for
 * the guide's content. This is the exception, in the same way SUPPLEMENT in
 * technique-table.mjs is: the original never carried a standard, so there is
 * nothing to extract. These are written, and they are ours.
 *
 * WHY IT EXISTS. The guide teaches a cook to MAKE a dish and never tells them
 * what a correct one looks like, so `cookedLog` could only ever record that
 * something was attempted. A cook who has made one French omelette has not
 * learned the omelette, and nothing in the app could tell the difference. A
 * stated standard is what turns a recipe into something a cook can be assessed
 * against — by themselves, honestly, which is the only assessment an offline app
 * can offer.
 *
 * WHAT A MARK IS. Something the cook standing at the pan can verify without
 * asking anyone: seen, heard, felt, measured or timed. Ordered the way it is
 * actually checked — surface, then structure, then interior, then seasoning.
 * Three to five per dish; the build fails outside that range, because two marks
 * is not a standard and six is a recipe.
 *
 * WHAT A MARK IS NOT. Not "tastes good". Not the flavour prose — every recipe
 * already carries a `note` that gestures at the standard, and a mark that is
 * that sentence rearranged is worth nothing. Not method: "use a nonstick pan"
 * belongs in `steps`, and a mark that tells the cook what to DO has failed to
 * say what to LOOK FOR.
 *
 * `fault` is the commonest real failure and what it looks like on the plate — a
 * diagnosis rather than a warning. "Browned, because the pan was too hot and the
 * eggs sat" teaches more than "do not overcook".
 *
 * SCOPE. The 45 dishes of the Path of Study first, because that is where the
 * teaching happens and where a standard changes what the app can do. The other
 * 925 recipes are a rolling job; a dish with no standard renders without the
 * block and is not an error. A standard whose slug matches no recipe IS an
 * error and fails the build — same reasoning as a SUPPLEMENT entry that tags
 * nothing: it means we wrote a slug the corpus never had.
 */

export const STANDARDS = [
	// ── 1. Knife & Fire Foundations ──────────────────────────────────
	{
		slug: "the-french-omelette",
		marks: [
			"Uniform pale blond over the whole surface, seam and both ends included; turn it under the light and no tan or freckled patch appears anywhere.",
			"Cigar-shaped, closed at both ends, seam underneath; it holds its roll on the plate and does not slacken open.",
			"Skin unbroken and dry to the eye — no curd bursting through a tear, and no butter or water weeping into a ring around it within thirty seconds of plating.",
			"Cut across it: cream-fine moist curds top to bottom with no ropey white streaks of unbeaten albumen, the set base no thicker than a coin, and when the plate is tilted the centre slumps once and stops rather than running.",
			"Seasoned evenly through — first bite and last taste the same, with no grains of salt sitting on the outside and no flat unsalted mouthful in the middle."
		],
		fault: "The pan ran hot and the eggs were left to sit between stirs, so the omelette comes up freckled tan on the seam side with the curds fused into one rubbery sheet instead of custard."
	},
	{
		slug: "cacio-e-pepe",
		marks: [
			"Even gloss along every strand; no chalky white grit on the pasta, no cheese welded to the tongs or fused to the bottom of the bowl.",
			"Lift a forkful and the sauce hangs on it; the sauce is still loose and glossy when the bowl reaches the table, and the emptied bowl keeps a thin clinging film rather than a watery pool that separates within a minute.",
			"Pepper is cracked coarse enough that individual fragments are visible in the sauce, and it is worked through the coating rather than dusted over the top — no dry black powder left on the surface.",
			"Bitten, a strand resists at the centre with no chalky raw core.",
			"Fully seasoned from the pecorino alone: nothing is reached for at the table, and it is not so salty it sends you to the water glass."
		],
		fault: "The cheese met heat — the paste was built with boiling water or tossed in a pan still on the flame — and the pecorino has seized into stringy pellets sitting in a thin grey puddle."
	},
	{
		slug: "ratatouille",
		marks: [
			"Every piece is still recognisable as its own vegetable at roughly 2cm; nothing has collapsed into a common pulp.",
			"Spoon up a few pieces of each and the eggplant, zucchini and pepper all carry browned faces — the pan colour is on every vegetable, not just one, and none of it reads uniform grey.",
			"Eggplant is creamy through with no squeak; zucchini yields but holds its square and has not watered out.",
			"Liquid in the pot is a small amount of glossy, oil-slicked juice, not a thin wash; a spoon dragged across the bottom leaves a track that fills back slowly.",
			"Taste an eggplant cube and a piece of tomato back to back — both are seasoned, neither bland against the other — and the garlic and herbs taste cooked-sweet and perfumed with no raw grassy bite."
		],
		fault: "Everything went into one crowded pan, the vegetables released their water and stewed instead of browning, so the dish arrives grey and slack in a thin pool with the zucchini gone to pulp."
	},
	{
		slug: "chicken-piccata",
		marks: [
			"Cutlets of even thickness, around 1cm, golden edge to edge on both faces with no pale patches of unbrowned flour.",
			"Sauce is the brown of lifted fond rather than floury-pale, the pan floor scraped clean, and nothing on the plate tastes of raw flour.",
			"Sauce is opaque and glossy, coats the back of a spoon and holds together on the plate — no yellow butter ring creeping out at the rim.",
			"Roughly two tablespoons per cutlet, clinging to the meat rather than pooling: cut at the thickest point the chicken is just opaque with clear juice, and the coating is still on the cutlet rather than shed into the sauce.",
			"Sharp before rich — lemon and caper brine land first, the butter behind them — and nobody reaches for more lemon at the table."
		],
		fault: "The final butter went in over live heat and the sauce split — a greasy yellow slick with the capers stranded in it, and cutlets sitting in oil instead of wearing a glaze."
	},
	{
		slug: "salade-nicoise",
		marks: [
			"Arranged in distinct groups on the platter, each element liftable on its own: tuna in large hand-broken flakes rather than shredded to floss, nothing tossed into confetti, no ingredient buried.",
			"Beans are bright green and snap when bent, not olive-drab and floppy.",
			"Halve a potato: the interior is glossy and seasoned to the centre, not dry and white under a merely wet skin.",
			"Halve an egg: white fully set, yolk bright and just tacky at the middle, no grey-green ring at the boundary.",
			"Tasted on its own the vinaigrette is sharp enough to sting, and it stays joined through service — the platter floor carries a light gloss, not a split pool under the potatoes."
		],
		fault: "The potatoes were dressed after they went cold, so the vinaigrette slides straight off them into a puddle under the platter and the salad reads bland while the bottom of the dish is oily."
	},

	// ── 2. Stocks, Soups & the Simmer ────────────────────────────────
	{
		slug: "miso-soup",
		marks: [
			"Judge the dashi before any miso goes near it: clear pale gold, you can see the bottom of the pot through it, and savoury enough to drink unseasoned. If it tastes like hot water, no amount of miso will rescue the bowl.",
			"Nothing solid strayed through — no scum, no shreds of kombu or katsuobushi, no undissolved lumps of miso, no grit on the tongue.",
			"The finished bowl is an even cloudy tan and stays even for the first minute or two, not a clear layer sitting above a sludge of settled miso.",
			"Tofu cubes arrive whole and hot through, not broken into curds by stirring; wakame is fully unfurled and silky rather than rubbery or leathery.",
			"Hot enough to steam but sippable straight from the bowl without a spoon, around 75°C, and the miso still smells sweet and malty at the nose — flat and merely salty means it went back to the boil."
		],
		fault: "The pot was brought back to a boil after the miso went in, so the aroma has blown off and what arrives is gritty salt water — the dashi's work erased in the last thirty seconds."
	},
	{
		slug: "soupe-a-loignon",
		marks: [
			"A spoonful lifted from any depth of the pot shows mahogany strands throughout, with no pale or yellow ones hiding near the top.",
			"The kilo of raw onions has collapsed to roughly a fifth of its volume: a jammy tangle with no rings still holding their shape.",
			"Broth is dark and clean-bodied, just filming the back of a spoon; never gluey, never pale, and with no raw-flour taste.",
			"The Gruyère lid is bronzed and blistered, sealed to the rim of the bowl, and lifts off in one sheet with the crouton beneath it still holding under spoon pressure rather than dissolved to mush.",
			"Sweet first, beef-savoury behind it, and no bitterness in the finish — a scorched edge at the back of the throat is the tell that the hour was rushed."
		],
		fault: "The heat was pushed to save the hour, so the onions carry black scorched shreds around pale undercooked centres and the finished bowl tastes bitter where it should taste sweet."
	},
	{
		slug: "pasta-e-fagioli",
		marks: [
			"Ladled, it falls in a slow ribbon and mounds slightly in the bowl rather than spreading flat to the rim.",
			"Broth is opaque and velvety; no clear liquid separates out around the beans after a minute standing.",
			"Most beans are still whole with their skins intact rather than the pot gone to paste, and the ditalini is still firm at the tooth when the bowl reaches the table — pasta is distinguishable from bean by bite.",
			"Surface carries a slick of raw finishing oil, beaded and green-smelling rather than cooked in, with grated cheese that has not yet melted flat.",
			"Tasted at the bowl it needs no salt at the table and is not sharp with it — the rind and the finishing cheese are already in the total. Rosemary reads as background perfume, with no loose needles in the spoon."
		],
		fault: "It sat on the stove or was reheated, and the ditalini has drunk the broth — what arrives is a stiff bean porridge with soft grey pasta and no liquid left to call soup."
	},
	{
		slug: "barszcz",
		marks: [
			"Deep luminous garnet; a spoonful held to the light reads red-purple, not brick, brown or dusty pink.",
			"The strained version is genuinely clear — light passes through the bowl with no cloud or sediment; the blended version is uniformly smooth with no fibrous beet threads.",
			"Nothing rides the surface and nothing strays into the bowl: no fat beads, no scum, no loose allspice berry or bay fragment — the only solids present are the ones put there deliberately.",
			"Hot enough to steam but off the boil: a spoon of sour cream stirred through blends to an even pink without curdling into flecks or beading at the rim.",
			"Sour first and hard enough to tighten the jaw, sugar arriving a beat behind to round it, salt last — if the first spoon reads sweet earth before it reads sour, it is not barszcz yet."
		],
		fault: "The vinegar went in early and the pot kept boiling, so the soup arrives a dull brownish brick with the sourness cooked flat, tasting merely of sweet earth."
	},

	// ── 3. The Sauté Station & Pan Sauces ────────────────────────────
	{
		slug: "sole-meuniere",
		marks: [
			"The fillet leaves the pan whole and arrives whole: an even tan crust across the top face, no white floury patches at the thin tail end, and no pale grey paste welded to the pan behind it.",
			"The butter solids in the sauce are brown specks, not black grit, and the butter itself is the colour of a hazelnut skin and no darker.",
			"The crust is still audible under the sauce. Press a fork to the floured face on the plate and it gives a faint crackle, with the coating still dry-edged where the butter has not pooled. A fillet that waited on the plate while the noisette was fussed over arrives uniformly slack.",
			"The crust holds when a fork goes in, and the flesh beneath separates into opaque white sheets with no translucent seam at the thickest point.",
			"Taste a corner: the crust is seasoned in itself, with no salt grains left sitting on the surface, and the lemon reads as brightness through the butter rather than as a sour edge sitting on top of it."
		],
		fault: "A black, acrid sauce, because the noisette was made in the pan that just cooked the flour. The scorched dredge was already sitting in there, so the butter went from foam to bitter with no nutty stage in between, and the specks in it are carbon rather than browned milk solids."
	},
	{
		slug: "shrimp-scampi",
		marks: [
			"The garlic is straw-pale and slack, every slice the same colour. One browned edge shows in a sauce this shallow, and tastes of it.",
			"The sauce is opaque and clinging rather than clear: a spoon drawn through the pan leaves a track that closes slowly, no free butter rings the pan edge, and once the linguine goes in every strand is slick with nothing pooling in the bottom of the bowl.",
			"Every shrimp is a loose C. Tight closed rings mean they sat in the pan through the reduction instead of leaving it early.",
			"Cut across the thickest part of the back: opaque to the centre, no grey translucent core, the flesh parting with a clean snap rather than compressing.",
			"Taste the sauce before the shrimp go back in: the wine reads cooked, with no raw-alcohol sharpness on the front of the tongue, and the lemon lands behind the garlic rather than in front of it."
		],
		fault: "Rubbery shrimp in a good sauce, because they were cooked through on the first pass and then returned to the pan anyway. They come out tight, closed rings that bounce off the tooth and shed a little water into the sauce as they sit, and no amount of butter reads as anything but a wasted mount around them."
	},
	{
		slug: "chicken-teriyaki",
		marks: [
			"The skin is one continuous lacquered sheet, mahogany and flat against the meat, with no shrunken lifted edges and no black patches where the sugar caught.",
			"The glaze is thin enough to see the skin through and thick enough to hang: a drip off the spoon stretches before it falls, and no thin brown puddle spreads from under the thigh. On the tongue it is savoury and salty first with the sweetness behind, not candy.",
			"The skin holds its own under the knife. It parts with the meat rather than sliding off as a soft sheet, and the glaze sits on it as a film instead of soaking into a spongy layer.",
			"Sliced across after resting, the meat is uniformly opaque and the board takes a trace of clear juice, not a flood.",
			"No fat slick anywhere: what sits under the chicken and around the slices is glaze, not oil, and it does not separate into a rim as the plate stands."
		],
		fault: "Soft skin under a sticky coat, because the sauce went into the pan before the fat had finished rendering and before the pan was drained. The glaze steams the crust it was meant to sit on, and the thigh arrives sweet, slippery and flabby with the skin loose from the meat."
	},
	{
		slug: "garides-saganaki",
		marks: [
			"No colour on the aromatics. Check before the tomatoes go in: the onion is translucent and slack with no gold at the edges and the garlic has not taken any colour. In the finished pan there are no brown flecks showing against the red.",
			"The sauce is reduced far enough that a spoon dragged across the pan bottom leaves a track that holds a beat, and a film of orange oil has come to the surface.",
			"The feta is still in liftable chunks with slumped, glossy shoulders. Nothing has dissolved; the tomato around it is smooth and red, not pink and grainy.",
			"The shrimp are loose C-curls, opaque through the back, tails bright. They finished under the lid, so none has tightened into a ring.",
			"The ouzo reads as a thread of anise behind the tomato with no alcohol sting at the back of the throat. Taste the sauce with a crumb of feta on the spoon rather than without: the pan should land on the right side of salty once the cheese is in, and never before it."
		],
		fault: "A thin, weeping pan, because the tomatoes went in short of reduced. The shrimp liquor and the lid's condensation finish the job, the feta floats instead of nestling, and the bread comes away wet rather than loaded."
	},

	// ── 4. The Braise ────────────────────────────────────────────────
	{
		slug: "boeuf-bourguignon",
		marks: [
			"The sauce is glossy and near-black red, thick enough to coat the back of a spoon and hold a parted line, with no orange fat standing on the surface and no thin purple liquid at the pot's edge.",
			"A cube lifted out shows a dark browned exterior rather than pale grey, splits under the side of a fork with no sawing, and still holds its corners. Meat collapsed to threads in the pot went past the mark.",
			"Cut one open: moist and uniform to the centre, with no dry grey ring of squeezed fibre inside a tender exterior.",
			"Pearl onions are whole with their layers intact and the mushrooms are firm at the centre; bite one of each and it still tastes of itself rather than only of sauce.",
			"The wine reads as depth, not acid: round at the finish, no tannic scrape on the teeth. Salt lands square with the sauce at its final thickness, with no flat middle and no hard salty edge from a pot seasoned at the strength it had an hour earlier."
		],
		fault: "Dry, stringy beef inside a good sauce, because the pot ran at a boil instead of a tick. The fibres wrung themselves out long before the collagen melted, so the meat shreds under the fork and still eats like rope."
	},
	{
		slug: "coq-au-vin",
		marks: [
			"The sauce is opaque brown-red, coats a spoon, and still shines at the table. A mounted sauce gone matte was boiled after the butter went in.",
			"Each thigh comes out of the pot in one piece with its skin still attached and stained wine-dark, not sloughing off as a grey rag. Nobody should expect crisp skin after an hour in liquid, but it should be whole and on the meat.",
			"The meat gives at the fork but stays on the piece; pulled apart, it is wet through, not dry-shredding at the outer edge.",
			"Lardons still have bite and the pearl onions hold their shape. Neither has gone waterlogged and grey in an hour of wine.",
			"No boozy sting: the wine tastes cooked through, with no alcohol heat at the back of the throat and no sharpness on the front of the tongue."
		],
		fault: "Dry chicken in an excellent sauce, because the thighs sat in the pot while it reduced. Done at fifty minutes and held to eighty for the sake of the gloss, which is a trade nobody at the table agreed to."
	},
	{
		slug: "ragu-alla-bolognese",
		marks: [
			"The finished colour is a dull brick-brown, not red. Still red at three hours means the paste was never cooked out or the pot never went long enough.",
			"Fat has risen to a clear orange film across the top and stirs back in without separating again. Tilt the pan: solids and liquid move together, with no water running ahead.",
			"A grain of meat crushes to nothing between finger and thumb. Springy pellets mean the simmer was a boil.",
			"No white flecks or curdled grain anywhere. The milk has gone invisible into the sauce, which is the hard mark to hit when the wine went in ahead of it.",
			"Tossed with tagliatelle and a splash of pasta water, the sauce clings the length of each ribbon and the bowl bottom stays clean."
		],
		fault: "A bitter, ashy line under everything, because the pot was left to catch on the bottom between top-ups and the catch got stirred back in. The ragù still looks right, only darker than it should be, so the mistake is usually found on the tongue rather than in the pan."
	},
	{
		slug: "jamaican-oxtail-stew",
		marks: [
			"The gravy is opaque mahogany with a shine, and carries no black specks of carbon from the sugar.",
			"It hangs off the ladle before it drops and sheets the back of a spoon; a spoon through the surface comes up with gravy, not oil, and no orange fat layer floats on top.",
			"Taste it: the caramel reads deep and faintly bittersweet under the allspice and thyme, with no acrid catch at the back of the throat, and the salt sits right at the gravy's reduced strength. An overnight cure plus soy plus three hours of reduction is how this pot goes over.",
			"Meat leaves the bone under light pressure from a spoon but arrives on the plate in pieces rather than as a pile of shreds, and the bones come out clean with marrow soft enough to draw.",
			"Butter beans are whole and unbroken, and a spinner torn in half shows cooked dough to the middle with no chalky raw flour core."
		],
		fault: "The whole pot tastes of ash, because the sugar was taken past mahogany to black in the first minute. The gravy still looks correct, which is why the mistake usually gets found at the table."
	},
	{
		slug: "birria-de-res-con-consome",
		marks: [
			"In the cup, a distinct red-orange fat cap sits on a deep russet broth. Grey fat means the chiles gave up nothing.",
			"The consomé is smooth on the tongue, with no chile-skin fragments and no grit settling in the bottom of the cup.",
			"The meat falls apart under a single fork with no pull, and a shred pulled open is wet through rather than dry and cottony at the core. Shredded back into the pot it goes red throughout, and that colour comes from the tossing, not from waiting for a marinade to reach the middle of a chunk.",
			"A dipped and griddled tortilla is stained edge to edge, crisp on both faces, and folds without cracking along the crease; torn open, the cheese pulls in strings.",
			"Taste the consomé from a cup rather than off a spoon at the pot: it should be seasoned to be drunk on its own. Lime adds lift to it and should never be needed to rescue it."
		],
		fault: "Burnt-coffee bitterness through the whole pot, because the chiles went a few seconds past fragrant on the comal and blistered black. Three hours of braising deepens that bitterness rather than burying it, and neither salt nor lime lifts it out."
	},

	// ── 5. Bread & Fermentation ──────────────────────────────────────
	{
		slug: "rosemary-focaccia",
		marks: [
			"Oil still stands in the craters at the pass and the top is an even deep gold; the flaky salt has survived as separate crystals that crunch, and the rosemary is toasted olive-green and still smells of rosemary when you lean over the pan, not blackened to ash.",
			"The slab is level: no more than a finger's width between the high points and the dimple floors, and no single dome risen across the middle.",
			"Lift a corner with a spatula. The base releases clean, is fried gold, and rattles on the pan; no dough sticks and there is no pale wet patch.",
			"The cut face stands about 3cm from a 20x30cm pan, with holes of many sizes running right to the edges; the crumb is glossy and springs back, and there is no dense seam along the bottom.",
			"Eat a corner plain. It is seasoned all the way through, not just on the salted top, and the olive oil reads as flavour — green and peppery — not as grease left on the fingers."
		],
		fault: "The pan rise is given the printed hour rather than the state: in a cool kitchen the dough is still sluggish and short of the corners when it goes in, so it bakes tight and low, the dimples close over during the spring, and the crumb comes out uniform and bready instead of open."
	},
	{
		slug: "pizza-margherita",
		marks: [
			"The rim has risen to roughly a thumb's width and is brown-gold with scattered darker blisters across it. A home oven will not give Naples' full leopard char in six to eight minutes; what you do not accept is a flat, uniformly tan rim with no blistering anywhere — that is a steel that never got hot enough.",
			"A slice held by the rim tips but does not fold back on itself; the underside is spotted brown through the dry flour, with no raw white centre.",
			"The toppings are sparse enough to read as separate things: bare dough visible between the pieces of mozzarella, tomato a thin skim rather than a lid. The centre is dry when it lands — no standing water, no ring of whey around the cheese.",
			"Torn open, the rim is glossy and open with holes running up into the crust; a tight, even crumb in the rim means it was pressed flat during the stretch.",
			"The basil is bright green and merely wilted, never blackened or frazzled, and the mozzarella has just begun to spot and blister rather than browning into a sheet."
		],
		fault: "The ball is stretched cold and tight straight from the fridge before it has relaxed: it fights back, springs closed at the rim and thins to a tear at the centre, and it bakes with a pale, springy, undersized cornicione and a bare patch of scorched sauce where the hole opened."
	},
	{
		slug: "country-sourdough-loaf",
		marks: [
			"The score has opened and lifted a raised ear, and the loaf has burst nowhere else — no blowout at the side, no split creeping around the base. It went up where it was told, not out.",
			"The crust is deep mahogany over the whole dome and down the sides with no pale, soft band around the foot; the opened cut face may read lighter but must be dry and set, never doughy. Cooled, the crust is rigid under a press and the base sounds hollow under a knock.",
			"On the board the loaf stands at least half as tall as it is wide, shoulders rounded, not spread to a disc.",
			"The crumb is irregular with glossy hole walls from top to bottom and no dense stripe along the base; a finger press springs back and leaves no dent or tack.",
			"It tastes of wheat first with a clean, faint sourness behind it and the salt clearly present. A sharp vinegar bite, or no acidity at all under a bland crumb, means the retard was mistimed rather than the bake."
		],
		fault: "Bulk runs long in a warm kitchen and the dough is already spent by shaping: it will not hold tension, flows out flat when turned from the banneton, the score stays shut instead of lifting, and the loaf bakes wide and pale-footed with a fine, even crumb and a tacky base."
	},
	{
		slug: "baguette-de-tradition",
		marks: [
			"Three to five slashes have each raised a distinct ear, overlapping by about a third, so they read as one continuous seam down the loaf rather than a ladder of separate rungs.",
			"The crust is thin and russet-gold with a faint sheen rather than a matte, floury dullness; the loaf crackles audibly on the rack as it cools, and squeezed it cracks and sheds shards onto the board.",
			"The body is straight and even in diameter with tapered points, and the underside seam is closed — no blowout on the flank or the base.",
			"Each loaf weighs roughly 230–250g baked and feels light for its size; a heavy loaf for its length means it went in underproofed or came out short of colour.",
			"The crumb is cream rather than white, irregular, with glossy hole walls. A cottony, chalk-white crumb means the poolish or the bulk was cut short."
		],
		fault: "The log is rolled out to length before any tension has been built into the shape: the seam never seals and the skin stays slack, so the loaf spreads on the couche, and in the oven it blows open along the bottom or one flank instead of at the scores."
	},

	// ── 6. Pastry Fundamentals ───────────────────────────────────────
	{
		slug: "crepes",
		marks: [
			"The cooked face is lace-mottled — irregular brown blotches over pale gold; the second side is barely coloured and matte, and that side faces in.",
			"The crêpe is a full circle out to the pan's edge and even across it, under 2mm and translucent when held to the light, with no thick lip where the batter stalled.",
			"It folds into quarters without cracking: the lacy edge is crisp, the body supple, never leathery.",
			"Stacked crêpes peel apart one at a time without fusing or tearing, and chew soft with no rubber.",
			"The batch yields at least a dozen from a 24cm pan. Eight or nine fat ones means they were poured thick, whatever they look like individually."
		],
		fault: "The batter keeps thickening on the bench while the first ones cook and is never loosened back to thin cream: the later crêpes stop running to the edge, set thick and matte, chew like pancakes and fold into a wedge instead of lying flat."
	},
	{
		slug: "creme-brulee",
		marks: [
			"The sugar is one unbroken amber sheet edge to edge, right up to the ramekin wall: no black scorched spots, no white grains left unmelted.",
			"The back of a spoon breaks it in a single crack and the shards come away large; the sugar layer is under 2mm.",
			"Nudged at the end of the bake, the custard moves as one slow mass under a set surface — no loose ripple or liquid slack at the centre, and no ramekin that has stopped moving altogether. Chilled, it is set edge to edge with nothing sloshing.",
			"The first spoonful leaves a clean-walled trench that holds its shape, with no watery pool collecting in it and no grain or bubbles in the custard.",
			"The custard is still fridge-cold to the spoon while the caramel over it is warm; if both are the same temperature, it was torched too early."
		],
		fault: "It is baked to firm instead of to the wobble — held in until nothing moves at all, so carryover pushes it past the set: the custard puffs, tightens grainy at the edges and weeps a ring of watery whey that pools in the first spoonful."
	},
	{
		slug: "panna-cotta",
		marks: [
			"It unmolds in one piece with sharp, defined edges top and bottom and smooth sides — no drag marks, no torn skin, no collapsed shoulder.",
			"It stands ten minutes at room temperature without slumping or throwing off liquid: the loose end of the set is a shiver, not a spread.",
			"The spoon goes through with no resistance and no snap, and the cut wall sags gently rather than standing square.",
			"It melts at body heat and is gone: nothing left to chew, no rubbery skin to work through, no film on the palate.",
			"Vanilla seeds are spread through the whole cross-section rather than banded at the top, and the cut face is one even ivory — no paler, waxier layer along the plate side."
		],
		fault: "It is poured hot and left undisturbed to set, so it separates as it chills: the seeds sink to what becomes the top and the fat rises to what becomes the plate side, leaving a pale waxy layer there that coats the mouth before the cream ever arrives."
	},
	{
		slug: "tarte-au-citron",
		marks: [
			"The surface is mirror-flat and one even deep yellow: no bubbles risen through it, no crazed or wrinkled skin, no browned rim where the curd met the pastry.",
			"Lift a slice on the knife: the base carries its own weight without drooping, and the underside is an even biscuit brown right to the centre with no pale, damp patch.",
			"A hot knife leaves a clean vertical cut face, glossy and square, and it has not crept or slumped after five minutes on the plate.",
			"The curd is silk on the tongue — no grain, no thread of cooked egg, no specks of zest caught in it — and the cut face is glossy rather than dull and matte.",
			"Sour arrives before sweet and the swallow makes the mouth water. If the sugar lands first, it does not go out."
		],
		fault: "The curd is pushed past 82°C, or cooked over direct heat instead of the bain-marie: it scrambles at the pan wall, and even strained it sets dull and grainy and weeps a thin syrup onto the surface overnight."
	},
	{
		slug: "profiteroles-pate-a-choux-master",
		marks: [
			"Before the oven: the batter falls from the spoon in a slow V rather than a blob or a ribbon, and each piped mound holds a defined dome that settles under a wet finger without spreading toward its neighbour.",
			"Each puff is round and roughly double its piped height, with no baked-on peak and no flat sunken side; the tray reads as one size.",
			"Colour is even gold-brown over the dome and carries down to the crease where it meets the base — a blond, soft-looking waist there means it came out early.",
			"Ten minutes on the rack and nothing has sunk or gone soft: pressed at the side the wall resists, then cracks. Split one and it is a single hollow cavity with a few wisps of webbing, walls dry to the touch, no wet dough sitting in the base.",
			"The ganache coats the back of a spoon and drapes over the stack in one glossy sheet; two minutes under it, the shells still crack."
		],
		fault: "They come out at the 25-minute mark without the low dry-out leg and are left unpierced: the walls are still damp inside, their own trapped steam soaks them on the rack, and within ten minutes crisp shells have gone to chewy leather that turns to sponge under the ganache."
	},

	// ── 7. Fire & Smoke ──────────────────────────────────────────────
	{
		slug: "jerk-chicken",
		marks: [
			"Skin is burnished dark mahogany with char confined to the slash edges and the raised ridges; the flats read brown, and no soft yellow fat is still sitting under the skin anywhere on the quarter.",
			"The slashes have opened and stayed open with paste visible sitting in them, and the meat lining each cut is stained the same rust-brown all the way down to the bone, with no pale ring under the surface.",
			"Thigh joint reads 75C, the drumstick twists free of the socket in one turn, and juice at the bone runs clear.",
			"The cleaver passes through each bone in a single strike, leaving a clean flat face: no splinters driven into the meat, no piece needing a second blow.",
			"Taste a piece of meat from inside a slash rather than the skin: it carries allspice and pimento smoke on its own, and nothing on the quarter tastes of scorched sugar or burnt soy."
		],
		fault: "Coals too hot with the lid up, so brown sugar and soy carbonize into a bitter black shell within twenty minutes while the joint is still bloody at the bone; the plate reads scorched and raw at once."
	},
	{
		slug: "huli-huli-chicken",
		marks: [
			"The lacquer is even and glossy over the whole piece, dark amber to mahogany, thick enough to hold a fingernail track, with no blistered black patches on the thin edges and no beads of carbon in the skin folds.",
			"The glaze is set and tacky rather than wet: a rested piece leaves no sauce puddle on the board after a minute, and the coating stays put when the piece is turned.",
			"Lift the skin at the edge of a thigh: the fat beneath has rendered away and the skin lies tight on the meat, not floating on a soft white layer.",
			"Thigh reads 75C at the bone, juices run clear, and the meat beside the bone shows no translucent pink.",
			"The last coat has had fire time on it: no thin slick of uncooked sauce anywhere on the piece, no raw garlic or ketchup edge in the taste, and the sweetness reads caramelized rather than stirred in."
		],
		fault: "Left too long between turns, so the pineapple sugars run past lacquer into carbon on the down face while the up face sits pale and slack: one side black and bitter, the other barely coloured."
	},
	{
		slug: "memphis-dry-rub-ribs",
		marks: [
			"The rack is matte and dry, brick red to mahogany; a fingertip drawn across it lifts spice dust rather than glaze, and nothing tacky transfers to the board.",
			"Lifted with tongs a third of the way along, the rack bends toward 90 degrees and the surface cracks open between the bones without the meat tearing free.",
			"Turn the rack over: no papery membrane is left anywhere on the bone side, and the fat between the bones has rendered soft rather than sitting in rubbery seams.",
			"A bite pulls meat cleanly away leaving a clean bite mark, and the bone stays in the rack; bones that slide out grey and bare are past the standard.",
			"The final dusting reads as raw spice on the lips, paprika and celery salt distinct from the cooked bark beneath, and no sauce has touched the meat."
		],
		fault: "Mopped like a sauce rather than a wetting, heavy and often, so the vinegar dissolves the rub into a red slurry that never sets: the rack comes off streaked and sticky with most of the bark in the drip pan."
	},
	{
		slug: "tacos-al-pastor-home-trompo",
		marks: [
			"Shaves come off in thin strips 2 to 3mm across, ragged and short, never cubes or slabs.",
			"The shaved meat is brick red from achiote through the full half-centimetre of each sheet, not stained on the outer face with pale pork underneath.",
			"Every spoonful holds two textures: lacquered crisp edges that crackle between the fingers against a soft interior, and no piece is soft the whole way through. Uniform tenderness is a failed pass.",
			"The pineapple wedge is charred at the edge, still holds its shape when lifted, and releases juice when bitten; it is a thin wedge on each taco, not a dice stirred through.",
			"The tortilla is warm and pliable enough to fold twice without cracking, and a 40 to 50g portion rides in it held in one hand without soaking through or spilling out the fold."
		],
		fault: "Seared and chopped and sent straight out, the meat never returning to the hot plancha, so there are no crisp edges anywhere and the taco tastes of marinated pork instead of al pastor."
	},
	{
		slug: "central-texas-smoked-brisket",
		marks: [
			"Bark is uniform near-black mahogany and stays put: a thumb drawn across it neither smears nor lifts, and the coarse pepper is still visible as grain in the crust.",
			"Resistance to the probe is equal at three points along the flat, thick end included, at 95C internal; one soft spot and two firm ones means it goes back on.",
			"The fat cap has rendered translucent and spreadable, and the seam fat inside the point gives under finger pressure with no hard white core left in it.",
			"Slices are pencil-width, about 6mm, cut across the grain on the flat and again after the point is turned 90 degrees; a slice held at one end drapes over a finger, parts under a gentle tug, and does not shred under its own weight or spring back.",
			"A slice from the thin end of the flat, not the point, beads moisture immediately when squeezed between two fingers, and the board carries beads and smears rather than a spreading pool; the crust tastes of pepper first with the salt behind it, and no slice needs sauce."
		],
		fault: "Panic at the stall and the pit pushed to 150C, so the brisket hits 95C hours early with the collagen only half converted: the flat slices firm and dry, the bark tastes scorched rather than smoked, and no rest recovers it."
	},

	// ── 8. The Wok & High Heat ───────────────────────────────────────
	{
		slug: "pad-krapow-moo",
		marks: [
			"The pork is in separate browned crumbles with crisp edges and dark caught faces, not a uniform pale mince, and no grey liquid sits in the bottom of the wok.",
			"The sauce is a glaze clinging to the meat: tilt the plate and nothing runs from under the pork.",
			"Holy basil is wilted but whole-leafed and still green, no leaf blackened or dissolved into the sauce, leaves show in every spoonful rather than as scattered flecks, and its clove-pepper smell rises off the plate.",
			"The fried egg has brittle brown lace at the rim that shatters under a spoon, and the yolk breaks and runs when pierced.",
			"Fish and oyster salt lead, sugar is barely traceable, and the garlic tastes toasted rather than raw or acrid."
		],
		fault: "Cold pork tipped in all at once, dropping the wok below searing heat, so the meat poaches in the water it releases and the sauce joins that water into a grey-brown broth the rice drinks."
	},
	{
		slug: "bulgogi",
		marks: [
			"The slices are 1 to 2mm, thin enough to pass light before cooking, and they lie on the plate as loose separate ribbons rather than a fused clump.",
			"Each ribbon shows dark caramelized edges against a lighter centre, and the last batch is the same colour as the first: anything uniformly grey-brown never touched hot metal, and anything speckled with black flecks picked up burnt sugar left in the pan.",
			"The pan finishes each batch nearly dry, a spoonful of syrupy drippings and no pool of simmering marinade.",
			"Onion and mushroom come out browned and collapsed but still holding shape, tasting of the drippings rather than of raw marinade.",
			"A closed ssam is bitten through in one go without the meat dragging out of the leaf, the slices parting under the teeth rather than needing to be chewed apart."
		],
		fault: "The bowl tipped into the pan, marinade and all, so the soy and sugar liquid boils and the beef poaches grey in it, leaving sweet sticky ribbons with no caramelization anywhere."
	},
	{
		slug: "char-kway-teow",
		marks: [
			"Noodles lift as individual strands, glossy and separate, with no torn fragments and no mat of stuck-together ribbons.",
			"Colour is deliberately uneven: dark soy stains some strands more than others and scattered noodles carry black-brown char blisters. Even mahogany throughout means it was stirred rather than charred.",
			"Held at arm's length the plate smells of scorch and smoke before it smells of soy, and that smell is still on it when it reaches the table.",
			"Egg is in ragged folds gripping the noodles, set but soft, with no separate scrambled lumps and no wet gloss of raw white.",
			"Bean sprouts snap between the teeth, the chives are bright green, the shrimp are curled once and just opaque, and the plate rim carries no pooled oil or sauce."
		],
		fault: "Fridge-cold noodles pulled apart in a hurry, so the strands break before they meet the lard and the dish arrives as short stubs bound in leached starch, however hot the wok was."
	},
	{
		slug: "rau-muong-xao-toi",
		marks: [
			"Leaves are dark and glossy green with none gone olive or grey, and the split stems have kept their pale jade colour.",
			"Stems snap under the tooth and the leaves are tender in the same mouthful: no raw crunch at the thick ends, no collapse in the leaves.",
			"The bowl is nearly dry, under a tablespoon of liquid after standing a minute, and the greens are coated in oil rather than sitting in a puddle.",
			"The smashed cloves have gone gold and soft through, sweet rather than raw-sharp, with none scorched black or bitter, and one turns up in most mouthfuls.",
			"No raw fish-sauce smell comes off the bowl: it reads as savoury salt rather than as fish, and no sweetness is identifiable as sugar."
		],
		fault: "The greens go in still wet from the wash, the water crashes the wok temperature, and the bunch simmers in its own steam: limp olive leaves in a grey puddle, tasting faintly metallic."
	},

	// ── 9. Seafood Mastery ───────────────────────────────────────────
	{
		slug: "cantonese-steamed-fish",
		marks: [
			"Before it goes near the steamer: eyes clear and domed rather than sunken and cloudy, gills wet and red, the flesh springing back when pressed, and the smell nothing but clean seawater. This is the one fault that cannot be corrected downstream, so it is checked first and out loud.",
			"A chopstick into the thickest part behind the head meets no resistance, and the flesh parts from the backbone in whole sheets. At the bone it reads just-set white, faintly translucent, never chalky and never pink.",
			"The steaming liquid has been poured off: no grey pool under the fish. The seasoned soy sits clear around it, at a level below the flesh, so the skin stays unglazed.",
			"The aromatics were cooked by the oil, not the steam — ginger julienne curled and translucent at the tips, scallion greens collapsed and shining, and there was an audible crackle at the pour. Slack raw-green shreds sitting in oil mean the oil went on below smoking.",
			"Whole and unbroken on the platter: skin intact from head to tail, no flesh torn where the fish was lifted off the steaming plate, head to the guest of honour. A bite from the middle of the fillet tastes of fish first; the soy registers only when the flesh is dragged through it."
		],
		fault: "It is steamed to the timer instead of to the chopstick and comes out ninety seconds long — the fillet shreds into dry cotton fibre when lifted, and a milky pool of squeezed-out juice spreads under the fish and dilutes the soy."
	},
	{
		slug: "linguine-alle-vongole",
		marks: [
			"Garlic slices are pale ivory in the sauce and still hold their shape; tan flecks mean the base was browned before the wine arrived.",
			"Every shell on the plate is fully open — a shut clam is a fault, not a garnish — half in shell and half shucked through the pasta, and the meats are still plump enough to fill their shells rather than shrunk to grey nubs from sitting in the pan through the reduction.",
			"The sauce is emulsified, not oiled: it wears the strands with a cloudy gloss, and tilting the bowl leaves a clinging film rather than a clear ring of oil at the rim.",
			"A strand bitten through shows a hairline of firmer paste at its centre and no white chalk core — the last three minutes happened in the pan, not the water.",
			"Nothing grits against the teeth in the final spoonful — proof the clams were purged and the liquor strained — and the bowl needs no salt at the table, because the salt came from the liquor."
		],
		fault: "A broken or watery sauce, from finishing the pasta in the water and pouring the clam liquor over it at the end rather than tossing the two together over heat — the oil separates into a slick at the rim and the pasta sits in clam water instead of wearing it."
	},
	{
		slug: "miso-glazed-black-cod",
		marks: [
			"Lacquered mahogany across the surface with genuine black at the corners and the raised edges; a flat even gold means it never sat close enough to the element, or the cure was too short to give the sugars anything to work with.",
			"A thin skin of glaze, wiped and not rinsed: no clods of scraped miso baked hard onto the fillet, and equally no washed-looking bare patches that took no colour at all.",
			"The flesh breaks into large petals a centimetre thick under the edge of a spoon, the fillet lying flat rather than buckled, with no white curd of albumin squeezed out along the seams.",
			"White and glistening to the centre with the fat visibly running, and no dry chalky seam sitting under the crust.",
			"A bite taken from the middle, with no glaze on it, still tastes salted and faintly sweet — an unseasoned centre means the fish went in at 24 hours, not 48 to 72."
		],
		fault: "Black before it is cooked, because the excess marinade was left on and the fillet sat too close to the element — bitter carbon on top, cool untransformed flesh under it."
	},
	{
		slug: "whole-grilled-fish-with-ladolemono",
		marks: [
			"Skin whole from gill to tail, striped with dark bars, and the grate clean when the fish comes off — nothing of the fish left welded to the bars.",
			"The dorsal fin pulls out with no resistance before the fish leaves the coals, and the reading holds up when it is opened: at the shoulder the flesh is opaque and slips off the pin bones, and the line along the spine has set from red to pale grey.",
			"The top fillet lifts away in one piece and the backbone comes out whole, leaving the underside fillet intact.",
			"The ladolemono reaches the plate as one liquid: cloudy, loose enough to pour, thick enough to coat, and spooned over within a minute of the whisk. Clear oil floating on a lemon layer means it was made ahead and sat.",
			"A piece of fish eaten before any sauce touches it is already seasoned to the middle, skin and cavity both — the ladolemono is bringing acid and oil, not the salt."
		],
		fault: "Turned before it let go: half the skin stays on the grate, the flank tears open, and the exposed flesh dries over the coals through the second half of the cook."
	},
	{
		slug: "calamari-fritti",
		marks: [
			"The oil reads a true 190°C as the squid goes in and climbs back to it before the next batch; a batch that drags it below about 170°C is already lost and no amount of extra time will recover it.",
			"Pale straw gold, never tan. The dredge sits as a lacy film that still shows the shape of the ring beneath it, with no shaggy clumps of loose flour fried alongside.",
			"Rings hold an open curl and the tentacles are frilled and separate; a fused clump on the rack means the batch went in crowded.",
			"A ring parts in a single bite with no rebound against the teeth, the flesh inside white and moist rather than chalky.",
			"Undersides as crisp as tops with a dry plate under the pile, salt clinging to the crust and none loose in the bottom of the bowl, and the plate on the table within five minutes of the fryer — nothing waiting under a lamp."
		],
		fault: "The oil fell below 190°C because too much went in at once — the coating drinks fat instead of setting, and the squid stews long enough in the lukewarm bath to tighten, so the same bite is both greasy and rubbery."
	},

	// ── 10. The Restaurateur's Capstone ───────────────────────────────
	{
		slug: "sauce-espagnole-and-demi-glace",
		marks: [
			"The roux before the stock goes in: café-au-lait to hazelnut brown, smelling of toasted nuts, with no black specks and no acrid catch at the back of the nose. Burnt roux cannot be skimmed, strained or reduced out afterwards, so it is stopped here.",
			"A ladle drawn across the surface comes up dry: no fat eyes, no grey scum, and no ring of it on the pot wall stirred back in.",
			"Passed through fine mesh and smooth on the lip — no specks of mirepoix, no herb, no grain from the roux.",
			"It coats the back of a spoon and holds a finger-drawn line without closing, and the film on the spoon reads deep translucent brown against the light rather than grey or muddy. Chilled demi-glace sets firm enough to cut into cubes that keep their edges.",
			"It tastes of roasted bone with no chalk of raw flour anywhere in it, and it is deliberately short of salt — seasoned to the palate now, it becomes brine when the demi is reduced by half."
		],
		fault: "Skimming was let go in the first half hour, so fat and albumin were reduced back into the sauce — it comes out cloudy, greasy on the lip, and tasting of scorched flour instead of roasted bone."
	},
	{
		slug: "dry-brined-roast-turkey-with-real-gravy",
		marks: [
			"Skin uniformly deep brown, taut and dry enough to click under a fingernail, unbroken over the breast where the herb butter went under.",
			"The bird came out on two thermometer readings, not a time: 65°C at the deepest part of the breast and 74°C at the thigh joint, the probe kept off the bone.",
			"Carved at a full 45 minutes — a slice weeps at the cut edge and the board stays nearly dry. A flood on the board says the bird was cut early.",
			"Breast slices hold together coming off the knife and read moist white through their whole thickness; at the thigh the meat pulls easily from the bone and the juices there run clear rather than pink.",
			"A slice of breast eaten alone, no gravy, is seasoned to its centre. The gravy is strained, coats a spoon, and carries no fat slick on top and no floury edge underneath."
		],
		fault: "The bird is timed rather than probed and the breast rides up to thigh temperature — white meat comes off the knife in dry crumbling slabs, and the gravy ends up doing the work the roast was meant to do."
	},
	{
		slug: "salt-baked-whole-fish",
		marks: [
			"Before the salt goes on: skin whole and unbroken, no knife nicks along the flank or at the vent, and the cavity holding lemon and herbs only. Not one grain of salt goes inside the fish.",
			"The dome comes out hard, matte and pale, still sealed to the tray, with no split that steamed open and no browned damp patch where the pack ran thin — and it breaks into slabs under a spoon handle, the skin lifting away stuck to the crust and leaving the flesh clean, unmarked and carrying no salt grains.",
			"A skewer into the thickest part, held five seconds, comes out warm on the lip: cold means it goes back in before the crust is touched, hot means it has gone past.",
			"The tail end is as moist as the shoulder — evenness is the whole claim of the crust, and a dry tail says the pack was thin at that end.",
			"Taste at the belly seam first: that is where salt gets in if the skin was nicked, and one blown bite there condemns the fish."
		],
		fault: "Salt packed into the cavity as well as over the fish — it cures straight through the thin belly wall while the crust is doing its work, and the fillet arrives brined rather than steamed."
	},
	{
		slug: "baked-alaska",
		marks: [
			"The go/no-go at the oven door: the meringue held a straight peak off the whisk and the bowl was cool to the palm before any of it went on, and the assembled dome is hard to a knuckle-rap everywhere, base included. A dome that gives anywhere goes back to the freezer, not into the oven.",
			"Sealed all round: at least 2cm of meringue over the dome, covering the cake edge and meeting the tray, with no window of ice cream showing and no crack at the base.",
			"Peaks bronzed with the valleys still cream-white after 3 to 4 minutes; an evenly tanned dome means it stayed in and the heat reached the ice cream.",
			"Cut with a hot knife, the face shows three bands with hard borders: hot toasted shell, ice cream holding its own edge, cake beneath. A melted ring under the meringue and the oven won.",
			"No beads of syrup on the meringue and no liquid on the plate a minute after service, and the cake base is still dry enough to lift the slice on a spatula."
		],
		fault: "The meringue goes onto ice cream that has softened at the surface, or goes on still warm from the syrup — the two meet as slush, the dome slides and the seal splits at the base, and the slice arrives as cream soup under browned foam."
	},
];

/** Marks per dish. Two is not a standard; six is a recipe. */
export const MIN_MARKS = 3;
export const MAX_MARKS = 5;
