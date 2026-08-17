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

	it('unions cooked dishes by slug, keeping the earliest date', () => {
		const out = mergeSessions(live(), {
			cookedLog: [
				{ slug: 'carbonara', at: 500 },
				{ slug: 'pad-thai', at: 3000 }
			]
		});
		expect(out.cookedLog.map((e) => e.slug).sort()).toEqual([
			'carbonara',
			'pad-thai',
			'ragu-alla-bolognese'
		]);
		expect(out.cookedLog.find((e) => e.slug === 'carbonara')?.at).toBe(500);
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
