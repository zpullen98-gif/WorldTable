import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fallMenu, fallCards, fallMembers, fallPractice, fallGradeKey, fallVerdicts, fallItemForDish, FALL_NAME_ALIASES } from './fall-menu';
import { markDrilled, readDrilled, type SlotStorage } from './house-drilled';
import { parentOf } from './nav';

describe('the join from a house item to the sheet', () => {
	const PACK = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house as { dishes: { name: string }[]; cocktails: { name: string }[] };
	it('resolves the eight dish and nine cocktail names of the data to their own items', () => {
		const dishes = fallMenu.items.filter((i) => i.kind === 'dish');
		const cocktails = fallMenu.items.filter((i) => i.kind === 'cocktail');
		expect(dishes).toHaveLength(8);
		expect(cocktails).toHaveLength(9);
		for (const i of [...dishes, ...cocktails]) expect(fallItemForDish(i.name)?.id, i.name).toBe(i.id);
	});
	it('folds accents, apostrophes, case and spacing, and takes the house’s alias first', () => {
		expect(fallItemForDish('Chocolate Cremeux')?.id).toBe('chocolate-cremeux-tasting');
		expect(fallItemForDish('LAMB SHANK EN CROUTE')?.id).toBe('lamb-shank-en-croute');
		expect(fallItemForDish('  agnolotti   del plin ')?.id).toBe('agnolotti-del-plin');
		expect(fallItemForDish('Ole Buttermilk Sky')?.id).toBe('fall-ole-buttermilk-sky');
		expect(FALL_NAME_ALIASES).toEqual({ 'Old Buttermilk Sky': 'Ole Buttermilk Sky' });
		expect(fallItemForDish('Old Buttermilk Sky')?.id).toBe('fall-ole-buttermilk-sky');
		expect(fallItemForDish('old buttermilk sky')?.id).toBe('fall-ole-buttermilk-sky');
	});
	it('reaches every fall cocktail from the pack’s own names, and a name off the sheet reaches nothing', () => {
		const names = PACK.cocktails.map((c) => c.name);
		for (const i of fallMenu.items.filter((i) => i.kind === 'cocktail')) {
			expect(names.filter((n) => fallItemForDish(n)?.id === i.id), i.name).toHaveLength(1);
		}
		expect(fallItemForDish('Eggs Hussarde')).toBeUndefined();
		expect(fallItemForDish('Classic Sazerac')).toBeUndefined();
		expect(fallItemForDish('')).toBeUndefined();
		expect(fallItemForDish('Fall 2026')).toBeUndefined();
		/* The pack's dishes that are not on the sheet never join; the eight on it join when the pack carries them by the sheet's names. */
		for (const d of PACK.dishes) {
			const hit = fallItemForDish(d.name);
			if (hit) expect(hit.kind, d.name).toBe('dish');
		}
	});
});

describe('Fall 2026 training collection', () => {
	it('covers the eight photographed dishes and nine drinks with cited lessons and stable drills', () => {
		expect(fallMenu.items.filter((i) => i.kind === 'dish')).toHaveLength(8);
		expect(fallMenu.items.filter((i) => i.kind === 'cocktail')).toHaveLength(9);
		expect(new Set(fallCards.map((c) => c.id)).size).toBe(fallCards.length);
		const sources = new Set(fallMenu.sources.map((s) => s.id));
		for (const i of fallMenu.items) {
			expect(i.id).toMatch(/^[a-z0-9-]+$/);
			expect(i.listedIngredients.length).toBeGreaterThan(2);
			expect(i.drills.length).toBeGreaterThanOrEqual(6);
			expect(i.drills.some((d) => d.topic === 'tableside')).toBe(true);
			expect(i.serviceChecks.length).toBeGreaterThan(0);
			for (const d of i.drills) expect(d.id).toMatch(/^[a-z0-9-]+$/);
			for (const note of [...i.ingredientNotes, ...i.originNotes, ...i.drills, i]) for (const id of note.sourceIds) expect(sources.has(id), id).toBe(true);
		}
		for (const s of fallMenu.sources) expect(s.url).toMatch(/^https:\/\//);
	});
	it('narrows drills without pretending unmeasured cocktails are build specifications', () => {
		expect(fallMembers('fall:food').every((c) => c.kind === 'dish')).toBe(true);
		expect(fallMembers('fall:cocktail').every((c) => c.kind === 'cocktail')).toBe(true);
		expect(fallMembers('fall:tableside')).toHaveLength(17);
		for (const i of fallMenu.items) expect(fallMembers('fall:item:' + i.id).map((c) => c.id)).toEqual(i.drills.map((d) => d.id));
		expect(fallMembers('fall:unknown')).toEqual([]);
		for (const i of fallMenu.items.filter((i) => i.kind === 'cocktail')) {
			expect(i).not.toHaveProperty('spec');
			expect(i).not.toHaveProperty('method');
			expect(i).not.toHaveProperty('glass');
		}
	});
	it('makes a ten-card round across items, prioritises misses and moves practised cards behind unseen ones', () => {
		const first = fallPractice([]);
		expect(first).toHaveLength(10);
		expect(new Set(first.map((c) => c.itemId)).size).toBe(10);
		const miss = fallCards[fallCards.length - 1];
		const log = [
			{ k: fallGradeKey(first[0].id), v: 'met' as const, at: 1 },
			{ k: fallGradeKey(miss.id), v: 'missed' as const, at: 2 }
		];
		expect(fallPractice(log)[0].id).toBe(miss.id);
		expect(fallPractice(log).some((c) => c.id === first[0].id)).toBe(false);
		expect(fallPractice(log, 0)).toEqual([]);
	});
	it('records only curriculum practice and honours the most recent verdict', () => {
		const data = new Map<string, string>();
		const store: SlotStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: (k) => { data.delete(k); } };
		const id = fallCards[0].id;
		expect(markDrilled(fallGradeKey(id), 'met', store, 1).ok).toBe(true);
		markDrilled(fallGradeKey(id), 'missed', store, 2);
		markDrilled('house:personal-menu:dish:card-item', 'met', store, 3);
		const latest = fallVerdicts(readDrilled(store));
		expect(latest.size).toBe(1);
		expect(latest.get(id)?.v).toBe('missed');
		expect(data.size).toBe(1);
	});
	it('cold links return through the collection without leaving My Restaurant', () => {
		expect(parentOf({ path: '/menu', search: '?view=fall&kind=cocktail&item=apple-crumble' })).toBe('/menu?view=fall&kind=cocktail');
		expect(parentOf({ path: '/menu', search: '?view=fall' })).toBe('/menu');
	});
});
