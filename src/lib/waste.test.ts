import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	entryValue,
	rollUpWaste,
	mergeWaste,
	wasteHeadline,
	type WasteEntry
} from './waste';
import waste from './data/waste.json';

/**
 * The waste log.
 *
 * The guide asks for it by name — "waste logs (what died in the walk-in, and
 * why — over-prepping is the most common villain)" — and supplies the taxonomy.
 * The reason codes are gated against that prose in tools/derive/waste.mjs; what
 * is tested here is the arithmetic and the two refusals: no person, ever, and
 * no total that quietly skips what it could not price.
 */

const T = 1_700_000_000_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const e = (over: Partial<WasteEntry> = {}): WasteEntry => ({
	id: 'w-1',
	at: T,
	label: 'Demi-glace',
	qty: 1,
	reason: 'overprep',
	unitValue: 3,
	...over
});

describe('what one bin was worth', () => {
	it('multiplies the snapshot by the quantity', () => {
		expect(entryValue(e({ qty: 4, unitValue: 3.1 }))).toBeCloseTo(12.4, 6);
	});

	/** A bin nobody could price is not a bin that cost nothing. */
	it('stays null when it was never costable', () => {
		expect(entryValue(e({ unitValue: null }))).toBeNull();
		expect(entryValue(e({ unitValue: Number.NaN }))).toBeNull();
		expect(entryValue(e({ qty: Number.NaN }))).toBeNull();
	});
});

describe('the week, rolled up', () => {
	const week: WasteEntry[] = [
		e({ id: 'a', at: T + HOUR, reason: 'overprep', qty: 4, unitValue: 3 }), // 12
		e({ id: 'b', at: T + 2 * HOUR, reason: 'spoiled', qty: 2, unitValue: 4 }), // 8
		e({ id: 'c', at: T + 3 * HOUR, reason: 'overprep', qty: 1, unitValue: 6 }), // 6
		e({ id: 'd', at: T + 4 * HOUR, reason: 'comped', qty: 1, unitValue: 2 }) // 2
	];

	it('totals the window and ranks the reasons by money', () => {
		const r = rollUpWaste(week, T, T + DAY);
		expect(r.entries).toBe(4);
		expect(r.total).toBeCloseTo(28, 6);
		expect(r.byReason.map((x) => x.reason)).toEqual(['overprep', 'spoiled', 'comped']);
		expect(r.byReason[0].money).toBeCloseTo(18, 6);
		expect(r.byReason[0].count).toBe(2);
		expect(r.byReason[0].pct).toBeCloseTo((18 / 28) * 100, 6);
		expect(r.top?.reason).toBe('overprep');
	});

	/** Half-open, so two consecutive weeks cannot both claim a midnight entry. */
	it('takes [from, to) and nothing outside it', () => {
		const edge = [e({ id: 'x', at: T }), e({ id: 'y', at: T + DAY })];
		expect(rollUpWaste(edge, T, T + DAY).entries).toBe(1);
		expect(rollUpWaste(edge, T + DAY, T + 2 * DAY).entries).toBe(1);
	});

	/**
	 * A total that silently skips four unpriced bins reads as authority and is
	 * wrong in the direction that makes the kitchen look tidier than it is.
	 */
	it('counts what it could not price instead of absorbing it', () => {
		const r = rollUpWaste([...week, e({ id: 'z', unitValue: null, reason: 'spilled' })], T, T + DAY);
		expect(r.unvalued).toBe(1);
		expect(r.entries).toBe(5);
		expect(r.total).toBeCloseTo(28, 6);
	});

	/** "Where is the money going" must not be answered by a row with no money. */
	it('never calls an unpriced reason the biggest line', () => {
		const r = rollUpWaste(
			[e({ id: 'p', reason: 'spilled', unitValue: null }), e({ id: 'q', reason: 'spoiled', unitValue: 1 })],
			T,
			T + DAY
		);
		expect(r.byReason[0].reason).toBe('spoiled');
		expect(r.top?.reason).toBe('spoiled');
	});

	it('is empty rather than wrong when the window holds nothing', () => {
		const r = rollUpWaste(week, T + 30 * DAY, T + 37 * DAY);
		expect(r).toMatchObject({ entries: 0, total: 0, unvalued: 0, top: null, shareOfCogsPct: null });
	});

	/**
	 * The guide's own framing: variance is measured against theoretical COGS.
	 * Null without one, because an unqualified "waste is 6%" is the most
	 * quotable wrong number this page could produce.
	 */
	it('reports the share of what was actually cooked, only when told', () => {
		expect(rollUpWaste(week, T, T + DAY).shareOfCogsPct).toBeNull();
		expect(rollUpWaste(week, T, T + DAY, 0).shareOfCogsPct).toBeNull();
		expect(rollUpWaste(week, T, T + DAY, 400).shareOfCogsPct).toBeCloseTo(7, 6);
	});

	it('drops a malformed entry rather than carrying it into the arithmetic', () => {
		const junk = [...week, { id: 'bad', at: 'yesterday' } as never];
		expect(rollUpWaste(junk, T, T + DAY).entries).toBe(4);
	});
});

describe('merging two logs', () => {
	const mine = [e({ id: 'a', at: T }), e({ id: 'b', at: T + HOUR })];
	const theirs = [e({ id: 'c', at: T + 2 * HOUR }), e({ id: 'b', at: T + HOUR })];

	it('unions by id and loses no bin', () => {
		expect(mergeWaste(mine, theirs).map((x) => x.id)).toEqual(['c', 'b', 'a']);
	});

	it('is order-independent, so re-importing your own export is a no-op', () => {
		expect(mergeWaste(mine, theirs)).toEqual(mergeWaste(theirs, mine));
		expect(mergeWaste(mine, mine)).toEqual(mergeWaste(mine, []));
	});

	/**
	 * Not capped, unlike the item book. An old price is dead weight; old waste
	 * is the trend, and "last October we binned half this" is the question the
	 * log exists to answer.
	 */
	it('keeps a log that is two years old', () => {
		const old = Array.from({ length: 900 }, (_, i) => e({ id: 'o' + i, at: T - i * DAY }));
		expect(mergeWaste(old, [e({ id: 'new', at: T + DAY })])).toHaveLength(901);
	});
});

describe('the sentence the log exists to say', () => {
	const labelOf = (k: string) =>
		waste.reasons.find((r) => r.key === k)?.label ?? k;

	it('agrees with the guide when the venue agrees with it', () => {
		const r = rollUpWaste([e({ id: 'a', reason: 'overprep', qty: 4, unitValue: 3 })], T, T + DAY);
		expect(wasteHeadline(r, waste.villain, labelOf)).toBe(
			"Over-prepped is 100% of what you threw away — the guide's most common villain, and yours."
		);
	});

	it('contradicts it when the venue contradicts it', () => {
		const r = rollUpWaste(
			[
				e({ id: 'a', reason: 'spoiled', qty: 10, unitValue: 4 }),
				e({ id: 'b', reason: 'overprep', qty: 1, unitValue: 3 })
			],
			T,
			T + DAY
		);
		const out = wasteHeadline(r, waste.villain, labelOf);
		expect(out).toContain('Spoiled is your biggest line at 93%');
		expect(out).toContain('Over-prepped');
	});

	it('says nothing rather than something empty', () => {
		expect(wasteHeadline(rollUpWaste([], T, T + DAY), waste.villain, labelOf)).toBeNull();
		const unpriced = rollUpWaste([e({ id: 'a', unitValue: null })], T, T + DAY);
		expect(wasteHeadline(unpriced, waste.villain, labelOf)).toBeNull();
	});
});

describe('the vocabulary is the guide\'s', () => {
	it('ships the five reason codes the derive step gated', () => {
		expect(waste.reasons.map((r) => r.key)).toEqual([
			'overprep',
			'spoiled',
			'overportion',
			'comped',
			'spilled'
		]);
	});

	it('refuses theft, vendor creep and pricing, with a reason on each', () => {
		// pricing joined when the reverse gate grew its second walk over Prime
		// Cost's decomposition — a menu problem, not a bin, and now said so.
		expect(waste.excluded.map((x) => x.key)).toEqual(['theft', 'vendor-creep', 'pricing']);
		for (const x of waste.excluded) expect(x.why.length).toBeGreaterThan(40);
	});

	it('names a villain that is one of the codes', () => {
		expect(waste.reasons.some((r) => r.key === waste.villain)).toBe(true);
	});
});

/**
 * THE REFUSAL, tested structurally rather than trusted to a comment.
 *
 * Waste-by-cook is a disciplinary instrument and the data goes dishonest within
 * a fortnight of the first conversation that begins "your name is on four of
 * these". A field that does not exist cannot be surfaced later by somebody who
 * did not read the header — so this reads the source and fails if one appears.
 */
describe('a waste entry names no person', () => {
	const src = readFileSync(resolve(__dirname, 'waste.ts'), 'utf8');
	const iface = src.slice(
		src.indexOf('export interface WasteEntry'),
		src.indexOf('/** What this entry cost the venue')
	);

	it('has an interface to check', () => {
		expect(iface.length).toBeGreaterThan(200);
		expect(iface).toContain('reason: string;');
	});

	it.each(['by', 'cook', 'loggedBy', 'staff', 'who', 'profileId', 'person', 'user', 'name'])(
		'carries no "%s" field',
		(field) => {
			expect(iface).not.toMatch(new RegExp('^\\s*' + field + '\\??\\s*:', 'im'));
		}
	);

	it('is not namespaced per profile anywhere', () => {
		const houseSrc = readFileSync(resolve(__dirname, 'persistence/house.ts'), 'utf8');
		// The log lives on the house record, which profiles.key() never namespaces.
		expect(houseSrc).toContain('waste: WasteEntry[];');
	});
});
