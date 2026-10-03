import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHouseApi } from '../house/house-api';
import type { HouseApi, HouseEventWindow } from '../house/house-api';
import { mapStorage } from '../house/house-store';
import { HOUSE_INDEX_KEY } from '../house/house-schema';
import { EMPTY_HOUSE, type HouseRecord } from '../persistence/house';
import type { MenuDish } from '../persistence/state';
import type { SyncRow } from '../house/house-sync';
import { putDish, rekeyDish, rekeysOf, removeDishFromHouse, switchHouse, wakeHouse } from './house-wake';

/**
 * The Table's side of the House sync (house-wake.ts), over a Map storage
 * and a fake window, the way the House engine's own tests run: a House with
 * a dish wakes an empty record, a record with no house writes nothing, a
 * dish saved after the wake reaches the House, a removal writes a tombstone
 * the next wake honours, and a renamed change moves every id-keyed map. The
 * store itself (house.svelte.ts) is a runes module a test cannot reach, so
 * its guards (blocked, ready, the save order) are pinned on the source.
 *
 * No allergen content reaches the House by any of these doors, and the
 * last case proves it on the record the House holds.
 */

const T0 = 1790800000000;

function seeded(start = 7): () => number {
	let n = start;
	return () => {
		n = (n * 9301 + 49297) % 233280;
		return n / 233280;
	};
}

function fakeWindow(): HouseEventWindow & { fire(key: string | null): void } {
	const fns: Array<(ev: unknown) => void> = [];
	return {
		addEventListener(type, fn) {
			if (type === 'storage') fns.push(fn);
		},
		fire(key) {
			for (const fn of fns) fn({ key });
		}
	};
}

/** An api over one Map, like a tab: two of them over the same Map are two tabs on one device. */
function tab(backing: Map<string, string>, at = T0): { api: HouseApi; win: ReturnType<typeof fakeWindow>; clock: { at: number } } {
	const clock = { at };
	const win = fakeWindow();
	const api = createHouseApi(mapStorage(backing), { now: () => clock.at, rand: seeded(), win, from: 'table' });
	return { api, win, clock };
}

const dish = (over: Partial<MenuDish> = {}): MenuDish => ({
	id: 'd-gumbo',
	name: 'Gumbo',
	section: 'Mains',
	description: 'Dark roux, andouille, okra.',
	ingredients: ['roux', 'andouille', 'okra'],
	allergens: ['shellfish'],
	allergensCheckedAt: T0 - 1000,
	price: '22',
	ts: T0 - 5000,
	...over
});

const record = (over: Partial<HouseRecord> = {}): HouseRecord => ({ ...structuredClone(EMPTY_HOUSE), ...over });

function keysDeep(v: unknown, out: string[] = []): string[] {
	if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
	else if (v && typeof v === 'object') {
		for (const [k, x] of Object.entries(v)) {
			out.push(k);
			keysDeep(x, out);
		}
	}
	return out;
}

describe('the wake: a House with one dish and an empty record', () => {
	it('wakes with the dish on the record, stamped with the house, and reports it', async () => {
		const backing = new Map<string, string>();
		const first = tab(backing);
		const house = await first.api.mintHouse('Brennans', 'hand');
		expect(house).not.toBeNull();
		const seeded = await first.api.put('dish', dish({ house: house!.id }) as unknown as SyncRow);
		expect(seeded.ok).toBe(true);

		const second = tab(backing, T0 + 1000);
		const empty = record();
		const out = await wakeHouse(second.api, empty);
		expect(out.refusal).toBeUndefined();
		expect(out.record).not.toBe(empty);
		expect(out.record.dishes).toHaveLength(1);
		expect(out.record.dishes[0]).toMatchObject({ id: 'd-gumbo', name: 'Gumbo', house: house!.id, price: '22' });
		expect(out.changes).toEqual([{ id: 'd-gumbo', what: 'row-added' }]);
		// a row the House added starts with the Table's own allergen line empty and unchecked: the House has no word on it
		expect(out.record.dishes[0].allergens).toEqual([]);
		expect('allergensCheckedAt' in out.record.dishes[0]).toBe(false);
	});

	it('a record already in step comes back the same object, so nothing is persisted', async () => {
		const backing = new Map<string, string>();
		const { api } = tab(backing);
		const house = await api.mintHouse('Brennans', 'hand');
		const once = await wakeHouse(api, record({ dishes: [dish()] }));
		expect(once.record.dishes[0].house).toBe(house!.id);
		const twice = await wakeHouse(api, once.record);
		expect(twice.record).toBe(once.record);
		expect(twice.changes).toEqual([]);
	});

	it('with no house on the device nothing is written and nothing is said', async () => {
		const backing = new Map<string, string>();
		const { api } = tab(backing);
		const rec = record({ dishes: [dish()] });
		const out = await wakeHouse(api, rec);
		expect(out.record).toBe(rec);
		expect(out.refusal).toBeUndefined();
		expect(backing.size).toBe(0);
		expect(await putDish(api, dish())).toEqual({});
		expect(await removeDishFromHouse(api, 'd-gumbo')).toEqual({});
		expect(backing.size).toBe(0);
	});
});

describe('a blocked record syncs nothing', () => {
	const src = readFileSync('src/lib/stores/house.svelte.ts', 'utf8');

	it('hydrate sets ready once the record is read, returns on blocked before the absorb and the wake, and the wake sits last', () => {
		const hydrate = src.slice(src.indexOf('async hydrate()'), src.indexOf('#syncWithHouse(): Promise<void>'));
		const ready = hydrate.indexOf('this.#ready = true;');
		const blockedReturn = hydrate.indexOf('if (this.#blocked) return;');
		const absorb = hydrate.indexOf('absorbSession(');
		const wake = hydrate.indexOf('await this.#syncWithHouse()');
		expect(ready).toBeGreaterThan(-1);
		expect(blockedReturn).toBeGreaterThan(ready);
		expect(absorb).toBeGreaterThan(blockedReturn);
		expect(wake).toBeGreaterThan(absorb);
		expect(hydrate.indexOf('this.#ready = true;', ready + 1), 'ready is set once').toBe(-1);
	});

	it('every House write is guarded by blocked and by ready, and the listener too', () => {
		for (const fn of ['#syncWithHouse(again = true)', '#putToHouse(dish: MenuDish)', '#removeFromHouse(id: string)']) {
			const body = src.slice(src.indexOf(fn), src.indexOf('void this.#enqueueHouse', src.indexOf(fn)) + 1 || src.indexOf('return this.#enqueueHouse', src.indexOf(fn)));
			expect(body, fn).toContain('this.#blocked');
			expect(body, fn).toContain('this.#ready');
		}
		const listener = src.slice(src.indexOf("window.addEventListener('storage'"), src.indexOf('RESYNC_MS);'));
		expect(listener).toContain('HOUSE_INDEX_KEY');
		expect(listener).toContain('if (this.#blocked) return;');
	});

	it('projection first, House second: every mutator persists before it puts', () => {
		for (const [mutator, call] of [
			['addDish(d: MenuDish)', 'this.#putToHouse(d)'],
			['updateDish(d: MenuDish)', 'this.#putToHouse(d)'],
			['removeDish(id: string)', 'this.#removeFromHouse(id)'],
			['setMaitre(id: string', 'this.#putDishById(id)'],
			['confirmMaitre(id: string', 'this.#putDishById(id)'],
			['discardMaitre(id: string', 'this.#putDishById(id)'],
			['keepMaitreNote(id: string', 'this.#putDishById(id)']
		]) {
			const start = src.indexOf(mutator);
			expect(start, mutator).toBeGreaterThan(-1);
			const body = src.slice(start, src.indexOf('\n\t}\n', start));
			const persist = body.indexOf('this.#persist()');
			const put = body.indexOf(call);
			expect(persist, mutator).toBeGreaterThan(-1);
			expect(put, mutator).toBeGreaterThan(persist);
		}
	});

	it('the api is built lazily behind typeof window, and the refusal is a string the page prints', () => {
		expect(src).toContain("if (typeof window === 'undefined') return undefined;");
		expect(src).toContain('createHouseApi(idbStorage(window)');
		expect(src).toContain('get houseRefusal(): string');
		const page = readFileSync('src/routes/menu/+page.svelte', 'utf8');
		expect(page).toContain('{#if house.houseRefusal}');
	});
});

describe('a dish saved after the wake reaches the House', () => {
	it('putDish files the dish and hands back the house stamp the row gained', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		const house = await api.mintHouse('Brennans', 'hand');
		await wakeHouse(api, record());
		clock.at = T0 + 2000;
		const saved = dish({ id: 'd-oyster', name: 'Oysters J’aime', price: '19', ts: T0 + 2000 });
		const res = await putDish(api, saved);
		expect(res.refusal).toBeUndefined();
		expect(res.rekey).toBeUndefined();
		expect(res.house).toBe(house!.id);
		const items = api.current()!.dishes;
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({ id: 'd-oyster', name: 'Oysters J’aime', price: '19', house: house!.id, kind: 'dish' });
		// the Table's own fields never enter the House
		const keys = keysDeep(api.current());
		expect(keys.some((k) => /allerg/i.test(k))).toBe(false);
		expect(keys).not.toContain('recipeSlug');
	});

	it('a later edit on the Table wins the shared fields on the House, and a kept mark survives it', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		const why = { value: 'The roux is the colour of a penny.', by: 'person' as const, ts: T0 - 4000 };
		const first = await putDish(api, dish({ maitre: { why } }));
		expect(first.refusal).toBeUndefined();
		clock.at = T0 + 3000;
		/* saveDish carries maitre back off the stored record, so an edited row arrives with its block whole. */
		const edited = dish({ description: 'Dark roux, andouille, okra, rice.', ts: T0 + 3000, house: first.house, maitre: { why } });
		await putDish(api, edited);
		const item = api.current()!.dishes[0];
		expect(item.description).toBe('Dark roux, andouille, okra, rice.');
		expect(item.why).toMatchObject({ value: 'The roux is the colour of a penny.', by: 'person' });
	});

	it('a row put without a mark the House holds is a Discard: the mark leaves the House, kept or hers', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		const block = { why: { value: 'Ours.', by: 'person' as const, ts: T0 - 4000 }, say: { value: 'Hers.', by: 'maitre' as const, ts: T0 - 4000 } };
		const first = await putDish(api, dish({ maitre: block }));
		expect(api.current()!.dishes[0].why).toBeDefined();
		clock.at = T0 + 3000;
		await putDish(api, dish({ house: first.house, maitre: { say: block.say } }));
		expect(api.current()!.dishes[0].why).toBeUndefined();
		expect(api.current()!.dishes[0].say).toBeDefined();
		await putDish(api, dish({ house: first.house }));
		expect(api.current()!.dishes[0].say).toBeUndefined();
		/* The whole-list wake keeps the merge: a backup row without the mark does not discard it. */
		await api.setMark('dish', 'd-gumbo', 'why', block.why);
		const woke = await wakeHouse(api, record({ dishes: [dish({ house: first.house })] }));
		expect(woke.record.dishes[0].maitre?.why).toMatchObject({ value: 'Ours.' });
	});

	it('an id the key sweep refuses is re-keyed on the way in and reported, and rekeyDish moves every map', async () => {
		const backing = new Map<string, string>();
		const { api } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		const nutty = dish({ id: 'd-nut12345' });
		const res = await putDish(api, nutty);
		expect(res.rekey).toBeDefined();
		expect(res.rekey!.from).toBe('d-nut12345');
		expect(res.rekey!.to).not.toBe('d-nut12345');
		expect(api.current()!.dishes[0].id).toBe(res.rekey!.to);

		const rec = record({
			dishes: [nutty],
			dishCosts: { 'd-nut12345': { lines: [], sales: [], ts: 1 } },
			eightySix: { 'd-nut12345': { at: 1 } },
			absorbed: ['d-nut12345', 'd-other'],
			producers: [{ id: 'pr-1', name: 'Farm', place: '', kind: 'farm', supplies: '', story: '', dishIds: ['d-nut12345', 'd-other'], ts: 1 }],
			waste: [{ id: 'w-1', at: 1, label: 'Gumbo', qty: 1, reason: 'overprep', unitValue: null, source: { dishId: 'd-nut12345' } }],
			prepCounts: { 'p-demi': { onHand: 3, countedOn: '2026-10-03' } }
		});
		const moved = rekeyDish(rec, 'd-nut12345', res.rekey!.to);
		const to = res.rekey!.to;
		expect(Object.keys(moved.dishCosts)).toEqual([to]);
		expect(Object.keys(moved.eightySix)).toEqual([to]);
		// absorbed keeps the id the session still holds and gains the new one beside it
		expect(moved.absorbed).toEqual(['d-nut12345', 'd-other', to]);
		expect(moved.producers[0].dishIds).toEqual([to, 'd-other']);
		expect(moved.waste[0].source).toEqual({ dishId: to });
		// prepCounts is keyed by prep id and does not move
		expect(moved.prepCounts).toEqual(rec.prepCounts);
		// nothing to move: the same object back
		expect(rekeyDish(moved, 'd-gone', 'd-elsewhere')).toBe(moved);
		expect(rekeysOf([{ id: to, what: 'renamed', from: 'd-nut12345' }, { id: 'x', what: 'row-added' }])).toEqual([{ from: 'd-nut12345', to }]);
	});

	it('the wake re-keys the record for a renamed row too', async () => {
		const backing = new Map<string, string>();
		const { api } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		const rec = record({ dishes: [dish({ id: 'd-safe0000' })], dishCosts: { 'd-safe0000': { lines: [], sales: [], ts: 1 } } });
		const out = await wakeHouse(api, rec);
		const renamed = out.changes.find((c) => c.what === 'renamed');
		expect(renamed?.from).toBe('d-safe0000');
		expect(out.record.dishes[0].id).toBe(renamed!.id);
		expect(Object.keys(out.record.dishCosts)).toEqual([renamed!.id]);
	});
});

describe('a removal writes a tombstone', () => {
	it('removeDishFromHouse drops the item and stamps removed newer than the dish', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		await putDish(api, dish());
		clock.at = T0 + 100;
		const res = await removeDishFromHouse(api, 'd-gumbo');
		expect(res).toEqual({});
		const house = api.current()!;
		expect(house.dishes).toHaveLength(0);
		expect(house.removed['d-gumbo']).toBeGreaterThan(T0 - 5000);
	});

	it('a stale row of the removed dish is dropped by the next wake on another tab', async () => {
		const backing = new Map<string, string>();
		const first = tab(backing);
		await first.api.mintHouse('Brennans', 'hand');
		await putDish(first.api, dish());
		first.clock.at = T0 + 100;
		await removeDishFromHouse(first.api, 'd-gumbo');

		const second = tab(backing, T0 + 200);
		const stale = record({ dishes: [dish({ house: first.api.currentId()! })], dishCosts: {} });
		const out = await wakeHouse(second.api, stale);
		expect(out.record.dishes).toHaveLength(0);
		expect(out.changes).toEqual([{ id: 'd-gumbo', what: 'row-removed' }]);
	});

	it('a row a person touched after the tombstone stays, and the tombstone goes', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		await putDish(api, dish());
		clock.at = T0 + 100;
		await removeDishFromHouse(api, 'd-gumbo');
		clock.at = T0 + 300;
		const touched = record({ dishes: [dish({ ts: T0 + 250, house: api.currentId()! })] });
		const out = await wakeHouse(api, touched);
		expect(out.record.dishes).toHaveLength(1);
		expect(api.current()!.removed['d-gumbo']).toBeUndefined();
		expect(api.current()!.dishes[0].id).toBe('d-gumbo');
	});
});

describe('a switch between two houses', () => {
	it('syncs the rows out, replaces the projection, keeps the Table\'s own fields on a row that stays, and brings the list back', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		const first = await api.mintHouse('The Lantern Room', 'hand');
		const woke = await wakeHouse(api, record({ dishes: [dish()] }));
		expect(woke.record.dishes[0].house).toBe(first!.id);
		const second = await api.mintHouse('The Second Room', 'hand');
		expect(api.currentId()).toBe(first!.id);

		// an edit since the wake, not yet put: the switch out keeps it on the first house
		clock.at = T0 + 500;
		const edited = { ...woke.record, dishes: [{ ...woke.record.dishes[0], description: 'Dark roux, andouille, okra, rice.', ts: T0 + 500 }] };
		const gone = await switchHouse(api, edited, second!.id);
		expect(gone.ok).toBe(true);
		expect(api.currentId()).toBe(second!.id);
		expect(gone.record.dishes).toEqual([]);
		// the first house kept the edit
		expect((await mapStorage(backing).get(first!.id))!.dishes[0].description).toBe('Dark roux, andouille, okra, rice.');

		// a dish on the second house, then back: the first house's rows return over the previous rows
		clock.at = T0 + 600;
		await putDish(api, dish({ id: 'd-pie00001', name: 'Harbour Pie', house: second!.id, ts: T0 + 600 }));
		const withPie = await wakeHouse(api, gone.record);
		expect(withPie.record.dishes.map((d) => d.name)).toEqual(['Harbour Pie']);
		const back = await switchHouse(api, withPie.record, first!.id);
		expect(back.ok).toBe(true);
		expect(back.record.dishes.map((d) => [d.name, d.house])).toEqual([['Gumbo', first!.id]]);
		// the House never held the allergen line, so a row that LEFT comes back without it; one that stays keeps it
		const again = await switchHouse(api, { ...back.record, dishes: [{ ...back.record.dishes[0], allergens: ['shellfish'] }] }, first!.id);
		expect(again.ok).toBe(true);
		expect(again.record.dishes[0].allergens).toEqual(['shellfish']);
		// an id not on the device: nothing moves
		const no = await switchHouse(api, back.record, 'h-nowhere');
		expect(no.ok).toBe(false);
		expect(no.record).toBe(back.record);
	});
});

describe('another tab', () => {
	it('the api hears the index key on the storage event and reloads; the store listens on the same key', async () => {
		const backing = new Map<string, string>();
		const first = tab(backing);
		await first.api.mintHouse('Brennans', 'hand');
		const second = tab(backing);
		await second.api.ready();
		expect(second.api.current()!.dishes).toHaveLength(0);
		await putDish(first.api, dish());
		const heard = new Promise<void>((resolve) => {
			const off = second.api.onChange((_h, what) => {
				if (what === 'storage') {
					off();
					resolve();
				}
			});
		});
		second.win.fire(HOUSE_INDEX_KEY);
		await heard;
		expect(second.api.current()!.dishes).toHaveLength(1);
		const out = await wakeHouse(second.api, record());
		expect(out.record.dishes.map((d) => d.id)).toEqual(['d-gumbo']);
	});
});
