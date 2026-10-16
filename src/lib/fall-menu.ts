import data from './data/fall-menu-2026.json';
import { drilledKey, type DrilledEntry } from './house-drilled';

export interface FallSource { id: string; title: string; url: string; note?: string }
export interface FallDrill { id: string; prompt: string; answer: string; topic: string; sourceIds: string[] }
export interface FallItem {
	id: string; name: string; kind: 'dish' | 'cocktail'; photoFile: string;
	menuSection: string; price?: number; pronunciation?: string; listedIngredients: string[]; sheetDietaryNotes: string[];
	tableside: string; shortDescription: string;
	ingredientNotes: { name: string; explanation: string; houseBoundary?: string; sourceIds: string[] }[];
	originNotes: { text: string; sourceIds: string[] }[];
	serviceChecks: string[]; drills: FallDrill[]; sourceIds: string[];
}
export interface FallCard extends FallDrill { itemId: string; itemName: string; kind: FallItem['kind'] }
export const fallMenu = data as { edition: string; title: string; items: FallItem[]; sources: FallSource[] };
export const fallCards: FallCard[] = fallMenu.items.flatMap((item) => item.drills.map((d) => ({ ...d, itemId: item.id, itemName: item.name, kind: item.kind })));
export const fallCardById = new Map(fallCards.map((c) => [c.id, c]));
export const fallItemById = new Map(fallMenu.items.map((i) => [i.id, i]));
export const fallSourceById = new Map(fallMenu.sources.map((s) => [s.id, s]));
// Curriculum practice uses the bounded local drill log, outside every live house.
// It cannot edit a menu, approve a Maître d' mark, or raise a professional level.
export const fallGradeKey = (id: string) => drilledKey('curriculum-fall-2026', id, 'card');
export function fallVerdicts(log: readonly DrilledEntry[]): Map<string, DrilledEntry> {
	const keys = new Map(fallCards.map((c) => [fallGradeKey(c.id), c.id]));
	const latest = new Map<string, DrilledEntry>();
	for (const e of log) {
		const id = keys.get(e.k);
		if (id && (!latest.has(id) || latest.get(id)!.at <= e.at)) latest.set(id, e);
	}
	return latest;
}
export function fallDeckName(id: string): string {
	if (id === 'fall:today') return 'Fall menu practice';
	if (id === 'fall:food') return 'Fall food';
	if (id === 'fall:cocktail') return 'Fall cocktails';
	if (id.startsWith('fall:item:')) return fallItemById.get(id.slice(10))?.name ?? 'Fall menu item';
	if (id === 'fall:tableside') return 'Fall tableside descriptions';
	return 'Fall 2026';
}
export function fallMembers(id: string): FallCard[] {
	if (id === 'fall:food') return fallCards.filter((c) => c.kind === 'dish');
	if (id === 'fall:cocktail') return fallCards.filter((c) => c.kind === 'cocktail');
	if (id.startsWith('fall:item:')) return fallCards.filter((c) => c.itemId === id.slice(10));
	if (id === 'fall:tableside') return fallCards.filter((c) => c.topic === 'tableside');
	return id === 'fall' || id === 'fall:today' ? fallCards : [];
}
/** A manageable practice round: missed first, unseen next, oldest practised last.
 * Interleave items so the first round does not spend all ten cards on one dish. */
export function fallPractice(log: readonly DrilledEntry[], limit = 10): FallCard[] {
	const latest = fallVerdicts(log);
	const interleaved: FallCard[] = [];
	const max = Math.max(0, ...fallMenu.items.map((i) => i.drills.length));
	for (let n = 0; n < max; n++) for (const item of fallMenu.items) {
		const c = item.drills[n];
		if (c) interleaved.push(fallCardById.get(c.id)!);
	}
	const rank = (id: string) => !latest.has(id) ? 1 : latest.get(id)!.v === 'missed' ? 0 : 2;
	return interleaved.sort((a, b) => rank(a.id) - rank(b.id) || (latest.get(a.id)?.at ?? 0) - (latest.get(b.id)?.at ?? 0)).slice(0, Math.max(0, limit));
}
