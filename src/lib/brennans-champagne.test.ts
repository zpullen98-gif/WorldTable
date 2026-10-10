import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { refreshEdition } from './house/house-pack';
import type { House } from './house/house-schema';

const packPath = fileURLToPath(new URL('../../static/shared/packs/brennans-new-orleans.v1.oothouse.json', import.meta.url));
const shipped = JSON.parse(readFileSync(packPath, 'utf8')).house as House;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const OLD = Date.parse('2026-10-10T09:30:00.000Z');
const bottle = (h: House) => h.wines.find(w => w.id === 'w-dbz9e960')!;

/* Model an untouched copy of the preceding edition. Every edition-owned
   stamp must move together, just as the canonical pack builder does. */
function precedingEdition(): House {
	const copy = clone(shipped);
	const stamp = Date.parse(copy.pack!.builtAt);
	function older(value: unknown): unknown {
		if (value === stamp) return OLD;
		if (Array.isArray(value)) return value.map(older);
		if (value && typeof value === 'object') {
			for (const key of Object.keys(value)) {
				const record = value as Record<string, unknown>;
				record[key] = older(record[key]);
			}
		}
		return value;
	}
	older(copy);
	copy.pack!.builtAt = new Date(OLD).toISOString();
	bottle(copy).profile!.value = 'Extra Brut means very little added sugar, under six grams a liter.';
	bottle(copy).kept!.find(n => n.q === 'Tell me about it.')!.a = 'The old edition called this drier than a standard Brut.';
	return copy;
}

describe('Brennan\'s Champagne terminology', () => {
	it('teaches final sugar ranges and the two Brut Nature conditions without ranking overlapping categories', () => {
		const dosage = shipped.components!.find(c => c.id === 'c-z3n3b974')!;
		expect(dosage.explain!.value).toContain('finished wine');
		expect(dosage.explain!.value).toContain('Extra Brut contains 0 to 6 grams per liter');
		expect(dosage.explain!.value).toContain('Brut, less than 12');
		expect(dosage.explain!.value).toContain('Brut Nature requires less than 3 grams per liter and no added sugar after the second fermentation');
		expect(dosage.card!.value.back).toContain('Extra Brut and Brut overlap');
		expect(JSON.stringify(shipped)).not.toMatch(/Extra Brut means very little|under six grams|drier than our house Champagne|Extra Brut, drier still/);
	});
	it('refreshes the preceding edition without changing the wine identity or menu facts', () => {
		const previous = precedingEdition();
		const { house } = refreshEdition(previous, shipped);
		expect(bottle(house).profile).toEqual(bottle(shipped).profile);
		expect(bottle(house).kept!.find(n => n.q === 'Tell me about it.')).toEqual(bottle(shipped).kept!.find(n => n.q === 'Tell me about it.'));
		expect(bottle(house).id).toBe(bottle(previous).id);
		expect(bottle(house).price).toBe(bottle(previous).price);
		expect(house.pack!.builtAt).toBe(shipped.pack!.builtAt);
	});
	it('keeps the Brut lexicon consistent with the finished wine ranges and refreshes an older definition', () => {
		const brut = shipped.lexicon.find(t => t.term === 'Brut')!;
		const definition = brut.toGuest!.value;
		expect(definition).toContain('less than 12 grams of sugar per liter in the finished wine');
		expect(definition).toContain('Extra Brut is 0 to 6 grams per liter');
		expect(definition).toContain('the categories overlap');
		expect(definition).toContain('those words alone do not prove one bottle is drier than another');
		expect(definition).toContain('Extra Dry is the sweeter category at 12 to 17 grams per liter');
		expect(definition).not.toContain('driest first');
		const previous = precedingEdition();
		previous.lexicon.find(t => t.id === brut.id)!.toGuest!.value = 'Brut means dry. The order on a label, driest first: Extra Brut, Brut, Extra Dry, Demi-Sec.';
		const { house } = refreshEdition(previous, shipped);
		expect(house.lexicon.find(t => t.id === brut.id)).toEqual(brut);
	});
	it('preserves a personal profile and lineup note while updating other edition-owned notes', () => {
		const previous = precedingEdition();
		const wine = bottle(previous);
		wine.profile = { value: 'My own description from lineup.', by: 'person', ts: OLD + 1000 };
		wine.kept!.push({ q: 'My lineup note', a: 'Confirm the current bottling with our sommelier.', ts: OLD + 1000 });
		const { house } = refreshEdition(previous, shipped);
		expect(bottle(house).profile).toEqual(wine.profile);
		expect(bottle(house).kept).toContainEqual(wine.kept!.find(n => n.q === 'My lineup note'));
		expect(bottle(house).kept!.find(n => n.q === 'Tell me about it.')).toEqual(bottle(shipped).kept!.find(n => n.q === 'Tell me about it.'));
	});
});
