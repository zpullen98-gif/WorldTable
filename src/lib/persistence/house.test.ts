import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	EMPTY_HOUSE,
	readHouse,
	exportNudge,
	DAY_MS,
	HOUSE_VERSION,
	absorbSession,
	adoptImport,
	removeDish,
	houseSnapshot,
	mergeExportedMenu,
	housePortable,
	setMaitre,
	confirmMaitre,
	discardMaitre,
	keepMaitreNote,
	normaliseMaitre,
	type HouseRecord
} from './house';
import { EMPTY_SESSION, type MenuDish, type MaitreMark, type MaitreBlock } from './state';
import type { CostLine } from '../costing';
import type { Producer } from '../producers';
import { describeImport } from './portable';

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
			dishCosts: { a: { lines: [costLine()], sales: [], ts: 5 } }
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
		let h = absorbSession(fresh(), {
			menuDishes: [dish('a')],
			dishCosts: { a: { lines: [], sales: [], ts: 1 } }
		});
		h = { ...h, eightySix: { a: { at: 1 } } };
		const out = removeDish(h, 'a');
		expect(out.dishes).toEqual([]);
		expect(out.dishCosts.a).toBeUndefined();
		expect(out.eightySix.a).toBeUndefined();
	});
});

describe('adopting an import', () => {
	it('adds dishes it does not have', () => {
		const out = adoptImport(fresh(), [dish('a'), dish('b')], {}, {});
		expect(out.dishes.map((d) => d.id).sort()).toEqual(['a', 'b']);
	});

	it('lets the newer ts win per dish, and never invents a third version', () => {
		const mine = adoptImport(fresh(), [dish('a', 100)], {}, {});
		const newer = adoptImport(mine, [{ ...dish('a', 200), name: 'Renamed' }], {}, {});
		expect(newer.dishes).toHaveLength(1);
		expect(newer.dishes[0].name).toBe('Renamed');

		const older = adoptImport(newer, [{ ...dish('a', 50), name: 'Stale' }], {}, {});
		expect(older.dishes[0].name, 'an older file overwrote a newer dish').toBe('Renamed');
	});

	/**
	 * Deliberately unlike absorbSession: an import is somebody CHOOSING to bring
	 * a menu in, and refusing a dish because a copy was deleted here months ago
	 * would be obeying the wrong memory.
	 */
	it('ignores the absorbed guard, because an import is a decision', () => {
		const deleted = removeDish(absorbSession(fresh(), { menuDishes: [dish('a')] }), 'a');
		const out = adoptImport(deleted, [dish('a', 999)], {}, {});
		expect(out.dishes.map((d) => d.id)).toEqual(['a']);
	});
});

describe('what an export carries', () => {
	it('carries the menu and the costings', () => {
		const h = absorbSession(fresh(), {
			menuDishes: [dish('a')],
			// A real figure: normaliseCosting drops a costing carrying none at all,
			// which is correct — an empty record is not a costing.
			dishCosts: { a: { lines: [costLine()], sales: [], ts: 3 } }
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

/**
 * doExport spreads `{...session.snapshot(), ...house.snapshot()}`, house
 * winning normally because absorbSession has already moved the legacy
 * session fields into the house record. While house.blocked, absorbSession
 * never runs, so house.snapshot() is correctly `{menuDishes: [], dishCosts:
 * {}}` for a record this build cannot read - and spreading it anyway erased
 * whatever the session was still carrying from before the block began.
 */
describe('mergeExportedMenu — the house half must not erase the session half while blocked', () => {
	const houseSnap = houseSnapshot(absorbSession(fresh(), { menuDishes: [dish('house-dish')] }));

	it('the house menu wins when the house record is readable, as before', () => {
		const out = mergeExportedMenu(
			{ menuDishes: [dish('legacy-dish')], dishCosts: {} },
			houseSnap,
			false
		);
		expect(out.menuDishes.map((d) => d.id)).toEqual(['house-dish']);
	});

	it('the session half survives untouched while the house record is blocked', () => {
		const out = mergeExportedMenu(
			{ menuDishes: [dish('legacy-dish')], dishCosts: { 'legacy-dish': { lines: [], sales: [], ts: 1 } } },
			houseSnap,
			true
		);
		expect(out.menuDishes.map((d) => d.id)).toEqual(['legacy-dish']);
		expect(out.dishCosts['legacy-dish']).toBeDefined();
	});

	it('a blocked export with nothing in the session legacy carries nothing, not a crash', () => {
		const out = mergeExportedMenu({ menuDishes: [], dishCosts: {} }, houseSnap, true);
		expect(out.menuDishes).toEqual([]);
	});
});

describe('a record this build must not touch', () => {
	/**
	 * THE BUG THIS EXISTS FOR, and it lost everything.
	 *
	 * hydrate() read the record behind `if (schemaVersion <= HOUSE_VERSION)` with
	 * no else, so a record from a NEWER build failed the test, the store kept
	 * EMPTY_HOUSE, and the next write — absorbSession's persist, or the first tap
	 * on the 86 board — put that empty record over the top of it. Menu, preps,
	 * costings, counts, gone, on a rollback or a stale service worker.
	 *
	 * vite.config.ts ships registerType: 'prompt' with skipWaiting: false, so a
	 * device on an older bundle is the design, not an edge case.
	 */
	it('refuses a record written by a newer build', () => {
		const future = { ...structuredClone(EMPTY_HOUSE), schemaVersion: HOUSE_VERSION + 1 };
		const { blocked } = readHouse(future);
		expect(blocked, 'a newer record would be read and then overwritten').toBe(true);
	});

	it('does not hand back the newer record content either', () => {
		const future = {
			...structuredClone(EMPTY_HOUSE),
			schemaVersion: HOUSE_VERSION + 1,
			dishes: [dish('a')]
		};
		// Reading fields this build does not understand is how a partial write
		// gets made from a record that was refused.
		expect(readHouse(future).record.dishes).toEqual([]);
	});

	it('reads a record at the current version normally', () => {
		const now = { ...structuredClone(EMPTY_HOUSE), dishes: [dish('a')] };
		const { record, blocked } = readHouse(now);
		expect(blocked).toBe(false);
		expect(record.dishes.map((d) => d.id)).toEqual(['a']);
	});

	it('reads a record that predates the version field', () => {
		const ancient = { dishes: [dish('a')] };
		const { record, blocked } = readHouse(ancient);
		expect(blocked).toBe(false);
		expect(record.dishes).toHaveLength(1);
		// Everything the old record lacked is filled from defaults.
		expect(record.preps).toEqual([]);
		expect(record.prepCounts).toEqual({});
	});

	it('treats nothing on disk as a fresh start, not as a refusal', () => {
		expect(readHouse(undefined)).toEqual({ record: structuredClone(EMPTY_HOUSE), blocked: false });
		expect(readHouse(null).blocked).toBe(false);
	});

	/**
	 * The 22 renamed slugs (persistence/migrations.ts). A dish pointing at
	 * /recipe/sm-rrebr-d pointed at a page that no longer exists, so cook mode,
	 * the standard and the Repertoire all lost the lamb rump that goes out sixty
	 * times a week. Followed on every read; nothing on disk is rewritten until
	 * the next genuine write.
	 */
	it('brings a dish recipeSlug to the current spelling on read', () => {
		const stored = {
			...structuredClone(EMPTY_HOUSE),
			dishes: [
				{ ...dish('a'), recipeSlug: 'sm-rrebr-d' },
				{ ...dish('b'), recipeSlug: 'cacio-e-pepe' },
				dish('c')
			]
		};
		const { record } = readHouse(stored);
		expect(record.dishes.map((d) => d.recipeSlug)).toEqual(['smorrebrod', 'cacio-e-pepe', undefined]);
	});
});

/**
 * The venue's costing sheet, item book, prep board and waste log live in
 * evictable browser storage and the manual .wtjson export is the only backup.
 * The nudge is what lets a page say how stale that backup is; it must be
 * silent on a fresh device and on a record exported since it last changed.
 */
describe('the export nudge', () => {
	it('says nothing for an empty record', () => {
		expect(exportNudge({ lastWrite: 0 })).toBeNull();
		expect(exportNudge({ lastWrite: 0, lastExportAt: 5 })).toBeNull();
	});

	it('says nothing when the export is at least as new as the last write', () => {
		expect(exportNudge({ lastWrite: 100, lastExportAt: 100 })).toBeNull();
		expect(exportNudge({ lastWrite: 100, lastExportAt: 200 })).toBeNull();
	});

	it('reports a record that has never been exported', () => {
		expect(exportNudge({ lastWrite: 100 })).toEqual({ days: null });
	});

	it('counts whole days since the last export once the record has moved on', () => {
		const exported = 1_000_000;
		const now = exported + 9 * DAY_MS + DAY_MS / 2;
		expect(exportNudge({ lastWrite: exported + 1, lastExportAt: exported }, now)).toEqual({ days: 9 });
		expect(exportNudge({ lastWrite: exported + 1, lastExportAt: exported }, exported + 2)).toEqual({ days: 0 });
	});
});

/**
 * The lineup tally: what the ROOM missed at pre-shift, on the house record.
 *
 * Every collection added to this record has had to learn the same three
 * things the hard way: a record written before the field existed must still
 * read, an import must NAME the field or silently drop it, and the export must
 * carry it because the export is the venue's only backup.
 */
describe('the lineup tally travels with the house', () => {
	const answer = (slug: string, at: number, grade: 'met' | 'missed' = 'met') => ({ slug, at, grade });

	it('reads a record written before the field existed', () => {
		const old = { schemaVersion: HOUSE_VERSION, dishes: [dish('a')], lastWrite: 5 };
		const { record, blocked } = readHouse(old);
		expect(blocked).toBe(false);
		expect(record.lineupLog).toEqual([]);
		expect(record.dishes.map((d) => d.id)).toEqual(['a']);
	});

	it('cleans a hand-edited value rather than carrying it through', () => {
		expect(readHouse({ schemaVersion: HOUSE_VERSION, lineupLog: 'nope' }).record.lineupLog).toEqual([]);
		const dirty = { schemaVersion: HOUSE_VERSION, lineupLog: [answer('fd_0001', 1), { slug: 'x' }, null] };
		expect(readHouse(dirty).record.lineupLog).toEqual([answer('fd_0001', 1)]);
	});

	it('an import is a union, named in the merge, and merging it twice changes nothing', () => {
		const mine: HouseRecord = { ...fresh(), lineupLog: [answer('fd_0001', 1, 'missed')] };
		const file = { lineupLog: [answer('fd_0001', 1, 'missed'), answer('fd_0002', 2)] };
		const once = adoptImport(mine, [], {}, file);
		expect(once.lineupLog).toEqual([answer('fd_0001', 1, 'missed'), answer('fd_0002', 2)]);
		expect(adoptImport(once, [], {}, file).lineupLog).toEqual(once.lineupLog);
	});

	it('a file that carries none leaves the tally alone', () => {
		const mine: HouseRecord = { ...fresh(), lineupLog: [answer('fd_0001', 1)] };
		expect(adoptImport(mine, [], {}, {}).lineupLog).toEqual([answer('fd_0001', 1)]);
	});

	it('the export carries it, and it carries no name', () => {
		const h: HouseRecord = { ...fresh(), lineupLog: [answer('fd_0001', 1, 'missed')], lastEditedBy: 'Marcus' };
		const out = housePortable(h);
		expect(out.lineupLog).toEqual([answer('fd_0001', 1, 'missed')]);
		expect(JSON.stringify(out)).not.toContain('Marcus');
	});
});

/**
 * The producers: who supplies the venue, and the dishes they are on.
 *
 * The same three lessons as the lineup tally above, plus a fourth that is
 * theirs alone: the dish link lives on the producer (see producers.ts), so
 * removing a dish is the one write that has to reach into this list.
 */
describe('the producers travel with the house', () => {
	const producer = (id: string, patch: Partial<Producer> = {}): Producer => ({
		id,
		name: `Producer ${id}`,
		place: 'Thomasville, Georgia',
		kind: 'creamery',
		supplies: 'the Green Hill',
		story: 'A family herd on grass.',
		dishIds: [],
		ts: 1,
		...patch
	});

	it('defaults to none', () => {
		expect(EMPTY_HOUSE.producers).toEqual([]);
		expect(readHouse(undefined).record.producers).toEqual([]);
	});

	it('reads a record written before the field existed', () => {
		const old = { schemaVersion: HOUSE_VERSION, dishes: [dish('a')], lastWrite: 5 };
		const { record, blocked } = readHouse(old);
		expect(blocked).toBe(false);
		expect(record.producers).toEqual([]);
		expect(record.dishes.map((d) => d.id)).toEqual(['a']);
	});

	it('cleans a hand-edited value rather than carrying it through', () => {
		expect(readHouse({ schemaVersion: HOUSE_VERSION, producers: 'nope' }).record.producers).toEqual([]);
		expect(readHouse({ schemaVersion: HOUSE_VERSION, producers: { a: 1 } }).record.producers).toEqual([]);
		const dirty = { schemaVersion: HOUSE_VERSION, producers: [producer('pr-a'), { name: 'no id' }, null, { id: 'pr-b' }] };
		expect(readHouse(dirty).record.producers).toEqual([producer('pr-a')]);
	});

	it('an import is a merge by id, named in adoptImport, and merging it twice changes nothing', () => {
		const mine: HouseRecord = { ...fresh(), producers: [producer('pr-a', { ts: 5, story: 'mine' })] };
		const file = {
			producers: [producer('pr-a', { ts: 9, story: 'newer' }), producer('pr-b', { dishIds: ['d-1'] })]
		};
		const once = adoptImport(mine, [], {}, file);
		expect(once.producers.map((p) => [p.id, p.story])).toEqual([
			['pr-a', 'newer'],
			['pr-b', 'A family herd on grass.']
		]);
		// the dish link travels inside the producer
		expect(once.producers[1].dishIds).toEqual(['d-1']);
		expect(adoptImport(once, [], {}, file).producers).toEqual(once.producers);
	});

	it('an older export with no producers imports cleanly and leaves them alone', () => {
		const mine: HouseRecord = { ...fresh(), producers: [producer('pr-a')] };
		expect(adoptImport(mine, [dish('b')], {}, {}).producers).toEqual([producer('pr-a')]);
		expect(adoptImport(fresh(), [dish('b')], {}, { preps: [] }).producers).toEqual([]);
	});

	it('the export carries them, links and all', () => {
		const h: HouseRecord = { ...fresh(), producers: [producer('pr-a', { dishIds: ['a'] })] };
		expect(housePortable(h).producers).toEqual([producer('pr-a', { dishIds: ['a'] })]);
	});

	it('removing a dish takes it off every producer, and leaves the rest of each alone', () => {
		const h: HouseRecord = {
			...fresh(),
			dishes: [dish('a'), dish('b')],
			producers: [producer('pr-a', { dishIds: ['a', 'b'] }), producer('pr-b', { dishIds: ['a'] }), producer('pr-c')]
		};
		const out = removeDish(h, 'a');
		expect(out.producers.map((p) => p.dishIds)).toEqual([['b'], [], []]);
		expect(out.producers.map((p) => p.story)).toEqual(h.producers.map((p) => p.story));
		// a dish nobody supplies leaves the list itself untouched
		expect(removeDish(h, 'z').producers).toBe(h.producers);
	});

	it('the import banner counts them, and not a row the merge would refuse', () => {
		const current = {
			...structuredClone(EMPTY_SESSION),
			producers: [producer('pr-a', { ts: 5 })]
		};
		const summary = describeImport(
			{ producers: [producer('pr-a', { ts: 9 }), producer('pr-b'), { id: 'pr-c', name: '' } as unknown as Producer] },
			current
		);
		// Split, because '1 producer' is also a substring of '1 producer updated'.
		const parts = summary.split(', ');
		expect(parts).toContain('1 producer');
		expect(parts).toContain('1 producer updated');
		expect(summary).not.toContain('2 producers');
	});

	it('a dish deleted here and brought back by an import comes back credited, on both tablets alike', () => {
		// Two tablets share producer P on dish x. A deletes x (pruned, not restamped).
		const shared = producer('pr-p', { dishIds: ['x'], ts: 7 });
		const b: HouseRecord = { ...fresh(), dishes: [dish('x')], producers: [shared] };
		const a = removeDish(b, 'x');
		expect(a.producers[0].dishIds).toEqual([]);

		// A imports B: the dish returns, and so does its credit.
		const aAfter = adoptImport(a, b.dishes, {}, housePortable(b));
		expect(aAfter.dishes.map((d) => d.id)).toEqual(['x']);
		expect(aAfter.producers).toEqual([shared]);
		// B imports A: nothing changes. The two tablets agree.
		expect(adoptImport(b, a.dishes, {}, housePortable(a)).producers).toEqual([shared]);
	});

	it('a dish already here keeps my producer as it won, links and all', () => {
		// A deliberate untick here (newer ts) is not undone by an older file,
		// because the dish did not arrive through it.
		const mine: HouseRecord = {
			...fresh(),
			dishes: [dish('x')],
			producers: [producer('pr-p', { dishIds: [], ts: 9 })]
		};
		const out = adoptImport(mine, [dish('x')], {}, { producers: [producer('pr-p', { dishIds: ['x'], ts: 3 })] });
		expect(out.producers[0].dishIds).toEqual([]);
	});
});

/**
 * The Maitre d's marks: what she wrote on a dish, and what a person kept.
 *
 * The same three lessons as every collection above (an old record reads, an
 * import names the field, the export carries it), plus the one that is theirs
 * alone: "kept" means `by === 'person'`, and her unkept mark must never win
 * over a kept one, on one tablet or between two.
 */
describe("the Maitre d's marks travel with the dish", () => {
	const mark = (value: string, by: 'maitre' | 'person' = 'maitre', ts = 10): MaitreMark => ({
		value,
		by,
		ts,
		...(by === 'maitre' ? { model: 'claude-opus-5' } : {})
	});
	const block = (): MaitreBlock => ({
		ingredientsNamed: { value: ['crawfish', 'dark roux', 'rice'], by: 'maitre', ts: 10, model: 'claude-haiku-4-5' },
		guest: mark('A crawfish stew on rice, the roux dark and nutty.'),
		why: mark('The roux is taken to the colour of a penny.', 'person', 20),
		kept: [{ q: 'Where is the crawfish from?', a: 'The menu does not say.', ts: 15, model: 'claude-opus-5' }]
	});
	const marked = (id = 'a'): MenuDish => ({ ...dish(id), maitre: block() });
	const withDishes = (...dishes: MenuDish[]): HouseRecord => ({ ...fresh(), dishes });

	it('a dish carrying her marks round-trips through adoptImport, and twice changes nothing', () => {
		const once = adoptImport(fresh(), [marked()], {}, {});
		expect(once.dishes[0].maitre).toEqual(block());
		const twice = adoptImport(once, [marked()], {}, {});
		expect(twice.dishes[0].maitre).toEqual(block());
	});

	it('an old record without a block reads and is left without one', () => {
		const old = { schemaVersion: HOUSE_VERSION, dishes: [dish('a')], lastWrite: 5 };
		const { record, blocked } = readHouse(old);
		expect(blocked).toBe(false);
		expect('maitre' in record.dishes[0]).toBe(false);
		// and an import of a pre-feature dish over a pre-feature dish mints no key
		const out = adoptImport(withDishes(dish('a', 100)), [dish('a', 200)], {}, {});
		expect('maitre' in out.dishes[0]).toBe(false);
	});

	it('a block that reads is kept whole on read', () => {
		const { record } = readHouse({ schemaVersion: HOUSE_VERSION, dishes: [marked()] });
		expect(record.dishes[0].maitre).toEqual(block());
	});

	/**
	 * The shape is CLOSED, and this is the doctrine that does not bend: no
	 * allergen field on any desk shape, ever. A hand-edited file, or a model
	 * answering in the wrong shape, cannot put one on a dish through her block.
	 */
	it('screens a hand-edited block: an allergens key, a junk mark and a junk note are dropped', () => {
		const dirty = {
			allergens: { value: ['nuts'], by: 'maitre', ts: 1 },
			why: mark('kept'),
			guest: { value: 12, by: 'maitre', ts: 1 },
			say: { value: 'gwan-CHAH-leh', by: 'nobody', ts: 1 },
			pairs: { value: 'a Muscadet', by: 'maitre', ts: 'yesterday' },
			ingredientsNamed: { value: 'not a list', by: 'maitre', ts: 1 },
			kept: [{ q: 'ok', a: 'ok', ts: 1 }, { q: 'no answer', ts: 2 }, 'nope', null]
		};
		expect(normaliseMaitre(dirty)).toEqual({ why: mark('kept'), kept: [{ q: 'ok', a: 'ok', ts: 1 }] });
		expect(normaliseMaitre({ allergens: { value: ['nuts'], by: 'maitre', ts: 1 } })).toBeUndefined();
		expect(normaliseMaitre('nope')).toBeUndefined();
		expect(normaliseMaitre([])).toBeUndefined();
		// through the import: nothing survives, so no key is minted
		const out = adoptImport(fresh(), [{ ...dish('a'), maitre: { allergens: ['nuts'] } as unknown as MaitreBlock }], {}, {});
		expect('maitre' in out.dishes[0]).toBe(false);
	});

	/**
	 * "The menu does not say" is the empty string or the empty list, and that
	 * is no mark. Filed, a blank would be a line Keep could flip to the house's
	 * and a file could carry in already kept: an empty kept guest line on the
	 * guest menu. So a blank is refused at the screen, on every door.
	 */
	it('a blank mark is no mark: refused at the screen, by setMaitre, and on the way in from a file', () => {
		const blanks = {
			guest: { value: '', by: 'maitre', ts: 1, model: 'claude-opus-5' },
			why: { value: '   ', by: 'maitre', ts: 1 },
			ingredientsNamed: { value: [], by: 'maitre', ts: 1 },
			pairs: { value: '\t\n', by: 'person', ts: 1 },
			say: mark('gwan-CHAH-leh')
		};
		// only the one with something in it survives, and a kept blank is as blank as hers
		expect(normaliseMaitre(blanks)).toEqual({ say: mark('gwan-CHAH-leh') });
		expect(normaliseMaitre({ ingredientsNamed: { value: ['', ' '], by: 'maitre', ts: 1 } })).toBeUndefined();
		// a list with one honest entry stands, and stands as written: nothing is trimmed or tidied
		expect(normaliseMaitre({ ingredientsNamed: { value: ['', 'rice '], by: 'maitre', ts: 1 } })).toEqual({
			ingredientsNamed: { value: ['', 'rice '], by: 'maitre', ts: 1 }
		});
		// setMaitre with only blanks writes nothing, so a run with nothing to say leaves the record alone
		const h = withDishes(marked());
		expect(setMaitre(h, 'a', { guest: { value: '', by: 'maitre', ts: 99 }, why: { value: ' ', by: 'person', ts: 99 } })).toBe(h);
		const bare = withDishes(dish('a'));
		expect(setMaitre(bare, 'a', { ingredientsNamed: { value: [], by: 'maitre', ts: 1 } })).toBe(bare);
		expect('maitre' in setMaitre(bare, 'a', { guest: { value: '', by: 'maitre', ts: 1 } }).dishes[0]).toBe(false);
		// a blank that arrives already kept does not come in kept: it does not come in at all
		const imported = adoptImport(fresh(), [{ ...dish('a'), maitre: { guest: { value: '', by: 'person', ts: 1 } } }], {}, {});
		expect('maitre' in imported.dishes[0]).toBe(false);
		// and confirmMaitre has nothing to flip, because the blank was never stored
		expect(confirmMaitre(setMaitre(withDishes(dish('a')), 'a', { guest: { value: '', by: 'maitre', ts: 1 } }), 'a', 'guest', 2).dishes[0].maitre).toBeUndefined();
	});

	it('setMaitre writes her marks and a person’s edits, never a stray kept', () => {
		const out = setMaitre(withDishes(dish('a')), 'a', { guest: mark('Hers.'), why: mark('Edited by hand.', 'person') });
		expect(out.dishes[0].maitre).toEqual({ guest: mark('Hers.'), why: mark('Edited by hand.', 'person') });
		const sneaked = setMaitre(withDishes(dish('a')), 'a', {
			guest: mark('Hers.'),
			kept: [{ q: 'q', a: 'a', ts: 1 }]
		} as MaitreBlock);
		expect(sneaked.dishes[0].maitre?.kept).toBeUndefined();
	});

	it('setMaitre never lets her mark displace a kept one; a person’s edit replaces anything', () => {
		const h = withDishes(marked());
		const rerun = setMaitre(h, 'a', { why: mark('Her newer why.', 'maitre', 99), guest: mark('Her newer guest line.', 'maitre', 99) });
		expect(rerun.dishes[0].maitre?.why).toEqual(block().why);
		expect(rerun.dishes[0].maitre?.guest?.value).toBe('Her newer guest line.');
		expect(rerun.dishes[0].maitre?.kept).toEqual(block().kept);
		const edited = setMaitre(h, 'a', { why: mark('A person rewrote it.', 'person', 99) });
		expect(edited.dishes[0].maitre?.why?.value).toBe('A person rewrote it.');
	});

	it('setMaitre returns the same record when there is nothing to write', () => {
		const h = withDishes(marked());
		expect(setMaitre(h, 'a', {})).toBe(h);
		expect(setMaitre(h, 'missing', { guest: mark('x') })).toBe(h);
		expect(setMaitre(h, 'a', { why: mark('refused', 'maitre', 99) })).toBe(h);
	});

	it('confirmMaitre flips by to person and re-stamps ts, and only for a mark that exists', () => {
		const h = withDishes(marked());
		const out = confirmMaitre(h, 'a', 'guest', 500);
		expect(out.dishes[0].maitre?.guest).toEqual({ ...block().guest, by: 'person', ts: 500 });
		// the value and the model are kept: who wrote it is still true after Keep
		expect(out.dishes[0].maitre?.guest?.model).toBe('claude-opus-5');
		// the rest of the block is untouched
		expect(out.dishes[0].maitre?.why).toEqual(block().why);
		expect(out.dishes[0].maitre?.kept).toEqual(block().kept);
		expect(confirmMaitre(h, 'a', 'say', 500)).toBe(h);
		expect(confirmMaitre(h, 'missing', 'guest', 500)).toBe(h);
		// and the dish's own stamp does not move: a mark is not an edit to the dish
		expect(out.dishes[0].ts).toBe(100);
	});

	it('discardMaitre removes one mark, and the key itself once nothing is left', () => {
		const h = withDishes(marked());
		const one = discardMaitre(h, 'a', 'guest');
		expect(one.dishes[0].maitre?.guest).toBeUndefined();
		expect(one.dishes[0].maitre?.why).toEqual(block().why);
		expect(discardMaitre(h, 'a', 'say')).toBe(h);
		const lone = withDishes({ ...dish('a'), maitre: { guest: mark('x') } });
		expect('maitre' in discardMaitre(lone, 'a', 'guest').dishes[0]).toBe(false);
		// the kept notes are not a mark and stay
		const notes = withDishes({ ...dish('a'), maitre: { guest: mark('x'), kept: [{ q: 'q', a: 'a', ts: 1 }] } });
		expect(discardMaitre(notes, 'a', 'guest').dishes[0].maitre).toEqual({ kept: [{ q: 'q', a: 'a', ts: 1 }] });
	});

	it('keepMaitreNote appends, refuses a blank, and files the same keep once', () => {
		const h = withDishes(marked());
		const out = keepMaitreNote(h, 'a', ' What is the roux? ', 'Flour and fat, cooked dark.', 900, 'claude-opus-5');
		expect(out.dishes[0].maitre?.kept).toEqual([
			...block().kept!,
			{ q: 'What is the roux?', a: 'Flour and fat, cooked dark.', ts: 900, model: 'claude-opus-5' }
		]);
		expect(keepMaitreNote(h, 'a', '  ', 'answer', 900)).toBe(h);
		expect(keepMaitreNote(h, 'a', 'question', '', 900)).toBe(h);
		expect(keepMaitreNote(h, 'missing', 'q', 'a', 900)).toBe(h);
		const twice = keepMaitreNote(out, 'a', 'What is the roux?', 'Flour and fat, cooked dark.', 900);
		expect(twice.dishes[0].maitre?.kept).toHaveLength(2);
		// on a dish with no block yet, the note is the block
		const first = keepMaitreNote(withDishes(dish('b')), 'b', 'q', 'a', 1);
		expect(first.dishes[0].maitre).toEqual({ kept: [{ q: 'q', a: 'a', ts: 1 }] });
	});

	/**
	 * The store is a runes module a unit test cannot reach, so the refusal is
	 * pinned at the source: every mark write checks `blocked` before it touches
	 * the record, the way adopt() does. A mark rendered on screen over the alert
	 * saying the record is untouchable would contradict it and vanish on reload.
	 */
	it('the store refuses every mark write while blocked, before touching the record', () => {
		const src = readFileSync('src/lib/stores/house.svelte.ts', 'utf8');
		for (const name of ['setMaitre', 'confirmMaitre', 'discardMaitre', 'keepMaitreNote']) {
			const at = src.indexOf(`\t${name}(`);
			expect(at, `${name} is not on the store`).toBeGreaterThan(-1);
			const body = src.slice(at, src.indexOf('\n\t}\n', at));
			expect(body, `${name} does not refuse while blocked`).toContain('if (this.#blocked) return;');
			expect(body.indexOf('if (this.#blocked) return;')).toBeLessThan(body.indexOf('this.#r ='));
			expect(body).toContain('this.#persist();');
		}
	});

	it('the export carries the marks, kept and unkept alike, and the import takes them back', () => {
		const snap = houseSnapshot(withDishes(marked()));
		expect(snap.menuDishes[0].maitre).toEqual(block());
		const back = adoptImport(fresh(), snap.menuDishes, snap.dishCosts, {});
		expect(back.dishes[0].maitre).toEqual(block());
	});
});
