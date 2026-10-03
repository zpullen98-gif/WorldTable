import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHouseApi } from '../house/house-api';
import type { HouseApi } from '../house/house-api';
import { mapStorage } from '../house/house-store';
import { EMPTY_HOUSE, type HouseRecord } from '../persistence/house';
import type { MenuDish } from '../persistence/state';
import { putDish, removeDishFromHouse, wakeHouse } from './house-wake';

/**
 * The shipped pack's auto-load, as the store runs it (ensurePack, then the
 * store's own wake), over a Map storage: what a person's device sees across
 * editions. Adversarial: a refresh must bring a newer edition's words in,
 * and must never lose what a person edited or removed on the Table.
 */

const PACK = readFileSync(new URL('../../../static/shared/packs/brennans-new-orleans.v1.oothouse.json', import.meta.url), 'utf8');
const NEW_AT = Date.parse('2026-10-03T21:00:00.000Z');

function oldPack(): string | null {
	try {
		return execSync('git show 1b45315:static/shared/packs/brennans-new-orleans.v1.oothouse.json', { cwd: new URL('../../../', import.meta.url).pathname, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	} catch {
		return null;
	}
}

/** The next edition, as keep-all would stamp it: every mark, note and record ts moved to the new builtAt. */
function nextEdition(text: string, at: string, edit: (house: Record<string, any>) => void): string {
	const pack = JSON.parse(text);
	const from = Date.parse(pack.house.pack.builtAt);
	const to = Date.parse(at);
	const walk = (v: any): any => {
		if (Array.isArray(v)) return v.map(walk);
		if (v && typeof v === 'object') {
			for (const k of Object.keys(v)) {
				if (k === 'ts' && v[k] === from) v[k] = to;
				else v[k] = walk(v[k]);
			}
			return v;
		}
		return v;
	};
	walk(pack.house);
	pack.house.pack.builtAt = at;
	pack.house.lastWrite = to;
	edit(pack.house);
	return JSON.stringify(pack);
}

function tab(backing: Map<string, string>, clock: { at: number }): HouseApi {
	let n = 7;
	return createHouseApi(mapStorage(backing), {
		now: () => clock.at,
		rand: () => ((n = (n * 9301 + 49297) % 233280), n / 233280),
		from: 'table'
	});
}

/** One boot as the store runs it after this change: the wake, then ensurePack, then the wake twice. */
async function boot(backing: Map<string, string>, rec: HouseRecord, text: string, clock: { at: number }) {
	const api = tab(backing, clock);
	let r = (await wakeHouse(api, rec)).record;
	await api.ready();
	/* Her own dishes and no house: the store holds the pack for her press and writes nothing. */
	if (!api.current() && r.dishes.length > 0 && !api.list().some((h) => h.id === JSON.parse(text).house.id)) {
		return { api, rec: r, res: { action: 'held' as const } };
	}
	const res = await api.ensurePack(text);
	if ((res.action === 'added' && res.current) || res.action === 'refreshed') {
		r = (await wakeHouse(api, r)).record;
		r = (await wakeHouse(api, r)).record;
	}
	return { api, rec: r, res };
}

describe('auto-load across editions, through the Table wake', () => {
	it('after the first load and its settling wakes, the dishes on the device still carry the edition stamp', async () => {
		const backing = new Map<string, string>();
		const clock = { at: NEW_AT + 86400000 };
		const { api, res } = await boot(backing, structuredClone(EMPTY_HOUSE), PACK, clock);
		expect(res.action).toBe('added');
		const house = api.current()!;
		const off = house.dishes.filter((d) => d.ts !== NEW_AT).map((d) => d.name);
		expect(off).toEqual([]);
	});

	it('a later edition that rewrites a dish description reaches the Table record when nobody touched that dish', async () => {
		const backing = new Map<string, string>();
		const clock = { at: NEW_AT + 86400000 };
		const first = await boot(backing, structuredClone(EMPTY_HOUSE), PACK, clock);
		const target = first.api.current()!.dishes[3];
		clock.at += 86400000;
		const next = nextEdition(PACK, '2026-10-10T21:00:00.000Z', (h) => {
			h.dishes.find((d: any) => d.id === target.id).description = 'A new description from the next edition';
		});
		const second = await boot(backing, first.rec, next, clock);
		expect(second.res.action).toBe('refreshed');
		const row = second.rec.dishes.find((d) => d.id === target.id)!;
		expect(row.description).toBe('A new description from the next edition');
	});

	it('a later edition never overwrites a description the person edited on the Table, nor brings back a dish she removed', async () => {
		const backing = new Map<string, string>();
		const clock = { at: NEW_AT + 86400000 };
		const first = await boot(backing, structuredClone(EMPTY_HOUSE), PACK, clock);
		const [edited, removed] = [first.api.current()!.dishes[4], first.api.current()!.dishes[5]];
		clock.at += 1000;
		const mine = { ...(first.rec.dishes.find((d) => d.id === edited.id) as MenuDish), description: 'My own words for it', ts: clock.at };
		await putDish(first.api, mine);
		let rec: HouseRecord = { ...first.rec, dishes: first.rec.dishes.map((d) => (d.id === mine.id ? mine : d)).filter((d) => d.id !== removed.id) };
		await removeDishFromHouse(first.api, removed.id);
		clock.at += 86400000;
		const next = nextEdition(PACK, '2026-10-10T21:00:00.000Z', (h) => {
			h.dishes.find((d: any) => d.id === edited.id).description = 'The edition rewrote it';
		});
		const second = await boot(backing, rec, next, clock);
		rec = second.rec;
		expect(rec.dishes.find((d) => d.id === edited.id)?.description).toBe('My own words for it');
		expect(rec.dishes.some((d) => d.id === removed.id)).toBe(false);
	});

	it('a device holding the previous edition, used on the Table, takes the new one in: every dish and every wine line', async () => {
		const old = oldPack();
		if (!old) return;
		const backing = new Map<string, string>();
		const clock = { at: Date.parse('2026-10-01T12:00:00.000Z') };
		const first = await boot(backing, structuredClone(EMPTY_HOUSE), old, clock);
		expect(first.res.action).toBe('added');
		clock.at = NEW_AT + 3600000;
		const second = await boot(backing, first.rec, PACK, clock);
		expect(second.res.action).toBe('refreshed');
		const house = second.api.current()!;
		expect(second.rec.dishes.length).toBe(62);
		expect(house.wines.filter((w: any) => !(w.lines && w.lines.by === 'person')).map((w) => w.name)).toEqual([]);
		// and the next boot writes nothing
		const before = JSON.stringify([...backing.entries()]);
		const third = await boot(backing, second.rec, PACK, clock);
		expect(third.res.action).toBe('current');
		expect(third.rec).toBe(second.rec);
		expect(JSON.stringify([...backing.entries()])).toBe(before);
	});
});

describe('auto-load in two tabs opened together on a fresh device', () => {
	it('lands one Brennan’s, never a second copy under a fresh id', async () => {
		const backing = new Map<string, string>();
		const clock = { at: NEW_AT + 86400000 };
		/* IndexedDB, like any real store, answers later than the call: every async door waits a tick. */
		const slow = (): HouseApi => {
			const inner = mapStorage(backing);
			const wait = <T>(v: Promise<T>) => new Promise<T>((r) => setTimeout(() => r(v), 2));
			const storage = { ...inner, get: (id: string) => wait(inner.get(id)), put: (id: string, h: any) => wait(inner.put(id, h)), remove: (id: string) => wait(inner.remove(id)), list: () => wait(inner.list()) };
			return createHouseApi(storage, { now: () => clock.at, rand: Math.random, from: 'table' });
		};
		const a = slow();
		const b = slow();
		const [ra, rb] = await Promise.all([a.ensurePack(PACK), b.ensurePack(PACK)]);
		const fresh = tab(backing, clock);
		await fresh.ready();
		const houses = fresh.list();
		expect(houses.filter((h) => h.name === 'Brennan’s' || h.name === "Brennan's").length, JSON.stringify({ ra, rb, houses })).toBe(1);
	});
});

describe('auto-load on a device whose menu holds dishes of her own and no house yet', () => {
	it('never files her own dishes under Brennan’s by itself: no write without a person’s act', async () => {
		const backing = new Map<string, string>();
		const clock = { at: NEW_AT + 86400000 };
		const own: MenuDish = {
			id: 'd-mysoup01',
			name: 'Leek Soup',
			section: 'Starters',
			description: 'Leeks, potato, cream.',
			ingredients: ['leek', 'potato', 'cream'],
			allergens: [],
			price: '9',
			ts: clock.at - 5000
		} as MenuDish;
		const rec: HouseRecord = { ...structuredClone(EMPTY_HOUSE), dishes: [own] };
		const { api, rec: after, res } = await boot(backing, rec, PACK, clock);
		expect(res.action).toBe('held');
		expect(api.current()).toBeNull();
		expect(api.list()).toEqual([]);
		expect(backing.size).toBe(0);
		expect(after).toBe(rec);
		/* Her press (loadHeldPack): the pack added and made current, then the store's sync. */
		const pressed = await api.ensurePack(PACK, { makeCurrent: true });
		expect(pressed).toMatchObject({ action: 'added', current: true });
		expect(api.current()?.name).toMatch(/^Brennan/);
	});
});
