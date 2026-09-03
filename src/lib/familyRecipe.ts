/**
 * Is this thing a family recipe, or is it whatever was in the file?
 *
 * A `.wtjson` is a file somebody mails to a colleague, so it is also a file
 * somebody can hand-edit, truncate or half-write. Every other list in
 * `mergeSessions` already screens what it takes in - `calibrationLog` refuses an
 * entry without a string slug and a numeric `at`, `menuDishes` refuses one
 * without an id - and `familyRecipes` took whatever arrived, deduplicating on a
 * `slug` it never checked was there.
 *
 * WHAT THAT COST, measured against 40 real recipes rather than argued:
 *
 *   missing flavorTags + the search box   the WHOLE LIBRARY throws and goes blank
 *   missing diet       + Vegetarian       the WHOLE LIBRARY throws and goes blank
 *   missing season     + In season        the WHOLE LIBRARY throws and goes blank
 *   missing name       + the search box   dropped quietly, library fine
 *   everything else                       kept or dropped quietly, library fine
 *
 * So the survey's framing - "silently absent from the Library on every later
 * load" - is the MILD half. `applyFilters` maps across every recipe at once, so
 * one malformed record does not hide itself; it takes the grid down with it, and
 * it does so the moment the cook types a letter into search. It is a crash, not
 * an omission, and it persists, so it happens again on every load until the
 * import is undone.
 *
 * The rule this module states is the one `buildFamilyRecipe` already satisfies.
 * It is deliberately SHAPE-only: is the field there and is it the right kind of
 * thing. It does not judge values - an unknown course or a 0-minute dish is the
 * author's business, and refusing those would reject recipes the app itself
 * wrote in an earlier version.
 */
import type { Recipe } from './types';

/**
 * The fields the Library reads without guarding, in the order it reads them.
 *
 * `flavorTags`, `diet` and `season` are the three that throw; the rest are here
 * because a record missing them is not a recipe and shipping it only defers the
 * next surprise to a page that has not been measured.
 */
const REQUIRED: Array<[keyof Recipe, (v: unknown) => boolean, string]> = [
	['slug', (v) => typeof v === 'string' && v.length > 0, 'a slug'],
	['name', (v) => typeof v === 'string' && v.length > 0, 'a name'],
	['chapter', (v) => typeof v === 'string', 'a chapter'],
	['chapterSlug', (v) => typeof v === 'string' && v.length > 0, 'a chapter slug'],
	['course', (v) => typeof v === 'string', 'a course'],
	['difficulty', (v) => typeof v === 'string', 'a difficulty'],
	['minutes', (v) => typeof v === 'number' && Number.isFinite(v), 'a time in minutes'],
	['diet', (v) => !!v && typeof v === 'object', 'diet flags'],
	['flavorTags', (v) => Array.isArray(v), 'flavour tags'],
	['season', (v) => Array.isArray(v), 'a season list'],
	['source', (v) => v === 'family', 'source: family']
];

/**
 * What is wrong with it, or null if nothing is.
 *
 * Returns the REASON rather than a boolean because the import banner shows it:
 * a cook who is told "1 recipe skipped" learns nothing, and a cook who is told
 * "Nan's Stew: no flavour tags" can fix the file.
 */
export function familyRecipeProblem(r: unknown): string | null {
	if (!r || typeof r !== 'object' || Array.isArray(r)) return 'not a recipe';
	const rec = r as Record<string, unknown>;
	const missing = REQUIRED.filter(([k, ok]) => !ok(rec[k])).map(([, , label]) => label);
	if (!missing.length) return null;
	const name = typeof rec.name === 'string' && rec.name ? rec.name : 'One recipe';
	return `${name}: no ${missing.join(', no ')}`;
}

/** @returns the recipes worth keeping, and a line about each one that is not. */
export function screenFamilyRecipes(incoming: unknown): {
	kept: Recipe[];
	rejected: string[];
} {
	const kept: Recipe[] = [];
	const rejected: string[] = [];
	for (const r of Array.isArray(incoming) ? incoming : []) {
		const problem = familyRecipeProblem(r);
		if (problem) rejected.push(problem);
		else kept.push(r as Recipe);
	}
	return { kept, rejected };
}
