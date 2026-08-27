/**
 * What the allergen block actually knows, and what it does not.
 *
 * The recipe page shipped a heading that read "Contains", rendered only when at
 * least one flag was true. That is a display bug with a dangerous direction.
 *
 * MEASURED: 101 of 970 recipes have all seven displayed flags false and
 * therefore render NOTHING AT ALL. Hummus is one of them — over an ingredient
 * line reading "150g good tahini". So is mapo tofu, over soy. A reader who has
 * learned that this app lists allergens reads that silence as "no allergens",
 * when what it means is "this app did not look".
 *
 * diet.mjs already states the policy the display was breaking, in its own
 * words: an empty list "reads as 'no allergens' rather than 'we don't know'".
 *
 * The honest fix is not to widen the vocabulary today — that is a diet.mjs
 * project with a keyword-table review across 970 recipes and its own build
 * gates. It is to stop absence reading as clearance in the meantime, by naming
 * what was screened and what was not. Rough prevalence of the unscreened, by
 * ingredient-text probe: sulphites 157, soy 95, celery 78, mustard 72, sesame
 * 40, molluscs 38, peanuts 30, lupin 0.
 *
 * `allergens.test.ts` asserts that every `contains*` key diet.mjs produces is
 * named in one of these two lists, so widening the derivation without widening
 * the display fails the build — and that NOT_SCREENED stays non-empty, so the
 * day the vocabulary is genuinely closed, the copy is forced to change.
 */

/** The seven the recipe page derives and displays. */
export const CHECKED = [
	'gluten',
	'dairy',
	'egg',
	'nuts',
	'fish',
	'shellfish',
	'alcohol'
] as const;

/**
 * Named on the UK/EU list of 14 and NOT derived here. Listed explicitly so the
 * page can say so rather than imply their absence.
 */
export const NOT_SCREENED = [
	'sesame',
	'soy',
	'celery',
	'mustard',
	'sulphites',
	'lupin',
	'molluscs separately',
	'peanuts separately'
] as const;

/** The diet-flag keys the seven above correspond to, for the closure test. */
export const CHECKED_FLAGS = [
	'containsGluten',
	'containsDairy',
	'containsEgg',
	'containsNuts',
	'containsFish',
	'containsShellfish',
	'containsAlcohol'
] as const;

/**
 * Flags diet.mjs derives that are NOT allergens and are correctly absent from
 * the screen. Kept named so the closure test can tell "not an allergen" from
 * "an allergen we forgot to display".
 */
export const NOT_ALLERGENS = ['containsMeat', 'containsPork'] as const;

export const list = (xs: readonly string[]) => xs.join(', ');
