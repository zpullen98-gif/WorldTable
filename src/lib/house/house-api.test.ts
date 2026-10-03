import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { HOUSE_INDEX_KEY, KEYS, LINE_CAPS, DISH_PARTS, WINE_PARTS, COCKTAIL_PARTS } from './house-schema';
import type { House, HouseDish, Mark } from './house-schema';
import { lastTouch } from './house-merge';
import { mapStorage } from './house-store';
import type { HouseStorage } from './house-store';
import type { SyncRow } from './house-sync';
import { buildPack } from './house-pack';
import { CARD_KEYS, NO_HOUSE_SAID, adapterFor, createHouseApi, listFor } from './house-api';
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
				'put', 'sync', 'rows', 'setMark', 'setCard', 'removeItem', 'names',
				'readPack', 'importPack', 'buildPack', 'onChange',
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
