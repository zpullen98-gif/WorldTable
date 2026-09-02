/**
 * Turning a filled-in form into a real Recipe, the Family Chapter.
 *
 * A family recipe carries the SAME shape as a guide recipe, so every view
 * (grid, pantry match, menu, cook mode) handles it without special cases. The
 * derived fields the build pipeline computes for guide recipes are given honest
 * client-side stand-ins here: what can be computed cheaply is computed the same
 * way (sections, step durations, pantry matching); what cannot (flavor prose,
 * sommelier pairing, lexicon links) defaults to something true rather than
 * something invented.
 */
import type { PantryGroup, Recipe, Course, Difficulty, DietFlags } from './types';
// The guide's own allergen matcher, pure and importable; see the diet note below.
import { deriveDiet } from '../../tools/derive/diet.mjs';
import { bySlug } from './data';
import { slugify } from './slug';

export interface FamilyDraft {
	name: string;
	chapter: string;
	course: Course;
	difficulty: Difficulty;
	minutes: number;
	/**
	 * What the cook says it serves. Null when they did not say.
	 *
	 * Required-with-null rather than optional, deliberately: it forces every
	 * future draft builder to answer the question instead of silently inheriting
	 * a default, which is the failure this whole field is being fixed for.
	 */
	serves: number | null;
	vegetarian: boolean;
	/** One ingredient per line, as typed. */
	ingredients: string;
	/** One step per line. */
	method: string;
	tip: string;
	/**
	 * Technique-standard slugs the author ticked: what this dish is judged on.
	 *
	 * The picker is bounded to the 26 techniques that actually HAVE a standard
	 * written, which both shortens the list and guarantees the grade means
	 * something: a tick that resolves to no standard would put a dish back where
	 * it started, recorded as cooked and nothing more.
	 */
	techniques: string[];
}

/**
 * How many techniques an author may tick.
 *
 * Four, against the two that will actually be shown. The gap is deliberate: a
 * cook ticking what the dish exercises is describing it, and the app decides
 * which two of those say most. See resolveJudgedBy.
 */
export const FAMILY_TECHNIQUE_MAX = 4;

/**
 * The same resolution build-data.mjs runs over the 970, applied to one house
 * dish: keep the ticks that name a written standard, order them RAREST FIRST
 * because the technique applying to fewest dishes says most about this one, and
 * cap at two.
 *
 * `judgedBy[0]` is what cook mode grades, so the order is load-bearing here for
 * exactly the reason it is there.
 */
export const FAMILY_JUDGED_BY_MAX = 2;

export function resolveJudgedBy(
	ticked: readonly string[],
	standards: ReadonlyArray<{ slug: string; recipeCount: number }>
): string[] {
	const bySlug = new Map(standards.map((s) => [s.slug, s]));
	return [...new Set(ticked)]
		.filter((slug) => bySlug.has(slug))
		.sort((a, b) => bySlug.get(a)!.recipeCount - bySlug.get(b)!.recipeCount)
		.slice(0, FAMILY_JUDGED_BY_MAX);
}

/** Same rule as the build pipeline's section detector (see build-data.mjs). */
function isSectionHeader(s: string): boolean {
	const t = s.trim();
	if (t.length < 4 || t.length > 40) return false;
	if (/[0-9]/.test(t)) return false;
	return t === t.toUpperCase() && /[A-Z]/.test(t);
}

/** Same regex the pipeline uses for step durations (see build-data.mjs). */
function stepDuration(text: string): number | null {
	const m = text.match(/(\d+)\s*(?:[–-]\s*(\d+))?\s*(min|minute|h\b|hour)/i);
	if (!m) return null;
	let v = parseInt(m[2] || m[1], 10);
	if (m[3].toLowerCase().startsWith('h')) v *= 60;
	return Math.min(v, 600) * 60;
}

/**
 * A slug that collides with nothing: not the 970 guide recipes, not the other
 * family recipes. Guide collisions get a "-family" qualifier (your Elote and
 * the guide's Elote are different dishes); further collisions count up.
 */
export function familySlug(name: string, existingFamily: Recipe[]): string {
	const taken = (s: string) =>
		bySlug.has(s) || existingFamily.some((r) => r.slug === s);

	const base = slugify(name);
	if (!taken(base)) return base;
	if (!taken(`${base}-family`)) return `${base}-family`;
	let n = 2;
	while (taken(`${base}-family-${n}`)) n++;
	return `${base}-family-${n}`;
}

const nonEmptyLines = (text: string) =>
	text
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);

export function validateDraft(d: FamilyDraft): string | null {
	if (!d.name.trim()) return 'The dish needs a name.';
	if (!nonEmptyLines(d.ingredients).length) return 'List at least one ingredient.';
	if (!nonEmptyLines(d.method).length) return 'Write at least one step.';
	if (!Number.isFinite(d.minutes) || d.minutes < 1) return 'How many minutes does it take?';
	return null;
}

export function buildFamilyRecipe(
	draft: FamilyDraft,
	existingFamily: Recipe[],
	pantry: PantryGroup[],
	/** The 26 written technique standards, for resolving what this is judged on. */
	standards: ReadonlyArray<{ slug: string; label: string; recipeCount: number }> = []
): Recipe {
	const chapter = draft.chapter.trim() || 'Family';
	const ticked = (draft.techniques ?? []).slice(0, FAMILY_TECHNIQUE_MAX);
	const judgedBy = resolveJudgedBy(ticked, standards);
	const labelOf = new Map(standards.map((x) => [x.slug, x.label]));
	const techniqueLabels = ticked.map((slug) => labelOf.get(slug) ?? slug);
	const ingredients = nonEmptyLines(draft.ingredients);
	const method = nonEmptyLines(draft.method);
	const note = draft.tip.trim();

	// Same narrow blob the pantry matcher uses for guide recipes: name +
	// ingredients, so a family stew shows up in Pantry Match like any other.
	const narrow = `${draft.name} ${ingredients.join(' ')}`.toLowerCase();
	const pantryItems = pantry
		.flatMap((g) => g.items)
		.filter((it) => it.keywords.some((k) => narrow.includes(k)))
		.map((it) => it.label);

	const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

	return {
		slug: familySlug(draft.name, existingFamily),
		name: draft.name.trim(),
		chapter,
		chapterSlug: slugify(chapter),
		course: draft.course,
		difficulty: draft.difficulty,
		minutes: Math.round(draft.minutes),
		/*
		 * Asked, not stamped. This was `serves: 4` on a recipe the COOK typed,
		 * from a form that never asked - the same shape as the allergen defect
		 * described immediately below, which put "reviewed by hand" over
		 * ingredients nobody had screened.
		 */
		...(draft.serves && draft.serves > 0 ? { serves: Math.round(draft.serves) } : {}),
		/**
		 * The REAL screen, not a wall of hardcoded falses. This literal used to
		 * set every contains* flag to false with confidence 'reviewed', and the
		 * detail view then rendered "None found among the 14 screened; reviewed
		 * by hand" over ingredients nobody had screened: clearance language, with
		 * a human endorsement stapled on, for a family recipe that could be
		 * peanut brittle. diet.mjs is a pure module with no imports, so the same
		 * matcher the guide's 970 recipes go through runs here on the author's
		 * own ingredient lines. Only `vegetarian` stays the author's claim: that
		 * is a judgement about the dish; the allergen flags are facts about the
		 * text, and the text is right there.
		 */
		diet: {
			...(deriveDiet({ n: draft.name, i: ingredients, v: draft.vegetarian }) as DietFlags),
			confidence: 'derived'
		},
		costTier: 2,
		flavorTags: ['family'],
		season: [],
		region: { kind: 'world', group: 'The Family Chapter', subgroup: null },
		source: 'family',
		noteChars: note.length,

		ingredients: ingredients.map((line) =>
			isSectionHeader(line) ? { kind: 'section', label: line } : { kind: 'item', text: line }
		),
		steps: method.map((text) => ({ text, durationSec: stepDuration(text) })),
		note,
		equipment: [],
		// The author's ticked labels, for "THE SKILLS INSIDE" on the page. These
		// are SELF-DECLARED and can never reach /coverage: the board is driven by
		// techniques.json's audited recipe lists (coverage/+page.ts builds
		// recipesByTechnique from them), and no family slug appears in one. That
		// is a structural property, not a convention; see authoring.test.ts.
		techniques: techniqueLabels,
		flavor: {
			tags: ['family'],
			sentence: 'A dish of the house: the card in the drawer knows more than the guide does.'
		},
		// -1 = "no sommelier ruling"; the recipe page substitutes the universal
		// donor pairing. See DEFAULT_PAIRING in data.ts.
		pairingId: -1,
		films: {
			search: {
				label: 'This dish, cooked on camera',
				url: YT(`${draft.name.trim()} recipe`),
				sub: `Search films of ${draft.name.trim()}`
			},
			techniques: [],
			teacher: {
				label: 'The cuisine, deeper',
				url: YT(`${chapter} cooking techniques`),
				sub: `Technique films from the ${chapter} kitchen`
			}
		},
		lexiconTerms: [],
		pantryItems,
		// Absent rather than empty, matching the 970: the recipe page tests for
		// the key, and an empty array would render a heading over nothing.
		...(judgedBy.length ? { judgedBy } : {})
	};
}
