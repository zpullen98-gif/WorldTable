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
	CellarBottle,
	Technique,
	Palate,
	Economics,
	Sanitation
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

let sanitationCache: Sanitation | null = null;
export async function loadSanitation(): Promise<Sanitation> {
	if (!sanitationCache) {
		sanitationCache = (await import('./data/sanitation.json')).default as unknown as Sanitation;
	}
	return sanitationCache;
}

let economicsCache: Economics | null = null;
export async function loadEconomics(): Promise<Economics> {
	if (!economicsCache) {
		economicsCache = (await import('./data/economics.json')).default as unknown as Economics;
	}
	return economicsCache;
}

let palateCache: Palate | null = null;
export async function loadPalate(): Promise<Palate> {
	if (!palateCache) {
		palateCache = (await import('./data/palate.json')).default as unknown as Palate;
	}
	return palateCache;
}

let techniqueCache: Technique[] | null = null;
export async function loadTechniques(): Promise<Technique[]> {
	if (!techniqueCache) {
		techniqueCache = (await import('./data/techniques.json')).default as unknown as Technique[];
	}
	return techniqueCache;
}

/**
 * The sommelier's safety net, used verbatim for family recipes (pairingId -1),
 * whose dishes no decision tree has tasted. Same text as the original's final
 * else branch (L3600 tail) — honest, and true of nearly any plate.
 */
export const DEFAULT_PAIRING: Pairing = {
	pour: 'Champagne — when lost, bubbles',
	alt: 'Cru Beaujolais, lightly chilled',
	beer: 'Pilsner',
	zeroProof: 'Sparkling water with citrus',
	why: 'The universal donors: acid, bubbles, and low tannin rescue nearly any plate — the sommelier’s honest safety net.'
};

/**
 * Where a recipe's page lives. Guide recipes have prerendered pages under
 * /recipe/; family recipes are client-only under /family/ (their data is in
 * IndexedDB — see routes/family/[slug]/+page.ts). Every link generator goes
 * through here so the split lives in exactly one place.
 */
export function recipeHref(r: Pick<RecipeSummary, 'slug' | 'source'>): string {
	return r.source === 'family' ? `/family/${r.slug}` : `/recipe/${r.slug}`;
}

/* ---- formatting ------------------------------------------------------ */

/**
 * "75 min" / "2 h" / "2 h 30 m" — ported exactly from fmtTime (L1847).
 * The 90-minute threshold is deliberate: "75 min" scans faster on a card than
 * "1 h 15 m", and the original got that right.
 */
export function formatTime(minutes: number): string {
	if (minutes < 90) return `${minutes} min`;
	if (minutes % 60 === 0) return `${minutes / 60} h`;
	return `${Math.floor(minutes / 60)} h ${minutes % 60} m`;
}
