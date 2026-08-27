import { describe, it, expect } from 'vitest';
import { migrate, importLegacyCode } from './migrations';
import { CURRENT_VERSION, mergeSessions, type SessionState } from './state';
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
				'd-1': { lines: [{ id: 'c-1', item: 'Salmon', unitCost: 12, unit: 'kg', usedQty: 0.2, yieldPct: 45 }], ts: 100 }
			}
		};
		const out = mergeSessions(mine, { ...structuredClone(EMPTY_SESSION), menu: ['tom-yum-goong'] });
		expect(out.dishCosts['d-1'].lines).toHaveLength(1);
		expect(out.dishCosts['d-1'].lines[0].yieldPct).toBe(45);
	});

	it('takes the newer costing per dish and leaves the others alone', () => {
		const mine = {
			...live(),
			dishCosts: {
				'd-1': { lines: [], sold: 10, ts: 100 },
				'd-2': { lines: [], sold: 5, ts: 500 }
			}
		};
		const out = mergeSessions(mine, {
			dishCosts: {
				'd-1': { lines: [], sold: 99, ts: 900 },
				'd-2': { lines: [], sold: 1, ts: 200 }
			}
		});
		expect(out.dishCosts['d-1'].sold).toBe(99);
		expect(out.dishCosts['d-2'].sold).toBe(5);
	});

	it('ignores a costing with no lines array rather than trusting the file', () => {
		const out = mergeSessions(live(), {
			dishCosts: { 'd-9': { sold: 4 } } as never
		});
		expect(out.dishCosts['d-9']).toBeUndefined();
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
