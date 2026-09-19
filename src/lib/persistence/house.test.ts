import { describe, it, expect } from 'vitest';
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
	type HouseRecord
} from './house';
import { EMPTY_SESSION, type MenuDish } from './state';
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
