/**
 * The calibration bench: apparatus, not doctrine.
 *
 * AUTHORED, NOT DERIVED, and the most important thing on this page is what it
 * is NOT. The guide states 5–8% for a wet brine and 2–3% for lacto-fermentation
 * and says NOTHING about seasoning concentration. So these numbers are not the
 * guide's, they are not a statement of correct seasoning, and they are not a
 * house spec. They are two cups chosen to be DISCRIMINABLE at a stated
 * difficulty, the way an eye chart's letters are chosen to be legible at a
 * distance: the chart is not an opinion about what you should be reading.
 *
 * Same disclosure treatment sanitation.mjs gives its 4–60°C conflict: say whose
 * number it is, on the page, where the number is.
 *
 * WHY IT EXISTS. Two cooks season the same dish differently, so the dish is a
 * different dish depending on who is on, and the guest notices before the chef
 * does. "This is under-seasoned", said for six months to somebody who genuinely
 * cannot taste the difference at that concentration, is a discrimination
 * threshold and not an attitude problem; no amount of telling fixes it, and
 * nothing in this app could tell the two apart. Servers get a scored, scheduled
 * drill over 186 cards; cooks got nothing scored at all.
 *
 * THE INSTRUMENT is a triangle test: three cups, two the same, one different,
 * and the app holds the answer, which is the one thing a cook standing alone
 * cannot do for themselves.
 *
 * The guide's own protocol entry is the anchor and it asks for exactly this:
 * taste COMPARATIVELY, and taste single ingredients at their extremes: "to
 * calibrate the instruments".
 *
 * THE LADDER NARROWS, THE RUN DOES NOT. Each level is a fixed pair, and a run
 * is a fixed number of trials at ONE level. Narrowing the gap inside a run is a
 * staircase procedure, which needs its own estimator and is not what
 * repertoire.ts does: a level is a slug, cleared or not, and the ladder is the
 * spacing between levels.
 */

/** Cups per trial. Two the same, one different. */
export const CUPS = 3;

/**
 * Trials in a run, and the reason it is never one.
 *
 * A triangle test has a 1-in-3 guess rate, so a single trial logged as "met"
 * says almost nothing: that is precisely the failure drill.ts's
 * never-shorten-the-round rule exists to prevent. Six trials at chance is a
 * 1-in-729 run of luck for a clean sweep.
 */
export const TRIALS = 6;

/** Right answers needed to clear a level. Absolute, the way verdictFor is. */
export const PASS_AT = 5;

/**
 * The ladders.
 *
 * `base` and `odd` are grams of the named substance into the named volume of
 * water, mixed until dissolved. Levels narrow: level 1 is a gap most people
 * find obvious, level 5 is close to the limit of trained discrimination.
 *
 * Kitchen-practical on purpose: whole or half grams into a litre, because a
 * kitchen scale reads to 1 g and a cook is not going to weigh 0.02 g.
 */
export const LADDERS = [
	{
		taste: 'salt',
		label: 'Salt',
		substance: 'fine salt',
		unit: 'g',
		per: '1 litre of water',
		note: 'The one that ends the most arguments. Mix both jugs fully: undissolved salt at the bottom is a different test.',
		levels: [
			{ level: 1, base: 3, odd: 6 },
			{ level: 2, base: 4, odd: 6 },
			{ level: 3, base: 5, odd: 6 },
			{ level: 4, base: 5.5, odd: 6 },
			{ level: 5, base: 5.75, odd: 6 }
		]
	},
	{
		taste: 'sweet',
		label: 'Sweet',
		substance: 'caster sugar',
		unit: 'g',
		per: '1 litre of water',
		note: 'Sweetness fatigues fast. Rinse and wait between trials or the ladder measures your patience.',
		levels: [
			{ level: 1, base: 8, odd: 16 },
			{ level: 2, base: 11, odd: 16 },
			{ level: 3, base: 13, odd: 16 },
			{ level: 4, base: 14.5, odd: 16 },
			{ level: 5, base: 15, odd: 16 }
		]
	},
	{
		taste: 'acid',
		label: 'Acid',
		substance: 'white wine vinegar',
		unit: 'ml',
		per: '1 litre of water',
		note: 'Millilitres, not grams, and the same vinegar in both jugs: two acids is a different question.',
		levels: [
			{ level: 1, base: 4, odd: 8 },
			{ level: 2, base: 5.5, odd: 8 },
			{ level: 3, base: 6.5, odd: 8 },
			{ level: 4, base: 7, odd: 8 },
			{ level: 5, base: 7.5, odd: 8 }
		]
	},
	{
		taste: 'bitter',
		label: 'Bitter',
		substance: 'strong brewed black tea, cooled',
		unit: 'ml',
		per: '1 litre of water',
		note: 'Bitterness lingers longest of the five. Longer gaps between trials than the others.',
		levels: [
			{ level: 1, base: 20, odd: 50 },
			{ level: 2, base: 30, odd: 50 },
			{ level: 3, base: 38, odd: 50 },
			{ level: 4, base: 43, odd: 50 },
			{ level: 5, base: 46, odd: 50 }
		]
	},
	{
		taste: 'umami',
		label: 'Umami',
		substance: 'light soy sauce',
		unit: 'ml',
		per: '1 litre of water',
		note: 'Soy carries salt with it, so this ladder is honestly salt-and-umami together. Run the salt ladder first or you are measuring two things at once.',
		levels: [
			{ level: 1, base: 3, odd: 8 },
			{ level: 2, base: 5, odd: 8 },
			{ level: 3, base: 6, odd: 8 },
			{ level: 4, base: 7, odd: 8 },
			{ level: 5, base: 7.5, odd: 8 }
		]
	},
	{
		taste: 'seasoned',
		label: 'Flat against seasoned',
		substance: 'fine salt',
		unit: 'g',
		per: '1 litre of unsalted stock',
		note: 'The one that is actually the job. Same stock in both jugs: a different batch is a different test, and the repair table calls a flat plate the commonest fault there is.',
		levels: [
			{ level: 1, base: 0, odd: 5 },
			{ level: 2, base: 2, odd: 5 },
			{ level: 3, base: 3, odd: 5 },
			{ level: 4, base: 4, odd: 5 },
			{ level: 5, base: 4.5, odd: 5 }
		]
	}
];

/** `cal-<taste>-<level>`: the slug a cleared level is logged under. */
/** @param {string} taste @param {number} level */
export const slugFor = (taste, level) => `cal-${taste}-${level}`;
