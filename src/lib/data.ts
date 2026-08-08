/**
 * Data access.
 *
 * The index is imported statically so the grid can paint on first byte. Detail,
 * lexicon and pairings are dynamic imports: they are a few hundred KB that
 * nothing on the landing view needs, and the service worker precaches them for
 * offline separately from the app shell.
 */
import type {
	ChapterRef,
	LexiconEntry,
	Pairing,
	PantryGroup,
	RecipeDetail,
	RecipeSummary,
	StudySemester,
	Substitution,
	CellarBottle
} from './types';

import indexJson from './data/recipes.index.json';
import chaptersJson from './data/chapters.json';

export const recipes = indexJson as unknown as RecipeSummary[];
export const chapters = chaptersJson as unknown as ChapterRef[];

export const bySlug = new Map(recipes.map((r) => [r.slug, r]));
export const chapterBySlug = new Map(chapters.map((c) => [c.slug, c]));

export const COURSES = [...new Set(recipes.map((r) => r.course))].sort();

export const TOTALS = {
	recipes: recipes.length,
	chapters: chapters.length
};

/* ---- lazy islands ---------------------------------------------------- */

let detailCache: Map<string, RecipeDetail> | null = null;
let pairingCache: Pairing[] | null = null;

export async function loadDetails(): Promise<Map<string, RecipeDetail>> {
	if (detailCache) return detailCache;
	const [full, pairings] = await Promise.all([
		import('./data/recipes.full.json'),
		import('./data/pairings.json')
	]);
	pairingCache = pairings.default as unknown as Pairing[];
	detailCache = new Map(
		(full.default as unknown as RecipeDetail[]).map((d) => [d.slug, d])
	);
	return detailCache;
}

export async function loadDetail(slug: string): Promise<RecipeDetail | undefined> {
	return (await loadDetails()).get(slug);
}

export async function loadPairings(): Promise<Pairing[]> {
	if (!pairingCache) await loadDetails();
	return pairingCache!;
}

let lexiconCache: LexiconEntry[] | null = null;
export async function loadLexicon(): Promise<LexiconEntry[]> {
	if (!lexiconCache) {
		lexiconCache = (await import('./data/lexicon.json')).default as unknown as LexiconEntry[];
	}
	return lexiconCache;
}

export async function loadPantry(): Promise<PantryGroup[]> {
	return (await import('./data/pantry.json')).default as unknown as PantryGroup[];
}

export async function loadStudy(): Promise<StudySemester[]> {
	return (await import('./data/study.json')).default as unknown as StudySemester[];
}

export async function loadSubstitutions(): Promise<Substitution[]> {
	return (await import('./data/substitutions.json')).default as unknown as Substitution[];
}

export async function loadCellar(): Promise<CellarBottle[]> {
	return (await import('./data/cellar.json')).default as unknown as CellarBottle[];
}

/* ---- formatting ------------------------------------------------------ */

/** "45 min" / "2 h 30" — ported from the original's fmtTime (L1847). */
export function formatTime(minutes: number): string {
	if (minutes < 60) return `${minutes} min`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m ? `${h} h ${m}` : `${h} h`;
}
