import { describe, it, expect } from 'vitest';
import full from './data/recipes.full.json';

interface WithEquipment {
	slug: string;
	equipment: string[];
}

const recipes = full as unknown as WithEquipment[];
const named = (slug: string) => recipes.find((r) => r.slug === slug);

/**
 * EQUIP.json's "Deep-fry pot" pattern carries a bare `190°c` alternative
 * (src/lib/data/raw/EQUIP.json) meant to catch an oil temperature, ported
 * byte-for-byte from the sealed original. It cannot tell an oven from a
 * fryer: six baked-only dishes whose sole 190°C is an oven step were told
 * they needed a deep-fry pot, three of them (chocolate-chip-cookies,
 * smulpaj-med-kardemumma) with nothing else on the equipment line at all.
 *
 * Tightening the pattern itself is not the fix: fish-and-chips and
 * moules-frites match the SAME bare alternative for their own genuine oil
 * temperature ("Chips back in at 190°C", "then 190°C to bronze") without
 * ever writing "oil for frying" verbatim, so narrowing the regex trades six
 * false positives for two false negatives on the same label. Five of the six
 * baked dishes are also in the sealed 970 that tests/parity.spec.ts checks
 * against the original executing itself, with no ruling mechanism for
 * equipment the way COST_RULINGS exists for cost — so the fix is a per-recipe
 * override (src/lib/data/overrides.json), the mechanism this codebase
 * already has for exactly this shape of judgement call.
 */
describe('Deep-fry pot does not follow an oven temperature into a baked dish', () => {
	it('a dish with no other equipment loses the false positive entirely', () => {
		expect(named('chocolate-chip-cookies')?.equipment).toEqual([]);
		expect(named('smulpaj-med-kardemumma')?.equipment).toEqual([]);
	});

	it('a dish with other real equipment keeps it, minus the false positive', () => {
		expect(named('eggplant-parmigiana')?.equipment).toEqual(['Thermometer']);
		expect(named('briam')?.equipment).toEqual(['Grater / zester']);
		expect(named('apfelstrudel')?.equipment).toEqual(['Sheet pan']);
		expect(named('kurtoskalacs')?.equipment).toEqual(['Grill', 'Sheet pan', 'Rolling pin']);
	});

	it('a dish that genuinely fries keeps Deep-fry pot', () => {
		expect(named('fish-and-chips')?.equipment).toContain('Deep-fry pot');
		expect(named('moules-frites')?.equipment).toContain('Deep-fry pot');
	});
});
