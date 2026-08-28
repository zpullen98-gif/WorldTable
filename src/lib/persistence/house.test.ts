import { describe, it, expect } from 'vitest';
import {
	EMPTY_HOUSE,
	absorbSession,
	adoptImport,
	removeDish,
	houseSnapshot,
	type HouseRecord
} from './house';
import type { MenuDish } from './state';
import type { CostLine } from '../costing';

/**
 * The house record — the venue's facts, kept off the per-profile key.
 *
 * `menuDishes` and `dishCosts` were fields of SessionState, and db.ts KEY()
 * namespaces the session to `session::<profileId>`. A venue buys ONE
 * subscription for unlimited staff, so the manager typed the menu and everyone
 * else who tapped their own name got an empty one: the quiz never opened, the
 * costing sheet was blank, and the Service tab was empty for exactly the people
 * it was sold for.
 *
 * These cover the two things a migrate-on-load can get wrong — absorbing twice,
 * and resurrecting what somebody deleted.
 */
const dish = (id: string, ts = 100): MenuDish => ({
	id,
	name: `Dish ${id}`,
	section: 'Mains',
	description: '',
	ingredients: [],
	allergens: [],
	price: '',
	ts
});

const costLine = (): CostLine => ({
	id: 'l-1',
	item: 'lamb rump',
	unitCost: 18,
	unit: 'kg',
	usedQty: 0.18,
	yieldPct: 80
});

const fresh = (): HouseRecord => structuredClone(EMPTY_HOUSE);

describe('absorbing a per-profile menu', () => {
	it('takes up dishes and their costings', () => {
		const out = absorbSession(fresh(), {
			menuDishes: [dish('a'), dish('b')],
			dishCosts: { a: { lines: [costLine()], ts: 5 } }
		});
		expect(out.dishes.map((d) => d.id)).toEqual(['a', 'b']);
		expect(out.dishCosts.a?.lines).toHaveLength(1);
		expect(out.absorbed).toEqual(['a', 'b']);
	});

	it('is idempotent — a second load absorbs nothing and returns the same object', () => {
		const mine = { menuDishes: [dish('a')], dishCosts: {} };
		const once = absorbSession(fresh(), mine);
		const twice = absorbSession(once, mine);
		expect(twice).toBe(once);
	});

	/**
	 * The failure mode this whole `absorbed` list exists for. Without it the
	 * stale copy still sitting in the session re-adds the dish on every load,
	 * and a dish that will not stay deleted is worse than one never absorbed.
	 */
	it('never resurrects a dish that was deleted from the house', () => {
		const mine = { menuDishes: [dish('a')], dishCosts: {} };
		const absorbed = absorbSession(fresh(), mine);
		const deleted = removeDish(absorbed, 'a');
		expect(deleted.dishes).toEqual([]);

		const reloaded = absorbSession(deleted, mine);
		expect(reloaded.dishes, 'the stale session copy came back').toEqual([]);
	});

	it('leaves an empty session alone', () => {
		const h = fresh();
		expect(absorbSession(h, { menuDishes: [], dishCosts: {} })).toBe(h);
		expect(absorbSession(h, undefined)).toBe(h);
	});

	it('skips a malformed dish rather than absorbing a record with no id', () => {
		const out = absorbSession(fresh(), {
			menuDishes: [dish('a'), { name: 'no id' } as unknown as MenuDish],
			dishCosts: {}
		});
		expect(out.dishes.map((d) => d.id)).toEqual(['a']);
	});
});

describe('removing a dish', () => {
	it('takes its costing and its 86 with it', () => {
		let h = absorbSession(fresh(), { menuDishes: [dish('a')], dishCosts: { a: { lines: [], ts: 1 } } });
		h = { ...h, eightySix: { a: { at: 1 } } };
		const out = removeDish(h, 'a');
		expect(out.dishes).toEqual([]);
		expect(out.dishCosts.a).toBeUndefined();
		expect(out.eightySix.a).toBeUndefined();
	});
});

describe('adopting an import', () => {
	it('adds dishes it does not have', () => {
		const out = adoptImport(fresh(), [dish('a'), dish('b')], {});
		expect(out.dishes.map((d) => d.id).sort()).toEqual(['a', 'b']);
	});

	it('lets the newer ts win per dish, and never invents a third version', () => {
		const mine = adoptImport(fresh(), [dish('a', 100)], {});
		const newer = adoptImport(mine, [{ ...dish('a', 200), name: 'Renamed' }], {});
		expect(newer.dishes).toHaveLength(1);
		expect(newer.dishes[0].name).toBe('Renamed');

		const older = adoptImport(newer, [{ ...dish('a', 50), name: 'Stale' }], {});
		expect(older.dishes[0].name, 'an older file overwrote a newer dish').toBe('Renamed');
	});

	/**
	 * Deliberately unlike absorbSession: an import is somebody CHOOSING to bring
	 * a menu in, and refusing a dish because a copy was deleted here months ago
	 * would be obeying the wrong memory.
	 */
	it('ignores the absorbed guard, because an import is a decision', () => {
		const deleted = removeDish(absorbSession(fresh(), { menuDishes: [dish('a')] }), 'a');
		const out = adoptImport(deleted, [dish('a', 999)], {});
		expect(out.dishes.map((d) => d.id)).toEqual(['a']);
	});
});

describe('what an export carries', () => {
	it('carries the menu and the costings', () => {
		const h = absorbSession(fresh(), {
			menuDishes: [dish('a')],
			dishCosts: { a: { lines: [], ts: 3 } }
		});
		const snap = houseSnapshot(h);
		expect(snap.menuDishes.map((d) => d.id)).toEqual(['a']);
		expect(snap.dishCosts.a).toBeDefined();
	});

	/**
	 * Importing yesterday's export must never take a dish off tonight's menu
	 * that came back on this morning. The 86 board is true only for the room it
	 * is in, right now.
	 */
	it('never carries the 86 board', () => {
		const h: HouseRecord = { ...fresh(), eightySix: { a: { at: 1, by: 'Marcus' } } };
		expect(Object.keys(houseSnapshot(h))).toEqual(['menuDishes', 'dishCosts']);
		expect(JSON.stringify(houseSnapshot(h))).not.toContain('Marcus');
	});
});
