/**
 * The World Table: data model.
 *
 * The original stored nine terse keys per recipe (n/c/k/d/t/v/i/m/p) and guessed
 * everything else with regexes at render time, ~970 times per keystroke. Here the
 * authored fields keep their meaning under readable names, and every derived
 * field is computed once by `npm run build:data` and committed as JSON, so a
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
	/** Continent, or "United States", or "The Atlases". The rail's first level. */
	group: string;
	/**
	 * Country, or a US super-region. The rail's second level. Null for the
	 * Atlases, which are not places and are listed flat.
	 */
	subgroup: string | null;
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
	/**
	 * The step split into work and waiting: see tools/derive/service.mjs.
	 *
	 * `durationSec` above is the COOK MODE TIMER's number and is deliberately
	 * untouched: it is the first duration in the step, which is what a timer
	 * should count. These two are the whole step, and they are what a service
	 * plan is built from. A dish's elapsed time is the sum of both; the cook is
	 * only occupied for the first.
	 *
	 * Optional because family recipes are authored in the browser and carry
	 * neither. Treat a missing split as all hands-on: the honest reading of a
	 * step nobody has measured.
	 */
	handsOnSec?: number;
	unattendedSec?: number;
	/** True when the hands-on figure includes the four-minute default guess. */
	estimated?: boolean;
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
	 * about substitution constructions; see tools/derive/diet.mjs.
	 */
	vegetarianStrict: boolean;
	/** Animal products appear, but only in optional or "or" positions. */
	vegetarianOption: boolean;
	vegan: boolean;
	/**
	 * The same reading as `vegetarianOption`, one product group further in:
	 * vegan by the binding reading, but dairy, egg or honey is named somewhere
	 * and the recipe states the route around it ("niter kibbeh or oil"). Never
	 * true alongside `vegan` or `vegetarianOption`; see tools/derive/diet.mjs.
	 */
	veganOption: boolean;
	containsMeat: boolean;
	containsPork: boolean;
	containsFish: boolean;
	containsShellfish: boolean;
	containsDairy: boolean;
	containsEgg: boolean;
	containsGluten: boolean;
	containsNuts: boolean;
	containsAlcohol: boolean;
	containsSesame: boolean;
	containsSoy: boolean;
	/** The statutory list separates peanuts from tree nuts; so does this. */
	containsPeanut: boolean;
	containsCelery: boolean;
	containsMustard: boolean;
	/** And molluscs from crustaceans. containsShellfish still covers both. */
	containsMollusc: boolean;
	containsLupin: boolean;
	/** Not an allergen: derived for the vegan claim. See lib/allergens.ts. */
	containsHoney: boolean;
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
	region: { kind: RegionKind; group: string; subgroup: string | null };
	source: 'guide' | 'family';
	/** Length of the "from the pass" note: drives the backfill report. */
	noteChars: number;
	/**
	 * The longest wait the method asks a cook to sit through, in minutes, and
	 * the words it was read from so a card can quote rather than paraphrase.
	 *
	 * ABSENT, not zero, when there is none: only about a tenth of the corpus
	 * carries one, and the index ships to every page. `minutes` is unaffected
	 * and still means active work, which is why both are needed to answer
	 * "can I eat this tonight". See tools/derive/advance.mjs.
	 */
	advanceMin?: number;
	advancePhrase?: string;
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
	/** Index into pairings.json: 41 distinct outcomes across 970 recipes. */
	pairingId: number;
	films: Films;
	/** Slugs into the lexicon: scored at build time, not "first three hits". */
	lexiconTerms: string[];
	/** Pantry item labels this recipe calls for. */
	pantryItems: string[];
	/**
	 * What a correct plate looks like at the pass. AUTHORED, not derived; see
	 * tools/derive/standards.mjs. Absent on dishes that have none yet, which is
	 * most of them: test for the key, never render an empty block.
	 */
	standard?: DishStandard;
	/**
	 * Technique standards this dish is judged against instead, when it has no
	 * dish standard of its own: slugs into technique-standards.json, ordered
	 * most-specific-first and capped at two. Present on 638 of the 925 dishes
	 * that carry no `standard`. Mutually exclusive with it, and gated as such.
	 */
	judgedBy?: string[];
}

/**
 * The one thing the guide never said. A recipe teaches a cook to MAKE a dish;
 * this is how they know they got it right.
 */
/**
 * One checkable mark, and the frozen id a cook's annotation points at.
 *
 * IDS, NEVER INDICES. "The crust mark was off" stored as index 2 is silently
 * repointed to a different sentence the day somebody inserts a mark above it,
 * and no gate can see that happen. The id is minted once by
 * tools/mint-mark-ids.mjs and held by a ledger the build refuses to let shrink,
 * which is the same rule the Codex holds for question ids.
 */
export interface StandardMark {
	/** `<standard-slug>#<token>`, frozen at mint. Never recomputed. */
	id: string;
	text: string;
}

export interface DishStandard {
	slug: string;
	/** 3–5 marks, checkable at the pan, in the order a cook would check them. */
	marks: StandardMark[];
	/** The commonest real failure, and what it looks like on the plate. */
	fault: string;
}

/**
 * What correct execution of a TECHNIQUE looks like, for the 925 dishes that
 * have no standard of their own: see tools/derive/technique-standards.mjs.
 *
 * The difference from a DishStandard is where it is read. A dish standard is
 * read at the pass, when the plate is done and the verdict is final; a
 * technique standard is read at the pan, while there is still something to be
 * done about it.
 */
export interface TechniqueStandard {
	slug: string;
	/** The technique's display label, carried so the recipe page need not load
	 *  techniques.json (119KB) merely to name it. */
	label: string;
	/** How many recipes exercise this technique: the measure of how much of
	 *  the corpus one piece of writing reaches. */
	recipeCount: number;
	/** 3–5 marks, checkable at the pan, in the order a cook would check them. */
	marks: StandardMark[];
	/** The commonest real failure, and the diagnosis. */
	fault: string;
}

export type Recipe = RecipeSummary & RecipeDetail;

export interface LexiconEntry {
	slug: string;
	term: string;
	category: string;
	definition: string;
	/** Recipe slugs that demonstrate this term: capped at 3 by crosslinks.mjs. */
	recipes: string[];
}

/**
 * A skill the guide teaches, with every recipe that demonstrates it.
 *
 * The complement to LexiconEntry: a term is capped at three recipes because it
 * is a definition card, whereas a Technique carries the complete set, which is
 * the whole point of the technique pages.
 */
/**
 * One chosen film, with enough about it to be worth clicking.
 *
 * The title and channel are the real ones as YouTube reports them, not a
 * description of them, which is what lets tools/check-films.mjs notice an id
 * that still resolves but no longer points at the film it was chosen for.
 */
export interface TechniqueFilm {
	url: string;
	id: string;
	title: string;
	channel: string;
	/** The specific moment the skill happens: what a search box cannot give. */
	watchFor: string;
}

export interface Technique {
	slug: string;
	label: string;
	/** A search for studying this skill on film. */
	query: string;
	/** The chosen film for this skill, or null when the reader gets a search.
	 *  Checked against YouTube, title and channel included, by check-films. */
	film: TechniqueFilm | null;
	/** The lexicon term that defines this skill, when one does. */
	lexiconSlug: string | null;
	lexiconTerm: string | null;
	/** Copied from the lexicon at build time: see build-data.mjs for why. */
	definition: string | null;
	origin: 'original' | 'supplement';
	/** How many distinct chapters demonstrate it, a breadth signal. */
	chapters: number;
	/** Semesters of the Path that teach this skill. Empty for 55 of the 103. */
	semesters: { n: number; title: string }[];
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
	/** Lexicon slugs: the reading that explains why the dishes work. */
	terms: string[];
	/**
	 * Skills this semester's dishes demonstrate, heaviest first. Derived from the
	 * recipes, never authored, so it cannot drift from what the semester cooks.
	 */
	skills: { slug: string; label: string; dishes: number }[];
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

/**
 * "Under 40 min": the original's threshold, kept, and the wait past which a
 * dish has to be started the day before.
 *
 * Both are defined in tools/derive/advance.mjs and re-exported here, the way
 * slug.ts re-exports slugify, so that the number build-data reports against and
 * the number the filter applies are the same number.
 */
export { QUICK_MINUTES, ADVANCE_MIN } from '../../tools/derive/advance.mjs';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
	1: 'Easy',
	2: 'Intermediate',
	3: 'Advanced'
};

/**
 * The palate: tasting, diagnosing, and correcting a dish.
 *
 * Structure over the guide's own "Repair Table" and "Tasting Vocabulary"
 * entries rather than new content; tools/derive/palate.mjs states exactly what
 * is checked against what, and the build fails if the two drift apart.
 */
export interface PalateLever {
	/** The correction, as an instruction. Gentlest first. */
	move: string;
	note: string;
}

export interface PalateFault {
	slug: string;
	label: string;
	/** What it tastes like: the entry names the fault but never describes it. */
	symptom: string;
	levers: PalateLever[];
}

export interface Palate {
	/** The two Flavor Atlas entries all of this is read out of. */
	repair: { slug: string; term: string; definition: string };
	protocol: { slug: string; term: string; definition: string };
	metaRule: string;
	faults: PalateFault[];
}

/**
 * Menu economics, the bands and quadrants a costing sheet is scored against.
 *
 * Every number is the guide's own and is checked against the prose at build
 * time; see tools/derive/economics.mjs for what is gated against what.
 */
export interface EconomicsBand {
	key: string;
	label: string;
	lowPct: number;
	highPct: number;
	note: string;
}

export interface EconomicsQuadrant {
	key: 'star' | 'plowhorse' | 'puzzle' | 'dog';
	label: string;
	popular: boolean;
	profitable: boolean;
	advice: string;
}

export interface Economics {
	/** The lexicon entries all of this is read out of. */
	entries: Record<string, { slug: string; term: string; definition: string }>;
	bands: EconomicsBand[];
	quadrants: EconomicsQuadrant[];
	/** The guide's own warning about costing raw invoice prices. */
	yieldWarning: string;
}

/**
 * The waste log's vocabulary.
 *
 * Carried and gated by tools/derive/waste.mjs. Note what is NOT here: there is
 * no reason code for THEFT, and that is not an oversight: the guide answers
 * theft with "systems, not suspicion" and warns against a surveillance state,
 * and a bin with a THEFT button on it is the accusation made before the
 * evidence. `excluded` carries it, and vendor creep, as refusals with reasons,
 * so the reverse gate can tell a considered refusal from a quiet gap.
 */
export interface WasteReason {
	key: string;
	label: string;
	/** The leak from the guide's own leak meter that this code accounts for. */
	covers: string;
	hint: string;
	/** The phrase in the guide that this code is read out of. */
	evidence: string;
}

export interface WasteVocabulary {
	entries: Record<string, { slug: string; term: string; definition: string }>;
	reasons: WasteReason[];
	excluded: Array<{ key: string; covers: string; why: string }>;
	/** The reason key the guide calls the most common cause. */
	villain: string;
	cultureNote: string;
}

/**
 * Sanitation: the guide's food-safety entries, and its silences.
 *
 * Carried and gated by tools/derive/sanitation.mjs. Note what is NOT here:
 * there is no per-recipe hazard type, because all five candidate hazard rules
 * were measured unshippable and a gate in that module refuses any field naming
 * recipes. See the module header before adding one.
 */
export interface SanitationClause {
	key: string;
	anchor: string;
	text: string;
}

export interface SanitationFact {
	key: string;
	anchor: string;
	/** The guide's own words, re-checked against the entry at build time. */
	evidence: string;
}

export interface SanitationNumeric {
	key: string;
	label: string;
	anchor: string;
	evidence: string;
	numbers: number[];
}

export interface SanitationConflict {
	a: { anchor: string; term: string; evidence: string; numbers: number[] };
	b: { anchor: string; term: string; evidence: string; numbers: number[] };
}

export interface SanitationGap {
	key: string;
	/** What the guide DOES name. */
	named: string;
	/** What it never states. */
	gap: string;
}

export interface Sanitation {
	entries: Record<string, { slug: string; term: string; definition: string }>;
	clauses: SanitationClause[];
	facts: SanitationFact[];
	numeric: SanitationNumeric[];
	/**
	 * The guide's C/F pair disagrees with the app's own converter (4°C rounds to
	 * 39°F; the guide writes 40°F). The pair is rendered as one opaque string and
	 * never recomputed; the disagreement is gated so it cannot go stale.
	 */
	cf: { lowC: number; lowF: number; converted: number; disagrees: boolean };
	/** The guide states two different danger windows. Disclosed, not resolved. */
	conflict: SanitationConflict | null;
	gaps: SanitationGap[];
	framing: { jurisdiction: string } | null;
}

/**
 * The Service Track: an authored teaching ORDER over the five front-of-house
 * atlases. Terms are referenced by slug only; the definitions stay in
 * lexicon.json, which is already a lazy chunk. See tools/derive/service-track.mjs.
 */
export interface ServiceTermRef {
	slug: string;
	term: string;
	category: string;
}

export interface ServiceModule {
	key: string;
	/** 1-based position in the teaching order. */
	n: number;
	title: string;
	/** What a person can do after it, a claim that could be checked. */
	outcome: string;
	terms: ServiceTermRef[];
}

export interface ServiceTrack {
	modules: ServiceModule[];
	total: number;
	fohTotal: number;
	categories: Record<string, number>;
	/** Cellar bottle -> the term that teaches it, or null where none does. */
	cellar: Array<{ bottle: string; name: string; term: string | null }>;
	untaught: string[];
}

/** Drill cards: see tools/derive/drills.mjs. Prompts ship REDACTED. */
export interface Drills {
	cards: import('./drill').DrillCard[];
	categories: Record<string, number>;
}

/**
 * The brigade's stations: see tools/derive/stations.mjs. The station list is
 * the guide's own; the technique map is authored and gated in both directions.
 */
export interface StationsData {
	stations: Array<{ key: string; name: string; techniques: string[] }>;
	/** Dishes reachable per station, so a page can size it without techniques.json. */
	dishes: Record<string, number>;
	/** The guide's own words on the swing cook. */
	tournant: string;
	/** Cross-station literacy: counted separately, owned by nobody. */
	foundation: string[];
	/** Techniques the corpus does not actually drill. Never counted. */
	undrilled: string[];
}
