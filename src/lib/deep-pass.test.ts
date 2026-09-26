import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { mergeSessions, EMPTY_SESSION, type SessionState, type MenuDish, type MaitreMark } from './persistence/state';
import { adoptImport, EMPTY_HOUSE, type HouseRecord } from './persistence/house';
import { recordPrice, recordYield, measuredYieldPct, previousPrice, priceMovePct } from './items';
import { parsePrice } from './costing';

/**
 * Regression pins for the deep pass — each of these was a confirmed finding
 * from the six-lens review, verified against the code before it was fixed.
 */

const T = 1_700_000_000_000;

describe('finding: stepActuals and planRun fell through the merge spread', () => {
	const mine = (): SessionState => ({
		...structuredClone(EMPTY_SESSION),
		stepActuals: { 'coq-au-vin#2#5': [340, 355, 348] },
		planRun: { menuHash: 'h', serviceTime: '19:00', startedAt: T, ticks: {} }
	});

	/** The real export shape: EMPTY_SESSION always carries the keys present. */
	it('a full-state import cannot wipe observed step timings', () => {
		const out = mergeSessions(mine(), structuredClone(EMPTY_SESSION));
		expect(out.stepActuals['coq-au-vin#2#5']).toEqual([340, 355, 348]);
	});

	it('two devices’ observations union per key, newest kept in the window', () => {
		const theirs = {
			...structuredClone(EMPTY_SESSION),
			stepActuals: { 'coq-au-vin#2#5': [400], 'other#1#3': [90] }
		};
		const out = mergeSessions(mine(), theirs);
		expect(out.stepActuals['coq-au-vin#2#5']).toEqual([340, 355, 348, 400]);
		expect(out.stepActuals['other#1#3']).toEqual([90]);
	});

	it('the window stays at 12, matching the store', () => {
		const theirs = {
			...structuredClone(EMPTY_SESSION),
			stepActuals: { k: Array.from({ length: 20 }, (_, i) => 100 + i) }
		};
		const out = mergeSessions({ ...structuredClone(EMPTY_SESSION), stepActuals: { k: [1, 2] } }, theirs);
		expect(out.stepActuals.k).toHaveLength(12);
		expect(out.stepActuals.k.at(-1)).toBe(119);
	});

	/** A run is one device's live service clock, like the 86 board. */
	it('an import never installs someone else’s live service run', () => {
		const theirs = {
			...structuredClone(EMPTY_SESSION),
			planRun: { menuHash: 'x', serviceTime: '21:00', startedAt: T + 1, ticks: {} }
		};
		expect(mergeSessions(mine(), theirs).planRun?.serviceTime).toBe('19:00');
		expect(mergeSessions(structuredClone(EMPTY_SESSION), theirs).planRun).toBeUndefined();
	});
});

describe('finding: any reprice destroyed the yield tests', () => {
	it('a new price keeps the yields', () => {
		let book = recordYield({}, 'Plaice', 100, 45, T);
		book = recordPrice(book, 'Plaice', 12, 'kg', T + 1000_000);
		expect(measuredYieldPct(book.plaice)).toBe(45);
		expect(book.plaice.history).toHaveLength(1);
	});

	it('a same-price rename keeps the yields', () => {
		let book = recordPrice({}, 'plaice', 12, 'kg', T);
		book = recordYield(book, 'plaice', 100, 45, T + 1);
		book = recordPrice(book, 'Plaice', 12, 'kg', T + 2);
		expect(book.plaice.name).toBe('Plaice');
		expect(measuredYieldPct(book.plaice)).toBe(45);
	});
});

describe('finding: previous price compared across purchase units', () => {
	it('a unit change re-bases the series instead of reading as a tiny move', () => {
		let book = recordPrice({}, 'Butter', 190, 'case', T);
		book = recordPrice(book, 'Butter', 7.9, 'kg', T + 90 * 86_400_000);
		expect(previousPrice(book.butter)).toBeNull();
		expect(priceMovePct(book.butter)).toBeNull();
	});

	it('within one unit the movement still reads', () => {
		let book = recordPrice({}, 'Butter', 6.4, 'kg', T);
		book = recordPrice(book, 'Butter', 7.9, 'kg', T + 90 * 86_400_000);
		expect(previousPrice(book.butter)?.unitCost).toBe(6.4);
	});
});

describe('finding: the full European price form lost a thousandfold', () => {
	it('1.500,00 is fifteen hundred, not one and a half', () => {
		expect(parsePrice('1.500,00')).toBe(1500);
		expect(parsePrice('€2.350,50')).toBe(2350.5);
	});

	it('the forms that already worked still work', () => {
		expect(parsePrice('14,50')).toBe(14.5);
		expect(parsePrice('$14.50')).toBe(14.5);
		expect(parsePrice('14')).toBe(14);
	});

	/** Ambiguous without the comma tail; taking it as read beats guessing. */
	it('a bare 1.500 stays 1.5, documented', () => {
		expect(parsePrice('1.500')).toBe(1.5);
	});
});

describe('finding: the tax setting did not travel', () => {
	const withTax = (): HouseRecord => ({
		...structuredClone(EMPTY_HOUSE),
		tax: { inclusive: true, ratePct: 20 }
	});

	it('a fresh tablet adopts the venue’s tax regime from the file', () => {
		const out = adoptImport(structuredClone(EMPTY_HOUSE), [], {}, { tax: { inclusive: true, ratePct: 20 } });
		expect(out.tax).toEqual({ inclusive: true, ratePct: 20 });
	});

	/** An import must not silently flip the basis of every percentage. */
	it('a venue that has set its own regime keeps it', () => {
		const out = adoptImport(withTax(), [], {}, { tax: { inclusive: false, ratePct: 0 } });
		expect(out.tax).toEqual({ inclusive: true, ratePct: 20 });
	});

	it('a pre-tax file leaves the setting alone', () => {
		expect(adoptImport(withTax(), [], {}, {}).tax).toEqual({ inclusive: true, ratePct: 20 });
	});
});

/**
 * The Maitre d's marks live INSIDE the dish, and a dish merges whole on `ts`.
 * Left to that rule, a colleague's later edit to a description would carry an
 * empty block over every line a person kept. So both merges NAME the field and
 * settle it on its own stamps (mergeMaitre), and `kept` unions on ts|q. Two
 * merges, one line each, pinned here because the dish merge they share has
 * drifted once already.
 */
describe('finding: a description edit must not erase a kept answer', () => {
	const mark = (value: string, by: 'maitre' | 'person', ts: number): MaitreMark => ({ value, by, ts });
	const base = (): MenuDish => ({
		id: 'd-crab',
		name: 'Crawfish Etouffee',
		section: 'Mains',
		description: 'Louisiana crawfish, dark roux, rice.',
		ingredients: [],
		allergens: [],
		price: '34',
		ts: 100
	});
	/** What the pass tablet holds: a kept why, her unkept guest line, one kept answer. */
	const marked = (): MenuDish => ({
		...base(),
		maitre: {
			why: mark('The roux is taken to the colour of a penny.', 'person', 90),
			guest: mark('A crawfish stew on rice, the roux dark and nutty.', 'maitre', 80),
			kept: [{ q: 'Where is the crawfish from?', a: 'The menu does not say.', ts: 85 }]
		}
	});
	/** The office laptop: a newer description, and no block at all. */
	const edited = (): MenuDish => ({ ...base(), description: 'Crawfish, dark roux, rice, green onion.', ts: 200 });

	it('both merges NAME maitre with mergeMaitre, per the CLAUDE.md rule', () => {
		const state = readFileSync('src/lib/persistence/state.ts', 'utf8');
		const dishes = state.slice(state.indexOf('menuDishes: (() => {'), state.indexOf('dishCosts: (() => {'));
		expect(dishes).toContain('mergeMaitre(');
		const house = readFileSync('src/lib/persistence/house.ts', 'utf8');
		const adopt = house.slice(house.indexOf('export function adoptImport('), house.indexOf('const nextDishes'));
		expect(adopt).toContain('mergeMaitre(');
	});

	it('mergeSessions: the edit wins the dish and the kept lines survive it, either way round', () => {
		const forward = mergeSessions({ ...structuredClone(EMPTY_SESSION), menuDishes: [marked()] }, { menuDishes: [edited()] });
		const back = mergeSessions({ ...structuredClone(EMPTY_SESSION), menuDishes: [edited()] }, { menuDishes: [marked()] });
		for (const out of [forward, back]) {
			const d = out.menuDishes[0];
			expect(d.description).toBe('Crawfish, dark roux, rice, green onion.');
			expect(d.maitre?.why?.by).toBe('person');
			expect(d.maitre?.guest?.value).toContain('crawfish stew');
			expect(d.maitre?.kept).toEqual([{ q: 'Where is the crawfish from?', a: 'The menu does not say.', ts: 85 }]);
		}
	});

	it('adoptImport: the same, on the live house path', () => {
		const mine: HouseRecord = { ...structuredClone(EMPTY_HOUSE), dishes: [marked()] };
		const out = adoptImport(mine, [edited()], {}, {});
		expect(out.dishes[0].description).toBe('Crawfish, dark roux, rice, green onion.');
		expect(out.dishes[0].maitre?.why?.by).toBe('person');
		expect(out.dishes[0].maitre?.kept).toHaveLength(1);
		const theirs: HouseRecord = { ...structuredClone(EMPTY_HOUSE), dishes: [edited()] };
		expect(adoptImport(theirs, [marked()], {}, {}).dishes[0].maitre).toEqual(out.dishes[0].maitre);
	});

	it('kept unions on ts|q: a second device adds its answers and never doubles mine', () => {
		const theirs: MenuDish = {
			...base(),
			maitre: {
				kept: [
					{ q: 'Where is the crawfish from?', a: 'The menu does not say.', ts: 85 },
					{ q: 'Where is the crawfish from?', a: 'Asked again, later.', ts: 300 },
					{ q: 'What is the roux?', a: 'Flour and fat, cooked dark.', ts: 120 }
				]
			}
		};
		const out = mergeSessions({ ...structuredClone(EMPTY_SESSION), menuDishes: [marked()] }, { menuDishes: [theirs] });
		expect(out.menuDishes[0].maitre?.kept?.map((n) => n.ts)).toEqual([85, 120, 300]);
		// and re-importing your own export adds nothing
		const again = mergeSessions(out, { menuDishes: [out.menuDishes[0]] });
		expect(again.menuDishes[0].maitre).toEqual(out.menuDishes[0].maitre);
	});

	it('a kept mark beats her newer unkept one, so a re-run by file cannot undo a Keep', () => {
		const rerun: MenuDish = { ...base(), ts: 200, maitre: { why: mark('Her newer line.', 'maitre', 500) } };
		const out = adoptImport({ ...structuredClone(EMPTY_HOUSE), dishes: [marked()] }, [rerun], {}, {});
		expect(out.dishes[0].maitre?.why).toEqual(mark('The roux is taken to the colour of a penny.', 'person', 90));
		// between two of hers, the newer stamp wins; between two kept, likewise
		const older: MenuDish = { ...base(), maitre: { guest: mark('Older.', 'maitre', 10) } };
		const newer: MenuDish = { ...base(), maitre: { guest: mark('Newer.', 'maitre', 20) } };
		expect(adoptImport({ ...structuredClone(EMPTY_HOUSE), dishes: [older] }, [newer], {}, {}).dishes[0].maitre?.guest?.value).toBe('Newer.');
		expect(adoptImport({ ...structuredClone(EMPTY_HOUSE), dishes: [newer] }, [older], {}, {}).dishes[0].maitre?.guest?.value).toBe('Newer.');
	});

	it('a dish that never had a block is untouched: no key is minted on it', () => {
		const out = mergeSessions({ ...structuredClone(EMPTY_SESSION), menuDishes: [base()] }, { menuDishes: [edited()] });
		expect('maitre' in out.menuDishes[0]).toBe(false);
		const house = adoptImport({ ...structuredClone(EMPTY_HOUSE), dishes: [base()] }, [edited()], {}, {});
		expect('maitre' in house.dishes[0]).toBe(false);
	});
});
