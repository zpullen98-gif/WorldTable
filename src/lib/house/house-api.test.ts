import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { HOUSE_INDEX_KEY, HOUSE_LISTS, ID_PREFIXES, KEYS, LINE_CAPS, DISH_PARTS, MARK_FIELDS, PROSE_MAX, WINE_PARTS, COCKTAIL_PARTS, isMark } from './house-schema';
import type { House, HouseDish, Mark } from './house-schema';
import { lastTouch, mergeHouse } from './house-merge';
import { MAP_HOUSE_PREFIX, mapStorage } from './house-store';
import type { HouseStorage } from './house-store';
import type { SyncRow } from './house-sync';
import { buildPack, editionItemStamp, editionStamp, refreshEdition } from './house-pack';
import { CARD_KEYS, ITEM_FIELDS, NO_HOUSE_SAID, PUT_LISTS, adapterFor, createHouseApi, listFor } from './house-api';
import type { PutList } from './house-api';
import type { ChangeWhat, HouseApi, HouseEventWindow } from './house-api';
import { assertClean, portModules, unitsIn } from '../../../tools/port-core.mjs';

/**
 * The api is what every wing calls, so what is under test is the contract
 * the port will install: every method's guard with no house, the one write
 * door, the listeners, the storage event, the names across houses, and the
 * tombstone the sync honours. All of it over the Map adapter and a fake
 * window, the way the Node checks will run it. The last case bundles the
 * nine modules through the port engine and runs the result in an empty
 * context, which is the proof that nothing touches the DOM at load.
 *
 * No dash is spelled in this file.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const fixture = JSON.parse(readFileSync(here('./fixtures/house-min.json'), 'utf8')) as House;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const T0 = 1790800000000;
const mark = <T = string>(value: T, by: 'maitre' | 'person', ts: number): Mark<T> => ({ value, by, ts });
const FORBIDDEN_KEY = /allerg|contain|free|safe|suitab|vegan|nut/i;

function seeded(start = 7): () => number {
	let n = start;
	return () => {
		n = (n * 9301 + 49297) % 233280;
		return n / 233280;
	};
}

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

/** A window with the one thing the api asks of it, and a way to fire the event from the test. */
function fakeWindow() {
	const fns: Array<(ev: unknown) => void> = [];
	const win: HouseEventWindow & { fire(key: string | null): void; count: number } = {
		count: 0,
		addEventListener(type, fn) {
			if (type === 'storage') fns.push(fn);
			win.count++;
		},
		fire(key) {
			for (const fn of fns) fn({ key });
		}
	};
	return win;
}

/** An api over a Map with a clock the test moves, and a seeded mint. */
function make(backing = new Map<string, string>(), win?: HouseEventWindow, storage?: HouseStorage) {
	const clock = { at: T0 };
	const api = createHouseApi(storage || mapStorage(backing), { now: () => clock.at, rand: seeded(), win, from: 'table' });
	return { api, clock, backing };
}

const nextChange = (api: HouseApi): Promise<ChangeWhat> =>
	new Promise((resolve) => {
		const off = api.onChange((_h, what) => {
			off();
			resolve(what);
		});
	});

/** A write and the change it fired, together; the write must fire one or this never settles. */
const nextChangeOf = async <T>(api: HouseApi, fn: () => Promise<T>): Promise<[T, ChangeWhat]> => {
	const what = nextChange(api);
	const out = await fn();
	return [out, await what];
};

const packText = JSON.stringify(buildPack(fixture, 'tools', T0));

const dishRow = (id: string, name: string, ts: number): SyncRow => ({
	id,
	name,
	section: 'Starters',
	description: 'A bowl of ' + name.toLowerCase(),
	ingredients: ['stock', 'leeks'],
	price: '8',
	ts
});

/* -------------------------------------------------------------------------
 * The contract
 * ---------------------------------------------------------------------- */

describe('the api object', () => {
	it('carries exactly the methods and constants the port installs', () => {
		const { api } = make();
		expect(Object.keys(api).sort()).toEqual(
			[
				'ready', 'current', 'currentId', 'list', 'switchTo', 'mintHouse', 'rename', 'remove',
				'put', 'sync', 'rows', 'setMark', 'setCard', 'setItemField', 'putListItem', 'removeItem', 'names',
				'readPack', 'importPack', 'ensurePack', 'buildPack', 'onChange',
				'HOUSE_INDEX_KEY', 'HOUSE_MAX_BYTES', 'LINE_CAPS', 'DISH_PARTS', 'WINE_PARTS', 'COCKTAIL_PARTS', 'PARTS', 'PRINCIPLES', 'BUILD_STEPS'
			].sort()
		);
		expect(api.HOUSE_INDEX_KEY).toBe(HOUSE_INDEX_KEY);
		expect(api.LINE_CAPS).toBe(LINE_CAPS);
		expect(api.PARTS).toEqual({ dish: DISH_PARTS, wine: WINE_PARTS, cocktail: COCKTAIL_PARTS });
		for (const k of Object.keys(api)) expect(k).not.toMatch(FORBIDDEN_KEY);
	});

	it('a Window is a HouseEventWindow', () => {
		type Fits = Window extends HouseEventWindow ? true : false;
		const fits: Fits = true;
		expect(fits).toBe(true);
	});

	it('adapterFor and listFor', () => {
		expect(adapterFor('dish').kind).toBe('dish');
		expect(adapterFor('wine').kind).toBe('wine');
		expect(adapterFor('cocktail').kind).toBe('cocktail');
		expect(listFor('dish')).toBe('dishes');
		expect(listFor('cocktail')).toBe('cocktails');
		expect(listFor('lexicon')).toBe('lexicon');
		expect(listFor('house')).toBeUndefined();
		expect(listFor('nope')).toBeUndefined();
		expect(CARD_KEYS.every((k) => (KEYS.House as readonly string[]).includes(k))).toBe(true);
	});
});

describe('with no house on the device', () => {
	it('ready reads and writes nothing, and every method answers empty without writing', async () => {
		const { api, backing } = make();
		await api.ready();
		await api.ready();
		expect(api.current()).toBeNull();
		expect(api.currentId()).toBeNull();
		expect(api.list()).toEqual([]);
		const row = dishRow('d-soup0001', 'Soup', T0);
		expect(await api.put('dish', row)).toEqual({ ok: false, row: null, said: NO_HOUSE_SAID });
		const synced = await api.sync('dish', [row]);
		expect(synced.ok).toBe(false);
		expect(synced.rows).toEqual([row]);
		expect(synced.changes).toEqual([]);
		expect(synced.said).toBe(NO_HOUSE_SAID);
		expect(api.rows('dish')).toEqual([]);
		expect(await api.setMark('dish', 'd-soup0001', 'say', mark('x', 'person', T0))).toBe(false);
		expect(await api.setCard({ name: 'A' })).toBe(false);
		expect(await api.removeItem('dish', 'd-soup0001')).toBe(false);
		expect(api.buildPack()).toBeNull();
		expect(await api.names('cocktail')).toEqual([]);
		expect(await api.rename('A')).toBe(false);
		expect(await api.switchTo('h-lantern0')).toBeNull();
		expect(await api.remove('h-lantern0', 'The Lantern Room')).toBe(false);
		expect(backing.size).toBe(0);
	});
});

/* -------------------------------------------------------------------------
 * The round trip
 * ---------------------------------------------------------------------- */

describe('the round trip', () => {
	it('mintHouse makes the first house current and put files a row through the sync', async () => {
		const { api, clock } = make();
		await api.ready();
		const house = await api.mintHouse('The Lantern Room');
		expect(house).not.toBeNull();
		if (!house) return;
		expect(api.current()).toEqual(house);
		expect(api.currentId()).toBe(house.id);
		expect(api.list().map((s) => s.name)).toEqual(['The Lantern Room']);

		const put = await api.put('dish', dishRow('d-soup0001', 'Harbour Soup', T0));
		expect(put.ok).toBe(true);
		expect(put.row && put.row.house).toBe(house.id);
		const cur = api.current();
		expect(cur && cur.dishes.length).toBe(1);
		expect(cur && cur.dishes[0].house).toBe(house.id);
		expect(cur && cur.dishes[0].name).toBe('Harbour Soup');
		expect(cur && cur.lastWrite).toBe(T0);

		clock.at = T0 + 10;
		const newer = { ...dishRow('d-soup0001', 'Harbour Soup', T0 + 5), house: house.id, description: 'A deeper bowl' };
		const again = await api.put('dish', newer);
		expect(again.ok).toBe(true);
		expect(api.current()?.dishes[0].description).toBe('A deeper bowl');
		expect(api.current()?.lastWrite).toBe(T0 + 10);

		const older = { ...newer, ts: T0 + 1, description: 'An older bowl' };
		const before = api.current();
		const stale = await api.put('dish', older);
		expect(stale.ok).toBe(true);
		expect(stale.row && stale.row.description).toBe('A deeper bowl');
		expect(api.current()).toBe(before);
	});

	it('put never pairs by name (the wake has; the item\'s own row is on the wing) and reports a removed row as null', async () => {
		const { api } = make();
		await api.importPack(packText, { mode: 'new' });
		/* A second dish with a twin name through the wing's own door is a new
		   item: re-keying it onto d-chicken1 would put two rows under one id on
		   a wing that already holds the item's own row. */
		const twin = { ...dishRow('d-twin0001', 'lantern ROAST chicken', T0 + 1), house: fixture.id };
		const put = await api.put('dish', twin);
		expect(put.ok).toBe(true);
		expect(put.row && put.row.id).toBe('d-twin0001');
		expect(api.current()?.dishes.map((d) => d.id)).toEqual(['d-chicken1', 'd-beetrt01', 'd-twin0001']);
		await api.removeItem('dish', 'd-twin0001');

		/* The wing's row predates the delete, as a row on another tab would; a tombstone is honoured only when newer. */
		await api.removeItem('dish', 'd-beetrt01');
		const gone = await api.put('dish', { ...dishRow('d-beetrt01', 'Beetroot and Apple Salad', fixture.dishes[1].ts), house: fixture.id });
		expect(gone).toEqual({ ok: true, row: null });
		expect(api.current()?.dishes.map((d) => d.id)).toEqual(['d-chicken1']);
	});

	it('importPack, buildPack, readPack, switchTo, rows, rename and remove', async () => {
		const { api, clock } = make();
		await api.ready();
		const imported = await api.importPack(packText, { mode: 'new' });
		expect(imported.ok && imported.current).toBe(true);
		expect(api.current()?.id).toBe(fixture.id);
		expect(api.current()?.lastWrite).toBe(T0);

		const built = api.buildPack();
		expect(built).not.toBeNull();
		if (!built) return;
		expect(built.filename).toBe('house-the-lantern-room-' + new Date(T0).toISOString().slice(0, 10) + '.oothouse.json');
		expect(built.pack.app.from).toBe('table');
		expect(api.buildPack('codex')?.pack.app.from).toBe('codex');
		expect(JSON.parse(built.text)).toEqual(built.pack);
		const read = api.readPack(built.text);
		expect(read.ok && read.house).toEqual(api.current());

		clock.at = T0 + 1;
		const second = await api.mintHouse('The Second Room', 'desk');
		expect(second).not.toBeNull();
		if (!second) return;
		expect(api.list().map((s) => s.id)).toEqual([fixture.id, second.id]);
		expect(api.current()?.id).toBe(fixture.id);
		expect(api.rows('dish').map((r) => r.id)).toEqual(['d-chicken1', 'd-beetrt01']);
		expect(api.rows('dish').every((r) => r.house === fixture.id)).toBe(true);

		expect(await api.switchTo('h-nowhere0')).toBeNull();
		expect(api.current()?.id).toBe(fixture.id);
		const switched = await api.switchTo(second.id);
		expect(switched?.id).toBe(second.id);
		expect(api.currentId()).toBe(second.id);
		expect(api.rows('dish')).toEqual([]);
		expect(api.rows('cocktail')).toEqual([]);

		expect(await api.rename('  ')).toBe(false);
		expect(await api.rename('The Second Room, renamed')).toBe(true);
		expect(api.current()?.name).toBe('The Second Room, renamed');
		expect(api.list()[1].name).toBe('The Second Room, renamed');
		expect(await api.rename('The Lamp Room', fixture.id)).toBe(true);
		expect(api.list()[0].name).toBe('The Lamp Room');
		expect(api.current()?.name).toBe('The Second Room, renamed');

		expect(await api.remove(second.id, 'wrong')).toBe(false);
		expect(api.current()?.id).toBe(second.id);
		expect(await api.remove(second.id, 'The Second Room, renamed')).toBe(true);
		expect(api.list().map((s) => s.id)).toEqual([fixture.id]);
		expect(api.current()?.id).toBe(fixture.id);
		expect(await api.remove(fixture.id, 'The Lamp Room')).toBe(true);
		expect(api.current()).toBeNull();
		expect(api.list()).toEqual([]);
	});

	it('sync files a wing\'s whole list and returns the rows to write back', async () => {
		const { api } = make();
		await api.importPack(packText, { mode: 'new' });
		const rows = api.rows('cocktail');
		expect(rows.length).toBe(2);
		const same = await api.sync('cocktail', rows);
		expect(same.ok).toBe(true);
		expect(same.rows).toBe(rows);
		expect(same.changes).toEqual([]);

		const mine: SyncRow = { id: 'b-mine0001', name: 'The Quay Sour', spec: ['50 ml gin'], ts: T0 + 1 };
		const synced = await api.sync('cocktail', [...rows, mine]);
		expect(synced.ok).toBe(true);
		expect(synced.changes.map((c) => c.id + ':' + c.what).sort()).toEqual(['b-mine0001:adopted', 'b-mine0001:item-added']);
		expect(synced.rows.find((r) => r.id === 'b-mine0001')?.house).toBe(fixture.id);
		expect(api.current()?.cocktails.map((c) => c.id)).toEqual(['b-collins1', 'b-verjus01', 'b-mine0001']);
	});
});

/* -------------------------------------------------------------------------
 * The listeners
 * ---------------------------------------------------------------------- */

describe('onChange', () => {
	it('fires after every save with what happened, and stops when removed', async () => {
		const { api } = make();
		await api.ready();
		const seen: ChangeWhat[] = [];
		const off = api.onChange((_h, what) => {
			seen.push(what);
		});
		await api.mintHouse('A');
		await api.put('dish', dishRow('d-soup0001', 'Soup', T0));
		await api.setMark('dish', 'd-soup0001', 'say', mark('Soup.', 'person', T0));
		await api.setCard({ dressCode: 'None' });
		await api.removeItem('dish', 'd-soup0001');
		await api.sync('dish', [dishRow('d-soup0002', 'Broth', T0)]);
		await api.rename('B');
		const second = await api.mintHouse('C');
		if (!second) throw new Error('mint failed');
		await api.switchTo(second.id);
		await api.importPack(packText, { mode: 'new' });
		await api.remove(second.id, 'C');
		expect(seen).toEqual(['mint', 'put', 'mark', 'card', 'remove-item', 'sync', 'rename', 'mint', 'switch', 'import', 'remove']);
		off();
		await api.setCard({ dressCode: 'Jackets' });
		expect(seen.length).toBe(11);
	});

	it('does not fire when nothing was saved, and a listener that throws stops nothing', async () => {
		const { api } = make();
		await api.ready();
		await api.mintHouse('A');
		const seen: ChangeWhat[] = [];
		api.onChange(() => {
			throw new Error('a careless listener');
		});
		api.onChange((_h, what) => {
			seen.push(what);
		});
		expect(await api.setMark('dish', 'd-nope0000', 'say', mark('x', 'person', T0))).toBe(false);
		expect(await api.setCard({})).toBe(false);
		expect(seen).toEqual([]);
		await api.setCard({ dressCode: 'None' });
		expect(seen).toEqual(['card']);
	});

	it('fires ready once the first read is done, with the house it found', async () => {
		const backing = new Map<string, string>();
		const first = make(backing);
		await first.api.importPack(packText, { mode: 'new' });
		const { api } = make(backing);
		const whats: ChangeWhat[] = [];
		let found: House | null = null;
		api.onChange((h, what) => {
			whats.push(what);
			found = h;
		});
		await api.ready();
		expect(whats).toEqual(['ready']);
		expect(found && (found as House).id).toBe(fixture.id);
	});
});

describe('the storage event', () => {
	it('reloads the house on the index key, ignores other keys, and listens once', async () => {
		const backing = new Map<string, string>();
		const winA = fakeWindow();
		const winB = fakeWindow();
		const a = make(backing, winA);
		const b = make(backing, winB);
		await a.api.ready();
		await b.api.ready();
		await b.api.ready();
		expect(winB.count).toBe(1);
		expect(b.api.current()).toBeNull();

		await a.api.mintHouse('A');
		await a.api.put('dish', dishRow('d-soup0001', 'Soup', T0));
		let pending = nextChange(b.api);
		winB.fire(HOUSE_INDEX_KEY);
		expect(await pending).toBe('storage');
		expect(b.api.current()?.dishes.length).toBe(1);

		await a.api.put('dish', dishRow('d-soup0002', 'Broth', T0));
		winB.fire('oot-menu-desk-v1');
		await new Promise((r) => setTimeout(r, 0));
		expect(b.api.current()?.dishes.length).toBe(1);

		pending = nextChange(b.api);
		winB.fire(null);
		expect(await pending).toBe('storage');
		expect(b.api.current()?.dishes.length).toBe(2);
	});
});

/* -------------------------------------------------------------------------
 * Names across houses, the tombstone, the marks and the card
 * ---------------------------------------------------------------------- */

describe('names', () => {
	it('spans every house on the device, in the index\'s order, each name once', async () => {
		const { api, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		clock.at = T0 + 1;
		const second = await api.mintHouse('The Second Room');
		if (!second) throw new Error('mint failed');
		await api.switchTo(second.id);
		await api.sync('cocktail', [
			{ id: 'b-second01', name: 'The Second Sour', spec: ['50 ml rum'], ts: T0 + 1 },
			{ id: 'b-second02', name: 'Verjus and Tonic', spec: [], ts: T0 + 1 },
			{ id: 'b-second03', name: '   ', spec: [], ts: T0 + 1 }
		]);
		expect(await api.names('cocktail')).toEqual(['The Lantern Collins', 'Verjus and Tonic', 'The Second Sour']);
		expect(await api.names('dish')).toEqual(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);
		expect(await api.names('wine')).toEqual(['Quay Lane Harbour White 2024']);
	});
});

describe('removeItem', () => {
	it('writes a tombstone newer than the item\'s last touch and drops the item; the sync then drops the row', async () => {
		const { api, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		const rows = api.rows('cocktail');
		const collins = fixture.cocktails[0];
		/* The clock set BEFORE the kept marks' stamps: the tombstone must still beat them. */
		clock.at = collins.ts + 1;
		expect(await api.removeItem('cocktail', 'b-collins1')).toBe(true);
		const house = api.current();
		expect(house?.cocktails.map((c) => c.id)).toEqual(['b-verjus01']);
		const tomb = house?.removed['b-collins1'] || 0;
		expect(tomb).toBe(lastTouch(collins, ['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed', 'parts', 'lines', 'upsells']) + 1);
		expect(tomb).toBeGreaterThan(clock.at);

		const synced = await api.sync('cocktail', rows);
		expect(synced.ok).toBe(true);
		expect(synced.changes).toEqual([{ id: 'b-collins1', what: 'row-removed' }]);
		expect(synced.rows.map((r) => r.id)).toEqual(['b-verjus01']);
		expect(api.current()?.cocktails.map((c) => c.id)).toEqual(['b-verjus01']);
		expect(api.current()?.removed['b-collins1']).toBe(tomb);
	});

	it('writes a tombstone for an id the house never held, and refuses an unknown list', async () => {
		const { api, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		clock.at = T0 + 7;
		expect(await api.removeItem('cocktail', 'b-never000')).toBe(true);
		expect(api.current()?.removed['b-never000']).toBe(T0 + 7);
		expect(await api.removeItem('lexicon', 'x-verjus01')).toBe(true);
		expect(api.current()?.lexicon.map((x) => x.id)).toEqual(['x-saltbak1']);
		expect(await api.removeItem('nope' as never, 'x-verjus01')).toBe(false);
	});
});

describe('setMark', () => {
	it('keeps a mark, never lets hers displace a kept one, and discards with null', async () => {
		const { api } = make();
		await api.importPack(packText, { mode: 'new' });
		const kept = mark('BEET root, as it reads.', 'person', T0);
		expect(await api.setMark('dish', 'd-beetrt01', 'say', kept)).toBe(true);
		expect(api.current()?.dishes[1].say).toEqual(kept);
		expect(await api.setMark('dish', 'd-beetrt01', 'say', mark('Hers.', 'maitre', T0 + 9))).toBe(false);
		expect(api.current()?.dishes[1].say).toEqual(kept);
		const edited = mark('BEET root.', 'person', T0 + 1);
		expect(await api.setMark('dish', 'd-beetrt01', 'say', edited)).toBe(true);
		expect(api.current()?.dishes[1].say).toEqual(edited);
		expect(await api.setMark('dish', 'd-beetrt01', 'say', null)).toBe(true);
		expect(api.current()?.dishes[1].say).toBeUndefined();
		expect(await api.setMark('dish', 'd-beetrt01', 'say', null)).toBe(false);
		expect(await api.setMark('dish', 'd-beetrt01', 'say', mark('Hers now.', 'maitre', T0 + 2))).toBe(true);
		expect(api.current()?.dishes[1].say?.by).toBe('maitre');
	});

	it('refuses an unknown item, a field the list has no mark for, a blank, and a value of the wrong kind', async () => {
		const { api } = make();
		await api.importPack(packText, { mode: 'new' });
		expect(await api.setMark('dish', 'd-nope0000', 'say', mark('x', 'person', T0))).toBe(false);
		expect(await api.setMark('dish', 'd-beetrt01', 'aller' + 'gens', mark('x', 'person', T0))).toBe(false);
		expect(await api.setMark('dish', 'd-beetrt01', 'description', mark('x', 'person', T0))).toBe(false);
		expect(await api.setMark('dish', 'd-beetrt01', 'say', mark('   ', 'person', T0))).toBe(false);
		expect(await api.setMark('dish', 'd-beetrt01', 'say', { value: 'x' })).toBe(false);
		expect(await api.setMark('dish', 'd-beetrt01', 'lines', mark('a string, not lines', 'person', T0))).toBe(false);
		expect(await api.setMark('tastings', 't-harbour1', 'name', mark('x', 'person', T0))).toBe(false);
	});

	it('takes a mark through the normaliser, so a stray key inside the value is dropped', async () => {
		const { api, backing } = make();
		await api.importPack(packText, { mode: 'new' });
		const parts = { main: 'Beetroot', technique: 'Salt baked', sauce: 'Sherry vinegar', sides: 'Apple and shallot', taste: 'Earthy and sharp' };
		const dirty = { value: { ...parts, ['aller' + 'gens']: ['x'] }, by: 'person', ts: T0 };
		expect(await api.setMark('dish', 'd-beetrt01', 'parts', dirty)).toBe(true);
		const stored = api.current()?.dishes[1].parts;
		expect(stored).toEqual(mark(parts, 'person', T0));
		for (const [, text] of backing) for (const k of keysDeep(JSON.parse(text))) expect(k).not.toMatch(FORBIDDEN_KEY);
	});

	it('works on every list that carries marks, and on the card\'s history', async () => {
		const { api } = make();
		await api.importPack(packText, { mode: 'new' });
		expect(await api.setMark('lexicon', 'x-saltbak1', 'toGuest', mark('Cooked in a salt crust.', 'person', T0))).toBe(true);
		expect(api.current()?.lexicon[1].toGuest?.value).toBe('Cooked in a salt crust.');
		expect(await api.setMark('scenarios', 's-hurry001', 'you', mark('Order now.', 'maitre', T0))).toBe(false);
		expect(await api.setMark('mixUps', 'm-chkbeet1', 'ask', mark('Which course?', 'person', T0 + 1))).toBe(true);
		expect(await api.setMark('mustKnows', 'k-lastord1', 'body', mark('Ten sharp.', 'person', T0 + 1))).toBe(true);
		expect(await api.setMark('house', '', 'history', mark('Hers.', 'maitre', T0 + 1))).toBe(false);
		expect(await api.setMark('house', '', 'name', mark('x', 'person', T0 + 1))).toBe(false);
		expect(await api.setMark('house', '', 'history', null)).toBe(true);
		expect(api.current()?.history).toBeUndefined();
		expect(await api.setMark('house', '', 'history', mark('Hers.', 'maitre', T0 + 1))).toBe(true);
		expect(api.current()?.history?.by).toBe('maitre');
	});
});

describe('setCard', () => {
	it('sets the card\'s plain fields, renames the stub, refuses a blank name and drops what is not a card key', async () => {
		const { api, backing } = make();
		await api.importPack(packText, { mode: 'new' });
		expect(await api.setCard({ name: ' The Lamp Room ', dressCode: 'None', menusReadOn: '2026-10-03' })).toBe(true);
		expect(api.current()?.name).toBe(' The Lamp Room ');
		expect(api.list()[0].name).toBe(' The Lamp Room ');
		expect(api.current()?.dressCode).toBe('None');
		expect(api.current()?.menusReadOn).toBe('2026-10-03');
		expect(api.current()?.history).toEqual(fixture.history);
		expect(await api.setCard({ name: '  ' })).toBe(false);
		expect(await api.setCard({})).toBe(false);
		expect(await api.setCard({ ['aller' + 'gens']: 'x' } as never)).toBe(false);
		expect(await api.setCard({ phone: 123 } as never)).toBe(true);
		expect(api.current()?.phone).toBe('');
		for (const [, text] of backing) for (const k of keysDeep(JSON.parse(text))) expect(k).not.toMatch(FORBIDDEN_KEY);
	});
});

/* -------------------------------------------------------------------------
 * The two plain doors: an item's House-only fields, and a list's entries
 * ---------------------------------------------------------------------- */

describe('setItemField', () => {
	it('sets a House-only plain field through the normaliser, stamps the item and reads it back', async () => {
		const { api, backing, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		const before = api.current()?.dishes[1].ts as number;
		clock.at = T0 + 10;
		expect(await nextChangeOf(api, () => api.setItemField('dish', 'd-beetrt01', { serviceNote: 'Ask the pass about the crust.', signature: true }))).toEqual([true, 'field']);
		const dish = api.current()?.dishes[1] as HouseDish;
		expect(dish.serviceNote).toBe('Ask the pass about the crust.');
		expect(dish.signature).toBe(true);
		expect(dish.ts).toBe(T0 + 10);
		expect(dish.ts).toBeGreaterThan(before);
		expect(dish.name).toBe(fixture.dishes[1].name);
		expect(await api.setItemField('wine', 'w-lantern1', { pours: ['125ml', '175ml', 'bottle'] })).toBe(true);
		expect(api.current()?.wines[0].pours).toEqual(['125ml', '175ml', 'bottle']);
		expect(api.current()?.wines[0].say).toEqual(fixture.wines[0].say);
		/* The normaliser's door: the note capped, a flag read as a flag, a list read as a list. */
		expect(await api.setItemField('cocktail', 'b-verjus01', { serviceNote: 'x'.repeat(PROSE_MAX + 50) })).toBe(true);
		expect(api.current()?.cocktails[1].serviceNote.length).toBe(PROSE_MAX);
		expect(await api.setItemField('dish', 'd-beetrt01', { signature: 'yes' as never })).toBe(true);
		expect(api.current()?.dishes[1].signature).toBe(false);
		expect(await api.setItemField('wine', 'w-lantern1', { pours: 'a glass' as never })).toBe(true);
		expect(api.current()?.wines[0].pours).toEqual([]);
		/* A write with the clock stood still is still newer than the item it replaces. */
		expect(await api.setItemField('dish', 'd-beetrt01', { serviceNote: 'Again.' })).toBe(true);
		expect(api.current()?.dishes[1].ts).toBeGreaterThan(T0 + 10);
		for (const [, text] of backing) for (const k of keysDeep(JSON.parse(text))) expect(k).not.toMatch(FORBIDDEN_KEY);
	});

	it('refuses an unknown key, a shared field, a mark, a field of another kind, a missing item and an empty patch, writing nothing', async () => {
		const { api, backing } = make();
		await api.importPack(packText, { mode: 'new' });
		const snap = JSON.stringify([...backing]);
		expect(await api.setItemField('dish', 'd-beetrt01', { ['aller' + 'gens']: 'x' } as never)).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', { name: 'x' } as never)).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', { price: '9' } as never)).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', { description: 'x' } as never)).toBe(false);
		expect(await api.setItemField('wine', 'w-lantern1', { grapes: ['x'] } as never)).toBe(false);
		expect(await api.setItemField('cocktail', 'b-verjus01', { spec: ['x'] } as never)).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', { say: mark('x', 'person', T0) } as never)).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', { ts: T0 } as never)).toBe(false);
		expect(await api.setItemField('cocktail', 'b-verjus01', { signature: true })).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', { pours: ['x'] })).toBe(false);
		/* One wrong key refuses the whole patch: the good key beside it is not written either. */
		expect(await api.setItemField('dish', 'd-beetrt01', { serviceNote: 'x', name: 'y' } as never)).toBe(false);
		expect(await api.setItemField('dish', 'd-nope0000', { serviceNote: 'x' })).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', {})).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', { serviceNote: undefined })).toBe(false);
		expect(await api.setItemField('dish', 'd-beetrt01', null as never)).toBe(false);
		expect(await api.setItemField('tastings' as never, 't-harbour1', { serviceNote: 'x' })).toBe(false);
		expect(JSON.stringify([...backing])).toBe(snap);
		expect(api.current()?.dishes[1].serviceNote).toBe(fixture.dishes[1].serviceNote);
		for (const kind of Object.keys(ITEM_FIELDS)) for (const k of ITEM_FIELDS[kind as keyof typeof ITEM_FIELDS]) expect(k).not.toMatch(FORBIDDEN_KEY);
	});

	it('a sync after it leaves the note alone, whichever side is newer', async () => {
		const { api, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		const rows = api.rows<SyncRow>('dish', []);
		clock.at = T0 + 10;
		expect(await api.setItemField('dish', 'd-beetrt01', { serviceNote: 'Mine, not the menu\'s.', signature: true })).toBe(true);
		/* The wing's rows as they were, older than the write. */
		clock.at = T0 + 20;
		let out = await api.sync('dish', rows);
		expect(out.ok).toBe(true);
		let dish = api.current()?.dishes.find((d) => d.id === 'd-beetrt01') as HouseDish;
		expect(dish.serviceNote).toBe('Mine, not the menu\'s.');
		expect(dish.signature).toBe(true);
		/* A row edited on the wing after the write: its shared fields win, the note stays, and no row ever carries it. */
		const edited = rows.map((r) => (r.id === 'd-beetrt01' ? { ...r, name: 'Beetroot, renamed', ts: T0 + 30 } : r));
		clock.at = T0 + 40;
		out = await api.sync('dish', edited);
		expect(out.ok).toBe(true);
		dish = api.current()?.dishes.find((d) => d.id === 'd-beetrt01') as HouseDish;
		expect(dish.name).toBe('Beetroot, renamed');
		expect(dish.serviceNote).toBe('Mine, not the menu\'s.');
		expect(dish.signature).toBe(true);
		for (const r of out.rows) {
			expect(r).not.toHaveProperty('serviceNote');
			expect(r).not.toHaveProperty('signature');
		}
	});

	it('the merge of two houses carries the note by the newer ts, both ways round', async () => {
		const a = make();
		const b = make();
		await a.api.importPack(packText, { mode: 'new' });
		await b.api.importPack(packText, { mode: 'new' });
		a.clock.at = T0 + 10;
		expect(await a.api.setItemField('dish', 'd-beetrt01', { serviceNote: 'Written first.' })).toBe(true);
		b.clock.at = T0 + 40;
		expect(await b.api.setItemField('dish', 'd-beetrt01', { serviceNote: 'Written later, elsewhere.' })).toBe(true);
		const ha = a.api.current() as House;
		const hb = b.api.current() as House;
		const ab = mergeHouse(ha, hb).house.dishes.find((d) => d.id === 'd-beetrt01') as HouseDish;
		const ba = mergeHouse(hb, ha).house.dishes.find((d) => d.id === 'd-beetrt01') as HouseDish;
		expect(ab.serviceNote).toBe('Written later, elsewhere.');
		expect(ba.serviceNote).toBe('Written later, elsewhere.');
		expect(ab.ts).toBe(T0 + 40);
		expect(ba).toEqual(ab);
	});
});

describe('putListItem', () => {
	const minimal: Record<PutList, Record<string, unknown>> = {
		tastings: { name: 'The long table', price: '85', meal: 'dinner', courses: [] },
		lexicon: { term: 'Mirepoix', itemIds: ['d-chicken1'] },
		scenarios: { title: 'The table in a hurry', guest: 'We have forty minutes.', itemIds: [] },
		mixUps: { aId: 'd-chicken1', bId: 'd-beetrt01' },
		mustKnows: { title: 'The lift is out' },
		askAtLineup: { question: 'Is the gravy made on the bones?', askWhom: 'chef', itemIds: ['d-chicken1'] },
		disputes: { field: 'glass', a: { text: 'Coupe', source: 'the menu', date: '2026-10-01' }, b: { text: 'Rocks', source: 'the bar', date: '2026-10-02' } }
	};

	it('mints the list\'s own prefix when the id is absent, stamps ts, and files the entry on every list', async () => {
		const { api, backing, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		clock.at = T0 + 5;
		for (const list of PUT_LISTS) {
			const count = (api.current() as House)[list].length;
			const [entry, what] = await nextChangeOf(api, () => api.putListItem(list, { ...minimal[list], ts: 5 } as never));
			expect(what).toBe('entry');
			expect(entry).not.toBeNull();
			const saved = entry as { id: string; ts: number };
			expect(saved.id.slice(0, 2)).toBe(ID_PREFIXES[list]);
			expect(saved.id.length).toBe(10);
			expect(saved.ts).toBe(T0 + 5);
			const held = (api.current() as House)[list] as Array<{ id: string }>;
			expect(held.length).toBe(count + 1);
			expect(held[held.length - 1]).toEqual(saved);
		}
		const term = api.current()?.lexicon[2];
		expect(term?.term).toBe('Mirepoix');
		expect(term?.itemIds).toEqual(['d-chicken1']);
		const ask = api.current()?.askAtLineup[1];
		expect(ask?.askWhom).toBe('chef');
		for (const [, text] of backing) for (const k of keysDeep(JSON.parse(text))) expect(k).not.toMatch(FORBIDDEN_KEY);
	});

	it('replaces by id, keeps the marks the patch does not name, takes a named mark only by setMark\'s rules, and normalises every field', async () => {
		const { api, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		const stored = clone(fixture.lexicon[0]);
		clock.at = T0 + 7;
		const entry = await api.putListItem('lexicon', { id: 'x-verjus01', term: 'Verjus, said VAIR-zhoo', itemIds: ['b-verjus01'], ['aller' + 'gens']: 'x' } as never);
		expect(entry?.id).toBe('x-verjus01');
		expect(entry?.term).toBe('Verjus, said VAIR-zhoo');
		expect(entry?.itemIds).toEqual(['b-verjus01']);
		expect(entry?.ts).toBe(T0 + 7);
		expect(entry?.say).toEqual(stored.say);
		expect(entry?.toGuest).toEqual(stored.toGuest);
		expect(entry).not.toHaveProperty('aller' + 'gens');
		expect(api.current()?.lexicon.length).toBe(fixture.lexicon.length);
		expect(api.current()?.lexicon[0]).toEqual(entry);
		/* Hers never over a kept mark, even through this door; a person's edit does take it; a null or a wrong shape leaves it alone. */
		const hers = await api.putListItem('lexicon', { id: 'x-verjus01', say: mark('Hers.', 'maitre', T0 + 8) });
		expect(hers?.say).toEqual(stored.say);
		const edited = await api.putListItem('lexicon', { id: 'x-verjus01', say: mark('VAIR-zhoo.', 'person', T0 + 8) });
		expect(edited?.say).toEqual(mark('VAIR-zhoo.', 'person', T0 + 8));
		const left = await api.putListItem('lexicon', { id: 'x-verjus01', say: null, toGuest: { value: 'x' } } as never);
		expect(left?.say).toEqual(mark('VAIR-zhoo.', 'person', T0 + 8));
		expect(left?.toGuest).toEqual(stored.toGuest);
		/* A field of the wrong type goes through the normaliser: a number is not a term, a string is not a list. */
		const odd = await api.putListItem('lexicon', { id: 'x-verjus01', term: 7, itemIds: 'd-chicken1' } as never);
		expect(odd?.term).toBe('');
		expect(odd?.itemIds).toEqual([]);
		/* An id given but not held is filed under that id when it is a sound one, and re-minted when it is not. */
		const given = await api.putListItem('mustKnows', { id: 'k-byhand01', title: 'By hand' });
		expect(given?.id).toBe('k-byhand01');
		const wrong = await api.putListItem('mustKnows', { id: 'x-wrongpre', title: 'Wrong prefix' });
		expect(wrong?.id.slice(0, 2)).toBe('k-');
		expect(wrong?.id).not.toBe('x-wrongpre');
		expect(api.current()?.mustKnows.map((k) => k.title)).toEqual([fixture.mustKnows[0].title, 'By hand', 'Wrong prefix']);
	});

	it('refuses an item list, a bad shape and no house; removeItem writes a tombstone and a put under the same id lifts it', async () => {
		const empty = make();
		expect(await empty.api.putListItem('lexicon', minimal.lexicon)).toBeNull();
		expect(empty.backing.size).toBe(0);
		const { api, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		expect(await api.putListItem('dishes' as never, { name: 'x' } as never)).toBeNull();
		expect(await api.putListItem('dish' as never, { name: 'x' } as never)).toBeNull();
		expect(await api.putListItem('lexicon', null as never)).toBeNull();
		expect(await api.putListItem('lexicon', ['x'] as never)).toBeNull();
		clock.at = T0 + 3;
		expect(await api.removeItem('lexicon', 'x-saltbak1')).toBe(true);
		const tomb = api.current()?.removed['x-saltbak1'] as number;
		expect(tomb).toBeGreaterThan(fixture.lexicon[1].ts);
		expect(api.current()?.lexicon.map((t) => t.id)).toEqual(['x-verjus01']);
		const back = await api.putListItem('lexicon', { id: 'x-saltbak1', term: 'Salt baked', itemIds: ['d-beetrt01'] });
		expect(back?.id).toBe('x-saltbak1');
		expect(back?.ts).toBeGreaterThan(tomb);
		expect(api.current()?.removed).not.toHaveProperty('x-saltbak1');
		expect(api.current()?.lexicon.map((t) => t.id)).toEqual(['x-verjus01', 'x-saltbak1']);
	});
});

/* -------------------------------------------------------------------------
 * A refused save
 * ---------------------------------------------------------------------- */

describe('a refused save', () => {
	it('leaves the memory copy as the device holds it and hands back the sentence', async () => {
		const backing = new Map<string, string>();
		const inner = mapStorage(backing);
		let refuse = false;
		const storage: HouseStorage = {
			...inner,
			put: (id, house) => (refuse ? Promise.resolve({ ok: false, reason: 'refused', bytes: 1, said: 'refused; export a pack' }) : inner.put(id, house))
		};
		const { api } = make(backing, undefined, storage);
		await api.importPack(packText, { mode: 'new' });
		const before = api.current();
		refuse = true;
		const put = await api.put('dish', dishRow('d-soup0001', 'Soup', T0 + 1));
		expect(put.ok).toBe(false);
		expect(put.said).toBe('refused; export a pack');
		expect(api.current()).toBe(before);
		expect(await api.setMark('dish', 'd-beetrt01', 'say', mark('x', 'person', T0))).toBe(false);
		expect(await api.removeItem('dish', 'd-beetrt01')).toBe(false);
		const synced = await api.sync('dish', [dishRow('d-soup0001', 'Soup', T0 + 1)]);
		expect(synced.ok).toBe(false);
		expect(synced.said).toBe('refused; export a pack');
		expect(api.current()).toBe(before);
	});
});

/* -------------------------------------------------------------------------
 * The port
 * ---------------------------------------------------------------------- */

describe('the nine modules as one script', () => {
	const MODULES = ['house-schema', 'house-lines', 'house-normalise', 'house-validate', 'house-merge', 'house-sync', 'house-store', 'house-pack', 'house-api'];

	it('every module the port joins is ASCII, dash free and free of a carriage return, comments and all', () => {
		const DASHES = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'));
		for (const m of [...MODULES, 'house-drills']) {
			const text = readFileSync(here('./' + m + '.ts'), 'utf8');
			expect(text, m).not.toMatch(DASHES);
			expect(text.includes('\r'), m).toBe(false);
			expect(/[^\x00-\x7F]/.test(text), m + ' carries a character outside ASCII').toBe(false);
		}
	});

	it('bundle into one IIFE with no name collision, pass the clean gate, and run in an empty context', () => {
		const text = portModules({ units: unitsIn(here('.'), MODULES), header: '/* a dry run of the House port */' });
		expect(() => assertClean(text, 'oot-house.js (dry run)')).not.toThrow();
		/* No import or export statement survives the strip (the comments may say the words). */
		expect(text.split('\n').filter((line) => /^\s*(import|export)\s/.test(line))).toEqual([]);
		/* An empty context: no window, no document, no indexedDB, no localStorage, no timers. */
		const context = vm.createContext({});
		expect(() => new vm.Script(text, { filename: 'oot-house.js' }).runInContext(context)).not.toThrow();
		expect(Object.keys(context)).toEqual([]);
	});

	it('the api works where the port will run it: through the bundle, over a Map, with no window', async () => {
		const expose = [
			'/* ==================== the test door ==================== */',
			'__house = { createHouseApi: createHouseApi, mapStorage: mapStorage, HOUSE_INDEX_KEY: HOUSE_INDEX_KEY };',
			'})();'
		];
		const text = portModules({
			units: unitsIn(here('.'), MODULES),
			header: '/* a dry run of the House port */',
			prelude: ['var __house;'],
			door: expose,
			expects: ['createHouseApi', 'mapStorage', 'HOUSE_INDEX_KEY']
		});
		const context = vm.createContext({ setTimeout });
		new vm.Script(text, { filename: 'oot-house.js' }).runInContext(context);
		const ported = (context as { __house: { createHouseApi: typeof createHouseApi; mapStorage: typeof mapStorage; HOUSE_INDEX_KEY: string } }).__house;
		expect(ported.HOUSE_INDEX_KEY).toBe(HOUSE_INDEX_KEY);
		const backing = new Map<string, string>();
		const api = ported.createHouseApi(ported.mapStorage(backing), { now: () => T0, rand: seeded() });
		await api.ready();
		expect(api.current()).toBeNull();
		const imported = await api.importPack(packText, { mode: 'new' });
		expect(imported.ok && imported.current).toBe(true);
		expect(api.current()?.dishes.map((d: HouseDish) => d.id)).toEqual(['d-chicken1', 'd-beetrt01']);
		expect(await api.names('cocktail')).toEqual(['The Lantern Collins', 'Verjus and Tonic']);
		expect(JSON.parse(backing.get(HOUSE_INDEX_KEY) || '').current).toBe(fixture.id);
	});
});

/* -------------------------------------------------------------------------
 * Two writes in flight in one tab. The commit door serialises the writes it
 * is handed: a commit that starts while another is saving waits for that
 * save to land and only then reads the house, so a Keep pressed while the
 * hydrate wake's sync is still saving, or a Keep all that fires the store's
 * queued put beside its own setMark, ends with both on the record. Before
 * the chain, two writes that started in one tick read one base and the
 * later save landed whole over the earlier.
 * ---------------------------------------------------------------------- */
describe('two writes in flight in one tab', () => {
	it('a Keep pressed while the sync is in flight lands beside it, never under it', async () => {
		const { api, clock } = make();
		await api.importPack(packText, { mode: 'new' });
		const rows = api.rows<SyncRow>('dish', []);
		const edited = rows.map((r) => (r.id === 'd-beetrt01' ? { ...r, name: 'Beetroot, renamed', ts: T0 + 30 } : r));
		clock.at = T0 + 40;
		const kept = mark('BEET root, as it reads.', 'person', T0 + 40);
		const [sync, ok] = await Promise.all([api.sync('dish', edited), api.setMark('dish', 'd-beetrt01', 'say', kept)]);
		expect(sync.ok).toBe(true);
		expect(ok).toBe(true);
		const dish = api.current()?.dishes.find((d) => d.id === 'd-beetrt01') as HouseDish;
		expect(dish.name).toBe('Beetroot, renamed');
		expect(dish.say).toEqual(kept);
	});

	it('two Keeps pressed in one tick both land, in memory and on the device', async () => {
		const { api, backing } = make();
		await api.importPack(packText, { mode: 'new' });
		const say = mark('BEET root, as it reads.', 'person', T0 + 1);
		const guest = mark('Salt baked beetroot with apple.', 'person', T0 + 1);
		const [a, b] = await Promise.all([
			api.setMark('dish', 'd-beetrt01', 'say', say),
			api.setMark('dish', 'd-beetrt01', 'guest', guest)
		]);
		expect(a).toBe(true);
		expect(b).toBe(true);
		const dish = api.current()?.dishes.find((d) => d.id === 'd-beetrt01') as HouseDish;
		expect(dish.say).toEqual(say);
		expect(dish.guest).toEqual(guest);
		const id = api.currentId() as string;
		const stored = JSON.parse(backing.get(MAP_HOUSE_PREFIX + id) as string) as House;
		const onDevice = stored.dishes.find((d) => d.id === 'd-beetrt01') as HouseDish;
		expect(onDevice.say).toEqual(say);
		expect(onDevice.guest).toEqual(guest);
	});
});

/* -------------------------------------------------------------------------
 * ensurePack: the shipped pack at boot. The edition rule: a pack is built
 * with every mark and every item stamped with one number, so a record still
 * carrying it is the edition's and any other stamp is a person's touch. The
 * first edition here is stamped the way the older Brennan's edition was,
 * its items a day before its marks, so the stamps are found by frequency
 * and never read off the pack field.
 * ---------------------------------------------------------------------- */

const B1 = Date.parse('2026-09-28T10:00:00.000Z');
const B2 = Date.parse('2026-10-03T21:00:00.000Z');
const DAY = 86_400_000;

/** A copy of a house as an edition: the pack stamp, every mark at markTs and every record at itemTs. */
function asEdition(h: House, builtAt: number, itemTs = builtAt, markTs = builtAt): House {
	const out = clone(h);
	out.pack = { id: 'house-min', builtBy: 'the fixture', builtAt: new Date(builtAt).toISOString(), version: 1 };
	if (out.history) out.history.ts = markTs;
	for (const list of HOUSE_LISTS) {
		for (const rec of out[list] as unknown as Array<Record<string, unknown>>) {
			rec.ts = itemTs;
			for (const f of MARK_FIELDS[list] as readonly string[]) {
				const m = rec[f];
				if (isMark(m)) m.ts = markTs;
			}
		}
	}
	return out;
}
const editionText = (h: House) => JSON.stringify(buildPack(h, 'tools', T0));

/** The second edition: changes the person did not touch, changes they did, a new dish and a new scenario. */
function secondEdition(): House {
	const h = asEdition(fixture, B2);
	const chicken = h.dishes.find((d) => d.id === 'd-chicken1') as HouseDish;
	chicken.description = 'Half a chicken from the embers, the second edition.';
	if (chicken.parts) chicken.parts.value.sauce = 'Rosemary and lemon gravy, the second edition';
	if (chicken.lines) chicken.lines.value.s10 = 'The second edition line for the chicken.';
	const beet = h.dishes.find((d) => d.id === 'd-beetrt01') as HouseDish;
	beet.description = 'The salad the second edition rewrote.';
	h.wines[0].region = 'The second edition region';
	if (h.wines[0].parts) h.wines[0].parts.value.taste = 'The second edition taste';
	h.dishes.push({ ...clone(beet), id: 'd-newdish1', name: 'Smoked Trout', description: 'New in the second edition.' });
	h.scenarios.push({ ...clone(h.scenarios[0]), id: 's-newscen1', title: 'A second edition scenario' });
	return h;
}

describe('ensurePack', () => {
	it('adds the pack to an empty device and makes it current; the same text again writes nothing', async () => {
		const { api, backing } = make();
		await api.ready();
		const text = editionText(asEdition(fixture, B1, B1 - DAY));
		const [res, what] = await nextChangeOf(api, () => api.ensurePack(text));
		expect(res).toEqual({ action: 'added', id: fixture.id, current: true });
		expect(what).toBe('import');
		expect(api.current()?.id).toBe(fixture.id);
		const before = JSON.stringify([...backing.entries()]);
		let fired = 0;
		api.onChange(() => fired++);
		expect(await api.ensurePack(text)).toEqual({ action: 'current', id: fixture.id });
		expect(await api.ensurePack(editionText(asEdition(fixture, B1 - DAY)))).toEqual({ action: 'current', id: fixture.id });
		expect(JSON.stringify([...backing.entries()])).toBe(before);
		expect(fired).toBe(0);
	});

	it('gives way over an empty hand house, stays behind a house with work in it, and makeCurrent asks', async () => {
		const text = editionText(asEdition(fixture, B1));
		const empty = make();
		const mine = await empty.api.mintHouse('My house');
		expect(mine).not.toBeNull();
		expect(await empty.api.ensurePack(text)).toEqual({ action: 'added', id: fixture.id, current: true });
		expect(empty.api.currentId()).toBe(fixture.id);
		expect(empty.api.list().length).toBe(2);

		const busy = make();
		const own = await busy.api.mintHouse('The Corner Table');
		await busy.api.put('dish', dishRow('d-mysoup01', 'Leek Soup', T0));
		const added = await busy.api.ensurePack(text);
		expect(added).toEqual({ action: 'added', id: fixture.id, current: false });
		expect(busy.api.currentId()).toBe(own?.id);
		expect(busy.api.current()?.id).toBe(own?.id);

		const asked = make();
		const theirs = await asked.api.mintHouse('The Corner Table');
		await asked.api.put('dish', dishRow('d-mysoup01', 'Leek Soup', T0));
		expect(await asked.api.ensurePack(text, { makeCurrent: true })).toEqual({ action: 'added', id: fixture.id, current: true });
		expect(asked.api.currentId()).toBe(fixture.id);
		expect(asked.api.list().map((s) => s.id)).toEqual([theirs?.id, fixture.id]);
	});

	it('refuses what is not a pack, and writes nothing', async () => {
		const { api, backing } = make();
		await api.ready();
		const res = await api.ensurePack('{ not json');
		expect(res.action).toBe('refused');
		expect(res.action === 'refused' && res.said).toMatch(/not a house pack/);
		expect((await api.ensurePack(JSON.stringify({ format: 'other' }))).action).toBe('refused');
		expect(backing.size).toBe(0);
	});

	it('finds the edition stamps by frequency, marks and items apart', () => {
		const h = asEdition(fixture, B1, B1 - DAY);
		expect(editionStamp(h)).toBe(B1);
		expect(editionItemStamp(h)).toBe(B1 - DAY);
		const touched = clone(h);
		if (touched.dishes[0].lines) touched.dishes[0].lines.ts = T0;
		touched.wines[0].ts = T0;
		expect(editionStamp(touched)).toBe(B1);
		expect(editionItemStamp(touched)).toBe(B1 - DAY);
	});

	it('refreshes by a newer edition: a person\'s edited mark, edited item and removal stand, the rest follows the edition', async () => {
		const { api, clock, backing } = make();
		await api.ready();
		const first = asEdition(fixture, B1, B1 - DAY);
		expect((await api.ensurePack(editionText(first))).action).toBe('added');

		/* The person's touches: an edited line, a removed dish, a service note
		   (which stamps the wine), and a scenario answer of their own. */
		clock.at = T0 + 1000;
		const myLines = { s10: 'My own ten second chicken line.', s20: 'My own twenty.', s45: 'My own forty five.' };
		expect(await api.setMark('dish', 'd-chicken1', 'lines', mark(myLines, 'person', T0 + 1000))).toBe(true);
		expect(await api.removeItem('dish', 'd-beetrt01')).toBe(true);
		expect(await api.setItemField('wine', 'w-lantern1', { serviceNote: 'Ask the sommelier about the vintage.' })).toBe(true);
		const tomb = api.current()?.removed['d-beetrt01'];
		expect(typeof tomb).toBe('number');

		/* A second house made current, so the refresh lands on a house that is not. */
		clock.at = T0 + 2000;
		const other = await api.mintHouse('The Corner Table');
		await api.switchTo(other?.id || '');
		expect(api.currentId()).toBe(other?.id);

		clock.at = T0 + 3000;
		const second = secondEdition();
		const [res, what] = await nextChangeOf(api, () => api.ensurePack(editionText(second)));
		expect(what).toBe('import');
		expect(res.action).toBe('refreshed');
		if (res.action !== 'refreshed') return;
		expect(res.id).toBe(fixture.id);
		expect(res.counts.added).toBe(2);
		expect(api.currentId()).toBe(other?.id);
		expect(api.current()?.id).toBe(other?.id);

		const raw = backing.get(MAP_HOUSE_PREFIX + fixture.id);
		const h = JSON.parse(raw || '{}') as House;
		const chicken = h.dishes.find((d) => d.id === 'd-chicken1') as HouseDish;
		expect(chicken.lines).toEqual(mark(myLines, 'person', T0 + 1000));
		expect(chicken.parts?.value.sauce).toBe('Rosemary and lemon gravy, the second edition');
		expect(chicken.parts?.ts).toBe(B2);
		expect(chicken.description).toBe('Half a chicken from the embers, the second edition.');
		expect(chicken.ts).toBe(B2);
		expect(h.dishes.some((d) => d.id === 'd-beetrt01')).toBe(false);
		expect(h.removed['d-beetrt01']).toBe(tomb);
		expect(h.dishes.some((d) => d.id === 'd-newdish1')).toBe(true);
		expect(h.scenarios.some((s) => s.id === 's-newscen1')).toBe(true);
		const wine = h.wines[0];
		expect(wine.serviceNote).toBe('Ask the sommelier about the vintage.');
		expect(wine.region).toBe(fixture.wines[0].region);
		expect(wine.parts?.value.taste).toBe('The second edition taste');
		expect(res.counts.kept).toBeGreaterThanOrEqual(2);
		expect(res.counts.updated).toBeGreaterThanOrEqual(2);
		expect(h.pack?.builtAt).toBe(new Date(B2).toISOString());

		/* The same edition again: nothing written, nothing fired. */
		const before = JSON.stringify([...backing.entries()]);
		expect(await api.ensurePack(editionText(second))).toEqual({ action: 'current', id: fixture.id });
		expect(JSON.stringify([...backing.entries()])).toBe(before);
	});

	it('refreshes the current house through the write door, and memory is what the device holds', async () => {
		const { api, clock, backing } = make();
		await api.ready();
		await api.ensurePack(editionText(asEdition(fixture, B1)));
		clock.at = T0 + 1000;
		const res = await api.ensurePack(editionText(secondEdition()));
		expect(res.action).toBe('refreshed');
		expect(api.currentId()).toBe(fixture.id);
		const stored = JSON.parse(backing.get(MAP_HOUSE_PREFIX + fixture.id) || '{}');
		expect(api.current()).toEqual(stored);
		/* Untouched, so every edition change landed, the beetroot rewrite with it. */
		expect(stored.dishes.find((d: HouseDish) => d.id === 'd-beetrt01').description).toBe('The salad the second edition rewrote.');
		expect(stored.dishes.find((d: HouseDish) => d.id === 'd-chicken1').lines.value.s10).toBe('The second edition line for the chicken.');
		expect(stored.wines[0].region).toBe('The second edition region');
	});

	it('refreshEdition alone: her mark made on the device yields to a kept shipped one, and an old tombstone is lifted', () => {
		const device = asEdition(fixture, B1);
		const chicken = device.dishes[0];
		chicken.guest = mark('Hers, on the device.', 'maitre', T0);
		device.removed['d-gone0001'] = B1 - DAY;
		const shipped = asEdition(fixture, B2);
		shipped.dishes[0].guest = mark('Kept in the edition.', 'person', B2);
		shipped.dishes.push({ ...clone(shipped.dishes[1]), id: 'd-gone0001', name: 'Back Again' });
		const { house, counts } = refreshEdition(device, shipped);
		expect(house.dishes[0].guest?.value).toBe('Kept in the edition.');
		expect(house.dishes.some((d) => d.id === 'd-gone0001')).toBe(true);
		expect('d-gone0001' in house.removed).toBe(false);
		expect(counts.added).toBe(1);
		expect(house.id).toBe(device.id);
		expect(house.dishes.every((d) => d.house === device.id)).toBe(true);
	});
});
