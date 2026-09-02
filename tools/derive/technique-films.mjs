/**
 * technique-films.mjs: the chosen film for a technique, and what to watch for.
 *
 * ## Why this file exists
 *
 * A technique page offers the reader a YouTube search. That is a promise to go
 * and look, not a lesson. Five techniques inherited a chosen film from the
 * sealed original, and the other hundred did not, so the Table taught a hundred
 * skills by handing over a search box.
 *
 * The films cannot live in raw/TECH.json: that file is proved WORD-for-word
 * against the archived original by verify:data (byte-identity ended with the em
 * dash sweep), and adding a URL to it would break the proof just the same. They cannot live in SUPPLEMENT either, because fullTechTable
 * merges by label and keeps the first entry's fields, so a film added there
 * would be silently dropped for any technique the original already names. So
 * they live here, keyed by slug, and are attached to the table after the merge.
 *
 * ## Every id in this file has been checked against YouTube
 *
 * Not "looks plausible": checked. tools/check-films.mjs asks YouTube's oEmbed
 * endpoint for each id and compares the real title and channel to the ones
 * recorded here. A dead id fails. An id that resolves to some other video fails.
 * This matters because these were proposed from memory, and a remembered
 * eleven-character id that is one character wrong is not a broken link, it is a
 * confident link to a stranger's holiday video.
 *
 * A technique with no entry here keeps its search link, which is the behaviour
 * that shipped for a year and is perfectly good. Fewer, true entries beat a
 * full table of guesses.
 *
 * ## Why the title and channel are stored and not just the id
 *
 * Two reasons, and the first is the reader's. "A canon film, verified" tells
 * them nothing about whether it is worth ten minutes; "Jacques Pepin's Chicken
 * Galantine, Sur La Table" tells them exactly what they are about to watch and
 * who is teaching. The second is the checker's: without a recorded title there
 * is nothing to compare a live lookup against, and rot would only ever be
 * visible as a 404, never as a re-uploaded and repurposed id.
 *
 *   node tools/check-films.mjs      confirm every film still plays, and is still
 *                                   the film described here
 *
 * `watchFor` is the part a search box can never give: the specific moment in
 * the film where the skill actually happens.
 */

/**
 * @typedef {object} TechniqueFilm
 * @property {string} slug   the technique slug, as slugify() produces it
 * @property {string} id     the eleven character YouTube id
 * @property {string} title  the real title, as YouTube reports it
 * @property {string} channel the real channel, as YouTube reports it
 * @property {number} [start] seconds in, when the useful part is buried
 * @property {string} watchFor what the cook should be looking at, and why
 */

/** @type {TechniqueFilm[]} */
export const TECHNIQUE_FILMS = [
	/* ── inherited from the original's curation ───────────────────────────────
	   These five ids were already in raw/TECH.json as bare URLs. They are
	   repeated here with their real titles so that every film on the site is
	   described the same way, and so the checker has something to verify them
	   against. The ids are unchanged. */
	{
		slug: 'lamination',
		id: 'vpwY3nmLLaA',
		title: 'Make Perfect Croissants With Claire Saffitz | Try This at Home | NYT Cooking',
		channel: 'NYT Cooking',
		watchFor:
			'The butter block staying one sheet through every turn. The moment it cracks or ' +
			'melts into the dough is the moment the layers are lost, and she shows both.'
	},
	{
		slug: 'sourdough-starter',
		id: 'sTAiDki7AQA',
		title: 'The Ultimate Sourdough Starter Guide',
		channel: 'Joshua Weissman',
		watchFor:
			'What a starter looks like on the days it seems to be failing. The false rise in ' +
			'the first week fools most people into throwing away a healthy culture.'
	},
	{
		slug: 'wok-technique',
		id: 'n10xBmqehik',
		title: 'How to Make Any Fried Rice - Three Flavors and Recipes',
		channel: 'Chinese Cooking Demystified',
		watchFor:
			'The pan, not the rice. Listen for the moment the sound changes as the wok is ' +
			'brought back to heat between additions: that pause is the whole technique.'
	},
	{
		slug: 'low-and-slow-smoking',
		id: 'VmTzdMHu5KU',
		title: 'BBQ with Franklin: The Brisket',
		channel: 'BBQwithFranklin',
		watchFor:
			'How much fat he leaves on and where. The trim decides the finished brisket long ' +
			'before the fire does, and it is the step most cooks rush.'
	},
	{
		slug: 'butchery-basics',
		id: 'i_ZkAHCR1D0',
		title: "Jacques Pépin's Chicken Galantine",
		channel: 'Sur La Table',
		watchFor:
			'The knife tip riding the bone the whole way. He is not cutting the bird, he is ' +
			'following its skeleton, and the blade almost never leaves the surface.'
	},

	/* ── chosen in the film pass, every id checked against YouTube ────────────
	   Each of these was proposed with a title and a channel, then looked up:
	   the title and channel below are the ones YouTube actually returns, not
	   the ones anybody remembered. node tools/check-films.mjs re-runs that
	   comparison against the live site.

	   Twenty four techniques are deliberately absent and keep their search
	   link. Most are foundations that durable channels bury inside a recipe
	   rather than hold the camera on: sweating aromatics is the largest at 192
	   recipes, and reducing a sauce, mashing, and egg wash are the same story.
	   A search box is an honest answer there. A film that half fits is not.

	   Three proposals were dropped rather than pinned, and are listed so they
	   do not get re-added as oversights:
	     letter-folding-dough      lamination already pins that croissant film
	     griddle-and-plancha-work  tortillas-on-the-comal pins it, and fits better
	     marinating-acid-salt      the film is velveting: starch and alkali, and
	                               the page is about acid, salt and time

	   deep-frying and draining-fried-food share one film on purpose: the two
	   watchFor lines send the reader to different moments of it. */
	{
		slug: 'arepas',
		id: 'M1onLM4nJSg',
		title: 'How to Make Arepas | Easy and Only Three Ingredients!',
		channel: 'Preppy Kitchen',
		watchFor:
			'The dough being rested and then patted between wet palms: the hydration and the ' +
			'smooth crack-free edge are what decide whether it splits open cleanly after ' +
			'griddling.'
	},
	{
		slug: 'asado-fire',
		id: '5NNGX36hfLY',
		title: 'Seven Fires With Francis Mallmann',
		channel: 'Mind of a Chef',
		watchFor:
			'Fire treated as several distinct tools rather than one heat setting: Mallmann lays ' +
			'out the different fires and what each is for, which is the two-zone idea taken to ' +
			'its conclusion and the reason an asado cook builds embers before cooking anything.'
	},
	{
		slug: 'bechamel-the-mother-sauce',
		id: 'X0-YKTKaYAE',
		title: 'Béchamel | Questions Answered, Theory Explained',
		channel: 'French Cooking Academy',
		watchFor:
			'The roux for the two minutes it cooks before any milk goes in, and then watch the ' +
			'sauce thicken all at once near the boil: white roux and the moment of thickening are ' +
			'the two things people get wrong.'
	},
	{
		slug: 'beurre-blanc',
		id: 'JFF9SdLUI4g',
		title: 'How to Make a Beurre Blanc (Butter Sauce) | Chef Jean-Pierre',
		channel: 'Chef Jean-Pierre',
		watchFor:
			'The reduction going almost dry before any butter goes in, then cold butter worked in ' +
			'off aggressive heat: the sauce thickens and takes on gloss, and you can see the ' +
			'point where too much heat would break it.'
	},
	{
		slug: 'biryani-and-dum',
		id: 'aleED1mc5kI',
		title: 'Hyderabadi Chicken Biryani | हैदराबादी चिकन दम बिरयानी | Chicken Dum Biryani | Chef Ranveer Brar',
		channel: 'Chef Ranveer Brar',
		watchFor:
			'The layering and then the seal: dough pressed around the lid so the pot becomes its ' +
			'own pressure vessel, which is what dum actually means.'
	},
	{
		slug: 'blanching-and-shocking',
		id: 'B-0wCOLyUTs',
		title: "Is Blanching Really Necessary? | America's Test Kitchen",
		channel: "America's Test Kitchen",
		watchFor:
			'The side-by-side colour of blanched-and-shocked greens against the unshocked ones, ' +
			'which shows why the ice bath is not optional but the step that fixes the green in ' +
			'place.'
	},
	{
		slug: 'braising',
		id: 't0ORhrvqvRw',
		title: 'The Foolproof Formula for Braising Beef | Techniquely with Lan Lam',
		channel: "America's Test Kitchen",
		watchFor:
			'Lan Lam on why the liquid must never boil and why the pot comes only partway up the ' +
			'meat, which is what turns a braise from a covered simmer into collagen becoming ' +
			'gelatin.'
	},
	{
		slug: 'brining-and-curing',
		id: 'w3rI3KPi_D0',
		title: 'How Dry Brining Works',
		channel: "Meathead's AmazingRibs",
		watchFor:
			'Time-lapse of salt on a steak: the surface first goes wet as salt pulls water out, ' +
			'then the brine is drawn back in, which is the whole argument for dry brining over ' +
			'wet.'
	},
	{
		slug: 'brown-butter',
		id: '4KvqLCKLn2E',
		title: "How to Brown Butter | Today's Special",
		channel: "America's Test Kitchen",
		watchFor:
			'The milk solids at the bottom of the pan, not the fat: the foam subsiding and the ' +
			'specks turning hazelnut is the whole signal, and the pan must come off the heat a ' +
			'shade before it looks right.'
	},
	{
		slug: 'building-an-emulsion',
		id: 'c82pUCXjY2w',
		title: 'Make Homemade Mayonnaise with Master Chef Jacques Pépin',
		channel: 'Jacques Pépin Foundation',
		watchFor:
			'The moment the sauce seizes into thickness: watch how slowly the oil goes in at the ' +
			'start and how the stream can widen once the emulsion has taken, which is the single ' +
			'judgement that separates mayonnaise from a broken puddle of yolk and oil.'
	},
	{
		slug: 'ceviche',
		id: 'C9aiGLIry7g',
		title: 'How to Make Ceviche',
		channel: 'Munchies',
		watchFor:
			'How briefly the fish actually sits in the lime: Gastón Acurio treats long marination ' +
			'as the classic mistake, and you can see the surface turn opaque while the centre ' +
			'stays translucent, which is the texture the dish is aiming at.'
	},
	{
		slug: 'charring-over-open-flame',
		id: 'H-BduziRdTY',
		title: 'Rick Bayless Salsa Essentials: "Chiltomate" Roasted Tomato-Habanero Salsa',
		channel: 'Rick Bayless',
		watchFor:
			'How far he takes the tomato and habanero skins, to blistered and blackened in ' +
			'patches rather than merely softened, which is the char that carries the flavor into ' +
			'the salsa.'
	},
	{
		slug: 'choux-pastry',
		id: 'okmeKRVSlvM',
		title: 'Claire Saffitz Makes Cheese Puffs / Pâte à Choux Part 1 | Dessert Person',
		channel: 'Claire Saffitz x Dessert Person',
		watchFor:
			'The panade being dried out on the stove and then the eggs beaten in one at a time: ' +
			'watch the paste go from split and slick to glossy, and the ribbon test that tells ' +
			'you to stop adding egg, since consistency here decides whether the puff rises hollow ' +
			'or squat.'
	},
	{
		slug: 'churning-ice-cream',
		id: 'MdirPsiHnCA',
		title: 'Ice Cream | Basics with Babish',
		channel: 'Binging with Babish',
		watchFor:
			'The base going into the machine thin and cold and coming out at soft-serve ' +
			'thickness: that change is air being beaten in and ice crystals being kept small by ' +
			'constant agitation.'
	},
	{
		slug: 'churros',
		id: '453mpKHVaBs',
		title: 'How to Make Churros',
		channel: 'Preppy Kitchen',
		watchFor:
			'The star tip and the piping hand: the ridges are structural, giving the surface area ' +
			'that makes churros crisp, and you can see the dough hold its fluting the moment it ' +
			'hits the oil.'
	},
	{
		slug: 'confit',
		id: 'UhwKM3DzT_Q',
		title: 'How To Make Duck Leg Confit at Home (Christmas dinner ideas)',
		channel: 'French Cooking Academy',
		watchFor:
			'The fat never comes near a simmer: watch the surface stay almost still for hours, ' +
			'because confit is poaching in fat at low temperature, not frying, and the bubbles ' +
			'you do see are moisture leaving the meat rather than the fat boiling.'
	},
	{
		slug: 'congee',
		id: 't2SahnNVULA',
		title: "🍲  The Perfect Congee (鷄粥) | Preserving my dad's recipe!",
		channel: 'Made With Lau',
		watchFor:
			'The rice grains collapsing over time from separate grains into a suspension, and the ' +
			'stirring that drives it, which is the whole technique rather than any ingredient in ' +
			'the pot.'
	},
	{
		slug: 'creaming-butter-and-sugar',
		id: 'ThJi3p2As6M',
		title: 'How to Cream Butter and Sugar | Food Network',
		channel: 'Food Network',
		watchFor:
			'The colour change in the bowl: butter going from yellow and dense to pale and ' +
			'visibly increased in volume, which is the air you are building before any leavener ' +
			'gets a chance to work.'
	},
	{
		slug: 'crepes',
		id: 'V_okk5pOLp4',
		title: 'Jacques Pépin Makes His Famous Crêpes | American Masters: At Home with Jacques Pépin | PBS',
		channel: 'American Masters PBS',
		watchFor:
			'The wrist: the pour and the swirl are one continuous motion, and the batter has to ' +
			'be thin enough to run to the edge before it sets.'
	},
	{
		slug: 'curing-gravlax',
		id: 'i6_Qmo8HaVY',
		title: "How to make salmon gravadlax | Rick Stein's Cookery School | Rick Stein",
		channel: 'Rick Stein Restaurants',
		watchFor:
			'How completely the salt and sugar cure is packed over the flesh and how much liquid ' +
			'has been drawn out when it is unwrapped: the change from raw to firm, translucent ' +
			'and sliceable is osmosis doing all the work.'
	},
	{
		slug: 'dashi',
		id: 'qIWDxfCHQgs',
		title: 'How to Make Dashi (Recipe) だしの作り方（レシピ）',
		channel: 'Just One Cookbook',
		watchFor:
			'The kombu being lifted out just before the boil and the katsuobushi being allowed to ' +
			'sink rather than stirred, because dashi is defined by restraint and anything harder ' +
			'turns it bitter and cloudy.'
	},
	{
		slug: 'deep-frying',
		id: 'LzK4sC_ZYgc',
		title: 'The Ultimate Way To Deep Fry Anything That Never Fails | Epicurious 101',
		channel: 'Epicurious',
		watchFor:
			'The bubbling around each piece as it enters the oil and how the chef waits for ' +
			'temperature recovery before the next batch, which is the crowding law made visible.'
	},
	{
		slug: 'deglazing-and-pan-sauces',
		id: 'nZxW4n5RyfI',
		title: 'Science: How to Make a Better Pan Sauce (Step #1: Break All the Rules)',
		channel: "America's Test Kitchen",
		watchFor:
			'The fond dissolving off the pan bottom the instant liquid hits it, and then the ' +
			'butter going in: a pan sauce is a fat-in-water emulsion, and this shows both the ' +
			'moment it comes together and the over-reduction that breaks it.'
	},
	{
		slug: 'draining-fried-food-a-rack-never-paper',
		id: 'LzK4sC_ZYgc',
		title: 'The Ultimate Way To Deep Fry Anything That Never Fails | Epicurious 101',
		channel: 'Epicurious',
		watchFor:
			'The whole frying discipline rather than a recipe: heavy pot, clip thermometer, small ' +
			'batches so the oil recovers, and the finished pieces lifted onto a rack where air ' +
			'reaches every side instead of steaming on paper.'
	},
	{
		slug: 'dry-pan-toasting-spices-seeds-and-nuts',
		id: 'hK91vFjf_PU',
		title: 'How to toast spices',
		channel: 'Great British Chefs',
		watchFor:
			'The seeds for the moment they start to jump and darken a shade, which is the cue to ' +
			'tip them out of the pan immediately: residual heat in the metal will carry them from ' +
			'toasted to burnt after the heat is off.'
	},
	{
		slug: 'fermentation',
		id: 'snxb_PSe3Ps',
		title: "Brad Makes Sauerkraut | It's Alive | Bon Appétit",
		channel: 'Bon Appétit',
		watchFor:
			'Cabbage weighed, salted by percentage, then massaged until it releases enough of its ' +
			'own liquid to sit under brine, which is the line between lacto-fermentation and a ' +
			'quick pickle.'
	},
	{
		slug: 'filleting-fish',
		id: 'codtvhRYAUw',
		title: 'How to Fillet a Salmon or Trout | Jamie Oliver',
		channel: 'Jamie Oliver',
		watchFor:
			'The knife staying flat and riding the backbone in long strokes rather than sawing: ' +
			'the fillet you lose is the fillet left on the frame, and the sound of blade on bone ' +
			'is the guide.'
	},
	{
		slug: 'flambe',
		id: 'DyKhvsAPO9I',
		title: 'How To Flambe Safely | 1 Minute Tips | French Guy Cooking',
		channel: 'Jamie Oliver',
		watchFor:
			'The pan being pulled off the heat before the spirit goes in, and where the hands and ' +
			'face are when it lights: the safety sequence is the whole technique.'
	},
	{
		slug: 'folding-keeping-the-air-in',
		id: '7To3giV62rg',
		title: 'How to Fold in Ingredients | Baking Mad',
		channel: 'Silver Spoon',
		watchFor:
			"The spatula cutting down through the centre, sweeping the bowl's floor and turning " +
			'the mass over while the other hand rotates the bowl: it is a flip, never a stir, and ' +
			'the difference is the air you keep.'
	},
	{
		slug: 'fresh-pasta',
		id: 'EnXb1u9UoBU',
		title: 'The Best Way To Make Pasta From Scratch | Epicurious 101',
		channel: 'Epicurious',
		watchFor:
			'The dough changing under the heel of the hand from a shaggy, tearing mass to a ' +
			'smooth elastic one, which is the gluten network forming and the only reliable cue ' +
			'for when to stop kneading.'
	},
	{
		slug: 'frying-the-paste-until-the-oil-splits',
		id: 'fJMAc5oU5_w',
		title: 'How to make Onion Tomato Masala | Sanjeev Kapoor Khazana',
		channel: 'Sanjeev Kapoor Khazana',
		watchFor:
			'The surface of the masala for the moment the fat stops being absorbed and starts ' +
			'pooling and glistening at the edges of the pan, which is the signal that the water ' +
			'has cooked out and the paste is done.'
	},
	{
		slug: 'gnocchi',
		id: '_ZiSsYAWblA',
		title: '95yr old Mirella from Rome makes gnocchi with tomato sauce! | Pasta Grannies',
		channel: 'Pasta Grannies',
		watchFor:
			'How little flour she adds and how briefly she works the dough, because lightness in ' +
			'gnocchi is entirely a matter of stopping early rather than of any trick in the ' +
			'shaping.'
	},
	{
		slug: 'grilling-over-live-coals',
		id: 'V-21tnf6tHk',
		title: 'Setting Up a Two-Zone Charcoal Fire | Weber Grills',
		channel: 'Weber Grills',
		watchFor:
			'The coals being banked to one side and nothing else: the hot side and the empty ' +
			'refuge beside it are the whole technique, and seeing the actual depth of the coal ' +
			'bed is what a diagram cannot teach.'
	},
	{
		slug: 'hand-pulled-noodles',
		id: '6DgITQSonv4',
		title: 'Lanzhou Hand Pulled Noodles (拉面)',
		channel: 'Chinese Cooking Demystified',
		watchFor:
			'The repeated stretch-and-fold against the bench: watch how the dough stops fighting ' +
			'back and starts extending, which is the gluten network being aligned rather than ' +
			'merely developed.'
	},
	{
		slug: 'hollandaise',
		id: 'PS2avsY5G0M',
		title: 'How to Make Hollandaise',
		channel: 'LeCordon Bleu',
		watchFor:
			'The moment butter begins going in against the whisked yolks: the sauce should ' +
			'thicken and turn opaque as droplets disperse, and that visual change is the emulsion ' +
			'forming.'
	},
	{
		slug: 'icing-and-frosting',
		id: 'Pf1bbVIcty8',
		title: 'How to frost cake layers and create a crumb coat',
		channel: 'King Arthur Baking Company',
		watchFor:
			'The crumb coat going on deliberately thin and ugly, then being chilled before the ' +
			'finish coat: that first sacrificial layer is what traps loose crumbs so the visible ' +
			'frosting stays clean, and skipping it is why home cakes look speckled.'
	},
	{
		slug: 'injera',
		id: 'lXr3Q3Atbjs',
		title: 'How to Make Injera - Fermented Ethiopian Teff Flatbread',
		channel: "Yang's Nourishing Kitchen",
		watchFor:
			'The batter after its multi-day souring, and then the pour: a thin spiral from the ' +
			'outside inward, followed by the eyes opening across the surface, which is how you ' +
			'read that the ferment actually worked.'
	},
	{
		slug: 'keeping-the-cooking-liquid',
		id: 'se9zjwSyeNI',
		title: "How to Make Martha Stewart's Brown Beef Stock | Martha's Cooking School | Martha Stewart",
		channel: 'Martha Stewart',
		start: 19,
		watchFor:
			'The roasting of bones and aromatics to a true deep brown, and then the deglazing of ' +
			'the roasting pan, which is the step that separates brown stock from white and ' +
			'carries all the fond into the pot.'
	},
	{
		slug: 'khachapuri-shaping',
		id: 'VyR8TFSfNhI',
		title: 'How to Make Adjaruli Khachapuri (Georgian Cheese Bread)',
		channel: "America's Test Kitchen",
		start: 135,
		watchFor:
			'The "Shaping the Bread" chapter: the long edges are rolled inward into walls and the ' +
			'ends pinched into points, and the wall height is what decides whether the boat holds ' +
			'its cheese or leaks.'
	},
	{
		slug: 'kneading-dough',
		id: 'KToPmRXEQ3c',
		title: 'How to Knead Dough – Bake It Better with Kye',
		channel: 'King Arthur Baking Company',
		watchFor:
			"Kye's hands doing the push-fold-quarter-turn on the bench, and the moment the dough " +
			'stops tearing and starts pulling back at her, which is the gluten network becoming ' +
			'visible as behaviour rather than as a test.'
	},
	{
		slug: 'knife-cuts-dice-julienne-bias',
		id: 'nffGuGwCE3E',
		title: 'Jacques Pépin Techniques: Proper Knife Skills for Cutting, Chopping and Slicing',
		channel: 'KQED Food',
		watchFor:
			"Pépin's guiding hand: the curled knuckles that ride the blade and meter the width of " +
			'every slice, which is where evenness actually comes from rather than from counting ' +
			'millimetres.'
	},
	{
		slug: 'making-a-roux',
		id: 'eTf0n1HoC1w',
		title: 'How to Make a Roux Like a Pro | Food Network',
		channel: 'Food Network',
		watchFor:
			'The color ladder in the pan, white to blond to brown, and how the roux loosens and ' +
			'smells nutty as it darkens, which is the trade of thickening power for flavor ' +
			'happening in real time.'
	},
	{
		slug: 'mole',
		id: '9nLCrGeaEPE',
		title: "Rick Bayless Beginner's Mole",
		channel: 'Rick Bayless',
		watchFor:
			'The order and restraint of the toasting: chiles until they smell nutty and not one ' +
			'second into bitterness, then the seeds and nuts, then the frying-back of the puree ' +
			'that turns it from raw paste into mole.'
	},
	{
		slug: 'paella-and-socarrat',
		id: 'y4i4jebJ4PM',
		title: 'Spanish Cooking Techniques: Socarrat',
		channel: 'Foods&Wines from Spain',
		watchFor:
			'The last minutes over raised heat: listen for the crackle and watch the pan being ' +
			'left alone, since stirring at this point is what costs you the crust.'
	},
	{
		slug: 'pie-crust-and-blind-baking',
		id: '0KzAxaVMOVA',
		title: 'Learn To Cook: Blind Baking a Pie Shell',
		channel: "America's Test Kitchen",
		watchFor:
			'How the parchment is tucked and the weights are filled all the way up the sides, not ' +
			'just pooled in the bottom, which is what stops the walls slumping.'
	},
	{
		slug: 'pleating-dumplings',
		id: 'XcFrhE7w4XM',
		title: 'Chef Anita Lo Shows How to Fill and Pleat Chinese Dumplings',
		channel: 'Epicurious',
		watchFor:
			'Close hands on a single wrapper: only the near face gets pleated while the back ' +
			'stays flat, and the centre seam is sealed first so each fold has something to close ' +
			'against.'
	},
	{
		slug: 'poaching-eggs',
		id: 'S60GxA9JpLk',
		title: 'Truly Foolproof Poached Eggs',
		channel: 'J. Kenji López-Alt',
		watchFor:
			'The straining step that removes the loose outer white before the egg ever touches ' +
			'water, then the surface of the pot: it shivers rather than bubbles, which is the ' +
			'whole 71-82C poach in one image.'
	},
	{
		slug: 'pounding-a-curry-paste',
		id: 'd6YbVqqcR4w',
		title: 'Ultimate Guide to THAI CURRY PASTE - Hot Thai Kitchen',
		channel: "Pailin's Kitchen",
		watchFor:
			'The order ingredients enter the mortar, hardest and driest first, and the way the ' +
			'pestle crushes rather than stirs, which is what bruises the oils out instead of ' +
			'whipping air in.'
	},
	{
		slug: 'proofing-the-rise-before-the-oven',
		id: '3o5boRXTlt0',
		title: 'How to Do the "Poke Test" (and 3 ways it can trick you)',
		channel: 'Grant Bakes',
		watchFor:
			'The indent itself in close-up and how fast it fills: springs back at once is ' +
			'underproofed, comes back slowly is ready, stays put is gone. He also shows where the ' +
			'test lies to you, which is the part most poke-test videos skip.'
	},
	{
		slug: 'ramen-broth',
		id: 'F-TQjevcOf4',
		title: 'RAMEN SCHOOL #8 | How to Make Tonkotsu Ramen',
		channel: 'Adam Liaw',
		watchFor:
			'The hard rolling boil rather than a gentle simmer: that agitation is what emulsifies ' +
			'collagen and fat into the opaque white broth, the opposite of a clear stock.'
	},
	{
		slug: 'resting-dough-the-pause-that-does-the-work',
		id: 'Kcy4_HGf2SE',
		title: 'Steps of Baking Ep.2 | Autolyse',
		channel: 'ChainBaker',
		watchFor:
			'The same shaggy dough before and after the rest: watch it go from tearing to ' +
			'stretching with no kneading in between, which is the pause doing the work.'
	},
	{
		slug: 'resting-meat-and-slicing-against-the-grain',
		id: '9Nxst8lhwNM',
		title: 'Does Resting Meat Matter? | Techniquely with Lan Lam',
		channel: "America's Test Kitchen",
		watchFor:
			'The cut surfaces of the rested and unrested pieces side by side and how much liquid ' +
			'each one releases onto the board, which is the actual evidence for resting rather ' +
			'than the folklore.'
	},
	{
		slug: 'risotto-method',
		id: 'ANZTOPW_j7k',
		title: "Mantecare il risotto come un grande maestro - la tecnica dell'ONDA di Christian Costardi",
		channel: 'Italia Squisita',
		watchFor:
			'The pan being slammed and swung so the rice travels as a wave, which is the ' +
			'mantecatura: it is the motion, not the butter alone, that emulsifies the starch into ' +
			'cream.'
	},
	{
		slug: 'roasting-in-a-hot-oven',
		id: '0Mss7hxdqvQ',
		title: "How to Properly Roast a Chicken | Kenji's Cooking Show",
		channel: 'J. Kenji López-Alt',
		watchFor:
			'The temperature strategy argued out loud with a thermometer in hand: why the breast ' +
			'and the leg want different finishing temperatures, and how oven heat and bird ' +
			'position are used to close that gap instead of splitting the difference and drying ' +
			'the breast.'
	},
	{
		slug: 'rolling-dolmas',
		id: 'G7OLFDL63J4',
		title: 'How to Make Dolmades | Stuffed Grape Leaves',
		channel: 'Preppy Kitchen',
		watchFor:
			'The roll itself: leaf vein-side up, a restrained line of filling, sides folded in ' +
			'before rolling, and the parcel left deliberately loose so the rice has room to swell ' +
			'without bursting the leaf during the long simmer.'
	},
	{
		slug: 'rubbing-fat-into-flour',
		id: 'LW6H_SL_TJo',
		title: 'How to Rub Butter into Flour | Baking Mad',
		channel: 'Silver Spoon',
		watchFor:
			'The fingertips only, lifting the mixture high and letting it fall: watch for the ' +
			'moment it reads as breadcrumbs with pea-sized lumps still in it, because those ' +
			'unrubbed lumps are the flakiness.'
	},
	{
		slug: 'salting-to-draw-the-water-out',
		id: 'ZxkOY034xmA',
		title: 'Salting Eggplant - Kitchen Wisdom - Martha Stewart',
		channel: 'Martha Stewart',
		watchFor:
			'Beads of water standing up on the cut face of the salted eggplant, and how much ' +
			'liquid is blotted away before it ever meets oil.'
	},
	{
		slug: 'sauteing-and-the-shallow-fry',
		id: 'WWj9ByH8MU8',
		title: 'The Basics of Sautéing Correctly!',
		channel: 'Rick Bayless',
		watchFor:
			'How much empty pan he leaves around the food and how little he actually stirs: ' +
			'crowding and fussing are what turn a sauté into a steam, and this is the difference ' +
			'you can see rather than read.'
	},
	{
		slug: 'scoring',
		id: '3pmC4do7fOA',
		title: 'How to Score Bread Dough WITHOUT SNAGGING - 214',
		channel: 'Bake with Jack',
		watchFor:
			'The angle and the speed of the blade rather than the pattern: he shows that snagging ' +
			'is caused by hesitation and a square-on cut, and that one confident shallow stroke ' +
			'at a slant is what opens an ear.'
	},
	{
		slug: 'searing-the-hard-crust',
		id: 'JB1x0O-bhrw',
		title: 'Adam Savage Tests the Best Ways to Sear a Steak!',
		channel: 'Adam Savage’s Tested',
		start: 222,
		watchFor:
			'The "What is Sear" segment defines the crust as a chemical event rather than a ' +
			'colour, then the side-by-side sears show why a genuinely preheated dry surface ' +
			'browns while a damp or crowded one steams.'
	},
	{
		slug: 'shucking-shellfish',
		id: 'LVBfkXiuEJM',
		title: 'HOW TO SHUCK AN OYSTER | Hog Island Oyster Co.',
		channel: 'Hog Island Oyster Co.',
		watchFor:
			'The knife entering at the hinge and twisting rather than levering, and the blade ' +
			'then running flat along the top shell to cut the adductor, which is what keeps the ' +
			'meat whole and the liquor in the cup.'
	},
	{
		slug: 'skimming-foam-fat-and-a-clear-broth',
		id: '6x0Jo78q2rU',
		title: 'Classic Chicken Broth/Stock | Chef Jean-Pierre',
		channel: 'Chef Jean-Pierre',
		watchFor:
			'The grey scum being lifted off as the pot comes up to heat, and the pot then held at ' +
			'a bare shiver rather than a boil: skimming plus never boiling is what keeps the ' +
			'broth clear.'
	},
	{
		slug: 'steaming-basket-leaf-and-lid',
		id: 'dUyw0V7X1tg',
		title: 'How to Kill, Clean, and Steam a Whole Fish in the Chinese Style (清蒸鱼)',
		channel: 'Chinese Cooking Demystified',
		watchFor:
			'The fish goes into a covered basket over hard-boiling water and comes out at the ' +
			'exact moment the flesh parts from the bone: watch how short the time is, and how the ' +
			'steaming liquid is poured off rather than served, because it is the leached-out ' +
			'fishiness the technique is designed to shed.'
	},
	{
		slug: 'sushi-rice-and-rolling',
		id: 'nIoOv6lWYnk',
		title: 'The Best Way To Make Sushi At Home (Professional Quality) | Epicurious 101',
		channel: 'Epicurious',
		start: 37,
		watchFor:
			'Chef Taka cuts the vinegar through the rice with the paddle rather than stirring it, ' +
			'so the grains stay whole; the rolling chapter at 7:37 shows the mat tucking and the ' +
			'fingers setting tension.'
	},
	{
		slug: 'tadka-blooming-spices-in-fat',
		id: 'iaJ4UlYvDvE',
		title: 'Easy Dal Tadka Three Ways | एक दाल तीन तड़के | AWADHI / PUNJABI DAL TADKA | Chef Ranveer Brar',
		channel: 'Chef Ranveer Brar',
		watchFor:
			'Three tadkas built in sequence: the order spices enter the hot fat, and the few ' +
			'seconds between fragrant and burnt, seen back to back.'
	},
	{
		slug: 'tempering-a-custard',
		id: 'EgzgFRO2KFc',
		title: 'How to Make Crème Anglaise (Custard Sauce)',
		channel: 'The Bake School',
		watchFor:
			'The thin first ladles of hot milk going into the yolks under constant whisking, then ' +
			'the spoon-back nappe test at the end, which is the only reliable read on 82°C ' +
			'without a thermometer.'
	},
	{
		slug: 'the-bare-simmer-holding-liquid-below-the-boil',
		id: 'A8yPmXpzkvU',
		title: 'The Difference Between Boiling And Simmering | Cooking Techniques | Whole Foods Market',
		channel: 'WholeFoodsMarket',
		watchFor:
			'The two pots side by side: the lazy bubbles that break singly at the surface versus ' +
			'the rolling boil, which is the distinction this technique lives or dies on.'
	},
	{
		slug: 'the-brulee-torch',
		id: 'dsjoULgoCf4',
		title: 'Claire Saffitz Makes Crème Brûlée & Crème Caramel | Dessert Person',
		channel: 'Claire Saffitz x Dessert Person',
		watchFor:
			'The flame held at a distance and swept continuously across a thin, even sugar layer ' +
			'rather than parked in one spot, which is the difference between a glass lid and a ' +
			'burnt patch over cold custard.'
	},
	{
		slug: 'the-coat-before-the-fry-dredge-crumb-batter',
		id: '-m8bm55-o7Q',
		title: 'The Standard Breading Process in 3 Easy Steps - Kitchen Conundrums with Thomas Joseph',
		channel: 'Everyday Food',
		watchFor:
			'The one-wet-hand, one-dry-hand discipline down the flour-egg-crumb line: keeping one ' +
			'hand out of the egg is what stops the crumb from clumping onto your fingers instead ' +
			'of the cutlet, and it is the whole difference between a coat that survives the oil ' +
			'and one that sloughs off.'
	},
	{
		slug: 'the-molcajete',
		id: 'bC85E00qgVs',
		title: 'Salsa de Molcajete | Rick Bayless Taco Manual',
		channel: 'Rick Bayless',
		watchFor:
			'Garlic and chiles are crushed to a paste against the stone before anything else goes ' +
			'in, then tomatoes are broken rather than pureed: watch the texture stay ragged, ' +
			'which is what a blender destroys.'
	},
	{
		slug: 'the-pretzel-bath',
		id: 'H8kPsKNl7Yk',
		title: 'World Famous Bavarian Pretzels - Oktoberfest Special - Food Wishes',
		channel: 'Food Wishes',
		watchFor:
			'The dip itself: how few seconds the shaped pretzel spends in the alkaline bath, the ' +
			'handling precautions around lye, and the colour the crust reaches in the oven ' +
			'afterwards, which no egg wash or baking-soda substitute quite matches.'
	},
	{
		slug: 'the-seafood-boil',
		id: 'xsNnkXWvJ-4',
		title: 'How To Make a Crawfish Boil with Isaac Toups',
		channel: 'Munchies',
		watchFor:
			'The soak after the heat goes off, which is where the seasoning actually enters the ' +
			'crawfish; the boil itself is brief and the waiting is the technique.'
	},
	{
		slug: 'the-souffle',
		id: 'Xyvsql9P9Cs',
		title: 'Grand Marnier Souffle | Chef Jean-Pierre',
		channel: 'Chef Jean-Pierre',
		watchFor:
			'The whites being folded into the heavy base: a sacrificial spoonful first to slacken ' +
			'it, then a light hand, because every stroke past necessary is lift you have deflated ' +
			'before the oven gets a turn.'
	},
	{
		slug: 'the-tagine',
		id: 'XtSJSAwYSr0',
		title: 'Cooking Class in La Maison Arabe: Chicken Tagine& Moroccan Salads- CookingWithAlia - Episode 140',
		channel: 'cookingwithalia',
		watchFor:
			'How little liquid goes in at the start, and how the cone returns it: filmed in a ' +
			'Marrakech cooking school with the lid coming off mid-cook.'
	},
	{
		slug: 'the-water-bath',
		id: 'MLlblnAV5_Q',
		title: "How to Make a Cheesecake Water Bath | Sally's Baking",
		channel: "Sally's Baking Recipes",
		watchFor:
			'The foil wrapping of the springform pan and the height the water actually comes up ' +
			'the side: the whole point is gentle, even, humid heat, and a leaked pan or too ' +
			'little water defeats it.'
	},
	{
		slug: 'tortillas-on-the-comal',
		id: '4JBHQS-DEbI',
		title: 'Your Guide to Easy Homemade Corn Tortillas | Rick Bayless Taco Manual',
		channel: 'Rick Bayless',
		watchFor:
			'The three-flip rhythm on the hot surface and the moment the tortilla inflates, which ' +
			'is the steam trap forming between the two layers and the sign the heat is right.'
	},
	{
		slug: 'trussing',
		id: 'VxlcSzMOG9o',
		title: 'Jacques Pépin Techniques: How To Truss a Chicken for Roasting',
		channel: 'KQED Food',
		watchFor:
			'His hands and the single length of string: the legs are drawn in tight against the ' +
			'breast so the bird cooks as one compact shape, and there is no knot-tying fuss to ' +
			'memorise.'
	},
	{
		slug: 'velveting',
		id: 'nM1GQNJU6LQ',
		title: "Tenderize by 'Velveting': a Skeptic's Guide",
		channel: 'Chinese Cooking Demystified',
		start: 71,
		watchFor:
			'The guide section separates what actually does the work (the alkaline soda on the ' +
			'surface proteins, the starch shield) from the folklore, and shows the oil-blanch and ' +
			'water-blanch side by side.'
	},
	{
		slug: 'whipping-a-meringue',
		id: 'IE442EjxeTQ',
		title: 'Meringue - Swiss, French and Italian recipes',
		channel: 'Matt Adlard',
		watchFor:
			'All three meringues made side by side, so you can compare how the whites behave raw, ' +
			'warmed over water, and hit with hot syrup, and see the difference in gloss and peak ' +
			'stability that follows.'
	},
	{
		slug: 'working-with-masa',
		id: 'lyR8kno58GU',
		title: 'Pati Jinich - How to Make Tamales',
		channel: 'Pati Jinich',
		watchFor:
			'How the masa is beaten with fat until it lightens and holds air, and the spreading ' +
			'of it on the husk: thickness and evenness here decide whether the tamal steams ' +
			'tender or dense.'
	}
];

/* Guard against two entries claiming one technique, which would make the film
   shown depend on array order. */
const dupes = TECHNIQUE_FILMS.map((f) => f.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (dupes.length) throw new Error(`two films for one technique: ${[...new Set(dupes)].join(', ')}`);

const BY_SLUG = new Map(TECHNIQUE_FILMS.map((f) => [f.slug, f]));

/**
 * Attach the chosen films to the merged technique table.
 *
 * Keyed by slug rather than label, because a label is prose and gets edited:
 * "Low & slow smoking" could become "Low and slow smoking" in a punctuation
 * sweep and quietly take its film with it. A slug change is a route change and
 * is noticed.
 *
 * Sets `u`, the field films.mjs reads for a film URL, so the two halves of the
 * codebase keep one name for one thing. It changes technique pages only: recipe
 * film links are cut from the ORIGINAL 75 entry table, on purpose, so that the
 * link list under a recipe does not churn every time the supplement grows.
 *
 * @param {Array<{l: string, q?: string, u?: string}>} table  the merged TECH table
 * @param {(s: string) => string} slugify  the build's slugify, passed in so the
 *   keys here and the routes on disk cannot drift apart
 */
export function attachFilms(table, slugify) {
	const matched = new Set();
	for (const x of table) {
		const f = BY_SLUG.get(slugify(x.l));
		if (!f) continue;
		matched.add(f.slug);
		x.u = `https://www.youtube.com/watch?v=${f.id}${f.start ? `&t=${f.start}s` : ''}`;
		x.film = {
			url: x.u,
			id: f.id,
			title: f.title,
			channel: f.channel,
			watchFor: f.watchFor
		};
	}

	/* A film whose technique no longer exists is a silent loss: the page keeps
	   working, it just quietly goes back to a search box, and nobody finds out.
	   Fail the build instead and make somebody re-point it. */
	const orphans = TECHNIQUE_FILMS.filter((f) => !matched.has(f.slug));
	if (orphans.length) {
		throw new Error(
			`film(s) pointing at a technique that is not in the table: ` +
				orphans.map((f) => f.slug).join(', ') +
				`. The technique was renamed or dropped; re-point or remove the film.`
		);
	}
	return table;
}
