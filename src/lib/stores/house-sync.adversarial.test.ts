import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHouseApi } from '../house/house-api';
import type { HouseApi, HouseEventWindow } from '../house/house-api';
import { mapStorage } from '../house/house-store';
import type { HouseStorage } from '../house/house-store';
import { HOUSE_INDEX_KEY } from '../house/house-schema';
import { EMPTY_HOUSE, absorbSession, discardMaitre, type HouseRecord } from '../persistence/house';
import type { MenuDish } from '../persistence/state';
import type { SyncRow } from '../house/house-sync';
import { putDish, rekeyDish, removeDishFromHouse, switchHouse, wakeHouse } from './house-wake';

/**
 * The adversarial pass over the Table's side of the House sync: the hydrate
 * wake, the mutators' puts and the tombstone (house.svelte.ts and
 * house-wake.ts), read as the engineer who will be blamed for a discarded
 * mark that came back, a menu with two dishes under one id, or a colleague's
 * save written over by this tab. Every case under "a hole" FAILS on the
 * modules as they stand and says what the rule asks for; the modules are
 * not touched by this file. The cases under "holds" are the traps the brief
 * named that the code does close, kept here so a later change that reopens
 * one is caught.
 *
 * The store itself is a runes module a test cannot reach, so its hydrate
 * order and its mutators are pinned on the source, the way
 * house-sync.test.ts pins them.
 *
 * No allergen content reaches the House by any door here, and no dash is
 * spelled in this file.
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

interface Tab {
	api: HouseApi;
	win: ReturnType<typeof fakeWindow>;
	clock: { at: number };
	storage: HouseStorage;
	puts: number;
}

/** An api over one Map, like a tab; the storage counts its puts so a write loop shows as a number. */
function tab(backing: Map<string, string>, at = T0, wrap: (s: HouseStorage) => HouseStorage = (s) => s): Tab {
	const clock = { at };
	const win = fakeWindow();
	const base = mapStorage(backing);
	const t: Tab = { api: undefined as unknown as HouseApi, win, clock, storage: undefined as unknown as HouseStorage, puts: 0 };
	const counted: HouseStorage = {
		...base,
		put: (id, house) => {
			t.puts += 1;
			return base.put(id, house);
		}
	};
	t.storage = wrap(counted);
	t.api = createHouseApi(t.storage, { now: () => clock.at, rand: seeded(), win, from: 'table' });
	return t;
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

const src = readFileSync('src/lib/stores/house.svelte.ts', 'utf8');

/** The body of one method of the store, from its signature to the next line that closes a method. */
function method(sig: string): string {
	const start = src.indexOf(sig);
	expect(start, sig).toBeGreaterThan(-1);
	return src.slice(start, src.indexOf('\n\t}\n', start));
}

/* -------------------------------------------------------------------------
 * A hole: a Discard on the Table is undone by the House
 * ---------------------------------------------------------------------- */

describe('a hole: a mark discarded on the Table comes back from the House', () => {
	/*
	 * CLAUDE.md: a person's Keep, Edit and Discard are theirs. The Table's
	 * discardMaitre drops the mark from the row and the store puts the dish
	 * to the House, but the House still holds the mark and settleTwin brings
	 * it straight back through pickMark (a mark against no mark is the mark).
	 * The put's returned row is ignored by the store, so the screen looks
	 * right until the next wake, when the discarded line is on the dish
	 * again. Nothing on the Table's side calls setMark(target, id, field,
	 * null), and the sync has no notion of a mark removed on the newer side.
	 */
	for (const by of ['maitre', 'person'] as const) {
		it(`her mark discarded (${by}) stays discarded after a put and the next wake`, async () => {
			const backing = new Map<string, string>();
			const { api, clock } = tab(backing);
			await api.mintHouse('Brennans', 'hand');
			const marked = dish({ maitre: { say: { value: 'A dark roux, cooked to the colour of a penny.', by, ts: T0 - 4000 } } });
			const woke = await wakeHouse(api, record({ dishes: [marked] }));
			expect(api.current()!.dishes[0].say).toBeDefined();

			clock.at = T0 + 1000;
			const discarded = discardMaitre(woke.record, 'd-gumbo', 'say');
			expect(discarded.dishes[0].maitre).toBeUndefined();
			const put = await putDish(api, discarded.dishes[0]);
			expect(put.refusal).toBeUndefined();
			// the House must not hold a mark a person discarded
			expect(api.current()!.dishes[0].say, 'the House after the put').toBeUndefined();

			clock.at = T0 + 2000;
			const again = await wakeHouse(api, discarded);
			expect(again.record.dishes[0].maitre?.say, 'the row after the next wake').toBeUndefined();
		});
	}
});

/* -------------------------------------------------------------------------
 * A hole: a name twin re-keyed onto an id the record already holds
 * ---------------------------------------------------------------------- */

describe('a hole: a second dish with a twin name is re-keyed onto an id the menu already has', () => {
	/*
	 * api.put syncs ONE row. The sync pairs the house's item by folded name
	 * with the new row (rule 2), because it cannot see that the Table also
	 * holds the item's own row under the item's id. The store then renames
	 * the new dish to that id (#putToHouse), and the menu has two dishes
	 * under one id: removeDish takes both, updateDish writes both, the
	 * costing sheet and the 86 board point at whichever comes first. The
	 * whole-list wake pairs them right (by id first); the single-row put
	 * cannot, so it must not re-key onto an id the record holds.
	 */
	it('putDish does not hand back a re-key onto an id the record already holds', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		const woke = await wakeHouse(api, record({ dishes: [dish()] }));
		const ids = new Set(woke.record.dishes.map((d) => d.id));
		expect(ids.has('d-gumbo')).toBe(true);

		clock.at = T0 + 1000;
		const second = dish({ id: 'd-second01', name: 'GUMBO', description: 'The lunch gumbo, lighter.', ts: T0 + 1000 });
		const res = await putDish(api, second);
		expect(res.refusal).toBeUndefined();
		if (res.rekey) expect(ids.has(res.rekey.to), 'the re-key lands on an id the menu already has: ' + res.rekey.to).toBe(false);

		// the store's own rule, applied: every id on the record must stay unique
		let dishes = [...woke.record.dishes, second];
		if (res.rekey) dishes = dishes.map((d) => (d.id === res.rekey!.from ? { ...d, id: res.rekey!.to } : d));
		expect(new Set(dishes.map((d) => d.id)).size).toBe(dishes.length);
	});
});

/* -------------------------------------------------------------------------
 * A hole: two tabs, a put in flight
 * ---------------------------------------------------------------------- */

describe('a hole: a put in flight on one tab writes over the other tab\'s save', () => {
	/*
	 * The store serialises ITS OWN writes on one queue, but the api's commit
	 * reads the house into memory, runs the sync, and then awaits the
	 * database. Another tab's save lands in that gap (its index write fires
	 * this tab's storage listener, and the api reloads memory from the
	 * device), and then this tab's save writes the house it computed before
	 * the reload: the other tab's dish is gone from the device, and this
	 * tab's memory is a house the device no longer holds. The put must land
	 * over the record as it stands when the write goes in, or be re-run.
	 */
	it('both tabs\' dishes are on the device after both puts land', async () => {
		const backing = new Map<string, string>();
		let hold: Promise<void> = Promise.resolve();
		let release: () => void = () => {};
		const slow = (s: HouseStorage): HouseStorage => ({
			...s,
			put: async (id, house) => {
				await hold;
				return s.put(id, house);
			}
		});
		const a = tab(backing, T0, slow);
		await a.api.mintHouse('Brennans', 'hand');
		const b = tab(backing, T0 + 10);
		await b.api.ready();

		hold = new Promise<void>((r) => {
			release = r;
		});
		a.clock.at = T0 + 100;
		const inFlight = putDish(a.api, dish({ id: 'd-gumbo000', name: 'Gumbo' }));
		// the other tab saves while this tab's write waits on the database
		await putDish(b.api, dish({ id: 'd-oyster00', name: 'Oysters', ts: T0 + 10 }));
		a.win.fire(HOUSE_INDEX_KEY);
		await new Promise((r) => setTimeout(r, 0));
		release();
		await inFlight;

		const onDevice = await mapStorage(backing).get(a.api.currentId()!);
		expect(onDevice!.dishes.map((d) => d.id).sort()).toEqual(['d-gumbo000', 'd-oyster00']);
		// and this tab's memory is what the device holds
		expect(a.api.current()!.dishes.map((d) => d.id).sort()).toEqual(['d-gumbo000', 'd-oyster00']);
	});
});

/* -------------------------------------------------------------------------
 * A hole: adopt (a .wtjson import) never puts to the House
 * ---------------------------------------------------------------------- */

describe('a hole: a .wtjson import adds dishes the House does not hear of', () => {
	/*
	 * Every other mutator that changes a dish persists and then puts to the
	 * House; adopt() persists and stops. A menu brought in by file is on
	 * the Table alone until the next boot's wake, and a device that is never
	 * rebooted (a pass tablet open for days, the shipped design) never files
	 * it: the Codex and the Ledger wake into a house without it, and a pack
	 * exported meanwhile leaves it out.
	 */
	it('adopt() syncs or puts to the House after its persist', () => {
		const body = method('\tadopt(\n');
		const persist = body.indexOf('this.#persist()');
		expect(persist).toBeGreaterThan(-1);
		const after = body.slice(persist);
		expect(after, 'adopt persists and never reaches the House').toMatch(/#syncWithHouse\(|#putToHouse\(|syncHouse\(/);
	});
});

/* -------------------------------------------------------------------------
 * A hole: the absorb persist in hydrate runs before ready
 * ---------------------------------------------------------------------- */

describe('a hole: the persist of an absorbed session in hydrate is a no-op', () => {
	/*
	 * #persist() returns before writing while #ready is false (the hydration
	 * guard). hydrate() absorbs the per-profile session, calls #persist(),
	 * and only then sets #ready, so the absorbed dishes and their costings
	 * live in memory alone until some later mutator writes. This predates
	 * the House, but the wake now sits on the same line: it persists only
	 * when the sync changed something, so a record with no house, or one
	 * already in step, leaves the absorbed menu unwritten for the whole
	 * session. The ready flag must be set before the first persist.
	 */
	it('in hydrate, ready is set before the first persist', () => {
		const hydrate = src.slice(src.indexOf('async hydrate()'), src.indexOf('#syncWithHouse(): Promise<void>'));
		const persist = hydrate.indexOf('this.#persist()');
		const ready = hydrate.indexOf('this.#ready = true;', hydrate.indexOf('if (this.#blocked) {'));
		expect(persist).toBeGreaterThan(-1);
		expect(ready).toBeGreaterThan(-1);
		expect(ready, 'the absorb persist runs before ready and writes nothing').toBeLessThan(persist);
	});
});

/* -------------------------------------------------------------------------
 * A hole: a re-keyed dish is absorbed again from the legacy session
 * ---------------------------------------------------------------------- */

describe('a hole: a re-keyed dish comes back from the per-profile session on the next boot', () => {
	/*
	 * rekeyDish REPLACES the old id in `absorbed` with the new one. absorbed
	 * is the memory of which session dishes were taken up, keyed by the id
	 * the SESSION holds, and the session still holds the old id. The next
	 * boot's absorbSession no longer sees it, takes the dish up again under
	 * the old id, and the wake re-keys it again (a fresh id for one the key
	 * sweep refuses, so a new item every boot; the twin's own id for a name
	 * twin, so a duplicate row under one id). The old id must stay in
	 * absorbed beside the new one.
	 */
	it('after a re-key, absorbSession still skips the session dish under its old id', async () => {
		const backing = new Map<string, string>();
		const { api } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		const legacy = dish({ id: 'd-nut12345' });
		const rec = record({ dishes: [legacy], absorbed: ['d-nut12345'] });
		const woke = await wakeHouse(api, rec);
		const renamed = woke.changes.find((c) => c.what === 'renamed');
		expect(renamed?.from).toBe('d-nut12345');
		expect(woke.record.absorbed).toContain(renamed!.id);

		// the next boot: the session still holds the dish under the old id
		const next = absorbSession(woke.record, { menuDishes: [legacy] });
		expect(next, 'the legacy dish was absorbed a second time').toBe(woke.record);

		// rekeyDish alone, the same rule
		const moved = rekeyDish(record({ absorbed: ['d-nut12345'] }), 'd-nut12345', 'd-fresh000');
		expect(moved.absorbed).toContain('d-fresh000');
		expect(moved.absorbed, 'the old id left absorbed').toContain('d-nut12345');
	});
});

/* -------------------------------------------------------------------------
 * Holds: the traps the brief named that the code closes
 * ---------------------------------------------------------------------- */

describe('holds: no write loop on boot', () => {
	it('a realistic record is in step by the second wake: the House is written once and the record is the same object after that', async () => {
		const backing = new Map<string, string>();
		const t = tab(backing);
		await t.api.mintHouse('Brennans', 'hand');
		const rec = record({
			dishes: [
				dish({
					maitre: {
						say: { value: 'A dark roux.', by: 'maitre', ts: T0 - 4000, model: 'a-model' },
						why: { value: 'The roux.', by: 'person', ts: T0 - 3000 },
						ingredientsNamed: { value: ['roux', 'andouille'], by: 'maitre', ts: T0 - 4000 },
						kept: [{ q: 'What is the roux?', a: 'Flour and fat, cooked dark.', ts: T0 - 3500 }]
					}
				}),
				dish({ id: 'd-oyster00', name: 'Oysters', ingredients: [], allergens: [], description: '' }),
				{ id: 'd-bare0000', name: 'Bare', section: '', description: '', allergens: [], price: '', ts: 1 } as unknown as MenuDish
			]
		});
		const once = await wakeHouse(t.api, rec);
		const putsAfterFirst = t.puts;
		const twice = await wakeHouse(t.api, once.record);
		expect(t.puts).toBe(putsAfterFirst);
		const thrice = await wakeHouse(t.api, twice.record);
		expect(thrice.record).toBe(twice.record);
		expect(thrice.changes).toEqual([]);
		expect(t.puts).toBe(putsAfterFirst);
		// and a fresh tab over the same device, same thing
		const u = tab(backing, T0 + 50);
		const fresh = await wakeHouse(u.api, twice.record);
		expect(fresh.record).toBe(twice.record);
		expect(u.puts).toBe(0);
	});

	/*
	 * A nit, not a loop: a row the wake ADOPTS (rule 3) is stamped with the
	 * house and left as it was, never passed through toRow, so a dish written
	 * before a shared field existed (an old record with no ingredients line)
	 * is brought into the adapter's shape by the SECOND wake, which persists
	 * the Table's record once more on the second boot. It converges there,
	 * and the House side is not re-written; but the first wake should hand
	 * back a row the second has nothing to say about.
	 */
	it('a hole, minor: a row adopted by the first wake is already in the adapter\'s shape', async () => {
		const backing = new Map<string, string>();
		const t = tab(backing);
		await t.api.mintHouse('Brennans', 'hand');
		const bare = { id: 'd-bare0000', name: 'Bare', section: '', description: '', allergens: [], price: '', ts: 1 } as unknown as MenuDish;
		const once = await wakeHouse(t.api, record({ dishes: [bare] }));
		const twice = await wakeHouse(t.api, once.record);
		expect(twice.changes, 'the second wake rewrote the adopted row').toEqual([]);
		expect(twice.record).toBe(once.record);
	});

	it('with no house on the device a wake, a put and a remove write nothing and the index is not minted', async () => {
		const backing = new Map<string, string>();
		const t = tab(backing);
		const rec = record({ dishes: [dish()] });
		expect((await wakeHouse(t.api, rec)).record).toBe(rec);
		await putDish(t.api, dish());
		await removeDishFromHouse(t.api, 'd-gumbo');
		expect(t.puts).toBe(0);
		expect(backing.has(HOUSE_INDEX_KEY)).toBe(false);
	});
});

describe('holds: a kept mark is never lost to her mark', () => {
	it('the row\'s kept mark beats a newer maitre mark on the House, both ways', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		const kept = dish({ maitre: { say: { value: 'Ours.', by: 'person', ts: T0 - 4000 } } });
		const woke = await wakeHouse(api, record({ dishes: [kept] }));
		// her newer mark through the api's own door is refused
		clock.at = T0 + 1000;
		expect(await api.setMark('dish', 'd-gumbo', 'say', { value: 'Hers.', by: 'maitre', ts: T0 + 1000 })).toBe(false);
		// and a House item with her newer mark, met by the row's kept one: the kept one stands on both sides
		const forged = { ...api.current()!, dishes: api.current()!.dishes.map((d) => ({ ...d, say: { value: 'Hers.', by: 'maitre' as const, ts: T0 + 2000 } })) };
		await mapStorage(backing).put(forged.id, forged);
		const fresh = tab(backing, T0 + 3000);
		const again = await wakeHouse(fresh.api, woke.record);
		expect(again.record.dishes[0].maitre?.say).toMatchObject({ value: 'Ours.', by: 'person' });
		expect(fresh.api.current()!.dishes[0].say).toMatchObject({ value: 'Ours.', by: 'person' });
	});

	it('an unkept mark on the House never reaches a reader as kept: by rides the row as it is', async () => {
		const backing = new Map<string, string>();
		const { api } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		await api.put('dish', { ...dish({ house: api.currentId()! }), maitre: { guest: { value: 'A line.', by: 'maitre', ts: T0 } } } as unknown as SyncRow);
		const woke = await wakeHouse(api, record());
		expect(woke.record.dishes[0].maitre?.guest?.by).toBe('maitre');
	});
});

describe('holds: a removal writes a tombstone whatever the House held', () => {
	it('a dish the House never held still gets a tombstone, and a backup row of it does not come back', async () => {
		const backing = new Map<string, string>();
		const { api, clock } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		clock.at = T0 + 100;
		expect(await removeDishFromHouse(api, 'd-gumbo')).toEqual({});
		expect(api.current()!.removed['d-gumbo']).toBe(T0 + 100);
		const backup = record({ dishes: [dish()] });
		const woke = await wakeHouse(api, backup);
		expect(woke.record.dishes).toEqual([]);
	});
});

describe('holds: nothing the api does throws into the store', () => {
	it('a storage whose doors throw comes back as a sentence on every wing of the wake', async () => {
		const broken: HouseStorage = {
			getIndex: () => {
				throw new Error('no index');
			},
			setIndex: () => {
				throw new Error('no index');
			},
			get: async () => {
				throw new Error('no database');
			},
			put: async () => {
				throw new Error('no database');
			},
			remove: async () => {
				throw new Error('no database');
			},
			list: async () => {
				throw new Error('no database');
			}
		};
		const api = createHouseApi(broken, { now: () => T0, rand: seeded() });
		const rec = record({ dishes: [dish()] });
		await expect(wakeHouse(api, rec)).resolves.toMatchObject({ record: rec });
		await expect(putDish(api, dish())).resolves.toEqual({});
		await expect(removeDishFromHouse(api, 'd-gumbo')).resolves.toEqual({});
		await expect(switchHouse(api, rec, 'h-nowhere')).resolves.toMatchObject({ ok: false, record: rec });
	});

	it('an api whose sync throws is a refusal, not a throw', async () => {
		const backing = new Map<string, string>();
		const { api } = tab(backing);
		await api.mintHouse('Brennans', 'hand');
		const throwing = { ...api, sync: async () => { throw new Error('the database closed'); } } as HouseApi;
		const out = await wakeHouse(throwing, record({ dishes: [dish()] }));
		expect(out.refusal).toContain('the database closed');
	});
});

describe('holds: the store\'s guards on the source', () => {
	it('the re-sync from another tab is guarded by blocked and realigns the api before the wake', () => {
		const body = method('async #resyncWithHouse()');
		expect(body).toContain('this.#blocked');
		expect(body).toContain('api.currentId()');
		expect(body).toContain('this.#syncWithHouse()');
	});

	it('the wake persists only when the record changed and no mutation landed meanwhile', () => {
		const body = method('#syncWithHouse(again = true)');
		expect(body).toContain('if (record !== snap)');
		expect(body).toContain('snap.lastWrite === this.#r.lastWrite');
	});

	it('no store write reaches the House before ready, and the api is never built on the server', () => {
		for (const sig of ['#putToHouse(dish: MenuDish)', '#removeFromHouse(id: string)', 'switchHouse(id: string)', '#syncWithHouse(again = true)']) {
			expect(method(sig), sig).toContain('!this.#ready');
		}
		expect(src).toContain("if (typeof window === 'undefined') return undefined;");
		const page = readFileSync('src/lib/components/HouseBar.svelte', 'utf8');
		const script = page.slice(page.indexOf('<script lang="ts">'), page.indexOf('</script>', page.indexOf('<script lang="ts">')));
		const mount = script.indexOf('onMount(');
		expect(mount).toBeGreaterThan(-1);
		// house.api is read inside onMount and nowhere earlier in the script
		expect(script.slice(0, mount)).not.toContain('house.api');
		expect(script).not.toMatch(/localStorage|indexedDB/);
	});
});
