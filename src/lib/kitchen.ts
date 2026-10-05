/**
 * Cook at home: the training kitchen, 400 dishes on the four levels.
 *
 * Twenty five each of breakfast, lunch, dinner and dessert at every level, so
 * a cook who finishes Chef has made a hundred of each. The dishes are written
 * once in src/lib/data/kitchen (proved by tools/kitchen/check-training.mjs)
 * and emitted by tools/derive/kitchen.mjs as one file per level under
 * static/kitchen-data/, fetched on demand and kept by the worker, never
 * precached, plus a slim index that IS precached so the lists and the
 * progress draw offline from the first launch.
 *
 * PURE apart from the two loaders, which take their fetch as an argument, so
 * the rules (the shape, the order, the progress, the next dish, the rating
 * words) are unit-tested under Node.
 *
 * ## How a cook is recorded
 *
 * Through the session's cookedLog, exactly like a Library recipe, so it counts
 * as cooking everywhere (the Repertoire, More's re-cook count, the day
 * studied) and comes back on repertoire.ts's ladder. The log's slug is
 * namespaced, `kitchen:<slug>`: more than a hundred kitchen slugs are also
 * Library recipe slugs (shakshuka, cacio-e-pepe), and a bare slug would fold
 * a training cook into the Library recipe's history and back. `slugify`
 * cannot emit a colon, so the prefix can never collide.
 *
 * The rating is a word, not a star: three words, each one of repertoire.ts's
 * grades, so the word a cook picks is what moves the re-cook interval (the
 * same rule cook mode's pass follows). Notes ride in the session's notes
 * under the same namespaced key.
 */
import type { CookEntry, Grade, RepertoireEntry } from './repertoire';
import { sinceLabel, DAY_MS, repertoire, dueList, scopeToSlugs } from './repertoire';

export const MEALS = ['breakfast', 'lunch', 'dinner', 'dessert'] as const;
export type Meal = (typeof MEALS)[number];
export const MEAL_LABEL: Readonly<Record<Meal, string>> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', dessert: 'Dessert' };

export const DIFFICULTIES = ['Steady', 'Stretching', 'Demanding'] as const;
export type KitchenDifficulty = (typeof DIFFICULTIES)[number];

/** Dishes per meal per level. */
export const PER_MEAL = 25;

export interface KitchenIngredient {
	item: string;
	us: string;
	metric: string;
	note: string;
}
export interface KitchenStep {
	n: number;
	do: string;
	look: string;
	mistake: string;
	fix: string;
}
export interface KitchenVideo {
	search: string;
	verified: { url: string; title: string; channel: string; verifiedBy: string } | null;
}

/** One training dish, the binding entry shape. */
export interface KitchenDish {
	slug: string;
	level: number;
	meal: Meal;
	n: number;
	title: string;
	cuisine: string;
	summary: string;
	skills: string[];
	buildsOn: string[];
	libraryRef: string;
	techniqueRefs: string[];
	serves: string;
	time: { active: number; total: number };
	difficulty: KitchenDifficulty;
	equipment: string[];
	ingredients: KitchenIngredient[];
	mise: string[];
	timeline: Array<{ at: string; do: string }>;
	steps: KitchenStep[];
	science: string;
	plating: string;
	pairing: { drink: string; brennans: string };
	variations: string[];
	safety: string[];
	video: KitchenVideo;
}

/** One row of the precached index: what a list and the progress need. */
export interface KitchenIndexRow {
	slug: string;
	level: number;
	meal: Meal;
	n: number;
	title: string;
	cuisine: string;
	active: number;
	total: number;
	difficulty: KitchenDifficulty;
	serves: string;
}
export interface KitchenIndex {
	version: number;
	meals: Meal[];
	perMeal: number;
	dishes: KitchenIndexRow[];
}
export interface KitchenLevelFile {
	version: number;
	level: number;
	dishes: KitchenDish[];
}

/* ---- the shape ---------------------------------------------------------- */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isStr = (v: unknown): v is string => typeof v === 'string';
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * What is wrong with one entry against the binding shape, as sentences; empty
 * when it holds. The loader refuses a level file with any problem rather than
 * drawing half a dish at the stove.
 */
export function dishProblems(d: unknown): string[] {
	const out: string[] = [];
	if (!d || typeof d !== 'object') return ['not an object'];
	const x = d as Record<string, unknown>;
	const at = isStr(x.slug) ? x.slug : '(no slug)';
	const p = (msg: string) => out.push(`${at}: ${msg}`);
	if (!isStr(x.slug) || !SLUG_RE.test(x.slug)) p('slug is not kebab case');
	if (!Number.isInteger(x.level) || (x.level as number) < 1 || (x.level as number) > 4) p('level is not a key from 1 to 4');
	if (!MEALS.includes(x.meal as Meal)) p('meal is not breakfast, lunch, dinner or dessert');
	if (!Number.isInteger(x.n) || (x.n as number) < 1 || (x.n as number) > PER_MEAL) p(`n is not 1 to ${PER_MEAL}`);
	for (const k of ['title', 'cuisine', 'summary', 'serves', 'science', 'plating'] as const) if (!isText(x[k])) p(`${k} is empty`);
	if (isText(x.summary)) {
		const s = (x.summary.trim().match(/[.!?](?=\s+[A-Z(]|\s*$)/g) ?? []).length;
		if (s < 2 || s > 3) p(`summary holds ${s} sentences, not 2 or 3`);
	}
	if (isText(x.science)) {
		const w = words(x.science);
		if (w < 80 || w > 160) p(`science is ${w} words, not 80 to 160`);
	}
	if (!isStrList(x.skills) || !x.skills.length) p('skills is not a list of names');
	if (!isStrList(x.buildsOn)) p('buildsOn is not a list of slugs');
	if (!isStr(x.libraryRef)) p('libraryRef is not a string');
	if (!isStrList(x.techniqueRefs)) p('techniqueRefs is not a list of slugs');
	const t = x.time as { active?: unknown; total?: unknown } | undefined;
	if (!t || typeof t.active !== 'number' || typeof t.total !== 'number' || t.active <= 0 || t.total < t.active) p('time is not {active, total} minutes with total at least active');
	if (!DIFFICULTIES.includes(x.difficulty as KitchenDifficulty)) p('difficulty is not Steady, Stretching or Demanding');
	if (!isStrList(x.equipment) || !x.equipment.length) p('equipment is empty');
	if (!Array.isArray(x.ingredients) || !x.ingredients.length) p('ingredients is empty');
	else
		x.ingredients.forEach((g, i) => {
			const r = g as Record<string, unknown>;
			if (!r || !isText(r.item) || !isText(r.us) || !isText(r.metric) || !isStr(r.note)) p(`ingredient ${i + 1} lacks item, us, metric or note`);
		});
	if (!isStrList(x.mise) || !x.mise.length) p('mise is empty');
	if (!Array.isArray(x.timeline) || !x.timeline.length) p('timeline is empty');
	else
		x.timeline.forEach((r, i) => {
			const e = r as Record<string, unknown>;
			if (!e || !isText(e.at) || !isText(e.do)) p(`timeline row ${i + 1} lacks at or do`);
		});
	if (!Array.isArray(x.steps) || x.steps.length < 6 || x.steps.length > 16) p('steps is not 6 to 16 steps');
	else
		x.steps.forEach((r, i) => {
			const s = r as Record<string, unknown>;
			if (!s || s.n !== i + 1) p(`step ${i + 1} is numbered ${String(s?.n)}`);
			for (const k of ['do', 'look', 'mistake', 'fix'] as const) if (!s || !isText(s[k])) p(`step ${i + 1} lacks ${k}`);
		});
	const pr = x.pairing as Record<string, unknown> | undefined;
	if (!pr || !isText(pr.drink) || !isStr(pr.brennans)) p('pairing is not {drink, brennans}');
	if (!isStrList(x.variations) || x.variations.length < 2 || x.variations.length > 3) p('variations is not 2 or 3');
	if (!isStrList(x.safety)) p('safety is not a list');
	const v = x.video as Record<string, unknown> | undefined;
	if (!v || !isText(v.search)) p('video.search is empty');
	else if (v.verified !== null) {
		const w = v.verified as Record<string, unknown> | undefined;
		if (!w || !isText(w.url) || !/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(w.url) || !isText(w.title) || !isText(w.channel) || !isText(w.verifiedBy)) {
			p('video.verified is not null or {url, title, channel, verifiedBy} on a YouTube watch address');
		}
	}
	return out;
}

/** Ladder order: level, then meal (breakfast first), then n. */
export function ladderCompare(a: Pick<KitchenIndexRow, 'level' | 'meal' | 'n'>, b: Pick<KitchenIndexRow, 'level' | 'meal' | 'n'>): number {
	return a.level - b.level || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal) || a.n - b.n;
}

/* ---- the loaders --------------------------------------------------------- */

let indexCache: KitchenIndex | null = null;

/** The slim index, a precached chunk: works offline from the first launch. */
export async function loadKitchenIndex(): Promise<KitchenIndex> {
	if (!indexCache) indexCache = (await import('./data/kitchen.index.json')).default as unknown as KitchenIndex;
	return indexCache;
}

/** Where a level's dishes are served from. Outside the precache by design. */
export function kitchenDataUrl(base: string, level: number): string {
	return `${base}/kitchen-data/level-${level}.json`;
}

const levelCache = new Map<number, Promise<KitchenLevelFile>>();

/**
 * One level's dishes, fetched on demand (the worker keeps the answer, so a
 * level opened once reads offline after). Refuses a file whose dishes do not
 * hold the shape, so the page says the level could not be read rather than
 * drawing a dish with a step missing. A failed fetch is forgotten, so the next
 * attempt (back in signal) tries again.
 */
export function loadKitchenLevel(level: number, base: string, fetcher: typeof fetch = fetch): Promise<KitchenLevelFile> {
	const hit = levelCache.get(level);
	if (hit) return hit;
	const p = (async () => {
		const res = await fetcher(kitchenDataUrl(base, level));
		if (!res.ok) throw new Error(`The dishes could not be fetched (${res.status}).`);
		const file = (await res.json()) as KitchenLevelFile;
		if (!file || file.level !== level || !Array.isArray(file.dishes)) throw new Error('The dishes file is not this level.');
		const problems = file.dishes.flatMap((d) => dishProblems(d));
		if (problems.length) throw new Error(`The dishes file does not hold its shape: ${problems[0]}`);
		return file;
	})();
	levelCache.set(level, p);
	p.catch(() => levelCache.delete(level));
	return p;
}

/** For the tests: forget what the loaders hold. */
export function resetKitchenCaches(): void {
	indexCache = null;
	levelCache.clear();
}

/* ---- the record ---------------------------------------------------------- */

/** The namespace a training cook is logged under, so it never folds into a Library recipe of the same slug. */
export const KITCHEN_PREFIX = 'kitchen:';
export const cookKey = (slug: string) => KITCHEN_PREFIX + slug;
export const isKitchenKey = (key: string) => key.startsWith(KITCHEN_PREFIX);
export const slugOfKey = (key: string) => key.slice(KITCHEN_PREFIX.length);

/** The rating, in words, each one a grade: the word chosen sets how soon the dish comes back. */
export const RATINGS: ReadonlyArray<{ grade: Grade; word: string; line: string }> = [
	{ grade: 'met', word: 'Nailed it', line: 'Every cue landed. It comes back later each time.' },
	{ grade: 'close', word: 'Nearly there', line: 'Right in the main, one or two things off. It holds its place.' },
	{ grade: 'missed', word: 'Not yet', line: 'It went wrong somewhere. It comes back sooner.' }
];
export function ratingWord(grade: Grade | undefined): string {
	return RATINGS.find((r) => r.grade === grade)?.word ?? 'Cooked, not rated';
}

export interface MealProgress {
	meal: Meal;
	total: number;
	cooked: number;
	/** The first dish in order not yet cooked; null when every one is. */
	next: KitchenIndexRow | null;
	rows: KitchenIndexRow[];
}

/**
 * One level's progress meal by meal: how many of the 25 are cooked and which
 * to cook next. `cooked` is the session's set of cooked keys (cookedDishes),
 * read through the namespace; a set, never a count of the log, because one
 * dish cooked three times is one dish.
 */
export function levelProgress(index: KitchenIndex, level: number, cooked: ReadonlySet<string>): MealProgress[] {
	return MEALS.map((meal) => {
		const rows = index.dishes.filter((d) => d.level === level && d.meal === meal).sort(ladderCompare);
		const done = rows.filter((r) => cooked.has(cookKey(r.slug))).length;
		return { meal, total: rows.length, cooked: done, next: rows.find((r) => !cooked.has(cookKey(r.slug))) ?? null, rows };
	});
}

/**
 * The cooked dishes among `rows` that are due a re-cook, most overdue first:
 * the Repertoire's own fold and order (repertoire.ts dueList, overdue as a
 * share of the dish's interval), scoped to these rows' kitchen keys so no
 * Library cook or another meal's dish can enter. The level page marks these
 * "Due again" and points its re-cook door at the first.
 */
export function recooksDue(rows: readonly KitchenIndexRow[], log: readonly CookEntry[], now: number): KitchenIndexRow[] {
	const byKey = new Map(rows.map((r) => [cookKey(r.slug), r]));
	const due = dueList(repertoire(scopeToSlugs(log, new Set(byKey.keys())), now), now);
	return due.map((e) => byKey.get(e.slug)).filter((r): r is KitchenIndexRow => !!r);
}

/** The whole course: per level, the cooked count of its 100. */
export function courseProgress(index: KitchenIndex, cooked: ReadonlySet<string>): Array<{ level: number; cooked: number; total: number }> {
	return [1, 2, 3, 4].map((level) => {
		const rows = index.dishes.filter((d) => d.level === level);
		return { level, cooked: rows.filter((r) => cooked.has(cookKey(r.slug))).length, total: rows.length };
	});
}

/** The dish after this one in the same level and meal, or null at the end. */
export function nextInMeal(index: KitchenIndex, slug: string): KitchenIndexRow | null {
	const me = index.dishes.find((d) => d.slug === slug);
	if (!me) return null;
	return index.dishes.find((d) => d.level === me.level && d.meal === me.meal && d.n === me.n + 1) ?? null;
}

/** One line on where the dish sits on the re-cook ladder, from its repertoire entry. */
export function recookLine(e: RepertoireEntry | undefined, now: number): string {
	if (!e) return 'Not cooked yet.';
	const times = e.times === 1 ? 'Cooked once' : e.times === 2 ? 'Cooked twice' : `Cooked ${e.times} times`;
	const days = Math.ceil((e.dueAt - now) / DAY_MS);
	const when = days <= 0 ? 'due a re-cook now' : days === 1 ? 'comes back tomorrow' : days < 21 ? `comes back in ${days} days` : `comes back in about ${Math.round(days / 7)} weeks`;
	return `${times}, last ${sinceLabel(e.daysSince)}: ${ratingWord(e.lastGrade).toLowerCase()}, ${when}.`;
}

/* ---- the page's small helpers ------------------------------------------- */

/** The dish page's address. The level rides along so Back knows its level page without the data. */
export function dishHref(base: string, row: Pick<KitchenIndexRow, 'slug' | 'level'>): string {
	return `${base}/kitchen?d=${encodeURIComponent(row.slug)}&level=${row.level}`;
}

/** Minutes as a cook reads them: 45 min, 1 hr 30 min, 26 hr. */
export function minutesLabel(m: number): string {
	if (m < 60) return `${m} min`;
	const h = Math.floor(m / 60);
	const r = m % 60;
	return r ? `${h} hr ${r} min` : `${h} hr`;
}

/** The YouTube search for a dish: always offered, whether or not a verified film exists. */
export function videoSearchUrl(q: string): string {
	return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

/** "<exact pack name>: why" split into its two halves; null for an empty link. */
export function brennansParts(s: string): { name: string; why: string } | null {
	const t = (s ?? '').trim();
	if (!t) return null;
	const i = t.indexOf(': ');
	return i < 0 ? { name: t, why: '' } : { name: t.slice(0, i), why: t.slice(i + 2) };
}

/** Names compared the way a menu is set: case, curly quotes and spacing aside. */
export function foldName(s: string): string {
	return s
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[‘’]/g, "'")
		.replace(/&/g, 'and')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * The first stated duration in a step, in seconds, for cook mode's timer:
 * "6 minutes", "3 to 4 minutes" (the longer), "45 seconds", "1 1/2 hours".
 * Null when the step states none, so cook mode offers no invented timer.
 */
export function stepSeconds(text: string): number | null {
	const re = /(\d+(?:\.\d+)?)(?:\s+(\d)\/(\d))?(?:\s*(?:to|or|-)\s*(\d+(?:\.\d+)?))?\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/i;
	const m = re.exec(text);
	if (!m) return null;
	let n = Number(m[4] ?? m[1]);
	if (!m[4] && m[2] && m[3]) n += Number(m[2]) / Number(m[3]);
	const unit = m[5].toLowerCase();
	const mult = unit.startsWith('s') ? 1 : unit.startsWith('m') ? 60 : 3600;
	const s = Math.round(n * mult);
	return s > 0 ? s : null;
}
