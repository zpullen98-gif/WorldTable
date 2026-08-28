/**
 * The technique standard: what correct execution looks like AT THE PAN.
 *
 * AUTHORED, NOT DERIVED — the same exception `standards.mjs` and the technique
 * table's SUPPLEMENT are. The guide teaches techniques and never says how to
 * tell you did one correctly, so there is nothing to extract. These are ours.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT MORE DISH STANDARDS. 45 dish standards
 * cover 45 dishes. 925 recipes carry none, and 782 of those exercise at least
 * one technique — so the cook who makes any of them can be told they cooked,
 * and nothing more. Writing 925 dish standards is not a plan. But a cook
 * searing anything is doing the same measurable thing whether the pan holds
 * duck or aubergine, and that is assessable once, for all of it.
 *
 * The 26 techniques written here are every technique the corpus uses on 25 or
 * more recipes. They put a standard on 638 recipes that had none, taking the
 * assessable corpus from 45 to 683 of 970 — for 26 pieces of writing rather
 * than 638.
 *
 * Those numbers are gated in build-data.mjs and read back out of this
 * comment. If a technique is added, a standard is written, or the corpus
 * changes, the build fails here until this paragraph is true again.
 *
 * WHERE IT IS JUDGED — the distinction that shapes the copy. A dish standard is
 * read at the pass, when the plate is finished and the verdict is final. A
 * technique standard is read AT THE PAN, while there is still something to be
 * done about it. A mark that can only be checked after the dish is plated
 * belongs in `standards.mjs`, not here.
 *
 * WHAT A MARK IS. Unchanged from the dish standards: something the cook can
 * verify unaided — seen, heard, felt, measured or timed — ordered the way it is
 * actually checked. Three to five; the build fails outside that range.
 *
 * THE EXTRA CONSTRAINT THIS FILE HAS. A mark must hold for EVERY recipe that
 * exercises the technique. `searing-the-hard-crust` runs across 100 recipes, so
 * a mark that mentions the protein, the fat, or the pan material has smuggled a
 * dish into a technique and is wrong for most of them. Write the mark against
 * the technique's own physics and it stays true across the whole tag.
 *
 * `fault` is the commonest real failure and the diagnosis, not a warning —
 * matching `standards.mjs`.
 *
 * THE REVERSE GATE. `TECHNIQUE_GATE_MIN_RECIPES` is the load-bearing number.
 * Any technique reaching that many recipes MUST have a standard or the build
 * fails. That is what stops this from rotting: a SUPPLEMENT entry added later
 * that tags 30 recipes cannot quietly ship unassessable. Lowering the threshold
 * is how the remaining techniques get written — drop it, watch the build name
 * exactly what it wants, write those, commit. It is a worklist that maintains
 * itself.
 */

import { MIN_MARKS, MAX_MARKS } from './standards.mjs';

export { MIN_MARKS, MAX_MARKS };

/**
 * The threshold that makes the reverse gate fire. Every technique at or above
 * this many recipes must appear below. Currently 25, which is exactly the 26
 * techniques written here — so the gate is tight, not slack, and the next
 * technique to cross 25 fails the build until somebody writes it.
 */
export const TECHNIQUE_GATE_MIN_RECIPES = 25;

/**
 * How many technique standards a single recipe may carry.
 *
 * Recipes average 1.75 techniques and the worst case is 7. Seven standards is
 * thirty-five marks, which is not a standard but a manual, and a cook holding a
 * pan will read none of it. Two is the cap.
 *
 * ORDER IS LOAD-BEARING, and it is by ascending recipe count — the RAREST
 * applicable technique first. A dish tagged both `searing-the-hard-crust` (100
 * recipes) and `frying-the-paste-until-the-oil-splits` (26) is far better
 * diagnosed by the second: the common technique is true of a hundred dishes and
 * therefore says little about this one. `judgedBy[0]` is consequently the most
 * specific standard available, and it is the one cook mode grades against.
 */
export const JUDGED_BY_MAX = 2;

export const TECHNIQUE_STANDARDS = [
	// ── Heat against a surface ───────────────────────────────────────
	{
		slug: 'searing-the-hard-crust',
		marks: [
			{ id: 'searing-the-hard-crust#keeps', text: 'The pan keeps a hard, steady sizzle from the moment the food lands and does not fall quiet; silence within the first half minute means the pan lost its heat and the surface is now steaming rather than browning.' },
			{ id: 'searing-the-hard-crust#releases', text: 'It releases itself when tested — slide a thin edge under and it lifts without tearing. Anything that grips the pan has not formed a crust yet and is not ready to be moved.' },
			{ id: 'searing-the-hard-crust#deep', text: 'Deep even brown across the whole face, edge to edge, when it is turned under the light: no pale ring left around a browned centre, and no black patches that taste bitter on their own.' },
			{ id: 'searing-the-hard-crust#floor', text: 'The pan floor carries a dry browned layer that dissolves and lifts the moment liquid hits it — not a wet grey film, and not black flecks that stay put and stay bitter.' },
			{ id: 'searing-the-hard-crust#browned', text: 'Cut into it: the browned band is thin, a few millimetres at most, sitting straight on top of correctly cooked interior — a thick grey collar under the crust means the heat was too low for too long.' }
		],
		fault: 'The pan was not hot enough, or too much went in at once, so the food released its water and sat in it — the surface goes grey and steams, it sticks when moved, and the crust that eventually forms arrives over an interior already cooked through.'
	},
	{
		slug: 'sweating-aromatics-soft-never-browned',
		marks: [
			{ id: 'sweating-aromatics-soft-never-browned#colour', text: 'No colour anywhere: tipped under the light the pieces are translucent to pale gold, with no tan edges, no brown tips, and no browned flecks suspended in the fat.' },
			{ id: 'sweating-aromatics-soft-never-browned#quiet', text: 'The pan is quiet — a low steady hiss, not a crackle. A crackle means the moisture has gone and browning has already started.' },
			{ id: 'sweating-aromatics-soft-never-browned#largest', text: 'The largest piece pressed against the side of the pan collapses without resistance and with no crunch left at its centre.' },
			{ id: 'sweating-aromatics-soft-never-browned#clear', text: 'The fat is still clear and loose in the pan and the pan floor is clean — nothing caught, nothing browned on to deglaze, because there was never any fond to build.' },
			{ id: 'sweating-aromatics-soft-never-browned#tastes', text: 'It tastes sweet and mild with no raw allium bite at the back of the throat, and none of the roasted sweetness that belongs to the next technique up the heat scale.' }
		],
		fault: 'The heat was too high and nothing covered the pan, so the pieces took colour before they softened — the finished dish carries a roasty sweetness where it wanted a clean one, and the pieces are still firm at the centre under browned edges.'
	},
	{
		slug: 'griddle-and-plancha-work',
		marks: [
			{ id: 'griddle-and-plancha-work#full', text: 'Full contact with the metal: the food lies flat, with no dome in the middle and no curled edge lifting it away, so browning reaches the entire face rather than a ring of it.' },
			{ id: 'griddle-and-plancha-work#contact', text: 'Contact is immediate and audible, and the food stays where it is put rather than sliding around in a slick of its own released liquid.' },
			{ id: 'griddle-and-plancha-work#cooked', text: 'The cooked face is an unbroken sheet of even colour — the whole surface browned, not a pattern of marks with pale ground between them, and not a dark centre with pale corners.' },
			{ id: 'griddle-and-plancha-work#metal', text: 'The metal around the food is dry: no spreading wet patch steaming out from under it, nothing weeping onto the surface and boiling there.' },
			{ id: 'griddle-and-plancha-work#turned', text: 'Turned once or twice and no more, and lifted while the crust is still brown — a piece flipped repeatedly never holds heat long enough to build one.' }
		],
		fault: 'The surface was crowded and its temperature crashed, so everything gave up its water at once and stewed on the metal — pale, damp, grey at the edges, and stuck fast where the crust never got the chance to form.'
	},
	{
		slug: 'sauteing-and-the-shallow-fry',
		marks: [
			{ id: 'sauteing-and-the-shallow-fry#everything', text: 'Everything sits in a single layer with visible space between the pieces — nothing stacked, nothing touching, or the pan is too small for the quantity.' },
			{ id: 'sauteing-and-the-shallow-fry#pieces', text: 'The pieces move freely and keep moving, sliding across the pan rather than sticking and tearing when the pan is worked.' },
			{ id: 'sauteing-and-the-shallow-fry#light', text: 'Light even browning arrived at quickly — colour on most faces, not the deep crust of a sear and not grey.' },
			{ id: 'sauteing-and-the-shallow-fry#thin', text: 'A thin film of fat with the food glossed by it: no pool left in the pan at the end, and nothing greasy on the fingers or the plate.' },
			{ id: 'sauteing-and-the-shallow-fry#cooked', text: 'Cooked through but still firm, having spent only a few minutes in the pan — anything that has gone soft has been in there too long.' }
		],
		fault: 'Too much went in at once, the pan cooled, and the food released its water — what was meant to brown in three minutes stews for ten and comes out grey, slack and wet.'
	},
	{
		slug: 'grilling-over-live-coals',
		marks: [
			{ id: 'grilling-over-live-coals#fire', text: 'The fire was ready before the food was: coals evenly covered in grey ash with no flames licking through and no raw smoke coming off, and a hot zone and a cooler one both available.' },
			{ id: 'grilling-over-live-coals#grate', text: 'The grate was hot and clean when the food landed, and the food released cleanly from it when the time came to turn rather than tearing away.' },
			{ id: 'grilling-over-live-coals#marks', text: 'Marks are browned, not burnt: deep colour where the metal touched, with no carbon flaking off and no soot transferred onto the food.' },
			{ id: 'grilling-over-live-coals#interior', text: 'The interior reaches its target with a thin gradient — not charred outside and cold within, and not driven through by a flare-up.' },
			{ id: 'grilling-over-live-coals#fire2', text: 'What comes off the fire smells of fire and food only: no raw wood smoke, no fuel, nothing acrid at the back of the nose.' }
		],
		fault: 'It went on over live flames instead of settled coals, so the outside charred bitter in the flare-ups while the middle stayed cold, and everything on the plate tastes of soot.'
	},

	// ── Fat, and what comes out of it ────────────────────────────────
	{
		slug: 'rendering-fat-and-cooking-in-what-runs-out',
		marks: [
			{ id: 'rendering-fat-and-cooking-in-what-runs-out#started', text: 'It started cold or low and came up slowly — fat that met a hot pan seizes and scorches before the inside can melt, and there is no recovering it.' },
			{ id: 'rendering-fat-and-cooking-in-what-runs-out#clear', text: 'The fat in the pan is clear and clean-smelling, pale to golden, with no dark sediment on the floor and nothing acrid in the steam.' },
			{ id: 'rendering-fat-and-cooking-in-what-runs-out#left', text: 'What is left behind is crisp and deep gold with no soft pale fat still clinging to it and no black burnt edges.' },
			{ id: 'rendering-fat-and-cooking-in-what-runs-out#real', text: 'There is a real volume of it: enough to film the pan floor and be poured off and kept, not a dry smear that never ran.' },
			{ id: 'rendering-fat-and-cooking-in-what-runs-out#whatever', text: 'Whatever cooks in it browns in it and takes its flavour, rather than sitting in a greasy pool that never gets hot enough to colour anything.' }
		],
		fault: 'The heat was raised to hurry it along, so the outside seized and browned before the interior fat could melt — very little runs out, and the solids come out burnt on the outside and rubbery within.'
	},
	{
		slug: 'the-coat-before-the-fry-dredge-crumb-batter',
		marks: [
			{ id: 'the-coat-before-the-fry-dredge-crumb-batter#coat', text: 'The coat is continuous before it goes anywhere near the fat: held up to the light, no bare patch of food shows through anywhere, seams and thin edges included.' },
			{ id: 'the-coat-before-the-fry-dredge-crumb-batter#bonded', text: 'It is bonded rather than resting on top — a gentle shake sheds loose dust only, and the coat does not slide off as a sheet when the piece is handled.' },
			{ id: 'the-coat-before-the-fry-dredge-crumb-batter#bubbles', text: 'It bubbles hard and steadily from the moment it enters the fat, and the bubbling visibly slows as it finishes; those bubbles are the surface water leaving, and a quiet entry means the fat is too cool.' },
			{ id: 'the-coat-before-the-fry-dredge-crumb-batter#drained', text: 'Out and drained, it is an even gold-brown all over and it is still crisp several minutes later on a rack — a coat that softens within a minute of coming out never lost its water.' },
			{ id: 'the-coat-before-the-fry-dredge-crumb-batter#broken', text: 'Broken open, there is no paste of raw flour under the crust and no hollow gap where the coat has lifted away from the food.' }
		],
		fault: 'The fat was below temperature or the pan was crowded, so the coat drank fat instead of sealing against it — it comes out pale and heavy, greasy to the fingers, and slumps off the food as it cools.'
	},
	{
		slug: 'frying-the-paste-until-the-oil-splits',
		marks: [
			{ id: 'frying-the-paste-until-the-oil-splits#being', text: 'It is being fried, not simmered: the paste is in fat over live heat and moving, holding a steady sizzle throughout rather than bubbling as a wet mass.' },
			{ id: 'frying-the-paste-until-the-oil-splits#colour', text: 'The colour has deepened and darkened from raw to cooked, and the volume has visibly reduced and tightened.' },
			{ id: 'frying-the-paste-until-the-oil-splits#split', text: 'The split — the signal the whole technique is named for — is unmistakable when it comes: clear fat separates out and pools at the edges and on the surface, and the paste pulls away from the pan floor in one mass.' },
			{ id: 'frying-the-paste-until-the-oil-splits#smell', text: 'The smell has turned from sharp and raw to round and fragrant, with no raw bite of onion, garlic, ginger or tomato left in it.' },
			{ id: 'frying-the-paste-until-the-oil-splits#nothing', text: 'Nothing has caught: no black specks through the paste, no bitterness, and a pan floor that is browned but not burnt.' }
		],
		fault: 'It was taken off as soon as it smelled good, before the fat separated — the raw edge of the aromatics is still in it, and the finished dish tastes thin and sharp no matter how long it simmers afterwards.'
	},
	{
		slug: 'making-a-roux',
		marks: [
			{ id: 'making-a-roux#stage', text: 'Taken to the stage the dish named and no further, judged against that colour — pale, blond, or brown to brick — and it got there slowly enough to have coloured evenly.' },
			{ id: 'making-a-roux#smooth', text: 'It is smooth and mobile: a paste with no dry pockets of flour and no lumps, loosening as it warms rather than sitting stiff in the pan.' },
			{ id: 'making-a-roux#raw-flour', text: 'The raw-flour smell has gone and been replaced by the toasted, biscuity smell of its stage, with nothing acrid behind it.' },
			{ id: 'making-a-roux#black', text: 'No black specks anywhere. One scorched fleck condemns the batch — it cannot be stirred back in and it will be tasted in the finished sauce.' },
			{ id: 'making-a-roux#down', text: 'Let down into liquid it goes smooth without lumps and thickens to the body the dish wants, leaving no floury taste on the tongue.' }
		],
		fault: 'The heat was too high and the corners of the pan went unstirred, so it scorched at the edge — black specks run through the finished sauce and carry a bitterness that no amount of seasoning covers.'
	},

	// ── Water, and heat carried by it ────────────────────────────────
	{
		slug: 'the-bare-simmer-holding-liquid-below-the-boil',
		marks: [
			{ id: 'the-bare-simmer-holding-liquid-below-the-boil#surface', text: 'The surface is read rather than assumed: bubbles break slowly in one or two places, or the surface merely shivers, and it does not reach a rolling boil at any point.' },
			{ id: 'the-bare-simmer-holding-liquid-below-the-boil#held', text: 'It was held there — the pot was watched and the heat adjusted rather than set once and left, and there is no tide mark up the pot wall from a boil-over.' },
			{ id: 'the-bare-simmer-holding-liquid-below-the-boil#liquid', text: 'The liquid stayed as clear as it should be: no clouding from agitation, and no fat churned into an emulsion through it.' },
			{ id: 'the-bare-simmer-holding-liquid-below-the-boil#whatever', text: 'Whatever is in the liquid is still intact — nothing shredded, broken up, or worried apart by movement.' },
			{ id: 'the-bare-simmer-holding-liquid-below-the-boil#level', text: 'The level is roughly where the elapsed time should have left it; a large drop is the evidence that it ran hotter than this while nobody was looking.' }
		],
		fault: 'It was brought to a boil and then left on the same heat, so it churned for the whole cook — the liquid clouded, the fat emulsified into it, and the solids broke apart into the broth.'
	},
	{
		slug: 'salted-water-and-the-float-test',
		marks: [
			{ id: 'salted-water-and-the-float-test#water', text: 'The water was salted before anything went in, and tasting it confirms it: seasoned on the tongue, with the salt dissolved rather than sitting on the pot floor.' },
			{ id: 'salted-water-and-the-float-test#enough', text: 'There is enough water, hot enough, that the pot returns to its boil quickly after the food goes in and never stops moving.' },
			{ id: 'salted-water-and-the-float-test#dish', text: 'Where the dish uses the float as its signal, the signal is obeyed: the pieces rise and they come out then, not several minutes later once something else was finished.' },
			{ id: 'salted-water-and-the-float-test#nothing', text: 'Nothing is stuck to the bottom of the pot or welded to itself, and the water has not thickened into a cloudy sludge.' },
			{ id: 'salted-water-and-the-float-test#drained', text: 'Drained on a bite rather than on the clock: resistance at the centre, with no chalky raw core.' }
		],
		fault: 'The pot was too small and the water unsalted, so it never recovered its boil — the food sat in slack water, went gummy at the surface, and comes out bland in a way that no sauce afterwards can fix.'
	},
	{
		slug: 'steaming-basket-leaf-and-lid',
		marks: [
			{ id: 'steaming-basket-leaf-and-lid#steam', text: 'Steam was running before the food went in: the water at a rolling boil and vapour coming steadily through the basket, rather than the whole thing warming up together.' },
			{ id: 'steaming-basket-leaf-and-lid#nothing', text: 'Nothing touches the water at any point — the food sits clear of it throughout, and the level neither drops enough to boil dry nor rises enough to wet it.' },
			{ id: 'steaming-basket-leaf-and-lid#stayed', text: 'The lid stayed on. Every lift costs the chamber its heat, and the number of lifts should be as close to none as the dish allows.' },
			{ id: 'steaming-basket-leaf-and-lid#lifted', text: 'Lifted out, the surface is glossy and plump with its colour heightened rather than dulled — greens brighter than they went in, not olive.' },
			{ id: 'steaming-basket-leaf-and-lid#cooked', text: 'Cooked through with the shape intact: it yields at the centre without having slumped or split, and there is no more than a spoonful of clean condensate beneath it.' }
		],
		fault: 'The lid was loose or dripping and the condensate fell back onto the food, so it arrives waterlogged and pale with its seasoning washed down into the bottom of the dish.'
	},
	{
		slug: 'braising',
		marks: [
			{ id: 'braising#pieces', text: 'The pieces went into the liquid already deep brown on their faces, and the pot floor gave up its fond to that liquid rather than keeping it.' },
			{ id: 'braising#liquid', text: 'The liquid comes partway up the pieces and stays there for the whole cook — not submerged, not run dry — and it never boils: the surface trembles and no more.' },
			{ id: 'braising#went', text: 'It went long enough for the collagen to convert: a fork twists in it with almost no resistance, and the piece still lifts out whole rather than falling into shreds.' },
			{ id: 'braising#liquid2', text: 'The liquid has become a sauce — it has body, it coats the back of a spoon, and it tastes concentrated rather than thin and washed out.' },
			{ id: 'braising#meat', text: 'The meat is moist and seasoned through to its centre, not dry fibres sitting inside a good sauce.' }
		],
		fault: 'The oven or the burner ran too hot and the liquid boiled, so the fibres tightened and squeezed their moisture out — it shreds dry into a thin greasy liquid, and more time makes it worse rather than better.'
	},
	{
		slug: 'keeping-the-cooking-liquid',
		marks: [
			{ id: 'keeping-the-cooking-liquid#actually', text: 'It was actually kept: the liquid went into a container rather than down the drain, and the volume saved is enough to be worth using.' },
			{ id: 'keeping-the-cooking-liquid#clean', text: 'It is clean — strained of solids and grit, and not clouded with the debris of whatever broke up in it.' },
			{ id: 'keeping-the-cooking-liquid#tastes', text: 'It tastes of what it cooked and tastes concentrated rather than washed out, and it is not so salty or so bitter that the only honest use is the bin.' },
			{ id: 'keeping-the-cooking-liquid#cooled', text: 'It was cooled quickly and stored cold, not left standing warm on the stove to be dealt with later.' },
			{ id: 'keeping-the-cooking-liquid#used', text: 'Used, it does the job the dish gives it — carrying flavour into a sauce, loosening the dish, or setting when chilled — rather than merely adding water back.' }
		],
		fault: 'The pot was left to cool slowly on the stove and only strained the next day, so it soured overnight — what should have been the best ingredient in the dish goes in the bin, and the recipe gets water instead.'
	},
	{
		slug: 'straining-and-passing-through-a-sieve',
		marks: [
			{ id: 'straining-and-passing-through-a-sieve#nothing', text: 'Nothing solid got through: a finger drawn through what came out finds no fibre, seed, skin, curd, or grit.' },
			{ id: 'straining-and-passing-through-a-sieve#dish', text: 'Where the dish wants body it was worked through rather than left to drip, and the solids left in the mesh are spent and dry rather than still holding liquid worth having.' },
			{ id: 'straining-and-passing-through-a-sieve#judged', text: 'It is judged on the tongue rather than by eye: smooth, with no residual grain left behind after the mouthful has gone.' },
			{ id: 'straining-and-passing-through-a-sieve#mesh', text: 'The mesh was fine enough for the job and held its shape, and nothing bypassed it by going over the rim.' },
			{ id: 'straining-and-passing-through-a-sieve#yield', text: 'The yield is close to what went in less the spent solids — not half of it abandoned in the sieve because it stopped running and nobody pushed.' }
		],
		fault: 'It was pushed through a mesh too coarse for it, or the sieve was overloaded and slopped at the rim, so the fibres it was meant to remove are in the finished sauce and it reads grainy on the tongue.'
	},

	// ── Salt, acid, and time ─────────────────────────────────────────
	{
		slug: 'marinating-acid-salt-and-time',
		marks: [
			{ id: 'marinating-acid-salt-and-time#contact', text: 'Contact is total: every surface is wetted, and the pieces are not welded into a clump with dry faces where they pressed together.' },
			{ id: 'marinating-acid-salt-and-time#stated', text: 'The stated time was kept and kept cold — read against a clock, because this is the one technique where longer is a different result rather than a safer one.' },
			{ id: 'marinating-acid-salt-and-time#worked', text: 'It worked at the surface and no further: cut a piece and the marinade’s colour stops a few millimetres in. A protein gone opaque and chalky to the centre before any heat reached it has been cooked by the acid.' },
			{ id: 'marinating-acid-salt-and-time#texture', text: 'The texture is still springy and whole — not mushy, mealy, or fraying at the surface when it is lifted.' },
			{ id: 'marinating-acid-salt-and-time#next', text: 'Where the next step browns it, the surface was patted dry first: a wet surface cannot brown, and the marinade’s sugars will scorch before the food colours.' }
		],
		fault: 'It was left well beyond the stated time on the assumption that more is better, so acid and salt worked through the thin edges — those cook to cotton and read grainy while the thick centre tastes of nothing at all.'
	},
	{
		slug: 'brining-and-curing',
		marks: [
			{ id: 'brining-and-curing#fully', text: 'Fully committed either way: in a wet brine nothing floats clear of the liquid, and in a dry cure every face carries salt, seams and cavities included.' },
			{ id: 'brining-and-curing#time', text: 'The time was measured against the weight and the thickness rather than the recipe’s convenience, and it stayed cold for all of it.' },
			{ id: 'brining-and-curing#change', text: 'The change is visible and can be felt: the flesh is firmer than raw and its colour has deepened or gone more translucent, rather than still being slack and pale.' },
			{ id: 'brining-and-curing#rinsed', text: 'Rinsed and dried as the recipe asks, and anything meant to crisp afterwards has a surface dry and tacky to the touch before it goes near heat.' },
			{ id: 'brining-and-curing#cooked', text: 'Cooked and tasted, it is seasoned right through to the centre rather than merely salty at the surface — and not so salty that the dish cannot be eaten.' }
		],
		fault: 'It sat in the brine well past its time because a few extra hours seemed harmless — the surface is over-salted and the texture has gone from firm to spongy and wet, and no cooking takes salt back out.'
	},
	{
		slug: 'chilling-to-firm-the-fridge-as-binder',
		marks: [
			{ id: 'chilling-to-firm-the-fridge-as-binder#went', text: 'It went cold before it was handled any further, and it went in spread flat and covered rather than as a warm mass that insulates its own centre.' },
			{ id: 'chilling-to-firm-the-fridge-as-binder#cold', text: 'It is cold through rather than cold at the edge: tested at the middle it is as firm as it is at the rim.' },
			{ id: 'chilling-to-firm-the-fridge-as-binder#holds', text: 'It holds its shape unsupported — it can be cut, portioned, rolled or lifted without slumping, tearing, or sticking to the hands.' },
			{ id: 'chilling-to-firm-the-fridge-as-binder#solid', text: 'The fat in it has gone solid: it feels firm and waxy to the fingers rather than greasy and yielding.' },
			{ id: 'chilling-to-firm-the-fridge-as-binder#survives', text: 'It survives the step it was chilled for, going into heat or a coating or a mould still holding its form rather than collapsing the moment it is touched.' }
		],
		fault: 'It was given twenty minutes instead of the hours it needed, so it is firm at the rim and soft at the core — it slumps out of shape as it is portioned, and everything made from it spreads or breaks apart in the pan.'
	},

	// ── The bench: dough, air, and the hand ──────────────────────────
	{
		slug: 'proofing-the-rise-before-the-oven',
		marks: [
			{ id: 'proofing-the-rise-before-the-oven#judged', text: 'Judged on volume against the container rather than on the clock: visibly grown, and grown by roughly the amount the recipe describes.' },
			{ id: 'proofing-the-rise-before-the-oven#poke', text: 'The poke test agrees: a floured fingertip pressed a centimetre in leaves a dent that springs back slowly and only part of the way. Straight back means it is not ready; no spring at all means it has gone.' },
			{ id: 'proofing-the-rise-before-the-oven#surface', text: 'The surface is domed, smooth, and slightly sheened — not cratered, wrinkled, or collapsed, and not skinned over and dry from proofing uncovered.' },
			{ id: 'proofing-the-rise-before-the-oven#handled', text: 'Handled, it feels alive and airy — light for its size, with bubbles visible under the skin.' },
			{ id: 'proofing-the-rise-before-the-oven#springs', text: 'It springs in the oven: the piece lifts in the first minutes and the scores open. A shape that does not move at all was proofed past its point before it went in.' }
		],
		fault: 'It was proofed to the clock in a kitchen colder or warmer than the recipe assumed — overproofed, it collapses as the blade touches it and bakes flat and dense with a sour edge; underproofed, it tears at the side and bakes tight.'
	},
	{
		slug: 'resting-dough-the-pause-that-does-the-work',
		marks: [
			{ id: 'resting-dough-the-pause-that-does-the-work#actually', text: 'It actually rested, covered, for the time stated — not cut short because the rest of the schedule was tight.' },
			{ id: 'resting-dough-the-pause-that-does-the-work#rolls', text: 'It rolls and shapes without fighting: it stays where it is put, and it does not spring back or shrink on the bench between passes.' },
			{ id: 'resting-dough-the-pause-that-does-the-work#surface', text: 'The surface is smooth and supple rather than dry, cracked, or skinned over.' },
			{ id: 'resting-dough-the-pause-that-does-the-work#temperature', text: 'It is at the temperature the next step needs — cold where the fat must stay solid, cool and relaxed where it must be rolled thin.' },
			{ id: 'resting-dough-the-pause-that-does-the-work#baked', text: 'Baked, it holds the dimensions it was shaped to rather than shrinking back from the edges of the tin or the rim of the dish.' }
		],
		fault: 'The rest was skipped or shortened, so the gluten was still tight — the dough fought the pin and sprang back thick and uneven, then shrank down the sides of the tin in the oven.'
	},
	{
		slug: 'shaping-by-hand',
		marks: [
			{ id: 'shaping-by-hand#pieces', text: 'The pieces match: weighed, or judged against each other rather than by dividing the mass by eye, so that no piece is half again the size of its neighbour.' },
			{ id: 'shaping-by-hand#surfaces', text: 'Surfaces are smooth and unbroken with no cracks, tears, or dry patches, and the seams are sealed and sitting underneath.' },
			{ id: 'shaping-by-hand#shape', text: 'The shape is defined and it holds while the tray waits — it has not slumped, spread, or relaxed back out of its form.' },
			{ id: 'shaping-by-hand#nothing', text: 'Nothing is trapped that should not be: no air pocket where filling should be, no filling breaking through the surface, and no excess flour greying the outside.' },
			{ id: 'shaping-by-hand#finish', text: 'They finish together in the heat — no piece done while another is still raw, which is the only test that the first mark was met.' }
		],
		fault: 'The dough was worked past its point or shaped without a rest, so it fought back — the pieces spring out of shape on the tray and bake tight, uneven, and torn along the surface.'
	},
	{
		slug: 'creaming-butter-and-sugar',
		marks: [
			{ id: 'creaming-butter-and-sugar#butter', text: 'The butter started at the right temperature: it took a fingerprint and held its shape, neither greasy and slumping nor hard from the fridge.' },
			{ id: 'creaming-butter-and-sugar#visibly', text: 'It has visibly paled — from yellow towards near-white — and grown in volume, and getting there took minutes rather than seconds.' },
			{ id: 'creaming-butter-and-sugar#texture', text: 'The texture is light and aerated: a spoonful is fluffy and holds a soft peak rather than sitting dense on the spoon.' },
			{ id: 'creaming-butter-and-sugar#rubbed', text: 'Rubbed between finger and thumb it is still faintly gritty with undissolved sugar, and not slick or oily.' },
			{ id: 'creaming-butter-and-sugar#homogeneous', text: 'It is one homogeneous cream — not split, slackened, or separating into a greasy mass with liquid running out of it.' }
		],
		fault: 'The butter was too warm, or it was beaten well past its point, so the fat softened and gave up the air it had taken — the mixture goes slack and oily and the cake bakes dense and greasy with a sunken middle.'
	},
	{
		slug: 'egg-wash-and-the-bakers-shine',
		marks: [
			{ id: 'egg-wash-and-the-bakers-shine#applied', text: 'Applied thin and even over every surface that will show, with no bare patches and no ridges or brush lines standing in it.' },
			{ id: 'egg-wash-and-the-bakers-shine#nothing', text: 'Nothing pooled: no wash run down into the seams, collected in the corners, or welded to the tray around the base.' },
			{ id: 'egg-wash-and-the-bakers-shine#glued', text: 'It has not glued shut what needs to move — layers, scores, and cut edges are still free to open in the heat.' },
			{ id: 'egg-wash-and-the-bakers-shine#baked', text: 'Baked, the finish is even and glossy across the whole piece and deep gold rather than patchy, with no darker bands where the wash sat heavy.' },
			{ id: 'egg-wash-and-the-bakers-shine#shine', text: 'The shine is on the outside only: nothing inside the piece tastes of egg.' }
		],
		fault: 'The wash went on heavy and ran into the scores and down to the tray, so the piece baked sealed along its seams, browned unevenly, and carries dark rubbery ridges where the egg collected.'
	},

	// ── Judgement: reading doneness and texture ──────────────────────
	{
		slug: 'the-wobble-and-the-skewer-testing-a-bake',
		marks: [
			{ id: 'the-wobble-and-the-skewer-testing-a-bake#tested', text: 'Tested at the true centre and the thickest point, not at the convenient edge — the edge is done long before the answer is.' },
			{ id: 'the-wobble-and-the-skewer-testing-a-bake#skewer', text: 'The skewer comes out as the recipe describes, clean and dry or carrying the stated moist crumb, and it does the same on a second test in a different spot.' },
			{ id: 'the-wobble-and-the-skewer-testing-a-bake#wobble', text: 'The wobble is read in motion: nudged, the centre moves as one set mass with a faint tremble, rather than a liquid ripple travelling across the surface.' },
			{ id: 'the-wobble-and-the-skewer-testing-a-bake#other', text: 'The other signs agree with the test — risen and just shrinking from the sides, the top set and dry to a light touch with no wet gloss on it.' },
			{ id: 'the-wobble-and-the-skewer-testing-a-bake#pressed', text: 'Pressed lightly at the middle it springs back and leaves no lasting dent.' }
		],
		fault: 'It was judged on the clock and on how the edges looked, so a centre still liquid went to the rack and sank as it cooled — a dense wet seam under a perfectly browned top.'
	},
	{
		slug: 'knife-cuts-dice-julienne-bias',
		marks: [
			{ id: 'knife-cuts-dice-julienne-bias#three', text: 'Take any three pieces from anywhere in the pile: they match closely enough in every dimension that you would have to measure them to argue otherwise.' },
			{ id: 'knife-cuts-dice-julienne-bias#faces', text: 'The cut faces are flat and clean rather than ragged or crushed — leaves and herbs are cut through, not bruised, and the board carries no dark smear where they were.' },
			{ id: 'knife-cuts-dice-julienne-bias#stated', text: 'The stated size is the actual size, held against a rule or a known reference rather than called about right.' },
			{ id: 'knife-cuts-dice-julienne-bias#everything', text: 'Everything in the pile is the shape that was asked for: no wedges, no half pieces, and no offcuts swept in to avoid waste.' },
			{ id: 'knife-cuts-dice-julienne-bias#cook', text: 'They cook evenly, which is the entire point — at the end of cooking nothing is still raw and nothing has collapsed.' }
		],
		fault: 'The knife was dull, or the vegetable was never squared off first, so the pieces vary — the small ones are mush by the time the large ones are cooked, and the dish has two textures where it wanted one.'
	},
	{
		slug: 'mashing-and-pureeing',
		marks: [
			{ id: 'mashing-and-pureeing#smooth', text: 'Smooth to the degree the dish asks for, judged on the tongue rather than by eye — no lumps, no fibres, no grit, unless texture is the point.' },
			{ id: 'mashing-and-pureeing#gluey', text: 'No gluey elasticity: a spoonful drops cleanly off the spoon rather than stretching in a rope behind it.' },
			{ id: 'mashing-and-pureeing#consistency', text: 'The consistency holds — it mounds on a spoon and stays there, neither slumping flat nor standing so stiff that a spoon has to cut it.' },
			{ id: 'mashing-and-pureeing#nothing', text: 'Nothing separates on the plate: no water or fat weeping out into a ring within a minute of serving.' },
			{ id: 'mashing-and-pureeing#colour', text: 'The colour is even throughout, with no streaks of unincorporated fat, cream, or seasoning at the edges of the bowl.' }
		],
		fault: 'A starchy ingredient met a high-speed blade, so the cells burst and released their starch — what should be light comes out as an elastic glue that lifts off the spoon in one mass.'
	}
];
