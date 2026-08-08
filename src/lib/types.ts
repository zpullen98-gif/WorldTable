/**
 * The World Table — data model.
 *
 * The original stored nine terse keys per recipe (n/c/k/d/t/v/i/m/p) and guessed
 * everything else with regexes at render time, ~970 times per keystroke. Here the
 * authored fields keep their meaning under readable names, and every derived
 * field is computed once by `npm run build:data` and committed as JSON — so a
 * regex tweak shows up as a reviewable diff instead of a behaviour change nobody
 * can see.
 */

export type Course =
	| 'Main'
	| 'Dessert'
	| 'Soup'
	| 'Starter'
	| 'Side'
	| 'Breakfast'
	| 'Bread'
	| 'Sauce'
	| 'Salad'
	| 'Drink';

export type Difficulty = 1 | 2 | 3;

/** Which shelf of the guide a chapter sits on. */
export type RegionKind = 'world' | 'us' | 'atlas';

export interface ChapterRef {
	/** Display name, e.g. "Cajun & Creole" */
	name: string;
	slug: string;
	kind: RegionKind;
	/** For US chapters, the rail super-region ("The South"). Else the kind label. */
	group: string;
	count: number;
}

/**
 * Ingredient lines are a tagged union rather than raw strings.
 *
 * The original detected "FOR THE TOPPING" style headers with a heuristic
 * (length 4-40, no digits, equal to its own uppercase) re-run on every render in
 * three separate places. It misfires on any short all-caps ingredient. We run
 * that heuristic exactly once, at build time, and freeze the result.
 */
export type IngredientEntry =
	| { kind: 'section'; label: string }
	| { kind: 'item'; text: string };

export interface Step {
	text: string;
	/** Seconds, parsed from phrases like "simmer 20 min". Null when none found. */
	durationSec: number | null;
}

/**
 * Dietary facts. `vegetarian` is authored (the original's `v` flag) and trusted;
 * everything else is derived from ingredient keywords at build time.
 */
export interface DietFlags {
	/** Authored by hand in the original corpus, and trusted. */
	vegetarian: boolean;
	/**
	 * The literal reading: no animal product in any binding ingredient position.
	 * Differs from `vegetarian` on ~22 dishes because the corpus is inconsistent
	 * about substitution constructions — see tools/derive/diet.mjs.
	 */
	vegetarianStrict: boolean;
	/** Animal products appear, but only in optional or "or" positions. */
	vegetarianOption: boolean;
	vegan: boolean;
	containsMeat: boolean;
	containsPork: boolean;
	containsFish: boolean;
	containsShellfish: boolean;
	containsDairy: boolean;
	containsEgg: boolean;
	containsGluten: boolean;
	containsNuts: boolean;
	containsAlcohol: boolean;
	/** 'derived' = keywords only; 'reviewed'/'override' = a human ruled on it. */
	confidence: 'derived' | 'reviewed' | 'override';
}

export interface Pairing {
	pour: string;
	alt: string;
	beer: string;
	zeroProof: string;
	why: string;
}

export interface FlavorProfile {
	tags: string[];
	sentence: string;
}

export interface FilmLink {
	label: string;
	url: string;
	sub?: string;
}

export interface Films {
	/** A verified canon film of this exact dish, when one exists. */
	dish?: FilmLink;
	/** Always present: a search for the dish on film. */
	search: FilmLink;
	techniques: FilmLink[];
	teacher: FilmLink;
}

/** The lightweight record shipped eagerly to render the 970-card grid. */
export interface RecipeSummary {
	slug: string;
	name: string;
	chapter: string;
	chapterSlug: string;
	course: Course;
	difficulty: Difficulty;
	minutes: number;
	serves: number;
	diet: DietFlags;
	costTier: 1 | 2 | 3 | 4;
	flavorTags: string[];
	/** Months (1-12) this dish is at its peak, northern-hemisphere canonical. */
	season: number[];
	region: { kind: RegionKind; group: string };
	source: 'guide' | 'family';
	/** Length of the "from the pass" note — drives the backfill report. */
	noteChars: number;
}

/** The rest of a recipe, loaded lazily and precached for offline. */
export interface RecipeDetail {
	slug: string;
	ingredients: IngredientEntry[];
	steps: Step[];
	note: string;
	equipment: string[];
	techniques: string[];
	flavor: FlavorProfile;
	/** Index into pairings.json — 41 distinct outcomes across 970 recipes. */
	pairingId: number;
	films: Films;
	/** Slugs into the lexicon — scored at build time, not "first three hits". */
	lexiconTerms: string[];
	/** Pantry item labels this recipe calls for. */
	pantryItems: string[];
}

export type Recipe = RecipeSummary & RecipeDetail;

export interface LexiconEntry {
	slug: string;
	term: string;
	category: string;
	definition: string;
	/** Recipe slugs that demonstrate this term. */
	recipes: string[];
}

export interface PantryItem {
	label: string;
	slug: string;
	keywords: string[];
	blurb: string;
	/** Peak months, or empty when the item isn't seasonal produce. */
	season: number[];
}

export interface PantryGroup {
	group: string;
	items: PantryItem[];
}

export interface StudySemester {
	n: number;
	title: string;
	description: string;
	/** Recipe slugs, in teaching order. */
	recipes: string[];
	/** Lexicon slugs — the reading that explains why the dishes work. */
	terms: string[];
}

export interface Substitution {
	term: string;
	advice: string;
}

export interface CellarBottle {
	name: string;
	slug: string;
	note: string;
}

/** The filter state driving the recipe grid. Serialized into the URL. */
export interface FilterState {
	q: string;
	chapter: string | null;
	course: Course | null;
	difficulty: Difficulty | null;
	quick: boolean;
	vegetarian: boolean;
	season: boolean;
}

export const EMPTY_FILTERS: FilterState = {
	q: '',
	chapter: null,
	course: null,
	difficulty: null,
	quick: false,
	vegetarian: false,
	season: false
};

/** "Under 40 min" — the original's threshold, kept. */
export const QUICK_MINUTES = 40;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
	1: 'Easy',
	2: 'Intermediate',
	3: 'Advanced'
};
