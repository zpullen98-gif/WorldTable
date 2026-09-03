import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrate, importLegacyCode, readSession, NewerVersionError } from './migrations';
import {
	CURRENT_VERSION,
	mergeSessions,
	mergeStepWindow,
	validStepActuals,
	type SessionState
} from './state';
import { describeImport } from './portable';
import { EMPTY_SESSION } from './state';

describe('migrate', () => {
	it('upgrades a version-0 blob and fills missing fields', () => {
		const out = migrate({ menu: ['cacio-e-pepe'] });
		expect(out.schemaVersion).toBe(CURRENT_VERSION);
		expect(out.menu).toEqual(['cacio-e-pepe']);
		expect(out.notes).toEqual({});
		expect(out.familyRecipes).toEqual([]);
	});

	it('refuses a future version without destroying it', () => {
		expect(() => migrate({ schemaVersion: CURRENT_VERSION + 1 })).toThrow(/newer version/);
	});
});

describe('mergeSessions — importing a .wtjson must not destroy what is already here', () => {
	const live = (): SessionState => ({
		...structuredClone(EMPTY_SESSION),
		menu: ['cacio-e-pepe'],
		cookedLog: [
			{ slug: 'ragu-alla-bolognese', at: 1000 },
			{ slug: 'carbonara', at: 2000 }
		],
		shoppingChecks: { abc123: ['Produce:0', 'Dairy:1'] }
	});

	/**
	 * The regression that mattered: buildExport writes the FULL state, so a real
	 * export always carries cookedLog and shoppingChecks present-and-empty. The
	 * old merge let those fall through a bare spread and wipe the live values —
	 * and flush() writes immediately, so nothing could be recovered.
	 */
	it('survives an import whose own cooked log and ticks are empty', () => {
		const out = mergeSessions(live(), {
			...structuredClone(EMPTY_SESSION),
			menu: ['tom-yum-goong']
		});
		expect(out.cookedLog).toHaveLength(2);
		expect(out.shoppingChecks.abc123).toEqual(['Produce:0', 'Dairy:1']);
		expect(out.menu).toEqual(['cacio-e-pepe', 'tom-yum-goong']);
	});

	/**
	 * This test used to assert the opposite — union by slug, keep the EARLIEST
	 * cook — and it was right to, while nothing read the timestamps. Once the
	 * re-cook schedule started reading them (lib/repertoire.ts) that rule became
	 * data loss: it threw away every repeat and backdated the survivor, so
	 * importing a session reported your whole repertoire as older than it was.
	 */
	it('keeps every cook, so a dish made twice stays a dish made twice', () => {
		const out = mergeSessions(live(), {
			cookedLog: [
				{ slug: 'carbonara', at: 500 },
				{ slug: 'pad-thai', at: 3000 }
			]
		});
		expect(out.cookedLog.map((e) => e.slug).sort()).toEqual([
			'carbonara',
			'carbonara',
			'pad-thai',
			'ragu-alla-bolognese'
		]);
		const carbonara = out.cookedLog.filter((e) => e.slug === 'carbonara').map((e) => e.at);
		expect(carbonara.sort((a, b) => a - b)).toEqual([500, 2000]);
	});

	it('is idempotent — re-importing your own export adds nothing', () => {
		const mine = live();
		const out = mergeSessions(mine, structuredClone(mine));
		expect(out.cookedLog).toHaveLength(2);
	});

	it('prefers the graded copy when both sides hold the same cook', () => {
		const out = mergeSessions(live(), {
			cookedLog: [{ slug: 'carbonara', at: 2000, grade: 'met' }]
		});
		expect(out.cookedLog).toHaveLength(2);
		expect(out.cookedLog.find((e) => e.slug === 'carbonara')?.grade).toBe('met');
	});

	/**
	 * dishCosts is the newest field, and the reason this file exists is that a
	 * new field falling through a bare spread once destroyed every cooked mark
	 * and shopping tick in the app. Named explicitly in mergeSessions; asserted
	 * here.
	 */
	it('keeps a costing the incoming file does not carry', () => {
		const mine = {
			...live(),
			dishCosts: {
				'd-1': {
					lines: [{ id: 'c-1', item: 'Salmon', unitCost: 12, unit: 'kg', usedQty: 0.2, yieldPct: 45 }],
					sales: [],
					ts: 100
				}
			}
		};
		const out = mergeSessions(mine, { ...structuredClone(EMPTY_SESSION), menu: ['tom-yum-goong'] });
		expect(out.dishCosts['d-1'].lines).toHaveLength(1);
		expect(out.dishCosts['d-1'].lines[0].yieldPct).toBe(45);
	});

	/**
	 * REWRITTEN, because the version this replaced asserted the bug.
	 *
	 * It read `expect(out.dishCosts['d-1'].sold).toBe(99)` — pinning "the newer
	 * costing replaces the older one WHOLE" as correct, on the very field that
	 * became a history. That rule is right for a scalar and destructive for an
	 * array: a sous who typed week 3 on the pass tablet, imported onto the head
	 * chef's device with a newer ts, wiped weeks 1 and 2. The test would have
	 * gone on passing against an implementation that still replaced whole.
	 */
	it('unions covers by week instead of replacing the record', () => {
		const mine = {
			...live(),
			dishCosts: {
				'd-1': {
					lines: [],
					sales: [
						{ weekStart: '2026-01-05', count: 40, at: 100 },
						{ weekStart: '2026-01-12', count: 50, at: 200 }
					],
					ts: 100
				}
			}
		};
		const out = mergeSessions(mine, {
			dishCosts: {
				'd-1': { lines: [], sales: [{ weekStart: '2026-01-19', count: 60, at: 900 }], ts: 900 }
			}
		});
		const weeks = out.dishCosts['d-1'].sales.map((w) => w.weekStart);
		expect(weeks, 'an import replaced the history instead of adding to it').toEqual([
			'2026-01-19',
			'2026-01-12',
			'2026-01-05'
		]);
	});

	it('lets the newer count win one week, and says what it replaced', () => {
		const mine = {
			...live(),
			dishCosts: {
				'd-1': { lines: [], sales: [{ weekStart: '2026-01-05', count: 40, at: 100 }], ts: 100 }
			}
		};
		const out = mergeSessions(mine, {
			dishCosts: {
				'd-1': { lines: [], sales: [{ weekStart: '2026-01-05', count: 44, at: 900 }], ts: 900 }
			}
		});
		expect(out.dishCosts['d-1'].sales[0].count).toBe(44);
		expect(out.dishCosts['d-1'].sales[0].prev, 'the replaced figure vanished').toBe(40);
	});

	/**
	 * REWRITTEN for the same reason. The old name — "ignores a costing with no
	 * lines array rather than trusting the file" — sounds exactly right and now
	 * describes discarding the record this change produces: a covers-only
	 * costing legitimately has no lines. Guard on the fields being merged.
	 */
	it('keeps a covers-only costing, and still refuses one carrying no figure', () => {
		const withCovers = mergeSessions(live(), {
			dishCosts: {
				'd-9': { sales: [{ weekStart: '2026-01-05', count: 12, at: 1 }] }
			} as never
		});
		expect(withCovers.dishCosts['d-9']?.sales).toHaveLength(1);
		expect(withCovers.dishCosts['d-9']?.lines).toEqual([]);

		const empty = mergeSessions(live(), { dishCosts: { 'd-8': {} } as never });
		expect(empty.dishCosts['d-8']).toBeUndefined();
	});

	/**
	 * The cookedLog failure mode, exactly. buildExport writes the FULL state, so
	 * a genuine .wtjson always carries `role` present-and-empty — and a bare
	 * spread would let importing a colleague's menu silently un-set what you do.
	 */
	it('keeps your role when the incoming session has none', () => {
		const mine = { ...live(), role: 'server' as const };
		const out = mergeSessions(mine, { ...structuredClone(EMPTY_SESSION), menu: ['tom-yum-goong'] });
		expect(out.role).toBe('server');
	});

	it('adopts a role when you have never set one', () => {
		const out = mergeSessions(live(), { role: 'chef' });
		expect(out.role).toBe('chef');
	});

	/**
	 * drillLog is the newest field and repeats the cookedLog rules exactly,
	 * because it is the same shape and the same failure modes apply: an export
	 * always carries it present-and-empty, and keying on slug alone would
	 * collapse every repeat answer and backdate the survivor.
	 */
	it('keeps drill answers an incoming session does not carry', () => {
		const mine = {
			...live(),
			drillLog: [{ slug: 'riesling', at: 1000, grade: 'met' as const }]
		};
		const out = mergeSessions(mine, { ...structuredClone(EMPTY_SESSION), menu: ['tom-yum-goong'] });
		expect(out.drillLog).toHaveLength(1);
	});

	it('keeps every drill answer, so a term answered twice stays answered twice', () => {
		const mine = {
			...live(),
			drillLog: [{ slug: 'riesling', at: 1000, grade: 'missed' as const }]
		};
		const out = mergeSessions(mine, {
			drillLog: [{ slug: 'riesling', at: 5000, grade: 'met' }]
		});
		expect(out.drillLog.map((e) => e.at)).toEqual([1000, 5000]);
	});

	it('is idempotent — re-importing your own drill history adds nothing', () => {
		const mine = { ...live(), drillLog: [{ slug: 'comte', at: 42, grade: 'met' as const }] };
		expect(mergeSessions(mine, structuredClone(mine)).drillLog).toHaveLength(1);
	});

	it('unions shopping ticks per menu hash instead of replacing them', () => {
		const out = mergeSessions(live(), {
			shoppingChecks: { abc123: ['Dairy:1', 'Meat:2'], other: ['Produce:0'] }
		});
		expect(out.shoppingChecks.abc123.sort()).toEqual(['Dairy:1', 'Meat:2', 'Produce:0']);
		expect(out.shoppingChecks.other).toEqual(['Produce:0']);
	});

	it('refuses to let a hand-edited file walk the schema version backwards', () => {
		const out = mergeSessions(live(), { schemaVersion: 0 } as Partial<SessionState>);
		expect(out.schemaVersion).toBe(CURRENT_VERSION);
	});

	/* The Kitchen's Menu rides the same rules: named in the merge, present in
	 * the summary, and a pre-feature file (no menuDishes at all) changes nothing. */
	const dish = (id: string, name: string, ts: number) => ({
		id, name, section: 'Mains', description: '', ingredients: [], allergens: [], price: '', ts
	});

	it('keeps live menu dishes through an import that carries none', () => {
		const mine = { ...live(), menuDishes: [dish('d-aaa', 'The Halibut', 100)] };
		const out = mergeSessions(mine, { ...structuredClone(EMPTY_SESSION) });
		expect(out.menuDishes).toHaveLength(1);
	});

	it('keeps live menu dishes through a PRE-FEATURE file with no menuDishes field', () => {
		const mine = { ...live(), menuDishes: [dish('d-aaa', 'The Halibut', 100)] };
		const legacy = structuredClone(EMPTY_SESSION) as Partial<SessionState>;
		delete legacy.menuDishes;
		const out = mergeSessions(mine, legacy);
		expect(out.menuDishes).toHaveLength(1);
	});

	it('unions menu dishes by id, the newer edit winning', () => {
		const mine = { ...live(), menuDishes: [dish('d-aaa', 'The Halibut', 100)] };
		const out = mergeSessions(mine, {
			menuDishes: [dish('d-aaa', 'The Halibut, renamed', 200), dish('d-bbb', 'The Duck', 50)]
		});
		expect(out.menuDishes).toHaveLength(2);
		expect(out.menuDishes.find((d) => d.id === 'd-aaa')?.name).toBe('The Halibut, renamed');
	});

	it('describeImport counts incoming menu dishes', () => {
		const mine = { ...live(), menuDishes: [dish('d-aaa', 'The Halibut', 100)] };
		const summary = describeImport(
			{ menuDishes: [dish('d-aaa', 'Same', 1), dish('d-bbb', 'The Duck', 2)] },
			mine
		);
		expect(summary).toContain('1 menu dish');
	});

	/**
	 * stepActuals carries no timestamp per sample, so recordStepActual's own
	 * write-side rule (session.svelte.ts: round first, then refuse anything at
	 * or below zero) is the only thing that says what a "real" sample looks
	 * like. Before this, mergeSessions admitted whatever a hand-edited file
	 * said - a fractional 0.4, a negative -3 - that the live store itself could
	 * never have written.
	 */
	describe('validStepActuals', () => {
		it('rounds first, like recordStepActual, rather than dropping a fraction', () => {
			expect(validStepActuals([7.6])).toEqual([8]);
			expect(validStepActuals([0.4])).toEqual([]); // rounds to 0, then refused
		});

		it('refuses zero and negative samples', () => {
			expect(validStepActuals([-3, 0, 5])).toEqual([5]);
		});

		it('refuses non-numbers and non-finite values without throwing', () => {
			expect(validStepActuals(['x', null, NaN, Infinity, 12])).toEqual([12]);
		});

		it('is the safe empty value for anything that is not an array', () => {
			expect(validStepActuals('20')).toEqual([]);
			expect(validStepActuals(undefined)).toEqual([]);
		});
	});

	/**
	 * No per-sample timestamp exists to union on, so this cannot promise the
	 * newest observations win — what it can promise is that concatenating and
	 * slicing the tail no longer lets one side's file wipe the other's window
	 * outright.
	 */
	describe('mergeStepWindow', () => {
		it('keeps both sides when the combined count is under the cap', () => {
			// Order carries no meaning without a per-sample timestamp - only that
			// nothing is dropped when there was no need to.
			expect(mergeStepWindow([1, 2], [3, 4]).sort()).toEqual([1, 2, 3, 4]);
		});

		it('a full incoming window no longer wipes a full local one', () => {
			const local = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
			const incoming = [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101];
			const out = mergeStepWindow(local, incoming);
			expect(out).toHaveLength(12);
			expect(out.some((n) => local.includes(n)), 'the local window survived at all').toBe(true);
			expect(out.some((n) => incoming.includes(n)), 'the incoming window survived at all').toBe(
				true
			);
		});

		it('stays at the cap and keeps drawing from whichever side still has samples', () => {
			// Local is short; incoming alone has to fill the rest of the window.
			const out = mergeStepWindow([1, 2], Array.from({ length: 12 }, (_, i) => 100 + i));
			expect(out).toHaveLength(12);
			expect(out).toContain(1);
			expect(out).toContain(2);
		});
	});

	describe('mergeSessions merges stepActuals instead of letting incoming own the tail', () => {
		it('a full incoming window no longer wipes every local observation for a shared key', () => {
			const mine = { ...live(), stepActuals: { 'coq-au-vin#0': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } };
			const out = mergeSessions(mine, {
				stepActuals: { 'coq-au-vin#0': [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101] }
			});
			const key = out.stepActuals['coq-au-vin#0'];
			expect(key).toHaveLength(12);
			expect(key.some((n) => n <= 12), 'some of the local window survived').toBe(true);
		});

		it('screens incoming samples the way recordStepActual would before merging them', () => {
			const mine = { ...live(), stepActuals: { 'suzma#1': [5, 5, 5] } };
			const out = mergeSessions(mine, { stepActuals: { 'suzma#1': [0.4, 7.6, -3] } });
			// 0.4 rounds to 0 and is refused; 7.6 rounds to 8; -3 is refused.
			expect(out.stepActuals['suzma#1']).toEqual([5, 5, 5, 8]);
		});

		it('leaves an untouched key alone', () => {
			const mine = { ...live(), stepActuals: { 'cacio-e-pepe#0': [10, 12] } };
			const out = mergeSessions(mine, { stepActuals: {} });
			expect(out.stepActuals['cacio-e-pepe#0']).toEqual([10, 12]);
		});
	});

	it('describeImport counts valid step timings and screens out what the store would refuse', () => {
		const mine = live();
		const summary = describeImport(
			{ stepActuals: { 'coq-au-vin#0': [8, 0.4, -3, 12] } },
			mine
		);
		// 8 and 12 round-trip through validStepActuals; 0.4 and -3 do not.
		expect(summary).toContain('2 step timings');
	});

	/**
	 * "Every field is named explicitly. Nothing is left to the spread." had no
	 * gate: `lastWrite` was still taken verbatim from `incoming` through the
	 * bare `...incoming` spread, unnoticed only because saveSession restamps it
	 * on every write and nothing reads it back — the field is write-only. This
	 * is a SOURCE check rather than a behavioural one, because most of
	 * SessionState's fields transform their value (union two arrays, merge two
	 * logs) rather than pass one through, so a generic "does a sentinel
	 * survive" probe cannot tell a legitimate merge from a fallthrough. What
	 * every field must do, transform or not, is appear as an explicit key in
	 * the return object — which is exactly the rule stated above, made
	 * mechanical: read straight from SessionState's own declaration, not from
	 * EMPTY_SESSION, because `planRun` is optional and absent from
	 * EMPTY_SESSION and would otherwise go unchecked by the very field that
	 * motivated the rule.
	 */
	it('names every SessionState field explicitly in its return object', () => {
		const src = readFileSync(join(process.cwd(), 'src', 'lib', 'persistence', 'state.ts'), 'utf8');

		const ifaceStart = src.indexOf('export interface SessionState {');
		const ifaceEnd = src.indexOf('\n}', ifaceStart);
		const iface = src.slice(ifaceStart, ifaceEnd);
		// Top-level members only: exactly one leading tab. A nested field inside
		// e.g. `cookedLog: Array<{ ... }>` sits at two tabs and must not count.
		const TOP_LEVEL_FIELD = /^\t(\w+)\??:/gm;
		const fields = [...iface.matchAll(TOP_LEVEL_FIELD)].map((m) => m[1]);
		expect(fields.length, 'the interface must have been read').toBeGreaterThan(10);

		const fnStart = src.indexOf('export function mergeSessions(');
		const returnStart = src.indexOf('\treturn {', fnStart);
		const returnEnd = src.indexOf('\n\t};\n}', returnStart);
		const body = src.slice(returnStart, returnEnd);

		const unnamed = fields.filter((f) => {
			const NAMED_AS_KEY = new RegExp('\\b' + f + '\\s*[,:]');
			return !NAMED_AS_KEY.test(body);
		});
		expect(unnamed, 'every SessionState field must be an explicit key in the merge').toEqual([]);
	});
});

describe('importLegacyCode (the WT1. base64 format)', () => {
	// The original stored menu and notes by ARRAY INDEX into the recipe list.
	const orderedSlugs = ['cacio-e-pepe', 'ragu-alla-bolognese', 'carbonara'];
	const pantryLabels = new Set(['Chicken', 'Garlic']);

	const encode = (payload: object) => 'WT1.' + btoa(JSON.stringify(payload));

	it('resolves indices to slugs', () => {
		const code = encode({ menu: [0, 2], notes: { 1: 'more pancetta' }, pantry: ['Garlic'] });
		const { state, unresolved } = importLegacyCode(code, orderedSlugs, pantryLabels);
		expect(state.menu).toEqual(['cacio-e-pepe', 'carbonara']);
		expect(state.notes).toEqual({ 'ragu-alla-bolognese': 'more pancetta' });
		expect(state.pantry).toEqual(['Garlic']);
		expect(unresolved).toEqual([]);
	});

	it('reports what it cannot place instead of dropping it silently', () => {
		const code = encode({ menu: [0, 99], pantry: ['Garlic', 'Unicorn Tears'] });
		const { state, unresolved } = importLegacyCode(code, orderedSlugs, pantryLabels);
		expect(state.menu).toEqual(['cacio-e-pepe']);
		expect(unresolved).toContain('recipe #99');
		expect(unresolved).toContain('pantry “Unicorn Tears”');
	});

	it('rejects non-WT1 text and truncated base64 with readable errors', () => {
		expect(() => importLegacyCode('hello', orderedSlugs, pantryLabels)).toThrow(/Not a WT1/);
		expect(() => importLegacyCode('WT1.!!!corrupt', orderedSlugs, pantryLabels)).toThrow(
			/not readable|truncated/
		);
	});

	it('its output survives describeImport (the crash a Partial used to cause)', () => {
		const code = encode({ menu: [0] }); // no notes, no pantry, no familyRecipes
		const { state } = importLegacyCode(code, orderedSlugs, pantryLabels);
		const summary = describeImport(state, structuredClone(EMPTY_SESSION));
		expect(summary).toContain('1 new pinned dish');
	});
});

/**
 * A record this build must not touch - the readHouse contract, for the session.
 *
 * migrate() always refused a newer version; its CALLER turned the refusal into
 * a silent reset. loadSession caught the throw, snapshotted the record under a
 * corrupt.* key nothing read, returned an empty session, and the next tap
 * persisted that empty over the real record. Reproduced end to end before the
 * fix: tick 'Chicken', bump the stored version to 2, reload, tick 'Beef' -
 * Chicken gone from the live key. These pin the pure reader that decides the
 * hold; db.test.ts pins that the write path honours it.
 */
describe('a record this build must not touch', () => {
	it('throws a typed refusal for a newer version', () => {
		expect(() => migrate({ schemaVersion: CURRENT_VERSION + 1 })).toThrow(NewerVersionError);
	});

	it('refuses a newer version as held, and does not hand back its content', () => {
		const r = readSession({ schemaVersion: CURRENT_VERSION + 1, pantry: ['Chicken'] });
		expect(r.held).toBe(true);
		if (r.held) expect(r.reason).toBe('newer');
		expect(r.state.pantry).toEqual([]);
	});

	it('reads a current record normally', () => {
		const r = readSession({ schemaVersion: CURRENT_VERSION, pantry: ['Chicken'] });
		expect(r.held).toBe(false);
		expect(r.state.pantry).toEqual(['Chicken']);
	});

	it('reads a record predating the field, the one case coercion is for', () => {
		const r = readSession({ menu: ['cacio-e-pepe'] });
		expect(r.held).toBe(false);
		expect(r.state.schemaVersion).toBe(CURRENT_VERSION);
		expect(r.state.menu).toEqual(['cacio-e-pepe']);
	});

	it('treats nothing on disk as a fresh start, not a refusal', () => {
		expect(readSession(undefined).held).toBe(false);
		expect(readSession(null).held).toBe(false);
	});

	it('refuses a version it cannot positively recognise', () => {
		for (const v of ['2', null, {}]) {
			const r = readSession({ schemaVersion: v });
			expect(r.held, JSON.stringify(v)).toBe(true);
			if (r.held) expect(r.reason).toBe('unrecognised');
		}
	});
});
