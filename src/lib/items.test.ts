import { describe, it, expect } from 'vitest';
import {
	itemSlugOf,
	recordPrice,
	currentPrice,
	previousPrice,
	priceMovePct,
	mergeItems,
	pricedItems,
	itemNames,
	itemUsage,
	HISTORY_CAP,
	CORRECTION_WINDOW_MS,
	type Item
} from './items';
import { resolveLines, plateCost, prepPortionCost, type CostLine } from './costing';

/**
 * The item book.
 *
 * `unitCost` was stored per line per dish and patched in place, so the previous
 * price did not exist anywhere — which made the guide's own instruction to
 * "reprice quarterly against invoice creep" structurally impossible to follow.
 */

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;

const book = (...prices: Array<[number, number]>): Record<string, Item> => ({
	butter: {
		slug: 'butter',
		name: 'Butter',
		history: prices.map(([unitCost, at]) => ({ unitCost, unit: 'kg', at }))
	}
});

describe('the key an item is filed under', () => {
	it('folds case and collapses inner whitespace', () => {
		expect(itemSlugOf('  Unsalted   Butter ')).toBe('unsalted butter');
		expect(itemSlugOf('BUTTER')).toBe(itemSlugOf('butter'));
	});

	/**
	 * Deliberate. A normaliser clever enough to fold accents is clever enough to
	 * fold "cream" into "creams", and the venue cannot see it happen or undo it.
	 */
	it('does not fold accents or punctuation', () => {
		expect(itemSlugOf('crème fraîche')).not.toBe(itemSlugOf('creme fraiche'));
		expect(itemSlugOf('Butter, unsalted')).not.toBe(itemSlugOf('Butter unsalted'));
	});

	it('is empty for a blank name, and a blank name files nothing', () => {
		expect(itemSlugOf('   ')).toBe('');
		expect(recordPrice({}, '   ', 7.9, 'kg', T0)).toEqual({});
	});
});

describe('filing a price', () => {
	it('mints an item on the first price', () => {
		const out = recordPrice({}, 'Butter', 6.4, 'kg', T0);
		expect(out.butter.name).toBe('Butter');
		expect(currentPrice(out.butter)?.unitCost).toBe(6.4);
		expect(previousPrice(out.butter)).toBeNull();
	});

	it('keeps the movement, newest first', () => {
		let out = recordPrice({}, 'Butter', 6.4, 'kg', T0);
		out = recordPrice(out, 'Butter', 7.9, 'kg', T0 + 90 * DAY);
		expect(out.butter.history).toHaveLength(2);
		expect(currentPrice(out.butter)?.unitCost).toBe(7.9);
		expect(previousPrice(out.butter)?.unitCost).toBe(6.4);
		expect(priceMovePct(out.butter)).toBeCloseTo(23.4375, 4);
	});

	/** A row saying "still 7.90" on every edit of the quantity buries the two
	 *  rows that matter under fifty that do not. */
	it('files nothing when the price has not moved', () => {
		const one = recordPrice({}, 'Butter', 7.9, 'kg', T0);
		const two = recordPrice(one, 'Butter', 7.9, 'kg', T0 + 90 * DAY);
		expect(two).toBe(one);
		expect(two.butter.history).toHaveLength(1);
	});

	it('takes a corrected spelling without inventing a price change', () => {
		const one = recordPrice({}, 'butter', 7.9, 'kg', T0);
		const two = recordPrice(one, 'Butter', 7.9, 'kg', T0 + 1000);
		expect(two.butter.name).toBe('Butter');
		expect(two.butter.history).toHaveLength(1);
	});

	/**
	 * Typing 18.00, seeing it is wrong and typing 18.50 is ONE price entered
	 * twice. Two rows would show it as a 2.8% rise.
	 */
	it('treats a fast retype as a correction, not a movement', () => {
		let out = recordPrice({}, 'Beef cheek', 18, 'kg', T0);
		out = recordPrice(out, 'Beef cheek', 18.5, 'kg', T0 + 20_000);
		expect(out['beef cheek'].history).toHaveLength(1);
		expect(currentPrice(out['beef cheek'])?.unitCost).toBe(18.5);
		expect(previousPrice(out['beef cheek'])).toBeNull();
	});

	it('treats a price past the window as a real movement', () => {
		let out = recordPrice({}, 'Beef cheek', 18, 'kg', T0);
		out = recordPrice(out, 'Beef cheek', 18.5, 'kg', T0 + CORRECTION_WINDOW_MS + 1);
		expect(out['beef cheek'].history).toHaveLength(2);
		expect(previousPrice(out['beef cheek'])?.unitCost).toBe(18);
	});

	it('refuses a blank, negative or impossible cost', () => {
		expect(recordPrice({}, 'Butter', Number.NaN, 'kg', T0)).toEqual({});
		expect(recordPrice({}, 'Butter', -1, 'kg', T0)).toEqual({});
		expect(recordPrice({}, 'Butter', Number.POSITIVE_INFINITY, 'kg', T0)).toEqual({});
	});

	/**
	 * addLine() mints a row at unitCost 0, so without this the instant somebody
	 * types a name into a fresh row the book records that the thing is free —
	 * and every dish that follows the book then prices it at nothing.
	 */
	it('refuses zero, because that is what an untyped row holds', () => {
		expect(recordPrice({}, 'Butter', 0, 'kg', T0)).toEqual({});
	});

	it('caps the history and discards the oldest', () => {
		let out: Record<string, Item> = {};
		for (let i = 0; i < HISTORY_CAP + 6; i++) {
			out = recordPrice(out, 'Butter', 5 + i, 'kg', T0 + i * DAY);
		}
		expect(out.butter.history).toHaveLength(HISTORY_CAP);
		expect(currentPrice(out.butter)?.unitCost).toBe(5 + HISTORY_CAP + 5);
		// The six oldest are gone, not the six newest.
		expect(Math.min(...out.butter.history.map((p) => p.unitCost))).toBe(11);
	});

	/** Re-typing January's figure in March is not "previous: 7.90, now: 7.90". */
	it('looks past a repeat to find the real previous price', () => {
		const b = book([7.9, T0 + 2 * DAY], [6.4, T0 + DAY], [7.9, T0]);
		expect(currentPrice(b.butter)?.unitCost).toBe(7.9);
		expect(previousPrice(b.butter)?.unitCost).toBe(6.4);
	});
});

describe('merging two books — the part that matters', () => {
	/**
	 * Newer-wins-whole is the obvious rule and it destroys the only thing the
	 * book exists to keep: the losing device's copy holds every price change IT
	 * recorded, and those are observations the winner never made.
	 */
	it('keeps a price change only the other device recorded', () => {
		const mine = book([7.9, T0 + 2 * DAY], [6.4, T0]);
		const theirs = book([8.5, T0 + 3 * DAY], [7.2, T0 + DAY]);
		const out = mergeItems(mine, theirs);
		expect(out.butter.history.map((p) => p.unitCost)).toEqual([8.5, 7.9, 7.2, 6.4]);
	});

	it('is order-independent, so re-importing your own export is a no-op', () => {
		const mine = book([7.9, T0 + 2 * DAY], [6.4, T0]);
		const theirs = book([8.5, T0 + 3 * DAY], [7.2, T0 + DAY]);
		expect(mergeItems(mine, theirs)).toEqual(mergeItems(theirs, mine));
		expect(mergeItems(mine, mine)).toEqual(mine);
	});

	it('collapses an observation both devices already had', () => {
		const mine = book([7.9, T0], [6.4, T0 - DAY]);
		expect(mergeItems(mine, book([7.9, T0])).butter.history).toHaveLength(2);
	});

	/**
	 * Union on the WHOLE observation, not on `at` alone. Two devices that
	 * stamped different prices in the same millisecond is the one case where
	 * keying on the timestamp silently drops a price — the exact failure the
	 * union exists to prevent.
	 */
	it('keeps both when two devices stamped different prices at the same instant', () => {
		const out = mergeItems(book([7.9, T0]), book([8.4, T0]));
		expect(out.butter.history).toHaveLength(2);
		expect(out.butter.history.map((p) => p.unitCost)).toEqual([8.4, 7.9]);
	});

	it('takes an item the other device has and this one does not', () => {
		const out = mergeItems({}, book([7.9, T0]));
		expect(out.butter.history).toHaveLength(1);
	});

	it('applies the cap after the union, keeping the newest', () => {
		const mk = (offset: number) =>
			({
				butter: {
					slug: 'butter',
					name: 'Butter',
					history: Array.from({ length: HISTORY_CAP }, (_, i) => ({
						unitCost: 5 + i + offset,
						unit: 'kg',
						at: T0 + (i * 2 + offset) * DAY
					}))
				}
			}) as Record<string, Item>;
		const out = mergeItems(mk(0), mk(1));
		expect(out.butter.history).toHaveLength(HISTORY_CAP);
		expect(out.butter.history[0].at).toBeGreaterThan(out.butter.history[HISTORY_CAP - 1].at);
	});

	it('takes the spelling attached to the newest observation', () => {
		const mine: Record<string, Item> = {
			butter: { slug: 'butter', name: 'butter', history: [{ unitCost: 6.4, unit: 'kg', at: T0 }] }
		};
		const theirs: Record<string, Item> = {
			butter: {
				slug: 'butter',
				name: 'Unsalted butter',
				history: [{ unitCost: 7.9, unit: 'kg', at: T0 + DAY }]
			}
		};
		expect(mergeItems(mine, theirs).butter.name).toBe('Unsalted butter');
		expect(mergeItems(theirs, mine).butter.name).toBe('Unsalted butter');
	});

	it('discards a malformed price rather than carrying it into the arithmetic', () => {
		const junk = {
			butter: {
				slug: 'butter',
				name: 'Butter',
				history: [{ unitCost: 'lots', unit: 'kg', at: T0 } as never, { unitCost: 7.9, unit: 'kg', at: T0 }]
			}
		} as Record<string, Item>;
		expect(mergeItems({}, junk).butter.history).toHaveLength(1);
	});
});

describe('a line that takes its price from the book', () => {
	const items = pricedItems(book([7.9, T0 + DAY], [6.4, T0]));
	const line = (over: Partial<CostLine> = {}): CostLine => ({
		id: 'l1',
		item: 'Butter',
		unitCost: 0,
		unit: 'kg',
		usedQty: 0.05,
		yieldPct: 100,
		...over
	});

	it('prices from the book, not from the stored number', () => {
		const { lines, complete } = resolveLines([line({ itemSlug: 'butter', unitCost: 999 })], [], items);
		expect(complete).toBe(true);
		expect(lines[0].unitCost).toBe(7.9);
		expect(plateCost(lines).total).toBeCloseTo(0.395, 6);
	});

	/**
	 * THE ASYMMETRY AGAINST PREPS, and it is deliberate. A prep is locked to 100
	 * because its trim already happened inside it. An item price is an INVOICE
	 * price for a raw purchase — the fish still has its frame on — so the dish's
	 * own yield is the only thing accounting for the bin. Clearing it here would
	 * price the menu off gross weight, which the guide calls the classic rookie
	 * bankruptcy.
	 */
	it('leaves the dish yield alone, unlike a prep', () => {
		const { lines } = resolveLines(
			[line({ itemSlug: 'butter', yieldPct: 80, usedQty: 1 })],
			[],
			items
		);
		expect(lines[0].yieldPct).toBe(80);
		expect(plateCost(lines).total).toBeCloseTo(7.9 / 0.8, 6);
	});

	it('refuses a line whose item the book no longer holds', () => {
		const { lines, complete } = resolveLines([line({ itemSlug: 'saffron' })], [], items);
		expect(complete).toBe(false);
		expect(plateCost(lines).complete).toBe(false);
	});

	it('leaves an unlinked line entirely alone', () => {
		const { lines, complete } = resolveLines([line({ unitCost: 6 })], [], items);
		expect(complete).toBe(true);
		expect(lines[0].unitCost).toBe(6);
	});

	/** Butter in the demi is the case the book most needs to reach. */
	it('reaches an item inside a prep', () => {
		const demi = {
			id: 'p-demi',
			portions: 10,
			lines: [line({ id: 'a', itemSlug: 'butter', usedQty: 1, unitCost: 0 })]
		};
		expect(prepPortionCost(demi, items)).toEqual({ perPortion: 0.79, complete: true });
	});

	it('makes a prep incomplete when the book has lost its item', () => {
		const demi = { id: 'p-demi', portions: 10, lines: [line({ id: 'a', itemSlug: 'gone' })] };
		expect(prepPortionCost(demi, items).complete).toBe(false);
	});
});

describe('the sentence the book exists to say', () => {
	const items = { ...book([7.9, T0 + DAY], [6.4, T0]) };
	const l = (item: string, over: Partial<CostLine> = {}): CostLine => ({
		id: 'l-' + item,
		item,
		unitCost: 1,
		unit: 'kg',
		usedQty: 1,
		yieldPct: 100,
		...over
	});

	const demi = { id: 'p-demi', lines: [l('Butter'), l('Veal bones')] };

	it('counts dishes that name the item without being linked to it', () => {
		const usage = itemUsage(
			items,
			[
				{ id: 'd1', lines: [l('Butter')], verdict: 'on' },
				{ id: 'd2', lines: [l('butter ')], verdict: 'on' },
				{ id: 'd3', lines: [l('Saffron')], verdict: 'on' }
			],
			[]
		);
		expect(usage[0].dishIds.sort()).toEqual(['d1', 'd2']);
	});

	it('follows a prep to the item inside it', () => {
		const usage = itemUsage(
			items,
			[
				{ id: 'd1', lines: [l('Demi', { prepId: 'p-demi' })], verdict: 'on' },
				{ id: 'd2', lines: [l('Demi', { prepId: 'p-demi' })], verdict: 'over' }
			],
			[demi]
		);
		expect(usage[0].dishIds.sort()).toEqual(['d1', 'd2']);
		expect(usage[0].outOfBandIds).toEqual(['d2']);
	});

	/**
	 * Measured on screen: counting 'under' made a brand-new book announce that a
	 * dish had "moved out of the band" when its sheet simply had one line on it.
	 * Every dish is under the band before it is costed.
	 */
	it('counts only the dishes above the band, never under and never unpriced', () => {
		const usage = itemUsage(
			items,
			[
				{ id: 'd1', lines: [l('Butter')], verdict: 'over' },
				{ id: 'd2', lines: [l('Butter')], verdict: 'under' },
				{ id: 'd3', lines: [l('Butter')], verdict: 'on' },
				{ id: 'd4', lines: [l('Butter')], verdict: 'unknown' }
			],
			[]
		);
		expect(usage[0].dishIds).toHaveLength(4);
		expect(usage[0].outOfBandIds).toEqual(['d1']);
	});

	it('carries the movement that makes the row worth reading', () => {
		const usage = itemUsage(items, [{ id: 'd1', lines: [l('Butter')], verdict: 'over' }], []);
		expect(usage[0].current?.unitCost).toBe(7.9);
		expect(usage[0].previous?.unitCost).toBe(6.4);
		expect(usage[0].movePct).toBeCloseTo(23.4375, 4);
	});

	it('ranks by how many dishes a price move would reach', () => {
		const two = { ...items, saffron: { slug: 'saffron', name: 'Saffron', history: [] } };
		const usage = itemUsage(
			two,
			[
				{ id: 'd1', lines: [l('Butter'), l('Saffron')], verdict: 'on' },
				{ id: 'd2', lines: [l('Butter')], verdict: 'on' }
			],
			[]
		);
		expect(usage.map((u) => u.name)).toEqual(['Butter', 'Saffron']);
	});
});

describe('the datalist', () => {
	it('offers every name the venue has typed, alphabetically', () => {
		let b = recordPrice({}, 'Veal bones', 12, 'kg', T0);
		b = recordPrice(b, 'Butter', 7.9, 'kg', T0);
		b = recordPrice(b, 'anchovy', 30, 'kg', T0);
		expect(itemNames(b)).toEqual(['anchovy', 'Butter', 'Veal bones']);
	});

	it('leaves an item with no usable price out of the priced view', () => {
		const b: Record<string, Item> = { salt: { slug: 'salt', name: 'Salt', history: [] } };
		expect(pricedItems(b)).toEqual({});
	});
});
