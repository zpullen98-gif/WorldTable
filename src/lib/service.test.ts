import { describe, it, expect } from 'vitest';
import { stepService, ADVANCE_MIN } from '../../tools/derive/service.mjs';
import full from './data/recipes.full.json';

/**
 * The service split, which had no test at all while three build checks watched
 * it and one of those could never fire.
 *
 * The defect: a 48-hour cure charged twenty hours of hands. isUnattended routes
 * a duration by nearest verb, and when the UNATTENDED list matches nothing in
 * the clause `before(waits)` returns Infinity, which is never less than a finite
 * number — so any incidental ACTIVE token wins. The verbs that govern a long
 * hold (hold, hang, leave, retard, drain) are in NEITHER list, so on the
 * flagship step the governing token was `layer`, out of "two layers of film".
 *
 * Fixed with a magnitude backstop rather than a vocabulary edit, because the
 * vocabulary edits were measured and were worse: adding `cook` to UNATTENDED
 * flips 192 durations whose median is five minutes, most of them correctly
 * attended ("cook 2 min to a blond roux"), and splitting clauses on commas
 * decapitates "Bake 170C, 40-45 min".
 */
const min = (sec: number) => sec / 60;

describe('the magnitude backstop', () => {
	it('books a 48-hour cure as a wait, not as twenty hours of hands', () => {
		const r = stepService(
			'Seal in a vacuum bag, or wrap tight in two layers of film in a tray, and hold at 4C (39F) for 48 hours, turning the parcel every 12 hours.'
		);
		// Was handsOnSec 72000 (20 h) and unattendedSec 0.
		expect(min(r.handsOnSec)).toBe(8);
		expect(min(r.unattendedSec)).toBe(600);
		expect(r.estimated).toBe(true);
	});

	/**
	 * The regression guards, and the reason the line is a magnitude and not a
	 * word list. A dark roux is the canonical cannot-walk-away task; an earlier
	 * candidate fix booked it as a wait.
	 */
	it('does not reach down: short attended work stays hands-on', () => {
		const roux = stepService(
			'Make a dark roux: whisk oil and flour over medium 30-45 min to milk-chocolate brown'
		);
		expect(min(roux.handsOnSec)).toBeGreaterThanOrEqual(45);
		expect(min(roux.unattendedSec)).toBe(0);

		const taffy = stepService(
			'Pull the taffy with buttered hands, stretching and folding, for 15-20 min'
		);
		expect(min(taffy.handsOnSec)).toBe(20);
		expect(min(taffy.unattendedSec)).toBe(0);
	});

	it('draws the line at ADVANCE_MIN, the module’s own "cannot fit in a service"', () => {
		expect(ADVANCE_MIN).toBe(240);
		// 239 obeys the nearest-verb rule; 240 is a wait whatever governs it.
		const under = stepService('Knead and press the dough by hand for 239 min');
		const over = stepService('Knead and press the dough by hand for 240 min');
		expect(min(under.handsOnSec)).toBeGreaterThan(0);
		expect(min(over.unattendedSec)).toBe(240);
	});
});

describe('a recurrence is not a block of time', () => {
	it('charges the repeated act, not the interval', () => {
		// Shipped 0 hands and 45 min of wait: mopping ribs cost the cook nothing.
		const r = stepService('Mop lightly every 45 min after the second hour');
		expect(min(r.handsOnSec)).toBeGreaterThan(0);
		expect(min(r.unattendedSec)).toBe(0);
	});

	it('reads "at N minute intervals" the same way', () => {
		const r = stepService('Fold it in the bowl four times at 30 minute intervals');
		expect(min(r.handsOnSec)).toBeLessThan(30);
	});

	/** `each` is distributive here, never a recurrence: 59 sites, 0 durations. */
	it('does not treat "each" as a recurrence', () => {
		const r = stepService('Add the butter in pieces, whisking each addition, 4 min');
		expect(min(r.handsOnSec)).toBeGreaterThanOrEqual(4);
	});
});

describe('one range written long is one duration', () => {
	it('sums a spelled range once, not twice', () => {
		// "6 hours to 7 hours" matched twice and booked 13 hours.
		const r = stepService('cook with the lid ajar for 6 hours to 7 hours');
		expect(min(r.unattendedSec)).toBe(420);
	});

	it('carries back over a compound low end', () => {
		const r = stepService('Set the pot on the coals for 1 hour 30 minutes to 2 hours 30 minutes');
		expect(min(r.unattendedSec)).toBe(150);
	});

	it('leaves a low end with no unit alone', () => {
		// "8 to 12 hours" is one match already; nothing to merge.
		const r = stepService('hold there 8 to 12 hours');
		expect(min(r.unattendedSec)).toBe(600);
	});
});

/**
 * The same predicates as the build gates in tools/build-data.mjs, deliberately:
 * the gate fails the build, these fail the PR. Before the fix the first was 43
 * and the second 19.
 */
describe('the shipped corpus', () => {
	const recipes = full as unknown as Array<{
		slug: string;
		steps?: Array<{ handsOnSec?: number; unattendedSec?: number }>;
	}>;

	it('has no step booking a block of hands too long to fit in a service', () => {
		const bad = recipes.flatMap((r) =>
			(r.steps ?? [])
				.map((s, i) => ({ slug: r.slug, i: i + 1, m: min(s.handsOnSec ?? 0) }))
				.filter((s) => s.m >= ADVANCE_MIN)
		);
		expect(bad.map((b) => `${b.slug} #${b.i} (${b.m} min)`)).toEqual([]);
	});

	it('has no recipe above the 600-minute ceiling an authored t must obey', () => {
		const bad = recipes
			.map((r) => ({
				slug: r.slug,
				m: (r.steps ?? []).reduce((a, s) => a + min(s.handsOnSec ?? 0), 0)
			}))
			.filter((r) => r.m > 600);
		expect(bad.map((b) => `${b.slug} (${b.m} min)`)).toEqual([]);
	});

	it('has no long recipe with zero unattended time, which no method has', () => {
		const bad = recipes
			.map((r) => {
				const h = (r.steps ?? []).reduce((a, s) => a + min(s.handsOnSec ?? 0), 0);
				const w = (r.steps ?? []).reduce((a, s) => a + min(s.unattendedSec ?? 0), 0);
				return { slug: r.slug, h, w };
			})
			.filter((r) => r.w === 0 && r.h + r.w >= ADVANCE_MIN);
		expect(bad.map((b) => b.slug)).toEqual([]);
	});
});
