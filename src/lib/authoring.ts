/**
 * Turning a filled-in form into a real Recipe — the Family Chapter.
 *
 * A family recipe carries the SAME shape as a guide recipe, so every view
 * (grid, pantry match, menu, cook mode) handles it without special cases. The
 * derived fields the build pipeline computes for guide recipes are given honest
 * client-side stand-ins here: what can be computed cheaply is computed the same
 * way (sections, step durations, pantry matching); what cannot (flavor prose,
 * sommelier pairing, lexicon links) defaults to something true rather than
 * something invented.
 */
import type { PantryGroup, Recipe, Course, Difficulty } from './types';
import { bySlug } from './data';
import { slugify } from './slug';

export interface FamilyDraft {
	name: string;
	chapter: string;
	course: Course;
	difficulty: Difficulty;
	minutes: number;
	vegetarian: boolean;
	/** One ingredient per line, as typed. */
	ingredients: string;
	/** One step per line. */
	method: string;
	tip: string;
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
 * A slug that collides with nothing — not the 970 guide recipes, not the other
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
	pantry: PantryGroup[]
): Recipe {
	const chapter = draft.chapter.trim() || 'Family';
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
		serves: 4,
		diet: {
			// The author's own claim — for their own recipe, the best source there is.
			vegetarian: draft.vegetarian,
			vegetarianStrict: draft.vegetarian,
			vegetarianOption: false,
			vegan: false,
			containsMeat: false,
			containsPork: false,
			containsFish: false,
			containsShellfish: false,
			containsDairy: false,
			containsEgg: false,
			containsGluten: false,
			containsNuts: false,
			containsAlcohol: false,
			confidence: 'reviewed'
		},
		costTier: 2,
		flavorTags: ['family'],
		season: [],
		region: { kind: 'world', group: 'The Family Chapter' },
		source: 'family',
		noteChars: note.length,

		ingredients: ingredients.map((line) =>
			isSectionHeader(line) ? { kind: 'section', label: line } : { kind: 'item', text: line }
		),
		steps: method.map((text) => ({ text, durationSec: stepDuration(text) })),
		note,
		equipment: [],
		techniques: [],
		flavor: {
			tags: ['family'],
			sentence: 'A dish of the house — the card in the drawer knows more than the guide does.'
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
		pantryItems
	};
}
