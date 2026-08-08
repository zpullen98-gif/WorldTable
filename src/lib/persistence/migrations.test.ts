import { describe, it, expect } from 'vitest';
import { migrate, importLegacyCode } from './migrations';
import { CURRENT_VERSION } from './state';
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
