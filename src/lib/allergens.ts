/**
 * What the allergen block actually knows, and what it does not.
 *
 * The recipe page shipped a heading that read "Contains", rendered only when at
 * least one flag was true. That is a display bug with a dangerous direction.
 *
 * MEASURED: 101 of 970 recipes have all seven displayed flags false and
 * therefore render NOTHING AT ALL. Hummus is one of them: over an ingredient
 * line reading "150g good tahini". So is mapo tofu, over soy. A reader who has
 * learned that this app lists allergens reads that silence as "no allergens",
 * when what it means is "this app did not look".
 *
 * diet.mjs already states the policy the display was breaking, in its own
 * words: an empty list "reads as 'no allergens' rather than 'we don't know'".
 *
 * The honest fix is not to widen the vocabulary today: that is a diet.mjs
 * project with a keyword-table review across 970 recipes and its own build
 * gates. It is to stop absence reading as clearance in the meantime, by naming
 * what was screened and what was not. Rough prevalence of the unscreened, by
 * ingredient-text probe: sulphites 157, soy 95, celery 78, mustard 72, sesame
 * 40, molluscs 38, peanuts 30, lupin 0.
 *
 * `allergens.test.ts` asserts that every `contains*` key diet.mjs produces is
 * named in one of these two lists, so widening the derivation without widening
 * the display fails the build, and that NOT_SCREENED stays non-empty, so the
 * day the vocabulary is genuinely closed, the copy is forced to change.
 */

/** The fourteen the recipe page derives and displays, less the one it cannot. */
export const CHECKED = [
	'gluten',
	'dairy',
	'egg',
	'nuts',
	'peanuts',
	'fish',
	'shellfish',
	'molluscs',
	'soy',
	'sesame',
	'celery',
	'mustard',
	'lupin',
	'alcohol'
] as const;

/**
 * Still not derived, and now for a reason rather than a backlog: the sulphite
 * declaration threshold is a CONCENTRATION (10mg/kg), not an ingredient name,
 * and no ingredient line states how the wine was made. A lexical rule here
 * would be the confident wrong answer, the shape the hazard-rule survey
 * measured five times and refused five times. Listed so the page keeps saying
 * so rather than implying absence.
 */
export const NOT_SCREENED = ['sulphites'] as const;

/** The diet-flag keys the seven above correspond to, for the closure test. */
export const CHECKED_FLAGS = [
	'containsGluten',
	'containsDairy',
	'containsEgg',
	'containsNuts',
	'containsPeanut',
	'containsFish',
	'containsShellfish',
	'containsMollusc',
	'containsSoy',
	'containsSesame',
	'containsCelery',
	'containsMustard',
	'containsLupin',
	'containsAlcohol'
] as const;

/**
 * Flags diet.mjs derives that are NOT allergens and are correctly absent from
 * the screen. Kept named so the closure test can tell "not an allergen" from
 * "an allergen we forgot to display".
 *
 * `containsHoney` is derived for the VEGAN claim, which is a different question
 * from allergy. Honey is not one of the fourteen, and adding it to the screened
 * line would widen a regulated list with something that does not belong on it.
 * This list is what stops that being mistaken for an oversight: the closure
 * test fired the moment the flag existed, which is how it got here.
 */
export const NOT_ALLERGENS = ['containsMeat', 'containsPork', 'containsHoney'] as const;

export const list = (xs: readonly string[]) => xs.join(', ');
